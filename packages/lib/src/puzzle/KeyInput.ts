// KeyInput.js v3.4.1
import { Address, type Position } from "./Address.js";
import type { Puzzle } from "./Puzzle.js";
import { type BoardPiece, Cell, EXCell } from "./Piece.js";
//---------------------------------------------------------------------------
// ★KeyEventクラス キーボード入力に関する情報の保持とイベント処理を扱う
//---------------------------------------------------------------------------
// パズル共通 キーボード入力部
// KeyEventクラスを定義
export type KeyEventOption = {
	enablemake?: boolean
	enableplay?: boolean
}
//---------------------------------------------------------
export class KeyEvent {
	cursor: TargetCursor
	enableKey: boolean

	constructor(puzzle: Puzzle, option?: KeyEventOption) {
		this.puzzle = puzzle;
		Object.assign(this, option)

		this.pid = puzzle.pid;
		this.cursor = this.puzzle.cursor;

		this.enableKey = true;		// キー入力は有効か

		this.isCTRL = false;
		this.isMETA = false;	// MacのCommandキーなど
		this.isALT = false;	// ALTはメニュー用なので基本的に使わない
		this.isSHIFT = false;
		this.isZ = false;
		this.isX = false;
		this.isY = false;

		this.keydown = false;
		this.keyup = false;

		this.ca = '';

		this.prev = null;

		//this.keyreset();
	}
	puzzle: Puzzle
	enablemake = true
	enableplay = true
	keyup_event = false	/* keyupイベントでもパズル個別のキーイベント関数を呼び出す */
	isCTRL: boolean
	isMETA: boolean
	isALT: boolean
	isSHIFT: boolean
	isZ: boolean
	isX: boolean
	isY: boolean
	keydown: boolean
	keyup: boolean
	ca: string
	prev: any
	cancelDefault: boolean = false
	cancelEvent: boolean = false
	pid: string



	//---------------------------------------------------------------------------
	// kc.keyreset()     キーボード入力に関する情報を初期化する
	// kc.isenablemode() 現在のモードでキー入力が有効か判定する
	//---------------------------------------------------------------------------
	keyreset() {
		this.isCTRL = false;
		this.isMETA = false;	// MacのCommandキーなど
		this.isALT = false;	// ALTはメニュー用なので基本的に使わない
		this.isSHIFT = false;
		this.isZ = false;
		this.isX = false;
		this.isY = false;

		this.keydown = false;
		this.keyup = false;

		this.ca = '';

		this.prev = null;
	}
	isenablemode() {
		return ((this.puzzle.editmode && this.enablemake) || (this.puzzle.playmode && this.enableplay));
	}

	//---------------------------------------------------------------------------
	// kc.e_keydown()  キーを押した際のイベント共通処理
	// kc.e_keyup()    キーを離した際のイベント共通処理
	//---------------------------------------------------------------------------
	// この3つのキーイベントはwindowから呼び出される(kcをbindしている)
	e_keydown(e: KeyboardEvent) {
		if (!this.enableKey) { return; }

		const c = this.getchar(e);
		this.checkbutton(c, 0);
		if (c) { this.keyevent(c, 0); }

		if (e.target === this.puzzle.canvas || this.cancelDefault) {
			e.stopPropagation();
			e.preventDefault();
		}
	}
	e_keyup(e: KeyboardEvent) {
		if (!this.enableKey) { return; }

		const c = this.getchar(e);
		this.checkbutton(c, 1);
		if (c) { this.keyevent(c, 1); }

		if (e.target === this.puzzle.canvas || this.cancelDefault) {
			e.stopPropagation();
			e.preventDefault();
		}
	}

	//---------------------------------------------------------------------------
	// kc.checkmodifiers()  Shift, Ctrl, Alt, Metaキーをチェックする
	// kc.checkbutton()     Z, X, Yキーの押下状況をチェックする
	//---------------------------------------------------------------------------
	checkmodifiers(e: KeyboardEvent | MouseEvent) {
		this.isSHIFT = e.shiftKey;
		this.isCTRL = e.ctrlKey;
		this.isMETA = e.metaKey;
		this.isALT = e.altKey;
	}
	checkbutton(charall: string, step: number) {
		const c = charall.split(/\+/).pop();
		if (c === 'z') { this.isZ = (step === 0); }
		if (c === 'x') { this.isX = (step === 0); }
		if (c === 'y') { this.isY = (step === 0); }
	}

	//---------------------------------------------------------------------------
	// kc.getchar()  入力されたキーを表す文字列を返す
	//---------------------------------------------------------------------------
	// 48～57は0～9キー、65～90はa～z、96～105はテンキー、112～123はF1～F12キー
	getchar(e: KeyboardEvent) {
		this.checkmodifiers(e);

		let key = '';
		const keycode = (!!e.keyCode ? e.keyCode : e.charCode);

		if (keycode === 38) { key = 'up'; }
		else if (keycode === 40) { key = 'down'; }
		else if (keycode === 37) { key = 'left'; }
		else if (keycode === 39) { key = 'right'; }
		else if (48 <= keycode && keycode <= 57) { key = (keycode - 48).toString(36); }
		else if (65 <= keycode && keycode <= 90) { key = (keycode - 55).toString(36); } //アルファベット
		else if (96 <= keycode && keycode <= 105) { key = (keycode - 96).toString(36); } //テンキー対応
		else if (112 <= keycode && keycode <= 123) { key = `F${(keycode - 111).toString(10)}`; } /* 112～123はF1～F12キー */
		else if (keycode === 32 || keycode === 46) { key = ' '; } // 32はスペースキー 46はdelキー
		else if (keycode === 8) { key = 'BS'; }
		else if (keycode === 109 || keycode === 189 || keycode === 173) { key = '-'; }

		const keylist = (!!key ? [key] : []);
		if (this.isMETA) { keylist.unshift('meta'); }
		if (this.isALT) { keylist.unshift('alt'); }
		if (this.isCTRL) { keylist.unshift('ctrl'); }
		if (this.isSHIFT) { keylist.unshift('shift'); }
		key = keylist.join('+');

		if (key === 'alt+h') { key = 'left'; }
		else if (key === 'alt+k') { key = 'up'; }
		else if (key === 'alt+j') { key = 'down'; }
		else if (key === 'alt+l') { key = 'right'; }

		return key;
	}

	//---------------------------------------------------------------------------
	// kc.inputKeys()   キーボードイベントを実行する
	//---------------------------------------------------------------------------
	inputKeys(...args: string[]) {
		for (let i = 0; i < args.length; i++) {
			this.keyevent(args[i], 0);
			this.keyevent(args[i], 1);
		}
	}

	//---------------------------------------------------------------------------
	// kc.keyevent()  キーイベント処理
	//---------------------------------------------------------------------------
	keyevent(c: string, step: number) {
		const puzzle = this.puzzle;
		this.cancelEvent = false;
		this.cancelDefault = false;
		this.keydown = (step === 0);
		this.keyup = (step === 1);

		if (this.keydown) { puzzle.opemgr.newOperation(); }
		else { puzzle.opemgr.newChain(); }

		if (this.keydown && !this.isZ) {
			puzzle.errclear();
		}

		puzzle.emit('key', c);
		if (this.cancelEvent) { return; }
		if (!this.keyexec(c)) { return; }
		if (!this.keyDispInfo(c)) { return; }
		if (!this.isenablemode()) { return; }
		if (this.keydown && this.moveTarget(c)) { this.cancelDefault = true; return; }
		if (this.keydown || (this.keyup && this.keyup_event)) { this.keyinput(c); }	/* 各パズルのルーチンへ */
	}

	//---------------------------------------------------------------------------
	// kc.keyexec() モードに共通で行う処理を実行します
	//---------------------------------------------------------------------------
	keyexec(c: string) {
		const puzzle = this.puzzle;
		if (this.keydown && c === 'alt+c' && !puzzle.playeronly) {
			puzzle.setMode(puzzle.playmode ? 1 : 3);
			return false;
		}
		return true;
	}

	//---------------------------------------------------------------------------
	// kc.keyDispInfo() 一時的に情報を表示する処理を追加します
	//---------------------------------------------------------------------------
	keyDispInfo(c: string) { return true; }

	//---------------------------------------------------------------------------
	// kc.keyinput() キーを押した/離した際の各パズルごとのイベント処理。
	//               各パズルのファイルでオーバーライドされる。
	//---------------------------------------------------------------------------
	// オーバーライド用
	keyinput(c: string) {
		this.key_inputqnum(c); /* デフォルトはCell数字入力 */
	}

	//---------------------------------------------------------------------------
	// kc.moveTarget()  キーボードからの入力対象を矢印キーで動かす
	// kc.moveTCell()   Cellのキーボードからの入力対象を矢印キーで動かす
	// kc.moveTCross()  Crossのキーボードからの入力対象を矢印キーで動かす
	// kc.moveTBorder() Borderのキーボードからの入力対象を矢印キーで動かす
	// kc.moveTC()      上記3つの関数の共通処理
	//---------------------------------------------------------------------------
	moveTarget(ca: string) { return this.moveTCell(ca); }
	moveTCell(ca: string) { return this.moveTC(ca, 2); }
	moveTCross(ca: string) { return this.moveTC(ca, 2); }
	moveTBorder(ca: string) { return this.moveTC(ca, 1); }
	moveTC(ca: string, mv: number) {
		const cursor = this.cursor;
		const pos0 = cursor.getaddr();
		let flag = true;
		let dir = cursor.NDIR;
		switch (ca) {
			case 'up': if (cursor.by - mv >= cursor.miny) { dir = cursor.UP; } break;
			case 'down': if (cursor.by + mv <= cursor.maxy) { dir = cursor.DN; } break;
			case 'left': if (cursor.bx - mv >= cursor.minx) { dir = cursor.LT; } break;
			case 'right': if (cursor.bx + mv <= cursor.maxx) { dir = cursor.RT; } break;
			default: flag = false; break;
		}

		if (flag) {
			cursor.movedir(dir, mv);

			pos0.draw();
			cursor.draw();
		}
		return flag;
	}

	//---------------------------------------------------------------------------
	// kc.moveEXCell()  EXCellのキーボードからの入力対象を矢印キーで動かす
	//---------------------------------------------------------------------------
	moveEXCell(ca: string) {
		const cursor = this.cursor;
		const addr0 = cursor.getaddr();
		let flag = true;
		let dir = addr0.NDIR;
		switch (ca) {
			case 'up':
				if (cursor.by === cursor.maxy && cursor.minx < cursor.bx && cursor.bx < cursor.maxx) { cursor.by = cursor.miny; }
				else if (cursor.by > cursor.miny) { dir = addr0.UP; }
				else if (this.pid === "easyasabc" && cursor.by === -1) { dir = addr0.UP; } else { flag = false; }
				break;
			case 'down':
				if (cursor.by === cursor.miny && cursor.minx < cursor.bx && cursor.bx < cursor.maxx) { cursor.by = cursor.maxy; }
				else if (cursor.by < cursor.maxy) { dir = addr0.DN; }
				else if (this.pid === "easyasabc" && cursor.by === -3) { dir = addr0.DN; } else { flag = false; }
				break;
			case 'left':
				if (cursor.bx === cursor.maxx && cursor.miny < cursor.by && cursor.by < cursor.maxy) { cursor.bx = cursor.minx; }
				else if (cursor.bx > cursor.minx) { dir = addr0.LT; } else { flag = false; }
				break;
			case 'right':
				if (cursor.bx === cursor.minx && cursor.miny < cursor.by && cursor.by < cursor.maxy) { cursor.bx = cursor.maxx; }
				else if (cursor.bx < cursor.maxx) { dir = addr0.RT; } else { flag = false; }
				break;
			default: flag = false; break;
		}

		if (flag) {
			if (dir !== addr0.NDIR) { cursor.movedir(dir, 2); }

			addr0.draw();
			cursor.draw();
		}
		return flag;
	}
	//---------------------------------------------------------------------------
	// kc.key_inputcross() 上限maxまでの数字をCrossの問題データをして入力する(keydown時)
	//---------------------------------------------------------------------------
	key_inputcross(ca: string) {
		const cross = this.cursor.getx();
		const max = cross.getmaxnum();
		let val = -1;

		if ('0' <= ca && ca <= '9') {
			const num = +ca;
			let cur = cross.qnum;
			if (cur <= 0 || cur * 10 + num > max) { cur = 0; }
			val = cur * 10 + num;
			if (val > max) { return; }
		}
		else if (ca === '-') { cross.setQnum(cross.qnum !== -2 ? -2 : -1); }
		else if (ca === ' ') { cross.setQnum(-1); }
		else { return; }

		cross.setQnum(val);
		cross.draw();
	}
	//---------------------------------------------------------------------------
	// kc.key_inputqnum() 上限maxまでの数字をCellの問題データをして入力する(keydown時)
	//---------------------------------------------------------------------------
	key_inputqnum(ca: string) {
		const cell = this.cursor.getc();
		if (cell.enableSubNumberArray && this.puzzle.playmode && ca === 'shift' && cell.noNum()) {
			this.cursor.chtarget();
		}
		else {
			this.key_inputqnum_main(cell, ca);
		}
	}
	key_inputqnum_main(cell: Cell, ca: string) {
		let cell0 = cell;
		const puzzle = this.puzzle;
		const bd = puzzle.board;
		if (puzzle.editmode && bd.roommgr.hastop) {
			cell0 = cell = cell.room.top;
		}
		else if (puzzle.execConfig('dispmove')) {
			if (cell.isDestination()) { cell = cell.base!; }
			else if (cell.lcnt > 0) { return; }
		}

		if (cell.enableSubNumberArray && this.cursor.targetdir >= 2) {
			const snumpos = [-1, -1, 2, 3, 1, 0][this.cursor.targetdir];
			if (snumpos === -1) { return; }
			const val = this.getNewNumber(cell, ca, cell.snum[snumpos]);
			if (val === null) { return; }
			cell.setSnum(snumpos, val);
		}
		else {
			const val = this.getNewNumber(cell, ca, cell.getNum());
			if (val === null) { return; }
			cell.setNum(val);
			if (cell.numberWithMB && cell.enableSubNumberArray && ca === ' ') { cell.clrSnum(); }
		}

		if (puzzle.execConfig('dispmove') && cell.noNum()) {
			cell.eraseMovedLines();		/* 丸数字がなくなったら付属する線も消去する */
		}

		cell0.draw();
		this.prev = cell;
	}
	getNewNumber(cell: Cell, ca: string, cur: number) {
		const max = cell.getmaxnum();
		const min = cell.getminnum();
		let val = null;

		if ('0' <= ca && ca <= '9' && !cell.numberAsLetter) {
			const num = +ca;
			if (cur <= 0 || cur * 10 + num > max || this.prev !== cell) { cur = 0; }
			val = cur * 10 + num;
			if (val > max || (min > 0 && val === 0)) { val = null; }
		}
		else if ('a' <= ca && ca <= 'z' && ca.length === 1 && cell.numberAsLetter) {
			if (ca.length > 1 && ca !== 'BS') { return null; }
			const num = Number.parseInt(ca, 36) - 10;
			if (cur > 0 && (cur - 1) % 26 === num) { // Same alphabet
				val = ((cur <= 26) ? cur + 26 : -1);
			}
			else { val = num + 1; }
			if (val > max || (min > 0 && val === 0)) { val = null; }
		}
		else if (ca === 'BS') {
			if (cur < 10 || cell.numberAsLetter) { val = -1; }
			else { val = (cur / 10) | 0; }
		}
		else if (ca === '-') { val = ((this.puzzle.editmode && !cell.disInputHatena) ? -2 : -1); }
		else if (ca === ' ') { val = -1; }
		else if (ca === 's1') { val = -2; }
		else if (ca === 's2') { val = -3; }
		else { val = null; }

		return val;
	}

	//---------------------------------------------------------------------------
	// kc.key_inputarrow()  四方向の矢印などを設定する
	// kc.key_inputdirec()  四方向の矢印つき数字の矢印を設定する
	//---------------------------------------------------------------------------
	key_inputarrow(ca: string) {
		return this.key_inputdirec_common(ca, false);
	}
	key_inputdirec(ca: string) {
		return this.key_inputdirec_common(ca, true);
	}
	key_inputdirec_common(ca: string, arrownum: boolean) { // 共通処理
		const cell = this.cursor.getc();
		if (arrownum && cell.qnum === -1) { return false; }

		let dir = cell.NDIR;
		switch (ca) {
			case 'shift+up': dir = cell.UP; break;
			case 'shift+down': dir = cell.DN; break;
			case 'shift+left': dir = cell.LT; break;
			case 'shift+right': dir = cell.RT; break;
		}

		if (dir !== cell.NDIR) {
			cell.setQdir(cell.qdir !== dir ? dir : cell.NDIR);
			if (!arrownum) { cell.setQnum(-1); }
			this.cursor.draw();
			return true;
		}
		return false;
	}

	//---------------------------------------------------------------------------
	// kc.inputnumber51()  [＼]の数字等を入力する
	// kc.setnum51()      モード別に数字を設定する
	// kc.getnum51()      モード別に数字を取得する
	//---------------------------------------------------------------------------
	inputnumber51(ca: string, max_obj?: any) {
		const cursor = this.cursor;
		if (ca === 'shift') { cursor.chtarget(); return; }

		const piece = cursor.getobj(); /* cell or excell */
		const target = cursor.detectTarget(piece);
		if (target === 0 || (piece.group === 'cell' && piece.is51cell())) {
			if (ca === 'q' && !piece.isnull) {
				if (!piece.is51cell()) { piece.set51cell(); }
				else { piece.remove51cell(); }
				cursor.drawaround();
				return;
			}
		}
		if (target === 0) { return; }

		const def = Cell.prototype[(target === piece.RT ? 'qnum' : 'qnum2')]; // TODO
		const max = piece.getmaxnum();
		let val = def;

		if ('0' <= ca && ca <= '9') {
			const num = +ca;
			let cur = this.getnum51(piece, target);
			if (cur <= 0 || cur * 10 + num > max || this.prev !== piece) { cur = 0; }
			val = cur * 10 + num;
			if (val > max) { return; }
		}
		else if (ca === '-' || ca === ' ') { val = def; }
		else { return; }

		this.setnum51(piece, target, val);
		this.prev = piece;
		cursor.draw();
	}
	setnum51(piece: BoardPiece, target: number, val: number) { /* piece : cell or excell */
		if (target === piece.RT) { piece.setQnum(val); }
		else { piece.setQnum2(val); }
	}
	getnum51(piece: BoardPiece, target: number) { /* piece : cell or excell */
		return (target === piece.RT ? piece.qnum : piece.qnum2);
	}
}

//---------------------------------------------------------------------------
// ★TargetCursorクラス キー入力のターゲットを保持する
//---------------------------------------------------------------------------
export class TargetCursor extends Address {

	mode51: boolean
	modesnum: boolean
	pid: string

	constructor(puzzle: Puzzle, option: any) {
		super(puzzle);
		Object.assign(this, option)
		this.pid = puzzle.pid
		this.bx = 1;
		this.by = 1;
		this.mode51 = (EXCell.prototype.ques === 51);
		this.modesnum = (Cell.prototype.enableSubNumberArray);
		if (this.mode51 && this.puzzle.editmode) { this.targetdir = 4; } // right
	}
	override init(bx: number, by: number) {
		this.bx = bx;
		this.by = by;
		if (!this.mode51) { this.targetdir = 0; }
		return this;
	}

	// 有効な範囲(minx,miny)-(maxx,maxy)
	minx: number = null!
	miny: number = null!
	maxx: number = null!
	maxy: number = null!

	crosstype = false

	//---------------------------------------------------------------------------
	// tc.initCursor()           初期化時にカーソルの位置を設定する
	//---------------------------------------------------------------------------
	initCursor() {
		if (this.crosstype) { this.init(0, 0); }
		else { this.init(1, 1); }

		this.adjust_init();
	}

	//---------------------------------------------------------------------------
	// tc.setminmax()            初期化時・モード変更時にプロパティを設定する
	// tc.setminmax_customize()  初期化時・モード変更時のプロパティをパズルごとに調節する
	//---------------------------------------------------------------------------
	setminmax() {
		const bd = this.board;
		const bm = (!this.crosstype ? 1 : 0);
		this.minx = bd.minbx + bm;
		this.miny = bd.minby + bm;
		this.maxx = bd.maxbx - bm;
		this.maxy = bd.maxby - bm;

		this.setminmax_customize();

		this.adjust_init();
	}
	setminmax_customize() { }

	//---------------------------------------------------------------------------
	// tc.adjust_init()       初期化時にカーソルの位置がおかしい場合に調整する
	// tc.adjust_modechange() モード変更時にカーソルの位置を調節する
	// tc.adjust_cell_to_excell() モード変更時にカーソルの位置をCellからEXCellへ移動する
	//---------------------------------------------------------------------------
	adjust_init() {
		if (this.bx < this.minx) { this.bx = this.minx; }
		if (this.by < this.miny) { this.by = this.miny; }
		if (this.bx > this.maxx) { this.bx = this.maxx; }
		if (this.by > this.maxy) { this.by = this.maxy; }
	}
	adjust_modechange() {
		//if (this.setminmax_customize !== this.common.setminmax_customize) { this.setminmax(); }
		this.setminmax(); // editmode, playmodeでminmaxが異なるパズル
		if (this.mode51 && this.puzzle.editmode) { this.targetdir = 4; } // right
		else if (this.modesnum && this.puzzle.playmode) { this.targetdir = 0; }
	}
	adjust_cell_to_excell() {
		const bd = this.board;
		const shortest = Math.min(this.bx, (bd.cols * 2 - this.bx), this.by, (bd.rows * 2 - this.by));
		if (shortest <= 0) { return; }
		if (this.by === shortest) { this.by = this.miny; }
		else if (bd.rows * 2 - this.by === shortest) { this.by = this.maxy; }
		else if (this.bx === shortest) { this.bx = this.minx; }
		else if (bd.cols * 2 - this.bx === shortest) { this.bx = this.maxx; }
	}

	//---------------------------------------------------------------------------
	// tc.checksnum()  ターゲットの位置かどうか判定する (Cellのみ)
	//---------------------------------------------------------------------------
	checksnum(pos: Position) {
		const bx = ((((pos.bx + 12) / 2) | 0) - 6) * 2 + 1;
		const by = ((((pos.by + 12) / 2) | 0) - 6) * 2 + 1;
		let result = (this.bx === bx && this.by === by);
		if (result && this.modesnum && this.puzzle.playmode) {
			const tmpx = (((pos.bx + 12) % 2) * 1.5) | 0;
			const tmpy = (((pos.by + 12) % 2) * 1.5) | 0;
			if (this.pid !== 'factors') {
				result = ([5, 0, 4, 0, 0, 0, 2, 0, 3][tmpy * 3 + tmpx] === this.targetdir);
			}
			else {
				result = ([0, 0, 4, 0, 0, 0, 2, 0, 3][tmpy * 3 + tmpx] === this.targetdir);
			}
		}
		return result;
	}

	//---------------------------------------------------------------------------
	// tc.getaddr() ターゲットの位置を移動する
	//---------------------------------------------------------------------------
	override movedir(dir: number, mv: number) {
		super.movedir(dir, mv);
		if (this.modesnum && this.puzzle.playmode) { this.targetdir = 0; }
		return this;
	}

	//---------------------------------------------------------------------------
	// tc.getaddr() ターゲットの位置をAddressクラスのオブジェクトで取得する
	// tc.setaddr() ターゲットの位置をAddressクラス等のオブジェクトで設定する
	//---------------------------------------------------------------------------
	setaddr<T extends { bx: number, by: number }>(pos: T) { /* Address, Cellなどのオブジェクトいずれを入力しても良い */
		if (pos.bx < this.minx || this.maxx < pos.bx || pos.by < this.miny - (this.pid === 'easyasabc' ? 2 : 0) || this.maxy < pos.by) { return; }
		this.set(pos);
		if (this.modesnum && this.puzzle.playmode) { this.targetdir = 0; }
	}

	//---------------------------------------------------------------------------
	// tc.moveTo() ターゲットの位置を指定した(bx,by)に設定する
	//---------------------------------------------------------------------------
	moveTo(bx: number, by: number) {
		this.init(bx, by);
		if (this.modesnum && this.puzzle.playmode) { this.targetdir = 0; }
	}

	//---------------------------------------------------------------------------
	// tc.chtarget()     SHIFTを押した時に[＼]の入力するところを選択する
	// tc.detectTarget() [＼]の右・下どちらに数字を入力するか判断する
	// tc.getNumOfTarget() Cell上でtargetとして取りうる数を返す
	//---------------------------------------------------------------------------
	targetdir = 0
	chtarget() {
		if (this.oncell() && this.modesnum && this.puzzle.playmode) {
			if (this.pid !== 'factors') {
				this.targetdir = [5, 1, 3, 0, 2, 4][this.targetdir];
			}
			else {
				this.targetdir = [4, 1, 3, 0, 2, 0][this.targetdir];
			}
		}
		else {
			this.targetdir = (this.targetdir === 2 ? 4 : 2);
		}
		this.draw();
	}
	detectTarget(piece?: BoardPiece) {
		piece = piece || this.getobj();
		const bd = this.board;
		if (piece.isnull) { return 0; }
		if (piece.group === 'cell') {
			const adc = (piece as Cell).adjacent;
			if (piece.ques !== 51 || piece.id === bd.cell.length - 1) { return 0; }

			const invalidRight = (adc.right.isnull || adc.right.ques === 51);
			const invalidBottom = (adc.bottom.isnull || adc.bottom.ques === 51);
			if (invalidRight && invalidBottom) { return 0; }
			if (invalidBottom) { return piece.RT; }
			if (invalidRight) { return piece.DN; }
		}
		else if (piece.group === 'excell') {
			const adc = (piece as EXCell).adjacent;
			if (piece.id === bd.cols + bd.rows) { return 0; }
			if ((piece.by === -1 && adc.bottom.ques === 51) ||
				(piece.bx === -1 && adc.right.ques === 51)) { return 0; }
			if (piece.by === -1) { return piece.DN; }
			if (piece.bx === -1) { return piece.RT; }
		}
		else { return 0; }

		return this.targetdir;
	}
	getNumOfTarget(piece: BoardPiece) {
		let num = 1;
		if (piece.isnull) { num = 0; }
		else if (piece.group === 'cell') {
			if (this.modesnum && this.puzzle.playmode) {
				num = 4 - (this.pid === 'factors' ? 1 : 0);
			}
			else if (piece.ques === 51) {
				const adc = (piece as Cell).adjacent;
				num = ((!adc.right.isnull && adc.right.ques !== 51) ? 1 : 0) +
					((!adc.bottom.isnull && adc.bottom.ques !== 51) ? 1 : 0);
			}
		}
		return num;
	}


}
