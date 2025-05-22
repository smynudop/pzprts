//
// パズル固有スクリプト部 マイナリズム・Kropki版 minarism.js

import { MouseEvent1 } from "../puzzle/MouseInput";
import type { Border, IDir } from "../puzzle/Piece";
import { URL_PZPRAPP, URL_PZPRV3 } from "../pzpr/constants";
import { createVariety } from "./createVariety";

//
export const Minarism = createVariety({
	pid: "minarism",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['ineq', 'number'], play: ['number', 'clear'] },
		mouseinput: function () { // オーバーライド
			if (this.puzzle.editmode && this.inputMode.match(/number/)) {
				if (this.mousestart) { this.inputmark_mouseup(); }
			}
			else {
				MouseEvent1.prototype.mouseinput.call(this);
			}
		},
		mouseinput_other: function () {
			if (this.inputMode === 'ineq') {
				if (this.mousestart || this.mousemove) {
					this.inputmark_mousemove();
				}
			}
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart) { this.inputqnum(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === 'left') { this.inputmark_mousemove(); }
				}
				else if (this.mouseend && this.notInputted()) {
					this.inputmark_mouseup();
				}
			}
		},
		inputmark_mousemove: function () {
			const pos = this.getpos(0);
			if (pos.getc().isnull) { return; }

			const border = this.prevPos.getnb(pos);
			if (!border.isnull) {
				this.inputData = this.prevPos.getdir(pos, 2);
				border.setQdir(this.inputData !== border.qdir ? this.inputData : 0);
				border.draw();
				this.mousereset();
				return;
			}
			this.prevPos = pos;
		},
		inputmark_mouseup: function () {
			const pos = this.getpos(0.33);
			if (!pos.isinside()) { return; }

			if (!this.cursor.equals(pos) && this.inputMode === 'auto') {
				this.setcursor(pos);
				pos.draw();
			}
			else {
				const border = pos.getb();
				if (border.isnull) { return; }

				let dir = border.qdir, num = border.qnum, val: number;
				// -3,-2:IneqMark -1:何もなし 0:丸のみ 1以上:数字
				if (num !== -1) { val = (num > 0 ? num : 0); }
				else if (dir > 0) { val = dir - (((border.bx % 2) === 1) ? 4 : 6); }
				else { val = -1; }

				let max = Math.max(this.board.cols, this.board.rows) - 1, min = -3;
				if (this.inputMode.match(/number/)) { min = -1; }

				if (this.btn === 'left') {
					if (min <= val && val < max) { val++; }
					else { val = min; }
				}
				else if (this.btn === 'right') {
					if (min < val && val <= max) { val--; }
					else { val = max; }
				}

				if (val >= 0) { border.setQdir(0); border.setQnum(val >= 1 ? val : -2); }
				else if (val === -1) { border.setQdir(0); border.setQnum(-1); }
				else { border.setQdir(val + (((border.bx % 2) === 1) ? 4 : 6)); border.setQnum(-1); }
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

			if (ca === 'q' || ca === 'w' || ca === 'e' || ca === ' ' || ca === '-') {
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
		maxnum: function () {
			return Math.max(this.board.cols, this.board.rows);
		}
	},
	Board: {
		cols: 7,
		rows: 7,

		hasborder: 1
	},
	BoardExec: {
		adjustBoardData: function (key, d) {
			this.adjustBorderArrow(key, d);
		}
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		hideHatena: true,

		numbercolor_func: "anum",

		paint: function () {
			this.drawBDBase();

			this.drawBGCells();
			this.drawTargetSubNumber();
			this.drawDashedGrid();

			this.drawQuesNumbers_and_IneqSigns();
			this.drawSubNumbers();
			this.drawAnsNumbers();

			this.drawChassis();

			this.drawTarget_minarism();
		},

		drawTarget_minarism: function () {
			this.drawCursor(this.puzzle.playmode);
		},
		gridcolor_type: "LIGHT",

		drawBDBase: function () {
			const g = this.vinc('border_base', 'auto');
			if (!g.use.canvas) { return; }

			const csize = this.cw * 0.29;
			const blist = this.range.borders;
			for (let i = 0; i < blist.length; i++) {
				const border = blist[i];

				if (border.qdir !== 0 || border.qnum !== -1) {
					const px = border.bx * this.bw, py = border.by * this.bh;
					g.fillStyle = "white";
					g.fillRectCenter(px, py, csize, csize);
				}
			}
		},
		drawQuesNumbers_and_IneqSigns: function () {
			const g = this.vinc('border_marks', 'auto', true);

			const csize = this.cw * 0.27;
			const ssize = this.cw * 0.22;

			g.lineWidth = 1;
			g.strokeStyle = this.quescolor;

			const option = { ratio: 0.45 };
			const blist = this.range.borders;
			for (let i = 0; i < blist.length; i++) {
				const border = blist[i], px = border.bx * this.bw, py = border.by * this.bh;

				// ○の描画
				g.vid = "b_cp_" + border.id;
				if (border.qnum !== -1) {
					g.fillStyle = (border.error === 1 ? this.errcolor1 : "white");
					g.shapeCircle(px, py, csize);
				}
				else { g.vhide(); }

				// 数字の描画
				g.vid = "border_text_" + border.id;
				if (border.qnum > 0) {
					g.fillStyle = this.quescolor;
					this.disptext("" + border.qnum, px, py, option);
				}
				else { g.vhide(); }

				// 不等号の描画
				g.vid = "b_is1_" + border.id;
				if (border.qdir === border.UP || border.qdir === border.LT) {
					g.beginPath();
					switch (border.qdir) {
						case border.UP: g.setOffsetLinePath(px, py, -ssize, +ssize, 0, -ssize, +ssize, +ssize, false); break;
						case border.LT: g.setOffsetLinePath(px, py, +ssize, -ssize, -ssize, 0, +ssize, +ssize, false); break;
					}
					g.stroke();
				}
				else { g.vhide(); }

				g.vid = "b_is2_" + border.id;
				if (border.qdir === border.DN || border.qdir === border.RT) {
					g.beginPath();
					switch (border.qdir) {
						case border.DN: g.setOffsetLinePath(px, py, -ssize, -ssize, 0, +ssize, +ssize, -ssize, false); break;
						case border.RT: g.setOffsetLinePath(px, py, -ssize, -ssize, +ssize, 0, -ssize, +ssize, false); break;
					}
					g.stroke();
				}
				else { g.vhide(); }
			}
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeMinarism(type);
		},
		encodePzpr: function (type) {
			this.encodeMinarism(type);
		},

		decodeMinarism: function (type: number) {
			// 盤面外数字のデコード
			let id = 0, a = 0, mgn = 0, bstr = this.outbstr, bd = this.board;
			let bdmax = bd.border.length;
			if (type === URL_PZPRAPP) { bdmax += (bd.cols + bd.rows); }
			for (let i = 0; i < bstr.length; i++) {
				const ca = bstr.charAt(i);

				if (type === URL_PZPRAPP) {
					if (id < bd.cols * bd.rows) { mgn = ((id / bd.cols) | 0); }
					else if (id < 2 * bd.cols * bd.rows) { mgn = bd.rows; }
				}
				const border = bd.border[id - mgn];

				let tmp = 0;
				if (this.include(ca, '0', '9') || this.include(ca, 'a', 'f')) { border.qnum = Number.parseInt(ca, 16); }
				else if (ca === "-") { border.qnum = Number.parseInt(bstr.substr(i + 1, 2), 16); i += 2; }
				else if (ca === ".") { border.qnum = -2; }
				else if (ca === "g") { tmp = ((type === URL_PZPRV3 || id < bd.cols * bd.rows) ? 1 : 2); }
				else if (ca === "h") { tmp = ((type === URL_PZPRV3 || id < bd.cols * bd.rows) ? 2 : 1); }
				else if (this.include(ca, 'i', 'z')) { id += (Number.parseInt(ca, 36) - 18); }
				else if (type === URL_PZPRAPP && ca === "/") { id = bd.cell.length - 1; }

				if (tmp === 1) { border.qdir = (border.isHorz() ? border.UP : border.LT); }
				else if (tmp === 2) { border.qdir = (border.isHorz() ? border.DN : border.RT); }

				id++;
				if (id >= bdmax) { a = i + 1; break; }
			}
			this.outbstr = bstr.substr(a);
		},
		encodeMinarism: function (type: number) {
			let cm = "", count = 0, bd = this.board;
			for (let id = 0; id < bd.border.length; id++) {
				let pstr = "", border = bd.border[id];
				if (!!border) {
					const dir = border.qdir, qnum = border.qnum;

					if (dir === border.UP || dir === border.LT) { pstr = ((type === URL_PZPRV3 || !!bd.cell[id]) ? "g" : "h"); }
					else if (dir === border.DN || dir === border.RT) { pstr = ((type === URL_PZPRV3 || !!bd.cell[id]) ? "h" : "g"); }
					else if (qnum === -2) { pstr = "."; }
					else if (qnum >= 0 && qnum < 16) { pstr = "" + qnum.toString(16); }
					else if (qnum >= 16 && qnum < 256) { pstr = "-" + qnum.toString(16); }
					else { count++; }
				}
				else { count++; }

				if (count === 0) { cm += pstr; }
				else if (pstr || count === 18) { cm += ((17 + count).toString(36) + pstr); count = 0; }
			}
			if (count > 0) { cm += (17 + count).toString(36); }

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
			"checkSubOfNumber",
			"checkIneqMark",
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
		checkSubOfNumber: function () {
			this.checkHintSideCell(function (border, a1, a2) {
				return (border.qnum > 0 && border.qnum !== Math.abs(a1 - a2));
			}, "nmSubNe");
		},
		checkIneqMark: function () {
			this.checkHintSideCell(function (border, a1, a2) {
				const mark = border.qdir;
				return !(mark === 0 || ((mark === 1 || mark === 3) && a1 < a2) || ((mark === 2 || mark === 4) && a1 > a2));
			}, "nmIneqNe");
		}
	},

	FailCode: {
		nmSubNe: ["丸付き数字とその両側の数字の差が一致していません。", "The difference between two adjacent cells is not equal to the number on circle."],
		nmIneqNe: ["不等号と数字が矛盾しています。", "A inequality sign is not correct."]
	},
});
