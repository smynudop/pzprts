//---------------------------------------------------------

import { AnsCheck } from "../puzzle/Answer";
import { Board } from "../puzzle/Board";
import { number16 } from "../puzzle/Encode";
import { FileIO } from "../puzzle/FileData";
import { Graphic } from "../puzzle/Graphic";
import { KeyEvent } from "../puzzle/KeyInput";
import { LineGraph } from "../puzzle/LineManager";
import { MouseEvent1 } from "../puzzle/MouseInput";
import type { Cell, Cross, Border, EXCell } from "../puzzle/Piece";
import { Puzzle } from "../puzzle/Puzzle";

// マウス入力系
class NumberlinkMouseEvent extends MouseEvent1 {
	override inputModes = { edit: ['number', 'clear', 'info-line'], play: ['line', 'peke', 'info-line'] }
	override mouseinput_auto() {
		if (this.puzzle.playmode) {
			if (this.btn === 'left') {
				if (this.mousestart || this.mousemove) { this.inputLine(); }
				else if (this.mouseend && this.notInputted()) { this.inputpeke(); }
			}
			else if (this.btn === 'right') {
				if (this.mousestart || this.mousemove) { this.inputpeke(); }
			}
		}
		else if (this.puzzle.editmode) {
			if (this.mousestart) { this.inputqnum(); }
		}
	}
}

//---------------------------------------------------------
// キーボード入力系
class NumberlinkKeyEvent extends KeyEvent {
	override enablemake = true
}


class NumberlinkBoard extends Board {
	override hasborder = 1
	override createLineGraph(): LineGraph {
		return new NumberlinkLineGraph(this.puzzle)
	}
}

class NumberlinkLineGraph extends LineGraph {
	override enabled = true
	override makeClist = true
}

//---------------------------------------------------------
// 画像表示系
class NumberlinkGraphic extends Graphic {
	override gridcolor_type: "DARK" | "LIGHT" | "DLIGHT" | "SLIGHT" | "THIN" = "LIGHT"

	override numbercolor_func = "qnum"

	override irowake = true

	override paint() {
		this.drawBGCells();
		this.drawGrid();

		this.drawPekes();
		this.drawLines();

		this.drawCellSquare();
		this.drawQuesNumbers();

		this.drawChassis();

		this.drawTarget();
	}

	drawCellSquare() {
		const g = this.vinc('cell_number_base', 'crispEdges', true);

		const rw = this.bw * (this.pid !== 'arukone' ? 0.7 : 0.5) - 1;
		const rh = this.bh * (this.pid !== 'arukone' ? 0.7 : 0.5) - 1;

		const clist = this.range.cells;
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			g.vid = `c_sq_${cell.id}`;
			if (cell.qnum !== -1) {
				g.fillStyle = (cell.error === 1 ? this.errbcolor1 : this.bgcolor);
				g.fillRectCenter(cell.bx * this.bw, cell.by * this.bh, rw, rh);
			}
			else { g.vhide(); }
		}
	}
}


//---------------------------------------------------------
class NumberlinkFileIO extends FileIO {
	override decodeData() {
		this.decodeCellQnum();
		this.decodeBorderLine();
	}
	override encodeData() {
		this.encodeCellQnum();
		this.encodeBorderLine();
	}
}


//---------------------------------------------------------
// 正解判定処理実行部
class NumberlinkAnsCheck extends AnsCheck {
	override checklist = [
		"checkLineExist+",
		"checkBranchLine",
		"checkCrossLine",
		"checkTripleObject",
		"checkLinkSameNumber",
		"checkLineOverLetter",
		"checkDeadendConnectLine+",
		"checkDisconnectLine",
		"checkNoLineObject+",
	]

	checkLinkSameNumber() {
		this.checkSameObjectInRoom(this.puzzle.board.linegraph, function (cell) { return cell.qnum; }, "nmConnDiff");
	}
}

// class NumberlinkFailCode extends FailCode {
// 	nmConnDiff: ["異なる数字がつながっています。", "Different numbers are connected."]
// }

export class Numberlink extends Puzzle {
	override createAnsCheck(): AnsCheck<Cell, Cross, Border, EXCell> {
		return new NumberlinkAnsCheck(this)
	}

	override createBoard(): Board<Cell, Cross, Border, EXCell> {
		return new NumberlinkBoard(this)
	}

	override createFileIO(): FileIO {
		return new NumberlinkFileIO(this)
	}

	override createGraphic(): Graphic {
		return new NumberlinkGraphic(this)
	}

	override createKeyEvent(): KeyEvent {
		return new NumberlinkKeyEvent(this)
	}

	override createMouseEvent(): MouseEvent1 {
		return new NumberlinkMouseEvent(this)
	}

	override createFailCode(): Map<string, [string, string]> {
		const map = super.createFailCode()
		map.set("nmConnDiff", ["異なる数字がつながっています。", "Different numbers are connected."])
		return map
	}

	override initConverters(): void {
		this.converters.push(number16)
	}

}