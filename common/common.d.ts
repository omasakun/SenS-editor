declare var Util: {
	LoadScript: (src: string, callBack: () => void) => void,
	URLtoObject: () => any,
	Polyfill: () => void,
	DateFormat: (date: Date) => string,
	DownloadText: (fileName: string, text: string) => void,
	LoadFileAsText: (callBack: (text: string, file: File) => void) => void,
	LoadFileAsDataURL: (callBack: (url: string, file: File) => void) => void
}