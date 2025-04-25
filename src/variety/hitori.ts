
//---------------------------------------------------------

import { AnsCheck } from "../puzzle/Answer";
import { Board } from "../puzzle/Board";
import { type Converter, include } from "../puzzle/Encode";
import { FileIO } from "../puzzle/FileData";
import { Graphic } from "../puzzle/Graphic";
import { KeyEvent } from "../puzzle/KeyInput";
import { MouseEvent1 } from "../puzzle/MouseInput";
import { type Border, Cell, type Cross, type EXCell } from "../puzzle/Piece";
import type { CellList } from "../puzzle/PieceList";
import { Puzzle } from "../puzzle/Puzzle";

// マウス入力系
class HitokureMouseEvent extends MouseEvent1 {
	override RBShadeCell = true
	override use = true
	override inputModes = { edit: ['number', 'clear', 'info-blk'], play: ['shade', 'unshade', 'info-blk'] }
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
class HitokureKeyEvent extends KeyEvent {
	override enablemake = true
}

//---------------------------------------------------------
// 盤面管理系
class HitokureCell extends Cell {
	override disInputHatena = true

	override maxnum = () => {
		return Math.max(this.board.cols, this.board.rows);
	}

	override posthook = {
		qnum(cell: Cell, num: any) { redDisp(cell); },
		qans(cell: Cell, num: any) { redDisp(cell); }
	}


}
const redDisp = (cell: Cell) => {
	const puzzle = cell.puzzle;
	const bd = cell.board;
	if (puzzle.getConfig('autoerr')) {
		puzzle.painter.paintRange(bd.minbx - 1, cell.by - 1, bd.maxbx + 1, cell.by + 1);
		puzzle.painter.paintRange(cell.bx - 1, bd.minby - 1, cell.bx + 1, bd.maxby + 1);
	}
}
class HitokureBoard extends Board<HitokureCell> {
	override cols = 8
	override rows = 8

	override createCell(): HitokureCell {
		return new HitokureCell(this.puzzle)
	}
}

//---------------------------------------------------------
// 画像表示系
class HitokureGraphic extends Graphic {
	override gridcolor_type: "DARK" | "LIGHT" | "DLIGHT" | "SLIGHT" | "THIN" = "LIGHT"

	override enablebcolor = true
	override bgcellcolor_func = "qsub1"

	override errcolor1 = "red"
	override fontShadecolor = "rgb(96,96,96)"

	override paint() {
		this.drawBGCells();
		this.drawGrid();
		this.drawShadedCells();

		this.drawQuesNumbers_hitori();

		this.drawChassis();

		this.drawTarget();
	}

	drawQuesNumbers_hitori() {
		const puzzle = this.puzzle;
		const bd = puzzle.board;
		const chk = puzzle.checker;
		if (!bd.haserror && !bd.hasinfo && puzzle.getConfig('autoerr')) {
			// const pt = puzzle.klass.CellList.prototype;
			// const seterr = pt.seterr;
			// const fcd = chk.failcode;
			// chk.inCheck = true;
			// chk.checkOnly = false;
			// chk.failcode = { add: function () { } };
			// pt.seterr = pt.setinfo;
			// chk.checkRowsColsSameQuesNumber();
			// pt.seterr = seterr;
			// chk.failcode = fcd;
			// chk.inCheck = false;

			// const clist = this.range.cells;
			// this.range.cells = bd.cell;
			this.drawQuesNumbers();
			// this.range.cells = clist;

			// bd.cell.setinfo(0);
		}
		else {
			this.drawQuesNumbers();
		}
	}
}
const hitokureConverter: Converter = {
	decode(puzzle, bstr) {
		let c = 0;
		let i = 0;
		const bd = puzzle.board;
		for (i = 0; i < bstr.length; i++) {
			const cell = bd.cell[c];
			const ca = bstr.charAt(i);

			if (include(ca, "0", "9") || include(ca, "a", "z")) { cell.qnum = Number.parseInt(ca, 36); }
			else if (ca === '-') { cell.qnum = Number.parseInt(bstr.substr(i + 1, 2), 36); i += 2; }
			else if (ca === '%') { cell.qnum = -2; }

			c++;
			if (!bd.cell[c]) { break; }
		}
		return bstr.substring(i);
	},
	encode(puzzle) {
		let count = 0;
		let cm = "";
		const bd = puzzle.board;
		for (let c = 0; c < bd.cell.length; c++) {
			let pstr = "";
			const qn = bd.cell[c].qnum;

			if (qn === -2) { pstr = "%"; }
			else if (qn >= 0 && qn < 16) { pstr = qn.toString(36); }
			else if (qn >= 16 && qn < 256) { pstr = `-${qn.toString(36)}`; }
			else { count++; }

			if (count === 0) { cm += pstr; }
			else { cm += "."; count = 0; }
		}
		if (count > 0) { cm += "."; }

		return cm;
	}
}

//---------------------------------------------------------
class HitokureFileIO extends FileIO {
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
class HitokureAnsCheck extends AnsCheck<HitokureCell> {
	override getCheckList() {
		return [
			"checkShadeCellExist",
			"checkAdjacentShadeCell",
			"checkConnectUnshadeRB",
			"checkRowsColsSameQuesNumber"
		]
	}

	checkRowsColsSameQuesNumber() {
		this.checkRowsCols(this.isDifferentNumberInClist_hitori, "nmDupRow");
	}
	isDifferentNumberInClist_hitori(clist: CellList) {
		const clist2 = clist.filter(function (cell) { return (cell.isUnshade() && cell.isNum()); }) as CellList;
		return this.isIndividualObject(clist2, function (cell) { return cell.qnum; });
	}
}

export class Hitokure extends Puzzle<HitokureCell> {
	override createAnsCheck(): AnsCheck<HitokureCell, Cross, Border, EXCell, Board<HitokureCell, Cross, Border, EXCell>> {
		return new HitokureAnsCheck(this.board)
	}
	override getAdditionalFailCode(): Map<string, [string, string]> {
		return new Map()
	}

	override createBoard(): Board<HitokureCell, Cross, Border, EXCell> {
		return new HitokureBoard(this, {
			areaUnshadeGraph: true
		})
	}

	override createFileIO(): FileIO {
		return new HitokureFileIO(this)
	}

	override createGraphic(): Graphic {
		return new HitokureGraphic(this)
	}

	override createKeyEvent(): KeyEvent {
		return new HitokureKeyEvent(this)
	}

	override createMouseEvent(): MouseEvent1 {
		return new HitokureMouseEvent(this)
	}

	override getConverters() {
		return [hitokureConverter]
	}
}