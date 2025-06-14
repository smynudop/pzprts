// Board.js v3.4.1
import type { Puzzle } from './Puzzle';
import {
	CellList,
	CrossList,
	BorderList,
	EXCellList,
	PieceList
} from './PieceList';
import {
	BoardPiece,
	Cell,
	Cross,
	Border,
	EXCell,
	type CellOption,
	type EXCellOption,
	type BorderOption,
	type CrossOption
} from './Piece';
import { LineGraph, type LineGraphOption } from './LineManager';
import {
	AreaRoomGraph,
	AreaShadeGraph,
	AreaUnshadeGraph,
	AreaNumberGraph,
	type AreaRoomGraphOption,
	type AreaShadeGraphOption,
	type AreaUnshadeGraphOption,
	type AreaNumberGraphOption
} from './AreaManager';
import type { GraphBase, GraphComponent, GraphComponentOption } from './GraphBase';
import { BoardExec, type IBoardOperation } from './BoardExec';
import { BoardClearOperation } from "./Operation"
//---------------------------------------------------------------------------
// ★Boardクラス 盤面の情報を保持する。Cell, Cross, Borderのオブジェクトも保持する
//---------------------------------------------------------------------------
// Boardクラスの定義

//---------------------------------------------------------

export type BoardOption = Partial<Board>

export type BoardChildOption = {
	boardExec?: any
	lineGraph?: LineGraphOption,
	areaRoomGraph?: AreaRoomGraphOption,
	areaShadeGraph?: AreaShadeGraphOption
	areaUnshadeGraph?: AreaUnshadeGraphOption
	areaNumberGraph?: Partial<AreaNumberGraph>
	graphComponent?: GraphComponentOption
	cell?: CellOption
	cross?: CrossOption
	border?: BorderOption
	excell?: EXCellOption
}

export type IGroup = 'cell' | 'cross' | 'border' | 'excell';
export type IGroup2 = 'cell' | 'cross' | 'border' | 'excell' | "obj" | "none";
export class Board<
	TCell extends Cell = Cell,
	TCross extends Cross = Cross,
	TBorder extends Border = Border,
	TEXCell extends EXCell = EXCell,
	TComponent extends GraphComponent = GraphComponent
> {
	puzzle: Puzzle
	minbx: number
	minby: number
	maxbx: number
	maxby: number
	diserror: number
	haserror: boolean
	hasinfo: boolean
	cell: CellList<TCell>
	cross: CrossList<TCross>
	border: BorderList<TBorder>
	excell: EXCellList
	nullobj: BoardPiece
	emptycell: TCell
	emptycross: TCross
	emptyborder: TBorder
	emptyexcell: TEXCell
	disrecinfo: number
	infolist: GraphBase[]
	linegraph: LineGraph
	roommgr: AreaRoomGraph<TComponent>
	sblkmgr: AreaShadeGraph
	ublkmgr: AreaUnshadeGraph
	nblkmgr: AreaNumberGraph
	exec: BoardExec
	trialstage: number
	falling = false


	cols = 10		/* 盤面の横幅(デフォルト) */
	rows = 10		/* 盤面の縦幅(デフォルト) */

	hascross = 2	// 1:盤面内側のCrossが操作可能なパズル 2:外枠上を含めてCrossが操作可能なパズル (どちらもCrossは外枠上に存在します)
	/**
	 * 1:Border/Lineが操作可能なパズル 2:外枠上も操作可能なパズル
	 */
	hasborder: 0 | 1 | 2 = 0

	/**
	 *  1:上・左側にセルを用意するパズル 2:四方にセルを用意するパズル
	 */
	hasexcell: 0 | 1 | 2 = 0
	borderAsLine = false	// 境界線をlineとして扱う
	disable_subclear = false	// "補助消去"ボタン不要

	celloption: CellOption | undefined
	borderoption: any | undefined
	crossoption: any | undefined

	excelloption: EXCellOption | undefined

	/**
	 * 補助記号の消去中にtrue
	 */
	subclearmode: boolean = false
	gcoption: any

	constructor(puzzle: Puzzle, option?: { board?: BoardOption } & BoardChildOption) {
		this.puzzle = puzzle;
		// 盤面の範囲
		this.minbx = 0;
		this.minby = 0;
		this.maxbx = 0;
		this.maxby = 0;

		this.rows = 10
		this.cols = 10
		this.hasexcell = 0

		// エラー設定可能状態かどうか
		this.diserror = 0;

		this.hasborder = 0
		this.borderAsLine = false

		// エラー表示中かどうか
		this.haserror = false;

		// Info表示中かどうか
		this.hasinfo = false;

		this.celloption = option?.cell

		Object.assign(this, option?.board)
		this.celloption = option?.cell || undefined
		this.borderoption = option?.border || undefined
		this.excelloption = option?.excell || undefined
		this.crossoption = option?.cross || undefined

		// 盤面上にあるセル・境界線等のオブジェクト
		this.cell = new CellList();
		this.cross = new CrossList();
		this.border = new BorderList();
		this.excell = new EXCellList();

		// 空オブジェクト
		this.nullobj = new BoardPiece(this.puzzle);
		this.emptycell = this.createCell();
		this.emptycross = this.createCross();
		this.emptyborder = this.createBorder();
		this.emptyexcell = this.createEXCell();

		this.createExtraObject();

		// 補助オブジェクト
		this.disrecinfo = 0;
		this.infolist = [];

		this.linegraph = this.addInfoListInstance(this.createLineGraph(option?.lineGraph, option?.graphComponent));			// 交差なし線のグラフ
		this.roommgr = this.addInfoListInstance(this.createAreaRoomGraph(option?.areaRoomGraph, option?.graphComponent));			// 部屋情報を保持する
		this.sblkmgr = this.addInfoListInstance(this.createAreaShadeGraph(option?.areaShadeGraph, option?.graphComponent));		// 黒マス情報を保持する
		this.ublkmgr = this.addInfoListInstance(this.createAreaUnshadeGraph(option?.areaUnshadeGraph, option?.graphComponent));		// 白マス情報を保持する
		this.nblkmgr = this.addInfoListInstance(this.createAreaNumberGraph(option?.areaNumberGraph, option?.graphComponent));		// 数字情報を保持する

		this.gcoption = option?.graphComponent

		this.addExtraInfo();

		this.exec = this.createBoardExec(option?.boardExec);
		this.exec.insex.cross = (this.hascross === 1 ? { 2: true } : { 0: true });

		this.trialstage = 0;	// TrialMode
	}
	createLineGraph(option: LineGraphOption | undefined, gcoption: GraphComponentOption | undefined) {
		if (option) option.enabled = true
		return new LineGraph(this.puzzle, option, gcoption)
	}

	createAreaRoomGraph(option: AreaRoomGraphOption | undefined, gcoption: GraphComponentOption | undefined) {
		if (option) option.enabled = true
		return new AreaRoomGraph<TComponent>(this.puzzle, option, gcoption)
	}

	createAreaShadeGraph(option: AreaShadeGraphOption | undefined, gcoption: GraphComponentOption | undefined) {
		if (option) option.enabled = true
		return new AreaShadeGraph(this.puzzle, option, gcoption)
	}

	createAreaUnshadeGraph(option: AreaUnshadeGraphOption | undefined, gcoption: GraphComponentOption | undefined) {
		if (option) option.enabled = true
		return new AreaUnshadeGraph(this.puzzle, option, gcoption)
	}

	createAreaNumberGraph(option: AreaNumberGraphOption | undefined, gcoption: GraphComponentOption | undefined) {
		if (option) option.enabled = true
		return new AreaNumberGraph(this.puzzle, option, gcoption)
	}

	createBoardExec(option?: any) {
		return new BoardExec(this.puzzle, option)
	}

	addInfoListInstance<T extends GraphBase>(instance: T, enabled?: boolean): T {
		if (instance.enabled || enabled) {
			instance.enabled = true
			this.infolist.push(instance);
		}
		return instance;
	}

	addInfoList<T extends GraphBase>(Klass: { new(puzzle: Puzzle, gcoption: any): T }): T {
		const instance = new Klass(this.puzzle, this.gcoption);
		if (instance.enabled) {
			this.infolist.push(instance);
		}
		return instance;
	}
	addExtraInfo() { }


	//---------------------------------------------------------------------------
	// bd.initBoardSize() 指定されたサイズで盤面の初期化を行う
	//---------------------------------------------------------------------------
	initBoardSize(col?: number, row?: number) {
		if (col === (void 0) || Number.isNaN(col)) { col = this.cols; }
		if (row === (void 0) || Number.isNaN(row)) { row = this.rows; }

		this.allclear(false); // initGroupで、新Objectに対しては別途allclearが呼ばれます

		this.initGroup('cell', col, row);
		this.initGroup('cross', col, row);
		this.initGroup('border', col, row);
		this.initGroup('excell', col, row);

		this.cols = col;
		this.rows = row;
		this.setminmax();
		this.setposAll();

		this.initExtraObject(col, row);

		this.rebuildInfo();

		this.puzzle.cursor.initCursor();
		this.puzzle.opemgr.allerase();
	}

	createCell() {
		return new Cell(this.puzzle, this.celloption) as TCell;
	}

	createCross() { return new Cross(this.puzzle, this.crossoption) as TCross; }
	createBorder() { return new Border(this.puzzle, this.borderoption) as TBorder; }
	createEXCell() { const e = new EXCell(this.puzzle, this.excelloption) as TEXCell; return e }

	createExtraObject() { }
	initExtraObject(col: number, row: number) { }

	//---------------------------------------------------------------------------
	// bd.initGroup()     数を比較して、オブジェクトの追加か削除を行う
	// bd.getGroup()      指定したタイプのオブジェクト配列を返す
	// bd.estimateSize()  指定したオブジェクトがいくつになるか計算を行う
	// bd.newObject()     指定されたタイプの新しいオブジェクトを返す
	//---------------------------------------------------------------------------
	initGroup(group: IGroup, col: number, row: number) {
		const groups = this.getGroup(group);
		const len = this.estimateSize(group, col, row);
		const clen = groups.length;
		// 既存のサイズより小さくなるならdeleteする
		if (clen > len) {
			for (let id = clen - 1; id >= len; id--) { groups.pop(); }
		}
		// 既存のサイズより大きくなるなら追加する
		else if (clen < len) {
			const groups2 = groups.clone();
			for (let id = clen; id < len; id++) {
				const piece = this.newObject(group, id);
				groups.add(piece);
				groups2.add(piece);
			}
			groups2.allclear(false);
		}
		//groups.length = len;
		return (len - clen);
	}
	getGroup(group: IGroup): PieceList<BoardPiece> {
		if (group === 'cell') { return this.cell; }
		if (group === 'cross') { return this.cross; }
		if (group === 'border') { return this.border; }
		if (group === 'excell') { return this.excell; }
		return new PieceList();
	}
	estimateSize(group: IGroup, col: number, row: number) {
		if (group === 'cell') { return col * row; }
		if (group === 'cross') { return (col + 1) * (row + 1); }
		if (group === 'border') {
			if (this.hasborder === 1) { return 2 * col * row - (col + row); }
			if (this.hasborder === 2) { return 2 * col * row + (col + row); }
		}
		else if (group === 'excell') {
			if (this.hasexcell === 1) { return col + row + (this.emptyexcell.ques === 51 ? 1 : 0); }
			if (this.hasexcell === 2) { return 2 * (col + row); }
		}
		return 0;
	}
	newObject(group: IGroup, id: number): BoardPiece {
		let piece: BoardPiece = this.nullobj
		if (group === 'cell') { piece = this.createCell(); }
		else if (group === 'cross') { piece = this.createCross(); }
		else if (group === 'border') { piece = this.createBorder(); }
		else if (group === 'excell') { piece = this.createEXCell(); }
		if (piece !== this.nullobj && id !== void 0) { piece.id = id; }
		return piece;
	}

	//---------------------------------------------------------------------------
	// bd.setposAll()    全てのCell, Cross, BorderオブジェクトのsetposCell()等を呼び出す
	//                   盤面の新規作成や、拡大/縮小/回転/反転時などに呼び出される
	// bd.setposGroup()  指定されたタイプのsetpos関数を呼び出す
	// bd.setposCell()   該当するidのセルのbx,byプロパティを設定する
	// bd.setposCross()  該当するidの交差点のbx,byプロパティを設定する
	// bd.setposBorder() 該当するidの境界線/Lineのbx,byプロパティを設定する
	// bd.setposEXCell() 該当するidのExtendセルのbx,byプロパティを設定する
	// bd.set_xnum()     crossは存在しないが、bd._xnumだけ設定したい場合に呼び出す
	//---------------------------------------------------------------------------
	/* setpos関連関数 */
	setposAll() {
		this.setposCells();
		this.setposCrosses();
		this.setposBorders();
		this.setposEXcells();
	}
	setposGroup(group: IGroup) {
		if (group === 'cell') { this.setposCells(); }
		else if (group === 'cross') { this.setposCrosses(); }
		else if (group === 'border') { this.setposBorders(); }
		else if (group === 'excell') { this.setposEXcells(); }
	}

	setposCells() {
		const qc = this.cols;
		for (let id = 0; id < this.cell.length; id++) {
			const cell = this.cell[id];
			cell.id = id;
			cell.isnull = false;

			cell.bx = (id % qc) * 2 + 1;
			cell.by = ((id / qc) << 1) + 1;

			cell.initAdjacent();
			cell.initAdjBorder();
		}
	}
	setposCrosses() {
		const qc = this.cols;
		for (let id = 0; id < this.cross.length; id++) {
			const cross = this.cross[id];
			cross.id = id;
			cross.isnull = false;

			cross.bx = (id % (qc + 1)) * 2;
			cross.by = (id / (qc + 1)) << 1;

			cross.initAdjBorder();
		}
	}
	setposBorders() {
		const qc = this.cols;
		const qr = this.rows;
		const bdinside = (2 * qc * qr - qc - qr);
		for (let id = 0; id < this.border.length; id++) {
			const border = this.border[id];
			let i = id;
			border.id = id;
			border.isnull = false;

			if (i >= 0 && i < (qc - 1) * qr) { border.bx = (i % (qc - 1)) * 2 + 2; border.by = ((i / (qc - 1)) << 1) + 1; } i -= ((qc - 1) * qr);
			if (i >= 0 && i < qc * (qr - 1)) { border.bx = (i % qc) * 2 + 1; border.by = ((i / qc) << 1) + 2; } i -= (qc * (qr - 1));
			if (this.hasborder === 2) {
				if (i >= 0 && i < qc) { border.bx = i * 2 + 1; border.by = 0; } i -= qc;
				if (i >= 0 && i < qc) { border.bx = i * 2 + 1; border.by = 2 * qr; } i -= qc;
				if (i >= 0 && i < qr) { border.bx = 0; border.by = i * 2 + 1; } i -= qr;
				if (i >= 0 && i < qr) { border.bx = 2 * qc; border.by = i * 2 + 1; } i -= qr;
			}
			border.isvert = !(border.bx & 1);
			border.inside = (id < bdinside);

			border.initSideObject();
		}
	}
	setposEXcells() {
		const qc = this.cols;
		const qr = this.rows;
		for (let id = 0; id < this.excell.length; id++) {
			const excell = this.excell[id];
			let i = id;
			excell.id = id;
			excell.isnull = false;

			if (this.hasexcell === 1) {
				if (i >= 0 && i < qc) { excell.bx = i * 2 + 1; excell.by = -1; } i -= qc;
				if (i >= 0 && i < qr) { excell.bx = -1; excell.by = i * 2 + 1; } i -= qr;
				if (i === 0 && excell.ques === 51) { excell.bx = -1; excell.by = -1; } i--;	/* 左上角のEXCellを追加 */
			}
			else if (this.hasexcell === 2) {
				if (i >= 0 && i < qc) { excell.bx = i * 2 + 1; excell.by = -1; } i -= qc;
				if (i >= 0 && i < qc) { excell.bx = i * 2 + 1; excell.by = 2 * qr + 1; } i -= qc;
				if (i >= 0 && i < qr) { excell.bx = -1; excell.by = i * 2 + 1; } i -= qr;
				if (i >= 0 && i < qr) { excell.bx = 2 * qc + 1; excell.by = i * 2 + 1; } i -= qr;
			}

			excell.initAdjacent();
		}
	}

	//---------------------------------------------------------------------------
	// bd.setminmax()   盤面のbx,byの最小値/最大値をセットする
	//---------------------------------------------------------------------------
	setminmax() {
		const extUL = (this.hasexcell > 0);
		const extDR = (this.hasexcell === 2);
		this.minbx = (!extUL ? 0 : -2);
		this.minby = (!extUL ? 0 : -2);
		this.maxbx = (!extDR ? 2 * this.cols : 2 * this.cols + 2);
		this.maxby = (!extDR ? 2 * this.rows : 2 * this.rows + 2);

		this.puzzle.cursor.setminmax();
	}

	//---------------------------------------------------------------------------
	// bd.allclear() 全てのCell, Cross, Borderオブジェクトのallclear()を呼び出す
	// bd.ansclear() 全てのCell, Cross, Borderオブジェクトのansclear()を呼び出す
	// bd.subclear() 全てのCell, Cross, Borderオブジェクトのsubclear()を呼び出す
	// bd.errclear() 全てのCell, Cross, Borderオブジェクトのerrorプロパティを0にして、Canvasを再描画する
	// bd.trialclear() 全てのCell, Cross, Borderオブジェクトのtrialプロパティを0にして、Canvasを再描画する
	//---------------------------------------------------------------------------
	// 呼び出し元：this.initBoardSize()
	allclear(isrec: boolean) {
		this.cell.allclear(isrec);
		this.cross.allclear(isrec);
		this.border.allclear(isrec);
		this.excell.allclear(isrec);
		if (isrec) { this.puzzle.opemgr.rejectTrial(true); }
	}
	// 呼び出し元：回答消去ボタン押した時
	ansclear() {
		const opemgr = this.puzzle.opemgr;
		opemgr.newOperation();
		opemgr.add(new BoardClearOperation(this.puzzle));

		this.cell.ansclear();
		this.cross.ansclear();
		this.border.ansclear();
		this.excell.ansclear();
		opemgr.rejectTrial(true);
		if (opemgr.history[opemgr.history.length - 1].length === 1) {
			opemgr.puzzle.undo();
			opemgr.removeDescendant();
		}

		this.rebuildInfo();
	}
	// 呼び出し元：補助消去ボタン押した時
	subclear() {
		this.puzzle.opemgr.newOperation();

		this.subclearmode = true

		this.cell.subclear();
		this.cross.subclear();
		this.border.subclear();
		this.excell.subclear();

		this.subclearmode = false
	}

	errclear() {
		const isclear = this.haserror || this.hasinfo;
		if (isclear) {
			this.cell.errclear();
			this.cross.errclear();
			this.border.errclear();
			this.excell.errclear();
			this.haserror = false;
			this.hasinfo = false;
		}
		return isclear;
	}

	trialclear(forcemode = false) {
		if (this.trialstage > 0 || !!forcemode) {
			this.cell.trialclear();
			this.cross.trialclear();
			this.border.trialclear();
			this.excell.trialclear();
			this.puzzle.redraw();
			this.trialstage = 0;
		}
	}

	//---------------------------------------------------------------------------
	// bd.getObjectPos()  (X,Y)の位置にあるオブジェクトを計算して返す
	//---------------------------------------------------------------------------
	getObjectPos(group: IGroup2, bx: number, by: number) {
		let obj = this.nullobj;
		if (group === 'cell') { obj = this.getc(bx, by); }
		else if (group === 'cross') { obj = this.getx(bx, by); }
		else if (group === 'border') { obj = this.getb(bx, by); }
		else if (group === 'excell') { obj = this.getex(bx, by); }
		else if (group === 'obj') { obj = this.getobj(bx, by); }
		return obj;
	}

	//---------------------------------------------------------------------------
	// bd.getc()  (X,Y)の位置にあるCellオブジェクトを返す
	// bd.getx()  (X,Y)の位置にあるCrossオブジェクトを返す
	// bd.getb()  (X,Y)の位置にあるBorderオブジェクトを返す
	// bd.getex() (X,Y)の位置にあるextendCellオブジェクトを返す
	// bd.getobj() (X,Y)の位置にある何らかのオブジェクトを返す
	//---------------------------------------------------------------------------
	getc(bx: number, by: number): TCell {
		let id = null;
		const qc = this.cols;
		const qr = this.rows;
		if ((bx < 0 || bx > (qc << 1) || by < 0 || by > (qr << 1)) || (!(bx & 1)) || (!(by & 1))) { }
		else { id = (bx >> 1) + (by >> 1) * qc; }
		return (id !== null ? this.cell[id] : this.emptycell);
	}
	getx(bx: number, by: number) {
		let id = null;
		const qc = this.cols;
		const qr = this.rows;
		if ((bx < 0 || bx > (qc << 1) || by < 0 || by > (qr << 1)) || (!!(bx & 1)) || (!!(by & 1))) { }
		else { id = (bx >> 1) + (by >> 1) * (qc + 1); }

		if (this.hascross !== 0) {
			return (id !== null ? this.cross[id] : this.emptycross);
		}
		return this.emptycross;
	}
	getb(bx: number, by: number): TBorder {
		let id = null;
		const qc = this.cols;
		const qr = this.rows;
		if (!!this.hasborder && (bx >= 1 && bx <= 2 * qc - 1 && by >= 1 && by <= 2 * qr - 1)) {
			if (!(bx & 1) && (by & 1)) { id = ((bx >> 1) - 1) + (by >> 1) * (qc - 1); }
			else if ((bx & 1) && !(by & 1)) { id = (bx >> 1) + ((by >> 1) - 1) * qc + (qc - 1) * qr; }
		}
		else if (this.hasborder === 2) {
			if (by === 0 && (bx & 1) && (bx >= 1 && bx <= 2 * qc - 1)) { id = (qc - 1) * qr + qc * (qr - 1) + (bx >> 1); }
			else if (by === 2 * qr && (bx & 1) && (bx >= 1 && bx <= 2 * qc - 1)) { id = (qc - 1) * qr + qc * (qr - 1) + qc + (bx >> 1); }
			else if (bx === 0 && (by & 1) && (by >= 1 && by <= 2 * qr - 1)) { id = (qc - 1) * qr + qc * (qr - 1) + 2 * qc + (by >> 1); }
			else if (bx === 2 * qc && (by & 1) && (by >= 1 && by <= 2 * qr - 1)) { id = (qc - 1) * qr + qc * (qr - 1) + 2 * qc + qr + (by >> 1); }
		}

		return (id !== null ? this.border[id] : this.emptyborder);
	}
	getex(bx: number, by: number) {
		let id = null;
		const qc = this.cols;
		const qr = this.rows;
		if (this.hasexcell === 1) {
			if (this.emptyexcell.ques === 51 && bx === -1 && by === -1) { id = qc + qr; }	/* 左上角のEXCellを追加 */
			else if (by === -1 && bx > 0 && bx < 2 * qc) { id = (bx >> 1); }
			else if (bx === -1 && by > 0 && by < 2 * qr) { id = qc + (by >> 1); }
		}
		else if (this.hasexcell === 2) {
			if (by === -1 && bx > 0 && bx < 2 * qc) { id = (bx >> 1); }
			else if (by === 2 * qr + 1 && bx > 0 && bx < 2 * qc) { id = qc + (bx >> 1); }
			else if (bx === -1 && by > 0 && by < 2 * qr) { id = 2 * qc + (by >> 1); }
			else if (bx === 2 * qc + 1 && by > 0 && by < 2 * qr) { id = 2 * qc + qr + (by >> 1); }
		}
		return (id !== null ? this.excell[id] : this.emptyexcell);
	}

	getobj(bx: number, by: number): BoardPiece {
		if ((bx + by) & 1) { return this.getb(bx, by); }
		if (!(bx & 1) && !(by & 1)) { return this.getx(bx, by); }

		const cell = this.getc(bx, by);
		return ((cell !== this.emptycell || !this.hasexcell) ? cell : this.getex(bx, by));
	}

	//---------------------------------------------------------------------------
	// bd.operate()  BoardExecの拡大縮小・回転反転処理を実行する
	//---------------------------------------------------------------------------
	operate(type: string) {
		this.exec.execadjust(type as IBoardOperation);
	}

	//---------------------------------------------------------------------------
	// bd.objectinside() 座標(x1,y1)-(x2,y2)に含まれるオブジェクトのリストを取得する
	//---------------------------------------------------------------------------
	objectinside(group: IGroup, x1: number, y1: number, x2: number, y2: number) {
		if (group === 'cell') { return this.cellinside(x1, y1, x2, y2); }
		if (group === 'cross') { return this.crossinside(x1, y1, x2, y2); }
		if (group === 'border') { return this.borderinside(x1, y1, x2, y2); }
		if (group === 'excell') { return this.excellinside(x1, y1, x2, y2); }
		return new PieceList();
	}

	//---------------------------------------------------------------------------
	// bd.cellinside()   座標(x1,y1)-(x2,y2)に含まれるCellのリストを取得する
	// bd.crossinside()  座標(x1,y1)-(x2,y2)に含まれるCrossのリストを取得する
	// bd.borderinside() 座標(x1,y1)-(x2,y2)に含まれるBorderのリストを取得する
	// bd.excellinside() 座標(x1,y1)-(x2,y2)に含まれるExcellのリストを取得する
	//---------------------------------------------------------------------------
	cellinside(x1: number, y1: number, x2: number, y2: number) {
		const clist = new CellList<TCell>();
		for (let by = (y1 | 1); by <= y2; by += 2) {
			for (let bx = (x1 | 1); bx <= x2; bx += 2) {
				const cell = this.getc(bx, by);
				if (!cell.isnull) { clist.add(cell); }
			}
		}
		return clist;
	}
	crossinside(x1: number, y1: number, x2: number, y2: number) {
		const clist = new CrossList();
		if (!!this.hascross) {
			for (let by = y1 + (y1 & 1); by <= y2; by += 2) {
				for (let bx = x1 + (x1 & 1); bx <= x2; bx += 2) {
					const cross = this.getx(bx, by);
					if (!cross.isnull) { clist.add(cross); }
				}
			}
		}
		return clist;
	}
	borderinside(x1: number, y1: number, x2: number, y2: number) {
		const blist = new BorderList();
		if (!!this.hasborder) {
			for (let by = y1; by <= y2; by++) {
				for (let bx = x1 + (((x1 + by) & 1) ^ 1); bx <= x2; bx += 2) {
					const border = this.getb(bx, by);
					if (!border.isnull) { blist.add(border); }
				}
			}
		}
		return blist;
	}
	excellinside(x1: number, y1: number, x2: number, y2: number) {
		const exlist = new EXCellList();
		if (!!this.hasexcell) {
			if (y1 < -1) { y1 = -1; }
			for (let by = (y1 | 1); by <= y2; by += 2) {
				for (let bx = (x1 | 1); bx <= x2; bx += 2) {
					const excell = this.getex(bx, by);
					if (!excell.isnull) { exlist.add(excell); }
				}
			}
		}
		return exlist;
	}

	//---------------------------------------------------------------------------
	// bd.disableInfo()  Area/LineManagerへの登録を禁止する
	// bd.enableInfo()   Area/LineManagerへの登録を許可する
	// bd.isenableInfo() 操作の登録できるかを返す
	//---------------------------------------------------------------------------
	disableInfo() {
		this.puzzle.opemgr.disableRecord();
		this.disrecinfo++;
	}
	enableInfo() {
		this.puzzle.opemgr.enableRecord();
		if (this.disrecinfo > 0) { this.disrecinfo--; }
	}
	isenableInfo() {
		return (this.disrecinfo === 0);
	}

	//--------------------------------------------------------------------------------
	// bd.rebuildInfo()      部屋、黒マス、白マスの情報を再生成する
	// bd.modifyInfo()       黒マス・白マス・境界線や線が入力されたり消された時に情報を変更する
	//--------------------------------------------------------------------------------
	rebuildInfo() {
		this.infolist.forEach(function (info) { info.rebuild(); });

	}
	modifyInfo(obj: BoardPiece, type: string) {
		if (!this.isenableInfo()) { return; }
		for (let i = 0; i < this.infolist.length; ++i) {
			const info = this.infolist[i];
			if (!!info.relation[type]) { info.modifyInfo(obj, type); }
		}
	}

	//---------------------------------------------------------------------------
	// bd.irowakeRemake() 「色分けしなおす」ボタンを押した時などに色分けしなおす
	//---------------------------------------------------------------------------
	irowakeRemake() {
		for (let i = 0; i < this.infolist.length; ++i) {
			const info = this.infolist[i];
			if (info.coloring) { info.newIrowake(); }
		}
	}

	//---------------------------------------------------------------------------
	// bd.disableSetError()  盤面のオブジェクトにエラーフラグを設定できないようにする
	// bd.enableSetError()   盤面のオブジェクトにエラーフラグを設定できるようにする
	// bd.isenableSetError() 盤面のオブジェクトにエラーフラグを設定できるかどうかを返す
	//---------------------------------------------------------------------------
	disableSetError() { this.diserror++; }
	enableSetError() { this.diserror--; }
	isenableSetError() { return (this.diserror <= 0); }

	//---------------------------------------------------------------------------
	// bd.freezecopy()  盤面のオブジェクト値のみを取得する
	// bd.compareData() 盤面のオブジェクト値のみを比較し異なる場合にcallback関数を呼ぶ
	//---------------------------------------------------------------------------
	freezecopy() {
		const bd2 = {
			cell: [] as any[],
			cross: [] as any[],
			border: [] as any[],
			excell: [] as any[]
		} as const;
		for (const g in bd2) {
			const group = g as keyof typeof bd2;
			for (let c = 0; c < this[group].length; c++) {
				bd2[group].push(this[group][c].getprops());
			}
		}
		return bd2;
	}
	compareData(bd2: { [key in IGroup]: any[] }, callback: (group: IGroup, id: number, prop: keyof BoardPiece) => void) {
		for (const g in bd2) {
			const group = g as IGroup
			if (!this[group]) { continue; }
			for (let c = 0; c < bd2[group].length; c++) {
				if (!this[group][c]) { continue; }
				this[group][c].compare(bd2[group][c], callback);
			}
		}
	}
}
