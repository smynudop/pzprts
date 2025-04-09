//---------------------------------------------------------------------------
// ★ FileData() ファイルデータのencode/decodeのためのオブジェクト
//---------------------------------------------------------------------------
import * as Constants from "./constants"
import * as MetaData from "./metadata";
import { pzpr } from "./core";

export class FileData {
    constructor(fstr: string, variety: string) {
        this.pid = (!!variety ? variety : '');
        this.fstr = fstr;
        this.metadata = MetaData.createEmtpyMetaData();
    }

    pid = ''
    type = Constants.FILE_AUTO	/* == 0 */
    filever = 0
    fstr = ""
    qdata = ""
    cols = 0
    rows = 0
    body: any = ""
    history: any = {}
    metadata: MetaData.IMetaData
    xmldoc: any = null

    isurl = false
    isfile = true

    parse() {
        const result = (this.parseFileType() && this.parseFileData());
        if (result) { this.changeProperPid(); }
        return (result ? this : null);
    }
    generate() {
        return this.outputFileType() + this.outputFileData();
    }

    //---------------------------------------------------------------------------
    // ★ parseFileType() 入力されたファイルのデータからどのパズルか、およびパズルの種類を抽出する
    //                   出力={pid:パズル種類, type:ファイル種類, fstr:ファイルの内容}
    //---------------------------------------------------------------------------
    parseFileType() {
        const lines = this.fstr.split("\n");
        const firstline = lines.shift();
        this.fstr = undefined;

        /* ヘッダからパズルの種類・ファイルの種類を判定する */
        if (firstline.match(/^pzprv3/)) {
            this.type = Constants.FILE_PZPR;
            if (firstline.match(/pzprv3\.(\d+)/)) { this.filever = +RegExp.$1; }
            this.pid = lines.shift();
            this.qdata = lines.join("\n");
        }
        else if (firstline.match(/^\<\?xml/)) {
            this.type = Constants.FILE_PBOX_XML;
            lines.unshift(firstline);
            this.qdata = lines.join("\n");
            if (!!DOMParser) {
                this.body = (new DOMParser()).parseFromString(this.qdata, 'text/xml');
                this.pid = this.body.querySelector('puzzle').getAttribute('type');
            }
            else { this.pid = ''; }
        }
        else if (firstline.match(/^\d+$/)) {
            this.type = Constants.FILE_PBOX;
            lines.unshift(firstline);
            this.qdata = lines.join("\n");
        }
        else {
            this.pid = '';
        }
        this.pid = pzpr.variety.toPID(this.pid);

        return (!!this.pid);
    }

    //---------------------------------------------------------------------------
    // ★ outputFileType() パズル種類, ファイル種類からヘッダを生成する
    //---------------------------------------------------------------------------
    outputFileType() {
        /* ヘッダの処理 */
        if (this.type === Constants.FILE_PZPR) {
            return [(this.filever === 0 ? "pzprv3" : (`pzprv3.${this.filever}`)), this.pid, ""].join("\n");
        }
        if (this.type === Constants.FILE_PBOX_XML) {
            this.body.querySelector('puzzle').setAttribute('type', pzpr.variety(this.pid).kanpenid);
        }
        return "";
    }

    //---------------------------------------------------------------------------
    // ★ parseFileData() ファイルの内容からサイズなどを求める
    //---------------------------------------------------------------------------
    parseFileData() {
        const lines = this.qdata.split("\n");
        let col = 0;
        let row = 0;
        this.qdata = undefined;

        /* サイズを表す文字列 */
        if (this.type === Constants.FILE_PBOX_XML) {
            row = +this.body?.querySelector('size')?.getAttribute('row')!;
            col = +this.body?.querySelector('size')?.getAttribute('col')!;
            if (this.pid === "slither" || this.pid === 'kakuro') { row--; col--; }
        }
        else if (this.type === Constants.FILE_PBOX && this.pid === "kakuro") {
            row = +lines.shift()! - 1;
            col = +lines.shift()! - 1;
        }
        else if (this.pid === "sudoku") {
            row = col = +lines.shift()!;
        }
        else {
            row = +lines.shift()!;
            col = +lines.shift()!;
        }
        if (row <= 0 || col <= 0) { return false; }
        this.rows = row;
        this.cols = col;

        /* サイズ以降のデータを取得 */
        if (this.type === Constants.FILE_PZPR) {
            let historypos = null;
            let str = "";
            const strs = [];
            let isinfo = false;
            for (let i = 0; i < lines.length; i++) {
                /* かなり昔のぱずぷれファイルは最終行にURLがあったので、末尾扱いする */
                if (lines[i].match(/^http\:\/\//)) { break; }

                /* info行に到達した場合 */
                if (lines[i].match(/info:\{/)) { historypos = i; isinfo = true; break; }

                /* 履歴行に到達した場合 */
                if (lines[i].match(/history:\{|__HISTORY__/)) { historypos = i; break; }

                strs.push(lines[i]);
            }
            this.body += strs.join('\n');

            /* 履歴部分の読み込み */
            if (historypos !== null && !!JSON) {
                let count = 0;
                let cnt;
                for (let i = historypos; i < lines.length; i++) {
                    str += lines[i];

                    cnt = count;
                    count += (lines[i].match(/\{/g) || []).length;
                    count -= (lines[i].match(/\}/g) || []).length;
                    if (cnt > 0 && count === 0) { break; }
                }
            }

            /* 履歴出力があったら入力する */
            if (!!JSON) {
                if (isinfo && (str.substr(0, 5) === "info:")) {
                    const info = JSON.parse(str.substr(5));
                    this.metadata = MetaData.update(this.metadata, info.metadata);
                    this.history = info.history || '';
                }
                else if (str.substr(0, 8) === "history:") {
                    this.history = JSON.parse(str.substr(8));
                }
            }
        }
        else if (this.type === Constants.FILE_PBOX) {
            this.body = lines.join("\n");
        }
        else if (this.type === Constants.FILE_PBOX_XML) {
            if (!!this.body) {
                const metanode = this.body.querySelector('property');
                const meta = this.metadata;
                meta.author = metanode.querySelector('author').getAttribute('value');
                meta.source = metanode.querySelector('source').getAttribute('value');
                meta.hard = metanode.querySelector('difficulty').getAttribute('value');
                const commentnode = metanode.querySelector('comment');
                meta.comment = (!!commentnode ? commentnode.childNodes[0].data : '');
            }
        }

        return true;
    }

    //---------------------------------------------------------------------------
    // ★ outputFileData() パズル種類, URL種類, fstrからファイルのデータを生成する
    //---------------------------------------------------------------------------
    outputFileData() {
        let col = this.cols;
        let row = this.rows;
        const out = [] as any[];
        const puzzlenode = (this.type === Constants.FILE_PBOX_XML ? this.body.querySelector('puzzle') : null);

        /* サイズを表す文字列 */
        if (this.type === Constants.FILE_PBOX_XML) {
            const sizenode = puzzlenode.querySelector('size');
            if (sizenode) { puzzlenode.removeChild(sizenode); }
            if (this.pid === "slither" || this.pid === 'kakuro') { row++; col++; }
            puzzlenode.appendChild(this.createXMLNode('size', { row: row, col: col }));
        }
        else if (this.type === Constants.FILE_PBOX && this.pid === "kakuro") {
            out.push(row + 1);
            out.push(col + 1);
        }
        else if (this.pid === "sudoku") {
            out.push(col);
        }
        else {
            out.push(row);
            out.push(col);
        }

        /* サイズ以降のデータを設定 */
        if (this.type !== Constants.FILE_PBOX_XML) {
            out.push(this.body);
        }

        /* 履歴・メタデータ出力がある形式ならば出力する */
        if ((this.type === Constants.FILE_PZPR) && !!JSON) {
            if (!MetaData.isEmpty(this.metadata)) {
                const info = { metadata: MetaData.getvaliddata(this.metadata), history: this.history || undefined };
                out.push(`info:${JSON.stringify(info, null, 1)}`);
            }
            else if (this.history) {
                out.push(`history:${JSON.stringify(this.history, null, 1)}`);
            }
        }
        else if (this.type === Constants.FILE_PBOX_XML) {
            let propnode = puzzlenode?.querySelector('property')!;
            if (propnode) { puzzlenode?.removeChild(propnode); }
            propnode = this.createXMLNode('property');
            const meta = this.metadata;
            propnode.appendChild(this.createXMLNode('author', { value: meta.author }));
            propnode.appendChild(this.createXMLNode('source', { value: meta.source }));
            propnode.appendChild(this.createXMLNode('difficulty', { value: meta.hard }));
            if (!!meta.comment) {
                const commentnode = this.createXMLNode('comment');
                commentnode.appendChild(this.body.createTextNode(meta.comment));
                propnode.appendChild(commentnode);
            }
            puzzlenode?.appendChild(propnode);

            // 順番を入れ替え
            puzzlenode?.appendChild(puzzlenode?.querySelector('board')!);
            puzzlenode?.appendChild(puzzlenode?.querySelector('answer')!);
        }

        let outputdata;
        if (this.type !== Constants.FILE_PBOX_XML) {
            outputdata = out.join("\n");
        }
        else {
            outputdata = new XMLSerializer().serializeToString(this.body);
            if (!outputdata.match(/^\<\?xml/)) {
                outputdata = `<?xml version="1.0" encoding="UTF-8"?>\n${outputdata}`;
            }
        }
        return outputdata;
    }

    createXMLNode(name: string, attrs: Record<string, string | number> = null) {
        const node = this.body.createElement(name);
        if (!!attrs) { for (const i in attrs) { node.setAttribute(i, attrs[i]); } }
        return node;
    }

    //---------------------------------------------------------------------------
    // ★ changeProperPid() parse後パズル種類が実際には別だった場合にpidを変更する
    //---------------------------------------------------------------------------
    changeProperPid() {
        if (this.type !== Constants.FILE_PZPR) { return; }

        switch (this.pid) {
            case 'ichimaga': {
                const pzlflag = this.body.split('\n')[0];
                if (pzlflag === 'mag') { this.pid = 'ichimagam'; }
                else if (pzlflag === 'cross') { this.pid = 'ichimagax'; }
                break;
            }
            case 'icelom': {
                const pzltype = this.body.split('\n')[2];
                if (pzltype === 'skipwhite') { this.pid = 'icelom2'; }
                break;
            }
            case 'pipelink': {
                const lines = this.body.split('\n');
                const row = 1;
                const len = this.rows;
                if (lines.slice(row, row + len).join('').match(/o/)) {
                    this.pid = 'pipelinkr';
                }
                break;
            }
            case 'bonsan': {
                const lines = this.body.split('\n');
                const row = 2 * this.rows;
                const len = 2 * this.rows - 1;
                if (lines.slice(row, row + len).join('').match(/1/)) {
                    this.pid = 'heyabon';
                }
                break;
            }
            case 'kramma': {
                const lines = this.body.split('\n');
                const row = this.rows;
                const len = this.rows + 1;
                if (lines.slice(row, row + len).join('').match(/1/)) {
                    this.pid = 'kramman';
                }
                break;
            }
        }
    }
};
