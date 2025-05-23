/* test_factors.js */
import { testPuzzle } from "./base"
import { Factors } from "../../src/variety";
testPuzzle(new Factors(), {
	url: '5/5/rvvcm9jf54653-28ca2833-14',
	failcheck: [
		['nmDupRow', "pzprv3/factors/5/5/1 1 0 1 /1 1 1 1 /1 1 1 1 /1 1 1 0 /1 1 0 0 /1 0 1 1 0 /0 1 0 0 1 /1 0 0 1 1 /0 1 1 1 1 /5 4 6 . 5 /3 . 40 12 . /. 10 . . 2 /8 . . 3 . /. 3 20 . . /5 . . . 5 /. . . . 1 /. . . . . /. . . . . /. . . . . /"],
		['nmProduct', "pzprv3/factors/5/5/1 1 0 1 /1 1 1 1 /1 1 1 1 /1 1 1 0 /1 1 0 0 /1 0 1 1 0 /0 1 0 0 1 /1 0 0 1 1 /0 1 1 1 1 /5 4 6 . 5 /3 . 40 12 . /. 10 . . 2 /8 . . 3 . /. 3 20 . . /5 . . . 2 /. . . . 5 /. . . . . /. . . . . /. . . . . /"],
		['ceNoNum', "pzprv3/factors/5/5/1 1 0 1 /1 1 1 1 /1 1 1 1 /1 1 1 0 /1 1 0 0 /1 0 1 1 0 /0 1 0 0 1 /1 0 0 1 1 /0 1 1 1 1 /5 4 6 . 5 /3 . 40 12 . /. 10 . . 2 /8 . . 3 . /. 3 20 . . /5 4 . . 1 /3 1 . 4 5 /1 . . 3 . /. . . . . /. . . . . /"],
		[null, "pzprv3/factors/5/5/1 1 0 1 /1 1 1 1 /1 1 1 1 /1 1 1 0 /1 1 0 0 /1 0 1 1 0 /0 1 0 0 1 /1 0 0 1 1 /0 1 1 1 1 /5 4 6 . 5 /3 . 40 12 . /. 10 . . 2 /8 . . 3 . /. 3 20 . . /5 4 3 2 1 /3 1 2 4 5 /1 5 4 3 2 /4 2 5 1 3 /2 3 1 5 4 /"]
	],
	inputs: [
		/* 問題入力テスト */
		{ input: ["editmode", "newboard,4,4"] },
		{ input: ["mouse,left, 0,2, 8,2", "mouse,left, 0,4, 8,4", "mouse,left, 0,6, 8,6", "mouse,left, 4,0, 4,8"] },
		{
			input: ["cursor,0,0", "mouse,leftx2, 3,1", "mouse,leftx3, 3,3", "mouse,leftx4, 1,5", "mouse,leftx5, 1,7",
				"cursor,0,0", "mouse,rightx2, 7,1", "mouse,rightx3, 7,3", "mouse,rightx4, 5,5", "mouse,rightx5, 5,7"],
			result: "pzprv3/factors/4/4/0 1 0 /0 1 0 /0 1 0 /0 1 0 /1 1 1 1 /1 1 1 1 /1 1 1 1 /1 . 999999 . /2 . 999998 . /3 . 999997 . /4 . 999996 . /. . . . /. . . . /. . . . /. . . . /"
		},
		{ input: ["editmode", "newboard,4,4"] },
		{ input: ["mouse,left, 0,2, 8,2", "mouse,left, 0,4, 8,4", "mouse,left, 0,6, 8,6", "mouse,left, 4,0, 4,8"] },
		{
			input: ["cursor,3,1", "key,1", "key,down,2", "key,down,5,0,0,0,0", "key,down,9,9,9,9,9,9"],
			result: "pzprv3/factors/4/4/0 1 0 /0 1 0 /0 1 0 /0 1 0 /1 1 1 1 /1 1 1 1 /1 1 1 1 /1 . . . /2 . . . /50000 . . . /999999 . . . /. . . . /. . . . /. . . . /. . . . /"
		},
		{
			input: ["cursor,3,1", "key,-", "key,down,-,-", "key,down, "],
			result: "pzprv3/factors/4/4/0 1 0 /0 1 0 /0 1 0 /0 1 0 /1 1 1 1 /1 1 1 1 /1 1 1 1 /. . . . /. . . . /. . . . /999999 . . . /. . . . /. . . . /. . . . /. . . . /"
		}
		/* 回答入力はkakuroと同じなので省略 */
	]
});
