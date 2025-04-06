// PieceList.js v3.4.1
import { Puzzle } from "./Puzzle";
import { Board } from "./Board";
import { Cell, Cross, Border, EXCell, BoardPiece } from "./Piece";


//----------------------------------------------------------------------------
// ★PieceListクラス オブジェクトの配列を扱う
//---------------------------------------------------------------------------
export class PieceList<T extends BoardPiece> extends Array<T> {

	puzzle: Puzzle
	constructor(puzzle: Puzzle, list: T[] = null) {
		super()
		this.puzzle = puzzle;
		if (!!list) { this.extend(list); }
	}

	clone() {
		//@ts-ignore
		return new this.constructor(this.puzzle) as PieceList<T>;
	}

	//--------------------------------------------------------------------------------
	// ☆Arrayオブジェクト関連の関数
	// list.add()      与えられたオブジェクトを配列の末尾に追加する(push()相当)
	// list.extend()   与えられたPieceListを配列の末尾に追加する
	// list.pop()      配列の最後のオブジェクトを取り除いて返す
	//--------------------------------------------------------------------------------
	add = this.push
	extend(list: Array<T>) {
		this.push(...list)
	}

	//--------------------------------------------------------------------------------
	// ☆Arrayオブジェクトiterator関連の関数
	// list.each()     全てのオブジェクトに指定された関数を実行する
	// list.some()     条件がtrueとなるオブジェクトが存在するか判定する
	//--------------------------------------------------------------------------------
	each = Array.prototype.forEach

	//--------------------------------------------------------------------------------
	// list.filter()   条件がtrueとなるオブジェクトを抽出したclistを新たに作成する
	// list.notnull()  nullではないオブジェクトを抽出したclistを新たに作成する
	//--------------------------------------------------------------------------------
	/* constructorが変わってしまうので、Array.prototypeが使用できない */

	notnull() { return this.filter(function (piece) { return !piece.isnull; }); }


	//--------------------------------------------------------------------------------
	// list.map()      clistの各要素に指定された関数を適用したclistを新たに作成する
	//--------------------------------------------------------------------------------
	/* constructorが変わってしまうので、Array.prototypeが使用できない */
	// map : function(changer){
	// 	var list = new this.constructor(), len = list.length = this.length;
	// 	for(var i=0;i<len;i++){ list[i] = changer(this[i]);}
	// 	return list;
	// }

	//--------------------------------------------------------------------------------
	// list.indexOf()  与えられたオブジェクトの配列上の位置を取得する
	// list.include()  与えられたオブジェクトが配列に存在するか判定する
	// list.remove()   与えられたオブジェクトを配列から取り除く
	//--------------------------------------------------------------------------------
	// indexOf : Array.prototype.indexOf,
	// include : function(target){ return this.indexOf(target)>=0;},
	remove(piece: T) {
		var idx = this.indexOf(piece);
		if (idx >= 0) { this.splice(idx, 1); }
	}

	//--------------------------------------------------------------------------------
	// list.seterr()   保持しているオブジェクトにerror値を設定する
	// list.setnoerr() エラー値が設定されていないオブジェクトにerror=-1を設定する
	// list.setinfo()  保持しているオブジェクトにqinfo値を設定する
	//--------------------------------------------------------------------------------
	seterr(num: number) {
		if (!this.puzzle.board.isenableSetError()) { return; }
		for (var i = 0; i < this.length; i++) { this[i].error = num; }
	}
	setnoerr() {
		if (!this.puzzle.board.isenableSetError()) { return; }
		for (var i = 0; i < this.length; i++) {
			if (this[i].error === 0) { this[i].error = -1; }
		}
	}
	setinfo(num: number) {
		for (var i = 0; i < this.length; i++) { this[i].qinfo = num; }
	}

	//---------------------------------------------------------------------------
	// list.allclear() 位置,描画情報以外をクリアする
	// list.ansclear() qans,anum,line,qsub,error情報をクリアする
	// list.subclear() qsub,error情報をクリアする
	// list.errclear() error情報をクリアする
	// list.trialclear() Trial情報をクリアする
	// list.propsclear() 4つの共通処理
	//---------------------------------------------------------------------------
	/* undo,redo以外で盤面縮小やったときは, isrec===true */
	allclear(isrec = false) { this.propsclear(['ques', 'ans', 'sub', 'info'], isrec); }
	ansclear() { this.propsclear(['ans', 'sub', 'info'], true); }
	subclear() { this.propsclear(['sub', 'info'], true); }
	errclear() { this.propsclear(['info'], false); }
	trialclear() { this.propsclear(['trial'], false); }
	propsclear(target: ("ques" | "ans" | "sub" | "info" | "trial")[], isrec: boolean) {
		var props = (this.length > 0 ? this[0].getproplist(target) : []);
		for (var i = 0; i < this.length; i++) {
			var piece = this[i];
			for (var j = 0; j < props.length; j++) {
				piece.propclear(props[j], isrec);
			}
		}
	}
}

//----------------------------------------------------------------------------
// ★CellListクラス Cellの配列を扱う
//---------------------------------------------------------------------------
export class CellList<T extends Cell = Cell> extends PieceList<T> {
	//---------------------------------------------------------------------------
	// clist.getRectSize()  指定されたCellのリストの上下左右の端と、セルの数を返す
	//---------------------------------------------------------------------------
	checkCmp: any = null
	getRectSize() {
		var bd = this.puzzle.board;
		var d = { x1: bd.maxbx + 1, x2: bd.minbx - 1, y1: bd.maxby + 1, y2: bd.minby - 1, cols: 0, rows: 0, cnt: 0 };
		for (var i = 0; i < this.length; i++) {
			var cell = this[i];
			if (d.x1 > cell.bx) { d.x1 = cell.bx; }
			if (d.x2 < cell.bx) { d.x2 = cell.bx; }
			if (d.y1 > cell.by) { d.y1 = cell.by; }
			if (d.y2 < cell.by) { d.y2 = cell.by; }
			d.cnt++;
		}
		d.cols = (d.x2 - d.x1 + 2) / 2;
		d.rows = (d.y2 - d.y1 + 2) / 2;
		return d;
	}

	//--------------------------------------------------------------------------------
	// clist.getQnumCell()  指定されたClistの中で一番左上にある数字のあるセルを返す
	//--------------------------------------------------------------------------------
	getQnumCell() {
		for (var i = 0, len = this.length; i < len; i++) {
			if (this[i].isNum()) { return this[i]; }
		}
		return this.puzzle.board.emptycell;
	}

	//--------------------------------------------------------------------------------
	// clist.getTopCell()  指定されたClistの中で一番左上にあるセルを返す
	//--------------------------------------------------------------------------------
	getTopCell() {
		var bd = this.puzzle.board, tcell = null, bx = bd.maxbx, by = bd.maxby;
		for (var i = 0; i < this.length; i++) {
			var cell = this[i];
			if (cell.bx > bx || (cell.bx === bx && cell.by >= by)) { continue; }
			tcell = this[i];
			bx = cell.bx;
			by = cell.by;
		}
		return tcell;
	}

	//---------------------------------------------------------------------------
	// clist.eraseLines()  Clistに含まれるlineを消去します
	//---------------------------------------------------------------------------
	eraseLines() {
		var count = 0;
		for (var i = 0, len = this.length; i < len; i++) {
			for (var j = i + 1; j < len; j++) {
				//todo
				// var border = this.puzzle.mouse.getnb(this[i].getaddr(), this[j].getaddr());
				// if (!border.isnull) { border.removeLine(); count++; }
			}
		}
		if (count > 0) { this.draw(); }
	}

	//---------------------------------------------------------------------------
	// clist.draw()   盤面に自分の周囲を描画する
	//---------------------------------------------------------------------------
	draw() {
		var d = this.getRectSize();
		this.puzzle.painter.paintRange(d.x1 - 1, d.y1 - 1, d.x2 + 1, d.y2 + 1);
	}
}

//----------------------------------------------------------------------------
// ★CrossListクラス Crossの配列を扱う
//---------------------------------------------------------------------------
export class CrossList extends PieceList<Cross> { }

//----------------------------------------------------------------------------
// ★BorderListクラス Borderの配列を扱う
//---------------------------------------------------------------------------
export class BorderList extends PieceList<Border> {
	//---------------------------------------------------------------------------
	// blist.cellinside()  線が重なるセルのリストを取得する
	// blist.crossinside() 線が重なる交点のリストを取得する
	//---------------------------------------------------------------------------
	cellinside() {
		var clist = new CellList(this.puzzle), pushed = [];
		for (var i = 0; i < this.length; i++) {
			var border = this[i], cell1 = border.sidecell[0], cell2 = border.sidecell[1];
			if (!cell1.isnull && pushed[cell1.id] !== true) { clist.add(cell1 as Cell); pushed[cell1.id] = true; }
			if (!cell2.isnull && pushed[cell2.id] !== true) { clist.add(cell2 as Cell); pushed[cell2.id] = true; }
		}
		return clist;
	}
	crossinside() {
		var clist = new CrossList(this.puzzle), pushed = [];
		for (var i = 0; i < this.length; i++) {
			var border = this[i], cross1 = border.sidecross[0], cross2 = border.sidecross[1];
			if (!cross1.isnull && pushed[cross1.id] !== true) { clist.add(cross1); pushed[cross1.id] = true; }
			if (!cross2.isnull && pushed[cross2.id] !== true) { clist.add(cross2); pushed[cross2.id] = true; }
		}
		return clist;
	}
}

//----------------------------------------------------------------------------
// ★EXCellListクラス EXCellの配列を扱う
//---------------------------------------------------------------------------
export class EXCellList extends PieceList<EXCell> { }
