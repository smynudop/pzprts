/* test_renban.js */
import { testPuzzle } from "./base";
import { Renban } from "../../src/variety";
testPuzzle(new Renban(), {
	url: '4/4/vmok3g1p5g2h',
	failcheck: [
		['bkDupNum', "pzprv3/renban/4/4/1 1 1 /1 1 1 /0 1 1 /0 1 1 /1 0 1 0 /0 0 0 0 /1 1 1 0 /1 . . . /. . . . /. . . 5 /. 2 . . /. 3 . . /2 . . . /. 3 . . /. . . . /"],
		['ceNoNum', "pzprv3/renban/4/4/1 1 1 /1 1 1 /0 1 1 /0 1 1 /1 0 1 0 /0 0 0 0 /1 1 1 0 /1 . . . /. . . . /. . . 5 /. 2 . . /. 3 . . /2 . . . /. 5 . . /4 . . . /"],
		['cbDiffLenNe', "pzprv3/renban/4/4/1 1 1 /1 1 1 /0 1 1 /0 1 1 /1 0 1 0 /0 0 0 0 /1 1 1 0 /1 . . . /. . . . /. . . 5 /. 2 . . /. 3 7 . /2 4 8 . /6 5 9 . /3 . 7 . /"],
		[null, "pzprv3/renban/4/4/1 1 1 /1 1 1 /0 1 1 /0 1 1 /1 0 1 0 /0 0 0 0 /1 1 1 0 /1 . . . /. . . . /. . . 5 /. 2 . . /. 3 7 3 /2 4 8 4 /6 5 9 . /3 . 6 2 /"]
	],
	inputs: [
		/* 問題入力, 回答入力はripple, bosanowaとだいたい同じなので省略 */
	]
});
