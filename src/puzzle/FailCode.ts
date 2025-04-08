//---------------------------------------------------------------------------
// ★FailCodeクラス 答えの文字列を扱う
//---------------------------------------------------------------------------
// FailCodeクラス
export const createFailCode = () => {
    const data: Record<string, [string, string]> = {
        complete: ["正解です！", "Complete!"],
        invalid: ["不明なエラーです", "Invalid Error"],
        /* ** 黒マス ** */
        cs2x2: ["2x2の黒マスのかたまりがあります。", "There is a 2x2 block of shaded cells."],
        cu2x2: ["2x2の白マスのかたまりがあります。", "There is a 2x2 block of unshaded cells."],
        csNotSquare: ["正方形でない黒マスのカタマリがあります。", "A mass of shaded cells is not regular rectangle."],
        csAdjacent: ["黒マスがタテヨコに連続しています。", "Shaded cells are adjacent."],
        csDivide: ["黒マスが分断されています。", "Shaded cells are divided,"],
        cuDivide: ["白マスが分断されています。", "Unshaded cells are divided."],
        cuDivideRB: ["白マスが分断されています。", "Unshaded cells are divided."], /* 連黒分断禁 */
        brNoShade: ["盤面に黒マスがありません。", "There are no shaded cells on the board."],

        /* ** 領域＋数字 ** */
        bkNoNum: ["数字のないブロックがあります。", "A block has no number."],
        bkNumGe2: ["1つのブロックに2つ以上の数字が入っています。", "A block has plural numbers."],
        bkDupNum: ["同じブロックに同じ数字が入っています。", "There are same numbers in a block."],
        bkPlNum: ["複数種類の数字が入っているブロックがあります。", "A block has two or more kinds of numbers."],
        bkSepNum: ["同じ数字が異なるブロックに入っています。", "One kind of numbers is included in dirrerent blocks."],

        bkSizeNe: ["数字とブロックの大きさが違います。", "The size of the block is not equal to the number."],

        bkShadeNe: ["部屋の数字と黒マスの数が一致していません。", "The number of shaded cells in the room and The number written in the room is different."],
        bkShadeDivide: ["1つの部屋に入る黒マスが2つ以上に分裂しています。", "Shaded cells are divided in one room."],
        bkNoShade: ["黒マスがない部屋があります。", "A room has no shaded cell."],
        bkMixed: ["白マスと黒マスの混在したタイルがあります。", "A tile includes both shaded and unshaded cells."],

        bkWidthGt1: ["幅が１マスではないタタミがあります。", "The width of the tatami is not one."],

        brNoValidNum: ["盤面に数字がありません。", "There are no numbers on the board."],

        /* ** 領域＋線を引く ** */
        brNoLine: ["線が引かれていません。", "There is no line on the board."],

        /* ** 盤面切り分け系 ** */
        bkNotRect: ["四角形ではない部屋があります。", "There is a room whose shape is not square."],
        bdDeadEnd: ["途中で途切れている線があります。", "There is a dead-end line."],
        bdCross: ["十字の交差点があります。", "There is a crossing border line."],

        /* ** 線を引く系 ** */
        lnDeadEnd: ["途中で途切れている線があります。", "There is a dead-end line."],
        lnBranch: ["分岐している線があります。", "There is a branch line."],
        lnCross: ["線が交差しています。", "There is a crossing line."],
        lnNotCrossMk: ["十字の場所で線が交差していません。", "A cross-joint cell doesn't have four-way lines."],
        lnCrossExIce: ["氷の部分以外で線が交差しています。", "A Line is crossed outside of ice."],
        lnCurveOnIce: ["氷の部分で線が曲がっています。", "A Line curve on ice."],
        lnPlLoop: ["輪っかが一つではありません。", "There are plural loops."],
        lnOnShade: ["黒マスの上に線が引かれています。", "There is a line on the shaded cell."],

        /* ** 線でつなぐ系 ** */
        lcDeadEnd: ["線が途中で途切れています。", "There is a dead-end line."],
        lcDivided: ["線が全体で一つながりになっていません。", "All lines and numbers are not connected each other."],
        lcTripleNum: ["3つ以上の数字がつながっています。", "Three or more numbers are connected."],
        lcIsolate: ["数字につながっていない線があります。", "A line doesn't connect any number."],
        lcOnNum: ["数字の上を線が通過しています。", "A line goes through a number."],
        nmNoLine: ["どこにもつながっていない数字があります。", "A number is not connected another number."],
        nmConnected: ["アルファベットが繋がっています。", "There are connected letters."],

        /* ** 線で動かす系 ** */
        laIsolate: ["アルファベットにつながっていない線があります。", "A line doesn't connect any letter."],
        laOnNum: ["アルファベットの上を線が通過しています。", "A line goes through a letter."],
        laCurve: ["曲がっている線があります。", "A line has curve."],
        laLenNe: ["数字と線の長さが違います。", "The length of a line is wrong."],

        /* ** 単体セルチェック ** */
        ceNoNum: ["数字の入っていないマスがあります。", "There is an empty cell."],
        ceNoLine: ["線が引かれていないマスがあります。", "There is an empty cell."],
        ceAddLine: ["最初から引かれている線があるマスに線が足されています。", "Lines are added to the cell that the mark lie in by the question."],

        anShadeNe: ["矢印の方向にある黒マスの数が正しくありません。", "The number of shaded cells are not correct."],

        /* ** 数字系 ** */
        nmAdjacent: ["同じ数字がタテヨコに連続しています。", "Same numbers are adjacent."],
        nmDupRow: ["同じ列に同じ数字が入っています。", "There are same numbers in a row."],
        nmDivide: ["タテヨコにつながっていない数字があります。", "Numbers are divided."]
    }
    return new Map(Object.entries(data))
}


