//
// パズル固有スクリプト部 遠い誓い版 toichika.js

import type { Cell } from "../puzzle/Piece";
import { createVariety } from "./createVariety";

//
export const Toichika = createVariety({
	pid: "toichika",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['border', 'arrow', 'clear'], play: ['arrow', 'objblank', 'clear'] },
		mouseinput_other: function () {
			if (this.inputMode === 'objblank') { this.inputDot(); }
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === 'left') { this.inputarrow_cell(); }
					else if (this.btn === 'right') { this.inputDot(); }
				}
				else if (this.mouseend && this.notInputted()) { this.inputqnum(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || this.mousemove) {
					if (this.isBorderMode()) { this.inputborder(); }
					else { this.inputarrow_cell(); }
				}
				else if (this.mouseend && this.notInputted()) { this.inputqnum(); }
			}
		},

		inputDot: function () {
			const cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell || cell.qnum !== -1) { return; }

			if (this.inputData === null) { this.inputData = (cell.qsub === 1 ? 0 : 1); }

			cell.setAnum(-1);
			cell.setQsub(this.inputData === 1 ? 1 : 0);
			this.mouseCell = cell;
			cell.draw();
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		enableplay: true,
		moveTarget: function (ca): boolean {
			if (ca.match(/shift/)) { return false; }
			return this.moveTCell(ca);
		},

		keyinput: function (ca) {
			this.key_toichika(ca);
		},
		key_toichika: function (ca: string) {
			if (ca === '1' || ca === 'w' || ca === 'shift+up') { ca = '1'; }
			else if (ca === '2' || ca === 's' || ca === 'shift+right') { ca = '4'; }
			else if (ca === '3' || ca === 'z' || ca === 'shift+down') { ca = '2'; }
			else if (ca === '4' || ca === 'a' || ca === 'shift+left') { ca = '3'; }
			else if (ca === '5' || ca === 'q' || ca === '-') { ca = 's1'; }
			else if (ca === '6' || ca === 'e' || ca === ' ') { ca = ' '; }
			this.key_inputqnum(ca);
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		numberAsObject: true,

		maxnum: 4,
		posthook: {
			qnum: function (this: Cell, num) { this.room.checkAutoCmp(); },
			anum: function (this: Cell, num) { this.room.checkAutoCmp(); }
		}
	},
	Board: {
		hasborder: 1
	},

	BoardExec: {
		adjustBoardData: function (key, d) {
			this.adjustCellArrow(key, d);
		}
	},

	AreaRoomGraph: {
		enabled: true,

		// IDだけ必要
		getSideAreaKeys: function (): SideAreaInfo {
			const len = this.components.length, adjs: SideAreaInfo = { len: len }, bd = this.board;
			for (let r = 0; r < len; r++) { this.components[r].id = r; }
			for (let id = 0; id < bd.border.length; id++) {
				const cell1 = bd.border[id].sidecell[0], cell2 = bd.border[id].sidecell[1];
				if (cell1.isnull || cell2.isnull) { continue; }
				const room1 = cell1.room, room2 = cell2.room;
				if (room1 === room2 || room1 === null || room2 === null) { continue; }

				const key = (room1.id < room2.id ? room1.id * len + room2.id : room2.id * len + room1.id);
				if (!!adjs[key]) { continue; }
				adjs[key] = true;
			}
			return adjs;
		}
	},
	GraphComponent: {
		checkCmp: function () {
			return (this.clist.filter(function (cell) { return cell.isNum(); }).length === 1);
		}
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "LIGHT",

		autocmp: 'room',

		bgcellcolor_func: "qcmp",

		paint: function () {
			this.drawBGCells();
			this.drawGrid();
			this.drawBorders();

			this.drawDotCells();
			this.drawCellArrows();
			this.drawHatenas();

			this.drawChassis();

			this.drawCursor();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeBorder();
			this.decode4Cell_toichika();
		},
		encodePzpr: function (type) {
			this.encodeBorder();
			this.encode4Cell_toichika();
		},

		decode4Cell_toichika: function () {
			let c = 0, i = 0, bstr = this.outbstr, bd = this.board;
			for (i = 0; i < bstr.length; i++) {
				const cell = bd.cell[c], ca = bstr.charAt(i);

				if (this.include(ca, "1", "4")) { cell.qnum = Number.parseInt(bstr.substr(i, 1), 10); }
				else if (ca === '.') { cell.qnum = -2; }
				else { c += (Number.parseInt(ca, 36) - 5); }

				c++;
				if (!bd.cell[c]) { break; }
			}
			this.outbstr = bstr.substr(i);
		},
		encode4Cell_toichika: function () {
			let cm = "", count = 0, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				let pstr = "", val = bd.cell[c].qnum;

				if (val === -2) { pstr = "."; }
				else if (val >= 1 && val <= 4) { pstr = val.toString(10); }
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
		decodeData: function () {
			this.decodeAreaRoom();
			this.decodeCellQnum();
			this.decodeCellAnumsub();
		},
		encodeData: function () {
			this.encodeAreaRoom();
			this.encodeCellQnum();
			this.encodeCellAnumsub();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		_info: {} as { num?: any, parrow?: Cell[][] },
		checklist: [
			"checkDoubleNumber",
			"checkAdjacentCountries",
			"checkDirectionOfArrow",
			"checkNoNumber"
		],

		checkDirectionOfArrow: function () {
			const ainfo = this.getPairArrowsInfo();
			for (let i = 0; i < ainfo.length; i++) {
				if (ainfo[i].length !== 1) { continue; }

				this.failcode.add("arAlone");
				if (this.checkOnly) { break; }
				ainfo[i][0].seterr(1);
			}
		},
		checkAdjacentCountries: function () {
			//@ts-ignore
			const adjs: SideAreaInfo = this.board.roommgr.getSideAreaKeys(), len = adjs.len;
			const ainfo = this.getPairArrowsInfo();
			for (let i = 0; i < ainfo.length; i++) {
				if (ainfo[i].length === 1) { continue; }
				const room1 = ainfo[i][0].room, room2 = ainfo[i][1].room;
				const key = (room1.id < room2.id ? room1.id * len + room2.id : room2.id * len + room1.id);
				if (!adjs[key]) { continue; }

				this.failcode.add("arAdjPair");
				if (this.checkOnly) { break; }
				room1.clist.seterr(1);
				room2.clist.seterr(1);
			}
		},

		getPairArrowsInfo: function (): Cell[][] {
			if (this._info.parrow) { return this._info.parrow; }
			const ainfo: Cell[][] = [], isarrow = [], bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) { isarrow[c] = bd.cell[c].isNum(); }
			for (let c = 0; c < bd.cell.length; c++) {
				const cell0 = bd.cell[c];
				if (cell0.noNum()) { continue; }
				const pos = cell0.getaddr(), dir = cell0.getNum();

				while (1) {
					pos.movedir(dir, 2);
					const cell = pos.getc();
					if (cell.isnull) { ainfo.push([cell0]); break; }
					if (!!isarrow[cell.id]) {
						if (cell.getNum() !== [0, cell.DN, cell.UP, cell.RT, cell.LT][dir]) { ainfo.push([cell0]); }
						else { ainfo.push([cell, cell0]); }
						break;
					}
				}
			}
			this._info.parrow = ainfo
			return ainfo;
		}
	},

	FailCode: {
		bkNoNum: ["国に矢印が入っていません。", "A country has no arrow."],
		bkNumGe2: ["1つの国に2つ以上の矢印が入っています。", "A country has plural arrows."],
		arAdjPair: ["辺を共有する国にペアとなる矢印が入っています。", "There are paired arrows in adjacent countries."],
		arAlone: ["矢印の先にペアとなる矢印がいません。", "There is not paired arrow in the direction of an arrow."]
	}
});

type SideAreaInfo = { len: number, [key: number]: boolean }
/*
	CellList: {
		checkCmp: function () {
			return (this.filter(function (cell) { return cell.isNum(); }).length === 1);
		}
	},
	*/