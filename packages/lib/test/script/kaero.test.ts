/* test_kaero.js */
import { Kaero } from "../../src";
import { testPuzzle } from "./base";
testPuzzle(new Kaero(), {
	url: '3/3/egh0BCBcAaA',
	failcheck: [
		['lnBranch', "pzprv3/kaero/3/3/2 3 2 /. . . /1 . 1 /. . . /. . . /. . . /0 1 /1 1 /0 1 /1 0 0 /0 1 0 /0 0 /1 1 /0 0 /1 0 0 /0 1 0 /"],
		['lnCross', "pzprv3/kaero/3/3/2 3 2 /. . . /1 . 1 /. . . /. . . /. . . /0 1 /1 1 /0 1 /1 0 0 /0 1 0 /0 0 /1 1 /0 0 /0 1 0 /0 1 0 /"],
		['nmConnected', "pzprv3/kaero/3/3/2 3 2 /. . . /1 . 1 /. . . /. . . /. . . /0 1 /1 1 /0 1 /1 0 0 /0 1 0 /0 0 /1 0 /0 0 /0 1 0 /1 0 0 /"],
		['laOnNum', "pzprv3/kaero/3/3/2 3 2 /. . . /1 . 1 /. . . /. . . /. . . /0 1 /1 1 /0 1 /1 0 0 /0 1 0 /0 0 /1 0 /1 0 /0 0 0 /1 0 0 /"],
		['bkPlNum', "pzprv3/kaero/3/3/2 3 2 /. . . /1 . 1 /. . . /. . . /. . . /0 1 /1 1 /0 1 /1 0 0 /0 1 0 /0 0 /0 0 /0 0 /0 0 0 /0 0 0 /"],
		['bkSepNum', "pzprv3/kaero/3/3/2 3 2 /. . . /1 . 1 /. . . /. . . /. . . /0 1 /1 1 /1 1 /1 0 0 /0 1 0 /0 0 /1 1 /0 1 /1 0 0 /0 0 0 /"],
		['bkNoNum', "pzprv3/kaero/3/3/2 3 2 /. . . /1 . 1 /. . . /. . . /. . . /0 1 /1 1 /0 1 /1 0 0 /1 1 0 /0 0 /1 1 /0 1 /1 0 0 /0 0 0 /"],
		['laIsolate', "pzprv3/kaero/3/3/2 3 2 /. . . /1 . 1 /. . . /. . . /. . . /1 1 /0 0 /0 0 /0 1 0 /1 1 1 /0 0 /0 1 /0 1 /1 0 0 /0 0 0 /"],
		[null, "pzprv3/kaero/3/3/2 3 2 /. . . /1 . 1 /+ - - /. . - /- - + /0 1 /1 1 /0 1 /1 0 0 /0 1 0 /0 0 /1 1 /0 1 /1 0 0 /0 0 0 /"]
	],
	inputs: [
		/* 問題入力テスト */
		{ input: ["newboard,5,1", "editmode"] },
		/* 境界線の入力テストは省略 */
		{
			input: ["cursor,1,1", "key,-", "key,right", "key,a", "key,right", "key,b", "key,right", "key,c", "key,right", "key,d"],
			result: "pzprv3/kaero/1/5/- 1 2 3 4 /. . . . . /0 0 0 0 /0 0 0 0 /"
		},
		{
			input: ["cursor,1,1", "key,-", "key,right", "key,a", "key,right", "key,-,-", "key,right", "key,c,c"],
			result: "pzprv3/kaero/1/5/. 27 . . 4 /. . . . . /0 0 0 0 /0 0 0 0 /"
		},
		{ input: ["newboard,4,2", "editmode"] },
		{
			input: ["cursor,0,0", "mouse,leftx2, 1,1", "mouse,leftx3, 3,1", "mouse,leftx4, 5,1", "mouse,leftx5, 7,1",
				"cursor,0,0", "mouse,rightx2, 1,3", "mouse,rightx3, 3,3", "mouse,rightx4, 5,3", "mouse,rightx5, 7,3"],
			result: "pzprv3/kaero/2/4/- 1 2 3 /52 51 50 49 /. . . . /. . . . /0 0 0 /0 0 0 /0 0 0 0 /0 0 0 /0 0 0 /0 0 0 0 /"
		},
		{ input: ["newboard,4,2", "editmode"] },
		{
			input: ["cursor,0,0", "mouse,leftx27, 1,1", "mouse,leftx28, 3,1", "mouse,leftx29, 5,1", "mouse,leftx30, 7,1",
				"cursor,0,0", "mouse,rightx26, 1,3", "mouse,rightx27, 3,3", "mouse,rightx28, 5,3", "mouse,rightx29, 7,3"],
			result: "pzprv3/kaero/2/4/25 26 27 28 /28 27 26 25 /. . . . /. . . . /0 0 0 /0 0 0 /0 0 0 0 /0 0 0 /0 0 0 /0 0 0 0 /"
		},
		{ input: ["newboard,4,2", "editmode"] },
		{
			input: ["cursor,0,0", "mouse,leftx53, 1,1", "mouse,leftx54, 3,1", "mouse,leftx55, 5,1", "mouse,leftx56, 7,1",
				"cursor,0,0", "mouse,rightx53, 1,3", "mouse,rightx54, 3,3", "mouse,rightx55, 5,3", "mouse,rightx56, 7,3"],
			result: "pzprv3/kaero/2/4/51 52 . - /1 - . 52 /. . . . /. . . . /0 0 0 /0 0 0 /0 0 0 0 /0 0 0 /0 0 0 /0 0 0 0 /"
		},
		/* 回答入力テスト - 動かしたように描画する場合 */
		{ input: ["newboard,3,2", "editmode", "cursor,1,1", "key,a,down,b"] },
		{ input: ["setconfig,dispmove,true", "ansclear", "playmode"] },
		{
			input: ["mouse,left, 3,1, 3,3, 5,3"],
			result: "pzprv3/kaero/2/3/1 . . /2 . . /. . . /. . + /0 0 /0 0 /0 0 0 /0 0 /0 0 /0 0 0 /"
		},
		{
			input: ["ansclear", "mouse,left, 1,1, 3,1, 3,3, 5,3"],
			result: "pzprv3/kaero/2/3/1 . . /2 . . /. . . /. . . /0 0 /0 0 /0 0 0 /1 0 /0 1 /0 1 0 /"
		},
		{
			input: ["mouse,left, 5,3, 5,1, 3,1"],
			result: "pzprv3/kaero/2/3/1 . . /2 . . /. . . /. . . /0 0 /0 0 /0 0 0 /1 0 /0 1 /0 1 1 /"
		},
		{
			input: ["mouse,right, 1,2, 2,3, 4,3, 5,2"],
			result: "pzprv3/kaero/2/3/1 . . /2 . . /. . . /. . . /0 0 /0 0 /0 0 0 /1 0 /-1 1 /-1 1 1 /"
		},
		{
			input: ["mouse,left, 5,1, 5,3, 1,3"],
			result: "pzprv3/kaero/2/3/1 . . /2 . . /. . . /. . . /0 0 /0 0 /0 0 0 /1 0 /-1 0 /-1 1 0 /"
		},
		{
			input: ["mouse,left, 1,3, 1,1"],
			result: "pzprv3/kaero/2/3/1 . . /2 . . /+ . . /. . . /0 0 /0 0 /0 0 0 /1 0 /-1 0 /-1 1 0 /"
		},
		{
			input: ["mouse,left, 3,1, 5,1"],
			result: "pzprv3/kaero/2/3/1 . . /2 . . /+ . + /. . . /0 0 /0 0 /0 0 0 /1 0 /-1 0 /-1 1 0 /"
		},
		{
			input: ["mouse,left, 1,1", "mouse,rightx2, 5,1"],
			result: "pzprv3/kaero/2/3/1 . . /2 . . /- . - /. . . /0 0 /0 0 /0 0 0 /1 0 /-1 0 /-1 1 0 /"
		},
		/* 回答入力テスト - 動かしたように描画しない場合 */
		{ input: ["newboard,3,2", "editmode", "cursor,1,1", "key,a,down,b"] },
		{ input: ["setconfig,dispmove,false", "ansclear", "playmode"] },
		{
			input: ["mouse,left, 3,1, 3,3, 5,3"],
			result: "pzprv3/kaero/2/3/1 . . /2 . . /. . . /. . . /0 0 /0 0 /0 0 0 /0 0 /0 1 /0 1 0 /"
		},
		{
			input: ["ansclear", "mouse,left, 1,1, 3,1, 3,3, 5,3"],
			result: "pzprv3/kaero/2/3/1 . . /2 . . /. . . /. . . /0 0 /0 0 /0 0 0 /1 0 /0 1 /0 1 0 /"
		},
		{
			input: ["mouse,left, 5,3, 5,1, 3,1"],
			result: "pzprv3/kaero/2/3/1 . . /2 . . /. . . /. . . /0 0 /0 0 /0 0 0 /1 1 /0 1 /0 1 1 /"
		},
		{
			input: ["mouse,right, 1,2, 2,3, 4,3, 5,2"],
			result: "pzprv3/kaero/2/3/1 . . /2 . . /. . . /. . . /0 0 /0 0 /0 0 0 /1 1 /-1 -1 /-1 1 -1 /"
		},
		{
			input: ["mouse,left, 5,1, 5,3, 1,3"],
			result: "pzprv3/kaero/2/3/1 . . /2 . . /. . . /. . . /0 0 /0 0 /0 0 0 /1 1 /1 1 /-1 1 1 /"
		},
		{
			input: ["mouse,left, 1,3, 1,1"],
			result: "pzprv3/kaero/2/3/1 . . /2 . . /. . . /. . . /0 0 /0 0 /0 0 0 /1 1 /1 1 /1 1 1 /"
		},
		{
			input: ["mouse,left, 3,1, 5,1"],
			result: "pzprv3/kaero/2/3/1 . . /2 . . /. . . /. . . /0 0 /0 0 /0 0 0 /1 0 /1 1 /1 1 1 /"
		},
		{
			input: ["mouse,left, 1,1", "mouse,rightx2, 5,1"],
			result: "pzprv3/kaero/2/3/1 . . /2 . . /+ . + /. . . /0 0 /0 0 /0 0 0 /1 0 /1 1 /1 1 1 /"
		}
	]
});
