// MouseInput.js v3.5.2

//---------------------------------------------------------------------------
// ★MouseEventクラス マウス入力に関する情報の保持とイベント処理を扱う
//---------------------------------------------------------------------------
// パズル共通 マウス入力部
// MouseEventクラスを定義
import type { Puzzle } from "./Puzzle";
import { RawAddress, Address, type Position } from "./Address";
import type { TargetCursor } from "./KeyInput";
import { CellList, CrossList } from "./PieceList";
import { type Border, Cell, type Cross, type EXCell } from "./Piece";
import { pzpr } from "../pzpr/core";
import { getMouseButton, getPagePos, getRect } from "../pzpr/util";

type IMode = "edit" | "play"

export class MouseEvent1 {
	puzzle: Puzzle
	cursor: TargetCursor;	// TargetCursor
	enableMouse: boolean;	// マウス入力は有効か
	mouseCell: any;	// 入力されたセル等のID
	firstCell: any;	// mousedownされた時のセルのID(連黒分断禁用)
	inputPoint: any;	// 入力イベントが発生したborder座標 ※端数あり
	firstPoint: any;	// mousedownされた時のborder座標 ※端数あり

	prevPos: Address;	// 前回のマウス入力イベントのborder座標
	btn: string;	// 押されているボタン
	inputData: any;	// 入力中のデータ番号(実装依存)
	bordermode: boolean;	// 境界線を入力中かどうか
	mousestart: boolean;	// mousedown/touchstartイベントかどうか
	mousemove: boolean;	// mousemove/touchmoveイベントかどうか
	mouseend: boolean;	// mouseup/touchendイベントかどうか
	cancelEvent: boolean;	// イベントキャンセルフラグ

	constructor(puzzle: Puzzle) {
		this.puzzle = puzzle;
		this.cursor = puzzle.cursor;
		this.pid = puzzle.pid

		this.enableMouse = true;	// マウス入力は有効か

		this.mouseCell = null;		// 入力されたセル等のID
		this.firstCell = null;		// mousedownされた時のセルのID(連黒分断禁用)

		this.inputPoint = new RawAddress(puzzle, null, null);	// 入力イベントが発生したborder座標 ※端数あり
		this.firstPoint = new RawAddress(puzzle, null, null);	// mousedownされた時のborder座標 ※端数あり
		this.prevPos = new Address(puzzle, null, null);		// 前回のマウス入力イベントのborder座標

		this.btn = '';				// 押されているボタン
		this.inputData = null;		// 入力中のデータ番号(実装依存)

		this.bordermode = false;	// 境界線を入力中かどうか

		this.mousestart = false;	// mousedown/touchstartイベントかどうか
		this.mousemove = false;		// mousemove/touchmoveイベントかどうか
		this.mouseend = false;		// mouseup/touchendイベントかどうか

		this.inputMode = 'auto';
		this.savedInputMode = { edit: 'auto', play: 'auto' };

		this.mousereset();
	}

	RBShadeCell = false	// 連黒分断禁のパズル

	use = false	// 黒マスの入力方法選択
	bgcolor = false	// 背景色の入力を可能にする

	inputMode = 'auto'	// 現在のinputMode
	savedInputMode: { edit: any, play: any } = { edit: null, play: null }	// モード変更時の保存値
	inputModes: { edit: string[], play: string[] } = { edit: [], play: [] }	// 現在のパズル種類にてauto以外で有効なinputModeの配列

	inversion = false	// マウスのボタンを左右反転する
	pid: string;	// puzzle ID

	//---------------------------------------------------------------------------
	// mv.mousereset() マウス入力に関する情報を初期化する
	// mv.modechange() モード変更時に設定を初期化する
	//---------------------------------------------------------------------------
	mousereset() {
		const cell0 = this.mouseCell;

		this.mouseCell = // 下の行へ続く
			this.firstCell = this.puzzle.board.emptycell;

		this.firstPoint.reset();
		this.prevPos.reset();

		this.btn = '';
		this.inputData = null;

		this.bordermode = false;

		this.mousestart = false;
		this.mousemove = false;
		this.mouseend = false;

		if (this.puzzle.execConfig('dispmove') && !!cell0 && !cell0.isnull) { cell0.draw(); }
	}
	modechange() {
		this.mousereset();
		this.inputMode = this.savedInputMode[this.puzzle.editmode ? 'edit' : 'play'];
	}

	//---------------------------------------------------------------------------
	// mv.e_mousedown() Canvas上でマウスのボタンを押した際のイベント共通処理
	// mv.e_mouseup()   Canvas上でマウスのボタンを放した際のイベント共通処理
	// mv.e_mousemove() Canvas上でマウスを動かした際のイベント共通処理
	// mv.e_mousecancel() Canvas上でマウス操作がキャンセルされた場合のイベント共通処理
	//---------------------------------------------------------------------------
	//イベントハンドラから呼び出される
	// この3つのマウスイベントはCanvasから呼び出される(mvをbindしている)
	e_mousedown(e: MouseEvent) {
		if (!this.enableMouse) { return true; }

		this.setMouseButton(e);			/* どのボタンが押されたか取得 (mousedown時のみ) */
		if (!this.btn) { this.mousereset(); return; }
		const addrtarget = this.getBoardAddress(e);
		this.moveTo(addrtarget.bx, addrtarget.by);

		e.stopPropagation();
		e.preventDefault();
	}
	e_mouseup(e: MouseEvent) {
		if (!this.enableMouse || !this.btn) { return true; }

		this.inputEnd();

		e.stopPropagation();
		e.preventDefault();
	}
	e_mousemove(e: MouseEvent) {
		if (!this.enableMouse || !this.btn) { return true; }
		//@ts-ignore
		if (e.touches !== void 0 || e.which === void 0 || e.which !== 0 || (e.type.match(/pointermove/i) && e.buttons > 0)) {
			const addrtarget = this.getBoardAddress(e);
			this.lineTo(addrtarget.bx, addrtarget.by);
		}
		else { this.mousereset(); }

		e.stopPropagation();
		e.preventDefault();
	}
	e_mousecancel(e: MouseEvent) {
		this.mousereset();
	}

	//---------------------------------------------------------------------------
	// mv.setMouseButton()  イベントが起こったボタンを設定する
	// mv.getBoardAddress() イベントが起こったcanvas内の座標を取得する
	//---------------------------------------------------------------------------
	setMouseButton(e: MouseEvent) {
		this.btn = getMouseButton(e);

		// SHIFTキー/Commandキーを押している時は左右ボタン反転
		const kc = this.puzzle.key;
		kc.checkmodifiers(e);
		if (((kc.isSHIFT || kc.isMETA) !== this.inversion) || this.inputMode === 'number-') {
			if (this.btn === 'left') { this.btn = 'right'; }
			else if (this.btn === 'right') { this.btn = 'left'; }
		}
	}
	getBoardAddress(e: MouseEvent) {
		const puzzle = this.puzzle;
		const pc = puzzle.painter;
		let pix = { px: Number.NaN, py: Number.NaN };
		const g = pc.context;
		if (!g) { return { bx: null, by: null }; }
		if (this.puzzle.canvas.children[0] instanceof SVGSVGElement) {
			const svg = this.puzzle.canvas.children[0]
			// SVGの座標系でのポイントを作成
			const pt = svg.createSVGPoint();
			pt.x = e.clientX;
			pt.y = e.clientY;

			// スクリーン座標からSVG座標へ変換
			const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
			pix = { px: svgP.x + pc.x0, py: svgP.y + pc.y0 }
		}
		else if (!pzpr.env.API.touchevent || pzpr.env.API.pointerevent || pzpr.env.OS.iOS) {
			if (!Number.isNaN(e.offsetX)) { pix = { px: e.offsetX, py: e.offsetY }; }
			else { pix = { px: e.layerX, py: e.layerY }; }  // Firefox 39以前, iOSはこちら
		}
		else {
			const pagePos = getPagePos(e);
			const rect = getRect(pc.context.child);
			pix = { px: (pagePos.px - rect.left), py: (pagePos.py - rect.top) };
		}
		return { bx: (pix.px - pc.x0) / pc.bw, by: (pix.py - pc.y0) / pc.bh };
	}

	//---------------------------------------------------------------------------
	// mv.moveTo()   Canvas上にマウスの位置を設定する
	// mv.lineTo()   Canvas上でマウスを動かす
	// mv.inputEnd() Canvas上のマウス入力処理を終了する
	// mv.inputPath() Canvas上でひとつながりになる線を入力する
	//---------------------------------------------------------------------------
	moveTo(bx: number, by: number) {
		this.inputPoint.init(bx, by);
		this.mouseevent(0);
	}
	lineTo(bx: number, by: number) {
		/* 前回の位置からの差分を順番に入力していきます */
		const dx = (bx - this.inputPoint.bx);
		const dy = (by - this.inputPoint.by);
		const distance = (((dx >= 0 ? dx : -dx) + (dy >= 0 ? dy : -dy)) * 2 + 0.9) | 0; /* 0.5くらいずつ動かす */
		const mx = dx / distance;
		const my = dy / distance;
		for (let i = 0; i < distance - 1; i++) {
			this.inputPoint.move(mx, my);
			this.mouseevent(1);
		}
		this.inputPoint.init(bx, by);
		this.mouseevent(1);
	}
	inputEnd() {
		this.mouseevent(2);
		this.mousereset();
	}
	inputPath(...args: any[]) {
		this.mousereset();
		this.btn = (typeof args[0] === 'string' ? args.shift() : 'left');
		this.moveTo(args[0], args[1]);
		for (let i = 2; i < args.length - 1; i += 2) { /* 奇数個の最後の一つは切り捨て */
			this.lineTo(args[i], args[i + 1]);
		}
		this.inputEnd();
	}

	//---------------------------------------------------------------------------
	// mv.mouseevent() マウスイベント処理
	//---------------------------------------------------------------------------
	mouseevent(step: number) {
		this.cancelEvent = false;
		this.mousestart = (step === 0);
		this.mousemove = (step === 1);
		this.mouseend = (step === 2);

		const puzzle = this.puzzle;
		puzzle.emit('mouse');
		if (!this.cancelEvent && (this.btn === 'left' || this.btn === 'right')) {
			if (this.mousestart) {
				puzzle.opemgr.newOperation();
				puzzle.errclear();
			}
			else { puzzle.opemgr.newChain(); }

			this.mouseinput();
		}
	}

	//---------------------------------------------------------------------------
	// mv.mouseinput()       マウスイベント共通処理。
	// mv.mouseinput_number()数字入力処理
	// mv.mouseinput_clear() セル内容の消去処理
	// mv.mouseinput_auto()  マウスイベント処理。各パズルのファイルでオーバーライドされる。
	// mv.mouseinput_other() inputMode指定時のマウスイベント処理。各パズルのファイルでオーバーライドされる。
	//---------------------------------------------------------------------------
	mouseinput() {
		let mode = this.inputMode;
		if (this.puzzle.key.isZ && this.inputMode.indexOf("info-") === -1) {
			if (this.inputModes.play.indexOf('info-line') >= 0) { mode = 'info-line'; }
			else if (this.inputModes.play.indexOf('info-blk') >= 0) { mode = 'info-blk'; }
		}
		switch (mode) {
			case 'auto': this.mouseinput_auto(); break;	/* 各パズルのルーチンへ */
			case 'number': case 'number-': this.mouseinput_number(); break;
			case 'clear': this.mouseinput_clear(); break;
			case 'cell51': this.input51_fixed(); break;
			case 'circle-unshade': this.inputFixedNumber(1); break;
			case 'circle-shade': this.inputFixedNumber(2); break;
			case 'undef': this.inputFixedNumber(-2); break;
			case 'ice': this.inputIcebarn(); break;
			case 'numexist': this.inputFixedNumber(-2); break;
			case 'numblank': this.inputFixedNumber(-3); break;
			case 'bgcolor': this.inputBGcolor(true); break;
			case 'subcircle': case 'bgcolor1': this.inputFixedQsub(1); break;
			case 'subcross': case 'bgcolor2': this.inputFixedQsub(2); break;
			case 'completion': if (this.mousestart) { this.inputqcmp(); } break;
			case 'objblank': this.inputDot(); break;
			case 'direc': this.inputdirec(); break;
			case 'arrow': this.inputarrow_cell(); break;
			case 'crossdot': if (this.mousestart) { this.inputcrossMark(); } break;
			case 'border': this.inputborder(); break;
			case 'subline': this.inputQsubLine(); break;
			case 'shade': case 'unshade': this.inputcell(); break;
			case 'line': this.inputLine(); break;
			case 'peke': this.inputpeke(); break;
			case 'bar': this.inputTateyoko(); break;
			case 'info-line': if (this.mousestart) { this.dispInfoLine(); } break;
			case 'info-blk': if (this.mousestart) { this.dispInfoBlk(); } break;
			default: this.mouseinput_other(); break;	/* 各パズルのルーチンへ */
		}
	}
	mouseinput_number() {
		if (this.mousestart) { this.inputqnum(); }
	}
	mouseinput_clear() {
		this.inputclean_cell();
	}
	//オーバーライド用
	mouseinput_auto() { }
	mouseinput_other() { }

	//---------------------------------------------------------------------------
	// mv.notInputted()   盤面への入力が行われたかどうか判定する
	//---------------------------------------------------------------------------
	notInputted() { return !this.puzzle.opemgr.changeflag; }

	//---------------------------------------------------------------------------
	// mv.setInputMode()     入力されるinputModeを固定する (falsyな値でresetする)
	// mv.getInputModeList() 有効なinputModeを配列にして返す (通常はauto)
	//---------------------------------------------------------------------------
	setInputMode(mode: string) {
		mode = mode || 'auto';
		if (this.getInputModeList().indexOf(mode === 'number-' ? 'number' : mode) >= 0) {
			this.inputMode = mode;
			this.savedInputMode[this.puzzle.editmode ? 'edit' : 'play'] = mode;
		}
		else {
			throw `Invalid input mode :${mode}`;
		}
	}
	getInputModeList(type: IMode = null) {
		if (this.puzzle.instancetype === 'viewer') { return []; }
		type = (!!type ? type : (this.puzzle.editmode ? 'edit' : 'play'));
		let list = ['auto'];
		list = list.concat(this.inputModes[type]);
		if (list.indexOf('number') >= 0) { list.splice(list.indexOf('number') + 1, 0, 'number-'); }
		return list;
	}

	//---------------------------------------------------------------------------
	// mv.setInversion()     マウスの左右反転設定を行う
	//---------------------------------------------------------------------------
	setInversion(input: boolean) {
		this.inversion = !!input;
	}

	//---------------------------------------------------------------------------
	// mv.getcell()    入力された位置がどのセルに該当するかを返す
	// mv.getcell_excell()  入力された位置がどのセル/EXCELLに該当するかを返す
	// mv.getcross()   入力された位置がどの交差点に該当するかを返す
	// mv.getborder()  入力された位置がどの境界線・Lineに該当するかを返す(クリック用)
	// mv.getpos()    入力された位置が仮想セル上でどこの(X*2,Y*2)に該当するかを返す。
	//                外枠の左上が(0,0)で右下は(bd.cols*2,bd.rows*2)。rcは0～0.5のパラメータ。
	// mv.isBorderMode() 境界線入力モードかどうか判定する
	//---------------------------------------------------------------------------
	getcell() {
		return this.getpos(0).getc();
	}
	getcell_excell() {
		const pos = this.getpos(0);
		const excell = pos.getex();
		return (!excell.isnull ? excell : pos.getc());
	}
	getcross() {
		return this.getpos(0.5).getx();
	}

	getpos(spc: number) {
		const addr = this.inputPoint;
		const m1 = 2 * spc;
		const m2 = 2 * (1 - spc);
		// 符号反転の影響なく計算したいので、+4して-4する
		let bx = addr.bx + 4;
		let by = addr.by + 4;
		const dx = bx % 2;
		const dy = by % 2;
		bx = (bx & ~1) + (+(dx >= m1)) + (+(dx >= m2)) - 4;
		by = (by & ~1) + (+(dy >= m1)) + (+(dy >= m2)) - 4;
		return (new Address(this.puzzle, bx, by));
	}

	getborder(spc: number) {
		const addr = this.inputPoint;
		const bx = (addr.bx & ~1) + 1;
		const by = (addr.by & ~1) + 1;
		const dx = addr.bx + 1 - bx;
		const dy = addr.by + 1 - by;

		// 真ん中のあたりはどこにも該当しないようにする
		const bd = this.puzzle.board;
		if (bd.linegraph.isLineCross) {
			if (!bd.borderAsLine) {
				const m1 = 2 * spc;
				const m2 = 2 * (1 - spc);
				if ((dx < m1 || m2 < dx) && (dy < m1 || m2 < dy)) { return bd.emptyborder; }
			}
			else {
				const m1 = 2 * (0.5 - spc);
				const m2 = 2 * (0.5 + spc);
				if (m1 < dx && dx < m2 && m1 < dy && dy < m2) { return bd.emptyborder; }
			}
		}

		if (dx < 2 - dy) {	//左上
			if (dx > dy) { return bd.getb(bx, by - 1); }
			return bd.getb(bx - 1, by);
		}

		if (dx > dy) { return bd.getb(bx + 1, by); }
		return bd.getb(bx, by + 1);
		// unreachable
	}

	isBorderMode() {
		if (this.mousestart) {
			this.bordermode = !this.getpos(0.25).oncell();
		}
		return this.bordermode;
	}

	//---------------------------------------------------------------------------
	// mv.setcursor() TargetCursorの場所を移動する
	// mv.setcursorsnum() TargetCursorの補助記号に対する場所を移動する
	//---------------------------------------------------------------------------
	setcursor(pos: Position) {
		const pos0 = this.cursor.getaddr();
		this.cursor.setaddr(pos);
		pos0.draw();
		pos.draw();
	}
	setcursorsnum(pos: Position) {
		const pos0 = this.cursor.getaddr();
		this.cursor.setaddr(pos);
		let bx = this.inputPoint.bx;
		let by = this.inputPoint.by;
		bx = (((bx + 12) % 2) * 1.5) | 0;
		by = (((by + 12) % 2) * 1.5) | 0;
		let target: number;
		if (this.pid !== 'factors') {
			target = [5, 0, 4, 0, 0, 0, 2, 0, 3][by * 3 + bx];
		}
		else {
			target = [0, 0, 4, 0, 0, 0, 2, 0, 3][by * 3 + bx];
		}
		if (this.cursor.targetdir !== target) {
			this.cursor.targetdir = target;
		}
		pos0.draw();
		pos.draw();
	}

	// 共通関数
	//---------------------------------------------------------------------------
	// mv.inputcell() Cellのqans(回答データ)に0/1/2のいずれかを入力する。
	// mv.decIC()     0/1/2どれを入力すべきかを決定する。
	//---------------------------------------------------------------------------
	inputcell() {
		const cell = this.getcell();
		if (cell.isnull || cell === this.mouseCell) { return; }
		if (this.inputData === null) { this.decIC(cell); }

		this.mouseCell = cell;

		if (cell.numberRemainsUnshaded && cell.qnum !== -1 && (this.inputData === 1 || (this.inputData === 2 && !this.puzzle.painter.enablebcolor))) { return; }
		if (this.RBShadeCell && this.inputData === 1) {
			if (this.firstCell.isnull) { this.firstCell = cell; }
			const cell0 = this.firstCell;
			if (((cell0.bx & 2) ^ (cell0.by & 2)) !== ((cell.bx & 2) ^ (cell.by & 2))) { return; }
		}

		(this.inputData === 1 ? cell.setShade : cell.clrShade).call(cell);
		cell.setQsub(this.inputData === 2 ? 1 : 0);

		cell.draw();
	}
	decIC(cell: Cell) {
		if (this.inputMode === 'shade') {
			this.inputData = ((cell.qans !== 1) ? 1 : 0);
		}
		else if (this.inputMode === 'unshade') {
			this.inputData = ((cell.qsub !== 1) ? 2 : 0);
		}
		else if (this.puzzle.getConfig('use') === 1) {
			if (this.btn === 'left') { this.inputData = (cell.isUnshade() ? 1 : 0); }
			else if (this.btn === 'right') { this.inputData = ((cell.qsub !== 1) ? 2 : 0); }
		}
		else if (this.puzzle.getConfig('use') === 2) {
			if (cell.numberRemainsUnshaded && cell.qnum !== -1) {
				this.inputData = ((cell.qsub !== 1) ? 2 : 0);
			}
			else if (this.btn === 'left') {
				if (cell.isShade()) { this.inputData = 2; }
				else if (cell.qsub === 1) { this.inputData = 0; }
				else { this.inputData = 1; }
			}
			else if (this.btn === 'right') {
				if (cell.isShade()) { this.inputData = 0; }
				else if (cell.qsub === 1) { this.inputData = 1; }
				else { this.inputData = 2; }
			}
		}
	}

	//---------------------------------------------------------------------------
	// mv.inputclean_cell() Cellのqans(回答データ)を消去する
	//---------------------------------------------------------------------------
	inputclean_cell() {
		const cell = this.getcell();
		if (cell.isnull || cell === this.mouseCell) { return; }

		this.mouseCell = cell;

		const clist = new CellList(this.puzzle, [cell]);
		if (this.puzzle.playmode) { clist.ansclear(); }
		else { clist.allclear(); }

		cell.draw();
	}

	//---------------------------------------------------------------------------
	// mv.inputqnum()      Cellのqnum(数字データ)に数字を入力する
	// mv.inputqnum_main() Cellのqnum(数字データ)に数字を入力する(メイン処理)
	//---------------------------------------------------------------------------
	inputqnum() {

		const cell = this.getcell();
		if (cell.isnull || cell === this.mouseCell) { return; }

		if (this.cursor.modesnum && this.puzzle.playmode && !this.cursor.checksnum(this.inputPoint) && cell.noNum()) {
			this.setcursorsnum(cell);
		}
		else if (cell !== this.cursor.getc()) {
			this.setcursor(cell);
		}
		else {
			this.inputqnum_main(cell);
		}
		this.mouseCell = cell;
	}
	inputqnum_main(cell: Cell) { // todo
		let cell0 = cell;
		const puzzle = this.puzzle;
		if (puzzle.playmode && cell.qnum !== Cell.qnumDefault && puzzle.pid !== 'factors') { return; }

		if (puzzle.editmode && puzzle.board.roommgr.hastop) {
			cell0 = cell = cell.room.top;
		}
		else if (puzzle.execConfig('dispmove')) {
			if (cell.isDestination()) { cell = cell.base; }
			else if (cell.lcnt > 0) { return; }
		}

		if (cell.enableSubNumberArray && puzzle.playmode && this.cursor.targetdir >= 2) {
			const snumpos = [-1, -1, 2, 3, 1, 0][this.cursor.targetdir];
			if (snumpos === -1) { return; }
			cell.setSnum(snumpos, this.getNewNumber(cell, cell.snum[snumpos]));
		}
		else if (puzzle.editmode && cell.ques === 51) {
			const target = puzzle.cursor.detectTarget(cell);
			puzzle.key.setnum51(cell, target, this.getNewNumber(cell, puzzle.key.getnum51(cell, target)));
		}
		else {
			cell.setNum(this.getNewNumber(cell, cell.getNum()));
		}

		if (puzzle.execConfig('dispmove') && cell.noNum()) {
			cell.eraseMovedLines();		/* 丸数字がなくなったら付属する線も消去する */
		}
		cell0.draw();
	}
	getNewNumber(cell: Cell, num: number) {
		const puzzle = this.puzzle;
		const ishatena = (puzzle.editmode && !cell.disInputHatena);
		const max = cell.getmaxnum();
		const min = cell.getminnum();
		let val = -1;
		let qs = cell.qsub;

		let subtype = 0; // qsubを0～いくつまで入力可能かの設定
		if (puzzle.editmode) { subtype = -1; }
		else if (this.cursor.targetdir >= 2) { subtype = 0; qs = 0; }
		else if (cell.numberWithMB) { subtype = 2; qs = cell.qsub; }
		else if (puzzle.pid === "roma" || puzzle.pid === "yinyang") { subtype = 0; } // 全マス埋めるタイプのパズルは補助記号なし
		else if (cell.numberAsObject || puzzle.pid === "hebi") { subtype = 1; }

		// playmode: subtypeは0以上、 qsにqsub値が入る
		// editmode: subtypeは-1固定、qsは常に0が入る
		if (this.btn === 'left') {
			if (num >= max) { val = ((subtype >= 1) ? -2 : -1); }
			else if (qs === 1) { val = ((subtype >= 2) ? -3 : -1); }
			else if (qs === 2) { val = -1; }
			else if (num === -1) { val = (ishatena ? -2 : min); }
			else if (num < min) { val = min; }
			else { val = num + 1; }
		}
		else if (this.btn === 'right') {
			if (qs === 1) { val = max; }
			else if (qs === 2) { val = -2; }
			else if (num === -1) {
				if (subtype === 1) { val = -2; }
				else if (subtype === 2) { val = -3; }
				else { val = max; }
			}
			else if (num > max) { val = max; }
			else if (num <= min) { val = (ishatena ? -2 : -1); }
			else if (num === -2) { val = -1; }
			else { val = num - 1; }
		}
		return val;
	}

	//---------------------------------------------------------------------------
	// mv.inputFixedNumber() Cellに固定のqnum/anum値を入力する
	//---------------------------------------------------------------------------
	inputFixedNumber(num: number) {
		const cell = this.getcell();
		if (cell.isnull || cell === this.mouseCell) { return; }

		let val = cell.getNum();
		if (val === -1 && cell.qsub > 0) { val = -1 - cell.qsub; }
		if (this.inputData === null) { this.inputData = (val === num ? -1 : num); }
		if (val !== num || this.inputData === -1) {
			cell.setNum(this.inputData);
			cell.draw();
		}
		this.mouseCell = cell;
	}

	//---------------------------------------------------------------------------
	// mv.inputQues() Cellのquesデータをarrayのとおりに入力する
	//---------------------------------------------------------------------------
	inputQues(array: number[]) {
		const cell = this.getcell();
		if (cell.isnull) { return; }

		if (cell !== this.cursor.getc() && this.inputMode === 'auto') {
			this.setcursor(cell);
		}
		else {
			this.inputQues_main(array, cell);
		}
	}
	inputQues_main(array: number[], cell: Cell) {
		const qu = cell.ques;
		const len = array.length;
		const isInc = ((this.inputMode === 'quesmark' || this.inputMode === 'auto') === (this.btn === 'left'));
		if (isInc) {
			for (let i = 0; i <= len - 1; i++) {
				if (qu === array[i]) {
					cell.setQues(array[((i < len - 1) ? i + 1 : 0)]);
					break;
				}
			}
		}
		else {
			for (let i = len - 1; i >= 0; i--) {
				if (qu === array[i]) {
					cell.setQues(array[((i > 0) ? i - 1 : len - 1)]);
					break;
				}
			}
		}
		cell.draw();
	}

	//---------------------------------------------------------------------------
	// mv.inputMB()        Cellのqsub(補助記号)の○, ×データを入力する
	// mv.inputFixedQsub() Cellのqsub(補助記号)の○, ×データを固定で入力する
	// mv.inputBGcolor()   Cellの背景色を入力する
	//---------------------------------------------------------------------------
	inputMB() {
		const cell = this.getcell();
		if (cell.isnull) { return; }

		cell.setQsub((this.btn === 'left' ? [1, 2, 0] : [2, 0, 1])[cell.qsub]);
		cell.draw();
	}
	inputFixedQsub(val: number) {
		const cell = this.getcell();
		if (cell.isnull || cell.is51cell() || cell === this.mouseCell) { return; }

		if (this.inputData === null) { this.inputData = (cell.qsub !== val ? val : 0); }
		cell.setQsub(this.inputData);
		cell.draw();
		this.mouseCell = cell;
	}
	inputBGcolor(isforceforward = false) {
		const cell = this.getcell();
		if (cell.isnull || cell.is51cell() || cell === this.mouseCell) { return; }
		if (this.inputData !== null) { }
		else if (this.inputMode === 'bgcolor1') {
			this.inputMode = (cell.qsub !== 1 ? "11" : "10");
		}
		else if (this.inputMode === 'bgcolor2') {
			this.inputMode = (cell.qsub !== 2 ? "12" : "10");
		}
		else if (isforceforward || this.btn === 'left') {
			if (cell.qsub === 0) { this.inputData = 11; }
			else if (cell.qsub === 1) { this.inputData = 12; }
			else { this.inputData = 10; }
		}
		else {
			if (cell.qsub === 0) { this.inputData = 12; }
			else if (cell.qsub === 1) { this.inputData = 10; }
			else { this.inputData = 11; }
		}
		cell.setQsub(this.inputData - 10);
		cell.draw();

		this.mouseCell = cell;
	}

	//---------------------------------------------------------------------------
	// mv.inputdirec()      Cellのdirec(方向)のデータを入力する
	// mv.inputarrow_cell() Cellの矢印を入力する
	//---------------------------------------------------------------------------
	inputdirec() {
		const pos = this.getpos(0);
		if (this.prevPos.equals(pos)) { return; }

		const cell = this.prevPos.getc();
		if (!cell.isnull) {
			if (cell.qnum !== -1) {
				const dir = this.prevPos.getdir(pos, 2);
				if (dir !== cell.NDIR) {
					cell.setQdir(cell.qdir !== dir ? dir : 0);
					cell.draw();
				}
			}
		}
		this.prevPos = pos;
	}
	inputarrow_cell() {
		const pos = this.getpos(0);
		if (this.prevPos.equals(pos) && this.inputData === 1) { return; }

		const dir = pos.NDIR;
		const cell = this.prevPos.getc();
		if (!cell.isnull) {
			const dir = this.prevPos.getdir(pos, 2);
			if (dir !== pos.NDIR) {
				this.inputarrow_cell_main(cell, dir);
				cell.draw();
				this.mousereset();
				return;
			}
		}
		this.prevPos = pos;
	}
	inputarrow_cell_main(cell: Cell, dir: number) {
		if (cell.numberAsObject) { cell.setNum(dir); }
	}

	//---------------------------------------------------------------------------
	// mv.inputtile()  黒タイル、白タイルを入力する
	//---------------------------------------------------------------------------
	inputtile() {
		const cell = this.getcell();
		if (cell.isnull || cell.is51cell() || cell === this.mouseCell) { return; }
		if (this.inputData === null) { this.decIC(cell); }

		this.mouseCell = cell;
		const clist = cell.room.clist as CellList;
		for (let i = 0; i < clist.length; i++) {
			const cell2 = clist[i];
			if (this.inputData === 1 || cell2.qsub !== 3) {
				(this.inputData === 1 ? cell2.setShade : cell2.clrShade).call(cell2);
				cell2.setQsub(this.inputData === 2 ? 1 : 0);
			}
		}
		clist.draw();
	}

	//---------------------------------------------------------------------------
	// mv.inputIcebarn()  アイスバーンを入力する
	//---------------------------------------------------------------------------
	inputIcebarn() {
		const cell = this.getcell();
		if (cell.isnull || cell === this.mouseCell) { return; }
		if (this.inputData === null) { this.inputData = (cell.ice() ? 0 : 6); }

		cell.setQues(this.inputData);
		cell.drawaround();
		this.mouseCell = cell;
	}

	//---------------------------------------------------------------------------
	// mv.input51()            inputMode=='auto'時に[＼]を作ったり消したりする
	//---------------------------------------------------------------------------
	input51() {
		const piece = this.getcell_excell(); /* piece : cell or excell */
		if (piece.isnull) { return; }

		const group = piece.group;
		if (group === 'excell' || (group === 'cell' && piece !== this.cursor.getc())) {
			this.setcursor(piece);
		}
		else if (group === 'cell') {
			this.input51_main(piece);
		}
	}
	input51_main(cell: Cell | EXCell) {
		if (this.btn === 'right') { cell.remove51cell(); }
		else if (this.btn === 'left') {
			if (!cell.is51cell()) { cell.set51cell(); }
			else { this.cursor.chtarget(); }
		}

		cell.drawaround();
	}

	//---------------------------------------------------------------------------
	// mv.input51_fixed()      inputMode固定時に[＼]を作ったり消したりする
	//---------------------------------------------------------------------------
	input51_fixed() {
		const cell = this.getcell();
		if (cell.isnull || cell === this.mouseCell) { return; }

		if (this.inputMode === 'clear') {
			cell.remove51cell();
			this.inputData = 0;
		}
		else if (this.inputMode === 'cell51' && !cell.is51cell()) {
			cell.set51cell();
			this.inputData = 51;
		}

		cell.drawaround();

		this.mouseCell = cell;
	}

	//---------------------------------------------------------------------------
	// mv.inputqnum_cell51()   [＼]のCellに数字を入力する
	//---------------------------------------------------------------------------
	inputqnum_cell51() {
		const piece = this.getcell_excell(); /* piece : cell or excell */
		if (piece.isnull || (this.mouseCell === piece && !this.mouseend)) { return; }

		if (this.mousestart && (piece !== this.cursor.getobj() || piece.ques !== 51)) {
			this.setcursor(piece);
			this.mousereset();
		}
		else if ((this.mousestart && this.cursor.getNumOfTarget(piece) < 2) || this.mouseend) {
			this.inputqnum_main(piece as Cell);
			this.mousereset();
		}
		else {
			this.mouseCell = piece;
			this.inputselect_cell51(piece);
		}
	}
	inputselect_cell51(cell: any) { // todo
		if (this.mousestart) {
			this.prevPos = this.getpos(0);
		}
		else if (this.mousemove) {
			const dir = this.prevPos.getdir(this.getpos(0), 2);
			if ((dir === cell.RT || dir === cell.DN) && (dir !== this.cursor.targetdir)) {
				this.cursor.targetdir = dir;
				this.cursor.draw();
			}
			if (dir !== cell.NDIR) { this.mousereset(); }
		}
	}

	//---------------------------------------------------------------------------
	// mv.inputqnum_cross() Crossのques(問題データ)に0～4を入力する。
	// mv.inputcrossMark()  Crossの黒点を入力する。
	//---------------------------------------------------------------------------
	inputqnum_cross() {
		const cross = this.getcross();
		if (cross.isnull || cross === this.mouseCell) { return; }

		if (cross !== this.cursor.getx()) {
			this.setcursor(cross);
		}
		else {
			this.inputqnum_main(cross as unknown as Cell);
		}
		this.mouseCell = cross;
	}
	inputcross_main(cross: Cross) {
		if (this.btn === 'left') {
			cross.setQnum(cross.qnum !== 4 ? cross.qnum + 1 : -2);
		}
		else if (this.btn === 'right') {
			cross.setQnum(cross.qnum !== -2 ? cross.qnum - 1 : 4);
		}
		cross.draw();
	}
	inputcrossMark() {
		const pos = this.getpos(0.24);
		if (!pos.oncross()) { return; }
		const bd = this.puzzle.board;
		const bm = (bd.hascross === 2 ? 0 : 2);
		if (pos.bx < bd.minbx + bm || pos.bx > bd.maxbx - bm || pos.by < bd.minby + bm || pos.by > bd.maxby - bm) { return; }

		const cross = pos.getx();
		if (cross.isnull) { return; }

		this.puzzle.opemgr.disCombine = true;
		cross.setQnum(cross.qnum === 1 ? -1 : 1);
		this.puzzle.opemgr.disCombine = false;

		cross.draw();
	}

	//---------------------------------------------------------------------------
	// mv.inputclean_cross() Crossのqans(回答データ)を消去する
	//---------------------------------------------------------------------------
	inputclean_cross() {
		const cross = this.getcross();
		if (cross.isnull || cross === this.mouseCell) { return; }

		this.mouseCell = cross;

		const xlist = new CrossList(this.puzzle, [cross]);
		if (this.puzzle.playmode) { xlist.ansclear(); }
		else { xlist.allclear(); }

		cross.draw();
	}

	//---------------------------------------------------------------------------
	// mv.inputborder()     盤面境界線のデータを入力する
	// mv.inputQsubLine()   盤面の境界線用補助記号を入力する
	//---------------------------------------------------------------------------
	inputborder() {
		const pos = this.getpos(0.35);
		if (this.prevPos.equals(pos)) { return; }

		const border = this.prevPos.getborderobj(pos);
		if (!border.isnull) {
			if (this.inputData === null) { this.inputData = (border.isBorder() ? 0 : 1); }
			if (this.inputData === 1) { border.setBorder(); }
			else if (this.inputData === 0) { border.removeBorder(); }
			border.draw();
		}
		this.prevPos = pos;
	}
	inputQsubLine() {
		const pos = this.getpos(0);
		if (this.prevPos.equals(pos)) { return; }

		const border = this.prevPos.getnb(pos);
		if (!border.isnull) {
			if (this.inputData === null) { this.inputData = (border.qsub === 0 ? 1 : 0); }
			if (this.inputData === 1) { border.setQsub(1); }
			else if (this.inputData === 0) { border.setQsub(0); }
			border.draw();
		}
		this.prevPos = pos;
	}

	//---------------------------------------------------------------------------
	// mv.inputLine()     盤面の線を入力する
	// mv.inputMoveLine() 移動系パズル向けに盤面の線を入力する
	//---------------------------------------------------------------------------
	inputLine() {
		/* "ものを動かしたように描画する"でなければinputLineと同じ */
		if (this.puzzle.execConfig('dispmove')) {
			this.inputMoveLine();
			return;
		}

		let pos: Address;
		let border: Border;
		if (!this.puzzle.board.borderAsLine) {
			pos = this.getpos(0);
			if (this.prevPos.equals(pos)) { return; }
			border = this.prevPos.getnb(pos);
		}
		else {
			pos = this.getpos(0.35);
			if (this.prevPos.equals(pos)) { return; }
			border = this.prevPos.getborderobj(pos);
		}

		if (!border.isnull) {
			if (this.inputData === null) { this.inputData = (border.isLine() ? 0 : 1); }
			if (this.inputData === 1) { border.setLine(); }
			else if (this.inputData === 0) { border.removeLine(); }
			border.draw();
		}
		this.prevPos = pos;
	}
	inputMoveLine() {
		const cell = this.getcell();
		if (cell.isnull) { return; }

		const cell0 = this.mouseCell;
		const pos = cell.getaddr();
		/* 初回はこの中に入ってきます。 */
		if (this.mousestart && cell.isDestination()) {
			this.mouseCell = cell;
			this.prevPos = pos;
			cell.draw();
		}
		/* 移動中の場合 */
		else if (this.mousemove && !cell0.isnull && !cell.isDestination()) {
			const border = this.prevPos.getnb(pos);
			if (!border.isnull && ((!border.isLine() && cell.lcnt === 0) || (border.isLine() && cell0.lcnt === 1))) {
				this.mouseCell = cell;
				this.prevPos = pos;
				const old = border.isLine();
				if (!old) { border.setLine(); } else { border.removeLine(); }
				if (old === border.isLine()) { this.mousereset(); cell0.draw(); return; }
				border.draw();
			}
		}
	}

	//---------------------------------------------------------------------------
	// mv.inputpeke()   盤面の線が通らないことを示す×を入力する
	//---------------------------------------------------------------------------
	inputpeke() {
		const pos = this.getpos(0.22);
		if (this.prevPos.equals(pos)) { return; }

		const border = pos.getb();
		if (!border.isnull) {
			if (this.inputData === null) { this.inputData = (border.qsub === 0 ? 2 : 3); }
			if (this.inputData === 2 && border.isLine() && this.puzzle.execConfig('dispmove')) { }
			else if (this.inputData === 2) { border.setPeke(); }
			else if (this.inputData === 3) { border.removeLine(); }
			border.draw();
		}
		this.prevPos = pos;
	}
	inputpeke_onend() {
		const border = this.getpos(0.22).getb();
		if (border.group === 'border' && !border.isnull) {
			this.inputpeke();
			return true;
		}
		return false;
	}

	//---------------------------------------------------------------------------
	// mv.inputTateyoko() 縦棒・横棒をドラッグで入力する
	//---------------------------------------------------------------------------
	inputTateyoko() {
		if (this.mouseend && this.notInputted() && !!this.clickTateyoko) {
			this.clickTateyoko();
			return;
		}

		const cell = this.getcell();
		if (cell.isnull) { return; }

		// 黒マス上なら何もしない
		if (this.pid !== "amibo" && cell.ques === 1) { }
		else if (this.pid === "amibo" && cell.isNum()) { }
		// 初回 or 入力し続けていて別のマスに移動した場合
		else if (this.mouseCell !== cell) {
			this.firstPoint.set(this.inputPoint);
		}
		// まだ入力していないセルの場合
		else if (this.firstPoint.bx !== null) {
			let val = null;
			const dx = this.inputPoint.bx - this.firstPoint.bx;
			const dy = this.inputPoint.by - this.firstPoint.by;
			if (dy <= -0.50 || 0.50 <= dy) { val = 1; }
			else if (dx <= -0.50 || 0.50 <= dx) { val = 2; }

			if (val !== null) {
				const plus = (this.pid === "amibo" || this.pid === "tatamibari");

				let shape = 0;
				if (this.puzzle.playmode) { shape = { 0: 0, 11: 3, 12: 1, 13: 2 }[cell.qans]; }
				else { shape = { '-1': 0, 1: 3, 2: 1, 3: 2 }[cell.qnum]; }
				if ((this.inputData === null) ? (shape & val) : this.inputData <= 0) {
					val = (!plus ? 0 : -val);
				}

				// 描画・後処理
				if (!plus) { shape = val; }
				else if (val > 0) { shape |= val; }
				else { shape &= ~(-val); }

				if (this.puzzle.playmode) { cell.setQans([0, 12, 13, 11][shape]); }
				else { cell.setQnum([-1, 2, 3, 1][shape]); }
				cell.draw();

				this.inputData = +(val > 0);
				this.firstPoint.reset();

				if (this.pid === "tatamibari") { this.mousereset(); }
			}
		}

		this.mouseCell = cell;
	}
	clickTateyoko() {

	}
	//---------------------------------------------------------------------------
	// mv.dispInfoBlk()  ひとつながりの黒マスを赤く表示する
	// mv.dispInfoBlk8() ななめつながりの黒マスを赤く表示する
	// mv.dispInfoLine()   ひとつながりの線を赤く表示する
	//---------------------------------------------------------------------------
	dispInfoBlk() {
		const cell = this.getcell();
		this.mousereset();
		if (cell.isnull || !cell.isShade()) { return; }
		if (!this.RBShadeCell) { cell.sblk.clist.setinfo(1); }
		else { this.dispInfoBlk8(cell); }
		this.puzzle.board.hasinfo = true;
		this.puzzle.redraw();
	}
	dispInfoBlk8(cell0: Cell) {
		const stack = [cell0];
		while (stack.length > 0) {
			const cell = stack.pop();
			if (cell.qinfo !== 0) { continue; }

			cell.setinfo(1);
			const bx = cell.bx;
			const by = cell.by;
			const clist = this.puzzle.board.cellinside(bx - 2, by - 2, bx + 2, by + 2);
			for (let i = 0; i < clist.length; i++) {
				const cell2 = clist[i];
				if (cell2.qinfo === 0 && cell2.isShade()) { stack.push(cell2); }
			}
		}
	}

	dispInfoLine() {
		const bd = this.puzzle.board;
		let border = this.getborder(0.15);
		this.mousereset();
		if (border.isnull) { return; }

		if (!border.isLine()) {
			const piece = (!bd.borderAsLine ? this.getcell() : this.getcross()); /* cell or cross */
			if (piece.isnull || (bd.linegraph.isLineCross && (piece.lcnt === 3 || piece.lcnt === 4))) { return; }
			const adb = piece.adjborder;
			if (adb.left.isLine()) { border = adb.left; }
			else if (adb.right.isLine()) { border = adb.right; }
			else if (adb.top.isLine()) { border = adb.top; }
			else if (adb.bottom.isLine()) { border = adb.bottom; }
			else { return; }
		}
		if (border.isnull) { return; }

		bd.border.setinfo(-1);
		border.path.setedgeinfo(1);
		bd.hasinfo = true;
		this.puzzle.redraw();
	}

	inputDot() {

	}
	inputqcmp() {

	}
}