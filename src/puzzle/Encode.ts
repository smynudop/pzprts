// Encode.js v3.4.1

import type { Puzzle } from "./Puzzle"
import { FileIO } from "./FileData"
import { pzpr } from "../pzpr/core"
import { parseURL } from "../pzpr/parser"
import { URLData } from "../pzpr/urlData"
import * as Constants from "../pzpr/constants"

export type Converter = {
	decode: (puzzle: Puzzle, str: string) => string
	encode: (puzzle: Puzzle) => string
}

export const decodeURL = (puzzle: Puzzle, url: string, converters: Converter[]) => {
	const pzl = parseURL(url)
	const bd = puzzle.board;
	bd.initBoardSize(pzl.cols, pzl.rows);

	let bstr = pzl.body
	for (const cnv of converters) {
		bstr = cnv.decode(puzzle, bstr)
	}

	bd.rebuildInfo();
}

export const encodeURL = (puzzle: Puzzle, converters: Converter[]) => {
	const pid = puzzle.pid;
	const bd = puzzle.board;
	const pzl = new URLData();

	let bstr = ""
	for (const cnv of converters) {
		bstr += cnv.encode(puzzle)
	}

	pzl.pid = pid;
	pzl.type = Constants.URL_PZPRV3;
	pzl.cols = bd.cols;
	pzl.rows = bd.rows;
	pzl.body = bstr;

	return pzl.generate();
}

//---------------------------------------------------------------------------
// enc.include()    文字列caはbottomとupの間にあるか
//----------------------------------------------------------------------------
export const include = (ca: string, bottom: string, up: string) => {
	return (bottom <= ca && ca <= up);
}

export const cell4 = {
	decode: (puzzle: Puzzle, bstr: string): string => {
		let c = 0
		let i = 0
		const bd = puzzle.board
		for (i = 0; i < bstr.length; i++) {
			const cell = bd.cell[c];
			const ca = bstr.charAt(i);
			if (include(ca, "0", "4")) { cell.qnum = Number.parseInt(ca, 16); }
			else if (include(ca, "5", "9")) { cell.qnum = Number.parseInt(ca, 16) - 5; c++; }
			else if (include(ca, "a", "e")) { cell.qnum = Number.parseInt(ca, 16) - 10; c += 2; }
			else if (include(ca, "g", "z")) { c += (Number.parseInt(ca, 36) - 16); }
			else if (ca === ".") { cell.qnum = -2; }

			c++;
			if (!bd.cell[c]) { break; }
		}
		return bstr.substring(i + 1);
	},
	encode: (puzzle: Puzzle): string => {
		let count = 0;
		let cm = "";
		const bd = puzzle.board;
		for (let c = 0; c < bd.cell.length; c++) {
			let pstr = "";
			const qn = bd.cell[c].qnum;

			if (qn >= 0) {
				if (!!bd.cell[c + 1] && bd.cell[c + 1].qnum !== -1) { pstr = `${qn.toString(16)}`; }
				else if (!!bd.cell[c + 2] && bd.cell[c + 2].qnum !== -1) { pstr = `${(5 + qn).toString(16)}`; c++; }
				else { pstr = `${(10 + qn).toString(16)}`; c += 2; }
			}
			else if (qn === -2) { pstr = "."; }
			else { count++; }

			if (count === 0) { cm += pstr; }
			else if (pstr || count === 20) { cm += ((count + 15).toString(36) + pstr); count = 0; }
		}
		if (count > 0) { cm += ((count + 15).toString(36)); }

		return cm
	}
}

const cross4 = {
	//---------------------------------------------------------------------------
	// enc.decode4Cross()  quesが0～4までの場合、デコードする
	// enc.encode4Cross()  quesが0～4までの場合、問題部をエンコードする
	//---------------------------------------------------------------------------
	decode: (puzzle: Puzzle, bstr: string): string => {
		let c = 0;
		let i = 0;
		const bd = puzzle.board;
		for (i = 0; i < bstr.length; i++) {
			const cross = bd.cross[c];
			const ca = bstr.charAt(i);
			if (include(ca, "0", "4")) { cross.qnum = Number.parseInt(ca, 16); }
			else if (include(ca, "5", "9")) { cross.qnum = Number.parseInt(ca, 16) - 5; c++; }
			else if (include(ca, "a", "e")) { cross.qnum = Number.parseInt(ca, 16) - 10; c += 2; }
			else if (include(ca, "g", "z")) { c += (Number.parseInt(ca, 36) - 16); }
			else if (ca === ".") { cross.qnum = -2; }

			c++;
			if (!bd.cross[c]) { break; }
		}
		return bstr.substring(i + 1);
	},
	encode: (puzzle: Puzzle): string => {
		let count = 0;
		let cm = "";
		const bd = puzzle.board;
		for (let c = 0; c < bd.cross.length; c++) {
			let pstr = "";
			const qn = bd.cross[c].qnum;

			if (qn >= 0) {
				if (!!bd.cross[c + 1] && bd.cross[c + 1].qnum !== -1) { pstr = `${qn.toString(16)}`; }
				else if (!!bd.cross[c + 2] && bd.cross[c + 2].qnum !== -1) { pstr = `${(5 + qn).toString(16)}`; c++; }
				else { pstr = `${(10 + qn).toString(16)}`; c += 2; }
			}
			else if (qn === -2) { pstr = "."; }
			else { count++; }

			if (count === 0) { cm += pstr; }
			else if (pstr || count === 20) { cm += ((count + 15).toString(36) + pstr); count = 0; }
		}
		if (count > 0) { cm += ((count + 15).toString(36)); }

		return cm;
	}
}

const number10 = {
	//---------------------------------------------------------------------------
	// enc.decodeNumber10()  quesが0～9までの場合、デコードする
	// enc.encodeNumber10()  quesが0～9までの場合、問題部をエンコードする
	//---------------------------------------------------------------------------
	decode: (puzzle: Puzzle, bstr: string): string => {
		let c = 0;
		let i = 0;
		const bd = puzzle.board;
		for (i = 0; i < bstr.length; i++) {
			const cell = bd.cell[c];
			const ca = bstr.charAt(i);

			if (ca === '.') { cell.qnum = -2; }
			else if (include(ca, "0", "9")) { cell.qnum = Number.parseInt(ca, 10); }
			else if (include(ca, "a", "z")) { c += (Number.parseInt(ca, 36) - 10); }

			c++;
			if (!bd.cell[c]) { break; }
		}
		return bstr.substring(i + 1);
	},
	encode: (puzzle: Puzzle): string => {
		let cm = "";
		let count = 0;
		const bd = puzzle.board;
		for (let c = 0; c < bd.cell.length; c++) {
			let pstr = "";
			const qn = bd.cell[c].qnum;

			if (qn === -2) { pstr = "."; }
			else if (qn >= 0 && qn < 10) { pstr = qn.toString(10); }
			else { count++; }

			if (count === 0) { cm += pstr; }
			else if (pstr || count === 26) { cm += ((9 + count).toString(36) + pstr); count = 0; }
		}
		if (count > 0) { cm += (9 + count).toString(36); }

		return cm;
	}
}

export const number16 = {
	//---------------------------------------------------------------------------
	// enc.decodeNumber16()  quesが0～8192?までの場合、デコードする
	// enc.encodeNumber16()  quesが0～8192?までの場合、問題部をエンコードする
	//---------------------------------------------------------------------------
	decode: (puzzle: Puzzle, bstr: string): string => {
		let c = 0;
		let i = 0;
		const bd = puzzle.board;
		for (i = 0; i < bstr.length; i++) {
			const cell = bd.cell[c];
			const ca = bstr.charAt(i);

			if (include(ca, "0", "9") || include(ca, "a", "f")) { cell.qnum = Number.parseInt(ca, 16); }
			else if (ca === '-') { cell.qnum = Number.parseInt(bstr.substr(i + 1, 2), 16); i += 2; }
			else if (ca === '+') { cell.qnum = Number.parseInt(bstr.substr(i + 1, 3), 16); i += 3; }
			else if (ca === '=') { cell.qnum = Number.parseInt(bstr.substr(i + 1, 3), 16) + 4096; i += 3; }
			else if (ca === '%') { cell.qnum = Number.parseInt(bstr.substr(i + 1, 3), 16) + 8192; i += 3; }
			else if (ca === '.') { cell.qnum = -2; }
			else if (ca >= 'g' && ca <= 'z') { c += (Number.parseInt(ca, 36) - 16); }

			c++;
			if (!bd.cell[c]) { break; }
		}
		return bstr.substring(i + 1);
	},
	encode: (puzzle: Puzzle): string => {
		let count = 0;
		let cm = "";
		const bd = puzzle.board;
		for (let c = 0; c < bd.cell.length; c++) {
			let pstr = "";
			const qn = bd.cell[c].qnum;

			if (qn === -2) { pstr = "."; }
			else if (qn >= 0 && qn < 16) { pstr = qn.toString(16); }
			else if (qn >= 16 && qn < 256) { pstr = `-${qn.toString(16)}`; }
			else if (qn >= 256 && qn < 4096) { pstr = `+${qn.toString(16)}`; }
			else if (qn >= 4096 && qn < 8192) { pstr = `=${(qn - 4096).toString(16)}`; }
			else if (qn >= 8192) { pstr = `%${(qn - 8192).toString(16)}`; }
			else { count++; }

			if (count === 0) { cm += pstr; }
			else if (pstr || count === 20) { cm += ((15 + count).toString(36) + pstr); count = 0; }
		}
		if (count > 0) { cm += (15 + count).toString(36); }

		return cm;
	}
}
export const roomNumber16 = {
	//---------------------------------------------------------------------------
	// enc.decodeRoomNumber16()  部屋＋部屋の一つのquesが0～8192?までの場合、デコードする
	// enc.encodeRoomNumber16()  部屋＋部屋の一つのquesが0～8192?までの場合、問題部をエンコードする
	//---------------------------------------------------------------------------
	decode: (puzzle: Puzzle, bstr: string): string => {
		let r = 0;
		let i = 0;
		const bd = puzzle.board;
		console.log(bstr)
		bd.roommgr.rebuild();
		for (i = 0; i < bstr.length; i++) {
			const ca = bstr.charAt(i);
			const top = bd.roommgr.components[r].top;

			if (include(ca, "0", "9") || include(ca, "a", "f")) { console.log(ca); top.qnum = Number.parseInt(ca, 16); }
			else if (ca === '-') { top.qnum = Number.parseInt(bstr.substr(i + 1, 2), 16); i += 2; }
			else if (ca === '+') { top.qnum = Number.parseInt(bstr.substr(i + 1, 3), 16); i += 3; }
			else if (ca === '=') { top.qnum = Number.parseInt(bstr.substr(i + 1, 3), 16) + 4096; i += 3; }
			else if (ca === '%') { top.qnum = Number.parseInt(bstr.substr(i + 1, 3), 16) + 8192; i += 3; }
			else if (ca === '*') { top.qnum = Number.parseInt(bstr.substr(i + 1, 4), 16) + 12240; i += 4; }
			else if (ca === '$') { top.qnum = Number.parseInt(bstr.substr(i + 1, 5), 16) + 77776; i += 5; }
			else if (ca >= 'g' && ca <= 'z') { r += (Number.parseInt(ca, 36) - 16); }

			r++;
			if (r >= bd.roommgr.components.length) { break; }
		}
		return bstr.substring(i + 1);
	},
	encode: (puzzle: Puzzle): string => {
		let count = 0;
		let cm = "";
		const bd = puzzle.board;
		bd.roommgr.rebuild();
		for (let r = 0; r < bd.roommgr.components.length; r++) {
			let pstr = "";
			const qn = bd.roommgr.components[r].top.qnum;

			if (qn >= 0 && qn < 16) { pstr = qn.toString(16); }
			else if (qn >= 16 && qn < 256) { pstr = `-${qn.toString(16)}`; }
			else if (qn >= 256 && qn < 4096) { pstr = `+${qn.toString(16)}`; }
			else if (qn >= 4096 && qn < 8192) { pstr = `=${(qn - 4096).toString(16)}`; }
			else if (qn >= 8192 && qn < 12240) { pstr = `%${(qn - 8192).toString(16)}`; }
			else if (qn >= 12240 && qn < 77776) { pstr = `*${(qn - 12240).toString(16)}`; }
			else if (qn >= 77776) { pstr = `$${(qn - 77776).toString(16)}`; } // 最大1126352
			else { count++; }

			if (count === 0) { cm += pstr; }
			else if (pstr || count === 20) { cm += ((15 + count).toString(36) + pstr); count = 0; }
		}
		if (count > 0) { cm += (15 + count).toString(36); }

		return cm;
	}
}

const arrowNumber16 = {
	//---------------------------------------------------------------------------
	// enc.decodeArrowNumber16()  矢印付きquesが0～8192?までの場合、デコードする
	// enc.encodeArrowNumber16()  矢印付きquesが0～8192?までの場合、問題部をエンコードする
	//---------------------------------------------------------------------------
	decode: (puzzle: Puzzle, bstr: string): string => {
		let c = 0;
		let i = 0;
		const bd = puzzle.board;
		for (i = 0; i < bstr.length; i++) {
			const ca = bstr.charAt(i);
			const cell = bd.cell[c];

			if (include(ca, "0", "4")) {
				const ca1 = bstr.charAt(i + 1);
				cell.qdir = Number.parseInt(ca, 16);
				cell.qnum = (ca1 !== "." ? Number.parseInt(ca1, 16) : -2);
				i++;
			}
			else if (include(ca, "5", "9")) {
				cell.qdir = Number.parseInt(ca, 16) - 5;
				cell.qnum = Number.parseInt(bstr.substr(i + 1, 2), 16);
				i += 2;
			}
			else if (ca === "-") {
				cell.qdir = Number.parseInt(bstr.substr(i + 1, 1), 16);
				cell.qnum = Number.parseInt(bstr.substr(i + 2, 3), 16);
				i += 4;
			}
			else if (ca >= 'a' && ca <= 'z') { c += (Number.parseInt(ca, 36) - 10); }

			c++;
			if (!bd.cell[c]) { break; }
		}
		return bstr.substring(i + 1);
	},
	encode: (puzzle: Puzzle): string => {
		let cm = "";
		let count = 0;
		const bd = puzzle.board;
		for (let c = 0; c < bd.cell.length; c++) {
			let pstr = "";
			const dir = bd.cell[c].qdir;
			const qn = bd.cell[c].qnum;
			if (qn === -2) { pstr = `${dir}.`; }
			else if (qn >= 0 && qn < 16) { pstr = (dir) + qn.toString(16); }
			else if (qn >= 16 && qn < 256) { pstr = (dir + 5) + qn.toString(16); }
			else if (qn >= 256 && qn < 4096) { pstr = `-${dir}${qn.toString(16)}`; }
			else { count++; }

			if (count === 0) { cm += pstr; }
			else if (pstr || count === 26) { cm += ((count + 9).toString(36) + pstr); count = 0; }
		}
		if (count > 0) { cm += (count + 9).toString(36); }

		return cm;
	}
}

export const border = {
	//---------------------------------------------------------------------------
	// enc.decodeBorder() 問題の境界線をデコードする
	// enc.encodeBorder() 問題の境界線をエンコードする
	//---------------------------------------------------------------------------
	decode: (puzzle: Puzzle, bstr: string): string => {
		let pos1: number;
		let pos2: number;
		let id: number;
		const twi = [16, 8, 4, 2, 1];
		const bd = puzzle.board;

		if (bstr) {
			pos1 = Math.min(((((bd.cols - 1) * bd.rows + 4) / 5) | 0), bstr.length);
			pos2 = Math.min((((bd.cols * (bd.rows - 1) + 4) / 5) | 0) + pos1, bstr.length);
		}
		else { pos1 = 0; pos2 = 0; }

		id = 0;
		for (let i = 0; i < pos1; i++) {
			const ca = Number.parseInt(bstr.charAt(i), 32);
			for (let w = 0; w < 5; w++) {
				if (id < (bd.cols - 1) * bd.rows) {
					bd.border[id].ques = ((ca & twi[w]) ? 1 : 0);
					id++;
				}
			}
		}

		id = (bd.cols - 1) * bd.rows;
		for (let i = pos1; i < pos2; i++) {
			const ca = Number.parseInt(bstr.charAt(i), 32);
			for (let w = 0; w < 5; w++) {
				const border = bd.border[id];
				if (!!border && border.inside) {
					border.ques = ((ca & twi[w]) ? 1 : 0);
					id++;
				}
			}
		}

		bd.roommgr.rebuild();
		console.log(pos2)
		return bstr.substring(pos2);
	},
	encode: (puzzle: Puzzle): string => {
		let cm = "";
		const twi = [16, 8, 4, 2, 1];
		let num = 0;
		let pass = 0;
		const bd = puzzle.board;

		for (let id = 0; id < (bd.cols - 1) * bd.rows; id++) {
			pass += (bd.border[id].ques * twi[num]); num++;
			if (num === 5) { cm += pass.toString(32); num = 0; pass = 0; }
		}
		if (num > 0) { cm += pass.toString(32); }

		num = 0; pass = 0;
		for (let id = (bd.cols - 1) * bd.rows; id < (2 * bd.cols * bd.rows - bd.cols - bd.rows); id++) {
			pass += (bd.border[id].ques * twi[num]); num++;
			if (num === 5) { cm += pass.toString(32); num = 0; pass = 0; }
		}
		if (num > 0) { cm += pass.toString(32); }

		return cm;
	}
}

const crossMark = {
	//---------------------------------------------------------------------------
	// enc.decodeCrossMark() 黒点をデコードする
	// enc.encodeCrossMark() 黒点をエンコードする
	//---------------------------------------------------------------------------
	decode: (puzzle: Puzzle, bstr: string): string => {
		let cc = 0;
		let i = 0;
		const bd = puzzle.board;
		const cp = (bd.hascross === 2 ? 1 : 0);
		const cp2 = (cp << 1);
		const rows = (bd.rows - 1 + cp2);
		const cols = (bd.cols - 1 + cp2);
		for (i = 0; i < bstr.length; i++) {
			const ca = bstr.charAt(i);

			if (include(ca, "0", "9") || include(ca, "a", "z")) {
				cc += Number.parseInt(ca, 36);
				const bx = ((cc % cols + (1 - cp)) << 1);
				const by = ((((cc / cols) | 0) + (1 - cp)) << 1);

				if (by > bd.maxby - 2 * (1 - cp)) { i++; break; }
				bd.getx(bx, by).qnum = 1;
			}
			else if (ca === '.') { cc += 35; }

			cc++;
			if (cc >= cols * rows) { i++; break; }
		}
		return bstr.substring(i);
	},
	encode: (puzzle: Puzzle): string => {
		let cm = "";
		let count = 0;
		const bd = puzzle.board;
		const cp = (bd.hascross === 2 ? 1 : 0);
		const cp2 = (cp << 1);
		const rows = (bd.rows - 1 + cp2);
		const cols = (bd.cols - 1 + cp2);
		for (let c = 0, max = cols * rows; c < max; c++) {
			let pstr = "";
			const bx = ((c % cols + (1 - cp)) << 1);
			const by = ((((c / cols) | 0) + (1 - cp)) << 1);

			if (bd.getx(bx, by).qnum === 1) { pstr = "."; }
			else { count++; }

			if (pstr) { cm += count.toString(36); count = 0; }
			else if (count === 36) { cm += "."; count = 0; }
		}
		if (count > 0) { cm += count.toString(36); }

		return cm;
	}
}

export const circle = {
	//---------------------------------------------------------------------------
	// enc.decodeCircle() 白丸・黒丸をデコードする
	// enc.encodeCircle() 白丸・黒丸をエンコードする
	//---------------------------------------------------------------------------
	decode: (puzzle: Puzzle, bstr: string): string => {
		const bd = puzzle.board;
		let c = 0;
		const tri = [9, 3, 1];
		const pos = (bstr ? Math.min(((bd.cols * bd.rows + 2) / 3) | 0, bstr.length) : 0);
		for (let i = 0; i < pos; i++) {
			const ca = Number.parseInt(bstr.charAt(i), 27);
			for (let w = 0; w < 3; w++) {
				if (!!bd.cell[c]) {
					const val = ((ca / tri[w]) | 0) % 3;
					if (val > 0) { bd.cell[c].qnum = val; }
					c++;
				}
			}
		}
		return bstr.substring(pos);
	},
	encode: (puzzle: Puzzle): string => {
		const bd = puzzle.board;
		let cm = "";
		let num = 0;
		let pass = 0;
		const tri = [9, 3, 1];
		for (let c = 0; c < bd.cell.length; c++) {
			if (bd.cell[c].qnum > 0) { pass += (bd.cell[c].qnum * tri[num]); }
			num++;
			if (num === 3) { cm += pass.toString(27); num = 0; pass = 0; }
		}
		if (num > 0) { cm += pass.toString(27); }

		return cm;
	}
}

const ice = {
	//---------------------------------------------------------------------------
	// enc.decodeIce() cell.ques===6をデコードする
	// enc.encodeIce() cell.ques===6をエンコードする
	//---------------------------------------------------------------------------
	decode: (puzzle: Puzzle, bstr: string): string => {
		const bd = puzzle.board;

		let c = 0;
		const twi = [16, 8, 4, 2, 1];
		let ii = 0
		for (let i = 0; i < bstr.length; i++) {
			ii = i
			const num = Number.parseInt(bstr.charAt(i), 32);
			for (let w = 0; w < 5; w++) {
				if (!!bd.cell[c]) {
					bd.cell[c].ques = (num & twi[w] ? 6 : 0);
					c++;
				}
			}
			if (!bd.cell[c]) { break; }
		}
		return bstr.substring(ii + 1);
	},
	encode: (puzzle: Puzzle): string => {
		let cm = "";
		let num = 0;
		let pass = 0;
		const twi = [16, 8, 4, 2, 1];
		const bd = puzzle.board;
		for (let c = 0; c < bd.cell.length; c++) {
			if (bd.cell[c].ques === 6) { pass += twi[num]; } num++;
			if (num === 5) { cm += pass.toString(32); num = 0; pass = 0; }
		}
		if (num > 0) { cm += pass.toString(32); }

		return cm;
	}
}
