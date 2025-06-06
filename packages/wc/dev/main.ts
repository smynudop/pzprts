import * as PenpaPlayer from "../src/player"
import "./index.css"

for (const [key, cl] of Object.entries(PenpaPlayer)) {
    const tagName = key.toLowerCase().replace("player", "-player")
    if (document.querySelector(`${tagName}`)) {
        customElements.define(tagName, cl)
    }
}

document.querySelector("#lazy")!.addEventListener("ready", () => {
    console.log("lazy loaded")
})

setTimeout(() => {
    document.querySelector("#lazy")?.setAttribute("src", "http://pzv.jp/p.html?slither/5/5/cbcbcddad")
}, 3000)

// const container = document.querySelector(".container")
// for (const el of Array.from(document.querySelectorAll(".container > *")).toSorted((a, b) => a.tagName.localeCompare(b.tagName))) {
//     const details = document.createElement("details")
//     const summary = document.createElement("summary")
//     const puzzleName = el.tagName.toLowerCase().replace("-player", "")
//     summary.innerHTML = ja.puzzleName[puzzleName] || puzzleName
//     details.appendChild(summary)
//     el.parentNode?.insertBefore(details, null)
//     details.appendChild(el)
// }
