// Puzzle.js v3.6.0
import { Config } from './Config.js';
import { Board, type BoardChildOption, type BoardOption, type IGroup } from './Board';
import { AnsCheck, type AnsCheckOption } from './Answer';
import { createFailCode } from './FailCode.js';
import { OperationManager } from './Operation';
import { MouseEvent1, type MouseEventOption } from './MouseInput';
import { KeyEvent, type KeyEventOption, TargetCursor } from './KeyInput';
import { Graphic, type GraphicOption } from './Graphic';
import { decodeURL, encodeURL, type Converter } from './Encode.js';
import { FileEncodeOption, FileIO, type FileIOOption } from './FileData.js';
import * as MetaData from '../pzpr/metadata.js';
import type { Cell, Cross, Border, EXCell } from "./Piece"
import { Encode, type EncodeOption } from './Encode2';
import Candle from '../candle/';

import type { CandleWrapper, WrapperBase } from '../candle/';
import { getRect, currentTime, addEvent, unselectable } from '../pzpr/util.js';
import type { VarietyAnyOption, VarityOption } from '../variety/createVariety.js';
import { URL_PZPRV3 } from '../pzpr/constants.js';

type Handler = (puzzle: Puzzle, ...args: any[]) => void;
export type IConfig = {
	pid?: string
	type?: "player" | "editor" | "viewer"
	width?: number
	height?: number
	cellsize?: number
	graphic?: string,
	mode?: IGroup,
	config?: any
}

const MODE_EDITOR = 1
const MODE_PLAYER = 3

//---------------------------------------------------------------------------
// ★Puzzleクラス
// ぱずぷれv3のベース処理やその他の処理を行う
//---------------------------------------------------------------------------
export abstract class Puzzle<
	TBoard extends Board = Board
> {
	preInitCanvasInfo: {
		type: string
		width: number | null
		height: number | null
		cellsize: number | null
	}
	board: TBoard
	checker: AnsCheck<TBoard>
	painter: Graphic
	cursor: TargetCursor<TBoard>
	mouse: MouseEvent1
	key: KeyEvent
	opemgr: OperationManager
	fio: FileIO
	encode: Encode | null
	faillist: Map<string, [string, string]>
	converters: Converter[] | null


	constructor(option?: IConfig, varietyOption?: VarietyAnyOption) {

		option = option || {};

		this.pid = option?.pid ?? ""
		this.instancetype = option.type || 'editor';
		const modeid = { editor: 0, player: 1, viewer: 2 }[this.instancetype];
		this.playeronly = !!modeid;			// 回答モードのみで動作する
		this.editmode = !this.playeronly;	// 問題配置モード
		this.playmode = !this.editmode;		// 回答モード

		this.resetTime();

		this.preInitCanvasInfo = {
			type: option.graphic || '',
			width: option.width || null,
			height: option.height || null,
			cellsize: option.cellsize || null
		};

		this.listeners = {};

		this.metadata = MetaData.createEmtpyMetaData();

		this.config = new Config(this);

		if (Array.isArray(varietyOption?.Encode) || varietyOption?.Encode === undefined) {
			this.converters = []
			this.initConverters()
			this.converters.push(...(varietyOption?.Encode ?? []))
			this.encode = null
		} else {
			this.converters = null
			this.encode = this.createEncode(varietyOption?.Encode)
		}

		//if (!!canvas) { this.setCanvas(canvas); }

		// クラス初期化
		this.board = this.createBoard({
			board: varietyOption?.Board,
			boardExec: varietyOption?.BoardExec,
			areaRoomGraph: varietyOption?.AreaRoomGraph,
			areaShadeGraph: varietyOption?.AreaShadeGraph,
			areaUnshadeGraph: varietyOption?.AreaUnshadeGraph,
			areaNumberGraph: varietyOption?.AreaNumberGraph,
			graphComponent: varietyOption?.GraphComponent,
			lineGraph: varietyOption?.LineGraph,
			cell: varietyOption?.Cell,
			cross: varietyOption?.Cross,
			border: varietyOption?.Border,
			excell: varietyOption?.EXCell
		});		// 盤面オブジェクト

		this.checker = this.createAnsCheck(varietyOption?.AnsCheck);	// 正解判定オブジェクト
		this.painter = this.createGraphic(varietyOption?.Graphic);		// 描画系オブジェクト

		this.cursor = this.createTargetCursor(varietyOption?.TargetCursor);	// 入力用カーソルオブジェクト
		this.mouse = this.createMouseEvent(varietyOption?.MouseEvent);	// マウス入力オブジェクト
		this.key = this.createKeyEvent(varietyOption?.KeyEvent);		// キーボード入力オブジェクト
		this.fio = this.createFileIO(varietyOption?.FileIO)

		this.opemgr = new OperationManager(this);	// 操作情報管理オブジェクト

		this.faillist = this.createFailCode(varietyOption?.FailCode);	// 正答判定文字列を保持するオブジェクト

		if (option?.config !== void 0) { this.config.setAll(option.config); }
		if (option?.mode !== void 0) { this.setMode(option.mode); }

		this.ready = true
		this.emit("ready")
	}

	mount(parent: HTMLElement) {
		this.clear()
		this.setCanvas(parent);

		this.canvas.addEventListener('keydown', (e: KeyboardEvent) => {
			this.key.e_keydown(e);
		});
		this.canvas.addEventListener('keyup', (e: KeyboardEvent) => {
			this.key.e_keyup(e);
		});
	}

	pid: string = null!		// パズルのID("creek"など)

	ready = false	// 盤面の準備ができたかを示す (Canvas準備完了前にtrueになる)
	editmode = false	// 問題配置モード
	playmode = false// 回答モード
	playeronly = false	// 回答モードのみで動作する
	instancetype: "editor" | "player" | "viewer"	// editpr/player/viewerのいずれか

	starttime = 0

	canvas: HTMLElement = null!	// 描画canvas本体
	subcanvas: HTMLElement = null!	// 補助canvas

	listeners: { [key: string]: { func: Handler, once: boolean }[] } = {}

	config: Config = null!

	metadata: MetaData.IMetaData	// 作者やコメントなどの情報

	// モード設定用定数


	/**
	 * キー入力イベントオブジェクトを生成
	 * @internal
	 */
	createKeyEvent(option: KeyEventOption | undefined) {
		return new KeyEvent(this, option)
	}

	/**
	 * マウス入力イベントオブジェクトを生成
	 * @internal
	 */
	createMouseEvent(option: MouseEventOption | undefined) {
		return new MouseEvent1(this, option)
	}

	/**
	 * 盤面オブジェクトを生成
	 * @internal
	 */
	createBoard(option: ({ board?: BoardOption } & BoardChildOption) | undefined) {
		return new Board(this, option) as TBoard
	}

	/**
	 * 描画系オブジェクトを生成
	 * @internal
	 */
	createGraphic(option: GraphicOption | undefined) {
		return new Graphic(this, option)
	}

	/**
	 * 正解判定オブジェクトを生成
	 * @internal
	 */
	createAnsCheck(option: object): AnsCheck<TBoard> {
		return new AnsCheck(this.board, option)
	}

	/**
	 * Encodeオブジェクトを生成
	 * @internal
	 */
	createEncode(option: object | undefined): Encode {
		return new Encode(this, option)
	}

	/**
	 * FailCodeのMapを生成
	 * @internal
	 */
	createFailCode(custom: Record<string, [string, string]> | undefined) {
		let map = createFailCode()

		if (custom) {
			for (const [key, item] of Object.entries(custom)) {
				map.set(key, item)
			}
		}

		const add = this.getAdditionalFailCode()
		if (add instanceof Map) {
			map = new Map([...map, ...add])
		} else {
			for (const [key, item] of Object.entries(add)) {
				map.set(key, item)
			}
		}
		return map
	}

	/**
	 * 追加分のFailCodeを返す
	 * @internal
	 */
	getAdditionalFailCode(): Map<string, [string, string]> | Record<string, [string, string]> {
		return {}
	}

	/**
	 * FileIOオブジェクトを生成
	 * @internal
	 */
	createFileIO(option: FileIOOption | undefined) {
		return new FileIO(this, option)
	}

	/**
	 * (override用) コンバーター初期化
	 * @internal
	 */
	initConverters() {
		this.converters!.push(...this.getConverters())
	}

	/**
	 * 使用するURLのコンバーターを返す
	 * @internal
	 */
	getConverters(): Converter[] {
		return []
	}

	/**
	 * 入力用カーソルオブジェクトを生成
	 * @internal
	 */
	createTargetCursor(option?: object) {
		return new TargetCursor(this, option)
	}

	//---------------------------------------------------------------------------
	// owner.open()    パズルデータを入力して盤面の初期化を行う
	//---------------------------------------------------------------------------
	// open(data, variety = null, callback = null) {
	// 	openExecute(this, data, variety, callback);
	// 	return this;
	// }

	/**
	 * owner.on()   イベントが発生した時に呼ぶ関数を登録する
	 * @param eventname 
	 * @param func 
	 */
	on(eventname: string, func: Handler) {
		this.addListener(eventname, func, false);
	}

	/**
	 * owner.once() イベントが発生した時に1回だけ呼ぶ関数を登録する
	 * @param eventname 
	 * @param func 
	 */
	once(eventname: string, func: Handler) {
		this.addListener(eventname, func, true);
	}

	/**
	 * owner.addListener() on, onceの共通処理
	 * @param eventname 
	 * @param func 
	 * @param once 
	 */
	private addListener(eventname: string, func: Handler, once: boolean) {
		if (!this.listeners[eventname]) { this.listeners[eventname] = []; }
		this.listeners[eventname].push({ func: func, once: !!once });
	}

	/**
	 * イベントが発生した時に呼ぶ関数を実行する
	 * @param eventname 
	 * @param args 
	 */
	emit(eventname: string, ...args: any[]) {
		const evlist = this.listeners[eventname];
		if (!!evlist) {
			//args.unshift(this);
			for (let i = 0; i < evlist.length; i++) {
				const ev = evlist[i];
				if (evlist[i].once) { evlist.splice(i, 1); i--; }
				ev.func(this, ...args);
			}
		}
	}

	/**
	 * setCanvas()  描画キャンバスをセットする
	 * @param el 
	 * @param type 
	 * @returns 
	 */
	private setCanvas(el: HTMLElement, type?: string) {
		if (!el) { return; }

		const rect = getRect(el);
		const _div = document.createElement('div');
		_div.setAttribute("tabindex", "1")
		// _div.style.width = rect.width + 'px';
		// _div.style.height = rect.height + 'px';
		el.appendChild(_div);
		this.canvas = _div;

		setCanvas_main(this, (type || this.preInitCanvasInfo.type));
	}

	/**
	 * 盤面のサイズを設定する
	 * @param width 
	 * @param height 
	 */
	setCanvasSize(width: number, height: number) {
		if (!this.preInitCanvasInfo) {
			this.painter.resizeCanvas(width, height);
		}
		else {
			this.preInitCanvasInfo.width = width;
			this.preInitCanvasInfo.height = height;
		}
	}

	/**
	 * セルのサイズを指定して盤面のサイズを設定する
	 * @param cellsize 
	 */
	setCanvasSizeByCellSize(cellsize: number | null = null) {
		if (!this.preInitCanvasInfo) {
			this.painter.resizeCanvasByCellSize(cellsize);
		}
		else {
			this.preInitCanvasInfo.cellsize = cellsize;
		}
	}

	/**
	 * 盤面の再描画を行う
	 * @param forcemode 
	 */
	redraw(forcemode = false) {
		if (!forcemode) { this.painter.paintAll(); }     // 盤面キャッシュを保持して再描画
		else { this.painter.resizeCanvas(); } // 盤面キャッシュを破棄して再描画
	}

	/**
	 * 色分けをする場合、色をふり直すルーチンを呼び出す
	 */
	irowake() {
		this.board.irowakeRemake();
		if (this.execConfig('irowake') || this.execConfig('irowakeblk')) {
			this.redraw();
		}
	}

	/**
	 * 盤面画像をDataURLとして出力する
	 * @param type 
	 * @param quality 
	 * @param option 
	 * @returns 
	 */
	toDataURL(type: string, quality: number, option: InputImageOption) {
		const imageopt = parseImageOption(type, quality, option);
		const canvas = getLocalCanvas(this, imageopt);
		const dataurl = canvas.toDataURL(imageopt.mimetype, imageopt.quality);
		if (!!canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
		return dataurl;
	}

	/**
	 * 盤面画像をBlobとして出力する
	 * @param callback 
	 * @param type 
	 * @param quality 
	 * @param option 
	 */
	toBlob(callback: (blob: Blob | null) => void, type: string, quality: number, option: InputImageOption) {
		const imageopt = parseImageOption(type, quality, option);
		const canvas = getLocalCanvas(this, imageopt);
		canvas.toBlob(function (blob) {
			callback(blob);
			if (!!canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
		}, imageopt.mimetype, imageopt.quality);
	}

	/**
	 * 盤面画像をファイルデータそのままで出力する
	 * @param type 
	 * @param quality 
	 * @param option 
	 * @returns 
	 */
	toBuffer(type: string, quality: number, option: InputImageOption) {
		const imageopt = parseImageOption(type, quality, option);
		const canvas = getLocalCanvas(this, imageopt);
		const data = canvas.toBuffer(imageopt.mimetype, imageopt.quality);
		if (!!canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
		return data;
	}

	/**
	 * URLを取得する
	 * @returns 
	 */
	getURL() {
		if (this.converters != null) {
			return encodeURL(this, this.converters);
		}
		if (this.encode != null) {
			return this.encode.encodeURL(URL_PZPRV3)
		}
	}

	/**
	 * ファイルデータを取得する
	 * @param type 
	 * @param option 
	 * @returns 
	 */
	getFileData(type?: number, option?: FileEncodeOption) {
		return this.fio.fileencode(type, option);
	}

	/**
	 * URLから盤面データを読み込む
	 */
	readURL(url: string) {
		if (this.converters != null) {
			return decodeURL(this, url, this.converters);
		}
		if (this.encode != null) {
			return this.encode.decodeURL(url)
		}
	}

	/**
	 * ファイルテキストから盤面データを読み込む
	 */
	readFile(txt: string) {
		this.fio.filedecode(txt)
	}
	//---------------------------------------------------------------------------
	// puzzle.clone()      オブジェクトを複製する
	//---------------------------------------------------------------------------
	// clone(option: any) {
	// 	option = option || {};
	// 	var opt = {
	// 		type: (option.type || this.instancetype || ''),
	// 		width: (option.width || this.painter.canvasWidth),
	// 		height: (option.height || this.painter.canvasHeight)
	// 	};
	// 	var newpuzzle = new Puzzle(null, opt).open(this.getFileData(1, { history: !!option.history }));
	// 	newpuzzle.restoreConfig(this.saveConfig());
	// 	return newpuzzle;
	// }


	/**
	 * 開始時間をリセットする
	 */
	resetTime() {
		this.starttime = currentTime();
	}

	/**
	 * 開始からの時間をミリ秒単位で取得する
	 * @returns 
	 */
	getTime() {
		return (currentTime() - this.starttime);
	}

	/**
	 * Undoを実行する
	 * @returns 
	 */
	undo() {
		return this.opemgr.undo();
	}

	/**
	 * Redoを実行する
	 * @returns 
	 */
	redo() {
		return this.opemgr.redo();
	}

	/**
	 * Undoを最後まで実行する
	 * @returns 
	 */
	undoall() {
		while (this.opemgr.undo()) { }
	}

	/**
	 * Redoを最後まで実行する
	 * @returns 
	 */
	redoall() {
		while (this.opemgr.redo()) { }
	}

	/**
	 * ファイルに保存されていない操作がある時にtrueを返す
	 * @returns 
	 */
	ismodified() {
		return this.opemgr.isModified();
	}

	/**
	 * ismodifiedで返す値をfalseに戻す
	 * @returns 
	 */
	saved() {
		return this.opemgr.resetModifiedState();
	}

	/**
	 * 仮置きを開始する(多重仮置きも可能)
	 */
	enterTrial() {
		this.opemgr.enterTrial();
	}

	/**
	 * 仮置きを確定する
	 */
	acceptTrial() {
		this.opemgr.acceptTrial();
	}

	/**
	 * 仮置きをすべて破棄する
	 */
	rejectTrial() {
		this.opemgr.rejectTrial(true);
	}
	/**
	 * 仮置きを1段階破棄する
	 */
	rejectCurrentTrial() {
		this.opemgr.rejectTrial(false);
	}

	/**
	 * 正答判定処理を行う
	 * @param activemode 
	 * @returns 
	 */
	check(activemode: boolean = true) {
		if (!!activemode) {
			this.key.keyreset();
			this.mouse.mousereset();
		}
		const result = this.checker.check(activemode);
		if (result.shouldForceRedraw) {
			this.redraw(true)
		}
		result.text = result.gettext(this.faillist)
		return result
	}

	/**
	 * 回答を消去する
	 */
	ansclear() {
		this.board.ansclear();
		this.board.rebuildInfo();
		this.redraw();
	}
	/**
	 * 補助記号を消去する
	 */
	subclear() {
		this.board.subclear();
		this.redraw();
	}

	/**
	 * エラー表示を消去する
	 * @returns 
	 */
	errclear() {
		const isclear = this.board.errclear();
		if (isclear) {
			this.redraw(true);	/* 描画キャッシュを破棄して描画し直す */
		}
		return isclear;
	}

	/**
	 * 回答・履歴を消去する
	 */
	clear() {
		if (this.playeronly) {
			this.ansclear();
			this.opemgr.allerase();
		}
		else {
			this.board.initBoardSize();
			this.redraw();
		}
	}

	/**
	 * モード変更時の処理を行う
	 * @param newval 
	 * @returns 
	 */
	setMode(newval: string | number) {
		if (this.playeronly) { return; }
		if (typeof newval === 'string') {
			newval = { edit: 1, play: 3 }[newval.substring(0, 4)]!;
			if (newval === void 0) { return; }
		}
		this.editmode = (newval === MODE_EDITOR);
		this.playmode = !this.editmode;

		this.cursor.adjust_modechange();
		this.key.keyreset();
		this.mouse.modechange();
		this.board.errclear();
		this.redraw();

		this.emit('config', 'mode', newval);
		this.emit('mode');
	}

	/**
	 * 設定値の取得を行う
	 * @param idname 
	 * @returns 
	 */
	getConfig(idname: string) { return this.config.get(idname); }

	/**
	 * 設定値の設定を行う
	 */
	setConfig(idname: string, val: any) { return this.config.set(idname, val); }

	/**
	 * 設定値を初期値に戻す
	 */
	resetConfig(idname: string) { return this.config.reset(idname); }

	/**
	 * 設定値が現在のパズルで有効な設定値かどうか返す
	 */
	validConfig(idname: string) { return this.config.getexec(idname); }

	/**
	 * 設定値と、パズルごとに有効かどうかの条件をANDして返す
	 */
	execConfig(idname: string) {
		return (this.config.get(idname) && this.config.getexec(idname));
	}

	/**
	 * 現在有効な設定と設定値を返す
	 */
	getCurrentConfig() { return this.config.getList(); }

	/**
	 * 設定値の保存を行う
	 */
	saveConfig() { return this.config.getAll(); }

	/**
	 * 設定値の復帰を行う
	 */
	restoreConfig(obj: object) { this.config.setAll(obj); }
};


//---------------------------------------------------------------------------
//  openExecute()      各オブジェクトの生成などの処理
//---------------------------------------------------------------------------
// function openExecute(puzzle: Puzzle, data, variety, callback) {
// 	if (typeof variety !== 'string' && !callback) {
// 		callback = variety;
// 		variety = void 0;
// 	}

// 	puzzle.ready = false;

// 	var Board = ((!!classes && !!classes.Board) ? classes.Board : null);
// 	var pzl = pzpr.parser(data, (variety || puzzle.pid));

// 	pzpr.classmgr.setPuzzleClass(puzzle, pzl.pid, function () {
// 		/* パズルの種類が変わっていればオブジェクトを設定しなおす */
// 		if (Board !== puzzle.klass.Board) { /*initObjects(puzzle);*/ } // todo
// 		else { puzzle.painter.suspendAll(); }

// 		try {
// 			puzzle.metadata.reset();
// 			if (pzl.isurl) { new Encode(puzzle).decodeURL(pzl); }
// 			else if (pzl.isfile) { new FileIO(puzzle).filedecode(pzl); }

// 			puzzle.ready = true;
// 			puzzle.emit('ready');
// 			puzzle.emit('mode');

// 			if (!!puzzle.canvas) { postCanvasReady(puzzle); }

// 			puzzle.resetTime();

// 			if (!!callback) { callback(puzzle); }
// 		}
// 		catch (e) {
// 			puzzle.emit('fail-open');
// 			throw e;
// 		}
// 	});
// }

//---------------------------------------------------------------------------
//  setCanvas_main()  描画キャンバスをセットする
//  createSubCanvas() 補助キャンバスを作成する
//---------------------------------------------------------------------------
function setCanvas_main(puzzle: Puzzle, type: string) {
	/* fillTextが使えない場合は強制的にSVG描画に変更する */
	if (type === 'canvas' && !!Candle.enable.canvas && !CanvasRenderingContext2D.prototype.fillText) { type = 'svg'; }

	Candle.start(puzzle.canvas, type, function (gg) {
		const g = gg as CandleWrapper;
		unselectable(g.canvas);
		g.child.style.pointerEvents = 'none';
		if (g.use.canvas && !puzzle.subcanvas) {
			puzzle.subcanvas = createSubCanvas('canvas');
			const canvas = puzzle.subcanvas
			if (!!document.body) {
				canvas.id = `_${(new Date()).getTime()}${type}`; /* 何か他とかぶらないようなID */
				canvas.style.position = 'absolute';
				canvas.style.left = '-10000px';
				canvas.style.top = '0px';
				document.body.appendChild(canvas);
			}
		}
		if (puzzle.ready) { postCanvasReady(puzzle); }
	});
}
function createSubCanvas(type: string) {
	if (!Candle.enable[type]) { throw new Error("type is invalid"); }
	const el = document.createElement('div');
	Candle.start(el, type);
	return el;
}

//---------------------------------------------------------------------------
//  postCanvasReady()  Canvas設定＆ready後の初期化処理を行う
//---------------------------------------------------------------------------
export function postCanvasReady(puzzle: Puzzle) {
	const pc = puzzle.painter;
	const opt = puzzle.preInitCanvasInfo;

	if (puzzle.preInitCanvasInfo) {
		if (puzzle.instancetype !== 'viewer') {
			setCanvasEvents(puzzle);
		}
		else {
			pc.outputImage = true;
		}
		if (!pc.canvasWidth || !pc.canvasHeight) {
			if (!!opt.width && !!opt.height) {
				pc.resizeCanvas(opt.width, opt.height);
			}
			else if (!!opt.cellsize) {
				pc.resizeCanvasByCellSize(opt.cellsize);
			}
		}
		//puzzle.preInitCanvasInfo = undefined;
	}

	pc.initCanvas();
}

//---------------------------------------------------------------------------
//  setCanvasEvents() マウス入力に関するイベントを設定する
//  exec????()        マウス入力へ分岐する(puzzle.mouseが不変でないためバイパスする)
//---------------------------------------------------------------------------
function setCanvasEvents(puzzle: Puzzle) {
	function ae(type: string, func: (e: MouseEvent) => void) { addEvent(puzzle.canvas, type, puzzle, func); }


	// マウス入力イベントの設定
	ae("mousedown", (e) => {
		if (!!puzzle.mouse) { puzzle.mouse.e_mousedown(e); }
	});
	ae("mousemove", (e) => {
		if (!!puzzle.mouse) { puzzle.mouse.e_mousemove(e); }
	});
	ae("mouseup", (e) => {
		if (!!puzzle.mouse) { puzzle.mouse.e_mouseup(e); }
	});
	ae("mousecancel", (e) => {
		if (!!puzzle.mouse) { puzzle.mouse.e_mousecancel(e); }
	});

	puzzle.canvas.addEventListener("touchmove", e => {
		if (e.cancelable) {
			e.preventDefault()
		}
	}, { passive: false })
	puzzle.canvas.oncontextmenu = function () { return false; };
	//puzzle.canvas.style.touchAction = 'pinch-zoom';

	// console.log(puzzle.canvas)
	// // キー入力イベントの設定
	// ae("keydown", (e) => {
	// 	console.log("keydown!")
	// 	if (!!puzzle.key) { puzzle.key.e_keydown(e); }
	// });
	// ae("keyup", (e) => {
	// 	if (!!puzzle.key) { puzzle.key.e_keyup(e); }
	// });
}

//---------------------------------------------------------------------------
//  generateLocalCanvas()  toDataURL, toBlobの共通処理
//---------------------------------------------------------------------------

function getLocalCanvas(puzzle: Puzzle, imageopt: ImageOption) {
	const imgcanvas = createSubCanvas(imageopt.type);

	const pc2 = new Graphic(puzzle);
	pc2.context = imgcanvas.getContext("2d");
	pc2.context.enableTextLengthWA = false;
	pc2.outputImage = true;		/* 一部画像出力時に描画しないオブジェクトがあるパズル向け設定 */
	if ('bgcolor' in imageopt) { pc2.bgcolor = imageopt.bgcolor!; }
	if (puzzle.pid === 'kramma') { pc2.imgtile = puzzle.painter.imgtile; }

	// canvasの設定を適用して、再描画
	pc2.resizeCanvasByCellSize(imageopt.cellsize);
	pc2.unsuspend();

	return imgcanvas;
}

type InputImageOption = {
	cellsize?: number | null
	bgcolor?: string | null
}

type ImageOption = {
	type: "svg" | "canvas"
	mimetype: string
	quality: number | undefined
	cellsize: number | undefined
	bgcolor: string | undefined
}
//---------------------------------------------------------------------------
//  generateLocalCanvas()  toDataURL, toBlobの入力オプション解析処理
//---------------------------------------------------------------------------
function parseImageOption(type: string, quality: number | null, option: InputImageOption): ImageOption { // (type,quality,option)のはず
	const imageopt: ImageOption = {} as ImageOption;

	let cellsize = null
	let bgcolor = null
	if (quality && quality > 1.01) {
		cellsize = quality
		quality = null;
	}

	if ('cellsize' in option) { cellsize = option.cellsize; }
	if ('bgcolor' in option) { bgcolor = option.bgcolor; }


	imageopt.type = ((type || Candle.current).match(/svg/) ? 'svg' : 'canvas');
	imageopt.mimetype = (imageopt.type !== 'svg' ? `image/${type}` : 'image/svg+xml');
	if (quality !== null && quality !== void 0) { imageopt.quality = quality; }

	if (cellsize !== null) { imageopt.cellsize = cellsize; }
	if (bgcolor !== null) { imageopt.bgcolor = bgcolor; }

	return imageopt;
}