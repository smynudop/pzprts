// core.js v3.5.2
import { getEnv, getLang } from "./env";
//----------------------------------------------------------------------------
// ★pzprオブジェクト
//---------------------------------------------------------------------------
/* extern */

export const pzpr = {
	version: '<%= pkg.version %>',
	lang: getLang(),
	env: getEnv(),
};
