const KeyboardInput_Keymap = [83, 68, 70, 32, 74, 75, 76];
class KeyboardInput {
    constructor() {
        this.queue = [];
        this.pressed = new Set();
        document.body.addEventListener("keydown", (e) => {
            if (this.pressed.has(e.keyCode))
                return;
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
    constructor(path) {
        this.audio = new Audio(path);
        var self = this;
        this.audio.onended = () => { self.finFlag = true; };
        this.finFlag = false;
        return this;
    }
    ;
    play() { this.audio.play(); }
    ;
    pause() { this.audio.pause(); }
    ;
    dispose() { this.audio.onended = () => 0; }
    ;
    getMS() { return this.audio.currentTime * 1000; }
    ;
    setMS(time) { this.audio.currentTime = time * 1000; }
    ;
    isFinished() { return this.finFlag; }
}
