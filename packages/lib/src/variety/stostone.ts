//
// パズル固有スクリプト部 島国・チョコナ・ストストーン版 shimaguni.js

import { AnsCheck } from "../puzzle/Answer";
import { AreaShadeGraph } from "../puzzle/AreaManager";
import { Board } from "../puzzle/Board";
import type { GraphComponent } from "../puzzle/GraphBase";
import { Graphic } from "../puzzle/Graphic";
import type { Border, Cell } from "../puzzle/Piece";
import type { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Stostone = createVariety({
	pid: "stostone",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		inputModes: { edit: ['border', 'number', 'clear'], play: ['shade', 'unshade'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) { this.inputcell(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) { this.inputborder(); }
				else if (this.mouseend && this.notInputted()) { this.inputqnum(); }
			}
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		keyDispInfo: function (ca) {
			if (ca === 'x') {
				/* 押した時:true, 離したとき:false */
				this.board.operate(!!this.keydown ? 'drop' : 'resetpos');
				return false;
			}
			return true;
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		stone: null! as GraphComponent,
		destination: null! as any,
		maxnum: function (): number {
			return Math.min(999, this.room.clist.length);
		},
		getFallableLength: function (isdrop: boolean): number {
			if (!this.base!.stone) { return 0; }
			let cell2 = this, len = 0, move = ((isdrop !== false) ? 2 : -2);
			while (!cell2.isnull) {
				cell2 = cell2.relcell(0, move);
				if (cell2.isnull || (!!cell2.base!.stone && this.base!.stone !== cell2.base!.stone)) { break; }
				len++;
			}
			return len;
		}
	},

	Board: {
		hasborder: 1,
		stonegraph: null! as AreaStoneGraph,
		addExtraInfo: function () {
			this.stonegraph = this.addInfoList(AreaStoneGraph);
		},
		cols: 8,
		rows: 8,

		falling: false as boolean,
		fallstate: 0,	// 落下ブロックが計算済みかどうか 0:無効 1:落ちた状態 2:上がった状態

		initBoardSize: function (col, row) {
			Board.prototype.initBoardSize.call(this, col, row);
			this.falling = false;
			this.fallstate = 0;
		},
		errclear: function (): boolean {
			this.falling = false;
			return Board.prototype.errclear.call(this);
		},
		operate: function (type) {
			switch (type) {
				case 'drop':
				case 'raise':
					this.drop(type === 'drop');
					this.falling = true;
					this.hasinfo = true;
					this.puzzle.redraw();
					break;
				case 'resetpos':
					this.puzzle.errclear();
					break;
				default:
					Board.prototype.operate.call(this, type);
					break;
			}
		},
		resetpos: function () {
			for (let i = 0; i < this.cell.length; i++) {
				const cell = this.cell[i];
				cell.base = cell.destination = (cell.isShade() ? cell : this.emptycell);
			}
		},
		drop: function (isdrop = true) {
			const afterstate = (isdrop !== false ? 1 : 2);
			if (this.fallstate === afterstate) { return; }
			this.resetpos();
			let fallable = true, blks = this.stonegraph.components;
			while (fallable) {
				fallable = false;
				for (let n = blks.length - 1; n >= 0; --n) {
					const length = fall(this, blks[n].clist, isdrop)//.fall(isdrop);
					if (length > 0) { fallable = true; }
				}
			}
			this.fallstate = afterstate;
		}
	},


	AreaRoomGraph: {
		enabled: true,
		hastop: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "LIGHT",

		paint: function () {
			this.drawBGCells();
			this.drawGrid();
			this.drawDotCells_stostone();
			this.drawShadedCells();

			this.drawQuesNumbers();

			this.drawBorders();
			this.drawNarrowBorders();

			this.drawChassis();

			this.drawBoxBorders(false);

			this.drawTarget();
		},
		irowakeblk: true,
		enablebcolor: false,
		bgcellcolor_func: "error1",
		qanscolor: "black",

		minYdeg: 0.08,
		maxYdeg: 0.50,

		drawDotCells_stostone: function () {
			const g = this.vinc('cell_dot', 'auto', true);

			const dsize = this.cw * 0.20;
			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];

				g.vid = "c_dot_" + cell.id;
				if (cell.qsub === 1) {
					g.fillStyle = this.bcolor;
					g.fillCircle(cell.bx * this.bw, cell.by * this.bh, dsize);
				}
				else { g.vhide(); }
			}
		},

		drawNarrowBorders: function () {
			this.vinc('border_narrow', 'crispEdges', true);
			if (this.board.falling) {
				const func = this.getBorderColor;
				this.getBorderColor = this.getNarrowBorderColor;
				this.lw /= 2;
				this.lm /= 2;
				this.drawBorders_common("b_bd2_");
				this.getBorderColor = func;
				this.lw *= 2;
				this.lm *= 2;
			}
		},

		getShadedCellColor: function (cell): string | null {
			const cell0 = cell;
			if (this.board.falling) { cell = cell.base!; }
			if (cell.qans !== 1) { return null; }
			const info = cell0.error || cell0.qinfo;
			if (info === 1) { return this.errcolor1; }
			else if (info === 2) { return this.errcolor2; }
			else if (cell.trial) { return this.trialcolor; }
			//@ts-ignore
			else if (this.puzzle.execConfig('irowakeblk')) { return cell.stone.color; }
			return this.shadecolor;
		},
		getBorderColor: function (border): string | null {
			if (this.board.falling) {
				//@ts-ignore
				const sblk1 = border.sidecell[0].base!.stone;
				//@ts-ignore
				const sblk2 = border.sidecell[1].base!.stone;
				if (!!sblk1 || !!sblk2) { return null; }
			}
			if (border.isBorder()) { return this.quescolor; }
			return null;
		},
		getNarrowBorderColor: function (border: Border): string | null {
			//@ts-ignore
			const sblk1 = border.sidecell[0].base.stone;
			//@ts-ignore
			const sblk2 = border.sidecell[1].base.stone;
			if (sblk1 !== sblk2) { return "white"; }
			return null;
		},
		getQuesNumberText: function (cell): string {
			//@ts-ignore
			if (this.board.falling && !!cell.base!.stone) { return ''; }
			return Graphic.prototype.getQuesNumberText.call(this, cell);
		},
		getQuesNumberColor: function (cell): string {
			//@ts-ignore
			if (this.board.falling) { cell = cell.base!; }
			return Graphic.prototype.getQuesNumberColor_mixed.call(this, cell);
		}

	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeBorder();
			this.decodeRoomNumber16();
		},
		encodePzpr: function (type) {
			this.encodeBorder();
			this.encodeRoomNumber16();
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeAreaRoom();
			this.decodeCellQnum();
			this.decodeCellAns();
		},
		encodeData: function () {
			this.encodeAreaRoom();
			this.encodeCellQnum();
			this.encodeCellAns();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkSideAreaShadeCell",
			"checkSeqBlocksInRoom",
			"checkFallenBlock",
			"checkShadeCellCount",
			"checkRemainingSpace",
			"checkNoShadeCellInArea"
		],
		checkSideAreaShadeCell: function () {
			this.checkSideAreaCell(function (cell1, cell2) { return (cell1.isShade() && cell2.isShade()); }, true, "cbShade");
		},
		checkSideAreaLandSide: function () {
			this.checkSideAreaSize(this.board.roommgr, function (area) { return area.clist.filter(function (cell) { return cell.isShade(); }).length; }, "bsEqShade");
		},

		// 部屋の中限定で、黒マスがひとつながりかどうか判定する
		checkSeqBlocksInRoom: function () {
			const rooms = this.board.roommgr.components;
			for (let r = 0; r < rooms.length; r++) {
				let clist = rooms[r].clist, stonebase = null, check = true;
				for (let i = 0; i < clist.length; i++) {
					if (clist[i].stone === null) { }
					else if (clist[i].stone !== stonebase) {
						if (stonebase === null) { stonebase = clist[i].stone; }
						else { check = false; break; }
					}
				}
				if (check) { continue; }

				this.failcode.add("bkShadeDivide");
				if (this.checkOnly) { break; }
				clist.seterr(1);
			}
		},
		checkAns: function (break_if_error) {
			this.board.drop();
			AnsCheck.prototype.checkAns.call(this, break_if_error);
		},
		resetCache: function () {
			AnsCheck.prototype.resetCache.call(this);
			this.board.fallstate = 0;
		},

		checkFallenBlock: function () {
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (cell.by > bd.maxby / 2 || cell.base!.isnull) { continue; }

				this.failcode.add("csUpper");
				if (this.checkOnly) { break; }
				bd.falling = true;
				cell.seterr(1);
			}
		},
		checkRemainingSpace: function () {
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (cell.by < bd.maxby / 2 || !cell.base!.isnull) { continue; }

				this.failcode.add("cuLower");
				if (this.checkOnly) { break; }
				bd.falling = true;
				if (cell.base!.isnull) { cell.seterr(1); }
			}
		}
	},


	FailCode: {
		cbShade: ["異なる部屋にある黒マスどうしが辺を共有しています。", "Shade cell blocks in other region are adjacent over border line."],
		csUpper: ["ブロックを落とした後に黒マスが盤面の上半分に残っています。", "Shaded cells are remained in upper half of the board after they are fallen."],
		cuLower: ["ブロックを落とした後の空間が盤面の下半分にあります。", "Unshaded cells exist in lower half of the board after blocks are fallen."]
	}
});


const fall = function (board: Board, clist: CellList<any>, isdrop: boolean = true) {
	let length = board.rows, move = ((isdrop !== false) ? 2 : -2);
	for (let i = 0; i < clist.length; i++) {
		if (clist[i].stone === clist[i].relcell(0, move).stone) { continue; } // Skip if the block also contains bottom neighbor cell
		const len = clist[i].destination.getFallableLength(isdrop);
		if (length > len) { length = len; }
		if (length === 0) { return 0; }
	}
	const totallen = length + (Math.abs(clist[0].destination.by - clist[0].by) >> 1);
	for (let i = 0; i < clist.length; i++) {
		clist[i].destination.base = board.emptycell;
	}
	for (let i = 0; i < clist.length; i++) {
		const newcell = clist[i].relcell(0, move * totallen);
		clist[i].destination = newcell;
		newcell.base = clist[i];
	}
	return length;
}


export class AreaStoneGraph extends AreaShadeGraph { // Same as LITS AreaTetrominoGraph
	override enabled = true
	override relation = { 'cell.qans': 'node', 'border.ques': 'separator' }
	override setComponentRefs(obj: any, component: any) { obj.stone = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.stonenodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.stonenodes = []; }

	override isedgevalidbylinkobj(border: any) {
		return !border.isBorder();
	}
	override coloring = true
}