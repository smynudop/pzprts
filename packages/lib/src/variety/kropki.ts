//
// パズル固有スクリプト部 マイナリズム・Kropki版 minarism.js

import { MouseEvent1 } from "../puzzle/MouseInput";
import type { Border, IDir } from "../puzzle/Piece";
import { createVariety } from "./createVariety";

//
export const Kropki = createVariety({
	pid: "kropki",
	//---------------------------------------------------------
	// マウス入力系

	MouseEvent: {
		inputModes: { edit: ['circle-unshade', 'circle-shade'], play: ['number', 'clear'] },
		mouseinput: function () { // オーバーライド
			if (this.puzzle.editmode && this.inputMode !== 'auto') {
				if (this.mousestart) { this.inputmark_kropki(); }
			}
			else {
				MouseEvent1.prototype.mouseinput.call(this);
			}
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart) { this.inputqnum(); }
			}
			else if (this.puzzle.editmode) {
				if (this.pid === 'kropki') {
					if (this.mousestart) { this.inputmark_kropki(); }
				}
			}
		},
		inputmark_kropki: function () {
			const pos = this.getpos(0.33);
			if (!pos.isinside()) { return; }

			if (!this.cursor.equals(pos) && this.inputMode === 'auto') {
				this.setcursor(pos);
				pos.draw();
			}
			else {
				const border = pos.getb();
				if (border.isnull) { return; }

				const qn = border.qnum;
				if (this.inputMode === 'circle-unshade') { border.setQnum(border.qnum !== 1 ? 1 : 0); }
				else if (this.inputMode === 'circle-shade') { border.setQnum(border.qnum !== 2 ? 2 : 0); }
				else if (this.btn === 'left') {
					if (qn === -1) { border.setQnum(1); }
					else if (qn === 1) { border.setQnum(2); }
					else { border.setQnum(-1); }
				}
				else if (this.btn === 'right') {
					if (qn === -1) { border.setQnum(2); }
					else if (qn === 2) { border.setQnum(1); }
					else { border.setQnum(-1); }
				}
				border.draw();
			}
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		enableplay: true,
		moveTarget: function (ca): boolean {
			if (this.puzzle.editmode) { return this.moveTBorder(ca); }
			else if (this.puzzle.playmode) { return this.moveTCell(ca); }
			return false;
		},

		keyinput: function (ca) {
			if (this.puzzle.editmode) { this.key_inputmark(ca); }
			else if (this.puzzle.playmode) { this.key_inputqnum(ca); }
		},
		key_inputmark: function (ca: string) {
			const border = this.cursor.getb();
			if (border.isnull) { return; }

			if (this.pid === 'kropki') {
				if (ca === '1' || ca === '2') {
					border.setQnum(+ca);
				}
				else if (ca === ' ' || ca === '-') {
					border.setQnum(-1);
				}
				else { return; }
			}
			else if (ca === 'q' || ca === 'w' || ca === 'e' || ca === ' ' || ca === '-') {
				let tmp: IDir | 0 = border.NDIR;
				if (ca === 'q') { tmp = (border.isHorz() ? border.UP : border.LT); }
				if (ca === 'w') { tmp = (border.isHorz() ? border.DN : border.RT); }

				border.setQdir(border.qdir !== tmp ? tmp : border.NDIR);
				border.setQnum(-1);
			}
			else if ('0' <= ca && ca <= '9') {
				const num = +ca, cur = border.qnum;
				const max = Math.max(this.board.cols, this.board.rows) - 1;

				border.setQdir(border.NDIR);
				if (cur <= 0 || this.prev !== border) { if (num <= max) { border.setQnum(num); } }
				else {
					if (cur * 10 + num <= max) { border.setQnum(cur * 10 + num); }
					else if (num <= max) { border.setQnum(num); }
				}
			}
			else { return; }

			this.prev = border;
			border.draw();
		}
	},

	TargetCursor: {
		adjust_modechange: function () {
			this.bx -= ((this.bx + 1) % 2);
			this.by -= ((this.by + 1) % 2);
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		enableSubNumberArray: true,
		maxnum: function (): number {
			return Math.max(this.board.cols, this.board.rows);
		}
	},
	Board: {
		cols: 7,
		rows: 7,

		hasborder: 1
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		hideHatena: true,

		numbercolor_func: "anum",

		paint: function () {

			this.drawBGCells();
			this.drawTargetSubNumber();
			this.drawGrid();

			this.drawStars();
			this.drawSubNumbers();
			this.drawAnsNumbers();

			this.drawChassis();

			this.drawTarget_minarism();
		},

		drawTarget_minarism: function () {
			this.drawCursor(this.puzzle.playmode);
		},
		// tentaishoとほぼ同じもの
		drawStars: function () {
			const g = this.vinc('star', 'auto', true);

			g.lineWidth = Math.max(this.cw * 0.03, 1);
			const blist = this.range.borders;
			for (let i = 0; i < blist.length; i++) {
				const border = blist[i], bx = border.bx, by = border.by;

				g.vid = "s_star1_" + border.id;
				if (border.qnum === 1) {
					g.strokeStyle = (border.error === 1 ? this.errcolor1 : this.quescolor);
					g.fillStyle = "white";
					g.shapeCircle(bx * this.bw, by * this.bh, this.cw * 0.12);
				}
				else { g.vhide(); }

				g.vid = "s_star2_" + border.id;
				if (border.qnum === 2) {
					g.fillStyle = (border.error === 1 ? this.errcolor1 : this.quescolor);
					g.fillCircle(bx * this.bw, by * this.bh, this.cw * 0.135);
				}
				else { g.vhide(); }
			}
		}
	},

	Encode: {
		decodePzpr: function (type) {
			this.decodeCircle_kropki(type);
		},
		encodePzpr: function (type) {
			this.encodeCircle_kropki(type);
		},

		decodeCircle_kropki: function (type: number) {
			const bd = this.board;
			let bstr = this.outbstr, c = 0, tri = [9, 3, 1];
			const pos = (bstr ? Math.min(((bd.border.length + 2) / 3) | 0, bstr.length) : 0);
			for (let i = 0; i < pos; i++) {
				const ca = Number.parseInt(bstr.charAt(i), 27);
				for (let w = 0; w < 3; w++) {
					if (!!bd.border[c]) {
						const val = ((ca / tri[w]) | 0) % 3;
						if (val > 0) { bd.border[c].qnum = val; }
						c++;
					}
				}
			}
			this.outbstr = bstr.substr(pos);
		},
		encodeCircle_kropki: function (type: number) {
			const bd = this.board;
			let cm = "", num = 0, pass = 0, tri = [9, 3, 1];
			for (let c = 0; c < bd.border.length; c++) {
				if (bd.border[c].qnum > 0) { pass += (bd.border[c].qnum * tri[num]); }
				num++;
				if (num === 3) { cm += pass.toString(27); num = 0; pass = 0; }
			}
			if (num > 0) { cm += pass.toString(27); }

			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeBorder(function (border, ca) {
				if (ca === "a") { border.qdir = (border.isHorz() ? border.UP : border.LT); }
				else if (ca === "b") { border.qdir = (border.isHorz() ? border.DN : border.RT); }
				else if (ca === ".") { border.qnum = -2; }
				else if (ca !== "0") { border.qnum = +ca; }
			});
			this.decodeCellAnumsub();
		},
		encodeData: function () {
			this.encodeBorder(function (border) {
				const dir = border.qdir;
				if (dir === border.UP || dir === border.LT) { return "a "; }
				else if (dir === border.DN || dir === border.RT) { return "b "; }
				else if (border.qnum === -2) { return ". "; }
				else if (border.qnum !== -1) { return border.qnum + " "; }
				else { return "0 "; }
			});
			this.encodeCellAnumsub();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkDifferentNumberInLine",
			"checkSubOfNumberIs1",
			"checkSubOfNumberIsNot1",
			"checkDivOfNumberIs2",
			"checkDivOfNumberIsNot2",
			"checkNoNumCell+"
		],

		checkHintSideCell: function (func: (border: Border, a1: number, a2: number) => boolean, code: string) {
			const boardborder = this.board.border;
			for (let id = 0; id < boardborder.length; id++) {
				const border = boardborder[id], cell1 = border.sidecell[0], cell2 = border.sidecell[1];
				const num1 = cell1.getNum(), num2 = cell2.getNum();
				if (num1 <= 0 || num2 <= 0 || !func(border, num1, num2)) { continue; }

				this.failcode.add(code);
				if (this.checkOnly) { break; }
				cell1.seterr(1);
				cell2.seterr(1);
			}
		},
		checkSubOfNumberIs1: function () {
			// 白丸で差が1でない時はNG
			this.checkHintSideCell(function (border, a1, a2) {
				return (border.qnum === 1 && Math.abs(a1 - a2) !== 1);
			}, "nmSubNe1");
		},
		checkSubOfNumberIsNot1: function () {
			// 白丸でないのに差が1の時はNG (ただし黒丸で1,2の場合はOKとする)
			this.checkHintSideCell(function (border, a1, a2) {
				return (border.qnum !== 1 && Math.abs(a1 - a2) === 1 && !(border.qnum === 2 && a1 * a2 === 2));
			}, "nmSubEq1");
		},
		checkDivOfNumberIs2: function () {
			// 黒丸で2倍でない時はNG
			this.checkHintSideCell(function (border, a1, a2) {
				return (border.qnum === 2 && !(a1 * 2 === a2 || a1 === a2 * 2));
			}, "nmDivNe2");
		},
		checkDivOfNumberIsNot2: function () {
			// 黒丸でないのに2倍の時はNG (ただし白丸で1,2の場合はOKとする)
			this.checkHintSideCell(function (border, a1, a2) {
				return (border.qnum !== 2 && (a1 * 2 === a2 || a1 === a2 * 2) && !(border.qnum === 1 && a1 * a2 === 2));
			}, "nmDivEq2");
		}
	},

	FailCode: {
		nmSubNe1: ["白まるの両側の数字の差が1ではありません。", "The difference is not one between two adjacent cells with white circle."],
		nmSubEq1: ["白まるのない両側の数字の差が1になっています。", "The difference is one between two adjacent cells without white circle."],
		nmDivNe2: ["黒まるの両側の数字が2倍ではありません。", "The number is not double the other between two adjacent cells with shaded circle."],
		nmDivEq2: ["黒まるのない両側の数字が2倍になっています。", "The number is double the other between two adjacent cells without shaded circle."]
	}
});
