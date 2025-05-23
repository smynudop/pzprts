//
// パズル固有スクリプト部 スリザーリンク・バッグ版 slither.js

import { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Bag = createVariety({
    pid: "bag",
    //---------------------------------------------------------
    // マウス入力系
    MouseEvent: {
        inputModes: { edit: ['number', 'clear', 'info-line'], play: ['line', 'peke', 'bgcolor', 'bgcolor1', 'bgcolor2', 'clear', 'info-line'] },
        mouseinput_auto: function () {
            const puzzle = this.puzzle;
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
                if (this.mousestart) { this.inputqnum(); }
            }
        },

        checkInputBGcolor: function () {
            let inputbg = (this.pid === 'bag' || this.puzzle.execConfig('bgcolor'));
            if (inputbg) {
                if (this.mousestart) { inputbg = this.getpos(0.25).oncell(); }
                else if (this.mousemove) { inputbg = (this.inputData >= 10); }
                else { inputbg = false; }
            }
            return inputbg;
        }
    },

    //---------------------------------------------------------
    // キーボード入力系
    KeyEvent: {
        enablemake: true
    },

    //---------------------------------------------------------
    // 盤面管理系
    Cell: {
        maxnum: function (): number {
            return Math.min(999, this.board.cols + this.board.rows - 1);
        },
        minnum: 2,

        inside: false /* 正答判定用 */
    },

    Board: {
        hasborder: 2,
        borderAsLine: true,
        searchInsideArea: function () {
            this.cell[0].inside = (this.cross[0].lcnt !== 0);
            for (let by = 1; by < this.maxby; by += 2) {
                if (by > 1) { this.getc(1, by).inside = !!(this.getc(1, by - 2).inside !== this.getb(1, by - 1).isLine()); }
                for (let bx = 3; bx < this.maxbx; bx += 2) {
                    this.getc(bx, by).inside = !!(this.getc(bx - 2, by).inside !== this.getb(bx - 1, by).isLine());
                }
            }
        }
    },

    LineGraph: {
        enabled: true
    },

    //---------------------------------------------------------
    // 画像表示系
    Graphic: {
        gridcolor_type: "DLIGHT",
        bgcellcolor_func: "qsub2",
        numbercolor_func: "qnum",
        margin: 0.5,

        paint: function () {
            this.drawBGCells();
            this.drawDashedGrid(false);
            this.drawLines();


            this.drawQuesNumbers();


            this.drawTarget();
        },

        repaintParts: function (blist) {
        }
    },

    //---------------------------------------------------------
    // URLエンコード/デコード処理

    Encode: {
        decodePzpr: function (type) {
            this.decodeNumber16();
        },
        encodePzpr: function (type) {
            this.encodeNumber16();
        }
    },
    //---------------------------------------------------------
    FileIO: {
        decodeData: function () {
            this.decodeCellQnum();
            this.decodeCellQsub();
            this.decodeBorderLine();

        },
        encodeData: function () {
            this.encodeCellQnum();
            this.encodeCellQsub();
            this.encodeBorderLine();
        }
    },

    //---------------------------------------------------------
    // 正解判定処理実行部
    AnsCheck: {
        checklist: [
            "checkLineExist+",
            "checkBranchLine",
            "checkCrossLine",

            "checkOneLoop",
            "checkDeadendLine+",

            "checkOutsideNumber",
            "checkViewOfNumber"
        ],
        checkOutsideNumber: function () {
            this.board.searchInsideArea();	/* cell.insideを設定する */
            this.checkAllCell(function (cell) { return (!cell.inside && cell.isNum()); }, "nmOutside");
        },
        checkViewOfNumber: function () {
            const bd = this.board;
            for (let cc = 0; cc < bd.cell.length; cc++) {
                const cell = bd.cell[cc];
                if (!cell.isValidNum()) { continue; }

                let clist = new CellList(), adc = cell.adjacent, target = adc.left;
                clist.add(cell);
                target = adc.left; while (!target.isnull && target.inside) { clist.add(target); target = target.adjacent.left; }
                target = adc.right; while (!target.isnull && target.inside) { clist.add(target); target = target.adjacent.right; }
                target = adc.top; while (!target.isnull && target.inside) { clist.add(target); target = target.adjacent.top; }
                target = adc.bottom; while (!target.isnull && target.inside) { clist.add(target); target = target.adjacent.bottom; }

                if (cell.qnum === clist.length) { continue; }

                this.failcode.add("nmSumViewNe");
                if (this.checkOnly) { break; }
                clist.seterr(1);
            }
        }
    },

    FailCode: {
        nmOutside: ["輪の内側に入っていない数字があります。", "There is an outside number."],
        nmSumViewNe: ["数字と輪の内側になる4方向のマスの合計が違います。", "The number and the sum of the inside cells of four direction is different."]
    }
});