# Wedding Invitation Site

One-page Hindu wedding invitation (Next.js 15, Tailwind, Framer Motion) with a named
gatekeeper, background music, countdown, timeline, venues, RSVP → MongoDB, a public
blessings wall, an admin RSVP dashboard, and a print-ready A4 invitation card.

## Run

```bash
cp .env.example .env.local     # then fill in the values
npm install
npm run dev                    # http://localhost:3000
```

`npm run build && npm start` for production. Requires Node 22+ and a MongoDB
connection string (local or Atlas).

| Env var | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string. Use a separate database per wedding. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `/admin` login. Cookie is `secure` in production → deploy behind HTTPS. |
| `NEXT_PUBLIC_SITE_URL` | Public origin, used for Open Graph metadata. |

## Create a new wedding

1. **Copy the folder.** One folder (or one git branch) per wedding.
2. **Edit `wedding.config.js`.** Every name, date, address, map link, event, printed-card
   line, phone number, hashtag and SEO string lives there. Nothing else needs touching.
3. **Replace `public/` assets:** `wedding_card.pdf`, the two MP3s (or update `music`),
   and `background2/3/4.png` if the couple wants different art. Backgrounds contain no
   names, so they can be reused.
4. **Optional photos:** add `{ src, alt, caption }` items to `gallery` (files in
   `public/`) to switch on the Memories section. Empty array = section hidden.
5. **Optional OG image:** `seo.ogImage` currently points at `background3.png`. Drop a
   1200×630 card into `public/` and point at it for a richer WhatsApp preview.
6. **New env:** fresh `MONGODB_URI`, admin credentials, and `NEXT_PUBLIC_SITE_URL`.
7. **Verify:** `npm run build`, submit one test RSVP, log in to `/admin`, delete it.

## Things to know

- `couple.order` (`groom-first` / `bride-first`) reorders the names and cards everywhere.
- Datetimes are ISO strings with `+05:30`; they drive the countdown, the `.ics` file and
  the hero date. The countdown section hides itself once the wedding date has passed.
- `card.schedule` is the printed card's event list and is written by hand — printed
  cards show sub-events (baraat, varmala) that the website tabs may not.
- Print the invitation with `Cmd/Ctrl+P`. An `@page` rule locks it to one A4 page.
- RSVP POST has a honeypot and server-side length/count checks. For public traffic add a
  real rate limit or Turnstile in front of `/api/rsvp`.
- `npm run lint` uses flat ESLint config (`eslint.config.mjs`); the production build
  still skips linting, so run it manually.
