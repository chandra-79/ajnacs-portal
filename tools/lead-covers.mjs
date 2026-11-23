import { esc } from './lib.mjs';

const art = {
  'sre-toil-reduction': {
    alt: 'Repetitive tickets pass a stopwatch and collect in an automation tray',
    scene: `<path fill="#29485c" d="M0 0h640v360H0z"/><path fill="#416d77" d="M0 255 640 106v254H0z"/>
    <rect x="66" y="193" width="508" height="92" rx="22" fill="#497d80"/><path d="M66 236h508" stroke="#8cb3a3" stroke-dasharray="11 9" stroke-width="3"/>
    <g fill="#e6b879" stroke="#78585a" stroke-width="3"><path d="M86 155h80v101H86z"/><path d="M170 169h80v91h-80z"/><path d="M384 157h76v95h-76z"/></g>
    <path d="M99 182h52m-52 17h45m37-1h55m-54 18h42m216-34h-49m0 18h41" stroke="#986d5b" stroke-width="4"/>
    <path fill="#233c50" d="M258 88h54v21h-54z"/>
    <circle cx="286" cy="184" r="88" fill="#f3e0ad" stroke="#233c50" stroke-width="13"/>
    <circle cx="286" cy="184" r="65" fill="#d6d6a9" stroke="#6d8d78" stroke-width="3"/>
    <path d="M286 126v12m0 90v12m-57-56h10m92 0h12m-57 0 28-23" fill="none" stroke="#3b5f6b" stroke-width="5" stroke-linecap="round"/>
    <path fill="#264752" d="M477 214h107v72H477z"/><path fill="#78aaa1" d="M477 214h107v22H477z"/><path d="m513 257 12 12 22-25" stroke="#d5c58e" stroke-width="5" fill="none"/>`,
  },
  'cloud-unit-economics': {
    alt: 'A cost ledger and a stack of completed orders sit on opposite sides of a balance',
    scene: `<path fill="#ead9aa" d="M0 0h640v360H0z"/><path fill="#d5b77f" d="M0 254 640 165v195H0z"/>
    <path d="M320 74v222m-55 0h111" stroke="#3d5360" stroke-width="12" stroke-linecap="round"/>
    <path d="m107 122 428-35" stroke="#5b6e6c" stroke-width="12" stroke-linecap="round"/>
    <circle cx="320" cy="104" r="20" fill="#a45f56"/><path d="m106 121-56 109h131zm428-34-76 122h140z" fill="none" stroke="#536467" stroke-width="4"/>
    <path fill="#516e6d" d="M47 226h138l-11 24H63zM452 206h150l-18 26H470z"/>
    <g transform="translate(114 186) rotate(-8)"><rect x="-30" y="-43" width="60" height="83" rx="3" fill="#f5e8c4"/><path d="M-18-22h36m-36 12h36m-36 12h36m-36 12h17" stroke="#95694a" stroke-width="3"/></g>
    <path fill="#b76658" d="M481 174h90v31h-90z"/><path fill="#d5a269" d="M491 142h80v31h-80z"/><path fill="#719889" d="M492 113h69v28h-69z"/>
    <path d="M528 115v24m3 6v24m-6 8v26" stroke="#f6e5b6" stroke-width="3"/>`,
  },
  'platform-engineering-idp-2026': {
    alt: 'A sheltered deployment route crosses a ravine with guardrails and self-service stations',
    scene: `<path fill="#b7c8ba" d="M0 0h640v360H0z"/><path fill="#e6ddac" d="M0 0h640v95L0 237z"/>
    <path fill="#6f9190" d="M0 250q167-92 311 11t329-65v164H0z"/><path fill="#416b77" d="M0 300q182-110 320 14t320-54v100H0z"/>
    <path d="M30 184h546m-513 38h482" stroke="#516567" stroke-width="21" stroke-linecap="round"/>
    <path d="M30 166h546m-513 40h482" stroke="#eac991" stroke-width="21" stroke-linecap="round"/>
    <path d="M95 148v77m96-77v77m96-77v77m96-77v77m96-77v77m94-77v77" stroke="#557471" stroke-width="7"/>
    <path d="M30 149h546m-546 77h546" stroke="#557471" stroke-width="5"/>
    <g stroke="#f8dec0" stroke-width="3"><rect x="112" y="114" width="58" height="50" rx="5" fill="#427588"/><rect x="273" y="113" width="58" height="51" rx="5" fill="#a46564"/><rect x="453" y="113" width="58" height="51" rx="5" fill="#6a947b"/></g>
    <path d="M123 128h35m-35 10h27m135-10 10 10 20-20m153 9h30m-30 10h30" stroke="#f4e4b7" stroke-width="3" fill="none"/>
    <path d="M202 182h52m-12-7 12 7-12 7m105-7h73m-12-7 12 7-12 7" stroke="#355967" stroke-width="3" fill="none"/>`,
  },
  'ai-coding-assistants-comparison-2026': {
    alt: 'Three contrasting code suggestions converge on a single human review desk',
    scene: `<path fill="#ddd5e5" d="M0 0h640v360H0z"/><path fill="#a7aac7" d="M0 181 640 105v255H0z"/>
    <path d="M163 132 296 214m22-91v74m163-65-135 83" stroke="#60718e" stroke-width="4" stroke-dasharray="8 6"/>
    <g transform="translate(138 91) rotate(-12)"><rect x="-65" y="-44" width="130" height="92" rx="6" fill="#496b85"/><path d="M-49-19h84m-84 15h56m-56 15h77m-77 15h39" stroke="#c1dbd3" stroke-width="4"/></g>
    <g transform="translate(317 78)"><rect x="-65" y="-42" width="130" height="89" rx="6" fill="#a06272"/><path d="M-49-18h68m-68 15h88m-88 15h58m-58 15h78" stroke="#f6d5b9" stroke-width="4"/></g>
    <g transform="translate(493 91) rotate(12)"><rect x="-65" y="-44" width="130" height="92" rx="6" fill="#4e837b"/><path d="M-49-19h74m-74 15h88m-88 15h58m-58 15h59" stroke="#e4e2b6" stroke-width="4"/></g>
    <path fill="#354a62" d="m187 228 236-22 89 59-237 50z"/>
    <path fill="#f6dfad" d="m245 228 96-16 62 36-104 26z"/><path d="m287 239 45-10m-35 17 48-10m-37 17 58-13" stroke="#8d7767" stroke-width="3"/>
    <circle cx="415" cy="263" r="28" fill="#769e89"/><path d="m403 261 9 8 14-18" fill="none" stroke="#f3edc5" stroke-width="4"/>`,
  },
  'serverless-vs-containers-2026': {
    alt: 'Short bursts of serverless work appear above a continuously running row of containers',
    scene: `<path fill="#3c4c67" d="M0 0h640v360H0z"/><path fill="#4f617b" d="M0 0h640v170H0z"/>
    <path d="M54 164h520" stroke="#a3b7c0" stroke-width="2"/>
    <path d="M54 147h64v-62h52v62h90v-92h54v92h89v-53h42v53h61v-85h48v85h30" fill="none" stroke="#e3b179" stroke-width="7" stroke-linejoin="round"/>
    <path fill="#4e7d7b" d="M54 248h520v36H54z"/><path d="M54 266h520" stroke="#80a494" stroke-width="4"/>
    <g fill="#759b92" stroke="#abc0a8" stroke-width="3"><rect x="89" y="215" width="126" height="74" rx="6"/><rect x="257" y="215" width="126" height="74" rx="6"/><rect x="424" y="215" width="126" height="74" rx="6"/></g>
    <path d="M111 231v42m14-42v42m14-42v42m14-42v42m14-42v42m14-42v42m100-42v42m14-42v42m14-42v42m14-42v42m14-42v42m14-42v42m100-42v42m14-42v42m14-42v42m14-42v42m14-42v42m14-42v42" stroke="#3c6268" stroke-width="3"/>`,
  },
};

export function leadCover(slug, width, height) {
  const cover = art[slug];
  if (!cover) return null;
  return {
    alt: cover.alt,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice"><title>${esc(cover.alt)}</title>${cover.scene}</svg>`,
  };
}
