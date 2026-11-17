# sam'spresso: production plan

Status: **plan only, nothing started**. Last updated 17 Nov 2026.

## Where it is today

sam'spresso is a polished, clickable prototype:

- One React file (`Samspresso.jsx`, about 3,500 lines) with Tailwind and lucide-react.
- All data is sample data stored in the code: cafés, menus, ratings, opening hours, journal stories and the WatchHouse drop.
- Nothing is saved. Ratings, Want to Try and the profile reset on reload, and every user sees the same cafés.
- `index.html` / `preview.html` are built bundles committed by hand; GitHub Pages serves `index.html` from `main`.
- The browser tests (Playwright) run outside the repo.

## 1. Must-haves before real users

### App structure
- [ ] Split `Samspresso.jsx` into a real project (Vite + React or Next.js, TypeScript): components, routes, shared design tokens.
- [ ] Keep the current design exactly as it is while restructuring.
- [ ] Build and deploy through a pipeline; stop committing built `index.html` / `preview.html`.

### Backend and data
- [ ] Database (for example Postgres via Supabase) for cafés, menu items, ratings, saved lists, journal stories and promotions.
- [ ] Real, checked café data: addresses, coordinates, opening hours, prices and menus.
  - Known placeholders: Common Breads' location, menu and description; every café's opening hours; all ratings and counts.
- [ ] Admin tools for Samia to add cafés, write journal pieces and schedule drops (headless CMS such as Sanity, or a small admin page).

### Accounts and trustworthy ratings
- [ ] Sign-in: email magic link, Apple and Google.
- [ ] Ratings, profile history and Want to Try stored per account and synced across devices.
- [ ] One rating per person per drink (editable), rate limits, spam and bot protection.
- [ ] Report and moderation tools.
- [ ] Validate and moderate any text people type (new café and drink names).

### Real map
- [ ] Replace the hand-drawn SVG map with MapLibre or Mapbox, styled in the sam'spresso palette.
- [ ] Real distances and walking routes.
- [ ] Ask for location permission properly.

### Legal (UK)
- [ ] Privacy policy and terms.
- [ ] UK GDPR consent for analytics and location data.
- [ ] Sponsored listings labelled as ads under the ASA/CAP code ("ad" or "paid partnership" is safer than "sponsored" alone).
- [ ] Only real collaborations in the journal. The WatchHouse × sam'spresso drop is made up and must be replaced.
- [ ] Permission or a clear basis for using café names and descriptions.

### Quality and reliability
- [ ] Move the Playwright tests into the repo and run them on every pull request (GitHub Actions).
- [ ] Error monitoring (for example Sentry).
- [ ] Privacy-friendly analytics.
- [ ] Accessibility pass: screen reader, keyboard, contrast, Dynamic Type.

## 2. To feel like a premium app

- [ ] Installable web app (PWA): offline support, home-screen install, push notifications for new drops.
- [ ] Decide on App Store presence: wrap the app (Capacitor) or rebuild in React Native.
- [ ] Performance: split the ~300 KB bundle, self-host fonts, lazy-load the map; aim for usable in about 1.5 s on a phone.
- [ ] Real café photography on an image CDN (the app already supports a `photo` per café).
- [ ] Search across cafés, drinks and areas.

## 3. To make money from it

- [ ] Sponsored listings: booking and billing (for example Stripe), start and end dates, placement rules.
  - The app already has a `promo` model (`drop` / `sponsored`, label, partner, end date, linked story) to build on.
- [ ] Reporting for cafés: views, saves and ratings during a promotion.
- [ ] Café-owner accounts to claim and update their listing and propose drops.

## Suggested order

1. Restructure the project; add tests and automatic checks.
2. Database and sign-in; move ratings and saved drinks to the server.
3. Real café data; admin for the journal and drops.
4. Real map, privacy and legal pages; soft launch to a small group.
5. Installable app and push notifications; then sponsored listings with billing.
