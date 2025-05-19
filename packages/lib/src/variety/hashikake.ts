//
// パズル固有スクリプト部 橋をかけろ版 hashikake.js

import type { Address } from "../puzzle/Address";
import type { IRange } from "../puzzle/BoardExec";
import { MouseEvent1 } from "../puzzle/MouseInput";
import type { Border } from "../puzzle/Piece";
import { BorderList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Hashikake = createVariety({
	pid: "hashikake",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['number', 'clear'], play: ['line', 'peke'] },
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
				if (this.mousestart) { this.inputqnum(); }
			}
		},

		prevblist: null! as any[],
		mousereset: function () {
			MouseEvent1.prototype.mousereset.call(this);
			this.prevblist = new BorderList();
		},

		inputLine: function () {
			const pos = this.getpos(0.20);
			if (this.prevPos.equals(pos)) { return; }

			const border = getlineobj(this.prevPos, pos);
			if (!border.isnull) {
				const dir = this.prevPos.getdir(pos, 1);
				//@ts-ignore
				const d = border.getlinesize();
				const borders = this.board.borderinside(d.x1, d.y1, d.x2, d.y2);

				if (this.prevblist.length === 0 || !this.prevblist.includes(border)) { this.inputData = null; }

				if (this.inputData === null) { this.inputData = [1, 2, 0][border.line]; }
				if (this.inputData > 0 && (dir === border.UP || dir === border.LT)) { borders.reverse(); } // 色分けの都合上の処理
				borders.forEach(b => b.setLineVal(this.inputData));
				borders.forEach(b => b.setQsub(0));
				this.prevblist = borders;

				this.puzzle.painter.paintRange(d.x1 - 1, d.y1 - 1, d.x2 + 1, d.y2 + 1);
			}
			this.prevPos = pos;
		},

		inputpeke: function () {
			const pos = this.getpos(0.22);
			if (this.btn === 'right' && this.prevPos.equals(pos)) { return; }

			const border = pos.getb();
			if (border.isnull) { return; }

			if (this.inputData === null) { this.inputData = (border.qsub !== 2 ? 2 : 0); }
			border.setQsub(this.inputData);

			const d = border.getlinesize();
			this.board.borderinside(d.x1, d.y1, d.x2, d.y2).forEach(b => b.setLineVal(0));
			this.prevPos = pos;

			this.puzzle.painter.paintRange(d.x1 - 1, d.y1 - 1, d.x2 + 1, d.y2 + 1);
			border.draw();
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
		maxnum: 8,

		getCountOfBridges: function (): number {
			let cnt = 0, cblist = this.getdir4cblist();
			for (let i = 0; i < cblist.length; i++) {
				const border = cblist[i][1];
				if (!border.isnull && border.line > 0) { cnt += border.line; }
			}
			return cnt;
		},

		isCmp: function (): boolean { // 描画用
			return this.puzzle.execConfig('autocmp') && (this.qnum === this.getCountOfBridges());
		},

		// pencilbox互換関数 ここではファイル入出力用
		getState: function (): number {
			if (this.qnum !== -1) { return 0; }
			const uborder = this.adjborder.top, lborder = this.adjborder.left;
			const datah = (!uborder.isnull ? uborder.line : 0);
			const dataw = (!lborder.isnull ? lborder.line : 0);
			return (datah > 0 ? datah : 0) + (dataw > 0 ? (dataw << 2) : 0);
		},
		setState: function (val: number) {
			if (val === 0) { return; }
			const adb = this.adjborder;
			const datah = (val & 3);
			if (datah > 0) {
				const uborder = adb.top, dborder = adb.bottom;
				if (!uborder.isnull) { uborder.line = datah; }
				if (!dborder.isnull) { dborder.line = datah; }
			}
			const dataw = ((val & 12) >> 2);
			if (dataw > 0) {
				const lborder = adb.left, rborder = adb.right;
				if (!lborder.isnull) { lborder.line = dataw; }
				if (!rborder.isnull) { rborder.line = dataw; }
			}
		}
	},
	Border: {
		group: "border",
		getlinesize: function (): IRange {
			const pos1 = this.getaddr(), pos2 = pos1.clone();
			if (this.isVert()) {
				while (pos1.move(-1, 0).getc().noNum()) { pos1.move(-1, 0); }
				while (pos2.move(1, 0).getc().noNum()) { pos2.move(1, 0); }
			}
			else {
				while (pos1.move(0, -1).getc().noNum()) { pos1.move(0, -1); }
				while (pos2.move(0, 1).getc().noNum()) { pos2.move(0, 1); }
			}
			if (pos1.getc().isnull || pos2.getc().isnull) { return { x1: -1, y1: -1, x2: -1, y2: -1 }; }
			return { x1: pos1.bx, y1: pos1.by, x2: pos2.bx, y2: pos2.by };
		}
	},
	Board: {
		cols: 9,
		rows: 9,

		hasborder: 1
	},

	LineGraph: {
		enabled: true,
		isLineCross: true,
		makeClist: true,

		iscrossing: function (cell) { return cell.noNum(); }
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		hideHatena: true,

		autocmp: "number",
		irowake: true,

		gridcolor_type: "THIN",

		circleratio: [0.47, 0.42],

		circlefillcolor_func: "qcmp",
		numbercolor_func: "qnum",

		// 線の太さを通常より少し太くする
		lwratio: 8,

		paint: function () {
			this.drawGrid(false, (this.puzzle.editmode && !this.outputImage));

			this.drawPekes();
			this.drawLines_hashikake();

			this.drawCircledNumbers();

			this.drawTarget();
		},

		// オーバーライド
		drawLines_hashikake: function () {
			const g = this.vinc('line', 'crispEdges');

			// LineWidth, LineSpace
			const lw = this.lw, ls = lw * 1.5;

			const blist = this.range.borders;
			for (let i = 0; i < blist.length; i++) {
				const border = blist[i], color = this.getLineColor(border);
				const isvert = border.isVert();
				const px = border.bx * this.bw, py = border.by * this.bh;
				const lm = this.lm + this.addlw / 2; // LineMargin

				g.fillStyle = color;
				g.vid = "b_line_" + border.id;
				if (!!color && border.line === 1) {
					if (!isvert) { g.fillRectCenter(px, py, lm, this.bh + lm); }
					else { g.fillRectCenter(px, py, this.bw + lm, lm); }
				}
				else { g.vhide(); }

				g.vid = "b_dline_" + border.id;
				if (!!color && border.line === 2) {
					g.beginPath();
					if (!isvert) {
						g.rectcenter(px - ls, py, lm, this.bh + lm);
						g.rectcenter(px + ls, py, lm, this.bh + lm);
					}
					else {
						g.rectcenter(px, py - ls, this.bw + lm, lm);
						g.rectcenter(px, py + ls, this.bw + lm, lm);
					}
					g.fill();
				}
				else { g.vhide(); }
			}
		},

		repaintLines: function (blist) {
			this.range.borders = blist as any;
			this.drawLines_hashikake();

			if (this.context.use.canvas) { this.repaintParts(blist); }
		},
		repaintParts: function (blist) {
			this.range.cells = blist.cellinside() as any;

			this.drawCircledNumbers();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeNumber16();
		},
		encodePzpr: function (type) {
			this.encodeNumber16();
		},

	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnum();
			this.decodeBorderLine();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeBorderLine();
		},
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkLineExist+",
			"checkCrossConnectLine",
			"checkCellNumberNotOver",
			"checkConnectAllNumber",
			"checkCellNumberNotLess"
		],

		checkCellNumberNotOver: function () {
			this.checkAllCell(function (cell) { return cell.isValidNum() && (cell.qnum < cell.getCountOfBridges()); }, "nmLineGt");
		},
		checkCellNumberNotLess: function () {
			this.checkAllCell(function (cell) { return cell.isValidNum() && (cell.qnum > cell.getCountOfBridges()); }, "nmLineLt");
		}
	},

	FailCode: {
		nmLineGt: ["数字につながる橋の数が違います。", "The number of connecting bridges to a number is not correct."],
		nmLineLt: ["数字につながる橋の数が違います。", "The number of connecting bridges to a number is not correct."]
	}
});


const getlineobj = function (base: Address, pos: Address): Border {
	if (((pos.bx & 1) === 1 && base.bx === pos.bx && Math.abs(base.by - pos.by) === 1) ||
		((pos.by & 1) === 1 && base.by === pos.by && Math.abs(base.bx - pos.bx) === 1)) { return (base.onborder() ? base : pos).getb(); }
	return base.board.emptyborder;
}
