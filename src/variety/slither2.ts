import { AnsCheck } from "../puzzle/Answer";
import { Board } from "../puzzle/Board";
import { cell4 } from "../puzzle/Encode";
import { FileIO } from "../puzzle/FileData";
import { Graphic } from "../puzzle/Graphic";
import { KeyEvent } from "../puzzle/KeyInput";
import { LineGraph } from "../puzzle/LineManager";
import { MouseEvent1 } from "../puzzle/MouseInput";
import { Border, Cell, Cross } from "../puzzle/Piece";
import type { BorderList } from "../puzzle/PieceList";
import { Puzzle } from "../puzzle/Puzzle";

class SlitherMouseEvent extends MouseEvent1 {
    override inputModes = {
        edit: ['number', 'clear', 'info-line'],
        play: ['line', 'peke', 'bgcolor', 'bgcolor1', 'bgcolor2', 'clear', 'info-line']
    }
    override mouseinput_auto() {
        const puzzle = this.puzzle;
        if (puzzle.playmode) {
            if (this.checkInputBGcolor()) {
                this.inputBGcolor();
            }
            else if (this.btn === 'left') {
                if (this.mousestart || this.mousemove) { this.inputLine(); }
                else if (this.mouseend && this.notInputted()) {
                    this.prevPos.reset();
                    this.inputpeke();
                }
            }
            else if (this.btn === 'right') {
                if ((this.mousestart || this.mousemove)) { this.inputpeke(); }
            }
        }
        else if (puzzle.editmode) {
            if (this.mousestart) {
                this.inputqnum();
            }
        }
    }

    checkInputBGcolor() {
        let inputbg = (this.pid === 'bag' || this.puzzle.execConfig('bgcolor'));
        if (inputbg) {
            if (this.mousestart) { inputbg = this.getpos(0.25).oncell(); }
            else if (this.mousemove) { inputbg = (this.inputData >= 10); }
            else { inputbg = false; }
        }
        return inputbg;
    }
}

class SlitherKeyEvent extends KeyEvent {

    override enablemake = true

}

class SlitherBoard extends Board<SlitherCell> {
    override createCell() {
        return new SlitherCell(this.puzzle);
    }
}
class SlitherCell extends Cell {
    override maxnum() {
        return 3
    }
    override minnum() {
        return 0;
    }

    getdir4BorderLine1() {
        const adb = this.adjborder;
        let cnt = 0;
        if (adb.top.isLine()) { cnt++; }
        if (adb.bottom.isLine()) { cnt++; }
        if (adb.left.isLine()) { cnt++; }
        if (adb.right.isLine()) { cnt++; }
        return cnt;
    }
}

class SlitherGraphic extends Graphic {
    override bgcellcolor_func = "qsub2"
    override numbercolor_func = "qnum"
    override margin = 0.5
    override irowake = true

    override paint() {
        this.drawBGCells();
        this.drawLines();

        this.drawBaseMarks();

        this.drawQuesNumbers();

        this.drawPekes();

        this.drawTarget();
    }


    override repaintParts(blist: BorderList) {
        this.range.crosses = blist.crossinside();
        this.drawBaseMarks();
    }
}


class SlitherFileIO extends FileIO {
    override decodeData() {
        this.decodeCellQnum();
        this.decodeCellQsub();
        this.decodeBorderLine();
    }
    override encodeData() {
        this.filever = 1;
        this.encodeCellQnum();
        this.encodeCellQsub();
        this.encodeBorderLine();
    }
}

class SlitherAnsCheck extends AnsCheck<SlitherCell> {
    override getCheckList() {
        return [
            "checkLineExist+",
            "checkBranchLine",
            "checkCrossLine",

            "checkdir4BorderLine",

            "checkOneLoop",
            "checkDeadendLine+",
        ]
    }

    checkdir4BorderLine() {
        this.checkAllCell(function (cell) { return (cell.qnum >= 0 && cell.getdir4BorderLine1() !== cell.qnum); }, "nmLineNe");
    }
}


export class SlitherLink extends Puzzle<SlitherCell> {
    override pid = "slither"

    override createMouseEvent(): MouseEvent1 {
        return new SlitherMouseEvent(this);
    }

    override createKeyEvent(): KeyEvent {
        return new SlitherKeyEvent(this);
    }

    override createGraphic(): Graphic {
        return new SlitherGraphic(this);
    }

    override createBoard() {
        return new SlitherBoard(this, {
            lineGraph: true,
            borderAsLine: true,
            hasborder: 2
        });
    }

    override createFailCode() {
        const map = super.createFailCode()
        map.set("nmLineNe", ["数字の周りにある線の本数が違います。", "The number is not equal to the number of lines around it."])
        return map;
    }

    override createFileIO(): FileIO {
        return new SlitherFileIO(this);
    }

    override createAnsCheck() {
        return new SlitherAnsCheck(this);
    }

    override initConverters() {
        this.converters.push(cell4)
    }

}

