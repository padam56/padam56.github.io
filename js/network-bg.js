(function() {
  "use strict";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function dist(ax, ay, bx, by) {
    var dx = ax - bx;
    var dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function distSq(ax, ay, bx, by) {
    var dx = ax - bx;
    var dy = ay - by;
    return dx * dx + dy * dy;
  }

  function NetworkBackground(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error("Canvas element not found:", canvasId);
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
    this.activeMode = "network";

    this.pointer = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      active: false
    };

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onWindowClick = this.onWindowClick.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    this.onThemeChange = this.onThemeChange.bind(this);
    this.onVisualModeChange = this.onVisualModeChange.bind(this);

    this.init();
  }

  NetworkBackground.prototype.recomputeQuality = function() {
    this.isCompact = window.matchMedia("(max-width: 991px)").matches;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.isCompact ? 1.05 : 1.25);
    this.maxNodes = this.isCompact ? 56 : 84;
    this.linkDistance = this.isCompact ? 126 : 164;
    this.linkDistanceSq = this.linkDistance * this.linkDistance;
  };

  NetworkBackground.prototype.init = function() {
    this.updatePalette();
    this.recomputeQuality();
    this.onVisualModeChange();
    this.resize();
    this.seedNodes();
    window.addEventListener("resize", this.resize, { passive: true });
    window.addEventListener("mousemove", this.onPointerMove, { passive: true });
    window.addEventListener("mouseleave", this.onPointerLeave, { passive: true });
    window.addEventListener("click", this.onWindowClick, { passive: true });
    window.addEventListener("themechange", this.onThemeChange, { passive: true });
    window.addEventListener("visualmodechange", this.onVisualModeChange, { passive: true });
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    requestAnimationFrame(this.animate);
  };

  NetworkBackground.prototype.onVisualModeChange = function() {
    this.activeMode = "network";
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
    return {
      x: x != null ? x : rand(0, this.width),
      y: y != null ? y : rand(0, this.height),
      vx: rand(-0.52, 0.52),
      vy: rand(-0.52, 0.52),
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
    this.pointer.x = evt.clientX;
    this.pointer.y = evt.clientY;
    this.pointer.active = true;
  };

  NetworkBackground.prototype.onPointerLeave = function() {
    this.pointer.active = false;
  };

  NetworkBackground.prototype.onWindowClick = function(evt) {
    var interactive = evt.target.closest("a, button, input, textarea, select, label");
    if (interactive) return;

    var burstCount = this.isCompact ? 5 : 8;
    for (var i = 0; i < burstCount; i += 1) {
      var angle = (Math.PI * 2 * i) / burstCount;
      var d = rand(7, 34);
      var node = this.createNode(evt.clientX + Math.cos(angle) * d, evt.clientY + Math.sin(angle) * d, true);
      node.vx = Math.cos(angle) * rand(0.5, 1.35);
      node.vy = Math.sin(angle) * rand(0.5, 1.35);
      node.alpha = 0.95;
      node.radius = rand(1.6, 3.2);
      this.nodes.push(node);
    }

    if (this.nodes.length > this.maxNodes + 54) {
      this.nodes.splice(0, this.nodes.length - (this.maxNodes + 54));
    }
  };

  NetworkBackground.prototype.onVisibilityChange = function() {
    this.isVisible = !document.hidden;
  };

  NetworkBackground.prototype.stepNode = function(node) {
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

    if (node.x < 0 || node.x > this.width) node.vx *= -1;
    if (node.y < 0 || node.y > this.height) node.vy *= -1;

    if (node.ttl != null) {
      node.ttl -= 1;
      node.alpha = Math.max(0, node.alpha - 0.0038);
    }

    if (this.pointer.active) {
      var d2 = distSq(this.pointer.x, this.pointer.y, node.x, node.y);
      if (d2 < 28900) {
        var d = Math.sqrt(d2);
        var force = (170 - d) / 170;
        node.vx += (this.pointer.x - node.x) * 0.000006 * force;
        node.vy += (this.pointer.y - node.y) * 0.000006 * force;
      }
      node.vx = clamp(node.vx, -0.9, 0.9);
      node.vy = clamp(node.vy, -0.9, 0.9);
    } else {
      node.vx = clamp(node.vx, -0.78, 0.78);
      node.vy = clamp(node.vy, -0.78, 0.78);
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

  NetworkBackground.prototype.animate = function() {
    requestAnimationFrame(this.animate);
    if (!this.isVisible) return;

    this.time += 16;
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawAurora();

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

  // Initialize immediately or on DOMContentLoaded
  if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", function() {
      new NetworkBackground("network-canvas");
    });
  } else {
    new NetworkBackground("network-canvas");
  }
})();
