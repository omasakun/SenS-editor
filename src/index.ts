/// <reference path="../common/common.d.ts" />
const KeyboardInput_Keymap = [83, 68, 70, 32, 74, 75, 76];
class KeyboardInput {
	queue: { key: number, isDown: boolean; timeMS: number }[];
	pressed: Set<number>;
	constructor() {
		this.queue = [];
		this.pressed = new Set();
		document.body.addEventListener("keydown", (e) => {
			if (this.pressed.has(e.keyCode)) return;
			this.pressed.add(e.keyCode);
			for (let i = 0; i < KeyboardInput_Keymap.length; i++) {
				if (KeyboardInput_Keymap[i] == e.keyCode) {
					this.queue.push({
						key: i,
						isDown: true,
						timeMS: performance.now()
					});
					return;
				}
			}
		});
		document.body.addEventListener("keyup", (e) => {
			this.pressed.delete(e.keyCode);
			for (let i = 0; i < KeyboardInput_Keymap.length; i++) {
				if (KeyboardInput_Keymap[i] == e.keyCode) {
					this.queue.push({
						key: i,
						isDown: false,
						timeMS: performance.now()
					});
					return;
				}
			}
		});
	}
	getNowMS() {
		return performance.now();
	}
}
class AudioFromFile {
	private audio: HTMLAudioElement
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
	setMS(time: number) { this.audio.currentTime = time * 1000; };
	isFinished() { return this.finFlag; }
}
/*
window.addEventListener("load", () => {
	input = new KeyboardInput();
	_.initMusicGame(_.makeMusicGame("./scores/demo.js", "file:./musics/Smoke.mp3"), audioList, gameAPI, noteList, view, (game) => {
		game.audio!.play();
		(function loop() {
			_.tickMusicGame(gameAPI, game, view!, input!);
			FPS.Tick();
			requestAnimationFrame(loop);
		})();
	});
});*/