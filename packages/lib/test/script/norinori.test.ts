/* test_norinori.js */
import { testPuzzle } from "./base";
import { Norinori } from "../../src/variety/norinori";
testPuzzle(new Norinori(), {
	url: '5/5/cag4ocjo',
	failcheck: [
		['csGt2', "pzprv3/norinori/5/5/5/0 0 1 2 2 /1 1 1 2 2 /1 3 3 2 2 /3 3 3 3 3 /4 4 3 3 3 /# # . . . /. # . . . /. . . . . /. . . . . /. . . . . /"],
		['bkShadeGt2', "pzprv3/norinori/5/5/5/0 0 1 2 2 /1 1 1 2 2 /1 3 3 2 2 /3 3 3 3 3 /4 4 3 3 3 /# # + . # /+ + # # . /# . . . # /. . . . # /. . . . . /"],
		['csLt2', "pzprv3/norinori/5/5/5/0 0 1 2 2 /1 1 1 2 2 /1 3 3 2 2 /3 3 3 3 3 /4 4 3 3 3 /# # + + + /+ + # # + /# . . + . /+ + . . . /# # + . . /"],
		['bkShadeLt2', "pzprv3/norinori/5/5/5/0 0 1 2 2 /1 1 1 2 2 /1 3 3 2 2 /3 3 3 3 3 /4 4 3 3 3 /# # + + + /+ + # # + /# # + + . /+ + . . . /# # + . . /"],
		['bkNoShade', "pzprv3/norinori/5/5/5/0 0 1 2 2 /1 1 1 2 2 /1 3 3 2 2 /3 3 3 3 3 /4 4 3 3 3 /# # + + + /+ + + + + /+ + + + . /+ + . . . /# # + . . /"],
		[null, "pzprv3/norinori/5/5/5/0 0 1 2 2 /1 1 1 2 2 /1 3 3 2 2 /3 3 3 3 3 /4 4 3 3 3 /# # + + + /+ + # # + /# # + + # /+ + . . # /# # + . . /"]
	],
	inputs: [
		/* 問題入力はlitsと同じなので省略 */
		/* 回答入力テスト */
		{ input: ["playmode", "newboard,4,4"] },
		{
			input: ["mouse,left, 4,0, 4,4, 2,4, 2,6", "mouse,left, 0,6, 6,6, 6,2, 8,2"],
			result: "pzprv3/norinori/4/4/1/0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /. . # . /. . # . /. . . . /# # . . /"
		}
	]
});
