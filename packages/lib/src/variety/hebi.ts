//
// パズル固有スクリプト部 へびいちご版 hebi.js

import type { Address } from "../puzzle/Address";
import { AreaGraphBase } from "../puzzle/AreaManager";
import type { GraphComponent } from "../puzzle/GraphBase";
import { MouseEvent1 } from "../puzzle/MouseInput";
import type { Cell, IDir } from "../puzzle/Piece";
import { CellList } from "../puzzle/PieceList";
import { createVariety } from "./createVariety";

//
export const Hebi = createVariety({
	pid: "hebi",
	//---------------------------------------------------------
	// マウス入力系
	MouseEvent: {
		use: true,
		inputModes: { edit: ['number', 'direc', 'clear'], play: ['number', 'dragnum+', 'dragnum-', 'objblank', 'clear'] },
		mouseinput: function () { // オーバーライド
			if (this.inputMode === 'objblank') {
				this.inputDot_snakes();
			}
			else if (this.inputMode.indexOf('dragnum') === 0) {
				this.dragnumber_snakes();
			}
			else { MouseEvent1.prototype.mouseinput.call(this); }
		},
		mouseinput_auto: function () {
			if (this.puzzle.playmode) {
				if (this.mousestart || this.mousemove) {
					if (!this.inputDot_snakes()) {
						this.dragnumber_snakes();
					}
				}
			}
			else if (this.puzzle.editmode) {
				if (this.mousestart || (this.mousemove && this.notInputted())) {
					this.inputdirec();
				}
			}

			if (this.mouseend && this.notInputted()) {
				this.inputqnum_snakes();
			}
		},

		dragnumber_snakes: function () {
			const cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell) { return; }
			if (this.mouseCell.isnull) {
				if (cell.qnum !== -1) { this.inputData = -3; }
				else if (cell.anum !== -1) { this.inputData = cell.anum; }
				else if (cell.qsub === 1) { this.inputData = -2; }
				else { this.inputData = 10; }
				this.mouseCell = cell;
				return;
			}
			else if (this.inputData === -3) {
				if (cell.qnum !== -1) { }
				else if (cell.anum !== -1) { this.inputData = -2; }
				else if (cell.qsub === 1) { this.inputData = 10; }
				else { this.inputData = -2; }
			}

			if (cell.qnum !== -1) { return; }
			else if (this.inputData >= 1 && this.inputData <= 5) {
				if (this.inputMode === 'dragnum+' || (this.inputMode === 'auto' && this.btn === 'left')) { this.inputData++; }
				else { this.inputData--; }
				if (this.inputData >= 1 && this.inputData <= 5) {
					cell.setQdir(0);
					cell.setAnum(this.inputData);
					cell.setQsub(0);
				}
				else { return; }
			}
			else if (this.inputData === -2) {
				cell.setAnum(-1);
				cell.setQsub(1);
			}
			else if (this.inputData === 10) {
				cell.setAnum(-1);
				cell.setQsub(0);
			}
			else { return; }

			this.mouseCell = cell;
			cell.draw();
		},
		inputDot_snakes: function () {
			if (this.inputMode === 'auto' && (this.btn !== 'right' || (this.inputData !== null && this.inputData >= 0))) { return false; }

			const cell = this.getcell();
			if (cell.isnull || cell === this.mouseCell) { return (this.inputData < 0); }

			if (this.inputData === null) {
				let result = false;
				if (cell.anum === -1) {
					this.inputData = (cell.qsub !== 1 ? -2 : -3);
					result = true;
				}
				if (this.inputMode === 'auto') { return result; }
			}

			cell.setAnum(-1);
			cell.setQsub(this.inputData === -2 ? 1 : 0);
			cell.draw();
			this.mouseCell = cell;
			return true;
		},
		inputqnum_snakes: function () {
			const cell = this.getcell();
			if (!cell.isnull) {
				this.mouseCell = this.board.emptycell;
				this.inputqnum();
			}
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
			if (this.puzzle.editmode && this.key_inputdirec(ca)) { return; }

			if (this.puzzle.playmode && (ca === 'q' || ca === '-')) { ca = 's1'; }
			this.key_inputqnum(ca);
		}
	},

	//---------------------------------------------------------
	// 盤面管理系
	Cell: {
		maxnum: 5,
		snake: null! as GraphComponent,
		minnum: function (): number {
			return (this.puzzle.playmode ? 1 : 0);
		},

		draw: function () {
			if (!this.puzzle.getConfig('snakebd')) {
				this.getaddr().draw();
			}
			else {
				this.puzzle.painter.paintRange(this.bx - 2, this.by - 2, this.bx + 2, this.by + 2);
			}
		}
	},
	Board: {
		hasborder: 1,
		snakemgr: null! as AreaSnakeGraph,
		addExtraInfo: function () {
			this.snakemgr = this.addInfoList(AreaSnakeGraph);
		}
	},
	BoardExec: {
		adjustBoardData: function (key, d) {
			this.adjustNumberArrow(key, d);
		}
	},


	//---------------------------------------------------------
	// 画像表示系
	Graphic: {
		hideHatena: true,

		gridcolor_type: "LIGHT",

		fgcellcolor_func: "qnum",
		fontShadecolor: "white",
		numbercolor_func: "fixed_shaded",

		paint: function () {
			this.drawBGCells();
			this.drawDotCells_hebiichigo();
			this.drawDashedGrid();

			this.drawBorders();

			this.drawQuesCells();
			this.drawArrowNumbers();
			this.drawAnsNumbers();

			this.drawChassis();

			this.drawCursor();
		},

		getBorderColor: function (border): string | null {
			if (!this.puzzle.getConfig('snakebd')) { return null; }

			const cell1 = border.sidecell[0], cell2 = border.sidecell[1];
			if (!cell1.isnull && !cell2.isnull &&
				(cell1.qnum === -1 && cell2.qnum === -1) &&
				(cell1.anum !== -1 || cell2.anum !== -1) &&
				(((cell1.anum === -1) !== (cell2.anum === -1)) || (Math.abs(cell1.anum - cell2.anum) !== 1))) {
				return (((!cell1.trial && cell1.anum !== -1) || (!cell2.trial && cell2.anum !== -1)) ? this.qanscolor : this.trialcolor);
			}
			return null;
		},

		drawDotCells_hebiichigo: function () {
			const g = this.vinc('cell_dot', 'crispEdges', true);

			const dsize = Math.max(this.cw * 0.075, 2);
			const clist = this.range.cells;
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];

				g.vid = "c_dot_" + cell.id;
				if (cell.qsub === 1) {
					g.fillStyle = (!cell.trial ? "rgb(255, 96, 191)" : this.trialcolor);
					g.fillRectCenter(cell.bx * this.bw, cell.by * this.bh, dsize, dsize);
				}
				else { g.vhide(); }
			}
		}
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	Encode: {
		decodePzpr: function (type) {
			this.decodeArrowNumber16();
		},
		encodePzpr: function (type) {
			this.encodeArrowNumber16();
		}
	},
	//---------------------------------------------------------
	FileIO: {
		decodeData: function () {
			this.decodeCellDirecQnum();
			this.decodeCellAnumsub();
		},
		encodeData: function () {
			this.encodeCellDirecQnum();
			this.encodeCellAnumsub();
		}
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	AnsCheck: {
		checklist: [
			"checkNumberExist",
			"checkSnakeSize",
			"checkOtherAnsNumberInRoom",
			"checkSideCell_snakes",
			"checkArrowNumber",
			"checkSnakesView"
		],

		checkSnakeSize: function () {
			this.checkAllArea(this.board.snakemgr, function (w, h, a, n) { return (a === 5); }, "bkSizeNe5");
		},
		checkOtherAnsNumberInRoom: function () {
			this.checkDifferentNumberInRoom_main(this.board.snakemgr, this.isDifferentAnsNumberInClist);
		},

		checkSideCell_snakes: function () {
			let result = true, bd = this.board;
			for (let c = 0; c < bd.cell.length; c++) {
				let cell = bd.cell[c], errcell = null, cell2 = cell.adjacent.right, cell3 = cell.adjacent.bottom;
				if (!cell.snake) { continue; }
				if (!cell2.isnull && !!cell2.snake && cell.snake !== cell2.snake) { errcell = cell2; }
				else if (!cell3.isnull && !!cell3.snake && cell.snake !== cell3.snake) { errcell = cell3; }
				if (!!errcell) {
					result = false;
					if (this.checkOnly) { break; }
					cell.snake.clist.seterr(1);
					errcell.snake.clist.seterr(1);
				}
			}
			if (!result) { this.failcode.add("bsSnake"); }
		},

		checkArrowNumber: function () {
			let result = true, bd = this.board;
			let cell2: Cell = this.board.emptycell, pos: Address;
			function gonext() {
				cell2 = pos.getc();
				return (!cell2.isnull && cell2.qnum === -1 && cell2.anum === -1);
			}
			function noans(cell2: Cell) {
				return (cell2.isnull || cell2.qnum !== -1 || cell2.anum === -1);
			}

			for (let c = 0; c < bd.cell.length; c++) {
				const cell = bd.cell[c], num = cell.qnum, dir = cell.qdir;
				if (num < 0 || dir === 0) { continue; }

				pos = cell.getaddr();
				pos.movedir(dir, 2);
				while (gonext()) { pos.movedir(dir, 2); }
				// cell2は数字のあるマスのIDか、null(盤面外)を指す

				// 矢印つき数字が0で、その先に回答の数字がある
				if (num === 0 && !noans(cell2)) {
					result = false;
					if (this.checkOnly) { break; }
					cell.seterr(1);
					if (num <= 0) { cell2.seterr(1); }
				}
				// 矢印つき数字が1以上で、その先に回答の数字がない or 回答の数字が違う
				else if (num > 0 && (noans(cell2) || cell2.anum !== num)) {
					result = false;
					if (this.checkOnly) { break; }
					cell.seterr(1);
					cell2.seterr(1);
				}
			}
			if (!result) { this.failcode.add("anNumberNe"); }
		},
		checkSnakesView: function () {
			const snakes = this.board.snakemgr.components;
			for (let r = 0; r < snakes.length; r++) {
				const clist = snakes[r].clist;
				let cell = clist.filter(function (cell) { return (cell.anum === 1); })[0];
				if (!cell) { continue; }

				let cell2: Cell, dir: IDir | 0 = cell.NDIR, adc = cell.adjacent;
				cell2 = adc.bottom; if (!cell2.isnull && cell2.anum === 2) { dir = cell.UP; }
				cell2 = adc.top; if (!cell2.isnull && cell2.anum === 2) { dir = cell.DN; }
				cell2 = adc.right; if (!cell2.isnull && cell2.anum === 2) { dir = cell.LT; }
				cell2 = adc.left; if (!cell2.isnull && cell2.anum === 2) { dir = cell.RT; }
				if (dir === cell.NDIR) { continue; }

				const pos = cell.getaddr(), clist2 = new CellList();
				clist2.add(cell);
				while (!cell.isnull) {
					pos.movedir(dir, 2);
					cell = pos.getc() as any;

					if (!cell.isnull) { clist2.add(cell); }
					if (cell.isnull || cell.qnum !== -1 || cell.anum !== -1) { break; }
				}
				// cellは数字のあるマスか、null(盤面外)を指す

				if (cell.isnull || cell.anum <= 0 || cell.qnum !== -1 || cell.snake === null || cell.snake === snakes[r]) { continue; }

				this.failcode.add("snakeAttack");
				if (this.checkOnly) { break; }
				clist2.seterr(1);
				clist.seterr(1);
				cell.snake.clist.seterr(1);
			}
		}
	},

	FailCode: {
		bkDupNum: ["同じ数字が入っています。", "A Snake has same plural marks."],
		bkSizeNe5: ["大きさが５ではない蛇がいます。", "The size of a snake is not five."],
		bsSnake: ["別々の蛇が接しています。", "Other snakes are adjacent."],
		anNumberNe: ["矢印の先にある数字が正しくありません。", "There is a wrong number which is in front of the arrowed number."],
		snakeAttack: ["蛇の視線の先に別の蛇がいます。", "A snake can see another snake."]
	}
});

type SnakeGrpahComponent = GraphComponent<Cell & { snake: GraphComponent }>
class AreaSnakeGraph extends AreaGraphBase<SnakeGrpahComponent> {
	override enabled = true
	override relation = { 'cell.anum': 'node' }
	override setComponentRefs(obj: any, component: any) { obj.snake = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.snakenodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.snakenodes = []; }

	override isnodevalid(cell: Cell) { return (cell.anum > 0); }
	override isedgevalidbynodeobj(cell1: Cell, cell2: Cell) {
		return ((cell1.anum === -1) === (cell2.anum === -1)) && (Math.abs(cell1.anum - cell2.anum) === 1);
	}
}
