@udop/penpa-player
================

* [sabo2/pzprjs](https://github.com/sabo2/pzprjs)
* [sabo2/candle](https://github.com/sabo2/candle)

をES2015のclassベースで書き直し、TS化したものです。

* packages/lib(@udop/penpa-player-lib)
    * 共通のライブラリ、candle、各パズルのクラスが入っています。
* packages/wc(@udop/penpa-player)
    * WebComponentsとして使えます。

## Demo
[こちら](https://smynudop.github.io/pzprts/)

## Usage
```ts
import { Slither } from "@udop/penpa-player-lib";

const puzzle = new Slither({
    type: "player"
})
puzzle.readURL("/* your url */")
puzzle.mount(document.querySelector("#puzzle"));

puzzle.setMode("play");

//change input mode
puzzle.mouse.setInputMode("auto");

//set cell Size
puzzle.setCanvasSizeByCellSize(36);

//refresh
puzzle.redraw(true);
```

## WebComponents 使い方

ライブラリの他に、Web Componentsを提供しています。

使用方法は[こちらを参照してください](./packages/wc/README.md)

## LICENSE
MIT