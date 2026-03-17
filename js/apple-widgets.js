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
  var accentController = null;
  var latestAccentState = { code: 0, temp: null, isDay: (new Date().getHours() >= 6 && new Date().getHours() < 18) };
  var usePadamFallback = false;

  var PADAM_LAT = 30.2241;
  var PADAM_LON = -92.0198;
  var PADAM_TZ = "America/Chicago";

  var CACHE_KEY = "appleWidgetsWeatherCacheV1";

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
    var tz = usePadamFallback ? PADAM_TZ : undefined;

    var timeFmt = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz
    });
    var zoneFmt = new Intl.DateTimeFormat(undefined, {
      timeZoneName: "short",
      timeZone: tz
    });
    var weekdayFmt = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      timeZone: tz
    });
    var longDateFmt = new Intl.DateTimeFormat(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: tz
    });

    if (clockTimeEl) clockTimeEl.textContent = timeFmt.format(now);
    if (clockZoneEl) {
      if (usePadamFallback) {
        clockZoneEl.textContent = "Padam · Lafayette, LA";
      } else {
        var zoneText = zoneFmt.formatToParts(now).find(function (p) {
          return p.type === "timeZoneName";
        });
        clockZoneEl.textContent = zoneText ? zoneText.value : "Local time";
      }
    }
    if (dateWeekdayEl) dateWeekdayEl.textContent = weekdayFmt.format(now);
    if (dateLongEl) dateLongEl.textContent = longDateFmt.format(now);
  }

  function initThreeAccent() {
    if (!canvas3d || !window.WebGLRenderingContext) return;

    function loadThree() {
      return import("./vendor/three.module.js").catch(function () {
        return import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
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

      var sunCorona = new THREE.Mesh(
        new THREE.SphereGeometry(0.78, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xffd36f, transparent: true, opacity: 0 })
      );
      root.add(sunCorona);

      var sunRays = new THREE.Mesh(
        new THREE.TorusGeometry(1.02, 0.026, 12, 90),
        new THREE.MeshBasicMaterial({ color: 0xffe8a8, transparent: true, opacity: 0 })
      );
      sunRays.rotation.x = Math.PI * 0.12;
      root.add(sunRays);

      var cloudMaterial = new THREE.MeshBasicMaterial({
        color: 0xd8e4f2,
        transparent: true,
        opacity: 0
      });
      var cloudGroup = new THREE.Group();
      var c1 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), cloudMaterial);
      var c2 = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 16), cloudMaterial);
      var c3 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), cloudMaterial);
      c1.position.set(-0.26, 0.05, 0);
      c2.position.set(0.02, 0.12, 0);
      c3.position.set(0.28, 0.02, 0);
      cloudGroup.add(c1);
      cloudGroup.add(c2);
      cloudGroup.add(c3);
      cloudGroup.position.set(-0.12, 0.22, 0.82);
      root.add(cloudGroup);

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

      var rainGeo = new THREE.BufferGeometry();
      var rain = new Float32Array(90 * 3);
      for (var r = 0; r < 90; r += 1) {
        var r3 = r * 3;
        rain[r3] = rand(-2.2, 2.2);
        rain[r3 + 1] = rand(-1.4, 1.6);
        rain[r3 + 2] = rand(-1.4, 1.4);
      }
      rainGeo.setAttribute("position", new THREE.Float32BufferAttribute(rain, 3));
      var rainMat = new THREE.PointsMaterial({
        color: 0x9bd8ff,
        size: 0.035,
        transparent: true,
        opacity: 0
      });
      var rainCloud = new THREE.Points(rainGeo, rainMat);
      root.add(rainCloud);

      var weatherVisual = {
        isDay: true,
        rain: 0,
        snow: 0,
        gloom: 0,
        storm: 0,
        sun: 1,
        clouds: 0
      };

      function setAccentMood(weatherCode, tempC, isDay) {
        var rainy = weatherCode >= 51 && weatherCode <= 82;
        var storm = weatherCode >= 95;
        var snowy = weatherCode >= 71 && weatherCode <= 77;
        var gloomy = weatherCode === 3 || weatherCode === 45 || weatherCode === 48;
        weatherVisual.isDay = isDay !== false;
        weatherVisual.rain = rainy ? 1 : 0;
        weatherVisual.snow = snowy ? 1 : 0;
        weatherVisual.gloom = gloomy ? 1 : 0;
        weatherVisual.storm = storm ? 1 : 0;
        weatherVisual.sun = weatherVisual.isDay && !gloomy && !rainy && !storm ? 1 : (weatherVisual.isDay ? 0.35 : 0);
        weatherVisual.clouds = gloomy || rainy || storm ? 1 : 0;

        var base = weatherVisual.isDay ? 0xffc46e : 0x8db8ff;
        if (weatherVisual.gloom) base = 0x95a7be;
        if (rainy) base = 0x45b4ff;
        if (snowy) base = 0xdaf4ff;
        if (storm) base = 0x7a93ff;
        if (typeof tempC === "number" && tempC >= 30) base = 0xff9a5f;
        if (typeof tempC === "number" && tempC <= 2 && !snowy) base = 0xa6e3ff;

        globe.material.color.setHex(base);
        globe.material.opacity = weatherVisual.isDay ? 0.9 : 0.78;
        innerCore.material.color.setHex(weatherVisual.isDay ? 0xfff2c7 : 0xd2e8ff);
        innerCore.material.emissive.setHex(storm ? 0x6c8bff : (weatherVisual.isDay ? 0xffb347 : 0x2f6dff));
        innerCore.material.emissiveIntensity = storm ? 0.5 : (weatherVisual.isDay ? 0.36 : 0.22);
        ring.material.color.setHex(storm ? 0x9fb8ff : (weatherVisual.isDay ? 0xffdf94 : 0xbfe5ff));
        ring.material.opacity = weatherVisual.gloom ? 0.34 : 0.58;
        ringB.material.color.setHex(rainy ? 0x8cd3ff : (weatherVisual.isDay ? 0xffe0aa : 0x9ad9ff));
        ringB.material.opacity = weatherVisual.gloom ? 0.3 : 0.5;
        dotsMat.color.setHex(snowy ? 0xffffff : (weatherVisual.isDay ? 0xfff0d3 : 0xf0f9ff));
        dotsMat.opacity = weatherVisual.gloom ? 0.42 : 0.62;
        rainMat.opacity = rainy || storm ? 0.58 : 0;

        sunCorona.material.opacity = 0.62 * weatherVisual.sun;
        sunRays.material.opacity = 0.74 * weatherVisual.sun;
        sunRays.material.color.setHex(storm ? 0xa8b8ff : 0xffe8a8);

        cloudMaterial.opacity = weatherVisual.clouds ? (storm ? 0.78 : 0.58) : 0;
        cloudMaterial.color.setHex(storm ? 0xaebcd6 : (snowy ? 0xe6f3ff : 0xd8e4f2));
      }

      accentController = {
        setWeather: setAccentMood
      };

      // Apply immediately so daytime sun/moon state is visible even before weather fetch resolves.
      setAccentMood(latestAccentState.code, latestAccentState.temp, latestAccentState.isDay);

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
        globe.rotation.y += weatherVisual.isDay ? 0.0018 : 0.0028;
        globe.rotation.x = Math.sin(t * 0.34) * (weatherVisual.gloom ? 0.035 : 0.06);
        innerCore.rotation.x += 0.005;
        innerCore.rotation.y -= 0.0042;
        innerCore.scale.setScalar(0.96 + Math.sin(t * 1.8) * 0.045);
        ring.rotation.z += weatherVisual.storm ? 0.0034 : 0.0018;
        ringB.rotation.y -= weatherVisual.storm ? 0.0032 : 0.0022;
        sunCorona.scale.setScalar(1 + Math.sin(t * 1.4) * 0.06);
        sunRays.rotation.z += weatherVisual.sun > 0.01 ? 0.0028 : 0.001;
        cloudGroup.position.x = -0.12 + Math.sin(t * 0.42) * 0.16;
        cloudGroup.position.y = 0.22 + Math.cos(t * 0.58) * 0.04;
        dotCloud.rotation.y -= weatherVisual.gloom ? 0.0007 : 0.0013;
        dotCloud.rotation.x = Math.sin(t * 0.4) * 0.08;
        dotCloud.position.y = Math.sin(t * 0.8) * 0.05;

        if (rainMat.opacity > 0.01) {
          var arr = rainGeo.attributes.position.array;
          for (var p = 0; p < arr.length; p += 3) {
            arr[p + 1] -= weatherVisual.storm ? 0.065 : 0.045;
            arr[p] += Math.sin(t + p) * 0.0015;
            if (arr[p + 1] < -1.6) {
              arr[p + 1] = 1.7;
              arr[p] = rand(-2.2, 2.2);
              arr[p + 2] = rand(-1.4, 1.4);
            }
          }
          rainGeo.attributes.position.needsUpdate = true;
        }

        renderer.render(scene, camera);
        window.requestAnimationFrame(animate);
      }
      animate();
    }).catch(function () {
      // Keep widget functional when Three.js module is unavailable.
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

    var isDay = payload.current && typeof payload.current.is_day === "number"
      ? payload.current.is_day === 1
      : (new Date().getHours() >= 6 && new Date().getHours() < 18);

    latestAccentState.code = code;
    latestAccentState.temp = temp;
    latestAccentState.isDay = isDay;

    if (accentController && typeof accentController.setWeather === "function") {
      accentController.setWeather(latestAccentState.code, latestAccentState.temp, latestAccentState.isDay);
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
      + "&current=temperature_2m,weather_code,is_day"
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

    if (!navigator.geolocation) {
      usePadamFallback = true;
      updateClock();
      loadWeatherForPosition(PADAM_LAT, PADAM_LON);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        usePadamFallback = false;
        updateClock();
        var lat = pos.coords.latitude;
        var lon = pos.coords.longitude;
        loadWeatherForPosition(lat, lon);
      },
      function () {
        usePadamFallback = true;
        updateClock();
        loadWeatherForPosition(PADAM_LAT, PADAM_LON);
      },
      {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 30 * 60 * 1000
      }
    );
  }

  updateClock();
  window.setInterval(updateClock, 1000);
  initWeather();
  initThreeAccent();
  initPanelTilt();
})();
