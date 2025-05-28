//
// パズル固有スクリプト部 フィルマット・ウソタタミ版 fillmat.js

import { createVariety } from "./createVariety";

//
export const Fillmat = createVariety({
	pid: "fillmat",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['number', 'clear'], play: ['border', 'subline'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === 'left' && this.isBorderMode()) { this.inputborder(); }
					else { this.inputQsubLine(); }
				}
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
		maxnum: 4
	},

	Board: {
		hasborder: 1
	},

	AreaRoomGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "DLIGHT",

		bordercolor_func: "qans",
		numbercolor_func: "qnum",

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();
			this.drawBorders();

			this.drawQuesNumbers();
			this.drawBorderQsubs();

			this.drawChassis();

			this.drawTarget();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeNumber10();
		},
		encodePzpr: function (type) {
			this.encodeNumber10();
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnum();
			this.decodeBorderAns();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeBorderAns();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkBorderCross",

			"checkSideAreaRoomSize",
			"checkTatamiMaxSize",
			"checkDoubleNumber",
			"checkNumberAndSize",

			"checkBorderDeadend+"
		],

		checkTatamiMaxSize: function () {
			this.checkAllArea(this.board.roommgr, function (w, h, a, n) { return (w === 1 || h === 1) && a <= 4; }, "bkLenGt4");
		},
		checkSideAreaRoomSize: function () {
			this.checkSideAreaSize(this.board.roommgr, function (area) { return area.clist.length; }, "bsSizeEq");
		}
	},

	FailCode: {
		bkNoNum: ["数字の入っていないタタミがあります。", "A tatami has no numbers."],
		bkNumGe2: ["1つのタタミに2つ以上の数字が入っています。", "A tatami has plural numbers."],
		bkSizeNe: ["数字とタタミの大きさが違います。", "The size of tatami and the number written in Tatami is different."],
		bkSizeEq: ["数字とタタミの大きさが同じです。", "The size of tatami and the number is the same."],
		bkLenGt4: ["「幅１マス、長さ１～４マス」ではないタタミがあります。", "The width of Tatami is over 1 or the length is over 4."],
		bsSizeEq: ["隣り合うタタミの大きさが同じです。", "The same size Tatami are adjacent."]
	}
});
