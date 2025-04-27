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

## WebComponents 使い方

ぱずぷれv3形式のURLのみに対応しています。

```html

<slitherlink-player src="/* your url */"/>

<script src="https://cdn.jsdelivr.net/npm/@udop/penpa-player/dist/index.umd.js"></script>
<script> 
const { SlitherlinkPlayer } = PenpaPlayer;
customElements.define('slitherlink-player', SlitherlinkPlayer);
</script>
```

## LICENSE
MIT