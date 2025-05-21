import * as PenpaPlayer from "../src"
import "./index.css"
import { ja } from "@udop/penpa-player-lib"

for (const [key, cl] of Object.entries(PenpaPlayer)) {
    const tagName = key.toLowerCase().replace("player", "-player")
    customElements.define(tagName, cl)
}

const container = document.querySelector(".container")
for (const el of Array.from(document.querySelectorAll(".container > *")).toSorted((a, b) => a.tagName.localeCompare(b.tagName))) {
    const details = document.createElement("details")
    const summary = document.createElement("summary")
    const puzzleName = el.tagName.toLowerCase().replace("-player", "")
    summary.innerHTML = ja.puzzleName[puzzleName] || puzzleName
    details.appendChild(summary)
    el.parentNode?.insertBefore(details, null)
    details.appendChild(el)
}
