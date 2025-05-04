//
// パズル固有スクリプト部 数独版 sudoku.js

import { Board } from "../puzzle/Board";
import { createVariety } from "./createVariety";

//
export const Sudoku = createVariety({
	pid: "sudoku",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['number', 'clear'], play: ['number', 'clear'] },
		mouseinput_auto: function () {
			if (this.mousestart) { this.inputqnum(); }
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		enableplay: true
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
		cols: 9,
		rows: 9,

		hasborder: 1,

		initBoardSize: function (col: number, row: number) {
			Board.prototype.initBoardSize.call(this, col, row);

			let roomsizex: number
			let roomsizey: number
			roomsizex = roomsizey = (Math.sqrt(this.cols) | 0) * 2;
			if (this.cols === 6) { roomsizex = 6; }
			for (let i = 0; i < this.border.length; i++) {
				const border = this.border[i];
				if (border.bx % roomsizex === 0 || border.by % roomsizey === 0) { border.ques = 1; }
			}
			this.rebuildInfo();
		}
	},

	AreaRoomGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		paint: function () {
			this.drawBGCells();
			this.drawTargetSubNumber();
			this.drawGrid();
			this.drawBorders();

			this.drawSubNumbers();
			this.drawAnsNumbers();
			this.drawQuesNumbers();

			this.drawChassis();

			this.drawCursor();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeNumber16();
		},
		encodePzpr: function (type) {
			this.encodeNumber16();
		},
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnum();
			this.decodeCellAnumsub();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeCellAnumsub();
		},
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkDifferentNumberInRoom",
			"checkDifferentNumberInLine",
			"checkNoNumCell+"
		]
	}
});