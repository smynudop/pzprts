// Piece.js v3.4.1
import { Position } from "./Address";
import type { Board, IGroup, IGroup2 } from "./Board";
import type { Puzzle } from "./Puzzle";
import { ObjectOperation } from "./Operation";
import { CellList } from "./PieceList";
import type { GraphComponent } from "./GraphBase";
import { DIRS } from "./Constants";
import type { CellOfBoard } from "./Answer";
//---------------------------------------------------------------------------
// ★BoardPieceクラス Cell, Cross, Border, EXCellクラスのベース
//---------------------------------------------------------------------------

const Q_BLACK = 1
const Q_TRIANGLE1 = 2
const Q_TRIANGLE2 = 3
const Q_TRIANGLE3 = 4
const Q_TRIANGLE4 = 5
const Q_ICE = 6
const Q_OUT = 7
const Q_NOINPUT = 8
const Q_CROSS1 = 11
const Q_CROSS2 = 12
const Q_CROSS3 = 13
const Q_CROSS4 = 14
const Q_CROSS5 = 15
const Q_CROSS6 = 16
const Q_CROSS7 = 17
const Q_GATE1 = 21
const Q_GATE2 = 22
const Q_HOLE = 31
const Q_NURIMAZE_CORRECT = 41
const Q_NURIMAZE_WRONG = 42
const Q_KAKKURO = 51

export type IDir = 1 | 2 | 3 | 4
export class BoardPiece<TBoard extends Board = Board> extends Position<TBoard> {
	NDIR = DIRS.NDIR
	UP = DIRS.UP
	DN = DIRS.DN
	LT = DIRS.LT
	RT = DIRS.RT

	group!: IGroup
	id: number = null!
	isnull = true

	// デフォルト値
	/**
	 *  1:黒マス 
	 *  2-5:三角形 
	 *  6:アイス・なべ等 
	 *  7:盤面外 
	 *  8:盤面内だが入力不可
	 *  11-17:十字型パーツ 
	 *  21-22:旗門 
	 *  31:Hole 
	 *  41-42:ぬりめいずの○△ 
	 *  51:カックロ
	 */
	ques: number = 0
	// cross :(交点の黒点)
	// border:(問題の境界線)

	/**
	 * cell  :(数字につく矢印の向き)
	 * border:(アイスバーンの矢印/マイナリズムの不等号)
	 */
	qdir = 0
	qnum = -1	// cell  :(セルの数字/○△□/マカロ以外の単体矢印/白丸黒丸/カックロの右側

	// cross :(交点の数字)
	// border:(マイナリズムの数字/天体ショーの星)
	qnum2 = -1	// cell  :(カックロの下側/よせなべの丸無し数字)
	qchar = 0	// excell:キンコンカンの文字

	/* 回答データを保持するプロパティ */

	/**
	 * cell  :(1:黒マス/あかり 2-5:三角形 11-13:棒 31-32:斜線 41-50:ふとん)
	 * border:(回答の境界線)
	 */
	qans = 0
	anum = -1	// cell  :(セルの数字/○△□/単体矢印)
	line = 0	// border:(ましゅやスリリンなどの線)

	/* 補助データを保持するプロパティ */

	/**
	 * cell  :(1:白マス 1-2:背景色/○× 3:絵になる部分)
	 * border:(1:補助線 2:× 11-14:方向記号)
	 */
	qsub = 0
	qcmp = 0	// cell  :(1:cmpマス 1-2:○×)
	snum: number[] = []	// cell  :補助数字を保持する

	/* 履歴保存しないプロパティ */
	error = 0
	qinfo = 0
	trial = 0	// TrialModeのstateを保持する変数

	/**
	 * qnum==-2を入力できないようにする(cell向け)
	 */
	disInputHatena = false

	/**
	 * 回答の数字と○×が入るパズル(○は数字が入っている扱いされる)(cell向け)
	 */
	numberWithMB = false

	/**
	 *  数字以外でqnum/anumを使用する(同じ値を入力で消去できたり、回答で・が入力できる)(cell向け)
	 */
	numberAsObject = false

	/**
	 * 数字の代わりにアルファベットを入力する(cell向け)
	 */
	numberAsLetter = false

	propques: (keyof BoardPiece)[] = ['ques', 'qdir', 'qnum', 'qnum2', 'qchar']
	propans: (keyof BoardPiece)[] = ['qans', 'anum', 'line', 'trial']
	propsub: (keyof BoardPiece)[] = ['qsub', 'qcmp', 'snum']
	propinfo: (keyof BoardPiece)[] = ['error', 'qinfo']
	propnorec: Record<string, number> = { color: 1, error: 1, qinfo: 1 }

	adjborder: {
		top: Border,
		bottom: Border,
		left: Border,
		right: Border
	} = null!


	//clist: CellList | null = null

	// 入力できる最大・最小の数字
	maxnum: number | (() => number) = () => {
		return 999;
	}
	minnum: number | (() => number) = () => {
		return 1
	}

	initAdjBorder() {
		this.adjborder = {
			top: this.relbd(0, -1),
			bottom: this.relbd(0, 1),
			left: this.relbd(-1, 0),
			right: this.relbd(1, 0)
		};
	}


	room!: GraphComponent
	pureObject: this

	constructor(puzzle: Puzzle<TBoard>) {
		super(puzzle)
		this.pureObject = { ...this }
	}



	//---------------------------------------------------------------------------
	// オブジェクト設定値のgetter/setter
	//---------------------------------------------------------------------------
	setQues(val: any) { this.setdata('ques', val); }
	setQans(val: any) { this.setdata('qans', val); }
	setQdir(val: any) { this.setdata('qdir', val); }
	setQnum(val: any) { this.setdata('qnum', val); }
	setQnum2(val: any) { this.setdata('qnum2', val); }
	setQchar(val: any) { this.setdata('qchar', val); }
	setAnum(val: any) { this.setdata('anum', val); }
	setLineVal(val: any) { this.setdata('line', val); }
	setQsub(val: any) { this.setdata('qsub', val); }
	setQcmp(val: any) { this.setdata('qcmp', val); }
	//setSnum(val: any, val2: any = null) { this.setdata('snum', val); }

	//---------------------------------------------------------------------------
	// setdata() Cell,Cross,Border,EXCellの値を設定する
	// addOpe()  履歴情報にプロパティの変更を通知する
	//---------------------------------------------------------------------------
	setdata(prop: any, num: number) {
		//@ts-ignore
		const now: number = this[prop]


		if (now === num) { return; }
		if (!!this.prehook[prop]) { if (this.prehook[prop].call(this, num)) { return; } }

		this.addOpe(prop, now, num);

		//@ts-ignore
		this[prop] = num;

		const trialstage = this.board.trialstage;
		if (trialstage > 0) { this.trial = trialstage; }

		this.board.modifyInfo(this, `${this.group}.${prop}`);

		if (!!this.posthook[prop]) { this.posthook[prop].call(this, num); }
	}
	addOpe(property: any, old: number, num: number) {
		if (old === num) { return; }
		this.puzzle.opemgr.add(new ObjectOperation(this.puzzle, this, property, old, num));
	}

	//---------------------------------------------------------------------------
	// setdata2() Cell,Cross,Border,EXCellのpos付きの値を設定する
	//---------------------------------------------------------------------------
	setdata2(prop: any, pos: number, num: number) {
		//@ts-ignore
		const now: number = this[prop][pos]

		if (now === num) { return; }
		if (!!this.prehook[prop]) { if (this.prehook[prop].call(this, pos, num)) { return; } }

		this.addOpe(prop + pos, now, num);

		//@ts-ignore
		this[prop][pos] = num;

		const trialstage = this.board.trialstage;
		if (trialstage > 0) { this.trial = trialstage; }

		if (!!this.posthook[prop]) { this.posthook[prop].call(this, pos, num); }
	}

	//---------------------------------------------------------------------------
	// propclear() 指定されたプロパティの値をクリアする
	//---------------------------------------------------------------------------
	propclear(prop: string, isrec: boolean) {
		//@ts-ignore
		const def = this.pureObject[prop];
		//@ts-ignore
		const now = this[prop]
		if (now !== def && !this.shouldSkipPropClear(prop)) {
			if (isrec && !this.propnorec[prop]) { this.addOpe(prop, now, def); }

			//@ts-ignore
			this[prop] = def;
		}
	}

	/**
	 * propclearをスキップしたい場合に条件を指定する
	 */
	shouldSkipPropClear(prop: any) {
		return false
	}

	//---------------------------------------------------------------------------
	// getprops() プロパティの値のみを取得する
	// compare()  プロパティの値を比較し違っていたらcallback関数を呼びだす
	//---------------------------------------------------------------------------
	getprops() {
		const props: { [key in (keyof BoardPiece)]?: any } = {};
		const proplist = this.getproplist(['ques', 'ans', 'sub']);
		for (let i = 0; i < proplist.length; i++) {
			const a = proplist[i];
			const val = this[a]
			//const isArray = (Array.isArray(this[a]));
			props[a] = (!Array.isArray(val) ? this[a] : val.slice());
		}
		return props;
	}
	compare(props: BoardPiece, callback: (group: IGroup, id: number, prop: keyof BoardPiece, vals: { source: any, target: any }) => void) {
		const proplist = this.getproplist(['ques', 'ans', 'sub']);
		for (let i = 0; i < proplist.length; i++) {
			const a = proplist[i];
			const isArray = (Array.isArray(this[a]));
			//@ts-ignore
			const source = (!isArray ? props[a] : props[a].join(','));
			//@ts-ignore
			const target = (!isArray ? this[a] : this[a].join(','));
			if (source !== target) { callback(this.group, this.id, a, { source, target }); }
		}
	}

	//---------------------------------------------------------------------------
	// getproplist() ansclear等で使用するプロパティの配列を取得する
	//---------------------------------------------------------------------------
	getproplist(types: ("ques" | "ans" | "sub" | "info" | "trial")[]) {
		let array: (keyof BoardPiece)[] = [];
		for (let i = 0; i < types.length; i++) {
			let array1: (keyof BoardPiece)[] = [];
			switch (types[i]) {
				case 'ques': array1 = this.propques; break;
				case 'ans': array1 = this.propans; break;
				case 'sub': array1 = this.propsub; break;
				case 'info': array1 = this.propinfo; break;
				case 'trial': array1 = ['trial']; break;
			}
			array = array.concat(array1);
		}
		return array;
	}

	//---------------------------------------------------------------------------
	// getmaxnum() 入力できる数字の最大値を返す
	// getminnum() 入力できる数字の最小値を返す
	//---------------------------------------------------------------------------
	getmaxnum() { return this.maxnum instanceof Function ? this.maxnum() : this.maxnum }
	getminnum() { return this.minnum instanceof Function ? this.minnum() : this.minnum }

	//---------------------------------------------------------------------------
	// prehook  値の設定前にやっておく処理や、設定禁止処理を行う
	// posthook 値の設定後にやっておく処理を行う
	//---------------------------------------------------------------------------
	prehook: Record<string, (this: any, data: any, data2?: any) => boolean> = {}
	posthook: Record<string, (this: any, data: any, data2?: any) => boolean> = {}

	//---------------------------------------------------------------------------
	// seterr()  error値を設定する
	// setinfo() qinfo値を設定する
	//---------------------------------------------------------------------------
	seterr(num: number) {
		if (this.board.isenableSetError()) { this.error = num; }
	}

	setnoerr() {
		if (this.board.isenableSetError()) {
			if (this.error === 0) { this.error = -1; }
		}
	}

	setinfo(num: number) { this.qinfo = num; }
	is51cell() { return false }
	remove51cell() { }
	set51cell() { }
	checkStableLine(num: number) { }

}

export type CellOption = Partial<Cell>
type Adjacent<T> = {
	top: T,
	bottom: T,
	left: T,
	right: T
}

//---------------------------------------------------------------------------
// ★Cellクラス BoardクラスがCellの数だけ保持する
//---------------------------------------------------------------------------
// ボードメンバデータの定義(1)
// Cellクラスの定義
export class Cell<TBoard extends Board = any> extends BoardPiece<TBoard> {
	override group: IGroup = 'cell'

	lcnt = 0		// セルに存在する線の本数

	/**
	 * 丸数字やアルファベットが移動してきた場合の移動元のセルを示す (移動なし時は自分自身を指す
	 * linegraphが有効じゃないと意味がないが、linegraphがあるときは確定でcellが入っているので、|nullにはしない
	 */
	base!: this

	/** 
	 * 数字のあるマスが黒マスにならないパズル 
	 */
	numberRemainsUnshaded = false
	enableSubNumberArray = false	// 補助数字の配列を作るパズル

	/**
	 * LineGraphで使う
	 */
	path!: GraphComponent<this> | null
	sblk: any = null

	adjacent: Adjacent<this> = null!	// 隣接するセルの情報を保持する


	constructor(puzzle: Puzzle<TBoard>, option?: CellOption) {
		super(puzzle)
		Object.assign(this, option)

		this.pureObject = { ...this }
		if (this.enableSubNumberArray || option?.enableSubNumberArray) {
			const anum0 = this.pureObject.anum;
			this.snum = [anum0, anum0, anum0, anum0];
			this.pureObject.snum = this.snum.slice()
		}
	}

	//---------------------------------------------------------------------------
	// initAdjacent()   隣接セルの情報を設定する
	// initAdjBorder()  隣接境界線の情報を設定する
	//---------------------------------------------------------------------------
	initAdjacent() {
		this.adjacent = {
			top: this.relobj(0, -2) as this,
			bottom: this.relobj(0, 2) as this,
			left: this.relobj(-2, 0) as this,
			right: this.relobj(2, 0) as this
		};
	}


	override relobj(bx: number, by: number) {
		return super.relobj(bx, by) as Cell
	}

	override relcell(dx: number, dy: number): this {
		return super.relcell(dx, dy) as this
	}

	isCmp() {
		return false;
	}

	//---------------------------------------------------------------------------
	// propclear() 指定されたプロパティの値をクリアする
	//---------------------------------------------------------------------------
	override propclear(prop: any, isrec: boolean) {
		if (prop === 'snum' && this.enableSubNumberArray) {
			for (let pos = 0; pos < 4; ++pos) {
				const def = this.pureObject.snum[pos];
				const now = this.snum[pos]

				if (now !== def) {
					if (isrec) { this.addOpe(prop + pos, now, def); }
					this.snum[pos] = def;
				}
			}
		}
		else {
			super.propclear(prop, isrec);
		}
	}

	//---------------------------------------------------------------------------
	// prehook  値の設定前にやっておく処理や、設定禁止処理を行う
	// posthook 値の設定後にやっておく処理を行う
	//---------------------------------------------------------------------------
	override prehook: Record<string, (this: any, data: any, data2?: any) => any> = {
		qnum: function (num: number, num2?: any) { return (this.getminnum() > 0 && num === 0); },
		qnum2: function (num: number, num2?: any) { return (this.getminnum() > 0 && num === 0); },
		anum: function (num: number, num2?: any) { return (this.getminnum() > 0 && num === 0); }
	}
	override posthook: Record<string, (this: any, data: any, data2?: any) => any> = {}

	//---------------------------------------------------------------------------
	// cell.isShade()   該当するCellが黒マスかどうか返す
	// cell.isUnshade() 該当するCellが白マスかどうか返す
	// cell.setShade()  該当するCellに黒マスをセットする
	// cell.clrShade()  該当するCellに白マスをセットする
	//---------------------------------------------------------------------------
	isShade() { return (!this.isnull && this.qans === 1); }
	isUnshade() { return (!this.isnull && this.qans !== 1); }
	setShade() { this.setQans(1); }
	clrShade() { this.setQans(0); }

	//-----------------------------------------------------------------------
	// cell.getNum()     該当するCellの数字を返す
	// cell.setNum()     該当するCellに数字を設定する
	//-----------------------------------------------------------------------
	getNum() { return (this.qnum !== -1 ? this.qnum : this.anum); }
	setNum(val: number) {
		if (this.getminnum() > 0 && val === 0) { return; }
		// editmode時 val>=0は数字 val=-1は消去 val=-2は？など
		if (this.puzzle.editmode) {
			val = (((this.numberAsObject || val === -2) && this.qnum === val) ? -1 : val);
			this.setQnum(val);
			this.setAnum(-1);
			if (this.numberRemainsUnshaded) { this.setQans(0); }
			if (!this.puzzle.painter.enablebcolor) { this.setQsub(0); }
			this.setQcmp(0);
			this.clrSnum();
		}
		// playmode時 val>=0は数字 val=-1は消去 numberAsObjectの・はval=-2 numberWithMBの○×はval=-2,-3
		else if (this.qnum === -1) {
			const vala = ((val > -1 && !(this.numberAsObject && this.anum === val)) ? val : -1);
			const vals = ((val < -1 && !(this.numberAsObject && this.qsub === -val - 1)) ? -val - 1 : 0);
			this.setAnum(vala);
			this.setQsub(vals);
			this.setQdir(0);
			this.setQcmp(0);
			if (!(this.numberWithMB && vala === -1)) { this.clrSnum(); }
		}
	}

	//-----------------------------------------------------------------------
	// cell.isNum()       該当するCellに数字があるか返す
	// cell.noNum()       該当するCellに数字がないか返す
	// cell.isValidNum()  該当するCellに0以上の数字があるか返す
	// cell.isNumberObj() 該当するCellに数字or○があるか返す
	// cell.sameNumber()  ２つのCellに同じ有効な数字があるか返す
	//-----------------------------------------------------------------------
	isNum() { return !this.isnull && (this.qnum !== this.pureObject.qnum || this.anum !== this.pureObject.anum); }
	noNum() { return !this.isnull && (this.qnum === this.pureObject.qnum && this.anum === this.pureObject.anum); }
	isValidNum() { return !this.isnull && (this.qnum >= 0 || (this.anum >= 0 && this.qnum === this.pureObject.qnum)); }
	isNumberObj() { return (this.qnum !== this.pureObject.qnum || this.anum !== this.pureObject.anum || (this.numberWithMB && this.qsub === 1)); }
	sameNumber(cell: Cell) { return (this.isValidNum() && (this.getNum() === cell.getNum())); }

	//---------------------------------------------------------------------------
	// cell.setSnum() Cellの補助数字を設定する
	// cell.clrSnum() Cellの補助数字を消去する
	//---------------------------------------------------------------------------
	setSnum(pos: number, num: number = null!) { // todo
		if (this.isNum() && num !== -1) { return; }
		if (!this.enableSubNumberArray) {
			this.setdata('snum', num);	// 1つ目の数字のみ
			//console.warn(`snumがセットされましたが、候補数字が無効です。`)
			return
		}
		this.setdata2('snum', pos, num);
	}
	clrSnum() {
		if (!this.enableSubNumberArray) {
			this.setSnum(-1);
		}
		else {
			this.setSnum(0, -1);
			this.setSnum(1, -1);
			this.setSnum(2, -1);
			this.setSnum(3, -1);
		}
	}

	//---------------------------------------------------------------------------
	// cell.is51cell()     [＼]のセルかチェックする(カックロ以外はオーバーライドされる)
	// cell.set51cell()    [＼]を作成する(カックロ以外はオーバーライドされる)
	// cell.remove51cell() [＼]を消去する(カックロ以外はオーバーライドされる)
	//---------------------------------------------------------------------------
	// ※とりあえずカックロ用
	override is51cell() { return (this.ques === 51); }
	override set51cell(val?: number) {
		this.setQues(51);
		this.setQnum(0);
		this.setQnum2(0);
		this.setAnum(-1);
	}
	override remove51cell(val?: number) {
		this.setQues(0);
		this.setQnum(0);
		this.setQnum2(0);
		this.setAnum(-1);
	}

	//---------------------------------------------------------------------------
	// cell.ice() アイスのマスかどうか判定する
	//---------------------------------------------------------------------------
	ice() { return (this.ques === 6); }

	//---------------------------------------------------------------------------
	// cell.isEmpty() / cell.isValid() 不定形盤面などで、入力できるマスか判定する
	//---------------------------------------------------------------------------
	isEmpty() { return (this.isnull || this.ques === 7); }
	isValid() { return (!this.isnull && this.ques !== 7); }

	/**
	 * From robx/pzprjs
	 * @param inputData 
	 */
	setValid(inputData: number) {
		this.setQues(inputData);
		this.setQnum(-1);
		this.setQans(0);
		this.setQsub(0);
		for (const dir in this.adjborder) {
			this.adjborder[dir as "top" | "bottom" | "left" | "right"].setQans(0);
		}
		this.drawaround();
		this.board.roommgr.rebuild();
	}

	//---------------------------------------------------------------------------
	// cell.isDeparture()   オブジェクトを動かすパズルで移動元セルかどうか判定する
	// cell.isDestination() オブジェクトを動かすパズルで移動先セルかどうか判定する
	// ※動いていない場合は、isDestinationのみtrueを返します
	//---------------------------------------------------------------------------
	isDeparture() { return (!this.isnull && !!this.base && this.isNum()); }
	isDestination() { return (!this.isnull && !!this.base && !this.base.isnull); }

	//---------------------------------------------------------------------------
	// cell.isLineStraight()   セルの上で線が直進しているか判定する
	// cell.isLineCurve()      セルの上で線がカーブしているか判定する
	//---------------------------------------------------------------------------
	isLineStraight() { // 0:直進ではない 1:縦に直進 2:横に直進
		if (this.lcnt === 2 && this.adjborder.top.isLine() && this.adjborder.bottom.isLine()) { return 1; }
		if (this.lcnt === 2 && this.adjborder.left.isLine() && this.adjborder.right.isLine()) { return 2; }
		return 0;
	}
	isLineCurve() {
		return this.lcnt === 2 && !this.isLineStraight();
	}

	//---------------------------------------------------------------------------
	// cell.isLP()  線が必ず存在するセルの条件を判定する
	// cell.noLP()  線が引けないセルの条件を判定する
	//---------------------------------------------------------------------------
	// 下記の関数で用いる定数
	isLPobj = {
		1: { 11: 1, 12: 1, 14: 1, 15: 1 }, /* UP */
		2: { 11: 1, 12: 1, 16: 1, 17: 1 }, /* DN */
		3: { 11: 1, 13: 1, 15: 1, 16: 1 }, /* LT */
		4: { 11: 1, 13: 1, 14: 1, 17: 1 }  /* RT */
	}
	noLPobj = {
		1: { 1: 1, 4: 1, 5: 1, 13: 1, 16: 1, 17: 1, 21: 1 }, /* UP */
		2: { 1: 1, 2: 1, 3: 1, 13: 1, 14: 1, 15: 1, 21: 1 }, /* DN */
		3: { 1: 1, 2: 1, 5: 1, 12: 1, 14: 1, 17: 1, 22: 1 }, /* LT */
		4: { 1: 1, 3: 1, 4: 1, 12: 1, 15: 1, 16: 1, 22: 1 }  /* RT */
	}

	isLP(dir: IDir): boolean {
		// @ts-ignore
		return !!this.isLPobj[dir][this.ques];
	}
	// ans.checkenableLinePartsからnoLP()関数が直接呼ばれている
	noLP(dir: IDir): boolean {
		//@ts-ignore
		return !!this.noLPobj[dir][this.ques];
	}

	//---------------------------------------------------------------------------
	// cell.countDir4Cell()  上下左右4方向で条件func==trueになるマスの数をカウントする
	//---------------------------------------------------------------------------
	countDir4Cell(func: (cell: this) => boolean) {
		const adc = this.adjacent;
		let cnt = 0;
		const cells = [adc.top, adc.bottom, adc.left, adc.right];
		for (let i = 0; i < 4; i++) {
			if (cells[i].group === "cell" && !cells[i].isnull && func(cells[i])) { cnt++; }
		}
		return cnt;
	}

	//---------------------------------------------------------------------------
	// cell.getdir4clist()   上下左右4方向の存在するセルを返す
	// cell.getdir4cblist()  上下左右4方向のセル＆境界線＆方向を返す
	//---------------------------------------------------------------------------
	getdir4clist() {
		const adc = this.adjacent;
		const list: [Cell, IDir][] = [];
		const cells = [adc.top, adc.bottom, adc.left, adc.right];
		for (let i = 0; i < 4; i++) {
			if (cells[i].group === "cell" && !cells[i].isnull) { list.push([cells[i] as Cell, (i + 1) as IDir]); } /* i+1==dir */
		}
		return list;
	}
	getdir4cblist() {
		const adc = this.adjacent;
		const adb = this.adjborder;
		const cblist: [Cell, Border, number][] = [];
		const cells = [adc.top, adc.bottom, adc.left, adc.right];
		const bds = [adb.top, adb.bottom, adb.left, adb.right];
		for (let i = 0; i < 4; i++) {
			if (cells[i].group === "cell" && !cells[i].isnull || !bds[i].isnull) { cblist.push([cells[i], bds[i], (i + 1)]); } /* i+1==dir */
		}
		return cblist;
	}

	//--------------------------------------------------------------------------------
	// cell.eraseMovedLines()  移動系パズルの丸が消えたとき等、領域に含まれる線を消去する
	//--------------------------------------------------------------------------------
	eraseMovedLines() {
		if (this.path === null) { return; }
		const clist = this.path.clist;
		let count = 0;
		for (let i = 0, len = clist.length; i < len; i++) {
			for (let j = i + 1; j < len; j++) {
				const border = clist[i].getnb(clist[j]);
				if (!border.isnull) { border.removeLine(); count++; }
			}
		}
		if (count > 0) {
			clist.forEach(c => c.draw());
		}
	}
}

//---------------------------------------------------------------------------
// ★Crossクラス BoardクラスがCrossの数だけ保持する(hascross>=1の時)
//---------------------------------------------------------------------------
// ボードメンバデータの定義(2)
// Crossクラスの定義
export type CrossOption = Partial<Cross>
export class Cross extends BoardPiece {

	constructor(puzzle: Puzzle, option?: any) {
		super(puzzle)
		Object.assign(this, option)
		this.pureObject = { ...this }
	}

	override group: IGroup = 'cross'

	lcnt = 0		// 交点に存在する線の本数



	//-----------------------------------------------------------------------
	// cross.getNum()     該当するCrossの数字を返す
	// cross.setNum()     該当するCrossに数字を設定する
	// cross.noNum()      該当するCrossに数字がないか返す
	//-----------------------------------------------------------------------
	getNum() { return this.qnum; }
	setNum(val: number) {
		val = ((val === -2 && this.qnum === val) ? -1 : val);
		this.setQnum(val);
	}
	noNum() { return !this.isnull && this.qnum === -1; }

	//---------------------------------------------------------------------------
	// cross.setCrossBorderError() 交点とその周り四方向のBorderにエラーフラグを設定する
	//---------------------------------------------------------------------------
	setCrossBorderError() {
		this.seterr(1);
		this.board.borderinside(this.bx - 1, this.by - 1, this.bx + 1, this.by + 1).seterr(1);
	}
}

//---------------------------------------------------------------------------
// ★Borderクラス BoardクラスがBorderの数だけ保持する(hasborder>0の時)
//---------------------------------------------------------------------------
// ボードメンバデータの定義(3)

export type BorderOption = Partial<Border>
export class Border extends BoardPiece {
	sidecell: [Cell, Cell]
	//sidecell: [Cell | EXCell, Cell | EXCell]
	sidecross: [Cross, Cross]
	sideobj: any[]	// LineManager用
	constructor(puzzle: Puzzle, option?: any) {
		super(puzzle)
		this.sidecell = [null!, null!];	// 隣接セルのオブジェクト
		this.sidecross = [null!, null!];	// 隣接交点のオブジェクト
		this.sideobj = [];			// LineManager用
		Object.assign(this, option)
		this.pureObject = { ...this }
	}
	override group: IGroup = 'border'

	isvert = false	// true:境界線が垂直(縦) false:境界線が水平(横)
	inside = false	// true:盤面内 false:外枠上or盤面外

	path: any = null	// このLineを含む線情報への参照

	// isLineNG関連の変数など
	enableLineNG = false

	//---------------------------------------------------------------------------
	// initSideObject() 隣接オブジェクトの情報を設定する
	//---------------------------------------------------------------------------
	initSideObject() {
		const allowexcell = (this.board.hasborder === 2 && this.board.hasexcell === 2);
		if (this.isvert) {
			//@ts-ignore
			this.sidecell[0] = ((!allowexcell || this.bx > 0) ? this.relcell(-1, 0) : this.relexcell(-1, 0));
			//@ts-ignore
			this.sidecell[1] = ((!allowexcell || this.bx < this.board.cols * 2) ? this.relcell(1, 0) : this.relexcell(1, 0));
			this.sidecross[0] = this.relcross(0, -1);
			this.sidecross[1] = this.relcross(0, 1);
		}
		else {
			//@ts-ignore
			this.sidecell[0] = ((!allowexcell || this.by > 0) ? this.relcell(0, -1) : this.relexcell(0, -1));
			//@ts-ignore
			this.sidecell[1] = ((!allowexcell || this.by < this.board.rows * 2) ? this.relcell(0, 1) : this.relexcell(0, 1));
			this.sidecross[0] = this.relcross(-1, 0);
			this.sidecross[1] = this.relcross(1, 0);
		}

		// LineManager用
		this.sideobj = (!this.board.borderAsLine ? this.sidecell : this.sidecross);
	}

	//---------------------------------------------------------------------------
	// prehook  値の設定前にやっておく処理や、設定禁止処理を行う
	// posthook 値の設定後にやっておく処理を行う
	//---------------------------------------------------------------------------
	override prehook: Record<string, (this: any, data: any, data2: any) => boolean> = {
		qans(num: number) { return (this.ques !== 0); },
		line(num: number) { return (this.checkStableLine(num)); }
	}

	override posthook = {}

	//---------------------------------------------------------------------------
	// border.draw() 盤面に自分の周囲を描画する (Borderはちょっと範囲が広い)
	//---------------------------------------------------------------------------
	override draw() {
		this.puzzle.painter.paintRange(this.bx - 2, this.by - 2, this.bx + 2, this.by + 2);
	}

	//-----------------------------------------------------------------------
	// border.isLine()      該当するBorderにlineが引かれているか判定する
	// border.setLine()     該当するBorderに線を引く
	// border.setPeke()     該当するBorderに×印をつける
	// border.removeLine()  該当するBorderから線を消す
	//-----------------------------------------------------------------------
	isLine() { return this.line > 0; }
	setLine(id?: string) { this.setLineVal(1); this.setQsub(0); }
	setPeke(id?: string) { this.setLineVal(0); this.setQsub(2); }
	removeLine(id?: string) { this.setLineVal(0); this.setQsub(0); }

	//---------------------------------------------------------------------------
	// border.isBorder()     該当するBorderに境界線が引かれているか判定する
	// border.setBorder()    該当するBorderに境界線を引く
	// border.removeBorder() 該当するBorderから線を消す
	//---------------------------------------------------------------------------
	isBorder() { return (this.ques > 0 || this.qans > 0); }
	setBorder() {
		if (this.puzzle.editmode) { this.setQues(1); this.setQans(0); }
		else if (this.ques !== 1) { this.setQans(1); }
	}
	removeBorder() {
		if (this.puzzle.editmode) { this.setQues(0); this.setQans(0); }
		else if (this.ques !== 1) { this.setQans(0); }
	}

	//---------------------------------------------------------------------------
	// border.isVert()  該当するBorderが垂直(縦)かどうか返す
	// border.isHorz()  該当するBorderに水平(横)かどうか返す
	//---------------------------------------------------------------------------
	isVert() { return this.isvert; }
	isHorz() { return !this.isvert; }

	//---------------------------------------------------------------------------
	// border.checkStableLine() 線が引けない or 必ず存在する状態になっているか判定する
	// border.isLineEX() 線が必ず存在するborderの条件を判定する
	// border.isLineNG() 線が引けないborderの条件を判定する
	//---------------------------------------------------------------------------
	// [pipelink, loopsp], [barns, slalom, reflect, yajirin]で呼ばれる関数
	override checkStableLine(num: number) {	// border.setLineから呼ばれる
		if (this.enableLineNG) {
			return (num !== 0 && this.isLineNG());
		}
		return false;
	}

	// cell.setQues => setCombinedLineから呼ばれる関数 (exist->ex)
	//  -> cellidの片方がnullになっていることを考慮していません
	isLineEX() {
		return false;
	}
	// border.setLineCal => checkStableLineから呼ばれる関数
	//  -> cellidの片方がnullになっていることを考慮していません
	isLineNG() {
		const cell1 = this.sidecell[0];
		const cell2 = this.sidecell[1];
		return this.isVert()
			? (cell1.noLP(DIRS.RT) || cell2.noLP(DIRS.LT))
			: (cell1.noLP(DIRS.DN) || cell2.noLP(DIRS.UP));
	}
}

//---------------------------------------------------------------------------
// ★EXCellクラス BoardクラスがEXCellの数だけ保持する
//---------------------------------------------------------------------------
// ボードメンバデータの定義(4)
// EXCellクラスの定義

export type EXCellOption = {
	ques?: number,
	qnum?: number
	qnum2?: number
	maxnum?: number
	minnum?: number
	disInputHatena?: boolean
}
export class EXCell extends BoardPiece {
	constructor(puzzle: Puzzle, option?: EXCellOption) {
		super(puzzle)
		Object.assign(this, option)
		this.pureObject = { ...this }
	}

	override group: IGroup = 'excell'
	adjacent: {
		top: Cell,
		bottom: Cell,
		left: Cell,
		right: Cell
	} = null!	// 隣接するセルの情報を保持する

	//---------------------------------------------------------------------------
	// initAdjacent()   隣接セルの情報を設定する
	// initAdjBorder()  隣接境界線の情報を設定する
	//---------------------------------------------------------------------------
	initAdjacent() {
		this.adjacent = {
			top: this.relobj(0, -2),
			bottom: this.relobj(0, 2),
			left: this.relobj(-2, 0),
			right: this.relobj(2, 0)
		};
	}

	override relobj(dx: number, dy: number): Cell {
		return super.relobj(dx, dy) as Cell
	}

	//-----------------------------------------------------------------------
	// excell.getNum()     該当するCellの数字を返す
	// excell.setNum()     該当するCellに数字を設定する
	// excell.noNum()      該当するCellに数字がないか返す
	//-----------------------------------------------------------------------
	getNum() { return this.qnum; }
	setNum(val: number) { this.setQnum(val); }
	noNum() { return !this.isnull && this.qnum === -1; }

	//---------------------------------------------------------------------------
	// excell.is51cell()   [＼]のセルかチェックする
	//---------------------------------------------------------------------------
	override is51cell() { return (this.ques === 51); }

	//---------------------------------------------------------------------------
	// excell.ice() アイスのマスかどうか判定する
	//---------------------------------------------------------------------------
	ice() { return false; }
	noLP() {
		return false;
	}
}

export const isCell = (piece: BoardPiece): piece is Cell => (piece.group === "cell")
export const isBorder = (piece: BoardPiece): piece is Border => (piece.group === "border")
export const isCross = (piece: BoardPiece): piece is Cross => (piece.group === "cross")
export const isEXCell = (piece: BoardPiece): piece is EXCell => (piece.group === "excell")
