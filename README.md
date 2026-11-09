# Reshma's Needle — Boutique & Custom Tailoring

Women's fashion boutique with ready-made shop, bespoke tailoring wizard
(measurements → WhatsApp), cart/checkout, customer accounts and an admin
dashboard. Built with Next.js (App Router), TypeScript, Tailwind CSS, Drizzle ORM and PostgreSQL.

## Quick start (বাংলায়)

1. **Node.js 20.9 বা নতুন** ইনস্টল করুন: https://nodejs.org (LTS)
2. প্রজেক্ট ফোল্ডারে Terminal / Command Prompt খুলুন।
3. `node_modules` আর `.next` ফোল্ডার থাকলে **মুছে দিন** (অন্য কম্পিউটার থেকে কপি করা হলে চলবে না)।
4. চালান:

   ```bash
   npm install
   npm run dev
   ```

5. ব্রাউজারে খুলুন: **http://localhost:3000**
6. Admin: **http://localhost:3000/admin** → কোড: **`SAD1999`**

PostgreSQL ইনস্টল করা **লাগবে না**। ডাটাবেস না পেলে সাইট নিজেই `.data/` ফোল্ডারে
একটা লোকাল ডাটাবেস বানিয়ে নেয় এবং প্রথমবার নমুনা প্রোডাক্ট ভরে দেয়।

কিছু কাজ না করলে আগে এটা চালান, কী ঠিক নেই সেটা বলে দেবে:

```bash
node scripts/doctor.mjs
```

> XAMPP / WAMP / Apache লাগবে না। এটা Node.js অ্যাপ; `npm run dev` নিজেই সার্ভার চালু করে।
> `index.html` ডাবল-ক্লিক করে খুললে কাজ করবে না।

## Quick start (English)

```bash
npm install          # on YOUR computer, not copied from another one
npm run dev          # http://localhost:3000
```

| What | Where |
| --- | --- |
| Storefront | http://localhost:3000 |
| Admin dashboard | http://localhost:3000/admin — access code `SAD1999` |
| Setup check | `node scripts/doctor.mjs` |
| Production build | `npm run build` then `npm start` |

To run on another port: `npm run dev -- -p 3001`.

## Database

The site works with **no database setup**. On start it picks one automatically:

1. `DATABASE_URL` points to a reachable PostgreSQL → uses it (this is what hosting does).
2. `DATABASE_URL` missing, or a local PostgreSQL is not running / rejects the login →
   uses a **built-in PostgreSQL (PGlite)** stored in `.data/pglite`. Look for
   `[db] Using the built-in local database` in the terminal.

Tables are created and sample products/orders are inserted automatically on the
first request. Settings (see `.env.example`):

| Variable | Meaning |
| --- | --- |
| `DATABASE_URL` | Your own PostgreSQL, e.g. `postgresql://postgres:postgres@127.0.0.1:5432/app_db` |
| `DB_DRIVER` | `auto` (default), `postgres` (never fall back), `embedded` (always built-in) |
| `PGLITE_DATA_DIR` | Folder for the built-in database |

**Start with fresh sample data:** stop the server, delete the `.data` folder, start again.
(With your own PostgreSQL, drop and recreate the database instead.)

**Back up your data:** copy the `.data` folder while the server is stopped.

## Admin dashboard (`/admin`)

Sign in with the access code (default `SAD1999`; change it with `ADMIN_ACCESS_CODE`).
After 5 wrong attempts access is paused for 15 minutes. Tabs:

1. **Products & Categories** — add / edit / delete products, upload photos, price, stock, colours, sizes.
2. **Custom Tailoring Requests** — measurements, notes, reference photos, status.
3. **Customer Orders** — details and status updates.
4. **Page Content & Images** — edit the text and pictures of Home, Shop, Customize, About, Contact and Footer.
5. **WhatsApp, Delivery & Payment** — WhatsApp number, delivery charges, bKash / Nagad instructions, social links.

Photos uploaded in the dashboard are stored in the database (so they travel with
`.data` / your PostgreSQL). Built-in pictures live in `public/images/`.

Demo customer account: `samira@example.com` / `reshma2026`.

## Changing things yourself

| I want to change… | Edit |
| --- | --- |
| Texts and pictures on pages | Admin → *Page Content & Images* (no code needed) |
| Default texts / which fields are editable | `src/lib/siteContent.ts` |
| Colours, fonts | `src/app/globals.css` (palette is also used inline as `#7A1F3D` wine, `#F8F5EF` ivory, `#A8B5A0` sage, `#292725` charcoal) |
| Logo | `src/components/BrandLogo.tsx` |
| Menu links | `src/components/Navbar.tsx` |
| Footer | `src/components/Footer.tsx` |
| Homepage layout | `src/app/page.tsx` |
| Tailoring wizard | `src/app/customize/page.tsx` |
| Mannequin & measurement points | `src/components/TailoringMannequin.tsx` |
| Database tables | `src/db/schema.ts` (+ matching `CREATE TABLE` in `src/db/seed.ts`) |
| Sample products / settings | `src/db/seed.ts` (only used on an empty database) |
| API routes | `src/app/api/**` |
| Images | `public/images/` (then run `node scripts/embed-images.mjs` to refresh the backup copy) |

`npm run dev` reloads automatically when you save a file.

## Troubleshooting

- **Run `node scripts/doctor.mjs` first.**
- **`npm install` fails or the site shows native-module errors** → delete `node_modules`
  and `.next`, run `npm install` again (packages like `sharp` / Tailwind are
  platform-specific and cannot be copied between Windows, macOS and Linux).
- **Pictures missing after downloading the zip** → some zip/download tools drop binary
  files such as `.jpg`. The site handles this by itself: every built-in picture is also
  stored as plain text in `src/lib/embeddedImages`, and `/images/<name>.jpg` is served
  from there when `public/images` is empty. If you still see a plain "Reshma's Needle"
  tile, copy the whole project folder again (it must include `src/lib/embeddedImages`).
  For pictures you uploaded in the admin, they live in the database (`.data` folder).
- **Added or replaced a picture in `public/images`?** It is used immediately. To also
  refresh the built-in backup copy, run `node scripts/embed-images.mjs`.
- **Port 3000 is busy** → `npm run dev -- -p 3001`.
- **Admin code not accepted** → check `ADMIN_ACCESS_CODE` in `.env`; after 5 wrong tries wait 15 minutes (or restart the server).
- **Want to use your own PostgreSQL** → create an empty database, put its URL in `.env`
  as `DATABASE_URL`, and set `DB_DRIVER=postgres` so a typo never silently switches databases.

## Going live

Use a hosting service that runs Node.js and gives you a PostgreSQL database.
Set `DATABASE_URL`, `DB_DRIVER=postgres`, `ADMIN_ACCESS_CODE` and a long random
`ADMIN_SESSION_SECRET`, then `npm run build` and `npm start`.
