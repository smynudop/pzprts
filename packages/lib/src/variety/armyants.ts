//
// パズル固有スクリプト部 お家に帰ろう・ぐんたいあり版 kaero.js

import { AreaGraphBase } from "../puzzle/AreaManager";
import type { GraphComponent, GraphNode } from "../puzzle/GraphBase";
import type { Border, Cell, IDir } from "../puzzle/Piece";
import type { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const ArmyAnts = createVariety({
	pid: "armyants",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['border', 'number', 'clear'], play: ['line', 'peke', 'bgcolor', 'bgcolor1', 'bgcolor2', 'clear'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === 'left') { this.inputLine(); }
					else if (this.btn === 'right') { this.inputpeke(); }
				}
				else if (this.mouseend && this.notInputted()) {
					this.inputlight();
				}
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) { this.inputborder(); }
				else if (this.mouseend && this.notInputted()) { this.inputqnum(); }
			}
		},

		inputlight: function () {
			const cell = this.getcell();
			if (cell.isnull) { return; }

			if (cell.qsub === 0) { cell.setQsub(this.btn === 'left' ? 1 : 2); }
			else if (cell.qsub === 1) { cell.setQsub(this.btn === 'left' ? 2 : 0); }
			else if (cell.qsub === 2) { cell.setQsub(this.btn === 'left' ? 0 : 1); }
			cell.draw();
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		ant: null! as GraphComponent,
		antnodes: null! as GraphNode[],
		maxnum: function (): number {
			const max = this.board.cell.length;
			return (max <= 999 ? max : 999);
		},
		getNextStepCell: function (step: number): INextStepInfo[] {
			const adjnodes = this.antnodes[0].nodes;
			const dirinfo = [];
			for (let i = 0; i < adjnodes.length; ++i) {
				const adjcell = adjnodes[i].obj;
				if (adjcell.base.qnum === step + 1 || adjcell.base.qnum === -2) {
					dirinfo.push({ dir: this.getdir(adjcell, 2), cell: adjcell });
				}
			}
			return dirinfo;
		}
	},
	Border: {
		enableLineNG: true,
		isLineNG: function () { return this.isBorder(); }
	},

	Board: {
		cols: 6,
		rows: 6,
		antmgr: null! as AreaAntGraph,

		hasborder: 1,
		addExtraInfo: function () {
			this.antmgr = this.addInfoList(AreaAntGraph);
		}
	},

	LineGraph: {
		enabled: true,
		moveline: true
	},

	GraphComponent: {
		checkCmp: function () {
			if (this.clist.length === 1 && (this.clist[0].base!.qnum === 1 || this.clist[0].base!.qnum === -2)) { return true; }
			const firstcell = this.clist.filter(function (cell) { return cell.base!.qnum === 1; })[0];
			if (!!firstcell) {
				return traceNumber(this.clist, firstcell as any);
			}
			else {
				const firstcells = this.clist.filter(function (cell) { return cell.base!.qnum === -2; });
				for (let i = 0; i < firstcells.length; ++i) {
					if (traceNumber(this.clist, firstcells[i] as any)) { return true; }
				}
			}
			return false;
		},
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "LIGHT",

		bgcellcolor_func: "qsub2",
		numbercolor_func: "move",
		qsubcolor1: "rgb(224, 224, 255)",
		qsubcolor2: "rgb(255, 255, 144)",

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();
			this.drawBorders();

			this.drawTip();
			this.drawPekes();
			this.drawDepartures();
			this.drawLines();

			this.drawCellSquare();
			this.drawQuesNumbers();

			this.drawChassis();

			this.drawTarget();
		},

		drawCellSquare: function () {
			const g = this.vinc('cell_number_base', 'crispEdges', true);

			const rw = this.bw * 0.7 - 1;
			const rh = this.bh * 0.7 - 1;
			const isdrawmove = this.puzzle.execConfig('dispmove');
			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				g.vid = "c_sq_" + cell.id;
				if ((!isdrawmove && cell.isDeparture()) || (isdrawmove && cell.isDestination())) {
					if (cell.error === 1) { g.fillStyle = this.errbcolor1; }
					else if (cell.qsub === 1) { g.fillStyle = this.qsubcolor1; }
					else if (cell.qsub === 2) { g.fillStyle = this.qsubcolor2; }
					else { g.fillStyle = this.bgcolor; }

					g.fillRectCenter(cell.bx * this.bw, cell.by * this.bh, rw, rh);
				}
				else { g.vhide(); }
			}
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeBorder();
			this.decodeNumber16();
		},
		encodePzpr: function (type) {
			this.encodeBorder();
			this.encodeNumber16();
		},

		decodeKaero: function () {
			let c = 0, a = 0, bstr = this.outbstr, bd = this.board;
			for (let i = 0; i < bstr.length; i++) {
				const ca = bstr.charAt(i), cell = bd.cell[c];

				if (this.include(ca, '0', '9')) { cell.qnum = Number.parseInt(ca, 36) + 27; }
				else if (this.include(ca, 'A', 'Z')) { cell.qnum = Number.parseInt(ca, 36) - 9; }
				else if (ca === "-") { cell.qnum = Number.parseInt(bstr.charAt(i + 1), 36) + 37; i++; }
				else if (ca === ".") { cell.qnum = -2; }
				else if (this.include(ca, 'a', 'z')) { c += (Number.parseInt(ca, 36) - 10); }

				c++;
				if (!bd.cell[c]) { a = i + 1; break; }
			}

			this.outbstr = bstr.substring(a);
		},
		encodeKaero: function () {
			let cm = "", count = 0, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				let pstr = "", qnum = bd.cell[c].qnum;
				if (qnum === -2) { pstr = "."; }
				else if (qnum >= 1 && qnum <= 26) { pstr = "" + (qnum + 9).toString(36).toUpperCase(); }
				else if (qnum >= 27 && qnum <= 36) { pstr = "" + (qnum - 27).toString(10); }
				else if (qnum >= 37 && qnum <= 72) { pstr = "-" + (qnum - 37).toString(36).toUpperCase(); }
				else { count++; }

				if (count === 0) { cm += pstr; }
				else if (pstr || count === 26) { cm += ((9 + count).toString(36).toLowerCase() + pstr); count = 0; }
			}
			if (count > 0) { cm += (9 + count).toString(36).toLowerCase(); }

			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnum();
			this.decodeCellQanssub();
			this.decodeBorderQues();
			this.decodeBorderLine();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeCellQanssub();
			this.encodeBorderQues();
			this.encodeBorderLine();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部

	"AnsCheck": {
		checklist: [
			"checkBranchLine",
			"checkCrossLine",
			"checkConnectObject",
			"checkLineOverLetter",
			"checkLineOverBorder",

			"checkUniqueNumberInBlock",
			"checkNumberWithinSize",
			"checkSideCell_ants",
			"checkAntNumber",

			"checkDisconnectLine",
			"checkNumberExist"
		],
		checkLineOverBorder: function () {
			let bd = this.board, result = true;
			for (let id = 0; id < bd.border.length; id++) {
				const border = bd.border[id];
				if (!border.isBorder() || !border.isLine()) { continue; }

				result = false;
				if (this.checkOnly) { break; }
				border.seterr(1);
			}
			if (!result) {
				this.failcode.add("laOnBorder");
				bd.border.setnoerr();
			}
		},

		checkUniqueNumberInBlock: function () {
			this.checkDifferentNumberInRoom_main(this.board.antmgr, this.isDifferentNumberInClistBase);
		},
		isDifferentNumberInClistBase: function (clist: CellList) {
			return this.isIndividualObject(clist, function (cell) { return cell.base!.qnum; });
		},

		checkNumberWithinSize: function () {
			this.checkAllCell(function (cell) { return (cell.ant && (cell.base!.qnum > cell.ant.clist.length)); }, "ceNumGtSize");
		},

		checkAntNumber: function () {
			const areas = this.board.antmgr.components;
			for (let id = 0; id < areas.length; id++) {
				const ant = areas[id];
				if (ant.checkCmp()) { continue; }

				this.failcode.add("bkWrongNum");
				if (this.checkOnly) { break; }
				this.board.cell.setnoerr();
				ant.clist.seterr(1);
			}
		},

		checkSideCell_ants: function () {
			let result = true, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				let cell = bd.cell[c], errcell = null, cell2 = cell.adjacent.right, cell3 = cell.adjacent.bottom;
				if (!cell.ant) { continue; }
				if (!cell2.isnull && !!cell2.ant && cell.ant !== cell2.ant) { errcell = cell2; }
				else if (!cell3.isnull && !!cell3.ant && cell.ant !== cell3.ant) { errcell = cell3; }
				if (!!errcell) {
					result = false;
					if (this.checkOnly) { break; }
					cell.ant.clist.seterr(1);
					errcell.ant.clist.seterr(1);
				}
			}
			if (!result) { this.failcode.add("bsAnt"); }
		}
	},

	FailCode: {
		laOnNum: ["数字の上を線が通過しています。", "There is a line across the number."],
		laOnBorder: ["線が境界線をまたいでいます。", "There is a line across the border."],
		bsAnt: ["別々のアリが接しています。", "Other ants are adjacent."],
		bkWrongNum: ["アリの数字がおかしいです。", "Numbers on the ant is wrong."],
		ceNumGtSize: ["数字がアリの大きさよりも大きいです。", "A number is greater than the size of the ant."],
		nmBranch: ["アリが分岐しています。", "An ant could have branch."]
	}
});

type ArmyAntsCell = Cell & { getNextStepCell: (x: number) => INextStepInfo[] }
type IHistory = {
	prev: any
	cell: ArmyAntsCell
	next: INextStepInfo[]
}
type INextStepInfo = { dir: IDir | 0, cell: ArmyAntsCell }
const traceNumber = function (clist: CellList, firstcell: ArmyAntsCell) {
	const history: IHistory[] = [{ prev: null, cell: firstcell, next: firstcell.getNextStepCell(1) }];
	while (history.length > 0 && history.length < clist.length) {
		const data = history[history.length - 1], cell = data.cell
		let nextdata = null;
		while (!nextdata && data.next.length > 0) {
			const nextinfo = data.next.shift();
			const cell2 = nextinfo!.cell;
			if (cell2 !== data.prev) {
				nextdata = { prev: cell, cell: cell2, next: cell2.getNextStepCell(history.length + 1) };
			}
		}

		if (!!nextdata) { history.push(nextdata); }
		else { history.pop(); }
	}
	// 全てのセルに到達した場合 => trueを返す
	return (history.length >= clist.length);
}
class AreaAntGraph extends AreaGraphBase {

	override enabled = true
	override relation = { 'cell.qnum': 'node', 'border.line': 'move' }
	override setComponentRefs(obj: any, component: any) { obj.ant = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.antnodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.antnodes = []; }

	override isnodevalid(cell: Cell) { return (cell.base!.qnum !== -1); }
	override isedgevalidbynodeobj(cell1: Cell, cell2: Cell) {
		const num1 = cell1.base!.qnum, num2 = cell2.base!.qnum;
		return (num1 === -2) || (num2 === -2) || ((num1 === -1) === (num2 === -1)) && (Math.abs(num1 - num2) === 1);
	}
	override modifyOtherInfo(border: Border, relation: any) {
		this.setEdgeByNodeObj(border.sidecell[0]);
		this.setEdgeByNodeObj(border.sidecell[1]);
	}
}
