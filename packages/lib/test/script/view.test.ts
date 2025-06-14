/* test_view.js */
import { testPuzzle } from "./base";
import { View } from "../../src/variety";
testPuzzle(new View(), {
	url: '5/5/m401g3g2g101m',
	failcheck: [
		['brNoValidNum', "pzprv3/view/5/5"],
		['nmAdjacent', "pzprv3/view/5/5/. . . . . /. . 4 0 1 /. 3 . 2 . /1 0 1 . . /. . . . . /- - - . . /- - . . . /. . - . . /. . . . . /. 0 . . . /"],
		['nmSumViewNe', "pzprv3/view/5/5/. . . . . /. . 4 0 1 /. 3 . 2 . /1 0 1 . . /. . . . . /- - - . + /- - . . . /+ . - . - /. . . + + /- + + . . /"],
		['nmDivide', "pzprv3/view/5/5/. . . . . /. . 4 0 1 /. 3 . 4 . /1 0 2 . . /. . . . . /- - - + + /- - . . . /+ . - . - /. . . . + /- + + . . /"],
		['ceSuspend', "pzprv3/view/5/5/. . . . . /. . 4 0 1 /. 3 . 2 . /1 0 1 . . /. . . . . /- - - + + /- - . . . /2 . - . - /. . . 0 + /- + + + . /"],
		[null, "pzprv3/view/5/5/. . . . . /. . 4 0 1 /. 3 . 2 . /1 0 1 . . /. . . . . /- - - 3 0 /- - . . . /2 . - . - /. . . 0 2 /- 1 0 1 . /"]
	],
	inputs: [
		/* 問題入力, 回答入力はsukoroとほぼ同じなので省略 */
	]
});
