(function() {
  "use strict";

  function scrollTopNow() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }

  try {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  } catch (_e) {
    // Ignore browser-level history restrictions.
  }

  function navigationType() {
    try {
      if (window.performance && typeof window.performance.getEntriesByType === "function") {
        var entries = window.performance.getEntriesByType("navigation");
        if (entries && entries[0] && entries[0].type) return entries[0].type;
      }

      if (window.performance && window.performance.navigation) {
        if (window.performance.navigation.type === 1) return "reload";
        if (window.performance.navigation.type === 2) return "back_forward";
      }
    } catch (_e) {
      // Ignore unsupported performance APIs.
    }

    return "";
  }

  var navType = navigationType();
  if (navType === "reload" || navType === "back_forward") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", scrollTopNow, { once: true });
    } else {
      scrollTopNow();
    }
    window.setTimeout(scrollTopNow, 0);
  }

  window.addEventListener("pageshow", function(evt) {
    if (evt && evt.persisted) scrollTopNow();
  }, { passive: true });

  var coarsePointer = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  if (!coarsePointer) return;

  var touchStartY = 0;
  document.addEventListener("touchstart", function(evt) {
    if (!evt.touches || !evt.touches.length) return;
    touchStartY = evt.touches[0].clientY;
  }, { passive: true });

  document.addEventListener("touchmove", function(evt) {
    if (!evt.touches || !evt.touches.length) return;

    var currentY = evt.touches[0].clientY;
    var pullingDown = (currentY - touchStartY) > 10;
    var topPos = window.pageYOffset || window.scrollY || document.documentElement.scrollTop || 0;
    var atTop = topPos <= 0;

    if (atTop && pullingDown) {
      evt.preventDefault();
    }
  }, { passive: false });
})();
