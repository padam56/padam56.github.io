(function () {
  "use strict";

  var panel = document.getElementById("apple-widget-panel");
  if (!panel) return;

  var clockTimeEl = document.getElementById("apple-clock-time");
  var clockZoneEl = document.getElementById("apple-clock-zone");
  var dateWeekdayEl = document.getElementById("apple-date-weekday");
  var dateLongEl = document.getElementById("apple-date-long");

  var canvas3d = document.getElementById("apple-weather-3d-canvas");

  var weatherTempEl = document.getElementById("apple-weather-temp");
  var weatherCondEl = document.getElementById("apple-weather-cond");
  var weatherHiLoEl = document.getElementById("apple-weather-hilo");
  var weatherLocEl = document.getElementById("apple-weather-loc");
  var accentController = null;

  var CACHE_KEY = "appleWidgetsWeatherCacheV1";
  var DEFAULT_WEATHER_LABEL = "New Orleans, Louisiana, United States";
  var DEFAULT_WEATHER_COORDS = {
    lat: 29.9511,
    lon: -90.0715
  };
  var BROWSER_LOCATION_LABEL = "Current Location";

  var weatherCodeMap = {
    0: "Clear",
    1: "Mostly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Freezing Fog",
    51: "Light Drizzle",
    53: "Drizzle",
    55: "Dense Drizzle",
    56: "Freezing Drizzle",
    57: "Heavy Freezing Drizzle",
    61: "Light Rain",
    63: "Rain",
    65: "Heavy Rain",
    66: "Freezing Rain",
    67: "Heavy Freezing Rain",
    71: "Light Snow",
    73: "Snow",
    75: "Heavy Snow",
    77: "Snow Grains",
    80: "Rain Showers",
    81: "Heavy Showers",
    82: "Violent Showers",
    85: "Snow Showers",
    86: "Heavy Snow Showers",
    95: "Thunderstorm",
    96: "Thunderstorm Hail",
    99: "Severe Thunderstorm"
  };

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function todayKey(d) {
    return [d.getFullYear(), pad2(d.getMonth() + 1), pad2(d.getDate())].join("-");
  }

  function updateClock() {
    try {
      var now = new Date();

      var timeFmt = new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit"
      });
      var zoneFmt = new Intl.DateTimeFormat(undefined, {
        timeZoneName: "short"
      });
      var weekdayFmt = new Intl.DateTimeFormat(undefined, {
        weekday: "long"
      });
      var longDateFmt = new Intl.DateTimeFormat(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric"
      });

      if (clockTimeEl) clockTimeEl.textContent = timeFmt.format(now);
      if (clockZoneEl) {
        var zoneText = "";
        if (typeof zoneFmt.formatToParts === "function") {
          var zonePart = zoneFmt.formatToParts(now).find(function (p) {
            return p.type === "timeZoneName";
          });
          zoneText = zonePart ? zonePart.value : "";
        }
        clockZoneEl.textContent = zoneText || "Local time";
      }
      if (dateWeekdayEl) dateWeekdayEl.textContent = weekdayFmt.format(now);
      if (dateLongEl) dateLongEl.textContent = longDateFmt.format(now);
    } catch (_e) {
      var fallbackNow = new Date();
      if (clockTimeEl) clockTimeEl.textContent = fallbackNow.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (clockZoneEl) clockZoneEl.textContent = "Local time";
      if (dateWeekdayEl) dateWeekdayEl.textContent = fallbackNow.toLocaleDateString([], { weekday: "long" });
      if (dateLongEl) dateLongEl.textContent = fallbackNow.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
    }
  }

  function initThreeAccent() {
    if (!canvas3d) return;
    var isLiveOrbital = false;
    var coarsePointer = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    var smallViewport = window.innerWidth <= 991;
    var lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4;

    canvas3d.classList.add("is-css-fallback");

    function markLiveOrbital() {
      if (isLiveOrbital) return;
      isLiveOrbital = true;
      canvas3d.classList.remove("is-css-fallback");
      canvas3d.classList.add("is-live");
    }

    var dynamicImport = null;
    try {
      dynamicImport = new Function("u", "return import(u);");
    } catch (_e) {
      dynamicImport = null;
    }

    function initCanvasFallback() {
      var ctx = canvas3d.getContext("2d");
      if (!ctx) return;

      canvas3d.classList.add("is-fallback");
      markLiveOrbital();

      var mood = {
        core: "#4a8fdd",
        glow: "rgba(74, 143, 221, 0.42)",
        ringA: "rgba(170, 214, 255, 0.62)",
        ringB: "rgba(110, 208, 170, 0.52)",
        dots: "rgba(225, 244, 255, 0.72)"
      };

      function setFallbackMood(weatherCode, tempC) {
        var rainy = weatherCode >= 51 && weatherCode <= 82;
        var storm = weatherCode >= 95;
        var snowy = weatherCode >= 71 && weatherCode <= 77;

        if (typeof tempC === "number" && tempC >= 30) {
          mood.core = "#3f86d1";
          mood.glow = "rgba(255, 175, 115, 0.36)";
          mood.ringA = "rgba(244, 214, 174, 0.72)";
          mood.ringB = "rgba(120, 205, 166, 0.62)";
          mood.dots = "rgba(255, 235, 217, 0.82)";
          return;
        }

        if (typeof tempC === "number" && tempC <= 2) {
          mood.core = "#6aa6e0";
          mood.glow = "rgba(155, 208, 248, 0.44)";
          mood.ringA = "rgba(214, 244, 255, 0.72)";
          mood.ringB = "rgba(150, 225, 196, 0.58)";
          mood.dots = "rgba(240, 250, 255, 0.86)";
          return;
        }

        mood.core = storm ? "#4a74bf" : (snowy ? "#6ea6dc" : (rainy ? "#468fda" : "#4a8fdd"));
        mood.glow = storm ? "rgba(96, 130, 206, 0.38)" : "rgba(74, 143, 221, 0.42)";
        mood.ringA = storm ? "rgba(167, 189, 244, 0.66)" : "rgba(170, 214, 255, 0.62)";
        mood.ringB = rainy ? "rgba(112, 203, 171, 0.62)" : "rgba(110, 208, 170, 0.52)";
        mood.dots = "rgba(240, 249, 255, 0.75)";
      }

      accentController = {
        setWeather: setFallbackMood
      };

      function setCanvasSize() {
        var w = canvas3d.clientWidth || 260;
        var h = canvas3d.clientHeight || 172;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas3d.width = Math.max(1, Math.round(w * dpr));
        canvas3d.height = Math.max(1, Math.round(h * dpr));
      }

      setCanvasSize();
      window.addEventListener("resize", setCanvasSize, { passive: true });

      var particles = [];
      for (var i = 0; i < 70; i += 1) {
        particles.push({
          angle: Math.random() * Math.PI * 2,
          radius: 0.3 + Math.random() * 0.75,
          speed: 0.1 + Math.random() * 0.42,
          size: 0.6 + Math.random() * 1.8
        });
      }

      function draw(tMs) {
        markLiveOrbital();
        var t = tMs * 0.001;
        var w = canvas3d.width;
        var h = canvas3d.height;
        if (!w || !h) {
          window.requestAnimationFrame(draw);
          return;
        }

        var cx = w * 0.72;
        var cy = h * 0.52;
        var base = Math.min(w, h) * 0.19;

        ctx.clearRect(0, 0, w, h);

        var glow = ctx.createRadialGradient(cx, cy, base * 0.15, cx, cy, base * 2.4);
        glow.addColorStop(0, mood.glow);
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, base * 2.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = mood.ringA;
        ctx.lineWidth = Math.max(1, base * 0.06);
        ctx.beginPath();
        ctx.ellipse(cx, cy, base * 1.8, base * 0.7, t * 0.3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = mood.ringB;
        ctx.lineWidth = Math.max(1, base * 0.045);
        ctx.beginPath();
        ctx.ellipse(cx, cy, base * 1.3, base * 0.52, -t * 0.44 + 0.5, 0, Math.PI * 2);
        ctx.stroke();

        var corePulse = 0.9 + Math.sin(t * 2.2) * 0.08;
        ctx.fillStyle = mood.core;
        ctx.beginPath();
        ctx.arc(cx, cy, base * corePulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = mood.dots;
        for (var p = 0; p < particles.length; p += 1) {
          var particle = particles[p];
          var angle = particle.angle + t * particle.speed;
          var rx = base * (1.8 + particle.radius * 1.4);
          var ry = base * (0.6 + particle.radius * 0.45);
          var x = cx + Math.cos(angle) * rx;
          var y = cy + Math.sin(angle * 1.18) * ry;
          ctx.beginPath();
          ctx.arc(x, y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }

        window.requestAnimationFrame(draw);
      }

      window.requestAnimationFrame(draw);
    }

    function canUseWebGL() {
      if (!window.WebGLRenderingContext) return false;
      try {
        var gl = canvas3d.getContext("webgl") || canvas3d.getContext("experimental-webgl");
        return !!gl;
      } catch (_e) {
        return false;
      }
    }

    // Mobile browsers can aggressively kill tabs with heavy WebGL scenes.
    // Prefer lightweight fallback on touch/low-memory devices.
    if (coarsePointer || smallViewport || lowMemory || !canUseWebGL()) {
      initCanvasFallback();
      return;
    }

    function loadThree() {
      if (!dynamicImport) return Promise.reject(new Error("dynamic import unavailable"));
      return dynamicImport("./vendor/three.module.js").catch(function () {
        return dynamicImport("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
      });
    }

    loadThree().then(function (THREE) {
      var renderer = new THREE.WebGLRenderer({
        canvas: canvas3d,
        antialias: true,
        alpha: true,
        powerPreference: "low-power"
      });
      canvas3d.addEventListener("webglcontextlost", function (evt) {
        evt.preventDefault();
        initCanvasFallback();
      }, { passive: false });

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
      camera.position.set(0, 0, 5.3);

      var key = new THREE.PointLight(0x9ed9ff, 1.25, 24);
      key.position.set(2.5, 2.6, 4.2);
      scene.add(key);
      var fill = new THREE.PointLight(0x4fd1ff, 0.48, 18);
      fill.position.set(-2.2, -1.4, 3.6);
      scene.add(fill);
      scene.add(new THREE.AmbientLight(0x9db4d9, 0.32));

      var root = new THREE.Group();
      scene.add(root);

      function createEarthSurfaceTexture() {
        var size = 512;
        var c = document.createElement("canvas");
        c.width = size;
        c.height = size;
        var ctx = c.getContext("2d");
        if (!ctx) return null;

        var ocean = ctx.createLinearGradient(0, 0, size, size);
        ocean.addColorStop(0, "#163d78");
        ocean.addColorStop(0.45, "#1f5da1");
        ocean.addColorStop(1, "#18467f");
        ctx.fillStyle = ocean;
        ctx.fillRect(0, 0, size, size);

        for (var y = 0; y < size; y += 2) {
          var v = y / size;
          var lat = (v - 0.5) * Math.PI;
          var latAbs = Math.abs(Math.sin(lat));
          for (var x = 0; x < size; x += 2) {
            var u = x / size;
            var wave =
              Math.sin(u * 17.2) * 0.36 +
              Math.cos(v * 13.6) * 0.28 +
              Math.sin((u + v) * 22.0) * 0.2 +
              Math.cos((u * 2.1 - v * 1.3) * 11.0) * 0.16;
            var continentBias = 0.78 - latAbs * 0.62;
            if (wave > continentBias) {
              var lush = Math.max(0, 1 - latAbs * 1.25);
              var r = Math.round(62 + lush * 24 + Math.random() * 5);
              var g = Math.round(118 + lush * 54 + Math.random() * 6);
              var b = Math.round(68 + lush * 28 + Math.random() * 4);
              if (wave > continentBias + 0.24) {
                r += 18;
                g += 18;
                b += 10;
              }
              ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
              ctx.fillRect(x, y, 2, 2);
            }
          }
        }

        var ice = ctx.createLinearGradient(0, 0, 0, size);
        ice.addColorStop(0, "rgba(236, 246, 255, 0.9)");
        ice.addColorStop(0.08, "rgba(236, 246, 255, 0)");
        ice.addColorStop(0.92, "rgba(236, 246, 255, 0)");
        ice.addColorStop(1, "rgba(236, 246, 255, 0.92)");
        ctx.fillStyle = ice;
        ctx.fillRect(0, 0, size, size);

        return new THREE.CanvasTexture(c);
      }

      function createCloudTexture() {
        var size = 512;
        var c = document.createElement("canvas");
        c.width = size;
        c.height = size;
        var ctx = c.getContext("2d");
        if (!ctx) return null;

        ctx.clearRect(0, 0, size, size);
        for (var iCloud = 0; iCloud < 42; iCloud += 1) {
          var x = Math.random() * size;
          var y = Math.random() * size;
          var r = 18 + Math.random() * 46;
          var g = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
          g.addColorStop(0, "rgba(255,255,255,0.3)");
          g.addColorStop(0.55, "rgba(255,255,255,0.14)");
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }

        return new THREE.CanvasTexture(c);
      }

      var earthMap = createEarthSurfaceTexture();
      var cloudMap = createCloudTexture();

      var globe = new THREE.Mesh(
        new THREE.SphereGeometry(1.05, 48, 48),
        new THREE.MeshStandardMaterial({
          color: 0x7fb7ef,
          map: earthMap || null,
          roughness: 0.82,
          metalness: 0.02,
          emissive: 0x0b2c5e,
          emissiveIntensity: 0.1,
          transparent: true,
          opacity: 0.98
        })
      );
      root.add(globe);

      var cloudShell = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 36, 36),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: cloudMap || null,
          alphaMap: cloudMap || null,
          roughness: 0.85,
          metalness: 0,
          transparent: true,
          opacity: 0.24,
          depthWrite: false
        })
      );
      root.add(cloudShell);

      var atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.17, 32, 32),
        new THREE.MeshBasicMaterial({
          color: 0x8ecaff,
          transparent: true,
          opacity: 0.14,
          side: THREE.BackSide,
          depthWrite: false
        })
      );
      root.add(atmosphere);

      var orbitShell = new THREE.Group();
      root.add(orbitShell);

      var orbitA = new THREE.Mesh(
        new THREE.TorusGeometry(1.62, 0.014, 10, 180),
        new THREE.MeshBasicMaterial({
          color: 0xb9dcff,
          transparent: true,
          opacity: 0.6,
          depthWrite: false
        })
      );
      orbitA.rotation.x = Math.PI * 0.32;
      orbitA.rotation.y = Math.PI * 0.16;
      orbitShell.add(orbitA);

      var orbitB = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.012, 10, 170),
        new THREE.MeshBasicMaterial({
          color: 0x90d8b1,
          transparent: true,
          opacity: 0.56,
          depthWrite: false
        })
      );
      orbitB.rotation.x = Math.PI * 0.78;
      orbitB.rotation.z = Math.PI * 0.24;
      orbitShell.add(orbitB);

      var sweepA = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 10, 10),
        new THREE.MeshBasicMaterial({
          color: 0xe5f4ff,
          transparent: true,
          opacity: 0.9,
          depthWrite: false
        })
      );
      orbitA.add(sweepA);

      var sweepB = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 10, 10),
        new THREE.MeshBasicMaterial({
          color: 0xd5f5e3,
          transparent: true,
          opacity: 0.86,
          depthWrite: false
        })
      );
      orbitB.add(sweepB);

      var dotsGeo = new THREE.BufferGeometry();
      var dots = new Float32Array(220 * 3);
      for (var i = 0; i < 220; i += 1) {
        var i3 = i * 3;
        var a = Math.random() * Math.PI * 2;
        var r = 1.7 + Math.random() * 1.6;
        var h = (Math.random() - 0.5) * 1.6;
        dots[i3] = Math.cos(a) * r;
        dots[i3 + 1] = h;
        dots[i3 + 2] = Math.sin(a) * r;
      }
      dotsGeo.setAttribute("position", new THREE.Float32BufferAttribute(dots, 3));
      var dotsMat = new THREE.PointsMaterial({
        color: 0xf0f9ff,
        size: 0.028,
        transparent: true,
        opacity: 0.6
      });
      var dotCloud = new THREE.Points(
        dotsGeo,
        dotsMat
      );
      root.add(dotCloud);

      function setAccentMood(weatherCode, tempC) {
        var rainy = weatherCode >= 51 && weatherCode <= 82;
        var storm = weatherCode >= 95;
        var snowy = weatherCode >= 71 && weatherCode <= 77;
        var base = 0x7fb7ef;
        if (rainy) base = 0x6ea7df;
        if (snowy) base = 0x9bcaf1;
        if (storm) base = 0x678ec2;
        if (typeof tempC === "number" && tempC >= 30) base = 0x87bddf;
        if (typeof tempC === "number" && tempC <= 2) base = 0xaed3f4;

        globe.material.color.setHex(base);
        cloudShell.material.opacity = storm ? 0.32 : (rainy ? 0.3 : 0.24);
        atmosphere.material.color.setHex(storm ? 0x84a9e1 : 0x8ecaff);
        atmosphere.material.opacity = snowy ? 0.2 : (storm ? 0.18 : 0.14);
        orbitA.material.color.setHex(storm ? 0xaec3eb : 0xb9dcff);
        orbitB.material.color.setHex(rainy ? 0x85d3ac : 0x90d8b1);
        orbitA.material.opacity = storm ? 0.66 : 0.6;
        orbitB.material.opacity = rainy ? 0.62 : 0.56;
      }

      accentController = {
        setWeather: setAccentMood
      };

      function onResize() {
        var w = canvas3d.clientWidth || 260;
        var h = canvas3d.clientHeight || 172;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }

      onResize();
      window.addEventListener("resize", onResize, { passive: true });

      var start = performance.now();
      function animate() {
        markLiveOrbital();
        var t = (performance.now() - start) * 0.001;
        globe.rotation.y += 0.0019;
        globe.rotation.x = Math.sin(t * 0.25) * 0.045;
        cloudShell.rotation.y += 0.0023;
        cloudShell.rotation.x = Math.sin(t * 0.42) * 0.028;
        atmosphere.rotation.y -= 0.0004;
        orbitShell.rotation.y += 0.0017;
        orbitShell.rotation.x = Math.sin(t * 0.33) * 0.06;
        sweepA.position.set(Math.cos(t * 1.6) * 1.62, Math.sin(t * 1.6) * 1.62, 0);
        sweepB.position.set(Math.cos(-t * 1.2 + 1.4) * 1.5, Math.sin(-t * 1.2 + 1.4) * 1.5, 0);
        dotCloud.rotation.y -= 0.0013;
        dotCloud.rotation.x = Math.sin(t * 0.4) * 0.08;
        dotCloud.position.y = Math.sin(t * 0.8) * 0.05;
        renderer.render(scene, camera);
        window.requestAnimationFrame(animate);
      }
      animate();
    }).catch(function () {
      // Keep widget functional when Three.js module is unavailable.
      initCanvasFallback();
    });

    window.setTimeout(function () {
      if (!isLiveOrbital && canvas3d) {
        canvas3d.classList.add("is-css-fallback");
      }
    }, 1500);
  }

  function initPanelTilt() {
    if (!panel) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    var touchTimer = 0;

    function markTouching() {
      panel.classList.add("is-touching");
      if (touchTimer) window.clearTimeout(touchTimer);
      touchTimer = window.setTimeout(function () {
        panel.classList.remove("is-touching");
      }, 700);
    }

    panel.addEventListener("touchstart", markTouching, { passive: true });
    panel.addEventListener("pointerdown", function (evt) {
      if (evt.pointerType === "touch") markTouching();
    }, { passive: true });

    if (reduced || coarsePointer) {
      panel.style.setProperty("--aw-tilt-y", "0deg");
      panel.style.setProperty("--aw-tilt-x", "0deg");
      return;
    }

    var mx = 0;
    var my = 0;

    function onMove(event) {
      var rect = panel.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var x = (event.clientX - rect.left) / rect.width;
      var y = (event.clientY - rect.top) / rect.height;
      mx = (x - 0.5) * 2;
      my = (y - 0.5) * 2;
      panel.style.setProperty("--aw-tilt-y", (mx * 1.8).toFixed(2) + "deg");
      panel.style.setProperty("--aw-tilt-x", (my * -1.4).toFixed(2) + "deg");
    }

    function onLeave() {
      panel.style.setProperty("--aw-tilt-y", "0deg");
      panel.style.setProperty("--aw-tilt-x", "0deg");
    }

    panel.addEventListener("pointermove", onMove, { passive: true });
    panel.addEventListener("pointerleave", onLeave, { passive: true });
  }

  function applyWeatherPayload(payload) {
    if (!payload) return;

    var temp = payload.current && typeof payload.current.temperature_2m === "number"
      ? Math.round(payload.current.temperature_2m)
      : null;
    var code = payload.current ? payload.current.weather_code : null;
    var hi = payload.daily && Array.isArray(payload.daily.temperature_2m_max)
      ? Math.round(payload.daily.temperature_2m_max[0])
      : null;
    var lo = payload.daily && Array.isArray(payload.daily.temperature_2m_min)
      ? Math.round(payload.daily.temperature_2m_min[0])
      : null;

    if (weatherTempEl) weatherTempEl.textContent = temp === null ? "--" : (temp + "\u00b0C");
    if (weatherCondEl) weatherCondEl.textContent = weatherCodeMap[code] || "Weather";
    if (weatherHiLoEl) {
      weatherHiLoEl.textContent = (hi === null || lo === null)
        ? "H --\u00b0 / L --\u00b0"
        : ("H " + hi + "\u00b0 / L " + lo + "\u00b0");
    }

    if (accentController && typeof accentController.setWeather === "function") {
      accentController.setWeather(code, temp);
    }
  }

  function getCachedWeather() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_e) {
      return null;
    }
  }

  function setCachedWeather(cache) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (_e) {
      // Ignore storage failures.
    }
  }

  function roundCoord(n) {
    return Math.round(n * 10) / 10;
  }

  function extractWeatherPayload(cache) {
    if (!cache || typeof cache !== "object") return null;
    if (cache.weatherPayload) return cache.weatherPayload;
    if (cache.payload) return cache.payload;
    return null;
  }

  function shouldUseCache(cache, lat, lon) {
    var payload = extractWeatherPayload(cache);
    if (!cache || !cache.dateKey || !payload) return false;
    var nowDateKey = todayKey(new Date());
    if (cache.dateKey !== nowDateKey) return false;
    if (typeof cache.lat !== "number" || typeof cache.lon !== "number") return false;
    return roundCoord(cache.lat) === roundCoord(lat) && roundCoord(cache.lon) === roundCoord(lon);
  }

  function fetchJson(url, timeoutMs) {
    var controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
    var timeoutId = null;
    if (controller && timeoutMs > 0) {
      timeoutId = window.setTimeout(function () {
        controller.abort();
      }, timeoutMs);
    }

    return fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: controller ? controller.signal : undefined
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).finally(function () {
      if (timeoutId) window.clearTimeout(timeoutId);
    });
  }

  function fetchWeather(lat, lon) {
    var url = "https://api.open-meteo.com/v1/forecast"
      + "?latitude=" + encodeURIComponent(String(lat))
      + "&longitude=" + encodeURIComponent(String(lon))
      + "&current=temperature_2m,weather_code"
      + "&daily=temperature_2m_max,temperature_2m_min"
      + "&forecast_days=1"
      + "&timezone=auto";

    return fetchJson(url, 10000);
  }

  function getBrowserLocation() {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation || typeof navigator.geolocation.getCurrentPosition !== "function") {
        reject(new Error("geolocation unavailable"));
        return;
      }

      navigator.geolocation.getCurrentPosition(function (position) {
        if (!position || !position.coords) {
          reject(new Error("geolocation missing coords"));
          return;
        }

        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          label: BROWSER_LOCATION_LABEL
        });
      }, function (err) {
        reject(err || new Error("geolocation rejected"));
      }, {
        enableHighAccuracy: false,
        timeout: 7000,
        maximumAge: 300000
      });
    });
  }

  function fetchIpLocation() {
    return fetchJson("https://ipapi.co/json/", 7000).then(function (payload) {
      if (!payload || typeof payload.latitude !== "number" || typeof payload.longitude !== "number") {
        throw new Error("ip location invalid");
      }

      var city = payload.city ? String(payload.city).trim() : "";
      var region = payload.region ? String(payload.region).trim() : "";
      var country = payload.country_name ? String(payload.country_name).trim() : "";
      var parts = [city, region, country].filter(function (v) {
        return !!v;
      });

      return {
        lat: payload.latitude,
        lon: payload.longitude,
        label: parts.length ? parts.join(", ") : "Approximate IP Location"
      };
    });
  }

  function loadWeatherForPosition(lat, lon) {
    var cache = getCachedWeather();

    if (shouldUseCache(cache, lat, lon)) {
      applyWeatherPayload(extractWeatherPayload(cache));
      return Promise.resolve();
    }

    return Promise.all([
      fetchWeather(lat, lon)
    ]).then(function (results) {
      var payload = results[0];

      applyWeatherPayload(payload);

      setCachedWeather({
        dateKey: todayKey(new Date()),
        lat: lat,
        lon: lon,
        payload: payload
      });
    }).catch(function () {
      var stalePayload = extractWeatherPayload(cache);
      if (stalePayload) {
        applyWeatherPayload(stalePayload);
      }
    });
  }

  function initWeather() {
    if (weatherTempEl) weatherTempEl.textContent = "--";
    if (weatherCondEl) weatherCondEl.textContent = "Weather";
    if (weatherHiLoEl) weatherHiLoEl.textContent = "H --\u00b0 / L --\u00b0";
    if (weatherLocEl) weatherLocEl.textContent = "Requesting location...";

    return getBrowserLocation().then(function (geo) {
      if (weatherLocEl) weatherLocEl.textContent = geo.label;
      return loadWeatherForPosition(geo.lat, geo.lon);
    }).catch(function () {
      return fetchIpLocation().then(function (ipLoc) {
        if (weatherLocEl) weatherLocEl.textContent = ipLoc.label;
        return loadWeatherForPosition(ipLoc.lat, ipLoc.lon);
      }).catch(function () {
        if (weatherLocEl) weatherLocEl.textContent = DEFAULT_WEATHER_LABEL;
        return loadWeatherForPosition(DEFAULT_WEATHER_COORDS.lat, DEFAULT_WEATHER_COORDS.lon);
      });
    });
  }

  updateClock();
  window.setInterval(function () {
    updateClock();
  }, 1000);

  try {
    initWeather();
  } catch (_e) {
    // Keep panel live even when weather fetch path fails.
  }

  try {
    initThreeAccent();
  } catch (_e) {
    if (canvas3d) canvas3d.classList.add("is-css-fallback");
  }

  try {
    initPanelTilt();
  } catch (_e) {
    // Non-critical enhancement.
  }
})();
