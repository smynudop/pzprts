@udop/penpa-player
================

pzprv3形式のURLに対応する、ペンシルパズルを解くためのWeb Componentsです。

## Demo
[こちら](https://smynudop.github.io/pzprts/)


## 使い方

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