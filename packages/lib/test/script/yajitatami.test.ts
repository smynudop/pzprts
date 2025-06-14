/* test_yajitatami.js */
import { testPuzzle } from "./base";
import { Yajitatami } from "../../src/variety";
testPuzzle(new Yajitatami(), {
	url: '5/5/b3233a2222p1233',
	failcheck: [
		['bdCross', "pzprv3/yajitatami/5/5/. . 3,2 3,3 . /2,2 2,2 . . . /. . . . . /. . . . . /. . . 1,2 3,3 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /1 1 0 0 /1 1 0 0 /1 0 0 0 /0 0 0 0 /0 0 0 0 /-1 -1 0 0 0 /1 1 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /"],
		['anNoAdjBd', "pzprv3/yajitatami/5/5/. . 3,2 3,3 . /2,2 2,2 . . . /. . . . . /. . . . . /. . . 1,2 3,3 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /1 1 0 0 /1 1 0 0 /-1 0 0 0 /0 0 0 0 /0 0 0 0 /-1 -1 0 0 0 /1 1 0 0 0 /1 1 0 0 0 /0 0 0 0 0 /"],
		['bkSize1', "pzprv3/yajitatami/5/5/. . 3,2 3,3 . /2,2 2,2 . . . /. . . . . /. . . . . /. . . 1,2 3,3 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /1 1 1 0 /1 1 1 0 /-1 0 0 0 /1 1 1 0 /1 1 0 1 /-1 -1 -1 0 0 /1 1 1 0 0 /1 1 1 0 0 /-1 0 1 1 0 /"],
		['anTatamiNe', "pzprv3/yajitatami/5/5/. . 3,2 3,3 . /2,2 2,2 . . . /. . . . . /. . . . . /. . . 1,2 3,3 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /1 1 1 0 /1 1 1 0 /-1 0 0 1 /1 1 0 1 /1 1 0 1 /-1 -1 -1 0 0 /1 1 1 0 1 /1 1 0 0 -1 /-1 0 1 1 -1 /"],
		['bkSizeNe', "pzprv3/yajitatami/5/5/. . 3,2 3,3 . /2,2 2,2 . . . /. . . . . /. . . . . /. . . 1,2 3,3 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /1 1 1 0 /1 1 1 0 /-1 0 0 1 /1 1 0 1 /1 1 0 1 /-1 -1 -1 1 1 /1 1 1 0 1 /1 1 0 0 -1 /-1 0 1 1 -1 /"],
		['bkWidthGt1', "pzprv3/yajitatami/5/5/. . 3,2 3,3 . /2,2 2,2 . . . /. . . . . /. . . . . /. . . 1,2 3,3 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /1 1 1 1 /1 1 1 1 /-1 0 1 1 /1 1 0 1 /1 1 0 1 /-1 -1 -1 -1 0 /1 1 1 -1 1 /1 1 0 1 -1 /-1 0 1 1 -1 /"],
		[null, "pzprv3/yajitatami/5/5/. . 3,2 3,3 . /2,2 2,2 . . . /. . . . . /. . . . . /. . . 1,2 3,3 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /1 1 1 1 /1 1 1 1 /-1 0 1 1 /1 1 0 1 /1 1 0 1 /-1 -1 -1 -1 0 /1 1 1 -1 1 /1 1 1 1 -1 /-1 0 1 1 -1 /"]
	],
	inputs: [
		/* 問題入力はyajilin, heyawakeと同じなので省略 */
		/* 回答入力はshikakuと同じなので省略 */
	]
});
