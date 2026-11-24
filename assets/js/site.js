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
      // Goes through writePref so the reading panel's ground buttons stay in
      // step with this one. Sepia is treated as a light ground here.
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      writePref("theme", dark ? "light" : "dark");
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
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open menu");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open menu");
        navToggle.focus();
      }
    });
  }

  var header = $("siteHeader");

  var yr = $("yr");
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- insights filtering + search ---------- */
  var listEl = $("postList");
  if (listEl) {
    var cards = [].slice.call(listEl.querySelectorAll("[data-card]"));
    var searchEl = $("postSearch"), countEl = $("postCount"), topicSelect = $("postTopic");
    var chips = [].slice.call(document.querySelectorAll("[data-topic-filter]"));
    var emptyEl = $("postEmpty"), moreBtn = $("postMore"), clearBtn = $("postClear");
    var activeTopic = "", query = "", queryTerms = [];
    var PAGE = 24, shown = PAGE, searchTimer;

    function setQuery(value) {
      query = value.trim().replace(/\s+/g, " ");
      queryTerms = query.toLowerCase().split(" ").filter(Boolean);
    }

    function matches(card) {
      return (!activeTopic || card.dataset.topics.includes("|" + activeTopic + "|")) &&
        queryTerms.every(function (term) { return card.dataset.search.includes(term); });
    }

    function syncFilters() {
      if (topicSelect) topicSelect.value = activeTopic;
      if (clearBtn) clearBtn.hidden = !(activeTopic || query);
      chips.forEach(function (chip) {
        chip.setAttribute("aria-pressed", String(chip.dataset.topicFilter === activeTopic));
      });
    }

    function saveSearch() {
      var url = new URL(location.href);
      if (query) url.searchParams.set("q", query);
      else url.searchParams.delete("q");
      if (activeTopic) url.searchParams.set("topic", activeTopic);
      else url.searchParams.delete("topic");
      if (shown > PAGE) url.searchParams.set("page", String(Math.ceil(shown / PAGE)));
      else url.searchParams.delete("page");
      try { history.replaceState(history.state, "", url); } catch (e) {}
    }

    function apply(resetPage) {
      if (resetPage) shown = PAGE;
      var n = 0, visible = 0;
      cards.forEach(function (card) {
        var match = matches(card);
        if (match) n++;
        card.hidden = !match || n > shown;
        if (!card.hidden) visible++;
      });
      if (countEl) countEl.textContent = "Showing " + visible + " of " + n + (n === 1 ? " article" : " articles");
      if (emptyEl) emptyEl.hidden = n !== 0;
      if (moreBtn) {
        moreBtn.hidden = n <= visible;
        moreBtn.textContent = "Show " + Math.min(PAGE, n - visible) + " more";
      }
      syncFilters();
    }

    function restoreSearch() {
      clearTimeout(searchTimer);
      var params = new URLSearchParams(location.search);
      var topic = params.get("topic") || "";
      activeTopic = cards.some(function (card) { return card.dataset.topics.includes("|" + topic + "|"); }) ? topic : "";
      setQuery(params.get("q") || "");
      if (searchEl) searchEl.value = query;
      var page = Number(params.get("page"));
      shown = Number.isSafeInteger(page) && page > 0
        ? Math.min(page, Math.max(1, Math.ceil(cards.length / PAGE))) * PAGE : PAGE;
      apply(false);
    }

    function updateSearch() {
      clearTimeout(searchTimer);
      setQuery(searchEl ? searchEl.value : "");
      apply(true);
      saveSearch();
    }

    if (searchEl) {
      searchEl.addEventListener("input", function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(updateSearch, 140);
      });
      searchEl.addEventListener("change", updateSearch);
      searchEl.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          updateSearch();
        }
      });
    }
    function selectTopic(value) {
      activeTopic = value;
      updateSearch();
    }
    if (topicSelect) {
      topicSelect.hidden = false;
      topicSelect.addEventListener("change", function () { selectTopic(topicSelect.value); });
    }
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var value = chip.dataset.topicFilter;
        selectTopic(activeTopic === value ? "" : value);
      });
    });
    if (clearBtn) clearBtn.addEventListener("click", function () {
      activeTopic = "";
      if (searchEl) searchEl.value = "";
      updateSearch();
      if (searchEl) searchEl.focus();
    });
    if (moreBtn) moreBtn.addEventListener("click", function () {
      var firstNew = cards.find(function (card) { return card.hidden && matches(card); });
      shown += PAGE;
      apply(false);
      saveSearch();
      var link = firstNew && firstNew.querySelector(".card-title a");
      if (link) link.focus();
    });
    window.addEventListener("popstate", restoreSearch);
    window.addEventListener("pageshow", restoreSearch);
    restoreSearch();
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

    var sending = false;
    form.addEventListener("input", function (event) {
      if (event.target.name) setError(event.target, "");
    });
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (sending) return;
      if (status) { status.textContent = ""; status.className = "form-note"; }
      if (!validate()) {
        var bad = form.querySelector('[aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      sending = true;
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 15000);
      try {
        var response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        var data = await response.json().catch(function () { return {}; });
        if (response.ok) {
          form.reset();
          if (status) {
            status.textContent = form.getAttribute("data-success") || "Thank you — we will reply shortly.";
            status.style.color = "var(--green)";
          }
          form.dispatchEvent(new CustomEvent("formsent", { bubbles: true }));
        } else if (status) {
          status.textContent = (Array.isArray(data.errors) && data.errors.map(function (error) { return error.message; }).join(", "))
            || "That did not send. Your text is still here. Try again or email info@ajnacs.com.";
          status.style.color = "var(--red)";
        }
      } catch (error) {
        if (status) {
          status.textContent = controller.signal.aborted
            ? "Delivery confirmation timed out. Your text is still here. You can retry or email info@ajnacs.com."
            : "We could not confirm delivery. Your text is still here. Try again or email info@ajnacs.com.";
          status.style.color = "var(--red)";
        }
      } finally {
        clearTimeout(timer);
        sending = false;
        if (btn) { btn.disabled = false; btn.textContent = btnText; }
      }
    });
  }
  [].slice.call(document.querySelectorAll("[data-formspree]")).forEach(wireForm);

  /* ---------- copy link on articles ---------- */
  var copyBtn = $("copyLink"), copyStatus = $("copyStatus");
  if (copyBtn) {
    var copyLabel = copyBtn.textContent, copyTimer;
    var copyFallback = $("copyFallback"), copyValue = $("copyValue");
    copyBtn.addEventListener("click", async function () {
      if (copyBtn.disabled) return;
      clearTimeout(copyTimer);
      copyBtn.disabled = true;
      var url = location.href.split("#")[0];
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(url);
        if (copyFallback) copyFallback.hidden = true;
        copyBtn.textContent = "Link copied";
        if (copyStatus) copyStatus.textContent = "Page link copied to the clipboard.";
        copyTimer = setTimeout(function () { copyBtn.textContent = copyLabel; }, 1800);
      } catch (error) {
        copyBtn.textContent = copyLabel;
        if (copyStatus) copyStatus.textContent = "Automatic copying is unavailable. Select and copy the page link.";
        if (copyFallback && copyValue) {
          copyFallback.hidden = false;
          copyValue.value = url;
          copyValue.focus();
          copyValue.select();
        }
      } finally {
        copyBtn.disabled = false;
      }
    });
  }

  /* ---------- reader ----------
     Preferences live on <html> as data attributes; the CSS reads them as
     tokens. Everything here is per-browser by design: there is no account to
     hang it on, and pretending otherwise would lose someone's settings
     silently on their next device. */
  var PREFS = { theme: "acs-theme", rsize: "acs-rsize", rwidth: "acs-rwidth", rface: "acs-rface" };
  var root = document.documentElement;

  function readPref(name) {
    if (name === "theme") return root.getAttribute("data-theme") || "light";
    return root.getAttribute("data-" + name) || (name === "rface" ? "sans" : "m");
  }
  function writePref(name, value) {
    root.setAttribute(name === "theme" ? "data-theme" : "data-" + name, value);
    try { localStorage.setItem(PREFS[name], value); } catch (e) {}
    if (name === "theme" && typeof syncTheme === "function") syncTheme();
    syncSegs();
    scheduleReading();
  }

  var segs = [].slice.call(document.querySelectorAll(".seg[data-pref]"));
  function syncSegs() {
    segs.forEach(function (seg) {
      var current = readPref(seg.dataset.pref);
      [].slice.call(seg.querySelectorAll("button")).forEach(function (b) {
        b.setAttribute("aria-pressed", b.dataset.val === current ? "true" : "false");
      });
    });
  }
  segs.forEach(function (seg) {
    seg.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-val]");
      if (b) writePref(seg.dataset.pref, b.dataset.val);
    });
  });
  syncSegs();

  var readerBtn = $("readerBtn"), readerPanel = $("readerPanel"), readerReset = $("readerReset");
  if (readerBtn && readerPanel) {
    var closePanel = function (refocus) {
      readerPanel.hidden = true;
      readerBtn.setAttribute("aria-expanded", "false");
      if (refocus) readerBtn.focus();
    };
    $("readerClose").addEventListener("click", function () { closePanel(true); });
    readerPanel.addEventListener("focusout", function (event) {
      if (event.relatedTarget && !readerPanel.contains(event.relatedTarget) && event.relatedTarget !== readerBtn) closePanel(false);
    });
    readerBtn.addEventListener("click", function () {
      var open = readerPanel.hidden;
      readerPanel.hidden = !open;
      readerBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) { var f = readerPanel.querySelector("button"); if (f) f.focus(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !readerPanel.hidden) {
        closePanel(true);
        e.stopImmediatePropagation();
      }
    });
    document.addEventListener("click", function (e) {
      if (readerPanel.hidden) return;
      if (!readerPanel.contains(e.target) && !readerBtn.contains(e.target)) closePanel(false);
    });
  }
  if (readerReset) {
    readerReset.addEventListener("click", function () {
      ["rsize", "rwidth", "rface"].forEach(function (k) {
        root.removeAttribute("data-" + k);
        try { localStorage.removeItem(PREFS[k]); } catch (e) {}
      });
      syncSegs();
      scheduleReading();
    });
  }

  /* ---------- focus mode ---------- */
  var focusBtn = $("focusBtn"), focusExit = $("focusExit");
  function setFocus(on) {
    root.setAttribute("data-focus", on ? "on" : "off");
    if (focusBtn) {
      focusBtn.setAttribute("aria-pressed", on ? "true" : "false");
      focusBtn.setAttribute("aria-label", on ? "Exit focus mode" : "Enter focus mode");
    }
    if (!on && focusBtn) focusBtn.focus();
    scheduleReading();
  }
  if (focusBtn) focusBtn.addEventListener("click", function () {
    setFocus(root.getAttribute("data-focus") !== "on");
  });
  if (focusExit) focusExit.addEventListener("click", function () { setFocus(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && root.getAttribute("data-focus") === "on") setFocus(false);
  });

  /* ---------- reading progress ---------- */
  var bar = $("readBar"), chapterBar = $("chapterBar"), chapterLeft = $("chapterLeft");
  var copyEl = document.querySelector(".article-copy");
  var proseEl = document.querySelector(".article .prose");
  var words = proseEl ? (proseEl.textContent || "").trim().split(/\s+/).length : 0;
  var scrollQueued = false, lastStuck, lastProgress = -1, lastLeft = -1, lastChapter;
  function updateReading() {
    scrollQueued = false;
    // Read geometry before changing styles. A transform avoids resizing the bar.
    var stuck = window.scrollY > 8;
    var box = copyEl && copyEl.getBoundingClientRect();
    var progress = box ? (box.height > window.innerHeight
      ? Math.min(1, Math.max(0, -box.top / (box.height - window.innerHeight)))
      : (box.bottom <= window.innerHeight ? 1 : 0)) : 0;
    var showChapter = !!box && box.top < window.innerHeight * 0.4 && progress < 0.999;
    if (header && stuck !== lastStuck) {
      lastStuck = stuck;
      header.classList.toggle("is-stuck", stuck);
    }
    if (bar && progress !== lastProgress) {
      lastProgress = progress;
      bar.style.transform = "scaleX(" + progress + ")";
    }
    if (chapterBar && showChapter !== lastChapter) {
      lastChapter = showChapter;
      chapterBar.classList.toggle("is-on", showChapter);
      chapterBar.inert = !showChapter;
    }
    if (chapterLeft) {
      var left = Math.max(0, Math.round(words * (1 - progress) / 220));
      if (left !== lastLeft) {
        lastLeft = left;
        chapterLeft.textContent = left > 0 ? left + " min left" : "Finished";
      }
    }
  }
  function scheduleReading() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(updateReading);
  }
  window.addEventListener("scroll", scheduleReading, { passive: true });
  window.addEventListener("resize", scheduleReading);
  if (copyEl && typeof ResizeObserver !== "undefined") {
    new ResizeObserver(scheduleReading).observe(copyEl);
  }
  if (document.fonts) document.fonts.ready.then(scheduleReading);
  updateReading();
})();
