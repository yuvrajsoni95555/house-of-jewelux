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
    const navName = name === 'editor' ? 'products' : name;
    document.querySelectorAll('.side nav button').forEach((b) => {
      if (b.dataset.view === navName) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    $('#side').classList.remove('open');
    $('#menu').setAttribute('aria-expanded', 'false');
    view.innerHTML = '<p class="muted">Loading…</p>';
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

  async function setupLogin(token, username, pass) {
    await signIn(token); // proves the token can save before we store it
    let sha = null;
    try { sha = (await gh(`/repos/${REPO}/contents/admin-key.json?ref=${BRANCH}`)).sha; } catch (e) { if (e.status !== 404) throw e; }
    const blob = await L.encryptToken(token, username, pass);
    await putFile('admin-key.json', L.toB64(JSON.stringify(blob, null, 2) + '\n'), sha, 'admin: set admin login');
    history.replaceState(null, '', location.pathname);
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
    const out = P.filter((p) => p.stockStatus === 'Out of Stock').length;
    const productIssues = L.auditProducts(P);
    const headIssues = L.auditHead(L.readHeadMeta(state.html));
    const missingAlt = productIssues.filter((i) => /ALT/.test(i.message)).length;
    let commits = [];
    try { commits = await gh(`/repos/${REPO}/commits?sha=${BRANCH}&per_page=8`); } catch (e) { /* activity is optional */ }
    const card = (num, label, go) => `<button class="card" data-go="${go}" style="text-align:left;cursor:pointer"><div class="num">${num}</div><div class="muted">${label}</div></button>`;
    view.innerHTML = `
      <h1>Dashboard</h1>
      <div class="cards">
        ${card(P.length, 'Total products', 'products')}
        ${card(P.length - drafts, 'Published', 'products')}
        ${card(drafts, 'Drafts (hidden)', 'products')}
        ${card(out, 'Out of stock', 'products')}
        ${card(missingAlt, 'Images missing ALT', 'audit')}
        ${card(productIssues.length + headIssues.length, 'SEO issues', 'audit')}
      </div>
      <div class="panel">
        <h3>Recent changes</h3>
        <ul class="log">${commits.map((c) => `<li><b>${esc(c.commit.message.split('\n')[0])}</b><br><span class="small muted">${esc(c.commit.author.name)} · ${esc(new Date(c.commit.author.date).toLocaleString('en-IN'))}</span></li>`).join('') || '<li class="muted">No activity available.</li>'}</ul>
      </div>
      <p class="note small">Orders, revenue, customers and traffic are not shown: the website does not have a server yet to record them.</p>`;
  };

  VIEWS.products = async () => {
    const issues = L.auditProducts(state.products);
    const altCount = {};
    issues.forEach((i) => { if (/ALT/.test(i.message)) altCount[i.productId] = (altCount[i.productId] || 0) + 1; });
    const cats = [...new Set(state.products.map((p) => p.category).filter(Boolean))].sort();
    view.innerHTML = `
      <h1>Products</h1>
      <div class="toolbar">
        <input id="q" type="search" placeholder="Search name, SKU, ID…" aria-label="Search products">
        <select id="f-cat" aria-label="Category"><option value="">All categories</option>${cats.map((c) => `<option>${esc(c)}</option>`).join('')}</select>
        <select id="f-state" aria-label="Filter">
          <option value="">All products</option><option value="published">Published</option><option value="draft">Drafts</option>
          <option value="out">Out of stock</option><option value="alt">Missing ALT text</option>
        </select>
        <button class="btn btn-primary" data-action="new-product">+ Add product</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th></th><th>Name</th><th class="hide-sm">SKU</th><th class="hide-sm">Category</th><th>Price</th><th>Status</th><th class="hide-sm">ALT</th></tr></thead>
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
          <td class="hide-sm">${esc(p.category)}</td>
          <td>${money(p.price)}</td>
          <td><span class="pill ${p.status === 'draft' ? 'draft' : 'published'}">${p.status === 'draft' ? 'Draft' : 'Published'}</span>
              ${p.stockStatus === 'Out of Stock' ? '<span class="pill out">Out of stock</span>' : ''}</td>
          <td class="hide-sm">${altCount[p.id] ? `<span class="pill high">${altCount[p.id]} missing</span>` : '<span class="pill low">OK</span>'}</td>
        </tr>`).join('') || '<tr><td colspan="7" class="muted">No products match.</td></tr>';
    };
    ['#q', '#f-cat', '#f-state'].forEach((s) => $(s).addEventListener('input', render));
    render();
  };

  // ----- product editor -----
  let draft = null;
  let editingId = null;

  VIEWS.editor = async (id) => {
    editingId = id || null;
    const orig = id ? state.products.find((p) => p.id === id) : null;
    if (id && !orig) throw new Error('Product not found. It may have been deleted.');
    draft = orig ? JSON.parse(JSON.stringify(orig)) : {
      id: 'HJ-' + Date.now().toString(36).toUpperCase(), handle: '', name: '', category: '', collection: '', price: 0,
      status: 'draft', stockStatus: 'In Stock', image: '', gallery: [], galleryAlt: [], description: ''
    };
    if (!Array.isArray(draft.gallery)) draft.gallery = [];
    if (!Array.isArray(draft.galleryAlt)) draft.galleryAlt = [];
    const list = (k) => [...new Set(state.products.map((p) => p[k]).filter(Boolean))].map((v) => `<option value="${esc(v)}">`).join('');
    const txt = (k, label, extra = '') => `<div ${extra}><label for="f-${k}">${label}</label><input id="f-${k}" data-f="${k}" value="${esc(draft[k] == null ? '' : draft[k])}"></div>`;
    const stockOpts = [...new Set([...STOCK, draft.stockStatus].filter(Boolean))];
    view.innerHTML = `
      <p><a href="#" data-go="products">← All products</a></p>
      <h1>${orig ? 'Edit product' : 'New product'}</h1>
      <div id="errs" class="errors hidden" role="alert"></div>
      <div class="panel"><h3>Basics</h3><div class="grid2">
        ${txt('name', 'Product name', 'class="full"')}
        <div class="full"><label for="f-handle">URL slug</label>
          <div style="display:flex;gap:.5rem"><input id="f-handle" data-f="handle" value="${esc(draft.handle)}"><button class="btn" type="button" data-action="slug">From name</button></div>
          ${orig ? '<p class="small muted">Changing the slug of a published product breaks links to it that are already shared.</p>' : ''}</div>
        <div><label for="f-id">Product ID</label><input id="f-id" data-f="id" value="${esc(draft.id)}" ${orig ? 'readonly' : ''}></div>
        ${txt('sku', 'SKU')}
        <div><label for="f-category">Category</label><input id="f-category" data-f="category" list="dl-cat" value="${esc(draft.category)}"><datalist id="dl-cat">${list('category')}</datalist></div>
        <div><label for="f-collection">Collection</label><input id="f-collection" data-f="collection" list="dl-col" value="${esc(draft.collection)}"><datalist id="dl-col">${list('collection')}</datalist></div>
        ${txt('badge', 'Badge (e.g. Bestseller)')}
        ${txt('tag', 'Tag line')}
      </div></div>

      <div class="panel"><h3>Price, stock and visibility</h3><div class="grid3">
        <div><label for="f-price">Price (₹)</label><input id="f-price" data-f="price" type="number" min="0" step="1" value="${esc(draft.price)}"></div>
        <div><label for="f-compareAtPrice">Compare-at price (₹)</label><input id="f-compareAtPrice" data-f="compareAtPrice" type="number" min="0" step="1" value="${esc(draft.compareAtPrice == null ? '' : draft.compareAtPrice)}"></div>
        <div><label for="f-stockStatus">Stock</label><select id="f-stockStatus" data-f="stockStatus">${stockOpts.map((s) => `<option ${s === draft.stockStatus ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
        <div><label for="f-status">Visibility</label><select id="f-status" data-f="status">
          <option value="published" ${draft.status !== 'draft' ? 'selected' : ''}>Published (shown on website)</option>
          <option value="draft" ${draft.status === 'draft' ? 'selected' : ''}>Draft (hidden)</option></select></div>
        <div class="full" style="display:flex;gap:1.5rem;flex-wrap:wrap">
          ${['isNew:New arrival', 'isSilver:Silver', 'isGold:Gold'].map((s) => { const [k, l] = s.split(':'); return `<label class="check"><input type="checkbox" data-f="${k}" ${draft[k] ? 'checked' : ''}> ${l}</label>`; }).join('')}
        </div>
      </div></div>

      <div class="panel"><h3>Images and ALT text</h3>
        <p class="small muted">ALT text describes the image for Google and screen readers. Write what is actually in the photo, for example "Silver solitaire ring with round moissanite, side view".</p>
        <div id="slots"></div>
        <button class="btn" type="button" data-action="add-gallery">+ Add gallery image</button>
        <input id="file" type="file" accept="image/*" class="hidden">
      </div>

      <div class="panel"><h3>Details</h3><div class="grid2">
        ${txt('metal', 'Metal')}${txt('purity', 'Purity')}${txt('stone', 'Gemstone')}${txt('cut', 'Cut')}
        ${txt('clarity', 'Clarity')}${txt('weight', 'Weight')}${txt('dimensions', 'Dimensions')}${txt('certificate', 'Certificate')}
        <div class="full"><label for="f-description">Description <span class="count" id="c-desc"></span></label><textarea id="f-description" data-f="description">${esc(draft.description)}</textarea></div>
        <div class="full"><label for="f-specs">Specifications (one per line: Label: value)</label>
          <textarea id="f-specs">${esc((draft.specifications || []).map((s) => s.label + ': ' + s.value).join('\n'))}</textarea></div>
      </div></div>

      <div class="savebar">
        ${orig ? '<button class="btn btn-danger" data-action="delete-product" style="margin-right:auto">Delete product</button>' : ''}
        <a class="btn" href="#" data-go="products">Cancel</a>
        <button class="btn btn-primary" data-action="save-product">Save and publish to site</button>
      </div>`;
    renderSlots();
    const d = $('#f-description');
    const cnt = () => { $('#c-desc').textContent = d.value.trim().length + ' chars'; };
    d.addEventListener('input', cnt); cnt();
  };

  function renderSlots() {
    const slot = (key, label, src, alt, i) => `
      <div class="slot ${src && !alt.trim() ? 'missing' : ''}">
        <img src="${esc(imgSrc(src))}" alt="">
        <div>
          <label for="alt-${key}">${label} — ALT text ${src && !alt.trim() ? '<span style="color:var(--bad)">(missing)</span>' : ''}</label>
          <input id="alt-${key}" data-alt="${key}" value="${esc(alt)}" placeholder="${src ? 'Describe this image' : 'Upload an image first'}" ${src ? '' : 'disabled'}>
          <p class="small muted" style="margin:.3rem 0 0;word-break:break-all">${esc(src || 'No image')}</p>
        </div>
        <div class="acts">
          <button class="btn" type="button" data-upload="${key}">${src ? 'Replace' : 'Upload'}</button>
          ${i != null ? `<button class="btn" type="button" data-move="${i}:-1" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button>
            <button class="btn" type="button" data-move="${i}:1" ${i === draft.gallery.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button>
            <button class="btn btn-danger" type="button" data-remove="${i}">Remove</button>` : ''}
        </div>
      </div>`;
    $('#slots').innerHTML =
      slot('image', 'Main image', draft.image, draft.imageAlt || '') +
      slot('hoverImage', 'Hover image', draft.hoverImage, draft.hoverImageAlt || '') +
      draft.gallery.map((src, i) => slot('gallery.' + i, 'Gallery ' + (i + 1), src, draft.galleryAlt[i] || '', i)).join('');
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
    ['imageAlt', 'hoverImageAlt', 'compareAtPrice', 'badge', 'tag'].forEach((k) => { if (p[k] === '' || p[k] == null) delete p[k]; });
    if (!p.galleryAlt.some(Boolean)) delete p.galleryAlt;
    return p;
  }

  async function saveProduct(btn) {
    const p = readForm();
    const idx = editingId ? state.products.findIndex((x) => x.id === editingId) : -1;
    const others = state.products.filter((_, i) => i !== idx);
    const errs = L.validateProduct(p, others);
    const box = $('#errs');
    box.innerHTML = errs.map(esc).join('<br>');
    box.classList.toggle('hidden', !errs.length);
    if (errs.length) { box.scrollIntoView({ block: 'center' }); return; }
    const orig = idx >= 0 ? state.products[idx] : null;
    if (orig && orig.handle !== p.handle && !confirm(`Change the URL slug from "${orig.handle}" to "${p.handle}"? Links already shared to the old URL will stop opening this product.`)) return;
    await busy(btn, async () => {
      await loadProducts(); // get the latest file so we never overwrite someone else's change
      const list = state.products.slice();
      const at = editingId ? list.findIndex((x) => x.id === editingId) : -1;
      if (editingId && at < 0) throw new Error('This product was deleted elsewhere. Nothing was saved.');
      if (at >= 0) list[at] = p; else list.push(p);
      await saveProducts(list, `admin: ${at >= 0 ? 'update' : 'add'} product ${p.id} (${p.name})`);
      toast(`Saved. The website updates in about a minute.`);
      show('editor', p.id);
    });
  }

  async function deleteProduct(btn) {
    if (!confirm(`Delete "${draft.name}" from the website? Only a developer can restore it later.`)) return;
    await busy(btn, async () => {
      await loadProducts();
      const list = state.products.filter((x) => x.id !== editingId);
      await saveProducts(list, `admin: delete product ${editingId}`);
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
    const t = e.target.closest('[data-view],[data-go],[data-edit],[data-action],[data-upload],[data-move],[data-remove]');
    if (!t) return;
    const d = t.dataset;
    if (d.view || d.go) { e.preventDefault(); show(d.view || d.go); }
    else if (d.edit) show('editor', d.edit);
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
    else if (d.action === 'slug') $('#f-handle').value = L.slugify($('#f-name').value);
    else if (d.action === 'save-product') saveProduct(t);
    else if (d.action === 'delete-product') deleteProduct(t);
    else if (d.action === 'save-seo') saveSeo(t);
    else if (d.action === 'save-robots') saveRobots(t);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('tr[data-edit]')) show('editor', e.target.dataset.edit);
    if (e.key === 'Escape') $('#side').classList.remove('open');
  });
  document.addEventListener('input', (e) => { if (e.target.dataset.alt) setAlt(e.target.dataset.alt, e.target.value); });
  document.addEventListener('change', (e) => {
    if (e.target.id !== 'file' || !e.target.files[0]) return;
    const f = e.target.files[0];
    e.target.value = '';
    busy(null, () => upload(f));
  });
  window.addEventListener('beforeunload', (e) => { if (state.token && view.querySelector('[data-action="save-product"]')) e.preventDefault(); });

  // ---------- start ----------
  if (state.token) signIn(state.token).catch((err) => { if (err.message !== 'Unauthorized') signOut(err.message); });
  else signOut();
})();
