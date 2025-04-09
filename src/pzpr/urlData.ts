//---------------------------------------------------------------------------
// ★ URLData() URLデータのencode/decodeのためのオブジェクト
//---------------------------------------------------------------------------
import { pzpr } from "./core";

import * as Constants from "./constants"

export class URLData {
    constructor(url: string) {
        this.url = url;
    }
    pid = ''
    type = Constants.URL_AUTO	/* ==0 */
    url = ""
    qdata = ""
    pflag: string | null = null
    cols = 0
    rows = 0
    body = ""

    isurl = true
    isfile = false

    parse() {
        this.parseURLType();
        this.parseURLData();
        this.changeProperPid();
        return this;
    }
    generate() {
        return this.outputURLType() + this.outputURLData();
    }

    //---------------------------------------------------------------------------
    // ★ parseURLType() 入力されたURLからどのパズルか、およびURLの種類を抽出する
    //                   入力=URL 例:http://pzv.jp/p.html?(pid)/(qdata)
    //                   出力={pid:パズル種類, type:URL種類, qdata:タテヨコ以下のデータ}
    //                         qdata -> [(pflag)/](cols)/(rows)/(bstr)
    //---------------------------------------------------------------------------
    parseURLType() {
        /* URLからパズルの種類・URLの種類を判定する */
        const url = this.url;
        this.url = undefined;
        // カンペンの場合
        if (url.match(/www\.kanpen\.net/) || url.match(/www\.geocities(\.co)?\.jp\/pencil_applet/)) {
            url.match(/([0-9a-z]+)\.html/);
            this.pid = RegExp.$1;
            // カンペンだけどデータ形式はへやわけアプレット
            if (url.indexOf("?heyawake=") >= 0) {
                this.qdata = url.substr(url.indexOf("?heyawake=") + 10);
                this.type = Constants.URL_HEYAAPP;
            }
            // カンペンだけどデータ形式はぱずぷれ
            else if (url.indexOf("?pzpr=") >= 0) {
                this.qdata = url.substr(url.indexOf("?pzpr=") + 6);
                this.type = Constants.URL_KANPENP;
            }
            else {
                this.qdata = url.substr(url.indexOf("?problem=") + 9);
                this.type = Constants.URL_KANPEN;
            }
        }
        // へやわけアプレットの場合
        else if (url.match(/www\.geocities(\.co)?\.jp\/heyawake/)) {
            this.pid = 'heyawake';
            this.qdata = url.substr(url.indexOf("?problem=") + 9);
            this.type = Constants.URL_HEYAAPP;
        }
        // ぱずぷれアプレットの場合
        else if (url.match(/indi\.s58\.xrea\.com\/(.+)\/(sa|sc)\//)) {
            this.pid = RegExp.$1;
            this.qdata = url.substr(url.indexOf("?"));
            this.type = Constants.URL_PZPRAPP;
        }
        // ぱずぷれv3の場合
        else {
            const qs = url.indexOf("/", url.indexOf("?"));
            if (qs > -1) {
                this.pid = url.substring(url.indexOf("?") + 1, qs);
                this.qdata = url.substr(qs + 1);
            }
            else {
                this.pid = url.substr(url.indexOf("?") + 1);
            }
            this.type = Constants.URL_PZPRV3;
        }
    }

    //---------------------------------------------------------------------------
    // ★ outputURLType() パズル種類, URL種類からURLを生成する
    //---------------------------------------------------------------------------
    outputURLType() {
        /* URLの種類からURLを取得する */
        let domain = (!pzpr.env.node ? document.domain : '');
        let url = "";
        const pid = this.pid;
        if (!!domain) { domain += location.pathname; }
        else { domain = "pzv.jp/p.html"; }
        switch (this.type) {
            case Constants.URL_PZPRV3: url = `http://${domain}?%PID%/`; break;
            case Constants.URL_KANPEN: url = "http://www.kanpen.net/%KID%.html?problem="; break;
            case Constants.URL_KANPENP: url = "http://www.kanpen.net/%KID%.html?pzpr="; break;
            case Constants.URL_HEYAAPP: url = "http://www.geocities.co.jp/heyawake/?problem="; break;
        }

        return url//.replace("%PID%", pzpr.variety(pid).urlid)
        //.replace("%KID%", pzpr.variety(pid).kanpenid);
    }

    //---------------------------------------------------------------------------
    // ★ parseURLData() URLを縦横・問題部分などに分解する
    //                   qdata -> [(pflag)/](cols)/(rows)/(bstr)
    //---------------------------------------------------------------------------
    parseURLData() {
        const inp = this.qdata.split("/");
        let col = 0;
        let row = 0;
        this.qdata = undefined;
        /* URLにつけるオプション */
        if (this.type !== Constants.URL_KANPEN && this.type !== Constants.URL_HEYAAPP) {
            if (!!inp[0] && !Number.isNaN(+inp[0])) { inp.unshift(""); }
            this.pflag = inp.shift();
        }

        /* サイズを表す文字列 */
        if (this.type === Constants.URL_KANPEN) {
            if (this.pid === "kakuro") {
                row = +inp.shift()! - 1;
                col = +inp.shift()! - 1;
            }
            else if (this.pid === "sudoku") {
                row = col = +inp.shift()!;
            }
            else {
                row = +inp.shift()!;
                col = +inp.shift()!;
            }
        }
        else if (this.type === Constants.URL_HEYAAPP) {
            const size = inp.shift()?.split("x");
            col = +size[0];
            row = +size[1];
        }
        else {
            col = +inp.shift()! || Number.NaN;
            row = +inp.shift()! || Number.NaN;
        }
        this.rows = row;
        this.cols = col;

        /* サイズ以降のデータを取得 */
        if (!inp[inp.length - 1]) { inp.pop(); }
        this.body = inp.join("/");
    }

    //---------------------------------------------------------------------------
    // ★ outputURLData() qdataを生成する
    //---------------------------------------------------------------------------
    outputURLData() {
        const col = this.cols;
        const row = this.rows;
        const out = [] as any[];

        /* URLにつけるオプション */
        if (this.type !== Constants.URL_KANPEN && this.type !== Constants.URL_HEYAAPP) {
            if (this.type === Constants.URL_KANPENP || !!this.pflag) { out.push(this.pflag); }
        }

        /* サイズを表す文字列 */
        if (this.type === Constants.URL_KANPEN) {
            if (this.pid === "kakuro") {
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
        }
        else if (this.type === Constants.URL_HEYAAPP) {
            out.push([col, row].join("x"));
        }
        else {
            out.push(col);
            out.push(row);
        }

        /* サイズ以降のデータを設定 */
        out.push(this.body);

        /* 末尾が0-9,a-z,A-Z以外の時にt.coで情報が欠落しないよう/を追加 */
        let body = out.join("/");
        if (!body.charAt(body.length - 1).match(/[a-zA-Z0-9]/)) { body += '/'; }
        return body;
    }

    //---------------------------------------------------------------------------
    // ★ changeProperPid() parse後パズル種類が実際には別だった場合にpidを変更する
    //---------------------------------------------------------------------------
    changeProperPid() {
        // this.bodyが空の場合はEncode.jsの仕様により対象外
        // カンペンには以下のパズルは存在しないのでConstants.URL_KANPENPも対象外
        if (!this.body || (this.type !== Constants.URL_PZPRV3 && this.type !== Constants.URL_PZPRAPP)) { return; }

        // 
        this.pflag = this.pflag || '';

        switch (this.pid) {
            case 'ichimaga':
                if (this.pflag.indexOf('m') >= 0) { this.pid = 'ichimagam'; }
                else if (this.pflag.indexOf('x') >= 0) { this.pid = 'ichimagax'; }
                else { this.pid = 'ichimaga'; }
                break;
            case 'icelom':
                if (this.pflag.indexOf('a') < 0) { this.pid = 'icelom2'; }
                break;
            case 'pipelink':
                if (this.body.match(/[0-9]/)) { this.pid = 'pipelinkr'; }
                break;
            case 'bonsan':
                if (this.pflag.indexOf('c') < 0) {
                    const col = this.cols;
                    const row = this.rows;
                    if (this.body.substr(0, ((((col - 1) * row + 4) / 5) | 0) + (((col * (row - 1) + 4) / 5) | 0) || 0).match(/[^0]/)) {
                        this.pid = 'heyabon';
                    }
                }
                break;
            case 'kramma':
                if (this.pflag.indexOf('c') < 0) {
                    const len = (this.cols - 1) * (this.rows - 1);
                    let cc = 0;
                    for (let i = 0; i < this.body.length; i++) {
                        const ca = this.body.charAt(i);
                        if (ca.match(/\w/)) {
                            cc += Number.parseInt(ca, 36);
                            if (cc < len) { this.pid = 'kramman'; break; }
                        }
                        else if (ca === '.') { cc += 36; }
                        if (cc >= len) { break; }
                    }
                }
                break;
        }
    }
}