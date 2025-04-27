//
// パズル固有スクリプト部 シャカシャカ版 shakashaka.js

import { AreaGraphBase } from "../puzzle/AreaManager";
import { FLIPX, FLIPY, TURNL, TURNR } from "../puzzle/BoardExec";
import type { GraphComponent } from "../puzzle/GraphBase";
import type { Cell } from "../puzzle/Piece";
import { createVariety } from "./createVariety";

//
export const Shakashaka = createVariety({
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['number', 'clear'], play: ['objblank', 'completion'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				const use = +this.puzzle.getConfig('use_tri');
				if (use === 1) {
					if (this.btn === 'left') {
						//@ts-ignore
						if (this.mousestart) { this.inputTriangle_corner_start(); }
						else if (this.mousemove && this.inputData !== null) {
							//@ts-ignore
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
							//@ts-ignore
							this.inputTriangle_pull_start();
						}
						else if (this.mousemove && this.inputData === null) {
							//@ts-ignore
							this.inputTriangle_pull_move();
						}
						else if (this.mousemove && this.inputData !== null) {
							//@ts-ignore
							this.inputMove();
						}
						else if (this.mouseend && this.notInputted()) {
							//@ts-ignore
							this.inputTriangle_pull_end();
						}
					}
					else if (this.btn === 'right') {
						if (this.mousestart || this.mousemove) { this.inputDot(); }
					}
				}
				else if (use === 3) {
					if (this.mousestart) {
						//@ts-ignore
						this.inputTriangle_onebtn();
					}
				}
				if (this.mouseend && this.notInputted()) { this.inputqcmp(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart) { this.inputqnum(); }
			}
		},

		inputMove: function () {
			if (this.inputData >= 2 && this.inputData <= 5) {
				//@ts-ignore
				this.inputTriangle_drag();
			}
			else if (this.inputData === 0 || this.inputData === -1) {
				this.inputDot();
			}
		},

		inputTriangle_corner_start: function () {
			const cell = this.getcell();
			if (cell.isnull) { return; }
			//@ts-ignore
			this.inputData = this.checkCornerData(cell);

			//@ts-ignore
			cell.setAnswer(this.inputData);
			this.mouseCell = cell;
			cell.draw();
		},
		checkCornerData: function (cell: Cell) {
			if (cell.isNum()) { return -1; }

			let val = null;
			if (this.puzzle.getConfig('support_tri')) {
				// Input support mode
				const adc = cell.adjacent
				const wall = { count: 0, top: false, bottom: false, left: false, right: false };
				const data = { top: [2, 3], bottom: [4, 5], left: [3, 4], right: [2, 5] };
				for (const _key in adc) {
					const key = _key as "top" | "left" | "right" | "bottom"
					const cell2 = adc[key];
					//@ts-ignore
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
		},

		inputTriangle_pull_start: function () {
			const cell = this.getcell();
			if (cell.isnull || cell.isNum()) { this.mousereset(); return; }

			// 最初はどこのセルをクリックしたか取得するだけ
			this.firstPoint.set(this.inputPoint);
			this.mouseCell = cell;
		},
		inputTriangle_pull_move: function () {
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
		},
		inputTriangle_pull_end: function () {
			const dx = (this.inputPoint.bx - this.firstPoint.bx);
			const dy = (this.inputPoint.by - this.firstPoint.by);

			// ほとんど動いていなかった場合は・を入力
			if (Math.abs(dx) <= 0.1 && Math.abs(dy) <= 0.1) {
				const cell = this.mouseCell;
				cell.setAnswer(cell.qsub !== 1 ? -1 : 0);
				cell.draw();
			}
		},

		inputTriangle_drag: function () {
			if (this.inputData === null || this.inputData <= 0) { return; }

			const cell = this.getcell();
			if (cell.isnull || cell.isNum()) { return; }

			const dbx = cell.bx - this.mouseCell.bx;
			const dby = cell.by - this.mouseCell.by;
			//@ts-ignore
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
				//@ts-ignore
				cell.setAnswer(ret);
				this.inputData = ret;
				this.mouseCell = cell;
				cell.draw();
			}
		},
		inputDot: function () {
			const cell = this.getcell();
			if (cell.isnull || cell.isNum()) { return; }

			if (this.inputData === null) { this.inputData = (cell.qsub === 1 ? 0 : -1); }
			//@ts-ignore
			cell.setAnswer(this.inputData);
			this.mouseCell = cell;
			cell.draw();
		},

		inputTriangle_onebtn: function () {
			const cell = this.getcell();
			if (cell.isnull || cell.isNum()) { return; }

			//@ts-ignore
			const ans = cell.getAnswer();
			if (this.btn === 'left') { this.inputData = [0, 2, 1, 3, 4, 5, -1][ans + 1]; }
			else if (this.btn === 'right') { this.inputData = [5, -1, 1, 0, 2, 3, 4][ans + 1]; }

			//@ts-ignore
			cell.setAnswer(this.inputData);
			this.mouseCell = cell;
			cell.draw();
		},

		inputqcmp: function () {
			const cell = this.getcell();
			if (cell.isnull || cell.noNum()) { return; }

			cell.setQcmp(+!cell.qcmp);
			cell.draw();

			this.mousereset();
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
		numberRemainsUnshaded: true,

		maxnum: 4,
		minnum: 0,

		getAnswer: function () {
			if (this.isNum()) { return 0; }
			if (this.qans > 0) { return this.qans; }
			if (this.qsub === 1) { return -1; }
			return 0;
		},
		setAnswer: function (val: number) {
			if (this.isNum()) { return; }
			this.setQans((val >= 2 && val <= 5) ? val : 0);
			this.setQsub((val === -1) ? 1 : 0);
		},

		isTri: function () { return this.qans !== 0; },
		isWall: function () { return (this.qsub === 1 || this.isnull || this.isNum()); }
	},
	Board: {
		addExtraInfo: function () {
			//@ts-ignore
			this.wrectmgr = this.addInfoList(AreaWrectGraph);
		}
	},
	BoardExec: {
		adjustBoardData: function (key: number, d: any) {
			let trans = [];
			switch (key) {
				case FLIPY: trans = [0, 1, 5, 4, 3, 2]; break;	// 上下反転
				case FLIPX: trans = [0, 1, 3, 2, 5, 4]; break;	// 左右反転
				case TURNR: trans = [0, 1, 5, 2, 3, 4]; break;	// 右90°回転
				case TURNL: trans = [0, 1, 3, 4, 5, 2]; break;	// 左90°回転
				default: return;
			}
			const clist = this.board.cell;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				const val = trans[cell.qans];
				if (!!val) { cell.qans = val; }
			}
		}
	},


	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		hideHatena: true,

		gridcolor_type: "LIGHT",

		qanscolor: "black",
		fgcellcolor_func: "qnum",
		fontShadecolor: "white",
		qcmpcolor: "rgb(127,127,127)",

		paint: function () {
			this.drawBGCells();
			this.drawDotCells();
			this.drawDashedGrid();
			this.drawQuesCells();
			this.drawQuesNumbers();

			this.drawTriangle();

			this.drawChassis();

			this.drawTarget();
		},
		getTriangleColor: function (cell: Cell) {
			return (!cell.trial ? this.shadecolor : this.trialcolor);
		},
		getQuesNumberColor: function (cell: Cell) {
			return (cell.qcmp === 1 ? this.qcmpcolor : this.fontShadecolor);
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decode4Cell();
		},
		encodePzpr: function (type) {
			this.encode4Cell();
		},
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnumb();
			//@ts-ignore
			this.decodeCellQanssubcmp();
		},
		encodeData: function () {
			this.encodeCellQnumb();
			//@ts-ignore
			this.encodeCellQanssubcmp();
		},

		decodeCellQanssubcmp: function () {
			this.decodeCell(function (cell, ca) {
				if (ca === "+") { cell.qsub = 1; }
				else if (ca === "-") { cell.qcmp = 1; }
				else if (ca !== ".") { cell.qans = +ca; }
			});
		},
		encodeCellQanssubcmp: function () {
			this.encodeCell(function (cell) {
				if (cell.qans !== 0) { return `${cell.qans} `; }
				if (cell.qsub === 1) { return "+ "; }
				if (cell.qcmp === 1) { return "- "; }
				return ". ";
			});
		},
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkTriangleExist",
			"checkOverTriangle",
			"checkWhiteArea",
			"checkLessTriangle"
		],

		checkTriangleExist: function () {
			if (!this.allowempty) {
				if (this.board.cell.some(function (cell) { return cell.qans > 0; })) { return; }
				this.failcode.add("brNoTriangle");
			}
		},

		checkOverTriangle: function () {
			//@ts-ignore
			this.checkDir4Cell(function (cell) { return cell.isTri(); }, 2, "nmTriangleGt");
		},
		checkLessTriangle: function () {
			//@ts-ignore
			this.checkDir4Cell(function (cell) { return cell.isTri(); }, 1, "nmTriangleLt");
		},

		checkWhiteArea: function () {
			// @ts-ignore
			const areas = this.board.wrectmgr.components as GraphComponent[];
			for (let id = 0; id < areas.length; id++) {
				const clist = areas[id].clist;
				const d = clist.getRectSize();
				const cnt = clist.filter(function (cell) { return (cell.qans === 0); }).length;
				//@ts-ignore
				if (d.cols * d.rows === cnt || this.isAreaRect_slope(areas[id])) {
					continue;
				}

				this.failcode.add("cuNotRectx");
				if (this.checkOnly) { break; }
				clist.seterr(1);
			}
		},
		// 斜め領域判定用
		isAreaRect_slope: function (area: any) {
			const clist = area.clist;
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
	},

	FailCode: {
		brNoTriangle: ["盤面に三角形がありません。", "There are no triangles on the board."],
		cuNotRectx: ["白マスが長方形(正方形)ではありません。", "A white area is not rectangle."],
		nmTriangleGt: ["数字のまわりにある黒い三角形の数が間違っています。", "The number of triangles in four adjacent cells is bigger than it."],
		nmTriangleLt: ["数字のまわりにある黒い三角形の数が間違っています。", "The number of triangles in four adjacent cells is smaller than it."]
	}
});

class AreaWrectGraph extends AreaGraphBase {
	override enabled = true
	override relation = { 'cell.qnum': 'node', 'cell.qans': 'node' }
	override setComponentRefs(obj: any, component: any) { obj.wrect = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.wrectnodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.wrectnodes = []; }

	override isnodevalid(cell: any) { return cell.qnum === -1; }
	sldir = [[],
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