//
// パズル固有スクリプト部 アイスバーン・アイスローム・アイスローム２版 icebarn.js

import { Address } from "../puzzle/Address";
import { AreaGraphBase } from "../puzzle/AreaManager";
import { Board } from "../puzzle/Board";
import { REDUCE } from "../puzzle/BoardExec";
import { DIRS } from "../puzzle/Constants";
import { LineGraph } from "../puzzle/LineManager";
import { MouseEvent1 } from "../puzzle/MouseInput";
import { Operation } from "../puzzle/Operation";
import { Border, Cell, IDir } from "../puzzle/Piece";
import { BorderList } from "../puzzle/PieceList";
import { Puzzle } from "../puzzle/Puzzle";
import { URL_PZPRV3 } from "../pzpr/constants";
import { createVariety } from "./createVariety";

//
export const Icebarn = createVariety({
	pid: "icebarn",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['ice', 'arrow', 'info-line'], play: ['line', 'peke', 'diraux', 'info-line'] },
		mouseinput: function (): void { // オーバーライド
			if (this.inputMode === 'arrow') { this.inputarrow_line(); }
			else { MouseEvent1.prototype.mouseinput.call(this); }
		},
		mouseinput_other: function (): void {
			if (this.inputMode === 'diraux') {
				if (this.mousestart || this.mousemove) { this.inputmark_mousemove(); }
				else if (this.mouseend && this.notInputted()) { this.clickmark(); }
			}
		},
		mouseinput_auto: function (): void {
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

		inputarrow_line: function (): void {
			const pos = this.getpos(0);
			if (this.prevPos.equals(pos)) { return; }

			const border = this.prevPos.getnb(pos);
			if (!border.isnull && !this.mousestart) {
				const dir = this.prevPos.getdir(pos, 2);

				if (border.inside) {
					if (this.inputData === null) { this.inputData = ((border.getArrow() !== dir) ? 1 : 0); }
					border.setArrow((this.inputData === 1) ? dir : 0);
				}
				else if (this.inputData === null) {
					this.inputarrow_inout(border, dir);
				}
				border.draw();
			}
			this.prevPos = pos;
		},
		inputarrow_inout: function (border: IcebarnBorder, dir: IDir | 0): void {
			const val = this.checkinout(border, dir), bd = this.board;
			if (val > 0) {
				if (val === 1) { bd.arrowin.input(border); }
				else if (val === 2) { bd.arrowout.input(border); }
				this.mousereset();
			}
		},
		/* 0:どちらでもない 1:IN 2:OUT */
		checkinout: function (border: Border, dir: IDir | 0): number {
			if (border.isnull) { return 0; }
			const bd = this.board, bx = border.bx, by = border.by;
			if ((bx === bd.minbx + 2 && dir === DIRS.RT) || (bx === bd.maxbx - 2 && dir === DIRS.LT) ||
				(by === bd.minby + 2 && dir === DIRS.DN) || (by === bd.maxby - 2 && dir === DIRS.UP)) { return 1; }
			else if ((bx === bd.minbx + 2 && dir === DIRS.LT) || (bx === bd.maxbx - 2 && dir === DIRS.RT) ||
				(by === bd.minby + 2 && dir === DIRS.UP) || (by === bd.maxby - 2 && dir === DIRS.DN)) { return 2; }
			return 0;
		},

		inputmark_mousemove: function (): void {
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
		clickmark: function (): void {
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
	// 盤面管理系
	Border: {
		group: "border",
		getArrow: function (): number { return this.qdir; },
		setArrow: function (val: number): void { this.setQdir(val); },
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
		initExtraObject: function (col: number, row: number) {
			this.disableInfo();
			if (col >= 3) {
				this.arrowin.init(1, 0);
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
			const info1 = this.posinfo_in, info2 = this.posinfo_out

			bd.disableInfo();

			let isrec = ((key & REDUCE) && (info1.isdel) && (!opemgr.undoExec && !opemgr.redoExec));
			if (isrec) { opemgr.forceRecord = true; }
			bd.arrowin.set(info1.pos);
			if (isrec) { opemgr.forceRecord = false; }

			isrec = ((key & REDUCE) && (info2.isdel) && (!opemgr.undoExec && !opemgr.redoExec));
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

		rebuild2: function (): void {
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

		paint: function (): void {
			this.drawBGCells();
			this.drawDashedGrid();

			this.drawBorders();

			this.drawLines();
			this.drawPekes();
			this.drawBorderAuxDir();

			this.drawBorderArrows();

			this.drawChassis();

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

		getOffsetCols: function (): number {
			let bd = this.board, cols = 0;
			if (this.puzzle.playeronly) {
				if (bd.arrowin.bx === bd.minbx + 2 || bd.arrowout.bx === bd.minbx + 2) { cols += 0.35; }
				if (bd.arrowin.bx === bd.maxbx - 2 || bd.arrowout.bx === bd.maxbx - 2) { cols -= 0.35; }
			}
			return cols;
		},
		getOffsetRows: function (): number {
			let bd = this.board, rows = 0;
			if (this.puzzle.playeronly) {
				if (bd.arrowin.by === bd.minby + 2 || bd.arrowout.by === bd.minby + 2) { rows += 0.35; }
				if (bd.arrowin.by === bd.maxby - 2 || bd.arrowout.by === bd.maxby - 2) { rows -= 0.35; }
			}
			return rows;
		},

		drawBorderArrows: function (): void {
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
				if (dir !== DIRS.NDIR) {
					switch (dir) {
						case DIRS.UP: case DIRS.DN: g.fillRectCenter(px, py, lm, ll); break;
						case DIRS.LT: case DIRS.RT: g.fillRectCenter(px, py, ll, lm); break;
					}
				}
				else { g.vhide(); }

				/* 1つのidでは2方向しかとれないはず */
				g.vid = "b_tipa_" + border.id;
				if (dir === DIRS.UP || dir === DIRS.LT) {
					g.beginPath();
					switch (dir) {
						case DIRS.UP: g.setOffsetLinePath(px, py, 0, -ll, -ll / 2, -ll * 0.4, ll / 2, -ll * 0.4, true); break;
						case DIRS.LT: g.setOffsetLinePath(px, py, -ll, 0, -ll * 0.4, -ll / 2, -ll * 0.4, ll / 2, true); break;
					}
					g.fill();
				}
				else { g.vhide(); }

				g.vid = "b_tipb_" + border.id;
				if (dir === DIRS.DN || dir === DIRS.RT) {
					g.beginPath();
					switch (dir) {
						case DIRS.DN: g.setOffsetLinePath(px, py, 0, +ll, -ll / 2, ll * 0.4, ll / 2, ll * 0.4, true); break;
						case DIRS.RT: g.setOffsetLinePath(px, py, ll, 0, ll * 0.4, -ll / 2, ll * 0.4, ll / 2, true); break;
					}
					g.fill();
				}
				else { g.vhide(); }
			}
		},
		drawInOut: function (): void {
			let g = this.context, bd = this.board, border: Border;

			g.vid = "string_in";
			border = bd.arrowin.getb();
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
			border = bd.arrowout.getb();
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

		repaintParts: function (blist): void {
			this.range.borders = blist as any;

			this.drawBorderArrows();
		},

		drawBorderAuxDir: function (): void {
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
						case DIRS.UP: g.setOffsetLinePath(px, py, -ssize * 2, +ssize, 0, -ssize, +ssize * 2, +ssize, false); break;
						case DIRS.DN: g.setOffsetLinePath(px, py, -ssize * 2, -ssize, 0, +ssize, +ssize * 2, -ssize, false); break;
						case DIRS.LT: g.setOffsetLinePath(px, py, +ssize, -ssize * 2, -ssize, 0, +ssize, +ssize * 2, false); break;
						case DIRS.RT: g.setOffsetLinePath(px, py, -ssize, -ssize * 2, +ssize, 0, -ssize, +ssize * 2, false); break;
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
		decodePzpr: function (type): void {
			this.decodeIce();
			this.decodeBorderArrow();
			this.decodeInOut();
		},
		encodePzpr: function (type): void {
			this.encodeIce()
			this.encodeBorderArrow();
			this.encodeInOut();
		},

		decodeBorderArrow: function (): void {
			const bstr = this.outbstr, bd = this.board;
			const bdinside = 2 * bd.cols * bd.rows - bd.cols - bd.rows;

			bd.disableInfo();
			let id = 0, a = 0;
			for (let i = a; i < bstr.length; i++) {
				const ca = bstr.charAt(i);
				if (ca !== 'z') {
					id += Number.parseInt(ca, 36);
					if (id < bdinside) {
						const border = bd.border[id];
						border.setArrow(border.isHorz() ? DIRS.UP : DIRS.LT);
					}
					id++;
				}
				else { id += 35; }
				if (id >= bdinside) { a = i + 1; break; }
			}

			id = 0;
			for (let i = a; i < bstr.length; i++) {
				const ca = bstr.charAt(i);
				if (ca !== 'z') {
					id += Number.parseInt(ca, 36);
					if (id < bdinside) {
						const border = bd.border[id];
						border.setArrow(border.isHorz() ? DIRS.DN : DIRS.RT);
					}
					id++;
				}
				else { id += 35; }
				if (id >= bdinside) { a = i + 1; break; }
			}
			bd.enableInfo();

			this.outbstr = bstr.substr(a);
		},
		encodeBorderArrow: function (): void {
			let cm = "", num = 0, bd = this.board;
			const bdinside = 2 * bd.cols * bd.rows - bd.cols - bd.rows;
			for (let id = 0; id < bdinside; id++) {
				const border = bd.border[id];
				const dir = border.getArrow();
				if (dir === DIRS.UP || dir === DIRS.LT) { cm += num.toString(36); num = 0; }
				else {
					num++;
					if (num >= 35) { cm += "z"; num = 0; }
				}
			}
			if (num > 0) { cm += num.toString(36); }

			num = 0;
			for (let id = 0; id < bdinside; id++) {
				const border = bd.border[id];
				const dir = border.getArrow();
				if (dir === DIRS.DN || dir === DIRS.RT) { cm += num.toString(36); num = 0; }
				else {
					num++;
					if (num >= 35) { cm += "z"; num = 0; }
				}
			}
			if (num > 0) { cm += num.toString(36); }

			this.outbstr += cm;
		},

		decodeInOut: function (): void {
			const barray = this.outbstr.split("/"), bd = this.board;
			const idoffset = (2 * bd.cols * bd.rows - bd.cols - bd.rows);

			bd.arrowin.setid((+barray[1] || 0) + idoffset);
			bd.arrowout.setid((+barray[2] || 0) + idoffset);

			this.outbstr = "";
		},
		encodeInOut: function (): void {
			const bd = this.board;
			const idoffset = (2 * bd.cols * bd.rows - bd.cols - bd.rows);
			this.outbstr += ("/" + (bd.arrowin.getid() - idoffset) + "/" + (bd.arrowout.getid() - idoffset));
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function (): void {
			const bd = this.board;
			bd.arrowin.setid(+this.readLine());
			bd.arrowout.setid(+this.readLine());

			this.decodeCell(function (cell, ca) {
				if (ca === "1") { cell.ques = 6; }
			});
			this.decodeBorderArrow();
			this.decodeBorderLine_icebarn();
		},
		encodeData: function (): void {
			const bd = this.board;
			this.writeLine(bd.arrowin.getid());
			this.writeLine(bd.arrowout.getid());
			this.encodeCell(function (cell) {
				return (cell.ques === 6 ? "1 " : "0 ");
			});
			this.encodeBorderArrow();
			this.encodeBorderLine_icebarn();
		},

		decodeBorderArrow: function (): void {
			const bd = this.board;
			bd.disableInfo();
			this.decodeBorder(function (border, ca) {
				if (ca !== "0") {
					const val = +ca, isvert = border.isVert();
					if (val === 1 && !isvert) { border.setArrow(DIRS.UP); }
					if (val === 2 && !isvert) { border.setArrow(DIRS.DN); }
					if (val === 1 && isvert) { border.setArrow(DIRS.LT); }
					if (val === 2 && isvert) { border.setArrow(DIRS.RT); }
				}
			});
			bd.enableInfo();
		},
		encodeBorderArrow: function (): void {
			this.encodeBorder(function (border) {
				const dir = border.getArrow();
				if (dir === DIRS.UP || dir === DIRS.LT) { return "1 "; }
				else if (dir === DIRS.DN || dir === DIRS.RT) { return "2 "; }
				else { return "0 "; }
			});
		},
		decodeBorderLine_icebarn: function (): void {
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
		encodeBorderLine_icebarn: function (): void {
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
			"checkFollowArrow",

			"checkOneLoop",

			"checkIgnoreIcebarn",

			"checkAllArrow",

			"checkDeadendLine+"
		],

		checkCrossOutOfIce: function (): void {
			this.checkAllCell(function (cell) { return (cell.lcnt === 4 && !cell.ice()); }, "lnCrossExIce");
		},
		checkUnreachedUnshadeCell: function (): void {
			this.checkAllCell(function (cell) { return (cell.ques === 0 && cell.lcnt === 0); }, "cuNoLine");
		},
		checkIgnoreIcebarn: function (): void {
			this.checkLinesInArea(this.board.icegraph, function (w, h, a, n) { return (a !== 0); }, "bkNoLine");
		},
		checkNoLineNumber: function (): void {
			this.checkAllCell(function (cell) { return (cell.lcnt === 0 && cell.isNum()); }, "nmUnpass");
		},

		checkAllArrow: function (): void {
			const bd = this.board;
			for (let id = 0; id < bd.border.length; id++) {
				const border = bd.border[id];
				if (!(border.isArrow() && !border.isLine())) { continue; }

				this.failcode.add("arNoLine");
				if (this.checkOnly) { break; }
				border.seterr(4);
			}
		},

		checkValidStart: function (): void {
			const bd = this.board, border = bd.arrowin.getb();
			if (!(border.by !== bd.minby + 2 || border.by !== bd.maxby - 2 || border.bx !== bd.minbx + 2 || border.bx !== bd.maxbx - 2)) {
				this.failcode.add("stInvalid");
			}
		},
		checkLineOnStart: function (): void {
			const border = this.board.arrowin.getb();
			if (!border.isLine()) {
				border.seterr(4);
				this.failcode.add("stNoLine");
			}
		},

		checkDeadendRoad: function (): void {
			this.checkTrace(function (info) { return info.lastborder.isLine(); }, "lrDeadEnd");
		},
		checkFollowArrow: function (): void {
			this.checkTrace(function (info) { return (info.lastborder.getArrow() === info.dir); }, "lrReverse");
		},
		checkKeepInside: function (): void {
			this.checkTrace(function (info) {
				const border = info.lastborder, bd = border.puzzle.board;
				return (border.inside || border.id === bd.arrowout.getid());
			}, "lrOffField");
		},
		checkNumberOrder: function (): void {
			this.checkTrace(function (info) {
				const cell = info.lastcell;
				if (cell.qnum < 0 || cell.qnum === info.count) { return true; }
				cell.seterr(1);
				return false;
			}, "lrOrder");
		},
		checkTrace: function (evalfunc: (info: TraceInfo) => boolean, code: string): void {
			const info = this.getTraceInfo();
			if (!evalfunc(info)) {
				this.failcode.add(code);
				this.board.border.setnoerr();
				info.blist.seterr(1);
			}
		},

		getTraceInfo: function (): TraceInfo {
			let border = this.board.arrowin.getb() as IcebarnBorder, dir: IDir = border.qdir as IDir, pos = border.getaddr();
			const info: TraceInfo = {
				lastcell: this.board.emptycell,
				lastborder: border as IcebarnBorder,
				blist: (new BorderList()),
				dir: dir,
				count: 1
			};
			info.blist.add(border);

			while (1) {
				pos.movedir(dir, 1);
				if (pos.oncell()) {
					info.lastcell = pos.getc();
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

					// if (this.pid !== 'icebarn') {
					// 	const num = cell.getNum();
					// 	if (num !== -1) {
					// 		if (num !== -2 && num !== info.count) { break; }
					// 		info.count++;
					// 	}
					// }
				}
				else {
					info.lastborder = pos.getb() as IcebarnBorder;
					border = info.lastborder;
					if (!border.isLine()) { break; }

					info.blist.add(border);
					const arrow = border.getArrow();
					if (arrow !== DIRS.NDIR && dir !== arrow) { break; }
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
type TraceInfo = {
	lastcell: Cell
	lastborder: IcebarnBorder,
	blist: BorderList
	dir: IDir,
	count: 1
}

type IcebarnBorder = Border & {
	getArrow: () => number
	setArrow: (a: number) => void
}

/*
"CellList@icebarn":{
	join : function(str){
		var idlist = [];
		for(var i=0;i<this.length;i++){ idlist.push(this[i].id);}
		return idlist.join(str);
	}
},
*/

class AreaIcebarnGraph extends AreaGraphBase {
	override enabled = true
	override relation = { 'cell.ques': 'node' }
	override setComponentRefs(obj: any, component: any) { obj.icebarn = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.icebarnnodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.icebarnnodes = []; }
	override isnodevalid(cell: any) { return cell.ice(); }
}

class InOutAddress extends Address {
	type = ""
	partner!: InOutAddress

	constructor(puzzle: Puzzle, bx: number, by: number) {
		super(puzzle, bx, by)
		if (!!this.board) { this.setarrow(this.getb() as IcebarnBorder); }
	}

	setarrow(border: IcebarnBorder) { }

	getid() {
		return this.getb().id;
	}
	setid(id: number) {
		this.input(this.board.border[id] as IcebarnBorder);
	}

	input(border: IcebarnBorder) {
		if (!this.partner.equals(border)) {
			if (!this.equals(border)) {
				(this.getb() as IcebarnBorder).setArrow(0);
				this.set(border);
			}
		}
		else {
			//@ts-ignore
			this.board.exchangeinout();
		}
	}
	override set<T extends { bx: number, by: number }>(pos: T) {
		const pos0 = this.getaddr();
		this.addOpe(pos.bx, pos.by);

		this.bx = pos.bx;
		this.by = pos.by;
		this.setarrow(this.getb() as IcebarnBorder);

		pos0.draw();
		this.draw();

		return this
	}

	addOpe(bx: number, by: number) {
		if (this.bx === bx && this.by === by) { return; }
		this.puzzle.opemgr.add(new InOutOperation(this.puzzle, this.type, this.bx, this.by, bx, by));
	}
}

class InAddress extends InOutAddress {
	override type = "in"

	override setarrow(border: IcebarnBorder) {
		// setarrowin_arrow 
		const bd = this.board;
		if (border.by === bd.maxby - 2) { border.setArrow(DIRS.UP); }
		else if (border.by === bd.minby + 2) { border.setArrow(DIRS.DN); }
		else if (border.bx === bd.maxbx - 2) { border.setArrow(DIRS.LT); }
		else if (border.bx === bd.minbx + 2) { border.setArrow(DIRS.RT); }
	}
}
class OutAddress extends InOutAddress {
	override type = "out"

	override setarrow(border: IcebarnBorder) {
		// setarrowout_arrow
		const bd = this.board;
		if (border.by === bd.minby + 2) { border.setArrow(DIRS.UP); }
		else if (border.by === bd.maxby - 2) { border.setArrow(DIRS.DN); }
		else if (border.bx === bd.minbx + 2) { border.setArrow(DIRS.LT); }
		else if (border.bx === bd.maxbx - 2) { border.setArrow(DIRS.RT); }
	}
}

class InOutOperation extends Operation {
	bx1: number
	bx2: number
	by1: number
	by2: number

	constructor(puzzle: Puzzle, property: string, x1: number, y1: number, x2: number, y2: number) {
		super(puzzle)
		this.property = property;
		this.bx1 = x1;
		this.by1 = y1;
		this.bx2 = x2;
		this.by2 = y2;
	}
	override decode(strs: string[]) {
		if (strs[0] !== 'PI' && strs[0] !== 'PO') { return false; }
		this.property = (strs[0] === 'PI' ? 'in' : 'out');
		this.bx1 = +strs[1];
		this.by1 = +strs[2];
		this.bx2 = +strs[3];
		this.by2 = +strs[4];
		return true;
	}
	override toString() {
		return [(this.property === 'in' ? 'PI' : 'PO'), this.bx1, this.by1, this.bx2, this.by2].join(',');
	}

	override undo() { this.exec_io(this.bx1, this.by1); }
	override redo() { this.exec_io(this.bx2, this.by2); }
	exec_io(bx: number, by: number) {
		const bd = this.board, border = bd.getb(bx, by);
		//@ts-ignore
		if (this.property === 'in') { bd.arrowin.set(border); }
		//@ts-ignore
		else if (this.property === 'out') { bd.arrowout.set(border); }
	}
}