//
// パズル固有スクリプト部 ぬりかべ・ぬりぼう・モチコロ・モチにょろ版 nurikabe.js

import { AreaUnshadeGraph } from "../puzzle/AreaManager";
import { GraphComponentOption } from "../puzzle/GraphBase";
import type { Cell } from "../puzzle/Piece";
import { IConfig, Puzzle } from "../puzzle/Puzzle";
import { createVariety } from "./createVariety";

//
export const Mochikoro = createVariety({
	pid: "mochikoro",
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
		numberRemainsUnshaded: true,
		getdir8clist: function () {
			const list = [];
			const cells = [
				this.relcell(-2, -2), this.relcell(0, -2), this.relcell(2, -2),
				this.relcell(-2, 0), this.relcell(2, 0),
				this.relcell(-2, 2), this.relcell(0, 2), this.relcell(2, 2)
			];
			for (let i = 0; i < 8; i++) {
				if (cells[i].group === "cell" && !cells[i].isnull) { list.push([cells[i], (i + 1)]); } /* i+1==dir */
			}
			return list;
		}
	},
	Board: {
		ublk8mgr: null! as AreaUnshade8Graph,
		addExtraInfo: function () {
			this.ublk8mgr = this.addInfoList(AreaUnshade8Graph);
		}
	},

	AreaShadeGraph: {
		enabled: true
	},
	AreaUnshadeGraph: {
		enabled: true
	},


	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		numbercolor_func: "qnum",
		qanscolor: "black",

		paint: function () {
			this.drawBGCells();
			this.drawShadedCells();
			this.drawGrid();

			this.drawQuesNumbers();

			this.drawChassis();

			this.drawTarget();
		},
		bgcellcolor_func: "qsub1",
		enablebcolor: true
	},
	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeNumber16();
		},
		encodePzpr: function (type) {
			this.encodeNumber16();
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
			"checkShadeCellExist",
			"check2x2ShadeCell",
			"checkConnectUnshaded_mochikoro",
			"checkUnshadeRect",
			"checkDoubleNumberInUnshade",
			"checkNumberAndUnshadeSize",
			//"checkShadeNotRect@mochinyoro"
		],
		checkDoubleNumberInUnshade: function () {
			this.checkAllBlock(this.board.ublkmgr, function (cell) { return cell.isNum(); }, function (w, h, a, n) { return (a < 2); }, "bkNumGe2");
		},
		checkNumberAndUnshadeSize: function () {
			this.checkAllArea(this.board.ublkmgr, function (w, h, a, n) { return (n <= 0 || n === a); }, "bkSizeNe");
		},
		checkConnectUnshaded_mochikoro: function () {
			this.checkOneArea(this.board.ublk8mgr, "csDivide8");
		},
		checkUnshadeRect: function () {
			this.checkAllArea(this.board.ublkmgr, function (w, h, a, n) { return (w * h === a); }, "cuNotRect");
		},
		checkShadeNotRect: function () {
			this.checkAllArea(this.board.sblkmgr, function (w, h, a, n) { return (w * h !== a); }, "csRect");
		}
	},

	FailCode: {
		bkNoNum: ["数字の入っていないシマがあります。", "An area of unshaded cells has no numbers."],
		bkNumGe2: ["1つのシマに2つ以上の数字が入っています。", "An area of unshaded cells has plural numbers."],
		bkSizeNe: ["数字とシマの面積が違います。", "The number is not equal to the number of the size of the area."],
		cuNotRect: ["四角形でない白マスのブロックがあります。", "There is a block of unshaded cells that is not rectangle."],
		csRect: ["四角形になっている黒マスのブロックがあります。", "There is a block of shaded cells that is rectangle."],
		csDivide8: ["孤立した白マスのブロックがあります。", "Unshaded cells are divided."]
	}
});
export class Mochinyoro extends Mochikoro {

	constructor(config?: IConfig) {
		super(config)
		this.pid = "mochinyoro"
		this.checker.checklist = [
			"checkShadeCellExist",
			"check2x2ShadeCell",
			"checkConnectUnshaded_mochikoro",
			"checkUnshadeRect",
			"checkDoubleNumberInUnshade",
			"checkNumberAndUnshadeSize",
			"checkShadeNotRect"
		]
		this.checker.makeCheckList()
	}
}


class AreaUnshade8Graph extends AreaUnshadeGraph {
	override enabled: boolean = true
	constructor(puzzle: Puzzle, gcoption?: GraphComponentOption) {
		super(puzzle, undefined, gcoption)
	}
	override setComponentRefs(obj: any, component: any) { obj.ublk8 = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.ublk8nodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.ublk8nodes = []; }

	override getSideObjByNodeObj(cell: Cell) {
		//@ts-ignore
		const list = cell.getdir8clist(), cells = [];
		for (let i = 0; i < list.length; i++) {
			const cell2 = list[i][0];
			if (this.isnodevalid(cell2)) { cells.push(cell2); }
		}
		return cells;
	}
}
