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

  // Default currency is strictly INR unless user manually chose otherwise in this session
  const initialCurrency = sessionStorage.getItem('jewelux_currency') || localStorage.getItem('jewelux_currency') || 'INR';

  // Global Application State
  const state = {
    currency: initialCurrency,
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
      metalId: 'yellow-gold',
      gemId: 'diamond',
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

  // Indian Number Formatting System (Lakhs & Crores: e.g. 10,000, 1,25,000, 12,50,000, 1,25,00,000)
  function formatIndianNumber(num) {
    const s = Math.round(num).toString();
    if (s.length <= 3) return s;
    const last3 = s.substring(s.length - 3);
    const other = s.substring(0, s.length - 3);
    return other.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
  window.formatIndianNumber = formatIndianNumber;

  // Price Formatting
  const currencyRates = {
    INR: { symbol: '₹', rate: 83.5 },
    USD: { symbol: '$', rate: 1 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.79 },
    AED: { symbol: 'AED ', rate: 3.67 }
  };

  function formatPrice(usdAmount) {
    const curr = currencyRates[state.currency] || currencyRates.INR;
    const converted = Math.round(usdAmount * curr.rate);
    if (state.currency === 'INR') {
      return `₹${formatIndianNumber(converted)}`;
    }
    return `${curr.symbol}${converted.toLocaleString()}`;
  }
  window.formatPrice = formatPrice;

  // Currency Switcher & Cross-Viewport Synchronizer
  function initCurrencySwitcher() {
    const selects = document.querySelectorAll('#currency-select, select[id="currency-select"]');
    selects.forEach(select => {
      select.value = state.currency;
      select.addEventListener('change', (e) => {
        state.currency = e.target.value;
        sessionStorage.setItem('jewelux_currency', e.target.value);
        localStorage.setItem('jewelux_currency', e.target.value);
        
        // Sync all currency dropdowns on the page
        document.querySelectorAll('#currency-select, select[id="currency-select"]').forEach(s => {
          s.value = state.currency;
        });

        renderAllProductGrids();
        renderCart();
        renderWishlist();
        updateBespokePrice();
        if (state.activeProduct) renderProductDetail(state.activeProduct);
      });
    });
  }
  initCurrencySwitcher();

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
      const el = document.getElementById('bespoke-studio');
      if (el) el.scrollIntoView(true);
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

    function renderShopCategoryPills() {
    const pillsContainer = document.getElementById('shop-category-pills');
    if (!pillsContainer) return;
    
    const categories = (STORE && STORE.categories) ? STORE.categories : [
      { id: 'all', name: 'All Jewels', icon: '✦', isPrimary: false },
      { id: 'indian-jewellery', name: 'Indian Jewellery', icon: '🪷', isPrimary: true },
      { id: 'fine-jewellery', name: 'Fine Jewellery', icon: '💎', isPrimary: true },
      { id: 'temple-jewellery', name: 'Temple Jewellery', icon: '🛕', isPrimary: true },
      { id: 'heritage-traditional', name: 'Heritage & Traditional', icon: '👑', isPrimary: false },
      { id: 'diamond-jewellery', name: 'Diamond Jewellery', icon: '✨', isPrimary: false },
      { id: 'gold-jewellery', name: 'Gold Jewellery', icon: '⚜️', isPrimary: false },
      { id: 'silver-jewellery', name: 'Silver Jewellery', icon: '⚪', isPrimary: false },
      { id: 'haute-joaillerie', name: 'Haute Joaillerie', icon: '🌟', isPrimary: false }
    ];

    pillsContainer.innerHTML = categories.map(cat => {
      const isActive = state.activeCategory === cat.id;
      const isPrimary = cat.isPrimary;
      
      let btnClasses = "px-3.5 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-medium transition flex items-center gap-1.5 border ";
      if (isActive) {
        btnClasses += "bg-[#1D1815] text-white border-[#1D1815] shadow-sm";
      } else if (isPrimary) {
        btnClasses += "bg-[#F6EBDD] text-[#8A6B38] border-[#C5A674]/60 hover:bg-[#1D1815] hover:text-white";
      } else {
        btnClasses += "bg-white text-[#766B5E] border-[#E8E3D8] hover:border-[#C5A674] hover:text-[#1D1815]";
      }

      const coreBadge = isPrimary ? `<span class="text-[9px] uppercase tracking-widest text-[#8A6B38] font-bold px-1.5 py-0.2 bg-white/90 rounded border border-[#C5A674]/30">CORE</span>` : '';

      return `
        <button onclick="filterShopCategory('${cat.id}')" data-cat-pill="${cat.id}" class="${btnClasses}">
          <span>${cat.icon || '✦'}</span>
          <span>${cat.name}</span>
          ${coreBadge}
        </button>
      `;
    }).join('');
  }

  function renderShopView() {
    renderShopCategoryPills();
    const container = document.getElementById('shop-product-grid') || document.getElementById('shop-products-grid');
    if (!container) return;

    let filtered = [...STORE.products];

    if (state.activeCategory === 'all') {
      // all products
    } else if (state.activeCategory === 'silver' || state.activeCategory === 'silver-jewellery') {
      filtered = filtered.filter(p => p.mainCategoryId === 'silver-jewellery' || p.isSilver);
    } else if (state.activeCategory === 'indian-jewellery') {
      filtered = filtered.filter(p => p.mainCategoryId === 'indian-jewellery');
    } else if (state.activeCategory === 'fine-jewellery') {
      filtered = filtered.filter(p => p.mainCategoryId === 'fine-jewellery');
    } else if (state.activeCategory === 'temple' || state.activeCategory === 'temple-jewellery') {
      filtered = filtered.filter(p => p.mainCategoryId === 'temple-jewellery' || p.category === 'temple');
    } else if (state.activeCategory === 'heritage-traditional' || state.activeCategory === 'couples') {
      filtered = filtered.filter(p => p.mainCategoryId === 'heritage-traditional' || p.collection === 'eternal-couples');
    } else if (state.activeCategory === 'diamond-jewellery') {
      filtered = filtered.filter(p => p.mainCategoryId === 'diamond-jewellery' || (p.stone && p.stone.toLowerCase().includes('diamond')));
    } else if (state.activeCategory === 'gold-jewellery' || state.activeCategory === 'gold-vault') {
      filtered = filtered.filter(p => p.mainCategoryId === 'gold-jewellery' || p.isGold);
    } else if (state.activeCategory === 'haute-joaillerie') {
      filtered = filtered.filter(p => p.mainCategoryId === 'haute-joaillerie' || p.priceUSD >= 700);
    } else if (state.activeCategory === 'new-arrivals') {
      filtered = filtered.filter(p => p.isNew);
    } else {
      filtered = filtered.filter(p => p.category === state.activeCategory || p.collection === state.activeCategory || p.mainCategoryId === state.activeCategory);
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
      : `<div class="col-span-full py-16 text-center text-[#766B5E]">No pieces found in this curation. Explore <a href="#indian-jewellery" onclick="filterShopCategory('indian-jewellery')" class="text-[#8A6B38] underline">Indian Jewellery</a>.</div>`;

    // Highlight active category tab in shop filter bar
    document.querySelectorAll('[data-cat-pill]').forEach(btn => {
      const cat = btn.getAttribute('data-cat-pill');
      if (cat === state.activeCategory) {
        btn.classList.add('bg-[#1D1815]', 'text-white');
        btn.classList.remove('bg-white', 'text-[#766B5E]', 'bg-[#F6EBDD]', 'text-[#8A6B38]');
      }
    });
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

    const specCategory = document.getElementById('pdp-spec-category');
    const specDesignedIn = document.getElementById('pdp-spec-designed');
    const specCraftedIn = document.getElementById('pdp-spec-crafted');
    const specMaterial = document.getElementById('pdp-spec-material');
    const specGemstone = document.getElementById('pdp-spec-gemstone');
    const specCertRow = document.getElementById('pdp-spec-cert-row');
    const specCert = document.getElementById('pdp-spec-cert');
    const specDimensions = document.getElementById('pdp-spec-dimensions');

    if (specCategory) specCategory.textContent = p.mainCategory || 'Indian Fine Jewellery';
    if (specDesignedIn) specDesignedIn.textContent = p.designedIn || 'India';
    if (specCraftedIn) specCraftedIn.textContent = p.craftedIn || 'India';
    if (specMaterial) specMaterial.textContent = p.material || p.metal || 'BIS Hallmarked 925 Sterling Silver';
    if (specGemstone) specGemstone.textContent = p.gemstone || p.stone || 'Natural Gemstone';
    
    if (specCertRow) {
      if (p.certificate && p.certificate.trim() !== '' && p.certificate !== 'None') {
        specCertRow.style.display = 'flex';
        if (specCert) specCert.textContent = p.certificate;
      } else {
        specCertRow.style.display = 'none';
      }
    }
    if (specDimensions) specDimensions.textContent = p.dimensions || 'Bespoke Atelier Sizing';

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
      const freeThreshold = (STORE.storeConfig && STORE.storeConfig.freeShippingThresholdUSD) || 250;
      if (progressText) progressText.textContent = `Complimentary Insured Courier on orders over ${formatPrice(freeThreshold)}`;
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

  // Checkout Modal & Live Order Summary
  function renderCheckoutSummary() {
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;
    const form = modal.querySelector('form');
    if (!form) return;

    let summaryContainer = document.getElementById('checkout-order-summary');
    if (!summaryContainer) {
      summaryContainer = document.createElement('div');
      summaryContainer.id = 'checkout-order-summary';
      form.parentNode.insertBefore(summaryContainer, form);
    }

    const subtotal = state.cart.reduce((sum, item) => sum + (item.priceUSD * (item.quantity || 1)), 0);
    const discountAmount = state.discountPercent ? (subtotal * state.discountPercent / 100) : 0;
    const finalTotal = Math.max(0, subtotal - discountAmount);
    const totalItems = state.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    summaryContainer.innerHTML = `
      <div class="my-4 p-4 bg-[#F6EBDD] border border-[#C5A674]/40 rounded-xl text-left space-y-2 font-sans">
        <div class="flex justify-between text-xs text-[#766B5E]">
          <span>Acquisition Pieces (${totalItems})</span>
          <span class="font-medium text-[#1D1815]">${formatPrice(subtotal)}</span>
        </div>
        ${discountAmount > 0 ? `
          <div class="flex justify-between text-xs text-[#10B981]">
            <span>VIP Privilege (${state.discountPercent}%)</span>
            <span>-${formatPrice(discountAmount)}</span>
          </div>
        ` : ''}
        <div class="flex justify-between text-xs text-[#766B5E]">
          <span>Insured Armored Delivery</span>
          <span class="text-[#10B981] font-semibold">Complimentary</span>
        </div>
        <div class="flex justify-between text-sm font-semibold text-[#1D1815] pt-2 border-t border-[#C5A674]/30 font-display">
          <span>Order Valuation</span>
          <span class="text-[#8A6B38] font-bold text-base">${formatPrice(finalTotal)}</span>
        </div>
      </div>
    `;
  }

  window.openCheckoutModal = () => {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
      modal.classList.add('active');
      renderCheckoutSummary();
    }
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

    const waNumber = (STORE.storeConfig.whatsappNumber || '+916377061020').replace(/[^0-9]/g, '');
    const msg = `Hello House of Jewelux Concierge! I have customized a 3D ring on your Bespoke Goldsmith Workbench:

• Metal: ${metalObj.name}
• Gemstone: ${gemObj.name}
• Cut: ${cutObj.name}
• Carat Weight: ${b.caratWeight} ct

Could we schedule a private atelier consultation to discuss this bespoke creation?`;

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

  // ================= 9. LUXURY 3D JEWELLERY ENGINE (THREE.JS) =================
  class Jewelry3DViewer {
    constructor(canvasId = 'bespoke-3d-canvas', containerId = 'bespoke-3d-wrapper', loaderId = 'canvas-3d-loader') {
      this.canvas = document.getElementById(canvasId);
      this.container = document.getElementById(containerId);
      this.loader = document.getElementById(loaderId);
      if (!this.canvas) return;

      this.currentMetal = state.bespoke.metalId || 'yellow-gold';
      this.currentGem = state.bespoke.gemId || 'diamond';
      this.currentCut = state.bespoke.cutId || 'round';
      this.currentCarat = state.bespoke.caratWeight || 2.5;

      this.isUserInteracting = false;
      this.hasUserInteractedOnce = false;
      this.idleTimer = null;
      this.resizeTimeout = null;
      this.resizeObserver = null;

      this.init();
    }

    init() {
      if (typeof THREE === 'undefined') {
        console.warn('Three.js not loaded, skipping 3D engine init.');
        return;
      }

      const rect = this.container ? this.container.getBoundingClientRect() : this.canvas.getBoundingClientRect();
      this.width = rect.width || 600;
      this.height = rect.height || 480;

      // 1. WebGL Renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
      this.renderer.setSize(this.width, this.height, false);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
      this.renderer.outputEncoding = THREE.sRGBEncoding;

      // 2. Scene & Camera
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(34, this.width / this.height, 0.1, 1000);
      // Hero 3/4 beauty angle direction vector matching visual reference photo exactly
      // Initial positioning will be dynamically calibrated by updateCameraFraming()
      this.camera.position.set(16, 20, 36);

      // 3. OrbitControls (Smooth inertia, pan disabled, controlled gentle zoom)
      if (typeof THREE.OrbitControls !== 'undefined') {
        this.controls = new THREE.OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = false;
        this.controls.enableZoom = true;
        this.controls.zoomSpeed = 0.40;
        this.controls.minPolarAngle = Math.PI * 0.12;
        this.controls.maxPolarAngle = Math.PI * 0.82;
        this.controls.target.set(0, 1.2, 0);

        this.controls.addEventListener('start', () => {
          this.isUserInteracting = true;
          this.hasUserInteractedOnce = true;
          if (this.idleTimer) clearTimeout(this.idleTimer);
        });
        this.controls.addEventListener('end', () => {
          this.idleTimer = setTimeout(() => {
            this.isUserInteracting = false;
          }, 2500);
        });
      }

      // Quick double-click to reset to default hero view
      this.canvas.addEventListener('dblclick', () => {
        this.hasUserInteractedOnce = false;
        this.updateCameraFraming(true);
      });

      // Initial responsive camera framing calculation for current display size
      this.updateCameraFraming(true);

      // 4. Studio Environment & Lighting
      this.createStudioEnvironment();
      this.createStudioLights();
      this.createGroundShadow();

      // 5. Build 3D Ring Group
      this.ringGroup = new THREE.Group();
      this.ringGroup.rotation.set(0.08, -0.22, 0.05);
      this.scene.add(this.ringGroup);

      this.materials = this.createMaterials();

      // 6. Build Geometry Components
      this.buildShank();
      this.buildSettingHead();
      this.buildCenterGemstone();

      // 7. Hide Loader with Smooth Fade
      if (this.loader) {
        setTimeout(() => {
          this.loader.classList.add('fade-out');
        }, 300);
      }

      // 8. Responsive Display, Screen Orientation & Observer Handlers
      window.addEventListener('resize', () => this.handleResizeDebounced());
      window.addEventListener('orientationchange', () => {
        setTimeout(() => this.onResize(), 100);
        setTimeout(() => this.onResize(), 300);
      });
      if (typeof screen !== 'undefined' && screen.orientation) {
        screen.orientation.addEventListener('change', () => {
          setTimeout(() => this.onResize(), 100);
          setTimeout(() => this.onResize(), 300);
        });
      }
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.onResize();
        }
      });

      if (typeof ResizeObserver !== 'undefined' && this.container) {
        this.resizeObserver = new ResizeObserver(() => {
          this.onResize();
        });
        this.resizeObserver.observe(this.container);
      }

      // Final settling frame in case layout engine is still calculating styles
      requestAnimationFrame(() => this.onResize());
      setTimeout(() => this.onResize(), 250);

      this.animate();
    }

    createStudioEnvironment() {
      const pmremGen = new THREE.PMREMGenerator(this.renderer);
      pmremGen.compileEquirectangularShader();

      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x020202); // Deep dark studio void for crisp facet scintillation

      // 4 High-contrast vertical softbox strips (produces liquid metal reflections & diamond scintillation)
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + Math.PI / 8;
        const strip = new THREE.Mesh(
          new THREE.PlaneGeometry(5, 30),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        strip.position.set(Math.cos(ang) * 22, 14, Math.sin(ang) * 22);
        strip.lookAt(0, 5, 0);
        envScene.add(strip);
      }

      // Overhead kicker spots for crisp table facet highlights
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2;
        const kicker = new THREE.Mesh(
          new THREE.PlaneGeometry(8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        kicker.position.set(Math.cos(ang) * 10, 24, Math.sin(ang) * 10);
        kicker.lookAt(0, 0, 0);
        envScene.add(kicker);
      }

      // Warm Bottom Reflector for 18K Gold Underside Glow
      const bounceBox = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 30),
        new THREE.MeshBasicMaterial({ color: 0x9b6e1e })
      );
      bounceBox.position.set(0, -16, 0);
      bounceBox.rotation.x = -Math.PI / 2;
      envScene.add(bounceBox);

      const renderTarget = pmremGen.fromScene(envScene, 0.0);
      this.scene.environment = renderTarget.texture;
    }

    createStudioLights() {
      // Gentle ambient so crevices have deep contrast
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
      this.scene.add(ambientLight);

      // Key light: warm specular gleam
      const keyLight = new THREE.DirectionalLight(0xfff6ea, 0.95);
      keyLight.position.set(16, 25, 20);
      this.scene.add(keyLight);

      // Fill light: soft cool shadow fill
      const fillLight = new THREE.DirectionalLight(0xdce8ff, 0.30);
      fillLight.position.set(-18, 14, -14);
      this.scene.add(fillLight);

      // Diamond sparkle pinpoint
      const diamondSpot = new THREE.PointLight(0xffffff, 0.70, 30);
      diamondSpot.position.set(2, 22, 10);
      this.scene.add(diamondSpot);
    }

    createGroundShadow() {
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 256;
      shadowCanvas.height = 256;
      const sctx = shadowCanvas.getContext('2d');
      const grad = sctx.createRadialGradient(128, 128, 6, 128, 128, 115);
      grad.addColorStop(0, 'rgba(30, 20, 12, 0.58)');
      grad.addColorStop(0.35, 'rgba(50, 36, 22, 0.28)');
      grad.addColorStop(0.7, 'rgba(75, 60, 45, 0.08)');
      grad.addColorStop(1, 'rgba(75, 60, 45, 0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 256, 256);

      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      const shadowGeom = new THREE.PlaneGeometry(36, 36);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
      });
      const shadowPlane = new THREE.Mesh(shadowGeom, shadowMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -10.45;
      this.scene.add(shadowPlane);
    }

    createMaterials() {
      // Calibrated metal palettes (eliminates washed-out 3D appearance with true PBR metallic conductors)
      const metalPalettes = {
        'yellow-gold': { shank: 0xB28228, head: 0xDCE0E8, metalness: 0.98, roughness: 0.09, clearcoat: 0.08, envMapIntensity: 1.5 },
        'liquid-silver': { shank: 0xE2E7EE, head: 0xE2E7EE, metalness: 0.98, roughness: 0.07, clearcoat: 0.10, envMapIntensity: 1.6 },
        'rose-gold': { shank: 0xBA6450, head: 0xDCE0E8, metalness: 0.98, roughness: 0.09, clearcoat: 0.08, envMapIntensity: 1.5 },
        'white-gold': { shank: 0xDCE0E8, head: 0xDCE0E8, metalness: 0.98, roughness: 0.07, clearcoat: 0.12, envMapIntensity: 1.7 },
        'platinum': { shank: 0xD2D6E0, head: 0xD2D6E0, metalness: 1.0, roughness: 0.06, clearcoat: 0.12, envMapIntensity: 1.7 }
      };

      const curMetal = metalPalettes[this.currentMetal] || metalPalettes['yellow-gold'];

      const shankMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(curMetal.shank),
        metalness: curMetal.metalness,
        roughness: curMetal.roughness,
        clearcoat: curMetal.clearcoat,
        clearcoatRoughness: 0.03,
        reflectivity: 0.96,
        envMapIntensity: curMetal.envMapIntensity
      });

      const headMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(curMetal.head),
        metalness: 0.98,
        roughness: 0.07,
        clearcoat: 0.12,
        clearcoatRoughness: 0.02,
        reflectivity: 0.98,
        envMapIntensity: 1.8
      });

      // Calibrated gemstone palettes (solid white diamond fully opaque, zero internal reflection)
      const gemPalettes = {
        'diamond': {
          color: 0xffffff, // Solid pure white diamond material (fully opaque)
          metalness: 0.0,
          roughness: 0.04,
          clearcoat: 1.0,
          envMapIntensity: 1.7,
          wire: 0xd2d9e4,
          wireOpacity: 0.40
        },
        'moissanite': {
          color: 0xfafcff,
          metalness: 0.0,
          roughness: 0.04,
          clearcoat: 1.0,
          envMapIntensity: 1.8,
          wire: 0xd2d9e4,
          wireOpacity: 0.40
        },
        'emerald': {
          color: 0x022c13, // Authentic Colombian deep velvety emerald green (NOT neon!)
          metalness: 0.02,
          roughness: 0.04,
          clearcoat: 0.5,
          envMapIntensity: 1.3,
          wire: 0x011f0d, // Deep forest green facet edge
          wireOpacity: 0.25
        },
        'sapphire': {
          color: 0x051336, // Deep royal Kashmir sapphire blue
          metalness: 0.02,
          roughness: 0.04,
          clearcoat: 0.5,
          envMapIntensity: 1.3,
          wire: 0x020a1f,
          wireOpacity: 0.25
        },
        'ruby': {
          color: 0x38030d, // Deep Burmese pigeon blood ruby
          metalness: 0.02,
          roughness: 0.04,
          clearcoat: 0.5,
          envMapIntensity: 1.3,
          wire: 0x220107,
          wireOpacity: 0.25
        }
      };

      const curGem = gemPalettes[this.currentGem] || gemPalettes['diamond'];

      const gemMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(curGem.color),
        roughness: curGem.roughness,
        metalness: curGem.metalness,
        clearcoat: curGem.clearcoat,
        clearcoatRoughness: 0.0,
        reflectivity: 1.0,
        envMapIntensity: curGem.envMapIntensity,
        flatShading: true,
        side: THREE.FrontSide, // Disable all internal reflections/backfaces - strictly front-facing opaque outer facets
        transparent: false,
        depthWrite: true
      });

      const wireMaterial = new THREE.LineBasicMaterial({
        color: curGem.wire,
        transparent: true,
        opacity: curGem.wireOpacity,
        linewidth: 1,
        depthTest: true
      });

      // Micro-pavé diamonds on gallery collar (Solid pure white brilliant diamond sparkle)
      const paveMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xffffff),
        roughness: 0.04,
        metalness: 0.0,
        clearcoat: 1.0,
        reflectivity: 1.0,
        envMapIntensity: 1.8,
        flatShading: true,
        side: THREE.FrontSide,
        transparent: false,
        depthWrite: true
      });

      return {
        shank: shankMaterial,
        head: headMaterial,
        gem: gemMaterial,
        wire: wireMaterial,
        pave: paveMaterial,
        metalPalettes,
        gemPalettes
      };
    }

    buildShank() {
      if (this.shankMesh) {
        this.ringGroup.remove(this.shankMesh);
      }

      const nSegments = 90;
      const nRadial = 18;
      const vertices = [];
      const indices = [];

      const topHalfGap = 0.22;
      const startAngle = Math.PI * 0.5 + topHalfGap;
      const endAngle = Math.PI * 2.5 - topHalfGap;
      const totalSweep = endAngle - startAngle;

      const rInner = 9.0;
      const rOuterBase = 10.8;

      for (let i = 0; i <= nSegments; i++) {
        const t = i / nSegments;
        const theta = startAngle + t * totalSweep;

        const distFromMid = Math.abs(t - 0.5) * 2.0;
        const shoulder = Math.pow(Math.max(0, distFromMid - 0.32) / 0.68, 1.8);

        const rOuter = rOuterBase + shoulder * 1.5;
        const rMid = (rInner + rOuter) / 2.0;
        const radialThickness = (rOuter - rInner) / 2.0;
        const axialWidth = (1.28 - shoulder * 0.28);

        const cx = Math.cos(theta) * rMid;
        const cy = Math.sin(theta) * rMid;
        const nx = Math.cos(theta);
        const ny = Math.sin(theta);

        for (let j = 0; j < nRadial; j++) {
          const phi = (j / nRadial) * Math.PI * 2.0;
          const sinP = Math.sin(phi);
          const cosP = Math.cos(phi);

          const radOff = sinP * radialThickness * (sinP < 0 ? 0.78 : 1.0);
          const zOff = cosP * axialWidth;

          vertices.push(
            cx + nx * radOff,
            cy + ny * radOff,
            zOff
          );
        }
      }

      for (let i = 0; i < nSegments; i++) {
        for (let j = 0; j < nRadial; j++) {
          const jNext = (j + 1) % nRadial;
          const p1 = i * nRadial + j;
          const p2 = i * nRadial + jNext;
          const p3 = (i + 1) * nRadial + jNext;
          const p4 = (i + 1) * nRadial + j;

          indices.push(p1, p2, p3);
          indices.push(p1, p3, p4);
        }
      }

      // End caps for shoulders
      const cap1Center = vertices.length / 3;
      let c1x = 0, c1y = 0, c1z = 0;
      for (let j = 0; j < nRadial; j++) {
        c1x += vertices[j * 3];
        c1y += vertices[j * 3 + 1];
        c1z += vertices[j * 3 + 2];
      }
      vertices.push(c1x / nRadial, c1y / nRadial, c1z / nRadial);
      for (let j = 0; j < nRadial; j++) {
        indices.push(cap1Center, (j + 1) % nRadial, j);
      }

      const cap2Center = vertices.length / 3;
      const lastRow = nSegments * nRadial;
      let c2x = 0, c2y = 0, c2z = 0;
      for (let j = 0; j < nRadial; j++) {
        c2x += vertices[(lastRow + j) * 3];
        c2y += vertices[(lastRow + j) * 3 + 1];
        c2z += vertices[(lastRow + j) * 3 + 2];
      }
      vertices.push(c2x / nRadial, c2y / nRadial, c2z / nRadial);
      for (let j = 0; j < nRadial; j++) {
        indices.push(cap2Center, lastRow + j, lastRow + (j + 1) % nRadial);
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geom.setIndex(indices);
      geom.computeVertexNormals();

      this.shankMesh = new THREE.Mesh(geom, this.materials.shank);
      this.ringGroup.add(this.shankMesh);
    }

    getCaratScale(carat = this.currentCarat) {
      const c = parseFloat(carat) || 2.5;
      // Authentic GIA millimeter proportion scaling relative to 2.50ct (8.8mm base)
      if (Math.abs(c - 1.00) < 0.05) return 0.74;   // 1.00ct: 6.5mm
      if (Math.abs(c - 1.75) < 0.05) return 0.888;  // 1.75ct: 7.8mm
      if (Math.abs(c - 2.50) < 0.05) return 1.00;   // 2.50ct: 8.8mm
      if (Math.abs(c - 4.00) < 0.05) return 1.172;  // 4.00ct: 10.3mm
      return Math.pow(c / 2.5, 0.34);
    }

    buildSettingHead() {
      if (this.headGroup) {
        this.ringGroup.remove(this.headGroup);
        this.headGroup.traverse(child => {
          if (child.isMesh && child.geometry) child.geometry.dispose();
        });
      }

      this.headGroup = new THREE.Group();

      const scale = this.getCaratScale(this.currentCarat);
      const baseRadius = 3.55;
      const stoneRadius = baseRadius * scale;
      const girdleY = 14.1 + (scale - 1.0) * 1.25;

      // 1. Dynamic Gallery Collar / Basket Ring
      const collarY = 11.25 + (scale - 1.0) * 0.45;
      const collarRadius = stoneRadius * 0.72;
      const collarTube = 0.38 + (scale - 1.0) * 0.12;

      let collarMesh;
      if (['emerald-cut', 'asscher', 'radiant', 'princess'].includes(this.currentCut)) {
        const ew = (this.currentCut === 'emerald-cut' || this.currentCut === 'radiant' ? 3.2 : 3.4) * scale * 0.72;
        const el = (this.currentCut === 'emerald-cut' ? 4.2 : this.currentCut === 'radiant' ? 4.0 : 3.4) * scale * 0.72;
        const egc = 0.65 * scale * 0.72;
        const curvePoints = [
          new THREE.Vector3(-ew + egc, collarY, -el),
          new THREE.Vector3(ew - egc, collarY, -el),
          new THREE.Vector3(ew, collarY, -el + egc),
          new THREE.Vector3(ew, collarY, el - egc),
          new THREE.Vector3(ew - egc, collarY, el),
          new THREE.Vector3(-ew + egc, collarY, el),
          new THREE.Vector3(-ew, collarY, el - egc),
          new THREE.Vector3(-ew, collarY, -el + egc)
        ];
        const closedCurve = new THREE.CatmullRomCurve3(curvePoints, true, 'catmullrom', 0.1);
        const collarGeom = new THREE.TubeGeometry(closedCurve, 32, collarTube, 12, true);
        collarMesh = new THREE.Mesh(collarGeom, this.materials.head);
      } else if (['cushion', 'elongated-cushion'].includes(this.currentCut)) {
        const cw = (this.currentCut === 'elongated-cushion' ? 3.2 : 3.5) * scale * 0.70;
        const cl = (this.currentCut === 'elongated-cushion' ? 4.1 : 3.5) * scale * 0.70;
        const curvePoints = [
          new THREE.Vector3(-cw, collarY, -cl * 0.6),
          new THREE.Vector3(-cw * 0.6, collarY, -cl),
          new THREE.Vector3(cw * 0.6, collarY, -cl),
          new THREE.Vector3(cw, collarY, -cl * 0.6),
          new THREE.Vector3(cw, collarY, cl * 0.6),
          new THREE.Vector3(cw * 0.6, collarY, cl),
          new THREE.Vector3(-cw * 0.6, collarY, cl),
          new THREE.Vector3(-cw, collarY, cl * 0.6)
        ];
        const closedCurve = new THREE.CatmullRomCurve3(curvePoints, true, 'catmullrom', 0.15);
        const collarGeom = new THREE.TubeGeometry(closedCurve, 32, collarTube, 12, true);
        collarMesh = new THREE.Mesh(collarGeom, this.materials.head);
      } else if (this.currentCut === 'marquise') {
        const collarGeom = new THREE.TorusGeometry(collarRadius, collarTube, 16, 32);
        collarGeom.rotateX(Math.PI / 2);
        collarGeom.scale(0.85, 1.0, 1.45);
        collarMesh = new THREE.Mesh(collarGeom, this.materials.head);
        collarMesh.position.y = collarY;
      } else if (this.currentCut === 'oval') {
        const collarGeom = new THREE.TorusGeometry(collarRadius, collarTube, 16, 32);
        collarGeom.rotateX(Math.PI / 2);
        collarGeom.scale(1.28, 1.0, 0.88);
        collarMesh = new THREE.Mesh(collarGeom, this.materials.head);
        collarMesh.position.y = collarY;
      } else {
        const collarGeom = new THREE.TorusGeometry(collarRadius, collarTube, 16, 32);
        collarGeom.rotateX(Math.PI / 2);
        collarMesh = new THREE.Mesh(collarGeom, this.materials.head);
        collarMesh.position.y = collarY;
      }
      this.headGroup.add(collarMesh);

      // Micro-pavé diamonds on gallery collar (follow collar diameter and height)
      const paveCount = 10;
      const paveRadius = collarRadius + collarTube * 0.22;
      const paveGeom = new THREE.SphereGeometry(0.28 + (scale - 1.0) * 0.08, 10, 10);
      for (let i = 0; i < paveCount; i++) {
        const ang = (i / paveCount) * Math.PI * 2;
        let px = Math.cos(ang) * paveRadius;
        let pz = Math.sin(ang) * paveRadius;
        if (this.currentCut === 'oval') {
          px *= 1.28;
          pz *= 0.88;
        } else if (this.currentCut === 'marquise') {
          px *= 0.85;
          pz *= 1.45;
        } else if (['emerald-cut', 'asscher', 'radiant', 'princess'].includes(this.currentCut)) {
          const ewMax = (this.currentCut === 'emerald-cut' || this.currentCut === 'radiant' ? 3.2 : 3.4) * scale * 0.65;
          const elMax = (this.currentCut === 'emerald-cut' ? 4.2 : this.currentCut === 'radiant' ? 4.0 : 3.4) * scale * 0.65;
          px = Math.sign(Math.cos(ang)) * Math.min(Math.abs(px * 1.15), ewMax);
          pz = Math.sign(Math.sin(ang)) * Math.min(Math.abs(pz * 1.15), elMax);
        } else if (['cushion', 'elongated-cushion'].includes(this.currentCut)) {
          const cwMax = (this.currentCut === 'elongated-cushion' ? 3.2 : 3.5) * scale * 0.65;
          const clMax = (this.currentCut === 'elongated-cushion' ? 4.1 : 3.5) * scale * 0.65;
          px = Math.sign(Math.cos(ang)) * Math.min(Math.abs(px * 1.1), cwMax);
          pz = Math.sign(Math.sin(ang)) * Math.min(Math.abs(pz * 1.1), clMax);
        }
        const paveStone = new THREE.Mesh(paveGeom, this.materials.pave || this.materials.gem);
        paveStone.position.set(px, collarY, pz);
        this.headGroup.add(paveStone);
      }

      // Cathedral Bridge connecting shank shoulders
      const bridgeGeom = new THREE.CylinderGeometry(0.55, 0.65, 4.8, 16);
      bridgeGeom.rotateZ(Math.PI / 2);
      this.bridgeMesh = new THREE.Mesh(bridgeGeom, this.materials.shank);
      this.bridgeMesh.position.set(0, 10.45, 0);
      this.headGroup.add(this.bridgeMesh);

      // Prongs Group
      this.prongsMeshGroup = new THREE.Group();
      const prongRadius = 0.32 * (1.0 + (scale - 1.0) * 0.45);
      const tipRadius = prongRadius * 1.06;

      if (this.currentCut === 'emerald-cut') {
        this.buildEmeraldCutProngs(scale, stoneRadius, girdleY, collarY, prongRadius, tipRadius);
      } else if (this.currentCut === 'asscher') {
        this.buildCornerProngs(scale, 3.4 * scale, 3.4 * scale, 0.9 * scale, girdleY, collarY, prongRadius, tipRadius);
      } else if (this.currentCut === 'radiant') {
        this.buildCornerProngs(scale, 3.2 * scale, 4.0 * scale, 0.7 * scale, girdleY, collarY, prongRadius, tipRadius);
      } else if (this.currentCut === 'princess') {
        this.buildCornerProngs(scale, 3.3 * scale, 3.3 * scale, 0.25 * scale, girdleY, collarY, prongRadius, tipRadius);
      } else if (this.currentCut === 'cushion') {
        this.buildCornerProngs(scale, 3.4 * scale, 3.4 * scale, 0.8 * scale, girdleY, collarY, prongRadius, tipRadius);
      } else if (this.currentCut === 'elongated-cushion') {
        this.buildCornerProngs(scale, 3.2 * scale, 4.1 * scale, 0.8 * scale, girdleY, collarY, prongRadius, tipRadius);
      } else if (this.currentCut === 'marquise') {
        this.buildMarquiseProngs(scale, stoneRadius, girdleY, collarY, prongRadius, tipRadius);
      } else if (this.currentCut === 'heart') {
        this.buildHeartProngs(scale, stoneRadius, girdleY, collarY, prongRadius, tipRadius);
      } else if (this.currentCut === 'hexagonal') {
        this.buildHexagonalProngs(scale, stoneRadius, girdleY, collarY, prongRadius, tipRadius);
      } else if (this.currentCut === 'oval') {
        this.buildOvalProngs(scale, stoneRadius, girdleY, collarY, prongRadius, tipRadius);
      } else if (this.currentCut === 'pear') {
        this.buildPearProngs(scale, stoneRadius, girdleY, collarY, prongRadius, tipRadius);
      } else {
        this.buildRoundProngs(scale, stoneRadius, girdleY, collarY, prongRadius, tipRadius);
      }

      this.headGroup.add(this.prongsMeshGroup);
      this.ringGroup.add(this.headGroup);
    }

    buildRoundProngs(scale, stoneRadius, girdleY, collarY, prongRadius, tipRadius) {
      const prongCount = 6;
      const crownH = stoneRadius * 0.34;
      const collarRadius = stoneRadius * 0.72;

      for (let i = 0; i < prongCount; i++) {
        const ang = (i / prongCount) * Math.PI * 2 + Math.PI / 6;
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);

        const rBase = collarRadius * 0.90;
        const p0 = new THREE.Vector3(cosA * rBase, collarY - 0.20, sinA * rBase);

        const rMid = (rBase + stoneRadius) * 0.50 + prongRadius * 0.35;
        const p1 = new THREE.Vector3(cosA * rMid, (collarY + girdleY) * 0.52, sinA * rMid);

        const rGirdle = stoneRadius + prongRadius * 0.65;
        const p2 = new THREE.Vector3(cosA * rGirdle, girdleY, sinA * rGirdle);

        const rTip = stoneRadius - prongRadius * 0.28;
        const tipY = girdleY + crownH * 0.45;
        const p3 = new THREE.Vector3(cosA * rTip, tipY, sinA * rTip);

        const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
        const prongGeom = new THREE.TubeGeometry(curve, 18, prongRadius, 12, false);
        const prongMesh = new THREE.Mesh(prongGeom, this.materials.head);
        this.prongsMeshGroup.add(prongMesh);

        // Rounded claw tip securely clamping upper crown facet
        const tipGeom = new THREE.SphereGeometry(tipRadius, 12, 12);
        const tipMesh = new THREE.Mesh(tipGeom, this.materials.head);
        tipMesh.position.copy(p3);
        tipMesh.scale.set(1.0, 0.75, 1.0);
        this.prongsMeshGroup.add(tipMesh);
      }
    }

    buildOvalProngs(scale, stoneRadius, girdleY, collarY, prongRadius, tipRadius) {
      const crownH = stoneRadius * 0.34;
      const a = stoneRadius * 1.28;
      const b = stoneRadius * 0.88;

      const angles = [
        Math.PI * 0.20,
        Math.PI * 0.50,
        Math.PI * 0.80,
        Math.PI * 1.20,
        Math.PI * 1.50,
        Math.PI * 1.80
      ];

      for (let i = 0; i < angles.length; i++) {
        const phi = angles[i];
        const cosP = Math.cos(phi);
        const sinP = Math.sin(phi);

        const gx = a * cosP;
        const gz = b * sinP;

        const nxRaw = b * cosP;
        const nzRaw = a * sinP;
        const nLen = Math.sqrt(nxRaw * nxRaw + nzRaw * nzRaw) || 1;
        const nx = nxRaw / nLen;
        const nz = nzRaw / nLen;

        const p0 = new THREE.Vector3(gx * 0.62, collarY - 0.20, gz * 0.62);
        const p1 = new THREE.Vector3(gx * 0.82 + nx * prongRadius * 0.35, (collarY + girdleY) * 0.52, gz * 0.82 + nz * prongRadius * 0.35);
        const p2 = new THREE.Vector3(gx + nx * prongRadius * 0.65, girdleY, gz + nz * prongRadius * 0.65);
        const tipY = girdleY + crownH * 0.45;
        const p3 = new THREE.Vector3(gx - nx * prongRadius * 0.28, tipY, gz - nz * prongRadius * 0.28);

        const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
        const prongGeom = new THREE.TubeGeometry(curve, 18, prongRadius, 12, false);
        const prongMesh = new THREE.Mesh(prongGeom, this.materials.head);
        this.prongsMeshGroup.add(prongMesh);

        const tipGeom = new THREE.SphereGeometry(tipRadius, 12, 12);
        const tipMesh = new THREE.Mesh(tipGeom, this.materials.head);
        tipMesh.position.copy(p3);
        tipMesh.scale.set(1.0, 0.75, 1.0);
        this.prongsMeshGroup.add(tipMesh);
      }
    }

    buildEmeraldCutProngs(scale, stoneRadius, girdleY, collarY, prongRadius, tipRadius) {
      const w = 3.2 * scale;
      const l = 4.2 * scale;
      const gc = 0.8 * scale;
      const crownH = 1.1 * scale;

      const corners = [
        { x: w - gc * 0.5, z: l - gc * 0.5 },
        { x: -w + gc * 0.5, z: l - gc * 0.5 },
        { x: -w + gc * 0.5, z: -l + gc * 0.5 },
        { x: w - gc * 0.5, z: -l + gc * 0.5 }
      ];

      for (let i = 0; i < corners.length; i++) {
        const c = corners[i];
        const nx = Math.sign(c.x) * 0.7071;
        const nz = Math.sign(c.z) * 0.7071;

        const p0 = new THREE.Vector3(c.x * 0.60, collarY - 0.20, c.z * 0.60);
        const p1 = new THREE.Vector3(c.x * 0.82 + nx * prongRadius * 0.35, (collarY + girdleY) * 0.52, c.z * 0.82 + nz * prongRadius * 0.35);
        const p2 = new THREE.Vector3(c.x + nx * prongRadius * 0.65, girdleY, c.z + nz * prongRadius * 0.65);
        const tipY = girdleY + crownH * 0.45;
        const p3 = new THREE.Vector3(c.x - nx * prongRadius * 0.28, tipY, c.z - nz * prongRadius * 0.28);

        const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
        const prongGeom = new THREE.TubeGeometry(curve, 18, prongRadius * 1.08, 12, false);
        const prongMesh = new THREE.Mesh(prongGeom, this.materials.head);
        this.prongsMeshGroup.add(prongMesh);

        // Classic French corner claw tab
        const tipGeom = new THREE.SphereGeometry(tipRadius * 1.15, 12, 12);
        const tipMesh = new THREE.Mesh(tipGeom, this.materials.head);
        tipMesh.position.copy(p3);
        tipMesh.scale.set(1.15, 0.70, 1.15);
        this.prongsMeshGroup.add(tipMesh);
      }
    }

    buildPearProngs(scale, stoneRadius, girdleY, collarY, prongRadius, tipRadius) {
      const crownH = stoneRadius * 0.34;
      const r = stoneRadius;
      const w = r * 0.95;

      const pointsConfig = [
        // Pointed Tip V-Prong
        { x: 0, z: r * 1.25, nx: 0, nz: 1.0, isVTip: true },
        // Upper Shoulders
        { x: w * 0.72, z: r * 0.45, nx: 0.86, nz: 0.50 },
        { x: -w * 0.72, z: r * 0.45, nx: -0.86, nz: 0.50 },
        // Mid Belly
        { x: w * 0.92, z: -r * 0.28, nx: 0.86, nz: -0.50 },
        { x: -w * 0.92, z: -r * 0.28, nx: -0.86, nz: -0.50 },
        // Rounded Bottom Lobe
        { x: 0, z: -r * 0.95, nx: 0, nz: -1.0 }
      ];

      for (let i = 0; i < pointsConfig.length; i++) {
        const pt = pointsConfig[i];
        const p0 = new THREE.Vector3(pt.x * 0.62, collarY - 0.20, pt.z * 0.62);
        const p1 = new THREE.Vector3(pt.x * 0.82 + pt.nx * prongRadius * 0.35, (collarY + girdleY) * 0.52, pt.z * 0.82 + pt.nz * prongRadius * 0.35);
        const p2 = new THREE.Vector3(pt.x + pt.nx * prongRadius * 0.65, girdleY, pt.z + pt.nz * prongRadius * 0.65);
        const tipY = girdleY + crownH * 0.45;
        const p3 = new THREE.Vector3(pt.x - pt.nx * prongRadius * 0.28, tipY, pt.z - pt.nz * prongRadius * 0.28);

        const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
        const prongGeom = new THREE.TubeGeometry(curve, 18, prongRadius, 12, false);
        const prongMesh = new THREE.Mesh(prongGeom, this.materials.head);
        this.prongsMeshGroup.add(prongMesh);

        const tipGeom = new THREE.SphereGeometry(pt.isVTip ? tipRadius * 1.25 : tipRadius, 12, 12);
        const tipMesh = new THREE.Mesh(tipGeom, this.materials.head);
        tipMesh.position.copy(p3);
        tipMesh.scale.set(pt.isVTip ? 1.3 : 1.0, 0.75, 1.0);
        this.prongsMeshGroup.add(tipMesh);
      }
    }

    buildCornerProngs(scale, halfW, halfL, gc, girdleY, collarY, prongRadius, tipRadius) {
      const crownH = 1.1 * scale;
      const corners = [
        { x: halfW - gc * 0.5, z: halfL - gc * 0.5 },
        { x: -halfW + gc * 0.5, z: halfL - gc * 0.5 },
        { x: -halfW + gc * 0.5, z: -halfL + gc * 0.5 },
        { x: halfW - gc * 0.5, z: -halfL + gc * 0.5 }
      ];

      for (let i = 0; i < corners.length; i++) {
        const c = corners[i];
        const nx = Math.sign(c.x) * 0.7071;
        const nz = Math.sign(c.z) * 0.7071;

        const p0 = new THREE.Vector3(c.x * 0.60, collarY - 0.20, c.z * 0.60);
        const p1 = new THREE.Vector3(c.x * 0.82 + nx * prongRadius * 0.35, (collarY + girdleY) * 0.52, c.z * 0.82 + nz * prongRadius * 0.35);
        const p2 = new THREE.Vector3(c.x + nx * prongRadius * 0.65, girdleY, c.z + nz * prongRadius * 0.65);
        const tipY = girdleY + crownH * 0.45;
        const p3 = new THREE.Vector3(c.x - nx * prongRadius * 0.28, tipY, c.z - nz * prongRadius * 0.28);

        const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
        const prongGeom = new THREE.TubeGeometry(curve, 18, prongRadius * 1.08, 12, false);
        const prongMesh = new THREE.Mesh(prongGeom, this.materials.head);
        this.prongsMeshGroup.add(prongMesh);

        const tipGeom = new THREE.SphereGeometry(tipRadius * 1.15, 12, 12);
        const tipMesh = new THREE.Mesh(tipGeom, this.materials.head);
        tipMesh.position.copy(p3);
        tipMesh.scale.set(1.15, 0.70, 1.15);
        this.prongsMeshGroup.add(tipMesh);
      }
    }

    buildMarquiseProngs(scale, stoneRadius, girdleY, collarY, prongRadius, tipRadius) {
      const crownH = stoneRadius * 0.34;
      const r = stoneRadius;
      const pointsConfig = [
        { x: 0, z: r * 1.45, nx: 0, nz: 1.0, isVTip: true },
        { x: 0, z: -r * 1.45, nx: 0, nz: -1.0, isVTip: true },
        { x: r * 0.75, z: r * 0.45, nx: 0.88, nz: 0.45 },
        { x: -r * 0.75, z: r * 0.45, nx: -0.88, nz: 0.45 },
        { x: r * 0.75, z: -r * 0.45, nx: 0.88, nz: -0.45 },
        { x: -r * 0.75, z: -r * 0.45, nx: -0.88, nz: -0.45 }
      ];

      for (let i = 0; i < pointsConfig.length; i++) {
        const pt = pointsConfig[i];
        const p0 = new THREE.Vector3(pt.x * 0.62, collarY - 0.20, pt.z * 0.62);
        const p1 = new THREE.Vector3(pt.x * 0.82 + pt.nx * prongRadius * 0.35, (collarY + girdleY) * 0.52, pt.z * 0.82 + pt.nz * prongRadius * 0.35);
        const p2 = new THREE.Vector3(pt.x + pt.nx * prongRadius * 0.65, girdleY, pt.z + pt.nz * prongRadius * 0.65);
        const tipY = girdleY + crownH * 0.45;
        const p3 = new THREE.Vector3(pt.x - pt.nx * prongRadius * 0.28, tipY, pt.z - pt.nz * prongRadius * 0.28);

        const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
        const prongGeom = new THREE.TubeGeometry(curve, 18, prongRadius, 12, false);
        const prongMesh = new THREE.Mesh(prongGeom, this.materials.head);
        this.prongsMeshGroup.add(prongMesh);

        const tipGeom = new THREE.SphereGeometry(pt.isVTip ? tipRadius * 1.25 : tipRadius, 12, 12);
        const tipMesh = new THREE.Mesh(tipGeom, this.materials.head);
        tipMesh.position.copy(p3);
        tipMesh.scale.set(pt.isVTip ? 1.3 : 1.0, 0.75, 1.0);
        this.prongsMeshGroup.add(tipMesh);
      }
    }

    buildHeartProngs(scale, stoneRadius, girdleY, collarY, prongRadius, tipRadius) {
      const crownH = stoneRadius * 0.34;
      const r = stoneRadius;
      const pointsConfig = [
        { x: 0, z: -r * 1.18, nx: 0, nz: -1.0, isVTip: true },
        { x: r * 0.80, z: r * 0.35, nx: 0.85, nz: 0.45 },
        { x: -r * 0.80, z: r * 0.35, nx: -0.85, nz: 0.45 },
        { x: r * 0.48, z: r * 0.72, nx: 0.60, nz: 0.80 },
        { x: -r * 0.48, z: r * 0.72, nx: -0.60, nz: 0.80 }
      ];

      for (let i = 0; i < pointsConfig.length; i++) {
        const pt = pointsConfig[i];
        const p0 = new THREE.Vector3(pt.x * 0.62, collarY - 0.20, pt.z * 0.62);
        const p1 = new THREE.Vector3(pt.x * 0.82 + pt.nx * prongRadius * 0.35, (collarY + girdleY) * 0.52, pt.z * 0.82 + pt.nz * prongRadius * 0.35);
        const p2 = new THREE.Vector3(pt.x + pt.nx * prongRadius * 0.65, girdleY, pt.z + pt.nz * prongRadius * 0.65);
        const tipY = girdleY + crownH * 0.45;
        const p3 = new THREE.Vector3(pt.x - pt.nx * prongRadius * 0.28, tipY, pt.z - pt.nz * prongRadius * 0.28);

        const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
        const prongGeom = new THREE.TubeGeometry(curve, 18, prongRadius, 12, false);
        const prongMesh = new THREE.Mesh(prongGeom, this.materials.head);
        this.prongsMeshGroup.add(prongMesh);

        const tipGeom = new THREE.SphereGeometry(pt.isVTip ? tipRadius * 1.25 : tipRadius, 12, 12);
        const tipMesh = new THREE.Mesh(tipGeom, this.materials.head);
        tipMesh.position.copy(p3);
        tipMesh.scale.set(pt.isVTip ? 1.3 : 1.0, 0.75, 1.0);
        this.prongsMeshGroup.add(tipMesh);
      }
    }

    buildHexagonalProngs(scale, stoneRadius, girdleY, collarY, prongRadius, tipRadius) {
      const crownH = stoneRadius * 0.34;
      const r = stoneRadius;

      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI / 3.0) + Math.PI / 6.0;
        const gx = r * Math.cos(ang);
        const gz = r * Math.sin(ang);
        const nx = Math.cos(ang);
        const nz = Math.sin(ang);

        const p0 = new THREE.Vector3(gx * 0.62, collarY - 0.20, gz * 0.62);
        const p1 = new THREE.Vector3(gx * 0.82 + nx * prongRadius * 0.35, (collarY + girdleY) * 0.52, gz * 0.82 + nz * prongRadius * 0.35);
        const p2 = new THREE.Vector3(gx + nx * prongRadius * 0.65, girdleY, gz + nz * prongRadius * 0.65);
        const tipY = girdleY + crownH * 0.45;
        const p3 = new THREE.Vector3(gx - nx * prongRadius * 0.28, tipY, gz - nz * prongRadius * 0.28);

        const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
        const prongGeom = new THREE.TubeGeometry(curve, 18, prongRadius, 12, false);
        const prongMesh = new THREE.Mesh(prongGeom, this.materials.head);
        this.prongsMeshGroup.add(prongMesh);

        const tipGeom = new THREE.SphereGeometry(tipRadius, 12, 12);
        const tipMesh = new THREE.Mesh(tipGeom, this.materials.head);
        tipMesh.position.copy(p3);
        tipMesh.scale.set(1.0, 0.75, 1.0);
        this.prongsMeshGroup.add(tipMesh);
      }
    }

    buildCenterGemstone() {
      if (this.centerGemGroup) {
        this.ringGroup.remove(this.centerGemGroup);
        this.centerGemGroup.traverse(child => {
          if (child.isMesh && child.geometry) child.geometry.dispose();
        });
      }

      this.centerGemGroup = new THREE.Group();

      const scale = this.getCaratScale(this.currentCarat);
      const baseRadius = 3.55;
      const stoneRadius = baseRadius * scale;
      let geom;

      if (this.currentCut === 'emerald-cut') {
        geom = this.createEmeraldCutGeometry(3.2 * scale, 4.2 * scale);
      } else if (this.currentCut === 'asscher') {
        geom = this.createEmeraldCutGeometry(3.4 * scale, 3.4 * scale);
      } else if (this.currentCut === 'radiant') {
        geom = this.createRadiantCutGeometry(3.2 * scale, 4.0 * scale);
      } else if (this.currentCut === 'princess') {
        geom = this.createPrincessCutGeometry(3.3 * scale);
      } else if (this.currentCut === 'cushion') {
        geom = this.createCushionCutGeometry(3.55 * scale, 3.55 * scale);
      } else if (this.currentCut === 'elongated-cushion') {
        geom = this.createCushionCutGeometry(3.2 * scale, 4.2 * scale);
      } else if (this.currentCut === 'oval') {
        geom = this.createOvalCutGeometry(stoneRadius);
      } else if (this.currentCut === 'marquise') {
        geom = this.createMarquiseCutGeometry(stoneRadius);
      } else if (this.currentCut === 'pear') {
        geom = this.createPearCutGeometry(stoneRadius);
      } else if (this.currentCut === 'heart') {
        geom = this.createHeartCutGeometry(stoneRadius);
      } else if (this.currentCut === 'hexagonal') {
        geom = this.createHexagonalCutGeometry(stoneRadius);
      } else {
        geom = this.createRoundBrilliantGeometry(stoneRadius);
      }

      const gemMesh = new THREE.Mesh(geom, this.materials.gem);
      this.centerGemGroup.add(gemMesh);

      // Facet edge highlights
      const edgesGeom = new THREE.EdgesGeometry(geom, 12);
      const wire = new THREE.LineSegments(edgesGeom, this.materials.wire);
      this.centerGemGroup.add(wire);

      const girdleY = 14.1 + (scale - 1.0) * 1.25;
      this.centerGemGroup.position.set(0, girdleY, 0);

      this.ringGroup.add(this.centerGemGroup);
    }

    createRoundBrilliantGeometry(radius = 3.55) {
      const hCrown = radius * 0.34;
      const hPavilion = radius * 0.88;
      const rTable = radius * 0.56;
      const tGirdle = radius * 0.05;

      const yGirdleTop = tGirdle / 2.0;
      const yGirdleBot = -tGirdle / 2.0;
      const yTable = yGirdleTop + hCrown;
      const yCulet = yGirdleBot - hPavilion;
      const yStar = yGirdleTop + hCrown * 0.58;
      const rStar = radius * 0.76;

      const triVertices = [];
      function addTri(ax, ay, az, bx, by, bz, cx, cy, cz) {
        triVertices.push(ax, ay, az, bx, by, bz, cx, cy, cz);
      }

      const tablePts = [];
      for (let i = 0; i < 8; i++) {
        const ang = (i * 2 + 1) * Math.PI / 8.0;
        tablePts.push({ x: rTable * Math.cos(ang), y: yTable, z: rTable * Math.sin(ang) });
      }

      const crownMainPts = [];
      for (let i = 0; i < 8; i++) {
        const ang = (i * 2) * Math.PI / 8.0;
        crownMainPts.push({ x: rStar * Math.cos(ang), y: yStar, z: rStar * Math.sin(ang) });
      }

      const girdleUpPts = [];
      for (let i = 0; i < 16; i++) {
        const ang = i * Math.PI / 8.0;
        girdleUpPts.push({ x: radius * Math.cos(ang), y: yGirdleTop, z: radius * Math.sin(ang) });
      }

      const girdleLowPts = [];
      for (let i = 0; i < 16; i++) {
        const ang = i * Math.PI / 8.0;
        girdleLowPts.push({ x: radius * Math.cos(ang), y: yGirdleBot, z: radius * Math.sin(ang) });
      }

      const pavBreakPts = [];
      const yPavBreak = yGirdleBot - hPavilion * 0.45;
      const rPavBreak = radius * 0.52;
      for (let i = 0; i < 8; i++) {
        const ang = (i * 2 + 1) * Math.PI / 8.0;
        pavBreakPts.push({ x: rPavBreak * Math.cos(ang), y: yPavBreak, z: rPavBreak * Math.sin(ang) });
      }

      // 1. Table Facets
      for (let i = 0; i < 8; i++) {
        const next = (i + 1) % 8;
        addTri(
          0, yTable, 0,
          tablePts[i].x, tablePts[i].y, tablePts[i].z,
          tablePts[next].x, tablePts[next].y, tablePts[next].z
        );
      }

      // 2. Star Facets
      for (let i = 0; i < 8; i++) {
        const tPrev = tablePts[(i - 1 + 8) % 8];
        const tCur = tablePts[i];
        const cm = crownMainPts[i];
        addTri(cm.x, cm.y, cm.z, tCur.x, tCur.y, tCur.z, tPrev.x, tPrev.y, tPrev.z);
      }

      // 3. Bezel / Kite & Upper Girdle
      for (let i = 0; i < 8; i++) {
        const cm = crownMainPts[i];
        const guMid = girdleUpPts[i * 2];
        const guLeft = girdleUpPts[(i * 2 - 1 + 16) % 16];
        const guRight = girdleUpPts[(i * 2 + 1) % 16];

        addTri(cm.x, cm.y, cm.z, guLeft.x, guLeft.y, guLeft.z, guMid.x, guMid.y, guMid.z);
        addTri(cm.x, cm.y, cm.z, guMid.x, guMid.y, guMid.z, guRight.x, guRight.y, guRight.z);
      }

      // 4. Girdle Facets
      for (let i = 0; i < 16; i++) {
        const next = (i + 1) % 16;
        addTri(
          girdleUpPts[i].x, girdleUpPts[i].y, girdleUpPts[i].z,
          girdleLowPts[i].x, girdleLowPts[i].y, girdleLowPts[i].z,
          girdleUpPts[next].x, girdleUpPts[next].y, girdleUpPts[next].z
        );
        addTri(
          girdleUpPts[next].x, girdleUpPts[next].y, girdleUpPts[next].z,
          girdleLowPts[i].x, girdleLowPts[i].y, girdleLowPts[i].z,
          girdleLowPts[next].x, girdleLowPts[next].y, girdleLowPts[next].z
        );
      }

      // 5. Lower Girdle Facets
      for (let i = 0; i < 8; i++) {
        const pm = pavBreakPts[i];
        const gl1 = girdleLowPts[i * 2];
        const glMid = girdleLowPts[i * 2 + 1];
        const gl2 = girdleLowPts[(i * 2 + 2) % 16];

        addTri(pm.x, pm.y, pm.z, glMid.x, glMid.y, glMid.z, gl1.x, gl1.y, gl1.z);
        addTri(pm.x, pm.y, pm.z, gl2.x, gl2.y, gl2.z, glMid.x, glMid.y, glMid.z);
      }

      // 6. Pavilion Mains to Culet
      for (let i = 0; i < 8; i++) {
        const next = (i + 1) % 8;
        addTri(
          0, yCulet, 0,
          pavBreakPts[next].x, pavBreakPts[next].y, pavBreakPts[next].z,
          pavBreakPts[i].x, pavBreakPts[i].y, pavBreakPts[i].z
        );
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(triVertices, 3));
      geom.computeVertexNormals();
      return geom;
    }

    createEmeraldCutGeometry(w = 3.2, l = 4.2) {
      const sRef = w / 3.2;
      const hCrown = 1.1 * sRef;
      const hPav = 2.8 * sRef;
      const yTable = hCrown;
      const yGirdle = 0;
      const yCulet = -hPav;

      const triVertices = [];
      function addTri(ax, ay, az, bx, by, bz, cx, cy, cz) {
        triVertices.push(ax, ay, az, bx, by, bz, cx, cy, cz);
      }

      const tw = w * 0.6;
      const tl = l * 0.6;
      const tc = 0.5 * sRef;
      const tablePts = [
        { x: -tw + tc, y: yTable, z: -tl },
        { x: tw - tc, y: yTable, z: -tl },
        { x: tw, y: yTable, z: -tl + tc },
        { x: tw, y: yTable, z: tl - tc },
        { x: tw - tc, y: yTable, z: tl },
        { x: -tw + tc, y: yTable, z: tl },
        { x: -tw, y: yTable, z: tl - tc },
        { x: -tw, y: yTable, z: -tl + tc }
      ];

      const gc = 0.8 * sRef;
      const girdlePts = [
        { x: -w + gc, y: yGirdle, z: -l },
        { x: w - gc, y: yGirdle, z: -l },
        { x: w, y: yGirdle, z: -l + gc },
        { x: w, y: yGirdle, z: l - gc },
        { x: w - gc, y: yGirdle, z: l },
        { x: -w + gc, y: yGirdle, z: l },
        { x: -w, y: yGirdle, z: l - gc },
        { x: -w, y: yGirdle, z: -l + gc }
      ];

      // 1. Table Fan
      for (let i = 1; i < 7; i++) {
        addTri(
          tablePts[0].x, tablePts[0].y, tablePts[0].z,
          tablePts[i].x, tablePts[i].y, tablePts[i].z,
          tablePts[i + 1].x, tablePts[i + 1].y, tablePts[i + 1].z
        );
      }

      // 2. Crown Trapezoids (Two triangles per side)
      for (let i = 0; i < 8; i++) {
        const next = (i + 1) % 8;
        addTri(
          tablePts[i].x, tablePts[i].y, tablePts[i].z,
          girdlePts[i].x, girdlePts[i].y, girdlePts[i].z,
          girdlePts[next].x, girdlePts[next].y, girdlePts[next].z
        );
        addTri(
          tablePts[i].x, tablePts[i].y, tablePts[i].z,
          girdlePts[next].x, girdlePts[next].y, girdlePts[next].z,
          tablePts[next].x, tablePts[next].y, tablePts[next].z
        );
      }

      // 3. Pavilion Mains to Keel
      const keelZ1 = -l * 0.4;
      const keelZ2 = l * 0.4;

      for (let i = 0; i < 8; i++) {
        const next = (i + 1) % 8;
        const midZ = (girdlePts[i].z + girdlePts[next].z) / 2;
        const targetZ = midZ < 0 ? keelZ1 : keelZ2;
        addTri(
          0, yCulet, targetZ,
          girdlePts[next].x, girdlePts[next].y, girdlePts[next].z,
          girdlePts[i].x, girdlePts[i].y, girdlePts[i].z
        );
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(triVertices, 3));
      geom.computeVertexNormals();
      return geom;
    }

    createOvalCutGeometry(radius = 3.55) {
      const geom = this.createRoundBrilliantGeometry(radius);
      geom.scale(1.28, 1.0, 0.88);
      return geom;
    }

    createPearCutGeometry(radius = 3.55) {
      const geom = this.createRoundBrilliantGeometry(radius);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        const zNorm = (z / radius);
        if (zNorm > 0) {
          const taper = 1.0 - zNorm * 0.55;
          x *= Math.max(0.2, taper);
          z *= 1.25;
        } else {
          z *= 0.95;
        }

        pos.setXYZ(i, x, y, z);
      }
      geom.computeVertexNormals();
      return geom;
    }

    createPrincessCutGeometry(size = 3.3) {
      const hCrown = size * 0.35;
      const hPav = size * 0.90;
      const yTable = hCrown;
      const yGirdle = 0;
      const yCulet = -hPav;
      const tw = size * 0.58;

      const triVertices = [];
      function addTri(ax, ay, az, bx, by, bz, cx, cy, cz) {
        triVertices.push(ax, ay, az, bx, by, bz, cx, cy, cz);
      }

      addTri(-tw, yTable, -tw, tw, yTable, -tw, tw, yTable, tw);
      addTri(-tw, yTable, -tw, tw, yTable, tw, -tw, yTable, tw);

      const corners = [
        { x: -size, z: -size },
        { x: size, z: -size },
        { x: size, z: size },
        { x: -size, z: size }
      ];
      const tableCorners = [
        { x: -tw, z: -tw },
        { x: tw, z: -tw },
        { x: tw, z: tw },
        { x: -tw, z: tw }
      ];

      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        addTri(
          tableCorners[i].x, yTable, tableCorners[i].z,
          corners[next].x, yGirdle, corners[next].z,
          corners[i].x, yGirdle, corners[i].z
        );
        addTri(
          tableCorners[i].x, yTable, tableCorners[i].z,
          tableCorners[next].x, yTable, tableCorners[next].z,
          corners[next].x, yGirdle, corners[next].z
        );
      }

      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        addTri(
          0, yCulet, 0,
          corners[next].x, yGirdle, corners[next].z,
          corners[i].x, yGirdle, corners[i].z
        );
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(triVertices, 3));
      geom.computeVertexNormals();
      return geom;
    }

    createRadiantCutGeometry(w = 3.2, l = 4.0) {
      const sRef = w / 3.2;
      const hCrown = 1.15 * sRef;
      const hPav = 2.8 * sRef;
      const yTable = hCrown;
      const yGirdle = 0;
      const yCulet = -hPav;

      const triVertices = [];
      function addTri(ax, ay, az, bx, by, bz, cx, cy, cz) {
        triVertices.push(ax, ay, az, bx, by, bz, cx, cy, cz);
      }

      const tw = w * 0.58;
      const tl = l * 0.58;
      const tc = 0.5 * sRef;
      const tablePts = [
        { x: -tw + tc, y: yTable, z: -tl },
        { x: tw - tc, y: yTable, z: -tl },
        { x: tw, y: yTable, z: -tl + tc },
        { x: tw, y: yTable, z: tl - tc },
        { x: tw - tc, y: yTable, z: tl },
        { x: -tw + tc, y: yTable, z: tl },
        { x: -tw, y: yTable, z: tl - tc },
        { x: -tw, y: yTable, z: -tl + tc }
      ];

      const gc = 0.75 * sRef;
      const girdlePts = [
        { x: -w + gc, y: yGirdle, z: -l },
        { x: w - gc, y: yGirdle, z: -l },
        { x: w, y: yGirdle, z: -l + gc },
        { x: w, y: yGirdle, z: l - gc },
        { x: w - gc, y: yGirdle, z: l },
        { x: -w + gc, y: yGirdle, z: l },
        { x: -w, y: yGirdle, z: l - gc },
        { x: -w, y: yGirdle, z: -l + gc }
      ];

      for (let i = 1; i < 7; i++) {
        addTri(
          tablePts[0].x, tablePts[0].y, tablePts[0].z,
          tablePts[i].x, tablePts[i].y, tablePts[i].z,
          tablePts[i + 1].x, tablePts[i + 1].y, tablePts[i + 1].z
        );
      }

      for (let i = 0; i < 8; i++) {
        const next = (i + 1) % 8;
        addTri(
          tablePts[i].x, tablePts[i].y, tablePts[i].z,
          girdlePts[i].x, girdlePts[i].y, girdlePts[i].z,
          girdlePts[next].x, girdlePts[next].y, girdlePts[next].z
        );
        addTri(
          tablePts[i].x, tablePts[i].y, tablePts[i].z,
          girdlePts[next].x, girdlePts[next].y, girdlePts[next].z,
          tablePts[next].x, tablePts[next].y, tablePts[next].z
        );
      }

      const keelZ1 = -l * 0.35;
      const keelZ2 = l * 0.35;
      for (let i = 0; i < 8; i++) {
        const next = (i + 1) % 8;
        const midZ = (girdlePts[i].z + girdlePts[next].z) / 2;
        const targetZ = midZ < 0 ? keelZ1 : keelZ2;
        addTri(
          0, yCulet, targetZ,
          girdlePts[next].x, girdlePts[next].y, girdlePts[next].z,
          girdlePts[i].x, girdlePts[i].y, girdlePts[i].z
        );
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(triVertices, 3));
      geom.computeVertexNormals();
      return geom;
    }

    createCushionCutGeometry(w = 3.55, l = 3.55) {
      const baseR = (w + l) / 2.0;
      const geom = this.createRoundBrilliantGeometry(baseR);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        const r = Math.sqrt(x * x + z * z);
        if (r > 0.001) {
          const angle = Math.atan2(z, x);
          const cos4 = Math.cos(angle * 4.0);
          const cushionFactor = 1.0 + 0.12 * (1.0 - cos4);
          x *= (w / baseR) * cushionFactor;
          z *= (l / baseR) * cushionFactor;
        }
        pos.setXYZ(i, x, y, z);
      }
      geom.computeVertexNormals();
      return geom;
    }

    createMarquiseCutGeometry(radius = 3.55) {
      const geom = this.createRoundBrilliantGeometry(radius);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        const normZ = Math.abs(z / radius);
        x *= Math.max(0.12, 1.0 - Math.pow(normZ, 1.35) * 0.78);
        x *= 0.88;
        z *= 1.45;

        pos.setXYZ(i, x, y, z);
      }
      geom.computeVertexNormals();
      return geom;
    }

    createHeartCutGeometry(radius = 3.55) {
      const geom = this.createRoundBrilliantGeometry(radius);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        const normX = x / radius;
        const normZ = z / radius;

        let newX = x * 1.08;
        let newZ = z;
        if (z > 0) {
          const cleft = Math.exp(-Math.pow(normX * 2.8, 2)) * radius * 0.42;
          newZ -= cleft;
          newX *= 1.0 + normZ * 0.15;
        } else {
          const t = -z / radius;
          newX *= Math.max(0.08, 1.0 - t * 0.72);
          newZ *= 1.18;
        }
        pos.setXYZ(i, newX, y, newZ);
      }
      geom.computeVertexNormals();
      return geom;
    }

    createHexagonalCutGeometry(radius = 3.55) {
      const sRef = radius / 3.55;
      const hCrown = 1.1 * sRef;
      const hPav = 2.8 * sRef;
      const yTable = hCrown;
      const yGirdle = 0;
      const yCulet = -hPav;

      const triVertices = [];
      function addTri(ax, ay, az, bx, by, bz, cx, cy, cz) {
        triVertices.push(ax, ay, az, bx, by, bz, cx, cy, cz);
      }

      const rTable = radius * 0.62;
      const tablePts = [];
      const girdlePts = [];

      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI / 3.0) + Math.PI / 6.0;
        tablePts.push({ x: rTable * Math.cos(ang), y: yTable, z: rTable * Math.sin(ang) });
        girdlePts.push({ x: radius * Math.cos(ang), y: yGirdle, z: radius * Math.sin(ang) });
      }

      for (let i = 1; i < 5; i++) {
        addTri(
          tablePts[0].x, tablePts[0].y, tablePts[0].z,
          tablePts[i].x, tablePts[i].y, tablePts[i].z,
          tablePts[i + 1].x, tablePts[i + 1].y, tablePts[i + 1].z
        );
      }

      for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;
        addTri(
          tablePts[i].x, tablePts[i].y, tablePts[i].z,
          girdlePts[i].x, girdlePts[i].y, girdlePts[i].z,
          girdlePts[next].x, girdlePts[next].y, girdlePts[next].z
        );
        addTri(
          tablePts[i].x, tablePts[i].y, tablePts[i].z,
          girdlePts[next].x, girdlePts[next].y, girdlePts[next].z,
          tablePts[next].x, tablePts[next].y, tablePts[next].z
        );
      }

      for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;
        addTri(
          0, yCulet, 0,
          girdlePts[next].x, girdlePts[next].y, girdlePts[next].z,
          girdlePts[i].x, girdlePts[i].y, girdlePts[i].z
        );
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(triVertices, 3));
      geom.computeVertexNormals();
      return geom;
    }

    setMetal(metalId) {
      this.currentMetal = metalId;
      const p = this.materials.metalPalettes[metalId] || this.materials.metalPalettes['yellow-gold'];

      this.materials.shank.color.setHex(p.shank);
      this.materials.shank.metalness = p.metalness;
      this.materials.shank.roughness = p.roughness;
      this.materials.shank.clearcoat = p.clearcoat || 0.08;
      this.materials.shank.envMapIntensity = p.envMapIntensity || 1.5;

      this.materials.head.color.setHex(p.head);
      this.materials.head.metalness = 0.98;
      this.materials.head.roughness = 0.07;
      if (this.bridgeMesh) {
        this.bridgeMesh.material.color.setHex(p.shank);
      }
    }

    setGem(gemId) {
      this.currentGem = gemId;
      const p = this.materials.gemPalettes[gemId] || this.materials.gemPalettes['diamond'];

      this.materials.gem.color.setHex(p.color);
      this.materials.gem.metalness = p.metalness !== undefined ? p.metalness : 0.02;
      this.materials.gem.roughness = p.roughness !== undefined ? p.roughness : 0.02;
      this.materials.gem.clearcoat = p.clearcoat !== undefined ? p.clearcoat : 0.5;
      this.materials.gem.envMapIntensity = p.envMapIntensity || 1.3;
      this.materials.gem.needsUpdate = true;

      this.materials.wire.color.setHex(p.wire);
      this.materials.wire.opacity = p.wireOpacity || 0.30;
      this.materials.wire.needsUpdate = true;
    }

    setCut(cutId) {
      this.currentCut = cutId;
      this.buildCenterGemstone();
      this.buildSettingHead();
      this.setMetal(this.currentMetal);
    }

    setCarat(caratVal) {
      this.currentCarat = parseFloat(caratVal) || 2.5;
      this.buildCenterGemstone();
      this.buildSettingHead();
      this.setMetal(this.currentMetal);
    }

    updateCameraFraming(forceResetAngle = false) {
      if (!this.camera || !this.container) return;
      const rect = this.container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w <= 0 || h <= 0) return;

      const aspect = w / h;
      this.camera.aspect = aspect;

      // Visual center of the entire ring assembly in 3D perspective projection
      // Calibrated to (0, 1.2, 0) so the top table facet and bottom of the ring shank
      // are symmetrically framed with comfortable luxury margin.
      const targetCenter = new THREE.Vector3(0, 1.2, 0);

      // Normalized reference hero direction vector from target (0, 1.2, 0) to elevated beauty angle
      const baseDirection = new THREE.Vector3(16, 18.8, 36).normalize();
      
      // Base distance calibrated so the complete ring appears visually smaller inside the viewer (~50-55% occupancy),
      // providing ample, comfortable empty space around the ring on all laptops, monitors, and projectors.
      const baseDistance = 82.0;
      const refAspect = 1.15;

      // Adaptive Distance & Auto Zoom Adjustment:
      // In Three.js PerspectiveCamera, vertical FOV is fixed at 34°.
      // As screen width narrows (phones, portrait tablets, 4:3 projectors),
      // we dynamically pull the camera back so the ring always has comfortable empty space
      // and zero edge clipping.
      let distanceFactor = 1.0;
      if (aspect < refAspect) {
        // Horizontally constrained displays (phones, portrait tablets, 4:3 projectors)
        distanceFactor = refAspect / aspect;
        if (aspect < 0.85) {
          distanceFactor *= 1.05;
        }
      } else if (aspect > 1.8) {
        // Vertically constrained displays (mobile landscape, ultra-wide monitors)
        distanceFactor = 1.06;
      }

      const targetDistance = baseDistance * distanceFactor;

      if (this.controls) {
        this.controls.target.copy(targetCenter);
        // Tightly clamp zoom so the ring can NEVER become excessively zoomed in
        // or excessively small, maintaining a consistent comfortable size on all displays
        this.controls.minDistance = targetDistance * 0.84;
        this.controls.maxDistance = targetDistance * 1.22;

        if (forceResetAngle || !this.hasUserInteractedOnce) {
          this.camera.position.copy(targetCenter).addScaledVector(baseDirection, targetDistance);
        } else {
          // If user rotated ring, preserve their angle of view and smoothly adjust distance
          const curDir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
          if (curDir.lengthSq() > 0.001) {
            curDir.normalize();
            this.camera.position.copy(targetCenter).addScaledVector(curDir, targetDistance);
          } else {
            this.camera.position.copy(targetCenter).addScaledVector(baseDirection, targetDistance);
          }
        }
        this.controls.update();
      } else {
        this.camera.position.copy(targetCenter).addScaledVector(baseDirection, targetDistance);
        this.camera.lookAt(targetCenter);
      }

      this.camera.updateProjectionMatrix();
    }

    handleResizeDebounced() {
      this.onResize();
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.onResize();
      }, 50);
    }

    onResize() {
      if (!this.renderer || !this.camera || !this.container) return;
      const rect = this.container.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w <= 0 || h <= 0) return;

      this.updateCameraFraming(false);
      this.renderer.setSize(w, h, false);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      if (!this.isUserInteracting && this.ringGroup) {
        this.ringGroup.rotation.y += 0.003;
      }

      if (this.controls) {
        this.controls.update();
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  let jewelry3DViewer = null;

  function init3DCanvasEngine() {
    try {
      jewelry3DViewer = new Jewelry3DViewer('bespoke-3d-canvas', 'bespoke-3d-wrapper', 'canvas-3d-loader');
      window.jewelryViewer = jewelry3DViewer;
    } catch (e) {
      console.error('Failed to initialize 3D Jewelry Engine:', e);
    }
  }

  function render3DFrame() {
    // Retained as backward-compatibility alias
  }

  function updateBespokePrice() {
    const b = state.bespoke;
    const metal = STORE.bespokeStudio.metals.find(m => m.id === b.metalId) || STORE.bespokeStudio.metals[0];
    const gem = STORE.bespokeStudio.gems.find(g => g.id === b.gemId) || STORE.bespokeStudio.gems[0];
    const totalPrice = metal.priceBase + (gem.pricePerCarat * b.caratWeight);

    const priceEl = document.getElementById('bespoke-calc-price');
    if (priceEl) priceEl.textContent = formatPrice(totalPrice);
  }

  function updateBespokeOptionHighlight(attrName, selectedVal, isNumeric = false) {
    document.querySelectorAll(`[${attrName}]`).forEach(b => {
      const rawVal = b.getAttribute(attrName);
      const isMatch = isNumeric
        ? Math.abs(parseFloat(rawVal) - parseFloat(selectedVal)) < 0.01
        : rawVal === selectedVal;

      // Remove solid black override
      b.classList.remove('bg-[#1D1815]', 'text-white');

      if (isMatch) {
        b.classList.remove('bg-[#F6EBDD]', 'border-[#E8E3D8]');
        b.classList.add('bg-white', 'border-[#C5A674]', 'ring-2', 'ring-[#8A6B38]', 'shadow-sm');
      } else {
        b.classList.remove('bg-white', 'border-[#C5A674]', 'ring-2', 'ring-[#8A6B38]', 'shadow-sm');
        b.classList.add('bg-[#F6EBDD]', 'border-[#E8E3D8]');
      }

      const span = b.querySelector('span:last-child') || b.querySelector('span');
      if (span) {
        if (isMatch) {
          span.classList.remove('text-[#1D1815]', 'font-medium');
          span.classList.add('text-[#8A6B38]', 'font-semibold');
        } else {
          span.classList.remove('text-[#8A6B38]', 'font-semibold');
          span.classList.add('text-[#1D1815]', 'font-medium');
        }
      }
    });
  }

  window.setBespokeMetal = (metalId) => {
    state.bespoke.metalId = metalId;
    updateBespokeOptionHighlight('data-bespoke-metal', metalId);
    updateBespokePrice();
    if (window.jewelryViewer) window.jewelryViewer.setMetal(metalId);
  };

  window.setBespokeGem = (gemId) => {
    state.bespoke.gemId = gemId;
    updateBespokeOptionHighlight('data-bespoke-gem', gemId);
    updateBespokePrice();
    if (window.jewelryViewer) window.jewelryViewer.setGem(gemId);
  };

  window.setBespokeCut = (cutId) => {
    state.bespoke.cutId = cutId;
    updateBespokeOptionHighlight('data-bespoke-cut', cutId);
    if (window.jewelryViewer) window.jewelryViewer.setCut(cutId);
  };

  window.setBespokeCarat = (caratVal) => {
    state.bespoke.caratWeight = parseFloat(caratVal);
    updateBespokeOptionHighlight('data-bespoke-carat', caratVal, true);
    const displayEl = document.getElementById('bespoke-carat-display');
    if (displayEl) displayEl.textContent = `${state.bespoke.caratWeight.toFixed(2)} ct`;
    updateBespokePrice();
    if (window.jewelryViewer) window.jewelryViewer.setCarat(caratVal);
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
        "addressLocality": "Mumbai",
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
  renderCart();
  renderWishlist();
  init3DCanvasEngine();
  setBespokeMetal(state.bespoke.metalId || 'yellow-gold');
  setBespokeGem(state.bespoke.gemId || 'diamond');
  setBespokeCut(state.bespoke.cutId || 'round');
  setBespokeCarat(state.bespoke.caratWeight || 2.5);
  updateBespokePrice();
  handleRoute();
});
