//@ts-nocheck
//
// pencils.js: Implementation of Pencils puzzle type.

import { createVariety } from "./createVariety";
import { DIRS } from "../puzzle/Constants";
import type { Border, Cell, IDir } from "../puzzle/Piece";
import { MouseEvent1 } from "../puzzle/MouseInput";
import type { CellList } from "../puzzle/PieceList";


export const Pencils = createVariety({
    pid: "pencils",
    //---------------------------------------------------------
    // マウス入力系
    MouseEvent: {
        inputModes: {
            edit: ["arrow", "number", "undef", "clear"],
            play: [
                "border",
                "line",
                "arrow",
                "peke",
                "bgcolor",
                "bgcolor1",
                "bgcolor2"
            ]
        },
        mouseinput_number: function () {
            if (this.mousestart) {
                this.inputqnum();
            }
        },
        mouseinput: function () {
            // オーバーライド
            if (this.inputMode === "undef") {
                if (this.mousestart) {
                    this.inputqnum();
                }
            } else {
                MouseEvent1.prototype.mouseinput.call(this);
            }
        },
        mouseinput_auto: function () {
            if (this.mousestart) {
                this.isBorderMode();
            } // XXX
            if (this.puzzle.playmode) {
                if (this.mousestart || this.mousemove) {
                    if (this.btn === "left") {
                        if (this.isBorderMode()) {
                            this.inputborder();
                        } else {
                            this.inputLineOrArrow();
                        }
                    } else {
                        this.inputpeke();
                    }
                } else if (this.mouseend && this.notInputted()) {
                    if (this.isBorderMode()) {
                        this.inputArrow();
                    } else {
                        this.inputBGcolor();
                    }
                }
            } else if (this.puzzle.editmode) {
                if (this.mouseend) {
                    if (this.isBorderMode()) {
                        this.inputArrow();
                    } else {
                        this.inputqnum_pencils();
                    }
                }
            }
        },

        inputArrow: function (): void {
            const pos = this.getpos(0.22);
            const border = pos.getb();
            if (!border.inside) {
                return;
            }
            const cell0 = border.sidecell[0],
                cell1 = border.sidecell[1];
            const blocked = cell0.qnum !== -1 && this.puzzle.playmode;
            const dir = border.getArrow();
            let dir0: IDir | 0 = 0,
                dir1: IDir | 0 = 0;
            if (border.isvert) {
                switch (dir) {
                    //biome-ignore lint: 
                    case 0:
                        if (!blocked) {
                            dir0 = DIRS.LT;
                            dir1 = 0;
                            break;
                        } // fallthrough
                    case DIRS.LT:
                        dir0 = 0;
                        dir1 = DIRS.RT;
                        break;
                    default:
                        dir0 = 0;
                        dir1 = 0;
                        break;
                }
            } else {
                switch (dir) {
                    //biome-ignore lint: 
                    case 0:
                        if (!blocked) {
                            dir0 = DIRS.UP;
                            dir1 = 0;
                            break;
                        } // fallthrough
                    case DIRS.UP:
                        dir0 = 0;
                        dir1 = DIRS.DN;
                        break;
                    default:
                        dir0 = 0;
                        dir1 = 0;
                        break;
                }
            }
            cell0.setArrow(dir0, this.puzzle.editmode);
            cell1.setArrow(dir1, this.puzzle.editmode);
            cell0.draw();
            cell1.draw();
            border.draw();
        },

        inputLineOrArrow: function (): void {
            const pos = this.getpos(0);
            if (this.prevPos.equals(pos)) {
                return;
            }
            const border = this.prevPos.getnb(pos);
            const cell0 = border.sidecell[0],
                cell1 = border.sidecell[1];

            if (!border.isnull) {
                if (this.inputData === null) {
                    // Do not use setArrow here, leave the border intact
                    if (
                        border.isvert &&
                        (cell0.qans === DIRS.LT || cell1.qans === DIRS.RT)
                    ) {
                        if (cell0.qans === DIRS.LT) {
                            cell0.setQans(0);
                        }
                        if (cell1.qans === DIRS.RT) {
                            cell1.setQans(0);
                        }
                        this.inputData = 0;
                    }
                    if (
                        !border.isvert &&
                        (cell0.qans === DIRS.UP || cell1.qans === DIRS.DN)
                    ) {
                        if (cell0.qans === DIRS.UP) {
                            cell0.setQans(0);
                        }
                        if (cell1.qans === DIRS.DN) {
                            cell1.setQans(0);
                        }
                        this.inputData = 0;
                    }
                }

                if (this.inputData === null) {
                    this.inputData = border.isLine() ? 0 : 1;
                }
                if (this.inputData === 1 && !border.ques) {
                    if (border.qans === 1) {
                        const dir = this.getDrawArrowDirection(border);
                        if (dir > 0) {
                            cell1.setArrow(border.isvert ? DIRS.RT : DIRS.DN, false);
                        } else {
                            cell0.setArrow(border.isvert ? DIRS.LT : DIRS.UP, false);
                        }
                    } else {
                        border.setLine();
                    }
                } else if (this.inputData === 0) {
                    border.removeLine();
                }
                border.draw();
            }
            this.prevPos = pos;
        },

        getDrawArrowDirection: function (border: Border): number {
            if (border.sidecell[0].isnull) {
                return +1;
            }
            if (border.sidecell[1].isnull) {
                return -1;
            }

            if (border.sidecell[0].qnum > 0) {
                return +1;
            }
            if (border.sidecell[1].qnum > 0) {
                return -1;
            }

            if (border.sidecell[1].lcnt > 0 && border.sidecell[0].lcnt === 0) {
                return +1;
            }
            if (border.sidecell[0].lcnt > 0 && border.sidecell[1].lcnt === 0) {
                return -1;
            }

            if (border.sidecell[0].room.pencil) {
                return +1;
            }
            if (border.sidecell[1].room.pencil) {
                return -1;
            }

            const pos = this.getpos(0);
            const dir = this.prevPos.getdir(pos, 2);

            return dir === DIRS.RT || dir === DIRS.DN ? +1 : -1;
        },

        mouseinput_clear: function () {
            const cell = this.getcell();

            if (cell.getPencilDir()) {
                cell.setArrow(0, true);
            } else {
                this.inputclean_cell();
            }
        },

        inputarrow_cell_main: function (cell, dir) {
            cell.setArrow(dir, this.puzzle.editmode);
        },

        inputqnum_pencils: function (): void {
            const cell = this.getcell();
            if (cell.isnull) {
                return;
            }

            if (cell !== this.cursor.getc() && this.inputMode === "auto") {
                this.setcursor(cell);
            } else {
                this.inputqnum(cell);
            }
        }
    },

    KeyEvent: {
        enablemake: true,
        moveTarget: function (ca): boolean {
            if (ca.match(/shift/)) {
                return false;
            }
            return this.moveTCell(ca);
        },

        keyinput: function (ca) {
            const cell = this.cursor.getc();
            if (cell.isnull) {
                return;
            }
            let dir: IDir | 0 = 0;
            switch (ca) {
                case "shift+up":
                    dir = DIRS.UP;
                    break;
                case "shift+down":
                    dir = DIRS.DN;
                    break;
                case "shift+left":
                    dir = DIRS.LT;
                    break;
                case "shift+right":
                    dir = DIRS.RT;
                    break;
            }

            if (dir !== 0) {
                cell.setArrow(dir, true);
                this.cursor.draw();
            } else {
                this.key_inputqnum_pencils(ca);
            }
        },

        key_inputqnum_pencils: function (ca: string) {
            const cell = this.cursor.getc();
            if (ca === "q" || ca === "-") {
                if (cell.qnum !== -2) {
                    cell.setArrow(0, true);
                    cell.setQnum(-2);
                } else {
                    cell.setArrow(0, true);
                    cell.setQnum(-1);
                }
            } else if (ca === " " || ca === "BS") {
                cell.setArrow(0, true);
                cell.setQnum(-1);
            } else {
                this.key_inputqnum_main(cell, ca);
                if (cell.isNum()) {
                    cell.setArrow(0, true);
                }
            }

            this.prev = cell;
            cell.draw();
        }
    },

    //---------------------------------------------------------
    // 盤面管理系
    Cell: {
        maxnum: function (): number {
            const bd = this.board;
            return Math.max(bd.cols, bd.rows) - 1;
        },
        minnum: 1,

        setArrow: function (dir: IDir | 0, question: boolean) {
            if (!(dir >= 0 && dir <= 4)) {
                return;
            }

            const dirs = {} as Record<IDir, any>;
            dirs[DIRS.UP] = {
                inv: DIRS.DN,
                border: this.adjborder.bottom,
                cell: this.adjacent.bottom
            };
            dirs[DIRS.DN] = {
                inv: DIRS.UP,
                border: this.adjborder.top,
                cell: this.adjacent.top
            };
            dirs[DIRS.LT] = {
                inv: DIRS.RT,
                border: this.adjborder.right,
                cell: this.adjacent.right
            };
            dirs[DIRS.RT] = {
                inv: DIRS.LT,
                border: this.adjborder.left,
                cell: this.adjacent.left
            };

            const qans = this.qans as IDir,
                qdir = this.qdir as IDir;

            this.setQans(0);

            if (qans > 0 && dirs[qans].cell.qans !== dirs[qans].inv) {
                dirs[qans].border.setQans(0);
            }

            if (question) {
                if (qdir >= 1 && qdir <= 4 && dirs[qdir].cell.qdir !== dirs[qdir].inv) {
                    dirs[qdir].border.setQues(0);
                }

                if (qdir === dir) {
                    dir = 0;
                }
                if (dir) {
                    this.setQnum(-1);
                }

                if (dir > 0 && !dirs[dir as IDir].border.isnull) {
                    dirs[dir as IDir].border.setQues(1);
                }
                this.setQdir(dir);
            } else if (!(qdir >= 1 && qdir <= 4) && this.qnum === -1) {
                if (qans === dir) {
                    dir = 0;
                }

                if (dir > 0 && !dirs[dir as IDir].border.isnull) {
                    dirs[dir as IDir].border.setQans(1);
                }
                this.setQans(dir);
            }
        },

        getPencilDir: function (): IDir | 0 {
            const qdir = this.qdir;
            if (qdir >= 1 && qdir <= 4) {
                return qdir as IDir;
            }
            const qans = this.qans;
            if (qans >= 1 && qans <= 4) {
                return qans as IDir;
            }
            return 0;
        },

        isStart: function (dir: IDir | 0): boolean {
            if (!this.room) {
                console.warn("room is null!")
                return false
            }
            const rect = this.room.clist.getRectSize();
            if (rect.cols > 1 && rect.rows > 1) {
                return false;
            }
            switch (dir) {
                case DIRS.LT:
                    return rect.rows === 1 && this.bx === rect.x1 && this.by === rect.y1;
                case DIRS.RT:
                    return rect.rows === 1 && this.bx === rect.x2 && this.by === rect.y1;
                case DIRS.UP:
                    return rect.cols === 1 && this.bx === rect.x1 && this.by === rect.y1;
                case DIRS.DN:
                    return rect.cols === 1 && this.bx === rect.x1 && this.by === rect.y2;
            }
            return false;
        },

        getPencilStart: function () {
            const dir = this.getPencilDir();
            if (dir === DIRS.UP) {
                return this.adjacent.bottom;
            }
            if (dir === DIRS.DN) {
                return this.adjacent.top;
            }
            if (dir === DIRS.LT) {
                return this.adjacent.right;
            }
            if (dir === DIRS.RT) {
                return this.adjacent.left;
            }
            //return null
            return this.board.emptycell;
        },

        isTip: function () {
            return this.getPencilDir() > 0;
        },

        isTipOfPencil: function (): boolean {
            const dir = this.getPencilDir();
            const start = this.getPencilStart();
            return start.isStart(dir);
        },

        getPencilSize: function () {
            if (this.isTipOfPencil()) {
                return this.getPencilStart()?.room.clist.length ?? 0;
            }
            return 0;
        },

        insidePencil: function () {
            return this.room.isPencil();
        }
    },

    GraphComponent: {
        getPotentialTips: function () {
            const rect = this.clist.getRectSize();
            if (rect.cols > 1 && rect.rows > 1) {
                return [];
            }
            const tips = [];
            if (rect.rows === 1) {
                const left = this.board.getc(rect.x1, rect.y1);
                tips.push({ dir: DIRS.LT, start: left, tip: left.adjacent.left });
                const right = this.board.getc(rect.x2, rect.y1);
                tips.push({ dir: DIRS.RT, start: right, tip: right.adjacent.right });
            }
            if (rect.cols === 1) {
                const top = this.board.getc(rect.x1, rect.y1);
                tips.push({ dir: DIRS.UP, start: top, tip: top.adjacent.top });
                const bottom = this.board.getc(rect.x1, rect.y2);
                tips.push({
                    dir: DIRS.DN,
                    start: bottom,
                    tip: bottom.adjacent.bottom
                });
            }
            return tips;
        },

        getTips: function () {
            const tips = this.getPotentialTips();
            const cells = [];
            for (let i = 0; i < tips.length; i++) {
                const tip = tips[i];
                if (tip.tip.getPencilDir() === tip.dir) {
                    cells.push(tip.tip);
                }
            }
            return cells;
        },

        isPencil: function () {
            return this.getTips().length > 0;
        },

        seterr: function (err: number) {
            this.clist.each(function (cell) {
                if (err > cell.error) {
                    cell.error = err;
                }
            });
        }
    },
    Board: {
        hasborder: 1
    },

    Border: {
        getArrow: function (): number {
            const cell0 = this.sidecell[0],
                cell1 = this.sidecell[1];
            if (this.isvert) {
                if (cell0.getPencilDir() === DIRS.LT) {
                    return DIRS.LT;
                }
                if (cell1.getPencilDir() === DIRS.RT) {
                    return DIRS.RT;
                }
            } else {
                if (cell0.getPencilDir() === DIRS.UP) {
                    return DIRS.UP;
                }
                if (cell1.getPencilDir() === DIRS.DN) {
                    return DIRS.DN;
                }
            }
            return 0;
        },

        prehook: {
            qans: function (num) {
                if (this.ques !== 0) {
                    return true;
                }
                if (num) {
                    return false;
                }
                return this.getArrow() !== 0;
            }
        }
    },
    BoardExec: {
        adjustBoardData: function (key, d) {
            const trans = this.getTranslateDir(key);
            const clist = this.board.cellinside(d.x1, d.y1, d.x2, d.y2);
            for (let i = 0; i < clist.length; i++) {
                const cell = clist[i];
                const val = trans[cell.qdir];
                if (!!val) {
                    cell.qdir = val;
                }
                const val2 = trans[cell.qans];
                if (!!val2) {
                    cell.qans = val2;
                }
            }
        }
    },

    AreaRoomGraph: {
        enabled: true
    },

    LineGraph: {
        enabled: true,
        makeClist: true
    },

    //---------------------------------------------------------
    // 画像表示系
    Graphic: {
        gridcolor_type: "DLIGHT",

        linecolor: "rgb(80, 80, 80)",

        paint: function () {
            this.drawBGCells();
            this.drawDashedGrid();
            this.drawBorders();
            this.drawLines();

            this.drawCellArrows();
            this.drawQuesNumbers();

            this.drawPekes();

            this.drawChassis();

            this.drawTarget();
        },

        getQuesNumberColor: function (cell) {
            if (cell.error === 2) {
                return this.errcolor1;
            }
            if (cell.error === 1) {
                return this.quescolor;
            }
            return this.getQuesNumberColor_qnum(cell);
        },

        getBGCellColor: function (cell) {
            if (cell.error === 2) {
                return this.errbcolor1;
            }
            return this.getBGCellColor_qsub2(cell);
        },

        getBorderColor: function (border) {
            if (border.ques === 1) {
                return this.quescolor;
            } else if (border.qans === 1) {
                return border.error
                    ? "red"
                    : !border.trial
                        ? this.qanscolor
                        : this.trialcolor;
            }
            return null;
        },

        drawCellArrows: function () {
            const g = this.vinc("cell_arrow", "crispEdges");

            const outer = this.cw * 0.5;
            const inner = this.cw * 0.25;

            const clist = this.range.cells;
            for (let i = 0; i < clist.length; i++) {
                const cell = clist[i];
                const dir = cell.getPencilDir();
                const color = this.getCellArrowColor(cell);

                g.lineWidth = (this.lw + this.addlw) / 2;
                if (!!color) {
                    g.fillStyle = color;
                    g.strokeStyle = color;
                    const px = cell.bx * this.bw,
                        py = cell.by * this.bh;
                    let idx = [0, 0, 0, 0];

                    switch (dir) {
                        case DIRS.UP:
                            idx = [1, 1, -1, 1];
                            break;
                        case DIRS.DN:
                            idx = [1, -1, -1, -1];
                            break;
                        case DIRS.LT:
                            idx = [1, -1, 1, 1];
                            break;
                        case DIRS.RT:
                            idx = [-1, -1, -1, 1];
                            break;
                    }

                    g.vid = "c_arrow_" + cell.id;
                    g.setOffsetLinePath(
                        px,
                        py,
                        0,
                        0,
                        idx[0] * inner,
                        idx[1] * inner,
                        idx[2] * inner,
                        idx[3] * inner,
                        true
                    );
                    g.fill();

                    g.vid = "c_arrow_outer_" + cell.id;
                    g.setOffsetLinePath(
                        px,
                        py,
                        0,
                        0,
                        idx[0] * outer,
                        idx[1] * outer,
                        idx[2] * outer,
                        idx[3] * outer,
                        true
                    );
                    g.stroke();
                } else {
                    g.vid = "c_arrow_" + cell.id;
                    g.vhide();
                    g.vid = "c_arrow_outer_" + cell.id;
                    g.vhide();
                }
            }
        },

        getCellArrowColor: function (cell): string | null {
            if (cell.getPencilDir()) {
                if (cell.qdir) {
                    return this.quescolor;
                } else {
                    return !cell.trial ? this.qanscolor : this.trialcolor;
                }
            }
            return null;
        }
    },

    //---------------------------------------------------------
    // URLエンコード/デコード処理
    Encode: {
        decodePzpr: function (type) {
            let c = 0,
                i = 0,
                bstr = this.outbstr,
                bd = this.board;
            for (i = 0; i < bstr.length; i++) {
                const ca = bstr.charAt(i),
                    cell = bd.cell[c];

                if (this.include(ca, "0", "9") || this.include(ca, "a", "f")) {
                    cell.qnum = Number.parseInt(ca, 16);
                } else if (ca === "-") {
                    cell.qnum = Number.parseInt(bstr.substr(i + 1, 2), 16);
                    i += 2;
                } else if (ca === ".") {
                    cell.qnum = -2;
                } else if (ca >= "g" && ca <= "j") {
                    cell.setArrow(Number.parseInt(ca, 20) - 15 as 0 | IDir, true);
                } else if (ca >= "k" && ca <= "z") {
                    c += Number.parseInt(ca, 36) - 20;
                }

                c++;
                if (!bd.cell[c]) {
                    break;
                }
            }
            this.outbstr = bstr.substr(i + 1);
        },
        encodePzpr: function (type) {
            let cm = "",
                count = 0,
                bd = this.board;
            for (let c = 0; c < bd.cell.length; c++) {
                let pstr = "",
                    dir = bd.cell[c].qdir,
                    qn = bd.cell[c].qnum;
                if (qn !== -1) {
                    if (qn >= 0 && qn < 16) {
                        pstr = qn.toString(16);
                    } else if (qn >= 16 && qn < 256) {
                        pstr = "-" + qn.toString(16);
                    } else {
                        pstr = ".";
                    }
                } else if (dir !== 0) {
                    pstr = (dir + 15).toString(20);
                } else {
                    count++;
                }

                if (count === 0) {
                    cm += pstr;
                } else if (pstr || count === 16) {
                    cm += (count + 19).toString(36) + pstr;
                    count = 0;
                }
            }
            if (count > 0) {
                cm += (count + 19).toString(36);
            }

            this.outbstr += cm;
        }
    },
    //---------------------------------------------------------
    FileIO: {
        decodeData: function () {
            this.decodeCell(function (cell, ca) {
                if (ca.charAt(0) === "o") {
                    cell.qdir = 5;
                    if (ca.length > 1) {
                        cell.qnum = +ca.substr(1);
                    }
                } else if (ca !== ".") {
                    cell.setArrow(+ca as IDir | 0, true);
                }
            });

            this.decodeBorderAns();
            this.decodeBorderLine();

            this.decodeCell(function (cell, ca) {
                if (ca.charAt(0) === "+") {
                    cell.qsub = 1;
                    ca = ca.substr(1);
                } else if (ca.charAt(0) === "-") {
                    cell.qsub = 2;
                    ca = ca.substr(1);
                }

                if (ca !== "." && +ca <= 4) {
                    cell.qans = +ca;
                }
            });
        },
        encodeData: function () {
            this.encodeCell(function (cell) {
                if (cell.qnum !== -1) {
                    return "o" + (cell.qnum !== -1 ? cell.qnum : "") + " ";
                } else if (cell.qdir !== 0) {
                    return cell.qdir + " ";
                } else {
                    return ". ";
                }
            });

            this.encodeBorderAns();
            this.encodeBorderLine();

            this.encodeCell(function (cell) {
                let ca = "";
                if (cell.qsub === 1) {
                    ca += "+";
                } else if (cell.qsub === 2) {
                    ca += "-";
                }

                if (cell.qans !== 0) {
                    ca += cell.qans.toString();
                }

                if (ca === "") {
                    ca = ".";
                }
                return ca + " ";
            });
        }
    },

    //---------------------------------------------------------
    // 正解判定処理実行部
    AnsCheck: {
        checklist: [
            "checkBranchLine",
            "checkCrossLine",
            "checkOneTip",
            "checkLineSingleTip",
            "checkLineTooLong",
            "checkNumberTooHigh",
            "checkTipNotInsidePencil",

            "checkLineOutsidePencil",
            "checkNumberInPencil",
            "checkTipHasLine",
            "checkLineHasTip", // does not start at a pencil tip
            "checkNumberTooLow",
            "checkLineTooShort",

            "checkTipHasPencil",
            "checkCellsUsed"
        ],

        checkTipHasPencil: function () {
            this.checkAllCell(function (cell) {
                return cell.isTip() && !cell.isTipOfPencil();
            }, "ptNoPencil");
        },

        checkTipNotInsidePencil: function () {
            this.checkAllCell(function (cell) {
                return cell.isTip() && cell.insidePencil();
            }, "ptInPencil");
        },

        checkOneTip: function () {
            const rooms = this.board.roommgr.components;
            for (let r = 0; r < rooms.length; r++) {
                const tips = rooms[r].getTips();
                if (tips.length > 1) {
                    this.failcode.add("pcMultipleTips");
                    if (this.checkOnly) {
                        return;
                    }
                    tips.forEach(function (cell) {
                        cell.seterr(1);
                    });
                    rooms[r].clist.seterr(1);
                }
            }
        },

        checkNumberTooLow: function () {
            this.pencils_checkPencilSize(-1, "nmSizeLt");
        },
        checkNumberTooHigh: function () {
            this.pencils_checkPencilSize(+1, "nmSizeGt");
        },

        pencils_checkPencilSize: function (factor: number, code: string) {
            const rooms = this.board.roommgr.components;
            for (let r = 0; r < rooms.length; r++) {
                const room = rooms[r];
                if (!room.isPencil()) {
                    continue;
                }
                const n = room.clist.length;
                for (let i = 0; i < room.clist.length; i++) {
                    const cell = room.clist[i];
                    const q = cell.qnum;
                    if (q > 0 && ((factor < 0 && q < n) || (factor > 0 && q > n))) {
                        this.failcode.add(code);
                        if (this.checkOnly) {
                            return;
                        }
                        cell.seterr(2);
                        room.seterr(1);
                    }
                }
            }
        },

        checkNumberInPencil: function () {
            this.checkAllCell(function (cell) {
                return (cell.qnum === -2 || cell.qnum > 0) && !cell.insidePencil();
            }, "nmOutsidePencil");
        },
        checkLineOutsidePencil: function () {
            this.checkAllCell(function (cell) {
                return cell.lcnt > 0 && cell.insidePencil();
            }, "lnCrossPencil");
        },

        checkTipHasLine: function () {
            this.checkAllCell(function (cell) {
                return cell.isTip() && cell.lcnt !== 1;
            }, "ptNoLine");
        },

        pencils_checkLines: function (func: (cell: CellList) => boolean, code: string) {
            const comps = this.board.linegraph.components;
            for (let c = 0; c < comps.length; c++) {
                const comp = comps[c];
                const ends = comp.clist.filter(function (cell) {
                    return cell.isTip() && cell.lcnt === 1;
                }) as CellList;
                if (func(ends)) {
                    this.failcode.add(code);
                    if (this.checkOnly) {
                        return;
                    }
                    ends.forEach(function (cell) {
                        cell.seterr(1);
                    });
                    comp.setedgeerr(1);
                }
            }
        },
        checkLineHasTip: function () {
            this.pencils_checkLines(function (ends) {
                return ends.length < 1;
            }, "lnNoTip");
        },

        checkLineSingleTip: function () {
            this.pencils_checkLines(function (ends) {
                return ends.length > 1;
            }, "lnMultipleTips");
        },

        checkLineTooShort: function () {
            this.pencils_checkLineLength(-1, "lnLengthLt");
        },
        checkLineTooLong: function () {
            this.pencils_checkLineLength(+1, "lnLengthGt");
        },

        pencils_checkLineLength: function (factor: number, code: string) {
            const cells = this.board.cell;
            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                if (!cell.isTip() || cell.lcnt !== 1) {
                    continue;
                }
                const l = cell.path.nodes.length - 1;
                const s = cell.getPencilSize();
                if (s > 0 && ((factor < 0 && l < s) || (factor > 0 && l > s))) {
                    this.failcode.add(code);
                    if (this.checkOnly) {
                        return;
                    }
                    cell.getPencilStart()?.room.seterr(1);
                    cell.path.setedgeerr(1);
                }
            }
        },

        checkCellsUsed: function () {
            this.checkAllCell(function (cell) {
                return cell.lcnt === 0 && !cell.insidePencil();
            }, "unusedCell");
        }
    }
});
