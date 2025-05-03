//
// パズル固有スクリプト部 ぬりめいず版 nurimaze.js

import { Address } from "../puzzle/Address";
import type { IPathSeg } from "../puzzle/Answer";
import { REDUCE } from "../puzzle/BoardExec";
import type { GraphComponent } from "../puzzle/GraphBase";
import { MouseEvent1 } from "../puzzle/MouseInput";
import { Operation } from "../puzzle/Operation";
import { type Border, type Cell, isCell } from "../puzzle/Piece";
import { CellList } from "../puzzle/PieceList";
import type { Puzzle } from "../puzzle/Puzzle";
import { createVariety } from "./createVariety";

//
export const Nurimaze = createVariety({
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		inputModes: { edit: ['border', 'mark-circle', 'mark-triangle'], play: ['shade', 'unshade'] },
		mouseinput: function (): void { // オーバーライド
			if (this.inputMode === 'shade' || this.inputMode === 'unshade') {
				this.inputtile_nurimaze();
			}
			else { MouseEvent1.prototype.mouseinput.call(this); }
		},
		mouseinput_other: function (): void {
			if (this.inputMode.indexOf('mark-') === 0) {
				this.inputmarks();
			}
		},
		mouseinput_auto: function (): void {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) { this.inputtile_nurimaze(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) { this.inputEdit(); }
				else if (this.mouseend) { this.inputEdit_end(); }
			}
		},

		inputtile_nurimaze: function (): void {
			const cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell) { return; }
			if (this.inputData === null) { this.decIC(cell); }

			const bd = this.puzzle.board, clist = cell.room.clist;
			if (this.inputData === 1) {
				for (let i = 0; i < clist.length; i++) {
					if (clist[i].ques !== 0 || bd.startpos.equals(clist[i]) || bd.goalpos.equals(clist[i])) {
						if (this.mousestart) { this.inputData = (cell.qsub !== 1 ? 2 : 0); break; }
						else { return; }
					}
				}
			}

			this.mouseCell = cell;
			for (let i = 0; i < clist.length; i++) {
				const cell2 = clist[i];
				(this.inputData === 1 ? cell2.setShade : cell2.clrShade).call(cell2);
				cell2.setQsub(this.inputData === 2 ? 1 : 0);
			}
			clist.forEach(c => c.draw());
		},

		inputEdit: function (): void {
			const cell = this.getcell();
			if (cell.isnull) { return; }

			// 初回はこの中に入ってきます。
			if (this.inputData === null) {
				this.inputEdit_first();
			}

			// startposの入力中の場合
			if (this.inputData === 10) {
				this.puzzle.board.startpos.input(cell);
			}
			// goalposの入力中の場合
			else if (this.inputData === 11) {
				this.puzzle.board.goalpos.input(cell);
			}
			// 境界線の入力中の場合
			else if (this.inputData !== null) {
				this.inputborder();
			}
		},
		inputEdit_first: function (): void {
			const pos = this.getpos(0.33), bd = this.puzzle.board;
			// startposの上ならstartpos移動ルーチンへ移行
			if (bd.startpos.equals(pos)) {
				this.inputData = 10;
			}
			// goalposの上ならgoalpos移動ルーチンへ移行
			else if (bd.goalpos.equals(pos)) {
				this.inputData = 11;
			}
			// その他は境界線の入力へ
			else {
				this.inputborder();
			}
		},

		inputEdit_end: function (): void {
			const cell = this.getcell();
			if (cell.isnull) { return; }

			if (this.inputData === 10 || this.inputData === 11) {
				this.inputData = null;
				cell.draw();
			}
			else if (this.notInputted()) {
				if (cell !== this.cursor.getc()) {
					this.setcursor(cell);
				}
				else {
					/* ○と△の入力ルーチンへジャンプ */
					this.inputQuesMark(cell);
				}
			}
		},

		inputmarks: function (): void {
			const cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell) { return; }

			this.inputQuesMark(cell);

			this.mouseCell = cell;
		},
		inputQuesMark: function (cell: Cell): void {
			let bd = this.puzzle.board, newques = -1;
			if (this.inputMode === 'mark-circle') { newques = (cell.ques !== 41 ? 41 : 0); }
			else if (this.inputMode === 'mark-triangle') { newques = (cell.ques !== 42 ? 42 : 0); }
			else if (this.btn === 'left') { newques = { 0: 41, 41: 42, 42: 0 }[cell.ques as 0 | 41 | 42]; }
			else if (this.btn === 'right') { newques = { 0: 42, 42: 41, 41: 0 }[cell.ques as 0 | 41 | 42]; }

			if (newques === 0 || (!bd.startpos.equals(cell) && !bd.goalpos.equals(cell))) {
				cell.setQues(newques);
				cell.draw();
			}
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,

		keyinput: function (ca): void {
			if (this.keydown && this.puzzle.editmode) {
				this.key_inputqnum_nurimaze(ca);
			}
		},
		key_inputqnum_nurimaze: function (ca: string): void {
			const cell = this.cursor.getc(), bd = this.puzzle.board;

			let old = cell.ques, newques = -1;
			if (ca === '1' || ca === 'q') { newques = (old !== 41 ? 41 : 0); }
			else if (ca === '2' || ca === 'w') { newques = (old !== 42 ? 42 : 0); }
			else if (ca === '3' || ca === 'e' || ca === ' ' || ca === 'BS') { newques = 0; }
			else if (ca === 's') { bd.startpos.input(cell); }
			else if (ca === 'g') { bd.goalpos.input(cell); }

			if (newques !== old && (newques === 0 || (!bd.startpos.equals(cell) && !bd.goalpos.equals(cell)))) {
				cell.setQues(newques);
				cell.draw();
			}
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Board: {
		hasborder: 1,

		startpos: null! as StartAddress,
		goalpos: null! as GoalAddress,


		createExtraObject: function (): void {
			console.log("!!")
			console.dir(this.puzzle, { depth: 2 })
			this.startpos = new StartAddress(this.puzzle, 1, 1);
			this.goalpos = new GoalAddress(this.puzzle, this.cols * 2 - 1, this.rows * 2 - 1);
			this.startpos.partner = this.goalpos;
			this.goalpos.partner = this.startpos;
		},
		initExtraObject: function (col, row): void {
			this.disableInfo();
			this.startpos.init(1, 1);
			this.goalpos.init(col * 2 - 1, row * 2 - 1);
			this.enableInfo();
		},

		exchangestartgoal: function (): void {
			const old_start = this.startpos.getc();
			const old_goal = this.goalpos.getc();
			this.startpos.set(old_goal);
			this.goalpos.set(old_start);

			this.startpos.draw();
			this.goalpos.draw();
		}
	},
	BoardExec: {
		posinfo: {},
		posinfo_start: null! as { pos: Address, isdel: boolean },
		posinfo_goal: null! as { pos: Address, isdel: boolean },

		adjustBoardData: function (key, d): void {
			const bd = this.board;

			this.posinfo_start = this.getAfterPos(key, d, bd.startpos.getc());
			this.posinfo_goal = this.getAfterPos(key, d, bd.goalpos.getc());
		},
		adjustBoardData2: function (key, d): void {
			const bd = this.board, opemgr = this.puzzle.opemgr;
			const info1 = this.posinfo_start, info2 = this.posinfo_goal
			const isrec = ((key & REDUCE) && (info1.isdel || info2.isdel) && (!opemgr.undoExec && !opemgr.redoExec));
			if (isrec) { opemgr.forceRecord = true; }
			bd.startpos.set(info1.pos.getc());
			bd.goalpos.set(info2.pos.getc());
			if (isrec) { opemgr.forceRecord = false; }
		}
	},

	OperationManager: {
		addExtraOperation: function (): void {
			this.operationlist.push(StartGoalOperation);
		}
	},

	AreaUnshadeGraph: {
		enabled: true
	},
	AreaRoomGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		enablebcolor: true,
		bgcellcolor_func: "qsub1",
		errbcolor2: "rgb(192, 192, 255)",
		bbcolor: "rgb(96, 96, 96)",

		paint: function () {
			this.drawBGCells();
			this.drawShadedCells();
			this.drawGrid();

			this.drawQuesMarks();
			this.drawStartGoal();

			this.drawBorders();

			this.drawChassis();

			this.drawBoxBorders(true);

			this.drawTarget();
		},

		drawStartGoal: function (): void {
			const g = this.vinc('cell_sg', 'auto');
			const bd = this.puzzle.board, d = this.range;

			g.vid = "text_stpos";
			let cell = bd.startpos.getc();
			if (cell.bx >= d.x1 && d.x2 >= cell.bx && cell.by >= d.y1 && d.y2 >= cell.by) {
				if (!cell.isnull) {
					g.fillStyle = (this.puzzle.mouse.inputData === 10 ? "red" : (cell.qans === 1 ? this.fontShadecolor : this.quescolor));
					this.disptext("S", cell.bx * this.bw, cell.by * this.bh);
				}
				else { g.vhide(); }
			}

			g.vid = "text_glpos";
			cell = bd.goalpos.getc();
			if (cell.bx >= d.x1 && d.x2 >= cell.bx && cell.by >= d.y1 && d.y2 >= cell.by) {
				if (!cell.isnull) {
					g.fillStyle = (this.puzzle.mouse.inputData === 11 ? "red" : (cell.qans === 1 ? this.fontShadecolor : this.quescolor));
					this.disptext("G", cell.bx * this.bw, cell.by * this.bh);
				}
				else { g.vhide(); }
			}
		},

		drawQuesMarks: function (): void {
			const g = this.vinc('cell_mark', 'auto', true);

			const rsize = this.cw * 0.30, tsize = this.cw * 0.26;
			g.lineWidth = 2;

			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i], num = cell.ques;
				const px = cell.bx * this.bw, py = cell.by * this.bh;
				g.strokeStyle = this.getQuesNumberColor(cell);

				g.vid = "c_mk1_" + cell.id;
				if (num === 41) {
					g.strokeCircle(px, py, rsize);
				}
				else { g.vhide(); }

				g.vid = "c_mk2_" + cell.id;
				if (num === 42) {
					g.beginPath();
					g.setOffsetLinePath(px, py, 0, -tsize, -rsize, tsize, rsize, tsize, true);
					g.stroke();
				}
				else { g.vhide(); }
			}
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type): void {
			this.decodeBorder();
			this.decodeCell_nurimaze();
		},
		encodePzpr: function (type): void {
			this.encodeBorder();
			this.encodeCell_nurimaze();
		},

		decodeCell_nurimaze: function (): void {
			let c = 0, i = 0, bstr = this.outbstr, bd = this.puzzle.board;
			for (i = 0; i < bstr.length; i++) {
				const ca = bstr.charAt(i), cell = bd.cell[c];

				if (ca === '1') { bd.startpos.set(cell); }
				else if (ca === '2') { bd.goalpos.set(cell); }
				else if (ca === '3') { cell.ques = 41; }
				else if (ca === '4') { cell.ques = 42; }
				else if (this.include(ca, "5", "9") || this.include(ca, "a", "z")) { c += (Number.parseInt(ca, 36) - 5); }

				c++;
				if (!bd.cell[c]) { break; }
			}
			this.outbstr = bstr.substr(i + 1);
		},
		encodeCell_nurimaze: function (): void {
			let cm = "", count = 0, bd = this.puzzle.board;
			for (let c = 0; c < bd.cell.length; c++) {
				let pstr = "", cell = bd.cell[c];
				if (bd.startpos.equals(cell)) { pstr = "1"; }
				else if (bd.goalpos.equals(cell)) { pstr = "2"; }
				else if (cell.ques === 41) { pstr = "3"; }
				else if (cell.ques === 42) { pstr = "4"; }
				else { count++; }

				if (count === 0) { cm += pstr; }
				else if (pstr || count === 31) { cm += ((4 + count).toString(36) + pstr); count = 0; }
			}
			if (count > 0) { cm += (4 + count).toString(36); }

			this.outbstr += cm;
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function (): void {
			this.decodeAreaRoom();
			this.decodeCellQues_nurimaze();
			this.decodeCellAns();
		},
		encodeData: function (): void {
			this.encodeAreaRoom();
			this.encodeCellQues_nurimaze();
			this.encodeCellAns();
		},

		decodeCellQues_nurimaze: function (): void {
			const bd = this.puzzle.board;
			this.decodeCell(function (cell, ca) {
				if (ca === "s") { bd.startpos.set(cell); }
				else if (ca === "g") { bd.goalpos.set(cell); }
				else if (ca === "o") { cell.ques = 41; }
				else if (ca === "t") { cell.ques = 42; }
			});
		},
		encodeCellQues_nurimaze: function (): void {
			const bd = this.puzzle.board;
			this.encodeCell(function (cell) {
				if (bd.startpos.equals(cell)) { return "s "; }
				else if (bd.goalpos.equals(cell)) { return "g "; }
				else if (cell.ques === 41) { return "o "; }
				else if (cell.ques === 42) { return "t "; }
				else { return ". "; }
			});
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkSameColorTile",					// 問題チェック用 
			"checkShadedObject",					// 問題チェック用
			"checkConnectUnshade",
			"check2x2ShadeCell+",
			"check2x2UnshadeCell++",
			"checkUnshadeLoop",
			"checkRouteCheckPoint",
			"checkRouteNoDeadEnd"
		],

		_info: null! as {
			num?: IPathSeg[]
			maze: {
				onroute: CellList,
				outroute: CellList
			} | null
		},

		checkShadedObject: function (): void {
			const bd = this.board;
			this.checkAllCell(function (cell) { return cell.qans === 1 && (cell.ques !== 0 || bd.startpos.equals(cell) || bd.goalpos.equals(cell)); }, "objShaded");
		},

		checkUnshadeLoop: function (): void {
			const bd = this.board, ublks = bd.ublkmgr.components;
			for (let r = 0; r < ublks.length; r++) {
				if (ublks[r].circuits === 0) { continue; }

				this.failcode.add("cuLoop");
				if (this.checkOnly) { return; }
				this.searchloop(ublks[r]).seterr(1);
			}
		},

		checkRouteCheckPoint: function (): void {
			const minfo = this.getMazeRouteInfo();
			const errclist = minfo.outroute.filter(function (cell) { return cell.ques === 41; });
			if (errclist.length > 0) {
				this.failcode.add("routeIgnoreCP");
				if (this.checkOnly) { return; }
				minfo.onroute.seterr(1);
			}
		},
		checkRouteNoDeadEnd: function (): void {
			const minfo = this.getMazeRouteInfo();
			const errclist = minfo.onroute.filter(function (cell) { return cell.ques === 42; });
			if (errclist.length > 0) {
				this.failcode.add("routePassDeadEnd");
				if (this.checkOnly) { return; }
				minfo.onroute.seterr(1);
			}
		},

		searchloop: function (component: GraphComponent): CellList {
			// Loopがない場合は何もしないでreturn
			if (component.circuits <= 0) { return (new CellList()); }

			// どこにLoopが存在するか判定を行う
			const bd = this.board;
			const errclist = new CellList();
			let history: (Cell | Border)[] = [component.clist[0]], prevcell = null;
			const steps: Record<number, number> = {}, rows = (bd.maxbx - bd.minbx);

			while (history.length > 0) {
				let obj = history[history.length - 1], nextobj = null;
				let step = steps[obj.by * rows + obj.bx];
				if (step === void 0) {
					step = steps[obj.by * rows + obj.bx] = history.length - 1;
				}
				// ループになった場合 => ループフラグをセットする
				else if ((history.length - 1) > step) {
					for (let i = history.length - 2; i >= 0; i--) {
						const p = history[i]
						if (isCell(p)) { errclist.add(p); }
						if (p === obj) { break; }
					}
				}

				if (isCell(obj)) {
					prevcell = obj;
					//@ts-ignore
					for (let i = 0; i < obj.ublknodes[0].nodes.length; i++) {
						//@ts-ignore
						const cell2 = obj.ublknodes[0].nodes[i].obj;
						const border = bd.getb((obj.bx + cell2.bx) >> 1, (obj.by + cell2.by) >> 1);
						if (steps[border.by * rows + border.bx] === void 0) { nextobj = border; break; }
					}
				}
				else { // borderの時
					for (let i = 0; i < obj.sidecell.length; i++) {
						const cell = obj.sidecell[i];
						if ((cell !== prevcell) && (cell !== history[history.length - 2])) { nextobj = cell; break; }
					}
				}
				if (!!nextobj) { history.push(nextobj as Cell); }
				else { history.pop(); }
			}

			return errclist;
		},

		getMazeRouteInfo: function (): {
			onroute: CellList,
			outroute: CellList
		} {
			if (this._info.maze) { return this._info.maze; }

			/* Start->Goalの経路探索 */
			const bd = this.board;
			const history = [bd.startpos.getc()];
			const steps: Record<number, number> = {}, onroutes: Record<number, boolean> = {}, rows = (bd.maxbx - bd.minbx);
			while (history.length > 0) {
				let cell = history[history.length - 1], nextcell = null;
				let step = steps[cell.by * rows + cell.bx];
				if (step === void 0) {
					step = steps[cell.by * rows + cell.bx] = history.length - 1;
				}

				// Goalに到達した場合 => Goalフラグをセットして戻る
				if (bd.goalpos.equals(cell)) {
					for (let i = history.length - 1; i >= 0; i--) {
						onroutes[history[i].by * rows + history[i].bx] = true;
					}
				}

				// 隣接するセルへ
				//@ts-ignore
				const nodes = (cell.ublknodes[0] ? cell.ublknodes[0].nodes : []);
				for (let i = 0; i < nodes.length; i++) {
					const cell1 = nodes[i].obj;
					if (steps[cell1.by * rows + cell1.bx] === void 0) { nextcell = cell1; break; }
				}

				if (!!nextcell) { history.push(nextcell); }
				else { history.pop(); }
			}

			const info = {
				onroute: (new CellList()),
				outroute: (new CellList())
			};
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (cell.isUnshade()) {
					if (!!onroutes[cell.by * rows + cell.bx]) { info.onroute.add(cell); }
					else { info.outroute.add(cell); }
				}
			}
			this._info.maze = info
			return (info);
		}
	},

	FailCode: {
		cuLoop: ["白マスで輪っかができています。", "There is a looped unshaded cells."],
		routeIgnoreCP: ["○がSからGへの経路上にありません。", "There is a circle out of the shortest route from S to G."],
		routePassDeadEnd: ["△がSからGへの経路上にあります。", "There is a triangle on the shortest route from S to G."],
		objShaded: ["オブジェクトが黒マスになっています。", "An object is shaded."]
	}
});




class StartGoalAddress extends Address {
	type = ""
	partner: Address = null!

	// constructor(puzzle: Puzzle, bx: number, by: number) {
	// 	super(puzzle, bx, by)
	// }

	input(cell: Cell) {
		if (!this.partner.equals(cell)) {
			if (!this.equals(cell)) {
				this.set(cell);
			}
			else {
				this.draw();
			}
		}
		else {
			//@ts-ignore
			this.board.exchangestartgoal();
		}
	}
	override set<T extends { bx: number, by: number }>(pos: T) {
		const pos0 = this.getaddr();
		this.addOpe(pos.bx, pos.by);

		this.bx = pos.bx;
		this.by = pos.by;

		pos0.draw();
		this.draw();
		return this
	}

	addOpe(bx: number, by: number) {
		if (this.bx === bx && this.by === by) { return; }
		this.puzzle.opemgr.add(new StartGoalOperation(this.puzzle, this.type, this.bx, this.by, bx, by));
	}
}


class StartAddress extends StartGoalAddress {
	override type = "start"
}
class GoalAddress extends StartGoalAddress {
	override type = "goal"
}

class StartGoalOperation extends Operation {
	bx1: number
	by1: number
	bx2: number
	by2: number

	constructor(puzzle: Puzzle, property: string, x1: number, y1: number, x2: number, y2: number) {
		super(puzzle)
		this.property = property
		this.bx1 = x1;
		this.by1 = y1;
		this.bx2 = x2;
		this.by2 = y2;
	}
	override decode(strs: string[]) {
		if (strs[0] !== 'PS' && strs[0] !== 'PG') { return false; }
		this.property = (strs[0] === 'PS' ? 'start' : 'goal');
		this.bx1 = +strs[1];
		this.by1 = +strs[2];
		this.bx2 = +strs[3];
		this.by2 = +strs[4];
		return true;
	}
	override toString() {
		return [(this.property === 'start' ? 'PS' : 'PG'), this.bx1, this.by1, this.bx2, this.by2].join(',');
	}

	isModify(lastope: this) {
		// 1回の入力でstartpos, goalposが連続して更新されているなら前回の更新のみ
		if (this.manager.changeflag && lastope.bx2 === this.bx1 && lastope.by2 === this.by1 && lastope.property === this.property) {
			lastope.bx2 = this.bx2;
			lastope.by2 = this.by2;
			return true;
		}
		return false;
	}

	override undo() { this.exec_sg(this.bx1, this.by1); }
	override redo() { this.exec_sg(this.bx2, this.by2); }
	exec_sg(bx: number, by: number) {
		const bd = this.puzzle.board, cell = bd.getc(bx, by);
		//@ts-ignore
		if (this.property === 'start') { bd.startpos.set(cell); }
		//@ts-ignore
		else if (this.property === 'goal') { bd.goalpos.set(cell); }
	}
}