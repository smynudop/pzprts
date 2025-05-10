//
// パズル固有スクリプト部 四角に切れ・アホになり切れ版 shikaku.js

import type { Cell } from "../puzzle/Piece";
import type { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Shikaku = createVariety({
	pid: "shikaku",
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
	Board: {
		hasborder: 1
	},

	AreaRoomGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		hideHatena: true,

		gridcolor_type: "DLIGHT",

		bordercolor_func: "qans",

		fontShadecolor: "white",
		numbercolor_func: "fixed_shaded",

		circleratio: [0.40, 0.40],

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();
			this.drawBorders();

			this.drawCircledNumbers();
			this.drawBorderQsubs();

			this.drawChassis();

			this.drawTarget();
		},

		/* 黒丸を描画する */
		circlestrokecolor_func: "null",
		getCircleFillColor: function (cell: Cell) {
			if (cell.qnum !== -1) {
				return (cell.error === 1 ? this.errcolor1 : this.quescolor);
			}
			return null;
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
			this.decodeBorderAns();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeBorderAns();
		},
	},
	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkNoNumber",
			"checkDoubleNumber",
			"checkRoomRect",
			//"checkAhoSquare@aho",
			//"checkLshapeArea@aho",
			"checkNumberAndSize",
			"checkBorderDeadend+"
		],

		checkAhoSquare: function () {
			this.checkAllArea(this.board.roommgr, function (w, h, a, n) { return (n < 0 || (n % 3) === 0 || w * h === a); }, "bkNotRect3");
		},
		checkLshapeArea: function () {
			const rooms = this.board.roommgr.components;
			for (let r = 0; r < rooms.length; r++) {
				const room = rooms[r];
				const clist = room.clist;
				const cell = clist.getQnumCell()!;
				if (cell.isnull) { continue; }

				const n = cell.qnum;
				if (n < 0 || (n % 3) !== 0) { continue; }
				const d = clist.getRectSize();

				const clist2 = this.board.cellinside(d.x1, d.y1, d.x2, d.y2).filter(function (cell) { return (cell.room !== room); });
				const d2 = clist2.getRectSize();

				if (clist2.length > 0 && (d2.cols * d2.rows === d2.cnt) && (d.x1 === d2.x1 || d.x2 === d2.x2) && (d.y1 === d2.y1 || d.y2 === d2.y2)) { continue; }

				this.failcode.add("bkNotLshape3");
				if (this.checkOnly) { break; }
				clist.seterr(1);
			}
		}
	},

	FailCode: {
		bkNoNum: ["数字の入っていない領域があります。", "An area has no numbers."],
		bkNumGe2: ["1つの領域に2つ以上の数字が入っています。", "An area has plural numbers."],
		bkSizeNe: ["数字と領域の大きさが違います。", "The size of the area is not equal to the number."],
		bkNotRect: ["四角形ではない領域があります。", "An area is not rectangle."],
		bkNotRect3: ["大きさが3の倍数ではないのに四角形ではない領域があります。", "An area whose size is not multiples of three is not rectangle."],
		bkNotLshape3: ["大きさが3の倍数である領域がL字型になっていません。", "An area whose size is multiples of three is not L-shape."]
	}
});
