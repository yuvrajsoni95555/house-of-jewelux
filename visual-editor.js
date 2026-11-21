/**
 * HOUSE OF JEWELUX — ON-PAGE VISUAL EDITOR (visual-editor.js)
 * Enables live in-browser WYSIWYG editing of text, prices, and images.
 * INACTIVE BY DEFAULT: Runs ONLY when explicitly invoked with ?editor=true or active session.
 * For all normal visitors, this script exits immediately with zero DOM or performance impact.
 */

(function () {
  'use strict';

  // 1. Guard check: Only run if explicitly requested
  const urlParams = new URLSearchParams(window.location.search);
  const isQueryActive = urlParams.get('editor') === 'true' || urlParams.get('edit') === 'true';
  const isHashActive = window.location.hash.startsWith('#editor');
  const isSessionActive = sessionStorage.getItem('hj_editor_active') === 'true';

  if (!isQueryActive && !isHashActive && !isSessionActive) {
    // Check if there are saved overrides from previous editor sessions to apply
    applySavedOverrides();
    return;
  }

  // The editor is available only after server-side admin authentication.
  const adminToken = sessionStorage.getItem('hj_admin_token');
  if (!adminToken) {
    alert('Please sign in through the Atelier Admin Portal before opening the visual editor.');
    window.location.hash = '#admin';
    return;
  }
  if (!isSessionActive) sessionStorage.setItem('hj_editor_active', 'true');

  // 2. State & Change Tracking
  const changes = {
    products: {},
    texts: {},
    images: {},
    config: {}
  };

  // 3. Inject Luxury Editor Styles
  const styleEl = document.createElement('style');
  styleEl.id = 'hj-visual-editor-styles';
  styleEl.textContent = `
    /* Visual Editor Highlights */
    [data-hj-editable="true"] {
      transition: outline 0.15s ease, background 0.15s ease !important;
    }
    [data-hj-editable="true"]:hover {
      outline: 2px dashed #C5A059 !important;
      outline-offset: 3px !important;
      cursor: text !important;
      border-radius: 2px !important;
    }
    [data-hj-editable="true"]:focus {
      outline: 2px solid #C5A059 !important;
      outline-offset: 3px !important;
      background: rgba(197, 160, 89, 0.08) !important;
      border-radius: 2px !important;
    }

    /* Image editable hover */
    .hj-img-editable-wrap {
      position: relative !important;
      display: inline-block !important;
    }
    .hj-img-edit-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(24, 20, 18, 0.88);
      color: #FBF9F5;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 0.35rem 0.65rem;
      border-radius: 9999px;
      border: 1px solid #C5A059;
      cursor: pointer;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      backdrop-filter: blur(4px);
    }
    .hj-img-edit-badge:hover {
      background: #C5A059;
      color: #181412;
    }

    /* Floating Luxury Toolbar */
    #hj-editor-toolbar {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(24, 20, 18, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(197, 160, 89, 0.4);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
      border-radius: 9999px;
      padding: 0.55rem 1rem 0.55rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #FBF9F5;
      animation: hjEditorPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes hjEditorPop {
      from { transform: translate(-50%, 40px); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    .hj-editor-tag {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-weight: 700;
      color: #C5A059;
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }
    .hj-editor-dot {
      width: 7px;
      height: 7px;
      background: #4ade80;
      border-radius: 50%;
      display: inline-block;
      box-shadow: 0 0 8px #4ade80;
    }
    .hj-editor-count {
      font-size: 0.75rem;
      color: rgba(251, 249, 245, 0.7);
      border-left: 1px solid rgba(255,255,255,0.15);
      padding-left: 0.85rem;
    }
    .hj-editor-btn {
      padding: 0.45rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 9999px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.2s ease;
    }
    .hj-btn-save {
      background: #C5A059;
      color: #181412;
    }
    .hj-btn-save:hover {
      background: #d4b068;
      transform: translateY(-1px);
    }
    .hj-btn-export {
      background: rgba(255, 255, 255, 0.08);
      color: #FBF9F5;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .hj-btn-export:hover {
      background: rgba(255, 255, 255, 0.16);
    }
    .hj-btn-exit {
      background: transparent;
      color: rgba(251, 249, 245, 0.6);
      padding: 0.45rem 0.65rem;
    }
    .hj-btn-exit:hover {
      color: #ef4444;
    }

    /* Modal for Export / Diff */
    .hj-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(6px);
      z-index: 1000000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .hj-modal-box {
      background: #181412;
      border: 1px solid #C5A059;
      border-radius: 12px;
      max-width: 600px;
      width: 100%;
      padding: 1.75rem;
      color: #FBF9F5;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    }
  `;
  document.head.appendChild(styleEl);

  // 4. Render Floating Toolbar
  function createToolbar() {
    if (document.getElementById('hj-editor-toolbar')) return;

    const bar = document.createElement('div');
    bar.id = 'hj-editor-toolbar';
    bar.innerHTML = `
      <div class="hj-editor-tag">
        <span class="hj-editor-dot"></span>
        <span>Atelier Live Editor</span>
      </div>
      <div class="hj-editor-count" id="hj-editor-count">Click any text or price to edit</div>
      <button class="hj-editor-btn hj-btn-save" id="hj-btn-save" title="Save changes to local disk & browser">
        💾 Save Changes
      </button>
      <button class="hj-editor-btn hj-btn-export" id="hj-btn-export" title="Copy changes to tell Antigravity to push live">
        📋 Export for Antigravity
      </button>
      <button class="hj-editor-btn hj-btn-exit" id="hj-btn-exit" title="Exit Edit Mode">
        ✕ Exit
      </button>
    `;
    document.body.appendChild(bar);

    document.getElementById('hj-btn-save').addEventListener('click', saveAllChanges);
    document.getElementById('hj-btn-export').addEventListener('click', showExportModal);
    document.getElementById('hj-btn-exit').addEventListener('click', exitEditorMode);
  }

  // 5. Scan and Attach Editable Behaviors to DOM Elements
  function makeElementsEditable() {
    // Text elements to make editable
    const selectors = [
      'h1', 'h2', 'h3', 'h4',
      '.hero-title', '.hero-subtitle', '.hero-tagline',
      '.card-title a', '.card-price-current', '.card-badge',
      '.pepite-section-title', '.pepite-section-subtitle',
      '.announcement-item span',
      '.brand-story-quote', '.brand-story-body',
      'p:not(#hj-editor-toolbar p)'
    ];

    document.querySelectorAll(selectors.join(',')).forEach((el) => {
      // Avoid toolbar
      if (el.closest('#hj-editor-toolbar') || el.closest('.hj-modal-box')) return;

      if (!el.hasAttribute('data-hj-editable')) {
        el.setAttribute('data-hj-editable', 'true');
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'false');

        // Prevent navigation when clicking links in edit mode
        if (el.tagName === 'A' || el.closest('a')) {
          el.addEventListener('click', (e) => {
            if (e.target.isContentEditable) {
              e.preventDefault();
            }
          });
        }

        // Generate selector path for tracking
        const pathKey = generateElementKey(el);
        el.setAttribute('data-hj-key', pathKey);

        // Track changes on blur / input
        el.addEventListener('blur', () => handleTextChange(el));
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && (el.classList.contains('card-price-current') || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3')) {
            e.preventDefault();
            el.blur();
          }
        });
      }
    });

    // Make product images editable
    document.querySelectorAll('.product-card').forEach((card) => {
      const prodId = card.getAttribute('data-product-id');
      const img = card.querySelector('.product-card-img.main-img');
      if (img && !card.querySelector('.hj-img-edit-badge')) {
        const wrap = card.querySelector('.product-card-media');
        if (wrap) {
          const badge = document.createElement('div');
          badge.className = 'hj-img-edit-badge';
          badge.innerHTML = '📷 Edit Photo';
          badge.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const newUrl = prompt(`Enter new image URL or path for product (${prodId}):`, img.src);
            if (newUrl && newUrl.trim()) {
              img.src = newUrl.trim();
              if (!changes.products[prodId]) changes.products[prodId] = { id: prodId };
              changes.products[prodId].image = newUrl.trim();
              updateChangeCount();
            }
          });
          wrap.appendChild(badge);
        }
      }
    });
  }

  // 6. Handle Element Text Changes
  function handleTextChange(el) {
    const text = el.innerText.trim();
    const key = el.getAttribute('data-hj-key');

    // Check if this belongs to a product card
    const card = el.closest('.product-card[data-product-id]');
    if (card) {
      const prodId = card.getAttribute('data-product-id');
      if (!changes.products[prodId]) changes.products[prodId] = { id: prodId };

      if (el.classList.contains('card-price-current')) {
        // Parse price: extract digits
        const numeric = parseInt(text.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(numeric) && numeric > 0) {
          changes.products[prodId].price = numeric;
          // Also update in state if window.HJ exists
          if (window.HJ && window.HJ.products) {
            const p = window.HJ.products.find(x => x.id === prodId);
            if (p) p.price = numeric;
          }
        }
      } else if (el.closest('.card-title')) {
        changes.products[prodId].name = text;
      } else if (el.classList.contains('card-badge')) {
        changes.products[prodId].badge = text;
      }
    } else {
      // General page text
      changes.texts[key] = text;
    }

    updateChangeCount();
  }

  function updateChangeCount() {
    const countEl = document.getElementById('hj-editor-count');
    const prodCount = Object.keys(changes.products).length;
    const textCount = Object.keys(changes.texts).length;
    const total = prodCount + textCount;

    if (countEl) {
      if (total === 0) {
        countEl.textContent = 'Click any text or price to edit';
      } else {
        countEl.innerHTML = `<strong style="color: #C5A059;">${total} unsaved edit${total > 1 ? 's' : ''}</strong> (Ready to save)`;
      }
    }
  }

  function generateElementKey(el) {
    if (el.id) return `#${el.id}`;
    if (el.className && typeof el.className === 'string') {
      const firstClass = el.className.split(' ').filter(c => !c.includes('hj-') && !c.includes('active'))[0];
      if (firstClass) {
        const index = Array.from(document.querySelectorAll(`.${firstClass}`)).indexOf(el);
        return `.${firstClass}:nth-of-type(${index + 1})`;
      }
    }
    return el.tagName.toLowerCase() + ':' + el.innerText.slice(0, 20).replace(/\s+/g, '_');
  }

  // 7. Save All Changes (Disk + Browser LocalStorage)
  async function saveAllChanges() {
    const saveBtn = document.getElementById('hj-btn-save');
    if (saveBtn) saveBtn.textContent = '⏳ Saving...';

    // A. Save to localStorage so browser preserves it
    const existingOverrides = JSON.parse(localStorage.getItem('hj_page_overrides') || '{}');
    Object.assign(existingOverrides, changes.texts);
    localStorage.setItem('hj_page_overrides', JSON.stringify(existingOverrides));

    // B. Attempt to send to Node.js backend
    let savedToDisk = false;
    try {
      const payload = {
        products: Object.values(changes.products),
        config: changes.config,
        overrides: changes.texts
      };
      const res = await fetch('/api/admin/editor-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('hj_admin_token') || ''}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) savedToDisk = true;
      }
    } catch (e) {
      console.log('Local API save skipped (static mode active)');
    }

    if (saveBtn) saveBtn.textContent = '✓ Saved!';
    setTimeout(() => {
      if (saveBtn) saveBtn.textContent = '💾 Save Changes';
    }, 2000);

    const msg = savedToDisk
      ? '✦ Changes saved permanently to local files (products.json) and browser storage!'
      : '✦ Changes saved to your browser! Click "Export for Antigravity" to apply them permanently.';

    alert(msg);
  }

  // 8. Show Export Modal for Git / Antigravity
  function showExportModal() {
    const modal = document.createElement('div');
    modal.className = 'hj-modal-overlay';
    const jsonStr = JSON.stringify(changes, null, 2);

    let summary = '### On-Page Edits Summary:\n';
    if (Object.keys(changes.products).length > 0) {
      summary += '\n*Products Modified:*\n';
      for (const [id, p] of Object.entries(changes.products)) {
        summary += `- Product ${id}: ${p.name || ''} ${p.price ? '→ Price: ₹' + p.price : ''} ${p.image ? '→ Image: ' + p.image : ''}\n`;
      }
    }
    if (Object.keys(changes.texts).length > 0) {
      summary += '\n*Texts Modified:*\n';
      for (const [key, text] of Object.entries(changes.texts)) {
        summary += `- ${key}: "${text.slice(0, 50)}..."\n`;
      }
    }
    if (Object.keys(changes.products).length === 0 && Object.keys(changes.texts).length === 0) {
      summary = 'No edits made yet. Click on any text, title or price on the page to make changes!';
    }

    modal.innerHTML = `
      <div class="hj-modal-box">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="font-family: serif; color: #C5A059; margin: 0; font-size: 1.3rem;">✦ Export Edits for Antigravity</h3>
          <button id="hj-close-modal" style="background: none; border: none; color: #FBF9F5; font-size: 1.4rem; cursor: pointer;">&times;</button>
        </div>
        <p style="font-size: 0.8rem; color: rgba(251,249,245,0.7); margin-bottom: 1rem;">
          You can copy this summary and send it directly to Antigravity in chat to push changes permanently to GitHub (houseofjewelux.com):
        </p>
        <textarea id="hj-export-text" style="width: 100%; height: 180px; background: rgba(0,0,0,0.4); border: 1px solid rgba(197,160,89,0.3); border-radius: 6px; color: #FBF9F5; padding: 0.75rem; font-family: monospace; font-size: 0.75rem; resize: vertical;" readonly>${summary}\n\nFull JSON:\n${jsonStr}</textarea>
        <div style="display: flex; gap: 0.75rem; margin-top: 1.25rem;">
          <button id="hj-copy-export" class="hj-editor-btn hj-btn-save" style="flex: 1; justify-content: center; padding: 0.75rem;">
            📋 Copy to Clipboard
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('hj-close-modal').addEventListener('click', () => modal.remove());
    document.getElementById('hj-copy-export').addEventListener('click', () => {
      const ta = document.getElementById('hj-export-text');
      ta.select();
      navigator.clipboard.writeText(ta.value).then(() => {
        alert('Copied to clipboard! Now simply paste it into your chat with Antigravity.');
        modal.remove();
      });
    });
  }

  // 9. Exit Editor Mode (Clean Return to Normal View)
  function exitEditorMode() {
    sessionStorage.removeItem('hj_editor_active');
    const cleanUrl = window.location.origin + window.location.pathname + window.location.hash.replace('#editor', '');
    window.location.href = cleanUrl;
  }

  // 10. Apply Saved Overrides to Normal View
  function applySavedOverrides() {
    const overrides = JSON.parse(localStorage.getItem('hj_page_overrides') || '{}');
    if (Object.keys(overrides).length === 0) return;

    window.addEventListener('DOMContentLoaded', () => {
      for (const [key, text] of Object.entries(overrides)) {
        try {
          const el = document.querySelector(key);
          if (el) el.innerText = text;
        } catch (e) {}
      }
    });
  }

  // Initialize Toolbar and Observer for Dynamic SPAs
  window.addEventListener('DOMContentLoaded', () => {
    createToolbar();
    makeElementsEditable();

    // Observe changes in #app-view for client-side routing
    const appView = document.getElementById('app-view');
    if (appView) {
      const observer = new MutationObserver(() => {
        setTimeout(makeElementsEditable, 100);
      });
      observer.observe(appView, { childList: true, subtree: true });
    }
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    createToolbar();
    makeElementsEditable();
  }
})();
