/* test_ringring.js */
import { testPuzzle } from "./base";
import { Ringring } from "../../src/variety";
testPuzzle(new Ringring(), {

	url: '5/5/02084',
	failcheck: [
		['lnOnShade', "pzprv3/ringring/5/5/1 0 0 1 1 /0 0 0 0 0 /0 1 0 1 0 /0 0 0 1 0 /0 0 0 0 0 /0 1 0 0 /1 1 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 1 0 0 0 /1 1 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /"],
		['brNoLine', "pzprv3/ringring/5/5/1 0 0 1 1 /0 0 0 0 0 /0 0 0 1 0 /0 0 0 1 0 /0 0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /"],
		['lnBranch', "pzprv3/ringring/5/5/1 0 0 1 1 /0 0 0 0 0 /0 0 0 1 0 /0 0 0 1 0 /0 0 0 0 0 /0 1 0 0 /1 0 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 1 0 0 0 /1 1 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /"],
		['lnDeadEnd', "pzprv3/ringring/5/5/1 0 0 1 1 /0 0 0 0 0 /0 0 0 1 0 /0 0 0 1 0 /0 0 0 0 0 /0 1 0 0 /1 1 0 0 /0 0 0 0 /0 0 0 0 /0 0 0 0 /0 1 0 0 0 /1 1 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /"],
		['lnNotRect', "pzprv3/ringring/5/5/1 0 0 1 1 /0 0 0 0 0 /0 0 0 1 0 /0 0 0 1 0 /0 0 0 0 0 /0 1 0 0 /1 0 1 1 /0 0 0 0 /0 0 0 0 /1 1 1 1 /0 1 1 0 0 /1 0 0 0 1 /1 0 0 0 1 /1 0 -1 0 1 /"],
		['cuNoLine', "pzprv3/ringring/5/5/1 0 0 1 1 /0 0 0 0 0 /0 0 0 1 0 /0 0 0 1 0 /0 0 0 0 0 /0 1 0 0 /1 1 1 1 /0 1 0 0 /0 0 0 0 /1 1 1 1 /0 1 1 0 0 /1 1 1 0 1 /1 0 0 0 1 /1 0 -1 0 1 /"],
		[null, "pzprv3/ringring/5/5/1 0 0 1 1 /0 0 0 0 0 /0 0 0 1 0 /0 0 0 1 0 /0 0 0 0 0 /0 1 0 0 /1 1 1 1 /0 0 0 0 /0 1 0 0 /1 1 1 1 /0 1 1 0 0 /1 1 1 0 1 /1 1 1 0 1 /1 0 -1 0 1 /"]
	],
	inputs: [
		/* 問題入力テスト */
		{ input: ["newboard,3,3", "editmode"] },
		{
			input: ["mouse,left, 1,1", "mouse,leftx2, 3,1", "mouse,right, 1,3", "mouse,rightx2, 3,3"],
			result: "pzprv3/ringring/3/3/1 0 0 /1 0 0 /0 0 0 /0 0 /0 0 /0 0 /0 0 0 /0 0 0 /"
		},
		/* 回答入力テスト */
		{
			input: ["newboard,3,3", "editmode", "mouse,left, 3,3", "playmode", "mouse,left, 1,3, 5,3, 5,5, 3,5, 3,1"],
			result: "pzprv3/ringring/3/3/0 0 0 /0 1 0 /0 0 0 /0 0 /0 0 /0 1 /0 0 0 /0 0 1 /"
		}
	]
});
