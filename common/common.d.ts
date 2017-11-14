declare var Util: {
	LoadScript: (src: string, callBack: () => void) => void,
	URLtoObject: () => any,
	Polyfill: () => void,
	DateFormat: (date: Date) => string,
	Download: (fileName: string, text: string) => void,
	LoadFile: (callBack: (text: string, file: File) => void) => void
}