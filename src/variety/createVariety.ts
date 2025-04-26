import type { AnsCheck, AnsCheckExtend, AnsCheckOption } from "../puzzle/Answer"
import type { AreaRoomGraph, AreaRoomGraphOption, AreaShadeGraph, AreaShadeGraphOption, AreaUnshadeGraphOption } from "../puzzle/AreaManager"
import type { Board, BoardOption } from "../puzzle/Board"
import type { BoardExec } from "../puzzle/BoardExec"
import type { Converter } from "../puzzle/Encode"
import type { Encode, EncodeOption } from "../puzzle/Encode2"
import type { FileIO, FileIOOption } from "../puzzle/FileData"
import type { Graphic, GraphicOption } from "../puzzle/Graphic"
import type { KeyEvent, KeyEventOption, TargetCursor } from "../puzzle/KeyInput"
import type { LineGraphOption } from "../puzzle/LineManager"
import type { MouseEvent1, MouseEventOption } from "../puzzle/MouseInput"
import type { Cell, CellOption, EXCell, EXCellOption } from "../puzzle/Piece"
import { type IConfig, Puzzle } from "../puzzle/Puzzle"

export type VarityOption = {
    MouseEvent: MouseEventOption & { [key: string]: any } & ThisType<MouseEvent1>,
    KeyEvent: KeyEventOption & { [key: string]: any } & ThisType<KeyEvent>,
    Cell: CellOption & { [key: string]: any } & ThisType<Cell>
    EXCell?: EXCellOption & { [key: string]: any } & ThisType<EXCell>
    Board: BoardOption & { [key: string]: any } & ThisType<Board>
    BoardExec?: { [key: string]: any } & ThisType<BoardExec>
    TargetCursor?: { [key: string]: any } & ThisType<TargetCursor>
    LineGraph?: LineGraphOption
    AreaShadeGraph?: AreaShadeGraphOption
    AreaUnshadeGraph?: AreaUnshadeGraphOption
    AreaRoomGraph?: AreaRoomGraphOption
    Graphic: GraphicOption & { [key: string]: any } & ThisType<Graphic>,
    Encode: (EncodeOption & { [key: string]: any } & ThisType<Encode>) | Converter[]
    FileIO: FileIOOption
    AnsCheck: AnsCheckOption & { [key: string]: any }
    //AnsCheckExtend: AnsCheckExtend
    FailCode?: { [key: string]: [string, string] }

}
export const createVariety = (varietyOption: VarityOption) => {
    return class extends Puzzle {
        constructor(option?: IConfig) {
            super(option, varietyOption)
        }
    }
}