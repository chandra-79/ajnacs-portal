import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, resolve, sep } from "node:path";

const root = process.cwd();
const profile = await mkdtemp(resolve(tmpdir(), "ajna-browser-"));
const types = {".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8",
  ".mjs":"text/javascript; charset=utf-8", ".svg":"image/svg+xml", ".png":"image/png", ".json":"application/json", ".woff2":"font/woff2"};

function browserChecks() {
  window.addEventListener("load", async function () {
    const check = (condition, label) => { if (!condition) throw new Error(label); };
    const siteWidth = document.documentElement.clientWidth;
    const mode = new URL(location.href).searchParams.get("layout");
    try {
      await document.fonts.ready;
      check(document.documentElement.scrollWidth <= siteWidth + 1, "page exceeds viewport");
      check(document.querySelector(".brand-motion [viewBox]") && document.querySelector(".brand-home .brand-name em"),
        "branded mark and separate wordmark are not mounted");
      check(getComputedStyle(document.querySelector("main h1")).fontFamily.includes("Montserrat"), "title font changed");
      for (const diagram of document.querySelectorAll(".lane-art")) {
        const rect = diagram.getBoundingClientRect();
        check(rect.width > 0 && Math.abs(rect.width / rect.height - 16 / 9) < .035, "schematic aspect ratio changed");
        for (const part of diagram.querySelectorAll(".lane-art__part")) {
          const box = part.getBoundingClientRect();
          check(box.left >= rect.left - 2 && box.right <= rect.right + 2 &&
            box.top >= rect.top - 2 && box.bottom <= rect.bottom + 2, "schematic shape leaves its frame");
        }
      }
      if (mode === "home" || mode === "reduced") {
        const ticker = document.querySelector("[data-topic-scroller]");
        const track = ticker.querySelector(".marquee-track");
        const list = ticker.querySelector("[data-scroller-list]");
        const items = Array.from(list.querySelectorAll("a"));
        check(items.length === 10 && items[0].getAttribute("href").startsWith("/learn/"), "scroller has incorrect topics");
        check(ticker.querySelector("[data-scroller-mirror] a").tabIndex === -1, "duplicate links are tabbable");
        const feed = await fetch("/updates/topic-scroller.json").then(response => response.json());
        check(feed.items.every((item, index) => items[index].getAttribute("href") === item.href), "scroller feed diverges from HTML");
        if (mode === "reduced") {
          check(matchMedia("(prefers-reduced-motion: reduce)").matches, "reduced motion flag did not apply");
          check(getComputedStyle(track).animationName === "none", "reduced-motion scroller is moving");
          check(getComputedStyle(ticker.querySelector("[data-scroller-mirror]")).display === "none", "motion mirror remains visible");
        } else {
          check(getComputedStyle(track).animationDuration === "52s", "existing scroller timing changed");
          items[0].focus({preventScroll: true});
          check(getComputedStyle(track).animationPlayState === "paused", "keyboard focus does not pause");
          check(ticker.hasAttribute("data-keyboard"), "keyboard wrap is missing");
          const viewport = ticker.querySelector("[data-scroller-viewport]").getBoundingClientRect();
          const link = items[0].getBoundingClientRect();
          check(link.left >= viewport.left - 1 && link.right <= viewport.right + 1, "focused topic is clipped");
          items[0].blur();
          const pause = ticker.querySelector("[data-scroller-pause]");
          pause.click();
          check(pause.getAttribute("aria-pressed") === "true" && getComputedStyle(track).animationPlayState === "paused",
            "manual pause is unavailable");
        }
      } else if (mode === "article") {
        const image = document.querySelector(".article-hero img[data-article-art]");
        check(image && image.complete && image.naturalWidth > 0 && getComputedStyle(image).objectFit === "contain", "full article cover is unavailable");
        const next = document.querySelector("[data-lane-next]");
        check(next && next.getAttribute("href") === "/insights/mttr-reduction-playbook/", "wrong reliability continuation");
        check(document.querySelectorAll("[data-lane-related]").length === 2, "incorrect related article count");
      } else if (mode === "search") {
        const search = document.querySelector("#postSearch");
        const results = [...document.querySelectorAll("#postList [data-card]:not([hidden])")];
        check(search.value === "SRE toil" && results.length > 0 && results.length < 24, "compact article search did not filter");
      }
      document.body.dataset.layoutResult = "ok";
    } catch (error) {
      document.body.dataset.layoutResult = "fail";
      const output = document.createElement("pre");
      output.id = "layout-test-error";
      output.textContent = error.message;
      document.body.append(output);
    }
  });
}
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    let file = resolve(root, "." + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + sep)) throw new Error("invalid path");
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    const ext = extname(file);
    response.setHeader("Content-Type", types[ext] || "application/octet-stream");
    const source = await readFile(file);
    response.end(ext === ".html" && url.searchParams.has("layout")
      ? source.toString().replace("</body>", "<script>(" + browserChecks.toString() + ")()</script></body>")
      : source);
  } catch {
    response.writeHead(404);
    response.end();
  }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = "http://127.0.0.1:" + server.address().port;
const lanes = ["reliability","platform-delivery","cloud-finops","systems-architecture","ai-data","security-identity","software-engineering"];
const checks = [
  ["/?layout=home",1440],["/?layout=home",390],["/?layout=reduced",390],
  ...lanes.flatMap(lane => [1440,390].map(width => ["/learn/" + lane + "/?layout=hub",width])),
  ["/insights/sre-toil-reduction/?layout=article",1440],["/insights/sre-toil-reduction/?layout=article",390],
  ["/insights/?layout=search&q=SRE+toil",390]
];

const chrome = spawn(process.env.CHROME_BIN || "google-chrome", [
  "--headless","--no-sandbox","--disable-background-networking","--no-first-run","--disable-gpu","--hide-scrollbars","--disable-dev-shm-usage",
  "--user-data-dir=" + profile,"--remote-debugging-port=9237","about:blank"
], {stdio:["ignore","ignore","pipe"]});
let stderr = "", browserError;
chrome.stderr.setEncoding("utf8").on("data", part => stderr += part);
chrome.once("error", error => { browserError = error; });
const delay = ms => new Promise(resolve => setTimeout(resolve,ms));
async function awaitWhen(poll,label,timeout=10000) {
  const end = Date.now() + timeout;
  let lastError;
  while (Date.now() < end) {
    if (browserError) throw browserError;
    if (chrome.exitCode !== null) throw new Error("Chrome stopped", {cause:stderr.slice(-2000)});
    try { const value = await poll(); if (value) return value; }
    catch (error) { lastError = error; }
    await delay(70);
  }
  throw new Error(label + "\n" + stderr.slice(-2400), {cause:lastError});
}

let browserSocket;
try {
  const targets = await awaitWhen(async () => fetch("http://127.0.0.1:9237/json/list").then(response => response.json()), "Chrome debugger unavailable", 17000);
  const tab = targets.find(target => target.type === "page");
  browserSocket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject) => {
    browserSocket.addEventListener("open",resolve,{once:true});
    browserSocket.addEventListener("error",reject,{once:true});
  });
  let seq = 0;
  const callbacks = new Map();
  browserSocket.addEventListener("message",event => {
    const message = JSON.parse(event.data);
    if (!message.id || !callbacks.has(message.id)) return;
    const {resolve,reject} = callbacks.get(message.id);
    callbacks.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  const send = (method, params = {}) => {
    const id = ++seq;
    return new Promise((resolve,reject) => {
      callbacks.set(id,{resolve,reject});
      browserSocket.send(JSON.stringify({id,method,params}));
    });
  };
  await send("Page.enable");
  for (const [route,width] of checks) {
    const reduce = route.includes("layout=reduced");
    await send("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:false});
    await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:reduce?"reduce":"no-preference"}]});
    const url = origin + route;
    await send("Page.navigate",{url});
    const result = await awaitWhen(async () => {
      const expression = "location.href === " + JSON.stringify(url) +
        " && document.body?.dataset.layoutResult && [document.body.dataset.layoutResult, document.documentElement.clientWidth, document.querySelector('#layout-test-error')?.textContent]";
      return (await send("Runtime.evaluate",{expression,returnByValue:true})).result.value;
    },route + " layout checks timed out");
    assert.equal(result[1],width,route + " used the wrong viewport");
    assert.equal(result[0],"ok",route + " at " + width + "px: " + result[2]);
    console.log("Browser pass " + width + "px " + route);
  }
} finally {
  browserSocket?.close();
  chrome.kill();
  await new Promise(resolve => server.close(resolve));
  await rm(profile,{recursive:true,force:true,maxRetries:3});
}
