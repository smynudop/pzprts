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
	canvas: HTMLCanvasElement = null;
	canvasid = '';
	child: ChildElement = null;
	enableTextLengthWA = false;
	use: any
	constructor(parent: HTMLCanvasElement) {
		// canvasに存在するプロパティ＆デフォルト値

		this.canvas = parent;	// 親エレメントとなるdivエレメント

		// variables for internal
		this.canvasid = "_candle_" + (++_counter);
		this.child = null;	// 親エレメントの直下にあるエレメント

		this.enableTextLengthWA = false;

		//@ts-ignore
		this.canvas.getContext = (type) => this;

		this.use = {};
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
	vhide(vids: any) { }
}
