/// <reference path="../common/common.d.ts" />
class KeyboardInput {
	queue: { key: KeyboardEvent, isDown: boolean; timeMS: number }[];
	pressed: Set<number>;
	constructor() {
		this.queue = [];
		this.pressed = new Set();
		document.body.addEventListener("keydown", (e) => {
			if (this.pressed.has(e.keyCode)) return;
			this.pressed.add(e.keyCode);
			this.queue.push({
				key: e,
				isDown: true,
				timeMS: performance.now()
			});
		});
		document.body.addEventListener("keyup", (e) => {
			this.pressed.delete(e.keyCode);
			this.queue.push({
				key: e,
				isDown: true,
				timeMS: performance.now()
			});
		});
	}
	getNowMS() {
		return performance.now();
	}
}
class AudioFromFile {
	audio: HTMLAudioElement
	private finFlag: boolean
	constructor(path: string) {
		this.audio = new Audio(path);
		var self = this;
		this.audio.onended = () => { self.finFlag = true; };
		this.finFlag = false;
		return this;
	};
	play() { this.audio.play(); };
	pause() { this.audio.pause(); };
	dispose() { this.audio.onended = () => 0; };
	getMS() { return this.audio.currentTime * 1000; };
	setMS(time: number) { this.audio.currentTime = time / 1000; };
	isFinished() { return this.finFlag; }
}
// Modified: Fill,Stroke が、Styleを取れるようになった。
class MyCanvas {
	ctx: CanvasRenderingContext2D
	parent: HTMLElement
	scaleX: number
	scaleY: number
	constructor(parent: HTMLElement, canvas: HTMLCanvasElement) {
		this.parent = parent;
		if (canvas.getContext) this.ctx = canvas.getContext('2d')!;
		else throw ("Canvasが対応していないようです");
		this.scaleX = 1;
		this.scaleY = 1;
		var This = this;
		((Fn) => {
			var i: number | undefined = undefined;
			window.addEventListener('resize', () => {
				if (i !== undefined) {
					clearTimeout(i);
				}
				i = setTimeout(Fn, 100);
			});
		})(() => this.onResize.call(This));
		this.onResize();
		return this;
	}
	onResize() {
		let Canvas = this.ctx.canvas;
		this.scaleX = (window.devicePixelRatio || 1) * this.parent.clientWidth;
		this.scaleY = (window.devicePixelRatio || 1) * this.parent.clientHeight;
		Canvas.width = this.scaleX;
		Canvas.height = this.scaleY;
		Canvas.style.width = this.parent.clientWidth + "px";
		Canvas.style.height = this.parent.clientHeight + "px";
		this.ctx.lineWidth = window.devicePixelRatio || 1;
	}
	line(x1, y1, x2, y2) {
		this.ctx.moveTo((x1 * this.scaleX), (y1 * this.scaleY));
		this.ctx.lineTo((x2 * this.scaleX), (y2 * this.scaleY));
	}
	rect(x, y, w, h) {
		this.ctx.rect(
			(x * this.scaleX), (y * this.scaleY),
			(w * this.scaleX), (h * this.scaleY)
		);
	}
	round(x, y, r) {
		this.ctx.arc((x * this.scaleX), (y * this.scaleY), (r * Math.min(this.scaleX, this.scaleY)), -0.5 * Math.PI, 2 * Math.PI);
	}
	longRound(x, y, h, r) {
		this.ctx.arc((x * this.scaleX), (y * this.scaleY), (r * Math.min(this.scaleX, this.scaleY)), -Math.PI, 0);
		this.ctx.arc((x * this.scaleX), ((y + h) * this.scaleY), (r * Math.min(this.scaleX, this.scaleY)), 0, -Math.PI);
		this.ctx.lineTo((x * this.scaleX - r * Math.min(this.scaleX, this.scaleY)), (y * this.scaleY));
	}
	beginPath() { this.ctx.beginPath() }
	fillAll(style: undefined | string = undefined) {
		if (style !== undefined) this.ctx.fillStyle = style;
		this.ctx.fillRect(0, 0, this.scaleX, this.scaleY);
	}
	fill(style: undefined | string = undefined) {
		if (style !== undefined) this.ctx.fillStyle = style;
		this.ctx.fill();
	}
	stroke(style: undefined | string = undefined) {
		if (style !== undefined) this.ctx.strokeStyle = style;
		this.ctx.stroke();
	}
	clearAll() {
		canvas.ctx.clearRect(0, 0, canvas.scaleX, canvas.scaleY);
	}
}
enum NoteType {
	single, tap, hold
}
interface SimpleNote {
	type: NoteType.tap | NoteType.single,
	time: number
}
interface HoldNote {
	type: NoteType.hold,
	time: number
}
type Note = SimpleNote | HoldNote;
interface Grid {
	offset: number, bpm: number, span: number, enable: boolean
}
interface Score {
	score: Note[],
	bpms: Grid[],
	lanes: number
}
function _(id: string) {
	var tmp = document.getElementById(id);
	if (tmp != null) return tmp;
	throw "undefined node - " + id;
}
var score: Score = {
	bpms: [],
	lanes: 7,
	score: []
};
const _defaultGridBPM = 120;
const _defaultGridOffset = 0;
var audio: AudioFromFile | undefined;
var keys: KeyboardInput;
var windowSpan: number = 5000; // 上の白い部分の幅
var shouldSpan = true;
var canvas: MyCanvas;
const whiteArea = .7;
function map(value, min1, max1, min2, max2) {
	return (value - min1) / (max1 - min1) * (max2 - min2) + min2;
}
function setScore(text: string): void {

}
function getScore(): string {

}
/*
Button score-up score-down music-up grid-add ctrl-snap ctrl-play
Div    grids
Input  ctrl-sec ctrl-window ctrl-lanes
Canvas canvas
Span   score-name music-name
*/
window.addEventListener("load", () => {
	{
		_("score-up").addEventListener("click", () => {
			Util.LoadFileAsText((text, file) => {
				_("score-name").innerText = file.name;
				setScore(text);
			});
		});
		_("score-down").addEventListener("click", () => {
			var defaultName = _("score-name").innerText;
			if (defaultName == "") defaultName = "score.js";
			Util.Download(prompt("File name: ", defaultName) || defaultName, getScore());
		});
		_("music-up").addEventListener("click", () => {
			Util.LoadFileAsDataURL((url, file) => {
				_("music-name").innerText = file.name;
				audio = new AudioFromFile(url);
				audio.pause();
			});
		});
		_("grid-add").addEventListener("click", () => {
			var container = document.createElement("div");
			var item: Grid = {
				span: 60000 / _defaultGridBPM,
				bpm: _defaultGridBPM,
				offset: _defaultGridOffset,
				enable: true
			}
			var itemIndex = score.bpms.length;
			score.bpms.push(item);
			container.setAttribute("class", "margin-grid framed");
			{
				var removeButton = document.createElement("button");
				removeButton.setAttribute("class", "fa fa-times-circle noPadding hover");
				removeButton.addEventListener("click", () => {
					score.bpms.splice(score.bpms.findIndex(i => i === item), 1);
					_("grid").removeChild(container)
				});
				container.appendChild(removeButton);
			}
			{
				var selectButton = document.createElement("button");
				selectButton.setAttribute("class", "fa fa-check-square hover");
				container.appendChild(selectButton);
				selectButton.addEventListener("click", () => {
					item.enable = !item.enable;
					if (item.enable) {
						selectButton.classList.remove("fa-square");
						selectButton.classList.add("fa-check-square");
					} else {
						selectButton.classList.add("fa-square");
						selectButton.classList.remove("fa-check-square");
					}
				});
			}
			{
				var span2 = document.createElement("span");
				span2.innerText = "BPM";
				{
					var input1 = document.createElement("input");
					input1.type = "text";
					input1.value = item.bpm.toString();
					input1.setAttribute("class", "max3");
					span2.appendChild(input1);
					input1.addEventListener("keyup", (e) => {
						if (e.keyCode == 13) {
							if (!isNaN(parseInt(input1.value))) {
								item.bpm = parseInt(input1.value);
								item.span = 60000 / item.bpm;
							}
							input1.value = item.bpm.toString();
						}
					});
				}
				container.appendChild(span2);
			}
			{
				var span3 = document.createElement("span");
				span3.innerText = "/Offset";
				{
					var input2 = document.createElement("input");
					input2.type = "text";
					input2.value = item.offset.toString();
					input2.setAttribute("class", "max3");
					span3.appendChild(input2);
					input2.addEventListener("keyup", (e) => {
						if (e.keyCode == 13) {
							if (!isNaN(parseInt(input2.value))) {
								item.offset = parseInt(input2.value);
							}
							input2.value = item.offset.toString();
						}
					});
				}
				container.appendChild(span3);
			}
			_("grid").appendChild(container);
		});
		if (shouldSpan) _("ctrl-snap").innerText = "YES";
		else _("ctrl-snap").innerText = "NO";
		_("ctrl-snap").addEventListener("click", () => {
			shouldSpan = !shouldSpan;
			if (shouldSpan) _("ctrl-snap").innerText = "YES";
			else _("ctrl-snap").innerText = "NO";
		});
		_("ctrl-play").addEventListener("click", () => {
			var text = _("ctrl-play").innerText;
			if (audio) {
				if (text == "PLAY") {
					audio.play();
					_("ctrl-play").innerText = "PAUSE";
				} else {
					audio.pause();
					_("ctrl-play").innerText = "PLAY";
				}
			}
		});
		_("ctrl-sec").addEventListener("keyup", (e) => {
			if (e.keyCode == 13) {
				if (audio) {
					if (!isNaN(parseFloat((<HTMLInputElement>_("ctrl-sec")).value))) {
						var a = audio.audio.paused;
						audio.setMS(parseFloat((<HTMLInputElement>_("ctrl-sec")).value));
						if (a) audio.pause();
						else audio.play();
					}
					(<HTMLInputElement>_("ctrl-sec")).value = audio.getMS().toFixed(0);
				} else (<HTMLInputElement>_("ctrl-sec")).value = "";
			}
		});
		(<HTMLInputElement>_("ctrl-window")).value = windowSpan.toString();
		_("ctrl-window").addEventListener("keyup", (e) => {
			if (e.keyCode == 13) {
				if (!isNaN(parseFloat((<HTMLInputElement>_("ctrl-window")).value))) {
					windowSpan = parseFloat((<HTMLInputElement>_("ctrl-window")).value);
				}
				(<HTMLInputElement>_("ctrl-window")).value = windowSpan.toString();
			}
		});
		(<HTMLInputElement>_("ctrl-lanes")).value = score.lanes.toString();
		_("ctrl-lanes").addEventListener("keyup", (e) => {
			if (e.keyCode == 13) {
				if (score) {
					if (!isNaN(parseInt((<HTMLInputElement>_("ctrl-lanes")).value))) {
						score.lanes = parseInt((<HTMLInputElement>_("ctrl-lanes")).value);
					}
					(<HTMLInputElement>_("ctrl-lanes")).value = score.lanes.toString();
				} else (<HTMLInputElement>_("ctrl-lanes")).value = "";
			}
		});
	}
	keys = new KeyboardInput();
	canvas = new MyCanvas(<any>_("canvas-parent"), <any>_("canvas"));
	(function Loop() {
		{
			canvas.beginPath();
			canvas.fillAll("#EEE");
			canvas.rect(0, whiteArea, 1, 1 - whiteArea);
			canvas.fill("#AAA");
			canvas.beginPath();
			for (var lane = 0; lane < score.lanes; lane++) {
				canvas.line(1 / score.lanes / 2 * (lane * 2 + 1), 0, 1 / score.lanes / 2 * (lane * 2 + 1), 1);
			}
			canvas.stroke("#222");
		}// 背景とレーン線
		if (audio !== undefined) {
			var now = audio.getMS();
			{
				for (var bpmID = 0; bpmID < score.bpms.length; bpmID++) {
					var bpm = score.bpms[bpmID], tmp = (((now - bpm.offset) / bpm.span)) * bpm.span + bpm.offset;
					if (!bpm.enable) continue;
					while (tmp <= now + windowSpan / whiteArea) {
						canvas.line(0, map(tmp, now, now + windowSpan / whiteArea, 1, 0), 1, map(tmp, now, now + windowSpan / whiteArea, 1, 0));
						tmp += bpm.span;
					}
				}
				canvas.stroke("#CCC");
			}// BPM線
			{

			}// Add Note
			if (_("ctrl-sec") !== document.activeElement)
				(<HTMLInputElement>_("ctrl-sec")).value = audio.getMS().toFixed(0);
		}
		requestAnimationFrame(Loop);
	})();
});