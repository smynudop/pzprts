//
// パズル固有スクリプト部 ぬりかべ・ぬりぼう・モチコロ・モチにょろ版 nurikabe.js

import { createVariety } from "./createVariety";

//
export const Nuribou = createVariety({
	pid: "nuribou",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		inputModes: { edit: ['number', 'clear'], play: ['shade', 'unshade'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) { this.inputcell(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart) { this.inputqnum(); }
			}
		}
	},
	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		numberRemainsUnshaded: true
	},

	AreaShadeGraph: {
		enabled: true
	},
	AreaUnshadeGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		numbercolor_func: "qnum",
		qanscolor: "black",

		paint: function () {
			this.drawBGCells();
			this.drawShadedCells();
			this.drawGrid();

			this.drawQuesNumbers();

			this.drawChassis();

			this.drawTarget();
		},
		bgcellcolor_func: "qsub1",
		enablebcolor: true
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeNumber16();
		},
		encodePzpr: function (type) {
			this.encodeNumber16();
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnum();
			this.decodeCellAns();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeCellAns();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部

	AnsCheck: {
		checklist: [
			"checkBou",
			"checkCorners",
			"checkNoNumberInUnshade",
			"checkDoubleNumberInUnshade",
			"checkNumberAndUnshadeSize"
		],
		checkDoubleNumberInUnshade: function () {
			this.checkAllBlock(this.board.ublkmgr, function (cell) { return cell.isNum(); }, function (w, h, a, n) { return (a < 2); }, "bkNumGe2");
		},
		checkNumberAndUnshadeSize: function () {
			this.checkAllArea(this.board.ublkmgr, function (w, h, a, n) { return (n <= 0 || n === a); }, "bkSizeNe");
		},
		checkBou: function () {
			this.checkAllArea(this.board.sblkmgr, function (w, h, a, n) { return (w === 1 || h === 1); }, "csWidthGt1");
		},
		checkCorners: function () {
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (cell.bx === bd.maxbx - 1 || cell.by === bd.maxby - 1) { continue; }

				let i: number, adc = cell.adjacent;
				const cells = [[cell, adc.right.adjacent.bottom], [adc.right, adc.bottom]];
				for (i = 0; i < 2; i++) {
					if (cells[i][0].isShade() && cells[i][1].isShade()) { break; }
				}
				if (i === 2) { continue; }

				const block1 = cells[i][0].sblk.clist, block2 = cells[i][1].sblk.clist;
				if (block1.length !== block2.length) { continue; }

				this.failcode.add("csCornerSize");
				if (this.checkOnly) { break; }
				block1.seterr(1);
				block2.seterr(1);
			}
		},
		checkNoNumberInUnshade: function () {
			this.checkAllBlock(this.board.ublkmgr, function (cell) { return cell.isNum(); }, function (w, h, a, n) { return (a !== 0); }, "bkNoNum");
		}
	},

	FailCode: {
		bkNoNum: ["数字の入っていないシマがあります。", "An area of unshaded cells has no numbers."],
		bkNumGe2: ["1つのシマに2つ以上の数字が入っています。", "An area of unshaded cells has plural numbers."],
		bkSizeNe: ["数字とシマの面積が違います。", "The number is not equal to the number of the size of the area."],
		csWidthGt1: ["「幅１マス、長さ１マス以上」ではない黒マスのカタマリがあります。", "There is a mass of shaded cells, whose width is more than two."],
		csCornerSize: ["同じ面積の黒マスのカタマリが、角を共有しています。", "Masses of shaded cells whose length is the same share a corner."]
	},
});
