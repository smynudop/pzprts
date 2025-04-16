//---------------------------------------------------------

import { AnsCheck } from "../puzzle/Answer";
import { AreaShadeGraph, AreaUnshadeGraph } from "../puzzle/AreaManager";
import { Board } from "../puzzle/Board";
import { number16 } from "../puzzle/Encode";
import { FileIO } from "../puzzle/FileData";
import { Graphic } from "../puzzle/Graphic";
import { KeyEvent, TargetCursor } from "../puzzle/KeyInput";
import { MouseEvent1 } from "../puzzle/MouseInput";
import { type Border, Cell, type Cross, type EXCell } from "../puzzle/Piece";
import { Puzzle } from "../puzzle/Puzzle";

// マウス入力系
class NurikabeMouseEvent extends MouseEvent1 {
	override use = true
	override inputModes = {
		edit: ['number', 'clear', 'info-blk'],
		play: ['shade', 'unshade', 'info-blk']
	}
	override mouseinput_auto() {
		if (this.puzzle.playmode) {
			if (this.mousestart || this.mousemove) { this.inputcell(); }
		}
		else if (this.puzzle.editmode) {
			if (this.mousestart) { this.inputqnum(); }
		}
	}
}

//---------------------------------------------------------
// キーボード入力系
class NurikabeKeyEvent extends KeyEvent {
	override enablemake = true
}

class NurikabeBoard extends Board<NurikabeCell> {
	override createCell(): NurikabeCell {
		return new NurikabeCell(this.puzzle)
	}
}

//---------------------------------------------------------
// 盤面管理系
class NurikabeCell extends Cell {
	override numberRemainsUnshaded = true
}


//---------------------------------------------------------
// 画像表示系
class NurikabeGraphic extends Graphic {
	override numbercolor_func = "qnum"
	override qanscolor = "black"

	override paint() {
		this.drawBGCells();
		this.drawShadedCells();
		this.drawDotCells()
		this.drawGrid();

		this.drawQuesNumbers();

		this.drawChassis();

		this.drawTarget();
	}
}

//---------------------------------------------------------
class NurikabeFileIO extends FileIO {
	override decodeData() {
		this.decodeCellQnum();
		this.decodeCellAns();
	}
	override encodeData() {
		this.encodeCellQnum();
		this.encodeCellAns();
	}
}

//---------------------------------------------------------
// 正解判定処理実行部
class NurikabeAnsCheck extends AnsCheck {

	override getCheckList() {
		return [
			"check2x2ShadeCell",
			"checkNoNumberInUnshade",
			"checkConnectShade",
			"checkDoubleNumberInUnshade",
			"checkNumberAndUnshadeSize"
		]
	}

	checkDoubleNumberInUnshade() {
		this.checkAllBlock(this.puzzle.board.ublkmgr, function (cell) { return cell.isNum(); }, function (w, h, a, n) { return (a < 2); }, "bkNumGe2");
	}
	checkNumberAndUnshadeSize() {
		this.checkAllArea(this.puzzle.board.ublkmgr, function (w, h, a, n) { return (n <= 0 || n === a); }, "bkSizeNe");
	}
	checkNoNumberInUnshade() {
		this.checkAllBlock(this.puzzle.board.ublkmgr, function (cell) { return cell.isNum(); }, function (w, h, a, n) { return (a !== 0); }, "bkNoNum");
	}
}


export class Nurikabe extends Puzzle {
	override createAnsCheck(): AnsCheck<Cell, Cross, Border, EXCell> {
		return new NurikabeAnsCheck(this)
	}

	override createMouseEvent(): MouseEvent1 {
		return new NurikabeMouseEvent(this)
	}

	override createFileIO(): FileIO {
		return new NurikabeFileIO(this)
	}

	override createGraphic(): Graphic {
		return new NurikabeGraphic(this)
	}

	override createKeyEvent(): KeyEvent {
		return new NurikabeKeyEvent(this)
	}

	override createFailCode(): Map<string, [string, string]> {
		const map = super.createFailCode()
		map.set("bkNoNum", ["数字の入っていないシマがあります。", "An area of unshaded cells has no numbers."])
		map.set("bkNumGe2", ["1つのシマに2つ以上の数字が入っています。", "An area of unshaded cells has plural numbers."])
		map.set("bkSizeNe", ["数字とシマの面積が違います。", "The number is not equal to the number of the size of the area."])
		return map
	}

	override createBoard(): Board<Cell, Cross, Border, EXCell> {
		return new NurikabeBoard(this, {
			areaShadeGraph: true,
			areaUnshadeGraph: true
		})
	}

	override initConverters(): void {
		this.converters.push(number16)
	}
}