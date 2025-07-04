/* test_wblink.js */
import { Wblink } from "../../src/variety";
import { testPuzzle } from "./base";

testPuzzle(new Wblink(), {
	url: '5/5/ci6a2ln1i',
	failcheck: [
		['brNoLine', "pzprv3/wblink/5/5"],
		['lnCross', "pzprv3/wblink/5/5/1 1 . 2 . /. . 2 . 1 /. 1 . . 2 /2 1 . 2 1 /2 . . 1 2 /0 0 0 0 /0 0 0 0 /0 1 1 1 /0 0 0 0 /0 0 0 0 /0 0 0 1 0 /0 0 0 1 0 /0 0 0 1 0 /0 0 0 0 0 /"],
		['lcTripleNum', "pzprv3/wblink/5/5/1 1 . 2 . /. . 2 . 1 /. 1 . . 2 /2 1 . 2 1 /2 . . 1 2 /0 0 0 0 /0 0 0 0 /0 0 0 0 /1 1 1 1 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /"],
		['lcInvWhite', "pzprv3/wblink/5/5/1 1 . 2 . /. . 2 . 1 /. 1 . . 2 /2 1 . 2 1 /2 . . 1 2 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 1 0 0 0 /0 1 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /"],
		['lcInvBlack', "pzprv3/wblink/5/5/1 1 . 2 . /. . 2 . 1 /. 1 . . 2 /2 1 . 2 1 /2 . . 1 2 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 1 0 /0 0 0 1 0 /0 0 0 1 0 /0 0 0 0 0 /"],
		['nmNoLine', "pzprv3/wblink/5/5/1 1 . 2 . /. . 2 . 1 /. 1 . . 2 /2 1 . 2 1 /2 . . 1 2 /-1 1 1 0 /0 0 1 1 /0 0 0 0 /0 1 1 0 /1 1 1 0 /1 -1 0 0 0 /1 -1 0 0 0 /1 -1 0 0 0 /0 0 0 0 0 /"],
		[null, "pzprv3/wblink/5/5/1 1 . 2 . /. . 2 . 1 /. 1 . . 2 /2 1 . 2 1 /2 . . 1 2 /-1 1 1 0 /0 0 1 1 /0 1 1 1 /0 1 1 0 /1 1 1 0 /1 -1 0 0 0 /1 -1 0 0 0 /1 -1 0 0 0 /0 0 0 -1 1 /"]
	],
	inputs: [
		/* 問題入力はmashuと同じなので省略 */
		/* 回答入力テスト */
		{ input: ["newboard,4,4", "editmode"] },
		{ input: ["cursor,1,1", "key,1", "cursor,1,7", "key,1", "cursor,3,3", "key,2", "cursor,3,7", "key,2", "cursor,7,1", "key,1", "cursor,7,5", "key,1", "playmode"] },
		{
			input: ["mouse,left, 1,1, 1,3", "mouse,left, 7,1, 5,1", "mouse,left, 5,5, 7,5", "mouse,left, 3,7, 3,5"],
			result: "pzprv3/wblink/4/4/1 . . 1 /. 2 . . /. . . 1 /1 2 . . /1 1 1 /0 0 0 /0 0 0 /0 0 0 /1 0 0 0 /1 1 0 0 /1 1 0 0 /"
		},
		{
			input: ["mouse,right, 1,2, 2,1, 6,1"],
			result: "pzprv3/wblink/4/4/1 . . 1 /. 2 . . /. . . 1 /1 2 . . /-1 -1 -1 /0 0 0 /0 0 0 /0 0 0 /-1 0 0 0 /0 1 0 0 /0 1 0 0 /"
		},
		{
			input: ["mouse,left, 3,1, 5,1"],
			result: "pzprv3/wblink/4/4/1 . . 1 /. 2 . . /. . . 1 /1 2 . . /1 1 1 /0 0 0 /0 0 0 /0 0 0 /-1 0 0 0 /0 1 0 0 /0 1 0 0 /"
		}
	]
});
