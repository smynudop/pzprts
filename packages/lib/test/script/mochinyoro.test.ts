/* test_mochinyoro.js */
import { testPuzzle } from "./base";
import { Mochinyoro } from "../../src/variety";

testPuzzle(new Mochinyoro(), {
	url: '5/5/l4g2m2m1',
	failcheck: [
		['brNoShade', "pzprv3/mochinyoro/5/5"],
		['cs2x2', "pzprv3/mochinyoro/5/5/. . . . . /. 4 . 2 . /. . . . . /. 2 . . . /. . . . 1 /. . . . . /. . . . . /. . . . . /. . # # . /. . # # . /"],
		['csDivide8', "pzprv3/mochinyoro/5/5/. . . . . /. 4 . 2 . /. . . . . /. 2 . . . /. . . . 1 /. . # . . /. . # . . /# # # . . /. . . . . /. . . . . /"],
		['cuNotRect', "pzprv3/mochinyoro/5/5/. . . . . /. 4 . 2 . /. . . . . /. 2 . . . /. . . . 1 /+ + # . . /+ + # . . /# # + . . /. . . . . /. . . . . /"],
		['bkNumGe2', "pzprv3/mochinyoro/5/5/. . . . . /. 4 . 2 . /. . . . . /. 2 . . . /. . . . 1 /+ + # . # /+ + # . # /. . # # . /. . # . # /# # . # . /"],
		['bkSizeNe', "pzprv3/mochinyoro/5/5/. . . . . /. 4 . 2 . /. . . . . /. 2 . . . /. . . . 1 /+ + # . . /+ + # + . /# # + # # /# + # + # /# # # # + /"],
		['csRect', "pzprv3/mochinyoro/5/5/. . . . . /. 4 . 2 . /. . . . . /. 2 . . . /. . . . 1 /+ + # + # /+ + # + # /# # + # # /# + # + # /# + # # + /"],
		[null, "pzprv3/mochinyoro/5/5/. . . . . /. 4 . 2 . /. . . . . /. 2 . . . /. . . . 1 /+ + # # # /+ + # + + /# # + # # /# + # + # /# + # # + /"]
	],
	inputs: [] /* nurikabeと同じなので省略 */
});
