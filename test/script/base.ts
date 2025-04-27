import { Puzzle } from "../../src/puzzle/Puzzle"
import { test, expect } from "vitest"
type TestInfo = {
    url: string
    failcheck: [code: string | null, board: string][],
    inputs: { input: string[], result?: string }[]
}

export const testPuzzle = (puzzle: Puzzle, info: TestInfo) => {
    for (const fail of info.failcheck) {
        const txt = fail[1].split("/").join("\n")
        puzzle.readFile(txt)

        const info = puzzle.check(true)
        test(`failcheck_${fail[0]}` || "complete", () => {
            expect(info.list[0] ?? null).toBe(fail[0])
        })
    }
}