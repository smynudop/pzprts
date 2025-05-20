//
// パズル固有スクリプト部 リフレクトリンク版 reflect.js

import type { Border } from "../puzzle/Piece";
import { BorderList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Reflectlink = createVariety({
	pid: "reflect",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['quesmark', 'quesmark-', 'number', 'info-line'], play: ['line', 'peke', 'info-line'] },
		mouseinput_other: function () {
			if (this.inputMode.match(/quesmark/)) {
				if (this.mousestart) { this.inputQuesTriangle(); }
			}
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.btn === 'left') {
					if (this.mousestart || this.mousemove) { this.inputLine(); }
					else if (this.mouseend && this.notInputted()) { this.inputpeke(); }
				}
				else if (this.btn === 'right') {
					if (this.mousestart || this.mousemove) { this.inputpeke(); }
				}
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart) { this.inputQuesTriangle(); }
			}
		},
		inputQuesTriangle: function () {
			this.inputQues([0, 2, 3, 4, 5, 11]);
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,

		keyinput: function (ca) {
			if (this.key_inputLineParts(ca)) { return; }
			this.key_inputqnum(ca);
		},
		key_inputLineParts: function (ca: string): boolean {
			const cell = this.cursor.getc();

			if (ca === 'q') { cell.setQues(2); cell.setQnum(-1); }
			else if (ca === 'w') { cell.setQues(3); cell.setQnum(-1); }
			else if (ca === 'e') { cell.setQues(4); cell.setQnum(-1); }
			else if (ca === 'r') { cell.setQues(5); cell.setQnum(-1); }
			else if (ca === 't') { cell.setQues(11); cell.setQnum(-1); }
			else if (ca === 'y') { cell.setQues(0); cell.setQnum(-1); }
			else { return false; }

			cell.drawaround();
			return true;
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		disInputHatena: true,

		maxnum: function (): number {
			let qu = this.ques, max = -1;
			if (qu === 2 || qu === 3) { max += ((this.by >> 1) + 1); }
			else if (qu === 4 || qu === 5) { max += (this.board.rows - (this.by >> 1)); }
			if (qu === 3 || qu === 4) { max += ((this.bx >> 1) + 1); }
			else if (qu === 2 || qu === 5) { max += (this.board.cols - (this.bx >> 1)); }
			return max;
		},
		minnum: 3,

		getTriLine: function () {
			let blist = new BorderList(), adb = this.adjborder, border: Border;

			border = adb.left; while (!border.isnull && border.isLine()) { blist.add(border); border = border.relbd(-2, 0); }
			border = adb.right; while (!border.isnull && border.isLine()) { blist.add(border); border = border.relbd(2, 0); }
			border = adb.top; while (!border.isnull && border.isLine()) { blist.add(border); border = border.relbd(0, -2); }
			border = adb.bottom; while (!border.isnull && border.isLine()) { blist.add(border); border = border.relbd(0, 2); }

			return blist;
		}
	},
	Border: {
		enableLineNG: true
	},
	Board: {
		hasborder: 1
	},
	BoardExec: {
		adjustBoardData: function (key, d) {
			if (key & this.TURNFLIP) {
				let tques: Record<number, number> = {};
				switch (key) {
					case this.FLIPY: tques = { 2: 5, 3: 4, 4: 3, 5: 2 }; break;
					case this.FLIPX: tques = { 2: 3, 3: 2, 4: 5, 5: 4 }; break;
					case this.TURNR: tques = { 2: 5, 3: 2, 4: 3, 5: 4 }; break;
					case this.TURNL: tques = { 2: 3, 3: 4, 4: 5, 5: 2 }; break;
				}
				const clist = this.board.cellinside(d.x1, d.y1, d.x2, d.y2);
				for (let i = 0; i < clist.length; i++) {
					const cell = clist[i], val = tques[cell.ques];
					if (!!val) { cell.setQues(val); }
				}
			}
		}
	},

	LineGraph: {
		enabled: true,
		isLineCross: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		hideHatena: true,

		irowake: true,

		gridcolor_type: "LIGHT",

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();

			this.drawPekes();
			this.drawLines();

			this.drawTriangle();
			this.drawTriangleBorder();
			this.drawNumbers_reflect();

			this.draw11s();

			this.drawChassis();

			this.drawTarget();
		},

		getTriangleColor: function (cell): string {
			return ((cell.error === 1 || cell.error === 4 || cell.qinfo === 1 || cell.qinfo === 4) ? this.errcolor1 : this.quescolor);
		},

		drawTriangleBorder: function () {
			const g = this.vinc('cell_triangle_border', 'crispEdges', true);

			const blist = this.range.borders;
			for (let i = 0; i < blist.length; i++) {
				const border = blist[i], lflag = border.isVert();
				const qs1 = border.sidecell[0].ques, qs2 = border.sidecell[1].ques;
				const px = border.bx * this.bw, py = border.by * this.bh;

				g.vid = "b_tb_" + border.id;
				g.fillStyle = this.gridcolor;
				if (lflag && (qs1 === 3 || qs1 === 4) && (qs2 === 2 || qs2 === 5)) {
					g.fillRectCenter(px, py, 0.5, this.bh);
				}
				else if (!lflag && (qs1 === 2 || qs1 === 3) && (qs2 === 4 || qs2 === 5)) {
					g.fillRectCenter(px, py, this.bw, 0.5);
				}
				else { g.vhide(); }
			}
		},
		draw11s: function () {
			const g = this.vinc('cell_ques', 'crispEdges', true);

			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];

				g.vid = "c_lp11_" + cell.id;
				if (cell.ques === 11) {
					const lw = this.lw + 2, lm = (lw - 1) / 2, ll = this.cw * 0.38;
					const px = cell.bx * this.bw, py = cell.by * this.bh;
					g.fillStyle = this.quescolor;
					g.beginPath();
					g.setOffsetLinePath(px, py, -lm, -lm, -lm, -ll, lm, -ll, lm, -lm, ll, -lm, ll, lm, lm, lm, lm, ll, -lm, ll, -lm, lm, -ll, lm, -ll, -lm, true);
					g.fill();
				}
				else { g.vhide(); }
			}
		},
		drawNumbers_reflect: function () {
			const g = this.vinc('cell_number', 'auto');

			g.fillStyle = "white";
			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				const text = this.getQuesNumberText(cell);
				g.vid = "cell_text_" + cell.id;
				if (!!text) {
					this.disptext(text, cell.bx * this.bw, cell.by * this.bh, { position: cell.ques, ratio: 0.45 });
				}
				else { g.vhide(); }
			}
		},
		getQuesNumberText: function (cell): string {
			return ((cell.ques >= 2 && cell.ques <= 5) ? this.getNumberTextCore(cell.qnum) : "");
		},

		repaintParts: function (blist) {
			this.range.cells = blist.cellinside() as any;

			this.draw11s();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeReflectlink();
		},
		encodePzpr: function (type) {
			this.encodeReflectlink();
		},

		decodeReflectlink: function () {
			let c = 0, bstr = this.outbstr, bd = this.board;
			let i: number;
			for (i = 0; i < bstr.length; i++) {
				const ca = bstr.charAt(i), cell = bd.cell[c];

				if (ca === '5') { cell.ques = 11; }
				else if (this.include(ca, '1', '4')) {
					cell.ques = Number.parseInt(ca, 10) + 1;
					cell.qnum = Number.parseInt(bstr.substr(i + 1, 1), 16);
					i++;
				}
				else if (this.include(ca, '6', '9')) {
					cell.ques = Number.parseInt(ca, 10) - 4;
					cell.qnum = Number.parseInt(bstr.substr(i + 1, 2), 16);
					i += 2;
				}
				else if (this.include(ca, 'a', 'z')) { c += (Number.parseInt(ca, 36) - 10); }
				if (cell.qnum === 0) { cell.qnum = -1; }

				c++;
				if (!bd.cell[c]) { break; }
			}

			this.outbstr = bstr.substr(i);
		},
		encodeReflectlink: function () {
			let cm = "", pstr = "", count = 0, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const qu = bd.cell[c].ques;
				if (qu === 11) { pstr = "5"; }
				else if (qu >= 2 && qu <= 5) {
					const val = bd.cell[c].qnum;
					if (val <= 0) { pstr = "" + (qu - 1) + "0"; }
					else if (val >= 1 && val < 16) { pstr = "" + (qu - 1) + val.toString(16); }
					else if (val >= 16 && val < 256) { pstr = "" + (qu + 4) + val.toString(16); }
				}
				else { pstr = ""; count++; }

				if (count === 0) { cm += pstr; }
				else if (pstr || count === 26) { cm += ((9 + count).toString(36) + pstr); count = 0; }
			}
			if (count > 0) { cm += (9 + count).toString(36); }

			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCell(function (cell, ca) {
				if (ca === "+") { cell.ques = 11; }
				else if (ca !== ".") {
					cell.ques = (+ca.charAt(0)) + 1;
					if (ca.length > 1) { cell.qnum = +ca.substr(1); }
				}
			});
			this.decodeBorderLine();
		},
		encodeData: function () {
			this.encodeCell(function (cell) {
				if (cell.ques === 11) { return "+ "; }
				else if (cell.ques >= 2 && cell.ques <= 5) {
					return "" + (cell.ques - 1) + (cell.qnum !== -1 ? cell.qnum : "") + " ";
				}
				else { return ". "; }
			});
			this.encodeBorderLine();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkLineExist+",
			"checkBranchLine",
			"checkCrossOutOfMark",
			"checkLongLines",
			"checkTriangle",
			"checkShortLines",
			"checkNotCrossOnMark",
			"checkDeadendLine+",
			"checkOneLoop"
		],

		checkCrossOutOfMark: function () {
			this.checkAllCell(function (cell) { return (cell.lcnt === 4 && cell.ques !== 11); }, "lnCrossExMk");
		},

		checkTriangle: function () {
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (cell.ques === 0 || cell.ques === 11 || cell.lcnt > 0) { continue; }

				this.failcode.add("lnExTri");
				if (this.checkOnly) { break; }
				cell.seterr(4);
			}
		},

		checkLongLines: function () { this.checkTriNumber(1, "lnLenGt"); },
		checkShortLines: function () { this.checkTriNumber(2, "lnLenLt"); },
		checkTriNumber: function (type: number, code: string) {
			let result = true, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (cell.ques === 0 || cell.ques === 11 || !cell.isValidNum()) { continue; }

				const blist = cell.getTriLine();
				if (type === 1 ? cell.qnum >= (blist.length + 1) : cell.qnum <= (blist.length + 1)) { continue; }

				result = false;
				if (this.checkOnly) { break; }
				cell.seterr(4);
				blist.seterr(1);
			}
			if (!result) {
				this.failcode.add(code);
				bd.border.setnoerr();
			}
		}
	},

	FailCode: {
		lnCrossExMk: ["十字以外の場所で線が交差しています。", "There is a crossing line out of cross mark."],
		lnExTri: ["線が三角形を通過していません。", "A line doesn't goes through a triangle."],
		lnLenGt: ["三角形の数字とそこから延びる線の長さが一致していません。", "A number on triangle is not equal to sum of the length of lines from it."],
		lnLenLt: ["三角形の数字とそこから延びる線の長さが一致していません。", "A number on triangle is not equal to sum of the length of lines from it."]
	}
});
