import { TaskBase } from "vitest"
import type { AnsCheck, AnsCheckOption } from "../puzzle/Answer"
import type { AreaRoomGraph, AreaRoomGraphOption, AreaShadeGraph, AreaShadeGraphOption, AreaUnshadeGraphOption } from "../puzzle/AreaManager"
import type { Board, BoardOption } from "../puzzle/Board"
import type { BoardExec, BoardExecOption } from "../puzzle/BoardExec"
import type { Converter } from "../puzzle/Encode"
import type { Encode, EncodeOption } from "../puzzle/Encode2"
import type { FileIO, FileIOOption } from "../puzzle/FileData"
import type { Graphic, GraphicOption } from "../puzzle/Graphic"
import type { KeyEvent, KeyEventOption, TargetCursor } from "../puzzle/KeyInput"
import type { LineGraphOption } from "../puzzle/LineManager"
import type { MouseEvent1, MouseEventOption } from "../puzzle/MouseInput"
import type { OperationManager, OperationManagerOption } from "../puzzle/Operation"
import type { Border, BorderOption, Cell, CellOption, Cross, CrossOption, EXCell, EXCellOption } from "../puzzle/Piece"
import { type IConfig, Puzzle } from "../puzzle/Puzzle"
import type { GraphComponent, GraphComponentOption } from "../puzzle/GraphBase"

type ExtendClass<TBase, TExtend> = TExtend & ThisType<TBase & TExtend>
export type VarityOption<
    CellExtend,
    BorderExtend,
    BoardExtend,
    BoardExecExtend,
    MouseExtend,
    KeyExtend,
    EncodeExtend,
    FileIOExtend,
    GraphicExtend,
    AnsCheckExtend,
    OperationManagerExtend,
    GraphComponentExtend
> = VarityOptionInner<
    Board<
        Cell & CellExtend,
        Cross,
        Border & BorderExtend,
        EXCell,
        GraphComponent<Cell & CellExtend> & GraphComponentExtend
    > & BoardExtend,
    CellExtend,
    BorderExtend,
    BoardExtend,
    BoardExecExtend,
    MouseExtend,
    KeyExtend,
    EncodeExtend,
    FileIOExtend,
    GraphicExtend,
    AnsCheckExtend,
    OperationManagerExtend,
    GraphComponentExtend
>

export type VarityOptionInner<
    TBoard extends Board,
    CellExtend,
    BorderExtend,
    BoardExtend,
    BoardExecExtend,
    MouseExtend,
    KeyExtend,
    EncodeExtend,
    FileIOExtend,
    GraphicExtend,
    AnsCheckExtend,
    OperationManagerExtend,
    GraphComponentExtend //extends GraphComponentOption
> = {
    pid?: string
    Cell?: ExtendClass<Cell, CellExtend>,
    Cross?: CrossOption,
    Border?: ExtendClass<Border, BorderExtend>
    MouseEvent: ExtendClass<MouseEvent1<TBoard>, MouseExtend>,
    KeyEvent?: ExtendClass<KeyEvent<TBoard>, KeyExtend>,
    EXCell?: EXCellOption & { [key: string]: any } & ThisType<EXCell>
    Board?: ExtendClass<TBoard, BoardExtend>
    BoardExec?: ExtendClass<BoardExec<TBoard>, BoardExecExtend>
    TargetCursor?: { [key: string]: any } & ThisType<TargetCursor<TBoard>>
    GraphComponent?: ExtendClass<GraphComponent, GraphComponentExtend>
    LineGraph?: LineGraphOption
    AreaShadeGraph?: AreaShadeGraphOption
    AreaUnshadeGraph?: AreaUnshadeGraphOption
    AreaRoomGraph?: AreaRoomGraphOption<GraphComponent<Cell & CellExtend> & GraphComponentExtend, TBoard> & ThisType<AreaRoomGraph<GraphComponent & GraphComponentExtend, TBoard>>
    Graphic: ExtendClass<Graphic<TBoard>, GraphicExtend>,
    Encode: (ExtendClass<Encode<TBoard>, EncodeExtend>) | Converter[]
    FileIO: ExtendClass<FileIO<TBoard>, FileIOExtend>
    AnsCheck: ExtendClass<AnsCheck<TBoard>, AnsCheckExtend>
    FailCode?: { [key: string]: [string, string] }
    OperationManager?: ExtendClass<OperationManager, OperationManagerExtend>
}

export type VarietyAnyOption = VarityOption<any, any, any, any, any, any, any, any, any, any, any, any>

export const createVariety = <
    CellExtend extends CellOption,
    BorderExtend extends BorderOption,
    BoardExtend extends BoardOption,
    BoardExecExtend extends BoardExecOption,
    MouseExtend extends MouseEventOption,
    KeyExtend extends KeyEventOption,
    EncodeExtend extends EncodeOption,
    FileIOExtend extends FileIOOption,
    GraphicExtend extends GraphicOption<Cell & CellExtend>,
    AnsCheckExtend extends AnsCheckOption,
    OperationManagerExtend extends OperationManagerOption,
    GraphComponentExtend //extends GraphComponentOption
>(varietyOption: VarityOption<
    CellExtend,
    BorderExtend,
    BoardExtend,
    BoardExecExtend,
    MouseExtend,
    KeyExtend,
    EncodeExtend,
    FileIOExtend,
    GraphicExtend,
    AnsCheckExtend,
    OperationManagerExtend,
    GraphComponentExtend
>): new (option?: IConfig) => Puzzle => {
    return class extends Puzzle {
        constructor(option?: IConfig) {
            super({ ...option, pid: varietyOption.pid }, varietyOption)
        }
    }
}