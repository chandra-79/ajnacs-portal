/* ajnacs.com — no framework, no build step. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- theme ---------- */
  var themeBtn = $("themeBtn");
  function syncTheme() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    if (!themeBtn) return;
    themeBtn.setAttribute("aria-pressed", dark ? "true" : "false");
    themeBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", dark ? "#0a1020" : "#ffffff");
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      var next = dark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("acs-theme", next); } catch (e) {}
      syncTheme();
    });
    syncTheme();
  }

  /* ---------- nav ---------- */
  var nav = $("nav"), navToggle = $("navToggle");
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.focus();
      }
    });
  }

  var header = $("siteHeader");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-stuck", window.scrollY > 8); };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  var yr = $("yr");
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- insights filtering + search ---------- */
  var listEl = $("postList");
  if (listEl) {
    var cards = [].slice.call(listEl.querySelectorAll("[data-card]"));
    var searchEl = $("postSearch");
    var countEl = $("postCount");
    var chips = [].slice.call(document.querySelectorAll("[data-topic-filter]"));
    var emptyEl = $("postEmpty");
    var moreBtn = $("postMore");
    var activeTopic = "";
    var query = "";
    var PAGE = 24;
    var shown = PAGE;

    function matches(card) {
      if (activeTopic && card.dataset.topics.indexOf("|" + activeTopic + "|") === -1) return false;
      if (query && card.dataset.search.indexOf(query) === -1) return false;
      return true;
    }

    function apply(resetPage) {
      if (resetPage) shown = PAGE;
      var n = 0, visible = 0;
      for (var i = 0; i < cards.length; i++) {
        var ok = matches(cards[i]);
        if (ok) {
          n++;
          var show = n <= shown;
          cards[i].hidden = !show;
          if (show) visible++;
        } else {
          cards[i].hidden = true;
        }
      }
      // Only report a count while the reader is actually filtering; the total
      // is not something to advertise.
      if (countEl) {
        const filtering = !!(activeTopic || query);
        countEl.textContent = filtering ? (n === 1 ? "1 match" : n + " matches") : "";
      }
      if (emptyEl) emptyEl.hidden = n !== 0;
      if (moreBtn) moreBtn.hidden = n <= visible ? true : false;
    }

    if (searchEl) {
      var t;
      searchEl.addEventListener("input", function () {
        clearTimeout(t);
        t = setTimeout(function () { query = searchEl.value.trim().toLowerCase(); apply(true); }, 140);
      });
    }
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var v = chip.dataset.topicFilter;
        activeTopic = activeTopic === v ? "" : v;
        chips.forEach(function (c) {
          var on = c.dataset.topicFilter === activeTopic;
          c.setAttribute("aria-pressed", on ? "true" : "false");
        });
        apply(true);
      });
    });
    if (moreBtn) moreBtn.addEventListener("click", function () { shown += PAGE; apply(false); });

    // a ?topic= in the URL preselects a filter
    try {
      var qp = new URLSearchParams(location.search).get("topic");
      if (qp) {
        activeTopic = qp;
        chips.forEach(function (c) { c.setAttribute("aria-pressed", c.dataset.topicFilter === qp ? "true" : "false"); });
      }
    } catch (e) {}
    apply(true);
  }

  /* ---------- article progress + heading links ---------- */
  var bar = $("readBar");
  if (bar) {
    var tick = function () {
      var el = document.documentElement;
      var max = el.scrollHeight - el.clientHeight;
      bar.style.width = (max > 0 ? (el.scrollTop / max) * 100 : 0) + "%";
    };
    addEventListener("scroll", tick, { passive: true });
    addEventListener("resize", tick);
    tick();
  }

  /* ---------- forms (Formspree, AJAX so the visitor stays on the page) ---------- */
  function wireForm(form) {
    if (!form) return;
    var status = form.querySelector("[data-form-status]");
    var btn = form.querySelector("[type=submit]");
    var btnText = btn ? btn.textContent : "";

    function setError(field, msg) {
      var box = form.querySelector('[data-error-for="' + field.name + '"]');
      if (box) box.textContent = msg || "";
      field.setAttribute("aria-invalid", msg ? "true" : "false");
    }

    function validate() {
      var ok = true;
      [].slice.call(form.querySelectorAll("input,textarea,select")).forEach(function (f) {
        if (!f.name || f.type === "hidden") return;
        var msg = "";
        if (f.required && !f.value.trim()) msg = "This field is required.";
        else if (f.type === "email" && f.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value)) msg = "Enter a valid email address.";
        if (msg) ok = false;
        setError(f, msg);
      });
      return ok;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (status) { status.textContent = ""; status.className = "form-note"; }
      if (!validate()) {
        var bad = form.querySelector('[aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          return { ok: res.ok, data: data };
        });
      }).then(function (r) {
        if (btn) { btn.disabled = false; btn.textContent = btnText; }
        if (r.ok) {
          var done = form.getAttribute("data-success");
          form.reset();
          if (status) {
            status.textContent = done || "Thank you — we will reply shortly.";
            status.className = "form-note";
            status.style.color = "var(--green)";
          }
          form.dispatchEvent(new CustomEvent("formsent", { bubbles: true }));
        } else {
          var msg = (r.data && r.data.errors && r.data.errors.map(function (x) { return x.message; }).join(", "))
            || "That did not send. Please email " + "info@ajnacs.com" + " instead.";
          if (status) { status.textContent = msg; status.style.color = "var(--red)"; }
        }
      }).catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = btnText; }
        if (status) {
          status.textContent = "Network error. Please email info@ajnacs.com instead.";
          status.style.color = "var(--red)";
        }
      });
    });
  }
  [].slice.call(document.querySelectorAll("[data-formspree]")).forEach(wireForm);

  /* ---------- copy link on articles ---------- */
  var copyBtn = $("copyLink");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var url = location.href.split("#")[0];
      var done = function () {
        var old = copyBtn.textContent;
        copyBtn.textContent = "Link copied";
        setTimeout(function () { copyBtn.textContent = old; }, 1800);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () {});
      else done();
    });
  }
})();
