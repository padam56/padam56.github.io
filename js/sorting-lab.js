(function() {
  function setupSortingLabDemo() {
    var canvas = document.getElementById("sort-demo-canvas");
    var algo = document.getElementById("sort-algo");
    var pattern = document.getElementById("sort-pattern");
    var size = document.getElementById("sort-size");
    var sizeValue = document.getElementById("sort-size-value");
    var speed = document.getElementById("sort-speed");
    var speedValue = document.getElementById("sort-speed-value");
    var runBtn = document.getElementById("sort-run");
    var shuffleBtn = document.getElementById("sort-shuffle");
    var useWhen = document.getElementById("sort-use-when");
    var bestFit = document.getElementById("sort-best-fit");
    var impact = document.getElementById("sort-impact");
    var complexity = document.getElementById("sort-complexity");
    var stability = document.getElementById("sort-stability");
    var comparisons = document.getElementById("sort-comparisons");
    var writes = document.getElementById("sort-writes");
    var note = document.getElementById("sort-algo-note");
    var status = document.getElementById("sort-status");
    if (!canvas || !algo || !pattern || !size || !sizeValue || !speed || !speedValue || !runBtn || !shuffleBtn || !useWhen || !bestFit || !impact || !complexity || !stability || !comparisons || !writes || !note || !status) return;

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var rafId = null;
    var running = false;
    var baseArray = [];
    var liveArray = [];
    var ops = [];
    var opIndex = 0;
    var compareCount = 0;
    var writeCount = 0;
    var activeA = -1;
    var activeB = -1;
    var activePivot = -1;
    var done = false;

    var algoMeta = {
      bubble: {
        useWhen: "You need simple educational visibility into swap-heavy local corrections.",
        bestFit: "Tiny arrays and teaching visual intuition for adjacent comparisons.",
        impact: "Easy to reason about, but mainly for demos and sanity checks.",
        complexity: "Best O(n), Avg O(n^2), Worst O(n^2)",
        stability: "Stable"
      },
      selection: {
        useWhen: "Write operations are expensive and you want deterministic pass behavior.",
        bestFit: "Small datasets where minimizing swaps matters more than comparisons.",
        impact: "Predictable memory usage with simple operational cost profile.",
        complexity: "Best O(n^2), Avg O(n^2), Worst O(n^2)",
        stability: "Not Stable"
      },
      insertion: {
        useWhen: "Input arrives nearly sorted and updates are incremental.",
        bestFit: "Online maintenance of ranked lists and small near-sorted buffers.",
        impact: "Fast practical behavior in low-disorder streams with stability.",
        complexity: "Best O(n), Avg O(n^2), Worst O(n^2)",
        stability: "Stable"
      },
      merge: {
        useWhen: "You require stable sort behavior with guaranteed n log n scaling.",
        bestFit: "Large data pipelines where predictable performance is mandatory.",
        impact: "Reliable production baseline for stable, throughput-aware sorting.",
        complexity: "Best O(n log n), Avg O(n log n), Worst O(n log n)",
        stability: "Stable"
      },
      quick: {
        useWhen: "Average-case speed is critical and in-place sorting is preferred.",
        bestFit: "General-purpose in-memory sorting with randomized or mixed inputs.",
        impact: "Excellent practical throughput when pivot behavior is healthy.",
        complexity: "Best O(n log n), Avg O(n log n), Worst O(n^2)",
        stability: "Not Stable"
      },
      heap: {
        useWhen: "You need bounded worst-case performance with in-place memory usage.",
        bestFit: "Systems requiring deterministic n log n without extra merge buffers.",
        impact: "Strong reliability under adversarial input distributions.",
        complexity: "Best O(n log n), Avg O(n log n), Worst O(n log n)",
        stability: "Not Stable"
      },
      counting: {
        useWhen: "Keys are bounded integers and linear-time throughput is needed.",
        bestFit: "Large event batches with known value range and duplicate-heavy distributions.",
        impact: "Excellent for high-volume integer sorting in ETL and telemetry preprocessing.",
        complexity: "Best O(n + k), Avg O(n + k), Worst O(n + k)",
        stability: "Stable"
      },
      radix: {
        useWhen: "Integer keys are available and you need predictable linear digit passes.",
        bestFit: "IDs, timestamps, and numeric fields where comparison overhead hurts latency.",
        impact: "Scales cleanly on large integer streams with stable bucket passes.",
        complexity: "Best O(d(n + b)), Avg O(d(n + b)), Worst O(d(n + b))",
        stability: "Stable"
      }
    };

    function setMeta() {
      var meta = algoMeta[algo.value] || algoMeta.insertion;
      useWhen.textContent = meta.useWhen;
      bestFit.textContent = meta.bestFit;
      impact.textContent = meta.impact;
      complexity.textContent = meta.complexity;
      stability.textContent = meta.stability;
      var scenario = {
        bubble: "Scenario: teach junior engineers why local swap strategies degrade on large random feeds.",
        selection: "Scenario: embedded ranking pass where flash writes are constrained but comparisons are cheap.",
        insertion: "Scenario: maintain sorted transaction priorities as new records stream in continuously.",
        merge: "Scenario: nightly ETL merge pipeline requiring stable deterministic ordering at scale.",
        quick: "Scenario: API-side fast in-memory sort for user-facing leaderboards under latency pressure.",
        heap: "Scenario: reliability-critical backend where adversarial ordering must not break throughput.",
        counting: "Scenario: rank integer risk scores quickly during high-volume fraud stream preprocessing.",
        radix: "Scenario: sort massive numeric identifiers in ingestion pipelines with tight latency budgets."
      };
      note.textContent = scenario[algo.value] || scenario.insertion;
    }

    function clamp(v, a, b) {
      return Math.max(a, Math.min(b, v));
    }

    function generateArray(n, mode) {
      var arr = [];
      var i;
      if (mode === "reversed") {
        for (i = 0; i < n; i++) arr.push(n - i);
      } else if (mode === "nearly") {
        for (i = 0; i < n; i++) arr.push(i + 1);
        for (i = 0; i < Math.max(1, Math.floor(n * 0.08)); i++) {
          var a = Math.floor(Math.random() * n);
          var b = Math.floor(Math.random() * n);
          var t = arr[a]; arr[a] = arr[b]; arr[b] = t;
        }
      } else if (mode === "few-unique") {
        for (i = 0; i < n; i++) arr.push(8 + Math.floor(Math.random() * 12) * 4);
      } else {
        for (i = 0; i < n; i++) arr.push(8 + Math.floor(Math.random() * 52));
      }
      return arr;
    }

    function resizeCanvas() {
      var wrap = canvas.parentElement;
      if (!wrap) return;
      var width = Math.max(420, Math.floor(wrap.clientWidth - 20));
      var height = width > 860 ? 420 : Math.max(280, Math.floor(width * 0.42));
      canvas.width = width;
      canvas.height = height;
      draw();
    }

    function resetDataset() {
      var n = parseInt(size.value, 10) || 56;
      sizeValue.textContent = String(n);
      baseArray = generateArray(n, pattern.value);
      liveArray = baseArray.slice();
      ops = [];
      opIndex = 0;
      compareCount = 0;
      writeCount = 0;
      activeA = -1;
      activeB = -1;
      activePivot = -1;
      done = false;
      comparisons.textContent = "0";
      writes.textContent = "0";
      status.textContent = "Data prepared: " + n + " elements. Press Run Sort to animate " + (algo.options[algo.selectedIndex] ? algo.options[algo.selectedIndex].textContent : "sorting") + ".";
      draw();
    }

    function pushCompare(a, b) { ops.push({ t: "c", a: a, b: b }); }
    function pushSwap(a, b) { ops.push({ t: "s", a: a, b: b }); }
    function pushWrite(i, v) { ops.push({ t: "w", i: i, v: v }); }
    function pushPivot(i) { ops.push({ t: "p", i: i }); }

    function buildBubble(arr) {
      var a = arr.slice();
      var n = a.length;
      for (var i = 0; i < n - 1; i++) {
        for (var j = 0; j < n - i - 1; j++) {
          pushCompare(j, j + 1);
          if (a[j] > a[j + 1]) {
            var t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
            pushSwap(j, j + 1);
          }
        }
      }
    }

    function buildSelection(arr) {
      var a = arr.slice();
      var n = a.length;
      for (var i = 0; i < n - 1; i++) {
        var min = i;
        for (var j = i + 1; j < n; j++) {
          pushCompare(min, j);
          if (a[j] < a[min]) min = j;
        }
        if (min !== i) {
          var t = a[i]; a[i] = a[min]; a[min] = t;
          pushSwap(i, min);
        }
      }
    }

    function buildInsertion(arr) {
      var a = arr.slice();
      for (var i = 1; i < a.length; i++) {
        var key = a[i];
        var j = i - 1;
        while (j >= 0) {
          pushCompare(j, j + 1);
          if (a[j] > key) {
            a[j + 1] = a[j];
            pushWrite(j + 1, a[j]);
            j--;
          } else {
            break;
          }
        }
        a[j + 1] = key;
        pushWrite(j + 1, key);
      }
    }

    function buildMerge(arr) {
      var a = arr.slice();
      function rec(l, r) {
        if (l >= r) return;
        var m = Math.floor((l + r) / 2);
        rec(l, m);
        rec(m + 1, r);
        var left = a.slice(l, m + 1);
        var right = a.slice(m + 1, r + 1);
        var i = 0;
        var j = 0;
        var k = l;
        while (i < left.length && j < right.length) {
          pushCompare(l + i, m + 1 + j);
          if (left[i] <= right[j]) {
            a[k] = left[i];
            pushWrite(k, left[i]);
            i++;
          } else {
            a[k] = right[j];
            pushWrite(k, right[j]);
            j++;
          }
          k++;
        }
        while (i < left.length) {
          a[k] = left[i];
          pushWrite(k, left[i]);
          i++;
          k++;
        }
        while (j < right.length) {
          a[k] = right[j];
          pushWrite(k, right[j]);
          j++;
          k++;
        }
      }
      rec(0, a.length - 1);
    }

    function buildQuick(arr) {
      var a = arr.slice();
      function rec(l, r) {
        if (l >= r) return;
        var pivot = a[r];
        pushPivot(r);
        var i = l;
        for (var j = l; j < r; j++) {
          pushCompare(j, r);
          if (a[j] <= pivot) {
            if (i !== j) {
              var t = a[i]; a[i] = a[j]; a[j] = t;
              pushSwap(i, j);
            }
            i++;
          }
        }
        if (i !== r) {
          var tt = a[i]; a[i] = a[r]; a[r] = tt;
          pushSwap(i, r);
        }
        rec(l, i - 1);
        rec(i + 1, r);
      }
      rec(0, a.length - 1);
    }

    function buildHeap(arr) {
      var a = arr.slice();
      var n = a.length;

      function heapify(sizeN, i) {
        var largest = i;
        var left = 2 * i + 1;
        var right = 2 * i + 2;
        if (left < sizeN) {
          pushCompare(left, largest);
          if (a[left] > a[largest]) largest = left;
        }
        if (right < sizeN) {
          pushCompare(right, largest);
          if (a[right] > a[largest]) largest = right;
        }
        if (largest !== i) {
          var t = a[i]; a[i] = a[largest]; a[largest] = t;
          pushSwap(i, largest);
          heapify(sizeN, largest);
        }
      }

      for (var i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
      for (var end = n - 1; end > 0; end--) {
        var tmp = a[0]; a[0] = a[end]; a[end] = tmp;
        pushSwap(0, end);
        heapify(end, 0);
      }
    }

    function buildCounting(arr) {
      var a = arr.slice();
      var n = a.length;
      if (!n) return;
      var minV = a[0];
      var maxV = a[0];
      for (var i = 1; i < n; i++) {
        if (a[i] < minV) minV = a[i];
        if (a[i] > maxV) maxV = a[i];
      }
      var range = maxV - minV + 1;
      var count = new Array(range);
      for (var z = 0; z < range; z++) count[z] = 0;
      for (i = 0; i < n; i++) count[a[i] - minV] += 1;
      for (i = 1; i < range; i++) count[i] += count[i - 1];
      var out = new Array(n);
      for (i = n - 1; i >= 0; i--) {
        var key = a[i] - minV;
        var pos = count[key] - 1;
        out[pos] = a[i];
        count[key] -= 1;
      }
      for (i = 0; i < n; i++) pushWrite(i, out[i]);
    }

    function buildRadix(arr) {
      var a = arr.slice();
      var n = a.length;
      if (!n) return;
      var maxV = a[0];
      for (var i = 1; i < n; i++) if (a[i] > maxV) maxV = a[i];

      for (var exp = 1; Math.floor(maxV / exp) > 0; exp *= 10) {
        var out = new Array(n);
        var count = [0,0,0,0,0,0,0,0,0,0];
        for (i = 0; i < n; i++) {
          var d = Math.floor(a[i] / exp) % 10;
          count[d] += 1;
        }
        for (i = 1; i < 10; i++) count[i] += count[i - 1];
        for (i = n - 1; i >= 0; i--) {
          d = Math.floor(a[i] / exp) % 10;
          var p = count[d] - 1;
          out[p] = a[i];
          count[d] -= 1;
        }
        for (i = 0; i < n; i++) {
          a[i] = out[i];
          pushWrite(i, out[i]);
        }
      }
    }

    function buildOps() {
      ops = [];
      var base = baseArray.slice();
      if (algo.value === "bubble") buildBubble(base);
      else if (algo.value === "selection") buildSelection(base);
      else if (algo.value === "merge") buildMerge(base);
      else if (algo.value === "quick") buildQuick(base);
      else if (algo.value === "heap") buildHeap(base);
      else if (algo.value === "counting") buildCounting(base);
      else if (algo.value === "radix") buildRadix(base);
      else buildInsertion(base);
      opIndex = 0;
    }

    function applyOp(op) {
      if (!op) return;
      if (op.t === "c") {
        compareCount++;
        activeA = op.a;
        activeB = op.b;
      } else if (op.t === "s") {
        writeCount += 2;
        activeA = op.a;
        activeB = op.b;
        var t = liveArray[op.a];
        liveArray[op.a] = liveArray[op.b];
        liveArray[op.b] = t;
      } else if (op.t === "w") {
        writeCount++;
        activeA = op.i;
        activeB = -1;
        liveArray[op.i] = op.v;
      } else if (op.t === "p") {
        activePivot = op.i;
      }
    }

    function draw() {
      var w = canvas.width;
      var h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      var grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(6, 24, 46, 0.95)");
      grad.addColorStop(1, "rgba(4, 12, 26, 0.98)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      var n = liveArray.length;
      if (!n) return;
      var maxV = 1;
      for (var i = 0; i < n; i++) if (liveArray[i] > maxV) maxV = liveArray[i];
      var gap = n > 90 ? 1 : 1.8;
      var barW = Math.max(1, (w - (n + 1) * gap) / n);

      for (var x = 0; x < n; x++) {
        var ratio = liveArray[x] / maxV;
        var bh = clamp(ratio * (h - 28), 2, h - 24);
        var bx = gap + x * (barW + gap);
        var by = h - bh - 8;

        var color = "rgba(125, 211, 252, 0.9)";
        if (done) color = "rgba(74, 222, 128, 0.9)";
        if (x === activePivot) color = "rgba(251, 146, 60, 0.95)";
        if (x === activeA || x === activeB) color = "rgba(248, 113, 113, 0.95)";

        ctx.fillStyle = color;
        ctx.fillRect(bx, by, barW, bh);
      }

      comparisons.textContent = String(compareCount);
      writes.textContent = String(writeCount);
    }

    function stepLoop() {
      if (!running) return;
      var steps = parseInt(speed.value, 10) || 42;
      speedValue.textContent = String(steps);
      for (var s = 0; s < steps && opIndex < ops.length; s++) {
        applyOp(ops[opIndex]);
        opIndex++;
      }
      draw();
      if (opIndex >= ops.length) {
        running = false;
        done = true;
        activeA = -1;
        activeB = -1;
        activePivot = -1;
        draw();
        status.textContent = "Completed: " + (algo.options[algo.selectedIndex] ? algo.options[algo.selectedIndex].textContent : "Sort") + " sorted " + liveArray.length + " elements with " + compareCount + " comparisons and " + writeCount + " writes.";
        runBtn.textContent = "Run Again";
        return;
      }
      rafId = window.requestAnimationFrame(stepLoop);
    }

    function cancelRun() {
      running = false;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function startRun() {
      cancelRun();
      liveArray = baseArray.slice();
      compareCount = 0;
      writeCount = 0;
      activeA = -1;
      activeB = -1;
      activePivot = -1;
      done = false;
      buildOps();
      runBtn.textContent = "Running...";
      running = true;
      status.textContent = "Sorting in progress: " + (algo.options[algo.selectedIndex] ? algo.options[algo.selectedIndex].textContent : "Algorithm") + " on " + liveArray.length + " items.";
      stepLoop();
    }

    runBtn.addEventListener("click", startRun);
    shuffleBtn.addEventListener("click", function() {
      cancelRun();
      resetDataset();
      runBtn.textContent = "Run Sort";
    });
    algo.addEventListener("change", function() {
      cancelRun();
      setMeta();
      resetDataset();
      runBtn.textContent = "Run Sort";
    });
    pattern.addEventListener("change", function() {
      cancelRun();
      resetDataset();
      runBtn.textContent = "Run Sort";
    });
    size.addEventListener("input", function() {
      cancelRun();
      sizeValue.textContent = size.value;
      resetDataset();
      runBtn.textContent = "Run Sort";
    });
    speed.addEventListener("input", function() {
      speedValue.textContent = speed.value;
    });

    window.addEventListener("beforeunload", cancelRun);
    window.addEventListener("resize", resizeCanvas, { passive: true });

    setMeta();
    speedValue.textContent = speed.value;
    resetDataset();
    resizeCanvas();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupSortingLabDemo);
  } else {
    setupSortingLabDemo();
  }
})();
