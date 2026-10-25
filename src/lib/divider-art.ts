// Shared divider artwork: the website previews it and the bot renders the same SVG to PNG.
// Keep this file free of browser/Node APIs so it can be copied into the bot as plain JS.

export type DividerCategory = "animated" | "simple" | "decor" | "islamic" | "fun" | "tech";
export type DividerDef = { id: string; ar: string; en: string; cat: DividerCategory[]; animated?: boolean };

export const DIVIDER_CATEGORIES: { id: "all" | DividerCategory; ar: string; en: string }[] = [
  { id: "all", ar: "الكل", en: "All" },
  { id: "animated", ar: "متحركة", en: "Animated" },
  { id: "simple", ar: "بسيطة", en: "Simple" },
  { id: "decor", ar: "زخرفة", en: "Ornate" },
  { id: "islamic", ar: "إسلامية", en: "Islamic" },
  { id: "fun", ar: "مرحة", en: "Fun" },
  { id: "tech", ar: "تقنية", en: "Tech" },
];

export const DIVIDERS: DividerDef[] = [
  { id: "comet", ar: "مذنب", en: "Comet", cat: ["animated", "tech"], animated: true },
  { id: "pulse-bolt", ar: "نبض كهربائي", en: "Electric pulse", cat: ["animated", "tech"], animated: true },
  { id: "beads-walk", ar: "خرز ماشي", en: "Walking beads", cat: ["animated", "decor"], animated: true },
  { id: "wave-walk", ar: "موجة ماشية", en: "Moving wave", cat: ["animated", "simple"], animated: true },
  { id: "dash-walk", ar: "شرطات ماشية", en: "Moving dashes", cat: ["animated", "simple"], animated: true },
  { id: "dots-walk", ar: "نقاط ماشية", en: "Moving dots", cat: ["animated", "simple"], animated: true },
  { id: "sparkles", ar: "لمعات", en: "Sparkles", cat: ["animated", "fun"], animated: true },
  { id: "burst-pulse", ar: "كرة تنبض", en: "Pulsing orb", cat: ["animated", "fun"], animated: true },
  { id: "spin-star", ar: "كرة تدور", en: "Spinning star", cat: ["animated", "decor"], animated: true },
  { id: "breathe", ar: "خط يتنفس", en: "Breathing line", cat: ["animated", "simple"], animated: true },
  { id: "scan", ar: "ماسح", en: "Scanner", cat: ["animated", "tech"], animated: true },
  { id: "neon-burst", ar: "مذنب نيون", en: "Neon burst", cat: ["animated", "fun"], animated: true },
  { id: "lantern", ar: "فانوس", en: "Lantern", cat: ["animated", "islamic"], animated: true },
  { id: "crescent", ar: "هلال ونجوم", en: "Crescent & stars", cat: ["animated", "islamic"], animated: true },
  { id: "gem-shine", ar: "جوهرة تلمع", en: "Shining gem", cat: ["animated", "decor"], animated: true },
  { id: "ripple", ar: "تموج", en: "Ripple", cat: ["animated", "tech"], animated: true },
  { id: "radar", ar: "رادار", en: "Radar", cat: ["animated", "tech"], animated: true },
  { id: "heartbeat", ar: "نبضة قلب", en: "Heartbeat", cat: ["animated", "fun"], animated: true },
  { id: "orbit", ar: "مدار", en: "Orbit", cat: ["animated", "tech"], animated: true },
  { id: "fireworks", ar: "ألعاب نارية", en: "Fireworks", cat: ["animated", "fun"], animated: true },
  { id: "pixel-walk", ar: "بكسل ماشي", en: "Pixel trail", cat: ["animated", "tech"], animated: true },
  { id: "electric", ar: "كهرباء", en: "Electric", cat: ["animated", "tech"], animated: true },
  { id: "typing", ar: "يكتب", en: "Typing", cat: ["animated", "fun"], animated: true },
  { id: "equalizer", ar: "معادل صوت", en: "Equalizer", cat: ["animated", "fun"], animated: true },
  { id: "glow", ar: "خط مضيء", en: "Glowing line", cat: ["simple"] },
  { id: "dashes", ar: "شرطات", en: "Dashes", cat: ["simple"] },
  { id: "dots", ar: "نقاط", en: "Dots", cat: ["simple"] },
  { id: "thick-thin", ar: "عريض ورفيع", en: "Thick & thin", cat: ["simple"] },
  { id: "double", ar: "خط مزدوج", en: "Double line", cat: ["simple"] },
  { id: "line", ar: "خط ناعم", en: "Soft line", cat: ["simple"] },
  { id: "dash-diamond", ar: "شرطات ومعين", en: "Dashes & diamond", cat: ["decor"] },
  { id: "dots-circle", ar: "نقاط ودائرة", en: "Dots & circle", cat: ["decor"] },
  { id: "diamond-ends", ar: "أطراف معين", en: "Diamond ends", cat: ["decor"] },
  { id: "ring", ar: "حلقة", en: "Ring", cat: ["simple", "decor"] },
  { id: "double-diamond", ar: "مزدوج بمعين", en: "Double with diamond", cat: ["decor"] },
  { id: "line-dot", ar: "خط ونقطة", en: "Line & dot", cat: ["simple"] },
  { id: "heart", ar: "قلب", en: "Heart", cat: ["fun"] },
  { id: "crown", ar: "تاج", en: "Crown", cat: ["decor"] },
  { id: "three-gems", ar: "ثلاث جواهر", en: "Three gems", cat: ["decor"] },
  { id: "diamond", ar: "جوهرة", en: "Gem", cat: ["decor"] },
  { id: "bright-star", ar: "لمعة مضيئة", en: "Bright sparkle", cat: ["decor"] },
  { id: "star4", ar: "لمعة", en: "Sparkle", cat: ["simple", "decor"] },
  { id: "three-dots", ar: "ثلاث نقاط", en: "Three dots", cat: ["fun"] },
  { id: "chain", ar: "سلسلة", en: "Chain", cat: ["decor"] },
  { id: "beads-gem", ar: "خرز وجوهرة", en: "Beads & gem", cat: ["decor"] },
  { id: "beads", ar: "خرز", en: "Beads", cat: ["simple"] },
  { id: "knot", ar: "عقدة", en: "Knot", cat: ["decor"] },
  { id: "flower", ar: "وردة", en: "Flower", cat: ["fun", "decor"] },
  { id: "islamic-star", ar: "نجمة ثمانية", en: "Eight-point star", cat: ["islamic"] },
  { id: "arabesque", ar: "أرابيسك", en: "Arabesque", cat: ["islamic"] },
  { id: "wave", ar: "موجة", en: "Wave", cat: ["simple"] },
  { id: "circuit", ar: "دوائر متصلة", en: "Circuit", cat: ["tech"] },
  { id: "stars", ar: "نجوم", en: "Stars", cat: ["decor"] },
];

const CX = 600, CY = 50;
const n = (v: number) => Math.round(v * 10) / 10;
const hline = (x1: number, x2: number, y: number, c: string, w = 3, extra = "") => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
const sides = (gap: number, c: string, w = 3, extra = "") => hline(40, CX - gap, CY, c, w, extra) + hline(CX + gap, 1160, CY, c, w, extra);
const diamond = (x: number, y: number, r: number, c: string, extra = "") => `<path d="M${x} ${y - r}L${x + r * 0.75} ${y}L${x} ${y + r}L${x - r * 0.75} ${y}Z" fill="${c}" ${extra}/>`;
const star4 = (x: number, y: number, r: number, c: string, extra = "") => `<path d="M${x} ${y - r}Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z" fill="${c}" ${extra}/>`;
const circle = (x: number, y: number, r: number, c: string, extra = "") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${extra}/>`;
const ring = (x: number, y: number, r: number, c: string, w = 3, extra = "") => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}" ${extra}/>`;
const burst = (x: number, y: number, r: number, c: string) => {
  let d = "";
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, rr = i % 2 ? r * 0.45 : r; d += `${i ? "L" : "M"}${n(x + Math.cos(a) * rr)} ${n(y + Math.sin(a) * rr)}`; }
  return `<path d="${d}Z" fill="${c}"/>`;
};
const star8 = (x: number, y: number, r: number, c: string, fill = true) => {
  const sq = (rot: number) => { let d = ""; for (let i = 0; i < 4; i++) { const a = rot + (i / 4) * Math.PI * 2; d += `${i ? "L" : "M"}${n(x + Math.cos(a) * r)} ${n(y + Math.sin(a) * r)}`; } return `${d}Z`; };
  return `<path d="${sq(0)}${sq(Math.PI / 4)}" ${fill ? `fill="${c}"` : `fill="none" stroke="${c}" stroke-width="3"`}/>`;
};
const dotsRow = (x1: number, x2: number, step: number, r: number, c: string, extra = "") => { let s = ""; for (let x = x1; x <= x2; x += step) s += circle(x, CY, r, c, extra); return s; };
const spin = (dur = 6) => `<animateTransform attributeName="transform" type="rotate" from="0 ${CX} ${CY}" to="360 ${CX} ${CY}" dur="${dur}s" repeatCount="indefinite"/>`;
const pulse = (dur = 1.6) => `<animate attributeName="opacity" values="1;.35;1" dur="${dur}s" repeatCount="indefinite"/>`;
const dashMove = (len: number, dur = 1.2) => `<animate attributeName="stroke-dashoffset" from="0" to="${-len}" dur="${dur}s" repeatCount="indefinite"/>`;

function body(id: string, c: string, a: string, u: string): string {
  switch (id) {
    case "comet": return hline(40, 1160, CY, c, 2, `opacity=".35"`) + `<g transform="translate(600 0)">${circle(0, CY, 7, a)}${hline(-180, 0, CY, `url(#${u}f)`, 5)}<animateTransform attributeName="transform" type="translate" values="200 0;1100 0;200 0" dur="4s" repeatCount="indefinite"/></g>` 
    case "pulse-bolt": return `<path d="M40 50H330Q350 20 370 50T410 50T450 50H520" stroke="${c}" stroke-width="3" fill="none"/><path d="M680 50H750Q770 20 790 50T830 50T870 50H1160" stroke="${c}" stroke-width="3" fill="none"/><path d="M606 22L586 54H602L594 78L616 44H600Z" fill="${a}">${pulse(0.9)}</path>`;
    case "beads-walk": return `<line x1="40" y1="50" x2="560" y2="50" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-dasharray="0 36">${dashMove(36, 1.4)}</line><line x1="640" y1="50" x2="1160" y2="50" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-dasharray="0 36">${dashMove(36, 1.4)}</line>` + diamond(CX, CY, 20, a);
    case "wave-walk": return `<path d="M-150 50${Array.from({ length: 12 }, (_, i) => `Q${-112 + i * 150} 20 ${-75 + i * 150} 50T${i * 150} 50`).join("")}" stroke="${c}" stroke-width="4" fill="none"><animateTransform attributeName="transform" type="translate" from="0 0" to="150 0" dur="2s" repeatCount="indefinite"/></path>`;
    case "dash-walk": return `<line x1="40" y1="50" x2="540" y2="50" stroke="${c}" stroke-width="4" stroke-dasharray="40 20">${dashMove(60)}</line><line x1="660" y1="50" x2="1160" y2="50" stroke="${c}" stroke-width="4" stroke-dasharray="40 20">${dashMove(60)}</line>` + diamond(CX, CY, 22, a);
    case "dots-walk": return `<line x1="40" y1="50" x2="1160" y2="50" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-dasharray="0 26">${dashMove(26)}</line>` + circle(CX, CY, 10, a);
    case "sparkles": return sides(40, c, 2) + star4(CX, CY, 26, a) + `<g>${star4(700, 30, 9, a)}${star4(520, 72, 7, a)}${pulse(1.2)}</g>`;
    case "burst-pulse": return hline(40, 1160, CY, c, 2) + hline(40, 1160, 40, c, 1, `opacity=".4"`) + `<g>${ring(CX, CY, 30, a, 2)}${burst(CX, CY, 24, a)}${pulse(1.4)}</g>`;
    case "spin-star": return sides(55, c, 3) + diamond(560, CY, 8, c) + diamond(640, CY, 8, c) + `<g>${burst(CX, CY, 26, a)}${spin(5)}</g>`;
    case "breathe": return `<line x1="40" y1="50" x2="1160" y2="50" stroke="${c}" stroke-width="5" stroke-linecap="round"><animate attributeName="stroke-width" values="2;7;2" dur="2.4s" repeatCount="indefinite"/></line>` + ring(CX, CY, 16, a, 4) + circle(CX, CY, 6, a);
    case "scan": return hline(40, 1160, 42, c, 2) + hline(40, 1160, 58, c, 2) + `<rect x="580" y="20" width="6" height="60" fill="${a}"><animate attributeName="x" values="60;1140;60" dur="3s" repeatCount="indefinite"/></rect>`;
    case "neon-burst": return hline(40, 1160, CY, `url(#${u}g)`, 4) + `<g>${ring(CX, CY, 34, a, 2)}${burst(CX, CY, 28, a)}${circle(CX, CY, 8, c)}${pulse(1)}</g>`;
    case "lantern": return sides(40, c, 3) + `<g>${hline(CX, CX, 14, a)}<path d="M${CX - 14} 30H${CX + 14}L${CX + 18} 68H${CX - 18}Z" fill="${a}"/><rect x="${CX - 6}" y="38" width="12" height="22" rx="4" fill="${c}" opacity=".7"/><path d="M${CX - 8} 22H${CX + 8}L${CX + 14} 30H${CX - 14}Z" fill="${a}"/><circle cx="${CX}" cy="76" r="4" fill="${a}"/><animateTransform attributeName="transform" type="rotate" values="-6 ${CX} 14;6 ${CX} 14;-6 ${CX} 14" dur="3s" repeatCount="indefinite"/></g>`;
    case "crescent": return dotsRow(60, 540, 30, 3, c) + dotsRow(660, 1140, 30, 3, c) + `<path d="M${CX + 8} 24A26 26 0 1 0 ${CX + 8} 76A20 20 0 1 1 ${CX + 8} 24Z" fill="${a}"/><g>${star4(490, 34, 8, a)}${star4(720, 66, 7, a)}${star4(740, 28, 5, a)}${pulse(1.8)}</g>`;
    case "gem-shine": return hline(40, 1160, 44, c, 2) + hline(40, 1160, 56, c, 2) + `<g>${diamond(CX, CY, 26, a)}${pulse(1.3)}</g>` + diamond(555, CY, 8, c) + diamond(645, CY, 8, c);
    case "ripple": return sides(50, c, 3) + circle(CX, CY, 8, a) + ring(CX, CY, 18, a, 3) + `<circle cx="${CX}" cy="${CY}" r="18" fill="none" stroke="${a}" stroke-width="3"><animate attributeName="r" values="18;44" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.6s" repeatCount="indefinite"/></circle>`;
    case "radar": return `<line x1="40" y1="50" x2="540" y2="50" stroke="${c}" stroke-width="4" stroke-dasharray="44 22"/><line x1="660" y1="50" x2="1160" y2="50" stroke="${c}" stroke-width="4" stroke-dasharray="44 22"/>` + ring(CX, CY, 26, a, 3) + ring(CX, CY, 14, a, 3) + `<g><line x1="${CX}" y1="${CY}" x2="${CX + 26}" y2="${CY}" stroke="${a}" stroke-width="3"/>${spin(2)}</g>`;
    case "heartbeat": return hline(40, 540, CY, c, 3) + `<path d="M${CX - 20} 50C${CX - 20} 38 ${CX - 6} 34 ${CX} 44C${CX + 6} 34 ${CX + 20} 38 ${CX + 20} 50C${CX + 20} 62 ${CX} 70 ${CX} 74C${CX} 70 ${CX - 20} 62 ${CX - 20} 50Z" fill="${a}">${pulse(0.8)}</path><path d="M660 50H720L740 18L760 82L780 50H1160" stroke="${c}" stroke-width="3" fill="none"/>`;
    case "orbit": return sides(50, c, 3) + `<ellipse cx="${CX}" cy="${CY}" rx="36" ry="14" fill="none" stroke="${a}" stroke-width="3"/>` + circle(CX, CY, 9, a) + `<g>${circle(CX + 36, CY, 5, c)}${spin(2.5)}</g>`;
    case "fireworks": { let rays = ""; for (let i = 0; i < 12; i++) { const ang = (i / 12) * Math.PI * 2; rays += `<line x1="${n(CX + Math.cos(ang) * 10)}" y1="${n(CY + Math.sin(ang) * 10)}" x2="${n(CX + Math.cos(ang) * 32)}" y2="${n(CY + Math.sin(ang) * 32)}" stroke="${a}" stroke-width="3" stroke-linecap="round"/>`; } return sides(45, c, 3) + `<g>${rays}${pulse(1)}</g>`; }
    case "pixel-walk": return `<line x1="40" y1="50" x2="540" y2="50" stroke="${c}" stroke-width="6" stroke-dasharray="6 8 12 8">${dashMove(34, 1)}</line><line x1="660" y1="50" x2="1160" y2="50" stroke="${c}" stroke-width="6" stroke-dasharray="6 8 12 8">${dashMove(34, 1)}</line>` + diamond(CX, CY, 22, a);
    case "electric": { const zz = (x1: number, x2: number) => { let d = `M${x1} 50`; for (let x = x1, up = true; x < x2; x += 20, up = !up) d += `L${x + 10} ${up ? 34 : 66}L${x + 20} 50`; return `<path d="${d}" stroke="${c}" stroke-width="3" fill="none"/>`; }; return zz(40, 540) + zz(660, 1160) + `<path d="M606 20L584 54H600L592 80L618 44H602Z" fill="${a}">${pulse(0.6)}</path>`; }
    case "typing": return sides(40, c, 3) + [-16, 0, 16].map((dx, i) => `<circle cx="${CX + dx}" cy="${CY}" r="6" fill="${a}"><animate attributeName="cy" values="50;38;50" dur="1s" begin="${i * 0.18}s" repeatCount="indefinite"/></circle>`).join("");
    case "equalizer": return sides(70, c, 3) + [-48, -32, -16, 0, 16, 32, 48].map((dx, i) => { const h = [16, 30, 22, 40, 22, 30, 16][i]!; return `<rect x="${CX + dx - 4}" y="${CY - h / 2}" width="8" height="${h}" rx="3" fill="${a}"><animate attributeName="height" values="${h};${h / 3};${h}" dur="${0.6 + i * 0.07}s" repeatCount="indefinite"/><animate attributeName="y" values="${CY - h / 2};${CY - h / 6};${CY - h / 2}" dur="${0.6 + i * 0.07}s" repeatCount="indefinite"/></rect>`; }).join("");
    case "glow": return hline(40, 1160, CY, c, 10, `opacity=".25"`) + hline(40, 1160, CY, a, 4);
    case "dashes": return `<line x1="40" y1="50" x2="1160" y2="50" stroke="${c}" stroke-width="4" stroke-dasharray="40 18"/>`;
    case "dots": return `<line x1="40" y1="50" x2="1160" y2="50" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-dasharray="0 20"/>`;
    case "thick-thin": return hline(40, 1160, 42, c, 7) + hline(40, 1160, 58, c, 2);
    case "double": return hline(40, 1160, 40, c, 3) + hline(40, 1160, 60, c, 3);
    case "line": return hline(40, 1160, CY, `url(#${u}g)`, 4);
    case "dash-diamond": return `<line x1="40" y1="50" x2="560" y2="50" stroke="${c}" stroke-width="4" stroke-dasharray="30 16"/><line x1="640" y1="50" x2="1160" y2="50" stroke="${c}" stroke-width="4" stroke-dasharray="30 16"/>` + diamond(CX, CY, 22, a);
    case "dots-circle": return dotsRow(60, 560, 22, 3.5, c) + dotsRow(640, 1140, 22, 3.5, c) + circle(CX, CY, 12, a);
    case "diamond-ends": return hline(60, 1140, CY, c, 3) + diamond(50, CY, 12, a) + diamond(1150, CY, 12, a);
    case "ring": return sides(36, c, 3) + ring(CX, CY, 18, a, 4) + circle(CX, CY, 6, a);
    case "double-diamond": return hline(40, 570, 42, c, 2) + hline(40, 570, 58, c, 2) + hline(630, 1160, 42, c, 2) + hline(630, 1160, 58, c, 2) + diamond(CX, CY, 22, a);
    case "line-dot": return sides(40, c, 3) + circle(CX, CY, 10, a) + circle(545, CY, 4, c) + circle(655, CY, 4, c);
    case "heart": return sides(40, c, 3) + circle(545, CY, 4, c) + circle(655, CY, 4, c) + `<path d="M${CX - 18} 46C${CX - 18} 34 ${CX - 4} 32 ${CX} 42C${CX + 4} 32 ${CX + 18} 34 ${CX + 18} 46C${CX + 18} 58 ${CX} 66 ${CX} 70C${CX} 66 ${CX - 18} 58 ${CX - 18} 46Z" fill="${a}"/>`;
    case "crown": return hline(40, 550, 44, c, 2) + hline(40, 550, 56, c, 2) + hline(650, 1160, 44, c, 2) + hline(650, 1160, 56, c, 2) + `<path d="M${CX - 30} 66L${CX - 34} 32L${CX - 14} 48L${CX} 26L${CX + 14} 48L${CX + 34} 32L${CX + 30} 66Z" fill="${a}"/>`;
    case "three-gems": return sides(60, c, 3) + diamond(CX - 32, CY, 12, a) + diamond(CX, CY, 20, a) + diamond(CX + 32, CY, 12, a);
    case "diamond": return sides(48, c, 3) + diamond(CX, CY, 26, a) + diamond(560, CY, 7, c) + diamond(640, CY, 7, c);
    case "bright-star": return hline(40, 1160, CY, c, 8, `opacity=".25"`) + hline(40, 1160, CY, c, 3) + star4(CX, CY, 26, a);
    case "star4": return sides(40, c, 3) + star4(CX, CY, 24, a) + circle(545, CY, 4, c) + circle(655, CY, 4, c);
    case "three-dots": return dotsRow(60, 1140, 26, 2.5, c, `opacity=".7"`) + circle(CX - 22, CY, 8, a) + circle(CX, CY, 8, a) + circle(CX + 22, CY, 8, a);
    case "chain": { let s = ""; for (let x = 60; x < 560; x += 40) s += `<rect x="${x}" y="40" width="34" height="20" rx="10" fill="none" stroke="${c}" stroke-width="3"/>`; for (let x = 646; x < 1140; x += 40) s += `<rect x="${x}" y="40" width="34" height="20" rx="10" fill="none" stroke="${c}" stroke-width="3"/>`; return s + ring(CX, CY, 18, a, 4) + circle(CX, CY, 6, a); }
    case "beads-gem": return dotsRow(60, 550, 32, 6, c) + dotsRow(650, 1140, 32, 6, c) + diamond(CX, CY, 24, a);
    case "beads": return dotsRow(60, 1140, 36, 6, c) + circle(CX, CY, 10, a);
    case "knot": return hline(40, 1160, 44, c, 2) + hline(40, 1160, 56, c, 2) + ring(CX - 12, CY, 16, a, 4) + ring(CX + 12, CY, 16, a, 4);
    case "flower": { let s = ""; for (let i = 0; i < 6; i++) { const ang = (i / 6) * Math.PI * 2; s += circle(n(CX + Math.cos(ang) * 12), n(CY + Math.sin(ang) * 12), 9, a); } return sides(40, c, 3) + s + circle(CX, CY, 7, c); }
    case "islamic-star": return sides(85, c, 3) + star8(CX, CY, 30, a) + circle(CX, CY, 8, c) + star8(530, CY, 10, c, false) + star8(670, CY, 10, c, false);
    case "arabesque": { let s = ""; for (let x = 70; x < 1140; x += 70) if (Math.abs(x - CX) > 50) s += star8(x, CY, 12, c, false); return hline(40, 1160, CY, c, 1, `opacity=".5"`) + s + star8(CX, CY, 26, a); }
    case "wave": return `<path d="M40 50${Array.from({ length: 8 }, (_, i) => `Q${77 + i * 140} 14 ${110 + i * 140} 50T${180 + i * 140} 50`).join("")}" stroke="${c}" stroke-width="4" fill="none"/>`;
    case "circuit": return `<path d="M40 65H400L430 35H770L800 65H1160" stroke="${c}" stroke-width="3" fill="none"/>` + circle(430, 35, 7, a) + circle(770, 35, 7, a) + circle(40, 65, 5, a) + circle(1160, 65, 5, a);
    case "stars": return sides(80, c, 2) + star8(560, CY, 13, a) + star8(CX, CY, 18, a) + star8(640, CY, 13, a);
    default: return sides(40, c, 3) + diamond(CX, CY, 22, a);
  }
}

/** Returns a full SVG document. `animate=false` strips SMIL so the bot gets a clean still frame. */
export function dividerSvg(id: string, color: string, accent?: string, opts: { animate?: boolean; uid?: string } = {}) {
  const c = /^#[0-9a-f]{6}$/i.test(color) ? color : "#7fd4c1";
  const a = accent && /^#[0-9a-f]{6}$/i.test(accent) ? accent : c;
  const u = (opts.uid ?? "d").replace(/[^a-z0-9]/gi, "");
  let inner = body(id, c, a, u);
  if (opts.animate === false) inner = inner.replace(/<animate(Transform)?[^>]*\/>/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 100" width="1200" height="100"><defs><linearGradient id="${u}g" gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="1160" y2="0"><stop offset="0" stop-color="${c}" stop-opacity="0"/><stop offset=".5" stop-color="${a}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient><linearGradient id="${u}f" gradientUnits="userSpaceOnUse" x1="-180" y1="0" x2="0" y2="0"><stop offset="0" stop-color="${a}" stop-opacity="0"/><stop offset="1" stop-color="${a}"/></linearGradient></defs>${inner}</svg>`;
}

export const isDividerId = (id: string) => DIVIDERS.some((d) => d.id === id);
