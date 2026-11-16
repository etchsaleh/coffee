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
  bg: "#FAF9F6",
  card: "#FFFFFF",
  line: "#EBE8E2",
  stone: "#F2EFE9",
  ink: "#1E1C1A",
  taupe: "#736E67",
  clay: "#B87D56",
  sage: "#5E7A6B",
  land: "#F4F1EA",
  river: "#E3E8EA",
  park: "#E8EDE9",
};
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const CSS = `
.sp{font-family:"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:${C.ink};background:${C.bg};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-tap-highlight-color:transparent;font-feature-settings:"cv11","ss01";}
.sp *{box-sizing:border-box}
.sp button{font:inherit;cursor:pointer}
.sp .tabular{font-variant-numeric:tabular-nums}
.sp .tr{transition-property:transform,opacity,background-color,color,border-color,box-shadow;transition-duration:.45s;transition-timing-function:${EASE}}
.sp .press{transition:transform .28s ${EASE},background-color .35s ${EASE},color .35s ${EASE},box-shadow .35s ${EASE},border-color .35s ${EASE},opacity .35s ${EASE}}
.sp .press:active{transform:scale(.95)}
.sp .lift{transition:transform .45s ${EASE},box-shadow .45s ${EASE},border-color .45s ${EASE}}
@media (hover:hover){.sp .lift:hover{transform:translate3d(0,-3px,0);box-shadow:0 18px 40px -22px rgba(30,28,26,.28);border-color:#E0DCD4}}
.sp .glass{background:rgba(250,249,246,.74);-webkit-backdrop-filter:saturate(1.6) blur(18px);backdrop-filter:saturate(1.6) blur(18px)}
.sp .glass-white{background:rgba(255,255,255,.78);-webkit-backdrop-filter:saturate(1.6) blur(14px);backdrop-filter:saturate(1.6) blur(14px)}
.sp .hair{border:1px solid ${C.line}}
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
.sp .sp-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:28px;height:28px;border-radius:999px;background:#fff;border:1px solid ${C.line};box-shadow:0 4px 14px -4px rgba(30,28,26,.35);transition:transform .3s ${SPRING};cursor:grab}
.sp .sp-range:active::-webkit-slider-thumb{transform:scale(1.15);cursor:grabbing}
.sp .sp-range::-moz-range-thumb{width:28px;height:28px;border-radius:999px;background:#fff;border:1px solid ${C.line};box-shadow:0 4px 14px -4px rgba(30,28,26,.35)}
.sp .sp-range:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 3px ${C.ink}}

@media (prefers-reduced-motion:reduce){
  .sp *,.sp *::before,.sp *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
`;

/* ───────────────────────────── Mock database ───────────────────────────── */

const AREAS = ["All London", "Soho", "Shoreditch", "Borough", "Fitzrovia", "City", "Bloomsbury"];
const DRINKS = ["All Drinks", "Flat White", "Matcha", "Pour Over", "Oat Milk", "Pastries"];
const NOTE_CHIPS = ["Silky", "Fruity", "Chocolatey", "Great Oat Milk", "Nutty", "Bright", "Caramel", "Floral", "Balanced", "Bold"];
const AREA_POS = {
  Soho: [446, 398],
  Shoreditch: [900, 196],
  Borough: [770, 560],
  Fitzrovia: [418, 298],
  City: [760, 368],
  Bloomsbury: [508, 258],
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
function Segmented({ options, value, onChange, label, variant = "white", size = "md", scroll = false, full = false, glass = false, scrollPad = "px-4 -mx-4 md:mx-0 md:px-0" }) {
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
    return () => ro.disconnect();
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
      className={`relative ${full ? "flex w-full" : "inline-flex"} items-center gap-0.5 rounded-full p-1 ${glass ? "glass-white hair" : ""}`}
      style={glass ? { boxShadow: "0 6px 20px -12px rgba(30,28,26,.25)" } : { background: C.stone }}
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-1 bottom-1 rounded-full"
        style={{
          width: ind.w,
          transform: `translate3d(${ind.x}px,0,0)`,
          opacity: ind.ready ? 1 : 0,
          background: ink ? C.ink : "#fff",
          boxShadow: ink ? "0 4px 12px -6px rgba(30,28,26,.5)" : "0 1px 2px rgba(30,28,26,.08), 0 0 0 1px rgba(30,28,26,.04)",
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
  return (
    <div ref={scrollRef} className={`no-scrollbar overflow-x-auto ${scrollPad}`}>
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
      className="tabular inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
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
      style={{ background: "rgba(184,125,86,.12)", color: C.clay }}
    >
      Samia's Pick ✨
    </span>
  );
}

function Tag({ children, tone = "stone" }) {
  const tones = {
    stone: { background: C.stone, color: C.taupe },
    sage: { background: "rgba(94,122,107,.12)", color: C.sage },
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
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: C.taupe }}>
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl" style={{ background: C.ink }}>
        <Coffee size={18} color="#fff" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        Samspresso
        <span className="ml-1.5 align-middle text-xs font-medium uppercase tracking-widest" style={{ color: C.taupe }}>
          London
        </span>
      </span>
    </div>
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
      <div className={`absolute inset-0 ${open ? "ov-in" : "ov-out"}`} style={{ background: "rgba(30,28,26,.32)" }} onClick={onClose} />
      <div
        className={`relative w-full md:max-w-xl ${open ? "sheet-in" : "sheet-out"}`}
        style={{ willChange: "transform" }}
      >
        <div
          className="no-scrollbar relative overflow-y-auto rounded-t-3xl bg-white md:rounded-3xl"
          style={{ maxHeight: "90vh", boxShadow: "0 -10px 40px -20px rgba(30,28,26,.35)", paddingBottom: "env(safe-area-inset-bottom)" }}
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
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="tabular font-semibold" style={{ color: high ? C.sage : C.ink }}>
          {shown}% Taste Match
        </span>
        {high && (
          <span className="rounded-full px-2 py-0.5 font-medium" style={{ background: "rgba(94,122,107,.12)", color: C.sage }}>
            High match
          </span>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full" style={{ background: C.stone }}>
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
  const short = (name) => name.replace(/ Coffee| Espresso/g, "");

  return (
    <section className="relative overflow-hidden rounded-3xl bg-white p-5 hair md:p-8" aria-labelledby="tm-title">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(184,125,86,.10), transparent)" }}
      />
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: C.taupe }}>
        <Sparkles size={13} aria-hidden="true" /> Taste-Match Engine
      </p>
      <h1 id="tm-title" className="text-2xl font-semibold leading-snug tracking-tight md:text-4xl md:leading-tight">
        If you love the{" "}
        <span className="focus-within-ring mr-1 relative inline-flex items-center gap-1 rounded-xl px-2 py-0.5 align-baseline" style={{ background: C.stone }}>
          <span>
            {src.name} <span style={{ color: C.taupe }}>at {short(srcCafe ? srcCafe.name : "")}</span>
          </span>
          <ChevronDown size={20} strokeWidth={2.2} aria-hidden="true" />
          <select
            aria-label="Choose a drink you love"
            value={src.id}
            onChange={(e) => setSourceId(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          >
            {cafes.map((c) => (
              <optgroup key={c.id} label={c.name}>
                {items
                  .filter((i) => i.cafeId === c.id)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} at {short(c.name)}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </span>
        <span aria-hidden="true">…</span>
      </h1>
      <p className="mt-2 text-sm md:text-base" style={{ color: C.taupe }}>
        …you'll probably love these across London.
      </p>

      <div key={src.id} className="mt-6 grid gap-3 md:grid-cols-3">
        {recs.map((r, i) => {
          const cafe = cafesById[r.item.cafeId];
          return (
            <div key={r.item.id} className="a-fadeup" style={{ animationDelay: `${i * 90}ms` }}>
              <article className="lift flex h-full flex-col rounded-2xl p-4 hair" style={{ background: C.bg }}>
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => onOpenCafe(cafe.id)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-xs font-medium" style={{ color: C.taupe }}>
                      {cafe.name}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 font-semibold">
                      {r.item.name}
                      {r.item.pick && <PickBadge small />}
                    </p>
                  </button>
                  <BookmarkButton saved={saved.has(r.item.id)} onToggle={() => toggleSave(r.item.id)} />
                </div>
                <div className="mt-3">
                  <MatchBar score={r.score} delay={200 + i * 120} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.item.flavours.map((f) => (
                    <Tag key={f} tone={src.flavours.includes(f) ? "sage" : "outline"}>
                      {f}
                    </Tag>
                  ))}
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed" style={{ color: C.taupe }}>
                  {r.why}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs" style={{ color: C.taupe }}>
                  <span className="flex items-center gap-1">
                    <TrainFront size={13} aria-hidden="true" /> {cafe.tube}
                  </span>
                  <ScoreChip value={r.item.rating} />
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

function Filters({ area, setArea, drink, setDrink, compact = false, glass = false, scrollPad }) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <Segmented label="Filter by neighbourhood" options={AREAS} value={area} onChange={setArea} variant="ink" size={compact ? "sm" : "md"} scroll glass={glass} scrollPad={scrollPad} />
      <Segmented label="Filter by drink style" options={DRINKS} value={drink} onChange={setDrink} variant="ink" size={compact ? "sm" : "md"} scroll glass={glass} scrollPad={scrollPad} />
    </div>
  );
}

function CafeCard({ cafe, drink, saved, toggleSave, onOpen, onHover, index }) {
  const shown = useMemo(() => {
    const list = [...cafe.items];
    if (drink !== "All Drinks") list.sort((a, b) => b.styles.includes(drink) - a.styles.includes(drink));
    return list.slice(0, 3);
  }, [cafe.items, drink]);
  return (
    <div className="a-fadeup" style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
      <article
        className="lift flex h-full flex-col rounded-3xl bg-white p-4 hair md:p-5"
        onMouseEnter={() => onHover && onHover(cafe.id)}
        onMouseLeave={() => onHover && onHover(null)}
      >
        <button type="button" onClick={() => onOpen(cafe.id)} className="w-full text-left" aria-label={`Open ${cafe.name}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-tight">{cafe.name}</h3>
              <p className="truncate text-sm" style={{ color: C.taupe }}>
                {cafe.hood}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="tabular text-2xl font-semibold leading-none tracking-tight">{f1(cafe.avg)}</p>
              <p className="mt-1 text-xs" style={{ color: C.taupe }}>
                avg score
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: C.taupe }}>
            <span className="flex items-center gap-1">
              <TrainFront size={13} aria-hidden="true" /> {cafe.tube}
            </span>
            <span aria-label={`Price ${cafe.price.length} of 2`}>{cafe.price}</span>
            <span>{cafe.total} ratings</span>
            {cafe.pick && <PickBadge small />}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {cafe.vibes.slice(0, 3).map((v) => (
              <Tag key={v}>{v}</Tag>
            ))}
          </div>
        </button>
        <ul className="mt-4 border-t" style={{ borderColor: C.line }}>
          {shown.map((it) => {
            const dim = drink !== "All Drinks" && !it.styles.includes(drink);
            return (
              <li key={it.id} className="tr flex items-center gap-2 border-b py-1.5 last:border-b-0" style={{ borderColor: C.line, opacity: dim ? 0.45 : 1 }}>
                <button type="button" onClick={() => onOpen(cafe.id)} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 py-1 text-left text-sm">
                  <span className="font-medium">{it.name}</span>
                  {it.pick && <PickBadge small />}
                </button>
                <ScoreChip value={it.rating} />
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
      <p className="mt-3 font-semibold">No cafés match that combo yet</p>
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
const H = 700;

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
  ["MARYLEBONE", 300, 300],
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
    const k = Math.min(size.w / 600, size.h / 540);
    return clampView({ k, x: size.w / 2 - 640 * k, y: size.h * 0.56 - 385 * k });
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
                        className="tabular relative flex h-8 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-sm font-semibold"
                        style={{
                          background: isSel ? C.ink : "#fff",
                          color: isSel ? "#fff" : C.ink,
                          boxShadow: `0 0 0 ${c.pick ? 2 : 1}px ${c.pick ? C.clay : isSel || isHov ? C.ink : C.line}, 0 6px 16px -6px rgba(30,28,26,.35)`,
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
                        className="pointer-events-none absolute top-full mt-1 whitespace-nowrap rounded-md px-1.5 text-xs font-semibold"
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

      <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col overflow-hidden rounded-2xl glass-white hair" style={{ boxShadow: "0 8px 24px -14px rgba(30,28,26,.35)" }}>
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
    <div className="rounded-3xl bg-white p-4 hair" style={{ boxShadow: "0 20px 50px -24px rgba(30,28,26,.45)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-base font-semibold tracking-tight">
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
            <p className="truncate text-sm font-semibold">{top.name}</p>
          </div>
          <ScoreChip value={top.rating} />
        </div>
      )}
      <button type="button" onClick={() => onOpen(cafe.id)} className="press mt-3 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white" style={{ background: C.ink }}>
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
        className="tr flex items-center gap-3 rounded-2xl bg-white p-3"
        style={{ boxShadow: `0 0 0 ${selected ? 1.5 : 1}px ${selected ? C.ink : C.line}` }}
        onMouseEnter={() => onHover(cafe.id)}
        onMouseLeave={() => onHover(null)}
      >
        <button type="button" onClick={() => onSelect(cafe.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Show ${cafe.name} on map`}>
          <span className="tabular flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-sm font-semibold" style={{ background: selected ? C.ink : C.stone, color: selected ? "#fff" : C.ink }}>
            {f1(cafe.avg)}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate font-semibold">{cafe.name}</span>
              {cafe.pick && <span aria-label="Samia's Pick">✨</span>}
            </span>
            <span className="block truncate text-xs" style={{ color: C.taupe }}>
              {cafe.tube} · {cafe.price} · {top ? `${top.name} ${f1(top.rating)}` : "No ratings yet"}
            </span>
          </span>
        </button>
        <button type="button" onClick={() => onOpen(cafe.id)} aria-label={`Open ${cafe.name} details`} className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: C.stone }}>
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
  const maxScore = 5;

  return (
    <div>
      <SectionTitle
        eyebrow="Community rankings"
        title="London Leaderboard"
        right={
          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: "rgba(94,122,107,.12)", color: C.sage }}>
            <span className="a-dot h-1.5 w-1.5 rounded-full" style={{ background: C.sage }} /> Live
          </span>
        }
      />
      <div className="mb-4">
        <Segmented
          label="Leaderboard type"
          full
          options={[
            { value: "cafes", label: "Top London Cafés", icon: Store },
            { value: "drinks", label: "Top Specific Drinks", icon: Coffee },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      <div key={tab} className="a-fade relative overflow-hidden rounded-3xl bg-white hair" style={{ height: rows.length * ROW_H }}>
        {rows.map((r, i) => {
          const isCafe = tab === "cafes";
          const score = isCafe ? r.avg : r.rating;
          const cafe = isCafe ? r : cafesById[r.cafeId];
          const flashing = flash && (isCafe ? flash.cafeId === r.id : flash.id === r.id);
          return (
            <div
              key={r.id}
              className="absolute inset-x-0 top-0 flex items-center gap-3 px-4 md:px-5"
              style={{ height: ROW_H, transform: `translate3d(0, ${i * ROW_H}px, 0)`, transition: `transform .8s ${EASE}`, borderBottom: i < rows.length - 1 ? `1px solid ${C.line}` : "none" }}
            >
              {flashing && <span key={flash.t} aria-hidden="true" className="a-flash pointer-events-none absolute inset-0" style={{ background: "rgba(184,125,86,.12)" }} />}
              <span
                className="tabular relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                style={i < 3 ? { background: i === 0 ? C.ink : C.stone, color: i === 0 ? "#fff" : C.ink } : { color: C.taupe }}
              >
                {i + 1}
              </span>
              <button type="button" onClick={() => onOpenCafe(cafe.id)} className="relative min-w-0 flex-1 text-left">
                <span className="flex items-center gap-2">
                  <span className="truncate font-semibold">{r.name}</span>
                  {!isCafe && bestOf[r.id] && (
                    <span className="hidden whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium sm:inline-flex" style={{ background: "rgba(94,122,107,.12)", color: C.sage }}>
                      {bestOf[r.id]}
                    </span>
                  )}
                  {r.pick && <span aria-label="Samia's Pick">✨</span>}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs" style={{ color: C.taupe }}>
                  {!isCafe && <span className="truncate font-medium" style={{ color: C.ink }}>{cafe.name}</span>}
                  {!isCafe && <span>·</span>}
                  <TrainFront size={12} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">{cafe.tube}</span>
                  <span>·</span>
                  <span>{cafe.price}</span>
                </span>
                {!isCafe && bestOf[r.id] && (
                  <span className="mt-1 inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium sm:hidden" style={{ background: "rgba(94,122,107,.12)", color: C.sage }}>
                    {bestOf[r.id]}
                  </span>
                )}
              </button>
              <div className="relative w-20 shrink-0 text-right md:w-28">
                <p className="tabular text-lg font-semibold leading-none">{f2(score)}</p>
                <div className="ml-auto mt-1.5 h-1 w-full overflow-hidden rounded-full" style={{ background: C.stone }}>
                  <div className="h-full w-full rounded-full" style={{ background: C.ink, transform: `scaleX(${clamp((score - 4) / (maxScore - 4), 0.05, 1)})`, transformOrigin: "0 50%", transition: `transform .8s ${EASE}` }} />
                </div>
                <p className="tabular mt-1 text-xs" style={{ color: C.taupe }}>
                  {isCafe ? r.total : r.count} ratings
                </p>
              </div>
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
    { label: "Avg given", value: history.length ? f1(avg(history.map((h) => h.rating))) : "–" },
  ];
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-white p-5 hair md:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(94,122,107,.10), transparent)" }} />
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl" style={{ background: C.stone }}>
            <User size={28} strokeWidth={1.6} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.taupe }}>
              Coffee Passport
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Your London Cup Log</h1>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl px-4 py-3" style={{ background: C.bg }}>
              <dt className="text-xs" style={{ color: C.taupe }}>
                {s.label}
              </dt>
              <dd key={String(s.value)} className="a-pop tabular mt-0.5 inline-block text-2xl font-semibold tracking-tight">
                {s.value}
              </dd>
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
                <button type="button" onClick={() => cafesById[h.cafeId] && onOpenCafe(h.cafeId)} className="lift flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left hair">
                  <span className="tabular flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-semibold" style={{ background: C.stone }}>
                    {f1(h.rating)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{h.name}</span>
                    <span className="block truncate text-xs" style={{ color: C.taupe }}>
                      {h.cafeName} · {timeAgo(h.ts)}
                    </span>
                    {h.notes.length > 0 && (
                      <span className="mt-2 flex flex-wrap gap-1">
                        {h.notes.map((n) => (
                          <Tag key={n}>{n}</Tag>
                        ))}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            ))
          ) : (
            <div className="a-fadeup rounded-3xl bg-white p-8 text-center hair">
              <p className="font-semibold">No ratings yet</p>
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
                  <div className="lift flex items-center gap-3 rounded-2xl bg-white p-4 hair">
                    <button type="button" onClick={() => onOpenCafe(cafe.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: C.stone }}>
                        <Coffee size={20} strokeWidth={1.7} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-semibold">{it.name}</span>
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
              <p className="mt-3 font-semibold">Your Want to Try list is empty</p>
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
      <p className="flex items-center gap-1.5 pr-12 text-xs font-semibold uppercase tracking-widest" style={{ color: C.taupe }}>
        <MapPin size={13} aria-hidden="true" /> {cafe.hood}
      </p>
      <div className="mt-2 flex items-start justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{cafe.name}</h2>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl px-3 py-3" style={{ background: C.bg }}>
          <p className="text-xs" style={{ color: C.taupe }}>
            Avg score
          </p>
          <p className="tabular mt-0.5 flex items-center gap-1 text-xl font-semibold">
            {f2(cafe.avg)} <Star size={14} strokeWidth={0} fill={C.ink} aria-hidden="true" />
          </p>
        </div>
        <div className="rounded-2xl px-3 py-3" style={{ background: C.bg }}>
          <p className="text-xs" style={{ color: C.taupe }}>
            London rank
          </p>
          <p className="tabular mt-0.5 text-xl font-semibold">{rank ? `#${rank}` : "New"}</p>
        </div>
        <div className="rounded-2xl px-3 py-3" style={{ background: C.bg }}>
          <p className="text-xs" style={{ color: C.taupe }}>
            Ratings
          </p>
          <p className="tabular mt-0.5 text-xl font-semibold">{cafe.total}</p>
        </div>
      </div>
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
          <Tag key={v} tone="outline">
            {v}
          </Tag>
        ))}
      </div>

      <h3 className="mb-2 mt-7 text-xs font-semibold uppercase tracking-widest" style={{ color: C.taupe }}>
        Menu &amp; Ratings
      </h3>
      <ul className="space-y-2">
        {cafe.items.map((it, i) => (
          <li key={it.id} className="a-fadeup flex items-center gap-3 rounded-2xl p-3 hair" style={{ animationDelay: `${120 + i * 60}ms` }}>
            <span className="tabular w-5 text-center text-sm font-semibold" style={{ color: C.taupe }}>
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {it.name} {it.pick && <PickBadge small />}
              </p>
              <p className="mt-1 truncate text-xs" style={{ color: C.taupe }}>
                {it.flavours.join(" · ")} · {it.count} ratings
              </p>
            </div>
            <ScoreChip value={it.rating} digits={2} />
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
        <button type="button" onClick={() => onRate(cafe.id)} className="press flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white" style={{ background: C.ink }}>
          <Plus size={16} /> Rate an item here
        </button>
        {cafe.x != null && (
          <button type="button" onClick={() => onShowMap(cafe.id)} className="press flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold" style={{ background: C.stone }}>
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
  const inputCls = "w-full rounded-2xl px-4 py-3 text-sm outline-none tr";
  const inputStyle = { background: C.bg, boxShadow: `inset 0 0 0 1px ${C.line}` };

  return (
    <form
      className="px-5 pb-6 pt-3 md:px-8 md:pt-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit({ cafeId, newCafe, itemName, rating: Math.round(rating * 10) / 10, notes });
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.taupe }}>
        New rating
      </p>
      <h2 className="mt-1 pr-12 text-2xl font-semibold tracking-tight">What did you sip?</h2>

      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-semibold">Café</legend>
        <Segmented
          label="Choose a café"
          variant="ink"
          size="sm"
          scroll
          scrollPad="-mx-5 px-5 md:-mx-8 md:px-8"
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
              autoFocus
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
        <legend className="mb-2 text-sm font-semibold">Menu item</legend>
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
        <legend className="mb-2 text-sm font-semibold">Your rating</legend>
        <div className="rounded-3xl p-4" style={{ background: C.bg }}>
          <div className="flex items-end justify-between">
            <div>
              <span key={f1(rating)} className="a-pop tabular inline-block text-5xl font-semibold leading-none tracking-tight">
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
        <legend className="mb-2 text-sm font-semibold">Tasting notes</legend>
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
        className="press mt-7 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white"
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
        <button type="button" onClick={() => setTab("discover")} aria-label="Samspresso home">
          <Logo />
        </button>
        <nav aria-label="Primary">
          <Segmented label="Sections" options={TABS} value={tab} onChange={setTab} />
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setTab("profile")} className="press relative flex h-10 w-10 items-center justify-center rounded-full" style={{ background: C.stone }} aria-label={`Want to Try list, ${savedCount} saved`}>
            <Bookmark size={17} />
            {savedCount > 0 && (
              <span key={savedCount} className="a-pop tabular absolute -right-0.5 -top-0.5 flex h-5 items-center justify-center rounded-full px-1 text-xs font-semibold text-white" style={{ background: C.ink, minWidth: 20 }}>
                {savedCount}
              </span>
            )}
          </button>
          <button type="button" onClick={() => onRate()} className="press flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-white" style={{ background: C.ink }}>
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
        <span aria-hidden="true" className="pointer-events-none absolute left-0 top-0 flex h-full w-1/5 items-center justify-center" style={{ transform: `translate3d(${idx * 100}%,0,0)`, transition: `transform .55s ${EASE}` }}>
          <span className="mb-4 h-8 w-14 rounded-full" style={{ background: C.stone }} />
        </span>
        {slots.map((s, i) =>
          s ? (
            <button key={s.value} type="button" onClick={() => setTab(s.value)} aria-current={tab === s.value ? "page" : undefined} className="press relative flex flex-col items-center justify-center gap-1 text-xs font-medium" style={{ color: tab === s.value ? C.ink : C.taupe }}>
              <s.icon size={20} strokeWidth={tab === s.value ? 2.2 : 1.8} aria-hidden="true" />
              {s.label === "Leaderboard" ? "Ranks" : s.label}
            </button>
          ) : (
            <div key="rate" className="flex items-center justify-center">
              <button type="button" onClick={() => onRate()} aria-label="Rate an item" className="press -mt-6 flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: C.ink, boxShadow: "0 10px 24px -10px rgba(30,28,26,.6), 0 0 0 4px #FAF9F6" }}>
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
      <div key={toast.t} className="a-toast flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-white" style={{ background: C.ink, boxShadow: "0 18px 40px -16px rgba(30,28,26,.55)" }}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,.12)" }}>
          <Sparkles size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{toast.title}</p>
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
    <Filters area={area} setArea={setArea} drink={drink} setDrink={setDrink} compact glass scrollPad="-mx-3 px-3 pr-16" />
  );

  const discover = (
    <div className="space-y-8">
      <TasteMatch items={items} cafes={cafesFull} cafesById={cafesById} sourceId={sourceId} setSourceId={setSourceId} saved={saved} toggleSave={toggleSave} onOpenCafe={openCafe} />
      <section aria-labelledby="explore-title">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: C.taupe }}>
              Explore
            </p>
            <h2 id="explore-title" className="text-xl font-semibold tracking-tight md:text-2xl">
              {area === "All London" ? "Specialty coffee across London" : `Best of ${area}`}
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
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.taupe }}>
            Map view
          </p>
          <h1 className="text-xl font-semibold tracking-tight">{filtered.length} cafés on the map</h1>
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
        <Logo />
        <button type="button" onClick={() => setTab("profile")} className="press relative flex h-9 w-9 items-center justify-center rounded-full" style={{ background: C.stone }} aria-label={`Want to Try list, ${saved.size} saved`}>
          <Bookmark size={16} />
          {saved.size > 0 && (
            <span key={saved.size} className="a-pop tabular absolute -right-1 -top-1 flex h-5 items-center justify-center rounded-full px-1 text-xs font-semibold text-white" style={{ background: C.ink, minWidth: 20 }}>
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
