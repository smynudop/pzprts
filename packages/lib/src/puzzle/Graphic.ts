// Graphic.js v3.4.1

import { Position } from "./Address";
import type { Puzzle } from "./Puzzle";
import { CellList, CrossList, BorderList, EXCellList } from "./PieceList";
import type { BoardPiece, Border, Cell, EXCell } from "./Piece";
import { pzpr } from "../pzpr/core";
import { getEnv } from "../pzpr/env";
import type { WrapperBase } from "../candle";
import { getRect } from "../pzpr/util";
import type { Board } from "./Board";
import type { CellOfBoard } from "./Answer";
import { DIRS } from "./Constants";


const CENTER = 1;
const BOTTOMLEFT = 2;
const BOTTOMRIGHT = 3;
const TOPRIGHT = 4;
const TOPLEFT = 5;

//---------------------------------------------------------------------------
// ★Graphicクラス Canvasに描画する
//---------------------------------------------------------------------------
// パズル共通 Canvas/DOM制御部
// Graphicクラスの定義

//---------------------------------------------------------
export type PaintRange<TBoard extends Board = Board> = {
	x1: number,
	x2: number,
	y1: number,
	y2: number,
	cells: CellList<CellOfBoard<TBoard>>,
	crosses: CrossList,
	borders: BorderList,
	excells: EXCellList
}
export type GraphicOption = Partial<Graphic>

export class Graphic<TBoard extends Board = Board> {
	puzzle: Puzzle<TBoard>
	//pid: string
	imgtile: any
	constructor(puzzle: Puzzle<TBoard>, option?: GraphicOption) {
		this.puzzle = puzzle
		Object.assign(this, option)
		//this.pid = puzzle.pid
		this.gridcolor = this.gridcolor_list[this.gridcolor_type] || this.gridcolor;

		this.resetRange();

		this.initColor();
		this.initFont();
	}

	context: WrapperBase<any> = null!
	subcontext: WrapperBase<any> = null!

	fgcellcolor_func = "ques"		// getQuesCellColor()の種類
	bgcellcolor_func = "error1"	// getBGCellColor()の種類
	bordercolor_func = "ques"		// getBorderColor()の種類
	numbercolor_func = "mixed"	// getQuesNumberColor()の種類

	circlefillcolor_func = "qnum"	// getCircleFillColor()の種類
	circlestrokecolor_func = "qnum"	// getCircleStrokeColor()の種類

	// 標準の色設定
	quescolor = "black"
	qanscolor = "rgb(0, 160, 0)"
	qcmpcolor = "silver"
	qcmpbgcolor = "rgb(224, 224, 255)"
	trialcolor = "rgb(160, 160, 160)"
	subcolor = "rgb(127, 127, 255)"

	// 黒マスの色
	shadecolor = "black"
	errcolor1 = "rgb(192, 0, 0)"
	errcolor2 = "rgb(32, 32, 255)"
	fontShadecolor = "rgb(224, 224, 224)"

	// 白マス確定マスの背景色
	enablebcolor = false
	bcolor = "rgb(160, 255, 160)"
	errbcolor1 = "rgb(255, 160, 160)"
	errbcolor2 = "rgb(64, 255, 64)"

	qsubcolor1 = "rgb(160,255,160)"
	qsubcolor2 = "rgb(255,255,127)"
	qsubcolor3 = "rgb(192,192,192)"	// 絵が出るパズルの背景入力

	icecolor = "rgb(192, 224, 255)"
	erricecolor = "rgb(224,  96, 160)"

	// セルの丸数字内部の背景色
	circlebasecolor = "white"

	// セルの○×の色(補助記号)
	mbcolor = "rgb(0, 160, 0)"

	// 線・×の色
	linecolor = "rgb(0, 160, 0)"		// 色分けなしの場合
	errlinecolor = "rgb(255, 0, 0)"
	noerrcolor = "rgb(160, 160, 160)"		// エラー表示時, エラーでない線/境界線の描画色

	movelinecolor = "silver"
	movetrialcolor = "rgb(255, 160, 0)"

	pekecolor = "rgb(0, 127, 0)"

	// 境界線と黒マスを分ける色(BoxBorder)
	bbcolor = "rgb(160, 160, 160)"

	// 入力ターゲットの色
	targetColor1 = "rgb(255, 64,  64)"
	targetColor3 = "rgb(64,  64, 255)"
	ttcolor = "rgb(127,255,127)"				// ques=51の入力ターゲット(TargetTriangle)

	movecolor = "red"

	// 盤面のCellを分ける色
	gridcolor = "black"
	gridcolor_type: "DARK" | "LIGHT" | "DLIGHT" | "SLIGHT" | "THIN" = "DARK"
	gridcolor_list = {
		// 色々なパズルで定義してた固定色
		DARK: "rgb( 48,  48,  48)",	/* LITSでの指定 */
		LIGHT: "rgb(127, 127, 127)",	/* ほとんどはこの色を指定している */
		DLIGHT: "rgb(160, 160, 160)",	/* 領域分割系で使ってることが多い */
		SLIGHT: "rgb(191, 191, 191)",	/* 部屋＋線を引くパズル           */
		THIN: "rgb(224, 224, 224)"	/* 問題入力時のみGrid表示のパズル */
	}

	// 盤面(枠の中)の背景色
	bgcolor = "white"

	// その他サイズ指定
	textoption: any = null
	fontsizeratio = 0.8				// Fontサイズのcellsizeとの比率
	fontwidth = [0.5, 0.4, 0.33]	// 2文字以上のTextの横幅 (2文字〜の文字単位横幅を指定する)
	fontfamily = ''
	isSupportMaxWidth = true			// maxWidthサポートブラウザ
	crosssize = 0.4
	circleratio = [0.40, 0.35]

	// 枠外の一辺のmargin(セル数換算)
	margin = 0.25

	// canvasの大きさを保持する
	canvasWidth: number = null!
	canvasHeight: number = null!

	// canvas内での盤面の左上座標
	x0 = 0
	y0 = 0

	// 描画単位(デフォルト値)
	cw = 36			// セルの横幅
	ch = 36			// セルの縦幅
	bw = 18			// セルの横幅/2
	bh = 18			// セルの縦幅/2

	lw = 1		// LineWidth 境界線・Lineの太さ
	lm = 1		// LineMargin
	lwratio = 10	// onresize_processでlwの値の算出に用いる
	addlw = 0	// エラー時に線の太さを広げる

	// getNewColorの設定
	lastHdeg = 0
	lastYdeg = 0
	minYdeg = 0.18
	maxYdeg = 0.70

	// その他の描画設定
	range: PaintRange<TBoard> = null!				// 描画領域を保持するオブジェクト

	useBuffer = false			// Buffer描画を行うか
	outputImage = false			// 画像保存中

	// resize関数が呼ばれたが、初期化されていない等でresizeしていないことを示すフラグ
	pendingResize = false

	// 初期化前、およびsuspend呼び出し中を示すフラグ
	suspended = true
	suspendedAll = true

	// Cellのqnumが-2のときに？を表示しないパズルごとの設定
	hideHatena = false

	// 正解条件を満たしたオブジェクトを描画するかどうかの設定
	autocmp = ''

	// 色分け設定
	irowake = false
	irowakeblk = false

	get board(): TBoard {
		return this.puzzle.board
	}

	//---------------------------------------------------------------------------
	// pc.initCanvas()       このオブジェクトで使用するキャンバスを設定する
	//---------------------------------------------------------------------------
	initCanvas() {
		const puzzle = this.puzzle;
		this.context = (!!puzzle.canvas ? puzzle.canvas.getContext("2d") : null);
		const g = this.context
		if (g.use.canvas) {
			this.subcontext = (!!puzzle.subcanvas ? puzzle.subcanvas.getContext("2d") : null);
			this.useBuffer = !!this.subcontext;
		}

		if (this.canvasWidth === null || this.canvasHeight === null) {
			// const rect = getRect(puzzle.canvas);
			// this.resizeCanvas(rect.width, rect.height);
			this.resizeCanvasByCellSize();
		}

		this.pendingResize = true;
		this.resize_canvas_main();
		puzzle.emit('canvasReady');

		this.unsuspend();
	}

	//---------------------------------------------------------------------------
	// pc.initColor()   初期化時に描画色の設定を行う
	// pc.setColor()    描画色の設定を行う
	//---------------------------------------------------------------------------
	initColor() {
		const configlist = this.puzzle.config.list;
		for (const key in configlist) {
			if (key.substr(0, 6) === "color_") { this.setColor(key.substr(6), configlist[key].val); }
		}
	}
	setColor(name: string, color: string) {
		if (name === 'bgcolor') { color = ((typeof color === 'string' && color !== 'white') ? color : this.constructor.prototype[name]); }
		else { color = (color || this.constructor.prototype[name]); }
		//@ts-ignore
		this[name] = color;
		if (!this.suspended) { this.paintAll(); }
	}

	//---------------------------------------------------------------------------
	// pc.initFont()  数字を記入するためのフォントを設定する
	//---------------------------------------------------------------------------
	initFont() {
		const isgothic = this.puzzle.getConfig('font') === 1;
		const env = getEnv()
		if (env.OS.Android) {
			this.fontfamily = (isgothic ? 'Helvetica, Verdana, Arial, ' : '"Times New Roman", ');
		}
		else { this.fontfamily = ''; }
		this.fontfamily += (isgothic ? 'sans-serif' : 'serif');
	}

	//---------------------------------------------------------------------------
	// pc.resizeCanvas()    キャンバスのサイズを設定する
	//                      (指定なしの場合は、前のキャンバスのサイズを用いる)
	// pc.resizeCanvasByCellSize() セルのサイズを指定してキャンバスのサイズを変える
	//                             (指定なしの場合は、前のセルのサイズを用いる)
	//---------------------------------------------------------------------------
	resizeCanvas(cwid: number | null = null, chgt: number | null = null) {
		const insuspend = this.suspended;
		this.suspendAll();
		this.canvasWidth = cwid || this.canvasWidth;
		this.canvasHeight = chgt || this.canvasHeight;

		this.pendingResize = true;
		if (!insuspend) { this.unsuspend(); }
	}
	resizeCanvasByCellSize(cellsize: number | null = null) {
		const insuspend = this.suspended;
		this.suspendAll();

		this.cw = cellsize || this.cw;
		this.ch = cellsize || this.ch;
		this.canvasWidth = this.cw * this.getCanvasCols();
		this.canvasHeight = this.ch * this.getCanvasRows();

		this.pendingResize = true;
		if (!insuspend) { this.unsuspend(); }
	}

	//---------------------------------------------------------------------------
	// pc.resize_canvas_main() ウィンドウのLoad/Resize時の処理。
	//                         Canvas/表示するマス目の大きさを設定する。
	// pc.setParameter()       cw, ch等の変数を大きさに応じて再設定する
	// pc.setOffset()          盤面のサイズや大きさを再設定する
	// pc.setPagePos()         盤面のページ内座標を設定する
	// pc.clearObject()        contextのclearなどを呼び出す関数
	//---------------------------------------------------------------------------
	resize_canvas_main() {
		if (!this.pendingResize) { return; }
		this.pendingResize = false;

		// セルのサイズなどを取得・設定
		this.setParameter();

		// Canvasのサイズ、オフセット位置の変更
		this.setOffset();

		// Listener呼び出し
		this.puzzle.emit('resize');

		// contextのclear等を呼び出す
		this.clearObject();
	}

	setParameter() {
		const cwid = this.canvasWidth;
		const chgt = this.canvasHeight;
		const cols = this.getCanvasCols();
		const rows = this.getCanvasRows();
		const cw = (cwid / cols) | 0;
		const ch = (chgt / rows) | 0;

		if (this.puzzle.getConfig('squarecell')) {
			this.cw = this.ch = Math.min(cw, ch);
		}
		else {
			this.cw = cw; this.ch = ch;
		}

		this.bw = this.cw / 2;
		this.bh = this.ch / 2;

		this.lw = Math.max(this.cw / this.lwratio, 3);
		this.lm = this.lw / 2;
	}
	setOffset() {
		const g = this.context;
		const g2 = this.subcontext;
		const cwid = this.canvasWidth;
		const chgt = this.canvasHeight;

		// canvas要素のサイズを変更する
		g.changeSize(cwid | 0, chgt | 0);
		if (!!g2) { g2.changeSize(cwid | 0, chgt | 0); }

		// 盤面のセルID:0が描画される左上の位置の設定 (Canvas左上からのオフセット)
		this.x0 = (((cwid - this.cw * this.getBoardCols()) / 2 + this.cw * this.getOffsetCols()) | 0) + 0.5;
		this.y0 = (((chgt - this.ch * this.getBoardRows()) / 2 + this.ch * this.getOffsetRows()) | 0) + 0.5;
		const x0 = this.x0
		const y0 = this.y0

		// CanvasのOffset位置変更 (SVGの時、小数点以下の端数調整を行う)
		if (!g.use.canvas) {
			const rect = getRect(g.canvas);
			//g.translate(x0 - (rect.left % 1), y0 - (rect.top % 1));
			g.translate(x0, y0)
		}
		else {
			g.translate(x0, y0);
			if (!!g2) { g2.translate(x0, y0); }
		}
	}
	clearObject() {
		this.context.clear();
	}

	//---------------------------------------------------------------------------
	// pc.getCanvasCols()  Canvasの横幅としてセル何個分が必要か返す
	// pc.getCanvasRows()  Canvasの縦幅としてセル何個分が必要か返す
	// pc.getBoardCols()   マージンを除いた盤面の横幅としてセル何個分が必要か返す
	// pc.getBoardRows()   マージンを除いた盤面の縦幅としてセル何個分が必要か返す
	// pc.getOffsetCols()  有効範囲が(0,0)-(C,R)からずれているパズルで、左右の中心位置を調整する
	// pc.getOffsetRows()  有効範囲が(0,0)-(C,R)からずれているパズルで、上下の中心位置を調整する
	//---------------------------------------------------------------------------
	getCanvasCols() {
		return this.getBoardCols() + 2 * this.margin;
	}
	getCanvasRows() {
		return this.getBoardRows() + 2 * this.margin;
	}

	getBoardCols() {
		const bd = this.puzzle.board;
		return (bd.maxbx - bd.minbx) / 2;
	}
	getBoardRows() {
		const bd = this.puzzle.board;
		return (bd.maxby - bd.minby) / 2;
	}

	getOffsetCols() {
		/* 右にずらしたい分プラス、左にずらしたい分マイナス */
		return (0 - this.puzzle.board.minbx) / 2;
	}
	getOffsetRows() {
		/* 下にずらしたい分プラス、上にずらしたい分マイナス */
		return (0 - this.puzzle.board.minby) / 2;
	}

	//---------------------------------------------------------------------------
	// pc.suspend()     描画処理を一時停止する
	// pc.suspendAll()  全盤面の描画処理を一時停止する
	// pc.unsuspend()   描画処理を再開する
	//---------------------------------------------------------------------------
	suspend() {
		this.suspended = true;
	}
	suspendAll() {
		this.suspendedAll = true;
		this.suspended = true;
	}
	unsuspend() {
		if (!this.context) { return; }

		this.resize_canvas_main();

		if (this.suspendedAll) {
			const bd = this.puzzle.board;
			this.setRange(bd.minbx - 2, bd.minby - 2, bd.maxbx + 2, bd.maxby + 2);
			this.suspendedAll = false;
		}
		if (this.suspended) {
			this.suspended = false;
			this.prepaint();
		}
	}

	//--------------------------------------------------------------------------- 
	// pc.paint()       座標(x1,y1)-(x2,y2)を再描画する。各パズルのファイルでオーバーライドされる。
	//
	// pc.setRange()       rangeオブジェクトを設定する
	// pc.setRangeObject() 描画対象となるオブジェクトを取得する
	// pc.resetRange()     rangeオブジェクトを初期化する
	//---------------------------------------------------------------------------

	/**
	 * paint関数を呼び出す
	 * @param option starbattleでy1margin=0.
	 * @returns 
	 */
	prepaint(option: { y1margin: number } | null = null) {
		if (this.suspended || !this.context) { return; }

		this.isSupportMaxWidth = ((this.context.use.svg && pzpr.env.API.svgTextLength) ||
			(this.context.use.canvas && pzpr.env.API.maxWidth));

		const bd = this.puzzle.board;
		const bm = 2 * this.margin;
		const x1 = this.range.x1;
		const y1 = this.range.y1;
		const x2 = this.range.x2;
		const y2 = this.range.y2;
		if (x1 > x2
			|| y1 > y2
			|| x1 >= bd.maxbx + bm
			|| y1 >= bd.maxby + bm
			|| x2 <= bd.minbx - bm
			|| y2 <= bd.minby - (bm + (option?.y1margin || 0))) {
			/* 入力が範囲外ならば何もしない */
		}
		else if (!this.useBuffer) {
			this.setRangeObject(x1, y1, x2, y2);
			this.flushCanvas();
			this.paint();
		}
		else {
			const g = this.context;
			const g2 = this.subcontext;
			this.context = g2;
			this.setRangeObject(x1 - 1, y1 - 1, x2 + 1, y2 + 1);
			this.flushCanvas();
			this.paint();
			this.context = g;
			this.copyBufferData(g, g2, x1, y1, x2, y2);
		}

		this.resetRange();
	}
	paint() { } //オーバーライド用

	setRange(x1: number, y1: number, x2: number, y2: number) {
		if (this.range.x1 > x1) { this.range.x1 = x1; }
		if (this.range.y1 > y1) { this.range.y1 = y1; }
		if (this.range.x2 < x2) { this.range.x2 = x2; }
		if (this.range.y2 < y2) { this.range.y2 = y2; }
	}
	setRangeObject(x1: number, y1: number, x2: number, y2: number) {
		const bd = this.puzzle.board;
		this.range.cells = bd.cellinside(x1, y1, x2, y2);
		this.range.crosses = bd.crossinside(x1, y1, x2, y2);
		this.range.borders = bd.borderinside(x1, y1, x2, y2);
		this.range.excells = bd.excellinside(x1, y1, x2, y2);
	}
	resetRange() {
		const puzzle = this.puzzle
		const bd = puzzle.board
		this.range = {
			x1: bd.maxbx + 1,
			y1: bd.maxby + 1,
			x2: bd.minbx - 1,
			y2: bd.minby - 1,
			cells: (new CellList()),
			crosses: (new CrossList()),
			borders: (new BorderList()),
			excells: (new EXCellList())
		}
	}

	//---------------------------------------------------------------------------
	// pc.copyBufferData()    Bufferに描画したデータを盤面へコピーする
	//---------------------------------------------------------------------------
	copyBufferData(g: CanvasRenderingContext2D | WrapperBase<any>, g2: any, x1: number, y1: number, x2: number, y2: number) {
		// source側はtaranslateのぶん足されていないので、加算しておきます
		let sx1 = this.x0 + x1 * this.bw - 1;
		let sy1 = this.y0 + y1 * this.bh - 1;
		let sx2 = this.x0 + x2 * this.bw + 2;
		let sy2 = this.y0 + y2 * this.bh + 2;
		if (sx1 < 0) { sx1 = 0; } if (sx2 > g2.child.width) { sx2 = g2.child.width; }
		if (sy1 < 0) { sy1 = 0; } if (sy2 > g2.child.height) { sy2 = g2.child.height; }
		g.drawImage(g2.child, sx1, sy1, (sx2 - sx1), (sy2 - sy1), sx1 - this.x0, sy1 - this.y0, (sx2 - sx1), (sy2 - sy1));
	}

	//---------------------------------------------------------------------------
	// pc.paintRange()  座標(x1,y1)-(x2,y2)を再描画する
	// pc.paintAll()    全体を再描画する
	//---------------------------------------------------------------------------
	paintRange(x1: number, y1: number, x2: number, y2: number) {
		this.setRange(x1, y1, x2, y2);
		this.prepaint();
	}
	paintAll() {
		if (this.suspended) { this.suspendedAll = true; }
		const bd = this.puzzle.board;
		this.paintRange(bd.minbx - 2, bd.minby - 2, bd.maxbx + 2, bd.maxby + 2);
	}

	//---------------------------------------------------------------------------
	// pc.getNewLineColor() 新しい色を返す
	//---------------------------------------------------------------------------
	getNewLineColor() {
		let loopcount = 0;

		while (true) {
			let Rdeg = ((Math.random() * 384) | 0) - 64; if (Rdeg < 0) { Rdeg = 0; } if (Rdeg > 255) { Rdeg = 255; }
			let Gdeg = ((Math.random() * 384) | 0) - 64; if (Gdeg < 0) { Gdeg = 0; } if (Gdeg > 255) { Gdeg = 255; }
			let Bdeg = ((Math.random() * 384) | 0) - 64; if (Bdeg < 0) { Bdeg = 0; } if (Bdeg > 255) { Bdeg = 255; }

			// HLSの各組成値を求める
			const Cmax = Math.max(Rdeg, Math.max(Gdeg, Bdeg));
			const Cmin = Math.min(Rdeg, Math.min(Gdeg, Bdeg));

			let Hdeg = 0;
			const Ldeg = (Cmax + Cmin) * 0.5 / 255;
			const Sdeg = (Cmax === Cmin ? 0 : (Cmax - Cmin) / ((Ldeg <= 0.5) ? (Cmax + Cmin) : (2 * 255 - Cmax - Cmin)));

			if (Cmax === Cmin) { Hdeg = 0; }
			else if (Rdeg >= Gdeg && Rdeg >= Bdeg) { Hdeg = (60 * (Gdeg - Bdeg) / (Cmax - Cmin) + 360) % 360; }
			else if (Gdeg >= Rdeg && Gdeg >= Bdeg) { Hdeg = (120 + 60 * (Bdeg - Rdeg) / (Cmax - Cmin) + 360) % 360; }
			else if (Bdeg >= Gdeg && Bdeg >= Rdeg) { Hdeg = (240 + 60 * (Rdeg - Gdeg) / (Cmax - Cmin) + 360) % 360; }

			// YCbCrのYを求める
			const Ydeg = (0.29891 * Rdeg + 0.58661 * Gdeg + 0.11448 * Bdeg) / 255;

			if ((this.minYdeg < Ydeg && Ydeg < this.maxYdeg) && (Math.abs(this.lastYdeg - Ydeg) > 0.15) && (Sdeg < 0.02 || 0.40 < Sdeg) &&
				(((360 + this.lastHdeg - Hdeg) % 360 >= 45) && ((360 + this.lastHdeg - Hdeg) % 360 <= 315))) {
				this.lastHdeg = Hdeg;
				this.lastYdeg = Ydeg;
				//alert("rgb("+Rdeg+", "+Gdeg+", "+Bdeg+")\nHLS("+(Hdeg|0)+", "+(""+((Ldeg*1000)|0)*0.001).slice(0,5)+", "+(""+((Sdeg*1000|0))*0.001).slice(0,5)+")\nY("+(""+((Ydeg*1000)|0)*0.001).slice(0,5)+")");
				return `rgb(${Rdeg},${Gdeg},${Bdeg})`;
			}

			loopcount++;
			if (loopcount > 100) { return `rgb(${Rdeg},${Gdeg},${Bdeg})`; }
		}
	}

	//---------------------------------------------------------------------------
	// pc.repaintBlocks()  色分け時にブロックを再描画する
	// pc.repaintLines()   ひとつながりの線を再描画する
	// pc.repaintParts()   repaintLine()関数で、さらに上から描画しなおしたい処理を書く
	//                     canvas描画時のみ呼ばれます(他は描画しなおす必要なし)
	//---------------------------------------------------------------------------
	repaintBlocks(clist: CellList<Cell>) {
		const d = clist.getRectSize();
		this.puzzle.painter.paintRange(d.x1 - 1, d.y1 - 1, d.x2 + 1, d.y2 + 1);
	}
	repaintLines(blist: BorderList) {
		this.range.borders = blist;
		this.drawLines();

		if (this.context.use.canvas) { this.repaintParts(blist); }
	}
	repaintParts(blist: BorderList) { } // オーバーライド用

	//---------------------------------------------------------------------------
	// pc.flushCanvas()    指定された領域を白で塗りつぶす
	//---------------------------------------------------------------------------
	flushCanvas() {
		const g = this.vinc('background', 'crispEdges', true);
		const bw = this.bw;
		const bh = this.bh;
		const fm = (this.margin > 0.15 ? this.margin : 0);
		const bd = this.puzzle.board;
		const minbx = bd.minbx - fm;
		const minby = bd.minby - fm;
		const bwidth = bd.maxbx + fm - minbx;
		const bheight = bd.maxby + fm - minby;

		g.vid = "BG";
		g.fillStyle = this.bgcolor;
		g.fillRect(minbx * bw - 0.5, minby * bh - 0.5, bwidth * bw + 1, bheight * bh + 1);
	}

	//---------------------------------------------------------------------------
	// pc.vinc()  レイヤーを返す
	//---------------------------------------------------------------------------
	vinc(layerid: string, rendering: string, freeze = false) {
		const g = this.context;
		const option = { freeze: !!freeze, rendering: null as string | null };
		option.rendering = rendering;
		g.setLayer(layerid, option);
		return g;
	}

	//---------------------------------------------------------------------------
	// pc.disptext()  数字を記入するための共通関数
	//---------------------------------------------------------------------------
	CENTER = CENTER
	BOTTOMLEFT = BOTTOMLEFT
	BOTTOMRIGHT = BOTTOMRIGHT
	TOPRIGHT = TOPRIGHT
	TOPLEFT = TOPLEFT

	disptext(text: string, px: number, py: number, option: any = null) {
		option = option || {};
		const g = this.context;

		let realsize = ((this.cw * (option.ratio || this.fontsizeratio)) | 0);
		let maxLength: number | null = null;
		const widtharray = option.width || this.fontwidth;
		const widthratiopos = (text.length <= widtharray.length + 1 ? text.length - 2 : widtharray.length - 1);
		const widthratio = (widthratiopos >= 0 ? widtharray[widthratiopos] * text.length : null);
		if (this.isSupportMaxWidth) {	// maxLengthサポートブラウザ
			maxLength = (!!widthratio ? (realsize * widthratio) : null);
		}
		else {						// maxLength非サポートブラウザ
			if (!!widthratio) { realsize = (realsize * widthratio * 1.5 / text.length) | 0; }
		}

		const style = (option.style ? `${option.style} ` : "");
		g.font = `${style + realsize}px ${this.fontfamily}`;

		const hoffset = this.bw * (option.hoffset || 0.9);
		const voffset = this.bh * (option.voffset || 0.82);
		const position = option.position || CENTER;
		switch (position) {
			case CENTER: g.textAlign = 'center'; break;
			case BOTTOMLEFT: case TOPLEFT: g.textAlign = 'left'; px -= hoffset; break;
			case BOTTOMRIGHT: case TOPRIGHT: g.textAlign = 'right'; px += hoffset; break;
		}
		switch (position) {
			case CENTER: g.textBaseline = 'middle'; break;
			case TOPRIGHT: case TOPLEFT: g.textBaseline = 'candle-top'; py -= voffset; break;
			case BOTTOMRIGHT: case BOTTOMLEFT: g.textBaseline = 'alphabetic'; py += voffset; break;
		}

		g.fillText(text, px, py, maxLength);
	}

	//---------------------------------------------------------------------------
	// pc.drawQuesCells()    Cellの、境界線の上に描画される問題の黒マスをCanvasに書き込む
	// pc.getQuesCellColor() 問題の黒マスの設定・描画判定する
	//---------------------------------------------------------------------------
	drawQuesCells() {
		this.vinc('cell_front', 'crispEdges', true);
		this.drawCells_common("c_fullf_", (cell) => this.getQuesCellColor(cell));
	}
	getQuesCellColor(cell: Cell) {
		switch (this.fgcellcolor_func) {
			case "ques":
				return this.getQuesCellColor_ques(cell)
			case "qnum":
				return this.getQuesCellColor_qnum(cell)
			default:
				throw new Error(`invalid fgcellcolor_func`)
		}
	}
	getQuesCellColor_ques(cell: Cell) {
		if (cell.ques !== 1) { return null; }
		if ((cell.error || cell.qinfo) === 1) { return this.errcolor1; }
		return this.quescolor;
	}
	getQuesCellColor_qnum(cell: Cell) {
		if (cell.qnum === -1) { return null; }
		if ((cell.error || cell.qinfo) === 1) { return this.errcolor1; }
		return this.quescolor;
	}

	//---------------------------------------------------------------------------
	// pc.drawShadedCells()    Cellの、境界線の上から描画される回答の黒マスをCanvasに書き込む
	// pc.getShadedCellColor() 回答の黒マスの設定・描画判定する
	//---------------------------------------------------------------------------
	drawShadedCells() {
		this.vinc('cell_shaded', 'crispEdges', true);
		this.drawCells_common("c_fulls_", (cell) => this.getShadedCellColor(cell));
	}
	getShadedCellColor(cell: Cell) {
		if (cell.qans !== 1) { return null; }
		const info = cell.error || cell.qinfo;
		if (info === 1) { return this.errcolor1; }
		if (info === 2) { return this.errcolor2; }
		if (cell.trial) { return this.trialcolor; }
		if (this.puzzle.execConfig('irowakeblk')) { return cell.sblk.color; }

		return this.shadecolor;
	}

	//---------------------------------------------------------------------------
	// pc.drawBGCells()    Cellの、境界線の下に描画される背景色をCanvasに書き込む
	// pc.getBGCellColor() 背景色の設定・描画判定する
	//---------------------------------------------------------------------------
	drawBGCells() {
		this.vinc('cell_back', 'crispEdges', true);
		this.drawCells_common("c_fullb_", (cell) => this.getBGCellColor(cell));
	}
	getBGCellColor(cell: CellOfBoard<TBoard>) {
		switch (this.bgcellcolor_func) {
			case "error1":
				return this.getBGCellColor_error1(cell)
			case "error2":
				return this.getBGCellColor_error2(cell)
			case "qcmp":
				return this.getBGCellColor_qcmp(cell)
			case "qcmp1":
				return this.getBGCellColor_qcmp1(cell)
			case "qsub1":
				return this.getBGCellColor_qsub1(cell)
			case "qsub2":
				return this.getBGCellColor_qsub2(cell)
			case "qsub3":
				return this.getBGCellColor_qsub3(cell)
			default:
				console.warn(`bgcellcolor_func(${this.bgcellcolor_func}) is invalid`)
				return this.getBGCellColor_error1(cell)
		}
	}
	getBGCellColor_error1(cell: Cell) {
		if (cell.error === 1 || cell.qinfo === 1) { return this.errbcolor1; }
		return null;
	}
	getBGCellColor_error2(cell: Cell) {
		const info = cell.error || cell.qinfo;
		if (info === 1) { return this.errbcolor1; }
		if (info === 2) { return this.errbcolor2; }
		return null;
	}
	getBGCellColor_qcmp(cell: Cell) {
		if (cell.error === 1 || cell.qinfo === 1) { return this.errbcolor1; }
		if (this.puzzle.execConfig('autocmp') && !!cell.room && cell.room.cmp) { return this.qcmpbgcolor; }
		return null;
	}
	getBGCellColor_qcmp1(cell: Cell) {
		if (cell.error === 1 || cell.qinfo === 1) { return this.errbcolor1; }
		if (cell.qsub === 1) { return this.bcolor; }
		if (this.puzzle.execConfig('autocmp') && !!cell.room && cell.room.cmp) { return this.qcmpbgcolor; }
		return null;
	}
	getBGCellColor_qsub1(cell: Cell) {
		if ((cell.error || cell.qinfo) === 1) { return this.errbcolor1; }
		if (cell.qsub === 1) { return this.bcolor; }
		return null;
	}
	getBGCellColor_qsub2(cell: Cell) {
		this.bcolor = "silver"; /* 数字入力で背景が消えないようにする応急処置 */
		if ((cell.error || cell.qinfo) === 1) { return this.errbcolor1; }
		if (cell.qsub === 1) { return this.qsubcolor1; }
		if (cell.qsub === 2) { return this.qsubcolor2; }
		return null;
	}
	getBGCellColor_qsub3(cell: Cell) {
		if ((cell.error || cell.qinfo) === 1) { return this.errbcolor1; }
		if (cell.qsub === 1) { return this.qsubcolor1; }
		if (cell.qsub === 2) { return this.qsubcolor2; }
		if (cell.qsub === 3) { return this.qsubcolor3; }
		return null;
	}
	getBGCellColor_icebarn(cell: Cell) {
		if (cell.error === 1 || cell.qinfo === 1) {
			if (cell.ques === 6) { return this.erricecolor; }
			return this.errbcolor1;
		}
		if (cell.ques === 6) { return this.icecolor; }
		return null;
	}

	//---------------------------------------------------------------------------
	// pc.drawCells_common()  drawShadedCells, drawQuesCells, drawBGCellsの共通ルーチン
	//---------------------------------------------------------------------------
	drawCells_common(header: string, colorfunc: (cell: Cell) => string | null) {
		const g = this.context;
		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			const color = colorfunc(cell);
			g.vid = header + cell.id;
			if (!!color) {
				g.fillStyle = color;
				g.fillRectCenter(cell.bx * this.bw, cell.by * this.bh, this.bw + 0.5, this.bh + 0.5);
			}
			else { g.vhide(); }
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawBGEXcells()    EXCellに描画される背景色をCanvasに書き込む
	// pc.getBGEXcellColor() 背景色の設定・描画判定する
	//---------------------------------------------------------------------------
	drawBGEXcells() {
		const g = this.vinc('excell_back', 'crispEdges', true);

		const exlist = this.range.excells;
		for (let i = 0; i < exlist.length; i++) {
			const excell = exlist[i];
			const color = this.getBGEXcellColor(excell);

			g.vid = `ex_full_${excell.id}`;
			if (!!color) {
				g.fillStyle = color;
				g.fillRectCenter(excell.bx * this.bw, excell.by * this.bh, this.bw + 0.5, this.bh + 0.5);
			}
			else { g.vhide(); }
		}
	}

	getBGEXcellColor(excell: EXCell) {
		if (excell.error === 1 || excell.qinfo === 1) { return this.errbcolor1; }
	}

	//---------------------------------------------------------------------------
	// pc.drawDotCells()  ・だけをCanvasに書き込む
	//---------------------------------------------------------------------------
	drawDotCells() {
		const g = this.vinc('cell_dot', 'auto', true);

		const dsize = Math.max(this.cw * 0.06, 2);
		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];

			g.vid = `c_dot_${cell.id}`;
			if (cell.qsub === 1) {
				g.fillStyle = (!cell.trial ? this.qanscolor : this.trialcolor);
				g.fillCircle(cell.bx * this.bw, cell.by * this.bh, dsize);
			}
			else { g.vhide(); }
		}
	}

	getAllowParameter() {
		return {
			al: this.cw * 0.35,		// ArrowLength
			aw: this.cw * 0.12,		// ArrowWidth
			tl: 0,					// 矢じりの長さの座標(中心-長さ)
			tw: this.cw * 0.35		// 矢じりの幅
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawCellArrows() 矢印だけをCanvasに書き込む
	//---------------------------------------------------------------------------
	drawCellArrows() {
		const g = this.vinc('cell_arrow', 'auto');

		// if (this.pid !== "nagare") {
		// 	al = this.cw * 0.4;		// ArrowLength
		// 	aw = this.cw * 0.03;		// ArrowWidth
		// 	tl = this.cw * 0.16;		// 矢じりの長さの座標(中心-長さ)
		// 	tw = this.cw * 0.16;		// 矢じりの幅
		// }

		let { al, aw, tl, tw } = this.getAllowParameter()
		aw = (aw >= 1 ? aw : 1);
		tw = (tw >= 5 ? tw : 5);

		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			const dir = (!cell.numberAsObject ? cell.qdir : cell.getNum());
			const color = ((dir >= 1 && dir <= 4) ? this.getCellArrowColor(cell) : null);

			g.vid = `c_arrow_${cell.id}`;
			if (!!color) {
				g.fillStyle = color;
				g.beginPath();
				const px = cell.bx * this.bw;
				const py = cell.by * this.bh;
				switch (dir) {
					case DIRS.UP: g.setOffsetLinePath(px, py, 0, -al, -tw, -tl, -aw, -tl, -aw, al, aw, al, aw, -tl, tw, -tl, true); break;
					case DIRS.DN: g.setOffsetLinePath(px, py, 0, al, -tw, tl, -aw, tl, -aw, -al, aw, -al, aw, tl, tw, tl, true); break;
					case DIRS.LT: g.setOffsetLinePath(px, py, -al, 0, -tl, -tw, -tl, -aw, al, -aw, al, aw, -tl, aw, -tl, tw, true); break;
					case DIRS.RT: g.setOffsetLinePath(px, py, al, 0, tl, -tw, tl, -aw, -al, -aw, -al, aw, tl, aw, tl, tw, true); break;
				}
				g.fill();
			}
			else { g.vhide(); }
		}
	}
	getCellArrowColor(cell: Cell) {
		const dir = (!cell.numberAsObject ? cell.qdir : cell.getNum());
		if (dir >= 1 && dir <= 4) {
			if (!cell.numberAsObject || cell.qnum !== -1) { return this.quescolor; }
			return (!cell.trial ? this.qanscolor : this.trialcolor);
		}
		return null;
	}

	/**
	 * ごきげんななめでオーバーライドされる
	 */
	slashWidth() {
		return Math.max(this.bw / 4, 2)
	}

	/**
	 * 斜線をCanvasに書き込む
	 */
	drawSlashes() {
		const g = this.vinc('cell_slash', 'auto');

		const slashwidth = this.slashWidth()
		const irowake = this.puzzle.execConfig('irowake');

		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			g.vid = `c_slash_${cell.id}`;
			if (cell.qans !== 0) {
				const info = cell.error || cell.qinfo;
				//let addwidth = 0;
				let color: string;
				// if (this.pid === 'gokigen' || this.pid === 'wagiri') {
				// 	if (cell.trial && this.puzzle.execConfig('irowake')) { addwidth = -basewidth / 2; }
				// 	else if (info === 1 || info === 3) { addwidth = basewidth / 2; }
				// }

				if (info === 1) { color = this.errcolor1; }
				else if (info === 2) { color = this.errcolor2; }
				else if (info === -1) { color = this.noerrcolor; }
				else if (irowake && cell.path.color) { color = cell.path.color; }
				else if (cell.trial) { color = this.trialcolor; }
				else { color = "black"; }

				g.lineWidth = slashwidth;
				g.strokeStyle = color;
				g.beginPath();
				const px = cell.bx * this.bw;
				const py = cell.by * this.bh;
				if (cell.qans === 31) { g.setOffsetLinePath(px, py, -this.bw, -this.bh, this.bw, this.bh, true); }
				else if (cell.qans === 32) { g.setOffsetLinePath(px, py, this.bw, -this.bh, -this.bw, this.bh, true); }
				g.stroke();
			}
			else { g.vhide(); }
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawQuesNumbers()  Cellの問題数字をCanvasに書き込む
	// pc.drawAnsNumbers()   Cellの回答数字をCanvasに書き込む
	// pc.drawHatenas()      ques===-2の時に？をCanvasに書き込む
	// pc.getQuesNumberText()  書き込む数のテキストを取得する
	// pc.getQuesNumberColor() 問題数字の設定・描画判定する
	//---------------------------------------------------------------------------
	drawQuesNumbers() {
		this.vinc('cell_number', 'auto');
		this.drawNumbers_com(
			(cell) => this.getQuesNumberText(cell),
			(cell) => this.getQuesNumberColor(cell),
			'cell_text_',
			this.textoption
		);
	}
	drawAnsNumbers() {
		this.vinc('cell_ans_number', 'auto');
		this.drawNumbers_com(
			(cell: Cell) => this.getNumberText(cell, cell.anum),
			(cell: Cell) => this.getAnsNumberColor(cell),
			'cell_ans_text_',
			{}
		);
	}
	drawHatenas() {
		function getQuesHatenaText(cell: Cell) { return ((cell.ques === -2 || cell.qnum === -2) ? "?" : ""); }
		this.vinc('cell_number', 'auto');
		this.drawNumbers_com(getQuesHatenaText, this.getQuesNumberColor_qnum, 'cell_text_', this.textoption);
	}
	drawNumbers_com(
		textfunc: (cell: Cell) => string,
		colorfunc: (cell: Cell) => string,
		header: string,
		textoption: any
	) {
		const g = this.context;
		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			const text = textfunc(cell);
			g.vid = header + cell.id;
			if (!!text) {
				g.fillStyle = colorfunc(cell);
				this.disptext(text, cell.bx * this.bw, cell.by * this.bh, textoption);
			}
			else { g.vhide(); }
		}
	}
	getQuesNumberText(cell: Cell | EXCell) {
		return this.getNumberText(cell, (this.puzzle.execConfig('dispmove') ? (cell as Cell).base! : cell).qnum);
	}

	getNumberText(cell: Cell | EXCell, num: number) {
		if (!(cell as Cell).numberAsLetter) {
			return this.getNumberTextCore(num);
		}

		return this.getNumberTextCore_letter(num);
	}

	/**
	 * 
	 * @param num 
	 * @param forceHideHatena ヤジリンでdisptype_yajilin==2のときtrueだった
	 * @returns 
	 */
	getNumberTextCore(num: number, forceHideHatena: boolean = false) {
		const hideHatena = this.hideHatena || forceHideHatena
		//const hideHatena = (this.pid !== "yajirin" ? this.hideHatena : this.puzzle.getConfig('disptype_yajilin') === 2);
		return (num >= 0 ? `${num}` : ((!hideHatena && num === -2) ? "?" : ""));
	}
	getNumberTextCore_letter(num: number) {
		let text = `${num}`;
		if (num === -1) { text = ""; }
		else if (num === -2) { text = "?"; }
		else if (num > 0 && num <= 26) { text = (num + 9).toString(36).toUpperCase(); }
		else if (num > 26 && num <= 52) { text = (num - 17).toString(36).toLowerCase(); }
		return text;
	}

	getQuesNumberColor(cell: Cell | EXCell) {
		switch (this.numbercolor_func) {
			case "fixed":
				return this.getQuesNumberColor_fixed(cell)
			case "fixed_shaded":
				return this.getQuesNumberColor_fixed_shaded(cell)
			case "qnum":
				return this.getQuesNumberColor_qnum(cell)
			case "move":
				return this.getQuesNumberColor_move(cell)
			case "mixed":
				return this.getQuesNumberColor_mixed(cell)
			default:
				console.warn(`numbercolor_func(${this.numbercolor_func}) is invalid`)
				return this.getQuesNumberColor_mixed(cell);

		}
	}
	getQuesNumberColor_fixed(cell: Cell | EXCell) {
		return this.quescolor;
	}
	getQuesNumberColor_fixed_shaded(cell: Cell | EXCell) {
		return this.fontShadecolor;
	}
	getQuesNumberColor_qnum(cell: Cell | EXCell) {
		return ((cell.error || cell.qinfo) === 1 ? this.errcolor1 : this.quescolor);
	}
	getQuesNumberColor_move(cell: Cell | EXCell) {
		const puzzle = this.puzzle;
		const info = cell.error || cell.qinfo;
		if (info === 1 || info === 4) {
			return this.errcolor1;
		}
		if (puzzle.execConfig('dispmove') && puzzle.mouse.mouseCell === cell) {
			return this.movecolor;
		}
		return this.quescolor;
	}
	getQuesNumberColor_mixed(cell: Cell | EXCell) {
		const info = cell.error || cell.qinfo;
		if ((cell.ques >= 1 && cell.ques <= 5) || cell.qans === 1) {
			return this.fontShadecolor;
		}
		if (info === 1 || info === 4) {
			return this.errcolor1;
		}
		return this.quescolor;
	}

	getAnsNumberColor(cell: Cell) {
		if ((cell.error || cell.qinfo) === 1) {
			return this.errcolor1;
		}
		return (!cell.trial ? this.qanscolor : this.trialcolor);
	}

	//---------------------------------------------------------------------------
	// pc.drawNumbersEXcell()  EXCellの数字をCanvasに書き込む
	//---------------------------------------------------------------------------
	drawNumbersEXcell() {
		const g = this.vinc('excell_number', 'auto');

		const exlist = this.range.excells;
		for (let i = 0; i < exlist.length; i++) {
			const excell = exlist[i];
			const text = this.getQuesNumberText(excell);

			g.vid = `excell_text_${excell.id}`;
			if (!!text) {
				g.fillStyle = this.getQuesNumberColor(excell);
				this.disptext(text, excell.bx * this.bw, excell.by * this.bh);
			}
			else { g.vhide(); }
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawSubNumbers()  Cellの補助数字をCanvasに書き込む
	//---------------------------------------------------------------------------
	drawSubNumbers() {
		const g = this.vinc('cell_subnumber', 'auto');
		const posarray = [5, 4, 2, 3];

		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			for (let n = 0; n < 4; n++) {
				const text = (!cell.numberAsLetter ? this.getNumberTextCore(cell.snum[n]) : this.getNumberTextCore_letter(cell.snum[n]));
				g.vid = `cell_subtext_${cell.id}_${n}`;
				if (!!text) {
					g.fillStyle = (!cell.trial ? this.subcolor : this.trialcolor);
					this.disptext(text, cell.bx * this.bw, cell.by * this.bh, { position: posarray[n], ratio: 0.33, hoffset: 0.8 });
				}
				else { g.vhide(); }
			}
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawArrowNumbers() Cellの数字と矢印をCanvasに書き込む
	//---------------------------------------------------------------------------
	drawArrowNumbers() {
		const g = this.vinc('cell_arrownumber', 'auto');

		const al = this.cw * 0.4;		// ArrowLength
		const aw = this.cw * 0.03;		// ArrowWidth
		const tl = this.cw * 0.16;		// 矢じりの長さの座標(中心-長さ)
		const tw = this.cw * 0.12;		// 矢じりの幅
		const dy = -this.bh * 0.6;
		const dx = [this.bw * 0.6, this.bw * 0.7, this.bw * 0.8, this.bw * 0.85];

		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			const dir = cell.qdir;
			const text = this.getQuesNumberText(cell);
			let px = cell.bx * this.bw;
			let py = cell.by * this.bh;
			const digit = text.length - 1;

			if (!!text) {
				g.fillStyle = this.getQuesNumberColor(cell);
			}

			// 矢印の描画
			g.vid = `cell_arrow_${cell.id}`;
			if (!!text && dir !== DIRS.NDIR) {
				g.beginPath();
				switch (dir) {
					case DIRS.UP: g.setOffsetLinePath(px + dx[digit], py, 0, -al, -tw, -tl, -aw, -tl, -aw, al, aw, al, aw, -tl, tw, -tl, true); break;
					case DIRS.DN: g.setOffsetLinePath(px + dx[digit], py, 0, al, -tw, tl, -aw, tl, -aw, -al, aw, -al, aw, tl, tw, tl, true); break;
					case DIRS.LT: g.setOffsetLinePath(px, py + dy, -al, 0, -tl, -tw, -tl, -aw, al, -aw, al, aw, -tl, aw, -tl, tw, true); break;
					case DIRS.RT: g.setOffsetLinePath(px, py + dy, al, 0, tl, -tw, tl, -aw, -al, -aw, -al, aw, tl, aw, tl, tw, true); break;
				}
				g.fill();
			}
			else { g.vhide(); }

			// 数字の描画
			g.vid = `cell_arnum_${cell.id}`;
			if (!!text) {
				const option = { ratio: 0.8 };
				if (dir !== DIRS.NDIR) { option.ratio = 0.7; }

				if (dir === DIRS.UP || dir === DIRS.DN) { px -= this.cw * 0.1; }
				else if (dir === DIRS.LT || dir === DIRS.RT) { py += this.ch * 0.1; }

				this.disptext(text, px, py, option);
			}
			else { g.vhide(); }
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawCircledNumbers() Cell上の丸数字をCanvasに書き込む
	//---------------------------------------------------------------------------
	drawCircledNumbers() {
		this.drawCircles();

		this.vinc('cell_number', 'auto');
		this.drawNumbers_com(
			(cell) => this.getQuesNumberText(cell),
			(cell) => this.getQuesNumberColor(cell),
			'cell_text_',
			{ ratio: 0.65 });
	}

	//---------------------------------------------------------------------------
	// pc.drawCrosses()    Crossの丸数字をCanvasに書き込む
	// pc.drawCrossMarks() Cross上の黒点をCanvasに書き込む
	//---------------------------------------------------------------------------
	drawCrosses() {
		const g = this.vinc('cross_base', 'auto', true);

		const csize = this.cw * this.crosssize + 1;
		g.lineWidth = 1;

		const option = { ratio: 0.6 };
		const clist = this.range.crosses;
		for (let i = 0; i < clist.length; i++) {
			const cross = clist[i];
			const px = cross.bx * this.bw;
			const py = cross.by * this.bh;

			// ○の描画
			g.vid = `x_cp_${cross.id}`;
			if (cross.qnum !== -1) {
				g.fillStyle = (cross.error === 1 || cross.qinfo === 1 ? this.errcolor1 : "white");
				g.strokeStyle = "black";
				g.shapeCircle(px, py, csize);
			}
			else { g.vhide(); }

			// 数字の描画
			g.vid = `cross_text_${cross.id}`;
			if (cross.qnum >= 0) {
				g.fillStyle = this.quescolor;
				this.disptext(`${cross.qnum}`, px, py, option);
			}
			else { g.vhide(); }
		}
	}
	drawCrossMarks() {
		const g = this.vinc('cross_mark', 'auto', true);

		const csize = this.cw * this.crosssize;
		const clist = this.range.crosses;
		for (let i = 0; i < clist.length; i++) {
			const cross = clist[i];

			g.vid = `x_cm_${cross.id}`;
			if (cross.qnum === 1) {
				g.fillStyle = (cross.error === 1 || cross.qinfo === 1 ? this.errcolor1 : this.quescolor);
				g.fillCircle(cross.bx * this.bw, cross.by * this.bh, csize);
			}
			else { g.vhide(); }
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawBorders()        境界線をCanvasに書き込む
	// pc.drawBorders_common() 境界線をCanvasに書き込む(共通処理)
	// pc.getBorderColor()     境界線の設定・描画判定する
	//---------------------------------------------------------------------------
	drawBorders() {
		this.vinc('border', 'crispEdges', true);
		this.drawBorders_common("b_bd_");
	}
	drawBorders_common(header: string) {
		const g = this.context;

		const blist = this.range.borders;
		for (let i = 0; i < blist.length; i++) {
			const border = blist[i];
			const color = this.getBorderColor(border);

			g.vid = header + border.id;
			if (!!color) {
				const px = border.bx * this.bw;
				const py = border.by * this.bh;
				const lm = (this.lw + this.addlw) / 2;
				g.fillStyle = color;
				if (border.isVert()) { g.fillRectCenter(px, py, lm, this.bh + lm); }
				else { g.fillRectCenter(px, py, this.bw + lm, lm); }
			}
			else { g.vhide(); }
		}
	}

	getBorderColor(border: Border) {
		switch (this.bordercolor_func) {
			case "ques":
				return this.getBorderColor_ques(border)
			case "qans":
				return this.getBorderColor_qans(border)
			case "ice":
				return this.getBorderColor_ice(border)
		}
	}
	getBorderColor_ques(border: Border) {
		if (border.isBorder()) { return this.quescolor; }
		return null;
	}
	getBorderColor_qans(border: Border) {
		const err = border.error || border.qinfo;
		if (border.isBorder()) {
			if (err === 1) { return this.errcolor1; }
			if (err === -1) { return this.noerrcolor; }
			if (border.trial) { return this.trialcolor; }
			return this.qanscolor;
		}
		return null;
	}
	getBorderColor_ice(border: Border) {
		const cell1 = border.sidecell[0];
		const cell2 = border.sidecell[1];
		if (border.inside && !cell1.isnull && !cell2.isnull && ((cell1.ice() ? 1 : 0) ^ (cell2.ice() ? 1 : 0))) {
			return this.quescolor;
		}
		return null;
	}

	//---------------------------------------------------------------------------
	// pc.drawQansBorders()    問題の境界線をCanvasに書き込む
	// pc.drawQuesBorders()    回答の境界線をCanvasに書き込む
	// pc.getQuesBorderColor() 問題の境界線の設定・描画判定する
	// pc.getQansBorderColor() 回答の境界線の設定・描画判定する
	//---------------------------------------------------------------------------
	drawQansBorders() {
		this.vinc('border_answer', 'crispEdges', true);
		this.getBorderColor = this.getQansBorderColor;
		this.drawBorders_common("b_bdans_");
	}
	drawQuesBorders() {
		this.vinc('border_question', 'crispEdges', true);
		this.getBorderColor = this.getQuesBorderColor;
		this.drawBorders_common("b_bdques_");
	}

	getQuesBorderColor(border: Border) {
		if (border.ques === 1) { return this.quescolor; }
		return null;
	}
	getQansBorderColor(border: Border) {
		if (border.qans === 1) { return (!border.trial ? this.qanscolor : this.trialcolor); }
		return null;
	}

	//---------------------------------------------------------------------------
	// pc.drawBorderQsubs() 境界線用の補助記号をCanvasに書き込む
	// pc.drawBoxBorders()  
	//---------------------------------------------------------------------------
	drawBorderQsubs() {
		const g = this.vinc('border_qsub', 'crispEdges', true);

		const m = this.cw * 0.15; //Margin
		const blist = this.range.borders;
		for (let i = 0; i < blist.length; i++) {
			const border = blist[i];

			g.vid = `b_qsub1_${border.id}`;
			if (border.qsub === 1) {
				const px = border.bx * this.bw;
				const py = border.by * this.bh;
				g.fillStyle = (!border.trial ? this.pekecolor : this.trialcolor);
				if (border.isHorz()) { g.fillRectCenter(px, py, 0.5, this.bh - m); }
				else { g.fillRectCenter(px, py, this.bw - m, 0.5); }
			}
			else { g.vhide(); }
		}
	}

	/**
	 * 境界線と黒マスの間の線を描画する
	 * @param tileflag 
	 */
	drawBoxBorders(tileflag: boolean) {
		const g = this.vinc('boxborder', 'crispEdges');

		const lm = this.lm;
		const cw = this.cw;
		const ch = this.ch;

		g.strokeStyle = this.bbcolor;
		g.lineWidth = 1;

		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			const isdraw = (cell.qans === 1);
			//if (this.pid === 'stostone' && this.puzzle.board.falling) { isdraw = false; }

			g.vid = `c_bb_${cell.id}`;
			if (isdraw) {
				const px = (cell.bx - 1) * this.bw;
				const py = (cell.by - 1) * this.bh;
				const px0 = px - 0.5;
				const px1 = px + lm + 0.5;
				const px2 = px + cw - lm - 0.5;
				const px3 = px + cw + 0.5;
				const py0 = py - 0.5;
				const py1 = py + lm + 0.5;
				const py2 = py + ch - lm - 0.5;
				const py3 = py + ch + 0.5;

				// この関数を呼ぶ場合は全てhasborder===1なので
				// 外枠用の考慮部分を削除しています。
				const adb = cell.adjborder;
				const UPin = (cell.by > 2);
				const DNin = (cell.by < 2 * this.puzzle.board.rows - 2);
				const LTin = (cell.bx > 2);
				const RTin = (cell.bx < 2 * this.puzzle.board.cols - 2);

				const isUP = (!UPin || adb.top.ques === 1);
				const isDN = (!DNin || adb.bottom.ques === 1);
				const isLT = (!LTin || adb.left.ques === 1);
				const isRT = (!RTin || adb.right.ques === 1);

				const isUL = (!UPin || !LTin || cell.relbd(-2, -1).ques === 1 || cell.relbd(-1, -2).ques === 1);
				const isUR = (!UPin || !RTin || cell.relbd(2, -1).ques === 1 || cell.relbd(1, -2).ques === 1);
				const isDL = (!DNin || !LTin || cell.relbd(-2, 1).ques === 1 || cell.relbd(-1, 2).ques === 1);
				const isDR = (!DNin || !RTin || cell.relbd(2, 1).ques === 1 || cell.relbd(1, 2).ques === 1);

				g.beginPath();

				if (isUP || isUL) { g.moveTo(px1, py1); }
				if (!isUP && isUL) { g.lineTo(px1, py0); }
				if (!isUP && isUR) { g.moveTo(px2, py0); }
				if (isUP || isUR) { g.lineTo(px2, py1); }

				else if (isRT || isUR) { g.moveTo(px2, py1); }
				if (!isRT && isUR) { g.lineTo(px3, py1); }
				if (!isRT && isDR) { g.moveTo(px3, py2); }
				if (isRT || isDR) { g.lineTo(px2, py2); }

				else if (isDN || isDR) { g.moveTo(px2, py2); }
				if (!isDN && isDR) { g.lineTo(px2, py3); }
				if (!isDN && isDL) { g.moveTo(px1, py3); }
				if (isDN || isDL) { g.lineTo(px1, py2); }

				else if (isLT || isDL) { g.moveTo(px1, py2); }
				if (!isLT && isDL) { g.lineTo(px0, py2); }
				if (!isLT && isUL) { g.moveTo(px0, py1); }
				if (isLT || isUL) { g.lineTo(px1, py1); }

				g.stroke();
			}
			else { g.vhide(); }
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawLines()    回答の線をCanvasに書き込む
	// pc.getLineColor() 描画する線の色を設定する
	//---------------------------------------------------------------------------
	drawLines() {
		const g = this.vinc('line', 'crispEdges');

		const blist = this.range.borders;
		for (let i = 0; i < blist.length; i++) {
			const border = blist[i];
			const color = this.getLineColor(border);

			g.vid = `b_line_${border.id}`;
			if (!!color) {
				const px = border.bx * this.bw;
				const py = border.by * this.bh;
				const isvert = (this.puzzle.board.borderAsLine === border.isVert());
				const lm = this.lm + this.addlw / 2;

				g.fillStyle = color;
				if (isvert) { g.fillRectCenter(px, py, lm, this.bh + lm); }
				else { g.fillRectCenter(px, py, this.bw + lm, lm); }
			}
			else { g.vhide(); }
		}
		this.addlw = 0;
	}
	getLineColor(border: Border | null) {
		this.addlw = 0;
		if (border?.isLine()) {
			const info = border.error || border.qinfo;
			const puzzle = this.puzzle;
			const isIrowake = (puzzle.execConfig('irowake') && border.path && border.path.color);
			const isDispmove = puzzle.execConfig('dispmove');

			if (border.trial && puzzle.execConfig('irowake')) { this.addlw = -this.lm; }
			else if (info === 1) { this.addlw = 1; }

			if (info === 1) { return this.errlinecolor; }
			if (info === -1) { return this.noerrcolor; }
			if (isDispmove) { return (border.trial ? this.movetrialcolor : this.movelinecolor); }
			if (isIrowake) { return border.path.color; }
			return (border.trial ? this.trialcolor : this.linecolor);
		}
		return null;
	}

	//---------------------------------------------------------------------------
	// pc.drawTip()    動いたことを示す矢印のやじりを書き込む
	//---------------------------------------------------------------------------
	drawTip() {
		const g = this.vinc('cell_linetip', 'auto');

		const tsize = this.cw * 0.30;
		const tplus = this.cw * 0.05;

		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			let dir = 0;
			let border = null;
			if (cell.lcnt === 1 && cell.qnum === -1 && !this.puzzle.execConfig('dispmove')) {
				const adb = cell.adjborder;
				if (adb.top.isLine()) { dir = 2; border = adb.top; }
				else if (adb.bottom.isLine()) { dir = 1; border = adb.bottom; }
				else if (adb.left.isLine()) { dir = 4; border = adb.left; }
				else if (adb.right.isLine()) { dir = 3; border = adb.right; }
			}

			g.vid = `c_tip_${cell.id}`;
			if (dir !== 0) {
				g.strokeStyle = this.getLineColor(border) || this.linecolor;
				g.lineWidth = this.lw + this.addlw; //LineWidth

				g.beginPath();
				const px = cell.bx * this.bw + 1;
				const py = cell.by * this.bh + 1;
				if (dir === 1) { g.setOffsetLinePath(px, py, -tsize, tsize, 0, -tplus, tsize, tsize, false); }
				else if (dir === 2) { g.setOffsetLinePath(px, py, -tsize, -tsize, 0, tplus, tsize, -tsize, false); }
				else if (dir === 3) { g.setOffsetLinePath(px, py, tsize, -tsize, -tplus, 0, tsize, tsize, false); }
				else if (dir === 4) { g.setOffsetLinePath(px, py, -tsize, -tsize, tplus, 0, -tsize, tsize, false); }
				g.stroke();
			}
			else { g.vhide(); }
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawPekes()    境界線上の×をCanvasに書き込む
	//---------------------------------------------------------------------------
	drawPekes() {
		const g = this.vinc('border_peke', 'auto', true);

		let size = this.cw * 0.15 + 1; if (size < 4) { size = 4; }
		g.lineWidth = 1 + (this.cw / 40) | 0;

		const blist = this.range.borders;
		for (let i = 0; i < blist.length; i++) {
			const border = blist[i];
			g.vid = `b_peke_${border.id}`;
			if (border.qsub === 2) {
				g.strokeStyle = (!border.trial ? this.pekecolor : this.trialcolor);
				g.strokeCross(border.bx * this.bw, border.by * this.bh, size - 1);
			}
			else { g.vhide(); }
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawBaseMarks() 交点のdotをCanvasに書き込む
	//---------------------------------------------------------------------------
	drawBaseMarks() {
		const g = this.vinc('cross_mark', 'auto', true);
		g.fillStyle = this.quescolor;

		const size = this.cw / 10;
		const clist = this.range.crosses;
		for (let i = 0; i < clist.length; i++) {
			const cross = clist[i];
			g.vid = `x_cm_${cross.id}`;
			g.fillCircle(cross.bx * this.bw, cross.by * this.bh, size / 2);
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawTriangle()   三角形をCanvasに書き込む
	// pc.drawTriangle1()  
	//---------------------------------------------------------------------------
	drawTriangle() {
		const g = this.vinc('cell_triangle', 'auto');

		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			const num = (cell.ques !== 0 ? cell.ques : cell.qans);

			g.vid = `c_tri_${cell.id}`;
			if (num >= 2 && num <= 5) {
				g.fillStyle = this.getTriangleColor(cell);
				this.drawTriangle1(cell.bx * this.bw, cell.by * this.bh, num);
			}
			else { g.vhide(); }
		}
	}
	getTriangleColor(cell: Cell) {
		return this.quescolor;
	}
	/**
	 * 三角形をCanvasに書き込む(1マスのみ)
	 * @param px 
	 * @param py 
	 * @param num 
	 * @param mgn リフレクトリンクで1だった
	 */
	drawTriangle1(px: number, py: number, num: number, mgn: number = 0) {
		const g = this.context;
		const bw = this.bw + 1 - mgn;
		const bh = this.bh + 1 - mgn;
		g.beginPath();
		switch (num) {
			case 2: g.setOffsetLinePath(px, py, -bw, -bh, -bw, bh, bw, bh, true); break;
			case 3: g.setOffsetLinePath(px, py, bw, -bh, -bw, bh, bw, bh, true); break;
			case 4: g.setOffsetLinePath(px, py, -bw, -bh, bw, -bh, bw, bh, true); break;
			case 5: g.setOffsetLinePath(px, py, -bw, -bh, bw, -bh, -bw, bh, true); break;
		}
		g.fill();
	}

	//---------------------------------------------------------------------------
	// pc.drawMBs()    Cell上の○,×をCanvasに書き込む
	//---------------------------------------------------------------------------
	drawMBs() {
		const g = this.vinc('cell_mb', 'auto', true);
		g.lineWidth = 1;

		const rsize = this.cw * 0.35;
		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			let px = 0;
			let py = 0;
			if (cell.qsub > 0) {
				px = cell.bx * this.bw; py = cell.by * this.bh;
				g.strokeStyle = (!cell.trial ? this.mbcolor : "rgb(192, 192, 192)");
			}

			g.vid = `c_MB1_${cell.id}`;
			if (cell.qsub === 1) { g.strokeCircle(px, py, rsize); } else { g.vhide(); }

			g.vid = `c_MB2_${cell.id}`;
			if (cell.qsub === 2) { g.strokeCross(px, py, rsize); } else { g.vhide(); }
		}
	}

	//---------------------------------------------------------------------------
	// pc.getCircleStrokeColor() 描画する円の線の色を設定する
	// pc.getCircleFillColor()   描画する円の背景色を設定する
	//---------------------------------------------------------------------------

	/**  
	 * 数字や白丸黒丸等を表すCellの丸を書き込む
	 * @param margin fillとstrokeの間に線を描画するスキマ (環状線スペシャルで0.10だった)
	 */
	drawCircles(margin: number = 0) {
		let g = this.vinc('cell_circle', 'auto', true);

		const ra = this.circleratio;
		const rsize_stroke = this.cw * (ra[0] + ra[1]) / 2;

		/* fillとstrokeの間に線を描画するスキマを与える */
		const rsize_fill = this.cw * (ra[0] - margin);

		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];

			const color = this.getCircleFillColor(cell);
			g.vid = `c_cirb_${cell.id}`;
			if (!!color) {
				g.fillStyle = color;
				g.fillCircle(cell.bx * this.bw, cell.by * this.bh, rsize_fill);
			}
			else { g.vhide(); }
		}

		g = this.vinc('cell_circle_stroke', 'auto', true);
		g.lineWidth = Math.max(this.cw * (ra[0] - ra[1]), 1);

		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];

			const color = this.getCircleStrokeColor(cell);
			g.vid = `c_cira_${cell.id}`;
			if (!!color) {
				g.strokeStyle = color;
				g.strokeCircle(cell.bx * this.bw, cell.by * this.bh, rsize_stroke);
			}
			else { g.vhide(); }
		}
	}

	getCircleStrokeColor(cell: Cell) {
		switch (this.circlestrokecolor_func) {
			case "qnum":
				return this.getCircleStrokeColor_qnum(cell)
			case "qnum2":
				return this.getCircleStrokeColor_qnum2(cell)
		}
	}
	getCircleStrokeColor_qnum(cell: Cell) {
		const puzzle = this.puzzle;
		const error = cell.error || cell.qinfo;
		const isdrawmove = puzzle.execConfig('dispmove');
		const num = (!isdrawmove ? cell : cell.base!).qnum;
		if (num !== -1) {
			if (isdrawmove && puzzle.mouse.mouseCell === cell) { return this.movecolor; }
			if (error === 1 || error === 4) { return this.errcolor1; }
			return this.quescolor;
		}
		return null;
	}
	getCircleStrokeColor_qnum2(cell: Cell) {
		if (cell.qnum === 1) {
			return (cell.error === 1 ? this.errcolor1 : this.quescolor);
		}
		return null;
	}

	getCircleFillColor(cell: Cell) {
		switch (this.circlefillcolor_func) {
			case "qnum":
				return this.getCircleFillColor_qnum(cell)
			case "qnum2":
				return this.getCircleFillColor_qnum2(cell)
			case "qcmp":
				return this.getCircleFillColor_qcmp(cell)
		}
	}

	getCircleFillColor_qnum(cell: Cell) {
		if (cell.qnum !== -1) {
			const error = cell.error || cell.qinfo;
			if (error === 1 || error === 4) { return this.errbcolor1; }
			return this.circlebasecolor;
		}
		return null;
	}
	getCircleFillColor_qnum2(cell: Cell) {
		if (cell.qnum === 1) {
			return (cell.error === 1 ? this.errbcolor1 : "white");
		}
		if (cell.qnum === 2) {
			return (cell.error === 1 ? this.errcolor1 : this.quescolor);
		}
		return null;
	}
	getCircleFillColor_qcmp(cell: Cell) {
		const puzzle = this.puzzle;
		const error = cell.error || cell.qinfo;
		const isdrawmove = puzzle.execConfig('dispmove');
		const num = (!isdrawmove ? cell : cell.base!).qnum;
		if (num !== -1) {
			if (error === 1 || error === 4) { return this.errbcolor1; }
			if (cell.isCmp()) { return this.qcmpcolor; }
			return this.circlebasecolor;
		}
		return null;
	}

	//---------------------------------------------------------------------------
	// pc.drawDepartures()    移動系パズルで、移動元を示す記号を書き込む
	//---------------------------------------------------------------------------
	drawDepartures() {
		const g = this.vinc('cell_depart', 'auto', true);
		g.fillStyle = this.movelinecolor;

		const rsize = this.cw * 0.15;
		const isdrawmove = this.puzzle.execConfig('dispmove');
		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];

			g.vid = `c_dcir_${cell.id}`;
			if (isdrawmove && cell.isDeparture()) {
				const px = cell.bx * this.bw;
				const py = cell.by * this.bh;
				g.fillCircle(px, py, rsize);
			}
			else { g.vhide(); }
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawLineParts()   ╋などをCanvasに書き込む
	//---------------------------------------------------------------------------
	drawLineParts() {
		const g = this.vinc('cell_lineparts', 'crispEdges');
		g.fillStyle = this.quescolor;

		const lm = this.lm;
		const bw = this.bw;
		const bh = this.bh;
		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			const qu = cell.ques;

			g.vid = `c_lp_${cell.id}`;
			if (qu >= 11 && qu <= 17) {
				const px = cell.bx * this.bw;
				const py = cell.by * this.bh;
				const px0 = px - bw - 0.5;
				const px1 = px - lm;
				const px2 = px + lm;
				const px3 = px + bw + 0.5;
				const py0 = py - bh - 0.5;
				const py1 = py - lm;
				const py2 = py + lm;
				const py3 = py + bh + 0.5;

				const flag = { 11: 15, 12: 3, 13: 12, 14: 9, 15: 5, 16: 6, 17: 10 }[qu] as number;
				g.beginPath();
				g.moveTo(px1, py1); if (flag & 1) { g.lineTo(px1, py0); g.lineTo(px2, py0); } // top
				g.lineTo(px2, py1); if (flag & 8) { g.lineTo(px3, py1); g.lineTo(px3, py2); } // right
				g.lineTo(px2, py2); if (flag & 2) { g.lineTo(px2, py3); g.lineTo(px1, py3); } // bottom
				g.lineTo(px1, py2); if (flag & 4) { g.lineTo(px0, py2); g.lineTo(px0, py1); } // left
				g.closePath();
				g.fill();
			}
			else { g.vhide(); }
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawTateyokos()   縦棒・横棒をCanvasに書き込む
	// pc.getBarColor()     縦棒・横棒の色を取得する
	//---------------------------------------------------------------------------
	drawTateyokos() {
		const g = this.vinc('cell_tateyoko', 'crispEdges');
		const lm = Math.max(this.cw / 6, 3) / 2;	//LineWidth

		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			const px = cell.bx * this.bw;
			const py = cell.by * this.bh;
			const qa = cell.qans;

			g.vid = `c_bar1_${cell.id}`;
			if (qa === 11 || qa === 12) {
				g.fillStyle = this.getBarColor(cell, true);
				g.fillRectCenter(px, py, lm + this.addlw / 2, this.bh);
			}
			else { g.vhide(); }

			g.vid = `c_bar2_${cell.id}`;
			if (qa === 11 || qa === 13) {
				g.fillStyle = this.getBarColor(cell, false);
				g.fillRectCenter(px, py, this.bw, lm + this.addlw / 2);
			}
			else { g.vhide(); }
		}
		this.addlw = 0;
	}

	getBarColor(cell: Cell, vert: boolean) {
		const err = cell.error;
		const isErr = (err === 1 || err === 4 || ((err === 5 && vert) || (err === 6 && !vert)));
		let color = "";
		this.addlw = 0;
		if (isErr) { color = this.errlinecolor; this.addlw = 1; }
		else if (err !== 0) { color = this.noerrcolor; }
		else if (cell.trial) { color = this.trialcolor; }
		else { color = this.linecolor; }
		return color;
	}

	//---------------------------------------------------------------------------
	// pc.drawQues51()         Ques===51があるようなパズルで、描画関数を呼び出す
	// pc.drawSlash51Cells()   [＼]のナナメ線をCanvasに書き込む
	// pc.drawSlash51EXcells() EXCell上の[＼]のナナメ線をCanvasに書き込む
	// pc.drawEXCellGrid()     EXCell間の境界線をCanvasに書き込む
	//---------------------------------------------------------------------------
	drawQues51() {
		this.drawEXCellGrid();
		this.drawSlash51Cells();
		this.drawSlash51EXcells();
		this.drawTargetTriangle();
	}
	drawSlash51Cells() {
		const g = this.vinc('cell_ques51', 'crispEdges', true);

		g.strokeStyle = this.quescolor;
		g.lineWidth = 1;
		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];

			g.vid = `c_slash51_${cell.id}`;
			if (cell.ques === 51) {
				const px = cell.bx * this.bw;
				const py = cell.by * this.bh;
				g.strokeLine(px - this.bw, py - this.bh, px + this.bw, py + this.bh);
			}
			else { g.vhide(); }
		}
	}
	drawSlash51EXcells() {
		const g = this.vinc('excell_ques51', 'crispEdges', true);

		g.strokeStyle = this.quescolor;
		g.lineWidth = 1;
		const exlist = this.range.excells;
		for (let i = 0; i < exlist.length; i++) {
			const excell = exlist[i];
			const px = excell.bx * this.bw;
			const py = excell.by * this.bh;
			g.vid = `ex_slash51_${excell.id}`;
			g.strokeLine(px - this.bw, py - this.bh, px + this.bw, py + this.bh);
		}
	}
	drawEXCellGrid() {
		const g = this.vinc('grid_excell', 'crispEdges', true);

		g.fillStyle = this.quescolor;
		const exlist = this.range.excells;
		for (let i = 0; i < exlist.length; i++) {
			const excell = exlist[i];
			const px = excell.bx * this.bw;
			const py = excell.by * this.bh;

			g.vid = `ex_bdx_${excell.id}`;
			if (excell.by === -1 && excell.bx < this.puzzle.board.maxbx) {
				g.fillRectCenter(px + this.bw, py, 0.5, this.bh);
			}
			else { g.vhide(); }

			g.vid = `ex_bdy_${excell.id}`;
			if (excell.bx === -1 && excell.by < this.puzzle.board.maxby) {
				g.fillRectCenter(px, py + this.bh, this.bw, 0.5);
			}
			else { g.vhide(); }
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawQuesNumbersOn51()   [＼]に数字を記入する
	// pc.drawQuesNumbersOn51_1() 1つの[＼]に数字を記入する
	//---------------------------------------------------------------------------
	drawQuesNumbersOn51() {
		this.vinc('cell_number51', 'auto');

		const d = this.range;
		for (let bx = (d.x1 | 1); bx <= d.x2; bx += 2) {
			for (let by = (d.y1 | 1); by <= d.y2; by += 2) {
				const piece = this.puzzle.board.getobj(bx, by); /* cell or excell */
				if (!piece.isnull) { this.drawQuesNumbersOn51_1(piece); }
			}
		}
	}
	drawQuesNumbersOn51_1(piece: BoardPiece) { /* cell or excell */
		const g = this.context;
		let val: number;
		let adj: Cell;
		const px = piece.bx * this.bw;
		const py = piece.by * this.bh;
		const option = { ratio: 0.45, position: null as number | null };
		g.fillStyle = (piece.error === 1 || piece.qinfo === 1 ? this.errcolor1 : this.quescolor);

		adj = piece.relcell(2, 0);
		val = (piece.ques === 51 ? piece.qnum : -1);

		g.vid = [piece.group, piece.id, 'text_ques51_rt'].join('_');
		if (val >= 0 && !adj.isnull && adj.ques !== 51) {
			option.position = this.TOPRIGHT;
			this.disptext(`${val}`, px, py, option);
		}
		else { g.vhide(); }

		adj = piece.relcell(0, 2);
		val = (piece.ques === 51 ? piece.qnum2 : -1);

		g.vid = [piece.group, piece.id, 'text_ques51_dn'].join('_');
		if (val >= 0 && !adj.isnull && adj.ques !== 51) {
			option.position = this.BOTTOMLEFT;
			this.disptext(`${val}`, px, py, option);
		}
		else { g.vhide(); }
	}

	//---------------------------------------------------------------------------
	// pc.drawTarget()  入力対象となる場所を描画する
	// pc.drawCursor()  キーボードからの入力対象をCanvasに書き込む
	// pc.drawTargetSubNumber() Cellの補助数字の入力対象に背景色をつける
	// pc.drawTargetTriangle() [＼]のうち入力対象のほうに背景色をつける
	//---------------------------------------------------------------------------
	drawTarget() {
		this.drawCursor(true, this.puzzle.editmode);
	}

	drawCursor(islarge: boolean = true, isdraw: boolean = true) {
		const g = this.vinc('target_cursor', 'crispEdges');

		const d = this.range;
		const cursor = this.puzzle.cursor;
		if (cursor.bx < d.x1 - 1 || d.x2 + 1 < cursor.bx) { return; }
		if (cursor.by < d.y1 - 1 || d.y2 + 1 < cursor.by) { return; }

		const px = cursor.bx * this.bw;
		const py = cursor.by * this.bh;
		let w: number;
		let size: number;
		if (islarge !== false) { w = (Math.max(this.cw / 16, 2)) | 0; size = this.bw - 0.5; }
		else { w = (Math.max(this.cw / 24, 1)) | 0; size = this.bw * 0.56; }

		isdraw = (isdraw !== false && this.puzzle.getConfig('cursor') && !this.outputImage);
		g.fillStyle = (this.puzzle.editmode ? this.targetColor1 : this.targetColor3);

		g.vid = "ti1_"; if (isdraw) { g.fillRect(px - size, py - size, size * 2, w); } else { g.vhide(); }
		g.vid = "ti2_"; if (isdraw) { g.fillRect(px - size, py - size, w, size * 2); } else { g.vhide(); }
		g.vid = "ti3_"; if (isdraw) { g.fillRect(px - size, py + size - w, size * 2, w); } else { g.vhide(); }
		g.vid = "ti4_"; if (isdraw) { g.fillRect(px + size - w, py - size, w, size * 2); } else { g.vhide(); }
	}

	drawTargetSubNumber() {
		const g = this.vinc('target_subnum', 'crispEdges');

		const d = this.range;
		const cursor = this.puzzle.cursor;
		if (cursor.bx < d.x1 || d.x2 < cursor.bx) { return; }
		if (cursor.by < d.y1 || d.y2 < cursor.by) { return; }

		const target = cursor.targetdir;

		g.vid = "target_subnum";
		g.fillStyle = this.ttcolor;
		if (this.puzzle.playmode && target !== 0) {
			const bw = this.bw;
			const bh = this.bh;
			const px = cursor.bx * bw + 0.5;
			const py = cursor.by * bh + 0.5;
			const tw = bw * 0.8;
			const th = bh * 0.8;
			if (target === 5) { g.fillRect(px - bw, py - bh, tw, th); }
			else if (target === 4) { g.fillRect(px + bw - tw, py - bh, tw, th); }
			else if (target === 2) { g.fillRect(px - bw, py + bh - th, tw, th); }
			else if (target === 3) { g.fillRect(px + bw - tw, py + bh - th, tw, th); }
		}
		else { g.vhide(); }
	}
	drawTargetTriangle() {
		const g = this.vinc('target_triangle', 'auto');

		const d = this.range;
		const cursor = this.puzzle.cursor;
		if (cursor.bx < d.x1 || d.x2 < cursor.bx) { return; }
		if (cursor.by < d.y1 || d.y2 < cursor.by) { return; }

		const target = cursor.detectTarget();

		g.vid = "target_triangle";
		g.fillStyle = this.ttcolor;
		if (this.puzzle.editmode && target !== 0) {
			this.drawTriangle1((cursor.bx * this.bw), (cursor.by * this.bh), (target === 4 ? 4 : 2));
		}
		else { g.vhide(); }
	}

	//---------------------------------------------------------------------------
	// pc.drawDashedCenterLines() セルの中心から中心にひかれる点線をCanvasに描画する
	//---------------------------------------------------------------------------
	drawDashedCenterLines() {
		const g = this.vinc('centerline', 'crispEdges', true);
		const bd = this.puzzle.board;

		let x1 = this.range.x1;
		let y1 = this.range.y1;
		let x2 = this.range.x2;
		let y2 = this.range.y2;
		if (x1 < bd.minbx + 1) { x1 = bd.minbx + 1; } if (x2 > bd.maxbx - 1) { x2 = bd.maxbx - 1; }
		if (y1 < bd.minby + 1) { y1 = bd.minby + 1; } if (y2 > bd.maxby - 1) { y2 = bd.maxby - 1; }
		x1 -= (~x1 & 1); y1 -= (~y1 & 1); x2 += (~x2 & 1); y2 += (~y2 & 1); /* (x1,y1)-(x2,y2)を外側の奇数範囲まで広げる */

		const dotCount = (Math.max(this.cw / (this.cw / 10 + 3), 1) | 0);
		const dotSize = this.cw / (dotCount * 2);

		g.lineWidth = 1;
		g.strokeStyle = this.gridcolor;
		for (let i = x1; i <= x2; i += 2) {
			const px = i * this.bw;
			const py1 = y1 * this.bh;
			const py2 = y2 * this.bh;
			g.vid = `cliney_${i}`;
			g.strokeDashedLine(px, py1, px, py2, [dotSize]);
		}
		for (let i = y1; i <= y2; i += 2) {
			const py = i * this.bh;
			const px1 = x1 * this.bw;
			const px2 = x2 * this.bw;
			g.vid = `clinex_${i}`;
			g.strokeDashedLine(px1, py, px2, py, [dotSize]);
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawGrid()        セルの枠線(実線)をCanvasに書き込む
	// pc.drawDashedGrid()  セルの枠線(点線)をCanvasに書き込む
	//---------------------------------------------------------------------------
	drawGrid(haschassis: boolean = true, isdraw: boolean = true) {
		const g = this.vinc('grid', 'crispEdges', true);
		const bd = this.puzzle.board;

		// 外枠まで描画するわけじゃないので、maxbxとか使いません
		let x1 = this.range.x1;
		let y1 = this.range.y1;
		let x2 = this.range.x2;
		let y2 = this.range.y2;
		if (x1 < 0) { x1 = 0; } if (x2 > 2 * bd.cols) { x2 = 2 * bd.cols; }
		if (y1 < 0) { y1 = 0; } if (y2 > 2 * bd.rows) { y2 = 2 * bd.rows; }
		x1 -= (x1 & 1); y1 -= (y1 & 1); /* (x1,y1)を外側の偶数位置に移動する */
		if (x1 >= x2 || y1 >= y2) { return; }

		const bs = ((bd.hasborder !== 2 && haschassis !== false) ? 2 : 0);
		const bw = this.bw;
		const bh = this.bh;
		const xa = Math.max(x1, 0 + bs);
		const xb = Math.min(x2, 2 * bd.cols - bs);
		const ya = Math.max(y1, 0 + bs);
		const yb = Math.min(y2, 2 * bd.rows - bs);

		// isdraw!==false: 指定無しかtrueのときは描画する
		g.lineWidth = 1;
		g.strokeStyle = this.gridcolor;
		for (let i = xa; i <= xb; i += 2) {
			g.vid = `bdy_${i}`;
			if (isdraw !== false) {
				const px = i * bw;
				const py1 = y1 * bh;
				const py2 = y2 * bh;
				g.strokeLine(px, py1, px, py2);
			}
			else { g.vhide(); }
		}
		for (let i = ya; i <= yb; i += 2) {
			g.vid = `bdx_${i}`;
			if (isdraw !== false) {
				const py = i * bh;
				const px1 = x1 * bw;
				const px2 = x2 * bw;
				g.strokeLine(px1, py, px2, py);
			}
			else { g.vhide(); }
		}
	}
	drawDashedGrid(haschassis?: boolean) {
		const g = this.vinc('grid', 'crispEdges', true);
		const bd = this.puzzle.board;

		// 外枠まで描画するわけじゃないので、maxbxとか使いません
		let x1 = this.range.x1;
		let y1 = this.range.y1;
		let x2 = this.range.x2;
		let y2 = this.range.y2;
		if (x1 < 0) { x1 = 0; } if (x2 > 2 * bd.cols) { x2 = 2 * bd.cols; }
		if (y1 < 0) { y1 = 0; } if (y2 > 2 * bd.rows) { y2 = 2 * bd.rows; }
		x1 -= (x1 & 1); y1 -= (y1 & 1); x2 += (x2 & 1); y2 += (y2 & 1); /* (x1,y1)-(x2,y2)を外側の偶数範囲に移動する */

		const dotCount = (Math.max(this.cw / (this.cw / 10 + 3), 1) | 0);
		const dotSize = this.cw / (dotCount * 2);

		const bs = ((haschassis !== false) ? 2 : 0);
		const bw = this.bw;
		const bh = this.bh;
		const xa = Math.max(x1, bd.minbx + bs);
		const xb = Math.min(x2, bd.maxbx - bs);
		const ya = Math.max(y1, bd.minby + bs);
		const yb = Math.min(y2, bd.maxby - bs);

		g.lineWidth = 1;
		g.strokeStyle = this.gridcolor;
		for (let i = xa; i <= xb; i += 2) {
			const px = i * bw;
			const py1 = y1 * bh;
			const py2 = y2 * bh;
			g.vid = `bdy_${i}`;
			g.strokeDashedLine(px, py1, px, py2, [dotSize]);
		}
		for (let i = ya; i <= yb; i += 2) {
			const py = i * bh;
			const px1 = x1 * bw;
			const px2 = x2 * bw;
			g.vid = `bdx_${i}`;
			g.strokeDashedLine(px1, py, px2, py, [dotSize]);
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawChassis()     外枠をCanvasに書き込む
	// pc.drawChassis_ex1() bd.hasexcell==1の時の外枠をCanvasに書き込む
	//---------------------------------------------------------------------------
	drawChassis(option: { lw: number, lm: number } | null = null) {
		const g = this.vinc('chassis', 'crispEdges', true);
		const bd = this.puzzle.board;

		// ex===0とex===2で同じ場所に描画するので、maxbxとか使いません
		let x1 = this.range.x1;
		let y1 = this.range.y1;
		let x2 = this.range.x2;
		let y2 = this.range.y2;
		if (x1 < 0) { x1 = 0; } if (x2 > 2 * bd.cols) { x2 = 2 * bd.cols; }
		if (y1 < 0) { y1 = 0; } if (y2 > 2 * bd.rows) { y2 = 2 * bd.rows; }

		const boardWidth = bd.cols * this.cw;
		const boardHeight = bd.rows * this.ch;
		// ボサノワでは1 / 0.5だった
		const { lw, lm } = option || { lw: this.lw, lm: this.lm }
		g.fillStyle = this.quescolor;
		g.vid = "chs1_"; g.fillRect(-lm, -lm, lw, boardHeight + lw);
		g.vid = "chs2_"; g.fillRect(boardWidth - lm, -lm, lw, boardHeight + lw);
		g.vid = "chs3_"; g.fillRect(-lm, -lm, boardWidth + lw, lw);
		g.vid = "chs4_"; g.fillRect(-lm, boardHeight - lm, boardWidth + lw, lw);
	}
	drawChassis_ex1(boldflag: boolean) {
		const g = this.vinc('chassis_ex1', 'crispEdges', true);
		const bd = this.puzzle.board;

		let x1 = this.range.x1;
		let y1 = this.range.y1;
		let x2 = this.range.x2;
		let y2 = this.range.y2;
		if (x1 <= 0) { x1 = bd.minbx; } if (x2 > bd.maxbx) { x2 = bd.maxbx; }
		if (y1 <= 0) { y1 = bd.minby; } if (y2 > bd.maxby) { y2 = bd.maxby; }

		const lw = this.lw;
		const lm = this.lm;
		const boardWidth = bd.cols * this.cw;
		const boardHeight = bd.rows * this.ch;

		// extendcell==1も含んだ外枠の描画
		g.fillStyle = this.quescolor;
		g.vid = "chsex1_1_"; g.fillRect(-this.cw - lm, -this.ch - lm, lw, boardHeight + this.ch + lw);
		g.vid = "chsex1_2_"; g.fillRect(boardWidth - lm, -this.ch - lm, lw, boardHeight + this.ch + lw);
		g.vid = "chsex1_3_"; g.fillRect(-this.cw - lm, -this.ch - lm, boardWidth + this.cw + lw, lw);
		g.vid = "chsex1_4_"; g.fillRect(-this.cw - lm, boardHeight - lm, boardWidth + this.cw + lw, lw);

		// 通常のセルとextendcell==1の間の描画
		if (boldflag) {
			// すべて太線で描画する場合
			g.vid = "chs1_"; g.fillRect(-lm, -lm, lw, boardHeight + lw - 1);
			g.vid = "chs2_"; g.fillRect(-lm, -lm, boardWidth + lw - 1, lw);
		}
		else {
			// ques==51のセルが隣接している時に細線を描画する場合
			g.vid = "chs1_"; g.fillRect(-0.5, -0.5, 1, boardHeight);
			g.vid = "chs2_"; g.fillRect(-0.5, -0.5, boardWidth, 1);

			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				const px = (cell.bx - 1) * this.bw;
				const py = (cell.by - 1) * this.bh;

				if (cell.bx === 1) {
					g.vid = `chs1_sub_${cell.by}`;
					if (cell.ques !== 51) { g.fillRect(-lm, py - lm, lw, this.ch + lw); } else { g.vhide(); }
				}

				if (cell.by === 1) {
					g.vid = `chs2_sub_${cell.bx}`;
					if (cell.ques !== 51) { g.fillRect(px - lm, -lm, this.cw + lw, lw); } else { g.vhide(); }
				}
			}
		}
	}

}