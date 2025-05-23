//
// パズル固有スクリプト部 碁石ひろい版 goishi.js

import { createVariety } from "./createVariety";

//
export const Goishi = createVariety({
	pid: "goishi",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		mouseinput: function () {
			if (this.puzzle.playmode && this.mousestart) {
				if (this.btn === 'left') { this.inputqans(); }
			}
			else if (this.puzzle.editmode && this.mousestart) {
				this.inputstone();
			}
		},

		inputstone: function () {
			const cell = this.getcell();
			if (cell.isnull) { return; }

			if (cell !== this.cursor.getc()) {
				this.setcursor(cell);
			}
			cell.setStone();
			cell.draw();
		},
		inputqans: function () {
			const cell = this.getcell();
			if (cell.isnull || !cell.isStone() || cell.anum !== -1) { return; }

			let max = 0, bd = this.board, bcell = bd.emptycell;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell2 = bd.cell[c];
				if (cell2.anum > max) {
					max = cell2.anum;
					bcell = cell2;
				}
			}

			// すでに1つ以上の碁石が取られている場合
			if (!bcell.isnull) {
				let tmp: number, d = { x1: cell.bx, y1: cell.by, x2: bcell.bx, y2: bcell.by };

				// 自分の上下左右にmaxな碁石がない場合は何もしない
				if (d.x1 !== d.x2 && d.y1 !== d.y2) { return; }
				else if (d.x1 === d.x2) {
					if (d.y1 > d.y2) { tmp = d.y2; d.y2 = d.y1; d.y1 = tmp; }
					d.y1 += 2; d.y2 -= 2;
				}
				else { // if(d.y1===d.y2)
					if (d.x1 > d.x2) { tmp = d.x2; d.x2 = d.x1; d.x1 = tmp; }
					d.x1 += 2; d.x2 -= 2;
				}
				// 間に碁石がある場合は何もしない
				for (let bx = d.x1; bx <= d.x2; bx += 2) {
					for (let by = d.y1; by <= d.y2; by += 2) {
						const cell2 = bd.getc(bx, by);
						if (!cell2.isnull && cell2.isStone()) {
							if (cell2.anum === -1 || (max >= 2 && cell2.anum === max - 1)) { return; }
						}
					}
				}
			}

			cell.setAnum(max + 1);
			cell.draw();
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,

		keyinput: function (ca) {
			this.key_inputstone(ca);
		},
		key_inputstone: function (ca: string) {
			if (ca === 'q') {
				const cell = this.cursor.getc();
				cell.setStone();
				cell.draw();
			}
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		ques: 7,

		isStone: function (): boolean { return this.ques !== 7; },
		setStone: function () {
			if (this.ques === 7) { this.setQues(0); }
			else if (this.anum === -1) { this.setQues(7); } // 数字のマスは消せません
		}
	},

	Board: {
		disable_subclear: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		errcolor1: "rgb(208, 0, 0)",
		errbcolor1: "rgb(255, 192, 192)",

		paint: function () {
			this.drawCenterLines();

			this.drawCircles();
			this.drawCellSquare();
			this.drawAnsNumbers();

			this.drawTarget();
		},

		drawCenterLines: function () {
			const g = this.vinc('centerline', 'crispEdges', true), bd = this.board;

			let x1 = this.range.x1, y1 = this.range.y1, x2 = this.range.x2, y2 = this.range.y2;
			if (x1 < bd.minbx + 1) { x1 = bd.minbx + 1; } if (x2 > bd.maxbx - 1) { x2 = bd.maxbx - 1; }
			if (y1 < bd.minby + 1) { y1 = bd.minby + 1; } if (y2 > bd.maxby - 1) { y2 = bd.maxby - 1; }
			x1 -= (~x1 & 1); y1 -= (~y1 & 1); x2 += (~x2 & 1); y2 += (~y2 & 1); /* (x1,y1)-(x2,y2)を外側の奇数範囲まで広げる */

			g.lineWidth = 1;
			g.strokeStyle = this.gridcolor;
			for (let i = x1; i <= x2; i += 2) {
				const px = i * this.bw, py1 = y1 * this.bh, py2 = y2 * this.bh;
				g.vid = "cliney_" + i;
				g.strokeLine(px, py1, px, py2);
			}
			for (let i = y1; i <= y2; i += 2) {
				const py = i * this.bh, px1 = x1 * this.bw, px2 = x2 * this.bw;
				g.vid = "clinex_" + i;
				g.strokeLine(px1, py, px2, py);
			}
		},

		getCircleStrokeColor: function (cell): string | null {
			//@ts-ignore
			if (cell.isStone() && cell.anum === -1) {
				return (cell.error === 1 ? this.errcolor1 : this.quescolor);
			}
			return null;
		},
		getCircleFillColor: function (cell): string | null {
			//@ts-ignore
			if (cell.isStone() && cell.anum === -1) {
				return (cell.error === 1 ? this.errbcolor1 : "white");
			}
			return null;
		},

		drawCellSquare: function () {
			const g = this.vinc('cell_number_base', 'crispEdges');

			const rw = this.bw * 0.8 - 2;
			const rh = this.bh * 0.8 - 2;
			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];

				g.vid = "c_sq_" + cell.id;
				if (cell.isStone() && cell.anum !== -1) {
					g.fillStyle = (cell.error === 1 ? this.errbcolor1 : "white");
					g.fillRectCenter(cell.bx * this.bw, cell.by * this.bh, rw, rh);
				}
				else { g.vhide(); }
			}
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeGoishi();
		},
		encodePzpr: function (type) {
			this.encodeGoishi();
		},
		decodeGoishi: function () {
			let bstr = this.outbstr, c = 0, bd = this.board, twi = [16, 8, 4, 2, 1];
			bd.disableInfo();
			let i: number
			for (i = 0; i < bstr.length; i++) {
				const num = Number.parseInt(bstr.charAt(i), 32);
				for (let w = 0; w < 5; w++) {
					if (!!bd.cell[c]) {
						bd.cell[c].setQues(num & twi[w] ? 7 : 0);
						c++;
					}
				}
				if (!bd.cell[c]) { break; }
			}
			bd.enableInfo();
			this.outbstr = bstr.substr(i + 1);
		},
		// エンコード時は、盤面サイズの縮小という特殊処理を行ってます
		encodeGoishi: function () {
			const d = this.getSizeOfBoard_goishi();

			let cm = "", count = 0, pass = 0, twi = [16, 8, 4, 2, 1];
			for (let by = d.y1; by <= d.y2; by += 2) {
				for (let bx = d.x1; bx <= d.x2; bx += 2) {
					const cell = this.board.getc(bx, by);
					if (cell.isnull || !cell.isStone()) { pass += twi[count]; } count++;
					if (count === 5) { cm += pass.toString(32); count = 0; pass = 0; }
				}
			}
			if (count > 0) { cm += pass.toString(32); }
			this.outbstr += cm;

			this.outcols = d.cols;
			this.outrows = d.rows;
		},

		getSizeOfBoard_goishi: function () {
			let x1 = 9999, x2 = -1, y1 = 9999, y2 = -1, count = 0, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (!cell.isStone()) { continue; }
				if (x1 > cell.bx) { x1 = cell.bx; }
				if (x2 < cell.bx) { x2 = cell.bx; }
				if (y1 > cell.by) { y1 = cell.by; }
				if (y2 < cell.by) { y2 = cell.by; }
				count++;
			}
			if (count === 0) { return { x1: 0, y1: 0, x2: 1, y2: 1, cols: 2, rows: 2 }; }
			if (this.puzzle.getConfig('bdpadding')) { return { x1: x1 - 2, y1: y1 - 2, x2: x2 + 2, y2: y2 + 2, cols: (x2 - x1 + 6) / 2, rows: (y2 - y1 + 6) / 2 }; }
			return { x1: x1, y1: y1, x2: x2, y2: y2, cols: (x2 - x1 + 2) / 2, rows: (y2 - y1 + 2) / 2 };
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeGoishiFile();
		},
		encodeData: function () {
			this.encodeGoishiFile();
		},

		decodeGoishiFile: function () {
			this.decodeCell(function (cell, ca) {
				if (ca !== '.') {
					cell.ques = 0;
					if (ca !== '0') { cell.anum = +ca; }
				}
			});
		},
		encodeGoishiFile: function () {
			this.encodeCell(function (cell) {
				if (cell.ques === 0) {
					return (cell.anum !== -1 ? cell.anum + " " : "0 ");
				}
				return ". ";
			});
		},


	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkStoneExist",
			"checkPickedStone"
		],

		checkStoneExist: function () {
			if (!this.allowempty) {
				if (this.board.cell.some(function (cell) { return cell.isStone(); })) { return; }
				this.failcode.add("brNoStone");
			}
		},

		checkPickedStone: function () {
			this.checkAllCell(function (cell) { return (cell.isStone() && cell.anum === -1); }, "goishiRemains");
		}
	},

	FailCode: {
		brNoStone: ["盤面に碁石がありません。", "There are no goishis on the board."],
		goishiRemains: ["拾われていない碁石があります。", "There is remaining Goishi."]
	}
});
