
//---------------------------------------------------------

import { AnsCheck } from "../puzzle/Answer";
import { Board } from "../puzzle/Board";
import { number16 } from "../puzzle/Encode";
import { FileIO } from "../puzzle/FileData";
import { Graphic } from "../puzzle/Graphic";
import { KeyEvent } from "../puzzle/KeyInput";
import { MouseEvent1 } from "../puzzle/MouseInput";
import { type Border, Cell, type Cross, type EXCell } from "../puzzle/Piece";
import { Puzzle } from "../puzzle/Puzzle";

// マウス入力系
class SudokuMouseEvent extends MouseEvent1 {
	override inputModes = { edit: ['number', 'clear'], play: ['number', 'clear'] }
	override mouseinput_auto() {
		if (this.mousestart) { this.inputqnum(); }
	}
}

//---------------------------------------------------------
// キーボード入力系
class SudokuKeyEvent extends KeyEvent {
	override enablemake = true
	override enableplay = true
}

//---------------------------------------------------------
// 盤面管理系
class SudokuCell extends Cell {
	override enableSubNumberArray = true

	override maxnum = () => {
		return Math.max(this.board.cols, this.board.rows);
	}
}
class SudokuBoard extends Board {
	override cols = 9
	override rows = 9

	override hasborder: 0 | 1 | 2 = 1;

	override initBoardSize(col: number, row: number) {
		super.initBoardSize(col, row)



		let roomsizex = (Math.sqrt(this.cols) | 0) * 2;
		const roomsizey = (Math.sqrt(this.cols) | 0) * 2;
		if (this.cols === 6) { roomsizex = 6; }
		for (let i = 0; i < this.border.length; i++) {
			const border = this.border[i];
			if (border.bx % roomsizex === 0 || border.by % roomsizey === 0) { border.ques = 1; }
		}
		this.rebuildInfo();
	}

	override createCell(): Cell {
		return new SudokuCell(this.puzzle)
	}
}

// AreaRoomGraph: {
// 	enabled: true
// },

//---------------------------------------------------------
// 画像表示系
class SudokuGraphic extends Graphic {
	override paint() {
		this.drawBGCells();
		this.drawTargetSubNumber();
		this.drawGrid();
		this.drawBorders();

		this.drawSubNumbers();
		this.drawAnsNumbers();
		this.drawQuesNumbers();

		this.drawChassis();

		this.drawCursor();
	}
}

//---------------------------------------------------------
// URLエンコード/デコード処理
// Encode: {
// 	decodePzpr: function(type) {
// 		this.decodeNumber16();
// 	},
// 	encodePzpr: function(type) {
// 		this.encodeNumber16();
// 	},
// },
//---------------------------------------------------------
class SudokuFileIO extends FileIO {
	override decodeData() {
		this.decodeCellQnum();
		this.decodeCellAnumsub();
	}
	override encodeData() {
		this.encodeCellQnum();
		this.encodeCellAnumsub();
	}
}

//---------------------------------------------------------
// 正解判定処理実行部
class SudokuAnsCheck extends AnsCheck {
	override getCheckList() {
		return [
			"checkDifferentNumberInRoom",
			"checkDifferentNumberInLine",
			"checkNoNumCell+"
		]
	}
}

export class Sudoku extends Puzzle {
	override createAnsCheck(): AnsCheck<Cell, Cross, Border, EXCell> {
		return new SudokuAnsCheck(this.board)
	}

	override createBoard(): Board<Cell, Cross, Border, EXCell> {
		return new SudokuBoard(this, {
			areaRoomGraph: true
		})
	}

	override getAdditionalFailCode(): Map<string, [string, string]> | Record<string, [string, string]> {
		return {}
	}

	override createFileIO(): FileIO {
		return new SudokuFileIO(this)
	}

	override createGraphic(): Graphic {
		return new SudokuGraphic(this)
	}

	override createKeyEvent(): KeyEvent {
		return new SudokuKeyEvent(this)
	}

	override createMouseEvent(): MouseEvent1 {
		return new SudokuMouseEvent(this)
	}

	override getConverters() {
		return [number16]
	}
}

