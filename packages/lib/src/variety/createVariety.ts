import type { AnsCheck, AnsCheckOption } from "../puzzle/Answer"
import type { AreaNumberGraph, AreaRoomGraph, AreaRoomGraphOption, AreaShadeGraph, AreaShadeGraphOption, AreaUnshadeGraphOption } from "../puzzle/AreaManager"
import type { Board, BoardOption } from "../puzzle/Board"
import type { BoardExec, BoardExecOption } from "../puzzle/BoardExec"
import type { Converter } from "../puzzle/Encode"
import type { Encode, EncodeOption } from "../puzzle/Encode2"
import type { FileIO, FileIOOption } from "../puzzle/FileData"
import type { Graphic, GraphicOption } from "../puzzle/Graphic"
import type { KeyEvent, KeyEventOption, TargetCursor } from "../puzzle/KeyInput"
import type { LineGraph, LineGraphOption } from "../puzzle/LineManager"
import type { MouseEvent1, MouseEventOption } from "../puzzle/MouseInput"
import type { OperationManager, OperationManagerOption } from "../puzzle/Operation"
import type { Border, BorderOption, Cell, CellOption, Cross, CrossOption, EXCell, EXCellOption } from "../puzzle/Piece"
import { type IConfig, Puzzle } from "../puzzle/Puzzle"
import type { GraphComponent, GraphComponentOption } from "../puzzle/GraphBase"

/**
 * クラスを拡張する
 */
type ExtendClass<TBase, TExtend> = TExtend & ThisType<TBase & TExtend>

/**
 * クラスの初期値を定義（カスタムメソッドはなし)
 */
type InitialClass<T> = Partial<T> & ThisType<T>

export type VarityOption<
    CellExtend,
    CrossExtend,
    BorderExtend,
    ExCellExtend,
    BoardExtend,
    BoardExecExtend,
    MouseExtend,
    KeyExtend,
    EncodeExtend,
    FileIOExtend,
    GraphicExtend,
    AnsCheckExtend,
    OperationManagerExtend,
    GraphComponentExtend,
    AreaRoomGraphExtend,
> = VarityOptionInner<
    Board<
        Cell & CellExtend,
        Cross,
        Border & BorderExtend,
        EXCell & ExCellExtend,
        GraphComponent<Cell & CellExtend> & GraphComponentExtend
    > & BoardExtend,
    CellExtend,
    CrossExtend,
    BorderExtend,
    ExCellExtend,
    BoardExtend,
    BoardExecExtend,
    MouseExtend,
    KeyExtend,
    EncodeExtend,
    FileIOExtend,
    GraphicExtend,
    AnsCheckExtend,
    OperationManagerExtend,
    GraphComponentExtend,
    AreaRoomGraphExtend
>

export type VarityOptionInner<
    TBoard extends Board,
    CellExtend,
    CrossExtend,
    BorderExtend,
    ExCellExtend,
    BoardExtend,
    BoardExecExtend,
    MouseExtend,
    KeyExtend,
    EncodeExtend,
    FileIOExtend,
    GraphicExtend,
    AnsCheckExtend,
    OperationManagerExtend,
    GraphComponentExtend, //extends GraphComponentOption
    AreaRoomGraphExtend,
> = {
    pid?: string
    Cell?: ExtendClass<Cell, CellExtend>,
    Cross?: ExtendClass<Cross, CrossExtend>,
    Border?: ExtendClass<Border, BorderExtend>
    EXCell?: ExtendClass<EXCell, ExCellExtend>,
    MouseEvent: ExtendClass<MouseEvent1<TBoard>, MouseExtend>,
    KeyEvent?: ExtendClass<KeyEvent<TBoard>, KeyExtend>,
    Board?: ExtendClass<TBoard, BoardExtend>
    BoardExec?: ExtendClass<BoardExec<TBoard>, BoardExecExtend>
    TargetCursor?: InitialClass<TargetCursor<TBoard>>
    GraphComponent?: ExtendClass<GraphComponent, GraphComponentExtend>
    LineGraph?: InitialClass<LineGraph>
    AreaShadeGraph?: InitialClass<AreaShadeGraph>
    AreaUnshadeGraph?: AreaUnshadeGraphOption
    AreaRoomGraph?: ExtendClass<AreaRoomGraph<GraphComponent & GraphComponentExtend, TBoard>, AreaRoomGraphExtend>
    AreaNumberGraph?: Partial<AreaNumberGraph>
    Graphic: ExtendClass<Graphic<TBoard>, GraphicExtend>,
    Encode: (ExtendClass<Encode<TBoard>, EncodeExtend>) | Converter[]
    FileIO: ExtendClass<FileIO<TBoard>, FileIOExtend>
    AnsCheck: ExtendClass<AnsCheck<TBoard>, AnsCheckExtend>
    OperationManager?: ExtendClass<OperationManager, OperationManagerExtend>
    FailCode?: { [key: string]: [string, string] }
}

export type VarietyAnyOption = VarityOption<any, any, any, any, any, any, any, any, any, any, any, any, any, any, any>

export const /*#__PURE__*/ createVariety = <
    CellExtend extends CellOption,
    CrossExtend extends CrossOption,
    BorderExtend extends BorderOption,
    ExCellExtend extends EXCellOption,
    BoardExtend extends BoardOption,
    BoardExecExtend extends BoardExecOption,
    MouseExtend extends MouseEventOption,
    KeyExtend extends KeyEventOption,
    EncodeExtend extends EncodeOption,
    FileIOExtend extends FileIOOption,
    GraphicExtend extends GraphicOption<Cell & CellExtend>,
    AnsCheckExtend extends AnsCheckOption,
    OperationManagerExtend extends OperationManagerOption,
    GraphComponentExtend, //extends GraphComponentOption,
    AreaRoomGraphExtend extends AreaRoomGraphOption<GraphComponent & GraphComponentExtend>
>(varietyOption: VarityOption<
    CellExtend,
    CrossExtend,
    BorderExtend,
    ExCellExtend,
    BoardExtend,
    BoardExecExtend,
    MouseExtend,
    KeyExtend,
    EncodeExtend,
    FileIOExtend,
    GraphicExtend,
    AnsCheckExtend,
    OperationManagerExtend,
    GraphComponentExtend,
    AreaRoomGraphExtend
>): new (option?: IConfig) => Puzzle => {
    return class extends Puzzle {
        constructor(option?: IConfig) {
            super({ ...option, pid: varietyOption.pid }, varietyOption)
        }
    }
}