// Address.js v3.4.1

import type { Board } from "./Board"
import type { Puzzle } from "./Puzzle"

import type { IDir } from "./Piece"
//----------------------------------------------------------------------------
// ★Positionクラス Address, Pieceクラスのベースクラス
//---------------------------------------------------------------------------
export class Position {
	bx: number = null!
	by: number = null!

	// 方向を表す定数
	NDIR = 0	// 方向なし
	UP: IDir = 1	// up, top
	DN: IDir = 2	// down, bottom
	LT: IDir = 3	// left
	RT: IDir = 4	// right
	board: Board
	puzzle: Puzzle

	constructor(puzzle: Puzzle) {
		this.board = puzzle.board;
		this.puzzle = puzzle;
	}

	//---------------------------------------------------------------------------
	// pos.equals() 同じ位置にあるかどうか判定する
	//---------------------------------------------------------------------------
	equals(pos: Position) {
		return (this.bx === pos.bx && this.by === pos.by);
	}

	//---------------------------------------------------------------------------
	// pos.getaddr() 位置をAddressクラスのオブジェクトで取得する
	//---------------------------------------------------------------------------
	getaddr() {
		return (new Address(this.puzzle, this.bx, this.by));
	}

	//---------------------------------------------------------------------------
	// relcell(), relcross(), relbd(), relexcell(), relobj() 相対位置に存在するオブジェクトを返す
	//---------------------------------------------------------------------------
	relcell(dx: number, dy: number) { return this.board.getc(this.bx + dx, this.by + dy); }
	relcross(dx: number, dy: number) { return this.board.getx(this.bx + dx, this.by + dy); }
	relbd(dx: number, dy: number) { return this.board.getb(this.bx + dx, this.by + dy); }
	relexcell(dx: number, dy: number) { return this.board.getex(this.bx + dx, this.by + dy); }
	relobj(dx: number, dy: number) { return this.board.getobj(this.bx + dx, this.by + dy); }

	//---------------------------------------------------------------------------
	// reldirbd()  指定された方向にいるオブジェクトを返す
	//---------------------------------------------------------------------------
	reldirbd(dir: number, dd: number) { return this.getaddr().movedir(dir, dd).getb(); }

	//---------------------------------------------------------------------------
	// pos.draw() 盤面に自分の周囲を描画する
	// pos.drawaround() 盤面に自分の周囲1マスを含めて描画する
	//---------------------------------------------------------------------------
	draw() {
		this.puzzle.painter.paintRange(this.bx - 1, this.by - 1, this.bx + 1, this.by + 1);
	}
	drawaround() {
		this.puzzle.painter.paintRange(this.bx - 3, this.by - 3, this.bx + 3, this.by + 3);
	}

	//---------------------------------------------------------------------------
	// pos.isinside() この場所が盤面内かどうか判断する
	//---------------------------------------------------------------------------
	isinside() {
		const bd = this.board;
		return (this.bx >= bd.minbx && this.bx <= bd.maxbx &&
			this.by >= bd.minby && this.by <= bd.maxby);
	}

	//---------------------------------------------------------------------------
	// pos.getdir() 指定されたPositionがどの方向にいるか判定する
	// pos.getvert() 指定されたPositionが縦か横か判定する
	//---------------------------------------------------------------------------
	getdir(pos: Address, diff: number) {
		const dx = (pos.bx - this.bx);
		const dy = (pos.by - this.by);
		if (dx === 0 && dy === -diff) { return this.UP; }
		if (dx === 0 && dy === diff) { return this.DN; }
		if (dx === -diff && dy === 0) { return this.LT; }
		if (dx === diff && dy === 0) { return this.RT; }
		return this.NDIR;
	}
	getvert(pos: Address, diff: number) {
		const dir = this.getdir(pos, diff);
		if (dir === this.UP || dir === this.DN) { return true; }
		if (dir === this.LT || dir === this.RT) { return false; }
		return void 0;
	}

	//---------------------------------------------------------------------------
	// pos.getnb()         上下左右に隣接する境界線のIDを取得する
	// pos.getborderobj()  入力対象となる境界線オブジェクトを取得する
	//---------------------------------------------------------------------------
	getnb(pos: Position) {
		if (pos.bx - this.bx === 0 && pos.by - this.by === -2) { return this.relbd(0, -1); }
		if (pos.bx - this.bx === 0 && pos.by - this.by === 2) { return this.relbd(0, 1); }
		if (pos.bx - this.bx === -2 && pos.by - this.by === 0) { return this.relbd(-1, 0); }
		if (pos.bx - this.bx === 2 && pos.by - this.by === 0) { return this.relbd(1, 0); }
		return this.board.emptyborder;
	}
	getborderobj(pos: Address) {
		if (((pos.bx & 1) === 0 && this.bx === pos.bx && Math.abs(this.by - pos.by) === 1) ||
			((pos.by & 1) === 0 && this.by === pos.by && Math.abs(this.bx - pos.bx) === 1)) {
			//@ts-ignore
			return (this.onborder() ? this : pos).getb();
		}
		return this.board.nullobj;
	}

	onborder() {
		return false;
	}
}

//----------------------------------------------------------------------------
// ★Addressクラス (bx,by)座標を扱う
//---------------------------------------------------------------------------
export class Address extends Position {
	constructor(puzzle: Puzzle, bx?: number, by?: number) {
		super(puzzle);
		if (bx != null && by != null) { this.init(bx, by); }
	}

	reset() { this.bx = null!; this.by = null!; }
	clone() { return (new Address(this.puzzle, this.bx, this.by)); } // todo

	set<T extends { bx: number, by: number }>(addr: T) { this.bx = addr.bx; this.by = addr.by; return this; }
	init(bx: number, by: number) { this.bx = bx; this.by = by; return this; }
	move(dx: number, dy: number) { this.bx += dx; this.by += dy; return this; }

	//---------------------------------------------------------------------------
	// oncell(), oncross(), onborder()  オブジェクトが存在する位置にいるかどうかを返す
	//---------------------------------------------------------------------------
	oncell() { return !!((this.bx & 1) && (this.by & 1)); }
	oncross() { return !!(!(this.bx & 1) && !(this.by & 1)); }
	onborder() { return !!((this.bx + this.by) & 1); }

	//---------------------------------------------------------------------------
	// getc(), getx(), getb(), getex(), getobj() Positionに存在するオブジェクトを返す
	//---------------------------------------------------------------------------
	getc() { return this.board.getc(this.bx, this.by); }
	getx() { return this.board.getx(this.bx, this.by); }
	getb() { return this.board.getb(this.bx, this.by); }
	getex() { return this.board.getex(this.bx, this.by); }
	getobj() { return this.board.getobj(this.bx, this.by); }

	//---------------------------------------------------------------------------
	// addr.movedir() 指定した方向に指定した数移動する
	//---------------------------------------------------------------------------
	movedir(dir: number, dd: number) {
		switch (dir) {
			case this.UP: this.by -= dd; break;
			case this.DN: this.by += dd; break;
			case this.LT: this.bx -= dd; break;
			case this.RT: this.bx += dd; break;
		}
		return this;
	}
}

//----------------------------------------------------------------------------
// ★RawAddressクラス (bx,by)座標を扱う ※端数あり
//---------------------------------------------------------------------------

export class RawAddress extends Address { }