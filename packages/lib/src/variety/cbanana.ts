
import { createVariety } from "./createVariety";


export const Cbanana = createVariety({
	pid: "cbanana",
	MouseEvent: {
		use: true,
		inputModes: {
			edit: ["number", "clear"],
			play: ["shade", "unshade"]
		},
		mouseinput_auto: function () {
			if (this.puzzle.editmode) {
				if (this.mousestart) this.inputqnum()
			} else {
				this.inputcell()
			}
		},
		autoedit_func: "qnum",
		autoplay_func: "cell"
	},

	KeyEvent: {
		enablemake: true
	},

	Cell: {
		ublk: null! as any,
		maxnum: function (): number {
			return this.board.cols * this.board.rows;
		}
	},

	AreaShadeGraph: {
		enabled: true
	},
	AreaUnshadeGraph: {
		enabled: true
	},

	Graphic: {
		gridcolor_type: "DARK",

		enablebcolor: true,
		bgcellcolor_func: "qsub1",

		paint: function () {
			this.drawBGCells();
			this.drawShadedCells();
			this.drawGrid();

			this.drawQuesNumbers();

			this.drawChassis();

			this.drawTarget();
		}
	},

	Encode: {
		decodePzpr: function (type) {
			this.decodeNumber16();
		},
		encodePzpr: function (type) {
			this.encodeNumber16();
		}
	},
	FileIO: {
		decodeData: function () {
			this.decodeCellQnum();
			this.decodeCellAns();
		},
		encodeData: function () {
			this.encodeCellQnum();
			this.encodeCellAns();
		}
	},

	AnsCheck: {
		checklist: [
			"checkShadeRect",
			"checkUnshadeNotRect",
			"checkNumberSize",
			//"doneShadingDecided"
		],

		checkNumberSize: function () {
			for (let i = 0; i < this.board.cell.length; i++) {
				const cell = this.board.cell[i];
				const qnum = cell.qnum;
				if (qnum <= 0) {
					continue;
				}

				const block = cell.isShade() ? cell.sblk : cell.ublk;
				const d = block.clist.length;

				if (d !== qnum) {
					this.failcode.add("bkSizeNe");
					if (this.checkOnly) {
						return;
					}
					block.clist.seterr(1);
				}
			}
		},

		checkShadeRect: function () {
			this.checkAllArea(
				this.board.sblkmgr,
				function (w, h, a, n) {
					return w * h === a;
				},
				"csNotRect"
			);
		},

		checkUnshadeNotRect: function () {
			this.checkAllArea(
				this.board.ublkmgr,
				function (w, h, a, n) {
					return w * h !== a;
				},
				"cuRect"
			);
		}
	}
});
