// env.js v3.4.0
import CandleEnv from "../candle/env";
/**************/
/* 環境の取得 */
/**************/
type Env = {
	OS: {
		iOS: boolean,
		Android: boolean,
		mobile: boolean
	}
	browser: boolean
}
let _envobj: Env | null = null
export const getEnv = (): Env => {
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

	const api = {
		touchevent: isbrowser && ((!!window.ontouchstart)),
	};

	_envobj = {
		OS: os,
		browser: isbrowser,
	};
	return _envobj;
};

export const getLang = function () {
	const userlang = navigator.language;
	return ((!userlang || userlang.substr(0, 2) === 'ja') ? 'ja' : 'en');
};
