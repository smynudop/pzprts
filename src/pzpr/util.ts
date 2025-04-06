// util.js v3.4.0

import { Puzzle } from "../puzzle/Puzzle";
import { getEnv } from "./env";
const env = getEnv();
let api = env.API,
	eventMouseDown = ["mousedown"],
	eventMouseMove = ["mousemove"],
	eventMouseUp = ["mouseup"],
	eventMouseCancel = [""];

if (env.bz.AndroidBrowser) {
	eventMouseDown = [""];
	eventMouseMove = [""];
	eventMouseUp = [""];
}

if (api.pointerevent) {
	eventMouseDown = ["pointerdown"];
	eventMouseMove = ["pointermove"];
	eventMouseUp = ["pointerup"];
	eventMouseCancel = ["pointercancel"];
}
else if (api.mspointerevent) {
	eventMouseDown = ["MSPointerDown"];
	eventMouseMove = ["MSPointerMove"];
	eventMouseUp = ["MSPointerUp"];
	eventMouseCancel = ["MSPointerCancel"];
}
else if (api.touchevent) {
	eventMouseDown.push("touchstart");
	eventMouseMove.push("touchmove");
	eventMouseUp.push("touchend");
	eventMouseCancel.push("touchcancel");
}

//----------------------------------------------------------------------
// EventやDOM関連のツール的関数群
//----------------------------------------------------------------------
export const util = {
	//---------------------------------------------------------------
	// pzpr.jsが読み込まれているスクリプトのパスを取得する
	getpath: function () {
		if (env.browser) {
			var srcs = document.getElementsByTagName('script');
			for (var i = 0; i < srcs.length; i++) {
				var result = srcs[i].src.match(/^(.*\/)pzpr\.js(?:\?.*)?$/);
				if (result) { return result[1] + (!result[1].match(/\/$/) ? '/' : ''); }
			}
		}
		else {
			return require('path').dirname(__filename) + '/' + (__filename.match('pzpr.js') ? '' : '../');
		}
		return "";
	},

	//---------------------------------------------------------------
	// 現在の時間を取得
	currentTime: function () { return (new Date()).getTime(); },

	//---------------------------------------------------------------
	// Elementの生成関連
	//---------------------------------------------------------------
	unselectable: function (el: HTMLElement) {

		//el.style.MozUserSelect = 'none';
		//el.style.KhtmlUserSelect = 'none';
		//el.style.webkitUserSelect = 'none';
		//el.style.msUserSelect = 'none';
		el.style.userSelect = 'none';
		//el.unselectable = "on";
		return this;
	},

	//----------------------------------------------------------------------
	// pzpr.util.addEvent()          addEventListener()を呼び出す
	//----------------------------------------------------------------------
	addEvent: function (el: HTMLElement, type: string, self: Puzzle, callback: (e: any) => void, capt: any = false) {
		var types = [type];
		if (type === "mousedown") { types = eventMouseDown; }
		else if (type === "mousemove") { types = eventMouseMove; }
		else if (type === "mouseup") { types = eventMouseUp; }
		else if (type === "mousecancel") { types = eventMouseCancel; }

		types.forEach(function (type) { el.addEventListener(type, callback, !!capt); });

		return function remover() {
			types.forEach(function (type) { el.removeEventListener(type, callback, !!capt); });
		};
	},

	//---------------------------------------------------------------------------
	// pzpr.util.getMouseButton() 左/中/右ボタンが押されているかチェックする
	//---------------------------------------------------------------------------
	getMouseButton: function (e: MouseEvent | TouchEvent | PointerEvent) {
		if (util.isTouchEvent(e)) {
			/* touchイベントだった場合 */
			return (e.touches.length === 1 ? 'left' : '');
		}
		else if (util.isPointerEvent(e) && e.pointerType !== 'mouse') {
			/* pointerイベントだった場合 */
			return (e.isPrimary ? 'left' : '');
		}
		return ['left', 'middle', 'right'][(e.button !== void 0 ? e.button : e.which - 1)] || '';
	},

	//----------------------------------------------------------------------
	// pzpr.util.getPagePos() イベントが起こったページ上の座標を返す
	// pzpr.util.pageX()      イベントが起こったページ上のX座標を返す
	// pzpr.util.pageY()      イベントが起こったページ上のY座標を返す
	//----------------------------------------------------------------------
	isTouchEvent: function (e: Event): e is TouchEvent {
		// @ts-ignore
		return e.touches !== void 0
	},

	isPointerEvent: function (e: Event): e is PointerEvent {
		// @ts-ignore
		return !!e.pointerType
	},

	getPagePos: function (e: MouseEvent | TouchEvent) {
		return { px: this.pageX(e), py: this.pageY(e) };
	},
	pageX: function (e: MouseEvent | TouchEvent) {
		if (util.isTouchEvent(e)) {
			if (e.touches.length > 0) {
				var len = e.touches.length, pos = 0;
				if (len > 0) {
					for (var i = 0; i < len; i++) { pos += e.touches[i].pageX; }
					return pos / len;
				}
			}
			return 0;
		}
		return e.pageX || 0;
	},
	pageY: function (e: MouseEvent | TouchEvent) {
		if (util.isTouchEvent(e)) {
			if (e.touches.length > 0) {
				var len = e.touches.length, pos = 0;
				if (len > 0) {
					for (var i = 0; i < len; i++) { pos += e.touches[i].pageY; }
					return pos / len;
				}
			}
			return 0;
		}
		return e.pageY || 0;
	},

	//--------------------------------------------------------------------------------
	// pzpr.util.getRect()   エレメントの四辺の座標を返す
	//--------------------------------------------------------------------------------
	getRect: function (el: HTMLElement) {
		if (!env.browser) {
			return { top: 0, bottom: 0, left: 0, right: 0, height: 0, width: 0 };
		}
		var rect = el.getBoundingClientRect(), scrollLeft, scrollTop;
		if (window.scrollX !== void 0) {
			scrollLeft = window.scrollX;
			scrollTop = window.scrollY;
		}
		else {
			/* IE11以下向け */
			var _html = document.documentElement;
			scrollLeft = _html.scrollLeft;
			scrollTop = _html.scrollTop;
		}
		var left = rect.left + scrollLeft;
		var top = rect.top + scrollTop;
		var right = rect.right + scrollLeft;
		var bottom = rect.bottom + scrollTop;
		return { top: top, bottom: bottom, left: left, right: right, height: (bottom - top), width: (right - left) };
	},

	//---------------------------------------------------------------------------
	// pzpr.util.checkpid()  メニューなどが表示対象のパズルかどうか返す
	//---------------------------------------------------------------------------
	checkpid: function (str: string, pid: string) {
		var matches = str.match(/!?[a-z0-9]+/g), isdisp = true;
		if (!!matches) {
			isdisp = false;
			for (var i = 0; i < matches.length; i++) {
				if (matches[i].charAt(0) !== "!") { if (matches[i] === pid) { isdisp = true; } }
				else { isdisp = (matches[i].substr(1) !== pid); }
			}
		}
		return isdisp;
	}
};