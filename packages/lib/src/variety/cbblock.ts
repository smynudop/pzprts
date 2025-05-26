//
// パズル固有スクリプト部 コンビブロック版 cbblock.js

import { AreaGraphBase, AreaRoomGraph } from "../puzzle/AreaManager";
import { Board } from "../puzzle/Board";
import type { GraphComponent } from "../puzzle/GraphBase";
import type { Border } from "../puzzle/Piece";
import { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Cbblock = createVariety({
	pid: "cbblock",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['border'], play: ['border', 'subline'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === 'left' && this.isBorderMode()) { this.inputborder(); }
					else { this.inputQsubLine(); }
				}
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) {
					this.inputborder();
				}
			}
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Border: {
		ques: 1,

		enableLineNG: true,

		// 線を引かせたくないので上書き
		isLineNG: function (): boolean { return (this.ques === 1); },

		isGround: function (): boolean { return (this.ques > 0); }
	},

	Board: {
		cols: 8,
		rows: 8,

		hascross: 1,
		hasborder: 1,
		tilegraph: null! as AreaTileGraph,
		blockgraph: null! as AreaBlockGraph,

		addExtraInfo: function () {
			this.tilegraph = this.addInfoList(AreaTileGraph);
			this.blockgraph = this.addInfoList(AreaBlockGraph);
		}
	},





	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "LIGHT",

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();
			this.drawBorders();

			this.drawBorderQsubs();

			this.drawBaseMarks();

			this.drawChassis();

			this.drawPekes();
		},

		// オーバーライド
		getBorderColor: function (border) {
			if (border.ques === 1) {
				const cell2 = border.sidecell[1];
				return ((cell2.isnull || cell2.error === 0) ? "white" : this.errbcolor1);
			}
			else if (border.qans === 1) {
				return (!border.trial ? this.qanscolor : this.trialcolor);
			}
			return null;
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeCBBlock();
		},
		encodePzpr: function (type) {
			this.encodeCBBlock();
		},

		decodeCBBlock: function () {
			const bstr = this.outbstr, bd = this.board, twi = [16, 8, 4, 2, 1];
			let pos = (bstr ? Math.min((((bd.border.length + 4) / 5) | 0), bstr.length) : 0), id = 0;
			for (let i = 0; i < pos; i++) {
				const ca = Number.parseInt(bstr.charAt(i), 32);
				for (let w = 0; w < 5; w++) {
					if (!!bd.border[id]) {
						bd.border[id].ques = (ca & twi[w] ? 1 : 0);
						id++;
					}
				}
			}
			this.outbstr = bstr.substr(pos);
		},
		encodeCBBlock: function () {
			let num = 0, pass = 0, cm = "", bd = this.board, twi = [16, 8, 4, 2, 1];
			for (let id = 0, max = bd.border.length; id < max; id++) {
				if (bd.border[id].isGround()) { pass += twi[num]; } num++;
				if (num === 5) { cm += pass.toString(32); num = 0; pass = 0; }
			}
			if (num > 0) { cm += pass.toString(32); }
			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeBorder(function (border, ca) {
				if (ca === "3") { border.ques = 0; border.qans = 1; border.qsub = 1; }
				else if (ca === "1") { border.ques = 0; border.qans = 1; }
				else if (ca === "-1") { border.ques = 1; border.qsub = 1; }
				else if (ca === "-2") { border.ques = 0; border.qsub = 1; }
				else if (ca === "2") { border.ques = 0; }
				else { border.ques = 1; }
			});
		},
		encodeData: function () {
			this.encodeBorder(function (border) {
				if (border.qans === 1 && border.qsub === 1) { return "3 "; }
				else if (border.qans === 1) { return "1 "; }
				else if (border.ques === 1 && border.qsub === 1) { return "-1 "; }
				else if (border.ques === 0 && border.qsub === 1) { return "-2 "; }
				else if (border.ques === 0) { return "2 "; }
				else { return "0 "; }
			});
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkSingleBlock",
			"checkBlockNotRect",
			"checkDifferentShapeBlock",
			"checkLargeBlock"
		],

		checkBlockNotRect: function () {
			this.checkAllArea(this.board.blockgraph, function (w, h, a, n) { return (w * h !== a); }, "bkRect");
		},

		checkSingleBlock: function () { this.checkMiniBlockCount(1, "bkSubLt2"); },
		checkLargeBlock: function () { this.checkMiniBlockCount(3, "bkSubGt2"); },
		checkMiniBlockCount: function (flag: number, code: string) {
			const blocks = this.board.blockgraph.components;
			for (let r = 0; r < blocks.length; r++) {
				const cnt = blocks[r].dotcnt;
				if ((flag === 1 && cnt > 1) || (flag === 3 && cnt <= 2)) { continue; }

				this.failcode.add(code);
				if (this.checkOnly) { break; }
				blocks[r].clist.seterr(1);
			}
		},

		checkDifferentShapeBlock: function () {
			const sides = this.board.blockgraph.getSideAreaInfo();
			for (let i = 0; i < sides.length; i++) {
				const area1 = sides[i][0], area2 = sides[i][1];
				if (this.isDifferentShapeBlock(area1, area2)) { continue; }

				this.failcode.add("bsSameShape");
				if (this.checkOnly) { break; }
				area1.clist.seterr(1);
				area2.clist.seterr(1);
			}
		},
		isDifferentShapeBlock: function (area1: CbBlockGraphComponent, area2: CbBlockGraphComponent) {
			if (area1.dotcnt !== 2 || area2.dotcnt !== 2 || area1.size !== area2.size) { return true; }
			const s1 = getBlockShapes(this.board, area1.clist), s2 = getBlockShapes(this.board, area2.clist);
			const t1 = ((s1.cols === s2.cols && s1.rows === s2.rows) ? 0 : 4);
			const t2 = ((s1.cols === s2.rows && s1.rows === s2.cols) ? 8 : 4);
			for (let t = t1; t < t2; t++) { if (s2.data[0] === s1.data[t]) { return false; } }
			return true;
		}
	},

	FailCode: {
		bkRect: ["ブロックが四角形になっています。", "A block is rectangle."],
		bsSameShape: ["同じ形のブロックが接しています。", "The blocks that has the same shape are adjacent."],
		bkSubLt2: ["ブロックが1つの点線からなる領域で構成されています。", "A block has one area framed by dotted line."],
		bkSubGt2: ["ブロックが3つ以上の点線からなる領域で構成されています。", "A block has three or more areas framed by dotted line."]
	}
});

type CbBlockGraphComponent = GraphComponent & {
	dotcnt: number;
	size: number
}

const getBlockShapes = function (bd: Board, clist: CellList & { shape?: any }) {
	if (!!clist.shape) { return clist.shape; }

	const d = clist.getRectSize();
	const data: (1 | 0)[][] = [[], [], [], [], [], [], [], []];
	const shapes = { cols: d.cols, rows: d.rows, data: [] as string[] };

	for (let by = 0; by < 2 * d.rows; by += 2) {
		for (let bx = 0; bx < 2 * d.cols; bx += 2) {
			data[0].push(clist.includes(bd.getc(d.x1 + bx, d.y1 + by)) ? 1 : 0);
			data[1].push(clist.includes(bd.getc(d.x1 + bx, d.y2 - by)) ? 1 : 0);
		}
	}
	for (let bx = 0; bx < 2 * d.cols; bx += 2) {
		for (let by = 0; by < 2 * d.rows; by += 2) {
			data[4].push(clist.includes(bd.getc(d.x1 + bx, d.y1 + by)) ? 1 : 0);
			data[5].push(clist.includes(bd.getc(d.x1 + bx, d.y2 - by)) ? 1 : 0);
		}
	}
	data[2] = data[1].concat().reverse(); data[3] = data[0].concat().reverse();
	data[6] = data[5].concat().reverse(); data[7] = data[4].concat().reverse();
	for (let i = 0; i < 8; i++) { shapes.data[i] = data[i].join(''); }
	clist.shape = shapes
	return shapes;
}

class AreaTileGraph extends AreaGraphBase {
	override enabled = true
	override relation = { 'border.ques': 'separator' }
	override setComponentRefs(obj: any, component: any) { obj.tile = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.tilenodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.tilenodes = []; }

	override isnodevalid(nodeobj: any) { return true; }
	override isedgevalidbylinkobj(border: any) { return border.isGround(); }
}
class AreaBlockGraph extends AreaRoomGraph<CbBlockGraphComponent> {
	override enabled = true
	override getComponentRefs(obj: any) { return obj.block; } // getSideAreaInfo用
	override setComponentRefs(obj: any, component: any) { obj.block = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.blocknodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.blocknodes = []; }

	override isedgevalidbylinkobj(border: Border) { return border.qans === 0; }

	override setExtraData(component: CbBlockGraphComponent) {
		let cnt = 0;
		component.clist = new CellList(component.getnodeobjs())
		const clist = component.clist;
		component.size = clist.length;

		//@ts-ignore	
		const tiles = this.board.tilegraph.components;
		for (let i = 0; i < tiles.length; i++) { tiles[i].count = 0; }
		//@ts-ignore	
		for (let i = 0; i < clist.length; i++) { clist[i].tile.count++; }
		for (let i = 0; i < tiles.length; i++) { if (tiles[i].count > 0) { cnt++; } }
		component.dotcnt = cnt;
	}
}