// Self-check for admin-lib.js:  node scripts/test_admin_lib.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const L = require('../admin-lib.js');

// base64 round-trip keeps non-ASCII (₹, —, Hindi) intact
const s = 'House of Jewelux — ₹15,448 • आभूषण';
assert.strictEqual(L.fromB64(L.toB64(s)), s);

assert.strictEqual(L.slugify('The Celestial Radiance 925 Ring!'), 'the-celestial-radiance-925-ring');

// validation
const base = { id: 'HJ-1', handle: 'ring-one', name: 'Ring', price: 100 };
assert.deepStrictEqual(L.validateProduct(base, []), []);
assert.ok(L.validateProduct({ ...base, price: NaN }, []).length);
assert.ok(L.validateProduct({ ...base, compareAtPrice: 50 }, []).length);
assert.ok(L.validateProduct({ ...base, handle: 'Bad Slug' }, []).length);
assert.ok(L.validateProduct(base, [{ id: 'hj-1', handle: 'x' }]).some((e) => /ID/.test(e)));
assert.ok(L.validateProduct(base, [{ id: 'X', handle: 'ring-one' }]).some((e) => /slug/.test(e)));

// audit flags missing ALT per slot, and stops once ALT is set
const p = { id: 'A', name: 'A', handle: 'a', image: 'i.jpg', gallery: ['g0.jpg', 'g1.jpg'], galleryAlt: ['', 'ok'], description: 'x'.repeat(80) };
assert.deepStrictEqual(L.auditProducts([p]).map((i) => i.message), ['Missing ALT text: image', 'Missing ALT text: gallery.0']);
assert.strictEqual(L.auditProducts([{ ...p, imageAlt: 'a', galleryAlt: ['b', 'c'] }]).length, 0);

// head meta: read the real index.html, write changes, read them back, rest of file untouched
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = L.readHeadMeta(html);
assert.ok(m.title.startsWith('House of Jewelux'));
assert.strictEqual(m.canonical, 'https://houseofjewelux.com/');
const out = L.writeHeadMeta(html, { title: 'New "Title" & Co', description: 'Desc', ogTitle: 'OG', ogImage: 'https://x/y.jpg', robots: '' });
const m2 = L.readHeadMeta(out);
assert.strictEqual(m2.title, 'New "Title" & Co');
assert.strictEqual(m2.description, 'Desc');
assert.strictEqual(m2.ogTitle, 'OG');
assert.strictEqual(m2.ogImage, 'https://x/y.jpg');
assert.strictEqual(out.split(/<\/head>/i)[1], html.split(/<\/head>/i)[1], 'body must not change');
assert.strictEqual(L.writeHeadMeta(out, { robots: 'noindex' }).includes('<meta name="robots" content="noindex">'), true);
assert.ok(L.auditHead({ ...m2, robots: 'noindex' }).some((i) => /noindex/.test(i.message)));

console.log('admin-lib: all checks passed');
