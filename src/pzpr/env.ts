// env.js v3.4.0
import CandleEnv from "../candle/env";
/**************/
/* 環境の取得 */
/**************/
let _envobj: any = null
export const getEnv = () => {
	if (_envobj) return _envobj;

	var isbrowser = CandleEnv.browser;
	var UA = (isbrowser ? navigator.userAgent : '');

	var ios = (UA.indexOf('like Mac OS X') > -1);
	var android = (UA.indexOf('Android') > -1);
	var os = {
		iOS: (ios),
		Android: (android),
		mobile: (ios || android)
	};


	var ChromeVersion = (function () {
		if (UA.match(/Safari\/([\w\.]+)/) && UA.match(/Chrome\/(\w+(\.\w+)?)/)) {
			return RegExp.$1;
		}
		return null;
	})();
	var SafariVersion = (function () {
		if (ChromeVersion === null && UA.match(/Safari\/([\w\.]+)/) && UA.match(/Version\/(\w+(\.\w+)?)/)) {
			return RegExp.$1;
		}
		return null;
	})();
	var bz = {
		AndroidBrowser: (os.Android && SafariVersion),
		Presto: false
	};

	var api = {
		touchevent: isbrowser && ((!!window.ontouchstart)),
		pointerevent: isbrowser && (!!window.PointerEvent),
		mspointerevent: isbrowser,
		maxWidth: isbrowser,
		svgTextLength: !isbrowser,
		anchor_download: isbrowser && (document.createElement("a").download !== (void 0))
	};

	_envobj = {
		bz: bz,
		OS: os,
		API: api,
		browser: isbrowser,
	};
	return _envobj;
};

export const getLang = function () {
	const env = getEnv();
	var userlang = (env.node ? process.env.LANG : (navigator.language));
	return ((!userlang || userlang.substr(0, 2) === 'ja') ? 'ja' : 'en');
};
