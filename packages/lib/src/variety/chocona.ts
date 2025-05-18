//
// パズル固有スクリプト部 島国・チョコナ・ストストーン版 shimaguni.js

import { createVariety } from "./createVariety";

//
export const Chocona = createVariety({
	pid: "chocona",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		inputModes: { edit: ['border', 'number', 'clear'], play: ['shade', 'unshade'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) { this.inputcell(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) { this.inputborder(); }
				else if (this.mouseend && this.notInputted()) { this.inputqnum(); }
			}
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
		hasborder: 1
	},

	AreaShadeGraph: {
		enabled: true
	},
	AreaRoomGraph: {
		enabled: true,
		hastop: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "LIGHT",

		enablebcolor: true,
		bgcellcolor_func: "qsub1",

		paint: function () {
			this.drawBGCells();
			this.drawGrid();

			this.drawShadedCells();

			this.drawQuesNumbers();

			this.drawBorders();

			this.drawChassis();

			this.drawBoxBorders(false);

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
			this.decodeCellAns();
		},
		encodeData: function () {
			this.encodeAreaRoom();
			this.encodeCellQnum();
			this.encodeCellAns();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkShadeCellExist",
			"checkShadeRect",
			"checkShadeCellCount"
		],
		checkShadeRect: function () {
			this.checkAllArea(this.board.sblkmgr, function (w, h, a, n) { return (w * h === a); }, "csNotRect");
		}
	},

	FailCode: {
		csNotRect: ["黒マスのカタマリが正方形か長方形ではありません。", "A mass of shaded cells is not rectangle."],
		bkShadeNe: ["数字のある領域と、領域の中にある黒マスの数が違います。", "The number of shaded cells in the area and the number written in the area is different."]
	},
});
