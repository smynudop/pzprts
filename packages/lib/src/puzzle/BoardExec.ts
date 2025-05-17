// BoardExec.js v3.4.1

import type { Puzzle } from "./Puzzle";
import type { Board, IGroup } from "./Board";
import { Address } from "./Address";
import { BorderList } from "./PieceList";
import { BoardFlipOperation, BoardAdjustOperation, type Operation } from "./Operation";
import { type BoardPiece, type Border, Cell } from "./Piece";

// 拡大縮小・回転反転用定数
const UP = 0x01 as const;
const DN = 0x02 as const;
const LT = 0x03 as const;
const RT = 0x04 as const;
const EXPAND = 0x10 as const;
export const REDUCE = 0x20 as const;
export const TURN = 0x40 as const;
const FLIP = 0x80 as const;

const TURNFLIP = (TURN | FLIP)

const EXPANDUP = (EXPAND | UP)
const EXPANDDN = (EXPAND | DN)
const EXPANDLT = (EXPAND | LT)
const EXPANDRT = (EXPAND | RT)

const REDUCEUP = (REDUCE | UP)
const REDUCEDN = (REDUCE | DN)
const REDUCELT = (REDUCE | LT)
const REDUCERT = (REDUCE | RT)

export const TURNL = (TURN | 1)
export const TURNR = (TURN | 2)

export const FLIPX = (FLIP | 1)
export const FLIPY = (FLIP | 2)

export type IBoardOperation =
	"expandup" |
	"expanddn" |
	"expandlt" |
	"expandrt" |
	"reduceup" |
	"reducedn" |
	"reducelt" |
	"reducert" |
	"turnl" |
	"turnr" |
	"flipy" |
	"flipx"

export type IRange = {
	x1: number,
	y1: number,
	x2: number,
	y2: number
}
//---------------------------------------------------------------------------
// ★BoardExecクラス 盤面の拡大縮小、反転回転等を行う (MenuExec.js, Board.jsから移動)
//---------------------------------------------------------------------------
export type BoardExecOption = Partial<BoardExec>
export class BoardExec<TBoard extends Board = Board> {
	// 拡大縮小・回転反転用定数
	REDUCE = REDUCE
	TURNL = TURNL
	TURNR = TURNR
	FLIPX = FLIPX
	FLIPY = FLIPY

	boardtype = {
		expandup: [REDUCE | UP, EXPAND | UP],
		expanddn: [REDUCE | DN, EXPAND | DN],
		expandlt: [REDUCE | LT, EXPAND | LT],
		expandrt: [REDUCE | RT, EXPAND | RT],
		reduceup: [EXPAND | UP, REDUCE | UP],
		reducedn: [EXPAND | DN, REDUCE | DN],
		reducelt: [EXPAND | LT, REDUCE | LT],
		reducert: [EXPAND | RT, REDUCE | RT],
		turnl: [TURN | 2, TURN | 1],
		turnr: [TURN | 1, TURN | 2],
		flipy: [FLIP | 2, FLIP | 2],
		flipx: [FLIP | 1, FLIP | 1]
	} as const

	// expand/reduce処理用
	qnumw: number[][] = []// ques==51の回転･反転用
	qnumh: number[][] = []	// ques==51の回転･反転用

	// expand/reduce処理で消える/増えるオブジェクトの判定用
	insex: Record<IGroup, Record<number, boolean>> = {
		cell: { 1: true },
		cross: {},	/* Board初期化時に設定します */
		border: { 1: true, 2: true },
		excell: { 1: true }
	}

	puzzle: Puzzle<TBoard>
	get board(): TBoard {
		return this.puzzle.board
	}
	constructor(puzzle: Puzzle<TBoard>, option?: any) {
		this.puzzle = puzzle;
		Object.assign(this, option)
	}

	//------------------------------------------------------------------------------
	// bd.exec.execadjust()   盤面の調整、回転、反転で対応する関数へジャンプする
	// bd.exec.execadjust_main() 盤面の調整、回転、反転処理の実行部
	//------------------------------------------------------------------------------
	execadjust(name: IBoardOperation) {
		if (!this.boardtype[name]) { return; }

		const puzzle = this.puzzle;
		const bd = this.board;
		if (name.indexOf("reduce") === 0) {
			if (name === "reduceup" || name === "reducedn") {
				if (bd.rows <= 1) { return; }
			}
			else if (name === "reducelt" || name === "reducert") {
				if (bd.cols <= 1) { return; }
			}
		}

		puzzle.opemgr.newOperation();

		puzzle.painter.suspendAll();

		// undo/redo時はexecadjust_mainを直接呼びます
		const d = { x1: 0, y1: 0, x2: 2 * bd.cols, y2: 2 * bd.rows }; // TURNFLIPには範囲が必要
		this.execadjust_main(this.boardtype[name][1], d);
		this.addOpe(d, name);


		bd.setminmax();
		bd.rebuildInfo();

		// Canvasを更新する
		puzzle.painter.resizeCanvas();
		puzzle.emit('adjust');
		puzzle.painter.unsuspend();
	}
	execadjust_main(key: number, d: IRange) {
		const bd = this.board;
		this.adjustBoardData(key, d);

		if (bd.roommgr.hastop && (key & REDUCE)) { this.reduceRoomNumber(key, d); }

		if (key & TURN) {
			const tmp = bd.cols; bd.cols = bd.rows; bd.rows = tmp;
			d = { x1: 0, y1: 0, x2: 2 * bd.cols, y2: 2 * bd.rows };
		}
		else if (key & EXPAND) {
			if (key === EXPANDUP || key === EXPANDDN) { bd.rows++; }
			else if (key === EXPANDLT || key === EXPANDRT) { bd.cols++; }
		}

		// main operation
		(['cell', 'cross', 'border', 'excell'] as IGroup[]).forEach(function (group) {
			if (key & EXPAND) { bd.exec.expandGroup(group, key); }
			else if (key & REDUCE) { bd.exec.reduceGroup(group, key); }
			else { bd.exec.turnflipGroup(group, key, d); }
		});

		if (key & REDUCE) {
			if (key === REDUCEUP || key === REDUCEDN) { bd.rows--; }
			else if (key === REDUCELT || key === REDUCERT) { bd.cols--; }
		}
		bd.setposAll();

		this.adjustBoardData2(key, d);
	}

	//------------------------------------------------------------------------------
	// bd.exec.addOpe() 指定された盤面(拡大・縮小, 回転・反転)操作を追加する
	//------------------------------------------------------------------------------
	addOpe(d: IRange, name: IBoardOperation) {
		const key = this.boardtype[name][1];
		const puzzle = this.puzzle;
		let ope: Operation;
		if (key & TURNFLIP) { ope = new BoardFlipOperation(this.puzzle, d, name); }
		else { ope = new BoardAdjustOperation(this.puzzle, name); }
		puzzle.opemgr.add(ope);
	}

	//------------------------------------------------------------------------------
	// bd.exec.expandGroup()  オブジェクトの追加を行う
	// bd.exec.reduceGroup()  オブジェクトの消去を行う
	// bd.exec.isdel()        消去されるオブジェクトかどうか判定する
	//------------------------------------------------------------------------------
	expandGroup(group: IGroup, key: number) {
		const bd = this.board;
		let margin = bd.initGroup(group, bd.cols, bd.rows);
		const groups = bd.getGroup(group);
		const groups2 = groups.clone();
		bd.setposGroup(group);
		for (let i = groups.length - 1; i >= 0; i--) {
			let piece = groups[i];
			if (this.isdel(key, piece)) {
				piece = bd.newObject(group, i);
				groups[i] = piece;
				groups2.add(piece);
				margin--;
			}
			else if (margin > 0) { groups[i] = groups[i - margin]; }
		}
		groups2.allclear(false);

		if (group === 'border') { this.expandborder(key); }
	}
	reduceGroup(group: IGroup, key: number) {
		const bd = this.board;
		if (group === 'border') { this.reduceborder(key); }

		let margin = 0;
		const groups = bd.getGroup(group);
		const groups2 = groups.clone();
		for (let i = 0; i < groups.length; i++) {
			const piece = groups[i];
			if (this.isdel(key, piece)) {
				piece.id = i;
				groups2.add(piece);
				margin++;
			}
			else if (margin > 0) { groups[i - margin] = groups[i]; }
		}
		const opemgr = this.puzzle.opemgr;
		if (!opemgr.undoExec && !opemgr.redoExec) {
			opemgr.forceRecord = true;
			groups2.allclear(true);
			opemgr.forceRecord = false;
		}
		for (let i = 0; i < margin; i++) { groups.pop(); }
	}
	isdel(key: number, piece: BoardPiece): boolean {
		return !!this.insex[piece.group][this.distObj(key, piece)];
	}

	//------------------------------------------------------------------------------
	// bd.exec.turnflipGroup() execadjust_main()から内部的に呼ばれる回転反転実行部
	//------------------------------------------------------------------------------
	turnflipGroup(group: IGroup, key: number, d: IRange) {
		const bd = this.board;
		if (group === 'excell') {
			if (bd.hasexcell === 1 && (key & FLIP)) {
				const d2 = { x1: d.x1, y1: d.y1, x2: d.x2, y2: d.y2 };
				if (key === FLIPY) { d2.x1 = d2.x2 = -1; }
				else if (key === FLIPX) { d2.y1 = d2.y2 = -1; }
				d = d2;
			}
			else if (bd.hasexcell === 2) {
				d = { x1: -1, y1: -1, x2: d.x2 + 1, y2: d.y2 + 1 };
			}
		}

		const objlist = bd.objectinside(group, d.x1, d.y1, d.x2, d.y2);
		const converted: Record<number, any> = {};
		const xx = (d.x1 + d.x2);
		const yy = (d.y1 + d.y2);
		for (let i = 0; i < objlist.length; i++) {
			const obj = objlist[i];
			let id = -1;
			switch (key) {
				case FLIPY: id = bd.getObjectPos(group, obj.bx, yy - obj.by).id; break;
				case FLIPX: id = bd.getObjectPos(group, xx - obj.bx, obj.by).id; break;
				case TURNL: id = bd.getObjectPos(group, obj.by, yy - obj.bx).id; break;
				case TURNR: id = bd.getObjectPos(group, xx - obj.by, obj.bx).id; break;
				default: new Error("key is invalid"); break;
			}
			converted[id] = obj;
		}

		const groups = bd.getGroup(group);
		for (const n in converted) { groups[+n] = converted[n]; }
	}

	//---------------------------------------------------------------------------
	// bd.exec.distObj()      上下左右いずれかの外枠との距離を求める
	//---------------------------------------------------------------------------
	distObj(key: number, piece: BoardPiece) {
		const bd = this.board;
		if (piece.isnull) { return -1; }

		key &= 0x0F;
		if (key === UP) { return piece.by; }
		if (key === DN) { return 2 * bd.rows - piece.by; }
		if (key === LT) { return piece.bx; }
		if (key === RT) { return 2 * bd.cols - piece.bx; }
		return -1;
	}

	//---------------------------------------------------------------------------
	// bd.exec.expandborder() 盤面の拡大時、境界線を伸ばす
	// bd.exec.reduceborder() 盤面の縮小時、線を移動する
	//---------------------------------------------------------------------------
	expandborder(key: number) {
		const bd = this.board;
		const bdAsLine = bd.borderAsLine;
		// borderAsLineじゃないUndo時は、後でオブジェクトを代入するので下の処理はパス
		if (bdAsLine || !bd.puzzle.opemgr.undoExec) {
			const group2 = new BorderList();
			// 直前のexpandGroupで、bx,byプロパティが不定なままなので設定する
			bd.setposBorders();

			const dist = (bdAsLine ? 2 : 1);
			for (let id = 0; id < bd.border.length; id++) {
				const border = bd.border[id];
				if (this.distObj(key, border) !== dist) { continue; }

				const source = (bdAsLine ? this.outerBorder(id, key) : this.innerBorder(id, key));
				this.copyBorder(border, source);
				group2.add(source);
			}
			if (bdAsLine) { group2.allclear(false); }
		}
	}
	reduceborder(key: number) {
		const bd = this.board;
		if (bd.borderAsLine) {
			for (let id = 0; id < bd.border.length; id++) {
				const border = bd.border[id];
				if (this.distObj(key, border) !== 0) { continue; }

				const source = this.innerBorder(id, key);
				this.copyBorder(border, source);
			}
		}
	}

	//---------------------------------------------------------------------------
	// bd.exec.copyBorder()   (expand/reduceBorder用) 指定したデータをコピーする
	// bd.exec.innerBorder()  (expand/reduceBorder用) ひとつ内側に入ったborderのidを返す
	// bd.exec.outerBorder()  (expand/reduceBorder用) ひとつ外側に行ったborderのidを返す
	//---------------------------------------------------------------------------
	copyBorder(border1: Border, border2: Border) {
		border1.ques = border2.ques;
		border1.qans = border2.qans;
		if (this.board.borderAsLine) {
			border1.line = border2.line;
			border1.qsub = border2.qsub;
		}
	}
	innerBorder(id: number, key: number) {
		const border = this.board.border[id];
		key &= 0x0F;
		if (key === UP) { return border.relbd(0, 2); }
		if (key === DN) { return border.relbd(0, -2); }
		if (key === LT) { return border.relbd(2, 0); }
		if (key === RT) { return border.relbd(-2, 0); }
		throw new Error(`key is invalid`)
	}
	outerBorder(id: number, key: number) {
		const border = this.board.border[id];
		key &= 0x0F;
		if (key === UP) { return border.relbd(0, -2); }
		if (key === DN) { return border.relbd(0, 2); }
		if (key === LT) { return border.relbd(-2, 0); }
		if (key === RT) { return border.relbd(2, 0); }
		throw new Error(`key is invalid`)
	}

	//---------------------------------------------------------------------------
	// bd.exec.reduceRoomNumber()   盤面縮小時に数字つき部屋の処理を行う
	//---------------------------------------------------------------------------
	reduceRoomNumber(key: number, d: IRange) {
		const qnums = [];
		const bd = this.board;
		for (let c = 0; c < bd.cell.length; c++) {
			const cell = bd.cell[c];
			if (!!this.insex.cell[this.distObj(key, cell)]) {
				if (cell.qnum !== -1) {
					qnums.push({ cell: cell, area: cell.room, pos: [cell.bx, cell.by], val: cell.qnum });
					cell.qnum = -1;
				}
				cell.room.clist.remove(cell);
			}
		}
		for (let i = 0; i < qnums.length; i++) {
			const data = qnums[i];
			const area = data.area;
			const tcell = area.clist.getTopCell()!;
			if (tcell.isnull) {
				const opemgr = this.puzzle.opemgr;
				if (!opemgr.undoExec && !opemgr.redoExec) {
					opemgr.forceRecord = true;
					data.cell.addOpe('qnum', data.val, -1);
					opemgr.forceRecord = false;
				}
			}
			else {
				tcell.qnum = data.val;
			}
		}
	}

	//------------------------------------------------------------------------------
	// bd.exec.adjustBoardData()    回転・反転開始前に各セルの調節を行う(共通処理)
	// bd.exec.adjustBoardData2()   回転・反転終了後に各セルの調節を行う(共通処理)
	//------------------------------------------------------------------------------
	adjustBoardData(key: number, d: IRange) { }
	adjustBoardData2(key: number, d: IRange) { }

	//------------------------------------------------------------------------------
	// bd.exec.adjustBoardData()    回転・反転開始前に各セルの調節を行う(共通処理)
	// bd.exec.adjustBoardData2()   回転・反転終了後に各セルの調節を行う(共通処理)
	//   から呼び出される共通関数
	//------------------------------------------------------------------------------

	//------------------------------------------------------------------------------
	// bd.exec.adjustNumberArrow()  回転・反転開始前の矢印つき数字の調整
	// bd.exec.adjustCellArrow()    回転・反転開始前の矢印セルの調整
	// bd.exec.adjustBorderArrow()  回転・反転開始前の境界線にある矢印セル等の調整
	//------------------------------------------------------------------------------
	adjustNumberArrow(key: number, d: IRange) {
		if (key & TURNFLIP) {
			this.adjustCellQdirArrow(key, d);
		}
	}
	adjustCellArrow(key: number, d: IRange) {
		if (key & TURNFLIP) {
			if (this.board.createCell().numberAsObject) {
				this.adjustCellQnumArrow(key, d);
			}
			else {
				this.adjustCellQdirArrow(key, d);
			}
		}
	}
	adjustCellQdirArrow(key: number, d: IRange) {
		const trans = this.getTranslateDir(key);
		const clist = this.board.cellinside(d.x1, d.y1, d.x2, d.y2);
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			const val = trans[cell.qdir]; if (!!val) { cell.setQdir(val); }
		}
	}
	adjustCellQnumArrow(key: number, d: IRange) {
		const trans = this.getTranslateDir(key);
		const clist = this.board.cellinside(d.x1, d.y1, d.x2, d.y2);
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			const val = trans[cell.qnum]; if (!!val) { cell.setQnum(val); }
			const vala = trans[cell.anum]; if (!!vala) { cell.setAnum(vala); }
		}
	}

	adjustBorderArrow(key: number, d: IRange) {
		if (key & TURNFLIP) {
			const trans = this.getTranslateDir(key);
			const blist = this.board.borderinside(d.x1, d.y1, d.x2, d.y2);
			for (let i = 0; i < blist.length; i++) {
				const border = blist[i];
				let val: number;
				val = trans[border.qdir]; if (!!val) { border.setQdir(val); }
			}
		}
	}
	getTranslateDir(key: number): Record<number, number> {
		let trans = {};
		switch (key) {
			case FLIPY: trans = { 1: 2, 2: 1 }; break;			// 上下反転
			case FLIPX: trans = { 3: 4, 4: 3 }; break;			// 左右反転
			case TURNR: trans = { 1: 4, 2: 3, 3: 1, 4: 2 }; break;	// 右90°回転
			case TURNL: trans = { 1: 3, 2: 4, 3: 2, 4: 1 }; break;	// 左90°回転
		}
		return trans;
	}

	//------------------------------------------------------------------------------
	// bd.exec.adjustQues51_1()     回転・反転開始前の[＼]セルの調整
	// bd.exec.adjustQues51_2()     回転・反転終了後の[＼]セルの調整
	//------------------------------------------------------------------------------
	adjustQues51_1(key: number, d: IRange) {
		const bx1 = (d.x1 | 1);
		const by1 = (d.y1 | 1);
		this.qnumw = [];
		this.qnumh = [];

		const bd = this.board;
		for (let by = by1; by <= d.y2; by += 2) {
			this.qnumw[by] = [bd.getex(-1, by).qnum];
			for (let bx = bx1; bx <= d.x2; bx += 2) {
				const cell = bd.getc(bx, by);
				if (cell.is51cell()) { this.qnumw[by].push(cell.qnum); }
			}
		}
		for (let bx = bx1; bx <= d.x2; bx += 2) {
			this.qnumh[bx] = [bd.getex(bx, -1).qnum2];
			for (let by = by1; by <= d.y2; by += 2) {
				const cell = bd.getc(bx, by);
				if (cell.is51cell()) { this.qnumh[bx].push(cell.qnum2); }
			}
		}
	}
	adjustQues51_2(key: number, d: IRange) {
		const xx = (d.x1 + d.x2);
		const yy = (d.y1 + d.y2);
		const bx1 = (d.x1 | 1);
		const by1 = (d.y1 | 1);
		let idx: number;

		const bd = this.board;
		bd.disableInfo();
		switch (key) {
			case FLIPY: // 上下反転
				for (let bx = bx1; bx <= d.x2; bx += 2) {
					idx = 1; this.qnumh[bx] = this.qnumh[bx].reverse();
					bd.getex(bx, -1).setQnum2(this.qnumh[bx][0]);
					for (let by = by1; by <= d.y2; by += 2) {
						const cell = bd.getc(bx, by);
						if (cell.is51cell()) { cell.setQnum2(this.qnumh[bx][idx]); idx++; }
					}
				}
				break;

			case FLIPX: // 左右反転
				for (let by = by1; by <= d.y2; by += 2) {
					idx = 1; this.qnumw[by] = this.qnumw[by].reverse();
					bd.getex(-1, by).setQnum(this.qnumw[by][0]);
					for (let bx = bx1; bx <= d.x2; bx += 2) {
						const cell = bd.getc(bx, by);
						if (cell.is51cell()) { cell.setQnum(this.qnumw[by][idx]); idx++; }
					}
				}
				break;

			case TURNR: // 右90°反転
				for (let by = by1; by <= d.y2; by += 2) {
					idx = 1; this.qnumh[by] = this.qnumh[by].reverse();
					bd.getex(-1, by).setQnum(this.qnumh[by][0]);
					for (let bx = bx1; bx <= d.x2; bx += 2) {
						const cell = bd.getc(bx, by);
						if (cell.is51cell()) { cell.setQnum(this.qnumh[by][idx]); idx++; }
					}
				}
				for (let bx = bx1; bx <= d.x2; bx += 2) {
					idx = 1;
					bd.getex(bx, -1).setQnum2(this.qnumw[xx - bx][0]);
					for (let by = by1; by <= d.y2; by += 2) {
						const cell = bd.getc(bx, by);
						if (cell.is51cell()) { cell.setQnum2(this.qnumw[xx - bx][idx]); idx++; }
					}
				}
				break;

			case TURNL: // 左90°反転
				for (let by = by1; by <= d.y2; by += 2) {
					idx = 1;
					bd.getex(-1, by).setQnum(this.qnumh[yy - by][0]);
					for (let bx = bx1; bx <= d.x2; bx += 2) {
						const cell = bd.getc(bx, by);
						if (cell.is51cell()) { cell.setQnum(this.qnumh[yy - by][idx]); idx++; }
					}
				}
				for (let bx = bx1; bx <= d.x2; bx += 2) {
					idx = 1; this.qnumw[bx] = this.qnumw[bx].reverse();
					bd.getex(bx, -1).setQnum2(this.qnumw[bx][0]);
					for (let by = by1; by <= d.y2; by += 2) {
						const cell = bd.getc(bx, by);
						if (cell.is51cell()) { cell.setQnum2(this.qnumw[bx][idx]); idx++; }
					}
				}
				break;
		}
		bd.enableInfo();
	}

	//------------------------------------------------------------------------------
	// bd.exec.getAfterPos()  回転・反転開始前のIN/OUTなどの位置の調整
	//------------------------------------------------------------------------------
	getAfterPos(key: number, d: IRange, piece: BoardPiece) {
		const puzzle = this.puzzle;
		const bd = puzzle.board;
		const xx = (d.x1 + d.x2);
		const yy = (d.y1 + d.y2);
		const bx1 = piece.bx;
		const by1 = piece.by;
		let bx2: number;
		let by2: number;
		switch (key) {
			case FLIPY: bx2 = bx1; by2 = yy - by1; break;
			case FLIPX: bx2 = xx - bx1; by2 = by1; break;
			case TURNR: bx2 = yy - by1; by2 = bx1; break;
			case TURNL: bx2 = by1; by2 = xx - bx1; break;
			case EXPANDUP: bx2 = bx1; by2 = by1 + (by1 === bd.minby ? 0 : 2); break;
			case EXPANDDN: bx2 = bx1; by2 = by1 + (by1 === bd.maxby ? 2 : 0); break;
			case EXPANDLT: bx2 = bx1 + (bx1 === bd.minbx ? 0 : 2); by2 = by1; break;
			case EXPANDRT: bx2 = bx1 + (bx1 === bd.maxbx ? 2 : 0); by2 = by1; break;
			case REDUCEUP: bx2 = bx1; by2 = by1 - (by1 <= bd.minby + 2 ? 0 : 2); break;
			case REDUCEDN: bx2 = bx1; by2 = by1 - (by1 >= bd.maxby - 2 ? 2 : 0); break;
			case REDUCELT: bx2 = bx1 - (bx1 <= bd.minbx + 2 ? 0 : 2); by2 = by1; break;
			case REDUCERT: bx2 = bx1 - (bx1 >= bd.maxbx - 2 ? 2 : 0); by2 = by1; break;
			default: bx2 = bx1; by2 = by1; break;
		}

		return { pos: new Address(this.puzzle, bx2, by2), isdel: this.isdel(key, piece) };
	}
}