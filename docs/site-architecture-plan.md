# House of Jewelux: Website Architecture Audit & Plan

Date: 28 Nov 2026 · Based on the owner's master prompt and the GIVA sitemap reference (used for structure only; no GIVA branding, text or assets). **No code was changed for this audit.**

---

## 1. Audit: what exists today

| Area | Today |
|---|---|
| Site type | One-page app: `index.html` + `app.js` (4,899 lines) + `style.css` (6,955 lines), hash routes (`/#collections/silver`). Blog is the exception: real folders `/blog/<slug>/` built by `scripts/build_blog.js`. |
| Hosting | Website: GitHub Pages (static). API: Vercel (`houseofjewelux.vercel.app`) + Neon Postgres. |
| Routes | `#home`, `#collections/<id>`, `#products/<id>`, `#cart`, `#checkout`, `#wishlist`, `#account`, `#about`, `#craftsmanship`, `#contact`, `#faq`, `#track-order`, `#appointment`, 18 policy routes, `#p/<slug>` (Studio landing pages), `/blog/…`. |
| Catalogue | **50 products**, 10 each: rings, earrings, necklaces, bracelets, brooches. No pendants or chains. |
| Metals | **All 50 are 925 sterling silver.** 33 rhodium finish, **17 micron gold-plated silver**. **0 solid gold.** |
| Product fields | metal, purity, stone, dimensions, weight, SKU, collections (17 tags), badge. **Missing:** occasion, style, recipient (for her/him), gender, colour. |
| Collections | 17 tags already on products (fine 31, contemporary 28, modern art 24, architectural 22, bridal 17, everyday luxury 17, nature 17, statement 11, animal 11, heritage 8, traditional 8, floral 6, bird 5, peacock 4, temple 3, south-indian temple 3, butterfly 3). |
| Cart / checkout | One cart for everything; checkout via the API (Razorpay keys not added yet, so online payment is off). |
| Account | Browser-side login stub + API register/login. No order history page yet. |
| Admin | Products, Design Studio (edits any element of any page by CSS selector), Media, SEO, Business sections, Dashboard. |
| SEO | Hash URLs are not indexed as separate pages by Google; only `/` and `/blog/…` are real pages. Sitemap has 92 URLs. |

### Problems found
1. **"Gold Jewellery" today is gold-plated silver.** `categories.json` describes it as "forged in rich 18K and 22K gold". Per your own rule ("do not classify gold-plated silver as solid gold") this text is wrong and must change.
2. **Ratings and review counts on all 50 products are sample numbers.** Per your earlier rule, no fake numbers: hide them until real reviews exist.
3. Pendants, chains, occasion, style and gift-recipient data do not exist, so those menus would be empty or invented.
4. Design Studio edits are tied to today's page structure. Rebuilding the header or homepage from scratch would **wipe your Studio customisations**, which you asked me never to touch.

## 2. Target sitemap

```
HOUSE OF JEWELUX
├─ Home
├─ Silver Jewellery         /silver-jewellery/  (+ /necklaces /earrings /rings /bracelets /brooches)
├─ Gold-plated Jewellery    /gold-jewellery/    (same categories; label decided by you, see §4)
├─ Collections              /collections/  (+ one page per collection tag)
├─ Gifts                    /gifts/  (+ for-her, for-him, couples, mother, wife, birthday, anniversary, wedding, festive, under-15000 …)
├─ About                    /our-story/ (story, craftsmanship, promise, quality)
├─ Journal                  /blog/ (exists)
├─ Customer support         /faq/ /contact-us/ /shipping-policy/ /returns-policy/ /exchange-policy/ /track-order/ …
├─ My account               /account/ (login, orders, wishlist, addresses)
├─ Shopping                 search, product page, cart, checkout, confirmation (one cart for silver + gold-plated)
└─ Footer & policies        privacy, terms, shipping, returns, exchange, cancellation, payment, disclaimer, sitemap
```

## 3. How it will be built (keeping what exists)

- **Real URLs on GitHub Pages:** extend the blog build script so every route above gets its own folder page (`/silver-jewellery/rings/index.html`) with its own title, description, canonical, breadcrumb and structured data, exactly like the blog pages today. Old hash links (`#collections/silver`) keep working and point to the new URLs.
- **Header:** add mega menus (Silver, Gold-plated, Collections, Gifts) to the existing header; mobile gets expandable groups. The current header design, logo and Studio edits stay.
- **Store pages:** reuse the existing collection page and product card, add filters (category, price, stone, collection, finish) and sort (new, bestselling, price). Silver pages get a pearl/ivory accent, gold-plated pages a champagne accent, within today's brand palette.
- **Gifts, occasion, style:** add these as editable fields per product in the admin (Products → editor), so menus fill from real data, not guesses.
- **Admin:** a "Navigation" screen to show, hide, reorder and rename menu items and mega-menu links; homepage section order stays in Design Studio.
- **Never:** delete products, orders or customers; change prices; break checkout; remove Design Studio edits; invent product facts.

## 4. Decisions needed from the owner
1. Name of the second store, since no product is solid gold.
2. Whether to hide the sample ratings and review counts.

## 5. Phases
| Phase | Work |
|---|---|
| A | Real URLs + header mega menus + Silver and Gold-plated stores with category pages, filters, sort, breadcrumbs, SEO |
| B | Collections directory + one page per collection; Gifts (after recipient/occasion fields are filled in admin) |
| C | Support, About, policy pages on real URLs; footer + HTML sitemap; 301-style redirects from old hash links |
| D | My account: order history from the API, saved addresses; admin Navigation editor |
| E | Responsive test pass (desktop, laptop, tablet, mobile) and final reports |

## 6. Status (28 Nov 2026)

Owner decisions: second store = **Gold-Plated Silver**; sample ratings **hidden**.

**Phase A done (local, waiting for "Push to main"):**
- `/silver-jewellery/` (33 pieces) and `/gold-plated-jewellery/` (17 pieces), each with category pages (necklaces, earrings, rings, bracelets, brooches): 12 real pages with their own title, description, canonical, breadcrumb and CollectionPage/ItemList data; added to `sitemap.xml`.
- Filters: price, stone (moissanite, diamond, pearl, emerald/sapphire/ruby, from each product's own stone text), collection; sort: featured, new, bestselling, price. Mobile gets a "Filters" panel.
- Header mega menus: Silver, Gold-Plated, Collections, Our Story (+ Journal link). Mobile menu: expandable Silver, Gold-Plated, Collections groups.
- Old links (`#collections/gold`, `#collections/silver`, `/gold-jewellery/`) open the new stores.
- Honesty fixes: "Gold Jewellery (18K & 22K)" and "forged in 18K and 22K gold" → Gold-Plated Silver; "Certified VVS1" diamond claim removed; non-working Occasion filter buttons removed; sample star ratings and the rating sort hidden.

**Still to do:** Phase B (collections directory pages, Gifts after recipient/occasion fields), C (support/about/policy pages on real URLs, HTML sitemap), D (account order history, admin Navigation editor), E (full responsive report).

**Found, not changed (homepage design is the owner's):** the homepage hero slides say "22K Antique Gold & Zambian Emeralds" and similar; every product is 925 silver, so these lines need new wording.
