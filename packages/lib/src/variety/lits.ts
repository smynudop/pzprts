//
// パズル固有スクリプト部 ＬＩＴＳ・のりのり版 lits.js

import { AreaShadeGraph } from "../puzzle/AreaManager";
import type { GraphComponent } from "../puzzle/GraphBase";
import type { Border, Cell } from "../puzzle/Piece";
import { CellList } from "../puzzle/PieceList";
import { URL_PZPRAPP, URL_PZPRV3 } from "../pzpr/constants";
import { createVariety } from "./createVariety";

//
export const Lits = createVariety({
	pid: "lits",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		inputModes: { edit: ['border', 'info-blk'], play: ['shade', 'unshade', 'info-blk'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) { this.inputcell(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) { this.inputborder(); }
			}
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		tetro: null! as GraphComponent & { shape: string | null },
		posthook: {
			qans: function () { this.room.checkAutoCmp(); }
		}
	},

	Board: {
		hasborder: 1,
		tetrograph: null! as AreaTetrominoGraph,
		addExtraInfo: function () {
			this.tetrograph = this.addInfoList(AreaTetrominoGraph);
		}
	},

	AreaShadeGraph: {
		enabled: true
	},
	AreaRoomGraph: {
		enabled: true
	},
	GraphComponent: {
		checkCmp: function () {
			let scnt = 0
			let sblk = null;
			for (let i = 0; i < this.clist.length; i++) {
				if (this.clist[i].qans === 1) {
					scnt++;
					if (!sblk) { sblk = this.clist[i].sblk; }
					else if (sblk !== this.clist[i].sblk) { return false; }
				}
			}
			return (scnt === 4);
		}
	},
	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		autocmp: 'room',

		paint: function () {
			this.drawBGCells();
			this.drawShadedCells();
			this.drawDotCells();
			this.drawGrid();

			this.drawBorders();

			this.drawChassis();

		},
		gridcolor_type: "DARK",

		qanscolor: "black",
		shadecolor: "rgb(96, 96, 96)",
		qcmpbgcolor: "rgb(96, 255, 160)",
		bgcellcolor_func: "qcmp"
	},
	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			const oldflag = ((type === URL_PZPRV3 && this.checkpflag("d")) ||
				(type === URL_PZPRAPP && !this.checkpflag("c")));
			if (!oldflag) {
				this.decodeBorder();
			}
			else {
				this.decodeLITS_old();
			}
		},
		encodePzpr: function (type) {
			if (type === URL_PZPRAPP) { this.outpflag = 'c'; }
			this.encodeBorder();
		},

		decodeLITS_old: function (): void {
			const bstr = this.outbstr;
			const bd = this.puzzle.board;
			for (let id = 0; id < bd.border.length; id++) {
				const border = bd.border[id];
				const cell1 = border.sidecell[0];
				const cell2 = border.sidecell[1];
				if (!cell1.isnull && !cell2.isnull && bstr.charAt(cell1.id) !== bstr.charAt(cell2.id)) { border.ques = 1; }
			}
			this.outbstr = bstr.substr(bd.cell.length);
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeAreaRoom();
			this.decodeCellAns();
		},
		encodeData: function () {
			this.encodeAreaRoom();
			this.encodeCellAns();
		},
	},

	//---------------------------------------------------------
	// 正解判定処理実行部

	"AnsCheck": {
		checklist: [
			"check2x2ShadeCell",
			"checkOverShadeCellInArea",
			"checkSeqBlocksInRoom",
			"checkTetromino",
			"checkConnectShade",
			"checkNoShadeCellInArea",
			"checkLessShadeCellInArea"
		],
		checkOverShadeCellInArea: function () {
			this.checkAllBlock(this.board.roommgr, function (cell) { return cell.isShade(); }, function (w, h, a, n) { return (a <= 4); }, "bkShadeGt4");
		},
		checkLessShadeCellInArea: function () {
			this.checkAllBlock(this.board.roommgr, function (cell) { return cell.isShade(); }, function (w, h, a, n) { return (a >= 4); }, "bkShadeLt4");
		},

		// 部屋の中限定で、黒マスがひとつながりかどうか判定する
		checkSeqBlocksInRoom: function () {
			const bd = this.board;
			const rooms = bd.roommgr.components;
			for (let r = 0; r < rooms.length; r++) {
				const clist = rooms[r].clist;
				let tetrobase = null;
				let check = true;
				for (let i = 0; i < clist.length; i++) {
					if (clist[i].tetro === null) { }
					else if (clist[i].tetro !== tetrobase) {
						if (tetrobase === null) { tetrobase = clist[i].tetro; }
						else { check = false; break; }
					}
				}
				if (check) { continue; }

				this.failcode.add("bkShadeDivide");
				if (this.checkOnly) { break; }
				clist.seterr(1);
			}
		},

		checkTetromino: function () {
			let result = true;
			const bd = this.board;
			function func(cell1: Cell & { tetro: GraphComponent & { shape: any } }, cell2: Cell & { tetro: GraphComponent & { shape: any } }) {
				const r1 = cell1.tetro;
				const r2 = cell2.tetro;
				return (r1 !== null && r2 !== null && r1 !== r2 && r1.shape !== null && r2.shape !== null && r1.shape === r2.shape);
			}
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				let cell2 = cell.adjacent.right;
				if (!cell2.isnull && func(cell, cell2)) {
					result = false;
					if (this.checkOnly) { break; }
					cell.tetro.clist.seterr(2);
					cell2.tetro.clist.seterr(2);
				}
				cell2 = cell.adjacent.bottom;
				if (!cell2.isnull && func(cell, cell2)) {
					result = false;
					if (this.checkOnly) { break; }
					cell.tetro.clist.seterr(2);
					cell2.tetro.clist.seterr(2);
				}
			}
			if (!result) { this.failcode.add("bsSameShape"); }
		}
	},


	"FailCode": {
		bkShadeLt4: ["黒マスのカタマリが４マス未満の部屋があります。", "A room has three or less shaded cells."],
		bkShadeGt4: ["５マス以上の黒マスがある部屋が存在します。", "A room has five or more shaded cells."],
		bsSameShape: ["同じ形のテトロミノが接しています。", "Some Tetrominos that are the same shape are Adjacent."]
	},


});

class AreaTetrominoGraph extends AreaShadeGraph<GraphComponent & { shape: any }> {
	override enabled = true
	override relation = { 'cell.qans': 'node', 'border.ques': 'separator' }
	override setComponentRefs(obj: any, component: any) { obj.tetro = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.tetronodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.tetronodes = []; }

	override isedgevalidbylinkobj(border: Border) {
		return !border.isBorder();
	}

	override resetExtraData(cell: any) { cell.shape = null; }
	override setExtraData(component: GraphComponent & { shape: any }) {
		component.clist = new CellList(component.getnodeobjs());
		const clist = component.clist
		const len = clist.length;
		let shape = null;
		if (len === 4) {
			const cell0 = clist.sort((a, b) => a.id - b.id)[0];
			const bx0 = cell0.bx;
			const by0 = cell0.by;
			let value = 0;
			//let shape = null;
			for (let i = 0; i < len; i++) { value += (((clist[i].by - by0) >> 1) * 10 + ((clist[i].bx - bx0) >> 1)); }
			switch (value) {
				case 13: case 15: case 27:
				case 31: case 33: case 49: case 51: shape = 'L'; break;
				case 6: case 60: shape = 'I'; break;
				case 14: case 30: case 39: case 41: shape = 'T'; break;
				case 20: case 24: case 38: case 42: shape = 'S'; break;
			}
		}
		component.shape = shape;
	}
}