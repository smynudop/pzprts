//
// パズル固有スクリプト部 クロット・ぬりみさき版 kurotto.js

import { Graphic } from "../puzzle/Graphic";
import { createVariety } from "./createVariety";

//
export const Kurotto = createVariety({
	pid: "kurotto",
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
			const max = this.board.cell.length - 1;
			return (max <= 999 ? max : 999);
		},
		minnum: 0,

		checkComplete: function () {
			if (!this.isValidNum()) { return true; }

			let cnt = 0, arealist = [], list = this.getdir4clist();
			for (let i = 0; i < list.length; i++) {
				let area = list[i][0].sblk;
				if (area !== null) {
					for (let j = 0; j < arealist.length; j++) {
						if (arealist[j] === area) { area = null; break; }
					}
					if (area !== null) {
						cnt += area.clist.length;
						arealist.push(area);
					}
				}
			}
			return (this.qnum === cnt);
		}
	},


	AreaShadeGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		hideHatena: true,
		autocmp: "number",
		qanscolor: "black",
		numbercolor_func: "qnum",

		circleratio: [0.45, 0.40],

		// オーバーライド
		setRange: function (x1, y1, x2, y2): void {
			const puzzle = this.puzzle, bd = puzzle.board;
			if (puzzle.execConfig('autocmp')) {
				x1 = bd.minbx - 2;
				y1 = bd.minby - 2;
				x2 = bd.maxbx + 2;
				y2 = bd.maxby + 2;
			}

			Graphic.prototype.setRange.call(this, x1, y1, x2, y2);
		},

		paint: function () {
			this.drawBGCells();
			this.drawShadedCells();
			this.drawDotCells();
			this.drawGrid();

			this.drawCircledNumbers();

			this.drawChassis();

			this.drawTarget();
		},

		getCircleFillColor: function (cell) {
			if (this.puzzle.execConfig('autocmp') && cell.isValidNum()) {
				//@ts-ignore
				return (cell.checkComplete() ? this.qcmpcolor : this.circlebasecolor);
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
			"checkCellNumber_kurotto",
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
	},

	FailCode: {
		nmSumSizeNe: ["隣り合う黒マスの個数の合計が数字と違います。", "The number is not equal to sum of adjacent masses of shaded cells."]
	},
});
