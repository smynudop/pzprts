//
// パズル固有スクリプト部 島国・チョコナ・ストストーン版 shimaguni.js

import { GraphComponent } from "../puzzle/GraphBase";
import { createVariety } from "./createVariety";
import { AreaStoneGraph } from "./stostone";

//
export const Shimaguni = createVariety({
	pid: "shimaguni",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		inputModes: { edit: ['border', 'number', 'clear'], play: ['shade', 'unshade'] },
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
		stone: null! as GraphComponent,
		maxnum: function (): number {
			return Math.min(999, this.room.clist.length);
		}
	},

	Board: {
		hasborder: 1,
		stonegraph: null! as AreaStoneGraph,
		addExtraInfo: function () {
			this.stonegraph = this.addInfoList(AreaStoneGraph);
		}
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
		},
		bcolor: "rgb(191, 191, 255)"
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
		}
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
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkSideAreaShadeCell",
			"checkSeqBlocksInRoom",
			"checkShadeCellCount",
			"checkSideAreaLandSide",
			"checkNoShadeCellInArea"
		],
		checkSideAreaShadeCell: function () {
			this.checkSideAreaCell(function (cell1, cell2) { return (cell1.isShade() && cell2.isShade()); }, true, "cbShade");
		},
		checkSideAreaLandSide: function () {
			this.checkSideAreaSize(this.board.roommgr, function (area) { return area.clist.filter(function (cell) { return cell.isShade(); }).length; }, "bsEqShade");
		},

		// 部屋の中限定で、黒マスがひとつながりかどうか判定する
		checkSeqBlocksInRoom: function () {
			const rooms = this.board.roommgr.components;
			for (let r = 0; r < rooms.length; r++) {
				let clist = rooms[r].clist, stonebase = null, check = true;
				for (let i = 0; i < clist.length; i++) {
					if (clist[i].stone === null) { }
					else if (clist[i].stone !== stonebase) {
						if (stonebase === null) { stonebase = clist[i].stone; }
						else { check = false; break; }
					}
				}
				if (check) { continue; }

				this.failcode.add("bkShadeDivide");
				if (this.checkOnly) { break; }
				clist.seterr(1);
			}
		}
	},

	FailCode: {
		bkShadeNe: ["海域内の数字と国のマス数が一致していません。", "The number of shaded cells is not equals to the number."],
		bkShadeDivide: ["1つの海域に入る国が2つ以上に分裂しています。", "Countries in one marine area are divided to plural ones."],
		bkNoShade: ["黒マスのカタマリがない海域があります。", "A marine area has no shaded cells."],
		cbShade: ["異なる海域にある国どうしが辺を共有しています。", "Countries in other marine area share the side over border line."],
		bsEqShade: ["隣り合う海域にある国の大きさが同じです。", "The size of countries that there are in adjacent marine areas are the same."]
	},
});
