//
// パズル固有スクリプト部 お家に帰ろう・ぐんたいあり版 kaero.js

import type { Cell } from "../puzzle/Piece";
import type { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Kaero = createVariety({
	pid: "kaero",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['border', 'number', 'clear'], play: ['line', 'peke', 'bgcolor', 'bgcolor1', 'bgcolor2', 'clear'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === 'left') { this.inputLine(); }
					else if (this.btn === 'right') { this.inputpeke(); }
				}
				else if (this.mouseend && this.notInputted()) {
					this.inputlight();
				}
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) { this.inputborder(); }
				else if (this.mouseend && this.notInputted()) { this.inputqnum(); }
			}
		},

		inputlight: function () {
			const cell = this.getcell();
			if (cell.isnull) { return; }

			if (cell.qsub === 0) { cell.setQsub(this.btn === 'left' ? 1 : 2); }
			else if (cell.qsub === 1) { cell.setQsub(this.btn === 'left' ? 2 : 0); }
			else if (cell.qsub === 2) { cell.setQsub(this.btn === 'left' ? 0 : 1); }
			cell.draw();
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
		numberAsLetter: true,
		maxnum: 52,
	},

	Board: {
		cols: 6,
		rows: 6,

		hasborder: 1
	},

	LineGraph: {
		enabled: true,
		moveline: true
	},

	AreaRoomGraph: {
		enabled: true
	},


	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "LIGHT",

		bgcellcolor_func: "qsub2",
		numbercolor_func: "move",
		qsubcolor1: "rgb(224, 224, 255)",
		qsubcolor2: "rgb(255, 255, 144)",

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();
			this.drawBorders();

			this.drawTip();
			this.drawPekes();
			this.drawDepartures();
			this.drawLines();

			this.drawCellSquare();
			this.drawQuesNumbers();

			this.drawChassis();

			this.drawTarget();
		},

		drawCellSquare: function () {
			const g = this.vinc('cell_number_base', 'crispEdges', true);

			const rw = this.bw * 0.7 - 1;
			const rh = this.bh * 0.7 - 1;
			const isdrawmove = this.puzzle.execConfig('dispmove');

			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				g.vid = "c_sq_" + cell.id;
				if ((!isdrawmove && cell.isDeparture()) || (isdrawmove && cell.isDestination())) {
					if (cell.error === 1) { g.fillStyle = this.errbcolor1; }
					else if (cell.qsub === 1) { g.fillStyle = this.qsubcolor1; }
					else if (cell.qsub === 2) { g.fillStyle = this.qsubcolor2; }
					else { g.fillStyle = this.bgcolor; }
					g.fillRectCenter(cell.bx * this.bw, cell.by * this.bh, rw, rh);
				}
				else { g.vhide(); }
			}
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeBorder();
			this.decodeKaero();
		},
		encodePzpr: function (type) {
			this.encodeBorder();
			this.encodeKaero();
		},

		decodeKaero: function () {
			let c = 0, a = 0, bstr = this.outbstr, bd = this.board;
			for (let i = 0; i < bstr.length; i++) {
				const ca = bstr.charAt(i), cell = bd.cell[c];

				if (this.include(ca, '0', '9')) { cell.qnum = Number.parseInt(ca, 36) + 27; }
				else if (this.include(ca, 'A', 'Z')) { cell.qnum = Number.parseInt(ca, 36) - 9; }
				else if (ca === "-") { cell.qnum = Number.parseInt(bstr.charAt(i + 1), 36) + 37; i++; }
				else if (ca === ".") { cell.qnum = -2; }
				else if (this.include(ca, 'a', 'z')) { c += (Number.parseInt(ca, 36) - 10); }

				c++;
				if (!bd.cell[c]) { a = i + 1; break; }
			}

			this.outbstr = bstr.substring(a);
		},
		encodeKaero: function () {
			let cm = "", count = 0, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				let pstr = "", qnum = bd.cell[c].qnum;
				if (qnum === -2) { pstr = "."; }
				else if (qnum >= 1 && qnum <= 26) { pstr = "" + (qnum + 9).toString(36).toUpperCase(); }
				else if (qnum >= 27 && qnum <= 36) { pstr = "" + (qnum - 27).toString(10); }
				else if (qnum >= 37 && qnum <= 72) { pstr = "-" + (qnum - 37).toString(36).toUpperCase(); }
				else { count++; }

				if (count === 0) { cm += pstr; }
				else if (pstr || count === 26) { cm += ((9 + count).toString(36).toLowerCase() + pstr); count = 0; }
			}
			if (count > 0) { cm += (9 + count).toString(36).toLowerCase(); }

			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnum();
			this.decodeCellQanssub();
			this.decodeBorderQues();
			this.decodeBorderLine();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeCellQanssub();
			this.encodeBorderQues();
			this.encodeBorderLine();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkBranchLine",
			"checkCrossLine",
			"checkConnectObject",
			"checkLineOverLetter",

			"checkSameObjectInRoom_kaero",
			"checkGatheredObject",
			"checkNoObjectBlock",

			"checkDisconnectLine"
		],


		// checkSameObjectInRoom()にbaseを付加した関数
		checkSameObjectInRoom_kaero: function () {
			const rooms = this.board.roommgr.components;
			allloop:
			for (let r = 0; r < rooms.length; r++) {
				let clist = rooms[r].clist, rnum = -1;
				const cbase = getDeparture(clist);
				for (let i = 0; i < cbase.length; i++) {
					const num = cbase[i].qnum;
					if (rnum === -1) { rnum = num; }
					else if (rnum !== num) {
						this.failcode.add("bkPlNum");
						if (this.checkOnly) { break allloop; }
						if (!this.board.puzzle.execConfig('dispmove')) { cbase.forEach(c => c.seterr(4)); }
						clist.seterr(1);
					}
				}
			}
		},

		// 同じ値であれば、同じ部屋に存在することを判定する
		checkGatheredObject: function () {
			let max = 0, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) { const num = bd.cell[c].base!.qnum; if (max < num) { max = num; } }
			allloop:
			for (let num = 0; num <= max; num++) {
				let clist = bd.cell.filter(function (cell) { return (num === cell.base!.qnum); }), rid = null;
				for (let i = 0; i < clist.length; i++) {
					const room = clist[i].room;
					if (rid === null) { rid = room; }
					else if (room !== null && rid !== room) {
						this.failcode.add("bkSepNum");
						if (!this.board.puzzle.execConfig('dispmove')) { getDeparture(clist).forEach(x => x.seterr(4)); }
						clist.seterr(1);
						break allloop;
					}
				}
			}
		},

		checkNoObjectBlock: function () {
			this.checkNoMovedObjectInRoom(this.board.roommgr);
		}
	},

	FailCode: {
		bkNoNum: ["アルファベットのないブロックがあります。", "A block has no letters."],
		bkPlNum: ["１つのブロックに異なるアルファベットが入っています。", "A block has plural kinds of letters."],
		bkSepNum: ["同じアルファベットが異なるブロックに入っています。", "Same kinds of letters are placed different blocks."]
	},

});

const getDeparture = function (clist: CellList) {
	return clist.map(function (cell) { return cell.base; }).filter((x): x is Cell => x != null).filter(x => !x.isnull);
}
