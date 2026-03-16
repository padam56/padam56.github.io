(function() {
  "use strict";

  var STORAGE_KEY = "portfolio-theme";

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    var body = document.body;
    if (!body) return;

    body.classList.remove("theme-dark", "theme-light");
    body.classList.add(theme === "light" ? "theme-light" : "theme-dark");

    var metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", theme === "light" ? "#eef3fa" : "#0b1220");
    }

    var toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) {
      toggleBtn.innerHTML = theme === "light"
        ? '<i class="fa fa-moon-o" aria-hidden="true"></i>'
        : '<i class="fa fa-sun-o" aria-hidden="true"></i>';
      toggleBtn.setAttribute("aria-label", theme === "light" ? "Switch to dark mode" : "Switch to light mode");
      toggleBtn.setAttribute("title", theme === "light" ? "Dark mode" : "Light mode");
    }

    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme } }));
  }

  function init() {
    var storedTheme = localStorage.getItem(STORAGE_KEY);
    var activeTheme = storedTheme || getSystemTheme();

    applyTheme(activeTheme);

    var toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", function() {
        var isDark = document.body.classList.contains("theme-dark");
        var nextTheme = isDark ? "light" : "dark";
        localStorage.setItem(STORAGE_KEY, nextTheme);
        applyTheme(nextTheme);
      });
    }

    var mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", function() {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(getSystemTheme());
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
