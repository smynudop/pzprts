//
// パズル固有スクリプト部 なわばり・フォーセルズ・ファイブセルズ版 nawabari.js

import { createVariety } from "./createVariety";

//
export const Nawabari = createVariety({
	pid: "nawabari",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['number', 'clear'], play: ['border', 'subline'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === 'left' && this.isBorderMode()) { this.inputborder(); }
					else { this.inputQsubLine(); }
				}
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart) { this.inputqnum(); }
			}
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
		getdir4BorderCount: function () {
			let cnt = 0, cblist = this.getdir4cblist();
			for (let i = 0; i < cblist.length; i++) {
				const tcell = cblist[i][0], tborder = cblist[i][1];
				if (tcell.isnull || tcell.isEmpty() || tborder.isBorder()) { cnt++; }
			}
			return cnt;
		},
		maxnum: 4,
		minnum: 0
	},


	Board: {
		hasborder: 1
	},

	AreaRoomGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "DLIGHT",

		numbercolor_func: "qnum",

		paint: function () {
			this.drawBGCells();

			this.drawDashedGrid();
			this.drawBorders();

			this.drawQuesNumbers();
			this.drawBorderQsubs();

			this.drawChassis();

			this.drawTarget();
		},
		bordercolor_func: "qans"
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeFivecells();
		},
		encodePzpr: function (type) {
			this.encodeFivecells();
		},

		// decode/encodeNumber10関数の改造版にします
		decodeFivecells: function () {
			let c = 0, i = 0, bstr = this.outbstr, bd = this.board;
			for (i = 0; i < bstr.length; i++) {
				const cell = bd.cell[c], ca = bstr.charAt(i);

				cell.ques = 0;
				if (ca === '7') { cell.ques = 7; }
				else if (ca === '.') { cell.qnum = -2; }
				else if (this.include(ca, "0", "9")) { cell.qnum = Number.parseInt(ca, 10); }
				else if (this.include(ca, "a", "z")) { c += (Number.parseInt(ca, 36) - 10); }

				c++;
				if (c >= bd.cell.length) { break; }
			}
			this.outbstr = bstr.substr(i);
		},
		encodeFivecells: function () {
			let cm = "", count = 0, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				let pstr = "", qn = bd.cell[c].qnum, qu = bd.cell[c].ques;

				if (qu === 7) { pstr = "7"; }
				else if (qn === -2) { pstr = "."; }
				else if (qn !== -1) { pstr = qn.toString(10); } // 0～3
				else { count++; }

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
				cell.ques = 0;
				if (ca === "*") { cell.ques = 7; }
				else if (ca === "-") { cell.qnum = -2; }
				else if (ca !== ".") { cell.qnum = +ca; }
			});
			this.decodeBorderAns();
		},
		encodeData: function () {
			this.encodeCell(function (cell) {
				if (cell.ques === 7) { return "* "; }
				else if (cell.qnum === -2) { return "- "; }
				else if (cell.qnum >= 0) { return cell.qnum + " "; }
				else { return ". "; }
			});
			this.encodeBorderAns();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkRoomRect",
			"checkNoNumber",
			"checkDoubleNumber",
			"checkdir4BorderAns",
			"checkBorderDeadend+",
		],

		checkOverFourCells: function () {
			this.checkAllArea(this.board.roommgr, function (w, h, a, n) { return (a >= 4); }, "bkSizeLt4");
		},
		checkLessFourCells: function () {
			this.checkAllArea(this.board.roommgr, function (w, h, a, n) { return (a <= 4); }, "bkSizeGt4");
		},
		checkOverFiveCells: function () {
			this.checkAllArea(this.board.roommgr, function (w, h, a, n) { return (a >= 5); }, "bkSizeLt5");
		},
		checkLessFiveCells: function () {
			this.checkAllArea(this.board.roommgr, function (w, h, a, n) { return (a <= 5); }, "bkSizeGt5");
		},

		checkdir4BorderAns: function () {
			this.checkAllCell(function (cell) { return (cell.isValidNum() && cell.getdir4BorderCount() !== cell.qnum); }, "nmBorderNe");
		}
	},

	FailCode: {
		nmBorderNe: ["数字の周りにある境界線の本数が違います。", "The number is not equal to the number of border lines around it."],
		bkNoNum: ["数字の入っていない部屋があります。", "A room has no numbers."],
		bkNumGe2: ["1つの部屋に2つ以上の数字が入っています。", "A room has plural numbers."],
		bkSizeLt4: ["サイズが4マスより小さいブロックがあります。", "The size of block is smaller than four."],
		bkSizeLt5: ["サイズが5マスより小さいブロックがあります。", "The size of block is smaller than five."],
		bkSizeGt4: ["サイズが4マスより大きいブロックがあります。", "The size of block is larger than four."],
		bkSizeGt5: ["サイズが5マスより大きいブロックがあります。", "The size of block is larger than five."]
	}
});
