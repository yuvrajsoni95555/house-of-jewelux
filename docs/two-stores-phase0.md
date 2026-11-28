# Two stores (Silver | Gold): Phase 0 report

Date: 28 Nov 2026 · Nothing on the live site was changed for this report.

## 1. What the site is built on
- **Custom code**, not Shopify or WordPress.
- Website: plain HTML + JavaScript + CSS (`index.html`, `app.js`, `style.css`), hosted free on **GitHub Pages** (repo `yuvrajsoni95555/house-of-jewelux`).
- Products: `data/products.json`, edited in your own admin (`/admin.html`).
- Orders, payments, customers: an Express server on **Vercel** with a **Neon Postgres** database.
- Shopify words in the brief map to this site as follows. "Tag" = the product's **metal** field. "/collections/gold" = `/gold-jewellery/`. "Duplicate theme" = a backup branch.

## 2. Access needed
Nothing new. I already work in the code. Two optional things only you can do:
- **Google Search Console:** to submit the new sitemap and watch indexing.
- **PageSpeed scores:** run https://pagespeed.web.dev/ on houseofjewelux.com. Google's free test limit for my tool was used up today, and running Lighthouse on this computer was not permitted.

## 3. Backup
- Live site as it is today: branch **`backup/live-before-two-stores-2026-11-28`** (commit 8b14a9d). Any change can be rolled back to it in one step.
- All new work stays on this computer and is **not published** until you say so.

## 4. Audit

### Products
| | |
|---|---|
| Products | 50, all published, all "In Stock" |
| Metal | **50 × 925 sterling silver**: 33 rhodium finish, 17 gold-plated. **0 solid gold** |
| Types | 10 each: rings, earrings, necklaces, bracelets, brooches. **No pendants, anklets or chains** |
| Earring styles | Not recorded (no stud / hoop / drop field) |
| Price | ₹10,855 – ₹1,04,375 (14 pieces under ₹15,000) |
| Style | Mostly statement pieces (cocktail rings, chokers, brooches, moissanite and lab-diamond settings), not "minimal, delicate, lightweight" |
| Data quality | Every product has SKU, weight, alt text and a description. Ratings and review counts were sample numbers; they are hidden in the new work. |

### Speed (live homepage, measured in a browser at 1024 px, desktop network)
| Measure | Result | Target |
|---|---|---|
| First content / Largest content shown | **11.9 s** | under 2.5 s |
| Layout shift | 0 | under 0.1 ✅ |
| Page fully loaded | 2.2 s | — |
| Download size | 2.6 MB (images 2.4 MB) | — |
| Images | 6 JPG, 2 PNG, 1 WebP; largest 558 KB, 425 KB, 364 KB, 288 KB | WebP/AVIF, ~100–150 KB |

The page itself loads in 2.2 s, but the **intro animation keeps the screen covered until about 12 s**. That alone fails Google's speed test on any device. Mobile will be slower than these desktop numbers.

### SEO problems
1. **Products are not separate pages for Google.** All 50 product addresses are `/#products/…`. Google ignores everything after `#`, so it sees 50 copies of the homepage. The sitemap lists these 50 `#` addresses plus 26 `#collections/…` addresses.
2. Every product and collection page shares the homepage's canonical tag (`/`).
3. Product structured data is added by JavaScript only, after load.
4. Heavy JPG images; no WebP for product photos.
5. Fine already: `robots.txt` (blocks admin, checkout, account; lists the sitemap), alt text on all products, blog pages (real URLs).

### Already built (on this computer, not live)
- `/silver-jewellery/` (all 50) and `/gold-jewellery/` (coming soon), with category pages, filters (finish, price, stone, collection), sort, breadcrumbs, their own titles and descriptions, and the sitemap.
- Gold and Silver mega menus (desktop) and expandable menus (mobile).

## 5. Plan (waiting for your OK)

**Step 1 – Store switch.** A slim rounded pill (Silver | Gold) under the main menu, on every page and on mobile. These are real links. The chosen store is highlighted and remembered while browsing. The colours fade gently: cool white/grey for Silver, warm ivory/beige for Gold.

**Step 2 – Store landing pages.** Each store gets its own hero slider (3 banners, arrows, dots, fade; placeholder banners you replace in admin), plus categories, bestsellers and new arrivals from that metal only. Gold shows "coming soon" until a solid gold product is added.

**Step 3 – Categories.** Rings, Earrings, Necklaces & Pendants, Bracelets, Brooches, Everyday Essentials (pieces under a price you choose), Gifting, and Shop by Price. Anklets, studs, hoops and drops appear automatically once products carry that information; until then they stay hidden, so no empty pages.

**Step 4 – Real product pages for SEO.** `/products/<name>/` for all 50 products, each with its own title, description, canonical, breadcrumb (Home › Silver › Rings › Product) and Product schema (price, availability). The old `#products/…` links keep working and open the new address. The sitemap lists the real addresses.

**Step 5 – Intro text.** 100–150 words for each store and category page, written by me from the real product facts, for you to review before publishing.

**Step 6 – Speed.** Shorten or remove the 12-second intro (your decision). Serve product and banner photos as WebP at the right size, with lazy loading below the fold.

**Step 7 – Search and filters follow the store.** Search results show only the selected store's metal.

**Step 8 – Test loop.**
- Desktop, tablet and mobile.
- Silver shows only silver; Gold shows only gold.
- No broken links; old links still work.
- Titles, H1, canonical and schema checked.
- Search, filters, cart, wishlist and checkout.
- Speed numbers.
Then a final checklist and a local preview, and I wait for your OK to publish.

## 6. Questions before building
1. Your brief says "minimal, delicate, gold and silver". Today's catalogue is statement 925 silver with no solid gold. Will you add the minimal pieces and the gold pieces in admin, or should the stores use the current 50 as they are?
2. May I shorten or remove the intro animation that hides the homepage for about 12 seconds?
3. Should "Everyday Essentials" be "pieces under ₹15,000" (14 today), or something else?

**Answers (28 Nov 2026):**
1. Use the current 50 products: Silver has all 50, and Gold shows "coming soon" until solid gold pieces are added.
2. Intro: shorten it to 1.5 s, make it skippable, and show it once per session.
3. Everyday Essentials: pieces under ₹15,000.
