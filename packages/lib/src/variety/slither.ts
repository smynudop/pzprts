//
// パズル固有スクリプト部 スリザーリンク・バッグ版 slither.js

import type { Cell } from "../puzzle/Piece";
import type { BorderList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const SlitherLink = createVariety({
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['number', 'clear', 'info-line'], play: ['line', 'peke', 'bgcolor', 'bgcolor1', 'bgcolor2', 'clear', 'info-line'] },
		mouseinput_auto: function () {
			const puzzle = this.puzzle;
			if (puzzle.playmode) {
				//@ts-ignore
				if (this.checkInputBGcolor()) {
					this.inputBGcolor();
				}
				else if (this.btn === 'left') {
					if (this.mousestart || this.mousemove) { this.inputLine(); }
					else if (this.pid === 'slither' && this.mouseend && this.notInputted()) {
						this.prevPos.reset();
						this.inputpeke();
					}
				}
				else if (this.btn === 'right') {
					if (this.pid === 'slither' && (this.mousestart || this.mousemove)) { this.inputpeke(); }
					else if (this.pid === 'bag') { this.inputBGcolor(true); }
				}
			}
			else if (puzzle.editmode) {
				if (this.mousestart) { this.inputqnum(); }
			}
		},

		checkInputBGcolor: function () {
			let inputbg = (this.puzzle.execConfig('bgcolor'));
			if (inputbg) {
				if (this.mousestart) { inputbg = this.getpos(0.25).oncell(); }
				else if (this.mousemove) { inputbg = (this.inputData >= 10); }
				else { inputbg = false; }
			}
			return inputbg;
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
		maxnum: 3,
		minnum: 0,

		getdir4BorderLine1: function () {
			const adb = this.adjborder
			let cnt = 0;
			if (adb.top.isLine()) { cnt++; }
			if (adb.bottom.isLine()) { cnt++; }
			if (adb.left.isLine()) { cnt++; }
			if (adb.right.isLine()) { cnt++; }
			return cnt;
		}
	},

	Board: {
		hasborder: 2,
		borderAsLine: true
	},
	LineGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		irowake: true,
		bgcellcolor_func: "qsub2",
		numbercolor_func: "qnum",
		margin: 0.5,

		paint: function () {
			this.drawBGCells();
			this.drawLines();

			this.drawBaseMarks();

			this.drawQuesNumbers();

			this.drawPekes();

			this.drawTarget();
		},

		repaintParts: function (blist: BorderList) {
			this.range.crosses = blist.crossinside();
			this.drawBaseMarks();
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
			this.decodeCellQnum();
			//this.decodeCellQsub();
			this.decodeBorderLine();
		},
		encodeData: function () {
			this.filever = 1;
			this.encodeCellQnum();
			//this.encodeCellQsub();
			this.encodeBorderLine();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkLineExist+",
			"checkBranchLine",
			"checkCrossLine",

			"checkdir4BorderLine",

			"checkOneLoop",
			"checkDeadendLine+",
		],
		checkdir4BorderLine: function () {
			//@ts-ignore
			this.checkAllCell(function (cell: Cell) { return (cell.qnum >= 0 && cell.getdir4BorderLine1() !== cell.qnum); }, "nmLineNe");
		}
	},


	FailCode: {
		nmLineNe: ["数字の周りにある線の本数が違います。", "The number is not equal to the number of lines around it."]
	},
});