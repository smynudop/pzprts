// metadata.js v3.5.2

//---------------------------------------------------------------------------
//  MetaData構造体  作者やコメントなどの情報を保持する
//---------------------------------------------------------------------------

export class MetaData {
	author = ''
	source = ''
	hard = ''
	comment = ''
	items = ["author", "source", "hard", "comment"] as const

	update(metadata: MetaData) {
		if (!metadata) { return; }
		for (var i of this.items) { if (typeof metadata[i] === 'string') { this[i] = metadata[i]; } }
	}
	getvaliddata() {
		var obj = {} as { [Key in typeof this.items[number]]: string };
		for (var i of this.items) { if (!!this[i]) { obj[i] = this[i]; } }
		return obj;
	}
	reset() {
		for (var i of this.items) { this[i] = ''; }
	}
	empty() {
		for (var i of this.items) { if (!!this[i]) { return false; } }
		return true;
	}
};
