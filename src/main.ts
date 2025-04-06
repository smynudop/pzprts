import { SlitherLink } from "./variety/slither2";
import { postCanvasReady } from "./puzzle/Puzzle";

const puzzle = new SlitherLink(document.getElementById("puzzle") as any, {})

puzzle.clear()
puzzle.on("ready", postCanvasReady)
postCanvasReady(puzzle)