/* =====================================================================
   Basirah Analytics: main.js
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
  /* Only in-page hrefs name a section. Now that the site has a second page,
     the nav also carries "/#services" and "/", and passing either of those to
     querySelector throws a SyntaxError that would take the rest of this block
     down with it. */
  var sections = navLinks
    .map(function (link) {
      var href = link.getAttribute('href') || '';
      return href.charAt(0) === '#' ? document.querySelector(href) : null;
    })
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
   PORTFOLIO: filterable grid + inline detail, rendered from PROJECTS.
   ===================================================================== */
(function () {
  'use strict';

  /* -------------------------------------------------------------------
     Real work only. Every figure below comes from the write up in the
     project's own repo, linked from each entry. Both projects state plainly
     that they run on documented demonstration datasets rather than a real
     client's numbers, and the site says the same in the summary and in the
     context line, so neither can be read as a client engagement.

     Shape:
       title      string        required
       slug       string        required, drives the #work-<slug> deep link
       category   string        dashboards | analysis | financial | automation
       headline   string        the one line shown on the tile
       summary    string        short paragraph at the top of the detail
       context    string        who or what it was built on
       tools      string        what it was built with
       scope      string        size of the thing, not an invented duration
       thumb      string|null   tile image; null draws the placeholder visual
       images     string[]      detail visuals; empty draws placeholders
       insights   string[]      required, 3 to 5 findings
       page       string|null   optional case study URL; the tile links there
                                instead of opening the inline detail panel
       repo       string|null   optional public repo; adds a Code row to the snapshot
       caseStudy  object|null   optional { problem, approach, results }
     ------------------------------------------------------------------- */
  var PROJECTS = [
    {
      title: 'Restaurant sales and operations analysis',
      slug: 'restaurant-sales-analysis',
      category: 'analysis',
      headline: 'About 2.4 crore was lost to cancelled orders, nearly all of it on the delivery apps.',
      summary: 'Five outlets across Hyderabad selling dine in alongside Swiggy and Zomato, with two years of orders and no clear read on them. Built on a realistic simulated dataset, so the patterns are believable and the numbers are not a real client’s.',
      context: 'Demonstration dataset, five outlet restaurant',
      tools: 'SQL Server · Power BI · Python',
      scope: 'Two years of orders, 433k in total',
      // extensionless, matching the canonical on the page itself
      page: '/case-studies/restaurant-sales-analysis',
      repo: 'https://github.com/basirah-analytics/restaurant-sales-analysis',
      thumb: 'assets/img/work/restaurant-1.png',
      images: [
        'assets/img/work/restaurant-1.png',
        'assets/img/work/restaurant-2.png',
        'assets/img/work/restaurant-3.png'
      ],
      insights: [
        'About 2.4 crore of revenue was lost to cancelled orders, and almost all of it sat on the delivery apps.',
        'Swiggy and Zomato cancelled roughly 9 to 10 percent of orders against about 3 percent for dine in, so the leak was a channel problem rather than a branch or timing one.',
        'Earned revenue reached about 32.7 crore across the two years, with 2025 running well ahead of 2024.',
        'Main Course and Starters earned the most with biryani close behind, while cheap breakfast and beverage items sold in volume but earned very little.',
        'Sales peaked in March and December and dipped over the summer, which is where promotions are worth aiming.'
      ],
      caseStudy: {
        problem: 'Two years of order data had piled up across five outlets and three sales channels, and nobody had turned it into answers. The owner needed to know what was making money and where it was leaking.',
        approach: 'We checked the data in SQL Server first: row counts, types, value ranges, missing values, duplicates and hidden characters. Then we built one view joining orders to the menu with the sale amount calculated per line, so every later number came from a single trusted table. Each question was answered in SQL and brought together in a three page Power BI report.',
        results: 'The cancellation leak was traced to the delivery channels rather than any branch or time of day, which pointed the fix at the aggregators first. The menu work separated the dishes that carry revenue from the ones that only carry volume, and the seasonal read gave a clear window for promotions. The write up is explicit about what the data cannot show: it holds no cost, customer or table information, so it makes no claim about profit, retention or table turnover.'
      }
    },

    {
      title: 'Rose City Roasters sales and profitability analysis',
      slug: 'rose-city-roasters-analysis',
      category: 'financial',
      headline: 'Revenue kept climbing, but the business was quietly sliding into a loss.',
      summary: 'A specialty coffee business that kept growing sales while profit slipped year after year. We cleaned four years of messy transaction data, modelled it in SQL, and built a three page Power BI dashboard that shows exactly where the money was leaking: sales below cost, heavy discounting, and slow paying wholesale accounts.',
      context: 'Documented demonstration dataset, specialty coffee business',
      tools: 'SQL Server (T-SQL) · Data modeling · Power BI · DAX',
      scope: 'Four years of transactions, over 1 million in total',
      repo: 'https://github.com/basirah-analytics/rose-city-roasters-analysis',
      thumb: 'assets/img/work/rosecity-1.png',
      images: [
        'assets/img/work/rosecity-1.png',
        'assets/img/work/rosecity-2.png'
      ],
      insights: [
        'The business swung from a $187K profit in 2022 to a $525K loss in 2025, while sales kept climbing the whole time.',
        'About $210K was lost on sales priced below what the stock cost.',
        '$1.77M was given away in discounts across the four years.',
        '79% of wholesale invoices were paid late, which is where the cash was tied up.'
      ],
      caseStudy: {
        problem: 'Sales were growing every year and the owner could see that much, but profit was going the other way and nobody could say why. Four years of transaction data existed and none of it had been made to agree.',
        approach: 'We cleaned four years of messy transaction data and modelled it in SQL Server, so every later figure traces back to one trusted table. A three page Power BI report was built on top of it, with the measures written in DAX.',
        results: 'The report traced a swing from a $187K profit in 2022 to a $525K loss in 2025, all while sales were still rising. It then split that swing into the three things causing it: about $210K lost on sales priced below cost, $1.77M given away in discounts over the four years, and 79% of wholesale invoices paid late. Naming them separately is what lets the owner see which to fix first instead of guessing at the whole.'
      }
    }

    /* TODO: student organization analysis.
       Waiting on the real details before this goes on the site. Fill in every
       field below from the actual project and delete this comment. Do not
       estimate or round anything that was not measured.

    ,{
      title: '',
      slug: 'student-organization-analysis',
      category: 'analysis',
      headline: '',
      summary: '',
      context: '',
      tools: '',
      scope: '',
      thumb: null,
      images: [],
      insights: ['', '', ''],
      caseStudy: null
    }
    */
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

  var openedFromGrid = false;   // in-memory only, no browser storage
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

  /* A flat bar motif standing in for a real screenshot. Deliberately abstract:
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
    // A project with its own page links there; the rest keep the inline panel.
    var href = project.page ? esc(project.page) : '#' + SLUG_PREFIX + esc(project.slug);
    return '' +
      '<li class="tile-item" data-category="' + esc(project.category) + '">' +
        '<a class="tile" href="' + href + '" data-slug="' + esc(project.slug) + '">' +
          '<span class="tile-thumb">' + thumbMarkup(project) + '</span>' +
          '<span class="tile-body">' +
            '<span class="tile-meta">' +
              '<span class="tile-cat">' + esc(CATEGORY_LABELS[project.category] || project.category) + '</span>' +
            '</span>' +
            '<span class="tile-title">' + esc(project.title) + '</span>' +
            '<span class="tile-insight">' + esc(project.headline) + '</span>' +
          '</span>' +
        '</a>' +
      '</li>';
  }

  grid.innerHTML = PROJECTS.map(tileMarkup).join('');

  /* ------------------------------ filtering ---------------------------- */
  /* Build the filter row from the categories that exist. Offering a tab that
     always returns nothing reads as an unfinished site, and the set of real
     projects is small enough that empty tabs would be the common case. */
  (function buildFilters() {
    var present = [];
    PROJECTS.forEach(function (p) {
      if (present.indexOf(p.category) === -1) present.push(p.category);
    });
    Array.prototype.forEach.call(filters.querySelectorAll('.filter'), function (btn) {
      var f = btn.getAttribute('data-filter');
      if (f !== 'all' && present.indexOf(f) === -1) btn.remove();
    });
    // a lone "All" tab next to a single category is noise
    if (present.length < 2) filters.hidden = true;
  })();

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
            '<div><dt>Scope</dt><dd>' + esc(project.scope) + '</dd></div>' +
            // only for projects with a public repo; the rest render three rows
            (project.repo
              ? '<div><dt>Code</dt><dd><a href="' + esc(project.repo) + '" target="_blank" rel="noopener">View on GitHub <span aria-hidden="true">&rarr;</span></a></dd></div>'
              : '') +
          '</dl>' +
        '</header>' +

        '<div class="visuals">' + visualsMarkup(project) + '</div>' +

        // Insights, required on every project
        '<section class="insights">' +
          '<h4 class="block-title has-mark">Insights</h4>' +
          '<ol class="insight-list">' +
            project.insights.map(function (line) {
              return '<li>' + esc(line) + '</li>';
            }).join('') +
          '</ol>' +
        '</section>' +

        // Case study, rendered only when the project has one
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
      // back to the tile that was opened, but a hidden tile cannot take focus,
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
    // user actually came back to it: if they clicked a nav link to another
    // section, refocusing here would fight their own navigation.
    if (!detail.hidden) {
      var returning = hash === '' || hash === 'portfolio';
      showGrid(focus && returning);
    }
  }

  grid.addEventListener('click', function (e) {
    var link = e.target.closest('.tile');
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    // a real URL is a real navigation, so do not swallow the click
    if (link.getAttribute('href').charAt(0) !== '#') return;
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
   MOTION + MOBILE DISCLOSURE
   Reveal-on-scroll is opt-in: the .anim class is only added when the
   visitor has not asked for reduced motion, so nothing is ever hidden
   by default. If this file fails to load the page still renders whole.
   ===================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------- reveal on scroll ------------------------- */
  function setupReveal() {
    if (reduced.matches || !('IntersectionObserver' in window)) return;

    var groups = [
      ['.hero-inner > *', 1],
      ['.pains-title', 0], ['.pain', 1],
      ['.section-head', 0], ['.pkg-card', 1],
      ['.resolve', 0], ['.proof-inner > *', 1],
      ['.tile-item', 1],
      ['.ai-copy > *', 1], ['.ai-card', 0],
      // listed individually rather than as .about-body > *, because the
      // section head inside it already has its own entry above and would
      // otherwise be observed twice
      ['.origin', 0], ['.statement', 0], ['.bio', 0],
      ['.contact-intro', 0], ['.bsr-book', 0],
      ['.footer-inner > *', 1]
    ];

    // Only elements below the fold are ever given the hidden state. Anything
    // already on screen is left alone, so a stalled transition or a failed
    // observer can never blank out content the visitor is looking at.
    var fold = window.innerHeight;
    var targets = [];
    groups.forEach(function (g) {
      var stagger = g[1];
      Array.prototype.forEach.call(document.querySelectorAll(g[0]), function (el, i) {
        if (el.getBoundingClientRect().top < fold && !el.closest('.hero')) return;
        el.classList.add('reveal');
        if (stagger) el.setAttribute('data-delay', String(Math.min(i % 6, 5)));
        targets.push(el);
      });
    });

    document.documentElement.classList.add('anim');

    /* Once an element has finished revealing, drop the classes entirely.
       Leaving them on means .anim .reveal.is-in keeps asserting
       `transform: none; opacity: 1` at specificity 0,3,0, which outranks
       state styles like .card.is-picked (0,2,0) and silently cancels them.
       Removing the hooks after the transition ends leaves the element in
       its natural state with nothing left to fight. */
    function markIn(el) {
      el.classList.add('is-in');
      setTimeout(function () {
        el.classList.remove('reveal', 'is-in');
        el.removeAttribute('data-delay');
      }, 1200);                     // 620ms transition + 350ms max stagger
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        markIn(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (el) { io.observe(el); });

    function revealVisible() {
      targets.forEach(function (el) {
        if (el.classList.contains('is-in')) return;
        if (el.getBoundingClientRect().top < window.innerHeight) markIn(el);
      });
    }
    setTimeout(revealVisible, 120);

    // Safety net. Hiding content behind an animation is only acceptable if it
    // cannot get stuck. This measures rendered opacity rather than trusting the
    // class, so it also catches a transition that was started but never
    // advanced. Removing .anim un-hides everything at once.
    setTimeout(function () {
      var stuck = targets.some(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top >= window.innerHeight || r.bottom <= 0) return false;   // off screen, fine
        return parseFloat(getComputedStyle(el).opacity) < 0.95;
      });
      if (stuck) document.documentElement.classList.remove('anim');
    }, 3000);
  }

  /* --------------------- collapse long lists on phones --------------------- */
  var mobile = window.matchMedia('(max-width: 767px)');
  var collapsibles = [];

  /* Adds a toggle before `target` that collapses `hide()` on phones.
     `hide` returns the elements to fold away, so it can be one block or many. */
  function addToggle(anchor, label, hide, insertBefore) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'more-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = label;

    anchor.parentNode.insertBefore(btn, insertBefore || anchor);

    var items = hide();
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      items.forEach(function (el) { el.classList.toggle('is-collapsed', open); });
    });

    collapsibles.push({ btn: btn, items: items });
  }

  function buildCollapsibles() {
    if (collapsibles.length) return;

    // Services card bullets: the longest repeated block on a phone
    Array.prototype.forEach.call(document.querySelectorAll('.card-list'), function (list) {
      addToggle(list, 'What that includes', function () { return [list]; });
    });

    // Portfolio: show three tiles, fold the rest away
    var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile-item'));
    if (tiles.length > 3) {
      var rest = tiles.slice(3);
      var grid = document.getElementById('work-grid');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'more-toggle';
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = 'Show all ' + tiles.length + ' projects';
      grid.parentNode.insertBefore(btn, grid.nextSibling);
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        btn.textContent = open ? 'Show all ' + tiles.length + ' projects' : 'Show fewer';
        rest.forEach(function (el) { el.classList.toggle('is-collapsed', open); });
      });
      collapsibles.push({ btn: btn, items: rest });
    }

    // About: the bio paragraphs sit below the founder note
    var bio = document.querySelector('.bio');
    if (bio) {
      var paras = Array.prototype.slice.call(bio.querySelectorAll('p'));
      if (paras.length) addToggle(bio.querySelector('.block-title'), 'Read more',
        function () { return paras; }, bio.querySelector('.block-title').nextSibling);
    }
  }

  function applyCollapse(on) {
    if (on) buildCollapsibles();
    collapsibles.forEach(function (c) {
      var open = c.btn.getAttribute('aria-expanded') === 'true';
      c.items.forEach(function (el) {
        // desktop always shows everything; the toggles hide themselves in CSS
        el.classList.toggle('is-collapsed', on && !open);
      });
    });
  }

  setupReveal();
  applyCollapse(mobile.matches);
  mobile.addEventListener('change', function (e) { applyCollapse(e.matches); });
})();


/* =====================================================================
   TRUST / PROOF STRIP
   Renders from real client quotes only. While TESTIMONIALS is empty the
   section stays hidden, so the page never shows an empty promise.

   To publish one, add an object below. Nothing else needs touching:

     { quote: 'What they actually said, in their words.',
       name:  'Jane Okafor',
       role:  'Owner',
       org:   'Northfield Kitchens' }        // org is optional

   Only add quotes you genuinely received and have permission to publish.
   An invented endorsement is a deception risk, and it would also poison
   any Review structured data added here later.
   ===================================================================== */
(function () {
  'use strict';

  var TESTIMONIALS = [
    // no real client quotes yet, the section stays hidden until there are
  ];

  var section = document.getElementById('proof');
  var grid = document.getElementById('proof-grid');
  if (!section || !grid) return;

  if (!TESTIMONIALS.length) {
    section.hidden = true;
    return;
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  grid.innerHTML = TESTIMONIALS.slice(0, 3).map(function (t) {
    var org = t.org ? '<span class="proof-org">' + esc(t.org) + '</span>' : '';
    return '<li class="proof-item">' +
             '<blockquote class="proof-quote"><p>' + esc(t.quote) + '</p></blockquote>' +
             '<p class="proof-attr">' + esc(t.name) +
               (t.role ? ', ' + esc(t.role) : '') + org + '</p>' +
           '</li>';
  }).join('');

  section.hidden = false;
})();




/* =====================================================================
   PACKAGES: one expander per card.

   Independent by design: a visitor comparing the Deep Dive against the
   Partner tier needs both open at once, so opening one never closes
   another. The height animation is CSS, this only flips the state.
   ===================================================================== */
(function () {
  'use strict';

  var toggles = document.querySelectorAll('.pkg-toggle');
  if (!toggles.length) return;

  Array.prototype.forEach.call(toggles, function (btn) {
    var card = btn.closest('.pkg-card');
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!card || !panel) return;

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      card.classList.toggle('is-open', !open);
      btn.lastChild.textContent = open ? ' See what’s inside' : ' Hide the detail';
    });
  });

  /* Carries the package name into the contact form, the way choosing a
     service card used to. Without it that link between the two sections
     would have gone out with the old cards. */
  Array.prototype.forEach.call(document.querySelectorAll('.pkg-cta'), function (link) {
    link.addEventListener('click', function () {
      var card = link.closest('.pkg-card');
      var name = card ? card.getAttribute('data-pkg') : '';
      var field = document.getElementById('bTopic');
      if (field && !field.value.trim() && name) field.value = name + ': ';
    });
  });
})();
