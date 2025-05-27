//
// パズル固有スクリプト部 パイプリンク・帰ってきたパイプリンク・環状線スペシャル版 pipelink.js

import { Cell } from "../puzzle/Piece";
import { BorderList, CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Loopsp = createVariety({
	pid: "loopsp",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['quesmark', 'quesmark-', 'number', 'info-line'], play: ['line', 'peke', 'info-line'] }
		,
		mouseinput_other: function () {
			if (this.inputMode.match(/quesmark/)) {
				if (this.mousestart) { this.inputQuesMark(); }
			}
		},
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
				if (this.mousestart) { this.inputQuesMark(); }
			}
		},
		inputQuesMark: function () {
			if (this.pid !== 'loopsp') {
				this.inputQues([0, 11, 12, 13, 14, 15, 16, 17, -2]);
			}
			else { this.inputLoopsp(); }
		},
		inputLoopsp: function () {
			const cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell) { return; }

			if (cell !== this.cursor.getc()) {
				this.setcursor(cell);
			}
			else {
				this.inputcell_loopsp(cell);
			}
			this.mouseCell = cell;
		},
		inputcell_loopsp: function (cell: Cell) {
			let qu = cell.ques, qn = cell.qnum, val: number;
			// -8to-2:IneqMark -1:何もなし 0:丸のみ 1以上:数字
			if (qn !== -1) { val = (qn > 0 ? qn : 0); }
			else if (qu > 0) { val = qu - 19; }
			else { val = -1; }

			let max = cell.getmaxnum(), min = -8;
			if (this.inputMode.match(/number/)) { min = -1; }
			if (this.inputMode.match(/quesmark/)) { max = -1; }

			if (this.btn === 'left') {
				if (min <= val && val < max) { val++; }
				else { val = min; }
			}
			else if (this.btn === 'right') {
				if (min < val && val <= max) { val--; }
				else { val = max; }
			}

			if (val >= 0) { cell.setQues(0); cell.setQnum(val >= 1 ? val : -2); }
			else if (val === -1) { cell.setQues(0); cell.setQnum(-1); }
			else { cell.setQues(val + 19); cell.setQnum(-1); }
			cell.draw();
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,

		keyinput: function (ca) {
			this.key_inputLineParts(ca);
		},
		key_inputLineParts: function (ca: string) {
			const cell = this.cursor.getc();

			if (ca === 'q') { cell.setQues(11); cell.setQnum(-1); }
			else if (ca === 'w') { cell.setQues(12); cell.setQnum(-1); }
			else if (ca === 'e') { cell.setQues(13); cell.setQnum(-1); }
			else if (ca === 'r') { cell.setQues(0); cell.setQnum(-1); }
			else if (ca === ' ') { cell.setQues(0); cell.setQnum(-1); }
			else if (ca === 'a') { cell.setQues(14); cell.setQnum(-1); }
			else if (ca === 's') { cell.setQues(15); cell.setQnum(-1); }
			else if (ca === 'd') { cell.setQues(16); cell.setQnum(-1); }
			else if (ca === 'f') { cell.setQues(17); cell.setQnum(-1); }
			else {
				if (this.pid !== 'loopsp') {
					if (ca === '-') { cell.setQues(cell.ques !== -2 ? -2 : 0); }
					else if (this.pid === 'pipelinkr' && ca === '1') { cell.setQues(6); }
					else { return; }
				}
				else {
					if ((ca >= '0' && ca <= '9') || ca === '-') {
						this.key_inputqnum_main(cell, ca);
						if (cell.qnum !== -1) { cell.setQues(0); }
					}
					else { return; }
				}
			}

			this.prev = cell;
			cell.drawaround();
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		maxnum: function (): number {
			return (this.board.cell.length / 4) | 0;
		},
		prehook: {
			ques: function (num) { this.setCombinedLine(num); return false; }
		},
		setCombinedLine: function () {	// cell.setQuesから呼ばれる
			const bx = this.bx, by = this.by;
			const blist = this.board.borderinside(bx - 1, by - 1, bx + 1, by + 1);
			for (let i = 0; i < blist.length; i++) {
				const border = blist[i];
				if (border.line === 0 && border.isLineEX()) { border.setLineVal(1); }
				// 黒マスが入力されたら線を消すとかやりたい場合、↓のコメントアウトをはずす
				// else if(border.line!==0 && border.isLineNG()){ border.setLineVal(0);}
			}
		}
	},
	Border: {
		enableLineNG: true,

		checkStableLine: function (num) {	// border.setLineから呼ばれる
			return ((num !== 0 && this.isLineNG()) ||
				(num === 0 && this.isLineEX()));
		},
		isLineEX: function () {
			const cell1 = this.sidecell[0], cell2 = this.sidecell[1];
			return this.isVert() ? (cell1.isLP(cell1.RT) && cell2.isLP(cell2.LT)) :
				(cell1.isLP(cell1.DN) && cell2.isLP(cell2.UP));
		}
	},
	Board: {
		hasborder: 1
	},
	BoardExec: {
		adjustBoardData: function (key, d) {
			if (key & this.TURNFLIP) {
				let tques: Record<number, number> = {};
				switch (key) {
					case this.FLIPY: tques = { 14: 17, 15: 16, 16: 15, 17: 14 }; break;
					case this.FLIPX: tques = { 14: 15, 15: 14, 16: 17, 17: 16 }; break;
					case this.TURNR: tques = { 12: 13, 13: 12, 14: 17, 15: 14, 16: 15, 17: 16 }; break;
					case this.TURNL: tques = { 12: 13, 13: 12, 14: 15, 15: 16, 16: 17, 17: 14 }; break;
				}
				const clist = this.board.cellinside(d.x1, d.y1, d.x2, d.y2);
				for (let i = 0; i < clist.length; i++) {
					const cell = clist[i], val = tques[cell.ques];
					if (!!val) { cell.setQues(val); }
				}
			}
		}
	},

	LineGraph: {
		enabled: true,
		isLineCross: true,
		relation: { 'border.line': 'link', 'cell.ques': 'cell' },
		isedgevalidbylinkobj: function (border) { return border.isLine() || border.isLineEX(); },
		modifyOtherInfo: function (cell, relation) {
			const cblist = cell.getdir4cblist();
			for (let i = 0; i < cblist.length; i++) {
				this.setEdgeByLinkObj(cblist[i][1]);
			}
		}
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		hideHatena: true,

		irowake: true,

		gridcolor_type: "LIGHT",

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();



			this.drawLines();

			this.drawCircledNumbers();

			this.drawPekes();

			this.drawLineParts();

			this.drawChassis();

			this.drawTarget();
		},

		repaintParts: function (blist) {
			this.range.cells = blist.cellinside() as any;

			this.drawCircledNumbers();
			this.drawLineParts();
		},
		circleratio: [0.40, 0.35],

		numbercolor_func: "qnum",

		minYdeg: 0.36,
		maxYdeg: 0.74
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeLoopsp();
		},
		encodePzpr: function (type) {
			this.encodeLoopsp();
		},

		decodeLoopsp: function () {
			let c = 0, bstr = this.outbstr, bd = this.board;
			let i: number
			for (i = 0; i < bstr.length; i++) {
				const ca = bstr.charAt(i), cell = bd.cell[c];

				if (ca === '.') { cell.qnum = -2; }
				if (this.include(ca, "0", "9") || this.include(ca, "a", "f")) { cell.qnum = Number.parseInt(ca, 16); }
				else if (ca === '-') { cell.qnum = Number.parseInt(bstr.substr(i + 1, 2), 16); i += 2; }
				else if (ca === '+') { cell.qnum = Number.parseInt(bstr.substr(i + 1, 3), 16); i += 3; }
				else if (ca >= 'g' && ca <= 'm') { cell.ques = Number.parseInt(ca, 36) - 5; }
				else if (ca >= 'n' && ca <= 'z') { c += (Number.parseInt(ca, 36) - 23); }

				c++;
				if (!bd.cell[c]) { break; }
			}

			this.outbstr = bstr.substr(i + 1);
		},
		encodeLoopsp: function () {
			let cm = "", pstr = "", count = 0, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const qn = bd.cell[c].qnum, qu = bd.cell[c].ques;
				if (qn === -2) { pstr = "."; }
				else if (qn >= 0 && qn < 16) { pstr = qn.toString(16); }
				else if (qn >= 16 && qn < 256) { pstr = "-" + qn.toString(16); }
				else if (qn >= 256 && qn < 4096) { pstr = "+" + qn.toString(16); }
				else if (qu >= 11 && qu <= 17) { pstr = (qu + 5).toString(36); }
				else { pstr = ""; count++; }

				if (count === 0) { cm += pstr; }
				else if (pstr || count === 13) { cm += ((22 + count).toString(36) + pstr); count = 0; }
			}
			if (count > 0) { cm += (22 + count).toString(36); }

			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodePipelink();
			this.decodeBorderLine();
		},
		encodeData: function () {
			this.encodePipelink();
			this.encodeBorderLine();
		},
		decodePipelink: function () {
			this.decodeCell(function (cell, ca) {
				if (ca === "o") { cell.ques = 6; }
				else if (ca === "-") { cell.ques = -2; }
				else if (ca >= "a" && ca <= "g") { cell.ques = Number.parseInt(ca, 36) + 1; }
				else if (ca !== ".") { cell.qnum = +ca; }
			});
		},
		encodePipelink: function () {
			this.encodeCell(function (cell) {
				if (cell.ques === 6) { return "o "; }
				else if (cell.ques === -2) { return "- "; }
				else if (cell.ques >= 11 && cell.ques <= 17) { return "" + (cell.ques - 1).toString(36) + " "; }
				else if (cell.qnum !== -1) { return cell.qnum + " "; }
				else { return ". "; }
			});
		}
	},
	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkenableLineParts",

			"checkBranchLine",
			"checkCrossOnNumber",

			"checkLoopNumber",
			"checkNumberLoop",
			"checkNumberInLoop",

			"checkNotCrossOnMark",
			"checkNoLine+",
			"checkDeadendLine++"
		],
		checkCrossOnNumber: function () {
			this.checkAllCell(function (cell) { return (cell.lcnt === 4 && cell.isNum()); }, "lnCrossOnNum");
		},

		checkLoopNumber: function () {
			this.checkAllLoops(function (cells) {
				const sublist = cells.filter(function (cell) { return cell.isValidNum(); });
				let number = null;
				for (let n = 0; n < sublist.length; n++) {
					if (number === null) { number = sublist[n].getNum(); }
					else if (number !== sublist[n].getNum()) {
						sublist.seterr(1);
						return false;
					}
				}
				return true;
			}, "lpPlNum");
		},
		checkNumberLoop: function () {
			const boardcell = this.board.cell;
			this.checkAllLoops(function (cells) {
				const sublist = cells.filter(function (cell) { return cell.isValidNum(); });
				if (sublist.length === 0) { return true; }
				const number = sublist[0].getNum();

				for (let c = 0; c < boardcell.length; c++) {
					const cell = boardcell[c];
					if (cell.getNum() === number && !sublist.includes(cell)) {
						sublist.seterr(1);
						return false;
					}
				}
				return true;
			}, "lpSepNum");
		},
		checkNumberInLoop: function () {
			this.checkAllLoops(function (cells) {
				return (cells.filter(function (cell) { return cell.isNum(); }).length > 0);
			}, "lpNoNum");
		},
		checkAllLoops: function (func: (cells: CellList) => boolean, code: string) {
			let result = true;
			const paths = this.board.linegraph.components;
			for (let r = 0; r < paths.length; r++) {
				const blist = new BorderList(paths[r].getedgeobjs());
				if (func(blist.cellinside())) { continue; }

				result = false;
				if (this.checkOnly) { break; }
				blist.seterr(1);
			}
			if (!result) {
				this.failcode.add(code);
				if (!this.checkOnly) { this.board.border.setnoerr(); }
			}
		}
	},
	FailCode: {
		lnCrossExCir: ["○の部分以外で線が交差しています。", "There is a crossing line out of circles."],
		lnCurveOnCir: ["○の部分で線が曲がっています。", "A line curves on circles."],
		lnCrossOnNum: ["○の部分で線が交差しています。", "The lines are crossed on the number."],
		lpPlNum: ["異なる数字を含んだループがあります。", "A loop has plural kinds of number."],
		lpSepNum: ["同じ数字が異なるループに含まれています。", "A kind of numbers are in differernt loops."],
		lpNoNum: ["○を含んでいないループがあります。", "A loop has no numbers."]
	}
});
