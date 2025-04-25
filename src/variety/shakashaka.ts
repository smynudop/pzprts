

//---------------------------------------------------------

import { AnsCheck } from "../puzzle/Answer";
import { AreaGraphBase } from "../puzzle/AreaManager";
import { Board } from "../puzzle/Board";
import { BoardExec } from "../puzzle/BoardExec";
import { FileIO } from "../puzzle/FileData";
import { Graphic } from "../puzzle/Graphic";
import { KeyEvent } from "../puzzle/KeyInput";
import { MouseEvent1 } from "../puzzle/MouseInput";
import { type Border, Cell, type Cross, type EXCell } from "../puzzle/Piece";
import * as Constant from "../puzzle/BoardExec"
import type { CellList } from "../puzzle/PieceList";
import type { GraphComponent } from "../puzzle/GraphBase";
import { Puzzle } from "../puzzle/Puzzle";
import { cell4, type Converter } from "../puzzle/Encode";
// マウス入力系
class ShakashakaMouseEvent extends MouseEvent1<ShakashakaCell> {
	override inputModes = { edit: ['number', 'clear'], play: ['objblank', 'completion'] }
	override mouseinput_auto() {
		if (this.puzzle.playmode) {
			const use = +this.puzzle.getConfig('use_tri');
			if (use === 1) {
				if (this.btn === 'left') {
					if (this.mousestart) { this.inputTriangle_corner_start(); }
					else if (this.mousemove && this.inputData !== null) {
						this.inputMove();
					}
				}
				else if (this.btn === 'right') {
					if (this.mousestart || this.mousemove) { this.inputDot(); }
				}
			}
			else if (use === 2) {
				if (this.btn === 'left') {
					if (this.mousestart) {
						this.inputTriangle_pull_start();
					}
					else if (this.mousemove && this.inputData === null) {
						this.inputTriangle_pull_move();
					}
					else if (this.mousemove && this.inputData !== null) {
						this.inputMove();
					}
					else if (this.mouseend && this.notInputted()) {
						this.inputTriangle_pull_end();
					}
				}
				else if (this.btn === 'right') {
					if (this.mousestart || this.mousemove) { this.inputDot(); }
				}
			}
			else if (use === 3) {
				if (this.mousestart) { this.inputTriangle_onebtn(); }
			}
			if (this.mouseend && this.notInputted()) { this.inputqcmp(); }
		}
		else if (this.puzzle.editmode) {
			if (this.mousestart) { this.inputqnum(); }
		}
	}

	inputMove() {
		if (this.inputData >= 2 && this.inputData <= 5) {
			this.inputTriangle_drag();
		}
		else if (this.inputData === 0 || this.inputData === -1) {
			this.inputDot();
		}
	}

	inputTriangle_corner_start() {
		const cell = this.getcell();
		if (cell.isnull) { return; }

		this.inputData = this.checkCornerData(cell);

		cell.setAnswer(this.inputData);
		this.mouseCell = cell;
		cell.draw();
	}
	checkCornerData(cell: ShakashakaCell) {
		if (cell.isNum()) { return -1; }

		let val = null;
		if (this.puzzle.getConfig('support_tri')) {
			// Input support mode
			const adc = cell.adjacent;
			const wall: {
				count: number,
				top?: boolean,
				bottom?: boolean,
				left?: boolean,
				right?: boolean
			} = { count: 0 };
			const data = { top: [2, 3], bottom: [4, 5], left: [3, 4], right: [2, 5] };
			for (const _key in adc) {
				const key = _key as "top" | "left" | "bottom" | "right"
				const cell2 = adc[key];
				wall[key] = (cell2.isWall() || cell2.qans === data[key][0] || cell2.qans === data[key][1]);
				if (wall[key]) { ++wall.count; }
			}

			if (wall.count > 2 || (wall.count === 2 && ((wall.top && wall.bottom) || (wall.left && wall.right)))) {
				return (cell.qsub === 0 ? -1 : 0);
			}

			if (wall.count === 2) {
				if (wall.bottom && wall.left) { val = 2; }
				else if (wall.bottom && wall.right) { val = 3; }
				else if (wall.top && wall.right) { val = 4; }
				else if (wall.top && wall.left) { val = 5; }
				else { val = 0; }
			}
		}

		if (val === null) {
			const dx = this.inputPoint.bx - cell.bx;
			const dy = this.inputPoint.by - cell.by;
			if (dx <= 0) { val = ((dy <= 0) ? 5 : 2); }
			else { val = ((dy <= 0) ? 4 : 3); }
		}
		if (val === cell.qans) { val = -1; }
		else if (cell.qsub === 1) { val = 0; }
		return val;
	}

	inputTriangle_pull_start() {
		const cell = this.getcell();
		if (cell.isnull || cell.isNum()) { this.mousereset(); return; }

		// 最初はどこのセルをクリックしたか取得するだけ
		this.firstPoint.set(this.inputPoint);
		this.mouseCell = cell;
	}
	inputTriangle_pull_move() {
		const cell = this.mouseCell;
		const dx = (this.inputPoint.bx - this.firstPoint.bx);
		const dy = (this.inputPoint.by - this.firstPoint.by);

		// 一定以上動いていたら三角形を入力
		const diff = 0.33;
		if (dx <= -diff && dy >= diff) { this.inputData = 2; }
		else if (dx <= -diff && dy <= -diff) { this.inputData = 5; }
		else if (dx >= diff && dy >= diff) { this.inputData = 3; }
		else if (dx >= diff && dy <= -diff) { this.inputData = 4; }

		if (this.inputData !== null) {
			if (this.inputData === cell.qans) { this.inputData = 0; }
			cell.setAnswer(this.inputData);
		}
		cell.draw();
	}
	inputTriangle_pull_end() {
		const dx = (this.inputPoint.bx - this.firstPoint.bx);
		const dy = (this.inputPoint.by - this.firstPoint.by);

		// ほとんど動いていなかった場合は・を入力
		if (Math.abs(dx) <= 0.1 && Math.abs(dy) <= 0.1) {
			const cell = this.mouseCell;
			cell.setAnswer(cell.qsub !== 1 ? -1 : 0);
			cell.draw();
		}
	}

	inputTriangle_drag() {
		if (this.inputData === null || this.inputData <= 0) { return; }

		const cell = this.getcell();
		if (cell.isnull || cell.isNum()) { return; }

		const dbx = cell.bx - this.mouseCell.bx;
		const dby = cell.by - this.mouseCell.by;
		const tri = this.checkCornerData(cell);
		let ret = null;
		const cur = this.inputData;
		if ((dbx === 2 && dby === 2) || (dbx === -2 && dby === -2)) { // 左上・右下
			if (cur === 2 || cur === 4) { ret = cur; }
		}
		else if ((dbx === 2 && dby === -2) || (dbx === -2 && dby === 2)) { // 右上・左下
			if (cur === 3 || cur === 5) { ret = cur; }
		}
		else if (dbx === 0 && dby === -2) { // 上下反転(上側)
			if (((cur === 2 || cur === 3) && (tri !== cur)) || ((cur === 4 || cur === 5) && (tri === cur))) {
				ret = [null, null, 5, 4, 3, 2][cur];
			}
		}
		else if (dbx === 0 && dby === 2) {  // 上下反転(下側)
			if (((cur === 4 || cur === 5) && (tri !== cur)) || ((cur === 2 || cur === 3) && (tri === cur))) {
				ret = [null, null, 5, 4, 3, 2][cur];
			}
		}
		else if (dbx === -2 && dby === 0) { // 左右反転(左側)
			if (((cur === 3 || cur === 4) && (tri !== cur)) || ((cur === 2 || cur === 5) && (tri === cur))) {
				ret = [null, null, 3, 2, 5, 4][cur];
			}
		}
		else if (dbx === 2 && dby === 0) {  // 左右反転(右側)
			if (((cur === 2 || cur === 5) && (tri !== cur)) || ((cur === 3 || cur === 4) && (tri === cur))) {
				ret = [null, null, 3, 2, 5, 4][cur];
			}
		}

		if (ret !== null) {
			cell.setAnswer(ret);
			this.inputData = ret;
			this.mouseCell = cell;
			cell.draw();
		}
	}
	override inputDot() {
		const cell = this.getcell();
		if (cell.isnull || cell.isNum()) { return; }

		if (this.inputData === null) { this.inputData = (cell.qsub === 1 ? 0 : -1); }

		cell.setAnswer(this.inputData);
		this.mouseCell = cell;
		cell.draw();
	}

	inputTriangle_onebtn() {
		const cell = this.getcell();
		if (cell.isnull || cell.isNum()) { return; }

		const ans = cell.getAnswer();
		if (this.btn === 'left') { this.inputData = [0, 2, 1, 3, 4, 5, -1][ans + 1]; }
		else if (this.btn === 'right') { this.inputData = [5, -1, 1, 0, 2, 3, 4][ans + 1]; }
		cell.setAnswer(this.inputData);
		this.mouseCell = cell;
		cell.draw();
	}

	override inputqcmp() {
		const cell = this.getcell();
		if (cell.isnull || cell.noNum()) { return; }

		cell.setQcmp(+!cell.qcmp);
		cell.draw();

		this.mousereset();
	}
}

//---------------------------------------------------------
// キーボード入力系
class ShakashakaKeyEvent extends KeyEvent {
	override enablemake = true
}

//---------------------------------------------------------
// 盤面管理系
class ShakashakaCell extends Cell {
	override numberRemainsUnshaded = true

	override maxnum = 4
	override minnum = 0

	override adjacent: { top: ShakashakaCell; bottom: ShakashakaCell; left: ShakashakaCell; right: ShakashakaCell; } = null!
	wrect!: GraphComponent

	getAnswer() {
		if (this.isNum()) { return 0; }
		if (this.qans > 0) { return this.qans; }
		if (this.qsub === 1) { return -1; }
		return 0;
	}
	setAnswer(val: number) {
		if (this.isNum()) { return; }
		this.setQans((val >= 2 && val <= 5) ? val : 0);
		this.setQsub((val === -1) ? 1 : 0);
	}

	isTri() { return this.qans !== 0; }
	isWall() { return (this.qsub === 1 || this.isnull || this.isNum()); }
}
class ShakashakaBoard extends Board<ShakashakaCell> {
	wrectmgr!: AreaWrectGraph
	override addExtraInfo() {
		this.wrectmgr = this.addInfoList(AreaWrectGraph);
	}

	override createCell(): ShakashakaCell {
		return new ShakashakaCell(this.puzzle)
	}

	override createBoardExec(): BoardExec {
		return new ShakashakaBoardExec(this.puzzle)
	}
}
class ShakashakaBoardExec extends BoardExec {
	override adjustBoardData(key: number, d: any) {
		let trans = [];
		switch (key) {
			case Constant.FLIPY: trans = [0, 1, 5, 4, 3, 2]; break;	// 上下反転
			case Constant.FLIPX: trans = [0, 1, 3, 2, 5, 4]; break;	// 左右反転
			case Constant.TURNR: trans = [0, 1, 5, 2, 3, 4]; break;	// 右90°回転
			case Constant.TURNL: trans = [0, 1, 3, 4, 5, 2]; break;	// 左90°回転
			default: return;
		}
		const clist = this.board.cell;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			const val = trans[cell.qans];
			if (!!val) { cell.qans = val; }
		}
	}
}
class AreaWrectGraph extends AreaGraphBase {
	override enabled = true
	override relation = { 'cell.qnum': 'node', 'cell.qans': 'node' }
	override setComponentRefs(obj: any, component: any) { obj.wrect = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.wrectnodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.wrectnodes = []; }

	override isnodevalid(cell: any) { return cell.qnum === -1; }
	sldir = [
		[],
		[true, false, true, true, false, false],
		[true, false, false, false, true, true],
		[true, false, false, true, true, false],
		[true, false, true, false, false, true]
	]
	override isedgevalidbynodeobj(cell1: Cell, cell2: Cell) {
		return (this.sldir[cell1.getdir(cell2, 2)][cell1.qans] &&
			this.sldir[cell2.getdir(cell1, 2)][cell2.qans]);
	}
}

//---------------------------------------------------------
// 画像表示系
class ShakashakaGraphic extends Graphic {
	override hideHatena = true

	override gridcolor_type: "DARK" | "LIGHT" | "DLIGHT" | "SLIGHT" | "THIN" = "LIGHT"

	override qanscolor = "black"
	override fgcellcolor_func = "qnum"
	override fontShadecolor = "white"
	override qcmpcolor = "rgb(127,127,127)"

	override paint() {
		this.drawBGCells();
		this.drawDotCells();
		this.drawDashedGrid();
		this.drawQuesCells();
		this.drawQuesNumbers();

		this.drawTriangle();

		this.drawChassis();

		this.drawTarget();
	}
	override getTriangleColor(cell: Cell) {
		return (!cell.trial ? this.shadecolor : this.trialcolor);
	}
	override getQuesNumberColor(cell: Cell) {
		return (cell.qcmp === 1 ? this.qcmpcolor : this.fontShadecolor);

	}
}

//---------------------------------------------------------
class ShakashakaFileIO extends FileIO {
	override decodeData() {
		this.decodeCellQnumb();
		this.decodeCellQanssubcmp();
	}
	override encodeData() {
		this.encodeCellQnumb();
		this.encodeCellQanssubcmp();
	}

	decodeCellQanssubcmp() {
		this.decodeCell(function (cell, ca) {
			if (ca === "+") { cell.qsub = 1; }
			else if (ca === "-") { cell.qcmp = 1; }
			else if (ca !== ".") { cell.qans = +ca; }
		});
	}
	encodeCellQanssubcmp() {
		this.encodeCell(function (cell) {
			if (cell.qans !== 0) { return `${cell.qans} `; }
			if (cell.qsub === 1) { return "+ "; }
			if (cell.qcmp === 1) { return "- "; }
			return ". ";
		});
	}
}

//---------------------------------------------------------
// 正解判定処理実行部
class ShakashakaAnsCheck extends AnsCheck<ShakashakaCell, Cross, Border, EXCell, ShakashakaBoard> {
	override getCheckList() {
		return [
			"checkTriangleExist",
			"checkOverTriangle",
			"checkWhiteArea",
			"checkLessTriangle"
		]
	}

	checkTriangleExist() {
		if (!this.allowempty) {
			if (this.board.cell.some(function (cell) { return cell.qans > 0; })) { return; }
			this.failcode.add("brNoTriangle");
		}
	}

	checkOverTriangle() {
		this.checkDir4Cell(function (cell) { return cell.isTri(); }, 2, "nmTriangleGt");
	}
	checkLessTriangle() {
		this.checkDir4Cell(function (cell) { return cell.isTri(); }, 1, "nmTriangleLt");
	}

	checkWhiteArea() {
		const areas = this.board.wrectmgr.components;
		for (let id = 0; id < areas.length; id++) {
			const clist = areas[id].clist;
			const d = clist.getRectSize();
			const cnt = clist.filter(function (cell) { return (cell.qans === 0); }).length;
			if (d.cols * d.rows === cnt || this.isAreaRect_slope(areas[id])) { continue; }

			this.failcode.add("cuNotRectx");
			if (this.checkOnly) { break; }
			clist.seterr(1);
		}
	}
	// 斜め領域判定用
	isAreaRect_slope(area: GraphComponent) {
		const clist = area.clist as CellList<ShakashakaCell>;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			const adc = cell.adjacent;
			const a = cell.qans;
			if (((a === 4 || a === 5) !== (adc.top.wrect !== area)) ||
				((a === 2 || a === 3) !== (adc.bottom.wrect !== area)) ||
				((a === 2 || a === 5) !== (adc.left.wrect !== area)) ||
				((a === 3 || a === 4) !== (adc.right.wrect !== area))) {
				return false;
			}
		}
		return true;
	}
}

export class Shakashaka extends Puzzle<ShakashakaCell, Cross, Border, EXCell, ShakashakaBoard> {
	override createAnsCheck(): AnsCheck<ShakashakaCell, Cross, Border, EXCell, ShakashakaBoard> {
		return new ShakashakaAnsCheck(this.board)
	}

	override createBoard(): ShakashakaBoard {
		return new ShakashakaBoard(this)
	}

	override createFileIO(): FileIO {
		return new ShakashakaFileIO(this)
	}

	override createGraphic(): Graphic {
		return new ShakashakaGraphic(this)
	}

	override createKeyEvent(): KeyEvent {
		return new ShakashakaKeyEvent(this)
	}

	override createMouseEvent(): MouseEvent1 {
		return new ShakashakaMouseEvent(this)
	}

	override getAdditionalFailCode(): Map<string, [string, string]> | Record<string, [string, string]> {
		return {
			brNoTriangle: ["盤面に三角形がありません。", "There are no triangles on the board."],
			cuNotRectx: ["白マスが長方形(正方形)ではありません。", "A white area is not rectangle."],
			nmTriangleGt: ["数字のまわりにある黒い三角形の数が間違っています。", "The number of triangles in four adjacent cells is bigger than it."],
			nmTriangleLt: ["数字のまわりにある黒い三角形の数が間違っています。", "The number of triangles in four adjacent cells is smaller than it."]
		}
	}

	override getConverters(): Converter[] {
		return [cell4]
	}
}