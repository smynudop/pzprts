import type { AnsCheck, AnsCheckExtend, AnsCheckOption } from "../puzzle/Answer"
import type { AreaRoomGraph, AreaRoomGraphOption, AreaShadeGraph, AreaShadeGraphOption, AreaUnshadeGraphOption } from "../puzzle/AreaManager"
import type { Board, BoardOption } from "../puzzle/Board"
import type { Converter } from "../puzzle/Encode"
import type { EncodeOption } from "../puzzle/Encode2"
import type { FileIO, FileIOOption } from "../puzzle/FileData"
import type { Graphic, GraphicOption } from "../puzzle/Graphic"
import type { KeyEventOption } from "../puzzle/KeyInput"
import type { LineGraphOption } from "../puzzle/LineManager"
import type { MouseEvent1, MouseEventOption } from "../puzzle/MouseInput"
import type { Cell, CellOption } from "../puzzle/Piece"
import { type IConfig, Puzzle } from "../puzzle/Puzzle"

export type VarityOption = {
    MouseEvent: MouseEventOption & { [key: string]: any } & ThisType<MouseEvent1>,
    KeyEvent: KeyEventOption,
    Cell: CellOption & { [key: string]: any } & ThisType<Cell>
    Board: BoardOption & { [key: string]: any } & ThisType<Board>
    LineGraph?: LineGraphOption
    AreaShadeGraph?: AreaShadeGraphOption
    AreaUnshadeGraph?: AreaUnshadeGraphOption
    AreaRoomGraph?: AreaRoomGraphOption
    Graphic: GraphicOption & { [key: string]: any } & ThisType<Graphic>,
    Encode: (EncodeOption) | Converter[]
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