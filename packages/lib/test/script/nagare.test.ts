/* test_nagare.js */
import { testPuzzle } from "./base";
import { Nagare } from "../../src/variety";
testPuzzle(new Nagare(), {
	url: '6/6/9e5c8f21g69b5e',
	failcheck: [
		["brNoLine", "pzprv3/nagare/6/6/R . . . . . /N . . . L . /. . . . . d /u . . . . . /. . U R . . /N . . . . . /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /"],
		["arAgainstWind", "pzprv3/nagare/6/6/R . . . . . /D . . . L . /. . . . . d /u . . . . . /. . U R . . /N . . . . . /0 0 0 0 0 /0 0 0 0 0 /1 0 0 0 0 /0 0 0 0 0 /1 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /1 0 0 0 0 0 /1 0 0 0 0 0 /0 0 0 0 0 0 /"],
		["lnOnShade", "pzprv3/nagare/6/6/R . . . . . /N . . . L . /. N . . . d /u . . . . . /. . U R . . /N . . . . . /0 0 0 0 0 /0 0 0 0 0 /1 0 0 0 0 /0 0 0 0 0 /1 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /1 0 0 0 0 0 /1 0 0 0 0 0 /0 0 0 0 0 0 /"],
		["lnCross", "pzprv3/nagare/6/6/R . . . . . /N . . . L . /. . . . . d /u . . . . . /. . U R . . /N . . . . . /0 0 0 0 0 /0 0 0 0 0 /1 1 1 0 0 /0 0 0 0 0 /1 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 0 /0 0 1 0 0 0 /1 0 1 0 0 0 /1 0 0 0 0 0 /0 0 0 0 0 0 /"],
		["lnBranch", "pzprv3/nagare/6/6/R . . . . . /N . . . L . /. . . . . d /u . . . . . /. . U R . . /N . . . . . /0 0 0 0 0 /0 0 0 0 0 /1 1 1 0 0 /0 0 0 0 0 /1 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 0 /0 0 1 0 0 0 /1 0 0 0 0 0 /1 0 0 0 0 0 /0 0 0 0 0 0 /"],
		["lrAcrossArrow", "pzprv3/nagare/6/6/R . . . . . /N . . . L . /. . . . . d /u . . . . . /. . U R . . /N . . . . . /0 0 0 0 0 /0 0 0 0 0 /1 0 0 0 1 /0 0 0 0 0 /1 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /1 0 0 0 0 0 /1 0 0 0 0 0 /0 0 0 0 0 0 /"],
		["lrAcrossArrow", "pzprv3/nagare/6/6/R . . . . . /N . . . L . /. . . . . l /u . . . . . /. . U R . . /N . . . . . /0 0 0 0 0 /0 0 0 0 0 /1 0 0 0 0 /0 0 0 0 0 /1 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 1 /1 0 0 0 0 1 /1 0 0 0 0 0 /0 0 0 0 0 0 /"],
		["lrAgainstArrow", "pzprv3/nagare/6/6/R . . . . . /N . . . L . /. l . . . d /u . . . . . /. . U R . . /N . . . . . /0 0 0 0 0 /0 0 0 0 0 /1 0 0 0 0 /0 0 0 0 0 /1 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /1 0 0 0 0 0 /1 0 0 0 0 0 /0 0 0 0 0 0 /"],
		["lrAgainstWind", "pzprv3/nagare/6/6/R . . . . . /N . . . L . /. . . . . d /u . . . . . /. . U R . . /N . . . . . /0 0 0 0 0 /0 0 0 0 0 /1 1 0 0 0 /0 0 0 0 0 /1 0 0 0 0 /0 0 0 0 0 /0 0 0 0 0 0 /0 0 0 0 0 0 /1 0 1 0 0 0 /1 0 0 0 0 0 /0 0 0 0 0 0 /"],
		["lrAcrossWind", "pzprv3/nagare/6/6/R . . . . . /N . . . L . /. . . . . d /u . . . . . /. . U R . . /N . . . . . /0 1r 1r 1r 1r /0 1l l 0 0 /1 -1 0 0 0 /0 1 0 0 0 /1 0 0 0 0 /0 1 1 1 0 /0 1 u 0 0 1 /0 -1 1u 0 0 1 /1 1 1u 0 0 1 /1 0 0 0 0 0 /0 1 0 0 0 0 /"],
		["arNoLine", "pzprv3/nagare/6/6/R . . . . . /N . . . L . /. . . . . d /u . . . . . /. . U R . . /N . . . . . /0 r r r r /0 l l 0 0 /1 -1 1 0 0 /0 1 0 0 0 /1 0 0 0 0 /0 1 1 1 0 /0 0 u 0 0 0 /0 -1 -1 0 0 0 /1 1 1u 0 0 0 /1 0 0 0 0 0 /0 1 0 0 0 0 /"],
		["lnDeadEnd", "pzprv3/nagare/6/6/R . . . . . /N . . . L . /. . . . . d /u . . . . . /. . U R . . /N . . . . . /0 r r 1r 1r /0 l l 0 0 /1 -1 1 0 0 /0 1 0 0 0 /1 0 0 0 0 /0 1 1 1 0 /0 0 u 0 0 1 /0 -1 -1 0 0 1 /1 1 1u 0 0 1 /1 0 0 0 0 0 /0 1 0 0 0 0 /"],
		["lrAgainstWind", "pzprv3/nagare/6/6/R . . . . . /N . . . L . /. . . . . d /u . . . . . /. . U R . . /N . . . . . /0 r r 1r 1r /0 l l 0 0 /1 -1 1 0 0 /0 1 0 0 0 /1 0 0 0 1r /0 1 1 1 0 /0 0 u 0 0 1 /0 -1 -1 0 0 1 /1 1 1u 0 0 1 /1 0 0 0 0 1 /0 1 0 0 1 0 /"],
		['lrAgainstWind', "pzprv3/nagare/6/6/R . . . . . /R . . . L . /. . . . . d /u . . . . . /. . U R . . /N . . . . . /0 r 1r 1r 1r /0 l 1l 0 0 /1 -1 1 0 0 /0 1 0 0 1 /1 0 0 0 1r /0 1 1 1 1 /0 0 1u 0 0 1 /0 -1 -1 1 0 1 /1 1 1u 0 0 1 /1 0 0 0 1 0 /0 1 0 0 0 1 /"],
		["lrAcrossWind", "pzprv3/nagare/6/6/R . . . . . /N . . . L . /. . . . . d /u . . . . . /. . U R . . /N . . . . . /0 1r 1r 1r 1r /0 1l 1l 0 0 /1 -1 1 0 0 /0 1 0 0 1 /1 0 0 0 1r /0 1 1 1 1 /0 1 u 0 0 1 /0 -1 -1 1 0 1 /1 1 1u 0 0 1 /1 0 0 0 1 0 /0 1 0 0 0 1 /"],
		[null, "pzprv3/nagare/6/6/R . . . . . /N . . . L . /. . . . . d /u . . . . . /. . U R . . /N . . . . . /0 r 1r 1r 1r /0 l 1l 0 0 /1 -1 1 0 0 /0 1 0 0 1 /1 0 0 0 1r /0 1 1 1 1 /0 0 1u 0 0 1 /0 -1 -1 1 0 1 /1 1 1u 0 0 1 /1 0 0 0 1 0 /0 1 0 0 0 1 /"]
	],
	inputs: [
		/* 回答入力テスト */
		{ input: ["setconfig,cursor,false"] },
		{
			input: ["newboard,3,3", "editmode", "mouse,left, 3,3", "playmode", "mouse,left, 1,3, 5,3, 5,5, 3,5, 3,1"],
			result: "pzprv3/nagare/3/3/. . . /. N . /. . . /0 0 /0 0 /0 1 /0 0 0 /0 0 1 /"
		},
		{
			input: ["mouse,right, 3,3, 5,3, 5,5, 3,5, 3,3"],
			result: "pzprv3/nagare/3/3/. . . /. N . /. . . /0 0 /0 r /0 1l /0 0 0 /0 u 1d /"
		},
		{
			input: ["mouse,right, 3,3, 3,5, 5,5, 5,3, 3,3"],
			result: "pzprv3/nagare/3/3/. . . /. N . /. . . /0 0 /0 l /0 1r /0 0 0 /0 d 1u /"
		},
		{
			input: ["mouse,right, 3,3, 3,5, 5,5, 5,3, 3,3"],
			result: "pzprv3/nagare/3/3/. . . /. N . /. . . /0 0 /0 0 /0 1 /0 0 0 /0 0 1 /"
		},
		{
			input: ["mouse,right, 5,2, 5,5"],
			result: "pzprv3/nagare/3/3/. . . /. N . /. . . /0 0 /0 0 /0 1 /0 0 -1 /0 0 -1 /"
		},
		{ input: ["mouse,left, 5,1, 1,1, 1,5, 5,5, 5,1"] },
		{
			input: ["cursor,0,0",
				"mouse,left, 2,1", "mouse,leftx2, 4,1", "mouse,leftx3, 2,5", "mouse,leftx4, 4,5",
				"mouse,left, 1,2", "mouse,leftx2, 5,2", "mouse,leftx3, 1,4", "mouse,leftx4, 5,4"],
			result: "pzprv3/nagare/3/3/. . . /. N . /. . . /-2 1l /0 0 /1r 1 /-2 0 1u /1d 0 1 /"
		},
		{
			input: ["mouse,left, 5,1, 1,1, 1,5, 5,5, 5,1"],
			result: "pzprv3/nagare/3/3/. . . /. N . /. . . /0 l /0 0 /r 0 /0 0 u /d 0 0 /"
		},
		/* 問題入力テスト */
		{ input: ["editmode", "newboard,5,1"] },
		{
			input: ["cursor,1,1", "key,-,shift+up", "key,right", "key,0,shift+down", "key,right", "key,1,shift+left", "key,right", "key,2,shift+right", "key,right", "key,1,0"],
			result: "pzprv3/nagare/1/5/u d l r . /0 0 0 0 /"
		},
		{
			input: ["cursor,1,1", "key,-", "key,right", "key,-", "key,right", "key,-,-", "key,right", "key,shift+right"],
			result: "pzprv3/nagare/1/5/u d l . . /0 0 0 0 /"
		},
		{
			input: ["newboard,5,1", "cursor,1,1", "key,q", "key,right", "key,w,q", "key,right", "key,w"],
			result: "pzprv3/nagare/1/5/N . N . . /0 0 0 0 /"
		},
		{
			input: ["cursor,1,1", "key,-,shift+up", "key,right", "key,0,shift+down", "key,right", "key,1,shift+left", "key,right", "key,2,shift+right", "key,right", "key,1,0"],
			result: "pzprv3/nagare/1/5/U d L r . /0 0 0 0 /"
		},
		{
			input: ["cursor,3,1", "key,q", "key,right", "key,q", "key,right", "key,w"],
			result: "pzprv3/nagare/1/5/U D l R . /0 0 0 0 /"
		},
		{ input: ["newboard,6,1"] },
		{
			input: ["cursor,0,0",
				"mouse,leftx2, 1,1", "mouse,left, 1,1, 1,-1",
				"mouse,leftx3, 3,1", "mouse,left, 3,1, 3,3",
				"mouse,leftx4, 5,1", "mouse,left, 5,1, 3,1",
				"mouse,leftx5, 7,1", "mouse,left, 7,1, 9,1",
				"mouse,leftx6, 9,1", "mouse,rightx2, 11,1"],
			result: "pzprv3/nagare/1/6/u D l R . . /0 0 0 0 0 /"
		},
		{
			input: ["cursor,0,0",
				"mouse,leftx2, 1,1", "mouse,left, 1,1, 1,-1",
				"mouse,leftx3, 3,1", "mouse,left, 3,1, 3,3",
				"mouse,leftx4, 5,1", "mouse,left, 5,1, 3,1",
				"mouse,leftx5, 7,1", "mouse,left, 7,1, 9,1",
				"mouse,leftx6, 9,1", "mouse,rightx2, 11,1"],
			result: "pzprv3/nagare/1/6/. . . . . . /0 0 0 0 0 /"
		}
	]
});
