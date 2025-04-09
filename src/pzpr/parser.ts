// Parser.js v3.4.1
import { FileData } from "./fileData";
import { URLData } from "./urlData";

export class Parser {

	/* 入力された文字列を、URLおよびファイルデータとして解析し返します        */
	/* ただし最初から解析済みのデータが渡された場合は、それをそのまま返します */
	static parse(data: any, variety: string) {
		if (data instanceof URLData || data instanceof FileData) { return data; }

		return Parser.parseFile(data, variety) || Parser.parseURL(data);
	}

	static parseURL(url: URLData | string) {
		if (url instanceof URLData) { return url; }

		url = url.replace(/(\r|\n)/g, ""); // textarea上の改行が実際の改行扱いになるUAに対応(Operaとか)
		return (new URLData(url)).parse();
	}
	static parseFile(fstr: FileData | string, variety: string) {
		if (fstr instanceof FileData) { return fstr; }

		if (!fstr.match(/^\<\?xml/)) {
			fstr = fstr.replace(/[\t\r]*\n/g, "\n").replace(/\//g, "\n");
		}
		return (new FileData(fstr, variety)).parse();
	}
}



