//
// パズル固有スクリプト部 コンビブロック版 cbblock.js
//

import { AreaGraphBase, AreaRoomGraph } from "../puzzle/AreaManager";
import type { Board } from "../puzzle/Board";
import type { GraphComponent } from "../puzzle/GraphBase";
import type { Border, Cell } from "../puzzle/Piece";
import { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

/* global Set:false */

export const DoubleChoco = createVariety({
    pid: "dbchoco",
    //---------------------------------------------------------
    // マウス入力系
    MouseEvent: {
        inputModes: {
            edit: ["shade", "number", "clear"],
            play: ["border", "subline"]
        },
        mouseinput_auto: function () {
            if (this.puzzle.playmode) {
                if (this.mousestart || this.mousemove) {
                    if (this.btn === "left" && this.isBorderMode()) {
                        this.inputborder();
                    } else {
                        this.inputQsubLine();
                    }
                }
            } else if (this.puzzle.editmode) {
                const cell = this.getcell();
                if (cell.isnull) {
                    return;
                }

                if (
                    this.mousestart &&
                    (this.btn !== "right" || cell === this.cursor.getc())
                ) {
                    this.inputData = -1;
                }

                if (
                    (this.mousestart &&
                        cell !== this.cursor.getc() &&
                        this.btn === "right") ||
                    (this.mousemove && this.inputData >= 0)
                ) {
                    this.inputShade();
                } else if (this.mouseend && this.notInputted()) {
                    if (
                        cell !== this.cursor.getc() &&
                        this.inputMode === "auto" &&
                        this.btn === "left"
                    ) {
                        this.setcursor(cell);
                    } else {
                        this.inputqnum(cell);
                    }
                }
            }
        },
        inputShade: function () {
            this.inputIcebarn();
        }
    },

    KeyEvent: {
        enablemake: true,

        keyinput: function (ca) {
            if (ca === "q") {
                const cell = this.cursor.getc();
                cell.setQues(cell.ques !== 6 ? 6 : 0);
                this.prev = cell;
                cell.draw();
            } else {
                this.key_inputqnum(ca);
            }
        }
    },



    //---------------------------------------------------------
    // 盤面管理系


    Board: {
        cols: 10,
        rows: 10,

        hascross: 1,
        hasborder: 1,
        blockgraph: null! as AreaBlockGraph,
        tilegraph: null! as AreaTileGraph,

        addExtraInfo: function () {
            this.tilegraph = this.addInfoList(AreaTileGraph);
            this.blockgraph = this.addInfoList(AreaBlockGraph);
        }
    },



    Cell: {
        maxnum: function () {
            const bd = this.board;
            return (bd.cols * bd.rows) >> 1;
        }
    },


    //---------------------------------------------------------
    // 画像表示系
    Graphic: {
        gridcolor_type: "LIGHT",
        bgcellcolor_func: "icebarn",
        icecolor: "rgb(204,204,204)",

        bordercolor_func: "qans",

        paint: function () {
            this.drawBGCells();
            this.drawDashedGrid();


            this.drawBorders();

            this.drawBorderQsubs();


            this.drawChassis();

            this.drawPekes();

            this.drawQuesNumbers();
            this.drawTarget();

        }
    },



    Encode: {
        decodePzpr: function (type) {
            this.decodeDBChoco();
        },
        encodePzpr: function (type) {
            this.encodeDBChoco();
        },

        decodeDBChoco: function () {
            this.decodeIce();
            this.decodeNumber16();
        },
        encodeDBChoco: function () {
            this.encodeIce();
            this.encodeNumber16();
        }
    },


    FileIO: {
        decodeData: function () {
            this.decodeCell(function (cell, ca) {
                if (ca.charAt(0) === "-") {
                    cell.ques = 6;
                    ca = ca.substr(1);
                }

                if (ca === "0") {
                    cell.qnum = -2;
                } else if (ca !== "." && +ca > 0) {
                    cell.qnum = +ca;
                }
            });
            this.decodeBorderAns();
        },
        encodeData: function () {
            this.encodeCell(function (cell) {
                let ca = "";
                if (cell.ques === 6) {
                    ca += "-";
                }

                if (cell.qnum === -2) {
                    ca += "0";
                } else if (cell.qnum !== -1) {
                    ca += cell.qnum.toString();
                }

                if (ca === "") {
                    ca = ".";
                }
                return ca + " ";
            });
            this.encodeBorderAns();
        }
    },
    //---------------------------------------------------------
    // 正解判定処理実行部
    AnsCheck: {
        checklist: [
            "checkSingleBlock",
            "checkSmallNumberArea",
            "checkLargeBlock",
            "checkEqualShapes",
            "checkLargeNumberArea",
            "checkBorderDeadend"
        ],

        checkSingleBlock: function () {
            this.checkMiniBlockCount(1, "bkSubLt2");
        },
        checkLargeBlock: function () {
            this.checkMiniBlockCount(3, "bkSubGt2");
        },
        checkMiniBlockCount: function (flag: number, code: string) {
            const blocks = this.board.blockgraph.components;
            for (let r = 0; r < blocks.length; r++) {
                const cnt = blocks[r].dotcnt;
                if ((flag === 1 && cnt > 1) || (flag === 3 && cnt <= 2)) {
                    continue;
                }

                this.failcode.add(code);
                if (this.checkOnly) {
                    break;
                }
                blocks[r].clist.seterr(1);
            }
        },

        checkSmallNumberArea: function () {
            return this.checkNumberArea(-1, "bkSizeLt");
        },
        checkLargeNumberArea: function () {
            return this.checkNumberArea(+1, "bkSizeGt");
        },

        checkNumberArea: function (factor: number, code: string) {
            const tiles = this.board.tilegraph.components;
            for (let r = 0; r < tiles.length; r++) {
                const clist = tiles[r].clist,
                    d = clist.length;
                for (let i = 0; i < clist.length; i++) {
                    const cell = clist[i];
                    const qnum = cell.qnum;
                    if (qnum <= 0) {
                        continue;
                    }
                    if ((factor < 0 && d < qnum) || (factor > 0 && d > qnum)) {
                        this.failcode.add(code);
                        if (this.checkOnly) {
                            return;
                        }
                        clist.seterr(1);
                    }
                }
            }
        },

        checkEqualShapes: function () {
            const blocks = this.board.blockgraph.components;
            for (let r = 0; r < blocks.length; r++) {
                const block = blocks[r];
                if (block.dotcnt !== 2) {
                    continue;
                }
                if (this.isEqualShapes(block.clist)) {
                    continue;
                }

                this.failcode.add("bkDifferentShape");
                if (this.checkOnly) {
                    break;
                }
                block.clist.seterr(1);
            }
        },

        isEqualShapes: function (clist: CellList) {
            for (let i = 0; i < clist.length; i++) {
                const cell = clist[i];
                const borders = [cell.adjborder.right, cell.adjborder.bottom];

                for (let b = 0; b < borders.length; b++) {
                    const bd = borders[b];
                    if (!bd || bd.isnull) {
                        continue;
                    }
                    const side0 = bd.sidecell[0] as Cell & { tile: GraphComponent };
                    const side1 = bd.sidecell[1] as Cell & { tile: GraphComponent };

                    if (
                        bd.qans === 0 &&
                        !side0.isnull &&
                        !side1.isnull &&
                        side0.ques !== side1.ques
                    ) {
                        return !this.isDifferentShapeBlock(side0.tile, side1.tile);
                    }
                }
            }
            return false;
        },
        isDifferentShapeBlock: function (area1: GraphComponent, area2: GraphComponent) {
            if (area1.clist.length !== area2.clist.length) {
                return true;
            }
            const s1 = getBlockShapes(this.board, area1.clist),
                s2 = getBlockShapes(this.board, area2.clist);
            return s1.canon !== s2.canon;
        }
    },
    FailCode: {
        "bkDifferentShape": ["ブロック内で、白マスと灰色マスのカタマリの形が異なっています。", "The two shapes inside a block are different."],
        "bkSubLt2": ["1色のマスしか入っていないブロックがあります。", ""],
        "bkSubGt2": ["同じ色のマスのカタマリが3個以上入っているブロックがあります。", ""],
    }
});

const getBlockShapes = function (bd: Board, clist: CellList) {
    //@ts-ignore
    if (!!clist.shape) { return clist.shape; }

    const d = clist.getRectSize();
    const dx = d.x2 - d.x1 === d.cols - 1 ? 1 : 2;
    const dy = d.y2 - d.y1 === d.rows - 1 ? 1 : 2;
    const data: number[][] = [[], [], [], [], [], [], [], []];
    const shapes = [];

    for (let by = 0; by <= d.y2 - d.y1; by += dy) {
        for (let bx = 0; bx <= d.x2 - d.x1; bx += dx) {
            data[0].push(clist.includes(bd.getc(d.x1 + bx, d.y1 + by)) ? 1 : 0);
            data[1].push(clist.includes(bd.getc(d.x1 + bx, d.y2 - by)) ? 1 : 0);
        }
    }
    for (let bx = 0; bx <= d.x2 - d.x1; bx += dx) {
        for (let by = 0; by <= d.y2 - d.y1; by += dy) {
            data[4].push(clist.includes(bd.getc(d.x1 + bx, d.y1 + by)) ? 1 : 0);
            data[5].push(clist.includes(bd.getc(d.x1 + bx, d.y2 - by)) ? 1 : 0);
        }
    }
    data[2] = data[1].concat().reverse();
    data[3] = data[0].concat().reverse();
    data[6] = data[5].concat().reverse();
    data[7] = data[4].concat().reverse();
    for (let i = 0; i < 8; i++) {
        shapes[i] = (i < 4 ? d.cols : d.rows) + ":" + data[i].join("");
    }

    const first = shapes[0];
    shapes.sort();
    const result = { canon: shapes[0], id: first }
    //@ts-ignore
    clist.shape = result
    return result;
}





class AreaTileGraph extends AreaGraphBase {
    override enabled = true
    override setComponentRefs(obj: any, component: any) {
        obj.tile = component;
    }
    override getObjNodeList(nodeobj: any) {
        return nodeobj.tilenodes;
    }
    override resetObjNodeList(nodeobj: any) {
        nodeobj.tilenodes = [];
    }

    override isnodevalid(nodeobj: any) {
        return true;
    }

    override setExtraData(component: any) {
        // Call super class
        super.setExtraData(component);

        if (this.rebuildmode || component.clist.length === 0) {
            return;
        }

        // A tile is always contained within a single block.
        const block = component.clist[0].block;
        if (block) {
            //@ts-ignore
            this.board.blockgraph.setComponentInfo(block);
        }
    }
    override relation = { "border.qans": "separator", "cell.ques": "node" }
    override isedgevalidbylinkobj(border: Border) {
        if (border.sidecell[0].isnull || border.sidecell[1].isnull) {
            return false;
        }
        return (
            border.qans === 0 && border.sidecell[0].ques === border.sidecell[1].ques
        );
    }
}


type BlockGraphComponent = GraphComponent & {
    dotcnt: number
    size: number
}
class AreaBlockGraph extends AreaRoomGraph<BlockGraphComponent> {
    override enabled = true
    override getComponentRefs(obj: any) {
        return obj.block;
    } // getSideAreaInfo用
    override setComponentRefs(obj: any, component: any) {
        obj.block = component;
    }
    override getObjNodeList(nodeobj: any) {
        return nodeobj.blocknodes;
    }
    override resetObjNodeList(nodeobj: any) {
        nodeobj.blocknodes = [];
    }

    override isedgevalidbylinkobj(border: Border) {
        return border.qans === 0;
    }

    override setExtraData(component: BlockGraphComponent) {
        let cnt = 0;
        component.clist = new CellList(
            component.getnodeobjs()
        )
        const clist = component.clist as CellList<Cell & { tile: any }>;
        component.size = clist.length;

        //@ts-ignore
        const tiles = this.board.tilegraph.components;
        for (let i = 0; i < tiles.length; i++) {
            tiles[i].count = 0;
        }
        for (let i = 0; i < clist.length; i++) {
            // It's possible that this function is called before all cells are connected to a tile.
            if (!clist[i].tile) {
                // Abort the count and wait until all cells in the grid are connected.
                component.dotcnt = 0;
                return;
            }
            clist[i].tile.count++;
        }
        for (let i = 0; i < tiles.length; i++) {
            if (tiles[i].count > 0) {
                cnt++;
            }
        }
        component.dotcnt = cnt;
    }
}

