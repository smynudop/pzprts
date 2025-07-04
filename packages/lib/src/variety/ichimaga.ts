//
// パズル固有スクリプト部 イチマガ・磁石イチマガ・一回曲がって交差もするの版 ichimaga.js

import type { IConfig } from "../puzzle/Puzzle";
import { createVariety } from "./createVariety";

//
export const Ichimaga = createVariety({
	pid: "ichimaga",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['number', 'clear'], play: ['line', 'peke'] },
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
		maxnum: 4
	},

	Board: {
		hasborder: 1
	},

	LineGraph: {
		enabled: true,
		isLineCross: true,
		makeClist: true,

		iscrossing: function (cell) { return cell.noNum(); }
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		hideHatena: true,

		irowake: true,

		gridcolor_type: "LIGHT",

		numbercolor_func: "fixed",

		paint: function () {
			this.drawBGCells();
			this.drawDashedCenterLines();
			this.drawLines();

			this.drawPekes();

			this.drawCircledNumbers();

			this.drawTarget();
		},

		repaintParts: function (blist) {
			this.range.cells = blist.cellinside() as any;

			this.drawCircledNumbers();
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
		}
	},
	//---------------------------------------------------------
	FileIO: {
		disptype: "def", // 磁石:mag, 交差:cross
		decodeData: function () {
			this.readLine();

			this.decodeCellQnum();
			this.decodeBorderLine();
		},
		encodeData: function () {
			this.writeLine(this.disptype);

			this.encodeCellQnum();
			this.encodeBorderLine();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkLineExist+",
			"checkBranchConnectLine",
			"checkCrossConnectLine",
			"checkCurveCount",
			"checkConnectAllNumber",
			"checkLineShapeDeadend",

			"checkOutgoingLine",
			"checkNoLineObject"
		],

		checkOutgoingLine: function () {
			this.checkAllCell(function (cell) { return (cell.isValidNum() && cell.qnum !== cell.lcnt); }, "nmLineNe");
		},

		checkConnectSameNum: function () {
			this.checkLineShape(function (path) { return path.cells[0].qnum !== -2 && path.cells[0].qnum === path.cells[1].qnum; }, "lcSameNum");
		},
		checkCurveCount: function () {
			this.checkLineShape(function (path) { return !path.cells[1].isnull && path.ccnt > 1; }, "lcCurveGt1");
		}
	},

	FailCode: {
		nmNoLine: ["○から線が出ていません。", "A circle doesn't start any line."],
		nmLineNe: ["○から出る線の本数が正しくありません。", "The number is not equal to the number of lines out of the circle."],
		lcSameNum: ["同じ数字同士が線で繋がっています。", "Same numbers are connected each other."],
		lcCurveGt1: ["線が2回以上曲がっています。", "The number of curves is twice or more."]
	}
});

export class Ichimagam extends Ichimaga {
	constructor(config?: IConfig) {
		super(config);
		this.pid = "ichimagam"

		//@ts-ignore
		this.fio.disptype = "mag"; // 磁石イチマガ
		this.checker.checklist = [
			"checkLineExist+",
			"checkBranchConnectLine",
			"checkCrossConnectLine",
			"checkConnectSameNum",
			"checkCurveCount",
			"checkConnectAllNumber",
			"checkLineShapeDeadend",

			"checkOutgoingLine",
			"checkNoLineObject"
		]
		this.checker.makeCheckList()
	}
}

export class Ichimagax extends Ichimaga {
	constructor(config?: IConfig) {
		super(config);
		this.pid = "ichimagax"
		//@ts-ignore
		this.fio.disptype = "cross"; // 磁石イチマガ
		this.checker.checklist = [
			"checkLineExist+",
			"checkBranchConnectLine",
			"checkCurveCount",
			"checkConnectAllNumber",
			"checkLineShapeDeadend",

			"checkOutgoingLine",
			"checkNoLineObject"
		]
		this.checker.makeCheckList()
	}
}