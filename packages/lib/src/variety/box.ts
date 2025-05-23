//
// パズル固有スクリプト部 ボックス版 box.js

import type { Cell, IDir } from "../puzzle/Piece";
import { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Box = createVariety({
	pid: "box",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		inputModes: { edit: ['number'], play: ['shade', 'unshade'] },
		mouseinput_number: function () {
			if (this.mousestart) { this.inputqnum_excell(); }
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) { this.inputcell(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart) { this.inputqnum_excell(); }
			}
		},

		inputqnum_excell: function () {
			const excell = this.getcell_excell();
			if (excell.isnull || excell.group !== 'excell') { return; }

			if (excell !== this.cursor.getex()) {
				this.setcursor(excell);
			}
			else {
				this.inputqnum_main(excell);
			}
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		moveTarget: function (ca): boolean {
			const cursor = this.cursor;
			let excell0 = cursor.getex(), dir: IDir | 0 = excell0.NDIR;
			switch (ca) {
				case 'up': if (cursor.bx === cursor.minx && cursor.miny < cursor.by) { dir = excell0.UP; } break;
				case 'down': if (cursor.bx === cursor.minx && cursor.maxy > cursor.by) { dir = excell0.DN; } break;
				case 'left': if (cursor.by === cursor.miny && cursor.minx < cursor.bx) { dir = excell0.LT; } break;
				case 'right': if (cursor.by === cursor.miny && cursor.maxx > cursor.bx) { dir = excell0.RT; } break;
			}

			if (dir !== excell0.NDIR) {
				cursor.movedir(dir, 2);

				excell0.draw();
				cursor.draw();

				return true;
			}
			return false;
		},

		keyinput: function (ca) {
			this.key_inputexcell(ca);
		},
		key_inputexcell: function (ca: string) {
			const excell = this.cursor.getex(), qn = excell.qnum;
			const max = excell.getmaxnum();

			if ('0' <= ca && ca <= '9') {
				const num = +ca;

				if (qn <= 0 || this.prev !== excell) {
					if (num <= max) { excell.setQnum(num); }
				}
				else {
					if (qn * 10 + num <= max) { excell.setQnum(qn * 10 + num); }
					else if (num <= max) { excell.setQnum(num); }
				}
			}
			else if (ca === ' ' || ca === '-') { excell.setQnum(0); }
			else { return; }

			this.prev = excell;
			this.cursor.draw();
		}
	},

	TargetCursor: {
		initCursor: function () {
			this.init(-1, -1);
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	EXCell: {
		qnum: 0,

		disInputHatena: true,

		maxnum: function (): number {
			const bx = this.bx, by = this.by;
			if (bx === -1 && by === -1) { return 0; }
			const size = (bx === -1 ? this.board.rows : this.board.cols);
			return (size * (size + 1) / 2) | 0;
		},
		minnum: 0
	},

	Board: {
		cols: 9,
		rows: 9,

		hasexcell: 1
	},
	BoardExec: {
		adjustBoardData: function (key, d) {
			const bx1 = (d.x1 | 1), by1 = (d.y1 | 1);
			this.qnumw = [];
			this.qnumh = [];

			const bd = this.board;
			for (let by = by1; by <= d.y2; by += 2) { this.qnumw[by] = [bd.getex(-1, by).qnum]; }
			for (let bx = bx1; bx <= d.x2; bx += 2) { this.qnumh[bx] = [bd.getex(bx, -1).qnum]; }
		},
		adjustBoardData2: function (key, d) {
			const xx = (d.x1 + d.x2), yy = (d.y1 + d.y2), bx1 = (d.x1 | 1), by1 = (d.y1 | 1);

			const bd = this.board;
			switch (key) {
				case this.FLIPY: // 上下反転
					for (let bx = bx1; bx <= d.x2; bx += 2) { bd.getex(bx, -1).setQnum(this.qnumh[bx][0]); }
					break;

				case this.FLIPX: // 左右反転
					for (let by = by1; by <= d.y2; by += 2) { bd.getex(-1, by).setQnum(this.qnumw[by][0]); }
					break;

				case this.TURNR: // 右90°反転
					for (let by = by1; by <= d.y2; by += 2) { bd.getex(-1, by).setQnum(this.qnumh[by][0]); }
					for (let bx = bx1; bx <= d.x2; bx += 2) { bd.getex(bx, -1).setQnum(this.qnumw[xx - bx][0]); }
					break;

				case this.TURNL: // 左90°反転
					for (let by = by1; by <= d.y2; by += 2) { bd.getex(-1, by).setQnum(this.qnumh[yy - by][0]); }
					for (let bx = bx1; bx <= d.x2; bx += 2) { bd.getex(bx, -1).setQnum(this.qnumw[bx][0]); }
					break;
			}
		}
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		numbercolor_func: "qnum",
		qanscolor: "black",

		paint: function () {
			this.drawBGCells();
			this.drawShadedCells();
			this.drawDotCells();
			this.drawGrid();

			this.drawBGEXcells();
			this.drawNumbersEXcell();

			this.drawCircledNumbers_box();

			this.drawChassis();

			this.drawTarget();
		},

		getCanvasCols: function (): number {
			return this.getBoardCols() + 2 * this.margin + 1;
		},
		getCanvasRows: function (): number {
			return this.getBoardRows() + 2 * this.margin + 1;
		},
		getOffsetCols: function (): number { return 0.5; },
		getOffsetRows: function (): number { return 0.5; },

		drawCircledNumbers_box: function () {
			const list = [], bd = this.board;
			const x1 = this.range.x1, y1 = this.range.y1, x2 = this.range.x2, y2 = this.range.y2;
			if (x2 >= bd.maxbx) { for (let by = (y1 | 1), max = Math.min(bd.maxby, y2); by <= max; by += 2) { list.push([bd.maxbx + 1, by]); } }
			if (y2 >= bd.maxby) { for (let bx = (x1 | 1), max = Math.min(bd.maxbx, x2); bx <= max; bx += 2) { list.push([bx, bd.maxby + 1]); } }

			let g = this.vinc('excell_circle', 'auto', true);
			const rsize = this.cw * 0.36;
			g.fillStyle = this.circlebasecolor;
			g.strokeStyle = this.quescolor;
			for (let i = 0; i < list.length; i++) {
				const num = ((list[i][0] !== bd.maxbx + 1 ? list[i][0] : list[i][1]) + 1) >> 1;
				g.vid = ["ex2_cir_", list[i][0], list[i][1]].join("_");
				if (num > 0) {
					g.shapeCircle(list[i][0] * this.bw, list[i][1] * this.bh, rsize);
				}
				else { g.vhide(); }
			}

			const option = { ratio: 0.65 };
			g = this.vinc('excell_number2', 'auto');
			g.fillStyle = this.quescolor;
			for (let i = 0; i < list.length; i++) {
				const num = ((list[i][0] !== bd.maxbx + 1 ? list[i][0] : list[i][1]) + 1) >> 1;
				g.vid = ["ex2_cirtext_", list[i][0], list[i][1]].join("_");
				if (num > 0) {
					this.disptext("" + num, list[i][0] * this.bw, list[i][1] * this.bh, option);
				}
				else { g.vhide(); }
			}
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeBox();
		},
		encodePzpr: function (type) {
			this.encodeBox();
		},

		decodeBox: function () {
			let ec = 0, bstr = this.outbstr, bd = this.board;
			let a: number;
			for (a = 0; a < bstr.length; a++) {
				const ca = bstr.charAt(a), excell = bd.excell[ec];
				if (ca === '-') { excell.qnum = Number.parseInt(bstr.substr(a + 1, 2), 32); a += 2; }
				else { excell.qnum = Number.parseInt(ca, 32); }
				ec++;
				if (ec >= bd.cols + bd.rows) { a++; break; }
			}

			this.outbstr = bstr.substr(a);
		},
		encodeBox: function () {
			let cm = "", bd = this.board;
			for (let ec = 0, len = bd.cols + bd.rows; ec < len; ec++) {
				const qnum = bd.excell[ec].qnum;
				if (qnum < 32) { cm += ("" + qnum.toString(32)); }
				else { cm += ("-" + qnum.toString(32)); }
			}

			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellExcell(function (obj, ca) {
				if (ca === ".") { return; }
				else if (obj.group === 'excell' && !obj.isnull) {
					obj.qnum = +ca;
				}
				else if (obj.group === 'cell') {
					if (ca === "#") { obj.qans = 1; }
					else if (ca === "+") { obj.qsub = 1; }
				}
			});
		},
		encodeData: function () {
			this.encodeCellExcell(function (obj) {
				if (obj.group === 'excell' && !obj.isnull) {
					return (obj.qnum + " ");
				}
				else if (obj.group === 'cell') {
					if (obj.qans === 1) { return "# "; }
					else if (obj.qsub === 1) { return "+ "; }
				}
				return ". ";
			});
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkShadeCellExist",
			"checkShadeCells"
		],

		checkShadeCells: function () {
			const bd = this.board;
			for (let ec = 0; ec < bd.excell.length; ec++) {
				const excell = bd.excell[ec];
				let qn = excell.qnum, pos = excell.getaddr(), val = 0, cell: Cell;
				const clist = new CellList;
				if (pos.by === -1) {
					cell = pos.move(0, 2).getc();
					while (!cell.isnull) {
						if (cell.qans === 1) { val += ((pos.by + 1) >> 1); }
						clist.add(cell);
						cell = pos.move(0, 2).getc();
					}
				}
				else if (pos.bx === -1) {
					cell = pos.move(2, 0).getc();
					while (!cell.isnull) {
						if (cell.qans === 1) { val += ((pos.bx + 1) >> 1); }
						clist.add(cell);
						cell = pos.move(2, 0).getc();
					}
				}
				else { continue; }
				if (qn === val) { continue; }

				this.failcode.add("nmSumRowShadeNe");
				if (this.checkOnly) { break; }
				excell.seterr(1);
				clist.seterr(1);
			}
		}
	},

	FailCode: {
		nmSumRowShadeNe: ["数字と黒マスになった数字の合計が正しくありません。", "A number is not equal to the sum of the number of shaded cells."]
	}
});
