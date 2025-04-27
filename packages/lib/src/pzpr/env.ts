// env.js v3.4.0
import CandleEnv from "../candle/env";
/**************/
/* 環境の取得 */
/**************/
let _envobj: any = null
export const getEnv = () => {
	if (_envobj) return _envobj;

	const isbrowser = CandleEnv.browser;
	const UA = (isbrowser ? navigator.userAgent : '');

	const ios = (UA.indexOf('like Mac OS X') > -1);
	const android = (UA.indexOf('Android') > -1);
	const os = {
		iOS: (ios),
		Android: (android),
		mobile: (ios || android)
	};


	const ChromeVersion = (function () {
		if (UA.match(/Safari\/([\w\.]+)/) && UA.match(/Chrome\/(\w+(\.\w+)?)/)) {
			return RegExp.$1;
		}
		return null;
	})();
	const SafariVersion = (function () {
		if (ChromeVersion === null && UA.match(/Safari\/([\w\.]+)/) && UA.match(/Version\/(\w+(\.\w+)?)/)) {
			return RegExp.$1;
		}
		return null;
	})();
	const bz = {
		AndroidBrowser: (os.Android && SafariVersion),
		Presto: false
	};

	const api = {
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
	//const userlang = (env.node ? process.env.LANG : (navigator.language));
	const userlang = navigator.language;
	return ((!userlang || userlang.substr(0, 2) === 'ja') ? 'ja' : 'en');
};
