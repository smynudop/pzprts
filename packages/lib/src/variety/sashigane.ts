//
// パズル固有スクリプト部 エルート・さしがね版 loute.js

import { DIRS } from "../puzzle/Constants";
import { MouseEvent1 } from "../puzzle/MouseInput";
import type { Cell } from "../puzzle/Piece";
import { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Sashigane = createVariety({
	pid: "sashigane",
	//---------------------------------------------------------
	// マウス入力系

	MouseEvent: {
		inputModes: { edit: ['arrow', 'number', 'undef', 'clear'], play: ['border', 'subline'] },
		mouseinput_number: function () {
			if (this.mousestart) { this.inputqnum_loute(); }
		},
		mouseinput: function () { // オーバーライド
			if (this.inputMode === 'undef' || this.inputMode === 'circle-unshade') {
				if (this.mousestart) { this.inputqnum_loute(); }
			}
			else { MouseEvent1.prototype.mouseinput.call(this); }
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === 'left' && this.isBorderMode()) { this.inputborder(); }
					else { this.inputQsubLine(); }
				}
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) { this.inputarrow_cell(); }
				else if (this.mouseend && this.notInputted()) { this.inputqnum_loute(); }
			}
		},

		inputarrow_cell_main: function (cell, dir) {
			cell.setQdir(cell.qdir !== dir ? dir : 0);
			cell.setQnum(-1);
		},

		inputqnum_loute: function () {
			const cell = this.getcell();
			if (cell.isnull) { return; }

			if (cell !== this.cursor.getc() && this.inputMode === 'auto') {
				this.setcursor(cell);
			}
			else {
				this.inputcell_loute(cell);
			}
		},
		inputcell_loute: function (cell: Cell) {
			let dir = cell.qdir, num = cell.qnum, val: number;
			// -4to-1:Arrow 0:? 1:何もなし 2:丸のみ 3以上:数字
			if (dir === 5) { val = (num !== -1 ? num : 2); }
			else if (dir === 0) { val = 1; }
			else if (dir === -2) { val = 0; }
			else { val = dir - 5; }

			let min = -4, max = cell.getmaxnum();
			if (this.pid === 'loute') { max = 2; }
			if (this.inputMode === 'circle-unshade' || this.inputMode.match(/number/)) { min = 1; }
			if (this.inputMode === 'undef') { max = 1; min = 0; }

			if (this.btn === 'left') {
				if (min <= val && val < max) { val++; }
				else { val = min; }
			}
			else if (this.btn === 'right') {
				if (min < val && val <= max) { val--; }
				else { val = max; }
			}

			if (val >= 2) { cell.setQdir(5); cell.setNum(val >= 3 ? val : -1); }
			else if (val === 1) { cell.setQdir(0); cell.setNum(-1); }
			else if (val === 0) { cell.setQdir(-2); cell.setNum(-1); }
			else { cell.setQdir(val + 5); cell.setNum(-1); }
			cell.draw();
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		moveTarget: function (ca): boolean {
			if (ca.match(/shift/)) { return false; }
			return this.moveTCell(ca);
		},

		keyinput: function (ca) {
			if (this.key_inputarrow(ca)) { return; }

			if (this.pid === 'loute') {
				this.key_arrow_loute(ca);
			}
			else if (this.pid === 'sashigane') {
				this.key_inputqnum_sashigane(ca);
			}
		},

		key_arrow_loute: function (ca: string) {
			if (ca === '1') { ca = '1'; }
			else if (ca === '2') { ca = '4'; }
			else if (ca === '3') { ca = '2'; }
			else if (ca === '4') { ca = '3'; }
			else if (ca === '5' || ca === 'q') { ca = 'q'; }
			else if (ca === '6' || ca === ' ') { ca = ' '; }

			let cell = this.cursor.getc(), val = -1;

			if ('1' <= ca && ca <= '4') { val = +ca; val = (cell.qdir !== val ? val : 0); }
			else if (ca === '-') { val = (cell.qdir !== -2 ? -2 : 0); }
			else if (ca === 'q') { val = (cell.qdir !== 5 ? 5 : 0); }
			else if (ca === ' ' || ca === 'BS') { val = 0; }
			else if (ca === 's1') { val = -2; }
			else { return; }

			cell.setQdir(val);
			this.prev = cell;
			cell.draw();
		},

		key_inputqnum_sashigane: function (ca: string) {
			const cell = this.cursor.getc();
			if (ca === 'q') {
				cell.setQdir((cell.qdir !== 5) ? 5 : 0);
				cell.setQnum(-1);
			}
			else if (ca === '-') {
				cell.setQdir((cell.qdir !== -2 || cell.qnum !== -1) ? -2 : 0);
				cell.setQnum(-1);
			}
			else if (ca === 'BS' && cell.qdir === 5) {
				if (cell.qnum !== -1) {
					this.key_inputqnum_main(cell, ca);
					if (cell.qnum === -2) {
						cell.setQnum(-1);
					}
				}
				else {
					cell.setQdir(0);
					cell.setQnum(-2);
				}
			}
			else if (ca === ' ' || ca === 'BS') {
				cell.setQdir(0);
				cell.setQnum(-1);
			}
			else {
				this.key_inputqnum_main(cell, ca);
				if (cell.isNum() && cell.qdir !== 5) { cell.setQdir(5); }
			}

			this.prev = cell;
			cell.draw();
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		maxnum: function (): number {
			const bd = this.board, bx = this.bx, by = this.by;
			const col = (((bx < (bd.maxbx >> 1)) ? (bd.maxbx - bx + 2) : bx + 2) >> 1);
			const row = (((by < (bd.maxby >> 1)) ? (bd.maxby - by + 2) : by + 2) >> 1);
			return (col + row - 1);
		},
		minnum: 3,

		place: 0, // setLblockInfoでの設定用
		getObjNum: function (): number { return this.qdir; },
		isCircle: function (): boolean { return this.qdir === 5; }
	},

	Board: {
		cols: 8,
		rows: 8,

		hasborder: 1
	},
	BoardExec: {
		adjustBoardData: function (key, d) {
			this.adjustNumberArrow(key, d);
		}
	},

	AreaRoomGraph: {
		enabled: true,

		// オーバーライド
		resetExtraData: function (cell) {
			//@ts-ignore
			cell.place = 0;
		},
		setExtraData: function (component) {
			component.clist = new CellList(component.getnodeobjs()) as any;
			component.shape = 0;

			const clist = component.clist, d = clist.getRectSize(), bd = this.board;

			/* 四角形のうち別エリアとなっている部分を調べる */
			/* 幅が1なので座標自体は調べなくてよいはず      */
			const subclist = this.board.cellinside(d.x1, d.y1, d.x2, d.y2).filter(function (cell) { return (cell.room !== component); });
			const dl = subclist.getRectSize();
			if (subclist.length === 0 || (dl.cols * dl.rows !== dl.cnt) || ((d.cols - 1) !== dl.cols) || ((d.rows - 1) !== dl.rows)) {
				component.shape = 0;
				//@ts-ignore
				for (let i = 0; i < clist.length; i++) { clist[i].place = 0; }
			}
			else {
				component.shape = 1; /* 幅が1のL字型 */
				//@ts-ignore
				for (let i = 0; i < clist.length; i++) { clist[i].place = 1; } /* L字型ブロックのセル */

				/* 端のセル */
				const isUL = (d.x1 === dl.x1 && d.y1 === dl.y1)
				const isUR = (d.x2 === dl.x2 && d.y1 === dl.y1)
				const isDL = (d.x1 === dl.x1 && d.y2 === dl.y2)
				const isDR = (d.x2 === dl.x2 && d.y2 === dl.y2);
				if (isUL || isDR) {
					bd.getc(d.x1, d.y2).place = 2;
					bd.getc(d.x2, d.y1).place = 2;
				}
				else if (isDL || isUR) {
					bd.getc(d.x1, d.y1).place = 2;
					bd.getc(d.x2, d.y2).place = 2;
				}

				/* 角のセル */
				if (isUL) { bd.getc(d.x2, d.y2).place = 3; }
				else if (isDL) { bd.getc(d.x2, d.y1).place = 3; }
				else if (isUR) { bd.getc(d.x1, d.y2).place = 3; }
				else if (isDR) { bd.getc(d.x1, d.y1).place = 3; }
			}
		}
	},
	GraphComponent: {
		shape: 0
	},
	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "DLIGHT",

		bordercolor_func: "qans",
		numbercolor_func: "qnum",
		hideHatena: true,

		circleratio: [0.40, 0.40],		/* 線幅を1pxにする */

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();
			this.drawBorders();

			this.drawCellArrows();
			this.drawHatenas_loute();
			this.drawCircledNumbers();

			this.drawBorderQsubs();

			this.drawChassis();

			this.drawTarget();
		},

		getCircleStrokeColor: function (cell): string | null {
			//@ts-ignore
			if (cell.isCircle()) { return this.quescolor; }
			return null;
		},
		circlefillcolor_func: "null",

		drawHatenas_loute: function () {
			const g = this.vinc('cell_hatena', 'auto');
			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				g.vid = "cell_text_h_" + cell.id;
				if (cell.qdir === -2) {
					g.fillStyle = (cell.error === 1 ? this.errcolor1 : this.quescolor);
					this.disptext("?", cell.bx * this.bw, cell.by * this.bh);
				}
				else { g.vhide(); }
			}
		},
	},

	Encode: {
		decodePzpr: function (type) {
			this.decodeSashigane();
		},
		encodePzpr: function (type) {
			this.encodeSashigane();
		},

		decodeSashigane: function () {
			let c = 0, i = 0, bstr = this.outbstr, bd = this.board;
			for (i = 0; i < bstr.length; i++) {
				const ca = bstr.charAt(i), cell = bd.cell[c];

				if (this.include(ca, "0", "9") || this.include(ca, "a", "f")) { cell.qdir = 5; cell.qnum = Number.parseInt(ca, 16); }
				else if (ca === '-') { cell.qdir = 5; cell.qnum = Number.parseInt(bstr.substr(i + 1, 2), 16); i += 2; }
				else if (ca === '.') { cell.qdir = 5; }
				else if (ca === '%') { cell.qdir = -2; }
				else if (ca >= 'g' && ca <= 'j') { cell.qdir = (Number.parseInt(ca, 20) - 15); }
				else if (ca >= 'k' && ca <= 'z') { c += (Number.parseInt(ca, 36) - 20); }

				c++;
				if (!bd.cell[c]) { break; }
			}
			this.outbstr = bstr.substr(i + 1);
		},
		encodeSashigane: function () {
			let cm = "", count = 0, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				let pstr = "", dir = bd.cell[c].qdir, qn = bd.cell[c].qnum;
				if (dir === 5) {
					if (qn >= 0 && qn < 16) { pstr = qn.toString(16); }
					else if (qn >= 16 && qn < 256) { pstr = "-" + qn.toString(16); }
					else { pstr = "."; }
				}
				else if (dir === -2) { pstr = "%"; }
				else if (dir !== 0) { pstr = (dir + 15).toString(20); }
				else { count++; }

				if (count === 0) { cm += pstr; }
				else if (pstr || count === 16) { cm += ((count + 19).toString(36) + pstr); count = 0; }
			}
			if (count > 0) { cm += (count + 19).toString(36); }

			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCell(function (cell, ca) {
				if (ca.charAt(0) === "o") {
					cell.qdir = 5;
					if (ca.length > 1) { cell.qnum = +ca.substr(1); }
				}
				else if (ca === "-") { cell.qdir = -2; }
				else if (ca !== ".") { cell.qdir = +ca; }
			});

			this.decodeBorderAns();
		},
		encodeData: function () {
			this.encodeCell(function (cell) {
				if (cell.qdir === 5) {
					return "o" + (cell.qnum !== -1 ? cell.qnum : '') + " ";
				}
				else if (cell.qdir === -2) { return "- "; }
				else if (cell.qdir !== 0) { return cell.qdir + " "; }
				else { return ". "; }
			});

			this.encodeBorderAns();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkArrowCorner1",
			"checkArrowCorner2",
			"checkCircleCorner",
			"checkNumberAndSize+",
			"checkBorderDeadend",
			"checkLblock"
		],

		checkArrowCorner1: function () {
			const rooms = this.board.roommgr.components;
			allloop:
			for (let id = 0; id < rooms.length; id++) {
				if (rooms[id].shape === 0) { continue; }

				const clist = rooms[id].clist;
				for (let i = 0; i < clist.length; i++) {
					const cell = clist[i], num = cell.getObjNum();
					if (num < 1 || num > 4 || cell.place === 2) { continue; }

					this.failcode.add("arBlkEdge");
					if (this.checkOnly) { break allloop; }
					clist.seterr(1);
					break;
				}
			}
		},

		checkArrowCorner2: function () {
			const rooms = this.board.roommgr.components;
			allloop:
			for (let id = 0; id < rooms.length; id++) {
				if (rooms[id].shape === 0) { continue; }

				const clist = rooms[id].clist;
				for (let i = 0; i < clist.length; i++) {
					const cell = clist[i], adb = cell.adjborder, num = cell.getObjNum();
					if (num < 1 || num > 4 ||
						!((num === DIRS.UP && adb.top.isBorder()) ||
							(num === DIRS.DN && adb.bottom.isBorder()) ||
							(num === DIRS.LT && adb.left.isBorder()) ||
							(num === DIRS.RT && adb.right.isBorder()))) { continue; }

					this.failcode.add("arNotPtCnr");
					if (this.checkOnly) { break allloop; }
					clist.seterr(1);
					break;
				}
			}
		},

		checkCircleCorner: function () {
			const rooms = this.board.roommgr.components;
			allloop:
			for (let id = 0; id < rooms.length; id++) {
				if (rooms[id].shape === 0) { continue; }

				const clist = rooms[id].clist;
				for (let i = 0; i < clist.length; i++) {
					const cell = clist[i];
					if (!cell.isCircle() || cell.place === 3) { continue; }

					this.failcode.add("ciNotOnCnr");
					if (this.checkOnly) { break allloop; }
					clist.seterr(1);
					break;
				}
			}
		},

		checkLblock: function () {
			const rooms = this.board.roommgr.components;
			for (let id = 0; id < rooms.length; id++) {
				if (rooms[id].shape !== 0) { continue; }

				this.failcode.add("bkNotLshape");
				if (this.checkOnly) { break; }
				rooms[id].clist.seterr(1);
			}
		}
	},

	FailCode: {
		bkNotLshape: ["ブロックが幅1のL字型になっていません。", "A block is not L-shape or whose width is not one."],
		arBlkEdge: ["矢印がブロックの端にありません。", "An arrow is not at the edge of the block."],
		arNotPtCnr: ["矢印の先にブロックの角がありません。", "An arrow doesn't indicate the corner of a block."],
		ciNotOnCnr: ["白丸がブロックの角にありません。", "A circle is out of the corner."]
	}
});
