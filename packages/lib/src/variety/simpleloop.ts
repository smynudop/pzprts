//
// パズル固有スクリプト部 カントリーロード・月か太陽・温泉めぐり版 country.js

import { createVariety } from "./createVariety";

//
export const SimpleLoop = createVariety({
    pid: "simpleloop",
    //---------------------------------------------------------
    // マウス入力系

    MouseEvent: {
        inputModes: {
            edit: ["clear", "info-line", "empty"],
            play: ["line", "peke", "clear", "info-line"]
        },
        mouseinput_auto: function () {

            if (this.puzzle.playmode) {
                if (this.mousestart || this.mousemove) {
                    if (this.btn === "left") {
                        this.inputLine();
                    } else if (this.btn === "right") {
                        this.inputpeke();
                    }
                }
            } else if (this.puzzle.editmode) {
                this.inputempty();
            }
        },
        inputempty: function () {
            const cell = this.getcell();
            if (cell.isnull || cell === this.mouseCell) {
                return;
            }

            if (this.inputData === null) {
                this.inputData = cell.isEmpty() ? 0 : 7;
            }

            cell.setValid(this.inputData);
            this.mouseCell = cell;
        },
    },

    //---------------------------------------------------------
    // キーボード入力系
    KeyEvent: {
        enablemake: true
    },

    //---------------------------------------------------------
    // 盤面管理系

    Cell: {
        noLP: function (dir) {
            return this.isEmpty();
        }
    },
    Border: {
        enableLineNG: true
    },
    Board: {
        hasborder: 1
    },
    LineGraph: {
        enabled: true
    },
    AreaRoomGraph: {
        enabled: true
    },
    //---------------------------------------------------------
    // 画像表示系
    Graphic: {
        irowake: true,

        numbercolor_func: "qnum",

        gridcolor_type: "SLIGHT",

        paint: function () {

            this.drawDashedGrid();
            this.drawBGCells();

            this.drawBorders();

            this.drawLines();
            this.drawPekes();

            this.drawChassis();

        },

        getBGCellColor: function (cell) {
            return cell.ques === 7 ? "black" : this.getBGCellColor_error1(cell);
        },
        getBorderColor: function (border) {
            const cell1 = border.sidecell[0],
                cell2 = border.sidecell[1];
            if (cell1.ques === 7 && cell2.ques === 7) {
                return null;
            }
            if ((cell1.ques === 7 || cell2.ques === 7)) {
                return null;
            }
            if (
                border.inside &&
                !cell1.isnull &&
                !cell2.isnull &&
                (cell1.isEmpty() || cell2.isEmpty())
            ) {
                return "black";
            }
            return this.getBorderColor_ques(border);
        }
    },

    //---------------------------------------------------------
    // URLエンコード/デコード処理
    Encode: {
        decodePzpr: function (type) {
            this.decodeEmpty();
        },
        encodePzpr: function (type) {
            this.encodeEmpty();
        }
    },
    //---------------------------------------------------------
    FileIO: {
        decodeData: function () {
            this.decodeEmpty();
            this.decodeBorderLine()
        },
        encodeData: function () {
            this.encodeEmpty();
            this.encodeBorderLine()
        },
        decodeEmpty: function () {
            this.decodeCell(function (cell, ca) {
                if (ca === "*") {
                    cell.ques = 7;
                }
            });
        },
        encodeEmpty: function () {
            this.encodeCell(function (cell) {
                if (cell.ques === 7) {
                    return "* ";
                } else {
                    return ". ";
                }
            });
        }
    },


    AnsCheck: {
        checklist: [
            "checkBranchLine",
            "checkCrossLine",
            "checkDeadendLine+",
            "checkOneLoop",
            "checkNoLine"
        ],
    },
});
