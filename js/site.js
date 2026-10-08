/* ============================================================================
   site.js — Atmosphere, conversion, and marketing behaviours
   Runs after main.js (which exposes window.MTKCalc / window.MTKPricing).
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------------------
     1. Scroll reveals — CSS classes, IntersectionObserver triggers
     --------------------------------------------------------------------- */
  var REVEAL_SELECTOR = [
    ".section-header",
    ".about-feature-card",
    ".peak-card",
    ".route-showcase-card",
    ".bio-card",
    ".gallery-card",
    ".faq-item",
    ".testimonial-card",
    ".season-display-card",
    ".newsletter-band",
    ".trust-strip",
    ".calc-results-card",
    ".map-frame",
    ".gear-checklist",
    ".weather-badge"
  ].join(",");

  function initReveals() {
    var nodes = doc.querySelectorAll(REVEAL_SELECTOR);
    if (!nodes.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(nodes, function (n) { n.classList.add("reveal", "in-view"); });
      return;
    }

    Array.prototype.forEach.call(nodes, function (node, i) {
      node.classList.add("reveal");
      node.style.setProperty("--reveal-delay", ((i % 4) * 0.08).toFixed(2) + "s");
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }

  /* -----------------------------------------------------------------------
     2. Expedition progress bar — scroll percentage + altitude readout
     --------------------------------------------------------------------- */
  var GATE_ALT = 2600;      // Sirimon gate
  var SUMMIT_ALT = 5199;    // Batian
  var bar = doc.getElementById("expeditionProgress");
  var fill = doc.getElementById("xpFill");
  var elev = doc.getElementById("xpElevation");
  var stickyCta = doc.getElementById("stickyCta");
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || doc.documentElement.scrollTop;
    var h = doc.documentElement.scrollHeight - window.innerHeight;
    var pct = h > 0 ? Math.min(100, Math.max(0, (y / h) * 100)) : 0;

    if (bar) {
      bar.classList.toggle("visible", y > 420);
      if (fill) fill.style.width = pct.toFixed(1) + "%";
      if (elev) {
        var alt = Math.round(GATE_ALT + (SUMMIT_ALT - GATE_ALT) * (pct / 100));
        elev.textContent = "ELEV " + alt.toLocaleString("en-US") + "M";
      }
    }

    if (stickyCta) {
      var pastHero = y > window.innerHeight * 0.75;
      var nearFooter = (y + window.innerHeight) > (doc.documentElement.scrollHeight - 380);
      stickyCta.classList.toggle("visible", pastHero && !nearFooter);
    }
    ticking = false;
  }

  function requestScrollTick() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }

  /* -----------------------------------------------------------------------
     3. Sticky CTA mirrors the live calculator quote
     --------------------------------------------------------------------- */
  function money(n, cur) {
    var symbols = { USD: "$", EUR: "\u20ac", GBP: "\u00a3", KES: "KES " };
    var v = Math.round(n).toLocaleString("en-US");
    return (symbols[cur] || "") + (cur === "USD" || cur === "EUR" || cur === "GBP" ? "" : "") + v;
  }

  var stickyValue = doc.getElementById("stickyCtaValue");
  if (stickyValue) {
    doc.addEventListener("mtk:quote", function (e) {
      var d = e && e.detail;
      if (!d) return;
      var label = d.state.priceMode === "group" ? "group" : "pp";
      stickyValue.textContent = money(d.basis, d.currency) + " \u00b7 " + d.quote.days + "d \u00b7 " + label;
    });
  }

  /* -----------------------------------------------------------------------
     4. Newsletter + promo capture (client-side only, no backend)
     --------------------------------------------------------------------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function storeLead(kind, email) {
    try {
      var leads = JSON.parse(window.MTKStorage ? window.MTKStorage.get("mtkLeads", "[]") : "[]");
      if (!Array.isArray(leads)) leads = [];
      leads.push({ kind: kind, email: email, at: new Date().toISOString() });
      if (window.MTKStorage) window.MTKStorage.set("mtkLeads", JSON.stringify(leads.slice(-20)));
      return true;
    } catch (err) {
      return false;
    }
  }

  function wireLeadForm(formId, inputId, statusId, kind) {
    var form = doc.getElementById(formId);
    if (!form) return;
    var input = doc.getElementById(inputId);
    var status = doc.getElementById(statusId);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (input && input.value || "").trim();
      if (!EMAIL_RE.test(email)) {
        if (status) { status.style.color = "var(--accent-crimson)"; status.textContent = "Enter a valid email address."; }
        if (input) input.focus();
        return;
      }
      storeLead(kind, email);
      if (status) { status.style.color = "var(--accent-emerald)"; status.textContent = "Confirmed \u2014 check your inbox for the brief."; }
      form.reset();
      try {
        if (window.MTKStorage) window.MTKStorage.set(kind === "promo" ? "mtkPromoSeen" : "mtkSubscribed", "1");
      } catch (err) { /* ignore */ }
      if (kind === "promo") setTimeout(closePromo, 1600);
    });
  }

  wireLeadForm("newsletterForm", "newsletterEmail", "newsletterStatus", "newsletter");
  wireLeadForm("promoForm", "promoEmail", "promoStatus", "promo");

  /* -----------------------------------------------------------------------
     5. Exit-intent promo — once per session, after real engagement
     --------------------------------------------------------------------- */
  var promo = doc.getElementById("promoModal");
  var promoClose = doc.getElementById("promoCloseBtn");
  var promoShown = false;

  function wasPromoSeen() {
    try { return sessionStorage.getItem("mtkPromoSeen") === "1"; } catch (err) { return false; }
  }

  function openPromo() {
    if (!promo || promoShown || wasPromoSeen()) return;
    promoShown = true;
    promo.classList.add("active");
    doc.body.style.overflow = "hidden";
    try { sessionStorage.setItem("mtkPromoSeen", "1"); } catch (err) { /* ignore */ }
  }

  function closePromo() {
    if (!promo) return;
    promo.classList.remove("active");
    doc.body.style.overflow = "";
  }

  if (promoClose) promoClose.addEventListener("click", closePromo);
  if (promo) {
    promo.addEventListener("click", function (e) { if (e.target === promo) closePromo(); });
  }

  var engaged = false;
  window.addEventListener("scroll", function () {
    if (!engaged && (window.pageYOffset || 0) > window.innerHeight * 0.9) engaged = true;
  }, { passive: true });

  doc.addEventListener("mouseout", function (e) {
    if (!e.relatedTarget && e.clientY <= 8) {
      if (engaged) openPromo();
    }
  });

  // Touch fallback: dwell 55s while engaged
  setTimeout(function () { if (engaged) openPromo(); }, 55000);

  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closePromo();
  });

  /* -----------------------------------------------------------------------
     6. Boot
     --------------------------------------------------------------------- */
  function boot() {
    initReveals();
    onScroll();
    window.addEventListener("scroll", requestScrollTick, { passive: true });
    window.addEventListener("resize", requestScrollTick, { passive: true });
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
