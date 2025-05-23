//
// パズル固有スクリプト部 タテボーヨコボー版 tateyoko.js

import { AreaGraphBase } from "../puzzle/AreaManager";
import { MouseEvent1 } from "../puzzle/MouseInput";
import type { Cell } from "../puzzle/Piece";
import { createVariety } from "./createVariety";

//
export const Tateyoko = createVariety({
	pid: "tateyoko",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['number', 'shade', 'clear'], play: [] },
		mouseinput: function () { // オーバーライド
			if (this.inputMode === 'shade') { this.inputBlock(); }
			else { MouseEvent1.prototype.mouseinput.call(this); }
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				this.inputTateyoko();
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart) { this.inputqnum(); }
			}
		},

		clickTateyoko: function () {
			const cell = this.getcell();
			if (cell.isnull || cell.ques === 1) { return; }

			cell.setQans((this.btn === 'left' ? { 0: 12, 12: 13, 13: 0 } : { 0: 13, 12: 0, 13: 12 })[cell.qans]);
			cell.draw();
		},
		inputBlock: function () {
			const cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell) { return; }

			cell.setQues(cell.ques === 1 ? 0 : 1);
			cell.draw();
			this.mouseCell = cell;
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,

		keyinput: function (ca) {
			if (this.key_inputqnum_tateyoko(ca)) { return; }
			this.key_inputqnum(ca);
		},
		key_inputqnum_tateyoko: function (ca: string): boolean {
			const cell = this.cursor.getc();
			if (ca === 'q' || ca === 'q1' || ca === 'q2') {
				if (ca === 'q') { ca = (cell.ques !== 1 ? 'q1' : 'q2'); }
				if (ca === 'q1') {
					cell.setQues(1);
					cell.setQans(0);
					if (cell.qnum > 4) { cell.setQnum(-1); }
				}
				else if (ca === 'q2') { cell.setQues(0); }
			}
			else { return false; }

			this.prev = cell;
			cell.draw();
			return true;
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		maxnum: function (): number {
			const bd = this.board;
			return (this.ques === 1 ? 4 : Math.max(bd.cols, bd.rows));
		},
		minnum: 0
	},
	Board: {
		disable_subclear: true,
		bargraph: null! as AreaBarGraph,
		addExtraInfo: function () {
			this.bargraph = this.addInfoList(AreaBarGraph);
		}
	},
	BoardExec: {
		adjustBoardData: function (key, d) {
			if (key & this.TURN) { // 回転だけ
				const tans: Record<number, number> = { 0: 0, 12: 13, 13: 12 };
				const clist = this.board.cellinside(d.x1, d.y1, d.x2, d.y2);
				for (let i = 0; i < clist.length; i++) {
					const cell = clist[i];
					cell.setQans(tans[cell.qans]);
				}
			}
		}
	},



	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "LIGHT",
		fontShadecolor: "white",

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();

			this.drawTateyokos();

			this.drawShadeAtNumber();
			this.drawQuesNumbers();

			this.drawChassis();

			this.drawTarget();
		},

		drawShadeAtNumber: function () {
			const g = this.vinc('cell_bcells', 'crispEdges', true);

			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				g.vid = "c_full_" + cell.id;
				if (cell.ques === 1) {
					g.fillStyle = (cell.error === 1 ? this.errcolor1 : this.quescolor);
					g.fillRectCenter(cell.bx * this.bw, cell.by * this.bh, this.bw + 0.5, this.bh + 0.5);
				}
				else { g.vhide(); }
			}
		},
		getQuesNumberColor: function (cell): string {
			return (cell.ques !== 1 ? this.quescolor : this.fontShadecolor);
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeTateyoko();
		},
		encodePzpr: function (type) {
			this.encodeTateyoko(type);
		},

		decodeTateyoko: function () {
			let c = 0, i = 0, bstr = this.outbstr, bd = this.board;
			for (i = 0; i < bstr.length; i++) {
				const ca = bstr.charAt(i), cell = bd.cell[c];

				if (ca === 'x') { cell.ques = 1; }
				else if (this.include(ca, "o", "s")) { cell.ques = 1; cell.qnum = (Number.parseInt(ca, 29) - 24); }
				else if (this.include(ca, "0", "9") || this.include(ca, "a", "f")) { cell.qnum = Number.parseInt(ca, 16); }
				else if (ca === "-") { cell.qnum = Number.parseInt(bstr.substr(i + 1, 2), 16); i += 2; }
				else if (ca === "i") { c += (Number.parseInt(bstr.charAt(i + 1), 16) - 1); i++; }

				c++;
				if (!bd.cell[c]) { break; }
			}
			this.outbstr = bstr.substr(i);
		},
		encodeTateyoko: function (type: any) {
			let cm = "", count = 0, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				let pstr = "", qu = bd.cell[c].ques, qn = bd.cell[c].qnum;
				if (qu === 0) {
					if (qn === -1) { count++; }
					else if (qn === -2) { pstr = "."; }
					else if (qn < 16) { pstr = "" + qn.toString(16); }
					else if (qn < 256) { pstr = "-" + qn.toString(16); }
					else { pstr = ""; count++; }
				}
				else if (qu === 1) {
					pstr = (qn >= 0 ? (qn + 24).toString(29) : "x");
				}

				if (count === 0) { cm += pstr; }
				else if (pstr || count === 15) {
					if (count === 1) { cm += ("n" + pstr); }
					else { cm += ("i" + count.toString(16) + pstr); }
					count = 0;
				}
			}
			if (count === 1) { cm += "n"; }
			else if (count > 1) { cm += ("i" + count.toString(16)); }

			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCell(function (cell, ca) {
				if (ca >= "a" && ca <= 'f') { cell.ques = 1; cell.qnum = { a: 1, b: 2, c: 3, d: 4, e: 0, f: -1 }[ca] as number; }
				else if (ca === "?") { cell.qnum = -2; }
				else if (ca !== ".") { cell.qnum = +ca; }
			});
			this.decodeCell(function (cell, ca) {
				if (ca === "1") { cell.qans = 12; }
				else if (ca === "2") { cell.qans = 13; }
			});
		},
		encodeData: function () {
			this.encodeCell(function (cell) {
				if (cell.ques === 1) {
					if (cell.qnum === -1 || cell.qnum === -2) { return "f "; }
					else { return { 0: "e ", 1: "a ", 2: "b ", 3: "c ", 4: "d " }[cell.qnum] as string; }
				}
				else if (cell.qnum === -2) { return "? "; }
				else if (cell.qnum >= 0) { return "" + cell.qnum + " "; }
				else { return ". "; }
			});
			this.encodeCell(function (cell) {
				if (cell.ques !== 1) {
					if (cell.qans === 0) { return "0 "; }
					else if (cell.qans === 12) { return "1 "; }
					else if (cell.qans === 13) { return "2 "; }
				}
				return ". ";
			});
		}
	},
	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkBarOverNum",
			"checkDoubleNumberInBar",
			"checkSizeAndNumberInBar",
			"checkBarLessNum",
			"checkEmptyCell_tateyoko+"
		],

		checkDoubleNumberInBar: function () {
			const cells = this.board.cell, errcount = this.failcode.list.length;
			this.checkAllBlock(this.board.bargraph, function (cell) { return cell.isNum(); }, function (w, h, a, n) { return (a < 2); }, "baPlNum");
			if (errcount !== this.failcode.list.length) { cells.setnoerr(); }
		},
		checkSizeAndNumberInBar: function () {
			const cells = this.board.cell, errcount = this.failcode.list.length;
			this.checkAllArea(this.board.bargraph, function (w, h, a, n) { return (n <= 0 || n === a); }, "bkSizeNe");
			if (errcount !== this.failcode.list.length) { cells.setnoerr(); }
		},

		checkBarOverNum: function () { this.checkShade(1, "nmConnBarGt"); },
		checkBarLessNum: function () { this.checkShade(2, "nmConnBarLt"); },
		checkShade: function (type: number, code: string) {
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c], num = cell.qnum;
				if (cell.ques !== 1 || num < 0) { continue; }

				let cnt1 = 0, cnt2 = 0, cell2: Cell, adc = cell.adjacent;
				cell2 = adc.top; if (!cell2.isnull) { if (cell2.qans === 12) { cnt1++; } else if (cell2.qans === 13) { cnt2++; } }
				cell2 = adc.bottom; if (!cell2.isnull) { if (cell2.qans === 12) { cnt1++; } else if (cell2.qans === 13) { cnt2++; } }
				cell2 = adc.left; if (!cell2.isnull) { if (cell2.qans === 13) { cnt1++; } else if (cell2.qans === 12) { cnt2++; } }
				cell2 = adc.right; if (!cell2.isnull) { if (cell2.qans === 13) { cnt1++; } else if (cell2.qans === 12) { cnt2++; } }
				if ((type === 1 && (num <= 4 - cnt2 && num >= cnt1)) || (type === 2 && num === cnt1)) { continue; }

				this.failcode.add(code);
				if (this.checkOnly) { break; }
				cell.seterr(1);
			}
		},

		checkEmptyCell_tateyoko: function () {
			this.checkAllCell(function (cell) { return (cell.ques === 0 && cell.qans === 0); }, "ceNoBar");
		}
	},

	FailCode: {
		ceNoBar: ["何も入っていないマスがあります。", "There is an empty cell."],
		bkSizeNe: ["数字と棒の長さが違います。", "The number is different from the length of line."],
		baPlNum: ["1つの棒に2つ以上の数字が入っています。", "A line passes plural numbers."],
		nmConnBarGt: ["黒マスに繋がる線の数が正しくありません。", "The number of lines connected to a shaded cell is wrong."],
		nmConnBarLt: ["黒マスに繋がる線の数が正しくありません。", "The number of lines connected to a shaded cell is wrong."]
	}
});

class AreaBarGraph extends AreaGraphBase {
	override enabled = true
	override relation = { 'cell.qans': 'node' }
	override setComponentRefs(obj: any, component: any) { obj.bar = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.barnodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.barnodes = []; }

	override isnodevalid(cell: any) { return (cell.qans > 0); }
	override isedgevalidbynodeobj(cell1: Cell, cell2: Cell) {
		const dir = cell1.getdir(cell2, 2);
		if (dir === cell1.UP || dir === cell1.DN) { return (cell1.qans === 12 && cell2.qans === 12); }
		else if (dir === cell1.LT || dir === cell1.RT) { return (cell1.qans === 13 && cell2.qans === 13); }
		return false;
	}
}
