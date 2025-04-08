import SlitherlinkApp from "./components/Slitherlink.ce.vue"
import { defineCustomElement } from 'vue';

// Custom Element のコンストラクタに変換
export const SlitherlinkPlayer = defineCustomElement(SlitherlinkApp);