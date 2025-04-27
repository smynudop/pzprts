// candle.env.js

export default {
	//@ts-ignore
	node: (typeof module === 'object' && typeof process === 'object'),
	browser: (typeof document === 'object' && typeof window === 'object' && typeof location === 'object')
};
