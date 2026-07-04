/* Renders a single calculator based on ?id= in the URL, handles compute, copy, reset, share, print, favorites, recent history, keyboard shortcuts */
(function () {
  const RECENT_KEY = "calchub-recent";
  const FAV_KEY = "calchub-favorites";

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function pushRecent(id) {
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch {}
    recent = recent.filter(r => r !== id);
    recent.unshift(id);
    recent = recent.slice(0, 12);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  }

  function getFavorites() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; }
  }
  function toggleFavorite(id) {
    let favs = getFavorites();
    if (favs.includes(id)) favs = favs.filter(f => f !== id);
    else favs.unshift(id);
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    return favs.includes(id);
  }

  function buildInputField(input) {
    const wrap = document.createElement("div");
    wrap.className = "field";
    const label = document.createElement("label");
    label.setAttribute("for", "field-" + input.id);
    label.textContent = input.label;
    wrap.appendChild(label);

    let el;
    if (input.type === "select") {
      el = document.createElement("select");
      input.options.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt; o.textContent = opt;
        el.appendChild(o);
      });
    } else {
      el = document.createElement("input");
      el.type = input.type || "text";
      if (input.placeholder) el.placeholder = input.placeholder;
      if (input.type === "number") el.step = "any";
    }
    el.id = "field-" + input.id;
    el.name = input.id;
    el.setAttribute("aria-label", input.label);
    wrap.appendChild(el);
    return wrap;
  }

  function readValues(calc) {
    const values = {};
    calc.inputs.forEach(inp => {
      const el = document.getElementById("field-" + inp.id);
      values[inp.id] = el ? el.value : "";
    });
    return values;
  }

  function renderResults(container, rows) {
    container.innerHTML = "";
    if (!rows || !rows.length) {
      container.innerHTML = `<p class="result-placeholder">Enter values above and results will appear here instantly.</p>`;
      return;
    }
    rows.forEach(row => {
      const r = document.createElement("div");
      r.className = "result-row";
      r.innerHTML = `<span class="result-label">${row.label}</span><span class="result-value">${row.value}</span>`;
      container.appendChild(r);
    });
  }

  function init() {
    const id = getParam("id");
    const calc = CALC_BY_ID[id];
    const root = document.getElementById("calculatorRoot");
    if (!calc) {
      root.innerHTML = `<div class="glass calc-panel">
        <h1>Calculator not found</h1>
        <p>We couldn't find that calculator. <a href="index.html">Browse all calculators</a>.</p>
      </div>`;
      return;
    }

    pushRecent(calc.id);
    document.title = `${calc.name} — CalcHub`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", calc.description);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", `${calc.name} — CalcHub`);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", calc.description);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", `https://calchub.example.com/calculator.html?id=${calc.id}`);

    const jsonLd = document.getElementById("jsonLd");
    if (jsonLd) {
      jsonLd.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": calc.name,
        "applicationCategory": "UtilitiesApplication",
        "description": calc.description,
        "operatingSystem": "Any",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
      });
    }

    const favActive = getFavorites().includes(calc.id);

    root.innerHTML = "";
    const panel = document.createElement("div");
    panel.className = "glass calc-panel";
    panel.innerHTML = `
      <div class="calc-header">
        <div>
          <span class="calc-breadcrumb"><a href="index.html">CalcHub</a> / <a href="category.html?cat=${calc.category}">${(CATEGORIES.find(c=>c.id===calc.category)||{}).name||""}</a></span>
          <h1>${calc.icon} ${calc.name}</h1>
          <p class="calc-desc">${calc.description}</p>
        </div>
        <button class="fav-btn-lg ${favActive ? "is-fav" : ""}" id="favToggle" aria-label="Toggle favorite">${favActive ? "★" : "☆"}</button>
      </div>
      <form id="calcForm" class="calc-form" autocomplete="off"></form>
      <div class="calc-actions">
        <button type="button" class="btn btn-primary" id="calcBtn">Calculate</button>
        <button type="button" class="btn btn-ghost" id="resetBtn">Reset</button>
        <button type="button" class="btn btn-ghost" id="copyBtn">Copy result</button>
        <button type="button" class="btn btn-ghost" id="shareBtn">Share</button>
        <button type="button" class="btn btn-ghost" id="printBtn">Print</button>
      </div>
      <div class="result-panel" id="resultPanel"></div>
    `;
    root.appendChild(panel);

    const form = panel.querySelector("#calcForm");
    calc.inputs.forEach(inp => form.appendChild(buildInputField(inp)));
    const resultPanel = panel.querySelector("#resultPanel");
    renderResults(resultPanel, null);

    function runCalc() {
      const values = readValues(calc);
      const rows = calc.compute(values);
      renderResults(resultPanel, rows);
    }

    form.addEventListener("input", runCalc);
    form.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); runCalc(); } });
    panel.querySelector("#calcBtn").addEventListener("click", runCalc);
    if (calc.inputs.length === 0) runCalc();

    panel.querySelector("#resetBtn").addEventListener("click", () => {
      form.reset();
      renderResults(resultPanel, null);
    });

    panel.querySelector("#copyBtn").addEventListener("click", async () => {
      const text = Array.from(resultPanel.querySelectorAll(".result-row"))
        .map(r => `${r.querySelector(".result-label").textContent}: ${r.querySelector(".result-value").textContent}`)
        .join("\n");
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        flashButton(panel.querySelector("#copyBtn"), "Copied!");
      } catch {
        flashButton(panel.querySelector("#copyBtn"), "Copy failed");
      }
    });

    panel.querySelector("#shareBtn").addEventListener("click", async () => {
      const url = window.location.href;
      if (navigator.share) {
        try { await navigator.share({ title: calc.name, url }); } catch {}
      } else {
        try {
          await navigator.clipboard.writeText(url);
          flashButton(panel.querySelector("#shareBtn"), "Link copied!");
        } catch {}
      }
    });

    panel.querySelector("#printBtn").addEventListener("click", () => window.print());

    panel.querySelector("#favToggle").addEventListener("click", () => {
      const isFav = toggleFavorite(calc.id);
      const btn = panel.querySelector("#favToggle");
      btn.textContent = isFav ? "★" : "☆";
      btn.classList.toggle("is-fav", isFav);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { form.reset(); renderResults(resultPanel, null); }
    });

    renderRelated(calc);
  }

  function flashButton(btn, msg) {
    const original = btn.textContent;
    btn.textContent = msg;
    setTimeout(() => { btn.textContent = original; }, 1500);
  }

  function renderRelated(calc) {
    const el = document.getElementById("relatedGrid");
    if (!el) return;
    const related = getCalculatorsByCategory(calc.category).filter(c => c.id !== calc.id).slice(0, 6);
    el.innerHTML = "";
    related.forEach(c => {
      const a = document.createElement("a");
      a.href = `calculator.html?id=${c.id}`;
      a.className = "calc-card glass";
      a.innerHTML = `<div class="calc-card-icon">${c.icon}</div><h3>${c.name}</h3><p>${c.description}</p>`;
      el.appendChild(a);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
