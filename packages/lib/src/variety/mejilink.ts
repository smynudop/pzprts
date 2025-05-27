//
// パズル固有スクリプト部 メジリンク版 mejilink.js

import { AreaGraphBase } from "../puzzle/AreaManager";
import { Board } from "../puzzle/Board";
import type { GraphComponent } from "../puzzle/GraphBase";
import type { BorderList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Mejilink = createVariety({
	pid: "mejilink",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['info-line'], play: ['line', 'peke', 'info-line'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.btn === 'left') {
					if (this.mousestart || this.mousemove) { this.inputLine(); }
					else if (this.mouseend && this.notInputted()) {
						this.prevPos.reset();
						this.inputpeke();
					}
				}
				else if (this.btn === 'right') {
					if (this.mousestart || this.mousemove) { this.inputpeke(); }
				}
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) { this.inputborder(); }
			}
		}
	},
	Cell: {
		group: "cell",
		tile: null! as GraphComponent,
	},
	//---------------------------------------------------------
	// 盤面管理系
	Border: {
		ques: 1,

		enableLineNG: true,

		isGround: function (): boolean { return this.ques > 0; },

		// 線を引かせたくないので上書き
		isLineNG: function (): boolean { return (this.ques === 1); }
	},

	Board: {
		cols: 8,
		rows: 8,

		hasborder: 2,
		borderAsLine: true,
		tilegraph: null! as AreaTileGraph,

		addExtraInfo: function () {
			this.tilegraph = this.addInfoList(AreaTileGraph);
		},

		initBoardSize: function (col, row) {
			Board.prototype.initBoardSize.call(this, col, row);

			allclear2(this.border, false);
		}
	},

	LineGraph: {
		enabled: true
	},
	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "LIGHT",
		margin: 0.5,

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid(false);
			this.drawBorders();
			this.drawLines();

			this.drawBaseMarks();

			this.drawPekes();
		},

		// オーバーライド
		getBorderColor: function (border) {
			if (border.ques === 1) {
				const cell2 = border.sidecell[1];
				return ((cell2.isnull || cell2.error === 0) ? "white" : this.errbcolor1);
			}
			return null;
		},

		repaintParts: function (blist) {
			this.range.crosses = blist.crossinside();

			this.drawBaseMarks();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeMejilink();
		},
		encodePzpr: function (type) {
			this.encodeMejilink();
		},

		decodeMejilink: function () {
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
		encodeMejilink: function () {
			let count = 0, bd = this.board;
			const bdinside = 2 * bd.cols * bd.rows - bd.cols - bd.rows;
			for (let id = bdinside; id < bd.border.length; id++) { if (bd.border[id].isGround()) { count++; } }
			let num = 0, pass = 0, cm = "", twi = [16, 8, 4, 2, 1];
			for (let id = 0, max = (count === 0 ? bdinside : bd.border.length); id < max; id++) {
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
				if (ca === "2") { border.ques = 0; border.line = 1; }
				else if (ca === "-1") { border.ques = 0; border.qsub = 2; }
				else if (ca === "1") { border.ques = 0; }
				else { border.ques = 1; }
			});
		},
		encodeData: function () {
			this.encodeBorder(function (border) {
				if (border.line === 1) { return "2 "; }
				else if (border.qsub === 2) { return "-1 "; }
				else if (border.ques === 0) { return "1 "; }
				else { return "0 "; }
			});
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkBranchLine",
			"checkCrossLine",
			"checkDotLength",
			"checkDeadendLine",
			"checkOneLoop"
		],

		checkDotLength: function () {
			const bd = this.board, tiles = bd.tilegraph.components;
			const numerous_value = 999999;
			for (let r = 0; r < tiles.length; r++) { tiles[r].count = 0; }
			for (let id = 0; id < bd.border.length; id++) {
				const border = bd.border[id], cell1 = border.sidecell[0], cell2 = border.sidecell[1];
				if (border.isGround() && !border.inside) {
					//@ts-ignore
					if (!cell1.isnull) { cell1.tile.count -= numerous_value; }
					//@ts-ignore
					if (!cell2.isnull) { cell2.tile.count -= numerous_value; }
				}
				else if (!border.isGround() && !border.isLine()) {
					//@ts-ignore
					if (!cell1.isnull) { cell1.tile.count++; }
					//@ts-ignore
					if (!cell2.isnull) { cell2.tile.count++; }
				}
			}
			for (let r = 0; r < tiles.length; r++) {
				const clist = tiles[r].clist, count = tiles[r].count;
				if (count < 0 || count === clist.length) { continue; }

				this.failcode.add("bkNoLineNe");
				if (this.checkOnly) { break; }
				clist.seterr(1);
			}
		}
	},

	FailCode: {
		bkNoLineNe: ["タイルと周囲の線が引かれない点線の長さが異なります。", "The size of the tile is not equal to the total of length of lines that is remained dotted around the tile."]
	}
});


const allclear2 = function (blist: BorderList, isrec: boolean = false) {
	const props = ['ques', 'line', 'qsub'] as const;
	for (let i = 0; i < blist.length; i++) {
		const border = blist[i];
		for (let j = 0; j < props.length; j++) {
			const pp = props[j];
			let def = border.constructor.prototype[pp];
			/* border.quesの真の初期値は↓ */
			if (pp === 'ques') { def = (border.inside ? 1 : 0); }
			if (border[pp] !== def) {
				if (isrec) { border.addOpe(pp, border[pp], def); }
				border[pp] = def;
			}
		}
	}
}

class AreaTileGraph extends AreaGraphBase<GraphComponent & { count: number }> {
	override enabled = true
	override relation = { 'border.ques': 'separator' }
	override setComponentRefs(obj: any, component: any) { obj.tile = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.tilenodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.tilenodes = []; }

	override isnodevalid(nodeobj: any) { return true; }
	override isedgevalidbylinkobj(border: any) { return border.isGround(); }
}