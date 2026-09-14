// HOUSE OF JEWELUX - Client Application & SPA Routing Logic
// Italian High-Fashion Refinement & Timeless Indian Craftsmanship

document.addEventListener('DOMContentLoaded', () => {
  // Global Application State
  const state = {
    currency: 'USD',
    cart: JSON.parse(localStorage.getItem('jewelux_cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('jewelux_wishlist') || '[]'),
    activeCategory: 'all',
    activeSort: 'featured',
    discountPercent: 0,
    promoCodeApplied: null,
    activeProduct: null,
    
    // Bespoke Ring Studio State
    bespoke: {
      metalId: 'yellow-gold',
      gemId: 'diamond',
      cutId: 'round',
      caratWeight: 1.75
    }
  };

  // ================= 1. CURRENCY CONVERSION & FORMATTING =================
  function formatPrice(usdAmount) {
    const curr = JEWELUX_DATA.currencies[state.currency] || JEWELUX_DATA.currencies.USD;
    const converted = usdAmount * curr.rate;
    const formatted = Math.round(converted).toLocaleString();
    return `${curr.symbol}${formatted}`;
  }

  const currencySelect = document.getElementById('currency-select');
  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      state.currency = e.target.value;
      renderAllProductGrids();
      updateBespokePrice();
      renderCart();
      renderWishlist();
      if (state.activeProduct) {
        renderProductDetail(state.activeProduct);
      }
      showToast(`Currency converted to ${state.currency}`, '💎');
    });
  }

  // ================= 2. TOAST NOTIFICATION SYSTEM =================
  function showToast(message, icon = '✦') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'luxury-toast';
    toast.innerHTML = `
      <span class="star-emblem">${icon}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.35s ease';
      setTimeout(() => toast.remove(), 350);
    }, 3500);
  }
  window.showToast = showToast;

  // ================= 3. SPA ROUTING & VIEW CONTROLLER =================
  const views = {
    home: document.getElementById('view-home'),
    shop: document.getElementById('view-shop'),
    collections: document.getElementById('view-collections'),
    'product-detail': document.getElementById('view-product-detail'),
    about: document.getElementById('view-about'),
    craftsmanship: document.getElementById('view-craftsmanship'),
    contact: document.getElementById('view-contact'),
    faq: document.getElementById('view-faq'),
    shipping: document.getElementById('view-shipping'),
    returns: document.getElementById('view-returns'),
    privacy: document.getElementById('view-privacy'),
    terms: document.getElementById('view-terms')
  };

  function switchView(targetViewId) {
    Object.keys(views).forEach(vKey => {
      if (views[vKey]) {
        views[vKey].classList.remove('active');
      }
    });

    if (views[targetViewId]) {
      views[targetViewId].classList.add('active');
    } else if (views.home) {
      views.home.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleRoute() {
    const rawHash = window.location.hash || '#home';
    const hash = rawHash.replace(/^#/, '');

    // Category routing to Shop view
    const categoryRoutes = {
      'shop': 'all',
      'new-arrivals': 'new-arrivals',
      'best-sellers': 'best-sellers',
      'rings': 'rings',
      'earrings': 'earrings',
      'necklaces': 'necklaces',
      'bracelets': 'bracelets',
      'bangles': 'bangles',
      'silver': 'silver',
      'temple': 'temple'
    };

    if (categoryRoutes[hash] !== undefined) {
      state.activeCategory = categoryRoutes[hash];
      switchView('shop');
      renderShopHeader();
      renderShopPills();
      renderShopProducts();
      return;
    }

    // Product Detail routing: #product-HJ-001
    if (hash.startsWith('product-')) {
      const prodId = hash.replace('product-', '');
      const prod = JEWELUX_DATA.products.find(p => p.id === prodId);
      if (prod) {
        state.activeProduct = prod;
        switchView('product-detail');
        renderProductDetail(prod);
        return;
      }
    }

    // In-page section anchors on home page
    if (hash === 'bespoke-studio' || hash === 'collections-section' || hash === 'lookbook') {
      switchView('home');
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    // Standard static page views
    if (views[hash]) {
      switchView(hash);
      return;
    }

    // Default fallback
    switchView('home');
  }

  window.addEventListener('hashchange', handleRoute);

  // ================= 4. PRODUCT RENDERING & CATALOGUE =================
  function createProductCardHTML(product) {
    const isWishlisted = state.wishlist.includes(product.id);
    return `
      <div class="product-card group rounded-lg overflow-hidden flex flex-col justify-between" data-id="${product.id}">
        <div class="relative product-image-container aspect-square overflow-hidden cursor-pointer" onclick="openProductPage('${product.id}')">
          <!-- Badge -->
          <div class="absolute top-3 left-3 z-10">
            <span class="px-2.5 py-1 text-[9px] uppercase font-semibold tracking-widest bg-white/95 text-[#8A6B38] border border-[#C5A674]/30 rounded-full shadow-sm">
              ${product.badge}
            </span>
          </div>

          <!-- Wishlist Toggle -->
          <button 
            onclick="event.stopPropagation(); toggleWishlist('${product.id}')"
            class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#1D1815] flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110"
            title="${isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}"
            aria-label="Toggle Wishlist"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 ${isWishlisted ? 'fill-[#BE123C] text-[#BE123C]' : 'text-[#766B5E]'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </button>

          <!-- Dual-Angle Photography Hover -->
          <img 
            src="${product.image}" 
            alt="${product.name}" 
            class="main-img w-full h-full object-cover object-center group-hover:opacity-0 transition-opacity duration-700" 
            loading="lazy"
          />
          <img 
            src="${product.hoverImage || product.image}" 
            alt="${product.name} Inspection Angle" 
            class="hover-img absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-700" 
            loading="lazy"
          />

          <!-- Quick View Trigger Overlay -->
          <div class="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300 flex justify-center">
            <button 
              onclick="event.stopPropagation(); openQuickView('${product.id}')"
              class="px-3.5 py-1.5 text-[10px] tracking-widest uppercase bg-white/95 text-[#1D1815] hover:bg-[#1D1815] hover:text-white rounded border border-[#C5A674]/40 shadow-sm transition"
            >
              Quick Inspect
            </button>
          </div>
        </div>

        <!-- Card Body -->
        <div class="p-5 flex flex-col flex-grow justify-between bg-white">
          <div>
            <p class="text-[10px] uppercase tracking-widest text-[#8A6B38] font-semibold mb-1">${product.metal}</p>
            <h4 onclick="openProductPage('${product.id}')" class="font-display text-base sm:text-lg text-[#1D1815] font-normal leading-snug cursor-pointer hover:text-[#8A6B38] transition-colors">
              ${product.name}
            </h4>
            <p class="text-[11px] text-[#766B5E] font-sans font-light mt-1 line-clamp-1">${product.stone}</p>
          </div>

          <div class="mt-4 pt-3 border-t border-[#F4F1EA] flex items-center justify-between">
            <div>
              <span class="text-[9px] text-[#9E9386] block uppercase tracking-wider">Acquisition</span>
              <span class="font-display text-lg font-semibold text-[#1D1815]">${formatPrice(product.priceUSD)}</span>
            </div>
            <button 
              onclick="addToCart('${product.id}')" 
              class="px-3.5 py-2 bg-[#FAF9F5] hover:bg-[#1D1815] text-[#1D1815] hover:text-white border border-[#C5A674]/40 rounded text-[10px] tracking-wider uppercase font-medium transition flex items-center gap-1.5"
              title="Add to Shopping Bag"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function filterAndSortProducts(products, categoryId, sortOrder) {
    let filtered = [...products];

    // Category Filtering
    if (categoryId === 'new-arrivals') {
      filtered = filtered.filter(p => p.isNew);
    } else if (categoryId === 'best-sellers') {
      filtered = filtered.filter(p => p.isBestSeller);
    } else if (categoryId !== 'all') {
      filtered = filtered.filter(p => p.category === categoryId);
    }

    // Sorting
    if (sortOrder === 'price-high') {
      filtered.sort((a, b) => b.priceUSD - a.priceUSD);
    } else if (sortOrder === 'price-low') {
      filtered.sort((a, b) => a.priceUSD - b.priceUSD);
    } else if (sortOrder === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }

  function renderFeaturedHomeProducts() {
    const container = document.getElementById('featured-products-grid');
    if (!container) return;
    const featured = JEWELUX_DATA.products.slice(0, 4);
    container.innerHTML = featured.map(p => createProductCardHTML(p)).join('');
  }

  function renderShopProducts() {
    const container = document.getElementById('shop-products-grid');
    if (!container) return;
    const products = filterAndSortProducts(JEWELUX_DATA.products, state.activeCategory, state.activeSort);

    if (products.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center text-[#766B5E]">
          <span class="star-emblem text-2xl block mb-2">✦</span>
          <p class="font-display text-xl text-[#1D1815]">No Masterpieces in this Selection</p>
          <p class="text-xs text-[#9E9386] mt-1">Our Bespoke Atelier can handcraft this creation to your exact gemological criteria.</p>
          <button onclick="openAppointmentModal('Bespoke inquiry for ' + '${state.activeCategory}')" class="btn-luxury-primary py-2.5 px-6 text-[10px] mt-4">
            Commission Custom Creation
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(p => createProductCardHTML(p)).join('');
  }

  function renderShopHeader() {
    const titleEl = document.getElementById('shop-title');
    const descEl = document.getElementById('shop-description');
    if (!titleEl || !descEl) return;

    const catObj = JEWELUX_DATA.categories.find(c => c.id === state.activeCategory);
    if (!catObj) return;

    const titles = {
      'all': 'All <span class="italic champagne-gold-text font-serif">Masterpieces</span>',
      'new-arrivals': 'New <span class="italic champagne-gold-text font-serif">Arrivals 2026</span>',
      'best-sellers': 'The Most <span class="italic champagne-gold-text font-serif">Coveted</span>',
      'rings': 'Solitaires & <span class="italic champagne-gold-text font-serif">Bridal Rings</span>',
      'earrings': 'Articulated <span class="italic champagne-gold-text font-serif">Earrings</span>',
      'necklaces': 'Haute Joaillerie <span class="italic champagne-gold-text font-serif">Collars</span>',
      'bracelets': 'Articulated <span class="italic champagne-gold-text font-serif">Bracelets</span>',
      'bangles': 'Champagne Gold <span class="italic champagne-gold-text font-serif">Bangles & Kada</span>',
      'silver': 'The <span class="italic champagne-gold-text font-serif">Silver Edit</span>',
      'temple': 'Sacred Temple <span class="italic champagne-gold-text font-serif">Heirlooms</span>'
    };

    const descriptions = {
      'all': 'Explore rare diamonds, certified Colombian emeralds, fine 925 silver, and sacred 22K temple heirlooms.',
      'new-arrivals': 'The newest high jewellery creations straight from our Geneva and Milan ateliers.',
      'best-sellers': 'Timeless heirlooms favored by royal patrons and discerning international collectors.',
      'rings': 'Handcrafted in Platinum 950 and 18K champagne gold with GIA-certified D-Flawless center stones.',
      'earrings': 'Luminescent drops, studs, and chandeliers calibrated to frame the face with candlelight fire.',
      'necklaces': 'From regal Muzo emerald collars to minimalist diamond solitaire pendants.',
      'bracelets': 'Articulated tennis bracelets engineered with double safety catches for daily sovereign elegance.',
      'bangles': 'Hand-sculpted in solid 18K champagne gold with flush-set baguettes and comfortable oval profiles.',
      'silver': 'Pristine 925 Sterling Silver plated in liquid platinum-rhodium with lab-certified moissanite.',
      'temple': 'Hand-chased 22-karat antique nakshi gold, Basra pearls, and uncut polki diamonds.'
    };

    titleEl.innerHTML = titles[state.activeCategory] || catObj.name;
    descEl.textContent = descriptions[state.activeCategory] || 'Discover certified haute joaillerie handcrafted to transcend generations.';
  }

  function renderShopPills() {
    const container = document.getElementById('shop-category-pills');
    if (!container) return;

    container.innerHTML = JEWELUX_DATA.categories.map(cat => {
      const isActive = state.activeCategory === cat.id;
      return `
        <button 
          onclick="setShopCategory('${cat.id}')"
          class="px-4 py-1.5 text-xs tracking-wider uppercase font-medium transition-all rounded-full border ${
            isActive 
              ? 'bg-[#1D1815] text-white border-[#1D1815] shadow-sm' 
              : 'bg-white text-[#766B5E] border-[#C5A674]/30 hover:border-[#8A6B38] hover:text-[#1D1815]'
          }"
        >
          ${cat.name}
        </button>
      `;
    }).join('');
  }

  window.setShopCategory = function(catId) {
    state.activeCategory = catId;
    renderShopHeader();
    renderShopPills();
    renderShopProducts();
    // Update hash silently without triggering full jump if already in shop
    if (window.location.hash.replace('#', '') !== catId) {
      window.history.replaceState(null, '', `#${catId}`);
    }
  };

  window.handleSortChange = function(sortValue) {
    state.activeSort = sortValue;
    renderShopProducts();
  };

  function renderAllProductGrids() {
    renderFeaturedHomeProducts();
    renderShopProducts();
  }

  // ================= 5. COLLECTIONS RENDERING =================
  function renderCollections() {
    // Home Collections Grid
    const homeContainer = document.getElementById('collections-grid-home');
    if (homeContainer) {
      homeContainer.innerHTML = JEWELUX_DATA.collections.map(col => `
        <div class="bg-white rounded-xl overflow-hidden border border-[#C5A674]/30 shadow-sm group hover:shadow-xl transition-all duration-500 flex flex-col justify-between">
          <div class="aspect-[4/3] overflow-hidden relative cursor-pointer" onclick="navigateToCategory('${col.category}')">
            <img src="${col.image}" alt="${col.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6">
              <span class="text-[9px] uppercase tracking-widest text-[#F5EBDA] font-semibold">Haute Curation</span>
              <h4 class="font-display text-xl text-white font-normal">${col.name}</h4>
            </div>
          </div>
          <div class="p-6 space-y-3 bg-white flex-grow flex flex-col justify-between">
            <p class="font-serif text-sm text-[#766B5E] italic leading-relaxed">"${col.tagline}"</p>
            <p class="text-xs text-[#766B5E] font-light leading-relaxed">${col.description}</p>
            <div class="pt-2">
              <button onclick="navigateToCategory('${col.category}')" class="text-[10px] uppercase tracking-[0.2em] text-[#8A6B38] font-semibold hover:text-[#1D1815] transition-colors flex items-center gap-1.5">
                <span>Explore Line</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Full Collections Page View
    const fullContainer = document.getElementById('collections-full-grid');
    if (fullContainer) {
      fullContainer.innerHTML = JEWELUX_DATA.collections.map((col, idx) => {
        const isReverse = idx % 2 !== 0;
        return `
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-white p-8 rounded-2xl border border-[#C5A674]/30 shadow-sm">
            <div class="lg:col-span-7 ${isReverse ? 'lg:order-2' : ''} aspect-[16/10] overflow-hidden rounded-xl">
              <img src="${col.image}" alt="${col.name}" class="w-full h-full object-cover">
            </div>
            <div class="lg:col-span-5 ${isReverse ? 'lg:order-1' : ''} space-y-4">
              <span class="text-[10px] uppercase tracking-[0.3em] text-[#8A6B38] font-semibold">Collection 0${idx + 1}</span>
              <h3 class="font-display text-3xl text-[#1D1815] font-light">${col.name}</h3>
              <p class="font-serif text-base text-[#8A6B38] italic">"${col.tagline}"</p>
              <p class="text-xs sm:text-sm text-[#766B5E] font-light leading-relaxed">${col.description}</p>
              <div class="pt-2">
                <button onclick="navigateToCategory('${col.category}')" class="btn-luxury-primary py-3 px-6 text-[10px]">
                  Shop ${col.name}
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  window.navigateToCategory = function(catId) {
    window.location.hash = `#${catId}`;
  };

  // ================= 6. PRODUCT DETAIL PAGE (PDP) =================
  window.openProductPage = function(productId) {
    window.location.hash = `#product-${productId}`;
  };

  function renderProductDetail(product) {
    document.getElementById('pdp-breadcrumb-name').textContent = product.name;
    document.getElementById('pdp-title').textContent = product.name;
    document.getElementById('pdp-price').textContent = formatPrice(product.priceUSD);
    document.getElementById('pdp-metal').textContent = product.metal;
    document.getElementById('pdp-badge').textContent = product.badge;
    document.getElementById('pdp-description').textContent = product.description;

    // Gallery
    const mainImg = document.getElementById('pdp-main-image');
    mainImg.src = product.image;

    const gallery = product.gallery || [product.image, product.hoverImage].filter(Boolean);
    const thumbContainer = document.getElementById('pdp-thumbnails');
    if (thumbContainer) {
      thumbContainer.innerHTML = gallery.map((imgUrl, i) => `
        <button 
          onclick="setPDPMainImage('${imgUrl}', this)" 
          class="w-16 h-16 rounded border ${i === 0 ? 'border-[#C5A674] ring-2 ring-[#C5A674]/30' : 'border-[#E8E3D8]'} overflow-hidden flex-shrink-0 bg-[#FAF9F5] transition"
        >
          <img src="${imgUrl}" alt="${product.name} Thumbnail" class="w-full h-full object-cover">
        </button>
      `).join('');
    }

    // Sizes
    const sizeSelect = document.getElementById('pdp-size-select');
    if (sizeSelect) {
      sizeSelect.innerHTML = (product.sizes || ['Standard Size']).map(s => `
        <option value="${s}">${s}</option>
      `).join('');
    }

    // Specs Accordions
    document.getElementById('pdp-spec-stone').textContent = product.stone;
    document.getElementById('pdp-spec-cut').textContent = `${product.cut} • ${product.clarity}`;
    document.getElementById('pdp-spec-cert').textContent = product.certificate;
    document.getElementById('pdp-spec-dimensions').textContent = `${product.specs?.dimensions || 'Artisan Dimensions'} • ${product.specs?.grossWeight || 'Solid Precious Metal'}`;
    document.getElementById('pdp-spec-craftsmanship').textContent = product.craftsmanship || 'Handcrafted with microscopic pavé setting in our European and Indian ateliers.';
    document.getElementById('pdp-spec-care').textContent = product.care || 'Clean with warm soapy water and soft brush. Store separately in provided velvet casket.';

    // Buttons
    document.getElementById('pdp-add-btn').onclick = () => {
      const selectedSize = sizeSelect ? sizeSelect.value : null;
      addToCart(product.id, null, selectedSize);
    };

    document.getElementById('pdp-buy-now-btn').onclick = () => {
      const selectedSize = sizeSelect ? sizeSelect.value : null;
      addToCart(product.id, null, selectedSize);
      closeCartDrawer();
      simulateCheckout();
    };

    const isWishlisted = state.wishlist.includes(product.id);
    const wishBtn = document.getElementById('pdp-wishlist-btn');
    wishBtn.innerHTML = isWishlisted ? '<span>♥ In Wishlist</span>' : '<span>♡ Save to Wishlist</span>';
    wishBtn.onclick = () => {
      toggleWishlist(product.id);
      const updatedWish = state.wishlist.includes(product.id);
      wishBtn.innerHTML = updatedWish ? '<span>♥ In Wishlist</span>' : '<span>♡ Save to Wishlist</span>';
    };
  }

  window.setPDPMainImage = function(imgUrl, btnEl) {
    const mainImg = document.getElementById('pdp-main-image');
    if (mainImg) mainImg.src = imgUrl;

    if (btnEl && btnEl.parentElement) {
      Array.from(btnEl.parentElement.children).forEach(child => {
        child.className = 'w-16 h-16 rounded border border-[#E8E3D8] overflow-hidden flex-shrink-0 bg-[#FAF9F5] transition';
      });
      btnEl.className = 'w-16 h-16 rounded border border-[#C5A674] ring-2 ring-[#C5A674]/30 overflow-hidden flex-shrink-0 bg-[#FAF9F5] transition';
    }
  };

  // ================= 7. QUICK VIEW MODAL =================
  const quickViewModal = document.getElementById('quick-view-modal');
  window.openQuickView = function(productId) {
    const product = JEWELUX_DATA.products.find(p => p.id === productId);
    if (!product || !quickViewModal) return;

    document.getElementById('qv-img').src = product.image;
    document.getElementById('qv-badge').textContent = product.badge;
    document.getElementById('qv-title').textContent = product.name;
    document.getElementById('qv-price').textContent = formatPrice(product.priceUSD);
    document.getElementById('qv-metal').textContent = product.metal;
    document.getElementById('qv-stone').textContent = product.stone;
    document.getElementById('qv-cut').textContent = product.cut;
    document.getElementById('qv-clarity').textContent = product.clarity;
    document.getElementById('qv-certificate').textContent = product.certificate;
    document.getElementById('qv-description').textContent = product.description;

    document.getElementById('qv-add-btn').onclick = () => {
      addToCart(product.id);
      closeQuickView();
    };

    document.getElementById('qv-view-pdp-btn').onclick = () => {
      closeQuickView();
      openProductPage(product.id);
    };

    quickViewModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeQuickView = function() {
    if (quickViewModal) {
      quickViewModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // ================= 8. ACCORDIONS =================
  window.toggleAccordion = function(btnEl) {
    const item = btnEl.closest('.accordion-item');
    if (!item) return;
    item.classList.toggle('active');
  };

  // ================= 9. CRAFTSMANSHIP & FAQ RENDERING =================
  function renderCraftsmanshipSteps() {
    const container = document.getElementById('craftsmanship-steps-container');
    if (!container) return;

    container.innerHTML = JEWELUX_DATA.craftsmanshipSteps.map((step, idx) => {
      const isEven = idx % 2 === 1;
      return `
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white p-8 rounded-xl border border-[#C5A674]/30 shadow-sm">
          <div class="md:col-span-6 ${isEven ? 'md:order-2' : ''} aspect-[4/3] rounded-lg overflow-hidden">
            <img src="${step.image}" alt="${step.title}" class="w-full h-full object-cover">
          </div>
          <div class="md:col-span-6 ${isEven ? 'md:order-1' : ''} space-y-3">
            <span class="font-display text-4xl text-[#C5A674]/60 font-light block">${step.step}</span>
            <span class="text-[10px] uppercase tracking-[0.3em] text-[#8A6B38] font-semibold block">${step.subtitle}</span>
            <h3 class="font-display text-2xl text-[#1D1815] font-normal">${step.title}</h3>
            <p class="font-serif text-base text-[#766B5E] font-light leading-relaxed">${step.desc}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderFaqs() {
    const container = document.getElementById('faq-accordions-container');
    if (!container) return;

    container.innerHTML = JEWELUX_DATA.faqs.map(faq => `
      <div class="accordion-item border border-[#C5A674]/30 rounded-lg bg-white overflow-hidden shadow-sm">
        <button onclick="toggleAccordion(this)" class="accordion-header w-full px-6 py-4 text-left flex items-center justify-between font-display text-sm sm:text-base text-[#1D1815]">
          <span>${faq.q}</span>
          <span class="accordion-icon text-xl text-[#C5A674]">+</span>
        </button>
        <div class="accordion-content px-6 py-4 text-xs sm:text-sm text-[#766B5E] border-t border-[#F4F1EA] bg-[#FAF9F5] leading-relaxed">
          <p>${faq.a}</p>
        </div>
      </div>
    `).join('');
  }

  function renderBoutiques() {
    const container = document.getElementById('boutiques-list-container');
    if (!container) return;

    container.innerHTML = JEWELUX_DATA.boutiques.map(b => `
      <div class="p-5 bg-white rounded-lg border border-[#C5A674]/25 shadow-sm space-y-2">
        <h4 class="font-display text-base text-[#1D1815] font-medium">${b.city}</h4>
        <p class="text-xs text-[#766B5E] font-light">${b.address}</p>
        <p class="text-xs text-[#8A6B38] font-medium font-sans">${b.phone}</p>
        <p class="text-[10px] text-[#9E9386]">${b.hours}</p>
        <button onclick="openAppointmentModal('Appointment request for ${b.city}')" class="text-[10px] uppercase tracking-wider text-[#8A6B38] font-semibold underline underline-offset-4 hover:text-[#1D1815] pt-1 block">
          Schedule Appointment Here →
        </button>
      </div>
    `).join('');
  }

  // ================= 10. BESPOKE GOLDSMITH WORKBENCH =================
  const bespokeSvgContainer = document.getElementById('bespoke-ring-visualizer');

  window.setBespokeMetal = function(metalId) {
    state.bespoke.metalId = metalId;
    updateBespokeUI();
  };
  window.setBespokeGem = function(gemId) {
    state.bespoke.gemId = gemId;
    updateBespokeUI();
  };
  window.setBespokeCut = function(cutId) {
    state.bespoke.cutId = cutId;
    updateBespokeUI();
  };
  window.setBespokeCarat = function(caratWeight) {
    state.bespoke.caratWeight = parseFloat(caratWeight);
    updateBespokeUI();
  };

  function updateBespokeUI() {
    document.querySelectorAll('[data-bespoke-metal]').forEach(el => {
      const match = el.dataset.bespokeMetal === state.bespoke.metalId;
      el.classList.toggle('ring-2', match);
      el.classList.toggle('ring-[#C5A674]', match);
    });
    document.querySelectorAll('[data-bespoke-gem]').forEach(el => {
      const match = el.dataset.bespokeGem === state.bespoke.gemId;
      el.classList.toggle('border-[#C5A674]', match);
      el.classList.toggle('bg-[#F4F1EA]', match);
    });
    document.querySelectorAll('[data-bespoke-cut]').forEach(el => {
      const match = el.dataset.bespokeCut === state.bespoke.cutId;
      el.classList.toggle('border-[#C5A674]', match);
      el.classList.toggle('bg-[#F4F1EA]', match);
    });
    document.querySelectorAll('[data-bespoke-carat]').forEach(el => {
      const match = parseFloat(el.dataset.bespokeCarat) === state.bespoke.caratWeight;
      el.classList.toggle('border-[#C5A674]', match);
      el.classList.toggle('bg-[#F4F1EA]', match);
    });

    updateBespokePrice();
    renderBespokeSVG();
  }

  function calculateBespokePriceUSD() {
    const metal = JEWELUX_DATA.bespokeOptions.metals.find(m => m.id === state.bespoke.metalId) || JEWELUX_DATA.bespokeOptions.metals[0];
    const gem = JEWELUX_DATA.bespokeOptions.gemstones.find(g => g.id === state.bespoke.gemId) || JEWELUX_DATA.bespokeOptions.gemstones[0];
    const carat = JEWELUX_DATA.bespokeOptions.carats.find(c => c.weight === state.bespoke.caratWeight) || JEWELUX_DATA.bespokeOptions.carats[1];
    return Math.round(metal.basePrice + (2200 * gem.multiplier * carat.priceMultiplier));
  }

  function updateBespokePrice() {
    const priceEl = document.getElementById('bespoke-calc-price');
    if (priceEl) {
      priceEl.textContent = formatPrice(calculateBespokePriceUSD());
    }
  }

  function renderBespokeSVG() {
    if (!bespokeSvgContainer) return;

    const metal = JEWELUX_DATA.bespokeOptions.metals.find(m => m.id === state.bespoke.metalId) || JEWELUX_DATA.bespokeOptions.metals[0];
    const gem = JEWELUX_DATA.bespokeOptions.gemstones.find(g => g.id === state.bespoke.gemId) || JEWELUX_DATA.bespokeOptions.gemstones[0];
    const cut = JEWELUX_DATA.bespokeOptions.cuts.find(c => c.id === state.bespoke.cutId) || JEWELUX_DATA.bespokeOptions.cuts[0];
    const carat = JEWELUX_DATA.bespokeOptions.carats.find(c => c.weight === state.bespoke.caratWeight) || JEWELUX_DATA.bespokeOptions.carats[1];

    const baseSize = 36 * carat.scale;
    const bandColor = metal.color;
    const bandBorder = metal.border;
    const gemColor = gem.hex;

    let gemShapeSvg = '';
    if (cut.id === 'round') {
      gemShapeSvg = `
        <circle cx="150" cy="115" r="${baseSize}" fill="url(#gemGrad)" stroke="#FFFFFF" stroke-width="1.5" />
        <polygon points="150,${115 - baseSize} ${150 + baseSize*0.7},${115 - baseSize*0.5} ${150 + baseSize*0.7},${115 + baseSize*0.5} 150,${115 + baseSize} ${150 - baseSize*0.7},${115 + baseSize*0.5} ${150 - baseSize*0.7},${115 - baseSize*0.5}" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1" />
        <circle cx="150" cy="115" r="${baseSize*0.48}" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1" />
      `;
    } else if (cut.id === 'emerald-cut') {
      const w = baseSize * 1.7;
      const h = baseSize * 1.35;
      gemShapeSvg = `
        <rect x="${150 - w/2}" y="${115 - h/2}" width="${w}" height="${h}" rx="5" fill="url(#gemGrad)" stroke="#FFFFFF" stroke-width="1.5" />
        <rect x="${150 - w*0.35}" y="${115 - h*0.35}" width="${w*0.7}" height="${h*0.7}" rx="3" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="1" />
        <line x1="${150 - w/2}" y1="${115 - h/2}" x2="${150 - w*0.35}" y2="${115 - h*0.35}" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
        <line x1="${150 + w/2}" y1="${115 - h/2}" x2="${150 + w*0.35}" y2="${115 - h*0.35}" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
        <line x1="${150 - w/2}" y1="${115 + h/2}" x2="${150 - w*0.35}" y2="${115 + h*0.35}" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
        <line x1="${150 + w/2}" y1="${115 + h/2}" x2="${150 + w*0.35}" y2="${115 + h*0.35}" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
      `;
    } else if (cut.id === 'oval') {
      const rx = baseSize * 1.15;
      const ry = baseSize * 0.85;
      gemShapeSvg = `
        <ellipse cx="150" cy="115" rx="${rx}" ry="${ry}" fill="url(#gemGrad)" stroke="#FFFFFF" stroke-width="1.5" />
        <ellipse cx="150" cy="115" rx="${rx*0.6}" ry="${ry*0.6}" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1" />
      `;
    } else {
      const s = carat.scale;
      gemShapeSvg = `
        <path d="M 150 ${115 - 38*s} C ${150 + 26*s} ${115 - 10*s}, ${150 + 26*s} ${115 + 24*s}, 150 ${115 + 28*s} C ${150 - 26*s} ${115 + 24*s}, ${150 - 26*s} ${115 - 10*s}, 150 ${115 - 38*s} Z" fill="url(#gemGrad)" stroke="#FFFFFF" stroke-width="1.5" />
        <circle cx="150" cy="${115 + 8*s}" r="${10*s}" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1" />
      `;
    }

    bespokeSvgContainer.innerHTML = `
      <svg viewBox="0 0 300 300" class="w-full h-full drop-shadow-xl">
        <defs>
          <linearGradient id="bandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${bandColor}" />
            <stop offset="35%" stop-color="#FFFFFF" />
            <stop offset="70%" stop-color="${bandColor}" />
            <stop offset="100%" stop-color="${bandBorder}" />
          </linearGradient>

          <radialGradient id="gemGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="30%" stop-color="${gemColor}" />
            <stop offset="85%" stop-color="${gemColor}" />
            <stop offset="100%" stop-color="#1A1510" stop-opacity="0.8" />
          </radialGradient>
        </defs>

        <!-- Ambient Base Shadow -->
        <ellipse cx="150" cy="245" rx="75" ry="12" fill="rgba(61,50,41,0.15)" />

        <!-- Band -->
        <ellipse cx="150" cy="180" rx="68" ry="60" fill="none" stroke="url(#bandGrad)" stroke-width="13" stroke-linecap="round" />
        <ellipse cx="150" cy="180" rx="56" ry="49" fill="none" stroke="rgba(61,50,41,0.2)" stroke-width="1.5" />

        <!-- Prongs -->
        <g stroke="${bandColor}" stroke-width="3" stroke-linecap="round">
          <line x1="135" y1="126" x2="142" y2="146" />
          <line x1="165" y1="126" x2="158" y2="146" />
          <line x1="150" y1="132" x2="150" y2="148" stroke-width="4" stroke="url(#bandGrad)" />
        </g>

        <!-- Gemstone -->
        ${gemShapeSvg}

        <!-- Glints -->
        <polygon points="144,106 147,109 144,112 141,109" fill="#FFFFFF" />
        <polygon points="158,124 160,126 158,128 156,126" fill="#FFFFFF" opacity="0.85" />
      </svg>
    `;
  }

  window.orderBespokePiece = function() {
    const metal = JEWELUX_DATA.bespokeOptions.metals.find(m => m.id === state.bespoke.metalId);
    const gem = JEWELUX_DATA.bespokeOptions.gemstones.find(g => g.id === state.bespoke.gemId);
    const cut = JEWELUX_DATA.bespokeOptions.cuts.find(c => c.id === state.bespoke.cutId);
    const carat = JEWELUX_DATA.bespokeOptions.carats.find(c => c.weight === state.bespoke.caratWeight);
    const priceUSD = calculateBespokePriceUSD();

    const bespokeItem = {
      id: `bespoke-${Date.now()}`,
      name: `Bespoke ${carat.label} ${gem.name} Solitaire`,
      priceUSD: priceUSD,
      metal: metal.name,
      stone: `${carat.label} ${cut.name} (${gem.name})`,
      image: 'images/jewelux_solitaire_ring.jpg',
      quantity: 1,
      isBespoke: true
    };

    addToCart(null, bespokeItem);
  };

  window.consultBespokePiece = function() {
    const metal = JEWELUX_DATA.bespokeOptions.metals.find(m => m.id === state.bespoke.metalId);
    const gem = JEWELUX_DATA.bespokeOptions.gemstones.find(g => g.id === state.bespoke.gemId);
    const cut = JEWELUX_DATA.bespokeOptions.cuts.find(c => c.id === state.bespoke.cutId);
    const carat = JEWELUX_DATA.bespokeOptions.carats.find(c => c.weight === state.bespoke.caratWeight);

    const notes = `Bespoke Commission Inquiry: ${carat.label} ${cut.name} ${gem.name} set in ${metal.name}. Please prepare stone selections and gouache sketches.`;
    openAppointmentModal(notes);
  };

  // ================= 11. SHOPPING BAG & WISHLIST =================
  window.addToCart = function(productId, customItem = null, selectedSize = null) {
    if (customItem) {
      state.cart.push(customItem);
    } else {
      const prod = JEWELUX_DATA.products.find(p => p.id === productId);
      if (!prod) return;

      const existing = state.cart.find(i => i.id === productId && (!selectedSize || i.size === selectedSize));
      if (existing) {
        existing.quantity += 1;
      } else {
        state.cart.push({
          id: prod.id,
          name: prod.name,
          priceUSD: prod.priceUSD,
          image: prod.image,
          metal: prod.metal,
          stone: prod.stone,
          size: selectedSize || (prod.sizes ? prod.sizes[0] : null),
          quantity: 1
        });
      }
    }

    saveCart();
    renderCart();
    updateBadges();
    openCartDrawer();
    showToast('Masterpiece added to your shopping bag', '✨');
  };

  window.removeFromCart = function(itemId) {
    state.cart = state.cart.filter(item => item.id !== itemId);
    saveCart();
    renderCart();
    updateBadges();
  };

  window.updateCartQuantity = function(itemId, delta) {
    const item = state.cart.find(i => i.id === itemId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      state.cart = state.cart.filter(i => i.id !== itemId);
    }
    saveCart();
    renderCart();
    updateBadges();
  };

  function saveCart() {
    localStorage.setItem('jewelux_cart', JSON.stringify(state.cart));
  }

  function renderCart() {
    const container = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const discountRow = document.getElementById('cart-discount-row');
    const discountAmount = document.getElementById('cart-discount-amount');
    const shippingProgressEl = document.getElementById('shipping-progress-fill');
    const shippingTextEl = document.getElementById('shipping-progress-text');

    if (!container) return;

    if (state.cart.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center text-[#766B5E]">
          <span class="star-emblem text-2xl block mb-2">✦</span>
          <p class="font-display text-lg text-[#1D1815]">Your Shopping Bag is Empty</p>
          <p class="text-xs text-[#9E9386] mt-1">Discover our certified creations to begin your collection.</p>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = formatPrice(0);
      if (totalEl) totalEl.textContent = formatPrice(0);
      if (shippingProgressEl) shippingProgressEl.style.width = '0%';
      if (shippingTextEl) shippingTextEl.textContent = 'Add items for complimentary insured courier delivery.';
      return;
    }

    const subtotalUSD = state.cart.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0);
    const discountUSD = subtotalUSD * (state.discountPercent / 100);
    const totalUSD = Math.max(0, subtotalUSD - discountUSD);

    container.innerHTML = state.cart.map(item => `
      <div class="flex gap-4 py-4 items-center">
        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded bg-[#FAF9F5] border border-[#E8E3D8] flex-shrink-0">
        <div class="flex-grow min-w-0">
          <h4 class="font-display text-[#1D1815] text-sm truncate">${item.name}</h4>
          <p class="text-[10px] text-[#8A6B38] truncate">${item.metal} ${item.size ? '• ' + item.size : ''}</p>
          <p class="font-semibold text-[#1D1815] text-xs mt-1">${formatPrice(item.priceUSD)}</p>
          
          <div class="flex items-center gap-2 mt-2">
            <button onclick="updateCartQuantity('${item.id}', -1)" class="w-5 h-5 rounded border border-[#C5A674]/40 text-[#1D1815] flex items-center justify-center text-xs hover:bg-[#F4F1EA]">-</button>
            <span class="text-xs text-[#1D1815] font-medium px-1">${item.quantity}</span>
            <button onclick="updateCartQuantity('${item.id}', 1)" class="w-5 h-5 rounded border border-[#C5A674]/40 text-[#1D1815] flex items-center justify-center text-xs hover:bg-[#F4F1EA]">+</button>
            <button onclick="removeFromCart('${item.id}')" class="text-[10px] text-[#9E9386] hover:text-[#BE123C] ml-auto underline">Remove</button>
          </div>
        </div>
      </div>
    `).join('');

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotalUSD);
    if (totalEl) totalEl.textContent = formatPrice(totalUSD);

    if (discountRow && discountAmount) {
      if (state.discountPercent > 0) {
        discountRow.classList.remove('hidden');
        discountAmount.textContent = `-${formatPrice(discountUSD)} (${state.discountPercent}%)`;
      } else {
        discountRow.classList.add('hidden');
      }
    }

    const thresholdUSD = 10000;
    const progress = Math.min(100, (subtotalUSD / thresholdUSD) * 100);
    if (shippingProgressEl) shippingProgressEl.style.width = `${progress}%`;

    if (shippingTextEl) {
      if (subtotalUSD >= thresholdUSD) {
        shippingTextEl.innerHTML = `<span class="text-[#10B981] font-medium">✓ Complimentary Armored White-Glove Courier Unlocked</span>`;
      } else {
        const remaining = thresholdUSD - subtotalUSD;
        shippingTextEl.textContent = `Add ${formatPrice(remaining)} more for Complimentary Insured Delivery.`;
      }
    }
  }

  // Wishlist Logic
  window.toggleWishlist = function(productId) {
    const idx = state.wishlist.indexOf(productId);
    if (idx > -1) {
      state.wishlist.splice(idx, 1);
      showToast('Piece removed from your wishlist', '♡');
    } else {
      state.wishlist.push(productId);
      showToast('Piece saved to your wishlist', '♥');
    }
    localStorage.setItem('jewelux_wishlist', JSON.stringify(state.wishlist));
    renderAllProductGrids();
    renderWishlist();
    updateBadges();
  };

  function renderWishlist() {
    const container = document.getElementById('wishlist-items');
    if (!container) return;

    if (state.wishlist.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center text-[#766B5E]">
          <span class="star-emblem text-2xl block mb-2">✦</span>
          <p class="font-display text-lg text-[#1D1815]">Your Wishlist is Empty</p>
          <p class="text-xs text-[#9E9386] mt-1">Save pieces you cherish while exploring our archives.</p>
        </div>
      `;
      return;
    }

    const items = JEWELUX_DATA.products.filter(p => state.wishlist.includes(p.id));
    container.innerHTML = items.map(product => `
      <div class="flex gap-4 py-4 items-center">
        <img src="${product.image}" alt="${product.name}" class="w-16 h-16 object-cover rounded bg-[#FAF9F5] border border-[#E8E3D8] flex-shrink-0">
        <div class="flex-grow min-w-0">
          <h4 class="font-display text-[#1D1815] text-sm truncate">${product.name}</h4>
          <p class="text-[10px] text-[#8A6B38] truncate">${product.metal}</p>
          <p class="font-semibold text-[#1D1815] text-xs mt-1">${formatPrice(product.priceUSD)}</p>
          
          <div class="flex items-center gap-2 mt-2">
            <button onclick="addToCart('${product.id}'); toggleWishlist('${product.id}');" class="px-2.5 py-1 bg-[#1D1815] text-white text-[10px] uppercase tracking-wider rounded">Move to Bag</button>
            <button onclick="toggleWishlist('${product.id}')" class="text-[10px] text-[#9E9386] hover:text-[#BE123C] ml-auto underline">Remove</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function updateBadges() {
    const cartEl = document.getElementById('cart-badge');
    const wishEl = document.getElementById('wishlist-badge');

    const totalCount = state.cart.reduce((s, i) => s + i.quantity, 0);
    if (cartEl) {
      cartEl.textContent = totalCount;
      cartEl.classList.toggle('hidden', totalCount === 0);
    }

    if (wishEl) {
      const count = state.wishlist.length;
      wishEl.textContent = count;
      wishEl.classList.toggle('hidden', count === 0);
    }
  }

  // Drawers Trigger
  const cartDrawerBackdrop = document.getElementById('cart-drawer-backdrop');
  const wishlistDrawerBackdrop = document.getElementById('wishlist-drawer-backdrop');

  window.openCartDrawer = function() {
    if (cartDrawerBackdrop) {
      cartDrawerBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };
  window.closeCartDrawer = function() {
    if (cartDrawerBackdrop) {
      cartDrawerBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  };
  window.openWishlistDrawer = function() {
    if (wishlistDrawerBackdrop) {
      wishlistDrawerBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };
  window.closeWishlistDrawer = function() {
    if (wishlistDrawerBackdrop) {
      wishlistDrawerBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // Promo Code
  window.applyPromoCode = function() {
    const input = document.getElementById('promo-input');
    if (!input) return;
    const code = input.value.trim().toUpperCase();

    if (code === 'JEWELUX10' || code === 'VIP10') {
      state.discountPercent = 10;
      state.promoCodeApplied = code;
      renderCart();
      showToast('VIP Privilege Code applied: 10% Courtesy Saved', '⚜️');
      input.value = '';
    } else {
      showToast('Invalid invitation or privilege code', '✕');
    }
  };

  // ================= 12. CHECKOUT & APPOINTMENT MODALS =================
  const checkoutModal = document.getElementById('checkout-modal');
  window.simulateCheckout = function() {
    if (state.cart.length === 0) {
      showToast('Your shopping bag is empty', '⚠️');
      return;
    }
    closeCartDrawer();
    if (checkoutModal) {
      checkoutModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };
  window.closeCheckoutModal = function() {
    if (checkoutModal) {
      checkoutModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };
  window.confirmCheckout = function(e) {
    e.preventDefault();
    state.cart = [];
    saveCart();
    renderCart();
    updateBadges();
    closeCheckoutModal();
    showToast('Your acquisition inquiry has been placed with our Private Concierge.', '👑');
  };

  const appointmentModal = document.getElementById('appointment-modal');
  window.openAppointmentModal = function(prefillNotes = '') {
    if (appointmentModal) {
      if (prefillNotes) {
        const notesField = document.getElementById('appointment-notes');
        if (notesField) notesField.value = prefillNotes;
      }
      appointmentModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };
  window.closeAppointmentModal = function() {
    if (appointmentModal) {
      appointmentModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };
  window.submitAppointment = function(e) {
    e.preventDefault();
    closeAppointmentModal();
    showToast('Salon Consultation requested. Our concierge will contact you within 2 business hours.', '🏛️');
  };

  // Size Guide Modal
  const sizeGuideModal = document.getElementById('size-guide-modal');
  window.openSizeGuideModal = function() {
    if (sizeGuideModal) {
      sizeGuideModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };
  window.closeSizeGuideModal = function() {
    if (sizeGuideModal) {
      sizeGuideModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // ================= 13. LIVE SEARCH MODAL =================
  const searchModal = document.getElementById('search-modal');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  window.openSearchModal = function() {
    if (searchModal) {
      searchModal.classList.add('active');
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      renderSearchResults('');
      document.body.style.overflow = 'hidden';
    }
  };
  window.closeSearchModal = function() {
    if (searchModal) {
      searchModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderSearchResults(e.target.value.trim().toLowerCase());
    });
  }

  function renderSearchResults(query) {
    if (!searchResults) return;

    if (!query) {
      searchResults.innerHTML = `
        <div class="p-6 text-center text-[#766B5E] text-xs">
          Search diamonds, emeralds, solitaires, tennis bracelets, temple jewellery...
        </div>
      `;
      return;
    }

    const matches = JEWELUX_DATA.products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.metal.toLowerCase().includes(query) ||
      p.stone.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.cut.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );

    if (matches.length === 0) {
      searchResults.innerHTML = `
        <div class="p-8 text-center text-[#766B5E]">
          <p class="font-display text-base text-[#1D1815]">No pieces found for "${query}"</p>
          <p class="text-xs text-[#9E9386] mt-1">Our Bespoke Atelier can handcraft any design to your exact specification.</p>
          <button onclick="closeSearchModal(); openAppointmentModal('Custom creation inquiry for ' + '${query}')" class="mt-3 btn-luxury-primary py-2 px-4 text-[10px]">
            Request Bespoke Design
          </button>
        </div>
      `;
      return;
    }

    searchResults.innerHTML = matches.map(p => `
      <div class="flex items-center gap-4 p-3 hover:bg-[#FAF9F5] rounded cursor-pointer transition" onclick="closeSearchModal(); openProductPage('${p.id}')">
        <img src="${p.image}" alt="${p.name}" class="w-14 h-14 object-cover rounded bg-[#FAF9F5] border border-[#E8E3D8]">
        <div class="flex-grow">
          <h5 class="font-display text-[#1D1815] text-sm font-medium">${p.name}</h5>
          <p class="text-[10px] text-[#8A6B38]">${p.stone} • ${p.metal}</p>
          <p class="text-xs font-semibold text-[#1D1815] mt-0.5">${formatPrice(p.priceUSD)}</p>
        </div>
        <span class="text-xs text-[#C5A674]">Inspect →</span>
      </div>
    `).join('');
  }

  // Lookbook Switcher
  window.switchLookbook = function(index) {
    const look = JEWELUX_DATA.lookbooks[index];
    if (!look) return;

    const imgEl = document.getElementById('lookbook-image');
    const titleEl = document.getElementById('lookbook-title');
    const subEl = document.getElementById('lookbook-subtitle');
    const prodTitleEl = document.getElementById('lookbook-prod-title');
    const prodBtnEl = document.getElementById('lookbook-prod-btn');

    if (imgEl) {
      imgEl.style.opacity = '0';
      setTimeout(() => {
        imgEl.src = look.image;
        imgEl.style.opacity = '1';
      }, 250);
    }
    if (titleEl) titleEl.textContent = look.title;
    if (subEl) subEl.textContent = look.subtitle;
    if (prodTitleEl) prodTitleEl.textContent = look.featuredProductTitle;
    if (prodBtnEl) {
      prodBtnEl.onclick = () => openProductPage(look.featuredProduct);
    }

    document.querySelectorAll('[data-lookbook-index]').forEach(tab => {
      const active = parseInt(tab.dataset.lookbookIndex, 10) === index;
      tab.classList.toggle('bg-[#1D1815]', active);
      tab.classList.toggle('text-white', active);
      tab.classList.toggle('bg-white', !active);
      tab.classList.toggle('text-[#766B5E]', !active);
    });
  };

  // Sticky Header Effect
  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }
  });

  // Mobile Menu
  window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden');
  };

  // ================= 14. INITIALIZATION =================
  renderAllProductGrids();
  renderCollections();
  renderCraftsmanshipSteps();
  renderFaqs();
  renderBoutiques();
  renderCart();
  renderWishlist();
  updateBadges();
  updateBespokeUI();
  handleRoute();
});
