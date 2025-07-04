// LineManager.js
import { GraphBase, type GraphComponentOption, type GraphComponent } from "./GraphBase";
import { CellList, BorderList } from "./PieceList";
import type { Puzzle } from "./Puzzle";
import type { Border, Cell } from "./Piece";
import type { IGroup } from "./Board";

export type LineGraphOption = Partial<LineGraph>

//---------------------------------------------------------------------------
// ★LineGraphクラス 主に線や色分けの情報を管理する
//---------------------------------------------------------------------------
export class LineGraph extends GraphBase {
	constructor(puzzle: Puzzle, option?: LineGraphOption, gcoption?: GraphComponentOption) {
		super(puzzle, gcoption);
		Object.assign(this, option)

		if (this.moveline) { this.relation['cell.qnum'] = 'move'; }
	}

	override enabled = false
	override relation: Record<string, string> = { 'border.line': 'link' }

	pointgroup: 'cell' | "cross" = 'cell'
	linkgroup: IGroup = 'border'

	isLineCross = false	// 線が交差するパズル

	makeClist = false		// 線が存在するclistを生成する
	moveline = false		// 丸数字などを動かすパズル

	override coloring = true
	ltotal: any[] = []

	//--------------------------------------------------------------------------------
	// linegraph.setComponentRefs()    objにcomponentの設定を行う (性能対策)
	// linegraph.isedgeexistsbylinkobj() linkobjにedgeが存在するか判定する
	// 
	// linegraph.getObjNodeList()      objにあるnodeを取得する
	// linegraph.resetObjNodeList()    objからnodeをクリアする
	//--------------------------------------------------------------------------------
	override setComponentRefs(obj: any, component: GraphComponent | null) { obj.path = component; }
	override isedgeexistsbylinkobj(linkobj: any) { return linkobj.path !== null; }

	override getObjNodeList(nodeobj: any) { return nodeobj.pathnodes; }
	override resetObjNodeList(nodeobj: any) {
		nodeobj.pathnodes = [];
		if (this.moveline) { this.resetExtraData(nodeobj); }
	}

	//--------------------------------------------------------------------------------
	// linegraph.isnodevalid()           そのセルにNodeが存在すべきかどうか返す
	// linegraph.isedgevalidbylinkobj()  そのborderにEdgeが存在すべきかどうか返す
	// linegraph.iscrossing()            そのセルで交差するかどうか返す
	//--------------------------------------------------------------------------------
	override isnodevalid(cell: Cell) { return cell.lcnt > 0 || (this.moveline && cell.isNum()); }
	override isedgevalidbylinkobj(border: Border) { return border.isLine(); }
	iscrossing(cell: Cell) { return this.isLineCross; }

	//---------------------------------------------------------------------------
	// linegraph.rebuild()  既存の情報からデータを再設定する
	// linegraph.rebuild2() 継承先に固有のデータを設定する
	//---------------------------------------------------------------------------
	override rebuild() {
		if (this.puzzle.board.borderAsLine) { this.pointgroup = 'cross'; }
		super.rebuild()
	}
	override rebuild2() {
		if (!!this.incdecLineCount) {
			this.resetLineCount();
		}
		super.rebuild2();
	}

	//---------------------------------------------------------------------------
	// linegraph.resetLineCount()  初期化時に、lcnt情報を初期化する
	// linegraph.incdecLineCount() 線が引かれたり消された時に、lcnt変数を生成し直す
	//---------------------------------------------------------------------------
	resetLineCount() {
		const cells = this.puzzle.board[this.pointgroup];
		//@ts-ignore
		const borders = this.puzzle.board[this.linkgroup];
		this.ltotal = [cells.length];
		for (let c = 0; c < cells.length; c++) {
			cells[c].lcnt = 0;
		}
		for (let id = 0; id < borders.length; id++) {
			//@ts-ignore
			if (this.isedgevalidbylinkobj(borders[id])) {
				//@ts-ignore
				this.incdecLineCount(borders[id], true);
			}
		}
	}
	incdecLineCount(border: Border, isset: boolean) {
		if (border.group !== this.linkgroup) { return; }
		for (let i = 0; i < 2; i++) {
			const cell = border.sideobj[i];
			if (!cell.isnull) {
				this.ltotal[cell.lcnt]--;
				if (isset) { cell.lcnt++; } else { cell.lcnt--; }
				this.ltotal[cell.lcnt] = (this.ltotal[cell.lcnt] || 0) + 1;
			}
		}
	}

	//---------------------------------------------------------------------------
	// linegraph.setEdgeByLinkObj() 線が引かれたり消された時に、lcnt変数や線の情報を生成しなおす
	//---------------------------------------------------------------------------
	override setEdgeByLinkObj(linkobj: Border) {
		const isset = this.isedgevalidbylinkobj(linkobj);
		if (isset === this.isedgeexistsbylinkobj(linkobj)) { return; }

		if (!!this.incdecLineCount) {
			this.incdecLineCount(linkobj, isset);
		}

		if (isset) { this.addEdgeByLinkObj(linkobj); }
		else { this.removeEdgeByLinkObj(linkobj); }
	}

	//---------------------------------------------------------------------------
	// graph.addEdgeByLinkObj()    指定されたオブジェクトの場所にEdgeを生成する
	// graph.removeEdgeByLinkObj() 指定されたオブジェクトの場所からEdgeを除去する
	//---------------------------------------------------------------------------
	override addEdgeByLinkObj(linkobj: any) { // 線(など)を引いた時の処理
		const enattach = (this.modifyNodes.length === 0);
		const sidenodeobj = this.getSideObjByLinkObj(linkobj);

		// 周囲のNodeをグラフに追加するかどうか確認する
		this.createNodeIfEmpty(sidenodeobj[0]);
		this.createNodeIfEmpty(sidenodeobj[1]);

		// linkするNodeを取得する
		const sidenodes = this.getSideNodesByLinkObj(linkobj);

		// 周囲のNodeとlink
		this.addEdge(sidenodes[0], sidenodes[1]);

		// 周囲のComponentにくっついただけの場合は情報を更新して終了
		if (this.rebuildmode || !enattach) { return; }
		let attachnodes = null;
		const node1 = sidenodes[0];
		const node2 = sidenodes[1];
		const lcnt1 = node1.obj.lcnt;
		const lcnt2 = node2.obj.lcnt;
		if (lcnt1 === 1 && (lcnt2 === 2 || (!this.isLineCross && lcnt2 > 2)) && node1.component === null && node2.component !== null) { attachnodes = [sidenodes[0], sidenodes[1]]; }
		else if (lcnt2 === 1 && (lcnt1 === 2 || (!this.isLineCross && lcnt1 > 2)) && node2.component === null && node1.component !== null) { attachnodes = [sidenodes[1], sidenodes[0]]; }
		if (!!attachnodes) {
			this.attachNode(attachnodes[0], attachnodes[1].component!);
			this.modifyNodes = [];
		}
	}
	removeEdgeByLinkObj(linkobj: any) { // 線(など)を消した時の処理
		// unlinkするNodeを取得する
		const endetach = (this.modifyNodes.length === 0);
		const sidenodes = this.getSideNodesByLinkObj(linkobj);

		// 周囲のNodeとunlink
		this.removeEdge(sidenodes[0], sidenodes[1]);

		// 周囲のNodeをグラフから取り除くかどうか確認する
		this.deleteNodeIfEmpty(sidenodes[0].obj);
		this.deleteNodeIfEmpty(sidenodes[1].obj);

		this.setComponentRefs(linkobj, null);

		// 周囲のComponent末端から切り離されただけの場合は情報を更新して終了
		if (!endetach) { return; }
		let detachnodes = null;
		const node1 = sidenodes[0];
		const node2 = sidenodes[1];
		const lcnt1 = node1.obj.lcnt;
		const lcnt2 = node2.obj.lcnt;
		if (lcnt1 === 0 && ((lcnt2 === 1 || (!this.isLineCross && lcnt2 > 1)) && node2.component !== null)) { detachnodes = [sidenodes[0], sidenodes[1]]; }
		else if (lcnt2 === 0 && ((lcnt1 === 1 || (!this.isLineCross && lcnt1 > 1)) && node1.component !== null)) { detachnodes = [sidenodes[1], sidenodes[0]]; }
		if (!!detachnodes) {
			this.setComponentInfo(detachnodes[1].component!);
			this.modifyNodes = [];
		}
	}

	//---------------------------------------------------------------------------
	// linegraph.setOtherInformation() 移動系パズルで数字などが入力された時に線の情報を生成しなおす
	//---------------------------------------------------------------------------
	override modifyOtherInfo(cell: Cell, relation: any) {
		const haspath = !!cell.path;
		if (haspath !== this.isnodevalid(cell)) {
			if (haspath) { this.deleteNodeIfEmpty(cell); }
			else { this.createNodeIfEmpty(cell); }
		}
		else {
			if (haspath) { this.setComponentInfo(cell.path!); }
			else { this.resetExtraData(cell); }
		}
	}

	//---------------------------------------------------------------------------
	// linegraph.createNodeIfEmpty()  指定されたオブジェクトの場所にNodeを生成する
	// linegraph.deleteNodeIfEmpty()  指定されたオブジェクトの場所からNodeを除去する
	//---------------------------------------------------------------------------
	override createNodeIfEmpty(cell: Cell) {
		const nodes = this.getObjNodeList(cell);

		// 周囲のNode生成が必要かもしれないのでチェック＆create
		if (nodes.length === 0) {
			this.createNode(cell);
		}
		// 交差あり盤面の処理
		else if (!nodes[1] && nodes[0].nodes.length === 2 && this.iscrossing(cell)) {
			// 2本->3本になる時はNodeを追加して分離します
			this.createNode(cell);

			// 上下/左右の線が1本ずつだった場合は左右の線をnodes[1]に付加し直します
			const nbnodes = nodes[0].nodes;
			const isvert = [cell.getvert(nbnodes[0].obj, 2), cell.getvert(nbnodes[1].obj, 2)];
			if (isvert[0] !== isvert[1]) {
				const lrnode = nbnodes[!isvert[0] ? 0 : 1];
				this.removeEdge(nodes[0], lrnode);
				this.addEdge(nodes[1], lrnode);
			}
			// 両方左右線の場合はnodes[0], nodes[1]を交換してnodes[0]に0本、nodes[1]に2本付加する
			else if (!isvert[0] && !isvert[1]) {
				nodes.push(nodes.shift());
			}
		}
	}
	override deleteNodeIfEmpty(cell: Cell) {
		const nodes = this.getObjNodeList(cell);

		// 周囲のNodeが消えるかもしれないのでチェック＆remove
		if (nodes.length === 1 && nodes[0].nodes.length === 0 && !this.isnodevalid(cell)) {
			this.deleteNode(nodes[0]);
		}
		// 交差あり盤面の処理
		else if (!!nodes[1] && nodes[0].nodes.length + nodes[1].nodes.length === 2 && this.iscrossing(cell)) {
			// 3本->2本になってnodes[0], nodes[1]に1本ずつEdgeが存在する場合はnodes[0]に統合
			if (nodes[1].nodes.length === 1) {
				const lrnode = nodes[1].nodes[0];
				this.removeEdge(nodes[1], lrnode);
				this.addEdge(nodes[0], lrnode);
			}
			// 両方左右線の場合はnodes[0], nodes[1]を交換してnodes[0]に2本、nodes[1]に0本にする
			else if (nodes[1].nodes.length === 2) {
				nodes.push(nodes.shift());
			}

			// 不要になったNodeを削除
			this.deleteNode(nodes[1]);
		}
	}

	//--------------------------------------------------------------------------------
	// linegraph.resetExtraData() 指定されたオブジェクトの拡張データをリセットする
	// linegraph.setExtraData()   指定された領域の拡張データを設定する
	//--------------------------------------------------------------------------------
	override resetExtraData(nodeobj: any) {
		if (this.moveline) { nodeobj.base = (nodeobj.isNum() ? nodeobj : this.puzzle.board.emptycell); }
	}
	override setExtraData(component: GraphComponent) {
		if (this.coloring && !component.color) {
			component.color = this.puzzle.painter.getNewLineColor();
		}

		const edgeobjs = component.getedgeobjs();
		for (let i = 0; i < edgeobjs.length; i++) {
			this.setComponentRefs(edgeobjs[i], component);
		}

		if (this.makeClist || this.moveline) {
			component.clist = new CellList(component.getnodeobjs());
			if (this.moveline) { this.setMovedBase(component); }
		}
	}

	//--------------------------------------------------------------------------------
	// linegraph.repaintNodes() ブロックを再描画する
	//--------------------------------------------------------------------------------
	override repaintNodes(components: GraphComponent[]) {
		const blist_all = new BorderList();
		for (let i = 0; i < components.length; i++) {

			blist_all.extend(components[i].getedgeobjs());
		}
		this.puzzle.painter.repaintLines(blist_all);
	}

	//--------------------------------------------------------------------------------
	// linemgr.initMovedBase()   指定されたセルの移動情報を初期化する
	// linemgr.setMovedBase()    指定された領域の移動情報を設定する
	//--------------------------------------------------------------------------------
	setMovedBase(component: GraphComponent) {
		const emptycell = this.puzzle.board.emptycell;
		component.departure = component.destination = emptycell;
		component.movevalid = false;

		const clist = component.clist;
		if (clist.length < 1) { return; }
		for (let i = 0; i < clist.length; i++) {
			const cell = clist[i];
			cell.base = (cell.isNum() ? cell : emptycell);
		}

		let before = null;
		let after = null;
		let point = 0;
		if (clist.length === 1) {
			before = after = clist[0];
			point = 2;
		}
		else {
			for (let i = 0; i < clist.length; i++) {
				const cell = clist[i];
				if (cell.lcnt === 1) {
					point++;
					if (cell.isNum()) { before = cell; } else { after = cell; }
				}
			}
		}
		if (before !== null && after !== null && point === 2) {
			before.base = emptycell;
			component.departure = after.base = before;
			component.destination = after;
			component.movevalid = true;
		}
	}
}
