//
// パズル固有スクリプト部 カントリーロード・月か太陽・温泉めぐり版 country.js

import type { GraphComponent } from "../puzzle/GraphBase";
import { LineGraph } from "../puzzle/LineManager";
import type { Border } from "../puzzle/Piece";
import type { Puzzle } from "../puzzle/Puzzle";
import { createVariety } from "./createVariety";

//
export const Onsen = createVariety({
	pid: "onsen",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['border', 'number', 'clear', 'info-line'], play: ['line', 'peke', 'subcircle', 'subcross', 'clear', 'info-line'] }
		,
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === 'left') { this.inputLine(); }
					else if (this.btn === 'right') { this.inputpeke(); }
				}
				else if (this.mouseend && this.notInputted()) {
					if (this.inputpeke_onend()) { return; }
					this.inputMB();
				}
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) {
					this.inputborder();
				}
				else if (this.mouseend && this.notInputted()) {
					this.inputqnum();
				}
			}
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
		group: "cell",
		lpath: null! as GraphComponent,
		maxnum: function (): number {
			return Math.min(999, this.room.clist.length);
		}
	},
	Board: {
		hasborder: 1,
		cols: 8,
		rows: 8,
		lineblkgraph: null! as LineBlockGraph,
		addExtraInfo: function () {
			this.lineblkgraph = this.addInfoList(LineBlockGraph);
		}
	},

	LineGraph: {
		enabled: true,
		makeClist: true
	},


	AreaRoomGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		irowake: true,

		numbercolor_func: "qnum",

		paint: function () {
			this.drawBGCells();
			this.drawCircledNumbers();

			this.drawDashedGrid();
			this.drawBorders();

			this.drawMBs();
			this.drawLines();
			this.drawPekes();

			this.drawChassis();

			this.drawTarget();
		},
		hideHatena: true,
		circleratio: [0.40, 0.37],
		gridcolor_type: "LIGHT",

		repaintParts: function (blist) {
			this.range.cells = blist.cellinside() as any;

			this.drawCircledNumbers();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeBorder();
			this.decodeNumber16();
		},
		encodePzpr: function (type) {
			this.encodeBorder();
			this.encodeNumber16();
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeAreaRoom();
			this.decodeCellQnum();
			this.decodeBorderLine();
		},
		encodeData: function () {
			this.encodeAreaRoom();
			this.encodeCellQnum();
			this.encodeBorderLine();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkBranchLine",
			"checkCrossLine",

			"checkSingleNumberInLoop",

			"checkLineRoomPassOnce",
			"checkLineRoomLength",

			"checkNoRoadCountry",
			"checkNumberExistsInLoop",
			"checkLineLengthInEachRoom",

			"checkDeadendLine+",
			"checkIsolatedCircle+"
		],
		checkNoRoadCountry: function () {
			this.checkLinesInArea(this.board.roommgr, function (w, h, a, n) { return (a !== 0); }, "bkNoLine");
		},
		checkRoomPassOnce: function () {
			const rooms = this.board.roommgr.components;
			for (let r = 0; r < rooms.length; r++) {
				let cnt = 0, clist = rooms[r].clist;
				for (let i = 0; i < clist.length; i++) {
					let cell = clist[i], adb = cell.adjborder, border: Border;
					border = adb.top; if (border.ques === 1 && border.line === 1) { cnt++; }
					border = adb.bottom; if (border.ques === 1 && border.line === 1) { cnt++; }
					border = adb.left; if (border.ques === 1 && border.line === 1) { cnt++; }
					border = adb.right; if (border.ques === 1 && border.line === 1) { cnt++; }
				}
				if (cnt <= 2) { continue; }

				this.failcode.add("bkPassTwice");
				if (this.checkOnly) { break; }
				clist.seterr(1);
			}
		},
		checkLineRoomPassOnce: function () {
			const bd = this.board;
			const paths = bd.linegraph.components;
			const rooms = bd.roommgr.components;
			allloop:
			for (let r = 0; r < paths.length; r++) {
				const lpaths = [];
				for (let i = 0; i < paths[r].clist.length; i++) {
					const cell = paths[r].clist[i];
					const roomid = rooms.indexOf(cell.room as any);
					//@ts-ignore
					if (!lpaths[roomid]) { lpaths[roomid] = cell.lpath; }
					//@ts-ignore
					else if (lpaths[roomid] !== cell.lpath) {
						this.failcode.add("blPassTwice");
						if (this.checkOnly) { break allloop; }
						lpaths[roomid].clist.seterr(1);
						//@ts-ignore
						cell.lpath.clist.seterr(1);
					}
				}
			}
		},
		checkLineRoomLength: function () {
			const bd = this.board;
			const paths = bd.linegraph.components;
			const lpaths = bd.lineblkgraph.components;
			const numcache: number[] = [];
			for (let r = 0; r < lpaths.length; r++) {
				const path = lpaths[r].clist[0].path!;
				const pathid = paths.indexOf(path);
				let num = numcache[pathid];
				if (!num) { num = (numcache[pathid] || (path.clist.getQnumCell()?.getNum() ?? -1)); }
				if (num < 0 || num === lpaths[r].clist.length) { continue; }

				this.failcode.add("blLineNe");
				if (this.checkOnly) { break; }
				lpaths[r].clist.seterr(1);
			}
		},
		checkLineLengthInEachRoom: function () {
			// 数字が入っている場合はcheckLineRoomLengthで判定されるので、数字が入っていないのまるのループのみ判定します
			const bd = this.board;
			const paths = bd.linegraph.components;
			const lpaths = bd.lineblkgraph.components;
			allloop:
			for (let r = 0; r < paths.length; r++) {
				const path = paths[r], num = path.clist.getQnumCell()!.getNum();
				if (num >= 0) { continue; }

				let lpathlen: Record<number, number> = {}, length = null;
				for (let i = 0; i < path.clist.length; i++) {
					//@ts-ignore
					const id = lpaths.indexOf(path.clist[i].lpath);
					lpathlen[id] = (lpathlen[id] || 0) + 1;
				}
				for (const lpathid in lpathlen) {
					if (!length) { length = lpathlen[lpathid]; continue; }
					else if (length === lpathlen[lpathid]) { continue; }
					this.failcode.add("blLineDiff");
					if (this.checkOnly) { break allloop; }
					path.clist.seterr(1);
					break;
				}
			}
		},
		checkIsolatedCircle: function () {
			this.checkAllCell(function (cell) { return (cell.lcnt === 0 && cell.isNum()); }, "lnIsolate");
		},

		checkSingleNumberInLoop: function () {
			this.checkNumbersInLoop(function (cnt) { return (cnt <= 1); }, "lpNumGt2");
		},
		checkNumberExistsInLoop: function () {
			this.checkNumbersInLoop(function (cnt) { return (cnt > 0); }, "lpNoNum");
		},
		checkNumbersInLoop: function (func: (num: number) => boolean, code: string) {
			let result = true;
			const paths = this.board.linegraph.components;
			for (let r = 0; r < paths.length; r++) {
				if (func(paths[r].clist.filter(function (cell) { return cell.isNum(); }).length)) { continue; }

				result = false;
				if (this.checkOnly) { break; }
				paths[r].setedgeerr(1);
			}
			if (!result) {
				this.failcode.add(code);
				if (!this.checkOnly) { this.board.border.setnoerr(); }
			}
		}
	},

	"FailCode": {
		blPassTwice: ["ある線が１つの部屋を２回以上通っています。", "A line passes a room twice or more."],
		blLineNe: ["線が通過するマスの数が数字と違います。", "The Length of the path in a room is different from the number of the loop."],
		blLineDiff: ["各部屋で線が通過するマスの数が違います。", "The Length of the path in a room is different in each room."],
		bkNoLine: ["線の通っていない部屋があります。", "A room remains blank."],
		lnIsolate: ["線の通っていない○があります。", "Lines doesn't pass a circle."],
		lpNumGt2: ["数字が2つ以上含まれたループがあります。", "A loop has plural numbers."],
		lpNoNum: ["○を含んでいないループがあります。", "A loop has no numbers."]
	}
});


class LineBlockGraph extends LineGraph {
	constructor(puzzle: Puzzle, gcoption: any) {
		super(puzzle, undefined, gcoption)
	}
	override enabled = true
	override relation = { 'border.line': 'link', 'border.ques': 'separator' }
	override makeClist = true
	override coloring = false

	override setComponentRefs(obj: any, component: any) { obj.lpath = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.lpathnodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.lpathnodes = []; }

	//@ts-ignore
	override incdecLineCount = null
	override isedgevalidbylinkobj(border: Border) { return border.isLine() && !border.isBorder(); }
	override isedgeexistsbylinkobj(border: any) { return border.lpath !== null; }

	override setEdgeByLinkObj(linkobj: any) {
		const isset = this.isedgevalidbylinkobj(linkobj);
		if (isset === this.isedgeexistsbylinkobj(linkobj)) {
			const cells = this.getSideObjByLinkObj(linkobj);
			for (let i = 0; i < cells.length; i++) {
				const cell = cells[i];
				if (this.isnodevalid(cell)) { this.createNodeIfEmpty(cell); }
				else { this.deleteNodeIfEmpty(cell); }
			}
			return;
		}

		if (isset) { this.addEdgeByLinkObj(linkobj); }
		else { this.removeEdgeByLinkObj(linkobj); }
	}
}