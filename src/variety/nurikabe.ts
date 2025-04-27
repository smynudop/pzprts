//
// パズル固有スクリプト部 ぬりかべ・ぬりぼう・モチコロ・モチにょろ版 nurikabe.js

import { createVariety } from "./createVariety";

//
export const Nurikabe = createVariety({
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		inputModes: { edit: ['number', 'clear', 'info-blk'], play: ['shade', 'unshade', 'info-blk'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) { this.inputcell(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart) { this.inputqnum(); }
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
		numberRemainsUnshaded: true
	},

	AreaShadeGraph: {
		enabled: true
	},
	AreaUnshadeGraph: {
		enabled: true
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

			this.drawQuesNumbers();

			this.drawChassis();

			this.drawTarget();
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
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnumAns();
		},
		encodeData: function () {
			this.encodeCellQnumAns();
		}
	},
	AnsCheck: {
		checklist: [
			"check2x2ShadeCell",
			"checkNoNumberInUnshade",
			"checkConnectShade",
			"checkDoubleNumberInUnshade",
			"checkNumberAndUnshadeSize"
		],
		checkDoubleNumberInUnshade: function () {
			this.checkAllBlock(this.board.ublkmgr, function (cell) { return cell.isNum(); }, function (w, h, a, n) { return (a < 2); }, "bkNumGe2");
		},
		checkNumberAndUnshadeSize: function () {
			this.checkAllArea(this.board.ublkmgr, function (w, h, a, n) { return (n <= 0 || n === a); }, "bkSizeNe");
		},
		checkNoNumberInUnshade: function () {
			this.checkAllBlock(this.board.ublkmgr, function (cell) { return cell.isNum(); }, function (w, h, a, n) { return (a !== 0); }, "bkNoNum");
		}
	},
	FailCode: {
		bkNoNum: ["数字の入っていないシマがあります。", "An area of unshaded cells has no numbers."],
		bkNumGe2: ["1つのシマに2つ以上の数字が入っています。", "An area of unshaded cells has plural numbers."],
		bkSizeNe: ["数字とシマの面積が違います。", "The number is not equal to the number of the size of the area."]
	},
});
