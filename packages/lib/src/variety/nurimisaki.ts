//
// パズル固有スクリプト部 クロット・ぬりみさき版 kurotto.js

import { createVariety } from "./createVariety";

//
export const Nurimisaki = createVariety({
	pid: "nurimisaki",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		inputModes: { edit: ['number', 'clear'], play: ['shade', 'unshade'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) { this.inputcell(); }
				else if (this.mouseend && this.notInputted()) { this.inputqcmp(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart) { this.inputqnum(); }
			}
		},
		inputqcmp: function () {
			const cell = this.getcell();
			if (cell.isnull || cell.noNum()) { return; }

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
		maxnum: function (): number {
			const bd = this.board, bx = this.bx, by = this.by;
			const col = (((bx < (bd.maxbx >> 1)) ? (bd.maxbx - bx) : bx) >> 1) + 1;
			const row = (((by < (bd.maxby >> 1)) ? (bd.maxby - by) : by) >> 1) + 1;
			return Math.max(col, row);
		},
		minnum: 2,

		checkComplete: function () {
			if (!this.isValidNum()) { return true; }

			let count = 0, list = this.getdir4clist(), adjcell = null;
			for (let n = 0; n < list.length; n++) {
				if (list[n][0].isUnshade()) { adjcell = list[n][0]; ++count; }
			}
			if (count !== 1) { return false; }

			let dir = this.getdir(adjcell!, 2), pos = adjcell!.getaddr(), length = 2;
			while (1) {
				pos.movedir(dir, 2);
				const cell = pos.getc();
				if (cell.isnull || cell.isShade()) { break; }
				++length;
			}
			return (this.getNum() === length);
		}
	},


	AreaUnshadeGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		hideHatena: true,

		qanscolor: "black",
		numbercolor_func: "qnum",

		circleratio: [0.45, 0.40],

		paint: function () {
			this.drawBGCells();
			this.drawShadedCells();
			this.drawDotCells();
			this.drawDashedGrid();

			this.drawCircledNumbers();

			this.drawChassis();

			this.drawTarget();
		},

		getCircleFillColor: function (cell) {
			if (cell.isNum()) {
				return (cell.qcmp !== 0 ? this.qcmpcolor : this.circlebasecolor);
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
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnum();
			this.decodeCellQanssubcmp_kurotto();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeCellQanssubcmp_kurotto();
		},

		decodeCellQanssubcmp_kurotto: function () {
			this.decodeCell(function (cell, ca) {
				if (ca === "+") { cell.qsub = 1; }
				else if (ca === "-") { cell.qcmp = 1; }
				else if (ca === "#") { cell.qans = 1; }
			});
		},
		encodeCellQanssubcmp_kurotto: function () {
			this.encodeCell(function (cell) {
				if (cell.qans === 1) { return "# "; }
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
			"checkConnectUnshade",
			"check2x2ShadeCell+",
			"checkNonCapePruralUnshaded",
			"checkCapeSingleUnshaded",
			"checkCellNumber_kurotto",
			"check2x2UnshadeCell++"
		],

		checkCellNumber_kurotto: function () {
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (cell.checkComplete()) { continue; }

				this.failcode.add("nmSumSizeNe");
				if (this.checkOnly) { break; }
				cell.seterr(1);
			}
		},

		checkCapeSingleUnshaded: function () {
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (cell.noNum()) { continue; }

				const count = cell.countDir4Cell(function (cell) { return cell.isUnshade(); });
				if (count === 1) { continue; }

				this.failcode.add("nmUnshadeNe1");
				if (this.checkOnly) { break; }
				cell.seterr(1);
			}
		},
		checkNonCapePruralUnshaded: function () {
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (cell.isNum() || cell.isShade()) { continue; }

				const count = cell.countDir4Cell(function (cell) { return cell.isUnshade(); });
				if (count !== 1) { continue; }

				this.failcode.add("nmUnshadeEq1");
				if (this.checkOnly) { break; }
				cell.seterr(1);
			}
		}
	},

	FailCode: {
		nmSumSizeNe: ["連続する白マスの長さが数字と違います。", "The number is not equal to the length of unshaded cells from the circle."],
		nmUnshadeNe1: ["〇の上下左右2マス以上が白マスになっています。", "There are two or more unshaded cells around a circle."],
		nmUnshadeEq1: ["〇でないセルが岬になっています。", "There is an cape without circle."]
	}
});
