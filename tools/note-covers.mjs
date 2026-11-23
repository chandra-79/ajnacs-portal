import { esc } from './lib.mjs';

// Notes are personal essays. Each cover is composed individually so the
// photography-like scenes, paper cutouts and graphic metaphors can coexist.
const covers = {
  'on-moving-countries': {
    alt: 'An open rust-coloured suitcase holding a passport, a key and a family photograph',
    art: `<path fill="#67bcb7" d="M0 0h640v360H0z"/>
    <path fill="#a9d6cc" d="M0 78 194 0h446v126L0 329z"/><path fill="#2c777e" d="M441 360h199V200z"/>
    <g transform="translate(308 174) rotate(-15)">
      <path fill="#366b6a" opacity=".45" d="M-167-113h342l54 54v187l-55 36h-350l-21-35v-189z"/>
      <path fill="#a7412c" d="M-170-116h340q20 0 20 20v188q0 20-20 20h-340q-20 0-20-20V-96q0-20 20-20"/>
      <rect x="-174" y="-101" width="348" height="198" rx="14" fill="#e18b58"/>
      <path fill="#f4ba81" d="M-163-91h155v179h-155z"/><path fill="#bd613c" d="M-6-101h12V97H-6z"/>
      <path fill="none" stroke="#f7d3a5" stroke-width="3" d="M-151-82h129V78h-129zM15-82h141V78H15z"/>
      <path fill="#552f37" d="M-39 111h78v25H-39z"/><path fill="#e39657" d="M-29 116h58v11h-58z"/>
      <g transform="translate(-92 2) rotate(-11)"><rect x="-43" y="-61" width="88" height="118" rx="5" fill="#254957"/><circle cx="0" cy="-9" r="17" fill="none" stroke="#e6c67a" stroke-width="3"/><path d="M0-26q-15 17 0 34m0-34q15 17 0 34m-14-17h28" fill="none" stroke="#e6c67a" stroke-width="2"/></g>
      <g transform="translate(76 5) rotate(12)"><rect x="-47" y="-52" width="95" height="110" fill="#fff1cd"/><rect x="-36" y="-42" width="74" height="72" fill="#83a499"/><circle cx="17" cy="-19" r="10" fill="#ffe4a8"/><path fill="#315e64" d="m-36 29 27-48L16 29z"/><path fill="#4a7a73" d="m-18 29 30-35 26 35z"/></g>
      <path d="M25 46a9 9 0 1 0-14 11l-9 15 5 3 9-15 7 4 4-6-6-4a9 9 0 0 0 4-8" fill="none" stroke="#ffda79" stroke-width="4"/>
    </g>`,
  },
  'on-being-far-from-home': {
    alt: 'A warmly lit window looking out across a distant city at dusk',
    art: `<path fill="#272f54" d="M0 0h640v360H0z"/><path fill="#343d62" d="M0 0h142v360H0zM514 0h126v360H514z"/>
    <path fill="#181d36" d="M99 37h445v287H99z"/><path fill="#d29678" d="M121 52h403v247H121z"/>
    <path fill="#6b628e" d="M132 63h380v164H132z"/><path fill="#d48787" d="M132 129h380v120H132z"/>
    <circle cx="414" cy="115" r="30" fill="#fbd6a8"/><path fill="#4b4d79" d="M132 213q97-90 188-31t192-20v108H132z"/>
    <path fill="#343b62" d="M132 232q85-62 176-4t204-24v87H132z"/>
    <path fill="#222a48" d="M132 252h47v-29h37v34h27v-45h21v52h40v-21h37v9h46v-39h38v50h51v-26h36v52H132z"/>
    <path stroke="#f3bc7e" stroke-width="3" d="M192 239h6m56-10h5m93 34h5m43-35h9m-1 17h9m75 8h5"/>
    <path fill="#34304c" d="M314 63h17v228h-17zM132 171h380v12H132z"/>
    <path fill="#ba7a6b" d="M100 298h444v20H100z"/><path fill="#192039" d="M0 318h640v42H0z"/>
    <path fill="#f0b884" d="M167 295h42l-5 13h-32z"/><path d="M205 298q17-2 10 7h-12" fill="none" stroke="#f0b884" stroke-width="3"/>`,
  },
  'on-reading': {
    alt: 'An open book, a pencil and a handwritten note on a golden desk',
    art: `<path fill="#d7a04e" d="M0 0h640v360H0z"/><path fill="#ebbf6c" d="M0 0h425L0 302z"/>
    <path fill="#7c4f35" opacity=".34" d="m81 116 222-67 217 55 24 181-237 24-205-19z"/>
    <path fill="#405b4e" d="m78 112 222-63 214 45 30 181-236 23-213-16z"/>
    <path fill="#f5e6bc" d="M100 111q113-54 202-30l11 198q-96-35-214-10z"/>
    <path fill="#fff2d0" d="M302 81q92-44 192 13l24 164q-126-30-205 21z"/>
    <path d="M302 81l11 198" stroke="#b27a55" stroke-width="3"/>
    <g fill="none" stroke="#a08c6d" stroke-width="2.4">
      <path d="M123 137q74-27 143-17m-143 35q74-27 145-17m-144 35q54-20 109-17m-109 36q75-27 146-17m-145 36q75-27 145-17m-145 37q54-18 99-17"/>
      <path d="M337 116q70-25 128 3m-126 15q71-25 130 4m-128 14q72-23 127 6m-126 13q57-19 103 0m-100 16q67-23 129 10m-126 7q49-12 98 4"/>
    </g>
    <path d="M134 229q72-28 130-15" fill="none" stroke="#c36746" stroke-width="5"/>
    <g transform="translate(459 253) rotate(-13)"><path fill="#e5bb5c" d="M-52-39h110v85H-52z"/><path fill="#fff0a6" d="M-58-46h112v85H-58z"/><path d="M-42-25h67m-67 13h81m-81 13h49m-49 13h67" fill="none" stroke="#886d4c" stroke-width="2"/></g>
    <path d="M439 294 570 229l7 13-131 65z" fill="#934835"/><path d="m439 294 7 13-17 1z" fill="#f6d8a4"/>`,
  },
  'on-imposter-syndrome': {
    alt: 'A small figure stands next to an outsized shadow in a salmon-coloured doorway',
    art: `<path fill="#efae9e" d="M0 0h640v360H0z"/>
    <path fill="#e08d86" d="M0 260h640v100H0z"/><path fill="#ffd5ac" d="M222 36h160v224H222z"/>
    <path fill="#b16b83" d="M382 36h27v224h-27zM222 36h187v17H222z"/>
    <path fill="#f8c3a7" d="M222 260h187l132 100H81z"/>
    <path fill="#5b4769" d="M337 271c43-52 72-93 87-135 10-29 38-64 78-69 46-5 75 33 66 65-4 16-22 33-43 43-46 24-56 44-71 77l-46 83h-72z" opacity=".68"/>
    <circle cx="312" cy="150" r="20" fill="#483753"/><path fill="#483753" d="M303 168q-15 10-24 58l-7 40h19l19-37 9 37h20l-5-54q-3-33-22-44z"/>
    <path d="m300 177-25 45m50-44 18 39" fill="none" stroke="#483753" stroke-width="10" stroke-linecap="round"/>
    <path d="M214 36v224m203-224v224" stroke="#bd747c" fill="none" stroke-width="2"/>`,
  },
  'music-and-concentration': {
    alt: 'A vinyl record sits beside a curved turquoise headphone cable',
    art: `<path fill="#19283b" d="M0 0h640v360H0z"/>
    <path fill="#285256" d="M0 0h141l166 360H0z"/><path fill="#26334b" d="m488 0 152 0v360H382z"/>
    <circle cx="253" cy="177" r="147" fill="#121d2b"/><circle cx="253" cy="177" r="139" fill="#1d2233"/>
    <g fill="none" stroke="#48606f" stroke-width="2"><circle cx="253" cy="177" r="128"/><circle cx="253" cy="177" r="120"/><circle cx="253" cy="177" r="109"/><circle cx="253" cy="177" r="99"/><circle cx="253" cy="177" r="86"/><circle cx="253" cy="177" r="73"/></g>
    <path fill="#c55e76" d="M253 120a57 57 0 1 0 0 114 57 57 0 0 0 0-114"/><circle cx="253" cy="177" r="9" fill="#f4c7a3"/>
    <path d="M169 105q-26 16-43 47m196 122q25-13 42-41" fill="none" stroke="#8a8ea4" stroke-width="4" stroke-linecap="round"/>
    <path d="M527 239c-31 9-62 24-55 49 9 31 54 11 69-9 25-32 5-92-24-91" fill="none" stroke="#7fc6b8" stroke-width="4"/>
    <path d="M443 174v-15a55 55 0 0 1 110 0v15" fill="none" stroke="#7fc6b8" stroke-width="8"/>
    <rect x="433" y="165" width="23" height="46" rx="9" fill="#e4a896"/><rect x="541" y="165" width="23" height="46" rx="9" fill="#e4a896"/>`,
  },
  'on-work-life-balance': {
    alt: 'A closed laptop rests on a ledge overlooking a path into the hills at sunset',
    art: `<path fill="#faad86" d="M0 0h640v360H0z"/><path fill="#f8c9a4" d="M0 0h640v121H0z"/>
    <circle cx="491" cy="105" r="51" fill="#fff1b7"/><path fill="#c87a83" d="M0 205q107-93 220-37t222-29q101-49 198 16v205H0z"/>
    <path fill="#887a89" d="M0 205q112-20 208 30t154 1q132-94 278-32v156H0z"/>
    <path fill="#59776e" d="M0 258q116-48 244-8t255-28q87-35 141-18v156H0z"/>
    <path fill="#fcce9f" d="M480 233q-71 17-59 40 17 18-32 37l-96 50h89l78-47q37-26 5-54-7-7 15-26z"/>
    <path fill="#355f61" d="M0 292q96 4 183 68H0z"/>
    <path fill="#2f4250" d="M0 275h238v85H0z"/><path fill="#526571" d="M0 270h238v16H0z"/>
    <path fill="#232f3f" d="M38 258 155 231l60 29-112 24z"/><path fill="#7c8889" d="m38 251 114-26 63 30-113 23z"/><path fill="#b7a9a0" d="m38 251 114-26 48 22-113 22z"/>`,
  },
  'on-deep-work': {
    alt: 'A quiet desk and lit work surface above a row of dim open-plan desks',
    art: `<path fill="#28364a" d="M0 0h640v360H0z"/>
    <path fill="#384a60" d="M0 222h640v138H0z"/><path d="M0 224h640m-550 0v136m165-136v136m165-136v136m165-136v136" fill="none" stroke="#637088" stroke-width="2"/>
    <g opacity=".48" fill="#9ca6b1">
      <path d="M22 251h49v53H22zM109 251h124v53H109zM277 251h122v53H277zM444 251h122v53H444zM604 251h36v53h-36z"/>
      <path d="M151 313h40v21h-40zM319 313h40v21h-40zM486 313h40v21h-40z"/>
    </g>
    <path fill="#a17e69" d="M95 163h311v23H95z"/><path fill="#e4b180" d="M112 152h308v16H112z"/>
    <path fill="#f5cf8b" opacity=".28" d="m236 68-74 90h232l-82-89z"/>
    <path d="M394 150V69l-87 1" fill="none" stroke="#e1a769" stroke-width="8" stroke-linejoin="round"/>
    <path fill="#f8cf8a" d="M248 62h62l17 16h-91z"/>
    <path fill="#fff1c7" d="m198 143 43-27 55 17-40 24z"/><path stroke="#a7856f" stroke-width="2" d="m221 141 23-14m-13 18 24-13m-14 18 24-14"/>
    <path d="M101 182v24m296-24v24" fill="none" stroke="#a17e69" stroke-width="9"/>`,
  },
  'on-mentorship': {
    alt: 'Two hands hold opposite ends of a loose thread over a sage-green field',
    art: `<path fill="#acb9a1" d="M0 0h640v360H0z"/>
    <path fill="#cbd2af" d="M0 0h640v145Q341 203 0 109z"/>
    <path fill="#829d87" d="M0 260q166-77 320 1t320-9v108H0z"/>
    <path fill="#385e55" d="m0 79 133 45-37 132L0 227z"/>
    <path fill="#cb856c" d="m104 132 87 19 47-36q19-15 28-6 10 9-8 26l-24 23 36 5q40 6 42 19 1 13-28 15l-52-2-25 24q-22 27-64 13l-57-22z"/>
    <path fill="#2f5862" d="m640 129-128 49 49 121 79-22z"/>
    <path fill="#f0b68d" d="m531 186-79 18-33-38q-20-23-32-18-12 5 1 27l19 32-45-4q-31-2-34 12-2 13 23 18l57 12 29 24q27 21 77 5l45-15z"/>
    <path d="M298 184c35-40 97-54 120-25 22 29-37 80-65 55-24-21 1-63 21-77" fill="none" stroke="#fff1b6" stroke-width="5" stroke-linecap="round"/>
    <path d="M197 200l34-25m197 65 33 10" fill="none" stroke="#8c5c56" stroke-width="3" stroke-linecap="round"/>`,
  },
  'on-conferences': {
    alt: 'Two attendees with badges talk beside tall conference hallway windows',
    art: `<path fill="#e6bb9a" d="M0 0h640v360H0z"/>
    <path fill="#c88970" d="M0 0h317l173 261H0z"/>
    <path fill="#f4dfb6" d="M377 0h263v230H475z"/><path fill="#e9c796" d="M452 0h188v145H508z"/>
    <path fill="#d9a686" d="M0 254h640v106H0z"/><path fill="none" d="m433 0 146 255m-71-255 126 195m-244-73h250m-165 59h165M464 255l-159 105m228-105-79 105" stroke="#855e64" stroke-width="3"/>
    <path fill="#76576a" d="M135 342l12-106q11-41 50-48l41-1q25 12 43 54l30 101z"/>
    <path fill="#d99771" d="M187 181l6-40q-7-25 8-43 20-25 54-12 23 11 22 39l16 14-18 10q-9 30-33 34l-5 25z"/>
    <path fill="#543d55" d="M192 151q-23-37 0-63 35-33 74-4l9 16q-30-13-50 8l-8 31-17-6z"/>
    <path fill="#396d74" d="M316 342l25-110q6-33 37-44l47-4q43 10 47 45l15 113z"/>
    <path fill="#b9745e" d="m373 205-5-26q-20-6-26-27l-14-9 10-12q-2-40 29-52 34-11 60 18 12 14 6 43l-8 38-3 22z"/>
    <path fill="#3a394f" d="M339 120q0-42 34-48 36-3 56 26 16 21 0 50l-13-20-3-26q-44 25-74 18"/>
    <path d="m185 199 29 62 26-60m139-6 26 65 30-61" stroke="#f7bb7d" stroke-width="4" fill="none"/>
    <path fill="#f7dec1" d="M202 251h25v33h-25zM393 251h25v33h-25z"/>`,
  },
  'on-feedback': {
    alt: 'Two folded paper speech shapes overlap across a yellow and blue divide',
    art: `<path fill="#e8ba63" d="M0 0h640v360H0z"/><path fill="#456881" d="M386 0h254v360H113z"/>
    <path fill="#775b55" opacity=".42" d="m88 104 237-24 76 98-45 49-51 91-42-75-164 17z"/>
    <path fill="#fff0ca" d="m74 94 238-25 78 98-44 48-51 90-42-75-164 16z"/>
    <path fill="#d88662" d="m295 305 51-90-93 15z"/><path fill="#dbb17a" d="m312 69 11 65 67 33z"/>
    <path fill="#1d4a66" opacity=".55" d="m279 142 249-40 44 146-196 41-44 52-12-41z"/>
    <path fill="#9fb8bd" d="m270 137 250-40 44 147-197 41-44 50-10-41z"/>
    <path fill="#6e929f" d="m323 335 44-50-54 9zM520 97l-5 49 38 60z"/>
    <path d="M130 135l141-18m-137 43 167-22m28 41 159-26m-152 55 171-27m-162 57 99-18" fill="none" stroke="#486273" stroke-width="4" stroke-linecap="round" opacity=".72"/>`,
  },
  'on-saying-no': {
    alt: 'A single path stays straight while side routes turn away at a boundary',
    art: `<path fill="#30364f" d="M0 0h640v360H0z"/>
    <path fill="#414961" d="M0 0h640v86H0zM0 271h640v89H0z"/>
    <path d="M0 66h194l79 83h105l68-83h194M0 288h195l76-77h113l72 77h184" stroke="#667587" stroke-width="17" fill="none"/>
    <path d="M0 178h640" stroke="#f1bc70" stroke-width="31"/>
    <path d="M0 178h505m44 0h91" stroke="#fff0bb" stroke-width="2" stroke-dasharray="14 12"/>
    <path fill="#d48773" d="M220 92h23v72h-23zM220 192h23v72h-23z"/>
    <path fill="#f2ac8b" d="M243 92h9v72h-9zM243 192h9v72h-9z"/>
    <path d="m471 157 36 21-36 21" fill="none" stroke="#27374e" stroke-width="7" stroke-linejoin="round"/>
    <path d="m301 60-12 18 21-1m-11 220-12-18 21 1" fill="none" stroke="#a9b6bf" stroke-width="3"/>`,
  },
  'twenty-five-years-in-tech': {
    alt: 'A coffee mug and incident monitor glow against a dark operations room',
    art: `<path fill="#1d253c" d="M0 0h640v360H0z"/>
    <path fill="#2f3e55" d="M0 0h425v234H0z"/><path fill="#243248" d="M0 213h640v147H0z"/>
    <g fill="#192238"><rect x="422" y="37" width="79" height="220" rx="5"/><rect x="513" y="37" width="83" height="220" rx="5"/></g>
    <g stroke="#465973" stroke-width="4"><path d="M435 63h50m-50 22h50m-50 22h50m-50 22h50m-50 22h50m-50 22h50m-50 22h50m-50 22h50M525 63h57m-57 22h57m-57 22h57m-57 22h57m-57 22h57m-57 22h57m-57 22h57m-57 22h57"/></g>
    <circle cx="479" cy="108" r="3" fill="#efa777"/><circle cx="571" cy="151" r="3" fill="#98caad"/>
    <path fill="#101c30" d="M54 49h334v198H54z"/><path fill="#31556b" d="M67 63h307v167H67z"/>
    <path d="M83 95h274M83 132h274M83 169h274M83 206h274" stroke="#456b7b" stroke-width="1"/>
    <path d="M84 125h61l21 20 31-26 26 78 21-37 22 17 23-38h68" fill="none" stroke="#e89a78" stroke-width="4" stroke-linejoin="round"/>
    <path fill="#43576b" d="M195 247h34v28h-34zM159 275h107v13H159z"/>
    <path fill="#354258" d="M0 282h640v78H0z"/><ellipse cx="314" cy="315" rx="61" ry="11" fill="#1b2a3d"/>
    <path fill="#d2a67b" d="M277 266h60l-7 42h-45z"/><ellipse cx="307" cy="266" rx="30" ry="7" fill="#f0c990"/><ellipse cx="307" cy="265" rx="23" ry="4" fill="#64454c"/><path d="M335 269q23 0 19 12t-23 14" fill="none" stroke="#d2a67b" stroke-width="5"/>`,
  },
  'on-accumulating-knowledge': {
    alt: 'A mosaic of differently shaped pieces with one new pink piece about to fit',
    art: `<path fill="#a0a4bd" d="M0 0h640v360H0z"/>
    <path fill="#b9bfd6" d="M0 253 465 0h175v63L141 360H0z"/>
    <path fill="#798aa0" opacity=".45" d="M91 112 364 61 535 142 515 304 243 344 105 265z"/>
    <g stroke="#f2e3d1" stroke-width="5" stroke-linejoin="round">
      <path fill="#4d7281" d="m80 113 130-36 9 95-112 49z"/>
      <path fill="#e4b684" d="m210 77 147-30 26 91-164 34z"/>
      <path fill="#608b87" d="m357 47 140 39-46 99-68-47z"/>
      <path fill="#d38f87" d="m80 113 27 108-22 57-22-99z"/>
      <path fill="#c1aa90" d="m107 221 112-49 49 75-79 74-104-43z"/>
      <path fill="#496681" d="m219 172 164-34 68 47-183 62z"/>
      <path fill="#deba79" d="m268 247 183-62 55 60-89 46-124 25z"/>
      <path fill="#638b89" d="m268 247 25 69-104 5z"/>
      <path fill="#705e82" d="m451 185 46-99 24 77-15 82z"/>
    </g>
    <path fill="#8a6f93" opacity=".45" d="m501 192 76 9 20 72-78 30-30-60z"/>
    <path fill="#db8aa0" d="m510 176 68 9 21 65-77 31-32-58z"/><path fill="#f3b5b8" d="m510 176 68 9 21 65-66 16-31-52z"/>
    <circle cx="550" cy="222" r="9" fill="#7a6082"/>`,
  },
};

export function noteCover(slug, width, height) {
  const cover = covers[slug];
  if (!cover) return null;
  return {
    alt: cover.alt,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice"><title>${esc(cover.alt)}</title>${cover.art}</svg>`,
  };
}
