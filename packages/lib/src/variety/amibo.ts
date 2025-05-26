//
// パズル固有スクリプト部 あみぼー版 amibo.js

import { AreaGraphBase, AreaShadeGraph } from "../puzzle/AreaManager";
import { GraphBase, type GraphComponent, type GraphNode } from "../puzzle/GraphBase";
import { Graphic } from "../puzzle/Graphic";
import { type Border, type Cell, isCell } from "../puzzle/Piece";
import { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Amibo = createVariety({
	pid: "amibo",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['number', 'clear'], play: ['bar', 'peke'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === 'left') { this.inputTateyoko(); }
					else if (this.btn === 'right') { this.inputpeke(); }
				}
				if (this.mouseend && this.notInputted()) {
					if (this.inputpeke_onend()) { return; }
					this.clickTateyoko();
				}
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart) { this.inputqnum(); }
			}
		},

		clickTateyoko: function () {
			const cell = this.getcell();
			if (cell.isnull || cell.isNum()) { return; }

			cell.setQans((this.btn === 'left' ? { 0: 12, 12: 13, 13: 11, 11: 0 } : { 0: 11, 11: 13, 13: 12, 12: 0 })[cell.qans]);
			cell.draw();
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
		numberRemainsUnshaded: true,
		net: null! as GraphComponent,
		barnodes: [] as GraphNode<BarGraphComponent>[],

		maxnum: function (): number {
			const bd = this.board, bx = this.bx, by = this.by;
			const col = (((bx < (bd.maxbx >> 1)) ? (bd.maxbx - bx) : bx) >> 1);
			const row = (((by < (bd.maxby >> 1)) ? (bd.maxby - by) : by) >> 1);
			return Math.max(col, row);
		},
		minnum: 2,

		getPoleBar: function (): BarGraphComponent[] {
			let adc = this.adjacent, cell2 = adc.top, bars: BarGraphComponent[] = [];
			cell2 = adc.top; if (!cell2.isnull && (cell2.qans === 11 || cell2.qans === 12)) { bars.push(cell2.barnodes[0].component!); }
			cell2 = adc.bottom; if (!cell2.isnull && (cell2.qans === 11 || cell2.qans === 12)) { bars.push(cell2.barnodes[0].component!); }
			cell2 = adc.left; if (!cell2.isnull && (cell2.qans === 11 || cell2.qans === 13)) { bars.push(cell2.barnodes[(cell2.barnodes.length < 2) ? 0 : 1].component!); }
			cell2 = adc.right; if (!cell2.isnull && (cell2.qans === 11 || cell2.qans === 13)) { bars.push(cell2.barnodes[(cell2.barnodes.length < 2) ? 0 : 1].component!); }
			return bars;
		}
	},
	Board: {
		hasborder: 1,

		cols: 8,
		rows: 8,
		netgraph: null! as AreaNetGraph,
		bargraph: null! as AreaBarGraph,

		addExtraInfo: function () {
			this.netgraph = this.addInfoList(AreaNetGraph);
			this.bargraph = this.addInfoList(AreaBarGraph);
		},

		irowakeRemake: function () {
			this.netgraph.newIrowake();
		}
	},
	BoardExec: {
		adjustBoardData: function (key, d) {
			if (key & this.TURN) { // 回転だけ
				const tans: Record<number, number> = { 0: 0, 11: 11, 12: 13, 13: 12 };
				const clist = this.board.cell;
				for (let i = 0; i < clist.length; i++) {
					const cell = clist[i];
					cell.setQans(tans[cell.qans]);
				}
			}
		}
	},



	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		hideHatena: true,

		irowake: true,

		gridcolor_type: "LIGHT",

		numbercolor_func: "fixed",

		circleratio: [0.45, 0.40],

		setRange: function (x1, y1, x2, y2) {
			Graphic.prototype.setRange.call(this, x1 - 2, y1 - 2, x2 + 2, y2 + 2);
		},
		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();

			this.drawTateyokos();
			this.drawTateyokos_sub();

			this.drawCircledNumbers();

			this.drawPekeBorder();

			this.drawChassis();

			this.drawTarget();
		},

		// 白丸と線の間に隙間があいてしまうので、隙間部分を描画する
		drawTateyokos_sub: function () {
			const g = this.vinc('cell_tateyoko', 'crispEdges', true); /* 同じレイヤでよい */

			g.fillStyle = this.linecolor;
			const clist = this.range.cells;
			const bw = this.bw, bh = this.bh;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i], isnum = cell.isNum();

				const lw = Math.max(bw / 3, 3);			//LineWidth
				const lp = (bw - lw / 2);					//LinePadding
				const px = cell.bx * bw, py = cell.by * bh;

				let cell2 = cell.adjacent.top, qa = cell2.qans;
				g.vid = "c_bars1a_" + cell.id;
				if (isnum && (qa === 11 || qa === 12)) {
					g.fillStyle = this.getBarColor(cell2, true);
					g.fillRect(px - bw + lp, py - bh, lw, bh);
				}
				else { g.vhide(); }

				cell2 = cell.adjacent.bottom
				qa = cell2.qans;
				g.vid = "c_bars1b_" + cell.id;
				if (isnum && (qa === 11 || qa === 12)) {
					g.fillStyle = this.getBarColor(cell2, true);
					g.fillRect(px - bw + lp, py + 1, lw, bh);
				}
				else { g.vhide(); }

				cell2 = cell.adjacent.left
				qa = cell2.qans;
				g.vid = "c_bars2a_" + cell.id;
				if (isnum && (qa === 11 || qa === 13)) {
					g.fillStyle = this.getBarColor(cell2, false);
					g.fillRect(px - bw, py - bh + lp, bw, lw);
				}
				else { g.vhide(); }

				cell2 = cell.adjacent.right
				qa = cell2.qans;
				g.vid = "c_bars2b_" + cell.id;
				if (isnum && (qa === 11 || qa === 13)) {
					g.fillStyle = this.getBarColor(cell2, false);
					g.fillRect(px + 1, py - bh + lp, bw, lw);
				}
				else { g.vhide(); }
			}
		},

		drawPekeBorder: function () {
			const g = this.vinc('border_pbd', 'crispEdges', true);

			const rw = this.bw * 0.6;
			const lm = this.lm;

			const blist = this.range.borders;
			for (let i = 0; i < blist.length; i++) {
				const border = blist[i];
				g.vid = "b_qsub2_" + border.id;
				if (border.qsub === 2) {
					const px = border.bx * this.bw, py = border.by * this.bh;
					g.fillStyle = (!border.trial ? "rgb(64,64,64)" : this.trialcolor);
					if (border.isVert()) { g.fillRectCenter(px, py, lm, rw + lm); }
					else { g.fillRectCenter(px, py, rw + lm, lm); }
				}
				else { g.vhide(); }
			}
		},

		getBarColor: function (cell, vert) {
			let err = cell.error, isErr = (err === 1 || err === 4 || ((err === 5 && vert) || (err === 6 && !vert))), color = "";
			this.addlw = 0;
			if (cell.trial && this.puzzle.execConfig('irowake')) { this.addlw = -this.lm; }
			else if (isErr) { this.addlw = 1; }

			if (isErr) { color = this.errlinecolor; }
			else if (err !== 0) { color = this.noerrcolor; }
			//@ts-ignore
			else if (this.puzzle.execConfig('irowake') && cell.net && cell.net.color) { color = cell.net.color; }
			else if (cell.trial) { color = this.trialcolor; }
			else { color = this.linecolor; }
			return color;
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeNumber10();
		},
		encodePzpr: function (type) {
			this.encodeNumber10();
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCell(function (cell, ca) {
				if (ca === "l") { cell.qans = 12; }
				else if (ca === "-") { cell.qans = 13; }
				else if (ca === "+") { cell.qans = 11; }
				else if (ca === "#") { cell.qnum = -2; }
				else if (ca !== ".") { cell.qnum = +ca; }
			});
			this.decodeBorderLine();
		},
		encodeData: function () {
			this.encodeCell(function (cell) {
				if (cell.qans === 12) { return "l "; }
				else if (cell.qans === 13) { return "- "; }
				else if (cell.qans === 11) { return "+ "; }
				else if (cell.qnum >= 0) { return cell.qnum + " "; }
				else if (cell.qnum === -2) { return "# "; }
				else { return ". "; }
			});
			this.encodeBorderLine();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkBarExist+",
			"checkNotMultiBar",

			"checkLoop_amibo",
			"checkLongBar",
			"checkCrossedLength",
			"checkShortBar",

			"checkSingleBar",

			"checkAllBarConnect+"
		],

		checkBarExist: function () {
			if (!this.board.puzzle.execConfig('allowempty')) {
				if (this.board.netgraph.components.length > 0) { return; }
				this.failcode.add("brNoLine");
			}
		},

		checkNotMultiBar: function () { this.checkOutgoingBars(1, "nmLineGt1"); },
		checkSingleBar: function () { this.checkOutgoingBars(2, "nmNoLine"); },
		checkOutgoingBars: function (type: number, code: string) {
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (!cell.isNum()) { continue; }
				const poles = cell.getPoleBar();
				if ((type === 1 && poles.length <= 1) || (type === 2 && poles.length > 0)) { continue; }

				this.failcode.add(code);
				if (this.checkOnly) { break; }
				cell.seterr(1);
			}
		},
		checkLongBar: function () { this.checkPoleLength(1, "lbLenGt"); },
		checkShortBar: function () { this.checkPoleLength(2, "lbLenLt"); },
		checkPoleLength: function (type: number, code: string) {
			let result = true, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (!cell.isValidNum()) { continue; }

				// polebarの数は0か1 (checkNotMultiBarが先にcheckされるため)
				const bar = cell.getPoleBar()[0];
				if (!bar) { continue; }

				const qn = cell.getNum(), clist = bar.clist, llen = clist.length;
				if ((type === 1 && llen <= qn) || (type === 2 && llen >= qn)) { continue; }

				result = false;
				if (this.checkOnly) { break; }
				cell.seterr(1);
				setErrorBar(clist, bar.vert);
			}
			if (!result) {
				this.failcode.add(code);
				bd.cell.filter(function (cell) { return cell.noNum(); }).setnoerr();
			}
		},
		checkCrossedLength: function () {
			let result = true, bd = this.board, bars = bd.bargraph.components;
			for (let id = 0, max = bars.length; id < max; id++) {
				let check = false, bar = bars[id], links = bd.bargraph.getCrossBars(bar);
				for (let i = 0, len = links.length; i < len; i++) {
					if (bar.size === links[i].size) { check = true; break; }
				}
				if (check) { continue; }

				result = false;
				if (this.checkOnly) { break; }
				setErrorBar(bar.clist, bar.vert);
			}
			if (!result) {
				this.failcode.add("lbNotCrossEq");
				bd.cell.filter(function (cell) { return cell.noNum(); }).setnoerr();
			}
		},

		checkAllBarConnect: function () {
			this.checkOneArea(this.board.netgraph, "lbDivide");
		},

		checkLoop_amibo: function () {
			const bd = this.board, nets = bd.netgraph.components;
			for (let r = 0; r < nets.length; r++) {
				if (nets[r].circuits === 0) { continue; }

				this.failcode.add("lbLoop");
				if (this.checkOnly) { return; }

				bd.cell.filter(function (cell) { return cell.noNum(); }).setnoerr();
				this.searchloop(nets[r]).seterr(4);
			}
		},
		// ぬりめいずのものと同じ
		searchloop: function (component: GraphComponent) {
			// Loopがない場合は何もしないでreturn
			if (component.circuits <= 0) { return (new CellList()); }

			// どこにLoopが存在するか判定を行う
			const bd = this.board;
			const errclist = new CellList();
			let history: (Cell | Border)[] = [component.clist[0]], prevcell = null;
			const steps: Record<number, number> = {}, rows = (bd.maxbx - bd.minbx);

			while (history.length > 0) {
				let obj = history[history.length - 1], nextobj: Cell | Border = null!;
				let step = steps[obj.by * rows + obj.bx];
				if (step === void 0) {
					step = steps[obj.by * rows + obj.bx] = history.length - 1;
				}
				// ループになった場合 => ループフラグをセットする
				else if ((history.length - 1) > step) {
					for (let i = history.length - 2; i >= 0; i--) {
						const p = history[i];
						if (isCell(p)) { errclist.add(p); }
						if (history[i] === obj) { break; }
					}
				}

				if (isCell(obj)) {
					prevcell = obj;
					//@ts-ignore
					for (let i = 0; i < obj.netnodes[0].nodes.length; i++) {
						//@ts-ignore
						const cell2 = obj.netnodes[0].nodes[i].obj;
						const border = bd.getb((obj.bx + cell2.bx) >> 1, (obj.by + cell2.by) >> 1);
						if (steps[border.by * rows + border.bx] === void 0) { nextobj = border; break; }
					}
				}
				else { // borderの時
					for (let i = 0; i < obj.sidecell.length; i++) {
						const cell = obj.sidecell[i];
						if ((cell !== prevcell) && (cell !== history[history.length - 2])) { nextobj = cell; break; }
					}
				}
				if (!!nextobj) { history.push(nextobj); }
				else { history.pop(); }
			}

			return errclist;
		}
	},

	FailCode: {
		lbDivide: ["棒が１つに繋がっていません。", "Bars are divided."],
		lbLenGt: ["白丸から出る棒の長さが長いです。", "The length of the bar is long."],
		lbLenLt: ["白丸から出る棒の長さが短いです。", "The length of the bar is short."],
		lbLoop: ["棒で輪っかができています。", "There is a looped bars."],
		lbNotCrossEq: ["同じ長さの棒と交差していません。", "A bar doesn't cross the bar whose length is the same."],
		nmLineGt1: ["白丸に線が2本以上つながっています。", "Prural lines connect to a white circle."],
		nmNoLine: ["白丸に線がつながっていません。", "No bar connects to a white circle."]
	}
});



class AreaNetGraph extends AreaGraphBase {
	override enabled = true
	override relation = { 'cell.qans': 'node' }
	override coloring = true
	override setComponentRefs(obj: any, component: any) { obj.net = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.netnodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.netnodes = []; }
	override isnodevalid(cell: Cell) { return (cell.qans > 0); }
	override isedgevalidbynodeobj(cell1: Cell, cell2: Cell) {
		const dir = cell1.getdir(cell2, 2);
		if (dir === cell1.UP || dir === cell1.DN) { return !(cell1.qans === 0 || cell1.qans === 13 || cell2.qans === 0 || cell2.qans === 13); }
		else if (dir === cell1.LT || dir === cell1.RT) { return !(cell1.qans === 0 || cell1.qans === 12 || cell2.qans === 0 || cell2.qans === 12); }
		return false;
	}

	override setExtraData(component: GraphComponent) {
		component.clist = new CellList(component.getnodeobjs());
		if (!component.color) {
			component.color = this.puzzle.painter.getNewLineColor();
		}
	}
	override getLongColor(components: GraphComponent[]) {
		return GraphBase.prototype.getLongColor.call(this, components);
	}
	override setLongColor(components: GraphComponent[], longColor: string) {
		GraphBase.prototype.setLongColor.call(this, components, longColor);
	}
	override repaintNodes(components: GraphComponent[]) {

		AreaShadeGraph.prototype.repaintNodes.call(this, components);
	}
	override newIrowake() {
		GraphBase.prototype.newIrowake.call(this);
	}
}

type BarGraphComponent = GraphComponent & {
	size: number
	vert: boolean;
}
class AreaBarGraph extends AreaGraphBase<BarGraphComponent> {
	override enabled = true
	override relation = { 'cell.qans': 'node' }
	override setComponentRefs(obj: any, component: any) { obj.bar = component; } // 2つのbarが設定されることがあるため信頼できない
	override getObjNodeList(nodeobj: any) { return nodeobj.barnodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.barnodes = []; }

	override isnodevalid(cell: Cell) { return (cell.qans > 0); }
	override isedgevalidbynodeobj(cell1: Cell, cell2: Cell) {
		return AreaNetGraph.prototype.isedgevalidbynodeobj.call(this, cell1, cell2);
	}

	override calcNodeCount(cell: Cell) {
		return ({ 0: 0, 11: 2, 12: 1, 13: 1 } as const)[cell.qans as 0 | 11 | 12 | 13];
	}
	override removeEdgeByNodeObj(cell: Cell) {
		// Edgeの除去
		const sidenodeobj = this.getSideObjByNodeObj(cell);
		const nodes1 = this.getObjNodeList(cell);
		for (let i = 0; i < sidenodeobj.length; i++) {
			const dir = cell.getdir(sidenodeobj[i], 2), lrlink = (dir === cell.LT || dir === cell.RT);
			const nodes2 = this.getObjNodeList(sidenodeobj[i]);
			const node1 = nodes1[(nodes1.length < 2 || !lrlink) ? 0 : 1];
			const node2 = nodes2[(nodes2.length < 2 || !lrlink) ? 0 : 1];
			if (!!node1 && !!node2) { this.removeEdge(node1, node2); }
		}

		// Nodeを一旦取り除く
		//@ts-ignore
		for (let i = nodes1.length; i > 0; i--) { this.deleteNode(cell.barnodes[0]); }
	}
	override addEdgeByNodeObj(cell: Cell) {
		// Nodeを付加する
		for (let i = 0, len = this.calcNodeCount(cell); i < len; i++) { this.createNode(cell); }

		// Edgeの付加
		const sidenodeobj = this.getSideObjByNodeObj(cell);
		const nodes1 = this.getObjNodeList(cell);
		for (let i = 0; i < sidenodeobj.length; i++) {
			if (!this.isedgevalidbynodeobj(cell, sidenodeobj[i])) { continue; }
			const dir = cell.getdir(sidenodeobj[i], 2), lrlink = (dir === cell.LT || dir === cell.RT);
			const nodes2 = this.getObjNodeList(sidenodeobj[i]);
			const node1 = nodes1[(nodes1.length < 2 || !lrlink) ? 0 : 1];
			const node2 = nodes2[(nodes2.length < 2 || !lrlink) ? 0 : 1];
			if (!!node1 && !!node2) { this.addEdge(node1, node2); }
		}
	}

	override searchGraph() {
		const components = AreaGraphBase.prototype.searchGraph.call(this);

		//全component生成後でないとcrossbarがうまく設定できない場合があるのでsetExtraDataを設定し直す
		for (let i = 0; i < components.length; i++) { this.setExtraData(components[i]); }

		return components;
	}
	override setExtraData(component: BarGraphComponent) {
		component.clist = new CellList(component.getnodeobjs());
		component.size = component.clist.length;

		if (component.nodes.length > 1) {
			const d = component.clist.getRectSize();
			component.vert = (d.cols === 1);
		}
		else if (component.nodes[0].obj.barnodes.length === 1) {
			component.vert = (component.nodes[0].obj.qans === 12);
		}
		else {
			component.vert = (component.nodes[0].obj.barnodes.indexOf(component.nodes[0]) === 0);
		}
	}
	getCrossBars(component: GraphComponent) {
		const crossbar = [];
		for (let i = 0; i < component.nodes.length; i++) {
			const node = component.nodes[i];
			if (node.obj.barnodes.length === 2) {
				crossbar.push(node.obj.barnodes[node.obj.barnodes.indexOf(node) === 1 ? 0 : 1].component);
			}
		}
		return crossbar;
	}
}

const setErrorBar = function (clist: CellList, vert: boolean) {
	for (let i = 0; i < clist.length; i++) {
		const cell = clist[i], err = cell.error;
		if (err === 4) { /* nop*/ }
		else if (err === 5) { if (!vert) { cell.seterr(4); } }
		else if (err === 6) { if (vert) { cell.seterr(4); } }
		else { cell.seterr(vert ? 5 : 6); }
	}
}
/*
/* 互換性のための定義 
ObjectOperation: {
decode: function (strs) {
	const result = this.common.decode.call(this, strs);
	this.old = [0, 12, 13, 11][this.old];
	this.num = [0, 12, 13, 11][this.num];
	return result;
}
},

*/