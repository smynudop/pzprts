//
// パズル固有スクリプト部 波及効果・コージュン版 ripple.js

import { createVariety } from "./createVariety";

//
export const Ripple = createVariety({
	pid: "ripple",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['border', 'number', 'clear'], play: ['number', 'clear'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart) { this.inputqnum(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || (this.mousemove && this.btn === 'left')) {
					this.inputborder();
				}
				else if (this.mouseend && this.notInputted()) {
					this.inputqnum();
				}
			}
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		enableplay: true
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		enableSubNumberArray: true,
		maxnum: function () {
			return this.room.clist.length;
		}
	},
	Board: {
		hasborder: 1
	},

	AreaRoomGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "DLIGHT",

		paint: function () {
			this.drawBGCells();
			this.drawTargetSubNumber();
			this.drawGrid();

			this.drawSubNumbers();
			this.drawAnsNumbers();
			this.drawQuesNumbers();

			this.drawBorders();

			this.drawChassis();

			this.drawCursor();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeBorder();
			this.decodeNumber16();
		},
		encodePzpr: function (type) {
			this.encodeBorder();
			this.encodeNumber16();
		},
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeBorderQues();
			this.decodeCellQnum();
			this.decodeCellAnumsub();
		},
		encodeData: function () {
			this.encodeBorderQues();
			this.encodeCellQnum();
			this.encodeCellAnumsub();
		},
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkDifferentNumberInRoom",
			"checkRippleNumber",
			//"checkAdjacentDiffNumber@cojun",
			//"checkUpperNumber@cojun",
			"checkNoNumCell+"
		],

		checkRippleNumber: function () {
			let result = true;
			const bd = this.board;
			allloop:
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				const num = cell.getNum();
				const bx = cell.bx;
				const by = cell.by;
				if (num <= 0) { continue; }
				for (let i = 2; i <= num * 2; i += 2) {
					const cell2 = bd.getc(bx + i, by);
					if (!cell2.isnull && cell2.getNum() === num) {
						result = false;
						if (this.checkOnly) { break allloop; }
						cell.seterr(1);
						cell2.seterr(1);
					}
				}
				for (let i = 2; i <= num * 2; i += 2) {
					const cell2 = bd.getc(bx, by + i);
					if (!cell2.isnull && cell2.getNum() === num) {
						result = false;
						if (this.checkOnly) { break allloop; }
						cell.seterr(1);
						cell2.seterr(1);
					}
				}
			}
			if (!result) { this.failcode.add("nmSmallGap"); }
		},

		checkUpperNumber: function () {
			const bd = this.board;
			for (let c = 0; c < bd.cell.length - bd.cols; c++) {
				const cell = bd.cell[c];
				const cell2 = cell.adjacent.bottom;
				if (cell.room !== cell2.room || !cell.isNum() || !cell2.isNum()) { continue; }
				if (cell.getNum() >= cell2.getNum()) { continue; }

				this.failcode.add("bkSmallOnBig");
				if (this.checkOnly) { break; }
				cell.seterr(1);
				cell2.seterr(1);
			}
		}
	},

	FailCode: {
		bkDupNum: ["1つの部屋に同じ数字が複数入っています。", "A room has two or more same numbers."],
		bkSmallOnBig: ["同じ部屋で上に小さい数字が乗っています。", "There is an small number on big number in a room."],
		nmSmallGap: ["数字よりもその間隔が短いところがあります。", "The gap of the same kind of number is smaller than the number."]
	}
});
