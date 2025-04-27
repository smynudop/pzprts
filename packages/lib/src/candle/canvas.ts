// candle.canvas.js

import env from './env.js';
import metrics from './metrics.js';
import WrapperBase from './base.js';

/* ---------------------- */
/*   canvas描画可能条件   */
/* ---------------------- */
const _doc = metrics.document;
const isBrowser = env.browser;

const wrapperType = 'canvas';
const isWrapperEnable = (() => {
	return true;
})();

const _2PI = 2 * Math.PI;
const CTOP_OFFSET = (() => {
	const UA = (typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '');
	if (UA.match(/Chrome/)) {
		return -0.72;
	}
	if (UA.match(/AppleWebKit/)) {
		return -0.7;
	}
	if (UA.match(/Trident/)) {
		return -0.74;
	}
	/* if(UA.match(/Gecko/)) */
	if (UA.match(/Win/)) {
		return -0.7;
	}

	return -0.76;
})();

/* -------------------- */
/*   Canvas用ラッパー   */
/* -------------------- */
class CanvasWrapper extends WrapperBase<HTMLCanvasElement> {
	x0: number
	y0: number
	isedge: boolean
	context: CanvasRenderingContext2D
	currentLayerId: string
	isedgearray: { [key: string]: boolean }
	constructor(parent: HTMLElement) {
		super(parent);

		// variables for internal
		//superのinitで初期化されている
		this.context = null!;	// 本来のCanvasRenderingContext2Dオブジェクト

		this.use = this.getTypeList();

		// Layer additional
		this.currentLayerId = '_empty';
		this.isedgearray = { _empty: false };
		this.isedge = false;

		this.x0 = 0;
		this.y0 = 0;
	}
	getTypeList() { return {}; } // Overridden later

	setkey(vid: any) { return this; }
	hidekey(vid: any) { return this; }
	release(vid: any) { return this; }

	/* extend functions (initialize) */
	initElement() {
		this.child = _doc.createElement('canvas')
		const root = this.child
		if (isBrowser) {
			this.canvas.style.overflow = 'hidden';
		}
		const rect = metrics.getRectSize(this.canvas);
		root.width = rect.width;
		root.height = rect.height;
		if (isBrowser) {
			root.style.width = `${rect.width}px`;
			root.style.height = `${rect.height}px`;
			this.canvas.appendChild(root);
		}
		this.context = root.getContext('2d')!;
	}
	initFunction() {
		function atob(base64: string) {
			return window.atob(base64);
			// if (isBrowser) { return window.atob(base64); }
			// return new Buffer(RegExp.$2, 'base64').toString('binary');
		}

		const root = this.child!;
		this.canvas.toDataURL = function (type, quality) {
			return root.toDataURL(type || void 0, quality);
		};
		this.canvas.toBlob = function (callback, type, quality) {
			if (typeof root.toBlob === 'function') {
				root.toBlob(callback, type, quality);
			}
			else {
				/* Webkit, BlinkにtoBlobがない... */
				/* IE, EdgeのmsToBlobもtypeが受け付けられないので回避 */
				root.toDataURL(type || void 0, quality).match(/data:(.*);base64,(.*)/);
				const bin = atob(RegExp.$2);
				const len = bin.length;
				const buf = new Uint8Array(len);
				for (let i = 0; i < len; i++) { buf[i] = bin.charCodeAt(i); }
				callback(new Blob([buf.buffer], { type: RegExp.$1 }));
			}
		};
		this.canvas.toBuffer = function (type: string, quality: number) {
			const dataurl = root.toDataURL(type || void 0, quality).replace(/^data:image\/\w+?;base64,/, '');
			// if (env.node) {
			// 	return new Buffer(dataurl, 'base64');
			// }
			let data: Uint8Array | string;
			if (typeof Uint8Array !== 'undefined') {
				const binary = atob(dataurl);
				data = new Uint8Array(binary.length);
				for (let i = 0; i < binary.length; i++) { data[i] = binary.charCodeAt(i); }
			}
			else {
				data = atob(dataurl);
			}
			return data;
		};
	}
	initLayer() {
		this.setLayer();
	}

	clear() {
		this.setProperties(true, true);
		this.context.setTransform(1, 0, 0, 1, 0, 0); // 変形をリセット
		this.context.translate(this.x0, this.y0);
		if (isBrowser) {
			const rect = metrics.getRectSize(this.canvas);
			this.context.clearRect(0, 0, rect.width, rect.height);
		}
	}

	/* layer functions */
	setLayer(layerid: string | null = null, option: any = null) {
		this.currentLayerId = (!!layerid ? layerid : '_empty');
		const layer = this.currentLayerId
		this.isedge = this.isedgearray[(this.isedgearray[layer] !== void 0) ? layer : "_empty"];
		this.setEdgeStyle();

		option = option || {};
		if (option.rendering) { this.setRendering(option.rendering); }
	}
	setEdgeStyle() {
		if (!isBrowser) { return; }
		const s = this.canvas.style;
		if ('imageRendering' in s) {
			s.imageRendering = '';
			if (this.isedge) {
				s.imageRendering = 'pixelated';
				if (!s.imageRendering) { s.imageRendering = '-webkit-optimize-contrast'; }
				if (!s.imageRendering) { s.imageRendering = '-moz-crisp-edges'; }
				if (!s.imageRendering) { s.imageRendering = '-o-crisp-edges'; }
			}
		}
	}

	/* property functions */
	setRendering(render: string) {
		this.isedge = this.isedgearray[this.currentLayerId] = (render === 'crispEdges');
		this.setEdgeStyle();
	}

	changeSize(width: number, height: number) {
		if (isBrowser) {
			const parent = this.canvas;
			parent.style.width = `${width}px`;
			parent.style.height = `${height}px`;
		}

		const child = this.child!;
		if (isBrowser) {
			const left = Number.parseInt(child.style.left);
			const top = Number.parseInt(child.style.top);
			width += (left < 0 ? -left : 0);
			height += (top < 0 ? -top : 0);
			child.style.width = `${width}px`;
			child.style.height = `${height}px`;
		}
		// child.width = width;
		// child.height = height;
	}

	/* Canvas API functions (for transform) */
	translate(left: number, top: number) {
		this.x0 = left;
		this.y0 = top;
		this.context.translate(left, top);
	}

	/* 内部用関数 */
	setProperties(isfill: boolean, isstroke: boolean) {
		isfill = isfill && !!this.fillStyle && (this.fillStyle !== "none");
		isstroke = isstroke && !!this.strokeStyle && (this.strokeStyle !== "none");
		const c = this.context;
		if (isfill) { c.fillStyle = this.fillStyle; }
		if (isstroke) { c.strokeStyle = this.strokeStyle; }
		c.lineWidth = this.lineWidth;
		c.font = this.font;
		c.textAlign = this.textAlign;
		c.textBaseline = this.textBaseline as CanvasTextBaseline;
		return (isfill || isstroke);
	}

	/* Canvas API functions (for path) */
	beginPath() { this.context.beginPath(); }
	closePath() { this.context.closePath(); }

	moveTo(x: number, y: number) {
		this.context.moveTo(x, y);
	}
	lineTo(x: number, y: number) {
		this.context.lineTo(x, y);
	}
	rect(x: number, y: number, w: number, h: number) {
		this.context.rect(x, y, w, h);
	}
	arc(cx: number, cy: number, r: number, startRad: number, endRad: number, antiClockWise: boolean) {
		this.context.arc(cx, cy, r, startRad, endRad, antiClockWise);
	}

	/* Canvas API functions (for drawing) */
	fill() {
		if (this.setProperties(true, false)) {
			this.context.fill();
		}
	}
	stroke() {
		if (this.setProperties(false, true)) {
			this.context.stroke();
		}
	}
	shape() { /* extension */
		if (this.setProperties(true, true)) {
			const c = this.context;
			if (!!this.fillStyle && this.fillStyle !== "none") { c.fill(); }
			if (!!this.strokeStyle && this.strokeStyle !== "none") { c.stroke(); }
		}
	}

	/* Canvas API functions (rect) */
	fillRect(x: number, y: number, w: number, h: number) {
		if (this.setProperties(true, false)) {
			this.context.fillRect(x, y, w, h);
		}
	}
	strokeRect(x: number, y: number, w: number, h: number) {
		if (this.setProperties(false, true)) {
			this.context.strokeRect(x, y, w, h);
		}
	}
	shapeRect(x: number, y: number, w: number, h: number) {
		if (this.setProperties(true, true)) {
			const c = this.context;
			if (!!this.fillStyle && this.fillStyle !== "none") { c.fillRect(x, y, w, h); }
			if (!!this.strokeStyle && this.strokeStyle !== "none") { c.strokeRect(x, y, w, h); }
		}
	}

	/* extended functions */
	setLinePath(..._args: any[]) {
		const _len = _args.length;
		const len = _len - ((_len | 1) ? 1 : 2);
		const a = [];
		for (let i = 0; i < len; i += 2) { a[i >> 1] = [_args[i], _args[i + 1]]; }
		this.context.beginPath();
		this.setLinePath_com.call(this, a);
		if (_args[_len - 1]) { this.context.closePath(); }
	}
	setOffsetLinePath(..._args: any[]) {
		const _len = _args.length;
		const len = _len - ((_len | 1) ? 1 : 2) - 2;
		const a = [];
		for (let i = 0; i < len; i += 2) { a[i >> 1] = [_args[i + 2] + _args[0], _args[i + 3] + _args[1]]; }
		this.context.beginPath();
		this.setLinePath_com.call(this, a);
		if (_args[_len - 1]) { this.context.closePath(); }
	}
	setLinePath_com(array: number[][]) {
		for (let i = 0, len = array.length; i < len; i++) {
			const ar = array[i];
			if (i === 0) { this.context.moveTo(ar[0], ar[1]); }
			else { this.context.lineTo(ar[0], ar[1]); }
		}
	}

	strokeLine(x1: number, y1: number, x2: number, y2: number) {
		if (this.setProperties(false, true)) {
			const c = this.context;
			c.beginPath();
			c.moveTo(x1, y1);
			c.lineTo(x2, y2);
			c.stroke();
		}
	}
	strokeDashedLine(x1: number, y1: number, x2: number, y2: number, sizes: any[]) {
		const c = this.context;
		if (this.setProperties(false, true)) {
			c.beginPath();
			c.moveTo(x1, y1);
			c.lineTo(x2, y2);
			c.setLineDash(sizes);
			c.stroke();
			c.setLineDash([]);
		}
	}
	strokeCross(cx: number, cy: number, l: number) {
		if (this.setProperties(false, true)) {
			const c = this.context;
			c.beginPath();
			c.moveTo(cx - l, cy - l);
			c.lineTo(cx + l, cy + l);
			c.moveTo(cx - l, cy + l);
			c.lineTo(cx + l, cy - l);
			c.stroke();
		}
	}

	/* extended functions (circle) */
	fillCircle(cx: number, cy: number, r: number) {
		if (this.setProperties(true, false)) {
			const c = this.context;
			c.beginPath();
			c.arc(cx, cy, r, 0, _2PI, false);
			c.fill();
		}
	}
	strokeCircle(cx: number, cy: number, r: number) {
		if (this.setProperties(false, true)) {
			const c = this.context;
			c.beginPath();
			c.arc(cx, cy, r, 0, _2PI, false);
			c.stroke();
		}
	}
	shapeCircle(cx: number, cy: number, r: number) {
		if (this.setProperties(true, true)) {
			const c = this.context;
			c.beginPath();
			c.arc(cx, cy, r, 0, _2PI, false);
			if (!!this.fillStyle && this.fillStyle !== "none") { c.fill(); }
			if (!!this.strokeStyle && this.strokeStyle !== "none") { c.stroke(); }
		}
	}

	/* Canvas API functions (for text) */
	fillText(text: string, x: number, y: number, maxLength: number) {
		if (!!text && this.setProperties(true, false)) {
			if (this.textBaseline === "candle-top") {
				y -= metrics.getoffsetHeight(text, this.font) * CTOP_OFFSET;
				this.context.textBaseline = "alphabetic";
			}
			if (!!maxLength) {
				this.context.fillText(text, x, y, maxLength);
			}
			else {
				this.context.fillText(text, x, y);
			}
		}
	}

	/* Canvas API functions (for image) */
	drawImage(image: CanvasImageSource, dx: number, dy: number) {
		if (!image) { return; }
		this.context.drawImage(image, dx, dy);
	}

}

export default { WrapperClass: CanvasWrapper, wrapperType, isWrapperEnable };
