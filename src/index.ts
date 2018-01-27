/// <reference path="../common/common.d.ts" />
// Up: Window++
// Down: Window--
// Left: time--
// Right: time++
// [ : Speed++
// ] : Speed--
// Enter: Snap
// Space: Start/Pause
// Esc: End-Note
// QWER: NoteType
const LaneKeyCodes = "DFJKL".split("").map(v => v.charCodeAt(0)); // TODO: レーン数に依存している
const LaneCount = 5;
function showError(message: string): never {
	console.error(message);
	alert(message);
	throw message;
}
interface KeyEvent {
	key: KeyboardEvent
	isDown: boolean
	isFirst: boolean
	timeMS: number
}
class KeyboardInput {
	queue: KeyEvent[];
	private pressed: Set<number>;
	constructor() {
		this.queue = [];
		this.pressed = new Set();
		document.body.addEventListener("keydown", (e) => {
			if (this.pressed.has(e.keyCode)) {
				this.queue.push({
					key: e,
					isDown: true,
					isFirst: false,
					timeMS: performance.now()
				});
				return;
			}
			this.pressed.add(e.keyCode);
			this.queue.push({
				key: e,
				isDown: true,
				isFirst: true,
				timeMS: performance.now()
			});
		});
		document.body.addEventListener("keyup", (e) => {
			this.pressed.delete(e.keyCode);
			this.queue.push({
				key: e,
				isDown: false,
				isFirst: true,
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
		this.ctx.moveTo((x1 * this.scaleX) << 0, (y1 * this.scaleY) << 0);
		this.ctx.lineTo((x2 * this.scaleX) << 0, (y2 * this.scaleY) << 0);
	}
	rect(x, y, w, h) {
		this.ctx.rect(
			(x * this.scaleX) << 0, (y * this.scaleY) << 0,
			(w * this.scaleX) << 0, (h * this.scaleY) << 0
		);
	}
	round(x, y, r) {
		this.ctx.arc((x * this.scaleX) << 0, (y * this.scaleY) << 0, (r * Math.min(this.scaleX, this.scaleY)) << 0, -0.5 * Math.PI, 2 * Math.PI);
	}
	longRound(x, y, h, r) {
		this.ctx.arc((x * this.scaleX) << 0, (y * this.scaleY) << 0, (r * Math.min(this.scaleX, this.scaleY)) << 0, -Math.PI, 0);
		this.ctx.arc((x * this.scaleX) << 0, ((y + h) * this.scaleY) << 0, (r * Math.min(this.scaleX, this.scaleY)) << 0, 0, -Math.PI);
		this.ctx.lineTo((x * this.scaleX - r * Math.min(this.scaleX, this.scaleY)) << 0, (y * this.scaleY) << 0);
	}
	beginPath() { this.ctx.beginPath() }
	fillAll(style: undefined | string = undefined) {
		if (style !== undefined) this.ctx.fillStyle = style;
		this.ctx.fillRect(0, 0, this.scaleX, this.scaleY);
	}
	fill(style: undefined | string = undefined) {
		if (style !== undefined && this.ctx.fillStyle !== style) this.ctx.fillStyle = style;
		this.ctx.fill();
	}
	stroke(style: undefined | string = undefined) {
		if (style !== undefined && this.ctx.strokeStyle !== style) this.ctx.strokeStyle = style;
		this.ctx.stroke();
	}
	clearAll() {
		canvas.ctx.clearRect(0, 0, canvas.scaleX, canvas.scaleY);
	}
}
interface Grid {
	offset: number, bpm: number, span: number, enable: boolean
}
enum NoteType { remove = 0 /*For Edit*/, simple = 1, slide = 2, hold = 3, end = 4 }
interface Note {
	type: NoteType,
	lane?: number,
	time: [number, number],
	_: number[]
} // {type:NoteType.simple,lane:2,time:[-Infinity,Infinity],_:[1000]}
const ETS = 1000; // ノーツの当り判定の時間。 Editing 判定 Time Span
var Note2String = (note: Note): string => {
	if (note.type == NoteType.simple) return "*:" + note.lane + note._.slice(0, 1).map(v => v << 0).join("|");
	if (note.type == NoteType.slide) return "+:" + note.lane + note._.slice(0, 1).map(v => v << 0).join("|");
	if (note.type == NoteType.hold) return "~:" + note.lane + note._.slice(0, 2).map(v => v << 0).join("|");
	if (note.type == NoteType.end) return "FIN:" + note._.slice(0, 1).map(v => v << 0).join("|");
	showError("未定義ノーツ");
	throw "";
}
var String2Note = (text: string): Note => {
	if (text.startsWith("FIN:")) {
		let time = parseFloat(text.substr(4));
		return { type: NoteType.end, time: [time - ETS, time + ETS], _: [time] };
	}
	var times = text.substr(3).split("|").map(v => parseFloat(v));
	if (text.startsWith("*:")) {
		return { type: NoteType.simple, lane: parseInt(text.substr(2, 1)), time: [times[0] - ETS, times[0] + ETS], _: times.slice(0, 1) }
	} if (text.startsWith("+:")) {
		return { type: NoteType.slide, lane: parseInt(text.substr(2, 1)), time: [times[0] - ETS, times[0] + ETS], _: times.slice(0, 1) }
	} if (text.startsWith("~:")) {
		return { type: NoteType.hold, lane: parseInt(text.substr(2, 1)), time: [times[0] - ETS, times[1] + ETS], _: times.slice(0, 2) }
	} showError("未定義ノーツ");
	throw "";
}
var Note2Draw = (note: Note, T2Y: (time: number) => number) => {
	var lineWidth = 0.8 / LaneCount; // CONST
	var lineHeight = 10/*px*/ / canvas.scaleY; // CONST
	var holdNoteLineWidth = 10/*px*/ / canvas.scaleX; // CONST
	var xMin = ((note.lane || 0) + 0.5) / LaneCount - lineWidth / 2;
	var Ys = note._.map(v => T2Y(v));
	canvas.beginPath();
	if (note.type == NoteType.simple) {
		canvas.rect(xMin, Ys[0] - lineHeight / 2, lineWidth, lineHeight);
		canvas.fill("#000");
		return;
	} if (note.type == NoteType.slide) {
		canvas.rect(xMin, Ys[0] - lineHeight / 2, lineWidth, lineHeight);
		canvas.fill("#080");
		return;
	} if (note.type == NoteType.hold) {
		canvas.rect(xMin, Ys[0] - lineHeight / 2, lineWidth, lineHeight);
		if (note._[1] == Infinity) {
			canvas.rect(xMin + lineWidth / 2, 0, holdNoteLineWidth, Ys[0]);
		} else {
			canvas.rect(xMin + lineWidth / 2, Ys[1], holdNoteLineWidth, Ys[0] - Ys[1]);
			canvas.rect(xMin, Ys[1] - lineHeight / 2, lineWidth, lineHeight);
		}
		canvas.fill("#000");
		return;
	} if (note.type == NoteType.end) {
		canvas.rect(0, Ys[0] - lineHeight / 2, 1, lineHeight);
		canvas.fill("#800");
		return;
	} showError("未定義ノーツ"); throw "";
};
interface Score {
	score: Note[],
	bpms: Grid[]
}
function _(id: string) {
	var tmp = document.getElementById(id);
	if (tmp != null) return tmp;
	throw "undefined node - " + id;
}
var score: Score = {
	bpms: [],
	score: []
};
const _defaultGridBPM = 120;
const _defaultGridOffset = 0;
const minNoteSpan = 50; // ms
const maxDeleteTimeSpan = 1000; // ms
var audio: AudioFromFile | undefined;
var keys: KeyboardInput;
var windowSpan: number = 5000; // 上の白い部分の幅
var shouldSnap = true;
var noteType: NoteType = NoteType.simple;
var canvas: MyCanvas;
const whiteArea = .7;
function map(value, min1, max1, min2, max2) {
	return (value - min1) / (max1 - min1) * (max2 - min2) + min2;
}
function setScore(text: string): void {
	score.score = text.split(" ").map(v => String2Note(v)).sort((a, b) => a.time[0] - b.time[0]);
}
function getScore(): string {
	return score.score.map(v => Note2String(v)).join(" ");
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
		_("help").addEventListener("click", () => _("help-doc").classList.toggle("hide"));
		_("score-up").addEventListener("click", () => {
			Util.LoadFileAsText((text, file) => {
				_("score-name").innerText = file.name;
				if (!text.startsWith('_noteString = "')) {
					showError("譜面、読めない");
					return;
				}
				setScore(text.split("\n")[0].trim().substr('_noteString = "'.length).replace('"', ""));
			});
		});
		_("score-down").addEventListener("click", () => {
			var defaultName = _("score-name").innerText;
			if (defaultName == "" || defaultName == "unselected") defaultName = "score.js";
			Util.DownloadText(prompt("File name: ", defaultName) || defaultName, '_noteString = "' + getScore() + '"\n' + new Date().toString());
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
		if (shouldSnap) _("ctrl-snap").innerText = "YES";
		else _("ctrl-snap").innerText = "NO";
		_("ctrl-snap").addEventListener("click", () => {
			shouldSnap = !shouldSnap;
			if (shouldSnap) _("ctrl-snap").innerText = "YES";
			else _("ctrl-snap").innerText = "NO";
		});
		_("ctrl-note-type").innerText = ["REMOVE", "Normal", "Chain", "Hold", "End"][noteType];
		_("ctrl-note-type").addEventListener("click", () => {
			noteType = (noteType + 1) % 4;
			_("ctrl-note-type").innerText = ["REMOVE", "Normal", "Chain", "Hold", "End"][noteType];
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
		_("ctrl-speed").addEventListener("keyup", (e) => {
			if (e.keyCode == 13) {
				if (audio) {
					if (!isNaN(parseFloat((<HTMLInputElement>_("ctrl-speed")).value))) {
						var a = audio.audio.paused;
						audio.audio.playbackRate = parseFloat((<HTMLInputElement>_("ctrl-speed")).value);
						if (a) audio.pause();
						else audio.play();
					}
					(<HTMLInputElement>_("ctrl-speed")).value = audio.audio.playbackRate.toFixed(2);
				} else (<HTMLInputElement>_("ctrl-speed")).value = "";
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
		});/*
		(<HTMLInputElement>_("ctrl-lanes")).value = LaneCount.toString();
		_("ctrl-lanes").addEventListener("keyup", (e) => {
			if (e.keyCode == 13) {
				if (score) {
					if (!isNaN(parseInt((<HTMLInputElement>_("ctrl-lanes")).value))) {
						LaneCount = parseInt((<HTMLInputElement>_("ctrl-lanes")).value);
					}
					(<HTMLInputElement>_("ctrl-lanes")).value = LaneCount.toString();
				} else (<HTMLInputElement>_("ctrl-lanes")).value = "";
			}
		});*/
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
			for (var lane = 0; lane < LaneCount; lane++) {
				canvas.line(1 / LaneCount / 2 * (lane * 2 + 1), 0, 1 / LaneCount / 2 * (lane * 2 + 1), 1);
			}
			canvas.stroke("#222");
		}// 背景とレーン線
		if (audio !== undefined) {
			var now = audio.getMS();
			var showingSpace = [now + windowSpan, now - windowSpan * (1 - whiteArea) / whiteArea];
			//console.log(showingSpace);
			var T2Y = (time: number) => map(time, showingSpace[0], showingSpace[1], 0, 1);
			{
				for (var bpmID = 0; bpmID < score.bpms.length; bpmID++) {
					var bpm = score.bpms[bpmID], tmp = (((showingSpace[1] - bpm.offset) / bpm.span) << 0) * bpm.span + bpm.offset;
					if (!bpm.enable) continue;
					while (true) {
						var y = T2Y(tmp);
						if (y < 0) break;
						canvas.line(0, y, 1, y);
						tmp += bpm.span;
					}
				}
				canvas.stroke("#CCC");
			}// BPM線
			{
				keys.queue.forEach(v => {
					let snappedTime = now;
					if (shouldSnap && score.bpms.length > 0)
						snappedTime = score.bpms.filter(v => v.enable).map(v => Math.round((snappedTime - v.offset) / v.span) * v.span + v.offset).sort((a, b) => Math.abs(a) - Math.abs(b))[0];
					var lane = LaneKeyCodes.findIndex(vv => vv == v.key.keyCode);
					if (lane < 0) { // keys for controls
						if (!v.isDown) return;
						if (v.key.keyCode == 38) { // Up: Window++
							windowSpan += 100;
							(<HTMLInputElement>_("ctrl-window")).value = windowSpan.toString();
						} else if (v.key.keyCode == 40) { // Down: Window--
							windowSpan -= 100;
							(<HTMLInputElement>_("ctrl-window")).value = windowSpan.toString();
						} else if (v.key.keyCode == 37) { // Left: time--
							audio!.audio.currentTime -= 0.2;
						} else if (v.key.keyCode == 39) { // Right: time++
							audio!.audio.currentTime += 0.2;
						} else if (v.key.keyCode == 221) { // [ : Speed++
							audio!.audio.playbackRate = Math.max(0, audio!.audio.playbackRate + 0.1);
						} else if (v.key.keyCode == 220) { // ] : Speed--
							audio!.audio.playbackRate = Math.max(0, audio!.audio.playbackRate - 0.1);
						}
						if (!v.isFirst) return;
						if (v.key.keyCode == 13) { // Enter: Snap
							shouldSnap = !shouldSnap;
							if (shouldSnap) _("ctrl-snap").innerText = "YES";
							else _("ctrl-snap").innerText = "NO";
						} else if (v.key.keyCode == 32) { // Space: Start/Pause
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
						} else if (v.key.keyCode == 27) { // Esc: End-Note
							if (score.score.findIndex(v => v.type == NoteType.end) >= 0) score.score.splice(score.score.findIndex(v => v.type == NoteType.end));
							score.score.push({ _: [snappedTime], time: [snappedTime, snappedTime], type: NoteType.end });
						} else if ([81, 87, 69, 82].findIndex(vv => vv == v.key.keyCode) >= 0) { // QWER: NoteMode
							noteType = [81, 87, 69, 82].findIndex(vv => vv == v.key.keyCode);
							_("ctrl-note-type").innerText = ["REMOVE", "Normal", "Chain", "Hold", "End"][noteType];
						}
						return;
					}
					if (!v.isFirst) return;
					{
						if (noteType != NoteType.hold && !v.isDown) return;
						if (noteType == NoteType.remove) {
							var tmp = score.score.map<[number, Note]>((v, i) => [i, v]).filter(v => v[1].lane == lane || v[1].type == NoteType.end).map(v => [v[0], (v[1]._.length == 2 && v[1]._[0] < now && now < v[1]._[1]) ? 0 : Math.min(...v[1]._.map(v => Math.abs(v - now)))]).sort((a, b) => a[1] - b[1]);
							if (tmp.length != 0 && tmp[0][1] < maxDeleteTimeSpan) score.score.splice(tmp[0][0], 1);
							return;
						}
						if (v.isDown)
							for (let i = 0; i < score.score.length; i++) {
								if (score.score[i].lane !== lane) continue;
								if (score.score[i]._.findIndex(v => Math.abs(v - snappedTime) < minNoteSpan) >= 0) return;
								if (score.score[i].time[1] > snappedTime + minNoteSpan) break;
							}// minNoteSpan で filter
						if (noteType == NoteType.hold)
							if (v.isDown)
								score.score.push({ lane: lane, time: [snappedTime, Infinity], type: noteType, _: [snappedTime, Infinity] });
							else {
								console.log("");
								if (score.score.findIndex((v, i) => {
									if (v.lane != lane || v.type != NoteType.hold || v._[1] != Infinity) return false;
									v.time[1] = v._[1] = snappedTime;
									if (Math.abs(v._[0] - snappedTime) < minNoteSpan || v._[0] > snappedTime) score.score.splice(i, 1);
									return true;
								}) < 0) 0; // ノーツの始まりが他のノーツと似たタイミングだったなどの理由で処理されなかった時に起きる。
							}
						else
							score.score.push({ lane: lane, time: [snappedTime, snappedTime], type: noteType, _: [snappedTime] });
						score.score = score.score.sort((a, b) => a.time[0] - b.time[0]);
					} // Add Note
				});
				keys.queue = [];
			}// Key Events
			{
				canvas.ctx.globalAlpha = 0.5;
				score.score.some((note, i) => note.time[0] > showingSpace[0] ? true : note.time[1] < showingSpace[1] ? false : (Note2Draw(note, T2Y), false));
				canvas.ctx.globalAlpha = 1;
			}// Show Note
			if (_("ctrl-sec") !== document.activeElement)
				(<HTMLInputElement>_("ctrl-sec")).value = audio.getMS().toFixed(0);
			if (_("ctrl-speed") !== document.activeElement)
				(<HTMLInputElement>_("ctrl-speed")).value = audio.audio.playbackRate.toFixed(2);
		}
		keys.queue = [];
		requestAnimationFrame(Loop);
	})();
});