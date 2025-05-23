// util.js v3.4.0

import type { Puzzle } from "../puzzle/Puzzle";
const eventMouseDown = ["pointerdown"];
const eventMouseMove = ["pointermove"];
const eventMouseUp = ["pointerup"];
const eventMouseCancel = ["pointercancel"];



//----------------------------------------------------------------------
// EventやDOM関連のツール的関数群
//----------------------------------------------------------------------

//---------------------------------------------------------------
// pzpr.jsが読み込まれているスクリプトのパスを取得する
// export const getpath = function () {
// 	if (env.browser) {
// 		const srcs = document.getElementsByTagName('script');
// 		for (let i = 0; i < srcs.length; i++) {
// 			const result = srcs[i].src.match(/^(.*\/)pzpr\.js(?:\?.*)?$/);
// 			if (result) { return result[1] + (!result[1].match(/\/$/) ? '/' : ''); }
// 		}
// 	}
// 	else {
// 		return `${require('node:path').dirname(__filename)}/${__filename.match('pzpr.js') ? '' : '../'}`;
// 	}
// 	return "";
// }

//---------------------------------------------------------------
// 現在の時間を取得
export const currentTime = function () { return (new Date()).getTime(); }

//---------------------------------------------------------------
// Elementの生成関連
//---------------------------------------------------------------
export const unselectable = function (el: HTMLElement) {

	//el.style.MozUserSelect = 'none';
	//el.style.KhtmlUserSelect = 'none';
	//el.style.webkitUserSelect = 'none';
	//el.style.msUserSelect = 'none';
	el.style.userSelect = 'none';
	//el.unselectable = "on";
	return el;
}

//----------------------------------------------------------------------
// pzpr.util.addEvent()          addEventListener()を呼び出す
//----------------------------------------------------------------------
export const addEvent = function (el: HTMLElement, type: string, self: Puzzle, callback: (e: any) => void, capt: boolean = false) {
	let types = [type];
	if (type === "mousedown") { types = eventMouseDown; }
	else if (type === "mousemove") { types = eventMouseMove; }
	else if (type === "mouseup") { types = eventMouseUp; }
	else if (type === "mousecancel") { types = eventMouseCancel; }

	types.forEach(function (type) {
		el.addEventListener(type, callback, { passive: !!capt });
	});

	return function remover() {
		types.forEach(function (type) { el.removeEventListener(type, callback, !!capt); });
	};
}

//---------------------------------------------------------------------------
// pzpr.util.getMouseButton() 左/中/右ボタンが押されているかチェックする
//---------------------------------------------------------------------------
export const getMouseButton = function (e: MouseEvent | TouchEvent | PointerEvent) {
	if (isTouchEvent(e)) {
		/* touchイベントだった場合 */
		return (e.touches.length === 1 ? 'left' : '');
	}
	if (isPointerEvent(e) && e.pointerType !== 'mouse') {
		/* pointerイベントだった場合 */
		return (e.isPrimary ? 'left' : '');
	}
	return (['left', 'middle', 'right'] as const)[(e.button !== void 0 ? e.button : e.which - 1)] || '';
}

//----------------------------------------------------------------------
// pzpr.util.getPagePos() イベントが起こったページ上の座標を返す
// pzpr.util.pageX()      イベントが起こったページ上のX座標を返す
// pzpr.util.pageY()      イベントが起こったページ上のY座標を返す
//----------------------------------------------------------------------
export const isTouchEvent = function (e: Event): e is TouchEvent {
	// @ts-ignore
	return e.touches !== void 0
}

export const isPointerEvent = function (e: Event): e is PointerEvent {
	// @ts-ignore
	return !!e.pointerType
}

export const getPagePos = function (e: MouseEvent | TouchEvent) {
	return { px: pageX(e), py: pageY(e) };
}
export const pageX = function (e: MouseEvent | TouchEvent) {
	if (isTouchEvent(e)) {
		if (e.touches.length > 0) {
			const len = e.touches.length;
			let pos = 0;
			if (len > 0) {
				for (let i = 0; i < len; i++) { pos += e.touches[i].pageX; }
				return pos / len;
			}
		}
		return 0;
	}
	return e.pageX || 0;
}
export const pageY = function (e: MouseEvent | TouchEvent) {
	if (isTouchEvent(e)) {
		if (e.touches.length > 0) {
			const len = e.touches.length;
			let pos = 0;
			if (len > 0) {
				for (let i = 0; i < len; i++) { pos += e.touches[i].pageY; }
				return pos / len;
			}
		}
		return 0;
	}
	return e.pageY || 0;
}

//--------------------------------------------------------------------------------
// pzpr.util.getRect()   エレメントの四辺の座標を返す
//--------------------------------------------------------------------------------
export const getRect = function (el: HTMLElement) {
	// if (!env.browser) {
	// 	return { top: 0, bottom: 0, left: 0, right: 0, height: 0, width: 0 };
	// }
	const rect = el.getBoundingClientRect();
	let scrollLeft: number;
	let scrollTop: number;
	if (window.scrollX !== void 0) {
		scrollLeft = window.scrollX;
		scrollTop = window.scrollY;
	}
	else {
		/* IE11以下向け */
		const _html = document.documentElement;
		scrollLeft = _html.scrollLeft;
		scrollTop = _html.scrollTop;
	}
	const left = rect.left + scrollLeft;
	const top = rect.top + scrollTop;
	const right = rect.right + scrollLeft;
	const bottom = rect.bottom + scrollTop;


	const style = getComputedStyle(el);

	const paddingX = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
	const paddingY = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);

	return { top: top, bottom: bottom, left: left, right: right, height: (bottom - top - paddingY), width: (right - left - paddingX) };
}

//---------------------------------------------------------------------------
// pzpr.util.checkpid()  メニューなどが表示対象のパズルかどうか返す
//---------------------------------------------------------------------------
export const checkpid = function (str: string, pid: string) {
	const matches = str.match(/!?[a-z0-9]+/g);
	let isdisp = true;
	if (!!matches) {
		isdisp = false;
		for (let i = 0; i < matches.length; i++) {
			if (matches[i].charAt(0) !== "!") { if (matches[i] === pid) { isdisp = true; } }
			else { isdisp = (matches[i].substr(1) !== pid); }
		}
	}
	return isdisp;
}
