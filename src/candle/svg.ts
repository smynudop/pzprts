// candle.svg.js

import env from './env.js';
import metrics from './metrics.js';
import WrapperBase from './base.js';

/* ------------------- */
/*   SVG描画可能条件   */
/* ------------------- */
const _doc = metrics.document;
const isBrowser = env.browser;

const wrapperType = 'svg';
const isWrapperEnable = !(typeof _doc === 'undefined' || !_doc.createElementNS);

const SVGNS = "http://www.w3.org/2000/svg";
const XLINKNS = "http://www.w3.org/1999/xlink";

const needTextLengthWA = (function (UA) {
	return (UA.match(/Trident\//) || (UA.match(/Safari\//) && UA.match(/Edge\//)));
})((isBrowser && navigator.userAgent) || '');

function newEL(tag: any) { return _doc.createElementNS(SVGNS, tag); }

/* ------------------------------------------- */
/*   VectorContext(SVG)クラス用const文字列集   */
/* ------------------------------------------- */
const _2PI = 2 * Math.PI;
const S_PATH_MOVE = 'M';
const S_PATH_LINE = 'L';
const S_PATH_ARCTO = 'A';
const S_PATH_CLOSE = 'z';
//	S_ATT_ID          = 'id',
const S_ATT_PATH = 'd';
const S_ATT_FILL = 'fill';
const S_ATT_STROKE = 'stroke';
const S_ATT_STROKEWIDTH = 'stroke-width';
const S_ATT_RENDERING = 'shape-rendering';
const S_NONE = 'none';
const S_ANCHOR = { left: 'start', center: 'middle', right: 'end' };
const S_HEIGHT = (() => {
	const UA = (typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '');
	if (UA.match(/Chrome/)) {
		return { 'candle-top': -0.72, top: -0.95, hanging: -0.72, middle: -0.35, alphabetic: 0, bottom: 0.25 };
	}
	if (UA.match(/AppleWebKit/)) {
		return { 'candle-top': -0.7, top: -0.9, hanging: -0.9, middle: -0.35, alphabetic: 0, bottom: 0.25 };
	}
	if (UA.match(/Trident/)) {
		return { 'candle-top': -0.74, top: -1.02, hanging: -1.02, middle: -0.32, alphabetic: 0, bottom: 0.45 };
	}
	/* if(UA.match(/Gecko/)) */ 
		if (UA.match(/Win/)) {
			return { 'candle-top': -0.7, top: -0.85, hanging: -0.85, middle: -0.34, alphabetic: 0, bottom: 0.15 };
		}
		
			return { 'candle-top': -0.76, top: -0.9, hanging: -0.9, middle: -0.38, alphabetic: 0, bottom: 0.08 };
})();

/* ----------------- */
/*   SVG用ラッパー   */
/* ----------------- */
class SVGWrapper extends WrapperBase<SVGSVGElement> {
	vid: string
	elements: Record<string, SVGSVGElement>;
	_textcache: Record<string, any>;
	target: any;
	layers: Record<string, any>;
	cpath: (string | number)[];
	lastpath: string;
	freezepath: boolean;
	enableTextLengthWA: boolean
	constructor(parent: any) {
		super(parent);

		this.use = this.getTypeList();

		// 外部から変更される追加プロパティ
		this.vid = '';
		this.elements = {};
		this._textcache = {};

		// variables for internal
		this.target = null;	// エレメントの追加対象となるオブジェクト
		this.layers = {};

		// 描画中path
		this.cpath = [];
		this.lastpath = '';
		this.freezepath = false;

		this.enableTextLengthWA = !!needTextLengthWA;
	}
	getTypeList() { return {}; } // Overridden later

	/* additional functions (for initialize) */
	initElement() {
		if (isBrowser) {
			this.canvas.style.overflow = 'hidden';
		}
		const rect = metrics.getRectSize(this.canvas);
		const root = this.child = _doc.createElementNS(SVGNS, 'svg');
		root.setAttribute('xmlns', SVGNS);
		root.setAttribute('xmlns:xlink', XLINKNS);
		root.setAttribute('font-size', "10px");
		root.setAttribute('font-family', "sans-serif");
		//root.style.maxWidth = `${rect.width}px`
		// root.setAttribute('width', rect.width.toString());
		// root.setAttribute('height', rect.height.toString());
		root.setAttribute('viewBox', [0, 0, 500, 500].join(' '));
		if (!!this.canvas.appendChild) {
			this.canvas.appendChild(root);
		}
	}
	initFunction() {
		function btoa(bin: string) {
			if (isBrowser) { return window.btoa(bin); }
			if (Buffer.isBuffer(bin)) { return bin.toString('base64'); }
			return new Buffer(bin.toString(), 'binary').toString('base64'); 
		}
		const xmldeclare = '<?xml version="1.0" encoding="UTF-8"?>\n';
		function getOuterHTML(el: SVGSVGElement) { return el.outerHTML; }

		const root = this.child;
		this.canvas.toDataURL = function (type, quality) {
			return `data:image/svg+xml;base64,${btoa(getOuterHTML(root))}`;
		};
		this.canvas.toBlob = function (callback, type, quality) {
			callback(new Blob([xmldeclare + getOuterHTML(root)], { type: 'image/svg+xml' }));
		};

		this.canvas.toBuffer = function (type: string, quality: number) {
			return xmldeclare + getOuterHTML(root);
		};
	}
	initLayer() {
		this.setLayer();

		const rect = metrics.getRectSize(this.canvas);
		this.rect(0, 0, rect.width, rect.height);
		this.addVectorElement(false, false);
	}

	clear() {
		const root = this.child;
		let el = root.firstChild;
		while (!!el) { root.removeChild(el); el = root.firstChild; }

		/* resetElement */
		this.vid = '';
		this.elements = {};
		this.layers = {};
		this.target = this.child;
		this.setLayer();
		this._textcache = {};
	}

	/* layer functions */
	setLayer(layerid: string = null, option: any = null) {
		option = option || {};
		this.vid = '';
		if (!!layerid) {
			let layer = this.layers[layerid];
			if (!layer) {
				layer = this.layers[layerid] = newEL('g');
				this.child.appendChild(layer);
			}
			this.target = layer;
		}
		else {
			this.target = this.child;
		}

		if (option.rendering) { this.setRendering(option.rendering); }

		this.freezepath = (!!option && option.freeze);
	}

	/* property functions */
	setRendering(render: string) {
		this.target.setAttribute(S_ATT_RENDERING, render);
	}

	changeSize(width: number, height: number) {
		if (isBrowser) {
			// this.canvas.style.width = width + 'px';
			// this.canvas.style.height = height + 'px';
		}
		const child = this.child;
		// child.setAttribute('width', width.toString());
		// child.setAttribute('height', height.toString());
		const m = child.getAttribute('viewBox').split(/ /);
		child.setAttribute('viewBox', [m[0], m[1], width, height].join(' '));
	}

	/* Canvas API functions (for transform) */
	translate(left: number, top: number) {
		const m = this.child.getAttribute('viewBox').split(/ /);
		m[0] = (-left).toString(); m[1] = (-top).toString();
		this.child.setAttribute('viewBox', m.join(' '));
	}

	/* Canvas API functions (for path) */
	beginPath() {
		this.cpath = [];
		this.lastpath = '';
	}
	closePath() {
		this.cpath.push(S_PATH_CLOSE);
		this.lastpath = S_PATH_CLOSE;
	}

	moveTo(x: number, y: number) {
		this.cpath.push(S_PATH_MOVE, x, y);
		this.lastpath = S_PATH_MOVE;
	}
	lineTo(x: number, y: number) {
		if (this.lastpath !== S_PATH_LINE) { this.cpath.push(S_PATH_LINE); }
		this.cpath.push(x, y);
		this.lastpath = S_PATH_LINE;
	}
	rect(x: number, y: number, w: number, h: number) {
		this.cpath.push(S_PATH_MOVE, x, y, S_PATH_LINE, (x + w), y, (x + w), (y + h), x, (y + h), S_PATH_CLOSE);
		this.lastpath = S_PATH_CLOSE;
	}
	arc(cx: number, cy: number, r: number, startRad: number, endRad: number, antiClockWise: boolean) {
		let sx;
		let sy;
		let ex;
		let ey;
		if (endRad - startRad >= _2PI) { sx = cx + r; sy = cy; ex = cx + r; ey = cy; }
		else {
			sx = cx + r * Math.cos(startRad); sy = cy + r * Math.sin(startRad);
			ex = cx + r * Math.cos(endRad); ey = cy + r * Math.sin(endRad);
		}
		if (endRad - startRad >= _2PI) { sy += 0.125; }
		const unknownflag = (startRad > endRad) !== (Math.abs(endRad - startRad) > Math.PI);
		const islong = (((antiClockWise ? 1 : 0) ^ (unknownflag ? 1 : 0)) ? 1 : 0);
		const sweep = ((islong === 0 ? 1 : 0) ^ (unknownflag ? 1 : 0)) ? 1 : 0;
		this.cpath.push(S_PATH_MOVE, sx, sy, S_PATH_ARCTO, r, r, 0, islong, sweep, ex, ey);
		this.lastpath = S_PATH_ARCTO;
	}

	/* Canvas API functions (for drawing) */
	fill() { this.addVectorElement(true, false); }
	stroke() { this.addVectorElement(false, true); }
	shape() { this.addVectorElement(true, true); } /* extension */

	/* Canvas API functions (rect) */
	fillRect(x: number, y: number, w: number, h: number) {
		const stack = this.cpath;
		this.cpath = [];
		this.rect(x, y, w, h);
		this.addVectorElement(true, false);
		this.cpath = stack;
	}
	strokeRect(x: number, y: number, w: number, h: number) {
		const stack = this.cpath;
		this.cpath = [];
		this.rect(x, y, w, h);
		this.addVectorElement(false, true);
		this.cpath = stack;
	}
	shapeRect(x: number, y: number, w: number, h: number) {
		const stack = this.cpath;
		this.cpath = [];
		this.rect(x, y, w, h);
		this.addVectorElement(true, true);
		this.cpath = stack;
	}

	/* extended functions */
	setLinePath() {
		const _args = arguments;
		const _len = _args.length;
		const len = _len - ((_len | 1) ? 1 : 2);
		const a = [];
		for (let i = 0; i < len; i += 2) { a[i >> 1] = [_args[i], _args[i + 1]]; }
		this.beginPath();
		this.setLinePath_com.call(this, a);
		if (_args[_len - 1]) { this.cpath.push(S_PATH_CLOSE); }
	}
	setOffsetLinePath() {
		const _args = arguments;
		const _len = _args.length;
		const len = _len - ((_len | 1) ? 1 : 2);
		const a = [];
		for (let i = 0; i < len - 2; i += 2) { a[i >> 1] = [_args[i + 2] + _args[0], _args[i + 3] + _args[1]]; }
		this.beginPath();
		this.setLinePath_com.call(this, a);
		if (_args[_len - 1]) { this.cpath.push(S_PATH_CLOSE); }
	}
	setLinePath_com(array: any[]) {
		for (let i = 0, len = array.length; i < len; i++) {
			this.cpath.push(i === 0 ? S_PATH_MOVE : S_PATH_LINE);
			this.cpath.push(array[i][0], array[i][1]);
		}
	}

	strokeLine(x1: number, y1: number, x2: number, y2: number) {
		const stack = this.cpath;
		this.cpath = [S_PATH_MOVE, x1, y1, S_PATH_LINE, x2, y2];
		this.addVectorElement(false, true);
		this.cpath = stack;
	}
	strokeDashedLine(x1: number, y1: number, x2: number, y2: number, sizes: string[]) {
		const stack = this.cpath;
		this.cpath = [S_PATH_MOVE, x1, y1, S_PATH_LINE, x2, y2];
		const obj = this.addVectorElement(false, true);
		obj.setAttribute('stroke-dasharray', sizes.join(" "));
		this.cpath = stack;
	}
	strokeCross(cx: number, cy: number, l: number) {
		const stack = this.cpath;
		this.cpath = [S_PATH_MOVE, (cx - l), (cy - l), S_PATH_LINE, (cx + l), (cy + l),
			S_PATH_MOVE, (cx - l), (cy + l), S_PATH_LINE, (cx + l), (cy - l)];
		this.addVectorElement(false, true);
		this.cpath = stack;
	}

	/* extended functions (circle) */
	fillCircle(cx: number, cy: number, r: number) {
		const stack = this.cpath;
		this.cpath = [];
		this.arc(cx, cy, r, 0, _2PI, false);
		this.cpath.push(S_PATH_CLOSE);
		this.addVectorElement(true, false);
		this.cpath = stack;
	}
	strokeCircle(cx: number, cy: number, r: number) {
		const stack = this.cpath;
		this.cpath = [];
		this.arc(cx, cy, r, 0, _2PI, false);
		this.cpath.push(S_PATH_CLOSE);
		this.addVectorElement(false, true);
		this.cpath = stack;
	}
	shapeCircle(cx: number, cy: number, r: number) {
		const stack = this.cpath;
		this.cpath = [];
		this.arc(cx, cy, r, 0, _2PI, false);
		this.cpath.push(S_PATH_CLOSE);
		this.addVectorElement(true, true);
		this.cpath = stack;
	}

	/* SVG Special functions */
	getDefsElement() {
		// defs要素がなかったら作成する
		let defs = this.child.querySelector('defs');
		if (!defs) {
			defs = _doc.createElementNS(SVGNS, 'defs');
			this.child.insertBefore(defs, (this.child.firstChild || null));
		}
		return defs;
	}
	getImageElement(image: HTMLImageElement) {
		/* defsにimage要素がある場合はそれを参照する */
		const defs = this.getDefsElement();
		let imgel = null;
		const imgs = defs.querySelectorAll("image");
		for (let i = 0; i < imgs.length; i++) {
			if (imgs[i].getAttributeNS(XLINKNS, "href") === image.src) { imgel = imgs[i]; break; }
		}
		/* defsにimage要素がない場合はdefsにimage要素を追加して返す */
		if (!imgel) {
			imgel = newEL('image');
			imgel.setAttribute('id', `${!!imgel.ownerDocument ? `${this.canvasid}_` : ''}img${imgs.length}`);
			imgel.setAttribute("width", image.width);
			imgel.setAttribute("height", image.height);
			imgel.setAttributeNS(XLINKNS, "xlink:href", image.src);

			defs.appendChild(imgel);
		}
		return imgel;
	}
	getImageSymbol(image: HTMLImageElement, sx: number, sy: number, sw: number, sh: number) {
		/* defsにimage・viewBoxが共通のsymbol要素がある場合はそれを参照する */
		const defs = this.getDefsElement();
		const viewbox = [sx, sy, sw, sh].join(" ");
		let symbol = null;
		const syms = defs.querySelectorAll("symbol");
		for (let i = 0; i < syms.length; i++) {
			if (syms[i].getAttribute("viewBox") === viewbox) { symbol = syms[i]; break; }
		}
		/* defsにimage・viewBoxが共通のsymbol要素がない場合はdefsにsymbol要素を追加して返す */
		if (!symbol) {
			symbol = _doc.createElementNS(SVGNS, 'symbol');
			symbol.setAttribute("id", `${!!symbol.ownerDocument ? `${this.canvasid}_` : ''}symimg${syms.length}`);
			symbol.setAttribute("viewBox", viewbox);

			const use = _doc.createElementNS(SVGNS, 'use');
			use.setAttributeNS(XLINKNS, "xlink:href", `#${this.getImageElement(image).getAttribute("id")}`);
			symbol.appendChild(use);

			defs.appendChild(symbol);
		}
		return symbol;
	}

	/* Canvas API functions (for text) */
	fillText(text: string, x: number, y: number, maxLength: number) {
		const el = (!!this.vid ? this.elements[this.vid] : null);
		if (!!text && !!this.fillStyle && this.fillStyle !== "none") {
			const el2 = this.fillText_main(el, text, x, y, maxLength);
			if (!el && !!this.vid) { this.elements[this.vid] = el2; }
		}
		else if (!!el) { this.hide(el); }
		this.vid = '';
	}
	fillText_main(el: SVGSVGElement, text: string, x: number, y: number, maxLength: number) {
		const newel = !el;
		const _cache = (!!this.vid ? this._textcache[this.vid] || {} : {});
		if (newel) { el = newEL('text'); }
		else { this.show(el); }

		if (el.getAttribute(S_ATT_FILL) !== this.fillStyle) { el.setAttribute(S_ATT_FILL, this.fillStyle); }

		if (_cache.x !== x || _cache.y !== y || _cache.ml !== maxLength || _cache.ta !== this.textAlign || _cache.tb !== this.textBaseline || _cache.font !== this.font) {
			//@ts-ignore
			const top = y - metrics.getoffsetHeight(text, this.font) * S_HEIGHT[this.textBaseline.toLowerCase()];
			//@ts-ignore
			const anchor = S_ANCHOR[this.textAlign.toLowerCase()];

			if (el.getAttribute('x') !== x.toString()) { el.setAttribute('x', x.toString()); }
			if (el.getAttribute('y') !== top.toString()) { el.setAttribute('y', top.toString()); }
			if (el.getAttribute('text-anchor') !== anchor) { el.setAttribute('text-anchor', anchor); }
			if ((el.getAttribute('textLength') || '') !== maxLength?.toString()) {
				if (!!maxLength) {
					el.setAttribute('textLength', maxLength?.toString());
					el.setAttribute('lengthAdjust', 'spacingAndGlyphs');
				}
				else {
					el.removeAttribute('textLength');
					el.removeAttribute('lengthAdjust');
				}
			}

			_cache.x = x;
			_cache.y = y;
			_cache.ml = maxLength;
			_cache.ta = this.textAlign;
			_cache.tb = this.textBaseline;
		}

		if (_cache.font !== this.font) {
			if (this.font.match(/(.+\s)?([0-9]+)px (.+)$/)) {
				const style = RegExp.$1;
				const size = RegExp.$2;
				const family = RegExp.$3;
				el.setAttribute('font-size', size);

				if (!family.match(/^sans\-serif$/i)) { el.setAttribute('font-family', family); }
				else { el.removeAttribute('font-family'); }

				if (style.match(/(italic|oblique)/)) { el.setAttribute('font-style', RegExp.$1); }
				else { el.removeAttribute('font-style'); }

				if (style.match(/(bold|bolder|lighter|[1-9]00)/)) { el.setAttribute('font-weight', RegExp.$1); }
				else { el.removeAttribute('font-weight'); }
			}
			else {
				el.setAttribute('font', this.font);
			}

			_cache.font = this.font;
		}

		if (el.textContent !== text) { el.textContent = text; }

		if (!!this.vid) { this._textcache[this.vid] = _cache; }

		if (newel) { this.target.appendChild(el); }

		if (needTextLengthWA && this.enableTextLengthWA && (_cache.ta === 'center' || _cache.ta === 'right') && !!maxLength) {
			el.removeAttribute('textLength');
			const rect = el.getBoundingClientRect();
			el.setAttribute('x', _cache.x + (rect.width - maxLength) / ((_cache.ta === 'center') ? 2 : 1));
			el.setAttribute('textLength', maxLength.toString());
		}

		return el;
	}

	/* Canvas API functions (for image) */
	drawImage(image: HTMLImageElement, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) {
		const el = (!!this.vid ? this.elements[this.vid] : null);
		if (!!image) {
			if (sw === (void 0)) { sw = image.width; sh = image.height; }
			if (dx === (void 0)) { dx = sx; sx = 0; dy = sy; sy = 0; dw = sw; dh = sh; }

			const el2 = this.drawImage_main(el, image, sx, sy, sw, sh, dx, dy, dw, dh);
			if (!el && !!this.vid) { this.elements[this.vid] = el2; }
		}
		else if (!!el) { this.hide(el); }
		this.vid = '';
	}
	drawImage_main(el: SVGSVGElement, image: HTMLImageElement, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) {
		const newel = !el;
		if (newel) { el = newEL('use'); }
		else { this.show(el); }
		const refid = this.getImageSymbol(image, sx, sy, sw, sh).getAttribute("id");

		/* viewBoxはgetImageSymbol()で設定済み */
		if (el.getAttribute('x') !== dx.toString()) { el.setAttribute('x', dx.toString()); }
		if (el.getAttribute('y') !== dy.toString()) { el.setAttribute('y', dy.toString()); }
		if (el.getAttribute('width') !== dw.toString()) { el.setAttribute('width', dw.toString()); }
		if (el.getAttribute('height') !== dh.toString()) { el.setAttribute('height', dh.toString()); }
		if (el.getAttributeNS(XLINKNS, "xlink:href") !== `#${refid}`) {
			el.setAttributeNS(XLINKNS, "xlink:href", `#${refid}`);
		}

		if (newel) { this.target.appendChild(el); }
		return el;
	}

	/* internal functions */
	addVectorElement(isfill: boolean, isstroke: boolean) {
		isfill = isfill && !!this.fillStyle && (this.fillStyle !== "none");
		isstroke = isstroke && !!this.strokeStyle && (this.strokeStyle !== "none");
		const el = (!!this.vid ? this.elements[this.vid] : null);
		let el2 = null;
		if (isfill || isstroke) {
			el2 = this.addVectorElement_main(el, isfill, isstroke);
			if (!el && !!this.vid) { this.elements[this.vid] = el2; }
		}
		else if (!!el) { this.hide(el); }
		this.vid = '';
		return el2;
	}
	addVectorElement_main(el: SVGSVGElement, isfill: boolean, isstroke: boolean) {
		const newel = !el;
		if (newel) {
			el = newEL('path');
			el.setAttribute(S_ATT_FILL, S_NONE);
			el.setAttribute(S_ATT_STROKE, S_NONE);
		}
		else { this.show(el); }

		if (!this.freezepath || newel) {
			const path = this.cpath.join(' ');
			const linewidth = (isstroke ? this.lineWidth : null);
			if (el.getAttribute(S_ATT_PATH) !== path) { el.setAttribute(S_ATT_PATH, path); }
			if (el.getAttribute(S_ATT_STROKEWIDTH) !== linewidth?.toString()) { el.setAttribute(S_ATT_STROKEWIDTH, linewidth?.toString()); }
		}

		const fillcolor = (isfill ? this.fillStyle : S_NONE);
		const strokecolor = (isstroke ? this.strokeStyle : S_NONE);
		if (el.getAttribute(S_ATT_FILL) !== fillcolor) { el.setAttribute(S_ATT_FILL, fillcolor); }
		if (el.getAttribute(S_ATT_STROKE) !== strokecolor) { el.setAttribute(S_ATT_STROKE, strokecolor); }

		if (newel) { this.target.appendChild(el); }
		return el;
	}

	/* VectorID Functions */
	vhide(vids: any) {
		const el = this.elements[this.vid];
		if (!!el) { this.hide(el); }
	}

	show(el: SVGElement) { el.removeAttribute('display'); }
	hide(el: SVGElement) { el.setAttribute('display', 'none'); }
}

export default { WrapperClass: SVGWrapper, wrapperType, isWrapperEnable };
