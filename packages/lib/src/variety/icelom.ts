//
// パズル固有スクリプト部 アイスバーン・アイスローム・アイスローム２版 icebarn.js

import { LineGraph } from "../puzzle/LineManager";
import { MouseEvent1 } from "../puzzle/MouseInput";
import type { Border, IDir } from "../puzzle/Piece";
import { BorderList } from "../puzzle/PieceList";
import { IConfig } from "../puzzle/Puzzle";
import { createVariety } from "./createVariety";
import { AreaIcebarnGraph, type IcebarnBorder, InAddress, InOutOperation, OutAddress, type TraceInfo } from "./icebarn";

//
export const Icelom = createVariety({
	pid: "icelom",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['ice', 'arrow', 'number', 'clear', 'info-line'], play: ['line', 'peke', 'diraux', 'info-line'] },

		mouseinput: function () { // オーバーライド
			if (this.inputMode === 'arrow') { this.inputarrow_line(); }
			else { MouseEvent1.prototype.mouseinput.call(this); }
		},
		mouseinput_other: function () {
			if (this.inputMode === 'diraux') {
				if (this.mousestart || this.mousemove) { this.inputmark_mousemove(); }
				else if (this.mouseend && this.notInputted()) { this.clickmark(); }
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
				if (this.mousestart || this.mousemove) {
					if (this.btn === 'left') { this.inputarrow_line(); }
					else if (this.btn === 'right') {
						const cell = this.getcell();
						if (this.pid === 'icebarn' || !cell.isNum()) {
							this.inputIcebarn();
						}
						else {
							this.inputqnum();
						}
					}
				}
				else if (this.pid !== 'icebarn' && this.mouseend && this.notInputted()) {
					this.inputqnum();
				}
			}
		},

		inputarrow_line: function () {
			const pos = this.getpos(0);
			if (this.prevPos.equals(pos)) { return; }

			const border = this.prevPos.getnb(pos);
			if (!border.isnull && !this.mousestart) {
				const dir = this.prevPos.getdir(pos, 2);

				if (border.inside) {
					if (this.pid === 'icebarn') {
						if (this.inputData === null) { this.inputData = ((border.getArrow() !== dir) ? 1 : 0); }
						border.setArrow((this.inputData === 1) ? dir : 0);
					}
				}
				else if (this.inputData === null) {
					this.inputarrow_inout(border, dir);
				}
				border.draw();
			}
			this.prevPos = pos;
		},
		inputarrow_inout: function (border: IcebarnBorder, dir: IDir | 0) {
			const val = this.checkinout(border, dir), bd = this.board;
			if (val > 0) {
				if (val === 1) { bd.arrowin.input(border); }
				else if (val === 2) { bd.arrowout.input(border); }
				this.mousereset();
			}
		},
		/* 0:どちらでもない 1:IN 2:OUT */
		checkinout: function (border: IcebarnBorder, dir: IDir | 0): number {
			if (border.isnull) { return 0; }
			const bd = this.board, bx = border.bx, by = border.by;
			if ((bx === bd.minbx + 2 && dir === border.RT) || (bx === bd.maxbx - 2 && dir === border.LT) ||
				(by === bd.minby + 2 && dir === border.DN) || (by === bd.maxby - 2 && dir === border.UP)) { return 1; }
			else if ((bx === bd.minbx + 2 && dir === border.LT) || (bx === bd.maxbx - 2 && dir === border.RT) ||
				(by === bd.minby + 2 && dir === border.UP) || (by === bd.maxby - 2 && dir === border.DN)) { return 2; }
			return 0;
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
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,

		keyinput: function (ca) {
			if (this.key_inputIcebarn(ca)) { return; }
			this.key_inputqnum(ca);
		},
		key_inputIcebarn: function (ca: string): boolean {
			const cell = this.cursor.getc();

			if (ca === 'q') {
				cell.setQues(cell.ice() ? 0 : 6);
			}
			else if (ca === ' ' && cell.noNum()) {
				cell.setQues(0);
			}
			else { return false; }

			cell.drawaround();
			this.prev = cell;
			return true;
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Border: {
		group: "border",
		getArrow: function (): number { return this.qdir; },
		setArrow: function (val: number) { this.setQdir(val); },
		isArrow: function (): boolean { return (this.qdir > 0); }
	},



	Board: {
		cols: 8,
		rows: 8,

		hasborder: 2,
		hasexcell: 2, /* LineGraph用 */

		icegraph: null! as AreaIcebarnGraph,

		addExtraInfo: function () {
			this.icegraph = this.addInfoList(AreaIcebarnGraph);
		},

		arrowin: null! as InAddress,
		arrowout: null! as OutAddress,

		createExtraObject: function () {
			this.arrowin = new InAddress(this.puzzle, 2, 0);
			this.arrowout = new OutAddress(this.puzzle, 4, 0);
			this.arrowin.partner = this.arrowout;
			this.arrowout.partner = this.arrowin;
		},
		initExtraObject: function (col, row) {
			this.disableInfo();
			if (col >= 3) {
				//this.arrowin.init(1, 0);
				this.arrowin.set({ bx: 1, by: 0 })

				this.arrowout.init(5, 0);
			}
			else {
				this.arrowin.init(1, 0);
				this.arrowout.init(1, 2 * row);
			}
			this.enableInfo();
		},

		exchangeinout: function () {
			const old_in = this.arrowin.getb() as IcebarnBorder;
			const old_out = this.arrowout.getb() as IcebarnBorder;
			old_in.setArrow(0);
			old_out.setArrow(0);
			this.arrowin.set(old_out);
			this.arrowout.set(old_in);

			this.arrowin.draw();
			this.arrowout.draw();
		}
	},
	BoardExec: {
		posinfo_in: {} as any,
		posinfo_out: {} as any,
		adjustBoardData: function (key, d) {
			const bd = this.board;
			this.adjustBorderArrow(key, d);

			this.posinfo_in = this.getAfterPos(key, d, bd.arrowin.getb());
			this.posinfo_out = this.getAfterPos(key, d, bd.arrowout.getb());
		},
		adjustBoardData2: function (key, d) {
			const puzzle = this.puzzle, bd = puzzle.board, opemgr = puzzle.opemgr;
			let info1 = this.posinfo_in, info2 = this.posinfo_out, isrec: boolean;

			bd.disableInfo();

			isrec = ((key & this.REDUCE) && (info1.isdel) && (!opemgr.undoExec && !opemgr.redoExec));
			if (isrec) { opemgr.forceRecord = true; }
			bd.arrowin.set(info1.pos);
			if (isrec) { opemgr.forceRecord = false; }

			isrec = ((key & this.REDUCE) && (info2.isdel) && (!opemgr.undoExec && !opemgr.redoExec));
			if (isrec) { opemgr.forceRecord = true; }
			bd.arrowout.set(info2.pos);
			if (isrec) { opemgr.forceRecord = false; }

			bd.enableInfo();
		}
	},
	OperationManager: {
		addExtraOperation: function () {
			this.operationlist.push(InOutOperation);
		}
	},

	LineGraph: {
		enabled: true,
		isLineCross: true,

		rebuild2: function () {
			const excells = this.board.excell;
			for (let c = 0; c < excells.length; c++) {
				this.setComponentRefs(excells[c], null);
				this.resetObjNodeList(excells[c]);
			}

			LineGraph.prototype.rebuild2.call(this);
		}
	},
	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		irowake: true,

		gridcolor_type: "LIGHT",

		bgcellcolor_func: "icebarn",
		bordercolor_func: "ice",
		numbercolor_func: "fixed",

		errcolor1: "red",

		maxYdeg: 0.70,

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();

			this.drawBorders();

			this.drawLines();
			this.drawPekes();
			this.drawBorderAuxDir();

			this.drawQuesNumbers();

			this.drawBorderArrows();

			this.drawChassis();

			this.drawTarget();

			this.drawInOut();
		},

		getCanvasCols: function (): number {
			let bd = this.board, cols = this.getBoardCols() + 2 * this.margin;
			if (this.puzzle.playeronly) {
				if (bd.arrowin.bx === bd.minbx + 2 || bd.arrowout.bx === bd.minbx + 2) { cols += 0.7; }
				if (bd.arrowin.bx === bd.maxbx - 2 || bd.arrowout.bx === bd.maxbx - 2) { cols += 0.7; }
			}
			else { cols += 1.4; }
			return cols;
		},
		getCanvasRows: function (): number {
			let bd = this.board, rows = this.getBoardRows() + 2 * this.margin;
			if (this.puzzle.playeronly) {
				if (bd.arrowin.by === bd.minby + 2 || bd.arrowout.by === bd.minby + 2) { rows += 0.7; }
				if (bd.arrowin.by === bd.maxby - 2 || bd.arrowout.by === bd.maxby - 2) { rows += 0.7; }
			}
			else { rows += 1.4; }
			return rows;
		},

		getBoardCols: function (): number {
			const bd = this.board;
			return (bd.maxbx - bd.minbx) / 2 - 2;
		},
		getBoardRows: function (): number {
			const bd = this.board;
			return (bd.maxby - bd.minby) / 2 - 2;
		},

		getOffsetCols: function () {
			let bd = this.board, cols = 0;
			if (this.puzzle.playeronly) {
				if (bd.arrowin.bx === bd.minbx + 2 || bd.arrowout.bx === bd.minbx + 2) { cols += 0.35; }
				if (bd.arrowin.bx === bd.maxbx - 2 || bd.arrowout.bx === bd.maxbx - 2) { cols -= 0.35; }
			}
			return cols;
		},
		getOffsetRows: function () {
			let bd = this.board, rows = 0;
			if (this.puzzle.playeronly) {
				if (bd.arrowin.by === bd.minby + 2 || bd.arrowout.by === bd.minby + 2) { rows += 0.35; }
				if (bd.arrowin.by === bd.maxby - 2 || bd.arrowout.by === bd.maxby - 2) { rows -= 0.35; }
			}
			return rows;
		},

		drawBorderArrows: function () {
			const g = this.vinc('border_arrow', 'crispEdges', true);

			const ll = this.cw * 0.35;				//LineLength
			const lw = Math.max(this.cw / 36, 1);	//LineWidth
			const lm = lw / 2;						//LineMargin

			const blist = this.range.borders;
			for (let i = 0; i < blist.length; i++) {
				const border = blist[i], dir = border.getArrow();
				const px = border.bx * this.bw, py = border.by * this.bh;

				g.fillStyle = (border.error === 4 ? this.errcolor1 : this.quescolor);
				g.vid = "b_ar_" + border.id;
				if (dir !== border.NDIR) {
					switch (dir) {
						case border.UP: case border.DN: g.fillRectCenter(px, py, lm, ll); break;
						case border.LT: case border.RT: g.fillRectCenter(px, py, ll, lm); break;
					}
				}
				else { g.vhide(); }

				/* 1つのidでは2方向しかとれないはず */
				g.vid = "b_tipa_" + border.id;
				if (dir === border.UP || dir === border.LT) {
					g.beginPath();
					switch (dir) {
						case border.UP: g.setOffsetLinePath(px, py, 0, -ll, -ll / 2, -ll * 0.4, ll / 2, -ll * 0.4, true); break;
						case border.LT: g.setOffsetLinePath(px, py, -ll, 0, -ll * 0.4, -ll / 2, -ll * 0.4, ll / 2, true); break;
					}
					g.fill();
				}
				else { g.vhide(); }

				g.vid = "b_tipb_" + border.id;
				if (dir === border.DN || dir === border.RT) {
					g.beginPath();
					switch (dir) {
						case border.DN: g.setOffsetLinePath(px, py, 0, +ll, -ll / 2, ll * 0.4, ll / 2, ll * 0.4, true); break;
						case border.RT: g.setOffsetLinePath(px, py, ll, 0, ll * 0.4, -ll / 2, ll * 0.4, ll / 2, true); break;
					}
					g.fill();
				}
				else { g.vhide(); }
			}
		},
		drawInOut: function () {
			let g = this.context, bd = this.board, border: IcebarnBorder;

			g.vid = "string_in";
			border = bd.arrowin.getb() as IcebarnBorder;
			if (!border.inside && border.id < bd.border.length) {
				let bx = border.bx, by = border.by, px = bx * this.bw, py = by * this.bh;
				if (by === bd.minby + 2) { py -= 1.2 * this.bh; }
				else if (by === bd.maxby - 2) { py += 1.2 * this.bh; }
				else if (bx === bd.minbx + 2) { px -= this.bw; py -= 0.6 * this.bh; }
				else if (bx === bd.maxbx - 2) { px += this.bw; py -= 0.6 * this.bh; }
				g.fillStyle = (border.error === 4 ? this.errcolor1 : this.quescolor);
				this.disptext("IN", px, py, { ratio: 0.55, width: [] });
			}
			else { g.vhide(); }

			g.vid = "string_out";
			border = bd.arrowout.getb() as IcebarnBorder;
			if (!border.inside && border.id < bd.border.length) {
				let bx = border.bx, by = border.by, px = bx * this.bw, py = by * this.bh;
				if (by === bd.minby + 2) { py -= 1.2 * this.bh; }
				else if (by === bd.maxby - 2) { py += 1.2 * this.bh; }
				else if (bx === bd.minbx + 2) { px -= 1.4 * this.bw; py -= 0.6 * this.bh; }
				else if (bx === bd.maxbx - 2) { px += 1.4 * this.bw; py -= 0.6 * this.bh; }
				g.fillStyle = (border.error === 4 ? this.errcolor1 : this.quescolor);
				this.disptext("OUT", px, py, { ratio: 0.55, width: [] });
			}
			else { g.vhide(); }
		},

		repaintParts: function (blist) {
			this.range.borders = blist as any;

			this.drawBorderArrows();
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
			this.decodeIce();
			this.decodeNumber16();
			this.decodeInOut();
		},
		encodePzpr: function (type) {
			this.encodeIce();
			this.encodeNumber16();
			this.encodeInOut();

			this.outpflag = "a";
		},
		decodeInOut: function () {
			const barray = this.outbstr.split("/"), bd = this.board;
			const idoffset = (2 * bd.cols * bd.rows - bd.cols - bd.rows);

			bd.arrowin.setid((+barray[1] || 0) + idoffset);
			bd.arrowout.setid((+barray[2] || 0) + idoffset);

			this.outbstr = "";
		},
		encodeInOut: function () {
			const bd = this.board;
			const idoffset = (2 * bd.cols * bd.rows - bd.cols - bd.rows);
			this.outbstr += ("/" + (bd.arrowin.getid() - idoffset) + "/" + (bd.arrowout.getid() - idoffset));
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			const bd = this.board;
			bd.arrowin.setid(+this.readLine());
			bd.arrowout.setid(+this.readLine());
			this.readLine();

			this.decodeCell(function (cell, ca) {
				if (ca.charAt(0) === 'i') { cell.ques = 6; ca = ca.substr(1); }

				if (ca !== '' && ca !== '.') {
					cell.qnum = (ca !== '?' ? +ca : -2);
				}
			});
			this.decodeBorderLine_icebarn();
		},
		encodeData: function () {
			const bd = this.board;
			this.writeLine(bd.arrowin.getid());
			this.writeLine(bd.arrowout.getid());
			this.writeLine((this.puzzle.pid === 'icelom' ? "allwhite" : "skipwhite"));

			this.encodeCell(function (cell) {
				let istr = (cell.ques === 6 ? "i" : ""), qstr = '';
				if (cell.qnum === -1) { qstr = (istr === "" ? ". " : " "); }
				else if (cell.qnum === -2) { qstr = "? "; }
				else { qstr = cell.qnum + " "; }
				return istr + qstr;
			});
			this.encodeBorderLine_icebarn();
		},
		decodeBorderLine_icebarn: function () {
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
		encodeBorderLine_icebarn: function () {
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
			"checkBranchLine",
			"checkCrossOutOfIce",
			"checkIceLines",

			"checkValidStart",
			"checkLineOnStart",
			"checkDeadendRoad",
			"checkKeepInside",
			"checkNumberOrder",

			"checkOneLoop",

			"checkUnreachedUnshadeCell",
			//"checkIgnoreIcebarn@!icelom",

			"checkNoLineNumber",

			"checkDeadendLine+"
		],

		checkCrossOutOfIce: function () {
			this.checkAllCell(function (cell) { return (cell.lcnt === 4 && !cell.ice()); }, "lnCrossExIce");
		},
		checkUnreachedUnshadeCell: function () {
			this.checkAllCell(function (cell) { return (cell.ques === 0 && cell.lcnt === 0); }, "cuNoLine");
		},
		checkIgnoreIcebarn: function () {
			this.checkLinesInArea(this.board.icegraph, function (w, h, a, n) { return (a !== 0); }, "bkNoLine");
		},
		checkNoLineNumber: function () {
			this.checkAllCell(function (cell) { return (cell.lcnt === 0 && cell.isNum()); }, "nmUnpass");
		},

		checkAllArrow: function () {
			const bd = this.board;
			for (let id = 0; id < bd.border.length; id++) {
				const border = bd.border[id];
				if (!(border.isArrow() && !border.isLine())) { continue; }

				this.failcode.add("arNoLine");
				if (this.checkOnly) { break; }
				border.seterr(4);
			}
		},

		checkValidStart: function () {
			const bd = this.board, border = bd.arrowin.getb();
			if (!(border.by !== bd.minby + 2 || border.by !== bd.maxby - 2 || border.bx !== bd.minbx + 2 || border.bx !== bd.maxbx - 2)) {
				this.failcode.add("stInvalid");
			}
		},
		checkLineOnStart: function () {
			const border = this.board.arrowin.getb();
			if (!border.isLine()) {
				border.seterr(4);
				this.failcode.add("stNoLine");
			}
		},

		checkDeadendRoad: function () {
			this.checkTrace(function (info) { return info.lastborder.isLine(); }, "lrDeadEnd");
		},
		checkFollowArrow: function () {
			this.checkTrace(function (info) { return (info.lastborder.getArrow() === info.dir); }, "lrReverse");
		},
		checkKeepInside: function () {
			this.checkTrace(function (info) {
				const border = info.lastborder, bd = border.puzzle.board;
				return (border.inside || border.id === bd.arrowout.getid());
			}, "lrOffField");
		},
		checkNumberOrder: function () {
			this.checkTrace(function (info) {
				const cell = info.lastcell;
				if (cell.qnum < 0 || cell.qnum === info.count) { return true; }
				cell.seterr(1);
				return false;
			}, "lrOrder");
		},
		checkTrace: function (evalfunc: (info: TraceInfo) => boolean, code: string) {
			const info = this.getTraceInfo();
			if (!evalfunc(info)) {
				this.failcode.add(code);
				this.board.border.setnoerr();
				info.blist.seterr(1);
			}
		},

		getTraceInfo: function () {
			let border = this.board.arrowin.getb() as IcebarnBorder, dir = border.qdir as IDir, pos = border.getaddr();
			const info: TraceInfo = {
				lastcell: this.board.emptycell,
				lastborder: border,
				blist: (new BorderList()),
				dir: dir,
				count: 1
			};
			if (dir < 1) {
				throw new Error("dir is invalid!")
			}
			info.blist.add(border);
			while (1) {
				pos.movedir(dir, 1);

				if (pos.oncell()) {
					info.lastcell = pos.getc()
					const cell = info.lastcell;
					if (cell.isnull) { break; }
					else if (!cell.ice()) {
						const adb = cell.adjborder;
						if (cell.lcnt !== 2) { }
						else if (dir !== 1 && adb.bottom.isLine()) { dir = 2; }
						else if (dir !== 2 && adb.top.isLine()) { dir = 1; }
						else if (dir !== 3 && adb.right.isLine()) { dir = 4; }
						else if (dir !== 4 && adb.left.isLine()) { dir = 3; }
						info.dir = dir;
					}

					const num = cell.getNum();
					if (num !== -1) {
						if (num !== -2 && num !== info.count) { break; }
						info.count++;
					}
				}
				else {
					info.lastborder = pos.getb()
					border = info.lastborder;
					if (!border.isLine()) { break; }

					info.blist.add(border);
					const arrow = border.getArrow();
					if (arrow !== border.NDIR && dir !== arrow) { break; }
				}
			}

			return info;
		}
	},

	FailCode: {
		bkNoLine: ["すべてのアイスバーンを通っていません。", "A icebarn is not gone through."],
		lnPlLoop: ["線がひとつながりではありません。", "Lines are not countinuous."],
		arNoLine: ["線が通っていない矢印があります。", "A line doesn't go through some arrows."],
		lrOrder: ["数字の通過順が間違っています。", "A line goes through an arrow reverse."],
		nmUnpass: ["通過していない数字があります。", "The line doesn't pass all of the number."],
		stInvalid: ["スタート位置を特定できませんでした。", "System can't detect start position."],
		stNoLine: ["INに線が通っていません。", "The line doesn't go through the 'IN' arrow."],
		lrDeadEnd: ["途中で途切れている線があります。", "There is a dead-end line."],
		lrOffField: ["盤面の外に出てしまった線があります", "A line is not reached out the 'OUT' arrow."],
		lrReverse: ["矢印を逆に通っています。", "A line goes through an arrow reverse."],
		cuNoLine: ["通過していない白マスがあります。", "The line doesn't pass all of the non-icy cell."]
	}
});

export class Icelom2 extends Icelom {
	constructor(config?: IConfig) {
		super(config)
		this.pid = "icelom2"
		this.checker.checklist = [
			"checkBranchLine",
			"checkCrossOutOfIce",
			"checkIceLines",

			"checkValidStart",
			"checkLineOnStart",
			"checkDeadendRoad",
			"checkKeepInside",
			"checkNumberOrder",

			"checkOneLoop",

			//"checkUnreachedUnshadeCell",
			"checkIgnoreIcebarn",

			"checkNoLineNumber",

			"checkDeadendLine+"
		]
		this.checker.makeCheckList()
	}
}