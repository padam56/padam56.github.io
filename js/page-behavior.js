(function() {
  "use strict";

  try {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  } catch (_e) {
    // Ignore browser-level history restrictions.
  }

  var coarsePointer = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  if (!coarsePointer) return;

  // Reduce browser-level pull-to-refresh behavior on touch devices.
  document.documentElement.style.overscrollBehaviorY = "none";
  if (document.body) document.body.style.overscrollBehaviorY = "none";

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
