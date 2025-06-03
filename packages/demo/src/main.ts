import "./index.css"

import * as PenpaPlayer from "https://cdn.jsdelivr.net/npm/@udop/penpa-player@0.7.1/dist/index.es.js"

for (const [key, cl] of Object.entries(PenpaPlayer)) {
    const tagName = key.toLowerCase().replace("player", "-player")
    customElements.define(tagName, cl)
}





document.getElementById("filter-text")?.addEventListener("input", (e) => {
    const text = (e.target as HTMLInputElement).value.toUpperCase().trim()
    for (const puz of document.querySelectorAll(".container > *")) {
        const el = (puz as HTMLElement)
        el.style.display = el.tagName.includes(text) || text === "" ? "" : "none"
    }
})