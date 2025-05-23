/* test_fivecells.js */
import { testPuzzle } from "./base";
import { Fivecells } from "../../src/variety";

testPuzzle(new Fivecells(), {
	url: '6/6/72b1i0f2b1i3a',
	failcheck: [
		['bkSizeLt', "pzprv3/fivecells/6/6/* 2 . . 1 . /. . . . . . /. . 0 . . . /. . . 2 . . /1 . . . . . /. . . . 3 . /0 0 0 1 0 0 0 /0 0 1 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 /0 0 1 0 0 0 /1 1 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /"],
		['nmBorderNe', "pzprv3/fivecells/6/6/* 2 . . 1 . /. . . . . . /. . 0 . . . /. . . 2 . . /1 . . . . . /. . . . 3 . /0 0 -1 1 -1 -1 0 /0 0 1 1 0 0 0 /0 1 -1 -1 1 0 0 /0 0 1 1 -1 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 /0 -1 1 0 -1 0 /0 1 -1 1 0 0 /0 1 -1 1 0 0 /0 0 1 2 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /"],
		['bdDeadEnd', "pzprv3/fivecells/6/6/* 2 . . 1 . /. . . . . . /. . 0 . . . /. . . 2 . . /1 . . . . . /. . . . 3 . /0 0 -1 1 -1 -1 0 /0 0 1 1 -1 1 0 /0 1 -1 -1 1 0 0 /0 1 1 1 -1 0 0 /0 -1 1 0 0 0 0 /0 1 0 0 0 1 0 /0 0 0 0 0 0 /0 -1 1 -1 -1 1 /0 1 -1 1 1 0 /1 1 -1 1 0 0 /-1 -1 1 -1 0 0 /-1 1 0 0 1 0 /0 0 0 0 0 0 /"],
		['bkSizeGt', "pzprv3/fivecells/6/6/* 2 . . 1 . /. . . . . . /. . 0 . . . /. . . 2 . . /1 . . . . . /. . . . 3 . /0 0 -1 1 -1 -1 0 /0 0 1 1 -1 1 0 /0 1 -1 -1 1 0 0 /0 0 1 1 -1 0 0 /0 -1 1 1 0 0 0 /0 1 0 0 0 1 0 /0 0 0 0 0 0 /0 -1 1 -1 -1 1 /0 1 -1 1 1 0 /1 1 -1 1 0 0 /-1 -1 1 -1 0 0 /-1 1 0 1 1 0 /0 0 0 0 0 0 /"],
		[null, "pzprv3/fivecells/6/6/* 2 . . 1 . /. . . . . . /. . 0 . . . /. . . 2 . . /1 . . . . . /. . . . 3 . /0 0 -1 1 -1 -1 0 /0 0 1 1 -1 1 0 /0 1 -1 -1 1 1 0 /0 0 1 1 -1 1 0 /0 -1 1 1 0 1 0 /0 1 0 0 0 1 0 /0 0 0 0 0 0 /0 -1 1 -1 -1 1 /0 1 -1 1 1 -1 /1 1 -1 1 0 -1 /-1 -1 1 -1 0 -1 /-1 1 0 1 1 0 /0 0 0 0 0 0 /"]
	],
	inputs: [
		/* 問題入力テスト */
		{ input: ["newboard,5,1", "editmode"] },
		{
			input: ["cursor,1,1", "key,w", "key,right,w", "key,left,w"],
			result: "pzprv3/fivecells/1/5/. * . . . /0 0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /"
		}
		/* その他の問題入力はnurikabeと同じなので省略 */
		/* 回答入力はsashiganeと同じなので省略 */
	]
});
