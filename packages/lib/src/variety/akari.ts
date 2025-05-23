//
// パズル固有スクリプト部 美術館版 lightup.js

import type { IRange } from "../puzzle/BoardExec";
import type { Cell } from "../puzzle/Piece";
import { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Akari = createVariety({
	pid: "lightup",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		inputModes: { edit: ['number', 'clear'], play: ['akari', 'unshade', 'completion'] },
		mouseinput_other: function () {
			if (this.inputMode === 'akari' && this.mousestart) { this.inputcell(); }
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || (this.mousemove && (this.inputData !== 1))) { this.inputcell(); }
				else if (this.mouseend && this.notInputted()) { this.inputqcmp(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart) { this.inputqnum(); }
			}
		},
		inputqcmp: function (): void {
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
		akariinfo: 0, /* 0:なし 1:あかり 2:黒マス */
		qlight: 0,	// EXCell基準に表示している情報を保持する変数

		numberRemainsUnshaded: true,

		maxnum: 4,
		minnum: 0,

		posthook: {
			qnum: function (num: number) { this.setAkariInfo(num); },
			qans: function (num: number) { this.setAkariInfo(num); }
		},

		isAkari: function (): boolean { return this.qans === 1; },

		setAkariInfo: function (num: number): void {
			let val = 0, old = this.akariinfo;
			if (this.qnum !== -1) { val = 2; }
			else if (this.qans === 1) { val = 1; }
			if (old === val) { return; }

			this.akariinfo = val;
			this.setQlight(old, val);
		},
		setQlight: function (old: number, val: number): void {
			const clist = this.akariRangeClist();
			if (old === 0 && val === 1) {
				for (let i = 0; i < clist.length; i++) { clist[i].qlight = 1; }
			}
			else {
				for (let i = 0; i < clist.length; i++) {
					const cell2 = clist[i], ql_old = cell2.qlight;
					if (ql_old === 0 && ((old === 1 && val === 0) || (old === 0 && val === 2))) { continue; }
					if (ql_old === 1 && (old === 2 && val === 0)) { continue; }

					cell2.qlight = (cell2.akariRangeClist().some(function (cell) { return cell.isAkari(); }) ? 1 : 0);
				}
				if (val === 2) { this.qlight = 0; }
			}

			const d = this.viewRange();
			this.puzzle.painter.paintRange(d.x1 - 1, this.by - 1, d.x2 + 1, this.by + 1);
			this.puzzle.painter.paintRange(this.bx - 1, d.y1 - 1, this.bx + 1, d.y2 + 1);
		},

		akariRangeClist: function (): CellList<Cell & { qlight: number, akariRangeClist: () => CellList<Cell & { isAkari: () => boolean }> }> {
			let cell: any, clist = new CellList(), adc = this.adjacent;

			clist.add(this);
			cell = adc.left; while (!cell.isnull && cell.qnum === -1) { clist.add(cell); cell = cell.adjacent.left; }
			cell = adc.right; while (!cell.isnull && cell.qnum === -1) { clist.add(cell); cell = cell.adjacent.right; }
			cell = adc.top; while (!cell.isnull && cell.qnum === -1) { clist.add(cell); cell = cell.adjacent.top; }
			cell = adc.bottom; while (!cell.isnull && cell.qnum === -1) { clist.add(cell); cell = cell.adjacent.bottom; }
			return clist as any;
		},
		viewRange: function (): IRange {
			let cell: any, cell2: any, d = { x1: 0, x2: 0, y1: 0, y2: 0 }, adc = this.adjacent;

			cell = this; cell2 = adc.left; while (!cell2.isnull && cell2.qnum === -1) { cell = cell2; cell2 = cell.adjacent.left; } d.x1 = cell.bx;
			cell = this; cell2 = adc.right; while (!cell2.isnull && cell2.qnum === -1) { cell = cell2; cell2 = cell.adjacent.right; } d.x2 = cell.bx;
			cell = this; cell2 = adc.top; while (!cell2.isnull && cell2.qnum === -1) { cell = cell2; cell2 = cell.adjacent.top; } d.y1 = cell.by;
			cell = this; cell2 = adc.bottom; while (!cell2.isnull && cell2.qnum === -1) { cell = cell2; cell2 = cell.adjacent.bottom; } d.y2 = cell.by;
			return d;
		}
	},

	Board: {
		rebuildInfo: function (): void {
			this.initQlight();
		},

		initQlight: function (): void {
			for (let c = 0; c < this.cell.length; c++) {
				const cell = this.cell[c];
				cell.qlight = 0;
				cell.akariinfo = 0;
				if (cell.qnum !== -1) { cell.akariinfo = 2; }
				else if (cell.qans === 1) { cell.akariinfo = 1; }
			}
			for (let c = 0; c < this.cell.length; c++) {
				const cell = this.cell[c];
				if (cell.akariinfo !== 1) { continue; }

				const clist = cell.akariRangeClist();
				for (let i = 0; i < clist.length; i++) { clist[i].qlight = 1; }
			}
		}
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		hideHatena: true,
		autocmp: 'akari',

		gridcolor_type: "LIGHT",

		fgcellcolor_func: "qnum",

		fontShadecolor: "white",
		qcmpcolor: "rgb(127,127,127)",
		bgcellcolor_func: "light",

		lightcolor: "rgb(192, 255, 127)",

		paint: function () {
			this.drawBGCells();
			this.drawGrid();
			this.drawQuesCells();
			this.drawQuesNumbers();

			this.drawAkari();
			this.drawDotCells();

			this.drawChassis();

			this.drawTarget();
		},

		getBGCellColor: function (cell: Cell & { qlight: number }): string | null {
			if (cell.qnum === -1) {
				if (cell.error === 1) { return this.errbcolor1; }
				else if (cell.qlight === 1 && this.puzzle.execConfig('autocmp')) { return this.lightcolor; }
			}
			return null;
		},
		drawAkari: function (): void {
			const g = this.vinc('cell_akari', 'auto');

			const rsize = this.cw * 0.40;
			const lampcolor = "rgb(0, 127, 96)";
			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				g.vid = "c_AK_" + cell.id;
				if (cell.isAkari()) {
					g.fillStyle = (cell.error === 4 ? this.errcolor1 : (!cell.trial ? lampcolor : this.trialcolor));
					g.fillCircle((cell.bx * this.bw), (cell.by * this.bh), rsize);
				}
				else { g.vhide(); }
			}
		},
		getQuesNumberColor: function (cell): string {
			return (cell.qcmp === 1 ? this.qcmpcolor : this.fontShadecolor);
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decode4Cell();
		},
		encodePzpr: function (type) {
			this.encode4Cell();
		},

	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnumAns();
			this.decodeCellQcmp();
		},
		encodeData: function () {
			this.encodeCellQnumAns();
			this.encodeCellQcmp();
		},

		decodeCellQcmp: function () {
			this.decodeCell(function (cell, ca) {
				if (ca === "-") { cell.qcmp = 1; }
			});
		},
		encodeCellQcmp: function () {
			if (!this.puzzle.board.cell.some(function (cell) { return cell.qcmp === 1; })) { return; }
			this.encodeCell(function (cell) {
				if (cell.qcmp === 1) { return "- "; }
				else { return ". "; }
			});
		},
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkNotDuplicateAkari",
			"checkDir4Akari",
			"checkShinedCell"
		],

		checkDir4Akari: function () {
			this.checkDir4Cell(function (cell) { return cell.isAkari(); }, 0, "nmAkariNe");
		},
		checkShinedCell: function () {
			this.checkAllCell(function (cell) { return (cell.noNum() && cell.qlight !== 1); }, "ceDark");
		},

		checkNotDuplicateAkari: function () {
			this.checkRowsColsPartly(function (clist) {
				const akaris = clist.filter(function (cell) { return cell.isAkari(); });
				const result = (akaris.length <= 1);
				if (!result) {
					akaris.forEach(c => c.seterr(4));
				}
				return result;
			}, function (cell) { return cell.isNum(); }, "akariDup");
		},

	},

	FailCode: {
		nmAkariNe: ["数字のまわりにある照明の数が間違っています。", "The number is not equal to the number of Akari around it."],
		akariDup: ["照明に別の照明の光が当たっています。", "Akari is shined from another Akari."],
		ceDark: ["照明に照らされていないセルがあります。", "A cell is not shined."]
	}
});
