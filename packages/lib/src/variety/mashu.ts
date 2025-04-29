//
// パズル固有スクリプト部 ましゅ版 mashu.js

import type { Cell } from "../puzzle/Piece";
import { createVariety } from "./createVariety";

//
export const Mashu = createVariety({
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['circle-shade', 'circle-unshade', 'undef', 'clear', 'info-line'], play: ['line', 'peke', 'info-line'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.btn === 'left') {
					if (this.mousestart || this.mousemove) { this.inputLine(); }
					else if (this.mouseend && this.notInputted()) { this.inputpeke(); }
				}
				else if (this.btn === 'right') {
					if (this.mousestart || this.mousemove) { this.inputpeke(); }
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
		numberAsObject: true,

		maxnum: 2,

		setErrorPearl: function () {
			this.setCellLineError(1);
			const adc = this.adjacent;
			const adb = this.adjborder;
			if (adb.top.isLine()) { adc.top.setCellLineError(0); }
			if (adb.bottom.isLine()) { adc.bottom.setCellLineError(0); }
			if (adb.left.isLine()) { adc.left.setCellLineError(0); }
			if (adb.right.isLine()) { adc.right.setCellLineError(0); }
		},

		//---------------------------------------------------------------------------
		// cell.setCellLineError()    セルと周りの線にエラーフラグを設定する
		//---------------------------------------------------------------------------
		setCellLineError: function (flag: number) {
			const bx = this.bx;
			const by = this.by;
			if (flag) { this.seterr(1); }
			this.board.borderinside(bx - 1, by - 1, bx + 1, by + 1).seterr(1);
		}
	},

	Board: {
		hasborder: 1,

		// uramashu: false,

		// revCircle: function () {
		// 	if (!this.uramashu) { return; }
		// 	this.revCircleMain();
		// },
		// revCircleConfig: function (newval: boolean) {
		// 	if (this.uramashu === newval) { return; }
		// 	this.uramashu = newval;
		// 	this.revCircleMain();
		// },
		// revCircleMain: function () {
		// 	for (var c = 0; c < this.cell.length; c++) {
		// 		var cell = this.cell[c];
		// 		if (cell.qnum === 1) { cell.setQnum(2); }
		// 		else if (cell.qnum === 2) { cell.setQnum(1); }
		// 	}
		// }
	},

	LineGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		irowake: true,

		gridcolor_type: "LIGHT",

		circlefillcolor_func: "qnum2",
		circlestrokecolor_func: "qnum2",

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();

			this.drawCircles();
			this.drawHatenas();

			this.drawPekes();
			this.drawLines();

			this.drawChassis();

			this.drawTarget();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeCircle();
			//this.puzzle.board.revCircle();
		},
		encodePzpr: function (type) {
			//this.puzzle.board.revCircle();
			this.encodeCircle();
			//this.puzzle.board.revCircle();
		},
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnum();
			this.decodeBorderLine();
			//this.puzzle.board.revCircle();
		},
		encodeData: function () {
			//this.puzzle.board.revCircle();
			this.encodeCellQnum();
			this.encodeBorderLine();
			//this.puzzle.board.revCircle();
		},
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkLineExist+",
			"checkBranchLine",
			"checkCrossLine",
			"checkWhitePearl1",
			"checkBlackPearl1",
			"checkBlackPearl2",
			"checkWhitePearl2",
			"checkNoLinePearl",
			"checkDeadendLine+",
			"checkOneLoop"
		],

		checkNoLinePearl: function () {
			this.checkAllCell(function (cell: Cell) { return (cell.isNum() && cell.lcnt === 0); }, "mashuOnLine");
		},

		checkWhitePearl1: function () {
			let result = true;
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (!(cell.qnum === 1 && cell.isLineCurve())) { continue; }

				result = false;
				if (this.checkOnly) { break; }
				cell.setCellLineError(1);
			}
			if (!result) {
				this.failcode.add("mashuWCurve");
				bd.border.setnoerr();
			}
		},
		checkBlackPearl1: function () {
			let result = true;
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (!(cell.qnum === 2 && cell.isLineStraight())) { continue; }

				result = false;
				if (this.checkOnly) { break; }
				cell.setCellLineError(1);
			}
			if (!result) {
				this.failcode.add("mashuBStrig");
				bd.border.setnoerr();
			}
		},

		checkWhitePearl2: function () {
			let result = true;
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (cell.qnum !== 1 || cell.lcnt !== 2) { continue; }
				const adc = cell.adjacent;
				const adb = cell.adjborder;
				let stcnt = 0;
				if (adb.top.isLine() && adc.top.isLineStraight()) { stcnt++; }
				if (adb.bottom.isLine() && adc.bottom.isLineStraight()) { stcnt++; }
				if (adb.left.isLine() && adc.left.isLineStraight()) { stcnt++; }
				if (adb.right.isLine() && adc.right.isLineStraight()) { stcnt++; }
				if (stcnt < 2) { continue; }

				result = false;
				if (this.checkOnly) { break; }
				cell.setErrorPearl();
			}
			if (!result) {
				this.failcode.add("mashuWStNbr");
				bd.border.setnoerr();
			}
		},
		checkBlackPearl2: function () {
			let result = true;
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				const adc = cell.adjacent;
				const adb = cell.adjborder;
				if (cell.qnum !== 2 || cell.lcnt !== 2) { continue; }
				if (!(adb.top.isLine() && adc.top.isLineCurve()) &&
					!(adb.bottom.isLine() && adc.bottom.isLineCurve()) &&
					!(adb.left.isLine() && adc.left.isLineCurve()) &&
					!(adb.right.isLine() && adc.right.isLineCurve())) { continue; }

				result = false;
				if (this.checkOnly) { break; }
				cell.setErrorPearl();
			}
			if (!result) {
				this.failcode.add("mashuBCvNbr");
				bd.border.setnoerr();
			}
		}
	},

	FailCode: {
		mashuOnLine: ["線が上を通っていない丸があります。", "Lines don't pass some pearls."],
		mashuWCurve: ["白丸の上で線が曲がっています。", "Lines curve on white pearl."],
		mashuWStNbr: ["白丸の隣で線が曲がっていません。", "Lines go straight next to white pearl on each side."],
		mashuBStrig: ["黒丸の上で線が直進しています。", "Lines go straight on black pearl."],
		mashuBCvNbr: ["黒丸の隣で線が曲がっています。", "Lines curve next to black pearl."]
	}
});