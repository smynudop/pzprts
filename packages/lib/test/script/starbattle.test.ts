/* test_starbattle.js */
import { StarBattle } from "../../src/variety";
import { testPuzzle } from "./base";

testPuzzle(new StarBattle(), {
	url: '6/6/1/4ilbhgdnmhou',
	failcheck: [
		['starAround', "pzprv3/starbattle/6/6/1/6/0 0 0 1 1 1 /0 1 1 1 2 2 /0 3 3 4 4 2 /5 5 3 3 4 2 /5 4 4 4 4 2 /5 2 2 2 2 2 /. . . . . . /. . . . . . /. . . # . . /. . # . . . /. . . . . . /. . . . . . /"],
		['bkStarGt', "pzprv3/starbattle/6/6/1/6/0 0 0 1 1 1 /0 1 1 1 2 2 /0 3 3 4 4 2 /5 5 3 3 4 2 /5 4 4 4 4 2 /5 2 2 2 2 2 /. . # . . . /. . . . . . /# . . . . . /. . . . . . /. . . . . . /. . . . . . /"],
		['bkStarLt', "pzprv3/starbattle/6/6/1/6/0 0 0 1 1 1 /0 1 1 1 2 2 /0 3 3 4 4 2 /5 5 3 3 4 2 /5 4 4 4 4 2 /5 2 2 2 2 2 /. . # . . . /. . . . . . /. . . . . . /. . . . . . /. . . . . . /. . . . . . /"],
		['lnStarNe', "pzprv3/starbattle/6/6/1/6/0 0 0 1 1 1 /0 1 1 1 2 2 /0 3 3 4 4 2 /5 5 3 3 4 2 /5 4 4 4 4 2 /5 2 2 2 2 2 /+ # + + + + /+ + + # + + /+ + + + + # /. + # + + + /# + + + # + /. + + + + + /"],
		[null, "pzprv3/starbattle/6/6/1/6/0 0 0 1 1 1 /0 1 1 1 2 2 /0 3 3 4 4 2 /5 5 3 3 4 2 /5 4 4 4 4 2 /5 2 2 2 2 2 /+ # + + + + /+ + + # + + /+ + + + + # /. + # + + + /. + + + # + /# + + + + + /"]
	],
	inputs: [
		/* 問題入力テスト */
		{ input: ["newboard,8,8,1", "editmode"] },
		{
			input: ["key,2"],
			result: "pzprv3/starbattle/8/8/2/1/0 0 0 0 0 0 0 0 /0 0 0 0 0 0 0 0 /0 0 0 0 0 0 0 0 /0 0 0 0 0 0 0 0 /0 0 0 0 0 0 0 0 /0 0 0 0 0 0 0 0 /0 0 0 0 0 0 0 0 /0 0 0 0 0 0 0 0 /. . . . . . . . /. . . . . . . . /. . . . . . . . /. . . . . . . . /. . . . . . . . /. . . . . . . . /. . . . . . . . /. . . . . . . . /"
		},
		{
			input: ["mouse, left, 15,-1"],
			result: "pzprv3/starbattle/8/8/1/1/0 0 0 0 0 0 0 0 /0 0 0 0 0 0 0 0 /0 0 0 0 0 0 0 0 /0 0 0 0 0 0 0 0 /0 0 0 0 0 0 0 0 /0 0 0 0 0 0 0 0 /0 0 0 0 0 0 0 0 /0 0 0 0 0 0 0 0 /. . . . . . . . /. . . . . . . . /. . . . . . . . /. . . . . . . . /. . . . . . . . /. . . . . . . . /. . . . . . . . /. . . . . . . . /"
		},
		/* 回答入力テスト */
		{ input: ["newboard,4,4,1", "playmode", "setconfig,use,1"] },
		{
			input: ["mouse,right, 1,3, 7,3"],
			result: "pzprv3/starbattle/4/4/1/1/0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /. . . . /+ + + + /. . . . /. . . . /"
		},
		{
			input: ["mouse,left, 1,3, 7,3"],
			result: "pzprv3/starbattle/4/4/1/1/0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /. . . . /# + + + /. . . . /. . . . /"
		},
		{
			input: ["mouse,left, 1,3, 7,3"],
			result: "pzprv3/starbattle/4/4/1/1/0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /. . . . /. . . . /. . . . /. . . . /"
		},
		{
			input: ["mouse,left, 1,3, 7,3"],
			result: "pzprv3/starbattle/4/4/1/1/0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /. . . . /# . . . /. . . . /. . . . /"
		},
		{
			input: ["mouse,right, 1,3, 7,3"],
			result: "pzprv3/starbattle/4/4/1/1/0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /. . . . /+ + + + /. . . . /. . . . /"
		},
		{ input: ["ansclear", "setconfig,use,2"] },
		{
			input: ["mouse,left, 1,3, 7,3"],
			result: "pzprv3/starbattle/4/4/1/1/0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /. . . . /# . . . /. . . . /. . . . /"
		},
		{
			input: ["mouse,left, 1,3, 7,3"],
			result: "pzprv3/starbattle/4/4/1/1/0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /. . . . /+ + + + /. . . . /. . . . /"
		},
		{
			input: ["mouse,left, 1,3, 7,3"],
			result: "pzprv3/starbattle/4/4/1/1/0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /. . . . /. . . . /. . . . /. . . . /"
		},
		{
			input: ["mouse,right, 1,3, 7,3"],
			result: "pzprv3/starbattle/4/4/1/1/0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /. . . . /+ + + + /. . . . /. . . . /"
		},
		{
			input: ["mouse,right, 1,3, 7,3"],
			result: "pzprv3/starbattle/4/4/1/1/0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /. . . . /# + + + /. . . . /. . . . /"
		},
		{
			input: ["mouse,right, 1,3, 7,3"],
			result: "pzprv3/starbattle/4/4/1/1/0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /. . . . /. . . . /. . . . /. . . . /"
		}
	]
});
