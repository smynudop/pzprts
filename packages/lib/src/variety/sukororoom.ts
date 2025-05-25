//
// パズル固有スクリプト部 数コロ・ヴィウ・数コロ部屋版 sukoro.js

import { Address } from "../puzzle/Address";
import { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const SukoroRoom = createVariety({
	pid: "sukororoom",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['border', 'number', 'clear'], play: ['number', 'numexist', 'numblank', 'clear'] },
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
		enableplay: true,

		keyinput: function (ca) {
			this.key_sukoro(ca);
		},
		key_sukoro: function (ca: string) {
			if (this.puzzle.playmode) {
				const cell = this.cursor.getc();
				if (ca === 'q' || ca === 'a' || ca === 'z') { ca = (cell.qsub === 1 ? '1' : 's1'); }
				else if (ca === 'w' || ca === 's' || ca === 'x') { ca = (cell.qsub === 2 ? '2' : 's2'); }
				else if (ca === 'e' || ca === 'd' || ca === 'c' || ca === '-') { ca = ' '; }
				else if (ca === '1' && cell.anum === 1) { ca = 's1'; }
				else if (ca === '2' && cell.anum === 2) { ca = 's2'; }
			}
			this.key_inputqnum(ca);
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		numberWithMB: true,

		maxnum: 4,

		// 正答判定用
		getViewClist: function () {
			const sx = this.bx, sy = this.by, clist = new CellList();
			for (let dir = 1; dir <= 4; dir++) {
				const pos = new Address(this.puzzle, sx, sy);
				while (1) {
					pos.movedir(dir, 2);
					const cell = pos.getc();
					if (!cell.isnull && cell.noNum() && cell.qsub !== 1) { clist.add(cell); }
					else { break; }
				}
			}
			return clist;
		}
	},

	Board: {
		cols: 8,
		rows: 8,

		hasborder: 1
	},

	AreaNumberGraph: {
		enabled: true
	},
	AreaRoomGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		paint: function () {
			this.drawBGCells();
			this.drawGrid();

			this.drawBorders();

			this.drawMBs();
			this.drawAnsNumbers();
			this.drawQuesNumbers();

			this.drawChassis();

			this.drawCursor();
		}
	},
	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeBorder();
			this.decodeNumber10();
		},
		encodePzpr: function (type) {
			this.encodeBorder();
			this.encodeNumber10();
		}
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
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkNumberExist",
			"checkDifferentNumberInRoom",
			"checkNoMixedRoom",
			"checkDir4NumberCount",
			"checkConnectNumber",
			"checkNoSuspendCell"
		],

		checkNoMixedRoom: function () {
			this.checkSameObjectInRoom(this.board.roommgr, function (cell) { return (cell.isNumberObj() ? 1 : 2); }, "bkMixed");
		},
		checkDir4NumberCount: function () {
			this.checkDir4Cell(function (cell) { return cell.isNumberObj(); }, 0, "nmNumberNe");
		},
		checkNoSuspendCell: function () {
			this.checkAllCell(function (cell) { return (cell.qsub === 1); }, "ceSuspend");
		},

		checkViewOfNumber: function () {
			const boardcell = this.board.cell;
			for (let c = 0; c < boardcell.length; c++) {
				const cell = boardcell[c];
				if (!cell.isValidNum()) { continue; }

				const clist = cell.getViewClist();
				if (cell.getNum() === clist.length) { continue; }

				this.failcode.add("nmSumViewNe");
				if (this.checkOnly) { break; }
				cell.seterr(1);
				clist.seterr(2);
			}
		}
	},

	FailCode: {
		bkDupNum: ["1つの部屋に同じ数字が複数入っています。", "A room has two or more same numbers."],
		bkMixed: ["数字のあるなしが混在した部屋があります。", "A room includes both numbered and non-numbered cells."],
		nmNumberNe: ["数字と、その数字の上下左右に入る数字の数が一致していません。", "The number of numbers placed in four adjacent cells is not equal to the number."],
		nmSumViewNe: ["数字と、他のマスにたどり着くまでのマスの数の合計が一致していません。", "Sum of four-way gaps to another number is not equal to the number."],
		ceSuspend: ["数字の入っていないマスがあります。", "There is a cell that is not filled in number."]
	}
});
