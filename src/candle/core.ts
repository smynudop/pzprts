// candle.core.js
/* global VERSION */

import env from './env.js';
import SVGWrapper from './svg.js';
import CanvasWrapper from './canvas';
import metrics from './metrics.js';
import type WrapperBase from './base.js';

/* ------------- */
/*   variables   */
/* ------------- */
const _color: Record<string, string> = {};
const _order: string[] = [];
const _wrapper: Record<string, { new(parent: any): WrapperBase<any> }> = {};

/* ---------- */
/*   arrays   */
/* ---------- */
const _hex = (function () {
	const tbl: Record<string, string> = {};
	for (let r = 256; r < 512; r++) { tbl[(r - 256).toString()] = r.toString(16).substr(1); }
	return tbl;
})();

type CandleContext<TElement> = TElement extends HTMLCanvasElement ? CanvasRenderingContext2D : WrapperBase<any>;

/* ---------------------- */
/*   Candleオブジェクト   */
/* ---------------------- */
const Candle = {
	version: "",

	env,

	document: metrics.document,


	/* Selected & Enable types */
	enable: {} as Record<string, boolean>,
	current: '',
	select: function (type: string) {
		if (!this.enable[type]) { return false; }
		this.current = type;
		return true;
	},

	/* color parser */
	parse: function (rgbstr: string) {
		if (!_color[rgbstr]) {
			if (rgbstr.substr(0, 4) === 'rgb(') {
				const m = rgbstr.match(/\d+/g);
				_color[rgbstr] = ["#", _hex[m[0]], _hex[m[1]], _hex[m[2]]].join('');
			}
			else { _color[rgbstr] = rgbstr; }
		}
		return _color[rgbstr];
	},

	start: function <TElement>(element: TElement, type: string, initCallBack?: (context: CandleContext<TElement>) => void) {
		metrics.init();

		let context: any;
		if (!isCanvasElement(element)) {
			let choice = type;
			if (!this.enable[choice]) { choice = this.current; }
			if (!choice || !this.enable[choice]) { throw 'No canvas environment is installed'; }
			const wrapper = new _wrapper[choice](element);
			wrapper.init();
			context = wrapper
		}
		else {
			context = element.getContext('2d');
		}

		if (!!initCallBack) { initCallBack(context); }
	}
};

const isCanvasElement = (element: any): element is HTMLCanvasElement => {
	return !!element.getContext && !!element.toBuffer;
};

class TypeList {
	constructor(type: string) {
		for (const wrapperType of _order) {
			//@ts-ignore
			this[wrapperType] = (wrapperType === type);
		}
	}
}

for (const wrapper of [SVGWrapper, CanvasWrapper]) {
	if (wrapper.isWrapperEnable) {
		const type = wrapper.wrapperType;
		_order.push(type);
		Candle.enable[type] = true;
		if (!Candle.current) { Candle.current = type; }

		_wrapper[type] = wrapper.WrapperClass;
		wrapper.WrapperClass.prototype.getTypeList = () => new TypeList(type);
	}
}

// extern
export default Candle;
