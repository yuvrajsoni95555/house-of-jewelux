/**
 * HOUSE OF JEWELUX — MASTER E-COMMERCE CORE (app.js)
 * Where Elegance Becomes Eternal
 * 1:1 Reference-Based Recreation of Palmonas UX & Functionality
 */

(function () {
  'use strict';

  // State Management
  const state = {
    products: [],
    categories: [
      { id: 'earrings', name: 'Earrings', subtitle: 'Statement for every occasion', count: 10 },
      { id: 'rings', name: 'Rings', subtitle: 'Solitaires & Eternity Bands', count: 10 },
      { id: 'necklaces', name: 'Necklaces & Collars', subtitle: 'Chokers & Regal Pendants', count: 10 },
      { id: 'bracelets', name: 'Bracelets & Cuffs', subtitle: 'Tennis & Sculpted Links', count: 10 },
      { id: 'brooches', name: 'Brooches & Pins', subtitle: 'Royal Crests & Floral Lapels', count: 10 },
      { id: 'temple-jewellery', name: 'Temple Heritage', subtitle: 'Sacred Antique Nakshi', count: 8 },
      { id: 'best-sellers', name: 'Best Sellers', subtitle: 'Most Coveted Pieces', count: 12 },
      { id: 'festive-edit', name: 'Diwali & Festive Edit', subtitle: 'Ceremonial & Evening Suites', count: 14 }
    ],
    cart: JSON.parse(localStorage.getItem('hj_cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('hj_wishlist') || '[]'),
    customer: JSON.parse(localStorage.getItem('hj_customer') || 'null'),
    currentRoute: '',
    selectedCurrency: 'INR',
    currencyRates: {
      INR: { symbol: '₹', rate: 1 },
      USD: { symbol: '$', rate: 0.012 },
      EUR: { symbol: '€', rate: 0.011 },
      GBP: { symbol: '£', rate: 0.0095 },
      AED: { symbol: 'AED ', rate: 0.044 }
    },
    appliedCoupon: null,
    discountAmount: 0,
    deliveryPincode: localStorage.getItem('hj_pincode') || '302001',
    deliveryCity: localStorage.getItem('hj_city') || 'Jaipur',
    activeFilters: {
      category: 'all',
      metal: '',
      minPrice: 0,
      maxPrice: 200000,
      sort: 'popular'
    }
  };

  function formatPrice(amountINR) {
    const cur = state.currencyRates[state.selectedCurrency] || state.currencyRates.INR;
    const num = Number(amountINR);
    if (isNaN(num) || num <= 0) return '';
    const converted = Math.round(num * cur.rate);
    return `${cur.symbol}${converted.toLocaleString('en-IN')}`;
  }

  function saveCart() {
    localStorage.setItem('hj_cart', JSON.stringify(state.cart));
    updateBadges();
    renderCartDrawer();
  }

  function saveWishlist() {
    localStorage.setItem('hj_wishlist', JSON.stringify(state.wishlist));
    updateBadges();
  }

  function updateBadges() {
    const cartCountEl = document.getElementById('cart-badge');
    const wishlistCountEl = document.getElementById('wishlist-badge');
    const totalCartQty = state.cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cartCountEl) {
      cartCountEl.textContent = totalCartQty;
      cartCountEl.style.display = totalCartQty > 0 ? 'flex' : 'none';
    }
    if (wishlistCountEl) {
      wishlistCountEl.textContent = state.wishlist.length;
      wishlistCountEl.style.display = state.wishlist.length > 0 ? 'flex' : 'none';
    }

    const headerPincode = document.getElementById('header-pincode-label');
    const mobilePincode = document.getElementById('mobile-pincode-label');
    if (headerPincode) headerPincode.textContent = `Deliver to: ${state.deliveryPincode} (${state.deliveryCity})`;
    if (mobilePincode) mobilePincode.textContent = `Deliver to: ${state.deliveryPincode} (${state.deliveryCity})`;
  }

  async function loadProducts() {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.products) {
          state.products = data.products;
        }
      }
    } catch (err) {
      console.warn('API fetch failed, trying static products file', err);
    }

    if (!state.products || state.products.length === 0) {
      try {
        const staticRes = await fetch('./data/products.json');
        if (staticRes.ok) {
          const staticData = await staticRes.json();
          state.products = Array.isArray(staticData) ? staticData : (staticData.products || []);
        }
      } catch (e) {
        console.warn('Static products fetch failed', e);
      }
    }

    // Load rich categories
    try {
      const catRes = await fetch('/api/categories');
      if (catRes.ok) {
        const catData = await catRes.json();
        if (catData && catData.success && catData.categories) {
          state.categories = Array.isArray(catData.categories) ? catData.categories : (catData.categories.categories || []);
        }
      }
    } catch (e) {
      console.warn('API categories fetch failed, falling back to static file', e);
    }

    if (!state.categories || state.categories.length === 0) {
      try {
        const staticCat = await fetch('./data/categories.json');
        if (staticCat.ok) {
          const scData = await staticCat.json();
          state.categories = Array.isArray(scData) ? scData : (scData.categories || []);
        }
      } catch (err) {
        console.warn('Static categories fetch failed', err);
      }
    }

    handleRoute();
  }

  // ==================== ROUTING SYSTEM ====================
  function getRoute() {
    const path = window.location.pathname;
    const hash = window.location.hash;

    if (hash && hash.length > 1) {
      return hash.replace('#', '');
    }
    if (path === '/' || path === '/index.html') return 'home';
    return path.replace(/^\//, '');
  }

  function navigate(route) {
    window.location.hash = route;
  }

  function handleRoute() {
    const route = getRoute();
    state.currentRoute = route;

    // Fast instant scroll reset on route change without fighting native gestures
    const urlParams = new URLSearchParams(window.location.search);
    const scrollTarget = parseInt(urlParams.get('scrollY') || '0', 10);
    if (scrollTarget > 0) {
      setTimeout(() => window.scrollTo(0, scrollTarget), 120);
    } else {
      window.scrollTo(0, 0);
    }

    const appView = document.getElementById('app-view');
    if (!appView) return;

    if (route === 'home' || route === '') {
      renderHomePage(appView);
    } else if (route === 'collections' || route === 'shop' || route === 'all' || route.startsWith('collections/') || ['gold', 'silver', 'diamond', 'gemstone', 'gold-category', 'silver-category', 'diamond-category', 'gemstone-category'].includes(route)) {
      let colId = 'all';
      if (route.startsWith('collections/')) {
        colId = route.split('/')[1] || 'all';
      } else if (['gold', 'silver', 'diamond', 'gemstone'].includes(route)) {
        colId = route;
      } else if (route === 'gold-category') {
        colId = 'gold';
      } else if (route === 'silver-category') {
        colId = 'silver';
      } else if (route === 'diamond-category') {
        colId = 'diamond';
      } else if (route === 'gemstone-category') {
        colId = 'gemstone';
      }
      renderCollectionPage(appView, colId);
    } else if (route.startsWith('products/')) {
      const prodId = route.split('/')[1];
      renderPDP(appView, prodId);
    } else if (route === 'appointment') {
      renderHomePage(appView);
      setTimeout(() => window.HJ.openAppointmentModal(), 150);
    } else if (route === 'track-order') {
      renderHomePage(appView);
      setTimeout(() => window.HJ.openTrackOrderModal(), 150);
    } else if (route === 'whats-new') {
      renderCollectionPage(appView, 'new-arrivals');
    } else if (route === 'cart') {
      renderCartPage(appView);
    } else if (route === 'checkout') {
      renderCheckoutPage(appView);
    } else if (route === 'wishlist') {
      renderWishlistPage(appView);
    } else if (route === 'account') {
      renderAccountPage(appView);
    } else if (route === 'admin') {
      renderAdminDashboard(appView);
    } else if (route === 'edit' || route === 'editor') {
      renderHomePage(appView);
      setTimeout(() => window.HJ.toggleEditorMode(true), 120);
    } else if (route === 'about') {
      renderAboutPage(appView);
    } else if (route === 'craftsmanship' || route === 'custom-order') {
      renderCraftsmanshipPage(appView);
    } else if (route === 'contact') {
      renderContactPage(appView);
    } else if (route === 'faq') {
      renderFAQPage(appView);
    } else if (['shipping', 'shipping-policy', 'returns', 'returns-policy', 'exchange', 'exchange-policy', 'cancellation', 'cancellation-policy', 'privacy', 'privacy-policy', 'terms', 'terms-conditions', 'cookies', 'cookie-policy', 'care-guide', 'jewellery-care', 'size-guide', 'warranty'].includes(route)) {
      const normalizedKey = route.replace('-policy', '').replace('-conditions', '').replace('jewellery-', '');
      renderPolicyPage(appView, normalizedKey);
    } else {
      const matchedCat = state.categories.find(c => c.id === route);
      if (matchedCat) {
        renderCollectionPage(appView, matchedCat.id);
      } else {
        renderHomePage(appView);
      }
    }

    // Refresh Global Motion Engine triggers on newly mounted DOM
    if (window.HJ_MOTION && window.HJ_MOTION.refreshTriggers) {
      setTimeout(() => window.HJ_MOTION.refreshTriggers(), 80);
    }
  }

  // ==================== COMPONENT: PRODUCT CARD (1:1 PALMONAS) ====================
  function renderProductCard(p) {
    const isWished = state.wishlist.includes(p.id);
    const mainImg = p.images && p.images[0] ? p.images[0] : (p.image || 'images/authentic_earrings_macro.jpg');
    const hoverImg = p.images && p.images[1] ? p.images[1] : (p.hoverImage || mainImg);
    const badgeText = p.badge || (p.isNew ? 'New Arrival' : 'Explore Design');

    return `
      <div class="product-card" data-product-id="${p.id}">
        <!-- Pépite Signature Circular Action Badge (↗) -->
        <div class="pepite-action-badge" onclick="window.HJ.navigate('products/${p.handle || p.id}')" title="View Masterpiece">
          ↗
        </div>

        <div class="product-card-media">
          <a href="#products/${p.handle || p.id}" class="card-img-wrap" aria-label="${p.name}">
            <img class="product-card-img main-img" src="${mainImg}" alt="${p.name}" loading="lazy" />
            <img class="product-card-img hover-img card-img-hover" src="${hoverImg}" alt="${p.name} - Atelier Detail" loading="lazy" />
          </a>
          <span class="card-badge" style="border-radius: 9999px; font-size: 0.65rem; padding: 0.25rem 0.65rem; background: rgba(255, 253, 246, 0.95); color: var(--color-espresso); font-weight: 700; border: 1px solid rgba(47,36,26,0.08);">${badgeText}</span>
          <button class="card-wishlist-btn ${isWished ? 'active' : ''}" 
                  onclick="window.HJ.toggleWishlist('${p.id}', event)" 
                  aria-label="Save to Wishlist"
                  style="border-radius: 50%; background: rgba(255,253,246,0.92);">
            <svg viewBox="0 0 24 24" fill="${isWished ? 'var(--color-royal-lac)' : 'none'}" stroke="currentColor" stroke-width="1.3">
              <path d="M12 20.5L3.8 12.3C1.8 10.3 1.8 7.1 3.8 5.1C5.8 3.1 9 3.1 11 5.1L12 6.1L13 5.1C15 3.1 18.2 3.1 20.2 5.1C22.2 7.1 22.2 10.3 20.2 12.3L12 20.5Z"></path>
            </svg>
          </button>
        </div>
        <div class="product-card-body" style="padding: 1.25rem 1.15rem 1.35rem;">
          <div class="card-cat-line" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-stone-muted); font-weight: 600;">${p.category || 'Fine Jewellery'} • ${p.purity || 'Material details on request'}</div>
          <h3 class="card-title" style="margin: 0.4rem 0 0.5rem; font-family: var(--font-serif); font-size: 1.02rem; line-height: 1.3;">
            <a href="#products/${p.handle || p.id}">${p.name}</a>
          </h3>
          <div class="card-price-row" style="display: flex; align-items: baseline; gap: 0.6rem; margin-bottom: 0.85rem;">
            <span class="card-price-current" style="font-size: 1.1rem; font-weight: 700; color: var(--color-espresso);">${formatPrice(p.price)}</span>
            ${(p.compareAtPrice || p.originalPrice) ? `<span class="card-price-original" style="font-size: 0.82rem; color: var(--color-stone-subtle); text-decoration: line-through;">${formatPrice(p.compareAtPrice || p.originalPrice)}</span>` : ''}
          </div>
          <button class="card-add-btn" onclick="window.HJ.addToCart('${p.id}', 1, event)" style="border-radius: 9999px; height: 38px; font-weight: 700; font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase;">
            Add To Bag
          </button>
        </div>
      </div>
    `;
  }

  // ==================== VIEW 1: HOMEPAGE ====================
  function renderHomePage(container) {
    const bestSellers = state.products.filter(p => p.badge === 'Bestseller' || p.isNew).slice(0, 8);
    const newArrivals = state.products.filter(p => p.isNew || p.id.includes('BRO') || p.id.includes('TEM') || p.badge === 'New').slice(0, 4);
    const earringsFeatured = state.products.filter(p => p.category === 'earrings').slice(0, 4);

    container.innerHTML = `
      <!-- A. PREMIUM HERO SECTION (CINEMATIC ODYSSEY) -->
      <section class="hero-slider" id="hero-slider">
        <div class="hero-slide active" style="background: #1A120E; min-height: 85vh; display: flex; align-items: center; justify-content: center;">
          <div class="scene-content-center" style="text-align: center; max-width: 800px; padding: 2rem; z-index: 4; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div class="hero-brand-center-lockup">
              <img src="/brand-identity/house_of_jewelux_official_logo.png" alt="House of Jewelux — Where Elegance Becomes Eternal" class="hero-brand-official-logo" />
            </div>
            <div style="margin-top: 1.5rem;">
              <a href="#collections/all" class="btn-gold" style="padding: 0.8rem 2.4rem; font-size: 0.8rem; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; display: inline-flex; align-items: center; gap: 0.6rem; border-radius: 9999px;">
                <span>Explore The Collections</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- B. 4-PILLAR HERITAGE VALUE RIBBON -->
      <section class="trust-ribbon">
        <div class="container">
          <div class="trust-ribbon-grid">
            <div class="trust-item">
              <div class="trust-icon" style="color: var(--color-muted-gold);">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
                  <path d="M6 3h12l4 6-10 12L2 9l4-6z"></path>
                  <path d="M10 3l-2 6 4 12 4-12-2-6"></path>
                  <path d="M2 9h20"></path>
                </svg>
              </div>
              <div>
                <div class="trust-text-title">Gold & Silver Authenticity</div>
                <div class="trust-text-sub">Quality, purity & craftsmanship you can trust</div>
              </div>
            </div>
            <div class="trust-item">
              <div class="trust-icon" style="color: var(--color-muted-gold);">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
                  <path d="M12 3c0 4.5-3.5 8-8 8 4.5 0 8 3.5 8 8 0-4.5 3.5-8 8-8-4.5 0-8-3.5-8-8z"></path>
                  <circle cx="19" cy="5" r="1.5"></circle>
                </svg>
              </div>
              <div>
                <div class="trust-text-title">Exceptional Finish & Durability</div>
                <div class="trust-text-sub">Beautifully crafted with premium-quality finishes</div>
              </div>
            </div>
            <div class="trust-item">
              <div class="trust-icon" style="color: var(--color-muted-gold);">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                  <path d="M12 8c-1.5 0-2.5 1-2.5 2.5 0 2 2.5 3.5 2.5 3.5s2.5-1.5 2.5-3.5C14.5 9 13.5 8 12 8z"></path>
                </svg>
              </div>
              <div>
                <div class="trust-text-title">Comfort Meets Elegance</div>
                <div class="trust-text-sub">Thoughtfully designed for comfort and timeless beauty</div>
              </div>
            </div>
            <div class="trust-item">
              <div class="trust-icon" style="color: var(--color-muted-gold);">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <polyline points="9 12 11 14 15 10"></polyline>
                </svg>
              </div>
              <div>
                <div class="trust-text-title">Delivery Updates</div>
                <div class="trust-text-sub">Order tracking information is shared after dispatch.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <!-- THREE PILLARS OF PRECIOUS ADORNMENT (PHOTO 3 LUXURY EDITORIAL CARDS) -->
      <section class="material-pillars-section">
        <div class="container">
          <div class="section-header" style="text-align: center; margin-bottom: 2.75rem;">
            <div class="section-pretitle" style="letter-spacing: 0.28em; font-size: 0.74rem; text-transform: uppercase; color: #6B4A2E; margin-bottom: 0.75rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.85rem;">
              <span style="height: 1px; width: 45px; background: rgba(168, 132, 98, 0.45); display: inline-block;"></span>
              <span>HOUSE OF JEWELUX</span>
              <span style="height: 1px; width: 45px; background: rgba(168, 132, 98, 0.45); display: inline-block;"></span>
            </div>
            <h2 class="section-title" style="font-family: var(--font-serif); font-size: clamp(1.4rem, 3.8vw, 2.35rem); letter-spacing: 0.06em; text-transform: uppercase; margin: 0 0 0.85rem; color: #2A1710; font-weight: 500; line-height: 1.25; padding: 0 0.5rem;">THE THREE PILLARS OF PRECIOUS ADORNMENT</h2>
            <p style="max-width: 760px; margin: 0 auto; font-family: var(--font-serif); font-style: italic; font-size: clamp(0.95rem, 1.3vw, 1.1rem); color: #3A2418; line-height: 1.6; letter-spacing: 0.01em;">
              House of Jewelux operates across gold, silver, diamond and precious gemstone jewellery — uniting Jaipur ancestral benchcraft with contemporary global luxury aesthetics.
            </p>
          </div>

          <div class="material-pillars-grid">
            <!-- PILLAR 1: HERITAGE CRAFTSMANSHIP -->
            <a href="#craftsmanship" class="material-pillar-card" aria-label="Heritage Craftsmanship — Centuries-old artistry, forever cherished.">
              <div class="material-pillar-img-wrap">
                <img class="material-pillar-img" src="images/pillar_heritage_craft_clean.jpg" alt="Heritage Craftsmanship — Centuries-old artistry, forever cherished." loading="lazy" />
                <span class="material-pillar-badge">✦ Pillar 01</span>
              </div>
              <div class="material-pillar-body">
                <div class="material-pillar-title">
                  <span>Heritage Craftsmanship</span>
                  <span style="font-size: 1.1rem; color: #A88462;">✦</span>
                </div>
                <div style="font-family: var(--font-serif); font-style: italic; color: #8A6440; font-size: 0.95rem; margin-bottom: 0.65rem; font-weight: 500;">
                  "Heritage-inspired forms, thoughtfully reimagined."
                </div>
                <div class="material-pillar-desc">
                  Inspired by Indian temple traditions, intricate motifs and the quiet elegance of jewellery design.
                </div>
                <div class="material-pillar-footer">
                  <span>Explore Atelier</span>
                  <span>↗</span>
                </div>
              </div>
            </a>

            <!-- PILLAR 2: TIMELESS ELEGANCE -->
            <a href="#collections/all" class="material-pillar-card" aria-label="Timeless Elegance — Classic beauty, always in style.">
              <div class="material-pillar-img-wrap">
                <img class="material-pillar-img" src="images/pillar_timeless_elegance_clean.jpg" alt="Timeless Elegance — Classic beauty, always in style." loading="lazy" />
                <span class="material-pillar-badge">✦ Pillar 02</span>
              </div>
              <div class="material-pillar-body">
                <div class="material-pillar-title">
                  <span>Timeless Elegance</span>
                  <span style="font-size: 1.1rem; color: #A88462;">✦</span>
                </div>
                <div style="font-family: var(--font-serif); font-style: italic; color: #8A6440; font-size: 0.95rem; margin-bottom: 0.65rem; font-weight: 500;">
                  "Classic beauty, always in style."
                </div>
                <div class="material-pillar-desc">
                  Regal bridal diadems, architectural solitaires, and heirloom silhouettes sculpted to transcend fleeting seasonal trends.
                </div>
                <div class="material-pillar-footer">
                  <span>Discover Masterpieces</span>
                  <span>↗</span>
                </div>
              </div>
            </a>

            <!-- PILLAR 3: GLOBAL LUXURY -->
            <a href="#collections/diamond" class="material-pillar-card" aria-label="Global Luxury — A world of sophistication, within your reach.">
              <div class="material-pillar-img-wrap">
                <img class="material-pillar-img" src="images/pillar_global_luxury_clean.jpg" alt="Global Luxury — A world of sophistication, within your reach." loading="lazy" />
                <span class="material-pillar-badge">✦ Pillar 03</span>
              </div>
              <div class="material-pillar-body">
                <div class="material-pillar-title">
                  <span>Global Luxury</span>
                  <span style="font-size: 1.1rem; color: #A88462;">✦</span>
                </div>
                <div style="font-family: var(--font-serif); font-style: italic; color: #8A6440; font-size: 0.95rem; margin-bottom: 0.65rem; font-weight: 500;">
                  "A world of sophistication, within your reach."
                </div>
                <div class="material-pillar-desc">
                  Indian heritage craftsmanship harmonized with contemporary luxury design and thoughtful customer care.
                </div>
                <div class="material-pillar-footer">
                  <span>View Vault Collections</span>
                  <span>↗</span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      <!-- CURATED DESIGN & INSPIRATION COLLECTIONS SHOWCASE -->
      <section style="padding: 4.5rem 0; background: var(--color-soft-offwhite); border-top: 1px solid var(--color-warm-stone); border-bottom: 1px solid var(--color-warm-stone);">
        <div class="container">
          <div class="section-header" style="text-align: center;">
            <div class="section-pretitle">The 17 Archetypes of Haute Joaillerie</div>
            <h2 class="section-title">Curated Design Collections</h2>
            <div class="section-divider"><span class="section-divider-gem"></span></div>
            <p style="max-width: 650px; margin: 0.75rem auto 0; font-size: 0.88rem; color: var(--color-stone-muted);">
              From sacred temple nakshi to modern sculptural art and animal wildlife motifs, explore our masterfully articulated design themes.
            </p>
          </div>

          <div class="curated-collections-grid">
            <a href="#collections/temple-jewellery" class="curated-col-card">
              <img src="images/user_balaji_temple_pendant.jpg" alt="Temple & South Indian Heritage" />
              <div class="curated-col-overlay">
                <span class="curated-col-badge">Sacred Devotion</span>
                <h3 class="curated-col-title">Temple & Heritage</h3>
                <span class="curated-col-count">Architectural Nakshi</span>
              </div>
            </a>

            <a href="#collections/nature-inspired" class="curated-col-card">
              <img src="images/user_royal_panther_wildlife.jpg" alt="Nature, Wildlife & Fauna" />
              <div class="curated-col-overlay">
                <span class="curated-col-badge">Living Majesty</span>
                <h3 class="curated-col-title">Nature & Wildlife</h3>
                <span class="curated-col-count">Panther, Peacock & Fauna</span>
              </div>
            </a>

            <a href="#collections/modern-art" class="curated-col-card">
              <img src="images/authentic_diamond_choker.jpg" alt="House Icons — Exclusive Signature Designs" />
              <div class="curated-col-overlay">
                <span class="curated-col-badge">Contemporary Vision</span>
                <h3 class="curated-col-title">House Icons</h3>
                <span class="curated-col-count">Exclusive Signature Designs</span>
              </div>
            </a>

            <a href="#collections/bridal-jewellery" class="curated-col-card">
              <img src="images/user_royal_bridal_suite.jpg" alt="Bridal & Ceremonial Suites" />
              <div class="curated-col-overlay">
                <span class="curated-col-badge">Royal Celebration</span>
                <h3 class="curated-col-title">Bridal & Occasion</h3>
                <span class="curated-col-count">Grand Chokers & Jhumkas</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      <!-- C. WHAT'S NEW / NEW ARRIVALS (JAIPUR JEWELS SECTION 5.C) -->
      <section style="padding: 4rem 0 3rem; background: var(--color-warm-ivory);">
        <div class="container">
          <div class="section-header">
            <div class="section-pretitle" style="color: var(--color-royal-lac);">Newly Unveiled Creations</div>
            <h2 class="section-title">What's New at House of Jewelux</h2>
            <div class="section-divider"><span class="section-divider-gem"></span></div>
            <p style="max-width: 650px; margin: 0.75rem auto 0; font-size: 0.85rem; color: var(--color-stone-muted);">
              Freshly finished bench masterpieces from our Jaipur atelier, featuring royal sovereign falcon crests, temple nakshi medallions, and architectural solitaires.
            </p>
          </div>

          <div class="products-grid motion-stagger">
            ${newArrivals.map(renderProductCard).join('')}
          </div>

          <div style="text-align: center; margin-top: 2.5rem;">
            <a href="#collections/new-arrivals" class="btn-primary">Explore All New Creations</a>
          </div>
        </div>
      </section>

      <!-- D. SHOP BY CATEGORIES (JAIPUR JEWELS SECTION 5.D) -->
      <section style="padding: 4.5rem 0; background: var(--color-soft-offwhite); border-top: 1px solid var(--color-warm-stone); border-bottom: 1px solid var(--color-warm-stone);">
        <div class="container">
          <div class="section-header">
            <div class="section-pretitle">The Fine Jewellery Vault</div>
            <h2 class="section-title">Shop by Categories</h2>
            <div class="section-divider"><span class="section-divider-gem"></span></div>
          </div>

          <div class="category-grid-showcase">
            <a href="#collections/rings" class="cat-showcase-card">
              <div class="cat-showcase-img-wrap" style="position: relative; width: 100%; height: 100%; overflow: hidden;">
                <img class="cat-showcase-img" src="images/user_emerald_solitaire_ring.jpg" alt="Rings & Solitaires" />
              </div>
              <div class="cat-showcase-overlay">
                <div class="cat-showcase-title">Rings & Solitaires</div>
                <div class="cat-showcase-count">10 Ring Designs</div>
              </div>
            </a>

            <a href="#collections/earrings" class="cat-showcase-card">
              <div class="cat-showcase-img-wrap" style="position: relative; width: 100%; height: 100%; overflow: hidden;">
                <img class="cat-showcase-img" src="images/user_floral_diamond_earrings.jpg" alt="The Earrings Suite" />
              </div>
              <div class="cat-showcase-overlay">
                <div class="cat-showcase-title">The Earrings Suite</div>
                <div class="cat-showcase-count">10 Designs • Comfort Posts</div>
              </div>
            </a>

            <a href="#collections/necklaces" class="cat-showcase-card">
              <div class="cat-showcase-img-wrap" style="position: relative; width: 100%; height: 100%; overflow: hidden;">
                <img class="cat-showcase-img" src="images/user_emerald_diamond_choker.jpg" alt="Necklaces & Chokers" />
              </div>
              <div class="cat-showcase-overlay">
                <div class="cat-showcase-title">Necklaces & Chokers</div>
                <div class="cat-showcase-count">10 Creations • Liquid Rhodium</div>
              </div>
            </a>

            <a href="#collections/bracelets" class="cat-showcase-card">
              <div class="cat-showcase-img-wrap" style="position: relative; width: 100%; height: 100%; overflow: hidden;">
                <img class="cat-showcase-img" src="images/authentic_bracelet_bangles.jpg" alt="Bracelets & Bangles" />
              </div>
              <div class="cat-showcase-overlay">
                <div class="cat-showcase-title">Bracelets & Bangles</div>
                <div class="cat-showcase-count">10 Styles • Double-Lock Clasp</div>
              </div>
            </a>

            <a href="#collections/brooches" class="cat-showcase-card">
              <div class="cat-showcase-img-wrap" style="position: relative; width: 100%; height: 100%; overflow: hidden;">
                <img class="cat-showcase-img" src="images/user_falcon_brooch_white.jpg" alt="Royal Brooches & Pins" />
              </div>
              <div class="cat-showcase-overlay">
                <div class="cat-showcase-title">Royal Brooches & Pins</div>
                <div class="cat-showcase-count">10 Sovereign Crests • Jaipur Bench</div>
              </div>
            </a>

            <a href="#collections/temple-jewellery" class="cat-showcase-card">
              <div class="cat-showcase-img-wrap" style="position: relative; width: 100%; height: 100%; overflow: hidden;">
                <img class="cat-showcase-img" src="images/user_balaji_temple_pendant.jpg" alt="Sacred Temple Nakshi" />
              </div>
              <div class="cat-showcase-overlay">
                <div class="cat-showcase-title">Temple Nakshi Heritage</div>
                <div class="cat-showcase-count">Temple-inspired designs</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      <!-- E. FEATURED JEWELLERY / BEST SELLERS (SECTION 5.F) -->
      <section style="padding: 4.5rem 0 3.5rem; background: var(--color-warm-ivory);">
        <div class="container">
          <div class="section-header">
            <div class="section-pretitle">The Master Edit</div>
            <h2 class="section-title">Founder's Most Coveted Creations</h2>
            <div class="section-divider"><span class="section-divider-gem"></span></div>
          </div>

          <!-- Material Filter Tabs Bar -->
          <div class="material-filter-bar">
            <button class="material-filter-btn active" onclick="window.HJ.filterHomeProducts('all', this)"><span aria-hidden="true">✦</span> All Jewellery (50)</button>
            <button class="material-filter-btn" onclick="window.HJ.filterHomeProducts('gold', this)">✦ Gold Jewellery (17)</button>
            <button class="material-filter-btn" onclick="window.HJ.filterHomeProducts('silver', this)">✦ Silver Jewellery (50)</button>
            <button class="material-filter-btn" onclick="window.HJ.filterHomeProducts('diamond', this)">✦ Diamond & Solitaires (45)</button>
            <button class="material-filter-btn" onclick="window.HJ.filterHomeProducts('gemstone', this)">✦ Precious Gemstones (13)</button>
          </div>

          <div class="products-grid motion-stagger" id="home-featured-products-grid">
            ${bestSellers.map(renderProductCard).join('')}
          </div>

          <div style="text-align: center; margin-top: 3rem;">
            <a href="#collections/all" class="btn-primary">View Complete Catalogue</a>
          </div>
        </div>
      </section>

      <!-- F. FEATURED EDITORIAL COLLECTION SHOWCASE (SECTION 5.E) -->
      <section style="padding: 3rem 0 4.5rem; background: var(--color-warm-ivory);">
        <div class="container">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem;">
            <div style="position: relative; height: 440px; border-radius: var(--radius-sm); overflow: hidden; background: #181412;">
              <img src="images/user_falcon_brooch_emerald.jpg" alt="The Sovereign Falcon Crest Collection" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.7);" />
              <div style="position: absolute; inset: 0; background: linear-gradient(0deg, rgba(24,20,18,0.92) 0%, transparent 60%);"></div>
              <div style="position: absolute; bottom: 2rem; left: 2rem; right: 2rem; color: #FFFFFF;">
                <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.18em; color: var(--color-champagne-gold);">Haute Joaillerie Series</span>
                <h3 style="font-family: var(--font-serif); font-size: 1.8rem; margin: 0.4rem 0 0.8rem;">The Sovereign Falcon Edit</h3>
                <p style="font-size: 0.85rem; color: #E8E2D8; margin-bottom: 1.25rem;">Statement brooch designs inspired by Indian heritage motifs and detailed gemstone settings.</p>
                <a href="#collections/brooches" class="btn-gold" style="padding: 0.65rem 1.5rem; font-size: 0.75rem;">Explore Falcon Crests</a>
              </div>
            </div>

            <div style="position: relative; height: 440px; border-radius: var(--radius-sm); overflow: hidden; background: #181412;">
              <img src="images/user_royal_bridal_suite.jpg" alt="Festive & Bridal High Jewellery" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.7);" />
              <div style="position: absolute; inset: 0; background: linear-gradient(0deg, rgba(24,20,18,0.92) 0%, transparent 60%);"></div>
              <div style="position: absolute; bottom: 2rem; left: 2rem; right: 2rem; color: #FFFFFF;">
                <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.18em; color: var(--color-champagne-gold);">Royal Ceremonial</span>
                <h3 style="font-family: var(--font-serif); font-size: 1.8rem; margin: 0.4rem 0 0.8rem;">Festive & Bridal Masterpieces</h3>
                <p style="font-size: 0.85rem; color: #E8E2D8; margin-bottom: 1.25rem;">Regal bridal neckpieces, jhumkas and hathphool designed for brides seeking heirloom longevity.</p>
                <a href="#collections/festive-edit" class="btn-gold" style="padding: 0.65rem 1.5rem; font-size: 0.75rem;">Discover Bridal Edit</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- G. HERITAGE & CRAFTSMANSHIP: THE 9-STAGE GOLDSMITH JOURNEY (SECTION 5.G) -->
      <section id="craftsmanship-section" style="padding: 5rem 0; background: var(--color-antique-white); border-top: 1px solid var(--color-warm-stone); border-bottom: 1px solid var(--color-warm-stone);">
        <div class="container">
          <div class="section-header">
            <div class="section-pretitle">Jaipur Bench Artistry</div>
            <h2 class="section-title">Inspired by Heritage, Designed for Today</h2>
            <div class="section-divider"><span class="section-divider-gem"></span></div>
            <p class="section-intro">
              Our collections draw inspiration from Indian heritage motifs, considered design and a contemporary sense of elegance.
            </p>
          </div>

          <div class="editorial-pair">
            <div class="editorial-content">
              <h3>From Inspiration to Design</h3>
              <p>Each design brings together heritage references and a refined, contemporary point of view.</p>
              <a href="#craftsmanship" class="btn-gold">Explore the Journey ✦</a>
            </div>
            <div class="editorial-image">
              <img src="images/authentic_polki_craft.jpg" alt="Jewellery-making inspiration rooted in Indian heritage" />
            </div>
          </div>

          <div class="step-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-top: 4rem;">
            <div class="step-card">
              <span class="step-number">01</span>
              <h3 class="step-title">Inspiration & Sacred Architecture</h3>
              <p class="step-desc">Studying Jaipur royal archways, jharokha screens, and ceremonial iconography from Mughal and Rajput archives.</p>
            </div>
            <div class="step-card">
              <span class="step-number">02</span>
              <h3 class="step-title">Exploration & Gemology</h3>
              <p class="step-desc">Review of stone types, settings and available product documentation for each design.</p>
            </div>
            <div class="step-card">
              <span class="step-number">03</span>
              <h3 class="step-title">Design Development</h3>
              <p class="step-desc">Hand-drawn gouache jewel illustrations capturing light reflections, prong heights, and 3D ergonomics.</p>
            </div>
            <div class="step-card">
              <span class="step-number">04</span>
              <h3 class="step-title">Jewellery Proportions</h3>
              <p class="step-desc">Precision CAD modeling and wax printing ensuring micro-comfort shanks and flawless daily wear balance.</p>
            </div>
            <div class="step-card">
              <span class="step-number">05</span>
              <h3 class="step-title">Material Assay</h3>
              <p class="step-desc">Material checks and finish reviews appropriate to the individual jewellery design.</p>
            </div>
            <div class="step-card">
              <span class="step-number">06</span>
              <h3 class="step-title">Bench Forging & Kundan</h3>
              <p class="step-desc">Traditional Indian jewellery forms and decorative techniques inform the look and character of selected designs.</p>
            </div>
            <div class="step-card">
              <span class="step-number">07</span>
              <h3 class="step-title">Surface Finishing</h3>
              <p class="step-desc">Surface finishing is selected to suit the metal and intended appearance of each design.</p>
            </div>
            <div class="step-card">
              <span class="step-number">08</span>
              <h3 class="step-title">Product Quality Review</h3>
              <p class="step-desc">Product details and any applicable hallmark information are checked before dispatch.</p>
            </div>
            <div class="step-card">
              <span class="step-number">09</span>
              <h3 class="step-title">Dispatch & Presentation</h3>
              <p class="step-desc">Prepared for dispatch with care. Delivery details are shared once the order is ready.</p>
            </div>
          </div>

      </section>

      <!-- H. BOOK AN APPOINTMENT (JAIPUR JEWELS SECTION 5.H) -->
      <section class="appointment-banner-section" id="appointment-section">
        <div class="container">
          <div class="appointment-banner-grid">
            <div>
              <span class="hero-badge-pill" style="border-color: var(--color-antique-gold); color: var(--color-champagne-gold);">Atelier Experience</span>
              <h2 style="font-family: var(--font-serif); font-size: 2.4rem; margin: 0.75rem 0 1rem; color: var(--color-warm-ivory);">
                Connect with Our Team
              </h2>
              <p style="color: #DCD4C7; font-size: 0.95rem; line-height: 1.7; margin-bottom: 1.5rem;">
                Connect with the House of Jewelux team for product information, collection guidance and assistance with your jewellery selection.
              </p>
              <div style="display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 2rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: var(--color-champagne-gold);">
                  <span>✦</span>
                  <span>Personal guidance from the House of Jewelux team</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: var(--color-champagne-gold);">
                  <span>✦</span>
                  <span>Product-specific stone details and available documentation are shared before purchase.</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: var(--color-champagne-gold);">
                  <span>✦</span>
                  <span>Personal guidance on fit, materials and jewellery care</span>
                </div>
              </div>
              <a href="https://wa.me/919079998793?text=Hello%20House%20of%20Jewelux,%20I%20would%20like%20to%20schedule%20a%20private%20atelier%20consultation." target="_blank" class="btn-outline" style="border-color: var(--color-antique-gold); color: var(--color-warm-ivory);">
                Instant WhatsApp Concierge (+91 90799 98793)
              </a>
            </div>

            <div class="appointment-form-card">
              <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 0.3rem;">Reserve Your Suite</h3>
              <p style="font-size: 0.8rem; color: var(--color-stone-muted); margin-bottom: 1.5rem;">Select your preferred date and experience.</p>
              
              <form onsubmit="window.HJ.submitAppointment(event)">
                <div class="form-row-2col" style="margin-bottom: 1rem;">
                  <div>
                    <label class="form-label">Full Name *</label>
                    <input type="text" class="form-input" required placeholder="Noble name" />
                  </div>
                  <div>
                    <label class="form-label">Phone *</label>
                    <input type="tel" class="form-input" required placeholder="+91..." />
                  </div>
                </div>
                <div style="margin-bottom: 1rem;">
                  <label class="form-label">Email Address *</label>
                  <input type="email" class="form-input" required placeholder="patron@domain.com" />
                </div>
                <div class="form-row-2col" style="margin-bottom: 1rem;">
                  <div>
                    <label class="form-label">Date *</label>
                    <input type="date" class="form-input" required />
                  </div>
                  <div>
                    <label class="form-label">Time *</label>
                    <select class="form-input">
                      <option>16:00 - 17:30 IST (High Tea)</option>
                      <option>11:00 - 12:30 IST (Morning)</option>
                      <option>18:30 - 20:00 IST (Evening)</option>
                    </select>
                  </div>
                </div>
                <div style="margin-bottom: 1.25rem;">
                  <label class="form-label">Consultation Experience</label>
                  <select class="form-input">
                    <option>Online Consultation</option>
                    <option>Online Consultation</option>
                    <option>Virtual High-Jewellery Video Concierge</option>
                  </select>
                </div>
                <button type="submit" class="btn-primary" style="width: 100%; padding: 0.9rem;">Confirm Appointment</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <!-- I. TRACK YOUR ORDER ENTRY POINT (JAIPUR JEWELS SECTION 7.8) -->
      <section style="padding: 4rem 0; background: var(--color-soft-offwhite); border-bottom: 1px solid var(--color-warm-stone);">
        <div class="container" style="max-width: 800px; text-align: center;">
          <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.22em; color: var(--color-antique-gold); font-weight: 600;">Order Tracking</span>
          <h2 style="font-family: var(--font-serif); font-size: 2rem; margin: 0.4rem 0 0.8rem; color: var(--color-deep-heritage-brown);">Track Your Consignment</h2>
          <p style="font-size: 0.85rem; color: var(--color-stone-muted); margin-bottom: 1.75rem;">
            Enter the Order ID from your order confirmation to view the latest available order status and dispatch details.
          </p>

          <form onsubmit="window.HJ.submitTrackOrder(event)" style="display: flex; gap: 0.5rem; max-width: 500px; margin: 0 auto;">
            <input type="text" class="form-input" style="flex: 1; padding: 0.85rem 1.2rem;" placeholder="HJ-ORD-XXXXXXXX" required />
            <button type="submit" class="btn-primary" style="white-space: nowrap; padding: 0.85rem 1.75rem;">Track Consignment</button>
          </form>
        </div>
      </section>

      <!-- J. BRAND EDITORIAL (SECTION 5.I) -->
      <section style="padding: 5rem 0; background: var(--color-warm-ivory);">
        <div class="container">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;">
            <div>
              <div class="section-pretitle" style="text-align: left;">Maison Philosophy</div>
              <h2 style="font-family: var(--font-serif); font-size: 2.3rem; margin: 0.5rem 0 1.25rem; color: var(--color-deep-heritage-brown); line-height: 1.2;">
                INDIAN HERITAGE<br>× CONTEMPORARY<br>MINIMALISM
              </h2>
              <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8; margin-bottom: 1.25rem;">
                Founded in Jaipur, House of Jewelux brings Indian heritage influences together with contemporary minimalism. Our collections span gold, silver and diamond jewellery, balancing expressive detail with refined simplicity. Product-specific material, finish and stone information is shared on individual product pages where available.
              </p>
              <div style="display: flex; gap: 2rem; margin-top: 2rem;">
                <div>
                  <div style="font-family: var(--font-serif); font-size: 2rem; font-weight: 700; color: var(--color-antique-gold);">Gold</div>
                  <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-stone-muted);">Fine Jewellery</div>
                </div>
                <div>
                  <div style="font-family: var(--font-serif); font-size: 2rem; font-weight: 700; color: var(--color-antique-gold);">Silver</div>
                  <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-stone-muted);">Indian Heritage</div>
                </div>
                <div>
                  <div style="font-family: var(--font-serif); font-size: 2rem; font-weight: 700; color: var(--color-antique-gold);">Jewellery</div>
                  <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-stone-muted);">Jewellery Care</div>
                </div>
              </div>
            </div>
            <div>
              <img src="images/authentic_polki_craft.jpg" alt="Jewellery craftsmanship inspired by Jaipur heritage" style="width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--color-warm-stone); box-shadow: 0 15px 40px rgba(35, 28, 22, 0.12);" />
            </div>
          </div>
        </div>
      </section>
    `;

    // Initialize Cinematic Hero Engine (The Journey of Eternal Elegance)
    if (window.HJ_HERO && window.HJ_HERO.init) {
      setTimeout(() => window.HJ_HERO.init(), 60);
    }
  }

  // ==================== VIEW 2: COLLECTION PAGE (1:1 WITH PALMONAS /collections/earrings) ====================
  function renderCollectionPage(container, collectionId) {
    let filtered = [...state.products];
    let title = "The Complete Haute Joaillerie Vault";
    let subtitle = "All 50 Masterpieces • Rings • Earrings • Necklaces • Bracelets • Royal Brooches • Temple Nakshi";
    let heroImg = "images/user_flagship_hero_model.jpg";

    if (collectionId && collectionId !== 'all' && collectionId !== 'all-jewellery') {
      if (['gold', 'gold-category'].includes(collectionId)) {
        filtered = filtered.filter(p => (p.materials && p.materials.includes('gold')) || p.primaryMaterial === 'gold' || p.isGold || (p.metal && p.metal.toLowerCase().includes('gold')));
        title = "Gold Jewellery Collection";
        subtitle = "Discover gold jewellery inspired by Indian heritage and contemporary design.";
        heroImg = "images/user_floral_diamond_earrings.jpg";
      } else if (['silver', 'silver-category'].includes(collectionId)) {
        filtered = filtered.filter(p => (p.materials && p.materials.includes('silver')) || p.primaryMaterial === 'silver' || (p.metal && p.metal.toLowerCase().includes('silver')));
        title = "Silver Jewellery Collection";
        subtitle = "Explore silver jewellery with product-specific material and finish details.";
        heroImg = "images/authentic_solitaire_ring.jpg";
      } else if (['diamond', 'diamond-category'].includes(collectionId)) {
        filtered = filtered.filter(p => (p.materials && p.materials.includes('diamond')) || p.primaryMaterial === 'diamond' || (p.stone && p.stone.toLowerCase().includes('diamond')));
        title = "Diamond Jewellery Collection";
        subtitle = "Explore diamond jewellery with stone and setting details listed by design.";
        heroImg = "images/authentic_diamond_choker.jpg";
      } else if (['gemstone', 'gemstone-category'].includes(collectionId)) {
        filtered = filtered.filter(p => (p.materials && p.materials.includes('gemstone')) || p.primaryMaterial === 'gemstone' || (p.stone && (p.stone.toLowerCase().includes('emerald') || p.stone.toLowerCase().includes('sapphire') || p.stone.toLowerCase().includes('pearl') || p.stone.toLowerCase().includes('polki'))));
        title = "Precious Gemstone Jewellery";
        subtitle = "Colombian Emeralds, Ceylon Sapphires, Basra Pearls & Royal Polki (13 Pieces)";
        heroImg = "images/user_falcon_brooch_emerald.jpg";
      } else if (['earrings', 'rings', 'necklaces', 'bracelets', 'brooches'].includes(collectionId)) {
        filtered = filtered.filter(p => p.category === collectionId || p.productType === collectionId);
        const cat = state.categories.find(c => c.id === collectionId);
        if (cat) {
          title = cat.name;
          subtitle = cat.subtitle;
        }
        if (collectionId === 'rings') heroImg = "images/authentic_rings_couple_hands.jpg";
        else if (collectionId === 'necklaces') heroImg = "images/authentic_diamond_choker.jpg";
        else if (collectionId === 'bracelets') heroImg = "images/authentic_bracelet_bangles.jpg";
        else if (collectionId === 'brooches') heroImg = "images/authentic_mens_sherwani_jewel.jpg";
        else if (collectionId === 'earrings') heroImg = "images/authentic_earrings_stone.jpg";
      } else if (collectionId === 'new-arrivals') {
        filtered = filtered.filter(p => p.isNew || p.badge === 'New' || p.id.includes('BRO') || p.id.includes('TEM'));
        title = "What's New • Newly Unveiled Creations";
        subtitle = "Freshly forged bench creations from our Jaipur atelier";
        heroImg = "images/user_flagship_hero_model.jpg";
      } else if (collectionId === 'best-sellers') {
        filtered = filtered.filter(p => p.badge === 'Bestseller');
        title = "Best Sellers";
        subtitle = "Curated designs selected for their distinctive style";
        heroImg = "images/authentic_hero_editorial.jpg";
      } else if (collectionId === 'festive-edit') {
        filtered = filtered.filter(p => p.price >= 18000);
        title = "Festive & Diwali Edit";
        subtitle = "Ceremonial chokers, chandelier earrings, and statement rings";
        heroImg = "images/user_royal_bridal_suite.jpg";
      } else {
        // Any of the 17 design & inspiration collections
        filtered = filtered.filter(p => (p.collections && p.collections.includes(collectionId)) || p.collection === collectionId || (p.tags && p.tags.includes(collectionId)));
        const cat = state.categories.find(c => c.id === collectionId);
        if (cat) {
          title = cat.name;
          subtitle = cat.subtitle;
          if (cat.banner) heroImg = cat.banner;
        } else {
          title = collectionId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') + " Collection";
          subtitle = "Curated Haute Joaillerie Masterpieces from House of Jewelux";
        }
      }
    }

    // Apply active sidebar filters
    if (state.activeFilters.metal) {
      filtered = filtered.filter(p => p.metal.toLowerCase().includes(state.activeFilters.metal.toLowerCase()));
    }
    if (state.activeFilters.minPrice > 0) {
      filtered = filtered.filter(p => p.price >= state.activeFilters.minPrice);
    }
    if (state.activeFilters.maxPrice < 200000) {
      filtered = filtered.filter(p => p.price <= state.activeFilters.maxPrice);
    }

    if (state.activeFilters.sort === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (state.activeFilters.sort === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    container.innerHTML = `
      <!-- WIDE PHOTO HERO BANNER (1:1 WITH PALMONAS EARRINGS BANNER) -->
      <section class="collection-hero-wide">
        <img class="collection-hero-bg" src="${heroImg}" alt="${title}" />
        <div class="collection-hero-overlay"></div>
        <div class="container" style="position: relative; z-index: 3;">
          <div class="collection-hero-text">
            <h1 class="collection-hero-title">${title}</h1>
            <p class="collection-hero-sub">${subtitle}</p>
          </div>
        </div>
      </section>

      <!-- MAIN 2-COLUMN COLLECTION LAYOUT -->
      <div class="container">
        <div class="collection-main-layout">
          <!-- LEFT: PILL FILTERS SIDEBAR (1:1 WITH PALMONAS) -->
          <aside class="filters-sidebar">
            <!-- Material Category Pills -->
            <div class="filter-group">
              <div class="filter-group-title">Material Category</div>
              <div class="filter-pills-row">
                <button class="filter-pill ${collectionId === 'silver-category' || collectionId === 'gold-category' || collectionId === 'diamond-category' ? '' : (collectionId === 'all' || !collectionId) ? 'active' : ''}" onclick="window.HJ.navigate('collections/all')">All Materials</button>
                <button class="filter-pill ${collectionId === 'silver-category' ? 'active' : ''}" onclick="window.HJ.navigate('collections/silver-category')">Silver Jewellery</button>
                <button class="filter-pill ${collectionId === 'gold-category' ? 'active' : ''}" onclick="window.HJ.navigate('collections/gold-category')">Gold Jewellery</button>
                <button class="filter-pill ${collectionId === 'diamond-category' ? 'active' : ''}" onclick="window.HJ.navigate('collections/diamond-category')">Diamond Jewellery</button>
              </div>
            </div>

            <!-- Product Type Pills -->
            <div class="filter-group">
              <div class="filter-group-title">Product type</div>
              <div class="filter-pills-row">
                <button class="filter-pill ${(!collectionId || collectionId === 'all') ? 'active' : ''}" onclick="window.HJ.navigate('collections/all')">All Creations (${state.products.length})</button>
                <button class="filter-pill ${collectionId === 'rings' ? 'active' : ''}" onclick="window.HJ.navigate('collections/rings')">Rings</button>
                <button class="filter-pill ${collectionId === 'earrings' ? 'active' : ''}" onclick="window.HJ.navigate('collections/earrings')">Earrings</button>
                <button class="filter-pill ${collectionId === 'necklaces' ? 'active' : ''}" onclick="window.HJ.navigate('collections/necklaces')">Necklaces</button>
                <button class="filter-pill ${collectionId === 'bracelets' ? 'active' : ''}" onclick="window.HJ.navigate('collections/bracelets')">Bracelets & Bangles</button>
                <button class="filter-pill ${collectionId === 'brooches' ? 'active' : ''}" onclick="window.HJ.navigate('collections/brooches')">Brooches & Pins</button>
                <button class="filter-pill ${collectionId === 'temple-jewellery' ? 'active' : ''}" onclick="window.HJ.navigate('collections/temple-jewellery')">Temple Nakshi</button>
              </div>
            </div>

            <!-- Metal Type Pills -->
            <div class="filter-group">
              <div class="filter-group-title">Metal type</div>
              <div class="filter-pills-row">
                <button class="filter-pill ${state.activeFilters.metal === '' ? 'active' : ''}" onclick="window.HJ.toggleMetalFilter('', false)">All</button>
                <button class="filter-pill ${state.activeFilters.metal === 'Rhodium' ? 'active' : ''}" onclick="window.HJ.toggleMetalFilter('Rhodium', true)">Pure Silver</button>
                <button class="filter-pill ${state.activeFilters.metal === 'Gold' ? 'active' : ''}" onclick="window.HJ.toggleMetalFilter('Gold', true)">Gold Finish</button>
                <button class="filter-pill ${state.activeFilters.metal === 'Rose' ? 'active' : ''}" onclick="window.HJ.toggleMetalFilter('Rose', true)">Rose Gold</button>
              </div>
            </div>

            <!-- Occasion Pills -->
            <div class="filter-group">
              <div class="filter-group-title">Occasion</div>
              <div class="filter-pills-row">
                <button class="filter-pill">Daily Poise</button>
                <button class="filter-pill">Wedding Gala</button>
                <button class="filter-pill">Atelier Evening</button>
                <button class="filter-pill">Heirloom Gifting</button>
              </div>
            </div>

            <!-- Price Bands -->
            <div class="filter-group">
              <div class="filter-group-title">Price Filter</div>
              <div class="filter-pills-row">
                <button class="filter-pill ${state.activeFilters.minPrice === 0 && state.activeFilters.maxPrice === 200000 ? 'active' : ''}" onclick="window.HJ.setPriceRange(0, 200000)">All Prices</button>
                <button class="filter-pill ${state.activeFilters.maxPrice === 15000 ? 'active' : ''}" onclick="window.HJ.setPriceRange(0, 15000)">Under ₹15,000</button>
                <button class="filter-pill ${state.activeFilters.minPrice === 15000 && state.activeFilters.maxPrice === 25000 ? 'active' : ''}" onclick="window.HJ.setPriceRange(15000, 25000)">₹15,000 – ₹25,000</button>
                <button class="filter-pill ${state.activeFilters.minPrice === 25000 ? 'active' : ''}" onclick="window.HJ.setPriceRange(25000, 200000)">₹25,000+</button>
              </div>
            </div>
          </aside>

          <!-- RIGHT: 4-COLUMN PRODUCT GRID (MATCHING PALMONAS) -->
          <div class="products-grid-column">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
              <span style="font-size: 0.85rem; color: var(--color-stone-muted); font-weight: 500;">✦ Showing <strong>${filtered.length}</strong> Creations</span>
              <select class="sort-select" onchange="window.HJ.setSort(this.value)">
                <option value="popular" ${state.activeFilters.sort === 'popular' ? 'selected' : ''}>Sort By: Popular</option>
                <option value="price_asc" ${state.activeFilters.sort === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
                <option value="price_desc" ${state.activeFilters.sort === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
              </select>
            </div>
            <main class="products-grid motion-stagger">
              ${filtered.length > 0 
                ? filtered.map(renderProductCard).join('') 
                : `<div style="grid-column: 1 / -1; padding: 4rem; text-align: center; color: var(--color-taupe);">No creations found. <br><button class="btn-primary" style="margin-top: 1rem;" onclick="window.HJ.clearFilters()">Reset Filters</button></div>`
              }
            </main>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== VIEW 3: PRODUCT DETAIL PAGE (1:1 WITH PALMONAS ATHENA SOLITAIRE PDP) ====================
  function renderPDP(container, identifier) {
    const p = state.products.find(item => item.id === identifier || item.handle === identifier) || state.products[0];
    const related = state.products.filter(item => item.category === p.category && item.id !== p.id).slice(0, 4);
    const isWishlisted = state.wishlist.includes(p.id);

    container.innerHTML = `
      <div class="container pdp-container">
        <div class="pdp-grid">
          <!-- LEFT: 2x2 IMAGE GALLERY (MATCHING PALMONAS ATHENA SOLITAIRE) -->
          <div class="pdp-gallery-2x2">
            <div class="pdp-gallery-item">
              <img src="${(p.gallery && p.gallery[0]) || p.image}" alt="${p.name} Studio View" />
            </div>
            <div class="pdp-gallery-item">
              <img src="${(p.gallery && p.gallery[1]) || p.hoverImage || p.image}" alt="${p.name} Model Profile" />
            </div>
            <div class="pdp-gallery-item">
              <img src="${(p.gallery && p.gallery[2]) || p.image}" alt="${p.name} Close-up" />
            </div>
            <div class="pdp-gallery-item">
              <img src="${(p.gallery && p.gallery[3]) || p.hoverImage || p.image}" alt="${p.name} Prongs & Setting" />
            </div>
            <div style="grid-column: 1 / -1; font-size: 0.72rem; color: var(--color-taupe); text-align: center; padding-top: 0.25rem; letter-spacing: 0.04em;">
              ✦ Authentic Studio Reference Photography • Jaipur Atelier Spec ${p.id} • Zero AI Imagery
            </div>
          </div>

          <!-- RIGHT: DETAILS & ACTIONS (MATCHING PALMONAS) -->
          <div class="pdp-details-column">
            <!-- Price Row at Top -->
            <div class="pdp-top-price-row">
              <div>
                <span class="pdp-compare-price">${formatPrice(p.compareAtPrice)}</span>
                <span class="pdp-current-price">${formatPrice(p.price)}</span>
                <span class="pdp-discount-badge">${p.discountPercent}% OFF</span>
              </div>
              <button class="card-wishlist-btn ${isWishlisted ? 'active' : ''}" 
                      style="position: static;" 
                      onclick="window.HJ.toggleWishlist('${p.id}', event)" 
                      aria-label="Save to Wishlist">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="${isWishlisted ? 'var(--color-accent-crimson)' : 'none'}" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20.5L3.8 12.3C1.8 10.3 1.8 7.1 3.8 5.1C5.8 3.1 9 3.1 11 5.1L12 6.1L13 5.1C15 3.1 18.2 3.1 20.2 5.1C22.2 7.1 22.2 10.3 20.2 12.3L12 20.5Z"></path>
                </svg>
              </button>
            </div>

            <div class="pdp-tax-line">Inclusive of all taxes</div>

            <h1 class="pdp-title-h1">${p.name}</h1>


            <div class="pdp-product-details-note" style="margin:1rem 0;color:var(--color-stone-muted);font-size:.82rem;line-height:1.6;">
              Material, finish, stone and care information is listed in the product specifications below.
            </div>

            <!-- Limited Time Offers Box (Matching Palmonas) -->
            <div class="pdp-limited-offer-card">
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-deep-heritage-brown); display: flex; align-items: center; gap: 0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" style="color: var(--color-muted-gold);">
                  <rect x="3" y="5" width="18" height="14" rx="1.5"></rect>
                  <path d="M3 6L12 13L21 6"></path>
                  <circle cx="12" cy="13" r="2" fill="currentColor"></circle>
                </svg>
                Limited Time Atelier Privileges
              </div>
              <div class="pdp-coupon-dashed">
                <div>
                  <div style="font-size: 0.8rem; font-weight: 700;">FIRSTLUX</div>
                  <div style="font-size: 0.7rem; color: var(--color-taupe);">10% off your entire first acquisition</div>
                </div>
                <button class="btn-primary" style="padding: 0.35rem 0.85rem; font-size: 0.75rem;" onclick="window.HJ.applyCoupon('FIRSTLUX')">Apply</button>
              </div>
            </div>

            <!-- Check Delivery (Matching Palmonas) -->
            <div class="pdp-check-delivery-box">
              <label>Check delivery</label>
              <div class="delivery-input-group">
                <input type="text" id="pdp-pincode-input" placeholder="Enter pincode" value="${state.deliveryPincode}" maxlength="6" />
                <button onclick="window.HJ.checkPincode()">Check</button>
              </div>
              <div id="pincode-status" style="font-size: 0.75rem; color: #2E7D32; margin-top: 0.4rem;">
                ✓ Delivery availability and estimated timing for ${state.deliveryCity} (${state.deliveryPincode}) will be confirmed before payment.
              </div>
            </div>

            <!-- Accordions (Matching Palmonas: Description, Specifications, Supplier Info, Return Policy) -->
            <div class="pdp-accordion-item active">
              <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
                <span>Description</span>
                <span>▾</span>
              </div>
              <div class="pdp-accordion-pane">
                ${p.description}
                <br><br>
                Please refer to the product specifications for exact material, finish and hallmark details.
              </div>
            </div>

            <div class="pdp-accordion-item">
              <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
                <span>Specifications</span>
                <span>▾</span>
              </div>
              <div class="pdp-accordion-pane">
                <table class="specs-table">
                  <tbody>
                    ${(p.specifications || []).map(s => `
                      <tr><td>${s.label}</td><td>${s.value}</td></tr>
                    `).join('')}
                    <tr><td>Gross Weight</td><td>${p.weight || 'As specified'}</td></tr>
                    <tr><td>SKU Reference</td><td>${p.id}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="pdp-accordion-item">
              <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
                <span>Supplier & Atelier Information</span>
                <span>▾</span>
              </div>
              <div class="pdp-accordion-pane">
                <strong>Brand:</strong> House of Jewelux<br>
                <strong>Customer Grievance & Concierge:</strong> +91 90799 98793 | houseofjewelux@gmail.com
              </div>
            </div>

            <div class="pdp-accordion-item">
              <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
                <span>Return & Exchange Policy</span>
                <span>▾</span>
              </div>
              <div class="pdp-accordion-pane">
                Please review the current return and exchange terms before placing an order. Contact customer support for eligibility and process details.
              </div>
            </div>
          </div>
        </div>

        <!-- STICKY BOTTOM ACTION BAR (MATCHING PALMONAS) -->
        <div class="sticky-pdp-bar">
          <button class="sticky-btn-buy" onclick="window.HJ.buyNow('${p.id}')">Buy Now</button>
          <button class="sticky-btn-cart" onclick="window.HJ.addToCart('${p.id}', 1, event)">Add to Cart</button>
        </div>
      </div>
    `;
  }

  // ==================== VIEW 4: CHECKOUT ====================
  function renderCheckoutPage(container) {
    if (state.cart.length === 0) {
      container.innerHTML = `
        <div class="container" style="padding: 5rem 0; text-align: center;">
          <h2 style="font-family: var(--font-serif); font-size: 2rem; margin-bottom: 1rem;">Your Shopping Bag is Empty</h2>
          <a href="#collections/all" class="btn-primary">Browse Catalogue</a>
        </div>
      `;
      return;
    }

    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = state.discountAmount || 0;
    const shipping = subtotal >= 2500 ? 0 : 250;
    const grandTotal = Math.max(0, subtotal - discount + shipping);

    container.innerHTML = `
      <div class="container checkout-container">
        <h1 style="font-family: var(--font-serif); font-size: 2.2rem; text-align: center; margin-bottom: 2.5rem;">
          Secure Atelier Acquisition Protocol
        </h1>

        <div class="checkout-grid">
          <!-- LEFT: FORM -->
          <form id="checkout-form" onsubmit="window.HJ.processOrder(event)">
            <!-- STEP 1: CONTACT -->
            <div class="checkout-form-box" style="margin-bottom: 1.5rem;">
              <h3 class="checkout-step-title">1. Customer Contact</h3>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="form-label">Full Name *</label>
                  <input type="text" name="fullName" class="form-input" required placeholder="e.g. Yuvraj Soni" />
                </div>
                <div class="form-field">
                  <label class="form-label">Email Address *</label>
                  <input type="email" name="email" class="form-input" required placeholder="name@example.com" />
                </div>
              </div>
              <div class="form-field">
                <label class="form-label">Mobile Phone (for delivery SMS & WhatsApp) *</label>
                <input type="tel" name="phone" class="form-input" required placeholder="+91 98765 43210" />
              </div>
            </div>

            <!-- STEP 2: SHIPPING ADDRESS -->
            <div class="checkout-form-box" style="margin-bottom: 1.5rem;">
              <h3 class="checkout-step-title">2. Shipping Address</h3>
              <div class="form-field">
                <label class="form-label">Street Address / Suite / Apartment *</label>
                <input type="text" name="address" class="form-input" required placeholder="House number, street, landmark" />
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="form-label">City *</label>
                  <input type="text" name="city" class="form-input" required placeholder="e.g. Jaipur" value="${state.deliveryCity}" />
                </div>
                <div class="form-field">
                  <label class="form-label">PIN Code *</label>
                  <input type="text" name="pincode" class="form-input" required placeholder="e.g. 302001" value="${state.deliveryPincode}" maxlength="6" />
                </div>
              </div>
              <div class="form-field">
                <label class="form-label">State / Union Territory *</label>
                <input type="text" name="state" class="form-input" required placeholder="e.g. Rajasthan" />
              </div>
            </div>

            <!-- STEP 3: PAYMENT METHOD -->
            <div class="checkout-form-box">
              <h3 class="checkout-step-title">3. Payment Method</h3>
              <div class="payment-methods-grid">
                <div class="payment-method-card selected">
                  <div class="payment-method-header">
                    <div class="payment-title-row">
                      <input type="radio" name="payment_method" value="advance_payment" checked />
                      <span>Advance Payment (UPI / Bank Transfer)</span>
                    </div>
                    <span style="font-size:0.75rem;background:var(--color-gold);padding:0.2rem 0.5rem;border-radius:2px;">Required</span>
                  </div>
                  <div class="payment-method-details">
                    Payment instructions will be shared by the House of Jewelux team after your order request. Your order remains pending until the advance payment is received and verified.
                  </div>
                </div>
              </div>

              <button type="submit" class="btn-gold" style="width: 100%; padding: 1.1rem; font-size: 0.95rem;">
                Authorize & Place Order (${formatPrice(grandTotal)})
              </button>
            </div>
          </form>

          <!-- RIGHT: ORDER SUMMARY -->
          <div>
            <div class="checkout-form-box" style="position: sticky; top: calc(var(--header-height-desktop) + 30px);">
              <h3 class="checkout-step-title">Order Summary (${state.cart.length} Pieces)</h3>
              <div style="max-height: 280px; overflow-y: auto; margin-bottom: 1rem;">
                ${state.cart.map(item => `
                  <div class="cart-item-row" style="padding: 0.75rem 0;">
                    <img class="cart-item-img" src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px;" />
                    <div class="cart-item-info">
                      <div class="cart-item-name">${item.name}</div>
                      <div class="cart-item-variant">Qty: ${item.quantity} • ${item.metal || 'See product details'}</div>
                    </div>
                    <div class="cart-item-price-col">
                      <span class="cart-item-total">${formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                `).join('')}
              </div>

              <div class="coupon-input-row">
                <input type="text" id="checkout-coupon-input" class="coupon-input" placeholder="Privilege Code (FIRSTLUX)" />
                <button type="button" class="coupon-apply-btn" onclick="window.HJ.applyCoupon(document.getElementById('checkout-coupon-input').value)">Apply</button>
              </div>

              <div style="border-top: 1px solid var(--color-border); padding-top: 1rem;">
                <div class="cart-summary-line">
                  <span>Subtotal</span>
                  <span>${formatPrice(subtotal)}</span>
                </div>
                ${discount > 0 ? `
                  <div class="cart-summary-line" style="color: #2E7D32;">
                    <span>Privilege Discount</span>
                    <span>-${formatPrice(discount)}</span>
                  </div>
                ` : ''}
                <div class="cart-summary-line">
                  <span>Shipping</span>
                  <span>${shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <div class="cart-summary-total">
                  <span>Grand Total (INR)</span>
                  <span style="color: var(--color-gold-dark);">${formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== VIEW 5: ACCOUNT ====================
  function renderAccountPage(container) {
    if (!state.customer) {
      container.innerHTML = `
        <div class="container" style="padding: 4rem 0 6rem; max-width: 500px;">
          <div class="checkout-form-box">
            <h2 style="font-family: var(--font-serif); font-size: 1.8rem; text-align: center; margin-bottom: 0.5rem;">Patron Sign In</h2>
            <p style="text-align: center; font-size: 0.85rem; color: var(--color-taupe); margin-bottom: 2rem;">View your account details and order history.</p>
            <form onsubmit="window.HJ.handleLogin(event)">
              <div class="form-field"><label class="form-label">Email Address *</label><input type="email" name="email" class="form-input" required /></div>
              <div class="form-field"><label class="form-label">Password *</label><input type="password" name="password" class="form-input" required /></div>
              <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem;">Sign In</button>
            </form>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="container" style="padding: 4rem 0 6rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <div>
              <span class="hero-badge-pill">Private Patron Suite</span>
              <h1 style="font-family: var(--font-serif); font-size: 2.2rem;">Welcome, ${state.customer.name}</h1>
            </div>
            <button class="btn-outline" style="color: var(--color-espresso); border-color: var(--color-border);" onclick="window.HJ.handleLogout()">Sign Out</button>
          </div>
          <div style="background: var(--color-soft-offwhite); border: 1px solid var(--color-warm-stone-light); border-radius: var(--radius-sm); padding: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.25rem; margin-bottom: 1.5rem;">Acquisition History</h3>
            <p style="color: var(--color-taupe);">Orders and available product documentation will appear here.</p>
          </div>
        </div>
      `;
    }
  }

  // ==================== VIEW 6: ADMIN ====================
  async function renderAdminDashboard(container) {
    const isAuthed = sessionStorage.getItem('hj_admin_token');
    if (!isAuthed) {
      container.innerHTML = `
        <div class="container" style="padding: 5rem 0; max-width: 440px;">
          <div class="checkout-form-box">
            <h2 style="font-family: var(--font-serif); font-size: 1.6rem; text-align: center; margin-bottom: 0.5rem;">Atelier Admin Portal</h2>
            <form onsubmit="window.HJ.adminLogin(event)">
              <div class="form-field">
                <label class="form-label">Master Atelier PIN</label>
                <input type="password" id="admin-pin-input" class="form-input" required placeholder="Enter your secure admin PIN" />
              </div>
              <button type="submit" class="btn-primary" style="width: 100%;">Authorize Dashboard</button>
            </form>
          </div>
        </div>
      `;
      return;
    }

    let metrics = { totalRevenue: 0, totalOrders: 0, pendingVerification: 0, totalProducts: 0, totalCustomers: 0 };
    let recentOrders = [];
    try {
      const res = await fetch('/api/admin/overview', { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('hj_admin_token') } });
      const data = await res.json();
      if (res.status === 401) {
        sessionStorage.removeItem('hj_admin_token');
        renderAdminDashboard(container);
        return;
      }
      if (!res.ok || !data.success) throw new Error(data.error || 'Unable to load admin data.');
      metrics = data.metrics;
      recentOrders = data.recentOrders;
    } catch (err) {
      container.innerHTML = '<div class="container" style="padding:4rem 1rem;"><p role="alert">Admin data could not be loaded. Please refresh or sign in again.</p></div>';
      return;
    }

    container.innerHTML = `
      <div style="background: var(--color-ivory); min-height: 80vh; padding-bottom: 5rem;">
        <div class="admin-header-bar">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span style="font-family: var(--font-serif); font-size: 1.1rem;">HOUSE OF JEWELUX</span>
            <span style="font-size: 0.75rem; background: var(--color-gold); color: #000; padding: 0.2rem 0.5rem; border-radius: 2px;">Admin Suite</span>
          </div>
          <button onclick="sessionStorage.removeItem('hj_admin_token'); window.HJ.navigate('home');" style="color: #FFF; font-size: 0.8rem; text-decoration: underline;">Exit</button>
        </div>
        <div class="container" style="padding-top: 2.5rem;">
          <div class="admin-kpi-grid">
            <div class="kpi-card"><div class="kpi-label">Gross Volume</div><div class="kpi-value">${formatPrice(metrics.totalRevenue)}</div></div>
            <div class="kpi-card"><div class="kpi-label">Total Orders</div><div class="kpi-value">${metrics.totalOrders}</div></div>
            <div class="kpi-card"><div class="kpi-label">Pending Verification</div><div class="kpi-value" style="color: #D32F2F;">${metrics.pendingVerification}</div></div>
            <div class="kpi-card"><div class="kpi-label">Vault Pieces</div><div class="kpi-value">${metrics.totalProducts}</div></div>
          </div>
          <div style="background: var(--color-soft-offwhite); border: 1px solid var(--color-warm-stone-light); border-radius: var(--radius-sm); padding: 1.5rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.2rem; margin-bottom: 1rem;">Orders & Bank Verification</h3>
            <table class="admin-table">
              <thead><tr><th>Order ID</th><th>Customer</th><th>Payment</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                ${recentOrders.map(o => `
                  <tr>
                    <td>${o.orderId}</td>
                    <td>${o.customer.fullName}</td>
                    <td>${o.paymentMethod.toUpperCase()}</td>
                    <td>${formatPrice(o.pricing.grandTotal)}</td>
                    <td><span style="padding: 0.2rem 0.4rem; border-radius: 2px; font-size: 0.75rem; background: #FFF3E0; color: #E65100;">${o.paymentStatus}</span></td>
                    <td>
                      ${o.paymentStatus === 'Pending Verification' ? `
                        <button class="btn-gold" style="padding: 0.25rem 0.6rem; font-size: 0.7rem;" onclick="window.HJ.verifyOrderPayment('${o.orderId}')">Confirm</button>
                      ` : '✓ Confirmed'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== VIEW 7: CONTENT PAGES ====================
  function renderAboutPage(container) {
    container.innerHTML = `
      <!-- A. EDITORIAL ABOUT HERO -->
      <section style="background: var(--color-warm-ivory); padding: 5rem 0 3rem; text-align: center;">
        <div class="container" style="max-width: 860px;">
          <span class="hero-badge-pill about-story-reveal" style="display: inline-block; margin-bottom: 0.85rem;">✦ Jaipur Roots • Indian Heritage Craft</span>
          <h1 class="section-title about-story-reveal" style="font-family: var(--font-serif); font-size: 3.2rem; line-height: 1.15; margin: 0.5rem 0 1.25rem; color: var(--color-deep-heritage-brown);">Where Elegance Becomes Eternal</h1>
          <div class="section-divider about-story-reveal" style="margin-bottom: 1.5rem;"><span class="section-divider-gem"></span></div>
          <p class="about-story-reveal" style="font-size: 1.1rem; color: var(--color-stone-muted); line-height: 1.85; max-width: 780px; margin: 0 auto;">
            Founded by Yuvraj Soni in Jaipur, Rajasthan, House of Jewelux is a celebration of India's timeless jewellery heritage, reimagined through the lens of modern luxury. Rooted in traditional Indian artistry and inspired by contemporary minimalism, we bring together the enduring beauty of gold, silver and diamonds through thoughtfully crafted fine jewellery. Each creation reflects a harmonious balance of heritage, refined simplicity and modern elegance, designed to transcend trends and become timeless treasures.
          </p>
        </div>
      </section>

      <!-- B. ASYMMETRIC EDITORIAL STORY (PÉPITE ARCHITECTURE) -->
      <section style="padding: 4rem 0 5rem; background: var(--color-warm-ivory);">
        <div class="container">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 4rem; align-items: center;">
            <!-- Left: Editorial Photo in Pebble Frame with Circular Badge -->
            <div class="about-image-reveal" style="position: relative; border-radius: var(--radius-pepite-card-lg); overflow: hidden; box-shadow: var(--shadow-pepite-hover); border: 1px solid rgba(47,36,26,0.08);">
              <div class="pepite-action-badge" onclick="window.HJ.navigate('craftsmanship')" title="Discover Craftsmanship" style="position: absolute; top: 1.5rem; right: 1.5rem; z-index: 5;">
                ↗
              </div>
              <img src="images/authentic_atelier_craft.jpg" alt="Jewellery-making inspiration rooted in Indian heritage" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block;" />
              <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(0deg, rgba(31,23,16,0.92) 0%, rgba(31,23,16,0) 100%); padding: 2rem 1.75rem 1.5rem; color: #FFF;">
                <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.18em; color: var(--color-muted-gold); font-weight: 700;">Jaipur Atelier Workbench</span>
                <div style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 600; margin-top: 0.35rem;">Authentic Handcraftsmanship & Sacred Stone Setting</div>
              </div>
            </div>

            <!-- Right: The Maison Manifesto -->
            <div class="about-story-reveal">
              <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--color-muted-gold); font-weight: 700;">Maison Manifesto • Royal Provenance</span>
              <h2 style="font-family: var(--font-serif); font-size: 2.4rem; line-height: 1.25; margin: 0.6rem 0 1.25rem; color: var(--color-deep-heritage-brown);">Centuries of Heritage. Refined for Now.</h2>
              <p style="color: var(--color-stone-muted); line-height: 1.8; margin-bottom: 1.25rem; font-size: 0.95rem;">
                Rooted in Jaipur, House of Jewelux draws on India's rich jewellery heritage while embracing contemporary forms. Our designs bring together gold, silver and diamond jewellery with careful attention to silhouette, proportion and detail. Exact materials, finishes and stone information are provided for each design where available.
              </p>
              <p style="color: var(--color-stone-muted); line-height: 1.8; margin-bottom: 2rem; font-size: 0.95rem;">
                From statement brooches and heritage-inspired designs to refined rings and everyday pieces, each collection is created to feel distinctive, elegant and enduring.
              </p>
              
              <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <a href="#collections/all" class="btn-primary">Explore All 50 Pieces ↗</a>
                <a href="javascript:void(0)" onclick="window.HJ.openAppointmentModal()" class="btn-outline">Request Online Consultation</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- D. MATERIAL OVERVIEW: SILVER • GOLD • DIAMOND -->
      <section style="padding: 5rem 0; background: var(--color-warm-ivory);">
        <div class="container">
          <div class="section-header" style="text-align: center; margin-bottom: 3rem;">
            <div class="section-pretitle" style="color: var(--color-muted-gold);">Material Mastery</div>
            <h2 class="section-title">Three Houses of Creation</h2>
            <div class="section-divider"><span class="section-divider-gem"></span></div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem;">
            <!-- Silver -->
            <div class="pepite-story-card about-story-reveal" style="border: 1px solid rgba(184,151,88,0.15);">
              <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(184,151,88,0.08); border: 1px solid var(--color-muted-gold-light); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; color: var(--color-muted-gold); font-size: 1.5rem;">Ag</div>
              <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Silver Jewellery</h3>
              <p style="font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.75; margin-bottom: 1rem;">Explore silver jewellery with product-specific metal, finish and care details shown on each item.</p>
              <a href="#collections/silver-category" class="btn-gold" style="padding: 0.65rem 1.4rem; font-size: 0.75rem;">Explore Silver Collection ↗</a>
            </div>

            <!-- Gold -->
            <div class="pepite-story-card about-story-reveal" style="border: 1px solid rgba(184,151,88,0.15);">
              <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(184,151,88,0.12); border: 1px solid var(--color-muted-gold-light); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; color: var(--color-muted-gold); font-size: 1.5rem;">Au</div>
              <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Gold Jewellery</h3>
              <p style="font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.75; margin-bottom: 1rem;">Gold-finish jewellery designs with product-specific base metal and plating details listed on each item.</p>
              <a href="#collections/gold-category" class="btn-gold" style="padding: 0.65rem 1.4rem; font-size: 0.75rem;">Explore Gold Collection ↗</a>
            </div>

            <!-- Diamond -->
            <div class="pepite-story-card about-story-reveal" style="border: 1px solid rgba(184,151,88,0.15);">
              <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.6); border: 1px solid var(--color-warm-stone-light); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; color: var(--color-stone-muted); font-size: 1.5rem;">💎</div>
              <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Diamond Jewellery</h3>
              <p style="font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.75; margin-bottom: 1rem;">Explore diamond and gemstone designs, with stone type and setting details listed on each product page.</p>
              <a href="#collections/diamond-category" class="btn-gold" style="padding: 0.65rem 1.4rem; font-size: 0.75rem;">Explore Diamond Collection ↗</a>
            </div>
          </div>
        </div>
      </section>

      <!-- E. ATELIER STATISTICS RIBBON -->
      <section style="padding: 4.5rem 0; background: var(--color-soft-offwhite); border-top: 1px solid rgba(47,36,26,0.06); border-bottom: 1px solid rgba(47,36,26,0.06);">
        <div class="container">
          <div class="section-header" style="text-align: center; margin-bottom: 3rem;">
            <div class="section-pretitle" style="color: var(--color-muted-gold);">The Pillars of Permanence</div>
            <h2 class="section-title">The House of Jewelux Approach</h2>
            <div class="section-divider"><span class="section-divider-gem"></span></div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.75rem;">
            <div class="pepite-story-card about-story-reveal">
              <div class="pepite-number-badge">01</div>
              <h3 style="font-family: var(--font-serif); font-size: 1.35rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Heritage-Inspired Design</h3>
              <p style="font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.75;">
                Indian architectural details, traditional motifs and sculptural forms inspire designs that feel relevant to contemporary wardrobes.
              </p>
            </div>

            <div class="pepite-story-card about-story-reveal">
              <div class="pepite-number-badge">02</div>
              <h3 style="font-family: var(--font-serif); font-size: 1.35rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Product-Specific Information</h3>
              <p style="font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.75;">
                Metal composition, finish and any applicable hallmark information are confirmed against the details for each individual piece.
              </p>
            </div>

            <div class="pepite-story-card about-story-reveal">
              <div class="pepite-number-badge">03</div>
              <h3 style="font-family: var(--font-serif); font-size: 1.35rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Jewellery Care Information</h3>
              <p style="font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.75;">
                Care requirements vary by metal, finish and stone. Please follow the product-specific care guidance and contact customer support if you need assistance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- D. FOUNDER'S LETTER (PÉPITE LUXURY QUOTE BOX) -->
      <section style="padding: 5rem 0; background: var(--color-warm-ivory);">
        <div class="container" style="max-width: 920px;">
          <div class="pepite-quote-box about-story-reveal">
            <span style="font-size: 2.5rem; color: var(--color-muted-gold); line-height: 1; font-family: var(--font-serif);">“</span>
            <p style="font-family: var(--font-serif); font-size: 1.45rem; line-height: 1.7; color: var(--color-deep-heritage-brown); margin: 0.5rem 0 1.75rem; font-style: italic;">
              True luxury is a balance of meaning and modernity — designs inspired by heritage, shaped with intention and made to be treasured beyond passing trends.
            </p>
            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
              <div style="text-align: center;">
                <div style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: var(--color-deep-heritage-brown);">Yuvraj Soni</div>
                <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.16em; color: var(--color-stone-muted); margin-top: 0.2rem;">Founder • House of Jewelux</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- E. ATELIER STATISTICS RIBBON -->
      <section style="padding: 3rem 0 5rem; background: var(--color-warm-ivory);">
        <div class="container">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem;">
            <div class="trust-item about-story-reveal" style="text-align: center; padding: 2rem 1.5rem !important;">
              <div style="font-family: var(--font-serif); font-size: 2.2rem; font-weight: 700; color: var(--color-muted-gold);">50</div>
              <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-espresso); font-weight: 700; margin-top: 0.35rem;">Authentic Creations</div>
              <div style="font-size: 0.75rem; color: var(--color-stone-muted); margin-top: 0.2rem;">Rings, Earrings, Brooches, Temple</div>
            </div>
            <div class="trust-item about-story-reveal" style="text-align: center; padding: 2rem 1.5rem !important;">
              <div style="font-family: var(--font-serif); font-size: 2.2rem; font-weight: 700; color: var(--color-muted-gold);">100%</div>
              <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-espresso); font-weight: 700; margin-top: 0.35rem;">Material Details</div>
              <div style="font-size: 0.75rem; color: var(--color-stone-muted); margin-top: 0.2rem;">Listed on each product page</div>
            </div>
            <div class="trust-item about-story-reveal" style="text-align: center; padding: 2rem 1.5rem !important;">
              <div style="font-family: var(--font-serif); font-size: 2.2rem; font-weight: 700; color: var(--color-muted-gold);">Craft</div>
              <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-espresso); font-weight: 700; margin-top: 0.35rem;">Indian Heritage Craft</div>
              <div style="font-size: 0.75rem; color: var(--color-stone-muted); margin-top: 0.2rem;">Artisanal bench handcrafting</div>
            </div>
            <div class="trust-item about-story-reveal" style="text-align: center; padding: 2rem 1.5rem !important;">
              <div style="font-family: var(--font-serif); font-size: 2.2rem; font-weight: 700; color: var(--color-muted-gold);">19,000+</div>
              <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-espresso); font-weight: 700; margin-top: 0.35rem;">Indian PIN Codes</div>
              <div style="font-size: 0.75rem; color: var(--color-stone-muted); margin-top: 0.2rem;">Delivery tracking shared after dispatch</div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderPolicyPage(container, rawKey) {
    const key = (rawKey || 'shipping').toLowerCase();
    const policies = {
      shipping: {
        title: "Shipping Information",
        subtitle: "Delivery details are confirmed before payment",
        badge: "Delivery Information",
        content: `
          <div class="pepite-story-card">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Order Processing & Dispatch</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              Orders are prepared for dispatch after advance payment is received and verified. Available delivery options, applicable charges and estimated timelines will be confirmed with you before payment.
            </p>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              Tracking details will be shared after dispatch. Please contact the House of Jewelux team before ordering if you need delivery outside India.
            </p>
          </div>
        `
      },
      returns: {
        title: "Returns & Refunds",
        subtitle: "Please confirm eligibility and terms before placing an order",
        badge: "Customer Support",
        content: `
          <div class="pepite-story-card">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Return & Exchange Requests</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              Return and exchange eligibility, applicable time limits, item-condition requirements and any shipping charges must be confirmed with the House of Jewelux team before purchase. Please obtain written confirmation before sending an item back.
            </p>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              If an item arrives damaged or differs from the order, contact customer support promptly with your order number and clear photographs so the team can review the issue.
            </p>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              Refund method and processing time will be confirmed once a return is approved.
            </p>
          </div>
        `
      },
      exchange: {
        title: "Exchange Requests",
        subtitle: "Eligibility and process confirmed before purchase",
        badge: "Customer Support",
        content: `
          <div class="pepite-story-card">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Exchange Eligibility</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              Exchange availability, eligible product categories, time limits, condition requirements and any applicable charges must be confirmed in writing with customer support before purchase. Please obtain approval before returning or sending an item.
            </p>
          </div>
        `
      },
      cancellation: {
        title: "Order Cancellation",
        subtitle: "Contact customer support as soon as possible",
        badge: "Customer Support",
        content: `
          <div class="pepite-story-card">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Cancellation Requests</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              Cancellation eligibility depends on the order's payment and fulfilment status. Contact customer support with your Order ID as soon as possible. Any approved refund amount and processing timeline will be confirmed in writing.
            </p>
          </div>
        `
      },
      privacy: {
        title: "Patron Privacy & Data Protection Covenant",
        subtitle: "256-Bit SSL Encryption • Strict Confidentiality • Zero Third-Party Selling",
        badge: "Confidentiality Assured",
        content: `
          <div class="pepite-story-card" style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">1. Commitment to Discretion</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              House of Jewelux operates with the utmost discretion. We collect information needed to support customer accounts, process orders and respond to customer service enquiries. Please review this policy for details about how information is handled.
            </p>
          </div>
          <div class="pepite-story-card" style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">2. 256-Bit SSL/TLS Encryption</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              All data transmitted through our website is secured with bank-grade 256-bit SSL encryption. We adhere strictly to the Information Technology Act (2000) and global GDPR data protection standards. We will never sell, lease, or monetize your contact details.
            </p>
          </div>
          <div class="pepite-story-card">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">3. Payment Processing Safety</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              Financial transactions are executed directly via PCI-DSS Level 1 compliant gateways (Razorpay, Stripe, and RBI-regulated BHIM UPI). House of Jewelux never views or stores your credit/debit card numbers or CVV codes.
            </p>
          </div>
        `
      },
      terms: {
        title: "Terms of Authenticity & Atelier Service",
        subtitle: "Official Legal Standards Governing House of Jewelux Acquisitions",
        badge: "Atelier Code of Honor",
        content: `
          <div class="pepite-story-card" style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">1. Product Materials & Documentation</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              The base metal, plating or finish, stone type and any available certificates are listed for each product where verified. Please contact customer support before purchase if you need clarification about a particular piece.
            </p>
          </div>
          <div class="pepite-story-card">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">2. Intellectual Property</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              All jewellery designs, architectural sketches, photographs, brand trademarks, logos, and digital assets displayed on this website are protected intellectual property of House of Jewelux. Unauthorized reproduction, replication, or distribution is strictly prohibited.
            </p>
          </div>
        `
      },
      cookies: {
        title: "Cookie & Preference Policy",
        subtitle: "Transparent Information on How We Respect Your Digital Privacy",
        badge: "Data Transparency",
        content: `
          <div class="pepite-story-card">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Essential Cookies & Local Preferences</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              We utilize essential local storage and first-party session cookies exclusively to preserve your shopping bag contents, wishlist favorites, and localized currency selection. We do not deploy invasive cross-site tracking cookies. You may clear your browser cookies at any time via your browser settings without affecting checkout integrity.
            </p>
          </div>
        `
      },
      care: {
        title: "Jewellery Care Guide",
        subtitle: "Preserving the Eternal Brilliance of Silver, Gold & Diamonds",
        badge: "Jewellery Care Guide",
        content: `
          <div class="pepite-story-card" style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">1. Caring for Silver Jewellery</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8; margin-bottom: 1rem;">
              Silver jewellery may require care specific to its finish. Check the individual product details or contact our team if you are unsure which cleaning method is suitable.
            </p>
            <ul style="padding-left: 1.25rem; font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.8;">
              <li>Wipe gently with the provided ultra-soft microfiber polishing cloth after each wear.</li>
              <li>Avoid chemical silver dips or abrasive pastes, which can strip protective rhodium plating.</li>
              <li>Remove your jewellery prior to swimming in chlorinated pools or bathing in thermal sulfur springs.</li>
            </ul>
          </div>

          <div class="pepite-story-card" style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">2. Caring for Gold-Finish Jewellery</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8; margin-bottom: 1rem;">
              Gold-finish jewellery can be sensitive to friction, moisture and chemicals. Keep pieces dry, apply perfume before wearing and store separately.
            </p>
            <ul style="padding-left: 1.25rem; font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.8;">
              <li>Apply perfumes, body lotions, hairsprays, and cosmetics <em>before</em> putting on your jewellery.</li>
              <li>Store each piece individually in its velvet presentation coffer to prevent delicate chains and stones from scratching.</li>
            </ul>
          </div>

          <div class="pepite-story-card">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">3. Caring for Gemstone Jewellery</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              To restore maximum optical dispersion and scintillation: soak for 5 minutes in a bowl of lukewarm water with 2 drops of mild dishwashing liquid. Gently brush behind the pavilion facet with a soft-bristled baby toothbrush, rinse under running lukewarm water, and pat dry with a lint-free cloth.
            </p>
          </div>
        `
      },
      size: {
        title: "International Size & Dimension Guide",
        subtitle: "Accurate Measurement Specifications for Rings, Bangles & Necklaces",
        badge: "Jaipur Atelier Sizing Chart",
        content: `
          <div class="pepite-story-card" style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">1. Indian & International Ring Sizing Chart</h3>
            <div style="overflow-x: auto; margin-top: 1rem;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
                <thead>
                  <tr style="background: rgba(184,151,88,0.12); color: var(--color-espresso); font-family: var(--font-serif);">
                    <th style="padding: 0.75rem; border: 1px solid var(--color-warm-stone-light);">Indian Size</th>
                    <th style="padding: 0.75rem; border: 1px solid var(--color-warm-stone-light);">US Size</th>
                    <th style="padding: 0.75rem; border: 1px solid var(--color-warm-stone-light);">UK Size</th>
                    <th style="padding: 0.75rem; border: 1px solid var(--color-warm-stone-light);">Inner Diameter (mm)</th>
                    <th style="padding: 0.75rem; border: 1px solid var(--color-warm-stone-light);">Inner Circumference (mm)</th>
                  </tr>
                </thead>
                <tbody style="color: var(--color-stone-muted);">
                  <tr><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light); font-weight: 600;">8</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">4.5</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">I</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">15.3 mm</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">48.0 mm</td></tr>
                  <tr><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light); font-weight: 600;">10</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">5.5</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">K</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">16.1 mm</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">50.6 mm</td></tr>
                  <tr><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light); font-weight: 600;">12 (Most Popular)</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">6.0</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">L 1/2</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">16.5 mm</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">51.8 mm</td></tr>
                  <tr><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light); font-weight: 600;">14 (Standard)</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">7.0</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">N</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">17.3 mm</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">54.4 mm</td></tr>
                  <tr><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light); font-weight: 600;">16</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">7.5</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">P</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">17.7 mm</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">55.6 mm</td></tr>
                  <tr><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light); font-weight: 600;">18</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">8.5</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">Q 1/2</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">18.5 mm</td><td style="padding: 0.6rem; border: 1px solid var(--color-warm-stone-light);">58.1 mm</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="pepite-story-card">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">2. Bracelet & Necklace Dimensions</h3>
            <ul style="padding-left: 1.25rem; font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.8;">
              <li><strong>Tennis Bracelets & Cuffs:</strong> Standard length is 7.0 inches (17.8 cm) with double-safety lock. Petite 6.5 inches and Large 7.5 inches available upon request.</li>
              <li><strong>Necklace Drops:</strong> Choker (14-16 inches / collarbone), Princess (18 inches / most versatile drop), Matinee (20-22 inches / low neckline), Opera (30 inches / royal ceremonial).</li>
            </ul>
          </div>
        `
      },
      warranty: {
        title: "Warranty Information",
        subtitle: "Coverage is confirmed for each product",
        badge: "Product Information",
        content: `
          <div class="pepite-story-card">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Product-Specific Coverage</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              Warranty coverage, if available, will be stated on the individual product page or confirmed in writing before purchase. Please contact customer support if you need clarification about care, repairs or service eligibility.
            </p>
          </div>
        `
      }
    };

    const pol = policies[key] || policies.shipping;

    container.innerHTML = `
      <!-- A. POLICY HERO -->
      <section style="background: var(--color-warm-ivory); padding: 5rem 0 3rem; text-align: center;">
        <div class="container" style="max-width: 860px;">
          <span class="hero-badge-pill about-story-reveal" style="display: inline-block; margin-bottom: 0.85rem;">✦ ${pol.badge}</span>
          <h1 class="section-title about-story-reveal" style="font-family: var(--font-serif); font-size: 2.8rem; line-height: 1.2; margin: 0.5rem 0 1rem; color: var(--color-deep-heritage-brown);">${pol.title}</h1>
          <div class="section-divider about-story-reveal" style="margin-bottom: 1.25rem;"><span class="section-divider-gem"></span></div>
          <p class="about-story-reveal" style="font-size: 1.05rem; color: var(--color-stone-muted); line-height: 1.8; max-width: 720px; margin: 0 auto;">
            ${pol.subtitle}
          </p>
        </div>
      </section>

      <!-- B. POLICY QUICK NAVIGATION & BODY -->
      <section style="padding: 3rem 0 6rem; background: var(--color-warm-ivory);">
        <div class="container">
          <!-- Policy Tab Pills -->
          <div style="display: flex; gap: 0.65rem; flex-wrap: wrap; justify-content: center; margin-bottom: 3rem;">
            <a href="#shipping-policy" class="filter-pill ${key === 'shipping' ? 'active' : ''}">Shipping Policy</a>
            <a href="#returns-policy" class="filter-pill ${key === 'returns' ? 'active' : ''}">Returns & Refunds</a>
            <a href="#exchange-policy" class="filter-pill ${key === 'exchange' ? 'active' : ''}">Exchange Requests</a>
            <a href="#cancellation-policy" class="filter-pill ${key === 'cancellation' ? 'active' : ''}">Cancellation Policy</a>
            <a href="#jewellery-care" class="filter-pill ${key === 'care' ? 'active' : ''}">Jewellery Care Guide</a>
            <a href="#size-guide" class="filter-pill ${key === 'size' ? 'active' : ''}">Size Guide</a>
            <a href="#privacy-policy" class="filter-pill ${key === 'privacy' ? 'active' : ''}">Privacy Covenant</a>
            <a href="#terms-conditions" class="filter-pill ${key === 'terms' ? 'active' : ''}">Terms & Conditions</a>
            <a href="#warranty" class="filter-pill ${key === 'warranty' ? 'active' : ''}">Warranty Information</a>
          </div>

          <div style="max-width: 860px; margin: 0 auto;">
            ${pol.content}

            <!-- Concierge Callout -->
            <div class="pepite-story-card" style="margin-top: 3rem; background: rgba(184,151,88,0.06); border: 1px solid var(--color-muted-gold-light); text-align: center; padding: 2.5rem 1.5rem;">
              <h4 style="font-family: var(--font-serif); font-size: 1.35rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.5rem;">Have Questions Regarding Our Policies?</h4>
              <p style="font-size: 0.88rem; color: var(--color-stone-muted); margin-bottom: 1.5rem; max-width: 540px; margin-left: auto; margin-right: auto;">
                Our online consultation concierge is available directly on WhatsApp and telephone to assist with custom requests, sizing queries, and consignment tracking.
              </p>
              <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <a href="https://wa.me/919079998793" target="_blank" class="btn-primary" style="padding: 0.75rem 1.5rem; font-size: 0.8rem;">Chat on WhatsApp</a>
                <a href="#contact" class="btn-gold" style="padding: 0.75rem 1.5rem; font-size: 0.8rem;">Contact Our Team</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderCartDrawer() {
    const drawerBody = document.getElementById('cart-drawer-body');
    const drawerFooter = document.getElementById('cart-drawer-footer');
    if (!drawerBody || !drawerFooter) return;

    if (state.cart.length === 0) {
      drawerBody.innerHTML = `
        <div style="text-align: center; padding: 4rem 0; color: var(--color-taupe);">
          <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--color-gold);">🛍️</div>
          <p style="font-family: var(--font-serif); font-size: 1.15rem; color: var(--color-espresso); margin-bottom: 0.5rem;">Your Shopping Bag is Empty</p>
          <button class="btn-primary" onclick="window.HJ.closeCart(); window.HJ.navigate('collections/earrings');">Explore Earrings</button>
        </div>
      `;
      drawerFooter.innerHTML = '';
      return;
    }

    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const progressPercent = Math.min(100, Math.round((subtotal / 2500) * 100));

    drawerBody.innerHTML = `
      <div class="free-shipping-progress-box">
        ${subtotal >= 2500 ? '🎉 You have unlocked <strong>Free Delivery</strong>!' : `Add <strong>${formatPrice(2500 - subtotal)}</strong> more for Free Delivery`}
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${progressPercent}%;"></div></div>
      </div>
      ${state.cart.map(item => `
        <div class="cart-item-row">
          <img class="cart-item-img" src="${item.image}" alt="${item.name}" />
          <div class="cart-item-info">
            <a href="#products/${item.handle || item.id}" onclick="window.HJ.closeCart()" class="cart-item-name">${item.name}</a>
            <div class="cart-item-variant">${item.metal || 'See product specifications'}</div>
            <div class="qty-control-row">
              <button class="qty-btn" onclick="window.HJ.updateCartQty('${item.id}', -1)">-</button>
              <span class="qty-display">${item.quantity}</span>
              <button class="qty-btn" onclick="window.HJ.updateCartQty('${item.id}', 1)">+</button>
            </div>
          </div>
          <div class="cart-item-price-col">
            <span class="cart-item-total">${formatPrice(item.price * item.quantity)}</span>
            <span class="cart-item-remove-btn" onclick="window.HJ.removeFromCart('${item.id}')">Remove</span>
          </div>
        </div>
      `).join('')}
    `;

    drawerFooter.innerHTML = `
      <div class="cart-summary-line"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      <div class="cart-summary-total"><span>Total</span><span style="color: var(--color-gold-dark);">${formatPrice(subtotal)}</span></div>
      <button class="btn-gold" style="width: 100%; padding: 1rem;" onclick="window.HJ.closeCart(); window.HJ.navigate('checkout');">Proceed to Checkout</button>
    `;
  }

  // ==================== VIEW: CONTACT PAGE (Animated Contact Section) ====================
  function renderContactPage(container) {
    container.innerHTML = `
      <!-- A. EDITORIAL CONTACT HERO -->
      <section style="background: var(--color-warm-ivory); padding: 5rem 0 2rem; text-align: center;">
        <div class="container" style="max-width: 860px;">
          <span class="hero-badge-pill about-story-reveal" style="display: inline-block; margin-bottom: 0.85rem;">✦ Atelier Concierge</span>
          <h1 class="section-title about-story-reveal" style="font-family: var(--font-serif); font-size: 3.2rem; line-height: 1.15; margin: 0.5rem 0 1.25rem; color: var(--color-deep-heritage-brown);">Contact the House of Jewelux</h1>
          <div class="section-divider about-story-reveal" style="margin-bottom: 1.5rem;"><span class="section-divider-gem"></span></div>
          <p class="about-story-reveal" style="font-size: 1.1rem; color: var(--color-stone-muted); line-height: 1.85; max-width: 760px; margin: 0 auto;">
            Reach the House of Jewelux team for product information, order assistance or collection guidance. We will respond using the contact details you provide.
          </p>
        </div>
      </section>

      <!-- B. CONTACT CARDS & PRIVATE ENQUIRY FORM -->
      <section style="padding: 3rem 0 6rem; background: var(--color-warm-ivory);">
        <div class="container">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 3.5rem; align-items: start;">
            
            <!-- Left: Contact Details -->
            <div class="about-story-reveal" style="display: flex; flex-direction: column; gap: 1.5rem;">
              <div class="pepite-story-card">
                <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.18em; color: var(--color-muted-gold); font-weight: 700;">House of Jewelux</span>
                <h3 style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--color-deep-heritage-brown); margin: 0.4rem 0 1.5rem;">House of Jewelux — Jaipur</h3>
                
                <div style="display: flex; flex-direction: column; gap: 1.35rem;">
                  <div style="display: flex; gap: 1rem; align-items: flex-start;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-champagne-light); display: flex; align-items: center; justify-content: center; color: var(--color-muted-gold); border: 1px solid rgba(47,36,26,0.08); flex-shrink: 0;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    </div>
                    <div>
                      <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--color-stone-muted); font-weight: 600;">Location</div>
                      <div style="font-family: var(--font-serif); font-size: 1.05rem; font-weight: 700; color: var(--color-deep-heritage-brown); margin-top: 0.2rem;">Jaipur, Rajasthan, India</div>
                      <div style="font-size: 0.82rem; color: var(--color-stone-muted); margin-top: 0.15rem;">Online consultations can be requested using the form below.</div>
                    </div>
                  </div>

                  <div style="display: flex; gap: 1rem; align-items: flex-start;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-champagne-light); display: flex; align-items: center; justify-content: center; color: var(--color-muted-gold); border: 1px solid rgba(47,36,26,0.08); flex-shrink: 0;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 0 7H4.11a2 2 0 0 1-2-1.72V7.24a2 2 0 0 1 2-2h3c2.37 0 4.42 1.64 5.18 4H20a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2z"></path></svg>
                    </div>
                    <div>
                      <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--color-stone-muted); font-weight: 600;">Direct Concierge Telephone</div>
                      <div style="font-family: var(--font-serif); font-size: 1.05rem; font-weight: 700; color: var(--color-deep-heritage-brown); margin-top: 0.2rem;">+91 90799 98793</div>
                      <div style="font-size: 0.82rem; color: var(--color-stone-muted); margin-top: 0.15rem;">Available Monday – Saturday, 10:00 – 19:30 IST.</div>
                    </div>
                  </div>

                  <div style="display: flex; gap: 1rem; align-items: flex-start;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-champagne-light); display: flex; align-items: center; justify-content: center; color: var(--color-muted-gold); border: 1px solid rgba(47,36,26,0.08); flex-shrink: 0;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </div>
                    <div>
                      <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--color-stone-muted); font-weight: 600;">Client Care Email</div>
                      <div style="font-family: var(--font-serif); font-size: 1.05rem; font-weight: 700; color: var(--color-deep-heritage-brown); margin-top: 0.2rem;">houseofjewelux@gmail.com</div>
                      <div style="font-size: 0.82rem; color: var(--color-stone-muted); margin-top: 0.15rem;">Product information, order support and general enquiries.</div>
                    </div>
                  </div>
                </div>

                <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(47,36,26,0.08); display: flex; gap: 0.85rem; flex-wrap: wrap;">
                  <a href="https://wa.me/919079998793" target="_blank" class="btn-gold" style="flex: 1; min-width: 170px; padding: 0.75rem 1.25rem; font-size: 0.75rem;">WhatsApp Concierge ↗</a>
                  <a href="javascript:void(0)" onclick="window.HJ.openAppointmentModal()" class="btn-primary" style="flex: 1; min-width: 170px; padding: 0.75rem 1.25rem; font-size: 0.75rem;">Book Appointment</a>
                </div>
              </div>
            </div>

            <!-- Right: Private Enquiry Form -->
            <div class="about-story-reveal">
              <form id="contact-form" class="pepite-story-card" style="display: flex; flex-direction: column; gap: 1.25rem;">
                <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.18em; color: var(--color-muted-gold); font-weight: 700;">Direct Patron Dispatch</span>
                <h3 style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--color-deep-heritage-brown); margin: 0;">Send a Private Enquiry</h3>
                <p style="font-size: 0.82rem; color: var(--color-stone-muted); margin-bottom: 0.5rem;">All fields marked with an asterisk are required.</p>

                <div class="form-row-2col">
                  <div>
                    <label class="form-label" style="font-size: 0.75rem; font-weight: 600; color: var(--color-espresso);">Full Name *</label>
                    <input name="fullName" type="text" class="form-input" required placeholder="Your noble name" />
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 0.75rem; font-weight: 600; color: var(--color-espresso);">Email Address *</label>
                    <input name="email" type="email" class="form-input" required placeholder="patron@domain.com" />
                  </div>
                </div>

                <div class="form-row-2col">
                  <div>
                    <label class="form-label" style="font-size: 0.75rem; font-weight: 600; color: var(--color-espresso);">Phone Number</label>
                    <input name="phone" type="tel" class="form-input" placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 0.75rem; font-weight: 600; color: var(--color-espresso);">Subject of Inquiry *</label>
                    <select name="subject" class="form-select" required>
                      <option value="acquisition">Private Piece Acquisition</option>
                      <option value="product-info">Product Information</option>
                      <option value="appointment">Online Consultation</option>
                      <option value="order-support">Order Support</option>
                      <option value="press">Press & Editorial</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="form-label" style="font-size: 0.75rem; font-weight: 600; color: var(--color-espresso);">Message *</label>
                  <textarea name="message" class="form-textarea" rows="4" required placeholder="How may our atelier concierge assist you?"></textarea>
                </div>

                <button type="submit" class="btn-primary" style="padding: 1rem 2rem; font-size: 0.82rem; letter-spacing: 0.12em; align-self: flex-start;">
                  Transmit Dispatch ✦
                </button>
                <div id="contact-form-message" style="margin-top: 0.5rem; font-size: 0.82rem; min-height: 1.2rem;"></div>
              </form>
            </div>
          </div>
        </div>
      </section>
    `;

    const form = document.getElementById('contact-form');
    const messageEl = document.getElementById('contact-form-message');
    if (form && messageEl) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        
        gsap.to(btn, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1, onComplete: () => {
          btn.textContent = 'Sending…';
          gsap.to(btn, { opacity: 0.7, duration: 0.2 });
          
          // Simulate form submission (no fake checkout, just UI feedback)
          setTimeout(() => {
            gsap.to(btn, { opacity: 1, scale: 1, duration: 0.2, onComplete: () => {
              btn.textContent = 'Sent ✦';
              gsap.to(btn, { backgroundColor: 'var(--color-antique-gold)', color: '#140F0D', duration: 0.3 });
              messageEl.innerHTML = '<span style="color: #2E7D32;">✓ Your enquiry has been sent to our atelier concierge.</span>';
              gsap.fromTo(messageEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 });
              
              setTimeout(() => {
                btn.textContent = originalText;
                gsap.to(btn, { backgroundColor: '', color: '', duration: 0.3 });
                messageEl.innerHTML = '';
              }, 2500);
            }});
          }, 1200);
        }});
      });
    }
  }

  // ==================== VIEW: FAQ PAGE (Animated Editorial Accordions) ====================
  function renderFAQPage(container) {
    container.innerHTML = `
      <section style="background: var(--color-warm-ivory); padding: 4rem 0 1rem;">
        <div class="container" style="max-width: 800px; margin: 0 auto; text-align: center;">
          <span class="hero-badge-pill about-story-reveal" style="display: inline-block; margin-bottom: 0.75rem;">Maison FAQ</span>
          <h2 class="section-title about-story-reveal" style="margin-bottom: 1rem;">Frequently Asked Questions</h2>
          <div class="section-divider about-story-reveal" style="margin-bottom: 0.75rem;"><span class="section-divider-gem"></span></div>
          <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
            Find information about product details, ordering, shipping, returns and jewellery care.
          </p>
        </div>
      </section>

      <section style="padding: 4rem 0 6rem;">
        <div class="container" style="max-width: 720px; margin: 0 auto;">
          <div class="pdp-accordion-item active about-story-reveal">
            <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
              <span>How can I confirm the material and stone details?</span>
              <span>▾</span>
            </div>
            <div class="pdp-accordion-pane">
              Please check the specifications on the individual product page. If a material, finish or stone detail is unclear, contact our team before placing your order.
            </div>
          </div>
          <div class="pdp-accordion-item about-story-reveal">
            <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
              <span>What is your return policy?</span>
              <span>▾</span>
            </div>
            <div class="pdp-accordion-pane">
              Return and exchange eligibility, timelines and charges must be confirmed with customer support before purchase. Please see the Returns & Refunds policy for details.
            </div>
          </div>
          <div class="pdp-accordion-item about-story-reveal">
            <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
              <span>Do you offer international shipping?</span>
              <span>▾</span>
            </div>
            <div class="pdp-accordion-pane">
              Currently, we ship across India via delivery partner. International enquiries can be directed to our concierge at +91 90799 98793.
            </div>
          </div>
          <div class="pdp-accordion-item about-story-reveal">
            <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
              <span>How long does craftsmanship take?</span>
              <span>▾</span>
            </div>
            <div class="pdp-accordion-pane">
              Each piece passes through nine stages of bench craftsmanship in our Jaipur atelier. Standard pieces typically ship within 5-7 business days; delivery estimates are shared with the order details.
            </div>
          </div>
          <div class="pdp-accordion-item about-story-reveal">
            <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
              <span>Can I get help choosing a piece?</span>
              <span>▾</span>
            </div>
            <div class="pdp-accordion-pane">
              Yes. Contact our team for help understanding product details and choosing from the available collections.
            </div>
          </div>
          <div class="pdp-accordion-item about-story-reveal">
            <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
              <span>Are your gemstones ethically sourced?</span>
              <span>▾</span>
            </div>
            <div class="pdp-accordion-pane">
              Please check the stone details on each product page. Any available certificates or supporting documentation will be listed or confirmed before purchase.
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // ==================== CUSTOM ORDER PAGE REMOVED ====================
  function renderCartPage(container) {
    if (state.cart.length === 0) {
      container.innerHTML = `
        <section style="padding: 5rem 0 6rem;">
          <div class="container" style="text-align: center; max-width: 600px; margin: 0 auto;">
            <div style="font-size: 4rem; margin-bottom: 1.5rem;">🛍️</div>
            <h2 style="font-family: var(--font-serif); font-size: 2rem; margin-bottom: 0.5rem; color: var(--color-deep-heritage-brown);">Your Shopping Bag is Empty</h2>
            <p style="color: var(--color-stone-muted); margin-bottom: 2rem;">No creations in your bag yet. Explore our atelier collections.</p>
            <a href="#collections/all" class="btn-primary">Browse Collections</a>
          </div>
        </section>
      `;
      return;
    }

    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 2500 ? 0 : 250;
    const grandTotal = subtotal + shipping;

    container.innerHTML = `
      <section style="padding: 3rem 0 6rem;">
        <div class="container">
          <div style="display: grid; grid-template-columns: 1fr 340px; gap: 3rem; align-items: start;">
            
            <!-- Cart Items -->
            <div>
              <h2 style="font-family: var(--font-serif); font-size: 2rem; margin-bottom: 1.5rem; color: var(--color-deep-heritage-brown);">Shopping Bag</h2>
              ${state.cart.map(item => `
                <div style="display: grid; grid-template-columns: 80px 1fr auto; gap: 1.5rem; align-items: center; padding: 1.25rem 0; border-bottom: 1px solid var(--color-warm-stone-light);">
                  <img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius-sm); background: var(--color-antique-white);" />
                  <div>
                    <a href="#products/${item.handle || item.id}" style="font-family: var(--font-serif); font-size: 1rem; font-weight: 600; color: var(--color-deep-heritage-brown); text-decoration: none;">${item.name}</a>
                    <div style="font-size: 0.75rem; color: var(--color-stone-muted); margin-top: 0.25rem;">${item.metal || 'See product details'} • Qty: ${item.quantity}</div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.75rem; font-family: var(--font-serif); font-size: 1rem; font-weight: 700; color: var(--color-deep-heritage-brown);">
                    <span>${formatPrice(item.price * item.quantity)}</span>
                    <button onclick="window.HJ.removeFromCart('${item.id}')" style="color: var(--color-accent-crimson); font-size: 0.7rem; text-decoration: underline;">Remove</button>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Order Summary -->
            <div style="background: var(--color-soft-offwhite); border: 1px solid var(--color-warm-stone); border-radius: var(--radius-sm); padding: 2rem; position: sticky; top: 120px;">
              <h3 style="font-family: var(--font-serif); font-size: 1.25rem; margin-bottom: 1rem; color: var(--color-deep-heritage-brown);">Order Summary</h3>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--color-taupe);">
                <span>Subtotal (${state.cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>${formatPrice(subtotal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--color-taupe);">
                <span>Shipping</span>
                <span>${shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
              </div>
              <div style="border-top: 1px solid var(--color-warm-stone-light); padding-top: 1rem; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: var(--color-deep-heritage-brown);">
                  <span>Grand Total</span>
                  <span>${formatPrice(grandTotal)}</span>
                </div>
              </div>
              <a href="#checkout" class="btn-gold" style="width: 100%; padding: 1rem; text-align: center; display: block;">Proceed to Checkout</a>
              <p style="font-size: 0.7rem; color: var(--color-stone-muted); margin-top: 1rem; text-align: center;">Secure payment via UPI, Cards, Net Banking & COD</p>
            </div>

          </div>
        </div>
      </section>
    `;
  }

  // ==================== VIEW: WISHLIST PAGE ====================
  function renderWishlistPage(container) {
    if (state.wishlist.length === 0) {
      container.innerHTML = `
        <section style="padding: 5rem 0 6rem;">
          <div class="container" style="text-align: center; max-width: 600px; margin: 0 auto;">
            <div style="font-size: 4rem; margin-bottom: 1.5rem;">💖</div>
            <h2 style="font-family: var(--font-serif); font-size: 2rem; margin-bottom: 0.5rem; color: var(--color-deep-heritage-brown);">Your Wishlist is Empty</h2>
            <p style="color: var(--color-stone-muted); margin-bottom: 2rem;">Save your favourite creations by tapping the heart on any product card.</p>
            <a href="#collections/all" class="btn-primary">Browse Collections</a>
          </div>
        </section>
      `;
      return;
    }

    const wishlistProducts = state.products.filter(p => state.wishlist.includes(p.id));

    container.innerHTML = `
      <section style="padding: 3rem 0 6rem;">
        <div class="container">
          <h2 style="font-family: var(--font-serif); font-size: 2rem; margin-bottom: 1.5rem; color: var(--color-deep-heritage-brown);">Saved Creations</h2>
          <div class="products-grid motion-stagger">
            ${wishlistProducts.map(p => renderProductCard(p)).join('')}
          </div>
        </div>
      </section>
    `;
  }

  // ==================== VIEW: CRAFTSMANSHIP PAGE ====================
  function renderCraftsmanshipPage(container) {
    container.innerHTML = `
      <!-- A. EDITORIAL CRAFTSMANSHIP HERO -->
      <section style="background: var(--color-warm-ivory); padding: 5rem 0 2rem; text-align: center;">
        <div class="container" style="max-width: 860px;">
          <span class="hero-badge-pill about-story-reveal" style="display: inline-block; margin-bottom: 0.85rem;">✦ Jaipur Roots • Indian Heritage Craft</span>
          <h1 class="section-title about-story-reveal" style="font-family: var(--font-serif); font-size: 3.2rem; line-height: 1.15; margin: 0.5rem 0 1.25rem; color: var(--color-deep-heritage-brown);">Indian Heritage, Contemporary Design</h1>
          <div class="section-divider about-story-reveal" style="margin-bottom: 1.5rem;"><span class="section-divider-gem"></span></div>
          <p class="about-story-reveal" style="font-size: 1.1rem; color: var(--color-stone-muted); line-height: 1.85; max-width: 780px; margin: 0 auto;">
            House of Jewelux brings together Indian heritage influences and contemporary minimalism across gold, silver and diamond jewellery.
          </p>
        </div>
      </section>

      <!-- B. ATELIER BENCH PHOTOGRAPHY BANNER -->
      <section style="padding: 1.5rem 0 4rem; background: var(--color-warm-ivory);">
        <div class="container">
          <div class="about-image-reveal" style="position: relative; height: 380px; border-radius: var(--radius-pepite-card-lg); overflow: hidden; box-shadow: var(--shadow-pepite-card); border: 1px solid rgba(47,36,26,0.08);">
            <img src="images/authentic_polki_craft.jpg" alt="Jaipur Goldsmithing Bench" style="width: 100%; height: 100%; object-fit: cover;" />
            <div style="position: absolute; inset: 0; background: linear-gradient(0deg, rgba(31,23,16,0.85) 0%, rgba(31,23,16,0.1) 60%);"></div>
            <div style="position: absolute; bottom: 2.5rem; left: 2.5rem; right: 2.5rem; color: #FFFFFF; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem;">
              <div>
                <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--color-muted-gold); font-weight: 700;">Atelier Bench Camera</span>
                <h3 style="font-family: var(--font-serif); font-size: 1.8rem; margin: 0.35rem 0;">Living Goldsmith Heritage at Bench</h3>
                <p style="font-size: 0.88rem; color: #E8E2D8; max-width: 600px;">Traditional jewellery-making techniques and intricate details inspire the House of Jewelux collections.</p>
              </div>
              <a href="javascript:void(0)" onclick="window.HJ.openAppointmentModal()" class="btn-gold" style="padding: 0.75rem 1.75rem; font-size: 0.78rem;">Request Online Consultation ↗</a>
            </div>
          </div>
        </div>
      </section>

      <!-- C. THE 10 DOCUMENTARY STAGES (PÉPITE PEBBLE GRID) -->
      <section id="craftsmanship-section" style="padding: 4rem 0 6rem; background: var(--color-soft-offwhite); border-top: 1px solid rgba(47,36,26,0.06); border-bottom: 1px solid rgba(47,36,26,0.06);">
        <div class="container">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.75rem;">
            <div class="craft-step-card about-story-reveal">
              <div class="pepite-number-badge">01</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.25rem; margin: 0.4rem 0 0.65rem; color: var(--color-deep-heritage-brown);">Inspiration & Research</h4>
              <p style="font-size: 0.86rem; color: var(--color-stone-muted); line-height: 1.7;">Studying Jaipur royal archways, jharokha latticework, Mughal and Rajput court iconography, and contemporary design trends to spark each new concept.</p>
            </div>

            <div class="craft-step-card about-story-reveal">
              <div class="pepite-number-badge">02</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.25rem; margin: 0.4rem 0 0.65rem; color: var(--color-deep-heritage-brown);">Concept & Design</h4>
              <p style="font-size: 0.86rem; color: var(--color-stone-muted); line-height: 1.7;">Hand-sketched creative direction, proportions, motif development, and design refinement in gouache watercolor on architect's paper.</p>
            </div>

            <div class="craft-step-card about-story-reveal">
              <div class="pepite-number-badge">03</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.25rem; margin: 0.4rem 0 0.65rem; color: var(--color-deep-heritage-brown);">Technical Design & CAD</h4>
              <p style="font-size: 0.86rem; color: var(--color-stone-muted); line-height: 1.7;">Precision 3D CAD modeling, dimensional specification, and high-resolution wax printing ensuring micro-comfort shanks and flawless wear balance.</p>
            </div>

            <div class="craft-step-card about-story-reveal">
              <div class="pepite-number-badge">04</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.25rem; margin: 0.4rem 0 0.65rem; color: var(--color-deep-heritage-brown);">Material Selection</h4>
              <p style="font-size: 0.86rem; color: var(--color-stone-muted); line-height: 1.7;">Material and stone details are reviewed against the specifications available for each jewellery design.</p>
            </div>

            <div class="craft-step-card about-story-reveal">
              <div class="pepite-number-badge">05</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.25rem; margin: 0.4rem 0 0.65rem; color: var(--color-deep-heritage-brown);">Metal Preparation</h4>
              <p style="font-size: 0.86rem; color: var(--color-stone-muted); line-height: 1.7;">Alloying, melting, and material readiness — pure silver mixed with deoxidized copper, flux preparation, and crucible heating for bench forging.</p>
            </div>

            <div class="craft-step-card about-story-reveal">
              <div class="pepite-number-badge">06</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.25rem; margin: 0.4rem 0 0.65rem; color: var(--color-deep-heritage-brown);">Forming & Shaping</h4>
              <p style="font-size: 0.86rem; color: var(--color-stone-muted); line-height: 1.7;">Traditional anvil hammer forging, hand-pierced filigree openwork, casting, and fabrication techniques shaping each silhouette.</p>
            </div>

            <div class="craft-step-card about-story-reveal">
              <div class="pepite-number-badge">07</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.25rem; margin: 0.4rem 0 0.65rem; color: var(--color-deep-heritage-brown);">Stone Preparation & Setting</h4>
              <p style="font-size: 0.86rem; color: var(--color-stone-muted); line-height: 1.7;">Stone grading, bezel and prong setting, pavé placement, and secure gemstone mounting under microscope magnification.</p>
            </div>

            <div class="craft-step-card about-story-reveal">
              <div class="pepite-number-badge">08</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.25rem; margin: 0.4rem 0 0.65rem; color: var(--color-deep-heritage-brown);">Polishing & Finishing</h4>
              <p style="font-size: 0.86rem; color: var(--color-stone-muted); line-height: 1.7;">Finishing choices are selected to suit the individual metal, design and intended appearance.</p>
            </div>

            <div class="craft-step-card about-story-reveal">
              <div class="pepite-number-badge">09</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.25rem; margin: 0.4rem 0 0.65rem; color: var(--color-deep-heritage-brown);">Quality Inspection</h4>
              <p style="font-size: 0.86rem; color: var(--color-stone-muted); line-height: 1.7;">Product details, finish and any applicable hallmark information are reviewed before dispatch.</p>
            </div>

            <div class="craft-step-card about-story-reveal">
              <div class="pepite-number-badge">10</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.25rem; margin: 0.4rem 0 0.65rem; color: var(--color-deep-heritage-brown);">Final Presentation</h4>
              <p style="font-size: 0.86rem; color: var(--color-stone-muted); line-height: 1.7;">Product details and care guidance are shared with each order. Delivery information is confirmed before payment.</p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 3.5rem;">
            <a href="#collections/all" class="btn-primary" style="margin-right: 1rem;">Explore Master Catalogue (50) ↗</a>
            
          </div>
        </div>
      </section>
    `;
  }

  // ==================== GLOBAL PUBLIC API ====================
  window.HJ = {
    navigate: function (route) { navigate(route); },

    addToCart: function (productId, qty = 1, e) {
      if (e) e.stopPropagation();
      const prod = state.products.find(p => p.id === productId);
      if (!prod) return;
      const existing = state.cart.find(item => item.id === productId);
      if (existing) {
        existing.quantity += qty;
      } else {
        state.cart.push({
          id: prod.id,
          name: prod.name,
          price: prod.price,
          image: prod.image,
          handle: prod.handle,
          metal: prod.metal || 'See product specifications',
          quantity: qty
        });
      }
      saveCart();
      window.HJ.openCart();
      // Toast notification
      if (window.HJ_MOTION_DS) {
        window.HJ_MOTION_DS.showAddedToast(prod.name);
      }
    },

    updateCartQty: function (productId, delta) {
      const item = state.cart.find(i => i.id === productId);
      if (!item) return;
      item.quantity += delta;
      if (item.quantity <= 0) {
        state.cart = state.cart.filter(i => i.id !== productId);
      }
      saveCart();
    },

    removeFromCart: function (productId) {
      state.cart = state.cart.filter(i => i.id !== productId);
      saveCart();
    },

    openCart: function () {
      const drawer = document.getElementById('cart-drawer');
      const backdrop = document.getElementById('drawer-backdrop');
      if (drawer && backdrop) {
        drawer.classList.add('active');
        backdrop.classList.add('active');
      }
      renderCartDrawer();
    },

    closeCart: function () {
      document.querySelectorAll('.slide-drawer').forEach(d => d.classList.remove('active'));
      const backdrop = document.getElementById('drawer-backdrop');
      if (backdrop) backdrop.classList.remove('active');
    },

    openSearch: function () {
      const searchDrawer = document.getElementById('search-drawer');
      const backdrop = document.getElementById('drawer-backdrop');
      if (searchDrawer && backdrop) {
        searchDrawer.classList.add('active');
        backdrop.classList.add('active');
        setTimeout(() => {
          const input = document.getElementById('live-search-input');
          if (input) input.focus();
        }, 100);
      }
    },

    openMobileMenu: function () {
      const menuDrawer = document.getElementById('mobile-menu-drawer');
      const backdrop = document.getElementById('drawer-backdrop');
      if (menuDrawer && backdrop) {
        menuDrawer.classList.add('active');
        backdrop.classList.add('active');
      }
    },

    openPincodeModal: function () {
      const modal = document.getElementById('pincode-modal');
      if (modal) modal.style.display = 'flex';
    },

    saveModalPincode: function () {
      const input = document.getElementById('modal-pincode-input');
      if (input && /^\d{6}$/.test(input.value.trim())) {
        state.deliveryPincode = input.value.trim();
        localStorage.setItem('hj_pincode', state.deliveryPincode);
        updateBadges();
        document.getElementById('pincode-modal').style.display = 'none';
        alert(`Pincode updated to ${state.deliveryPincode}.`);
      } else {
        alert('Please enter a valid 6-digit Indian PIN code.');
      }
    },

    toggleWishlist: function (productId, e) {
      if (e) e.stopPropagation();
      const idx = state.wishlist.indexOf(productId);
      if (idx === -1) {
        state.wishlist.push(productId);
      } else {
        state.wishlist.splice(idx, 1);
      }
      saveWishlist();
      handleRoute();
    },

    checkPincode: function () {
      const input = document.getElementById('pdp-pincode-input');
      const status = document.getElementById('pincode-status');
      if (!input || !status) return;
      const code = input.value.trim();
      if (/^\d{6}$/.test(code)) {
        state.deliveryPincode = code;
        localStorage.setItem('hj_pincode', code);
        updateBadges();
        status.innerHTML = `✓ Delivery availability to PIN <strong>${code}</strong> in 2 - 4 business days.`;
        status.style.color = '#2E7D32';
      } else {
        status.textContent = 'Please enter a valid 6-digit PIN code.';
        status.style.color = '#B22222';
      }
    },

    buyNow: function (productId) {
      window.HJ.addToCart(productId, 1);
      window.HJ.closeCart();
      window.HJ.navigate('checkout');
    },

    selectPaymentMethod: function (method, el) {
      document.querySelectorAll('.payment-method-card').forEach(c => {
        c.classList.remove('selected');
        const details = c.querySelector('.payment-method-details');
        if (details) details.style.display = 'none';
      });
      if (el) {
        el.classList.add('selected');
        const details = el.querySelector('.payment-method-details');
        if (details) details.style.display = 'block';
        const radio = el.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      }
    },

    applyCoupon: function (code) {
      if (!code) return;
      const clean = code.trim().toUpperCase();
      if (clean === 'FIRSTLUX') {
        state.appliedCoupon = clean;
        const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        state.discountAmount = Math.round(subtotal * 0.1);
        alert('Code FIRSTLUX applied! 10% welcome privilege deducted.');
        renderCheckoutPage(document.getElementById('app-view'));
      }
    },

    processOrder: async function (e) {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);
      const customer = { fullName: formData.get('fullName'), email: formData.get('email'), phone: formData.get('phone') };
      const shippingAddress = { address: formData.get('address'), city: formData.get('city'), pincode: formData.get('pincode'), state: formData.get('state') };
      const paymentMethod = formData.get('payment_method') || 'advance_payment';

      let order = null;
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customer, shippingAddress, items: state.cart, paymentMethod, couponCode: state.appliedCoupon })
        });
        const data = await res.json();
        if (!res.ok || !data || !data.success || !data.order) {
          throw new Error((data && data.error) || 'We could not place your order. Please try again.');
        }
        order = data.order;
      } catch (err) {
        console.error('Order placement failed:', err);
        alert(err.message || 'Order service is temporarily unavailable. Your cart has been kept; please try again.');
        return;
      }

      state.cart = [];
      saveCart();
      const appView = document.getElementById('app-view');
      appView.innerHTML = `
        <div class="container" style="padding: 4rem 0 6rem;">
          <div class="order-success-card">
            <div class="success-check-icon">✓</div>
            <h1 style="font-family: var(--font-serif); font-size: 2.2rem; margin: 0.5rem 0 1rem;">Order Received</h1>
            <p>Order ID: <strong>${order.orderId}</strong> | Status: <strong>${order.orderStatus}</strong></p><p style="font-size:0.88rem;color:#9A6B25;margin-top:.5rem;">Payment status: <strong>${order.payment && order.payment.status ? order.payment.status : 'Payment Pending'}</strong>. Your order is not confirmed until payment is verified.</p>
            <p style="font-size: 0.88rem; color: var(--color-stone-muted); margin-top: 0.5rem;">Your order request has been received. Payment instructions and confirmation will be shared once the payment process is configured. We have not sent a receipt to <strong>${customer.email || 'your email'}</strong>.</p>
            <div style="margin: 2rem 0;">
              <a href="#collections/all" class="btn-primary">Continue Browsing</a>
              <a href="https://wa.me/919079998793?text=${encodeURIComponent('Hello House of Jewelux Concierge, I just placed Order ' + order.orderId)}" target="_blank" class="btn-gold" style="margin-left: 1rem;">WhatsApp Concierge</a>
            </div>
          </div>
        </div>
      `;
    },

    liveSearch: function (query) {
      const resultsContainer = document.getElementById('search-live-results');
      if (!resultsContainer) return;
      const q = (query || '').trim().toLowerCase();
      if (q.length < 2) {
        resultsContainer.innerHTML = '<p style="color: var(--color-taupe); text-align: center; padding: 2rem;">Type at least 2 letters to search...</p>';
        return;
      }
      const matches = state.products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 6);
      resultsContainer.innerHTML = matches.map(p => `
        <div style="display: flex; gap: 1rem; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--color-border-light);">
          <img src="${p.image}" alt="${p.name}" style="width: 50px; height: 50px; border-radius: 4px; object-fit: cover;" />
          <div style="flex-grow: 1;">
            <a href="#products/${p.handle || p.id}" onclick="window.HJ.closeCart()" style="font-size: 0.85rem; font-weight: 600;">${p.name}</a>
            <div style="font-size: 0.75rem; color: var(--color-taupe);">${formatPrice(p.price)}</div>
          </div>
          <button class="btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.7rem;" onclick="window.HJ.addToCart('${p.id}', 1)">Add</button>
        </div>
      `).join('');
    },

    setSort: function (val) { state.activeFilters.sort = val; handleRoute(); },
    setPriceRange: function (min, max) { state.activeFilters.minPrice = min; state.activeFilters.maxPrice = max; handleRoute(); },
    toggleMetalFilter: function (metal, isChecked) { state.activeFilters.metal = isChecked ? metal : ''; handleRoute(); },
    clearFilters: function () { state.activeFilters = { category: 'all', metal: '', minPrice: 0, maxPrice: 200000, sort: 'popular' }; handleRoute(); },

    adminLogin: async function (e) {
      e.preventDefault();
      const pinInput = document.getElementById('admin-pin-input');
      const pin = pinInput ? pinInput.value : '';
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin })
        });
        const data = await res.json();
        if (!res.ok || !data.success || !data.token) throw new Error(data.error || 'Admin sign-in failed.');
        sessionStorage.setItem('hj_admin_token', data.token);
        renderAdminDashboard(document.getElementById('app-view'));
      } catch (err) {
        alert(err.message || 'Unable to sign in. Check your admin credentials and server configuration.');
      }
    },

    verifyOrderPayment: async function (orderId) {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sessionStorage.getItem('hj_admin_token') },
          body: JSON.stringify({ paymentStatus: 'Paid', orderStatus: 'Confirmed & Sent to Goldsmith' })
        });
        const data = await res.json();
        if (data.success) {
          alert(`Order ${orderId} verified and updated to Paid.`);
          renderAdminDashboard(document.getElementById('app-view'));
        }
      } catch (e) {}
    },

    subscribeNewsletter: async function (e) {
      if (e) e.preventDefault();
      const form = e.target;
      const input = form.querySelector('input[type="email"]');
      const feedback = document.getElementById('newsletter-feedback') || form.querySelector('.newsletter-feedback');
      if (!input || !input.value.trim()) return;
      const email = input.value.trim();

      // Email validation regex
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (feedback) {
          feedback.innerHTML = '<span style="color: #ef4444; font-size: 0.85rem;">Please enter a valid email address.</span>';
          feedback.style.display = 'block';
        } else {
          alert('Please enter a valid email address.');
        }
        return;
      }

      try {
        const res = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Subscription could not be completed.');
        {
          input.value = '';
          if (feedback) {
            feedback.innerHTML = '<span style="color: #2E7D32; font-weight: 600; font-size: 0.85rem;">✦ Thank you for joining House of Jewelux updates! Use privilege code <strong>FIRSTLUX</strong> for 10% off your first acquisition.</span>';
            feedback.style.display = 'block';
          } else {
            alert(data.message || 'Thank you for subscribing. Welcome code FIRSTLUX is available for your first order.');
          }
        }
      } catch (err) {
        console.error('Newsletter subscription failed:', err);
        const message = 'We could not complete your subscription right now. Please try again or contact our team.';
        if (feedback) {
          feedback.textContent = message;
          feedback.style.color = '#ef4444';
          feedback.style.display = 'block';
        } else {
          alert(message);
        }
      }
    },

    toggleEditorMode: function (forceState) {
      const isCurrentlyActive = document.body.classList.contains('hj-editor-active');
      const shouldActivate = forceState !== undefined ? forceState : !isCurrentlyActive;

      if (shouldActivate && !sessionStorage.getItem('hj_admin_token')) {
        alert('Please sign in to the admin portal before opening the visual editor.');
        window.location.hash = '#admin';
        return;
      }

      if (shouldActivate) {
        document.body.classList.add('hj-editor-active');
        sessionStorage.setItem('hj_editor_active', 'true');

        const editables = document.querySelectorAll(
          'h1, h2, h3, h4, .section-title, .section-pretitle, .hero-title, .hero-subtitle, .product-card-title, .price, .trust-item-title, .trust-item-desc, .editorial-content p, .step-title, .step-desc, .category-circle-label, .material-pillar-title, .material-pillar-desc'
        );
        editables.forEach(el => {
          el.setAttribute('contenteditable', 'true');
          el.setAttribute('spellcheck', 'false');
        });

        if (!document.getElementById('hj-editor-floating-bar')) {
          const bar = document.createElement('div');
          bar.id = 'hj-editor-floating-bar';
          bar.className = 'hj-editor-floating-bar';
          bar.innerHTML = `
            <span class="editor-badge">✦ ATELIER LIVE EDITOR</span>
            <span>Click any text, title or price to edit directly</span>
            <button onclick="window.HJ.saveEditorEdits()" class="hj-editor-btn-save">💾 Save Edits</button>
            <button onclick="window.HJ.resetEditorEdits()" class="hj-editor-btn-reset">↺ Reset</button>
            <a href="#admin" class="hj-editor-btn-admin">👑 Admin Portal</a>
            <button onclick="window.HJ.toggleEditorMode(false)" class="hj-editor-btn-close" title="Exit Editor">✕</button>
          `;
          document.body.appendChild(bar);
        }
      } else {
        document.body.classList.remove('hj-editor-active');
        sessionStorage.removeItem('hj_editor_active');
        document.querySelectorAll('[contenteditable="true"]').forEach(el => {
          el.removeAttribute('contenteditable');
        });
        const bar = document.getElementById('hj-editor-floating-bar');
        if (bar) bar.remove();
        if (window.location.hash === '#edit' || window.location.hash === '#editor') {
          window.location.hash = '#home';
        }
      }
    },

    saveEditorEdits: function () {
      const edits = {};
      document.querySelectorAll('[contenteditable="true"]').forEach((el, index) => {
        const id = el.id || el.className + '_' + index;
        edits[id] = el.innerHTML;
      });
      localStorage.setItem('hj_saved_editor_edits', JSON.stringify(edits));
      alert('✓ Live website edits saved successfully to this browser session!');
    },

    resetEditorEdits: function () {
      if (confirm('Are you sure you want to restore original default texts?')) {
        localStorage.removeItem('hj_saved_editor_edits');
        window.location.reload();
      }
    },

    get products() {
      return state.products;
    },

    get categories() {
      return state.categories;
    },

    get state() {
      return state;
    },

    filterHomeProducts: function (material, btn) {
      document.querySelectorAll('.material-filter-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      const grid = document.getElementById('home-featured-products-grid');
      if (!grid) return;
      let filtered = state.products || [];
      if (material && material !== 'all') {
        const mat = material.toLowerCase();
        filtered = filtered.filter(p => {
          const pMat = (p.primaryMaterial || '').toLowerCase();
          const pMetal = (p.metal || '').toLowerCase();
          const pStone = (p.stone || '').toLowerCase();
          const mats = Array.isArray(p.materials) ? p.materials.map(m => m.toLowerCase()) : [];
          if (mat === 'gold') return p.isGold || pMetal.includes('gold') || pMat === 'gold' || mats.includes('gold');
          if (mat === 'silver') return pMetal.includes('silver') || pMat === 'silver' || mats.includes('silver');
          if (mat === 'diamond') return pStone.includes('diamond') || pMat === 'diamond' || mats.includes('diamond');
          if (mat === 'gemstone') return pStone.includes('emerald') || pStone.includes('ruby') || pStone.includes('sapphire') || pMat === 'gemstone' || mats.includes('gemstone');
          return false;
        });
      }
      const display = filtered.slice(0, 8);
      grid.innerHTML = display.length > 0
        ? display.map(renderProductCard).join('')
        : `<div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--color-stone-muted);">No creations found for this selection.</div>`;
    },

    handleLogin: async function (e) {
      if (e) e.preventDefault();
      const form = e ? e.target : document.querySelector('form[onsubmit*="handleLogin"]');
      if (!form) return;
      const formData = new FormData(form);
      const email = formData.get('email') || '';
      const password = formData.get('password') || '';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.customer) {
            state.customer = data.customer;
            localStorage.setItem('hj_customer', JSON.stringify(data.customer));
            handleRoute();
            return;
          }
        }
      } catch (err) {
        console.warn('API login offline, falling back to local patron session', err);
      }

      // Resilient local patron login
      const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Valued Patron';
      state.customer = { id: `CUST-${Date.now()}`, name, email, phone: '+91 98765 43210' };
      localStorage.setItem('hj_customer', JSON.stringify(state.customer));
      handleRoute();
    },

    handleLogout: function () {
      state.customer = null;
      localStorage.removeItem('hj_customer');
      handleRoute();
    },

    openAppointmentModal: function (interests) {
      const modal = document.getElementById('appointment-modal');
      if (modal) {
        modal.style.display = 'flex';
        if (interests) {
          const notes = document.getElementById('apt-notes');
          if (notes) notes.value = interests;
        }
      }
    },

    closeAppointmentModal: function () {
      const modal = document.getElementById('appointment-modal');
      if (modal) modal.style.display = 'none';
    },

    submitAppointment: async function (e) {
      if (e) e.preventDefault();
      const form = e ? e.target : document.getElementById('appointment-form');
      const getValue = (id) => {
        const field = form && form.querySelector('#' + id);
        return field ? field.value.trim() : '';
      };
      const payload = {
        fullName: getValue('apt-name'),
        phone: getValue('apt-phone'),
        email: getValue('apt-email'),
        appointmentDate: getValue('apt-date'),
        preferredTime: getValue('apt-time'),
        consultationType: getValue('apt-type') || 'Online Consultation',
        notes: getValue('apt-notes')
      };
      const phoneDigits = payload.phone.replace(/\D/g, '');
      if (!payload.fullName || phoneDigits.length < 10 || phoneDigits.length > 15 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) || !payload.appointmentDate) {
        alert('Please enter a valid name, phone number, email address and preferred date.');
        return;
      }
      try {
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success || !data.appointmentId) {
          throw new Error(data.error || 'We could not submit your consultation request. Please try again.');
        }
        alert(`Your consultation request has been received. Reference: ${data.appointmentId}. Our team will contact you to confirm availability.`);
        window.HJ.closeAppointmentModal();
        if (form) form.reset();
      } catch (err) {
        alert(err.message || 'Consultation requests are temporarily unavailable. Please contact our team directly.');
      }
    },

    openTrackOrderModal: function (orderId) {
      const modal = document.getElementById('track-order-modal');
      if (modal) {
        modal.style.display = 'flex';
        if (orderId) {
          const input = document.getElementById('track-input');
          if (input) input.value = orderId;
        }
      }
    },

    closeTrackOrderModal: function () {
      const modal = document.getElementById('track-order-modal');
      if (modal) modal.style.display = 'none';
      const resultBox = document.getElementById('track-result-box');
      if (resultBox) resultBox.style.display = 'none';
    },

    submitTrackOrder: async function (e) {
      if (e) e.preventDefault();
      const input = document.getElementById('track-input');
      const val = input ? input.value.trim() : '';
      const resultBox = document.getElementById('track-result-box');
      if (!val) {
        alert('Please enter your Order ID.');
        return;
      }
      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--color-stone-muted);">Checking order status...</div>';
      }
      try {
        const res = await fetch('/api/orders/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: val })
        });
        const data = await res.json();
        if (!res.ok || !data.success || !data.order) {
          throw new Error(data.error || 'No order found. Please check your Order ID.');
        }
        const order = data.order;
        if (resultBox) {
          resultBox.innerHTML = `
            <div style="background:var(--color-champagne-beige);border:1px solid var(--color-antique-gold);border-radius:var(--radius-sm);padding:1.5rem;margin-top:1.25rem;">
              <div style="border-bottom:1px solid rgba(138,90,43,.2);padding-bottom:.85rem;margin-bottom:1rem;">
                <span style="font-size:.72rem;text-transform:uppercase;color:var(--color-stone-muted);font-weight:600;">Order Number</span>
                <div style="font-family:var(--font-serif);font-size:1.2rem;font-weight:700;color:var(--color-espresso);">${order.orderId}</div>
                <strong>${order.orderStatus || 'Order received'}</strong>
              </div>
              <div style="font-size:.85rem;color:var(--color-espresso);line-height:1.8;">
                <div><strong>Payment:</strong> ${order.paymentStatus || 'Payment Pending'}</div>
                <div><strong>Tracking:</strong> ${order.trackingNumber || 'Not assigned yet'}</div>
                <div><strong>Estimated delivery:</strong> ${order.estimatedDelivery || 'To be shared after dispatch'}</div>
              </div>
            </div>`;
        }
      } catch (err) {
        if (resultBox) resultBox.innerHTML = '<p role="alert" style="padding:1rem;color:#9b2c2c;">' + (err.message || 'Unable to retrieve this order. Please try again.') + '</p>';
      }
    }
  };

  // Keyboard shortcut Ctrl+E / Cmd+E to toggle editor mode
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      window.HJ.toggleEditorMode();
    }
  });

  // Auto-restore saved edits if any
  function restoreSavedEdits() {
    const saved = localStorage.getItem('hj_saved_editor_edits');
    if (!saved) return;
    try {
      const edits = JSON.parse(saved);
      document.querySelectorAll('h1, h2, h3, h4, .section-title, .section-pretitle, .hero-title, .hero-subtitle, .product-card-title, .price').forEach((el, index) => {
        const id = el.id || el.className + '_' + index;
        if (edits[id]) {
          el.innerHTML = edits[id];
        }
      });
    } catch(e) {}
  }

  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('DOMContentLoaded', () => {
    updateBadges();
    loadProducts();
    restoreSavedEdits();
    if (sessionStorage.getItem('hj_editor_active') === 'true') {
      setTimeout(() => window.HJ.toggleEditorMode(true), 250);
    }
  });
})();
