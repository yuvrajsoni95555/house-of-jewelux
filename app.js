// HOUSE OF JEWELUX - Client Application & SPA Routing Logic V2
// Master Build: Fine 925 Silver Focus, Private Founder Studio, 3D Jewellery Engine, WhatsApp Concierge & Multilingual Architecture

document.addEventListener('DOMContentLoaded', () => {
  // 1. Load Dynamic Store State (Persisted in LocalStorage)
    let STORE = typeof JEWELUX_STORAGE !== 'undefined' ? JEWELUX_STORAGE.getStoreData() : JEWELUX_DATA;
  if (STORE && STORE.storeConfig) {
    STORE.storeConfig.whatsappNumber = '+916377061020';
    if (typeof JEWELUX_STORAGE !== 'undefined') JEWELUX_STORAGE.saveStoreData(STORE);
  }
  window.STORE = STORE;

  // Global Application State
  const state = {
    currency: 'USD',
    language: 'en',
    cart: JSON.parse(localStorage.getItem('jewelux_cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('jewelux_wishlist') || '[]'),
    activeCategory: 'all',
    activeSort: 'featured',
    discountPercent: 0,
    promoCodeApplied: null,
    activeProduct: null,
    studioUnlocked: false,
    activeStudioTab: 'overview',
    
    // Bespoke 3D Ring Studio State
    bespoke: {
      metalId: 'liquid-silver',
      gemId: 'moissanite',
      cutId: 'round',
      caratWeight: 2.5,
      rotationY: 0.4,
      rotationX: 0.2,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0,
      zoom: 1.0,
      sparkleTimer: 0
    }
  };
  window.appState = state;

  // ================= 2. STORE CONFIG & SYNC =================
  function syncStoreConfigToUI() {
    const config = STORE.storeConfig;
    if (!config) return;

    const annEl = document.getElementById('top-announcement-text');
    if (annEl && config.announcementText) annEl.textContent = config.announcementText;

    const waNumber = (config.whatsappNumber || '+916377061020').replace(/[^0-9]/g, '');
    const waLinks = document.querySelectorAll('#whatsapp-direct-link, a[href*="wa.me"]');
    waLinks.forEach(link => {
      link.href = `https://wa.me/${waNumber}?text=${encodeURIComponent("Hello House of Jewelux Concierge! I would like to inquire about your fine jewellery collection.")}`;
    });
  }
  syncStoreConfigToUI();

  // Price Formatting
  const currencyRates = {
    USD: { symbol: '$', rate: 1 },
    INR: { symbol: '₹', rate: 83.5 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.79 },
    AED: { symbol: 'AED ', rate: 3.67 }
  };

  function formatPrice(usdAmount) {
    const curr = currencyRates[state.currency] || currencyRates.USD;
    const converted = Math.round(usdAmount * curr.rate);
    return `${curr.symbol}${converted.toLocaleString()}`;
  }
  window.formatPrice = formatPrice;

  // Currency Switcher
  const currSelect = document.getElementById('currency-select');
  if (currSelect) {
    currSelect.value = state.currency;
    currSelect.addEventListener('change', (e) => {
      state.currency = e.target.value;
      renderAllProductGrids();
      renderCart();
      renderWishlist();
      updateBespokePrice();
      if (state.activeProduct) renderProductDetail(state.activeProduct);
    });
  }

  // Multilingual Switcher
  function switchLanguage(lang) {
    state.language = lang;
    if (typeof JEWELUX_I18N === 'undefined') return;
    const dict = JEWELUX_I18N[lang] || JEWELUX_I18N.en;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });

    const currBtn = document.getElementById('lang-btn-current');
    if (currBtn) currBtn.textContent = lang.toUpperCase();

    showToast(`Language updated to ${lang.toUpperCase()}`, '🌐');
  }
  window.switchLanguage = switchLanguage;

  // Toast Notification System
  function showToast(message, icon = '✦') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'bg-[#1D1815] text-[#F6EBDD] border border-[#C5A674]/40 shadow-2xl px-4 py-3 rounded-lg flex items-center gap-3 text-xs tracking-wide transform transition-all duration-300 translate-y-4 opacity-0 pointer-events-auto';
    toast.innerHTML = `<span class="text-base text-[#8A6B38]">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
  window.showToast = showToast;

  // ================= 3. SPA ROUTING & NAVIGATION =================
  const views = {
    'home': document.getElementById('view-home'),
    'shop': document.getElementById('view-shop'),
    'collections': document.getElementById('view-collections'),
    'product-detail': document.getElementById('view-product-detail'),
    'about': document.getElementById('view-about'),
    'craftsmanship': document.getElementById('view-craftsmanship'),
    'contact': document.getElementById('view-contact'),
    'faq': document.getElementById('view-faq'),
    'shipping': document.getElementById('view-shipping'),
    'returns': document.getElementById('view-returns'),
    'privacy': document.getElementById('view-privacy'),
    'terms': document.getElementById('view-terms'),
    'studio': document.getElementById('view-studio')
  };

  function switchView(targetName) {
    Object.keys(views).forEach(name => {
      const el = views[name];
      if (!el) return;
      if (name === targetName) {
        el.classList.remove('hidden');
        el.classList.add('active');
      } else {
        el.classList.add('hidden');
        el.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    injectJsonLdSchema(targetName);
  }
  window.switchView = switchView;

  function handleRoute() {
    const rawHash = window.location.hash.replace('#', '') || 'home';
    const hash = rawHash.split('?')[0];

    if (hash === 'studio' || hash === 'admin') {
      switchView('studio');
      renderStudio();
      return;
    }

    const categoryRoutes = {
      'shop': 'all',
      'silver': 'silver',
      'couples': 'couples',
      'rings': 'rings',
      'earrings': 'earrings',
      'necklaces': 'necklaces',
      'bracelets': 'bracelets',
      'brooches': 'brooches',
      'temple': 'temple',
      'gold-vault': 'gold-vault',
      'new-arrivals': 'new-arrivals',
      'best-sellers': 'best-sellers'
    };

    if (hash.startsWith('product-')) {
      const prodId = hash.replace('product-', '');
      const product = STORE.products.find(p => p.id === prodId);
      if (product) {
        state.activeProduct = product;
        switchView('product-detail');
        renderProductDetail(product);
      } else {
        switchView('shop');
      }
      return;
    }

    if (hash === 'bespoke-studio') {
      switchView('home');
      setTimeout(() => {
        const el = document.getElementById('bespoke-studio');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return;
    }

    if (categoryRoutes[hash]) {
      state.activeCategory = categoryRoutes[hash];
      switchView('shop');
      renderShopView();
      return;
    }

    if (views[hash]) {
      switchView(hash);
      return;
    }

    switchView('home');
  }

  window.addEventListener('hashchange', handleRoute);

  // ================= 4. PRODUCT CARDS & SHOWCASES =================
  function createProductCardHTML(p) {
    const isWished = state.wishlist.some(item => item.id === p.id);
    const badgeHtml = p.badge 
      ? `<span class="absolute top-3 left-3 bg-[#F6EBDD]/90 backdrop-blur-md px-2.5 py-1 text-[9px] uppercase tracking-widest text-[#8A6B38] font-semibold border border-[#C5A674]/30 rounded shadow-sm z-10">${p.badge}</span>` 
      : '';

    const purityTag = p.purity 
      ? `<p class="text-[9px] text-[#10B981] font-medium tracking-wide flex items-center gap-1 mt-0.5"><span>✓</span> ${p.purity}</p>`
      : '';

    return `
      <div class="product-card group flex flex-col justify-between overflow-hidden rounded-xl bg-white border border-[#E8E3D8] hover:border-[#C5A674]/50 transition duration-500 shadow-sm" data-product-id="${p.id}">
        <div>
          <div class="product-image-container aspect-[4/4.5] overflow-hidden relative cursor-pointer" onclick="navigateToProduct('${p.id}')">
            ${badgeHtml}
            <img src="${p.image}" alt="${p.name}" class="main-img w-full h-full object-cover transition duration-700 group-hover:scale-105" />
            <img src="${p.hoverImage || p.image}" alt="${p.name} Alt View" class="hover-img absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition duration-700 group-hover:scale-105" />
            
            <button onclick="event.stopPropagation(); toggleWishlist('${p.id}')" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#1D1815] hover:text-rose-600 transition shadow-sm z-10" aria-label="Save to Wishlist">
              <svg class="w-4 h-4 ${isWished ? 'fill-rose-600 text-rose-600' : 'fill-none'}" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </button>
            <button onclick="event.stopPropagation(); openQuickView('${p.id}')" class="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] text-[#1D1815] uppercase tracking-wider font-medium opacity-0 group-hover:opacity-100 transition duration-300 shadow-sm z-10 hover:bg-[#1D1815] hover:text-white">
              Quick Inspect
            </button>
          </div>

          <div class="p-5 text-left space-y-1.5">
            <span class="text-[9px] uppercase tracking-[0.25em] text-[#8A6B38] font-semibold block">${p.collection || 'Atelier Masterpiece'}</span>
            <h4 class="font-display text-sm sm:text-base text-[#1D1815] font-normal group-hover:text-[#8A6B38] transition-colors leading-snug cursor-pointer" onclick="navigateToProduct('${p.id}')">
              ${p.name}
            </h4>
            ${purityTag}
            <p class="text-xs text-[#766B5E] font-light line-clamp-1">${p.stone || p.metal}</p>
          </div>
        </div>

        <div class="px-5 pb-5 pt-2 border-t border-[#F4F1EA] flex items-center justify-between gap-3">
          <div>
            <span class="text-[9px] text-[#9E9386] uppercase tracking-wider block">Price</span>
            <p class="text-sm font-semibold text-[#1D1815] font-sans">${formatPrice(p.priceUSD)}</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="inquireProductOnWhatsApp('${p.id}')" class="p-2 rounded bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition" title="Inquire on WhatsApp">
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.586 1.761.888 2.79.889h.001c3.182 0 5.768-2.587 5.768-5.768.001-3.181-2.586-5.773-5.768-5.773zm3.364 8.163c-.14.394-.813.751-1.129.799-.315.048-.717.069-2.029-.475-.867-.36-1.579-1.074-2.115-1.782-.26-.345-.558-.871-.558-1.42 0-.616.321-.922.434-1.041.114-.119.248-.149.332-.149.083 0 .166.002.239.006.077.004.181-.03.283.216.104.252.356.868.387.932.031.064.052.139.01.223-.042.083-.063.135-.125.209-.063.073-.132.164-.188.22-.062.062-.127.13-.055.254.073.125.324.535.696.866.478.426.882.558 1.007.62.125.063.197.052.27-.032.073-.083.312-.364.395-.489.083-.125.166-.104.281-.062.114.041.728.343.853.405.125.063.208.094.239.146.031.052.031.302-.109.696z"/></svg>
            </button>
            <button onclick="addToBag('${p.id}')" class="btn-luxury-primary py-2 px-3.5 text-[10px]">
              Acquire
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderHomeSilverShowcase() {
    const container = document.getElementById('home-silver-grid');
    if (!container) return;

    const silverPieces = STORE.products.filter(p => p.isSilver).slice(0, 4);
    container.innerHTML = silverPieces.map(createProductCardHTML).join('');
  }

  function renderShopView() {
    const container = document.getElementById('shop-product-grid');
    if (!container) return;

    let filtered = [...STORE.products];

    if (state.activeCategory === 'silver') {
      filtered = filtered.filter(p => p.isSilver);
    } else if (state.activeCategory === 'couples') {
      filtered = filtered.filter(p => p.category === 'couples' || (p.targetAudience && p.targetAudience.includes('Couple')));
    } else if (state.activeCategory === 'gold-vault') {
      filtered = filtered.filter(p => p.isGold || p.category === 'gold-vault');
    } else if (state.activeCategory === 'temple') {
      filtered = filtered.filter(p => p.category === 'temple');
    } else if (state.activeCategory === 'new-arrivals') {
      filtered = filtered.filter(p => p.isNew);
    } else if (state.activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === state.activeCategory);
    }

    // Apply Active Sorting
    if (state.activeSort === 'price-low') {
      filtered.sort((a, b) => a.priceUSD - b.priceUSD);
    } else if (state.activeSort === 'price-high') {
      filtered.sort((a, b) => b.priceUSD - a.priceUSD);
    } else if (state.activeSort === 'newest') {
      filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    container.innerHTML = filtered.length 
      ? filtered.map(createProductCardHTML).join('')
      : `<div class="col-span-full py-16 text-center text-[#766B5E]">No pieces found in this curation. Explore <a href="#silver" class="text-[#8A6B38] underline">The Silver Edit</a>.</div>`;

    // Highlight active category tab in shop filter bar
    document.querySelectorAll('[data-category-filter]').forEach(btn => {
      const cat = btn.getAttribute('data-category-filter');
      if (cat === state.activeCategory) {
        btn.classList.add('bg-[#1D1815]', 'text-white');
        btn.classList.remove('bg-white', 'text-[#766B5E]');
      } else {
        btn.classList.remove('bg-[#1D1815]', 'text-white');
        btn.classList.add('bg-white', 'text-[#766B5E]');
      }
    });
  }

  function renderCategoryPageView() {
    const container = document.getElementById('category-product-grid');
    if (!container) return;
    const cards = container.querySelectorAll('.product-card');
    cards.forEach(card => {
      const prodId = card.getAttribute('data-product-id');
      const prod = STORE.products.find(p => p.id === prodId);
      if (prod) {
        const priceEl = card.querySelector('.font-sans');
        if (priceEl) priceEl.textContent = formatPrice(prod.priceUSD);
      }
    });
  }

  function renderAllProductGrids() {
    renderHomeSilverShowcase();
    renderShopView();
    renderCategoryPageView();
  }

  window.navigateToProduct = (id) => {
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
      window.location.href = `/#product-${id}`;
    } else {
      window.location.hash = `#product-${id}`;
    }
  };
  window.openProductPage = (id) => {
    window.navigateToProduct(id);
  };

  window.filterShopCategory = (cat) => {
    state.activeCategory = cat;
    renderShopView();
    // Also highlight button in filter bar
    document.querySelectorAll('[data-cat-pill]').forEach(btn => {
      const pill = btn.getAttribute('data-cat-pill');
      if (pill === cat) {
        btn.classList.add('bg-[#1D1815]', 'text-white');
        btn.classList.remove('bg-white', 'text-[#766B5E]');
      } else {
        btn.classList.remove('bg-[#1D1815]', 'text-white');
        btn.classList.add('bg-white', 'text-[#766B5E]');
      }
    });
  };

  window.handleSortChange = (sortVal) => {
    state.activeSort = sortVal;
    renderShopView();
  };

  window.toggleMobileMenu = () => {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden');
  };

  // ================= 5. PRODUCT DETAIL VIEW =================
  function renderProductDetail(p) {
    const titleEl = document.getElementById('pdp-title');
    const priceEl = document.getElementById('pdp-price');
    const descEl = document.getElementById('pdp-description');
    const metalEl = document.getElementById('pdp-metal');
    const badgeEl = document.getElementById('pdp-badge');
    const heroImg = document.getElementById('pdp-main-image');
    const thumbsContainer = document.getElementById('pdp-thumbnails');
    const sizeSelect = document.getElementById('pdp-size-select');
    const addBtn = document.getElementById('pdp-add-btn');
    const buyBtn = document.getElementById('pdp-buy-now-btn');
    const wishBtn = document.getElementById('pdp-wishlist-btn');

    const specStone = document.getElementById('pdp-spec-stone');
    const specCut = document.getElementById('pdp-spec-cut');
    const specCert = document.getElementById('pdp-spec-cert');
    const specDimensions = document.getElementById('pdp-spec-dimensions');

    if (titleEl) titleEl.textContent = p.name;
    if (priceEl) priceEl.textContent = formatPrice(p.priceUSD);
    if (descEl) descEl.textContent = p.description;
    if (metalEl) metalEl.textContent = p.metal || (p.isSilver ? '925 Sterling Silver (Anti-Tarnish Rhodium)' : '18K Gold');
    if (badgeEl) badgeEl.textContent = p.badge || (p.isSilver ? 'Fine 925 Silver' : 'Haute Joaillerie');
    if (heroImg) {
      heroImg.src = p.image;
      heroImg.alt = p.name;
    }

    if (specStone) specStone.textContent = p.stone || (p.isSilver ? 'Certified Moissanite / Zirconia' : 'Flawless Diamond');
    if (specCut) specCut.textContent = p.cut || 'Hearts & Arrows Ideal Facet';
    if (specCert) specCert.textContent = p.certificate || (p.isSilver ? 'GRA Registered & 925 Stamped' : 'GIA Dossier Certified');
    if (specDimensions) specDimensions.textContent = p.dimensions || 'Bespoke Sizing';

    if (sizeSelect) {
      const sizes = p.sizes || ['Standard Size', 'US 5', 'US 6', 'US 7', 'US 8', 'Bespoke Request'];
      sizeSelect.innerHTML = sizes.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    if (thumbsContainer) {
      const gallery = p.gallery && p.gallery.length ? p.gallery : [p.image, p.hoverImage || p.image];
      thumbsContainer.innerHTML = gallery.map(imgSrc => `
        <div onclick="document.getElementById('pdp-main-image').src = '${imgSrc}'" class="aspect-square w-16 h-16 rounded border border-[#E8E3D8] hover:border-[#C5A674] cursor-pointer overflow-hidden bg-white p-1 flex-shrink-0 transition">
          <img src="${imgSrc}" class="w-full h-full object-cover">
        </div>
      `).join('');
    }

    if (addBtn) {
      addBtn.onclick = () => {
        const selectedSize = sizeSelect ? sizeSelect.value : 'Standard';
        addToBag(p.id, selectedSize);
      };
    }

    if (buyBtn) {
      buyBtn.onclick = () => {
        const selectedSize = sizeSelect ? sizeSelect.value : 'Standard';
        addToBag(p.id, selectedSize);
        openCartDrawer();
      };
    }

    if (wishBtn) {
      const isWished = state.wishlist.some(i => i.id === p.id);
      wishBtn.innerHTML = isWished 
        ? `<span class="text-rose-600">❤️ In Your Saved Wishlist</span>` 
        : `<span>♡ Save to Wishlist</span>`;
      wishBtn.onclick = () => {
        toggleWishlist(p.id);
        const nowWished = state.wishlist.some(i => i.id === p.id);
        wishBtn.innerHTML = nowWished 
          ? `<span class="text-rose-600">❤️ In Your Saved Wishlist</span>` 
          : `<span>♡ Save to Wishlist</span>`;
      };
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ================= 6. CART & WISHLIST DRAWERS =================
  function addToBag(productId, size = 'Standard') {
    const product = STORE.products.find(p => p.id === productId);
    if (!product) return;

    const existing = state.cart.find(i => i.id === productId && i.selectedSize === size);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      state.cart.push({ ...product, quantity: 1, selectedSize: size });
    }

    localStorage.setItem('jewelux_cart', JSON.stringify(state.cart));
    updateCartBadges();
    showToast(`Added "${product.name}" to your shopping bag.`, '💎');
  }
  window.addToBag = addToBag;

  function toggleWishlist(productId) {
    const idx = state.wishlist.findIndex(i => i.id === productId);
    const product = STORE.products.find(p => p.id === productId);

    if (idx > -1) {
      state.wishlist.splice(idx, 1);
      showToast('Removed from saved heirlooms.', '✦');
    } else if (product) {
      state.wishlist.push(product);
      showToast(`Saved "${product.name}" to your private wishlist.`, '❤️');
    }

    localStorage.setItem('jewelux_wishlist', JSON.stringify(state.wishlist));
    renderAllProductGrids();
  }
  window.toggleWishlist = toggleWishlist;

  function updateCartBadges() {
    const cartCount = state.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = cartCount;
      badge.classList.toggle('hidden', cartCount === 0);
    }
  }
  updateCartBadges();

  function renderCart() {
    updateCartBadges();
    const itemsContainer = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const discountRow = document.getElementById('cart-discount-row');
    const discountAmtEl = document.getElementById('cart-discount-amount');
    const progressFill = document.getElementById('shipping-progress-fill');
    const progressText = document.getElementById('shipping-progress-text');

    if (!itemsContainer) return;

    if (state.cart.length === 0) {
      itemsContainer.innerHTML = `
        <div class="py-16 text-center space-y-4">
          <span class="text-4xl block">🛍️</span>
          <h4 class="font-display text-lg text-[#1D1815]">Your Shopping Bag is Empty</h4>
          <p class="text-xs text-[#766B5E] max-w-xs mx-auto">Explore our certified 925 Sterling Silver edit and bespoke couple bands.</p>
          <button onclick="closeCartDrawer(); window.location.hash = 'silver';" class="btn-luxury-primary py-2.5 px-6 text-[10px]">
            Explore Silver Edit
          </button>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = formatPrice(0);
      if (totalEl) totalEl.textContent = formatPrice(0);
      if (discountRow) discountRow.classList.add('hidden');
      if (progressFill) progressFill.style.width = '0%';
      if (progressText) progressText.textContent = 'Complimentary Insured Courier on orders over $250';
      return;
    }

    const subtotal = state.cart.reduce((sum, item) => sum + (item.priceUSD * (item.quantity || 1)), 0);
    const discountAmount = state.discountPercent ? (subtotal * state.discountPercent / 100) : 0;
    const finalTotal = Math.max(0, subtotal - discountAmount);

    const freeThreshold = (STORE.storeConfig && STORE.storeConfig.freeShippingThresholdUSD) || 250;
    const progressPct = Math.min(100, Math.round((subtotal / freeThreshold) * 100));

    if (progressFill) progressFill.style.width = `${progressPct}%`;
    if (progressText) {
      if (subtotal >= freeThreshold) {
        progressText.innerHTML = '<span class="text-[#10B981] font-semibold">✓ Qualified for Complimentary Insured Armored Courier</span>';
      } else {
        const remaining = formatPrice(freeThreshold - subtotal);
        progressText.textContent = `Add ${remaining} more for Complimentary Insured Courier`;
      }
    }

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (discountRow && discountAmtEl) {
      if (discountAmount > 0) {
        discountRow.classList.remove('hidden');
        discountAmtEl.textContent = `-${formatPrice(discountAmount)}`;
      } else {
        discountRow.classList.add('hidden');
      }
    }
    if (totalEl) totalEl.textContent = formatPrice(finalTotal);

    itemsContainer.innerHTML = state.cart.map(item => `
      <div class="py-4 flex gap-4 items-center">
        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded object-cover border border-[#E8E3D8] bg-[#F6EBDD]" />
        <div class="flex-grow">
          <h5 class="font-serif text-sm text-[#1D1815] font-medium leading-snug">${item.name}</h5>
          <p class="text-[10px] text-[#8A6B38] mt-0.5">${item.metal || '925 Silver'} ${item.selectedSize ? `• Size: ${item.selectedSize}` : ''}</p>
          <p class="text-xs font-semibold text-[#1D1815] mt-1">${formatPrice(item.priceUSD)}</p>
        </div>
        <div class="flex flex-col items-end gap-2">
          <button onclick="removeCartItem('${item.id}')" class="text-xs text-[#9E9386] hover:text-rose-600 transition" title="Remove">&times;</button>
          <div class="flex items-center border border-[#E8E3D8] rounded text-xs">
            <button onclick="updateCartQty('${item.id}', -1)" class="px-2 py-0.5 text-[#766B5E] hover:text-[#1D1815]">-</button>
            <span class="px-2 py-0.5 font-medium text-[#1D1815]">${item.quantity || 1}</span>
            <button onclick="updateCartQty('${item.id}', 1)" class="px-2 py-0.5 text-[#766B5E] hover:text-[#1D1815]">+</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  window.openCartDrawer = () => {
    renderCart();
    const drawer = document.getElementById('cart-drawer-backdrop');
    if (drawer) drawer.classList.add('active');
  };

  window.closeCartDrawer = () => {
    const drawer = document.getElementById('cart-drawer-backdrop');
    if (drawer) drawer.classList.remove('active');
  };

  window.updateCartQty = (productId, delta) => {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;
    item.quantity = (item.quantity || 1) + delta;
    if (item.quantity <= 0) {
      state.cart = state.cart.filter(i => i.id !== productId);
    }
    localStorage.setItem('jewelux_cart', JSON.stringify(state.cart));
    updateCartBadges();
    renderCart();
  };

  window.removeCartItem = (productId) => {
    state.cart = state.cart.filter(i => i.id !== productId);
    localStorage.setItem('jewelux_cart', JSON.stringify(state.cart));
    updateCartBadges();
    renderCart();
    showToast('Item removed from shopping bag.', '🗑️');
  };

  window.applyPromoCode = () => {
    const input = document.getElementById('promo-input');
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    if (code === 'JEWELUX10' || code === 'SILVER10' || code === 'VIP10') {
      state.discountPercent = 10;
      state.promoCodeApplied = code;
      showToast(`10% VIP Privilege applied! Code: ${code}`, '✨');
      renderCart();
    } else if (code === 'WEDDING15' || code === 'COUPLES15') {
      state.discountPercent = 15;
      state.promoCodeApplied = code;
      showToast(`15% Newlywed Courtesy applied! Code: ${code}`, '💍');
      renderCart();
    } else {
      showToast('Invalid or expired privilege code.', '⚠️');
    }
  };

  window.simulateCheckout = () => {
    if (state.cart.length === 0) {
      showToast('Your shopping bag is empty.', '🛍️');
      return;
    }
    closeCartDrawer();
    openCheckoutModal();
  };

  // Wishlist
  function renderWishlist() {
    const container = document.getElementById('wishlist-items');
    if (!container) return;
    if (state.wishlist.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center space-y-4">
          <span class="text-4xl block">🤍</span>
          <h4 class="font-display text-lg text-[#1D1815]">Your Cherished Wishlist is Empty</h4>
          <p class="text-xs text-[#766B5E] max-w-xs mx-auto">Tap the heart icon on any piece to save it to your private portfolio.</p>
        </div>
      `;
      return;
    }
    container.innerHTML = state.wishlist.map(p => `
      <div class="py-4 flex gap-4 items-center">
        <img src="${p.image}" alt="${p.name}" class="w-16 h-16 rounded object-cover border border-[#E8E3D8] bg-[#F6EBDD]" />
        <div class="flex-grow">
          <h5 class="font-serif text-sm text-[#1D1815] font-medium leading-snug">${p.name}</h5>
          <p class="text-[10px] text-[#8A6B38] mt-0.5">${p.metal || '925 Silver'}</p>
          <p class="text-xs font-semibold text-[#1D1815] mt-1">${formatPrice(p.priceUSD)}</p>
        </div>
        <div class="flex flex-col items-end gap-2">
          <button onclick="toggleWishlist('${p.id}'); renderWishlist();" class="text-xs text-[#9E9386] hover:text-rose-600 transition" title="Remove">&times;</button>
          <button onclick="moveToBagFromWishlist('${p.id}')" class="btn-luxury-primary py-1.5 px-3 text-[9px]">
            Move to Bag
          </button>
        </div>
      </div>
    `).join('');
  }

  window.openWishlistDrawer = () => {
    renderWishlist();
    const drawer = document.getElementById('wishlist-drawer-backdrop');
    if (drawer) drawer.classList.add('active');
  };

  window.closeWishlistDrawer = () => {
    const drawer = document.getElementById('wishlist-drawer-backdrop');
    if (drawer) drawer.classList.remove('active');
  };

  window.moveToBagFromWishlist = (productId) => {
    addToBag(productId);
    toggleWishlist(productId);
    renderWishlist();
    openCartDrawer();
  };

  // ================= 7. MODALS SYSTEM =================
  // Search Modal
  function renderSearchResults(query) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      resultsContainer.innerHTML = '<p class="text-xs text-[#9E9386] py-6 text-center">Type a keyword to discover certified 925 sterling silver, couple bands, mangalsutras, or gemstones...</p>';
      return;
    }
    const matches = STORE.products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.metal.toLowerCase().includes(q) ||
      (p.stone && p.stone.toLowerCase().includes(q)) ||
      (p.badge && p.badge.toLowerCase().includes(q))
    );

    if (matches.length === 0) {
      resultsContainer.innerHTML = `<p class="text-xs text-[#9E9386] py-8 text-center">No pieces found matching "${query}". Contact our concierge for bespoke atelier requests.</p>`;
      return;
    }

    resultsContainer.innerHTML = matches.map(p => `
      <div onclick="closeSearchModal(); navigateToProduct('${p.id}');" class="flex items-center gap-4 py-3 hover:bg-[#F6EBDD] px-2 rounded cursor-pointer transition">
        <img src="${p.image}" alt="${p.name}" class="w-12 h-12 rounded object-cover border border-[#E8E3D8]" />
        <div class="flex-grow">
          <p class="text-xs font-serif text-[#1D1815] font-medium">${p.name}</p>
          <p class="text-[10px] text-[#8A6B38]">${p.purity || p.metal} • ${p.stone || 'Solitaire'}</p>
        </div>
        <p class="text-xs font-semibold text-[#1D1815]">${formatPrice(p.priceUSD)}</p>
      </div>
    `).join('');
  }

  window.openSearchModal = () => {
    const modal = document.getElementById('search-modal');
    if (modal) {
      modal.classList.add('active');
      const input = document.getElementById('search-input');
      if (input) {
        input.value = '';
        input.focus();
      }
      renderSearchResults('');
    }
  };

  window.closeSearchModal = () => {
    const modal = document.getElementById('search-modal');
    if (modal) modal.classList.remove('active');
  };

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => renderSearchResults(e.target.value));
  }

  // Appointment Modal
  window.openAppointmentModal = (notes = '') => {
    const modal = document.getElementById('appointment-modal');
    if (modal) {
      modal.classList.add('active');
      if (notes) {
        const notesEl = document.getElementById('appointment-notes');
        if (notesEl) notesEl.value = notes;
      }
    }
  };

  window.closeAppointmentModal = () => {
    const modal = document.getElementById('appointment-modal');
    if (modal) modal.classList.remove('active');
  };

  window.submitAppointment = (e) => {
    e.preventDefault();
    closeAppointmentModal();
    showToast('Private Salon Appointment requested! Your advisor will reach out.', '⚜️');
  };

  // Checkout Modal
  window.openCheckoutModal = () => {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.add('active');
  };

  window.closeCheckoutModal = () => {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.remove('active');
  };

  window.confirmCheckout = (e) => {
    e.preventDefault();
    closeCheckoutModal();
    state.cart = [];
    localStorage.removeItem('jewelux_cart');
    updateCartBadges();
    renderCart();
    showToast('Insured acquisition confirmed! Armored courier protocol initiated.', '👑');
  };

  // Quick View Modal
  window.openQuickView = (productId) => {
    const p = STORE.products.find(item => item.id === productId);
    if (!p) return;
    const modal = document.getElementById('quick-view-modal');
    if (!modal) return;
    
    const qvImg = document.getElementById('qv-img');
    const qvBadge = document.getElementById('qv-badge');
    const qvMetal = document.getElementById('qv-metal');
    const qvTitle = document.getElementById('qv-title');
    const qvPrice = document.getElementById('qv-price');
    const qvDesc = document.getElementById('qv-description');
    const qvStone = document.getElementById('qv-stone');
    const qvCut = document.getElementById('qv-cut');
    const qvClarity = document.getElementById('qv-clarity');
    const qvCert = document.getElementById('qv-certificate');

    if (qvImg) qvImg.src = p.image;
    if (qvBadge) qvBadge.textContent = p.badge || (p.isSilver ? '925 Silver' : 'Haute Joaillerie');
    if (qvMetal) qvMetal.textContent = p.metal || '925 Sterling Silver';
    if (qvTitle) qvTitle.textContent = p.name;
    if (qvPrice) qvPrice.textContent = formatPrice(p.priceUSD);
    if (qvDesc) qvDesc.textContent = p.description;
    if (qvStone) qvStone.textContent = p.stone || 'Solitaire';
    if (qvCut) qvCut.textContent = p.cut || 'Hearts & Arrows Ideal';
    if (qvClarity) qvClarity.textContent = p.clarity || 'VVS1 Certified';
    if (qvCert) qvCert.textContent = p.certificate || 'GIA / GRA Registered';

    const addBtn = document.getElementById('qv-add-btn');
    if (addBtn) {
      addBtn.onclick = () => {
        addToBag(p.id);
        closeQuickView();
      };
    }

    const pdpBtn = document.getElementById('qv-view-pdp-btn');
    if (pdpBtn) {
      pdpBtn.onclick = () => {
        closeQuickView();
        navigateToProduct(p.id);
      };
    }

    modal.classList.add('active');
  };

  window.closeQuickView = () => {
    const modal = document.getElementById('quick-view-modal');
    if (modal) modal.classList.remove('active');
  };

  // Size Guide Modal
  window.openSizeGuideModal = () => {
    const modal = document.getElementById('size-guide-modal');
    if (modal) modal.classList.add('active');
  };

  window.closeSizeGuideModal = () => {
    const modal = document.getElementById('size-guide-modal');
    if (modal) modal.classList.remove('active');
  };

  // Accordion Expand/Collapse
  window.toggleAccordion = (headerEl) => {
    const content = headerEl.nextElementSibling;
    const icon = headerEl.querySelector('.accordion-icon') || headerEl.querySelector('svg');
    if (content) {
      const isHidden = content.classList.contains('hidden');
      content.classList.toggle('hidden');
      if (icon) {
        icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    }
  };

  // Lookbook Switcher
  const lookbookData = [
    {
      title: 'The Italian Gala: Timeless Elegance',
      subtitle: 'Sculptural diamonds and champagne gold crafted for dramatic entrances.',
      image: 'images/jewelux_editorial_hero.jpg',
      prodTitle: 'Empress Emerald & Diamond Cascade',
      prodId: 'HJ-002'
    },
    {
      title: 'The Bridal Sanctuary: Eternal Vows',
      subtitle: 'Ethereal 925 fine sterling silver promise rings and bridal mangalsutras celebrating modern matrimony.',
      image: 'images/jewelux_silver_couple_bands.jpg',
      prodTitle: 'The Amore Eternity Couple Bands',
      prodId: 'HJ-SIL-002'
    },
    {
      title: 'The Temple Edit: Sacred Grandeur',
      subtitle: '22K antique gold finish temple necklaces echoing centuries of divine dynasty adornment.',
      image: 'images/jewelux_temple_grandeur.jpg',
      prodTitle: 'Sacred Heritage Temple Necklace',
      prodId: 'HJ-TMP-001'
    }
  ];

  window.switchLookbook = (index) => {
    const item = lookbookData[index];
    if (!item) return;
    const img = document.getElementById('lookbook-image');
    const title = document.getElementById('lookbook-title');
    const subtitle = document.getElementById('lookbook-subtitle');
    const prodTitle = document.getElementById('lookbook-prod-title');
    const prodBtn = document.getElementById('lookbook-prod-btn');

    if (img) img.src = item.image;
    if (title) title.textContent = item.title;
    if (subtitle) subtitle.textContent = item.subtitle;
    if (prodTitle) prodTitle.textContent = item.prodTitle;
    if (prodBtn) {
      prodBtn.onclick = () => openProductPage(item.prodId);
    }

    document.querySelectorAll('[data-lookbook-index]').forEach(btn => {
      const bIdx = parseInt(btn.getAttribute('data-lookbook-index'), 10);
      if (bIdx === index) {
        btn.className = 'px-4 py-1.5 text-xs rounded-full uppercase tracking-wider transition font-medium bg-[#1D1815] text-white';
      } else {
        btn.className = 'px-4 py-1.5 text-xs rounded-full uppercase tracking-wider transition font-medium bg-white text-[#766B5E] border border-[#E8E3D8] hover:text-[#1D1815]';
      }
    });
  };

  // ================= 8. WHATSAPP CONCIERGE INTEGRATION =================
  function toggleWhatsAppPopover() {
    const pop = document.getElementById('whatsapp-popover');
    if (pop) pop.classList.toggle('active');
  }
  window.toggleWhatsAppPopover = toggleWhatsAppPopover;

  function inquireProductOnWhatsApp(productId) {
    const p = STORE.products.find(item => item.id === productId);
    if (!p) return;

    const waNumber = (STORE.storeConfig.whatsappNumber || '+916377061020').replace(/[^0-9]/g, '');
    const priceFormatted = formatPrice(p.priceUSD);
    const message = `Hello House of Jewelux Concierge! I would like to inquire about "${p.name}" (SKU: ${p.id}) in ${p.metal} priced at ${priceFormatted}. Could you share more details on bespoke sizing and availability? Link: https://houseofjewelux.com/#product-${p.id}`;

    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
  }
  window.inquireProductOnWhatsApp = inquireProductOnWhatsApp;

  function inquireBespokeOnWhatsApp() {
    const b = state.bespoke;
    const metalObj = STORE.bespokeStudio.metals.find(m => m.id === b.metalId) || STORE.bespokeStudio.metals[0];
    const gemObj = STORE.bespokeStudio.gems.find(g => g.id === b.gemId) || STORE.bespokeStudio.gems[0];
    const cutObj = STORE.bespokeStudio.cuts.find(c => c.id === b.cutId) || STORE.bespokeStudio.cuts[0];
    const priceTotal = formatPrice(metalObj.priceBase + (gemObj.pricePerCarat * b.caratWeight));

    const waNumber = (STORE.storeConfig.whatsappNumber || '+916377061020').replace(/[^0-9]/g, '');
    const msg = `Hello House of Jewelux Concierge! I have customized a 3D ring on your Bespoke Goldsmith Workbench:

• Metal: ${metalObj.name}
• Gemstone: ${gemObj.name}
• Cut: ${cutObj.name}
• Carat Weight: ${b.caratWeight} ct
• Estimated Valuation: ${priceTotal}

Could we schedule a private atelier consultation to commission this creation?`;

    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  }
  window.inquireBespokeOnWhatsApp = inquireBespokeOnWhatsApp;

  window.orderBespokePiece = () => {
    const b = state.bespoke;
    const metalObj = STORE.bespokeStudio.metals.find(m => m.id === b.metalId) || STORE.bespokeStudio.metals[0];
    const gemObj = STORE.bespokeStudio.gems.find(g => g.id === b.gemId) || STORE.bespokeStudio.gems[0];
    const cutObj = STORE.bespokeStudio.cuts.find(c => c.id === b.cutId) || STORE.bespokeStudio.cuts[0];
    const priceVal = metalObj.priceBase + (gemObj.pricePerCarat * b.caratWeight);

    const bespokeItem = {
      id: `BESPOKE-${Date.now()}`,
      name: `${b.caratWeight}ct ${gemObj.name} ${metalObj.name} Solitaire`,
      priceUSD: priceVal,
      image: 'images/jewelux_solitaire_ring.jpg',
      metal: metalObj.name,
      stone: `${gemObj.name} (${cutObj.name} Cut)`,
      quantity: 1,
      isBespoke: true
    };

    state.cart.push(bespokeItem);
    localStorage.setItem('jewelux_cart', JSON.stringify(state.cart));
    updateCartBadges();
    showToast('Bespoke ring commission added to your bag!', '💍');
    openCartDrawer();
  };

  window.consultBespokePiece = () => {
    inquireBespokeOnWhatsApp();
  };

  // ================= 9. FUTURE 3D JEWELLERY ENGINE =================
  let canvas3D = document.getElementById('bespoke-3d-canvas');
  let ctx3D = canvas3D ? canvas3D.getContext('2d') : null;

  function init3DCanvasEngine() {
    if (!canvas3D || !ctx3D) return;

    // Support Retina Displays
    const rect = canvas3D.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas3D.width = (rect.width || 420) * dpr;
    canvas3D.height = (rect.height || 420) * dpr;
    ctx3D.scale(dpr, dpr);

    // Mouse Interaction
    canvas3D.addEventListener('mousedown', (e) => {
      state.bespoke.isDragging = true;
      state.bespoke.lastMouseX = e.clientX;
      state.bespoke.lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!state.bespoke.isDragging) return;
      const dx = e.clientX - state.bespoke.lastMouseX;
      const dy = e.clientY - state.bespoke.lastMouseY;
      state.bespoke.rotationY += dx * 0.012;
      state.bespoke.rotationX = Math.max(-0.6, Math.min(0.6, state.bespoke.rotationX + dy * 0.008));
      state.bespoke.lastMouseX = e.clientX;
      state.bespoke.lastMouseY = e.clientY;
      render3DFrame();
    });

    window.addEventListener('mouseup', () => {
      state.bespoke.isDragging = false;
    });

    // Touch Interaction for Mobile
    canvas3D.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        state.bespoke.isDragging = true;
        state.bespoke.lastMouseX = e.touches[0].clientX;
        state.bespoke.lastMouseY = e.touches[0].clientY;
      }
    }, { passive: true });

    canvas3D.addEventListener('touchmove', (e) => {
      if (!state.bespoke.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - state.bespoke.lastMouseX;
      const dy = e.touches[0].clientY - state.bespoke.lastMouseY;
      state.bespoke.rotationY += dx * 0.015;
      state.bespoke.rotationX = Math.max(-0.6, Math.min(0.6, state.bespoke.rotationX + dy * 0.01));
      state.bespoke.lastMouseX = e.touches[0].clientX;
      state.bespoke.lastMouseY = e.touches[0].clientY;
      render3DFrame();
    }, { passive: true });

    canvas3D.addEventListener('touchend', () => {
      state.bespoke.isDragging = false;
    });

    // Subtle idle rotation & sparkles
    function animateLoop() {
      if (!state.bespoke.isDragging) {
        state.bespoke.rotationY += 0.003;
      }
      state.bespoke.sparkleTimer += 0.05;
      render3DFrame();
      requestAnimationFrame(animateLoop);
    }
    requestAnimationFrame(animateLoop);
  }

  function render3DFrame() {
    if (!ctx3D) return;
    const rect = canvas3D.getBoundingClientRect();
    const w = rect.width || 420;
    const h = rect.height || 420;
    const cx = w / 2;
    const cy = h / 2 + 25;

    ctx3D.clearRect(0, 0, w, h);

    const b = state.bespoke;
    const metal = STORE.bespokeStudio.metals.find(m => m.id === b.metalId) || STORE.bespokeStudio.metals[0];
    const gem = STORE.bespokeStudio.gems.find(g => g.id === b.gemId) || STORE.bespokeStudio.gems[0];

    const rotY = b.rotationY;
    const rotX = b.rotationX;
    const ringRadius = 95 * b.zoom;
    const tubeRadius = 12 * b.zoom;

    ctx3D.save();
    ctx3D.translate(cx, cy);

    // 1. Draw back half of ring shank
    drawRingArc(ctx3D, ringRadius, tubeRadius, metal, rotY, rotX, true);

    // 2. Draw Crown Setting & Claws
    const crownY = -ringRadius * Math.cos(rotX) - 15;
    const crownX = ringRadius * 0.1 * Math.sin(rotY);

    ctx3D.strokeStyle = metal.isSilver ? '#E0E4EB' : '#C5A674';
    ctx3D.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + rotY;
      const px = crownX + Math.cos(angle) * (30 * b.zoom);
      const py = crownY + Math.sin(angle) * (12 * b.zoom);
      ctx3D.beginPath();
      ctx3D.moveTo(crownX, crownY + 20);
      ctx3D.lineTo(px, py);
      ctx3D.stroke();
    }

    // 3. Draw Center Gemstone
    draw3DGemstone(ctx3D, crownX, crownY, gem, b.cutId, b.caratWeight * b.zoom, rotY, b.sparkleTimer);

    // 4. Draw front half of ring shank
    drawRingArc(ctx3D, ringRadius, tubeRadius, metal, rotY, rotX, false);

    ctx3D.restore();
  }

  function drawRingArc(ctx, r, tube, metal, rotY, rotX, isBack) {
    const startAngle = isBack ? Math.PI : 0;
    const endAngle = isBack ? Math.PI * 2 : Math.PI;

    ctx.save();
    ctx.scale(1, Math.cos(rotX) * 0.45 + 0.55);

    const grad = ctx.createLinearGradient(-r, 0, r, 0);
    if (metal.isSilver) {
      grad.addColorStop(0, '#CBD2DC');
      grad.addColorStop(0.2, '#FFFFFF');
      grad.addColorStop(0.5, '#E5EBF2');
      grad.addColorStop(0.8, '#B8C2CF');
      grad.addColorStop(1, '#9AA6B5');
    } else if (metal.id === 'rose-gold') {
      grad.addColorStop(0, '#D99B87');
      grad.addColorStop(0.3, '#FFE6DD');
      grad.addColorStop(0.6, '#E5A593');
      grad.addColorStop(1, '#9E5B4B');
    } else if (metal.id === 'platinum') {
      grad.addColorStop(0, '#B8BCC4');
      grad.addColorStop(0.25, '#FFFFFF');
      grad.addColorStop(0.6, '#CAD0DA');
      grad.addColorStop(1, '#8A909C');
    } else {
      // Champagne Gold
      grad.addColorStop(0, '#B6925B');
      grad.addColorStop(0.25, '#FFF8EC');
      grad.addColorStop(0.55, '#C5A674');
      grad.addColorStop(0.85, '#DECCA8');
      grad.addColorStop(1, '#7A5B2B');
    }

    ctx.strokeStyle = grad;
    ctx.lineWidth = tube * 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, r, startAngle, endAngle);
    ctx.stroke();

    // Specular Highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -tube * 0.35, r - tube * 0.4, startAngle + 0.2, endAngle - 0.2);
    ctx.stroke();

    ctx.restore();
  }

  function draw3DGemstone(ctx, x, y, gem, cutId, carats, rotY, timer) {
    ctx.save();
    ctx.translate(x, y);

    const size = Math.min(55, Math.max(22, 14 * Math.sqrt(carats)));

    // Facet Glow
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, size * 1.5);
    glow.addColorStop(0, gem.color || 'rgba(255,255,255,0.8)');
    glow.addColorStop(0.7, 'rgba(255,255,255,0.2)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Faceted Geometry
    ctx.fillStyle = gem.color;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.2;

    if (cutId === 'emerald-cut') {
      ctx.beginPath();
      ctx.rect(-size, -size * 0.7, size * 2, size * 1.4);
      ctx.fill();
      ctx.stroke();
    } else if (cutId === 'pear') {
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.3);
      ctx.bezierCurveTo(size * 0.9, -size * 0.3, size * 0.9, size * 0.8, 0, size);
      ctx.bezierCurveTo(-size * 0.9, size * 0.8, -size * 0.9, -size * 0.3, 0, -size * 1.3);
      ctx.fill();
      ctx.stroke();
    } else if (cutId === 'oval') {
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.8, size * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Round Brilliant
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + (rotY * 0.3);
        const px = Math.cos(a) * size;
        const py = Math.sin(a) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Caustic Sparkles
    const sparkleAngle = timer % (Math.PI * 2);
    const spX = Math.cos(sparkleAngle) * (size * 0.6);
    const spY = Math.sin(sparkleAngle) * (size * 0.6);
    drawSparkleStar(ctx, spX, spY, 7 + Math.sin(timer * 2) * 3);

    ctx.restore();
  }

  function drawSparkleStar(ctx, x, y, r) {
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.lineTo(x + r, y);
    ctx.moveTo(x, y - r);
    ctx.lineTo(x, y + r);
    ctx.stroke();
    ctx.restore();
  }

  function updateBespokePrice() {
    const b = state.bespoke;
    const metal = STORE.bespokeStudio.metals.find(m => m.id === b.metalId) || STORE.bespokeStudio.metals[0];
    const gem = STORE.bespokeStudio.gems.find(g => g.id === b.gemId) || STORE.bespokeStudio.gems[0];
    const totalPrice = metal.priceBase + (gem.pricePerCarat * b.caratWeight);

    const priceEl = document.getElementById('bespoke-calc-price');
    if (priceEl) priceEl.textContent = formatPrice(totalPrice);
  }

  window.setBespokeMetal = (metalId) => {
    state.bespoke.metalId = metalId;
    document.querySelectorAll('[data-bespoke-metal]').forEach(b => {
      b.classList.toggle('ring-2', b.getAttribute('data-bespoke-metal') === metalId);
      b.classList.toggle('ring-[#8A6B38]', b.getAttribute('data-bespoke-metal') === metalId);
    });
    updateBespokePrice();
    render3DFrame();
  };

  window.setBespokeGem = (gemId) => {
    state.bespoke.gemId = gemId;
    document.querySelectorAll('[data-bespoke-gem]').forEach(b => {
      b.classList.toggle('ring-2', b.getAttribute('data-bespoke-gem') === gemId);
      b.classList.toggle('ring-[#8A6B38]', b.getAttribute('data-bespoke-gem') === gemId);
    });
    updateBespokePrice();
    render3DFrame();
  };

  window.setBespokeCut = (cutId) => {
    state.bespoke.cutId = cutId;
    document.querySelectorAll('[data-bespoke-cut]').forEach(b => {
      b.classList.toggle('bg-[#1D1815]', b.getAttribute('data-bespoke-cut') === cutId);
      b.classList.toggle('text-white', b.getAttribute('data-bespoke-cut') === cutId);
    });
    render3DFrame();
  };

  window.setBespokeCarat = (caratVal) => {
    state.bespoke.caratWeight = parseFloat(caratVal);
    const displayEl = document.getElementById('bespoke-carat-display');
    if (displayEl) displayEl.textContent = `${state.bespoke.caratWeight.toFixed(2)} ct`;
    updateBespokePrice();
    render3DFrame();
  };

  // ================= 10. PRIVATE FOUNDER STUDIO (#studio / #admin) =================
  function renderStudio() {
    const lockScreen = document.getElementById('studio-lock-screen');
    const dashboard = document.getElementById('studio-dashboard');

    if (!state.studioUnlocked) {
      if (lockScreen) lockScreen.classList.remove('hidden');
      if (dashboard) dashboard.classList.add('hidden');
      const pinInput = document.getElementById('studio-pin-input');
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
      }
      return;
    }

    if (lockScreen) lockScreen.classList.add('hidden');
    if (dashboard) dashboard.classList.remove('hidden');

    switchStudioTab(state.activeStudioTab);
  }

  window.verifyStudioPin = () => {
    const pinInput = document.getElementById('studio-pin-input');
    const enteredPin = pinInput ? pinInput.value.trim() : '';
    const founderPin = STORE.storeConfig.founderPin || '1985';

    if (enteredPin === founderPin) {
      state.studioUnlocked = true;
      showToast('Founder studio authenticated. Welcome back.', '👑');
      renderStudio();
    } else {
      showToast('Invalid Founder PIN passcode.', '⚠️');
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
      }
    }
  };

  window.lockStudio = () => {
    state.studioUnlocked = false;
    renderStudio();
    showToast('Founder Studio securely locked.', '🔒');
  };

  function switchStudioTab(tabId) {
    state.activeStudioTab = tabId;
    const tabs = ['overview', 'inventory', 'content', 'media', 'inquiries'];
    tabs.forEach(t => {
      const panel = document.getElementById(`studio-panel-${t}`);
      const btn = document.getElementById(`studio-tab-btn-${t}`);
      if (panel) {
        if (t === tabId) panel.classList.remove('hidden');
        else panel.classList.add('hidden');
      }
      if (btn) {
        if (t === tabId) {
          btn.className = 'px-4 py-2 rounded-lg text-xs font-medium bg-[#8A6B38] text-white shadow-sm transition';
        } else {
          btn.className = 'px-4 py-2 rounded-lg text-xs font-medium text-[#A4988B] hover:text-white hover:bg-[#1A1613] transition';
        }
      }
    });

    if (tabId === 'overview') renderStudioOverview();
    if (tabId === 'inventory') renderStudioInventory();
    if (tabId === 'content') renderStudioContent();
    if (tabId === 'media') updateMediaSimulator();
    if (tabId === 'inquiries') renderStudioInquiries();
  }
  window.switchStudioTab = switchStudioTab;

  function renderStudioOverview() {
    const totalCount = STORE.products.length;
    const silverCount = STORE.products.filter(p => p.isSilver).length;
    const goldCount = STORE.products.filter(p => p.isGold).length;

    const elTotal = document.getElementById('stat-total-products');
    const elSilver = document.getElementById('stat-silver-count');
    const elGold = document.getElementById('stat-gold-count');
    const elWa = document.getElementById('stat-whatsapp-number');

    if (elTotal) elTotal.textContent = totalCount;
    if (elSilver) elSilver.textContent = silverCount;
    if (elGold) elGold.textContent = goldCount;
    if (elWa) elWa.textContent = STORE.storeConfig.whatsappNumber || '+916377061020';

    const annInput = document.getElementById('studio-announcement-input');
    const waInput = document.getElementById('studio-whatsapp-input');
    if (annInput) annInput.value = STORE.storeConfig.announcementText || '';
    if (waInput) waInput.value = STORE.storeConfig.whatsappNumber || '';
  }

  window.saveAnnouncementBar = () => {
    const annInput = document.getElementById('studio-announcement-input');
    const waInput = document.getElementById('studio-whatsapp-input');
    if (annInput) STORE.storeConfig.announcementText = annInput.value.trim();
    if (waInput) STORE.storeConfig.whatsappNumber = waInput.value.trim();

    JEWELUX_STORAGE.saveStoreData(STORE);
    syncStoreConfigToUI();
    showToast('Storefront announcement & WhatsApp updated live!', '✨');
  };

  window.saveStudioSecurityConfig = () => {
    const newPinInput = document.getElementById('studio-newpin-input');
    const newPin = newPinInput ? newPinInput.value.trim() : '';
    if (newPin.length >= 4) {
      STORE.storeConfig.founderPin = newPin;
      JEWELUX_STORAGE.saveStoreData(STORE);
      showToast('Founder Studio PIN code updated!', '🔒');
      newPinInput.value = '';
    } else {
      showToast('PIN must be at least 4 digits.', '⚠️');
    }
  };

  function renderStudioInventory() {
    const tbody = document.getElementById('studio-inventory-tbody');
    if (!tbody) return;

    const searchInput = document.getElementById('studio-search-input');
    const filterCategory = document.getElementById('studio-category-filter');

    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const cat = filterCategory ? filterCategory.value : 'all';

    let prods = STORE.products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search) || p.id.toLowerCase().includes(search);
      const matchCat = cat === 'all' || (cat === 'silver' ? p.isSilver : p.category === cat);
      return matchSearch && matchCat;
    });

    tbody.innerHTML = prods.map(p => `
      <tr class="hover:bg-[#1A1613] transition border-b border-[#2A231C]">
        <td class="p-3.5 flex items-center gap-3">
          <img src="${p.image}" alt="${p.name}" class="w-10 h-10 rounded object-cover border border-[#C5A674]/30" />
          <div>
            <p class="font-medium text-white text-xs">${p.name}</p>
            <p class="text-[10px] text-[#8A6B38]">SKU: ${p.id} ${p.isSilver ? '• 925 Silver' : ''}</p>
          </div>
        </td>
        <td class="p-3.5 text-xs text-[#DECCA8] capitalize">${p.category}</td>
        <td class="p-3.5">
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-[#8A6B38] font-semibold">$</span>
            <input type="number" value="${p.priceUSD}" onchange="updateStudioProductPrice('${p.id}', this.value)" class="w-20 px-2 py-1 bg-[#1A1613] border border-[#C5A674]/30 text-white rounded text-xs font-semibold focus:border-[#C5A674] outline-none" />
          </div>
        </td>
        <td class="p-3.5">
          <button onclick="toggleStudioStockStatus('${p.id}')" class="px-2.5 py-1 rounded text-[10px] font-medium transition ${p.stockStatus === 'In Stock' ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}">
            ${p.stockStatus || 'In Stock'}
          </button>
        </td>
        <td class="p-3.5 text-right">
          <button onclick="deleteStudioProduct('${p.id}')" class="text-xs text-rose-400 hover:text-rose-300 p-1.5 hover:bg-rose-500/10 rounded transition" title="Delete Piece">
            🗑️
          </button>
        </td>
      </tr>
    `).join('');
  }

  window.updateStudioProductPrice = (productId, newPrice) => {
    const p = STORE.products.find(item => item.id === productId);
    if (p) {
      p.priceUSD = parseFloat(newPrice) || p.priceUSD;
      JEWELUX_STORAGE.saveStoreData(STORE);
      renderAllProductGrids();
      showToast(`Price for "${p.name}" updated to $${p.priceUSD}`, '💰');
    }
  };

  window.toggleStudioStockStatus = (productId) => {
    const p = STORE.products.find(item => item.id === productId);
    if (p) {
      p.stockStatus = p.stockStatus === 'In Stock' ? 'Made to Order' : 'In Stock';
      JEWELUX_STORAGE.saveStoreData(STORE);
      renderStudioInventory();
      showToast(`Stock status changed to ${p.stockStatus}`, '📦');
    }
  };

  window.deleteStudioProduct = (productId) => {
    if (confirm(`Remove "${productId}" from live showcase?`)) {
      STORE.products = STORE.products.filter(p => p.id !== productId);
      JEWELUX_STORAGE.saveStoreData(STORE);
      renderStudioInventory();
      renderAllProductGrids();
      showToast('Product removed from catalog.', '🗑️');
    }
  };

  window.filterStudioInventory = () => {
    renderStudioInventory();
  };

  window.openAddProductModal = () => {
    const name = prompt('Enter Piece Name (e.g., "Aria Pavé Solitaire"):');
    if (!name) return;
    const category = prompt('Enter Category (silver, rings, couples, necklaces, earrings, temple):', 'silver') || 'silver';
    const priceUSD = parseFloat(prompt('Enter USD Price:', '180')) || 180;
    const isSilver = category === 'silver' || confirm('Is this fine 925 Sterling Silver?');

    const newPiece = {
      id: `HJ-${Date.now().toString().slice(-4)}`,
      name: name,
      category: category,
      priceUSD: priceUSD,
      image: isSilver ? 'images/jewelux_solitaire_ring.jpg' : 'images/jewelux_high_jewellery_emerald_necklace.jpg',
      metal: isSilver ? '925 Sterling Silver (Anti-Tarnish Rhodium)' : '18K Gold',
      stone: isSilver ? 'Certified Lab Moissanite' : 'Flawless Diamond',
      purity: isSilver ? 'Hallmarked 925 Silver' : 'BIS Hallmarked 18K',
      description: 'Hand-sculpted in our atelier. Fully hallmarked and certified.',
      badge: isSilver ? 'Silver Spotlight' : 'Bespoke',
      isSilver: isSilver,
      isGold: !isSilver,
      isNew: true,
      stockStatus: 'In Stock',
      targetAudience: 'Women & Couples'
    };

    STORE.products.unshift(newPiece);
    JEWELUX_STORAGE.saveStoreData(STORE);
    renderStudioInventory();
    renderAllProductGrids();
    showToast(`Masterpiece "${newPiece.name}" added to live store!`, '💎');
  };

  function renderStudioContent() {
    const config = STORE.storeConfig;
    const headline = document.getElementById('studio-hero-headline');
    const subtitle = document.getElementById('studio-hero-subtitle');
    const cta = document.getElementById('studio-hero-cta');
    const thresh = document.getElementById('studio-shipping-threshold');
    const shipDom = document.getElementById('studio-shipping-domestic');
    const retPolicy = document.getElementById('studio-returns-policy');

    if (headline) headline.value = config.heroHeadline || '';
    if (subtitle) subtitle.value = config.heroSubtitle || '';
    if (cta) cta.value = config.heroCtaText || '';
    if (thresh) thresh.value = config.freeShippingThresholdUSD || 250;
    if (shipDom) shipDom.value = config.shippingDaysDomestic || '';
    if (retPolicy) retPolicy.value = STORE.policies ? STORE.policies.returns : '';

    renderStudioFaqs();
  }

  window.saveHeroContent = () => {
    const headline = document.getElementById('studio-hero-headline');
    const subtitle = document.getElementById('studio-hero-subtitle');
    const cta = document.getElementById('studio-hero-cta');

    if (headline) STORE.storeConfig.heroHeadline = headline.value;
    if (subtitle) STORE.storeConfig.heroSubtitle = subtitle.value;
    if (cta) STORE.storeConfig.heroCtaText = cta.value;

    JEWELUX_STORAGE.saveStoreData(STORE);
    showToast('Hero section content updated live!', '✨');
  };

  window.savePoliciesContent = () => {
    const thresh = document.getElementById('studio-shipping-threshold');
    const shipDom = document.getElementById('studio-shipping-domestic');
    const retPolicy = document.getElementById('studio-returns-policy');

    if (thresh) STORE.storeConfig.freeShippingThresholdUSD = parseFloat(thresh.value) || 250;
    if (shipDom) STORE.storeConfig.shippingDaysDomestic = shipDom.value;
    if (retPolicy) {
      if (!STORE.policies) STORE.policies = {};
      STORE.policies.returns = retPolicy.value;
    }

    JEWELUX_STORAGE.saveStoreData(STORE);
    showToast('Shipping & return policies saved!', '🛡️');
  };

  function renderStudioFaqs() {
    const list = document.getElementById('studio-faq-list');
    if (!list) return;
    const faqs = STORE.faqs || [
      { q: 'Is your 925 Sterling Silver genuine and hallmarked?', a: 'Every piece is stamped with genuine 925 sterling silver and plated in rhodium for lifelong anti-tarnish luster.' },
      { q: 'Do rings include certificates of authenticity?', a: 'Yes, all our moissanites and gemstones include individual laboratory dossiers and GRA/GIA verification numbers.' }
    ];

    list.innerHTML = faqs.map((faq, i) => `
      <div class="p-3.5 rounded bg-[#16120F] border border-[#C5A674]/20 flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-semibold text-white">Q: ${faq.q}</p>
          <p class="text-[11px] text-[#A4988B] mt-1">A: ${faq.a}</p>
        </div>
        <button onclick="deleteStudioFaq(${i})" class="text-red-400 hover:text-red-300 text-xs flex-shrink-0">&times;</button>
      </div>
    `).join('');
  }

  window.openAddFaqModal = () => {
    const q = prompt('Enter FAQ Question:');
    if (!q) return;
    const a = prompt('Enter FAQ Answer:');
    if (!a) return;
    if (!STORE.faqs) STORE.faqs = [];
    STORE.faqs.push({ q, a });
    JEWELUX_STORAGE.saveStoreData(STORE);
    renderStudioFaqs();
    showToast('FAQ added successfully!', '❓');
  };

  window.deleteStudioFaq = (idx) => {
    if (STORE.faqs) {
      STORE.faqs.splice(idx, 1);
      JEWELUX_STORAGE.saveStoreData(STORE);
      renderStudioFaqs();
      showToast('FAQ removed.', '🗑️');
    }
  };

  // Media Processing Studio
  window.updateMediaSimulator = () => {
    const urlInput = document.getElementById('studio-media-url');
    const bSlider = document.getElementById('slider-brightness');
    const wSlider = document.getElementById('slider-warmth');
    const cSlider = document.getElementById('slider-contrast');
    const wmCheck = document.getElementById('check-watermark');

    const bVal = bSlider ? bSlider.value : 104;
    const wVal = wSlider ? wSlider.value : 105;
    const cVal = cSlider ? cSlider.value : 102;

    const bEl = document.getElementById('val-brightness');
    const wEl = document.getElementById('val-warmth');
    const cEl = document.getElementById('val-contrast');

    if (bEl) bEl.textContent = `${bVal}%`;
    if (wEl) wEl.textContent = `${wVal}%`;
    if (cEl) cEl.textContent = `${cVal}%`;

    const img = document.getElementById('media-preview-img');
    if (img && urlInput) {
      img.src = urlInput.value.trim() || 'images/jewelux_solitaire_ring.jpg';
      const sepiaVal = ((wVal - 100) * 0.01).toFixed(2);
      const cssFilter = `brightness(${bVal / 100}) sepia(${Math.max(0, sepiaVal)}) contrast(${cVal / 100})`;
      img.style.filter = cssFilter;
      const codeEl = document.getElementById('media-css-code');
      if (codeEl) codeEl.textContent = `filter: ${cssFilter};`;
    }

    const wm = document.getElementById('media-preview-watermark');
    if (wm && wmCheck) {
      wm.style.display = wmCheck.checked ? 'block' : 'none';
    }
  };

  window.setMediaAspect = (aspect) => {
    const box = document.getElementById('media-preview-box');
    if (!box) return;
    if (aspect === 'square') box.style.aspectRatio = '1 / 1';
    if (aspect === 'portrait') box.style.aspectRatio = '4 / 5';
    if (aspect === 'banner') box.style.aspectRatio = '16 / 9';
  };

  // WhatsApp Lead CRM
  function renderStudioInquiries() {
    const tbody = document.getElementById('studio-inquiries-tbody');
    if (!tbody) return;

    const inquiries = STORE.inquiries && STORE.inquiries.length ? STORE.inquiries : [
      { id: 'INQ-101', date: '14 Sep 2026', name: 'Rhea & Siddharth (Newlyweds)', piece: 'The Amore Couple Bands in 925 Silver', value: '$240', status: 'In Atelier' },
      { id: 'INQ-102', date: '13 Sep 2026', name: 'Sophia De Luca', piece: 'Custom 3D 2.5ct Moissanite Solitaire', value: '$365', status: 'Contacted' },
      { id: 'INQ-103', date: '12 Sep 2026', name: 'Kabir Varma', piece: 'Luna Pavé Halo Mangalsutra', value: '$280', status: 'Dispatched' }
    ];

    tbody.innerHTML = inquiries.map(inq => `
      <tr class="hover:bg-[#1A1613] border-b border-[#2A231C]">
        <td class="p-3.5">
          <p class="font-medium text-white text-xs">${inq.name}</p>
          <p class="text-[10px] text-[#A4988B]">${inq.date}</p>
        </td>
        <td class="p-3.5 text-xs text-[#DECCA8]">${inq.piece}</td>
        <td class="p-3.5 font-semibold text-[#8A6B38] text-xs">${inq.value}</td>
        <td class="p-3.5">
          <span class="px-2.5 py-0.5 rounded text-[10px] font-medium bg-[#C5A674]/20 text-[#C5A674] border border-[#C5A674]/30">${inq.status}</span>
        </td>
        <td class="p-3.5 text-right">
          <a href="https://wa.me/${(STORE.storeConfig.whatsappNumber||'+916377061020').replace(/[^0-9]/g,'')}?text=Hello%20${encodeURIComponent(inq.name)}!" target="_blank" class="text-[#25D366] hover:underline text-xs">Open WA</a>
        </td>
      </tr>
    `).join('');
  }

  window.addSampleInquiry = () => {
    if (!STORE.inquiries) STORE.inquiries = [];
    STORE.inquiries.unshift({
      id: `INQ-${Date.now().toString().slice(-3)}`,
      date: 'Today',
      name: 'Priya M. (Bride-to-Be)',
      piece: 'Luna Mangalsutra & 925 Tennis Bracelet',
      value: '$600',
      status: 'New Lead'
    });
    JEWELUX_STORAGE.saveStoreData(STORE);
    renderStudioInquiries();
    showToast('New client lead added to pipeline!', '💬');
  };

  // ================= 11. DYNAMIC JSON-LD STRUCTURED DATA SCHEMA =================
  function injectJsonLdSchema(route) {
    let scriptTag = document.getElementById('jewelux-jsonld-schema');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'jewelux-jsonld-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "JewelryStore",
      "name": "HOUSE OF JEWELUX",
      "image": `${window.location.origin}/brand-identity/house_of_jewelux_official_logo.jpg`,
      "description": "Italian high-fashion luxury jewellery digital flagship featuring certified 925 fine sterling silver and bespoke gold bridal commissions.",
      "url": "https://houseofjewelux.com",
      "telephone": STORE.storeConfig.whatsappNumber || "+916377061020",
      "priceRange": "$$$$",
      "currenciesAccepted": "USD, INR, EUR, GBP, AED",
      "paymentAccepted": "Credit Card, Wire Transfer, Armored Escrow",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Geneva",
        "addressCountry": "CH"
      }
    };

    if (state.activeProduct && route === 'product-detail') {
      schema["@type"] = "Product";
      schema["name"] = state.activeProduct.name;
      schema["image"] = state.activeProduct.image;
      schema["description"] = state.activeProduct.description;
      schema["offers"] = {
        "@type": "Offer",
        "price": state.activeProduct.priceUSD,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      };
    }

    scriptTag.textContent = JSON.stringify(schema, null, 2);
  }

  // ================= 12. INITIAL BOOTSTRAP =================
  renderAllProductGrids();
  init3DCanvasEngine();
  handleRoute();
});
