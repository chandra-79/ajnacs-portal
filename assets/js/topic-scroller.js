(() => {
  const refreshInterval = 5 * 60 * 1000;
  const targetPattern = /^\/(?:learn|insights)\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/;

  function validate(payload) {
    const items = Array.isArray(payload) ? payload : payload?.items;
    if (!Array.isArray(items) || !items.length || items.length > 20) return null;
    const targets = new Set();
    for (const item of items) {
      if (!item || typeof item.href !== "string" || !targetPattern.test(item.href) ||
          typeof item.title !== "string" || !item.title.trim() || item.title.length > 240 ||
          targets.has(item.href)) return null;
      targets.add(item.href);
    }
    return items.map(({ href, title }) => ({ href, title: title.trim() }));
  }

  function monitor(scroller) {
    const viewport = scroller.querySelector("[data-scroller-viewport]");
    const list = scroller.querySelector("[data-scroller-list]");
    const mirror = scroller.querySelector("[data-scroller-mirror]");
    const pause = scroller.querySelector("[data-scroller-pause]");
    let displayed = Array.from(list.querySelectorAll("a"), anchor => ({
      href: anchor.getAttribute("href"),
      title: anchor.textContent
    }));
    let pending = null;
    let loading = false;
    let paused = false;
    let pointerLink = null;
    let timer;

    function replaceLinks(container, items, duplicate) {
      const fragment = document.createDocumentFragment();
      for (const { href, title } of items) {
        const li = document.createElement("li");
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.textContent = title;
        if (duplicate) anchor.tabIndex = -1;
        li.append(anchor);
        fragment.append(li);
      }
      container.replaceChildren(fragment);
    }

    function applyPending() {
      if (!pending || document.hidden || paused || scroller.matches(":hover") ||
          scroller.contains(document.activeElement)) return;
      replaceLinks(list, pending, false);
      replaceLinks(mirror, pending, true);
      displayed = pending;
      pending = null;
    }

    async function refresh() {
      if (document.hidden || loading) return;
      loading = true;
      try {
        const response = await fetch("/updates/topic-scroller.json", {
          cache: "no-cache", credentials: "same-origin", headers: { Accept: "application/json" }
        });
        if (!response.ok) return;
        const candidate = validate(await response.json());
        if (!candidate) return;
        const same = candidate.length === displayed.length && candidate.every((item, index) =>
          item.href === displayed[index].href && item.title === displayed[index].title
        );
        pending = same ? null : candidate;
        applyPending();
      } catch {
        // Keep the links built into the page when the feed is unavailable.
      } finally {
        loading = false;
      }
    }

    function manageRefresh() {
      clearInterval(timer);
      if (document.hidden) return;
      applyPending();
      void refresh();
      timer = setInterval(refresh, refreshInterval);
    }

    pause.addEventListener("click", () => {
      paused = !paused;
      scroller.toggleAttribute("data-paused", paused);
      pause.setAttribute("aria-pressed", String(paused));
      applyPending();
    });

    scroller.addEventListener("pointerleave", applyPending);
    scroller.addEventListener("pointerdown", event => {
      pointerLink = event.target.closest("[data-scroller-list] a");
    });
    document.addEventListener("keydown", () => { pointerLink = null; }, true);
    scroller.addEventListener("focusin", event => {
      const anchor = event.target.closest("[data-scroller-list] a");
      if (!anchor) return;
      if (anchor === pointerLink) {
        pointerLink = null;
        return;
      }
      scroller.setAttribute("data-keyboard", "");
      const target = anchor.getBoundingClientRect();
      const port = viewport.getBoundingClientRect();
      if (target.left < port.left + 4) viewport.scrollLeft -= port.left + 4 - target.left;
      if (target.right > port.right - 4) viewport.scrollLeft += target.right - port.right + 4;
    });
    scroller.addEventListener("focusout", () => {
      queueMicrotask(() => {
        if (!list.contains(document.activeElement)) {
          scroller.removeAttribute("data-keyboard");
          viewport.scrollLeft = 0;
        }
        applyPending();
      });
    });

    scroller.setAttribute("data-ready", "");
    pause.hidden = false;
    document.addEventListener("visibilitychange", manageRefresh);
    manageRefresh();
  }

  document.querySelectorAll("[data-topic-scroller]").forEach(monitor);
})();
