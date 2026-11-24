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
    view.classList.toggle('wide', name === 'editor' || name === 'page');
    if (name !== 'page') cm.route = null;
    const navName = name === 'editor' ? 'products' : name === 'page' ? 'pages' : name;
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
    if (e.origin !== location.origin || !e.data || !$('#pv') || !$('#f-specs')) return; // product workspace only
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

  // Optimise, commit to images/, keep a local copy for previews until the site rebuilds; returns the repo path
  const IMAGE_TYPES = /^image\/(jpeg|png|webp|avif)$/;
  async function uploadImageFile(file, prefix) {
    if (!IMAGE_TYPES.test(file.type)) throw new Error('Use a JPG, PNG, WebP or AVIF image.');
    if (file.size > 25 * 1024 * 1024) throw new Error('Image is larger than 25 MB. Please use a smaller file.');
    const blob = await optimise(file);
    const b64 = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.readAsDataURL(blob); });
    const base = L.slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
    const path = `images/${L.slugify(prefix) || 'site'}-${base}-${Date.now().toString(36)}.webp`;
    await putFile(path, b64, null, `admin: upload image ${path}`);
    state.previews[path] = URL.createObjectURL(blob);
    state.media = null; // media list is stale now
    toast(`Uploaded (${Math.round(file.size / 1024)} KB → ${Math.round(blob.size / 1024)} KB WebP).`);
    return path;
  }

  let uploadKey = null;
  async function upload(file) {
    const path = await uploadImageFile(file, draft.name || 'product');
    if (uploadKey === 'image') draft.image = path;
    else if (uploadKey === 'hoverImage') draft.hoverImage = path;
    else if (uploadKey === 'new') { draft.gallery.push(path); draft.galleryAlt.push(''); }
    else draft.gallery[Number(uploadKey.split('.')[1])] = path;
    renderSlots();
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

  // =====================================================================
  // WEBSITE CONTENT MANAGER
  // Published content: data/content.json (read by app.js on every page).
  // Drafts never touch the repo (it is public): they live in this browser until "Publish".
  // =====================================================================
  const DRAFT_KEY = 'hj_content_draft';
  const STATIC_PAGES = [
    ['home', 'Homepage', 'Home'], ['collections/all', 'Shop: all jewellery', 'Shop'], ['whats-new', 'New arrivals', 'Collection'],
    ['about', 'About us', 'Page'], ['craftsmanship', 'Craftsmanship', 'Page'], ['contact', 'Contact us', 'Page'], ['faq', 'FAQ', 'Page'],
    ['shipping', 'Shipping policy', 'Policy'], ['returns', 'Returns policy', 'Policy'], ['exchange', 'Exchange policy', 'Policy'],
    ['cancellation', 'Cancellation policy', 'Policy'], ['privacy', 'Privacy policy', 'Policy'], ['terms', 'Terms and conditions', 'Policy'],
    ['cookies', 'Cookie policy', 'Policy'], ['care-guide', 'Jewellery care guide', 'Policy'], ['size-guide', 'Size guide', 'Policy'], ['warranty', 'Warranty', 'Policy'],
    ['cart', 'Shopping bag', 'Shop'], ['wishlist', 'Wishlist', 'Shop'], ['account', 'My account', 'Shop'], ['checkout', 'Checkout', 'Shop']
  ];
  const GLOBAL_NAMES = { '.announcement-bar': 'Announcement bar', '.site-header': 'Header', '.site-footer': 'Footer', '.mobile-bottom-nav': 'Mobile bottom nav' };
  const SAFE_HREF = /^(#|\/(?!\/)|https:\/\/|mailto:|tel:)/i;
  const SWATCHES = ['#1A120B', '#3A2418', '#6B4A2E', '#A88462', '#D5C4AE', '#4A4A46', '#FFFFFF'];
  const clone = (o) => JSON.parse(JSON.stringify(o));

  const loadContent = async () => {
    try { const f = await getFile('data/content.json'); state.content = JSON.parse(f.text); state.contentSha = f.sha; }
    catch (e) { if (e.status !== 404) throw e; state.content = { pages: {} }; state.contentSha = null; }
    if (!state.content.pages) state.content.pages = {};
  };
  const readDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || { pages: {} }; } catch (e) { return { pages: {} }; } };
  const writeDraft = (d) => localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  // What the preview shows: published content with this browser's drafts on top
  const effective = () => { const c = clone(state.content); const d = readDraft(); Object.assign(c.pages, d.pages); return c; };
  const pageOf = (c, r) => c.pages[r] || (c.pages[r] = { items: {}, order: [], hidden: [], hideMobile: [], hideDesktop: [], custom: [], seo: {} });
  const routeExists = (r) => r === '' || r === 'home' || STATIC_PAGES.some(([x]) => x === r) || /^collections\/[a-z0-9-]+$/.test(r) ||
    (r.startsWith('products/') && state.products.some((p) => 'products/' + (p.handle || p.id) === r || 'products/' + p.id === r)) || ['appointment', 'track-order', 'gold', 'silver', 'diamond', 'gemstone'].includes(r);
  const linkProblem = (href) => {
    if (!href) return 'No destination';
    if (!SAFE_HREF.test(href)) return 'Not allowed: use #page, /path, https://, mailto: or tel:';
    if (href.startsWith('#') && href.length > 1 && !routeExists(href.slice(1).replace(/^\//, ''))) return 'Internal page not found';
    return '';
  };

  async function allPages() {
    let cats = [];
    try { const r = await fetch('/data/categories.json', { cache: 'no-cache' }); const j = await r.json(); cats = Array.isArray(j) ? j : j.categories || []; } catch (e) { /* categories optional */ }
    return [
      ...STATIC_PAGES.map(([route, name, type]) => ({ route, name, type })),
      ...cats.map((c) => ({ route: 'collections/' + c.id, name: c.name || c.title || c.id, type: 'Category' })),
      ...state.products.map((p) => ({ route: 'products/' + (p.handle || p.id), name: p.name, type: 'Product', productId: p.id }))
    ];
  }

  // ----- page directory -----
  VIEWS.pages = async () => {
    await loadContent();
    const pages = await allPages();
    const draft = readDraft();
    const types = [...new Set(pages.map((p) => p.type))];
    let pageNo = 1;
    view.innerHTML = `
      <div class="page-head"><div><h1>Website Content</h1><p>${pages.length} pages found from the website's routes, categories and products.</p></div>
        <button class="btn" data-go="media">Media library</button></div>
      <div class="toolbar">
        <input id="pq" type="search" placeholder="Search page name or URL" aria-label="Search pages">
        <select id="pt" aria-label="Page type"><option value="">All types</option>${types.map((t) => `<option>${t}</option>`).join('')}</select>
        <select id="ps" aria-label="Sort"><option value="type">Sort: type</option><option value="name">Sort: name</option><option value="modified">Sort: last modified</option></select>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Page</th><th class="hide-sm">URL</th><th class="hide-sm">Type</th><th>Status</th><th class="hide-sm">Last modified</th><th class="hide-sm">SEO</th><th style="text-align:right">Actions</th></tr></thead>
        <tbody id="prow"></tbody></table></div>
      <div class="row-flex" style="justify-content:space-between;margin-top:var(--s3)"><span id="pinfo" class="small muted"></span>
        <div class="row-flex"><button class="btn btn-sm" id="pprev">← Previous</button><button class="btn btn-sm" id="pnext">Next →</button></div></div>`;
    const PER = 20;
    const render = () => {
      const q = $('#pq').value.trim().toLowerCase();
      const t = $('#pt').value;
      const sort = $('#ps').value;
      let rows = pages.filter((p) => (!t || p.type === t) && (!q || p.name.toLowerCase().includes(q) || p.route.includes(q)));
      const mod = (p) => (state.content.pages[p.route] || {}).updatedAt || '';
      if (sort === 'name') rows.sort((a, b) => a.name.localeCompare(b.name));
      if (sort === 'modified') rows.sort((a, b) => mod(b).localeCompare(mod(a)));
      const pagesCount = Math.max(1, Math.ceil(rows.length / PER));
      pageNo = Math.min(pageNo, pagesCount);
      $('#pinfo').textContent = `${rows.length} pages · page ${pageNo} of ${pagesCount}`;
      $('#pprev').disabled = pageNo <= 1; $('#pnext').disabled = pageNo >= pagesCount;
      $('#prow').innerHTML = rows.slice((pageNo - 1) * PER, pageNo * PER).map((p) => {
        const pub = state.content.pages[p.route];
        const status = draft.pages[p.route] ? '<span class="pill dirty">Draft changes</span>' : pub ? '<span class="pill published">Customised</span>' : '<span class="pill">Template</span>';
        const seo = pub && pub.seo && pub.seo.title ? '<span class="pill low">Custom title</span>' : '<span class="pill medium">Default</span>';
        const editAttr = p.productId ? `data-edit="${esc(p.productId)}"` : `data-page="${esc(p.route)}"`;
        return `<tr><td><b>${esc(p.name)}</b></td><td class="hide-sm"><code class="small">#${esc(p.route)}</code></td><td class="hide-sm">${p.type}</td><td>${status}</td>
          <td class="hide-sm small">${pub && pub.updatedAt ? esc(new Date(pub.updatedAt).toLocaleString('en-IN')) : '—'}</td><td class="hide-sm">${p.productId ? '<span class="small muted">In product editor</span>' : seo}</td>
          <td style="text-align:right;white-space:nowrap"><button class="btn btn-sm btn-primary" ${editAttr}>Edit</button>
            <a class="btn btn-sm" href="${SITE}/#${esc(p.route)}" target="_blank" rel="noopener" aria-label="Open live ${esc(p.name)}">Live ↗</a></td></tr>`;
      }).join('') || '<tr><td colspan="7" class="muted">No pages match.</td></tr>';
    };
    ['#pq', '#pt', '#ps'].forEach((s) => $(s).addEventListener('input', () => { pageNo = 1; render(); }));
    $('#pprev').addEventListener('click', () => { pageNo--; render(); });
    $('#pnext').addEventListener('click', () => { pageNo++; render(); });
    render();
  };

  // ----- page editor workspace -----
  const cm = { route: null, scan: null, sel: null, tab: 'sections', filter: '' };
  const pvWin = () => $('#pv') && $('#pv').contentWindow;
  const cmDirty = () => { const d = readDraft(); return [cm.route, '*'].some((r) => d.pages[r] && JSON.stringify(d.pages[r]) !== JSON.stringify(state.content.pages[r] || null)); };

  VIEWS.page = async (route) => {
    await loadContent();
    const meta = (await allPages()).find((p) => p.route === route) || { route, name: '#' + route, type: 'Page' };
    Object.assign(cm, { route, scan: null, sel: null, tab: 'sections', filter: '' });
    view.classList.add('wide');
    const tab = (k, label) => `<button type="button" role="tab" aria-selected="${k === 'sections'}" data-cmtab="${k}">${label}</button>`;
    view.innerHTML = `
      <div class="ws">
        <div class="ws-head">
          <div class="ws-title"><a class="btn btn-sm" href="#" data-go="pages" aria-label="Back to all pages">←</a>
            <h1>${esc(meta.name)}</h1><span class="pill">${esc(meta.type)}</span><span id="ws-dirty" class="pill dirty hidden">Unpublished changes</span></div>
          <div class="ws-actions">
            <div class="seg ws-switch" role="group" aria-label="Show"><button type="button" data-pane="editor" aria-pressed="true">Editor</button><button type="button" data-pane="preview" aria-pressed="false">Preview</button></div>
            <button class="btn" data-cm="discard">Discard</button>
            <button class="btn" data-cm="save-draft">Save draft</button>
            <button class="btn btn-primary" data-cm="publish">Publish</button>
          </div>
          <div class="ws-url"><span>Page</span><code>${SITE}/#${esc(route)}</code>
            <button class="btn btn-sm" type="button" data-cm="copy">Copy URL</button><a class="btn btn-sm" href="${SITE}/#${esc(route)}" target="_blank" rel="noopener">Open live page ↗</a></div>
        </div>
        <div class="ws-body" data-pane="editor">
          <div class="ws-editor">
            <div class="tabs" role="tablist" aria-label="Page editor">${tab('sections', 'Sections')}${tab('text', 'Text')}${tab('images', 'Images')}${tab('links', 'Links')}${tab('seo', 'SEO')}${tab('history', 'History')}</div>
            <div id="cm-form"></div>
            <div id="cm-panel"><div class="skel" style="height:240px"></div></div>
          </div>
          <div class="ws-preview" aria-label="Live preview">
            <div class="pv-bar">
              <div class="seg" role="group" aria-label="Preview size">
                <button type="button" data-device="1280" aria-pressed="${device === 1280}">Desktop</button><button type="button" data-device="768" aria-pressed="${device === 768}">Tablet</button><button type="button" data-device="390" aria-pressed="${device === 390}">Mobile</button>
              </div>
              <label class="row-flex small" style="margin:0;font-weight:400">Width <input id="pv-w" type="number" min="320" max="2560" step="10" value="${device}" style="width:90px;min-height:34px"></label>
              <span class="small muted">Click any text or image in the preview to edit it</span>
            </div>
            <div class="pv-stage" id="pv-stage"><div class="pv-loading skel" id="pv-loading"></div>
              <iframe id="pv" class="pv-frame" title="Live preview of ${esc(meta.name)}" src="/?hjpreview=1&amp;nomodal=1#${esc(route)}"></iframe></div>
          </div>
        </div>
      </div>`;
    fitPreview();
    if (fitObserver) fitObserver.disconnect();
    fitObserver = new ResizeObserver(fitPreview);
    fitObserver.observe($('#pv-stage'));
    cmRefreshDirty();
  };

  function cmRefreshDirty() {
    const dirty = cmDirty();
    $('#ws-dirty').classList.toggle('hidden', !dirty);
    view.querySelector('[data-cm="discard"]').disabled = !dirty;
    view.querySelector('[data-cm="publish"]').disabled = !dirty;
  }

  // Push the draft into the preview, re-read the page, redraw the active tab
  // keepForm: the change came from the open element form, so leave it alone (keeps focus and caret)
  function cmSync(keepForm) {
    const w = pvWin();
    if (!w || !w.__hjAdmin) return;
    w.__hjContentMode = true;
    cm.eff = effective();
    w.__hjAdmin.setContent(cm.eff);
    cm.scan = w.__hjAdmin.scan();
    cmRender(keepForm);
    cmRefreshDirty();
  }

  // Change the draft for the page an element belongs to (shared parts live under '*')
  function cmEdit(scope, fn, keepForm) {
    const d = readDraft();
    const r = scope === 'global' ? '*' : cm.route;
    if (!d.pages[r]) d.pages[r] = Object.assign(pageOf({ pages: {} }, r), clone(state.content.pages[r] || {}));
    fn(d.pages[r]);
    writeDraft(d);
    cmSync(keepForm);
  }

  const cmItem = (key) => cm.scan && cm.scan.items.find((i) => i.key === key);
  const cmOverride = (it) => { const p = (cm.eff || effective()).pages[it.scope === 'global' ? '*' : cm.route]; return (p && p.items && p.items[it.key]) || {}; };
  const hl = (key) => { const w = pvWin(); if (w && w.__hjAdmin) w.__hjAdmin.highlight(key); };
  const secName = (it) => it.scope === 'global' ? GLOBAL_NAMES[it.section] : 'Section ' + (Number(String(it.section).replace(/\D/g, '')) + 1);

  function cmRender(keepForm) {
    if (!cm.scan) return;
    const panel = $('#cm-panel');
    const P = cm.eff.pages[cm.route] || {};
    const S = cm.scan;
    const textItems = S.items.filter((i) => i.kind !== 'image' && (!cm.filter || i.section === cm.filter));
    const listItem = (i) => `<li><button type="button" class="cm-row ${cm.sel === i.key ? 'on' : ''}" data-cmsel="${esc(i.key)}">
        <span class="pill">${i.tag}</span><span class="cm-text">${esc((cmOverride(i).text != null ? cmOverride(i).text : i.text) || '(empty)')}</span>
        <span class="small muted">${esc(secName(i))}</span>${cmOverride(i).hidden ? '<span class="pill medium">Hidden</span>' : ''}${Object.keys(cmOverride(i)).length ? '<span class="pill dirty">Edited</span>' : ''}</button></li>`;
    const secOpts = `<option value="">All sections</option>${S.sections.filter((s) => !s.custom).map((s, n) => `<option value="${esc(s.key)}" ${cm.filter === s.key ? 'selected' : ''}>${n + 1}. ${esc(s.label.trim().slice(0, 40))}</option>`).join('')}
      ${Object.entries(GLOBAL_NAMES).map(([k, v]) => `<option value="${k}" ${cm.filter === k ? 'selected' : ''}>Shared: ${v}</option>`).join('')}`;
    if (cm.tab === 'sections') {
      const vis = (k) => (P.hidden || []).includes(k) ? 'hidden' : (P.hideMobile || []).includes(k) ? 'mobile' : (P.hideDesktop || []).includes(k) ? 'desktop' : 'all';
      panel.innerHTML = `
        <p class="help" style="margin:0 0 var(--s3)">Drag sections to reorder them. Hidden sections stay in the page code but customers don't see them.</p>
        <ol class="cm-secs" id="cm-secs">${S.sections.map((s, n) => `
          <li draggable="true" data-sec="${esc(s.key)}" class="${vis(s.key) === 'hidden' ? 'off' : ''}">
            <span class="grip" aria-hidden="true">⋮⋮</span>
            <span class="cm-text"><b>${n + 1}. ${esc(s.label.trim().slice(0, 60) || 'Section')}</b>${s.custom ? ' <span class="pill">Custom</span>' : ''}</span>
            <select data-secvis="${esc(s.key)}" aria-label="Visibility of ${esc(s.label)}">
              ${[['all', 'Visible'], ['mobile', 'Hide on mobile'], ['desktop', 'Hide on desktop'], ['hidden', 'Hidden']].map(([v, l]) => `<option value="${v}" ${vis(s.key) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
            <button class="btn btn-sm" data-secmove="${esc(s.key)}:-1" aria-label="Move up" ${n === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn btn-sm" data-secmove="${esc(s.key)}:1" aria-label="Move down" ${n === S.sections.length - 1 ? 'disabled' : ''}>↓</button>
            ${s.custom ? `<button class="btn btn-sm" data-custedit="${esc(s.key)}">Edit</button><button class="btn btn-sm btn-danger" data-custdel="${esc(s.key)}">Delete</button>` : `<button class="btn btn-sm" data-secedit="${esc(s.key)}">Edit text</button>`}
          </li>`).join('')}</ol>
        <div class="panel" style="margin-top:var(--s4)"><h3>Add a section</h3>
          <div class="row-flex"><select id="cm-newtype" style="width:auto"><option value="text">Text block (heading, paragraph, button)</option><option value="banner">Image banner (image, heading, text, button)</option></select>
          <button class="btn btn-primary" data-cm="add-section">Add section</button></div>
          <p class="help">New sections are added at the end of the page; drag them where you want. Built-in sections (with sliders, forms and product grids) can be hidden or moved but not duplicated or deleted, so nothing on the site breaks.</p></div>
        <div class="panel"><h3>Shared on every page</h3>
          <div class="row-flex">${Object.entries(GLOBAL_NAMES).map(([k, v]) => `<button class="btn btn-sm" data-secedit="${k}">${v}</button>`).join('')}</div></div>`;
    } else if (cm.tab === 'text' || cm.tab === 'links') {
      const items = cm.tab === 'links' ? textItems.filter((i) => i.kind === 'link') : textItems;
      panel.innerHTML = `<div class="toolbar"><select id="cm-filter" aria-label="Section">${secOpts}</select><input id="cm-q" type="search" placeholder="Search text" aria-label="Search text"></div>
        ${cm.tab === 'links' ? `<p class="help" style="margin:0 0 var(--s3)">${items.filter((i) => linkProblem(cmOverride(i).href || i.href)).length} link problem(s) on this page.</p>` : ''}
        <ul class="cm-list" id="cm-list">${items.map((i) => cm.tab === 'links'
          ? listItem(i).replace('</button></li>', `${linkProblem(cmOverride(i).href || i.href) ? `<span class="pill high">${esc(linkProblem(cmOverride(i).href || i.href))}</span>` : '<span class="pill low">OK</span>'}</button></li>`)
          : listItem(i)).join('') || '<li class="muted">Nothing editable here.</li>'}</ul>`;
      $('#cm-q').addEventListener('input', (e) => { const q = e.target.value.toLowerCase(); $('#cm-list').querySelectorAll('li').forEach((li) => { li.hidden = q && !li.textContent.toLowerCase().includes(q); }); });
    } else if (cm.tab === 'images') {
      const imgs = S.items.filter((i) => i.kind === 'image');
      panel.innerHTML = `<p class="help" style="margin:0 0 var(--s3)">${imgs.length} images on this page (product photos are edited in Products).</p>
        <div class="cm-imgs">${imgs.map((i) => { const o = cmOverride(i); const alt = o.alt != null ? o.alt : i.alt; return `
          <button type="button" class="cm-img ${cm.sel === i.key ? 'on' : ''}" data-cmsel="${esc(i.key)}">
            <img src="${esc(imgSrc(o.src || i.src))}" alt="" loading="lazy"><span class="small">${esc(secName(i))}</span>
            ${alt ? '' : '<span class="pill high">No ALT</span>'}</button>`; }).join('') || '<p class="muted">No editable images on this page.</p>'}</div>`;
    } else if (cm.tab === 'seo') {
      const seo = P.seo || {};
      const imgs = S.items.filter((i) => i.kind === 'image' && i.scope === 'page');
      const noAlt = imgs.filter((i) => !((cmOverride(i).alt != null ? cmOverride(i).alt : i.alt) || '').trim()).length;
      const titles = Object.entries(cm.eff.pages).filter(([r, p]) => r !== cm.route && p.seo && p.seo.title).map(([, p]) => p.seo.title);
      const warn = [];
      if (cm.route.startsWith('products/')) warn.push('Product pages take their title and description from the product editor.');
      if (S.h1 === 0) warn.push('This page has no H1 heading.');
      if (S.h1 > 1) warn.push(`This page has ${S.h1} H1 headings; use one.`);
      if (noAlt) warn.push(`${noAlt} image(s) on this page have no ALT text.`);
      if (seo.title && titles.includes(seo.title)) warn.push('Another page already uses this SEO title.');
      if (!seo.title) warn.push('No custom SEO title: the homepage title is used.');
      const outline = S.items.filter((i) => /^h[1-6]$/.test(cmOverride(i).tag || i.tag) && i.scope === 'page');
      panel.innerHTML = `<div class="grid2">
        <div class="full"><label for="seo-t">SEO title <span class="count" id="seo-tc"></span></label><input id="seo-t" value="${esc(seo.title || '')}" placeholder="${esc(S.title)}"></div>
        <div class="full"><label for="seo-d">Meta description <span class="count" id="seo-dc"></span></label><textarea id="seo-d" rows="3">${esc(seo.description || '')}</textarea></div>
        <div class="full"><label>Google preview</label><div class="snippet"><div class="u">houseofjewelux.com › ${esc(cm.route)}</div><div class="t" id="seo-st"></div><div class="d" id="seo-sd"></div></div></div>
        <div class="full"><label>Checks</label>${warn.length ? `<ul class="log">${warn.map((w) => `<li class="small">⚠ ${esc(w)}</li>`).join('')}</ul>` : '<p class="small" style="margin:0">✓ No problems found.</p>'}</div>
        <div class="full"><label>Heading outline</label><ul class="log">${outline.map((i) => { const t = cmOverride(i).tag || i.tag; return `<li class="small" style="padding-left:${(Number(t[1]) - 1) * 14}px"><span class="pill">${t.toUpperCase()}</span> ${esc((cmOverride(i).text || i.text).slice(0, 80))}</li>`; }).join('') || '<li class="small muted">No headings.</li>'}</ul></div>
        <p class="full help">Canonical URL, robots and Open Graph are set once for the whole site in Homepage SEO: every page is part of one single-page site (#page URLs), so per-page versions would not be read by Google. The URL of built-in pages comes from the site code and cannot be renamed here.</p>
      </div>`;
      const upd = () => {
        const t = $('#seo-t').value.trim(); const d = $('#seo-d').value.trim();
        $('#seo-tc').textContent = t.length + ' / 60'; $('#seo-tc').classList.toggle('over', t.length > 60);
        $('#seo-dc').textContent = d.length + ' / 160'; $('#seo-dc').classList.toggle('over', d.length > 160);
        $('#seo-st').textContent = t || S.title; $('#seo-sd').textContent = d || '(the site default description)';
      };
      upd();
      let timer;
      ['#seo-t', '#seo-d'].forEach((s) => $(s).addEventListener('input', () => { upd(); clearTimeout(timer); timer = setTimeout(() => cmEdit('page', (p) => { p.seo = { title: $('#seo-t').value.trim(), description: $('#seo-d').value.trim() }; if (!p.seo.title && !p.seo.description) p.seo = {}; }), 400); }));
    } else if (cm.tab === 'history') {
      panel.innerHTML = '<div class="skel" style="height:160px"></div>';
      cmHistory();
    }
    if (!keepForm) cmRenderForm();
  }

  // ----- the form for the selected element -----
  function cmRenderForm() {
    const box = $('#cm-form');
    const it = cm.sel && cmItem(cm.sel);
    if (!it || !['text', 'links', 'images'].includes(cm.tab)) { box.innerHTML = ''; return; }
    const o = cmOverride(it);
    const val = (k, def) => esc(o[k] != null ? o[k] : def == null ? '' : def);
    const vis = o.hidden ? 'hidden' : 'all';
    const common = `
      <div><label for="e-vis">Visibility</label><select id="e-vis" data-e="visibility"><option value="all" ${vis === 'all' ? 'selected' : ''}>Visible</option><option value="hidden" ${vis === 'hidden' ? 'selected' : ''}>Hidden</option></select></div>`;
    let fields = '';
    if (it.kind === 'image') {
      const [fx, fy] = (o.objectPosition || '50% 50%').split(' ').map((v) => parseInt(v, 10));
      fields = `
        <div class="full row-flex" style="align-items:flex-start;flex-wrap:nowrap"><img src="${esc(imgSrc(o.src || it.src))}" alt="" style="width:120px;height:120px;object-fit:cover;border-radius:var(--r-sm);background:var(--line);object-position:${fx}% ${fy}%">
          <div style="flex:1;min-width:0"><p class="help" style="word-break:break-all;margin:0 0 var(--s2)">${esc(o.src || it.src)}</p>
          <div class="row-flex"><button class="btn btn-sm" data-cm="pick-image">Choose from library</button><button class="btn btn-sm" data-cm="upload-image">Upload new</button></div></div></div>
        <div class="full"><label class="req" for="e-alt">ALT text</label><input id="e-alt" data-e="alt" value="${val('alt', it.alt)}" placeholder="Describe what the image shows"></div>
        <div><label for="e-title">Image title (tooltip)</label><input id="e-title" data-e="title" value="${val('title', '')}"></div>
        <div><label for="e-aspect">Aspect ratio</label><select id="e-aspect" data-e="aspect">${[['', 'Original'], ['1 / 1', 'Square 1:1'], ['4 / 5', 'Portrait 4:5'], ['3 / 4', 'Portrait 3:4'], ['16 / 9', 'Wide 16:9']].map(([v, l]) => `<option value="${v}" ${(o.aspect || '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div><label for="e-fx">Focal point left–right: <span id="fxv">${fx}%</span></label><input id="e-fx" data-e="fx" type="range" min="0" max="100" value="${fx}"></div>
        <div><label for="e-fy">Focal point top–bottom: <span id="fyv">${fy}%</span></label><input id="e-fy" data-e="fy" type="range" min="0" max="100" value="${fy}"></div>
        <div><label for="e-mw">Size (max width %)</label><input id="e-mw" data-e="maxWidth" type="number" min="10" max="100" value="${val('maxWidth', '')}" placeholder="100"></div>
        ${common}`;
    } else {
      const heading = /^h[1-6]$/.test(it.tag);
      fields = `
        <div class="full"><label for="e-text">${it.kind === 'link' ? 'Label' : 'Text'}</label><textarea id="e-text" data-e="text" rows="${it.text.length > 120 ? 5 : 2}">${val('text', it.text)}</textarea>
          ${it.hasMarkup ? '<p class="help">This text has formatting inside (line breaks, icons). Editing it replaces it with plain text.</p>' : ''}</div>
        ${it.kind === 'link' ? `<div class="full"><label for="e-href">Destination</label><input id="e-href" data-e="href" list="dl-routes" value="${val('href', it.href)}" placeholder="#about or https://…">
          <datalist id="dl-routes">${STATIC_PAGES.map(([r, n]) => `<option value="#${r}">${n}</option>`).join('')}</datalist><p class="help" id="href-check"></p></div>
          <div><label class="check"><input type="checkbox" data-e="newTab" ${o.newTab ? 'checked' : ''}> Open in a new tab</label></div>` : ''}
        ${heading ? `<div><label for="e-tag">Heading level</label><select id="e-tag" data-e="tag">${[1, 2, 3, 4, 5, 6].map((n) => `<option value="h${n}" ${(o.tag || it.tag) === 'h' + n ? 'selected' : ''}>H${n}</option>`).join('')}</select></div>` : ''}
        <div><label for="e-size">Font size (px)</label><input id="e-size" data-e="size" type="number" min="10" max="96" value="${val('size', '')}" placeholder="Default"></div>
        <div><label for="e-weight">Font weight</label><select id="e-weight" data-e="weight">${[['', 'Default'], ['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold']].map(([v, l]) => `<option value="${v}" ${String(o.weight || '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div><label for="e-align">Alignment</label><select id="e-align" data-e="align">${[['', 'Default'], ['left', 'Left'], ['center', 'Centre'], ['right', 'Right']].map(([v, l]) => `<option value="${v}" ${(o.align || '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div><label>Text colour</label><div class="row-flex">${SWATCHES.map((c) => `<button type="button" class="sw ${o.color === c ? 'on' : ''}" style="background:${c}" data-swatch="${c}" aria-label="Colour ${c}"></button>`).join('')}
          <input type="color" data-e="color" value="${o.color || '#3A2418'}" aria-label="Custom colour" style="width:44px;padding:2px"><button type="button" class="btn btn-sm" data-swatch="">Default</button></div></div>
        ${common}`;
    }
    box.innerHTML = `<div class="panel cm-edit"><h3>${it.kind === 'image' ? 'Image' : it.kind === 'link' ? 'Link / button' : 'Text'} · <span class="pill">${it.tag}</span> <span class="small muted">${esc(secName(it))}${it.scope === 'global' ? ' (on every page)' : ''}</span></h3>
      <div class="grid2">${fields}</div>
      <div class="row-flex" style="justify-content:flex-end;margin-top:var(--s4)"><button class="btn btn-sm" data-cm="reset-el">Restore original</button><button class="btn btn-sm" data-cm="close-el">Done</button></div></div>`;
    const chk = $('#href-check');
    if (chk) { const p = linkProblem($('#e-href').value.trim()); chk.textContent = p ? '⚠ ' + p : '✓ Link looks valid'; chk.style.color = p ? 'var(--bad)' : 'var(--ok)'; }
  }

  // Read the element form into its override
  function cmReadForm() {
    const it = cmItem(cm.sel);
    if (!it) return;
    const f = (k) => $('[data-e="' + k + '"]');
    cmEdit(it.scope, (p) => {
      const o = Object.assign({}, p.items[it.key] || {});
      const set = (k, v, def) => { if (v === '' || v == null || v === def) delete o[k]; else o[k] = v; };
      if (f('text')) set('text', f('text').value, it.text);
      if (f('href')) set('href', f('href').value.trim(), it.href);
      if (f('newTab')) set('newTab', f('newTab').checked || null);
      if (f('tag')) set('tag', f('tag').value, it.tag);
      if (f('size')) set('size', f('size').value ? Number(f('size').value) : '');
      if (f('weight')) set('weight', f('weight').value);
      if (f('align')) set('align', f('align').value);
      if (f('alt')) set('alt', f('alt').value, it.alt);
      if (f('title')) set('title', f('title').value);
      if (f('aspect')) set('aspect', f('aspect').value);
      if (f('maxWidth')) set('maxWidth', f('maxWidth').value ? Number(f('maxWidth').value) : '');
      if (f('fx')) set('objectPosition', `${f('fx').value}% ${f('fy').value}%`, '50% 50%');
      set('hidden', f('visibility').value === 'hidden' || null);
      if (Object.keys(o).length) p.items[it.key] = o; else delete p.items[it.key];
    }, true);
  }

  async function cmHistory() {
    let commits = [];
    try { commits = await gh(`/repos/${REPO}/commits?path=data/content.json&sha=${BRANCH}&per_page=30`); } catch (e) { /* none yet */ }
    $('#cm-panel').innerHTML = `<p class="help" style="margin:0 0 var(--s3)">Every publish is kept as a version. Restoring loads that version into your draft; publish to make it live.</p>
      <ul class="log">${commits.map((c, i) => `<li><div class="row-flex" style="justify-content:space-between"><div><b>Version ${commits.length - i}</b> · ${esc(c.commit.message.split('\n')[0])}<br>
        <span class="small muted">${esc(c.commit.author.name)} · ${esc(new Date(c.commit.author.date).toLocaleString('en-IN'))}</span></div>
        <div class="row-flex"><button class="btn btn-sm" data-vcompare="${c.sha}">Compare</button><button class="btn btn-sm" data-vrestore="${c.sha}">Restore</button></div></div>
        <div id="v-${c.sha}"></div></li>`).join('') || '<li class="muted">No published versions yet.</li>'}</ul>`;
  }
  const fileAt = async (sha) => { const j = await gh(`/repos/${REPO}/contents/data/content.json?ref=${sha}`); return JSON.parse(L.fromB64(j.content)); };
  function diffPage(a, b) {
    a = a || {}; b = b || {};
    const out = [];
    const ai = a.items || {}; const bi = b.items || {};
    new Set([...Object.keys(ai), ...Object.keys(bi)]).forEach((k) => { if (JSON.stringify(ai[k]) !== JSON.stringify(bi[k])) out.push((bi[k] ? (ai[k] ? 'Changed ' : 'Added ') : 'Removed ') + 'edit on ' + k.split(' > ').pop()); });
    // empty list / empty SEO == not set
    const norm = (v) => (!v || (Array.isArray(v) ? !v.length : !Object.values(v).some(Boolean)) ? null : v);
    const names = { order: 'section order', hidden: 'hidden sections', hideMobile: 'mobile-only hiding', hideDesktop: 'desktop-only hiding', custom: 'custom sections', seo: 'SEO title / description' };
    Object.keys(names).forEach((k) => { if (JSON.stringify(norm(a[k])) !== JSON.stringify(norm(b[k]))) out.push('Changed ' + names[k]); });
    return out;
  }

  // ----- media library -----
  async function loadMedia() {
    const files = (await gh(`/repos/${REPO}/contents/images?ref=${BRANCH}`)).filter((f) => f.type === 'file' && /\.(jpe?g|png|webp|avif|svg)$/i.test(f.name));
    const code = (await Promise.all(['/app.js', '/index.html', '/style.css'].map((u) => fetch(u, { cache: 'no-cache' }).then((r) => r.text()).catch(() => '')))).join('\n');
    const content = state.content || { pages: {} };
    state.media = files.map((f) => {
      const path = 'images/' + f.name;
      const uses = [];
      state.products.forEach((p) => { if ([p.image, p.hoverImage, ...(p.gallery || [])].includes(path)) uses.push('Product: ' + p.name); });
      Object.entries(content.pages).forEach(([r, p]) => {
        Object.values(p.items || {}).forEach((o) => { if (o.src && o.src.replace(/^\//, '') === path) uses.push('Page: #' + r); });
        (p.custom || []).forEach((c) => { if (c.image && c.image.replace(/^\//, '') === path) uses.push('Page: #' + r + ' (custom section)'); });
      });
      if (code.includes(f.name)) uses.push('Website design (code)');
      return { path, name: f.name, size: f.size, sha: f.sha, uses: [...new Set(uses)] };
    });
  }

  VIEWS.media = async () => {
    if (!state.content) await loadContent();
    if (!state.media) await loadMedia();
    view.innerHTML = `
      <div class="page-head"><div><h1>Media library</h1><p>${state.media.length} images in the website's images folder.</p></div>
        <button class="btn btn-primary" data-cm="media-upload">Upload image</button></div>
      <div class="toolbar"><input id="mq" type="search" placeholder="Search file name" aria-label="Search images">
        <select id="mf" aria-label="Filter"><option value="">All images</option><option value="used">In use</option><option value="unused">Unused</option></select></div>
      <div class="cm-imgs lib" id="mgrid"></div>
      <p class="help">ALT text belongs to each place an image is shown, so it is edited on the product or page that uses it.</p>`;
    const render = () => {
      const q = $('#mq').value.toLowerCase(); const f = $('#mf').value;
      $('#mgrid').innerHTML = state.media.filter((m) => (!q || m.name.toLowerCase().includes(q)) && (!f || (f === 'used') === m.uses.length > 0)).map((m) => `
        <div class="cm-img lib-item"><img src="${esc(imgSrc(m.path))}" alt="" loading="lazy">
          <span class="small" style="word-break:break-all"><b>${esc(m.name)}</b><br>${Math.round(m.size / 1024)} KB</span>
          <span class="small muted">${m.uses.length ? esc(m.uses.slice(0, 3).join(' · ')) + (m.uses.length > 3 ? ` +${m.uses.length - 3} more` : '') : '<span class="pill medium">Unused</span>'}</span>
          <div class="row-flex"><button class="btn btn-sm" data-mcopy="${esc(m.path)}">Copy path</button><button class="btn btn-sm btn-danger" data-mdel="${esc(m.path)}">Delete</button></div></div>`).join('') || '<p class="muted">No images match.</p>';
    };
    ['#mq', '#mf'].forEach((s) => $(s).addEventListener('input', render));
    render();
  };

  async function deleteMedia(path, btn) {
    const m = state.media.find((x) => x.path === path);
    if (!m) return;
    if (m.uses.length && !confirm(`"${m.name}" is used in:\n\n• ${m.uses.join('\n• ')}\n\nDeleting it will show a broken image there. Delete anyway?`)) return;
    if (!m.uses.length && !confirm(`Delete "${m.name}"? It can only be restored from the repository history.`)) return;
    await busy(btn, async () => {
      await gh(`/repos/${REPO}/contents/${path}`, { method: 'DELETE', body: JSON.stringify({ message: `admin: delete image ${path}`, sha: m.sha, branch: BRANCH }) });
      state.media = state.media.filter((x) => x.path !== path);
      toast('Image deleted.');
      show('media');
    });
  }

  // Image picker: library grid inside the element form
  async function pickImage(onPick) {
    if (!state.media) await loadMedia();
    const box = $('#cm-form');
    box.insertAdjacentHTML('afterbegin', `<div class="panel" id="picker"><h3>Choose an image</h3><input id="pick-q" type="search" placeholder="Search" style="margin-bottom:var(--s3)">
      <div class="cm-imgs" id="pick-grid">${state.media.map((m) => `<button type="button" class="cm-img" data-pick="${esc(m.path)}"><img src="${esc(imgSrc(m.path))}" alt="" loading="lazy"><span class="small" style="word-break:break-all">${esc(m.name)}</span></button>`).join('')}</div>
      <button class="btn btn-sm" data-cm="close-picker" style="margin-top:var(--s3)">Cancel</button></div>`);
    $('#pick-q').addEventListener('input', (e) => $('#pick-grid').querySelectorAll('[data-pick]').forEach((b) => { b.hidden = !b.dataset.pick.toLowerCase().includes(e.target.value.toLowerCase()); }));
    cm.onPick = onPick;
  }

  // Custom sections: small form in #cm-form
  function customForm(key) {
    const id = key.replace('custom:', '');
    const c = (((cm.eff || effective()).pages[cm.route] || {}).custom || []).find((x) => x.id === id);
    if (!c) return;
    $('#cm-form').innerHTML = `<div class="panel cm-edit" data-custom-id="${esc(id)}"><h3>${c.type === 'banner' ? 'Image banner' : 'Text block'}</h3><div class="grid2">
      <div class="full"><label for="c-heading">Heading</label><input id="c-heading" data-c="heading" value="${esc(c.heading)}"></div>
      <div class="full"><label for="c-text">Text</label><textarea id="c-text" data-c="text" rows="4">${esc(c.text)}</textarea></div>
      ${c.type === 'banner' ? `<div class="full row-flex"><img src="${esc(imgSrc(c.image || ''))}" alt="" style="width:96px;height:72px;object-fit:cover;border-radius:var(--r-sm);background:var(--line)">
        <button class="btn btn-sm" data-cm="custom-pick">Choose image</button><button class="btn btn-sm" data-cm="custom-upload">Upload</button></div>
        <div class="full"><label for="c-alt" class="req">Image ALT text</label><input id="c-alt" data-c="alt" value="${esc(c.alt || '')}"></div>` : ''}
      <div><label for="c-bl">Button label</label><input id="c-bl" data-c="buttonLabel" value="${esc(c.buttonLabel || '')}"></div>
      <div><label for="c-bh">Button link</label><input id="c-bh" data-c="buttonHref" list="dl-routes2" value="${esc(c.buttonHref || '')}" placeholder="#collections/all">
        <datalist id="dl-routes2">${STATIC_PAGES.map(([r, n]) => `<option value="#${r}">${n}</option>`).join('')}</datalist></div>
      <div><label for="c-align">Alignment</label><select id="c-align" data-c="align"><option value="center" ${c.align !== 'left' ? 'selected' : ''}>Centre</option><option value="left" ${c.align === 'left' ? 'selected' : ''}>Left</option></select></div>
      <div><label>Background</label><div class="row-flex">${['', ...SWATCHES].map((s) => `<button type="button" class="sw ${(c.bg || '') === s ? 'on' : ''}" style="background:${s || 'transparent'}" data-cbg="${s}" aria-label="${s || 'No background'}">${s ? '' : '∅'}</button>`).join('')}</div></div>
    </div><div class="row-flex" style="justify-content:flex-end;margin-top:var(--s4)"><button class="btn btn-sm" data-cm="close-el">Done</button></div></div>`;
  }
  function customUpdate(id, patch, keepForm) {
    cmEdit('page', (p) => { const c = (p.custom || []).find((x) => x.id === id); if (c) Object.assign(c, patch); }, keepForm);
  }

  async function cmPublish(btn) {
    const d = readDraft();
    const routes = [cm.route, '*'].filter((r) => d.pages[r]);
    const changes = routes.reduce((n, r) => n + diffPage(state.content.pages[r], d.pages[r]).length, 0);
    if (!routes.length) return;
    const bad = cm.scan.items.filter((i) => i.kind === 'link' && Object.keys(cmOverride(i)).includes('href') && linkProblem(cmOverride(i).href));
    if (bad.length) { toast(`Fix ${bad.length} invalid link(s) in the Links tab before publishing.`, true); return; }
    if (!confirm(`Publish ${changes} change(s) to the live website?${routes.includes('*') ? '\n\nThis includes the header/footer/announcement bar, which appear on every page.' : ''}`)) return;
    await busy(btn, async () => {
      await loadContent(); // latest published file, so other pages' changes are kept
      const next = clone(state.content);
      routes.forEach((r) => {
        const p = d.pages[r];
        const empty = !Object.keys(p.items || {}).length && !(p.order || []).length && !(p.hidden || []).length && !(p.hideMobile || []).length &&
          !(p.hideDesktop || []).length && !(p.custom || []).length && !(p.seo && (p.seo.title || p.seo.description));
        if (empty) delete next.pages[r]; else next.pages[r] = { ...p, updatedAt: new Date().toISOString() };
      });
      state.contentSha = await putFile('data/content.json', L.toB64(JSON.stringify(next, null, 2) + '\n'), state.contentSha, `admin: publish content for #${cm.route}`);
      state.content = next;
      routes.forEach((r) => delete d.pages[r]);
      writeDraft(d);
      toast('Published. The website updates in about a minute.');
      cmSync();
    });
  }

  // ----- content manager events -----
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || !cm.route || !$('#pv') || view.querySelector('.ws [data-cm]') === null) return;
    if (e.data.type === 'hj-preview-ready') { $('#pv-loading').classList.add('hidden'); cmSync(); }
    if (e.data.type === 'hj-content-select') {
      const it = cmItem(e.data.key);
      if (!it) return;
      cm.sel = it.key;
      cm.tab = it.kind === 'image' ? 'images' : it.kind === 'link' && cm.tab === 'links' ? 'links' : 'text';
      cm.filter = '';
      view.querySelectorAll('[data-cmtab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.cmtab === cm.tab)));
      cmRender();
      $('.ws-editor').scrollTop = 0;
    }
  });

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-page],[data-cm],[data-cmtab],[data-cmsel],[data-secmove],[data-secedit],[data-custedit],[data-custdel],[data-swatch],[data-cbg],[data-pick],[data-vcompare],[data-vrestore],[data-mcopy],[data-mdel]');
    if (!t) return;
    const d = t.dataset;
    if (d.page) { e.preventDefault(); show('page', d.page); return; }
    if (d.cmtab) {
      cm.tab = d.cmtab; cm.sel = null;
      view.querySelectorAll('[data-cmtab]').forEach((b) => b.setAttribute('aria-selected', String(b === t)));
      cmRender(); return;
    }
    if (d.cmsel) { cm.sel = d.cmsel; hl(d.cmsel); cmRender(); $('.ws-editor').scrollTop = 0; return; }
    if (d.secedit) { cm.tab = 'text'; cm.filter = d.secedit; cm.sel = null; view.querySelectorAll('[data-cmtab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.cmtab === 'text'))); cmRender(); hl(d.secedit); return; }
    if (d.secmove) {
      const [key, dir] = [d.secmove.slice(0, d.secmove.lastIndexOf(':')), Number(d.secmove.slice(d.secmove.lastIndexOf(':') + 1))];
      const keys = cm.scan.sections.map((s) => s.key);
      const i = keys.indexOf(key);
      [keys[i], keys[i + dir]] = [keys[i + dir], keys[i]];
      cmEdit('page', (p) => { p.order = keys; });
      return;
    }
    if (d.custedit) { customForm(d.custedit); hl(d.custedit); return; }
    if (d.custdel) {
      if (!confirm('Delete this custom section?')) return;
      const id = d.custdel.replace('custom:', '');
      cmEdit('page', (p) => { p.custom = (p.custom || []).filter((c) => c.id !== id); p.order = (p.order || []).filter((k) => k !== d.custdel); });
      return;
    }
    if ('swatch' in d) { cmEditColor(d.swatch); return; }
    if ('cbg' in d) { customUpdate(t.closest('[data-custom-id]').dataset.customId, { bg: d.cbg }); customForm('custom:' + t.closest('[data-custom-id]').dataset.customId); return; }
    if (d.pick) { const fn = cm.onPick; cm.onPick = null; $('#picker') && $('#picker').remove(); if (fn) fn(d.pick); return; }
    if (d.vcompare) {
      busy(t, async () => {
        const v = await fileAt(d.vcompare);
        const lines = [cm.route, '*'].flatMap((r) => diffPage(v.pages[r], state.content.pages[r]).map((x) => (r === '*' ? 'Shared parts: ' : '') + x));
        $('#v-' + d.vcompare).innerHTML = `<p class="small" style="margin:var(--s2) 0 0">${lines.length ? 'Differences from the live version:<br>• ' + lines.map(esc).join('<br>• ') : 'Same as the live version for this page.'}</p>`;
      });
      return;
    }
    if (d.vrestore) {
      if (!confirm('Load this version into your draft? Nothing changes on the website until you publish.')) return;
      busy(t, async () => {
        const v = await fileAt(d.vrestore);
        const dr = readDraft();
        [cm.route, '*'].forEach((r) => { dr.pages[r] = Object.assign(pageOf({ pages: {} }, r), clone(v.pages[r] || {})); });
        writeDraft(dr);
        cmSync();
        toast('Version loaded into the draft. Check the preview, then Publish.');
      });
      return;
    }
    if (d.mcopy) { navigator.clipboard.writeText(d.mcopy).then(() => toast('Path copied.')); return; }
    if (d.mdel) { deleteMedia(d.mdel, t); return; }
    switch (d.cm) {
      case 'discard':
        if (!confirm('Discard all unpublished changes to this page (and shared header/footer edits)?')) return;
        { const dr = readDraft(); delete dr.pages[cm.route]; delete dr.pages['*']; writeDraft(dr); cm.sel = null; cmSync(); toast('Draft discarded.'); }
        break;
      case 'save-draft': writeDraft(readDraft()); toast('Draft saved in this browser. It is not on the website until you publish.'); break;
      case 'publish': cmPublish(t); break;
      case 'copy': navigator.clipboard.writeText(`${SITE}/#${cm.route}`).then(() => toast('Page URL copied.')); break;
      case 'close-el': cm.sel = null; cmRender(); break;
      case 'reset-el': { const it = cmItem(cm.sel); cmEdit(it.scope, (p) => { delete p.items[it.key]; }); break; }
      case 'add-section': {
        const type = $('#cm-newtype').value;
        const id = Date.now().toString(36);
        cmEdit('page', (p) => { p.custom = [...(p.custom || []), { id, type, heading: 'New section heading', text: 'Write your text here.', align: 'center', bg: '', buttonLabel: '', buttonHref: '' }]; });
        customForm('custom:' + id);
        hl('custom:' + id);
        break;
      }
      case 'pick-image': pickImage((path) => { const it = cmItem(cm.sel); cmEdit(it.scope, (p) => { p.items[it.key] = { ...(p.items[it.key] || {}), src: path }; }); }); break;
      case 'upload-image': cmUpload((path) => { const it = cmItem(cm.sel); cmEdit(it.scope, (p) => { p.items[it.key] = { ...(p.items[it.key] || {}), src: path }; }); }); break;
      case 'custom-pick': { const id = t.closest('[data-custom-id]').dataset.customId; pickImage((path) => { customUpdate(id, { image: path }); customForm('custom:' + id); }); break; }
      case 'custom-upload': { const id = t.closest('[data-custom-id]').dataset.customId; cmUpload((path) => { customUpdate(id, { image: path }); customForm('custom:' + id); }); break; }
      case 'close-picker': cm.onPick = null; $('#picker').remove(); break;
      case 'media-upload': cmUpload(() => show('media')); break;
      default: break;
    }
  });

  function cmUpload(done) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/avif';
    input.addEventListener('change', () => { const f = input.files[0]; if (f) busy(null, async () => done(await uploadImageFile(f, cm.route ? cm.route.replace(/\//g, '-') : 'site'))); });
    input.click();
  }
  function cmEditColor(c) {
    const it = cmItem(cm.sel);
    cmEdit(it.scope, (p) => { const o = { ...(p.items[it.key] || {}) }; if (c) o.color = c; else delete o.color; if (Object.keys(o).length) p.items[it.key] = o; else delete p.items[it.key]; });
  }

  // Typing in the element / custom forms updates the draft and the preview (debounced)
  let cmTimer;
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('[data-e]')) {
      if (t.id === 'e-fx') $('#fxv').textContent = t.value + '%';
      if (t.id === 'e-fy') $('#fyv').textContent = t.value + '%';
      if (t.id === 'e-href') { const p = linkProblem(t.value.trim()); $('#href-check').textContent = p ? '⚠ ' + p : '✓ Link looks valid'; $('#href-check').style.color = p ? 'var(--bad)' : 'var(--ok)'; }
      clearTimeout(cmTimer);
      cmTimer = setTimeout(cmReadForm, 250);
    }
    if (t.matches('[data-c]')) {
      const id = t.closest('[data-custom-id]').dataset.customId;
      clearTimeout(cmTimer);
      cmTimer = setTimeout(() => customUpdate(id, { [t.dataset.c]: t.value }, true), 250);
    }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-secvis]')) {
      const k = t.dataset.secvis;
      cmEdit('page', (p) => {
        ['hidden', 'hideMobile', 'hideDesktop'].forEach((x) => { p[x] = (p[x] || []).filter((y) => y !== k); });
        const map = { hidden: 'hidden', mobile: 'hideMobile', desktop: 'hideDesktop' };
        if (map[t.value]) p[map[t.value]].push(k);
      });
    }
    if (t.matches('select[data-e], input[type=checkbox][data-e], input[type=color][data-e]')) cmReadForm();
    if (t.id === 'cm-filter') { cm.filter = t.value; cmRender(); }
    if (t.id === 'pv-w') { device = Math.min(2560, Math.max(320, Number(t.value) || 1280)); view.querySelectorAll('[data-device]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.device) === device))); fitPreview(); }
  });

  // Drag and drop section reordering
  let dragKey = null;
  document.addEventListener('dragstart', (e) => { const li = e.target.closest && e.target.closest('#cm-secs li'); if (li) { dragKey = li.dataset.sec; e.dataTransfer.effectAllowed = 'move'; li.classList.add('dragging'); } });
  document.addEventListener('dragend', (e) => { const li = e.target.closest && e.target.closest('#cm-secs li'); if (li) li.classList.remove('dragging'); });
  document.addEventListener('dragover', (e) => { if (dragKey && e.target.closest && e.target.closest('#cm-secs li')) e.preventDefault(); });
  document.addEventListener('drop', (e) => {
    const li = dragKey && e.target.closest && e.target.closest('#cm-secs li');
    if (!li) return;
    e.preventDefault();
    const keys = cm.scan.sections.map((s) => s.key).filter((k) => k !== dragKey);
    keys.splice(keys.indexOf(li.dataset.sec) + (e.offsetY > li.offsetHeight / 2 ? 1 : 0), 0, dragKey);
    dragKey = null;
    cmEdit('page', (p) => { p.order = keys; });
  });


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
