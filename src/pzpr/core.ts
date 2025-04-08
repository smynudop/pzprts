// core.js v3.5.2
import { getEnv, getLang } from "./env";
import { initPzpr } from "./event";
import { createVariety } from "./variety";
import { Parser } from "./parser";
import { util } from "./util";
import { Puzzle } from "../puzzle/Puzzle";
import Candle from "../candle";
//----------------------------------------------------------------------------
// ★pzprオブジェクト
//---------------------------------------------------------------------------
/* extern */

const variety = createVariety();
export const pzpr = {
	version: '<%= pkg.version %>',
	lang: getLang(),
	env: getEnv(),
	Candle: Candle,
	util: util,// CoreClass保存用
	custom: { '': {} },	// パズル別クラス保存用
	Puzzle: Puzzle,
	variety: variety,
	genre: variety,
};

initPzpr(pzpr);