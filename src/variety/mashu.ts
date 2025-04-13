import { MouseEvent1 } from "../puzzle/MouseInput";
import { KeyEvent } from "../puzzle/KeyInput";
import { AnsCheck } from "../puzzle/Answer";
import { FileIO } from "../puzzle/FileData";
import { Graphic } from "../puzzle/Graphic";
import { LineGraph } from "../puzzle/LineManager";
import { Board } from "../puzzle/Board";
import { type Border, Cell, type Cross, type EXCell } from "../puzzle/Piece";
import { Puzzle } from "../puzzle/Puzzle";
import { circle, type Converter } from "../puzzle/Encode";
//---------------------------------------------------------
// マウス入力系
class MashuMouseEvent extends MouseEvent1 {
	override inputModes = {
		edit: ['circle-shade', 'circle-unshade', 'undef', 'clear', 'info-line'],
		play: ['line', 'peke', 'info-line']
	}

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
class MashuKeyEvent extends KeyEvent {
	override enablemake = true
}

//---------------------------------------------------------
// 盤面管理系
class MashuCell extends Cell {
	override numberAsObject = true

	override maxnum = () => 2
	override adjacent: { top: MashuCell; bottom: MashuCell; left: MashuCell; right: MashuCell; } = null!;

	setErrorPearl() {
		this.setCellLineError(1);
		const adc = this.adjacent;
		const adb = this.adjborder;
		if (adb.top.isLine()) { adc.top.setCellLineError(0); }
		if (adb.bottom.isLine()) { adc.bottom.setCellLineError(0); }
		if (adb.left.isLine()) { adc.left.setCellLineError(0); }
		if (adb.right.isLine()) { adc.right.setCellLineError(0); }
	}

	//---------------------------------------------------------------------------
	// cell.setCellLineError()    セルと周りの線にエラーフラグを設定する
	//---------------------------------------------------------------------------
	setCellLineError(flag: number) {
		const bx = this.bx;
		const by = this.by;
		if (!!flag) { this.seterr(1); }
		this.board.borderinside(bx - 1, by - 1, bx + 1, by + 1).seterr(1);
	}
}

class MashuBoard extends Board<MashuCell> {
	uramashu = false

	revCircle() {
		if (!this.uramashu) { return; }
		this.revCircleMain();
	}
	revCircleConfig(newval: boolean) {
		if (this.uramashu === newval) { return; }
		this.uramashu = newval;
		this.revCircleMain();
	}
	revCircleMain() {
		for (let c = 0; c < this.cell.length; c++) {
			const cell = this.cell[c];
			if (cell.qnum === 1) { cell.setQnum(2); }
			else if (cell.qnum === 2) { cell.setQnum(1); }
		}
	}

	override createCell(): MashuCell {
		return new MashuCell(this.puzzle)
	}
}



//---------------------------------------------------------
// 画像表示系
class MashuGraphic extends Graphic {
	override irowake = true

	override gridcolor_type: "DARK" | "LIGHT" | "DLIGHT" | "SLIGHT" | "THIN" = "LIGHT"

	override circlefillcolor_func = "qnum2"
	override circlestrokecolor_func = "qnum2"

	override paint() {
		this.drawBGCells();
		this.drawDashedGrid();

		this.drawCircles();
		this.drawHatenas();

		this.drawPekes();
		this.drawLines();

		this.drawChassis();

		this.drawTarget();
	}
}


//---------------------------------------------------------
class MashuFileIO extends FileIO {
	override decodeData() {
		this.decodeCellQnum();
		this.decodeBorderLine();
		//this.board.revCircle();
	}
	override encodeData() {
		//this.board.revCircle();
		this.encodeCellQnum();
		this.encodeBorderLine();
		//this.board.revCircle();
	}
}

//---------------------------------------------------------
// 正解判定処理実行部
class MashuAnsCheck extends AnsCheck<MashuCell> {
	override getCheckList() {
		return [
			"checkLineExist+",
			"checkBranchLine",
			"checkCrossLine",
			"checkWhitePearl1",
			"checkBlackPearl1",
			"checkBlackPearl2",
			"checkWhitePearl2",
			"checkNoLinePearl",
			"checkDeadendLine+",
			"checkOneLoop"
		]
	}

	checkNoLinePearl() {
		this.checkAllCell(function (cell) { return (cell.isNum() && cell.lcnt === 0); }, "mashuOnLine");
	}

	checkWhitePearl1() {
		let result = true;
		const bd = this.puzzle.board;
		for (let c = 0; c < bd.cell.length; c++) {
			const cell = bd.cell[c];
			if (!(cell.qnum === 1 && cell.isLineCurve())) { continue; }

			result = false;
			if (this.checkOnly) { break; }
			cell.setCellLineError(1);
		}
		if (!result) {
			this.failcode.add("mashuWCurve");
			bd.border.setnoerr();
		}
	}
	checkBlackPearl1() {
		let result = true;
		const bd = this.puzzle.board;
		for (let c = 0; c < bd.cell.length; c++) {
			const cell = bd.cell[c];
			if (!(cell.qnum === 2 && cell.isLineStraight())) { continue; }

			result = false;
			if (this.checkOnly) { break; }
			cell.setCellLineError(1);
		}
		if (!result) {
			this.failcode.add("mashuBStrig");
			bd.border.setnoerr();
		}
	}

	checkWhitePearl2() {
		let result = true;
		const bd = this.puzzle.board;
		for (let c = 0; c < bd.cell.length; c++) {
			const cell = bd.cell[c];
			if (cell.qnum !== 1 || cell.lcnt !== 2) { continue; }
			const adc = cell.adjacent;
			const adb = cell.adjborder;
			let stcnt = 0;
			if (adb.top.isLine() && adc.top.isLineStraight()) { stcnt++; }
			if (adb.bottom.isLine() && adc.bottom.isLineStraight()) { stcnt++; }
			if (adb.left.isLine() && adc.left.isLineStraight()) { stcnt++; }
			if (adb.right.isLine() && adc.right.isLineStraight()) { stcnt++; }
			if (stcnt < 2) { continue; }

			result = false;
			if (this.checkOnly) { break; }
			cell.setErrorPearl();
		}
		if (!result) {
			this.failcode.add("mashuWStNbr");
			bd.border.setnoerr();
		}
	}
	checkBlackPearl2() {
		let result = true;
		const bd = this.puzzle.board;
		for (let c = 0; c < bd.cell.length; c++) {
			const cell = bd.cell[c];
			const adc = cell.adjacent;
			const adb = cell.adjborder;
			if (cell.qnum !== 2 || cell.lcnt !== 2) { continue; }
			if (!(adb.top.isLine() && adc.top.isLineCurve()) &&
				!(adb.bottom.isLine() && adc.bottom.isLineCurve()) &&
				!(adb.left.isLine() && adc.left.isLineCurve()) &&
				!(adb.right.isLine() && adc.right.isLineCurve())) { continue; }

			result = false;
			if (this.checkOnly) { break; }
			cell.setErrorPearl();
		}
		if (!result) {
			this.failcode.add("mashuBCvNbr");
			bd.border.setnoerr();
		}
	}
}

// class MashuFailCode extends FailCode {
// 	mashuOnLine = ["線が上を通っていない丸があります。", "Lines don't pass some pearls."],
// 	mashuWCurve = ["白丸の上で線が曲がっています。", "Lines curve on white pearl."],
// 	mashuWStNbr = ["白丸の隣で線が曲がっていません。", "Lines go straight next to white pearl on each side."],
// 	mashuBStrig = ["黒丸の上で線が直進しています。", "Lines go straight on black pearl."],
// 	mashuBCvNbr = ["黒丸の隣で線が曲がっています。", "Lines curve next to black pearl."]
// }

export class Mashu extends Puzzle<MashuCell> {
	override createBoard(): Board<MashuCell, Cross, Border, EXCell> {
		return new MashuBoard(this, {
			hasborder: 1,
			lineGraph: true
		})
	}
	override createAnsCheck(): AnsCheck<MashuCell, Cross, Border, EXCell> {
		return new MashuAnsCheck(this)
	}
	override createFailCode(): Map<string, [string, string]> {
		const f = super.createFailCode()
		const add: Record<string, [string, string]> = {
			mashuOnLine: ["線が上を通っていない丸があります。", "Lines don't pass some pearls."],
			mashuWCurve: ["白丸の上で線が曲がっています。", "Lines curve on white pearl."],
			mashuWStNbr: ["白丸の隣で線が曲がっていません。", "Lines go straight next to white pearl on each side."],
			mashuBStrig: ["黒丸の上で線が直進しています。", "Lines go straight on black pearl."],
			mashuBCvNbr: ["黒丸の隣で線が曲がっています。", "Lines curve next to black pearl."]
		}
		for (const [key, item] of Object.entries(add)) {
			f.set(key, item)
		}
		return f

	}

	override createKeyEvent(): KeyEvent {
		return new MashuKeyEvent(this)
	}

	override createFileIO(): FileIO {
		return new MashuFileIO(this)
	}

	override createGraphic(): Graphic {
		return new MashuGraphic(this)
	}

	override createMouseEvent(): MouseEvent1 {
		return new MashuMouseEvent(this)
	}

	override initConverters(): void {
		this.converters.push(circle)
	}
}

