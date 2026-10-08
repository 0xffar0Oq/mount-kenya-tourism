/* ============================================================================
   payments.js — Intelligent checkout wizard for the expedition estimator
   Static site: no gateway keys, so authorisation is simulated end-to-end
   while every quote, discount, deposit and validation rule is real.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var $ = function (id) { return doc.getElementById(id); };

  var bookingModal = $("bookingModal");
  if (!bookingModal) return;

  var bookingForm = $("bookingForm");
  var stepper = $("checkoutStepper");
  var summaryEl = $("checkoutSummary");
  var promoInput = $("promoCode");
  var promoStatusEl = $("promoStatus");
  var consentEl = $("checkoutConsent");
  var payBtn = $("checkoutPay");
  var payLabel = $("checkoutPayLabel");

  /* -----------------------------------------------------------------------
     Catalogue
     --------------------------------------------------------------------- */
  var ROUTE_NAMES = {
    "sirimon-chogoria": "Sirimon \u2192 Chogoria Traverse",
    "sirimon-naromoru": "Sirimon \u2192 Naromoru Traverse",
    sirimon: "Sirimon Route",
    chogoria: "Chogoria Route",
    naromoru: "Naromoru Route",
    batian: "Batian Technical Rock Climb"
  };

  var TIER_LABELS = { budget: "Value", standard: "Standard", luxury: "Expedition Comfort" };
  var MONTH_LABELS = {
    jan: "January", feb: "February", mar: "March", apr: "April", may: "May", jun: "June",
    jul: "July", aug: "August", sep: "September", oct: "October", nov: "November", dec: "December"
  };

  var DEPOSIT_PCT = 0.2;
  var PROMOS = {
    SUMMIT10: { type: "pct", value: 10, label: "10% summit-season credit" },
    GREEN15: { type: "pct", value: 15, label: "15% green-season fare" },
    KWS2026: { type: "pct", value: 5, label: "5% KWS partner rate" },
    TREK50: { type: "flat", value: 50, label: "$50 off any departure" }
  };

  var cardBrandGuess = { visa: [], mastercard: [], amex: [] };

  var state = {
    step: 1,
    method: "mpesa",
    plan: "deposit",
    discount: null,
    quote: null,
    lines: null,
    currency: "USD",
    total: 0,
    paid: 0,
    busy: false
  };

  /* -----------------------------------------------------------------------
     Quote helpers
     --------------------------------------------------------------------- */
  function calcState() {
    if (window.MTKCalc && window.MTKCalc.state) return window.MTKCalc.state;
    return { route: "sirimon-chogoria", duration: 5, tier: "standard", climbers: 2, month: "jan", currency: "USD", priceMode: "person" };
  }

  function fmt(valueInCurrency, currency) {
    if (window.MTKMoney) return window.MTKMoney.fmtNum(valueInCurrency, currency);
    return (currency === "KES" ? "KES " : "$") + Math.round(valueInCurrency).toLocaleString("en-US");
  }

  function usdToDisplay(amountUSD, currency) {
    if (window.MTKMoney) return Math.round(window.MTKMoney.toCurrency(amountUSD, currency));
    return Math.round(amountUSD * (currency === "KES" ? 129.5 : 1));
  }

  function buildQuote() {
    var st = calcState();
    if (!window.MTKPricing) return null;

    var q = window.MTKPricing.computeExpeditionQuote(st);
    var cur = st.currency || "USD";
    var unit = [q.park, q.guides, q.lodging, q.meals].map(function (v) { return usdToDisplay(v, cur); });
    var perPerson = unit.reduce(function (a, b) { return a + b; }, 0);
    var climbers = Math.max(1, Number(st.climbers) || 1);
    var base = perPerson * climbers;

    var discount = 0;
    if (state.discount) {
      discount = state.discount.type === "pct"
        ? Math.round(base * state.discount.value / 100)
        : usdToDisplay(state.discount.value, cur);
      if (discount > base) discount = base;
    }

    var total = base - discount;
    state.quote = q;
    state.lines = {
      unit: unit,
      perPerson: perPerson,
      climbers: climbers,
      base: base,
      discount: discount,
      total: total,
      deposit: Math.round(total * DEPOSIT_PCT)
    };
    state.currency = cur;
    state.total = total;
    return state.lines;
  }

  /* -----------------------------------------------------------------------
     Departure-aware rules
     --------------------------------------------------------------------- */
  function departureDate() {
    var el = $("modalDate");
    if (!el || !el.value) return null;
    var d = new Date(el.value + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }

  function daysUntilDeparture() {
    var d = departureDate();
    if (!d) return null;
    return Math.ceil((d.getTime() - Date.now()) / 86400000);
  }

  function depositAllowed() {
    var days = daysUntilDeparture();
    return days === null || days >= 21;
  }

  function suggestPlan() {
    // Intelligent default: deposits for anything meaningfully priced,
    // full payment for micro-trips and last-minute departures.
    if (!depositAllowed()) return "full";
    return state.total >= 400 ? "deposit" : "full";
  }

  /* -----------------------------------------------------------------------
     Step control
     --------------------------------------------------------------------- */
  function showStep(n) {
    state.step = n;
    Array.prototype.forEach.call(bookingForm.querySelectorAll(".checkout-step"), function (sec) {
      var active = Number(sec.dataset.step) === n;
      sec.hidden = !active;
      sec.classList.toggle("is-active", active);
    });
    if (stepper) {
      Array.prototype.forEach.call(stepper.querySelectorAll(".checkout-step-dot"), function (dot) {
        var dn = Number(dot.dataset.stepDot);
        dot.classList.toggle("is-active", dn === n);
        dot.classList.toggle("is-done", dn < n);
      });
    }
    if (n === 2) renderStep2();
    var focusTarget = bookingForm.querySelector('.checkout-step[data-step="' + n + '"] input, .checkout-step[data-step="' + n + '"] button');
    if (focusTarget && n > 1) { try { focusTarget.focus({ preventScroll: false }); } catch (e) { /* ignore */ } }
  }

  function fieldError(input, message) {
    if (!input) return;
    input.style.borderColor = "var(--accent-crimson)";
    input.setAttribute("aria-invalid", "true");
    input.focus();
    setTimeout(function () {
      input.style.borderColor = "";
      input.removeAttribute("aria-invalid");
    }, 2600);
    return message;
  }

  /* -----------------------------------------------------------------------
     Step 1 validation
     --------------------------------------------------------------------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validateStep1() {
    var name = $("modalName");
    var email = $("modalEmail");
    if (!name || !email) return true;
    if (!name.value.trim()) { fieldError(name, "Name required"); return false; }
    if (!EMAIL_RE.test(email.value.trim())) { fieldError(email, "Valid email required"); return false; }
    return true;
  }

  /* -----------------------------------------------------------------------
     Step 2 rendering
     --------------------------------------------------------------------- */
  function routeLabel(route) {
    return ROUTE_NAMES[route] || "Mount Kenya Expedition";
  }

  function departureLabel() {
    var d = departureDate();
    if (!d) return "Dates flexible";
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  function renderStep2() {
    var L = buildQuote();
    if (!L || !summaryEl) return;
    var st = calcState();
    var cur = state.currency;
    var days = Number(st.duration) || 5;

    var lines = [
      ["KWS park fees &amp; levies", L.unit[0]],
      ["Certified mountain guides", L.unit[1]],
      ["Mountain huts / tented camps", L.unit[2]],
      ["Meals on the mountain", L.unit[3]]
    ];

    var html = "";
    html += '<div class="cs-route">' + routeLabel(st.route) + "</div>";
    html += '<div class="cs-meta">' + days + " days \u00b7 " + TIER_LABELS[st.tier] + " \u00b7 " +
      L.climbers + (L.climbers === 1 ? " trekker" : " trekkers") + " \u00b7 " +
      (MONTH_LABELS[st.month] || "") + " \u00b7 " + departureLabel() + "</div>";

    lines.forEach(function (row) {
      html += '<div class="cs-line"><span>' + row[0] + "</span><span>" + fmt(row[1], cur) + "</span></div>";
    });

    if (L.climbers > 1) {
      html += '<div class="cs-line"><span>Per trekker \u00d7 ' + L.climbers + "</span><span>" +
        fmt(L.perPerson, cur) + " each</span></div>";
    }

    html += '<div class="cs-line is-total"><span>Trip total</span><strong>' + fmt(L.base, cur) + "</strong></div>";

    if (L.discount > 0) {
      html += '<div class="cs-line is-discount"><span>Promo \u00b7 ' + state.discount.code + "</span><strong>\u2212" +
        fmt(L.discount, cur) + "</strong></div>";
    }

    if (L.discount > 0) {
      html += '<div class="cs-line is-total"><span>Amount due</span><strong>' + fmt(L.total, cur) + "</strong></div>";
    }

    summaryEl.innerHTML = html;

    // Plans
    var depositCard = doc.querySelector('.plan-card[data-plan="deposit"]');
    var fullCard = doc.querySelector('.plan-card[data-plan="full"]');
    $("planDepositAmt").textContent = fmt(L.deposit, cur);
    $("planFullAmt").textContent = fmt(L.total, cur);

    var allowed = depositAllowed();
    depositCard.disabled = !allowed;
    depositCard.style.opacity = allowed ? "" : "0.45";
    $("planDepositNote").textContent = allowed
      ? Math.round(DEPOSIT_PCT * 100) + "% today \u00b7 balance " + fmt(L.total - L.deposit, cur) + " due 14 days before departure"
      : "Departure is within 21 days \u2014 full payment required";

    if (!allowed && state.plan === "deposit") state.plan = "full";
    if (!state.plan) state.plan = suggestPlan();
    setPlan(state.plan);
    setMethod(state.method);
    updatePayLabel();
  }

  function setPlan(plan) {
    if (plan === "deposit" && !depositAllowed()) plan = "full";
    state.plan = plan;
    Array.prototype.forEach.call(doc.querySelectorAll(".plan-card"), function (c) {
      var on = c.dataset.plan === plan;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-checked", on ? "true" : "false");
    });
    updatePayLabel();
  }

  function setMethod(method) {
    state.method = method;
    Array.prototype.forEach.call(doc.querySelectorAll(".method-tab"), function (t) {
      var on = t.dataset.method === method;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-checked", on ? "true" : "false");
    });
    Array.prototype.forEach.call(doc.querySelectorAll(".method-panel"), function (p) {
      p.classList.toggle("is-active", p.dataset.methodPanel === method);
    });
  }

  function amountDue() {
    if (!state.lines) buildQuote();
    if (state.plan === "full") return state.lines.total;
    return state.lines.deposit;
  }

  function updatePayLabel() {
    if (!payLabel || !state.lines) return;
    var verb = { mpesa: "Pay", card: "Pay", paypal: "Pay with", bank: "Reserve with" }[state.method] || "Pay";
    var amount = fmt(amountDue(), state.currency);
    var planWord = state.plan === "deposit" ? "Deposit" : "Full Amount";
    payLabel.textContent = verb + " " + planWord + " \u00b7 " + amount;
  }

  /* -----------------------------------------------------------------------
     Input formatting & method validation
     --------------------------------------------------------------------- */
  function luhn(numStr) {
    var sum = 0, alt = false;
    for (var i = numStr.length - 1; i >= 0; i--) {
      var n = parseInt(numStr.charAt(i), 10);
      if (isNaN(n)) return false;
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  var cardNumber = $("cardNumber");
  if (cardNumber) {
    cardNumber.addEventListener("input", function () {
      var digits = cardNumber.value.replace(/\D/g, "").slice(0, 16);
      cardNumber.value = digits.replace(/(.{4})/g, "$1 ").trim();
    });
  }

  var cardExpiry = $("cardExpiry");
  if (cardExpiry) {
    cardExpiry.addEventListener("input", function () {
      var v = cardExpiry.value.replace(/\D/g, "").slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
      cardExpiry.value = v;
    });
  }

  var cardCvc = $("cardCvc");
  if (cardCvc) cardCvc.addEventListener("input", function () {
    cardCvc.value = cardCvc.value.replace(/\D/g, "").slice(0, 4);
  });

  var mpesaPhone = $("mpesaPhone");
  if (mpesaPhone) mpesaPhone.addEventListener("input", function () {
    mpesaPhone.value = mpesaPhone.value.replace(/[^\d+ ]/g, "").slice(0, 17);
  });

  function validatePaymentMethod() {
    if (state.method === "mpesa") {
      var phone = ((mpesaPhone && mpesaPhone.value) || "").replace(/[\s\-]/g, "");
      if (!/^(\+?254|0)?7\d{8}$/.test(phone) && !/^\+?\d{7,15}$/.test(phone)) {
        fieldError(mpesaPhone, "Phone required");
        return false;
      }
    }
    if (state.method === "card") {
      var digits = (cardNumber && cardNumber.value || "").replace(/\D/g, "");
      if (digits.length < 13 || !luhn(digits)) { fieldError(cardNumber, "Card number invalid"); return false; }

      var exp = (cardExpiry && cardExpiry.value || "").match(/^(\d{2})\/(\d{2})$/);
      if (!exp) { fieldError(cardExpiry, "Expiry invalid"); return false; }
      var month = parseInt(exp[1], 10), year = 2000 + parseInt(exp[2], 10);
      if (month < 1 || month > 12) { fieldError(cardExpiry, "Month invalid"); return false; }
      var now = new Date();
      if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
        fieldError(cardExpiry, "Card expired");
        return false;
      }

      var cvc = (cardCvc && cardCvc.value || "");
      if (cvc.length < 3) { fieldError(cardCvc, "CVC required"); return false; }

      var holder = (doc.getElementById("cardName") || {}).value || "";
      if (!holder.trim()) { fieldError(doc.getElementById("cardName"), "Name required"); return false; }
    }
    return true;
  }

  function validateStep2() {
    if (!consentEl || !consentEl.checked) {
      if (consentEl) {
        consentEl.focus();
        var row = consentEl.closest(".checkout-consent");
        if (row) {
          row.style.color = "var(--accent-crimson)";
          setTimeout(function () { row.style.color = ""; }, 2400);
        }
      }
      return false;
    }
    return validatePaymentMethod();
  }

  /* -----------------------------------------------------------------------
     Promo codes
     --------------------------------------------------------------------- */
  function applyPromo() {
    if (!promoStatusEl) return;
    var code = (promoInput && promoInput.value || "").trim().toUpperCase();
    promoStatusEl.classList.remove("is-error");

    if (!code) {
      state.discount = null;
      promoStatusEl.textContent = "";
      renderStep2();
      return;
    }

    var rule = PROMOS[code];
    if (!rule) {
      state.discount = null;
      promoStatusEl.classList.add("is-error");
      promoStatusEl.textContent = "Code " + code + " is not recognised.";
      renderStep2();
      return;
    }

    state.discount = Object.assign({ code: code }, rule);
    promoStatusEl.textContent = rule.label + " applied.";
    renderStep2();
  }

  var promoApplyBtn = $("promoApplyBtn");
  if (promoApplyBtn) promoApplyBtn.addEventListener("click", applyPromo);
  if (promoInput) {
    promoInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); applyPromo(); }
    });
  }

  /* -----------------------------------------------------------------------
     Authorisation simulation (no live gateway on a static site)
     --------------------------------------------------------------------- */
  var PROCESS_STAGES = {
    mpesa: ["Opening secure session", "Sending STK push to handset", "Awaiting M-Pesa PIN", "Authorising with Safaricom"],
    card: ["Opening secure session", "Tokenising card", "Authorising with issuer", "Confirming with acquirer"],
    paypal: ["Opening secure session", "Creating PayPal order", "Awaiting buyer approval", "Capturing payment"],
    bank: ["Opening secure session", "Issuing bank reference", "Placing provisional hold", "Securing your place"]
  };

  function runAuthorisation(done) {
    var stages = PROCESS_STAGES[state.method] || PROCESS_STAGES.mpesa;
    var i = 0;
    state.busy = true;
    payBtn.disabled = true;
    payBtn.style.opacity = "0.75";

    function tick() {
      if (payLabel) payLabel.textContent = stages[i] + "\u2026";
      i += 1;
      if (i < stages.length) {
        setTimeout(tick, 480);
      } else {
        setTimeout(function () {
          state.busy = false;
          payBtn.disabled = false;
          payBtn.style.opacity = "";
          done();
        }, 520);
      }
    }
    tick();
  }

  /* -----------------------------------------------------------------------
     Confirmation
     --------------------------------------------------------------------- */
  function makeReference() {
    var d = new Date();
    var stamp = String(d.getFullYear()).slice(2) +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0");
    var rand = Math.floor(100 + Math.random() * 900);
    return "MTK-" + stamp + "-" + rand;
  }

  function balanceDueDate() {
    var dep = departureDate();
    if (!dep) return "14 days before departure";
    var b = new Date(dep.getTime() - 14 * 86400000);
    return b.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function confirmBooking() {
    var L = state.lines;
    var cur = state.currency;
    var st = calcState();
    var paid = amountDue();
    var balance = L.total - paid;
    var ref = makeReference();

    state.paid = paid;

    $("confirmRef").textContent = ref;
    $("confirmCopy").textContent = state.plan === "deposit"
      ? "Deposit received for " + fmt(paid, cur) + ". Balance of " + fmt(balance, cur) + " is due by " + balanceDueDate() + "."
      : "Paid in full \u2014 " + fmt(paid, cur) + ". Your park permits are being filed with KWS.";

    var methodLabels = { mpesa: "M-Pesa", card: "Card", paypal: "PayPal", bank: "Bank transfer" };
    var rows = [
      ["Reference", ref],
      ["Route", routeLabel(st.route)],
      ["Start date", departureLabel()],
      ["Trekkers", String(L.climbers)],
      ["Plan", state.plan === "deposit" ? "20% deposit" : "Paid in full"],
      ["Method", methodLabels[state.method]],
      ["Paid today", fmt(paid, cur)],
      ["Balance", balance > 0 ? fmt(balance, cur) + " \u00b7 due " + balanceDueDate() : "None"]
    ];

    $("confirmGrid").innerHTML = rows.map(function (r) {
      return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>";
    }).join("");

    var booking = {
      ref: ref,
      at: new Date().toISOString(),
      route: st.route,
      duration: st.duration,
      tier: st.tier,
      climbers: L.climbers,
      month: st.month,
      start: ($("modalDate") && $("modalDate").value) || null,
      plan: state.plan,
      method: state.method,
      currency: cur,
      paid: paid,
      balance: balance,
      total: L.total,
      promo: state.discount ? state.discount.code : null,
      email: ($("modalEmail") && $("modalEmail").value) || ""
    };

    try {
      if (window.MTKStorage) {
        var all = JSON.parse(window.MTKStorage.get("mtkBookings", "[]"));
        if (!Array.isArray(all)) all = [];
        all.push(booking);
        window.MTKStorage.set("mtkBookings", JSON.stringify(all.slice(-25)));
      }
    } catch (e) { /* storage unavailable */ }

    lastBooking = booking;
    showStep(3);
  }

  var lastBooking = null;

  function downloadReceipt() {
    if (!lastBooking) return;
    var b = lastBooking;
    var text = [
      "MOUNT KENYA EXPEDITIONS & ECOTOURISM",
      "=====================================",
      "",
      "BOOKING RECEIPT",
      "Reference:  " + b.ref,
      "Date:       " + new Date(b.at).toLocaleString("en-GB"),
      "",
      "ROUTE:      " + routeLabel(b.route),
      "DURATION:   " + b.duration + " days (" + TIER_LABELS[b.tier] + ")",
      "TREKKERS:   " + b.climbers,
      "START DATE: " + (b.start || "Flexible"),
      "",
      "Trip total: " + fmt(b.total, b.currency),
      "Paid:       " + fmt(b.paid, b.currency) + " via " + b.method + " (" + (b.plan === "deposit" ? "deposit" : "full") + ")",
      "Balance:    " + (b.balance > 0 ? fmt(b.balance, b.currency) + " due " + balanceDueDate() : "None"),
      b.promo ? "Promo:      " + b.promo : "",
      "",
      "KWS licensed operator \u00b7 24-hour free cancellation",
      "Contact: https://0xffar0oq.github.io/mount-kenya-tourism/"
    ].filter(Boolean).join("\n");

    try {
      var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = doc.createElement("a");
      a.href = url;
      a.download = b.ref + "-receipt.txt";
      doc.body.appendChild(a);
      a.click();
      doc.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    } catch (e) { /* download unsupported */ }
  }

  var receiptBtn = $("confirmReceiptBtn");
  if (receiptBtn) receiptBtn.addEventListener("click", downloadReceipt);

  var doneBtn = $("confirmDoneBtn");
  if (doneBtn) {
    doneBtn.addEventListener("click", function () {
      bookingModal.classList.remove("active");
      doc.body.style.overflow = "";
      if (bookingForm) bookingForm.reset();
      state.discount = null;
      if (promoInput) promoInput.value = "";
      if (promoStatusEl) promoStatusEl.textContent = "";
      showStep(1);
    });
  }

  /* -----------------------------------------------------------------------
     Wiring
     --------------------------------------------------------------------- */
  var nextBtn = $("checkoutNext");
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      if (!validateStep1()) return;
      showStep(2);
    });
  }

  var backBtn = $("checkoutBack");
  if (backBtn) backBtn.addEventListener("click", function () { showStep(1); });

  Array.prototype.forEach.call(doc.querySelectorAll(".plan-card"), function (c) {
    c.addEventListener("click", function () { setPlan(c.dataset.plan); });
  });

  Array.prototype.forEach.call(doc.querySelectorAll(".method-tab"), function (t) {
    t.addEventListener("click", function () { setMethod(t.dataset.method); updatePayLabel(); });
  });

  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (state.busy) return;

      // Enter key on step 1 advances the wizard
      if (state.step === 1) {
        if (validateStep1()) showStep(2);
        return;
      }
      if (state.step !== 2) return;
      if (!validateStep2()) return;

      runAuthorisation(function () {
        confirmBooking();
      });
    }, true);
  }

  // Refresh the live quote whenever the estimator changes while checkout is open
  doc.addEventListener("mtk:quote", function () {
    if (state.step === 2) renderStep2();
  });

  // Reset the wizard whenever the modal opens
  doc.addEventListener("mtk:modal-open", function () {
    state.plan = "deposit";
    state.step = 1;
    showStep(1);
  });

  // Keep the estimator's route in sync with the modal route select
  var modalRoute = $("modalRoute");
  if (modalRoute && window.MTKCalc) {
    modalRoute.addEventListener("change", function () {
      var key = modalRoute.value;
      if (key === "traverse") key = "sirimon-chogoria";
      if (["sirimon", "chogoria", "naromoru", "sirimon-chogoria"].indexOf(key) !== -1) {
        window.MTKCalc.set({ route: key });
      }
    });
  }

  showStep(1);
  window.MTKCheckout = {
    showStep: showStep,
    state: state,
    quote: buildQuote
  };
})();
