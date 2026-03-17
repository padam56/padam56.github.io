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
      var zoneText = zoneFmt.formatToParts(now).find(function (p) {
        return p.type === "timeZoneName";
      });
      clockZoneEl.textContent = zoneText ? zoneText.value : "Local time";
    }
    if (dateWeekdayEl) dateWeekdayEl.textContent = weekdayFmt.format(now);
    if (dateLongEl) dateLongEl.textContent = longDateFmt.format(now);
  }

  function initThreeAccent() {
    if (!canvas3d) return;

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

      var mood = {
        core: "#8cc7ff",
        glow: "rgba(140, 199, 255, 0.38)",
        ringA: "rgba(191, 229, 255, 0.7)",
        ringB: "rgba(154, 217, 255, 0.58)",
        dots: "rgba(240, 249, 255, 0.75)"
      };

      function setFallbackMood(weatherCode, tempC) {
        var rainy = weatherCode >= 51 && weatherCode <= 82;
        var storm = weatherCode >= 95;
        var snowy = weatherCode >= 71 && weatherCode <= 77;

        if (typeof tempC === "number" && tempC >= 30) {
          mood.core = "#ffaf73";
          mood.glow = "rgba(255, 175, 115, 0.36)";
          mood.ringA = "rgba(255, 213, 166, 0.72)";
          mood.ringB = "rgba(255, 178, 136, 0.58)";
          mood.dots = "rgba(255, 235, 217, 0.82)";
          return;
        }

        if (typeof tempC === "number" && tempC <= 2) {
          mood.core = "#b3e7ff";
          mood.glow = "rgba(179, 231, 255, 0.4)";
          mood.ringA = "rgba(214, 244, 255, 0.72)";
          mood.ringB = "rgba(173, 230, 255, 0.6)";
          mood.dots = "rgba(240, 250, 255, 0.86)";
          return;
        }

        mood.core = storm ? "#8ba7ff" : (snowy ? "#d8f3ff" : (rainy ? "#66beff" : "#8cc7ff"));
        mood.glow = storm ? "rgba(139, 167, 255, 0.36)" : "rgba(140, 199, 255, 0.38)";
        mood.ringA = storm ? "rgba(182, 200, 255, 0.68)" : "rgba(191, 229, 255, 0.7)";
        mood.ringB = rainy ? "rgba(140, 211, 255, 0.62)" : "rgba(154, 217, 255, 0.58)";
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

    if (!canUseWebGL()) {
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

      var globe = new THREE.Mesh(
        new THREE.SphereGeometry(1.05, 32, 32),
        new THREE.MeshStandardMaterial({
          color: 0x5fa8ff,
          roughness: 0.28,
          metalness: 0.26,
          transparent: true,
          opacity: 0.82
        })
      );
      root.add(globe);

      var innerCore = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.42, 1),
        new THREE.MeshStandardMaterial({
          color: 0xc9eeff,
          emissive: 0x2fd0ff,
          emissiveIntensity: 0.3,
          roughness: 0.2,
          metalness: 0.3,
          transparent: true,
          opacity: 0.88
        })
      );
      root.add(innerCore);

      var ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.56, 0.03, 12, 120),
        new THREE.MeshBasicMaterial({ color: 0xbfe5ff, transparent: true, opacity: 0.58 })
      );
      ring.rotation.x = Math.PI * 0.28;
      ring.rotation.y = Math.PI * 0.17;
      root.add(ring);

      var ringB = new THREE.Mesh(
        new THREE.TorusGeometry(1.18, 0.018, 10, 90),
        new THREE.MeshBasicMaterial({ color: 0x9ad9ff, transparent: true, opacity: 0.52 })
      );
      ringB.rotation.x = Math.PI * 0.78;
      ringB.rotation.z = Math.PI * 0.21;
      root.add(ringB);

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
        var base = 0x5fa8ff;
        if (rainy) base = 0x45b4ff;
        if (snowy) base = 0xd8f3ff;
        if (storm) base = 0x7aa2ff;
        if (typeof tempC === "number" && tempC >= 30) base = 0xff9a5f;
        if (typeof tempC === "number" && tempC <= 2) base = 0xa6e3ff;

        globe.material.color.setHex(base);
        innerCore.material.emissive.setHex(storm ? 0x6c8bff : 0x2fd0ff);
        ring.material.color.setHex(storm ? 0x9fb8ff : 0xbfe5ff);
        ringB.material.color.setHex(rainy ? 0x8cd3ff : 0x9ad9ff);
      }

      accentController = {
        setWeather: setAccentMood
      };

      function onResize() {
        var w = canvas3d.clientWidth || 260;
        var h = canvas3d.clientHeight || 172;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }

      onResize();
      window.addEventListener("resize", onResize, { passive: true });

      var start = performance.now();
      function animate() {
        var t = (performance.now() - start) * 0.001;
        globe.rotation.y += 0.0023;
        globe.rotation.x = Math.sin(t * 0.34) * 0.06;
        innerCore.rotation.x += 0.005;
        innerCore.rotation.y -= 0.0042;
        innerCore.scale.setScalar(0.96 + Math.sin(t * 1.8) * 0.045);
        ring.rotation.z += 0.0018;
        ringB.rotation.y -= 0.0022;
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
  }

  function initPanelTilt() {
    if (!panel) return;
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
    if (weatherLocEl) weatherLocEl.textContent = DEFAULT_WEATHER_LABEL;

    loadWeatherForPosition(DEFAULT_WEATHER_COORDS.lat, DEFAULT_WEATHER_COORDS.lon);
  }

  updateClock();
  window.setInterval(updateClock, 1000);
  initWeather();
  initThreeAccent();
  initPanelTilt();
})();
