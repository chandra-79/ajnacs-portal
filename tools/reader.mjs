import { icon } from "./lib.mjs";

export function copyLinkControl() {
  return `<div class="copy-control">
    <button class="btn btn-ghost btn-sm" id="copyLink" type="button">Copy link</button>
    <span class="sr-only" id="copyStatus" role="status"></span>
    <label class="copy-fallback" id="copyFallback" hidden>Page link
      <input id="copyValue" type="text" readonly>
      <span>Select and copy this link.</span>
    </label>
  </div>`;
}

export function readerControls() {
  return `<div class="read-bar" aria-hidden="true"><span id="readBar"></span></div>

<div class="reader-tools">
  <button class="icon-btn" id="readerBtn" type="button" aria-expanded="false" aria-controls="readerPanel" title="Reading settings" aria-label="Reading settings">${icon.sliders}</button>
  <button class="icon-btn" id="focusBtn" type="button" aria-pressed="false" title="Focus mode" aria-label="Enter focus mode">${icon.expand}</button>
</div>
<div class="reader-panel" id="readerPanel" role="dialog" aria-label="Reading settings" hidden>
  <fieldset><legend>Text size</legend>
    <div class="seg" data-pref="rsize">
      ${[["s","Small","s"],["m","Default",""],["l","Large","l"],["xl","Largest","l"]]
        .map(([v,label,cls]) => `<button type="button" data-val="${v}" aria-pressed="false"><span class="sample ${cls}">Aa</span>${label}</button>`).join("")}
    </div>
  </fieldset>
  <fieldset><legend>Ground</legend>
    <div class="seg" data-pref="theme">
      ${[["light","Light"],["sepia","Sepia"],["dark","Dark"]]
        .map(([v,label]) => `<button type="button" data-val="${v}" aria-pressed="false"><span class="swatch ${v}"></span>${label}</button>`).join("")}
    </div>
  </fieldset>
  <fieldset><legend>Column width</legend>
    <div class="seg" data-pref="rwidth">
      ${[["s","Narrow"],["m","Default"],["l","Wide"],["xl","Widest"]]
        .map(([v,label]) => `<button type="button" data-val="${v}" aria-pressed="false">${label}</button>`).join("")}
    </div>
  </fieldset>
  <fieldset><legend>Typeface</legend>
    <div class="seg" data-pref="rface">
      <button type="button" data-val="sans" aria-pressed="false"><span class="sample">Aa</span>Sans</button>
      <button type="button" data-val="serif" aria-pressed="false"><span class="sample serif">Aa</span>Serif</button>
    </div>
  </fieldset>
  <button class="reader-close btn btn-ghost btn-sm" id="readerClose" type="button">Close settings</button>
  <button class="reader-reset" id="readerReset" type="button">Reset reading layout</button>
  <p class="reader-note">Reading preferences are saved in this browser.</p>
</div>
<button class="focus-exit" id="focusExit" type="button">${icon.collapse} Exit focus</button>
`;
}
