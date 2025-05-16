//
// パズル固有スクリプト部 しろまるくろまる版 yinyang.js

import { AreaGraphBase } from "../puzzle/AreaManager";
import { createVariety } from "./createVariety";

//
export const Yinyang = createVariety({
	pid: "yinyang",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		inputModes: { edit: ['circle-shade', 'circle-unshade', 'clear'], play: ['copycircle', 'circle-shade', 'circle-unshade', 'clear'] },
		mouseinput_other: function () {
			if (this.inputMode === 'copycircle') { this.dragmarks(); }
		},
		mouseinput_auto: function () {
			if (this.mousestart || this.mousemove) {
				this.dragmarks();
			}
			else if (this.mouseend && this.notInputted()) {
				this.mouseCell = this.board.emptycell;	// Reset current mouseCell
				this.inputqnum();
			}
		},

		dragmarks: function () {
			const cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell) { return; }
			if (this.mouseCell.isnull) {
				this.inputData = cell.getNum();
				this.mouseCell = cell;
			}
			else if (cell.getNum() !== this.inputData) {
				cell.setNum(this.inputData);
				this.mouseCell = cell;
				cell.draw();
			}
		}
	},

	//---------------------------------------------------------
	// キーボード入力系
	KeyEvent: {
		enablemake: true,
		enableplay: true
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		numberAsObject: true,
		disInputHatena: true,

		maxnum: 2
	},
	Board: {
		disable_subclear: true,
		yingraph: null! as AreaYinGraph,
		yanggraph: null! as AreaYangGraph,
		addExtraInfo: function () {
			this.yingraph = this.addInfoList(AreaYinGraph);
			this.yanggraph = this.addInfoList(AreaYangGraph);
		}
	},



	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		paint: function () {
			this.drawBGCells();
			this.drawGrid();

			this.drawCircles();

			this.drawChassis();

			this.drawCursor();
		},

		getBGCellColor_error1: function (cell) {
			if (cell.error === 1 || cell.qinfo === 1) { return this.errbcolor1; }
			else if (this.puzzle.execConfig('dispqnumbg') && cell.qnum !== -1) { return "silver"; }
			return null;
		},
		getCircleStrokeColor: function (cell) {
			if (cell.qnum === 1 || cell.anum === 1) {
				if (cell.error === 1) { return this.errcolor1; }
				else if (cell.qnum === 1) { return this.quescolor; }
				else if (cell.trial) { return this.trialcolor; }
				else if (this.puzzle.editmode && !this.puzzle.execConfig('dispqnumbg')) { return "silver"; }
				else { return this.quescolor; }
			}
			return null;
		},
		getCircleFillColor: function (cell) {
			if (cell.qnum === 2 || cell.anum === 2) {
				if (cell.error === 1) { return this.errcolor1; }
				else if (cell.qnum === 2) { return this.quescolor; }
				else if (cell.trial) { return this.trialcolor; }
				else if (this.puzzle.editmode && !this.puzzle.execConfig('dispqnumbg')) { return "silver"; }
				else { return this.quescolor; }
			}
			else if (cell.qnum === 1 && this.puzzle.execConfig('dispqnumbg') && cell.error === 0) {
				return 'white';
			}
			return null;
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
			this.decodeCellAnumsub();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeCellAnumsub();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"check2x2ShadedCircle",
			"check2x2UnshadedCircle",
			"checkConnectShadedCircle",
			"checkConnectUnshadedCircle",
			"checkNoNumCell"
		],

		checkConnectShadedCircle: function () { this.checkOneArea(this.board.yingraph, "msDivide"); },
		checkConnectUnshadedCircle: function () { this.checkOneArea(this.board.yanggraph, "muDivide"); },

		check2x2ShadedCircle: function () {
			this.check2x2Block(function (cell) { return cell.getNum() === 2; }, "ms2x2");
		},
		check2x2UnshadedCircle: function () {
			this.check2x2Block(function (cell) { return cell.getNum() === 1; }, "mu2x2");
		}
	},

	FailCode: {
		ceNoNum: ["まるの入っていないマスがあります。", "There is an empty cell."],
		ms2x2: ["2x2のくろまるのかたまりがあります。", "There is a 2x2 block of shaded circles."],
		mu2x2: ["2x2のしろまるのかたまりがあります。", "There is a 2x2 block of unshaded circles."],
		msDivide: ["タテヨコにつながっていないくろまるがあります。", "Shaded circles are divided."],
		muDivide: ["タテヨコにつながっていないしろまるがあります。", "Unshaded circles are divided."]
	}
});

class AreaYinGraph extends AreaGraphBase {
	override enabled = true
	override relation = { 'cell.qnum': 'node', 'cell.anum': 'node' }
	override setComponentRefs(obj: any, component: any) { obj.yin = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.yinnodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.yinnodes = []; }

	override isnodevalid(cell: any) { return cell.getNum() === 2; }
}

class AreaYangGraph extends AreaGraphBase {
	override enabled = true
	override relation = { 'cell.qnum': 'node', 'cell.anum': 'node' }
	override setComponentRefs(obj: any, component: any) { obj.yang = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.yangnodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.yangnodes = []; }

	override isnodevalid(cell: any) { return cell.getNum() === 1; }
}