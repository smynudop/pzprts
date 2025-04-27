// candle.base.js

let _counter = -1;

/* ------------------- */
/*  WrapperBaseクラス  */
/* ------------------- */
export default abstract class WrapperBase<ChildElement> {
	fillStyle = 'black';
	strokeStyle = 'black';
	lineWidth = 1;
	font = '14px system';
	textAlign: CanvasTextAlign = 'center';
	textBaseline: CanvasTextBaseline | "candle-top" = 'middle';
	canvas: HTMLElement;
	canvasid = '';
	child: ChildElement;
	enableTextLengthWA = false;
	use: any
	constructor(parent: HTMLElement) {
		// canvasに存在するプロパティ＆デフォルト値

		this.canvas = parent;	// 親エレメントとなるdivエレメント

		// variables for internal
		this.canvasid = `_candle_${++_counter}`;
		this.child = null!;	// 親エレメントの直下にあるエレメント

		this.enableTextLengthWA = false;


		this.canvas.getContext = (type) => this;

		this.use = {};
		this.vid = ""
	}
	init() {
		this.initElement();
		this.initFunction();
		this.initLayer();
	}

	abstract initElement(): void
	abstract initFunction(): void
	abstract initLayer(): void



	/* Initialize functions */
	/* initElement : function(){}, (virtual) */
	/* initFunction : function(){}, (virtual) */
	/* initLayer : function(){}, (virtual) */

	/* layer functions */
	/* setLayer : function(){}, (virtual) */

	/* property functions */
	/* setRendering : function(){}, (virtual) */

	/* Canvas API functions (rect) */
	rectcenter(cx: number, cy: number, bw: number, bh: number) { this.rect(cx - bw, cy - bh, 2 * bw, 2 * bh); }
	fillRectCenter(cx: number, cy: number, bw: number, bh: number) { this.fillRect(cx - bw, cy - bh, 2 * bw, 2 * bh); }
	strokeRectCenter(cx: number, cy: number, bw: number, bh: number) { this.strokeRect(cx - bw, cy - bh, 2 * bw, 2 * bh); }
	shapeRectCenter(cx: number, cy: number, bw: number, bh: number) { this.shapeRect(cx - bw, cy - bh, 2 * bw, 2 * bh); }

	abstract rect(x: number, y: number, w: number, h: number): void
	abstract fillRect(x: number, y: number, w: number, h: number): void
	abstract strokeRect(x: number, y: number, w: number, h: number): void
	abstract shapeRect(x: number, y: number, w: number, h: number): void
	/* VectorID Functions */
	vhide(vids?: any) { }
	vid: string

	abstract changeSize(width: number, height: number): void
	abstract translate(left: number, top: number): void

	abstract fill(): void
	abstract moveTo(x: number, y: number): void
	abstract setOffsetLinePath(...args: any[]): void
	abstract beginPath(): void
	abstract lineTo(x: number, y: number): void
	abstract strokeCircle(cx: number, cy: number, r: number): void
	abstract strokeLine(x1: number, y1: number, x2: number, y2: number): void
	abstract strokeDashedLine(x1: number, y1: number, x2: number, y2: number, sizes: (string | number)[]): void
	abstract stroke(): void
	abstract strokeCross(cx: number, cy: number, l: number): void
	abstract fillCircle(cx: number, cy: number, r: number): void
	abstract shapeCircle(cx: number, cy: number, r: number): void
	abstract drawImage(image: HTMLImageElement, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void
	abstract setLayer(layerid?: string, option?: any): void
	abstract clear(): void
	abstract fillText(text: string, x: number, y: number, maxLength: number | null): void

	abstract closePath(): void
}

