/* canal.js */
import { testPuzzle } from "./base"
import { Cbanana } from "../../src/variety/cbanana";
testPuzzle(new Cbanana(), {
	url: "5/5/g13t6h6i1",
	failcheck: [
		[
			"csNotRect",
			"pzprv3/cbanana/5/5/. 1 3 . . /. . . . . /. . . . . /. . 6 . . /6 . . . 1 /+ # + + # /+ + # + # /# + + # + /# # # + + /# # + + # /"
		],
		[
			"cuRect",
			"pzprv3/cbanana/5/5/. 1 3 . . /. . . . . /. . . . . /. . 6 . . /6 . . . 1 /+ # + + + /+ + # # # /+ + + + + /# # # + + /# # # + # /"
		],
		[
			"bkSizeNe",
			"pzprv3/cbanana/5/5/. 1 3 . . /. . . . . /. . . . . /. . 6 . . /6 . . . 1 /# # + + # /+ + # + # /+ # + # + /+ # + + + /+ + # + # /"
		],
		[
			"bkSizeNe",
			"pzprv3/cbanana/5/5/. 1 3 . . /. . . . . /. . . . . /. . 6 . . /6 . . . 1 /+ # + + + /+ + # + # /+ + + # + /# # # + + /# # # + # /"
		],
		[
			null,
			"pzprv3/cbanana/5/5/. 1 3 . . /. . . . . /. . . . . /. . 6 . . /6 . . . 1 /+ # + + # /+ + # + # /+ + + # + /# # # + + /# # # + # /"
		]
	],
	inputs: []
});
