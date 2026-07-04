/* Homepage rendering logic */
(function () {
  const RECENT_KEY = "calchub-recent";
  const FAV_KEY = "calchub-favorites";

  const POPULAR_IDS = [
    "emi", "bmi", "percentage", "age", "gst", "cgpa", "compound-interest",
    "loan", "length-converter", "currency-converter", "scientific-calculator", "sip"
  ];

  function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; }
  }
  function getFavorites() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; }
  }
  function toggleFavorite(id) {
    let favs = getFavorites();
    if (favs.includes(id)) favs = favs.filter(f => f !== id);
    else favs.unshift(id);
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    return favs;
  }

  function calcCard(c) {
    const favs = getFavorites();
    const isFav = favs.includes(c.id);
    const card = document.createElement("a");
    card.href = `calculator.html?id=${c.id}`;
    card.className = "calc-card glass";
    card.innerHTML = `
      <button class="fav-btn ${isFav ? "is-fav" : ""}" data-fav-id="${c.id}" aria-label="Toggle favorite" title="Toggle favorite">${isFav ? "★" : "☆"}</button>
      <div class="calc-card-icon">${c.icon}</div>
      <h3>${c.name}</h3>
      <p>${c.description}</p>
      <span class="calc-card-tag">${(CATEGORIES.find(cat => cat.id === c.category) || {}).name || ""}</span>
    `;
    card.querySelector(".fav-btn").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(c.id);
      renderAll();
    });
    return card;
  }

  function renderGrid(containerId, calcList, emptyMsg) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = "";
    if (!calcList.length) {
      el.innerHTML = `<p class="empty-state">${emptyMsg}</p>`;
      return;
    }
    calcList.forEach(c => el.appendChild(calcCard(c)));
  }

  function renderCategories() {
    const el = document.getElementById("categoriesGrid");
    if (!el) return;
    el.innerHTML = "";
    CATEGORIES.forEach(cat => {
      const count = getCalculatorsByCategory(cat.id).length;
      const card = document.createElement("a");
      card.href = `category.html?cat=${cat.id}`;
      card.className = "category-card glass";
      card.innerHTML = `<div class="category-icon">${cat.icon}</div><h3>${cat.name}</h3><span>${count} calculators</span>`;
      el.appendChild(card);
    });
  }

  function renderAll() {
    renderCategories();
    const popular = POPULAR_IDS.map(id => CALC_BY_ID[id]).filter(Boolean);
    renderGrid("popularGrid", popular, "No popular calculators yet.");

    const recentIds = getRecent();
    const recent = recentIds.map(id => CALC_BY_ID[id]).filter(Boolean);
    renderGrid("recentGrid", recent, "Calculators you use will show up here.");

    const favIds = getFavorites();
    const favs = favIds.map(id => CALC_BY_ID[id]).filter(Boolean);
    const favSection = document.getElementById("favoritesSection");
    if (favSection) favSection.style.display = favs.length ? "" : "none";
    renderGrid("favoritesGrid", favs, "");

    const trending = [...CALCULATORS].slice(0, 8);
    renderGrid("trendingGrid", trending.sort(() => 0.5 - Math.random()).slice(0, 6), "");

    const totalEl = document.getElementById("totalCalcCount");
    if (totalEl) totalEl.textContent = CALCULATORS.length + "+";
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderAll();
    const searchInput = document.getElementById("heroSearchInput");
    const searchResults = document.getElementById("heroSearchResults");
    if (window.CalcHubSearch) CalcHubSearch.initSearch(searchInput, searchResults);

    const navToggle = document.getElementById("navToggle");
    const navLinks = document.getElementById("navLinks");
    if (navToggle && navLinks) {
      navToggle.addEventListener("click", () => navLinks.classList.toggle("is-open"));
    }

    document.querySelectorAll(".faq-question").forEach(q => {
      q.addEventListener("click", () => {
        const item = q.closest(".faq-item");
        item.classList.toggle("is-open");
      });
    });
  });

  window.CalcHubApp = { getRecent, getFavorites, toggleFavorite, POPULAR_IDS };
})();
