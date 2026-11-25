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
    view.classList.toggle('wide', ['editor', 'page', 'design'].includes(name));
    if (name !== 'page') { cm.key = null; cm.route = null; }
    const navName = name === 'editor' ? 'products' : ['page', 'group', 'design', 'library'].includes(name) ? 'studio' : name;
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
  // Default canvas = this browser window's width, so the canvas matches what the admin sees on the live site in this browser
  const MY_W = Math.round(window.innerWidth);
  let device = MY_W >= 1025 ? MY_W : 1280;
  // Viewport height the page is rendered at. Sizes on the website use the screen height (100vh: hero, product photo),
  // so the canvas must have a real screen height, not the height of the admin panel. Wide screens use this window's height.
  let devH = null; // a height picked from the device list or typed in; null = automatic for the width
  const deviceH = () => devH || (device >= 1025 ? Math.round(window.innerHeight) : device >= 768 ? 1024 : 844);
  // Real devices, in the CSS pixels their browsers use (width × visible height)
  const DEVICES = [['Phones', [['iPhone SE', 375, 667], ['iPhone 12–16', 390, 844], ['iPhone 15/16 Plus · Pro Max', 430, 932], ['Google Pixel', 412, 915], ['Samsung Galaxy S', 360, 780], ['Samsung Galaxy S Ultra', 384, 824]]],
    ['Tablets', [['iPad mini', 768, 1024], ['iPad Air / iPad 10th', 820, 1180], ['iPad Pro 11"', 834, 1194], ['iPad Pro 12.9" (portrait)', 1024, 1366], ['Android tablet', 800, 1280]]],
    ['Laptops & desktops', [['Laptop 1280 × 720', 1280, 720], ['Laptop 1366 × 768', 1366, 657], ['Laptop 1536 × 864', 1536, 730], ['Desktop 1920 × 1080', 1920, 960], ['Large desktop 2560 × 1440', 2560, 1300]]]];
  let zoom = 1; // canvas zoom on top of "fit to panel"
  const PREFS_KEY = 'hj_editor_prefs';
  const edPrefs = Object.assign({ grid: false, guides: true, snap: true, size: 8, cols: 12, gutter: 24, margin: 40, threshold: 6 },
    (() => { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch (e) { return {}; } })());
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
    if (!Array.isArray(draft.galleryCaption)) draft.galleryCaption = [];
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
              <p class="help" style="margin:0 0 var(--s3)">The product page shows the <b>main photo</b> first, then the gallery in this order (drag the ⋮⋮ handle or use ↑ ↓ to reorder), then the hover photo if it is not already in the gallery. ALT text tells Google and screen readers what the photo shows, e.g. "Silver solitaire ring with round moissanite, side view". Captions appear under the photo on the product page.</p>
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
                <button type="button" data-device="1536" aria-pressed="${device === 1536}">Desktop</button><button type="button" data-device="1280" aria-pressed="${device === 1280}">Laptop</button><button type="button" data-device="768" aria-pressed="${device === 768}">Tablet</button><button type="button" data-device="390" aria-pressed="${device === 390}">Mobile</button>
              </div>
              <span class="small muted" id="pv-info"></span>
              <span class="small muted">Not public until you save</span>
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
    const vh = deviceH();
    const fit = Math.min(1, availW / device, Math.max(0.2, (stage.clientHeight - pad * 2) / vh));
    const k = fit * zoom;
    frame.style.width = device + 'px';
    frame.style.height = vh + 'px';
    frame.style.transform = `scale(${k})`;
    frame.style.left = pad + Math.max(0, (availW - device * k) / 2) + 'px';
    stage.style.overflow = zoom > 1 ? 'auto' : 'hidden';
    const zl = $('#zoom-l'); if (zl) zl.textContent = Math.round(k * 100) + '%';
    // The page is rendered at the real viewport width; the scale is only how big it is drawn here
    const info = $('#pv-info'); if (info) info.textContent = `Viewport ${device} × ${vh}px · shown at ${Math.round(k * 100)}%`;
    const vi = $('#pv-vh'); if (vi) vi.textContent = `${device} × ${vh}`;
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
    const slot = (key, label, src, alt, i, cap) => `
      <div class="slot ${src && !alt.trim() ? 'missing' : ''}" ${i != null ? `draggable="true" data-gdrag="${i}"` : ''}>
        <div style="position:relative">${i != null ? '<span class="grip" aria-hidden="true" title="Drag to reorder" style="position:absolute;left:-2px;top:-2px;background:var(--surface);border-radius:4px">⋮⋮</span>' : ''}<img src="${esc(imgSrc(src))}" alt=""></div>
        <div>
          <label for="alt-${key}">${label} — ALT text ${src && !alt.trim() ? '<span style="color:var(--bad)">(missing)</span>' : ''}</label>
          <input id="alt-${key}" data-alt="${key}" value="${esc(alt)}" placeholder="${src ? 'Describe this image' : 'Upload an image first'}" ${src ? '' : 'disabled'}>
          <label for="cap-${key}" style="margin-top:var(--s2)">Caption (optional)</label>
          <input id="cap-${key}" data-cap="${key}" value="${esc(cap || '')}" placeholder="e.g. Close-up of the temple motif" ${src ? '' : 'disabled'}>
          <p class="help" style="word-break:break-all">${esc(src || 'No image')}</p>
        </div>
        <div class="acts">
          <button class="btn btn-sm" type="button" data-upload="${key}">${src ? 'Replace' : 'Upload'}</button>
          ${i != null ? `<button class="btn btn-sm" type="button" data-mkmain="${i}" title="Use this photo as the main (cover) photo">★ Make main</button>
            <button class="btn btn-sm" type="button" data-move="${i}:-1" ${i === 0 ? 'disabled' : ''} aria-label="Move gallery image ${i + 1} up">↑ Up</button>
            <button class="btn btn-sm" type="button" data-move="${i}:1" ${i === draft.gallery.length - 1 ? 'disabled' : ''} aria-label="Move gallery image ${i + 1} down">↓ Down</button>
            <button class="btn btn-sm btn-danger" type="button" data-remove="${i}">Remove</button>` : ''}
        </div>
      </div>`;
    $('#slots').innerHTML =
      slot('image', 'Main photo (cover)', draft.image, draft.imageAlt || '', null, draft.imageCaption) +
      slot('hoverImage', 'Hover photo (product cards)', draft.hoverImage, draft.hoverImageAlt || '', null, draft.hoverImageCaption) +
      draft.gallery.map((src, i) => slot('gallery.' + i, 'Gallery ' + (i + 1), src, draft.galleryAlt[i] || '', i, draft.galleryCaption[i])).join('');
    if (baseline) onEdit();
  }

  function setCaption(key, val) {
    if (key === 'image') draft.imageCaption = val;
    else if (key === 'hoverImage') draft.hoverImageCaption = val;
    else draft.galleryCaption[Number(key.split('.')[1])] = val;
  }
  // Move gallery photo `from` to position `to`, keeping its ALT text and caption with it
  function moveGallery(from, to) {
    if (from === to || to < 0 || to >= draft.gallery.length) return;
    [draft.gallery, draft.galleryAlt, draft.galleryCaption].forEach((arr) => { const [x] = arr.splice(from, 1); arr.splice(to, 0, x); });
    renderSlots();
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
    p.galleryCaption = p.gallery.map((_, i) => (p.galleryCaption || [])[i] || '');
    if (!p.galleryCaption.some(Boolean)) delete p.galleryCaption;
    ['imageCaption', 'hoverImageCaption'].forEach((k) => { if (!p[k]) delete p[k]; });
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
  // WEBSITE DESIGN STUDIO  (Page -> Section -> Element)
  // Published: data/content.json, read by app.js on every page.
  // Drafts stay in this browser (the repository is public) until "Publish".
  // Page keys: a route ("about"), a template ("tpl:collections", "tpl:products") or "*" (header/footer on every page).
  // =====================================================================
  const DRAFT_KEY = 'hj_content_draft';
  const SAFE_HREF = /^(#|\/(?!\/)|https:\/\/|mailto:|tel:)/i;
  const SWATCHES = ['#1A120B', '#3A2418', '#6B4A2E', '#A88462', '#D5C4AE', '#4A4A46', '#FFFFFF'];
  const GLOBAL_NAMES = { '.announcement-bar': 'Announcement bar', '.site-header': 'Header', '.site-footer': 'Footer', '.mobile-bottom-nav': 'Mobile bottom nav' };
  const POLICIES = [['shipping', 'Shipping policy'], ['returns', 'Return & refund policy'], ['exchange', 'Exchange policy'], ['cancellation', 'Cancellation policy'],
    ['privacy', 'Privacy policy'], ['terms', 'Terms & conditions'], ['cookies', 'Cookie policy'], ['care-guide', 'Jewellery care guide'], ['size-guide', 'Size guide'], ['warranty', 'Warranty']];
  const STATIC_PAGES = [['home', 'Home page'], ['collections/all', 'Shopping page'], ['whats-new', 'New arrivals'], ['about', 'About us'], ['craftsmanship', 'Craftsmanship'],
    ['contact', 'Contact us'], ['faq', 'FAQ'], ...POLICIES, ['cart', 'Cart'], ['checkout', 'Checkout'], ['wishlist', 'Wishlist'], ['account', 'My account']];
  const ICON = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>', gem: '<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18"/>', book: '<path d="M4 4h7v16H4zM13 4h7v16h-7z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', news: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>', card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01"/>', doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
    star: '<path d="M12 3l2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9z"/>', header: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>',
    footer: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15h18"/>', bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    palette: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.2"/><circle cx="12" cy="7.5" r="1.2"/><circle cx="16" cy="10" r="1.2"/>', box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>'
  };
  const svg = (k) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${ICON[k]}</svg>`;
  const SECTION_TYPES = [['text', 'Rich text', 'Heading, paragraph and button'], ['banner', 'Promotional banner', 'Image, heading, text and button'],
    ['split', 'Image with text', 'Image beside a heading and text'], ['image', 'Full-width image', 'One large image'], ['cta', 'Call to action', 'Heading, text and a button on a colour'],
    ['divider', 'Divider', 'A thin gold line'], ['spacer', 'Spacer', 'Empty space']];
  // Site design tokens that Global Design Settings may change (all exist in style.css :root)
  const DESIGN = [
    ['Brand colours', [['Darkest (text, footer)', ['--color-charcoal', '--color-subtle-charcoal', '--color-cacao-deep', '--color-text-primary'], '#1A120E'],
      ['Deep brown', ['--color-deep-heritage-brown', '--color-espresso', '--color-bronze-mahogany', '--color-text-secondary'], '#3A2418'],
      ['Cognac', ['--color-muted-gold-dark', '--color-cognac-amber'], '#6B4A2E'], ['Gold', ['--color-muted-gold', '--color-gold', '--color-antique-gold', '--color-text-gold'], '#A88462'],
      ['Beige canvas', ['--color-champagne-beige', '--color-warm-stone', '--color-warm-ivory'], '#D5C4AE'], ['Stone grey', ['--color-stone-muted', '--color-taupe'], '#4A4A46']]],
    ['Card surfaces', [['Card background', ['--color-soft-offwhite', '--color-card-canvas'], '#E4D7C5'], ['Inset / showcase', ['--color-card-inset'], '#F5EFE6']]],
    ['Text sizes', [['Small text', ['--font-size-sm'], '0.875rem'], ['Body text', ['--font-size-base'], '1rem'], ['Section headers', ['--font-size-xl'], '1.5rem'],
      ['Page headers', ['--font-size-2xl'], '2rem'], ['Hero titles', ['--font-size-3xl'], '2.5rem']]],
    ['Corners', [['Cards', ['--radius-pepite-card', '--radius-pepite-card-lg', '--radius-lg'], '16px'], ['Small elements', ['--radius-md'], '8px']]]
  ];
  const clone = (o) => JSON.parse(JSON.stringify(o == null ? null : o));

  const loadContent = async () => {
    try { const f = await getFile('data/content.json'); state.content = JSON.parse(f.text); state.contentSha = f.sha; }
    catch (e) { if (e.status !== 404) throw e; state.content = { pages: {} }; state.contentSha = null; }
    if (!state.content.pages) state.content.pages = {};
  };
  const readDraft = () => { try { const d = JSON.parse(localStorage.getItem(DRAFT_KEY)); return d && d.pages ? d : { pages: {} }; } catch (e) { return { pages: {} }; } };
  const writeDraft = (d) => localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  // What the canvas shows: published content with this browser's drafts on top
  const effective = () => {
    const c = clone(state.content); const d = readDraft();
    Object.assign(c.pages, d.pages);
    if (d.design) c.design = d.design;
    if (d.library) c.library = d.library;
    return c;
  };
  const blankPage = () => ({ items: {}, sectionStyle: {}, style: {}, order: [], hidden: [], hideMobile: [], hideDesktop: [], custom: [], seo: {}, names: {}, locked: [], els: [], groups: [] });
  const isTemplate = (k) => String(k).startsWith('tpl:');
  const routeExists = (r) => r === '' || r === 'home' || STATIC_PAGES.some(([x]) => x === r) || /^collections\/[a-z0-9-]+$/.test(r) || /^p\/[a-z0-9-]+$/.test(r) ||
    (r.startsWith('products/') && state.products.some((p) => 'products/' + (p.handle || p.id) === r || 'products/' + p.id === r)) || ['appointment', 'track-order', 'gold', 'silver', 'diamond', 'gemstone'].includes(r);
  const linkProblem = (href) => {
    if (!href) return 'No destination';
    if (!SAFE_HREF.test(href)) return 'Not allowed: use #page, /path, https://, mailto: or tel:';
    if (href.startsWith('#') && href.length > 1 && !routeExists(href.slice(1).replace(/^\//, ''))) return 'Internal page not found';
    return '';
  };
  let categoriesCache = null;
  async function categories() {
    if (!categoriesCache) {
      try { const r = await fetch('/data/categories.json', { cache: 'no-cache' }); const j = await r.json(); categoriesCache = Array.isArray(j) ? j : j.categories || []; } catch (e) { categoriesCache = []; }
    }
    return categoriesCache;
  }
  const landingPages = () => { const e = effective(); return Object.keys(e.pages).filter((k) => k.startsWith('p/')).map((k) => ({ key: k, route: k, name: (e.pages[k].meta || {}).name || k })); };

  async function groups() {
    const cats = await categories();
    const pages = (list) => list.map(([route, name]) => ({ key: route, route, name }));
    return [
      { id: 'home', icon: 'home', name: 'Home Page', desc: 'Hero, trust ribbon, three pillars, categories, reviews, consultation', pages: pages([['home', 'Home page']]) },
      { id: 'shop', icon: 'bag', name: 'Shopping Page', desc: 'Shop banner, filters, product grid, sorting', pages: pages([['collections/all', 'Shopping page']]) },
      { id: 'category', icon: 'grid', name: 'Category Pages', desc: `One template for all ${cats.length} categories, or each category on its own`,
        pages: [{ key: 'tpl:collections', route: 'collections/' + ((cats[0] || {}).id || 'rings'), name: 'Category page template (all categories)', template: true },
          ...cats.map((c) => ({ key: 'collections/' + c.id, route: 'collections/' + c.id, name: c.name || c.id }))] },
      { id: 'collection', icon: 'layers', name: 'Collection Pages', desc: 'New arrivals', pages: pages([['whats-new', 'New arrivals']]) },
      { id: 'product', icon: 'gem', name: 'Product Pages', desc: 'Layout of every product page. Product text, prices and photos stay in Products.',
        pages: [{ key: 'tpl:products', route: 'products/' + ((state.products[0] || {}).handle || (state.products[0] || {}).id), name: 'Product page template (all products)', template: true }], products: true },
      { id: 'about', icon: 'book', name: 'About Us', desc: 'Brand story, craftsmanship, images', pages: pages([['about', 'About us'], ['craftsmanship', 'Craftsmanship']]) },
      { id: 'contact', icon: 'mail', name: 'Contact Us', desc: 'Contact details, form, buttons', pages: pages([['contact', 'Contact us']]) },
      { id: 'blog', icon: 'news', name: 'Blog Pages', desc: 'The website has no blog yet', pages: [], none: 'There is no blog on the website, so there are no blog pages to edit. A blog needs its own pages in the site code first.' },
      { id: 'customer', icon: 'user', name: 'Customer Pages', desc: 'Account and wishlist', pages: pages([['account', 'My account'], ['wishlist', 'Wishlist']]) },
      { id: 'cart', icon: 'card', name: 'Cart & Checkout', desc: 'Bag and checkout. Payment logic is not editable.', pages: pages([['cart', 'Cart'], ['checkout', 'Checkout']]) },
      { id: 'faq', icon: 'help', name: 'FAQ Page', desc: 'Questions and answers', pages: pages([['faq', 'FAQ']]) },
      { id: 'policy', icon: 'doc', name: 'Policy Pages', desc: 'Shipping, returns, privacy, terms and more', pages: pages(POLICIES) },
      { id: 'landing', icon: 'star', name: 'Custom Landing Pages', desc: 'Your own pages for campaigns and festivals', pages: landingPages(), landing: true }
    ];
  }

  // ----- Studio home: page groups, global components, design, library -----
  VIEWS.studio = async () => {
    await loadContent();
    const G = await groups();
    const d = readDraft();
    const draftCount = Object.keys(d.pages).length + (d.design ? 1 : 0) + (d.library ? 1 : 0);
    const card = (attrs, icon, n, name, desc, extra = '') => `<button class="st-card" ${attrs}><span class="st-ico">${svg(icon)}</span>
      <span class="st-txt"><b>${n ? n + '. ' : ''}${esc(name)}</b><span>${esc(desc)}</span></span>${extra}<span class="st-chev" aria-hidden="true">›</span></button>`;
    view.innerHTML = `
      <div class="page-head"><div><h1>Website Design Studio</h1><p>Open a page, pick a section, then click any text or image to change it. Nothing goes live until you publish.</p></div>
        ${draftCount ? `<span class="pill dirty">${draftCount} unpublished draft${draftCount > 1 ? 's' : ''} in this browser</span>` : ''}</div>
      <h3 class="st-h">Website pages</h3>
      <div class="st-list">${G.map((g, i) => card(`data-group="${g.id}"`, g.icon, String(i + 1).padStart(2, '0'), g.name, g.desc,
        g.pages.some((p) => d.pages[p.key]) ? '<span class="pill dirty">Draft</span>' : '')).join('')}</div>
      <h3 class="st-h">Global components <span class="small muted">(appear on every page)</span></h3>
      <div class="st-list">${Object.entries(GLOBAL_NAMES).map(([sel, n]) => card(`data-global="${sel}"`, sel === '.site-footer' ? 'footer' : sel === '.announcement-bar' ? 'bell' : 'header', '', n, 'Shared by all pages')).join('')}
        ${card('data-go="design"', 'palette', '', 'Global design settings', 'Brand colours, text sizes and corners for the whole site', d.design ? '<span class="pill dirty">Draft</span>' : '')}
        ${card('data-go="library"', 'box', '', 'Reusable section library', 'Save a section once, use it on many pages', d.library ? '<span class="pill dirty">Draft</span>' : '')}
        ${card('data-go="media"', 'grid', '', 'Media library', 'All website images and where they are used')}</div>`;
  };

  VIEWS.group = async (id) => {
    await loadContent();
    const g = (await groups()).find((x) => x.id === id);
    if (!g) throw new Error('Unknown page group.');
    const d = readDraft();
    view.innerHTML = `
      <p><a href="#" data-go="studio">← Design Studio</a></p>
      <div class="page-head"><div><h1>${esc(g.name)}</h1><p>${esc(g.desc)}</p></div></div>
      ${g.none ? `<p class="note">${esc(g.none)}</p>` : ''}
      ${g.landing ? `<div class="panel"><h3>New landing page</h3><div class="row-flex"><input id="lp-name" placeholder="Page name, e.g. Diwali Festive Edit" style="flex:1 1 240px;width:auto">
        <button class="btn btn-primary" data-cm="new-landing">Create page</button></div><p class="help">It gets its own address (#p/your-page-name) and starts empty; add sections to it. It stays private until you publish.</p></div>` : ''}
      ${g.pages.length ? `<div class="table-wrap"><table><thead><tr><th>Page</th><th class="hide-sm">Address</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead><tbody>
        ${g.pages.map((p) => { const pub = state.content.pages[p.key]; return `<tr><td><b>${esc(p.name)}</b>${p.template ? '<br><span class="small muted">Layout and styling only; changes apply to every page of this type</span>' : ''}</td>
          <td class="hide-sm"><code class="small">${p.template ? 'all #' + esc(p.route.split('/')[0]) + '/…' : '#' + esc(p.route)}</code></td>
          <td>${d.pages[p.key] ? '<span class="pill dirty">Draft changes</span>' : pub ? '<span class="pill published">Customised</span>' : p.key.startsWith('p/') ? '<span class="pill draft">Not published</span>' : '<span class="pill">Original</span>'}</td>
          <td style="text-align:right;white-space:nowrap"><button class="btn btn-sm btn-primary" data-studio="${esc(p.key)}" data-route="${esc(p.route)}">Open editor</button>
          ${p.template ? '' : `<a class="btn btn-sm" href="${SITE}/#${esc(p.route)}" target="_blank" rel="noopener">Live ↗</a>`}</td></tr>`; }).join('')}
        </tbody></table></div>` : ''}
      ${g.products ? '<p class="note small" style="margin-top:var(--s4)">To change one product\'s name, price, photos or SEO, use <a href="#" data-go="products">Products</a>: product data is kept separate from the page layout.</p>' : ''}`;
  };

  // ----- three-panel editor -----
  const cm = { key: null, route: null, scan: null, sel: null, secSel: null, open: {}, undo: [], redo: [] };
  const pvWin = () => $('#pv') && $('#pv').contentWindow;
  const hl = (key) => { const w = pvWin(); if (w && w.__hjAdmin) w.__hjAdmin.highlight(key); };
  const keysInPlay = () => [cm.key, '*'];
  const cmDirty = () => { const d = readDraft(); return keysInPlay().some((r) => d.pages[r] && JSON.stringify(d.pages[r]) !== JSON.stringify(state.content.pages[r] || null)); };
  const pageKeyFor = (scope) => scope === 'global' ? '*' : cm.key;
  const pageData = (k) => (cm.eff.pages[k] || {});
  const cmOverride = (it) => ((pageData(pageKeyFor(it.scope)).items || {})[it.key]) || {};
  const cmItem = (key) => cm.scan && cm.scan.items.find((i) => i.key === key);
  const isLocked = (k, scope) => (pageData(scope === 'global' ? '*' : cm.key).locked || []).includes(k);
  const layerName = (k, scope, def) => (pageData(scope === 'global' ? '*' : cm.key).names || {})[k] || def;

  VIEWS.page = async (arg) => {
    const { key, route, focus } = typeof arg === 'string' ? { key: arg, route: arg } : arg;
    await loadContent();
    Object.assign(cm, { key, route, scan: null, sel: null, secSel: focus || null, open: focus ? { [focus]: true } : {}, undo: [], redo: [], extra: new Set() });
    const name = key.startsWith('tpl:') ? (key === 'tpl:products' ? 'Product page template' : 'Category page template') :
      key.startsWith('p/') ? ((effective().pages[key] || {}).meta || {}).name || key : (STATIC_PAGES.find(([r]) => r === key) || [])[1] ||
      ((await categories()).find((c) => 'collections/' + c.id === key) || {}).name || key;
    view.classList.add('wide');
    const dev = (w, l) => `<button type="button" data-device="${w}" aria-pressed="${device === w}">${l}</button>`;
    view.innerHTML = `
      <div class="ws studio">
        <div class="ws-head">
          <div class="ws-title"><a class="btn btn-sm" href="#" data-go="studio" aria-label="Back to Design Studio">←</a>
            <h1>${esc(name)}</h1>${isTemplate(key) ? '<span class="pill">Template</span>' : ''}<span id="ws-dirty" class="pill dirty hidden">Unpublished changes</span></div>
          <div class="ws-actions">
            <button class="btn btn-sm" data-cm="add-el-menu" title="Add text, frames, shapes, lines and icons">+ Element</button><button class="btn btn-sm" data-cm="shortcuts" title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts">⌨</button>
            <button class="btn btn-sm" data-cm="undo" title="Undo (Ctrl+Z)" aria-label="Undo">↶</button><button class="btn btn-sm" data-cm="redo" title="Redo (Ctrl+Y)" aria-label="Redo">↷</button>
            <button class="btn" data-cm="preview" title="Open this page with your unpublished changes in a new tab">Preview</button><button class="btn" data-cm="discard">Discard</button><button class="btn" data-cm="save-draft">Save draft</button><button class="btn btn-primary" data-cm="publish">Publish</button>
          </div>
          <div class="ws-url"><div class="seg st-switch" role="group" aria-label="Show panel"><button type="button" data-spane="layers" aria-pressed="false">Layers</button><button type="button" data-spane="canvas" aria-pressed="true">Canvas</button><button type="button" data-spane="props" aria-pressed="false">Properties</button></div>
            <div class="seg" role="group" aria-label="Preview size">${MY_W >= 1025 && ![1440, 1280].includes(MY_W) ? dev(MY_W, 'This screen') : ''}${dev(1440, 'Desktop')}${dev(1280, 'Laptop')}${dev(768, 'Tablet')}${dev(390, 'Mobile')}</div>
            <span class="small muted" id="pv-vh" title="Canvas size in screen pixels: the page is laid out exactly as on a screen this size"></span>
            <select id="pv-dev" aria-label="Device" style="width:auto;min-height:34px;max-width:210px"><option value="">Device…</option>${DEVICES.map(([g, list]) => `<optgroup label="${g}">${list.map(([n, dw, dh]) => `<option value="${dw}x${dh}">${n} (${dw} × ${dh})</option>`).join('')}</optgroup>`).join('')}</select>
            <label class="row-flex small" style="margin:0;font-weight:400">Width <input id="pv-w" type="number" min="320" max="2560" step="1" value="${device}" style="width:82px;min-height:34px"></label>
            <label class="row-flex small" style="margin:0;font-weight:400" title="Visible screen height. Open houseofjewelux.com/?hjsize on any phone or laptop to see its exact size">Height <input id="pv-h" type="number" min="300" max="2000" step="1" value="${deviceH()}" style="width:82px;min-height:34px"></label>
            <div class="seg" role="group" aria-label="Show version"><button type="button" data-viewmode="draft" aria-pressed="true" title="Your edits, including unpublished ones">Draft</button><button type="button" data-viewmode="live" aria-pressed="false" title="Exactly what the public website shows now">Live</button></div>
            ${isTemplate(key) ? `<label class="row-flex small" style="margin:0;font-weight:400">Preview with <select id="tpl-prev" style="width:auto;min-height:34px;max-width:220px">${
              (key === 'tpl:products' ? state.products.map((x) => ['products/' + (x.handle || x.id), x.name]) : (await categories()).map((c) => ['collections/' + c.id, c.name || c.id]))
                .map(([r, n]) => `<option value="${esc(r)}" ${r === route ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>` : ''}
            <div class="seg" role="group" aria-label="Zoom"><button type="button" data-zoom="-1" aria-label="Zoom out">−</button><button type="button" data-zoom="0" id="zoom-l" title="Fit">100%</button><button type="button" data-zoom="1" aria-label="Zoom in">+</button></div>
            <div class="seg" role="group" aria-label="Canvas helpers">${['grid:Grid', 'rulers:Rulers', 'guides:Guides', 'snap:Snap'].map((x) => { const [k2, l] = x.split(':'); return `<button type="button" data-pref="${k2}" aria-pressed="${!!edPrefs[k2]}">${l}</button>`; }).join('')}</div>
            <details class="gridset"><summary class="btn btn-sm" aria-label="Grid settings">⚙</summary><div class="gridpop">
              ${[['size', 'Grid size (px)', 2, 64], ['cols', 'Columns', 1, 24], ['gutter', 'Gutter (px)', 0, 80], ['margin', 'Margins (px)', 0, 200], ['threshold', 'Snap distance (px)', 1, 20]]
                .map(([k2, l, mn, mx]) => `<label>${l}<input type="number" data-prefnum="${k2}" min="${mn}" max="${mx}" value="${edPrefs[k2]}"></label>`).join('')}
              <p class="help">G toggles the grid. Arrow keys nudge the selection (Shift = 10px). Shift while dragging keeps the move straight.</p></div></details>
            ${isTemplate(key) ? `<span class="small muted">Previewing #${esc(route)}</span>` : `<code>${SITE}/#${esc(route)}</code><a class="btn btn-sm" href="${SITE}/#${esc(route)}" target="_blank" rel="noopener">Live ↗</a>`}</div>
        </div>
        <div class="st-body" data-spane="canvas">
          <aside class="st-layers" id="st-layers" aria-label="Layers"><div class="skel" style="height:300px"></div></aside>
          <div class="ws-preview st-canvas" aria-label="Canvas">
            <div class="pv-stage" id="pv-stage"><div class="pv-loading skel" id="pv-loading"></div>
              <iframe id="pv" class="pv-frame" title="Live canvas of ${esc(name)}" src="/?hjpreview=1&amp;nomodal=1#${esc(route)}"></iframe></div>
          </div>
          <aside class="st-props" id="st-props" aria-label="Properties"></aside>
        </div>
      </div>`;
    fitPreview();
    if (fitObserver) fitObserver.disconnect();
    fitObserver = new ResizeObserver(fitPreview);
    fitObserver.observe($('#pv-stage'));
    cmRefreshDirty();
  };

  function setViewMode(mode) {
    cm.liveView = mode === 'live';
    view.querySelectorAll('[data-viewmode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.viewmode === mode)));
    $('#pv-stage').classList.toggle('is-live', cm.liveView);
    cmSync();
    if (cm.liveView) toast('Showing the published website. Switch back to Draft to edit.');
  }
  function cmRefreshDirty() {
    if (!$('#ws-dirty')) return;
    const dirty = cmDirty();
    $('#ws-dirty').classList.toggle('hidden', !dirty);
    view.querySelector('[data-cm="discard"]').disabled = !dirty;
    view.querySelector('[data-cm="publish"]').disabled = !dirty;
    view.querySelector('[data-cm="undo"]').disabled = !cm.undo.length;
    view.querySelector('[data-cm="redo"]').disabled = !cm.redo.length;
  }

  // Push the draft into the canvas, re-read the page, redraw layers + properties
  function cmSync(keepForm) {
    const w = pvWin();
    cm.eff = cm.liveView ? clone(state.content) : effective();
    if (!w || !w.__hjAdmin) return;
    w.__hjContentMode = true;
    w.__hjAdmin.setContent(cm.eff);
    cm.scan = w.__hjAdmin.scan([...(cm.extra || [])]);
    renderLayers();
    if (!keepForm) renderProps();
    cmRefreshDirty();
    syncSelection();
  }
  const selKeys = () => (cm.multi && cm.multi.length > 1 ? cm.multi : cm.sel ? [cm.sel] : []);
  const lockedKeys = () => [...(pageData(cm.key).locked || []), ...(pageData('*').locked || [])];
  function syncSelection() {
    const w = pvWin(); if (!w || !w.__hjAdmin || !w.__hjAdmin.select) return;
    w.__hjAdmin.prefs(edPrefs);
    w.__hjAdmin.select(selKeys(), lockedKeys());
  }
  const bpName = { d: 'Desktop & laptop (1025px and wider)', t: 'Tablet (768–1024px)', m: 'Mobile (under 768px)' };
  const curBp = () => (device >= 1025 ? 'd' : device >= 768 ? 't' : 'm');

  // Every change goes through here: undo snapshot, draft write, canvas sync
  function cmEdit(pageKey, fn, keepForm) {
    if (cm.liveView) setViewMode('draft'); // editing always happens on the draft
    const d = readDraft();
    cm.undo.push(JSON.stringify(d)); if (cm.undo.length > 60) cm.undo.shift();
    cm.redo = [];
    if (!d.pages[pageKey]) d.pages[pageKey] = Object.assign(blankPage(), clone(state.content.pages[pageKey] || {}));
    fn(d.pages[pageKey]);
    writeDraft(d);
    cmSync(keepForm);
  }
  function undoRedo(from, to) {
    if (!from.length) return;
    to.push(JSON.stringify(readDraft()));
    localStorage.setItem(DRAFT_KEY, from.pop());
    cmSync();
  }

  // Design elements (page.els): frames, shapes, lines, icons and text boxes placed inside a section
  const EL_TYPE = { frame: 'Frame', shape: 'Shape', line: 'Line', icon: 'Icon', text: 'Text box', button: 'Button', badge: 'Badge' };
  const designOf = (it) => it && it.design ? (pageData(pageKeyFor(it.scope)).els || []).find((x) => x.id === it.design) : null;
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const elKeyOf = (id) => `[data-hj-id="el-${id}"]`;
  function patchEl(it, patch, keepForm) {
    cmEdit(pageKeyFor(it.scope), (p) => {
      const x = (p.els || []).find((y) => y.id === it.design); if (!x) return;
      Object.assign(x, patch);
      Object.keys(x).forEach((k) => { if (x[k] === '' || x[k] == null) delete x[k]; });
    }, keepForm);
  }
  // Section a new element goes into: the selected section, else the selected element's section, else the first one
  const targetSection = () => cm.secSel || (cmItem(cm.sel) || {}).section || (cm.scan.sections[0] || {}).key;
  function addDesignEl(def, sec, item) {
    sec = sec || targetSection();
    if (!sec) { toast('Add a section to this page first.', true); return; }
    const global = Object.keys(GLOBAL_NAMES).includes(sec);
    const id = newId();
    // Start in the middle of the part of the section that is on screen
    const w = pvWin(); const host = w && (global ? w.document.querySelector(sec) : w.document.querySelector(`#app-view > [data-hj-sec="${w.CSS.escape(sec)}"]`));
    const hr = host && host.getBoundingClientRect();
    const r = hr && hr.width ? hr : { width: device, top: -400, height: 600 }; // the canvas is hidden on small admin screens: use the preview width
    const ew = Math.min(def.w || 200, Math.max(40, r.width - 32));
    const x = def.x != null ? def.x : Math.round((50 - (ew / 2) / Math.max(1, r.width) * 100) * 10) / 10;
    const y = def.y != null ? def.y : Math.max(16, Math.min(Math.round(r.height - (def.h || 60) - 16), Math.round(-r.top + 120)));
    const el = { ...def, id, sec, x, y, w: ew };
    cmEdit(global ? '*' : cm.key, (p) => {
      p.els = [...(p.els || []), el];
      if (item && Object.keys(item).length) p.items[elKeyOf(id)] = clone(item);
    });
    selectElement(elKeyOf(id), false, true);
    return id;
  }
  function deleteSelected() {
    const keys = selKeys(); if (!keys.length) return;
    const its = keys.map(cmItem).filter(Boolean);
    const d = readDraft(); cm.undo.push(JSON.stringify(d)); cm.redo = [];
    its.forEach((it) => {
      const pk = pageKeyFor(it.scope);
      if (!d.pages[pk]) d.pages[pk] = Object.assign(blankPage(), clone(state.content.pages[pk] || {}));
      const P = d.pages[pk];
      if (it.design) {
        P.els = (P.els || []).filter((x) => x.id !== it.design);
        delete P.items[it.key];
        P.groups = (P.groups || []).map((g) => g.filter((k) => k !== it.key)).filter((g) => g.length > 1);
        P.locked = (P.locked || []).filter((k) => k !== it.key);
        if (P.names) delete P.names[it.key];
      } else P.items[it.key] = { ...(P.items[it.key] || {}), hidden: true }; // the website's own elements are hidden, never removed
    });
    writeDraft(d);
    cm.sel = null; cm.multi = [];
    cmSync();
    toast(its.some((i) => !i.design) ? 'Website elements are hidden (show them again from Layers). Undo brings everything back.' : 'Deleted. Undo (Ctrl+Z) brings it back.');
  }
  function copySelected() {
    const it = cmItem(cm.sel); const el = designOf(it);
    if (!el) { toast('Copy works on elements you added (frames, shapes, text boxes, lines, icons). For website text use Copy style.'); return false; }
    cm.clipEl = { el: clone(el), item: clone(cmOverride(it)) };
    return true;
  }
  function pasteEl(offset) {
    if (!cm.clipEl) return;
    const { el, item } = cm.clipEl;
    const sec = cm.scan.sections.some((x) => x.key === el.sec) || Object.keys(GLOBAL_NAMES).includes(el.sec) ? el.sec : targetSection();
    const { id, ...rest } = el; // eslint-disable-line no-unused-vars
    addDesignEl({ ...rest, y: (Number(el.y) || 0) + (offset ? 24 : 0) }, sec, item);
  }
  function groupToggle() {
    const keys = selKeys(); if (keys.length < 2) return;
    const g = (pageData(cm.key).groups || []).find((x) => keys.every((k) => x.includes(k)));
    cmEdit(cm.key, (p) => {
      p.groups = (p.groups || []).map((x) => x.filter((k) => !keys.includes(k))).filter((x) => x.length > 1);
      if (!g) p.groups.push(keys.slice());
    });
    toast(g ? 'Ungrouped.' : 'Grouped: clicking any of them on the canvas now selects and moves them together.');
  }
  function zOrder(dir) {
    const it = cmItem(cm.sel); if (!it) return;
    const z = (k) => ((((pageData(pageKeyFor(it.scope)).items || {})[k] || {}).pos || {})[curBp()] || {}).z || 0;
    const sib = cm.scan.items.filter((i) => i.section === it.section).map((i) => z(i.key));
    const next = dir === 'top' ? Math.max(0, ...sib) + 1 : dir === 'bottom' ? Math.min(0, ...sib) - 1 : z(it.key) + Number(dir);
    savePos(cm.sel, curBp(), { z: Math.max(-50, Math.min(50, next)) });
  }
  // Keyboard shortcuts, typed in the admin or on the canvas (the canvas forwards them)
  function cmKey(k, mod, shift) {
    if (mod && k === 'z' && !shift) return undoRedo(cm.undo, cm.redo);
    if (mod && (k === 'y' || (k === 'z' && shift))) return undoRedo(cm.redo, cm.undo);
    if (mod && k === 'd') { if (copySelected()) pasteEl(true); return; }
    if (mod && k === 'c') { if (copySelected()) toast('Copied. Ctrl+V pastes it (also on another page).'); return; }
    if (mod && k === 'v') return pasteEl(true);
    if (mod && k === 'g') return groupToggle();
    if (k === 'delete' || k === 'backspace') return deleteSelected();
    if (k === ']' || k === '[') return zOrder(k === ']' ? (shift ? 'top' : 1) : (shift ? 'bottom' : -1));
    if (k === 'escape') { cm.sel = null; cm.multi = []; renderLayers(); renderProps(); syncSelection(); return; }
    if (k === 'g') { edPrefs.grid = !edPrefs.grid; localStorage.setItem(PREFS_KEY, JSON.stringify(edPrefs)); const b = view.querySelector('[data-pref="grid"]'); if (b) b.setAttribute('aria-pressed', String(edPrefs.grid)); syncSelection(); return; }
    if (k === '?') showShortcuts();
  }
  function showShortcuts() {
    const rows = [['Click', 'Select (a grouped element selects its whole group)'], ['Shift + click', 'Add to / remove from the selection'], ['Double-click text', 'Type directly on the canvas'],
      ['Drag · handles', 'Move · resize · rotate (top handle)'], ['Shift while dragging', 'Straight moves, proportional resize'], ['Arrow keys', 'Nudge 1px (Shift = 10px)'],
      ['Ctrl + Z / Ctrl + Y', 'Undo / redo'], ['Ctrl + C / Ctrl + V', 'Copy / paste an added element (works across pages)'], ['Ctrl + D', 'Duplicate'], ['Delete', 'Delete an added element (website elements are hidden)'],
      ['Ctrl + G', 'Group / ungroup the selection'], [']  /  [', 'Bring forward / send backward (Shift = to front / to back)'], ['G', 'Grid on / off'], ['Esc', 'Clear the selection'], ['?', 'This list']];
    $('#st-props').innerHTML = `<h3 class="pp-h">Keyboard shortcuts</h3><table class="kbd-t"><tbody>${rows.map(([a, b]) => `<tr><th><kbd>${esc(a)}</kbd></th><td class="small">${esc(b)}</td></tr>`).join('')}</tbody></table>`;
    showPane('props');
  }
  const ELEMENT_MENU = [
    ['Text & buttons', [['text:h2', 'Heading'], ['text:h3', 'Subheading'], ['text:p', 'Paragraph'], ['button:primary', 'Button'], ['badge:new', 'Badge']]],
    ['Frames (hold an image)', [['frame:rect', 'Rectangle'], ['frame:square', 'Square'], ['frame:rounded', 'Rounded'], ['frame:circle', 'Circle'], ['frame:oval', 'Oval'],
      ['frame:portrait', 'Portrait 4:5'], ['frame:landscape', 'Landscape 16:9'], ['frame:arch', 'Arch'], ['frame:hexagon', 'Hexagon'], ['frame:diamond', 'Diamond']]],
    ['Shapes', [['shape:rect', 'Rectangle'], ['shape:rounded', 'Rounded'], ['shape:circle', 'Circle'], ['shape:oval', 'Oval'], ['shape:triangle', 'Triangle'], ['shape:diamond', 'Diamond'],
      ['shape:hexagon', 'Hexagon'], ['shape:pentagon', 'Pentagon'], ['shape:star', 'Star']]],
    ['Lines & dividers', [['line:solid', 'Line'], ['line:dashed', 'Dashed'], ['line:dotted', 'Dotted'], ['line:double', 'Double'], ['line:end', 'Arrow'], ['line:both', 'Double arrow']]],
    ['Icons', ['star', 'heart', 'gem', 'ring', 'crown', 'sparkle', 'gift', 'check', 'arrow', 'truck', 'shield', 'phone', 'mail', 'pin'].map((i) => ['icon:' + i, i[0].toUpperCase() + i.slice(1)])]
  ];
  function elPreview(code) {
    const [type, v] = code.split(':');
    const clip = { triangle: 'polygon(50% 0,100% 100%,0 100%)', diamond: 'polygon(50% 0,100% 50%,50% 100%,0 50%)', hexagon: 'polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)', pentagon: 'polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%)', star: 'polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' }[v];
    const rad = { rounded: '8px', circle: '50%', oval: '50%', arch: '99px 99px 0 0' }[v] || '0';
    const wh = v === 'oval' ? 'width:40px;height:26px' : v === 'portrait' ? 'width:26px;height:32px' : v === 'landscape' ? 'width:40px;height:23px' : v === 'arch' ? 'width:26px;height:34px' : 'width:32px;height:32px';
    if (type === 'text') return `<i class="el-pv-t" style="font-size:${v === 'h2' ? 20 : v === 'h3' ? 15 : 11}px">${v === 'p' ? 'Aa body' : 'Aa'}</i>`;
    if (type === 'button') return '<i class="el-pv" style="width:46px;height:16px;border-radius:99px;background:#3A2418"></i>';
    if (type === 'badge') return '<i class="el-pv" style="width:34px;height:12px;border-radius:99px;background:#5A1A2A"></i>';
    if (type === 'frame') return `<i class="el-pv" style="${wh};border-radius:${rad};${clip ? 'clip-path:' + clip : ''};background:repeating-linear-gradient(45deg,#e9dccb 0 5px,#f6efe6 5px 10px);outline:1px dashed #a88462"></i>`;
    if (type === 'shape') return `<i class="el-pv" style="${wh};border-radius:${rad};${clip ? 'clip-path:' + clip : ''};background:#A88462"></i>`;
    if (type === 'line') return `<i class="el-pv" style="width:40px;height:0;border-top:${v === 'double' ? '4px double' : '2px ' + (['dashed', 'dotted'].includes(v) ? v : 'solid')} #A88462"></i>`;
    return `<i class="el-pv-t" style="color:#A88462">${{ star: '★', heart: '♥', gem: '◆', ring: '◯', crown: '♛', sparkle: '✦', gift: '🎁︎', check: '✓', arrow: '→', truck: '⛟', shield: '⛨', phone: '☏', mail: '✉', pin: '⌖' }[v] || '★'}</i>`;
  }
  function elementDef(code) {
    const [type, v] = code.split(':');
    if (type === 'button') return { type, text: 'Shop the collection', href: '#collections/all', w: 240 };
    if (type === 'badge') return { type, text: 'New arrival', w: 130 };
    if (type === 'text') return { type, tag: v, text: v === 'p' ? 'Add a little bit of body text' : v === 'h2' ? 'Add a heading' : 'Add a subheading', w: v === 'p' ? 360 : 440 };
    if (type === 'frame') {
      const ratio = { square: '1 / 1', circle: '1 / 1', portrait: '4 / 5', landscape: '16 / 9', hexagon: '1 / 1', diamond: '1 / 1' }[v] || '';
      return { type, shape: v, w: v === 'landscape' ? 400 : 280, h: v === 'portrait' ? 350 : v === 'landscape' ? 225 : v === 'oval' ? 200 : v === 'arch' ? 360 : 280, aspect: ratio };
    }
    if (type === 'shape') return { type, shape: v, w: v === 'oval' ? 220 : 160, h: v === 'oval' ? 140 : 160 };
    if (type === 'line') return { type, lineStyle: ['dashed', 'dotted', 'double'].includes(v) ? v : 'solid', arrow: ['end', 'both'].includes(v) ? v : 'none', thickness: v === 'double' ? 4 : 2, w: 260, h: 20 };
    return { type: 'icon', icon: v, alt: v, w: 56, h: 56 };
  }

  const customOf = (secKey) => (pageData(cm.key).custom || []).find((c) => c.id === String(secKey).replace('custom:', ''));
  const typeName = (c) => { if (!c) return 'Section'; const t = c.type === 'library' ? 'Library section' : (SECTION_TYPES.find(([x]) => x === c.type) || [, 'Section'])[1]; return t; };
  const secLabel = (s, n) => {
    const label = (s.label || '').trim().slice(0, 40);
    return layerName(s.key, 'page', s.custom ? typeName(customOf(s.key)) + (label ? ': ' + label : '') : label || 'Section ' + (n + 1));
  };
  const itemLabel = (i) => layerName(i.key, i.scope, i.kind === 'design' ? EL_TYPE[i.type] + ((designOf(i) || {}).shape ? ' · ' + designOf(i).shape : (designOf(i) || {}).icon ? ' · ' + designOf(i).icon : '') :
    i.kind === 'image' ? 'Image' + (i.alt ? ': ' + i.alt : '') : i.kind === 'frame' ? 'Photo frame' : i.kind === 'box' ? i.label || 'Box' : (cmOverride(i).text != null ? cmOverride(i).text : i.text) || '(empty)');
  const KIND_ICON = { box: '▭', frame: '▢', text: 'T', link: '↗', image: '▣', frame: '▢', shape: '◆', line: '─', icon: '★', button: '⬭', badge: '◍' };

  function renderMediaPanel() {
    const box = $('#st-layers');
    const tabs = `<div class="seg ly-tabs" role="tablist"><button type="button" data-lytab="layers" aria-pressed="false">Layers</button><button type="button" data-lytab="media" aria-pressed="true">Media</button></div>`;
    if (!state.media) {
      box.innerHTML = tabs + '<div class="skel" style="height:240px;margin-top:var(--s3)"></div>';
      loadMedia().then(() => cm.lyTab === 'media' && renderMediaPanel()).catch((e) => { box.innerHTML = tabs + `<p class="note small">${esc(e.message)}</p>`; });
      return;
    }
    const it = cmItem(cm.sel); const target = it && (designOf(it) || {}).type === 'frame' ? 'the selected frame' : it && it.kind === 'image' ? 'the selected image' : 'a new frame';
    box.innerHTML = tabs + `<button class="btn btn-sm btn-primary" data-cm="media-up" style="width:100%;margin:var(--s3) 0 var(--s2)">Upload image</button>
      <p class="help" style="margin:0 0 var(--s2)">Drag a photo onto a frame or image to replace it, or anywhere on a section to place it. Click a photo to use it for ${target}.</p>
      <div class="md-grid">${state.media.map((m) => `<img src="${esc(imgSrc(m.path))}" alt="${esc(m.name)}" title="${esc(m.name)}" loading="lazy" draggable="true" data-mimg="${esc(m.path)}">`).join('')}</div>`;
  }
  // A photo dropped on the product page's photo frame becomes that product's main photo, in the product editor (saved only when you save there)
  async function addProductPhoto(path) {
    const handle = String(cm.route || '').replace(/^products\//, '');
    const prod = state.products.find((x) => x.handle === handle || x.id === handle);
    if (!prod) { toast('Open a product page to add photos to it.', true); return; }
    if (!confirm(`Make this photo the main photo of "${prod.name}"?\n\nThe product editor opens with it; nothing changes on the website until you save or publish the product there.`)) return;
    await show('editor', prod.id);
    if (!draft || draft.id !== prod.id) return;
    if (draft.image && draft.image !== path) { draft.gallery.unshift(draft.image); draft.galleryAlt.unshift(draft.imageAlt || ''); draft.galleryCaption.unshift(draft.imageCaption || ''); }
    draft.image = path; draft.imageAlt = ''; draft.imageCaption = '';
    renderSlots(); onEdit();
    toast('Photo set as the main photo. Add its ALT text, then Save or Publish.');
  }
  // Gallery arrows: put both just outside (or back inside) the photo frame on the current screen size
  function arrowPos(mode) {
    const w = pvWin(); const keys = ['[data-hj-id="pdp-prev"]', '[data-hj-id="pdp-next"]'];
    keys.forEach((k) => { if (!cmItem(k)) { const it = w.__hjAdmin.describe(k); if (it) { cm.scan.items.push(it); cm.extra.add(k); } } });
    const R = w.__hjAdmin.rects(keys); const F = w.__hjAdmin.rects(['[data-hj-id="pdp-photo"]'])[0];
    if (R.length < 2 || !F) { toast('This product has one photo, so it has no arrows. Preview a product with several photos.', true); return; }
    const out = {};
    R.forEach((r) => {
      const prev = r.key.includes('prev');
      out[r.key] = { x: mode === 'in' ? 0 : Math.round(r.tx + (prev ? F.left - 6 - (r.left + r.width) : F.left + F.width + 6 - r.left)) };
    });
    savePosMany(out, w.__hjAdmin.bp());
    if (mode === 'out') {
      const off = R.some((r) => (r.key.includes('prev') ? F.left - 6 - r.width < 0 : F.left + F.width + 6 + r.width > r.page));
      if (off) toast('There is little room beside the photo on this screen: make the arrows smaller, or keep them inside here.');
    }
  }
  function useImage(path) {
    const it = cmItem(cm.sel);
    if (it && (designOf(it) || {}).type === 'frame') return patchEl(it, { src: path });
    if (it && it.kind === 'image') {
      if (isTemplate(cm.key) && it.scope === 'page') { toast('Product and category photos come from Products / categories, not from the template.', true); return; }
      return patchItem(it, { src: path });
    }
    placeImage(path, null, null, null);
  }
  // A new frame holding the photo, at the photo's own proportions
  function placeImage(path, sec, x, y) {
    const img = new Image();
    img.onload = () => {
      const w = 300; const h = Math.round(w * img.naturalHeight / Math.max(1, img.naturalWidth));
      addDesignEl({ type: 'frame', shape: 'rect', src: path, alt: '', w, h, ...(x != null ? { x: Math.max(0, x - 10), y: Math.max(0, y - Math.round(h / 2)) } : {}) }, sec);
      toast('Photo placed. Add ALT text in Properties.');
    };
    img.onerror = () => toast('Could not load that image.', true);
    img.src = imgSrc(path);
  }

  function renderLayers() {
    const S = cm.scan; if (!S) return;
    if (cm.lyTab === 'media') return renderMediaPanel();
    const P = pageData(cm.key);
    const hidden = new Set([...(P.hidden || [])]);
    const row = (i) => {
      const o = cmOverride(i); const locked = isLocked(i.key, i.scope);
      return `<li class="ly-el ${cm.sel === i.key ? 'on' : ''}"><button type="button" class="ly-name" data-cmsel="${esc(i.key)}" ${locked ? 'aria-disabled="true"' : ''}>
        <span class="ly-k">${i.design && KIND_ICON[i.type] && i.type !== 'text' ? KIND_ICON[i.type] : i.kind === 'design' ? KIND_ICON[i.type] : i.tag === 'img' ? KIND_ICON.image : /^h[1-6]$/.test(o.tag || i.tag) ? (o.tag || i.tag).toUpperCase() : KIND_ICON[i.kind]}</span><span class="ly-t">${(P.groups || []).some((g) => g.includes(i.key)) ? '<span title="Grouped">⧉ </span>' : ''}${esc(itemLabel(i).slice(0, 60))}</span></button>
        <button type="button" class="ly-ic" data-eltog="${esc(i.key)}" aria-label="${o.hidden ? 'Show' : 'Hide'} element" title="${o.hidden ? 'Show' : 'Hide'}">${o.hidden ? '◌' : '●'}</button>
        <button type="button" class="ly-ic" data-ellock="${esc(i.key)}" data-scope="${i.scope}" aria-label="${locked ? 'Unlock' : 'Lock'} element" title="${locked ? 'Unlock' : 'Lock'}">${locked ? '🔒' : '🔓'}</button></li>`;
    };
    const section = (key, label, scope, n, s) => {
      const items = S.items.filter((i) => i.section === key);
      const open = cm.open[key];
      return `<li class="ly-sec ${cm.secSel === key && !cm.sel ? 'on' : ''} ${hidden.has(key) ? 'off' : ''}" ${scope === 'page' ? `draggable="true" data-sec="${esc(key)}"` : ''}>
        <div class="ly-row">${scope === 'page' ? '<span class="grip" aria-hidden="true">⋮⋮</span>' : ''}
          <button type="button" class="ly-car" data-lyopen="${esc(key)}" aria-expanded="${!!open}" aria-label="Expand">${open ? '▾' : '▸'}</button>
          <button type="button" class="ly-name" data-secsel="${esc(key)}" title="Double-click to rename"><span class="ly-t"><b>${esc(label)}</b></span>${S.overflow && S.overflow.includes(key) ? '<span class="pill high" title="Content is wider than the screen at this size">Overflow</span>' : ''}</button>
          ${scope === 'page' ? `<button type="button" class="ly-ic" data-sectog="${esc(key)}" aria-label="${hidden.has(key) ? 'Show' : 'Hide'} section">${hidden.has(key) ? '◌' : '●'}</button>` : ''}</div>
        ${open ? `<ul class="ly-els">${items.map(row).join('') || '<li class="small muted" style="padding:6px 10px">No editable text or images.</li>'}</ul>` : ''}</li>`;
    };
    $('#st-layers').innerHTML = `<div class="seg ly-tabs" role="tablist"><button type="button" data-lytab="layers" aria-pressed="true">Layers</button><button type="button" data-lytab="media" aria-pressed="false">Media</button></div>
      <button type="button" class="ly-page ${!cm.sel && !cm.secSel ? 'on' : ''}" data-cm="page-props">⚙ Page settings</button>
      <h4 class="ly-h">Sections</h4>
      <ol class="ly-list" id="cm-secs">${S.sections.map((s, n) => section(s.key, secLabel(s, n), 'page', n, s)).join('') || '<li class="small muted">This page has no sections yet.</li>'}</ol>
      <div class="row-flex" style="margin-top:var(--s2)"><button class="btn btn-sm" data-cm="add-section-menu" style="flex:1">+ Section</button><button class="btn btn-sm btn-primary" data-cm="add-el-menu" style="flex:1">+ Element</button></div>
      <h4 class="ly-h">Shared on every page</h4>
      <ul class="ly-list">${Object.entries(GLOBAL_NAMES).map(([k, v]) => section(k, layerName(k, 'global', v), 'global')).join('')}</ul>`;
  }

  // ----- properties panel (page / section / element) -----
  const NONE_OK = { 'data-ebg': 'No background', 'data-ebd': 'No border' };
  const PICK_FIELD = { 'data-swatch': 'color', 'data-ebg': 'bg', 'data-ebd': 'borderColor', 'data-ehbg': 'hoverBg', 'data-ehc': 'hoverColor' };
  const swatchRow = (attr, current) => `<div class="row-flex">${SWATCHES.map((c) => `<button type="button" class="sw ${current === c ? 'on' : ''}" style="background:${c}" ${attr}="${c}" aria-label="Colour ${c}"></button>`).join('')}
    <button type="button" class="sw ${!current ? 'on' : ''}" ${attr}="" aria-label="Default colour" title="Default">∅</button>
    ${NONE_OK[attr] ? `<button type="button" class="sw ${current === 'none' ? 'on' : ''}" ${attr}="none" aria-label="${NONE_OK[attr]}" title="${NONE_OK[attr]}">⊘</button>` : ''}
    ${PICK_FIELD[attr] ? `<input type="color" class="sw-pick" data-cpick="${PICK_FIELD[attr]}" value="${/^#[0-9a-f]{6}$/i.test(current || '') ? current : '#a88462'}" aria-label="Any colour" title="Any colour">` : ''}</div>`;
  const numField = (id, label, attr, value, ph = 'Default', min = 0, max = 400, step = 1) =>
    `<div><label for="${id}">${label}</label><input id="${id}" ${attr} type="number" min="${min}" max="${max}" step="${step}" value="${value == null ? '' : esc(value)}" placeholder="${ph}"></div>`;
  const group = (title, body, open = true) => `<details class="pg" ${open ? 'open' : ''}><summary>${title}</summary><div class="grid2">${body}</div></details>`;

  function renderProps() {
    const box = $('#st-props'); if (!box || !cm.scan) return;
    if (cm.multi && cm.multi.length > 1) return alignProps(box);
    if (cm.sel && cmItem(cm.sel)) return elementProps(box, cmItem(cm.sel));
    if (cm.secSel) return sectionProps(box, cm.secSel);
    pageProps(box);
  }

  function pageProps(box) {
    const P = pageData(cm.key); const S = cm.scan; const seo = P.seo || {};
    const imgs = S.items.filter((i) => i.kind === 'image' && i.scope === 'page');
    const noAlt = imgs.filter((i) => !((cmOverride(i).alt != null ? cmOverride(i).alt : i.alt) || '').trim()).length;
    const titles = Object.entries(cm.eff.pages).filter(([r, p]) => r !== cm.key && p.seo && p.seo.title).map(([, p]) => p.seo.title);
    const warn = [];
    if (isTemplate(cm.key)) warn.push('Templates hold layout and styling. Page titles come from each category or product.');
    else {
      if (S.h1 === 0) warn.push('This page has no H1 heading.');
      if (S.h1 > 1) warn.push(`This page has ${S.h1} H1 headings; use one.`);
      if (!seo.title) warn.push('No custom SEO title: the site title is used.');
      if (seo.title && titles.includes(seo.title)) warn.push('Another page already uses this SEO title.');
    }
    if (noAlt) warn.push(`${noAlt} image(s) have no ALT text.`);
    if (S.overflow && S.overflow.length) warn.push(`${S.overflow.length} section(s) overflow the screen at ${S.width}px wide.`);
    const stale = (S.missing || []).filter((m) => m.layer === 'page' || (m.layer === 'template' && isTemplate(cm.key)));
    if (stale.length) warn.push(`${stale.length} saved edit(s) no longer match anything on this page (the page layout changed).${isTemplate(cm.key) ? ' Some may only exist on other products.' : ''}`);
    const outline = S.items.filter((i) => /^h[1-6]$/.test(cmOverride(i).tag || i.tag) && i.scope === 'page');
    box.innerHTML = `<h3 class="pp-h">Page settings</h3>
      ${cm.key.startsWith('p/') ? group('Page', `<div class="full"><label for="pg-name">Page name</label><input id="pg-name" data-pg="name" value="${esc((P.meta || {}).name || '')}"></div>
        <p class="full help">Address: #${esc(cm.key)}</p>`) : ''}
      ${group('Background', `<div class="full"><label>Page background colour</label>${swatchRow('data-pgbg', (P.style || {}).bg)}</div>`)}
      ${isTemplate(cm.key) ? '' : group('SEO', `
        <div class="full"><label for="seo-t">SEO title <span class="count" id="seo-tc"></span></label><input id="seo-t" data-seo="title" value="${esc(seo.title || '')}" placeholder="${esc(S.title)}"></div>
        <div class="full"><label for="seo-d">Meta description <span class="count" id="seo-dc"></span></label><textarea id="seo-d" data-seo="description" rows="3">${esc(seo.description || '')}</textarea></div>
        <div class="full"><div class="snippet"><div class="u">houseofjewelux.com › ${esc(cm.route)}</div><div class="t" id="seo-st"></div><div class="d" id="seo-sd"></div></div></div>
        <div class="full"><label>Heading outline</label><ul class="log">${outline.map((i) => { const t = cmOverride(i).tag || i.tag; return `<li class="small" style="padding-left:${(Number(t[1]) - 1) * 12}px"><span class="pill">${t.toUpperCase()}</span> ${esc((cmOverride(i).text || i.text).slice(0, 60))}</li>`; }).join('') || '<li class="small muted">No headings.</li>'}</ul></div>
        <p class="full help">Canonical, robots and Open Graph are set once for the whole site in Homepage SEO (the site is one page with #addresses, so per-page tags are not read by Google).</p>`)}
      ${group('Checks', `<div class="full">${warn.length ? `<ul class="log">${warn.map((w) => `<li class="small">⚠ ${esc(w)}</li>`).join('')}</ul>` : '<p class="small" style="margin:0">✓ No problems found.</p>'}
        ${stale.length && !isTemplate(cm.key) ? '<button class="btn btn-sm" data-cm="drop-stale" style="margin-top:var(--s2)">Remove outdated edits</button>' : ''}</div>`)}
      ${group('Version history', '<div class="full" id="hist"><div class="skel" style="height:80px"></div></div>', false)}`;
    const upd = () => { const t = $('#seo-t'); if (!t) return; const d = $('#seo-d');
      $('#seo-tc').textContent = t.value.trim().length + ' / 60'; $('#seo-tc').classList.toggle('over', t.value.trim().length > 60);
      $('#seo-dc').textContent = d.value.trim().length + ' / 160'; $('#seo-dc').classList.toggle('over', d.value.trim().length > 160);
      $('#seo-st').textContent = t.value.trim() || S.title; $('#seo-sd').textContent = d.value.trim() || '(the site default description)'; };
    upd();
    box.querySelectorAll('[data-seo]').forEach((el) => el.addEventListener('input', upd));
    box.querySelector('details:last-of-type').addEventListener('toggle', (e) => { if (e.target.open) cmHistory(); }, { once: true });
  }

  function sectionProps(box, key) {
    const global = Object.keys(GLOBAL_NAMES).includes(key);
    const pk = global ? '*' : cm.key;
    const P = pageData(pk); const st = (P.sectionStyle || {})[key] || {};
    const s = cm.scan.sections.find((x) => x.key === key);
    const c = !global && customOf(key);
    const vis = (P.hidden || []).includes(key) ? 'hidden' : (P.hideMobile || []).includes(key) ? 'mobile' : (P.hideDesktop || []).includes(key) ? 'desktop' : 'all';
    const lib = c && c.type === 'library' ? (cm.eff.library || []).find((l) => l.id === c.ref) : null;
    const src = lib || c;
    box.innerHTML = `<h3 class="pp-h">${esc(global ? GLOBAL_NAMES[key] : secLabel(s || { key, label: '' }, 0))}</h3>
      ${global ? `<p class="note small">Shared component: changes appear on all pages of the website.</p>` : ''}
      ${src ? group('Content', customFields(src, !!lib)) : ''}
      ${group('Design', `
        <div class="full"><label>Background colour</label>${swatchRow('data-ssbg', st.bg)}</div>
        <div><label for="ss-grad">Gradient</label><select id="ss-grad" data-ss="grad">${[['', 'None'], ['gold', 'Champagne gold'], ['champagne', 'Champagne'], ['wine', 'Burgundy wine'], ['espresso', 'Espresso'], ['ivory', 'Ivory'], ['rose', 'Rose']].map(([v, l]) => `<option value="${v}" ${(st.grad || '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        ${numField('ss-ga', 'Gradient angle (°)', 'data-ss="gradAngle"', st.gradAngle, '135', 0, 360)}
        <div class="full"><label>Text colour</label>${swatchRow('data-sscolor', st.color)}</div>
        ${numField('ss-pt', 'Padding top (px)', 'data-ss="pt"', st.pt)}${numField('ss-pb', 'Padding bottom (px)', 'data-ss="pb"', st.pb)}
        ${numField('ss-mh', 'Minimum height (px)', 'data-ss="minH"', st.minH, 'Auto', 0, 2000)}
        <div><label for="ss-al">Content alignment</label><select id="ss-al" data-ss="align">${[['', 'Default'], ['left', 'Left'], ['center', 'Centre'], ['right', 'Right']].map(([v, l]) => `<option value="${v}" ${(st.align || '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        ${numField('ss-op', 'Opacity (0.1–1)', 'data-ss="opacity"', st.opacity, '1', 0.1, 1, 0.05)}
        <div class="full"><label>Background image</label><div class="row-flex">${st.bgImage ? `<img src="${esc(imgSrc(st.bgImage))}" alt="" style="width:64px;height:44px;object-fit:cover;border-radius:6px">` : ''}
          <button class="btn btn-sm" data-cm="ss-bgimg">Choose</button>${st.bgImage ? '<button class="btn btn-sm" data-cm="ss-bgimg-clear">Remove</button>' : ''}</div></div>`)}
      ${global ? '' : group('Visibility', `<div class="full"><select data-secvis="${esc(key)}">${[['all', 'Visible everywhere'], ['mobile', 'Hide on mobile'], ['desktop', 'Hide on desktop'], ['hidden', 'Hidden']].map(([v, l]) => `<option value="${v}" ${vis === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`)}
      <div class="row-flex" style="margin-top:var(--s3)">
        <button class="btn btn-sm" data-cm="rename-sec">Rename layer</button>
        ${c && !lib ? '<button class="btn btn-sm" data-cm="save-to-library">Save to library</button><button class="btn btn-sm" data-cm="dup-sec">Duplicate</button>' : ''}
        ${c ? '<button class="btn btn-sm btn-danger" data-cm="del-sec">Delete section</button>' : ''}
        <button class="btn btn-sm" data-cm="reset-sec">Reset design</button></div>
      ${!c && !global ? '<p class="help">Built-in section: you can restyle, hide or move it. It cannot be deleted or duplicated because it contains site features (sliders, forms, product grids).</p>' : ''}
      ${global || c ? '' : `<p class="help">Click text or images inside it on the canvas to edit them.</p>`}`;
  }

  function customFields(c, isLib) {
    if (isLib) return `<p class="full note small">Linked to the library section "${esc(c.heading || c.type)}". Edit it in the Section library to change it everywhere.</p>`;
    if (c.type === 'divider') return '<p class="full help">A thin gold divider line.</p>';
    if (c.type === 'spacer') return numField('c-h', 'Height (px)', 'data-c="height"', c.height || 64, '64', 8, 400);
    const hasImg = ['banner', 'split', 'image'].includes(c.type);
    return `
      ${c.type !== 'image' ? `<div class="full"><label for="c-heading">Heading</label><input id="c-heading" data-c="heading" value="${esc(c.heading || '')}"></div>
      <div class="full"><label for="c-text">Text</label><textarea id="c-text" data-c="text" rows="4">${esc(c.text || '')}</textarea></div>` : ''}
      ${hasImg ? `<div class="full row-flex"><img src="${esc(imgSrc(c.image || ''))}" alt="" style="width:96px;height:72px;object-fit:cover;border-radius:var(--r-sm);background:var(--line)">
        <button class="btn btn-sm" data-cm="custom-pick">Choose image</button><button class="btn btn-sm" data-cm="custom-upload">Upload</button></div>
        <div class="full"><label for="c-alt" class="req">Image ALT text</label><input id="c-alt" data-c="alt" value="${esc(c.alt || '')}"></div>` : ''}
      ${['text', 'banner', 'split', 'cta'].includes(c.type) ? `<div><label for="c-bl">Button label</label><input id="c-bl" data-c="buttonLabel" value="${esc(c.buttonLabel || '')}"></div>
      <div><label for="c-bh">Button link</label><input id="c-bh" data-c="buttonHref" list="dl-routes" value="${esc(c.buttonHref || '')}" placeholder="#collections/all"></div>
      <div><label for="c-align">Alignment</label><select id="c-align" data-c="align"><option value="center" ${c.align !== 'left' ? 'selected' : ''}>Centre</option><option value="left" ${c.align === 'left' ? 'selected' : ''}>Left</option></select></div>` : ''}
      <datalist id="dl-routes">${STATIC_PAGES.map(([r, n]) => `<option value="#${r}">${n}</option>`).join('')}</datalist>`;
  }

  function elementProps(box, it) {
    const o = cmOverride(it);
    const D = designOf(it);
    const tpl = isTemplate(cm.key) && it.scope === 'page';
    const val = (k, def) => esc(o[k] != null ? o[k] : def == null ? '' : def);
    const sel = (id, attr, opts, cur) => `<select id="${id}" ${attr}>${opts.map(([v, l]) => `<option value="${v}" ${String(cur == null ? '' : cur) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    const isBtn = it.kind === 'link' || it.tag === 'button';
    const P = (o.pos || {})[curBp()] || {};
    const posGroup = group('Position & size', `
      <p class="full help" style="margin:0">Editing <b>${bpName[curBp()]}</b>. Each screen size keeps its own position; switch the preview size to edit another.</p>
      ${numField('p-x', 'X offset (px)', 'data-p="x"', P.x, '0', -3000, 3000)}${numField('p-y', 'Y offset (px)', 'data-p="y"', P.y, '0', -3000, 3000)}
      ${numField('p-w', 'Width (px)', 'data-p="w"', P.w, 'Auto', 8, 4000)}${numField('p-h', 'Height (px)', 'data-p="h"', P.h, 'Auto', 8, 4000)}
      ${numField('p-r', 'Rotation (°)', 'data-p="r"', P.r, '0', -360, 360)}
      <div class="full"><label>Layer order <span class="small muted">(z = ${P.z || 0})</span></label><div class="row-flex"><button type="button" class="btn btn-sm" data-zorder="top" title="Bring to front (Shift+])">⤒ Front</button><button type="button" class="btn btn-sm" data-zorder="1" title="Bring forward (])">⬆ Forward</button><button type="button" class="btn btn-sm" data-zorder="-1" title="Send backward ([)">⬇ Backward</button><button type="button" class="btn btn-sm" data-zorder="bottom" title="Send to back (Shift+[)">⤓ Back</button></div></div>
      <div class="full row-flex"><button type="button" class="btn btn-sm" data-al="secc">Centre in section</button><button type="button" class="btn btn-sm" data-al="pagec">Centre on page</button>
        <button type="button" class="btn btn-sm" data-cm="reset-pos">Reset (this size)</button>
        ${curBp() !== 'd' ? `<button type="button" class="btn btn-sm" data-cm="pos-inherit" title="Use the position and size from the larger screen">Copy from ${curBp() === 't' ? 'desktop' : 'tablet'}</button>` : ''}</div>
      <p class="full help" style="margin:0">Drag the element on the canvas, or use the handles to resize and rotate. Moves are an offset from its place in the layout, so the rest of the page keeps flowing.</p>`);
    const range = (id, label, attr, v, min, max, step, unit) => `<div><label for="${id}">${label} <span class="small muted" data-rv="${id}">${v}${unit}</span></label><input id="${id}" ${attr} type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-unit="${unit}"></div>`;
    const adjustGroup = () => group('Adjust image', `
        <p class="full help" style="margin:0">Presentation only: the original photo is not changed. Keep metal and stone colours true to the real piece.</p>
        ${range('e-br', 'Brightness', 'data-e="brightness"', o.brightness != null ? o.brightness : 100, 50, 150, 1, '%')}${range('e-ct', 'Contrast', 'data-e="contrast"', o.contrast != null ? o.contrast : 100, 50, 150, 1, '%')}
        ${range('e-sa', 'Saturation', 'data-e="saturate"', o.saturate != null ? o.saturate : 100, 0, 200, 1, '%')}
        <div><label>Flip</label><label class="check"><input type="checkbox" data-e="flipH" ${o.flipH ? 'checked' : ''}> Horizontal</label><label class="check"><input type="checkbox" data-e="flipV" ${o.flipV ? 'checked' : ''}> Vertical</label></div>`, false);
    const boxGroup = (title, open) => group(title, `
        <div class="full"><label>${it.type === 'shape' ? 'Fill' : 'Background'}</label>${swatchRow('data-ebg', o.bg)}</div>
        <div><label for="e-grad">Gradient</label>${sel('e-grad', 'data-e="grad"', [['', 'None'], ['gold', 'Champagne gold'], ['champagne', 'Champagne'], ['wine', 'Burgundy wine'], ['espresso', 'Espresso'], ['ivory', 'Ivory'], ['rose', 'Rose']], o.grad || '')}</div>${numField('e-ga', 'Gradient angle (°)', 'data-e="gradAngle"', o.gradAngle, '135', 0, 360)}
        <div class="full"><label>Border colour</label>${swatchRow('data-ebd', o.borderColor)}</div>
        ${numField('e-bw', 'Border width (px)', 'data-e="borderWidth"', o.borderWidth, '1', 0, 20)}${numField('e-rad', 'Corner radius (px)', 'data-e="radius"', o.radius, 'Default', 0, 999)}
        <div><label for="e-sh">Shadow</label>${sel('e-sh', 'data-e="shadow"', [['', 'Default'], ['none', 'None'], ['soft', 'Soft'], ['strong', 'Strong'], ['glow', 'Gold glow']], o.shadow || '')}</div>
        ${numField('e-op', 'Opacity (0.05–1)', 'data-e="opacity"', o.opacity, '1', 0.05, 1, 0.05)}
        ${it.type === 'text' ? numField('e-px', 'Padding left/right (px)', 'data-e="padX"', o.padX, '0', 0, 120) + numField('e-py', 'Padding top/bottom (px)', 'data-e="padY"', o.padY, '0', 0, 120) : ''}`, open);
    const effectsGroup = group('Animation & hover', `
        <div><label for="e-anim">Entrance</label>${sel('e-anim', 'data-e="anim"', [['', 'None'], ['fade', 'Fade in'], ['up', 'Slide up'], ['down', 'Slide down'], ['left', 'Slide from left'], ['right', 'Slide from right'], ['zoom', 'Scale in'], ['rotate', 'Rotate in']], o.anim || '')}</div>
        <div><label for="e-aon">Starts</label>${sel('e-aon', 'data-e="animOn"', [['', 'When scrolled into view'], ['load', 'When the page opens']], o.animOn || '')}</div>
        ${numField('e-adur', 'Duration (s)', 'data-e="animDur"', o.animDur, '0.8', 0.1, 5, 0.1)}${numField('e-adel', 'Delay (s)', 'data-e="animDelay"', o.animDelay, '0', 0, 5, 0.1)}
        <div><label for="e-aease">Easing</label>${sel('e-aease', 'data-e="animEase"', [['', 'Smooth (luxury)'], ['ease', 'Ease out'], ['inout', 'Ease in-out'], ['linear', 'Linear']], o.animEase || '')}</div>
        <div><label for="e-hov">On hover</label>${sel('e-hov', 'data-e="hover"', [['', 'Nothing'], ['lift', 'Lift'], ['grow', 'Grow'], ['glow', 'Gold glow'], ['dim', 'Dim']], o.hover || '')}</div>
        <div class="full row-flex"><button type="button" class="btn btn-sm" data-cm="anim-preview" ${o.anim ? '' : 'disabled'}>▶ Preview animation</button></div>
        <p class="full help" style="margin:0">Visitors who turn off motion in their device settings see no animation.</p>`, false);
    const designGroup = () => {
      if (!D) return '';
      const de = (k) => esc(D[k] != null ? D[k] : '');
      const dsel = (id, k, opts) => sel(id, `data-de="${k}"`, opts, D[k] || '');
      if (D.type === 'frame') {
        const fx = D.fx != null ? D.fx : 50; const fy = D.fy != null ? D.fy : 50; const z = D.zoom || 1;
        return group('Frame', `
          <div class="full row-flex" style="flex-wrap:nowrap;align-items:flex-start">${D.src ? `<img src="${esc(imgSrc(D.src))}" alt="" style="width:96px;height:96px;object-fit:cover;border-radius:var(--r-sm);object-position:${fx}% ${fy}%">` : '<div class="frame-empty">No image</div>'}
            <div class="row-flex"><button class="btn btn-sm btn-primary" data-cm="frame-pick">${D.src ? 'Replace image' : 'Choose image'}</button><button class="btn btn-sm" data-cm="frame-upload">Upload</button>${D.src ? '<button class="btn btn-sm" data-cm="frame-clear">Remove</button>' : ''}</div></div>
          ${D.src ? `<div class="full"><label class="req" for="d-alt">ALT text</label><input id="d-alt" data-de="alt" value="${de('alt')}" placeholder="Describe what the image shows"></div>
          ${range('d-zoom', 'Zoom', 'data-de="zoom"', z, 1, 4, 0.05, '×')}<div></div>
          ${range('d-fx', 'Focus left–right', 'data-de="fx"', fx, 0, 100, 1, '%')}${range('d-fy', 'Focus top–bottom', 'data-de="fy"', fy, 0, 100, 1, '%')}
          <p class="full help" style="margin:0">Zoom and focus crop the image inside the frame. Replacing the image keeps the frame's size.</p>` : ''}
          <div><label for="d-shape">Shape</label>${dsel('d-shape', 'shape', [['rect', 'Rectangle'], ['square', 'Square'], ['rounded', 'Rounded'], ['circle', 'Circle'], ['oval', 'Oval'], ['arch', 'Arch'], ['hexagon', 'Hexagon'], ['diamond', 'Diamond'], ['star', 'Star'], ['triangle', 'Triangle']])}</div>
          <div><label for="d-asp">Proportions</label>${dsel('d-asp', 'aspect', [['', 'Free (unlocked)'], ['1 / 1', 'Locked 1:1'], ['4 / 5', 'Locked 4:5'], ['3 / 4', 'Locked 3:4'], ['2 / 3', 'Locked 2:3'], ['16 / 9', 'Locked 16:9'], ['3 / 2', 'Locked 3:2']])}</div>`);
      }
      if (D.type === 'shape') return group('Shape', `<div class="full"><label for="d-shape">Shape</label>${dsel('d-shape', 'shape', [['rect', 'Rectangle'], ['rounded', 'Rounded'], ['circle', 'Circle'], ['oval', 'Oval'], ['triangle', 'Triangle'], ['diamond', 'Diamond'], ['hexagon', 'Hexagon'], ['pentagon', 'Pentagon'], ['star', 'Star'], ['arch', 'Arch']])}</div>
          <p class="full help" style="margin:0">Colour: Fill, below. Size and angle: drag the handles or use Position & size.</p>`);
      if (D.type === 'line') return group('Line', `
          ${numField('d-th', 'Thickness (px)', 'data-de="thickness"', D.thickness, '2', 1, 40)}
          <div><label for="d-ls">Style</label>${dsel('d-ls', 'lineStyle', [['solid', 'Solid'], ['dashed', 'Dashed'], ['dotted', 'Dotted'], ['double', 'Double']])}</div>
          <div><label for="d-ar">Ends</label>${dsel('d-ar', 'arrow', [['none', 'Plain'], ['end', 'Arrow at the end'], ['both', 'Arrows at both ends']])}</div>
          <div class="full"><label>Colour</label>${swatchRow('data-swatch', o.color)}</div>
          <p class="full help" style="margin:0">Length = width. Direction = rotation (top handle; Shift snaps to 45°).</p>`);
      if (D.type === 'icon') return group('Icon', `
          <div><label for="d-ic">Icon</label>${dsel('d-ic', 'icon', ELEMENT_MENU[4][1].map(([c, n]) => [c.split(':')[1], n]))}</div>
          ${numField('d-st', 'Line weight', 'data-de="stroke"', D.stroke, '1.5', 0.5, 4, 0.25)}
          <div class="full"><label for="d-alt">Label for screen readers</label><input id="d-alt" data-de="alt" value="${de('alt')}"></div>
          <div class="full"><label>Colour</label>${swatchRow('data-swatch', o.color)}</div>`);
      if (D.type === 'text') return group('Text box', `<div><label for="d-tag">Heading level (SEO)</label>${dsel('d-tag', 'tag', [['h1', 'H1'], ['h2', 'H2'], ['h3', 'H3'], ['h4', 'H4'], ['h5', 'H5'], ['h6', 'H6'], ['p', 'Paragraph']])}</div>
          <p class="full help" style="margin:0">The level is for search engines and screen readers; the look comes from Typography.</p>`, false);
      return '';
    };
    const elButtons = D ? `<div class="row-flex" style="margin-top:var(--s3)"><button class="btn btn-sm" data-cm="el-dup" title="Ctrl+D">Duplicate</button><button class="btn btn-sm" data-cm="el-copy" title="Ctrl+C">Copy</button>
        <button class="btn btn-sm btn-danger" data-cm="el-del" title="Delete">Delete</button></div>` : '';
    const W = pvWin(); const chain = W && W.__hjAdmin.chain ? W.__hjAdmin.chain(it.key) : [];
    const crumbs = `<nav class="el-path" aria-label="Select a parent">${it.scope === 'global' ? '' : `<button type="button" data-secsel="${esc(it.section)}">Section</button><span>›</span>`}${chain.map((c) => `<button type="button" data-pickel="${esc(c.key)}" title="Select this parent">${esc(c.label.slice(0, 26))}</button><span>›</span>`).join('')}<b>${esc((it.label || it.tag || '').slice(0, 26))}</b></nav>`;
    let html = crumbs + `<h3 class="pp-h">${D ? EL_TYPE[D.type] : it.kind === 'frame' ? 'Photo frame' : it.kind === 'box' ? esc(it.label || 'Box') : it.kind === 'image' ? 'Image' : isBtn ? 'Button / link' : /^h[1-6]$/.test(it.tag) ? 'Heading' : 'Text'} <span class="pill">${esc(D ? D.shape || D.icon || D.tag || D.lineStyle || '' : it.tag)}</span></h3>
      <p class="small muted" style="margin-top:-8px">${esc(it.scope === 'global' ? GLOBAL_NAMES[it.section] + ' · on every page' : 'In ' + secLabel(cm.scan.sections.find((s) => s.key === it.section) || { key: it.section, label: '' }, 0))}</p>
      ${tpl && !D ? '<p class="note small">Template: text, images and links here come from each product or category, so only styling and visibility can change.</p>' : ''}` + posGroup + designGroup();
    const isArrow = /pdp-(prev|next)/.test(it.key);
    if (isArrow) html += group('Arrow position', `<div class="full row-flex"><button type="button" class="btn btn-sm" data-arrowpos="out">Outside the photo</button><button type="button" class="btn btn-sm" data-arrowpos="in">Inside the photo</button></div>
        <p class="full help" style="margin:0">Moves both arrows on <b>${bpName[curBp()]}</b>. Or drag an arrow anywhere. To remove the circle: Background ⊘ and Border ⊘ below.</p>`);
    if (it.kind === 'box') {
      html += boxGroup('Fill, border & corners', true) + (it.tag === 'svg' ? group('Icon colour', `<div class="full">${swatchRow('data-swatch', o.color)}</div>`) : '') + effectsGroup;
    } else if (it.kind === 'frame' && !D) {
      html += group('Photo frame', `
        <p class="full help" style="margin:0">Drag the frame's handles on the canvas to any width and height, or type them above (each screen size separately). The photo always fills the frame.</p>
        <div><label for="e-aspect">Proportions</label>${sel('e-aspect', 'data-e="aspect"', [['', 'Free (drag to any size)'], ['1 / 1', 'Lock 1:1 square'], ['4 / 5', 'Lock 4:5 portrait'], ['3 / 4', 'Lock 3:4'], ['2 / 3', 'Lock 2:3'], ['3 / 2', 'Lock 3:2'], ['16 / 9', 'Lock 16:9']], o.aspect || '')}</div>
        <div><label for="e-fit">Photo in frame</label>${sel('e-fit', 'data-e="fit"', [['', 'Fill the frame (edges crop)'], ['contain', 'Show the whole photo']], o.fit || '')}</div>
        ${isTemplate(cm.key) ? '<p class="full note small" style="margin:0">Applies to every product page. The photos themselves belong to each product: drop a photo on this frame to add it to the product shown, or change photos in <a href="#" data-go="products">Products</a>.</p>' : ''}`) +
        boxGroup('Border, corners & shadow', true) + effectsGroup;
    } else if (D && !['text', 'button', 'badge'].includes(D.type)) {
      html += (D.type === 'frame' && D.src ? adjustGroup() : '') + (D.type === 'line' || D.type === 'icon' ? '' : boxGroup(D.type === 'shape' ? 'Fill & border' : 'Border & effects', D.type === 'shape')) + effectsGroup;
    } else if (it.kind === 'image') {
      const [fx, fy] = (o.objectPosition || '50% 50%').split(' ').map((v) => parseInt(v, 10));
      html += (tpl ? '' : group('Image', `
        <div class="full row-flex" style="flex-wrap:nowrap;align-items:flex-start"><img src="${esc(imgSrc(o.src || it.src))}" alt="" style="width:96px;height:96px;object-fit:cover;border-radius:var(--r-sm);background:var(--line);object-position:${fx}% ${fy}%">
          <div style="min-width:0"><p class="help" style="word-break:break-all;margin:0 0 var(--s2)">${esc(o.src || it.src)}</p><div class="row-flex"><button class="btn btn-sm" data-cm="pick-image">Replace</button><button class="btn btn-sm" data-cm="upload-image">Upload</button></div></div></div>
        <div class="full"><label class="req" for="e-alt">ALT text</label><input id="e-alt" data-e="alt" value="${val('alt', it.alt)}" placeholder="Describe what the image shows"></div>
        <div class="full"><label for="e-title">Title (tooltip)</label><input id="e-title" data-e="title" value="${val('title', '')}"></div>`)) +
      group('Crop and size', `
        <div><label for="e-aspect">Aspect ratio</label>${sel('e-aspect', 'data-e="aspect"', [['', 'Original'], ['1 / 1', '1:1'], ['4 / 5', '4:5'], ['3 / 4', '3:4'], ['16 / 9', '16:9']], o.aspect || '')}</div>
        ${numField('e-mw', 'Width (% of space)', 'data-e="maxWidth"', o.maxWidth, '100', 10, 100)}
        <div><label for="e-fx">Focus left–right <span id="fxv">${fx}%</span></label><input id="e-fx" data-e="fx" type="range" min="0" max="100" value="${fx}"></div>
        <div><label for="e-fy">Focus top–bottom <span id="fyv">${fy}%</span></label><input id="e-fy" data-e="fy" type="range" min="0" max="100" value="${fy}"></div>
        ${numField('e-rad', 'Corner radius (px)', 'data-e="radius"', o.radius, 'Default', 0, 200)}`) + adjustGroup() + effectsGroup;
    } else {
      html += (tpl && !D ? '' : group('Content', `
        <div class="full"><label for="e-text">${isBtn ? 'Label' : 'Text'}</label><textarea id="e-text" data-e="text" rows="${it.text.length > 120 ? 5 : 2}">${val('text', it.text)}</textarea>
          ${it.hasMarkup ? '<p class="help">Has formatting inside (line breaks, icons); editing makes it plain text.</p>' : ''}</div>
        ${it.kind === 'link' ? `<div class="full"><label for="e-href">Destination</label><input id="e-href" data-e="href" list="dl-routes" value="${val('href', it.href)}" placeholder="#about or https://…"><p class="help" id="href-check"></p>
          <datalist id="dl-routes">${STATIC_PAGES.map(([r, n]) => `<option value="#${r}">${n}</option>`).join('')}</datalist></div>
          <div class="full"><label class="check"><input type="checkbox" data-e="newTab" ${o.newTab ? 'checked' : ''}> Open in a new tab</label></div>` : ''}
        ${/^h[1-6]$/.test(it.tag) && !D ? `<div><label for="e-tag">Heading level (SEO)</label>${sel('e-tag', 'data-e="tag"', [1, 2, 3, 4, 5, 6].map((n) => ['h' + n, 'H' + n]), o.tag || it.tag)}</div>` : ''}`)) +
      group('Typography', `
        <div><label for="e-font">Font</label>${sel('e-font', 'data-e="font"', [['', 'Default'], ['display', 'Lawrence (brand)'], ['cinzel', 'Cinzel'], ['cormorant', 'Cormorant Garamond'], ['playfair', 'Playfair Display'], ['serif', 'Site serif'], ['manrope', 'Manrope'], ['montserrat', 'Montserrat'], ['sans', 'Site sans-serif']], o.font || '')}</div>
        ${numField('e-size', 'Size (px)', 'data-e="size"', o.size, 'Default', 8, 160)}
        <div><label for="e-weight">Weight</label>${sel('e-weight', 'data-e="weight"', [['', 'Default'], ['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold']], o.weight || '')}</div>
        ${numField('e-lh', 'Line height', 'data-e="lineHeight"', o.lineHeight, 'Default', 0.8, 4, 0.05)}
        ${numField('e-ls', 'Letter spacing (px)', 'data-e="letterSpacing"', o.letterSpacing, 'Default', -5, 20, 0.5)}
        <div><label>Align</label><div class="seg" role="group" aria-label="Text alignment">${[['', 'Auto'], ['left', 'Left'], ['center', 'Centre'], ['right', 'Right']].map(([v, l]) => `<button type="button" data-ealign="${v}" aria-pressed="${(o.align || '') === v}">${l}</button>`).join('')}</div></div>
        <div class="full"><label>Colour</label>${swatchRow('data-swatch', o.color)}</div>
        <div class="full row-flex"><label class="check"><input type="checkbox" data-e="italic" ${o.italic ? 'checked' : ''}> <i>Italic</i></label>
          ${sel('e-deco', 'data-e="deco" aria-label="Line"', [['', 'No line'], ['underline', 'Underline'], ['line-through', 'Strikethrough']], o.deco || '')}
          ${sel('e-case', 'data-e="case" aria-label="Letter case"', [['', 'Case as typed'], ['uppercase', 'UPPERCASE'], ['lowercase', 'lowercase'], ['capitalize', 'Title Case']], o.case || '')}
          ${sel('e-tsh', 'data-e="textShadow" aria-label="Text shadow"', [['', 'No text shadow'], ['soft', 'Soft shadow'], ['strong', 'Strong shadow'], ['glow', 'Glow']], o.textShadow || '')}</div>`) +
      (D && !isBtn ? boxGroup('Box: background & border', false) : '') + effectsGroup +
      (isBtn ? group('Button design', `
        <div class="full"><label>Background</label>${swatchRow('data-ebg', o.bg)}</div>
        <div><label for="e-grad">Gradient</label>${sel('e-grad', 'data-e="grad"', [['', 'None'], ['gold', 'Champagne gold'], ['champagne', 'Champagne'], ['wine', 'Burgundy wine'], ['espresso', 'Espresso'], ['ivory', 'Ivory'], ['rose', 'Rose']], o.grad || '')}</div>${numField('e-ga', 'Gradient angle (°)', 'data-e="gradAngle"', o.gradAngle, '135', 0, 360)}
        <div class="full"><label>Border colour</label>${swatchRow('data-ebd', o.borderColor)}</div>
        ${numField('e-rad', 'Corner radius (px)', 'data-e="radius"', o.radius, 'Default', 0, 200)}
        ${numField('e-px', 'Padding left/right (px)', 'data-e="padX"', o.padX, 'Default', 0, 120)}${numField('e-py', 'Padding top/bottom (px)', 'data-e="padY"', o.padY, 'Default', 0, 120)}
        ${numField('e-bw', 'Border width (px)', 'data-e="borderWidth"', o.borderWidth, '1', 0, 20)}
        <div><label for="e-sh">Shadow</label>${sel('e-sh', 'data-e="shadow"', [['', 'Default'], ['none', 'None'], ['soft', 'Soft'], ['strong', 'Strong'], ['glow', 'Gold glow']], o.shadow || '')}</div>
        ${numField('e-op', 'Opacity (0.05–1)', 'data-e="opacity"', o.opacity, '1', 0.05, 1, 0.05)}
        <div class="full"><label>Hover background</label>${swatchRow('data-ehbg', o.hoverBg)}</div>
        <div class="full"><label>Hover text colour</label>${swatchRow('data-ehc', o.hoverColor)}</div>`, false) : '');
    }
    html += group('Visibility', `<div class="full">${sel('e-vis', 'data-e="visibility"', [['all', 'Visible'], ['hidden', 'Hidden']], o.hidden ? 'hidden' : 'all')}</div>`, false) +
      `<div class="row-flex" style="margin-top:var(--s3)"><button class="btn btn-sm" data-cm="rename-el">Rename layer</button><button class="btn btn-sm" data-cm="copy-style">Copy style</button>
        <button class="btn btn-sm" data-cm="paste-style" ${cm.clip ? '' : 'disabled'}>Paste style</button>${D ? '' : '<button class="btn btn-sm" data-cm="reset-el">Restore original</button>'}</div>` + elButtons;
    box.innerHTML = html;
    const chk = $('#href-check');
    if (chk) { const p = linkProblem($('#e-href').value.trim()); chk.textContent = p ? '⚠ ' + p : '✓ Link looks valid'; chk.style.color = p ? 'var(--bad)' : 'var(--ok)'; }
  }

  // Several elements selected (Shift+click): align, distribute, match size
  function alignProps(box) {
    const btn = (a, l, t) => `<button type="button" class="btn btn-sm" data-al="${a}" title="${t || l}">${l}</button>`;
    box.innerHTML = `<h3 class="pp-h">${cm.multi.length} elements selected</h3>
      <p class="help" style="margin-top:-6px">Shift+click on the canvas or in Layers to add or remove elements. Editing <b>${bpName[curBp()]}</b>.</p>
      ${group('Align', `<div class="full row-flex">${btn('left', '⇤ Left')}${btn('hcenter', '↔ Centre')}${btn('right', 'Right ⇥')}</div>
        <div class="full row-flex">${btn('top', '⤒ Top')}${btn('vcenter', '↕ Middle')}${btn('bottom', 'Bottom ⤓')}</div>`)}
      ${group('Distribute', `<div class="full row-flex">${btn('disth', 'Equal spacing ↔', 'Distribute horizontally')}${btn('distv', 'Equal spacing ↕', 'Distribute vertically')}</div>`)}
      ${group('Match', `<div class="full row-flex">${btn('matchw', 'Same width')}${btn('matchh', 'Same height')}${btn('matchs', 'Same size')}</div>
        <p class="full help" style="margin:0">Matches the first element you selected.</p>`)}
      ${group('Centre', `<div class="full row-flex">${btn('secc', 'Centre in section')}${btn('pagec', 'Centre on page')}</div>`)}
      ${group('Group', `<div class="full row-flex"><button type="button" class="btn btn-sm" data-cm="group">${(pageData(cm.key).groups || []).some((g) => cm.multi.every((k) => g.includes(k))) ? 'Ungroup' : 'Group'} (Ctrl+G)</button>
        <button type="button" class="btn btn-sm btn-danger" data-cm="el-del">Delete</button></div><p class="full help" style="margin:0">Drag any selected element on the canvas to move them all together.</p>`)}
      <button type="button" class="btn btn-sm" data-cm="clear-multi" style="margin-top:var(--s3)">Clear selection</button>`;
  }

  // Save an element's position for one breakpoint (from a canvas drag, nudge or the number fields)
  function savePos(key, bp, pos, keepForm) {
    const it = cmItem(key); if (!it || !/^[dtm]$/.test(bp)) return;
    if (pos.w != null && ((designOf(it) || {}).aspect || (it.kind === 'frame' && cmOverride(it).aspect))) pos = { ...pos, h: null };
    cmEdit(pageKeyFor(it.scope), (p) => {
      const o = { ...(p.items[key] || {}) };
      const all = { ...(o.pos || {}) };
      const cur = { ...(all[bp] || {}), ...pos };
      Object.keys(cur).forEach((k) => { if (cur[k] == null || cur[k] === '' || Number.isNaN(cur[k]) || (cur[k] === 0 && k !== 'z')) delete cur[k]; if (k === 'z' && cur[k] === 0) delete cur[k]; });
      if (Object.keys(cur).length) all[bp] = cur; else delete all[bp];
      if (Object.keys(all).length) o.pos = all; else delete o.pos;
      if (Object.keys(o).length) p.items[key] = o; else delete p.items[key];
    }, keepForm);
  }

  // Align / distribute / centre, measured on the live canvas, saved as offsets for the current breakpoint
  function doAlign(kind) {
    const w = pvWin(); if (!w || !w.__hjAdmin.rects) return;
    const keys = cm.multi && cm.multi.length > 1 ? cm.multi : cm.sel ? [cm.sel] : [];
    const R = w.__hjAdmin.rects(keys);
    if (!R.length) return;
    const bp = w.__hjAdmin.bp();
    const minL = Math.min(...R.map((r) => r.left)); const maxR = Math.max(...R.map((r) => r.left + r.width));
    const minT = Math.min(...R.map((r) => r.top)); const maxB = Math.max(...R.map((r) => r.top + r.height));
    const first = R.find((r) => r.key === keys[0]) || R[0];
    const out = {};
    const moveTo = (r, left, top) => { out[r.key] = { ...(out[r.key] || {}), x: Math.round(r.tx + (left == null ? 0 : left - r.left)), y: Math.round(r.ty + (top == null ? 0 : top - r.top)) }; };
    if (kind === 'left') R.forEach((r) => moveTo(r, minL));
    if (kind === 'right') R.forEach((r) => moveTo(r, maxR - r.width));
    if (kind === 'hcenter') R.forEach((r) => moveTo(r, (minL + maxR) / 2 - r.width / 2));
    if (kind === 'top') R.forEach((r) => moveTo(r, null, minT));
    if (kind === 'bottom') R.forEach((r) => moveTo(r, null, maxB - r.height));
    if (kind === 'vcenter') R.forEach((r) => moveTo(r, null, (minT + maxB) / 2 - r.height / 2));
    if (kind === 'secc') R.forEach((r) => moveTo(r, r.sec.left + (r.sec.width - r.width) / 2));
    if (kind === 'pagec') R.forEach((r) => moveTo(r, (r.page - r.width) / 2));
    if (kind === 'disth' || kind === 'distv') {
      if (R.length < 3) { toast('Select three or more elements to distribute them.'); return; }
      const hz = kind === 'disth';
      const S = [...R].sort((a, b) => (hz ? a.left - b.left : a.top - b.top));
      const span = hz ? S[S.length - 1].left + S[S.length - 1].width - S[0].left : S[S.length - 1].top + S[S.length - 1].height - S[0].top;
      const gap = (span - S.reduce((n, r) => n + (hz ? r.width : r.height), 0)) / (S.length - 1);
      let at = hz ? S[0].left : S[0].top;
      S.forEach((r) => { if (hz) moveTo(r, at); else moveTo(r, null, at); at += (hz ? r.width : r.height) + gap; });
    }
    if (/^match/.test(kind)) R.forEach((r) => { if (r.key === first.key) return; out[r.key] = { ...(kind !== 'matchh' ? { w: Math.round(first.w) } : {}), ...(kind !== 'matchw' ? { h: Math.round(first.h) } : {}) }; });
    savePosMany(out, bp);
  }
  function savePosMany(out, bp) {
    if (!/^[dtm]$/.test(bp)) return;
    const d = readDraft();
    cm.undo.push(JSON.stringify(d)); cm.redo = [];
    Object.entries(out).forEach(([k, pos]) => {
      const it = cmItem(k); if (!it) return;
      const pk = pageKeyFor(it.scope);
      if (!d.pages[pk]) d.pages[pk] = Object.assign(blankPage(), clone(state.content.pages[pk] || {}));
      const o = { ...(d.pages[pk].items[k] || {}) }; o.pos = { ...(o.pos || {}) };
      const cur = { ...(o.pos[bp] || {}), ...pos };
      Object.keys(cur).forEach((x) => { if (!cur[x]) delete cur[x]; }); // 0 offset = default place
      if (Object.keys(cur).length) o.pos[bp] = cur; else delete o.pos[bp];
      if (!Object.keys(o.pos).length) delete o.pos;
      if (Object.keys(o).length) d.pages[pk].items[k] = o; else delete d.pages[pk].items[k];
    });
    writeDraft(d);
    cmSync();
  }

  // Read the element properties into its override
  function readElementForm() {
    const it = cmItem(cm.sel); if (!it) return;
    const f = (k) => $('#st-props [data-e="' + k + '"]');
    cmEdit(pageKeyFor(it.scope), (p) => {
      const o = Object.assign({}, p.items[it.key] || {});
      const set = (k, v, def) => { if (v === '' || v == null || v === def) delete o[k]; else o[k] = v; };
      const n = (k) => (f(k) && f(k).value !== '' ? Number(f(k).value) : '');
      if (f('text')) set('text', f('text').value, it.text);
      if (f('href')) set('href', f('href').value.trim(), it.href);
      if (f('newTab')) set('newTab', f('newTab').checked || null);
      if (f('tag')) set('tag', f('tag').value, it.tag);
      if (f('font')) set('font', f('font').value);
      ['size', 'lineHeight', 'letterSpacing', 'radius', 'padX', 'padY', 'maxWidth', 'borderWidth', 'opacity'].forEach((k) => { if (f(k)) set(k, n(k)); });
      if (f('shadow')) set('shadow', f('shadow').value);
      if (f('weight')) set('weight', f('weight').value);
      if (f('alt')) set('alt', f('alt').value, it.alt);
      if (f('title')) set('title', f('title').value);
      if (f('aspect')) set('aspect', f('aspect').value);
      if (f('fx')) set('objectPosition', `${f('fx').value}% ${f('fy').value}%`, '50% 50%');
      ['brightness', 'contrast', 'saturate'].forEach((k) => { if (f(k)) set(k, n(k), 100); });
      ['animDur', 'animDelay'].forEach((k) => { if (f(k)) set(k, n(k)); });
      ['flipH', 'flipV', 'italic'].forEach((k) => { if (f(k)) set(k, f(k).checked || null); });
      ['deco', 'case', 'textShadow', 'anim', 'animOn', 'animEase', 'hover', 'grad', 'fit'].forEach((k) => { if (f(k)) set(k, f(k).value); });
      // choosing locked proportions drops the fixed height on this screen size, so the ratio takes effect
      if (it.kind === 'frame' && o.aspect && o.pos && o.pos[curBp()] && o.pos[curBp()].h) { o.pos = { ...o.pos, [curBp()]: { ...o.pos[curBp()] } }; delete o.pos[curBp()].h; }
      if (f('gradAngle')) set('gradAngle', n('gradAngle'));
      if (f('visibility')) set('hidden', f('visibility').value === 'hidden' || null);
      if (Object.keys(o).length) p.items[it.key] = o; else delete p.items[it.key];
    }, true);
  }
  function patchItem(it, patch) {
    cmEdit(pageKeyFor(it.scope), (p) => {
      const o = { ...(p.items[it.key] || {}), ...patch };
      Object.keys(o).forEach((k) => { if (o[k] === '' || o[k] == null) delete o[k]; });
      if (Object.keys(o).length) p.items[it.key] = o; else delete p.items[it.key];
    });
  }
  function patchSection(key, patch) {
    const global = Object.keys(GLOBAL_NAMES).includes(key);
    cmEdit(global ? '*' : cm.key, (p) => {
      p.sectionStyle = p.sectionStyle || {};
      const st = { ...(p.sectionStyle[key] || {}), ...patch };
      Object.keys(st).forEach((k) => { if (st[k] === '' || st[k] == null) delete st[k]; });
      if (Object.keys(st).length) p.sectionStyle[key] = st; else delete p.sectionStyle[key];
    });
  }
  function customUpdate(id, patch, keepForm) {
    cmEdit(cm.key, (p) => { const c = (p.custom || []).find((x) => x.id === id); if (c) Object.assign(c, patch); }, keepForm);
  }

  async function cmHistory() {
    let commits = [];
    try { commits = await gh(`/repos/${REPO}/commits?path=data/content.json&sha=${BRANCH}&per_page=30`); } catch (e) { /* none yet */ }
    const box = $('#hist'); if (!box) return;
    box.innerHTML = `<p class="help" style="margin:0 0 var(--s2)">Every publish is a version. Restore loads it into your draft; publish to make it live.</p>
      <ul class="log">${commits.map((c, i) => `<li><b>Version ${commits.length - i}</b> · <span class="small">${esc(c.commit.message.split('\n')[0])}</span><br>
        <span class="small muted">${esc(c.commit.author.name)} · ${esc(new Date(c.commit.author.date).toLocaleString('en-IN'))}</span>
        <div class="row-flex" style="margin-top:4px"><button class="btn btn-sm" data-vcompare="${c.sha}">Compare</button><button class="btn btn-sm" data-vrestore="${c.sha}">Restore</button></div>
        <div id="v-${c.sha}"></div></li>`).join('') || '<li class="muted small">No published versions yet.</li>'}</ul>`;
  }
  const fileAt = async (sha) => { const j = await gh(`/repos/${REPO}/contents/data/content.json?ref=${sha}`); return JSON.parse(L.fromB64(j.content)); };
  function diffPage(a, b) {
    a = a || {}; b = b || {};
    const out = [];
    const ai = a.items || {}; const bi = b.items || {};
    new Set([...Object.keys(ai), ...Object.keys(bi)]).forEach((k) => { if (JSON.stringify(ai[k]) !== JSON.stringify(bi[k])) out.push((bi[k] ? (ai[k] ? 'Changed ' : 'Added ') : 'Removed ') + 'element ' + k.split(' > ').pop()); });
    const norm = (v) => (!v || (Array.isArray(v) ? !v.length : !Object.values(v).some(Boolean)) ? null : v);
    const names = { order: 'section order', hidden: 'hidden sections', hideMobile: 'mobile-only hiding', hideDesktop: 'desktop-only hiding', custom: 'added sections', els: 'design elements (frames, shapes, text, icons)', groups: 'element groups', seo: 'SEO', sectionStyle: 'section design', style: 'page background', meta: 'page name' };
    Object.keys(names).forEach((k) => { if (JSON.stringify(norm(a[k])) !== JSON.stringify(norm(b[k]))) out.push('Changed ' + names[k]); });
    return out;
  }

  // ----- publish (page, template, shared parts, design, library) -----
  async function publishKeys(keys, extra, btn, label) {
    const d = readDraft();
    keys = keys.filter((k) => d.pages[k]);
    if (!keys.length && !extra.length) { toast('Nothing to publish.'); return false; }
    const all = (await allRoutes()).length;
    const cats = (await categories()).length;
    const reach = [];
    keys.forEach((k) => reach.push(k === '*' ? `the header/footer on all ${all} pages` : k === 'tpl:collections' ? `all ${cats} category pages` : k === 'tpl:products' ? `all ${state.products.length} product pages` : `#${k}`));
    if (extra.includes('design')) reach.push(`the colours and sizes of all ${all} pages`);
    if (extra.includes('library')) { const used = Object.entries(effective().pages).filter(([, p]) => (p.custom || []).some((c) => c.type === 'library')).map(([k]) => '#' + k); reach.push(`library sections used on ${used.length ? used.join(', ') : 'no pages yet'}`); }
    if (!confirm(`Publish to the live website?\n\nThis changes: ${reach.join('; ')}.`)) return false;
    let ok = false;
    await busy(btn, async () => {
      await loadContent(); // latest file, so other pages' published changes are kept
      const next = clone(state.content);
      keys.forEach((k) => {
        const p = d.pages[k];
        const empty = !Object.keys(p.items || {}).length && !Object.keys(p.sectionStyle || {}).length && !(p.style && p.style.bg) && !(p.order || []).length &&
          !(p.hidden || []).length && !(p.hideMobile || []).length && !(p.hideDesktop || []).length && !(p.custom || []).length && !(p.els || []).length && !(p.seo && (p.seo.title || p.seo.description)) && !k.startsWith('p/');
        if (empty) delete next.pages[k]; else next.pages[k] = { ...p, updatedAt: new Date().toISOString() };
      });
      if (extra.includes('design')) next.design = d.design;
      if (extra.includes('library')) next.library = d.library;
      state.contentSha = await putFile('data/content.json', L.toB64(JSON.stringify(next, null, 2) + '\n'), state.contentSha, `admin: publish ${label}`);
      state.content = next;
      keys.forEach((k) => delete d.pages[k]);
      if (extra.includes('design')) delete d.design;
      if (extra.includes('library')) delete d.library;
      writeDraft(d);
      toast('Published. The website updates in about a minute.');
      ok = true;
    });
    return ok;
  }
  async function allRoutes() { return [...STATIC_PAGES, ...(await categories()), ...state.products, ...landingPages()]; }

  async function cmPublish(btn) {
    const bad = cm.scan.items.filter((i) => i.kind === 'link' && 'href' in cmOverride(i) && linkProblem(cmOverride(i).href));
    if (bad.length) { toast(`Fix ${bad.length} invalid link(s) before publishing (select the link to see the problem).`, true); return; }
    if (await publishKeys(keysInPlay(), readDraft().library ? ['library'] : [], btn, `page #${cm.key}`)) cmSync();
  }

  // ----- Global design settings -----
  VIEWS.design = async () => {
    await loadContent();
    const cur = (effective().design || {}).vars || {};
    view.classList.add('wide');
    view.innerHTML = `<div class="ws"><div class="ws-head"><div class="ws-title"><a class="btn btn-sm" href="#" data-go="studio" aria-label="Back">←</a><h1>Global design settings</h1>
        <span id="ws-dirty" class="pill dirty ${readDraft().design ? '' : 'hidden'}">Unpublished changes</span></div>
        <div class="ws-actions"><button class="btn" data-cm="design-reset">Reset all</button><button class="btn btn-primary" data-cm="design-publish">Publish</button></div></div>
      <div class="ws-body" data-pane="editor"><div class="ws-editor">
        <p class="note small">These are the website's own design tokens. Every page uses them, so a change here restyles the whole site.</p>
        ${DESIGN.map(([title, rows]) => `<div class="panel"><h3>${title}</h3><div class="grid2">${rows.map(([label, vars, def]) => {
          const v = cur[vars[0]] || def; const color = def.startsWith('#');
          return `<div><label>${label}</label><div class="row-flex">${color ? `<input type="color" data-dvars="${vars.join(',')}" value="${esc(v)}" style="width:52px;padding:2px">` :
            `<input data-dvars="${vars.join(',')}" value="${esc(v)}" style="width:120px">`}<span class="small muted">${color ? esc(v) : 'Default ' + esc(def)}</span></div></div>`; }).join('')}</div></div>`).join('')}
      </div><div class="ws-preview"><div class="pv-bar"><span class="small muted">Live preview: Home page</span></div>
        <div class="pv-stage" id="pv-stage"><div class="pv-loading skel" id="pv-loading"></div><iframe id="pv" class="pv-frame" title="Design preview" src="/?hjpreview=1&amp;nomodal=1#home"></iframe></div></div></div></div>`;
    fitPreview();
    if (fitObserver) fitObserver.disconnect();
    fitObserver = new ResizeObserver(fitPreview);
    fitObserver.observe($('#pv-stage'));
  };

  // ----- Reusable section library -----
  VIEWS.library = async () => {
    await loadContent();
    const lib = effective().library || [];
    const usedOn = (id) => Object.entries(effective().pages).filter(([, p]) => (p.custom || []).some((c) => c.type === 'library' && c.ref === id)).map(([k]) => k);
    view.innerHTML = `<p><a href="#" data-go="studio">← Design Studio</a></p>
      <div class="page-head"><div><h1>Reusable section library</h1><p>Save a section from any page ("Save to library"), then add it to other pages from "+ Add section". Editing it here changes it on every page that uses it.</p></div>
        ${readDraft().library ? '<button class="btn btn-primary" data-cm="lib-publish">Publish library</button>' : ''}</div>
      ${lib.length ? lib.map((l) => `<div class="panel" data-lib-id="${esc(l.id)}"><h3>${esc(l.name || l.heading || 'Section')} <span class="pill">${esc((SECTION_TYPES.find(([t]) => t === l.type) || [, l.type])[1])}</span></h3>
        <div class="grid2">${customFields(l, false).replace(/data-c="/g, 'data-lc="').replace(/data-cm="custom-(pick|upload)"/g, 'data-cm="lib-$1"')}</div>
        <p class="help">Used on: ${usedOn(l.id).map((k) => '#' + esc(k)).join(', ') || 'no pages yet'}</p>
        <button class="btn btn-sm btn-danger" data-libdel="${esc(l.id)}">Delete from library</button></div>`).join('') : '<p class="note">The library is empty. Open a page, add a section, then choose "Save to library".</p>'}`;
  };
  function libEdit(fn) { const d = readDraft(); d.library = clone(d.library || effective().library || []); fn(d.library); writeDraft(d); }

  // ----- media library -----
  async function loadMedia() {
    const files = (await gh(`/repos/${REPO}/contents/images?ref=${BRANCH}`)).filter((f) => f.type === 'file' && /\.(jpe?g|png|webp|avif|svg)$/i.test(f.name));
    const code = (await Promise.all(['/app.js', '/index.html', '/style.css'].map((u) => fetch(u, { cache: 'no-cache' }).then((r) => r.text()).catch(() => '')))).join('\n');
    const content = effective();
    state.media = files.map((f) => {
      const path = 'images/' + f.name;
      const uses = [];
      state.products.forEach((p) => { if ([p.image, p.hoverImage, ...(p.gallery || [])].includes(path)) uses.push('Product: ' + p.name); });
      const same = (s) => s && String(s).replace(/^\//, '') === path;
      Object.entries(content.pages).forEach(([r, p]) => {
        Object.values(p.items || {}).forEach((o) => { if (same(o.src)) uses.push('Page: #' + r); });
        Object.values(p.sectionStyle || {}).forEach((st) => { if (same(st.bgImage)) uses.push('Page: #' + r + ' (background)'); });
        (p.els || []).forEach((x) => { if (same(x.src)) uses.push('Page: #' + r + ' (frame)'); });
        (p.custom || []).forEach((c) => { if (same(c.image)) uses.push('Page: #' + r + ' (section)'); });
      });
      (content.library || []).forEach((l) => { if (same(l.image)) uses.push('Library: ' + (l.heading || l.type)); });
      if (code.includes(f.name)) uses.push('Website design (code)');
      return { path, name: f.name, size: f.size, sha: f.sha, uses: [...new Set(uses)] };
    });
  }

  VIEWS.media = async () => {
    if (!state.content) await loadContent();
    if (!state.media) await loadMedia();
    view.innerHTML = `
      <p><a href="#" data-go="studio">← Design Studio</a></p>
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

  // Image picker shown at the top of the properties panel (or the page, outside the studio)
  async function pickImage(onPick) {
    if (!state.media) await loadMedia();
    const host = $('#st-props') || view;
    host.insertAdjacentHTML('afterbegin', `<div class="panel" id="picker"><h3>Choose an image</h3><input id="pick-q" type="search" placeholder="Search" style="margin-bottom:var(--s3)">
      <div class="cm-imgs" id="pick-grid">${state.media.map((m) => `<button type="button" class="cm-img" data-pick="${esc(m.path)}"><img src="${esc(imgSrc(m.path))}" alt="" loading="lazy"><span class="small" style="word-break:break-all">${esc(m.name)}</span></button>`).join('')}</div>
      <button class="btn btn-sm" data-cm="close-picker" style="margin-top:var(--s3)">Cancel</button></div>`);
    host.scrollTop = 0;
    $('#pick-q').addEventListener('input', (e) => $('#pick-grid').querySelectorAll('[data-pick]').forEach((b) => { b.hidden = !b.dataset.pick.toLowerCase().includes(e.target.value.toLowerCase()); }));
    cm.onPick = onPick;
  }
  function cmUpload(done) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/avif';
    input.addEventListener('change', () => { const f = input.files[0]; if (f) busy(null, async () => done(await uploadImageFile(f, cm.key ? cm.key.replace(/[/:]/g, '-') : 'site'))); });
    input.click();
  }

  // add = Shift+click: build a multi-selection for align / distribute
  function selectElement(key, add, single) {
    const it = cmItem(key); if (!it) return;
    if (isLocked(key, it.scope) && !add) { toast('This layer is locked. Unlock it in Layers to edit it.'); return; }
    const grp = !add && !single && (pageData(cm.key).groups || []).find((g) => g.includes(key));
    if (grp && grp.filter(cmItem).length > 1) {
      cm.multi = grp.filter(cmItem); cm.sel = key; cm.secSel = it.section; cm.open[it.section] = true;
      hl(key); renderLayers(); renderProps(); syncSelection(); showPane('props');
      return;
    }
    if (add && cm.sel) {
      const set = new Set(cm.multi && cm.multi.length ? cm.multi : [cm.sel]);
      if (set.has(key)) set.delete(key); else set.add(key);
      cm.multi = [...set];
      cm.sel = cm.multi[cm.multi.length - 1] || null;
    } else cm.multi = [];
    if (cm.sel !== key && !add) cm.sel = key;
    if (!cm.sel) cm.sel = key;
    cm.secSel = it.section; cm.open[it.section] = true;
    hl(key); renderLayers(); renderProps(); syncSelection(); showPane('props');
  }
  function selectSection(key) { cm.sel = null; cm.multi = []; cm.secSel = key; hl(key); renderLayers(); renderProps(); syncSelection(); showPane('props'); }
  function showPane(p) {
    const body = $('.st-body'); if (!body || window.innerWidth > 1280) return;
    body.dataset.spane = p;
    view.querySelectorAll('[data-spane]').forEach((b) => { if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', String(b.dataset.spane === p)); });
    fitPreview();
  }
  const inStudio = () => !!$('.st-body');

  // ----- events -----
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || !$('#pv') || $('#f-specs')) return;
    if (e.data.type === 'hj-preview-ready') {
      $('#pv-loading').classList.add('hidden');
      if (inStudio()) cmSync();
      else if (pvWin() && pvWin().__hjAdmin) pvWin().__hjAdmin.setContent(effective()); // design / library previews
    }
    if (e.data.type === 'hj-content-select' && inStudio()) {
      if (e.data.key && !cmItem(e.data.key) && e.data.item && e.data.item.key === e.data.key) { cm.scan.items.push(e.data.item); (cm.extra = cm.extra || new Set()).add(e.data.key); }
      if (e.data.key && cmItem(e.data.key)) selectElement(e.data.key, e.data.add);
      else if (e.data.section) selectSection(e.data.section);
    }
    if (e.data.type === 'hj-pos' && inStudio()) savePos(e.data.key, e.data.bp, e.data.pos);
    if (e.data.type === 'hj-pos-many' && inStudio() && Array.isArray(e.data.list)) savePosMany(Object.fromEntries(e.data.list.map((x) => [x.key, x.pos])), e.data.bp);
    if (e.data.type === 'hj-text' && inStudio() && cmItem(e.data.key) && typeof e.data.text === 'string') patchItem(cmItem(e.data.key), { text: e.data.text.slice(0, 2000) });
    if (e.data.type === 'hj-key' && inStudio()) cmKey(String(e.data.key), !!e.data.mod, !!e.data.shift);
    if (e.data.type === 'hj-cmd' && inStudio()) {
      const c = e.data.cmd; const it = cmItem(cm.sel);
      if (c === 'dup') { if (copySelected()) pasteEl(true); }
      if (c === 'del') deleteSelected();
      if (c === 'front' || c === 'back') zOrder(c === 'front' ? 'top' : 'bottom');
      if (c === 'group') groupToggle();
      if (c === 'align') { renderProps(); showPane('props'); }
      if (c === 'lock' && it) { const k = it.key; cmEdit(pageKeyFor(it.scope), (p) => { p.locked = (p.locked || []).includes(k) ? p.locked.filter((x) => x !== k) : [...(p.locked || []), k]; }); }
    }
    if (e.data.type === 'hj-crop' && inStudio()) {
      const it = cmItem(e.data.key); if (!it) return;
      const fx = Math.max(0, Math.min(100, Number(e.data.fx) || 0)); const fy = Math.max(0, Math.min(100, Number(e.data.fy) || 0));
      if (designOf(it)) patchEl(it, { fx, fy, zoom: Math.max(1, Math.min(4, Number(e.data.zoom) || 1)) });
      else patchItem(it, { objectPosition: `${Math.round(fx)}% ${Math.round(fy)}%` });
    }
    if (e.data.type === 'hj-drop' && inStudio() && typeof e.data.src === 'string' && /^(images|brand-identity)\/[\w.\- ]+$/.test(e.data.src)) {
      const src = e.data.src;
      if (e.data.kind === 'frame' || e.data.kind === 'img') { const it = cmItem(e.data.key); if (it) { cm.sel = it.key; useImage(src); } }
      else if (e.data.kind === 'pframe') addProductPhoto(src);
      else if (e.data.kind === 'section' && e.data.section) placeImage(src, e.data.section, Number(e.data.x), Number(e.data.y));
    }
  });

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-pickel],[data-arrowpos],[data-lytab],[data-mimg],[data-addel],[data-viewmode],[data-zoom],[data-pref],[data-al],[data-zorder],[data-ehbg],[data-ehc],[data-group],[data-global],[data-studio],[data-cm],[data-cmsel],[data-secsel],[data-lyopen],[data-sectog],[data-eltog],[data-ellock],[data-spane],[data-swatch],[data-ebg],[data-ebd],[data-ealign],[data-ssbg],[data-sscolor],[data-pgbg],[data-addtype],[data-addlib],[data-pick],[data-vcompare],[data-vrestore],[data-mcopy],[data-mdel],[data-libdel]');
    if (!t) return;
    const d = t.dataset;
    if (d.viewmode) { setViewMode(d.viewmode); return; }
    if (d.zoom != null) { zoom = d.zoom === '0' ? 1 : Math.min(4, Math.max(0.25, zoom * (d.zoom === '1' ? 1.25 : 0.8))); fitPreview(); return; }
    if (d.pref) { edPrefs[d.pref] = !edPrefs[d.pref]; localStorage.setItem(PREFS_KEY, JSON.stringify(edPrefs)); t.setAttribute('aria-pressed', String(edPrefs[d.pref])); syncSelection(); return; }
    if (d.al) { doAlign(d.al); return; }
    if (d.zorder) { zOrder(d.zorder); return; }
    if (d.lytab) { cm.lyTab = d.lytab; renderLayers(); return; }
    if (d.pickel) {
      const w = pvWin(); const item = w && w.__hjAdmin.describe(d.pickel);
      if (!item) { toast('That part is not on this page at this screen size.', true); return; }
      if (!cmItem(item.key)) { cm.scan.items.push(item); cm.extra.add(item.key); }
      selectElement(item.key, false, true); return;
    }
    if (d.arrowpos) { arrowPos(d.arrowpos); return; }
    if (d.mimg) { useImage(d.mimg); return; }
    if (d.addel) { const it0 = cmItem(cm.sel); addDesignEl(elementDef(d.addel), cm.secSel || (it0 && it0.section)); return; }
    if ('ehbg' in d) { patchItem(cmItem(cm.sel), { hoverBg: d.ehbg }); return; }
    if ('ehc' in d) { patchItem(cmItem(cm.sel), { hoverColor: d.ehc }); return; }
    if (d.group) { show('group', d.group); return; }
    if (d.global) { show('page', { key: 'home', route: 'home', focus: d.global }); return; }
    if (d.studio) { show('page', { key: d.studio, route: d.route }); return; }
    if (d.cmsel) { selectElement(d.cmsel, e.shiftKey, true); return; }
    if (d.secsel) { if (e.detail === 2) { renameLayer(d.secsel, Object.keys(GLOBAL_NAMES).includes(d.secsel) ? 'global' : 'page'); return; } selectSection(d.secsel); return; }
    if (d.lyopen) { cm.open[d.lyopen] = !cm.open[d.lyopen]; renderLayers(); return; }
    if (d.sectog) { const k = d.sectog; cmEdit(cm.key, (p) => { p.hidden = (p.hidden || []).includes(k) ? p.hidden.filter((x) => x !== k) : [...(p.hidden || []), k]; }); return; }
    if (d.eltog) { const it = cmItem(d.eltog); patchItem(it, { hidden: cmOverride(it).hidden ? null : true }); return; }
    if (d.ellock) { const k = d.ellock; cmEdit(d.scope === 'global' ? '*' : cm.key, (p) => { p.locked = (p.locked || []).includes(k) ? p.locked.filter((x) => x !== k) : [...(p.locked || []), k]; }); if (cm.sel === k) { cm.sel = null; renderProps(); } return; }
    if (d.spane && t.tagName === 'BUTTON') { showPane(d.spane); return; }
    if ('swatch' in d) { patchItem(cmItem(cm.sel), { color: d.swatch }); return; }
    if ('ebg' in d) { patchItem(cmItem(cm.sel), { bg: d.ebg }); return; }
    if ('ebd' in d) { patchItem(cmItem(cm.sel), { borderColor: d.ebd }); return; }
    if ('ealign' in d) { patchItem(cmItem(cm.sel), { align: d.ealign }); return; }
    if ('ssbg' in d) { patchSection(cm.secSel, { bg: d.ssbg }); return; }
    if ('sscolor' in d) { patchSection(cm.secSel, { color: d.sscolor }); return; }
    if ('pgbg' in d) { cmEdit(cm.key, (p) => { p.style = { ...(p.style || {}), bg: d.pgbg }; if (!d.pgbg) delete p.style.bg; }); return; }
    if (d.addtype || d.addlib) {
      const id = Date.now().toString(36);
      const c = d.addlib ? { id, type: 'library', ref: d.addlib } : { id, type: d.addtype, heading: ['divider', 'spacer', 'image'].includes(d.addtype) ? '' : 'New section heading',
        text: ['divider', 'spacer', 'image'].includes(d.addtype) ? '' : 'Write your text here.', align: 'center', bg: d.addtype === 'cta' ? '#3A2418' : '', color: d.addtype === 'cta' ? '#FFFFFF' : '', buttonLabel: '', buttonHref: '' };
      cmEdit(cm.key, (p) => { p.custom = [...(p.custom || []), c]; });
      selectSection('custom:' + id);
      return;
    }
    if (d.pick) { const fn = cm.onPick; cm.onPick = null; if ($('#picker')) $('#picker').remove(); if (fn) fn(d.pick); return; }
    if (d.vcompare) {
      busy(t, async () => {
        const v = await fileAt(d.vcompare);
        const lines = keysInPlay().flatMap((r) => diffPage(v.pages[r], state.content.pages[r]).map((x) => (r === '*' ? 'Shared parts: ' : '') + x));
        $('#v-' + d.vcompare).innerHTML = `<p class="small" style="margin:var(--s2) 0 0">${lines.length ? 'Differences from the live version:<br>• ' + lines.map(esc).join('<br>• ') : 'Same as the live version for this page.'}</p>`;
      });
      return;
    }
    if (d.vrestore) {
      if (!confirm('Load this version into your draft? Nothing changes on the website until you publish.')) return;
      busy(t, async () => {
        const v = await fileAt(d.vrestore);
        const dr = readDraft();
        cm.undo.push(JSON.stringify(dr));
        keysInPlay().forEach((r) => { dr.pages[r] = Object.assign(blankPage(), clone(v.pages[r] || {})); });
        writeDraft(dr);
        cmSync();
        toast('Version loaded into the draft. Check the canvas, then Publish.');
      });
      return;
    }
    if (d.mcopy) { navigator.clipboard.writeText(d.mcopy).then(() => toast('Path copied.')); return; }
    if (d.mdel) { deleteMedia(d.mdel, t); return; }
    if (d.libdel) {
      const used = Object.entries(effective().pages).filter(([, p]) => (p.custom || []).some((c) => c.type === 'library' && c.ref === d.libdel));
      if (used.length) { toast(`Remove it from ${used.map(([k]) => '#' + k).join(', ')} first.`, true); return; }
      if (!confirm('Delete this library section?')) return;
      libEdit((l) => { const i = l.findIndex((x) => x.id === d.libdel); if (i >= 0) l.splice(i, 1); });
      show('library');
      return;
    }
    const it = cm.sel && cmItem(cm.sel);
    switch (d.cm) {
      case 'undo': undoRedo(cm.undo, cm.redo); break;
      case 'redo': undoRedo(cm.redo, cm.undo); break;
      case 'discard':
        if (!confirm('Discard all unpublished changes to this page (and shared header/footer edits)?')) return;
        { const dr = readDraft(); cm.undo.push(JSON.stringify(dr)); keysInPlay().forEach((k) => delete dr.pages[k]); writeDraft(dr); cm.sel = null; cmSync(); toast('Draft discarded. Undo brings it back.'); }
        break;
      case 'save-draft': toast('Draft saved in this browser (it also saves automatically). It is not on the website until you publish.'); break;
      case 'publish': cmPublish(t); break;
      case 'page-props': cm.sel = null; cm.multi = []; cm.secSel = null; renderLayers(); renderProps(); syncSelection(); showPane('props'); break;
      case 'drop-stale': {
        const gone = (cm.scan.missing || []).filter((m) => m.layer === 'page').map((m) => m.key);
        if (!gone.length || !confirm(`Remove ${gone.length} edit(s) that no longer match anything on this page?`)) return;
        cmEdit(cm.key, (pg) => { gone.forEach((k) => delete pg.items[k]); });
        break;
      }
      case 'clear-multi': cm.multi = []; renderProps(); syncSelection(); break;
      case 'add-el-menu':
        $('#st-props').innerHTML = `<h3 class="pp-h">Add an element</h3><p class="help" style="margin-top:-6px">It goes into <b>${esc(secLabel(cm.scan.sections.find((x) => x.key === targetSection()) || { key: targetSection(), label: GLOBAL_NAMES[targetSection()] || '' }, 0))}</b>. Select another section first to put it there.</p>
          ${ELEMENT_MENU.map(([title, list]) => `<h4 class="ly-h">${title}</h4><div class="el-grid">${list.map(([c, n]) => `<button type="button" class="el-tile" data-addel="${c}">${elPreview(c)}<span>${esc(n)}</span></button>`).join('')}</div>`).join('')}`;
        showPane('props');
        break;
      case 'shortcuts': showShortcuts(); break;
      case 'media-up': cmUpload((path) => { state.media = null; useImage(path); renderLayers(); }); break;
      case 'preview': window.open(`/?hjdraft=1&nomodal=1#${cm.route}`, '_blank', 'noopener'); break;
      case 'pos-inherit': {
        const all = cmOverride(it).pos || {}; const from = curBp() === 't' ? all.d : all.t || all.d;
        if (!from) { toast('The larger screen has no custom position for this element.'); break; }
        savePos(cm.sel, curBp(), { ...from });
        break;
      }
      case 'el-dup': if (copySelected()) pasteEl(true); break;
      case 'el-copy': if (copySelected()) toast('Copied. Ctrl+V pastes it (also on another page).'); break;
      case 'el-del': deleteSelected(); break;
      case 'group': groupToggle(); break;
      case 'anim-preview': { const w = pvWin(); if (w && w.__hjAdmin.replay) w.__hjAdmin.replay(cm.sel); break; }
      case 'frame-pick': pickImage((path) => patchEl(it, { src: path, alt: designOf(it).alt || '' })); break;
      case 'frame-upload': cmUpload((path) => patchEl(it, { src: path })); break;
      case 'frame-clear': patchEl(it, { src: null, alt: null, zoom: null, fx: null, fy: null }); break;
      case 'reset-pos': { const o = cmOverride(it); const all = { ...(o.pos || {}) }; delete all[curBp()]; patchItem(it, { pos: Object.keys(all).length ? all : null }); break; }
      case 'reset-el': patchItem(it, Object.fromEntries(Object.keys(cmOverride(it)).map((k) => [k, null]))); break;
      case 'copy-style': { const o = cmOverride(it); cm.clip = Object.fromEntries(['font', 'size', 'weight', 'lineHeight', 'letterSpacing', 'align', 'color', 'bg', 'borderColor', 'radius', 'padX', 'padY'].filter((k) => k in o).map((k) => [k, o[k]])); toast('Style copied.'); renderProps(); break; }
      case 'paste-style': if (cm.clip) patchItem(it, cm.clip); break;
      case 'rename-el': renameLayer(it.key, it.scope); break;
      case 'rename-sec': renameLayer(cm.secSel, Object.keys(GLOBAL_NAMES).includes(cm.secSel) ? 'global' : 'page'); break;
      case 'reset-sec': patchSection(cm.secSel, { grad: null, gradAngle: null, bg: null, color: null, pt: null, pb: null, minH: null, align: null, opacity: null, bgImage: null }); break;
      case 'ss-bgimg': pickImage((path) => patchSection(cm.secSel, { bgImage: path })); break;
      case 'ss-bgimg-clear': patchSection(cm.secSel, { bgImage: null }); break;
      case 'pick-image': pickImage((path) => patchItem(cmItem(cm.sel), { src: path })); break;
      case 'upload-image': cmUpload((path) => patchItem(cmItem(cm.sel), { src: path })); break;
      case 'custom-pick': { const id = cm.secSel.replace('custom:', ''); pickImage((path) => customUpdate(id, { image: path })); break; }
      case 'custom-upload': { const id = cm.secSel.replace('custom:', ''); cmUpload((path) => customUpdate(id, { image: path })); break; }
      case 'close-picker': cm.onPick = null; $('#picker').remove(); break;
      case 'media-upload': cmUpload(() => show('media')); break;
      case 'add-section-menu':
        $('#st-props').innerHTML = `<h3 class="pp-h">Add a section</h3><div class="add-grid">${SECTION_TYPES.map(([tp, n, desc]) => `<button class="st-card" data-addtype="${tp}"><span class="st-txt"><b>${n}</b><span>${desc}</span></span></button>`).join('')}</div>
          <h4 class="ly-h">From your library</h4><div class="add-grid">${(cm.eff.library || []).map((l) => `<button class="st-card" data-addlib="${esc(l.id)}"><span class="st-txt"><b>${esc(l.name || l.heading || l.type)}</b><span>Reusable · ${esc(l.type)}</span></span></button>`).join('') || '<p class="small muted">Empty. Use "Save to library" on any added section.</p>'}</div>
          <p class="help">New sections go to the end of the page; drag them in Layers to move them.</p>`;
        showPane('props');
        break;
      case 'del-sec':
        if (!confirm('Delete this section from the page?')) return;
        { const k = cm.secSel; const id = k.replace('custom:', ''); cmEdit(cm.key, (p) => { p.custom = (p.custom || []).filter((c) => c.id !== id); p.order = (p.order || []).filter((x) => x !== k); }); cm.secSel = null; renderProps(); }
        break;
      case 'dup-sec': { const c = customOf(cm.secSel); const id = Date.now().toString(36); cmEdit(cm.key, (p) => { p.custom = [...(p.custom || []), { ...clone(c), id }]; }); selectSection('custom:' + id); break; }
      case 'save-to-library': {
        const c = customOf(cm.secSel); const name = prompt('Name for this library section:', c.heading || 'Promotional banner'); if (!name) return;
        const id = 'lib-' + Date.now().toString(36);
        libEdit((l) => l.push({ ...clone(c), id, name }));
        const old = cm.secSel.replace('custom:', '');
        cmEdit(cm.key, (p) => { const i = (p.custom || []).findIndex((x) => x.id === old); if (i >= 0) p.custom[i] = { id: old, type: 'library', ref: id }; });
        toast('Saved to the library. Publishing this page also publishes the library.');
        break;
      }
      case 'new-landing': {
        const name = $('#lp-name').value.trim(); const slug = L.slugify(name);
        if (!slug) { toast('Enter a page name.', true); return; }
        const key = 'p/' + slug;
        if (effective().pages[key]) { toast('A landing page with this address already exists.', true); return; }
        const dr = readDraft(); dr.pages[key] = { ...blankPage(), meta: { name }, custom: [{ id: Date.now().toString(36), type: 'banner', heading: name, text: 'Introduce your campaign here.', align: 'center', bg: '', buttonLabel: 'Shop now', buttonHref: '#collections/all' }] };
        writeDraft(dr);
        show('page', { key, route: key });
        break;
      }
      case 'design-reset': if (confirm('Reset every design setting to the original website design (as a draft)?')) { const dr = readDraft(); dr.design = { vars: {} }; writeDraft(dr); show('design'); } break;
      case 'design-publish': publishKeys([], ['design'], t, 'global design settings').then((ok) => ok && show('design')); break;
      case 'lib-publish': publishKeys([], ['library'], t, 'section library').then((ok) => ok && show('library')); break;
      case 'lib-pick': case 'lib-upload': {
        const id = t.closest('[data-lib-id]').dataset.libId;
        const done = (path) => { libEdit((l) => { const x = l.find((y) => y.id === id); if (x) x.image = path; }); show('library'); };
        if (d.cm === 'lib-pick') pickImage(done); else cmUpload(done);
        break;
      }
      default: break;
    }
  });

  function renameLayer(key, scope) {
    const cur = layerName(key, scope, '');
    const name = prompt('Layer name (only shown here in the Studio):', cur);
    if (name == null) return;
    cmEdit(scope === 'global' ? '*' : cm.key, (p) => { p.names = { ...(p.names || {}) }; if (name.trim()) p.names[key] = name.trim(); else delete p.names[key]; });
  }

  // Typing in properties updates the draft and the canvas (debounced; the form itself is not redrawn)
  let cmTimer;
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('#st-props [data-e]')) {
      if (t.id === 'e-fx') $('#fxv').textContent = t.value + '%';
      if (t.id === 'e-fy') $('#fyv').textContent = t.value + '%';
      if (t.id === 'e-href') { const p = linkProblem(t.value.trim()); $('#href-check').textContent = p ? '⚠ ' + p : '✓ Link looks valid'; $('#href-check').style.color = p ? 'var(--bad)' : 'var(--ok)'; }
      clearTimeout(cmTimer); cmTimer = setTimeout(readElementForm, 250);
    }
    if (t.matches('#st-props input[type=range]') && $(`[data-rv="${t.id}"]`)) $(`[data-rv="${t.id}"]`).textContent = t.value + (t.dataset.unit || '');
    if (t.matches('#st-props [data-de]') && t.tagName === 'INPUT') {
      const k = t.dataset.de; const it = cmItem(cm.sel);
      clearTimeout(cmTimer); cmTimer = setTimeout(() => patchEl(it, { [k]: t.type === 'text' ? t.value : t.value === '' ? null : Number(t.value) }, true), 200);
    }
    if (t.matches('#st-props [data-p]')) { const k = t.dataset.p; clearTimeout(cmTimer); cmTimer = setTimeout(() => savePos(cm.sel, curBp(), { [k]: t.value === '' ? null : Number(t.value) }, true), 250); }
    if (t.matches('[data-prefnum]')) { const v = Number(t.value); if (v >= Number(t.min) && v <= Number(t.max)) { edPrefs[t.dataset.prefnum] = v; localStorage.setItem(PREFS_KEY, JSON.stringify(edPrefs)); syncSelection(); } }
    if (t.matches('#st-props [data-ss]')) { const k = t.dataset.ss; clearTimeout(cmTimer); cmTimer = setTimeout(() => { patchSectionKeep(cm.secSel, { [k]: t.value === '' ? null : Number(t.value) }); }, 300); }
    if (t.matches('#st-props [data-c]')) { const id = cm.secSel.replace('custom:', ''); clearTimeout(cmTimer); cmTimer = setTimeout(() => customUpdate(id, { [t.dataset.c]: t.dataset.c === 'height' ? Number(t.value) : t.value }, true), 250); }
    if (t.matches('#st-props [data-seo]')) { clearTimeout(cmTimer); cmTimer = setTimeout(() => cmEdit(cm.key, (p) => { p.seo = { title: $('#seo-t').value.trim(), description: $('#seo-d').value.trim() }; }, true), 400); }
    if (t.matches('#st-props [data-pg]')) { clearTimeout(cmTimer); cmTimer = setTimeout(() => cmEdit(cm.key, (p) => { p.meta = { ...(p.meta || {}), name: t.value.trim() }; }, true), 400); }
    if (t.matches('[data-lc]')) { const id = t.closest('[data-lib-id]').dataset.libId; clearTimeout(cmTimer); cmTimer = setTimeout(() => libEdit((l) => { const x = l.find((y) => y.id === id); if (x) x[t.dataset.lc] = t.value; }), 300); }
    if (t.matches('[data-dvars]')) {
      const vars = t.dataset.dvars.split(','); const v = t.value.trim();
      if (!/^(#[0-9a-f]{6}|\d+(\.\d+)?(px|rem))$/i.test(v)) return;
      const dr = readDraft(); dr.design = clone(dr.design || effective().design || { vars: {} }); dr.design.vars = dr.design.vars || {};
      vars.forEach((k) => { dr.design.vars[k] = v; }); writeDraft(dr);
      if (t.nextElementSibling && t.type === 'color') t.nextElementSibling.textContent = v;
      $('#ws-dirty').classList.remove('hidden');
      clearTimeout(cmTimer); cmTimer = setTimeout(() => { const w = pvWin(); if (w && w.__hjAdmin) w.__hjAdmin.setContent(effective()); }, 150);
    }
  });
  function patchSectionKeep(key, patch) {
    const global = Object.keys(GLOBAL_NAMES).includes(key);
    cmEdit(global ? '*' : cm.key, (p) => {
      p.sectionStyle = p.sectionStyle || {};
      const st = { ...(p.sectionStyle[key] || {}), ...patch };
      Object.keys(st).forEach((k) => { if (st[k] === '' || st[k] == null) delete st[k]; });
      if (Object.keys(st).length) p.sectionStyle[key] = st; else delete p.sectionStyle[key];
    }, true);
  }
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-secvis]')) {
      const k = t.dataset.secvis;
      cmEdit(cm.key, (p) => {
        ['hidden', 'hideMobile', 'hideDesktop'].forEach((x) => { p[x] = (p[x] || []).filter((y) => y !== k); });
        const map = { hidden: 'hidden', mobile: 'hideMobile', desktop: 'hideDesktop' };
        if (map[t.value]) p[map[t.value]].push(k);
      });
    }
    if (t.matches('#st-props select[data-e], #st-props input[type=checkbox][data-e]')) readElementForm();
    if (t.matches('#st-props select[data-de]')) patchEl(cmItem(cm.sel), { [t.dataset.de]: t.value });
    if (t.matches('#st-props [data-cpick]')) patchItem(cmItem(cm.sel), { [t.dataset.cpick]: t.value });
    if (t.matches('#st-props select[data-ss]')) patchSection(cm.secSel, { [t.dataset.ss]: t.value });
    if (t.matches('#st-props select[data-c]')) customUpdate(cm.secSel.replace('custom:', ''), { [t.dataset.c]: t.value });
    if (t.matches('select[data-lc]')) { const id = t.closest('[data-lib-id]').dataset.libId; libEdit((l) => { const x = l.find((y) => y.id === id); if (x) x[t.dataset.lc] = t.value; }); }
    if (t.id === 'tpl-prev') { cm.route = t.value; cm.sel = null; cm.multi = []; const w = pvWin(); if (w) w.location.hash = t.value; setTimeout(cmSync, 900); return; }
    if (t.id === 'pv-dev' && t.value) {
      const [dw, dh] = t.value.split('x').map(Number); device = dw; devH = dh;
      $('#pv-w').value = dw; $('#pv-h').value = dh;
      view.querySelectorAll('[data-device]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      fitPreview(); setTimeout(() => inStudio() && cmSync(), 400); return;
    }
    if (t.id === 'pv-h') { devH = Math.min(2000, Math.max(300, Number(t.value) || deviceH())); t.value = devH; $('#pv-dev').value = ''; fitPreview(); setTimeout(() => inStudio() && cmSync(), 400); return; }
    if (t.id === 'pv-w') { device = Math.min(2560, Math.max(320, Number(t.value) || 1280)); view.querySelectorAll('[data-device]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.device) === device))); fitPreview(); setTimeout(() => inStudio() && cmSync(), 400); }
  });
  // Re-scan after a device change (overflow warnings depend on width)
  document.addEventListener('click', (e) => { if (e.target.closest('[data-device]') && inStudio()) setTimeout(() => { $('#pv-w').value = device; cmSync(); }, 400); });

  // Undo / redo shortcuts (outside text fields, so typing keeps its own undo)
  document.addEventListener('keydown', (e) => {
    if (!inStudio() || e.target.matches('input, textarea, select, [contenteditable]')) return;
    const mod = e.ctrlKey || e.metaKey; const k = e.key.toLowerCase();
    if ((mod && ['z', 'y', 'd', 'c', 'v', 'g'].includes(k)) || (!mod && ['delete', 'backspace', 'escape', '[', ']', 'g', '?'].includes(k))) {
      if (!mod && k === 'escape' && !cm.sel && !(cm.multi || []).length) return;
      e.preventDefault();
      cmKey(k, mod, e.shiftKey);
    }
  });

  // Media panel photos carry their path to the canvas (the canvas page reads it on drop)
  document.addEventListener('dragstart', (e) => {
    const m = e.target.closest && e.target.closest('[data-mimg]'); if (!m) return;
    e.dataTransfer.setData('text/hj-img', m.dataset.mimg); e.dataTransfer.effectAllowed = 'copy';
  });

  // Drag and drop section reordering in Layers
  let dragKey = null;
  document.addEventListener('dragstart', (e) => { const li = e.target.closest && e.target.closest('#cm-secs li[data-sec]'); if (li) { dragKey = li.dataset.sec; e.dataTransfer.effectAllowed = 'move'; li.classList.add('dragging'); } });
  document.addEventListener('dragend', (e) => { const li = e.target.closest && e.target.closest('#cm-secs li'); if (li) li.classList.remove('dragging'); });
  document.addEventListener('dragover', (e) => { if (dragKey && e.target.closest && e.target.closest('#cm-secs li[data-sec]')) e.preventDefault(); });
  document.addEventListener('drop', (e) => {
    const li = dragKey && e.target.closest && e.target.closest('#cm-secs li[data-sec]');
    if (!li) return;
    e.preventDefault();
    const keys = cm.scan.sections.map((s) => s.key).filter((k) => k !== dragKey);
    const r = li.getBoundingClientRect();
    keys.splice(keys.indexOf(li.dataset.sec) + (e.clientY > r.top + r.height / 2 ? 1 : 0), 0, dragKey);
    dragKey = null;
    cmEdit(cm.key, (p) => { p.order = keys; });
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
      device = Number(d.device); devH = null;
      if ($('#pv-h')) $('#pv-h').value = deviceH(); if ($('#pv-dev')) $('#pv-dev').value = '';
      view.querySelectorAll('[data-device]').forEach((b) => b.setAttribute('aria-pressed', String(b === t)));
      fitPreview();
    }
    else if (d.upload) { uploadKey = d.upload; $('#file').click(); }
    else if (d.move) {
      const [i, dir] = d.move.split(':').map(Number);
      [draft.gallery[i], draft.gallery[i + dir]] = [draft.gallery[i + dir], draft.gallery[i]];
      [draft.galleryAlt[i], draft.galleryAlt[i + dir]] = [draft.galleryAlt[i + dir], draft.galleryAlt[i]];
      [draft.galleryCaption[i], draft.galleryCaption[i + dir]] = [draft.galleryCaption[i + dir], draft.galleryCaption[i]];
      renderSlots();
    } else if (d.remove) {
      const i = Number(d.remove);
      draft.gallery.splice(i, 1); draft.galleryAlt.splice(i, 1); draft.galleryCaption.splice(i, 1);
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
    if (e.target.dataset.cap) setCaption(e.target.dataset.cap, e.target.value);
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

  // Product photos: "Make main" swaps a gallery photo with the cover; drag ⋮⋮ to reorder the gallery
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mkmain]');
    if (!b || !draft) return;
    const i = Number(b.dataset.mkmain);
    [draft.image, draft.gallery[i]] = [draft.gallery[i], draft.image];
    [draft.imageAlt, draft.galleryAlt[i]] = [draft.galleryAlt[i] || '', draft.imageAlt || ''];
    [draft.imageCaption, draft.galleryCaption[i]] = [draft.galleryCaption[i] || '', draft.imageCaption || ''];
    // Drop empty slots and repeats of the same photo (keep the first; the product page shows each photo once)
    for (let n = draft.gallery.length - 1; n >= 0; n--) {
      if (!draft.gallery[n] || draft.gallery.indexOf(draft.gallery[n]) !== n) { draft.gallery.splice(n, 1); draft.galleryAlt.splice(n, 1); draft.galleryCaption.splice(n, 1); }
    }
    renderSlots();
    toast('Main photo changed. Save or publish to apply it on the website.');
  });
  let galleryDrag = null;
  document.addEventListener('dragstart', (e) => { const sl = e.target.closest && e.target.closest('#slots [data-gdrag]'); if (sl) { galleryDrag = Number(sl.dataset.gdrag); e.dataTransfer.effectAllowed = 'move'; sl.style.opacity = '.5'; } });
  document.addEventListener('dragend', (e) => { const sl = e.target.closest && e.target.closest('#slots [data-gdrag]'); if (sl) sl.style.opacity = ''; });
  document.addEventListener('dragover', (e) => { if (galleryDrag != null && e.target.closest && e.target.closest('#slots [data-gdrag]')) e.preventDefault(); });
  document.addEventListener('drop', (e) => {
    const sl = galleryDrag != null && e.target.closest && e.target.closest('#slots [data-gdrag]');
    if (!sl) return;
    e.preventDefault();
    const from = galleryDrag; galleryDrag = null;
    moveGallery(from, Number(sl.dataset.gdrag));
  });

  // ---------- start ----------
  if (state.token) signIn(state.token).catch((err) => { if (err.message !== 'Unauthorized') signOut(err.message); });
  else signOut();
})();
