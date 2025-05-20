//
// パズル固有スクリプト部 なげなわ・リングリング版 nagenawa.js

import type { Border } from "../puzzle/Piece";
import { BorderList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Ringring = createVariety({
	pid: "ringring",

	//---------------------------------------------------------
	// マウス入力系

	MouseEvent: {
		inputModes: { edit: ['info-line'], play: ['line', 'peke', 'info-line'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === 'left') { this.inputLine(); }
					else if (this.btn === 'right') { this.inputpeke(); }
				}
				else if (this.mouseend && this.notInputted()) {
					if (this.inputpeke_onend()) { return; }
					this.inputMB();
				}
			}
			else if (this.puzzle.editmode) {
				if (this.pid === 'nagenawa') {
					if (this.mousestart || this.mousemove) { this.inputborder(); }
					else if (this.mouseend && this.notInputted()) { this.inputqnum(); }
				}
				else if (this.pid === 'ringring') {
					if (this.mousestart) { this.inputblock(); }
				}
			}
		},
		inputblock: function () {
			const cell = this.getcell();
			if (cell.isnull) { return; }

			cell.setQues(cell.ques === 0 ? 1 : 0);
			cell.draw();
		}
	},

	//---------------------------------------------------------
	// キーボード入力系

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		maxnum: function () {
			return Math.min(999, this.room.clist.length);
		},
		minnum: 0
	},
	Border: {
		enableLineNG: true
	},
	Board: {
		cols: 8,
		rows: 8,

		hasborder: 1
	},

	LineGraph: {
		enabled: true,
		isLineCross: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		irowake: true,

		gridcolor_type: "SLIGHT",

		numbercolor_func: "fixed",

		fontsizeratio: 0.45,
		textoption: { position: 5 }, /* this.TOPLEFT */

		paint: function () {
			this.drawBGCells();

			this.drawDashedGrid();

			this.drawQuesCells();


			this.drawLines();
			this.drawPekes();

			this.drawChassis();

			this.drawTarget();
		},
		drawTarget: function () { }
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理

	Encode: {
		decodePzpr: function (type) {
			this.decodeBlockCell();
		},
		encodePzpr: function (type) {
			this.encodeBlockCell();
		},

		// 元ネタはencode/decodeCrossMark
		decodeBlockCell: function () {
			let cc = 0, i = 0, bstr = this.outbstr, bd = this.board;
			for (i = 0; i < bstr.length; i++) {
				const ca = bstr.charAt(i);

				if (this.include(ca, "0", "9") || this.include(ca, "a", "z")) {
					cc += Number.parseInt(ca, 36);
					if (bd.cell[cc]) { bd.cell[cc].ques = 1; }
				}
				else if (ca === '.') { cc += 35; }

				cc++;
				if (!bd.cell[cc]) { i++; break; }
			}
			this.outbstr = bstr.substr(i);
		},
		encodeBlockCell: function () {
			let cm = "", count = 0, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				let pstr = "";
				if (bd.cell[c].ques === 1) { pstr = "."; }
				else { count++; }

				if (pstr) { cm += count.toString(36); count = 0; }
				else if (count === 36) { cm += "."; count = 0; }
			}
			//if(count>0){ cm += count.toString(36);}

			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------

	FileIO: {
		decodeData: function () {
			this.decodeCellBlock();
			this.decodeBorderLine();
		},
		encodeData: function () {
			this.encodeCellBlock();
			this.encodeBorderLine();
		},

		decodeCellBlock: function () {
			this.decodeCell(function (cell, ca) {
				if (ca === "1") { cell.ques = 1; }
			});
		},
		encodeCellBlock: function () {
			this.encodeCell(function (cell) {
				return (cell.ques === 1 ? "1 " : "0 ");
			});
		}
	},
	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkLineExist",
			"checkLineOnShadeCell",
			"checkBranchLine",
			"checkDeadendLine+",
			"checkAllLoopRect",
			"checkUnreachedUnshadeCell+"
		],

		checkOverLineCount: function () {
			this.checkLinesInArea(this.board.roommgr, function (w, h, a, n) { return (n <= 0 || n >= a); }, "bkLineGt");
		},
		checkLessLineCount: function () {
			this.checkLinesInArea(this.board.roommgr, function (w, h, a, n) { return (n <= 0 || n <= a); }, "bkLineLt");
		},
		checkUnreachedUnshadeCell: function () {
			this.checkAllCell(function (cell) { return (cell.ques === 0 && cell.lcnt === 0); }, "cuNoLine");
		},

		checkAllLoopRect: function () {
			let result = true, bd = this.board;
			const paths = bd.linegraph.components;
			for (let r = 0; r < paths.length; r++) {
				const borders = paths[r].getedgeobjs();
				if (this.isLoopRect(borders)) { continue; }

				result = false;
				if (this.checkOnly) { break; }
				paths[r].setedgeerr(1);
			}
			if (!result) {
				this.failcode.add("lnNotRect");
				bd.border.setnoerr();
			}
		},
		isLoopRect: function (borders: Border[]) {
			const bd = this.board;
			let x1 = bd.maxbx, x2 = bd.minbx, y1 = bd.maxby, y2 = bd.minby;
			for (let i = 0; i < borders.length; i++) {
				if (x1 > borders[i].bx) { x1 = borders[i].bx; }
				if (x2 < borders[i].bx) { x2 = borders[i].bx; }
				if (y1 > borders[i].by) { y1 = borders[i].by; }
				if (y2 < borders[i].by) { y2 = borders[i].by; }
			}
			for (let i = 0; i < borders.length; i++) {
				const border = borders[i];
				if (border.bx !== x1 && border.bx !== x2 && border.by !== y1 && border.by !== y2) { return false; }
			}
			return true;
		}
	},

	FailCode: {
		lnNotRect: ["長方形か正方形でない輪っかがあります。", "There is a non-rectangle loop."],
		bkLineGt: ["数字のある部屋と線が通過するマスの数が違います。", "The number of the cells that is passed any line in the room and the number written in the room is diffrerent."],
		bkLineLt: ["数字のある部屋と線が通過するマスの数が違います。", "The number of the cells that is passed any line in the room and the number written in the room is diffrerent."],
		cuNoLine: ["白マスの上に線が引かれていません。", "There is no line on the unshaded cell."]
	}
});
