//
// パズル固有スクリプト部 快刀乱麻・新・快刀乱麻・ヤギとオオカミ版 kramma.js

import { Address } from "../puzzle/Address";
import type { IRange } from "../puzzle/BoardExec";
import type { IDir } from "../puzzle/Piece";
import { createVariety } from "./createVariety";

//
export const Kramman = createVariety({
	pid: "kramman",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['circle-shade', 'circle-unshade', 'undef', 'clear', 'crossdot'], play: ['border', 'subline'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (this.btn === 'left' && this.isBorderMode()) { this.inputborder(); }
					else { this.inputQsubLine(); }
				}
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart && this.pid !== 'kramma') { this.inputcrossMark(); }
				else if (this.mouseend && this.notInputted()) { this.inputqnum(); }
			}
		},

		// オーバーライド
		inputborder: function () {
			const pos = this.getpos(0.35);
			if (this.prevPos.equals(pos)) { return; }

			const border = this.prevPos.getborderobj(pos);
			if (!border.isnull) {
				if (this.inputData === null) { this.inputData = (border.isBorder() ? 0 : 1); }

				const d = border.getlinesize();
				const borders = this.board.borderinside(d.x1, d.y1, d.x2, d.y2);
				for (let i = 0; i < borders.length; i++) {
					if (this.inputData === 1) { borders[i].setBorder(); }
					else if (this.inputData === 0) { borders[i].removeBorder(); }
				}

				this.puzzle.painter.paintRange(d.x1 - 1, d.y1 - 1, d.x2 + 1, d.y2 + 1);
			}
			this.prevPos = pos;
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
		numberAsObject: true,

		maxnum: 2
	},
	Cross: {
		noNum: function () { return this.id !== null && this.qnum === -1; }
	},

	Border: {
		group: "border",
		getlinesize: function (): IRange {
			const pos1 = this.getaddr(), pos2 = pos1.clone();
			if (this.isVert()) {
				while (pos1.move(0, -1).getx().noNum()) { pos1.move(0, -1); }
				while (pos2.move(0, 1).getx().noNum()) { pos2.move(0, 1); }
			}
			else {
				while (pos1.move(-1, 0).getx().noNum()) { pos1.move(-1, 0); }
				while (pos2.move(1, 0).getx().noNum()) { pos2.move(1, 0); }
			}
			return { x1: pos1.bx, y1: pos1.by, x2: pos2.bx, y2: pos2.by };
		}
	},

	Board: {
		hascross: 1,
		hasborder: 1,
		cols: 8,
		rows: 8
	},

	AreaRoomGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "DLIGHT",

		bordercolor_func: "qans",
		qanscolor: "rgb(64, 64, 255)",

		circlefillcolor_func: "qnum2",
		circlestrokecolor_func: "qnum2",

		crosssize: 0.15,

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();
			this.drawBorders();

			this.drawCircles();

			this.drawCrossMarks();

			this.drawHatenas();

			this.drawBorderQsubs();

			this.drawChassis();

			this.drawTarget();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeCrossMark();
			this.decodeCircle();
		},
		encodePzpr: function (type) {
			this.encodeCrossMark();
			this.encodeCircle();
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnum();
			this.decodeCrossNum();
			this.decodeBorderAns();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeCrossNum();
			this.encodeBorderAns();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkBorderBranch",
			"checkBorderCrossOnBP",
			"checkLcntCurve",

			"checkNoNumber",
			"checkSameObjectInArea",

			"checkBorderDeadend+",
			"checkBorderNoneOnBP"
		],

		checkBorderBranch: function () { this.checkBorderCount(3, 0, "bdBranch"); },
		checkBorderCrossOnBP: function () { this.checkBorderCount(4, 1, "bdCrossBP"); },
		checkBorderNoneOnBP: function () { this.checkBorderCount(0, 1, "bdIgnoreBP"); },

		checkSameObjectInArea: function () {
			this.checkSameObjectInRoom(this.board.roommgr, function (cell) { return cell.getNum(); }, "bkPlNum");
		},

		checkLcntCurve: function () {
			const bd = this.board;
			const crosses = bd.crossinside(bd.minbx + 2, bd.minby + 2, bd.maxbx - 2, bd.maxby - 2);
			for (let c = 0; c < crosses.length; c++) {
				const cross = crosses[c], adb = cross.adjborder;
				if (cross.lcnt !== 2 || cross.qnum === 1) { continue; }
				if ((adb.top.qans === 1 && adb.bottom.qans === 1) ||
					(adb.left.qans === 1 && adb.right.qans === 1)) { continue; }

				this.failcode.add("bdCurveExBP");
				if (this.checkOnly) { break; }
				cross.setCrossBorderError();
			}
		},

		// ヤギとオオカミ用
		checkLineChassis: function () {
			let result = true, bd = this.board;
			const lines: number[] = [];
			for (let id = 0; id < bd.border.length; id++) { lines[id] = bd.border[id].qans; }

			const pos = new Address(this.board.puzzle, 0, 0);
			for (pos.bx = bd.minbx; pos.bx <= bd.maxbx; pos.bx += 2) {
				for (pos.by = bd.minby; pos.by <= bd.maxby; pos.by += 2) {
					/* 盤面端から探索をスタートする */
					if ((pos.bx === bd.minbx || pos.bx === bd.maxbx) !== (pos.by === bd.minby || pos.by === bd.maxby)) {
						if (pos.by === bd.minby) { this.clearLineInfo(lines, pos, 2); }
						else if (pos.by === bd.maxby) { this.clearLineInfo(lines, pos, 1); }
						else if (pos.bx === bd.minbx) { this.clearLineInfo(lines, pos, 4); }
						else if (pos.bx === bd.maxbx) { this.clearLineInfo(lines, pos, 3); }
					}
				}
			}

			for (let id = 0; id < bd.border.length; id++) {
				if (lines[id] !== 1) { continue; }

				result = false;
				if (this.checkOnly) { break; }
				bd.border.filter(function (border) { return lines[border.id] === 1; }).seterr(1);
			}

			if (!result) {
				this.failcode.add("bdNotChassis");
				bd.border.setnoerr();
			}
		},
		clearLineInfo: function (lines: number[], pos: Address, dir: IDir) {
			const stack: [Address, IDir][] = [[pos.clone(), dir]];
			while (stack.length > 0) {
				const dat = stack.pop()!;
				pos = dat[0];
				dir = dat[1];
				while (1) {
					pos.movedir(dir, 1);
					if (pos.oncross()) {
						const cross = pos.getx(), adb = cross.adjborder;
						if (!cross.isnull && cross.qnum === 1) {
							if (adb.top.qans) { stack.push([pos.clone(), 1]); }
							if (adb.bottom.qans) { stack.push([pos.clone(), 2]); }
							if (adb.left.qans) { stack.push([pos.clone(), 3]); }
							if (adb.right.qans) { stack.push([pos.clone(), 4]); }
							break;
						}
					}
					else {
						const border = pos.getb();
						if (border.isnull || lines[border.id] === 0) { break; }
						lines[border.id] = 0;
					}
				}
			}
		}
	},

	FailCode: {
		bkNoNum: ["白丸も黒丸も含まれない領域があります。", "An area has no marks."],
		bkPlNum: ["白丸と黒丸が両方含まれる領域があります。", "An area has both white and black circles."],
		bdBranch: ["分岐している線があります。", "There is a branch line."],
		bdCurveExBP: ["黒点以外のところで線が曲がっています。", "A line curves out of the points."],
		bdCrossBP: ["黒点上で線が交差しています。", "There is a crossing line on the point."],
		bdIgnoreBP: ["黒点上を線が通過していません。", "A point has no line."]
	},
});
