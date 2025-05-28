//
// パズル固有スクリプト部 クロシュート版 kurochute.js

import { Cell } from "../puzzle/Piece";
import { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Kurochute = createVariety({
	pid: "kurochute",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		RBShadeCell: true,
		use: true,
		inputModes: { edit: ['number', 'clear'], play: ['shade', 'unshade', 'completion'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart) { this.inputcell_kurochute(); }
				else if (this.mousemove) { this.inputcell(); }
				else if (this.mouseend && this.notInputted()) { this.inputqcmp(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart) { this.inputqnum(); }
			}
		},

		inputcell_kurochute: function () {
			const cell = this.getcell();
			if (cell.isnull) { }
			else if (cell.isNum() && this.btn === 'left') {
				this.inputqcmp();
			}
			else {
				this.inputcell();
			}
		},
		inputqcmp: function () {
			const cell = this.getcell();
			if (cell.isnull) { return; }

			cell.setQcmp(+!cell.qcmp);
			cell.draw();

			this.mousereset();
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
			return Math.max(this.board.cols, this.board.rows) - 1;
		}
	},
	Board: {
		cols: 8,
		rows: 8
	},

	AreaUnshadeGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		qanscolor: "black",
		gridcolor_type: "LIGHT",
		enablebcolor: true,

		paint: function () {
			this.drawDotCells();
			this.drawGrid();
			this.drawShadedCells();

			this.drawQuesNumbers();

			this.drawChassis();

			this.drawTarget();
		},

		getQuesNumberColor: function (cell) {
			if (cell.qcmp === 1) {
				return this.qcmpcolor;
			}
			else if (cell.error === 1) {
				return this.errcolor1;
			}
			return this.quescolor;
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
			this.decodeCellQanssubcmp();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeCellQanssubcmp();
		},

		decodeCellQanssubcmp: function () {
			this.decodeCell(function (cell, ca) {
				if (ca === "+") { cell.qsub = 1; }
				else if (ca === "-") { cell.qcmp = 1; }
				else if (ca === "1") { cell.qans = 1; }
			});
		},
		encodeCellQanssubcmp: function () {
			this.encodeCell(function (cell) {
				if (cell.qans === 1) { return "1 "; }
				else if (cell.qsub === 1) { return "+ "; }
				else if (cell.qcmp === 1) { return "- "; }
				else { return ". "; }
			});
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkShadeCellExist",
			"checkAdjacentShadeCell",
			"checkConnectUnshadeRB",
			"checkShootSingle"
		],

		checkShootSingle: function () {
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (!cell.isValidNum()) { continue; }
				let num = cell.qnum, cell2: Cell;
				const clist = new CellList();
				cell2 = cell.relcell(-num * 2, 0); if (cell2.isShade()) { clist.add(cell2); }
				cell2 = cell.relcell(num * 2, 0); if (cell2.isShade()) { clist.add(cell2); }
				cell2 = cell.relcell(0, -num * 2); if (cell2.isShade()) { clist.add(cell2); }
				cell2 = cell.relcell(0, num * 2); if (cell2.isShade()) { clist.add(cell2); }
				if (clist.length === 1) { continue; }

				this.failcode.add("nmShootShadeNe1");
				if (this.checkOnly) { break; }
				cell.seterr(4);
				clist.seterr(1);
			}
		}
	},

	FailCode: {
		nmShootShadeNe1: ["数字の数だけ離れたマスのうち、1マスだけ黒マスになっていません。", "The number of shaded cells at aparted cell by the number is not one."]
	}
});
