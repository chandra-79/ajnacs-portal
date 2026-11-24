import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { models, toil, onboarding, unitCost } from '../assets/js/field-math.mjs';

// Execute the shipped browser script against small, explicit DOM fixtures.
// Network responses and time are controlled; no enquiry is actually sent.
class Element {
  constructor(properties = {}) {
    Object.assign(this, { dataset: {}, style: {}, attrs: {}, queries: {}, events: {}, hidden: false, value: '', textContent: '', disabled: false }, properties);
    const classes = new Set();
    this.classList = { contains: x => classes.has(x), remove: x => classes.delete(x), toggle: (x, force = !classes.has(x)) => { force ? classes.add(x) : classes.delete(x); return force; } };
  }
  addEventListener(name, fn) { (this.events[name] ||= []).push(fn); }
  async emit(name, event = {}) {
    const e = { target: this, preventDefault() {}, stopImmediatePropagation() { this.stopped = true; }, ...event };
    for (const fn of this.events[name] || []) { await fn(e); if (e.stopped) break; }
  }
  dispatchEvent(event) { return this.emit(event.type, event); }
  getAttribute(name) { return this.attrs[name] ?? null; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  removeAttribute(name) { delete this.attrs[name]; }
  querySelectorAll(query) { return this.queries[query] || []; }
  querySelector(query) { return this.querySelectorAll(query)[0] || null; }
  closest() { return this; }
  contains(el) { return this === el || Object.values(this.queries).flat().includes(el); }
  focus() { this.focused = true; }
  select() { this.selected = true; }
}

function browser({ ids = {}, queries = {}, url = 'https://ajnacs.com/insights/', clipboard, fetch = async () => { throw new Error('Unexpected network request'); } } = {}) {
  const document = new Element({ queries, documentElement: new Element() });
  document.getElementById = id => ids[id] || null;
  const window = new Element({ scrollY: 0, innerHeight: 800 });
  const location = new URL(url), storage = new Map(), timers = new Map(), frames = [];
  let timerId = 0;
  const history = { state: { retained: true }, replaceState(state, unused, next) { this.state = state; location.href = String(next); } };
  const context = vm.createContext({ document, window, location, history, navigator: { clipboard }, URL, URLSearchParams, AbortController,
    localStorage: { setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
    setTimeout(fn, delay) { timers.set(++timerId, { fn, delay }); return timerId; }, clearTimeout: id => timers.delete(id),
    requestAnimationFrame: fn => frames.push(fn), fetch,
    FormData: class { constructor(form) { this.form = form; } [Symbol.iterator]() { return Object.entries(this.form.values || {})[Symbol.iterator](); } },
    CustomEvent: class { constructor(type) { this.type = type; } },
  });
  vm.runInContext(readFileSync(new URL('../assets/js/site.js', import.meta.url), 'utf8'), context);
  return { context, document, window, location, history, storage, frames, async tick(delay) {
    for (const [id, timer] of [...timers]) if (timer.delay === delay) { timers.delete(id); await timer.fn(); }
  } };
}

function archive(url) {
  const cards = Array.from({ length: 53 }, (_, i) => new Element({ dataset: { topics: i % 2 ? '|FinOps|' : '|SRE|', search: i % 2 ? 'cloud unit cost' : 'sre toil measurement' }, queries: { '.card-title a': [new Element()] } }));
  const ids = Object.fromEntries(['postSearch','postCount','postTopic','postEmpty','postMore','postClear'].map(id => [id, new Element()]));
  ids.postList = new Element({ queries: { '[data-card]': cards } });
  const chips = ['SRE','FinOps'].map(topicFilter => new Element({ dataset: { topicFilter } }));
  return { ...browser({ ids, queries: { '[data-topic-filter]': chips }, url }), ids, cards, chips };
}

test('archive restores shared search, topic and page; Clear filters resets the URL and keyboard focus', async () => {
  const b = archive('https://ajnacs.com/insights/?q=cloud+cost&topic=FinOps&page=2&campaign=keep');
  assert.equal(b.cards.filter(c => !c.hidden).length, 26);
  assert.equal(b.ids.postSearch.value, 'cloud cost');
  assert.equal(b.ids.postTopic.value, 'FinOps');
  assert.equal(b.chips[1].getAttribute('aria-pressed'), 'true');
  await b.ids.postClear.emit('click');
  assert.equal(b.cards.filter(c => !c.hidden).length, 24);
  assert.equal(b.location.search, '?campaign=keep');
  assert.equal(b.ids.postSearch.focused, true);
  assert.equal(b.history.state.retained, true);
});

test('archive searches independent terms, reports empty results, and restores browser navigation state', async () => {
  const b = archive();
  b.ids.postSearch.value = ' cost   cloud ';
  await b.ids.postSearch.emit('input'); await b.tick(140);
  assert.equal(b.ids.postCount.textContent, 'Showing 24 of 26 articles');
  assert.equal(b.location.search, '?q=cost+cloud');
  b.ids.postSearch.value = 'no matching sentence';
  await b.ids.postSearch.emit('keydown', { key: 'Enter' });
  assert.equal(b.ids.postEmpty.hidden, false);
  assert.equal(b.ids.postMore.hidden, true);
  b.location.search = '?topic=SRE&page=2';
  await b.window.emit('popstate');
  assert.equal(b.cards.filter(c => !c.hidden).length, 27);
  assert.equal(b.ids.postSearch.value, '');
  await b.window.emit('pageshow');
  assert.equal(b.cards.filter(c => !c.hidden).length, 27);
});

test('Show more focuses the first newly revealed article and keeps the batch on reload', async () => {
  const b = archive();
  await b.ids.postMore.emit('click');
  assert.equal(b.cards.filter(c => !c.hidden).length, 48);
  assert.equal(b.cards[24].querySelector('.card-title a').focused, true);
  assert.equal(archive(b.location.href).cards.filter(c => !c.hidden).length, 48);
  await b.ids.postMore.emit('click');
  assert.equal(b.cards.filter(c => !c.hidden).length, 53);
  assert.equal(b.ids.postMore.hidden, true);
});

test('invalid archive parameters cannot hide the entire archive or select an unknown topic', () => {
  const b = archive('https://ajnacs.com/insights/?topic=unknown&page=Infinity');
  assert.equal(b.cards.filter(c => !c.hidden).length, 24);
  assert.equal(b.ids.postTopic.value, '');
});

test('personal notes use the shared search and pagination without requiring article-card markup', async () => {
  const links = Array.from({ length: 25 }, () => new Element());
  const cards = links.map(link => new Element({ dataset: { search: 'learning judgment', topics: '|Learning|' }, queries: { a: [link] } }));
  const ids = { postList: new Element({ dataset: { kind: 'note' }, queries: { '[data-card]': cards } }), postMore: new Element(), postCount: new Element() };
  browser({ ids, url: 'https://ajnacs.com/notes/' });
  assert.equal(ids.postCount.textContent, 'Showing 24 of 25 notes');
  await ids.postMore.emit('click');
  assert.equal(links[24].focused, true);
  assert.equal(ids.postCount.textContent, 'Showing 25 of 25 notes');
});

function copyFixture(clipboard) {
  const ids = Object.fromEntries(['copyLink','copyStatus','copyFallback','copyValue'].map(id => [id, new Element()]));
  ids.copyLink.textContent = 'Copy link'; ids.copyFallback.hidden = true;
  return { ...browser({ ids, clipboard, url: 'https://ajnacs.com/insights/example/#method' }), ids };
}

test('copy failure and unsupported clipboard expose a selected manual link without claiming success', async () => {
  for (const clipboard of [undefined, { async writeText() { throw new Error('Denied'); } }]) {
    const b = copyFixture(clipboard);
    await b.ids.copyLink.emit('click');
    assert.equal(b.ids.copyLink.textContent, 'Copy link');
    assert.equal(b.ids.copyFallback.hidden, false);
    assert.equal(b.ids.copyValue.value, 'https://ajnacs.com/insights/example/');
    assert.equal(b.ids.copyValue.selected, true);
    assert.match(b.ids.copyStatus.textContent, /unavailable/);
  }
});

test('repeated successful copy returns to the original button label', async () => {
  let copied;
  const b = copyFixture({ async writeText(value) { copied = value; } });
  await b.ids.copyLink.emit('click'); await b.ids.copyLink.emit('click');
  assert.equal(copied, 'https://ajnacs.com/insights/example/');
  assert.equal(b.ids.copyLink.textContent, 'Link copied');
  await b.tick(1800);
  assert.equal(b.ids.copyLink.textContent, 'Copy link');
  assert.equal(b.ids.copyLink.disabled, false);
});

function formFixture(fetch) {
  const field = new Element({ name: 'email', type: 'email', required: true, value: 'reader@example.com' });
  const status = new Element(), submit = new Element({ textContent: 'Send enquiry' }), error = new Element();
  const form = new Element({ action: 'https://example.invalid/contact', queries: { '[data-form-status]': [status], '[type=submit]': [submit], 'input,textarea,select': [field], '[data-error-for="email"]': [error], '[aria-invalid="true"]': [field] } });
  form.reset = () => { form.resetCalled = true; field.value = ''; };
  return { ...browser({ queries: { '[data-formspree]': [form] }, fetch }), form, field, status, submit, error };
}

test('contact validation focuses the invalid field and clears the error when edited', async () => {
  const b = formFixture(); b.field.value = '';
  await b.form.emit('submit');
  assert.equal(b.field.focused, true);
  assert.equal(b.field.getAttribute('aria-invalid'), 'true');
  await b.form.emit('input', { target: b.field });
  assert.equal(b.error.textContent, '');
  assert.equal(b.field.getAttribute('aria-invalid'), 'false');
});

test('contact success resets the form; rejection and network failures retain the text', async () => {
  for (const [fetch, success, message] of [
    [async () => ({ ok: true, json: async () => ({}) }), true, /Thank you/],
    [async () => ({ ok: false, json: async () => ({ errors: [{ message: 'Please retry later' }] }) }), false, /retry later/],
    [async () => { throw new Error('Offline'); }, false, /could not confirm/],
  ]) {
    const b = formFixture(fetch); await b.form.emit('submit');
    assert.equal(!!b.form.resetCalled, success);
    assert.equal(b.field.value, success ? '' : 'reader@example.com');
    assert.match(b.status.textContent, message);
    assert.equal(b.submit.disabled, false);
    assert.equal(b.submit.textContent, 'Send enquiry');
  }
});

test('a stalled contact request times out and a duplicate submit cannot send a second enquiry', async () => {
  let requests = 0;
  const b = formFixture(async (url, { signal }) => {
    requests++;
    return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('Aborted'))));
  });
  const pending = b.form.emit('submit');
  assert.equal(b.submit.disabled, true);
  await b.form.emit('submit'); assert.equal(requests, 1);
  await b.tick(15000); await pending;
  assert.match(b.status.textContent, /timed out/);
  assert.equal(b.field.value, 'reader@example.com');
  assert.equal(b.submit.disabled, false);
});

test('reader settings persist, close cleanly, and Escape closes the panel before leaving focus mode', async () => {
  const ids = Object.fromEntries(['readerBtn','readerPanel','readerReset','readerClose','focusBtn','focusExit','themeBtn'].map(id => [id, new Element()]));
  const large = new Element({ dataset: { val: 'l' } });
  const size = new Element({ dataset: { pref: 'rsize' }, queries: { button: [large] } });
  ids.readerPanel.hidden = true; ids.readerPanel.queries.button = [large];
  const b = browser({ ids, queries: { '.seg[data-pref]': [size] } });
  await ids.readerBtn.emit('click'); assert.equal(ids.readerPanel.hidden, false);
  await size.emit('click', { target: large });
  assert.equal(b.storage.get('acs-rsize'), 'l');
  await ids.themeBtn.emit('click'); assert.equal(b.storage.get('acs-theme'), 'dark');
  await ids.focusBtn.emit('click');
  await b.document.emit('keydown', { key: 'Escape' });
  assert.equal(ids.readerPanel.hidden, true);
  assert.equal(b.document.documentElement.getAttribute('data-focus'), 'on');
  await b.document.emit('keydown', { key: 'Escape' });
  assert.equal(b.document.documentElement.getAttribute('data-focus'), 'off');
  await ids.readerReset.emit('click');
  assert.equal(b.storage.has('acs-rsize'), false);
  assert.equal(b.storage.get('acs-theme'), 'dark');
  await ids.readerBtn.emit('click'); await ids.readerClose.emit('click');
  assert.equal(ids.readerPanel.hidden, true);
  assert.equal(ids.readerBtn.focused, true);
});

test('reading progress follows the article, coalesces scroll work, and hides off-screen chapter links', async () => {
  let box = { top: 1000, height: 2000, bottom: 3000 };
  const copy = new Element(); copy.getBoundingClientRect = () => box;
  const ids = Object.fromEntries(['readBar','chapterBar','chapterLeft','siteHeader'].map(id => [id, new Element()]));
  const b = browser({ ids, queries: { '.article-copy': [copy], '.article .prose': [new Element({ textContent: Array(1100).fill('word').join(' ') })] } });
  assert.equal(ids.chapterBar.inert, true);
  box = { top: -600, height: 2000, bottom: 1400 };
  await b.window.emit('scroll'); await b.window.emit('scroll');
  assert.equal(b.frames.length, 1); b.frames.shift()();
  assert.equal(ids.readBar.style.transform, 'scaleX(0.5)');
  assert.equal(ids.chapterBar.inert, false);
  box = { top: -1200, height: 2000, bottom: 800 };
  await b.window.emit('scroll'); b.frames.shift()();
  assert.equal(ids.readBar.style.transform, 'scaleX(1)');
  assert.equal(ids.chapterLeft.textContent, 'Finished');
  assert.equal(ids.chapterBar.inert, true);
});

test('mobile menu closes on nested link clicks and Escape restores the toggle label and focus', async () => {
  const ids = { nav: new Element(), navToggle: new Element() }, b = browser({ ids });
  await ids.navToggle.emit('click'); assert.equal(ids.nav.classList.contains('open'), true);
  await ids.nav.emit('click', { target: new Element() });
  assert.equal(ids.navToggle.getAttribute('aria-label'), 'Open menu');
  await ids.navToggle.emit('click'); await b.document.emit('keydown', { key: 'Escape' });
  assert.equal(ids.nav.classList.contains('open'), false);
  assert.equal(ids.navToggle.focused, true);
});

test('worksheets accept leading decimals, explain missing denominators and handle incomplete cohorts', () => {
  assert.match(toil({ capacity: 100, weeks: 2, before: 20, manual: 8, maintenance: '.5', build: 23 }).result, /5.75 net hours/);
  assert.match(unitCost({ directA: 10, sharedA: 5, completedA: 0, directB: 10, sharedB: 5, completedB: 3 }).result, /unit cost unavailable.*\$5 per order/);
  assert.match(onboarding({ cutoff: 24, ticket: 'open, open', selfService: '.5, 1.5, open' }).result, /0\/2 completed.*median unavailable.*2\/3 completed.*median 1h/);
});

test('worksheets reject overflow and impossible counts without emitting Infinity', () => {
  assert.throws(() => unitCost({ directA: '1e308', sharedA: '1e308', completedA: 1, directB: 0, sharedB: 0, completedB: 1 }), /too large/);
  assert.throws(() => unitCost({ directA: 1, sharedA: 1, completedA: '.5', directB: 0, sharedB: 0, completedB: 1 }), /Check the value/);
  assert.throws(() => toil({ capacity: 10, weeks: 1, before: 20, manual: 1, maintenance: 1, build: 1 }), /available hours/);
  assert.throws(() => onboarding({ cutoff: 24, ticket: '25', selfService: '1' }), /Use open/);
  assert.doesNotMatch(onboarding({ cutoff: '1e308', ticket: '1e308, 1e308', selfService: 'open' }).result, /Infinity/);
});

test('changing a worksheet input invalidates the previous answer; reset clears it too', async () => {
  const output = new Element(), form = new Element({ dataset: { fieldWorksheet: 'unitCost' }, values: { directA: 10, sharedA: 0, completedA: 2, directB: 9, sharedB: 0, completedB: 3 }, queries: { output: [output] } });
  const b = browser({ queries: { '[data-field-worksheet]': [form] } });
  b.context.models = models;
  const source = readFileSync(new URL('../assets/js/field-worksheet.mjs', import.meta.url), 'utf8').replace(/^import.*\n/, '');
  vm.runInContext(source, b.context);
  await form.emit('submit'); assert.match(output.value, /\$5 per order/);
  await form.emit('input'); assert.equal(output.value, '');
  await form.emit('submit'); await form.emit('reset'); assert.equal(output.value, '');
});
