//
// パズル固有スクリプト部 快刀乱麻・新・快刀乱麻・ヤギとオオカミ版 kramma.js

import type { WrapperBase } from "../candle";
import { Address } from "../puzzle/Address";
import type { IRange } from "../puzzle/BoardExec";
import type { IDir } from "../puzzle/Piece";
import type { Puzzle } from "../puzzle/Puzzle";
import { createVariety } from "./createVariety";

//
export const Shwolf = createVariety({
	pid: "shwolf",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['goat', 'wolf', 'undef', 'clear', 'crossdot'], play: ['border', 'subline'] },
		mouseinput_other: function () {
			switch (this.inputMode) {
				case 'goat': this.inputFixedNumber(1); break;
				case 'wolf': this.inputFixedNumber(2); break;
			}
		},
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
		hasborder: 1
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
		imgtile: null! as ImageTile,

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();
			this.drawBorders();

			this.drawSheepWolf();

			this.drawCrossMarks()

			this.drawHatenas();

			this.drawBorderQsubs();

			this.drawChassis();

			this.drawTarget();
		},
		initExtraObject: function () {

			/* imgtileの初期設定を追加 */
			this.imgtile = new ImageTile(this.puzzle);
		},

		drawSheepWolf: function () {
			const g = this.vinc('cell_number_image', 'auto');

			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i], keyimg = ['cell', cell.id, 'quesimg'].join('_');
				const rx = (cell.bx - 1) * this.bw, ry = (cell.by - 1) * this.bh;

				this.imgtile.putImage(g, keyimg, (cell.qnum > 0 ? cell.qnum - 1 : null), rx, ry, this.cw, this.ch);
			}
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

			"checkLineChassis",

			"checkNoNumber",
			"checkSameObjectInArea",

			"checkBorderDeadend+",
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
		bdBranch: ["分岐している線があります。", "There is a branch line."],
		bdCurveExBP: ["黒点以外のところで線が曲がっています。", "A line curves out of the points."],
		bdCrossBP: ["黒点上で線が交差しています。", "There is a crossing line on the point."],
		bdIgnoreBP: ["黒点上を線が通過していません。", "A point has no line."],
		bkNoNum: ["ヤギもオオカミもいない領域があります。", "An area has neither sheeps nor wolves."],
		bkPlNum: ["ヤギとオオカミが両方いる領域があります。", "An area has both sheeps and wolves."],
		bdNotChassis: ["外枠につながっていない線があります。", "A line doesn't connect to the chassis."]
	},


});


class ImageTile {
	image_canvas: HTMLImageElement
	image_svg: HTMLImageElement
	cols: number
	rows: number
	cwidth: number
	cheight: number
	loaded: boolean

	constructor(puzzle: Puzzle) {
		if (typeof Image !== 'undefined') {
			this.image_canvas = this.image_svg = new Image();
			this.image_canvas.onload = function () { puzzle.painter.paintAll(); };
		}
		else {
			//@ts-ignore
			this.image_canvas = {}
			// this.image_canvas = (!!puzzle.pzpr.Candle.Canvas ? new puzzle.pzpr.Candle.Canvas.Image() : {});
			//@ts-ignore
			this.image_svg = {}
			// this.image_svg = {};
		}
		this.image_canvas.src = this.image_svg.src = this.imgsrc_dataurl;
		this.image_canvas.height = this.image_svg.height = 64;
		this.image_canvas.width = this.image_svg.width = 128;

		this.cols = 2;
		this.rows = 1;

		this.cwidth = this.image_canvas.width / this.cols;
		this.cheight = this.image_canvas.height / this.rows;
		this.loaded = true;
	}

	imgsrc_dataurl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAABABAMAAAAg+GJMAAAAMFBMVEUAAACtAADv97X/a/f//wD///////////////////////////////////////////81EdaHAAAAEHRSTlP///8A////////////////8M8+MgAAAk5JREFUeJzF10FywyAMBdDvuNmTG2RyAmZ8gS56AG96/6sUAYIPCDduOymbJLb1ImSCFWy/HPgzAC2F9STgW8A/BXg0AIeAPGAyz/ilBbi0AH0E7HQ8GMDlDj73IOBmCwgnChAiGuDyuBPgrEkASws86CJcyMMtCEMKPsQTECKOAGMSiIc7QMoiYwv5PBpgmERMgAGJoNEDveBjAg0Q466fMsKbSw90ZfDpIAF3jZaxSw4VWNLF0BlCj7kCyKlPHqDllwHHU9SsFOjjYw5NvWMKi77RpNYMeM6/Eu18aTglFRjDG0G/eXS2BHgY8SKssxRqAgJ4M4FYya4KXXzKXk7b8UFYFTAEp8A0gQqYKeT8MKtAqkK7GscKCDBPgFMwgHzmYAY1Bes+VGAeH1J4AigJIC3oHbSwFTCW0gCAgetJYIcAlPk1HTsE1grA+DHFfPYDwCmAazPrUn9RnwG2uHcM92IHP5IOgfRUHID4S2sA1J0FDORiWkAZEXAfH2knTK8OJwDkwHd5ffspECLfQ6R7S87tPOB0M19+CJhL8e+Abini5YDvge3lAL4HXP5FOOs2vh4AWqBbCHsHxMXHAM4CQhBQW6YZ0HV10sIsBFD7Ud4099FqLEuH4hZqGxnIW2vYDrsaFiED3HaWKz0DuwFob9j1jBXgIpiAPORdLCafpf8VhyVIl8S7p9vpAHCjeQjgCcCMD+2ay/8SLKA2CrME5Ckf62ADmz4hp3+ycpvQ7TX8vjbTk2Gc5k/+u/h0RTu/g6snQlefk8A4/h/4AjUhvQ8aixc0AAAAAElFTkSuQmCC"

	putImage(ctx: WrapperBase<any>, key: string, n: number, dx: number, dy: number, dw: number, dh: number) {
		const img = (ctx.use.canvas ? this.image_canvas : this.image_svg);
		const sw = this.cwidth, sh = this.cheight;
		const sx = sw * (n % this.cols), sy = sh * ((n / this.cols) | 0);
		if (dw === (void 0)) { dw = sw; dh = sh; }

		ctx.vid = key;
		ctx.drawImage((n !== null ? img : null), sx, sy, sw, sh, dx, dy, dw, dh);
	}
}
