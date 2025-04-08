import SlitherlinkApp from "./components/Slitherlink.ce.vue"
import { defineCustomElement } from 'vue';

// Custom Element のコンストラクタに変換
const SlitherlinkPlayer = defineCustomElement(SlitherlinkApp);

// Custom Element として登録
customElements.define('slitherlink-player', SlitherlinkPlayer);