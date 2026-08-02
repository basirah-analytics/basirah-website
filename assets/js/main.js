/* =====================================================================
   Basirah Analytics — main.js
   Vanilla JS, no dependencies, no browser storage.
   Built so far: sticky-nav state, mobile menu, scrollspy.
   TODO (later steps): portfolio filter + inline project detail (#slug).
   ===================================================================== */
(function () {
  'use strict';

  var header = document.getElementById('site-header');
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('nav-toggle');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var mobileQuery = window.matchMedia('(max-width: 767px)');

  /* ---------------- sticky nav: hairline appears once scrolled --------- */
  function onScroll() {
    header.classList.toggle('is-stuck', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------- mobile menu ---------------------------- */
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // close after picking a destination, or on Escape
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a') && mobileQuery.matches) setMenu(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      toggle.focus();
    }
  });

  // never leave the panel stuck open when resizing up to desktop
  mobileQuery.addEventListener('change', function (e) {
    if (!e.matches) setMenu(false);
  });

  /* ------------------------------ scrollspy ---------------------------- */
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  function markCurrent(id) {
    navLinks.forEach(function (link) {
      var on = link.getAttribute('href') === '#' + id;
      link.classList.toggle('is-current', on);
      if (on) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) markCurrent(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }
})();


/* =====================================================================
   PORTFOLIO — filterable grid + inline detail, rendered from PROJECTS.
   ===================================================================== */
(function () {
  'use strict';

  /* -------------------------------------------------------------------
     TODO(placeholder): EVERY PROJECT BELOW IS SAMPLE CONTENT.
     Replace titles, numbers, insights and case-study text with real work
     before this site goes live — none of it describes an actual client.
     While `placeholder: true` is set, the tile shows a small "sample"
     badge. Delete that flag from a project once its content is real.

     Shape (per CLAUDE.md):
       title      string    required
       slug       string    required — used for the #work-<slug> deep link
       category   string    required — dashboards | analysis | financial | automation
       headline   string    required — the one-line insight shown on the tile
       summary    string    required — short paragraph at the top of the detail
       context    string    who it was for
       tools      string    from the canonical list: Power BI · Tableau ·
                            Looker · Excel / Sheets · SQL · Python
       timeline   string    how long it ran
       thumb      string|null   path to the tile image; null draws a placeholder
       images     string[]      detail visuals; empty draws placeholders
       insights   string[]      REQUIRED — 3-5 findings, always rendered
       caseStudy  object|null   OPTIONAL — { problem, approach, results };
                                the block is only rendered when present
     ------------------------------------------------------------------- */
  var PROJECTS = [
    {
      title: 'Menu profitability review',
      slug: 'menu-profitability',
      placeholder: true,   // TODO(placeholder): delete this line once the project is real
      category: 'financial',
      headline: '62% of revenue came from just 3 dishes.',
      summary: 'A four-site restaurant group knew its overall margin was slipping but not which dishes were doing the damage. I rebuilt the menu economics from till exports and supplier invoices.',
      context: 'Restaurant group, 4 sites',
      tools: 'Excel / Sheets · SQL',
      timeline: '3 weeks',
      thumb: null,   // TODO(placeholder): 'assets/img/work/menu-thumb.png'
      images: [],    // TODO(placeholder): add real dashboard screenshots
      insights: [
        '62% of revenue came from just 3 of the 41 dishes on the menu.',
        'Nine dishes were sold below their true plate cost once prep waste was counted.',
        'The highest-margin dish sat at the bottom of the menu card, outsold 6:1 by its neighbour.',
        'Supplier price rises had not been passed through since the menu was last repriced 14 months earlier.'
      ],
      caseStudy: {
        problem: 'Margin had fallen four points over a year with no obvious cause. Costing lived in one spreadsheet, sales in the till system, and nobody had put the two together at dish level.',
        approach: 'I pulled 18 months of item-level till data, joined it to current supplier pricing, and built a true plate cost for every dish including prep waste. Each dish was then plotted on popularity against margin.',
        results: 'Nine loss-making dishes were repriced or cut and the menu card was reordered around the top-margin items. The group now reviews the same view every quarter from a sheet they run themselves.'
      }
    },
    {
      title: 'Stock & sell-through dashboard',
      slug: 'stock-sell-through',
      placeholder: true,   // TODO(placeholder): delete this line once the project is real
      category: 'dashboards',
      headline: 'Dead stock was tying up a third of working capital.',
      summary: 'A retailer buying across 200+ SKUs had no shared view of what was actually moving. I built a live dashboard that ranks stock by sell-through and flags lines that have stalled.',
      context: 'Independent retailer, 2 stores + online',
      tools: 'Power BI · SQL',
      timeline: '4 weeks',
      thumb: null,   // TODO(placeholder)
      images: [],    // TODO(placeholder)
      insights: [
        '34% of stock value sat in lines that had not sold in over 90 days.',
        'Best-selling sizes were routinely out of stock while slow sizes over-ordered.',
        'Online and in-store demand diverged sharply for the same products.',
        'Reorder decisions were being made on gut feel roughly nine days too late.'
      ],
      caseStudy: null
    },
    {
      title: '13-week cash flow model',
      slug: 'cash-flow-model',
      placeholder: true,   // TODO(placeholder): delete this line once the project is real
      category: 'financial',
      headline: 'Spotted a six-week cash gap two months before it hit.',
      summary: 'A services business with lumpy invoicing wanted to stop guessing at cash. I built a rolling 13-week forecast driven by the payment behaviour actually observed in their ledger.',
      context: 'B2B services, ~30 staff',
      tools: 'Excel / Sheets · Python',
      timeline: '2 weeks',
      thumb: null,   // TODO(placeholder)
      images: [],    // TODO(placeholder)
      insights: [
        'A six-week cash gap was visible two months ahead of time.',
        'Two clients paid 40+ days beyond terms and drove most of the volatility.',
        'Payroll and quarterly tax landed in the same week twice a year.',
        'Stated payment terms bore little resemblance to actual payment behaviour.'
      ],
      caseStudy: {
        problem: 'Cash was managed from the bank balance and a mental note of what was due. Twice in the previous year the business had come close to missing payroll despite being profitable.',
        approach: 'I modelled receipts from the real payment behaviour of each client rather than their stated terms, layered in committed costs, and built a rolling 13-week view with a best and worst case.',
        results: 'The gap was closed in advance by pulling one invoice forward and agreeing a short facility. The model is now updated in about ten minutes each Monday.'
      }
    },
    {
      title: 'Subscription churn analysis',
      slug: 'subscription-churn',
      placeholder: true,   // TODO(placeholder): delete this line once the project is real
      category: 'analysis',
      headline: 'Nine in ten cancellations happened before day 30.',
      summary: 'A subscription business was spending heavily on win-back campaigns. The data showed the problem was not late-life churn at all, but the first month.',
      context: 'Consumer subscription app',
      tools: 'SQL · Python',
      timeline: '3 weeks',
      thumb: null,   // TODO(placeholder)
      images: [],    // TODO(placeholder)
      insights: [
        '88% of cancellations happened within the first 30 days.',
        'Users who completed setup in their first session churned at a third of the rate.',
        'Win-back spend was aimed almost entirely at long-tenure users who rarely left.',
        'One acquisition channel brought in volume that never activated at all.'
      ],
      caseStudy: null
    },
    {
      title: 'Weekly reporting automation',
      slug: 'reporting-automation',
      placeholder: true,   // TODO(placeholder): delete this line once the project is real
      category: 'automation',
      headline: 'Eleven hours of manual reporting a week, down to none.',
      summary: 'Three people were rebuilding the same pack every Monday by hand. I replaced the copy-paste with a scheduled pipeline that produces the pack before anyone gets in.',
      context: 'Logistics company, 60+ staff',
      tools: 'Python · SQL · Excel / Sheets',
      timeline: '3 weeks',
      thumb: null,   // TODO(placeholder)
      images: [],    // TODO(placeholder)
      insights: [
        'Roughly 11 hours a week across three people went into one recurring report.',
        'Four of the sixteen tabs had not been looked at by anyone in months.',
        'Two figures in the pack were being calculated inconsistently between sites.',
        'The pack landed on Monday afternoon, a day after the decisions it fed.'
      ],
      caseStudy: {
        problem: 'The Monday pack was assembled by hand from five exports. It was slow, error-prone, and arrived too late to change anything that week.',
        approach: 'I cut the pack down to what people actually used, standardised the two contested metrics, and moved the whole build to a scheduled job that writes the finished file automatically.',
        results: 'The pack is ready before the first shift starts and the manual build is gone. The team kept the time; the inconsistent figures were fixed at source.'
      }
    },
    {
      title: 'Multi-channel marketing dashboard',
      slug: 'marketing-dashboard',
      placeholder: true,   // TODO(placeholder): delete this line once the project is real
      category: 'dashboards',
      headline: 'Two channels were quietly absorbing 40% of spend.',
      summary: 'Marketing spend was reported per platform, so nobody could compare channels on the same basis. I built one view that puts every channel on a common cost-per-customer footing.',
      context: 'E-commerce brand',
      tools: 'Looker · Tableau · SQL',
      timeline: '5 weeks',
      thumb: null,   // TODO(placeholder)
      images: [],    // TODO(placeholder)
      insights: [
        'Two channels took 40% of spend and returned 9% of new customers.',
        'The cheapest channel by cost-per-click was the most expensive per customer.',
        'Reported totals differed from the finance ledger by 12% before reconciliation.',
        'Repeat purchase rates varied more than threefold by acquisition channel.'
      ],
      caseStudy: null
    }
  ];

  var CATEGORY_LABELS = {
    dashboards: 'Dashboards',
    analysis: 'Analysis',
    financial: 'Financial',
    automation: 'Automation'
  };

  var SLUG_PREFIX = 'work-';

  var grid = document.getElementById('work-grid');
  var browse = document.getElementById('work-browse');
  var detail = document.getElementById('work-detail');
  var filters = document.getElementById('work-filters');
  var count = document.getElementById('work-count');
  var section = document.getElementById('portfolio');
  if (!grid || !detail) return;

  var openedFromGrid = false;   // in-memory only — no browser storage
  var lastSlug = null;          // so closing can return focus to the right tile

  /* ------------------------------ helpers ------------------------------ */
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // deterministic 0..1 sequence so each placeholder looks distinct but stable
  function seeded(str) {
    var h = 0, i;
    for (i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return function () {
      h = (h * 1664525 + 1013904223) >>> 0;
      return h / 4294967296;
    };
  }

  /* A flat bar motif standing in for a real screenshot. Deliberately abstract —
     it must never be mistaken for actual client data. */
  function placeholderVisual(seed, label) {
    var rand = seeded(seed);
    var bars = '', i, h;
    for (i = 0; i < 12; i++) {
      h = 12 + Math.round(rand() * 46);
      bars += '<rect x="' + (8 + i * 16) + '" y="' + (64 - h) + '" width="9" height="' + h + '" rx="1"/>';
    }
    return '<div class="ph">' +
             '<svg class="ph-art" viewBox="0 0 200 72" role="presentation" focusable="false" aria-hidden="true">' +
               '<g fill="currentColor">' + bars + '</g>' +
             '</svg>' +
             '<p class="ph-label">' + esc(label) + '</p>' +
           '</div>';
  }

  function thumbMarkup(project) {
    if (project.thumb) {
      return '<img class="tile-img" src="' + esc(project.thumb) + '" alt="" loading="lazy" decoding="async">';
    }
    return placeholderVisual(project.slug, 'visual placeholder');
  }

  /* ------------------------------- tiles ------------------------------- */
  function tileMarkup(project) {
    return '' +
      '<li class="tile-item" data-category="' + esc(project.category) + '">' +
        '<a class="tile" href="#' + SLUG_PREFIX + esc(project.slug) + '" data-slug="' + esc(project.slug) + '">' +
          '<span class="tile-thumb">' + thumbMarkup(project) + '</span>' +
          '<span class="tile-body">' +
            '<span class="tile-meta">' +
              '<span class="tile-cat">' + esc(CATEGORY_LABELS[project.category] || project.category) + '</span>' +
              (project.placeholder ? '<span class="tile-ph">placeholder</span>' : '') +
            '</span>' +
            '<span class="tile-title">' + esc(project.title) + '</span>' +
            '<span class="tile-insight">' + esc(project.headline) + '</span>' +
          '</span>' +
        '</a>' +
      '</li>';
  }

  grid.innerHTML = PROJECTS.map(tileMarkup).join('');

  /* ------------------------------ filtering ---------------------------- */
  var activeFilter = 'all';

  function applyFilter(value) {
    activeFilter = value;
    var shown = 0;

    Array.prototype.forEach.call(grid.children, function (item) {
      var match = value === 'all' || item.getAttribute('data-category') === value;
      item.hidden = !match;
      if (match) shown++;
    });

    Array.prototype.forEach.call(filters.querySelectorAll('.filter'), function (btn) {
      var on = btn.getAttribute('data-filter') === value;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });

    count.textContent = shown + (shown === 1 ? ' project' : ' projects') +
      (value === 'all' ? '' : ' in ' + (CATEGORY_LABELS[value] || value));
  }

  filters.addEventListener('click', function (e) {
    var btn = e.target.closest('.filter');
    if (btn) applyFilter(btn.getAttribute('data-filter'));
  });

  /* ------------------------------- detail ------------------------------ */
  function visualsMarkup(project) {
    if (project.images && project.images.length) {
      return project.images.map(function (src, i) {
        return '<figure class="visual"><img src="' + esc(src) + '" alt="' +
               esc(project.title) + ', dashboard view ' + (i + 1) +
               '" loading="lazy" decoding="async"></figure>';
      }).join('');
    }
    // TODO(placeholder): drops away as soon as real images land in `images[]`
    return '<figure class="visual">' + placeholderVisual(project.slug + 'a', 'dashboard screenshot placeholder') + '</figure>' +
           '<figure class="visual">' + placeholderVisual(project.slug + 'b', 'dashboard screenshot placeholder') + '</figure>';
  }

  function detailMarkup(project) {
    var cs = project.caseStudy;

    return '' +
      '<button class="back" type="button" id="work-back">' +
        '<span aria-hidden="true">&larr;</span> Back to work' +
      '</button>' +

      '<article class="detail">' +
        '<header class="detail-head">' +
          '<p class="detail-cat">' + esc(CATEGORY_LABELS[project.category] || project.category) + '</p>' +
          '<h3 class="detail-title" id="work-detail-title" tabindex="-1">' + esc(project.title) + '</h3>' +
          '<p class="detail-summary">' + esc(project.summary) + '</p>' +
          '<dl class="snapshot">' +
            '<div><dt>Context</dt><dd>' + esc(project.context) + '</dd></div>' +
            '<div><dt>Tools</dt><dd>' + esc(project.tools) + '</dd></div>' +
            '<div><dt>Timeline</dt><dd>' + esc(project.timeline) + '</dd></div>' +
          '</dl>' +
        '</header>' +

        '<div class="visuals">' + visualsMarkup(project) + '</div>' +

        // Insights — required on every project
        '<section class="insights">' +
          '<h4 class="block-title has-mark">Insights</h4>' +
          '<ol class="insight-list">' +
            project.insights.map(function (line) {
              return '<li>' + esc(line) + '</li>';
            }).join('') +
          '</ol>' +
        '</section>' +

        // Case study — rendered only when the project has one
        (cs ? '<section class="case">' +
                '<h4 class="block-title">Case study</h4>' +
                '<div class="case-steps">' +
                  '<div class="case-step"><h5>Problem</h5><p>' + esc(cs.problem) + '</p></div>' +
                  '<div class="case-step"><h5>Approach</h5><p>' + esc(cs.approach) + '</p></div>' +
                  '<div class="case-step"><h5>Results</h5><p>' + esc(cs.results) + '</p></div>' +
                '</div>' +
              '</section>'
            : '') +

        '<div class="detail-cta">' +
          '<p class="detail-cta-text">Want results like this?</p>' +
          '<a class="btn btn-ink btn-lg" href="#contact">Book a free call</a>' +
        '</div>' +
      '</article>';
  }

  function findBySlug(slug) {
    for (var i = 0; i < PROJECTS.length; i++) {
      if (PROJECTS[i].slug === slug) return PROJECTS[i];
    }
    return null;
  }

  function openProject(project, focus) {
    lastSlug = project.slug;
    detail.innerHTML = detailMarkup(project);
    detail.hidden = false;
    browse.hidden = true;

    document.getElementById('work-back').addEventListener('click', closeProject);

    if (focus) {
      var heading = document.getElementById('work-detail-title');
      section.scrollIntoView({ block: 'start' });
      heading.focus({ preventScroll: true });
    }
  }

  function closeProject() {
    if (openedFromGrid && history.length > 1) {
      openedFromGrid = false;
      history.back();          // keeps the browser's own back button honest
      return;
    }
    showGrid(true);
    if (location.hash.indexOf('#' + SLUG_PREFIX) === 0) {
      history.replaceState(null, '', '#portfolio');
    }
  }

  function showGrid(focus) {
    detail.hidden = true;
    detail.innerHTML = '';
    browse.hidden = false;

    if (focus) {
      section.scrollIntoView({ block: 'start' });
      // back to the tile that was opened — but a hidden tile cannot take focus,
      // so fall back to the first visible one, then to the filter buttons.
      var target = lastSlug && grid.querySelector('.tile[data-slug="' + lastSlug + '"]');
      if (!target || target.closest('.tile-item').hidden) {
        var visible = grid.querySelector('.tile-item:not([hidden]) .tile');
        target = visible || filters.querySelector('.filter.is-active');
      }
      if (target) target.focus({ preventScroll: true });
    }
  }

  /* --------------------- routing via the #work-<slug> hash --------------------- */
  function syncFromHash(focus) {
    var hash = location.hash.slice(1);
    if (hash.indexOf(SLUG_PREFIX) === 0) {
      var project = findBySlug(hash.slice(SLUG_PREFIX.length));
      if (project) { openProject(project, focus); return; }
    }
    // Any other hash closes the detail. Focus only returns to the grid when the
    // user actually came back to it — if they clicked a nav link to another
    // section, refocusing here would fight their own navigation.
    if (!detail.hidden) {
      var returning = hash === '' || hash === 'portfolio';
      showGrid(focus && returning);
    }
  }

  grid.addEventListener('click', function (e) {
    var link = e.target.closest('.tile');
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    openedFromGrid = true;
    history.pushState(null, '', link.getAttribute('href'));
    syncFromHash(true);
  });

  window.addEventListener('hashchange', function () { syncFromHash(true); });
  window.addEventListener('popstate', function () { syncFromHash(true); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !detail.hidden) closeProject();
  });

  applyFilter('all');
  syncFromHash(false);   // honour a deep link on first load
})();


/* =====================================================================
   CONTACT — scheduler placeholder.
   Nothing here books anything. It fills in real upcoming weekdays so the
   widget reads as live, but confirming a slot or sending the form only
   surfaces a notice saying so. Both are replaced wholesale when the real
   Calendly / Cal.com embed and a form service are wired up.
   ===================================================================== */
(function () {
  'use strict';

  var daysEl = document.getElementById('sched-days');
  var slotsEl = document.getElementById('sched-slots');
  var monthEl = document.getElementById('sched-month');
  var confirmBtn = document.getElementById('sched-confirm');
  var note = document.getElementById('sched-note');
  var form = document.getElementById('msg-form');
  if (!daysEl || !slotsEl) return;

  // TODO(placeholder): real availability comes from the booking provider
  var SLOTS_BY_DAY = [
    [{ t: '09:30' }, { t: '11:00' }, { t: '14:00', taken: true }, { t: '16:30' }],
    [{ t: '10:00' }, { t: '12:30', taken: true }, { t: '15:00' }],
    [{ t: '09:00' }, { t: '11:30' }, { t: '14:30' }, { t: '17:00' }],
    [{ t: '10:30', taken: true }, { t: '13:00' }, { t: '15:30' }],
    [{ t: '09:30' }, { t: '11:00' }, { t: '13:30' }]
  ];

  var dayButtons = Array.prototype.slice.call(daysEl.querySelectorAll('.day'));
  var selectedDay = 0;
  var selectedSlot = null;

  /* ---- fill the picker with the coming Mon-Fri ---- */
  function weekdayDates() {
    var start = new Date();
    start.setHours(0, 0, 0, 0);
    var ahead = (8 - start.getDay()) % 7 || 7;   // next Monday
    start.setDate(start.getDate() + ahead);

    return dayButtons.map(function (_, i) {
      var d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }

  var dates = weekdayDates();

  dayButtons.forEach(function (btn, i) {
    var d = dates[i];
    btn.querySelector('.day-date').textContent = d.getDate();
    btn.setAttribute('aria-label', d.toLocaleDateString(undefined, {
      weekday: 'long', day: 'numeric', month: 'long'
    }));
  });

  monthEl.textContent = dates[0].toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  /* ---- slots follow the selected day ---- */
  function renderSlots() {
    selectedSlot = null;
    slotsEl.innerHTML = SLOTS_BY_DAY[selectedDay].map(function (slot) {
      return '<button class="slot" type="button" aria-pressed="false"' +
             (slot.taken ? ' disabled aria-label="' + slot.t + ', already booked"' : '') +
             ' data-time="' + slot.t + '">' + slot.t + '</button>';
    }).join('');
    note.textContent = '';
  }

  daysEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.day');
    if (!btn) return;
    selectedDay = Number(btn.getAttribute('data-day'));
    dayButtons.forEach(function (b) {
      var on = b === btn;
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-pressed', String(on));
    });
    renderSlots();
  });

  slotsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.slot');
    if (!btn || btn.disabled) return;
    Array.prototype.forEach.call(slotsEl.children, function (b) {
      var on = b === btn;
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-pressed', String(on));
    });
    selectedSlot = btn.getAttribute('data-time');
    note.textContent = '';
  });

  /* ---- confirming must not look like it booked something ---- */
  confirmBtn.addEventListener('click', function () {
    if (!selectedSlot) {
      note.textContent = 'Pick a time above first.';
      return;
    }
    var when = dates[selectedDay].toLocaleDateString(undefined, {
      weekday: 'long', day: 'numeric', month: 'long'
    });
    note.textContent = when + ' at ' + selectedSlot + '. Booking is not connected yet. ' +
      'This is a placeholder for the Calendly / Cal.com embed; email me and I will confirm the slot.';
  });

  /* ---- short message form: posts to Formspree without leaving the page ---- */
  if (form) {
    var msgNote = document.getElementById('msg-note');
    var sendBtn = form.querySelector('[type="submit"]');
    var sendLabel = sendBtn.textContent;

    // form.elements[...] rather than form.name: on a form element, `name` is also
    // the form's own attribute, so the plain property access is ambiguous.
    function field(n) { return form.elements[n]; }

    function finish(text) {
      sendBtn.disabled = false;
      sendBtn.textContent = sendLabel;
      msgNote.textContent = text;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = field('name').value.trim();
      var email = field('email').value.trim();
      var message = field('message').value.trim();

      if (!name || !email || !message) {
        msgNote.textContent = 'Fill in all three fields first.';
        return;
      }
      if (!field('email').checkValidity()) {
        msgNote.textContent = 'That email address does not look right.';
        return;
      }

      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending';
      msgNote.textContent = '';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            finish('Thanks, I’ll get back to you soon.');
            return;
          }
          // Formspree returns JSON describing what it rejected
          return res.json().then(function (data) {
            var detail = data && data.errors && data.errors.length
              ? data.errors.map(function (err) { return err.message; }).join(', ')
              : 'the form service rejected it';
            finish('That did not send: ' + detail + '. Please email me directly instead.');
          });
        })
        .catch(function () {
          // network failure, or a non-JSON error body
          finish('That did not send, which usually means a connection problem. ' +
                 'Please email me directly instead.');
        });
    });
  }

  renderSlots();
})();

