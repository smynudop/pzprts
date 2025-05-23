/* test_nuribou.js */
import { testPuzzle } from "./base";
import { Nuribou } from "../../src/variety";

testPuzzle(new Nuribou(), {
	url: '5/5/1g2l1g4r7',
	failcheck: [
		['csWidthGt1', "pzprv3/nuribou/5/5/1 . 2 . . /. . . . 1 /. 4 . . . /. . . . . /. . . . 7 /. . . . . /# # # . . /. . # . . /. . # . . /. . . . . /"],
		['csCornerSize', "pzprv3/nuribou/5/5/1 . 2 . . /. . . . 1 /. 4 . . . /. . . . . /. . . . 7 /+ # + + # /# + # # + /. . + + # /. . . . . /. . . . . /"],
		['bkNoNum', "pzprv3/nuribou/5/5/1 . 2 . . /. . . . 1 /. 4 . . . /. . . . . /. . . . 7 /+ # + + # /# + # # + /# + + + # /. # . . . /. . # # . /"],
		['bkNumGe2', "pzprv3/nuribou/5/5/1 . 2 . . /. . . . 1 /. 4 . . . /. . . . . /. . . . 7 /+ # + + # /# + # # + /# + + + # /. . . . . /. . . . . /"],
		['bkSizeNe', "pzprv3/nuribou/5/5/1 . 2 . . /. . . . 1 /. 4 . . . /. . . . . /. . . . 7 /+ # + # . /+ # + # + /# + # . # /. . # . . /. . # . . /"],
		[null, "pzprv3/nuribou/5/5/1 . 2 . . /. . . . 1 /. 4 . . . /. . . . . /. . . . 7 /+ # + + # /# + # # + /# + + + # /+ # # # . /. . . . . /"]
	],
	inputs: [] /* nurikabeと同じなので省略 */
});
