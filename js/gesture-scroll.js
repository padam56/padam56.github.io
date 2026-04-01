(function () {
  "use strict";

  // Gesture scroll via webcam hand tracking (MediaPipe Hands)
  // Zone-based: hand in top zone = scroll up, bottom zone = scroll down, middle = idle.
  // Open hand = active, closed fist = pause scrolling.

  var active = false;
  var video = null;
  var hands = null;
  var camera = null;
  var overlay = null;
  var indicator = null;
  var zoneBar = null;
  var zoneDot = null;
  var toggleBtn = null;
  var smoothY = null;
  var scrollVelocity = 0;
  var rafId = null;

  // Zone thresholds (in normalized 0..1 Y space)
  var upZone = 0.33;   // hand above this → scroll up
  var downZone = 0.67;  // hand below this → scroll down
  var maxSpeed = 22;    // px per frame at zone edge

  function createUI() {
    // Toggle button (fixed, bottom-right)
    toggleBtn = document.createElement("button");
    toggleBtn.id = "gesture-scroll-toggle";
    toggleBtn.setAttribute("aria-label", "Toggle gesture scroll");
    toggleBtn.title = "Gesture Scroll (Webcam)";
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
      width: "140px",
      height: "105px",
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

    // Direction indicator (arrow on video)
    indicator = document.createElement("div");
    Object.assign(indicator.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)",
      fontSize: "28px",
      color: "#67e8f9",
      textShadow: "0 0 10px rgba(103,232,249,0.9)",
      pointerEvents: "none",
      opacity: "0",
      transition: "opacity 0.15s",
      fontWeight: "bold",
    });
    overlay.appendChild(indicator);

    // Zone bar (vertical bar on right side of preview showing hand position)
    zoneBar = document.createElement("div");
    Object.assign(zoneBar.style, {
      position: "absolute",
      top: "6px",
      right: "6px",
      bottom: "6px",
      width: "6px",
      borderRadius: "3px",
      background: "linear-gradient(to bottom, #2dd4bf 0%, rgba(255,255,255,0.1) 33%, rgba(255,255,255,0.1) 67%, #2dd4bf 100%)",
      pointerEvents: "none",
      opacity: "0.7",
    });
    overlay.appendChild(zoneBar);

    // Zone dot (shows current hand Y)
    zoneDot = document.createElement("div");
    Object.assign(zoneDot.style, {
      position: "absolute",
      right: "3px",
      width: "12px",
      height: "12px",
      borderRadius: "50%",
      background: "#67e8f9",
      boxShadow: "0 0 8px rgba(103,232,249,0.8)",
      transform: "translateY(-50%)",
      top: "50%",
      pointerEvents: "none",
      transition: "top 0.08s ease-out",
    });
    overlay.appendChild(zoneDot);

    // Zone labels
    var upLabel = document.createElement("div");
    Object.assign(upLabel.style, {
      position: "absolute", top: "2px", left: "4px",
      fontSize: "8px", color: "rgba(103,232,249,0.6)", pointerEvents: "none",
      letterSpacing: "0.5px", fontWeight: "700",
    });
    upLabel.textContent = "\u25B2 UP";
    overlay.appendChild(upLabel);

    var downLabel = document.createElement("div");
    Object.assign(downLabel.style, {
      position: "absolute", bottom: "2px", left: "4px",
      fontSize: "8px", color: "rgba(103,232,249,0.6)", pointerEvents: "none",
      letterSpacing: "0.5px", fontWeight: "700",
    });
    downLabel.textContent = "\u25BC DOWN";
    overlay.appendChild(downLabel);

    toggleBtn.addEventListener("click", function () {
      if (active) {
        stop();
      } else {
        start();
      }
    });
  }

  function loadMediaPipe(cb) {
    // Load MediaPipe Hands from CDN
    if (window.Hands) {
      cb();
      return;
    }
    var script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.min.js";
    script.onload = function () {
      var camScript = document.createElement("script");
      camScript.src =
        "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.min.js";
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
          lastY = null;
          smoothY = null;

          hands = new window.Hands({
            locateFile: function (file) {
              return (
                "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/" +
                file
              );
            },
          });
          hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.5,
          });
          hands.onResults(onResults);

          camera = new window.Camera(video, {
            onFrame: function () {
              return hands.send({ image: video });
            },
            width: 320,
            height: 240,
          });
          camera.start();
          scrollLoop();
        })
        .catch(function () {
          // Camera access denied or unavailable
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
    if (camera) {
      camera.stop();
      camera = null;
    }
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(function (t) {
        t.stop();
      });
      video.srcObject = null;
    }
    hands = null;
    overlay.style.display = "none";
    toggleBtn.style.background = "rgba(2,8,23,0.75)";
    toggleBtn.style.borderColor = "rgba(103,232,249,0.4)";
    toggleBtn.style.boxShadow = "none";
    indicator.style.opacity = "0";
    zoneDot.style.opacity = "0";
    smoothY = null;
    scrollVelocity = 0;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function isOpenHand(landmarks) {
    // Check if fingers are extended (open hand) by comparing fingertip Y to knuckle Y
    // Fingertips: 8(index), 12(middle), 16(ring), 20(pinky)
    // PIP joints: 6, 10, 14, 18
    var extended = 0;
    var tips = [8, 12, 16, 20];
    var pips = [6, 10, 14, 18];
    for (var i = 0; i < 4; i++) {
      if (landmarks[tips[i]].y < landmarks[pips[i]].y) extended++;
    }
    return extended >= 3; // at least 3 fingers extended = open hand
  }

  function onResults(results) {
    if (!active) return;

    if (
      !results.multiHandLandmarks ||
      results.multiHandLandmarks.length === 0
    ) {
      smoothY = null;
      scrollVelocity = 0;
      indicator.style.opacity = "0";
      zoneDot.style.opacity = "0";
      return;
    }

    var landmarks = results.multiHandLandmarks[0];

    // Only scroll when hand is open (fist = pause)
    if (!isOpenHand(landmarks)) {
      scrollVelocity = 0;
      indicator.textContent = "\u270A";
      indicator.style.opacity = "0.5";
      indicator.style.color = "#f59e0b";
      return;
    }
    indicator.style.color = "#67e8f9";

    // Use wrist (0) for Y tracking
    var wristY = landmarks[0].y;

    if (smoothY === null) {
      smoothY = wristY;
    }
    smoothY = smoothY * 0.5 + wristY * 0.5;

    // Update zone dot position
    zoneDot.style.opacity = "1";
    var barTop = 6;
    var barHeight = 105 - 12; // overlay height minus padding
    zoneDot.style.top = (barTop + smoothY * barHeight) + "px";

    // Zone-based scroll: position determines speed and direction
    if (smoothY < upZone) {
      // In UP zone — the higher the hand, the faster
      var strength = (upZone - smoothY) / upZone; // 0..1
      scrollVelocity = -maxSpeed * strength * strength; // quadratic for fine control
      indicator.textContent = "\u25B2";
      indicator.style.opacity = String(0.4 + strength * 0.6);
    } else if (smoothY > downZone) {
      // In DOWN zone — the lower the hand, the faster
      var strength = (smoothY - downZone) / (1 - downZone);
      scrollVelocity = maxSpeed * strength * strength;
      indicator.textContent = "\u25BC";
      indicator.style.opacity = String(0.4 + strength * 0.6);
    } else {
      // Dead zone — no scrolling
      scrollVelocity = 0;
      indicator.textContent = "\u2022";
      indicator.style.opacity = "0.3";
    }
  }

  function scrollLoop() {
    if (!active) return;
    if (scrollVelocity !== 0) {
      window.scrollBy(0, scrollVelocity);
    }
    rafId = requestAnimationFrame(scrollLoop);
  }

  // Init when DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createUI);
  } else {
    createUI();
  }
})();
