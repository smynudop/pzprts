//
// パズル固有スクリプト部 へやわけ・∀人∃ＨＥＹＡ版 heyawake.js
//
import type { Board } from "../puzzle/Board";
import { border, roomNumber16 } from "../puzzle/Encode";
import type { Cell } from "../puzzle/Piece";
import type { CellList } from "../puzzle/PieceList";
import type { IConfig } from "../puzzle/Puzzle";
import { createVariety } from "./createVariety";
export const Heyawake = createVariety({
	pid: "heyawake",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		RBShadeCell: true,
		use: true,
		inputModes: { edit: ['border', 'number', 'clear', 'info-blk'], play: ['shade', 'unshade', 'info-blk'] },

		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) { this.inputcell(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) { this.inputborder(); }
				else if (this.mouseend && this.notInputted()) { this.inputqnum(); }
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
		maxnum: function () {
			const d = this.room.clist.getRectSize();
			let m = d.cols;
			let n = d.rows; if (m > n) { const t = m; m = n; n = t; }
			if (m === 1) { return ((n + 1) >> 1); }
			if (m === 2) { return n; }
			if (m === 3) {
				if (n % 4 === 0) { return (n) / 4 * 5; }
				if (n % 4 === 1) { return (n - 1) / 4 * 5 + 2; }
				if (n % 4 === 2) { return (n - 2) / 4 * 5 + 3; }
				return (n + 1) / 4 * 5;
			}

			if (((Math.log(m + 1) / Math.log(2)) % 1 === 0) && (m === n)) { return (m * n + m + n) / 3; }
			if ((m & 1) && (n & 1)) { return (((m * n + m + n - 1) / 3) | 0); }
			return (((m * n + m + n - 2) / 3) | 0);
		},
		minnum: 0
	},
	Board: {
		hasborder: 1
	},

	AreaUnshadeGraph: {
		enabled: true
	},
	AreaRoomGraph: {
		enabled: true,
		hastop: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "LIGHT",

		enablebcolor: true,
		bgcellcolor_func: "qsub1",

		paint: function () {
			this.drawBGCells();
			this.drawGrid();
			this.drawShadedCells();

			this.drawQuesNumbers();

			this.drawBorders();

			this.drawChassis();

			this.drawBoxBorders(false);

			this.drawTarget();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeBorder();
			this.decodeRoomNumber16();
		},
		encodePzpr: function (type) {
			this.encodeBorder();
			this.encodeRoomNumber16();
		},
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeAreaRoom();
			this.decodeCellQnum();
			this.decodeCellAns();
		},
		encodeData: function () {
			this.encodeAreaRoom();
			this.encodeCellQnum();
			this.encodeCellAns();
		},
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkShadeCellExist",
			"checkAdjacentShadeCell",
			"checkConnectUnshadeRB",
			//"checkFractal@ayeheya",
			"checkShadeCellCount",
			"checkCountinuousUnshadeCell"
		],

		checkFractal: function () {
			const rooms = this.board.roommgr.components;
			allloop:
			for (let r = 0; r < rooms.length; r++) {
				const clist = rooms[r].clist;
				const d = clist.getRectSize();
				const sx = d.x1 + d.x2;
				const sy = d.y1 + d.y2;
				for (let i = 0; i < clist.length; i++) {
					const cell = clist[i];
					const cell2 = this.board.getc(sx - cell.bx, sy - cell.by);
					if (cell.isShade() === cell2.isShade()) { continue; }

					this.failcode.add("bkNotSymShade");
					if (this.checkOnly) { break allloop; }
					clist.seterr(1);
				}
			}
		},

		checkCountinuousUnshadeCell: function () {
			const savedflag = this.checkOnly;
			this.checkOnly = true;	/* エラー判定を一箇所だけにしたい */
			this.checkRowsColsPartly(isBorderCount, function (cell: Cell) { return cell.isShade(); }, "bkUnshadeConsecGt3");
			this.checkOnly = savedflag;
		},

	},

	FailCode: {
		bkUnshadeConsecGt3: ["白マスが3部屋連続で続いています。", "Unshaded cells are continued for three consecutive room."],
		bkNotSymShade: ["部屋の中の黒マスが点対称に配置されていません。", "Position of shaded cells in the room is not point symmetric."]
	}
})

const isBorderCount = (clist: CellList, info: any, bd: Board) => {
	const d = clist.getRectSize();
	let count = 0;
	let bx: number;
	let by: number;
	if (d.x1 === d.x2) {
		bx = d.x1;
		for (by = d.y1 + 1; by <= d.y2 - 1; by += 2) {
			if (bd.getb(bx, by).isBorder()) { count++; }
		}
	}
	else if (d.y1 === d.y2) {
		by = d.y1;
		for (bx = d.x1 + 1; bx <= d.x2 - 1; bx += 2) {
			if (bd.getb(bx, by).isBorder()) { count++; }
		}
	}

	const result = (count <= 1);
	if (!result) { clist.seterr(1); }
	return result;
}

export class Ayeheya extends Heyawake {
	constructor(option?: IConfig) {
		super(option)
		this.pid = "ayeheya"
		this.checker.checklist = [
			"checkShadeCellExist",
			"checkAdjacentShadeCell",
			"checkConnectUnshadeRB",
			"checkFractal",
			"checkShadeCellCount",
			"checkCountinuousUnshadeCell"
		]
		this.checker.makeCheckList()
	}
}