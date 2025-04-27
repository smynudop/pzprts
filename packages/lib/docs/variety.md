パズル種の追加方法
=====


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

## 各クラスについて
### KeyEvent
キーボード入力に関する動作を記述します。

### MouseEvent1
マウス操作に関する動作を記述します。`inputModes`と`mouseinput_auto`のオーバーライドがほぼ必須です。
同名のイベントと名前が被るため1がついています。

### Board
盤面に関する動作を記述します。`createCell`がほぼオーバーライド必須です。

### Graphic
盤面の描画に関する動作を記述します。`paint`はオーバーライド必須です。

### AnsCheck
解答判定に関する動作を記述します。`getCheckList`はオーバーライド必須です。

### FileIO
ファイルの入出力に関する動作を記述します。`decodeData`と`encodeData`は廃止されています。
pzprv3にあったカンペン・PuzzleBoxへの対応は廃止しています。

### FailCode
pzprv3にあったクラスですが、廃止されています。
パズル固有のFailCodeは`getAdditionalFailCode`に定義してください。マージされます。

### Encode
pzprv3にあったクラスですが、廃止されています。
`src/puzzle/encode.ts`から必要なものをimportして`getConverters`で返してください。
パズル固有の処理が必要な場合、`Converter`を実装したオブジェクトを定義して追加してください。

# pzprv3からのmigrationについて
variety/xxx.jsの内容を置き換える際のガイドです。
* オブジェクトを、クラスに置き換えてください。その名前のクラスを継承して、新しい名前をつけてください(`Board` -> `class SudokuBoard extends Board` のように)
* プロパティとメソッドの書き方を修正し、オーバーライドの必要なメソッドには`override`を付与してください。
* 以下の変更点に留意してください。
    * Encodeクラスは廃止されています。代わりに`Puzzle.getConverters()`に定義します。
    * FailCodeクラスは廃止されています。代わりに`Puzzle.getAdditionalFailCode()`に定義します。
    * FileIOにおけるカンペン・puzzleBox形式URLへの対応は削除します。
    * Cellを代表とするPiece, Graphに独自クラスを使用する場合、Boardの対応する各メソッドをオーバーライドしてください。
* 最後に、`Puzzle` クラスを継承したパズルのための独自クラスを定義し、必要なメソッドをオーバーライドしてください。
