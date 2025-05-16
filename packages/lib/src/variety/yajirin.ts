//
// パズル固有スクリプト部 ヤジリン版 yajirin.js

import { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety"

// 
export const Yajilin = createVariety({
	pid: "yajirin",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		RBShadeCell: true,
		use: true,
		inputModes: { edit: ['number', 'direc', 'clear', 'info-line'], play: ['line', 'peke', 'shade', 'unshade', 'info-line'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === 'left') { this.inputLine(); }
					else if (this.btn === 'right') { this.inputcell(); }
				}
				else if (this.mouseend && this.notInputted()) { this.inputcell(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) { this.inputdirec(); }
				else if (this.mouseend && this.notInputted()) { this.inputqnum(); }
			}
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		moveTarget: function (ca) {
			if (ca.match(/shift/)) { return false; }
			return this.moveTCell(ca);
		},

		keyinput: function (ca) {
			if (this.key_inputdirec(ca)) { return; }
			this.key_inputqnum(ca);
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		minnum: 0,

		numberRemainsUnshaded: true,

		// 線を引かせたくないので上書き
		noLP: function (dir) { return (this.isShade() || this.isNum()); }
	},
	Border: {
		enableLineNG: true,

		isBorder: function () {
			return (this.sidecell[0].qnum === -1) !== (this.sidecell[1].qnum === -1);
		}
	},
	Board: {
		hasborder: 1
	},
	BoardExec: {
		adjustBoardData: function (key: number, d: any) {
			this.adjustNumberArrow(key, d);
		}
	},

	LineGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		irowake: true,

		numbercolor_func: "qnum",

		paint: function () {
			this.drawBGCells();
			this.drawDotCells();
			this.drawGrid();

			this.drawBorders();

			this.drawArrowNumbers();

			this.drawLines();
			this.drawPekes();

			this.drawChassis();

			this.drawTarget();
		},

		getBGCellColor: function (cell) {
			const info = cell.error || cell.qinfo;
			if (this.puzzle.getConfig('disptype_yajilin') === 2 && cell.qnum !== -1) { return 'rgb(224,224,224)'; }
			if (cell.qans === 1) {
				if (info === 1) { return this.errcolor1; }
				if (cell.trial) { return this.trialcolor; }
				return this.shadecolor;
			}
			if (info === 1) { return this.errbcolor1; }
			return null;
		},
		getBorderColor: function (border) {
			if (this.puzzle.getConfig('disptype_yajilin') === 2 && border.isBorder()) { return this.quescolor; }
			return null;
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeArrowNumber16();

			this.puzzle.setConfig('disptype_yajilin', (!this.checkpflag('b') ? 1 : 2));
		},
		encodePzpr: function (type) {
			this.encodeArrowNumber16();

			this.outpflag = ((this.puzzle.getConfig('disptype_yajilin') === 2) ? "b" : null);
		},

	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellDirecQnum();
			this.decodeCellAns();
			this.decodeBorderLine();
		},
		encodeData: function () {
			this.encodeCellDirecQnum();
			this.encodeCellAns();
			this.encodeBorderLine();
		},
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkBranchLine",
			"checkCrossLine",
			"checkLineOnShadeCell",
			"checkAdjacentShadeCell",
			"checkDeadendLine+",
			"checkArrowNumber",
			"checkOneLoop",
			"checkEmptyCell_yajirin+"
		],

		checkEmptyCell_yajirin: function () {
			this.checkAllCell(function (cell) { return (cell.lcnt === 0 && !cell.isShade() && cell.noNum()); }, "ceEmpty");
		},

		checkArrowNumber: function () {
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (!cell.isValidNum() || cell.qdir === 0 || cell.isShade()) { continue; }
				const pos = cell.getaddr();
				const dir = cell.qdir;
				const clist = new CellList();
				while (1) {
					pos.movedir(dir, 2);
					const cell2 = pos.getc();
					if (cell2.isnull) { break; }
					clist.add(cell2);
				}
				if (cell.qnum === clist.filter(function (cell) { return cell.isShade(); }).length) { continue; }

				this.failcode.add("anShadeNe");
				if (this.checkOnly) { break; }
				cell.seterr(1);
				clist.seterr(1);
			}
		}
	},

	FailCode: {
		ceEmpty: ["黒マスも線も引かれていないマスがあります。", "There is an empty cell."]
	}
});
