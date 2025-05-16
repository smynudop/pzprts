//
// パズル固有スクリプト部 カックロ版 kakuro.js

import type { Border, Cell, EXCell } from "../puzzle/Piece";
import type { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Kakkuro = createVariety({
	pid: "kakuro",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['cell51', 'clear', 'number'], play: ['number', 'clear'] },
		mouseinput_clear: function () {
			this.input51_fixed();
		},
		mouseinput_number: function () {
			if (this.mousestart) { this.inputqnum_cell51(); }
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart) { this.inputqnum(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart) { this.input51(); }
			}
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		enableplay: true,

		keyinput: function (ca: string) {
			if (this.puzzle.editmode) { this.inputnumber51(ca); }
			else if (this.puzzle.playmode) { this.key_inputqnum(ca); }
		}
	},

	TargetCursor: {
		setminmax_customize: function () {
			if (this.puzzle.editmode) { return; }
			this.minx += 2;
			this.miny += 2;
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		qnum: 0,
		qnum2: 0,

		noNum: function () { return !this.isnull && (this.qnum === 0 && this.qnum2 === 0 && this.anum === -1); },

		/* 問題の0入力は↓の特別処理で可能にしてます */
		disInputHatena: true,
		enableSubNumberArray: true,

		getmaxnum: function () {
			return (this.puzzle.editmode ? 45 : 9);
		},

		// この関数は回答モードでしか呼ばれないはず、
		getNum: function () { return this.anum; },
		setNum: function (val: number) { this.setAnum(val > 0 ? val : -1); this.clrSnum(); },

		// 問題入力モードは0でも入力できるようにする
		prehook: {
			qnum: function (num: number) { return false; },
			qnum2: function (num: number) { return false; }
		}
	},

	EXCell: {
		ques: 51,
		qnum: 0,
		qnum2: 0,
		maxnum: 45,
		minnum: 1,

		disInputHatena: true
	},

	Board: {
		cols: 11,
		rows: 11,

		hasborder: 1,
		hasexcell: 1
	},
	BoardExec: {
		adjustBoardData: function (key: number, d: any) {
			this.adjustQues51_1(key, d);
		},
		adjustBoardData2: function (key: number, d: any) {
			this.adjustQues51_2(key, d);
		}
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		ttcolor: "rgb(255,255,127)",

		numbercolor_func: "anum",

		paint: function () {
			this.drawBGCells();
			this.drawBGEXcells();
			this.drawTargetSubNumber();
			this.drawQues51();

			this.drawGrid();
			this.drawBorders();

			this.drawChassis_ex1(false);

			this.drawSubNumbers();
			this.drawAnsNumbers();
			this.drawQuesNumbersOn51();
			//this.drawQuesNumbers();

			this.drawCursor();
		},

		// オーバーライド drawBGCells用
		getBGCellColor: function (cell: Cell): string | null {
			if (cell.error === 1) { return this.errbcolor1; }
			if (cell.ques === 51) { return "rgb(192,192,192)"; }
			return null;
		},
		getBGEXcellColor: function (excell: EXCell): string {
			if (excell.error) { return this.errbcolor1; }
			return "rgb(192,192,192)";
		},
		// オーバーライド 境界線用
		getBorderColor: function (border: Border): string | null {
			const cell1 = border.sidecell[0];
			const cell2 = border.sidecell[1];
			if (!cell1.isnull && !cell2.isnull && ((cell1.ques === 51) !== (cell2.ques === 51))) {
				return this.quescolor;
			}
			return null;
		},

		getAnsNumberText: function (cell: Cell): string {
			return ((!cell.is51cell() && cell.anum > 0) ? `${cell.anum}` : "");
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeKakuro();
		},
		encodePzpr: function (type) {
			this.encodeKakuro(type);
		},

		decodeKakuro: function () {
			// 盤面内数字のデコード
			let c = 0;
			let a = 0;
			const bstr = this.outbstr;
			const bd = this.puzzle.board;
			for (let i = 0; i < bstr.length; i++) {
				const ca = bstr.charAt(i);
				const cell = bd.cell[c];
				if (ca >= 'k' && ca <= 'z') { c += (Number.parseInt(ca, 36) - 19); }
				else {
					cell.ques = 51;
					if (ca !== '.') {
						cell.qnum2 = decval(ca);
						cell.qnum = decval(bstr.charAt(i + 1));
						i++;
					}
					c++;
				}
				if (!bd.cell[c]) { a = i + 1; break; }
			}

			// 盤面外数字のデコード
			let i = a;
			for (let bx = 1; bx < bd.maxbx; bx += 2) {
				if (!bd.getc(bx, 1).is51cell()) {
					bd.getex(bx, -1).qnum2 = decval(bstr.charAt(i));
					i++;
				}
			}
			for (let by = 1; by < bd.maxby; by += 2) {
				if (!bd.getc(1, by).is51cell()) {
					bd.getex(-1, by).qnum = decval(bstr.charAt(i));
					i++;
				}
			}

			this.outbstr = bstr.substr(a);
		},
		encodeKakuro: function (type: number) {
			let cm = "";
			const bd = this.puzzle.board;

			// 盤面内側の数字部分のエンコード
			let count = 0;
			for (let c = 0; c < bd.cell.length; c++) {
				let pstr = "";
				const cell = bd.cell[c];

				if (cell.ques === 51) {
					if (cell.qnum <= 0 && cell.qnum2 <= 0) { pstr = "."; }
					else { pstr = `${encval(cell.qnum2)}${encval(cell.qnum)}`; }
				}
				else { count++; }

				if (count === 0) { cm += pstr; }
				else if (pstr || count === 16) { cm += ((count + 19).toString(36) + pstr); count = 0; }
			}
			if (count > 0) { cm += (count + 19).toString(36); }

			// 盤面外側の数字部分のエンコード
			for (let bx = 1; bx < bd.maxbx; bx += 2) {
				if (!bd.getc(bx, 1).is51cell()) {
					cm += encval(bd.getex(bx, -1).qnum2);
				}
			}
			for (let by = 1; by < bd.maxby; by += 2) {
				if (!bd.getc(1, by).is51cell()) {
					cm += encval(bd.getex(-1, by).qnum);
				}
			}

			this.outbstr += cm;
		},


	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnum51();
			this.decodeCellAnumsub();
		},
		encodeData: function () {
			this.encodeCellQnum51();
			this.encodeCellAnumsub();
		},
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkSameNumberInLine",
			"checkSumOfNumberInLine",
			"checkNoNumCell+"
		],

		checkSameNumberInLine: function () {
			this.checkRowsColsPartly(this.isSameNumber, function (cell: Cell) { return cell.is51cell(); }, "nmDupRow");
		},
		isSameNumber: function (clist: CellList, info: any) {
			const result = this.isDifferentAnsNumberInClist(clist);
			if (!result) { info.keycell.seterr(1); }
			return result;
		},

		checkSumOfNumberInLine: function () {
			this.checkRowsColsPartly(this.isTotalNumber, function (cell: Cell) { return cell.is51cell(); }, "nmSumRowNe");
		},

		isTotalNumber: function (clist: CellList, info: any) {
			const number = info.key51num;
			let sum = 0;
			for (let i = 0; i < clist.length; i++) {
				if (clist[i].anum > 0) { sum += clist[i].anum; }
				else { return true; }
			}
			const result = (number <= 0 || sum === number);
			if (!result) {
				info.keycell.seterr(1);
				clist.seterr(1);
			}
			return result;
		}
	},

	FailCode: {
		nmSumRowNe: ["数字の下か右にある数字の合計が間違っています。", "The sum of the cells is not correct."],
		ceNoNum: ["すべてのマスに数字が入っていません。", "There is an empty cell."]
	}
});

const decval = function (ca: string) {
	if (ca >= '0' && ca <= '9') { return Number.parseInt(ca, 36); }
	if (ca >= 'a' && ca <= 'j') { return Number.parseInt(ca, 36); }
	if (ca >= 'A' && ca <= 'Z') { return Number.parseInt(ca, 36) + 10; }
	return 0;
}
const encval = function (val: number) {
	if (val >= 1 && val <= 19) { return val.toString(36).toLowerCase(); }
	if (val >= 20 && val <= 45) { return (val - 10).toString(36).toUpperCase(); }
	return "0";
}