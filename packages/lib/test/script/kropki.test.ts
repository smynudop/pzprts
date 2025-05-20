/* test_kropki.js */
import { testPuzzle } from "./base";
import { Kropki } from "../../src/variety";
testPuzzle(new Kropki(), {
	url: '4/4/aa7fioco',
	failcheck: [
		['nmDupRow', "pzprv3/kropki/4/4/1 0 1 /1 0 1 /0 2 1 /1 2 0 /2 0 0 2 /2 0 1 1 /0 2 2 0 /4 4 . . /. . . . /. . . . /. . . . /"],
		['nmSubNe1', "pzprv3/kropki/4/4/1 0 1 /1 0 1 /0 2 1 /1 2 0 /2 0 0 2 /2 0 1 1 /0 2 2 0 /4 1 . . /. . . . /. . . . /. . . . /"],
		['nmSubEq1', "pzprv3/kropki/4/4/1 0 1 /1 0 1 /0 2 1 /1 2 0 /2 0 0 2 /2 0 1 1 /0 2 2 0 /1 . . . /2 . . . /4 . . . /3 . . . /"],
		['nmDivNe2', "pzprv3/kropki/4/4/1 0 1 /1 0 1 /0 2 1 /1 2 0 /2 0 0 2 /2 0 1 1 /0 2 2 0 /4 . . . /2 . . . /1 . . . /3 4 1 . /"],
		['nmDivEq2', "pzprv3/kropki/4/4/1 0 1 /1 0 1 /0 2 1 /1 2 0 /2 0 0 2 /2 0 1 1 /0 2 2 0 /4 3 . . /2 1 . . /1 . . . /3 .[2,4,,] 4 2 /"],
		['ceNoNum', "pzprv3/kropki/4/4/1 0 1 /1 0 1 /0 2 1 /1 2 0 /2 0 0 2 /2 0 1 1 /0 2 2 0 /4 3 1 2 /2 1 . . /1 . . . /3 .[2,4,,] . . /"],
		[null, "pzprv3/kropki/4/4/1 0 1 /1 0 1 /0 2 1 /1 2 0 /2 0 0 2 /2 0 1 1 /0 2 2 0 /4 3 1 2 /2 1 3 4 /1 4 2 3 /3 2 4 1 /"]
	],
	inputs: [
	]
});
