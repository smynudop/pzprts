/* test_icelom.js */
import { Icelom } from "../../src/variety";
import { testPuzzle } from "./base";

testPuzzle(new Icelom(), {
	url: 'a/6/6/9e50an10i3zl2g1i/15/4',
	failcheck: [
		['lnBranch', "pzprv3/icelom/6/6/75/64/allwhite/. i . 3 i . /i i i . . . /i . i . . . /. . . i . i /. i . i i i /2 . 1 . i . /0 1 1 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 0 /1 1 0 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 /1 0 0 0 0 0 /1 0 0 0 0 0 /1 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /"],
		['lnCrossExIce', "pzprv3/icelom/6/6/75/64/allwhite/. i . 3 i . /i i i . . . /i . i . . . /. . . i . i /. i . i i i /2 . 1 . i . /0 1 1 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 0 /1 1 0 0 0 0 0 /0 0 0 0 0 0 0 /0 1 0 0 0 0 0 /0 0 0 0 0 0 /1 0 0 0 0 0 /1 0 0 0 0 0 /1 0 0 0 0 0 /1 0 0 0 0 0 /1 0 0 0 0 0 /0 0 0 0 0 0 /"],
		['lnCurveOnIce', "pzprv3/icelom/6/6/75/64/allwhite/. i . 3 i . /i i i . . . /i . i . . . /. . . i . i /. i . i i i /2 . 1 . i . /0 0 0 0 1 1 0 /0 1 1 1 0 0 0 /0 0 0 0 0 0 0 /1 0 0 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 1 0 0 /1 0 0 0 0 0 /1 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /"],
		['stNoLine', "pzprv3/icelom/6/6/75/64/allwhite/. i . 3 i . /i i i . . . /i . i . . . /. . . i . i /. i . i i i /2 . 1 . i . /0 1 1 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 /1 0 0 0 0 0 /1 0 0 0 0 0 /1 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /"],
		['lrDeadEnd', "pzprv3/icelom/6/6/75/64/allwhite/. i . 3 i . /i i i . . . /i . i . . . /. . . i . i /. i . i i i /2 . 1 . i . /0 1 1 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 0 /1 0 0 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 /1 0 0 0 0 0 /1 0 0 0 0 0 /1 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /"],
		['lrOffField', "pzprv3/icelom/6/6/75/64/allwhite/. i . 3 i . /i i i . . . /i . i . . . /. . . i . i /. i . i i i /2 . 1 . i . /0 1 1 -1 1 1 0 /0 0 0 0 0 0 0 /0 0 0 0 0 1 1 /1 0 0 1 1 0 0 /0 1 1 0 0 0 0 /0 1 0 0 0 0 0 /0 0 0 0 1 0 /1 0 1 1 1 1 /1 0 1 0 0 0 /1 0 1 0 1 0 /0 0 0 0 0 0 /1 0 0 0 0 0 /0 0 0 0 0 0 /"],
		['lrOrder', "pzprv3/icelom/6/6/75/64/allwhite/. i . 3 i . /i i i . . . /i . i . . . /. . . i . i /. i . i i i /2 . 1 . i . /0 1 1 -1 1 1 0 /0 0 0 0 0 0 0 /0 0 1 1 1 0 0 /1 0 0 1 1 0 0 /0 1 1 0 0 0 0 /0 1 0 0 0 0 0 /0 0 0 0 1 0 /1 0 1 1 1 1 /1 0 1 0 0 0 /1 1 1 0 1 0 /0 1 0 0 0 0 /1 1 0 0 0 0 /0 0 0 0 0 0 /"],
		['lnPlLoop', "pzprv3/icelom/6/6/75/64/allwhite/. i . 3 i . /i i i . . . /i . i . . . /. . . i . i /. i . i i i /2 . 1 . i . /0 1 1 -1 0 0 0 /0 0 0 0 1 0 0 /0 0 1 1 -1 1 0 /1 0 0 1 1 0 0 /0 1 1 0 0 0 0 /0 1 -1 1 1 1 0 /0 0 0 0 1 0 /1 0 1 0 1 1 /1 0 1 1 -1 0 /1 1 1 0 1 1 /0 1 0 0 0 1 /1 1 1 0 0 1 /0 0 0 0 0 0 /"],
		['cuNoLine', "pzprv3/icelom/6/6/75/64/allwhite/. i . 3 i . /i i i . . . /i . i . . . /. . . i . i /. i . i i i /2 . 1 . i . /0 1 1 -1 0 0 0 /0 0 0 0 1 0 0 /0 0 1 1 -1 1 0 /1 0 0 1 1 0 0 /0 1 1 0 0 0 0 /0 1 -1 1 1 1 0 /0 0 0 0 1 0 /1 0 1 0 1 0 /1 0 1 1 -1 0 /1 1 1 0 1 1 /0 1 0 0 0 1 /1 1 1 0 0 1 /0 0 0 0 0 0 /"],
		['nmUnpass', "pzprv3/icelom/6/6/75/64/allwhite/. i . 3 i . /i i i . . . /i . i . . . /. . . i . i /. i . i4 i i /2 . 1 . i . /0 1 1 -1 1 1 0 /0 0 0 0 0 1 0 /0 0 1 1 -1 1 0 /1 0 0 1 1 0 0 /0 1 1 0 0 0 0 /0 1 -1 1 1 1 0 /0 0 0 0 1 0 /1 0 1 1 1 1 /1 0 1 1 -1 0 /1 1 1 0 1 1 /0 1 0 0 0 1 /1 1 1 0 0 1 /0 0 0 0 0 0 /"],
		[null, "pzprv3/icelom/6/6/75/64/allwhite/. i . 3 i . /i i i . . . /i . i . . . /. . . i . i /. i . i i i /2 . 1 . i . /0 1 1 -1 1 1 0 /0 0 0 0 0 1 0 /0 0 1 1 -1 1 0 /1 0 0 1 1 0 0 /0 1 1 0 0 0 0 /0 1 -1 1 1 1 0 /0 0 0 0 1 0 /1 0 1 1 1 1 /1 0 1 1 -1 0 /1 1 1 0 1 1 /0 1 0 0 0 1 /1 1 1 0 0 1 /0 0 0 0 0 0 /"]
	],
	inputs: [
		/* 回答入力はicebarnと同じ */
		/* 問題入力テスト */
		{ input: ["newboard,5,2", "editmode"] },
		{ input: ["mouse,right, 1,1", "mouse,right, 3,3", "mouse,right, 5,1", "mouse,right, 7,3"] },
		{
			input: ["cursor,1,1", "key,-", "key,right", "key,0", "key,right", "key,1", "key,right", "key,2", "key,right", "key,1,0"],
			result: "pzprv3/icelom/2/5/13/15/allwhite/i? . i1 2 10 /. i . i . /0 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /"
		},
		{
			input: ["cursor,1,1", "key,-", "key,right", "key,-", "key,right", "key,-", "key,-"],
			result: "pzprv3/icelom/2/5/13/15/allwhite/i ? i 2 10 /. i . i . /0 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /"
		},
		{ input: ["newboard,6,2", "editmode"] },
		{ input: ["mouse,right, 1,1", "mouse,right, 3,3", "mouse,right, 5,1", "mouse,right, 7,3"] },
		{
			input: ["cursor,0,0", "mouse,leftx2, 1,1", "mouse,leftx3, 3,1", "mouse,leftx4, 5,1", "mouse,leftx5, 7,1", "mouse,leftx6, 9,1", "mouse,rightx2, 11,1"],
			result: "pzprv3/icelom/2/6/16/18/allwhite/i? 1 i2 3 4 . /. i . i . . /0 0 0 0 0 0 0 /0 0 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /"
		}
	]
});
