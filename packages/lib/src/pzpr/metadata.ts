// metadata.js v3.5.2

//---------------------------------------------------------------------------
//  MetaData構造体  作者やコメントなどの情報を保持する
//---------------------------------------------------------------------------

export type IMetaData = {
	author: string
	source: string
	hard: string
	comment: string
}

export const update = (oldData: IMetaData, newData: IMetaData): IMetaData => {
	if (!newData) return oldData;
	return {
		...oldData,
		...newData
	}
}

export const getvaliddata = (data: IMetaData) => {
	return data;
}

export const createEmtpyMetaData = (): IMetaData => {
	return {
		author: "",
		source: "",
		hard: "",
		comment: "",
	}
}
export const isEmpty = (data: IMetaData) => {
	return !!data.author || !!data.comment || !!data.hard || !!data.source;
}
