import * as PenpaPlayer from "../src"
import "./index.css"

for (const [key, cl] of Object.entries(PenpaPlayer)) {
    const tagName = key.toLowerCase().replace("player", "-player")
    customElements.define(tagName, cl)
}
