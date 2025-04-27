@udop/penpa-player
================

* [sabo2/pzprjs](https://github.com/sabo2/pzprjs)
* [sabo2/candle](https://github.com/sabo2/candle)

をES2015のclassベースで書き直し、TS化したものです。


## 使い方

```ts
import { SlitherLink } from "@udop/penpa-player";

const puzzle = new SlitherLink({
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

## パズルの追加・コンバート方法
[こちら](docs/variety.md)を参照。

## LICENSE
MIT