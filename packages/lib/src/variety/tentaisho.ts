//
// パズル固有スクリプト部 天体ショー版 tentaisho.js

import { Address } from "../puzzle/Address";
import type { IRange } from "../puzzle/BoardExec";
import { MouseEvent1 } from "../puzzle/MouseInput";
import { BoardPiece, type Cell, isBorder, isCell, isCross } from "../puzzle/Piece";
import { CellList, PieceList } from "../puzzle/PieceList";
import { Puzzle } from "../puzzle/Puzzle";
import { createVariety } from "./createVariety";

//
export const Tentaisho = createVariety({
	pid: "tentaisho",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['circle-unshade', 'circle-shade', 'bgpaint'], play: ['border', 'subline'] },
		mouseinput: function (): void { // オーバーライド
			if (this.puzzle.editmode && this.inputMode !== 'auto') {
				if (this.mousestart) { this.inputstar(); }
			}
			else {
				MouseEvent1.prototype.mouseinput.call(this);
			}
		},
		mouseinput_other: function (): void {
			if (this.inputMode === 'bgpaint') { this.inputBGcolor1(); }
		},
		mouseinput_auto: function (): void {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === 'left' && this.isBorderMode()) { this.inputborder_tentaisho(); }
					else { this.inputQsubLine(); }
				}
				else if (this.mouseend && this.notInputted()) { this.inputBGcolor3(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart && this.btn === 'left') {
					this.inputstar();
				}
				else if ((this.mousestart || this.mousemove) && this.btn === 'right') {
					this.inputBGcolor1();
				}
			}
		},

		inputBGcolor1: function (): void {
			const cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell) { return; }
			if (this.inputData === null) { this.inputData = (cell.qsub === 0) ? 3 : 0; }
			cell.setQsub(this.inputData);
			this.mouseCell = cell;
			cell.draw();
		},
		inputBGcolor3: function (): void {
			if (!this.puzzle.playeronly && this.puzzle.getConfig('discolor')) { return; }

			const pos = this.getpos(0.34);
			const star = this.puzzle.board.gets(pos.bx, pos.by);
			if (star === null || star.getStar() === 0) { return; }

			const cell = star.validcell();
			if (cell !== null) {
				const clist = cell.room.clist;
				const shouldDraw = this.puzzle.board.encolor(clist)
				if (shouldDraw) {
					clist.forEach(c => c.draw());
				}
			}
		},
		inputborder_tentaisho: function (): void {
			const pos = this.getpos(0.34);
			if (this.prevPos.equals(pos)) { return; }

			const border = this.prevPos.getborderobj(pos);
			if (!border.isnull) {
				if (this.inputData === null) { this.inputData = (border.qans === 0 ? 1 : 0); }
				border.setQans(this.inputData);
				border.draw();
			}
			this.prevPos = pos;
		},
		inputstar: function (): void {
			const pos = this.getpos(0.25);
			if (this.prevPos.equals(pos)) { return; }

			const star = this.puzzle.board.gets(pos.bx, pos.by);;
			if (star !== null) {
				if (this.inputMode === 'circle-unshade') { star.setStar(star.getStar() !== 1 ? 1 : 0); }
				else if (this.inputMode === 'circle-shade') { star.setStar(star.getStar() !== 2 ? 2 : 0); }
				else if (this.btn === 'left') { star.setStar({ 0: 1, 1: 2, 2: 0 }[star.getStar()]); }
				else if (this.btn === 'right') { star.setStar({ 0: 2, 1: 0, 2: 1 }[star.getStar()]); }
				star.draw();
			}
			this.prevPos = pos;
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		moveTarget: function (ca): boolean { return this.moveTBorder(ca); },

		keyinput: function (ca: string): void {
			this.key_inputstar(ca);
		},
		key_inputstar: function (ca: string): void {
			const star = this.puzzle.board.gets(this.cursor.bx, this.cursor.by);;
			if (star !== null) {
				if (ca === '1') { star.setStar(1); }
				else if (ca === '2') { star.setStar(2); }
				else if (ca === ' ' || ca === '-' || ca === '0' || ca === '3') { star.setStar(0); }
				star.draw();
			}
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		qnum: 0,
		minnum: 0,

		disInputHatena: true
	},
	Cross: {
		qnum: 0,
		minnum: 0
	},
	Border: {
		qnum: 0,
		minnum: 0
	},


	Board: {
		hascross: 1,
		hasborder: 1,

		createExtraObject: function (): void {
			this.star = []; /* インスタンス化 */
		},
		initExtraObject: function (col, row): void {
			this.initStar(this.cols, this.rows);
		},

		// 星アクセス用関数
		starmax: 0,
		star: [] as Star[],
		initStar: function (col: number, row: number): void {
			this.starmax = (2 * col - 1) * (2 * row - 1);
			this.star = [];
			for (let id = 0; id < this.starmax; id++) {
				this.star[id] = new Star(this.puzzle);
				const star = this.star[id];
				star.id = id;
				star.isnull = false;

				star.bx = id % (2 * col - 1) + 1;
				star.by = ((id / (2 * col - 1)) | 0) + 1;
				star.piece = star.getaddr().getobj();
			}
		},
		gets: function (bx: number, by: number): Star | null {
			let id = null;
			const qc = this.cols;
			const qr = this.rows;
			if ((bx <= 0 || bx >= (qc << 1) || by <= 0 || by >= (qr << 1))) { }
			else { id = (bx - 1) + (by - 1) * (2 * qc - 1); }

			return (id !== null ? this.star[id] : null);
		},
		starinside: function (x1: number, y1: number, x2: number, y2: number): PieceList<Star> {
			const slist = new PieceList<Star>();
			for (let by = y1; by <= y2; by++) {
				for (let bx = x1; bx <= x2; bx++) {
					const star = this.gets(bx, by);
					if (!!star) { slist.add(star); }
				}
			}
			return slist;
		},

		// 色をつける系関数
		encolorall: function (): void {
			const rooms = this.puzzle.board.roommgr.components;
			for (let id = 0; id < rooms.length; id++) { this.encolor(rooms[id].clist); }
			this.puzzle.redraw();
		},

		encolor: function (clist: CellList): boolean {
			const star = this.getAreaStarInfo(clist).star;
			let flag = false
			const ret = (star !== null ? star.getStar() : 0);
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				if (!this.puzzle.playeronly && cell.qsub === 3 && ret !== 2) {
				}
				else if (cell.qsub !== (ret > 0 ? ret : 0)) {
					cell.setQsub(ret > 0 ? ret : 0);
					flag = true;
				}
			}
			return flag;
		},
		getAreaStarInfo: function (clist: CellList) {
			let ret: { star: Star | null, err: number } = { star: null, err: -1 };
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				const slist = this.starinside(cell.bx, cell.by, cell.bx + 1, cell.by + 1);
				for (let n = 0; n < slist.length; n++) {
					const star = slist[n];
					if (star.getStar() > 0 && star.validcell() !== null) {
						if (ret.err === 0) { return { star: null, err: -2 }; }
						ret = { star: star, err: 0 };
					}
				}
			}
			return ret;
		},
	},
	BoardExec: {
		adjustBoardData2: function (key: number, d: IRange): void {
			const bd = this.board;
			bd.initStar(bd.cols, bd.rows);
		}
	},

	AreaRoomGraph: {
		enabled: true,

		setExtraData: function (component) {
			component.clist = new CellList(component.getnodeobjs()) as any;
			const ret = this.puzzle.board.getAreaStarInfo(component.clist);
			component.star = ret.star;
			component.error = ret.err;
		}
	},
	GraphComponent: {
		cmp: false,
		error: 0,
		star: null as (Star | null),
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "LIGHT",

		bgcellcolor_func: "qsub3",
		qsubcolor1: "rgb(176,255,176)",
		qsubcolor2: "rgb(108,108,108)",

		qanscolor: "rgb(72, 72, 72)",

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();

			this.drawQansBorders();
			this.drawBorderQsubs();

			this.drawStars();

			this.drawChassis();

			this.drawTarget_tentaisho();
		},

		drawStars: function (): void {
			const g = this.vinc('star', 'auto', true);

			g.lineWidth = Math.max(this.cw * 0.04, 1);
			const d = this.range;
			const slist = this.puzzle.board.starinside(d.x1, d.y1, d.x2, d.y2);
			for (let i = 0; i < slist.length; i++) {
				const star = slist[i];
				const bx = star.bx;
				const by = star.by;

				g.vid = `s_star1_${star.id}`;
				if (star.getStar() === 1) {
					g.strokeStyle = (star.iserror() ? this.errcolor1 : this.quescolor);
					g.fillStyle = this.bgcolor;
					g.shapeCircle(bx * this.bw, by * this.bh, this.cw * 0.16);
				}
				else { g.vhide(); }

				g.vid = `s_star2_${star.id}`;
				if (star.getStar() === 2) {
					g.fillStyle = (star.iserror() ? this.errcolor1 : this.quescolor);
					g.fillCircle(bx * this.bw, by * this.bh, this.cw * 0.18);
				}
				else { g.vhide(); }
			}
		},

		drawTarget_tentaisho: function (): void {
			this.drawCursor(false, this.puzzle.editmode);
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type): void {
			this.decodeStar();
		},
		encodePzpr: function (type): void {
			this.encodeStar();
		},

		decodeStar: function (): void {
			const bd = this.puzzle.board;
			bd.disableInfo();
			let s = 0;
			const bstr = this.outbstr;
			let i: number
			for (i = 0; i < bstr.length; i++) {
				const star = bd.star[s];
				const ca = bstr.charAt(i);
				if (this.include(ca, "0", "f")) {
					const val = Number.parseInt(ca, 16);
					star.setStar(val % 2 + 1);
					s += ((val >> 1) + 1);
				}
				else if (this.include(ca, "g", "z")) { s += (Number.parseInt(ca, 36) - 15); }

				if (s >= bd.starmax) { break; }
			}
			bd.enableInfo();
			this.outbstr = bstr.substr(i + 1);
		},
		encodeStar: function (): void {
			let count = 0;
			let cm = "";
			const bd = this.puzzle.board;
			for (let s = 0; s < bd.starmax; s++) {
				let pstr = "";
				const star = bd.star[s];
				if (star.getStar() > 0) {
					for (let i = 1; i <= 7; i++) {
						const star2 = bd.star[s + i];
						if (!!star2 && star2.getStar() > 0) {
							pstr = `${(2 * (i - 1) + (star.getStar() - 1)).toString(16)}`;
							s += (i - 1); break;
						}
					}
					if (pstr === "") { pstr = (13 + star.getStar()).toString(16); s += 7; }
				}
				else { count++; }

				if (count === 0) { cm += pstr; }
				else if (pstr || count === 20) { cm += ((count + 15).toString(36) + pstr); count = 0; }
			}
			if (count > 0) { cm += ((count + 15).toString(36)); }

			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function (): void {
			this.decodeStarFile();
			this.decodeBorderAns();
			this.decodeCellQsub();
		},
		encodeData: function (): void {
			this.encodeStarFile();
			this.encodeBorderAns();
			this.encodeCellQsub();
		},



		decodeStarFile: function (): void {
			const bd = this.puzzle.board;
			const s = 0;
			let data = '';
			for (let i = 0, rows = 2 * bd.rows - 1; i < rows; i++) {
				const line = this.readLine();
				if (line) {
					data += line.match(/[12\.]+/)![0];
				}
			}
			bd.disableInfo();
			for (let s = 0; s < data.length; ++s) {
				const star = bd.star[s];
				const ca = data.charAt(s);
				if (ca === "1") { star.setStar(1); }
				else if (ca === "2") { star.setStar(2); }
			}
			bd.enableInfo();
		},
		encodeStarFile: function (): void {
			const bd = this.puzzle.board;
			let s = 0;
			for (let by = 1; by <= 2 * bd.rows - 1; by++) {
				let data = '';
				for (let bx = 1; bx <= 2 * bd.cols - 1; bx++) {
					const star = bd.star[s];
					if (star.getStar() === 1) { data += "1"; }
					else if (star.getStar() === 2) { data += "2"; }
					else { data += "."; }
					s++;
				}
				this.writeLine(data);
			}
		},
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkStarOnLine",
			"checkAvoidStar",
			"checkFractal",
			"checkStarRegion"
		],

		checkStarOnLine: function (): void {
			const bd = this.board;
			for (let s = 0; s < bd.starmax; s++) {
				const star = bd.star[s];
				if (star.getStar() <= 0 || star.validcell() !== null) { continue; }

				this.failcode.add("bdPassStar");
				if (this.checkOnly) { break; }

				const piece = star.piece
				if (isCross(piece)) {
					piece.setCrossBorderError()
				} else if (isBorder(piece)) {
					star.piece.seterr(1)
				}
			}
		},

		checkFractal: function (): void {
			const rooms = this.board.roommgr.components;
			allloop:
			for (let r = 0; r < rooms.length; r++) {
				const clist = rooms[r].clist;
				const star = rooms[r].star;
				if (!star) { continue; }
				for (let i = 0; i < clist.length; i++) {
					const cell = clist[i];
					const cell2 = this.board.getc(star.bx * 2 - cell.bx, star.by * 2 - cell.by);
					if (!cell2.isnull && cell.room === cell2.room) { continue; }

					this.failcode.add("bkNotSymSt");
					if (this.checkOnly) { break allloop; }
					clist.seterr(1);
				}
			}
		},

		checkAvoidStar: function (): void { this.checkErrorFlag(-1, "bkNoStar"); },
		checkStarRegion: function (): void { this.checkErrorFlag(-2, "bkPlStar"); },
		checkErrorFlag: function (val: number, code: string): void {
			const rooms = this.board.roommgr.components;
			for (let r = 0; r < rooms.length; r++) {
				if (rooms[r].error !== val) { continue; }

				this.failcode.add(code);
				if (this.checkOnly) { break; }
				rooms[r].clist.seterr(1);
			}
		}
	},

	FailCode: {
		bkNoStar: ["星が含まれていない領域があります。", "A block has no stars."],
		bdPassStar: ["星を線が通過しています。", "A line goes over the star."],
		bkNotSymSt: ["領域が星を中心に点対称になっていません。", "An area is not point symmetric about the star."],
		bkPlStar: ["星が複数含まれる領域があります。", "A block has two or more stars."]
	}
});
class Star extends BoardPiece {
	piece: BoardPiece = null!

	override shouldSkipPropClear(prop: any): boolean {
		return this.board.subclearmode && prop === 'qsub' && this.qsub === 3;
	}

	getStar() {
		return this.piece.qnum as 0 | 1 | 2;
	}

	setStar(val: number) {
		this.puzzle.opemgr.disCombine = true;
		this.piece.setQnum(val);
		this.puzzle.opemgr.disCombine = false;
	}

	iserror() {
		return (this.piece.error > 0);
	}

	// 星に線が通っていないなら、近くのセルを返す
	validcell() {
		const piece = this.piece
		let cell: Cell = null!;
		if (isCell(piece)) { cell = piece; }
		else if (isCross(piece) && piece.lcnt === 0) { cell = piece.relcell(-1, -1); }
		else if (isBorder(piece) && piece.qans === 0) { cell = piece.sidecell[0]; }
		return cell;
	}

	override draw() {
		this.puzzle.painter.paintRange(this.bx - 1, this.by - 1, this.bx + 1, this.by + 1);
	}
	override getaddr() {
		return (new Address(this.puzzle, this.bx, this.by));
	}
}