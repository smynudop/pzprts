import { AnsCheck, FailCode } from "../puzzle/Answer";
import { Board } from "../puzzle/Board";
import { Encode } from "../puzzle/Encode";
import { FileIO } from "../puzzle/FileData";
import { Graphic } from "../puzzle/Graphic";
import { KeyEvent } from "../puzzle/KeyInput";
import { LineGraph } from "../puzzle/LineManager";
import { MouseEvent1 } from "../puzzle/MouseInput";
import { Border, Cell, Cross } from "../puzzle/Piece";
import { BorderList } from "../puzzle/PieceList";
import { Puzzle } from "../puzzle/Puzzle";

class SlitherMouseEvent extends MouseEvent1 {
    inputModes = {
        edit: ['number', 'clear', 'info-line'],
        play: ['line', 'peke', 'bgcolor', 'bgcolor1', 'bgcolor2', 'clear', 'info-line']
    }
    mouseinput_auto() {
        var puzzle = this.puzzle;
        if (puzzle.playmode) {
            if (this.checkInputBGcolor()) {
                this.inputBGcolor();
            }
            else if (this.btn === 'left') {
                if (this.mousestart || this.mousemove) { this.inputLine(); }
                else if (this.pid === 'slither' && this.mouseend && this.notInputted()) {
                    this.prevPos.reset();
                    this.inputpeke();
                }
            }
            else if (this.btn === 'right') {
                if (this.pid === 'slither' && (this.mousestart || this.mousemove)) { this.inputpeke(); }
                else if (this.pid === 'bag') { this.inputBGcolor(true); }
            }
        }
        else if (puzzle.editmode) {
            if (this.mousestart) {
                this.inputqnum();
            }
        }
    }

    checkInputBGcolor() {
        var inputbg = (this.pid === 'bag' || this.puzzle.execConfig('bgcolor'));
        if (inputbg) {
            if (this.mousestart) { inputbg = this.getpos(0.25).oncell(); }
            else if (this.mousemove) { inputbg = (this.inputData >= 10); }
            else { inputbg = false; }
        }
        return inputbg;
    }
}

class SlitherKeyEvent extends KeyEvent {

    enablemake: true

}

class SlitherBoard extends Board<SlitherCell> {
    hasborder = 2
    borderAsLine = true
    createCell() {
        return new SlitherCell(this.puzzle);
    }
}
class SlitherCell extends Cell {
    maxnum() {
        return 3
    }
    minnum() {
        return 0;
    }

    getdir4BorderLine1() {
        var adb = this.adjborder, cnt = 0;
        if (adb.top.isLine()) { cnt++; }
        if (adb.bottom.isLine()) { cnt++; }
        if (adb.left.isLine()) { cnt++; }
        if (adb.right.isLine()) { cnt++; }
        return cnt;
    }
}

class SlitherGraphic extends Graphic {
    bgcellcolor_func = "qsub2"
    numbercolor_func = "qnum"
    margin = 0.5
    irowake = true

    paint() {
        this.drawBGCells();
        this.drawLines();

        this.drawBaseMarks();

        this.drawQuesNumbers();

        this.drawPekes();

        this.drawTarget();
    }


    repaintParts(blist: BorderList) {
        if (this.pid === 'slither') {
            this.range.crosses = blist.crossinside();
            this.drawBaseMarks();
        }
    }
}

class SlitherLineGraph extends LineGraph {
    enabled = true
}

class SlitherEncode extends Encode {
    decodePzpr(type: any) {
        this.decode4Cell();
    }
    encodePzpr(type: any) {
        this.encode4Cell();
    }

    decodeKanpen() {
        this.fio.decodeCellQnum_kanpen();
    }
    encodeKanpen() {
        this.fio.encodeCellQnum_kanpen();
    }
}

class SlitherFileIO extends FileIO {
    decodeData() {
        if (this.filever === 1 || this.puzzle.pid !== 'slither') {
            this.decodeCellQnum();
            this.decodeCellQsub();
            this.decodeBorderLine();
        }
        else if (this.filever === 0) {
            this.decodeCellQnum();
            this.decodeBorderLine();
        }
    }
    encodeData() {
        if (this.puzzle.pid === 'slither') { this.filever = 1; }
        this.encodeCellQnum();
        this.encodeCellQsub();
        this.encodeBorderLine();
    }

    kanpenOpen() {
        this.decodeCellQnum_kanpen();
        this.decodeBorderLine();
    }
    kanpenSave() {
        this.encodeCellQnum_kanpen();
        this.encodeBorderLine();
    }

    kanpenOpenXML() {
        this.PBOX_ADJUST = 0;
        this.decodeCellQnum_XMLBoard_Brow();
        this.PBOX_ADJUST = 1;
        this.decodeBorderLine_slither_XMLAnswer();
    }
    kanpenSaveXML() {
        this.PBOX_ADJUST = 0;
        this.encodeCellQnum_XMLBoard_Brow();
        this.PBOX_ADJUST = 1;
        this.encodeBorderLine_slither_XMLAnswer();
    }

    UNDECIDED_NUM_XML = 5
    PBOX_ADJUST = 1
    decodeBorderLine_slither_XMLAnswer() {
        this.decodeCellXMLArow(function (cross, name) {
            var val = 0;
            var bdh = cross.relbd(0, 1), bdv = cross.relbd(1, 0);
            if (name.charAt(0) === 'n') { val = +name.substr(1); }
            else {
                if (name.match(/h/)) { val += 1; }
                if (name.match(/v/)) { val += 2; }
            }
            if (val & 1) { bdh.line = 1; }
            if (val & 2) { bdv.line = 1; }
            if (val & 4) { bdh.qsub = 2; }
            if (val & 8) { bdv.qsub = 2; }
        });
    }
    encodeBorderLine_slither_XMLAnswer() {
        this.encodeCellXMLArow(function (cross) {
            var val = 0, nodename = '';
            var bdh = cross.relbd(0, 1), bdv = cross.relbd(1, 0);
            if (bdh.line === 1) { val += 1; }
            if (bdv.line === 1) { val += 2; }
            if (bdh.qsub === 2) { val += 4; }
            if (bdv.qsub === 2) { val += 8; }

            if (val === 0) { nodename = 's'; }
            else if (val === 1) { nodename = 'h'; }
            else if (val === 2) { nodename = 'v'; }
            else if (val === 3) { nodename = 'hv'; }
            else { nodename = 'n' + val; }
            return nodename;
        });
    }
}

class SlitherAnsCheck extends AnsCheck<SlitherCell> {
    checklist = [
        "checkLineExist+",
        "checkBranchLine",
        "checkCrossLine",

        "checkdir4BorderLine@slither",

        "checkOneLoop",
        "checkDeadendLine+",

        "checkOutsideNumber@bag",
        "checkViewOfNumber@bag"
    ]

    checkdir4BorderLine() {
        this.checkAllCell(function (cell) { return (cell.qnum >= 0 && cell.getdir4BorderLine1() !== cell.qnum); }, "nmLineNe");
    }
}

class SlitherFailCode extends FailCode {
    nmLineNe = ["数字の周りにある線の本数が違います。", "The number is not equal to the number of lines around it."]
}

export class SlitherLink extends Puzzle<SlitherCell> {
    pid: "slither"
    createMouseEvent(): MouseEvent1 {
        return new SlitherMouseEvent(this);
    }

    createKeyEvent(): KeyEvent {
        return new SlitherKeyEvent(this);
    }

    createGraphic(): Graphic {
        return new SlitherGraphic(this);
    }

    createBoard() {
        return new SlitherBoard(this);
    }

    createFailCode(): FailCode {
        return new SlitherFailCode();
    }

    createEncoder(): Encode {
        return new SlitherEncode(this);
    }

    createFileIO(): FileIO {
        return new SlitherFileIO(this);
    }

    createAnsCheck() {
        return new SlitherAnsCheck(this);
    }

}

