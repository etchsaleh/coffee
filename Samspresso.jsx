import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  memo,
} from "react";
import {
  Compass,
  Map as MapIcon,
  Trophy,
  Plus,
  User,
  Bookmark,
  Star,
  X,
  MapPin,
  TrainFront,
  Sparkles,
  ChevronDown,
  Footprints,
  Minus,
  RotateCcw,
  Check,
  ArrowRight,
  Coffee,
  List,
  Store,
} from "lucide-react";

/* ───────────────────────────── Design tokens ───────────────────────────── */

const C = {
  // milk, oat, latte, matcha
  bg: "#F8F6F2",
  card: "#FFFFFF",
  line: "#EEEAE4",
  stone: "#F1EDE7",
  ink: "#2A2623",
  taupe: "#8D867E",
  clay: "#C49A74",
  sage: "#7A8B5A",
  land: "#F4F1EB",
  river: "#E4E9E8",
  park: "#E5EBDC",
};
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap");
.sp{font-family:"Manrope","Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:${C.ink};background:${C.bg};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-tap-highlight-color:transparent;letter-spacing:-.005em;}
.sp .serif{font-family:"Instrument Serif",ui-serif,Georgia,serif;font-style:italic;font-weight:400;letter-spacing:-.01em}
.sp .soft{box-shadow:0 1px 2px rgba(42,38,35,.03),0 14px 36px -24px rgba(42,38,35,.22)}
.sp *{box-sizing:border-box}
.sp fieldset{min-width:0;margin:0;padding:0;border:0}
.sp button{font:inherit;cursor:pointer}
.sp .tabular{font-variant-numeric:tabular-nums}
.sp .tr{transition-property:transform,opacity,background-color,color,border-color,box-shadow;transition-duration:.45s;transition-timing-function:${EASE}}
.sp .press{transition:transform .28s ${EASE},background-color .35s ${EASE},color .35s ${EASE},box-shadow .35s ${EASE},border-color .35s ${EASE},opacity .35s ${EASE}}
.sp .press:active{transform:scale(.95)}
.sp .lift{transition:transform .45s ${EASE},box-shadow .45s ${EASE},border-color .45s ${EASE}}
@media (hover:hover){.sp .lift:hover{transform:translate3d(0,-3px,0);box-shadow:0 2px 4px rgba(42,38,35,.03),0 22px 44px -24px rgba(42,38,35,.28)}}
.sp .glass{background:rgba(250,249,246,.74);-webkit-backdrop-filter:saturate(1.6) blur(18px);backdrop-filter:saturate(1.6) blur(18px)}
.sp .glass-white{background:rgba(255,255,255,.78);-webkit-backdrop-filter:saturate(1.6) blur(14px);backdrop-filter:saturate(1.6) blur(14px)}
.sp .hair{box-shadow:0 1px 2px rgba(42,38,35,.03),0 12px 32px -22px rgba(42,38,35,.2)}
.sp .no-scrollbar::-webkit-scrollbar{display:none}.sp .no-scrollbar{scrollbar-width:none}
.sp :focus{outline:none}
.sp :focus-visible{outline:2px solid ${C.ink};outline-offset:2px}
.sp .focus-within-ring:focus-within{box-shadow:0 0 0 2px ${C.ink}}

@keyframes spFadeUp{from{opacity:0;transform:translate3d(0,16px,0)}to{opacity:1;transform:none}}
@keyframes spFade{from{opacity:0}to{opacity:1}}
@keyframes spFadeOut{from{opacity:1}to{opacity:0}}
@keyframes spSheetUp{from{transform:translate3d(0,100%,0)}to{transform:none}}
@keyframes spSheetDown{from{transform:none}to{transform:translate3d(0,105%,0)}}
@keyframes spModalIn{from{opacity:0;transform:translate3d(0,28px,0) scale(.96)}to{opacity:1;transform:none}}
@keyframes spModalOut{from{opacity:1;transform:none}to{opacity:0;transform:translate3d(0,18px,0) scale(.98)}}
@keyframes spPop{0%{transform:scale(1)}35%{transform:scale(1.4)}65%{transform:scale(.88)}100%{transform:scale(1)}}
@keyframes spGrow{from{transform:scaleX(0)}}
@keyframes spPulse{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.55,1.9);opacity:0}}
@keyframes spDot{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes spToastIn{from{opacity:0;transform:translate3d(0,18px,0) scale(.95)}to{opacity:1;transform:none}}
@keyframes spFlash{0%{opacity:1}100%{opacity:0}}
@keyframes spCardUp{from{opacity:0;transform:translate3d(0,24px,0) scale(.97)}to{opacity:1;transform:none}}

.sp .a-fadeup{animation:spFadeUp .7s ${EASE} both}
.sp .a-fade{animation:spFade .45s ${EASE} both}
.sp .a-pop{animation:spPop .55s ${SPRING}}
.sp .a-grow{transform-origin:0 50%;animation:spGrow 1.2s ${EASE} both}
.sp .a-pulse{animation:spPulse 2.2s ${EASE} infinite}
.sp .a-dot{animation:spDot 1.6s ease-in-out infinite}
.sp .a-toast{animation:spToastIn .55s ${SPRING} both}
.sp .a-flash{animation:spFlash 2.4s ${EASE} both}
.sp .a-cardup{animation:spCardUp .55s ${SPRING} both}
.sp .ov-in{animation:spFade .35s ${EASE} both}
.sp .ov-out{animation:spFadeOut .3s ${EASE} both}
.sp .sheet-in{animation:spSheetUp .62s cubic-bezier(.3,1.22,.52,1) both}
.sp .sheet-out{animation:spSheetDown .32s cubic-bezier(.5,0,.75,0) both}
@media (min-width:768px){
  .sp .sheet-in{animation:spModalIn .55s cubic-bezier(.3,1.3,.5,1) both}
  .sp .sheet-out{animation:spModalOut .28s ${EASE} both}
}

.sp .sp-range{-webkit-appearance:none;appearance:none;height:6px;border-radius:999px;outline:none}
.sp .sp-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:28px;height:28px;border-radius:999px;background:#fff;border:1px solid ${C.line};box-shadow:0 4px 14px -4px rgba(42,38,35,.35);transition:transform .3s ${SPRING};cursor:grab}
.sp .sp-range:active::-webkit-slider-thumb{transform:scale(1.15);cursor:grabbing}
.sp .sp-range::-moz-range-thumb{width:28px;height:28px;border-radius:999px;background:#fff;border:1px solid ${C.line};box-shadow:0 4px 14px -4px rgba(42,38,35,.35)}
.sp .sp-range:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 3px ${C.ink}}

@media (prefers-reduced-motion:reduce){
  .sp *,.sp *::before,.sp *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
`;

/* ───────────────────────────── Mock database ───────────────────────────── */

const AREAS = ["All London", "Soho", "Marylebone", "Fitzrovia", "Bloomsbury", "Shoreditch", "City", "Borough", "Victoria", "South Ken"];
const DRINKS = ["All Drinks", "Flat White", "Matcha", "Pour Over", "Oat Milk", "Pastries"];
const NOTE_CHIPS = ["Silky", "Fruity", "Chocolatey", "Great Oat Milk", "Nutty", "Bright", "Caramel", "Floral", "Balanced", "Bold"];
const AREA_POS = {
  Soho: [446, 398],
  Shoreditch: [900, 196],
  Borough: [770, 560],
  Fitzrovia: [418, 298],
  City: [760, 368],
  Bloomsbury: [508, 258],
  Marylebone: [262, 300],
  Victoria: [372, 690],
  "South Ken": [128, 712],
};

// Map units: 1000 × 700, roughly Hyde Park (W) → Shoreditch (E), Regent's Park (N) → Borough (S).
const SEED_CAFES = [
  {
    id: "monmouth",
    name: "Monmouth Coffee",
    hood: "Borough Market · Covent Garden",
    areas: ["Borough"],
    tube: "Borough",
    tubeAlt: "Covent Garden",
    walk: 5,
    price: "£",
    vibes: ["Walk-up Window", "Market Buzz", "Communal Tables"],
    blurb: "The London institution. Sacks of beans, a queue that moves quickly and cups that justify every minute of it.",
    x: 792,
    y: 516,
  },
  {
    id: "watchhouse",
    name: "WatchHouse",
    hood: "Bermondsey · Soho",
    areas: ["Borough", "Soho"],
    tube: "London Bridge",
    tubeAlt: "Tottenham Ct Rd",
    walk: 6,
    price: "££",
    vibes: ["Minimalist", "Laptop Friendly", "Bakes In-house"],
    blurb: "Pared-back stone interiors, precise espresso and a pastry counter worth arriving early for.",
    x: 868,
    y: 595,
  },
  {
    id: "origin",
    name: "Origin Coffee",
    hood: "Shoreditch · Southwark",
    areas: ["Shoreditch"],
    tube: "Shoreditch High St",
    walk: 5,
    price: "££",
    vibes: ["Roastery Energy", "Laptop Friendly", "Industrial"],
    blurb: "Direct-trade roasters with a brew bar built for slow, curious coffee drinking.",
    x: 876,
    y: 166,
  },
  {
    id: "rosslyn",
    name: "Rosslyn Coffee",
    hood: "City of London",
    areas: ["City"],
    tube: "Bank / Mansion House",
    walk: 2,
    price: "££",
    vibes: ["Walk-up Window", "Minimalist", "Standing Room"],
    blurb: "A tiny, immaculate counter that quietly pours some of the best milk drinks in the Square Mile.",
    x: 796,
    y: 394,
  },
  {
    id: "prufrock",
    name: "Prufrock Coffee",
    hood: "Leather Lane · Holborn",
    areas: ["City"],
    tube: "Chancery Lane",
    walk: 3,
    price: "££",
    vibes: ["Laptop Friendly", "Bright & Airy", "Barista Training"],
    blurb: "A spacious, light-filled pioneer of London's specialty scene, steps from Leather Lane market.",
    x: 644,
    y: 262,
  },
  {
    id: "kaffeine",
    name: "Kaffeine",
    hood: "Fitzrovia",
    areas: ["Fitzrovia"],
    tube: "Oxford Circus",
    walk: 5,
    price: "££",
    vibes: ["Antipodean Café", "Brunch", "Cosy"],
    blurb: "Antipodean hospitality and a flat white that set the standard for the West End.",
    x: 396,
    y: 297,
  },
  {
    id: "storestreet",
    name: "Store Street Espresso",
    hood: "Bloomsbury",
    areas: ["Bloomsbury"],
    tube: "Goodge Street",
    walk: 3,
    price: "£",
    vibes: ["Laptop Friendly", "Skylight", "Minimalist"],
    blurb: "A skylit Bloomsbury favourite with long tables, rotating art and easy-going iced drinks.",
    x: 472,
    y: 271,
  },
  {
    id: "monocle",
    name: "Monocle Café",
    hood: "Chiltern Street · Marylebone",
    areas: ["Marylebone"],
    tube: "Baker Street",
    walk: 5,
    price: "££",
    vibes: ["Tiny & Chic", "Pavement Seats", "Magazine Rack"],
    blurb: "The magazine's tiny café on Chiltern Street: a neat flat white, Japanese-Scandi bakes and a stack of reading.",
    x: 276,
    y: 257,
  },
  {
    id: "hagen",
    name: "Hagen Espresso Bar",
    hood: "Old Brompton Road · South Ken",
    areas: ["South Ken"],
    tube: "South Kensington",
    walk: 2,
    price: "££",
    vibes: ["Danish Hygge", "Al Fresco", "Post-Pilates"],
    blurb: "Copenhagen-inspired espresso bar at the top of Old Brompton Road. Made for a post-reformer iced oat latte.",
    x: 124,
    y: 726,
  },
  {
    id: "commonbreads",
    name: "Common Breads",
    hood: "Victoria",
    areas: ["Victoria"],
    tube: "Victoria",
    walk: 4,
    price: "£",
    vibes: ["Bakery", "Grab & Go", "Sourdough"],
    blurb: "A bakery-café with a cult iced latte. Creamy, lightly sweet and dangerously easy to drink.",
    x: 380,
    y: 690,
  },
];

// p = taste profile: [body, sweetness, brightness, milk, roast/cocoa, cold, pastry]
const SEED_ITEMS = [
  { id: "mon-fw", cafeId: "monmouth", name: "Flat White", rating: 4.9, count: 64, pick: true, styles: ["Flat White"], flavours: ["Nutty", "Velvety Microfoam", "Chocolatey"], p: [0.75, 0.55, 0.3, 0.8, 0.7, 0, 0] },
  { id: "mon-batch", cafeId: "monmouth", name: "Filter Batch Brew", rating: 4.8, count: 41, styles: ["Pour Over"], flavours: ["Clean", "Fruity", "Bright"], p: [0.35, 0.5, 0.75, 0, 0.3, 0, 0] },
  { id: "mon-bun", cafeId: "monmouth", name: "Cinnamon Bun", rating: 4.7, count: 33, styles: ["Pastries"], flavours: ["Buttery", "Spiced", "Sticky"], p: [0.6, 0.9, 0.1, 0.2, 0.4, 0, 1] },
  { id: "wh-oat", cafeId: "watchhouse", name: "Oat Flat White", rating: 4.8, count: 52, styles: ["Flat White", "Oat Milk"], flavours: ["Oat-Friendly", "Velvety Microfoam", "Caramel"], p: [0.65, 0.65, 0.3, 0.85, 0.6, 0, 0] },
  { id: "wh-matcha", cafeId: "watchhouse", name: "Iced Matcha Latte", rating: 4.6, count: 38, styles: ["Matcha", "Oat Milk"], flavours: ["Grassy", "Creamy", "Refreshing"], p: [0.4, 0.55, 0.2, 0.8, 0.1, 1, 0] },
  { id: "wh-card", cafeId: "watchhouse", name: "Cardamom Bun", rating: 4.8, count: 29, pick: true, styles: ["Pastries"], flavours: ["Spiced", "Buttery", "Aromatic"], p: [0.6, 0.8, 0.15, 0.2, 0.3, 0, 1] },
  { id: "or-v60", cafeId: "origin", name: "V60 Pour Over", rating: 4.9, count: 36, pick: true, styles: ["Pour Over"], flavours: ["Floral", "Fruity", "Tea-like"], p: [0.25, 0.55, 0.85, 0, 0.15, 0, 0] },
  { id: "or-tonic", cafeId: "origin", name: "Espresso Tonic", rating: 4.7, count: 22, styles: [], flavours: ["Citrus", "Sparkling", "Bright"], p: [0.3, 0.45, 0.8, 0, 0.3, 1, 0] },
  { id: "ro-cort", cafeId: "rosslyn", name: "Cortado", rating: 4.9, count: 47, pick: true, styles: [], flavours: ["Chocolatey", "Silky", "Punchy"], p: [0.85, 0.5, 0.35, 0.6, 0.75, 0, 0] },
  { id: "ro-fw", cafeId: "rosslyn", name: "Flat White", rating: 4.9, count: 58, styles: ["Flat White"], flavours: ["Velvety Microfoam", "Toffee", "Nutty"], p: [0.75, 0.6, 0.35, 0.8, 0.65, 0, 0] },
  { id: "pr-batch", cafeId: "prufrock", name: "Batch Brew", rating: 4.8, count: 27, styles: ["Pour Over"], flavours: ["Juicy", "Clean", "Stone Fruit"], p: [0.35, 0.55, 0.7, 0, 0.25, 0, 0] },
  { id: "pr-oatcort", cafeId: "prufrock", name: "Oat Cortado", rating: 4.7, count: 24, styles: ["Oat Milk"], flavours: ["Oat-Friendly", "Nutty", "Punchy"], p: [0.8, 0.55, 0.3, 0.65, 0.65, 0, 0] },
  { id: "ka-fw", cafeId: "kaffeine", name: "Flat White", rating: 4.8, count: 49, styles: ["Flat White"], flavours: ["Nutty", "Silky", "Caramel"], p: [0.7, 0.6, 0.3, 0.8, 0.65, 0, 0] },
  { id: "ka-cold", cafeId: "kaffeine", name: "Cold Brew", rating: 4.6, count: 21, styles: [], flavours: ["Chocolatey", "Smooth", "Low Acidity"], p: [0.6, 0.5, 0.15, 0, 0.7, 1, 0] },
  { id: "ss-iced", cafeId: "storestreet", name: "Iced Latte", rating: 4.6, count: 34, styles: [], flavours: ["Creamy", "Refreshing", "Mellow"], p: [0.45, 0.55, 0.25, 0.85, 0.5, 1, 0] },
  { id: "ss-mocha", cafeId: "storestreet", name: "Mocha", rating: 4.5, count: 26, styles: [], flavours: ["Chocolatey", "Rich", "Indulgent"], p: [0.8, 0.85, 0.15, 0.85, 0.85, 0, 0] },
  { id: "mo-fw", cafeId: "monocle", name: "Flat White", rating: 4.6, count: 31, styles: ["Flat White"], flavours: ["Nutty", "Smooth", "Balanced"], p: [0.7, 0.55, 0.3, 0.8, 0.6, 0, 0] },
  { id: "mo-bun", cafeId: "monocle", name: "Cinnamon Bun", rating: 4.5, count: 19, styles: ["Pastries"], flavours: ["Spiced", "Buttery", "Soft"], p: [0.55, 0.85, 0.1, 0.2, 0.35, 0, 1] },
  { id: "hg-iced", cafeId: "hagen", name: "Iced Oat Latte", rating: 4.7, count: 28, styles: ["Oat Milk"], flavours: ["Oat-Friendly", "Creamy", "Refreshing"], p: [0.45, 0.6, 0.25, 0.85, 0.5, 1, 0] },
  { id: "hg-fw", cafeId: "hagen", name: "Flat White", rating: 4.6, count: 33, styles: ["Flat White"], flavours: ["Velvety Microfoam", "Caramel", "Balanced"], p: [0.7, 0.6, 0.3, 0.8, 0.6, 0, 0] },
  { id: "cb-iced", cafeId: "commonbreads", name: "Iced Latte", rating: 4.8, count: 24, pick: true, styles: [], flavours: ["Creamy", "Caramel", "Refreshing"], p: [0.5, 0.6, 0.25, 0.85, 0.55, 1, 0] },
];

const DAY = 86400000;
const SEED_HISTORY = [
  { id: "h-seed-1", itemId: "ro-cort", cafeId: "rosslyn", name: "Cortado", cafeName: "Rosslyn Coffee", rating: 4.8, notes: ["Chocolatey", "Silky"], ts: Date.now() - 2 * DAY },
  { id: "h-seed-2", itemId: "mon-bun", cafeId: "monmouth", name: "Cinnamon Bun", cafeName: "Monmouth Coffee", rating: 4.5, notes: ["Caramel"], ts: Date.now() - 6 * DAY },
];

/* ───────────────────────────── Helpers ───────────────────────────── */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const f1 = (n) => n.toFixed(1);
const f2 = (n) => n.toFixed(2);
const avg = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);

function timeAgo(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "Yesterday" : `${d} days ago`;
}

function titleCase(s) {
  return s.replace(/\s+/g, " ").trim().replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

function inferStyles(name) {
  const n = name.toLowerCase();
  const s = [];
  if (n.includes("flat white")) s.push("Flat White");
  if (n.includes("matcha")) s.push("Matcha");
  if (/v60|pour|filter|batch|chemex|aeropress/.test(n)) s.push("Pour Over");
  if (n.includes("oat")) s.push("Oat Milk");
  if (/bun|croissant|cake|pastry|cookie|brownie|muffin|danish|loaf|tart/.test(n)) s.push("Pastries");
  return s;
}

function inferProfile(name) {
  const s = inferStyles(name);
  const n = name.toLowerCase();
  const p = [0.6, 0.55, 0.35, 0.6, 0.55, 0, 0];
  if (s.includes("Pour Over")) Object.assign(p, [0.3, 0.55, 0.8, 0, 0.25]);
  if (s.includes("Pastries")) Object.assign(p, [0.6, 0.85, 0.1, 0.2, 0.35, 0, 1]);
  if (s.includes("Matcha")) Object.assign(p, [0.4, 0.55, 0.2, 0.8, 0.1]);
  if (/iced|cold/.test(n)) p[5] = 1;
  if (/espresso|ristretto/.test(n) && !/latte|tonic/.test(n)) p[3] = 0;
  return p;
}

function matchScore(a, b) {
  let d = 0;
  for (let i = 0; i < a.p.length; i++) d += (a.p[i] - b.p[i]) ** 2;
  d = Math.sqrt(d / a.p.length);
  const shared = b.flavours.filter((f) => a.flavours.includes(f)).length;
  const styleShared = a.styles.some((s) => b.styles.includes(s));
  return clamp(Math.round(101 - d * 200 - (3 - shared) * 2 - (styleShared ? 0 : 4)), 55, 98);
}

function twist(src, rec) {
  const d = (i) => rec.p[i] - src.p[i];
  if (rec.p[6] > 0.5 && src.p[6] < 0.5) return "and it's the perfect pastry pairing";
  if (src.p[6] > 0.5 && rec.p[6] < 0.5) return "and it's the coffee to pair it with";
  if (d(5) > 0.5) return "but served over ice";
  if (d(5) < -0.5) return "but served hot and comforting";
  if (d(3) < -0.4) return "with no milk, so the origin shines";
  if (d(3) > 0.4) return "softened with silky milk";
  if (d(2) > 0.18) return "but brighter and more fruit-forward";
  if (d(0) > 0.08) return "with a denser, punchier body";
  if (d(1) > 0.08) return "with a touch more sweetness";
  return null;
}

function reasonFor(src, rec) {
  const shared = rec.flavours.filter((f) => src.flavours.includes(f));
  const tw = twist(src, rec);
  if (shared.length) {
    const s = shared.slice(0, 2).map((x) => x.toLowerCase()).join(" & ");
    return tw ? `Same ${s} character you love, ${tw}.` : `Same ${s} character you love, poured with a different house style.`;
  }
  if (tw) return `A complementary pick: ${tw.replace(/^(and it's |but |with )/, "")}.`;
  return `Similar balance and body to your ${src.name.toLowerCase()}.`;
}

function useMediaQuery(q) {
  const get = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(q).matches : false);
  const [m, setM] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(q);
    const h = () => setM(mq.matches);
    h();
    mq.addEventListener ? mq.addEventListener("change", h) : mq.addListener(h);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", h) : mq.removeListener(h));
  }, [q]);
  return m;
}

function useCountUp(target, delay = 0, dur = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now() + delay;
    const step = (now) => {
      if (now < t0) {
        raf = requestAnimationFrame(step);
        return;
      }
      const p = Math.min(1, (now - t0) / dur);
      setV(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, delay, dur]);
  return v;
}

/* ───────────────────────────── Primitives ───────────────────────────── */

/** Segmented control / pill row with a sliding indicator (transform-driven). */
function Segmented({ options, value, onChange, label, variant = "white", size = "md", scroll = false, full = false, glass = false }) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const sig = opts.map((o) => o.value).join("|");
  const refs = useRef({});
  const trackRef = useRef(null);
  const scrollRef = useRef(null);
  const [ind, setInd] = useState({ x: 0, w: 0, ready: false });

  const measure = useCallback(() => {
    const el = refs.current[value];
    if (!el) return;
    const x = el.offsetLeft;
    const w = el.offsetWidth;
    setInd((p) => (p.x === x && p.w === w && p.ready ? p : { x, w, ready: true }));
  }, [value]);

  useLayoutEffect(() => {
    measure();
  }, [measure, sig]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined" || !trackRef.current) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(trackRef.current);
    // Labels change width when the web font swaps in; remeasure so the pill stays aligned.
    const fonts = typeof document !== "undefined" && document.fonts;
    let alive = true;
    if (fonts) {
      fonts.ready.then(() => alive && measure());
      fonts.addEventListener && fonts.addEventListener("loadingdone", measure);
    }
    window.addEventListener("resize", measure);
    return () => {
      alive = false;
      ro.disconnect();
      fonts && fonts.removeEventListener && fonts.removeEventListener("loadingdone", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const el = refs.current[value];
    const sc = scrollRef.current;
    if (scroll && el && sc) sc.scrollTo({ left: el.offsetLeft - sc.clientWidth / 2 + el.offsetWidth / 2, behavior: "smooth" });
  }, [value, scroll]);

  const ink = variant === "ink";
  const sm = size === "sm";
  const track = (
    <div
      ref={trackRef}
      role="group"
      aria-label={label}
      className={`relative ${full ? "flex w-full" : "inline-flex"} items-center gap-0.5 rounded-full p-1 ${glass && !scroll ? "glass-white hair" : ""}`}
      style={scroll ? undefined : glass ? { boxShadow: "0 6px 20px -12px rgba(42,38,35,.25)" } : { background: C.stone }}
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-1 bottom-1 rounded-full"
        style={{
          width: ind.w,
          transform: `translate3d(${ind.x}px,0,0)`,
          opacity: ind.ready ? 1 : 0,
          background: ink ? C.ink : "#fff",
          boxShadow: ink ? "0 4px 12px -6px rgba(42,38,35,.5)" : "0 1px 2px rgba(42,38,35,.08), 0 0 0 1px rgba(42,38,35,.04)",
          transition: `transform .55s ${EASE}, width .55s ${EASE}, opacity .3s`,
          willChange: "transform",
        }}
      />
      {opts.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            ref={(el) => (refs.current[o.value] = el)}
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`press relative z-10 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium ${full ? "flex-1" : ""} ${sm ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}`}
            style={{ color: active ? (ink ? "#fff" : C.ink) : C.taupe }}
          >
            {Icon && <Icon size={sm ? 13 : 15} strokeWidth={2} aria-hidden="true" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
  if (!scroll) return track;
  // Scrolling rows: the rounded bar itself is capped at the available width and
  // the pills scroll inside it, so the bar's ends never run off screen.
  return (
    <div
      ref={scrollRef}
      className={`no-scrollbar max-w-full overflow-x-auto rounded-full ${glass ? "glass-white hair" : ""}`}
      style={{ width: "fit-content", overscrollBehaviorX: "contain", ...(glass ? { boxShadow: "0 6px 20px -12px rgba(42,38,35,.25)" } : { background: C.stone }) }}
    >
      {track}
    </div>
  );
}

function BookmarkButton({ saved, onToggle, size = 17, className = "" }) {
  const [pop, setPop] = useState(0);
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from Want to Try" : "Save to Want to Try"}
      aria-pressed={saved}
      onClick={(e) => {
        e.stopPropagation();
        setPop((p) => p + 1);
        onToggle();
      }}
      className={`press flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${className}`}
      style={{ background: saved ? C.stone : "transparent" }}
    >
      <span key={pop} className={`inline-flex ${pop ? "a-pop" : ""}`}>
        <Bookmark size={size} strokeWidth={1.9} color={saved ? C.ink : C.taupe} fill={saved ? C.ink : "none"} />
      </span>
    </button>
  );
}

function ScoreChip({ value, digits = 1, strong = false }) {
  return (
    <span
      className="tabular inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: strong ? C.ink : C.stone, color: strong ? "#fff" : C.ink }}
    >
      {value.toFixed(digits)}
      <Star size={11} strokeWidth={0} fill={strong ? "#fff" : C.ink} aria-hidden="true" />
    </span>
  );
}

function PickBadge({ small = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium ${small ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-xs"}`}
      style={{ background: "rgba(196,154,116,.12)", color: C.clay }}
    >
      samia's pick ✦
    </span>
  );
}

function Tag({ children, tone = "stone" }) {
  const tones = {
    stone: { background: C.stone, color: C.taupe },
    sage: { background: "rgba(122,139,90,.13)", color: C.sage },
    outline: { background: "#fff", color: C.taupe, boxShadow: `inset 0 0 0 1px ${C.line}` },
  };
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium" style={tones[tone]}>
      {children}
    </span>
  );
}

function SectionTitle({ eyebrow, title, right }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="mb-1 text-sm" style={{ color: C.taupe }}>
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-medium tracking-tight md:text-2xl">{title}</h2>
      </div>
      {right}
    </div>
  );
}

// Vector trace of the sam'spresso wordmark. Glyph order: s a m ' s p r e s s o.
const LOGO_W = 1941;
const LOGO_H = 292;
const LOGO_GLYPHS = [
  { x0: 2, x1: 159, body: "M52.1 227.4C18.2 222.5 2.0 210.2 2.0 189.4C2.0 168.6 20.1 160.0 45.0 169.1C48.0 170.2 50.9 171.5 51.5 171.9C54.1 173.9 73.0 181.1 77.1 181.6C81.4 182.2 81.9 182.0 83.5 179.7C84.8 177.7 84.9 176.7 84.0 175.0C82.6 172.4 81.6 172.0 62.3 167.0C35.8 160.0 21.2 152.8 11.6 141.8C4.3 133.4 1.6 121.9 3.9 108.4C5.6 98.5 8.9 92.1 15.9 85.1C29.7 71.3 53.7 65.0 87.0 66.3C131.8 68.2 157.8 84.4 155.8 109.4C154.9 119.9 149.4 126.7 139.1 129.7C134.3 131.1 132.3 131.1 125.4 130.1C118.1 129.1 113.8 127.7 93.5 119.4C86.7 116.6 81.8 116.1 79.5 118.0C77.6 119.6 77.5 123.4 79.5 125.0C80.3 125.6 88.9 128.2 98.7 130.6C126.1 137.4 138.0 142.8 148.1 153.0C162.4 167.6 162.3 191.9 147.8 207.6C138.9 217.3 124.9 223.9 106.7 227.1C93.6 229.4 66.7 229.5 52.1 227.4Z", shine: "M10.0 194.5C9.2 193.5 8.9 191.2 9.2 188.0C10.2 178.0 18.4 172.1 29.8 173.3C35.7 173.9 39.5 176.6 38.4 179.5C37.6 181.6 35.4 182.0 30.3 181.1C21.8 179.5 18.4 182.0 16.4 191.5C15.4 195.9 12.4 197.4 10.0 194.5ZM12.0 116.1C10.8 113.7 12.1 105.9 15.1 99.0C20.7 85.9 40.8 75.1 59.7 75.0C65.3 75.0 66.5 75.9 65.6 79.3C65.1 81.2 63.8 81.7 54.4 83.2C43.0 85.1 34.0 88.6 28.3 93.4C24.4 96.6 20.3 104.8 19.4 111.0C19.0 113.5 18.3 116.1 17.7 116.8C16.3 118.6 13.2 118.3 12.0 116.1Z" },
  { x0: 168, x1: 353, body: "M216.9 227.1C194.3 221.0 178.4 202.7 170.9 174.2C168.0 163.2 167.2 138.8 169.4 126.3C172.5 108.5 179.0 94.1 188.3 84.7C201.5 71.2 218.2 65.0 238.4 66.3C258.5 67.5 270.5 75.2 281.4 93.9C287.7 104.5 288.8 106.0 291.1 106.0C293.5 106.0 295.0 102.5 294.0 99.0C293.0 95.4 288.2 86.2 284.9 81.3L282.0 77.1 L285.0 75.0C297.4 66.2 324.1 65.8 336.7 74.3C342.8 78.4 348.3 85.8 350.6 92.9C352.1 97.8 352.4 103.8 352.7 142.6C353.0 168.5 352.7 189.6 352.2 193.8C350.2 208.3 342.0 219.5 330.2 224.1C321.5 227.5 300.4 228.0 288.9 225.1C284.4 223.9 280.2 222.6 279.7 222.1C279.1 221.5 280.5 219.1 283.4 215.8C292.8 205.2 297.7 191.0 292.0 191.0C289.6 191.0 287.1 193.7 281.3 202.5C275.9 210.7 268.1 218.6 261.8 222.3C250.7 228.8 231.0 230.9 216.9 227.1ZM265.8 159.5C267.8 157.8 269.2 155.4 270.0 152.0C274.1 134.8 260.1 122.7 251.3 135.9C248.3 140.3 248.1 150.8 250.9 156.0C254.2 162.3 260.7 163.8 265.8 159.5Z", shine: "M176.5 140.0C175.4 138.2 176.9 126.0 179.1 117.9C185.2 95.8 201.4 79.2 221.0 75.0C224.0 74.4 228.1 74.0 230.0 74.2C233.1 74.5 233.5 74.8 233.5 77.5C233.5 80.3 233.3 80.4 225.5 82.0C200.9 86.7 188.9 102.0 183.3 135.5C182.6 139.9 182.2 140.5 179.8 140.8C178.4 141.0 176.9 140.6 176.5 140.0Z" },
  { x0: 367, x1: 639, body: "M399.2 226.9C382.3 224.7 370.8 214.0 368.0 197.9C366.4 188.8 367.1 97.9 368.8 92.8C372.0 83.2 381.9 73.4 391.5 70.4C399.2 67.9 414.5 67.4 421.6 69.5C426.5 70.9 439.0 77.4 439.0 78.5C439.0 78.7 437.4 81.2 435.4 84.1C430.5 91.5 425.3 101.9 423.9 107.3C422.7 112.4 423.8 116.0 426.9 116.0C429.4 116.0 431.2 113.7 435.5 105.0C439.9 96.0 448.4 84.5 454.5 79.6C460.2 74.9 470.2 69.6 476.5 68.1C493.9 63.7 517.7 67.2 529.8 76.0L533.9 78.9 L528.6 86.8C518.6 101.6 515.5 115.5 522.0 115.5C524.1 115.5 525.3 114.0 530.0 105.4C537.0 92.6 540.5 87.7 547.1 81.4C557.6 71.5 568.1 67.2 583.5 66.3C612.1 64.8 629.2 76.2 636.2 101.7C638.2 108.9 638.4 112.5 638.8 149.3C639.1 183.5 638.9 190.2 637.5 197.3C633.7 216.0 624.6 224.1 604.3 227.0C589.7 229.0 575.1 225.1 567.0 217.0C558.4 208.4 557.0 201.8 557.0 169.8C557.0 142.2 556.1 134.7 552.8 132.9C549.9 131.3 546.4 132.6 545.2 135.7C544.6 137.4 543.9 150.5 543.7 167.5C543.2 197.3 542.6 202.0 538.5 209.9C535.8 215.3 527.4 222.7 522.1 224.4C508.4 228.9 490.0 228.2 479.3 222.7C474.7 220.3 467.8 211.9 465.0 205.4C462.6 199.7 462.6 198.6 462.0 167.8C461.5 136.7 461.5 136.0 459.3 133.8C457.4 132.0 456.6 131.8 454.3 132.6C449.3 134.3 449.0 136.2 449.0 166.0C449.0 196.8 448.1 203.0 442.8 211.3C437.0 220.3 429.2 224.9 416.0 227.0C408.8 228.1 408.2 228.1 399.2 226.9Z", shine: "M375.6 122.4C372.1 118.9 374.9 97.2 379.8 89.0C383.1 83.6 389.7 78.4 395.1 77.0C397.3 76.4 401.9 76.0 405.3 76.2C411.5 76.5 411.5 76.5 411.5 79.5C411.5 82.2 411.2 82.5 408.0 82.8C393.4 84.0 387.3 88.0 384.0 98.7C382.9 102.4 381.9 108.5 381.8 113.2C381.6 123.1 379.4 126.3 375.6 122.4Z" },
  { x0: 648, x1: 714, body: "M675.0 97.7C667.5 96.7 661.8 93.7 657.3 88.6C650.7 81.1 648.0 69.7 648.1 49.5C648.1 28.5 652.3 14.8 660.8 8.3C666.5 4.0 671.8 2.6 682.1 2.6C689.6 2.6 691.5 3.0 696.6 5.6C703.6 9.1 708.8 15.3 711.5 23.8C713.9 31.0 714.9 61.9 713.0 71.4C709.2 90.9 695.1 100.7 675.0 97.7Z", shine: "M657.0 57.5C656.1 56.4 655.9 52.3 656.2 42.7C656.5 29.8 656.7 29.1 660.0 22.4C663.1 16.3 664.1 15.2 668.9 12.7C672.3 11.0 676.0 10.0 678.6 10.0C686.5 10.0 687.2 16.0 679.3 17.0C674.1 17.8 669.0 20.9 666.8 24.7C664.8 28.0 663.0 40.5 663.0 50.5C663.0 58.2 660.2 61.4 657.0 57.5Z" },
  { x0: 716, x1: 874, body: "M770.0 227.9C744.7 224.7 726.0 215.7 719.9 203.8C712.8 189.9 717.0 174.2 729.5 168.0C733.5 166.0 735.8 165.6 742.4 165.7C751.2 165.8 757.7 167.7 773.6 175.0C782.8 179.3 791.0 182.0 794.7 182.0C797.9 182.0 800.5 177.8 799.0 175.0C797.6 172.4 796.0 171.8 779.1 167.4C751.9 160.4 737.5 153.6 727.8 143.2C716.6 131.1 714.9 112.5 723.2 95.0C726.1 88.9 735.2 80.2 742.5 76.3C770.5 61.6 829.0 63.1 854.2 79.1C868.0 88.0 874.1 102.7 869.4 116.3C866.7 124.3 856.5 131.0 846.9 131.0C840.2 131.0 828.2 127.7 816.1 122.5C799.2 115.3 793.0 115.1 793.0 121.6C793.0 125.0 796.1 126.6 807.5 129.0C850.4 138.4 869.6 151.3 873.2 173.4C875.0 184.6 872.6 194.4 865.9 203.5C852.9 221.3 830.4 229.2 793.4 228.9C784.1 228.8 773.6 228.4 770.0 227.9Z", shine: "M725.0 194.5C723.2 192.3 724.2 183.5 726.7 180.2C731.5 173.7 741.7 171.2 749.5 174.4C752.1 175.5 753.0 176.5 753.0 178.3C753.0 181.5 751.1 182.1 745.3 181.1C736.8 179.5 733.4 182.0 731.4 191.5C730.4 195.9 727.4 197.4 725.0 194.5ZM727.0 116.5C724.0 112.9 729.2 98.1 736.2 90.5C744.4 81.5 760.4 75.1 774.7 75.0C779.1 75.0 780.0 75.3 780.5 77.1C781.6 80.4 779.3 81.6 768.2 83.4C748.5 86.5 736.2 96.4 734.4 110.6C734.0 113.3 733.3 116.1 732.7 116.8C731.4 118.4 728.5 118.3 727.0 116.5Z" },
  { x0: 887, x1: 1068, body: "M915.1 288.4C903.4 285.3 896.5 280.0 892.1 270.7C887.0 260.0 886.9 257.7 887.2 174.0C887.5 96.8 887.5 96.5 889.7 91.1C894.4 79.6 900.4 73.9 912.1 70.0C923.7 66.1 943.4 67.3 957.3 72.8L961.1 74.3 L958.7 76.9C954.4 81.6 947.3 91.4 945.1 95.8C942.6 100.7 942.7 104.8 945.2 106.3C947.4 107.8 949.1 106.2 954.5 97.9C961.9 86.5 972.0 76.7 981.1 72.1C999.3 62.9 1021.0 64.2 1038.3 75.7C1046.9 81.4 1052.9 88.9 1058.7 100.8C1064.2 112.4 1066.8 124.1 1067.7 141.1C1068.7 163.1 1065.6 179.7 1057.4 196.1C1045.9 218.7 1025.9 230.0 999.1 228.8C981.1 228.0 971.9 223.7 956.8 209.2C949.3 202.1 947.8 201.0 946.1 201.9C943.4 203.4 943.1 205.0 944.6 208.7C946.7 214.0 952.9 220.6 961.9 227.3L970.3 233.5 L969.6 246.0C968.6 265.1 965.7 273.6 957.6 280.7C951.3 286.3 942.1 289.2 930.0 289.6C924.1 289.7 918.5 289.3 915.1 288.4ZM983.2 161.1C986.3 158.3 986.5 157.8 986.8 150.0C987.4 137.0 983.7 130.0 976.9 131.5C972.2 132.6 969.5 138.7 969.6 148.1C969.7 158.4 972.6 163.3 978.7 163.9C979.4 163.9 981.4 162.7 983.2 161.1Z", shine: "M895.9 120.8C895.1 119.4 894.9 116.0 895.3 111.1C896.2 99.9 897.7 93.8 901.3 87.9C903.9 83.4 905.6 81.9 910.9 79.2C916.4 76.5 918.3 76.0 924.7 76.0C930.6 76.0 932.2 76.3 932.7 77.6C933.9 80.8 931.5 82.5 924.6 83.2C920.9 83.7 916.2 84.9 914.0 86.0C907.0 89.6 903.0 99.7 903.0 113.8C903.0 117.8 902.5 121.1 901.8 121.8C899.9 123.7 897.2 123.2 895.9 120.8Z" },
  { x0: 1081, x1: 1234, body: "M1113.5 226.9C1095.4 224.3 1084.6 213.5 1082.0 195.5C1080.6 185.6 1080.7 107.4 1082.1 99.1C1085.7 78.3 1101.4 67.1 1125.5 68.2C1134.2 68.6 1136.6 69.1 1142.1 71.7C1145.6 73.3 1149.6 75.6 1150.9 76.7L1153.3 78.7 L1150.3 83.1C1145.8 89.7 1139.2 103.0 1138.2 107.5C1136.9 113.2 1138.2 116.2 1141.7 115.8C1144.0 115.6 1145.0 114.5 1147.3 109.5C1157.3 88.4 1170.2 75.1 1185.6 70.0C1198.0 65.8 1213.7 68.6 1221.9 76.3C1234.6 88.4 1237.4 110.9 1228.3 128.8C1219.0 147.1 1194.6 154.4 1170.6 146.1C1167.3 144.9 1164.3 144.0 1163.8 144.0C1163.4 144.0 1163.0 155.6 1163.0 169.8C1163.0 188.0 1162.6 196.9 1161.6 200.5C1157.4 216.3 1147.8 224.4 1130.2 227.0C1122.6 228.1 1121.8 228.1 1113.5 226.9Z", shine: "M1089.6 122.4C1087.7 120.6 1087.6 118.3 1089.0 107.2C1091.0 91.6 1095.9 83.1 1105.5 78.6C1112.3 75.3 1123.3 74.9 1124.9 77.8C1126.4 80.5 1124.4 83.0 1120.7 83.0C1111.3 83.1 1103.5 87.2 1100.1 93.8C1097.7 98.5 1096.0 107.5 1096.0 115.5C1096.0 123.4 1093.4 126.2 1089.6 122.4Z" },
  { x0: 1242, x1: 1410, body: "M1305.2 227.0C1294.1 224.7 1289.0 222.9 1279.3 217.7C1263.0 209.0 1252.0 195.7 1245.8 177.0C1242.7 167.7 1242.6 167.1 1242.6 149.0C1242.6 127.9 1244.0 120.7 1250.7 107.2C1255.4 97.9 1266.5 85.8 1275.7 80.0C1293.7 68.6 1319.0 63.9 1345.0 67.0C1376.4 70.9 1398.4 85.1 1407.0 107.0C1413.2 122.6 1408.8 142.0 1397.3 150.4C1387.6 157.4 1367.3 160.7 1340.3 159.7C1332.1 159.4 1324.6 159.6 1322.5 160.1C1318.0 161.4 1316.3 164.8 1318.4 168.9C1321.8 175.5 1333.0 176.0 1351.8 170.4C1363.1 167.0 1365.7 166.6 1375.6 166.5C1386.2 166.5 1386.9 166.6 1391.6 169.5C1398.5 173.8 1401.5 179.9 1401.4 190.0C1401.4 195.8 1400.8 198.6 1399.0 202.4C1394.3 212.1 1382.6 220.7 1369.0 224.4C1351.3 229.3 1322.5 230.4 1305.2 227.0ZM1338.8 133.6C1339.2 130.0 1337.3 125.3 1334.6 123.5C1333.5 122.7 1330.7 122.0 1328.5 122.0C1323.6 122.0 1320.7 124.6 1319.2 130.3C1317.4 136.7 1318.0 137.1 1328.9 136.8L1338.5 136.5 L1338.8 133.6Z", shine: "M1250.7 141.6C1249.6 140.4 1249.5 138.9 1250.2 134.3C1252.7 117.7 1258.2 106.8 1270.0 94.9C1277.1 87.8 1280.1 85.5 1288.0 81.6C1296.8 77.3 1307.9 74.1 1314.0 74.0C1317.0 74.0 1319.0 75.7 1319.0 78.2C1319.0 80.5 1316.7 81.6 1310.4 82.3C1297.9 83.7 1281.0 92.6 1272.5 102.4C1266.2 109.5 1260.4 121.8 1258.4 132.0C1257.4 136.7 1256.3 141.1 1255.7 141.8C1254.4 143.4 1252.5 143.3 1250.7 141.6Z" },
  { x0: 1419, x1: 1576, body: "M1476.0 228.3C1453.7 224.9 1444.3 222.3 1434.7 216.7C1429.3 213.5 1423.4 207.1 1420.9 201.6C1418.8 197.0 1418.4 186.8 1420.0 180.8C1422.1 173.3 1429.1 167.7 1438.3 166.0C1447.1 164.3 1455.4 166.2 1472.1 173.6C1480.2 177.1 1489.4 180.5 1492.5 181.2C1498.0 182.3 1498.4 182.2 1500.2 180.1C1504.4 174.9 1501.5 172.7 1484.8 168.4C1456.6 161.1 1442.4 155.0 1432.9 146.3C1418.9 133.3 1416.2 114.4 1425.5 95.3C1434.9 76.2 1459.8 66.1 1497.5 66.0C1526.0 66.0 1552.6 73.8 1564.2 85.7C1574.6 96.3 1576.0 114.5 1567.1 123.7C1559.8 131.3 1546.3 132.6 1531.0 127.3C1526.3 125.6 1518.6 122.6 1513.8 120.6C1504.6 116.7 1499.1 115.9 1496.5 118.0C1494.6 119.6 1494.5 123.4 1496.4 125.0C1497.2 125.6 1506.8 128.4 1517.7 131.0C1540.7 136.7 1554.1 142.6 1563.2 150.9C1580.6 166.8 1580.2 193.3 1562.3 210.0C1552.2 219.5 1539.2 224.9 1519.0 228.0C1512.9 228.9 1481.5 229.2 1476.0 228.3Z", shine: "M1427.6 194.4C1423.4 190.3 1427.8 179.1 1435.1 175.2C1438.8 173.2 1440.5 172.9 1445.8 173.3C1449.9 173.6 1452.8 174.4 1454.0 175.5C1458.3 179.4 1454.9 182.5 1447.8 181.2C1439.7 179.6 1434.0 183.0 1434.0 189.3C1434.0 195.1 1430.8 197.7 1427.6 194.4ZM1429.1 116.2C1427.8 113.7 1429.4 105.1 1432.4 99.2C1437.4 89.2 1444.6 83.3 1457.5 78.4C1463.0 76.4 1466.4 75.8 1473.5 75.6L1482.5 75.5 L1482.8 78.1C1483.2 81.3 1482.6 81.6 1472.1 83.0C1450.9 85.9 1438.8 95.5 1436.4 111.4C1436.0 113.6 1435.3 116.1 1434.7 116.8C1433.3 118.6 1430.2 118.3 1429.1 116.2Z" },
  { x0: 1587, x1: 1745, body: "M1638.1 227.4C1604.3 222.5 1587.8 210.0 1587.8 189.4C1587.9 182.3 1589.5 177.8 1593.9 172.7C1602.1 163.4 1617.9 163.1 1637.5 172.0C1652.0 178.6 1659.2 181.2 1663.7 181.3C1667.8 181.5 1668.6 181.2 1669.9 178.8C1672.5 174.2 1669.9 172.7 1649.0 167.1C1620.4 159.4 1607.4 153.0 1597.6 141.8C1590.3 133.4 1587.6 121.9 1589.9 108.4C1591.6 98.5 1594.9 92.1 1601.9 85.1C1615.7 71.3 1639.7 65.0 1673.0 66.3C1690.2 67.1 1703.6 69.6 1716.2 74.7C1723.8 77.7 1726.2 79.3 1732.0 85.0C1737.5 90.4 1739.2 92.8 1740.4 97.1C1745.0 112.6 1739.1 125.6 1725.6 129.5C1715.7 132.4 1704.6 130.0 1681.1 120.1C1673.5 116.9 1667.3 116.1 1665.2 118.2C1663.6 119.8 1663.7 123.5 1665.5 125.0C1666.3 125.6 1675.8 128.4 1686.7 131.1C1702.7 135.1 1708.5 137.0 1716.9 141.2C1736.8 151.1 1744.5 162.0 1744.5 180.6C1744.5 189.0 1744.3 190.1 1740.7 197.2C1732.8 213.4 1716.2 223.4 1691.0 227.5C1679.2 229.4 1651.2 229.3 1638.1 227.4Z", shine: "M1596.2 194.8C1594.3 192.9 1594.8 185.9 1597.3 181.5C1600.6 175.5 1606.7 172.7 1615.0 173.3C1620.0 173.7 1621.8 174.3 1623.2 176.0C1626.6 180.2 1623.6 182.4 1616.3 181.1C1607.8 179.5 1604.4 182.0 1602.4 191.5C1601.4 195.8 1598.7 197.3 1596.2 194.8ZM1598.1 116.6C1596.5 114.7 1598.0 106.1 1601.1 99.1C1603.7 93.1 1611.6 85.2 1618.9 81.5C1625.9 78.0 1637.9 75.0 1645.1 75.0C1651.3 75.0 1652.5 75.8 1651.6 79.3C1651.1 81.3 1649.9 81.7 1640.7 83.1C1619.2 86.4 1607.7 95.5 1605.4 111.0C1605.0 113.5 1604.3 116.1 1603.7 116.8C1602.4 118.4 1599.5 118.3 1598.1 116.6Z" },
  { x0: 1754, x1: 1939, body: "M1823.5 227.4C1811.6 225.3 1805.5 223.3 1795.5 218.3C1776.2 208.7 1764.8 195.6 1758.0 175.1C1755.3 167.1 1754.7 163.7 1754.3 152.5C1753.3 129.2 1758.4 111.6 1770.7 96.5C1785.8 77.9 1809.3 67.7 1840.0 66.3C1872.9 64.8 1900.0 73.6 1917.5 91.5C1928.7 102.9 1934.5 114.5 1937.5 131.7C1940.8 150.7 1938.3 169.9 1930.3 186.0C1921.6 203.5 1903.2 218.6 1883.7 224.0C1866.3 228.9 1840.2 230.4 1823.5 227.4ZM1852.1 163.0C1853.1 162.4 1854.9 160.1 1856.1 157.8C1857.9 154.3 1858.2 152.4 1857.8 146.5C1857.1 136.0 1853.4 131.0 1846.4 131.0C1839.0 131.0 1834.9 137.0 1834.7 147.9C1834.6 155.1 1836.4 159.8 1840.2 162.4C1842.8 164.2 1849.2 164.5 1852.1 163.0Z", shine: "M1763.0 141.5C1761.2 139.3 1762.4 128.8 1765.5 119.9C1772.0 101.0 1788.0 86.1 1809.4 78.9C1819.6 75.5 1829.3 74.2 1831.5 76.0C1834.9 78.9 1831.8 83.0 1826.1 83.0C1816.4 83.0 1798.4 90.6 1789.4 98.4C1778.3 108.1 1772.3 119.0 1770.0 133.7C1768.5 142.6 1766.1 145.3 1763.0 141.5Z" },
];

/**
 * Logo colours — change these to recolour the wordmark.
 * `sam` covers s-a-m and the apostrophe, `s` is the joining letter (a sideways
 * gradient from `sFrom` to `sTo`), `presso` covers p-r-e-s-s-o, `shine` is the
 * glossy highlight on every letter.
 */
const LOGO_COLORS = {
  sam: "#CDAA88",
  sFrom: "#CDAA88",
  sTo: "#5A4434",
  presso: "#5A4434",
  shine: "#FFFBF5",
};

function Logo({ height = 28, colors = LOGO_COLORS }) {
  const gid = "sp-logo-s-" + React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const s = LOGO_GLYPHS[4];
  const fill = (i) => (i < 4 ? colors.sam : i === 4 ? `url(#${gid})` : colors.presso);
  return (
    <svg
      viewBox={`0 0 ${LOGO_W} ${LOGO_H}`}
      height={height}
      width={(height * LOGO_W) / LOGO_H}
      role="img"
      aria-label="sam'spresso"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={s.x0} x2={s.x1} y1="0" y2="0">
          <stop offset="0" stopColor={colors.sFrom} />
          <stop offset="1" stopColor={colors.sTo} />
        </linearGradient>
      </defs>
      {LOGO_GLYPHS.map((g, i) => (
        <g key={i}>
          <path d={g.body} fill={fill(i)} />
          {g.shine && <path d={g.shine} fill={colors.shine} />}
        </g>
      ))}
    </svg>
  );
}

/* ───────────────────────────── Sheet (slide-up drawer / modal) ───────────────────────────── */

function Sheet({ data, onClose, label, children }) {
  const open = data != null;
  const last = useRef(data);
  if (data != null) last.current = data;
  const [render, setRender] = useState(open);

  useEffect(() => {
    if (open) {
      setRender(true);
      return;
    }
    const t = setTimeout(() => setRender(false), 320);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!render || last.current == null) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6" role="dialog" aria-modal="true" aria-label={label}>
      <div className={`absolute inset-0 ${open ? "ov-in" : "ov-out"}`} style={{ background: "rgba(42,38,35,.32)" }} onClick={onClose} />
      <div
        className={`relative w-full md:max-w-xl ${open ? "sheet-in" : "sheet-out"}`}
        style={{ willChange: "transform" }}
      >
        <div
          className="no-scrollbar relative overflow-y-auto overflow-x-hidden rounded-t-3xl bg-white md:rounded-3xl"
          style={{ maxHeight: "90vh", overscrollBehavior: "contain", boxShadow: "0 -10px 40px -20px rgba(42,38,35,.35)", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="sticky top-0 z-10 flex justify-center bg-white pt-2.5 md:hidden">
            <span className="h-1 w-10 rounded-full" style={{ background: C.line }} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="press absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: C.stone }}
          >
            <X size={17} strokeWidth={2} />
          </button>
          {children(last.current)}
        </div>
        {/* filler below the sheet so the spring overshoot never shows a gap */}
        <div className="absolute left-0 right-0 top-full h-16 bg-white md:hidden" />
      </div>
    </div>
  );
}

/* ───────────────────────────── Taste-match engine ───────────────────────────── */

function MatchBar({ score, delay }) {
  const shown = useCountUp(score, delay);
  const high = score >= 90;
  return (
    <div>
      <p className="tabular mb-2 text-xs font-medium" style={{ color: high ? C.sage : C.taupe }}>
        {shown}% match
      </p>
      <div className="h-1 overflow-hidden rounded-full" style={{ background: C.stone }}>
        <div
          className="a-grow h-full w-full rounded-full"
          style={{ transform: `scaleX(${score / 100})`, transformOrigin: "0 50%", background: high ? C.sage : C.ink, animationDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

function TasteMatch({ items, cafes, cafesById, sourceId, setSourceId, saved, toggleSave, onOpenCafe }) {
  const src = items.find((i) => i.id === sourceId) || items[0];
  const srcCafe = cafesById[src.cafeId];
  const recs = useMemo(
    () =>
      items
        .filter((i) => i.id !== src.id && i.cafeId !== src.cafeId)
        .map((i) => ({ item: i, score: matchScore(src, i), why: reasonFor(src, i) }))
        .sort((a, b) => b.score - a.score || b.item.rating - a.item.rating)
        .slice(0, 3),
    [items, src]
  );
  const short = (name) => name.replace(/ (Coffee|Espresso Bar|Espresso|Café)$/, "");

  return (
    <section className="relative" aria-labelledby="tm-title">
      <p className="mb-4 text-sm" style={{ color: C.sage }}>
        your taste match
      </p>
      <h1 id="tm-title" className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <span className="serif text-4xl leading-tight md:text-5xl">If you love the</span>
        {/* Native select for speed; styled as a pill. The visible label never wraps. */}
        <span className="focus-within-ring relative inline-flex max-w-full items-center gap-2 rounded-full bg-white py-2 pl-5 pr-2 soft">
          <span className="truncate whitespace-nowrap text-xl font-light tracking-tight md:text-3xl">
            {src.name} <span style={{ color: C.taupe }}>at {short(srcCafe ? srcCafe.name : "")}</span>
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: C.stone }}>
            <ChevronDown size={17} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <select
            aria-label="Choose a drink you love"
            value={src.id}
            onChange={(e) => setSourceId(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
            style={{ fontSize: 16 }}
          >
            {cafes.map((c) => (
              <optgroup key={c.id} label={c.name}>
                {items
                  .filter((i) => i.cafeId === c.id)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                      {i.pick ? " ✦" : ""}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </span>
      </h1>
      <p className="mt-3 text-sm md:text-base" style={{ color: C.taupe }}>
        you'll probably love these too.
      </p>

      <div key={src.id} className="mt-8 grid gap-4 md:grid-cols-3">
        {recs.map((r, i) => {
          const cafe = cafesById[r.item.cafeId];
          return (
            <div key={r.item.id} className="a-fadeup" style={{ animationDelay: `${i * 90}ms` }}>
              <article className="lift flex h-full flex-col rounded-3xl bg-white p-5 soft">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => onOpenCafe(cafe.id)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-xs font-medium" style={{ color: C.taupe }}>
                      {cafe.name}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-lg font-medium tracking-tight">
                      {r.item.name}
                      {r.item.pick && <PickBadge small />}
                    </p>
                  </button>
                  <BookmarkButton saved={saved.has(r.item.id)} onToggle={() => toggleSave(r.item.id)} />
                </div>
                <div className="mt-4">
                  <MatchBar score={r.score} delay={200 + i * 120} />
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed" style={{ color: C.taupe }}>
                  {r.why}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {r.item.flavours.slice(0, 2).map((f) => (
                    <Tag key={f}>{f.toLowerCase()}</Tag>
                  ))}
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ───────────────────────────── Filters & café cards ───────────────────────────── */

function Filters({ area, setArea, drink, setDrink, compact = false, glass = false }) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <Segmented label="Filter by neighbourhood" options={AREAS} value={area} onChange={setArea} size={compact ? "sm" : "md"} scroll glass={glass} />
      <Segmented label="Filter by drink style" options={DRINKS} value={drink} onChange={setDrink} size={compact ? "sm" : "md"} scroll glass={glass} />
    </div>
  );
}

function CafeCard({ cafe, drink, saved, toggleSave, onOpen, onHover, index }) {
  const shown = useMemo(() => {
    const list = [...cafe.items];
    if (drink !== "All Drinks") list.sort((a, b) => b.styles.includes(drink) - a.styles.includes(drink));
    return list.slice(0, 2);
  }, [cafe.items, drink]);
  return (
    <div className="a-fadeup" style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
      <article
        className="lift flex h-full flex-col rounded-3xl bg-white p-5 soft md:p-6"
        onMouseEnter={() => onHover && onHover(cafe.id)}
        onMouseLeave={() => onHover && onHover(null)}
      >
        <button type="button" onClick={() => onOpen(cafe.id)} className="w-full text-left" aria-label={`Open ${cafe.name}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 truncate text-lg font-medium tracking-tight">
                {cafe.name}
                {cafe.pick && <span aria-label="Samia's Pick" style={{ color: C.clay }}>✦</span>}
              </h3>
              <p className="truncate text-sm" style={{ color: C.taupe }}>
                {cafe.areas[0].toLowerCase()} · {cafe.tube}
              </p>
            </div>
            <p className="tabular shrink-0 text-2xl font-light leading-none tracking-tight">{f1(cafe.avg)}</p>
          </div>
        </button>
        <ul className="mt-5 space-y-1">
          {shown.map((it) => {
            const dim = drink !== "All Drinks" && !it.styles.includes(drink);
            return (
              <li key={it.id} className="tr flex items-center gap-2 rounded-2xl pl-3" style={{ background: C.bg, opacity: dim ? 0.45 : 1 }}>
                <button type="button" onClick={() => onOpen(cafe.id)} className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left text-sm">
                  <span className="truncate">{it.name}</span>
                  {it.pick && <span aria-label="Samia's Pick" style={{ color: C.clay }}>✦</span>}
                </button>
                <span className="tabular text-sm" style={{ color: C.taupe }}>{f1(it.rating)}</span>
                <BookmarkButton saved={saved.has(it.id)} onToggle={() => toggleSave(it.id)} />
              </li>
            );
          })}
        </ul>
      </article>
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="a-fadeup rounded-3xl p-10 text-center hair" style={{ background: "#fff" }}>
      <Coffee size={28} className="mx-auto" color={C.taupe} aria-hidden="true" />
      <p className="mt-3 font-medium">No cafés match that combo yet</p>
      <p className="mt-1 text-sm" style={{ color: C.taupe }}>
        Try another neighbourhood or drink style.
      </p>
      <button type="button" onClick={onReset} className="press mt-4 rounded-full px-4 py-2 text-sm font-medium text-white" style={{ background: C.ink }}>
        Reset filters
      </button>
    </div>
  );
}

/* ───────────────────────────── London map ───────────────────────────── */

const W = 1000;
const H = 780; // extends south to cover Victoria & South Ken

const TUBE_STATIONS = [
  ["Oxford Circus", 388, 350],
  ["Tottenham Ct Rd", 472, 332],
  ["Goodge St", 442, 254],
  ["Holborn", 560, 308],
  ["Chancery Lane", 628, 297],
  ["St Paul's", 739, 357],
  ["Bank", 811, 380],
  ["Liverpool St", 862, 301],
  ["Shoreditch High St", 918, 205],
  ["London Bridge", 828, 521],
  ["Borough", 771, 593],
  ["Leicester Sq", 496, 415],
  ["Bond St", 328, 367],
  ["Green Park", 378, 528],
  ["Mansion House", 768, 399],
  ["Piccadilly Circus", 448, 437],
  ["Warren St", 412, 180],
  ["Old St", 820, 166],
  ["Baker St", 263, 215],
  ["Victoria", 362, 674],
  ["South Kensington", 130, 716],
];

const TUBE_LINES = [
  { c: "#D99A86", d: "M-60 410 L256 385 L328 367 L388 350 L472 332 L560 308 L628 297 L739 357 L811 380 L862 301 L1060 250" },
  { c: "#9C9893", d: "M400 -60 L412 180 L442 254 L472 332 L496 415 L522 472 L540 500 L560 780" },
  { c: "#9C9893", d: "M800 -60 L820 166 L811 287 L811 380 L828 521 L771 593 L760 780" },
  { c: "#8FB4CC", d: "M420 -60 L412 180 L388 350 L378 528 L362 780" },
  { c: "#98A3CF", d: "M-60 600 L304 566 L378 528 L448 437 L496 415 L526 385 L560 308 L526 210 L528 74 L540 -60" },
  { c: "#A7C2A5", d: "M-60 690 L362 674 L448 621 L544 598 L540 500 L608 430 L688 452 L768 399 L830 422 L907 439 L1060 420" },
];

const ROADS = [
  "M-60 205 L216 201 L536 201 L672 70 L760 -60",
  "M672 70 L820 166 L918 205 L1060 230",
  "M-60 405 L120 402 L256 385 L388 350 L472 332 L560 308 L628 297 L739 357 L811 380 L914 361 L1060 340",
  "M256 385 L304 566 L448 437 L400 380 L388 350",
  "M522 472 L580 430 L650 412 L700 400 L739 357",
  "M560 308 L580 430",
  "M472 332 L412 180",
  "M811 380 L862 301 L918 205 L932 -60",
  "M816 472 L790 560 L770 780",
  "M917 516 L900 780",
  "M584 472 L600 560 L620 780",
  "M304 566 L362 674",
];

const HOODS = [
  ["SOHO", 448, 392],
  ["FITZROVIA", 410, 236],
  ["BLOOMSBURY", 536, 248],
  ["SHOREDITCH", 930, 140],
  ["CITY", 700, 330],
  ["BOROUGH", 740, 625],
  ["BERMONDSEY", 930, 660],
  ["MAYFAIR", 320, 450],
  ["MARYLEBONE", 232, 330],
  ["VICTORIA", 440, 712],
  ["SOUTH KEN", 170, 680],
  ["CLERKENWELL", 700, 190],
  ["SOUTH BANK", 620, 545],
];

const MapBase = memo(function MapBase() {
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute left-0 top-0" style={{ overflow: "visible" }} aria-hidden="true">
      <rect x={-800} y={-800} width={W + 1600} height={H + 1600} fill={C.land} />
      {/* parks */}
      <g fill={C.park} stroke="#DCE4DE" strokeWidth="1">
        <path d="M-120 400 Q-110 380 0 388 L120 392 L290 380 Q306 382 305 402 L300 560 Q296 582 270 580 L40 590 Q-100 596 -120 570 Z" />
        <ellipse cx="290" cy="80" rx="86" ry="112" />
        <path d="M352 492 L424 480 L432 538 L502 548 L500 594 L420 598 L350 576 Z" />
        <rect x="498" y="222" width="30" height="26" rx="6" />
        <rect x="572" y="320" width="28" height="24" rx="6" />
      </g>
      <g fill={C.sage} opacity=".55" fontSize="13" fontStyle="italic" fontWeight="500" textAnchor="middle">
        <text x="165" y="488">Hyde Park</text>
        <text x="290" y="96">Regent's Park</text>
        <text x="420" y="572" fontSize="10">Green Park</text>
      </g>
      {/* roads */}
      <g fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round">
        {ROADS.map((d, i) => (
          <path key={i} d={d} strokeWidth="6" opacity=".85" />
        ))}
      </g>
      {/* river */}
      <path
        id="sp-thames"
        d="M440 820 C500 720 548 640 548 580 C548 520 562 490 600 470 C640 452 700 448 760 460 C810 468 840 480 880 500 C920 518 960 512 1100 490"
        fill="none"
        stroke={C.river}
        strokeWidth="30"
        strokeLinecap="round"
      />
      <text fontSize="11" letterSpacing="3" fill="#8FA2A8" fontWeight="500">
        <textPath href="#sp-thames" startOffset="48%">
          RIVER THAMES
        </textPath>
      </text>
      {/* tube lines */}
      <g fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".42">
        {TUBE_LINES.map((l, i) => (
          <path key={i} d={l.d} stroke={l.c} />
        ))}
      </g>
      <g>
        {TUBE_STATIONS.map(([n, x, y]) => (
          <g key={n}>
            <circle cx={x} cy={y} r="4" fill="#fff" stroke="#B9B3AA" strokeWidth="1.5" />
            <text x={x + 7} y={y + 3.5} fontSize="9" fill="#A39D94">
              {n}
            </text>
          </g>
        ))}
      </g>
      {/* neighbourhoods */}
      <g fill={C.taupe} opacity=".5" fontSize="12" fontWeight="600" letterSpacing="3.5" textAnchor="middle">
        {HOODS.map(([n, x, y]) => (
          <text key={n} x={x} y={y}>
            {n}
          </text>
        ))}
      </g>
    </svg>
  );
});

function LondonMap({ cafes, visibleIds, selectedId, onSelect, hoveredId, onOpen, overlay, focusTopRatio = 0.42, rounded = true }) {
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState(null);
  const [anim, setAnim] = useState(false);
  const viewRef = useRef(null);
  viewRef.current = view;
  const ptrs = useRef(new Map());
  const gesture = useRef(null);
  const moved = useRef(false);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const upd = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    upd();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const coverK = size.w ? Math.max(size.w / W, size.h / H) : 1;
  const containK = size.w ? Math.min(size.w / W, size.h / H) : 1;
  const minK = containK * 0.95;
  const maxK = coverK * 3.6;

  const clampView = useCallback(
    (v) => {
      const k = clamp(v.k, minK, maxK);
      const m = 140 * k;
      const fit = (lo, hi, val) => (lo > hi ? (lo + hi) / 2 : clamp(val, lo, hi));
      return { k, x: fit(size.w - W * k - m, m, v.x), y: fit(size.h - H * k - m, m, v.y) };
    },
    [size.w, size.h, minK, maxK]
  );

  const homeView = useCallback(() => {
    const k = Math.min(size.w / 640, size.h / 600);
    return clampView({ k, x: size.w / 2 - 560 * k, y: size.h * 0.56 - 430 * k });
  }, [size.w, size.h, clampView]);

  useEffect(() => {
    if (!size.w) return;
    setView((v) => (v ? clampView(v) : homeView()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h]);

  // focus the selected café
  useEffect(() => {
    if (!selectedId || !size.w || !viewRef.current) return;
    const c = cafes.find((x) => x.id === selectedId);
    if (!c || c.x == null) return;
    const home = homeView();
    const k = clamp(Math.max(viewRef.current.k, home.k * 1.45), minK, maxK);
    setAnim(true);
    setView(clampView({ k, x: size.w / 2 - c.x * k, y: size.h * focusTopRatio - c.y * k }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, size.w, size.h]);

  const zoomAt = useCallback(
    (px, py, f, animate = true) => {
      const v = viewRef.current;
      if (!v) return;
      const k = clamp(v.k * f, minK, maxK);
      const mx = (px - v.x) / v.k;
      const my = (py - v.y) / v.k;
      setAnim(animate);
      setView(clampView({ k, x: px - mx * k, y: py - my * k }));
    },
    [clampView, minK, maxK]
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0018), false);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const baseline = () => {
    const pts = [...ptrs.current.values()];
    const g = { view: viewRef.current, pts };
    if (pts.length >= 2) {
      g.cx = (pts[0].x + pts[1].x) / 2;
      g.cy = (pts[0].y + pts[1].y) / 2;
      g.dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
    }
    gesture.current = g;
  };

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    if (ptrs.current.size === 0) moved.current = false;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    baseline();
  };
  const onPointerMove = (e) => {
    if (!ptrs.current.has(e.pointerId) || !gesture.current || !gesture.current.view) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const pts = [...ptrs.current.values()];
    const r = wrapRef.current.getBoundingClientRect();
    if (pts.length === 1 && g.pts.length === 1) {
      const dx = pts[0].x - g.pts[0].x;
      const dy = pts[0].y - g.pts[0].y;
      if (!moved.current && Math.abs(dx) + Math.abs(dy) < 5) return;
      moved.current = true;
      setAnim(false);
      setView(clampView({ k: g.view.k, x: g.view.x + dx, y: g.view.y + dy }));
    } else if (pts.length >= 2 && g.dist) {
      moved.current = true;
      setAnim(false);
      const cx = (pts[0].x + pts[1].x) / 2;
      const cy = (pts[0].y + pts[1].y) / 2;
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const k = clamp(g.view.k * (d / g.dist), minK, maxK);
      const mx = (g.cx - r.left - g.view.x) / g.view.k;
      const my = (g.cy - r.top - g.view.y) / g.view.k;
      setView(clampView({ k, x: cx - r.left - mx * k, y: cy - r.top - my * k }));
    }
  };
  const onPointerUp = (e) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size === 0) {
      if (!moved.current && e.type === "pointerup") onSelect(null);
      gesture.current = null;
    } else baseline();
  };

  const center = () => ({ x: size.w / 2, y: size.h / 2 });
  const sel = cafes.find((c) => c.id === selectedId);
  const k = view ? view.k : 1;
  const home = size.w ? homeView() : null;
  const showNames = home && k >= home.k * 1.35;

  return (
    <div className={`relative h-full w-full overflow-hidden ${rounded ? "rounded-3xl hair" : ""}`} style={{ background: C.land }}>
      <div
        ref={wrapRef}
        className="absolute inset-0 select-none"
        style={{ touchAction: "none", cursor: ptrs.current.size ? "grabbing" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="Interactive map of Central London cafés. Drag to pan, scroll or pinch to zoom."
        role="application"
      >
        {view && (
          <div
            className="absolute left-0 top-0"
            style={{
              width: W,
              height: H,
              transformOrigin: "0 0",
              transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.k})`,
              transition: anim ? `transform .7s ${EASE}` : "none",
              willChange: "transform",
            }}
          >
            <MapBase />
            {cafes.map((c) => {
              if (c.x == null) return null;
              const vis = visibleIds.has(c.id);
              const isSel = selectedId === c.id;
              const isHov = hoveredId === c.id;
              const s = isSel ? 1.22 : isHov ? 1.14 : 1;
              return (
                <div
                  key={c.id}
                  className="absolute"
                  style={{
                    left: c.x,
                    top: c.y,
                    zIndex: isSel ? 30 : isHov ? 25 : c.pick ? 12 : 10,
                    transform: `scale(${1 / k})`,
                    transformOrigin: "0 0",
                    transition: anim ? `transform .7s ${EASE}` : "none",
                    pointerEvents: vis ? "auto" : "none",
                  }}
                >
                  <button
                    type="button"
                    tabIndex={vis ? 0 : -1}
                    aria-label={`${c.name}, ${f1(c.avg)} stars, near ${c.tube}`}
                    aria-pressed={isSel}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => onSelect(isSel ? null : c.id)}
                    className="absolute left-0 top-0 flex flex-col items-center"
                    style={{
                      transform: `translate(-50%, -100%) scale(${vis ? s : 0.4})`,
                      transformOrigin: "50% 100%",
                      opacity: vis ? 1 : 0,
                      transition: `transform .55s ${SPRING}, opacity .35s ${EASE}`,
                    }}
                  >
                    <span className="relative flex flex-col items-center">
                      {c.pick && vis && !isSel && (
                        <span aria-hidden="true" className="a-pulse absolute inset-x-0 top-0 h-8 rounded-full" style={{ boxShadow: `0 0 0 2px ${C.clay}` }} />
                      )}
                      <span
                        className="tabular relative flex h-8 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-sm font-medium"
                        style={{
                          background: isSel ? C.ink : "#fff",
                          color: isSel ? "#fff" : C.ink,
                          boxShadow: `0 0 0 ${c.pick ? 2 : 1}px ${c.pick ? C.clay : isSel || isHov ? C.ink : C.line}, 0 6px 16px -6px rgba(42,38,35,.35)`,
                          transition: `background-color .35s ${EASE}, color .35s ${EASE}, box-shadow .35s ${EASE}`,
                        }}
                      >
                        {f1(c.avg)}
                        <Star size={11} strokeWidth={0} fill={isSel ? "#fff" : C.ink} aria-hidden="true" />
                      </span>
                      <span
                        aria-hidden="true"
                        className="-mt-1 h-2.5 w-2.5 rotate-45"
                        style={{ background: isSel ? C.ink : "#fff", boxShadow: c.pick ? `1.5px 1.5px 0 0.5px ${C.clay}` : `1px 1px 0 0 ${C.line}` }}
                      />
                      <span
                        className="pointer-events-none absolute top-full mt-1 whitespace-nowrap rounded-md px-1.5 text-xs font-medium"
                        style={{
                          color: C.ink,
                          background: "rgba(250,249,246,.85)",
                          opacity: showNames || isSel || isHov ? 1 : 0,
                          transform: showNames || isSel || isHov ? "none" : "translate3d(0,-4px,0)",
                          transition: `opacity .35s ${EASE}, transform .35s ${EASE}`,
                        }}
                      >
                        {c.name}
                      </span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {overlay && <div className="absolute inset-x-0 top-0 z-20 p-3">{overlay}</div>}

      <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col overflow-hidden rounded-2xl glass-white hair" style={{ boxShadow: "0 8px 24px -14px rgba(42,38,35,.35)" }}>
        <button type="button" aria-label="Zoom in" className="press flex h-10 w-10 items-center justify-center" onClick={() => zoomAt(center().x, center().y, 1.45)}>
          <Plus size={17} />
        </button>
        <span className="h-px" style={{ background: C.line }} />
        <button type="button" aria-label="Zoom out" className="press flex h-10 w-10 items-center justify-center" onClick={() => zoomAt(center().x, center().y, 1 / 1.45)}>
          <Minus size={17} />
        </button>
        <span className="h-px" style={{ background: C.line }} />
        <button
          type="button"
          aria-label="Reset map"
          className="press flex h-10 w-10 items-center justify-center"
          onClick={() => {
            setAnim(true);
            setView(homeView());
            onSelect(null);
          }}
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {!sel && (
        <p className="pointer-events-none absolute bottom-3 left-4 z-10 text-xs" style={{ color: C.taupe, opacity: 0.7 }}>
          Stylised map · not to scale
        </p>
      )}

      {sel && (
        <div key={sel.id} className="a-cardup absolute inset-x-3 bottom-3 z-30 md:left-4 md:right-auto md:w-96">
          <MapPreview cafe={sel} onOpen={onOpen} onClose={() => onSelect(null)} />
        </div>
      )}
    </div>
  );
}

function MapPreview({ cafe, onOpen, onClose }) {
  const top = cafe.items[0];
  return (
    <div className="rounded-3xl bg-white p-4 hair" style={{ boxShadow: "0 20px 50px -24px rgba(42,38,35,.45)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-base font-medium tracking-tight">
            {cafe.name} {cafe.pick && <PickBadge small />}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: C.taupe }}>
            <span className="flex items-center gap-1">
              <TrainFront size={13} aria-hidden="true" /> {cafe.tube}
            </span>
            {cafe.walk != null && (
              <span className="flex items-center gap-1">
                <Footprints size={13} aria-hidden="true" /> {cafe.walk} min walk
              </span>
            )}
            <span>{cafe.price}</span>
          </p>
        </div>
        <button type="button" aria-label="Close preview" onClick={onClose} className="press -mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: C.stone }}>
          <X size={15} />
        </button>
      </div>
      {top && (
        <div className="mt-3 flex items-center justify-between rounded-2xl px-3 py-2.5" style={{ background: C.bg }}>
          <div className="min-w-0">
            <p className="text-xs" style={{ color: C.taupe }}>
              Top-rated here
            </p>
            <p className="truncate text-sm font-medium">{top.name}</p>
          </div>
          <ScoreChip value={top.rating} />
        </div>
      )}
      <button type="button" onClick={() => onOpen(cafe.id)} className="press mt-3 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium text-white" style={{ background: C.ink }}>
        View Menu &amp; Ratings <ArrowRight size={15} />
      </button>
    </div>
  );
}

function CafeListRow({ cafe, selected, onSelect, onHover, onOpen, index, rowRef }) {
  const top = cafe.items[0];
  return (
    <div ref={rowRef} className="a-fadeup" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <div
        className={`tr flex items-center gap-3 rounded-3xl p-3 ${selected ? "bg-white soft" : ""}`}
        style={{ background: selected ? "#fff" : "transparent" }}
        onMouseEnter={() => onHover(cafe.id)}
        onMouseLeave={() => onHover(null)}
      >
        <button type="button" onClick={() => onSelect(cafe.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Show ${cafe.name} on map`}>
          <span className="tabular flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full text-sm font-light" style={{ background: selected ? C.ink : "#fff", color: selected ? "#fff" : C.ink }}>
            {f1(cafe.avg)}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate font-medium">{cafe.name}</span>
              {cafe.pick && <span aria-label="Samia's Pick" style={{ color: C.clay }}>✦</span>}
            </span>
            <span className="block truncate text-xs" style={{ color: C.taupe }}>
              {cafe.areas[0].toLowerCase()} · {top ? top.name.toLowerCase() : "no ratings yet"}
            </span>
          </span>
        </button>
        <button type="button" onClick={() => onOpen(cafe.id)} aria-label={`Open ${cafe.name} details`} className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ color: C.taupe }}>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────────── Leaderboard ───────────────────────────── */

const ROW_H = 80;

function Leaderboard({ cafes, items, cafesById, onOpenCafe, saved, toggleSave, flash }) {
  const [tab, setTab] = useState("cafes");
  const rankedCafes = useMemo(() => [...cafes].filter((c) => c.items.length).sort((a, b) => b.avg - a.avg || b.total - a.total), [cafes]);
  const rankedItems = useMemo(() => [...items].sort((a, b) => b.rating - a.rating || b.count - a.count), [items]);
  const bestOf = useMemo(() => {
    const m = {};
    const label = { "Flat White": "Flat White", Matcha: "Matcha", "Pour Over": "Pour Over", "Oat Milk": "Oat Drink", Pastries: "Pastry" };
    DRINKS.slice(1).forEach((s) => {
      const top = rankedItems.find((i) => i.styles.includes(s));
      if (top && !m[top.id]) m[top.id] = `#1 ${label[s]} in London`;
    });
    return m;
  }, [rankedItems]);

  const rows = tab === "cafes" ? rankedCafes : rankedItems;

  return (
    <div>
      <SectionTitle
        eyebrow="live from the community"
        title={<span className="serif text-3xl md:text-4xl">the leaderboard</span>}
        right={<span className="a-dot mb-2 h-2 w-2 rounded-full" style={{ background: C.sage }} aria-label="Live" />}
      />
      <div className="mb-4">
        <Segmented
          label="Leaderboard type"
          full
          options={[
            { value: "cafes", label: "Cafés" },
            { value: "drinks", label: "Drinks" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      <div key={tab} className="a-fade relative overflow-hidden rounded-3xl bg-white soft" style={{ height: rows.length * ROW_H }}>
        {rows.map((r, i) => {
          const isCafe = tab === "cafes";
          const score = isCafe ? r.avg : r.rating;
          const cafe = isCafe ? r : cafesById[r.cafeId];
          const flashing = flash && (isCafe ? flash.cafeId === r.id : flash.id === r.id);
          return (
            <div
              key={r.id}
              className="absolute inset-x-0 top-0 flex items-center gap-4 px-5 md:px-6"
              style={{ height: ROW_H, transform: `translate3d(0, ${i * ROW_H}px, 0)`, transition: `transform .8s ${EASE}` }}
            >
              {flashing && <span key={flash.t} aria-hidden="true" className="a-flash pointer-events-none absolute inset-0" style={{ background: "rgba(196,154,116,.14)" }} />}
              <span className="tabular relative w-6 shrink-0 text-center text-2xl font-light" style={{ color: i === 0 ? C.sage : C.taupe }}>
                {i + 1}
              </span>
              <button type="button" onClick={() => onOpenCafe(cafe.id)} className="relative min-w-0 flex-1 text-left">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium">{r.name}</span>
                  {r.pick && <span aria-label="Samia's Pick" style={{ color: C.clay }}>✦</span>}
                </span>
                <span className="mt-0.5 block truncate text-sm" style={{ color: !isCafe && bestOf[r.id] ? C.sage : C.taupe }}>
                  {isCafe ? `${r.areas[0].toLowerCase()} · ${r.total} ratings` : bestOf[r.id] ? `${cafe.name} · ${bestOf[r.id].toLowerCase()}` : cafe.name}
                </span>
              </button>
              <p className="tabular relative shrink-0 text-lg font-light">{f2(score)}</p>
              {!isCafe && <BookmarkButton saved={saved.has(r.id)} onToggle={() => toggleSave(r.id)} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────────── Profile ───────────────────────────── */

function Profile({ history, saved, items, cafesById, toggleSave, onOpenCafe, onRate }) {
  const [tab, setTab] = useState("ratings");
  const savedItems = items.filter((i) => saved.has(i.id));
  const stats = [
    { label: "Ratings", value: history.length },
    { label: "Want to Try", value: savedItems.length },
    { label: "Cafés tried", value: new Set(history.map((h) => h.cafeId)).size },
  ];
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm" style={{ color: C.sage }}>
          your cup log
        </p>
        <h1 className="serif mt-1 text-4xl md:text-5xl">sip, rate, repeat.</h1>
        <dl className="mt-6 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-3xl bg-white px-4 py-4 soft">
              <dd key={String(s.value)} className="a-pop tabular inline-block text-3xl font-light tracking-tight">
                {s.value}
              </dd>
              <dt className="mt-1 text-xs" style={{ color: C.taupe }}>
                {s.label.toLowerCase()}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      <Segmented
        label="Profile section"
        full
        value={tab}
        onChange={setTab}
        options={[
          { value: "ratings", label: `My Ratings (${history.length})` },
          { value: "saved", label: `Want to Try (${savedItems.length})` },
        ]}
      />

      <div key={tab} className="space-y-2">
        {tab === "ratings" &&
          (history.length ? (
            history.map((h, i) => (
              <div key={h.id} className="a-fadeup" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                <button type="button" onClick={() => cafesById[h.cafeId] && onOpenCafe(h.cafeId)} className="lift flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left soft">
                  <span className="tabular flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-light" style={{ background: C.stone }}>
                    {f1(h.rating)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{h.name}</span>
                    <span className="block truncate text-xs" style={{ color: C.taupe }}>
                      {h.cafeName} · {timeAgo(h.ts)}
                    </span>
                    {h.notes.length > 0 && (
                      <span className="mt-2 flex flex-wrap gap-1">
                        {h.notes.map((n) => (
                          <Tag key={n}>{n.toLowerCase()}</Tag>
                        ))}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            ))
          ) : (
            <div className="a-fadeup rounded-3xl bg-white p-8 text-center hair">
              <p className="font-medium">No ratings yet</p>
              <button type="button" onClick={onRate} className="press mt-3 rounded-full px-4 py-2 text-sm font-medium text-white" style={{ background: C.ink }}>
                Rate your first cup
              </button>
            </div>
          ))}
        {tab === "saved" &&
          (savedItems.length ? (
            savedItems.map((it, i) => {
              const cafe = cafesById[it.cafeId];
              return (
                <div key={it.id} className="a-fadeup" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                  <div className="lift flex items-center gap-3 rounded-3xl bg-white p-4 soft">
                    <button type="button" onClick={() => onOpenCafe(cafe.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: C.stone }}>
                        <Coffee size={20} strokeWidth={1.7} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-medium">{it.name}</span>
                          {it.pick && <PickBadge small />}
                        </span>
                        <span className="block truncate text-xs" style={{ color: C.taupe }}>
                          {cafe.name} · {cafe.tube}
                        </span>
                      </span>
                    </button>
                    <ScoreChip value={it.rating} />
                    <BookmarkButton saved onToggle={() => toggleSave(it.id)} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="a-fadeup rounded-3xl bg-white p-8 text-center hair">
              <Bookmark size={24} className="mx-auto" color={C.taupe} aria-hidden="true" />
              <p className="mt-3 font-medium">Your Want to Try list is empty</p>
              <p className="mt-1 text-sm" style={{ color: C.taupe }}>
                Tap the bookmark on any drink to save it here.
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ───────────────────────────── Café detail ───────────────────────────── */

function CafeDetail({ cafe, rank, saved, toggleSave, onRate, onShowMap }) {
  return (
    <div className="px-5 pb-6 pt-3 md:px-8 md:pt-8">
      <p className="flex items-center gap-1.5 pr-12 text-sm" style={{ color: C.taupe }}>
        <MapPin size={13} aria-hidden="true" /> {cafe.hood}
      </p>
      <div className="mt-2 flex items-start justify-between gap-4">
        <h2 className="text-2xl font-medium tracking-tight md:text-3xl">{cafe.name}</h2>
      </div>
      <p className="tabular mt-3 flex items-baseline gap-3">
        <span className="text-4xl font-light tracking-tight">{f2(cafe.avg)}</span>
        <span className="text-sm" style={{ color: C.taupe }}>
          {rank ? `#${rank} in london` : "new"} · {cafe.total} ratings
        </span>
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" style={{ color: C.taupe }}>
        <span className="flex items-center gap-1.5">
          <TrainFront size={15} aria-hidden="true" /> {cafe.tube}
          {cafe.tubeAlt ? ` · ${cafe.tubeAlt}` : ""}
        </span>
        {cafe.walk != null && (
          <span className="flex items-center gap-1.5">
            <Footprints size={15} aria-hidden="true" /> {cafe.walk} min walk
          </span>
        )}
        <span>{cafe.price}</span>
      </div>
      {cafe.blurb && <p className="mt-4 text-sm leading-relaxed">{cafe.blurb}</p>}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {cafe.vibes.map((v) => (
          <Tag key={v}>{v.toLowerCase()}</Tag>
        ))}
      </div>

      <h3 className="mb-2 mt-7 text-sm" style={{ color: C.taupe }}>
        Menu &amp; Ratings
      </h3>
      <ul className="space-y-2">
        {cafe.items.map((it, i) => (
          <li key={it.id} className="a-fadeup flex items-center gap-3 rounded-2xl py-2.5 pl-4 pr-1" style={{ background: C.bg, animationDelay: `${120 + i * 60}ms` }}>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {it.name} {it.pick && <PickBadge small />}
              </p>
              <p className="mt-0.5 truncate text-xs" style={{ color: C.taupe }}>
                {it.flavours.slice(0, 2).join(", ").toLowerCase()}
              </p>
            </div>
            <span className="tabular text-base font-light">{f2(it.rating)}</span>
            <BookmarkButton saved={saved.has(it.id)} onToggle={() => toggleSave(it.id)} />
          </li>
        ))}
        {cafe.items.length === 0 && (
          <li className="rounded-2xl p-4 text-sm hair" style={{ color: C.taupe }}>
            No items rated yet.
          </li>
        )}
      </ul>
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={() => onRate(cafe.id)} className="press flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-medium text-white" style={{ background: C.ink }}>
          <Plus size={16} /> Rate an item here
        </button>
        {cafe.x != null && (
          <button type="button" onClick={() => onShowMap(cafe.id)} className="press flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium" style={{ background: C.stone }}>
            <MapIcon size={16} /> Map
          </button>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────── Rate flow ───────────────────────────── */

function ratingWord(r) {
  if (r < 2) return "Not for me";
  if (r < 3) return "It was fine";
  if (r < 3.8) return "Good cup";
  if (r < 4.4) return "Really good";
  if (r < 4.8) return "Excellent";
  return "Exceptional";
}

function RateForm({ cafes, items, initialCafeId, onSubmit }) {
  const [cafeId, setCafeId] = useState(initialCafeId || cafes[0].id);
  const [newCafe, setNewCafe] = useState({ name: "", area: "Soho" });
  const [itemName, setItemName] = useState("");
  const [rating, setRating] = useState(4.5);
  const [notes, setNotes] = useState([]);
  const cafeItems = cafeId === "new" ? [] : items.filter((i) => i.cafeId === cafeId);
  const valid = itemName.trim().length > 1 && (cafeId !== "new" || newCafe.name.trim().length > 1);
  const pct = ((rating - 1) / 4) * 100;
  const toggleNote = (n) => setNotes((ns) => (ns.includes(n) ? ns.filter((x) => x !== n) : [...ns, n]));
  // 16px text: smaller inputs make iOS Safari auto-zoom the page on focus
  const inputCls = "w-full rounded-2xl px-4 py-3 text-base outline-none tr";
  const inputStyle = { background: C.bg, boxShadow: `inset 0 0 0 1px ${C.line}` };

  return (
    <form
      className="px-5 pb-6 pt-3 md:px-8 md:pt-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit({ cafeId, newCafe, itemName, rating: Math.round(rating * 10) / 10, notes });
      }}
    >
      <p className="text-sm" style={{ color: C.taupe }}>
        New rating
      </p>
      <h2 className="mt-1 pr-12 text-2xl font-medium tracking-tight">What did you sip?</h2>

      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-medium">Café</legend>
        <Segmented
          label="Choose a café"
          variant="ink"
          size="sm"
          scroll
          value={cafeId}
          onChange={(v) => {
            setCafeId(v);
            setItemName("");
          }}
          options={[...cafes.map((c) => ({ value: c.id, label: c.name })), { value: "new", label: "Add new café", icon: Plus }]}
        />
        {cafeId === "new" && (
          <div className="a-fadeup mt-3 grid gap-2 sm:grid-cols-2">
            <input
              className={inputCls}
              style={inputStyle}
              placeholder="Café name"
              aria-label="New café name"
              value={newCafe.name}
              onChange={(e) => setNewCafe((n) => ({ ...n, name: e.target.value }))}
            />
            <div className="relative">
              <select
                aria-label="Neighbourhood"
                className={`${inputCls} appearance-none pr-10`}
                style={inputStyle}
                value={newCafe.area}
                onChange={(e) => setNewCafe((n) => ({ ...n, area: e.target.value }))}
              >
                {AREAS.slice(1).map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-medium">Menu item</legend>
        {cafeItems.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {cafeItems.map((it) => {
              const on = itemName.toLowerCase() === it.name.toLowerCase();
              return (
                <button
                  key={it.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setItemName(on ? "" : it.name)}
                  className="press flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium"
                  style={{ background: on ? C.ink : C.stone, color: on ? "#fff" : C.ink }}
                >
                  {on && <Check size={14} aria-hidden="true" />}
                  {it.name}
                </button>
              );
            })}
          </div>
        )}
        <input className={inputCls} style={inputStyle} placeholder="…or type an item, e.g. Oat Flat White" aria-label="Menu item name" value={itemName} onChange={(e) => setItemName(e.target.value)} />
      </fieldset>

      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-medium">Your rating</legend>
        <div className="rounded-3xl p-4" style={{ background: C.bg }}>
          <div className="flex items-end justify-between">
            <div>
              <span key={f1(rating)} className="a-pop tabular inline-block text-5xl font-medium leading-none tracking-tight">
                {f1(rating)}
              </span>
              <span className="ml-1 text-sm" style={{ color: C.taupe }}>
                / 5.0
              </span>
            </div>
            <span className="text-sm font-medium" style={{ color: C.taupe }}>
              {ratingWord(rating)}
            </span>
          </div>
          <div className="mt-4 flex gap-1.5" role="group" aria-label="Tap a star">
            {[1, 2, 3, 4, 5].map((n) => {
              const fill = clamp(rating - (n - 1), 0, 1);
              return (
                <button key={n} type="button" aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="press relative h-9 w-9">
                  <Star size={32} strokeWidth={1.4} color={C.line} fill={C.stone} className="absolute inset-0 m-auto" />
                  <span className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - fill * 100}% 0 0)`, transition: `clip-path .4s ${EASE}` }}>
                    <Star size={32} strokeWidth={1.4} color={C.ink} fill={C.ink} className="absolute inset-0 m-auto" />
                  </span>
                </button>
              );
            })}
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="0.1"
            value={rating}
            aria-label="Rating from 1.0 to 5.0"
            onChange={(e) => setRating(parseFloat(e.target.value))}
            className="sp-range mt-5 w-full"
            style={{ background: `linear-gradient(to right, ${C.ink} ${pct}%, ${C.line} ${pct}%)` }}
          />
          <div className="mt-2 flex justify-between text-xs" style={{ color: C.taupe }}>
            <span>1.0</span>
            <span>3.0</span>
            <span>5.0</span>
          </div>
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-medium">Tasting notes</legend>
        <div className="flex flex-wrap gap-1.5">
          {NOTE_CHIPS.map((n) => {
            const on = notes.includes(n);
            return (
              <button
                key={n}
                type="button"
                aria-pressed={on}
                onClick={() => toggleNote(n)}
                className="press flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium"
                style={{ background: on ? C.ink : "#fff", color: on ? "#fff" : C.ink, boxShadow: on ? "none" : `inset 0 0 0 1px ${C.line}` }}
              >
                {on && <Check size={14} aria-hidden="true" />}
                {n}
              </button>
            );
          })}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={!valid}
        className="press mt-7 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium text-white"
        style={{ background: C.ink, opacity: valid ? 1 : 0.35, cursor: valid ? "pointer" : "not-allowed" }}
      >
        Submit rating <ArrowRight size={16} />
      </button>
    </form>
  );
}

/* ───────────────────────────── Navigation ───────────────────────────── */

const TABS = [
  { value: "discover", label: "Discover", icon: Compass },
  { value: "map", label: "Map", icon: MapIcon },
  { value: "leaderboard", label: "Leaderboard", icon: Trophy },
  { value: "profile", label: "Profile", icon: User },
];

function TopNav({ tab, setTab, onRate, savedCount }) {
  return (
    <header className="glass sticky top-0 z-40 hidden border-b md:block" style={{ borderColor: C.line }}>
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-6">
        <button type="button" onClick={() => setTab("discover")} aria-label="sam'spresso home">
          <Logo height={32} />
        </button>
        <nav aria-label="Primary">
          <Segmented label="Sections" options={TABS} value={tab} onChange={setTab} />
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setTab("profile")} className="press relative flex h-10 w-10 items-center justify-center rounded-full" style={{ background: C.stone }} aria-label={`Want to Try list, ${savedCount} saved`}>
            <Bookmark size={17} />
            {savedCount > 0 && (
              <span key={savedCount} className="a-pop tabular absolute -right-0.5 -top-0.5 flex h-5 items-center justify-center rounded-full px-1 text-xs font-medium text-white" style={{ background: C.ink, minWidth: 20 }}>
                {savedCount}
              </span>
            )}
          </button>
          <button type="button" onClick={() => onRate()} className="press flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-white" style={{ background: C.ink }}>
            <Plus size={16} /> Rate
          </button>
        </div>
      </div>
    </header>
  );
}

function BottomNav({ tab, setTab, onRate }) {
  const slots = [TABS[0], TABS[1], null, TABS[2], TABS[3]];
  const idx = slots.findIndex((s) => s && s.value === tab);
  return (
    <nav aria-label="Primary" className="glass fixed inset-x-0 bottom-0 z-40 border-t md:hidden" style={{ borderColor: C.line, paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="relative grid h-16 grid-cols-5">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1.5 left-0 flex w-1/5 justify-center"
          style={{ transform: `translate3d(${idx * 100}%,0,0)`, opacity: idx < 0 ? 0 : 1, transition: `transform .55s ${EASE}, opacity .3s` }}
        >
          <span className="h-1 w-1 rounded-full" style={{ background: C.ink }} />
        </span>
        {slots.map((s, i) =>
          s ? (
            <button key={s.value} type="button" onClick={() => setTab(s.value)} aria-current={tab === s.value ? "page" : undefined} className="press relative flex flex-col items-center justify-center gap-1 pb-1 text-xs" style={{ color: tab === s.value ? C.ink : C.taupe }}>
              <s.icon size={20} strokeWidth={tab === s.value ? 2 : 1.5} aria-hidden="true" />
              {s.label === "Leaderboard" ? "Ranks" : s.label}
            </button>
          ) : (
            <div key="rate" className="flex items-center justify-center">
              <button type="button" onClick={() => onRate()} aria-label="Rate an item" className="press -mt-6 flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: C.ink, boxShadow: `0 10px 24px -10px rgba(42,38,35,.6), 0 0 0 4px ${C.bg}` }}>
                <Plus size={24} strokeWidth={2.2} />
              </button>
            </div>
          )
        )}
      </div>
    </nav>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-auto md:top-20" role="status" aria-live="polite">
      <div key={toast.t} className="a-toast flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-white" style={{ background: C.ink, boxShadow: "0 18px 40px -16px rgba(42,38,35,.55)" }}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,.12)" }}>
          <Sparkles size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{toast.title}</p>
          <p className="truncate text-xs" style={{ color: "rgba(255,255,255,.7)" }}>
            {toast.sub}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── App ───────────────────────────── */

export default function Samspresso() {
  const [tab, setTabRaw] = useState("discover");
  const [cafes, setCafes] = useState(SEED_CAFES);
  const [items, setItems] = useState(SEED_ITEMS);
  const [history, setHistory] = useState(SEED_HISTORY);
  const [saved, setSaved] = useState(() => new Set(["or-v60"]));
  const [area, setArea] = useState("All London");
  const [drink, setDrink] = useState("All Drinks");
  const [sourceId, setSourceId] = useState("mon-fw");
  const [discoverMode, setDiscoverMode] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [rate, setRate] = useState(null); // { cafeId, key }
  const [toast, setToast] = useState(null);
  const [flash, setFlash] = useState(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const rowRefs = useRef({});

  const setTab = useCallback((t) => {
    setTabRaw(t);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const cafesFull = useMemo(
    () =>
      cafes.map((c) => {
        const its = items.filter((i) => i.cafeId === c.id).sort((a, b) => b.rating - a.rating || b.count - a.count);
        return { ...c, items: its, avg: avg(its.map((i) => i.rating)), total: its.reduce((s, i) => s + i.count, 0), pick: its.some((i) => i.pick) };
      }),
    [cafes, items]
  );
  const cafesById = useMemo(() => Object.fromEntries(cafesFull.map((c) => [c.id, c])), [cafesFull]);
  const ranks = useMemo(() => {
    const r = {};
    [...cafesFull].filter((c) => c.items.length).sort((a, b) => b.avg - a.avg || b.total - a.total).forEach((c, i) => (r[c.id] = i + 1));
    return r;
  }, [cafesFull]);

  const filtered = useMemo(
    () =>
      cafesFull
        .filter((c) => (area === "All London" || c.areas.includes(area)) && (drink === "All Drinks" || c.items.some((i) => i.styles.includes(drink))))
        .sort((a, b) => b.avg - a.avg),
    [cafesFull, area, drink]
  );
  const visibleIds = useMemo(() => new Set(filtered.map((c) => c.id)), [filtered]);

  useEffect(() => {
    if (selectedId && !visibleIds.has(selectedId)) setSelectedId(null);
  }, [visibleIds, selectedId]);

  useEffect(() => {
    if (selectedId && rowRefs.current[selectedId]) rowRefs.current[selectedId].scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleSave = useCallback((id) => {
    setSaved((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const openCafe = useCallback((id) => setDetailId(id), []);
  const closeDetail = useCallback(() => setDetailId(null), []);
  const openRate = useCallback((cafeId) => {
    setDetailId(null);
    setRate({ cafeId: cafeId || null, key: Date.now() });
  }, []);
  const closeRate = useCallback(() => setRate(null), []);
  const resetFilters = () => {
    setArea("All London");
    setDrink("All Drinks");
  };

  const submitRating = ({ cafeId, newCafe, itemName, rating, notes }) => {
    let cid = cafeId;
    let nextCafes = cafes;
    let cafeName;
    if (cid === "new") {
      cid = `u-${Date.now()}`;
      const [ax, ay] = AREA_POS[newCafe.area] || [600, 380];
      const cafe = {
        id: cid,
        name: titleCase(newCafe.name),
        hood: `${newCafe.area} · Community find`,
        areas: [newCafe.area],
        tube: "Nearby",
        walk: null,
        price: "££",
        vibes: ["Community Find"],
        blurb: "Added by you. Rate more items to help this spot climb the leaderboard.",
        x: ax + (Math.random() * 40 - 20),
        y: ay + (Math.random() * 30 - 15),
      };
      nextCafes = [...cafes, cafe];
      cafeName = cafe.name;
    } else cafeName = cafes.find((c) => c.id === cid).name;

    const name = titleCase(itemName);
    const existing = items.find((i) => i.cafeId === cid && i.name.toLowerCase() === name.toLowerCase());
    let itemId;
    let newScore;
    let nextItems;
    if (existing) {
      itemId = existing.id;
      newScore = (existing.rating * existing.count + rating) / (existing.count + 1);
      nextItems = items.map((i) => (i.id === itemId ? { ...i, rating: newScore, count: i.count + 1 } : i));
    } else {
      itemId = `ui-${Date.now()}`;
      newScore = rating;
      nextItems = [
        ...items,
        { id: itemId, cafeId: cid, name, rating, count: 1, styles: inferStyles(name), flavours: notes.length ? notes.slice(0, 3) : ["Community Find"], p: inferProfile(name) },
      ];
    }

    // new café rank for the toast
    const rankList = nextCafes
      .map((c) => {
        const its = nextItems.filter((i) => i.cafeId === c.id);
        return { id: c.id, a: avg(its.map((i) => i.rating)), t: its.reduce((s, i) => s + i.count, 0), n: its.length };
      })
      .filter((c) => c.n)
      .sort((a, b) => b.a - a.a || b.t - a.t);
    const newRank = rankList.findIndex((c) => c.id === cid) + 1;

    setCafes(nextCafes);
    setItems(nextItems);
    setHistory((h) => [{ id: `h-${Date.now()}`, itemId, cafeId: cid, name, cafeName, rating, notes, ts: Date.now() }, ...h]);
    setRate(null);
    setFlash({ id: itemId, cafeId: cid, t: Date.now() });
    setToast({ t: Date.now(), title: `Rated ${name} ${f1(rating)} ★`, sub: `${cafeName} now ${f2(newScore)} · #${newRank} café in London` });
  };

  const showOnMap = (id) => {
    setDetailId(null);
    resetFilters();
    setTab("map");
    setTimeout(() => setSelectedId(id), 350);
  };

  const mapOverlay = (
    <Filters area={area} setArea={setArea} drink={drink} setDrink={setDrink} compact glass />
  );

  const discover = (
    <div className="space-y-8">
      <TasteMatch items={items} cafes={cafesFull} cafesById={cafesById} sourceId={sourceId} setSourceId={setSourceId} saved={saved} toggleSave={toggleSave} onOpenCafe={openCafe} />
      <section aria-labelledby="explore-title">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-sm" style={{ color: C.taupe }}>
              explore
            </p>
            <h2 id="explore-title" className="text-xl font-medium tracking-tight md:text-2xl">
              <span className="serif text-3xl md:text-4xl">{area === "All London" ? "your london coffee edit" : `the ${area.toLowerCase()} edit`}</span>
            </h2>
            <p className="tabular mt-1 text-sm" style={{ color: C.taupe }}>
              {filtered.length} café{filtered.length === 1 ? "" : "s"}
              {drink !== "All Drinks" ? ` serving ${drink.toLowerCase()}` : ""}
            </p>
          </div>
          <Segmented
            label="View mode"
            size="sm"
            value={discoverMode}
            onChange={setDiscoverMode}
            options={[
              { value: "list", label: "List", icon: List },
              { value: "map", label: "Map", icon: MapIcon },
            ]}
          />
        </div>
        {discoverMode === "list" ? (
          <>
            <Filters area={area} setArea={setArea} drink={drink} setDrink={setDrink} />
            <div key={`${area}|${drink}`} className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c, i) => (
                <CafeCard key={c.id} cafe={c} drink={drink} saved={saved} toggleSave={toggleSave} onOpen={openCafe} index={i} />
              ))}
            </div>
            {filtered.length === 0 && <EmptyState onReset={resetFilters} />}
          </>
        ) : (
          <div className="a-fade" style={{ height: isDesktop ? 560 : "68vh" }}>
            <LondonMap cafes={cafesFull} visibleIds={visibleIds} selectedId={selectedId} onSelect={setSelectedId} hoveredId={hoveredId} onOpen={openCafe} overlay={mapOverlay} />
          </div>
        )}
      </section>
    </div>
  );

  const mapView = isDesktop ? (
    <div className="grid gap-4" style={{ gridTemplateColumns: "340px 1fr", height: "calc(100vh - 64px - 64px)", minHeight: 520 }}>
      <aside className="flex min-h-0 flex-col" aria-label="Café list">
        <div className="mb-3">
          <p className="text-sm" style={{ color: C.sage }}>
            {filtered.length} cafés
          </p>
          <h1 className="serif text-3xl">the map</h1>
        </div>
        <div key={`${area}|${drink}`} className="no-scrollbar -mx-1 min-h-0 flex-1 space-y-2 overflow-y-auto px-1 pb-2 pt-1">
          {filtered.map((c, i) => (
            <CafeListRow
              key={c.id}
              cafe={c}
              index={i}
              selected={selectedId === c.id}
              onSelect={(id) => setSelectedId((s) => (s === id ? null : id))}
              onHover={setHoveredId}
              onOpen={openCafe}
              rowRef={(el) => (rowRefs.current[c.id] = el)}
            />
          ))}
          {filtered.length === 0 && <EmptyState onReset={resetFilters} />}
        </div>
      </aside>
      <div className="min-h-0">
        <LondonMap cafes={cafesFull} visibleIds={visibleIds} selectedId={selectedId} onSelect={setSelectedId} hoveredId={hoveredId} onOpen={openCafe} overlay={mapOverlay} focusTopRatio={0.45} />
      </div>
    </div>
  ) : (
    <div className="-mx-4 -mt-4" style={{ height: "calc(100dvh - 57px - 64px - env(safe-area-inset-bottom))" }}>
      <LondonMap cafes={cafesFull} visibleIds={visibleIds} selectedId={selectedId} onSelect={setSelectedId} hoveredId={null} onOpen={openCafe} overlay={mapOverlay} rounded={false} focusTopRatio={0.38} />
    </div>
  );

  const detailCafe = detailId ? cafesById[detailId] : null;

  return (
    <div className="sp min-h-screen">
      <style>{CSS}</style>
      <TopNav tab={tab} setTab={setTab} onRate={openRate} savedCount={saved.size} />
      <header className="glass sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 md:hidden" style={{ borderColor: C.line }}>
        <Logo height={24} />
        <button type="button" onClick={() => setTab("profile")} className="press relative flex h-9 w-9 items-center justify-center rounded-full" style={{ background: C.stone }} aria-label={`Want to Try list, ${saved.size} saved`}>
          <Bookmark size={16} />
          {saved.size > 0 && (
            <span key={saved.size} className="a-pop tabular absolute -right-1 -top-1 flex h-5 items-center justify-center rounded-full px-1 text-xs font-medium text-white" style={{ background: C.ink, minWidth: 20 }}>
              {saved.size}
            </span>
          )}
        </button>
      </header>

      <main className={`mx-auto max-w-5xl px-4 md:px-6 ${tab === "map" ? "pt-4 md:py-8 pb-0 md:pb-8" : "pb-28 pt-4 md:py-8"}`}>
        <div key={tab} className="a-fadeup">
          {tab === "discover" && discover}
          {tab === "map" && mapView}
          {tab === "leaderboard" && <Leaderboard cafes={cafesFull} items={items} cafesById={cafesById} onOpenCafe={openCafe} saved={saved} toggleSave={toggleSave} flash={flash} />}
          {tab === "profile" && <Profile history={history} saved={saved} items={items} cafesById={cafesById} toggleSave={toggleSave} onOpenCafe={openCafe} onRate={() => openRate()} />}
        </div>
      </main>

      <BottomNav tab={tab} setTab={setTab} onRate={openRate} />

      <Sheet data={detailCafe} onClose={closeDetail} label="Café details">
        {(cafe) => <CafeDetail cafe={cafesById[cafe.id] || cafe} rank={ranks[cafe.id]} saved={saved} toggleSave={toggleSave} onRate={openRate} onShowMap={showOnMap} />}
      </Sheet>

      <Sheet data={rate} onClose={closeRate} label="Rate an item">
        {(r) => <RateForm key={r.key} cafes={cafesFull} items={items} initialCafeId={r.cafeId} onSubmit={submitRating} />}
      </Sheet>

      <Toast toast={toast} />
    </div>
  );
}
