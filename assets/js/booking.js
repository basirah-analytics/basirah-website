/* =====================================================================
   Basirah Analytics: booking.js
   The custom booking widget. Its own file rather than an inline script:
   the CSP on this site sets script-src 'self' with no unsafe-inline, so
   an inline block would be refused by the browser outright.
   ===================================================================== */
(function () {
  "use strict";

  // ------------------------------------------------------------------
  // CONFIG
  //
  // web3formsKey sends the request as an email. That is all it does, and
  // the difference matters:
  //
  //   - It does NOT read a calendar, so every half hour of a 24 hour day is
  //     offered and two people can pick the same slot. apiBase is what would
  //     fix that, and it is still empty.
  //   - It does NOT create a calendar event or send the visitor an invite.
  //     Only the site owner is emailed, so the confirmation screen says a
  //     reply is coming rather than promising an invite that nothing sends.
  //
  // apiBase stays as the hook for a real backend later. If it is ever set it
  // wins, because a backend can check availability and issue an invite,
  // which the email service cannot.
  // ------------------------------------------------------------------
  const CONFIG = {
    eventLengthMin: 30,
    daysToShow: 14,
    leadDays: 1,        // earliest bookable day = today + leadDays (no same-day)
    apiBase: "",        // optional: a real booking backend, takes priority
    web3formsKey: "26e22b98-59e6-4618-8610-7997ac7a7325",
    web3formsUrl: "https://api.web3forms.com/submit"
  };

  const $ = function (id) { return document.getElementById(id); };

  // the widget is one section of a larger page now, so bail out quietly
  // anywhere it is not present rather than throwing on a null
  if (!$("bsrBook")) return;

  const state = { day: null, dayStr: null, time24: null, tz: null, times: [], period: null };

  function pad(n) { return String(n).padStart(2, "0"); }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function label12(h, m) {
    const ap = h < 12 ? "AM" : "PM";
    let hh = h % 12; if (hh === 0) hh = 12;
    return hh + ":" + pad(m) + " " + ap;
  }
  function label12FromStr(t24) {
    const p = t24.split(":");
    return label12(parseInt(p[0], 10), parseInt(p[1], 10));
  }
  function hourOf(t24) { return parseInt(t24.split(":")[0], 10); }

  // ---- Timezone picker ---------------------------------------------
  const COMMON_TZ = [
    "Pacific/Auckland", "Australia/Sydney", "Asia/Tokyo", "Asia/Singapore",
    "Asia/Kolkata", "Asia/Dubai", "Europe/London", "Europe/Berlin", "Europe/Paris",
    "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "America/Sao_Paulo", "UTC"
  ];
  function tzOffset(tz) {
    try {
      const parts = new Intl.DateTimeFormat("en-US",
        { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(new Date());
      const p = parts.find(function (x) { return x.type === "timeZoneName"; });
      return p ? p.value : "";
    } catch (e) { return ""; }
  }
  function tzFriendly(tz) { return tz.replace(/_/g, " "); }

  (function buildTz() {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const list = COMMON_TZ.slice();
    if (list.indexOf(detected) === -1) list.unshift(detected);
    state.tz = detected;

    const sel = $("tzSelect");
    list.forEach(function (tz) {
      const o = document.createElement("option");
      const off = tzOffset(tz);
      o.value = tz;
      o.textContent = tzFriendly(tz) + (off ? "  (" + off + ")" : "");
      if (tz === detected) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function () {
      state.tz = sel.value;
      state.time24 = null;
      $("detailsBlock").classList.add("bsr-hidden");
      if (state.day) loadSlots();  // real availability can differ per tz
    });
  })();

  // ---- Availability source -----------------------------------------
  // Returns Promise<string[]> of "HH:MM" wall times in the chosen tz.
  function fetchAvailability(dayStr, tz) {
    if (CONFIG.apiBase) {
      const url = CONFIG.apiBase + "/availability?date=" + dayStr +
                  "&tz=" + encodeURIComponent(tz);
      return fetch(url)
        .then(function (r) { if (!r.ok) throw new Error("availability"); return r.json(); })
        .then(function (d) { return d.slots || []; });
      // Expected: { "slots": ["09:00","09:30", ...] }  (free times only)
    }
    return Promise.resolve(all24());  // preview: every half hour, 24h
  }

  function submitBooking(payload) {
    if (CONFIG.apiBase) {
      return fetch(CONFIG.apiBase + "/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (r) { if (!r.ok) throw new Error("book"); return r.json(); });
      // Backend: combine date + time in tz -> instant, re-check free/busy,
      // create the event with a Meet link, invite the client, return { ok:true }.
    }

    if (CONFIG.web3formsKey) {
      return fetch(CONFIG.web3formsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          // A 200 on its own is not proof. Web3Forms answers 200 with
          // success:false for a rejected or throttled key, and treating that
          // as sent would show the visitor a confirmation for an email that
          // never left.
          if (!r.ok || data.success === false) throw new Error("submit");
          return data;
        });
      });
    }

    // Nothing configured. Reject rather than resolve: this used to wait 650ms
    // and then draw the success screen, which told people they were booked
    // when no request had been made at all.
    return Promise.reject(new Error("not configured"));
  }

  function all24() {
    const out = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += CONFIG.eventLengthMin) {
        out.push(pad(h) + ":" + pad(m));
      }
    }
    return out;
  }

  // ---- Day row (starts at today + leadDays) -------------------------
  function buildDays() {
    const row = $("dayRow");
    const dowFmt = new Intl.DateTimeFormat([], { weekday: "short" });
    const monFmt = new Intl.DateTimeFormat([], { month: "short" });
    const start = new Date(); start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + CONFIG.leadDays);

    for (let i = 0; i < CONFIG.daysToShow; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const btn = document.createElement("button");
      btn.className = "day";
      btn.type = "button";
      btn.setAttribute("aria-pressed", "false");
      btn.innerHTML =
        '<span class="dow">' + dowFmt.format(d) + '</span>' +
        '<span class="num">' + d.getDate() + '</span>' +
        '<span class="mon">' + monFmt.format(d) + '</span>';
      btn.addEventListener("click", function () { selectDay(d, btn); });
      row.appendChild(btn);
    }
    const first = row.querySelector(".day");
    if (first) first.click();
  }

  function selectDay(d, btn) {
    state.day = d;
    state.dayStr = ymd(d);
    state.time24 = null;
    state.period = null;
    Array.prototype.forEach.call(document.querySelectorAll("#dayRow .day"),
      function (b) { b.setAttribute("aria-pressed", "false"); });
    btn.setAttribute("aria-pressed", "true");
    $("detailsBlock").classList.add("bsr-hidden");
    loadSlots();
  }

  // Parts of the day. Only the selected one's times are shown, to keep it compact.
  const PERIODS = [
    { key: "morning",   label: "Morning",   lo: 6,  hi: 12 },
    { key: "afternoon", label: "Afternoon", lo: 12, hi: 18 },
    { key: "evening",   label: "Evening",   lo: 18, hi: 24 },
    { key: "night",     label: "Night",     lo: 0,  hi: 6 }
  ];
  function periodOf(t24) {
    const h = hourOf(t24);
    for (let i = 0; i < PERIODS.length; i++) {
      if (h >= PERIODS[i].lo && h < PERIODS[i].hi) return i;
    }
    return 0;
  }
  function timesIn(idx) {
    return state.times.filter(function (t) { return periodOf(t) === idx; });
  }

  function loadSlots() {
    $("periodRow").innerHTML = "";
    $("slotGrid").innerHTML = '<p class="empty">Loading…</p>';
    $("slotEmpty").classList.add("bsr-hidden");
    $("slotHint").classList.add("bsr-hidden");

    fetchAvailability(state.dayStr, state.tz).then(function (times) {
      times.sort();
      state.times = times;
      $("slotGrid").innerHTML = "";

      if (!times.length) {
        $("slotEmpty").classList.remove("bsr-hidden");
        return;
      }
      renderPills();
      state.period = null;                 // nothing shown until a pill is clicked
      $("slotHint").classList.remove("bsr-hidden");
    }).catch(function () {
      $("slotGrid").innerHTML = '<p class="empty">Could not load times. Refresh and try again.</p>';
    });
  }

  function renderPills() {
    const row = $("periodRow");
    row.innerHTML = "";
    PERIODS.forEach(function (p, idx) {
      const n = timesIn(idx).length;
      if (!n) return;
      const b = document.createElement("button");
      b.className = "period";
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      b.dataset.idx = idx;
      b.innerHTML = p.label + '<span class="cnt">' + n + '</span>';
      b.addEventListener("click", function () { setPeriod(idx); });
      row.appendChild(b);
    });
  }

  function setPeriod(idx) {
    if (state.period === idx) {            // click the active pill again -> hide times
      state.period = null;
      Array.prototype.forEach.call(document.querySelectorAll("#periodRow .period"),
        function (b) { b.setAttribute("aria-pressed", "false"); });
      $("slotGrid").innerHTML = "";
      $("slotHint").classList.remove("bsr-hidden");
      return;
    }
    state.period = idx;
    $("slotHint").classList.add("bsr-hidden");
    Array.prototype.forEach.call(document.querySelectorAll("#periodRow .period"),
      function (b) { b.setAttribute("aria-pressed", b.dataset.idx == idx ? "true" : "false"); });
    renderGrid(idx);
  }

  function renderGrid(idx) {
    const grid = $("slotGrid");
    grid.innerHTML = "";
    timesIn(idx).forEach(function (t24) {
      const s = document.createElement("button");
      s.className = "slot";
      s.type = "button";
      s.setAttribute("aria-pressed", t24 === state.time24 ? "true" : "false");
      s.textContent = label12FromStr(t24);
      s.addEventListener("click", function () { selectSlot(t24, s); });
      grid.appendChild(s);
    });
  }

  function selectSlot(t24, el) {
    state.time24 = t24;
    Array.prototype.forEach.call(document.querySelectorAll("#slotGrid .slot"),
      function (b) { b.setAttribute("aria-pressed", "false"); });
    el.setAttribute("aria-pressed", "true");

    const dayFmt = new Intl.DateTimeFormat([], { weekday: "long", month: "long", day: "numeric" });
    $("pickedLine").innerHTML = "Selected: <b>" +
      dayFmt.format(state.day) + " at " + label12FromStr(t24) +
      "</b> · " + tzFriendly(state.tz);
    $("detailsBlock").classList.remove("bsr-hidden");
    validate();
    $("detailsBlock").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // ---- Form ---------------------------------------------------------
  function validate() {
    const ok = state.time24 &&
      $("bName").value.trim() &&
      /\S+@\S+\.\S+/.test($("bEmail").value.trim()) &&
      $("bTopic").value.trim();
    $("confirmBtn").disabled = !ok;
    return ok;
  }
  ["bName", "bEmail", "bTopic"].forEach(function (id) {
    $(id).addEventListener("input", validate);
  });

  function showDone() {
    const dayFmt = new Intl.DateTimeFormat([], { weekday: "long", month: "long", day: "numeric" });
    $("doneWhen").textContent =
      dayFmt.format(state.day) + " at " + label12FromStr(state.time24);
    $("doneMeta").textContent = tzFriendly(state.tz);
    $("bsrFlow").classList.add("bsr-hidden");
    $("bsrDone").classList.remove("bsr-hidden");
    $("bsrDone").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Fires only on a real confirmed booking so ad platforms can attribute it.
  // Guarded: sends to whatever analytics is actually present on the page.
  function fireConversion(p) {
    try {
      if (window.dataLayer) window.dataLayer.push({ event: "booking_confirmed", booking_date: p.date, booking_tz: p.tz });
      if (typeof window.gtag === "function") window.gtag("event", "booking_confirmed", { method: "booking_widget" });
      if (typeof window.fbq === "function") window.fbq("track", "Schedule");
      window.dispatchEvent(new CustomEvent("basirah:booking", { detail: { date: p.date, tz: p.tz } }));
    } catch (e) {}
  }

  $("confirmBtn").addEventListener("click", function () {
    if (!validate()) return;

    // Honeypot tripped -> a bot. Show success but never book or count it.
    if ($("bWebsite").value) { showDone(); return; }

    const btn = $("confirmBtn");
    btn.disabled = true;
    btn.textContent = "Booking…";
    $("errLine").textContent = "";

    // The slot as a person reads it, so the email does not arrive as a bare
    // "2026-09-04 / 06:30" that has to be decoded before it can be answered.
    const dayFmt = new Intl.DateTimeFormat([], { weekday: "long", month: "long", day: "numeric" });
    const slotLabel = dayFmt.format(state.day) + " at " + label12FromStr(state.time24) +
                      " (" + tzFriendly(state.tz) + ")";

    const payload = {
      access_key: CONFIG.web3formsKey,
      subject: "Call booking: " + slotLabel,
      from_name: "Basirah booking widget",
      replyto: $("bEmail").value.trim(),   // so Reply goes to the visitor

      name: $("bName").value.trim(),
      email: $("bEmail").value.trim(),
      slot: slotLabel,
      timezone: state.tz,               // IANA zone, e.g. "America/New_York"
      date: state.dayStr,               // "YYYY-MM-DD"
      time: state.time24,               // "HH:MM" wall time in the chosen tz
      lengthMin: CONFIG.eventLengthMin,
      topic: $("bTopic").value.trim(),
      website: $("bWebsite").value      // honeypot; sent so the far end can reject too
    };

    submitBooking(payload).then(function () {
      fireConversion(payload);
      showDone();
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = "Confirm booking";
      // Nothing here checks a calendar, so a clash is not something this can
      // know about. Say what is actually true: it did not send.
      $("errLine").textContent =
        "That did not send. Please try again, or email hello@basirahanalytics.com";
    });
  });

  buildDays();
})();
