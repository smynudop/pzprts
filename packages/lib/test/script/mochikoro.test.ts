/* test_mochikoro.js */
import { testPuzzle } from "./base";
import { Mochikoro } from "../../src/variety";
testPuzzle(new Mochikoro(), {
	url: '5/5/4p2n1i1',
	failcheck: [
		['brNoShade', "pzprv3/mochikoro/5/5"],
		['cs2x2', "pzprv3/mochikoro/5/5/4 . . . . /. . . . . /. 2 . . . /. . . . . /1 . . . 1 /. . . # # /. . . # # /. . . . . /. . . . . /. . . . . /"],
		['csDivide8', "pzprv3/mochikoro/5/5/4 . . . . /. . . . . /. 2 . . . /. . . . . /1 . . . 1 /+ + + + # /# # # # # /. . . . . /. . . . . /. . . . . /"],
		['cuNotRect', "pzprv3/mochikoro/5/5/4 . . . . /. . . . . /. 2 . . . /. . . . . /1 . . . 1 /+ + + + # /# # # # + /. . # + + /. . . # # /. . . . . /"],
		['bkNumGe2', "pzprv3/mochikoro/5/5/4 . . . . /. . . . . /. 2 . . . /. . . . . /1 . . . 1 /+ + # + . /. . # . + /. . # . + /# # . # # /. . # . . /"],
		['bkSizeNe', "pzprv3/mochikoro/5/5/4 . . . . /. . . . . /. 2 . . . /. . . . . /1 . . . 1 /+ + + + # /# # # # + /# + + # + /+ # # + # /+ # + # + /"],
		[null, "pzprv3/mochikoro/5/5/4 . . . . /. . . . . /. 2 . . . /. . . . . /1 . . . 1 /+ + + + # /# # # # + /# + # + # /# + # + # /+ # + # + /"]
	],
	inputs: [] /* nurikabeと同じなので省略 */
});
