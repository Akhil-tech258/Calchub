/* ============================================================
   CalcHub — Premium ambient UI layer
   Adds: animated circuit/particle background, drifting gradient
   blobs, scroll-reveal, stat count-up, sticky navbar shadow,
   mobile menu open animation hook.
   This file is purely additive: it never reads or writes
   calculator state, and never redefines an existing global.
   All motion uses transform/opacity and requestAnimationFrame.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Ambient background: blobs + canvas circuit ---------------- */
  function injectBackground() {
    if (document.querySelector(".bg-blob-field")) return;

    var vignette = document.createElement("div");
    vignette.className = "bg-vignette";
    vignette.setAttribute("aria-hidden", "true");
    document.body.prepend(vignette);

    var field = document.createElement("div");
    field.className = "bg-blob-field";
    field.setAttribute("aria-hidden", "true");
    field.innerHTML = '<div class="bg-blob b1"></div><div class="bg-blob b2"></div><div class="bg-blob b3"></div>';
    document.body.prepend(field);

    var canvas = document.createElement("canvas");
    canvas.className = "bg-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);

    if (reduceMotion) return; // keep static blobs, skip animation loops

    animateBlobs(field.querySelectorAll(".bg-blob"));
    animateCanvas(canvas);
  }

  function animateBlobs(blobs) {
    var start = performance.now();
    var params = Array.prototype.map.call(blobs, function (_, i) {
      return { speed: 0.00012 + i * 0.00004, radius: 40 + i * 18, phase: i * 2.1 };
    });
    function tick(now) {
      var t = now - start;
      blobs.forEach(function (blob, i) {
        var p = params[i];
        var x = Math.sin(t * p.speed + p.phase) * p.radius;
        var y = Math.cos(t * p.speed * 0.8 + p.phase) * p.radius;
        blob.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function animateCanvas(canvas) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w, h, nodes = [];
    var mouse = { x: -9999, y: -9999 };
    var NODE_COUNT = window.innerWidth < 720 ? 34 : 64;
    var LINK_DIST = window.innerWidth < 720 ? 110 : 150;

    function isDark() {
      return document.documentElement.getAttribute("data-theme") === "dark" ||
        (!document.documentElement.hasAttribute("data-theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    function resize() {
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }

    function makeNodes() {
      nodes = [];
      for (var i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.15 * dpr,
          vy: (Math.random() - 0.5) * 0.15 * dpr
        });
      }
    }

    resize();
    makeNodes();
    window.addEventListener("resize", function () {
      resize();
      makeNodes();
    });
    window.addEventListener("mousemove", function (e) {
      mouse.x = e.clientX * dpr;
      mouse.y = e.clientY * dpr;
    });
    window.addEventListener("mouseleave", function () {
      mouse.x = -9999; mouse.y = -9999;
    });

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var dark = isDark();
      var dotColor = dark ? "rgba(140,123,255,0.55)" : "rgba(108,92,231,0.35)";
      var lineColor = dark ? "rgba(47,235,209," : "rgba(0,194,168,";

      nodes.forEach(function (n) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        var dx = mouse.x - n.x, dy = mouse.y - n.y;
        var mdist = Math.sqrt(dx * dx + dy * dy);
        if (mdist < 160 * dpr) {
          n.x -= dx * 0.0012;
          n.y -= dy * 0.0012;
        }
      });

      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST * dpr) {
            var alpha = (1 - dist / (LINK_DIST * dpr)) * 0.5;
            ctx.strokeStyle = lineColor + alpha.toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = dotColor;
      nodes.forEach(function (n) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.6 * dpr, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ---------------- Scroll reveal ---------------- */
  function initScrollReveal() {
    var targets = document.querySelectorAll(
      ".section, .calc-panel, .cta-band, .feature-card, .category-card, .calc-card, .glass"
    );
    if (!targets.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );

    targets.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(i % 6, 5) * 0.06 + "s";
      io.observe(el);
    });
  }

  /* ---------------- Stat count-up ---------------- */
  function initCounters() {
    var stats = document.querySelectorAll(".hero-stat strong, .stat-number");
    if (!stats.length || reduceMotion) return;

    stats.forEach(function (el) {
      var raw = el.textContent.trim();
      var match = raw.match(/^(\d+)(.*)$/);
      if (!match) return;
      var target = parseInt(match[1], 10);
      var suffix = match[2] || "";
      if (!("IntersectionObserver" in window)) { return; }

      var done = false;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !done) {
            done = true;
            var startTime = performance.now();
            var duration = 900;
            function step(now) {
              var progress = Math.min((now - startTime) / duration, 1);
              var eased = 1 - Math.pow(1 - progress, 3);
              el.textContent = Math.round(target * eased) + suffix;
              if (progress < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
            io.unobserve(el);
          }
        });
      }, { threshold: 0.6 });
      io.observe(el);
    });
  }

  /* ---------------- Sticky navbar shadow on scroll ---------------- */
  function initNavbarScroll() {
    var nav = document.querySelector(".navbar");
    if (!nav) return;
    var ticking = false;
    function update() {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    });
    update();
  }

  /* ---------------- Mobile menu icon swap (visual only) ---------------- */
  function initMenuIconSwap() {
    var toggle = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      var open = links.classList.contains("is-open");
      toggle.textContent = open ? "✕" : "☰";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    injectBackground();
    initScrollReveal();
    initCounters();
    initNavbarScroll();
    initMenuIconSwap();
  });
})();
