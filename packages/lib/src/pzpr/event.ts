// event.js v3.4.1
import type { Puzzle } from "../puzzle/Puzzle";
export const initPzpr = function (pzpr: any) {
	//---------------------------------------------------------------
	// 起動時関連関数
	//---------------------------------------------------------------
	let preinit = true;
	let loadfun: (() => void)[] = [];
	pzpr.on = function (eventtype: string, func: () => void) {
		if (eventtype === 'load') {
			if (preinit) { loadfun.push(func); }
			else { func(); }
		}
	};

	//----------------------------------------------------------------------
	// 起動時処理実行処理
	//----------------------------------------------------------------------
	function postload(e: any) {
		if (preinit) {
			preinit = false;
			for (let i = 0; i < loadfun.length; i++) { loadfun[i](); }
			loadfun = [];
		}
	}

	if (!pzpr.env.browser) { }
	else if (document.readyState === 'complete') {
		setTimeout(postload, 10);
	}
	else {
		document.addEventListener('DOMContentLoaded', postload, false);
		window.addEventListener('load', postload, false);
	}

	//---------------------------------------------------------------------------
	// addKeyEvents()  キーボード入力発生時に指定されたパズルへ通知する準備を行う
	// exec????()      各パズルのキー入力へ分岐する
	//---------------------------------------------------------------------------
	let keytarget: Puzzle | null = null;
	function execKeyDown(e: KeyboardEvent) {
		if (!!keytarget && !!keytarget.key) { keytarget.key.e_keydown(e); }
	}
	function execKeyUp(e: KeyboardEvent) {
		if (!!keytarget && !!keytarget.key) { keytarget.key.e_keyup(e); }
	}
	pzpr.on('load', () => {
		// キー入力イベントの設定
		//pzpr.util.addEvent(document, 'keydown', pzpr, execKeyDown);
		//pzpr.util.addEvent(document, 'keyup', pzpr, execKeyUp);
	});

	//---------------------------------------------------------------------------
	// connectKeyEvents()  キーボード入力に関するイベントを指定したパズルへ通知する準備を行う
	//---------------------------------------------------------------------------
	pzpr.connectKeyEvents = function (puzzle: Puzzle) {
		keytarget = puzzle;
	};

};
