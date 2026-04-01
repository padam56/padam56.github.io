(function () {
  "use strict";

  // ─── Gesture Control via Webcam (MediaPipe Hands) ───
  // Gestures:
  //   Open hand move up/down → scroll page
  //   Swipe left/right       → switch project filter tabs
  //   Point (index finger)   → virtual cursor + pinch to click
  //   Thumbs up              → confetti burst
  //   Peace sign (✌️)        → toggle dark/light mode
  //   Fist                   → snap to next section

  var active = false;
  var video = null;
  var hands = null;
  var cam = null;
  var overlay = null;
  var indicator = null;
  var toggleBtn = null;
  var cursor = null;
  var helpPanel = null;

  // Scroll state
  var lastY = null;
  var smoothY = null;
  var deadzone = 0.012;
  var scrollSpeed = 18;

  // Swipe state
  var lastX = null;
  var smoothX = null;
  var swipeCooldown = 0;

  // Gesture cooldowns (prevent rapid repeat triggers)
  var thumbsCooldown = 0;
  var peaceCooldown = 0;
  var fistCooldown = 0;
  var pinchCooldown = 0;
  var frameCount = 0;

  // Sections for fist-snap
  var sectionIds = ["about", "skill", "journey", "intel-map", "ai-blueprint", "service", "contact"];

  // ─── Gesture Detection Helpers ───

  function fingerExtended(lm, tip, pip) {
    return lm[tip].y < lm[pip].y;
  }

  function thumbExtended(lm) {
    // Thumb tip (4) is further from palm center than thumb IP (3)
    return Math.abs(lm[4].x - lm[0].x) > Math.abs(lm[3].x - lm[0].x);
  }

  function countExtended(lm) {
    var n = 0;
    if (fingerExtended(lm, 8, 6)) n++;   // index
    if (fingerExtended(lm, 12, 10)) n++;  // middle
    if (fingerExtended(lm, 16, 14)) n++;  // ring
    if (fingerExtended(lm, 20, 18)) n++;  // pinky
    return n;
  }

  function isOpenHand(lm) {
    return countExtended(lm) >= 4 && thumbExtended(lm);
  }

  function isFist(lm) {
    return countExtended(lm) === 0 && !thumbExtended(lm);
  }

  function isThumbsUp(lm) {
    return thumbExtended(lm) && countExtended(lm) === 0;
  }

  function isPeace(lm) {
    return fingerExtended(lm, 8, 6) && fingerExtended(lm, 12, 10) &&
      !fingerExtended(lm, 16, 14) && !fingerExtended(lm, 20, 18);
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

  function switchFilterTab(direction) {
    var btns = Array.prototype.slice.call(document.querySelectorAll(".modern_filter_btn"));
    if (!btns.length) return;
    var activeIdx = -1;
    btns.forEach(function (b, i) { if (b.classList.contains("is-active")) activeIdx = i; });
    if (activeIdx < 0) activeIdx = 0;
    var next = activeIdx + direction;
    if (next < 0) next = btns.length - 1;
    if (next >= btns.length) next = 0;
    btns[next].click();
  }

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
    // If at end, scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleTheme() {
    var body = document.body;
    if (body.classList.contains("theme-dark")) {
      body.classList.remove("theme-dark");
      body.classList.add("theme-light");
      try { localStorage.setItem("theme", "light"); } catch (e) {}
    } else {
      body.classList.remove("theme-light");
      body.classList.add("theme-dark");
      try { localStorage.setItem("theme", "dark"); } catch (e) {}
    }
    // Dispatch for other scripts
    window.dispatchEvent(new CustomEvent("themechange"));
  }

  function spawnConfetti() {
    var colors = ["#ffd166", "#67e8f9", "#2dd4bf", "#f472b6", "#a78bfa", "#fb923c"];
    var container = document.createElement("div");
    Object.assign(container.style, {
      position: "fixed", inset: "0", zIndex: "9999999", pointerEvents: "none", overflow: "hidden"
    });
    document.body.appendChild(container);

    for (var i = 0; i < 80; i++) {
      var piece = document.createElement("div");
      var size = 6 + Math.random() * 8;
      var x = 10 + Math.random() * 80;
      var drift = (Math.random() - 0.5) * 200;
      var dur = 1.2 + Math.random() * 1.5;
      var delay = Math.random() * 0.4;
      var color = colors[Math.floor(Math.random() * colors.length)];
      Object.assign(piece.style, {
        position: "absolute",
        top: "-12px",
        left: x + "%",
        width: size + "px",
        height: size * (0.5 + Math.random() * 0.8) + "px",
        background: color,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        opacity: "1",
        transform: "rotate(" + Math.random() * 360 + "deg)",
        animation: "gestureConfettiFall " + dur + "s ease-in " + delay + "s forwards",
      });
      // Inject drift via CSS custom property
      piece.style.setProperty("--drift", drift + "px");
      container.appendChild(piece);
    }
    setTimeout(function () { container.remove(); }, 3500);
  }

  function moveCursor(x, y) {
    if (!cursor) return;
    // Mirror X since camera is mirrored
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
    // Visual feedback
    cursor.style.transform = "translate(-50%,-50%) scale(0.6)";
    setTimeout(function () { cursor.style.transform = "translate(-50%,-50%) scale(1)"; }, 150);
    // Find and click element
    var el = document.elementFromPoint(px, py);
    if (el) {
      el.click();
    }
  }

  // ─── UI Setup ───

  function injectCSS() {
    var style = document.createElement("style");
    style.textContent = [
      "@keyframes gestureConfettiFall {",
      "  0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }",
      "  100% { transform: translateY(100vh) translateX(var(--drift,0px)) rotate(720deg); opacity: 0; }",
      "}",
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
      "#gesture-help {",
      "  position: fixed; bottom: 200px; right: 18px; z-index: 999998;",
      "  width: 220px; padding: 14px 16px; border-radius: 12px;",
      "  background: rgba(2,8,23,0.92); border: 1px solid rgba(103,232,249,0.25);",
      "  backdrop-filter: blur(8px); box-shadow: 0 8px 24px rgba(0,0,0,0.5);",
      "  font-family: Sora, Manrope, sans-serif; color: #c2d7ee; font-size: 11px;",
      "  line-height: 1.55; display: none;",
      "}",
      "#gesture-help.visible { display: block; animation: gestureHelpIn 0.3s ease; }",
      "@keyframes gestureHelpIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }",
      "#gesture-help h5 {",
      "  margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #67e8f9;",
      "  letter-spacing: 0.6px; text-transform: uppercase;",
      "}",
      "#gesture-help ul { list-style: none; margin: 0; padding: 0; }",
      "#gesture-help li { padding: 3px 0; display: flex; align-items: baseline; gap: 8px; }",
      "#gesture-help li span.gh-icon { flex: 0 0 22px; text-align: center; font-size: 13px; }",
      "#gesture-help li span.gh-label { color: #e5edf7; font-weight: 600; }",
      "#gesture-help li span.gh-desc { color: #9eb5cf; }",
      "#gesture-help button.gh-close {",
      "  position: absolute; top: 8px; right: 10px; background: none;",
      "  border: none; color: #9eb5cf; font-size: 14px; cursor: pointer; padding: 0; line-height: 1;",
      "}",
      "#gesture-help button.gh-close:hover { color: #e5edf7; }",
    ].join("\n");
    document.head.appendChild(style);
  }

  function createUI() {
    injectCSS();

    // Virtual cursor
    cursor = document.createElement("div");
    cursor.id = "gesture-cursor";
    document.body.appendChild(cursor);

    // Gesture guide panel
    helpPanel = document.createElement("div");
    helpPanel.id = "gesture-help";

    var helpTitle = document.createElement("h5");
    helpTitle.textContent = "Gesture Guide";
    helpPanel.appendChild(helpTitle);

    var closeHelp = document.createElement("button");
    closeHelp.className = "gh-close";
    closeHelp.textContent = "\u2715";
    closeHelp.addEventListener("click", function () {
      helpPanel.classList.remove("visible");
    });
    helpPanel.appendChild(closeHelp);

    var gestures = [
      ["\u270B", "Open Hand", "Move up/down to scroll"],
      ["\u270B", "Swipe L/R", "Switch project tabs"],
      ["\u261D\uFE0F", "Point", "Virtual cursor"],
      ["\uD83E\uDD0F", "Pinch", "Click at cursor"],
      ["\uD83D\uDC4D", "Thumbs Up", "Confetti!"],
      ["\u270C\uFE0F", "Peace", "Toggle theme"],
      ["\u270A", "Fist", "Next section"],
    ];

    var ul = document.createElement("ul");
    gestures.forEach(function (g) {
      var li = document.createElement("li");
      var icon = document.createElement("span");
      icon.className = "gh-icon";
      icon.textContent = g[0];
      var label = document.createElement("span");
      label.className = "gh-label";
      label.textContent = g[1] + " ";
      var desc = document.createElement("span");
      desc.className = "gh-desc";
      desc.textContent = g[2];
      li.appendChild(icon);
      li.appendChild(label);
      li.appendChild(desc);
      ul.appendChild(li);
    });
    helpPanel.appendChild(ul);
    document.body.appendChild(helpPanel);

    // Toggle button (fixed, bottom-right)
    toggleBtn = document.createElement("button");
    toggleBtn.id = "gesture-scroll-toggle";
    toggleBtn.setAttribute("aria-label", "Toggle gesture control");
    toggleBtn.title = "Gesture Control — click to use hand gestures";
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

    // Small webcam preview
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

    // Gesture indicator
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

  // ─── MediaPipe Setup ───

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
          lastX = null; smoothX = null;
          frameCount = 0;
          if (helpPanel) helpPanel.classList.add("visible");

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
    if (helpPanel) helpPanel.classList.remove("visible");
    lastY = null; smoothY = null;
    lastX = null; smoothX = null;
  }

  // ─── Main Results Handler ───

  function showIndicator(text) {
    indicator.textContent = text;
    indicator.style.opacity = "1";
  }

  function onResults(results) {
    if (!active) return;
    frameCount++;

    // Decrement cooldowns
    if (swipeCooldown > 0) swipeCooldown--;
    if (thumbsCooldown > 0) thumbsCooldown--;
    if (peaceCooldown > 0) peaceCooldown--;
    if (fistCooldown > 0) fistCooldown--;
    if (pinchCooldown > 0) pinchCooldown--;

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      lastY = null; smoothY = null;
      lastX = null; smoothX = null;
      indicator.style.opacity = "0";
      hideCursor();
      return;
    }

    var lm = results.multiHandLandmarks[0];
    var wristY = lm[0].y;
    var wristX = lm[0].x;

    // ── 1. Thumbs Up → Confetti ──
    if (isThumbsUp(lm) && thumbsCooldown === 0) {
      thumbsCooldown = 45; // ~1.5s at 30fps
      showIndicator("\uD83C\uDF89 CONFETTI!");
      spawnConfetti();
      return;
    }

    // ── 2. Peace Sign → Toggle Theme ──
    if (isPeace(lm) && peaceCooldown === 0) {
      peaceCooldown = 45;
      showIndicator("\u270C\uFE0F THEME");
      toggleTheme();
      return;
    }

    // ── 3. Fist → Snap to Next Section ──
    if (isFist(lm) && fistCooldown === 0) {
      fistCooldown = 40;
      showIndicator("\u270A NEXT SECTION");
      snapToNextSection();
      return;
    }

    // ── 4. Pointing → Virtual Cursor (pinch to click) ──
    if (isPointing(lm)) {
      var tipX = lm[8].x;
      var tipY = lm[8].y;
      moveCursor(tipX, tipY);
      showIndicator("\u261D\uFE0F POINTING");

      if (isPinch(lm) && pinchCooldown === 0) {
        pinchCooldown = 25;
        clickAtCursor();
        showIndicator("\uD83D\uDC46 CLICK!");
      }
      // Don't scroll while pointing
      lastY = null; smoothY = null;
      lastX = null; smoothX = null;
      return;
    }

    hideCursor();

    // ── 5. Open Hand → Scroll + Swipe ──
    if (isOpenHand(lm)) {
      // Smooth Y
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

      // Smooth X for swipe
      if (smoothX === null) { smoothX = wristX; lastX = wristX; }
      smoothX = smoothX * 0.6 + wristX * 0.4;
      var deltaX = smoothX - lastX;

      if (Math.abs(deltaX) > 0.035 && swipeCooldown === 0) {
        swipeCooldown = 30;
        // Camera is mirrored, so left in camera = right in real life
        if (deltaX > 0) {
          switchFilterTab(-1); // swipe left in cam = previous tab
          showIndicator("\u25C0 PREV TAB");
        } else {
          switchFilterTab(1);
          showIndicator("\u25B6 NEXT TAB");
        }
        smoothX = wristX;
        lastX = wristX;
      } else {
        lastX = smoothX;
      }
      return;
    }

    // No recognized gesture
    indicator.style.opacity = "0";
    hideCursor();
    lastY = null; smoothY = null;
    lastX = null; smoothX = null;
  }

  // ─── Init ───
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createUI);
  } else {
    createUI();
  }
})();
