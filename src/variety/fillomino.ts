//---------------------------------------------------------

import { AnsCheck } from "../puzzle/Answer";
import { AreaNumberGraph } from "../puzzle/AreaManager";
import { Board } from "../puzzle/Board";
import { number16 } from "../puzzle/Encode";
import { FileIO } from "../puzzle/FileData";
import { GraphComponent } from "../puzzle/GraphBase";
import { Graphic } from "../puzzle/Graphic";
import { KeyEvent } from "../puzzle/KeyInput";
import { MouseEvent1 } from "../puzzle/MouseInput";
import { BoardPiece, type Border, Cell, type Cross, type EXCell } from "../puzzle/Piece";
import { CellList } from "../puzzle/PieceList";
import { Puzzle } from "../puzzle/Puzzle";

// マウス入力系
class FillominoMouseEvent extends MouseEvent1 {
	override inputModes = { edit: ['number', 'clear'], play: ['copynum', 'number', 'clear', 'border', 'subline'] }
	override mouseinput_other() {
		if (this.inputMode === 'copynum') { this.dragnumber_fillomino(); }
	}
	override mouseinput_auto() {
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
	}

	dragnumber_fillomino() {
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
}

//---------------------------------------------------------
// キーボード入力系
class FillominoKeyEvent extends KeyEvent {
	override enablemake = true
	override enableplay = true
	override moveTarget(ca: string) {
		if (this.puzzle.playmode && (this.isCTRL || this.isX || this.isZ)) {
			return this.move_fillomino(ca);
		}
		return this.moveTCell(ca);
	}

	move_fillomino(ca: string) {
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
}

//---------------------------------------------------------
// 盤面管理系
class FillominoCell extends Cell {
	override enableSubNumberArray = true
}
class FillominoBoard extends Board {
	override hasborder: 0 | 1 | 2 = 1
	numblkgraph!: AreaNumBlockGraph


	override addExtraInfo() {
		this.numblkgraph = this.addInfoList(AreaNumBlockGraph);
	}

	override createCell(): Cell {
		return new FillominoCell(this.puzzle)
	}
}

class FillominoGraphComponent extends GraphComponent {
	number = 0
	numkind = 0
}

class AreaNumBlockGraph extends AreaNumberGraph<FillominoGraphComponent> {
	override enabled = true
	override relation: Record<string, string> = {
		'cell.qnum': 'node',
		'cell.anum': 'node',
		'border.qans': 'separator'
	}

	override isnodevalid(cell: Cell) { return true; }
	override isedgevalidbylinkobj(border: Border) {
		if (border.isBorder()) { return false; }
		const num1 = border.sidecell[0].getNum();
		const num2 = border.sidecell[1].getNum();
		return (num1 === num2 || num1 < 0 || num2 < 0);
	}

	override setExtraData(component: FillominoGraphComponent) {
		component.clist = new CellList(component.getnodeobjs());
		const clist = component.clist

		const nums: Record<number, number> = {};
		let numkind = 0;
		let filled = -1;
		for (let i = 0; i < clist.length; i++) {
			const num = clist[i].getNum();
			if (num === -1) {

			}
			else if (!nums[num]) {
				numkind++;
				nums[num] = 1;
				if (filled === -1 || num !== -2) { filled = num; }
			}
			else {
				nums[num]++;
			}
		}
		if (numkind > 1 && !!nums[-2]) { --numkind; }
		component.numkind = numkind;
		component.number = (numkind === 1 ? filled : -1);
	}


}

//---------------------------------------------------------
// 画像表示系
class FillominoGraphic extends Graphic {
	override gridcolor_type: "DARK" | "LIGHT" | "DLIGHT" | "SLIGHT" | "THIN" = "DLIGHT";

	override bordercolor_func = "qans"

	override paint() {
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
}

class FillominoFileIO extends FileIO {
	override decodeData() {
		this.decodeCellQnum();
		this.decodeCellAnumsub();
		this.decodeBorderAns();
	}
	override encodeData() {
		this.encodeCellQnum();
		this.encodeCellAnumsub();
		this.encodeBorderAns();
	}
}

//---------------------------------------------------------
// 正解判定処理実行部
class FillominoAnsCheck extends AnsCheck<FillominoCell,
	Cross,
	Border,
	EXCell,
	FillominoBoard> {
	override getCheckList() {
		return [
			"checkSmallArea",
			"checkSideAreaNumberSize",
			"checkLargeArea",
			"checkNumKinds",
			"checkNoNumArea",
			"checkNoNumCell_fillomino+"
		]
	}

	checkSideAreaNumberSize() {
		this.checkSideAreaSize(
			this.puzzle.board.numblkgraph,
			function (area) { return area.number; },
			"bsSameNum"
		);
	}

	checkSmallArea() {
		this.checkAllErrorRoom(function (area) {
			return !(area.number > area.clist.length && area.number > 0);
		}, "bkSizeLt");
	}
	checkLargeArea() {
		this.checkAllErrorRoom(function (area) {
			return !(area.number < area.clist.length && area.number > 0);
		}, "bkSizeGt");
	}
	checkNumKinds() {
		this.checkAllErrorRoom(function (area) {
			return area.numkind <= 1;
		}, "bkMixedNum");
	}
	checkNoNumArea() {
		this.checkAllErrorRoom(function (area) {
			return area.numkind >= 1;
		}, "bkNoNum");
	}
	checkAllErrorRoom(evalfunc: (area: FillominoGraphComponent) => boolean, code: string) {
		const rooms = this.puzzle.board.numblkgraph.components;
		for (let id = 0; id < rooms.length; id++) {
			const area = rooms[id];
			if (!area || evalfunc(area)) { continue; }

			this.failcode.add(code);
			if (this.checkOnly) { break; }
			area.clist.seterr(1);
		}
	}
	checkNoNumCell_fillomino() {
		if (this.puzzle.getConfig('forceallcell')) {
			this.checkAllCell(function (cell) { return cell.noNum(); }, "ceNoNum");
		}
	}
}

export class Fillomino extends Puzzle<
	FillominoCell,
	Cross,
	Border,
	EXCell,
	FillominoBoard> {
	override createFileIO(): FileIO {
		return new FillominoFileIO(this)
	}

	override createAnsCheck(): AnsCheck<FillominoCell, Cross, Border, EXCell, FillominoBoard> {
		return new FillominoAnsCheck(this)
	}

	override createBoard(): FillominoBoard {
		return new FillominoBoard(this)
	}

	override createGraphic(): Graphic {
		return new FillominoGraphic(this)
	}

	override createMouseEvent(): MouseEvent1 {
		return new FillominoMouseEvent(this)
	}

	override createKeyEvent(): KeyEvent {
		return new FillominoKeyEvent(this)
	}

	override getAdditionalFailCode() {
		return {
			bkSizeLt: ["ブロックの大きさより数字のほうが大きいです。", "A number is bigger than the size of block."],
			bkSizeGt: ["ブロックの大きさよりも数字が小さいです。", "A number is smaller than the size of block."],
			bkMixedNum: ["1つのブロックに2種類以上の数字が入っています。", "A room has two or more kinds of numbers."],
			bsSameNum: ["同じ数字のブロックが辺を共有しています。", "Adjacent blocks have the same number."]
		} as Record<string, [string, string]>
	}

	override getConverters() {
		return [number16]
	}
} 