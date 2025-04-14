@udop/penpa-player
================

* [sabo2/pzprjs](https://github.com/sabo2/pzprjs)
* [sabo2/candle](https://github.com/sabo2/candle)

をES2015のclassベースで書き直し、TS化したものです。




## 使い方

### Web Components
ぱずぷれv3形式のURLのみに対応しています。

* ES Module

```html

<slitherlink-player src="/* your url */"/>

<script type="module"> 
import { SlitherlinkPlayer } from "https://cdn.jsdelivr.net/npm/@udop/penpa-player/index.es.js";
customElements.define('slitherlink-player', SlitherlinkPlayer);
</script>
```

* UMD
```html

<slitherlink-player src="/* your url */"/>

<script src="https://cdn.jsdelivr.net/npm/@udop/penpa-player/index.umd.js"></script>
<script> 
const { SlitherlinkPlayer } = PenpaPlayer;
customElements.define('slitherlink-player', SlitherlinkPlayer);
</script>
```

## LICENSE
MIT