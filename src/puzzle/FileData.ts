import type { Puzzle } from "./Puzzle";
import {
	ObjectOperation,
	type Operation,
	TrialEnterOperation,
	OperationList

} from "./Operation";
import type { BoardPiece, Cell } from "./Piece";
import { Board, IGroup, type IGroup2 } from "./Board";
import { pzpr } from "../pzpr/core";
import { Parser } from "../pzpr/parser";
import { FileData } from "../pzpr/fileData";
import * as Constants from "../pzpr/constants"
import * as MetaData from "../pzpr/metadata"

type IDecodeFunc<TValue, TPiece extends BoardPiece = BoardPiece> = (piece: TPiece, str: TValue) => void
type IEncodeFunc<TValue, TPiece extends BoardPiece = BoardPiece> = (piece: TPiece) => TValue
// FileData.js
function throwNoImplementation() { throw "no Implemention"; }
//---------------------------------------------------------------------------
// ★FileIOクラス ファイルのデータ形式エンコード/デコードを扱う
//---------------------------------------------------------------------------

//---------------------------------------------------------
export class FileIO {
	filever = 0
	lineseek = 0
	dataarray: string[] = null
	xmldoc: Document = null
	datastr = ""
	currentType = 0
	puzzle: Puzzle
	constructor(puzzle: Puzzle) {
		this.puzzle = puzzle
	}

	//---------------------------------------------------------------------------
	// fio.filedecode()  ファイルデータ(文字列)からのデコード実行関数
	//---------------------------------------------------------------------------
	filedecode(datastr: string) {
		var puzzle = this.puzzle, bd = puzzle.board, pzl = Parser.parseFile(datastr, puzzle.pid);
		var filetype = this.currentType = pzl.type;

		bd.initBoardSize(pzl.cols, pzl.rows);

		this.filever = pzl.filever;
		if (filetype !== Constants.FILE_PBOX_XML) {
			this.lineseek = 0;
			this.dataarray = pzl.body.split("\n");
		}
		else {
			this.xmldoc = pzl.body;
		}

		// メイン処理
		switch (filetype) {
			case Constants.FILE_PZPR:
				this.decodeData();
				if ((this.readLine() || '').match(/TrialData/)) { this.lineseek--; this.decodeTrial(); }
				break;

			case Constants.FILE_PBOX:
				this.kanpenOpen();
				break;

			case Constants.FILE_PBOX_XML:
				this.kanpenOpenXML();
				break;
		}

		puzzle.metadata = MetaData.update(puzzle.metadata, pzl.metadata);
		if (pzl.history && (filetype === Constants.FILE_PZPR)) {
			puzzle.opemgr.decodeHistory(pzl.history);
		}

		bd.rebuildInfo();

		this.dataarray = null;
	}
	//---------------------------------------------------------------------------
	// fio.fileencode() ファイルデータ(文字列)へのエンコード実行関数
	//---------------------------------------------------------------------------
	fileencode(filetype: number, option: any) {
		var puzzle = this.puzzle, bd = puzzle.board;
		var pzl = new FileData('', puzzle.pid);

		this.currentType = filetype = filetype || Constants.FILE_PZPR; /* type===pzl.FILE_AUTO(0)もまとめて変換する */
		option = option || {};

		this.filever = 0;
		this.datastr = "";
		if (filetype === Constants.FILE_PBOX_XML) {
			this.xmldoc = (new DOMParser()).parseFromString('<?xml version="1.0" encoding="utf-8" ?><puzzle />', 'text/xml');
			var puzzlenode = this.xmldoc.querySelector('puzzle');
			puzzlenode.appendChild(this.createXMLNode('board'));
			puzzlenode.appendChild(this.createXMLNode('answer'));
		}

		// メイン処理
		switch (filetype) {
			case Constants.FILE_PZPR:
				this.encodeData();
				if (!option.history && option.trial && bd.trialstage > 0) { this.encodeTrial(); }
				break;

			case Constants.FILE_PBOX:
				this.kanpenSave();
				break;

			case Constants.FILE_PBOX_XML:
				this.kanpenSaveXML();
				break;

			default:
				throw "invalid File Type";
		}

		pzl.type = filetype;
		pzl.filever = this.filever;
		pzl.cols = bd.cols;
		pzl.rows = bd.rows;
		if (filetype !== Constants.FILE_PBOX_XML) {
			pzl.body = this.datastr;
		}
		else {
			pzl.body = this.xmldoc;
		}
		pzl.metadata = MetaData.update(pzl.metadata, puzzle.metadata);
		if (option.history && (filetype === Constants.FILE_PZPR)) {
			pzl.history = puzzle.opemgr.encodeHistory({ time: !!option.time });
		}

		this.datastr = "";

		return pzl.generate();
	}

	// オーバーライド用
	decodeData() { }
	encodeData() { }
	kanpenOpen() { }
	kanpenSave() { }
	kanpenOpenXML() { }
	kanpenSaveXML() { }

	//---------------------------------------------------------------------------
	// fio.decodeTrial() 仮置きデータを復旧する
	// fio.encodeTrial() 仮置きデータを出力する
	//---------------------------------------------------------------------------
	decodeTrial() {
		var opemgr = this.puzzle.opemgr;
		var bd = this.puzzle.board;
		var len = +(this.readLine().match(/TrialData\((\d+)\)/)[1]);
		for (var i = len - 1; i >= 0; i--) {
			var opes: Operation<any>[] = [];
			var bd1 = bd.freezecopy();
			bd.allclear(false);
			this.decodeData();
			bd.compareData(bd1, (group, c, a) => {
				var obj = bd[group][c];
				// @ts-ignore
				var old = obj[a];
				var num = bd1[group][c][a];
				opes.push(new ObjectOperation(this.puzzle, obj, a, old, num));
			});
			opemgr.history.unshift(opes);
			opemgr.history.unshift([new TrialEnterOperation(this.puzzle, i, i + 1)]);
			opemgr.trialpos.unshift(i * 2);
			this.readLine();	// 次の"TrialData"文字列は読み捨て
		}
		opemgr.position = opemgr.history.length;
		opemgr.resumeTrial();
	}
	encodeTrial() {
		var opemgr = this.puzzle.opemgr, pos = opemgr.position;
		opemgr.disableRecord();
		for (var stage = this.puzzle.board.trialstage; stage > 0; stage--) {
			this.writeLine('TrialData(' + stage + ')');
			opemgr.resumeGoto(opemgr.trialpos[stage - 1]);
			this.encodeData();
		}
		opemgr.resumeGoto(pos);
		opemgr.resumeTrial();
		opemgr.enableRecord();
	}

	//---------------------------------------------------------------------------
	// fio.readLine()    ファイルに書かれている1行の文字列を返す
	// fio.getItemList() ファイルに書かれている改行＋スペース区切りの
	//                   複数行の文字列を配列にして返す
	//---------------------------------------------------------------------------
	readLine() {
		this.lineseek++;
		return this.dataarray[this.lineseek - 1];
	}

	getItemList(rows: number) {
		var item = [], line;
		for (var i = 0; i < rows; i++) {
			if (!(line = this.readLine())) { continue; }
			var array1 = line.split(" ");
			for (var c = 0; c < array1.length; c++) {
				if (array1[c] !== "") { item.push(array1[c]); }
			}
		}
		return item;
	}

	//---------------------------------------------------------------------------
	// fio.writeLine()    ファイルに1行出力する
	//---------------------------------------------------------------------------
	writeLine(data: string | number) {
		if (typeof data === 'number') { data = '' + data; }
		else { data = data || ''; } // typeof data==='string'
		this.datastr += (data + "\n");
	}

	//---------------------------------------------------------------------------
	// fio.decodeObj()     配列で、個別文字列から個別セルなどの設定を行う
	// fio.decodeCell()    配列で、個別文字列から個別セルの設定を行う
	// fio.decodeCross()   配列で、個別文字列から個別Crossの設定を行う
	// fio.decodeBorder()  配列で、個別文字列から個別Borderの設定を行う
	// fio.decodeCellExcell()  配列で、個別文字列から個別セル/Excellの設定を行う
	//---------------------------------------------------------------------------
	decodeObj(func: IDecodeFunc<string>, group: IGroup2, startbx: number, startby: number, endbx: number, endby: number) {
		var bx = startbx, by = startby, step = 2;
		var item = this.getItemList((endby - startby) / step + 1);
		for (var i = 0; i < item.length; i++) {
			func.call(this, this.puzzle.board.getObjectPos(group, bx, by), item[i]);

			bx += step;
			if (bx > endbx) { bx = startbx; by += step; }
			if (by > endby) { break; }
		}
	}
	decodeCell(func: IDecodeFunc<string, BoardPiece>) {
		this.decodeObj(func, 'cell', 1, 1, 2 * this.puzzle.board.cols - 1, 2 * this.puzzle.board.rows - 1);
	}
	decodeCross(func: IDecodeFunc<string>) {
		this.decodeObj(func, 'cross', 0, 0, 2 * this.puzzle.board.cols, 2 * this.puzzle.board.rows);
	}
	decodeBorder(func: IDecodeFunc<string>) {
		var puzzle = this.puzzle, bd = puzzle.board;
		if (bd.hasborder === 1 || puzzle.pid === 'bosanowa' || (puzzle.pid === 'fourcells' && this.filever === 0)) {
			this.decodeObj(func, 'border', 2, 1, 2 * bd.cols - 2, 2 * bd.rows - 1);
			this.decodeObj(func, 'border', 1, 2, 2 * bd.cols - 1, 2 * bd.rows - 2);
		}
		else if (bd.hasborder === 2) {
			if (this.currentType === Constants.FILE_PZPR) {
				this.decodeObj(func, 'border', 0, 1, 2 * bd.cols, 2 * bd.rows - 1);
				this.decodeObj(func, 'border', 1, 0, 2 * bd.cols - 1, 2 * bd.rows);
			}
			// pencilboxでは、outsideborderの時はぱずぷれとは順番が逆になってます
			else if (this.currentType === Constants.FILE_PBOX) {
				this.decodeObj(func, 'border', 1, 0, 2 * bd.cols - 1, 2 * bd.rows);
				this.decodeObj(func, 'border', 0, 1, 2 * bd.cols, 2 * bd.rows - 1);
			}
		}
	}
	decodeCellExcell(func: IDecodeFunc<string>) {
		this.decodeObj(func, 'obj', -1, -1, this.puzzle.board.maxbx - 1, this.puzzle.board.maxby - 1);
	}

	//---------------------------------------------------------------------------
	// fio.encodeObj()     個別セルデータ等から個別文字列の設定を行う
	// fio.encodeCell()    個別セルデータから個別文字列の設定を行う
	// fio.encodeCross()   個別Crossデータから個別文字列の設定を行う
	// fio.encodeBorder()  個別Borderデータから個別文字列の設定を行う
	// fio.encodeCellExcell()  個別セル/Excellデータから個別文字列の設定を行う
	//---------------------------------------------------------------------------
	encodeObj(func: IEncodeFunc<string>, group: IGroup2, startbx: number, startby: number, endbx: number, endby: number) {
		var step = 2;
		for (var by = startby; by <= endby; by += step) {
			var data = '';
			for (var bx = startbx; bx <= endbx; bx += step) {
				data += func.call(this, this.puzzle.board.getObjectPos(group, bx, by));
			}
			this.writeLine(data);
		}
	}
	encodeCell(func: IEncodeFunc<string, BoardPiece>) {
		this.encodeObj(func, 'cell', 1, 1, 2 * this.puzzle.board.cols - 1, 2 * this.puzzle.board.rows - 1);
	}
	encodeCross(func: IEncodeFunc<string>) {
		this.encodeObj(func, 'cross', 0, 0, 2 * this.puzzle.board.cols, 2 * this.puzzle.board.rows);
	}
	encodeBorder(func: IEncodeFunc<string>) {
		var puzzle = this.puzzle, bd = puzzle.board;
		if (bd.hasborder === 1 || puzzle.pid === 'bosanowa') {
			this.encodeObj(func, 'border', 2, 1, 2 * bd.cols - 2, 2 * bd.rows - 1);
			this.encodeObj(func, 'border', 1, 2, 2 * bd.cols - 1, 2 * bd.rows - 2);
		}
		else if (bd.hasborder === 2) {
			if (this.currentType === Constants.FILE_PZPR) {
				this.encodeObj(func, 'border', 0, 1, 2 * bd.cols, 2 * bd.rows - 1);
				this.encodeObj(func, 'border', 1, 0, 2 * bd.cols - 1, 2 * bd.rows);
			}
			// pencilboxでは、outsideborderの時はぱずぷれとは順番が逆になってます
			else if (this.currentType === Constants.FILE_PBOX) {
				this.encodeObj(func, 'border', 1, 0, 2 * bd.cols - 1, 2 * bd.rows);
				this.encodeObj(func, 'border', 0, 1, 2 * bd.cols, 2 * bd.rows - 1);
			}
		}
	}
	encodeCellExcell(func: IEncodeFunc<string, BoardPiece>) {
		this.encodeObj(func, 'obj', -1, -1, this.puzzle.board.maxbx - 1, this.puzzle.board.maxby - 1);
	}

	//---------------------------------------------------------------------------
	// fio.decodeCellXMLBoard()  配列で、個別文字列から個別セルの設定を行う (XML board用)
	// fio.decodeCellXMLBrow()   配列で、個別文字列から個別セルの設定を行う (XML board用)
	// fio.decodeCellXMLArow()   配列で、個別文字列から個別セルの設定を行う (XML answer用)
	// fio.encodeCellXMLBoard()  個別セルデータから個別文字列の設定を行う (XML board用)
	// fio.encodeCellXMLBrow()   個別セルデータから個別文字列の設定を行う (XML board用)
	// fio.encodeCellXMLArow()   個別セルデータから個別文字列の設定を行う (XML answer用)
	// fio.createXMLNode()  指定されたattributeを持つXMLのノードを作成する
	//---------------------------------------------------------------------------
	decodeCellXMLBoard(func: IDecodeFunc<number>) {
		var nodes = this.xmldoc.querySelectorAll('board number');
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			var cell = this.puzzle.board.getc(+node.getAttribute('c') * 2 - 1, +node.getAttribute('r') * 2 - 1);
			if (!cell.isnull) { func(cell, +node.getAttribute('n')); }
		}
	}
	encodeCellXMLBoard(func: IEncodeFunc<number>) {
		var boardnode = this.xmldoc.querySelector('board');
		var bd = this.puzzle.board;
		for (var i = 0; i < bd.cell.length; i++) {
			var cell = bd.cell[i], val = func(cell);
			if (val !== null) {
				boardnode.appendChild(this.createXMLNode('number', { r: ((cell.by / 2) | 0) + 1, c: ((cell.bx / 2) | 0) + 1, n: val }));
			}
		}
	}

	PBOX_ADJUST = 0
	decodeCellXMLBrow(func: IDecodeFunc<string>) { this.decodeCellXMLrow_com(func, 'board', 'brow'); }
	encodeCellXMLBrow(func: IEncodeFunc<string>) { this.encodeCellXMLrow_com(func, 'board', 'brow'); }
	decodeCellXMLArow(func: IDecodeFunc<string>) { this.decodeCellXMLrow_com(func, 'answer', 'arow'); }
	encodeCellXMLArow(func: IEncodeFunc<string>) { this.encodeCellXMLrow_com(func, 'answer', 'arow'); }
	decodeCellXMLrow_com(func: IDecodeFunc<string>, parentnodename: string, targetnodename: string) {
		var rownodes = this.xmldoc.querySelectorAll(parentnodename + ' ' + targetnodename);
		var ADJ = this.PBOX_ADJUST;
		for (var b = 0; b < rownodes.length; b++) {
			var bx = 1 - ADJ, by = (+rownodes[b].getAttribute('row')) * 2 - 1 - ADJ;
			var nodes = rownodes[b].childNodes;
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].nodeType !== 1) { continue; }
				var name = nodes[i].nodeName, n = +(nodes[i] as HTMLElement).getAttribute('n') || 1;
				if (name === 'z') { name = 'n0'; }
				else if (name === 'n') { name = 'n' + (+(nodes[i] as HTMLElement).getAttribute('v')); }
				for (var j = 0; j < n; j++) {
					func(this.puzzle.board.getobj(bx, by), name);
					bx += 2;
				}
			}
		}
	}
	encodeCellXMLrow_com(func: IEncodeFunc<string>, parentnodename: string, targetnodename: string) {
		var boardnode = this.xmldoc.querySelector(parentnodename);
		var ADJ = this.PBOX_ADJUST;
		var bd = this.puzzle.board;
		for (var by = 1 - ADJ; by <= bd.maxby; by += 2) {
			var rownode = this.createXMLNode(targetnodename, { row: (((by + ADJ) / 2) | 0) + 1 });
			for (var bx = 1 - ADJ; bx <= bd.maxbx; bx += 2) {
				var piece = bd.getobj(bx, by), nodename = func(piece), node;
				if (nodename.match(/n(\d\d+)/) || nodename.match(/n(\-\d+)/)) {
					node = this.createXMLNode('n', { v: RegExp.$1 });
				}
				else if (nodename === 'n0') { node = this.createXMLNode('z'); }
				else { node = this.createXMLNode(nodename); }
				rownode.appendChild(node);
			}
			boardnode.appendChild(rownode);
		}
	}

	createXMLNode(name: string, attrs: Record<string, string | number> = null) {
		var node = this.xmldoc.createElement(name);
		if (!!attrs) { for (var i in attrs) { node.setAttribute(i, attrs[i].toString()); } }
		return node;
	}

	//---------------------------------------------------------------------------
	// fio.decodeCellQnum() 問題数字のデコードを行う
	// fio.encodeCellQnum() 問題数字のエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellQnum() {
		this.decodeCell(function (cell, ca) {
			if (ca === "-") { cell.qnum = -2; }
			else if (ca !== ".") { cell.qnum = +ca; }
		});
	}
	encodeCellQnum() {
		this.encodeCell(function (cell) {
			if (cell.qnum >= 0) { return cell.qnum + " "; }
			else if (cell.qnum === -2) { return "- "; }
			else { return ". "; }
		});
	}
	//---------------------------------------------------------------------------
	// fio.decodeCellQnumb() 黒背景な問題数字のデコードを行う
	// fio.encodeCellQnumb() 黒背景な問題数字のエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellQnumb() {
		this.decodeCell(function (cell, ca) {
			if (ca === "5") { cell.qnum = -2; }
			else if (ca !== ".") { cell.qnum = +ca; }
		});
	}
	encodeCellQnumb() {
		this.encodeCell(function (cell) {
			if (cell.qnum >= 0) { return cell.qnum + " "; }
			else if (cell.qnum === -2) { return "5 "; }
			else { return ". "; }
		});
	}
	//---------------------------------------------------------------------------
	// fio.decodeCellQnumAns() 問題数字＋黒マス白マスのデコードを行う
	// fio.encodeCellQnumAns() 問題数字＋黒マス白マスのエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellQnumAns() {
		this.decodeCell(function (cell, ca) {
			if (ca === "#") { cell.qans = 1; }
			else if (ca === "+") { cell.qsub = 1; }
			else if (ca === "-") { cell.qnum = -2; }
			else if (ca !== ".") { cell.qnum = +ca; }
		});
	}
	encodeCellQnumAns() {
		this.encodeCell(function (cell) {
			if (cell.qnum >= 0) { return cell.qnum + " "; }
			else if (cell.qnum === -2) { return "- "; }
			else if (cell.qans === 1) { return "# "; }
			else if (cell.qsub === 1) { return "+ "; }
			else { return ". "; }
		});
	}
	//---------------------------------------------------------------------------
	// fio.decodeCellDirecQnum() 方向＋問題数字のデコードを行う
	// fio.encodeCellDirecQnum() 方向＋問題数字のエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellDirecQnum() {
		this.decodeCell(function (cell, ca) {
			if (ca !== ".") {
				var inp = ca.split(",");
				cell.qdir = (inp[0] !== "0" ? +inp[0] : 0);
				cell.qnum = (inp[1] !== "-" ? +inp[1] : -2);
			}
		});
	}
	encodeCellDirecQnum() {
		this.encodeCell(function (cell) {
			if (cell.qnum !== -1) {
				var ca1 = (cell.qdir !== 0 ? "" + cell.qdir : "0");
				var ca2 = (cell.qnum !== -2 ? "" + cell.qnum : "-");
				return [ca1, ",", ca2, " "].join('');
			}
			else { return ". "; }
		});
	}
	//---------------------------------------------------------------------------
	// fio.decodeCellAns() 黒マス白マスのデコードを行う
	// fio.encodeCellAns() 黒マス白マスのエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellAns() {
		this.decodeCell(function (cell, ca) {
			if (ca === "#") { cell.qans = 1; }
			else if (ca === "+") { cell.qsub = 1; }
		});
	}
	encodeCellAns() {
		this.encodeCell(function (cell) {
			if (cell.qans === 1) { return "# "; }
			else if (cell.qsub === 1) { return "+ "; }
			else { return ". "; }
		});
	}
	//---------------------------------------------------------------------------
	// fio.decodeCellQanssub() 黒マスと背景色のデコードを行う
	// fio.encodeCellQanssub() 黒マスと背景色のエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellQanssub() {
		this.decodeCell(function (cell, ca) {
			if (ca === "+") { cell.qsub = 1; }
			else if (ca === "-") { cell.qsub = 2; }
			else if (ca === "=") { cell.qsub = 3; }
			else if (ca === "%") { cell.qsub = 4; }
			else if (ca !== ".") { cell.qans = +ca; }
		});
	}
	encodeCellQanssub() {
		this.encodeCell(function (cell) {
			if (cell.qans !== 0) { return cell.qans + " "; }
			else if (cell.qsub === 1) { return "+ "; }
			else if (cell.qsub === 2) { return "- "; }
			else if (cell.qsub === 3) { return "= "; }
			else if (cell.qsub === 4) { return "% "; }
			else { return ". "; }
		});
	}
	//---------------------------------------------------------------------------
	// fio.decodeCellAnumsub() 回答数字と背景色のデコードを行う
	// fio.encodeCellAnumsub() 回答数字と背景色のエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellAnumsub() {
		this.decodeCell((obj: BoardPiece, ca: string) => {
			const cell = obj as Cell
			if (cell.enableSubNumberArray && ca.indexOf('[') >= 0) { ca = this.setCellSnum(cell, ca); }
			if (ca === "+") { cell.qsub = 1; }
			else if (ca === "-") { cell.qsub = 2; }
			else if (ca === "=") { cell.qsub = 3; }
			else if (ca === "%") { cell.qsub = 4; }
			else if (ca !== ".") { cell.anum = +ca; }
		});
	}
	encodeCellAnumsub() {
		this.encodeCell((obj) => {
			const cell = obj as Cell
			var ca = ".";
			if (cell.anum !== -1) { ca = "" + cell.anum; }
			else if (cell.qsub === 1) { ca = "+"; }
			else if (cell.qsub === 2) { ca = "-"; }
			else if (cell.qsub === 3) { ca = "="; }
			else if (cell.qsub === 4) { ca = "%"; }
			else { ca = "."; }
			if (cell.enableSubNumberArray && cell.anum === -1) { ca += this.getCellSnum(cell); }
			return ca + " ";
		});
	}
	//---------------------------------------------------------------------------
	// fio.setCellSnum() 補助数字のデコードを行う   (decodeCellAnumsubで内部的に使用)
	// fio.getCellSnum() 補助数字のエンコードを行う (encodeCellAnumsubで内部的に使用)
	//---------------------------------------------------------------------------
	setCellSnum(cell: Cell, ca: string) {
		var snumtext = ca.substring(ca.indexOf('[') + 1, ca.indexOf(']'));
		var list = snumtext.split(/,/);
		for (var i = 0; i < list.length; ++i) {
			cell.snum[i] = (!!list[i] ? +list[i] : -1);
		}
		return ca.substr(0, ca.indexOf('['));
	}
	getCellSnum(cell: Cell) {
		var list = [];
		for (var i = 0; i < cell.snum.length; ++i) {
			list[i] = (cell.snum[i] !== -1 ? '' + cell.snum[i] : '');
		}
		var snumtext = list.join(',');
		return (snumtext !== ',,,' ? '[' + snumtext + ']' : '');
	}
	//---------------------------------------------------------------------------
	// fio.decodeCellQsub() 背景色のデコードを行う
	// fio.encodeCellQsub() 背景色のエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellQsub() {
		this.decodeCell(function (cell, ca) {
			if (ca !== "0") { cell.qsub = +ca; }
		});
	}
	encodeCellQsub() {
		this.encodeCell(function (cell) {
			if (cell.qsub > 0) { return cell.qsub + " "; }
			else { return "0 "; }
		});
	}
	//---------------------------------------------------------------------------
	// fio.decodeCrossNum() 交点の数字のデコードを行う
	// fio.encodeCrossNum() 交点の数字のエンコードを行う
	//---------------------------------------------------------------------------
	decodeCrossNum() {
		this.decodeCross(function (cross, ca) {
			if (ca === "-") { cross.qnum = -2; }
			else if (ca !== ".") { cross.qnum = +ca; }
		});
	}
	encodeCrossNum() {
		this.encodeCross(function (cross) {
			if (cross.qnum >= 0) { return cross.qnum + " "; }
			else if (cross.qnum === -2) { return "- "; }
			else { return ". "; }
		});
	}
	//---------------------------------------------------------------------------
	// fio.decodeBorderQues() 問題の境界線のデコードを行う
	// fio.encodeBorderQues() 問題の境界線のエンコードを行う
	//---------------------------------------------------------------------------
	decodeBorderQues() {
		this.decodeBorder(function (border, ca) {
			if (ca === "1") { border.ques = 1; }
		});
	}
	encodeBorderQues() {
		this.encodeBorder(function (border) {
			return (border.ques === 1 ? "1" : "0") + " ";
		});
	}
	//---------------------------------------------------------------------------
	// fio.decodeBorderAns() 問題・回答の境界線のデコードを行う
	// fio.encodeBorderAns() 問題・回答の境界線のエンコードを行う
	//---------------------------------------------------------------------------
	decodeBorderAns() {
		this.decodeBorder(function (border, ca) {
			if (ca === "2") { border.qans = 1; border.qsub = 1; }
			else if (ca === "1") { border.qans = 1; }
			else if (ca === "-1") { border.qsub = 1; }
		});
	}
	encodeBorderAns() {
		this.encodeBorder(function (border) {
			if (border.qans === 1 && border.qsub === 1) { return "2 "; }
			else if (border.qans === 1) { return "1 "; }
			else if (border.qsub === 1) { return "-1 "; }
			else { return "0 "; }
		});
	}
	//---------------------------------------------------------------------------
	// fio.decodeBorderLine() Lineのデコードを行う
	// fio.encodeBorderLine() Lineのエンコードを行う
	//---------------------------------------------------------------------------
	decodeBorderLine() {
		this.decodeBorder(function (border, ca) {
			if (ca === "-1") { border.qsub = 2; }
			else if (ca !== "0") { border.line = +ca; }
		});
	}
	encodeBorderLine() {
		this.encodeBorder(function (border) {
			if (border.line > 0) { return border.line + " "; }
			else if (border.qsub === 2) { return "-1 "; }
			else { return "0 "; }
		});
	}
	//---------------------------------------------------------------------------
	// fio.decodeAreaRoom() 部屋のデコードを行う
	// fio.encodeAreaRoom() 部屋のエンコードを行う
	//---------------------------------------------------------------------------
	decodeAreaRoom() { this.decodeAreaRoom_com(true); }
	encodeAreaRoom() { this.encodeAreaRoom_com(true); }
	decodeAreaRoom_com(isques: boolean) {
		this.readLine();
		this.rdata2Border(isques, this.getItemList(this.puzzle.board.rows));

		this.puzzle.board.roommgr.rebuild();
	}
	encodeAreaRoom_com(isques: boolean) {
		var bd = this.puzzle.board;
		bd.roommgr.rebuild();

		var rooms = bd.roommgr.components;
		this.writeLine(rooms.length);
		var data = '';
		for (var c = 0; c < bd.cell.length; c++) {
			var roomid = rooms.indexOf(bd.cell[c].room);
			data += ("" + (roomid >= 0 ? roomid : ".") + " ");
			if ((c + 1) % bd.cols === 0) {
				this.writeLine(data);
				data = '';
			}
		}
	}
	//---------------------------------------------------------------------------
	// fio.rdata2Border() 入力された配列から境界線を入力する
	//---------------------------------------------------------------------------
	rdata2Border(isques: boolean, rdata: any[]) {
		var bd = this.puzzle.board;
		for (var id = 0; id < bd.border.length; id++) {
			var border = bd.border[id], cell1 = border.sidecell[0], cell2 = border.sidecell[1];
			var isdiff = (!cell1.isnull && !cell2.isnull && rdata[cell1.id] !== rdata[cell2.id]);
			border[(isques ? 'ques' : 'qans')] = (isdiff ? 1 : 0);
		}
	}
	//---------------------------------------------------------------------------
	// fio.decodeCellQnum51() [＼]のデコードを行う
	// fio.encodeCellQnum51() [＼]のエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellQnum51() {
		var bd = this.puzzle.board;
		bd.disableInfo(); /* mv.set51cell()用 */
		this.decodeCellExcell(function (obj, ca) {
			if (ca === ".") { return; }
			else if (obj.group === 'excell') {
				if (obj.bx !== -1 && obj.by === -1) { obj.qnum2 = +ca; }
				else if (obj.bx === -1 && obj.by !== -1) { obj.qnum = +ca; }
			}
			else if (obj.group === 'cell') {
				var inp = ca.split(",");
				obj.set51cell();
				obj.qnum = +inp[0];
				obj.qnum2 = +inp[1];
			}
		});
		bd.enableInfo(); /* mv.set51cell()用 */
	}
	encodeCellQnum51() {
		this.encodeCellExcell(function (obj: BoardPiece) {
			if (obj.group === 'excell') {
				if (obj.bx === -1 && obj.by === -1) { return "0 "; }
				return ((obj.by === -1) ? obj.qnum2 : obj.qnum) + " ";
			}
			else if (obj.group === 'cell') {
				if (obj.ques === 51) {
					return (obj.qnum + "," + obj.qnum2 + " ");
				}
			}
			return ". ";
		});
	}
	//---------------------------------------------------------------------------
	// fio.decodeCellQnum_kanpen() pencilbox用問題数字のデコードを行う
	// fio.encodeCellQnum_kanpen() pencilbox用問題数字のエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellQnum_kanpen() {
		this.decodeCell(function (cell, ca) {
			if (ca !== ".") { cell.qnum = +ca; }
		});
	}
	encodeCellQnum_kanpen() {
		this.encodeCell(function (cell) {
			return ((cell.qnum >= 0) ? cell.qnum + " " : ". ");
		});
	}
	//---------------------------------------------------------------------------
	// fio.decodeCellAnum_kanpen() pencilbox用回答数字のデコードを行う
	// fio.encodeCellAnum_kanpen() pencilbox用回答数字のエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellAnum_kanpen() {
		this.decodeCell(function (cell, ca) {
			if (ca !== "." && ca !== "0") { cell.anum = +ca; }
		});
	}
	encodeCellAnum_kanpen() {
		this.encodeCell(function (cell) {
			if (cell.qnum !== -1) { return ". "; }
			else if (cell.anum === -1) { return "0 "; }
			else { return cell.anum + " "; }
		});
	}
	//---------------------------------------------------------------------------
	// fio.decodeCellQnumAns_kanpen() pencilbox用問題数字＋黒マス白マスのデコードを行う
	// fio.encodeCellQnumAns_kanpen() pencilbox用問題数字＋黒マス白マスのエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellQnumAns_kanpen() {
		this.decodeCell(function (cell, ca) {
			if (ca === "#") { cell.qans = 1; }
			else if (ca === "+") { cell.qsub = 1; }
			else if (ca === "?") { cell.qnum = -2; }
			else if (ca !== ".") { cell.qnum = +ca; }
		});
	}
	encodeCellQnumAns_kanpen() {
		this.encodeCell(function (cell) {
			if (cell.qnum >= 0) { return cell.qnum + " "; }
			else if (cell.qnum === -2) { return "? "; }
			else if (cell.qans === 1) { return "# "; }
			else if (cell.qsub === 1) { return "+ "; }
			else { return ". "; }
		});
	}

	//---------------------------------------------------------------------------
	// fio.decodeCellQnum_XMLBoard() pencilbox XML用問題用数字のデコードを行う
	// fio.encodeCellQnum_XMLBoard() pencilbox XML用問題用数字のエンコードを行う
	//---------------------------------------------------------------------------
	UNDECIDED_NUM_XML = -1
	decodeCellQnum_XMLBoard() {
		var minnum = (this.puzzle.board.cell[0].getminnum() > 0 ? 1 : 0);
		var undecnum = this.UNDECIDED_NUM_XML;
		this.decodeCellXMLBoard(function (cell, val: number) {
			if (val === undecnum) { cell.qnum = -2; }
			else if (val >= minnum) { cell.qnum = val; }
		});
	}
	encodeCellQnum_XMLBoard() {
		var minnum = (this.puzzle.board.cell[0].getminnum() > 0 ? 1 : 0);
		var undecnum = this.UNDECIDED_NUM_XML;
		this.encodeCellXMLBoard(function (cell) {
			var val = null;
			if (cell.qnum === -2) { val = undecnum; }
			else if (cell.qnum >= minnum) { val = cell.qnum; }
			return val;
		});
	}

	//---------------------------------------------------------------------------
	// fio.decodeCellQnum_XMLBoard() pencilbox XML用問題用数字(browタイプ)のデコードを行う
	// fio.encodeCellQnum_XMLBoard() pencilbox XML用問題用数字(browタイプ)のエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellQnum_XMLBoard_Brow() {
		var undecnum = this.UNDECIDED_NUM_XML;
		this.decodeCellXMLBrow(function (cell, name) {
			if (name === 'n' + undecnum) { cell.qnum = -2; }
			else if (name !== 's') { cell.qnum = +name.substr(1); }
		});
	}
	encodeCellQnum_XMLBoard_Brow() {
		var undecnum = this.UNDECIDED_NUM_XML;
		this.encodeCellXMLBrow(function (cell) {
			if (cell.qnum === -2) { return 'n' + undecnum; }
			else if (cell.qnum >= 0) { return 'n' + cell.qnum; }
			return 's';
		});
	}

	//---------------------------------------------------------------------------
	// fio.decodeCellAnum_XMLBoard() pencilbox XML用回答用数字のデコードを行う
	// fio.encodeCellAnum_XMLBoard() pencilbox XML用回答用数字のエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellAnum_XMLAnswer() {
		this.decodeCellXMLArow(function (cell, name) {
			if (name === 'n0') { cell.anum = -1; }
			else if (name !== 's') { cell.anum = +name.substr(1); }
		});
	}
	encodeCellAnum_XMLAnswer() {
		this.encodeCellXMLArow(function (cell) {
			if (cell.anum > 0) { return 'n' + cell.anum; }
			else if (cell.anum === -1) { return 'n0'; }
			return 's';
		});
	}

	//---------------------------------------------------------------------------
	// fio.decodeAreaRoom_XMLBoard() pencilbox XML用問題用不定形部屋のデコードを行う
	// fio.encodeAreaRoom_XMLBoard() pencilbox XML用問題用不定形部屋のエンコードを行う
	//---------------------------------------------------------------------------
	decodeAreaRoom_XMLBoard() {
		var rdata: number[] = [];
		this.decodeCellXMLBrow(function (cell, name) {
			rdata.push(+name.substr(1));
		});
		this.rdata2Border(true, rdata);
		this.puzzle.board.roommgr.rebuild();
	}
	encodeAreaRoom_XMLBoard() {
		var bd = this.puzzle.board;
		bd.roommgr.rebuild();
		var rooms = bd.roommgr.components;
		this.xmldoc.querySelector('board').appendChild(this.createXMLNode('areas', { N: rooms.length }));
		this.encodeCellXMLBrow(function (cell) {
			var roomid = rooms.indexOf(cell.room);
			return 'n' + (roomid > 0 ? roomid : -1);
		});
	}

	//---------------------------------------------------------------------------
	// fio.decodeCellAns_XMLAnswer() pencilbox XML用黒マスのデコードを行う
	// fio.encodeCellAns_XMLAnswer() pencilbox XML用黒マスのエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellAns_XMLAnswer() {
		this.decodeCellXMLArow(function (cell, name) {
			if (name === 'w') { cell.qans = 1; }
			else if (name === 's') { cell.qsub = 1; }
		});
	}
	encodeCellAns_XMLAnswer() {
		this.encodeCellXMLArow(function (cell) {
			if (cell.qans === 1) { return 'w'; }
			else if (cell.qsub === 1) { return 's'; }
			return 'u';
		});
	}

	//---------------------------------------------------------------------------
	// fio.decodeBorderLine_XMLAnswer() pencilbox XML用Lineのデコードを行う
	// fio.encodeBorderLine_XMLAnswer() pencilbox XML用Lineのエンコードを行う
	//---------------------------------------------------------------------------
	decodeBorderLine_XMLAnswer() {
		this.decodeCellXMLArow(function (cell, name) {
			var val = 0;
			var bdh = cell.adjborder.bottom, bdv = cell.adjborder.right;
			if (name.charAt(0) === 'n') { val = +name.substr(1); }
			else {
				if (name.match(/h/)) { val += 1; }
				if (name.match(/v/)) { val += 2; }
			}
			if (val & 1) { bdh.line = 1; }
			if (val & 2) { bdv.line = 1; }
			if (val & 4) { bdh.qsub = 2; }
			if (val & 8) { bdv.qsub = 2; }
		});
	}
	encodeBorderLine_XMLAnswer() {
		this.encodeCellXMLArow(function (cell) {
			var val = 0, nodename = '';
			var bdh = cell.adjborder.bottom, bdv = cell.adjborder.right;
			if (bdh.line === 1) { val += 1; }
			if (bdv.line === 1) { val += 2; }
			if (bdh.qsub === 2) { val += 4; }
			if (bdv.qsub === 2) { val += 8; }

			if (val === 0) { nodename = 's'; }
			else if (val === 1) { nodename = 'h'; }
			else if (val === 2) { nodename = 'v'; }
			else if (val === 3) { nodename = 'hv'; }
			else { nodename = 'n' + val; }
			return nodename;
		});
	}
}