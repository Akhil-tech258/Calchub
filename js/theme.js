/* Dark / Light theme handling, shared across all pages */
(function () {
  const STORAGE_KEY = "calchub-theme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btns = document.querySelectorAll("[data-theme-toggle]");
    btns.forEach(btn => {
      btn.setAttribute("aria-pressed", theme === "dark");
      btn.textContent = theme === "dark" ? "☀️" : "🌙";
    });
  }

  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  applyTheme(getPreferredTheme());

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getPreferredTheme());
    document.querySelectorAll("[data-theme-toggle]").forEach(btn => {
      btn.addEventListener("click", toggleTheme);
    });
  });

  window.CalcHubTheme = { toggleTheme, applyTheme, getPreferredTheme };
})();
