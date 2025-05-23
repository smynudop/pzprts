// Operation.js v3.4.1

import { Position } from "./Address";
import { IGroup, type IGroup2 } from "./Board";
import type { BoardPiece } from "./Piece";
import type { Puzzle } from "./Puzzle";
import type { IBoardOperation, IRange } from "./BoardExec";

// 入力情報管理クラス
// Operationクラス
//---------------------------------------------------------------------------
// ★Operation(派生)クラス 単体の操作情報を保持する
//---------------------------------------------------------------------------
export class Operation<TValue = any> {
	opeid: string = ""
	puzzle: Puzzle
	manager: OperationManager
	old: TValue = null!
	num: TValue = null!
	property: string = ""
	constructor(puzzle: Puzzle) {
		this.puzzle = puzzle
		this.manager = puzzle.opemgr
	}

	reqReset = false

	get board() {
		return this.puzzle.board
	}

	//---------------------------------------------------------------------------
	// ope.setData()  オブジェクトのデータを設定する
	// ope.decode()   ファイル出力された履歴の入力用ルーチン
	// ope.toString() ファイル出力する履歴の出力用ルーチン
	// ope.toJSON()   ファイル保存時に使用するルーチン
	//---------------------------------------------------------------------------
	decode(strs?: string[]) { return false; }
	toString() { return ''; }
	toJSON() { return this.toString(); }

	//---------------------------------------------------------------------------
	// ope.undo()  操作opeを一手前に戻す
	// ope.redo()  操作opeを一手進める
	// ope.exec()  操作opeを反映する
	//---------------------------------------------------------------------------
	undo() { this.exec(this.old); }
	redo() { this.exec(this.num); }
	exec(num: TValue, d?: IRange) { }
	isModify(lastope: this) {
		return false
	}
}

export const isObjectOperation = (ope: Operation | null): ope is ObjectOperation => {
	return ope != null && ope.opeid === "obj"
}
// ObjectOperationクラス
export class ObjectOperation extends Operation<number> {
	override opeid: string = "obj"

	constructor(puzzle: Puzzle, piece: BoardPiece, property: string, old: number, num: number) {
		super(puzzle);
		this.group = piece.group;
		this.property = property;
		this.bx = piece.bx;
		this.by = piece.by;
		this.old = old;
		this.num = num;
		if (property.length > 4 && property.substr(0, 4) === 'snum') {
			this.property = 'snum';
			this.pos = +property.substr(4);
		}
	}
	group: IGroup2
	pos: number | null = null

	/* 変換テーブル */
	STRGROUP = {
		C: 'cell',
		X: 'cross',
		B: 'border',
		E: 'excell'
	} as const
	STRPROP = {
		U: 'ques',
		N: 'qnum',
		Z: 'qnum2',
		C: 'qchar',
		M: 'anum',
		D: 'qdir',
		A: 'qans',
		S: 'qsub',
		K: 'qcmp',
		B: 'snum',
		L: 'line'
	} as const
	bx: number
	by: number

	//---------------------------------------------------------------------------
	// ope.setData()  オブジェクトのデータを設定する
	// ope.decode()   ファイル出力された履歴の入力用ルーチン
	// ope.toString() ファイル出力する履歴の出力用ルーチン
	//---------------------------------------------------------------------------

	override decode(strs: string[]) {
		this.group = this.STRGROUP[strs[0].charAt(0) as keyof typeof this.STRGROUP];
		this.property = this.STRPROP[strs[0].charAt(1) as keyof typeof this.STRPROP];
		if (!this.group || !this.property) { return false; }
		this.pos = ((strs[0].substr(0, 2) === 'CB' && strs[0].length > 2) ? +strs[0].charAt(2) : null);
		this.bx = +strs[1];
		this.by = +strs[2];
		this.old = +strs[3];
		this.num = +strs[4];
		return true;
	}
	override toString() {
		let prefix = '';
		for (const i in this.STRGROUP) { if (this.group === this.STRGROUP[i as keyof typeof this.STRGROUP]) { prefix += i; break; } }
		for (const i in this.STRPROP) { if (this.property === this.STRPROP[i as keyof typeof this.STRPROP]) { prefix += i; break; } }
		if (prefix === 'CB' && this.pos !== null) { prefix += this.pos; }
		return [prefix, this.bx, this.by, this.old, this.num].join(',');
	}

	//---------------------------------------------------------------------------
	// ope.isModify()  前の履歴をこのオブジェクトで更新するかどうか確認する
	//---------------------------------------------------------------------------
	override isModify(lastope: this) {
		// 前回と同じ場所なら前回の更新のみ
		const property = this.property;
		if (lastope.group === this.group &&
			lastope.property === this.property &&
			lastope.num === this.old &&
			lastope.bx === this.bx &&
			lastope.by === this.by &&
			(property === 'qnum' ||
				property === 'qnum2' ||
				property === 'qchar' ||
				property === 'anum' ||
				(property === 'snum' && lastope.pos === this.pos))
		) {
			lastope.num = this.num;
			return true;
		}
		return false;
	}

	//---------------------------------------------------------------------------
	// ope.exec()  操作opeを反映する。ope.undo(),ope.redo()から内部的に呼ばれる
	//---------------------------------------------------------------------------
	override exec(num: number, d?: IRange) {
		const bd = this.puzzle.board;
		const piece = bd.getObjectPos(this.group, this.bx, this.by);
		if (this.group !== piece.group) { return true; }

		if (this.pos === null) {
			piece.setdata(this.property, num);
		}
		else {
			piece.setdata2(this.property, this.pos, num);
		}
		piece.draw();

		switch (this.property) {
			case 'qcmp': bd.cell.each(function (cell) { if (piece === cell.base) { cell.draw(); } }); break;
			case 'qsub': break;
			default: this.puzzle.checker.resetCache(); break;
		}
	}
}

// BoardClearOperationクラス
export class BoardClearOperation extends Operation<any> {
	prefix = 'AC'
	override reqReset = true

	//---------------------------------------------------------------------------
	// ope.decode()   ファイル出力された履歴の入力用ルーチン
	// ope.toString() ファイル出力する履歴の出力用ルーチン
	//---------------------------------------------------------------------------
	override decode(strs: string[]) {
		if (strs[0] !== this.prefix) { return false; }
		return true;
	}
	override toString() {
		return this.prefix;
	}
}

// BoardAdjustOperationクラス
export class BoardAdjustOperation extends Operation<IBoardOperation> {

	constructor(puzzle: Puzzle, ope: IBoardOperation) {
		super(puzzle);
		this.old = ope
		this.num = ope;
	}
	prefix = 'AJ' as const
	override reqReset = true
	//---------------------------------------------------------------------------
	// ope.setData()  オブジェクトのデータを設定する
	// ope.decode()   ファイル出力された履歴の入力用ルーチン
	// ope.toString() ファイル出力する履歴の出力用ルーチン
	//---------------------------------------------------------------------------

	override decode(strs: [string, IBoardOperation]) {
		if (strs[0] !== this.prefix) { return false; }
		this.old = this.num = strs[1];
		return true;
	}
	override toString() {
		return [this.prefix, this.num].join(',');
	}

	//---------------------------------------------------------------------------
	// ope.undo()  操作opeを一手前に戻す
	// ope.redo()  操作opeを一手進める
	// ope.exec()  操作opeを反映する。ope.undo(),ope.redo()から内部的に呼ばれる
	//---------------------------------------------------------------------------
	override undo() {
		const key_undo = this.puzzle.board.exec.boardtype[this.old][0];
		this.exec_ba(key_undo);
	}
	override redo() {
		const key_redo = this.puzzle.board.exec.boardtype[this.num][1];
		this.exec_ba(key_redo);
	}
	exec_ba(num: number, d?: IRange) {
		const puzzle = this.puzzle;
		const bd = puzzle.board;
		d = d || { x1: 0, y1: 0, x2: 2 * bd.cols, y2: 2 * bd.rows };
		bd.exec.execadjust_main(num, d);
		puzzle.redraw();
	}
}

// BoardFlipOperationクラス
export class BoardFlipOperation extends Operation<IBoardOperation> {
	prefix = 'AT' as const
	override reqReset = true
	area = {
		x1: 0,
		y1: 0,
		x2: 0,
		y2: 0
	}
	TURN = 0x40

	constructor(puzzle: Puzzle, d: IRange, name: IBoardOperation) {
		super(puzzle)
		this.area = d;
		this.old = this.num = name;
	}
	//---------------------------------------------------------------------------
	// ope.setData()  オブジェクトのデータを設定する
	// ope.decode()   ファイル出力された履歴の入力用ルーチン
	// ope.toString() ファイル出力する履歴の出力用ルーチン
	//---------------------------------------------------------------------------

	override decode(strs: string[]) {
		if (strs[0] !== this.prefix) { return false; }
		this.old = this.num = strs[1] as IBoardOperation;
		this.area.x1 = +strs[2];
		this.area.y1 = +strs[3];
		this.area.x2 = +strs[4];
		this.area.y2 = +strs[5];
		return true;
	}
	override toString() {
		const d = this.area;
		return [this.prefix, this.num, d.x1, d.y1, d.x2, d.y2].join(',');
	}

	//---------------------------------------------------------------------------
	// ope.undo()  操作opeを一手前に戻す
	// ope.redo()  操作opeを一手進める
	// ope.exec()  操作opeを反映する。ope.undo(),ope.redo()から内部的に呼ばれる
	//---------------------------------------------------------------------------
	override undo() {
		// とりあえず盤面全部の対応だけ
		const d0 = this.area;
		const d = { x1: d0.x1, y1: d0.y1, x2: d0.x2, y2: d0.y2 };
		const key_undo = this.puzzle.board.exec.boardtype[this.old][0];
		if (key_undo & this.TURN) { const tmp = d.x1; d.x1 = d.y1; d.y1 = tmp; }
		this.exec_bf(key_undo, d);
	}
	override redo() {
		// とりあえず盤面全部の対応だけ
		const d0 = this.area;
		const d = { x1: d0.x1, y1: d0.y1, x2: d0.x2, y2: d0.y2 };
		const key_redo = this.puzzle.board.exec.boardtype[this.num][1];
		this.exec_bf(key_redo, d);
	}
	exec_bf(num: number, d: IRange) {
		const puzzle = this.puzzle;
		puzzle.board.exec.execadjust_main(num, d);
		puzzle.redraw();
	}
}

// TrialEnterOperationクラス
export class TrialEnterOperation extends Operation<number> {
	constructor(puzzle: Puzzle, old: number, num: number) {
		super(puzzle)
		this.old = old;
		this.num = num;
	}
	override undo() {
		this.manager.position--;
		this.manager.resumeTrial();
		this.manager.position++;

		this.manager.trialpos.pop();
		this.manager.emitTrial(this.old);
	}
	override redo() {
		this.manager.trialpos.push(this.manager.position);
		this.manager.emitTrial(this.num);
	}

	override decode(strs: string[]) {
		if (strs[0] !== 'TE') { return false; }
		this.old = +strs[1];
		this.num = +strs[2];
		return true;
	}
	override toString() {
		return ['TE', this.old, this.num].join(',');
	}
}

// TrialFinalizeOperationクラス
class TrialFinalizeOperation extends Operation<number[]> {
	constructor(puzzle: Puzzle, old: number[]) {
		super(puzzle)
		this.old = old
	}
	//override num: number[] = []

	override exec(num: number[], d: IRange) {
		this.manager.trialpos = num.concat();
		if (num.length === 0) {
			this.puzzle.board.trialclear();
		}
		else {
			this.manager.position--;
			this.manager.resumeTrial();
			this.manager.position++;
		}
		this.manager.emitTrial(num.length);
		this.puzzle.redraw();
	}

	override decode(strs: string[]) {
		if (strs[0] !== 'TF') { return false; }
		strs.shift();
		this.old = JSON.parse(strs.join(','));
		return true;
	}
	override toString() {
		return `TF,[${this.old.join(',')}]`;
	}
}

//---------------------------------------------------------------------------
// ★OperationListクラス OperationのListと時刻を保持する
//---------------------------------------------------------------------------
export class OperationList extends Array<IOperation> {
	puzzle: Puzzle
	time: number
	constructor(puzzle: Puzzle) {
		super()
		this.puzzle = puzzle;
		this.time = this.puzzle.getTime();
	}

}

//---------------------------------------------------------------------------
// ★OperationManagerクラス 操作情報を扱い、Undo/Redoの動作を実装する
//---------------------------------------------------------------------------
// OperationManagerクラス

type IOperation = {
	reqReset: boolean
	redo: () => void
	undo: () => void
}

export type OperationManagerOption = Partial<OperationManager>

export type HistoryInfo = {
	type: string
	version: number
	time?: number
	current?: number
	datas?: ({ time: number, ope: string[] } | string[])[]
	trialpos?: number[]
}
export class OperationManager {
	puzzle: Puzzle
	lastope: Operation | null = null;	// this.opeの最後に追加されたOperationへのポインタ
	history: (OperationList | IOperation[])[] = [];		// OperationListのオブジェクトを保持する配列
	position = 0;		// 現在の表示操作番号を保持する
	trialpos: number[] = [];		// TrialModeの位置を保持する配列
	disEmitTrial = 0;	// Trial eventの呼び出し有効無効フラグ

	broken = false;	// "以前の操作"を消して元に戻れなくなった状態
	initpos = 0;		// 盤面初期化時のposition

	disrec = 0;		// このクラスからの呼び出し時は1にする
	disCombine = false;	// 数字がくっついてしまうので、それを一時的に無効にするためのフラグ
	forceRecord = false;	// 強制的に登録する(盤面縮小時限定)
	changeflag = false;	// 操作が行われたらtrueにする(mv.notInputted()用)
	chainflag = false;		// 同じope直下の配列に新しいOperationオブジェクトを追加する

	enableUndo = false;	// Undoできる状態か？
	enableRedo = false;	// Redoできる状態か？
	limitTrialUndo = false;// 仮置きモードでUndoを止める状態かどうか

	undoExec = false;		// Undo中
	redoExec = false;		// Redo中
	reqReset = false;		// Undo/Redo時に盤面回転等が入っていた時、resize,rebuildInfo関数のcallを要求する

	operationlist: (new (...args: any[]) => Operation)[] = [];

	constructor(puzzle: Puzzle) {
		this.puzzle = puzzle;
		this.operationlist = [
			ObjectOperation,
			BoardClearOperation,
			BoardAdjustOperation,
			BoardFlipOperation,
			TrialEnterOperation,
			TrialFinalizeOperation
		];
		this.addExtraOperation();
	}
	addExtraOperation() { }

	//---------------------------------------------------------------------------
	// um.disableRecord()  操作の登録を禁止する
	// um.enableRecord()   操作の登録を許可する
	// um.checkexec()      html上の[戻][進]ボタンを押すことが可能か設定する
	// um.allerase()       記憶していた操作を全て破棄する
	// um.newOperation()   マウス、キー入力開始時に呼び出す
	//---------------------------------------------------------------------------

	// 今この関数でレコード禁止になるのは、UndoRedo時、URLdecode、fileopen、adjustGeneral/Special時
	// 連動して実行しなくなるのはaddOpe().
	//  -> ここで使っているUndo/RedoとaddOpe以外はsetQues系関数を使用しないように変更
	//     変な制限事項がなくなるし、動作速度にもかなり効くしね
	disableRecord() { this.disrec++; }
	enableRecord() { if (this.disrec > 0) { this.disrec--; } }

	checkexec() {
		if (this.history === (void 0)) { return; }

		this.checkenable();

		this.puzzle.emit('history');
	}
	checkenable() {
		if (this.limitTrialUndo) {
			this.enableUndo = (this.position > this.trialpos[this.trialpos.length - 1] + 1);
		}
		else {
			this.enableUndo = (this.position > 0);
		}
		this.enableRedo = (this.position < this.history.length);

		this.puzzle.board.trialstage = this.trialpos.length;
	}
	allerase() {
		this.lastope = null;
		this.history = [];
		this.position = 0;
		this.broken = false;
		this.initpos = 0;
		this.changeflag = false;
		this.chainflag = false;
		this.checkexec();
		this.trialpos = [];
		this.limitTrialUndo = false;
		this.puzzle.checker.resetCache();
	}
	newOperation() {
		this.changeflag = false;
		this.chainflag = false;
	}
	newChain() {
		this.chainflag = false;
	}

	//---------------------------------------------------------------------------
	// opemgr.isModified()     操作がファイル等に保存されていないか確認する
	// opemgr.resetModifiedState() ファイルに保存された時などに保存した状態にする
	//---------------------------------------------------------------------------
	isModified() {
		return (this.broken || (this.initpos < this.position));
	}
	resetModifiedState() {
		this.broken = false;
		this.initpos = this.position;
	}

	//---------------------------------------------------------------------------
	// opemgr.removeDescendant()  現在以降の履歴を消去する
	//---------------------------------------------------------------------------
	removeDescendant() {
		if (this.position < this.initpos) { this.broken = true; }
		for (let i = this.history.length - 1; i >= this.position; i--) { this.history.pop(); }
		this.position = this.history.length;
		this.chainflag = false;
	}

	//---------------------------------------------------------------------------
	// um.add()  指定された操作を追加する(共通操作)
	//---------------------------------------------------------------------------
	add(newope: Operation) {
		if (!this.puzzle.ready || (!this.forceRecord && this.disrec > 0)) { return; }

		/* Undoした場所で以降の操作がある時に操作追加された場合、以降の操作は消去する */
		if (this.enableRedo) { this.removeDescendant(); }

		/* 前の履歴を更新するかどうか判定 */
		const puzzle = this.puzzle;
		if (this.disCombine || !this.lastope ||
			!newope.isModify || !newope.isModify(this.lastope)) {
			/* 履歴を追加する */
			if (!this.chainflag) {
				this.history.push(new OperationList(this.puzzle));
				this.position++;
				this.chainflag = true;
			}
			this.history[this.history.length - 1].push(newope);
			this.lastope = newope;
		}
		else {
			/* 前の履歴を更新したときは何もしない */
		}

		if (newope.property !== 'qsub' && newope.property !== 'qcmp' && newope.property !== 'snum') {
			puzzle.checker.resetCache();
		}
		this.changeflag = true;
		this.checkexec();
	}

	//---------------------------------------------------------------------------
	// um.decodeHistory() オブジェクトを履歴情報に変換する
	// um.encodeHistory() 履歴情報をオブジェクトに変換する
	//---------------------------------------------------------------------------
	decodeHistory(historyinfo: HistoryInfo) {
		this.allerase();

		this.initpos = this.position = historyinfo.current || 0;
		this.history = [];
		const datas = historyinfo.datas || [];
		for (let i = 0, len = datas.length; i < len; i++) {
			const opelist = new OperationList(this.puzzle);
			this.history.push(opelist);
			let array = datas[i];
			if ("time" in array) {
				opelist.time = array.time;
				array = array.ope;
			}
			for (let j = 0, len2 = array.length; j < len2; j++) {
				const strs = array[j].split(/,/);
				let ope = null;
				const List = this.operationlist;
				for (let k = 0; k < List.length; k++) {
					const ope1 = new List[k]();
					if (ope1.decode(strs)) { ope = ope1; break; }
				}
				if (!!ope) {
					opelist.push(ope);
					this.lastope = ope;
				}
			}
		}

		this.checkexec();

		this.trialpos = historyinfo.trialpos || [];
		if (this.trialpos.length > 0) {
			this.resumeTrial();
			this.limitTrialUndo = true;
		}
	}
	encodeHistory(extoption: { time: boolean }): HistoryInfo {
		extoption = extoption || {};
		this.initpos = this.position;
		const historyinfo: HistoryInfo = {
			type: 'pzpr',
			version: 0.4,
			time: undefined,
			current: undefined,
			trialpos: undefined,
			datas: undefined
		};
		if (extoption.time) {
			historyinfo.time = this.puzzle.getTime();
		}
		if (this.history.length > 0) {
			historyinfo.current = this.position;
			if (this.trialpos.length > 0) {
				historyinfo.trialpos = this.trialpos;
			}
			const history: HistoryInfo["datas"] = [];
			for (let i = 0; i < this.history.length; ++i) {
				const array = Array.prototype.slice.call(this.history[i]);
				if (!extoption.time) {
					history.push(array);
				}
				else {
					history.push({ ope: array, time: (this.history[i] as OperationList).time });
				}
			}
			historyinfo.datas = history;
		}
		return historyinfo;
	}

	//---------------------------------------------------------------------------
	// opemgr.undo()  Undoを実行する
	// opemgr.redo()  Redoを実行する
	//---------------------------------------------------------------------------
	undo() {
		if (!this.enableUndo) { return false; }
		const opes = this.history[this.position - 1];
		this.reqReset = this.checkReqReset(opes);
		this.preproc();
		this.undoCore();
		this.postproc();
		return this.enableUndo;
	}
	redo() {
		if (!this.enableRedo) { return false; }
		const opes = this.history[this.position];
		this.reqReset = this.checkReqReset(opes);
		this.preproc();
		this.redoCore();
		this.postproc();
		return this.enableRedo;
	}

	//---------------------------------------------------------------------------
	// opemgr.undoCore()  Undoを実行する(preproc/postprocなし)
	// opemgr.redoCore()  Redoを実行する(preproc/postprocなし)
	// opemgr.resumeGoto()  指定された履歴の位置まで移動する(preproc/postprocなし)
	//---------------------------------------------------------------------------
	undoCore() {
		this.undoExec = true;
		const opes = this.history[this.position - 1];
		for (let i = opes.length - 1; i >= 0; i--) {
			if (!!opes[i]) { opes[i].undo(); }
		}
		this.position--;
		this.undoExec = false;
	}
	redoCore() {
		this.redoExec = true;
		const opes = this.history[this.position];
		for (let i = 0; i < opes.length; ++i) {
			if (!!opes[i]) { opes[i].redo(); }
		}
		this.position++;
		this.redoExec = false;
	}
	resumeGoto(pos: number) {
		if (pos < this.position) { while (pos < this.position) { this.undoCore(); } }
		else if (this.position < pos) { while (this.position < pos) { this.redoCore(); } }
		this.checkenable();
	}

	//---------------------------------------------------------------------------
	// um.checkReqReset() 盤面全体に影響する処理が含まれているかどうか判定する
	// um.preproc()  Undo/Redo実行前の処理を行う
	// um.postproc() Undo/Redo実行後の処理を行う
	//---------------------------------------------------------------------------
	checkReqReset(opes: IOperation[]) {
		return opes.some(function (ope) { return ope.reqReset; });
	}
	preproc(opes: any = null) {
		const puzzle = this.puzzle;
		const bd = puzzle.board;
		this.disableRecord();

		puzzle.painter.suspend();
		puzzle.errclear();
		if (this.reqReset) {
			bd.disableInfo();
		}
	}
	postproc() {
		const puzzle = this.puzzle;
		const bd = puzzle.board;
		if (this.reqReset) {
			bd.setposAll();
			bd.setminmax();
			bd.enableInfo();
			bd.rebuildInfo();
			puzzle.redraw(true);
			puzzle.emit('adjust');
		}
		puzzle.painter.unsuspend();

		this.enableRecord();
		this.checkexec();
	}

	//---------------------------------------------------------------------------
	// opemgr.enterTrial()   TrialModeにする
	// opemgr.acceptTrial()  現在のTrial状態を確定する
	// opemgr.rejectTrial()  Trial状態と履歴を破棄する
	// opemgr.resumeTrial()  ファイル読み込み時などにTrial状態を復帰する
	// opemgr.emtiTrial()    trial eventを呼び出す
	//---------------------------------------------------------------------------
	enterTrial() {
		if (this.trialpos[this.trialpos.length - 1] + 1 === this.position) { return; }
		this.newOperation();
		this.add(new TrialEnterOperation(this.puzzle, this.trialpos.length, this.trialpos.length + 1));
		this.trialpos.push(this.position - 1);
		this.limitTrialUndo = true;
		this.checkexec();
		this.newOperation();
		this.emitTrial();
	}
	acceptTrial() {
		if (this.trialpos[this.trialpos.length - 1] + 1 === this.position) {
			this.position--;
			this.removeDescendant();
			this.trialpos.pop();
		}
		if (this.trialpos.length > 0) {
			this.newOperation();
			this.add(new TrialFinalizeOperation(this.puzzle, this.trialpos));
			this.puzzle.board.trialclear();
		}
		this.trialpos = [];
		this.limitTrialUndo = false;
		this.removeDescendant();
		this.checkexec();
		this.newOperation();
		this.emitTrial();
	}
	rejectTrial(rejectall: boolean) {
		if (this.trialpos.length === 0) { return; }
		this.disableRecord();
		if (rejectall || this.trialpos.length === 1) {
			const pos = this.trialpos[0];
			this.puzzle.board.trialclear();
			this.trialpos = [];
			this.limitTrialUndo = false;
			this.resumeGoto(pos);
		}
		else {
			this.resumeGoto(this.trialpos[this.trialpos.length - 1]);
			this.resumeTrial();
		}
		this.enableRecord();
		this.removeDescendant();
		this.checkexec();
		this.newOperation();
		this.emitTrial();
	}
	resumeTrial() {
		if (this.trialpos.length > 0) {
			this.disEmitTrial++;
			const pos = this.position;
			this.checkenable();
			this.resumeGoto(this.trialpos[0]);
			this.puzzle.board.trialclear(true);
			if (this.position < pos) {
				this.puzzle.board.trialstage = 1;
				this.resumeGoto(pos);
			}
			this.disEmitTrial--;
		}
	}
	emitTrial(num?: number) {
		if (this.disEmitTrial === 0) {
			this.puzzle.emit('trial', ((num === void 0) ? this.trialpos.length : num));
		}
	}
}
