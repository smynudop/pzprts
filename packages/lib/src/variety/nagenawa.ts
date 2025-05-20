//
// パズル固有スクリプト部 なげなわ・リングリング版 nagenawa.js

import type { Border } from "../puzzle/Piece";
import { createVariety } from "./createVariety";

//
export const Nagenawa = createVariety({
	pid: "nagenawa",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['border', 'number', 'clear', 'info-line'], play: ['line', 'subcircle', 'subcross', 'clear', 'info-line'] }
		,
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
	KeyEvent: {
		enablemake: true
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		maxnum: function () {
			return Math.min(999, this.room.clist.length);
		},
		minnum: 0
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

	AreaRoomGraph: {
		enabled: true,
		hastop: true
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

			this.drawQuesNumbers();
			this.drawMBs();
			this.drawBorders();


			this.drawLines();
			this.drawPekes();

			this.drawChassis();

			this.drawTarget();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeBorder();
			this.decodeRoomNumber16();
		},
		encodePzpr: function (type) {
			this.encodeBorder();
			this.encodeRoomNumber16();
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeAreaRoom();
			this.decodeCellQnum();
			this.decodeBorderLine();
			this.decodeCellQsub();
		},
		encodeData: function () {
			this.encodeAreaRoom();
			this.encodeCellQnum();
			this.encodeBorderLine();
			this.encodeCellQsub();
		}
	},
	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkLineExist",
			"checkOverLineCount",
			"checkBranchLine",
			"checkDeadendLine+",
			"checkLessLineCount",
			"checkAllLoopRect",
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
