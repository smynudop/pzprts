//
// パズル固有スクリプト部 ぼんさん・へやぼん・さとがえり・四角スライダー版 bonsan.js

import { LineGraph } from "../puzzle/LineManager";
import { MouseEvent1 } from "../puzzle/MouseInput";
import { ObjectOperation } from "../puzzle/Operation";
import { Cell } from "../puzzle/Piece";
import { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Bonsan = createVariety({
	pid: "bonsan",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['number', 'clear'], play: ['line', 'bgcolor', 'bgcolor1', 'bgcolor2', 'clear', 'completion'] },
		mouseinput: function () { // オーバーライド
			if (this.inputMode === 'completion') { if (this.mousestart) { this.inputqcmp(1); } }
			else { MouseEvent1.prototype.mouseinput.call(this); }
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === 'left') { this.inputLine(); }
				}
				else if (this.mouseend) {
					if (this.notInputted()) { this.inputlight(); }
					else if (this.pid === 'sato') { this.inputLineEnd(); }
				}
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) {
					if (this.pid === 'heyabon' || this.pid === 'sato') { this.inputborder(); }
				}
				else if (this.mouseend && this.notInputted()) { this.inputqnum(); }
			}
		},

		inputLine: function () {
			MouseEvent1.prototype.inputLine.call(this);

			if (this.mousestart) {
				this.firstCell = this.getcell();
			}

			/* "丸数字を移動表示しない"場合の背景色描画準備 */
			if (this.puzzle.execConfig('autocmp') && !this.puzzle.execConfig('dispmove') && !this.notInputted()) {
				this.inputautodark();
			}
		},
		inputLineEnd: function () {
			if (!this.firstCell || this.firstCell.isnull) { return; }
			const room1 = this.firstCell.room, room2 = (this.puzzle.execConfig('dispmove') ? this.mouseCell.room : (!!this.firstCell.path ? this.firstCell.path.destination.room : null));
			room1.checkAutoCmp();
			if (room1 !== room2 && !!room2) {
				room2.checkAutoCmp();
			}
		},
		inputautodark: function () {
			/* 最後に入力した線を取得する */
			const opemgr = this.puzzle.opemgr, lastope = opemgr.lastope as ObjectOperation;
			if (lastope.group !== 'border' || lastope.property !== 'line') { return; }
			const border = this.board.getb(lastope.bx, lastope.by);

			/* 線を引いた/消した箇所にある領域を取得 */
			let clist = new CellList();
			Array.prototype.push.apply(clist, border.sideobj);
			clist = clist.notnull().filter(function (cell) { return cell.path !== null || cell.isNum(); });

			/* 改めて描画対象となるセルを取得して再描画 */
			clist.forEach(function (cell) {
				if (cell.path === null) { if (cell.isNum()) { cell.draw(); } }
				else { cell.path.clist.forEach(function (cell) { if (cell.isNum()) { cell.draw(); } }); }
			});
		},

		inputlight: function () {
			const cell = this.getcell();
			if (cell.isnull) { return; }

			const puzzle = this.puzzle;
			if (puzzle.pid !== 'rectslider' && this.inputdark(cell, 1)) { return; }
			if (puzzle.pid === 'sato') { return; }

			if (this.mouseend && this.notInputted()) { this.mouseCell = this.board.emptycell; }
			this.inputBGcolor();
		},
		inputqcmp: function (val) {
			const cell = this.getcell();
			if (cell.isnull) { return; }

			this.inputdark(cell, val);
		},
		inputdark: function (cell: Cell, val: number): boolean {
			cell = this.getcell();
			if (cell.isnull) { return false; }

			const targetcell = (!this.puzzle.execConfig('dispmove') ? cell : cell.base),
				distance = 0.60,
				dx = this.inputPoint.bx - cell.bx, /* ここはtargetcellではなくcell */
				dy = this.inputPoint.by - cell.by;
			if (targetcell.isNum() && (this.inputMode === 'completion' || (targetcell.qnum === -2 && dx * dx + dy * dy < distance * distance))) {
				targetcell.setQcmp(targetcell.qcmp !== val ? val : 0);
				cell.draw();
				return true;
			}
			return false;
		}
	},
	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		isCmp: function (): boolean { // 描画用
			const targetcell = (!this.puzzle.execConfig('dispmove') ? this : this.base);
			if (targetcell.qcmp === 1) { return true; }

			if (!this.puzzle.execConfig('autocmp')) { return false; }

			return targetcell.checkCmp();
		},
		checkCmp: function (): boolean {
			if (this.isnull) { return false; }
			const num = this.getNum();
			if (this.qcmp === 1) { return true; }
			else if (this.path === null) { return (num === 0); }
			else {
				const clist = (this.path !== null ? this.path.clist : new CellList([this]));
				const d = clist.getRectSize();
				return ((d.cols === 1 || d.rows === 1) && (num === clist.length - 1));
			}
		},

		maxnum: function (): number {
			const bd = this.board, bx = this.bx, by = this.by;
			const col = (((bx < (bd.maxbx >> 1)) ? (bd.maxbx - bx) : bx) >> 1);
			const row = (((by < (bd.maxby >> 1)) ? (bd.maxby - by) : by) >> 1);
			return Math.max(col, row);
		},
		minnum: 0
	},
	Board: {
		cols: 8,
		rows: 8,

		hasborder: 1
	},

	LineGraph: {
		enabled: true,
		moveline: true,

		resetExtraData: function (cell) {
			cell.distance = (cell.qnum >= 0 ? cell.qnum : null);

			LineGraph.prototype.resetExtraData.call(this, cell);
		},
		setExtraData: function (component) {
			LineGraph.prototype.setExtraData.call(this, component);

			let cell = component.departure!, num = cell.qnum;
			num = (num >= 0 ? num : this.board.cell.length);
			//@ts-ignore
			cell.distance = num;
			if (cell.lcnt === 0) { return; }

			/* component.departureは線が1方向にしかふられていないはず */
			//@ts-ignore
			let dir = cell.getdir(cell.pathnodes[0].nodes[0].obj, 2);
			//@ts-ignore
			let pos = cell.getaddr(), n = cell.distance;
			while (1) {
				pos.movedir(dir, 2);
				const cell = pos.getc(), adb = cell.adjborder;
				if (cell.isnull || cell.lcnt >= 3 || cell.lcnt === 0) { break; }

				//@ts-ignore
				cell.distance = --n;
				if (cell === component.destination) { break; }
				else if (dir !== 1 && adb.bottom.isLine()) { dir = 2; }
				else if (dir !== 2 && adb.top.isLine()) { dir = 1; }
				else if (dir !== 3 && adb.right.isLine()) { dir = 4; }
				else if (dir !== 4 && adb.left.isLine()) { dir = 3; }
			}
		}
	},

	AreaRoomGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		hideHatena: true,

		autocmp: "number",

		gridcolor_type: "LIGHT",

		bgcellcolor_func: "qsub2",
		numbercolor_func: "move",
		qsubcolor1: "rgb(224, 224, 255)",
		qsubcolor2: "rgb(255, 255, 144)",

		circlefillcolor_func: "qcmp",

		paint: function () {
			this.drawBGCells();
			this.drawGrid();

			this.drawTip();
			this.drawDepartures();
			this.drawLines();

			this.drawCircledNumbers();

			this.drawChassis();

			this.drawTarget();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			if (!this.checkpflag("c")) { this.decodeBorder(); }
			this.decodeNumber16();
		},
		encodePzpr: function (type) {
			this.outpflag = 'c';
			this.encodeNumber16();
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnum();
			this.decodeCellQsubQcmp();
			this.decodeBorderQues();
			this.decodeBorderLine();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeCellQsubQcmp();
			this.encodeBorderQues();
			this.encodeBorderLine();
		},

		/* decode/encodeCellQsubの上位互換です */
		decodeCellQsubQcmp: function () {
			this.decodeCell(function (cell, ca) {
				if (ca !== "0") {
					cell.qsub = +ca & 0x0f;
					cell.qcmp = +ca >> 4; // int
				}
			});
		},
		encodeCellQsubQcmp: function () {
			this.encodeCell(function (cell) {
				return (cell.qsub + (cell.qcmp << 4)) + " ";
			});
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkLineExist+",
			"checkBranchLine",
			"checkCrossLine",

			"checkConnectObject",
			"checkLineOverLetter",
			"checkCurveLine",

			"checkLineLength",

			"checkFractal",

			"checkNoMoveCircle",
			"checkDisconnectLine"
		],

		checkCurveLine: function () {
			this.checkAllArea(this.board.linegraph, function (w, h, a, n) { return (w === 1 || h === 1); }, "laCurve");
		},
		checkLineLength: function () {
			this.checkAllArea(this.board.linegraph, function (w, h, a, n) { return (n < 0 || a === 1 || n === a - 1); }, "laLenNe");
		},
		checkNoMoveCircle: function () {
			this.checkAllCell(function (cell) { return (cell.qnum >= 1 && cell.lcnt === 0); }, "nmNoMove");
		},

		checkFractal: function () {
			const rooms = this.board.roommgr.components;
			allloop:
			for (let r = 0; r < rooms.length; r++) {
				const clist = rooms[r].clist, d = clist.getRectSize();
				//@ts-ignore
				d.xx = d.x1 + d.x2; d.yy = d.y1 + d.y2;
				for (let i = 0; i < clist.length; i++) {
					const cell = clist[i];
					//@ts-ignore
					if (cell.isDestination() === this.board.getc(d.xx - cell.bx, d.yy - cell.by).isDestination()) { continue; }

					this.failcode.add("brObjNotSym");
					if (this.checkOnly) { break allloop; }
					clist.filter(function (cell) { return cell.isDestination(); }).seterr(1);
				}
			}
		},
		checkNoObjectBlock: function () {
			this.checkNoMovedObjectInRoom(this.board.roommgr);
		},
		checkPluralObjectBlock: function () {
			this.checkAllBlock(this.board.roommgr, function (cell) { return cell.base.qnum !== -1; }, function (w, h, a, n) { return (a < 2); }, "bkNumGe2");
		}
	},

	FailCode: {
		bkNoNum: ["○のない部屋があります。", "A room has no circle."],
		bkNumGe2: ["○が部屋に2つ以上あります。", "A room has two or more circles."],
		bkObjNotSym: ["部屋の中の○が点対称に配置されていません。", "Position of circles in the room is not point symmetric."],
		brObjNotSym: ["○が点対称に配置されていません。", "Position of circles is not point symmetric."],
		laOnNum: ["○の上を線が通過しています。", "A line goes through a circle."],
		laIsolate: ["○につながっていない線があります。", "A line doesn't connect any circle."],
		nmConnected: ["○が繋がっています。", "There are connected circles."],
		nmNoMove: ["○から線が出ていません。", "A circle doesn't start any line."]
	},
});
