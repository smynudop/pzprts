/* test_hitori.js */

import { Hitokure } from "../../src/variety/hitori";
import { testPuzzle } from "./base";

testPuzzle(new Hitokure(), {
	url: '4/4/1114142333214213',
	failcheck: [
		['brNoShade', "pzprv3/hitori/4/4"],
		['csAdjacent', "pzprv3/hitori/4/4/1 1 1 4 /1 4 2 3 /3 3 2 1 /4 2 1 3 /# . . . /# . . . /. . . . /. . . . /"],
		['cuDivideRB', "pzprv3/hitori/4/4/1 1 1 4 /1 4 2 3 /3 3 2 1 /4 2 1 3 /# . . . /. . . # /# . # . /. # . . /"],
		['nmDupRow', "pzprv3/hitori/4/4/1 1 1 4 /1 4 2 3 /3 3 2 1 /4 2 1 3 /# . . . /. . . . /# . # . /. . . # /"],
		[null, "pzprv3/hitori/4/4/1 1 1 4 /1 4 2 3 /3 3 2 1 /4 2 1 3 /# + # . /+ + + . /# + # . /+ + + # /"]
	],
	inputs: [
		/* 回答入力テスト */
		{ input: ["newboard,4,4", "playmode", "setconfig,use,1", "ansclear"] },
		{
			input: ["mouse,left, 1,1, 7,1, 7,3, 1,3, 1,5, 7,5, 7,7, 1,7"],
			result: "pzprv3/hitori/4/4/. . . . /. . . . /. . . . /. . . . /# . # . /. # . # /# . # . /. # . # /"
		},
		{
			input: ["mouse,left, 1,1, 7,1, 7,3, 1,3, 1,5, 7,5, 7,7, 1,7"],
			result: "pzprv3/hitori/4/4/. . . . /. . . . /. . . . /. . . . /. . . . /. . . . /. . . . /. . . . /"
		},
		{
			input: ["mouse,right, 1,1, 7,1, 7,3, 1,3, 1,5, 7,5, 7,7, 1,7"],
			result: "pzprv3/hitori/4/4/. . . . /. . . . /. . . . /. . . . /+ + + + /+ + + + /+ + + + /+ + + + /"
		},
		{
			input: ["mouse,right, 1,1, 7,1, 7,3, 1,3, 1,5, 7,5, 7,7, 1,7"],
			result: "pzprv3/hitori/4/4/. . . . /. . . . /. . . . /. . . . /. . . . /. . . . /. . . . /. . . . /"
		},
		{ input: ["setconfig,use,2", "ansclear"] },
		{
			input: ["mouse,left, 1,1, 7,1, 7,3, 1,3, 1,5, 7,5, 7,7, 1,7"],
			result: "pzprv3/hitori/4/4/. . . . /. . . . /. . . . /. . . . /# . # . /. # . # /# . # . /. # . # /"
		},
		{
			input: ["mouse,left, 1,1, 7,1, 7,3, 1,3, 1,5, 7,5, 7,7, 1,7"],
			result: "pzprv3/hitori/4/4/. . . . /. . . . /. . . . /. . . . /+ + + + /+ + + + /+ + + + /+ + + + /"
		},
		{
			input: ["mouse,left, 1,1, 7,1, 7,3, 1,3, 1,5, 7,5, 7,7, 1,7"],
			result: "pzprv3/hitori/4/4/. . . . /. . . . /. . . . /. . . . /. . . . /. . . . /. . . . /. . . . /"
		},
		{
			input: ["mouse,right, 1,1, 7,1, 7,3, 1,3, 1,5, 7,5, 7,7, 1,7"],
			result: "pzprv3/hitori/4/4/. . . . /. . . . /. . . . /. . . . /+ + + + /+ + + + /+ + + + /+ + + + /"
		},
		{
			input: ["mouse,right, 1,1, 7,1, 7,3, 1,3, 1,5, 7,5, 7,7, 1,7"],
			result: "pzprv3/hitori/4/4/. . . . /. . . . /. . . . /. . . . /# + # + /+ # + # /# + # + /+ # + # /"
		},
		{
			input: ["mouse,right, 1,1, 7,1, 7,3, 1,3, 1,5, 7,5, 7,7, 1,7"],
			result: "pzprv3/hitori/4/4/. . . . /. . . . /. . . . /. . . . /. . . . /. . . . /. . . . /. . . . /"
		},
		/* 問題入力テスト */
		{ input: ["editmode", "newboard,6,1"] },
		{
			input: ["cursor,1,1", "key,-", "key,right", "key,0", "key,right", "key,1", "key,right", "key,2", "key,right", "key,3", "key,right", "key,4"],
			result: "pzprv3/hitori/1/6/. . 1 2 3 4 /. . . . . . /"
		},
		{
			input: ["cursor,1,1", "key,-", "key,right", "key,-", "key,right", "key,-", "key,-"],
			result: "pzprv3/hitori/1/6/. . . 2 3 4 /. . . . . . /"
		},
		{ input: ["newboard,4,4"] },
		{
			input: ["cursor,0,0", "mouse,leftx2, 1,1", "mouse,leftx3, 3,1", "mouse,leftx4, 5,1", "mouse,leftx5, 7,1",
				"mouse,leftx6, 1,3", "mouse,leftx7, 3,3", "mouse,leftx8, 5,3",
				"cursor,0,0", "mouse,rightx2, 1,5", "mouse,rightx3, 3,5", "mouse,rightx4, 5,5", "mouse,rightx5, 7,5",
				"mouse,rightx6, 1,7", "mouse,rightx7, 3,7", "mouse,rightx8, 5,7"],
			result: "pzprv3/hitori/4/4/1 2 3 4 /. 1 2 . /4 3 2 1 /. 4 3 . /. . . . /. . . . /. . . . /. . . . /"
		}
	]
});
