//
// パズル固有スクリプト部 スターバトル版 starbattle.js

import type { WrapperBase } from "../candle";
import { Graphic, type PaintRange } from "../puzzle/Graphic";
import { Operation } from "../puzzle/Operation";
import { BoardPiece } from "../puzzle/Piece";
import { CellList } from "../puzzle/PieceList";
import type { Puzzle } from "../puzzle/Puzzle";
import { createVariety } from "./createVariety";

//

// 星を描画するときの頂点の位置
const starXOffset = [0, 0.235, 0.95, 0.38, 0.588, 0, -0.588, -0.38, -0.95, -0.235];
const starYOffset = [-1, -0.309, -0.309, 0.124, 0.809, 0.4, 0.809, 0.124, -0.309, -0.309];

export const StarBattle = createVariety({
	pid: "starbattle",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		inputModes: { play: ['star', 'unshade'], edit: [] },
		mouseinput_other: function () {
			if (this.inputMode === 'star' && this.mousestart) { this.inputcell_starbattle(); }
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) { this.inputcell_starbattle(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) { this.inputEdit(); }
			}
		},

		inputcell_starbattle: function () {
			const cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell) { return; }
			if (this.inputData === null) { this.decIC(cell); }

			cell.setQans(this.inputData === 1 ? 1 : 0);
			cell.setQsub(this.inputData === 2 ? 1 : 0);
			cell.draw();

			this.mouseCell = cell;

			if (this.inputData === 1) { this.mousereset(); }
		},

		inputEdit: function () {
			// 初回はこの中に入ってきます。
			if (this.inputData === null) {
				this.inputEdit_first();
			}
			// 境界線の入力中の場合
			else {
				this.inputborder();
			}
		},
		inputEdit_first: function () {
			const bd = this.board, bx = this.inputPoint.bx, by = this.inputPoint.by, rect = bd.starCount.rect;
			if ((bx >= rect.bx1) && (bx <= rect.bx2) && (by >= rect.by1) && (by <= rect.by2)) {
				const val = this.getNewNumber(bd.starCount, bd.starCount.count);
				if (val === null) { return; }
				bd.starCount.set(val);
				this.mousereset();
			}
			// その他は境界線の入力へ
			else {
				this.inputborder();
			}
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		moveTarget: function (): boolean { return false; },

		keyinput: function (ca) {
			if (this.keydown && this.puzzle.editmode) {
				this.key_inputqnum_starbattle(ca);
			}
		},
		key_inputqnum_starbattle: function (ca: string) {
			const bd = this.puzzle.board;
			const val = this.getNewNumber(bd.starCount, ca, bd.starCount.count);
			if (val === null) { return; }
			bd.starCount.set(val);
			this.prev = bd.starCount;
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Board: {
		hasborder: 1,

		starCount: null! as StarCount,

		createExtraObject: function () {
			this.starCount = new StarCount(this.puzzle, 1);
		},
		initExtraObject: function (col, row) {
			this.starCount.init(1);
		}
	},

	OperationManager: {
		addExtraOperation: function () {
			this.operationlist.push(StarCountOperation);
		}
	},

	AreaRoomGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		range: {} as PaintRange & { starCount: boolean },
		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();

			this.drawBorders();

			this.drawCrossMarks();
			this.drawStars();

			this.drawChassis();

			this.drawStarCount();
			this.drawCursor_starbattle();
		},

		/* 上に星の個数表示領域を追加 */
		getCanvasRows: function (): number {
			return this.getBoardRows() + 2 * this.margin + 0.8;
		},
		getOffsetRows: function (): number { return 0.4; },
		setRangeObject: function (x1, y1, x2, y2) {
			Graphic.prototype.setRangeObject.call(this, x1, y1, x2, y2);
			this.range.starCount = (y1 < 0);
		},
		copyBufferData: function (g, g2, x1, y1, x2, y2) {
			Graphic.prototype.copyBufferData.call(this, g, g2, x1, y1, x2, y2);
			if (g.use.canvas && this.range.starCount) {
				const bd = this.board;
				const sx1 = 0, sy1 = 0, sx2 = g2.child.width, sy2 = (bd.minby - 0.1) * this.bh + this.y0;
				//@ts-ignore
				g.context.clearRect(sx1, sy1 - this.y0, sx2, sy2);
				g.drawImage(g2.child, sx1, sy1, (sx2 - sx1), (sy2 - sy1), sx1 - this.x0, sy1 - this.y0, (sx2 - sx1), (sy2 - sy1));
			}
		},

		drawCrossMarks: function () {
			const g = this.vinc('cell_cross', 'auto', true);
			g.lineWidth = 1;
			const rsize = this.cw * 0.35;
			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				let cell = clist[i], px: number, py: number;
				g.vid = "c_cross_" + cell.id;
				if (cell.qsub === 1) {
					const px = cell.bx * this.bw, py = cell.by * this.bh;
					g.strokeStyle = (!cell.trial ? this.mbcolor : "rgb(192, 192, 192)");
					g.strokeCross(px, py, rsize);
				}
				else { g.vhide(); }
			}
		},
		drawStars: function () {
			const g = this.vinc('cell_star', 'auto', true);
			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				g.vid = 'c_star_' + cell.id;
				if (cell.qans === 1) {
					g.fillStyle = (!cell.trial ? this.qanscolor : this.trialcolor);
					this.dispStar(g, cell.bx * this.bw, cell.by * this.bh, this.bw * 0.9, this.bh * 0.9);
				}
				else { g.vhide(); }
			}
		},

		drawStarCount: function () {
			const g = this.vinc('starcount', 'auto', true), bd = this.board;
			if (!this.range.starCount) { return; }

			if (g.use.canvas) {
				//@ts-ignore
				g.context.clearRect(0, -this.y0, g.child.width, (bd.minby - 0.1) * this.bh + this.y0);
			}

			g.fillStyle = this.quescolor;

			g.vid = 'bd_starCount';
			g.font = ((this.ch * 0.66) | 0) + "px " + this.fontfamily;
			g.textAlign = 'right';
			g.textBaseline = 'middle';
			g.fillText('' + bd.starCount.count, (bd.maxbx - 1.8) * this.bw, -this.bh);

			g.vid = 'bd_star';
			this.dispStar(g, (bd.maxby - 1) * this.bw, -this.bh, this.bw * 0.7, this.bh * 0.7);
		},
		drawCursor_starbattle: function () {
			const g = this.vinc('target_cursor', 'crispEdges', true), bd = this.board;
			if (!this.range.starCount) { return; }

			const isdraw = (this.puzzle.editmode && this.puzzle.getConfig('cursor') && !this.outputImage);
			g.vid = "ti";
			if (isdraw) {
				const rect = bd.starCount.rect;
				g.strokeStyle = this.targetColor1;
				g.lineWidth = (Math.max(this.cw / 16, 2)) | 0;
				g.strokeRect(rect.bx1 * this.bw, rect.by1 * this.bh, (rect.bx2 - rect.bx1) * this.bw, (rect.by2 - rect.by1) * this.bh);
			}
			else { g.vhide(); }
		},

		dispStar: function (g: WrapperBase<any>, px: number, py: number, sizeX: number, sizeY: number) {
			g.beginPath();
			g.moveTo(px, py - sizeY);
			for (let p = 1; p < 10; p++) { g.lineTo(px + sizeX * starXOffset[p], py + sizeY * starYOffset[p]); }
			g.closePath();
			g.fill();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeStarCount();
			this.decodeBorder();
		},
		encodePzpr: function (type) {
			this.encodeStarCount();
			this.encodeBorder();
		},

		decodeStarCount: function () {
			const barray = this.outbstr.split("/"), bd = this.board;
			bd.starCount.count = +barray[0];
			this.outbstr = (!!barray[1] ? barray[1] : '');
		},
		encodeStarCount: function () {
			this.outbstr = (this.board.starCount.count + "/");
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.board.starCount.count = +this.readLine();

			this.decodeAreaRoom();
			this.decodeCellAns();
		},
		encodeData: function () {
			this.writeLine(this.board.starCount.count);

			this.encodeAreaRoom();
			this.encodeCellAns();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkAroundStars",
			"checkOverSaturatedStars",
			"checkInsufficientStars",
			"checkStarCountInLine"
		],

		checkAroundStars: function () {
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (cell.qans !== 1) { continue; }
				let target = null, clist = new CellList();
				// 右・左下・下・右下だけチェック
				clist.add(cell);
				target = cell.relcell(2, 0); if (target.qans === 1) { clist.add(target); }
				target = cell.relcell(0, 2); if (target.qans === 1) { clist.add(target); }
				target = cell.relcell(-2, 2); if (target.qans === 1) { clist.add(target); }
				target = cell.relcell(2, 2); if (target.qans === 1) { clist.add(target); }
				if (clist.length <= 1) { continue; }

				this.failcode.add("starAround");
				if (this.checkOnly) { break; }
				clist.seterr(1);
			}
		},
		checkInsufficientStars: function () {
			const bd = this.board;
			this.checkAllBlock(bd.roommgr, function (cell) { return cell.qans === 1; }, function (w, h, a, n) { return (a >= bd.starCount.count); }, "bkStarLt");
		},
		checkOverSaturatedStars: function () {
			const bd = this.board;
			this.checkAllBlock(bd.roommgr, function (cell) { return cell.qans === 1; }, function (w, h, a, n) { return (a <= bd.starCount.count); }, "bkStarGt");
		},
		checkStarCountInLine: function () {
			this.checkRowsCols(this.isStarCountInClist, "lnStarNe");
		},
		isStarCountInClist: function (clist: CellList): boolean {
			const result = (clist.filter(function (cell) { return cell.qans === 1; }).length === this.board.starCount.count);
			if (!result) { clist.seterr(1); }
			return result;
		}
	},

	FailCode: {
		starAround: ["星がタテヨコナナメに隣接しています。", "Stars are adjacent."],
		bkStarGt: ["ブロックに入る星の数が多すぎます。", "The number of stars in a block is more than the problem."],
		bkStarLt: ["ブロックに入る星の数が少ないです。", "The number of stars in a block is less than the problem."],
		lnStarNe: ["1つの行に入る星の数が間違っています。", "The number of stars in a line is other than the problem."]
	}
})


class StarCount extends BoardPiece {
	count = 1
	rect: { bx1: number, bx2: number, by1: number, by2: number }
	constructor(puzzle: Puzzle, val: number) {
		super(puzzle)
		this.count = val;
		this.rect = {
			bx1: -1, by1: -1,
			bx2: -1, by2: -1
		};
	}
	init(val: number) {
		this.count = val;
		const bd = this.puzzle.board;
		this.rect = {
			bx1: bd.maxbx - 3.15, by1: -1.8,
			bx2: bd.maxbx - 0.15, by2: -0.2
		};
	}
	set(val: number) {
		if (val <= 0) { val = 1; }
		if (this.count !== val) {
			this.addOpe(this.count, val);
			this.count = val;
			this.draw();
		}
	}
	override getmaxnum(): number {
		const bd = this.board;
		return Math.max(Math.floor(bd.cols / 4), 1);
	}
	override getminnum() { return 1; }
	override addOpe(old: number, num: number) {
		this.puzzle.opemgr.add(new StarCountOperation(this.puzzle, old, num));
	}
	override draw() {
		this.puzzle.painter.paintRange(this.board.minbx, -1, this.board.maxbx, -1);
	}
}

class StarCountOperation extends Operation<number> {
	type = 'starCount'
	constructor(puzzle: Puzzle, old: number, num: number) {
		super(puzzle)
		this.old = old;
		this.num = num;
	}
	override decode(strs: string[]) {
		if (strs[0] !== 'AS') { return false; }
		this.old = +strs[1];
		this.num = +strs[2];
		return true;
	}
	override toString() {
		return ['AS', this.old, this.num].join(',');
	}
	override undo() { this.exec(this.old); }
	override redo() { this.exec(this.num); }
	override exec(num: number) {
		//@ts-ignore
		this.board.starCount.set(num);
	}
}