// Graphic.js v3.4.1

import { Position } from "./Address";
import { Puzzle } from "./Puzzle";
import { CellList, CrossList, BorderList, EXCellList } from "./PieceList";
import { BoardPiece, Border, Cell, EXCell } from "./Piece";
import { pzpr } from "../pzpr/core";
import { getEnv } from "../pzpr/env";
import { WrapperBase } from "../candle";


var CENTER = 1,
	BOTTOMLEFT = 2,
	BOTTOMRIGHT = 3,
	TOPRIGHT = 4,
	TOPLEFT = 5;

//---------------------------------------------------------------------------
// ★Graphicクラス Canvasに描画する
//---------------------------------------------------------------------------
// パズル共通 Canvas/DOM制御部
// Graphicクラスの定義

//---------------------------------------------------------
export class Graphic {
	puzzle: Puzzle
	pid: string
	imgtile: any
	constructor(puzzle: Puzzle) {
		this.puzzle = puzzle
		this.pid = puzzle.pid
		this.gridcolor = this.gridcolor_list[this.gridcolor_type] || this.gridcolor;

		// var pc = this;
		// [
		// 	['getQuesCellColor', this.fgcellcolor_func],
		// 	['getBGCellColor', this.bgcellcolor_func],
		// 	['getBorderColor', this.bordercolor_func],
		// 	['getQuesNumberColor', this.numbercolor_func],
		// 	['getCircleFillColor', this.circlefillcolor_func],
		// 	['getCircleStrokeColor', this.circlestrokecolor_func]
		// ].forEach(function (item) {
		// 	if (pc[item[0]] !== pzpr.common.Graphic.prototype[item[0]]) { return; } // パズル個別の関数が定義されている場合はそのまま使用
		// 	pc[item[0]] = pc[item[0] + '_' + item[1]] || pc[item[0]];
		// });

		this.resetRange();

		this.initColor();
		this.initFont();
	}

	context: WrapperBase<any> = null
	subcontext: any = null

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
	margin = 0.15

	// canvasの大きさを保持する
	canvasWidth: number | null = null
	canvasHeight: number | null = null

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
	range: {
		x1: number,
		x2: number,
		y1: number,
		y2: number,
		cells: CellList<Cell>,
		crosses: CrossList,
		borders: BorderList,
		excells: EXCellList
	} = null				// 描画領域を保持するオブジェクト

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

	//---------------------------------------------------------------------------
	// pc.initCanvas()       このオブジェクトで使用するキャンバスを設定する
	//---------------------------------------------------------------------------
	initCanvas() {
		var puzzle = this.puzzle;
		//@ts-ignore
		var g = this.context = (!!puzzle.canvas ? (puzzle.canvas as HTMLCanvasElement).getContext("2d") : null);
		//@ts-ignore
		if (g.use.canvas) {
			this.subcontext = (!!puzzle.subcanvas ? puzzle.subcanvas.getContext("2d") : null);
			this.useBuffer = !!this.subcontext;
		}

		if (this.canvasWidth === null || this.canvasHeight === null) {
			var rect = pzpr.util.getRect(puzzle.canvas);
			this.resizeCanvas(rect.width, rect.height);
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
		var configlist = this.puzzle.config.list;
		for (var key in configlist) {
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
		var isgothic = this.puzzle.getConfig('font') === 1;
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
		var insuspend = this.suspended;
		this.suspendAll();

		this.canvasWidth = cwid || this.canvasWidth;
		this.canvasHeight = chgt || this.canvasHeight;

		this.pendingResize = true;
		if (!insuspend) { this.unsuspend(); }
	}
	resizeCanvasByCellSize(cellsize: number) {
		var insuspend = this.suspended;
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
		var cwid = this.canvasWidth, chgt = this.canvasHeight;
		var cols = this.getCanvasCols(), rows = this.getCanvasRows();
		var cw = (cwid / cols) | 0, ch = (chgt / rows) | 0;

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
		var g = this.context, g2 = this.subcontext;
		var cwid = this.canvasWidth, chgt = this.canvasHeight;

		// canvas要素のサイズを変更する
		g.changeSize(cwid | 0, chgt | 0);
		if (!!g2) { g2.changeSize(cwid | 0, chgt | 0); }

		// 盤面のセルID:0が描画される左上の位置の設定 (Canvas左上からのオフセット)
		var x0 = this.x0 = (((cwid - this.cw * this.getBoardCols()) / 2 + this.cw * this.getOffsetCols()) | 0) + 0.5;
		var y0 = this.y0 = (((chgt - this.ch * this.getBoardRows()) / 2 + this.ch * this.getOffsetRows()) | 0) + 0.5;

		// CanvasのOffset位置変更 (SVGの時、小数点以下の端数調整を行う)
		if (!g.use.canvas) {
			var rect = pzpr.util.getRect(g.canvas);
			g.translate(x0 - (rect.left % 1), y0 - (rect.top % 1));
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
		var bd = this.puzzle.board;
		return (bd.maxbx - bd.minbx) / 2;
	}
	getBoardRows() {
		var bd = this.puzzle.board;
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
			var bd = this.puzzle.board;
			this.setRange(bd.minbx - 2, bd.minby - 2, bd.maxbx + 2, bd.maxby + 2);
			this.suspendedAll = false;
		}
		if (this.suspended) {
			this.suspended = false;
			this.prepaint();
		}
	}

	//---------------------------------------------------------------------------
	// pc.prepaint()    paint関数を呼び出す
	// pc.paint()       座標(x1,y1)-(x2,y2)を再描画する。各パズルのファイルでオーバーライドされる。
	//
	// pc.setRange()       rangeオブジェクトを設定する
	// pc.setRangeObject() 描画対象となるオブジェクトを取得する
	// pc.resetRange()     rangeオブジェクトを初期化する
	//---------------------------------------------------------------------------
	prepaint() {
		if (this.suspended || !this.context) { return; }

		this.isSupportMaxWidth = ((this.context.use.svg && pzpr.env.API.svgTextLength) ||
			(this.context.use.canvas && pzpr.env.API.maxWidth));

		var bd = this.puzzle.board, bm = 2 * this.margin,
			x1 = this.range.x1, y1 = this.range.y1,
			x2 = this.range.x2, y2 = this.range.y2;
		if (x1 > x2 || y1 > y2 || x1 >= bd.maxbx + bm || y1 >= bd.maxby + bm || x2 <= bd.minbx - bm || y2 <= bd.minby - (bm + (this.pid === 'starbattle' ? 2 : 0))) {
			/* 入力が範囲外ならば何もしない */
		}
		else if (!this.useBuffer) {
			this.setRangeObject(x1, y1, x2, y2);
			this.flushCanvas();
			this.paint();
		}
		else {
			var g = this.context, g2 = this.subcontext;
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
		var bd = this.puzzle.board;
		this.range.cells = bd.cellinside(x1, y1, x2, y2);
		this.range.crosses = bd.crossinside(x1, y1, x2, y2);
		this.range.borders = bd.borderinside(x1, y1, x2, y2);
		this.range.excells = bd.excellinside(x1, y1, x2, y2);
	}
	resetRange() {
		var puzzle = this.puzzle, bd = puzzle.board
		this.range = {
			x1: bd.maxbx + 1,
			y1: bd.maxby + 1,
			x2: bd.minbx - 1,
			y2: bd.minby - 1,
			cells: (new CellList(this.puzzle)),
			crosses: (new CrossList(this.puzzle)),
			borders: (new BorderList(this.puzzle)),
			excells: (new EXCellList(this.puzzle))
		}
	}

	//---------------------------------------------------------------------------
	// pc.copyBufferData()    Bufferに描画したデータを盤面へコピーする
	//---------------------------------------------------------------------------
	copyBufferData(g: CanvasRenderingContext2D | WrapperBase<any>, g2: any, x1: number, y1: number, x2: number, y2: number) {
		// source側はtaranslateのぶん足されていないので、加算しておきます
		var sx1 = this.x0 + x1 * this.bw - 1, sy1 = this.y0 + y1 * this.bh - 1,
			sx2 = this.x0 + x2 * this.bw + 2, sy2 = this.y0 + y2 * this.bh + 2;
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
		var bd = this.puzzle.board;
		this.paintRange(bd.minbx - 2, bd.minby - 2, bd.maxbx + 2, bd.maxby + 2);
	}

	//---------------------------------------------------------------------------
	// pc.getNewLineColor() 新しい色を返す
	//---------------------------------------------------------------------------
	getNewLineColor() {
		var loopcount = 0;

		while (1) {
			var Rdeg = ((Math.random() * 384) | 0) - 64; if (Rdeg < 0) { Rdeg = 0; } if (Rdeg > 255) { Rdeg = 255; }
			var Gdeg = ((Math.random() * 384) | 0) - 64; if (Gdeg < 0) { Gdeg = 0; } if (Gdeg > 255) { Gdeg = 255; }
			var Bdeg = ((Math.random() * 384) | 0) - 64; if (Bdeg < 0) { Bdeg = 0; } if (Bdeg > 255) { Bdeg = 255; }

			// HLSの各組成値を求める
			var Cmax = Math.max(Rdeg, Math.max(Gdeg, Bdeg));
			var Cmin = Math.min(Rdeg, Math.min(Gdeg, Bdeg));

			var Hdeg = 0;
			var Ldeg = (Cmax + Cmin) * 0.5 / 255;
			var Sdeg = (Cmax === Cmin ? 0 : (Cmax - Cmin) / ((Ldeg <= 0.5) ? (Cmax + Cmin) : (2 * 255 - Cmax - Cmin)));

			if (Cmax === Cmin) { Hdeg = 0; }
			else if (Rdeg >= Gdeg && Rdeg >= Bdeg) { Hdeg = (60 * (Gdeg - Bdeg) / (Cmax - Cmin) + 360) % 360; }
			else if (Gdeg >= Rdeg && Gdeg >= Bdeg) { Hdeg = (120 + 60 * (Bdeg - Rdeg) / (Cmax - Cmin) + 360) % 360; }
			else if (Bdeg >= Gdeg && Bdeg >= Rdeg) { Hdeg = (240 + 60 * (Rdeg - Gdeg) / (Cmax - Cmin) + 360) % 360; }

			// YCbCrのYを求める
			var Ydeg = (0.29891 * Rdeg + 0.58661 * Gdeg + 0.11448 * Bdeg) / 255;

			if ((this.minYdeg < Ydeg && Ydeg < this.maxYdeg) && (Math.abs(this.lastYdeg - Ydeg) > 0.15) && (Sdeg < 0.02 || 0.40 < Sdeg) &&
				(((360 + this.lastHdeg - Hdeg) % 360 >= 45) && ((360 + this.lastHdeg - Hdeg) % 360 <= 315))) {
				this.lastHdeg = Hdeg;
				this.lastYdeg = Ydeg;
				//alert("rgb("+Rdeg+", "+Gdeg+", "+Bdeg+")\nHLS("+(Hdeg|0)+", "+(""+((Ldeg*1000)|0)*0.001).slice(0,5)+", "+(""+((Sdeg*1000|0))*0.001).slice(0,5)+")\nY("+(""+((Ydeg*1000)|0)*0.001).slice(0,5)+")");
				return "rgb(" + Rdeg + "," + Gdeg + "," + Bdeg + ")";
			}

			loopcount++;
			if (loopcount > 100) { return "rgb(" + Rdeg + "," + Gdeg + "," + Bdeg + ")"; }
		}
	}

	//---------------------------------------------------------------------------
	// pc.repaintBlocks()  色分け時にブロックを再描画する
	// pc.repaintLines()   ひとつながりの線を再描画する
	// pc.repaintParts()   repaintLine()関数で、さらに上から描画しなおしたい処理を書く
	//                     canvas描画時のみ呼ばれます(他は描画しなおす必要なし)
	//---------------------------------------------------------------------------
	repaintBlocks(clist: CellList<Cell>) {
		clist.draw();
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
		var g = this.vinc('background', 'crispEdges', true);
		var bw = this.bw, bh = this.bh, fm = (this.margin > 0.15 ? this.margin : 0);
		var bd = this.puzzle.board;
		var minbx = bd.minbx - fm;
		var minby = bd.minby - fm;
		var bwidth = bd.maxbx + fm - minbx;
		var bheight = bd.maxby + fm - minby;

		g.vid = "BG";
		g.fillStyle = this.bgcolor;
		g.fillRect(minbx * bw - 0.5, minby * bh - 0.5, bwidth * bw + 1, bheight * bh + 1);
	}

	//---------------------------------------------------------------------------
	// pc.vinc()  レイヤーを返す
	//---------------------------------------------------------------------------
	vinc(layerid: string, rendering: string, freeze: boolean = false) {
		var g = this.context, option = { freeze: !!freeze, rendering: null as string | null };
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

		var realsize = ((this.cw * (option.ratio || this.fontsizeratio)) | 0);
		var maxLength: number | null = null;
		var widtharray = option.width || this.fontwidth;
		var widthratiopos = (text.length <= widtharray.length + 1 ? text.length - 2 : widtharray.length - 1);
		var widthratio = (widthratiopos >= 0 ? widtharray[widthratiopos] * text.length : null);
		if (this.isSupportMaxWidth) {	// maxLengthサポートブラウザ
			maxLength = (!!widthratio ? (realsize * widthratio) : null);
		}
		else {						// maxLength非サポートブラウザ
			if (!!widthratio) { realsize = (realsize * widthratio * 1.5 / text.length) | 0; }
		}

		var style = (option.style ? option.style + " " : "");
		g.font = style + realsize + "px " + this.fontfamily;

		var hoffset = this.bw * (option.hoffset || 0.9);
		var voffset = this.bh * (option.voffset || 0.82);
		var position = option.position || CENTER;
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
		this.drawCells_common("c_fullf_", this.getQuesCellColor);
	}
	getQuesCellColor(cell: Cell) {
		return this.getQuesCellColor_ques(cell)
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
		this.drawCells_common("c_fulls_", this.getShadedCellColor);
	}
	getShadedCellColor(cell: Cell) {
		if (cell.qans !== 1) { return null; }
		var info = cell.error || cell.qinfo;
		if (info === 1) { return this.errcolor1; }
		else if (info === 2) { return this.errcolor2; }
		else if (cell.trial) { return this.trialcolor; }
		else if (this.puzzle.execConfig('irowakeblk')) { return cell.sblk.color; }
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
	getBGCellColor(cell: Cell) {
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
		var info = cell.error || cell.qinfo;
		if (info === 1) { return this.errbcolor1; }
		else if (info === 2) { return this.errbcolor2; }
		return null;
	}
	getBGCellColor_qcmp(cell: Cell) {
		if (cell.error === 1 || cell.qinfo === 1) { return this.errbcolor1; }
		else if (this.puzzle.execConfig('autocmp') && !!cell.room && cell.room.cmp) { return this.qcmpbgcolor; }
		return null;
	}
	getBGCellColor_qcmp1(cell: Cell) {
		if (cell.error === 1 || cell.qinfo === 1) { return this.errbcolor1; }
		else if (cell.qsub === 1) { return this.bcolor; }
		else if (this.puzzle.execConfig('autocmp') && !!cell.room && cell.room.cmp) { return this.qcmpbgcolor; }
		return null;
	}
	getBGCellColor_qsub1(cell: Cell) {
		if ((cell.error || cell.qinfo) === 1) { return this.errbcolor1; }
		else if (cell.qsub === 1) { return this.bcolor; }
		return null;
	}
	getBGCellColor_qsub2(cell: Cell) {
		this.bcolor = "silver"; /* 数字入力で背景が消えないようにする応急処置 */
		if ((cell.error || cell.qinfo) === 1) { return this.errbcolor1; }
		else if (cell.qsub === 1) { return this.qsubcolor1; }
		else if (cell.qsub === 2) { return this.qsubcolor2; }
		return null;
	}
	getBGCellColor_qsub3(cell: Cell) {
		if ((cell.error || cell.qinfo) === 1) { return this.errbcolor1; }
		else if (cell.qsub === 1) { return this.qsubcolor1; }
		else if (cell.qsub === 2) { return this.qsubcolor2; }
		else if (cell.qsub === 3) { return this.qsubcolor3; }
		return null;
	}
	getBGCellColor_icebarn(cell: Cell) {
		if (cell.error === 1 || cell.qinfo === 1) {
			if (cell.ques === 6) { return this.erricecolor; }
			else { return this.errbcolor1; }
		}
		else if (cell.ques === 6) { return this.icecolor; }
		return null;
	}

	//---------------------------------------------------------------------------
	// pc.drawCells_common()  drawShadedCells, drawQuesCells, drawBGCellsの共通ルーチン
	//---------------------------------------------------------------------------
	drawCells_common(header: string, colorfunc: (cell: Cell) => string | null) {
		var g = this.context;
		var clist = this.range.cells;
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i], color = colorfunc(cell);
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
		var g = this.vinc('excell_back', 'crispEdges', true);

		var exlist = this.range.excells;
		for (var i = 0; i < exlist.length; i++) {
			var excell = exlist[i], color = this.getBGEXcellColor(excell);

			g.vid = "ex_full_" + excell.id;
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
		var g = this.vinc('cell_dot', 'auto', true);

		var dsize = Math.max(this.cw * 0.06, 2);
		var clist = this.range.cells;
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i];

			g.vid = "c_dot_" + cell.id;
			if (cell.qsub === 1) {
				g.fillStyle = (!cell.trial ? this.qanscolor : this.trialcolor);
				g.fillCircle(cell.bx * this.bw, cell.by * this.bh, dsize);
			}
			else { g.vhide(); }
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawCellArrows() 矢印だけをCanvasに書き込む
	//---------------------------------------------------------------------------
	drawCellArrows() {
		var g = this.vinc('cell_arrow', 'auto');
		var al, aw, tl, tw;

		if (this.pid !== "nagare") {
			al = this.cw * 0.4;		// ArrowLength
			aw = this.cw * 0.03;		// ArrowWidth
			tl = this.cw * 0.16;		// 矢じりの長さの座標(中心-長さ)
			tw = this.cw * 0.16;		// 矢じりの幅
		}
		else {
			/* 太い矢印 */
			al = this.cw * 0.35;		// ArrowLength
			aw = this.cw * 0.12;		// ArrowWidth
			tl = 0;					// 矢じりの長さの座標(中心-長さ)
			tw = this.cw * 0.35;		// 矢じりの幅
		}
		aw = (aw >= 1 ? aw : 1);
		tw = (tw >= 5 ? tw : 5);

		var clist = this.range.cells;
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i], dir = (!cell.numberAsObject ? cell.qdir : cell.getNum());
			var color = ((dir >= 1 && dir <= 4) ? this.getCellArrowColor(cell) : null);

			g.vid = "c_arrow_" + cell.id;
			if (!!color) {
				g.fillStyle = color;
				g.beginPath();
				var px = cell.bx * this.bw, py = cell.by * this.bh;
				switch (dir) {
					case cell.UP: g.setOffsetLinePath(px, py, 0, -al, -tw, -tl, -aw, -tl, -aw, al, aw, al, aw, -tl, tw, -tl, true); break;
					case cell.DN: g.setOffsetLinePath(px, py, 0, al, -tw, tl, -aw, tl, -aw, -al, aw, -al, aw, tl, tw, tl, true); break;
					case cell.LT: g.setOffsetLinePath(px, py, -al, 0, -tl, -tw, -tl, -aw, al, -aw, al, aw, -tl, aw, -tl, tw, true); break;
					case cell.RT: g.setOffsetLinePath(px, py, al, 0, tl, -tw, tl, -aw, -al, -aw, -al, aw, tl, aw, tl, tw, true); break;
				}
				g.fill();
			}
			else { g.vhide(); }
		}
	}
	getCellArrowColor(cell: Cell) {
		var dir = (!cell.numberAsObject ? cell.qdir : cell.getNum());
		if (dir >= 1 && dir <= 4) {
			if (!cell.numberAsObject || cell.qnum !== -1) { return this.quescolor; }
			else { return (!cell.trial ? this.qanscolor : this.trialcolor); }
		}
		return null;
	}

	//---------------------------------------------------------------------------
	// pc.drawSlashes() 斜線をCanvasに書き込む
	//---------------------------------------------------------------------------
	drawSlashes() {
		var g = this.vinc('cell_slash', 'auto');

		var basewidth = Math.max(this.bw / 4, 2);
		var irowake = this.puzzle.execConfig('irowake');

		var clist = this.range.cells;
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i];
			g.vid = "c_slash_" + cell.id;
			if (cell.qans !== 0) {
				var info = cell.error || cell.qinfo, addwidth = 0, color;
				if (this.pid === 'gokigen' || this.pid === 'wagiri') {
					if (cell.trial && this.puzzle.execConfig('irowake')) { addwidth = -basewidth / 2; }
					else if (info === 1 || info === 3) { addwidth = basewidth / 2; }
				}

				if (info === 1) { color = this.errcolor1; }
				else if (info === 2) { color = this.errcolor2; }
				else if (info === -1) { color = this.noerrcolor; }
				else if (irowake && cell.path.color) { color = cell.path.color; }
				else if (cell.trial) { color = this.trialcolor; }
				else { color = "black"; }

				g.lineWidth = basewidth + addwidth;
				g.strokeStyle = color;
				g.beginPath();
				var px = cell.bx * this.bw, py = cell.by * this.bh;
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
		this.drawNumbers_com(this.getAnsNumberText, this.getAnsNumberColor, 'cell_ans_text_', {});
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
		var g = this.context;
		var clist = this.range.cells;
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i];
			var text = textfunc(cell);
			g.vid = header + cell.id;
			if (!!text) {
				g.fillStyle = colorfunc(cell);
				this.disptext(text, cell.bx * this.bw, cell.by * this.bh, textoption);
			}
			else { g.vhide(); }
		}
	}
	getQuesNumberText(cell: Cell | EXCell) {
		return this.getNumberText(cell, (this.puzzle.execConfig('dispmove') ? (cell as Cell).base : cell).qnum);
	}
	getAnsNumberText(cell: Cell) {
		return this.getNumberText(cell, cell.anum);
	}
	getNumberText(cell: Cell | EXCell, num: number) {
		if (!(cell as Cell).numberAsLetter) {
			return this.getNumberTextCore(num);
		}
		else {
			return this.getNumberTextCore_letter(num);
		}
	}
	getNumberTextCore(num: number) {
		var hideHatena = (this.pid !== "yajirin" ? this.hideHatena : this.puzzle.getConfig('disptype_yajilin') === 2);
		return (num >= 0 ? "" + num : ((!hideHatena && num === -2) ? "?" : ""));
	}
	getNumberTextCore_letter(num: number) {
		var text = "" + num;
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
		var puzzle = this.puzzle;
		var info = cell.error || cell.qinfo;
		if (info === 1 || info === 4) {
			return this.errcolor1;
		}
		else if (puzzle.execConfig('dispmove') && puzzle.mouse.mouseCell === cell) {
			return this.movecolor;
		}
		return this.quescolor;
	}
	getQuesNumberColor_mixed(cell: Cell | EXCell) {
		var info = cell.error || cell.qinfo;
		if ((cell.ques >= 1 && cell.ques <= 5) || cell.qans === 1) {
			return this.fontShadecolor;
		}
		else if (info === 1 || info === 4) {
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
		var g = this.vinc('excell_number', 'auto');

		var exlist = this.range.excells;
		for (var i = 0; i < exlist.length; i++) {
			var excell = exlist[i];
			var text = this.getQuesNumberText(excell);

			g.vid = "excell_text_" + excell.id;
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
		var g = this.vinc('cell_subnumber', 'auto');
		var posarray = [5, 4, 2, 3];

		var clist = this.range.cells;
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i];
			for (var n = 0; n < 4; n++) {
				var text = (!cell.numberAsLetter ? this.getNumberTextCore(cell.snum[n]) : this.getNumberTextCore_letter(cell.snum[n]));
				g.vid = "cell_subtext_" + cell.id + "_" + n;
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
		var g = this.vinc('cell_arrownumber', 'auto');

		var al = this.cw * 0.4;		// ArrowLength
		var aw = this.cw * 0.03;		// ArrowWidth
		var tl = this.cw * 0.16;		// 矢じりの長さの座標(中心-長さ)
		var tw = this.cw * 0.12;		// 矢じりの幅
		var dy = -this.bh * 0.6;
		var dx = [this.bw * 0.6, this.bw * 0.7, this.bw * 0.8, this.bw * 0.85];

		var clist = this.range.cells;
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i], dir = cell.qdir;
			var text = this.getQuesNumberText(cell);
			var px = cell.bx * this.bw, py = cell.by * this.bh;
			var digit = text.length - 1;

			if (!!text) {
				g.fillStyle = this.getQuesNumberColor(cell);
			}

			// 矢印の描画
			g.vid = "cell_arrow_" + cell.id;
			if (!!text && dir !== cell.NDIR) {
				g.beginPath();
				switch (dir) {
					case cell.UP: g.setOffsetLinePath(px + dx[digit], py, 0, -al, -tw, -tl, -aw, -tl, -aw, al, aw, al, aw, -tl, tw, -tl, true); break;
					case cell.DN: g.setOffsetLinePath(px + dx[digit], py, 0, al, -tw, tl, -aw, tl, -aw, -al, aw, -al, aw, tl, tw, tl, true); break;
					case cell.LT: g.setOffsetLinePath(px, py + dy, -al, 0, -tl, -tw, -tl, -aw, al, -aw, al, aw, -tl, aw, -tl, tw, true); break;
					case cell.RT: g.setOffsetLinePath(px, py + dy, al, 0, tl, -tw, tl, -aw, -al, -aw, -al, aw, tl, aw, tl, tw, true); break;
				}
				g.fill();
			}
			else { g.vhide(); }

			// 数字の描画
			g.vid = "cell_arnum_" + cell.id;
			if (!!text) {
				var option = { ratio: 0.8 };
				if (dir !== cell.NDIR) { option.ratio = 0.7; }

				if (dir === cell.UP || dir === cell.DN) { px -= this.cw * 0.1; }
				else if (dir === cell.LT || dir === cell.RT) { py += this.ch * 0.1; }

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
		this.drawNumbers_com(this.getQuesNumberText, this.getQuesNumberColor, 'cell_text_', { ratio: 0.65 });
	}

	//---------------------------------------------------------------------------
	// pc.drawCrosses()    Crossの丸数字をCanvasに書き込む
	// pc.drawCrossMarks() Cross上の黒点をCanvasに書き込む
	//---------------------------------------------------------------------------
	drawCrosses() {
		var g = this.vinc('cross_base', 'auto', true);

		var csize = this.cw * this.crosssize + 1;
		g.lineWidth = 1;

		var option = { ratio: 0.6 };
		var clist = this.range.crosses;
		for (var i = 0; i < clist.length; i++) {
			var cross = clist[i], px = cross.bx * this.bw, py = cross.by * this.bh;

			// ○の描画
			g.vid = "x_cp_" + cross.id;
			if (cross.qnum !== -1) {
				g.fillStyle = (cross.error === 1 || cross.qinfo === 1 ? this.errcolor1 : "white");
				g.strokeStyle = "black";
				g.shapeCircle(px, py, csize);
			}
			else { g.vhide(); }

			// 数字の描画
			g.vid = "cross_text_" + cross.id;
			if (cross.qnum >= 0) {
				g.fillStyle = this.quescolor;
				this.disptext("" + cross.qnum, px, py, option);
			}
			else { g.vhide(); }
		}
	}
	drawCrossMarks() {
		var g = this.vinc('cross_mark', 'auto', true);

		var csize = this.cw * this.crosssize;
		var clist = this.range.crosses;
		for (var i = 0; i < clist.length; i++) {
			var cross = clist[i];

			g.vid = "x_cm_" + cross.id;
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
		var g = this.context;

		var blist = this.range.borders;
		for (var i = 0; i < blist.length; i++) {
			var border = blist[i], color = this.getBorderColor(border);

			g.vid = header + border.id;
			if (!!color) {
				var px = border.bx * this.bw, py = border.by * this.bh;
				var lm = (this.lw + this.addlw) / 2;
				g.fillStyle = color;
				if (border.isVert()) { g.fillRectCenter(px, py, lm, this.bh + lm); }
				else { g.fillRectCenter(px, py, this.bw + lm, lm); }
			}
			else { g.vhide(); }
		}
	}

	getBorderColor(border: Border) {
		return this.getBorderColor_ques(border)
	}
	getBorderColor_ques(border: Border) {
		if (border.isBorder()) { return this.quescolor; }
		return null;
	}
	getBorderColor_qans(border: Border) {
		var err = border.error || border.qinfo;
		if (border.isBorder()) {
			if (err === 1) { return this.errcolor1; }
			else if (err === -1) { return this.noerrcolor; }
			else if (border.trial) { return this.trialcolor; }
			else { return this.qanscolor; }
		}
		return null;
	}
	getBorderColor_ice(border: Border) {
		var cell1 = border.sidecell[0], cell2 = border.sidecell[1];
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
	// pc.drawBoxBorders()  境界線と黒マスの間の線を描画する
	//---------------------------------------------------------------------------
	drawBorderQsubs() {
		var g = this.vinc('border_qsub', 'crispEdges', true);

		var m = this.cw * 0.15; //Margin
		var blist = this.range.borders;
		for (var i = 0; i < blist.length; i++) {
			var border = blist[i];

			g.vid = "b_qsub1_" + border.id;
			if (border.qsub === 1) {
				var px = border.bx * this.bw, py = border.by * this.bh;
				g.fillStyle = (!border.trial ? this.pekecolor : this.trialcolor);
				if (border.isHorz()) { g.fillRectCenter(px, py, 0.5, this.bh - m); }
				else { g.fillRectCenter(px, py, this.bw - m, 0.5); }
			}
			else { g.vhide(); }
		}
	}

	// 外枠がない場合は考慮していません
	drawBoxBorders(tileflag: boolean) {
		var g = this.vinc('boxborder', 'crispEdges');

		var lm = this.lm;
		var cw = this.cw;
		var ch = this.ch;

		g.strokeStyle = this.bbcolor;
		g.lineWidth = 1;

		var clist = this.range.cells;
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i], isdraw = (cell.qans === 1);
			if (this.pid === 'stostone' && this.puzzle.board.falling) { isdraw = false; }

			g.vid = "c_bb_" + cell.id;
			if (isdraw) {
				var px = (cell.bx - 1) * this.bw, py = (cell.by - 1) * this.bh;
				var px0 = px - 0.5, px1 = px + lm + 0.5, px2 = px + cw - lm - 0.5, px3 = px + cw + 0.5;
				var py0 = py - 0.5, py1 = py + lm + 0.5, py2 = py + ch - lm - 0.5, py3 = py + ch + 0.5;

				// この関数を呼ぶ場合は全てhasborder===1なので
				// 外枠用の考慮部分を削除しています。
				var adb = cell.adjborder;
				var UPin = (cell.by > 2), DNin = (cell.by < 2 * this.puzzle.board.rows - 2);
				var LTin = (cell.bx > 2), RTin = (cell.bx < 2 * this.puzzle.board.cols - 2);

				var isUP = (!UPin || adb.top.ques === 1);
				var isDN = (!DNin || adb.bottom.ques === 1);
				var isLT = (!LTin || adb.left.ques === 1);
				var isRT = (!RTin || adb.right.ques === 1);

				var isUL = (!UPin || !LTin || cell.relbd(-2, -1).ques === 1 || cell.relbd(-1, -2).ques === 1);
				var isUR = (!UPin || !RTin || cell.relbd(2, -1).ques === 1 || cell.relbd(1, -2).ques === 1);
				var isDL = (!DNin || !LTin || cell.relbd(-2, 1).ques === 1 || cell.relbd(-1, 2).ques === 1);
				var isDR = (!DNin || !RTin || cell.relbd(2, 1).ques === 1 || cell.relbd(1, 2).ques === 1);

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
		var g = this.vinc('line', 'crispEdges');

		var blist = this.range.borders;
		for (var i = 0; i < blist.length; i++) {
			var border = blist[i], color = this.getLineColor(border);

			g.vid = "b_line_" + border.id;
			if (!!color) {
				var px = border.bx * this.bw, py = border.by * this.bh;
				var isvert = (this.puzzle.board.borderAsLine === border.isVert());
				var lm = this.lm + this.addlw / 2;

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
			var info = border.error || border.qinfo, puzzle = this.puzzle;
			var isIrowake = (puzzle.execConfig('irowake') && border.path && border.path.color);
			var isDispmove = puzzle.execConfig('dispmove');

			if (border.trial && puzzle.execConfig('irowake')) { this.addlw = -this.lm; }
			else if (info === 1) { this.addlw = 1; }

			if (info === 1) { return this.errlinecolor; }
			else if (info === -1) { return this.noerrcolor; }
			else if (isDispmove) { return (border.trial ? this.movetrialcolor : this.movelinecolor); }
			else if (isIrowake) { return border.path.color; }
			else { return (border.trial ? this.trialcolor : this.linecolor); }
		}
		return null;
	}

	//---------------------------------------------------------------------------
	// pc.drawTip()    動いたことを示す矢印のやじりを書き込む
	//---------------------------------------------------------------------------
	drawTip() {
		var g = this.vinc('cell_linetip', 'auto');

		var tsize = this.cw * 0.30;
		var tplus = this.cw * 0.05;

		var clist = this.range.cells;
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i], dir = 0, border = null;
			if (cell.lcnt === 1 && cell.qnum === -1 && !this.puzzle.execConfig('dispmove')) {
				var adb = cell.adjborder;
				if (adb.top.isLine()) { dir = 2; border = adb.top; }
				else if (adb.bottom.isLine()) { dir = 1; border = adb.bottom; }
				else if (adb.left.isLine()) { dir = 4; border = adb.left; }
				else if (adb.right.isLine()) { dir = 3; border = adb.right; }
			}

			g.vid = "c_tip_" + cell.id;
			if (dir !== 0) {
				g.strokeStyle = this.getLineColor(border) || this.linecolor;
				g.lineWidth = this.lw + this.addlw; //LineWidth

				g.beginPath();
				var px = cell.bx * this.bw + 1, py = cell.by * this.bh + 1;
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
		var g = this.vinc('border_peke', 'auto', true);

		var size = this.cw * 0.15 + 1; if (size < 4) { size = 4; }
		g.lineWidth = 1 + (this.cw / 40) | 0;

		var blist = this.range.borders;
		for (var i = 0; i < blist.length; i++) {
			var border = blist[i];
			g.vid = "b_peke_" + border.id;
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
		var g = this.vinc('cross_mark', 'auto', true);
		g.fillStyle = this.quescolor;

		var size = this.cw / 10;
		var clist = this.range.crosses;
		for (var i = 0; i < clist.length; i++) {
			var cross = clist[i];
			g.vid = "x_cm_" + cross.id;
			g.fillCircle(cross.bx * this.bw, cross.by * this.bh, size / 2);
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawTriangle()   三角形をCanvasに書き込む
	// pc.drawTriangle1()  三角形をCanvasに書き込む(1マスのみ)
	//---------------------------------------------------------------------------
	drawTriangle() {
		var g = this.vinc('cell_triangle', 'auto');

		var clist = this.range.cells;
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i], num = (cell.ques !== 0 ? cell.ques : cell.qans);

			g.vid = "c_tri_" + cell.id;
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
	drawTriangle1(px: number, py: number, num: number) {
		var g = this.context;
		var mgn = (this.pid === "reflect" ? 1 : 0), bw = this.bw + 1 - mgn, bh = this.bh + 1 - mgn;
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
		var g = this.vinc('cell_mb', 'auto', true);
		g.lineWidth = 1;

		var rsize = this.cw * 0.35;
		var clist = this.range.cells;
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i], px = 0, py = 0;
			if (cell.qsub > 0) {
				px = cell.bx * this.bw; py = cell.by * this.bh;
				g.strokeStyle = (!cell.trial ? this.mbcolor : "rgb(192, 192, 192)");
			}

			g.vid = "c_MB1_" + cell.id;
			if (cell.qsub === 1) { g.strokeCircle(px, py, rsize); } else { g.vhide(); }

			g.vid = "c_MB2_" + cell.id;
			if (cell.qsub === 2) { g.strokeCross(px, py, rsize); } else { g.vhide(); }
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawCircles()          数字や白丸黒丸等を表すCellの丸を書き込む
	// pc.getCircleStrokeColor() 描画する円の線の色を設定する
	// pc.getCircleFillColor()   描画する円の背景色を設定する
	//---------------------------------------------------------------------------
	drawCircles() {
		var g = this.vinc('cell_circle', 'auto', true);

		var ra = this.circleratio;
		var rsize_stroke = this.cw * (ra[0] + ra[1]) / 2, rsize_fill = this.cw * ra[0];

		/* fillとstrokeの間に線を描画するスキマを与える */
		if (this.pid === 'loopsp') { rsize_fill -= this.cw * 0.10; }

		var clist = this.range.cells;
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i];

			var color = this.getCircleFillColor(cell);
			g.vid = "c_cirb_" + cell.id;
			if (!!color) {
				g.fillStyle = color;
				g.fillCircle(cell.bx * this.bw, cell.by * this.bh, rsize_fill);
			}
			else { g.vhide(); }
		}

		g = this.vinc('cell_circle_stroke', 'auto', true);
		g.lineWidth = Math.max(this.cw * (ra[0] - ra[1]), 1);

		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i];

			var color = this.getCircleStrokeColor(cell);
			g.vid = "c_cira_" + cell.id;
			if (!!color) {
				g.strokeStyle = color;
				g.strokeCircle(cell.bx * this.bw, cell.by * this.bh, rsize_stroke);
			}
			else { g.vhide(); }
		}
	}

	getCircleStrokeColor(cell: Cell) {
		return this.getCircleStrokeColor_qnum(cell)
	}
	getCircleStrokeColor_qnum(cell: Cell) {
		var puzzle = this.puzzle, error = cell.error || cell.qinfo;
		var isdrawmove = puzzle.execConfig('dispmove');
		var num = (!isdrawmove ? cell : cell.base).qnum;
		if (num !== -1) {
			if (isdrawmove && puzzle.mouse.mouseCell === cell) { return this.movecolor; }
			else if (error === 1 || error === 4) { return this.errcolor1; }
			else { return this.quescolor; }
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
		return this.getCircleFillColor_qnum(cell)
	}
	getCircleFillColor_qnum(cell: Cell) {
		if (cell.qnum !== -1) {
			var error = cell.error || cell.qinfo;
			if (error === 1 || error === 4) { return this.errbcolor1; }
			else { return this.circlebasecolor; }
		}
		return null;
	}
	getCircleFillColor_qnum2(cell: Cell) {
		if (cell.qnum === 1) {
			return (cell.error === 1 ? this.errbcolor1 : "white");
		}
		else if (cell.qnum === 2) {
			return (cell.error === 1 ? this.errcolor1 : this.quescolor);
		}
		return null;
	}
	getCircleFillColor_qcmp(cell: Cell) {
		var puzzle = this.puzzle, error = cell.error || cell.qinfo;
		var isdrawmove = puzzle.execConfig('dispmove');
		var num = (!isdrawmove ? cell : cell.base).qnum;
		if (num !== -1) {
			if (error === 1 || error === 4) { return this.errbcolor1; }
			else if (cell.isCmp()) { return this.qcmpcolor; }
			else { return this.circlebasecolor; }
		}
		return null;
	}

	//---------------------------------------------------------------------------
	// pc.drawDepartures()    移動系パズルで、移動元を示す記号を書き込む
	//---------------------------------------------------------------------------
	drawDepartures() {
		var g = this.vinc('cell_depart', 'auto', true);
		g.fillStyle = this.movelinecolor;

		var rsize = this.cw * 0.15;
		var isdrawmove = this.puzzle.execConfig('dispmove');
		var clist = this.range.cells;
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i];

			g.vid = "c_dcir_" + cell.id;
			if (isdrawmove && cell.isDeparture()) {
				var px = cell.bx * this.bw, py = cell.by * this.bh;
				g.fillCircle(px, py, rsize);
			}
			else { g.vhide(); }
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawLineParts()   ╋などをCanvasに書き込む
	//---------------------------------------------------------------------------
	drawLineParts() {
		var g = this.vinc('cell_lineparts', 'crispEdges');
		g.fillStyle = this.quescolor;

		var lm = this.lm, bw = this.bw, bh = this.bh;
		var clist = this.range.cells;
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i], qu = cell.ques;

			g.vid = "c_lp_" + cell.id;
			if (qu >= 11 && qu <= 17) {
				var px = cell.bx * this.bw, py = cell.by * this.bh;
				var px0 = px - bw - 0.5, px1 = px - lm, px2 = px + lm, px3 = px + bw + 0.5;
				var py0 = py - bh - 0.5, py1 = py - lm, py2 = py + lm, py3 = py + bh + 0.5;

				var flag = { 11: 15, 12: 3, 13: 12, 14: 9, 15: 5, 16: 6, 17: 10 }[qu] as number;
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
		var g = this.vinc('cell_tateyoko', 'crispEdges');
		var lm = Math.max(this.cw / 6, 3) / 2;	//LineWidth

		var clist = this.range.cells;
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i], px = cell.bx * this.bw, py = cell.by * this.bh;
			var qa = cell.qans;

			g.vid = "c_bar1_" + cell.id;
			if (qa === 11 || qa === 12) {
				g.fillStyle = this.getBarColor(cell, true);
				g.fillRectCenter(px, py, lm + this.addlw / 2, this.bh);
			}
			else { g.vhide(); }

			g.vid = "c_bar2_" + cell.id;
			if (qa === 11 || qa === 13) {
				g.fillStyle = this.getBarColor(cell, false);
				g.fillRectCenter(px, py, this.bw, lm + this.addlw / 2);
			}
			else { g.vhide(); }
		}
		this.addlw = 0;
	}

	getBarColor(cell: Cell, vert: boolean) {
		var err = cell.error, isErr = (err === 1 || err === 4 || ((err === 5 && vert) || (err === 6 && !vert))), color = "";
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
		var g = this.vinc('cell_ques51', 'crispEdges', true);

		g.strokeStyle = this.quescolor;
		g.lineWidth = 1;
		var clist = this.range.cells;
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i];

			g.vid = "c_slash51_" + cell.id;
			if (cell.ques === 51) {
				var px = cell.bx * this.bw, py = cell.by * this.bh;
				g.strokeLine(px - this.bw, py - this.bh, px + this.bw, py + this.bh);
			}
			else { g.vhide(); }
		}
	}
	drawSlash51EXcells() {
		var g = this.vinc('excell_ques51', 'crispEdges', true);

		g.strokeStyle = this.quescolor;
		g.lineWidth = 1;
		var exlist = this.range.excells;
		for (var i = 0; i < exlist.length; i++) {
			var excell = exlist[i], px = excell.bx * this.bw, py = excell.by * this.bh;
			g.vid = "ex_slash51_" + excell.id;
			g.strokeLine(px - this.bw, py - this.bh, px + this.bw, py + this.bh);
		}
	}
	drawEXCellGrid() {
		var g = this.vinc('grid_excell', 'crispEdges', true);

		g.fillStyle = this.quescolor;
		var exlist = this.range.excells;
		for (var i = 0; i < exlist.length; i++) {
			var excell = exlist[i];
			var px = excell.bx * this.bw, py = excell.by * this.bh;

			g.vid = "ex_bdx_" + excell.id;
			if (excell.by === -1 && excell.bx < this.puzzle.board.maxbx) {
				g.fillRectCenter(px + this.bw, py, 0.5, this.bh);
			}
			else { g.vhide(); }

			g.vid = "ex_bdy_" + excell.id;
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

		var d = this.range;
		for (var bx = (d.x1 | 1); bx <= d.x2; bx += 2) {
			for (var by = (d.y1 | 1); by <= d.y2; by += 2) {
				var piece = this.puzzle.board.getobj(bx, by); /* cell or excell */
				if (!piece.isnull) { this.drawQuesNumbersOn51_1(piece); }
			}
		}
	}
	drawQuesNumbersOn51_1(piece: BoardPiece) { /* cell or excell */
		var g = this.context, val, adj, px = piece.bx * this.bw, py = piece.by * this.bh;
		var option = { ratio: 0.45, position: null as number | null };
		g.fillStyle = (piece.error === 1 || piece.qinfo === 1 ? this.errcolor1 : this.quescolor);

		adj = piece.relcell(2, 0);
		val = (piece.ques === 51 ? piece.qnum : -1);

		g.vid = [piece.group, piece.id, 'text_ques51_rt'].join('_');
		if (val >= 0 && !adj.isnull && adj.ques !== 51) {
			option.position = this.TOPRIGHT;
			this.disptext("" + val, px, py, option);
		}
		else { g.vhide(); }

		adj = piece.relcell(0, 2);
		val = (piece.ques === 51 ? piece.qnum2 : -1);

		g.vid = [piece.group, piece.id, 'text_ques51_dn'].join('_');
		if (val >= 0 && !adj.isnull && adj.ques !== 51) {
			option.position = this.BOTTOMLEFT;
			this.disptext("" + val, px, py, option);
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

	drawCursor(islarge: boolean, isdraw: boolean) {
		var g = this.vinc('target_cursor', 'crispEdges');

		var d = this.range, cursor = this.puzzle.cursor;
		if (cursor.bx < d.x1 - 1 || d.x2 + 1 < cursor.bx) { return; }
		if (cursor.by < d.y1 - 1 || d.y2 + 1 < cursor.by) { return; }

		var px = cursor.bx * this.bw, py = cursor.by * this.bh, w, size;
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
		var g = this.vinc('target_subnum', 'crispEdges');

		var d = this.range, cursor = this.puzzle.cursor;
		if (cursor.bx < d.x1 || d.x2 < cursor.bx) { return; }
		if (cursor.by < d.y1 || d.y2 < cursor.by) { return; }

		var target = cursor.targetdir;

		g.vid = "target_subnum";
		g.fillStyle = this.ttcolor;
		if (this.puzzle.playmode && target !== 0) {
			var bw = this.bw, bh = this.bh;
			var px = cursor.bx * bw + 0.5, py = cursor.by * bh + 0.5;
			var tw = bw * 0.8, th = bh * 0.8;
			if (target === 5) { g.fillRect(px - bw, py - bh, tw, th); }
			else if (target === 4) { g.fillRect(px + bw - tw, py - bh, tw, th); }
			else if (target === 2) { g.fillRect(px - bw, py + bh - th, tw, th); }
			else if (target === 3) { g.fillRect(px + bw - tw, py + bh - th, tw, th); }
		}
		else { g.vhide(); }
	}
	drawTargetTriangle() {
		var g = this.vinc('target_triangle', 'auto');

		var d = this.range, cursor = this.puzzle.cursor;
		if (cursor.bx < d.x1 || d.x2 < cursor.bx) { return; }
		if (cursor.by < d.y1 || d.y2 < cursor.by) { return; }

		var target = cursor.detectTarget();

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
		var g = this.vinc('centerline', 'crispEdges', true), bd = this.puzzle.board;

		var x1 = this.range.x1, y1 = this.range.y1, x2 = this.range.x2, y2 = this.range.y2;
		if (x1 < bd.minbx + 1) { x1 = bd.minbx + 1; } if (x2 > bd.maxbx - 1) { x2 = bd.maxbx - 1; }
		if (y1 < bd.minby + 1) { y1 = bd.minby + 1; } if (y2 > bd.maxby - 1) { y2 = bd.maxby - 1; }
		x1 -= (~x1 & 1); y1 -= (~y1 & 1); x2 += (~x2 & 1); y2 += (~y2 & 1); /* (x1,y1)-(x2,y2)を外側の奇数範囲まで広げる */

		var dotCount = (Math.max(this.cw / (this.cw / 10 + 3), 1) | 0);
		var dotSize = this.cw / (dotCount * 2);

		g.lineWidth = 1;
		g.strokeStyle = this.gridcolor;
		for (var i = x1; i <= x2; i += 2) {
			var px = i * this.bw, py1 = y1 * this.bh, py2 = y2 * this.bh;
			g.vid = "cliney_" + i;
			g.strokeDashedLine(px, py1, px, py2, [dotSize]);
		}
		for (var i = y1; i <= y2; i += 2) {
			var py = i * this.bh, px1 = x1 * this.bw, px2 = x2 * this.bw;
			g.vid = "clinex_" + i;
			g.strokeDashedLine(px1, py, px2, py, [dotSize]);
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawGrid()        セルの枠線(実線)をCanvasに書き込む
	// pc.drawDashedGrid()  セルの枠線(点線)をCanvasに書き込む
	//---------------------------------------------------------------------------
	drawGrid(haschassis: boolean, isdraw: boolean) {
		var g = this.vinc('grid', 'crispEdges', true), bd = this.puzzle.board;

		// 外枠まで描画するわけじゃないので、maxbxとか使いません
		var x1 = this.range.x1, y1 = this.range.y1, x2 = this.range.x2, y2 = this.range.y2;
		if (x1 < 0) { x1 = 0; } if (x2 > 2 * bd.cols) { x2 = 2 * bd.cols; }
		if (y1 < 0) { y1 = 0; } if (y2 > 2 * bd.rows) { y2 = 2 * bd.rows; }
		x1 -= (x1 & 1); y1 -= (y1 & 1); /* (x1,y1)を外側の偶数位置に移動する */
		if (x1 >= x2 || y1 >= y2) { return; }

		var bs = ((bd.hasborder !== 2 && haschassis !== false) ? 2 : 0), bw = this.bw, bh = this.bh;
		var xa = Math.max(x1, 0 + bs), xb = Math.min(x2, 2 * bd.cols - bs);
		var ya = Math.max(y1, 0 + bs), yb = Math.min(y2, 2 * bd.rows - bs);

		// isdraw!==false: 指定無しかtrueのときは描画する
		g.lineWidth = 1;
		g.strokeStyle = this.gridcolor;
		for (var i = xa; i <= xb; i += 2) {
			g.vid = "bdy_" + i;
			if (isdraw !== false) {
				var px = i * bw, py1 = y1 * bh, py2 = y2 * bh;
				g.strokeLine(px, py1, px, py2);
			}
			else { g.vhide(); }
		}
		for (var i = ya; i <= yb; i += 2) {
			g.vid = "bdx_" + i;
			if (isdraw !== false) {
				var py = i * bh, px1 = x1 * bw, px2 = x2 * bw;
				g.strokeLine(px1, py, px2, py);
			}
			else { g.vhide(); }
		}
	}
	drawDashedGrid(haschassis: boolean) {
		var g = this.vinc('grid', 'crispEdges', true), bd = this.puzzle.board;

		// 外枠まで描画するわけじゃないので、maxbxとか使いません
		var x1 = this.range.x1, y1 = this.range.y1, x2 = this.range.x2, y2 = this.range.y2;
		if (x1 < 0) { x1 = 0; } if (x2 > 2 * bd.cols) { x2 = 2 * bd.cols; }
		if (y1 < 0) { y1 = 0; } if (y2 > 2 * bd.rows) { y2 = 2 * bd.rows; }
		x1 -= (x1 & 1); y1 -= (y1 & 1); x2 += (x2 & 1); y2 += (y2 & 1); /* (x1,y1)-(x2,y2)を外側の偶数範囲に移動する */

		var dotCount = (Math.max(this.cw / (this.cw / 10 + 3), 1) | 0);
		var dotSize = this.cw / (dotCount * 2);

		var bs = ((haschassis !== false) ? 2 : 0), bw = this.bw, bh = this.bh;
		var xa = Math.max(x1, bd.minbx + bs), xb = Math.min(x2, bd.maxbx - bs);
		var ya = Math.max(y1, bd.minby + bs), yb = Math.min(y2, bd.maxby - bs);

		g.lineWidth = 1;
		g.strokeStyle = this.gridcolor;
		for (var i = xa; i <= xb; i += 2) {
			var px = i * bw, py1 = y1 * bh, py2 = y2 * bh;
			g.vid = "bdy_" + i;
			g.strokeDashedLine(px, py1, px, py2, [dotSize]);
		}
		for (var i = ya; i <= yb; i += 2) {
			var py = i * bh, px1 = x1 * bw, px2 = x2 * bw;
			g.vid = "bdx_" + i;
			g.strokeDashedLine(px1, py, px2, py, [dotSize]);
		}
	}

	//---------------------------------------------------------------------------
	// pc.drawChassis()     外枠をCanvasに書き込む
	// pc.drawChassis_ex1() bd.hasexcell==1の時の外枠をCanvasに書き込む
	//---------------------------------------------------------------------------
	drawChassis() {
		var g = this.vinc('chassis', 'crispEdges', true), bd = this.puzzle.board;

		// ex===0とex===2で同じ場所に描画するので、maxbxとか使いません
		var x1 = this.range.x1, y1 = this.range.y1, x2 = this.range.x2, y2 = this.range.y2;
		if (x1 < 0) { x1 = 0; } if (x2 > 2 * bd.cols) { x2 = 2 * bd.cols; }
		if (y1 < 0) { y1 = 0; } if (y2 > 2 * bd.rows) { y2 = 2 * bd.rows; }

		var boardWidth = bd.cols * this.cw, boardHeight = bd.rows * this.ch;
		var lw = this.lw, lm = this.lm;
		if (this.pid === 'bosanowa') { lw = 1; lm = 0.5; }
		g.fillStyle = this.quescolor;
		g.vid = "chs1_"; g.fillRect(-lm, -lm, lw, boardHeight + lw);
		g.vid = "chs2_"; g.fillRect(boardWidth - lm, -lm, lw, boardHeight + lw);
		g.vid = "chs3_"; g.fillRect(-lm, -lm, boardWidth + lw, lw);
		g.vid = "chs4_"; g.fillRect(-lm, boardHeight - lm, boardWidth + lw, lw);
	}
	drawChassis_ex1(boldflag: boolean) {
		var g = this.vinc('chassis_ex1', 'crispEdges', true), bd = this.puzzle.board;

		var x1 = this.range.x1, y1 = this.range.y1, x2 = this.range.x2, y2 = this.range.y2;
		if (x1 <= 0) { x1 = bd.minbx; } if (x2 > bd.maxbx) { x2 = bd.maxbx; }
		if (y1 <= 0) { y1 = bd.minby; } if (y2 > bd.maxby) { y2 = bd.maxby; }

		var lw = this.lw, lm = this.lm;
		var boardWidth = bd.cols * this.cw, boardHeight = bd.rows * this.ch;

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

			var clist = this.range.cells;
			for (var i = 0; i < clist.length; i++) {
				var cell = clist[i], px = (cell.bx - 1) * this.bw, py = (cell.by - 1) * this.bh;

				if (cell.bx === 1) {
					g.vid = "chs1_sub_" + cell.by;
					if (cell.ques !== 51) { g.fillRect(-lm, py - lm, lw, this.ch + lw); } else { g.vhide(); }
				}

				if (cell.by === 1) {
					g.vid = "chs2_sub_" + cell.bx;
					if (cell.ques !== 51) { g.fillRect(px - lm, -lm, this.cw + lw, lw); } else { g.vhide(); }
				}
			}
		}
	}

}