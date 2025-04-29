//
// パズル固有スクリプト部 フィルオミノ版 fillomino.js

import { AreaNumberGraph } from "../puzzle/AreaManager";
import { GraphComponent } from "../puzzle/GraphBase";
import type { Border, Cell } from "../puzzle/Piece";
import { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Fillomino = createVariety({
	pid: "fillomino",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['number', 'clear'], play: ['copynum', 'number', 'clear', 'border', 'subline'] },
		mouseinput_other: function () {
			if (this.inputMode === 'copynum') { this.dragnumber_fillomino(); }
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode && (this.mousestart || this.mousemove)) {
				if (this.btn === 'left') {
					if (this.isBorderMode()) { this.inputborder(); }
					else { this.dragnumber_fillomino(); }
				}
				else if (this.btn === 'right') { this.inputQsubLine(); }
			}

			if (this.mouseend && this.notInputted()) {
				this.mouseCell = this.puzzle.board.emptycell;
				this.inputqnum();
			}
		},

		dragnumber_fillomino: function () {
			const cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell) { return; }

			if (this.inputData === null) {
				this.inputData = cell.getNum();
				if (this.inputData === -1) { this.inputData = -2; }
				this.mouseCell = cell;
				return;
			}
			if (this.inputData === -2) {
				this.inputData = (cell.getNum() === -1 ? -3 : -1);
			}

			if ((this.inputData >= -1) && (cell.qnum === -1)) {
				cell.setAnum(this.inputData);
				cell.draw();
			}
			else if (this.inputData <= -3) {
				const cell2 = this.mouseCell;
				const border = this.puzzle.board.getb(((cell.bx + cell2.bx) >> 1), ((cell.by + cell2.by) >> 1));
				if (this.inputData === -3) { this.inputData = (border.qsub === 1 ? -5 : -4); }
				if (!border.isnull) {
					border.setQsub(this.inputData === -4 ? 1 : 0);
					border.draw();
				}
			}
			this.mouseCell = cell;
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		enableplay: true,
		moveTarget: function (ca: string): boolean {
			if (this.puzzle.playmode && (this.isCTRL || this.isX || this.isZ)) {
				return this.move_fillomino(ca);
			}
			return this.moveTCell(ca);
		},

		move_fillomino: function (ca: string): boolean {
			const cell = this.cursor.getc();
			if (cell.isnull) { return false; }

			const adc = cell.adjacent;
			const adb = cell.adjborder;
			let nc: Cell;
			let nb: Border;
			switch (ca) {
				case 'up': nc = adc.top; nb = adb.top; break;
				case 'down': nc = adc.bottom; nb = adb.bottom; break;
				case 'left': nc = adc.left; nb = adb.left; break;
				case 'right': nc = adc.right; nb = adb.right; break;
				default: return false;
			}
			if (!nc.isnull) {
				const isMoved = (this.isCTRL || this.isX || this.isZ);
				if (!isMoved) { return false; }

				if (this.isCTRL) { if (!nb.isnull) { nb.setQsub((nb.qsub === 0) ? 1 : 0); this.cursor.setaddr(nc); } }
				else if (this.isZ) { if (!nb.isnull) { nb.setQans((!nb.isBorder() ? 1 : 0)); } }
				else if (this.isX) { if (!nc.isnull) { nc.setAnum(cell.getNum()); this.cursor.setaddr(nc); } }

				cell.draw();
				return true;
			}
			return false;
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		enableSubNumberArray: true
	},
	Board: {
		hasborder: 1,
		numblkgraph: null! as AreaNumBlockGraph,

		addExtraInfo: function () {
			this.numblkgraph = this.addInfoList(AreaNumBlockGraph);
		}
	},



	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "DLIGHT",

		bordercolor_func: "qans",

		paint: function () {
			this.drawBGCells();
			this.drawTargetSubNumber();
			this.drawDashedGrid();

			this.drawSubNumbers();
			this.drawAnsNumbers();
			this.drawQuesNumbers();

			this.drawBorders();
			this.drawBorderQsubs();

			this.drawChassis();

			this.drawCursor();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeNumber16();
		},
		encodePzpr: function (type) {
			this.encodeNumber16();
		},
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnum();
			this.decodeCellAnumsub();
			this.decodeBorderAns();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeCellAnumsub();
			this.encodeBorderAns();
		},
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkSmallArea",
			"checkSideAreaNumberSize",
			"checkLargeArea",
			"checkNumKinds",
			"checkNoNumArea",
			"checkNoNumCell_fillomino+"
		],

		checkSideAreaNumberSize: function () {
			// @ts-ignore
			this.checkSideAreaSize(this.board.numblkgraph, function (area) { return area.number; }, "bsSameNum");
		},

		checkSmallArea: function () {
			this.checkAllErrorRoom(function (area: any) { return !(area.number > area.clist.length && area.number > 0); }, "bkSizeLt");
		},

		checkLargeArea: function () {
			this.checkAllErrorRoom(function (area: any) { return !(area.number < area.clist.length && area.number > 0); }, "bkSizeGt");
		},

		checkNumKinds: function () {
			this.checkAllErrorRoom(function (area: any) { return area.numkind <= 1; }, "bkMixedNum");
		},

		checkNoNumArea: function () {
			this.checkAllErrorRoom(function (area: any) { return area.numkind >= 1; }, "bkNoNum");
		},
		checkAllErrorRoom: function (evalfunc: (area: any) => boolean, code: string): void {
			// @ts-ignore
			const rooms = this.board.numblkgraph.components;
			for (let id = 0; id < rooms.length; id++) {
				const area = rooms[id];
				if (!area || evalfunc(area)) { continue; }

				this.failcode.add(code);
				if (this.checkOnly) { break; }
				area.clist.seterr(1);
			}
		},
		checkNoNumCell_fillomino: function () {
			if (this.forceallcell) {
				this.checkAllCell(function (cell) { return cell.noNum(); }, "ceNoNum");
			}
		}
	},

	FailCode: {
		bkSizeLt: ["ブロックの大きさより数字のほうが大きいです。", "A number is bigger than the size of block."],
		bkSizeGt: ["ブロックの大きさよりも数字が小さいです。", "A number is smaller than the size of block."],
		bkMixedNum: ["1つのブロックに2種類以上の数字が入っています。", "A room has two or more kinds of numbers."],
		bsSameNum: ["同じ数字のブロックが辺を共有しています。", "Adjacent blocks have the same number."]
	}
});

class AreaNumBlockGraph extends AreaNumberGraph {
	override enabled = true
	override relation = { 'cell.qnum': 'node', 'cell.anum': 'node', 'border.qans': 'separator' }

	override isnodevalid(cell: any) { return true; }
	override isedgevalidbylinkobj(border: any) {
		if (border.isBorder()) { return false; }
		const num1 = border.sidecell[0].getNum();
		const num2 = border.sidecell[1].getNum();
		return (num1 === num2 || num1 < 0 || num2 < 0);
	}

	override setExtraData(component: any) {
		component.clist = new CellList(component.getnodeobjs());
		const clist = component.clist;

		const nums: Record<number, number> = {};
		let numkind = 0;
		let filled = -1;
		for (let i = 0; i < clist.length; i++) {
			const num = clist[i].getNum();
			if (num === -1) { }
			else if (!nums[num]) {
				numkind++; nums[num] = 1;
				if (filled === -1 || num !== -2) { filled = num; }
			}
			else { nums[num]++; }
		}
		if (numkind > 1 && !!nums[-2]) { --numkind; }
		component.numkind = numkind;
		component.number = (numkind === 1 ? filled : -1);

	}

	override getComponentRefs(cell: any) { return cell.nblk; } // getSideAreaInfo用
	override getSideAreaInfo() {
		return super.getSideAreaInfo();
	}
}