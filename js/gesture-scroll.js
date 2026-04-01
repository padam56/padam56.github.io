(function () {
  "use strict";

  // Gesture scroll via webcam hand tracking (MediaPipe Hands)
  // Tracks palm Y position — moving hand up scrolls up, moving hand down scrolls down.

  var active = false;
  var video = null;
  var hands = null;
  var camera = null;
  var overlay = null;
  var indicator = null;
  var toggleBtn = null;
  var lastY = null;
  var smoothY = null;
  var deadzone = 0.012;
  var scrollSpeed = 18;
  var rafId = null;

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

    // Direction indicator
    indicator = document.createElement("div");
    Object.assign(indicator.style, {
      position: "absolute",
      top: "4px",
      left: "50%",
      transform: "translateX(-50%)",
      fontSize: "16px",
      color: "#67e8f9",
      textShadow: "0 0 6px rgba(103,232,249,0.8)",
      pointerEvents: "none",
      opacity: "0",
      transition: "opacity 0.15s",
    });
    overlay.appendChild(indicator);

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
    lastY = null;
    smoothY = null;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function onResults(results) {
    if (!active) return;

    if (
      !results.multiHandLandmarks ||
      results.multiHandLandmarks.length === 0
    ) {
      lastY = null;
      smoothY = null;
      indicator.style.opacity = "0";
      return;
    }

    // Use wrist landmark (index 0) for stable tracking
    var landmarks = results.multiHandLandmarks[0];
    var wristY = landmarks[0].y; // 0..1, top=0, bottom=1

    if (smoothY === null) {
      smoothY = wristY;
      lastY = wristY;
      return;
    }

    // Smooth the Y value
    smoothY = smoothY * 0.6 + wristY * 0.4;

    var delta = smoothY - lastY;

    if (Math.abs(delta) > deadzone) {
      // Hand moved down in camera → scroll down, hand moved up → scroll up
      var scrollAmt = delta * scrollSpeed * 100;
      window.scrollBy({ top: scrollAmt, behavior: "auto" });

      if (delta > 0) {
        indicator.textContent = "\u25BC";
        indicator.style.opacity = "1";
      } else {
        indicator.textContent = "\u25B2";
        indicator.style.opacity = "1";
      }
    } else {
      indicator.style.opacity = "0";
    }

    lastY = smoothY;
  }

  // Init when DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createUI);
  } else {
    createUI();
  }
})();
