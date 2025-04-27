// Parser.js v3.4.1
import { FileData } from "./fileData";
import { URLData } from "./urlData";


/* 入力された文字列を、URLおよびファイルデータとして解析し返します        */
/* ただし最初から解析済みのデータが渡された場合は、それをそのまま返します */
export const parse = (data: any, variety: string) => {
	if (data instanceof URLData || data instanceof FileData) { return data; }

	return parseFile(data, variety) || parseURL(data);
}

export const parseURL = (url: URLData | string) => {
	if (url instanceof URLData) { return url; }

	url = url.replace(/(\r|\n)/g, ""); // textarea上の改行が実際の改行扱いになるUAに対応(Operaとか)
	return (new URLData()).parse(url);
}
export const parseFile = (fstr: FileData | string, variety: string) => {
	if (fstr instanceof FileData) { return fstr; }

	if (!fstr.match(/^\<\?xml/)) {
		fstr = fstr.replace(/[\t\r]*\n/g, "\n").replace(/\//g, "\n");
	}
	return (new FileData(fstr, variety)).parse(fstr);
}



