import type { Puzzle } from "../../src/puzzle/Puzzle"
import { test, expect, describe, it, assert } from "vitest"
import { FILE_PZPR } from "../../src/pzpr/constants"
type TestInfo = {
    url: string
    failcheck: [code: string | null, board: string][],
    inputs: { input: string[], result?: string }[]
}

export const testPuzzle = (puzzle: Puzzle, info: TestInfo) => {
    describe(puzzle.pid, function () {
        test("pid is set", () => {
            assert(puzzle.pid !== "", "pid is not set!")
        })
        describe("fileio", () => {
            puzzle.readFile(info.failcheck.at(-1)![1].split("/").join("\n"))
            it('pzpr file', function () {
                const bd2 = puzzle.board.freezecopy();
                const outputstr = puzzle.getFileData(FILE_PZPR);
                puzzle.readFile(outputstr)
                const cnt: string[] = []
                puzzle.board.compareData(bd2, (g, id, prop) => cnt.push(`[g=${g}, prop=${prop}]`))
                assert(cnt.length === 0, `io error?(${cnt})`)
            });
        })
        describe("failcheck", () => {
            for (const fail of info.failcheck) {
                const txt = fail[1].split("/").join("\n")
                puzzle.readFile(txt)

                const info = puzzle.check(true)
                test(`${fail[0]}` || "complete", () => {
                    expect(info.list[0] ?? null).toBe(fail[0])
                })
            }
        })
        describe('URL', function () {
            // it('open PID', function () {
            //     assert.doesNotThrow(() => puzzle.open(pid));
            // });
            it('pzpr URL', function () {
                puzzle.readURL(puzzle.pid + '/' + info.url);
                const urlstr = puzzle.getURL();
                const expurl = 'http://pzv.jp/p.html?' + puzzle.pid + '/' + info.url;
                assert.equal(urlstr, expurl);
            });
            // it('pzpr invalid URL', function () {
            //     puzzle.open(pid + '/' + testdata[pid].url);
            //     const bd = puzzle.board, bd2 = bd.freezecopy();
            //     const urlstr = puzzle.getURL();
            //     assert.doesNotThrow(function () {
            //         puzzle.open(urlstr + urlstr, function () {
            //             if (pid !== 'icebarn' && pid !== 'icelom' && pid !== 'icelom2' && pid !== 'mejilink' && pid !== 'yajitatami') {
            //                 assert_equal_board(bd, bd2);
            //             }
            //         });
            //         assert.equal(puzzle.ready, true);
            //     });
            // });
        });

    });
}