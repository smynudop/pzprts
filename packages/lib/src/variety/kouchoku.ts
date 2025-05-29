//
// パズル固有スクリプト部 交差は直角に限る版 kouchoku.js

import { B } from "vitest/dist/chunks/worker.d.CHGSOG0s.js";
import { Board, type IGroup } from "../puzzle/Board";
import { IRange } from "../puzzle/BoardExec";
import { GraphNode } from "../puzzle/GraphBase";
import { MouseEvent1 } from "../puzzle/MouseInput";
import { Operation } from "../puzzle/Operation";
import { BoardPiece, type Cross } from "../puzzle/Piece";
import { BorderList, PieceList } from "../puzzle/PieceList";
import type { Puzzle } from "../puzzle/Puzzle";
import { createVariety } from "./createVariety";

//
export const Kouchoku = createVariety({
	pid: "kouchoku",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['number', 'clear'], play: [] },
		mouseinput_number: function () {
			if (this.mousestart) { this.inputqnum_cross(); }
		},
		mouseinput_clear: function () {
			this.inputclean_cross();
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) { this.inputsegment(); }
				else if (this.mouseend) { this.inputsegment_up(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart) { this.inputqnum_cross(); }
			}
		},

		targetPoint: [null!, null!] as [Cross | null, Cross | null],
		inputsegment: function () {
			const cross = this.getcross();
			if (cross.isnull || cross === this.mouseCell) { return; }

			if (this.mousestart) {
				this.inputData = 1;
				this.targetPoint[0] = cross;
				cross.draw();
			}
			else if (this.mousemove && this.inputData === 1) {
				const cross0 = this.targetPoint[1];
				this.targetPoint[1] = cross;
				cross.draw();
				if (cross0 !== null) { cross0.draw(); }
			}

			this.mouseCell = cross;
		},
		inputsegment_up: function () {
			if (this.inputData !== 1) { return; }

			const puzzle = this.puzzle;
			const cross1 = this.targetPoint[0], cross2 = this.targetPoint[1];
			this.targetPoint = [null, null];
			if (cross1 !== null) { cross1.draw(); }
			if (cross2 !== null) { cross2.draw(); }
			if (cross1 !== null && cross2 !== null) {
				if (!puzzle.getConfig('enline') || (cross1.qnum !== -1 && cross2.qnum !== -1)) {
					let bx1 = cross1.bx, bx2 = cross2.bx, by1 = cross1.by, by2 = cross2.by, tmp: number;
					if (!puzzle.getConfig('lattice') || puzzle.board.getLatticePoint(bx1, by1, bx2, by2).length === 0) {
						this.inputsegment_main(bx1, by1, bx2, by2);
						if (bx1 > bx2) { tmp = bx1; bx1 = bx2; bx2 = tmp; }
						if (by1 > by2) { tmp = by1; by1 = by2; by2 = tmp; }
						puzzle.painter.paintRange(bx1 - 1, by1 - 1, bx2 + 1, by2 + 1);
					}
				}
			}
		},
		inputsegment_main: function (bx1: number, by1: number, bx2: number, by2: number) {
			let tmp: number;
			if (bx1 > bx2) { tmp = bx1; bx1 = bx2; bx2 = tmp; tmp = by1; by1 = by2; by2 = tmp; }
			else if (bx1 === bx2 && by1 > by2) { tmp = by1; by1 = by2; by2 = tmp; }
			else if (bx1 === bx2 && by1 === by2) { return; }

			const bd = this.board, seg = bd.getSegment(bx1, by1, bx2, by2);
			if (seg === null) { bd.segment.add(new Segment(this.puzzle, bx1, by1, bx2, by2)); }
			else { bd.segment.remove(seg); }
		},

		mousereset: function () {
			if (this.inputData === 1) {
				const cross1 = this.targetPoint[0], cross2 = this.targetPoint[1];
				this.targetPoint = [null, null];
				if (cross1 !== null) { cross1.draw(); }
				if (cross2 !== null) { cross2.draw(); }
			}
			MouseEvent1.prototype.mousereset.call(this);
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		moveTarget: function (ca): boolean { return this.moveTCross(ca); },

		keyinput: function (ca) {
			this.key_inputqnum_kouchoku(ca);
		},
		key_inputqnum_kouchoku: function (ca: string) {
			const cross = this.cursor.getx();

			if (ca.length > 1 && ca !== 'BS') { return; }
			else if ('a' <= ca && ca <= 'z') {
				const num = Number.parseInt(ca, 36) - 9;
				if (cross.qnum === num) { cross.setQnum(-1); }
				else { cross.setQnum(num); }
			}
			else if (ca === '-') { cross.setQnum(cross.qnum !== -2 ? -2 : -1); }
			else if (ca === ' ' || ca === 'BS') { cross.setQnum(-1); }
			else { return; }

			this.prev = cross;
			cross.draw();
		}
	},

	TargetCursor: {
		crosstype: true
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cross: {
		maxnum: 26,
		seglist: null! as SegmentList
	},



	Board: {
		cols: 7,
		rows: 7,
		disable_subclear: true,
		segment: null! as SegmentList,

		createExtraObject: function () {
			this.segment = new BoardSegmentList(this);
		},

		setposCrosses: function () {
			Board.prototype.setposCrosses.call(this);

			for (let id = 0; id < this.cross.length; id++) {
				if (!this.cross[id].seglist) {
					this.cross[id].seglist = new SegmentList();
				}
			}
		},

		allclear: function (isrec) {
			this.segment.allclear();

			Board.prototype.allclear.call(this, isrec);
		},
		ansclear: function () {
			this.puzzle.opemgr.newOperation();
			this.segment.ansclear();

			Board.prototype.ansclear.call(this);
		},
		errclear: function (): boolean {
			if (this.haserror) {
				this.segment.errclear();
			}
			return Board.prototype.errclear.call(this);
		},
		trialclear: function () {
			if (this.trialstage > 0) {
				this.segment.trialclear();
			}
			Board.prototype.trialclear.call(this);
		},

		getLatticePoint: function (bx1: number, by1: number, bx2: number, by2: number): any {
			const seg = new Segment(this.puzzle, bx1, by1, bx2, by2), lattice = [];
			for (let i = 0; i < seg.lattices.length; i++) {
				const xc = seg.lattices[i][2];
				if (xc !== null && this.cross[xc].qnum !== -1) { lattice.push(xc); }
			}
			return lattice;
		},

		//---------------------------------------------------------------------------
		// bd.segmentinside() 座標(x1,y1)-(x2,y2)に含まれるsegmentのIDリストを取得する
		//---------------------------------------------------------------------------
		segmentinside: function (x1: number, y1: number, x2: number, y2: number): SegmentList {
			if (x1 <= this.minbx && x2 >= this.maxbx && y1 <= this.minby && y2 >= this.maxby) { return this.segment; }

			return this.segment.filter(function (seg) { return seg.isAreaInclude(x1, y1, x2, y2); });
		},

		//---------------------------------------------------------------------------
		// bd.getSegment() 位置情報からsegmentを取得する
		//---------------------------------------------------------------------------
		getSegment: function (bx1: number, by1: number, bx2: number, by2: number): Segment | null {
			let cross = this.getx(bx1, by1), seg = null;
			for (let i = 0, len = cross.seglist.length; i < len; i++) {
				const search = cross.seglist[i];
				if (search.bx2 === bx2 && search.by2 === by2) {
					seg = search;
					break;
				}
			}
			return seg;
		}
	},
	BoardExec: {
		adjustBoardData: function (key, d) {
			const bd = this.board, bexec = this;
			if (key & this.REDUCE) {
				const sublist = new SegmentList();
				bd.segment.each(function (seg) {
					const bx1 = seg.bx1, by1 = seg.by1, bx2 = seg.bx2, by2 = seg.by2;
					switch (key) {
						case bexec.REDUCEUP: if (by1 < bd.minby + 2 || by2 < bd.minby + 2) { sublist.add(seg); } break;
						case bexec.REDUCEDN: if (by1 > bd.maxby - 2 || by2 > bd.maxby - 2) { sublist.add(seg); } break;
						case bexec.REDUCELT: if (bx1 < bd.minbx + 2 || bx2 < bd.minbx + 2) { sublist.add(seg); } break;
						case bexec.REDUCERT: if (bx1 > bd.maxbx - 2 || bx2 > bd.maxbx - 2) { sublist.add(seg); } break;
					}
				});

				const opemgr = this.puzzle.opemgr, isrec = (!opemgr.undoExec && !opemgr.redoExec);
				if (isrec) { opemgr.forceRecord = true; }
				for (let i = 0; i < sublist.length; i++) { bd.segment.remove(sublist[i]); }
				if (isrec) { opemgr.forceRecord = false; }
			}
		},
		adjustBoardData2: function (key, d) {
			const bexec = this, xx = (d.x1 + d.x2), yy = (d.y1 + d.y2);
			this.board.segment.each(function (seg) {
				const bx1 = seg.bx1, by1 = seg.by1, bx2 = seg.bx2, by2 = seg.by2;
				switch (key) {
					case bexec.FLIPY: seg.setpos(bx1, yy - by1, bx2, yy - by2); break;
					case bexec.FLIPX: seg.setpos(xx - bx1, by1, xx - bx2, by2); break;
					case bexec.TURNR: seg.setpos(yy - by1, bx1, yy - by2, bx2); break;
					case bexec.TURNL: seg.setpos(by1, xx - bx1, by2, xx - bx2); break;
					case bexec.EXPANDUP: seg.setpos(bx1, by1 + 2, bx2, by2 + 2); break;
					case bexec.EXPANDDN: seg.setpos(bx1, by1, bx2, by2); break;
					case bexec.EXPANDLT: seg.setpos(bx1 + 2, by1, bx2 + 2, by2); break;
					case bexec.EXPANDRT: seg.setpos(bx1, by1, bx2, by2); break;
					case bexec.REDUCEUP: seg.setpos(bx1, by1 - 2, bx2, by2 - 2); break;
					case bexec.REDUCEDN: seg.setpos(bx1, by1, bx2, by2); break;
					case bexec.REDUCELT: seg.setpos(bx1 - 2, by1, bx2 - 2, by2); break;
					case bexec.REDUCERT: seg.setpos(bx1, by1, bx2, by2); break;
				}
			});
		}
	},

	LineGraph: {
		enabled: true,
		relation: { 'segment': 'link' },

		pointgroup: 'cross',
		linkgroup: 'segment' as unknown as IGroup,

		isedgevalidbylinkobj: function (seg): boolean { return !seg.isnull; },

		repaintNodes: function (components) {
			const segs_all = new SegmentList();
			for (let i = 0; i < components.length; i++) {
				segs_all.extend(components[i].getedgeobjs() as unknown as Segment[]);
			}
			this.puzzle.painter.repaintLines(segs_all as unknown as BorderList);
		}
	},
	GraphComponent: {
		getLinkObjByNodes: function (node1: GraphNode, node2: GraphNode): Segment {
			const bx1 = node1.obj.bx, by1 = node1.obj.by, bx2 = node2.obj.bx, by2 = node2.obj.by;
			//@ts-ignore
			return this.board.getSegment(bx1, by1, bx2, by2);
		}
	},


	OperationManager: {
		addExtraOperation: function () {
			this.operationlist.push(SegmentOperation);
		}
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		margin: 0.50,

		hideHatena: true,

		irowake: true,

		autocmp: "kouchoku",

		gridcolor_type: "DLIGHT",

		paint: function () {
			this.drawDashedGrid(false);

			this.drawSegments();

			this.drawCrosses_kouchoku();
			this.drawSegmentTarget();
			this.drawTarget();
		},

		repaintLines: function (_segs) {
			const segs = _segs as unknown as SegmentList;
			if (!this.context.use.canvas) {
				this.vinc('segment', 'auto');
				for (let i = 0; i < segs.length; i++) { this.drawSegment1(segs[i], true); }
			}
			else {
				const d = segs.getRange()!;
				this.paintRange(d.x1 - 1, d.y1 - 1, d.x2 + 1, d.y2 + 1);
			}
		},

		drawSegments: function () {
			const bd = this.board;
			this.vinc('segment', 'auto');

			let segs = bd.segment;
			/* 全領域の30%以下なら範囲指定 */
			if (((this.range.x2 - this.range.x1) * (this.range.y2 - this.range.y1)) / ((bd.maxbx - bd.minbx) * (bd.maxby - bd.minby)) < 0.30) {
				segs = bd.segmentinside(this.range.x1, this.range.y1, this.range.x2, this.range.y2);
			}

			for (let i = 0; i < segs.length; i++) { this.drawSegment1(segs[i], true); }
		},
		eraseSegment1: function (seg: Segment) {
			this.vinc('segment', 'auto');
			this.drawSegment1(seg, false);
		},
		drawSegment1: function (seg: Segment, isdraw: boolean) {
			if (seg.bx1 === void 0) { /* 消すための情報が無い場合は何もしない */ return; }

			const g = this.context;
			g.vid = ["seg", seg.bx1, seg.by1, seg.bx2, seg.by2].join("_");
			if (isdraw) {
				if (seg.trial && this.puzzle.getConfig('irowake')) { g.lineWidth = this.lw - this.lm; }
				else { g.lineWidth = this.lw; }

				if (seg.error === 1) { g.strokeStyle = this.errlinecolor; }
				else if (seg.error === -1) { g.strokeStyle = this.noerrcolor; }
				else if (this.puzzle.execConfig('irowake') && seg.path.color) { g.strokeStyle = seg.path.color; }
				else if (seg.trial) { g.strokeStyle = this.trialcolor; }
				else { g.strokeStyle = this.linecolor; }

				const px1 = seg.bx1 * this.bw, px2 = seg.bx2 * this.bw,
					py1 = seg.by1 * this.bh, py2 = seg.by2 * this.bh;
				g.strokeLine(px1, py1, px2, py2);
			}
			else { g.vhide(); }
		},

		drawCrosses_kouchoku: function () {
			const g = this.vinc('cross_base', 'auto', true);

			const isgray = this.puzzle.execConfig('autocmp');
			const csize1 = this.cw * 0.30 + 1, csize2 = this.cw * 0.20;
			g.lineWidth = 1;

			const option = { ratio: 0.55 };
			const clist = this.range.crosses;
			for (let i = 0; i < clist.length; i++) {
				const cross = clist[i];
				const graydisp = (isgray && cross.error === 0 && cross.lcnt >= 2);
				const px = cross.bx * this.bw, py = cross.by * this.bh;
				// ○の描画
				g.vid = "x_cp_" + cross.id;
				if (cross.qnum > 0) {
					g.fillStyle = (cross.error === 1 ? this.errbcolor1 : "white");
					g.strokeStyle = (graydisp ? "gray" : "black");
					g.shapeCircle(px, py, csize1);
				}
				else { g.vhide(); }

				// アルファベットの描画
				g.vid = "cross_text_" + cross.id;
				if (cross.qnum > 0) {
					g.fillStyle = (graydisp ? "gray" : this.quescolor);
					this.disptext((cross.qnum + 9).toString(36).toUpperCase(), px, py, option);
				}
				else { g.vhide(); }

				// ●の描画
				g.vid = "x_cm_" + cross.id;
				if (cross.qnum === -2) {
					g.fillStyle = (cross.error === 1 ? this.errcolor1 : this.quescolor);
					if (graydisp) { g.fillStyle = "gray"; }
					g.fillCircle(px, py, csize2);
				}
				else { g.vhide(); }
			}
		},

		drawSegmentTarget: function () {
			const g = this.vinc('cross_target_', 'auto', true);

			const csize = this.cw * 0.32;
			g.strokeStyle = "rgb(64,127,255)";
			g.lineWidth = this.lw * 1.5;

			const clist = this.range.crosses;
			for (let i = 0; i < clist.length; i++) {
				const cross = clist[i];
				g.vid = "x_point_" + cross.id;
				//@ts-ignore
				if (this.puzzle.mouse.targetPoint[0] === cross ||
					//@ts-ignore
					this.puzzle.mouse.targetPoint[1] === cross) {
					g.strokeCircle(cross.bx * this.bw, cross.by * this.bh, csize);
				}
				else { g.vhide(); }
			}
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeCrossABC();
		},
		encodePzpr: function (type) {
			this.encodeCrossABC();
		},

		decodeCrossABC: function () {
			let c = 0, i = 0, bstr = this.outbstr, bd = this.board;
			for (i = 0; i < bstr.length; i++) {
				const cross = bd.cross[c], ca = bstr.charAt(i);
				if (this.include(ca, "a", "z")) { cross.qnum = Number.parseInt(ca, 36) - 9; }
				else if (this.include(ca, "0", "9")) { c += (Number.parseInt(ca, 36)); }
				else if (ca === ".") { cross.qnum = -2; }

				c++;
				if (!bd.cross[c]) { break; }
			}
			this.outbstr = bstr.substr(i + 1);
		},
		encodeCrossABC: function () {
			let count = 0, cm = "", bd = this.board;
			for (let c = 0; c < bd.cross.length; c++) {
				let pstr = "", qn = bd.cross[c].qnum;

				if (qn >= 0) { pstr = (9 + qn).toString(36); }
				else if (qn === -2) { pstr = "."; }
				else { count++; }

				if (count === 0) { cm += pstr; }
				else if (pstr || count === 10) { cm += ((count - 1).toString(36) + pstr); count = 0; }
			}
			if (count > 0) { cm += ((count - 1).toString(36)); }

			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCrossNum();
			this.decodeSegment();
		},
		encodeData: function () {
			this.encodeCrossNum();
			this.encodeSegment();
		},

		decodeSegment: function () {
			const len = +this.readLine();
			for (let i = 0; i < len; i++) {
				const data = this.readLine().split(" ");
				this.board.segment.add(new Segment(this.puzzle, +data[0], +data[1], +data[2], +data[3]));
			}
		},
		encodeSegment: function () {
			const fio = this, segs = this.board.segment;
			this.writeLine(segs.length);
			segs.each(function (seg) {
				fio.writeLine([seg.bx1, seg.by1, seg.bx2, seg.by2].join(" "));
			});
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkSegmentExist",
			"checkSegmentPoint",
			"checkSegmentBranch",
			"checkSegmentOverPoint",
			"checkDuplicateSegment",
			"checkDifferentLetter",
			"checkRightAngle",
			"checkOneSegmentLoop",
			"checkSegmentDeadend",
			"checkAlonePoint",
			"checkConsequentLetter"
		],

		checkSegmentExist: function () {
			if (this.board.segment.length === 0) { this.failcode.add("brNoLine"); }
		},

		checkAlonePoint: function () {
			this.checkSegment(function (cross) { return (cross.lcnt < 2 && cross.qnum !== -1); }, "nmLineLt2");
		},
		checkSegmentPoint: function () {
			this.checkSegment(function (cross) { return (cross.lcnt > 0 && cross.qnum === -1); }, "lnIsolate");
		},
		checkSegmentBranch: function () {
			this.checkSegment(function (cross) { return (cross.lcnt > 2); }, "lnBranch");
		},
		checkSegmentDeadend: function () {
			this.checkSegment(function (cross) { return (cross.lcnt === 1); }, "lnDeadEnd");
		},
		checkSegment: function (func: (cross: Cross) => boolean, code: string) {
			let result = true, bd = this.board;
			for (let c = 0; c < bd.cross.length; c++) {
				const cross = bd.cross[c];
				if (!func(cross)) { continue; }

				result = false;
				if (this.checkOnly) { break; }
				cross.seterr(1);
			}
			if (!result) {
				this.failcode.add(code);
				bd.segment.setnoerr();
			}
		},

		checkOneSegmentLoop: function () {
			let bd = this.board, paths = bd.linegraph.components, validcount = 0;
			for (let r = 0; r < paths.length; r++) {
				//@ts-ignore
				if (paths[r].length === 0) { continue; }
				validcount++;
				if (validcount <= 1) { continue; }

				this.failcode.add("lnPlLoop");
				bd.segment.setnoerr();
				paths[r].setedgeerr(1);
				break;
			}
		},

		checkSegmentOverPoint: function () {
			let result = true, bd = this.board, segs = bd.segment;
			segs.each(function (seg) {
				const lattice = bd.getLatticePoint(seg.bx1, seg.by1, seg.bx2, seg.by2);
				for (let n = 0; n < lattice.length; n++) {
					seg.seterr(1);
					bd.cross[lattice[n]].seterr(1);
					result = false;
				}
			});
			if (!result) {
				this.failcode.add("lnPassOver");
				segs.setnoerr();
			}
		},

		checkDifferentLetter: function () {
			let result = true, bd = this.board, segs = bd.segment;
			segs.each(function (seg) {
				const cross1 = seg.sideobj[0], cross2 = seg.sideobj[1];
				if (cross1.qnum !== -2 && cross2.qnum !== -2 && cross1.qnum !== cross2.qnum) {
					seg.seterr(1);
					cross1.seterr(1);
					cross2.seterr(1);
					result = false;
				}
			});
			if (!result) {
				this.failcode.add("nmConnDiff");
				segs.setnoerr();
			}
		},

		checkConsequentLetter: function () {
			const count: Record<number, number[]> = {}, qnlist = [], bd = this.board;
			// この関数に来る時は、線は黒－黒、黒－文字、文字－文字(同じ)のいずれか
			for (let c = 0; c < bd.cross.length; c++) {
				const qn = bd.cross[c].qnum;
				if (qn >= 0) { count[qn] = [0, 0, 0]; }
			}
			for (let c = 0; c < bd.cross.length; c++) {
				const qn = bd.cross[c].qnum;
				if (qn >= 0) {
					if (count[qn][0] === 0) { qnlist.push(qn); }
					count[qn][0]++;
				}
			}
			bd.segment.each(function (seg) {
				const cross1 = seg.sideobj[0], cross2 = seg.sideobj[1];
				if (cross1.qnum >= 0 && cross2.qnum >= 0 && cross1.qnum === cross2.qnum) {
					const qn = cross1.qnum; if (qn >= 0) { count[qn][1]++; }
				}
				else if (cross1.qnum >= 0 || cross2.qnum >= 0) {
					let qn: number
					qn = cross1.qnum; if (qn >= 0) { count[qn][2]++; }
					qn = cross2.qnum; if (qn >= 0) { count[qn][2]++; }
				}
			});
			for (let i = 0; i < qnlist.length; i++) {
				const qn = qnlist[i];
				if (count[qn][2] === 2 && (count[qn][1] === count[qn][0] - 1)) { continue; }

				this.failcode.add("nmNotConseq");
				if (this.checkOnly) { break; }
				bd.cross.filter(function (cross) { return cross.qnum === qn; }).seterr(1);
			}
		},

		checkDuplicateSegment: function () {
			let result = true, segs = this.board.segment, len = segs.length;
			allloop:
			for (let i = 0; i < len; i++) {
				for (let j = i + 1; j < len; j++) {
					const seg1 = segs[i], seg2 = segs[j];
					if (seg1 === null || seg2 === null || !seg1.isOverLapSegment(seg2)) { continue; }

					result = false;
					if (this.checkOnly) { break allloop; }
					seg1.seterr(1);
					seg2.seterr(1);
				}
			}
			if (!result) {
				this.failcode.add("lnOverlap");
				segs.setnoerr();
			}
		},

		checkRightAngle: function () {
			let result = true, segs = this.board.segment, len = segs.length;
			allloop:
			for (let i = 0; i < len; i++) {
				for (let j = i + 1; j < len; j++) {
					const seg1 = segs[i], seg2 = segs[j];
					if (seg1 === null || seg2 === null || !seg1.isCrossing(seg2) || seg1.isRightAngle(seg2)) { continue; }

					result = false;
					if (this.checkOnly) { break allloop; }
					seg1.seterr(1);
					seg2.seterr(1);
				}
			}
			if (!result) {
				this.failcode.add("lnRightAngle");
				segs.setnoerr();
			}
		}
	},

	FailCode: {
		lnDeadEnd: ["途中で途切れている線があります。", "There is a dead-end segment."],
		lnBranch: ["分岐している線があります。", "There is a branched segment."],
		lnPlLoop: ["輪っかが一つではありません。", "There are plural loops."],
		lnIsolate: ["線が丸のないところから出ています。", "A segment comes from out of circle."],
		lnPassOver: ["線が丸を通過しています。", "A segment passes over a circle."],
		lnOverlap: ["線が同一直線上で重なっています。", "Plural segments are overlapped."],
		lnRightAngle: ["線が直角に交差していません。", "Segments don't intersect at a right angle."],
		nmConnDiff: ["異なる文字が直接繋がっています。", "Different Letters are connected directly."],
		nmNotConseq: ["同じ文字がひとつながりになっていません。", "Same Letters are not consequent."],
		nmLineLt2: ["線が2本出ていない丸があります。", "A circle doesn't have two segments."],
		brNoLine: ["線が存在していません。", "There is no segment."]
	}
});


class Segment extends BoardPiece {
	//@ts-ignore
	override group = "segment" as unknown as IGroup
	bx1: number;		// 端点1のX座標(border座標系)を保持する
	bx2: number;		// 端点2のX座標(border座標系)を保持する
	by1: number;		// 端点1のY座標(border座標系)を保持する
	by2: number;		// 端点2のY座標(border座標系)を保持する
	dx: number;		// X座標の差分を保持する
	dy: number;		// Y座標の差分を保持する
	sideobj: [Cross | null, Cross | null];	// 2つの端点を指すオブジェクトを保持する
	lattices: any[]
	path: any
	constructor(puzzle: Puzzle, bx1: number, by1: number, bx2: number, by2: number) {
		super(puzzle)
		this.path = null;
		this.isnull = true;

		this.sideobj = [null, null];	// 2つの端点を指すオブジェクトを保持する

		this.bx1 = bx1;		// 端点1のX座標(border座標系)を保持する
		this.by1 = by1;		// 端点1のY座標(border座標系)を保持する
		this.bx2 = bx2;		// 端点2のX座標(border座標系)を保持する
		this.by2 = by2;		// 端点2のY座標(border座標系)を保持する

		this.dx = 0;	// X座標の差分を保持する
		this.dy = 0;	// Y座標の差分を保持する

		this.lattices = [];	// 途中で通過する格子点を保持する

		this.error = 0;
		this.trial = 0;

		this.setpos(bx1, by1, bx2, by2);
	}
	setpos(bx1: number, by1: number, bx2: number, by2: number) {
		this.sideobj[0] = this.board.getx(bx1, by1);
		this.sideobj[1] = this.board.getx(bx2, by2);

		this.bx1 = bx1;
		this.by1 = by1;
		this.bx2 = bx2;
		this.by2 = by2;

		this.dx = (bx2 - bx1);
		this.dy = (by2 - by1);

		this.setLattices();
	}
	setLattices() {
		// ユークリッドの互助法で最大公約数を求める
		let div = (this.dx >> 1), n = (this.dy >> 1), tmp: number;
		div = (div < 0 ? -div : div); n = (n < 0 ? -n : n);
		if (div < n) { tmp = div; div = n; n = tmp; } // (m,n)=(0,0)は想定外
		while (n > 0) { tmp = (div % n); div = n; n = tmp; }

		// div-1が途中で通る格子点の数になってる
		this.lattices = [];
		for (let a = 1; a < div; a++) {
			const bx = this.bx1 + this.dx * (a / div);
			const by = this.by1 + this.dy * (a / div);
			const cross = this.board.getx(bx, by);
			this.lattices.push([bx, by, cross.id]);
		}
	}

	override seterr(num: number) {
		if (this.board.isenableSetError()) { this.error = num; }
	}

	//---------------------------------------------------------------------------
	// addOpe()  履歴情報にプロパティの変更を通知する
	//---------------------------------------------------------------------------
	override addOpe(old: number, num: number) {
		this.puzzle.opemgr.add(new SegmentOperation(this.board.puzzle, this, old, num));
	}

	//---------------------------------------------------------------------------
	// seg.isRightAngle() 2本のsegmentが直角かどうか判定する
	// seg.isParallel()   2本のsegmentが平行かどうか判定する
	// seg.isCrossing()   2本のsegmentが平行でなく交差しているかどうか判定する
	// seg.isOverLapSegment() 2本のsegmentが平行でさらに重なっているかどうか判定する
	//---------------------------------------------------------------------------
	isRightAngle(seg: Segment) {
		/* 傾きベクトルの内積が0かどうか */
		return ((this.dx * seg.dx + this.dy * seg.dy) === 0);
	}
	isParallel(seg: Segment) {
		const vert1 = (this.dx === 0), vert2 = (seg.dx === 0); // 縦線
		const horz1 = (this.dy === 0), horz2 = (seg.dy === 0); // 横線
		if (vert1 && vert2) { return true; } // 両方縦線
		if (horz1 && horz2) { return true; } // 両方横線
		if (!vert1 && !vert2 && !horz1 && !horz2) { // 両方ナナメ
			return (this.dx * seg.dy === seg.dx * this.dy);
		}
		return false;
	}
	isCrossing(seg: Segment) {
		/* 平行ならここでは対象外 */
		if (this.isParallel(seg)) { return false; }

		/* X座標,Y座標が重なっているかどうか調べる */
		if (!this.isOverLapRect(seg.bx1, seg.by1, seg.bx2, seg.by2)) { return false; }

		const bx11 = this.bx1, bx12 = this.bx2, by11 = this.by1, by12 = this.by2, dx1 = this.dx, dy1 = this.dy;
		const bx21 = seg.bx1, bx22 = seg.bx2, by21 = seg.by1, by22 = seg.by2, dx2 = seg.dx, dy2 = seg.dy;

		/* 交差している位置を調べる */
		if (dx1 === 0) { /* 片方の線だけ垂直 */
			let _by0 = dy2 * (bx11 - bx21) + by21 * dx2, t = dx2;
			if (t < 0) { _by0 *= -1; t *= -1; } const _by11 = by11 * t, _by12 = by12 * t;
			if (_by11 < _by0 && _by0 < _by12) { return true; }
		}
		else if (dx2 === 0) { /* 片方の線だけ垂直 */
			let _by0 = dy1 * (bx21 - bx11) + by11 * dx1, t = dx1;
			if (t < 0) { _by0 *= -1; t *= -1; } const _by21 = by21 * dx1, _by22 = by22 * dx1;
			if (_by21 < _by0 && _by0 < _by22) { return true; }
		}
		else { /* 2本とも垂直でない (仕様的にbx1<bx2になるはず) */
			let _bx0 = (bx21 * dy2 - by21 * dx2) * dx1 - (bx11 * dy1 - by11 * dx1) * dx2, t = (dy2 * dx1) - (dy1 * dx2);
			if (t < 0) { _bx0 *= -1; t *= -1; } const _bx11 = bx11 * t, _bx12 = bx12 * t, _bx21 = bx21 * t, _bx22 = bx22 * t;
			if ((_bx11 < _bx0 && _bx0 < _bx12) && (_bx21 < _bx0 && _bx0 < _bx22)) { return true; }
		}
		return false;
	}
	/* 同じ傾きで重なっているSegmentかどうかを調べる */
	isOverLapSegment(seg: Segment) {
		if (!this.isParallel(seg)) { return false; }
		if (this.dx === 0 && seg.dx === 0) { // 2本とも垂直の時
			if (this.bx1 === seg.bx1) { // 垂直で両方同じX座標
				if (this.isOverLap(this.by1, this.by2, seg.by1, seg.by2)) { return true; }
			}
		}
		else { // 垂直でない時 => bx=0の時のY座標の値を比較 => 割り算にならないように展開
			if ((this.dx * this.by1 - this.bx1 * this.dy) * seg.dx === (seg.dx * seg.by1 - seg.bx1 * seg.dy) * this.dx) {
				if (this.isOverLap(this.bx1, this.bx2, seg.bx1, seg.bx2)) { return true; }
			}
		}
		return false;
	}

	//---------------------------------------------------------------------------
	// seg.isOverLapRect() (x1,y1)-(x2,y2)の長方形内か縦か横にいることを判定する
	// seg.isAreaInclude() (x1,y1)-(x2,y2)の長方形に含まれるかどうかを判定する
	// seg.isOverLap()     一次元軸上で(a1-a2)と(b1-b2)の範囲が重なっているかどうか判定する
	// seg.ispositive()    (端点1-P)と(P-端点2)で外積をとった時のZ軸方向の符号がが正か負か判定する
	//                     端点1-P-端点2の経路が左曲がりの時、値が正になります (0は直線)
	//---------------------------------------------------------------------------
	isOverLapRect(bx1: number, by1: number, bx2: number, by2: number) {
		return (this.isOverLap(this.bx1, this.bx2, bx1, bx2) &&
			this.isOverLap(this.by1, this.by2, by1, by2));
	}
	isAreaInclude(x1: number, y1: number, x2: number, y2: number) {
		if (this.isOverLapRect(x1, y1, x2, y2)) {
			let cnt = 0;
			if (this.ispositive(x1, y1)) { cnt++; }
			if (this.ispositive(x1, y2)) { cnt++; }
			if (this.ispositive(x2, y1)) { cnt++; }
			if (this.ispositive(x2, y2)) { cnt++; }
			if (cnt > 0 && cnt < 4) { return true; }
		}
		return false;
	}
	isOverLap(a1: number, a2: number, b1: number, b2: number) {
		let tmp: number;
		if (a1 > a2) { tmp = a1; a1 = a2; a2 = tmp; } if (b1 > b2) { tmp = b1; b1 = b2; b2 = tmp; }
		return (b1 < a2 && a1 < b2);
	}
	ispositive(bx: number, by: number) {
		return ((bx - this.bx1) * (this.by2 - by) - (this.bx2 - bx) * (by - this.by1) > 0);
	}
}



class SegmentList extends PieceList<Segment> {
	override allclear() {
		this.ansclear();
	}
	override ansclear() {
		// Segmentのclearとは配列を空にすること
		for (let i = this.length - 1; i >= 0; i--) { this.remove(this[i]); }
	}
	override errclear() {
		for (let i = 0; i < this.length; i++) { this[i].error = 0; }
	}
	override trialclear() {
		for (let i = 0; i < this.length; i++) { this[i].trial = 0; }
	}

	//---------------------------------------------------------------------------
	// segment.getRange()    SegmentListが存在する範囲を返す
	//---------------------------------------------------------------------------
	getRange(): IRange | null {
		if (this.length === 0) { return null; }
		const d = { x1: 99, x2: -1, y1: 99, y2: - 1 };
		for (let i = 0; i < this.length; i++) {
			const seg = this[i];
			if (d.x1 > seg.bx1) { d.x1 = seg.bx1; }
			if (d.x2 < seg.bx2) { d.x2 = seg.bx2; }
			if (d.y1 > seg.by1) { d.y1 = seg.by1; }
			if (d.y2 < seg.by2) { d.y2 = seg.by2; }
		}
		return d;
	}
}

class BoardSegmentList extends SegmentList {
	board: Board
	puzzle: Puzzle
	constructor(board: Board) {
		super()
		this.board = board;
		this.puzzle = board.puzzle;
	}

	override add = function (this: BoardSegmentList, ...segs: Segment[]) {
		const seg = segs[0]
		const bd = this.board;
		seg.isnull = false;

		this.push(seg);

		//@ts-ignore
		bd.getx(seg.bx1, seg.by1).seglist.add(seg);
		//@ts-ignore
		bd.getx(seg.bx2, seg.by2).seglist.add(seg);
		if (bd.isenableInfo()) { bd.linegraph.modifyInfo(seg, 'segment'); }
		seg.addOpe(0, 1);

		if (bd.trialstage > 0) { seg.trial = bd.trialstage; }
		return this.length
	}
	override remove(seg: Segment) {
		const bd = this.board;
		seg.isnull = true;

		PieceList.prototype.remove.call(this, seg);

		//@ts-ignore
		bd.getx(seg.bx1, seg.by1).seglist.remove(seg);
		//@ts-ignore
		bd.getx(seg.bx2, seg.by2).seglist.remove(seg);
		if (bd.isenableInfo()) { bd.linegraph.modifyInfo(seg, 'segment'); }
		seg.addOpe(1, 0);
		if (!!this.puzzle.canvas) {
			//@ts-ignore
			this.puzzle.painter.eraseSegment1(seg); // 描画が残りっぱなしになってしまうのを防止
		}
	}
}



class SegmentOperation extends Operation<number> {
	bx1: number
	by1: number
	bx2: number
	by2: number

	constructor(puzzle: Puzzle, seg: Segment, old: number, num: number) {
		super(puzzle)
		this.bx1 = seg.bx1;
		this.by1 = seg.by1;
		this.bx2 = seg.bx2;
		this.by2 = seg.by2;
		this.old = old;
		this.num = num;
	}
	override decode(strs: string[]) {
		if (strs[0] !== 'SG') { return false; }
		this.bx1 = +strs[1];
		this.by1 = +strs[2];
		this.bx2 = +strs[3];
		this.by2 = +strs[4];
		this.old = +strs[5];
		this.num = +strs[6];
		return true;
	}
	override toString() {
		return ['SG', this.bx1, this.by1, this.bx2, this.by2, this.old, this.num].join(',');
	}

	override exec(num: number) {
		let bx1 = this.bx1, by1 = this.by1, bx2 = this.bx2, by2 = this.by2, puzzle = this.puzzle, tmp: number;
		//@ts-ignore
		if (num === 1) { puzzle.board.segment.add(new Segment(this.puzzle, bx1, by1, bx2, by2)); }
		//@ts-ignore
		else if (num === 0) { puzzle.board.segment.remove(puzzle.board.getSegment(bx1, by1, bx2, by2)); }
		if (bx1 > bx2) { tmp = bx1; bx1 = bx2; bx2 = tmp; } if (by1 > by2) { tmp = by1; by1 = by2; by2 = tmp; }
		puzzle.painter.paintRange(bx1 - 1, by1 - 1, bx2 + 1, by2 + 1);
	}
}
