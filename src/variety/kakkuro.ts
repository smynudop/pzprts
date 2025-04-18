
//---------------------------------------------------------

import { AnsCheck } from "../puzzle/Answer";
import { Board } from "../puzzle/Board";
import { BoardExec } from "../puzzle/BoardExec";
import { FileIO } from "../puzzle/FileData";
import { Graphic } from "../puzzle/Graphic";
import { KeyEvent, TargetCursor } from "../puzzle/KeyInput";
import { MouseEvent1 } from "../puzzle/MouseInput";
import { type Border, Cell, type Cross, EXCell } from "../puzzle/Piece";
import type { CellList } from "../puzzle/PieceList";
import { Puzzle } from "../puzzle/Puzzle";

// マウス入力系
class KakkuroMouseEvent extends MouseEvent1 {
	override inputModes = { edit: ['cell51', 'clear', 'number'], play: ['number', 'clear'] }
	override mouseinput_clear() {
		this.input51_fixed();
	}
	override mouseinput_number() {
		if (this.mousestart) { this.inputqnum_cell51(); }
	}
	override mouseinput_auto() {
		if (this.puzzle.playmode) {
			if (this.mousestart) { this.inputqnum(); }
		}
		else if (this.puzzle.editmode) {
			if (this.mousestart) { this.input51(); }
		}
	}
}

//---------------------------------------------------------
// キーボード入力系
class KakkuroKeyEvent extends KeyEvent {
	override enablemake = true
	override enableplay = true

	override keyinput(ca: string) {
		if (this.puzzle.editmode) { this.inputnumber51(ca); }
		else if (this.puzzle.playmode) { this.key_inputqnum(ca); }
	}
}

class KakkuroTargetCursor extends TargetCursor {
	override setminmax_customize() {
		if (this.puzzle.editmode) { return; }
		this.minx += 2;
		this.miny += 2;
	}
}

//---------------------------------------------------------
// 盤面管理系
class KakkuroCell extends Cell {
	override qnum = 0
	override qnum2 = 0

	override noNum() { return !this.isnull && (this.qnum === 0 && this.qnum2 === 0 && this.anum === -1); }

	/* 問題の0入力は↓の特別処理で可能にしてます */
	override disInputHatena = true
	override enableSubNumberArray = true

	override getmaxnum() {
		return (this.puzzle.editmode ? 45 : 9);
	}

	// この関数は回答モードでしか呼ばれないはず、
	override getNum() { return this.anum; }
	override setNum(val: number) { this.setAnum(val > 0 ? val : -1); this.clrSnum(); }

	// 問題入力モードは0でも入力できるようにする
	override prehook = {
		qnum(cell: Cell, num: number) { return false; },
		qnum2(cell: Cell, num: number) { return false; }
	}

}

class KakkuroEXCell extends EXCell {
	override ques = 51

	override qnum = 0
	override qnum2 = 0
	override maxnum = () => 45
	override minnum = () => 1

	disInputHatena = true
}

class KakkuroBoard extends Board {



	override createCell(): Cell {
		return new KakkuroCell(this.puzzle)
	}

	override createEXCell(): EXCell {
		return new KakkuroEXCell(this.puzzle)
	}

	override createBoardExec(): BoardExec {
		return new KakkuroBoardExec(this.puzzle)
	}
}

class KakkuroBoardExec extends BoardExec {
	override adjustBoardData(key: any, d: any) {
		this.adjustQues51_1(key, d);
	}
	override adjustBoardData2(key: any, d: any) {
		this.adjustQues51_2(key, d);
	}
}

//---------------------------------------------------------
// 画像表示系
class KakkuroGraphic extends Graphic {
	override ttcolor = "rgb(255,255,127)"

	override numbercolor_func = "anum"

	override paint() {
		this.drawBGCells();
		this.drawBGEXcells();
		this.drawTargetSubNumber();
		this.drawQues51();

		this.drawGrid();
		this.drawBorders();

		this.drawChassis_ex1(false);

		this.drawSubNumbers();
		this.drawAnsNumbers();
		this.drawQuesNumbersOn51();
		//this.drawQuesNumbers();

		this.drawCursor();
	}

	// オーバーライド drawBGCells用
	override getBGCellColor(cell: Cell) {
		if (cell.error === 1) { return this.errbcolor1; }
		if (cell.ques === 51) { return "rgb(192,192,192)"; }
		return null;
	}
	override getBGEXcellColor(excell: EXCell) {
		if (excell.error) { return this.errbcolor1; }
		return "rgb(192,192,192)";
	}
	// オーバーライド 境界線用
	override getBorderColor(border: Border) {
		const cell1 = border.sidecell[0];
		const cell2 = border.sidecell[1];
		if (!cell1.isnull && !cell2.isnull && ((cell1.ques === 51) !== (cell2.ques === 51))) {
			return this.quescolor;
		}
		return null;
	}

	getAnsNumberText(cell: Cell) {
		return ((!cell.is51cell() && cell.anum > 0) ? `${cell.anum}` : "");
	}
}

const kakkuroConverter = {

	decode(puzzle: Puzzle, bstr: string): string {
		const decval = (ca: string) => {
			if (ca >= '0' && ca <= '9') { return Number.parseInt(ca, 36); }
			if (ca >= 'a' && ca <= 'j') { return Number.parseInt(ca, 36); }
			if (ca >= 'A' && ca <= 'Z') { return Number.parseInt(ca, 36) + 10; }
			return 0;
		}

		// 盤面内数字のデコード
		let c = 0;
		let a = 0;
		const bd = puzzle.board;
		for (let i = 0; i < bstr.length; i++) {
			const ca = bstr.charAt(i);
			const cell = bd.cell[c];
			if (ca >= 'k' && ca <= 'z') { c += (Number.parseInt(ca, 36) - 19); }
			else {
				cell.ques = 51;
				if (ca !== '.') {
					cell.qnum2 = decval(ca);
					cell.qnum = decval(bstr.charAt(i + 1));
					i++;
				}
				c++;
			}
			if (!bd.cell[c]) { a = i + 1; break; }
		}

		// 盤面外数字のデコード
		let i = a;
		for (let bx = 1; bx < bd.maxbx; bx += 2) {
			if (!bd.getc(bx, 1).is51cell()) {
				bd.getex(bx, -1).qnum2 = decval(bstr.charAt(i));
				i++;
			}
		}
		for (let by = 1; by < bd.maxby; by += 2) {
			if (!bd.getc(1, by).is51cell()) {
				bd.getex(-1, by).qnum = decval(bstr.charAt(i));
				i++;
			}
		}

		return bstr.substring(a);
	},
	encode(puzzle: Puzzle): string {
		let cm = "";
		const bd = puzzle.board;

		const encval = (val: number) => {
			if (val >= 1 && val <= 19) { return val.toString(36).toLowerCase(); }
			if (val >= 20 && val <= 45) { return (val - 10).toString(36).toUpperCase(); }
			return "0";
		}

		// 盤面内側の数字部分のエンコード
		let count = 0;
		for (let c = 0; c < bd.cell.length; c++) {
			let pstr = "";
			const cell = bd.cell[c];

			if (cell.ques === 51) {
				if (cell.qnum <= 0 && cell.qnum2 <= 0) { pstr = "."; }
				else { pstr = `${encval(cell.qnum2)}${encval(cell.qnum)}`; }
			}
			else { count++; }

			if (count === 0) { cm += pstr; }
			else if (pstr || count === 16) { cm += ((count + 19).toString(36) + pstr); count = 0; }
		}
		if (count > 0) { cm += (count + 19).toString(36); }

		// 盤面外側の数字部分のエンコード
		for (let bx = 1; bx < bd.maxbx; bx += 2) {
			if (!bd.getc(bx, 1).is51cell()) {
				cm += encval(bd.getex(bx, -1).qnum2);
			}
		}
		for (let by = 1; by < bd.maxby; by += 2) {
			if (!bd.getc(1, by).is51cell()) {
				cm += encval(bd.getex(-1, by).qnum);
			}
		}

		return cm
	}


}



//---------------------------------------------------------
class KakkuroFileIO extends FileIO {
	override decodeData() {
		this.decodeCellQnum51();
		this.decodeCellAnumsub();
	}
	override encodeData() {
		this.encodeCellQnum51();
		this.encodeCellAnumsub();
	}
}

//---------------------------------------------------------
// 正解判定処理実行部
class KakkuroAnsCheck extends AnsCheck {

	override getCheckList(): string[] {
		return [
			"checkSameNumberInLine",
			"checkSumOfNumberInLine",
			"checkNoNumCell+"
		]
	}

	checkSameNumberInLine() {
		this.checkRowsColsPartly(
			(clist, info) => this.isSameNumber(clist, info),
			(cell) => cell.is51cell(),
			"nmDupRow");
	}
	isSameNumber(clist: CellList, info: any) {
		const result = this.isDifferentAnsNumberInClist(clist);
		if (!result) { info.keycell.seterr(1); }
		return result;
	}

	checkSumOfNumberInLine() {
		this.checkRowsColsPartly(
			(clist, info) => this.isTotalNumber(clist, info),
			(cell) => cell.is51cell(),
			"nmSumRowNe"
		);
	}
	isTotalNumber(clist: CellList, info: any) {
		const number = info.key51num;
		let sum = 0;
		for (let i = 0; i < clist.length; i++) {
			if (clist[i].anum > 0) { sum += clist[i].anum; }
			else { return true; }
		}
		const result = (number <= 0 || sum === number);
		if (!result) {
			info.keycell.seterr(1);
			clist.seterr(1);
		}
		return result;
	}
}

export class Kakkuro extends Puzzle {
	override createBoard(): Board<Cell, Cross, Border, EXCell> {
		return new KakkuroBoard(this, {
			cols: 11,
			rows: 11,
			hasborder: 1,
			hasexcell: 1
		})
	}

	override createGraphic(): Graphic {
		return new KakkuroGraphic(this)
	}

	override createFileIO(): FileIO {
		return new KakkuroFileIO(this)
	}

	override createAnsCheck(): AnsCheck<Cell, Cross, Border, EXCell> {
		return new KakkuroAnsCheck(this)
	}

	override createMouseEvent(): MouseEvent1 {
		return new KakkuroMouseEvent(this)
	}

	override createKeyEvent(): KeyEvent {
		return new KakkuroKeyEvent(this)
	}

	override getConverters() {
		return [kakkuroConverter]
	}

	override createTargetCursor(): TargetCursor {
		return new KakkuroTargetCursor(this)
	}

	override getAdditionalFailCode(): Map<string, [string, string]> {
		const map = new Map()
		map.set("nmSumRowNe", ["数字の下か右にある数字の合計が間違っています。", "The sum of the cells is not correct."])
		map.set("ceNoNum", ["すべてのマスに数字が入っていません。", "There is an empty cell."])

		return map
	}
}

