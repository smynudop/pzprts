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
import { parseFile } from "../pzpr/parser";
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
	dataarray: string[] | null = null
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
		const puzzle = this.puzzle;
		const bd = puzzle.board;
		const pzl = parseFile(datastr, puzzle.pid);
		if (!pzl) {
			throw new Error(`Invalid File Data.`)
		}
		this.currentType = pzl.type
		const filetype = this.currentType;

		bd.initBoardSize(pzl.cols, pzl.rows);

		this.filever = pzl.filever;
		if (filetype !== Constants.FILE_PBOX_XML) {
			this.lineseek = 0;
			this.dataarray = pzl.body.split("\n");
		}
		else {
			//this.xmldoc = pzl.body;
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
		const puzzle = this.puzzle;
		const bd = puzzle.board;
		const pzl = new FileData('', puzzle.pid);

		this.currentType = filetype = filetype || Constants.FILE_PZPR; /* type===pzl.FILE_AUTO(0)もまとめて変換する */
		option = option || {};

		this.filever = 0;
		this.datastr = "";
		// if (filetype === Constants.FILE_PBOX_XML) {
		// 	this.xmldoc = (new DOMParser()).parseFromString('<?xml version="1.0" encoding="utf-8" ?><puzzle />', 'text/xml');
		// 	const puzzlenode = this.xmldoc.querySelector('puzzle')!;
		// 	puzzlenode.appendChild(this.createXMLNode('board'));
		// 	puzzlenode.appendChild(this.createXMLNode('answer'));
		// }

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
			//pzl.body = this.xmldoc;
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
		const opemgr = this.puzzle.opemgr;
		const bd = this.puzzle.board;
		const len = +(this.readLine().match(/TrialData\((\d+)\)/)![1]);
		for (let i = len - 1; i >= 0; i--) {
			const opes: Operation<any>[] = [];
			const bd1 = bd.freezecopy();
			bd.allclear(false);
			this.decodeData();
			bd.compareData(bd1, (group, c, a) => {
				const obj = bd[group][c];
				// @ts-ignore
				const old = obj[a];
				const num = bd1[group][c][a];
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
		const opemgr = this.puzzle.opemgr;
		const pos = opemgr.position;
		opemgr.disableRecord();
		for (let stage = this.puzzle.board.trialstage; stage > 0; stage--) {
			this.writeLine(`TrialData(${stage})`);
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
		return this.dataarray![this.lineseek - 1];
	}

	getItemList(rows: number) {
		const item = [];
		let line: string;
		for (let i = 0; i < rows; i++) {
			line = this.readLine()
			if (!line) { continue; }
			const array1 = line.split(" ");
			for (let c = 0; c < array1.length; c++) {
				if (array1[c] !== "") { item.push(array1[c]); }
			}
		}
		return item;
	}

	//---------------------------------------------------------------------------
	// fio.writeLine()    ファイルに1行出力する
	//---------------------------------------------------------------------------
	writeLine(data: string | number) {
		if (typeof data === 'number') { data = `${data}`; }
		else { data = data || ''; } // typeof data==='string'
		this.datastr += (`${data}\n`);
	}

	//---------------------------------------------------------------------------
	// fio.decodeObj()     配列で、個別文字列から個別セルなどの設定を行う
	// fio.decodeCell()    配列で、個別文字列から個別セルの設定を行う
	// fio.decodeCross()   配列で、個別文字列から個別Crossの設定を行う
	// fio.decodeBorder()  配列で、個別文字列から個別Borderの設定を行う
	// fio.decodeCellExcell()  配列で、個別文字列から個別セル/Excellの設定を行う
	//---------------------------------------------------------------------------
	decodeObj(func: IDecodeFunc<string>, group: IGroup2, startbx: number, startby: number, endbx: number, endby: number) {
		let bx = startbx;
		let by = startby;
		const step = 2;
		const item = this.getItemList((endby - startby) / step + 1);
		for (let i = 0; i < item.length; i++) {
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
		const puzzle = this.puzzle;
		const bd = puzzle.board;
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
		const step = 2;
		for (let by = startby; by <= endby; by += step) {
			let data = '';
			for (let bx = startbx; bx <= endbx; bx += step) {
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
		const puzzle = this.puzzle;
		const bd = puzzle.board;
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
			if (cell.qnum >= 0) { return `${cell.qnum} `; }
			if (cell.qnum === -2) { return "- "; }
			return ". ";
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
			if (cell.qnum >= 0) { return `${cell.qnum} `; }
			if (cell.qnum === -2) { return "5 "; }
			return ". ";
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
			if (cell.qnum >= 0) { return `${cell.qnum} `; }
			if (cell.qnum === -2) { return "- "; }
			if (cell.qans === 1) { return "# "; }
			if (cell.qsub === 1) { return "+ "; }
			return ". ";
		});
	}
	//---------------------------------------------------------------------------
	// fio.decodeCellDirecQnum() 方向＋問題数字のデコードを行う
	// fio.encodeCellDirecQnum() 方向＋問題数字のエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellDirecQnum() {
		this.decodeCell(function (cell, ca) {
			if (ca !== ".") {
				const inp = ca.split(",");
				cell.qdir = (inp[0] !== "0" ? +inp[0] : 0);
				cell.qnum = (inp[1] !== "-" ? +inp[1] : -2);
			}
		});
	}
	encodeCellDirecQnum() {
		this.encodeCell(function (cell) {
			if (cell.qnum !== -1) {
				const ca1 = (cell.qdir !== 0 ? `${cell.qdir}` : "0");
				const ca2 = (cell.qnum !== -2 ? `${cell.qnum}` : "-");
				return [ca1, ",", ca2, " "].join('');
			}
			return ". ";
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
			if (cell.qsub === 1) { return "+ "; }
			return ". ";
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
			if (cell.qans !== 0) { return `${cell.qans} `; }
			if (cell.qsub === 1) { return "+ "; }
			if (cell.qsub === 2) { return "- "; }
			if (cell.qsub === 3) { return "= "; }
			if (cell.qsub === 4) { return "% "; }
			return ". ";
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
			let ca = ".";
			if (cell.anum !== -1) { ca = `${cell.anum}`; }
			else if (cell.qsub === 1) { ca = "+"; }
			else if (cell.qsub === 2) { ca = "-"; }
			else if (cell.qsub === 3) { ca = "="; }
			else if (cell.qsub === 4) { ca = "%"; }
			else { ca = "."; }
			if (cell.enableSubNumberArray && cell.anum === -1) { ca += this.getCellSnum(cell); }
			return `${ca} `;
		});
	}
	//---------------------------------------------------------------------------
	// fio.setCellSnum() 補助数字のデコードを行う   (decodeCellAnumsubで内部的に使用)
	// fio.getCellSnum() 補助数字のエンコードを行う (encodeCellAnumsubで内部的に使用)
	//---------------------------------------------------------------------------
	setCellSnum(cell: Cell, ca: string) {
		const snumtext = ca.substring(ca.indexOf('[') + 1, ca.indexOf(']'));
		const list = snumtext.split(/,/);
		for (let i = 0; i < list.length; ++i) {
			cell.snum[i] = (!!list[i] ? +list[i] : -1);
		}
		return ca.substr(0, ca.indexOf('['));
	}
	getCellSnum(cell: Cell) {
		const list = [];
		for (let i = 0; i < cell.snum.length; ++i) {
			list[i] = (cell.snum[i] !== -1 ? `${cell.snum[i]}` : '');
		}
		const snumtext = list.join(',');
		return (snumtext !== ',,,' ? `[${snumtext}]` : '');
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
			if (cell.qsub > 0) { return `${cell.qsub} `; }
			return "0 ";
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
			if (cross.qnum >= 0) { return `${cross.qnum} `; }
			if (cross.qnum === -2) { return "- "; }
			return ". ";
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
			return `${border.ques === 1 ? "1" : "0"} `;
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
			if (border.qans === 1) { return "1 "; }
			if (border.qsub === 1) { return "-1 "; }
			return "0 ";
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
			if (border.line > 0) { return `${border.line} `; }
			if (border.qsub === 2) { return "-1 "; }
			return "0 ";
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
		const bd = this.puzzle.board;
		bd.roommgr.rebuild();

		const rooms = bd.roommgr.components;
		this.writeLine(rooms.length);
		let data = '';
		for (let c = 0; c < bd.cell.length; c++) {
			const roomid = rooms.indexOf(bd.cell[c].room);
			data += (`${roomid >= 0 ? roomid : "."} `);
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
		const bd = this.puzzle.board;
		for (let id = 0; id < bd.border.length; id++) {
			const border = bd.border[id];
			const cell1 = border.sidecell[0];
			const cell2 = border.sidecell[1];
			const isdiff = (!cell1.isnull && !cell2.isnull && rdata[cell1.id] !== rdata[cell2.id]);
			border[(isques ? 'ques' : 'qans')] = (isdiff ? 1 : 0);
		}
	}
	//---------------------------------------------------------------------------
	// fio.decodeCellQnum51() [＼]のデコードを行う
	// fio.encodeCellQnum51() [＼]のエンコードを行う
	//---------------------------------------------------------------------------
	decodeCellQnum51() {
		const bd = this.puzzle.board;
		bd.disableInfo(); /* mv.set51cell()用 */
		this.decodeCellExcell(function (obj, ca) {
			if (ca === ".") { return; }
			if (obj.group === 'excell') {
				if (obj.bx !== -1 && obj.by === -1) { obj.qnum2 = +ca; }
				else if (obj.bx === -1 && obj.by !== -1) { obj.qnum = +ca; }
			}
			else if (obj.group === 'cell') {
				const inp = ca.split(",");
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
				return `${(obj.by === -1) ? obj.qnum2 : obj.qnum} `;
			}
			if (obj.group === 'cell') {
				if (obj.ques === 51) {
					return (`${obj.qnum},${obj.qnum2} `);
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
			return ((cell.qnum >= 0) ? `${cell.qnum} ` : ". ");
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
			if (cell.anum === -1) { return "0 "; }
			return `${cell.anum} `;
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
			if (cell.qnum >= 0) { return `${cell.qnum} `; }
			if (cell.qnum === -2) { return "? "; }
			if (cell.qans === 1) { return "# "; }
			if (cell.qsub === 1) { return "+ "; }
			return ". ";
		});
	}

}