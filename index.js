window.addEventListener("load", () => Array.from(document.querySelectorAll("button")).forEach(_ => _.addEventListener("keydown", (e) => e.preventDefault())));
const LaneKeys = "dfjkl".split("");
const LaneCount = 5;
function showError(message) {
    console.error(message);
    alert(message);
    throw message;
}
class KeyboardOrTapOrClickInput {
    constructor() {
        this.queue = [];
        this.pressed = new Set();
        this.touches = new Map();
        this.mouseLane = -1;
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
    setTapHandler(canvas) {
        canvas.addEventListener("contextmenu", e => e.preventDefault());
        canvas.addEventListener("touchstart", e => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                var lane = ((e.changedTouches.item(i).clientX - canvas.parentElement.offsetLeft) / (canvas.clientWidth / LaneCount)) << 0;
                var id = e.changedTouches.item(i).identifier;
                if (this.touches.has(id))
                    continue;
                this.touches.set(id, lane);
                if (0 <= lane && lane < LaneCount)
                    this.queue.push({
                        isFirst: true,
                        isDown: true,
                        key: { key: LaneKeys[lane] },
                        timeMS: performance.now()
                    });
            }
        });
        canvas.addEventListener("touchmove", e => {
            e.preventDefault();
            var tmp = new Set();
            for (let i = 0; i < e.changedTouches.length; i++) {
                var lane = ((e.changedTouches.item(i).clientX - canvas.parentElement.offsetLeft) / (canvas.clientWidth / LaneCount)) << 0;
                var id = e.changedTouches.item(i).identifier;
                var oldLane = this.touches.get(id);
                if (oldLane == lane)
                    continue;
                if (oldLane != undefined)
                    if (0 <= oldLane && oldLane < LaneCount)
                        this.queue.push({
                            isFirst: true,
                            isDown: false,
                            key: { key: LaneKeys[oldLane] },
                            timeMS: performance.now()
                        });
                if (0 <= lane && lane < LaneCount)
                    this.queue.push({
                        isFirst: true,
                        isDown: true,
                        key: { key: LaneKeys[lane] },
                        timeMS: performance.now()
                    });
                this.touches.set(id, lane);
            }
        });
        canvas.addEventListener("touchend", e => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                var lane = ((e.changedTouches.item(i).clientX - canvas.parentElement.offsetLeft) / (canvas.clientWidth / LaneCount)) << 0;
                var id = e.changedTouches.item(i).identifier;
                if (!this.touches.has(id))
                    continue;
                this.touches.delete(id);
                if (0 <= lane && lane < LaneCount)
                    this.queue.push({
                        isFirst: true,
                        isDown: false,
                        key: { key: LaneKeys[lane] },
                        timeMS: performance.now()
                    });
            }
        });
        canvas.addEventListener("mousedown", e => {
            e.preventDefault();
            var lane = ((e.clientX - canvas.parentElement.offsetLeft) / (canvas.clientWidth / LaneCount)) << 0;
            if (0 <= lane && lane < LaneCount) {
                this.queue.push({
                    isFirst: true,
                    isDown: true,
                    key: { key: LaneKeys[lane] },
                    timeMS: performance.now()
                });
                this.mouseLane = lane;
            }
        });
        canvas.addEventListener("mousemove", e => {
            if (e.buttons == 0)
                return;
            e.preventDefault();
            var lane = ((e.clientX - canvas.parentElement.offsetLeft) / (canvas.clientWidth / LaneCount)) << 0;
            if (this.mouseLane == lane)
                return;
            if (0 <= lane && lane < LaneCount) {
                if (this.mouseLane >= 0)
                    this.queue.push({
                        isFirst: true,
                        isDown: false,
                        key: { key: LaneKeys[this.mouseLane] },
                        timeMS: performance.now()
                    });
                this.queue.push({
                    isFirst: true,
                    isDown: true,
                    key: { key: LaneKeys[lane] },
                    timeMS: performance.now()
                });
                this.mouseLane = lane;
            }
        });
        canvas.addEventListener("mouseup", e => {
            e.preventDefault();
            var lane = ((e.clientX - canvas.parentElement.offsetLeft) / (canvas.clientWidth / LaneCount)) << 0;
            this.mouseLane = -1;
            if (0 <= lane && lane < LaneCount)
                this.queue.push({
                    isFirst: true,
                    isDown: false,
                    key: { key: LaneKeys[lane] },
                    timeMS: performance.now()
                });
        });
        return this;
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
    setMS(time) { this.audio.currentTime = time / 1000; }
    ;
    isFinished() { return this.finFlag; }
    playbackRate(v) {
        this.audio.playbackRate = Math.min(10, Math.max(v, 0.1));
    }
}
class MyCanvas {
    constructor(parent, canvas) {
        this.parent = parent;
        if (canvas.getContext)
            this.ctx = canvas.getContext('2d');
        else
            throw ("Canvasが対応していないようです");
        this.scaleX = 1;
        this.scaleY = 1;
        var This = this;
        ((Fn) => {
            var i = undefined;
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
        this.ctx.rect((x * this.scaleX) << 0, (y * this.scaleY) << 0, (w * this.scaleX) << 0, (h * this.scaleY) << 0);
    }
    round(x, y, r) {
        this.ctx.arc((x * this.scaleX) << 0, (y * this.scaleY) << 0, (r * Math.min(this.scaleX, this.scaleY)) << 0, -0.5 * Math.PI, 2 * Math.PI);
    }
    longRound(x, y, h, r) {
        this.ctx.arc((x * this.scaleX) << 0, (y * this.scaleY) << 0, (r * Math.min(this.scaleX, this.scaleY)) << 0, -Math.PI, 0);
        this.ctx.arc((x * this.scaleX) << 0, ((y + h) * this.scaleY) << 0, (r * Math.min(this.scaleX, this.scaleY)) << 0, 0, -Math.PI);
        this.ctx.lineTo((x * this.scaleX - r * Math.min(this.scaleX, this.scaleY)) << 0, (y * this.scaleY) << 0);
    }
    beginPath() { this.ctx.beginPath(); }
    fillAll(style = undefined) {
        if (style !== undefined)
            this.ctx.fillStyle = style;
        this.ctx.fillRect(0, 0, this.scaleX, this.scaleY);
    }
    fill(style = undefined) {
        if (style !== undefined && this.ctx.fillStyle !== style)
            this.ctx.fillStyle = style;
        this.ctx.fill();
    }
    stroke(style = undefined) {
        if (style !== undefined && this.ctx.strokeStyle !== style)
            this.ctx.strokeStyle = style;
        this.ctx.stroke();
    }
    clearAll() {
        canvas.ctx.clearRect(0, 0, canvas.scaleX, canvas.scaleY);
    }
}
var NoteType;
(function (NoteType) {
    NoteType[NoteType["remove"] = 0] = "remove";
    NoteType[NoteType["simple"] = 1] = "simple";
    NoteType[NoteType["slide"] = 2] = "slide";
    NoteType[NoteType["hold"] = 3] = "hold";
    NoteType[NoteType["end"] = 4] = "end";
})(NoteType || (NoteType = {}));
const ETS = 5000;
var Note2String = (note) => {
    if (note.type == NoteType.simple)
        return "*:" + note.lane + note._.slice(0, 1).map(v => v << 0).join("|");
    if (note.type == NoteType.slide)
        return "+:" + note.lane + note._.slice(0, 1).map(v => v << 0).join("|");
    if (note.type == NoteType.hold)
        return "~:" + note.lane + note._.slice(0, 2).map(v => v << 0).join("|");
    if (note.type == NoteType.end)
        return "FIN:" + note._.slice(0, 1).map(v => v << 0).join("|");
    showError("未定義ノーツ");
    throw "";
};
var String2Note = (text) => {
    if (text.startsWith("FIN:")) {
        let time = parseFloat(text.substr(4));
        return { type: NoteType.end, time: [time - ETS, time + ETS], _: [time] };
    }
    var times = text.substr(3).split("|").map(v => parseFloat(v));
    if (text.startsWith("*:")) {
        return { type: NoteType.simple, lane: parseInt(text.substr(2, 1)), time: [times[0] - ETS, times[0] + ETS], _: times.slice(0, 1) };
    }
    if (text.startsWith("+:")) {
        return { type: NoteType.slide, lane: parseInt(text.substr(2, 1)), time: [times[0] - ETS, times[0] + ETS], _: times.slice(0, 1) };
    }
    if (text.startsWith("~:")) {
        return { type: NoteType.hold, lane: parseInt(text.substr(2, 1)), time: [times[0] - ETS, times[1] + ETS], _: times.slice(0, 2) };
    }
    showError("未定義ノーツ");
    throw "";
};
var Note2Draw = (note, T2Y) => {
    var lineWidth = 0.8 / LaneCount;
    var lineHeight = 10 / canvas.scaleY;
    var holdNoteLineWidth = 10 / canvas.scaleX;
    var xMin = ((note.lane || 0) + 0.5) / LaneCount - lineWidth / 2;
    var Ys = note._.map(v => T2Y(v));
    canvas.beginPath();
    if (note.type == NoteType.simple) {
        canvas.rect(xMin, Ys[0] - lineHeight / 2, lineWidth, lineHeight);
        canvas.fill("#000");
        return;
    }
    if (note.type == NoteType.slide) {
        canvas.rect(xMin, Ys[0] - lineHeight / 2, lineWidth, lineHeight);
        canvas.fill("#080");
        return;
    }
    if (note.type == NoteType.hold) {
        canvas.rect(xMin, Ys[0] - lineHeight / 2, lineWidth, lineHeight);
        if (note._[1] == Infinity) {
            canvas.rect(xMin + lineWidth / 2 - holdNoteLineWidth / 2, 0, holdNoteLineWidth, Ys[0]);
        }
        else {
            canvas.rect(xMin + lineWidth / 2 - holdNoteLineWidth / 2, Ys[1], holdNoteLineWidth, Ys[0] - Ys[1]);
            canvas.rect(xMin, Ys[1] - lineHeight / 2, lineWidth, lineHeight);
        }
        canvas.fill("#000");
        return;
    }
    if (note.type == NoteType.end) {
        canvas.rect(0, Ys[0] - lineHeight / 2, 1, lineHeight);
        canvas.fill("#800");
        return;
    }
    showError("未定義ノーツ");
    throw "";
};
function _(id) {
    var tmp = document.getElementById(id);
    if (tmp != null)
        return tmp;
    throw "undefined node - " + id;
}
var score = {
    bpms: [],
    score: []
};
const _defaultGridBPM = 120;
const _defaultGridOffset = 0;
const minNoteSpan = 50;
const maxDeleteTimeSpan = 1000;
var audio;
var keys;
var windowSpan = 5000;
var shouldSnap = true;
var noteType = NoteType.simple;
var canvas;
const whiteArea = .7;
function map(value, min1, max1, min2, max2) {
    return (value - min1) / (max1 - min1) * (max2 - min2) + min2;
}
function setScore(text) {
    if (!text.startsWith('_noteString = "')) {
        showError("譜面、読めない");
        return;
    }
    var lines = text.split("\n");
    var scoreText = lines[0].trim().substr('_noteString = "'.length).replace('"', "");
    score.score = scoreText.split(" ").map(v => String2Note(v)).sort((a, b) => a.time[0] - b.time[0]);
    if (lines.length >= 2 && lines[1].startsWith('_score_options = ')) {
        var optionText = lines[1].trim().substr('_score_options = '.length);
        try {
            var options = JSON.parse(optionText);
            if ("windowSpan" in options) {
                windowSpan = options.windowSpan;
                _("ctrl-window").value = windowSpan.toString();
            }
            if ("bpms" in options) {
                _("grid").innerHTML = "";
                options.bpms.forEach(_ => {
                    addBPMGridHTMLElement(_);
                });
            }
        }
        catch (error) {
            showError("譜面の読み込みはできたが、オプション(BPM設定等)の読み込みには失敗した。");
        }
    }
}
function getScore() {
    var scoreText = score.score.map(v => Note2String(v)).join(" ");
    return '_noteString = "' + scoreText + '"\n'
        + '_score_options = ' + JSON.stringify({ windowSpan: windowSpan, bpms: score.bpms }) + '\n//' + new Date().toString();
}
function addBPMGridHTMLElement(item) {
    var container = document.createElement("div");
    var itemIndex = score.bpms.length;
    score.bpms.push(item);
    container.setAttribute("class", "margin-grid framed");
    {
        var removeButton = document.createElement("button");
        removeButton.setAttribute("class", "fa fa-times-circle noPadding hover");
        removeButton.addEventListener("click", () => {
            score.bpms.splice(score.bpms.findIndex(i => i === item), 1);
            _("grid").removeChild(container);
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
            }
            else {
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
                if (e.key == "Enter") {
                    if (!isNaN(parseFloat(input1.value))) {
                        item.bpm = Math.abs(parseFloat(input1.value));
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
                if (e.key == "Enter") {
                    if (!isNaN(parseFloat(input2.value))) {
                        item.offset = parseFloat(input2.value);
                    }
                    input2.value = item.offset.toString();
                }
            });
        }
        container.appendChild(span3);
    }
    _("grid").appendChild(container);
}
window.addEventListener("load", () => {
    {
        _("help").addEventListener("click", () => _("help-doc").classList.toggle("hide"));
        _("score-up").addEventListener("click", () => {
            Util.LoadFileAsText((text, file) => {
                _("score-name").innerText = file.name;
                setScore(text);
            });
        });
        _("score-down").addEventListener("click", () => {
            var defaultName = _("score-name").innerText;
            if (defaultName == "" || defaultName == "unselected")
                defaultName = "score.js";
            Util.DownloadText(prompt("File name: ", defaultName) || defaultName, getScore());
        });
        _("music-up").addEventListener("click", () => {
            Util.LoadFileAsDataURL((url, file) => {
                _("music-name").innerText = file.name;
                audio = new AudioFromFile(url);
                audio.pause();
            });
        });
        _("grid-add").addEventListener("click", () => {
            addBPMGridHTMLElement({
                bpm: _defaultGridBPM,
                offset: _defaultGridOffset,
                enable: true
            });
        });
        if (shouldSnap)
            _("ctrl-snap").innerText = "YES";
        else
            _("ctrl-snap").innerText = "NO";
        _("ctrl-snap").addEventListener("click", () => {
            shouldSnap = !shouldSnap;
            if (shouldSnap)
                _("ctrl-snap").innerText = "YES";
            else
                _("ctrl-snap").innerText = "NO";
        });
        _("ctrl-note-type").innerText = ["REMOVE", "Normal", "Chain", "Hold", "End"][noteType];
        _("ctrl-note-type").addEventListener("click", () => {
            noteType = (noteType + 1) % 4;
            _("ctrl-note-type").innerText = ["REMOVE", "Normal", "Chain", "Hold", "End"][noteType];
        });
        _("ctrl-play").addEventListener("click", () => {
            var text = _("ctrl-play").innerText;
            if (audio) {
                if (audio.audio.paused) {
                    audio.play();
                    _("ctrl-play").innerText = "PAUSE";
                }
                else {
                    audio.pause();
                    _("ctrl-play").innerText = "PLAY";
                }
            }
        });
        _("ctrl-sec").addEventListener("keyup", (e) => {
            if (e.key == "Enter") {
                if (audio) {
                    if (!isNaN(parseFloat(_("ctrl-sec").value))) {
                        var a = audio.audio.paused;
                        audio.setMS(parseFloat(_("ctrl-sec").value));
                        if (a)
                            audio.pause();
                        else
                            audio.play();
                    }
                    _("ctrl-sec").value = audio.getMS().toFixed(0);
                }
                else
                    _("ctrl-sec").value = "";
            }
        });
        _("ctrl-speed").addEventListener("keyup", (e) => {
            if (e.key == "Enter") {
                if (audio) {
                    if (!isNaN(parseFloat(_("ctrl-speed").value))) {
                        var a = audio.audio.paused;
                        audio.playbackRate(parseFloat(_("ctrl-speed").value));
                        if (a)
                            audio.pause();
                        else
                            audio.play();
                    }
                    _("ctrl-speed").value = audio.audio.playbackRate.toFixed(2);
                }
                else
                    _("ctrl-speed").value = "";
            }
        });
        _("ctrl-window").value = windowSpan.toString();
        _("ctrl-window").addEventListener("keyup", (e) => {
            if (e.key == "Enter") {
                if (!isNaN(parseFloat(_("ctrl-window").value))) {
                    windowSpan = parseFloat(_("ctrl-window").value);
                    windowSpan = Math.max(windowSpan, 10);
                }
                _("ctrl-window").value = windowSpan.toString();
            }
        });
    }
    keys = new KeyboardOrTapOrClickInput();
    keys.setTapHandler(_("canvas"));
    canvas = new MyCanvas(_("canvas-parent"), _("canvas"));
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
        }
        if (audio !== undefined) {
            var now = audio.getMS();
            var showingSpace = [now + windowSpan, now - windowSpan * (1 - whiteArea) / whiteArea];
            var T2Y = (time) => map(time, showingSpace[0], showingSpace[1], 0, 1);
            {
                for (var bpmID = 0; bpmID < score.bpms.length; bpmID++) {
                    var span = 60000 / score.bpms[bpmID].bpm;
                    var bpm = score.bpms[bpmID], tmp = (((showingSpace[1] - bpm.offset) / span) << 0) * span + bpm.offset;
                    if (!bpm.enable)
                        continue;
                    for (let i = 0; true; i++) {
                        var y = T2Y(tmp + 60000 * i / score.bpms[bpmID].bpm);
                        if (y < 0)
                            break;
                        canvas.line(0, y, 1, y);
                    }
                }
                canvas.ctx.globalAlpha = 0.25;
                canvas.stroke("#000");
                canvas.ctx.globalAlpha = 1;
            }
            {
                if (audio) {
                    if (audio.audio.paused)
                        _("ctrl-play").innerText = "PLAY";
                    else
                        _("ctrl-play").innerText = "PAUSE";
                }
                keys.queue.forEach(v => {
                    let snappedTime = now;
                    if (shouldSnap && score.bpms.length > 0) {
                        snappedTime = score.bpms.filter(v => v.enable).map(v => {
                            var span = 60000 / v.bpm;
                            return Math.round((snappedTime - v.offset) / span) * span + v.offset;
                        }).sort((a, b) => Math.abs(a) - Math.abs(b))[0];
                    }
                    var lane = LaneKeys.findIndex(vv => vv == v.key.key);
                    if (lane < 0) {
                        if (!v.isDown)
                            return;
                        if (v.key.key == "ArrowUp") {
                            windowSpan += 100;
                            _("ctrl-window").value = windowSpan.toString();
                        }
                        else if (v.key.key == "ArrowDown") {
                            windowSpan -= 100;
                            windowSpan = Math.max(windowSpan, 10);
                            _("ctrl-window").value = windowSpan.toString();
                        }
                        else if (v.key.key == "ArrowLeft") {
                            audio.audio.currentTime -= 0.2;
                        }
                        else if (v.key.key == "ArrowRight") {
                            audio.audio.currentTime += 0.2;
                        }
                        else if (v.key.key == "[") {
                            audio.playbackRate(audio.audio.playbackRate + 0.1);
                        }
                        else if (v.key.key == "]") {
                            audio.playbackRate(audio.audio.playbackRate - 0.1);
                        }
                        if (!v.isFirst)
                            return;
                        if (v.key.key == "Enter") {
                            shouldSnap = !shouldSnap;
                            if (shouldSnap)
                                _("ctrl-snap").innerText = "YES";
                            else
                                _("ctrl-snap").innerText = "NO";
                        }
                        else if (v.key.key == " ") {
                            var text = _("ctrl-play").innerText;
                            if (audio) {
                                if (audio.audio.paused) {
                                    audio.play();
                                    _("ctrl-play").innerText = "PAUSE";
                                }
                                else {
                                    audio.pause();
                                    _("ctrl-play").innerText = "PLAY";
                                }
                            }
                        }
                        else if (v.key.key == "Escape") {
                            if (score.score.findIndex(v => v.type == NoteType.end) >= 0)
                                score.score.splice(score.score.findIndex(v => v.type == NoteType.end));
                            score.score.push({ _: [snappedTime], time: [snappedTime, snappedTime], type: NoteType.end });
                        }
                        else if ("qwer".split("").findIndex(vv => vv == v.key.key) >= 0) {
                            noteType = "qwer".split("").findIndex(vv => vv == v.key.key);
                            _("ctrl-note-type").innerText = ["REMOVE", "Normal", "Chain", "Hold", "End"][noteType];
                        }
                        return;
                    }
                    if (!v.isFirst)
                        return;
                    {
                        if (noteType != NoteType.hold && !v.isDown)
                            return;
                        if (noteType == NoteType.remove) {
                            var tmp = score.score.map((v, i) => [i, v]).filter(v => v[1].lane == lane || v[1].type == NoteType.end).map(v => [v[0], (v[1]._.length == 2 && v[1]._[0] < now && now < v[1]._[1]) ? 0 : Math.min(...v[1]._.map(v => Math.abs(v - now)))]).sort((a, b) => a[1] - b[1]);
                            if (tmp.length != 0 && tmp[0][1] < maxDeleteTimeSpan)
                                score.score.splice(tmp[0][0], 1);
                            return;
                        }
                        if (v.isDown)
                            for (let i = 0; i < score.score.length; i++) {
                                if (score.score[i].lane !== lane)
                                    continue;
                                if (score.score[i]._.findIndex(v => Math.abs(v - snappedTime) < minNoteSpan) >= 0)
                                    return;
                                if (score.score[i].time[1] > snappedTime + minNoteSpan)
                                    break;
                            }
                        if (noteType == NoteType.hold)
                            if (v.isDown)
                                score.score.push({ lane: lane, time: [snappedTime, Infinity], type: noteType, _: [snappedTime, Infinity] });
                            else {
                                console.log("");
                                if (score.score.findIndex((v, i) => {
                                    if (v.lane != lane || v.type != NoteType.hold || v._[1] != Infinity)
                                        return false;
                                    v.time[1] = v._[1] = snappedTime;
                                    if (Math.abs(v._[0] - snappedTime) < minNoteSpan || v._[0] > snappedTime)
                                        score.score.splice(i, 1);
                                    return true;
                                }) < 0)
                                    0;
                            }
                        else
                            score.score.push({ lane: lane, time: [snappedTime, snappedTime], type: noteType, _: [snappedTime] });
                        score.score = score.score.sort((a, b) => a.time[0] - b.time[0]);
                    }
                });
                keys.queue = [];
            }
            {
                canvas.ctx.globalAlpha = 0.5;
                score.score.some((note, i) => note.time[0] > showingSpace[0] ? true : note.time[1] < showingSpace[1] ? false : (Note2Draw(note, T2Y), false));
                canvas.ctx.globalAlpha = 1;
            }
            if (_("ctrl-sec") !== document.activeElement)
                _("ctrl-sec").value = audio.getMS().toFixed(0);
            if (_("ctrl-speed") !== document.activeElement)
                _("ctrl-speed").value = audio.audio.playbackRate.toFixed(2);
        }
        keys.queue = [];
        requestAnimationFrame(Loop);
    })();
});
function editNotes(fn) {
    const data = score.score.map(_ => "lane" in _ ? { type: ["tap", "chain", "hold", "end"][_.type - 1], time: _._, lane: _.lane }
        : { type: ["tap", "chain", "hold", "end"][_.type - 1], time: _._ });
    data = fn(data);
    score.score = data.map(note => {
        if (note.type == "end") {
            let time = note.time[0];
            return { type: NoteType.end, time: [time - ETS, time + ETS], _: [time] };
        }
        var times = note.time;
        if (note.type == "tap") {
            return { type: NoteType.simple, lane: note.lane, time: [times[0] - ETS, times[0] + ETS], _: times.slice(0, 1) };
        }
        if (note.type == "chain") {
            return { type: NoteType.slide, lane: note.lane, time: [times[0] - ETS, times[0] + ETS], _: times.slice(0, 1) };
        }
        if (note.type == "hold") {
            return { type: NoteType.hold, lane: note.lane, time: [times[0] - ETS, times[1] + ETS], _: times.slice(0, 2) };
        }
        showError("未定義ノーツ");
        throw "";
    }).sort((a, b) => a.time[0] - b.time[0]);
}
function editNote(fn) {
    editNotes(_ => _.map(_ => fn(_)));
}
function editNoteTime(fn) {
    editNote(_ => { _.time = _.time.map(fn); return _; });
}
