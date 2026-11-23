import { esc } from './lib.mjs';

const scenes = {
  'architecture-audit': `
    <path fill="#dce7e8" d="M0 0h640v360H0z"/><path fill="#8daab0" d="M0 231 640 92v268H0z"/>
    <g stroke="#456075" stroke-width="3" stroke-linejoin="round">
      <path fill="#6b8ca1" d="m91 188 229-108 211 93-230 109z"/><path fill="#35566d" d="m91 188 210 94 230-109v20L301 305 91 210z"/>
      <path fill="#8aabb5" d="m103 138 224-98 200 91-223 100z"/><path fill="#678696" d="m103 138 201 93 223-100v18L304 254 103 158z"/>
    </g>
    <path d="m162 143 115 52 82-34-37-17 73-33 71 32" fill="none" stroke="#fcf0c8" stroke-width="10" stroke-linejoin="round"/>
    <path d="m330 148 34 14-33 14" fill="none" stroke="#e8875e" stroke-width="17" stroke-linecap="round"/>
    <path d="m441 205 110 90" stroke="#3a4261" stroke-width="25" stroke-linecap="round"/>
    <circle cx="371" cy="148" r="94" fill="#f1d9a6" fill-opacity=".25" stroke="#384b65" stroke-width="17"/>
    <path d="M323 100q24-27 58-24" fill="none" stroke="#f7f1dc" stroke-width="7" stroke-linecap="round"/>`,
  'legacy-modernisation': `
    <path fill="#efe1c7" d="M0 0h640v360H0z"/><path fill="#c9c2a2" d="M0 257q269 15 640-61v164H0z"/>
    <g stroke="#6b7169" stroke-width="13" fill="none"><path d="M18 185h202q78 0 119-43l68-67h178M217 185q72 0 118 44l48 45h205M228 185h361"/></g>
    <g stroke="#f5e9c6" stroke-width="3" stroke-dasharray="6 8" fill="none"><path d="M18 185h202q78 0 119-43l68-67h178M217 185q72 0 118 44l48 45h205M228 185h361"/></g>
    <rect x="45" y="137" width="121" height="97" rx="5" fill="#35595c"/><path d="M58 159h92m-92 20h92m-92 20h92" stroke="#a9b499" stroke-width="7"/>
    <circle cx="268" cy="185" r="16" fill="#ad604b"/><path d="m269 176 39-52" stroke="#77584c" stroke-width="9" stroke-linecap="round"/>
    <path fill="#9173a2" d="M435 50h103v49H435z"/><path fill="#51918a" d="M466 159h99v51h-99z"/><path fill="#d79857" d="M417 252h104v45H417z"/>
    <path d="M447 63h53m-20 112h64m-115 90h62" stroke="#fff0c7" stroke-width="4"/>`,
  'ai-into-production': `
    <path fill="#282d4a" d="M0 0h640v360H0z"/><path fill="#404267" d="M0 273 640 82v278H0z"/>
    <path d="M80 201h474m-30-19 32 19-32 19" fill="none" stroke="#dcb37f" stroke-width="4"/>
    <g fill="#b879ac" stroke="#f2add0" stroke-width="3"><path d="m95 155 65-37 67 31-64 38z"/><path d="m95 181 65-37 67 31-64 38z"/><path d="m95 208 65-37 67 31-64 38z"/></g>
    <path fill="#87aeb6" d="M293 87h27v205h-27zM363 87h27v205h-27zM293 87h97v26h-97z"/>
    <rect x="314" y="142" width="55" height="75" rx="5" fill="#e5ba84"/><path d="m324 181 12 11 21-28" fill="none" stroke="#3b4a68" stroke-width="5"/>
    <rect x="463" y="119" width="89" height="112" rx="5" fill="#19243b" stroke="#96b7ba" stroke-width="3"/>
    <path d="M478 142h58m-58 23h58m-58 23h58m-58 24h58" stroke="#6c8fa0" stroke-width="6"/>
    <circle cx="532" cy="166" r="4" fill="#efbc84"/><circle cx="532" cy="189" r="4" fill="#add4ad"/>`,
  'team-enablement': `
    <path fill="#b0c7b7" d="M0 0h640v360H0z"/><path fill="#dae0c6" d="M0 0h640v132L0 292z"/>
    <path fill="#49686a" d="m90 111 388-61 95 165-393 68z"/><path fill="#6c8a7b" d="m90 108 388-64 97 162-397 70z"/>
    <g fill="#284958" stroke="#bfd0ae" stroke-width="4"><path d="m126 123 93-19 40 50-94 15z"/><path d="m255 102 93-19 40 50-93 18z"/><path d="m385 81 94-19 40 49-94 20z"/></g>
    <path d="m151 137 51-9m81-13 48-10m82-9 49-10" stroke="#8dc1ac" stroke-width="4"/>
    <path stroke="#6e665c" stroke-width="3" d="M166 168l15 25m115-41 15 24m114-46 15 25"/>
    <path fill="#e2b07f" d="m267 207 56-27 81 3 20 61-87 19-53 6z"/>
    <path fill="#f5e7bc" d="m267 199 56-29 81 4 19 58-86 21-53 7z"/>
    <path d="m323 170 14 83m-52-39 34-17m-30 27 32-13m21-8 43-10m-41 22 50-12m-49 23 33-8" fill="none" stroke="#996d64" stroke-width="2"/>
    <path d="m443 231 62-25" stroke="#be755c" stroke-width="7" stroke-linecap="round"/>`,
};

export function caseCoverArt(slug, alt, width = 960) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width * 9 / 16}" viewBox="0 0 640 360" role="img" aria-label="${esc(alt)}" data-article-art="${slug}"><title>${esc(alt)}</title>${scenes[slug]}</svg>`;
}
