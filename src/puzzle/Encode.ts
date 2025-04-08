// Encode.js v3.4.1

import { Puzzle } from "./Puzzle"
import { FileIO } from "./FileData"
import { pzpr } from "../pzpr/core"
import { Parser, URLData } from "../pzpr/parser"

//---------------------------------------------------------------------------
// ★Encodeクラス URLのエンコード/デコードを扱う
//---------------------------------------------------------------------------
// URLエンコード/デコード
// Encodeクラス

//---------------------------------------------------------
export class Encode {
	constructor(puzzle: Puzzle) {
		this.puzzle = puzzle
	}
	puzzle: Puzzle

	pflag = ""
	outpflag = ''
	outcols: number = null
	outrows: number = null
	outbstr = ''
	fio: FileIO

	//---------------------------------------------------------------------------
	// enc.checkpflag()   pflagに指定した文字列が含まれているか調べる
	//---------------------------------------------------------------------------
	// ぱずぷれApplet->v3でURLの仕様が変わったパズル:
	//     creek, gokigen, lits (Applet+c===v3, Applet===v3+d)
	// 何回かURL形式を変更したパズル:
	//     icebarn (v3, Applet+c, Applet), slalom (v3+p, v3+d, v3/Applet)
	// v3になって以降pidを分離したパズルのうち元パズルのURL形式を変更して短くしたパズル:
	//     bonsan, kramma (cを付加)
	// URL形式は同じで表示形式の情報をもたせているパズル:
	//     bosanowa, pipelink, yajilin
	checkpflag(ca: string) { return (this.pflag.indexOf(ca) >= 0); }

	//---------------------------------------------------------------------------
	// enc.decodeURL()   parseURL()を行い、各種各パズルのdecode関数を呼び出す
	// enc.encodeURL()   各種各パズルのencode関数を呼び出し、URLを出力する
	// 
	// enc.decodePzpr()  各パズルのURL入力用(オーバーライド用)
	// enc.encodePzpr()  各パズルのURL出力用(オーバーライド用)
	//---------------------------------------------------------------------------
	decodeURL(url: string) {
		var pzl = Parser.parseURL(url), puzzle = this.puzzle, bd = puzzle.board;
		bd.initBoardSize(pzl.cols, pzl.rows);

		if (!!pzl.body) {
			this.pflag = pzl.pflag;
			this.outbstr = pzl.body;
			switch (pzl.type) {
				case pzl.URL_PZPRV3: case pzl.URL_KANPENP:
					this.decodePzpr(pzl.URL_PZPRV3);
					break;
				case pzl.URL_PZPRAPP:
					this.decodePzpr(pzl.URL_PZPRAPP);
					break;
				case pzl.URL_KANPEN:
					this.fio = this.puzzle.createFileIO();
					this.fio.dataarray = this.outbstr.replace(/_/g, " ").split("/");
					this.decodeKanpen();
					this.fio = null;
					break;
				case pzl.URL_HEYAAPP:
					this.decodeHeyaApp();
					break;
			}
		}

		bd.rebuildInfo();
	}
	encodeURL(type: number) {
		var puzzle = this.puzzle, pid = puzzle.pid, bd = puzzle.board;
		var pzl = new URLData('');

		type = type || pzl.URL_PZPRV3; /* type===pzl.URL_AUTO(0)もまとめて変換する */
		if (type === pzl.URL_KANPEN && pid === 'lits') { type = pzl.URL_KANPENP; }

		this.outpflag = null;
		this.outcols = bd.cols;
		this.outrows = bd.rows;
		this.outbstr = '';

		switch (type) {
			case pzl.URL_PZPRV3:
				this.encodePzpr(pzl.URL_PZPRV3);
				break;

			case pzl.URL_PZPRAPP:
				throw "no Implemention";

			case pzl.URL_KANPENP:
				if (!puzzle.info.exists.kanpen) { throw "no Implemention"; }
				this.encodePzpr(pzl.URL_PZPRAPP);
				this.outpflag = this.outpflag || "";
				break;

			case pzl.URL_KANPEN:
				this.fio = new FileIO(this.puzzle);
				this.encodeKanpen();
				this.outbstr = this.fio.datastr.replace(/\r?\n/g, "/").replace(/ /g, "_");
				this.fio = null;
				break;

			case pzl.URL_HEYAAPP:
				this.encodeHeyaApp();
				break;

			default:
				throw "invalid URL Type";
		}

		pzl.pid = pid;
		pzl.type = type;
		pzl.pflag = this.outpflag;
		pzl.cols = this.outcols;
		pzl.rows = this.outrows;
		pzl.body = this.outbstr;

		return pzl.generate();
	}

	// オーバーライド用
	decodePzpr(type: number) { throw "no Implemention"; }
	encodePzpr(type: number) { throw "no Implemention"; }
	decodeKanpen() { throw "no Implemention"; }
	encodeKanpen() { throw "no Implemention"; }
	decodeHeyaApp() { throw "no Implemention"; }
	encodeHeyaApp() { throw "no Implemention"; }

	//---------------------------------------------------------------------------
	// enc.include()    文字列caはbottomとupの間にあるか
	//---------------------------------------------------------------------------
	include(ca: string, bottom: string, up: string) {
		return (bottom <= ca && ca <= up);
	}

	//---------------------------------------------------------------------------
	// enc.decode4Cell()  quesが0～4までの場合、デコードする
	// enc.encode4Cell()  quesが0～4までの場合、問題部をエンコードする
	//---------------------------------------------------------------------------
	decode4Cell() {
		var c = 0, i = 0, bstr = this.outbstr, bd = this.puzzle.board;
		for (i = 0; i < bstr.length; i++) {
			var cell = bd.cell[c], ca = bstr.charAt(i);
			if (this.include(ca, "0", "4")) { cell.qnum = parseInt(ca, 16); }
			else if (this.include(ca, "5", "9")) { cell.qnum = parseInt(ca, 16) - 5; c++; }
			else if (this.include(ca, "a", "e")) { cell.qnum = parseInt(ca, 16) - 10; c += 2; }
			else if (this.include(ca, "g", "z")) { c += (parseInt(ca, 36) - 16); }
			else if (ca === ".") { cell.qnum = -2; }

			c++;
			if (!bd.cell[c]) { break; }
		}
		this.outbstr = bstr.substr(i + 1);
	}
	encode4Cell() {
		var count = 0, cm = "", bd = this.puzzle.board;
		for (var c = 0; c < bd.cell.length; c++) {
			var pstr = "", qn = bd.cell[c].qnum;

			if (qn >= 0) {
				if (!!bd.cell[c + 1] && bd.cell[c + 1].qnum !== -1) { pstr = "" + qn.toString(16); }
				else if (!!bd.cell[c + 2] && bd.cell[c + 2].qnum !== -1) { pstr = "" + (5 + qn).toString(16); c++; }
				else { pstr = "" + (10 + qn).toString(16); c += 2; }
			}
			else if (qn === -2) { pstr = "."; }
			else { count++; }

			if (count === 0) { cm += pstr; }
			else if (pstr || count === 20) { cm += ((count + 15).toString(36) + pstr); count = 0; }
		}
		if (count > 0) { cm += ((count + 15).toString(36)); }

		this.outbstr += cm;
	}

	//---------------------------------------------------------------------------
	// enc.decode4Cross()  quesが0～4までの場合、デコードする
	// enc.encode4Cross()  quesが0～4までの場合、問題部をエンコードする
	//---------------------------------------------------------------------------
	decode4Cross() {
		var c = 0, i = 0, bstr = this.outbstr, bd = this.puzzle.board;
		for (i = 0; i < bstr.length; i++) {
			var cross = bd.cross[c], ca = bstr.charAt(i);
			if (this.include(ca, "0", "4")) { cross.qnum = parseInt(ca, 16); }
			else if (this.include(ca, "5", "9")) { cross.qnum = parseInt(ca, 16) - 5; c++; }
			else if (this.include(ca, "a", "e")) { cross.qnum = parseInt(ca, 16) - 10; c += 2; }
			else if (this.include(ca, "g", "z")) { c += (parseInt(ca, 36) - 16); }
			else if (ca === ".") { cross.qnum = -2; }

			c++;
			if (!bd.cross[c]) { break; }
		}
		this.outbstr = bstr.substr(i + 1);
	}
	encode4Cross() {
		var count = 0, cm = "", bd = this.puzzle.board;
		for (var c = 0; c < bd.cross.length; c++) {
			var pstr = "", qn = bd.cross[c].qnum;

			if (qn >= 0) {
				if (!!bd.cross[c + 1] && bd.cross[c + 1].qnum !== -1) { pstr = "" + qn.toString(16); }
				else if (!!bd.cross[c + 2] && bd.cross[c + 2].qnum !== -1) { pstr = "" + (5 + qn).toString(16); c++; }
				else { pstr = "" + (10 + qn).toString(16); c += 2; }
			}
			else if (qn === -2) { pstr = "."; }
			else { count++; }

			if (count === 0) { cm += pstr; }
			else if (pstr || count === 20) { cm += ((count + 15).toString(36) + pstr); count = 0; }
		}
		if (count > 0) { cm += ((count + 15).toString(36)); }

		this.outbstr += cm;
	}

	//---------------------------------------------------------------------------
	// enc.decodeNumber10()  quesが0～9までの場合、デコードする
	// enc.encodeNumber10()  quesが0～9までの場合、問題部をエンコードする
	//---------------------------------------------------------------------------
	decodeNumber10() {
		var c = 0, i = 0, bstr = this.outbstr, bd = this.puzzle.board;
		for (i = 0; i < bstr.length; i++) {
			var cell = bd.cell[c], ca = bstr.charAt(i);

			if (ca === '.') { cell.qnum = -2; }
			else if (this.include(ca, "0", "9")) { cell.qnum = parseInt(ca, 10); }
			else if (this.include(ca, "a", "z")) { c += (parseInt(ca, 36) - 10); }

			c++;
			if (!bd.cell[c]) { break; }
		}
		this.outbstr = bstr.substr(i + 1);
	}
	encodeNumber10() {
		var cm = "", count = 0, bd = this.puzzle.board;
		for (var c = 0; c < bd.cell.length; c++) {
			var pstr = "", qn = bd.cell[c].qnum;

			if (qn === -2) { pstr = "."; }
			else if (qn >= 0 && qn < 10) { pstr = qn.toString(10); }
			else { count++; }

			if (count === 0) { cm += pstr; }
			else if (pstr || count === 26) { cm += ((9 + count).toString(36) + pstr); count = 0; }
		}
		if (count > 0) { cm += (9 + count).toString(36); }

		this.outbstr += cm;
	}

	//---------------------------------------------------------------------------
	// enc.decodeNumber16()  quesが0～8192?までの場合、デコードする
	// enc.encodeNumber16()  quesが0～8192?までの場合、問題部をエンコードする
	//---------------------------------------------------------------------------
	decodeNumber16() {
		var c = 0, i = 0, bstr = this.outbstr, bd = this.puzzle.board;
		for (i = 0; i < bstr.length; i++) {
			var cell = bd.cell[c], ca = bstr.charAt(i);

			if (this.include(ca, "0", "9") || this.include(ca, "a", "f")) { cell.qnum = parseInt(ca, 16); }
			else if (ca === '-') { cell.qnum = parseInt(bstr.substr(i + 1, 2), 16); i += 2; }
			else if (ca === '+') { cell.qnum = parseInt(bstr.substr(i + 1, 3), 16); i += 3; }
			else if (ca === '=') { cell.qnum = parseInt(bstr.substr(i + 1, 3), 16) + 4096; i += 3; }
			else if (ca === '%') { cell.qnum = parseInt(bstr.substr(i + 1, 3), 16) + 8192; i += 3; }
			else if (ca === '.') { cell.qnum = -2; }
			else if (ca >= 'g' && ca <= 'z') { c += (parseInt(ca, 36) - 16); }

			c++;
			if (!bd.cell[c]) { break; }
		}
		this.outbstr = bstr.substr(i + 1);
	}
	encodeNumber16() {
		var count = 0, cm = "", bd = this.puzzle.board;
		for (var c = 0; c < bd.cell.length; c++) {
			var pstr = "", qn = bd.cell[c].qnum;

			if (qn === -2) { pstr = "."; }
			else if (qn >= 0 && qn < 16) { pstr = qn.toString(16); }
			else if (qn >= 16 && qn < 256) { pstr = "-" + qn.toString(16); }
			else if (qn >= 256 && qn < 4096) { pstr = "+" + qn.toString(16); }
			else if (qn >= 4096 && qn < 8192) { pstr = "=" + (qn - 4096).toString(16); }
			else if (qn >= 8192) { pstr = "%" + (qn - 8192).toString(16); }
			else { count++; }

			if (count === 0) { cm += pstr; }
			else if (pstr || count === 20) { cm += ((15 + count).toString(36) + pstr); count = 0; }
		}
		if (count > 0) { cm += (15 + count).toString(36); }

		this.outbstr += cm;
	}

	//---------------------------------------------------------------------------
	// enc.decodeRoomNumber16()  部屋＋部屋の一つのquesが0～8192?までの場合、デコードする
	// enc.encodeRoomNumber16()  部屋＋部屋の一つのquesが0～8192?までの場合、問題部をエンコードする
	//---------------------------------------------------------------------------
	decodeRoomNumber16() {
		var r = 0, i = 0, bstr = this.outbstr, bd = this.puzzle.board;
		bd.roommgr.rebuild();
		for (i = 0; i < bstr.length; i++) {
			var ca = bstr.charAt(i), top = bd.roommgr.components[r].top;

			if (this.include(ca, "0", "9") || this.include(ca, "a", "f")) { top.qnum = parseInt(ca, 16); }
			else if (ca === '-') { top.qnum = parseInt(bstr.substr(i + 1, 2), 16); i += 2; }
			else if (ca === '+') { top.qnum = parseInt(bstr.substr(i + 1, 3), 16); i += 3; }
			else if (ca === '=') { top.qnum = parseInt(bstr.substr(i + 1, 3), 16) + 4096; i += 3; }
			else if (ca === '%') { top.qnum = parseInt(bstr.substr(i + 1, 3), 16) + 8192; i += 3; }
			else if (ca === '*') { top.qnum = parseInt(bstr.substr(i + 1, 4), 16) + 12240; i += 4; }
			else if (ca === '$') { top.qnum = parseInt(bstr.substr(i + 1, 5), 16) + 77776; i += 5; }
			else if (ca >= 'g' && ca <= 'z') { r += (parseInt(ca, 36) - 16); }

			r++;
			if (r >= bd.roommgr.components.length) { break; }
		}
		this.outbstr = bstr.substr(i + 1);
	}
	encodeRoomNumber16() {
		var count = 0, cm = "", bd = this.puzzle.board;
		bd.roommgr.rebuild();
		for (var r = 0; r < bd.roommgr.components.length; r++) {
			var pstr = "", qn = bd.roommgr.components[r].top.qnum;

			if (qn >= 0 && qn < 16) { pstr = qn.toString(16); }
			else if (qn >= 16 && qn < 256) { pstr = "-" + qn.toString(16); }
			else if (qn >= 256 && qn < 4096) { pstr = "+" + qn.toString(16); }
			else if (qn >= 4096 && qn < 8192) { pstr = "=" + (qn - 4096).toString(16); }
			else if (qn >= 8192 && qn < 12240) { pstr = "%" + (qn - 8192).toString(16); }
			else if (qn >= 12240 && qn < 77776) { pstr = "*" + (qn - 12240).toString(16); }
			else if (qn >= 77776) { pstr = "$" + (qn - 77776).toString(16); } // 最大1126352
			else { count++; }

			if (count === 0) { cm += pstr; }
			else if (pstr || count === 20) { cm += ((15 + count).toString(36) + pstr); count = 0; }
		}
		if (count > 0) { cm += (15 + count).toString(36); }

		this.outbstr += cm;
	}

	//---------------------------------------------------------------------------
	// enc.decodeArrowNumber16()  矢印付きquesが0～8192?までの場合、デコードする
	// enc.encodeArrowNumber16()  矢印付きquesが0～8192?までの場合、問題部をエンコードする
	//---------------------------------------------------------------------------
	decodeArrowNumber16() {
		var c = 0, i = 0, bstr = this.outbstr, bd = this.puzzle.board;
		for (i = 0; i < bstr.length; i++) {
			var ca = bstr.charAt(i), cell = bd.cell[c];

			if (this.include(ca, "0", "4")) {
				var ca1 = bstr.charAt(i + 1);
				cell.qdir = parseInt(ca, 16);
				cell.qnum = (ca1 !== "." ? parseInt(ca1, 16) : -2);
				i++;
			}
			else if (this.include(ca, "5", "9")) {
				cell.qdir = parseInt(ca, 16) - 5;
				cell.qnum = parseInt(bstr.substr(i + 1, 2), 16);
				i += 2;
			}
			else if (ca === "-") {
				cell.qdir = parseInt(bstr.substr(i + 1, 1), 16);
				cell.qnum = parseInt(bstr.substr(i + 2, 3), 16);
				i += 4;
			}
			else if (ca >= 'a' && ca <= 'z') { c += (parseInt(ca, 36) - 10); }

			c++;
			if (!bd.cell[c]) { break; }
		}
		this.outbstr = bstr.substr(i + 1);
	}
	encodeArrowNumber16() {
		var cm = "", count = 0, bd = this.puzzle.board;
		for (var c = 0; c < bd.cell.length; c++) {
			var pstr = "", dir = bd.cell[c].qdir, qn = bd.cell[c].qnum;
			if (qn === -2) { pstr = (dir) + "."; }
			else if (qn >= 0 && qn < 16) { pstr = (dir) + qn.toString(16); }
			else if (qn >= 16 && qn < 256) { pstr = (dir + 5) + qn.toString(16); }
			else if (qn >= 256 && qn < 4096) { pstr = "-" + (dir) + qn.toString(16); }
			else { count++; }

			if (count === 0) { cm += pstr; }
			else if (pstr || count === 26) { cm += ((count + 9).toString(36) + pstr); count = 0; }
		}
		if (count > 0) { cm += (count + 9).toString(36); }

		this.outbstr += cm;
	}

	//---------------------------------------------------------------------------
	// enc.decodeBorder() 問題の境界線をデコードする
	// enc.encodeBorder() 問題の境界線をエンコードする
	//---------------------------------------------------------------------------
	decodeBorder() {
		var pos1, pos2, bstr = this.outbstr, id, twi = [16, 8, 4, 2, 1];
		var bd = this.puzzle.board;

		if (bstr) {
			pos1 = Math.min(((((bd.cols - 1) * bd.rows + 4) / 5) | 0), bstr.length);
			pos2 = Math.min((((bd.cols * (bd.rows - 1) + 4) / 5) | 0) + pos1, bstr.length);
		}
		else { pos1 = 0; pos2 = 0; }

		id = 0;
		for (var i = 0; i < pos1; i++) {
			var ca = parseInt(bstr.charAt(i), 32);
			for (var w = 0; w < 5; w++) {
				if (id < (bd.cols - 1) * bd.rows) {
					bd.border[id].ques = ((ca & twi[w]) ? 1 : 0);
					id++;
				}
			}
		}

		id = (bd.cols - 1) * bd.rows;
		for (let i = pos1; i < pos2; i++) {
			var ca = parseInt(bstr.charAt(i), 32);
			for (var w = 0; w < 5; w++) {
				var border = bd.border[id];
				if (!!border && border.inside) {
					border.ques = ((ca & twi[w]) ? 1 : 0);
					id++;
				}
			}
		}

		bd.roommgr.rebuild();
		this.outbstr = bstr.substr(pos2);
	}
	encodeBorder() {
		var cm = "", twi = [16, 8, 4, 2, 1], num = 0, pass = 0;
		var bd = this.puzzle.board;

		for (var id = 0; id < (bd.cols - 1) * bd.rows; id++) {
			pass += (bd.border[id].ques * twi[num]); num++;
			if (num === 5) { cm += pass.toString(32); num = 0; pass = 0; }
		}
		if (num > 0) { cm += pass.toString(32); }

		num = 0; pass = 0;
		for (var id = (bd.cols - 1) * bd.rows; id < (2 * bd.cols * bd.rows - bd.cols - bd.rows); id++) {
			pass += (bd.border[id].ques * twi[num]); num++;
			if (num === 5) { cm += pass.toString(32); num = 0; pass = 0; }
		}
		if (num > 0) { cm += pass.toString(32); }

		this.outbstr += cm;
	}

	//---------------------------------------------------------------------------
	// enc.decodeCrossMark() 黒点をデコードする
	// enc.encodeCrossMark() 黒点をエンコードする
	//---------------------------------------------------------------------------
	decodeCrossMark() {
		var cc = 0, i = 0, bstr = this.outbstr, bd = this.puzzle.board;
		var cp = (bd.hascross === 2 ? 1 : 0), cp2 = (cp << 1);
		var rows = (bd.rows - 1 + cp2), cols = (bd.cols - 1 + cp2);
		for (i = 0; i < bstr.length; i++) {
			var ca = bstr.charAt(i);

			if (this.include(ca, "0", "9") || this.include(ca, "a", "z")) {
				cc += parseInt(ca, 36);
				var bx = ((cc % cols + (1 - cp)) << 1);
				var by = ((((cc / cols) | 0) + (1 - cp)) << 1);

				if (by > bd.maxby - 2 * (1 - cp)) { i++; break; }
				bd.getx(bx, by).qnum = 1;
			}
			else if (ca === '.') { cc += 35; }

			cc++;
			if (cc >= cols * rows) { i++; break; }
		}
		this.outbstr = bstr.substr(i);
	}
	encodeCrossMark() {
		var cm = "", count = 0, bd = this.puzzle.board;
		var cp = (bd.hascross === 2 ? 1 : 0), cp2 = (cp << 1);
		var rows = (bd.rows - 1 + cp2), cols = (bd.cols - 1 + cp2);
		for (var c = 0, max = cols * rows; c < max; c++) {
			var pstr = "";
			var bx = ((c % cols + (1 - cp)) << 1);
			var by = ((((c / cols) | 0) + (1 - cp)) << 1);

			if (bd.getx(bx, by).qnum === 1) { pstr = "."; }
			else { count++; }

			if (pstr) { cm += count.toString(36); count = 0; }
			else if (count === 36) { cm += "."; count = 0; }
		}
		if (count > 0) { cm += count.toString(36); }

		this.outbstr += cm;
	}

	//---------------------------------------------------------------------------
	// enc.decodeCircle() 白丸・黒丸をデコードする
	// enc.encodeCircle() 白丸・黒丸をエンコードする
	//---------------------------------------------------------------------------
	decodeCircle() {
		var bd = this.puzzle.board;
		var bstr = this.outbstr, c = 0, tri = [9, 3, 1];
		var pos = (bstr ? Math.min(((bd.cols * bd.rows + 2) / 3) | 0, bstr.length) : 0);
		for (var i = 0; i < pos; i++) {
			var ca = parseInt(bstr.charAt(i), 27);
			for (var w = 0; w < 3; w++) {
				if (!!bd.cell[c]) {
					var val = ((ca / tri[w]) | 0) % 3;
					if (val > 0) { bd.cell[c].qnum = val; }
					c++;
				}
			}
		}
		this.outbstr = bstr.substr(pos);
	}
	encodeCircle() {
		var bd = this.puzzle.board;
		var cm = "", num = 0, pass = 0, tri = [9, 3, 1];
		for (var c = 0; c < bd.cell.length; c++) {
			if (bd.cell[c].qnum > 0) { pass += (bd.cell[c].qnum * tri[num]); }
			num++;
			if (num === 3) { cm += pass.toString(27); num = 0; pass = 0; }
		}
		if (num > 0) { cm += pass.toString(27); }

		this.outbstr += cm;
	}

	//---------------------------------------------------------------------------
	// enc.decodeIce() cell.ques===6をデコードする
	// enc.encodeIce() cell.ques===6をエンコードする
	//---------------------------------------------------------------------------
	decodeIce() {
		var bstr = this.outbstr, bd = this.puzzle.board;

		var c = 0, twi = [16, 8, 4, 2, 1];
		for (var i = 0; i < bstr.length; i++) {
			var num = parseInt(bstr.charAt(i), 32);
			for (var w = 0; w < 5; w++) {
				if (!!bd.cell[c]) {
					bd.cell[c].ques = (num & twi[w] ? 6 : 0);
					c++;
				}
			}
			if (!bd.cell[c]) { break; }
		}
		this.outbstr = bstr.substr(i + 1);
	}
	encodeIce() {
		var cm = "", num = 0, pass = 0, twi = [16, 8, 4, 2, 1], bd = this.puzzle.board;
		for (var c = 0; c < bd.cell.length; c++) {
			if (bd.cell[c].ques === 6) { pass += twi[num]; } num++;
			if (num === 5) { cm += pass.toString(32); num = 0; pass = 0; }
		}
		if (num > 0) { cm += pass.toString(32); }

		this.outbstr += cm;
	}

	//---------------------------------------------------------------------------
	// enc.decodecross_old() Crossの問題部をデコードする(旧形式)
	//---------------------------------------------------------------------------
	decodecross_old() {
		var bstr = this.outbstr, c = 0, bd = this.puzzle.board;
		for (var i = 0; i < bstr.length; i++) {
			var ca = bstr.charAt(i);
			if (this.include(ca, "0", "4")) { bd.cross[c].qnum = parseInt(ca, 10); }

			c++;
			if (!bd.cross[c]) { i++; break; }
		}

		this.outbstr = bstr.substr(i);
	}
}
