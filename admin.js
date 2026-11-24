/* House of Jewelux admin panel.
   The site is static (GitHub Pages), so the repository is the database: every save is a commit
   through the GitHub API, and GitHub itself enforces who may write (the token's repo permission). */
(function () {
  const REPO = 'yuvrajsoni95555/house-of-jewelux';
  const BRANCH = 'main';
  const L = window.AdminLib;
  const esc = L.esc;
  const $ = (s, r = document) => r.querySelector(s);
  const STOCK = ['In Stock', 'Out of Stock', 'Made to Order', 'Pre-order'];
  const SITE = 'https://houseofjewelux.com';

  const state = { token: sessionStorage.getItem('hj_gh_token') || '', products: null, productsSha: null, html: null, htmlSha: null, robots: null, robotsSha: null, previews: {} };

  // ---------- GitHub ----------
  async function gh(path, opts = {}) {
    const res = await fetch('https://api.github.com' + path, {
      ...opts,
      cache: 'no-store',
      headers: { Authorization: 'Bearer ' + state.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) }
    });
    if (res.status === 401) { signOut(location.hash === '#setup' ? 'GitHub did not accept this token.' : 'Admin access has expired. It needs to be set up again.'); throw new Error('Unauthorized'); }
    const body = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error((body && body.message) || res.statusText);
      err.status = res.status;
      throw err;
    }
    return body;
  }

  async function getFile(path) {
    const j = await gh(`/repos/${REPO}/contents/${path}?ref=${BRANCH}`);
    let content = j.content;
    if (!content && j.size > 0) content = (await gh(`/repos/${REPO}/git/blobs/${j.sha}`)).content; // files over 1 MB
    return { text: L.fromB64(content), sha: j.sha };
  }

  async function putFile(path, b64, sha, message) {
    try {
      const j = await gh(`/repos/${REPO}/contents/${path}`, { method: 'PUT', body: JSON.stringify({ message, content: b64, branch: BRANCH, ...(sha ? { sha } : {}) }) });
      return j.content.sha;
    } catch (e) {
      if (e.status === 409 || (e.status === 422 && /sha/i.test(e.message))) {
        throw new Error('This file was changed somewhere else after you opened it. Reload the page and make your change again. Nothing was saved.');
      }
      // Fine-grained tokens report the user's repo rights on read, so a read-only token only fails here, at the first write
      if (e.status === 403) {
        throw new Error('This GitHub token can read but is not allowed to save. On GitHub, edit the token: Repository permissions → Contents → "Read and write". Nothing was saved.');
      }
      throw e;
    }
  }

  const loadProducts = async () => { const f = await getFile('data/products.json'); state.products = JSON.parse(f.text); state.productsSha = f.sha; };
  const loadHtml = async () => { const f = await getFile('index.html'); state.html = f.text; state.htmlSha = f.sha; };
  const saveProducts = async (list, message) => {
    state.productsSha = await putFile('data/products.json', L.toB64(JSON.stringify(list, null, 2) + '\n'), state.productsSha, message);
    state.products = list;
  };

  // ---------- UI helpers ----------
  let toastTimer;
  function toast(msg, bad) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast' + (bad ? ' bad' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), bad ? 9000 : 4500);
  }
  const imgSrc = (p) => state.previews[p] || (!p ? '' : /^(https?:|\/|blob:|data:)/.test(p) ? p : '/' + p);
  const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
  const view = $('#view');
  async function busy(btn, fn) {
    if (btn) btn.disabled = true;
    try { await fn(); } catch (e) { if (e.message !== 'Unauthorized') toast(e.message, true); } finally { if (btn) btn.disabled = false; }
  }
  function show(name, arg) {
    if (editorDirty && !confirm('You have unsaved changes to this product. Leave without saving?')) return Promise.resolve();
    editorDirty = false;
    if (fitObserver) { fitObserver.disconnect(); fitObserver = null; }
    view.classList.toggle('wide', name === 'editor');
    const navName = name === 'editor' ? 'products' : name;
    document.querySelectorAll('.side nav button').forEach((b) => {
      if (b.dataset.view === navName) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    $('#side').classList.remove('open');
    $('#menu').setAttribute('aria-expanded', 'false');
    view.innerHTML = '<div class="skel" style="height:40px;width:40%;margin-bottom:24px"></div><div class="skel" style="height:120px;margin-bottom:16px"></div><div class="skel" style="height:280px"></div>';
    return busy(null, () => VIEWS[name](arg)).then(() => view.focus({ preventScroll: true }));
  }

  // ---------- Sign in ----------
  async function signIn(token) {
    state.token = token;
    const repo = await gh(`/repos/${REPO}`);
    if (!repo.permissions || !repo.permissions.push) throw new Error('This token can read the repository but cannot save changes. Give it "Contents: Read and write".');
    sessionStorage.setItem('hj_gh_token', token);
    $('#who').textContent = 'Signed in as Admin';
    document.body.classList.remove('auth');
    $('#login').classList.add('hidden');
    $('#setup').classList.add('hidden');
    $('#app').classList.remove('hidden');
    await loadProducts();
    show('dashboard');
  }
  function signOut(msg) {
    sessionStorage.removeItem('hj_gh_token');
    state.token = '';
    const setup = location.hash === '#setup';
    document.body.classList.add('auth');
    $('#app').classList.add('hidden');
    $('#login').classList.toggle('hidden', setup);
    $('#setup').classList.toggle('hidden', !setup);
    ['#login-error', '#setup-error'].forEach((s) => $(s).classList.add('hidden'));
    const e = $(setup ? '#setup-error' : '#login-error');
    e.textContent = msg || '';
    e.classList.toggle('hidden', !msg);
  }

  // Username + password -> GitHub token, via the encrypted admin-key.json
  async function passwordLogin(username, password) {
    const res = await fetch('/admin-key.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('Admin login has not been set up yet. Use "Forgot Password?" to set it up.');
    let token;
    try { token = await L.decryptToken(await res.json(), username, password); } catch (e) { throw new Error('Invalid username or password.'); }
    await signIn(token);
  }

  // Save first, open the panel only after: the save is the only real proof the token can write
  async function setupLogin(token, username, pass) {
    state.token = token;
    await gh(`/repos/${REPO}`);
    let sha = null;
    try { sha = (await gh(`/repos/${REPO}/contents/admin-key.json?ref=${BRANCH}`)).sha; } catch (e) { if (e.status !== 404) throw e; }
    const blob = await L.encryptToken(token, username, pass);
    await putFile('admin-key.json', L.toB64(JSON.stringify(blob, null, 2) + '\n'), sha, 'admin: set admin login');
    history.replaceState(null, '', location.pathname);
    await signIn(token);
    toast('Login saved. From now on sign in with your username and password (live on the website in about a minute).');
  }

  const EYE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const EYE_OFF = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  document.querySelectorAll('[data-toggle-pw]').forEach((b) => { b.innerHTML = EYE; });

  // ---------- Views ----------
  const VIEWS = {};

  VIEWS.dashboard = async () => {
    if (!state.html) await loadHtml();
    const P = state.products;
    const drafts = P.filter((p) => p.status === 'draft').length;
    const outList = P.filter((p) => p.stockStatus === 'Out of Stock');
    const productIssues = L.auditProducts(P);
    const headIssues = L.auditHead(L.readHeadMeta(state.html));
    const slots = P.reduce((n, p) => n + L.imageSlots(p).length, 0);
    const missingAlt = productIssues.filter((i) => /ALT/.test(i.message)).length;
    const altPct = slots ? Math.round(((slots - missingAlt) / slots) * 100) : 100;
    const descPct = P.length ? Math.round((P.filter((p) => String(p.description || '').trim().length >= 70).length / P.length) * 100) : 100;
    const headPct = Math.max(0, 100 - headIssues.length * 20);
    const score = Math.round((altPct + descPct + headPct) / 3);
    const byCat = {};
    P.forEach((p) => { byCat[p.category || 'other'] = (byCat[p.category || 'other'] || 0) + 1; });
    const maxCat = Math.max(1, ...Object.values(byCat));
    let commits = [];
    try { commits = await gh(`/repos/${REPO}/commits?sha=${BRANCH}&per_page=6`); } catch (e) { /* activity is optional */ }
    const card = (num, label, go) => `<button class="card" data-go="${go}"><div class="num">${num}</div><div class="lbl">${label}</div></button>`;
    view.innerHTML = `
      <div class="page-head"><div><h1>Dashboard</h1><p>Your catalogue and website health at a glance.</p></div>
        <button class="btn btn-primary" data-action="new-product">+ Add product</button></div>
      <div class="cards">
        ${card(P.length, 'Total products', 'products')}
        ${card(P.length - drafts, 'Published', 'products')}
        ${card(drafts, 'Drafts (hidden)', 'products')}
        ${card(outList.length, 'Out of stock', 'products')}
        ${card(productIssues.length + headIssues.length, 'SEO issues', 'audit')}
      </div>
      <div class="dash">
        <div>
          <div class="panel"><h3>Products by category</h3>
            <div class="bars">${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, n]) =>
              `<div class="bar"><span>${esc(c)}</span><div class="track"><div class="fill" style="width:${(n / maxCat) * 100}%"></div></div><b>${n}</b></div>`).join('')}</div>
          </div>
          <div class="panel"><h3>Recent changes</h3>
            <ul class="log">${commits.map((c) => `<li><b>${esc(c.commit.message.split('\n')[0])}</b><br><span class="small muted">${esc(new Date(c.commit.author.date).toLocaleString('en-IN'))}</span></li>`).join('') || '<li class="muted">No activity available.</li>'}</ul>
          </div>
        </div>
        <div>
          <div class="panel"><h3>SEO health</h3>
            <div class="health"><div class="ring" style="--v:${score}"><span>${score}</span></div>
              <div class="small"><div>Image ALT text: <b>${altPct}%</b></div><div>Good descriptions: <b>${descPct}%</b></div><div>Homepage tags: <b>${headPct}%</b></div></div></div>
            <button class="btn btn-sm" data-go="audit">Open SEO audit</button>
          </div>
          <div class="panel"><h3>Inventory alerts</h3>
            ${outList.length ? `<ul class="log">${outList.slice(0, 6).map((p) => `<li><a href="#" data-edit="${esc(p.id)}">${esc(p.name)}</a></li>`).join('')}</ul>` : '<p class="muted" style="margin:0">All products are in stock.</p>'}
          </div>
          <div class="panel"><h3>Quick actions</h3>
            <div class="quick">
              <button class="btn" data-action="new-product">Add product</button>
              <button class="btn" data-go="seo">Homepage SEO</button>
              <button class="btn" data-go="audit">SEO audit</button>
              <a class="btn" href="/" target="_blank" rel="noopener">View website ↗</a>
            </div>
          </div>
        </div>
      </div>
      <p class="note small">Orders, revenue, customers and traffic are not shown: the website is a static site with no server to record them yet.</p>`;
  };

  VIEWS.products = async () => {
    const issues = L.auditProducts(state.products);
    const altCount = {};
    issues.forEach((i) => { if (/ALT/.test(i.message)) altCount[i.productId] = (altCount[i.productId] || 0) + 1; });
    const cats = [...new Set(state.products.map((p) => p.category).filter(Boolean))].sort();
    view.innerHTML = `
      <div class="page-head"><div><h1>Products</h1><p>${state.products.length} products · click one to edit it with a live preview.</p></div>
        <button class="btn btn-primary" data-action="new-product">+ Add product</button></div>
      <div class="toolbar">
        <input id="q" type="search" placeholder="Search name, SKU or ID" aria-label="Search products">
        <select id="f-cat" aria-label="Category"><option value="">All categories</option>${cats.map((c) => `<option>${esc(c)}</option>`).join('')}</select>
        <select id="f-state" aria-label="Filter">
          <option value="">All products</option><option value="published">Published</option><option value="draft">Drafts</option>
          <option value="out">Out of stock</option><option value="alt">Missing ALT text</option>
        </select>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th style="width:72px"></th><th>Name</th><th class="hide-sm">SKU</th><th class="hide-sm">Category</th><th>Price</th><th>Status</th><th class="hide-sm">ALT</th></tr></thead>
        <tbody id="rows"></tbody>
      </table></div>`;
    const render = () => {
      const q = $('#q').value.trim().toLowerCase();
      const cat = $('#f-cat').value;
      const f = $('#f-state').value;
      const rows = state.products.filter((p) =>
        (!q || [p.name, p.sku, p.id].some((v) => String(v || '').toLowerCase().includes(q))) &&
        (!cat || p.category === cat) &&
        (!f || (f === 'published' && p.status !== 'draft') || (f === 'draft' && p.status === 'draft') ||
          (f === 'out' && p.stockStatus === 'Out of Stock') || (f === 'alt' && altCount[p.id])));
      $('#rows').innerHTML = rows.map((p) => `
        <tr class="row" data-edit="${esc(p.id)}" tabindex="0">
          <td><img class="thumb" src="${esc(imgSrc(p.image))}" alt="" loading="lazy"></td>
          <td><b>${esc(p.name)}</b></td>
          <td class="hide-sm">${esc(p.sku || p.id)}</td>
          <td class="hide-sm" style="text-transform:capitalize">${esc(p.category)}</td>
          <td>${money(p.price)}</td>
          <td><span class="pill ${p.status === 'draft' ? 'draft' : 'published'}">${p.status === 'draft' ? 'Draft' : 'Published'}</span>${p.stockStatus === 'Out of Stock' ? '<span class="pill out">Out of stock</span>' : ''}</td>
          <td class="hide-sm">${altCount[p.id] ? `<span class="pill high">${altCount[p.id]} missing</span>` : '<span class="pill low">OK</span>'}</td>
        </tr>`).join('') || '<tr><td colspan="7" class="muted">No products match.</td></tr>';
    };
    ['#q', '#f-cat', '#f-state'].forEach((s) => $(s).addEventListener('input', render));
    render();
  };

  // ----- product workspace: editor (left) + the real product page in an iframe (right) -----
  let draft = null;
  let editingId = null;
  let baseline = '';
  let editorDirty = false;
  let device = 1280;
  let previewTimer;
  let fitObserver;
  const productUrl = (p) => `${SITE}/#products/${encodeURIComponent(p.handle || p.id)}`;

  VIEWS.editor = async (id) => {
    editingId = id || null;
    baseline = '';
    const orig = id ? state.products.find((p) => p.id === id) : null;
    if (id && !orig) throw new Error('Product not found. It may have been deleted.');
    draft = orig ? JSON.parse(JSON.stringify(orig)) : {
      id: 'HJ-' + Date.now().toString(36).toUpperCase(), handle: '', name: '', category: '', collection: '', price: 0,
      status: 'draft', stockStatus: 'In Stock', image: '', gallery: [], galleryAlt: [], description: ''
    };
    if (!Array.isArray(draft.gallery)) draft.gallery = [];
    if (!Array.isArray(draft.galleryAlt)) draft.galleryAlt = [];
    const list = (k) => [...new Set(state.products.map((p) => p[k]).filter(Boolean))].map((v) => `<option value="${esc(v)}">`).join('');
    const txt = (k, label, opts = {}) => `<div class="${opts.full ? 'full' : ''}"><label for="f-${k}" class="${opts.req ? 'req' : ''}">${label}</label>
      <input id="f-${k}" data-f="${k}" value="${esc(draft[k] == null ? '' : draft[k])}" placeholder="${esc(opts.ph || '')}" ${opts.req ? 'required' : ''} ${opts.ro ? 'readonly' : ''}>${opts.help ? `<p class="help">${opts.help}</p>` : ''}</div>`;
    const stockOpts = [...new Set([...STOCK, draft.stockStatus].filter(Boolean))];
    const tab = (k, label, on) => `<button type="button" role="tab" id="tab-${k}" aria-controls="panel-${k}" aria-selected="${on}" data-tab="${k}">${label}</button>`;
    view.classList.add('wide');
    view.innerHTML = `
      <div class="ws">
        <div class="ws-head">
          <div class="ws-title">
            <a class="btn btn-sm" href="#" data-go="products" aria-label="Back to products">←</a>
            <h1 id="ws-name">${esc(draft.name || 'New product')}</h1>
            <span id="ws-status"></span>
            <span id="ws-dirty" class="pill dirty hidden">Unsaved changes</span>
          </div>
          <div class="ws-actions">
            <div class="seg ws-switch" role="group" aria-label="Show"><button type="button" data-pane="editor" aria-pressed="true">Editor</button><button type="button" data-pane="preview" aria-pressed="false">Preview</button></div>
            <button class="btn" data-action="discard" disabled>Discard</button>
            <button class="btn" data-action="save-draft">Save draft</button>
            <button class="btn btn-primary" data-action="publish">Publish</button>
          </div>
          <div class="ws-url"><span>Product page</span><code id="ws-url"></code>
            <button class="btn btn-sm" type="button" data-action="copy-url">Copy URL</button>
            <a class="btn btn-sm" id="ws-open" target="_blank" rel="noopener">Open product page ↗</a></div>
        </div>
        <div class="ws-body" data-pane="editor">
          <div class="ws-editor">
            <div id="errs" class="errors hidden" role="alert"></div>
            <div class="tabs" role="tablist" aria-label="Product sections">
              ${tab('basics', 'Basics', true)}${tab('pricing', 'Price &amp; stock', false)}${tab('images', 'Images', false)}${tab('details', 'Details', false)}${tab('seo', 'SEO', false)}
            </div>

            <section role="tabpanel" id="panel-basics" aria-labelledby="tab-basics"><div class="grid2">
              ${txt('name', 'Product name', { full: true, req: true, ph: 'e.g. Celestial Radiance Solitaire Ring' })}
              <div><label for="f-category" class="req">Category</label><input id="f-category" data-f="category" list="dl-cat" value="${esc(draft.category)}" required><datalist id="dl-cat">${list('category')}</datalist></div>
              <div><label for="f-collection">Collection</label><input id="f-collection" data-f="collection" list="dl-col" value="${esc(draft.collection)}"><datalist id="dl-col">${list('collection')}</datalist></div>
              ${txt('sku', 'SKU / product code', { ph: 'HJ-RNG-001' })}
              ${txt('id', 'Product ID', { ro: !!orig, help: orig ? 'Fixed once a product exists.' : 'Letters, numbers and dashes.' })}
              ${txt('badge', 'Badge', { ph: 'e.g. Bestseller', help: 'Shown on the product card.' })}
              ${txt('tag', 'Tag line', { ph: 'e.g. Silver Flagship' })}
            </div></section>

            <section role="tabpanel" id="panel-pricing" aria-labelledby="tab-pricing" class="hidden"><div class="grid2">
              <div><label for="f-price" class="req">Price (₹)</label><input id="f-price" data-f="price" type="number" min="0" step="1" value="${esc(draft.price)}" required></div>
              <div><label for="f-compareAtPrice">Compare-at price (₹)</label><input id="f-compareAtPrice" data-f="compareAtPrice" type="number" min="0" step="1" value="${esc(draft.compareAtPrice == null ? '' : draft.compareAtPrice)}"><p class="help">Shown struck through; the discount % is worked out for you.</p></div>
              <div><label for="f-stockStatus">Availability</label><select id="f-stockStatus" data-f="stockStatus">${stockOpts.map((s) => `<option ${s === draft.stockStatus ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
              ${txt('weight', 'Weight', { ph: 'e.g. 3.5g' })}
              <div class="full row-flex" style="gap:var(--s5)">
                ${['isNew:New arrival', 'isSilver:Silver', 'isGold:Gold'].map((s) => { const [k, l] = s.split(':'); return `<label class="check"><input type="checkbox" data-f="${k}" ${draft[k] ? 'checked' : ''}> ${l}</label>`; }).join('')}
              </div>
            </div></section>

            <section role="tabpanel" id="panel-images" aria-labelledby="tab-images" class="hidden">
              <p class="help" style="margin:0 0 var(--s3)">ALT text tells Google and screen readers what the photo shows. Describe the photo, e.g. "Silver solitaire ring with round moissanite, side view".</p>
              <div id="slots"></div>
              <button type="button" class="drop" id="drop" data-action="add-gallery">Drop an image here or <u>choose a file</u> to add it to the gallery<br><span class="small">Resized to 1600px WebP before upload</span></button>
              <input id="file" type="file" accept="image/*" class="hidden">
            </section>

            <section role="tabpanel" id="panel-details" aria-labelledby="tab-details" class="hidden"><div class="grid2">
              <div class="full"><label for="f-description">Description <span class="count" id="c-desc"></span></label><textarea id="f-description" data-f="description" rows="6">${esc(draft.description)}</textarea></div>
              ${txt('metal', 'Metal')}${txt('purity', 'Purity')}${txt('stone', 'Gemstone')}${txt('cut', 'Cut')}
              ${txt('clarity', 'Clarity')}${txt('dimensions', 'Dimensions')}${txt('certificate', 'Certificate', { full: true })}
              <div class="full"><label for="f-specs">Specifications</label><textarea id="f-specs" rows="6">${esc((draft.specifications || []).map((s) => s.label + ': ' + s.value).join('\n'))}</textarea><p class="help">One per line, as "Label: value". Shown in the product page's specification list.</p></div>
              ${orig ? '<div class="full" style="border-top:1px solid var(--line);padding-top:var(--s4)"><button class="btn btn-danger btn-sm" type="button" data-action="delete-product">Delete product</button></div>' : ''}
            </div></section>

            <section role="tabpanel" id="panel-seo" aria-labelledby="tab-seo" class="hidden"><div class="grid2">
              <div class="full"><label class="req" for="f-handle">URL slug</label>
                <div class="row-flex" style="flex-wrap:nowrap"><input id="f-handle" data-f="handle" value="${esc(draft.handle)}" required><button class="btn" type="button" data-action="slug">From name</button></div>
                <p class="help">${orig ? 'Changing the slug of a published product breaks links that were already shared.' : 'Lowercase letters, numbers and dashes.'}</p></div>
              <div class="full"><label for="f-seoTitle">SEO title <span class="count" data-count="seoTitle" data-max="60"></span></label><input id="f-seoTitle" data-f="seoTitle" value="${esc(draft.seoTitle || '')}"><p class="help">Empty = "<span id="seo-title-default"></span>"</p></div>
              <div class="full"><label for="f-seoDescription">Meta description <span class="count" data-count="seoDescription" data-max="160"></span></label><textarea id="f-seoDescription" data-f="seoDescription" rows="3">${esc(draft.seoDescription || '')}</textarea><p class="help">Empty = the product description.</p></div>
              <div class="full"><label>Google preview</label><div class="snippet"><div class="u" id="sn-u"></div><div class="t" id="sn-t"></div><div class="d" id="sn-d"></div></div></div>
              <div class="full"><label>Headings on the product page</label><p class="help" style="margin:0">H1 is the product name. Section headings come from the site template.</p></div>
              <div class="full"><label>Product schema (JSON-LD, read from the preview)</label><pre class="code" id="schema">Loading…</pre>
                <p class="help">Canonical URL, robots and Open Graph are set once for the whole site under Homepage SEO: every product lives on the same page (#products/…), so per-product tags would not be read by Google.</p></div>
            </div></section>
          </div>

          <div class="ws-preview" aria-label="Live preview">
            <div class="pv-bar">
              <div class="seg" role="group" aria-label="Preview size">
                <button type="button" data-device="1280" aria-pressed="${device === 1280}">Desktop</button><button type="button" data-device="768" aria-pressed="${device === 768}">Tablet</button><button type="button" data-device="390" aria-pressed="${device === 390}">Mobile</button>
              </div>
              <span class="small muted">Live preview of the real product page · not public until you save</span>
            </div>
            <div class="pv-stage" id="pv-stage">
              <div class="pv-loading skel" id="pv-loading"></div>
              <iframe id="pv" class="pv-frame" title="Live preview of the product page" src="/?hjpreview=1&amp;nomodal=1#products/${encodeURIComponent(draft.id)}"></iframe>
            </div>
          </div>
        </div>
      </div>`;
    renderSlots();
    fitPreview();
    if (fitObserver) fitObserver.disconnect();
    fitObserver = new ResizeObserver(fitPreview);
    fitObserver.observe($('#pv-stage'));
    baseline = JSON.stringify(readForm());
    onEdit(true);
  };

  // Scale the fixed-width preview device down to fit the panel
  function fitPreview() {
    const stage = $('#pv-stage');
    const frame = $('#pv');
    if (!stage || !frame || !stage.clientWidth) return;
    const pad = 16;
    const availW = stage.clientWidth - pad * 2;
    const k = Math.min(1, availW / device);
    frame.style.width = device + 'px';
    frame.style.height = Math.max(200, (stage.clientHeight - pad * 2) / k) + 'px';
    frame.style.transform = `scale(${k})`;
    frame.style.left = pad + (availW - device * k) / 2 + 'px';
  }

  // Unsaved product (with not-yet-deployed uploads swapped for their local copies) -> preview iframe
  function sendPreview() {
    const frame = $('#pv');
    if (!frame || !frame.contentWindow) return;
    const p = readForm();
    const local = (s) => state.previews[s] || s;
    p.image = local(p.image); p.hoverImage = local(p.hoverImage); p.gallery = (p.gallery || []).map(local);
    frame.contentWindow.postMessage({ type: 'hj-preview-product', product: p }, location.origin);
  }

  // Called after every edit: dirty flag, header, SEO preview, live preview
  function onEdit(initial) {
    if (!$('#ws-name')) return;
    const p = readForm();
    editorDirty = !initial && JSON.stringify(p) !== baseline;
    $('#ws-dirty').classList.toggle('hidden', !editorDirty);
    view.querySelector('[data-action="discard"]').disabled = !editorDirty;
    $('#ws-name').textContent = p.name || 'New product';
    const saved = editingId ? state.products.find((x) => x.id === editingId) : null;
    const st = saved ? (saved.status === 'draft' ? 'draft' : 'published') : 'new';
    $('#ws-status').className = 'pill ' + (st === 'published' ? 'published' : 'draft');
    $('#ws-status').textContent = st === 'published' ? 'Published' : st === 'draft' ? 'Draft' : 'Not saved yet';
    $('#ws-url').textContent = saved ? productUrl(saved) : 'Available after the first save';
    const open = $('#ws-open');
    if (st === 'published') { open.href = productUrl(saved); open.removeAttribute('aria-disabled'); open.classList.remove('hidden'); }
    else open.classList.add('hidden');
    view.querySelector('[data-action="copy-url"]').disabled = !saved;
    const d = $('#f-description');
    $('#c-desc').textContent = d.value.trim().length + ' chars';
    view.querySelectorAll('[data-count]').forEach((c) => {
      const n = $('#f-' + c.dataset.count).value.trim().length;
      c.textContent = n + ' / ' + c.dataset.max;
      c.classList.toggle('over', n > Number(c.dataset.max));
    });
    const defTitle = `${p.name || 'Product'} | House of Jewelux`;
    $('#seo-title-default').textContent = defTitle;
    $('#sn-u').textContent = `houseofjewelux.com › products › ${p.handle || p.id}`;
    $('#sn-t').textContent = p.seoTitle || defTitle;
    $('#sn-d').textContent = (p.seoDescription || p.description || '(no description)').slice(0, 170);
    clearTimeout(previewTimer);
    previewTimer = setTimeout(sendPreview, initial ? 0 : 150);
  }

  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || !$('#pv')) return;
    if (e.data.type === 'hj-preview-ready') { $('#pv-loading').classList.add('hidden'); sendPreview(); }
    if (e.data.type === 'hj-preview-rendered') {
      const ld = $('#pv').contentDocument && $('#pv').contentDocument.getElementById('hj-product-ld');
      $('#schema').textContent = ld ? JSON.stringify(JSON.parse(ld.textContent), null, 2) : 'No schema on this page.';
    }
  });

  function renderSlots() {
    const slot = (key, label, src, alt, i) => `
      <div class="slot ${src && !alt.trim() ? 'missing' : ''}">
        <img src="${esc(imgSrc(src))}" alt="">
        <div>
          <label for="alt-${key}">${label} — ALT text ${src && !alt.trim() ? '<span style="color:var(--bad)">(missing)</span>' : ''}</label>
          <input id="alt-${key}" data-alt="${key}" value="${esc(alt)}" placeholder="${src ? 'Describe this image' : 'Upload an image first'}" ${src ? '' : 'disabled'}>
          <p class="help" style="word-break:break-all">${esc(src || 'No image')}</p>
        </div>
        <div class="acts">
          <button class="btn btn-sm" type="button" data-upload="${key}">${src ? 'Replace' : 'Upload'}</button>
          ${i != null ? `<button class="btn btn-sm" type="button" data-move="${i}:-1" ${i === 0 ? 'disabled' : ''} aria-label="Move gallery image ${i + 1} up">↑ Up</button>
            <button class="btn btn-sm" type="button" data-move="${i}:1" ${i === draft.gallery.length - 1 ? 'disabled' : ''} aria-label="Move gallery image ${i + 1} down">↓ Down</button>
            <button class="btn btn-sm btn-danger" type="button" data-remove="${i}">Remove</button>` : ''}
        </div>
      </div>`;
    $('#slots').innerHTML =
      slot('image', 'Main image', draft.image, draft.imageAlt || '') +
      slot('hoverImage', 'Hover image', draft.hoverImage, draft.hoverImageAlt || '') +
      draft.gallery.map((src, i) => slot('gallery.' + i, 'Gallery ' + (i + 1), src, draft.galleryAlt[i] || '', i)).join('');
    if (baseline) onEdit();
  }

  function setAlt(key, val) {
    if (key === 'image') draft.imageAlt = val;
    else if (key === 'hoverImage') draft.hoverImageAlt = val;
    else draft.galleryAlt[Number(key.split('.')[1])] = val;
  }

  // Resize to max 1600px and convert to WebP before committing
  function optimise(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * scale);
        c.height = Math.round(img.naturalHeight * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not convert this image.'))), 'image/webp', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This file is not an image the browser can read.')); };
      img.src = url;
    });
  }

  let uploadKey = null;
  async function upload(file) {
    if (file.size > 25 * 1024 * 1024) throw new Error('Image is larger than 25 MB. Please use a smaller file.');
    const blob = await optimise(file);
    const b64 = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.readAsDataURL(blob); });
    const base = L.slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
    const path = `images/${L.slugify(draft.name) || 'product'}-${base}-${Date.now().toString(36)}.webp`;
    await putFile(path, b64, null, `admin: upload image ${path}`);
    state.previews[path] = URL.createObjectURL(blob);
    if (uploadKey === 'image') draft.image = path;
    else if (uploadKey === 'hoverImage') draft.hoverImage = path;
    else if (uploadKey === 'new') { draft.gallery.push(path); draft.galleryAlt.push(''); }
    else draft.gallery[Number(uploadKey.split('.')[1])] = path;
    renderSlots();
    toast(`Uploaded (${Math.round(file.size / 1024)} KB → ${Math.round(blob.size / 1024)} KB WebP). Add its ALT text, then save the product.`);
  }

  function readForm() {
    const p = { ...draft };
    view.querySelectorAll('[data-f]').forEach((el) => {
      const k = el.dataset.f;
      if (el.type === 'checkbox') p[k] = el.checked;
      else if (el.type === 'number') p[k] = el.value === '' ? null : Number(el.value);
      else p[k] = el.value.trim();
    });
    if (p.compareAtPrice == null || p.compareAtPrice === 0) { delete p.compareAtPrice; delete p.discountPercent; }
    else p.discountPercent = Math.round((1 - p.price / p.compareAtPrice) * 100);
    p.specifications = $('#f-specs').value.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const i = l.indexOf(':');
      return i > 0 ? { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() } : { label: l, value: '' };
    });
    p.galleryAlt = p.gallery.map((_, i) => p.galleryAlt[i] || '');
    ['imageAlt', 'hoverImageAlt', 'compareAtPrice', 'badge', 'tag', 'seoTitle', 'seoDescription'].forEach((k) => { if (p[k] === '' || p[k] == null) delete p[k]; });
    if (!p.galleryAlt.some(Boolean)) delete p.galleryAlt;
    return p;
  }

  // status: 'draft' keeps it off the website, 'published' shows it
  async function saveProduct(btn, status) {
    const p = readForm();
    p.status = status;
    const idx = editingId ? state.products.findIndex((x) => x.id === editingId) : -1;
    const others = state.products.filter((_, i) => i !== idx);
    const errs = L.validateProduct(p, others);
    const box = $('#errs');
    box.innerHTML = errs.map(esc).join('<br>');
    box.classList.toggle('hidden', !errs.length);
    if (errs.length) { box.scrollIntoView({ block: 'nearest' }); return; }
    const orig = idx >= 0 ? state.products[idx] : null;
    if (orig && orig.handle !== p.handle && !confirm(`Change the URL slug from "${orig.handle}" to "${p.handle}"? Links already shared to the old URL will stop opening this product.`)) return;
    await busy(btn, async () => {
      await loadProducts(); // get the latest file so we never overwrite someone else's change
      const list = state.products.slice();
      const at = editingId ? list.findIndex((x) => x.id === editingId) : -1;
      if (editingId && at < 0) throw new Error('This product was deleted elsewhere. Nothing was saved.');
      if (at >= 0) list[at] = p; else list.push(p);
      await saveProducts(list, `admin: ${status === 'draft' ? 'save draft' : 'publish'} product ${p.id} (${p.name})`);
      toast(status === 'draft' ? 'Saved as draft. It stays hidden from the website.' : 'Published. Live on the website in about a minute.');
      editorDirty = false;
      show('editor', p.id);
    });
  }

  async function deleteProduct(btn) {
    if (!confirm(`Delete "${draft.name}" from the website? Only a developer can restore it later.`)) return;
    await busy(btn, async () => {
      await loadProducts();
      const list = state.products.filter((x) => x.id !== editingId);
      await saveProducts(list, `admin: delete product ${editingId}`);
      editorDirty = false;
      toast('Product deleted.');
      show('products');
    });
  }

  // ----- homepage SEO -----
  const SEO_FIELDS = [
    ['title', 'SEO title', 60], ['description', 'Meta description', 160, true], ['canonical', 'Canonical URL'],
    ['ogTitle', 'Open Graph title', 60], ['ogDescription', 'Open Graph description', 200, true], ['ogImage', 'Open Graph image URL'], ['ogUrl', 'Open Graph URL'],
    ['twitterCard', 'Twitter/X card type (summary_large_image)'], ['twitterTitle', 'Twitter/X title', 70], ['twitterDescription', 'Twitter/X description', 200, true], ['twitterImage', 'Twitter/X image URL']
  ];
  VIEWS.seo = async () => {
    await loadHtml();
    const m = L.readHeadMeta(state.html);
    view.innerHTML = `
      <h1>Homepage SEO</h1>
      <p class="muted small">These tags are in <code>index.html</code>. The whole site is one page, so they apply to every URL Google sees.</p>
      <div class="panel"><h3>Google preview</h3><div class="snippet"><div class="u">houseofjewelux.com</div><div class="t" id="sn-t"></div><div class="d" id="sn-d"></div></div></div>
      <div class="panel"><div class="grid2">
        ${SEO_FIELDS.map(([k, l, max, area]) => `<div class="${area || k === 'title' ? 'full' : ''}"><label for="s-${k}">${l} ${max ? `<span class="count" data-count="${k}" data-max="${max}"></span>` : ''}</label>
          ${area ? `<textarea id="s-${k}" data-s="${k}" rows="3">${esc(m[k])}</textarea>` : `<input id="s-${k}" data-s="${k}" value="${esc(m[k])}">`}</div>`).join('')}
        <div class="full"><label class="check"><input type="checkbox" id="s-noindex" ${/noindex/i.test(m.robots) ? 'checked' : ''}> Hide the whole website from Google (noindex)</label></div>
      </div></div>
      <div class="savebar"><button class="btn btn-primary" data-action="save-seo">Save SEO</button></div>`;
    const upd = () => {
      view.querySelectorAll('[data-count]').forEach((c) => {
        const n = $('#s-' + c.dataset.count).value.trim().length;
        c.textContent = n + ' / ' + c.dataset.max;
        c.classList.toggle('over', n > Number(c.dataset.max));
      });
      $('#sn-t').textContent = $('#s-title').value || '(missing title)';
      $('#sn-d').textContent = $('#s-description').value || '(missing description)';
    };
    view.addEventListener('input', upd);
    upd();
  };

  async function saveSeo(btn) {
    const m = {};
    view.querySelectorAll('[data-s]').forEach((el) => { m[el.dataset.s] = el.value.trim(); });
    const noindex = $('#s-noindex').checked;
    if (noindex && !confirm('Hide the entire website from Google? Your pages will disappear from search results until you turn this off.')) return;
    m.robots = noindex ? 'noindex, nofollow' : '';
    await busy(btn, async () => {
      await loadHtml();
      const html = L.writeHeadMeta(state.html, m);
      if (html === state.html) { toast('Nothing changed.'); return; }
      state.htmlSha = await putFile('index.html', L.toB64(html), state.htmlSha, 'admin: update homepage SEO tags');
      state.html = html;
      toast('SEO saved. Live in about a minute.');
    });
  }

  // ----- audit -----
  VIEWS.audit = async () => {
    await loadHtml();
    const issues = [...L.auditHead(L.readHeadMeta(state.html)), ...L.auditProducts(state.products)];
    const rank = { high: 0, medium: 1, low: 2 };
    issues.sort((a, b) => rank[a.severity] - rank[b.severity]);
    view.innerHTML = `
      <h1>SEO audit</h1>
      <p class="muted">${issues.length} issue${issues.length === 1 ? '' : 's'} found in the homepage tags and ${state.products.length} products.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Severity</th><th>Where</th><th>Issue</th><th></th></tr></thead>
        <tbody>${issues.map((i) => `<tr>
          <td><span class="pill ${i.severity}">${i.severity}</span></td>
          <td>${esc(i.name)}</td><td>${esc(i.message)}</td>
          <td>${i.productId ? `<button class="btn" data-edit="${esc(i.productId)}">Fix</button>` : '<button class="btn" data-go="seo">Fix</button>'}</td>
        </tr>`).join('') || '<tr><td colspan="4">No issues found.</td></tr>'}</tbody>
      </table></div>`;
  };

  // ----- robots.txt -----
  VIEWS.robots = async () => {
    const f = await getFile('robots.txt');
    state.robots = f.text; state.robotsSha = f.sha;
    view.innerHTML = `
      <h1>robots.txt</h1>
      <p class="muted small">Tells search engines which paths they may crawl.</p>
      <textarea id="robots" rows="14" style="font-family:ui-monospace,monospace" aria-label="robots.txt">${esc(f.text)}</textarea>
      <div class="savebar"><button class="btn btn-primary" data-action="save-robots">Save robots.txt</button></div>`;
  };

  async function saveRobots(btn) {
    const text = $('#robots').value.replace(/\r\n/g, '\n');
    if (/^\s*disallow:\s*\/\s*$/im.test(text) && !confirm('"Disallow: /" blocks Google from the whole website. Save anyway?')) return;
    await busy(btn, async () => {
      state.robotsSha = await putFile('robots.txt', L.toB64(text.endsWith('\n') ? text : text + '\n'), state.robotsSha, 'admin: update robots.txt');
      toast('robots.txt saved.');
    });
  }

  // ---------- events ----------
  $('#login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = $('#login-form button[type="submit"]');
    btn.disabled = true;
    passwordLogin($('#username').value, $('#password').value)
      .catch((err) => { if (err.message !== 'Unauthorized') signOut(err.status ? 'Sign-in failed. Please try again later.' : err.message); })
      .finally(() => { btn.disabled = false; $('#password').value = ''; });
  });
  $('#setup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const pass = $('#setup-pass').value;
    if (pass !== $('#setup-pass2').value) { signOut('The two passwords do not match.'); return; }
    const btn = $('#setup-form button[type="submit"]');
    btn.disabled = true;
    setupLogin($('#setup-token').value.trim(), $('#setup-user').value, pass)
      .catch((err) => { if (err.message !== 'Unauthorized') signOut(err.status === 404 ? 'This token cannot see the house-of-jewelux repository.' : err.message); })
      .finally(() => { btn.disabled = false; ['#setup-token', '#setup-pass', '#setup-pass2'].forEach((s) => { $(s).value = ''; }); });
  });
  $('#logout').addEventListener('click', () => { history.replaceState(null, '', location.pathname); signOut(); });
  // "Forgot Password?" / "Back to login" switch screens through the URL hash
  window.addEventListener('hashchange', () => { if (!state.token) signOut(); });
  document.querySelectorAll('[data-toggle-pw]').forEach((b) => b.addEventListener('click', () => {
    const input = $('#' + b.dataset.togglePw);
    const showing = input.type === 'password';
    input.type = showing ? 'text' : 'password';
    b.innerHTML = showing ? EYE_OFF : EYE;
    b.setAttribute('aria-pressed', String(showing));
    b.setAttribute('aria-label', (showing ? 'Hide ' : 'Show ') + (b.dataset.togglePw === 'setup-token' ? 'token' : 'password'));
  }));
  $('#menu').addEventListener('click', () => { const o = $('#side').classList.toggle('open'); $('#menu').setAttribute('aria-expanded', String(o)); });

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-view],[data-go],[data-edit],[data-action],[data-upload],[data-move],[data-remove],[data-tab],[data-pane],[data-device]');
    if (!t) return;
    const d = t.dataset;
    if (d.view || d.go) { e.preventDefault(); show(d.view || d.go); }
    else if (d.edit) { e.preventDefault(); show('editor', d.edit); }
    else if (d.tab) {
      view.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b === t)));
      view.querySelectorAll('[role="tabpanel"]').forEach((panel) => panel.classList.toggle('hidden', panel.id !== 'panel-' + d.tab));
    } else if (d.pane) {
      $('.ws-body').dataset.pane = d.pane;
      view.querySelectorAll('[data-pane]').forEach((b) => { if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', String(b === t)); });
      fitPreview();
    } else if (d.device) {
      device = Number(d.device);
      view.querySelectorAll('[data-device]').forEach((b) => b.setAttribute('aria-pressed', String(b === t)));
      fitPreview();
    }
    else if (d.upload) { uploadKey = d.upload; $('#file').click(); }
    else if (d.move) {
      const [i, dir] = d.move.split(':').map(Number);
      [draft.gallery[i], draft.gallery[i + dir]] = [draft.gallery[i + dir], draft.gallery[i]];
      [draft.galleryAlt[i], draft.galleryAlt[i + dir]] = [draft.galleryAlt[i + dir], draft.galleryAlt[i]];
      renderSlots();
    } else if (d.remove) {
      const i = Number(d.remove);
      draft.gallery.splice(i, 1); draft.galleryAlt.splice(i, 1);
      renderSlots();
    } else if (d.action === 'new-product') show('editor');
    else if (d.action === 'add-gallery') { uploadKey = 'new'; $('#file').click(); }
    else if (d.action === 'slug') { $('#f-handle').value = L.slugify($('#f-name').value); onEdit(); }
    else if (d.action === 'save-draft') saveProduct(t, 'draft');
    else if (d.action === 'publish') saveProduct(t, 'published');
    else if (d.action === 'discard') { if (confirm('Discard all unsaved changes to this product?')) { editorDirty = false; show(editingId ? 'editor' : 'products', editingId); } }
    else if (d.action === 'copy-url') navigator.clipboard.writeText($('#ws-url').textContent).then(() => toast('Product URL copied.'), () => toast('Could not copy. Select the URL and copy it by hand.', true));
    else if (d.action === 'delete-product') deleteProduct(t);
    else if (d.action === 'save-seo') saveSeo(t);
    else if (d.action === 'save-robots') saveRobots(t);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('tr[data-edit]')) show('editor', e.target.dataset.edit);
    if (e.key === 'Escape') $('#side').classList.remove('open');
  });
  document.addEventListener('input', (e) => {
    if (e.target.dataset.alt) setAlt(e.target.dataset.alt, e.target.value);
    if (e.target.closest('.ws-editor')) onEdit();
  });
  // Drag and drop an image onto the gallery drop zone
  document.addEventListener('dragover', (e) => { const z = e.target.closest && e.target.closest('#drop'); if (z) { e.preventDefault(); z.classList.add('over'); } });
  document.addEventListener('dragleave', (e) => { const z = e.target.closest && e.target.closest('#drop'); if (z) z.classList.remove('over'); });
  document.addEventListener('drop', (e) => {
    const z = e.target.closest && e.target.closest('#drop');
    if (!z) return;
    e.preventDefault();
    z.classList.remove('over');
    const f = [...e.dataTransfer.files].find((x) => x.type.startsWith('image/'));
    if (!f) { toast('Drop an image file (JPG, PNG or WebP).', true); return; }
    uploadKey = 'new';
    busy(null, () => upload(f));
  });
  document.addEventListener('change', (e) => {
    if (e.target.closest && e.target.closest('.ws-editor') && e.target.id !== 'file') onEdit();
    if (e.target.id !== 'file' || !e.target.files[0]) return;
    const f = e.target.files[0];
    e.target.value = '';
    busy(null, () => upload(f));
  });
  window.addEventListener('beforeunload', (e) => { if (editorDirty) e.preventDefault(); });

  // ---------- start ----------
  if (state.token) signIn(state.token).catch((err) => { if (err.message !== 'Unauthorized') signOut(err.message); });
  else signOut();
})();
