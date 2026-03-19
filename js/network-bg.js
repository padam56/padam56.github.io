(function() {
  "use strict";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function distSq(ax, ay, bx, by) {
    var dx = ax - bx;
    var dy = ay - by;
    return dx * dx + dy * dy;
  }

  function NetworkBackground(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      return;
    }

    this.ctx = this.canvas.getContext("2d", { alpha: true });
    if (!this.ctx) {
      console.error("Could not get canvas context");
      return;
    }

    this.nodes = [];
    this.targetNodes = 0;
    this.time = 0;
    this.isVisible = true;
    this.themeMode = "dark";
    this.palette = null;
    this.auroraCanvas = null;
    this.lastFrameTime = 0;
    this.targetFrameMs = 16;

    this.pointer = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      tx: window.innerWidth * 0.5,
      ty: window.innerHeight * 0.5,
      active: false
    };
    this.pointerLastMove = 0;
    this.idleField = {
      phaseX: rand(0, Math.PI * 2),
      phaseY: rand(0, Math.PI * 2),
      radiusX: rand(110, 190),
      radiusY: rand(80, 160)
    };
    this.lastAmbientPulse = 0;

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    this.onThemeChange = this.onThemeChange.bind(this);

    this.init();
  }

  NetworkBackground.prototype.recomputeQuality = function() {
    this.isCompact = window.matchMedia("(max-width: 991px)").matches;
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    var lowThreads = (navigator.hardwareConcurrency || 8) <= 4;
    var lowMemory = (navigator.deviceMemory || 8) <= 4;
    var ua = (navigator.userAgent || "").toLowerCase();
    var isiOS = /iphone|ipad|ipod/.test(ua)
      || (navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1);
    var isWebKit = /webkit/.test(ua) && !/crios|fxios|edgios/.test(ua);
    var safariLike = isiOS && isWebKit;

    this.lowPowerMode = reducedMotion || saveData || lowThreads || lowMemory || safariLike;

    this.dpr = Math.min(window.devicePixelRatio || 1, this.isCompact ? 1.05 : 1.25);
    if (this.lowPowerMode) {
      this.dpr = Math.min(this.dpr, 1);
      this.maxNodes = this.isCompact ? 26 : 40;
      this.linkDistance = this.isCompact ? 102 : 126;
      this.targetFrameMs = 34;
    } else {
      this.maxNodes = this.isCompact ? 56 : 84;
      this.linkDistance = this.isCompact ? 126 : 164;
      this.targetFrameMs = this.isCompact ? 24 : 16;
    }
    this.linkDistanceSq = this.linkDistance * this.linkDistance;
  };

  NetworkBackground.prototype.init = function() {
    this.updatePalette();
    this.recomputeQuality();
    this.resize();
    this.seedNodes();
    this.pointerLastMove = performance.now();
    window.addEventListener("resize", this.resize, { passive: true });
    window.addEventListener("mousemove", this.onPointerMove, { passive: true });
    window.addEventListener("touchstart", this.onPointerMove, { passive: true });
    window.addEventListener("touchmove", this.onPointerMove, { passive: true });
    window.addEventListener("touchend", this.onPointerLeave, { passive: true });
    window.addEventListener("mouseleave", this.onPointerLeave, { passive: true });
    window.addEventListener("themechange", this.onThemeChange, { passive: true });
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    requestAnimationFrame(this.animate);
  };

  NetworkBackground.prototype.onThemeChange = function() {
    this.updatePalette();
    this.renderAuroraLayer();
  };

  NetworkBackground.prototype.updatePalette = function() {
    var isLight = document.body && document.body.classList.contains("theme-light");
    this.themeMode = isLight ? "light" : "dark";
    this.palette = isLight
      ? {
          auroraA: "rgba(0, 190, 255, 0.28)",
          auroraB: "rgba(255, 175, 40, 0.2)",
          linkOuter: [0, 160, 210],
          linkCore: [0, 195, 235],
          nodeOuter: [0, 200, 255, 0.14],
          nodeInner: [0, 200, 255, 0.28],
          nodeCore: [0, 200, 255],
          nodeHighlight: [255, 255, 255, 0.35]
        }
      : {
          auroraA: "rgba(225, 240, 255, 0.34)",
          auroraB: "rgba(180, 220, 255, 0.22)",
          linkOuter: [210, 232, 255],
          linkCore: [238, 247, 255],
          nodeOuter: [220, 236, 255, 0.12],
          nodeInner: [230, 242, 255, 0.25],
          nodeCore: [244, 251, 255],
          nodeHighlight: [255, 255, 255, 0.38]
        };
  };

  NetworkBackground.prototype.resize = function() {
    this.recomputeQuality();
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = this.width + "px";
    this.canvas.style.height = this.height + "px";
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.renderAuroraLayer();

    var minNodes = this.isCompact ? 26 : 34;
    var desired = clamp(Math.floor((this.width * this.height) / 21000), minNodes, this.maxNodes);
    this.targetNodes = desired;
    while (this.nodes.length < desired) this.nodes.push(this.createNode());
    if (this.nodes.length > desired) this.nodes.length = desired;

    for (var i = 0; i < this.nodes.length; i += 1) {
      var n = this.nodes[i];
      n.x = clamp(n.x, 0, this.width);
      n.y = clamp(n.y, 0, this.height);
      if (typeof n.homeX !== "number" || typeof n.homeY !== "number") {
        n.homeX = n.x;
        n.homeY = n.y;
      }
      n.homeX = clamp(n.homeX, 0, this.width);
      n.homeY = clamp(n.homeY, 0, this.height);
    }
  };

  NetworkBackground.prototype.seedNodes = function() {
    this.nodes.length = 0;
    var total = clamp(Math.floor((this.width * this.height) / 23000), 32, this.maxNodes - 2);
    this.targetNodes = total;
    for (var i = 0; i < total; i += 1) {
      this.nodes.push(this.createNode());
    }
  };

  NetworkBackground.prototype.createNode = function(x, y, burst) {
    var patternSeed = Math.random();
    var pattern = patternSeed < 0.56 ? "drift" : (patternSeed < 0.82 ? "orbit" : "weave");
    var phase = rand(0, Math.PI * 2);
    var px = x != null ? x : rand(0, this.width);
    var py = y != null ? y : rand(0, this.height);
    return {
      x: px,
      y: py,
      vx: rand(-0.52, 0.52),
      vy: rand(-0.52, 0.52),
      homeX: clamp(px, 0, this.width),
      homeY: clamp(py, 0, this.height),
      radius: rand(1.4, 2.5),
      alpha: rand(0.72, 0.98),
      hue: rand(188, 214),
      pulse: rand(0, Math.PI * 2),
      ttl: burst ? rand(140, 280) : null,
      pattern: pattern,
      phase: phase,
      spin: rand(0.006, 0.016),
      speedBias: rand(0.92, 1.12)
    };
  };

  NetworkBackground.prototype.onPointerMove = function(evt) {
    var point = evt;
    if (evt && evt.touches && evt.touches[0]) {
      point = evt.touches[0];
    }
    if (!point) return;
    this.pointer.tx = point.clientX;
    this.pointer.ty = point.clientY;
    this.pointer.active = true;
    this.pointerLastMove = performance.now();
  };

  NetworkBackground.prototype.onPointerLeave = function() {
    this.pointer.active = false;
    this.pointerLastMove = performance.now() - 220;
  };

  NetworkBackground.prototype.updatePointerField = function() {
    var now = performance.now();
    var idle = !this.pointer.active && (now - this.pointerLastMove > 220);

    if (idle) {
      var t = this.time * 0.0012;
      var targetX = this.width * 0.5 + Math.cos(t + this.idleField.phaseX) * this.idleField.radiusX;
      var targetY = this.height * 0.5 + Math.sin(t * 0.86 + this.idleField.phaseY) * this.idleField.radiusY;
      this.pointer.tx = clamp(targetX, 30, this.width - 30);
      this.pointer.ty = clamp(targetY, 30, this.height - 30);

      if ((this.time - this.lastAmbientPulse) > 900 && Math.random() < 0.1) {
        this.lastAmbientPulse = this.time;
        var pulseCount = this.isCompact ? 1 : 2;
        for (var i = 0; i < pulseCount; i += 1) {
          var a = rand(0, Math.PI * 2);
          var d = rand(6, 22);
          var pulseNode = this.createNode(this.pointer.tx + Math.cos(a) * d, this.pointer.ty + Math.sin(a) * d, true);
          pulseNode.vx = Math.cos(a) * rand(0.22, 0.52);
          pulseNode.vy = Math.sin(a) * rand(0.22, 0.52);
          pulseNode.alpha = 0.9;
          pulseNode.radius = rand(1.5, 2.8);
          pulseNode.ttl = rand(95, 170);
          this.nodes.push(pulseNode);
        }
      }
    }

     var smooth = this.pointer.active ? 0.95 : 0.04;
    this.pointer.x += (this.pointer.tx - this.pointer.x) * smooth;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * smooth;
  };

  NetworkBackground.prototype.onVisibilityChange = function() {
    this.isVisible = !document.hidden;
  };

  NetworkBackground.prototype.stepNode = function(node) {
    if (typeof node.homeX !== "number" || typeof node.homeY !== "number") {
      node.homeX = node.x;
      node.homeY = node.y;
    }

    var basePhase = this.time * 0.0016 + node.phase;

    if (node.pattern === "orbit") {
      node.vx += Math.cos(basePhase * 1.3) * 0.008 * node.speedBias;
      node.vy += Math.sin(basePhase * 1.1) * 0.008 * node.speedBias;
    } else if (node.pattern === "weave") {
      node.vx += Math.sin(basePhase * 2.1) * 0.006 * node.speedBias;
      node.vy += Math.cos(basePhase * 1.9) * 0.006 * node.speedBias;
    } else {
      node.vx += Math.cos(basePhase * 0.7) * 0.0035;
      node.vy += Math.sin(basePhase * 0.8) * 0.0035;
    }

    node.x += node.vx;
    node.y += node.vy;
    node.pulse += 0.023;

    // Keep long-running motion energetic and avoid nodes stagnating.
    var speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    if (speed < 0.12) {
      node.vx += rand(-0.05, 0.05);
      node.vy += rand(-0.05, 0.05);
    }

    node.vx *= 0.998;
    node.vy *= 0.998;

    // Soft spring to keep long-run distribution even across the full canvas.
    var spring = this.pointer.active ? 0.00045 : 0.00125;
    node.vx += (node.homeX - node.x) * spring;
    node.vy += (node.homeY - node.y) * spring;

    if (node.x < 0 || node.x > this.width) node.vx *= -1;
    if (node.y < 0 || node.y > this.height) node.vy *= -1;

    if (node.ttl != null) {
      node.ttl -= 1;
      node.alpha = Math.max(0, node.alpha - 0.0038);
    }

    var interactionRadius = this.pointer.active ? 320 : 210;
    var d2 = distSq(this.pointer.x, this.pointer.y, node.x, node.y);
    if (d2 < interactionRadius * interactionRadius) {
      var d = Math.max(1, Math.sqrt(d2));
      var force = (interactionRadius - d) / interactionRadius;
      var dx = this.pointer.x - node.x;
      var dy = this.pointer.y - node.y;
      var pull = this.pointer.active ? 0.000009 : 0.0000048;
      var swirl = this.pointer.active ? 0.0000065 : 0.0000024;
      if (this.pointer.active && d < 105) {
        // Prevent core hotspot collapse under cursor.
        var repel = ((105 - d) / 105) * 0.00006;
        node.vx -= dx * repel;
        node.vy -= dy * repel;
      } else {
        node.vx += dx * pull * force;
        node.vy += dy * pull * force;
      }
      node.vx += -dy * swirl * force;
      node.vy += dx * swirl * force;
      node.alpha = Math.min(1, node.alpha + force * (this.pointer.active ? 0.017 : 0.007));
    }

    if (this.pointer.active) {
      node.vx = clamp(node.vx, -0.94, 0.94);
      node.vy = clamp(node.vy, -0.94, 0.94);
    } else {
      node.vx = clamp(node.vx, -0.8, 0.8);
      node.vy = clamp(node.vy, -0.8, 0.8);
    }
  };

  NetworkBackground.prototype.renderAuroraLayer = function() {
    var off = document.createElement("canvas");
    off.width = Math.max(1, Math.floor(this.width));
    off.height = Math.max(1, Math.floor(this.height));
    var octx = off.getContext("2d", { alpha: true });
    if (!octx) return;

    var g1 = octx.createRadialGradient(
      this.width * 0.24,
      this.height * 0.28,
      0,
      this.width * 0.24,
      this.height * 0.28,
      this.width * 0.44
    );
    g1.addColorStop(0, this.palette.auroraA);
    g1.addColorStop(1, "rgba(225, 240, 255, 0)");

    var g2 = octx.createRadialGradient(
      this.width * 0.82,
      this.height * 0.24,
      0,
      this.width * 0.82,
      this.height * 0.24,
      this.width * 0.4
    );
    g2.addColorStop(0, this.palette.auroraB);
    g2.addColorStop(1, "rgba(180, 220, 255, 0)");

    octx.fillStyle = g1;
    octx.fillRect(0, 0, this.width, this.height);
    octx.fillStyle = g2;
    octx.fillRect(0, 0, this.width, this.height);
    this.auroraCanvas = off;
  };

  NetworkBackground.prototype.drawAurora = function() {
    if (!this.auroraCanvas) return;
    this.ctx.drawImage(this.auroraCanvas, 0, 0, this.width, this.height);
  };

  NetworkBackground.prototype.drawLinks = function() {
    var linkCount = new Array(this.nodes.length);
    var pairDrawn = Object.create(null);
    for (var c = 0; c < linkCount.length; c += 1) linkCount[c] = 0;

    var drawPair = (function(self) {
      return function(a, b, d, alpha, thick) {
        self.ctx.beginPath();
        self.ctx.moveTo(a.x, a.y);
        self.ctx.lineTo(b.x, b.y);
        self.ctx.strokeStyle = "rgba(" + self.palette.linkCore[0] + ", " + self.palette.linkCore[1] + ", " + self.palette.linkCore[2] + ", " + (alpha * 0.92) + ")";
        self.ctx.lineWidth = (d < self.linkDistance * 0.35 ? 0.46 : 0.28) * thick;
        self.ctx.lineCap = "round";
        self.ctx.stroke();
      };
    })(this);

    for (var i = 0; i < this.nodes.length; i += 1) {
      for (var j = i + 1; j < this.nodes.length; j += 1) {
        var a = this.nodes[i];
        var b = this.nodes[j];
        var d2 = distSq(a.x, a.y, b.x, b.y);
        if (d2 > this.linkDistanceSq) continue;
        var d = Math.sqrt(d2);

        var alpha = (1 - d / this.linkDistance) * 0.74 * Math.min(a.alpha, b.alpha);
        var midX = (a.x + b.x) * 0.5;
        var midY = (a.y + b.y) * 0.5;
        var pointerRange = this.pointer.active ? 320 : 180;
        var pointerD2 = distSq(this.pointer.x, this.pointer.y, midX, midY);
        if (pointerD2 < pointerRange * pointerRange) {
          var pointerBoost = (1 - Math.sqrt(pointerD2) / pointerRange) * (this.pointer.active ? 0.28 : 0.14);
          alpha += pointerBoost;
        }
        alpha = clamp(alpha, 0, 0.95);
        drawPair(a, b, d, alpha, 1);
        linkCount[i] += 1;
        linkCount[j] += 1;
        pairDrawn[i + ":" + j] = true;
      }
    }

    // Guarantee that sparse nodes still connect to nearest neighbors for a realistic mesh.
    for (var n = 0; n < this.nodes.length; n += 1) {
      if (linkCount[n] >= 2) continue;
      var bestIndex = -1;
      var bestDistance = Infinity;

      for (var m = 0; m < this.nodes.length; m += 1) {
        if (m === n) continue;
        var key = n < m ? (n + ":" + m) : (m + ":" + n);
        if (pairDrawn[key]) continue;

        var dn = distSq(this.nodes[n].x, this.nodes[n].y, this.nodes[m].x, this.nodes[m].y);
        if (dn < bestDistance) {
          bestDistance = dn;
          bestIndex = m;
        }
      }

      if (bestIndex !== -1) {
        var from = this.nodes[n];
        var to = this.nodes[bestIndex];
        var forcedAlpha = 0.22 * Math.min(from.alpha, to.alpha);
        drawPair(from, to, Math.sqrt(bestDistance), forcedAlpha, 0.9);
      }
    }
  };

  NetworkBackground.prototype.drawNodes = function() {
    for (var i = 0; i < this.nodes.length; i += 1) {
      var n = this.nodes[i];
      var shimmer = (Math.sin(n.pulse) + 1) * 0.5;
      var radius = n.radius + shimmer * 0.4;

      // Soft outer glow
      this.ctx.beginPath();
      this.ctx.arc(n.x, n.y, radius * 2.2, 0, Math.PI * 2);
      this.ctx.fillStyle = "rgba(" + this.palette.nodeOuter[0] + ", " + this.palette.nodeOuter[1] + ", " + this.palette.nodeOuter[2] + ", " + this.palette.nodeOuter[3] + ")";
      this.ctx.fill();

      // Inner glow
      this.ctx.beginPath();
      this.ctx.arc(n.x, n.y, radius * 1.3, 0, Math.PI * 2);
      this.ctx.fillStyle = "rgba(" + this.palette.nodeInner[0] + ", " + this.palette.nodeInner[1] + ", " + this.palette.nodeInner[2] + ", " + this.palette.nodeInner[3] + ")";
      this.ctx.fill();

      // Core node - bright but not overdone
      this.ctx.beginPath();
      this.ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = "rgba(" + this.palette.nodeCore[0] + ", " + this.palette.nodeCore[1] + ", " + this.palette.nodeCore[2] + ", " + (n.alpha * 0.9) + ")";
      this.ctx.fill();

      // Subtle highlight
      this.ctx.beginPath();
      this.ctx.arc(n.x - radius * 0.4, n.y - radius * 0.4, radius * 0.35, 0, Math.PI * 2);
      this.ctx.fillStyle = "rgba(" + this.palette.nodeHighlight[0] + ", " + this.palette.nodeHighlight[1] + ", " + this.palette.nodeHighlight[2] + ", " + this.palette.nodeHighlight[3] + ")";
      this.ctx.fill();
    }
  };

  NetworkBackground.prototype.animate = function(now) {
    requestAnimationFrame(this.animate);
    if (!this.isVisible) return;

    if (!now) now = performance.now();
    if (this.lastFrameTime && (now - this.lastFrameTime) < this.targetFrameMs) return;
    var delta = this.lastFrameTime ? (now - this.lastFrameTime) : this.targetFrameMs;
    this.lastFrameTime = now;
    delta = clamp(delta, 12, 40);

    this.time += delta;
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawAurora();
    this.updatePointerField();

    for (var i = this.nodes.length - 1; i >= 0; i -= 1) {
      var n = this.nodes[i];
      this.stepNode(n);
      if (n.ttl != null && n.ttl <= 0) this.nodes.splice(i, 1);
    }

    // Replenish and remix behavior so the mesh never thins out over time.
    while (this.nodes.length < this.targetNodes) {
      this.nodes.push(this.createNode());
    }
    if ((this.time % 4800) < 18 && this.nodes.length) {
      var remixCount = this.isCompact ? 2 : 4;
      for (var r = 0; r < remixCount; r += 1) {
        var idx = Math.floor(Math.random() * this.nodes.length);
        this.nodes[idx].pattern = Math.random() < 0.5 ? "orbit" : (Math.random() < 0.5 ? "weave" : "drift");
        this.nodes[idx].phase = rand(0, Math.PI * 2);
      }
    }

    this.drawLinks();
    this.drawNodes();
  };

  // Initialize only on pages that include the network canvas.
  function initNetworkBackground() {
    var canvas = document.getElementById("network-canvas");
    if (!canvas) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      canvas.style.display = "none";
      return;
    }
    new NetworkBackground("network-canvas");
  }

  // Initialize immediately or on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNetworkBackground);
  } else {
    initNetworkBackground();
  }
})();
