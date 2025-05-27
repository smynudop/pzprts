//
// パズル固有スクリプト部 ボサノワ版 bosanowa.js

import { Address } from "../puzzle/Address";
import { Board } from "../puzzle/Board";
import { BorderList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Bosanowa = createVariety({
	pid: "bosanowa",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['number', 'clear'], play: ['number', 'subnumber', 'subnumber-', 'clear'] },
		mouseinput_clear: function () {
			this.inputclean_all();
		},
		mouseinput_other: function () {
			if (this.inputMode.indexOf('subnumber') === 0 && this.mousestart) { this.inputsubnumber_border(); }
		},
		mouseinput_auto: function () {
			if (this.mousestart) { this.inputqnum_bosanowa(); }
		},

		inputqnum_bosanowa: function () {
			const pos = this.getpos(0.31);
			if (!pos.isinside()) { return; }

			if (!this.cursor.equals(pos)) {
				this.setcursor(pos);
			}
			else if (pos.oncell()) {
				this.inputcell_bosanowa(pos);
			}
		},
		inputcell_bosanowa: function (pos: Address) {
			const cell = pos.getc();
			if (cell.isnull) { return; }

			const max = cell.getmaxnum(), ques = cell.ques, num = cell.getNum();
			if (this.puzzle.editmode) {
				if (this.btn === 'left') {
					if (ques === 7) { cell.setNum(-1); cell.setQues(0); }
					else if (num === -1) { cell.setNum(1); cell.setQues(0); }
					else if (num === max) { cell.setNum(-1); cell.setQues(7); }
					else { cell.setNum(num + 1); }
				}
				else if (this.btn === 'right') {
					if (ques === 7) { cell.setNum(max); cell.setQues(0); }
					else if (num === 1) { cell.setNum(-1); cell.setQues(0); }
					else if (num === -1) { cell.setNum(-1); cell.setQues(7); }
					else { cell.setNum(num - 1); }
				}
			}
			if (this.puzzle.playmode && ques === 0) {
				if (this.btn === 'left') {
					if (num === max) { cell.setNum(-1); }
					else if (num === -1) { cell.setNum(1); }
					else { cell.setNum(num + 1); }
				}
				else if (this.btn === 'right') {
					if (num === -1) { cell.setNum(max); }
					else if (num === 1) { cell.setNum(-1); }
					else { cell.setNum(num - 1); }
				}
			}
			cell.drawaround();
		},
		inputsubnumber_border: function () {
			const pos = this.getpos(0.31), border = pos.getb();
			if (border.isnull || !border.isGrid()) { return; }

			if (!this.cursor.equals(pos)) {
				this.setcursor(pos);
			}
			else {
				const isInc = ((this.inputMode === 'subnumber') === (this.btn === 'left'));
				let num = border.qsub;
				if (isInc) { num = (num < 99 ? num + 1 : -1); }
				else { num = (num > -1 ? num - 1 : 99); }
				border.setQsub(num);
				border.drawaround();
			}
		},
		inputclean_all: function () {
			const pos = this.getpos(0.31);
			if (this.prevPos.equals(pos)) { return; }

			if (pos.oncell()) {
				this.inputclean_cell();
			}
			else if (pos.onborder()) {
				const border = pos.getb();
				const blist = new BorderList([border]);
				blist.ansclear();
				border.drawaround();
			}

			this.prevPos = pos;
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		enableplay: true,
		moveTarget: function (ca): boolean { return this.moveTBorder(ca); },

		keyinput: function (ca) {
			this.key_inputqnum_bosanowa(ca);
		},
		key_inputqnum_bosanowa: function (ca: string) {
			const cursor = this.cursor;
			if (cursor.oncell()) {
				const cell = cursor.getc();
				if (this.puzzle.editmode) {
					if (ca === 'w') { cell.setQues(cell.ques !== 7 ? 7 : 0); cell.setNum(-1); }
					else if (ca === '-') { cell.setQues(0); cell.setNum(-1); }
					else if (ca === ' ' || ca === 'BS') {
						if (cell.getNum() !== -1) { this.key_inputqnum(ca); }
						else { cell.setQues(7); }
					}
					else if ('0' <= ca && ca <= '9') {
						if (cell.ques !== 0) { cell.setQues(0); cell.setNum(-1); }
						this.key_inputqnum(ca);
					}
					else { return; }
				}
				else if (this.puzzle.playmode) {
					if (cell.ques === 0) { this.key_inputqnum(ca); }
					else { return; }
				}
			}
			else if (cursor.onborder()) {
				const border = cursor.getb();
				if (!border.isGrid()) { return; }
				if ('0' <= ca && ca <= '9') {
					const num = +ca, qs = border.qsub;
					const qsubmax = 99;

					if (qs <= 0 || this.prev !== border) { if (num <= qsubmax) { border.setQsub(num); } }
					else {
						if (qs * 10 + num <= qsubmax) { border.setQsub(qs * 10 + num); }
						else if (num <= qsubmax) { border.setQsub(num); }
					}
					this.prev = border;
				}
				else if (ca === 'BS') {
					const num = border.qsub;
					if (num < 10) { border.setQsub(-1); }
					else { border.setQsub((num / 10) | 0); }
				}
				else if (ca === '-' || ca === ' ') { border.setQsub(-1); }
				else { return; }
			}
			else { return; }

			cursor.drawaround();
		}
	},

	TargetCursor: {
		// 盤面の中央にカーソルを設置する
		initCursor: function () {
			const bd = this.board;
			this.bx = ((bd.cols - 1) & ~1) + 1;
			this.by = ((bd.rows - 1) & ~1) + 1;
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		ques: 7
	},

	Border: {
		qsub: -1,

		isGrid: function (): boolean {
			return (this.sidecell[0].isValid() && this.sidecell[1].isValid());
		},
		isBorder: function (): boolean {
			return !!(this.sidecell[0].isEmpty() !== this.sidecell[1].isEmpty());
		}
	},

	Board: {
		hasborder: 2,

		initBoardSize: function (col, row) {
			Board.prototype.initBoardSize.call(this, col, row);

			if (!this.puzzle.playeronly) {
				const cell = this.puzzle.cursor.getc(); /* 真ん中にあるはず */
				if (!cell.isnull) { cell.ques = 0; }
			}
		}
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		circleratio: [0.47, 0.42],

		paint: function () {
			this.drawBGCells();

			const disptype = +this.puzzle.getConfig('disptype_bosanowa');
			if (disptype === 1) {
				this.drawCircles();
				this.drawBDnumbase();
			}
			else if (disptype === 2) {
				this.drawOutside_souko();
				this.drawGrid_souko();
				this.drawBDnumbase();
			}
			else if (disptype === 3) {
				this.drawBorders();
				this.drawGrid_waritai();
			}

			this.drawQuesNumbers();
			this.drawAnsNumbers();
			this.drawSubNumbersBD();

			if (!this.puzzle.playeronly && !this.outputImage) {
				this.drawChassis();
			}

			this.drawTarget_bosanowa();
		},

		getCanvasCols: function (): number {
			const disptype = this.puzzle.getConfig('disptype_bosanowa');
			return this.getBoardCols() + 2 * this.margin + (disptype === 2 ? 2 : 0);
		},
		getCanvasRows: function (): number {
			const disptype = this.puzzle.getConfig('disptype_bosanowa');
			return this.getBoardRows() + 2 * this.margin + (disptype === 2 ? 2 : 0);
		},

		drawErrorCells_bosanowa: function () {
			const g = this.vinc('cell_back', 'crispEdges', true);

			g.fillStyle = this.errbcolor1;
			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				g.vid = "c_fullerr_" + cell.id;
				if (cell.error === 1) {
					g.fillRectCenter(cell.bx * this.bw, cell.by * this.bh, this.bw, this.bh);
				}
				else { g.vhide(); }
			}
		},

		getCircleStrokeColor: function (cell): string | null {
			if (cell.isValid() && !cell.isNum()) {
				return (cell.error === 1 ? this.errcolor1 : this.quescolor);
			}
			return null;
		},
		circlefillcolor_func: "null",

		drawGrid_souko: function () {
			const g = this.vinc('grid_souko', 'crispEdges', true);

			g.lineWidth = 1;
			g.strokeStyle = "rgb(127,127,127)";
			const blist = this.range.borders;
			for (let i = 0; i < blist.length; i++) {
				const border = blist[i];
				g.vid = "b_grids_" + border.id;
				if (border.isGrid()) {
					const px = border.bx * this.bw, py = border.by * this.bh;
					if (border.isVert()) {
						const py1 = py - this.bh, py2 = py + this.bh + 1;
						g.strokeDashedLine(px, py1, px, py2, [3]);
					}
					else {
						const px1 = px - this.bw, px2 = px + this.bw + 1;
						g.strokeDashedLine(px1, py, px2, py, [3]);
					}
				}
				else { g.vhide(); }
			}
		},
		drawGrid_waritai: function () {
			const g = this.vinc('grid_waritai', 'crispEdges', true);

			const csize = this.cw * 0.20;
			const blist = this.range.borders;
			for (let i = 0; i < blist.length; i++) {
				const border = blist[i], isgrid = border.isGrid();
				const px = border.bx * this.bw, py = border.by * this.bh;

				g.vid = "b_grid_" + border.id;
				if (isgrid) {
					g.fillStyle = this.gridcolor;
					if (border.isVert()) { g.fillRectCenter(px, py, 0.5, this.bh); }
					else { g.fillRectCenter(px, py, this.bw, 0.5); }
				}
				else { g.vhide(); }

				g.vid = "b_grid2_" + border.id;
				if (isgrid) {
					g.fillStyle = ((border.error === 0) ? "white" : this.errbcolor1);
					if (border.isVert()) { g.fillRectCenter(px, py, 0.5, csize); }
					else { g.fillRectCenter(px, py, csize, 0.5); }
				}
				else { g.vhide(); }
			}
		},

		drawBDnumbase: function () {
			const g = this.vinc('border_number_base', 'crispEdges', true);

			const csize = this.cw * 0.20;
			const blist = this.range.borders;
			for (let i = 0; i < blist.length; i++) {
				const border = blist[i];

				g.vid = "b_bbse_" + border.id;
				if (border.qsub >= 0 && border.isGrid()) {
					g.fillStyle = "white";
					g.fillRectCenter(border.bx * this.bw, border.by * this.bh, csize, csize);
				}
				else { g.vhide(); }
			}
		},
		drawSubNumbersBD: function () {
			const g = this.vinc('border_number', 'auto');

			const option = { ratio: 0.35 };
			const blist = this.range.borders;
			for (let i = 0; i < blist.length; i++) {
				const border = blist[i];
				g.vid = "border_text_" + border.id;
				if (border.qsub >= 0) {
					g.fillStyle = (!border.trial ? this.subcolor : this.trialcolor);
					this.disptext("" + border.qsub, border.bx * this.bw, border.by * this.bh, option);
				}
				else { g.vhide(); }
			}
		},

		// 倉庫番の外側(グレー)描画用
		drawOutside_souko: function () {
			const g = this.vinc('cell_outside_souko', 'crispEdges', true);

			g.fillStyle = "rgb(127,127,127)";
			const d = this.range;
			for (let bx = (d.x1 - 2) | 1; bx <= d.x2 + 2; bx += 2) {
				for (let by = (d.y1 - 2) | 1; by <= d.y2 + 2; by += 2) {
					const addr = new Address(this.puzzle, bx, by);

					g.vid = ["c_full_", bx, by].join('_');
					if (addr.getc().isEmpty() && (
						addr.relcell(-2, 0).ques === 0 || addr.relcell(2, 0).ques === 0 ||
						addr.relcell(0, -2).ques === 0 || addr.relcell(0, 2).ques === 0 ||
						addr.relcell(-2, -2).ques === 0 || addr.relcell(2, -2).ques === 0 ||
						addr.relcell(-2, 2).ques === 0 || addr.relcell(2, 2).ques === 0)) {
						g.fillRectCenter(bx * this.bw, by * this.bh, this.bw + 0.5, this.bh + 0.5);
					}
					else { g.vhide(); }
				}
			}
		},

		drawTarget_bosanowa: function () {
			const islarge = this.puzzle.cursor.oncell();
			this.drawCursor(islarge);
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeBoard();
			this.decodeNumber16();

			const puzzle = this.puzzle;
			if (this.checkpflag("h")) { puzzle.setConfig('disptype_bosanowa', 2); }
			else if (this.checkpflag("t")) { puzzle.setConfig('disptype_bosanowa', 3); }
		},
		encodePzpr: function (type) {
			this.encodeBosanowa();

			const puzzle = this.puzzle;
			if (puzzle.getConfig('disptype_bosanowa') === 2) { this.outpflag = "h"; }
			else if (puzzle.getConfig('disptype_bosanowa') === 3) { this.outpflag = "t"; }
		},

		decodeBoard: function () {
			let bstr = this.outbstr, c = 0, bd = this.board, twi = [16, 8, 4, 2, 1];
			let i: number;
			for (i = 0; i < bstr.length; i++) {
				const num = Number.parseInt(bstr.charAt(i), 32);
				for (let w = 0; w < 5; w++) {
					if (!!bd.cell[c]) {
						bd.cell[c].ques = (num & twi[w] ? 7 : 0);
						c++;
					}
				}
				if (!bd.cell[c]) { break; }
			}
			this.outbstr = bstr.substr(i + 1);
		},

		// エンコード時は、盤面サイズの縮小という特殊処理を行ってます
		encodeBosanowa: function () {
			let x1 = 9999, x2 = -1, y1 = 9999, y2 = -1, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (cell.isEmpty()) { continue; }
				if (x1 > cell.bx) { x1 = cell.bx; }
				if (x2 < cell.bx) { x2 = cell.bx; }
				if (y1 > cell.by) { y1 = cell.by; }
				if (y2 < cell.by) { y2 = cell.by; }
			}

			let cm = "", count = 0, pass = 0, twi = [16, 8, 4, 2, 1];
			for (let by = y1; by <= y2; by += 2) {
				for (let bx = x1; bx <= x2; bx += 2) {
					const cell = bd.getc(bx, by);
					if (cell.isEmpty()) { pass += twi[count]; } count++;
					if (count === 5) { cm += pass.toString(32); count = 0; pass = 0; }
				}
			}
			if (count > 0) { cm += pass.toString(32); }
			this.outbstr += cm;

			cm = ""; count = 0;
			for (let by = y1; by <= y2; by += 2) {
				for (let bx = x1; bx <= x2; bx += 2) {
					let pstr = "", qn = bd.getc(bx, by).qnum;

					if (qn === -2) { pstr = "."; }
					else if (qn >= 0 && qn < 16) { pstr = qn.toString(16); }
					else if (qn >= 16 && qn < 256) { pstr = "-" + qn.toString(16); }
					else { count++; }

					if (count === 0) { cm += pstr; }
					else if (pstr || count === 20) { cm += ((15 + count).toString(36) + pstr); count = 0; }
				}
			}
			if (count > 0) { cm += (15 + count).toString(36); }
			this.outbstr += cm;

			this.outcols = (x2 - x1 + 2) / 2;
			this.outrows = (y2 - y1 + 2) / 2;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCell(function (cell, ca) {
				cell.ques = (ca === "." ? 7 : 0);
				if (ca !== "0" && ca !== ".") { cell.qnum = +ca; }
			});
			this.decodeCell(function (cell, ca) {
				if (ca !== "0" && ca !== ".") { cell.anum = +ca; }
			});
			this.decodeBorder(function (cell, ca) {
				if (ca !== ".") { cell.qsub = +ca; }
			});
		},
		encodeData: function () {
			this.encodeCell(function (cell) {
				if (cell.ques === 7) { return ". "; }
				return (cell.qnum >= 0 ? cell.qnum + " " : "0 ");
			});
			this.encodeCell(function (cell) {
				if (cell.ques === 7 || cell.qnum !== -1) { return ". "; }
				return (cell.anum >= 0 ? cell.anum + " " : "0 ");
			});
			this.encodeBorder(function (cell) {
				return (cell.qsub !== -1 ? cell.qsub + " " : ". ");
			});
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkSubsNumber",
			"checkNoNumCell+"
		],

		checkSubsNumber: function () {
			const subs = [], bd = this.board, UNDEF = -1;
			for (let id = 0; id < bd.border.length; id++) {
				const border = bd.border[id], cell1 = border.sidecell[0], cell2 = border.sidecell[1];
				if (border.isGrid()) {
					if (cell1.isValidNum() && cell2.isValidNum()) {
						subs[id] = Math.abs(cell1.getNum() - cell2.getNum());
					}
					else { subs[id] = UNDEF; }
				}
				else { subs[id] = null; }
			}

			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (cell.isEmpty() || cell.noNum()) { continue; }

				let adb = cell.adjborder, num = cell.getNum(), sum = 0, sub: number | null
				sub = subs[adb.top.id]; if (sub && sub > 0) { sum += sub; } else if (sub === UNDEF) { continue; }
				sub = subs[adb.bottom.id]; if (sub && sub > 0) { sum += sub; } else if (sub === UNDEF) { continue; }
				sub = subs[adb.left.id]; if (sub && sub > 0) { sum += sub; } else if (sub === UNDEF) { continue; }
				sub = subs[adb.right.id]; if (sub && sub > 0) { sum += sub; } else if (sub === UNDEF) { continue; }
				if (num === sum) { continue; }

				this.failcode.add("nmSumOfDiff");
				if (this.checkOnly) { break; }
				cell.seterr(1);
			}
		}
	},

	FailCode: {
		nmSumOfDiff: ["数字とその隣の数字の差の合計が合っていません。", "Sum of the differences between the number and adjacent numbers is not equal to the number."]
	}
});
