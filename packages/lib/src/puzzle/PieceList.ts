// PieceList.js v3.4.1
import type { Puzzle } from "./Puzzle";
import { Board } from "./Board";
import type { Cell, Cross, Border, EXCell, BoardPiece } from "./Piece";


//----------------------------------------------------------------------------
// ★PieceListクラス オブジェクトの配列を扱う
//---------------------------------------------------------------------------
export class PieceList<T extends BoardPiece> extends Array<T> {

	constructor(list?: T[] | number) {
		super()
		if (!!list && typeof list !== "number") { this.extend(list); }
	}

	clone() {
		//@ts-ignore
		return new this.constructor() as PieceList<T>;
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
	override filter(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): this {
		return super.filter(predicate, thisArg) as any
	}

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
		const idx = this.indexOf(piece);
		if (idx >= 0) { this.splice(idx, 1); }
	}

	//--------------------------------------------------------------------------------
	// list.seterr()   保持しているオブジェクトにerror値を設定する
	// list.setnoerr() エラー値が設定されていないオブジェクトにerror=-1を設定する
	// list.setinfo()  保持しているオブジェクトにqinfo値を設定する
	//--------------------------------------------------------------------------------
	seterr(num: number) {
		for (let i = 0; i < this.length; i++) {
			this[i].seterr(num)
		}
	}
	setnoerr() {
		for (let i = 0; i < this.length; i++) {
			this[i].setnoerr()
		}
	}
	setinfo(num: number) {
		for (let i = 0; i < this.length; i++) { this[i].qinfo = num; }
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
		const props = (this.length > 0 ? this[0].getproplist(target) : []);
		for (let i = 0; i < this.length; i++) {
			const piece = this[i];
			for (let j = 0; j < props.length; j++) {
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

	// checkCmp:廃止 各GraphComponentに定義してください
	// checkCmp: any = null

	getRectSize() {
		//ロジック変更 バグらないといいなぁ……
		if (this.length === 0) {
			return {
				x1: 0, x2: 0,
				y1: 0, y2: 0,
				cols: 0, rows: 0,
				cnt: 0
			};
		}

		const d = {
			x1: 999, x2: 0,
			y1: 999, y2: 0,
			cols: 0, rows: 0,
			cnt: 0
		};
		for (let i = 0; i < this.length; i++) {
			const cell = this[i];
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
		for (let i = 0, len = this.length; i < len; i++) {
			if (this[i].isNum()) { return this[i]; }
		}
		return null;
	}

	//--------------------------------------------------------------------------------
	// clist.getTopCell()  指定されたClistの中で一番左上にあるセルを返す
	//--------------------------------------------------------------------------------
	getTopCell() {
		if (this.length === 0) return null;

		return this.toSorted((a, b) => {
			return a.bx - b.bx
				|| a.by - b.by
		})[0]
	}

	//---------------------------------------------------------------------------
	// clist.eraseLines()  Clistに含まれるlineを消去します
	//---------------------------------------------------------------------------
	eraseLines() {
		// const count = 0;
		// for (let i = 0, len = this.length; i < len; i++) {
		// 	for (let j = i + 1; j < len; j++) {
		// 		//todo
		// 		// var border = this.puzzle.mouse.getnb(this[i].getaddr(), this[j].getaddr());
		// 		// if (!border.isnull) { border.removeLine(); count++; }
		// 	}
		// }
		//if (count > 0) { this.draw(); }
	}

	//---------------------------------------------------------------------------
	// clist.draw()   盤面に自分の周囲を描画する
	//---------------------------------------------------------------------------
	// draw() {
	// 	const d = this.getRectSize();
	// 	this.puzzle.painter.paintRange(d.x1 - 1, d.y1 - 1, d.x2 + 1, d.y2 + 1);
	// }

	getDeparture() { return new CellList(this.map(function (cell) { return cell.base; })).notnull() }
}

//----------------------------------------------------------------------------
// ★CrossListクラス Crossの配列を扱う
//---------------------------------------------------------------------------
export class CrossList<TCross extends Cross = Cross> extends PieceList<TCross> { }

//----------------------------------------------------------------------------
// ★BorderListクラス Borderの配列を扱う
//---------------------------------------------------------------------------
export class BorderList<TBorder extends Border = Border> extends PieceList<TBorder> {
	//---------------------------------------------------------------------------
	// blist.cellinside()  線が重なるセルのリストを取得する
	// blist.crossinside() 線が重なる交点のリストを取得する
	//---------------------------------------------------------------------------
	cellinside() {
		const clist = new CellList();
		const pushed = [];
		for (let i = 0; i < this.length; i++) {
			const border = this[i];
			const cell1 = border.sidecell[0];
			const cell2 = border.sidecell[1];
			if (!cell1.isnull && pushed[cell1.id] !== true) { clist.add(cell1 as Cell); pushed[cell1.id] = true; }
			if (!cell2.isnull && pushed[cell2.id] !== true) { clist.add(cell2 as Cell); pushed[cell2.id] = true; }
		}
		return clist;
	}
	crossinside() {
		const clist = new CrossList();
		const pushed = [];
		for (let i = 0; i < this.length; i++) {
			const border = this[i];
			const cross1 = border.sidecross[0];
			const cross2 = border.sidecross[1];
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
