/* test_lits.js */
import { testPuzzle } from "./base";
import { Lits } from "../../src/variety/lits";
testPuzzle(new Lits(), {
	url: '4/4/9q02jg',
	failcheck: [
		['cs2x2', "pzprv3/lits/4/4/3/0 0 1 1 /0 0 1 2 /0 1 1 2 /2 2 2 2 /# # . . /# # . . /. . . . /. . . . /"],
		['bkShadeGt4', "pzprv3/lits/4/4/3/0 0 1 1 /0 0 1 2 /0 1 1 2 /2 2 2 2 /. . # # /. . # . /. # # . /. . . . /"],
		['bkShadeDivide', "pzprv3/lits/4/4/3/0 0 1 1 /0 0 1 2 /0 1 1 2 /2 2 2 2 /. . # # /. . . . /. # # # /. . . . /"],
		['bsSameShape', "pzprv3/lits/4/4/3/0 0 1 1 /0 0 1 2 /0 1 1 2 /2 2 2 2 /# # # # /# . # . /# . # . /. . . . /"],
		['csDivide', "pzprv3/lits/4/4/3/0 0 1 1 /0 0 1 2 /0 1 1 2 /2 2 2 2 /# . # # /# . # . /# . # . /. . . . /"],
		['bkNoShade', "pzprv3/lits/4/4/3/0 0 1 1 /0 0 1 2 /0 1 1 2 /2 2 2 2 /# . # # /# # # . /# . # . /. . . . /"],
		['bkShadeLt4', "pzprv3/lits/4/4/3/0 0 1 1 /0 0 1 2 /0 1 1 2 /2 2 2 2 /# . # # /# # # . /# . # . /. . # # /"],
		[null, "pzprv3/lits/4/4/3/0 0 1 1 /0 0 1 2 /0 1 1 2 /2 2 2 2 /# + # # /# # # + /# + # + /# # # # /"]
	],
	inputs: [
		/* 回答入力はnurikabeと同じなので省略 */
		{ input: ["editmode", "newboard,4,4"] },
		{
			input: ["mouse,left, 4,0, 4,4, 2,4, 2,6", "mouse,left, 0,6, 6,6, 6,2, 8,2"],
			result: "pzprv3/lits/4/4/3/0 0 1 1 /0 0 1 2 /0 1 1 2 /2 2 2 2 /. . . . /. . . . /. . . . /. . . . /"
		},
		{
			input: ["mouse,left, 4,0, 4,4, 2,4, 2,6", "mouse,left, 0,6, 6,6, 6,2, 8,2"],
			result: "pzprv3/lits/4/4/1/0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /. . . . /. . . . /. . . . /. . . . /"
		}
	]
});
