(function () {
  "use strict";

  if (window.__PJT_MICROSPACE_INIT__) return;
  window.__PJT_MICROSPACE_INIT__ = true;

  var roomId = buildRoomId();
  var me = getOrCreatePersona();
  var refreshHandle = 0;

  function buildRoomId() {
    var host = (window.location.hostname || "site").replace(/[^a-z0-9-]/gi, "-");
    var path = (window.location.pathname || "/")
      .toLowerCase()
      .replace(/[^a-z0-9/]/gi, "")
      .replace(/\/+$/g, "") || "/";
    var slug = path.replace(/\//g, "-").replace(/^-+|-+$/g, "") || "home";
    return "pjt-microspace-" + host + "-" + slug;
  }

  function getOrCreatePersona() {
    var key = "pjt-microspace-persona-v1";
    try {
      var existing = sessionStorage.getItem(key);
      if (existing) {
        var parsed = JSON.parse(existing);
        if (parsed && parsed.id && parsed.emoji && parsed.color) {
          return parsed;
        }
      }
    } catch (_err) {
      // Ignore session storage read failures.
    }

    var emojis = ["🛰️", "🧠", "⚡", "🌐", "🛡️", "🤖", "🧭", "💡", "🧪", "🧬"];
    var colors = [
      "#22d3ee",
      "#38bdf8",
      "#34d399",
      "#f59e0b",
      "#f97316",
      "#f43f5e",
      "#a78bfa",
      "#60a5fa",
      "#14b8a6",
      "#10b981"
    ];

    var id = "v-" + Math.random().toString(36).slice(2, 10);
    var persona = {
      id: id,
      name: "Guest " + id.slice(-4).toUpperCase(),
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      color: colors[Math.floor(Math.random() * colors.length)]
    };

    try {
      sessionStorage.setItem(key, JSON.stringify(persona));
    } catch (_err2) {
      // Ignore session storage write failures.
    }

    return persona;
  }

  function mountNavPresence() {
    var existing = document.getElementById("microspace-nav-presence");
    if (existing) return existing;

    var nav = document.querySelector(".nav.navbar-nav.navbar-right");
    if (!nav) return null;

    var li = document.createElement("li");
    li.className = "microspace_nav_presence is-hidden";
    li.setAttribute("id", "microspace-nav-presence");
    li.setAttribute("title", "Live visitors");
    li.innerHTML = '<div id="microspace-nav-stack" class="microspace_nav_stack" aria-live="polite"></div>';
    nav.appendChild(li);
    return li;
  }

  function publishPresence(awareness) {
    awareness.setLocalStateField("visitor", {
      id: me.id,
      emoji: me.emoji,
      color: me.color,
      lastSeen: Date.now()
    });
  }

  function createAvatar(visitor) {
    var bubble = document.createElement("span");
    bubble.className = "microspace_nav_avatar";
    bubble.style.setProperty("--avatar-accent", visitor.color || "#22d3ee");
    bubble.textContent = visitor.emoji || "🛰️";
    return bubble;
  }

  function createOverflowBubble(extraCount) {
    var bubble = document.createElement("span");
    bubble.className = "microspace_nav_avatar microspace_nav_overflow";
    bubble.textContent = "+" + extraCount;
    bubble.style.setProperty("--avatar-accent", "#2e7dc0");
    return bubble;
  }

  function renderVisitors(awareness) {
    var slot = document.getElementById("microspace-nav-presence");
    var stack = document.getElementById("microspace-nav-stack");
    if (!slot || !stack) return;

    var others = [];
    awareness.getStates().forEach(function (state) {
      if (!state || !state.visitor) return;
      if (state.visitor.id === me.id) return;
      others.push(state.visitor);
    });

    if (!others.length) {
      slot.classList.add("is-hidden");
      stack.innerHTML = "";
      return;
    }

    slot.classList.remove("is-hidden");
    stack.innerHTML = "";

    var maxShown = 5;
    var shown = others.slice(0, maxShown);
    shown.forEach(function (visitor) {
      stack.appendChild(createAvatar(visitor));
    });

    var extra = others.length - shown.length;
    if (extra > 0) {
      stack.appendChild(createOverflowBubble(extra));
    }
  }

  function bindPresenceEvents(provider) {
    function queuePublish() {
      if (refreshHandle) return;
      refreshHandle = window.requestAnimationFrame(function () {
        refreshHandle = 0;
        publishPresence(provider.awareness);
      });
    }

    document.addEventListener("visibilitychange", queuePublish, { passive: true });
    window.addEventListener("pointerdown", queuePublish, { passive: true });
    window.addEventListener("keydown", queuePublish, { passive: true });

    window.setInterval(function () {
      publishPresence(provider.awareness);
    }, 20000);

    window.addEventListener("beforeunload", function () {
      provider.awareness.setLocalState(null);
    });
  }

  function startPresence() {
    if (!mountNavPresence()) return;

    if (
      navigator.connection &&
      (navigator.connection.saveData || /(^|\s)(slow-2g|2g)(\s|$)/.test(navigator.connection.effectiveType || ""))
    ) {
      return;
    }

    Promise.all([
      import("https://esm.sh/yjs@13.6.27"),
      import("https://esm.sh/y-webrtc@10.3.0")
    ])
      .then(function (mods) {
        var Y = mods[0];
        var WebrtcProvider = mods[1].WebrtcProvider;

        var doc = new Y.Doc();
        var provider = new WebrtcProvider(roomId, doc, {
          maxConns: 40,
          filterBcConns: true
        });

        bindPresenceEvents(provider);
        publishPresence(provider.awareness);
        renderVisitors(provider.awareness);

        provider.awareness.on("change", function () {
          renderVisitors(provider.awareness);
        });
      })
      .catch(function () {
        // Silently fail: navbar should remain clean when network blocks relay.
      });
  }

  function schedulePresenceStart() {
    function run() {
      if (document.hidden) {
        document.addEventListener(
          "visibilitychange",
          function onVisible() {
            if (document.hidden) return;
            document.removeEventListener("visibilitychange", onVisible);
            startPresence();
          },
          { once: true }
        );
        return;
      }
      startPresence();
    }

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(run, { timeout: 2200 });
      return;
    }

    window.setTimeout(run, 1400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedulePresenceStart);
  } else {
    schedulePresenceStart();
  }
})();
