(function () {
  "use strict";

  // ─── Gesture Control via Webcam (MediaPipe Hands) ───
  // Gestures:
  //   Open hand move up/down → scroll page
  //   Point (index finger)   → virtual cursor + pinch to click
  //   Fist                   → snap to next section

  var active = false;
  var video = null;
  var hands = null;
  var cam = null;
  var overlay = null;
  var indicator = null;
  var toggleBtn = null;
  var cursor = null;

  // Scroll state
  var lastY = null;
  var smoothY = null;
  var deadzone = 0.012;
  var scrollSpeed = 18;

  // Cooldowns
  var fistCooldown = 0;
  var pinchCooldown = 0;
  var frameCount = 0;

  // Sections for fist-snap
  var sectionIds = ["about", "skill", "journey", "intel-map", "ai-blueprint", "service", "contact"];

  // ─── Gesture Detection ───

  function fingerExtended(lm, tip, pip) {
    return lm[tip].y < lm[pip].y;
  }

  function thumbExtended(lm) {
    return Math.abs(lm[4].x - lm[0].x) > Math.abs(lm[3].x - lm[0].x);
  }

  function countExtended(lm) {
    var n = 0;
    if (fingerExtended(lm, 8, 6)) n++;
    if (fingerExtended(lm, 12, 10)) n++;
    if (fingerExtended(lm, 16, 14)) n++;
    if (fingerExtended(lm, 20, 18)) n++;
    return n;
  }

  function isOpenHand(lm) {
    return countExtended(lm) >= 4 && thumbExtended(lm);
  }

  function isFist(lm) {
    return countExtended(lm) === 0 && !thumbExtended(lm);
  }

  function isPointing(lm) {
    return fingerExtended(lm, 8, 6) && !fingerExtended(lm, 12, 10) &&
      !fingerExtended(lm, 16, 14) && !fingerExtended(lm, 20, 18);
  }

  function isPinch(lm) {
    var dx = lm[4].x - lm[8].x;
    var dy = lm[4].y - lm[8].y;
    return Math.sqrt(dx * dx + dy * dy) < 0.06;
  }

  // ─── Actions ───

  function snapToNextSection() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    for (var i = 0; i < sectionIds.length; i++) {
      var el = document.getElementById(sectionIds[i]);
      if (el) {
        var top = el.getBoundingClientRect().top + scrollTop;
        if (top > scrollTop + 80) {
          window.scrollTo({ top: top - 60, behavior: "smooth" });
          return;
        }
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function moveCursor(x, y) {
    if (!cursor) return;
    var px = (1 - x) * window.innerWidth;
    var py = y * window.innerHeight;
    cursor.style.left = px + "px";
    cursor.style.top = py + "px";
    cursor.style.display = "block";
  }

  function hideCursor() {
    if (cursor) cursor.style.display = "none";
  }

  function clickAtCursor() {
    if (!cursor) return;
    var px = parseFloat(cursor.style.left);
    var py = parseFloat(cursor.style.top);
    cursor.style.transform = "translate(-50%,-50%) scale(0.6)";
    setTimeout(function () { cursor.style.transform = "translate(-50%,-50%) scale(1)"; }, 150);
    var el = document.elementFromPoint(px, py);
    if (el) el.click();
  }

  // ─── UI Setup ───

  function injectCSS() {
    var style = document.createElement("style");
    style.textContent = [
      "#gesture-cursor {",
      "  position: fixed; z-index: 9999998; width: 24px; height: 24px;",
      "  border: 2px solid #67e8f9; border-radius: 50%; pointer-events: none;",
      "  transform: translate(-50%,-50%) scale(1); transition: transform 0.1s;",
      "  box-shadow: 0 0 12px rgba(103,232,249,0.5); display: none;",
      "}",
      "#gesture-cursor::after {",
      "  content: ''; position: absolute; top: 50%; left: 50%;",
      "  width: 6px; height: 6px; margin: -3px 0 0 -3px;",
      "  background: #67e8f9; border-radius: 50%;",
      "}",
    ].join("\n");
    document.head.appendChild(style);
  }

  function createUI() {
    injectCSS();

    cursor = document.createElement("div");
    cursor.id = "gesture-cursor";
    document.body.appendChild(cursor);

    toggleBtn = document.createElement("button");
    toggleBtn.id = "gesture-scroll-toggle";
    toggleBtn.setAttribute("aria-label", "Toggle gesture control");
    toggleBtn.title = "Gesture Control (Webcam)";
    toggleBtn.textContent = "\u270B";
    Object.assign(toggleBtn.style, {
      position: "fixed",
      bottom: "18px",
      right: "18px",
      zIndex: "999999",
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      border: "1.5px solid rgba(103,232,249,0.4)",
      background: "rgba(2,8,23,0.75)",
      color: "#67e8f9",
      fontSize: "20px",
      cursor: "pointer",
      backdropFilter: "blur(6px)",
      transition: "background 0.25s, border-color 0.25s, box-shadow 0.25s",
      lineHeight: "1",
      padding: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });
    document.body.appendChild(toggleBtn);

    overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      bottom: "70px",
      right: "18px",
      zIndex: "999998",
      width: "160px",
      height: "120px",
      borderRadius: "12px",
      overflow: "hidden",
      border: "1.5px solid rgba(103,232,249,0.3)",
      background: "#000",
      display: "none",
      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
    });
    document.body.appendChild(overlay);

    video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");
    video.muted = true;
    Object.assign(video.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: "scaleX(-1)",
    });
    overlay.appendChild(video);

    indicator = document.createElement("div");
    Object.assign(indicator.style, {
      position: "absolute",
      bottom: "4px",
      left: "0",
      right: "0",
      textAlign: "center",
      fontSize: "11px",
      fontWeight: "700",
      fontFamily: "Sora, Manrope, sans-serif",
      color: "#67e8f9",
      textShadow: "0 0 6px rgba(103,232,249,0.8)",
      pointerEvents: "none",
      opacity: "0",
      transition: "opacity 0.15s",
      letterSpacing: "0.5px",
    });
    overlay.appendChild(indicator);

    toggleBtn.addEventListener("click", function () {
      if (active) { stop(); } else { start(); }
    });
  }

  // ─── MediaPipe ───

  function loadMediaPipe(cb) {
    if (window.Hands) { cb(); return; }
    var script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.min.js";
    script.onload = function () {
      var camScript = document.createElement("script");
      camScript.src = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.min.js";
      camScript.onload = cb;
      document.head.appendChild(camScript);
    };
    document.head.appendChild(script);
  }

  function start() {
    loadMediaPipe(function () {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 320, height: 240, facingMode: "user" } })
        .then(function (stream) {
          video.srcObject = stream;
          video.play();
          overlay.style.display = "block";
          toggleBtn.style.background = "rgba(14,165,164,0.35)";
          toggleBtn.style.borderColor = "#2dd4bf";
          toggleBtn.style.boxShadow = "0 0 12px rgba(45,212,191,0.3)";
          active = true;
          lastY = null; smoothY = null;
          frameCount = 0;

          hands = new window.Hands({
            locateFile: function (file) {
              return "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/" + file;
            },
          });
          hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.5,
          });
          hands.onResults(onResults);

          cam = new window.Camera(video, {
            onFrame: function () { return hands.send({ image: video }); },
            width: 320,
            height: 240,
          });
          cam.start();
        })
        .catch(function () {
          toggleBtn.style.background = "rgba(239,68,68,0.25)";
          toggleBtn.style.borderColor = "#ef4444";
          setTimeout(function () {
            toggleBtn.style.background = "rgba(2,8,23,0.75)";
            toggleBtn.style.borderColor = "rgba(103,232,249,0.4)";
          }, 2000);
        });
    });
  }

  function stop() {
    active = false;
    if (cam) { cam.stop(); cam = null; }
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(function (t) { t.stop(); });
      video.srcObject = null;
    }
    hands = null;
    overlay.style.display = "none";
    toggleBtn.style.background = "rgba(2,8,23,0.75)";
    toggleBtn.style.borderColor = "rgba(103,232,249,0.4)";
    toggleBtn.style.boxShadow = "none";
    indicator.style.opacity = "0";
    hideCursor();
    lastY = null; smoothY = null;
  }

  // ─── Results Handler ───

  function showIndicator(text) {
    indicator.textContent = text;
    indicator.style.opacity = "1";
  }

  function onResults(results) {
    if (!active) return;
    frameCount++;
    if (fistCooldown > 0) fistCooldown--;
    if (pinchCooldown > 0) pinchCooldown--;

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      lastY = null; smoothY = null;
      indicator.style.opacity = "0";
      hideCursor();
      return;
    }

    var lm = results.multiHandLandmarks[0];

    // ── 1. Fist → Snap to Next Section ──
    if (isFist(lm) && fistCooldown === 0) {
      fistCooldown = 40;
      showIndicator("\u270A NEXT SECTION");
      snapToNextSection();
      return;
    }

    // ── 2. Pointing → Virtual Cursor (pinch to click) ──
    if (isPointing(lm)) {
      moveCursor(lm[8].x, lm[8].y);
      showIndicator("\u261D\uFE0F POINTING");

      if (isPinch(lm) && pinchCooldown === 0) {
        pinchCooldown = 25;
        clickAtCursor();
        showIndicator("\uD83D\uDC46 CLICK!");
      }
      lastY = null; smoothY = null;
      return;
    }

    hideCursor();

    // ── 3. Open Hand → Scroll ──
    if (isOpenHand(lm)) {
      var wristY = lm[0].y;
      if (smoothY === null) { smoothY = wristY; lastY = wristY; }
      smoothY = smoothY * 0.6 + wristY * 0.4;
      var deltaY = smoothY - lastY;

      if (Math.abs(deltaY) > deadzone) {
        var scrollAmt = deltaY * scrollSpeed * 100;
        window.scrollBy({ top: scrollAmt, behavior: "auto" });
        showIndicator(deltaY > 0 ? "\u25BC SCROLL DOWN" : "\u25B2 SCROLL UP");
      } else {
        indicator.style.opacity = "0";
      }
      lastY = smoothY;
      return;
    }

    indicator.style.opacity = "0";
    hideCursor();
    lastY = null; smoothY = null;
  }

  // ─── Init ───
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createUI);
  } else {
    createUI();
  }
})();
