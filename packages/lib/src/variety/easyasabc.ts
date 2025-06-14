//
// パズル固有スクリプト部 ABCプレース版 easyasabc.js

import { Board } from "../puzzle/Board";
import { Graphic, PaintRange } from "../puzzle/Graphic";
import { KeyEvent, TargetCursor } from "../puzzle/KeyInput";
import { Operation } from "../puzzle/Operation";
import { BoardPiece, type EXCell } from "../puzzle/Piece";
import type { CellList } from "../puzzle/PieceList";
import type { Puzzle } from "../puzzle/Puzzle";
import { createVariety } from "./createVariety";

//
export const EasyAsAbc = createVariety({
	pid: "easyasabc",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: {
			edit: ["number"],
			play: ["number", "numexist", "numblank", "clear"],
		},
		mouseinput_number: function () {
			if (this.mousestart) {
				if (this.puzzle.editmode) {
					this.inputqnum_excell();
				} else {
					this.inputqnum();
				}
			}
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart) {
					const piece = this.getcell_excell();
					if (!piece.isnull && piece.group === "cell") {
						this.inputqnum();
					}
				}
			} else if (this.puzzle.editmode) {
				if (this.mousestart) {
					this.inputqnum_excell();
				}
			}
		},

		inputqnum_excell: function () {
			const excell = this.getpos(0).getex();
			if (excell.isnull) {
				return;
			}

			if (excell !== this.cursor.getex()) {
				this.setcursor(this.getpos(0));
			} else {
				if (excell.group === "excell") {
					this.inputqnum_main(excell);
				} else {
					const indicator = this.board.indicator;
					let val = this.getNewNumber(indicator, indicator.count);
					if (val === null) {
						return;
					} else if (val <= 0) {
						val =
							this.btn === "left"
								? indicator.getminnum()
								: indicator.getmaxnum();
					}
					indicator.set(val);
				}
			}
		},
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		enableplay: true,
		moveTarget: function (ca): boolean {
			if (this.puzzle.playmode) {
				return this.moveTCell(ca);
			}
			return this.moveEXCell(ca);
		},
		keyinput: function (ca) {
			if (this.puzzle.playmode) {
				const isSnum = this.cursor.targetdir !== 0;
				if (isSnum) {
				} else if (ca === "1") {
					ca = "s1";
				} else if (ca === "2") {
					ca = "s2";
				} else if (ca === "3") {
					ca = "BS";
				}
				this.key_inputqnum(ca);
				if (!isSnum && ca === " ") {
					this.cursor.getc().clrSnum();
				}
			} else {
				if (this.cursor.by >= this.board.minby) {
					const excell = this.cursor.getex();
					if (!excell.isnull) {
						this.key_inputqnum_main(excell, ca);
					}
				} else {
					this.key_inputqnum_indicator(ca);
				}
			}
		},
		key_inputqnum_indicator: function (ca: string) {
			const bd = this.puzzle.board;
			const val = this.getNewNumber(bd.indicator, ca, bd.indicator.count);
			if (val === null) {
				return;
			}
			bd.indicator.set(val);
			this.prev = bd.indicator;
		},
	},

	TargetCursor: {
		draw: function () {
			if (this.by >= this.board.minby) {
				TargetCursor.prototype.draw.call(this);
			} else {
				this.board.indicator.draw();
			}
		},

		initCursor: function () {
			this.init(-1, -1);
			this.adjust_init();
		},
		setminmax_customize: function () {
			if (this.puzzle.editmode) {
				return;
			}
			this.minx += 2;
			this.miny += 2;
			this.maxx -= 2;
			this.maxy -= 2;
		},
		adjust_init: function () {
			if (this.puzzle.playmode) {
				TargetCursor.prototype.adjust_init.call(this);
			} else if (this.puzzle.editmode) {
				this.adjust_cell_to_excell();
			}
		},
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		enableSubNumberArray: true,
		numberWithMB: true,
		numberAsLetter: true,

		maxnum: function (): number {
			//@ts-ignore
			return this.board.indicator.count;
		},
	},

	EXCell: {
		disInputHatena: true,
		numberAsLetter: true,

		maxnum: function (): number {
			//@ts-ignore
			return this.board.indicator.count;
		},
	},

	Board: {
		cols: 5,
		rows: 5,
		hasexcell: 2,

		indicator: null! as Indicator,

		createExtraObject: function () {
			this.indicator = new Indicator(this.puzzle);
		},
		initExtraObject: function (col, row) {
			this.indicator.init();
		},
		getex: function (bx, by): any {
			if (by > this.minby) {
				return Board.prototype.getex.call(this, bx, by);
			} else if (by === -3) {
				return this.indicator;
			}
			return this.emptyexcell;
		},

		searchSight: function (startexcell: EXCell, seterror: boolean): any {
			let pos = startexcell.getaddr(),
				dir = 0,
				cell = this.emptycell;
			if (pos.by === this.minby + 1) {
				dir = 2;
			} else if (pos.by === this.maxby - 1) {
				dir = 1;
			} else if (pos.bx === this.minbx + 1) {
				dir = 4;
			} else if (pos.bx === this.maxbx - 1) {
				dir = 3;
			}

			while (dir !== 0) {
				pos.movedir(dir, 2);
				const cell2 = pos.getc() as any;
				if (cell2.isnull) {
					break;
				}

				if (!cell2.isNumberObj()) {
					continue;
				}
				cell = cell2;
				break;
			}

			if (!!seterror) {
				startexcell.error = 1;
				cell.error = 1;
			}

			return { dest: cell };
		},
	},

	OperationManager: {
		addExtraOperation: function () {
			this.operationlist.push(IndicatorOperation);
		},
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "LIGHT",

		paint: function () {
			this.drawBGCells();
			this.drawBGEXcells();
			this.drawTargetSubNumber();

			this.drawGrid();
			this.drawBorders();

			this.drawMBs();
			this.drawSubNumbers();
			this.drawAnsNumbers();
			this.drawNumbersEXcell();

			this.drawChassis();

			this.drawIndicator();
			this.drawCursor_easyasbac();
		},

		/* 上にアルファベット範囲の個数表示領域を追加 */
		getCanvasRows: function (): number {
			return this.getBoardRows() + 2 * this.margin + 0.8;
		},
		getOffsetRows: function (): number {
			return 1.45;
		},
		setRangeObject: function (x1, y1, x2, y2) {
			Graphic.prototype.setRangeObject.call(this, x1, y1, x2, y2);
			//@ts-ignore
			this.range.indicator = y1 < 0;
		},
		copyBufferData: function (g, g2, x1, y1, x2, y2) {
			Graphic.prototype.copyBufferData.call(this, g, g2, x1, y1, x2, y2);
			//@ts-ignore
			if (g.use.canvas && this.range.indicator) {
				const bd = this.board;
				const sx1 = 0,
					sy1 = 0,
					sx2 = g2.child.width,
					sy2 = bd.minby * this.bh + this.y0;
				//@ts-ignore
				g.context.clearRect(sx1, sy1 - this.y0, sx2, sy2);
				g.drawImage(
					g2.child,
					sx1,
					sy1,
					sx2 - sx1,
					sy2 - sy1,
					sx1 - this.x0,
					sy1 - this.y0,
					sx2 - sx1,
					sy2 - sy1,
				);
			}
		},

		drawIndicator: function () {
			const g = this.vinc("indicator", "auto", true),
				bd = this.board;
			//@ts-ignore
			if (!this.range.indicator) {
				return;
			}

			if (g.use.canvas) {
				//@ts-ignore
				g.context.clearRect(
					0,
					-this.y0,
					g.child.width,
					bd.minby * this.bh + this.y0,
				);
			}

			g.fillStyle = this.quescolor;

			g.vid = "bd_indicator";
			g.font = ((this.ch * 0.66) | 0) + "px " + this.fontfamily;
			g.textAlign = "right";
			g.textBaseline = "middle";
			g.fillText(
				"(A-" + this.getNumberTextCore_letter(bd.indicator.count) + ")",
				(bd.maxbx - 0.2) * this.bw,
				-3 * this.bh,
			);
		},
		drawCursor_easyasbac: function () {
			const isOnBoard = this.puzzle.board.minby <= this.puzzle.cursor.by;
			const isOnIndicator = !isOnBoard;
			this.drawCursor(true, isOnBoard);
			this.drawCursorOnIndicator(isOnIndicator);
		},
		drawCursorOnIndicator: function (isdraw: boolean) {
			const g = this.vinc("target_cursor_indicator", "crispEdges", true),
				bd = this.board;
			//@ts-ignore
			if (!this.range.indicator) {
				return;
			}

			isdraw =
				isdraw &&
				this.puzzle.editmode &&
				this.puzzle.getConfig("cursor") &&
				!this.outputImage;
			g.vid = "ti";
			if (isdraw) {
				const rect = bd.indicator.rect;
				g.strokeStyle = this.targetColor1;
				g.lineWidth = Math.max(this.cw / 16, 2) | 0;
				g.strokeRect(
					rect.bx1 * this.bw,
					rect.by1 * this.bh,
					(rect.bx2 - rect.bx1) * this.bw,
					(rect.by2 - rect.by1) * this.bh,
				);
			} else {
				g.vhide();
			}
		},
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeIndicator();
			this.decodeNumber16EXCell();
		},
		encodePzpr: function (type) {
			this.encodeIndicator();
			this.encodeNumber16EXCell();
		},

		decodeIndicator: function () {
			const barray = this.outbstr.split("/"),
				bd = this.board;
			bd.indicator.count = +barray[0];
			this.outbstr = !!barray[1] ? barray[1] : "";
		},
		encodeIndicator: function () {
			this.outbstr = this.board.indicator.count + "/";
		},

		decodeNumber16EXCell: function () {
			// 盤面外数字のデコード
			let ec = 0,
				i = 0,
				bstr = this.outbstr,
				bd = this.board;
			for (i = 0; i < bstr.length; i++) {
				const ca = bstr.charAt(i),
					excell = bd.excell[ec];
				if (this.include(ca, "0", "9") || this.include(ca, "a", "f")) {
					excell.qnum = Number.parseInt(bstr.substr(i, 1), 16);
				} else if (ca === "-") {
					excell.qnum = Number.parseInt(bstr.substr(i + 1, 2), 16);
					i += 2;
				} else if (ca === ".") {
					excell.qnum = -2;
				} else if (ca >= "g" && ca <= "z") {
					ec += Number.parseInt(ca, 36) - 16;
				}

				ec++;
				if (ec >= bd.excell.length) {
					break;
				}
			}

			this.outbstr = bstr.substr(i + 1);
		},
		encodeNumber16EXCell: function () {
			// 盤面外数字のエンコード
			let count = 0,
				cm = "",
				bd = this.board;
			for (let ec = 0; ec < bd.excell.length; ec++) {
				let pstr = "",
					qn = bd.excell[ec].qnum;

				if (qn === -2) {
					pstr = ".";
				} else if (qn >= 0 && qn < 16) {
					pstr = qn.toString(16);
				} else if (qn >= 16 && qn < 256) {
					pstr = "-" + qn.toString(16);
				} else {
					count++;
				}

				if (count === 0) {
					cm += pstr;
				} else if (pstr || count === 20) {
					cm += (15 + count).toString(36) + pstr;
					count = 0;
				}
			}
			if (count > 0) {
				cm += (15 + count).toString(36);
			}

			this.outbstr += cm;
		},
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeIndicator();
			this.decodeCellEXCellQnumAnumsub();
		},
		encodeData: function () {
			this.encodeIndicator();
			this.encodeCellEXCellQnumAnumsub();
		},

		decodeIndicator: function () {
			this.board.indicator.count = +this.readLine();
		},
		encodeIndicator: function () {
			this.writeLine(this.board.indicator.count);
		},

		decodeCellEXCellQnumAnumsub: function () {
			this.decodeCellExcell((obj, ca) => {
				if (ca === ".") {
					return;
				} else if (obj.group === "excell") {
					obj.qnum = +ca;
				} else if (obj.group === "cell") {
					if (ca.indexOf("[") >= 0) {
						ca = this.setCellSnum(obj, ca);
					}
					if (ca === "+") {
						obj.qsub = 1;
					} else if (ca === "-") {
						obj.qsub = 2;
					} else if (ca !== ".") {
						obj.anum = +ca;
					}
				}
			});
		},
		encodeCellEXCellQnumAnumsub: function () {
			this.encodeCellExcell((obj) => {
				if (obj.group === "excell") {
					if (obj.qnum !== -1) {
						return "" + obj.qnum + " ";
					}
				} else if (obj.group === "cell") {
					let ca = ".";
					if (obj.anum !== -1) {
						ca = "" + obj.anum;
					} else if (obj.qsub === 1) {
						ca = "+";
					} else if (obj.qsub === 2) {
						ca = "-";
					}
					if (obj.anum === -1) {
						ca += this.getCellSnum(obj);
					}
					return ca + " ";
				}
				return ". ";
			});
		},
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkDifferentNumberInLine",
			"checkSight+",
			"checkNumberSaturatedInLine",
		],

		checkNumberSaturatedInLine: function () {
			this.checkRowsCols(this.isNumberSaturatedInClist, "nmMissRow");
		},
		isNumberSaturatedInClist: function (clist: CellList) {
			if (clist.length <= 0) {
				return true;
			}
			let result = true,
				d = [];
			const max = this.board.indicator.count,
				bottom = 1;
			for (let n = bottom; n <= max; n++) {
				d[n] = 0;
			}
			for (let i = 0; i < clist.length; i++) {
				if (clist[i].anum >= bottom) {
					d[clist[i].anum]++;
				}
			}
			for (let n = bottom; n <= max; n++) {
				if (d[n] === 0) {
					result = false;
					break;
				}
			}

			if (!result) {
				clist.seterr(1);
			}
			return result;
		},

		checkSight: function (type: number) {
			let bd = this.board,
				result = true;
			for (let ec = 0; ec < bd.excell.length; ec++) {
				const excell = bd.excell[ec];
				if (excell.qnum === -1) {
					continue;
				}
				const cell = bd.searchSight(excell, false).dest;
				if (cell.isnull || excell.qnum === cell.anum || cell.qsub === 1) {
					continue;
				}

				result = false;
				if (this.checkOnly) {
					break;
				}

				excell.seterr(1);
				bd.searchSight(excell, true);
			}
			if (!result) {
				this.failcode.add("nmSightNe");
			}
		},
	},

	FailCode: {
		nmDupRow: [
			"同じ列に同じアルファベットが入っています。",
			"There are same letters in a row.",
		],
		nmMissRow: [
			"列に入っていないアルファベットがあります。",
			"There are missing letters in a row.",
		],
		nmSightNe: [
			"アルファベットが最も手前にありません。",
			"The letter is not the closest.",
		],
	},
});


class Indicator extends BoardPiece {
	count = 3
	rect!: { bx1: number, by1: number, bx2: number, by2: number }
	override numberAsLetter = true
	override isnull: boolean = false
	constructor(puzzle: Puzzle, val?: number) {
		super(puzzle)
		if (!!val) {
			this.count = val;
		}
		this.rect = { bx1: -1, by1: -1, bx2: -1, by2: -1 };
	}
	init() {
		this.count = 3;
		const bd = this.puzzle.board;
		this.rect = {
			bx1: bd.maxbx - 3.15,
			by1: -3.8,
			bx2: bd.maxbx - 0.15,
			by2: -2.2,
		};
	}
	set(val: number) {
		if (val <= 0) {
			val = 1;
		}
		if (this.count !== val) {
			this.addOpe(this.count, val);
			this.count = val;
			this.draw();
		}
	}
	override getmaxnum() {
		const bd = this.board;
		return Math.max(bd.rows, bd.cols);
	}
	override getminnum() {
		return 1;
	}
	override addOpe(old: number, num: number) {
		this.puzzle.opemgr.add(new IndicatorOperation(this.puzzle, old, num));
	}
	override draw() {
		this.puzzle.painter.paintRange(
			this.board.minbx,
			-1,
			this.board.maxbx,
			-1,
		);
	}
}


class IndicatorOperation extends Operation<number> {
	type = "indicator"

	constructor(puzzle: Puzzle, old: number, num: number) {
		super(puzzle)
		this.old = old;
		this.num = num;
	}
	override decode(strs: string[]) {
		if (strs[0] !== "AS") {
			return false;
		}
		this.old = +strs[1];
		this.num = +strs[2];
		return true;
	}
	override toString() {
		return ["AS", this.old, this.num].join(",");
	}
	override undo() {
		this.exec(this.old);
	}
	override redo() {
		this.exec(this.num);
	}
	override exec(num: number) {
		//@ts-ignore
		this.board.indicator.set(num);
	}
}
