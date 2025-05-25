//
// パズル固有スクリプト部 シロクロリンク版 wblink.js

import { Address } from "../puzzle/Address";
import { IRange } from "../puzzle/BoardExec";
import { createVariety } from "./createVariety";

//
export const Wblink = createVariety({
	pid: "wblink",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['circle-shade', 'circle-unshade', 'undef', 'clear'], play: ['line', 'peke'] },
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

		inputLine: function () {
			const pos = this.getpos(0.10);
			if (this.prevPos.equals(pos)) { return; }

			const border = getlineobj(this.prevPos, pos);
			if (!border.isnull) {
				//@ts-ignore
				const d = border.getlinesize();
				const borders = this.board.borderinside(d.x1, d.y1, d.x2, d.y2);
				//@ts-ignore
				if (this.inputData === null) { this.inputData = (border.isLine() ? 0 : 1); }
				if (this.inputData === 1) { borders.forEach(b => b.setLine()); }
				else if (this.inputData === 0) { borders.forEach(b => b.removeLine()); }
				this.inputData = 2;

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
		enablemake: true,

		keyinput: function (ca) {
			this.key_inputcircle(ca);
		},
		key_inputcircle: function (ca: string) {
			const cell = this.cursor.getc();

			if (ca === '1') { cell.setQnum(cell.qnum !== 1 ? 1 : -1); }
			else if (ca === '2') { cell.setQnum(cell.qnum !== 2 ? 2 : -1); }
			else if (ca === '-') { cell.setQnum(cell.qnum !== -2 ? -2 : -1); }
			else if (ca === '3' || ca === " ") { cell.setQnum(-1); }
			else { return; }

			cell.draw();
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		numberAsObject: true,

		maxnum: 2
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
		cols: 8,
		rows: 8,

		hasborder: 1
	},

	LineGraph: {
		enabled: true,
		makeClist: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		gridcolor_type: "THIN",

		circlefillcolor_func: "qnum2",
		circlestrokecolor_func: "qnum2",

		circleratio: [0.35, 0.30],

		// 線の太さを通常より少し太くする
		lwratio: 8,

		paint: function () {
			this.drawBGCells();
			this.drawGrid(false, (this.puzzle.editmode && !this.outputImage));

			this.drawPekes();
			this.drawLines();

			this.drawCircles();
			this.drawHatenas();

			this.drawTarget();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeCircle();
		},
		encodePzpr: function (type) {
			this.encodeCircle();
		}
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
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkLineExist+",
			"checkCrossLine",
			"checkTripleObject",
			"checkUnshadedCircle",
			"checkShadedCircle",
			"checkNoLineObject+"
		],

		checkUnshadedCircle: function () { this.checkWBcircle(1, "lcInvWhite"); },
		checkShadedCircle: function () { this.checkWBcircle(2, "lcInvBlack"); },
		checkWBcircle: function (val: number, code: string) {
			let result = true, paths = this.board.linegraph.components;
			for (let r = 0; r < paths.length; r++) {
				const clist = paths[r].clist;
				if (clist.length <= 1) { continue; }

				const tip1 = clist[0], tip2 = clist[clist.length - 1];
				if (tip1.qnum !== val || tip2.qnum !== val) { continue; }

				result = false;
				if (this.checkOnly) { break; }
				paths[r].setedgeerr(1);
				paths[r].clist.seterr(1);
				tip1.seterr(1);
				tip2.seterr(1);
			}
			if (!result) {
				this.failcode.add(code);
				this.board.border.setnoerr();
			}
		}
	},

	FailCode: {
		lcTripleNum: ["3つ以上の○が繋がっています。", "Three or more objects are connected."],
		lcInvWhite: ["白丸同士が繋がっています。", "Two white circles are connected."],
		lcInvBlack: ["黒丸同士が繋がっています。", "Two black circles are connected."],
		nmNoLine: ["○から線が出ていません。", "A circle doesn't start any line."]
	}
});

const getlineobj = function (base: Address, pos: Address) {
	if (((pos.bx & 1) === 1 && base.bx === pos.bx && Math.abs(base.by - pos.by) === 1) ||
		((pos.by & 1) === 1 && base.by === pos.by && Math.abs(base.bx - pos.bx) === 1)) { return (base.onborder() ? base : pos).getb(); }
	return base.board.nullobj;
}