var Util = {
  LoadScript: function (src, callBack) {
    var done = false;
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.src = src;
    head.appendChild(script);
    script.onload = script.onreadystatechange = function () {
      if (!done && (!script.readyState || script.readyState === "loaded" || script.readyState === "complete")) {
        done = true;
        callBack();
        script.onload = script.onreadystatechange = null;
        if (head && script.parentNode) {
          head.removeChild(script);
        }
      }
    };
  }, URLtoObject: function () {
    var arg = {};
    var pair = location.search.substring(1).split("&");
    pair.forEach(function (V) {
      var kv = V.split("=");
      arg[kv[0]] = kv[1];
    });
    return arg;
  }, Polyfill: function () {
    window.performance = window.performance || {};
    window.performance.now = window.performance.now || function () {
      return (new Date).getTime();
    };
    (function () {
      var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
      window.requestAnimationFrame = requestAnimationFrame;
    })();
  }, DateFormat: function (date) {
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    var h = date.getHours();
    var min = date.getMinutes();
    var s = date.getSeconds();
    return y + "/" + m + "/" + d + " " + h + ":" + min + ":" + s;
  }, Download: function (fileName, text) {
    var a = document.createElement("a");
    a.href = window.URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, LoadFile: function (callBack) {
    var input = document.createElement("input");
    input.type = "file";
    input.addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) {
        return;
      }
      var reader = new FileReader;
      reader.onload = function (e) {
        return callBack(e.target.result, file);
      };
      reader.readAsText(file);
    });
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }
};