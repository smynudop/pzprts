/* test_bonsan.js */
import { testPuzzle } from "./base"
import { Bonsan } from "../../src/variety";
testPuzzle(new Bonsan(), {
	url: 'c/5/5/i.h.i2i.i3h2i',
	failcheck: [
		['brNoLine', "pzprv3/bonsan/5/5"],
		['lnBranch', "pzprv3/bonsan/5/5/. . . - . /. - . . . /2 . . . - /. . . 3 . /. 2 . . . /0 0 0 0 0 /0 0 0 0 0 /1 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /1 1 1 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 1 0 0 /0 0 0 0 0 /"],
		['lnCross', "pzprv3/bonsan/5/5/. . . - . /. - . . . /2 . . . - /. . . 3 . /. 2 . . . /0 0 0 0 0 /0 0 0 0 0 /1 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /1 1 1 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 1 0 0 /0 0 1 0 0 /"],
		['nmConnected', "pzprv3/bonsan/5/5/. . . - . /. - . . . /2 . . . - /. . . 3 . /. 2 . . . /0 0 0 0 0 /0 0 0 0 0 /1 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 /0 0 0 0 /1 1 1 1 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /"],
		['laOnNum', "pzprv3/bonsan/5/5/. . . - . /. - . . . /2 . . . - /. . . 3 . /. 2 . . . /0 0 0 0 0 /0 0 0 0 0 /1 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 1 0 0 0 /0 1 0 0 0 /0 1 0 0 0 /0 0 0 0 0 /"],
		['laCurve', "pzprv3/bonsan/5/5/. . . - . /. - . . . /2 . . . - /. . . 3 . /. 2 . . . /0 0 0 0 0 /0 1 1 1 2 /1 0 0 0 0 /2 1 1 1 0 /0 0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 /0 0 0 0 /1 1 0 0 /1 1 1 0 /0 0 0 0 /0 0 0 0 0 /0 0 1 0 0 /0 0 0 0 0 /0 0 0 0 0 /"],
		['laLenNe', "pzprv3/bonsan/5/5/. . . - . /. - . . . /2 . . . - /. . . 3 . /. 2 . . . /0 0 0 0 0 /0 1 1 1 2 /1 0 0 0 0 /2 1 1 1 0 /0 0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 /0 0 0 0 /1 1 1 0 /1 1 1 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /"],
		['brObjNotSym', "pzprv3/bonsan/5/5/. . . - . /. - . . . /2 . . . - /. . . 3 . /. 2 . . . /0 0 0 0 0 /0 1 1 1 2 /1 0 0 0 0 /2 1 1 1 0 /0 0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /1 1 1 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /"],
		['nmNoMove', "pzprv3/bonsan/5/5/. . . - . /. - . . . /2 . . . - /. . . 3 . /. 2 . . . /2 2 0 0 0 /0 1 1 1 2 /0 0 0 0 1 /2 1 1 1 0 /0 1 1 2 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 1 1 0 /0 1 1 1 /0 0 0 0 /1 1 1 0 /0 1 1 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /"],
		['laIsolate', "pzprv3/bonsan/5/5/. . . - . /. - . . . /2 . . . - /. . . 3 . /. 2 . . . /2 2 0 0 0 /0 1 1 1 2 /0 0 0 0 1 /2 1 1 1 0 /0 1 1 2 2 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 1 1 0 /0 1 1 1 /0 1 1 0 /1 1 1 0 /0 1 1 0 /1 0 0 0 0 /1 0 0 0 0 /0 0 0 0 1 /0 0 0 0 1 /"],
		[null, "pzprv3/bonsan/5/5/. . . - . /. - . . . /2 . . . - /. . . 3 . /. 2 . . . /2 2 0 0 0 /1 1 1 1 2 /1 0 0 0 1 /2 1 1 1 0 /0 1 1 2 2 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 1 1 0 /0 1 1 1 /0 0 0 0 /1 1 1 0 /0 1 1 0 /1 0 0 0 0 /1 0 0 0 0 /0 0 0 0 1 /0 0 0 0 1 /"]
	],
	inputs: [
		/* 問題入力はhashikakeあたりと同じなので省略 */
		/* 回答入力はkaeroと同じなので省略 */
	]
});
