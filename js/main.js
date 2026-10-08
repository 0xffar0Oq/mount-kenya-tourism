/**
 * Mount Kenya Expeditions & Ecotourism - Main Interactive Controller
 * Pure Vanilla JavaScript - High Performance, Zero Dependencies
 */

document.addEventListener("DOMContentLoaded", () => {
  // Clear any previously saved language preference to ensure pure English
  try {
    localStorage.removeItem("mtkenya_lang");
  } catch (e) {
    /* storage unavailable */
  }

  document.documentElement.lang = "en";

  // --- 1. Sticky Navigation & Mobile Drawer ---
  const header = document.querySelector(".site-header");
  const mobileToggle = document.querySelector(".mobile-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", () => {
      navMenu.classList.toggle("open");
      const isExpanded = navMenu.classList.contains("open");
      mobileToggle.setAttribute("aria-expanded", isExpanded);
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("open");
        mobileToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Storage that never throws (private mode / blocked cookies / file://)
  const safeStorage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : raw;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) { /* storage unavailable */ }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) { /* storage unavailable */ }
    }
  };
  window.MTKStorage = safeStorage;

  // Serve WebP where supported (static-safe: no build step needed)
  const SUPPORTS_WEBP = (() => {
    try {
      return document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0;
    } catch (e) {
      return false;
    }
  })();

  function imgPath(name) {
    return `assets/images/${name}.${SUPPORTS_WEBP ? "webp" : "jpg"}`;
  }

  // --- 2. Interactive Route Explorer ---
  const routesData = {
    sirimon: {
      name: "Sirimon Route",
      tagline: "The Gradual & Scenic Northwest Approach",
      badge: "Best for Acclimatization",
      image: "hero-peaks",
      summary: "Approaching from the drier northwest flank of Mount Kenya, Sirimon is widely regarded as the premier route for steady acclimatization. It passes through majestic yellowwood forests, giant bamboo belts, and the expansive Mackinder's Valley before reaching Shipton's Camp beneath the soaring north faces of Batian and Nelion.",
      duration: "4 - 5 Days",
      difficulty: "Moderate",
      startAlt: "2,650m (Sirimon Gate)",
      successRate: "94%",
      highlights: [
        "Old Moses Camp (3,300m) panoramic viewpoints",
        "Spectacular Mackinder's Valley with endemic Giant Senecios",
        "Shipton's Camp (4,200m) directly under Batian's vertical wall",
        "Direct pre-dawn summit assault to Point Lenana (4,985m)"
      ]
    },
    chogoria: {
      name: "Chogoria Route",
      tagline: "The Most Scenic & Dramatic Alpine Trek in East Africa",
      badge: "Most Breathtaking Scenery",
      image: "the-temple",
      summary: "Ascending from the eastern, lush rainforest slopes above Meru, the Chogoria route is universally praised as the most dramatically scenic trek on Mount Kenya. Highlights include the sheer volcanic cliffs of The Temple towering over Lake Michaelson, spectacular Vivienne Falls, and turquoise glacial tarns.",
      duration: "5 - 6 Days",
      difficulty: "Challenging / Scenic",
      startAlt: "2,950m (Chogoria Gate)",
      successRate: "92%",
      highlights: [
        "The Temple cliff precipice overlooking Lake Michaelson",
        "Gorges Valley glacial amphitheater and Vivienne Falls",
        "Minto's Camp & Hall Tarns alpine moorland plateau",
        "Unforgettable sunrise over the Indian Ocean horizon from Lenana"
      ]
    },
    naromoru: {
      name: "Naromoru Route",
      tagline: "The Classic & Fastest Route to Point Lenana",
      badge: "Fastest Mountain Approach",
      image: "gorges-valley",
      summary: "The Naromoru route approaches from the west through Nanyuki/Naromoru town. It is the quickest and most direct path to the peaks, traversing the famous 'Vertical Bog' before emerging into the Teleki Valley and Mackinder's Camp. It is frequently combined with Sirimon or Chogoria for an epic mountain traverse.",
      duration: "4 Days",
      difficulty: "Steep / Moderate",
      startAlt: "2,600m (Naromoru Gate)",
      successRate: "88%",
      highlights: [
        "Met Station (3,050m) through indigenous podocarpus forest",
        "The challenging Vertical Bog alpine ascent",
        "Teleki Valley and Mackinder's Camp (4,300m)",
        "Austrian Hut & Lewis Glacier moraine approach"
      ]
    },
    burguret: {
      name: "Burguret Route",
      tagline: "The Wild, Rugged Wilderness Expedition",
      badge: "Pure Wilderness & Solitude",
      image: "giant-groundsels",
      summary: "For experienced hikers seeking an untamed, crowd-free wilderness, Burguret hacks through dense bamboo jungles and rarely traversed alpine scrub. Rough trails and pristine camps provide unmatched wildlife solitude before linking into the Teleki Valley.",
      duration: "5 - 6 Days",
      difficulty: "Strenuous / Wild",
      startAlt: "2,500m (Mountain Rock)",
      successRate: "86%",
      highlights: [
        "Untamed trails and giant bamboo jungle canopy",
        "High chances of spotting colobus monkeys and forest elephants",
        "Kampi ya Machengeni and Highland Castle rock formations",
        "Exclusive backcountry camping far away from standard crowds"
      ]
    }
  };

  const routeTabBtns = document.querySelectorAll(".route-tab-btn");
  const routeNameEl = document.getElementById("routeName");
  const routeSummaryEl = document.getElementById("routeSummary");
  const routeBadgeEl = document.getElementById("routeBadge");
  const routeDurationEl = document.getElementById("routeDuration");
  const routeDifficultyEl = document.getElementById("routeDifficulty");
  const routeStartAltEl = document.getElementById("routeStartAlt");
  const routeSuccessEl = document.getElementById("routeSuccess");
  const routeHighlightsEl = document.getElementById("routeHighlights");
  const routeImgEl = document.getElementById("routeImg");

  routeTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      routeTabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const key = btn.getAttribute("data-route");
      const data = routesData[key];

      if (data) {
        if (routeNameEl) routeNameEl.textContent = data.name;
        if (routeSummaryEl) routeSummaryEl.textContent = data.summary;
        if (routeBadgeEl) routeBadgeEl.textContent = data.badge;
        if (routeDurationEl) routeDurationEl.textContent = data.duration;
        if (routeDifficultyEl) routeDifficultyEl.textContent = data.difficulty;
        if (routeStartAltEl) routeStartAltEl.textContent = data.startAlt;
        if (routeSuccessEl) routeSuccessEl.textContent = data.successRate;
        if (routeImgEl) {
          routeImgEl.src = imgPath(data.image);
          routeImgEl.alt = `${data.name} on Mount Kenya`;
        }
        if (routeHighlightsEl) {
          routeHighlightsEl.innerHTML = data.highlights
            .map((h) => `<li>${h}</li>`)
            .join("");
        }
      }
    });
  });

  // --- 3. Interactive Expedition Cost Estimator ---
  const calcState = {
    route: "sirimon-chogoria",
    duration: 5,
    tier: "standard",
    climbers: 2,
    month: "jan",
    currency: "USD",
    priceMode: "person"
  };

  const KWS_DAILY_USD = 75;
  const FALLBACK_FX = { USD: 1, KES: 129.5, EUR: 0.92, GBP: 0.79 };

  const TIER_RATES = {
    budget:   { daily: 140, base: 120, split: { guides: 0.44, lodging: 0.30, meals: 0.26 } },
    standard: { daily: 210, base: 180, split: { guides: 0.46, lodging: 0.30, meals: 0.24 } },
    luxury:   { daily: 360, base: 280, split: { guides: 0.50, lodging: 0.34, meals: 0.16 } }
  };

  const ROUTE_MULTIPLIERS = {
    sirimon: 1.0,
    chogoria: 1.08,
    naromoru: 0.95,
    "sirimon-chogoria": 1.15
  };

  const GROUP_DISCOUNT = {
    1: 1.25,
    2: 1.0,
    4: 0.88,
    6: 0.82
  };

  // Seasonal demand factors + human-readable notes (linked to the climate advisor)
  const SEASON_FACTORS = {
    jan: 1.05, feb: 1.08, mar: 1.0, apr: 0.88, may: 0.85, jun: 0.95,
    jul: 1.05, aug: 1.1, sep: 1.0, oct: 0.92, nov: 0.88, dec: 1.12
  };

  const SEASON_PRICING_NOTES = {
    jan: "Peak season (Jan–Mar) demand pricing +5% applied.",
    feb: "Driest month of the year — demand pricing +8% applied.",
    mar: "Shoulder season — standard rates apply.",
    apr: "Long rains (Apr–May): green-season savings −12% applied.",
    may: "Green season: lowest rates of the year, −15% applied.",
    jun: "Early dry season: standard rates apply.",
    jul: "Peak trekking window — demand pricing +5% applied.",
    aug: "High season (Aug): demand pricing +10% applied.",
    sep: "Consistent dry days — standard rates apply.",
    oct: "Early-October shoulder: savings −8% applied.",
    nov: "Short-rains shoulder: savings −12% applied.",
    dec: "Festive season (Dec): demand pricing +12% applied."
  };

  const fxRates = { ...FALLBACK_FX };
  let fxLive = false;

  function toCurrency(amountUSD, currency) {
    return amountUSD * (fxRates[currency] || 1);
  }

  function fmtNum(valueInCurrency, currency) {
    const zeroDecimals = currency === "KES" || currency === "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: zeroDecimals ? 0 : 2,
      minimumFractionDigits: 0
    }).format(valueInCurrency);
  }

  function money(amountUSD, currency) {
    return fmtNum(toCurrency(amountUSD, currency), currency);
  }

  /**
   * Single source of truth for expedition pricing.
   * Guarantees: KWS + guides + lodging + meals === perPerson, always.
   */
  function computeExpeditionQuote(state) {
    const days = Number(state.duration) || 5;
    const climbers = Number(state.climbers) || 1;
    const tier = TIER_RATES[state.tier] || TIER_RATES.standard;
    const routeMult = Object.prototype.hasOwnProperty.call(ROUTE_MULTIPLIERS, state.route)
      ? ROUTE_MULTIPLIERS[state.route] : 1;
    const seasonMult = SEASON_FACTORS[state.month] || 1;
    const groupMult = GROUP_DISCOUNT[climbers] || 1;

    // List price = operator cost x route x season (undiscounted)
    const listService = Math.round((tier.base + days * tier.daily) * routeMult * seasonMult);
    // Group discount applies to the service portion only, never to statutory KWS fees
    const service = Math.round(listService * groupMult);

    const guides = Math.round(service * tier.split.guides);
    const lodging = Math.round(service * tier.split.lodging);
    const meals = service - guides - lodging;

    const park = days * KWS_DAILY_USD;
    const perPerson = service + park;
    const groupTotal = perPerson * climbers;
    const listPerPerson = listService + park;

    return {
      days,
      climbers,
      tier: state.tier,
      route: state.route,
      month: state.month,
      park,
      service,
      guides,
      lodging,
      meals,
      perPerson,
      groupTotal,
      listPerPerson,
      savingsPerPerson: Math.max(listPerPerson - perPerson, 0),
      savingsGroup: Math.max((listPerPerson - perPerson) * climbers, 0),
      groupMult,
      seasonMult,
      routeMult
    };
  }

  // Expose the pricing engine to the checkout/payment module
  window.MTKPricing = {
    computeExpeditionQuote,
    money,
    TIER_RATES,
    ROUTE_MULTIPLIERS,
    GROUP_DISCOUNT,
    SEASON_FACTORS,
    FALLBACK_FX,
    getRates: () => fxRates,
    isLive: () => fxLive
  };

  const calcRouteBtns = document.querySelectorAll("[data-calc-route]");
  const calcDurationBtns = document.querySelectorAll("[data-calc-duration]");
  const calcTierBtns = document.querySelectorAll("[data-calc-tier]");
  const calcClimberBtns = document.querySelectorAll("[data-calc-climbers]");
  const calcMonthBtns = document.querySelectorAll("[data-calc-month]");
  const calcCurrencyBtns = document.querySelectorAll("[data-currency]");
  const calcModeBtns = document.querySelectorAll("[data-price-mode]");

  const calcPriceUsd = document.getElementById("calcPriceUsd");
  const calcPriceKes = document.getElementById("calcPriceKes");
  const calcPriceLead = document.getElementById("calcPriceLead");
  const calcFeeKws = document.getElementById("calcFeeKws");
  const calcFeeGuides = document.getElementById("calcFeeGuides");
  const calcFeeLodging = document.getElementById("calcFeeLodging");
  const calcFeeMeals = document.getElementById("calcFeeMeals");
  const calcFeeTotal = document.getElementById("calcFeeTotal");
  const calcTotalLabel = document.getElementById("calcTotalLabel");
  const calcSavingsBadge = document.getElementById("calcSavingsBadge");
  const calcSavingsText = document.getElementById("calcSavingsText");
  const calcSeasonNote = document.getElementById("calcSeasonNote");
  const calcFxNote = document.getElementById("calcFxNote");
  const fxLiveDot = document.getElementById("fxLiveDot");

  // Animate numeric price changes for a "live" feel
  const priceTweens = new WeakMap();
  function animateAmount(el, to, formatter) {
    if (!el) return;
    const prev = priceTweens.get(el);
    if (prev) cancelAnimationFrame(prev.raf);
    const from = Number(el.dataset.value || 0);
    if (!isFinite(from) || from === to) {
      el.dataset.value = to;
      el.textContent = formatter(to);
      return;
    }
    const start = performance.now();
    const dur = 450;
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      el.textContent = formatter(t === 1 ? to : current);
      if (t < 1) {
        priceTweens.set(el, { raf: requestAnimationFrame(tick) });
      } else {
        el.dataset.value = to;
        priceTweens.delete(el);
      }
    };
    priceTweens.set(el, { raf: requestAnimationFrame(tick) });
  }

  function updateCost() {
    const q = computeExpeditionQuote(calcState);
    const cur = calcState.currency;
    const rate = fxRates[cur] || 1;

    // Round each line in the display currency, then derive totals FROM those
    // lines so the breakdown always sums exactly to the headline figure.
    const lineUnit = [q.park, q.guides, q.lodging, q.meals].map((v) => Math.round(v * rate));
    const perPersonDisp = lineUnit.reduce((a, b) => a + b, 0);
    const factor = calcState.priceMode === "group" ? q.climbers : 1;
    const lines = lineUnit.map((v) => v * factor);
    const basisDisp = perPersonDisp * factor;
    const other = cur === "USD" ? "KES" : "USD";
    const fmt = (n) => fmtNum(n, cur);

    if (calcPriceLead) {
      calcPriceLead.textContent = calcState.priceMode === "group"
        ? `Estimated Group Total (${q.climbers} trekkers)`
        : "Estimated Price Per Person";
    }

    animateAmount(calcPriceUsd, basisDisp, fmt);
    if (calcPriceKes) {
      calcPriceKes.textContent = `≈ ${money(basisDisp / rate, other)} · ${q.days}-day ${q.tier} package`;
    }

    if (calcFeeKws) calcFeeKws.textContent = fmt(lines[0]);
    if (calcFeeGuides) calcFeeGuides.textContent = fmt(lines[1]);
    if (calcFeeLodging) calcFeeLodging.textContent = fmt(lines[2]);
    if (calcFeeMeals) calcFeeMeals.textContent = fmt(lines[3]);
    if (calcFeeTotal) calcFeeTotal.textContent = fmt(basisDisp);
    if (calcTotalLabel) {
      calcTotalLabel.textContent = calcState.priceMode === "group"
        ? `Group total (${q.climbers} × ${fmt(perPersonDisp)})`
        : "Total per person";
    }

    if (calcSavingsBadge && calcSavingsText) {
      const saveUsd = (q.listPerPerson - q.perPerson) * (calcState.priceMode === "group" ? q.climbers : 1);
      const save = Math.round(saveUsd * rate);
      if (save > 0) {
        calcSavingsBadge.hidden = false;
        calcSavingsText.textContent = `You save ${fmt(save)} vs. solo list price`;
      } else if (q.groupMult > 1) {
        calcSavingsBadge.hidden = false;
        calcSavingsText.textContent = `Solo traveler rate — ${fmt(Math.round((q.perPerson - q.listPerPerson) * rate))} above duo pricing`;
      } else {
        calcSavingsBadge.hidden = true;
      }
    }

    if (calcSeasonNote) calcSeasonNote.textContent = SEASON_PRICING_NOTES[calcState.month] || "";
    if (calcFxNote) {
      calcFxNote.textContent = fxLive
        ? `Live mid-market rate · 1 USD = ${fxRates.KES.toFixed(2)} KES`
        : `Indicative rate · 1 USD = ${fxRates.KES.toFixed(1)} KES`;
    }
    if (fxLiveDot) fxLiveDot.classList.toggle("live", fxLive);

    document.dispatchEvent(new CustomEvent("mtk:quote", {
      detail: { quote: q, state: { ...calcState }, basis: basisDisp, perPerson: perPersonDisp, currency: cur }
    }));
  }

  // Live FX conversion (graceful fallback keeps the site fully static-safe)
  function loadFxRates() {
    if (typeof fetch !== "function") return;
    fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fx failed"))))
      .then((data) => {
        if (!data || !data.rates) return;
        ["KES", "EUR", "GBP"].forEach((c) => {
          if (typeof data.rates[c] === "number") fxRates[c] = data.rates[c];
        });
        fxLive = true;
        updateCost();
        document.dispatchEvent(new CustomEvent("mtk:fx", { detail: fxRates }));
      })
      .catch(() => { fxLive = false; });
  }

  function setupFilterGroup(nodeList, dataKey, parser = (v) => v) {
    // data-calc-route -> state.route, data-calc-tier -> state.tier, ...
    const stateKey = dataKey.replace(/^calc(.)/, (_, c) => c.toLowerCase());
    nodeList.forEach((btn) => {
      btn.addEventListener("click", () => {
        nodeList.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        calcState[stateKey] = parser(btn.dataset[dataKey]);
        if (stateKey === "month" && window.MTKSeasons) {
          window.MTKSeasons.setSeason(calcState.month, true);
        }
        updateCost();
      });
    });
  }

  setupFilterGroup(calcRouteBtns, "calcRoute", (v) => v);
  setupFilterGroup(calcDurationBtns, "calcDuration", (v) => parseInt(v, 10));
  setupFilterGroup(calcTierBtns, "calcTier", (v) => v);
  setupFilterGroup(calcClimberBtns, "calcClimbers", (v) => parseInt(v, 10));
  setupFilterGroup(calcMonthBtns, "calcMonth", (v) => v);

  calcCurrencyBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      calcCurrencyBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      calcState.currency = btn.dataset.currency;
      updateCost();
    });
  });

  calcModeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      calcModeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      calcState.priceMode = btn.dataset.priceMode;
      updateCost();
    });
  });

  // Default the travel month to the visitor's current month
  (function initMonth() {
    const monthKeys = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    const current = monthKeys[new Date().getMonth()];
    calcState.month = current;
    calcMonthBtns.forEach((b) => b.classList.toggle("active", b.dataset.calcMonth === current));
  })();

  updateCost();
  loadFxRates();

  window.MTKCalc = {
    state: calcState,
    update: updateCost,
    quote: () => computeExpeditionQuote(calcState),
    setMonth: (m) => {
      calcState.month = m;
      calcMonthBtns.forEach((b) => b.classList.toggle("active", b.dataset.calcMonth === m));
      updateCost();
    },
    set: (patch) => {
      Object.assign(calcState, patch);
      calcRouteBtns.forEach((b) => b.classList.toggle("active", b.dataset.calcRoute === calcState.route));
      calcDurationBtns.forEach((b) => b.classList.toggle("active", Number(b.dataset.calcDuration) === Number(calcState.duration)));
      calcTierBtns.forEach((b) => b.classList.toggle("active", b.dataset.calcTier === calcState.tier));
      calcClimberBtns.forEach((b) => b.classList.toggle("active", Number(b.dataset.calcClimbers) === Number(calcState.climbers)));
      updateCost();
    }
  };

  window.MTKMoney = {
    fmtNum,
    money,
    toCurrency,
    get rates() { return { ...fxRates }; },
    get live() { return fxLive; },
    setRates(next) { Object.assign(fxRates, next || {}); }
  };

  const btnBookEstimate = document.getElementById("btnBookEstimate");
  if (btnBookEstimate) {
    btnBookEstimate.addEventListener("click", () => {
      openBookingModal();
      const modalRouteSelect = document.getElementById("modalRoute");
      if (modalRouteSelect) {
        if (calcState.route.includes("chogoria") && calcState.route.includes("sirimon")) {
          modalRouteSelect.value = "traverse";
        } else if (calcState.route.includes("chogoria")) {
          modalRouteSelect.value = "chogoria";
        } else if (calcState.route.includes("sirimon")) {
          modalRouteSelect.value = "sirimon";
        } else {
          modalRouteSelect.value = "naromoru";
        }
      }
    });
  }

  // --- 4. Interactive Climber's Gear Checklist ---
  const gearCheckboxes = document.querySelectorAll(".checklist-item input[type='checkbox']");
  const gearProgressFill = document.getElementById("gearProgressFill");
  const gearProgressText = document.getElementById("gearProgressText");

  function loadGearState() {
    const saved = JSON.parse(safeStorage.get("mtkenya_gear_checklist", "{}"));
    gearCheckboxes.forEach((cb) => {
      const id = cb.id;
      if (saved[id]) {
        cb.checked = true;
        cb.closest(".checklist-item").classList.add("checked");
      }
    });
    updateGearProgress();
  }

  function updateGearProgress() {
    const total = gearCheckboxes.length;
    let checkedCount = 0;
    const stateObj = {};

    gearCheckboxes.forEach((cb) => {
      if (cb.checked) {
        checkedCount++;
        stateObj[cb.id] = true;
        cb.closest(".checklist-item").classList.add("checked");
      } else {
        cb.closest(".checklist-item").classList.remove("checked");
      }
    });

    const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
    if (gearProgressFill) gearProgressFill.style.width = `${percent}%`;
    if (gearProgressText) gearProgressText.textContent = `${checkedCount} of ${total} items packed (${percent}%)`;

    safeStorage.set("mtkenya_gear_checklist", JSON.stringify(stateObj));
  }

  gearCheckboxes.forEach((cb) => {
    cb.addEventListener("change", updateGearProgress);
  });

  loadGearState();

  // --- 5. Season & Climate Planner ---
  const seasonsData = {
    jan: {
      name: "January - Mid-March: Dry & Warm Summer Season",
      status: "Prime Summit Climbing",
      badgeClass: "badge-prime",
      desc: "Widely regarded as the premier season for climbing Mount Kenya. Days are typically crystal clear and dry with optimal rock-climbing friction on Batian's South Face and superb panoramic clarity from Point Lenana.",
      tempBase: "24°C / 75°F",
      tempCamp: "-4°C / 25°F",
      rainProb: "15% (Very Low)"
    },
    feb: {
      name: "February: Optimum Climbing Conditions",
      status: "Prime Summit Climbing",
      badgeClass: "badge-prime",
      desc: "February offers the driest conditions of the entire year across both Sirimon and Chogoria approaches. Minimal cloud cover allows spectacular nighttime stargazing and reliable dawn summit attempts.",
      tempBase: "25°C / 77°F",
      tempCamp: "-3°C / 26°F",
      rainProb: "12% (Lowest)"
    },
    mar: {
      name: "March: Early Shoulder to Long Rains Transition",
      status: "Shoulder Season",
      badgeClass: "badge-shoulder",
      desc: "Early March remains favorable. By late March, afternoon cloud build-up and intermittent showers begin as the equatorial Intertropical Convergence Zone (ITCZ) approaches.",
      tempBase: "23°C / 73°F",
      tempCamp: "-2°C / 28°F",
      rainProb: "45% (Moderate)"
    },
    apr: {
      name: "April: Long Rains Season",
      status: "Heavy Precipitation / Wet",
      badgeClass: "badge-rain",
      desc: "The peak of Kenya's long rains. Trails, especially in the bamboo and forest zones of Naromoru and Chogoria, become slippery and muddy. Peak climbs are technically challenging due to snow and sleet.",
      tempBase: "20°C / 68°F",
      tempCamp: "-5°C / 23°F",
      rainProb: "85% (High)"
    },
    may: {
      name: "May: Green Lush Landscapes",
      status: "Rainy & Misty",
      badgeClass: "badge-rain",
      desc: "Mists blanket the alpine valleys and glacial tarns fill to capacity. Vegetation is vibrantly lush, but trails require waterproof gaiters and alpine endurance.",
      tempBase: "21°C / 70°F",
      tempCamp: "-4°C / 25°F",
      rainProb: "70% (High)"
    },
    jun: {
      name: "June: Early Winter Dry Season",
      status: "Good Trekking Window",
      badgeClass: "badge-prime",
      desc: "Rainfall subsides rapidly. Crisp, clear alpine air with cool daytime temperatures. The North Face rock routes begin to open up for technical climbers.",
      tempBase: "22°C / 72°F",
      tempCamp: "-6°C / 21°F",
      rainProb: "25% (Low)"
    },
    jul: {
      name: "July: Crisp Alpine Weather",
      status: "Prime Trekking Window",
      badgeClass: "badge-prime",
      desc: "Clear days with cold, star-filled nights. Very low rainfall on northern approaches like Sirimon. Ideal for Point Lenana trekkers seeking clear sunrise panoramas.",
      tempBase: "21°C / 70°F",
      tempCamp: "-7°C / 19°F",
      rainProb: "20% (Low)"
    },
    aug: {
      name: "August: High Season Trekking & Climbing",
      status: "Prime Summit Climbing",
      badgeClass: "badge-prime",
      desc: "One of the most popular months. Optimal sun angle and dry conditions on North Face climbs (Batian and Nelion). Pre-booking guides and hut bunks is highly recommended.",
      tempBase: "22°C / 72°F",
      tempCamp: "-6°C / 21°F",
      rainProb: "18% (Low)"
    },
    sep: {
      name: "September: Consistent Dry Alpine Days",
      status: "Prime Trekking Window",
      badgeClass: "badge-prime",
      desc: "Consistently warm sunny days in the lower moorlands with dry, firm trails across all gates. Excellent wildlife viewing opportunities in the timberline zone.",
      tempBase: "23°C / 73°F",
      tempCamp: "-4°C / 25°F",
      rainProb: "22% (Low)"
    },
    oct: {
      name: "October: Pleasant Early Month Transition",
      status: "Shoulder Season",
      badgeClass: "badge-shoulder",
      desc: "Early October offers pleasant trekking. Towards late October, the 'short rains' begin to develop with occasional late afternoon alpine showers.",
      tempBase: "23°C / 73°F",
      tempCamp: "-3°C / 26°F",
      rainProb: "40% (Moderate)"
    },
    nov: {
      name: "November: Short Rains Season",
      status: "Showers & Snow at High Camps",
      badgeClass: "badge-rain",
      desc: "Short rains bring dramatic cloud inversions and fresh snowfall over Point Lenana and the peaks. Mornings are often clear, followed by afternoon precipitation.",
      tempBase: "21°C / 70°F",
      tempCamp: "-5°C / 23°F",
      rainProb: "65% (Moderate-High)"
    },
    dec: {
      name: "December: Holiday Summer Season Begins",
      status: "Prime Trekking Window",
      badgeClass: "badge-prime",
      desc: "By mid-December, dry sunny conditions return in full force. A favorite period for international travelers seeking to summit Point Lenana on Christmas or New Year's Day.",
      tempBase: "24°C / 75°F",
      tempCamp: "-4°C / 25°F",
      rainProb: "20% (Low)"
    }
  };

  const monthBtns = document.querySelectorAll(".month-btn");
  const seasonNameEl = document.getElementById("seasonName");
  const seasonDescEl = document.getElementById("seasonDesc");
  const seasonStatusBadge = document.getElementById("seasonStatusBadge");
  const seasonTempBase = document.getElementById("seasonTempBase");
  const seasonTempCamp = document.getElementById("seasonTempCamp");
  const seasonRainProb = document.getElementById("seasonRainProb");

  let currentSeasonMonth = "jan";

  function applySeason(month) {
    const data = seasonsData[month];
    if (!data) return;
    currentSeasonMonth = month;

    monthBtns.forEach((b) => b.classList.toggle("active", b.getAttribute("data-month") === month));

    if (seasonNameEl) seasonNameEl.textContent = data.name;
    if (seasonDescEl) seasonDescEl.textContent = data.desc;
    if (seasonStatusBadge) {
      seasonStatusBadge.textContent = data.status;
      seasonStatusBadge.className = `season-status-badge ${data.badgeClass}`;
    }
    if (seasonTempBase) seasonTempBase.textContent = data.tempBase;
    if (seasonTempCamp) seasonTempCamp.textContent = data.tempCamp;
    if (seasonRainProb) seasonRainProb.textContent = data.rainProb;
  }

  monthBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const month = btn.getAttribute("data-month");
      applySeason(month);
      // Two-way link: picking a season also reprices the cost estimator
      if (window.MTKCalc) window.MTKCalc.setMonth(month);
    });
  });

  // Expose for the estimator <-> climate advisor link
  window.MTKSeasons = {
    get month() { return currentSeasonMonth; },
    setSeason: (month, skipCalcSync) => {
      applySeason(month);
      if (!skipCalcSync && window.MTKCalc) window.MTKCalc.setMonth(month);
    }
  };

  // Default the climate advisor to the visitor's current month
  (function initSeason() {
    const keys = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    applySeason(keys[new Date().getMonth()]);
  })();

  // --- 6. Photo Gallery & Fullscreen Lightbox ---
  const galleryImages = [
    {
      src: "hero-peaks",
      title: "Mount Kenya Triple Summits",
      desc: "Panoramic sunrise view of Point Lenana (4,985m), Nelion (5,188m), and Batian (5,199m). Photo: Franco Pecchio (CC BY 2.0)."
    },
    {
      src: "the-temple",
      title: "The Temple & Lake Michaelson",
      desc: "Sheer vertical volcanic monolith towering over emerald Lake Michaelson in the Gorges Valley. Photo: Mehmet Karatay (CC BY-SA 2.5)."
    },
    {
      src: "gorges-valley",
      title: "Gorges Valley Alpine Approach",
      desc: "Looking up the dramatic glaciated canyon on the Chogoria Route approach. Photo: Mehmet Karatay (CC BY-SA 2.5)."
    },
    {
      src: "giant-groundsels",
      title: "Endemic Dendrosenecio keniodendron",
      desc: "Primeval stand of Giant Groundsels thriving at 4,300m above Hall Tarns. Photo: Dwergenpaartje (CC BY-SA 4.0)."
    },
    {
      src: "senecio-flora",
      title: "Senecio battiscombei Tree Groundsel",
      desc: "Afro-alpine tree groundsel uniquely adapted to freezing night temperatures and intense equatorial UV. Photo: Mehmet Karatay (CC BY-SA 2.5)."
    },
    {
      src: "mintos-highland",
      title: "Minto's Camp & High Moorland Tarns",
      desc: "Dramatic moorland plateau near Minto's Hut overlooking the deep Gorges Valley. Photo: Ray in Manila (CC BY 2.0)."
    }
  ];

  let currentLightboxIdx = 0;
  const lightboxModal = document.getElementById("lightboxModal");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");

  function openLightbox(index) {
    currentLightboxIdx = index;
    const item = galleryImages[currentLightboxIdx];
    if (item && lightboxModal) {
      lightboxImg.src = imgPath(item.src);
      lightboxImg.alt = item.title;
      lightboxCaption.innerHTML = `<strong>${item.title}</strong> — ${item.desc}`;
      lightboxModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  function closeLightbox() {
    if (lightboxModal) {
      lightboxModal.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  function stepLightbox(dir) {
    currentLightboxIdx = (currentLightboxIdx + dir + galleryImages.length) % galleryImages.length;
    openLightbox(currentLightboxIdx);
  }

  document.querySelectorAll(".gallery-card").forEach((card, index) => {
    card.addEventListener("click", () => openLightbox(index));
  });

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener("click", () => stepLightbox(-1));
  if (lightboxNext) lightboxNext.addEventListener("click", () => stepLightbox(1));

  if (lightboxModal) {
    lightboxModal.addEventListener("click", (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (lightboxModal && lightboxModal.classList.contains("active")) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    }
  });

  // --- 7. SEO FAQ Accordion ---
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const questionBtn = item.querySelector(".faq-question");
    if (questionBtn) {
      questionBtn.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        faqItems.forEach((i) => i.classList.remove("open"));
        if (!isOpen) {
          item.classList.add("open");
        }
      });
    }
  });

  // --- 8. Booking & Inquiry Modal ---
  const bookingModal = document.getElementById("bookingModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const openBookingBtns = document.querySelectorAll(".btn-open-booking");
  const bookingForm = document.getElementById("bookingForm");
  const toastNotice = document.getElementById("toastNotice");
  const toastMessage = document.getElementById("toastMessage");

  function openBookingModal() {
    if (bookingModal) {
      bookingModal.classList.add("active");
      document.body.style.overflow = "hidden";
      document.dispatchEvent(new CustomEvent("mtk:modal-open"));
    }
  }

  function closeBookingModal() {
    if (bookingModal) {
      bookingModal.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  openBookingBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openBookingModal();
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeBookingModal);
  if (bookingModal) {
    bookingModal.addEventListener("click", (e) => {
      if (e.target === bookingModal) closeBookingModal();
    });
  }

  if (bookingForm) {
    bookingForm.addEventListener("submit", (e) => {
      e.preventDefault();
      // payments.js owns the submit flow when the checkout wizard is active
      if (window.MTKCheckout) return;

      const name = document.getElementById("modalName").value || "Adventurer";
      const route = document.getElementById("modalRoute").value || "Mount Kenya";

      closeBookingModal();
      bookingForm.reset();

      if (toastNotice && toastMessage) {
        toastMessage.textContent = `Thank you, ${name}! Your inquiry for ${route.toUpperCase()} has been submitted. Our certified guide coordinator will respond within 12 hours.`;
        toastNotice.classList.add("show");
        setTimeout(() => {
          toastNotice.classList.remove("show");
        }, 5000);
      }
    });
  }

  // --- 9. Ambient Interactive Topographic Canvas in Hero ---
  const topoCanvas = document.getElementById("ambientTopoCanvas");
  if (topoCanvas) {
    const ctx = topoCanvas.getContext && topoCanvas.getContext("2d");
    if (ctx) {
    let width = (topoCanvas.width = topoCanvas.offsetWidth || window.innerWidth);
    let height = (topoCanvas.height = topoCanvas.offsetHeight || window.innerHeight);

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    window.addEventListener("resize", () => {
      width = topoCanvas.width = topoCanvas.offsetWidth || window.innerWidth;
      height = topoCanvas.height = topoCanvas.offsetHeight || window.innerHeight;
    });

    window.addEventListener("mousemove", (e) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    });

    let time = 0;
    function drawTopoContourLines() {
      time += 0.012;
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      ctx.clearRect(0, 0, width, height);

      const numLines = 8;
      const stepY = height / numLines;

      for (let i = 1; i <= numLines; i++) {
        ctx.beginPath();
        const baseElevation = i * stepY;
        ctx.moveTo(0, baseElevation);

        for (let x = 0; x <= width; x += 18) {
          const distToMouse = Math.hypot(x - mouseX, baseElevation - mouseY);
          const mouseDisplacement = Math.max(0, 40 - distToMouse * 0.1);
          const wave1 = Math.sin(x * 0.005 + time + i * 0.5) * 16;
          const wave2 = Math.cos(x * 0.01 - time * 0.7) * 9;
          const y = baseElevation + wave1 + wave2 - mouseDisplacement;
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = i % 2 === 0 ? "rgba(200, 242, 78, 0.16)" : "rgba(255, 90, 31, 0.2)";
        ctx.lineWidth = i % 3 === 0 ? 1.6 : 1.0;
        ctx.stroke();
      }

      requestAnimationFrame(drawTopoContourLines);
    }
    requestAnimationFrame(drawTopoContourLines);
    }
  }

  // --- 10. Interactive Topographic Mountain Map & Waypoint Telemetry ---
  const mapViewport = document.getElementById("mapViewport");
  const mapSvg = document.getElementById("mountainMapSvg");
  const hudPopup = document.getElementById("mapHudPopup");
  const hudTag = document.getElementById("hudTag");
  const hudTitle = document.getElementById("hudTitle");
  const hudElevation = document.getElementById("hudElevation");
  const hudDesc = document.getElementById("hudDesc");
  const hudOxygen = document.getElementById("hudOxygen");
  const hudZone = document.getElementById("hudZone");
  const hudCoords = document.getElementById("hudCoords");
  const hudAltTracker = document.getElementById("hudAltTracker");

  const waypointsDatabase = {
    batian: {
      name: "Batian Peak (Highest Summit)",
      tag: "Peak Summit",
      tagClass: "hud-tag-peak",
      elevation: "5,199m / 17,057 ft",
      desc: "The true volcanic plug apex of Mount Kenya. Standard route involves multi-pitch technical trad rock climbing on the North Face (IV+ / 5.8).",
      oxygen: "52% of Sea Level",
      zone: "Glacial Rock Core"
    },
    nelion: {
      name: "Nelion Peak (Second Summit)",
      tag: "Peak Summit",
      tagClass: "hud-tag-peak",
      elevation: "5,188m / 17,021 ft",
      desc: "Separated from Batian by the Gate of the Mists. Features the classic 21-pitch Normal Route and summit Howell Hut bivouac.",
      oxygen: "52% of Sea Level",
      zone: "Glacial Rock Core"
    },
    lenana: {
      name: "Point Lenana (Trekker's Pinnacle)",
      tag: "Trekking Peak",
      tagClass: "hud-tag-peak",
      elevation: "4,985m / 16,355 ft",
      desc: "The premier trekking objective on Mount Kenya. Non-technical scree ascent offering legendary sunrise vistas across the African plains towards Kilimanjaro.",
      oxygen: "54% of Sea Level",
      zone: "Alpine Scree / Snow"
    },
    "austrian-hut": {
      name: "Austrian Hut (Top Mountain Shelter)",
      tag: "High Mountain Hut",
      tagClass: "hud-tag-camp",
      elevation: "4,790m / 15,715 ft",
      desc: "The highest permanent shelter on Mount Kenya, situated directly below the Lewis Glacier moraine and the Point Lenana summit approach.",
      oxygen: "56% of Sea Level",
      zone: "Glacial Moraine"
    },
    shiptons: {
      name: "Shipton's Camp (Sirimon High Camp)",
      tag: "Mountain Camp",
      tagClass: "hud-tag-camp",
      elevation: "4,200m / 13,780 ft",
      desc: "Surreal amphitheater nestled beneath Batian's vertical north face. Dormitory bunks, dining hall, and surrounding giant groundsels.",
      oxygen: "61% of Sea Level",
      zone: "Upper Afro-Alpine"
    },
    "old-moses": {
      name: "Old Moses Camp (First Hut)",
      tag: "Mountain Camp",
      tagClass: "hud-tag-camp",
      elevation: "3,300m / 10,825 ft",
      desc: "First overnight shelter on Sirimon Route. Situated in the protea and tussock moorland with panoramic views of the northern plains.",
      oxygen: "70% of Sea Level",
      zone: "Lower Moorland"
    },
    "sirimon-gate": {
      name: "Sirimon Park Gate",
      tag: "Park Trailhead",
      tagClass: "hud-tag-gate",
      elevation: "2,650m / 8,694 ft",
      desc: "Official KWS registration gate on the northwest flank. Starting point through ancient podocarpus and cedar cloud forests.",
      oxygen: "75% of Sea Level",
      zone: "Montane Cloud Forest"
    },
    mintos: {
      name: "Minto's Camp & Hall Tarns",
      tag: "Mountain Camp",
      tagClass: "hud-tag-camp",
      elevation: "4,200m / 13,780 ft",
      desc: "Dramatic camp perched on an alpine plateau overlooking the 300m sheer drop of the Gorges Valley and Hall Tarns.",
      oxygen: "61% of Sea Level",
      zone: "Upper Moorland"
    },
    "chogoria-gate": {
      name: "Chogoria Gate / Bandas",
      tag: "Park Trailhead",
      tagClass: "hud-tag-gate",
      elevation: "2,950m / 9,678 ft",
      desc: "Eastern park entry above Meru town. Access point to the bamboo zone and the scenic route towards Lake Michaelson.",
      oxygen: "73% of Sea Level",
      zone: "Bamboo Forest Belt"
    },
    mackinders: {
      name: "Mackinder's Camp (Teleki High Camp)",
      tag: "Mountain Camp",
      tagClass: "hud-tag-camp",
      elevation: "4,300m / 14,107 ft",
      desc: "Historic stone lodge in the Teleki Valley beneath Nelion's south face. Home to abundant high-altitude rock hyrax colonies.",
      oxygen: "60% of Sea Level",
      zone: "Upper Afro-Alpine"
    },
    "met-station": {
      name: "Met Station Lodge",
      tag: "Mountain Lodge",
      tagClass: "hud-tag-camp",
      elevation: "3,050m / 10,006 ft",
      desc: "First overnight camp on Naromoru Route. Comfortable timber cabins before tackling the challenging Vertical Bog.",
      oxygen: "72% of Sea Level",
      zone: "Montane Bamboo Zone"
    },
    "naromoru-gate": {
      name: "Naromoru Park Gate",
      tag: "Park Trailhead",
      tagClass: "hud-tag-gate",
      elevation: "2,600m / 8,530 ft",
      desc: "Western park headquarters and main rescue staging station. Fastest vehicular approach from Nairobi.",
      oxygen: "76% of Sea Level",
      zone: "Podocarpus Forest"
    },
    "lake-michaelson": {
      name: "Lake Michaelson (Glacial Tarn)",
      tag: "Alpine Lake",
      tagClass: "hud-tag-lake",
      elevation: "3,950m / 12,960 ft",
      desc: "Deep emerald glacial jewel formed in the Gorges Valley beneath the sheer volcanic precipice of The Temple.",
      oxygen: "63% of Sea Level",
      zone: "Glacial Cirque Basin"
    },
    "lake-alice": {
      name: "Lake Alice (Highest Forest Lake)",
      tag: "Alpine Lake",
      tagClass: "hud-tag-lake",
      elevation: "3,550m / 11,647 ft",
      desc: "Pristine crater lake famous for visits by the British royal family and wild rainbow trout in the afro-alpine heath.",
      oxygen: "67% of Sea Level",
      zone: "Heather Moorland"
    },
    "hall-tarns": {
      name: "Hall Tarns (Perched Tarns)",
      tag: "Alpine Lake",
      tagClass: "hud-tag-lake",
      elevation: "4,200m / 13,780 ft",
      desc: "Cluster of small crystal-clear tarns perched on the edge of the Gorges Valley cliff right by Minto's Hut.",
      oxygen: "61% of Sea Level",
      zone: "Upper Moorland"
    },
    "lewis-tarn": {
      name: "Lewis Glacial Tarn",
      tag: "Alpine Lake",
      tagClass: "hud-tag-lake",
      elevation: "4,570m / 15,000 ft",
      desc: "High tarn nestled into the retreating Lewis Glacier moraine between Austrian Hut and Point Lenana.",
      oxygen: "58% of Sea Level",
      zone: "Glacial Moraine"
    }
  };

  // Map Pan & Zoom state
  let mapScale = 1.0;
  let mapPanX = 0;
  let mapPanY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  function updateMapTransform() {
    if (mapSvg) {
      mapSvg.style.transform = `translate(${mapPanX}px, ${mapPanY}px) scale(${mapScale})`;
    }
  }

  if (mapViewport && mapSvg) {
    // Mouse drag
    mapViewport.addEventListener("mousedown", (e) => {
      if (e.target.closest("button") || e.target.closest(".map-hud-popup")) return;
      isDragging = true;
      startX = e.clientX - mapPanX;
      startY = e.clientY - mapPanY;
      mapViewport.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (e) => {
      if (isDragging) {
        mapPanX = e.clientX - startX;
        mapPanY = e.clientY - startY;
        updateMapTransform();
      }
    });

    window.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        mapViewport.style.cursor = "grab";
      }
    });

    // Touch support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    mapViewport.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX - mapPanX;
        touchStartY = e.touches[0].clientY - mapPanY;
      }
    }, { passive: true });

    mapViewport.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1) {
        mapPanX = e.touches[0].clientX - touchStartX;
        mapPanY = e.touches[0].clientY - touchStartY;
        updateMapTransform();
      }
    }, { passive: true });

    // Wheel zoom
    mapViewport.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
      const newScale = Math.min(Math.max(mapScale * zoomFactor, 0.8), 3.2);
      mapScale = newScale;
      updateMapTransform();
    }, { passive: false });

    // Live Telemetry on cursor move
    mapViewport.addEventListener("mousemove", (e) => {
      const rect = mapViewport.getBoundingClientRect();
      const normX = (e.clientX - rect.left - mapPanX) / (rect.width * mapScale);
      const normY = (e.clientY - rect.top - mapPanY) / (rect.height * mapScale);

      const lat = (-0.10 - normY * 0.11).toFixed(4);
      const lon = (37.24 + normX * 0.13).toFixed(4);

      const distToPeak = Math.hypot(normX - 0.5, normY - 0.48);
      let simAlt = Math.round(5199 - distToPeak * 6200);
      simAlt = Math.max(2500, Math.min(5199, simAlt));

      let zoneName = "Montane Forest";
      if (simAlt >= 4800) zoneName = "Nival / Peak Glacial Core";
      else if (simAlt >= 4400) zoneName = "Alpine Scree & Moraine";
      else if (simAlt >= 3800) zoneName = "Upper Afro-Alpine Moorland";
      else if (simAlt >= 3200) zoneName = "Heather & Moorland Belt";
      else if (simAlt >= 2800) zoneName = "Bamboo Jungle Zone";

      if (hudCoords) hudCoords.textContent = `${Math.abs(lat)}°S, ${lon}°E`;
      if (hudAltTracker) hudAltTracker.textContent = `${simAlt.toLocaleString()}m (${zoneName})`;
    });

    // Zoom Buttons
    const btnZoomIn = document.getElementById("mapZoomIn");
    const btnZoomOut = document.getElementById("mapZoomOut");
    const btnReset = document.getElementById("mapReset");

    if (btnZoomIn) {
      btnZoomIn.addEventListener("click", () => {
        mapScale = Math.min(mapScale * 1.25, 3.2);
        updateMapTransform();
      });
    }

    if (btnZoomOut) {
      btnZoomOut.addEventListener("click", () => {
        mapScale = Math.max(mapScale / 1.25, 0.8);
        updateMapTransform();
      });
    }

    if (btnReset) {
      btnReset.addEventListener("click", () => {
        mapScale = 1.0;
        mapPanX = 0;
        mapPanY = 0;
        updateMapTransform();
      });
    }

    // Waypoint Interaction (Hover & Click)
    const waypointElements = document.querySelectorAll("[data-waypoint]");
    waypointElements.forEach((el) => {
      const wpKey = el.getAttribute("data-waypoint");
      const info = waypointsDatabase[wpKey];

      function showWaypointHud() {
        if (!info || !hudPopup) return;
        hudTag.textContent = info.tag;
        hudTag.className = `hud-popup-tag ${info.tagClass}`;
        hudTitle.textContent = info.name;
        hudElevation.textContent = info.elevation;
        hudDesc.textContent = info.desc;
        hudOxygen.textContent = info.oxygen;
        hudZone.textContent = info.zone;
        hudPopup.classList.add("visible");
      }

      el.addEventListener("mouseenter", showWaypointHud);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        showWaypointHud();
      });
    });

    // Close HUD popup when clicking empty map area
    mapViewport.addEventListener("click", (e) => {
      if (!e.target.closest("[data-waypoint]") && !e.target.closest(".map-hud-popup")) {
        if (hudPopup) hudPopup.classList.remove("visible");
      }
    });

    // Route Filter Buttons
    const routeFilterBtns = document.querySelectorAll("[data-map-route]");
    const allRouteLines = document.querySelectorAll(".map-route-line");

    routeFilterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        routeFilterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const routeKey = btn.getAttribute("data-map-route");

        allRouteLines.forEach((line) => {
          line.classList.remove("active", "dimmed");
          if (routeKey === "all") {
            // normal
          } else if (line.classList.contains(`route-${routeKey}`)) {
            line.classList.add("active");
          } else {
            line.classList.add("dimmed");
          }
        });
      });
    });
  }
});
