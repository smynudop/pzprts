//
// パズル固有スクリプト部 黒マスはどこだ版 kurodoko.js

import type { Cell } from "../puzzle/Piece";
import { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Kurodoko = createVariety({
	pid: "kurodoko",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		RBShadeCell: true,
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
		numberRemainsUnshaded: true,

		maxnum: function () {
			return this.board.cols + this.board.rows - 1;
		},
		minnum: 2
	},
	Board: {
		cols: 9,
		rows: 9
	},

	AreaUnshadeGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		hideHatena: true,

		gridcolor_type: "DLIGHT",

		enablebcolor: true,
		bgcellcolor_func: "qsub1",
		numbercolor_func: "qnum",

		circleratio: [0.45, 0.40],

		paint: function () {
			this.drawBGCells();
			this.drawGrid();
			this.drawShadedCells();

			this.drawCircledNumbers();

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
		},
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnum();
			this.decodeCellAns();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeCellAns();
		},
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkShadeCellExist",
			"checkAdjacentShadeCell",
			"checkConnectUnshadeRB",
			"checkViewOfNumber"
		],

		checkViewOfNumber: function () {
			const boardcell = this.board.cell;
			for (let cc = 0; cc < boardcell.length; cc++) {
				const cell = boardcell[cc];
				if (!cell.isValidNum()) { continue; }

				let clist = new CellList(), adc = cell.adjacent, target: Cell;
				clist.add(cell);
				target = adc.left; while (target.isUnshade()) { clist.add(target); target = target.adjacent.left; }
				target = adc.right; while (target.isUnshade()) { clist.add(target); target = target.adjacent.right; }
				target = adc.top; while (target.isUnshade()) { clist.add(target); target = target.adjacent.top; }
				target = adc.bottom; while (target.isUnshade()) { clist.add(target); target = target.adjacent.bottom; }
				if (cell.qnum === clist.length) { continue; }

				this.failcode.add("nmSumViewNe");
				if (this.checkOnly) { break; }
				clist.seterr(1);
			}
		}
	},

	FailCode: {
		nmSumViewNe: ["数字と黒マスにぶつかるまでの4方向のマスの合計が違います。", "The number and the sum of the coutinuous unshaded cells of four direction is different."]
	}
});
