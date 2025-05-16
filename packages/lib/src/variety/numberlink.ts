//
// パズル固有スクリプト部 ナンバーリンク、アルコネ版 numlin.js

import type { Cell } from "../puzzle/Piece";
import { createVariety } from "./createVariety";

//
export const Numberlink = createVariety({
	pid: "numlin",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['number', 'clear', 'info-line'], play: ['line', 'peke', 'info-line'] },
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
	Board: {
		hasborder: 1
	},
	LineGraph: {
		enabled: true,
		makeClist: true
	},
	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "LIGHT",

		numbercolor_func: "qnum",

		irowake: true,

		paint: function () {
			this.drawBGCells();
			this.drawGrid();

			this.drawPekes();
			this.drawLines();

			this.drawCellSquare();
			this.drawQuesNumbers();

			this.drawChassis();

			this.drawTarget();
		},

		drawCellSquare: function () {
			const g = this.vinc('cell_number_base', 'crispEdges', true);

			const rw = this.bw * (0.5) - 1;
			const rh = this.bh * (0.5) - 1;

			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				g.vid = `c_sq_${cell.id}`;
				if (cell.qnum !== -1) {
					g.fillStyle = (cell.error === 1 ? this.errbcolor1 : this.bgcolor);
					g.fillRectCenter(cell.bx * this.bw, cell.by * this.bh, rw, rh);
				}
				else { g.vhide(); }
			}
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	"Encode": {
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
			this.decodeBorderLine();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeBorderLine();
		},
	},


	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkLineExist+",
			"checkBranchLine",
			"checkCrossLine",
			"checkTripleObject",
			"checkLinkSameNumber",
			"checkLineOverLetter",
			"checkDeadendConnectLine+",
			"checkDisconnectLine",
			"checkNoLineObject+",
			//"checkNoLine_arukone+@arukone"
		],

		checkLinkSameNumber: function () {
			this.checkSameObjectInRoom(this.board.linegraph, function (cell: Cell) { return cell.qnum; }, "nmConnDiff");
		},
		// checkNoLine_arukone: function () {
		// 	if (this.puzzle.getConfig('passallcell')) { this.checkNoLine(); }
		// }
	},

	FailCode: {
		nmConnDiff: ["異なる数字がつながっています。", "Different numbers are connected."]
	}
});
