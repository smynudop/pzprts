// Puzzle.js v3.6.0
import { Config } from './Config.js';
import { Board, type BoardChildOption, type BoardOption, type IGroup } from './Board';
import { AnsCheck, type AnsCheckExtend, type AnsCheckOption } from './Answer';
import { createFailCode } from './FailCode.js';
import { OperationManager } from './Operation';
import { MouseEvent1, type MouseEventOption } from './MouseInput';
import { KeyEvent, type KeyEventOption, TargetCursor } from './KeyInput';
import { Graphic, type GraphicOption } from './Graphic';
import { decodeURL, encodeURL, type Converter } from './Encode.js';
import { FileIO, type FileIOOption } from './FileData.js';
import * as MetaData from '../pzpr/metadata.js';
import type { Cell, Cross, Border, EXCell } from "./Piece"
import { Encode, type EncodeOption } from './Encode2';
import Candle from '../candle/';

import type { WrapperBase } from '../candle/';

import { pzpr } from '../pzpr/core.js';
import { getRect, currentTime, addEvent, unselectable } from '../pzpr/util.js';
import type { VarityOption } from '../variety/createVariety.js';
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
// ★Puzzleクラス ぱずぷれv3のベース処理やその他の処理を行う
//---------------------------------------------------------------------------
export abstract class Puzzle<
	TCell extends Cell = Cell,
	TCross extends Cross = Cross,
	TBorder extends Border = Border,
	TEXCell extends EXCell = EXCell,
	TBoard extends Board<TCell, TCross, TBorder, TEXCell> = Board<TCell, TCross, TBorder, TEXCell>
> {
	Config = Config
	preInitCanvasInfo: {
		type: string
		width: number | null
		height: number | null
		cellsize: number | null
	}
	board: TBoard
	checker: AnsCheck<TCell, TCross, TBorder, TEXCell, TBoard>
	painter: Graphic
	cursor: TargetCursor
	mouse: MouseEvent1
	key: KeyEvent
	opemgr: OperationManager
	fio: FileIO
	encode: Encode | null
	faillist: Map<string, [string, string]>
	converters: Converter[] | null


	constructor(option?: IConfig, varietyOption?: VarityOption) {

		option = option || {};
		if (!option.pid) {
			console.warn("pidを指定してください。")
		}

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

		this.config = new this.Config(this);

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
			lineGraph: varietyOption?.LineGraph,
			cell: varietyOption?.Cell,
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
	info: any = {}		// VarietyInfoへの参照

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


	createKeyEvent(option: KeyEventOption | undefined) {
		return new KeyEvent(this, option)
	}

	createMouseEvent(option: MouseEventOption | undefined) {
		return new MouseEvent1(this, option)
	}

	createBoard(option: ({ board?: BoardOption } & BoardChildOption) | undefined) {
		return new Board(this, option) as TBoard
	}

	createGraphic(option: GraphicOption | undefined) {
		return new Graphic(this, option)
	}

	createAnsCheck(option: AnsCheckOption & { [key: string]: any } | undefined): AnsCheck<TCell, TCross, TBorder, TEXCell, TBoard> {
		return new AnsCheck(this.board, option)
	}

	createEncode(option: EncodeOption & { [key: string]: any } | undefined): Encode {
		return new Encode(this, option)
	}
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
	 */
	getAdditionalFailCode(): Map<string, [string, string]> | Record<string, [string, string]> {
		return {}
	}


	createFileIO(option: FileIOOption | undefined) {
		return new FileIO(this, option)
	}

	/**
	 * override用
	 */
	initConverters() {
		this.converters!.push(...this.getConverters())
	}

	/**
	 * 使用するURLのコンバーターを返す
	 */
	getConverters(): Converter[] {
		return []
	}

	createTargetCursor(option?: any) {
		return new TargetCursor(this, option)
	}

	//---------------------------------------------------------------------------
	// owner.open()    パズルデータを入力して盤面の初期化を行う
	//---------------------------------------------------------------------------
	// open(data, variety = null, callback = null) {
	// 	openExecute(this, data, variety, callback);
	// 	return this;
	// }

	//---------------------------------------------------------------------------
	// owner.on()   イベントが発生した時に呼ぶ関数を登録する
	// owner.once() イベントが発生した時に1回だけ呼ぶ関数を登録する
	// owner.addListener() on, onceの共通処理
	// owner.emit() イベントが発生した時に呼ぶ関数を実行する
	//---------------------------------------------------------------------------
	on(eventname: string, func: Handler) {
		this.addListener(eventname, func, false);
	}
	once(eventname: string, func: Handler) {
		this.addListener(eventname, func, true);
	}
	addListener(eventname: string, func: Handler, once: boolean) {
		if (!this.listeners[eventname]) { this.listeners[eventname] = []; }
		this.listeners[eventname].push({ func: func, once: !!once });
	}
	emit(eventname: string, ...args: any[]) {
		const evlist = this.listeners[eventname];
		if (!!evlist) {
			args.unshift(this);
			for (let i = 0; i < evlist.length; i++) {
				const ev = evlist[i];
				if (evlist[i].once) { evlist.splice(i, 1); i--; }
				ev.func(this, ...args);
			}
		}
	}

	//---------------------------------------------------------------------------
	// owner.setCanvas()  描画キャンバスをセットする
	//---------------------------------------------------------------------------
	setCanvas(el: HTMLElement, type?: string) {
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

	//---------------------------------------------------------------------------
	// owner.setCanvasSize()           盤面のサイズを設定する
	// owner.setCanvasSizeByCellSize() セルのサイズを指定して盤面のサイズを設定する
	//---------------------------------------------------------------------------
	setCanvasSize(width: number, height: number) {
		if (!this.preInitCanvasInfo) {
			this.painter.resizeCanvas(width, height);
		}
		else {
			this.preInitCanvasInfo.width = width;
			this.preInitCanvasInfo.height = height;
		}
	}
	setCanvasSizeByCellSize(cellsize: number | null = null) {
		if (!this.preInitCanvasInfo) {
			this.painter.resizeCanvasByCellSize(cellsize);
		}
		else {
			this.preInitCanvasInfo.cellsize = cellsize;
		}
	}

	//---------------------------------------------------------------------------
	// owner.redraw()      盤面の再描画を行う
	// owner.irowake()     色分けをする場合、色をふり直すルーチンを呼び出す
	//---------------------------------------------------------------------------
	redraw(forcemode = false) {
		if (!forcemode) { this.painter.paintAll(); }     // 盤面キャッシュを保持して再描画
		else { this.painter.resizeCanvas(); } // 盤面キャッシュを破棄して再描画
	}
	irowake() {
		this.board.irowakeRemake();
		if (this.execConfig('irowake') || this.execConfig('irowakeblk')) {
			this.redraw();
		}
	}

	//---------------------------------------------------------------------------
	// owner.toDataURL() 盤面画像をDataURLとして出力する
	// owner.toBlob()    盤面画像をBlobとして出力する
	// owner.toBuffer()  盤面画像をファイルデータそのままで出力する
	//---------------------------------------------------------------------------
	toDataURL(type: string, quality: number, option: any) {
		const imageopt = parseImageOption(type, quality, option);
		const canvas = getLocalCanvas(this, imageopt);
		const dataurl = canvas.toDataURL(imageopt.mimetype, imageopt.quality);
		if (!!canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
		return dataurl;
	}
	toBlob(callback: (blob: Blob | null) => void, type: string, quality: number, option: any) {
		const imageopt = parseImageOption(type, quality, option);
		const canvas = getLocalCanvas(this, imageopt);
		canvas.toBlob(function (blob) {
			callback(blob);
			if (!!canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
		}, imageopt.mimetype, imageopt.quality);
	}
	toBuffer(type: string, quality: number, option: any) {
		const imageopt = parseImageOption(type, quality, option);
		const canvas = getLocalCanvas(this, imageopt);
		const data = canvas.toBuffer(imageopt.mimetype, imageopt.quality);
		if (!!canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
		return data;
	}

	//---------------------------------------------------------------------------
	// owner.getURL()      URLを取得する
	// owner.getFileData() ファイルデータを取得する
	//---------------------------------------------------------------------------
	getURL(type: number) {
		if (this.converters != null) {
			return encodeURL(this, this.converters);
		}
		if (this.encode != null) {
			return this.encode.encodeURL(URL_PZPRV3)
		}
	}
	getFileData(type: number, option: any) {
		return this.fio.fileencode(type, option);
	}

	readURL(url: string) {
		if (this.converters != null) {
			return decodeURL(this, url, this.converters);
		}
		if (this.encode != null) {
			return this.encode.decodeURL(url)
		}
	}

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

	//---------------------------------------------------------------------------
	// owner.resetTime()      開始時間をリセットする
	// owner.getTime()        開始からの時間をミリ秒単位で取得する
	//---------------------------------------------------------------------------
	resetTime() {
		this.starttime = currentTime();
	}
	getTime() {
		return (currentTime() - this.starttime);
	}

	//---------------------------------------------------------------------------
	// owner.undo()  Undoを実行する
	// owner.redo()  Redoを実行する
	// owner.undoall()  Undoを最後まで実行する
	// owner.redoall()  Redoを最後まで実行する
	// owner.isModified() ファイルに保存されていない操作がある時にtrueを返す
	// owner.saved()      ismodifiedで返す値をfalseに戻す
	//---------------------------------------------------------------------------
	undo() {
		return this.opemgr.undo();
	}
	redo() {
		return this.opemgr.redo();
	}
	undoall() {
		while (this.opemgr.undo()) { }
	}
	redoall() {
		while (this.opemgr.redo()) { }
	}
	ismodified() {
		return this.opemgr.isModified();
	}
	saved() {
		return this.opemgr.resetModifiedState();
	}

	//---------------------------------------------------------------------------
	// puzzle.enterTrial()      TrialModeに設定する (多重設定可能)
	// puzzle.acceptTrial()     TrialModeを確定する
	// puzzle.rejectTrial()     TrialModeの履歴をすべて破棄する
	// puzzle.rejectCurrentTrial() TrialModeの現在の履歴を破棄して一つ前のTrial mode stageに戻る
	//---------------------------------------------------------------------------
	enterTrial() {
		this.opemgr.enterTrial();
	}
	acceptTrial() {
		this.opemgr.acceptTrial();
	}
	rejectTrial() {
		this.opemgr.rejectTrial(true);
	}
	rejectCurrentTrial() {
		this.opemgr.rejectTrial(false);
	}

	//------------------------------------------------------------------------------
	// owner.check()          正答判定処理を行う
	//------------------------------------------------------------------------------
	check(activemode: boolean) {
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

	//------------------------------------------------------------------------------
	// owner.ansclear()       回答を消去する
	// owner.subclear()       補助記号を消去する
	// owner.errclear()       エラー表示を消去する
	// owner.clear()          回答・履歴を消去する
	//------------------------------------------------------------------------------
	ansclear() {
		this.board.ansclear();
		this.board.rebuildInfo();
		this.redraw();
	}
	subclear() {
		this.board.subclear();
		this.redraw();
	}
	errclear() {
		const isclear = this.board.errclear();
		if (isclear) {
			this.redraw(true);	/* 描画キャッシュを破棄して描画し直す */
		}
		return isclear;
	}
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

	//------------------------------------------------------------------------------
	// owner.setMode() モード変更時の処理を行う
	//------------------------------------------------------------------------------
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

	//------------------------------------------------------------------------------
	// owner.getConfig()  設定値の取得を行う
	// owner.setConfig()  設定値の設定を行う
	// owner.resetConfig()設定値を初期値に戻す
	// owner.validConfig() 設定値が現在のパズルで有効な設定値かどうか返す
	// owner.execConfig() 設定値と、パズルごとに有効かどうかの条件をANDして返す
	//------------------------------------------------------------------------------
	getConfig(idname: string) { return this.config.get(idname); }
	setConfig(idname: string, val: any) { return this.config.set(idname, val); }
	resetConfig(idname: string) { return this.config.reset(idname); }
	validConfig(idname: string) { return this.config.getexec(idname); }
	execConfig(idname: string) {
		return (this.config.get(idname) && this.config.getexec(idname));
	}

	//------------------------------------------------------------------------------
	// owner.getCurrentConfig() 現在有効な設定と設定値を返す
	// owner.saveConfig()     設定値の保存を行う
	// owner.restoreConfig()  設定値の復帰を行う
	//------------------------------------------------------------------------------
	getCurrentConfig() { return this.config.getList(); }
	saveConfig() { return this.config.getAll(); }
	restoreConfig(obj: any) { this.config.setAll(obj); }
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
		const g = gg as WrapperBase<any>;
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
	function ae(type: string, func: (e: any) => void) { addEvent(puzzle.canvas, type, puzzle, func); }

	// マウス入力イベントの設定
	ae("mousedown", (e: any) => {
		if (!!puzzle.mouse) { puzzle.mouse.e_mousedown(e); }
	});
	ae("mousemove", (e: any) => {
		if (!!puzzle.mouse) { puzzle.mouse.e_mousemove(e); }
	});
	ae("mouseup", (e: any) => {
		if (!!puzzle.mouse) { puzzle.mouse.e_mouseup(e); }
	});
	ae("mousecancel", (e: any) => {
		if (!!puzzle.mouse) { puzzle.mouse.e_mousecancel(e); }
	});
	puzzle.canvas.oncontextmenu = function () { return false; };
	//puzzle.canvas.style.touchAction = 'pinch-zoom';

	// console.log(puzzle.canvas)
	// // キー入力イベントの設定
	// ae("keydown", (e: any) => {
	// 	console.log("keydown!")
	// 	if (!!puzzle.key) { puzzle.key.e_keydown(e); }
	// });
	// ae("keyup", (e: any) => {
	// 	if (!!puzzle.key) { puzzle.key.e_keyup(e); }
	// });
}







//---------------------------------------------------------------------------
//  generateLocalCanvas()  toDataURL, toBlobの共通処理
//---------------------------------------------------------------------------
function getLocalCanvas(puzzle: Puzzle, imageopt: any) {
	const imgcanvas = createSubCanvas(imageopt.type);

	const pc2 = new Graphic(puzzle);
	pc2.context = imgcanvas.getContext("2d");
	pc2.context.enableTextLengthWA = false;
	pc2.outputImage = true;		/* 一部画像出力時に描画しないオブジェクトがあるパズル向け設定 */
	if ('bgcolor' in imageopt) { pc2.bgcolor = imageopt.bgcolor; }
	if (puzzle.pid === 'kramma') { pc2.imgtile = puzzle.painter.imgtile; }

	// canvasの設定を適用して、再描画
	pc2.resizeCanvasByCellSize(imageopt.cellsize);
	pc2.unsuspend();

	return imgcanvas;
}

//---------------------------------------------------------------------------
//  generateLocalCanvas()  toDataURL, toBlobの入力オプション解析処理
//---------------------------------------------------------------------------
function parseImageOption(type: string, quality: number | null, option: any) { // (type,quality,option)のはず
	const imageopt = {} as any;

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