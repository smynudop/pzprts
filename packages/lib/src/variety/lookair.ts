//
// パズル固有スクリプト部 るっくえあ版 lookair.js

import type { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Lookair = createVariety({
	pid: "lookair",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		inputModes: { edit: ['number', 'clear'], play: ['shade', 'unshade'] },
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) { this.inputcell(); }
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart) { this.inputqnum(); }
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
		maxnum: 5,
		minnum: 0,

		countDir5ShadedCell: function () {
			let cnt = 0, adc = this.adjacent;
			const cells = [this, adc.top, adc.bottom, adc.left, adc.right];
			for (let i = 0; i < 5; i++) {
				if (!cells[i].isnull && cells[i].isShade()) { cnt++; }
			}
			return cnt;
		}
	},

	AreaShadeGraph: {
		enabled: true
	},

	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		enablebcolor: true,
		bgcellcolor_func: "qsub1",

		paint: function () {
			this.drawBGCells();
			this.drawDashedGrid();
			this.drawShadedCells();

			this.drawQuesNumbers();

			this.drawChassis();

			this.drawTarget();
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeNumber10();
		},
		encodePzpr: function (type) {
			this.encodeNumber10();
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellQnum();
			this.decodeCellAns();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeCellAns();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkShadeCellExist+",
			"checkSquareShade",
			"checkLookair",
			"checkDir5ShadeCell+"
		],

		checkDir5ShadeCell: function () {
			const bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c];
				if (!cell.isValidNum() || cell.getNum() === cell.countDir5ShadedCell()) { continue; }

				this.failcode.add("nmShade5Ne");
				if (this.checkOnly) { break; }
				cell.seterr(1);
			}
		},

		checkSquareShade: function () {
			this.checkAllArea(this.board.sblkmgr, function (w, h, a, n) { return (w * h === a && w === h); }, "csNotSquare");
		},
		checkLookair: function () {
			const bd = this.board;
			const subcheck = (base: CellList, bx: number, by: number) => {
				const cell = bd.getc(bx, by);
				if (cell.isnull) { return 1; }	/* break with no error (end of board) */
				else if (!cell.isShade()) { return 0; }	/* continue loop */

				const target = cell.sblk.clist;
				if (base.length === target.length) {
					this.failcode.add("lookairBC");
					if (this.checkOnly) { return 2; }	/* return with error */
					base.seterr(1);
					target.seterr(1);
				}
				return 1;	/* break with no error (reach another shaded block) */
			}

			allloop:
			for (let r = 0; r < bd.sblkmgr.components.length; r++) {
				const base = bd.sblkmgr.components[r].clist, d = base.getRectSize();
				/* 相互に見る必要は無いので、上と左だけ確認する */
				for (let bx = d.x1; bx <= d.x2; bx += 2) {
					for (let by = d.y1 - 2; by >= bd.minby; by -= 2) {
						const ret = subcheck(base, bx, by);
						if (ret === 1) { break; } else if (ret === 2) { break allloop; }
					}
				}

				for (let by = d.y1; by <= d.y2; by += 2) {
					for (let bx = d.x1 - 2; bx >= bd.minbx; bx -= 2) {
						const ret = subcheck(base, bx, by);
						if (ret === 1) { break; } else if (ret === 2) { break allloop; }
					}
				}
			}
		}
	},

	FailCode: {
		nmShade5Ne: ["数字およびその上下左右にある黒マスの数が間違っています。", "the number is not equal to the number of shaded cells in the cell and four adjacent cells."],
		lookairBC: ["同じ大きさの黒マスのカタマリの間に他の黒マスのカタマリがありません。", "A mass of shaded cells can looks other same size mass of shaded cells."]
	}
});
