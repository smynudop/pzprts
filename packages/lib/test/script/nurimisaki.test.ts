/* test_nurimisaki.js */
import { testPuzzle } from "./base";
import { Nurimisaki } from "../../src/variety/nurimisaki";

testPuzzle(new Nurimisaki(), {
	url: '5/5/4l2l.n.g',
	failcheck: [
		['brNoShade', "pzprv3/nurimisaki/5/5/4 . . . . /. . 2 . . /. . . . - /. . . . . /. . . - . /. . . . . /. . . . . /. . . . . /. . . . . /. . . . . /"],
		['cuDivide', "pzprv3/nurimisaki/5/5/4 . . . . /. . 2 . . /. . . . - /. . . . . /. . . - . /. # . . . /. # . . . /. # . . . /. # . . . /. # . . . /"],
		['cs2x2', "pzprv3/nurimisaki/5/5/4 . . . . /. . 2 . . /. . . . - /. . . . . /. . . - . /. . . . . /. . . . . /. # # . . /. # # . . /. . . . . /"],
		['nmUnshadeNe1', "pzprv3/nurimisaki/5/5/4 . . . . /. . 2 . . /. . . . - /. . . . . /. . . - . /. # . . . /+ . . . . /+ . . . . /+ + . . . /# # . . . /"],
		['nmUnshadeEq1', "pzprv3/nurimisaki/5/5/4 . . . . /. . 2 . . /. . . . - /. . . . . /. . . - . /. # # . . /+ # . . # /+ # # . . /+ + . . # /# # # . # /"],
		['nmSumSizeNe', "pzprv3/nurimisaki/5/5/4 . . . . /. . 2 . . /. . . . - /. . . . . /. . . - . /. # # # # /+ # . . # /+ # # . . /+ + . . # /. . # . # /"],
		['cu2x2', "pzprv3/nurimisaki/5/5/4 . . . . /. . 2 . . /. . . . - /. . . . . /. . . - . /. # # # # /+ # . . # /+ . # . . /+ + . . # /# # # . # /"],
		[null, "pzprv3/nurimisaki/5/5/4 . . . . /. . 2 . . /. . . . - /. . . . . /. . . - . /. # # # # /+ # . . # /+ # # . . /+ + . . # /# # # . # /"]
	],
	inputs: [
		/* 回答入力はnurikabeと同じなので省略 */
		/* 問題入力はkurottoと同じなので省略 */
	]
});
