// HOUSE OF JEWELUX - Client Application & SPA Routing Logic V2
// Master Build: Fine 925 Silver Focus, Private Founder Studio, 3D Jewellery Engine, WhatsApp Concierge & Multilingual Architecture

document.addEventListener('DOMContentLoaded', () => {
  // 1. Load Dynamic Store State (Persisted in LocalStorage)
    let STORE = typeof JEWELUX_STORAGE !== 'undefined' ? JEWELUX_STORAGE.getStoreData() : JEWELUX_DATA;
  if (STORE && STORE.storeConfig) {
    STORE.storeConfig.whatsappNumber = '+916377061020';
    // Sanitize legacy plaintext pins from previous sessions
    if (STORE.storeConfig.founderPin === '1985' || STORE.storeConfig.founderPIN === '1985') {
      delete STORE.storeConfig.founderPin;
      delete STORE.storeConfig.founderPIN;
    }
    if (!STORE.storeConfig.founderPinHash) {
      STORE.storeConfig.founderPinHash = 'a20a2b7bb0842d5cf8a0c06c626421fd51ec103925c1819a51271f2779afa730';
    }
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
    activeStudioTab: 'overview'
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
    'care': document.getElementById('view-care'),
    'studio': document.getElementById('view-studio')
  };

  function switchView(targetName, scrollToTop = true) {
    const targetEl = views[targetName];
    if (!targetEl) return;

    // Prevent redundant DOM reflows if the view is already active
    const isAlreadyActive = targetEl.classList.contains('active') && !targetEl.classList.contains('hidden');

    if (!isAlreadyActive) {
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
      injectJsonLdSchema(targetName);
    }

    if (scrollToTop && !isAlreadyActive) {
      window.scrollTo(0, 0);
    }
  }
  window.switchView = switchView;

  function handleRoute() {
    const rawHash = (window.location.hash || '').replace('#', '').trim();
    const hash = rawHash.split('?')[0];

    // Founder Studio / Admin
    if (hash === 'studio' || hash === 'admin') {
      switchView('studio');
      renderStudio();
      return;
    }

    // Direct multi-page destinations
    if (hash === 'about') {
      window.location.href = '/about';
      return;
    }

    if (hash === 'silver' || hash === 'silver-edit' || hash === 'jewelux-collection') {
      window.location.href = '/jewelux-collection';
      return;
    }

    if (hash === 'couples' || hash === 'couples-bridal') {
      window.location.href = '/couples-bridal';
      return;
    }

    // Category routes
    const categoryRoutes = {
      'rings': 'rings',
      'earrings': 'earrings',
      'necklaces': 'necklaces',
      'bracelets': 'bracelets',
      'brooches': 'brooches',
      'temple-jewellery': 'temple-jewellery',
      'fine-jewellery': 'fine-jewellery',
      'nature-wildlife': 'nature-wildlife',
      'nature-inspired': 'nature-wildlife',
      'indian-jewellery': 'nature-wildlife',
      'gold-vault': 'gold-vault'
    };

    if (categoryRoutes[hash]) {
      window.location.href = '/shop?cat=' + categoryRoutes[hash];
      return;
    }

    // Product detail modal / view
    if (hash.startsWith('product-')) {
      const prodId = hash.replace('product-', '');
      const product = STORE.products.find(p => p.id === prodId);
      if (product) {
        state.activeProduct = product;
        switchView('product-detail', true);
        renderProductDetail(product);
      } else {
        window.location.href = '/shop';
      }
      return;
    }

    // Safely redirect legacy 3D bespoke customizer links to shop
    if (hash === 'bespoke-studio' || hash === 'studio-ring' || hash === '3d-studio') {
      window.location.href = '/shop';
      return;
    }

    // Homepage section anchors - keep view-home active and smoothly scroll to the element
    const homeAnchorMap = {
      'home': 'home',
      'hero': 'home',
      'top': 'home',
      'collections': 'collections',
      'collections-section': 'collections',
      'temple': 'temple',
      'temple-showcase-section': 'temple',
      'best-sellers': 'best-sellers',
      'iconic-masterpieces': 'best-sellers',
      'minimalist': 'minimalist',
      'minimalist-showcase-section': 'minimalist',
      'craftsmanship': 'craftsmanship',
      'home-craftsmanship-story': 'craftsmanship',
      'founder': 'founder',
      'home-founder-spotlight': 'founder',
      'new-arrivals': 'new-arrivals',
      'home-upcoming-collections': 'new-arrivals'
    };

    if (homeAnchorMap[hash]) {
      switchView('home', false);
      const targetId = homeAnchorMap[hash];
      if (targetId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const targetEl = document.getElementById(targetId) || document.getElementById(hash);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
      return;
    }

    // Policy and legal views
    if (views[hash]) {
      switchView(hash);
      return;
    }

    // Default: home view without unwanted scroll reset
    switchView('home', false);
  }

  window.addEventListener('hashchange', handleRoute);

  // Global smooth navigation interceptor for header logo and internal anchors
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;

    // Logo / Home click when on home page
    if (href === '/' || href === '/#home' || href === '#home') {
      const isHomePath = window.location.pathname === '/' || window.location.pathname.endsWith('index.html') || window.location.pathname === '';
      if (isHomePath) {
        e.preventDefault();
        switchView('home', false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (window.location.hash) {
          history.pushState(null, '', window.location.pathname || '/');
        }
      }
    }
  });

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

    const silverPieces = STORE.products.filter(p => p.isSilver && !p.name.toLowerCase().includes('couple') && !p.name.toLowerCase().includes('bridal') && !p.name.toLowerCase().includes('mangalsutra')).slice(0, 4);
    container.innerHTML = silverPieces.map(createProductCardHTML).join('');
  }

    function renderShopCategoryPills() {
    const pillsContainer = document.getElementById('shop-category-pills');
    if (!pillsContainer) return;
    
    const categories = (STORE && STORE.categories) ? STORE.categories : [
      { id: 'all', name: 'All Jewels', icon: '✦', isPrimary: false },
      { id: 'nature-wildlife', name: 'Nature & Wildlife Jewellery', icon: '🌿', isPrimary: true },
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
    } else if (state.activeCategory === 'nature-wildlife' || state.activeCategory === 'nature-inspired' || state.activeCategory === 'indian-jewellery') {
      filtered = filtered.filter(p => p.mainCategoryId === 'nature-wildlife' || p.mainCategoryId === 'nature-inspired' || p.mainCategoryId === 'indian-jewellery');
    } else if (state.activeCategory === 'fine-jewellery') {
      filtered = filtered.filter(p => p.mainCategoryId === 'fine-jewellery');
    } else if (state.activeCategory === 'temple' || state.activeCategory === 'temple-jewellery') {
      filtered = filtered.filter(p => p.mainCategoryId === 'temple-jewellery' || p.category === 'temple');
    } else if (state.activeCategory === 'micron-gold' || state.activeCategory === 'gold-jewellery' || state.activeCategory === 'gold-vault') {
      filtered = filtered.filter(p => p.mainCategoryId === 'micron-gold' || (p.finishing && p.finishing.includes('Gold')));
    } else if (state.activeCategory === 'silver' || state.activeCategory === 'silver-jewellery') {
      filtered = filtered.filter(p => p.mainCategoryId === 'silver-jewellery' || (p.finishing && p.finishing.includes('Rhodium')));
    } else if (state.activeCategory === 'diamond-jewellery') {
      filtered = filtered.filter(p => p.mainCategoryId === 'diamond-jewellery' || (p.stone && p.stone.toLowerCase().includes('diamond')));
    } else if (state.activeCategory === 'heritage-jewellery' || state.activeCategory === 'heritage-traditional' || state.activeCategory === 'couples') {
      filtered = filtered.filter(p => p.mainCategoryId === 'heritage-jewellery' || p.collection === 'eternal-couples');
    } else if (state.activeCategory === 'sacred-motifs' || state.activeCategory === 'spiritual-jewellery') {
      filtered = filtered.filter(p => p.mainCategoryId === 'temple-jewellery' || (p.description && (p.description.toLowerCase().includes('sacred') || p.description.toLowerCase().includes('mandala') || p.description.toLowerCase().includes('vow'))));
    } else if (state.activeCategory === 'animal-motifs' || state.activeCategory === 'animal-jewellery') {
      filtered = filtered.filter(p => (p.description && (p.description.toLowerCase().includes('peacock') || p.description.toLowerCase().includes('falcon') || p.description.toLowerCase().includes('butterfly') || p.description.toLowerCase().includes('dragonfly') || p.description.toLowerCase().includes('tiger') || p.description.toLowerCase().includes('feather'))));
    } else if (state.activeCategory === 'contemporary-jewellery') {
      filtered = filtered.filter(p => p.mainCategoryId === 'contemporary-jewellery' || p.category === 'bracelets' || p.category === 'earrings');
    } else if (state.activeCategory === 'minimalist-jewellery' || state.activeCategory === 'minimalist-fine-jewellery' || state.activeCategory === 'contemporary-pave' || state.activeCategory === 'haute-joaillerie') {
      filtered = filtered.filter(p => p.mainCategoryId === 'minimalist-jewellery' || p.mainCategoryId === 'fine-jewellery' || Boolean(p.inspiration));
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
      : `<div class="col-span-full py-16 text-center text-[#766B5E]">No pieces found in this curation. Explore <a href="#nature-wildlife" onclick="filterShopCategory('nature-wildlife')" class="text-[#8A6B38] underline">Nature & Wildlife Jewellery</a>.</div>`;

    // Highlight active category tab in shop filter bar
    document.querySelectorAll('[data-cat-pill]').forEach(btn => {
      const cat = btn.getAttribute('data-cat-pill');
      if (cat === state.activeCategory) {
        btn.classList.add('bg-[#1D1815]', 'text-white');
        btn.classList.remove('bg-white', 'text-[#766B5E]', 'bg-[#F6EBDD]', 'text-[#8A6B38]');
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
    const wildlifeAliases = ['nature-wildlife', 'nature-inspired', 'indian-jewellery'];
    document.querySelectorAll('[data-cat-pill]').forEach(btn => {
      const pill = btn.getAttribute('data-cat-pill');
      const isMatch = pill === cat || (wildlifeAliases.includes(cat) && wildlifeAliases.includes(pill));
      if (isMatch) {
        btn.classList.add('bg-[#1D1815]', 'text-white');
        btn.classList.remove('bg-white', 'text-[#766B5E]', 'bg-[#F6EBDD]', 'text-[#8A6B38]');
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
    const breadcrumbEl = document.getElementById('pdp-breadcrumb-name');
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

    if (breadcrumbEl) breadcrumbEl.textContent = p.name;
    if (titleEl) titleEl.textContent = p.name;
    if (priceEl) priceEl.textContent = formatPrice(p.priceUSD);
    if (descEl) descEl.textContent = p.description;
    if (metalEl) metalEl.textContent = p.metal || p.material || 'BIS Hallmarked 925 Sterling Silver';
    if (badgeEl) badgeEl.textContent = p.badge || p.tag || 'Atelier Masterpiece';
    if (heroImg) {
      heroImg.src = p.image;
      heroImg.alt = p.name;
    }

    const specCategory = document.getElementById('pdp-spec-category');
    const specDesignedIn = document.getElementById('pdp-spec-designed');
    const specCraftedIn = document.getElementById('pdp-spec-crafted');
    const specMaterial = document.getElementById('pdp-spec-material');
    const specFinishing = document.getElementById('pdp-spec-finishing');
    const specInspirationRow = document.getElementById('pdp-spec-inspiration-row');
    const specInspiration = document.getElementById('pdp-spec-inspiration');
    const specCertRow = document.getElementById('pdp-spec-cert-row');
    const specCert = document.getElementById('pdp-spec-cert');
    const specDimensions = document.getElementById('pdp-spec-dimensions');

    if (specCategory) specCategory.textContent = p.mainCategory || 'Indian Fine Jewellery';
    if (specDesignedIn) specDesignedIn.textContent = p.designedIn || 'India';
    if (specCraftedIn) specCraftedIn.textContent = p.craftedIn || 'India';
    if (specMaterial) specMaterial.textContent = p.material || 'BIS Hallmarked 925 Sterling Silver';
    if (specFinishing) specFinishing.textContent = p.finishing || 'Anti-Tarnish Rhodium Plating';

    if (specInspirationRow) {
      if (p.inspiration && p.inspiration.trim() !== '') {
        specInspirationRow.classList.remove('hidden');
        specInspirationRow.style.display = 'flex';
        if (specInspiration) specInspiration.textContent = p.inspiration;
      } else {
        specInspirationRow.classList.add('hidden');
        specInspirationRow.style.display = 'none';
      }
    }
    
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
          <p class="text-xs text-[#766B5E] max-w-xs mx-auto">Explore our signature Jewelux Collection and bespoke couple bands.</p>
          <button onclick="closeCartDrawer(); window.location.href = '/jewelux-collection';" class="btn-luxury-primary py-2.5 px-6 text-[10px]">
            Explore The Jewelux Collection
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
      resultsContainer.innerHTML = '<p class="text-xs text-[#9E9386] py-6 text-center">Type a keyword to discover certified 925 sterling silver, couple bands, mangalsutras, or temple jewels...</p>';
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
    showToast('Private Atelier Consultation requested! Your advisor will reach out.', '⚜️');
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
    if (qvClarity) qvClarity.textContent = p.clarity || 'VVS1 Clarity';
    if (qvCert) qvCert.textContent = p.certificate || 'BIS Hallmarked • Specialist Inspected';

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
      title: 'Sovereign Soirée: High Joaillerie',
      subtitle: 'Mastercrafted fine jewels and luminous gemstones designed for distinguished evenings and private galas.',
      image: 'images/jewelux_nature_wildlife.jpg',
      prodTitle: 'The Empress Emerald-Cut Halo Ring',
      prodId: 'HJ-RNG-003'
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

  // Cryptographic hash helper for Founder Studio authentication
  async function computePinHash(str) {
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
      try {
        const msgBuffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        console.warn('Subtle crypto error:', e);
      }
    }
    return sha256Fallback(str);
  }

  function sha256Fallback(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    let lengthProperty = 'length';
    let i, j;
    let result = '';
    const words = [];
    const asciiBitLength = ascii[lengthProperty] * 8;
    const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << ((3 - (i % 4)) * 8);
    }
    words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
    words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;
    for (i = 0; i < words[lengthProperty]; i += 16) {
      const w = words.slice(i, i + 16);
      const oldHash = hash.slice(0);
      for (j = 0; j < 64; j++) {
        let s0, s1, t1, t2;
        if (j < 16) {
        } else {
          const gamma0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
          const gamma1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
          w[j] = (w[j - 16] + gamma0 + w[j - 7] + gamma1) | 0;
        }
        s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
        const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
        t1 = (hash[7] + s1 + ch + k[j] + w[j]) | 0;
        s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
        const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        t2 = (s0 + maj) | 0;
        hash[7] = hash[6];
        hash[6] = hash[5];
        hash[5] = hash[4];
        hash[4] = (hash[3] + t1) | 0;
        hash[3] = hash[2];
        hash[2] = hash[1];
        hash[1] = hash[0];
        hash[0] = (t1 + t2) | 0;
      }
      for (j = 0; j < 8; j++) {
        hash[j] = (hash[j] + oldHash[j]) | 0;
      }
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }

  const DEFAULT_STUDIO_HASH = 'a20a2b7bb0842d5cf8a0c06c626421fd51ec103925c1819a51271f2779afa730';

  window.verifyStudioPin = async () => {
    const pinInput = document.getElementById('studio-pin-input');
    const enteredPin = pinInput ? pinInput.value.trim() : '';

    if (!enteredPin) {
      showToast('Please enter your Founder passcode.', '⚠️');
      return;
    }

    // Explicitly reject old legacy passcode
    if (enteredPin === '1985') {
      showToast('Invalid Founder PIN passcode.', '⚠️');
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
      }
      return;
    }

    const expectedHash = (STORE.storeConfig && STORE.storeConfig.founderPinHash) || DEFAULT_STUDIO_HASH;
    const enteredHash = await computePinHash(enteredPin);

    if (enteredHash === expectedHash) {
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

  window.saveStudioSecurityConfig = async () => {
    const newPinInput = document.getElementById('studio-newpin-input');
    const newPin = newPinInput ? newPinInput.value.trim() : '';
    if (newPin.length >= 4) {
      const newHash = await computePinHash(newPin);
      STORE.storeConfig.founderPinHash = newHash;
      delete STORE.storeConfig.founderPin;
      delete STORE.storeConfig.founderPIN;
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
      { q: 'Is your 925 Sterling Silver genuine and hallmarked?', a: 'Every piece is stamped with genuine BIS 925 sterling silver and finished in anti-tarnish rhodium or micron gold plating.' },
      { q: 'Do creations include certificates of authenticity?', a: 'Yes, all our solitaires and stones are carefully selected by our specialists, accompanied by an atelier authenticity dossier, with official BIS Hallmarking on all 925 sterling silver settings.' }
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
      { id: 'INQ-103', date: '12 Sep 2026', name: 'Kabir Varma', piece: 'The Geometric Pavé Cascade Necklace', value: '$280', status: 'Dispatched' }
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
      piece: 'Bespoke Bridal Suite & 925 Tennis Bracelet',
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

  // ================= MEGA MENU / CATALOGUE DROPDOWN CONTROLLER =================
  function initMegaMenu() {
    const groups = document.querySelectorAll('.dropdown-group');
    if (!groups.length) return;

    groups.forEach(group => {
      const trigger = group.querySelector('a, button');
      const menu = group.querySelector('.dropdown-menu');
      if (!trigger || !menu) return;

      let closeTimer = null;

      function openMenu() {
        clearTimeout(closeTimer);
        group.classList.add('is-open');
        menu.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }

      function closeMenu(immediate = false) {
        clearTimeout(closeTimer);
        if (immediate) {
          group.classList.remove('is-open');
          menu.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          closeTimer = setTimeout(() => {
            group.classList.remove('is-open');
            menu.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
          }, 220);
        }
      }

      // Desktop hover bridge
      group.addEventListener('mouseenter', openMenu);
      group.addEventListener('mouseleave', (e) => {
        if (e.relatedTarget && menu.contains(e.relatedTarget)) {
          clearTimeout(closeTimer);
          return;
        }
        closeMenu(false);
      });

      menu.addEventListener('mouseenter', () => {
        clearTimeout(closeTimer);
        openMenu();
      });

      menu.addEventListener('mouseleave', (e) => {
        if (e.relatedTarget && group.contains(e.relatedTarget)) {
          clearTimeout(closeTimer);
          return;
        }
        closeMenu(false);
      });

      // Touch & Click toggle
      trigger.addEventListener('pointerup', (e) => {
        if (e.pointerType === 'touch') {
          if (!menu.classList.contains('is-open')) {
            e.preventDefault();
            e.stopPropagation();
            openMenu();
          }
        }
      });

      trigger.addEventListener('click', (e) => {
        if (!menu.classList.contains('is-open')) {
          e.preventDefault();
          openMenu();
        }
      });

      // Close when clicking any link inside the mega menu
      const links = menu.querySelectorAll('a');
      links.forEach(link => {
        link.addEventListener('click', () => {
          closeMenu(true);
        });
      });
    });

    // Global Outside Click listener to close any open dropdowns
    document.addEventListener('click', (e) => {
      groups.forEach(group => {
        if (!group.contains(e.target)) {
          const trigger = group.querySelector('a, button');
          const menu = group.querySelector('.dropdown-menu');
          group.classList.remove('is-open');
          if (menu) menu.classList.remove('is-open');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // Global Escape key listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        groups.forEach(group => {
          const trigger = group.querySelector('a, button');
          const menu = group.querySelector('.dropdown-menu');
          group.classList.remove('is-open');
          if (menu) menu.classList.remove('is-open');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }
  window.initMegaMenu = initMegaMenu;

  // ================= 12. INITIAL BOOTSTRAP =================
  renderAllProductGrids();
  renderCart();
  renderWishlist();
  handleRoute();
  initMegaMenu();
});


// ========================================================
// LOVABLE REFERENCE SUITE HANDLERS & CATALOG LOGIC
// ========================================================

window.toggleMobileMenu = function() {
  const drawer = document.getElementById('mobile-nav-drawer');
  const panel = document.getElementById('mobile-drawer-panel');
  if (!drawer) return;
  const isHidden = drawer.classList.contains('pointer-events-none');
  if (isHidden) {
    drawer.classList.remove('pointer-events-none', 'opacity-0');
    drawer.classList.add('opacity-100');
    if (panel) panel.classList.remove('-translate-x-full');
  } else {
    drawer.classList.add('pointer-events-none', 'opacity-0');
    drawer.classList.remove('opacity-100');
    if (panel) panel.classList.add('-translate-x-full');
  }
};

window.changeCurrency = function(curr) {
  if (!window.appState) return;
  window.appState.currency = curr;
  sessionStorage.setItem('jewelux_currency', curr);
  localStorage.setItem('jewelux_currency', curr);
  document.querySelectorAll('#global-currency-select, #currency-select').forEach(s => s.value = curr);
  
  // Re-render all dynamic views
  if (typeof renderShopCatalog === 'function') renderShopCatalog();
  if (typeof renderAllCollectionGrids === 'function') renderAllCollectionGrids();
  if (typeof renderWishlistPage === 'function') renderWishlistPage();
  if (typeof renderCartPage === 'function') renderCartPage();
  
  // Update static data-price tags on homepage
  document.querySelectorAll('[data-price]').forEach(el => {
    const inr = parseFloat(el.getAttribute('data-price'));
    if (!isNaN(inr)) {
      const usdEquivalent = inr / 83.5;
      el.textContent = formatPrice(usdEquivalent);
    }
  });

  if (typeof showToast === 'function') showToast(`Currency updated to ${curr}`, '✦');
};

window.toggleWishlistItem = function(id) {
  if (!window.appState) return;
  const list = window.appState.wishlist;
  const idx = list.indexOf(id);
  if (idx === -1) {
    list.push(id);
    if (typeof showToast === 'function') showToast('Added to your Wishlist', '♥');
  } else {
    list.splice(idx, 1);
    if (typeof showToast === 'function') showToast('Removed from your Wishlist', '♡');
  }
  localStorage.setItem('jewelux_wishlist', JSON.stringify(list));
  updateBadges();
  if (typeof renderWishlistPage === 'function') renderWishlistPage();
};

window.addToCart = function(id) {
  if (!window.appState) return;
  const cart = window.appState.cart;
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: id, qty: 1 });
  }
  localStorage.setItem('jewelux_cart', JSON.stringify(cart));
  updateBadges();
  if (typeof renderCartPage === 'function') renderCartPage();
  if (typeof showToast === 'function') showToast('Piece added to Shopping Bag', '🛍');
};

function updateBadges() {
  if (!window.appState) return;
  const wCount = window.appState.wishlist ? window.appState.wishlist.length : 0;
  const cCount = window.appState.cart ? window.appState.cart.reduce((sum, item) => sum + item.qty, 0) : 0;
  
  const wBadge = document.getElementById('wishlist-badge-count');
  if (wBadge) wBadge.textContent = wCount;
  
  const cBadge = document.getElementById('cart-badge-count');
  if (cBadge) cBadge.textContent = cCount;
}

window.toggleCartDrawer = function() {
  // If dedicated cart page exists, navigate directly or open bag
  if (window.location.pathname.includes('/cart/')) return;
  window.location.href = (window.location.pathname.includes('/collections/') || window.location.pathname.includes('/shop/') || window.location.pathname.includes('/blog/') || window.location.pathname.includes('/about/') || window.location.pathname.includes('/contact/')) ? '../cart/' : 'cart/';
};

// Render Products on /shop/
function renderShopCatalog() {
  const container = document.getElementById('shop-catalog-grid');
  if (!container || typeof STORE === 'undefined' || !STORE.products) return;

  const selectedMetals = Array.from(document.querySelectorAll('input[name="metal"]:checked')).map(el => el.value);
  const selectedCatEl = document.querySelector('input[name="cat"]:checked');
  const selectedCat = selectedCatEl ? selectedCatEl.value : 'all';
  const inStockOnly = document.getElementById('instock-only') ? document.getElementById('instock-only').checked : false;
  const sortOption = document.getElementById('sort-select') ? document.getElementById('sort-select').value : 'featured';

  let filtered = STORE.products.filter(p => {
    // Metal filter
    if (!selectedMetals.includes('all')) {
      const matchGold = selectedMetals.includes('Gold') && (p.isGold || (p.metal && p.metal.toLowerCase().includes('gold')));
      const matchSilver = selectedMetals.includes('Silver') && (p.isSilver || (p.metal && p.metal.toLowerCase().includes('silver')));
      const matchDiamond = selectedMetals.includes('Diamond') && (p.stone && p.stone.toLowerCase().includes('moissanite') || p.stone && p.stone.toLowerCase().includes('diamond'));
      if (!matchGold && !matchSilver && !matchDiamond) return false;
    }
    // Category filter
    if (selectedCat !== 'all') {
      if (p.category !== selectedCat && p.collection !== selectedCat) return false;
    }
    // Stock filter
    if (inStockOnly && p.stockStatus !== 'In Stock') return false;

    return true;
  });

  // Sort
  if (sortOption === 'price-asc') {
    filtered.sort((a, b) => a.priceUSD - b.priceUSD);
  } else if (sortOption === 'price-desc') {
    filtered.sort((a, b) => b.priceUSD - a.priceUSD);
  } else if (sortOption === 'newest') {
    filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  }

  const countDisplay = document.getElementById('product-count-display');
  if (countDisplay) countDisplay.textContent = `${filtered.length} PIECES`;

  let html = '';
  filtered.forEach(p => {
    const isWish = window.appState && window.appState.wishlist && window.appState.wishlist.includes(p.id);
    const heartFill = isWish ? 'currentColor' : 'none';
    const heartColor = isWish ? 'text-[#581825]' : 'text-[#2E2C29]';
    const prefix = "../";

    html += `
    <article class="group relative" id="${p.id}">
      <div class="block overflow-hidden rounded-sm bg-[#F3EFE8] aspect-square relative">
        <img src="${prefix}${p.image}" alt="${p.name}" loading="lazy" class="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
        ${p.badge ? `<span class="absolute top-2.5 left-2.5 rounded-sm bg-[#581825] px-2 py-0.5 text-[0.58rem] tracking-[0.2em] uppercase text-white font-semibold">${p.badge}</span>` : ''}
        <button type="button" onclick="toggleWishlistItem('${p.id}')" aria-label="Save to wishlist" class="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-[#FCFAF7]/95 ${heartColor} transition-colors hover:text-[#581825] shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="${heartFill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"></path></svg>
        </button>
      </div>
      <div class="mt-3.5 text-center">
        <p class="text-[0.58rem] tracking-[0.24em] uppercase text-[#736E65]">${p.category} · ${p.metal ? p.metal.split('(')[0] : 'Fine Jewellery'}</p>
        <h3 class="mt-1 text-base font-serif text-[#2E2C29] line-clamp-1">
          <span class="link-underline">${p.name}</span>
        </h3>
        <p class="mt-1 text-sm font-medium text-[#2E2C29]">${formatPrice(p.priceUSD)}</p>
        <div class="mt-2.5">
          <button onclick="addToCart('${p.id}')" class="w-full rounded-sm border border-[#581825] py-2 text-[0.62rem] tracking-[0.2em] uppercase text-[#581825] hover:bg-[#581825] hover:text-white transition-colors">
            Add to Bag
          </button>
        </div>
      </div>
    </article>
    `;
  });

  container.innerHTML = html;
}
window.filterProducts = renderShopCatalog;

// Render sub-collection grids
function renderAllCollectionGrids() {
  if (typeof STORE === 'undefined' || !STORE.products) return;

  const mappings = [
    { id: 'collection-grid-gold', filter: p => p.isGold || (p.metal && p.metal.toLowerCase().includes('gold')) },
    { id: 'collection-grid-diamond', filter: p => (p.stone && p.stone.toLowerCase().includes('moissanite')) || (p.category === 'rings') },
    { id: 'collection-grid-silver', filter: p => p.isSilver || (p.collection === 'silver-edit') },
    { id: 'collection-grid-bridal', filter: p => p.collection === 'couples-bridal' || p.category === 'necklaces' },
    { id: 'collection-grid-everyday', filter: p => p.category === 'bracelets' || p.category === 'earrings' },
    { id: 'collection-grid-new', filter: p => p.isNew || p.badge === 'New' || p.badge === 'Bestseller' }
  ];

  mappings.forEach(m => {
    const el = document.getElementById(m.id);
    if (!el) return;
    const items = STORE.products.filter(m.filter).slice(0, 8);
    let html = '';
    items.forEach(p => {
      html += `
      <article class="group relative">
        <div class="block overflow-hidden rounded-sm bg-[#F3EFE8] aspect-square relative">
          <img src="../../${p.image}" alt="${p.name}" loading="lazy" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105">
          <button type="button" onclick="toggleWishlistItem('${p.id}')" aria-label="Save to wishlist" class="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-[#FCFAF7]/95 text-[#2E2C29] transition-colors hover:text-[#581825] shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"></path></svg>
          </button>
        </div>
        <div class="mt-3 text-center">
          <h3 class="mt-1 text-base font-serif text-[#2E2C29] line-clamp-1">${p.name}</h3>
          <p class="mt-1 text-sm font-medium text-[#2E2C29]">${formatPrice(p.priceUSD)}</p>
          <button onclick="addToCart('${p.id}')" class="mt-2 w-full rounded-sm border border-[#581825] py-1.5 text-[0.6rem] tracking-[0.2em] uppercase text-[#581825] hover:bg-[#581825] hover:text-white transition-colors">
            Add to Bag
          </button>
        </div>
      </article>
      `;
    });
    el.innerHTML = html;
  });
}

// Render Dedicated Wishlist Page
function renderWishlistPage() {
  const container = document.getElementById('wishlist-page-grid');
  const emptyEl = document.getElementById('wishlist-empty-state');
  if (!container || !window.appState || typeof STORE === 'undefined') return;

  const wIds = window.appState.wishlist || [];
  if (!wIds.length) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');
  const products = STORE.products.filter(p => wIds.includes(p.id));
  let html = '';
  products.forEach(p => {
    html += `
    <article class="group relative">
      <div class="block overflow-hidden rounded-sm bg-[#F3EFE8] aspect-square relative">
        <img src="../${p.image}" alt="${p.name}" class="h-full w-full object-cover">
        <button onclick="toggleWishlistItem('${p.id}')" class="absolute top-2.5 right-2.5 bg-[#FCFAF7] rounded-full p-1.5 text-[#581825]">
          <svg class="w-4 h-4" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="mt-3 text-center">
        <h3 class="font-serif text-base text-[#2E2C29]">${p.name}</h3>
        <p class="mt-1 text-sm font-medium">${formatPrice(p.priceUSD)}</p>
        <button onclick="addToCart('${p.id}')" class="mt-2.5 w-full rounded-sm bg-[#581825] py-2 text-[0.62rem] tracking-[0.2em] uppercase text-white">
          Move to Bag
        </button>
      </div>
    </article>
    `;
  });
  container.innerHTML = html;
}

// Render Dedicated Cart Page
function renderCartPage() {
  const container = document.getElementById('cart-page-items');
  const totalEl = document.getElementById('cart-page-total');
  if (!container || !window.appState || typeof STORE === 'undefined') return;

  const cart = window.appState.cart || [];
  if (!cart.length) {
    container.innerHTML = '<p class="text-center py-12 font-serif text-lg text-[#736E65]">Your shopping bag is empty.</p>';
    if (totalEl) totalEl.textContent = formatPrice(0);
    return;
  }

  let totalUSD = 0;
  let html = '';
  cart.forEach(item => {
    const prod = STORE.products.find(p => p.id === item.id);
    if (!prod) return;
    totalUSD += (prod.priceUSD * item.qty);
    html += `
    <div class="flex items-center gap-4 py-4 border-b border-[#E5DFD5]">
      <img src="../${prod.image}" alt="${prod.name}" class="w-20 h-20 rounded-sm object-cover bg-[#F3EFE8]">
      <div class="flex-1">
        <h3 class="font-serif text-base text-[#2E2C29]">${prod.name}</h3>
        <p class="text-xs text-[#736E65]">${prod.metal}</p>
        <p class="mt-1 text-sm font-medium text-[#581825]">${formatPrice(prod.priceUSD)}</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs uppercase tracking-wider text-[#736E65]">Qty: ${item.qty}</span>
        <button onclick="removeFromCart('${item.id}')" class="text-xs text-[#736E65] hover:text-[#581825] ml-4 underline">Remove</button>
      </div>
    </div>
    `;
  });

  container.innerHTML = html;
  if (totalEl) totalEl.textContent = formatPrice(totalUSD);
}

window.removeFromCart = function(id) {
  if (!window.appState) return;
  window.appState.cart = window.appState.cart.filter(item => item.id !== id);
  localStorage.setItem('jewelux_cart', JSON.stringify(window.appState.cart));
  updateBadges();
  renderCartPage();
};

window.checkoutViaWhatsApp = function() {
  if (!window.appState || !window.appState.cart.length) {
    alert('Your shopping bag is empty.');
    return;
  }
  let msg = "Hello HOUSE OF JEWELUX Concierge! I would like to place an order for the following pieces:\n\n";
  window.appState.cart.forEach((item, i) => {
    const prod = STORE.products.find(p => p.id === item.id);
    if (prod) {
      msg += `${i+1}. ${prod.name} (Qty: ${item.qty}) - ${formatPrice(prod.priceUSD)}\n`;
    }
  });
  const totalStr = document.getElementById('cart-page-total') ? document.getElementById('cart-page-total').textContent : '';
  msg += `\nTotal: ${totalStr}\n\nPlease confirm delivery timelines and payment gateway link.`;
  window.open(`https://wa.me/916377061020?text=${encodeURIComponent(msg)}`, '_blank');
};


// Robust Multi-Stage Auto-Initializer
function autoInitJeweluxPages() {
  if (typeof updateBadges === 'function') updateBadges();
  if (typeof renderShopCatalog === 'function') renderShopCatalog();
  if (typeof renderAllCollectionGrids === 'function') renderAllCollectionGrids();
  if (typeof renderWishlistPage === 'function') renderWishlistPage();
  if (typeof renderCartPage === 'function') renderCartPage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInitJeweluxPages);
} else {
  autoInitJeweluxPages();
}
window.addEventListener('load', autoInitJeweluxPages);
setTimeout(autoInitJeweluxPages, 100);
setTimeout(autoInitJeweluxPages, 500);



// ========================================================
// HOUSE OF JEWELUX - AI CONCIERGE, WHITE-GLOVE CHECKOUT & CUSTOMER CRM MODULE
// ========================================================

(function() {
  'use strict';

  // Seed default orders & customer data if not present
  if (!localStorage.getItem('jewelux_orders')) {
    const defaultOrders = [
      {
        id: 'HJ-2026-94812',
        date: '2026-10-25',
        customer: {
          name: 'Priyanka Sharma',
          phone: '+91 98201 44521',
          email: 'priyanka.s@example.com',
          address: '402, Royal Palms, Bandra West, Mumbai, Maharashtra - 400050'
        },
        items: [
          { id: 'HJ-RNG-001', name: 'The Celestial Radiance 925 Solitaire Ring', priceUSD: 185, qty: 1 }
        ],
        subtotal: 15448,
        gst: 463,
        discount: 1545,
        total: 14366,
        currency: 'INR',
        paymentMethod: 'Instant UPI (Google Pay)',
        status: 'Confirmed & Insured'
      },
      {
        id: 'HJ-2026-88124',
        date: '2026-10-22',
        customer: {
          name: 'Vikramaditya Rathore',
          phone: '+91 94140 22391',
          email: 'v.rathore@example.com',
          address: '12, Civil Lines, Jaipur, Rajasthan - 302006'
        },
        items: [
          { id: 'HJ-EAR-001', name: 'The Mayura Royal Heritage Jhumkas', priceUSD: 210, qty: 1 },
          { id: 'HJ-BRC-001', name: 'The Kalinga Sacred Elephant Kada', priceUSD: 295, qty: 1 }
        ],
        subtotal: 42168,
        gst: 1265,
        discount: 0,
        total: 43433,
        currency: 'INR',
        paymentMethod: 'Credit Card (RuPay)',
        status: 'Delivered'
      }
    ];
    localStorage.setItem('jewelux_orders', JSON.stringify(defaultOrders));
  }

  if (!localStorage.getItem('jewelux_customers')) {
    const defaultCustomers = [
      {
        name: 'Priyanka Sharma',
        phone: '+91 98201 44521',
        email: 'priyanka.s@example.com',
        birthday: '11-14',
        anniversary: '02-18',
        whatsappOptIn: true,
        totalSpendINR: 14366,
        ordersCount: 1,
        tier: 'Silver Connoisseur',
        points: 718,
        referralCode: 'JEWELUX-PRIYANKA500'
      },
      {
        name: 'Vikramaditya Rathore',
        phone: '+91 94140 22391',
        email: 'v.rathore@example.com',
        birthday: '10-30',
        anniversary: '12-04',
        whatsappOptIn: true,
        totalSpendINR: 43433,
        ordersCount: 1,
        tier: 'Gold Collector',
        points: 2171,
        referralCode: 'JEWELUX-VIKRAM500'
      }
    ];
    localStorage.setItem('jewelux_customers', JSON.stringify(defaultCustomers));
  }

  // 1. AI SHOPPING CONCIERGE ("ARIA")
  function initAIConcierge() {
    if (document.getElementById('ai-concierge-pill')) return;

    // Inject Launcher Pill (Bottom-Left)
    const pill = document.createElement('div');
    pill.id = 'ai-concierge-pill';
    pill.className = 'fixed bottom-5 left-5 z-40 flex items-center gap-2.5 bg-[#581825] border border-[#C5A059]/60 px-4 py-2.5 rounded-full cursor-pointer text-white shadow-xl hover:scale-105 transition-transform duration-300';
    pill.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-[#C5A059] flex items-center justify-center text-[#581825] font-serif font-bold text-xs shrink-0">HJ</div>
      <div class="flex flex-col text-left">
        <span class="text-[0.62rem] tracking-[0.2em] uppercase font-semibold text-[#F2E7D3] leading-none">Jewelux AI Concierge</span>
        <span class="text-[0.55rem] text-[#F3EFE8]/80 leading-tight mt-0.5">Aria · Gemological Guide</span>
      </div>
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1"></span>
    `;
    document.body.appendChild(pill);

    // Inject Chat Window
    const win = document.createElement('div');
    win.id = 'ai-concierge-window';
    win.className = 'fixed bottom-20 left-4 sm:left-6 z-50 w-[360px] sm:w-[400px] max-w-[calc(100vw-32px)] h-[540px] max-h-[82vh] bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl shadow-2xl flex flex-col overflow-hidden';
    win.innerHTML = `
      <!-- Header -->
      <div class="bg-[#581825] p-4 text-white flex items-center justify-between border-b border-[#C5A059]/30">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-[#FCFAF7] border border-[#C5A059] flex items-center justify-center text-[#581825] font-serif font-bold text-sm">HJ</div>
          <div>
            <h3 class="font-serif text-sm font-semibold tracking-wide text-[#FAF7F2]">Aria · Jewelux AI Concierge</h3>
            <p class="text-[0.6rem] text-[#C5A059] flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              Jaipur Atelier Online • BIS 925 Specialist
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <a href="https://wa.me/916377061020?text=Hello%20Aria%2C%20I%20am%20chatting%20with%20the%20AI%20Concierge%20and%20would%20like%20to%20speak%20with%20a%20human%20curator." target="_blank" rel="noopener noreferrer" title="Transfer to Human WhatsApp Concierge" class="text-xs bg-[#C5A059] hover:bg-[#b08b47] text-[#3B0D16] px-2 py-1 rounded text-[0.6rem] font-semibold tracking-wider uppercase transition-colors">
            WhatsApp
          </a>
          <button id="close-ai-concierge" class="text-[#FAF7F2]/70 hover:text-white p-1 text-lg leading-none" aria-label="Close Concierge">&times;</button>
        </div>
      </div>

      <!-- Quick Prompt Chips -->
      <div class="bg-[#F3EFE8] px-3 py-2 border-b border-[#E5DFD5] flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
        <button class="ai-chip" data-prompt="Show me 925 Solitaire Rings">💎 Solitaires</button>
        <button class="ai-chip" data-prompt="What jewellery should I wear for a Sangeet?">🥻 Saree Styling</button>
        <button class="ai-chip" data-prompt="How do I clean and care for 925 silver?">✨ Silver Care</button>
        <button class="ai-chip" data-prompt="Explain BIS 925 Hallmark certification">📜 BIS Hallmark</button>
        <button class="ai-chip" data-prompt="Show gifting jewellery under ₹15,000">🎁 Gifting Under ₹15k</button>
      </div>

      <!-- Messages Stream -->
      <div id="ai-messages-list" class="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
        <div class="ai-bubble-bot p-3 max-w-[90%] space-y-2">
          <p class="leading-relaxed">Namaste! Welcome to <strong>HOUSE OF JEWELUX</strong>. I am Aria, your personal gemological and styling concierge.</p>
          <p class="leading-relaxed text-[#736E65]">You may ask me about our 50 handcrafted 925 sterling silver creations, sacred temple jewellery, styling guides, ring sizing, or care tips.</p>
        </div>
      </div>

      <!-- Input Bar -->
      <form id="ai-concierge-form" class="p-3 bg-[#FAF7F2] border-t border-[#E5DFD5] flex items-center gap-2">
        <input id="ai-user-input" type="text" placeholder="Ask about rings, temple jhumkas, silver care..." class="flex-1 bg-white border border-[#E5DFD5] rounded-full px-4 py-2 text-xs text-[#2E2C29] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#581825]">
        <button type="submit" class="w-8 h-8 rounded-full bg-[#581825] text-white flex items-center justify-center hover:bg-[#3B0D16] transition-colors shrink-0" aria-label="Send query">
          <svg class="w-3.5 h-3.5 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
        </button>
      </form>
    `;
    document.body.appendChild(win);

    // Toggle logic
    pill.addEventListener('click', () => {
      win.classList.toggle('is-active');
      if (win.classList.contains('is-active')) {
        document.getElementById('ai-user-input')?.focus();
      }
    });

    document.getElementById('close-ai-concierge')?.addEventListener('click', () => {
      win.classList.remove('is-active');
    });

    // Chip click handlers
    win.querySelectorAll('.ai-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        sendUserMessage(prompt);
      });
    });

    // Form submit
    document.getElementById('ai-concierge-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('ai-user-input');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      sendUserMessage(text);
    });

    function sendUserMessage(text) {
      const list = document.getElementById('ai-messages-list');
      if (!list) return;

      // Render user bubble
      const uBubble = document.createElement('div');
      uBubble.className = 'ai-bubble-user p-3 max-w-[85%] ml-auto text-left';
      uBubble.textContent = text;
      list.appendChild(uBubble);
      list.scrollTop = list.scrollHeight;

      // Typing indicator
      const typing = document.createElement('div');
      typing.id = 'ai-typing';
      typing.className = 'ai-bubble-bot p-2 max-w-[50%] text-[#736E65] italic text-[0.65rem] flex items-center gap-1.5';
      typing.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-bounce"></span> Aria is consulting the Jaipur Atelier archives...';
      list.appendChild(typing);
      list.scrollTop = list.scrollHeight;

      setTimeout(() => {
        typing.remove();
        const reply = generateAIResponse(text);
        renderBotResponse(reply);
      }, 500);
    }

    function renderBotResponse(reply) {
      const list = document.getElementById('ai-messages-list');
      if (!list) return;

      const botBubble = document.createElement('div');
      botBubble.className = 'ai-bubble-bot p-3.5 max-w-[92%] space-y-2.5';
      botBubble.innerHTML = reply;
      list.appendChild(botBubble);
      list.scrollTop = list.scrollHeight;
    }

    function generateAIResponse(query) {
      const q = query.toLowerCase();
      const prods = (window.STORE && window.STORE.products) ? window.STORE.products : [];

      // 1. Care / Cleaning / Tarnish
      if (q.includes('clean') || q.includes('care') || q.includes('tarnish') || q.includes('store') || q.includes('black')) {
        return `
          <p class="font-semibold text-[#581825]">Atelier 925 Silver Care Ritual:</p>
          <ul class="list-disc pl-4 space-y-1 text-[#736E65]">
            <li><strong>Anti-Tarnish Layer:</strong> Every House of Jewelux piece is electroplated in liquid rhodium or micron gold to prevent oxidation.</li>
            <li><strong>Storage:</strong> Keep pieces in the airtight velvet zip-pouch provided with your acquisition.</li>
            <li><strong>Perfumes:</strong> Always apply lotions and perfumes before wearing your jewellery.</li>
            <li><strong>Wipe:</strong> Use our microfiber polishing cloth after every wear.</li>
          </ul>
          <p class="pt-1 text-[#3B0D16]">We also offer complimentary lifetime ultrasonic cleaning at our Jaipur salon!</p>
        `;
      }

      // 2. BIS Hallmark / Authenticity
      if (q.includes('hallmark') || q.includes('bis') || q.includes('purity') || q.includes('certificate') || q.includes('authentic') || q.includes('gold')) {
        return `
          <p class="font-semibold text-[#581825]">Bureau of Indian Standards (BIS) 925 Certification:</p>
          <p class="leading-relaxed text-[#736E65]">Every silver creation at House of Jewelux is crafted from solid <strong>92.5% pure silver</strong>, stamped with the official BIS 925 Hallmark and our Atelier maker's mark.</p>
          <p class="text-[#736E65]">Our stones are certified D-Flawless laboratory-grown moissanites and fine diamonds, nickel-free and 100% hypoallergenic. Each order arrives with a wax-sealed Certificate of Authenticity.</p>
        `;
      }

      // 3. Styling / Occasions
      if (q.includes('saree') || q.includes('wedding') || q.includes('sangeet') || q.includes('bridal') || q.includes('reception')) {
        const templePieces = prods.filter(p => p.category === 'necklaces' || p.category === 'earrings').slice(0, 2);
        let itemsHtml = templePieces.map(p => `
          <div class="flex items-center gap-2 p-1.5 bg-[#FAF7F2] rounded border border-[#E5DFD5]">
            <img src="${p.image}" class="w-10 h-10 object-cover rounded" alt="${p.name}">
            <div class="flex-1">
              <p class="font-serif font-medium text-[0.7rem] text-[#2E2C29] line-clamp-1">${p.name}</p>
              <p class="text-[0.65rem] text-[#581825] font-semibold">${window.formatPrice ? window.formatPrice(p.priceUSD) : '₹' + Math.round(p.priceUSD * 83.5)}</p>
            </div>
          </div>
        `).join('');

        return `
          <p class="font-semibold text-[#581825]">Royal Occasion & Saree Styling:</p>
          <p class="leading-relaxed text-[#736E65]">For silk Kanjeevarams and wedding lehengas, contrast is paramount. Pair a bold Temple Choker with multi-tier Mayura Jhumkas.</p>
          <div class="space-y-1.5 pt-1">${itemsHtml}</div>
          <a href="collections/bridal/" class="inline-block mt-1 font-semibold text-[#581825] hover:underline">Explore Bridal &amp; Couples Collection &rarr;</a>
        `;
      }

      // 4. Category matching: Rings, Solitaires, Earrings, Necklaces, Bracelets, Brooches
      let matchedCategory = null;
      if (q.includes('ring') || q.includes('solitaire') || q.includes('band')) matchedCategory = 'rings';
      else if (q.includes('earring') || q.includes('jhumka') || q.includes('chandbali') || q.includes('stud')) matchedCategory = 'earrings';
      else if (q.includes('necklace') || q.includes('choker') || q.includes('haar') || q.includes('collar') || q.includes('pendant')) matchedCategory = 'necklaces';
      else if (q.includes('bracelet') || q.includes('cuff') || q.includes('kada')) matchedCategory = 'bracelets';
      else if (q.includes('brooch') || q.includes('pin') || q.includes('kalgi')) matchedCategory = 'brooches';

      // 5. Price filter matching
      let maxPrice = Infinity;
      if (q.includes('under 10') || q.includes('under 10,000') || q.includes('under 10k')) maxPrice = 10000;
      else if (q.includes('under 15') || q.includes('under 15,000') || q.includes('under 15k')) maxPrice = 15000;
      else if (q.includes('under 20') || q.includes('under 20,000') || q.includes('under 20k')) maxPrice = 20000;

      let matchedProducts = prods;
      if (matchedCategory) {
        matchedProducts = matchedProducts.filter(p => p.category === matchedCategory);
      }
      if (maxPrice < Infinity) {
        matchedProducts = matchedProducts.filter(p => (p.priceUSD * 83.5) <= maxPrice);
      }

      if (matchedProducts.length > 0) {
        const top3 = matchedProducts.slice(0, 3);
        let itemsHtml = top3.map(p => `
          <div class="flex items-center gap-2 p-2 bg-[#FAF7F2] rounded border border-[#E5DFD5]">
            <img src="${p.image}" class="w-11 h-11 object-cover rounded bg-[#F3EFE8]" alt="${p.name}">
            <div class="flex-1">
              <p class="font-serif font-medium text-[0.7rem] text-[#2E2C29] line-clamp-1">${p.name}</p>
              <p class="text-[0.62rem] text-[#736E65]">${p.stone || p.metal}</p>
              <p class="text-[0.68rem] text-[#581825] font-semibold mt-0.5">${window.formatPrice ? window.formatPrice(p.priceUSD) : '₹' + Math.round(p.priceUSD * 83.5)}</p>
            </div>
            <button onclick="window.addToCart('${p.id}'); showToast('Added to Shopping Bag', '👑');" class="text-[0.6rem] bg-[#581825] text-white px-2 py-1 rounded hover:opacity-90">
              Acquire
            </button>
          </div>
        `).join('');

        return `
          <p class="font-semibold text-[#581825]">Atelier Recommendations for you:</p>
          <div class="space-y-1.5">${itemsHtml}</div>
          <p class="text-[0.62rem] text-[#736E65] pt-1">Complimentary insured delivery & 15-day exchange included with every order.</p>
        `;
      }

      // Default fallback
      return `
        <p class="leading-relaxed">At House of Jewelux, our artisans in Jaipur hand-finish each piece in solid <strong>BIS 925 Hallmarked Silver</strong>, liquid micron gold, and anti-tarnish rhodium.</p>
        <p class="text-[#736E65] leading-relaxed">May I guide you through our <em>Rings, Earrings, Necklaces, Bracelets</em>, or <em>Haute Brooches</em>? Or would you prefer to connect with Yuvraj Soni on WhatsApp for a custom bespoke commission?</p>
        <div class="pt-1">
          <a href="https://wa.me/916377061020?text=${encodeURIComponent('Hello Concierge, I have a question: ' + query)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-[0.65rem] tracking-wider uppercase font-semibold text-[#581825] hover:underline">
            <span>Ask WhatsApp Concierge directly &rarr;</span>
          </a>
        </div>
      `;
    }
  }

  // 2. WHITE-GLOVE INDIAN CHECKOUT MODAL
  function initCheckoutSystem() {
    if (document.getElementById('checkout-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'checkout-modal';
    modal.className = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto';
    modal.innerHTML = `
      <div class="bg-[#FAF7F2] border border-[#C5A059] rounded-lg max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        <!-- Header -->
        <div class="bg-[#581825] p-5 text-white flex items-center justify-between border-b border-[#C5A059]/40">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-[#FCFAF7] border border-[#C5A059] flex items-center justify-center text-[#581825] font-serif font-bold text-base">HJ</div>
            <div>
              <h2 class="font-serif text-lg font-semibold tracking-wide text-[#FAF7F2]">White-Glove Order Checkout</h2>
              <p class="text-[0.65rem] text-[#C5A059] tracking-widest uppercase">Direct from Jaipur Atelier • Armored Insured Transit</p>
            </div>
          </div>
          <button id="close-checkout-modal-btn" class="text-[#FAF7F2]/70 hover:text-white text-2xl leading-none" aria-label="Close Checkout">&times;</button>
        </div>

        <!-- Scrollable Body -->
        <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          <!-- Step 1: Customer & Delivery Details -->
          <div class="space-y-3">
            <h3 class="text-xs font-serif font-semibold tracking-widest uppercase text-[#581825] pb-1 border-b border-[#E5DFD5]">
              1. Delivery Address &amp; Client Details
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block text-[0.65rem] tracking-widest uppercase text-[#736E65] mb-1">Full Name *</label>
                <input id="chk-name" type="text" required placeholder="e.g. Radhika Singhania" class="w-full bg-white border border-[#E5DFD5] rounded-sm p-2 text-xs text-[#2E2C29] focus:outline-none focus:border-[#581825]">
              </div>
              <div>
                <label class="block text-[0.65rem] tracking-widest uppercase text-[#736E65] mb-1">WhatsApp / Phone *</label>
                <input id="chk-phone" type="tel" required placeholder="+91 98765 43210" class="w-full bg-white border border-[#E5DFD5] rounded-sm p-2 text-xs text-[#2E2C29] focus:outline-none focus:border-[#581825]">
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[0.65rem] tracking-widest uppercase text-[#736E65] mb-1">Email Address *</label>
                <input id="chk-email" type="email" required placeholder="radhika@example.com" class="w-full bg-white border border-[#E5DFD5] rounded-sm p-2 text-xs text-[#2E2C29] focus:outline-none focus:border-[#581825]">
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[0.65rem] tracking-widest uppercase text-[#736E65] mb-1">Delivery Street Address *</label>
                <input id="chk-address" type="text" required placeholder="Flat/Bungalow, Street, Landmark" class="w-full bg-white border border-[#E5DFD5] rounded-sm p-2 text-xs text-[#2E2C29] focus:outline-none focus:border-[#581825]">
              </div>
              <div>
                <label class="block text-[0.65rem] tracking-widest uppercase text-[#736E65] mb-1">City &amp; State *</label>
                <input id="chk-city" type="text" required placeholder="Jaipur, Rajasthan" class="w-full bg-white border border-[#E5DFD5] rounded-sm p-2 text-xs text-[#2E2C29] focus:outline-none focus:border-[#581825]">
              </div>
              <div>
                <label class="block text-[0.65rem] tracking-widest uppercase text-[#736E65] mb-1">PIN Code *</label>
                <input id="chk-pincode" type="text" required placeholder="302001" maxlength="6" class="w-full bg-white border border-[#E5DFD5] rounded-sm p-2 text-xs text-[#2E2C29] focus:outline-none focus:border-[#581825]">
              </div>
            </div>

            <!-- Gift Packaging Toggle -->
            <label class="flex items-start gap-2 pt-2 cursor-pointer text-xs text-[#2E2C29]">
              <input id="chk-gift" type="checkbox" checked class="mt-0.5 rounded text-[#581825]">
              <span>Include complimentary signature royal velvet box, satin ribbon, and wax-sealed BIS Hallmark Certificate.</span>
            </label>
          </div>

          <!-- Step 2: Privilege Coupon -->
          <div class="bg-[#FCFAF7] border border-[#E5DFD5] p-3.5 rounded-sm space-y-2">
            <label class="block text-[0.65rem] tracking-widest uppercase text-[#581825] font-semibold">Have a Privilege Coupon?</label>
            <div class="flex gap-2">
              <input id="chk-coupon" type="text" placeholder="e.g. FIRSTLUX, DIWALI2026, JEWELUX20" class="flex-1 bg-white border border-[#E5DFD5] rounded-sm px-3 py-1.5 text-xs uppercase tracking-wider text-[#2E2C29] focus:outline-none focus:border-[#581825]">
              <button id="chk-apply-coupon" type="button" class="bg-[#581825] text-white px-4 py-1.5 text-xs uppercase tracking-widest font-semibold hover:opacity-90">Apply</button>
            </div>
            <p id="chk-coupon-msg" class="text-[0.65rem] text-[#8C6D37] hidden"></p>
          </div>

          <!-- Step 3: Valuation Breakdown -->
          <div class="bg-[#F3EFE8] border border-[#E5DFD5] p-4 rounded-sm space-y-2 text-xs">
            <div class="flex justify-between text-[#736E65]">
              <span>Acquisition Pieces Subtotal</span>
              <span id="chk-subtotal-val" class="font-medium text-[#2E2C29]">₹0</span>
            </div>
            <div id="chk-discount-row" class="flex justify-between text-emerald-700 hidden">
              <span>Privilege Discount</span>
              <span id="chk-discount-val">-₹0</span>
            </div>
            <div class="flex justify-between text-[#736E65]">
              <span>Precious Metal Tax (3% GST)</span>
              <span id="chk-gst-val" class="font-medium text-[#2E2C29]">₹0</span>
            </div>
            <div class="flex justify-between text-[#736E65]">
              <span>Insured White-Glove Courier</span>
              <span class="font-semibold text-emerald-700">Complimentary (₹0)</span>
            </div>
            <div class="pt-2 border-t border-[#E5DFD5] flex justify-between text-sm font-serif font-bold text-[#581825]">
              <span>Total Valuation Payable</span>
              <span id="chk-total-val" class="text-base text-[#581825]">₹0</span>
            </div>
          </div>

          <!-- Step 4: Payment Method Selection -->
          <div class="space-y-3">
            <h3 class="text-xs font-serif font-semibold tracking-widest uppercase text-[#581825] pb-1 border-b border-[#E5DFD5]">
              2. Select Payment Method
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button type="button" class="payment-tab-btn active p-2.5 rounded-sm text-center font-medium" data-method="upi">Instant UPI / QR</button>
              <button type="button" class="payment-tab-btn p-2.5 rounded-sm text-center font-medium" data-method="card">Cards</button>
              <button type="button" class="payment-tab-btn p-2.5 rounded-sm text-center font-medium" data-method="netbanking">NetBanking</button>
              <button type="button" class="payment-tab-btn p-2.5 rounded-sm text-center font-medium" data-method="cod">Cash on Delivery</button>
            </div>

            <!-- UPI Container -->
            <div id="pay-panel-upi" class="p-4 bg-white border border-[#E5DFD5] rounded-sm space-y-3 text-center">
              <p class="text-xs font-medium text-[#2E2C29]">Scan to Pay via Any UPI App (Google Pay, PhonePe, Paytm, BHIM)</p>
              <div class="inline-block p-2 bg-white border border-[#C5A059] rounded shadow-sm">
                <img id="chk-upi-qr" src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=yuvrajsoni@upi&pn=HOUSE+OF+JEWELUX" alt="UPI QR Code" class="w-36 h-36 mx-auto">
              </div>
              <div class="flex items-center justify-center gap-2 text-xs text-[#736E65]">
                <span>UPI ID: <strong class="text-[#581825]">yuvrajsoni@upi</strong></span>
                <button type="button" onclick="navigator.clipboard.writeText('yuvrajsoni@upi'); alert('UPI ID copied!');" class="underline text-[0.65rem] text-[#581825]">Copy</button>
              </div>
            </div>

            <!-- Card Container -->
            <div id="pay-panel-card" class="p-4 bg-white border border-[#E5DFD5] rounded-sm space-y-3 hidden text-xs">
              <div>
                <label class="block text-[0.65rem] uppercase text-[#736E65] mb-1">Card Number</label>
                <input type="text" placeholder="4111 •••• •••• 1111 (RuPay / Visa / Mastercard)" class="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded p-2 text-xs">
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[0.65rem] uppercase text-[#736E65] mb-1">Valid Thru</label>
                  <input type="text" placeholder="MM/YY" class="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded p-2 text-xs">
                </div>
                <div>
                  <label class="block text-[0.65rem] uppercase text-[#736E65] mb-1">CVV</label>
                  <input type="password" placeholder="•••" maxlength="4" class="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded p-2 text-xs">
                </div>
              </div>
              <p class="text-[0.62rem] text-[#736E65]">Protected by 256-bit Bank Grade SSL Encryption with 3D Secure OTP authentication.</p>
            </div>

            <!-- Netbanking Container -->
            <div id="pay-panel-netbanking" class="p-4 bg-white border border-[#E5DFD5] rounded-sm space-y-2 hidden text-xs">
              <label class="block text-[0.65rem] uppercase text-[#736E65]">Select Primary Indian Bank</label>
              <select class="w-full bg-[#FAF7F2] border border-[#E5DFD5] rounded p-2 text-xs">
                <option>HDFC Bank</option>
                <option>ICICI Bank</option>
                <option>State Bank of India (SBI)</option>
                <option>Axis Bank</option>
                <option>Kotak Mahindra Bank</option>
                <option>Punjab National Bank</option>
              </select>
            </div>

            <!-- COD Container -->
            <div id="pay-panel-cod" class="p-4 bg-white border border-[#E5DFD5] rounded-sm space-y-2 hidden text-xs text-[#736E65]">
              <p>Cash on Delivery is available for verified domestic pin codes across India.</p>
              <p class="text-[0.65rem] text-[#581825] font-semibold">Note: A ₹200 refundable authenticity token or phone verification applies to confirm physical salon dispatch.</p>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="bg-[#F3EFE8] p-4 border-t border-[#E5DFD5] flex flex-col sm:flex-row gap-3">
          <button id="btn-complete-order" type="button" class="flex-1 bg-[#581825] text-white py-3.5 text-center text-xs tracking-widest uppercase font-semibold hover:opacity-90 transition-opacity">
            Confirm &amp; Place Insured Order
          </button>
          <button id="btn-whatsapp-order" type="button" class="sm:flex-initial bg-[#25D366] text-white px-5 py-3.5 text-center text-xs tracking-wider uppercase font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
            <span>WhatsApp Order</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Modal Events
    document.getElementById('close-checkout-modal-btn')?.addEventListener('click', closeCheckoutModal);

    // Payment tab toggles
    const tabBtns = modal.querySelectorAll('.payment-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const method = btn.getAttribute('data-method');
        ['upi', 'card', 'netbanking', 'cod'].forEach(m => {
          const el = document.getElementById(`pay-panel-${m}`);
          if (el) el.classList.toggle('hidden', m !== method);
        });
      });
    });

    // Apply Coupon
    document.getElementById('chk-apply-coupon')?.addEventListener('click', () => {
      const input = document.getElementById('chk-coupon');
      const msg = document.getElementById('chk-coupon-msg');
      if (!input || !msg) return;
      const code = input.value.trim().toUpperCase();
      const coupons = (window.STORE && window.STORE.coupons) ? window.STORE.coupons : {};

      if (coupons[code]) {
        window.appState.promoCodeApplied = code;
        window.appState.discountPercent = coupons[code].discountPercent || 0;
        msg.textContent = `Privilege applied: ${coupons[code].description}`;
        msg.classList.remove('hidden', 'text-red-600');
        msg.classList.add('text-emerald-700');
      } else {
        window.appState.promoCodeApplied = null;
        window.appState.discountPercent = 0;
        msg.textContent = 'Invalid privilege coupon code.';
        msg.classList.remove('hidden', 'text-emerald-700');
        msg.classList.add('text-red-600');
      }
      updateCheckoutValuation();
    });

    // Place Order Button
    document.getElementById('btn-complete-order')?.addEventListener('click', () => {
      executeOrderPlacement(false);
    });

    // WhatsApp Order Button
    document.getElementById('btn-whatsapp-order')?.addEventListener('click', () => {
      executeOrderPlacement(true);
    });
  }

  function updateCheckoutValuation() {
    const cart = (window.appState && window.appState.cart) ? window.appState.cart : [];
    const prods = (window.STORE && window.STORE.products) ? window.STORE.products : [];

    let subtotalUSD = 0;
    cart.forEach(item => {
      const p = prods.find(x => x.id === item.id);
      if (p) subtotalUSD += (p.priceUSD * (item.qty || 1));
    });

    const subtotalINR = Math.round(subtotalUSD * 83.5);
    const discountPercent = (window.appState && window.appState.discountPercent) ? window.appState.discountPercent : 0;
    const discountINR = Math.round(subtotalINR * (discountPercent / 100));
    const taxableINR = Math.max(0, subtotalINR - discountINR);
    const gstINR = Math.round(taxableINR * 0.03); // 3% fine jewellery GST
    const totalINR = taxableINR + gstINR;

    const subEl = document.getElementById('chk-subtotal-val');
    const discRow = document.getElementById('chk-discount-row');
    const discEl = document.getElementById('chk-discount-val');
    const gstEl = document.getElementById('chk-gst-val');
    const totEl = document.getElementById('chk-total-val');
    const qrImg = document.getElementById('chk-upi-qr');

    if (subEl) subEl.textContent = `₹${subtotalINR.toLocaleString('en-IN')}`;
    if (discRow) {
      discRow.classList.toggle('hidden', discountINR <= 0);
      if (discEl) discEl.textContent = `-₹${discountINR.toLocaleString('en-IN')}`;
    }
    if (gstEl) gstEl.textContent = `₹${gstINR.toLocaleString('en-IN')}`;
    if (totEl) totEl.textContent = `₹${totalINR.toLocaleString('en-IN')}`;

    if (qrImg) {
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=yuvrajsoni@upi&pn=HOUSE+OF+JEWELUX&am=${totalINR}&cu=INR`;
    }
  }

  function executeOrderPlacement(openWhatsApp) {
    const name = document.getElementById('chk-name')?.value.trim();
    const phone = document.getElementById('chk-phone')?.value.trim();
    const email = document.getElementById('chk-email')?.value.trim();
    const address = document.getElementById('chk-address')?.value.trim();
    const city = document.getElementById('chk-city')?.value.trim();
    const pincode = document.getElementById('chk-pincode')?.value.trim();
    const isGift = document.getElementById('chk-gift')?.checked;

    if (!name || !phone || !email || !address || !pincode) {
      alert('Please fill in all mandatory delivery details.');
      return;
    }

    const cart = (window.appState && window.appState.cart) ? window.appState.cart : [];
    if (!cart.length) {
      alert('Your shopping bag is empty.');
      return;
    }

    const prods = (window.STORE && window.STORE.products) ? window.STORE.products : [];
    let itemsDetails = [];
    let subtotalUSD = 0;
    cart.forEach(item => {
      const p = prods.find(x => x.id === item.id);
      if (p) {
        subtotalUSD += (p.priceUSD * (item.qty || 1));
        itemsDetails.push({
          id: p.id,
          name: p.name,
          metal: p.metal,
          priceUSD: p.priceUSD,
          priceINR: Math.round(p.priceUSD * 83.5),
          qty: item.qty || 1
        });
      }
    });

    const subtotalINR = Math.round(subtotalUSD * 83.5);
    const discountPercent = (window.appState && window.appState.discountPercent) ? window.appState.discountPercent : 0;
    const discountINR = Math.round(subtotalINR * (discountPercent / 100));
    const taxableINR = Math.max(0, subtotalINR - discountINR);
    const gstINR = Math.round(taxableINR * 0.03);
    const totalINR = taxableINR + gstINR;

    const activeTab = document.querySelector('.payment-tab-btn.active');
    const paymentMethod = activeTab ? activeTab.textContent.trim() : 'Instant UPI';

    const orderId = 'HJ-2026-' + Math.floor(10000 + Math.random() * 90000);
    const newOrder = {
      id: orderId,
      date: new Date().toISOString().split('T')[0],
      customer: {
        name,
        phone,
        email,
        address: `${address}, ${city} - ${pincode}`,
        giftPackaging: isGift
      },
      items: itemsDetails,
      subtotal: subtotalINR,
      discount: discountINR,
      gst: gstINR,
      total: totalINR,
      currency: 'INR',
      paymentMethod,
      status: 'Confirmed & Insured'
    };

    // Save order
    const existingOrders = JSON.parse(localStorage.getItem('jewelux_orders') || '[]');
    existingOrders.unshift(newOrder);
    localStorage.setItem('jewelux_orders', JSON.stringify(existingOrders));

    // Update customer in CRM
    const existingCusts = JSON.parse(localStorage.getItem('jewelux_customers') || '[]');
    let cust = existingCusts.find(c => c.phone === phone || c.email === email);
    if (!cust) {
      cust = {
        name,
        phone,
        email,
        birthday: '',
        whatsappOptIn: true,
        totalSpendINR: totalINR,
        ordersCount: 1,
        tier: totalINR > 100000 ? 'Royal Patron' : (totalINR > 25000 ? 'Gold Collector' : 'Silver Connoisseur'),
        points: Math.round(totalINR * 0.05),
        referralCode: 'JEWELUX-' + name.split(' ')[0].toUpperCase() + '500'
      };
      existingCusts.push(cust);
    } else {
      cust.totalSpendINR += totalINR;
      cust.ordersCount += 1;
      cust.points += Math.round(totalINR * 0.05);
      cust.tier = cust.totalSpendINR > 100000 ? 'Royal Patron' : (cust.totalSpendINR > 25000 ? 'Gold Collector' : 'Silver Connoisseur');
    }
    localStorage.setItem('jewelux_customers', JSON.stringify(existingCusts));
    localStorage.setItem('jewelux_current_user', JSON.stringify(cust));

    // Clear cart
    window.appState.cart = [];
    localStorage.removeItem('jewelux_cart');
    if (typeof updateBadges === 'function') updateBadges();
    if (typeof renderCartPage === 'function') renderCartPage();

    closeCheckoutModal();

    // Show Confirmation Screen
    showOrderConfirmationScreen(newOrder);

    // If WhatsApp order requested, route directly
    if (openWhatsApp) {
      let waMsg = `👑 *HOUSE OF JEWELUX — NEW ORDER CONFIRMATION* 👑\n`;
      waMsg += `*Order ID:* ${newOrder.id}\n`;
      waMsg += `*Client Name:* ${name}\n`;
      waMsg += `*Phone:* ${phone}\n`;
      waMsg += `*Delivery Address:* ${address}, ${city} - ${pincode}\n`;
      waMsg += `*Gift Packaging:* ${isGift ? 'Yes (Royal Velvet Box & Wax Seal)' : 'Standard Luxury Packaging'}\n\n`;
      waMsg += `*Acquisition Pieces:*\n`;
      newOrder.items.forEach((it, i) => {
        waMsg += `${i+1}. ${it.name} (Qty: ${it.qty}) — ₹${it.priceINR.toLocaleString('en-IN')}\n`;
      });
      waMsg += `\n*Subtotal:* ₹${subtotalINR.toLocaleString('en-IN')}\n`;
      if (discountINR > 0) waMsg += `*Privilege Discount:* -₹${discountINR.toLocaleString('en-IN')}\n`;
      waMsg += `*GST (3%):* ₹${gstINR.toLocaleString('en-IN')}\n`;
      waMsg += `*Armored Courier:* Complimentary\n`;
      waMsg += `*Total Valuation:* ₹${totalINR.toLocaleString('en-IN')}\n`;
      waMsg += `*Payment Mode:* ${paymentMethod}\n\n`;
      waMsg += `Kindly confirm dispatch schedule and tracking details. Thank you!`;

      window.open(`https://wa.me/916377061020?text=${encodeURIComponent(waMsg)}`, '_blank');
    }
  }

  function showOrderConfirmationScreen(order) {
    const confModal = document.createElement('div');
    confModal.className = 'fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto';
    confModal.innerHTML = `
      <div class="bg-[#FAF7F2] border border-[#C5A059] rounded-lg max-w-xl w-full p-6 sm:p-8 text-center space-y-6 shadow-2xl">
        <div class="w-16 h-16 mx-auto rounded-full bg-[#581825] text-[#C5A059] flex items-center justify-center text-3xl font-serif">
          ✓
        </div>
        <div>
          <span class="text-[0.65rem] tracking-[0.25em] uppercase text-[#8C6D37] font-semibold">Acquisition Confirmed</span>
          <h2 class="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#581825]">Thank You, ${order.customer.name}</h2>
          <p class="text-xs text-[#736E65] mt-1">Order #${order.id} is confirmed and scheduled for armored dispatch.</p>
        </div>

        <div class="bg-[#FCFAF7] border border-[#E5DFD5] p-4 rounded text-left text-xs space-y-2">
          <p><strong>Insured Total:</strong> ₹${order.total.toLocaleString('en-IN')}</p>
          <p><strong>Destination:</strong> ${order.customer.address}</p>
          <p><strong>Transit Method:</strong> White-Glove Armored Courier (2-4 Days)</p>
          <p><strong>Certification:</strong> Stamped BIS 925 Hallmark &amp; Authenticity Dossier</p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <button onclick="window.printInvoice('${order.id}')" class="flex-1 bg-[#581825] text-white py-3 rounded text-xs uppercase tracking-widest font-semibold hover:opacity-90">
            Print Official Invoice
          </button>
          <a href="https://wa.me/916377061020?text=${encodeURIComponent('Hello Concierge, I would like to track my order ' + order.id)}" target="_blank" rel="noopener noreferrer" class="flex-1 bg-[#25D366] text-white py-3 rounded text-xs uppercase tracking-widest font-semibold hover:opacity-90 flex items-center justify-center gap-1.5">
            Track on WhatsApp
          </a>
        </div>
        <button onclick="this.closest('.fixed').remove(); window.location.href = window.location.pathname.includes('/cart/') ? '../' : '';" class="text-xs text-[#736E65] hover:text-[#581825] underline">
          Return to Atelier Homepage
        </button>
      </div>
    `;
    document.body.appendChild(confModal);
  }

  window.openCheckoutModal = function() {
    initCheckoutSystem();
    const modal = document.getElementById('checkout-modal');
    if (modal) {
      modal.classList.add('is-active');
      updateCheckoutValuation();
    }
  };

  window.closeCheckoutModal = function() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.remove('is-active');
  };

  // Print Invoice
  window.printInvoice = function(orderId) {
    const orders = JSON.parse(localStorage.getItem('jewelux_orders') || '[]');
    const order = orders.find(o => o.id === orderId) || orders[0];
    if (!order) return;

    let prn = document.getElementById('invoice-printable');
    if (!prn) {
      prn = document.createElement('div');
      prn.id = 'invoice-printable';
      document.body.appendChild(prn);
    }

    let itemsRows = order.items.map((it, i) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 8px;">${i+1}</td>
        <td style="padding: 8px;"><strong>${it.name}</strong><br><small style="color: #666;">${it.metal || 'BIS 925 Sterling Silver'}</small></td>
        <td style="padding: 8px; text-align: center;">${it.qty}</td>
        <td style="padding: 8px; text-align: right;">₹${it.priceINR ? it.priceINR.toLocaleString('en-IN') : (it.priceUSD * 83.5).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    prn.innerHTML = `
      <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; color: #111;">
        <div style="text-align: center; border-bottom: 2px solid #581825; padding-bottom: 16px;">
          <h1 style="font-size: 26px; letter-spacing: 4px; text-transform: uppercase; color: #581825; margin: 0;">HOUSE OF JEWELUX</h1>
          <p style="font-size: 11px; letter-spacing: 3px; color: #8C6D37; margin: 4px 0 0;">WHERE ELEGANCE BECOMES ETERNAL</p>
          <p style="font-size: 11px; color: #666; margin: 4px 0 0;">Jaipur Atelier, Rajasthan, India • WhatsApp Concierge: +91 63770 61020 • houseofjewelux@gmail.com</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin: 24px 0; font-size: 12px;">
          <div>
            <p><strong>INVOICE TO:</strong></p>
            <p>${order.customer.name}</p>
            <p>${order.customer.phone}</p>
            <p>${order.customer.address}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>INVOICE NUMBER:</strong> ${order.id}</p>
            <p><strong>DATE:</strong> ${order.date}</p>
            <p><strong>PAYMENT MODE:</strong> ${order.paymentMethod}</p>
            <p><strong>STATUS:</strong> ${order.status}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin: 20px 0;">
          <thead>
            <tr style="background: #F3EFE8; border-bottom: 1px solid #581825;">
              <th style="padding: 8px; text-align: left;">#</th>
              <th style="padding: 8px; text-align: left;">Article &amp; Specification</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Valuation</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div style="float: right; width: 280px; font-size: 12px; margin-top: 10px;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>Subtotal:</span><span>₹${order.subtotal.toLocaleString('en-IN')}</span></div>
          ${order.discount ? `<div style="display: flex; justify-content: space-between; padding: 4px 0; color: #166534;"><span>Privilege Discount:</span><span>-₹${order.discount.toLocaleString('en-IN')}</span></div>` : ''}
          <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>GST (3%):</span><span>₹${order.gst.toLocaleString('en-IN')}</span></div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>Insured Courier:</span><span>Complimentary</span></div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #581825; font-size: 15px; font-weight: bold; color: #581825;"><span>Total Valuation:</span><span>₹${order.total.toLocaleString('en-IN')}</span></div>
        </div>
        <div style="clear: both;"></div>

        <div style="margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 16px; font-size: 10px; color: #555; text-align: center;">
          <p>Every piece listed above is guaranteed solid 925 Sterling Silver, stamped with official BIS Hallmark certification.</p>
          <p>Founder &amp; Creative Director: Yuvraj Soni • House of Jewelux Atelier, Jaipur, India</p>
        </div>
      </div>
    `;

    window.print();
  };

  // 3. AUTO INITIALIZE
  function bootstrapLuxeFeatures() {
    initAIConcierge();
    initCheckoutSystem();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapLuxeFeatures);
  } else {
    bootstrapLuxeFeatures();
  }
  window.addEventListener('load', bootstrapLuxeFeatures);

})();
