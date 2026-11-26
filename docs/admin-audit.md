# House of Jewelux Admin Panel: Phase 1 Audit

Date: 26 Nov 2026 · Repo: `yuvrajsoni95555/house-of-jewelux` (**public**) · main @ 364a405 · No code was changed for this audit.

---

## 1. Current architecture

```
Visitors ──> houseofjewelux.com (GitHub Pages, static files only)
               index.html + app.js (single-page app, hash routes) + style.css
               data/*.json (products, categories, content, blog …) read in the browser
               blog/<slug>/ static article pages (built by scripts/build_blog.js)

Admin ────> houseofjewelux.com/admin.html (static page, no server)
               login: username + password -> decrypts a GitHub token (AES-GCM, PBKDF2 600k) from admin-key.json
               "database" = JSON files in the repo, written through the GitHub Contents API (1 publish = 1 commit)
               drafts = this browser's localStorage

Not running ─> server.js + server/ (Express + PostgreSQL, Razorpay) and vercel.json
               https://houseofjewelux.com/api/products -> 404 (never deployed)
```

## 2. Technology stack

| Layer | Today |
|---|---|
| Website | Plain JavaScript (no framework, no build step), one CSS file, GSAP for motion, Google Fonts, Lucide icons (admin only) |
| Admin | Plain JavaScript (`admin.js` 2,243 lines, `admin-lib.js` with tests in `scripts/test_admin_lib.js`) |
| Data | `data/products.json` (50 products: rings, earrings, necklaces, bracelets, brooches; 10 each), `content.json` (Design Studio), `categories.json`, `blog.json`, plus `orders.json`, `customers.json`, `subscribers.json`, `appointments.json`, `coupons.json`, `custom_orders.json` (test data only) |
| Hosting | GitHub Pages (static). No server, no database, no background jobs |
| Unused backend | Express 5 + `pg`, 10 SQL tables (customers, products, orders, payments, appointments, custom_orders, subscribers, categories, coupons, migrations), Razorpay service |

## 3. Admin Panel modules that exist today

| Module | What it really does |
|---|---|
| Login / Forgot password | Username + password; reset by setting up again with a GitHub token |
| Dashboard | Catalogue health: product count, drafts, out of stock, SEO/ALT/description score, products per category, recent publishes. **No sales, orders, customers or visitors** (there is no data source for them) |
| Products | List, search, add/edit/delete, draft/publish, price/compare price, category/collection, stock status, description, SEO title/description, photo gallery (upload with WebP compression, ALT, captions, reorder, make main), live product page preview |
| Design Studio | Canva-style editor on the real website (details in section 7) for every page group: home, shop, categories (template), product template, about, contact, customer pages, cart/checkout, FAQ, policies, landing pages, blog list + article template, header, footer, announcement bar, mobile nav |
| Global design settings | Brand colours and sizes (CSS design tokens) for the whole site |
| Reusable section library | Save a section once, reuse on many pages |
| Media library | All site images, where each is used, upload, copy path, safe delete |
| Homepage SEO, SEO audit, robots.txt | Title/description/OG checks for the homepage, catalogue SEO issues list, robots.txt editor |
| Version history | Every publish is a commit; compare and restore per page |

## 4. Working features that must be preserved

- Public website: all pages, product page (gallery, lightbox, sticky buy bar), cart/wishlist (browser), blog, footer, SEO tags, sitemap, RSS.
- Admin login, products editor + live preview, uploads (WebP), media library, SEO tools, Design Studio (all tools listed in section 7), drafts, publish, version history/restore.
- `content.json` and `products.json` formats (the website reads them directly).

## 5. Database and backend

- **Live:** JSON files in a **public** GitHub repository. Anyone can download `houseofjewelux.com/data/*.json`.
  This is fine for products and design, but **customer, order and payment data must never be stored there**.
- **Not live:** the Postgres schema and Express API in `server/`. It has real tables for customers, orders and payments, but:
  - it is not deployed;
  - `/admin/orders`, `/admin/products` and `/admin/editor-save` have **no login check**;
  - the admin PIN falls back to hard-coded values (`'1926'` in config, plus `'2026'` and `'1122'` accepted in `adminController.js`).
  It needs a security fix before it is ever deployed.

## 6. Integrations

| Integration | Status |
|---|---|
| GitHub API (admin saves) | Working |
| Razorpay | Checkout script loads, but the order/verify endpoints are on the undeployed server → **payments do not work on the live site** |
| Order tracking, login, newsletter, appointments, custom orders (`/api/...`) | Broken on live (404) |
| Google Fonts, YouTube/Vimeo/Maps embeds | Working |
| WhatsApp, Instagram, phone, email | Plain links only (no API) |
| Analytics (GA4, Search Console, Meta Pixel) | Not installed |
| Email, SMS, WhatsApp Business API, couriers, ads, social, AI provider | Not configured |

## 7. Visual editor (Design Studio) today

**Done and tested:**
- Editing and layout: select any element; move, resize, rotate, snap, smart guides, rulers, grid; layers; lock, hide, rename; group/ungroup; align, distribute; undo/redo; copy/paste/duplicate/delete; keyboard shortcuts; right-hand properties.
- Elements: frames with photo crop/zoom, 2,180 icons, 14 graphics, shapes, lines, text styles, buttons, badges, video/map, music player, countdown.
- Search: Elements search (English + Hindi words).
- Style: fonts (6 site fonts), colours, gradients, themes, borders, shadows, opacity, image adjust and flip.
- Motion: entrance, loop and hover animations.
- Devices: separate positions per device, with the canvas pixel-matched to real laptop, tablet and phone sizes.
- Publishing: section add/reorder/hide per device; draft, preview in a new tab, publish, version compare/restore.
- Product pages and cards: free-resizable product photo frame, product card design for all cards.

**Missing:**
- custom font upload, custom CSS/JS/HTML blocks
- scheduled publishing, template import/export, theme presets
- mega menu builder, sticky header settings
- parallax, page transitions, 3D effects
- marquee (box) select, right-click menu
- AI design assistant
- blog posts editable inside the admin (today they are Markdown files)

## 8. The 17 approved sections: status

Legend: ✅ exists · 🟡 partly · ❌ missing · 🔌 needs an outside account/API · 🗄 needs a server + database first

| # | Section | Status | What exists | What blocks the rest |
|---|---|---|---|---|
| 01 | Main Dashboard | 🟡 | Catalogue health, category chart, recent activity | 🗄 Sales, orders, customers, profit, payments need real order data; 🔌 visitors need analytics |
| 02 | Products | 🟡 (≈40%) | CRUD, drafts, SKU, gallery, ALT, SEO, stock status, categories, collections, badges, specifications | Reviews moderation, videos, scheduling, import/export, related/recommended rules; 🔌 AI image/text, Google Shopping |
| 03 | Orders | ❌ | Nothing live (code exists, not deployed) | 🗄 + Razorpay keys; invoices/GST; 🔌 WhatsApp/SMS/email |
| 04 | Customers | ❌ | Browser-only login stub | 🗄 accounts, history, segments, loyalty; 🔌 messaging |
| 05 | Inventory | ❌ (stock status only) | "In stock / Out of stock" per product | 🗄 quantities, warehouses, suppliers, POs, barcode |
| 06 | Marketing | 🟡 (SEO only) | Homepage/product SEO, blog | 🔌 Meta, Google Ads, social, email, WhatsApp; 🗄 coupons (FIRSTLUX is hard-coded) |
| 07 | Website Content | 🟡 (≈60%) | Pages, sections, SEO, header/footer, announcement bar, media, policies, landing pages, blog (files) | Popups, menus editor, scheduling, blog editor in admin, cookie consent; 🔌 AI writing |
| 08 | Appearance Studio | ✅ mostly (≈75%) | See section 7 | Items listed under "Missing" in section 7 |
| 09 | AI & Automation | ❌ | — | 🔌 AI provider key + budget; 🗄 jobs, logs, approvals |
| 10 | Analytics & Reports | ❌ | — | 🗄 orders; 🔌 GA4 |
| 11 | Finance & Payments | ❌ | — | 🗄 + payments; GST/accounting needs your CA's rules |
| 12 | International | ❌ | — | 🗄 + currencies, 🔌 PayPal/Stripe, DHL/FedEx/Aramex |
| 13 | Communication | ❌ | — | 🔌 WhatsApp Business API, SMTP/email, SMS gateway, Meta inbox |
| 14 | Shipping | ❌ | Pincode text on product page (not real) | 🔌 Shiprocket/Delhivery/etc.; 🗄 shipments |
| 15 | Settings & Admin | 🟡 | One admin login, password reset | 🗄 multi-admin, roles, 2FA, sessions, audit logs |
| 16 | Support Centre | ❌ | FAQ + care guide pages | 🗄 tickets; 🔌 channels |
| 17 | Notifications | ❌ | Toasts inside the admin only | 🗄 events; 🔌 push/email/WhatsApp |

Roughly: **3 sections partly or mostly done (02, 07, 08), 3 started (01, 06, 15), 11 not started.** The approved list has about 1,500 items. Most of them cannot work, even in a basic form, without a backend; many also need paid outside accounts.

## 9. Technical risks

1. **No backend.** Orders, customers, inventory, finance, messaging, shipping, support, notifications and AI agents all need a server, a private database and real login/roles. GitHub Pages cannot do this, and the public repo must not hold private data.
2. **Payments are broken on the live site today** (`/api/payment/create-order` → 404).
3. **The undeployed server code is unsafe as written**: hard-coded PINs and admin routes with no login check. Fix before deploying.
4. **Public data files** (`orders.json`, `customers.json`, …) hold only test data now, but must be moved out of the repo before real use.
5. **Seeded numbers**: product ratings and review counts look like sample data. Per your rule, "no fake numbers in production", they should be hidden or replaced by real reviews.
6. **Scope.** About 1,500 items, many needing paid accounts: WhatsApp Business API, SMS gateway, Shiprocket/couriers, Meta/Google Ads, AI provider, GA4, PayPal/Stripe. Nothing can be simulated as "working" without them.
7. **Finance/GST** must follow your chartered accountant's rules; software can calculate, but the rules must come from you.
8. **Admin code size.** One 2,243-line file. Adding 17 sections needs it split into modules first.

## 10. Recommended phases (for your approval)

| Phase | Work | Needs from you |
|---|---|---|
| **0. Decision** | Choose the backend. **Recommended:** deploy the existing Express + Postgres server on Vercel (`vercel.json` already exists) with a managed Postgres, after fixing its security. Website stays on GitHub Pages; the admin talks to the API. | Yes/No on hosting; Vercel + database account |
| 1. Foundation | Secure API: real admin accounts, roles, sessions, audit log; move private data out of the repo; split the admin into modules; luxury dark admin shell with all 17 sections in the sidebar (each shows "Not configured" until real) | — |
| 2. Sell | Orders + Razorpay payments live (fixes checkout), customers, stock quantities with auto-deduct/restore, invoices (PDF, GST format from your CA), real dashboard KPIs, in-app notifications | Razorpay live keys, GST details |
| 3. Studio + content | Custom fonts/CSS/HTML blocks, scheduled publishing, templates, menus/mega menu, popups, cookie consent, blog editor in admin | — |
| 4. Talk & ship | Email (SMTP), WhatsApp Business API, Shiprocket/courier booking + tracking, support tickets | Those accounts |
| 5. Grow | GA4/Search Console, coupons/offers engine, reviews moderation, reports + exports, international currency display | GA4 property |
| 6. AI | AI assistant and agents with approval gates, budgets and an emergency stop | AI provider key + monthly budget |

Nothing in this plan deletes existing features or data. Each phase ships on its own and is tested before the next.
