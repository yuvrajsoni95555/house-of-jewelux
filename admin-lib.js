/* House of Jewelux admin — pure logic (no DOM, no network) so it can be tested in Node: scripts/test_admin_lib.js */
(function (root) {
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const unesc = (s) => String(s)
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  const slugify = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

  // UTF-8 safe base64 for the GitHub contents API (works in browsers and Node 18+)
  const toB64 = (str) => {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  };
  const fromB64 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

  // Every image slot of a product, with its ALT text
  const imageSlots = (p) => {
    const slots = [];
    if (p.image) slots.push({ key: 'image', src: p.image, alt: p.imageAlt || '' });
    if (p.hoverImage) slots.push({ key: 'hoverImage', src: p.hoverImage, alt: p.hoverImageAlt || '' });
    (p.gallery || []).forEach((src, i) => slots.push({ key: 'gallery.' + i, src, alt: (p.galleryAlt || [])[i] || '' }));
    return slots;
  };

  // others = every product except the one being edited
  const validateProduct = (p, others) => {
    const errors = [];
    if (!String(p.name || '').trim()) errors.push('Name is required.');
    if (!/^[A-Za-z0-9-]+$/.test(p.id || '')) errors.push('Product ID may only contain letters, numbers and dashes.');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.handle || '')) errors.push('URL slug must be lowercase letters, numbers and single dashes.');
    if (!(Number.isFinite(p.price) && p.price >= 0)) errors.push('Price must be a number of 0 or more.');
    if (p.compareAtPrice != null && p.compareAtPrice !== '' && !(Number.isFinite(p.compareAtPrice) && p.compareAtPrice >= p.price)) {
      errors.push('Compare-at price must be empty or at least the price.');
    }
    (others || []).forEach((o) => {
      if (o.id && o.id.toLowerCase() === String(p.id).toLowerCase()) errors.push('Another product already uses ID ' + p.id + '.');
      if (o.handle && o.handle === p.handle) errors.push('Another product already uses the slug ' + p.handle + '.');
    });
    return errors;
  };

  const auditProducts = (products) => {
    const issues = [];
    const add = (p, severity, message) => issues.push({ productId: p.id, name: p.name, severity, message });
    const seen = { name: {}, handle: {} };
    products.forEach((p) => {
      imageSlots(p).forEach((s) => { if (!s.alt.trim()) add(p, 'high', 'Missing ALT text: ' + s.key); });
      const d = String(p.description || '').trim();
      if (!d) add(p, 'high', 'Missing description');
      else if (d.length < 70) add(p, 'medium', 'Description is short (' + d.length + ' chars); aim for 70+');
      if (!p.image) add(p, 'high', 'No primary image');
      ['name', 'handle'].forEach((k) => {
        const v = String(p[k] || '').toLowerCase();
        if (v && seen[k][v]) add(p, 'medium', 'Duplicate ' + k + ' with ' + seen[k][v]);
        else if (v) seen[k][v] = p.id;
      });
    });
    return issues;
  };

  // ---- <head> SEO tags in index.html ----
  const HEAD_TAGS = {
    description: ['name', 'description'],
    robots: ['name', 'robots'],
    ogTitle: ['property', 'og:title'],
    ogDescription: ['property', 'og:description'],
    ogImage: ['property', 'og:image'],
    ogUrl: ['property', 'og:url'],
    twitterCard: ['name', 'twitter:card'],
    twitterTitle: ['name', 'twitter:title'],
    twitterDescription: ['name', 'twitter:description'],
    twitterImage: ['name', 'twitter:image']
  };
  const metaRe = (attr, key) => new RegExp('<meta\\s+' + attr + '="' + key.replace(/[.:]/g, '\\$&') + '"\\s+content="([^"]*)"\\s*/?>', 'i');
  const canonRe = /<link\s+rel="canonical"\s+href="([^"]*)"\s*\/?>/i;
  const titleRe = /<title>([\s\S]*?)<\/title>/i;

  const readHeadMeta = (html) => {
    const head = html.split(/<\/head>/i)[0];
    const out = { title: unesc(((head.match(titleRe) || [])[1] || '').trim()), canonical: unesc((head.match(canonRe) || [])[1] || '') };
    Object.entries(HEAD_TAGS).forEach(([k, [a, key]]) => { out[k] = unesc((head.match(metaRe(a, key)) || [])[1] || ''); });
    return out;
  };

  const writeHeadMeta = (html, meta) => {
    const cut = html.search(/<\/head>/i);
    if (cut < 0) throw new Error('index.html has no </head>');
    let head = html.slice(0, cut);
    const rest = html.slice(cut);
    const put = (re, tag, keep) => {
      if (re.test(head)) head = keep ? head.replace(re, tag) : head.replace(re, '');
      else if (keep) head = head.replace(titleRe, (m) => m + '\n  ' + tag);
    };
    if (meta.title != null) head = head.replace(titleRe, '<title>' + esc(meta.title) + '</title>');
    if (meta.canonical != null) put(canonRe, '<link rel="canonical" href="' + esc(meta.canonical) + '">', meta.canonical.trim());
    Object.entries(HEAD_TAGS).forEach(([k, [a, key]]) => {
      if (meta[k] == null) return;
      put(metaRe(a, key), '<meta ' + a + '="' + key + '" content="' + esc(meta[k]) + '">', String(meta[k]).trim());
    });
    return head + rest;
  };

  const auditHead = (m) => {
    const issues = [];
    const add = (severity, message) => issues.push({ productId: null, name: 'Homepage', severity, message });
    if (!m.title) add('high', 'Missing page title');
    else if (m.title.length > 60) add('medium', 'Title is ' + m.title.length + ' chars; Google shows about 60');
    if (!m.description) add('high', 'Missing meta description');
    else if (m.description.length > 160 || m.description.length < 70) add('medium', 'Meta description is ' + m.description.length + ' chars; aim for 70-160');
    if (!m.canonical) add('high', 'Missing canonical URL');
    if (/noindex/i.test(m.robots)) add('high', 'Homepage is set to noindex: Google will drop it');
    if (!m.ogTitle || !m.ogDescription || !m.ogImage) add('medium', 'Open Graph title/description/image incomplete (social sharing previews)');
    return issues;
  };

  // ---- password login on a static site ----
  // The GitHub token is stored only as AES-GCM ciphertext (admin-key.json, publicly readable);
  // the key comes from the admin password via PBKDF2, so the password itself is never stored.
  const bytesToB64 = (u8) => btoa(String.fromCharCode.apply(null, u8));
  const b64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const deriveKey = async (password, salt, iter) => {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  };
  const encryptToken = async (token, password, iter = 600000) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(password, salt, iter), new TextEncoder().encode(token));
    return { v: 1, iter, salt: bytesToB64(salt), iv: bytesToB64(iv), ct: bytesToB64(new Uint8Array(ct)) };
  };
  // Throws on a wrong password (AES-GCM authentication fails)
  const decryptToken = async (blob, password) => {
    const key = await deriveKey(password, b64ToBytes(blob.salt), blob.iter);
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(blob.iv) }, key, b64ToBytes(blob.ct)));
  };

  const lib = { esc, slugify, toB64, fromB64, imageSlots, validateProduct, auditProducts, readHeadMeta, writeHeadMeta, auditHead, encryptToken, decryptToken };
  if (typeof module !== 'undefined' && module.exports) module.exports = lib;
  else root.AdminLib = lib;
})(this);
