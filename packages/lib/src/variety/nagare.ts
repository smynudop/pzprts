//
// パズル固有スクリプト部 流れるループ版 nagare.js

import { Board } from "../puzzle/Board";
import type { GraphComponent } from "../puzzle/GraphBase";
import { MouseEvent1 } from "../puzzle/MouseInput";
import type { Border, Cell, IDir } from "../puzzle/Piece";
import { BorderList, CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Nagare = createVariety({
	pid: "nagare",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['shade', 'arrow', 'info-line'], play: ['line', 'peke', 'diraux', 'info-line'] },
		mouseinput: function () { // オーバーライド
			if (this.inputMode === 'shade') { if (this.mousestart) { this.inputShadeCell(); } }
			else { MouseEvent1.prototype.mouseinput.call(this); }
		},
		mouseinput_other: function () {
			if (this.inputMode === 'diraux') {
				if (this.mousestart || this.mousemove) { this.inputmark_mousemove(); }
				else if (this.mouseend && this.notInputted()) { this.clickmark(); }
			}
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode && this.btn === 'right') {
				if (this.mousestart) { this.inputmark_mousedown(); }
				else if (this.inputData === 2 || this.inputData === 3) { this.inputpeke(); }
				else if (this.mousemove) { this.inputmark_mousemove(); }
			}
			else if (this.puzzle.playmode && this.btn === 'left') {
				if (this.mousestart || this.mousemove) { this.inputLine(); }
				else if (this.mouseend && this.notInputted()) { this.clickmark(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) { this.inputarrow_cell(); }
				else if (this.mouseend && this.notInputted()) { this.inputShadeCell(); }
			}
		},

		clickmark: function () {
			const pos = this.getpos(0.22);
			if (this.prevPos.equals(pos)) { return; }

			const border = pos.getb();
			if (border.isnull) { return; }

			let trans: Record<number, number> = { 0: 2, 2: 0 }, qs = border.qsub;
			if (!border.isvert) { trans = (this.btn === 'left' ? { 0: 2, 2: 11, 11: 12, 12: 0 } : { 0: 12, 12: 11, 11: 2, 2: 0 }); }
			else { trans = (this.btn === 'left' ? { 0: 2, 2: 13, 13: 14, 14: 0 } : { 0: 14, 14: 13, 13: 2, 2: 0 }); }
			qs = trans[qs] || 0;
			if (this.inputMode === 'diraux' && qs === 2) { qs = trans[qs] || 0; }

			border.setQsub(qs);
			border.draw();
		},
		inputmark_mousedown: function () {
			const pos = this.getpos(0.22), border = pos.getb();
			if (!border.isnull) {
				this.inputData = ((border.isnull || border.qsub !== 2) ? 2 : 3);
				this.inputpeke();
			}
		},
		inputmark_mousemove: function () {
			const pos = this.getpos(0);
			if (pos.getc().isnull) { return; }

			const border = this.prevPos.getnb(pos);
			if (!border.isnull) {
				let newval = null, dir = this.prevPos.getdir(pos, 2);
				if (this.inputData === null) { this.inputData = (border.qsub !== (10 + dir) ? 11 : 0); }
				if (this.inputData === 11) { newval = 10 + dir; }
				else if (this.inputData === 0 && border.qsub === 10 + dir) { newval = 0; }
				if (newval !== null) {
					border.setQsub(newval);
					border.draw();
				}
			}
			this.prevPos = pos;
		},

		// オーバーライド
		inputarrow_cell_main: function (cell, dir) {
			cell.setQdir(cell.qdir !== dir ? dir : 0);
		},
		inputShadeCell: function () {
			const cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell) { return; }

			if (cell !== this.cursor.getc() && this.puzzle.getConfig('cursor') && this.inputMode === 'auto') {
				this.setcursor(cell);
			}
			else {
				cell.setQues(cell.ques === 1 ? 0 : 1);
				cell.drawaround();
			}
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		moveTarget: function (ca): boolean {
			if (ca.match(/shift/)) { return false; }
			return this.moveTCell(ca);
		},

		keyinput: function (ca) {
			if (this.key_inputarrow(ca)) { return; }
			this.key_inputques_nagare(ca);
		},
		key_inputques_nagare: function (ca: string) {
			if (ca === 'q' || ca === 'w') {
				const cell = this.cursor.getc();
				cell.setQues(cell.ques !== 1 ? 1 : 0);
				cell.drawaround();
			}
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		windbase: 0, /* このセルから風が吹いているか(1,2,4,8) or 風をガードしているか(16) */
		wind: 0, /* セルに風が吹いているかどうか判定するためのパラメータ (qdir値とは別) */
		/* 0-15:2進数の4桁がそれぞれ風の吹いてくる向きを表す 4方向から風が吹くと15 */

		// 線を引かせたくないので上書き
		noLP: function (dir): boolean { return this.ques === 1; },

		posthook: {
			ques: function (num) { this.setWindAround(); },
			qdir: function (num) { this.setWindAround(); }
		},

		initWind: function () {
			this.wind = 0;
			if (this.ques === 1) { return; }
			let cell2: Cell, bd = this.board, d = new ViewRange(this.board, this.bx, this.by, function (cell: Cell) { return cell.ques !== 0; });
			cell2 = bd.getc(d.x0, d.y2 + 2); if (cell2.ques === 1 && cell2.qdir === cell2.UP) { this.wind |= 1; }
			cell2 = bd.getc(d.x0, d.y1 - 2); if (cell2.ques === 1 && cell2.qdir === cell2.DN) { this.wind |= 2; }
			cell2 = bd.getc(d.x2 + 2, d.y0); if (cell2.ques === 1 && cell2.qdir === cell2.LT) { this.wind |= 4; }
			cell2 = bd.getc(d.x1 - 2, d.y0); if (cell2.ques === 1 && cell2.qdir === cell2.RT) { this.wind |= 8; }
		},

		calcWindBase: function () {
			const old = this.windbase;
			this.windbase = 0;
			if (this.ques === 1) { this.windbase |= 16 | [0, 1, 2, 4, 8][this.qdir]; }
			return old ^ this.windbase;
		},
		setWindAround: function () {
			if (this.calcWindBase() === 0) { return; }
			this.initWind();

			const d = new ViewRange(this.board, this.bx, this.by, function (cell) { return cell.ques !== 0; });
			for (let n = 0; n < 4; n++) {
				const dir = n + 1 as IDir;
				const clist = d.getdirclist(dir);
				const blist = d.getdirblist(dir);
				const wind = (1 << n), wind1 = (((this.windbase & (16 | wind)) === (16 | wind)) ? wind : 0);
				//@ts-ignore
				for (let i = 0; i < clist.length; i++) { clist[i].wind = clist[i].wind & (~wind) | wind1; }
				//@ts-ignore
				for (let i = 0; i < blist.length; i++) { blist[i].wind = blist[i].wind & (~wind) | wind1; }
			}
		}
	},


	Border: {
		wind: 0, /* 逆に進んでいないか判定するためのパラメータ (qdir値とは別) */
		/* 0:風なし 1:下から上へ 2:上から下へ 3:上下両方 4:右から左へ 8:左から右へ 12:左右両方 */

		enableLineNG: true,

		setLine: function (id) { this.setLineVal(1); if (this.qsub === 2) { this.setQsub(0); } },
		removeLine: function (id) { this.setLineVal(0); if (this.qsub === 2) { this.setQsub(0); } }
	},
	Board: {
		hasborder: 1,

		rebuildInfo: function () {
			this.initWind();
			Board.prototype.rebuildInfo.call(this);
		},

		initWind: function () {
			for (let i = 0; i < this.border.length; i++) { this.border[i].wind = 0; }
			for (let c = 0; c < this.cell.length; c++) {
				const cell = this.cell[c];
				cell.wind = 0;
				cell.windbase = 0;
			}
			for (let c = 0; c < this.cell.length; c++) {
				const cell = this.cell[c];
				if (cell.ques === 1 && cell.qdir !== 0) { cell.setWindAround(); }
			}
		}
	},

	LineGraph: {
		enabled: true
	},

	BoardExec: {
		adjustBoardData: function (key, d) {
			this.adjustCellArrow(key, d);

			if (key & this.TURNFLIP) {
				const trans = this.getTranslateDir(key);
				const blist = this.board.borderinside(d.x1, d.y1, d.x2, d.y2);
				for (let i = 0; i < blist.length; i++) {
					let border = blist[i], val: number;
					val = trans[border.qsub - 10]; if (!!val) { border.setQsub(val + 10); }
				}
			}
		}
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		irowake: true,

		gridcolor_type: "LIGHT",

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();
			this.drawQuesCells();

			this.drawCellArrows();

			this.drawLines();
			this.drawPekes();
			this.drawBorderAuxDir();

			this.drawChassis();

			this.drawTarget();
		},
		getCellArrowColor: function (cell): string {
			return (cell.ques === 0 ? this.quescolor : "white");
		},
		getAllowParameter: function (): any {
			return {
				al: this.cw * 0.35,		// ArrowLength
				aw: this.cw * 0.12,		// ArrowWidth
				tl: 0,					// 矢じりの長さの座標(中心-長さ)
				tw: this.cw * 0.35		// 矢じりの幅
			}
		},
		drawBorderAuxDir: function () {
			const g = this.vinc('border_dirsub', 'crispEdges');
			const ssize = this.cw * 0.10;

			g.lineWidth = this.cw * 0.1;

			const blist = this.range.borders;
			for (let i = 0; i < blist.length; i++) {
				const border = blist[i], px = border.bx * this.bw, py = border.by * this.bh, dir = border.qsub - 10;

				// 向き補助記号の描画
				g.vid = "b_daux_" + border.id;
				if (dir >= 1 && dir <= 8) {
					g.strokeStyle = (!border.trial ? "rgb(64,64,64)" : this.trialcolor);
					g.beginPath();
					switch (dir) {
						case border.UP: g.setOffsetLinePath(px, py, -ssize * 2, +ssize, 0, -ssize, +ssize * 2, +ssize, false); break;
						case border.DN: g.setOffsetLinePath(px, py, -ssize * 2, -ssize, 0, +ssize, +ssize * 2, -ssize, false); break;
						case border.LT: g.setOffsetLinePath(px, py, +ssize, -ssize * 2, -ssize, 0, +ssize, +ssize * 2, false); break;
						case border.RT: g.setOffsetLinePath(px, py, -ssize, -ssize * 2, +ssize, 0, -ssize, +ssize * 2, false); break;
					}
					g.stroke();
				}
				else { g.vhide(); }
			}
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeNagare();
		},
		encodePzpr: function (type) {
			this.encodeNagare();
		},

		decodeNagare: function () {
			let c = 0, i = 0, bstr = this.outbstr, bd = this.board;
			for (i = 0; i < bstr.length; i++) {
				const cell = bd.cell[c], ca = bstr.charAt(i);

				if (this.include(ca, "1", "9")) {
					const val = Number.parseInt(ca, 10);
					cell.ques = (val / 5) | 0;
					cell.qdir = val % 5;
				}
				else if (this.include(ca, "a", "z")) { c += (Number.parseInt(ca, 36) - 10); }

				c++;
				if (!bd.cell[c]) { break; }
			}
			this.outbstr = bstr.substr(i + 1);
		},
		encodeNagare: function () {
			let cm = "", count = 0, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				let pstr = "", cell = bd.cell[c], qu = cell.ques, dir = cell.qdir;

				if (qu === 1 || (dir >= 1 && dir <= 4)) { pstr = (qu * 5 + dir).toString(10); }
				else { count++; }

				if (count === 0) { cm += pstr; }
				else if (pstr || count === 26) { cm += ((9 + count).toString(36) + pstr); count = 0; }
			}
			if (count > 0) { cm += (9 + count).toString(36); }

			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCell(function (cell, ca) {
				if (ca !== ".") {
					const val = { u: 1, d: 2, l: 3, r: 4, N: 5, U: 6, D: 7, L: 8, R: 9 }[ca] as number;
					cell.ques = (val / 5) | 0;
					cell.qdir = val % 5;
				}
			});
			this.decodeBorder(function (border, ca) {
				const lca = ca.charAt(ca.length - 1);
				if (lca >= "a" && lca <= "z") {
					if (lca === "u") { border.qsub = 11; }
					else if (lca === "d") { border.qsub = 12; }
					else if (lca === "l") { border.qsub = 13; }
					else if (lca === "r") { border.qsub = 14; }
					ca = ca.substr(0, ca.length - 1);
				}

				if (ca !== "" && ca !== "0") {
					if (ca.charAt(0) === "-") { border.line = (-ca) - 1; border.qsub = 2; }
					else { border.line = +ca; }
				}
			});
		},
		encodeData: function () {
			this.encodeCell(function (cell) {
				if (cell.ques === 1 || (cell.qdir >= 1 && cell.qdir <= 4)) {
					const val = cell.ques * 5 + cell.qdir;
					return ["u ", "d ", "l ", "r ", "N ", "U ", "D ", "L ", "R "][val - 1];
				}
				else { return ". "; }
			});
			this.encodeBorder(function (border) {
				let ca = "";
				if (border.qsub === 2) { ca += "" + (-1 - border.line); }
				else if (border.line > 0) { ca += "" + border.line; }

				if (border.qsub >= 11) { ca += ["u", "d", "l", "r"][border.qsub - 11]; }

				return (ca !== "" ? ca + " " : "0 ");
			});
		}
	},
	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkLineExist+",
			"checkArrowAgainst", // 問題確認用
			"checkLineOnShadeCell",
			"checkCrossLine+",
			"checkBranchLine+",
			"checkAcrossArrow",
			"checkLineArrowDirection",
			"checkLineWindDirection",
			"checkAcrossWind",
			"checkAllArrow",
			"checkDeadendLine++",
			"checkOneLoop"
		],
		_info: {} as { num?: any, trace?: { clist: CellList, blist: BorderList }[] },

		checkArrowAgainst: function () {
			const boardcell = this.board.cell;
			for (let i = 0; i < boardcell.length; i++) {
				const cell = boardcell[i], arwind = (cell.wind & (15 ^ [0, 1, 2, 4, 8][cell.qdir]));
				if (cell.qdir === 0 || cell.ques === 1 || !arwind) { continue; }

				this.failcode.add("arAgainstWind");
				if (this.checkOnly) { break; }
				this.setCellErrorToWindBase(cell, arwind);
			}
		},
		checkAcrossWind: function () {
			const boardcell = this.board.cell;
			for (let i = 0; i < boardcell.length; i++) {
				const cell = boardcell[i];
				const errv = ((cell.wind & 3) !== 0 && cell.isLineStraight() === 2);
				const errh = ((cell.wind & 12) !== 0 && cell.isLineStraight() === 1);
				if (!errv && !errh) { continue; }

				this.failcode.add("lrAcrossWind");
				if (this.checkOnly) { break; }
				this.setCellErrorToWindBase(cell, (cell.wind & ((errv ? 3 : 0) | (errh ? 12 : 0))));
			}
		},
		checkAcrossArrow: function () {
			this.checkAllCell(function (cell) {
				const adb = cell.adjborder;
				return ((cell.qdir === 1 || cell.qdir === 2) && (adb.left.isLine() || adb.right.isLine())) ||
					((cell.qdir === 3 || cell.qdir === 4) && (adb.top.isLine() || adb.bottom.isLine()));
			}, "lrAcrossArrow");
		},
		checkAllArrow: function () {
			this.checkAllCell(function (cell) { return (cell.ques === 0 && cell.qdir > 0 && cell.lcnt === 0); }, "arNoLine");
		},

		checkLineWindDirection: function () {
			const traces = this.getTraceInfo();
			for (let i = 0; i < traces.length; i++) {
				const blist = traces[i].blist;
				if (blist.length === 0) { continue; }

				this.failcode.add("lrAgainstWind");
				if (this.checkOnly) { break; }

				this.board.border.setnoerr();
				for (let j = 0; j < blist.length; j++) {
					//@ts-ignore
					this.setBorderErrorToWindBase(blist[j], blist[j].wind);
				}
			}
		},
		checkLineArrowDirection: function () {
			const traces = this.getTraceInfo();
			for (let i = 0; i < traces.length; i++) {
				const clist = traces[i].clist;
				if (clist.length === 0) { continue; }

				this.failcode.add("lrAgainstArrow");
				if (this.checkOnly) { break; }
				clist.seterr(1);
			}
		},

		setCellErrorToWindBase: function (cell: Cell, wind: number) {
			let cell2: Cell;
			cell.seterr(1);
			if (wind & 1) { cell2 = cell; while (!cell2.isnull) { if (cell2.ques === 1) { cell2.seterr(1); break; } cell2 = cell2.adjacent.bottom; } }
			if (wind & 2) { cell2 = cell; while (!cell2.isnull) { if (cell2.ques === 1) { cell2.seterr(1); break; } cell2 = cell2.adjacent.top; } }
			if (wind & 4) { cell2 = cell; while (!cell2.isnull) { if (cell2.ques === 1) { cell2.seterr(1); break; } cell2 = cell2.adjacent.right; } }
			if (wind & 8) { cell2 = cell; while (!cell2.isnull) { if (cell2.ques === 1) { cell2.seterr(1); break; } cell2 = cell2.adjacent.left; } }
		},
		setBorderErrorToWindBase: function (border: Border, wind: number) {
			let cell2: Cell;
			border.seterr(1);
			if (wind & 1) { cell2 = border.sidecell[1]; while (!cell2.isnull) { if (cell2.ques === 1) { cell2.seterr(1); break; } cell2 = cell2.adjacent.bottom; } }
			if (wind & 2) { cell2 = border.sidecell[0]; while (!cell2.isnull) { if (cell2.ques === 1) { cell2.seterr(1); break; } cell2 = cell2.adjacent.top; } }
			if (wind & 4) { cell2 = border.sidecell[1]; while (!cell2.isnull) { if (cell2.ques === 1) { cell2.seterr(1); break; } cell2 = cell2.adjacent.right; } }
			if (wind & 8) { cell2 = border.sidecell[0]; while (!cell2.isnull) { if (cell2.ques === 1) { cell2.seterr(1); break; } cell2 = cell2.adjacent.left; } }
		},

		getTraceInfo: function () {
			if (this._info.trace) { return this._info.trace; }
			const traces = [];
			for (let i = 0; i < this.board.linegraph.components.length; i++) {
				traces.push(this.searchTraceInfo(this.board.linegraph.components[i]));
			}
			this._info.trace = traces
			return traces;
		},
		searchTraceInfo: function (path: GraphComponent): { blist: BorderList, clist: CellList } {
			const blist = new BorderList(path.getedgeobjs());
			const clist_sub = blist.cellinside().filter(function (cell) { return cell.lcnt !== 2; });
			const startcell = (clist_sub.length === 0 ? blist[0].sideobj[0] : clist_sub[0]);
			let dir = startcell.getdir(startcell.pathnodes[0].nodes[0].obj, 2);
			const pos = startcell.getaddr();

			const clist1 = [], clist2 = [], blist1 = [], blist2 = [];
			const info = {
				clist: (new CellList()),   // 矢印に反して進んだセル
				blist: (new BorderList())  // 風に反して進んだLine
			};
			let step = 0;

			while (1) {
				if (pos.oncell()) {
					const cell = pos.getc();

					if (step > 0 && cell === startcell) { break; } // 一周して戻ってきた

					if (cell.qdir !== cell.NDIR) {
						if (cell.qdir === dir) { clist1.push(cell); }
						else { clist2.push(cell); }
					}

					const adb = cell.adjborder;
					if (step > 0 && cell.lcnt !== 2) { break; }
					else if (dir !== 1 && adb.bottom.isLine()) { dir = 2; }
					else if (dir !== 2 && adb.top.isLine()) { dir = 1; }
					else if (dir !== 3 && adb.right.isLine()) { dir = 4; }
					else if (dir !== 4 && adb.left.isLine()) { dir = 3; }
				}
				else {
					const border = pos.getb();
					if (!border.isLine()) { break; } // 途切れてたら終了

					if (border.wind !== 0) {
						if (border.wind & [0, 1, 2, 4, 8][dir]) { blist1.push(border); }
						if (border.wind & [0, 2, 1, 8, 4][dir]) { blist2.push(border); }
					}
				}

				pos.movedir(dir, 1);
				step++;
			}

			/* 矢印に反した数が少ない方を優先して出力する */
			let choice = 1;
			if (clist1.length < clist2.length) { choice = 1; }
			else if (clist1.length > clist2.length) { choice = 2; }
			/* 矢印が同じ場合、風に反した数が少ない方を優先して出力 */
			else {
				choice = (blist1.length < blist2.length ? 1 : 2);
			}
			info.clist.extend(choice === 1 ? clist1 : clist2);
			info.blist.extend(choice === 1 ? blist1 : blist2);

			return info;
		}
	},

	FailCode: {
		arNoLine: ["線が通っていない矢印があります。", "A line doesn't go through some arrows."],
		arAgainstWind: ["矢印の向きが風の指示と合っていません。", "The direction of the arrow is against the wind."],
		lrAcrossWind: ["線が風で流されずに横切っています。", "The line passes across the wind."],
		lrAcrossArrow: ["線が矢印を横切っています。", "The line passes across an arrow."],
		lrAgainstWind: ["線が風上に向かって進んでいます。", "The line passes against the wind."],
		lrAgainstArrow: ["線が矢印に反して進んでいます。", "The line passes against an arrow."]
	}
});






class Range {
	board: Board
	x1 = -1
	y1 = -1
	x2 = -1
	y2 = -1

	constructor(board: Board) {
		this.board = board
	}
}

class RectRange extends Range {
	cellinside() {
		return this.board.cellinside(this.x1, this.y1, this.x2, this.y2);
	}
	borderinside() {
		return this.board.borderinside(this.x1, this.y1, this.x2, this.y2);
	}
}
class ViewRange extends Range {
	x0: number
	y0: number
	constructor(board: Board, bx: number, by: number, func: (cell: Cell) => boolean) {
		super(board)
		this.x0 = bx;
		this.y0 = by;
		if (!!func) { this.search(func); }
	}
	search(func: (cell: Cell) => boolean) {
		let cell0 = this.board.getc(this.x0, this.y0), cell: Cell, cell2: Cell, adc = cell0.adjacent;
		cell = cell0; cell2 = adc.left; while (!cell2.isnull && !func(cell2)) { cell = cell2; cell2 = cell.adjacent.left; } this.x1 = cell.bx;
		cell = cell0; cell2 = adc.right; while (!cell2.isnull && !func(cell2)) { cell = cell2; cell2 = cell.adjacent.right; } this.x2 = cell.bx;
		cell = cell0; cell2 = adc.top; while (!cell2.isnull && !func(cell2)) { cell = cell2; cell2 = cell.adjacent.top; } this.y1 = cell.by;
		cell = cell0; cell2 = adc.bottom; while (!cell2.isnull && !func(cell2)) { cell = cell2; cell2 = cell.adjacent.bottom; } this.y2 = cell.by;
	}

	getdirclist(dir: IDir) {
		return this.getdirrange(dir).cellinside();
	}
	getdirblist(dir: IDir) {
		return this.getdirrange(dir).borderinside();
	}
	getdirrange(dir: IDir) {
		const range = new RectRange(this.board);
		if (dir === 1) {
			range.x1 = range.x2 = this.x0;
			range.y1 = this.y1;
			range.y2 = this.y0 - 2;
		}
		else if (dir === 2) {
			range.x1 = range.x2 = this.x0;
			range.y1 = this.y0 + 2;
			range.y2 = this.y2;
		}
		else if (dir === 3) {
			range.x1 = this.x1;
			range.x2 = this.x0 - 2;
			range.y1 = range.y2 = this.y0;
		}
		else if (dir === 4) {
			range.x1 = this.x0 + 2;
			range.x2 = this.x2;
			range.y1 = range.y2 = this.y0;
		}
		return range;
	}
}
