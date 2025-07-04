//
// パズル固有スクリプト部 ペイントエリア版 paintarea.js

import { MouseEvent1 } from "../puzzle/MouseInput";
import { createVariety } from "./createVariety";

//
export const Paintarea = createVariety({
	pid: "paintarea",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		inputModes: { edit: ['border', 'number', 'clear', 'info-blk'], play: ['shade', 'unshade', 'info-blk'] },
		mouseinput: function () { // オーバーライド
			if (this.inputMode === 'shade' || this.inputMode === 'unshade') {
				this.inputtile();
			}
			else { MouseEvent1.prototype.mouseinput.call(this); }
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) { this.inputtile(); }
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
		maxnum: 4,
		minnum: 0
	},
	Board: {
		hasborder: 1
	},

	AreaShadeGraph: {
		enabled: true
	},
	AreaRoomGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		enablebcolor: true,
		bgcellcolor_func: "qsub1",

		bbcolor: "rgb(96, 96, 96)",

		paint: function () {
			this.drawBGCells();
			this.drawShadedCells();
			this.drawGrid();

			this.drawQuesNumbers();

			this.drawBorders();

			this.drawChassis();

			this.drawBoxBorders(true);

			this.drawTarget();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeBorder();
			this.decodeNumber10();
		},
		encodePzpr: function (type) {
			this.encodeBorder();
			this.encodeNumber10();
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
			"checkSameColorTile",					// 問題チェック用
			"checkConnectShade",
			"check2x2ShadeCell+",
			"checkDir4ShadeCell",
			"check2x2UnshadeCell++"
		],

		checkDir4ShadeCell: function () {
			this.checkDir4Cell(function (cell) { return cell.isShade(); }, 0, "nmShadeNe");
		}
	},

	FailCode: {
		nmShadeNe: ["数字の上下左右にある黒マスの数が間違っています。", "The number is not equal to the number of shaded cells in four adjacent cells."]
	}
});
