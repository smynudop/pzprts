//
// パズル固有スクリプト部 なわばり・フォーセルズ・ファイブセルズ版 nawabari.js

import { Board } from "../puzzle/Board";
import { createVariety } from "./createVariety";

//
export const Fivecells = createCellPuzzle(5, "fivecells")
export const Fourcells = createCellPuzzle(4, "fourcells")
export function createCellPuzzle(NUMBER: number, pid: string) {
	return createVariety({
		pid,
		//---------------------------------------------------------
		// マウス入力系
		MouseEvent: {
			inputModes: { edit: ['empty', 'number', 'clear'], play: ['border', 'subline'] },
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
			},
			mouseinput_other: function () {
				if (this.inputMode === 'empty') { this.inputempty(); }
			},
			inputempty: function () {
				const cell = this.getcell();
				if (cell.isnull || cell === this.mouseCell) { return; }

				if (this.inputData === null) { this.inputData = (cell.isEmpty() ? 0 : 7); }

				cell.setQues(this.inputData);
				cell.setQnum(-1);
				cell.drawaround();
				this.mouseCell = cell;
			}
		},

		//---------------------------------------------------------
		// キーボード入力系
		KeyEvent: {
			enablemake: true,
			keyinput: function (ca) {
				if (ca === 'w') { this.key_inputvalid(ca); }
				else { this.key_inputqnum(ca); }
			},
			key_inputvalid: function (ca: string) {
				if (ca === 'w') {
					const cell = this.cursor.getc();
					if (!cell.isnull) {
						cell.setQues(cell.ques !== 7 ? 7 : 0);
						cell.setNum(-1);
						cell.drawaround();
					}
				}
			}
		},

		//---------------------------------------------------------
		// 盤面管理系
		Cell: {
			getdir4BorderCount: function (): number {
				let cnt = 0, cblist = this.getdir4cblist();
				for (let i = 0; i < cblist.length; i++) {
					const tcell = cblist[i][0], tborder = cblist[i][1];
					if (tcell.isnull || tcell.isEmpty() || tborder.isBorder()) { cnt++; }
				}
				return cnt;
			},
			maxnum: 3,
			minnum: NUMBER >= 5 ? 0 : 1
		},

		Border: {
			isGrid: function (): boolean {
				return (this.sidecell[0].isValid() && this.sidecell[1].isValid());
			},
			isBorder: function (): boolean {
				return ((this.qans > 0) || this.isQuesBorder());
			},
			isQuesBorder: function (): boolean {
				return !!(this.sidecell[0].isEmpty() !== this.sidecell[1].isEmpty());
			},
		},
		Board: {
			hasborder: 2,

			initBoardSize: function (col: number, row: number) {
				Board.prototype.initBoardSize.call(this, col, row);

				const odd = (col * row) % NUMBER;
				if (odd >= 1) { this.getc(this.minbx + 1, this.minby + 1).ques = 7; }
				if (odd >= 2) { this.getc(this.maxbx - 1, this.minby + 1).ques = 7; }
				if (odd >= 3) { this.getc(this.minbx + 1, this.maxby - 1).ques = 7; }
				if (odd >= 4) { this.getc(this.maxbx - 1, this.maxby - 1).ques = 7; }
			}
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

				this.drawValidDashedGrid();
				this.drawQansBorders();
				this.drawQuesBorders();

				this.drawQuesNumbers();
				this.drawBorderQsubs();

				this.drawTarget();
			},
			getQansBorderColor: function (border): string | null {
				if (border.qans === 1) {
					const err = border.error;
					if (err === 1) { return this.errcolor1; }
					else if (err === -1) { return this.noerrcolor; }
					else if (border.trial) { return this.trialcolor; }
					else { return this.qanscolor; }
				}
				return null;
			},
			getQuesBorderColor: function (border): string | null {
				//@ts-ignore
				return (border.isQuesBorder() ? this.quescolor : null);
			},

			drawValidDashedGrid: function () {
				const g = this.vinc('grid_waritai', 'crispEdges', true);

				const dotmax = this.cw / 10 + 3;
				const dotCount = Math.max(this.cw / dotmax, 1);
				const dotSize = this.cw / (dotCount * 2);

				g.lineWidth = 1;
				g.strokeStyle = this.gridcolor;

				const blist = this.range.borders;
				for (let n = 0; n < blist.length; n++) {
					const border = blist[n];
					g.vid = "b_grid_wari_" + border.id;
					if (border.isGrid()) {
						const px = border.bx * this.bw, py = border.by * this.bh;
						if (border.isVert()) { g.strokeDashedLine(px, py - this.bh, px, py + this.bh, [dotSize]); }
						else { g.strokeDashedLine(px - this.bw, py, px + this.bw, py, [dotSize]); }
					}
					else { g.vhide(); }
				}
			}
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
				if (NUMBER === 4) this.filever = 1
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
				"checkOverCells",
				"checkdir4BorderAns",
				"checkBorderDeadend+",
				"checkLessCells"
			],

			checkOverCells: function () {
				this.checkAllArea(this.board.roommgr, function (w, h, a, n) { return (a >= NUMBER); }, "bkSizeLt");
			},
			checkLessCells: function () {
				this.checkAllArea(this.board.roommgr, function (w, h, a, n) { return (a <= NUMBER); }, "bkSizeGt");
			},

			checkdir4BorderAns: function () {
				this.checkAllCell(function (cell) { return (cell.isValidNum() && cell.getdir4BorderCount() !== cell.qnum); }, "nmBorderNe");
			}
		},

		FailCode: {
			nmBorderNe: ["数字の周りにある境界線の本数が違います。", "The number is not equal to the number of border lines around it."],
			bkNoNum: ["数字の入っていない部屋があります。", "A room has no numbers."],
			bkNumGe2: ["1つの部屋に2つ以上の数字が入っています。", "A room has plural numbers."],
			bkSizeLt: [`サイズが${NUMBER}マスより小さいブロックがあります。`, `The size of block is smaller than ${NUMBER}}.`],
			bkSizeGt: [`サイズが${NUMBER}マスより大きいブロックがあります。`, `The size of block is larger than ${NUMBER}}.`],
		}
	});

}