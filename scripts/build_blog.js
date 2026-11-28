#!/usr/bin/env node
/**
 * Blog builder: content/blog/*.md  ->  data/blog.json, blog/index.html, blog/<slug>/index.html, blog/rss.xml, sitemap.xml
 *
 * Run after adding or editing a post (and after changing index.html, since the blog pages are copies of it):
 *     node scripts/build_blog.js
 * No dependencies. The blog pages are the normal website shell with their own <title>, meta, Open Graph,
 * canonical URL, JSON-LD and the article pre-rendered for search engines; app.js renders the interactive page.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://houseofjewelux.com';
const SRC = path.join(ROOT, 'content', 'blog');

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const SAFE_URL = /^(https:\/\/|\/(?!\/)|#|mailto:|tel:)/i;

// ---------- frontmatter (a small YAML subset: key: value, [a, b] lists, true/false, quoted strings) ----------
function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) throw new Error('missing --- frontmatter --- block');
  const data = {};
  m[1].split(/\r?\n/).forEach((line) => {
    const kv = /^([A-Za-z][\w]*):\s*(.*)$/.exec(line.trim());
    if (!kv) return;
    let v = kv[2].trim();
    if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    else if (v === 'true' || v === 'false') v = v === 'true';
    else v = v.replace(/^["']|["']$/g, '');
    data[kv[1]] = v;
  });
  return { data, body: m[2] };
}

// ---------- markdown (headings, paragraphs, lists, blockquotes, code, images with captions, links, bold/italic) ----------
function inline(s) {
  let out = esc(s);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => (SAFE_URL.test(src) ? `<img src="${src}" alt="${alt}" loading="lazy">` : alt));
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, href) => {
    const raw = href.replace(/&amp;/g, '&');
    if (!SAFE_URL.test(raw)) return t;
    return `<a href="${href}"${/^https:/.test(raw) ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return out;
}
function markdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const html = []; const toc = []; const used = new Set();
  let para = []; let list = null; let quote = []; let code = null;
  const flushPara = () => { if (para.length) { html.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list) { html.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`); list = null; } };
  const flushQuote = () => { if (quote.length) { html.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`); quote = []; } };
  const flush = () => { flushPara(); flushList(); flushQuote(); };
  for (const line of lines) {
    if (code) {
      if (/^```/.test(line)) { html.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`); code = null; } else code.push(line);
      continue;
    }
    if (/^```/.test(line)) { flush(); code = []; continue; }
    let m;
    if ((m = /^(#{2,4})\s+(.+)$/.exec(line))) {
      flush();
      const level = m[1].length; let id = slugify(m[2]) || 'section'; let n = 2; while (used.has(id)) id = slugify(m[2]) + '-' + n++;
      used.add(id);
      if (level <= 3) toc.push({ id, text: m[2].replace(/[*`]/g, ''), level });
      html.push(`<h${level} id="${id}">${inline(m[2])}</h${level}>`);
      continue;
    }
    if ((m = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/.exec(line))) {
      flush();
      if (SAFE_URL.test(m[2])) html.push(`<figure><img src="${esc(m[2])}" alt="${esc(m[1])}" loading="lazy">${m[3] ? `<figcaption>${inline(m[3])}</figcaption>` : ''}</figure>`);
      continue;
    }
    if ((m = /^>\s?(.*)$/.exec(line))) { flushPara(); flushList(); quote.push(m[1]); continue; }
    if ((m = /^\s*[-*]\s+(.+)$/.exec(line)) || (m = /^\s*\d+[.)]\s+(.+)$/.exec(line))) {
      flushPara(); flushQuote();
      const tag = /^\s*\d/.test(line) ? 'ol' : 'ul';
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
      list.items.push(m[1]);
      continue;
    }
    if (/^\s*(---|\*\*\*)\s*$/.test(line)) { flush(); html.push('<hr>'); continue; }
    if (!line.trim()) { flush(); continue; }
    flushList(); flushQuote(); para.push(line.trim());
  }
  if (code) html.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);
  flush();
  return { html: html.join('\n'), toc };
}

// Self-check of the markdown rules (runs on every build; a failure stops the build)
(function selfCheck() {
  const assert = (ok, what) => { if (!ok) throw new Error('markdown self-check failed: ' + what); };
  const r = markdown('## Hello *World*\n\nA **b** [x](https://e.com) and [bad](javascript:alert(1)).\n\n- one\n- two\n\n> quote\n\n![Alt](/images/a.jpg "Cap")\n\n```\n<b>\n```\n## Hello World');
  assert(r.html.includes('<h2 id="hello-world">Hello <em>World</em></h2>'), 'heading + id');
  assert(r.html.includes('<strong>b</strong>') && r.html.includes('href="https://e.com"'), 'inline');
  assert(!r.html.includes('javascript:'), 'unsafe link removed');
  assert(r.html.includes('<ul><li>one</li><li>two</li></ul>'), 'list');
  assert(r.html.includes('<blockquote><p>quote</p></blockquote>'), 'quote');
  assert(r.html.includes('<figcaption>Cap</figcaption>'), 'figure');
  assert(r.html.includes('&lt;b&gt;'), 'code escaped');
  assert(r.toc.length === 2 && r.toc[1].id === 'hello-world-2', 'toc + unique ids');
  assert(parseFrontmatter('---\ntags: [a, b]\nfeatured: true\ntitle: "X: y"\n---\nbody').data.title === 'X: y', 'frontmatter');
})();

// ---------- read posts ----------
const REQUIRED = ['title', 'slug', 'excerpt', 'date', 'author', 'category', 'coverImage'];
const files = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter((f) => /\.md$/i.test(f) && !/^readme/i.test(f)) : [];
const posts = [];
for (const f of files) {
  const { data, body } = parseFrontmatter(fs.readFileSync(path.join(SRC, f), 'utf8'));
  const missing = REQUIRED.filter((k) => !data[k]);
  if (missing.length) throw new Error(`${f}: missing ${missing.join(', ')}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) throw new Error(`${f}: date must be YYYY-MM-DD`);
  const slug = slugify(data.slug);
  if (data.draft === true) { console.log(`skip draft: ${f}`); continue; }
  if (posts.some((p) => p.slug === slug)) throw new Error(`${f}: duplicate slug ${slug}`);
  const { html, toc } = markdown(body);
  const words = body.replace(/[#>*`\-[\]()!]/g, ' ').split(/\s+/).filter(Boolean).length;
  posts.push({
    slug, title: data.title, excerpt: data.excerpt, date: data.date, updated: data.updated || data.date,
    author: data.author, authorAvatar: data.authorAvatar || '', authorBio: data.authorBio || '',
    category: data.category, tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
    coverImage: data.coverImage, coverAlt: data.coverAlt || data.title, featured: data.featured === true,
    readingTime: Math.max(1, Math.round(words / 200)), words, toc, html
  });
}
posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

// ---------- data for the app ----------
fs.writeFileSync(path.join(ROOT, 'data', 'blog.json'), JSON.stringify({ generated: new Date().toISOString(), posts }, null, 1) + '\n');

// ---------- static pages: the site shell with the page's own SEO tags and pre-rendered content ----------
const shell = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const abs = (u) => (/^https:\/\//.test(u) ? u : SITE + '/' + String(u).replace(/^\//, ''));
const fmtDate = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
function page({ title, desc, url, image, type, ld, body }) {
  const head = [
    '<base href="/">',
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="${type}">`, `<meta property="og:site_name" content="House of Jewelux">`,
    `<meta property="og:title" content="${esc(title)}">`, `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${url}">`, `<meta property="og:image" content="${esc(abs(image))}">`,
    `<meta name="twitter:card" content="summary_large_image">`, `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`, `<meta name="twitter:image" content="${esc(abs(image))}">`,
    `<link rel="alternate" type="application/rss+xml" title="House of Jewelux Blog" href="${SITE}/blog/rss.xml">`,
    `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`
  ].join('\n  ');
  let out = shell
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
    .replace(/\s*<link rel="canonical" href="[^"]*">/, '')
    .replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n  ${head}`)
    .replace(/(<main id="app-view">)[\s\S]*?(<\/main>)/, (_, open, close) => `${open}\n${body}\n  ${close}`); // a function, so "$" in posts stays literal
  if (!out.includes('<base href="/">') || !out.includes(body.slice(0, 40))) throw new Error('index.html changed shape: could not build the blog shell');
  return out;
}
const write = (rel, content) => { const p = path.join(ROOT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); };

// remove pages of posts that no longer exist (or became drafts)
const blogDir = path.join(ROOT, 'blog');
if (fs.existsSync(blogDir)) fs.readdirSync(blogDir, { withFileTypes: true }).filter((d) => d.isDirectory() && !posts.some((p) => p.slug === d.name))
  .forEach((d) => fs.rmSync(path.join(blogDir, d.name), { recursive: true, force: true }));

const LIST_TITLE = 'Blog | House of Jewelux';
const LIST_DESC = 'Jewellery care, style guides and stories of Indian craft from the House of Jewelux atelier in Jaipur.';
write('blog/index.html', page({
  title: LIST_TITLE, desc: LIST_DESC, url: SITE + '/blog/', image: posts[0] ? posts[0].coverImage : '/images/house_of_jewelux_official_logo.png', type: 'website',
  ld: { '@context': 'https://schema.org', '@type': 'Blog', name: 'House of Jewelux Blog', url: SITE + '/blog/', blogPost: posts.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE}/blog/${p.slug}/`, datePublished: p.date })) },
  body: `<section class="container blog-pre"><h1>Blog</h1><p>${esc(LIST_DESC)}</p><ul>${posts.map((p) => `<li><a href="/blog/${p.slug}/">${esc(p.title)}</a> <time datetime="${p.date}">${fmtDate(p.date)}</time><p>${esc(p.excerpt)}</p></li>`).join('')}</ul></section>`
}));
for (const p of posts) {
  const url = `${SITE}/blog/${p.slug}/`;
  write(`blog/${p.slug}/index.html`, page({
    title: `${p.title} | House of Jewelux Blog`, desc: p.excerpt, url, image: p.coverImage, type: 'article',
    ld: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.excerpt, image: [abs(p.coverImage)], datePublished: p.date, dateModified: p.updated,
      author: { '@type': 'Organization', name: p.author }, publisher: { '@type': 'Organization', name: 'House of Jewelux', logo: { '@type': 'ImageObject', url: SITE + '/images/house_of_jewelux_official_logo.png' } },
      mainEntityOfPage: url, articleSection: p.category, keywords: p.tags.join(', '), wordCount: p.words },
    body: `<article class="container blog-pre"><p><a href="/blog/">← All articles</a></p><h1>${esc(p.title)}</h1><p>${esc(p.author)} · <time datetime="${p.date}">${fmtDate(p.date)}</time> · ${p.readingTime} min read</p><img src="${esc(p.coverImage)}" alt="${esc(p.coverAlt)}">${p.html}</article>`
  }));
}

// ---------- storefront pages: /silver-jewellery/, /gold-plated-jewellery/ and one page per category (data/stores.json) ----------
const storeCfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'stores.json'), 'utf8'));
const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'products.json'), 'utf8')).filter((p) => p.status !== 'draft');
// same rules as app.js: Silver = every 925 silver piece (rhodium or gold-plated), Gold = solid gold only
const isSilver = (p) => /silver|925/i.test(p.metal || '');
const isSolidGold = (p) => /gold/i.test(p.metal || '') && !isSilver(p) && !/plated|vermeil/i.test(p.metal || '');
const storeUrls = [];
const money = (n) => '₹' + Number(n).toLocaleString('en-IN');
for (const s of storeCfg.stores) {
  const items = products.filter((p) => (s.finish === 'gold' ? isSolidGold(p) : isSilver(p)));
  const pages = [{ cat: null, list: items }].concat(storeCfg.categories.map((c) => ({ cat: c, list: items.filter((p) => p.category === c.id) })).filter((x) => x.list.length));
  for (const { cat, list } of pages) {
    const rel = `${s.slug}/${cat ? cat.id + '/' : ''}`;
    const url = `${SITE}/${rel}`;
    const name = cat ? `${s.menu} ${cat.name}` : s.name;
    const crumbs = [['Home', SITE + '/'], [s.name, `${SITE}/${s.slug}/`]].concat(cat ? [[cat.name, url]] : []);
    write(`${rel}index.html`, page({
      title: cat ? `${name} | House of Jewelux` : s.seoTitle, desc: cat ? `${name}: ${s.tagline}` : s.seoDesc, url, image: s.hero, type: 'website',
      ld: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name, url, description: s.tagline,
        mainEntity: { '@type': 'ItemList', numberOfItems: list.length, itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: `${SITE}/#products/${p.handle || p.id}` })) } },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: u })) }],
      body: `<section class="container blog-pre"><p>${crumbs.map(([n, u]) => `<a href="${u.replace(SITE, '')}">${esc(n)}</a>`).join(' / ')}</p><h1>${esc(name)}</h1><p>${esc(s.tagline)}</p>${list.length ? '' : `<p>${esc(s.comingSoon || '')}</p>`}<ul>${list.map((p) => `<li><a href="/#products/${esc(p.handle || p.id)}">${esc(p.name)}</a> ${money(p.price)} · ${esc(p.metal)}</li>`).join('')}</ul></section>`
    }));
    storeUrls.push({ loc: url, pri: cat ? '0.7' : '0.8' });
  }
}
// /gold-plated-jewellery/ (an earlier address) now opens Silver with the gold-plated finish selected
write('gold-plated-jewellery/index.html', `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Gold-plated silver | House of Jewelux</title><meta name="robots" content="noindex"><link rel="canonical" href="${SITE}/silver-jewellery/"><meta http-equiv="refresh" content="0; url=/silver-jewellery/?finish=gold-plated"></head><body><a href="/silver-jewellery/?finish=gold-plated">Gold-plated silver</a></body></html>
`);

// ---------- 404.html: GitHub Pages serves it for unknown addresses, so a mistyped /blog/<slug>/ shows "Article not found" ----------
write('404.html', shell
  .replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n  <base href="/">\n  <meta name="robots" content="noindex">')
  .replace(/<title>[\s\S]*?<\/title>/, '<title>Page not found | House of Jewelux</title>')
  .replace(/\s*<link rel="canonical" href="[^"]*">/, ''));

// ---------- RSS ----------
write('blog/rss.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>House of Jewelux Blog</title><link>${SITE}/blog/</link><description>${esc(LIST_DESC)}</description><language>en-in</language>
<atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${posts.map((p) => `<item><title>${esc(p.title)}</title><link>${SITE}/blog/${p.slug}/</link><guid>${SITE}/blog/${p.slug}/</guid><pubDate>${new Date(p.date + 'T00:00:00Z').toUTCString()}</pubDate><category>${esc(p.category)}</category><description>${esc(p.excerpt)}</description></item>`).join('\n')}
</channel></rss>
`);

// ---------- sitemap: the blog block between markers is rebuilt, the rest is kept ----------
const smPath = path.join(ROOT, 'sitemap.xml');
if (fs.existsSync(smPath)) {
  let sm = fs.readFileSync(smPath, 'utf8').replace(/\s*<!-- blog:start -->[\s\S]*?<!-- blog:end -->/, '').replace(/\s*<!-- stores:start -->[\s\S]*?<!-- stores:end -->/, '');
  const today = new Date().toISOString().slice(0, 10);
  sm = sm.replace(/\s*<\/urlset>\s*$/, `\n  <!-- stores:start -->\n${storeUrls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${u.pri}</priority>\n  </url>`).join('\n')}\n  <!-- stores:end -->\n</urlset>\n`);
  const urls = [{ loc: SITE + '/blog/', lastmod: posts[0] ? posts[0].updated : new Date().toISOString().slice(0, 10), pri: '0.7' }, ...posts.map((p) => ({ loc: `${SITE}/blog/${p.slug}/`, lastmod: p.updated, pri: '0.6' }))];
  const block = `\n  <!-- blog:start -->\n${urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${u.pri}</priority>\n  </url>`).join('\n')}\n  <!-- blog:end -->`;
  sm = sm.replace(/\s*<\/urlset>\s*$/, `${block}\n</urlset>\n`);
  fs.writeFileSync(smPath, sm);
}

console.log(`blog: ${posts.length} posts → data/blog.json, blog/index.html, ${posts.length} post pages, blog/rss.xml; stores: ${storeUrls.length} pages; sitemap.xml`);
