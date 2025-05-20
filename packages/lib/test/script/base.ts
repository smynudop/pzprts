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

function execmouse(puzzle: Puzzle, strs: string[]) {
    const matches = (strs[1].match(/(left|right)(.*)/)![2] || "").match(/x([0-9]+)/);
    const repeat = matches ? +matches[1] : 1;
    const args = [];
    if (strs[1].substr(0, 4) === "left") { args.push('left'); }
    else if (strs[1].substr(0, 5) === "right") { args.push('right'); }
    for (let i = 2; i < strs.length; i++) { args.push(+strs[i]); }
    for (let t = 0; t < repeat; t++) {
        puzzle.mouse.inputPath.apply(puzzle.mouse, args);
    }
}
function execinput(puzzle: Puzzle, str: string) {
    const strs = str.split(/,/);
    let urls: string[]
    switch (strs[0]) {
        case 'newboard':
            urls = [puzzle.pid, strs[1], strs[2]];
            //if (puzzle.pid === 'tawa') { urls.push(strs[3]); }
            puzzle.readURL(urls.join("/"));
            break;
        case 'clear':
            puzzle.clear();
            break;
        case 'ansclear':
            puzzle.ansclear();
            break;
        case 'playmode':
        case 'editmode':
            puzzle.setMode(strs[0]);
            break;
        case 'setconfig':
            if (strs[2] === "true") { puzzle.setConfig(strs[1], true); }
            else if (strs[2] === "false") { puzzle.setConfig(strs[1], false); }
            else { puzzle.setConfig(strs[1], strs[2]); }
            break;
        case 'key':
            strs.shift();
            puzzle.key.inputKeys.apply(puzzle.key, strs);
            break;
        case 'cursor':
            puzzle.cursor.init(+strs[1], +strs[2]);
            break;
        case 'mouse':
            execmouse(puzzle, strs);
            break;
    }
}
export const testPuzzle = (puzzle: Puzzle, info: TestInfo) => {
    const fullfile = info.failcheck.at(-1)![1].split("/").join("\n")
    const pid = puzzle.pid

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
            if (puzzle.pid === 'stostone') { return; }

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
    describe('Input check', function () {
        const inps = info.inputs || [];
        if (inps.length === 0) { return; }
        let testcount = 0;
        inps.forEach(function (data) {
            testcount++;
            it('execinput ' + testcount, function () {
                const action = data.input || [];
                action.forEach((a) => execinput(puzzle, a));
                if (!!data.result) {
                    const filestr = puzzle.getFileData();
                    const resultstr = data.result.replace(/\//g, '\n');
                    assert.equal(filestr, resultstr);
                }
            });
        });
    });
}