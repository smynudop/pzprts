パズル種の追加方法
=====

パズル種の追加方法には2種類が存在します。

## createVarietyを使用する方法
既存の形式をなるべく保ったまま移行が可能です。

```ts
import { createVariety } from "./createVariety";

//
export const PuzzleName = createVariety({
    pid: "puzzle name",
    //パズルの定義
})
```

### 制限事項
* 継承を利用した複数のパズルの定義(`Cell@ExtendedPuzzle`など)には対応していません。ファイルをわけてください。
* パズル固有のgraphを定義する場合はcreateVarietyには含められません。別で定義を行ってください。
* thisの型定義に対応しきれていない部分があります。`//@ts-ignore` でしのいでください。

## class baseの定義方法

src/puzzle/Puzzle.tsにあるPuzzleクラスを継承したクラスを作り、各動作を記述してください。
overrideが必要なメソッドは以下です。

* `createKeyEvent(): KeyEvent`
* `createMouseEvent(): MouseEvent1`
* `createBoard(): TBoard`
* `createGraphic(): Graphic`
* `createAnsCheck(): AnsCheck<TCell, TCross, TBorder, TEXCell, TBoard>`
* `getAdditionalFailCode()`
* `createFileIO() : FileIO`
* `getConverters(): Converter[]`

### 各クラスについて
#### KeyEvent
キーボード入力に関する動作を記述します。

#### MouseEvent1
マウス操作に関する動作を記述します。`inputModes`と`mouseinput_auto`のオーバーライドがほぼ必須です。
同名のイベントと名前が被るため1がついています。

#### Board
盤面に関する動作を記述します。`createCell`がほぼオーバーライド必須です。

#### Graphic
盤面の描画に関する動作を記述します。`paint`はオーバーライド必須です。

#### AnsCheck
解答判定に関する動作を記述します。`getCheckList`はオーバーライド必須です。

#### FileIO
ファイルの入出力に関する動作を記述します。`decodeData`と`encodeData`は廃止されています。
pzprv3にあったカンペン・PuzzleBoxへの対応は廃止しています。

#### FailCode
pzprv3にあったクラスですが、廃止されています。
パズル固有のFailCodeは`getAdditionalFailCode`に定義してください。マージされます。

#### Encode
pzprv3にあったクラスですが、廃止されています。
`src/puzzle/encode.ts`から必要なものをimportして`getConverters`で返してください。
パズル固有の処理が必要な場合、`Converter`を実装したオブジェクトを定義して追加してください。
