/* Instant calculator search with keyboard navigation */
(function () {
  function initSearch(inputEl, resultsEl, opts = {}) {
    if (!inputEl || !resultsEl) return;
    const maxResults = opts.maxResults || 8;
    let activeIndex = -1;

    function render(query) {
      const q = query.trim().toLowerCase();
      resultsEl.innerHTML = "";
      if (!q) { resultsEl.classList.remove("is-open"); return; }

      const matches = CALCULATORS.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      ).slice(0, maxResults);

      if (!matches.length) {
        resultsEl.innerHTML = `<div class="search-empty">No calculators found for "${escapeHtml(query)}"</div>`;
        resultsEl.classList.add("is-open");
        return;
      }

      matches.forEach((c, i) => {
        const a = document.createElement("a");
        a.href = `calculator.html?id=${c.id}`;
        a.className = "search-result";
        a.setAttribute("role", "option");
        a.innerHTML = `<span class="search-result-icon">${c.icon}</span>
          <span><span class="search-result-name">${escapeHtml(c.name)}</span>
          <span class="search-result-cat">${escapeHtml(catName(c.category))}</span></span>`;
        resultsEl.appendChild(a);
      });
      resultsEl.classList.add("is-open");
      activeIndex = -1;
    }

    function catName(id) {
      const cat = CATEGORIES.find(c => c.id === id);
      return cat ? cat.name : id;
    }

    function escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    inputEl.addEventListener("input", () => render(inputEl.value));
    inputEl.addEventListener("focus", () => { if (inputEl.value) render(inputEl.value); });

    inputEl.addEventListener("keydown", (e) => {
      const items = Array.from(resultsEl.querySelectorAll(".search-result"));
      if (!items.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        updateActive(items);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        updateActive(items);
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        items[activeIndex].click();
      } else if (e.key === "Escape") {
        resultsEl.classList.remove("is-open");
      }
    });

    function updateActive(items) {
      items.forEach((it, i) => it.classList.toggle("is-active", i === activeIndex));
      if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: "nearest" });
    }

    document.addEventListener("click", (e) => {
      if (!inputEl.contains(e.target) && !resultsEl.contains(e.target)) {
        resultsEl.classList.remove("is-open");
      }
    });
  }

  window.CalcHubSearch = { initSearch };
})();
