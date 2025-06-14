/* test_ichimagax.js */
import { Ichimagax } from "../../src/variety";
import { testPuzzle } from "./base";
testPuzzle(new Ichimagax(), {
	url: '5/5/g8bgedgbeg8b',
	failcheck: [
		['brNoLine', "pzprv3/ichimagax/5/5/cross"],
		['lnBranch', "pzprv3/ichimagax/5/5/cross/. 3 . 1 . /. . 4 . . /3 . . . 1 /. . 4 . . /. 3 . 1 . /1 1 0 0 /1 1 1 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /1 1 1 0 0 /1 0 1 0 0 /0 0 0 0 0 /0 0 0 0 0 /"],
		['lcCurveGt1', "pzprv3/ichimagax/5/5/cross/. 3 . 1 . /. . 4 . . /3 . . . 1 /. . 4 . . /. 3 . 1 . /1 1 0 0 /0 1 1 0 /1 0 0 0 /0 1 0 0 /0 0 0 0 /1 1 1 0 0 /1 0 1 0 0 /0 1 0 0 0 /0 0 0 0 0 /"],
		['lcDivided', "pzprv3/ichimagax/5/5/cross/. 3 . 1 . /. . 4 . . /3 . . . 1 /. . 4 . . /. 3 . 1 . /1 1 0 0 /0 1 1 0 /1 0 0 0 /0 0 0 0 /1 1 0 0 /1 1 1 0 0 /1 0 1 0 0 /1 0 0 0 0 /0 1 0 0 0 /"],
		['lcDeadEnd', "pzprv3/ichimagax/5/5/cross/. 3 . 1 . /. . 4 . . /3 . . . 1 /. . 4 . . /. 3 . 1 . /1 1 0 0 /0 1 1 0 /0 0 0 0 /0 1 1 0 /1 1 0 0 /1 1 1 0 0 /1 0 1 0 0 /1 0 1 0 0 /1 1 1 1 0 /"],
		['nmLineNe', "pzprv3/ichimagax/5/5/cross/. 3 . 1 . /. . 4 . . /3 . . . 1 /. . 4 . . /. 3 . 1 . /1 1 0 0 /0 1 1 0 /0 0 0 0 /0 1 1 0 /1 1 0 0 /1 1 1 1 0 /1 0 1 0 0 /1 0 1 0 0 /1 1 1 1 0 /"],
		['nmNoLine', "pzprv3/ichimagax/5/5/cross/. 3 . 1 . /. . 4 . . /3 . . . 1 /. . 4 . - /. 3 . 1 . /1 1 0 0 /0 1 1 0 /1 1 1 1 /0 1 1 0 /1 1 0 0 /1 1 1 1 0 /1 0 1 0 0 /1 0 1 0 0 /1 1 1 1 0 /"],
		[null, "pzprv3/ichimagax/5/5/cross/. 3 . 1 . /. . 4 . . /3 . . . 1 /. . 4 . . /. 3 . 1 . /1 1 0 -1 /-1 1 1 -1 /1 1 1 1 /-1 1 1 0 /1 1 0 0 /1 1 1 1 -1 /1 -1 1 0 -1 /1 -1 1 0 0 /1 1 1 1 0 /"]
	],
	inputs: [
		/* 回答入力はfireflyと同じなので省略 */
		/* 問題入力はichimagaと同じなので省略 */
	]
});
