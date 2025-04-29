import type { AnsCheck, AnsCheckOption } from "../puzzle/Answer"
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

export type VarityOption<
    BoardExtend extends BoardOption,
    MouseExtend extends MouseEventOption,
    KeyExtend extends KeyEventOption,
    EncodeExtend extends EncodeOption,
    FileIOExtend extends FileIOOption,
    GraphicExtend extends GraphicOption,
    AnsCheckExtend extends AnsCheckOption,
> = {
    pid?: string
    MouseEvent: MouseExtend & ThisType<MouseEvent1 & MouseExtend>,
    KeyEvent: KeyExtend & ThisType<KeyEvent & KeyExtend>,
    Cell?: CellOption & { [key: string]: any } & ThisType<Cell>
    EXCell?: EXCellOption & { [key: string]: any } & ThisType<EXCell>
    Board?: BoardExtend & ThisType<Board & BoardExtend>
    BoardExec?: { [key: string]: any } & ThisType<BoardExec>
    TargetCursor?: { [key: string]: any } & ThisType<TargetCursor>
    LineGraph?: LineGraphOption
    AreaShadeGraph?: AreaShadeGraphOption
    AreaUnshadeGraph?: AreaUnshadeGraphOption
    AreaRoomGraph?: AreaRoomGraphOption
    Graphic: GraphicExtend & ThisType<Graphic & GraphicExtend>,
    Encode: (EncodeExtend & ThisType<Encode & EncodeExtend>) | Converter[]
    FileIO: FileIOExtend & ThisType<FileIO & FileIOExtend>
    AnsCheck: AnsCheckExtend & ThisType<AnsCheck & AnsCheckExtend>
    FailCode?: { [key: string]: [string, string] }

}

export type VarietyAnyOption = VarityOption<any, any, any, any, any, any, any>

export const createVariety = <
    BoardExtend extends BoardOption,
    MouseExtend extends MouseEventOption,
    KeyExtend extends KeyEventOption,
    EncodeExtend extends EncodeOption,
    FileIOExtend extends FileIOOption,
    GraphicExtend extends GraphicOption,
    AnsCheckExtend extends AnsCheckOption,
>(varietyOption: VarityOption<
    BoardExtend,
    MouseExtend,
    KeyExtend,
    EncodeExtend,
    FileIOExtend,
    GraphicExtend,
    AnsCheckExtend
>) => {
    return class extends Puzzle {
        constructor(option?: IConfig) {
            super({ ...option, pid: varietyOption.pid }, varietyOption)
        }
    }
}