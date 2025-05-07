// Answer.js v3.4.1

import { CellList } from "./PieceList";
import type { Puzzle } from "./Puzzle";
import { BorderList } from "./PieceList";
import type { BoardPiece, Cell, EXCell, Border, Cross } from "./Piece";
import type { GraphBase, GraphComponent } from "./GraphBase";
import type { AreaGraphBase, AreaRoomGraph } from "./AreaManager";
import { checkpid } from "../pzpr/util";
import { pzpr } from "../pzpr/core";
import { DIRS } from "./Constants";
//---------------------------------------------------------------------------
// ★AnsCheckクラス 答えチェック関連の関数を扱う
//---------------------------------------------------------------------------

// 回答チェッククラス
// AnsCheckクラス

//---------------------------------------------------------
type CellCheck<T extends Cell = Cell> = (cell: T) => boolean
type CellCheck2 = (cell1: Cell, cell2: Cell) => boolean
type AreaCheck = (cols: number, rows: number, a: number, n: number) => boolean
type CellListCheck = (clist: CellList) => boolean

export type CellOfBoard<TBoard extends Board> = TBoard["cell"][number]
export type BorderOfBoard<TBoard extends Board> = TBoard["border"][number]

type ColsPartlyInfo = { keycell: BoardPiece | null, key51num: number, isvert: boolean }

export type IPathSeg = {
	objs: BorderList
	cells: [Cell, Cell]	// 出発したセル、到達したセル
	ccnt: number				// 曲がった回数
	length: number[]				// 曲がった箇所で区切った、それぞれの線分の長さの配列
	dir1: number		// dir1 スタート地点で線が出発した方向
	dir2: number				// dir2 到達地点から見た、到達した線の方向
}

import type { Board } from "./Board";

export type AnsCheckOption = Partial<AnsCheck>
export type Checker = () => void

export class AnsCheck<
	TBoard extends Board = Board
> {
	inCheck: boolean
	checkOnly: boolean
	allowempty: boolean = false
	multierr: boolean = false
	forceallcell: boolean = false
	board: TBoard

	constructor(board: TBoard, option?: AnsCheckOption & { [key: string]: any }) {
		this.board = board
		this.inCheck = false;
		this.checkOnly = false;

		Object.assign(this, option)
		this.checklist.push(...this.getCheckList())

		this.makeCheckList();
	}
	failcodemode = false
	failcode: CheckInfo = null!
	_info: {
		num?: IPathSeg[]
	} = null!
	checklist: string[] = []
	checklist_normal: Checker[] = []
	checklist_auto: Checker[] = []

	getCheckList(): string[] {
		return []
	}

	//---------------------------------------------------------------------------
	// ans.makeCheckList() 最初にchecklistの配列を生成する
	//---------------------------------------------------------------------------
	makeCheckList() {
		/* 当該パズルで使用しないchecklistのアイテムをフィルタリング */
		const checklist = this.checklist;
		let order = [];
		for (let i = 0; i < checklist.length; i++) {
			let item = checklist[i];
			const isexist = true;
			let prio = 0;
			if (isexist) {
				prio = (item.match(/\+/) || []).length;
				item = item.replace(/\+/g, "");
				//@ts-ignore
				if (!this[item]) console.warn(`anscheck warning: ${item} is null!`)
				// @ts-ignore
				order.push([this[item], prio]);
			}
		}

		this.checklist_normal = [];
		for (let i = 0; i < order.length; i++) { this.checklist_normal.push(order[i][0]); }

		/* autocheck用のエラーをソートする */
		order = order.sort(function (a, b) { return b[1] - a[1]; });
		this.checklist_auto = [];
		for (let i = 0; i < order.length; i++) { this.checklist_auto.push(order[i][0]); }
	}
	//---------------------------------------------------------------------------
	// ans.check()     答えのチェックを行う
	// ans.checkAns()  答えのチェックを行い、エラーコードを返す(nullはNo Error)
	//---------------------------------------------------------------------------
	check(activemode: boolean) {
		//const puzzle = this.puzzle;
		const bd = this.board;
		this.inCheck = true;

		if (!!activemode) {
			this.checkOnly = false;
			this.checkAns(false);
			if (!this.failcode.complete) {
				bd.haserror = true;
				this.failcode.shouldForceRedraw = true
				//puzzle.redraw(true);	/* 描画キャッシュを破棄して描画し直す */
			}
		}
		/* activemodeでなく、前回の判定結果が残っていない場合はチェックします */
		else if (this.failcode === void 0 || this.failcodemode !== activemode) {
			bd.disableSetError();
			this.checkOnly = true;
			this.checkAns(activemode === false);
			this.failcodemode = activemode;
			bd.enableSetError();
		}
		/* activemodeでなく、前回の判定結果が残っている場合はそれを返します */

		this.inCheck = false;
		return this.failcode;
	}
	checkAns(break_if_error: boolean) {
		this.failcode = new CheckInfo();
		const checkSingleError = (!this.multierr || break_if_error);
		const checklist = ((this.checkOnly && checkSingleError) ? this.checklist_auto : this.checklist_normal);
		for (let i = 0; i < checklist.length; i++) {
			checklist[i].call(this);
			if (checkSingleError && (this.failcode.list.length > 0)) { break; }
		}
		//if (!break_if_error) { this.failcode.text = this.failcode.gettext(); }
	}

	//---------------------------------------------------------------------------
	// ans.resetCache() 前回のエラー情報等を破棄する
	//---------------------------------------------------------------------------
	resetCache() {
		this.failcode = null!
		this.failcodemode = false;
		this._info = {};
	}

	//---------------------------------------------------------------------------
	// ans.checkAllCell()   条件func==trueになるマスがあったらエラーを設定する
	// ans.checkNoNumCell() 数字の入っていないセルがあるか判定する
	// ans.checkIceLines()  アイスバーン上で線が曲がっているか判定する
	// ans.checkNotCrossOnMark()  十字のマーク上で線が交差していることを判定する
	// ans.checkLineOnShadeCell() 黒マス上に線がないことを判定する
	// ans.checkNoLineObject()    線が出ていない数字や○がないかどうか判定する
	// ans.checkLineOverLetter()  線が数字などを通過しているか判定する
	//---------------------------------------------------------------------------
	checkAllCell(func: (cell: CellOfBoard<TBoard>) => boolean, code: string) {
		for (let c = 0; c < this.board.cell.length; c++) {
			const cell = this.board.cell[c];
			if (!func(cell)) { continue; }

			this.failcode.add(code);
			if (this.checkOnly) { break; }
			cell.seterr(1);
		}
	}
	checkNoNumCell() {
		this.checkAllCell(function (cell) { return (cell.ques === 0 && cell.noNum()); }, "ceNoNum");
	}
	checkIceLines() {
		this.checkAllCell(function (cell) { return (cell.ice() && cell.isLineCurve()); }, "lnCurveOnIce");
	}
	checkNotCrossOnMark() {
		this.checkAllCell(function (cell) { return (cell.lcnt !== 4 && cell.ques === 11); }, "lnNotCrossMk");
	}
	checkLineOnShadeCell() {
		this.checkAllCell(function (cell) { return ((cell.ques === 1 || cell.qans === 1) && cell.lcnt > 0); }, "lnOnShade");
	}
	checkNoLineObject() {
		this.checkAllCell(function (cell) { return (cell.lcnt === 0 && cell.isNum()); }, "nmNoLine");
	}
	checkLineOverLetter() {
		this.checkAllCell(function (cell) { return (cell.lcnt >= 2 && cell.isNum()); }, (this.board.linegraph.moveline ? "laOnNum" : "lcOnNum"));
	}

	//---------------------------------------------------------------------------
	// ans.checkDir4Cell()  セルの周囲4マスの条件がfunc==trueの時、エラーを設定する
	//---------------------------------------------------------------------------
	checkDir4Cell(iscount: CellCheck<CellOfBoard<TBoard>>, type: number, code: string) { // type = 0:違う 1:numより小さい 2:numより大きい
		for (let c = 0; c < this.board.cell.length; c++) {
			const cell = this.board.cell[c];
			if (!cell.isValidNum()) { continue; }
			const num = cell.getNum();
			const count = cell.countDir4Cell(iscount);
			if ((type === 0 && num === count) || (type === 1 && num <= count) || (type === 2 && num >= count)) { continue; }

			this.failcode.add(code);
			if (this.checkOnly) { break; }
			cell.seterr(1);
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkSideCell()  隣り合った2つのセルが条件func==trueの時、エラーを設定する
	// ans.checkAdjacentShadeCell()  黒マスが隣接している時、エラーを設定する
	// ans.checkAdjacentDiffNumber() 同じ数字が隣接している時、エラーを設定する
	//---------------------------------------------------------------------------
	checkSideCell(func: CellCheck2, code: string) {
		let result = true;
		const bd = this.board;
		for (let c = 0; c < bd.cell.length; c++) {
			const cell = bd.cell[c];
			let cell2 = cell.adjacent.right;
			if (cell.bx < bd.maxbx - 1 && func(cell, cell2)) {
				result = false;
				if (this.checkOnly) { break; }
				cell.seterr(1);
				cell2.seterr(1);
			}
			cell2 = cell.adjacent.bottom;
			if (cell.by < bd.maxby - 1 && func(cell, cell2)) {
				result = false;
				if (this.checkOnly) { break; }
				cell.seterr(1);
				cell2.seterr(1);
			}
		}
		if (!result) { this.failcode.add(code); }
	}
	checkAdjacentShadeCell() {
		this.checkSideCell(function (cell1, cell2) { return (cell1.isShade() && cell2.isShade()); }, "csAdjacent");
	}
	checkAdjacentDiffNumber() {
		this.checkSideCell(function (cell1, cell2) { return cell1.sameNumber(cell2); }, "nmAdjacent");
	}

	//---------------------------------------------------------------------------
	// ans.check2x2Block()      2x2のセルが全て条件func==trueの時、エラーを設定する
	// ans.check2x2ShadeCell()  2x2のセルが黒マスの時、エラーを設定する
	// ans.check2x2UnshadeCell() 2x2のセルが白マスの時、エラーを設定する
	//---------------------------------------------------------------------------
	check2x2Block(func: CellCheck, code: string) {
		const bd = this.board;
		for (let c = 0; c < bd.cell.length; c++) {
			const cell = bd.cell[c];
			if (cell.bx >= bd.maxbx - 1 || cell.by >= bd.maxby - 1) { continue; }

			const bx = cell.bx;
			const by = cell.by;
			const clist = bd.cellinside(bx, by, bx + 2, by + 2).filter(func) as CellList<CellOfBoard<TBoard>>;
			if (clist.length < 4) { continue; }

			this.failcode.add(code);
			if (this.checkOnly) { break; }
			clist.seterr(1);
		}
	}
	check2x2ShadeCell() {
		this.check2x2Block(function (cell) { return cell.isShade(); }, "cs2x2");
	}
	check2x2UnshadeCell() {
		this.check2x2Block(function (cell) { return cell.isUnshade(); }, "cu2x2");
	}

	//---------------------------------------------------------------------------
	// ans.checkSameColorTile() 白マスと黒マスが混ざったタイルがないかどうかチェックする
	//---------------------------------------------------------------------------
	checkSameColorTile() {
		this.checkSameObjectInRoom(this.board.roommgr, function (cell) { return (cell.isShade() ? 1 : 2); }, "bkMixed");
	}

	//---------------------------------------------------------------------------
	// ans.checkConnectShade()    黒マスがひとつながりかどうかを判定する
	// ans.checkConnectUnshade()  白マスがひとつながりかどうかを判定する
	// ans.checkConnectNumber()   数字がひとつながりかどうかを判定する
	// ans.checkOneArea()  白マス/黒マス/線がひとつながりかどうかを判定する
	// ans.checkConnectUnshadeRB() 連黒分断禁のパズルで白マスが分断されているかチェックする
	//---------------------------------------------------------------------------
	checkConnectShade() { this.checkOneArea(this.board.sblkmgr, "csDivide"); }
	checkConnectUnshade() { this.checkOneArea(this.board.ublkmgr, "cuDivide"); }
	checkConnectNumber() { this.checkOneArea(this.board.nblkmgr, "nmDivide"); }
	checkOneArea(graph: GraphBase, code: string) {
		if (graph.components.length > 1) {
			this.failcode.add(code);
			graph.components[0].getnodeobjs().seterr(1);
		}
	}

	checkConnectUnshadeRB() {
		if (this.board.ublkmgr.components.length > 1) {
			this.failcode.add("cuDivideRB");
			const errclist = new CellList();
			const clist = this.board.cell.filter(function (cell) { return cell.isShade(); });
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				const list = cell.getdir4clist();
				let fid = null;
				for (let n = 0; n < list.length; n++) {
					const cell2 = list[n][0];
					//@ts-ignore
					if (fid === null) { fid = cell2.ublk; }
					//@ts-ignore
					else if (fid !== cell2.ublk) { errclist.add(cell); break; }
				}
			}
			errclist.seterr(1);
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkShadeCellExist()  盤面に少なくとも一つは黒マスがあることを判定する
	//---------------------------------------------------------------------------
	checkShadeCellExist() {
		if (!this.allowempty) {
			const bd = this.board;
			if (bd.sblkmgr.enabled) {
				if (bd.sblkmgr.components.length > 0) { return; }
			}
			else if (bd.ublkmgr.enabled) {
				if (bd.ublkmgr.components.length === 0 || bd.ublkmgr.components[0].nodes.length !== bd.cell.length) { return; }
			}
			else {
				if (bd.cell.some(function (cell) { return cell.isShade(); })) { return; }
			}
			this.failcode.add("brNoShade");
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkOneLoop()  盤面に引かれているループが一つに繋がっていることを判定する
	//---------------------------------------------------------------------------
	checkOneLoop() {
		const bd = this.board;
		const paths = bd.linegraph.components;
		if (paths.length > 1) {
			this.failcode.add("lnPlLoop");
			bd.border.setnoerr();
			paths[0].setedgeerr(1);
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkNumberExist()  盤面に少なくとも一つは数字があることを判定する
	//---------------------------------------------------------------------------
	checkNumberExist() {
		if (!this.allowempty) {
			if (this.board.cell.some(function (cell) { return cell.isValidNum(); })) { return; }
			this.failcode.add("brNoValidNum");
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkConnectAllNumber() 盤面に引かれている線が一つに繋がっていることを判定する
	//---------------------------------------------------------------------------
	checkConnectAllNumber() {
		const bd = this.board;
		const paths = bd.linegraph.components;
		if (paths.length > 1) {
			this.failcode.add("lcDivided");
			bd.border.setnoerr();
			paths[0].setedgeerr(1);
			paths[0].clist.seterr(4);
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkLineExist()  盤面に少なくとも一本は線が引かれていることを判定する
	//---------------------------------------------------------------------------
	checkLineExist() {
		if (!this.allowempty) {
			const bd = this.board;
			if (bd.linegraph.ltotal[0] !== (!bd.borderAsLine ? bd.cell : bd.cross).length) { return; }
			this.failcode.add("brNoLine");
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkLineCount() セルから出ている線の本数について判定する
	//---------------------------------------------------------------------------
	checkCrossLine() { this.checkLineCount(4, "lnCross"); }
	checkBranchLine() { this.checkLineCount(3, "lnBranch"); }
	checkDeadendLine() { this.checkLineCount(1, "lnDeadEnd"); }
	checkNoLine() { this.checkLineCount(0, "ceNoLine"); }
	checkLineCount(val: number, code: string) {
		let result = true;
		const bd = this.board;
		if (!bd.linegraph.ltotal[val]) { return; }

		if (!bd.borderAsLine) {
			this.checkAllCell(function (cell) { return cell.lcnt === val; }, code);
		}
		else {
			const boardcross = bd.cross;
			for (let c = 0; c < boardcross.length; c++) {
				const cross = boardcross[c];
				if (cross.lcnt !== val) { continue; }

				result = false;
				if (this.checkOnly) { break; }
				cross.seterr(1);
				bd.borderinside(cross.bx - 1, cross.by - 1, cross.bx + 1, cross.by + 1).seterr(1);
			}
			if (!result) {
				this.failcode.add(code);
				bd.border.setnoerr();
			}
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkConnectLineCount() ○などがないセルから出ている線の本数について判定する
	//---------------------------------------------------------------------------
	checkCrossConnectLine() { this.checkConnectLineCount(4, "lnCross"); }
	checkBranchConnectLine() { this.checkConnectLineCount(3, "lnBranch"); }
	checkDeadendConnectLine() { this.checkConnectLineCount(1, "lnDeadEnd"); }
	checkConnectLineCount(val: number, code: string) {
		if (!this.board.linegraph.ltotal[val]) { return; }

		this.checkAllCell(function (cell) { return (cell.noNum() && cell.lcnt === val); }, code);
	}

	//---------------------------------------------------------------------------
	// ans.checkenableLineParts() '一部があかされている'線の部分に、線が引かれているか判定する
	//---------------------------------------------------------------------------
	checkenableLineParts() {
		const bd = this.board;
		for (let c = 0; c < bd.cell.length; c++) {
			const cell = bd.cell[c];
			const adb = cell.adjborder;
			if ((!adb.top.isLine() || !cell.noLP(DIRS.UP)) &&
				(!adb.bottom.isLine() || !cell.noLP(DIRS.DN)) &&
				(!adb.left.isLine() || !cell.noLP(DIRS.LT)) &&
				(!adb.right.isLine() || !cell.noLP(DIRS.RT))) { continue; }

			this.failcode.add("ceAddLine");
			if (this.checkOnly) { break; }
			cell.seterr(1);
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkAllArea()    すべてのエリアがevalfuncを満たすかどうか判定する
	// ans.checkAllArea2()   すべてのエリアがareaを引数に取るevalfuncを満たすかどうか判定する
	//---------------------------------------------------------------------------
	checkAllArea(graph: AreaGraphBase, evalfunc: AreaCheck, code: string) { this.checkAllBlock(graph, null, evalfunc, code); }

	/**
	 * すべてのfuncを満たすマスで構成されるエリアがevalfuncを満たすかどうか判定する
	 * @param graph 
	 * @param filterfunc 
	 * @param evalfunc 
	 * @param code 
	 * @param errCode tateyokoでは4
	 */
	checkAllBlock(graph: AreaGraphBase, filterfunc: CellCheck | null, evalfunc: AreaCheck, code: string, errCode: number = 1) {
		const areas = graph.components;
		for (let id = 0; id < areas.length; id++) {
			const area = areas[id];
			const clist = area.clist;
			const top = (!!area.top ? area.top : clist.getQnumCell());
			const d = clist.getRectSize();
			const a = (!!filterfunc ? clist.filter(filterfunc) : clist).length;
			const n = ((!!top && !top.isnull) ? top.qnum : -1);
			if (evalfunc(d.cols, d.rows, a, n)) { continue; }

			this.failcode.add(code);
			if (this.checkOnly) { break; }
			//@ts-ignore

			if (areas !== this.board.linegraph) {
				clist.seterr(errCode);
			}
			else {
				this.board.border.setnoerr();
				//@ts-ignore

				area.objs.seterr(1);
			}
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkNumberAndSize()  部屋にある数字と面積が等しいか判定する
	// ans.checkRoomRect()       領域が全て四角形であるかどうか判定する
	//---------------------------------------------------------------------------
	checkNumberAndSize() { this.checkAllArea(this.board.roommgr, function (w, h, a, n) { return (n <= 0 || n === a); }, "bkSizeNe"); }
	checkRoomRect() { this.checkAllArea(this.board.roommgr, function (w, h, a, n) { return (w * h === a); }, "bkNotRect"); }

	//---------------------------------------------------------------------------
	// ans.checkNoNumber()       部屋に数字が含まれていないかの判定を行う
	// ans.checkDoubleNumber()   部屋に数字が2つ以上含まれていないように判定を行う
	//---------------------------------------------------------------------------
	checkNoNumber() { this.checkAllBlock(this.board.roommgr, function (cell) { return cell.isNum(); }, function (w, h, a, n) { return (a !== 0); }, "bkNoNum"); }
	checkDoubleNumber() { this.checkAllBlock(this.board.roommgr, function (cell) { return cell.isNum(); }, function (w, h, a, n) { return (a < 2); }, "bkNumGe2"); }

	//---------------------------------------------------------------------------
	// ans.checkShadeCellCount() 領域内の数字と黒マスの数が等しいか判定する
	// ans.checkNoShadeCellInArea()  部屋に黒マスがあるか判定する
	//---------------------------------------------------------------------------
	checkShadeCellCount() { this.checkAllBlock(this.board.roommgr, function (cell) { return cell.isShade(); }, function (w, h, a, n) { return (n < 0 || n === a); }, "bkShadeNe"); }
	checkNoShadeCellInArea() { this.checkAllBlock(this.board.roommgr, function (cell) { return cell.isShade(); }, function (w, h, a, n) { return (a > 0); }, "bkNoShade"); }

	//---------------------------------------------------------------------------
	// ans.checkLinesInArea()  領域の中で線が通っているセルの数を判定する
	//---------------------------------------------------------------------------
	checkLinesInArea(graph: AreaGraphBase, evalfunc: AreaCheck, code: string) { this.checkAllBlock(graph, function (cell) { return cell.lcnt > 0; }, evalfunc, code); }

	//---------------------------------------------------------------------------
	// ans.checkNoMovedObjectInRoom() 領域に移動後のオブジェクトがないと判定する
	//---------------------------------------------------------------------------
	checkNoMovedObjectInRoom(graph: AreaGraphBase) { this.checkAllBlock(graph, function (cell) { return cell.base!.qnum !== -1; }, function (w, h, a, n) { return (a !== 0); }, "bkNoNum"); }

	//---------------------------------------------------------------------------
	// ans.checkDisconnectLine() 数字などに繋がっていない線の判定を行う
	// ans.checkConnectObject()  数字が線で2つ以上繋がっていないように判定を行う
	// ans.checkTripleObject()   数字が線で3つ以上繋がっていないように判定を行う
	// ans.checkConnectObjectCount() 上記関数の共通処理
	//---------------------------------------------------------------------------
	checkDisconnectLine() { this.checkConnectObjectCount(function (a) { return (a > 0); }, (this.board.linegraph.moveline ? "laIsolate" : "lcIsolate")); }
	checkConnectObject() { this.checkConnectObjectCount(function (a) { return (a < 2); }, "nmConnected"); }
	checkTripleObject() { this.checkConnectObjectCount(function (a) { return (a < 3); }, "lcTripleNum"); }
	checkConnectObjectCount(evalfunc: (a: number) => boolean, code: string) {
		let result = true;
		const paths = this.board.linegraph.components;
		for (let id = 0; id < paths.length; id++) {
			const clist = paths[id].clist;
			if (evalfunc(clist.filter(function (cell) { return cell.isNum(); }).length)) { continue; }

			result = false;
			if (this.checkOnly) { break; }
			this.board.border.setnoerr();
			paths[id].setedgeerr(1);
			paths[id].clist.seterr(4);
		}
		if (!result) {
			this.failcode.add(code);
			this.board.border.setnoerr();
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkSideAreaSize() 境界線をはさんで接する部屋のgetvalで得られるサイズが異なることを判定する
	// ans.checkSideAreaCell() 境界線をはさんでタテヨコに接するセルの判定を行う
	//---------------------------------------------------------------------------
	checkSideAreaSize<T extends GraphComponent>(
		graph: AreaGraphBase<T> & { getSideAreaInfo: () => [T, T][] },
		getval: (c: T) => number,
		code: string
	) {
		const sides = graph.getSideAreaInfo();
		for (let i = 0; i < sides.length; i++) {
			const a1 = getval(sides[i][0]);
			const a2 = getval(sides[i][1]);
			if (a1 <= 0 || a2 <= 0 || a1 !== a2) { continue; }

			this.failcode.add(code);
			if (this.checkOnly) { break; }
			sides[i][0].clist.seterr(1);
			sides[i][1].clist.seterr(1);
		}
	}

	checkSideAreaCell(func: CellCheck2, flag: boolean, code: string) {
		for (let id = 0; id < this.board.border.length; id++) {
			const border = this.board.border[id];
			if (!border.isBorder()) { continue; }
			const cell1 = border.sidecell[0];
			const cell2 = border.sidecell[1];
			if (cell1.isnull || cell2.isnull || !func(cell1 as Cell, cell2 as Cell)) { continue; }

			this.failcode.add(code);
			if (this.checkOnly) { break; }
			if (!flag) { cell1.seterr(1); cell2.seterr(1); }
			else {
				cell1.room.clist.seterr(1);
				cell2.room.clist.seterr(1);
			}
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkSameObjectInRoom()      部屋の中のgetvalueの値が1種類であるか判定する
	// ans.checkDifferentNumberInRoom() 部屋の中に同じ数字が存在しないことを判定する
	// ans.isDifferentNumberInClist()   clistの中に同じ数字が存在しないことを判定だけを行う
	//---------------------------------------------------------------------------
	checkSameObjectInRoom(graph: GraphBase, getvalue: (cell: Cell) => number, code: string) {
		const areas = graph.components;
		allloop:
		for (let id = 0; id < areas.length; id++) {
			const clist = areas[id].clist;
			let roomval = -1;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				const val = getvalue(cell);
				if (val === -1 || roomval === val) { continue; }
				if (roomval === -1) { roomval = val; }
				else {
					this.failcode.add(code);
					if (this.checkOnly) { break allloop; }
					if (areas !== this.board.linegraph.components) {
						clist.seterr(1);
					}
					else {
						this.board.border.setnoerr();
						areas[id].setedgeerr(1);
					}
				}
			}
		}
	}

	checkDifferentNumberInRoom() {
		this.checkDifferentNumberInRoom_main(this.board.roommgr, this.isDifferentNumberInClist);
	}
	checkDifferentNumberInRoom_main(graph: AreaGraphBase, evalfunc: CellListCheck) {
		const areas = graph.components;
		for (let r = 0; r < areas.length; r++) {
			const clist = areas[r].clist;
			if (evalfunc.call(this, clist)) { continue; }

			this.failcode.add("bkDupNum");
			if (this.checkOnly) { break; }
			clist.seterr(1);
		}
	}

	isDifferentNumberInClist(clist: CellList) { return this.isIndividualObject(clist, function (cell) { return cell.getNum(); }); }
	isDifferentAnsNumberInClist(clist: CellList) { return this.isIndividualObject(clist, function (cell) { return cell.anum; }); }
	isIndividualObject(clist: CellList, numfunc: (cell: Cell) => number) {
		if (clist.length <= 0) { return true; }
		let result = true;
		const d: number[] = [];
		const num: number[] = [];
		let max = -1;
		const bottom = clist[0].getminnum();
		for (let i = 0; i < clist.length; i++) { if (max < numfunc(clist[i])) { max = numfunc(clist[i]); } }
		for (let n = bottom; n <= max; n++) { d[n] = 0; }
		for (let i = 0; i < clist.length; i++) { num[clist[i].id] = numfunc(clist[i]); }

		for (let i = 0; i < clist.length; i++) { if (num[clist[i].id] >= bottom) { d[num[clist[i].id]]++; } }
		const clist2 = clist.filter(function (cell) { return (num[cell.id] >= bottom && d[num[cell.id]] >= 2); }) as CellList;
		if (clist2.length > 0) { clist2.seterr(1); result = false; }
		return result;
	}

	//---------------------------------------------------------------------------
	// ans.checkRowsCols()              タテ列・ヨコ列の数字の判定を行う
	// ans.checkDifferentNumberInLine() タテ列・ヨコ列に同じ数字が入っていないことを判定する
	//---------------------------------------------------------------------------
	/* ともにevalfuncはAnswerクラスの関数限定 */
	checkRowsCols(evalfunc: CellListCheck, code: string) {
		let result = true;
		const bd = this.board;
		allloop: do {
			/* 横方向サーチ */
			for (let by = 1; by <= bd.maxby; by += 2) {
				const clist = bd.cellinside(bd.minbx + 1, by, bd.maxbx - 1, by);
				if (evalfunc.call(this, clist)) { continue; }

				result = false;
				if (this.checkOnly) { break allloop; }
			}
			/* 縦方向サーチ */
			for (let bx = 1; bx <= bd.maxbx; bx += 2) {
				const clist = bd.cellinside(bx, bd.minby + 1, bx, bd.maxby - 1);
				if (evalfunc.call(this, clist)) { continue; }

				result = false;
				if (this.checkOnly) { break allloop; }
			}
		} while (false);

		if (!result) {
			this.failcode.add(code);
		}
	}
	checkDifferentNumberInLine() {
		this.checkRowsCols(this.isDifferentNumberInClist, "nmDupRow");
	}

	//---------------------------------------------------------------------------
	// ans.checkRowsColsPartly()      黒マスや[＼]等で分かれるタテ列・ヨコ列の数字の判定を行う
	// ans.checkRowsColsFor51cell()   [＼]で分かれるタテ列・ヨコ列の数字の判定を行う
	//---------------------------------------------------------------------------
	checkRowsColsPartly(
		evalfunc: (clist: CellList<CellOfBoard<TBoard>>, info: ColsPartlyInfo, bd: Board) => boolean,
		termfunc: CellCheck,
		code: string
	) {
		let result = true
		const bd = this.board
		let info = { keycell: null! as BoardPiece | null, key51num: 0, isvert: false };
		allloop: do {
			/* 横方向サーチ */
			info = { keycell: null, key51num: -1, isvert: false };
			for (let by = 1; by <= bd.maxby; by += 2) {
				for (let bx = 1; bx <= bd.maxbx; bx += 2) {
					let tx: number
					for (tx = bx; tx <= bd.maxbx; tx += 2) { if (termfunc(bd.getc(tx, by))) { break; } }
					info.keycell = bd.getobj(bx - 2, by);
					info.key51num = info.keycell.qnum;
					if (tx > bx && !evalfunc.call(this, bd.cellinside(bx, by, tx - 2, by), info, bd)) {
						result = false;
						if (this.checkOnly) { break allloop; }
					}
					bx = tx; /* 次のループはbx=tx+2 */
				}
			}
			/* 縦方向サーチ */
			info = { keycell: null, key51num: -1, isvert: true };
			for (let bx = 1; bx <= bd.maxbx; bx += 2) {
				for (let by = 1; by <= bd.maxby; by += 2) {
					let ty: number
					for (ty = by; ty <= bd.maxby; ty += 2) { if (termfunc(bd.getc(bx, ty))) { break; } }
					info.keycell = bd.getobj(bx, by - 2);
					info.key51num = info.keycell.qnum2;
					if (ty > by && !evalfunc.call(this, bd.cellinside(bx, by, bx, ty - 2), info, bd)) {
						result = false;
						if (this.checkOnly) { break allloop; }
					}
					by = ty; /* 次のループはbx=ty+2 */
				}
			}
		} while (0);

		if (!result) {
			this.failcode.add(code);
		}
	}
	checkRowsColsFor51cell(evalfunc: (clist: CellList, info: ColsPartlyInfo) => boolean, code: string) {
		this.checkRowsColsPartly(evalfunc, function (cell) { return cell.is51cell(); }, code);
	}

	//---------------------------------------------------------------------------
	// ans.checkBorderCount()  ある交点との周り四方向の境界線の数を判定する(bp==1:黒点が打たれている場合)
	//---------------------------------------------------------------------------
	checkBorderCross() { this.checkBorderCount(4, 0, "bdCross"); }
	checkBorderDeadend() { this.checkBorderCount(1, 0, "bdDeadEnd"); }
	checkBorderCount(val: number, bp: number, code: string) {
		let result = true;
		const bd = this.board;
		const crosses = (bd.hascross === 2 ? bd.cross : bd.crossinside(bd.minbx + 2, bd.minby + 2, bd.maxbx - 2, bd.maxby - 2));
		for (let c = 0; c < crosses.length; c++) {
			const cross = crosses[c];
			if (cross.lcnt !== val || ((bp === 1 && cross.qnum !== 1) || (bp === 2 && cross.qnum === 1))) { continue; }

			result = false;
			if (this.checkOnly) { break; }
			cross.setCrossBorderError();
		}
		if (!result) {
			this.failcode.add(code);
			bd.border.setnoerr();
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkLineShape()  すべての丸などで区切られた線が、pathを引数に取るevalfunc==falseになるかどうか判定する
	// ans.checkLineShapeDeadend()  オブジェクトを結ぶ線が途中で途切れていることを判定する
	//---------------------------------------------------------------------------
	checkLineShape(evalfunc: (seg: IPathSeg) => boolean, code: string) {
		let result = true;
		const pathsegs = this.getLineShapeInfo();
		for (let id = 0; id < pathsegs.length; id++) {
			const pathseg = pathsegs[id];
			if (!pathseg || !evalfunc(pathseg)) { continue; }

			result = false;
			if (this.checkOnly) { break; }
			const cells = pathseg.cells;
			if (!!cells[0] && cells[0] !== null) { cells[0].seterr(1); }
			if (!!cells[1] && cells[1] !== null) { cells[1].seterr(1); }
			pathseg.objs.seterr(1);
		}
		if (!result) {
			this.failcode.add(code);
			this.board.border.setnoerr();
		}
	}
	checkLineShapeDeadend() {
		this.checkLineShape(function (pathseg) { return pathseg.cells[1].isnull; }, "lcDeadEnd");
	}

	//--------------------------------------------------------------------------------
	// ans.getLineShapeInfo() 丸などで区切られた線を探索し情報を設定する
	// ans.serachLineShapeInfo() 丸などで区切られた線を探索します
	//--------------------------------------------------------------------------------
	getLineShapeInfo() {
		if (this._info.num) { return this._info.num; }

		const bd = this.board;
		const pathsegs = [];
		const passed: boolean[] = [];
		for (let id = 0; id < bd.border.length; id++) { passed[id] = false; }

		const clist = bd.cell.filter(function (cell) { return cell.isNum(); });
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			const adb = cell.adjborder;
			const dir4bd = [adb.top, adb.bottom, adb.left, adb.right];
			for (let a = 0; a < 4; a++) {
				const firstbd = dir4bd[a];
				if (firstbd.isnull) { continue; }

				const pathseg = this.serachLineShapeInfo(cell, (a + 1), passed);
				if (!!pathseg) { pathsegs.push(pathseg); }
			}
		}
		this._info.num = pathsegs
		return pathsegs;
	}
	serachLineShapeInfo(cell1: Cell, dir: number, passed: boolean[]): IPathSeg | null {
		const pathseg = {
			objs: (new BorderList()),
			cells: [cell1, null!] as [Cell, Cell],	// 出発したセル、到達したセル
			ccnt: 0,				// 曲がった回数
			length: [] as number[],				// 曲がった箇所で区切った、それぞれの線分の長さの配列
			dir1: dir,			// dir1 スタート地点で線が出発した方向
			dir2: 0				// dir2 到達地点から見た、到達した線の方向
		};

		const pos = cell1.getaddr();
		while (1) {
			pos.movedir(dir, 1);
			if (pos.oncell()) {
				const cell = pos.getc();
				const adb = cell.adjborder;
				if (cell.isnull || cell1 === cell || cell.isNum()) { break; }
				if (this.board.linegraph.iscrossing(cell) && cell.lcnt >= 3) { }
				else if (dir !== 1 && adb.bottom.isLine()) { if (dir !== 2) { pathseg.ccnt++; } dir = 2; }
				else if (dir !== 2 && adb.top.isLine()) { if (dir !== 1) { pathseg.ccnt++; } dir = 1; }
				else if (dir !== 3 && adb.right.isLine()) { if (dir !== 4) { pathseg.ccnt++; } dir = 4; }
				else if (dir !== 4 && adb.left.isLine()) { if (dir !== 3) { pathseg.ccnt++; } dir = 3; }
			}
			else {
				const border = pos.getb();
				if (border.isnull || !border.isLine() || passed[border.id]) { break; }

				pathseg.objs.add(border);
				passed[border.id] = true;

				if (Number.isNaN(pathseg.length[pathseg.ccnt])) { pathseg.length[pathseg.ccnt] = 1; } else { pathseg.length[pathseg.ccnt]++; }
			}
		}

		if (pathseg.objs.length > 0) {
			pathseg.cells[1] = pos.getc();
			pathseg.dir2 = [0, 2, 1, 4, 3][dir];
			return pathseg;
		}
		return null;
	}
}

//---------------------------------------------------------------------------
// ★CheckInfoクラス ans.checkで返すインスタンスのクラス
//---------------------------------------------------------------------------
class CheckInfo {
	list: string[]
	constructor() {
		this.list = []
	}
	complete = true
	text = ''
	shouldForceRedraw = false

	lastcode: string | null = null

	add(code: string) {
		if (!code) { return; }
		if (code !== this.lastcode) {
			this.list.push(code)
			this.lastcode = code;
		}
		this.complete = false;
	}
	gettext(textlist: Map<string, [string, string]>, lang?: string) {
		const texts = [];
		const langcode = ((lang || pzpr.lang) === "ja" ? 0 : 1);
		if (this.list.length === 0) {
			return textlist.get("complete")![langcode];
		}
		for (let i = 0; i < this.list.length; i++) {
			const textitem = textlist.get(this.list[i]) || textlist.get("invalid")!;
			texts.push(textitem[langcode]);
		}
		return texts.join("\n");
	}
}


