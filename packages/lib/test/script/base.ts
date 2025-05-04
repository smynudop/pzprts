import type { Puzzle } from "../../src/puzzle/Puzzle"
import { test, expect, describe, it, assert } from "vitest"
import { FILE_PZPR } from "../../src/pzpr/constants"
import type { Board } from "../../src/puzzle/Board"
import type { IBoardOperation } from "../../src/puzzle/BoardExec"

type TestInfo = {
    url: string
    failcheck: [code: string | null, board: string][],
    inputs: { input: string[], result?: string }[]
    fullfile?: string
}

function assert_equal_board(bd1: Board, bd2: any) {
    let cnt = 0
    bd1.compareData(bd2, function (group, c, a) {
        cnt++
    });
    return cnt
}
export const testPuzzle = (puzzle: Puzzle, info: TestInfo) => {
    const fullfile = info.failcheck.at(-1)![1].split("/").join("\n")
    const pid = puzzle.pid

    describe(puzzle.pid, function () {
        test("pid is set", () => {
            assert(puzzle.pid !== "", "pid is not set!")
        })
        describe("fileio", () => {
            puzzle.readFile(fullfile)
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
        //return;
        describe('boardexec test', function () {
            describe('Turn', function () {
                const relyonupdn = (pid === 'dosufuwa' || pid === 'box' || pid === 'cojun' || pid === 'shugaku');
                const relyon90deg = (pid === 'stostone');

                if (puzzle.pid === 'tawa') { return; }
                it('turn right', function () {
                    puzzle.readFile(fullfile)

                    const bd2 = puzzle.board.freezecopy();

                    for (let i = 0; i < 4; i++) {
                        puzzle.board.operate('turnr');
                        if (relyonupdn && i !== 3) { continue; }
                        if (relyon90deg && (i !== 1 && i !== 3)) { continue; }
                        const r = puzzle.check()
                        assert(r.list.length === 0, `check failed! i: ${i}, list: ${r.list} `);
                    }
                    assert(assert_equal_board(puzzle.board, bd2) === 0, "not equal!")

                    for (let i = 0; i < 4; i++) {
                        puzzle.undo();
                        if (relyonupdn && i !== 3) { continue; }
                        if (relyon90deg && (i !== 1 && i !== 3)) { continue; }
                        assert.equal(puzzle.check().list[0], null);
                    }
                    assert(assert_equal_board(puzzle.board, bd2) === 0, "not equal!")
                });
                it('turn left', function () {
                    puzzle.readFile(fullfile)
                    const bd2 = puzzle.board.freezecopy();
                    for (let i = 0; i < 4; i++) {
                        puzzle.board.operate('turnl');
                        if (relyonupdn && i !== 3) { continue; }
                        if (relyon90deg && (i !== 1 && i !== 3)) { continue; }
                        assert.equal(puzzle.check().list[0], null);
                    }
                    assert(assert_equal_board(puzzle.board, bd2) === 0, "not equal!")

                    for (let i = 0; i < 4; i++) {
                        puzzle.undo();
                        if (relyonupdn && i !== 3) { continue; }
                        if (relyon90deg && (i !== 1 && i !== 3)) { continue; }
                        assert.equal(puzzle.check().list[0], null);
                    }
                    assert(assert_equal_board(puzzle.board, bd2) === 0, "not equal!")
                });
            });
            describe('Flip', function () {
                puzzle.readFile(fullfile);
                const relyonupdn = (pid === 'dosufuwa' || pid === 'box' || pid === 'cojun' || pid === 'shugaku' || pid === 'tawa');
                const relyonanydir = (pid === 'box' || pid === 'shugaku');

                it('flipX', function () {
                    const bd2 = puzzle.board.freezecopy();
                    for (let i = 0; i < 4; i++) {
                        puzzle.board.operate('flipx');
                        if (relyonanydir && i !== 3) { continue; }
                        assert.equal(puzzle.check().list[0], null);
                    }
                    assert(assert_equal_board(puzzle.board, bd2) === 0, "not equal!")

                    for (let i = 0; i < 4; i++) {
                        puzzle.undo();
                        if (relyonanydir && i !== 3) { continue; }
                        assert.equal(puzzle.check().list[0], null);
                    }
                    assert(assert_equal_board(puzzle.board, bd2) === 0, "not equal!")
                });
                it('flipY', function () {
                    const bd2 = puzzle.board.freezecopy();
                    for (let i = 0; i < 4; i++) {
                        puzzle.board.operate('flipy');
                        if (relyonupdn && i !== 3) { continue; }
                        assert.equal(puzzle.check().list[0], null);
                    }
                    assert(assert_equal_board(puzzle.board, bd2) === 0, "not equal!")

                    for (let i = 0; i < 4; i++) {
                        puzzle.undo();
                        if (relyonupdn && i !== 3) { continue; }
                        assert.equal(puzzle.check().list[0], null);
                    }
                    assert(assert_equal_board(puzzle.board, bd2) === 0, "not equal!")
                });
            });
            describe('Adjust', function () {
                it('expand/reduce', function () {
                    puzzle.readFile(fullfile);

                    const bd2 = puzzle.board.freezecopy();
                    const opes: IBoardOperation[] = ['expandup', 'expanddn', 'expandlt', 'expandrt', 'reduceup', 'reducedn', 'reducelt', 'reducert']
                    opes.forEach(function (a) { puzzle.board.operate(a); });

                    assert(assert_equal_board(puzzle.board, bd2) === 0, "not equal!")
                    assert.equal(puzzle.check().list[0], null);

                    for (let i = 0; i < 8; i++) { puzzle.undo(); }

                    assert(assert_equal_board(puzzle.board, bd2) === 0, "not equal!")
                    assert.equal(puzzle.check().list[0], null);
                });
            });
        });
    });
}