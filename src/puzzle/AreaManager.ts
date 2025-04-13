// AreaManager.js
import { GraphBase, GraphNode } from './GraphBase';
import type { Puzzle } from './Puzzle';
import { CellList } from './PieceList';
import { BoardPiece, type Border, type Cell } from './Piece'
import type { GraphComponent } from "./GraphBase"
import type { IGroup } from './Board';
//--------------------------------------------------------------------------------
// ★AreaGraphBaseクラス セルの部屋情報などを保持するクラス
//   ※このクラスで管理しているroomsは左上からの順番に並ばないので
//     回答チェックやURL出力前には一旦resetRoomNumber()等が必要です。
//--------------------------------------------------------------------------------
export class AreaGraphBase extends GraphBase {
	pointgroup: IGroup = 'cell'
	linkgroup: IGroup | null = null

	override isedgevalidbynodeobj(cell1: Cell, cell2: Cell) {
		return this.isedgevalidbylinkobj(this.puzzle.board.getb(((cell1.bx + cell2.bx) >> 1), ((cell1.by + cell2.by) >> 1)));
	}

	//---------------------------------------------------------------------------
	// areagraph.setEdgeByNodeObj() 黒マスになったりした時にブロックの情報を生成しなおす
	//---------------------------------------------------------------------------
	override setEdgeByNodeObj(nodeobj: Cell) {
		// 一度Edgeを取り外す
		if (this.getObjNodeList(nodeobj).length > 0) {
			this.removeEdgeByNodeObj(nodeobj);
		}

		// Edgeを付け直す
		if (this.calcNodeCount(nodeobj) > 0) {
			this.addEdgeByNodeObj(nodeobj);
		}
	}

	//---------------------------------------------------------------------------
	// areagraph.removeEdgeByNodeObj() 黒マスになったりした時にブロックの情報を消去する
	// areagraph.addEdgeByNodeObj()    黒マスになったりした時にブロックの情報を生成する
	//---------------------------------------------------------------------------
	removeEdgeByNodeObj(cell: Cell) {
		// Edgeの除去
		const sidenodeobj = this.getSideObjByNodeObj(cell);
		const node1 = this.getObjNodeList(cell)[0];
		const preedges = node1.nodes.length;
		const component = node1.component;
		const endetach = (this.modifyNodes.length === 0);
		for (let i = 0; i < sidenodeobj.length; i++) {
			const node2 = this.getObjNodeList(sidenodeobj[i])[0];
			if (!!node1 && !!node2) {
				this.removeEdge(node1, node2);

				if (!!this.incdecBorderCount) {
					this.incdecBorderCount(this.puzzle.board.getb(((node1.obj.bx + node2.obj.bx) >> 1), ((node1.obj.by + node2.obj.by) >> 1)), true);
				}
			}
		}

		// Nodeを一旦取り除く
		if (!!node1) { this.deleteNode(node1); }

		// 周囲のComponent末端から切り離されただけの場合は情報を更新して終了
		if (!this.rebuildmode && preedges === 1 && endetach) {
			this.setComponentInfo(component!);
			this.modifyNodes = [];
		}
	}
	addEdgeByNodeObj(cell: Cell) {
		// Nodeを付加する
		for (let i = 0, len = this.calcNodeCount(cell); i < len; i++) { this.createNode(cell); }

		// Edgeの付加
		const sidenodeobj = this.getSideObjByNodeObj(cell);
		const node1 = this.getObjNodeList(cell)[0];
		const enattach = (this.modifyNodes.length === 0);
		for (let i = 0; i < sidenodeobj.length; i++) {
			if (!this.isedgevalidbynodeobj(cell, sidenodeobj[i])) { continue; }
			const node2 = this.getObjNodeList(sidenodeobj[i])[0];
			if (!!node1 && !!node2) {
				this.addEdge(node1, node2);

				if (!!this.incdecBorderCount) {
					this.incdecBorderCount(this.puzzle.board.getb(((node1.obj.bx + node2.obj.bx) >> 1), ((node1.obj.by + node2.obj.by) >> 1)), false);
				}
			}
		}

		// 周囲のComponentに1か所くっついただけの場合は情報を更新して終了
		if (!this.rebuildmode && node1.nodes.length === 1 && enattach) {
			this.attachNode(node1, node1.nodes[0].component!);
			this.modifyNodes = [];
		}
	}

	//--------------------------------------------------------------------------------
	// areagraph.setExtraData()   指定された領域の拡張データを設定する
	//--------------------------------------------------------------------------------
	override setExtraData(component: GraphComponent) {
		component.clist = new CellList(this.puzzle, component.getnodeobjs());
	}
}

//--------------------------------------------------------------------------------
// ☆AreaShadeGraphクラス  黒マス情報オブジェクトのクラス
// ☆AreaUnshadeGraphクラス  白マス情報オブジェクトのクラス
// ☆AreaNumberGraphクラス 数字情報オブジェクトのクラス
//--------------------------------------------------------------------------------
export class AreaShadeGraph extends AreaGraphBase {
	override relation = { 'cell.qans': 'node' }
	override setComponentRefs(obj: any, component: any) { obj.sblk = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.sblknodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.sblknodes = []; }

	override isnodevalid(cell: Cell) { return cell.isShade(); }

	//--------------------------------------------------------------------------------
	// sblkmgr.setExtraData()   指定された領域の拡張データを設定する
	//--------------------------------------------------------------------------------
	override setExtraData(component: GraphComponent) {
		component.clist = new CellList(this.puzzle, component.getnodeobjs());
		if (this.coloring && !component.color) {
			component.color = this.puzzle.painter.getNewLineColor();
		}
	}

	//--------------------------------------------------------------------------------
	// sblkmgr.repaintNodes() ブロックを再描画する
	//--------------------------------------------------------------------------------
	override repaintNodes(components: GraphComponent[]) {
		const clist_all = new CellList(this.puzzle);
		for (let i = 0; i < components.length; i++) {
			clist_all.extend(components[i].getnodeobjs());
		}
		this.puzzle.painter.repaintBlocks(clist_all);
	}
}

export class AreaUnshadeGraph extends AreaGraphBase {
	override relation = { 'cell.qans': 'node' }
	override setComponentRefs(obj: any, component: GraphComponent) { obj.ublk = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.ublknodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.ublknodes = []; }

	override isnodevalid(cell: Cell) { return cell.isUnshade(); }
}

export class AreaNumberGraph extends AreaGraphBase {
	override relation = { 'cell.qnum': 'node', 'cell.anum': 'node', 'cell.qsub': 'node' }
	override setComponentRefs(obj: any, component: GraphComponent) { obj.nblk = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.nblknodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.nblknodes = []; }

	override isnodevalid(cell: Cell) { return cell.isNumberObj(); }
}

//--------------------------------------------------------------------------------
// ☆AreaRoomGraphクラス 部屋情報オブジェクトのクラス
//--------------------------------------------------------------------------------
export type AreaRoomGraphOption = {
	enabled?: boolean
}

export class AreaRoomGraph extends AreaGraphBase {
	constructor(puzzle: Puzzle, option?: AreaRoomGraphOption) {
		super(puzzle)
		this.enabled = option?.enabled || false
	}

	override relation = { 'cell.ques': 'node', 'border.ques': 'separator', 'border.qans': 'separator' }

	hastop = false

	getComponentRefs(obj: any): GraphComponent { return obj.room; } // getSideAreaInfo用
	override setComponentRefs(obj: any, component: GraphComponent) { obj.room = component; }
	override getObjNodeList(nodeobj: any) { return nodeobj.roomnodes; }
	override resetObjNodeList(nodeobj: any) { nodeobj.roomnodes = []; }

	override isnodevalid(cell: Cell) { return (cell.ques !== 7); }
	override isedgevalidbylinkobj(border: Border) { return !border.isBorder(); }

	//--------------------------------------------------------------------------------
	// roomgraph.rebuild2() 部屋情報の再設定を行う
	//--------------------------------------------------------------------------------
	override rebuild2() {
		super.rebuild2()
		this.resetBorderCount();
	}

	//---------------------------------------------------------------------------
	// roomgraph.resetBorderCount()  初期化時に、lcnt情報を初期化する
	// roomgraph.incdecBorderCount() 線が引かれたり消された時に、lcnt変数を生成し直す
	//---------------------------------------------------------------------------
	resetBorderCount() {
		const bd = this.puzzle.board;
		const borders = bd.border;
		/* 外枠のカウントをあらかじめ足しておく */
		for (let c = 0; c < bd.cross.length; c++) {
			const cross = bd.cross[c];
			const bx = cross.bx;
			const by = cross.by;
			const ischassis = (bd.hasborder === 1 ? (bx === 0 || bx === bd.cols * 2 || by === 0 || by === bd.rows * 2) : false);
			cross.lcnt = (ischassis ? 2 : 0);
		}
		for (let id = 0; id < borders.length; id++) {
			if (!this.isedgevalidbylinkobj(borders[id])) {
				this.incdecBorderCount(borders[id], true);
			}
		}
	}
	override incdecBorderCount(border: Border, isset: boolean) {
		for (let i = 0; i < 2; i++) {
			const cross = border.sidecross[i];
			if (!cross.isnull) {
				if (isset) { cross.lcnt++; } else { cross.lcnt--; }
			}
		}
	}

	//---------------------------------------------------------------------------
	// roommgr.addEdgeBySeparator()    指定されたオブジェクトの場所にEdgeを生成する
	// roommgr.removeEdgeBySeparator() 指定されたオブジェクトの場所からEdgeを除去する
	//---------------------------------------------------------------------------
	override addEdgeBySeparator(border: Border) { // 境界線を消した時の処理
		const sidenodes = this.getSideNodesBySeparator(border);
		if (!sidenodes) { return; }
		this.addEdge(sidenodes[0], sidenodes[1]);
		if (border.sidecross[0].lcnt === 0 || border.sidecross[1].lcnt === 0) {
			this.modifyNodes = [];
		}
		else if (this.hastop && sidenodes.length >= 2) {
			this.setTopOfRoom_combine(sidenodes[0].obj, sidenodes[1].obj);
		}
	}
	override removeEdgeBySeparator(border: Border) { // 境界線を引いた時の処理
		const sidenodes = this.getSideNodesBySeparator(border);
		if (!sidenodes) { return; }
		this.removeEdge(sidenodes[0], sidenodes[1]);
		if (border.sidecross[0].lcnt === 1 || border.sidecross[1].lcnt === 1) {
			this.modifyNodes = [];
		}
	}

	//--------------------------------------------------------------------------------
	// roommgr.setTopOfRoom_combine()  部屋が繋がったとき、部屋のTOPを設定する
	//--------------------------------------------------------------------------------
	setTopOfRoom_combine(cell1: Cell, cell2: Cell) {
		if (!cell1.room || !cell2.room || cell1.room === cell2.room) { return; }
		let merged: Cell;
		let keep: Cell;
		const tcell1 = cell1.room.top;
		const tcell2 = cell2.room.top;
		if (tcell1.bx > tcell2.bx || (tcell1.bx === tcell2.bx && tcell1.by > tcell2.by)) { merged = tcell1; keep = tcell2; }
		else { merged = tcell2; keep = tcell1; }

		// 消える部屋のほうの数字を消す
		if (merged.isNum()) {
			// 数字が消える部屋にしかない場合 -> 残るほうに移動させる
			if (keep.noNum()) {
				keep.setQnum(merged.qnum);
				keep.draw();
			}
			merged.setQnum(-1);
			merged.draw();
		}
	}

	//--------------------------------------------------------------------------------
	// roommgr.setExtraData()   指定された領域の拡張データを設定する
	//--------------------------------------------------------------------------------
	override setExtraData(component: GraphComponent) {
		component.clist = new CellList(this.puzzle, component.getnodeobjs());
		const clist = component.clist;
		if (this.hastop) {
			component.top = clist.getTopCell();

			if (this.rebuildmode) {
				let val = -1;
				const top = component.top;
				for (let i = 0, len = clist.length; i < len; i++) {
					const cell = clist[i];
					if (cell.room === component && cell.qnum !== -1) {
						if (val === -1) { val = cell.qnum; }
						if (top !== cell) { cell.qnum = -1; }
					}
				}
				if (val !== -1 && top.qnum === -1) {
					top.qnum = val;
				}
			}
		}
		if (this.puzzle.validConfig('autocmp')) {
			component.checkAutoCmp();
		}
	}

	//---------------------------------------------------------------------------
	// roommgr.getSideAreaInfo()  接しているが異なる領域部屋の情報を取得する
	//---------------------------------------------------------------------------
	getSideAreaInfo() {
		const sides = [];
		const len = this.components.length;
		const adjs: Record<string, boolean> = {};
		const bd = this.puzzle.board;
		for (let r = 0; r < this.components.length; r++) { this.components[r].id = r; }
		for (let id = 0; id < bd.border.length; id++) {
			const room1 = this.getComponentRefs(bd.border[id].sidecell[0]);
			const room2 = this.getComponentRefs(bd.border[id].sidecell[1]);
			if (room1 === room2 || !room1 || !room2) { continue; }

			const key = (room1.id < room2.id ? room1.id * len + room2.id : room2.id * len + room1.id);
			if (!!adjs[key]) { continue; }
			adjs[key] = true;

			sides.push([room1, room2]);
		}
		return sides;
	}
}