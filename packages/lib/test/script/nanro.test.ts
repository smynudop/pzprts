/* test_nanro.js */
import { testPuzzle } from "./base";
import { Nanro } from "../../src/variety";
testPuzzle(new Nanro(), {
	url: '4/4/6r0s1oi13n1h',
	failcheck: [
		['nm2x2', "pzprv3/nanro/4/4/5/0 0 0 1 /2 3 3 1 /2 3 3 1 /2 4 4 4 /. . . 1 /3 . . . /. . . . /. 1 . . /. . . . /. . . - /3 2 . - /3 . - - /"],
		['cbSameNum', "pzprv3/nanro/4/4/5/0 0 0 1 /2 3 3 1 /2 3 3 1 /2 4 4 4 /. . . 1 /3 . . . /. . . . /. 1 . . /. . . . /. 3 3 - /3 . 3 - /3 . - - /"],
		['bkPlNum', "pzprv3/nanro/4/4/5/0 0 0 1 /2 3 3 1 /2 3 3 1 /2 4 4 4 /. . . 1 /3 . . . /. . . . /. 1 . . /. + . . /. . 1 - /3 - 2 - /3 . - - /"],
		['nmCountGt', "pzprv3/nanro/4/4/5/0 0 0 1 /2 3 3 1 /2 3 3 1 /2 4 4 4 /. . . 1 /3 . . . /. . . . /. 1 . . /. + . . /. . 1 - /3 - 1 - /3 . - - /"],
		['nmDivide', "pzprv3/nanro/4/4/5/0 0 0 1 /2 3 3 1 /2 3 3 1 /2 4 4 4 /. . . 1 /3 . . . /. . . . /. 1 . . /. + . . /. 1 . - /3 - . - /3 . - - /"],
		['nmCountLt', "pzprv3/nanro/4/4/5/0 0 0 1 /2 3 3 1 /2 3 3 1 /2 4 4 4 /. . . 1 /3 . . . /. . . . /. 1 . . /. 3 3 . /. 1 . - /3 - . - /3 . - - /"],
		['bkNoNum', "pzprv3/nanro/4/4/6/0 0 0 1 /2 3 4 1 /2 3 4 1 /2 5 5 5 /. . . 1 /3 . . . /. . . . /. 1 . . /. 2 2 . /. 1 . - /3 - . - /3 . - - /"],
		['ceSuspend', "pzprv3/nanro/4/4/5/0 0 0 1 /2 3 3 1 /2 3 3 1 /2 4 3 3 /. . . 1 /3 . . . /. . . . /. 1 . . /. 2 2 . /. 1 . - /3 - + - /3 . + + /"],
		[null, "pzprv3/nanro/4/4/5/0 0 0 1 /2 3 3 1 /2 3 3 1 /2 4 4 4 /. . . 1 /3 . . . /. . . . /. 1 . . /. 2 2 . /. 1 . - /3 - . - /3 . - - /"]
	],
	inputs: [
		/* 問題入力はrippleと同じなので省略 */
		/* 回答入力テスト */
		{ input: ["newboard,4,2", "editmode", "mouse,left, 0,2, 8,2", "mouse,left, 4,0, 4,4", "playmode"] },
		{
			input: ["cursor,1,1", "key,1", "key,right,2", "key,right,q", "key,right,w"],
			result: "pzprv3/nanro/2/4/4/0 0 1 1 /2 2 3 3 /. . . . /. . . . /1 2 + - /. . . . /"
		},
		{
			input: ["cursor,1,1", "key,-", "key,right, ", "key,right,-,-", "key,right,e"],
			result: "pzprv3/nanro/2/4/4/0 0 1 1 /2 2 3 3 /. . . . /. . . . /. . . . /. . . . /"
		},
		{ input: ["cursor,1,1", "key,q", "key,down,w"] },
		{
			input: ["mouse,left, 1,1, 5,1", "mouse,left, 1,3, 5,3"],
			result: "pzprv3/nanro/2/4/4/0 0 1 1 /2 2 3 3 /. . . . /. . . . /+ + + . /- - - . /"
		}
	]
});
