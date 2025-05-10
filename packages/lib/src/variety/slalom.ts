//
// パズル固有スクリプト部 スラローム版 slalom.js

import { Address } from "../puzzle/Address";
import { AreaGraphBase } from "../puzzle/AreaManager";
import { Board } from "../puzzle/Board";
import { REDUCE, TURN } from "../puzzle/BoardExec";
import { DIRS } from "../puzzle/Constants";
import type { GraphComponent } from "../puzzle/GraphBase";
import { PaintRange } from "../puzzle/Graphic";
import { Operation } from "../puzzle/Operation";
import type { Cell } from "../puzzle/Piece";
import { CellList } from "../puzzle/PieceList";
import type { Puzzle } from "../puzzle/Puzzle";
import { URL_PZPRV3 } from "../pzpr/constants";
import { createVariety } from "./createVariety";

//
export const Slalom = createVariety({
	pid: "slalom",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['number', 'direc', 'clear', 'info-line'], play: ['line', 'peke', 'info-line'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.btn === 'left') {
					if (this.mousestart || this.mousemove) { this.inputLine(); }
					else if (this.mouseend && this.notInputted()) { this.inputpeke(); }
				}
				else if (this.btn === 'right') {
					if (this.mousestart || this.mousemove) { this.inputpeke(); }
				}
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) { this.inputEdit(); }
				else if (this.mouseend) { this.inputEdit_end(); }
			}
		},

		inputEdit: function () {
			const cell = this.getcell();
			if (cell.isnull) { return; }

			// 初回はこの中に入ってきます。
			if (this.mouseCell.isnull) {
				this.inputEdit_first(cell);
			}

			// startposの入力中の場合
			if (this.inputData === 10) {
				this.board.startpos.input(cell);
			}
			// 矢印の入力中の場合
			else if (this.inputData === 2) {
				this.inputdirec();
			}
			// ゲート入力チェック
			else {
				this.inputGate(cell);
			}

			this.mouseCell = cell;
		},
		inputEdit_first: function (cell: Cell): void {
			// startposの上ならstartpos移動ルーチンへ移行
			if (cell === this.board.startpos.getc()) {
				this.inputData = 10;
			}
			// 数字つき黒マスの上なら矢印入力ルーチンへ移行
			else if (cell.ques === 1 && cell.isNum()) {
				this.inputData = 2;
			}
			// その他はゲート入力チェックへ
			else {
				this.firstPoint.set(this.inputPoint);
			}
		},
		inputGate: function (cell: Cell): void {
			let pos = cell.getaddr(), input = false;

			// 黒マス上なら何もしない
			if (cell.ques === 1) { }
			// まだ入力されていない(1つめの入力の)場合
			else if (this.inputData === null) {
				if (cell === this.mouseCell) {
					const mx = Math.abs(this.inputPoint.bx - this.firstPoint.bx);
					const my = Math.abs(this.inputPoint.by - this.firstPoint.by);
					if (my >= 0.25) { this.inputData = 21; input = true; }
					else if (mx >= 0.25) { this.inputData = 22; input = true; }
				}
				else {
					const isvert = this.prevPos.getvert(pos, 2);
					if (isvert !== void 0) {
						this.inputData = (isvert ? 21 : 22);
						input = true;
					}
				}

				if (input) {
					if (cell.ques === this.inputData) { this.inputData = 0; }
					this.firstPoint.reset();
				}
			}
			// 入力し続けていて、別のマスに移動した場合
			else if (cell !== this.mouseCell) {
				if (this.inputData === 0) { this.inputData = 0; input = true; }
				else {
					const isvert = this.prevPos.getvert(pos, 2);
					if (isvert !== void 0) {
						this.inputData = (isvert ? 21 : 22);
						input = true;
					}
				}
			}

			this.prevPos = pos as any;

			// 描画・後処理
			if (input) {
				const bd = this.board;
				cell.setQues(this.inputData);
				bd.gatemgr.rebuild();

				cell.draw();
				bd.startpos.draw();
			}
		},

		inputEdit_end: function (): void {
			const cell = this.getcell();
			if (cell.isnull) { return; }

			if (this.inputData === 10) {
				this.inputData = null;
				cell.draw();
			}
			else if (this.notInputted()) {
				if (cell !== this.cursor.getc()) {
					this.setcursor(cell);
				}
				else {
					this.inputGateNumber(cell);
				}
			}
		},
		inputGateNumber: function (cell: Cell): void {
			const bd = this.board;
			if (this.btn === 'left') { cell.setQues({ 0: 1, 1: 21, 21: 22, 22: 0 }[cell.ques]); }
			else if (this.btn === 'right') { cell.setQues({ 0: 22, 22: 21, 21: 1, 1: 0 }[cell.ques]); }
			cell.setNum(-1);
			bd.gatemgr.rebuild();

			cell.draw();
			bd.startpos.draw();
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		moveTarget: function (ca): boolean {
			if (ca.match(/shift/)) { return false; }
			return this.moveTCell(ca);
		},
		keyDispInfo: function (ca): boolean {
			if (ca === 'x') {
				/* 押した時:true, 離したとき:false */
				//@ts-ignore
				this.puzzle.painter.drawNumbersOnGate(!!this.keydown);
				return false;
			}
			return true;
		},

		keyinput: function (ca): void {
			if (this.key_inputdirec(ca)) { return; }
			this.key_inputqnum_slalom(ca);
		},
		key_inputqnum_slalom: function (ca: string): void {
			const cell = this.cursor.getc(), bd = this.board;

			if (ca === 'q' || ca === 'w' || ca === 'e' || ca === 'r' || ca === 's' || ca === ' ') {
				let old = cell.ques, newques = -1;
				if (ca === 'q') { newques = (old !== 1 ? 1 : 0); }
				else if (ca === 'w') { newques = 21; }
				else if (ca === 'e') { newques = 22; }
				else if (ca === 'r' || ca === ' ') { newques = 0; }
				else if (ca === 's') { bd.startpos.input(cell); }
				else { return; }
				if (old === newques) { return; }

				if (newques !== -1) {
					cell.setQues(newques);
					if (newques === 0) { cell.setNum(-1); }
					if (old === 21 || old === 22 || newques === 21 || newques === 22) { bd.gatemgr.rebuild(); }

					cell.draw();
					bd.startpos.draw();
				}
			}
			else if (cell.ques === 1) {
				this.key_inputqnum(ca);
			}
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		disInputHatena: true,
		maxnum: function (): number {
			//@ts-ignore
			return Math.min(999, this.board.gatemgr.components.length);
		},
		posthook: {
			qnum: function (num) { this.board.gatemgr.generateGateNumberAll(); },
			qdir: function (num) { this.board.gatemgr.generateGateNumberAll(); }
		},

		gate: null! as GateGraphComponent,
		// 黒マスの周りに繋がっている旗門IDをリストにして返す
		getConnectingGate: function (): GateGraphComponent[] {
			let adc = this.adjacent, cell2 = this, gatelist = [];
			cell2 = adc.top; if (!cell2.isnull && cell2.ques === 21) { gatelist.push(cell2.gate); }
			cell2 = adc.bottom; if (!cell2.isnull && cell2.ques === 21) { gatelist.push(cell2.gate); }
			cell2 = adc.left; if (!cell2.isnull && cell2.ques === 22) { gatelist.push(cell2.gate); }
			cell2 = adc.right; if (!cell2.isnull && cell2.ques === 22) { gatelist.push(cell2.gate); }
			return gatelist;
		}
	},
	Border: {
		enableLineNG: true
	},
	Board: {
		hasborder: 1,

		startpos: null! as StartPosAddress,
		gatemgr: null! as AreaHurdleGraph,

		addExtraInfo: function (): void {
			this.gatemgr = this.addInfoList(AreaHurdleGraph);
		},

		createExtraObject: function (): void {
			this.startpos = new StartPosAddress(this.puzzle, 1, 1);
		},
		initExtraObject: function (col, row): void {
			this.startpos.set(this.cell[0]);
		},

		operate: function (type): void {
			switch (type) {
				case 'showgatenumber':
					//@ts-ignore
					this.puzzle.painter.drawNumbersOnGate(true);
					break;
				case 'hidegatenumber':
					//@ts-ignore
					this.puzzle.painter.drawNumbersOnGate(false);
					break;
				default:
					Board.prototype.operate.call(this, type);
					break;
			}
		}
	},
	BoardExec: {
		posinfo: {} as { pos?: Address, isdel?: boolean },
		adjustBoardData: function (key, d): void {
			const bd = this.board;
			if (key & TURN) {
				const tques = { 21: 22, 22: 21 };
				const clist = bd.cellinside(d.x1, d.y1, d.x2, d.y2);
				for (let i = 0; i < clist.length; i++) {
					const cell = clist[i], val = tques[cell.ques as 21 | 22];
					if (!!val) { cell.setQues(val); }
				}
			}

			this.posinfo = this.getAfterPos(key, d, bd.startpos.getc());

			this.adjustNumberArrow(key, d);
		},
		adjustBoardData2: function (key, d): void {
			const bd = this.board, opemgr = this.puzzle.opemgr;
			const info = this.posinfo

			const isrec = ((key & REDUCE) && (info.isdel) && (!opemgr.undoExec && !opemgr.redoExec));
			if (isrec) { opemgr.forceRecord = true; }
			bd.startpos.set(info.pos!.getc());
			if (isrec) { opemgr.forceRecord = false; }

			bd.gatemgr.rebuild();	// 念のため
		}
	},



	OperationManager: {
		addExtraOperation: function (): void {
			this.operationlist.push(StartposOperation);
		}
	},

	LineGraph: {
		enabled: true
	},


	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		irowake: true,

		gridcolor_type: "LIGHT",

		fontShadecolor: "white",
		numbercolor_func: "fixed_shaded",

		linecolor: "rgb(32, 32, 255)",			// 色分けなしの場合
		noerrcolor: "rgb(160, 150, 255)",

		paint: function () {
			this.drawBGCells();
			this.drawGrid();

			this.drawGates();

			this.drawQuesCells();
			this.drawArrowNumbers();

			this.drawPekes();
			this.drawLines();

			this.drawStartpos();

			this.drawChassis();

			this.drawTarget();
		},

		drawGates: function (): void {
			const g = this.vinc('cell_gate', 'auto', true);

			const lw = Math.max(this.cw / 10, 3);	//LineWidth
			const lm = lw / 2;						//LineMargin
			const ll = lw * 1.1;					//LineLength

			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				g.fillStyle = (cell.error === 4 ? this.errcolor1 : this.quescolor);

				g.vid = "c_dl21_" + cell.id;
				if (cell.ques === 21) { //たて
					let px = (cell.bx * this.bw) - lm + 1, py: number, ry = (cell.by - 1) * this.bh, max = ry + this.ch;
					g.beginPath();
					for (py = ry; py < max; py += ll * 2) { g.rect(px, py, lw, ll); }
					g.fill();
				}
				else { g.vhide(); }

				g.vid = "c_dl22_" + cell.id;
				if (cell.ques === 22) { //よこ
					let px: number, py = (cell.by * this.bh) - lm + 1, rx = (cell.bx - 1) * this.bw, max = rx + this.cw;
					g.beginPath();
					for (px = rx; px < max; px += ll * 2) { g.rect(px, py, ll, lw); }
					g.fill();
				}
				else { g.vhide(); }
			}
		},

		drawStartpos: function (): void {
			const g = this.vinc('cell_circle', 'auto');

			const bd = this.board, cell = bd.startpos.getc(), d = this.range;
			if (cell.bx < d.x1 || d.x2 < cell.bx || cell.by < d.y1 || d.y2 < cell.by) { return; }

			const px = cell.bx * this.bw, py = cell.by * this.bh;
			const csize = this.cw * 0.42;

			g.vid = "c_stpos";
			g.lineWidth = Math.max(this.cw * 0.05, 1);
			g.strokeStyle = this.quescolor;
			g.fillStyle = (this.puzzle.mouse.inputData === 10 ? this.errbcolor1 : "white");
			g.shapeCircle(px, py, csize);

			g.vid = "text_stpos";
			g.fillStyle = this.quescolor;
			this.disptext("" + bd.gatemgr.components.length, px, py, { ratio: 0.75 });
		},

		repaintParts: function (blist): void {
			const clist = blist.cellinside();
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				if (!this.board.startpos.equals(cell)) { continue; }

				this.range = { x1: cell.bx, y1: cell.by, x2: cell.bx, y2: cell.by } as any;
				this.drawStartpos();

				// startは一箇所だけなので、描画したら終了してよい
				break;
			}
		},

		// Xキー押した時に数字を表示するメソッド
		drawNumbersOnGate: function (keydown: boolean): void {
			const g = this.context, bd = this.board;
			if (keydown) { bd.gatemgr.generateGateNumberAll(); }

			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (cell.ques !== 21 && cell.ques !== 22) { continue; }

				const num = cell.gate.number;
				g.vid = "cell_text_" + c;
				if (keydown && num > 0) {
					g.fillStyle = "tomato";
					this.disptext("" + num, cell.bx * this.bw, cell.by * this.bh);
				}
				else { g.vhide(); }
			}
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type): void {
			const urlver = (this.checkpflag("d") ? 2 : (this.checkpflag("p") ? 1 : 0));
			this.decodeSlalom(urlver);
		},
		encodePzpr: function (type): void {
			if (type === URL_PZPRV3) { this.outpflag = 'd'; }

			this.encodeSlalom((type === URL_PZPRV3 ? 2 : 0));
		},

		decodeSlalom: function (ver: number) {
			const bstr = this.outbstr;
			const array = bstr.split("/");

			let c = 0, i = 0, bd = this.board;
			for (i = 0; i < array[0].length; i++) {
				const ca = array[0].charAt(i), cell = bd.cell[c];

				if (ca === '1') { cell.ques = 1; }
				else if (ca === '2') { cell.ques = 21; }
				else if (ca === '3') { cell.ques = 22; }
				else if (this.include(ca, "4", "9") || this.include(ca, "a", "z")) { c += (Number.parseInt(ca, 36) - 4); }

				c++;
				if (!bd.cell[c]) { break; }
			}
			bd.gatemgr.rebuild();

			if (ver === 0) {
				let r = 0;
				for (i = i + 1; i < array[0].length; i++) {
					const ca = array[0].charAt(i);

					if (this.include(ca, "0", "9") || this.include(ca, "a", "f")) {
						bd.gatemgr.components[r].number = Number.parseInt(ca, 16);
					}
					else if (ca === '-') {
						bd.gatemgr.components[r].number = Number.parseInt(bstr.substr(i + 1, 2), 16); i += 2;
					}
					else if (this.include(ca, "g", "z")) { r += (Number.parseInt(ca, 36) - 16); }

					r++;
					if (r > bd.gatemgr.components.length) { break; }
				}

				for (let c = 0; c < bd.cell.length; c++) {
					let gatelist = bd.cell[c].getConnectingGate(), min = 1000;
					for (let i = 0; i < gatelist.length; i++) {
						const val = gatelist[i].number;
						if (val > 0) { min = Math.min(min, val); }
					}
					bd.cell[c].qnum = (min < 1000 ? min : -1);
				}
			}
			else if (ver === 1 || ver === 2) {
				let c = 0, spare = 0;
				for (i = i + 1; i < array[0].length; i++) {
					const cell = bd.cell[c];
					if (cell.ques !== 1) { i--; }
					else if (spare > 0) { i--; spare--; }
					else {
						const ca = array[0].charAt(i);

						if ((ver === 1) && (this.include(ca, "0", "9") || this.include(ca, "a", "f"))) {
							cell.qnum = Number.parseInt(ca, 16);
						}
						else if ((ver === 1) && ca === '-') {
							cell.qnum = Number.parseInt(bstr.substr(i + 1, 2), 16);
							i += 2;
						}
						else if ((ver === 2) && this.include(ca, "0", "4")) {
							cell.qdir = Number.parseInt(ca, 16);
							cell.qnum = Number.parseInt(bstr.charAt(i + 1), 16);
							i++;
						}
						else if ((ver === 2) && this.include(ca, "5", "9")) {
							cell.qdir = Number.parseInt(ca, 16) - 5;
							cell.qnum = Number.parseInt(bstr.substr(i + 1, 2), 16);
							i += 2;
						}
						else if ((ver === 2) && ca === '-') {
							cell.qdir = Number.parseInt(bstr.substr(i + 1, 1), 16);
							cell.qnum = Number.parseInt(bstr.substr(i + 2, 3), 16);
							i += 4;
						}
						else if (ca >= 'g' && ca <= 'z') { spare = (Number.parseInt(ca, 36) - 15) - 1; }
					}
					c++;
					if (!bd.cell[c]) { break; }
				}
			}

			bd.startpos.set(bd.cell[+array[1] || 0]);

			this.outbstr = array[0].substr(i);
		},
		encodeSlalom: function (ver: number) {
			let cm = "", count = 0, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				let pstr = "", cell = bd.cell[c];
				if (cell.ques === 1) { pstr = "1"; }
				else if (cell.ques === 21) { pstr = "2"; }
				else if (cell.ques === 22) { pstr = "3"; }
				else { count++; }

				if (count === 0) { cm += pstr; }
				else if (pstr || count === 32) { cm += ((3 + count).toString(36) + pstr); count = 0; }
			}
			if (count > 0) { cm += (3 + count).toString(36); }

			count = 0;
			if (ver === 0) {
				for (let r = 0; r < bd.gatemgr.components.length; r++) {
					let pstr = "";
					const val = bd.gatemgr.components[r].number;

					if (val >= 0 && val < 16) { pstr = val.toString(16); }
					else if (val >= 16 && val < 256) { pstr = "-" + val.toString(16); }
					else { count++; }

					if (count === 0) { cm += pstr; }
					else if (pstr || count === 20) { cm += ((15 + count).toString(36) + pstr); count = 0; }
				}
				if (count > 0) { cm += (15 + count).toString(36); }
			}
			else if (ver === 1 || ver === 2) {
				for (let c = 0; c < bd.cell.length; c++) {
					const cell = bd.cell[c];
					if (cell.ques !== 1) { continue; }

					let pstr = "", val = cell.qnum, dir = cell.qdir;
					if (val >= 1 && val < 16) { pstr = (ver === 1 ? "" : "" + dir) + val.toString(16); }
					else if (val >= 16 && val < 256) { pstr = (ver === 1 ? "-" : "" + (dir + 5)) + val.toString(16); }
					else if (val >= 256 && val < 4096) { pstr = ("-" + dir) + val.toString(16); }
					else { count++; }

					if (count === 0) { cm += pstr; }
					else if (pstr || count === 20) { cm += ((15 + count).toString(36) + pstr); count = 0; }
				}
				if (count > 0) { cm += (15 + count).toString(36); }
			}

			cm += ("/" + bd.startpos.getc().id);

			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			if (this.filever === 2) { this.decodeBoard_pzpr2(); }
			else if (this.filever === 1) { this.decodeBoard_pzpr1(); }
			else if (this.filever === 0) { this.decodeBoard_old(); }
			this.decodeBorderLine();
		},
		encodeData: function () {
			this.filever = 2;
			this.encodeBoard_pzpr2();
			this.encodeBorderLine();
		},


		decodeBoard_pzpr1: function () {
			const bd = this.board;
			this.decodeCell(function (cell, ca) {
				if (ca === "o") { bd.startpos.set(cell); }
				else if (ca === "i") { cell.ques = 21; }
				else if (ca === "-") { cell.ques = 22; }
				else if (ca === "#") { cell.ques = 1; }
				else if (ca !== ".") { cell.ques = 1; cell.qnum = +ca; }
			});
			bd.gatemgr.rebuild();
		},
		decodeBoard_pzpr2: function () {
			const bd = this.board;
			this.decodeCell(function (cell, ca) {
				if (ca === "o") { bd.startpos.set(cell); }
				else if (ca === "i") { cell.ques = 21; }
				else if (ca === "-") { cell.ques = 22; }
				else if (ca === "#") { cell.ques = 1; }
				else if (ca !== ".") {
					const inp = ca.split(",");
					cell.ques = 1;
					cell.qdir = (inp[0] !== "0" ? +inp[0] : 0);
					cell.qnum = (inp[1] !== "-" ? +inp[1] : -2);
				}
			});
			bd.gatemgr.rebuild();
		},
		encodeBoard_pzpr2: function () {
			const bd = this.board;
			this.encodeCell(function (cell) {
				if (bd.startpos.equals(cell)) { return "o "; }
				else if (cell.ques === 21) { return "i "; }
				else if (cell.ques === 22) { return "- "; }
				else if (cell.ques === 1 && cell.qnum <= 0) { return "# "; }
				else if (cell.ques === 1) {
					const ca1 = (cell.qdir !== 0 ? "" + cell.qdir : "0");
					const ca2 = (cell.qnum !== -2 ? "" + cell.qnum : "-");
					return [ca1, ",", ca2, " "].join('');
				}
				else { return ". "; }
			});
		},

		decodeBoard_old: function () {
			const sv_num: number[] = [], bd = this.board;
			this.decodeCell(function (cell, ca) {
				const c = cell.id;
				sv_num[c] = -1;
				if (ca === "#") { cell.ques = 1; }
				else if (ca === "o") { bd.startpos.set(cell); }
				else if (ca !== ".") {
					if (ca.charAt(0) === "i") { cell.ques = 21; }
					else if (ca.charAt(0) === "w") { cell.ques = 22; }
					if (ca.length > 1) { sv_num[c] = +ca.substr(1); }
				}
			});
			bd.gatemgr.rebuild();

			for (let c = 0; c < bd.cell.length; c++) {
				if (sv_num[c] !== -1) { bd.cell[c].gate.number = sv_num[c]; }
			}
			for (let c = 0; c < bd.cell.length; c++) {
				let gatelist = bd.cell[c].getConnectingGate(), min = 1000;
				for (let i = 0; i < gatelist.length; i++) {
					const val = gatelist[i].number;
					if (val > 0) { min = Math.min(min, val); }
				}
				bd.cell[c].qnum = (min < 1000 ? min : -1);
			}
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkLineOnShadeCell",
			"checkCrossLine",
			"checkBranchLine",
			"checkPassGateOnce",
			"checkStartid",
			"checkGateNumber",
			"checkDeadendLine+",
			"checkOneLoop",
			"checkPassAllGate"
		],

		checkStartid: function () {
			const start = this.board.startpos.getc();
			if (start.lcnt !== 2) {
				start.seterr(1);
				this.failcode.add("stLineNe2");
			}
		},
		checkPassGateOnce: function () { return this.checkGateLine(1, "gateRedup"); },
		checkPassAllGate: function () { return this.checkGateLine(2, "gateUnpass"); },
		checkGateLine: function (type: number, code: string) {
			const bd = this.board, gates = bd.gatemgr.components;
			for (let r = 0; r < gates.length; r++) {
				let cnt = 0, clist = gates[r].clist;
				for (let i = 0; i < clist.length; i++) {
					if (clist[i].lcnt > 0) { cnt++; }
				}
				if ((type === 1 && cnt <= 1) || (type === 2 && cnt > 0)) { continue; }

				this.failcode.add(code);
				if (this.checkOnly) { break; }
				clist.seterr(4);
				bd.gatemgr.setGateError(gates[r], 1);
			}
		},
		checkGateNumber: function () {
			const errgate = this.getTraceInfo();
			if (errgate !== null) {
				this.failcode.add("lrOrder");
				errgate.clist.seterr(4);
				this.board.gatemgr.setGateError(errgate, 1);
			}
		},

		getTraceInfo: function () {
			return this.searchTraceInfo(this.board.startpos.getc());
		},
		searchTraceInfo: function (cell1: Cell) {
			if (cell1.lcnt === 0) { return null; }
			let errgate = null;
			//@ts-ignore
			let dir = cell1.getdir(cell1.pathnodes[0].nodes[0].obj, 2);
			let pos = cell1.getaddr(), passed = 0, ordertype = -1, gatecount = this.board.gatemgr.components.length;

			while (1) {
				pos.movedir(dir, 1);
				if (pos.oncell()) {
					const cell = pos.getc() as Cell & { gate: GateGraphComponent };
					if (cell1 === cell) { break; } // ちゃんと戻ってきた

					if (cell.ques === 21 || cell.ques === 22) {
						const gate = cell.gate;
						passed++;
						const gatenumber = gate.number;
						if (gatenumber <= 0) { } // 何もしない
						else if (ordertype === -1) {
							const revgatenumber = gatecount + 1 - gatenumber;
							if (gatenumber === revgatenumber) { } // ど真ん中の数字なら何もしない
							else if (passed === gatenumber) { ordertype = 1; }   // 順方向と確定
							else if (passed === revgatenumber) {                 // 逆方向なので別の方向から回る
								if (cell1.lcnt < 2) { break; } // 1つしか線がない場合は終了
								//@ts-ignore
								dir = cell1.getdir(cell1.pathnodes[0].nodes[1].obj, 2);
								pos = cell1.getaddr();
								passed = 0;
								ordertype = 1;
								continue;
							}
							else { errgate = gate; break; } // 通過順間違い
						}
						else if (ordertype === 1 && passed !== gatenumber) { errgate = gate; break; } // 通過順間違い
					}

					const adb = cell.adjborder;
					if (cell.lcnt !== 2) { break; }
					else if (dir !== 1 && adb.bottom.isLine()) { dir = 2; }
					else if (dir !== 2 && adb.top.isLine()) { dir = 1; }
					else if (dir !== 3 && adb.right.isLine()) { dir = 4; }
					else if (dir !== 4 && adb.left.isLine()) { dir = 3; }
				}
				else {
					if (!pos.getb().isLine()) { break; } // 途切れてたら終了
				}
			}
			return errgate;
		}
	},

	FailCode: {
		gateRedup: ["線が２回以上通過している旗門があります。", "A line goes through a gate twice or more."],
		gateUnpass: ["線が通過していない旗門があります。", "There is a gate that the line is not passing."],
		lrOrder: ["旗門を通過する順番が間違っています。", "The order of passing the gate is wrong."],
		stLineNe2: ["○から線が２本出ていません。", "Start/goal circle doesn't have two lines."]
	}
});

type GateGraphComponent = GraphComponent & {
	number: number,
	vert: boolean
}
class StartPosAddress extends Address {
	input(cell: Cell) {
		const pos0 = this.clone();
		if (!this.equals(cell)) {
			this.set(cell);
			pos0.draw();
		}
		this.draw();
	}
	override set<T extends { bx: number, by: number }>(pos: T) {
		this.addOpe(pos.bx, pos.by);
		this.bx = pos.bx;
		this.by = pos.by;
		return this
	}
	addOpe(bx: number, by: number) {
		if (!this.puzzle.ready || (this.bx === bx && this.by === by)) { return; }
		this.puzzle.opemgr.add(new StartposOperation(this.puzzle, this.bx, this.by, bx, by));
	}
}


class StartposOperation extends Operation {
	bx1!: number
	by1!: number
	bx2!: number
	by2!: number

	constructor(puzzle: Puzzle, x1: number, y1: number, x2: number, y2: number) {
		super(puzzle)
		this.bx1 = x1;
		this.by1 = y1;
		this.bx2 = x2;
		this.by2 = y2;
	}
	override decode(strs: string[]) {
		if (strs[0] !== 'PS') { return false; }
		this.bx1 = +strs[1];
		this.by1 = +strs[2];
		this.bx2 = +strs[3];
		this.by2 = +strs[4];
		return true;
	}
	override toString() {
		return ['PS', this.bx1, this.by1, this.bx2, this.by2].join(',');
	}

	override isModify(lastope: this) {
		// 1回の入力でstartposが連続して更新されているなら前回の更新のみ
		if (this.manager.changeflag && lastope.bx2 === this.bx1 && lastope.by2 === this.by1) {
			lastope.bx2 = this.bx2;
			lastope.by2 = this.by2;
			return true;
		}
		return false;
	}

	override undo() { this.exec_sp(this.bx1, this.by1); }
	override redo() { this.exec_sp(this.bx2, this.by2); }
	exec_sp(bx: number, by: number) {
		const bd = this.board, cell = bd.getc(bx, by);
		//@ts-ignore
		bd.startpos.input(cell);
	}
}

class AreaHurdleGraph extends AreaGraphBase<GateGraphComponent> {
	override enabled = true
	override relation = { 'cell.ques': 'node' }
	override setComponentRefs(obj: any, component: any) { obj.gate = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.gatenodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.gatenodes = []; }

	override isnodevalid(cell: Cell) { return (cell.ques === 21 || cell.ques === 22); }
	override isedgevalidbynodeobj(cell1: Cell, cell2: Cell) {
		const dir = cell1.getdir(cell2, 2);
		if (dir === DIRS.UP || dir === DIRS.DN) { return (cell1.ques === 21 && cell2.ques === 21); }
		else if (dir === DIRS.LT || dir === DIRS.RT) { return (cell1.ques === 22 && cell2.ques === 22); }
		return false;
	}

	override rebuild() {
		super.rebuild();
		this.generateGateNumberAll();
	}
	override remakeComponent() {
		super.remakeComponent()
		this.generateGateNumberAll();
	}

	override resetExtraData(cell: any) {
		cell.gate = null;
	}
	override setExtraData(gate: GateGraphComponent) {
		gate.clist = new CellList(gate.getnodeobjs());
		gate.vert = (gate.clist[0].ques === 21);
		gate.number = -1;		// この旗門が持つ順番
	}

	generateGateNumberAll() {
		const bd = this.board, gates = this.components;

		// 一旦すべての旗門のnumberを消す
		for (let r = 0; r < gates.length; r++) { gates[r].number = -1; }

		// 旗門につながる数字を保持する構造体
		const decnumber: {
			nums: number[][]
			done: boolean[]
			erase: () => void
		} = {
			nums: [], // 旗門rにつながる数字
			done: [], // すでにどこかの旗門へアサイン済みの数字かどうか
			erase: function () {
				const doneobj = this.done;
				for (let r = 0; r < gates.length; r++) {
					this.nums[r] = this.nums[r].filter(function (num) { return !doneobj[num]; });
				}
			}
		};
		for (let r = 0; r < gates.length; r++) { decnumber.nums[r] = []; }
		for (let n = 0; n < gates.length; n++) { decnumber.done[n] = false; }

		// 数字がどの旗門に繋がっているかをnums配列にとってくる
		for (let c = 0; c < bd.cell.length; c++) {
			const cell = bd.cell[c] as Cell & { gate: GateGraphComponent };
			if (cell.ques === 1) {
				const qn = cell.qnum, dir = cell.qdir, adc = cell.adjacent;
				if (qn <= 0) { continue; }
				if ((dir === DIRS.NDIR || dir === DIRS.UP) && adc.top.ques === 21) { decnumber.nums[gates.indexOf(adc.top.gate)].push(qn); }
				if ((dir === DIRS.NDIR || dir === DIRS.DN) && adc.bottom.ques === 21) { decnumber.nums[gates.indexOf(adc.bottom.gate)].push(qn); }
				if ((dir === DIRS.NDIR || dir === DIRS.LT) && adc.left.ques === 22) { decnumber.nums[gates.indexOf(adc.left.gate)].push(qn); }
				if ((dir === DIRS.NDIR || dir === DIRS.RT) && adc.right.ques === 22) { decnumber.nums[gates.indexOf(adc.right.gate)].push(qn); }
			}
		}

		// <A> 旗門nに繋がる数字が2つとも同じ数字の場合、無条件で旗門に数字をセット
		for (let r = 0; r < gates.length; r++) {
			const nums = decnumber.nums[r];
			if (nums.length === 2 && nums[0] > 0 && nums[0] === nums[1]) {
				gates[r].number = nums[0];
				decnumber.done[nums[0]] = true;
				decnumber.nums[r] = [];
			}
		}
		decnumber.erase();

		// 旗門に繋がる2つの数字が異なる場合、もしくは1つの数字が繋がる場合
		let repeatflag = true;
		while (repeatflag) {
			repeatflag = false;

			// <B> 旗門に1つの数字だけが繋がっており、さらにその数字が複数箇所の候補になっていない数字を旗門の数字とする
			//   [2]--[ ]--[ ] -> 左側の旗門のみの候補になっているのでOK
			//   [ ]--[2]--[ ] -> 左右両方の候補になっているのでNG
			const numcnt: number[] = [];
			for (let n = 0; n < gates.length; n++) { numcnt[n] = 0; }
			for (let r = 0; r < gates.length; r++) {
				const nums = decnumber.nums[r];
				if (nums.length === 1) { numcnt[nums[0]]++; }
			}

			// 各旗門をチェック
			for (let r = 0; r < gates.length; r++) {
				// 2つ以上の数字が繋がっている場合はダメです
				// また、複数箇所の旗門の候補になっている場合もダメ
				const gate = gates[r], nums = decnumber.nums[r];
				let cand = (nums.length === 1 ? nums[0] : -1);
				if (cand > 0 && numcnt[cand] > 1) { cand = -1; }

				// 旗門に数字をセット
				if (cand > 0) {
					gate.number = cand;
					decnumber.done[cand] = true;
					decnumber.nums[r] = [];
					repeatflag = true;	//再ループする
				}
			}
			decnumber.erase();

			// ここまででセットされたやつがあるなら、初めからループ
			if (repeatflag) { continue; }

			// <C> 1つの旗門に2つ以上の数字が繋がっていても、そのうち1つが単独候補で
			//     もう1つが複数箇所の候補の場合は単独候補の数字を旗門の数字として採用します
			//   [2]--[3]--[4] -> 左側の旗門は2, 右側の旗門は4とする
			//   [2]--[3]      -> 2,3とも単独候補で選択できないのでアサインしない
			for (let n = 0; n < gates.length; n++) { numcnt[n] = 0; }
			for (let r = 0; r < gates.length; r++) {
				decnumber.nums[r].forEach(function (num) { numcnt[num]++; });
			}

			// 各旗門をチェック
			for (let r = 0; r < gates.length; r++) {
				let gate = gates[r], nums = decnumber.nums[r], cand = -1;
				for (let i = 0; i < nums.length; i++) {
					if (numcnt[nums[i]] === 1) { cand = (cand === -1 ? nums[i] : -1); }
				}

				// 旗門に数字をセット
				if (cand > 0) {
					gate.number = cand;
					decnumber.done[cand] = true;
					decnumber.nums[r] = [];
					repeatflag = true;	//再ループする
				}
			}
			decnumber.erase();
		}
	}

	setGateError(gate: GateGraphComponent, val: number) {
		const bd = this.board;
		let clist = new CellList(), cell1: Cell, cell2: Cell;
		const d = gate.clist.getRectSize();
		if (gate.vert) {
			cell1 = bd.getc(d.x1, d.y1 - 2);
			cell2 = bd.getc(d.x1, d.y2 + 2);
		}
		else {
			cell1 = bd.getc(d.x1 - 2, d.y1);
			cell2 = bd.getc(d.x2 + 2, d.y1);
		}
		if (!cell1.isnull && cell1.ques === 1) { clist.add(cell1); }
		if (!cell2.isnull && cell2.ques === 1) { clist.add(cell2); }
		clist.seterr(val);
	}
}
