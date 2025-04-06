import { SlitherLink } from "./variety/slither2";
import { postCanvasReady } from "./puzzle/Puzzle";

const puzzle = new SlitherLink(document.getElementById("puzzle") as any, {})

puzzle.clear()
puzzle.on("ready", postCanvasReady)
postCanvasReady(puzzle)
puzzle.setMode("edit")
puzzle.mouse.setInputMode("auto")
console.log(puzzle.mouse.inputModes.edit)
console.log(puzzle.mouse.inputModes.play)