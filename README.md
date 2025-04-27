@udop/penpa-player
================

* [sabo2/pzprjs](https://github.com/sabo2/pzprjs)
* [sabo2/candle](https://github.com/sabo2/candle)

をES2015のclassベースで書き直し、TS化したものです。

* packages/lib(@udop/penpa-player-lib)
    * 共通のライブラリ、candle、各パズルのクラスが入っています。
* packages/wc(@udop/penpa-player)
    * WebComponentsとして使えます。



## 使い方

### Web Components
ぱずぷれv3形式のURLのみに対応しています。

* ES Module(バンドルサイズが大きいため非推奨)

```html

<slitherlink-player src="/* your url */"/>

<script type="module"> 
import { SlitherlinkPlayer } from "https://cdn.jsdelivr.net/npm/@udop/penpa-player/dist/index.es.js";
customElements.define('slitherlink-player', SlitherlinkPlayer);
</script>
```

* UMD
```html

<slitherlink-player src="/* your url */"/>

<script src="https://cdn.jsdelivr.net/npm/@udop/penpa-player/dist/index.umd.js"></script>
<script> 
const { SlitherlinkPlayer } = PenpaPlayer;
customElements.define('slitherlink-player', SlitherlinkPlayer);
</script>
```

## パズルの追加・コンバート方法
[こちら](docs/variety.md)を参照。

## LICENSE
MIT