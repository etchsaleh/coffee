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
  ChevronDown,
  Footprints,
  Minus,
  RotateCcw,
  Check,
  ArrowRight,
  Coffee,
  Store,
  Palette,
  Copy,
  ChevronUp,
} from "lucide-react";

/* ───────────────────────────── Design tokens ───────────────────────────── */

/*
 * sam'spresso design system: warm milk & oat neutrals, one brand colour.
 *   bg         milk page background
 *   card       white cards
 *   stone      the only grey fill (tracks, rows, chips)
 *   line       hairlines
 *   ink        text
 *   taupe      secondary text and icons
 *   brand      deep olive (logo, buttons, active states, badges, highlights)
 *   brandSoft  brand at low opacity, for badge backgrounds
 *   matcha     taste-match scores, "live" signals, parks on the map
 *   latte      Samia's Picks only
 * Map colours are quiet neutrals derived from the same set.
 */
const C = {
  bg: "#F8F6F2",
  card: "#FFFFFF",
  stone: "#F1EDE7",
  line: "#EEEAE4",
  ink: "#2A2623",
  taupe: "#8D867E",
  brand: "#3E5700",
  matcha: "#7A8B5A",
  latte: "#C49A74",
  land: "#F4F1EB",
  river: "#E4E9E8",
  park: "#E5EBDC",
  mapLine: "#D9D3CB",
};
// role aliases used throughout the components
C.clay = C.latte; // Samia's Pick
C.sage = C.matcha; // taste match / live
/* ───────────────────────────── Theme (editable without code) ─────────────────────────────
 * Colours, fonts and corner roundness come from theme.json at the site root.
 * A designer can edit that file on GitHub, or tune it live in the playground
 * (open the app with ?design or #design) and copy the result into theme.json.
 * Anything missing or invalid falls back to these defaults.
 */
const DEFAULT_THEME = {
  colors: {
    background: "#F8F6F2", // page
    card: "#FFFFFF", // cards & sheets
    surface: "#F1EDE7", // pills, tracks, rows
    line: "#EEEAE4", // hairlines
    text: "#2A2623",
    muted: "#8D867E", // secondary text & icons
    brand: "#3E5700", // logo, buttons, active states
    matcha: "#7A8B5A", // taste matches, "live"
    latte: "#C49A74", // Samia's Picks
  },
  fonts: { display: "Instrument Serif", displayItalic: true, body: "Manrope" },
  corners: 24,
};
const COLOR_ROLES = [
  ["background", "Page background"],
  ["card", "Cards & sheets"],
  ["surface", "Pills, tracks & rows"],
  ["line", "Hairlines"],
  ["text", "Text"],
  ["muted", "Secondary text & icons"],
  ["brand", "Brand: logo, buttons, active"],
  ["matcha", "Matcha: taste matches"],
  ["latte", "Latte: Samia's Picks"],
];
const HEX = /^#[0-9a-f]{6}$/i;
const FONT_NAME = /^[A-Za-z0-9 ]{2,40}$/;
let THEME = DEFAULT_THEME;
let THEME_VERSION = 0;

/** hex colour + alpha → rgba() string */
function tint(hex, a) {
  const h = HEX.test(hex || "") ? hex : "#000000";
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Merge a (possibly hand-edited) theme over the defaults, keeping only valid values. */
function sanitizeTheme(raw) {
  const t = JSON.parse(JSON.stringify(DEFAULT_THEME));
  if (!raw || typeof raw !== "object") return t;
  const c = raw.colors || {};
  Object.keys(t.colors).forEach((k) => {
    if (typeof c[k] === "string" && HEX.test(c[k].trim())) t.colors[k] = c[k].trim().toUpperCase();
  });
  const f = raw.fonts || {};
  if (typeof f.display === "string" && FONT_NAME.test(f.display.trim())) t.fonts.display = f.display.trim();
  if (typeof f.body === "string" && FONT_NAME.test(f.body.trim())) t.fonts.body = f.body.trim();
  if (typeof f.displayItalic === "boolean") t.fonts.displayItalic = f.displayItalic;
  if (typeof raw.corners === "number" && raw.corners >= 0 && raw.corners <= 40) t.corners = Math.round(raw.corners);
  return t;
}

/** Load a Google Font by family name (a plain request always succeeds; the
 *  weighted one adds extra weights when the family has them). */
function loadFont(slot, name, extra) {
  if (typeof document === "undefined" || !name || /^system$/i.test(name)) return;
  const fam = encodeURIComponent(name).replace(/%20/g, "+");
  [
    [`sp-font-${slot}`, `https://fonts.googleapis.com/css2?family=${fam}&display=swap`],
    [`sp-font-${slot}-x`, `https://fonts.googleapis.com/css2?family=${fam}:${extra}&display=swap`],
  ].forEach(([id, href]) => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("link");
      el.id = id;
      el.rel = "stylesheet";
      document.head.appendChild(el);
    }
    if (el.getAttribute("href") !== href) el.setAttribute("href", href);
  });
}

function applyTheme(theme) {
  THEME = sanitizeTheme(theme);
  const k = THEME.colors;
  Object.assign(C, {
    bg: k.background,
    card: k.card,
    stone: k.surface,
    line: k.line,
    ink: k.text,
    taupe: k.muted,
    brand: k.brand,
    matcha: k.matcha,
    latte: k.latte,
  });
  C.clay = C.latte;
  C.sage = C.matcha;
  C.brandSoft = tint(C.brand, 0.08);
  C.matchaSoft = tint(C.matcha, 0.13);
  C.latteSoft = tint(C.latte, 0.15);
  THEME_VERSION += 1;
  loadFont("body", THEME.fonts.body, "wght@300;400;500;600");
  loadFont("display", THEME.fonts.display, "ital@0;1");
}
applyTheme(DEFAULT_THEME);

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const buildCSS = () => `
.sp{font-family:"${THEME.fonts.body}","Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:${C.ink};background:${C.bg};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-tap-highlight-color:transparent;letter-spacing:-.005em;}
.sp .serif{font-family:"${THEME.fonts.display}",ui-serif,Georgia,serif;font-style:${THEME.fonts.displayItalic ? "italic" : "normal"};font-weight:400;letter-spacing:-.01em}
.sp .bg-white{background-color:${C.card}}
.sp .rounded-3xl{border-radius:${THEME.corners}px}
.sp .rounded-2xl{border-radius:${Math.round(THEME.corners * 0.67)}px}
.sp .rounded-t-3xl{border-top-left-radius:${THEME.corners}px;border-top-right-radius:${THEME.corners}px}
.sp .soft{box-shadow:0 1px 2px ${tint(C.ink, .03)},0 14px 36px -24px ${tint(C.ink, .22)}}
.sp{overflow-x:clip;max-width:100vw}
.sp *{box-sizing:border-box}
.sp fieldset{min-width:0;margin:0;padding:0;border:0}
.sp button{font:inherit;cursor:pointer;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.sp .tabular{font-variant-numeric:tabular-nums}
.sp .tr{transition-property:transform,opacity,background-color,color,border-color,box-shadow;transition-duration:.45s;transition-timing-function:${EASE}}
.sp .press{transition:transform .28s ${EASE},background-color .35s ${EASE},color .35s ${EASE},box-shadow .35s ${EASE},border-color .35s ${EASE},opacity .35s ${EASE}}
.sp .press:active{transform:scale(.95)}
.sp .tab-halo{opacity:0;transform:scale(.6);transition:opacity .25s ${EASE},transform .35s ${EASE}}
.sp .tab-icon{transition:transform .3s ${SPRING}}
.sp .tab-btn:active .tab-halo{opacity:1;transform:scale(1)}
.sp .tab-btn:active .tab-icon{transform:scale(.9)}
.sp .lift{transition:transform .45s ${EASE},box-shadow .45s ${EASE},border-color .45s ${EASE}}
@media (hover:hover){.sp .lift:hover{transform:translate3d(0,-3px,0);box-shadow:0 2px 4px ${tint(C.ink, .03)},0 22px 44px -24px ${tint(C.ink, .28)}}}
.sp .glass{background:${tint(C.bg, .78)};-webkit-backdrop-filter:saturate(1.6) blur(18px);backdrop-filter:saturate(1.6) blur(18px)}
.sp .glass-white{background:rgba(255,255,255,.78);-webkit-backdrop-filter:saturate(1.6) blur(14px);backdrop-filter:saturate(1.6) blur(14px)}
.sp .hair{box-shadow:0 1px 2px ${tint(C.ink, .03)},0 12px 32px -22px ${tint(C.ink, .2)}}
.sp .no-scrollbar::-webkit-scrollbar{display:none}.sp .no-scrollbar{scrollbar-width:none}
.sp :focus{outline:none}
.sp :focus-visible{outline:2px solid ${C.brand};outline-offset:2px}
.sp input:not([type=range]):focus-visible,.sp select:focus-visible{outline:none;box-shadow:inset 0 0 0 1.5px ${tint(C.brand, .45)}}
.sp .focus-within-ring:focus-within{box-shadow:0 0 0 2px ${C.brand}}

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
@keyframes spDraw{from{stroke-dashoffset:24}to{stroke-dashoffset:0}}
@keyframes spTick{0%{opacity:.4;transform:translate3d(0,6px,0)}100%{opacity:1;transform:none}}
@keyframes spShine{0%{transform:translate3d(-120%,0,0)}60%,100%{transform:translate3d(220%,0,0)}}
@keyframes spNope{0%{transform:rotate(0) scale(1)}45%{transform:rotate(90deg) scale(.8)}100%{transform:rotate(90deg) scale(1)}}
@keyframes spTrailR{0%{opacity:0;transform:translate3d(-30%,0,0) scaleX(.6)}35%{opacity:1}100%{opacity:0;transform:translate3d(25%,0,0) scaleX(1.1)}}
@keyframes spTrailL{0%{opacity:0;transform:translate3d(30%,0,0) scaleX(.6)}35%{opacity:1}100%{opacity:0;transform:translate3d(-25%,0,0) scaleX(1.1)}}
@keyframes spWiggle{0%,100%{transform:none}14%{transform:translate3d(18px,0,0) rotate(3deg)}30%{transform:translate3d(-14px,0,0) rotate(-2.4deg)}46%{transform:translate3d(8px,0,0) rotate(1.2deg)}60%{transform:translate3d(-3px,0,0) rotate(-.4deg)}72%{transform:none}}
@keyframes spCardUp{from{opacity:0;transform:translate3d(0,24px,0) scale(.97)}to{opacity:1;transform:none}}

.sp .a-fadeup{animation:spFadeUp .7s ${EASE} both}
.sp .a-fade{animation:spFade .45s ${EASE} both}
.sp .a-pop{animation:spPop .55s ${SPRING}}
.sp .a-grow{transform-origin:0 50%;animation:spGrow 1.2s ${EASE} both}
.sp .a-pulse{animation:spPulse 2.2s ${EASE} infinite}
.sp .a-dot{animation:spDot 1.6s ease-in-out infinite}
.sp .a-toast{animation:spToastIn .55s ${SPRING} both}
.sp .a-flash{animation:spFlash 2.4s ${EASE} both}
.sp .a-draw{stroke-dasharray:24;animation:spDraw .55s ${EASE} .25s both}
.sp .a-tick{animation:spTick .3s ${EASE} both}
.sp .a-shine::after{content:"";position:absolute;inset:0;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);animation:spShine 3.6s ${EASE} 1s infinite}
.sp .a-nope{animation:spNope .45s ${SPRING} both}
.sp .a-trail-r{transform-origin:100% 50%;animation:spTrailR .7s ${EASE} both}
.sp .a-trail-l{transform-origin:0 50%;animation:spTrailL .7s ${EASE} both}
.sp .a-wiggle{transform-origin:50% 90%;animation:spWiggle 1.3s cubic-bezier(.36,.07,.19,.97) both}
.sp .a-cardup{animation:spCardUp .55s ${SPRING} both}
.sp .ov-in{animation:spFade .35s ${EASE} both}
.sp .ov-out{animation:spFadeOut .3s ${EASE} both}
.sp .sheet-clip{clip-path:inset(0 0 -160px 0 round 24px 24px 0 0)}
@media (min-width:768px){.sp .sheet-clip{clip-path:inset(0 round 24px)}}
.sp .sheet-in{animation:spSheetUp .62s cubic-bezier(.3,1.22,.52,1) both}
.sp .sheet-out{animation:spSheetDown .32s cubic-bezier(.5,0,.75,0) both}
@media (min-width:768px){
  .sp .sheet-in{animation:spModalIn .55s cubic-bezier(.3,1.3,.5,1) both}
  .sp .sheet-out{animation:spModalOut .28s ${EASE} both}
}

.sp .sp-range{-webkit-appearance:none;appearance:none;height:6px;border-radius:999px;outline:none}
.sp .sp-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:28px;height:28px;border-radius:999px;background:#fff;border:1px solid ${C.line};box-shadow:0 4px 14px -4px ${tint(C.ink, .35)};transition:transform .3s ${SPRING};cursor:grab}
.sp .sp-range:active::-webkit-slider-thumb{transform:scale(1.15);cursor:grabbing}
.sp .sp-range::-moz-range-thumb{width:28px;height:28px;border-radius:999px;background:#fff;border:1px solid ${C.line};box-shadow:0 4px 14px -4px ${tint(C.ink, .35)}}
.sp .sp-range:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 3px ${C.ink}}

@media (prefers-reduced-motion:reduce){
  .sp *,.sp *::before,.sp *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
`;

/* ───────────────────────────── Mock database ───────────────────────────── */

// Base neighbourhoods; areas added by users join these at runtime.
const AREAS = ["All London", "Soho", "Marylebone", "Fitzrovia", "Bloomsbury", "Shoreditch", "City", "Borough", "Victoria", "South Ken", "White City"];
const DRINKS = ["All Drinks", "Flat White", "Matcha", "Pour Over", "Oat Milk", "Pastries"];
const NOTE_CHIPS = ["Silky", "Fruity", "Chocolatey", "Great Oat Milk", "Nutty", "Bright", "Caramel", "Floral", "Balanced", "Bold"];
const AREA_POS = {
  Soho: [446, 398],
  Shoreditch: [900, 196],
  Borough: [770, 560],
  Fitzrovia: [418, 298],
  City: [760, 368],
  Bloomsbury: [508, 258],
  "White City": [-268, 392],
  Marylebone: [262, 300],
  Victoria: [372, 690],
  "South Ken": [128, 712],
};

// Map units: 1000 × 700, roughly Hyde Park (W) → Shoreditch (E), Regent's Park (N) → Borough (S).
const SEED_CAFES = [
  {
    id: "monmouth",
    coffee: {
      roaster: "Monmouth (roasts its own)",
      espresso: "Monmouth Espresso",
      roast: "medium-dark",
      notes: ["toasted almond", "fruity", "smooth body"],
      taste: { roast: 0.72, fruit: 0.4, choc: 0.6, milk: 0.55, aroma: 0.1 },
      sources: [{ label: "monmouthcoffee.co.uk", url: "https://www.monmouthcoffee.co.uk/product/monmouth-espresso" }],
    },
    hours: [[7.5, 18], [8, 18], null], // approx. opening hours: weekdays, Saturday, Sunday
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
    coffee: {
      roaster: "WatchHouse (own roastery, Maltby Street)",
      espresso: "1829 seasonal espresso",
      roast: "medium",
      notes: ["almond", "caramel", "chocolate"],
      taste: { roast: 0.5, fruit: 0.35, choc: 0.7, milk: 0.65, aroma: 0.15 },
      sources: [
        { label: "Brian's Coffee Spot", url: "https://www.brian-coffee-spot.com/2021/06/24/watchhouse-roastery-cafe" },
        { label: "The Way to Coffee", url: "https://www.thewaytocoffee.com/beans/1829-espresso" },
      ],
    },
    hours: [[7, 18], [8, 18], [8, 17]], // approx. opening hours: weekdays, Saturday, Sunday
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
    coffee: {
      roaster: "Origin Coffee (own roastery, Cornwall)",
      espresso: "Pathfinder seasonal espresso",
      roast: "light",
      notes: ["blueberry", "lemon", "marzipan"],
      taste: { roast: 0.22, fruit: 0.9, choc: 0.25, milk: 0.25, aroma: 0.2 },
      sources: [{ label: "origincoffee.co.uk", url: "https://www.origincoffee.co.uk/products/pathfinder" }],
    },
    hours: [[7.5, 17.5], [9, 17], [9, 17]], // approx. opening hours: weekdays, Saturday, Sunday
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
    coffee: {
      roaster: "House blends by Origin Coffee",
      espresso: "Milk blend (Brazil)",
      roast: "medium",
      notes: ["milk chocolate", "caramel", "hazelnut"],
      taste: { roast: 0.5, fruit: 0.2, choc: 0.85, milk: 0.9, aroma: 0.05 },
      asOf: "reported 2018–2021",
      sources: [
        { label: "Brian's Coffee Spot", url: "https://www.brian-coffee-spot.com/2018/07/30/rosslyn-coffee" },
        { label: "Tamp", url: "https://tamp-website.pages.dev/roasters/rosslyn-coffee/coffee-roasted-for-milk/" },
      ],
    },
    hours: [[7, 16], null, null], // approx. opening hours: weekdays, Saturday, Sunday
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
    coffee: {
      roaster: "Square Mile + rotating European guests",
      espresso: "Square Mile Red Brick",
      roast: "medium",
      notes: ["plum", "chocolate", "hazelnut"],
      taste: { roast: 0.45, fruit: 0.6, choc: 0.55, milk: 0.4, aroma: 0.15 },
      sources: [
        { label: "prufrockcoffee.com", url: "https://prufrockcoffee.com/about" },
        { label: "Square Mile", url: "https://shop.squaremilecoffee.com/products/red-brick" },
      ],
    },
    hours: [[7.5, 16.5], [9, 16], null], // approx. opening hours: weekdays, Saturday, Sunday
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
    coffee: {
      roaster: "Square Mile + guest espresso",
      espresso: "Square Mile Red Brick",
      roast: "medium",
      notes: ["plum", "chocolate", "hazelnut"],
      taste: { roast: 0.5, fruit: 0.5, choc: 0.6, milk: 0.65, aroma: 0.1 },
      sources: [
        { label: "Brian's Coffee Spot", url: "https://www.brian-coffee-spot.com/2020/09/03/kaffeine-covid-19-update" },
        { label: "kaffeine.co.uk", url: "https://kaffeine.co.uk/our-guest-espresso-weekends-an-explanation" },
      ],
    },
    hours: [[7.5, 17], [8.5, 17], [9, 17]], // approx. opening hours: weekdays, Saturday, Sunday
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
    coffee: {
      roaster: "Square Mile + monthly guests",
      espresso: "Square Mile house espresso",
      roast: "medium",
      notes: ["plum", "chocolate", "hazelnut"],
      taste: { roast: 0.5, fruit: 0.5, choc: 0.55, milk: 0.6, aroma: 0.1 },
      sources: [{ label: "Time Out", url: "https://www.timeout.com/london/restaurants/store-street-espresso" }],
    },
    hours: [[7.5, 18], [9, 17], [9, 17]], // approx. opening hours: weekdays, Saturday, Sunday
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
    coffee: {
      roaster: "Allpress (Redchurch Street)",
      espresso: "Allpress espresso blend",
      roast: "medium",
      notes: ["caramel", "milk chocolate", "stone fruit"],
      taste: { roast: 0.62, fruit: 0.3, choc: 0.7, milk: 0.75, aroma: 0.1 },
      sources: [
        { label: "Monocle", url: "https://monocle.com/design/monocle-cafe-london-opening/" },
        { label: "Selfridges", url: "https://www.selfridges.com/FR/en/cat/allpress-espresso-redchurch-espresso-blend-coffee-250g_554-3001457-ALLRCB/" },
      ],
    },
    hours: [[7, 19], [8, 19], [8, 19]], // approx. opening hours: weekdays, Saturday, Sunday
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
    coffee: {
      roaster: "Hagen (roasts its own)",
      espresso: "Brazilian house espresso",
      roast: null,
      notes: [],
      taste: { roast: 0.55, fruit: 0.3, choc: 0.6, milk: 0.7, aroma: 0.15 },
      sources: [
        { label: "World Coffee Portal", url: "https://www.worldcoffeeportal.com/news/hagen-unveils-next-generation-espresso-bar-in-londons-mayfair/" },
        { label: "Deliveroo menu", url: "https://deliveroo.co.uk/menu/london/hampstead/hagen-espresso-bars-hampstead" },
      ],
    },
    hours: [[7, 18], [8, 18], [8, 18]], // approx. opening hours: weekdays, Saturday, Sunday
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
    coffee: {
      roaster: null,
      espresso: null,
      roast: null,
      notes: ["strong", "depth of flavour"],
      notesFrom: "reviews",
      taste: { roast: 0.65, fruit: 0.3, choc: 0.55, milk: 0.6, aroma: 0.3 },
      sources: [
        { label: "Belgravia Village", url: "https://www.belgraviavillage.com/brand/common-breads" },
        { label: "The Infatuation", url: "https://www.theinfatuation.com/london/reviews/common-breads" },
      ],
    },
    hours: [[8, 18], [8, 18], [8, 18]], // Mon–Sun 8am–6pm (Belgravia Village listing)
    name: "Common Breads",
    hood: "Buckingham Palace Road · Victoria",
    areas: ["Victoria"],
    tube: "Victoria",
    walk: 3,
    price: "£",
    vibes: ["Lebanese Bakery", "Baked On-site", "Grab & Go"],
    blurb: "A Lebanese bakery by Victoria: manouche and ka'ak baked on site all day, and coffee reviewers call strong, with real depth.",
    x: 366,
    y: 680,
  },
  {
    id: "bergamot",
    coffee: {
      roaster: null,
      espresso: null,
      roast: null,
      notes: ["bergamot", "saffron", "aromatic"],
      notesFrom: "signature lattes",
      taste: { roast: 0.5, fruit: 0.35, choc: 0.3, milk: 0.8, aroma: 0.92 },
      sources: [
        { label: "bergamot.kitchen", url: "https://www.bergamot.kitchen/" },
        { label: "OpenTable", url: "https://www.opentable.co.uk/r/bergamot-cafe-london" },
      ],
    },
    // Tue–Sun 10am–5pm, closed Monday (OpenTable)
    hours: [null, [10, 17], [10, 17], [10, 17], [10, 17], [10, 17], [10, 17]],
    name: "Bergamot",
    hood: "Wood Lane Arches · White City",
    areas: ["White City"],
    tube: "Wood Lane",
    walk: 2,
    price: "££",
    vibes: ["Persian Café", "Railway Arch", "Supper Club"],
    blurb: "A Persian café in a railway arch beside Westfield. Fragrant bergamot and saffron lattes, with saffron halva on the side.",
    x: -268,
    y: 392,
  },
];

// Featured / promoted listings. `promo.type` is "drop" (a limited-time item)
// or "sponsored" (a paid showcase); both expire at `endsAt` and render as a
// pinned, clearly labelled entry at the top of the café's menu.
const DROP_ENDS = Date.now() + 52 * 3600000;
const promoLive = (it) => !it.promo || !it.promo.endsAt || it.promo.endsAt > Date.now();
const isNewItem = (it) => !it.count;

// p = taste profile: [body, sweetness, brightness, milk, roast/cocoa, cold, pastry]
const SEED_ITEMS = [
  { id: "mon-fw", cafeId: "monmouth", name: "Flat White", rating: 4.9, count: 64, pick: true, styles: ["Flat White"], flavours: ["Nutty", "Velvety Microfoam", "Chocolatey"], p: [0.75, 0.55, 0.3, 0.8, 0.7, 0, 0] },
  { id: "mon-batch", cafeId: "monmouth", name: "Filter Batch Brew", rating: 4.8, count: 41, styles: ["Pour Over"], flavours: ["Clean", "Fruity", "Bright"], p: [0.35, 0.5, 0.75, 0, 0.3, 0, 0] },
  { id: "mon-bun", cafeId: "monmouth", name: "Cinnamon Bun", rating: 4.7, count: 33, styles: ["Pastries"], flavours: ["Buttery", "Spiced", "Sticky"], p: [0.6, 0.9, 0.1, 0.2, 0.4, 0, 1] },
  { id: "wh-oat", cafeId: "watchhouse", name: "Oat Flat White", rating: 4.8, count: 52, styles: ["Flat White", "Oat Milk"], flavours: ["Oat-Friendly", "Velvety Microfoam", "Caramel"], p: [0.65, 0.65, 0.3, 0.85, 0.6, 0, 0] },
  { id: "wh-matcha", cafeId: "watchhouse", name: "Iced Matcha Latte", rating: 4.6, count: 38, styles: ["Matcha", "Oat Milk"], flavours: ["Grassy", "Creamy", "Refreshing"], p: [0.4, 0.55, 0.2, 0.8, 0.1, 1, 0] },
  {
    id: "wh-iced-cardamom",
    cafeId: "watchhouse",
    name: "Iced Cardamom Latte",
    rating: 0,
    count: 0,
    styles: ["Oat Milk"],
    flavours: ["Spiced", "Oat-Friendly", "Refreshing"],
    p: [0.5, 0.75, 0.2, 0.85, 0.35, 1, 0],
    promo: { type: "drop", label: "limited drop", partner: "WatchHouse × sam'spresso", endsAt: DROP_ENDS, journalId: "j-drop-cardamom" },
  },
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
  { id: "cb-musakhan", cafeId: "commonbreads", name: "Musakhan Manouche", rating: 4.7, count: 18, styles: ["Pastries"], flavours: ["Sumac", "Tangy", "Savoury"], p: [0.6, 0.3, 0.4, 0.1, 0.4, 0, 1] },
  { id: "bg-bergamot", cafeId: "bergamot", name: "Bergamot Latte", rating: 4.7, count: 14, styles: [], flavours: ["Aromatic", "Citrus", "Creamy"], p: [0.5, 0.6, 0.45, 0.85, 0.35, 0, 0] },
  { id: "bg-saffron", cafeId: "bergamot", name: "Saffron Latte", rating: 4.6, count: 11, styles: [], flavours: ["Saffron", "Aromatic", "Creamy"], p: [0.55, 0.7, 0.25, 0.85, 0.35, 0, 0] },
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

/** Current day/time in London (Mon = 0). */
function londonNow() {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
    const get = (t) => (parts.find((p) => p.type === t) || {}).value;
    const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday"));
    return { day: day < 0 ? 0 : day, h: parseInt(get("hour"), 10) + parseInt(get("minute"), 10) / 60 };
  } catch (_) {
    const d = new Date();
    return { day: (d.getDay() + 6) % 7, h: d.getHours() + d.getMinutes() / 60 };
  }
}

function fmtHour(h) {
  const hr = Math.floor(h);
  const m = Math.round((h - hr) * 60);
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""}${hr < 12 ? "am" : "pm"}`;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hoursFor = (cafe, day) => cafe.hours && (cafe.hours.length === 7 ? cafe.hours[day] : cafe.hours[day < 5 ? 0 : day === 5 ? 1 : 2]);

/** { open, label } for a café at London time `now`, or null when hours are unknown. */
function openStatus(cafe, now) {
  if (!cafe.hours) return null;
  const today = hoursFor(cafe, now.day);
  if (today && now.h >= today[0] && now.h < today[1]) {
    const soon = today[1] - now.h <= 0.75;
    return { open: true, label: soon ? `closes soon · ${fmtHour(today[1])}` : `open · until ${fmtHour(today[1])}` };
  }
  if (today && now.h < today[0]) return { open: false, label: `opens ${fmtHour(today[0])}` };
  for (let k = 1; k <= 7; k++) {
    const d = (now.day + k) % 7;
    const hrs = hoursFor(cafe, d);
    if (hrs) return { open: false, label: `closed · opens ${k === 1 ? "tomorrow" : DAY_NAMES[d]} ${fmtHour(hrs[0])}` };
  }
  return { open: false, label: "closed" };
}

// Map units → metres (map spans ~0.125° lon × 0.04° lat at 51.5°N).
const M_PER_X = 8.68;
const M_PER_Y = 6.36;
const metresBetween = (a, b) => Math.hypot((a.x - b.x) * M_PER_X, (a.y - b.y) * M_PER_Y);
const walkMins = (m) => Math.max(1, Math.round(m / 80));
const lonLatToMap = (lon, lat) => ({ x: ((lon + 0.19) / 0.125) * 1000, y: ((51.535 - lat) / 0.04) * 700 });

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

/** Calls `onSeen` each time `ref` becomes ≥60% visible (until `stop` is true). */
function useInView(ref, onSeen, stop) {
  const cb = useRef(onSeen);
  cb.current = onSeen;
  useEffect(() => {
    const el = ref.current;
    if (!el || stop || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && cb.current()), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, stop]);
}

/** Window scroll position, throttled to one update per frame. */
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const read = () =>
      Math.max(window.scrollY || 0, (document.scrollingElement && document.scrollingElement.scrollTop) || 0, document.documentElement.scrollTop || 0, document.body.scrollTop || 0);
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setY(read());
      });
    };
    on();
    // capture: also hears scrolls of body/html when iOS makes them the scroller
    document.addEventListener("scroll", on, { passive: true, capture: true });
    return () => {
      document.removeEventListener("scroll", on, { capture: true });
      cancelAnimationFrame(raf);
    };
  }, []);
  return y;
}

/** iOS-style large title: fades and settles as it scrolls under the bar. */
function LargeTitle({ children }) {
  const y = useScrollY();
  const p = clamp(y / 90, 0, 1);
  return (
    <div style={{ opacity: 1 - p * 0.85, transform: `translate3d(0, ${p * 6}px, 0) scale(${1 - p * 0.04})`, transformOrigin: "0 100%", willChange: "transform, opacity" }}>
      {children}
    </div>
  );
}

const COMPACT_TITLES = { discover: "discover", map: "the map", leaderboard: "the leaderboard", profile: "your cup log" };

/** Mobile top bar: seamless at the top, then glass + hairline, with the logo
 *  cross-fading into a compact title once the large title has scrolled away. */
function MobileHeader({ tab, savedCount, onSaved }) {
  const y = useScrollY();
  const scrolled = y > 4;
  const collapsed = y > 64 && tab !== "map";
  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center justify-between px-4 md:hidden"
      style={{
        background: scrolled ? `${tint(C.bg, .8)}` : C.bg,
        WebkitBackdropFilter: scrolled ? "saturate(1.6) blur(18px)" : "none",
        backdropFilter: scrolled ? "saturate(1.6) blur(18px)" : "none",
        boxShadow: scrolled ? `0 1px 0 ${C.line}` : "0 1px 0 transparent",
        transition: `box-shadow .35s ${EASE}, background-color .35s ${EASE}`,
      }}
    >
      <div style={{ opacity: collapsed ? 0 : 1, transform: collapsed ? "translate3d(0,-6px,0) scale(.94)" : "none", transformOrigin: "0 50%", transition: `opacity .35s ${EASE}, transform .45s ${EASE}` }}>
        <Logo height={24} />
      </div>
      <p
        aria-hidden={!collapsed}
        className="serif pointer-events-none absolute inset-x-0 text-center text-2xl"
        style={{ opacity: collapsed ? 1 : 0, transform: collapsed ? "none" : "translate3d(0,8px,0)", transition: `opacity .35s ${EASE}, transform .45s ${EASE}` }}
      >
        {COMPACT_TITLES[tab]}
      </p>
      <button type="button" onClick={onSaved} className="press relative flex h-9 w-9 items-center justify-center rounded-full" style={{ background: C.stone }} aria-label={`Want to Try list, ${savedCount} saved`}>
        <Bookmark size={16} />
        {savedCount > 0 && (
          <span key={savedCount} className="a-pop tabular absolute -right-1 -top-1 flex h-5 items-center justify-center rounded-full px-1 text-xs font-medium text-white" style={{ background: C.brand, minWidth: 20 }}>
            {savedCount}
          </span>
        )}
      </button>
    </header>
  );
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
    if (!el) {
      setInd((p) => (p.ready ? { ...p, ready: false } : p));
      return;
    }
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
      style={scroll ? undefined : glass ? { boxShadow: `0 6px 20px -12px ${tint(C.ink, .25)}` } : { background: C.stone }}
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-1 bottom-1 rounded-full"
        style={{
          width: ind.w,
          transform: `translate3d(${ind.x}px,0,0)`,
          opacity: ind.ready ? 1 : 0,
          background: ink ? C.brand : "#fff",
          boxShadow: ink ? `0 4px 12px -6px ${tint(C.ink, .5)}` : `0 1px 2px ${tint(C.ink, .08)}, 0 0 0 1px ${tint(C.ink, .04)}`,
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
            style={{ color: active ? (ink ? "#fff" : C.brand) : C.taupe }}
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
      style={{ width: "fit-content", overscrollBehaviorX: "contain", ...(glass ? { boxShadow: `0 6px 20px -12px ${tint(C.ink, .25)}` } : { background: C.stone }) }}
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
      style={{ background: saved ? C.brandSoft : "transparent" }}
    >
      <span key={pop} className={`inline-flex ${pop ? "a-pop" : ""}`}>
        <Bookmark size={size} strokeWidth={1.9} color={saved ? C.brand : C.taupe} fill={saved ? C.brand : "none"} />
      </span>
    </button>
  );
}

function ScoreChip({ value, digits = 1, strong = false }) {
  return (
    <span
      className="tabular inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: strong ? C.brand : C.stone, color: strong ? "#fff" : C.ink }}
    >
      {value.toFixed(digits)}
      <Star size={11} strokeWidth={0} fill={strong ? "#fff" : C.brand} aria-hidden="true" />
    </span>
  );
}

function PickBadge({ small = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium ${small ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-xs"}`}
      style={{ background: C.latteSoft, color: C.latte }}
    >
      samia's pick ✦
    </span>
  );
}

function Tag({ children, tone = "stone" }) {
  const tones = {
    stone: { background: C.stone, color: C.taupe },
    sage: { background: C.matchaSoft, color: C.matcha },
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
    <LargeTitle>
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
    </LargeTitle>
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
// Logo colours follow the theme's brand colour.
const logoColors = () => ({ sam: C.brand, sFrom: C.brand, sTo: C.brand, presso: C.brand, shine: "#FFFFFF" });

function Logo({ height = 28, colors = logoColors() }) {
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

function Sheet({ data, onClose, label, children, bare = false, tone = "white", originEl = null, chromeOverlay = false }) {
  const open = data != null;
  const last = useRef(data);
  if (data != null) last.current = data;
  const [render, setRender] = useState(open);
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);
  const surface = tone === "grouped" ? C.bg : "#fff";
  const panelRef = useRef(null);
  const contentRef = useRef(null);
  const morph = !!(originEl && originEl.isConnected);
  const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Shared-element transition: the tapped card grows into the sheet and shrinks back on close.
  const fromOrigin = () => {
    const panel = panelRef.current;
    if (!panel || !originEl) return null;
    const r = panel.getBoundingClientRect();
    const o = originEl.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return `translate3d(${o.left - r.left}px, ${o.top - r.top}px, 0) scale(${o.width / r.width}, ${o.height / r.height})`;
  };
  useLayoutEffect(() => {
    if (!morph || reduce || !render) return;
    const panel = panelRef.current;
    const content = contentRef.current;
    if (!panel || !panel.animate) return;
    const from = fromOrigin();
    if (!from) return;
    if (open) {
      originEl.style.transition = "none";
      originEl.style.opacity = "0";
      panel.animate([{ transform: from }, { transform: "none" }], { duration: 560, easing: "cubic-bezier(.22,1,.36,1)" });
      content && content.animate([{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1 }], { duration: 560, easing: "ease-out" });
    } else {
      content && content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" });
      panel.animate(
        [
          { transform: "none", opacity: 1 },
          { transform: from, opacity: 1, offset: 0.75 },
          { transform: from, opacity: 0 },
        ],
        { duration: 300, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }
      );
      // bring the card back as the sheet lands on it, rather than after
      originEl.style.transition = "opacity .18s ease-out .12s";
      originEl.style.opacity = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, render]);

  useEffect(() => {
    if (open) {
      setRender(true);
      setDy(0);
      return;
    }
    const t = setTimeout(() => setRender(false), morph && !reduce ? 310 : 340);
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

  // Swipe down on the grabber / header to dismiss, like a native iOS sheet.
  const onPointerDown = (e) => {
    if (!open || window.innerWidth >= 768) return;
    if (!e.target.closest("[data-sheet-handle]") || e.target.closest("button,input,select,textarea,a")) return;
    drag.current = { y: e.clientY, t: performance.now() };
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const d = e.clientY - drag.current.y;
    setDy(d > 0 ? d : -Math.sqrt(-d) * 2);
  };
  const onPointerUp = (e) => {
    if (!drag.current) return;
    const d = e.clientY - drag.current.y;
    const v = d / Math.max(1, performance.now() - drag.current.t);
    drag.current = null;
    setDragging(false);
    if (d > 110 || v > 0.55) onClose();
    else setDy(0);
  };

  if (!render || last.current == null) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6" role="dialog" aria-modal="true" aria-label={label}>
      <div
        className={`absolute inset-0 ${open ? "ov-in" : "ov-out"}`}
        style={{ background: `${tint(C.ink, .32)}`, opacity: open ? clamp(1 - dy / 500, 0.2, 1) : undefined, transition: dragging ? "none" : `opacity .4s ${EASE}` }}
        onClick={onClose}
      />
      <div ref={panelRef} className={`relative w-full md:max-w-xl ${morph && !reduce ? "" : open ? "sheet-in" : "sheet-out"}`} style={{ willChange: "transform", transformOrigin: "0 0" }}>
        <div
          className="no-scrollbar relative overflow-y-auto overflow-x-hidden rounded-t-3xl md:rounded-3xl"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            background: surface,
            maxHeight: "90vh",
            overscrollBehavior: "contain",
            boxShadow: `0 -10px 40px -20px ${tint(C.ink, .35)}`,
            paddingBottom: "env(safe-area-inset-bottom)",
            transform: `translate3d(0, ${dy}px, 0)`,
            transition: dragging ? "none" : `transform .55s ${SPRING}`,
          }}
        >
          <div ref={contentRef}>
          {!bare && (
            <>
              {/* zero-height sticky rail: keeps the close button on screen while the sheet scrolls */}
              <div className="sticky top-0 z-30 h-0">
                {chromeOverlay && (
                  // grabber rides the same sticky rail, so it never scrolls away
                  <div data-sheet-handle className="absolute inset-x-16 top-0 flex h-7 justify-center pt-2 md:hidden" style={{ touchAction: "none" }}>
                    <span className="h-1 w-9 rounded-full" style={{ background: `${tint(C.ink, .28)}`, boxShadow: "0 0 0 1px rgba(255,255,255,.35)" }} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="press absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full"
                  style={{
                    background: chromeOverlay ? "rgba(255,255,255,.72)" : C.stone,
                    WebkitBackdropFilter: chromeOverlay ? "blur(14px) saturate(1.5)" : "none",
                    backdropFilter: chromeOverlay ? "blur(14px) saturate(1.5)" : "none",
                    boxShadow: `0 4px 14px -8px ${tint(C.ink, .35)}`,
                  }}
                >
                  <X size={17} strokeWidth={2} />
                </button>
              </div>
              {!chromeOverlay && (
                <div data-sheet-handle className="sticky top-0 z-20 flex justify-center pb-1 pt-2 md:hidden" style={{ background: surface, touchAction: "none" }}>
                  <span className="h-1 w-9 rounded-full" style={{ background: `${tint(C.ink, .18)}` }} />
                </div>
              )}
            </>
          )}
          {children(last.current)}
          </div>
        </div>
        {/* filler below the sheet so the spring overshoot never shows a gap */}
        <div className="absolute left-0 right-0 top-full h-16 md:hidden" style={{ background: surface, transform: `translate3d(0, ${dy}px, 0)` }} />
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
          style={{ transform: `scaleX(${score / 100})`, transformOrigin: "0 50%", background: high ? C.matcha : C.taupe, animationDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

/* ───────────────────────────── Swipe stack ───────────────────────────── */

const SWIPE_OUT = 110; // px past which a release dismisses the card
const STACK_H = 300;

/** One recommendation card's contents (shared by every layer of the stack). */
function RecCard({ r, cafe, saved, toggleSave, onOpenCafe, live }) {
  return (
    <article data-morph className="flex h-full flex-col rounded-3xl bg-white p-5 soft">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          tabIndex={live ? 0 : -1}
          onClick={(e) => onOpenCafe(cafe.id, e.currentTarget.closest("[data-morph]"))}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-xs font-medium" style={{ color: C.taupe }}>
            {cafe.name}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-lg font-medium tracking-tight">
            {r.item.name}
            {r.item.pick && <PickBadge small />}
          </p>
        </button>
        <span onPointerDown={(e) => e.stopPropagation()}>
          <BookmarkButton saved={saved.has(r.item.id)} onToggle={() => toggleSave(r.item.id)} />
        </span>
      </div>
      <div className="mt-4">
        <MatchBar score={r.score} delay={150} />
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
  );
}

/**
 * Tinder-style deck: drag the top card left or right past a threshold to
 * dismiss it; the cards behind rise to take its place. When the deck is
 * empty, a Rewind button deals them all back.
 */
function SwipeStack({ recs, cafesById, saved, toggleSave, onOpenCafe }) {
  const [savedPop, setSavedPop] = useState(0);
  const [skipPop, setSkipPop] = useState(0);
  const [trail, setTrail] = useState({ dir: 0, n: 0 });
  const [justSaved, setJustSaved] = useState(false);
  // "you can swipe this" hint: a little sideways wiggle of the top card
  const deckRef = useRef(null);
  const [hint, setHint] = useState(0);
  const [touched, setTouched] = useState(false);
  const hintTimer = useRef(null);
  useInView(
    deckRef,
    () => {
      if (hint >= 2 || hintTimer.current) return;
      hintTimer.current = setTimeout(() => {
        hintTimer.current = null;
        setHint((h) => h + 1);
      }, hint ? 6000 : 900);
    },
    touched || hint >= 2
  );
  useEffect(() => {
    if (touched && hintTimer.current) {
      clearTimeout(hintTimer.current);
      hintTimer.current = null;
    }
  }, [touched]);
  useEffect(() => () => hintTimer.current && clearTimeout(hintTimer.current), []);
  // after the first wiggle, offer one more a few seconds later if still untouched
  useEffect(() => {
    if (hint !== 1 || touched) return;
    hintTimer.current = setTimeout(() => {
      hintTimer.current = null;
      setHint(2);
    }, 6000);
    return () => hintTimer.current && clearTimeout(hintTimer.current);
  }, [hint, touched]);
  useEffect(() => {
    if (!savedPop) return;
    setJustSaved(true);
    const t = setTimeout(() => setJustSaved(false), 900);
    return () => clearTimeout(t);
  }, [savedPop]);
  const [index, setIndex] = useState(0);
  const [deal, setDeal] = useState(0); // bumps on rewind to replay the deal-in
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState(0); // -1 left, 1 right, 0 none
  const start = useRef(null);
  const left = recs.length - index;

  const dismiss = useCallback(
    (dir) => {
      if (leaving || index >= recs.length) return;
      setTouched(true);
      // swipe right = like: save it to Want to Try (never un-saves)
      const r = recs[index];
      if (dir > 0 && r) {
        if (!saved.has(r.item.id)) toggleSave(r.item.id);
        setSavedPop((n) => n + 1);
      }
      if (dir < 0) setSkipPop((n) => n + 1);
      setTrail((t) => ({ dir, n: t.n + 1 }));
      setLeaving(dir);
      setTimeout(() => {
        setIndex((i) => i + 1);
        setLeaving(0);
        setDrag({ x: 0, y: 0, active: false });
      }, 280);
    },
    [leaving, index, recs.length, recs, saved, toggleSave]
  );

  const rewind = () => {
    setIndex(0);
    setDeal((d) => d + 1);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest && e.target.closest("input,select,textarea,[role=dialog]")) return;
      if (e.key === "ArrowLeft") dismiss(-1);
      if (e.key === "ArrowRight") dismiss(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  const onPointerDown = (e) => {
    if (leaving || (e.pointerType === "mouse" && e.button !== 0)) return;
    setTouched(true);
    const t = performance.now();
    start.current = { x: e.clientX, y: e.clientY, horiz: null, id: e.pointerId, el: e.currentTarget, lastX: e.clientX, lastT: t, prevX: e.clientX, prevT: t };
  };
  const onPointerMove = (e) => {
    const s0 = start.current;
    if (!s0 || e.pointerId !== s0.id) return;
    const dx = e.clientX - s0.x;
    const dy = e.clientY - s0.y;
    if (s0.horiz === null) {
      if (Math.abs(dx) + Math.abs(dy) < 6) return;
      s0.horiz = Math.abs(dx) > Math.abs(dy);
      if (!s0.horiz) {
        start.current = null; // vertical: let the page scroll
        return;
      }
      try {
        s0.el.setPointerCapture(s0.id);
      } catch (_) {}
    }
    // keep the last two samples for a release velocity
    const now = performance.now();
    if (now - s0.lastT > 16) {
      s0.prevX = s0.lastX;
      s0.prevT = s0.lastT;
    }
    s0.lastX = e.clientX;
    s0.lastT = now;
    setDrag({ x: dx, y: dy * 0.25, active: true });
  };
  // Decide from the last real move, never from the end event's coordinates:
  // iOS Safari often fires pointercancel with clientX = 0, which used to read
  // as a huge leftward swipe and fling a right swipe to the left.
  const onPointerUp = (e) => {
    const s0 = start.current;
    if (!s0 || e.pointerId !== s0.id) return;
    start.current = null;
    if (!s0.horiz) return;
    const dx = s0.lastX - s0.x;
    const v = (s0.lastX - s0.prevX) / Math.max(1, s0.lastT - s0.prevT); // px/ms
    let dir = 0;
    if (Math.abs(dx) > SWIPE_OUT) dir = Math.sign(dx);
    else if (e.type === "pointerup" && Math.abs(v) > 0.6 && Math.sign(v) === Math.sign(dx) && Math.abs(dx) > 40) dir = Math.sign(v);
    if (dir) dismiss(dir);
    else setDrag({ x: 0, y: 0, active: false });
  };
  // swallow the click that ends a drag so it doesn't open the café
  const onClickCapture = (e) => {
    if (drag.active && Math.abs(drag.x) > 6) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const visible = recs.slice(index, index + 3);
  const progress = clamp(Math.abs(drag.x) / SWIPE_OUT, 0, 1);

  return (
    <div ref={deckRef} className="mx-auto mt-8 max-w-md">
      <div className="relative" style={{ height: STACK_H }}>
        {/* trailing colour wash: green streak for a save, grey for a skip */}
        {trail.dir !== 0 && (
          <span
            key={`trail-${trail.n}`}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-6 ${trail.dir > 0 ? "a-trail-r left-1/4 right-0" : "a-trail-l left-0 right-1/4"} rounded-full`}
            style={{
              background: trail.dir > 0 ? `linear-gradient(90deg, ${tint(C.matcha, 0)}, ${tint(C.matcha, .55)})` : `linear-gradient(270deg, ${tint(C.taupe, 0)}, ${tint(C.taupe, .45)})`,
              filter: "blur(28px)",
              zIndex: 0,
            }}
          />
        )}
        {left === 0 && (
          <div key={`done-${deal}`} className="a-fadeup absolute inset-0 flex flex-col items-center justify-center rounded-3xl text-center" style={{ background: C.stone }}>
            <p className="serif text-3xl">that's the lot</p>
            <p className="mt-1 text-sm" style={{ color: C.taupe }}>
              you've seen every match for this drink
            </p>
            <button
              type="button"
              onClick={rewind}
              className="press relative mt-5 flex items-center gap-2 overflow-hidden rounded-full py-2.5 pl-4 pr-5 text-sm font-medium text-white"
              style={{ background: C.brand, boxShadow: `0 10px 24px -12px ${tint(C.brand, .7)}` }}
            >
              <RotateCcw size={16} /> Rewind
            </button>
          </div>
        )}
        {visible
          .map((r, depth) => {
            const cafe = cafesById[r.item.cafeId];
            const top = depth === 0;
            // cards behind sit lower and smaller, and rise as the top card is dragged away
            const lift = top ? 0 : progress;
            const d = depth - lift;
            let transform = `translate3d(0, ${d * 14}px, 0) scale(${1 - d * 0.05})`;
            let transition = `transform .5s ${SPRING}, opacity .3s`;
            if (top) {
              if (leaving) {
                transform =
                  leaving > 0
                    ? `translate3d(520px, ${drag.y - 40}px, 0) rotate(22deg) scale(1.02)`
                    : `translate3d(-480px, ${drag.y + 10}px, 0) rotate(-18deg) scale(.96)`;
                transition = `transform .3s cubic-bezier(.4,0,.6,1), opacity .3s ease-in, filter .3s`;
              } else {
                transform = `translate3d(${drag.x}px, ${drag.y}px, 0) rotate(${drag.x / 18}deg)`;
                transition = drag.active ? "none" : `transform .55s ${SPRING}`;
              }
            }
            return (
              <div
                key={`${r.item.id}-${deal}`}
                className="absolute inset-0"
                style={{ zIndex: 10 - depth, touchAction: top ? "pan-y" : "auto", pointerEvents: top ? "auto" : "none" }}
                aria-hidden={!top}
              >
                <div className="a-cardup h-full" style={{ animationDelay: deal ? `${depth * 70}ms` : "0ms" }}>
                  <div key={top && !touched ? `hint-${hint}` : "still"} className={`h-full ${top && !touched && hint ? "a-wiggle" : ""}`}>
                  <div
                    className="relative h-full select-none"
                    style={{ transform, transition, opacity: depth > 2 ? 0 : top && leaving < 0 ? 0.55 : 1, filter: top && leaving < 0 ? "saturate(.4)" : "none", cursor: top ? (drag.active ? "grabbing" : "grab") : "default", willChange: "transform" }}
                    onPointerDown={top ? onPointerDown : undefined}
                    onPointerMove={top ? onPointerMove : undefined}
                    onPointerUp={top ? onPointerUp : undefined}
                    onPointerCancel={top ? onPointerUp : undefined}
                    onClickCapture={top ? onClickCapture : undefined}
                  >
                    <RecCard r={r} cafe={cafe} saved={saved} toggleSave={toggleSave} onOpenCafe={onOpenCafe} live={top} />
                    {top && (
                      // colour trails in from the edge the card is moving away from
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-3xl"
                        style={{
                          background:
                            (leaving || Math.sign(drag.x)) > 0
                              ? `linear-gradient(90deg, ${tint(C.matcha, 0.32 * (leaving > 0 ? 1 : progress))}, ${tint(C.matcha, 0)} 70%)`
                              : `linear-gradient(270deg, ${tint(C.taupe, 0.3 * (leaving < 0 ? 1 : progress))}, ${tint(C.taupe, 0)} 70%)`,
                          opacity: leaving || drag.x ? 1 : 0,
                          transition: drag.active ? "none" : "opacity .3s",
                        }}
                      />
                    )}
                  </div>
                  </div>
                </div>
              </div>
            );
          })
          .reverse()}
      </div>

      <div className="relative z-20 mt-6 flex items-center justify-center gap-5" style={{ opacity: left ? 1 : 0, transition: `opacity .3s ${EASE}`, pointerEvents: left ? "auto" : "none" }}>
        <button type="button" aria-label="Skip this match" onClick={() => dismiss(-1)} className="press flex h-12 w-12 items-center justify-center rounded-full bg-white soft" style={{ color: C.taupe }}>
          <span key={skipPop} className={`inline-flex ${skipPop ? "a-nope" : ""}`}>
            <X size={18} />
          </span>
        </button>
        <span className="tabular w-14 text-center text-sm" style={{ color: C.taupe }}>
          {Math.min(index + 1, recs.length)} / {recs.length}
        </span>
        <span className="relative">
          <button type="button" aria-label="Save to Want to Try" onClick={() => dismiss(1)} className="press relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-white" style={{ background: C.matcha, boxShadow: `0 6px 16px -10px ${tint(C.matcha, .7)}` }}>
            <span key={savedPop} className={`relative inline-flex ${savedPop ? "a-pop" : ""}`}>
              <Bookmark size={18} fill={justSaved ? "#fff" : "none"} style={{ transition: `fill .25s ${EASE}` }} />
            </span>
          </button>
        </span>
      </div>
    </div>
  );
}

/* ── Café taste matching ──────────────────────────────────────────────
 * Each café has a coffee profile (roast, fruit, chocolate/nut, milk focus,
 * aromatic/spiced), grounded in published roaster notes. Your profile is a
 * weighted blend of the cafés behind the cups you rated highly. */
const TASTE_KEYS = ["roast", "fruit", "choc", "milk", "aroma"];

function tasteMatch(a, b) {
  const d = Math.sqrt(TASTE_KEYS.reduce((s, k) => s + (a[k] - b[k]) ** 2, 0) / TASTE_KEYS.length);
  return clamp(Math.round(100 - d * 140), 40, 99);
}

// Pastries and food say nothing about coffee taste, so they don't count.
const isCoffeeRating = (h, itemsById) => {
  const it = itemsById[h.itemId];
  return !(it && it.styles.includes("Pastries"));
};

/** Your taste vector from your coffee ratings (only cups scored 3.5+ count as likes). */
function userTaste(history, cafesById, itemsById = {}) {
  let w = 0;
  const v = { roast: 0, fruit: 0, choc: 0, milk: 0, aroma: 0 };
  history.forEach((h) => {
    if (!isCoffeeRating(h, itemsById)) return;
    const c = cafesById[h.cafeId];
    const t = c && c.coffee && c.coffee.taste;
    const weight = h.rating - 3.5;
    if (!t || weight <= 0) return;
    TASTE_KEYS.forEach((k) => (v[k] += t[k] * weight));
    w += weight;
  });
  if (!w) return null;
  TASTE_KEYS.forEach((k) => (v[k] /= w));
  return v;
}

/** Short, human description of what two profiles share. */
function sharedTraits(a, b) {
  const out = [];
  if (a.roast < 0.35 && b.roast < 0.35) out.push("light roast");
  else if (a.roast > 0.65 && b.roast > 0.65) out.push("darker roast");
  if (a.fruit > 0.55 && b.fruit > 0.55) out.push("fruit-forward");
  if (a.choc > 0.6 && b.choc > 0.6) out.push("chocolatey, nutty cups");
  if (a.milk > 0.65 && b.milk > 0.65) out.push("great milk drinks");
  if (a.aroma > 0.6 && b.aroma > 0.6) out.push("aromatic, spiced lattes");
  return out;
}

/** Words for a taste profile, strongest first. */
function tasteWords(t) {
  if (!t) return [];
  const out = [];
  out.push(t.roast < 0.38 ? "light roast" : t.roast > 0.62 ? "darker roast" : "medium roast");
  if (t.fruit > 0.5) out.push("fruity & bright");
  if (t.choc > 0.55) out.push("chocolate & nut");
  if (t.milk > 0.6) out.push("milk drinks");
  if (t.aroma > 0.5) out.push("aromatic & spiced");
  return out;
}

// Only recommend genuinely close matches; how many depends on the drink.
const MATCH_MIN = 75;

function TasteMatch({ items, cafes, cafesById, sourceId, setSourceId, saved, toggleSave, onOpenCafe, onRate }) {
  const src = items.find((i) => i.id === sourceId) || items[0];
  const srcCafe = cafesById[src.cafeId];
  const recs = useMemo(
    () =>
      items
        .filter((i) => i.id !== src.id && i.cafeId !== src.cafeId && i.count > 0)
        .map((i) => ({ item: i, score: matchScore(src, i), why: reasonFor(src, i) }))
        .filter((r) => r.score >= MATCH_MIN)
        .sort((a, b) => b.score - a.score || b.item.rating - a.item.rating)
        .slice(0, 10),
    [items, src]
  );
  const short = (name) => name.replace(/ (Coffee|Espresso Bar|Espresso|Café)$/, "");

  return (
    <section className="relative" aria-labelledby="tm-title">
      <LargeTitle>
      <p className="mb-4 text-sm" style={{ color: C.sage }}>
        your taste match
      </p>
      </LargeTitle>
      <h1 id="tm-title" className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <span className="serif whitespace-nowrap text-4xl leading-tight md:text-5xl">If you love the</span>
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
                  .filter((i) => i.cafeId === c.id && i.count > 0)
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
        {recs.length === 0
          ? "nothing on the list tastes quite like it yet."
          : recs.length === 1
          ? "you'll probably love this one too."
          : `you'll probably love these ${recs.length} too.`}
      </p>

      {recs.length ? (
        <SwipeStack key={src.id} recs={recs} src={src} cafesById={cafesById} saved={saved} toggleSave={toggleSave} onOpenCafe={onOpenCafe} />
      ) : (
        <div key={src.id} className="a-fadeup mx-auto mt-8 flex max-w-md flex-col items-center rounded-3xl px-6 py-10 text-center" style={{ background: C.stone }}>
          <p className="serif text-3xl">a one-of-a-kind cup</p>
          <p className="mt-1 text-sm" style={{ color: C.taupe }}>
            found something similar? rate it and it'll show up here.
          </p>
          <button
            type="button"
            onClick={() => onRate && onRate()}
            className="press relative mt-5 flex items-center gap-2 overflow-hidden rounded-full py-2.5 pl-4 pr-5 text-sm font-medium text-white"
            style={{ background: C.brand, boxShadow: `0 10px 24px -12px ${tint(C.brand, .7)}` }}
          >
            <Plus size={16} /> Rate a drink
          </button>
        </div>
      )}
    </section>
  );
}

/* ───────────────────────────── Café art ───────────────────────────── */

const ART_PALETTES = [
  ["#EADFD2", "#D9C3AE"], // oat → latte
  ["#E3E8D8", "#C9D3B4"], // matcha milk
  ["#EFE3DC", "#DCC2B4"], // blush clay
  ["#E9E5DD", "#D3CCC0"], // stone
  ["#E6E1D3", "#CFC3A6"], // honey
];
const hashStr = (str) => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

/**
 * Illustrated cover for a café: an overhead cup with latte art on a soft,
 * café-specific backdrop. Pass `cafe.photo` (an image URL or data: URI) to
 * use a real photograph instead.
 */
const CafeArt = memo(function CafeArt({ cafe, className = "", rounded = "" }) {
  if (cafe.photo) {
    return <img src={cafe.photo} alt="" className={`h-full w-full object-cover ${rounded} ${className}`} loading="lazy" decoding="async" />;
  }
  const h = hashStr(cafe.id);
  const [c1, c2] = ART_PALETTES[h % ART_PALETTES.length];
  const top = cafe.items && cafe.items[0];
  const matcha = top && top.styles.includes("Matcha");
  const pastry = top && top.styles.includes("Pastries");
  const coffee = matcha ? "#9DB06A" : "#8A5A3B";
  const crema = matcha ? "#C9D69E" : "#B07A52";
  const art = h % 3; // 0 heart, 1 tulip, 2 rosetta
  const cx = 230 + (h % 5) * 18;
  const cy = 108 + ((h >> 3) % 3) * 6;
  const rot = ((h >> 5) % 40) - 20;
  const id = `art-${cafe.id}`;
  return (
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" className={`block h-full w-full ${rounded} ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <radialGradient id={`${id}-cup`} cx=".5" cy=".45" r=".55">
          <stop offset="0" stopColor={crema} />
          <stop offset="1" stopColor={coffee} />
        </radialGradient>
        <radialGradient id={`${id}-light`} cx=".2" cy=".1" r=".9">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".6" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="220" fill={`url(#${id}-bg)`} />
      {/* table grain */}
      <g stroke="#fff" strokeOpacity=".18" strokeWidth="1.2" fill="none">
        <path d={`M-10 ${40 + (h % 20)} C 120 ${20 + (h % 30)}, 260 ${70 - (h % 25)}, 420 ${45 + (h % 15)}`} />
        <path d={`M-10 ${170 + (h % 15)} C 140 ${150 + (h % 20)}, 280 ${200 - (h % 20)}, 420 ${175 + (h % 10)}`} />
      </g>
      {pastry && (
        <g transform={`translate(${cx - 150} ${cy + 20}) rotate(${-rot})`}>
          <ellipse cx="0" cy="8" rx="46" ry="12" fill="#000" opacity=".07" />
          <path d="M-42 0 C-30 -26 30 -26 42 0 C30 10 -30 10 -42 0Z" fill="#D9A46A" />
          <path d="M-26 -12 C-14 -4 -6 -4 4 -16 M6 -16 C14 -4 22 -4 30 -10" stroke="#B9844C" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )}
      <g transform={`translate(${cx} ${cy}) scale(.72) translate(${-cx} ${-cy}) rotate(${rot} ${cx} ${cy})`}>
        <ellipse cx={cx + 6} cy={cy + 12} rx="86" ry="80" fill="#000" opacity=".08" />
        <circle cx={cx} cy={cy} r="82" fill="#FBF9F5" />
        <circle cx={cx} cy={cy} r="82" fill="none" stroke="#000" strokeOpacity=".05" />
        {/* handle */}
        <rect x={cx + 52} y={cy - 9} width="40" height="18" rx="9" fill="#FBF9F5" />
        <circle cx={cx} cy={cy} r="56" fill="#fff" />
        <circle cx={cx} cy={cy} r="49" fill={`url(#${id}-cup)`} />
        <g fill="#F6EBDD" opacity=".95">
          {art === 0 && <path d={`M${cx} ${cy + 22} C ${cx - 34} ${cy} ${cx - 22} ${cy - 26} ${cx} ${cy - 10} C ${cx + 22} ${cy - 26} ${cx + 34} ${cy} ${cx} ${cy + 22}Z`} />}
          {art === 1 && (
            <>
              <path d={`M${cx - 20} ${cy - 18} C ${cx - 8} ${cy - 30} ${cx + 8} ${cy - 30} ${cx + 20} ${cy - 18} C ${cx + 8} ${cy - 22} ${cx - 8} ${cy - 22} ${cx - 20} ${cy - 18}Z`} />
              <path d={`M${cx - 24} ${cy - 2} C ${cx - 10} ${cy - 16} ${cx + 10} ${cy - 16} ${cx + 24} ${cy - 2} C ${cx + 10} ${cy - 7} ${cx - 10} ${cy - 7} ${cx - 24} ${cy - 2}Z`} />
              <path d={`M${cx} ${cy + 26} C ${cx - 26} ${cy + 14} ${cx - 22} ${cy - 2} ${cx} ${cy + 6} C ${cx + 22} ${cy - 2} ${cx + 26} ${cy + 14} ${cx} ${cy + 26}Z`} />
              <rect x={cx - 1.2} y={cy - 30} width="2.4" height="56" rx="1.2" />
            </>
          )}
          {art === 2 && (
            <>
              {[-24, -14, -4, 6, 16].map((dy, i) => (
                <path key={i} d={`M${cx - (20 - i * 2)} ${cy + dy} C ${cx - 6} ${cy + dy - 9} ${cx + 6} ${cy + dy - 9} ${cx + (20 - i * 2)} ${cy + dy} C ${cx + 6} ${cy + dy - 4} ${cx - 6} ${cy + dy - 4} ${cx - (20 - i * 2)} ${cy + dy}Z`} />
              ))}
              <path d={`M${cx} ${cy + 30} C ${cx - 14} ${cy + 22} ${cx - 12} ${cy + 12} ${cx} ${cy + 18} C ${cx + 12} ${cy + 12} ${cx + 14} ${cy + 22} ${cx} ${cy + 30}Z`} />
              <rect x={cx - 1} y={cy - 30} width="2" height="58" rx="1" />
            </>
          )}
        </g>
        {/* spoon */}
        <g transform={`rotate(${30 + (h % 30)} ${cx} ${cy})`}>
          <rect x={cx - 3} y={cy + 60} width="6" height="54" rx="3" fill="#E7E2DA" />
          <ellipse cx={cx} cy={cy + 62} rx="8" ry="11" fill="#EEE9E1" />
        </g>
      </g>
      <rect width="400" height="220" fill={`url(#${id}-light)`} />
    </svg>
  );
});

/* ───────────────────────────── Filters & café cards ───────────────────────────── */

function Filters({ area, setArea, drink, setDrink, compact = false, glass = false, areas = AREAS }) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <Segmented label="Filter by neighbourhood" options={areas} value={area} onChange={setArea} size={compact ? "sm" : "md"} scroll glass={glass} />
      <Segmented label="Filter by drink style" options={DRINKS} value={drink} onChange={setDrink} size={compact ? "sm" : "md"} scroll glass={glass} />
    </div>
  );
}

function PromoTag({ promo }) {
  if (!promo) return null;
  const sponsored = promo.type === "sponsored";
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium"
      style={sponsored ? { background: C.stone, color: C.taupe } : { background: C.brand, color: "#fff" }}
    >
      {!sponsored && <span className="a-dot h-1.5 w-1.5 rounded-full bg-white" />}
      {sponsored ? "sponsored" : promo.label}
    </span>
  );
}

// The pinned surface for a promoted item: latte wash with an olive hairline.
const promoRowStyle = {
  get background() {
    return `linear-gradient(100deg, ${tint(C.latte, 0.2)}, ${tint(C.matcha, 0.1)})`;
  },
  get boxShadow() {
    return `inset 0 0 0 1px ${tint(C.brand, 0.22)}`;
  },
};

function OpenDot({ status }) {
  if (!status) return null;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap" style={{ color: status.open ? C.matcha : C.taupe }}>
      <span className={`h-1.5 w-1.5 rounded-full ${status.open ? "a-dot" : ""}`} style={{ background: status.open ? C.matcha : C.line }} />
      {status.label}
    </span>
  );
}

function CafeCard({ cafe, drink, saved, toggleSave, onOpen, onHover, index, status, distance }) {
  const shown = useMemo(() => {
    const list = [...cafe.items];
    if (drink !== "All Drinks") list.sort((a, b) => !!b.promo - !!a.promo || b.styles.includes(drink) - a.styles.includes(drink));
    return list.slice(0, 2);
  }, [cafe.items, drink]);
  return (
    <div className="a-fadeup" style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
      <article
        data-morph
        className="lift flex h-full flex-col rounded-3xl bg-white p-5 soft md:p-6"
        onMouseEnter={() => onHover && onHover(cafe.id)}
        onMouseLeave={() => onHover && onHover(null)}
      >
        <button type="button" onClick={(e) => onOpen(cafe.id, e.currentTarget.closest("[data-morph]"))} className="w-full text-left" aria-label={`Open ${cafe.name}`}>
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
          {(status || distance != null) && (
            <p className="mt-1.5 flex items-center gap-3 text-xs">
              {distance != null && (
                <span className="tabular flex items-center gap-1" style={{ color: C.ink }}>
                  <Footprints size={12} aria-hidden="true" /> {walkMins(distance)} min
                </span>
              )}
              <OpenDot status={status} />
            </p>
          )}
        </button>
        <ul className="mt-4 space-y-1">
          {shown.map((it) => {
            const dim = drink !== "All Drinks" && !it.styles.includes(drink);
            return (
              <li key={it.id} className="tr flex items-center gap-2 rounded-2xl pl-3" style={{ ...(it.promo ? promoRowStyle : { background: C.bg }), opacity: dim && !it.promo ? 0.45 : 1 }}>
                <button type="button" onClick={(e) => onOpen(cafe.id, e.currentTarget.closest("[data-morph]"))} className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left text-sm">
                  <span className="truncate">{it.name}</span>
                  {it.pick && <span aria-label="Samia's Pick" style={{ color: C.clay }}>✦</span>}
                  {it.promo && <PromoTag promo={it.promo} />}
                </button>
                <span className="tabular text-sm" style={{ color: C.taupe }}>{isNewItem(it) ? "new" : f1(it.rating)}</span>
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
      <button type="button" onClick={onReset} className="press mt-4 rounded-full px-4 py-2 text-sm font-medium text-white" style={{ background: C.brand }}>
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
  ["Wood Lane", -275, 386],
  ["White City", -279, 404],
  ["Shepherd's Bush", -117, 532],
  ["Baker St", 263, 215],
  ["Victoria", 362, 674],
  ["South Kensington", 130, 716],
];

const TUBE_LINES = [
  { c: C.mapLine, d: "M-300 380 L-279 404 L-117 532 L-53 455 L120 402 L256 385 L328 367 L388 350 L472 332 L560 308 L628 297 L739 357 L811 380 L862 301 L1060 250" },
  { c: C.mapLine, d: "M400 -60 L412 180 L442 254 L472 332 L496 415 L522 472 L540 500 L560 780" },
  { c: C.mapLine, d: "M800 -60 L820 166 L811 287 L811 380 L828 521 L771 593 L760 780" },
  { c: C.mapLine, d: "M420 -60 L412 180 L388 350 L378 528 L362 780" },
  { c: C.mapLine, d: "M-60 600 L304 566 L378 528 L448 437 L496 415 L526 385 L560 308 L526 210 L528 74 L540 -60" },
  { c: C.mapLine, d: "M-60 690 L362 674 L448 621 L544 598 L540 500 L608 430 L688 452 L768 399 L830 422 L907 439 L1060 420" },
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
  ["WHITE CITY", -268, 340],
  ["SHEPHERD'S BUSH", -110, 600],
];

const MapBase = memo(function MapBase({ v }) {
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute left-0 top-0" style={{ overflow: "visible" }} aria-hidden="true">
      <rect x={-800} y={-800} width={W + 1600} height={H + 1600} fill={C.land} />
      {/* parks */}
      <g fill={C.park} stroke="#E2E7D6" strokeWidth="1">
        <path d="M-120 400 Q-110 380 0 388 L120 392 L290 380 Q306 382 305 402 L300 560 Q296 582 270 580 L40 590 Q-100 596 -120 570 Z" />
        <ellipse cx="290" cy="80" rx="86" ry="112" />
        <path d="M352 492 L424 480 L432 538 L502 548 L500 594 L420 598 L350 576 Z" />
        <rect x="498" y="222" width="30" height="26" rx="6" />
        <rect x="572" y="320" width="28" height="24" rx="6" />
      </g>
      <g fill={C.matcha} opacity=".6" fontSize="13" fontStyle="italic" fontWeight="500" textAnchor="middle">
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
      <text fontSize="11" letterSpacing="3" fill={C.taupe} fontWeight="500">
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
            <circle cx={x} cy={y} r="4" fill="#fff" stroke={C.mapLine} strokeWidth="1.5" />
            <text x={x + 7} y={y + 3.5} fontSize="9" fill={C.taupe}>
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

function LondonMap({ cafes, visibleIds, selectedId, onSelect, hoveredId, onOpen, overlay, focusTopRatio = 0.42, rounded = true, here = null }) {
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

  // pannable area: the central map plus wherever cafés sit outside it (e.g. White City)
  const ext = useMemo(() => {
    const xs = cafes.filter((c) => c.x != null).map((c) => c.x);
    const ys = cafes.filter((c) => c.y != null).map((c) => c.y);
    return {
      x0: Math.min(0, ...xs.map((x) => x - 120)),
      x1: Math.max(W, ...xs.map((x) => x + 120)),
      y0: Math.min(0, ...ys.map((y) => y - 120)),
      y1: Math.max(H, ...ys.map((y) => y + 120)),
    };
  }, [cafes]);

  const clampView = useCallback(
    (v) => {
      const k = clamp(v.k, minK, maxK);
      const m = 140 * k;
      const fit = (lo, hi, val) => (lo > hi ? (lo + hi) / 2 : clamp(val, lo, hi));
      return { k, x: fit(size.w - ext.x1 * k - m, -ext.x0 * k + m, v.x), y: fit(size.h - ext.y1 * k - m, -ext.y0 * k + m, v.y) };
    },
    [size.w, size.h, minK, maxK, ext]
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
            <MapBase v={THEME_VERSION} />
            {here && (
              <div className="pointer-events-none absolute" style={{ left: here.x, top: here.y, zIndex: 9, transform: `scale(${1 / k})`, transformOrigin: "0 0", transition: anim ? `transform .7s ${EASE}` : "none" }}>
                <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full" style={{ background: C.brand, boxShadow: `0 0 0 3px #fff, 0 4px 12px ${tint(C.ink, .3)}` }} />
                <span className="a-pulse absolute -left-2 -top-2 h-4 w-4 rounded-full" style={{ boxShadow: `0 0 0 3px ${C.brand}` }} />
              </div>
            )}
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
                      {c.drop && vis && (
                        <span aria-label="Live drop" className="absolute -right-1 -top-1 z-10 h-3 w-3 rounded-full" style={{ background: C.brand, boxShadow: "0 0 0 2px #fff" }} />
                      )}
                      {c.pick && vis && !isSel && (
                        <span aria-hidden="true" className="a-pulse absolute inset-x-0 top-0 h-8 rounded-full" style={{ boxShadow: `0 0 0 2px ${C.clay}` }} />
                      )}
                      <span
                        className="tabular relative flex h-8 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-sm font-medium"
                        style={{
                          background: isSel ? C.brand : "#fff",
                          color: isSel ? "#fff" : C.ink,
                          boxShadow: `0 0 0 ${c.pick ? 2 : 1}px ${c.pick ? C.clay : isSel || isHov ? C.brand : C.line}, 0 6px 16px -6px ${tint(C.ink, .35)}`,
                          transition: `background-color .35s ${EASE}, color .35s ${EASE}, box-shadow .35s ${EASE}`,
                        }}
                      >
                        {f1(c.avg)}
                        <Star size={11} strokeWidth={0} fill={isSel ? "#fff" : C.brand} aria-hidden="true" />
                      </span>
                      <span
                        aria-hidden="true"
                        className="-mt-1 h-2.5 w-2.5 rotate-45"
                        style={{ background: isSel ? C.brand : "#fff", boxShadow: c.pick ? `1.5px 1.5px 0 0.5px ${C.clay}` : `1px 1px 0 0 ${C.line}` }}
                      />
                      <span
                        className="pointer-events-none absolute top-full mt-1 whitespace-nowrap rounded-md px-1.5 text-xs font-medium"
                        style={{
                          color: C.ink,
                          background: "rgba(255,255,255,.9)",
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

      <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col overflow-hidden rounded-2xl glass-white hair" style={{ boxShadow: `0 8px 24px -14px ${tint(C.ink, .35)}` }}>
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
    <div data-morph className="rounded-3xl bg-white p-4 hair" style={{ boxShadow: `0 20px 50px -24px ${tint(C.ink, .45)}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
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
        <div className="mt-3 flex items-center justify-between rounded-2xl px-3 py-2.5" style={{ background: C.stone }}>
          <div className="min-w-0">
            <p className="text-xs" style={{ color: C.taupe }}>
              Top-rated here
            </p>
            <p className="truncate text-sm font-medium">{top.name}</p>
          </div>
          <ScoreChip value={top.rating} />
        </div>
      )}
      <button type="button" onClick={(e) => onOpen(cafe.id, e.currentTarget.closest("[data-morph]"))} className="press mt-3 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium text-white" style={{ background: C.brand }}>
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
        data-morph
        className={`tr flex items-center gap-3 rounded-3xl p-3 ${selected ? "bg-white soft" : ""}`}
        style={{ background: selected ? "#fff" : "transparent" }}
        onMouseEnter={() => onHover(cafe.id)}
        onMouseLeave={() => onHover(null)}
      >
        <button type="button" onClick={() => onSelect(cafe.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Show ${cafe.name} on map`}>
          <span className="tabular flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full text-sm font-light" style={{ background: selected ? C.brand : "#fff", color: selected ? "#fff" : C.ink }}>
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
        <button type="button" onClick={(e) => onOpen(cafe.id, e.currentTarget.closest("[data-morph]"))} aria-label={`Open ${cafe.name} details`} className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ color: C.taupe }}>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────────── Leaderboard ───────────────────────────── */

const ROW_H = 80;

// Podium styling for the top three, using the design-system colours only.
const podium = () => [
  { bg: C.brand, fg: "#fff", tint: tint(C.brand, 0.07), label: "1st" },
  { bg: C.matcha, fg: "#fff", tint: tint(C.matcha, 0.08), label: "2nd" },
  { bg: C.latte, fg: "#fff", tint: tint(C.latte, 0.1), label: "3rd" },
];

/** Rank marker: glossy medal for the podium, plain numeral after that. */
function Medal({ place }) {
  if (place > 2) {
    return (
      <span className="tabular relative w-9 shrink-0 text-center text-xl font-light" style={{ color: C.taupe }}>
        {place + 1}
      </span>
    );
  }
  const m = podium()[place];
  return (
    <span
      aria-label={`${m.label} place`}
      className="tabular relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-medium"
      style={{ background: m.bg, color: m.fg, boxShadow: `0 6px 14px -6px ${m.bg}` }}
    >
      <Gloss />
      <span className="relative">{place + 1}</span>
    </span>
  );
}

function Leaderboard({ cafes, items, cafesById, onOpenCafe, saved, toggleSave, flash }) {
  const [tab, setTab] = useState("cafes");
  const rankedCafes = useMemo(() => [...cafes].filter((c) => c.items.length).sort((a, b) => b.avg - a.avg || b.total - a.total), [cafes]);
  const rankedItems = useMemo(() => items.filter((i) => i.count > 0 && promoLive(i)).sort((a, b) => b.rating - a.rating || b.count - a.count), [items]);
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
        title={<span className="serif whitespace-nowrap text-3xl md:text-4xl">the leaderboard</span>}
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
              data-morph
              className="absolute inset-x-0 top-0 flex items-center gap-4 px-5 md:px-6"
              style={{ height: ROW_H, transform: `translate3d(0, ${i * ROW_H}px, 0)`, transition: `transform .8s ${EASE}` }}
            >
              {flashing && <span key={flash.t} aria-hidden="true" className="a-flash pointer-events-none absolute inset-0" style={{ background: C.latteSoft }} />}
              {i < 3 && <span aria-hidden="true" className="pointer-events-none absolute inset-y-1.5 inset-x-2 rounded-2xl" style={{ background: podium()[i].tint }} />}
              {i === 0 && <span aria-hidden="true" className="a-shine pointer-events-none absolute inset-y-1.5 inset-x-2 overflow-hidden rounded-2xl" />}
              <Medal place={i} />
              <button type="button" onClick={(e) => onOpenCafe(cafe.id, e.currentTarget.closest("[data-morph]"))} className="relative min-w-0 flex-1 text-left">
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

function Profile({ history, saved, items, cafesById, toggleSave, onOpenCafe, onRate, taste }) {
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
        <LargeTitle>
          <p className="text-sm" style={{ color: C.sage }}>
            your cup log
          </p>
          <h1 className="serif mt-1 whitespace-nowrap text-4xl md:text-5xl">sip, rate, repeat.</h1>
          {taste && (
            <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm" style={{ color: C.taupe }}>
              your taste:
              {tasteWords(taste).map((w) => (
                <Tag key={w} tone="sage">
                  {w}
                </Tag>
              ))}
            </p>
          )}
        </LargeTitle>
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
                <button type="button" data-morph onClick={(e) => cafesById[h.cafeId] && onOpenCafe(h.cafeId, e.currentTarget)} className="lift flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left soft">
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
              <button type="button" onClick={onRate} className="press mt-3 rounded-full px-4 py-2 text-sm font-medium text-white" style={{ background: C.brand }}>
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
                  <div data-morph className="lift flex items-center gap-3 rounded-3xl bg-white p-4 soft">
                    <button type="button" onClick={(e) => onOpenCafe(cafe.id, e.currentTarget.closest("[data-morph]"))} className="flex min-w-0 flex-1 items-center gap-3 text-left">
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

function CoffeeProfile({ coffee }) {
  if (!coffee) return null;
  const roastLabel = { light: "light roast", medium: "medium roast", "medium-dark": "medium–dark roast", dark: "dark roast" };
  return (
    <div className="mt-6 rounded-3xl p-4" style={{ background: C.bg }}>
      <p className="text-sm" style={{ color: C.taupe }}>
        the coffee
      </p>
      <p className="mt-1 font-medium">{coffee.roaster || "Roaster not published"}</p>
      {coffee.espresso && (
        <p className="text-sm" style={{ color: C.taupe }}>
          {coffee.espresso}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Tag tone={coffee.roast ? "sage" : "stone"}>{coffee.roast ? roastLabel[coffee.roast] : "roast not published"}</Tag>
        {coffee.notes.map((n) => (
          <Tag key={n}>{n}</Tag>
        ))}
      </div>
      {(coffee.notesFrom || coffee.asOf) && (
        <p className="mt-2 text-xs" style={{ color: C.taupe }}>
          {[coffee.notesFrom && `notes from ${coffee.notesFrom}`, coffee.asOf].filter(Boolean).join(" · ")}
        </p>
      )}
      {coffee.sources && coffee.sources.length > 0 && (
        <p className="mt-2 text-xs" style={{ color: C.taupe }}>
          sources:{" "}
          {coffee.sources.map((src, i) => (
            <span key={src.url}>
              {i > 0 && ", "}
              <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline">
                {src.label}
              </a>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function CafeDetail({ cafe, rank, saved, toggleSave, onRate, onShowMap, status, onOpenStory, similar = [], onOpenCafe }) {
  return (
    <div>
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
      {status && (
        <p className="mt-2 text-sm">
          <OpenDot status={status} />
        </p>
      )}
      {cafe.blurb && <p className="mt-4 text-sm leading-relaxed">{cafe.blurb}</p>}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {cafe.vibes.map((v) => (
          <Tag key={v}>{v.toLowerCase()}</Tag>
        ))}
      </div>

      <CoffeeProfile coffee={cafe.coffee} />

      <h3 className="mb-2 mt-7 text-sm" style={{ color: C.taupe }}>
        Menu &amp; Ratings
      </h3>
      <ul className="space-y-2">
        {cafe.items.map((it, i) =>
          it.promo ? (
            <li key={it.id} className="a-fadeup rounded-3xl p-4" style={{ ...promoRowStyle, animationDelay: `${120 + i * 60}ms` }}>
              <div className="flex items-center gap-2">
                <PromoTag promo={it.promo} />
                <span className="text-xs" style={{ color: C.taupe }}>
                  {it.promo.endsAt ? timeLeft(it.promo.endsAt - Date.now()) : ""}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="serif text-2xl leading-tight">{it.name.toLowerCase()}</p>
                  <p className="mt-0.5 truncate text-xs" style={{ color: C.taupe }}>
                    {it.promo.partner ? `${it.promo.partner} · ` : ""}
                    {it.flavours.slice(0, 2).join(", ").toLowerCase()}
                  </p>
                </div>
                <span className="tabular text-sm" style={{ color: C.taupe }}>
                  {isNewItem(it) ? "new" : f2(it.rating)}
                </span>
                <BookmarkButton saved={saved.has(it.id)} onToggle={() => toggleSave(it.id)} />
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => onRate(cafe.id, it.name)} className="press rounded-full px-3.5 py-1.5 text-xs font-medium text-white" style={{ background: C.brand }}>
                  {isNewItem(it) ? "be the first to rate" : "rate it"}
                </button>
                {it.promo.journalId && onOpenStory && (
                  <button type="button" onClick={() => onOpenStory(it.promo.journalId)} className="press rounded-full bg-white px-3.5 py-1.5 text-xs font-medium" style={{ color: C.ink }}>
                    read the story
                  </button>
                )}
              </div>
            </li>
          ) : (
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
          )
        )}
        {cafe.items.length === 0 && (
          <li className="rounded-2xl p-4 text-sm hair" style={{ color: C.taupe }}>
            No items rated yet.
          </li>
        )}
      </ul>
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={() => onRate(cafe.id)} className="press flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-medium text-white" style={{ background: C.brand }}>
          <Plus size={16} /> Rate an item here
        </button>
        {cafe.x != null && (
          <button type="button" onClick={() => onShowMap(cafe.id)} className="press flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium" style={{ background: C.stone }}>
            <MapIcon size={16} /> Map
          </button>
        )}
      </div>
      {similar.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-2 text-sm" style={{ color: C.taupe }}>
            {similar[0].score >= 70 ? "cafés like this" : "closest in taste"}
          </h3>
          {similar[0].score < 70 && (
            <p className="-mt-1 mb-2 text-xs" style={{ color: C.taupe }}>
              Nothing else on the list tastes quite like {cafe.name} yet. These are the nearest.
            </p>
          )}
          <ul className="space-y-2">
            {similar.map((m) => (
              <li key={m.cafe.id}>
                <button type="button" onClick={() => onOpenCafe && onOpenCafe(m.cafe.id)} className="press flex w-full items-center gap-3 rounded-2xl p-3 text-left" style={{ background: C.bg }}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{m.cafe.name}</span>
                    <span className="block truncate text-xs" style={{ color: C.taupe }}>
                      {m.traits.length ? m.traits.slice(0, 2).join(" · ") : m.cafe.areas[0].toLowerCase()}
                    </span>
                  </span>
                  <span className="tabular rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: C.matchaSoft, color: C.matcha }}>
                    {m.score}%
                  </span>
                  <ArrowRight size={15} style={{ color: C.taupe }} />
                </button>
              </li>
            ))}
          </ul>
        </div>
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

/** Height-animated reveal (no layout jump): grid rows 0fr → 1fr. */
function Collapse({ open, children }) {
  return (
    <div
      aria-hidden={!open}
      style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0, transition: `grid-template-rows .5s ${EASE}, opacity .4s ${EASE}` }}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

/** iOS-style grouped section: small caption above a white rounded card. */
function FormSection({ title, aside, children }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h3 className="text-sm" style={{ color: C.taupe }}>
          {title}
        </h3>
        {aside}
      </div>
      <div className="rounded-3xl bg-white p-3 soft">{children}</div>
    </section>
  );
}

function Chip({ on, onClick, children, className = "", small = false }) {
  const [pop, setPop] = useState(0);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        setPop((p) => p + 1);
        onClick();
      }}
      className={`press flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full ${small ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-sm"} ${className}`}
      style={{ background: on ? C.brand : C.stone, color: on ? "#fff" : C.ink }}
    >
      <span
        aria-hidden="true"
        className="inline-flex overflow-hidden"
        style={{ width: on ? 14 : 0, opacity: on ? 1 : 0, transition: `width .35s ${EASE}, opacity .25s` }}
      >
        <Check size={14} strokeWidth={2.4} />
      </span>
      <span key={on ? pop : "off"} className={on && pop ? "a-pop inline-block" : "inline-block"}>
        {children}
      </span>
    </button>
  );
}

function RateForm({ cafes, items, initialCafeId, initialItem = "", onSubmit, onCancel, areas = AREAS }) {
  const [selCafe, setSelCafe] = useState(initialCafeId || cafes[0].id);
  const [adding, setAdding] = useState(false);
  const [newCafe, setNewCafe] = useState({ name: "", area: "", station: "" });
  const [itemName, setItemName] = useState(initialItem);
  const [rating, setRating] = useState(4.5);
  const [notes, setNotes] = useState([]);
  const [starPop, setStarPop] = useState({ n: 0, k: 0 });
  const nameRef = useRef(null);
  const cafeId = adding ? "new" : selCafe;
  const cafeItems = adding ? [] : items.filter((i) => i.cafeId === selCafe);
  const valid = itemName.trim().length > 1 && (!adding || (newCafe.name.trim().length > 1 && newCafe.area.trim().length > 1));
  const pct = ((rating - 1) / 4) * 100;
  const toggleNote = (n) => setNotes((ns) => (ns.includes(n) ? ns.filter((x) => x !== n) : [...ns, n]));
  const inputCls = "w-full rounded-2xl px-4 py-3 text-base outline-none tr";
  const inputStyle = { background: C.stone };

  useEffect(() => {
    if (adding && nameRef.current) {
      const t = setTimeout(() => nameRef.current && nameRef.current.focus({ preventScroll: true }), 320);
      return () => clearTimeout(t);
    }
  }, [adding]);

  const submit = (e) => {
    e && e.preventDefault();
    if (valid) onSubmit({ cafeId, newCafe, itemName, rating: Math.round(rating * 10) / 10, notes });
  };

  return (
    <form onSubmit={submit} noValidate>
      {/* iOS navigation bar: always visible, doubles as the drag handle */}
      <div data-sheet-handle className="sticky top-0 z-20" style={{ background: C.bg, boxShadow: `0 1px 0 ${C.line}`, touchAction: "none" }}>
        <div className="flex justify-center pt-2 md:hidden">
          <span className="h-1 w-9 rounded-full" style={{ background: `${tint(C.ink, .18)}` }} />
        </div>
        <div className="relative flex items-center justify-between px-4 pb-3 pt-2 md:pt-4">
          <button type="button" onClick={onCancel} className="press -ml-1 rounded-full px-2 py-1 text-base" style={{ color: C.brand }}>
            Cancel
          </button>
          <p className="pointer-events-none absolute inset-x-0 text-center text-base font-medium">New Rating</p>
          <button
            type="submit"
            disabled={!valid}
            className="press relative -mr-1 rounded-full px-3 py-1 text-base font-semibold"
            style={{ color: valid ? "#fff" : C.taupe, background: valid ? C.brand : "transparent", transition: `background-color .35s ${EASE}, color .35s ${EASE}` }}
          >
            Save
          </button>
        </div>
      </div>

      <div className="space-y-6 px-4 pb-8 pt-2 md:px-6">
        <FormSection title="café">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1" style={{ opacity: adding ? 0.35 : 1, transition: `opacity .35s ${EASE}` }}>
              <Segmented
                label="Choose a café"
                variant="ink"
                size="sm"
                scroll
                value={selCafe}
                onChange={(v) => {
                  setSelCafe(v);
                  setAdding(false);
                  setItemName("");
                }}
                options={cafes.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>
            <button
              type="button"
              aria-label={adding ? "Cancel adding a café" : "Add a new café"}
              aria-pressed={adding}
              onClick={() => {
                setAdding((a) => !a);
                setItemName("");
              }}
              className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: adding ? C.brand : C.stone, color: adding ? "#fff" : C.brand, transition: `background-color .35s ${EASE}, color .35s ${EASE}` }}
            >
              <Plus size={18} strokeWidth={2.2} style={{ transform: adding ? "rotate(135deg)" : "none", transition: `transform .5s ${SPRING}` }} />
            </button>
          </div>
          <Collapse open={adding}>
            <div className="grid gap-2 pt-3 sm:grid-cols-2">
              <input
                ref={nameRef}
                id="rate-new-cafe"
                className={inputCls}
                style={inputStyle}
                placeholder="New café name"
                aria-label="New café name"
                value={newCafe.name}
                tabIndex={adding ? 0 : -1}
                onChange={(e) => setNewCafe((n) => ({ ...n, name: e.target.value }))}
              />
              {/* any area: existing ones are suggested, new ones become filters */}
              <input
                id="rate-new-area"
                list="rate-area-list"
                className={inputCls}
                style={inputStyle}
                placeholder="Area, e.g. White City"
                aria-label="Neighbourhood (type any area)"
                value={newCafe.area}
                tabIndex={adding ? 0 : -1}
                onChange={(e) => setNewCafe((n) => ({ ...n, area: e.target.value }))}
              />
              <datalist id="rate-area-list">
                {areas.slice(1).map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
              <div className="relative sm:col-span-2">
                <select
                  id="rate-new-station"
                  aria-label="Nearest Tube station"
                  className={`${inputCls} appearance-none pr-10`}
                  style={{ ...inputStyle, color: newCafe.station ? C.ink : C.taupe }}
                  value={newCafe.station}
                  tabIndex={adding ? 0 : -1}
                  onChange={(e) => setNewCafe((n) => ({ ...n, station: e.target.value }))}
                >
                  <option value="">Nearest Tube station (optional)</option>
                  {[...TUBE_STATIONS].sort((x, y) => x[0].localeCompare(y[0])).map(([n]) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
              </div>
            </div>
          </Collapse>
        </FormSection>

        <FormSection title="what you had">
          <Collapse open={cafeItems.length > 0}>
            {/* one swipeable row: never wraps, so nothing below jumps */}
            <div key={selCafe} className="no-scrollbar -mx-3 mb-2 flex gap-2 overflow-x-auto px-3 a-fade">
              {cafeItems.map((it) => {
                const on = itemName.toLowerCase() === it.name.toLowerCase();
                return (
                  <Chip key={it.id} on={on} onClick={() => setItemName(on ? "" : it.name)}>
                    {it.name}
                  </Chip>
                );
              })}
            </div>
          </Collapse>
          <input
            id="rate-item"
            className={inputCls}
            style={inputStyle}
            placeholder={cafeItems.length ? "or type something else" : "e.g. Oat Flat White"}
            aria-label="Menu item name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
        </FormSection>

        <section>
          <h3 className="mb-2 px-1 text-sm" style={{ color: C.taupe }}>
            your rating
          </h3>
          {/* Big popping number, word, large stars and slider, in the same white card as the other sections */}
          <div className="rounded-3xl bg-white p-5 soft">
            <div className="flex items-end justify-between">
              <div>
                <span key={f1(rating)} className="a-pop tabular inline-block text-6xl font-light leading-none tracking-tight">
                  {f1(rating)}
                </span>
                <span className="ml-1 text-sm" style={{ color: C.taupe }}>
                  / 5.0
                </span>
              </div>
              <span key={ratingWord(rating)} className="a-fade pb-1 text-base" style={{ color: C.taupe }}>
                {ratingWord(rating)}
              </span>
            </div>
            <div className="mt-5 flex gap-2" role="group" aria-label="Tap a star">
              {[1, 2, 3, 4, 5].map((n) => {
                const fill = clamp(rating - (n - 1), 0, 1);
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => {
                      setRating(n);
                      setStarPop((p) => ({ n, k: p.k + 1 }));
                    }}
                    className="press relative h-10 w-10"
                  >
                    <span key={starPop.n === n ? starPop.k : 0} className={`absolute inset-0 ${starPop.n === n && starPop.k ? "a-pop" : ""}`}>
                      <Star size={34} strokeWidth={1.2} color={C.line} fill={C.stone} className="absolute inset-0 m-auto" />
                      <span className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - fill * 100}% 0 0)`, transition: `clip-path .45s ${EASE}` }}>
                        <Star size={34} strokeWidth={1.2} color={C.brand} fill={C.brand} className="absolute inset-0 m-auto" />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <input
              id="rate-slider"
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={rating}
              aria-label="Rating from 1.0 to 5.0"
              onChange={(e) => setRating(parseFloat(e.target.value))}
              className="sp-range mt-6 w-full"
              style={{ background: `linear-gradient(to right, ${C.brand} ${pct}%, ${C.stone} ${pct}%)` }}
            />
            <div className="tabular mt-2 flex justify-between text-xs" style={{ color: C.taupe }}>
              <span>1.0</span>
              <span>3.0</span>
              <span>5.0</span>
            </div>
          </div>
        </section>

        <FormSection title="tasting notes" aside={notes.length ? <span className="a-fade text-sm" style={{ color: C.taupe }}>{notes.length} selected</span> : null}>
          <div className="flex flex-wrap gap-2">
            {NOTE_CHIPS.map((n) => (
              <Chip key={n} on={notes.includes(n)} onClick={() => toggleNote(n)}>
                {n.toLowerCase()}
              </Chip>
            ))}
          </div>
        </FormSection>
      </div>
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
              <span key={savedCount} className="a-pop tabular absolute -right-0.5 -top-0.5 flex h-5 items-center justify-center rounded-full px-1 text-xs font-medium text-white" style={{ background: C.brand, minWidth: 20 }}>
                {savedCount}
              </span>
            )}
          </button>
          <button type="button" onClick={() => onRate()} className="press flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-white" style={{ background: C.brand }}>
            <Plus size={16} /> Rate
          </button>
        </div>
      </div>
    </header>
  );
}

/** Glossy highlight in the style of the logo's bubble letters: a curved
 *  shine along the top-left edge and a small glint lower down. */
function Gloss() {
  return (
    <svg aria-hidden="true" viewBox="0 0 56 56" className="pointer-events-none absolute inset-0 h-full w-full">
      <path d="M8.6 23.5 C9.8 15.8 15.8 9.8 23.5 8.6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".85" />
      <path d="M8.4 29.2 L8.4 29.4" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".85" />
    </svg>
  );
}

function BottomNav({ tab, setTab, onRate }) {
  const slots = [TABS[0], TABS[1], null, TABS[2], TABS[3]];
  const idx = slots.findIndex((s) => s && s.value === tab);
  return (
    <nav aria-label="Primary" className="glass fixed inset-x-0 bottom-0 z-40 border-t md:hidden" style={{ borderColor: C.line, paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="relative grid h-14 grid-cols-5">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 left-0 flex w-1/5 justify-center"
          style={{ transform: `translate3d(${idx * 100}%,0,0)`, opacity: idx < 0 ? 0 : 1, transition: `transform .55s ${EASE}, opacity .3s` }}
        >
          <span className="h-1 w-1 rounded-full" style={{ background: C.brand }} />
        </span>
        {slots.map((s, i) =>
          s ? (
            // icon-only tabs: the name lives in aria-label; the active tab turns olive with a soft fill
            <button
              key={s.value}
              type="button"
              onClick={() => setTab(s.value)}
              aria-label={s.label === "Leaderboard" ? "Ranks" : s.label}
              aria-current={tab === s.value ? "page" : undefined}
              className="tab-btn relative flex items-center justify-center"
              style={{ color: tab === s.value ? C.brand : C.taupe, transition: `color .35s ${EASE}` }}
            >
              <span aria-hidden="true" className="tab-halo absolute h-11 w-11 rounded-full" style={{ background: C.stone }} />
              <span className="tab-icon relative inline-flex">
                <s.icon
                  size={24}
                  strokeWidth={tab === s.value ? 1.8 : 1.4}
                  fill={tab === s.value ? `${tint(C.brand, .12)}` : "none"}
                  style={{ transition: `stroke-width .3s ${EASE}` }}
                />
              </span>
            </button>
          ) : (
            <div key="rate" className="flex items-center justify-center">
              <button type="button" onClick={() => onRate()} aria-label="Rate an item" className="press relative -mt-7 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-white" style={{ background: C.brand, boxShadow: `0 10px 24px -10px ${tint(C.ink, .6)}, 0 0 0 4px ${C.bg}` }}>
                <Gloss />
                <Plus size={24} strokeWidth={2.2} className="relative" />
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
      <div key={toast.t} className="a-toast flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-white" style={{ background: C.brand, boxShadow: `0 18px 40px -16px ${tint(C.ink, .55)}` }}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,.12)" }}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path className="a-draw" d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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

/* ───────────────────────────── Sort & "near me" ───────────────────────────── */

/* ───────────────────────────── For you ───────────────────────────── */

function ForYouRow({ picks, onOpen, onRate }) {
  return (
    <section aria-labelledby="foryou-title">
      <div className="mb-4">
        <p className="mb-1 text-sm" style={{ color: C.sage }}>
          based on what you've loved
        </p>
        <h2 id="foryou-title" className="serif whitespace-nowrap text-3xl md:text-4xl">
          picked for your taste
        </h2>
      </div>
      {picks.length === 0 ? (
        <div className="rounded-3xl p-5 text-sm" style={{ background: C.stone, color: C.taupe }}>
          Rate a few cups you love and we'll learn your taste: roast, fruit, chocolate, milk.{" "}
          <button type="button" onClick={onRate} className="font-medium underline" style={{ color: C.brand }}>
            Rate a drink
          </button>
        </div>
      ) : (
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0" style={{ scrollPaddingLeft: 16 }}>
          {picks.map((p, i) => (
            <div key={p.cafe.id} className="a-fadeup shrink-0 snap-start" style={{ animationDelay: `${i * 60}ms` }}>
              <button
                type="button"
                data-morph
                onClick={(e) => onOpen(p.cafe.id, e.currentTarget)}
                className="lift flex h-full w-64 flex-col rounded-3xl bg-white p-4 text-left soft"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.cafe.name}</span>
                    <span className="block truncate text-xs" style={{ color: C.taupe }}>
                      {p.cafe.areas[0].toLowerCase()} · {p.cafe.coffee.roaster ? p.cafe.coffee.roaster.split(" (")[0].split(" +")[0].toLowerCase() : "roaster not published"}
                    </span>
                  </span>
                  <span className="tabular shrink-0 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: C.matchaSoft, color: C.matcha }}>
                    {p.score}%
                  </span>
                </span>
                <span className="mt-3 block text-sm leading-relaxed" style={{ color: C.taupe }}>
                  {p.reason}
                </span>
                {p.cafe.coffee.notes.length > 0 && (
                  <span className="mt-3 flex flex-wrap gap-1.5">
                    {p.cafe.coffee.notes.slice(0, 3).map((n) => (
                      <Tag key={n}>{n}</Tag>
                    ))}
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ───────────────────────────── The journal ───────────────────────────── */

const H_MS = 3600000;
// Sample editorial content. Drops carry an end time and disappear once it passes.
const JOURNAL = [
  {
    id: "j-drop-cardamom",
    kind: "drop",
    title: "the iced cardamom latte",
    dek: "WatchHouse × sam'spresso. Cardamom-bun flavours, poured over ice. This weekend only.",
    tone: ["#EFE3D6", "#D9BFA6"],
    publishedAt: Date.now() - 20 * H_MS,
    endsAt: DROP_ENDS,
    read: 2,
    body: [
      { p: "We asked WatchHouse to bottle the thing everyone queues for: the cardamom bun. The answer is a spiced oat latte, shaken cold, with a cinnamon-sugar rim." },
      { p: "It's on at Bermondsey and Soho until Sunday close, or until they run out of the syrup, which last time took about four hours." },
      { cafe: "watchhouse", item: "wh-iced-cardamom", note: "Order it with an extra shot if you like it less sweet." },
    ],
  },
  {
    id: "j-edit-iced",
    kind: "edit",
    title: "the post-reformer iced edit",
    dek: "Five cold, clean, oat-friendly cups for after class.",
    tone: ["#E5EBDC", "#C9D3B4"],
    publishedAt: Date.now() - 2 * 24 * H_MS,
    read: 3,
    body: [
      { p: "Class done, cheeks pink, and you want something cold that doesn't taste like a milkshake. These are the ones we keep coming back to." },
      { cafe: "hagen", item: "hg-iced", note: "Creamy, barely sweet, and right by South Ken station." },
      { cafe: "commonbreads", item: "cb-iced", note: "The cult one. Samia's pick for a reason." },
      { cafe: "storestreet", item: "ss-iced", note: "Mellow and big. Good for a slow walk through Bloomsbury." },
      { cafe: "watchhouse", item: "wh-matcha", note: "Grassy, creamy, refreshing. The only matcha on the list." },
      { cafe: "kaffeine", item: "ka-cold", note: "No milk, all chocolate. For the purists." },
    ],
  },
  {
    id: "j-spot-rosslyn",
    kind: "spotlight",
    title: "the tiny counter at the top",
    dek: "How a standing-room spot by Bank became London's best-rated café.",
    tone: ["#E9E5DD", "#D3CCC0"],
    publishedAt: Date.now() - 4 * 24 * H_MS,
    read: 4,
    body: [
      { p: "There are no tables at Rosslyn. There's a counter, a window and a queue of people in good coats who know exactly what they want." },
      { p: "What they want is milk. The cortado is dense and chocolatey; the flat white is the smoothest in the Square Mile. Both sit at the top of our leaderboard." },
      { cafe: "rosslyn", item: "ro-cort", note: "Start here. Two sips in, you'll get it." },
    ],
  },
  {
    id: "j-edit-grey",
    kind: "edit",
    title: "where to work when it's grey out",
    dek: "Bright rooms, good Wi-Fi, no side-eye for staying a while.",
    tone: ["#EAE4DA", "#D6C9B6"],
    publishedAt: Date.now() - 6 * 24 * H_MS,
    read: 3,
    body: [
      { p: "Some days the laptop has to leave the flat. These are the places that make that feel like a treat." },
      { cafe: "prufrock", note: "Huge windows, long benches and a batch brew that keeps coming." },
      { cafe: "origin", note: "Roastery energy. Get the V60 and stay for the afternoon." },
      { cafe: "storestreet", note: "That skylight. Go before 10 for a table." },
    ],
  },
  {
    id: "j-news-areas",
    kind: "news",
    title: "new on the map",
    dek: "Marylebone, Victoria and South Ken are in. Three new cafés to rate.",
    tone: ["#E8EDE3", "#D3DCC6"],
    publishedAt: Date.now() - 9 * 24 * H_MS,
    read: 1,
    body: [
      { p: "We've stretched the map west and south. Say hello to three new spots, and tell us what we should add next." },
      { cafe: "monocle" },
      { cafe: "hagen" },
      { cafe: "commonbreads" },
    ],
  },
];

const KIND_LABEL = { drop: "drop", edit: "samia's edit", spotlight: "spotlight", news: "new" };

function timeLeft(ms) {
  const h = Math.max(0, Math.round(ms / H_MS));
  if (h < 1) return "ends soon";
  if (h < 24) return `ends in ${h}h`;
  const d = Math.round(h / 24);
  return `ends in ${d} day${d === 1 ? "" : "s"}`;
}

/** Live drops (by café id), for badges elsewhere in the app. */
const liveDrops = (now) => {
  const m = {};
  JOURNAL.forEach((j) => {
    if (j.kind === "drop" && j.endsAt > now) j.body.forEach((b) => b.cafe && (m[b.cafe] = j));
  });
  return m;
};

function KindTag({ kind, light = false }) {
  const drop = kind === "drop";
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
      style={drop ? { background: C.brand, color: "#fff" } : { background: light ? "rgba(255,255,255,.7)" : C.stone, color: C.ink }}
    >
      {drop && <span className="a-dot h-1.5 w-1.5 rounded-full bg-white" />}
      {KIND_LABEL[kind]}
    </span>
  );
}

/** "the journal": one row of tall editorial cards on Discover. */
function JournalRow({ entries, readIds, onOpen }) {
  // "this scrolls sideways" hint: glide right to reveal the next card, then back
  const rowRef = useRef(null);
  const [peeked, setPeeked] = useState(false);
  const [moved, setMoved] = useState(false);
  useInView(
    rowRef,
    () => {
      const el = rowRef.current;
      if (!el || peeked || moved || el.scrollLeft > 24 || el.scrollWidth <= el.clientWidth) return;
      const from = el.scrollLeft;
      setPeeked(true);
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;
      // snap points would cancel the nudge, so lift them for the moment
      el.style.scrollSnapType = "none";
      setTimeout(() => el.scrollTo({ left: from + 72, behavior: "smooth" }), 500);
      setTimeout(() => el.scrollTo({ left: from, behavior: "smooth" }), 1250);
      setTimeout(() => (el.style.scrollSnapType = ""), 1900);
    },
    peeked || moved
  );
  if (!entries.length) return null;
  return (
    <section aria-labelledby="journal-title">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="mb-1 text-sm" style={{ color: C.taupe }}>
            from samia
          </p>
          <h2 id="journal-title" className="serif whitespace-nowrap text-3xl md:text-4xl">
            the journal
          </h2>
        </div>
        <p className="tabular pb-1 text-sm" style={{ color: C.taupe }}>
          {entries.length} stories
        </p>
      </div>
      <div
        ref={rowRef}
        onPointerDown={() => setMoved(true)}
        onWheel={() => setMoved(true)}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0"
        style={{ scrollPaddingLeft: 16 }}
      >
        {entries.map((j, i) => {
          const unread = !readIds.has(j.id);
          return (
            <div key={j.id} className="a-fadeup shrink-0 snap-start" style={{ animationDelay: `${i * 60}ms` }}>
              <button
                type="button"
                data-morph
                onClick={(e) => onOpen(j.id, e.currentTarget)}
                className="lift relative flex h-72 w-56 flex-col justify-between overflow-hidden rounded-3xl p-4 text-left soft md:w-60"
                style={{ background: `linear-gradient(160deg, ${j.tone[0]}, ${j.tone[1]})` }}
                aria-label={`${KIND_LABEL[j.kind]}: ${j.title}${unread ? ", new" : ""}`}
              >
                <span className="flex items-start justify-between gap-2">
                  <KindTag kind={j.kind} light />
                  {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: C.brand, boxShadow: "0 0 0 3px rgba(255,255,255,.7)" }} aria-hidden="true" />}
                </span>
                <span>
                  <span className="serif block text-3xl leading-none" style={{ color: C.ink }}>
                    {j.title}
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed" style={{ color: `${tint(C.ink, .7)}` }}>
                    {j.kind === "drop" ? timeLeft(j.endsAt - Date.now()) : `${j.read} min read`}
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Full article in a sheet; café blocks are live, tappable and saveable. */
function JournalArticle({ entry, cafesById, items, saved, toggleSave, onOpenCafe }) {
  const itemsById = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);
  return (
    <article>
      <div
        data-sheet-handle
        className="relative flex h-64 flex-col justify-end px-5 pb-4 md:h-72 md:px-8"
        style={{
          // runs under the grabber to the sheet's edge, then melts into the page
          background: `linear-gradient(180deg, ${entry.tone[0]} 0%, ${entry.tone[1]} 58%, #fff 100%)`,
        }}
      >
        <div className="flex items-center gap-2">
          <KindTag kind={entry.kind} light />
          <span className="text-xs" style={{ color: `${tint(C.ink, .7)}` }}>
            {entry.kind === "drop" ? timeLeft(entry.endsAt - Date.now()) : timeAgo(entry.publishedAt).toLowerCase()}
          </span>
        </div>
        <h2 className="serif mt-2 text-4xl leading-none md:text-5xl">{entry.title}</h2>
      </div>
      <div className="px-5 pb-8 pt-5 md:px-8">
        <p className="text-base leading-relaxed">{entry.dek}</p>
        <p className="mt-2 text-xs" style={{ color: C.taupe }}>
          samia · {entry.read} min read
        </p>
        <div className="mt-6 space-y-4">
          {entry.body.map((b, i) => {
            if (b.p) {
              return (
                <p key={i} className="a-fadeup text-sm leading-relaxed" style={{ color: C.ink, animationDelay: `${100 + i * 50}ms` }}>
                  {b.p}
                </p>
              );
            }
            const cafe = cafesById[b.cafe];
            if (!cafe) return null;
            const it = b.item ? itemsById[b.item] : cafe.items[0];
            return (
              <div key={i} className="a-fadeup rounded-3xl p-4" style={{ background: C.bg, animationDelay: `${100 + i * 50}ms` }}>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => onOpenCafe(cafe.id)} className="min-w-0 flex-1 text-left">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium">{cafe.name}</span>
                      {cafe.pick && <span style={{ color: C.latte }} aria-label="Samia's Pick">✦</span>}
                    </span>
                    <span className="block truncate text-xs" style={{ color: C.taupe }}>
                      {cafe.areas[0].toLowerCase()}
                      {it ? ` · ${it.name.toLowerCase()} ${isNewItem(it) ? "· new" : f1(it.rating)}` : ""}
                    </span>
                  </button>
                  {it && <BookmarkButton saved={saved.has(it.id)} onToggle={() => toggleSave(it.id)} />}
                  <button type="button" onClick={() => onOpenCafe(cafe.id)} aria-label={`Open ${cafe.name}`} className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white" style={{ color: C.taupe }}>
                    <ArrowRight size={15} />
                  </button>
                </div>
                {b.note && (
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: C.taupe }}>
                    {b.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

/* ───────────────────────────── Theme playground ───────────────────────────── */

const DISPLAY_FONTS = ["Instrument Serif", "Playfair Display", "Cormorant Garamond", "DM Serif Display", "Fraunces", "EB Garamond", "Bodoni Moda", "Italiana", "Libre Caslon Display"];
const BODY_FONTS = ["Manrope", "Inter", "DM Sans", "Outfit", "Plus Jakarta Sans", "Work Sans", "Karla", "Nunito Sans", "Figtree"];
const isDesignMode = () => {
  try {
    return /(^|[?&])design(=|&|$)/.test(window.location.search.slice(1)) || window.location.hash === "#design";
  } catch (_) {
    return false;
  }
};

function FontPicker({ label, value, options, onChange }) {
  const custom = !options.includes(value);
  return (
    <div>
      <p className="mb-1 text-xs" style={{ color: C.taupe }}>
        {label}
      </p>
      <div className="relative">
        <select
          aria-label={label}
          value={custom ? "__custom" : value}
          onChange={(e) => onChange(e.target.value === "__custom" ? "" : e.target.value)}
          className="w-full appearance-none rounded-2xl px-4 py-2.5 pr-10 text-base"
          style={{ background: C.stone, fontFamily: `"${value}"` }}
        >
          {options.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
          <option value="__custom">Other Google Font…</option>
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
      </div>
      {custom && (
        <input
          aria-label={`${label}: Google Font name`}
          placeholder="Exact Google Fonts name, e.g. Lora"
          defaultValue={value}
          onBlur={(e) => e.target.value.trim() && onChange(e.target.value.trim())}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="mt-2 w-full rounded-2xl px-4 py-2.5 text-base"
          style={{ background: C.stone }}
        />
      )}
    </div>
  );
}

/** Live theme editor for designers: change colours, fonts and corners, then copy theme.json. */
function DesignPanel({ theme, published, onChange, onReset }) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const json = JSON.stringify(theme, null, 2);
  const changed = JSON.stringify(theme) !== JSON.stringify(published);
  const set = (path, val) => {
    const t = JSON.parse(JSON.stringify(theme));
    if (path[0] === "colors") t.colors[path[1]] = val;
    else if (path[0] === "fonts") t.fonts[path[1]] = val;
    else t[path[0]] = val;
    onChange(t);
  };
  const copy = () => {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    };
    try {
      navigator.clipboard.writeText(json).then(done, () => setShowJson(true));
    } catch (_) {
      setShowJson(true);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press fixed left-4 z-[60] flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium soft md:bottom-6"
        style={{ bottom: "calc(76px + env(safe-area-inset-bottom))", color: C.ink }}
      >
        <Palette size={16} /> theme
      </button>
    );
  }
  return (
    <aside
      aria-label="Theme playground"
      className="a-cardup fixed inset-x-0 bottom-0 z-[60] flex flex-col rounded-t-3xl bg-white md:inset-x-auto md:bottom-4 md:right-4 md:top-20 md:w-96 md:rounded-3xl"
      style={{ maxHeight: "56vh", boxShadow: `0 -12px 40px -16px ${tint(C.ink, 0.35)}`, paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <div>
          <p className="serif text-2xl leading-none">theme playground</p>
          <p className="mt-1 text-xs" style={{ color: C.taupe }}>
            {changed ? "Previewing on this device only" : "Matches the published theme"}
          </p>
        </div>
        <button type="button" aria-label="Minimise playground" onClick={() => setOpen(false)} className="press flex h-9 w-9 items-center justify-center rounded-full" style={{ background: C.stone }}>
          <ChevronUp size={17} style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>
      <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-5 pb-4 md:max-h-none">
        <section>
          <p className="mb-2 text-sm font-medium">Colours</p>
          <div className="space-y-2">
            {COLOR_ROLES.map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label={label}
                  value={theme.colors[key]}
                  onChange={(e) => set(["colors", key], e.target.value.toUpperCase())}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-full border-0 p-0"
                  style={{ background: "none" }}
                />
                <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
                <input
                  aria-label={`${label} hex`}
                  key={theme.colors[key]}
                  defaultValue={theme.colors[key]}
                  onBlur={(e) => HEX.test(e.target.value.trim()) && set(["colors", key], e.target.value.trim().toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  className="tabular w-24 rounded-xl px-2 py-1.5 text-center text-sm uppercase"
                  style={{ background: C.stone }}
                />
              </div>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <p className="text-sm font-medium">Fonts</p>
          <FontPicker label="Headings (display)" value={theme.fonts.display} options={DISPLAY_FONTS} onChange={(v) => v && set(["fonts", "display"], v)} />
          <label className="flex items-center justify-between text-sm">
            <span>Italic headings</span>
            <input type="checkbox" checked={theme.fonts.displayItalic} onChange={(e) => set(["fonts", "displayItalic"], e.target.checked)} className="h-5 w-5" style={{ accentColor: C.brand }} />
          </label>
          <FontPicker label="Body text" value={theme.fonts.body} options={BODY_FONTS} onChange={(v) => v && set(["fonts", "body"], v)} />
        </section>
        <section>
          <p className="mb-2 flex justify-between text-sm font-medium">
            Corner roundness <span className="tabular" style={{ color: C.taupe }}>{theme.corners}px</span>
          </p>
          <input
            type="range"
            min="4"
            max="36"
            step="1"
            value={theme.corners}
            aria-label="Corner roundness"
            onChange={(e) => set(["corners"], parseInt(e.target.value, 10))}
            className="sp-range w-full"
            style={{ background: `linear-gradient(to right, ${C.brand} ${((theme.corners - 4) / 32) * 100}%, ${C.stone} ${((theme.corners - 4) / 32) * 100}%)` }}
          />
        </section>
        {showJson && (
          <textarea readOnly value={json} rows={8} onFocus={(e) => e.target.select()} className="w-full rounded-2xl p-3 font-mono text-xs" style={{ background: C.stone }} aria-label="Theme JSON" />
        )}
      </div>
      <div className="flex gap-2 border-t px-5 py-3" style={{ borderColor: C.line }}>
        <button type="button" onClick={copy} className="press flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium text-white" style={{ background: C.brand }}>
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy theme"}
        </button>
        <button type="button" onClick={() => setShowJson((v) => !v)} className="press rounded-full px-4 py-2.5 text-sm font-medium" style={{ background: C.stone }}>
          {showJson ? "Hide" : "Show"} code
        </button>
        <button type="button" onClick={onReset} disabled={!changed} className="press rounded-full px-4 py-2.5 text-sm font-medium" style={{ background: C.stone, opacity: changed ? 1 : 0.4 }}>
          Reset
        </button>
      </div>
    </aside>
  );
}

/* ───────────────────────────── App icon ───────────────────────────── */

// iOS-style app icon: the logo's "s" in white on deep olive (assets/app-icon.svg).
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A6608"/><stop offset="1" stop-color="#3E5700"/></linearGradient></defs><rect width="1024" height="1024" rx="229" fill="url(#g)"/><g transform="translate(215.9 -9.4) scale(3.6105)"><path d="M52.1 227.4C18.2 222.5 2.0 210.2 2.0 189.4C2.0 168.6 20.1 160.0 45.0 169.1C48.0 170.2 50.9 171.5 51.5 171.9C54.1 173.9 73.0 181.1 77.1 181.6C81.4 182.2 81.9 182.0 83.5 179.7C84.8 177.7 84.9 176.7 84.0 175.0C82.6 172.4 81.6 172.0 62.3 167.0C35.8 160.0 21.2 152.8 11.6 141.8C4.3 133.4 1.6 121.9 3.9 108.4C5.6 98.5 8.9 92.1 15.9 85.1C29.7 71.3 53.7 65.0 87.0 66.3C131.8 68.2 157.8 84.4 155.8 109.4C154.9 119.9 149.4 126.7 139.1 129.7C134.3 131.1 132.3 131.1 125.4 130.1C118.1 129.1 113.8 127.7 93.5 119.4C86.7 116.6 81.8 116.1 79.5 118.0C77.6 119.6 77.5 123.4 79.5 125.0C80.3 125.6 88.9 128.2 98.7 130.6C126.1 137.4 138.0 142.8 148.1 153.0C162.4 167.6 162.3 191.9 147.8 207.6C138.9 217.3 124.9 223.9 106.7 227.1C93.6 229.4 66.7 229.5 52.1 227.4Z" fill="#FFFFFF"/><path d="M10.0 194.5C9.2 193.5 8.9 191.2 9.2 188.0C10.2 178.0 18.4 172.1 29.8 173.3C35.7 173.9 39.5 176.6 38.4 179.5C37.6 181.6 35.4 182.0 30.3 181.1C21.8 179.5 18.4 182.0 16.4 191.5C15.4 195.9 12.4 197.4 10.0 194.5ZM12.0 116.1C10.8 113.7 12.1 105.9 15.1 99.0C20.7 85.9 40.8 75.1 59.7 75.0C65.3 75.0 66.5 75.9 65.6 79.3C65.1 81.2 63.8 81.7 54.4 83.2C43.0 85.1 34.0 88.6 28.3 93.4C24.4 96.6 20.3 104.8 19.4 111.0C19.0 113.5 18.3 116.1 17.7 116.8C16.3 118.6 13.2 118.3 12.0 116.1Z" fill="#3E5700"/></g></svg>`;
const APPLE_TOUCH_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAIAAACyr5FlAAAQAElEQVR4nOxdCVgURxaunhnuSwQFEblBRG5QWTzwwHigRo1J1PXIqom6Oc26m9WYOzHHRmNiNG5Wc2iyMUajxivqiogHIiignIIgpygCw3Aqymx1V3dPMRzBxOnuman/m+/x9z+j9Lx6vKp61V2tmPS0GUVRoAPUajXRjVxXdPoJCKITXaZW0z/U7A/EcUt049UVKFDYeGE5boluvLoMxQgeL4QTjjg95oCMjxfCCee5jBmd8vFCOOEazmUOgOKFcMI1nMscgI0Xwgnnudw3wgTmEjpSmB6HcMJ5LqMZzCT0MSCccJyzmQPFC7HE4lYG1Go+kxBOOM4VNGEiBWYSwgnHuYwmfLwQTjjGucxBLLEdLFqVZeOFcMJxzqzKqplIYaofLAdqohOdyRxMxRSwHQ0bO0QnOqxzKNguBjBrcYQTznEZGzsAiyPCCWe43DdcwRwyUUMHDeGEAy5z0CHCRApSCSec4wo6UtSaeCGccJ4z13PwKsA40Y1eV9BjEC6fAGYVH71HdKLTq7IUTZHVxA7RiU5NXGIGCAg6A7qeQxMvhBPOcwUzcVGzPQ3hhGNchhgfL4QTznOUOeiAwVSeE92odeZeWXbASqnRexpOdKPW6bUVmjFzGYqxDAcYJ7qR6jI1ihfmGOOA6ERXoKvRmWhRc5yLJqIbt47250DVU4rjjCW60esKZnBKx4uauX6QcMJ5LmMGpxRTV6cIJxzn1MTFpvQ4hAEapxJOOIICTXEZy8RLO2sIurmZlZ21o52No7WVfW87Z1trB2tLOzMzK3NTS1MTC3MzaM3NTC1lMjn0y/22+3UNt2uVlarG6qaWhpY7jU3NKmgbmpS1dTdvVBUann+60RVAUxxTayxQ66kOW9rDNdDTNdDNZZCXa7C3W6iNlT14eKhvrK2pu3Gzuri4PLv0Rl7JjRxImu806LvfOtWpCYtM+eIp0MQR4DOK9PVetn2CB8YE+g0P9B0BI0NGyYCwKKvMy8o/R78KzpXfLNB3f/I6NWGxqZ52jN5uIWOj5kSFTunv5Askg6qa0rOX9ielHcjITdAvf3bkdObgYkcTR7iVmg7zxLg/zRs/fL5H/8FAwoDDlLMX9yWm7r6YeVzK/uxGZ4JDT+Dq7Dc77pXY6HlArwCHKSeTdx6M/zccoAC9giZzcALT63BcIrqfR/i8aWuGBk+mKAp0jcqq4qz8pOz88wXFGaqGGjjRaGiqa2isRe96uA5etfxrf+8hQCSkZh7bc3RDWvYJ+kCSftbSpZ454Fzj+fmbRg15rJvPnE8/En9u54WMo3C2CbrFmKgn3nzpRyAqcgsvrP/6mZIKPcgiCnZ2y4YLWn2hIQV91JBZz877FFYpOj31y7lnjiZuT0jezeeG34SlhQ0QG/5eQ798J/3XxK+2/rQKjkuk7H86cyDWESLq5qYWKxdvGxnZecKAMfHT4Q3519PAg8DNxf/1F37w9QgF0oBSdWvDt8vPpx+UoP+RTj3yF5POamRiWkf7/u+8tM9rQEjH8/52zzt7j236ze6Dh4WZdVTY5JCAmKCBw33cQ4D0EJ/030++WXa3tUVqrQCtJnNIxHq5Bq59+bC9nZOWEy9mnli/dXlZZX73vnbvH+DnGe7rGebrEebS18u5jzuQPK5ev7h6fRyc1EinFVgrqcwB++MP/34Urobgvqurv73h6+fhkLMr57o4eY8eNmtE5KMwJmD5HOghKquKVn44rqqmTFqZ4xE4W+HGIDTE4y59vTe+nmRt2Qv3Wn5R2qp/TYNeAx3Q18EtdsTcMVGPw1QB9B+FpVdeWjvqzp1GKbQFOyaVSOaA66Ub1px2cnDH/RV/7se1mxe03rsL2gN2GbOnrBwT/aRcJgcGhOSMw298NkM6mUPuHa7Al1/E4hteTXR18sM9tfPAxx9vXdrWdh8XB3pFrnl2x9K5H3i5BQm/wKZruDr7wsltbmGKuG3Bc+6ON/r6MArlE54Lpj/zxIce/QNxN527dPCL7/+OK6YmFkvnfrjlveTwwLHAcLH48ffhKoHA/u9Kl3uHocyMxqdAeO7rHrZy8VbcQbD4vXLthPtt93jFvf+gTW+diY6YQnVbPjcAwI7S2dHj5Hl+9C1auzCZgyb8/AVQGBdGf27+Z1oOevXj6XDezx869/HY8Fq8i5MXMA4MC5kMkwfNRG0X+IMJDjWKF/pYreFC6EODJ8HpK+6aHXvXVlZd5w9hb7Lu1eO9ezkDY8KsiSvoH+K1C+LcUxNooE+wXBh9zpR/4k5Rqqp27H0XVxY98Zarsw8wMgwLiRO3XRCXMYSNFArjAuiwcw3w+RPA8N2+9+/cbeYP4ZR1ztR2w1IjAZzYe7mFiNUuPGefmiCKHT9ivpZT4IoafvjSos+BsWKwb7RY7cJb9Cx7tSg2Omwa7o6E87tVDdX8IZyhBPpFA2MFrHmI1S68RZkDYPEiELe3dfYaEIy749iZ7/DDJ+P+BowYzo6eQIx2wbkCK3uoNRyoda37eUZoueNSZjzP4VJ73NjFwIjRy7aPKO2C6zI1VjDVcAB0rbv188d9kVuY2txSzx8adhm0J5DLFKK0C65zmQNTheFwnR33RdbVJPwwJCAGGDeY1S8R2gXn/LPskSocR30qj5LyXPzQ3cUfGDeU9VWitAvOFQBoIlRI7uTojvviVnUpfug5IBAYN8orC0RpF5zT5XMmUtRsVUwo7mjfH/dFY7OK5w72Lk6ObsC4kV+cJkq74BxmDi5emDeE4fD3m5la4L7o01sTK9HhU4BxA+b2pLRfhG8XLa5gByHcTj8ArdEx56c73dzUUssdT89eC1dfv9u31t7OadakF4EYyC44n1d0obGpzt7OeWTkTFtrByASLlw+Ut9QI3y7aOnU+KdMAPdeB+hKt7Gy3/N5J7cXFJVmeQ4Q5/boVR9Pvph1HD/PAJ+o6PBHJ458Svgo+cdHj6TnJAjfLlo6emoCNsltZ3Wl13dxj5pYkZGYwtwL3/48s/OTtu5aNes553c3z03PPgmEAgwLOjLEaBctXYEKYyiTYBzoWoerr1rDDhFxvTy7m/OHoQNffR0GTB27bNKoRTpNJC13mz7etgT/7QK3C67L1Fi8YBzoWq+tqwSSQf++3r95/nCyvXXX6lnP93tv89ysgiSgG7z12axbt4uB7v3fE525hpQdgwDs+lKd87CAcezFcBIAXALMvHq2sqqoJ+dfXJFz9PQ3py/ulVFUv75eDyv/NTQp3/h0JrPTi9Bt0RWXe4XIKKHug8Ctp2tgoN8IIBmMHz5/SPBEeG5NLfWqhprfPP/aupvJl4/8eOhfeYUpCrnJH9xm6FLWiVXr4gqK00Vpi64sM1tBYxDAFdYF4VFhU99+8WcgSTQ218HWOpOy92Tyzh5+L3vbvpNjlkQExj5oxMNf9MOB9zNyEwX2f084FbtQIUpUmptZ/bKlp/tqiIWmZlXKlWOZ+Wey88/nF1/qyfcyNTEPHxwb6BvtOSDIpa9XV5vZ1TfWJKUd3HP008LSy5LKFu0zx0L0LHsmatgZrkB83er4IL+RQH9w5erprKvnMnJPXck7fbe1pYff18ct1MrSDv9/4GC85EaeKD5/II5lDoD2RReOj42avWrZDqCfyC5IgmPYS9knLmWeENhvgnE+cwDhLSWTf7/umtYKnN4BltuT0g6cStmdeuXovfv3RPGkjiw3W2EyCTOFEY5D1DVUD494FOgz4CDDyy0YZsGZE150dfKBf3Pllfmi+POhc7pbAVykIAjMN7+dAntlYEBobFadZ3JJymWYS1pF9O0f5HydA1U/AMcBxnWrw7XQCSMXyuUKYCgwNTGDVbUxUbNnPPK8k4N7Td2tGmWFYP58iLrcKxTdSw3EskrVreLy7NHDngAGBxglfp4RcaOXxAx9XA3a8opSRfTz77B05gBcvPBDEYF5SUUurDsNCZoADBR2Nn2GhUyGq/9wubHgeppYfn5QzmQO7lhjQQdFx3pOQTKsHIQPHgcMF7DaERUaNy567u3aMvj3IIqfH0jXZA7RLawvtbXdDw0YAwwaNla9YR8a6Dc851oyrJNKwfNdWS5zIFBAXA4rjyU3cqNCpxjS+LRTwOXcuDFPl1bkFd/IkY7/tbjcM4QuoiMVVdTF5dfLss6nH4oOn2ZpLv4+5TqFXCaPGTqLomSwHk8fS8P/OJd7h2h2a+R3RxeXw9Xwo6e/GdBvIHwBQ0eI/yi3fv6nU+gFaon4n+ds5sCeOSsJDkf1Ccm7btWUhAWMNVHozeOCfh88XAeHDIo5nfpz6707kmoLNnMwKhs10uHXijNOJu9ytHdx7x8ADBrOjh5wInMyaWdr6x3p+F/uGdw+c/BWrZaC3tikPHXhp5TLv3q7h8AoAYYLezsnP8/IE+e+l47/5d6hcu49gH0OYP9SfL2qtuJIwrb84jR7m779+noCAwWcwsBpWnp2gkT8z2UOCVx39JsWrnYeO7MjPukH+BXc+g8yUZgBg0PQwJF5hSkVNwuk4HNq3AIFX/hA8cKAVSSrm5lajhr6GFyxC/GPAYaFppb6eX/zUTXUiO5nuReTOQAWL6CDlaB+v+0eHK4eP7Pj18Rv4LqMg72LiLe2PlzAjAgrxWlZ8aL7mckc/GItoPSXew4IjBkyC5aVDKA60tzSMHuFR2OjUlzftsscem3rVFXp2Sd/OfEFLCjV1VdZmFk76O3sBpZ21G330R2zInqVyxyop2FU9gRZLo5uYmLu7xlp38vJ1qo37C9gTaxWdau6tkJZf1upulnXUN2T/8fO2gGW4YeGTIwIHK93xfiWO42PPet8526LiO1CjZsvZ48xi/oh4XVYyYgb80zY4DGBvsO7dVxTZv7ZjJyEtOyTudcu9OT/Dxk0OnjgyNBBo2EtEugJVq+beiHjiIjtwgQHDUrcRUDnPh7zp78GZx/gAVFVU3b24v7TqXsz6A0tevS74AQnOmLaiIjpWvuSSQ17j32+6bsVIrYLmznQfQpYhmG5MHpUWNyqZdutLGzBHwCMEjhz2X/iCyX91Nke/V4f95Ag/1EB3sMiAmMlONkpq7y68B8BIrYLnzlEw/zpaxbOfBM8JNxtbTkY/+Wuw+tu15Y/0D+E1afHJrwwInIGkBLmrvC6VV0CRAI1dp6cDhpUQ6V7HUF57PA//3Ppt52eWV7hxYycxPLKApgSGprqoOLk6ObjETo0eEJPNgD6+ejG7Xvfqm9SPtD5TItd/sKCjUAyeG3DzKRLB4RvF8TpzIGyCYKQ3Mc9bMs7KVruUKqqdh/57NDJbTXKG6ALjBwy48W/bMQ3IOwUsFpwKGHrvuOfV1Zd7/m5fbImIUgye0Os/2rp4YRtQNh24TlcW+HvWwEdrG71d1/ep7XQejRxxysfTE69cgy2K+gaJRW58JMTYhZYmFt38zFYLQjwiZo54YVB3sNgzbGoNKsn52lpYT00eCKQBnKvpVzJOy1wu/C6jMkhXCbRtjrUu91GwwAABu5JREFU4V//QM9I3BH7j29Zu3lBQ5OyJ16DZa70rATQMwwJnvDqX7/ft6XqufmferkFdX+efRwktD8u/ewEYdsF1xVdxI7O7ZNxK3EvXMqMX79tec+9Zmpi8aBPKbexsp8+/ln4ul6WlZR2EJYQLued0Torh14u08YuA5KBlWUvev4gUhspAHas4QDoVLexdoCpnndBU3P92s0LtfzSr4/nU7PemBjD6hU3C4vKsopKM+lrpWSyUUNmuPbzBb8LHq6D4WvO1Fcgz8g9VVCcnnMtuUZ508bSfsHM18zNLIFkoGqoFrJdtHQFN8VVd9ED6UQfEjQed8HB+K1wSoIr08f/dcXiTbji4uQFX8MjpoKHClgQk/Kiv7LuVhd/2UK0F5s5AD2HARwHGNeJ7u81DHcBnJvgh3B9VSsyjBa3lRVCtouWTu9gTDETF4rp3IThcJyFuwAOAvDDedNXAwIGtUzmEKWNKP55KwBgcaR7bm3Vi//+18uycXfApfbY4XMAAYPi8mwh20WLywBAkcII9ABEw3Wn48sodfW3cXdEBrcbjhgzYDmnqgY9o0igdtHS+cyBamLcgJXhutPxx07fbb0DMAz2a/eMamPG+fTDAreLls7tfQ60rU71ljuNgINDL2eAITIwFhAwSM44InC7aOl07RxoqukarlP9dm0F7wJYsuRvaAsNGO3rGQYImGvQ07PjBW4XLR1lDkqNTWUQ16lOb12CYeObiZNHL4oKi3t7xW5AwGD/8c3Ct4uWrkCRwsYLxnWqXy26iDvCzsbhlWXbAAGHu60tPx35RPh20bJ45hDOZuUnoUs0CDrFwfj/KFVVwreLlpXxtVI0hxGMn03dCwi6wM6DH4rVLjhHz7Ln40U4/uvp7YCgM2zf+061slKsdsE5lzkAihfh+OXcU2WV+YCgPVKvHPt2z5sCt0VXnMscAHCrc8Lx9dskdOWEFHDzdsnbG2eL0hadcnoLBsDNcxEE45W3r9vZOPp7DwUEzOMyV7w39lZ1qSht0SlHz7LH9vsRlm/67uXCksvA6AHXENasnw5Xp0Vsi46czRxiQa1uO3vxl5ihs6zbP8vIqAAj45WPJqUJ+FzjHkKzQy3Frr4IzWuUlSvXjmem9caI2rqbK9+Pzcg5JZb/u+HM3tYM1Oy6rQi8/FbB0jWR+dfTgJEh8+q5JavDoAWi+r8rLvcMYm+WFNc2taiOJW7vZdvHzzMCGAe27Xrtoy8XtbQ0SsH/nVpuzMEYce39tntJaYeulVwOHzxOUpeAP3SkXjm+8oNHktIO0AcS8HxXVu4RxKzSMpHC1k1F5cXlOb+c2HLvXqufR7iJiaHtFwi/3UdfLv5q9+uNcGlJMj7vilNj/tzF81YAEFe3ter95JSV02KX/8GtGSSCauWNb/e8ffDkl1Lzczc6NXouhWrplOb+BTWmiKxbWljHjV7yxOSXHXvr6xNGC4rTfzy07n9nv5eynzvVucyBQAHJ8lHDHhsZOSPEf5S+RImqofp/5/574uwPOQXJ9LGEfdsV18ocemAH9PMLGzx2WMikiMBYM1MLIDEUlWamZcefSd2fnpOgR17t1FJj5sradzdoHyDEpa7D+BjkM2ygV8RAryEibptfWHolPTvhSt6ZtKx4VUON/vpTS8cyB6DYZ23oJ7e37evrEebtHurrHjrAhX6Qj47ySn1jbXllwY2qorLKqzkFFy7nJjY2qwzDh1pckzmwPfQNhNv3cnbp42lr42BjaW9paQeXb+RyeYdBeeccrpE2N9c3tqiaoG2qa25paGhSNjWralVVBumrTrmC7WMAFzW81X+9VllZo7xheN9LMF0BGAaAxqLYITrRmbvsAYVbpr8BRCc6HJDKNCUxYonFLJ05ABZBhBPOc7kHXJWlD5l4YYOGcMLZzAFQYZ2JF8IJ13AucyCgqCGccAYyFC6MSqlR1Gg40Y1aZy4TxIKGcMJ50LVzOl6YA4xTRCc6mzlQR8Omk/aW6EarM2MO9hMUzwHGiW60uoKi2Nihq+uEE45x5i57AIgltqNlMwfgix+EE85xGbcWh+KFcMI1XO4RpOlkAN/hAIwT3Vh17qkJXFeDOBM7RDd2nYqZgzoZFDWAcMJ5LmNjB2BxBLABK9GNWJd7BKJQobCwIZxwmjPXCFLoGCCuxjjRjVmnn7dCZxI+XtC1YhwnujHr3N7nQGPRJ4hOdFQhZaNGEztsjZ3oRq2jtRUuXtpZohu7rmDvfUPxQjjhGEdrK5p4IZxwnsvdg+juBsUL6nqYqAEcJ7rx6jKWoZkMywHGiW68Ops5WFCEE67h3D6TgI4XlFt4TnQj1+XugYCAoFPQz1tBkYJAYZzoRq4raKPW6GqME93I9f8DAAD//5yxJvIAAAAGSURBVAMAvW5W8qRhcuEAAAAASUVORK5CYII=";

/** Sets the favicon, Add-to-Home-Screen icon and app name on the host page. */
function useAppIcon() {
  useEffect(() => {
    try {
      // Only fill in what the host page hasn't already declared (a hosted
      // index.html ships real icon files, which iOS handles best).
      const link = (rel, href, attrs = {}) => {
        if (document.head.querySelector(`link[rel="${rel}"]`)) return;
        const el = document.createElement("link");
        el.rel = rel;
        document.head.appendChild(el);
        el.href = href;
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      };
      const meta = (name, content) => {
        let el = document.head.querySelector(`meta[name="${name}"]`);
        if (!el) {
          el = document.createElement("meta");
          el.name = name;
          document.head.appendChild(el);
        }
        el.content = content;
      };
      link("icon", "data:image/svg+xml," + encodeURIComponent(FAVICON_SVG), { type: "image/svg+xml" });
      link("apple-touch-icon", APPLE_TOUCH_ICON, { sizes: "180x180" });
      meta("apple-mobile-web-app-title", "sam'spresso");
      meta("application-name", "sam'spresso");
      meta("apple-mobile-web-app-capable", "yes");
      meta("mobile-web-app-capable", "yes");
      meta("theme-color", C.bg);
    } catch (_) {}
  }, []);
}

/* ───────────────────────────── App ───────────────────────────── */

export default function Samspresso() {
  useAppIcon();
  // theme: defaults → published theme.json → (design mode) this device's draft
  const [, setThemeV] = useState(THEME_VERSION);
  const [publishedTheme, setPublishedTheme] = useState(DEFAULT_THEME);
  const designMode = useMemo(isDesignMode, []);
  const readDraft = () => {
    try {
      return JSON.parse(localStorage.getItem("sp-theme-draft") || "null");
    } catch (_) {
      return null;
    }
  };
  const useTheme = useCallback((t) => {
    applyTheme(t);
    setThemeV(THEME_VERSION);
  }, []);
  useEffect(() => {
    let alive = true;
    const draft = designMode ? readDraft() : null;
    if (draft) useTheme(draft);
    fetch("theme.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((json) => {
        if (!alive) return;
        const pub = sanitizeTheme(json);
        setPublishedTheme(pub);
        if (!draft) useTheme(pub);
      });
    return () => {
      alive = false;
    };
  }, [designMode, useTheme]);
  const editTheme = useCallback(
    (t) => {
      useTheme(t);
      try {
        localStorage.setItem("sp-theme-draft", JSON.stringify(THEME));
      } catch (_) {}
    },
    [useTheme]
  );
  const resetTheme = useCallback(() => {
    try {
      localStorage.removeItem("sp-theme-draft");
    } catch (_) {}
    useTheme(publishedTheme);
  }, [useTheme, publishedTheme]);
  const [tab, setTabRaw] = useState("discover");
  // Saved on this device: cafés/items you added, your ratings, history and Want to Try.
  const stored = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("sp-state-v1") || "null");
    } catch (_) {
      return null;
    }
  }, []);
  const [cafes, setCafes] = useState(() => (stored ? [...SEED_CAFES, ...(stored.userCafes || [])] : SEED_CAFES));
  const [items, setItems] = useState(() => {
    if (!stored) return SEED_ITEMS;
    const upd = stored.itemUpdates || {};
    return [...SEED_ITEMS.map((i) => (upd[i.id] ? { ...i, ...upd[i.id] } : i)), ...(stored.userItems || [])];
  });
  const [history, setHistory] = useState(() => (stored && stored.history) || SEED_HISTORY);
  const [saved, setSaved] = useState(() => new Set((stored && stored.saved) || ["or-v60"]));
  useEffect(() => {
    try {
      const seed = Object.fromEntries(SEED_ITEMS.map((i) => [i.id, i]));
      const itemUpdates = {};
      items.forEach((i) => {
        const o = seed[i.id];
        if (o && (o.rating !== i.rating || o.count !== i.count)) itemUpdates[i.id] = { rating: i.rating, count: i.count };
      });
      localStorage.setItem(
        "sp-state-v1",
        JSON.stringify({
          userCafes: cafes.filter((c) => c.id.startsWith("u-")),
          userItems: items.filter((i) => i.id.startsWith("ui-")),
          itemUpdates,
          history,
          saved: [...saved],
        })
      );
    } catch (_) {}
  }, [cafes, items, history, saved]);
  const [area, setArea] = useState("All London");
  const [drink, setDrink] = useState("All Drinks");
  const [sourceId, setSourceId] = useState("mon-fw");
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [rate, setRate] = useState(null); // { cafeId, key }
  const [toast, setToast] = useState(null);
  const [flash, setFlash] = useState(null);
  const [now, setNow] = useState(londonNow);
  const [sort, setSort] = useState("top"); // "top" | "near"
  const [openOnly, setOpenOnly] = useState(false);
  const [origin, setOrigin] = useState({ label: "Oxford Circus", x: 388, y: 350 });

  useEffect(() => {
    const t = setInterval(() => setNow(londonNow()), 60000);
    return () => clearInterval(t);
  }, []);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const rowRefs = useRef({});

  const setTab = useCallback((t) => {
    setTabRaw(t);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, []);

  const liveDropsNow = useMemo(() => liveDrops(Date.now()), []);
  const cafesFull = useMemo(
    () =>
      cafes.map((c) => {
        const its = items
          .filter((i) => i.cafeId === c.id && promoLive(i))
          .sort((a, b) => !!b.promo - !!a.promo || b.rating - a.rating || b.count - a.count);
        const rated = its.filter((i) => i.count > 0);
        return { ...c, drop: liveDropsNow[c.id] || null, items: its, avg: avg(rated.map((i) => i.rating)), total: rated.reduce((s, i) => s + i.count, 0), pick: its.some((i) => i.pick) };
      }),
    [cafes, items]
  );
  const cafesById = useMemo(() => Object.fromEntries(cafesFull.map((c) => [c.id, c])), [cafesFull]);
  // base neighbourhoods first, then any area people have added
  const areas = useMemo(() => {
    const extra = [];
    cafes.forEach((c) => c.areas.forEach((a) => !AREAS.includes(a) && !extra.includes(a) && extra.push(a)));
    return [...AREAS, ...extra];
  }, [cafes]);
  const itemsById = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);
  const taste = useMemo(() => userTaste(history, cafesById, itemsById), [history, cafesById, itemsById]);
  const forYou = useMemo(() => {
    if (!taste) return [];
    const loved = history.filter((h) => h.rating >= 4 && isCoffeeRating(h, itemsById) && cafesById[h.cafeId] && cafesById[h.cafeId].coffee);
    const tried = new Set(history.map((h) => h.cafeId));
    return cafesFull
      .filter((c) => c.coffee && !tried.has(c.id))
      .map((c) => {
        const score = tasteMatch(taste, c.coffee.taste);
        // explain it with the loved café it's closest to
        // credit the closest loved café; the most recent one wins near-ties
        let best = null;
        loved.forEach((h, idx) => {
          const lc = cafesById[h.cafeId];
          const m = tasteMatch(lc.coffee.taste, c.coffee.taste) + (idx === 0 ? 8 : 0);
          if (!best || m > best.m) best = { m, h, lc };
        });
        const traits = best ? sharedTraits(best.lc.coffee.taste, c.coffee.taste) : [];
        const reason = best
          ? `Because you loved the ${best.h.name.toLowerCase()} at ${best.lc.name}${traits.length ? `: ${traits.slice(0, 2).join(", ")}` : ""}.`
          : "Close to your taste so far.";
        return { cafe: c, score, reason };
      })
      .filter((p) => p.score >= 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [taste, history, cafesFull, cafesById, itemsById]);
  const similarTo = useCallback(
    (cafe) =>
      !cafe || !cafe.coffee
        ? []
        : cafesFull
            .filter((c) => c.id !== cafe.id && c.coffee)
            .map((c) => ({ cafe: c, score: tasteMatch(cafe.coffee.taste, c.coffee.taste), traits: sharedTraits(cafe.coffee.taste, c.coffee.taste) }))
            .filter((m) => m.score >= 45)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3),
    [cafesFull]
  );
  const ranks = useMemo(() => {
    const r = {};
    [...cafesFull].filter((c) => c.items.length).sort((a, b) => b.avg - a.avg || b.total - a.total).forEach((c, i) => (r[c.id] = i + 1));
    return r;
  }, [cafesFull]);

  const filtered = useMemo(
    () =>
      cafesFull
        .filter((c) => (area === "All London" || c.areas.includes(area)) && (drink === "All Drinks" || c.items.some((i) => i.styles.includes(drink))))
        .filter((c) => !openOnly || (openStatus(c, now) || {}).open)
        .sort((a, b) => (sort === "near" && a.x != null && b.x != null ? metresBetween(a, origin) - metresBetween(b, origin) : b.avg - a.avg)),
    [cafesFull, area, drink, openOnly, now, sort, origin]
  );
  const statusOf = useCallback((c) => openStatus(c, now), [now]);
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

  const [detailOrigin, setDetailOrigin] = useState(null);
  const [articleId, setArticleId] = useState(null);
  const [articleOrigin, setArticleOrigin] = useState(null);
  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("sp-journal-read") || "[]"));
    } catch (_) {
      return new Set();
    }
  });
  const journal = useMemo(() => JOURNAL.filter((j) => !j.endsAt || j.endsAt > Date.now()).sort((a, b) => (b.kind === "drop") - (a.kind === "drop") || b.publishedAt - a.publishedAt), []);
  const openArticle = useCallback((id, el) => {
    setArticleOrigin(el || null);
    setArticleId(id);
    setReadIds((r) => {
      const n = new Set(r);
      n.add(id);
      try {
        localStorage.setItem("sp-journal-read", JSON.stringify([...n]));
      } catch (_) {}
      return n;
    });
  }, []);
  const closeArticle = useCallback(() => setArticleId(null), []);
  const openCafe = useCallback((id, el) => {
    setDetailOrigin(el || null);
    setDetailId(id);
  }, []);
  const closeDetail = useCallback(() => setDetailId(null), []);
  const openRate = useCallback((cafeId, itemName) => {
    setDetailId(null);
    setRate({ cafeId: cafeId || null, itemName: typeof itemName === "string" ? itemName : "", key: Date.now() });
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
      const areaName = titleCase(newCafe.area);
      const st = TUBE_STATIONS.find((t) => t[0] === newCafe.station);
      const known = areas.find((a) => a.toLowerCase() === areaName.toLowerCase());
      const area = known || areaName;
      // place it at the chosen station, else at a known area's centre, else list-only (no pin yet)
      const pos = st ? [st[1], st[2]] : AREA_POS[area] || null;
      const cafe = {
        id: cid,
        name: titleCase(newCafe.name),
        hood: `${area} · Community find`,
        areas: [area],
        tube: st ? st[0] : "—",
        walk: null,
        price: "££",
        vibes: ["Community Find"],
        blurb: "Added by you. Rate more items to help this spot climb the leaderboard.",
        x: pos ? pos[0] + (Math.random() * 24 - 12) : null,
        y: pos ? pos[1] + (Math.random() * 18 - 9) : null,
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
    <Filters area={area} setArea={setArea} drink={drink} setDrink={setDrink} compact glass areas={areas} />
  );

  const discover = (
    <div className="space-y-8">
      <TasteMatch items={items} cafes={cafesFull} cafesById={cafesById} sourceId={sourceId} setSourceId={setSourceId} saved={saved} toggleSave={toggleSave} onOpenCafe={openCafe} onRate={() => openRate()} />
      <ForYouRow picks={forYou} onOpen={openCafe} onRate={() => openRate()} />
      <JournalRow entries={journal} readIds={readIds} onOpen={openArticle} />
      <section aria-labelledby="explore-title">
        <div className="mb-4 min-w-0">
          <p className="mb-1 text-sm" style={{ color: C.taupe }}>
            explore
          </p>
          <h2 id="explore-title" className="text-xl font-medium tracking-tight md:text-2xl">
            <span className="serif block truncate whitespace-nowrap text-3xl md:text-4xl">{area === "All London" ? "the london edit" : `the ${area.toLowerCase()} edit`}</span>
          </h2>
          <p className="tabular mt-1 text-sm" style={{ color: C.taupe }}>
            {filtered.length} café{filtered.length === 1 ? "" : "s"}
            {drink !== "All Drinks" ? ` · ${drink.toLowerCase()}` : ""}
          </p>
        </div>
        <Filters area={area} setArea={setArea} drink={drink} setDrink={setDrink} areas={areas} />
        <div key={`${area}|${drink}|${sort}|${openOnly}|${origin.label}`} className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => (
            <CafeCard
              key={c.id}
              cafe={c}
              drink={drink}
              saved={saved}
              toggleSave={toggleSave}
              onOpen={openCafe}
              index={i}
              status={statusOf(c)}
              distance={sort === "near" && c.x != null ? metresBetween(c, origin) : null}
            />
          ))}
        </div>
        {filtered.length === 0 && <EmptyState onReset={resetFilters} />}
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
        <LondonMap cafes={cafesFull} visibleIds={visibleIds} selectedId={selectedId} onSelect={setSelectedId} hoveredId={hoveredId} onOpen={openCafe} overlay={mapOverlay} here={sort === "near" ? origin : null} focusTopRatio={0.45} />
      </div>
    </div>
  ) : (
    <div className="fixed inset-x-0 z-10" style={{ top: 56, bottom: "calc(56px + env(safe-area-inset-bottom))" }}>
      <LondonMap cafes={cafesFull} visibleIds={visibleIds} selectedId={selectedId} onSelect={setSelectedId} hoveredId={null} onOpen={openCafe} overlay={mapOverlay} here={sort === "near" ? origin : null} rounded={false} focusTopRatio={0.38} />
    </div>
  );

  const detailCafe = detailId ? cafesById[detailId] : null;

  return (
    <div className="sp min-h-screen">
      <style>{buildCSS()}</style>
      <TopNav tab={tab} setTab={setTab} onRate={openRate} savedCount={saved.size} />
      <MobileHeader tab={tab} savedCount={saved.size} onSaved={() => setTab("profile")} />

      <main className={`mx-auto max-w-5xl px-4 md:px-6 ${tab === "map" ? "pt-4 md:py-8 pb-0 md:pb-8" : "pb-28 pt-4 md:py-8"}`}>
        {/* the phone map is position:fixed, so its wrapper must not animate transform */}
        <div key={tab} className={tab === "map" && !isDesktop ? "a-fade" : "a-fadeup"}>
          {tab === "discover" && discover}
          {tab === "map" && mapView}
          {tab === "leaderboard" && <Leaderboard cafes={cafesFull} items={items} cafesById={cafesById} onOpenCafe={openCafe} saved={saved} toggleSave={toggleSave} flash={flash} />}
          {tab === "profile" && <Profile taste={taste} history={history} saved={saved} items={items} cafesById={cafesById} toggleSave={toggleSave} onOpenCafe={openCafe} onRate={() => openRate()} />}
        </div>
      </main>

      <BottomNav tab={tab} setTab={setTab} onRate={openRate} />

      <Sheet data={detailCafe} onClose={closeDetail} label="Café details" originEl={detailOrigin}>
        {(cafe) => <CafeDetail cafe={cafesById[cafe.id] || cafe} similar={similarTo(cafesById[cafe.id] || cafe)} onOpenCafe={(id) => { setDetailOrigin(null); setDetailId(id); }} status={statusOf(cafesById[cafe.id] || cafe)} rank={ranks[cafe.id]} saved={saved} toggleSave={toggleSave} onRate={openRate} onShowMap={showOnMap} onOpenStory={(id) => {
          setDetailId(null);
          setTimeout(() => openArticle(id), 320);
        }} />}
      </Sheet>

      <Sheet data={articleId ? journal.find((j) => j.id === articleId) : null} onClose={closeArticle} label="Journal story" originEl={articleOrigin} chromeOverlay>
        {(entry) => (
          <JournalArticle
            entry={entry}
            cafesById={cafesById}
            items={items}
            saved={saved}
            toggleSave={toggleSave}
            onOpenCafe={(id) => {
              setArticleId(null);
              setTimeout(() => openCafe(id), 320);
            }}
          />
        )}
      </Sheet>

      <Sheet data={rate} onClose={closeRate} label="Rate an item" bare tone="grouped">
        {(r) => <RateForm key={r.key} cafes={cafesFull} items={items} areas={areas} initialCafeId={r.cafeId} initialItem={r.itemName} onSubmit={submitRating} onCancel={closeRate} />}
      </Sheet>

      <Toast toast={toast} />
      {designMode && <DesignPanel theme={THEME} published={publishedTheme} onChange={editTheme} onReset={resetTheme} />}
    </div>
  );
}
