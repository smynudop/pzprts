// Answer.js v3.4.1

import { CellList } from "./PieceList";
import { Puzzle } from "./Puzzle";
import { BorderList } from "./PieceList";
import { BoardPiece, Cell, EXCell, Border, Cross } from "./Piece";
import { GraphBase, GraphComponent } from "./GraphBase";
import { AreaGraphBase, AreaRoomGraph } from "./AreaManager";
import { pzpr } from "../pzpr/core";

//---------------------------------------------------------------------------
// ★AnsCheckクラス 答えチェック関連の関数を扱う
//---------------------------------------------------------------------------

// 回答チェッククラス
// AnsCheckクラス

//---------------------------------------------------------
type CellCheck = (cell: Cell) => boolean
type CellCheck2 = (cell1: Cell, cell2: Cell) => boolean
type AreaCheck = (cols: number, rows: number, a: number, n: number) => boolean
type CellListCheck = (clist: CellList) => boolean

type IPathSeg = {
	objs: BorderList
	cells: [Cell, Cell]	// 出発したセル、到達したセル
	ccnt: number				// 曲がった回数
	length: number[]				// 曲がった箇所で区切った、それぞれの線分の長さの配列
	dir1: number		// dir1 スタート地点で線が出発した方向
	dir2: number				// dir2 到達地点から見た、到達した線の方向
}

import { type Board } from "./Board";


export class AnsCheck<
	TCell extends Cell = Cell,
	TCross extends Cross = Cross,
	TBorder extends Border = Border,
	TEXCell extends EXCell = EXCell
> {
	inCheck: boolean
	checkOnly: boolean
	puzzle: Puzzle<TCell, TCross, TBorder, TEXCell>
	pid: string
	constructor(puzzle: Puzzle<TCell, TCross, TBorder, TEXCell>) {
		this.puzzle = puzzle
		this.pid = puzzle.pid
		this.inCheck = false;
		this.checkOnly = false;

		this.makeCheckList();
	}
	failcodemode: boolean = (void 0)
	failcode: CheckInfo = (void 0)
	_info: any = (void 0)
	checklist: any = []
	checklist_normal: any[] = []
	checklist_auto: any[] = []


	//---------------------------------------------------------------------------
	// ans.makeCheckList() 最初にchecklistの配列を生成する
	//---------------------------------------------------------------------------
	makeCheckList() {
		/* 当該パズルで使用しないchecklistのアイテムをフィルタリング */
		var checklist = this.checklist, order = [];
		for (var i = 0; i < checklist.length; i++) {
			var item = checklist[i], isexist = true, prio = 0;
			if (item.match('@')) {
				isexist = pzpr.util.checkpid(item.substr(item.indexOf('@') + 1), this.puzzle.pid);
				item = item.substr(0, item.indexOf('@'));
			}
			if (isexist) {
				prio = (item.match(/\+/) || []).length;
				item = item.replace(/\+/g, "");
				// @ts-ignore
				order.push([this[item], prio]);
			}
		}

		this.checklist_normal = [];
		for (var i = 0; i < order.length; i++) { this.checklist_normal.push(order[i][0]); }

		/* autocheck用のエラーをソートする */
		order = order.sort(function (a, b) { return b[1] - a[1]; });
		this.checklist_auto = [];
		for (var i = 0; i < order.length; i++) { this.checklist_auto.push(order[i][0]); }
	}
	//---------------------------------------------------------------------------
	// ans.check()     答えのチェックを行う
	// ans.checkAns()  答えのチェックを行い、エラーコードを返す(nullはNo Error)
	//---------------------------------------------------------------------------
	check(activemode: boolean) {
		var puzzle = this.puzzle, bd = this.puzzle.board;
		this.inCheck = true;

		if (!!activemode) {
			this.checkOnly = false;
			this.checkAns(false);
			if (!this.failcode.complete) {
				bd.haserror = true;
				puzzle.redraw(true);	/* 描画キャッシュを破棄して描画し直す */
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
		this.failcode = new CheckInfo(this.puzzle);
		var checkSingleError = (!this.puzzle.getConfig("multierr") || break_if_error);
		var checklist = ((this.checkOnly && checkSingleError) ? this.checklist_auto : this.checklist_normal);
		for (var i = 0; i < checklist.length; i++) {
			checklist[i].call(this);
			if (checkSingleError && (this.failcode.length > 0)) { break; }
		}
		if (!break_if_error) { this.failcode.text = this.failcode.gettext(); }
	}

	//---------------------------------------------------------------------------
	// ans.resetCache() 前回のエラー情報等を破棄する
	//---------------------------------------------------------------------------
	resetCache() {
		this.failcode = this.failcodemode = void 0;
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
	checkAllCell(func: (cell: TCell) => boolean, code: string) {
		for (var c = 0; c < this.puzzle.board.cell.length; c++) {
			var cell = this.puzzle.board.cell[c];
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
		this.checkAllCell(function (cell) { return (cell.lcnt >= 2 && cell.isNum()); }, (this.puzzle.board.linegraph.moveline ? "laOnNum" : "lcOnNum"));
	}

	//---------------------------------------------------------------------------
	// ans.checkDir4Cell()  セルの周囲4マスの条件がfunc==trueの時、エラーを設定する
	//---------------------------------------------------------------------------
	checkDir4Cell(iscount: boolean, type: number, code: string) { // type = 0:違う 1:numより小さい 2:numより大きい
		for (var c = 0; c < this.puzzle.board.cell.length; c++) {
			var cell = this.puzzle.board.cell[c];
			if (!cell.isValidNum()) { continue; }
			var num = cell.getNum(), count = cell.countDir4Cell(iscount);
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
		var result = true, bd = this.puzzle.board;
		for (var c = 0; c < bd.cell.length; c++) {
			var cell = bd.cell[c], cell2 = cell.adjacent.right;
			if (cell.bx < bd.maxbx - 1 && func(cell, cell2 as Cell)) {
				result = false;
				if (this.checkOnly) { break; }
				cell.seterr(1);
				cell2.seterr(1);
			}
			cell2 = cell.adjacent.bottom;
			if (cell.by < bd.maxby - 1 && func(cell, cell2 as Cell)) {
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
		var bd = this.puzzle.board;
		for (var c = 0; c < bd.cell.length; c++) {
			var cell = bd.cell[c];
			if (cell.bx >= bd.maxbx - 1 || cell.by >= bd.maxby - 1) { continue; }

			var bx = cell.bx, by = cell.by;
			var clist = bd.cellinside(bx, by, bx + 2, by + 2).filter(func) as CellList<TCell>;
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
		this.checkSameObjectInRoom(this.puzzle.board.roommgr, function (cell) { return (cell.isShade() ? 1 : 2); }, "bkMixed");
	}

	//---------------------------------------------------------------------------
	// ans.checkConnectShade()    黒マスがひとつながりかどうかを判定する
	// ans.checkConnectUnshade()  白マスがひとつながりかどうかを判定する
	// ans.checkConnectNumber()   数字がひとつながりかどうかを判定する
	// ans.checkOneArea()  白マス/黒マス/線がひとつながりかどうかを判定する
	// ans.checkConnectUnshadeRB() 連黒分断禁のパズルで白マスが分断されているかチェックする
	//---------------------------------------------------------------------------
	checkConnectShade() { this.checkOneArea(this.puzzle.board.sblkmgr, "csDivide"); }
	checkConnectUnshade() { this.checkOneArea(this.puzzle.board.ublkmgr, "cuDivide"); }
	checkConnectNumber() { this.checkOneArea(this.puzzle.board.nblkmgr, "nmDivide"); }
	checkOneArea(graph: GraphBase, code: string) {
		if (graph.components.length > 1) {
			this.failcode.add(code);
			graph.components[0].getnodeobjs().seterr(1);
		}
	}

	checkConnectUnshadeRB() {
		if (this.puzzle.board.ublkmgr.components.length > 1) {
			this.failcode.add("cuDivideRB");
			var errclist = new CellList(this.puzzle);
			var clist = this.puzzle.board.cell.filter(function (cell) { return cell.isShade(); });
			for (var i = 0; i < clist.length; i++) {
				var cell = clist[i], list = cell.getdir4clist(), fid = null;
				for (var n = 0; n < list.length; n++) {
					var cell2 = list[n][0];
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
		if (!this.puzzle.execConfig('allowempty')) {
			var bd = this.puzzle.board;
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
		var bd = this.puzzle.board, paths = bd.linegraph.components;
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
		if (!this.puzzle.execConfig('allowempty')) {
			if (this.puzzle.board.cell.some(function (cell) { return cell.isValidNum(); })) { return; }
			this.failcode.add("brNoValidNum");
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkConnectAllNumber() 盤面に引かれている線が一つに繋がっていることを判定する
	//---------------------------------------------------------------------------
	checkConnectAllNumber() {
		var bd = this.puzzle.board, paths = bd.linegraph.components;
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
		if (!this.puzzle.execConfig('allowempty')) {
			var bd = this.puzzle.board;
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
		var result = true, bd = this.puzzle.board;
		if (!bd.linegraph.ltotal[val]) { return; }

		if (!bd.borderAsLine) {
			this.checkAllCell(function (cell) { return cell.lcnt === val; }, code);
		}
		else {
			var boardcross = bd.cross;
			for (var c = 0; c < boardcross.length; c++) {
				var cross = boardcross[c];
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
		if (!this.puzzle.board.linegraph.ltotal[val]) { return; }

		this.checkAllCell(function (cell) { return (cell.noNum() && cell.lcnt === val); }, code);
	}

	//---------------------------------------------------------------------------
	// ans.checkenableLineParts() '一部があかされている'線の部分に、線が引かれているか判定する
	//---------------------------------------------------------------------------
	checkenableLineParts() {
		var bd = this.puzzle.board;
		for (var c = 0; c < bd.cell.length; c++) {
			var cell = bd.cell[c], adb = cell.adjborder;
			if ((!adb.top.isLine() || !cell.noLP(cell.UP)) &&
				(!adb.bottom.isLine() || !cell.noLP(cell.DN)) &&
				(!adb.left.isLine() || !cell.noLP(cell.LT)) &&
				(!adb.right.isLine() || !cell.noLP(cell.RT))) { continue; }

			this.failcode.add("ceAddLine");
			if (this.checkOnly) { break; }
			cell.seterr(1);
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkAllArea()    すべてのエリアがevalfuncを満たすかどうか判定する
	// ans.checkAllBlock()   すべてのfuncを満たすマスで構成されるエリアが
	//                       evalfuncを満たすかどうか判定する
	// ans.checkAllArea2()   すべてのエリアがareaを引数に取るevalfuncを満たすかどうか判定する
	//---------------------------------------------------------------------------
	checkAllArea(graph: AreaGraphBase, evalfunc: AreaCheck, code: string) { this.checkAllBlock(graph, null, evalfunc, code); }
	checkAllBlock(graph: AreaGraphBase, filterfunc: CellCheck, evalfunc: AreaCheck, code: string) {
		var areas = graph.components;
		for (var id = 0; id < areas.length; id++) {
			var area = areas[id], clist = area.clist;
			var top = (!!area.top ? area.top : clist.getQnumCell());
			var d = clist.getRectSize();
			var a = (!!filterfunc ? clist.filter(filterfunc) : clist).length;
			var n = ((!!top && !top.isnull) ? top.qnum : -1);
			if (evalfunc(d.cols, d.rows, a, n)) { continue; }

			this.failcode.add(code);
			if (this.checkOnly) { break; }
			//@ts-ignore

			if (areas !== this.puzzle.board.linegraph) {
				clist.seterr(this.pid !== "tateyoko" ? 1 : 4);
			}
			else {
				this.puzzle.board.border.setnoerr();
				//@ts-ignore

				area.objs.seterr(1);
			}
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkNumberAndSize()  部屋にある数字と面積が等しいか判定する
	// ans.checkRoomRect()       領域が全て四角形であるかどうか判定する
	//---------------------------------------------------------------------------
	checkNumberAndSize() { this.checkAllArea(this.puzzle.board.roommgr, function (w, h, a, n) { return (n <= 0 || n === a); }, "bkSizeNe"); }
	checkRoomRect() { this.checkAllArea(this.puzzle.board.roommgr, function (w, h, a, n) { return (w * h === a); }, "bkNotRect"); }

	//---------------------------------------------------------------------------
	// ans.checkNoNumber()       部屋に数字が含まれていないかの判定を行う
	// ans.checkDoubleNumber()   部屋に数字が2つ以上含まれていないように判定を行う
	//---------------------------------------------------------------------------
	checkNoNumber() { this.checkAllBlock(this.puzzle.board.roommgr, function (cell) { return cell.isNum(); }, function (w, h, a, n) { return (a !== 0); }, "bkNoNum"); }
	checkDoubleNumber() { this.checkAllBlock(this.puzzle.board.roommgr, function (cell) { return cell.isNum(); }, function (w, h, a, n) { return (a < 2); }, "bkNumGe2"); }

	//---------------------------------------------------------------------------
	// ans.checkShadeCellCount() 領域内の数字と黒マスの数が等しいか判定する
	// ans.checkNoShadeCellInArea()  部屋に黒マスがあるか判定する
	//---------------------------------------------------------------------------
	checkShadeCellCount() { this.checkAllBlock(this.puzzle.board.roommgr, function (cell) { return cell.isShade(); }, function (w, h, a, n) { return (n < 0 || n === a); }, "bkShadeNe"); }
	checkNoShadeCellInArea() { this.checkAllBlock(this.puzzle.board.roommgr, function (cell) { return cell.isShade(); }, function (w, h, a, n) { return (a > 0); }, "bkNoShade"); }

	//---------------------------------------------------------------------------
	// ans.checkLinesInArea()  領域の中で線が通っているセルの数を判定する
	//---------------------------------------------------------------------------
	checkLinesInArea(graph: AreaGraphBase, evalfunc: AreaCheck, code: string) { this.checkAllBlock(graph, function (cell) { return cell.lcnt > 0; }, evalfunc, code); }

	//---------------------------------------------------------------------------
	// ans.checkNoMovedObjectInRoom() 領域に移動後のオブジェクトがないと判定する
	//---------------------------------------------------------------------------
	checkNoMovedObjectInRoom(graph: AreaGraphBase) { this.checkAllBlock(graph, function (cell) { return cell.base.qnum !== -1; }, function (w, h, a, n) { return (a !== 0); }, "bkNoNum"); }

	//---------------------------------------------------------------------------
	// ans.checkDisconnectLine() 数字などに繋がっていない線の判定を行う
	// ans.checkConnectObject()  数字が線で2つ以上繋がっていないように判定を行う
	// ans.checkTripleObject()   数字が線で3つ以上繋がっていないように判定を行う
	// ans.checkConnectObjectCount() 上記関数の共通処理
	//---------------------------------------------------------------------------
	checkDisconnectLine() { this.checkConnectObjectCount(function (a) { return (a > 0); }, (this.puzzle.board.linegraph.moveline ? "laIsolate" : "lcIsolate")); }
	checkConnectObject() { this.checkConnectObjectCount(function (a) { return (a < 2); }, "nmConnected"); }
	checkTripleObject() { this.checkConnectObjectCount(function (a) { return (a < 3); }, "lcTripleNum"); }
	checkConnectObjectCount(evalfunc: (a: number) => boolean, code: string) {
		var result = true, paths = this.puzzle.board.linegraph.components;
		for (var id = 0; id < paths.length; id++) {
			var clist = paths[id].clist;
			if (evalfunc(clist.filter(function (cell) { return cell.isNum(); }).length)) { continue; }

			result = false;
			if (this.checkOnly) { break; }
			this.puzzle.board.border.setnoerr();
			paths[id].setedgeerr(1);
			paths[id].clist.seterr(4);
		}
		if (!result) {
			this.failcode.add(code);
			this.puzzle.board.border.setnoerr();
		}
	}

	//---------------------------------------------------------------------------
	// ans.checkSideAreaSize() 境界線をはさんで接する部屋のgetvalで得られるサイズが異なることを判定する
	// ans.checkSideAreaCell() 境界線をはさんでタテヨコに接するセルの判定を行う
	//---------------------------------------------------------------------------
	checkSideAreaSize(graph: AreaRoomGraph, getval: (c: GraphComponent) => any, code: string) {
		var sides = graph.getSideAreaInfo();
		for (var i = 0; i < sides.length; i++) {
			var a1 = getval(sides[i][0]), a2 = getval(sides[i][1]);
			if (a1 <= 0 || a2 <= 0 || a1 !== a2) { continue; }

			this.failcode.add(code);
			if (this.checkOnly) { break; }
			sides[i][0].clist.seterr(1);
			sides[i][1].clist.seterr(1);
		}
	}

	checkSideAreaCell(func: CellCheck2, flag: boolean, code: string) {
		for (var id = 0; id < this.puzzle.board.border.length; id++) {
			var border = this.puzzle.board.border[id];
			if (!border.isBorder()) { continue; }
			var cell1 = border.sidecell[0], cell2 = border.sidecell[1];
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
	checkSameObjectInRoom(graph: AreaGraphBase, getvalue: (cell: Cell) => number, code: string) {
		var areas = graph.components;
		allloop:
		for (var id = 0; id < areas.length; id++) {
			var clist = areas[id].clist;
			var roomval = -1;
			for (var i = 0; i < clist.length; i++) {
				var cell = clist[i], val = getvalue(cell);
				if (val === -1 || roomval === val) { continue; }
				if (roomval === -1) { roomval = val; }
				else {
					this.failcode.add(code);
					if (this.checkOnly) { break allloop; }
					if (areas !== this.puzzle.board.linegraph.components) {
						clist.seterr(1);
					}
					else {
						this.puzzle.board.border.setnoerr();
						areas[id].setedgeerr(1);
					}
				}
			}
		}
	}

	checkDifferentNumberInRoom() {
		this.checkDifferentNumberInRoom_main(this.puzzle.board.roommgr, this.isDifferentNumberInClist);
	}
	checkDifferentNumberInRoom_main(graph: AreaGraphBase, evalfunc: CellListCheck) {
		var areas = graph.components;
		for (var r = 0; r < areas.length; r++) {
			var clist = areas[r].clist;
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
		var result = true, d: number[] = [], num: number[] = [];
		var max = -1, bottom = clist[0].getminnum();
		for (var i = 0; i < clist.length; i++) { if (max < numfunc(clist[i])) { max = numfunc(clist[i]); } }
		for (var n = bottom; n <= max; n++) { d[n] = 0; }
		for (var i = 0; i < clist.length; i++) { num[clist[i].id] = numfunc(clist[i]); }

		for (var i = 0; i < clist.length; i++) { if (num[clist[i].id] >= bottom) { d[num[clist[i].id]]++; } }
		var clist2 = clist.filter(function (cell) { return (num[cell.id] >= bottom && d[num[cell.id]] >= 2); }) as CellList;
		if (clist2.length > 0) { clist2.seterr(1); result = false; }
		return result;
	}

	//---------------------------------------------------------------------------
	// ans.checkRowsCols()              タテ列・ヨコ列の数字の判定を行う
	// ans.checkDifferentNumberInLine() タテ列・ヨコ列に同じ数字が入っていないことを判定する
	//---------------------------------------------------------------------------
	/* ともにevalfuncはAnswerクラスの関数限定 */
	checkRowsCols(evalfunc: CellListCheck, code: string) {
		var result = true, bd = this.puzzle.board;
		allloop: do {
			/* 横方向サーチ */
			for (var by = 1; by <= bd.maxby; by += 2) {
				var clist = bd.cellinside(bd.minbx + 1, by, bd.maxbx - 1, by);
				if (evalfunc.call(this, clist)) { continue; }

				result = false;
				if (this.checkOnly) { break allloop; }
			}
			/* 縦方向サーチ */
			for (var bx = 1; bx <= bd.maxbx; bx += 2) {
				var clist = bd.cellinside(bx, bd.minby + 1, bx, bd.maxby - 1);
				if (evalfunc.call(this, clist)) { continue; }

				result = false;
				if (this.checkOnly) { break allloop; }
			}
		} while (0);

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
	checkRowsColsPartly(evalfunc: (clist: CellList, info: any) => boolean, termfunc: CellCheck, code: string) {
		var result = true, bd = this.puzzle.board, info;
		allloop: do {
			/* 横方向サーチ */
			info = { keycell: null as BoardPiece, key51num: -1, isvert: false };
			for (var by = 1; by <= bd.maxby; by += 2) {
				for (var bx = 1; bx <= bd.maxbx; bx += 2) {
					for (var tx = bx; tx <= bd.maxbx; tx += 2) { if (termfunc(bd.getc(tx, by))) { break; } }
					info.keycell = bd.getobj(bx - 2, by);
					info.key51num = info.keycell.qnum;
					if (tx > bx && !evalfunc.call(this, bd.cellinside(bx, by, tx - 2, by), info)) {
						result = false;
						if (this.checkOnly) { break allloop; }
					}
					bx = tx; /* 次のループはbx=tx+2 */
				}
			}
			/* 縦方向サーチ */
			info = { keycell: null as BoardPiece, key51num: -1, isvert: true };
			for (var bx = 1; bx <= bd.maxbx; bx += 2) {
				for (var by = 1; by <= bd.maxby; by += 2) {
					for (var ty = by; ty <= bd.maxby; ty += 2) { if (termfunc(bd.getc(bx, ty))) { break; } }
					info.keycell = bd.getobj(bx, by - 2);
					info.key51num = info.keycell.qnum2;
					if (ty > by && !evalfunc.call(this, bd.cellinside(bx, by, bx, ty - 2), info)) {
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
	checkRowsColsFor51cell(evalfunc: (clist: CellList, info: any) => boolean, code: string) {
		this.checkRowsColsPartly(evalfunc, function (cell) { return cell.is51cell(); }, code);
	}

	//---------------------------------------------------------------------------
	// ans.checkBorderCount()  ある交点との周り四方向の境界線の数を判定する(bp==1:黒点が打たれている場合)
	//---------------------------------------------------------------------------
	checkBorderCross() { this.checkBorderCount(4, 0, "bdCross"); }
	checkBorderDeadend() { this.checkBorderCount(1, 0, "bdDeadEnd"); }
	checkBorderCount(val: number, bp: number, code: string) {
		var result = true, bd = this.puzzle.board;
		var crosses = (bd.hascross === 2 ? bd.cross : bd.crossinside(bd.minbx + 2, bd.minby + 2, bd.maxbx - 2, bd.maxby - 2));
		for (var c = 0; c < crosses.length; c++) {
			var cross = crosses[c];
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
		var result = true, pathsegs = this.getLineShapeInfo();
		for (var id = 0; id < pathsegs.length; id++) {
			var pathseg = pathsegs[id];
			if (!pathseg || !evalfunc(pathseg)) { continue; }

			result = false;
			if (this.checkOnly) { break; }
			var cells = pathseg.cells;
			if (!!cells[0] && cells[0] !== null) { cells[0].seterr(1); }
			if (!!cells[1] && cells[1] !== null) { cells[1].seterr(1); }
			pathseg.objs.seterr(1);
		}
		if (!result) {
			this.failcode.add(code);
			this.puzzle.board.border.setnoerr();
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

		var bd = this.puzzle.board;
		var pathsegs = [], passed: boolean[] = [];
		for (var id = 0; id < bd.border.length; id++) { passed[id] = false; }

		var clist = bd.cell.filter(function (cell) { return cell.isNum(); });
		for (var i = 0; i < clist.length; i++) {
			var cell = clist[i], adb = cell.adjborder;
			var dir4bd = [adb.top, adb.bottom, adb.left, adb.right];
			for (var a = 0; a < 4; a++) {
				var firstbd = dir4bd[a];
				if (firstbd.isnull) { continue; }

				var pathseg = this.serachLineShapeInfo(cell, (a + 1), passed);
				if (!!pathseg) { pathsegs.push(pathseg); }
			}
		}

		return (this._info.num = pathsegs);
	}
	serachLineShapeInfo(cell1: Cell, dir: number, passed: boolean[]): IPathSeg {
		var pathseg = {
			objs: (new BorderList(this.puzzle)),
			cells: [cell1, null] as [Cell, Cell],	// 出発したセル、到達したセル
			ccnt: 0,				// 曲がった回数
			length: [] as number[],				// 曲がった箇所で区切った、それぞれの線分の長さの配列
			dir1: dir,			// dir1 スタート地点で線が出発した方向
			dir2: 0				// dir2 到達地点から見た、到達した線の方向
		};

		var pos = cell1.getaddr();
		while (1) {
			pos.movedir(dir, 1);
			if (pos.oncell()) {
				var cell = pos.getc(), adb = cell.adjborder;
				if (cell.isnull || cell1 === cell || cell.isNum()) { break; }
				else if (this.puzzle.board.linegraph.iscrossing(cell) && cell.lcnt >= 3) { }
				else if (dir !== 1 && adb.bottom.isLine()) { if (dir !== 2) { pathseg.ccnt++; } dir = 2; }
				else if (dir !== 2 && adb.top.isLine()) { if (dir !== 1) { pathseg.ccnt++; } dir = 1; }
				else if (dir !== 3 && adb.right.isLine()) { if (dir !== 4) { pathseg.ccnt++; } dir = 4; }
				else if (dir !== 4 && adb.left.isLine()) { if (dir !== 3) { pathseg.ccnt++; } dir = 3; }
			}
			else {
				var border = pos.getb();
				if (border.isnull || !border.isLine() || passed[border.id]) { break; }

				pathseg.objs.add(border);
				passed[border.id] = true;

				if (isNaN(pathseg.length[pathseg.ccnt])) { pathseg.length[pathseg.ccnt] = 1; } else { pathseg.length[pathseg.ccnt]++; }
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
class CheckInfo extends Array<string> {
	puzzle: Puzzle
	constructor(puzzle: Puzzle, code: string = null) {
		super()
		this.puzzle = puzzle
		this.add(code);
	}
	complete = true
	text = ''

	lastcode: string = null

	add(code: string) {
		if (!code) { return; }
		if (code !== this.lastcode) {
			this.push(code)
			this.lastcode = code;
		}
		this.complete = false;
	}
	gettext(lang: string = null) {
		var puzzle = this.puzzle, textlist = puzzle.faillist, texts = [];
		var langcode = ((lang || pzpr.lang) === "ja" ? 0 : 1);
		if (this.length === 0) { return textlist.complete[langcode]; }
		for (var i = 0; i < this.length; i++) {
			//@ts-ignore
			var textitem = textlist[this[i]] || textlist.invalid;
			texts.push(textitem[langcode]);
		}
		return texts.join("\n");
	}
}

//---------------------------------------------------------------------------
// ★FailCodeクラス 答えの文字列を扱う
//---------------------------------------------------------------------------
// FailCodeクラス
export class FailCode {
	complete = ["正解です！", "Complete!"]
	invalid = ["不明なエラーです", "Invalid Error"]
	/* ** 黒マス ** */
	cs2x2 = ["2x2の黒マスのかたまりがあります。", "There is a 2x2 block of shaded cells."]
	cu2x2 = ["2x2の白マスのかたまりがあります。", "There is a 2x2 block of unshaded cells."]
	csNotSquare = ["正方形でない黒マスのカタマリがあります。", "A mass of shaded cells is not regular rectangle."]
	csAdjacent = ["黒マスがタテヨコに連続しています。", "Shaded cells are adjacent."]
	csDivide = ["黒マスが分断されています。", "Shaded cells are divided,"]
	cuDivide = ["白マスが分断されています。", "Unshaded cells are divided."]
	cuDivideRB = ["白マスが分断されています。", "Unshaded cells are divided."] /* 連黒分断禁 */
	brNoShade = ["盤面に黒マスがありません。", "There are no shaded cells on the board."]

	/* ** 領域＋数字 ** */
	bkNoNum = ["数字のないブロックがあります。", "A block has no number."]
	bkNumGe2 = ["1つのブロックに2つ以上の数字が入っています。", "A block has plural numbers."]
	bkDupNum = ["同じブロックに同じ数字が入っています。", "There are same numbers in a block."]
	bkPlNum = ["複数種類の数字が入っているブロックがあります。", "A block has two or more kinds of numbers."]
	bkSepNum = ["同じ数字が異なるブロックに入っています。", "One kind of numbers is included in dirrerent blocks."]

	bkSizeNe = ["数字とブロックの大きさが違います。", "The size of the block is not equal to the number."]

	bkShadeNe = ["部屋の数字と黒マスの数が一致していません。", "The number of shaded cells in the room and The number written in the room is different."]
	bkShadeDivide = ["1つの部屋に入る黒マスが2つ以上に分裂しています。", "Shaded cells are divided in one room."]
	bkNoShade = ["黒マスがない部屋があります。", "A room has no shaded cell."]
	bkMixed = ["白マスと黒マスの混在したタイルがあります。", "A tile includes both shaded and unshaded cells."]

	bkWidthGt1 = ["幅が１マスではないタタミがあります。", "The width of the tatami is not one."]

	brNoValidNum = ["盤面に数字がありません。", "There are no numbers on the board."]

	/* ** 領域＋線を引く ** */
	brNoLine = ["線が引かれていません。", "There is no line on the board."]

	/* ** 盤面切り分け系 ** */
	bkNotRect = ["四角形ではない部屋があります。", "There is a room whose shape is not square."]
	bdDeadEnd = ["途中で途切れている線があります。", "There is a dead-end line."]
	bdCross = ["十字の交差点があります。", "There is a crossing border line."]

	/* ** 線を引く系 ** */
	lnDeadEnd = ["途中で途切れている線があります。", "There is a dead-end line."]
	lnBranch = ["分岐している線があります。", "There is a branch line."]
	lnCross = ["線が交差しています。", "There is a crossing line."]
	lnNotCrossMk = ["十字の場所で線が交差していません。", "A cross-joint cell doesn't have four-way lines."]
	lnCrossExIce = ["氷の部分以外で線が交差しています。", "A Line is crossed outside of ice."]
	lnCurveOnIce = ["氷の部分で線が曲がっています。", "A Line curve on ice."]
	lnPlLoop = ["輪っかが一つではありません。", "There are plural loops."]
	lnOnShade = ["黒マスの上に線が引かれています。", "There is a line on the shaded cell."]

	/* ** 線でつなぐ系 ** */
	lcDeadEnd = ["線が途中で途切れています。", "There is a dead-end line."]
	lcDivided = ["線が全体で一つながりになっていません。", "All lines and numbers are not connected each other."]
	lcTripleNum = ["3つ以上の数字がつながっています。", "Three or more numbers are connected."]
	lcIsolate = ["数字につながっていない線があります。", "A line doesn't connect any number."]
	lcOnNum = ["数字の上を線が通過しています。", "A line goes through a number."]
	nmNoLine = ["どこにもつながっていない数字があります。", "A number is not connected another number."]
	nmConnected = ["アルファベットが繋がっています。", "There are connected letters."]

	/* ** 線で動かす系 ** */
	laIsolate = ["アルファベットにつながっていない線があります。", "A line doesn't connect any letter."]
	laOnNum = ["アルファベットの上を線が通過しています。", "A line goes through a letter."]
	laCurve = ["曲がっている線があります。", "A line has curve."]
	laLenNe = ["数字と線の長さが違います。", "The length of a line is wrong."]

	/* ** 単体セルチェック ** */
	ceNoNum = ["数字の入っていないマスがあります。", "There is an empty cell."]
	ceNoLine = ["線が引かれていないマスがあります。", "There is an empty cell."]
	ceAddLine = ["最初から引かれている線があるマスに線が足されています。", "Lines are added to the cell that the mark lie in by the question."]

	anShadeNe = ["矢印の方向にある黒マスの数が正しくありません。", "The number of shaded cells are not correct."]

	/* ** 数字系 ** */
	nmAdjacent = ["同じ数字がタテヨコに連続しています。", "Same numbers are adjacent."]
	nmDupRow = ["同じ列に同じ数字が入っています。", "There are same numbers in a row."]
	nmDivide = ["タテヨコにつながっていない数字があります。", "Numbers are divided."]
}

