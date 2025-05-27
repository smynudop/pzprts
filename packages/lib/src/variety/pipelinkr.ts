//
// パズル固有スクリプト部 パイプリンク・帰ってきたパイプリンク・環状線スペシャル版 pipelink.js

import { URL_PZPRV3 } from "../pzpr/constants";
import { createVariety } from "./createVariety";

//
export const Pipelinkr = createVariety({
	pid: "pipelinkr",

	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['quesmark', 'quesmark-', 'ice', 'info-line'], play: ['line', 'peke', 'info-line'] },
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
			this.inputQues([0, 11, 12, 13, 14, 15, 16, 17, -2]);
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

		circleratio: [0.42, 0.37],

		minYdeg: 0.42,

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();
			this.drawBorders();

			this.drawCircles();
			this.drawHatenas();

			this.drawLines();

			this.drawPekes();

			this.drawLineParts();

			this.drawChassis();

			this.drawTarget();
		},

		repaintParts: function (blist) {
			this.range.cells = blist.cellinside() as any;

			this.drawLineParts();
		},
		getBGCellColor: function (cell) {
			if (cell.error === 1) { return this.errbcolor1; }
			else if (cell.ques === 6 && this.puzzle.getConfig('disptype_pipelinkr') === 2) { return this.icecolor; }
			return null;
		},
		getBorderColor: function (border) {
			if (this.puzzle.getConfig('disptype_pipelinkr') === 2) {
				const cell1 = border.sidecell[0], cell2 = border.sidecell[1];
				if (!cell1.isnull && !cell2.isnull && (cell1.ice() !== cell2.ice())) {
					return this.quescolor;
				}
			}
			return null;
		},

		getCircleStrokeColor: function (cell) {
			if ((this.puzzle.getConfig('disptype_pipelinkr') === 1) && cell.ques === 6) {
				return this.quescolor;
			}
			return null;
		},
		circlefillcolor_func: "null"
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodePipelink();

			this.puzzle.setConfig('disptype_pipelinkr', (!this.checkpflag('i') ? 1 : 2));
		},
		encodePzpr: function (type) {
			this.encodePipelink(type);

			this.outpflag = ((this.puzzle.getConfig('disptype_pipelinkr') === 2) ? "i" : null);
		},

		decodePipelink: function () {
			let c = 0, bstr = this.outbstr, bd = this.board;
			let i: number
			for (i = 0; i < bstr.length; i++) {
				const ca = bstr.charAt(i);

				if (ca === '.') { bd.cell[c].ques = -2; }
				else if (ca >= '0' && ca <= '9') {
					for (let n = 0, max = Number.parseInt(ca, 10) + 1; n < max; n++) {
						if (!!bd.cell[c]) { bd.cell[c].ques = 6; c++; }
					}
					c--;
				}
				else if (ca >= 'a' && ca <= 'g') { bd.cell[c].ques = Number.parseInt(ca, 36) + 1; }
				else if (ca >= 'h' && ca <= 'z') { c += (Number.parseInt(ca, 36) - 17); }

				c++;
				if (!bd.cell[c]) { break; }
			}

			this.outbstr = bstr.substr(i);
		},
		encodePipelink: function (type: number) {
			let count: number, cm = "", bd = this.board;

			count = 0;
			for (let c = 0; c < bd.cell.length; c++) {
				let pstr = "", qu = bd.cell[c].ques;

				if (qu === -2) { pstr = "."; }
				else if (qu === 6) {
					if (type === URL_PZPRV3) {
						let n: number
						for (n = 1; n < 10; n++) {
							if (!bd.cell[c + n] || bd.cell[c + n].ques !== 6) { break; }
						}
						pstr = (n - 1).toString(10); c = (c + n - 1);
					}
				}
				else if (qu >= 11 && qu <= 17) { pstr = (qu - 1).toString(36); }
				else { count++; }

				if (count === 0) { cm += pstr; }
				else if (pstr || count === 19) { cm += ((16 + count).toString(36) + pstr); count = 0; }
			}
			if (count > 0) { cm += (16 + count).toString(36); }

			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeDispType();
			this.decodePipelink();
			this.decodeBorderLine();
		},
		encodeData: function () {
			this.encodeDispType();
			this.encodePipelink();
			this.encodeBorderLine();
		},

		decodeDispType: function () {
			const disptype = this.readLine();
			this.puzzle.setConfig('disptype_pipelinkr', (disptype === "circle" ? 1 : 2));
		},
		encodeDispType: function () {
			let puzzle = this.puzzle, disptype = 'pipe';
			disptype = (puzzle.getConfig('disptype_pipelinkr') === 1 ? "circle" : "ice");
			this.writeLine(disptype);
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
			"checkCrossOutOfMark",
			"checkIceLines",

			"checkOneLoop",

			"checkNotCrossOnMark",
			"checkNoLine+",
			"checkDeadendLine++"
		],
		checkCrossOutOfMark: function () {
			this.checkAllCell(function (cell) { return (cell.lcnt === 4 && cell.ques !== 6 && cell.ques !== 11); }, "lnCrossExIce");
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

/*
	"CheckInfo@pipelinkr": {
		text: function (lang) {
			var puzzle = this.puzzle, texts = [];
			var langcode = ((lang || this.puzzle.pzpr.lang) === "ja" ? 0 : 1);
			var isdispice = (puzzle.getConfig('disptype_pipelinkr') === 2);
			if (this.length === 0) { return puzzle.faillist.complete[langcode]; }
			for (var i = 0; i < this.length; i++) {
				var code = this[i];
				if (!isdispice) {
					if (code === "lnCrossExIce") { code = "lnCrossExCir"; }
					else if (code === "lnCurveOnIce") { code = "lnCurveOnCir"; }
				}
				texts.push(puzzle.faillist[code][langcode]);
			}
			return texts.join("\n");
		}
	},
	*/
