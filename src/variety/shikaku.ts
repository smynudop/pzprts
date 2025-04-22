import { AnsCheck } from "../puzzle/Answer";
import { AreaRoomGraph } from "../puzzle/AreaManager";
import { Board } from "../puzzle/Board";
import { type Converter, number16 } from "../puzzle/Encode";
import { FileIO } from "../puzzle/FileData";
import { Graphic } from "../puzzle/Graphic";
import { KeyEvent } from "../puzzle/KeyInput";
import { MouseEvent1 } from "../puzzle/MouseInput";
import type { Border, Cell, Cross, EXCell } from "../puzzle/Piece";
import { Puzzle } from "../puzzle/Puzzle";

// マウス入力系
class ShikakuMouseEvent extends MouseEvent1 {
	override inputModes = { edit: ['number', 'clear'], play: ['border', 'subline'] }
	override mouseinput_auto() {
		if (this.puzzle.playmode) {
			if (this.mousestart || this.mousemove) {
				if (this.btn === 'left' && this.isBorderMode()) { this.inputborder(); }
				else { this.inputQsubLine(); }
			}
		}
		else if (this.puzzle.editmode) {
			if (this.mousestart) { this.inputqnum(); }
		}
	}
}

//---------------------------------------------------------
// キーボード入力系
class ShikakuKeyEvent extends KeyEvent {
	override enablemake = true
}

//---------------------------------------------------------
// 画像表示系
class ShikakuGraphic extends Graphic {
	override hideHatena = true

	override gridcolor_type: "DARK" | "LIGHT" | "DLIGHT" | "SLIGHT" | "THIN" = "LIGHT"

	override bordercolor_func = "qans"
	override fontShadecolor = "white"
	override numbercolor_func = "fixed_shaded"

	override circleratio = [0.40, 0.40]

	override paint() {
		this.drawBGCells();
		this.drawDashedGrid();
		this.drawBorders();

		this.drawCircledNumbers();
		this.drawBorderQsubs();

		this.drawChassis();

		this.drawTarget();
	}

	/* 黒丸を描画する */
	override circlestrokecolor_func = "null"
	override getCircleFillColor(cell: Cell) {
		if (cell.qnum !== -1) {
			return (cell.error === 1 ? this.errcolor1 : this.quescolor);
		}
		return null;
	}
}

//---------------------------------------------------------
class ShikakuFileIO extends FileIO {
	override decodeData() {
		this.decodeCellQnum();
		this.decodeBorderAns();
	}
	override encodeData() {
		this.encodeCellQnum();
		this.encodeBorderAns();
	}
}
//---------------------------------------------------------
// 正解判定処理実行部
class ShikakuAnsCheck extends AnsCheck {
	getCheckList() {
		return [
			"checkNoNumber",
			"checkDoubleNumber",
			"checkRoomRect",
			"checkNumberAndSize",
			"checkBorderDeadend+"
		]
	}
}

export class Shikaku extends Puzzle {
	override createKeyEvent(): KeyEvent {
		return new ShikakuKeyEvent(this)
	}

	override createMouseEvent(): MouseEvent1 {
		return new ShikakuMouseEvent(this)
	}

	override createBoard(): Board<Cell, Cross, Border, EXCell> {
		return new Board(this, {
			hasborder: 1,
			areaRoomGraph: true
		})
	}

	override createGraphic(): Graphic {
		return new ShikakuGraphic(this)
	}

	override createAnsCheck(): AnsCheck<Cell, Cross, Border, EXCell, Board<Cell, Cross, Border, EXCell>> {
		return new ShikakuAnsCheck(this.board)
	}

	override getAdditionalFailCode(): Map<string, [string, string]> | Record<string, [string, string]> {
		return {}
	}

	override createFileIO(): FileIO {
		return new ShikakuFileIO(this)
	}

	override getConverters(): Converter[] {
		return [number16]
	}
}