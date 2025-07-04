// Config.js v3.4.1

import type { Puzzle } from "./Puzzle";
import { pzpr } from "../pzpr/core";

const isTouch = !!(window?.matchMedia("(pointer: coarse)").matches)
//---------------------------------------------------------------------------
// ★Configクラス 設定値の値などを保持する
//---------------------------------------------------------------------------
export class Config {
	puzzle: Puzzle
	list: Record<string, any> 		/* 設定値 */
	constructor(puzzle: Puzzle) {
		this.puzzle = puzzle;
		this.list = {};

		this.init();
	};



	//---------------------------------------------------------------------------
	// config.init()        各設定値を初期化する
	// config.add()         初期化時に設定を追加する
	//---------------------------------------------------------------------------
	init() {

		/* 盤面表示設定 */
		this.add('font', 1, { option: [1, 2] });					/* 文字の描画 1:ゴシック 2:明朝 */
		this.add('cursor', true);								/* カーソルの表示 */
		this.add('irowake', false);								/* 線の色分け */
		this.add('irowakeblk', false);							/* 黒マスの色分け */

		this.add('dispmove', true);								/* 線で動かすパズルで実際に動いたように描画 */
		this.add('disptype_yajilin', 1, { option: [1, 2] });		/* yajilin: 表示形式 */
		this.add('disptype_pipelinkr', 1, { option: [1, 2] });		/* pipelinkr: 表示形式 */
		this.add('disptype_bosanowa', 1, { option: [1, 2, 3] });	/* bosanowa: 表示形式 */
		this.add('snakebd', false);								/* hebi: へびの境界線を表示する */
		this.add('dispqnumbg', false);							/* yinyang: 問題のまるに背景色をつける */
		this.add('undefcell', true);							/* shugaku: 未確定マスはグレー表示にする */

		this.add('squarecell', true);							/* セルは正方形にする */

		/* 表示色の設定 */
		this.add('color_shadecolor', null);						/* 黒マスの表示色の表示 */
		//this.add('color_bgcolor', ["white", "rgba(255, 255, 255, 0.85)"]);						/* 背景色の設定 */

		/* 入力方法設定 */
		this.add('use', (!isTouch ? 1 : 2), { option: [1, 2] });	/* 黒マスの入力方法 */
		this.add('use_tri', 1, { option: [1, 2, 3] });				/* shakashaka: 三角形の入力方法 */
		this.add('support_tri', true);							/* shakashaka: 三角形の入力補助 (for 2つ以上の壁に接したCell) */

		this.add('bgcolor', false);			/* slither 背景色入力 */
		this.add('singlenum', (!pzpr.env.OS.mobile));	/* hanare: 部屋に回答数字を一つだけ入力 */
		this.add('enline', true);			/* kouchoku: 線は点の間のみ引ける */
		this.add('lattice', true);			/* kouchoku: 格子点チェック */

		/* 回答お助け機能 */
		this.add('autocmp', true, { variety: true });	/* 数字 or kouchokuの正解の点をグレーにする */
		this.add('autoerr', false, { variety: true });	/* hitori:ひとくれの重複した数字を表示, gokigen,wagiri:斜線の色分け */

		/* 正解判定 */
		this.add('multierr', false);		/* エラー判定で複数エラーを出力する */
		this.add('allowempty', false);		/* 盤面に線や黒マスがなくても正解と判定する */
		this.add('forceallcell', false);	/* fillomino: すべての数字が入っている時のみ正解とする */
		this.add('passallcell', true);		/* arukone: すべてのセルに線が通っている時のみ正解とする */

		/* EDITORのみ */
		this.add('bdpadding', true);		/* goishi: URL出力で1マス余裕を持って出力する */
		this.add('discolor', false);		/* tentaisho: 色分け無効化 */

		/* その他の特殊項目(保存なし) */
		this.add('uramashu', false, { volatile: true });		/* 裏ましゅにする */
	}
	add(name: string, defvalue: any, extoption: any = null) {
		if (!extoption) { extoption = {}; }
		const item = { val: defvalue, defval: defvalue, volatile: !!extoption.volatile, option: null as any, variety: null as any };
		if (!!extoption.option) { item.option = extoption.option; }
		if (!!extoption.variety) { item.variety = {}; }
		this.list[name] = item;
	}

	//---------------------------------------------------------------------------
	// config.getCurrentName() 以前のconfig名から現在使用している名称を取得する
	// config.getNormalizedName() Config名が@付きだった場合varietyのpidを返す
	//---------------------------------------------------------------------------
	getCurrentName(name: string) {
		switch (name) {
			case 'color_qanscolor': name = 'color_shadecolor'; break;
			case 'autocmp_area': if (this.getexec('autocmp')) { name = 'autocmp'; } break;
		}
		return name;
	}
	//getCurrnetName(name) { return this.getgetCurrentName(name); }
	getNormalizedName(argname: string) {
		const info = { name: argname, pid: "" as string };
		if (argname.match(/\@/)) {
			const splitted = argname.split(/\@/);
			info.name = splitted[0];
			info.pid = splitted[1]
			//const pid = pzpr.variety.toPID(splitted[1]);
			//if (!!pid) { info.pid = pid; }
		}
		info.name = this.getCurrentName(info.name);
		return info;
	}

	//---------------------------------------------------------------------------
	// config.get()  各フラグの設定値を返す
	// config.set()  各フラグの設定値を設定する
	// config.reset()各フラグの設定値を初期値に戻す
	//---------------------------------------------------------------------------
	get(argname: string) {
		const names = this.getNormalizedName(argname);
		const name = names.name;
		const item = this.list[name];
		if (!item) { return null; }
		if (!!item.variety) {
			const pid = (names.pid !== void 0 ? names.pid : this.puzzle.pid);
			if (item.variety[pid] !== void 0) { return item.variety[pid]; }
		}
		return item.val;
	}
	set(argname: string, newval: any) {
		const names = this.getNormalizedName(argname);
		const name = names.name;
		if (this.list[name] === undefined) { return; }
		newval = this.setproper(names, newval);
		this.configevent(name, newval);
		this.puzzle.emit('config', name, newval);
	}
	reset(argname: string) {
		const names = this.getNormalizedName(argname);
		const item = this.list[names.name];
		if (!item) { return; }
		if (!!item.variety && !names.pid) {
			item.variety = {};
			this.set(names.name, item.defval);
		}
		else {
			this.set(argname, item.defval);
		}
	}

	//---------------------------------------------------------------------------
	// config.getList()  現在有効な設定値のリストを返す
	//---------------------------------------------------------------------------
	getList() {
		const conf: Record<string, any> = {};
		for (const idname in this.list) {
			if (this.getexec(idname)) { conf[idname] = this.get(idname); }
		}
		return conf;
	}

	//---------------------------------------------------------------------------
	// config.getAll()  全フラグの設定値を返す
	// config.setAll()  全フラグの設定値を設定する
	//---------------------------------------------------------------------------
	getAll() {
		const object: Record<string, any> = {};
		for (const key in this.list) {
			const item = this.list[key];
			if (item.volatile) { continue; }
			if (item.val !== item.defval) { object[key] = item.val; }
			if (!item.variety) { continue; }
			for (const pid in item.variety) {
				if (item.variety[pid] !== item.defval) { object[`${key}@${pid}`] = item.variety[pid]; }
			}
		}
		return object;
	}
	setAll(settings: any) {
		this.init();
		for (const key in settings) { this.set(key, settings[key]); }
	}

	//---------------------------------------------------------------------------
	// config.setproper()    設定値の型を正しいものに変換して設定変更する
	//---------------------------------------------------------------------------
	setproper<T extends { name: string, pid: string }>(names: T, newval: any) {
		const name = names.name;
		const item = this.list[name];
		switch (typeof item.defval) {
			case "boolean": newval = !!newval; break;
			case "number": newval = +newval; break;
			case "string": newval = `${newval}`; break;
		}
		if (!item.option || (item.option.indexOf(newval) >= 0)) {
			if (!!item.variety) {
				item.variety[names.pid !== void 0 ? names.pid : this.puzzle.pid] = newval;
			}
			else { item.val = newval; }
		}
		return item.val;
	}

	//---------------------------------------------------------------------------
	// config.getexec()  設定値を現在のパズルで有効かどうか返す
	//---------------------------------------------------------------------------
	getexec(name: string) {
		const puzzle = this.puzzle;
		const pid = puzzle.pid;
		const EDITOR = !puzzle.playeronly;
		let exec = false;
		switch (name) {
			case 'use': exec = puzzle.mouse.use; break;
			case 'use_tri': exec = (pid === "shakashaka"); break;
			case 'support_tri': exec = (pid === "shakashaka"); break;
			case 'dispmove': exec = puzzle.board.linegraph.moveline; break;
			case 'disptype_pipelinkr': exec = (pid === "pipelinkr"); break;
			case 'disptype_bosanowa': exec = (pid === "bosanowa"); break;
			case 'disptype_yajilin': exec = (pid === "yajirin"); break;
			case 'bgcolor': exec = (pid === 'slither'); break;
			case 'irowake': exec = puzzle.painter.irowake; break;
			case 'irowakeblk': exec = puzzle.painter.irowakeblk; break;
			case 'snakebd': exec = (pid === "hebi"); break;
			case 'dispqnumbg': exec = (pid === 'yinyang'); break;
			case 'undefcell': exec = (pid === 'shugaku'); break;
			case 'autocmp': exec = !!puzzle.painter.autocmp; break;
			case 'autoerr': exec = (pid === "hitori" || pid === "gokigen" || pid === "wagiri"); break;
			case 'singlenum': exec = (pid === "hanare"); break;
			case 'enline': case 'lattice': exec = (pid === "kouchoku"); break;
			case 'bdpadding': exec = (EDITOR && pid === 'goishi'); break;
			case 'discolor': exec = (EDITOR && pid === 'tentaisho'); break;
			case 'uramashu': exec = (pid === "mashu"); break;
			case 'forceallcell': exec = (pid === "fillomino"); break;
			case 'passallcell': exec = (pid === "arukone"); break;
			default: exec = !!this.list[name];
		}
		return exec;
	}

	//---------------------------------------------------------------------------
	// config.configevent()  設定変更時の動作を記述する
	//---------------------------------------------------------------------------
	configevent(name: string, newval: any) {
		const puzzle = this.puzzle;
		if (!this.getexec(name)) { return; }
		switch (name) {
			case 'irowake':
			case 'irowakeblk':
			case 'dispmove':
			case 'cursor':
			case 'undefcell':
			case 'autocmp':
			case 'autoerr':
			case 'snakebd':
			case 'disptype_pipelinkr':
			case 'disptype_yajilin':
			case 'dispqnumbg':
				puzzle.redraw();
				break;

			case 'font':
				puzzle.painter.initFont();
				puzzle.redraw();
				break;

			case 'multierr':
				puzzle.checker.multierr = newval
				puzzle.checker.resetCache();
				break;

			case "allowempty":
				puzzle.checker.allowempty = newval
				break

			case "forceallcell":
				puzzle.checker.forceallcell = newval
				break

			case 'disptype_bosanowa':
				puzzle.setCanvasSizeByCellSize();	/* セルのサイズを変えないために、この関数を引数なしで呼び出す */
				break;

			case 'color_shadecolor':
				puzzle.painter.setColor('shadecolor', newval);
				break;

			case 'color_bgcolor':
				puzzle.painter.setColor('bgcolor', newval);
				break;

			case 'uramashu':
				//puzzle.board.revCircleConfig(newval);
				puzzle.redraw();
				break;
		}
	}
};