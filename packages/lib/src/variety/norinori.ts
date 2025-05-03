//
// パズル固有スクリプト部 ＬＩＴＳ・のりのり版 lits.js

import { MouseEvent1 } from "../puzzle/MouseInput";
import type { Cell } from "../puzzle/Piece";
import { createVariety } from "./createVariety";

//
export const Norinori = createVariety({
	pid: "norinori",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) { this.inputcell(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) { this.inputborder(); }
			}
		},
		inputModes: { edit: ['border'], play: ['shade', 'unshade'] },
		shadeCount: 0,
		mousereset: function () {
			this.shadeCount = 0;

			MouseEvent1.prototype.mousereset.call(this);
		},
		inputcell: function () {
			const cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell) { return; }

			MouseEvent1.prototype.inputcell.call(this);

			if (this.inputData === 1) {
				++this.shadeCount;
				if (this.shadeCount >= 2) { this.mousereset(); }
			}
		}
	},
	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		posthook: {
			qans: function (cell: Cell) { cell.room.checkAutoCmp(); }
		}
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
	GraphComponent: {
		checkCmp() {
			return this.clist.filter(c => c.qans === 1).length === 2;
		},
	},


	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		autocmp: 'room',
		gridcolor_type: "LIGHT",

		enablebcolor: true,
		bcolor: "rgb(96, 224, 160)",
		qcmpbgcolor: "rgb(96, 255, 160)",
		bgcellcolor_func: "qcmp1",
		paint: function () {
			this.drawBGCells();
			this.drawGrid();
			this.drawShadedCells();

			this.drawBorders();

			this.drawChassis();

			this.drawBoxBorders(false);
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeBorder();
		},
		encodePzpr: function (type) {
			this.encodeBorder();
		},

	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeAreaRoom();
			this.decodeCellAns();
		},
		encodeData: function () {
			this.encodeAreaRoom();
			this.encodeCellAns();
		},
	},

	//---------------------------------------------------------
	// 正解判定処理実行部

	AnsCheck: {
		checklist: [
			"checkOverShadeCell",
			"checkOverShadeCellInArea",
			"checkSingleShadeCell",
			"checkSingleShadeCellInArea",
			"checkNoShadeCellInArea"
		],

		checkOverShadeCell: function (): void {
			this.checkAllArea(this.board.sblkmgr, function (w, h, a, n) { return (a <= 2); }, "csGt2");
		},
		checkSingleShadeCell: function (): void {
			this.checkAllArea(this.board.sblkmgr, function (w, h, a, n) { return (a >= 2); }, "csLt2");
		},

		checkOverShadeCellInArea: function (): void {
			this.checkAllBlock(this.board.roommgr, function (cell) { return cell.isShade(); }, function (w, h, a, n) { return (a <= 2); }, "bkShadeGt2");
		},
		checkSingleShadeCellInArea: function (): void {
			this.checkAllBlock(this.board.roommgr, function (cell) { return cell.isShade(); }, function (w, h, a, n) { return (a !== 1); }, "bkShadeLt2");
		}
	},


	"FailCode": {
		csLt2: ["１マスだけの黒マスのカタマリがあります。", "There is a single shaded cell."],
		csGt2: ["２マスより大きい黒マスのカタマリがあります。", "The size of a mass of shaded cells is over two."],
		bkShadeLt2: ["１マスしか黒マスがない部屋があります。", "A room has only one shaded cell."],
		bkShadeGt2: ["２マス以上の黒マスがある部屋が存在します。", "A room has three or mode shaded cells."]
	}
});