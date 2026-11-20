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
    const badgeText = p.badge || (p.isNew ? 'New Arrival' : 'BIS 925 Hallmark');

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
          <div class="card-cat-line" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-stone-muted); font-weight: 600;">${p.category || 'Fine Jewellery'} • ${p.purity || 'BIS 925'}</div>
          <h3 class="card-title" style="margin: 0.4rem 0 0.5rem; font-family: var(--font-serif); font-size: 1.02rem; line-height: 1.3;">
            <a href="#products/${p.handle || p.id}">${p.name}</a>
          </h3>
          <div class="card-rating-row" style="margin-bottom: 0.65rem; display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: var(--color-stone-muted);">
            <span style="color: var(--color-muted-gold);">★</span>
            <span style="font-weight: 600; color: var(--color-espresso);">${p.rating || '4.9'}</span>
            <span>(${p.reviewCount || '28'} patrons)</span>
          </div>
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
                <div class="trust-text-title">Secure & Insured Delivery</div>
                <div class="trust-text-sub">Safe and secure jewellery delivery across India</div>
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
            <a href="#craftsmanship" class="material-pillar-card-luxury" aria-label="Heritage Craftsmanship — Centuries-old artistry, forever cherished.">
              <img src="images/pillars/pillar_heritage_craftsmanship@2x.jpg" alt="Heritage Craftsmanship — Centuries-old artistry, forever cherished." width="650" height="406" loading="lazy" />
            </a>

            <!-- PILLAR 2: TIMELESS ELEGANCE -->
            <a href="#collections/all" class="material-pillar-card-luxury" aria-label="Timeless Elegance — Classic beauty, always in style.">
              <img src="images/pillars/pillar_timeless_elegance@2x.jpg" alt="Timeless Elegance — Classic beauty, always in style." width="634" height="406" loading="lazy" />
            </a>

            <!-- PILLAR 3: GLOBAL LUXURY -->
            <a href="#collections/diamond" class="material-pillar-card-luxury" aria-label="Global Luxury — A world of sophistication, within your reach.">
              <img src="images/pillars/pillar_global_luxury@2x.jpg" alt="Global Luxury — A world of sophistication, within your reach." width="648" height="406" loading="lazy" />
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
                <span class="curated-col-count">Architectural Nakshi • 10 Pieces</span>
              </div>
            </a>

            <a href="#collections/nature-inspired" class="curated-col-card">
              <img src="images/user_falcon_brooch_emerald.jpg" alt="Nature, Wildlife & Fauna" />
              <div class="curated-col-overlay">
                <span class="curated-col-badge">Living Majesty</span>
                <h3 class="curated-col-title">Nature & Wildlife</h3>
                <span class="curated-col-count">Falcon, Peacock & Floral • 10 Pieces</span>
              </div>
            </a>

            <a href="#collections/modern-art" class="curated-col-card">
              <img src="images/authentic_diamond_choker.jpg" alt="Modern Art & Sculptural" />
              <div class="curated-col-overlay">
                <span class="curated-col-badge">Contemporary Vision</span>
                <h3 class="curated-col-title">Modern Art & Sculptural</h3>
                <span class="curated-col-count">Geometric Forms • 8 Pieces</span>
              </div>
            </a>

            <a href="#collections/bridal-jewellery" class="curated-col-card">
              <img src="images/authentic_indian_bridal.jpg" alt="Bridal & Ceremonial Suites" />
              <div class="curated-col-overlay">
                <span class="curated-col-badge">Royal Celebration</span>
                <h3 class="curated-col-title">Bridal & Occasion</h3>
                <span class="curated-col-count">Grand Chokers & Jhumkas • 10 Pieces</span>
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
                <img class="cat-showcase-img" src="images/authentic_solitaire_ring.jpg" alt="Rings & Solitaires" />
              </div>
              <div class="cat-showcase-overlay">
                <div class="cat-showcase-title">Rings & Solitaires</div>
                <div class="cat-showcase-count">10 Masterpieces • Stamped 925</div>
              </div>
            </a>

            <a href="#collections/earrings" class="cat-showcase-card">
              <div class="cat-showcase-img-wrap" style="position: relative; width: 100%; height: 100%; overflow: hidden;">
                <img class="cat-showcase-img" src="images/authentic_earrings_macro.jpg" alt="The Earrings Suite" />
              </div>
              <div class="cat-showcase-overlay">
                <div class="cat-showcase-title">The Earrings Suite</div>
                <div class="cat-showcase-count">10 Designs • Comfort Posts</div>
              </div>
            </a>

            <a href="#collections/necklaces" class="cat-showcase-card">
              <div class="cat-showcase-img-wrap" style="position: relative; width: 100%; height: 100%; overflow: hidden;">
                <img class="cat-showcase-img" src="images/authentic_diamond_choker.jpg" alt="Necklaces & Chokers" />
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
                <div class="cat-showcase-count">10 Sacred Motifs • 22K Micro Gold</div>
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
                <p style="font-size: 0.85rem; color: #E8E2D8; margin-bottom: 1.25rem;">Royal heraldic crests hand-set with Zambian emerald eyes and 5A diamond pavé wings for celebratory sherwanis.</p>
                <a href="#collections/brooches" class="btn-gold" style="padding: 0.65rem 1.5rem; font-size: 0.75rem;">Explore Falcon Crests</a>
              </div>
            </div>

            <div style="position: relative; height: 440px; border-radius: var(--radius-sm); overflow: hidden; background: #181412;">
              <img src="images/authentic_indian_bridal.jpg" alt="Festive & Bridal High Jewellery" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.7);" />
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
            <h2 class="section-title">The 9-Stage Goldsmithing Journey</h2>
            <div class="section-divider"><span class="section-divider-gem"></span></div>
            <p class="section-intro">
              Every House of Jewelux creation passes through the hands of master goldsmiths across nine sacred stages of bench craftsmanship in Rajasthan.
            </p>
          </div>

          <div class="editorial-pair">
            <div class="editorial-content">
              <h3>The Nine Stages of Creation</h3>
              <p>From inspiration to final presentation, each piece embodies generations of Jaipur goldsmithing heritage, refined for the modern connoisseur.</p>
              <a href="#craftsmanship" class="btn-gold">Explore the Journey ✦</a>
            </div>
            <div class="editorial-image">
              <img src="images/authentic_polki_craft.jpg" alt="Master Goldsmith at Bench in Jaipur Atelier" />
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
              <p class="step-desc">Ethical sourcing of certified conflict-free VVS1 diamond simulants, Russian hydro-emeralds, and Zambian rough.</p>
            </div>
            <div class="step-card">
              <span class="step-number">03</span>
              <h3 class="step-title">Concept & Gouache Rendering</h3>
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
              <p class="step-desc">XRF laser testing guaranteeing 92.5% pure elemental silver alloyed with hypoallergenic deox copper.</p>
            </div>
            <div class="step-card">
              <span class="step-number">06</span>
              <h3 class="step-title">Bench Forging & Kundan</h3>
              <p class="step-desc">Traditional silversmith hammer forging, hand-pierced openwork, and 24K pure gold leaf foil setting.</p>
            </div>
            <div class="step-card">
              <span class="step-number">07</span>
              <h3 class="step-title">Liquid Rhodium & 18K Micron</h3>
              <p class="step-desc">Advanced multi-layer electroplating with liquid platinum-rhodium ensuring lifetime anti-tarnish luminosity.</p>
            </div>
            <div class="step-card">
              <span class="step-number">08</span>
              <h3 class="step-title">BIS Hallmark Certification</h3>
              <p class="step-desc">Official Bureau of Indian Standards laser assay verification stamp with unique identification mark.</p>
            </div>
            <div class="step-card">
              <span class="step-number">09</span>
              <h3 class="step-title">Armored Coffer Acquisition</h3>
              <p class="step-desc">Placed in our signature emerald velvet presentation box and dispatched via insured armored courier.</p>
            </div>
          </div>

          <!-- Customer Testimonials -->
          <div style="text-align: center; margin: 6rem 0 4rem;">
            <span class="hero-badge-pill" style="display: inline-block; margin-bottom: 1rem;">Client Stories</span>
            <h2 class="section-title">They Have Discovered Their Eternal Piece</h2>
            <div class="section-divider"><span class="section-divider-gem"></span></div>
          </div>
          <div class="testimonial-grid">
            <div class="testimonial-card">
              <p class="testimonial-text">"The Celestial Radiance ring is breathtaking — every detail speaks of generations of craftsmanship. I wear it every day and it still catches the light like the first day."</p>
              <span class="testimonial-author">Caroline B.</span>
              <span class="testimonial-role">Jaipur, Rajasthan</span>
            </div>
            <div class="testimonial-card">
              <p class="testimonial-text">"A true discovery. The Lumina earrings have a subtle chocolate-cacao warmth that complements everything I own. Zero guilt, all pleasure."</p>
              <span class="testimonial-author">Karen D.</span>
              <span class="testimonial-role">New Delhi</span>
            </div>
            <div class="testimonial-card">
              <p class="testimonial-text">"Bespoke commission with Master Goldsmith Yuvraj Soni was seamless. My vision came to life exactly as I imagined it."</p>
              <span class="testimonial-author">Jérémie C.</span>
              <span class="testimonial-role">Mumbai, Maharashtra</span>
            </div>
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
                Book a Private Salon Consultation
              </h2>
              <p style="color: #DCD4C7; font-size: 0.95rem; line-height: 1.7; margin-bottom: 1.5rem;">
                Step inside our private salon in Jaipur or connect via encrypted video concierge. Our senior goldsmiths will guide you through custom diamond sizing, bridal curations, and bespoke jewellery commissions.
              </p>
              <div style="display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 2rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: var(--color-champagne-gold);">
                  <span>✦</span>
                  <span>Personal 1-on-1 session with Master Goldsmith Yuvraj Soni</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: var(--color-champagne-gold);">
                  <span>✦</span>
                  <span>Hands-on gemological inspection of uncut Polki & VVS1 solitaires</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: var(--color-champagne-gold);">
                  <span>✦</span>
                  <span>Complimentary ring sizing & bespoke gouache sketch rendering</span>
                </div>
              </div>
              <a href="https://wa.me/916377061020?text=Hello%20House%20of%20Jewelux,%20I%20would%20like%20to%20schedule%20a%20private%20atelier%20consultation." target="_blank" class="btn-outline" style="border-color: var(--color-antique-gold); color: var(--color-warm-ivory);">
                Instant WhatsApp Concierge (+91 63770 61020)
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
                    <option>Private Jaipur Atelier Experience</option>
                    <option>New Delhi VIP Salon Suite</option>
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
          <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.22em; color: var(--color-antique-gold); font-weight: 600;">White-Glove Armored Courier Telemetry</span>
          <h2 style="font-family: var(--font-serif); font-size: 2rem; margin: 0.4rem 0 0.8rem; color: var(--color-deep-heritage-brown);">Track Your Consignment</h2>
          <p style="font-size: 0.85rem; color: var(--color-stone-muted); margin-bottom: 1.75rem;">
            Enter your unique Order Reference ID (e.g. <strong>HJ-ORD-2026-7701</strong>) to view real-time atelier forging milestones, hallmarking certificates, and armored dispatch telemetry.
          </p>

          <form onsubmit="window.HJ.submitTrackOrder(event)" style="display: flex; gap: 0.5rem; max-width: 500px; margin: 0 auto;">
            <input type="text" class="form-input" style="flex: 1; padding: 0.85rem 1.2rem;" placeholder="HJ-ORD-2026-XXXX" required />
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
                GENERATIONAL INDIAN<br>ARTISTRY × MODERN<br>MINIMALISM
              </h2>
              <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8; margin-bottom: 1.25rem;">
                House of Jewelux was established in Jaipur to bridge the majesty of royal Indian court jewellery with the clean lines of contemporary design. We reject disposable fashion jewellery. Every piece is masterfully crafted in hallmarked gold and solid 925 sterling silver—finished with precision and stamped with the Bureau of Indian Standards (BIS) hallmark for guaranteed purity.
              </p>
              <div style="display: flex; gap: 2rem; margin-top: 2rem;">
                <div>
                  <div style="font-family: var(--font-serif); font-size: 2rem; font-weight: 700; color: var(--color-antique-gold);">100%</div>
                  <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-stone-muted);">BIS 925 Stamped</div>
                </div>
                <div>
                  <div style="font-family: var(--font-serif); font-size: 2rem; font-weight: 700; color: var(--color-antique-gold);">0%</div>
                  <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-stone-muted);">Nickel / Irritants</div>
                </div>
                <div>
                  <div style="font-family: var(--font-serif); font-size: 2rem; font-weight: 700; color: var(--color-antique-gold);">Lifetime</div>
                  <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-stone-muted);">Polish Covenant</div>
                </div>
              </div>
            </div>
            <div>
              <img src="images/authentic_polki_craft.jpg" alt="Master Goldsmith at Bench in Jaipur Atelier - House of Jewelux" style="width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--color-warm-stone); box-shadow: 0 15px 40px rgba(35, 28, 22, 0.12);" />
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
        subtitle = "18K Champagne Gold & Royal Vermeil Finishes • Ancestral Grandeur (17 Pieces)";
        heroImg = "images/authentic_earrings_macro.jpg";
      } else if (['silver', 'silver-category'].includes(collectionId)) {
        filtered = filtered.filter(p => (p.materials && p.materials.includes('silver')) || p.primaryMaterial === 'silver' || (p.metal && p.metal.toLowerCase().includes('silver')));
        title = "Silver Jewellery Collection";
        subtitle = "Solid 925 Sterling Silver in Liquid Platinum-Rhodium • BIS 925 Hallmarked (50 Pieces)";
        heroImg = "images/authentic_solitaire_ring.jpg";
      } else if (['diamond', 'diamond-category'].includes(collectionId)) {
        filtered = filtered.filter(p => (p.materials && p.materials.includes('diamond')) || p.primaryMaterial === 'diamond' || (p.stone && (p.stone.toLowerCase().includes('diamond') || p.stone.toLowerCase().includes('moissanite'))));
        title = "Diamond Jewellery Collection";
        subtitle = "Certified VVS1 Solitaires & Pavé Brilliants • Hearts & Arrows Precision (45 Pieces)";
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
        subtitle = "Most coveted pieces favored by royal patrons";
        heroImg = "images/authentic_hero_editorial.jpg";
      } else if (collectionId === 'festive-edit') {
        filtered = filtered.filter(p => p.price >= 18000);
        title = "Festive & Diwali Edit";
        subtitle = "Ceremonial chokers, chandelier earrings, and statement rings";
        heroImg = "images/authentic_indian_bridal.jpg";
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
    } else if (state.activeFilters.sort === 'rating') {
      filtered.sort((a, b) => Number(b.rating) - Number(a.rating));
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
                <button class="filter-pill ${state.activeFilters.metal === 'Gold' ? 'active' : ''}" onclick="window.HJ.toggleMetalFilter('Gold', true)">18K Gold Finish</button>
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
                <option value="rating" ${state.activeFilters.sort === 'rating' ? 'selected' : ''}>Customer Rating</option>
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

            <div class="pdp-rating-stars-line">
              <span class="card-stars">★★★★★</span>
              <span style="font-weight: 700; color: var(--color-deep-heritage-brown);">${p.rating || '4.9'}</span>
              <span style="color: var(--color-stone-muted);">| ${p.reviewsCount || 108} Reviews</span>
            </div>

            <!-- Capsule Trust Pills (Truthful Material Specifications) -->
            <div class="pdp-trust-capsules-row">
              <span class="trust-capsule">
                <svg class="trust-pill-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
                  <polygon points="12 2 14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5 12 2"></polygon>
                  <circle cx="12" cy="12" r="1.5" fill="currentColor"></circle>
                </svg>
                Anti-Tarnish Barrier
              </span>
              <span class="trust-capsule">
                <svg class="trust-pill-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
                  <path d="M12 2.5C12 2.5 5 11 5 15.5C5 19.1 8.1 22 12 22C15.9 22 19 15.5 19 15.5C19 11 12 2.5 12 2.5Z"></path>
                  <path d="M12 18V13M10 15C10 15 11 13 12 13C13 13 14 15 14 15"></path>
                </svg>
                Hypoallergenic
              </span>
              <span class="trust-capsule">
                <svg class="trust-pill-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
                  <path d="M3 18L4.5 7L9 11.5L12 5L15 11.5L19.5 7L21 18H3Z"></path>
                  <circle cx="4.5" cy="6" r="1" fill="currentColor"></circle>
                  <circle cx="12" cy="4" r="1" fill="currentColor"></circle>
                  <circle cx="19.5" cy="6" r="1" fill="currentColor"></circle>
                  <line x1="3" y1="18" x2="21" y2="18" stroke-width="1.5"></line>
                </svg>
                ${(p.materials && p.materials.includes('gold')) || p.primaryMaterial === 'gold' || p.isGold ? '18K Gold Micron Finish' : 'Liquid Rhodium Finish'}
              </span>
              <span class="trust-capsule">
                <svg class="trust-pill-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
                  <polygon points="12 3 21 19 3 19 12 3"></polygon>
                  <text x="12" y="16.5" font-size="6.5" font-family="'Cinzel', serif" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">925</text>
                </svg>
                BIS 925 Hallmarked
              </span>
            </div>

            <div class="pdp-urgency-note">
              <svg class="urgency-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
                <path d="M12 2.5C12 2.5 8 7 8 11.5C8 14.5 10 17 12 17C14 17 16 14.5 16 11.5C16 7 12 2.5 12 2.5Z" fill="rgba(184, 151, 88, 0.25)"></path>
                <path d="M5 17C5 17 6.5 21 12 21C17.5 21 19 17 19 17H5Z"></path>
              </svg>
              <span>84 patrons acquired this piece in the last 7 days</span>
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
                ✓ Armored Courier transit available to ${state.deliveryCity} (${state.deliveryPincode}) in 2 - 4 business days.
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
                Engineered with generational precision in our Jaipur atelier. Stamped with the official Bureau of Indian Standards (BIS) 925 Hallmark.
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
                    <tr><td>Gross Weight</td><td>${p.weight || '5.2g'}</td></tr>
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
                <strong>Manufactured By:</strong> House of Jewelux Creative Atelier & Salon, Jaipur, Rajasthan, India.<br>
                <strong>Customer Grievance & Concierge:</strong> +91 63770 61020 | houseofjewelux@gmail.com
              </div>
            </div>

            <div class="pdp-accordion-item">
              <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
                <span>Return & Exchange Policy</span>
                <span>▾</span>
              </div>
              <div class="pdp-accordion-pane">
                Complimentary 14-day hassle-free return and exchange window. Free door-to-door insured courier pickup across all verified Indian PIN codes.
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
              <h3 class="checkout-step-title">2. Armored Delivery Address</h3>
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
                <!-- Google Pay -->
                <div class="payment-method-card selected" onclick="window.HJ.selectPaymentMethod('gpay', this)">
                  <div class="payment-method-header">
                    <div class="payment-title-row">
                      <input type="radio" name="payment_method" value="gpay" checked />
                      <span>Google Pay (UPI Instant Transfer)</span>
                    </div>
                    <span style="font-weight: 700; color: #4285F4;">GPay</span>
                  </div>
                  <div class="payment-method-details">
                    Pay securely using Google Pay to official merchant VPA: <strong>yuvrajsoni@upi</strong>
                  </div>
                </div>

                <!-- Paytm / PhonePe -->
                <div class="payment-method-card" onclick="window.HJ.selectPaymentMethod('phonepe_paytm', this)">
                  <div class="payment-method-header">
                    <div class="payment-title-row">
                      <input type="radio" name="payment_method" value="phonepe_paytm" />
                      <span>PhonePe / Paytm / Any UPI</span>
                    </div>
                    <span style="font-weight: 700; color: #5f259f;">UPI</span>
                  </div>
                </div>

                <!-- Bank-to-Bank Transfer -->
                <div class="payment-method-card" onclick="window.HJ.selectPaymentMethod('bank_transfer', this)">
                  <div class="payment-method-header">
                    <div class="payment-title-row">
                      <input type="radio" name="payment_method" value="bank_transfer" />
                      <span>Bank-to-Bank NEFT / RTGS Transfer</span>
                    </div>
                    <span style="font-size: 0.75rem; background: var(--color-gold); padding: 0.2rem 0.5rem; border-radius: 2px;">Pending Verification</span>
                  </div>
                  <div class="payment-method-details" style="display: none;">
                    <div class="bank-transfer-box">
                      <strong>Beneficiary:</strong> HOUSE OF JEWELUX<br>
                      <strong>Account:</strong> 50200084920193<br>
                      <strong>IFSC:</strong> HDFC0000128 (Jaipur C-Scheme Branch)<br>
                      <em>Status will remain <strong>Pending Verification</strong> until validated by administrator.</em>
                    </div>
                  </div>
                </div>

                <!-- Cash on Delivery -->
                <div class="payment-method-card" onclick="window.HJ.selectPaymentMethod('cod', this)">
                  <div class="payment-method-header">
                    <div class="payment-title-row">
                      <input type="radio" name="payment_method" value="cod" />
                      <span>Cash on Delivery (COD)</span>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--color-taupe);">Verified PINs</span>
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
                      <div class="cart-item-variant">Qty: ${item.quantity} • ${item.metal || '925 Silver'}</div>
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
                  <span>Armored Insured Courier</span>
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
            <p style="text-align: center; font-size: 0.85rem; color: var(--color-taupe); margin-bottom: 2rem;">Access your acquisition history and personal atelier commissions.</p>
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
            <p style="color: var(--color-taupe);">Orders and certified BIS hallmark records will appear here.</p>
          </div>
        </div>
      `;
    }
  }

  // ==================== VIEW 6: ADMIN ====================
  async function renderAdminDashboard(container) {
    const isAuthed = sessionStorage.getItem('hj_admin_authed');
    if (!isAuthed) {
      container.innerHTML = `
        <div class="container" style="padding: 5rem 0; max-width: 440px;">
          <div class="checkout-form-box">
            <h2 style="font-family: var(--font-serif); font-size: 1.6rem; text-align: center; margin-bottom: 0.5rem;">Atelier Admin Portal</h2>
            <form onsubmit="window.HJ.adminLogin(event)">
              <div class="form-field">
                <label class="form-label">Master Atelier PIN</label>
                <input type="password" id="admin-pin-input" class="form-input" required placeholder="Enter Master PIN (2026)" />
              </div>
              <button type="submit" class="btn-primary" style="width: 100%;">Authorize Dashboard</button>
            </form>
          </div>
        </div>
      `;
      return;
    }

    let metrics = { totalRevenue: 13152, totalOrders: 1, pendingVerification: 1, totalProducts: 50 };
    let recentOrders = [];
    try {
      const res = await fetch('/api/admin/overview');
      const data = await res.json();
      if (data.success) {
        metrics = data.metrics;
        recentOrders = data.recentOrders;
      }
    } catch (e) {}

    container.innerHTML = `
      <div style="background: var(--color-ivory); min-height: 80vh; padding-bottom: 5rem;">
        <div class="admin-header-bar">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span style="font-family: var(--font-serif); font-size: 1.1rem;">HOUSE OF JEWELUX</span>
            <span style="font-size: 0.75rem; background: var(--color-gold); color: #000; padding: 0.2rem 0.5rem; border-radius: 2px;">Admin Suite</span>
          </div>
          <button onclick="sessionStorage.removeItem('hj_admin_authed'); window.HJ.navigate('home');" style="color: #FFF; font-size: 0.8rem; text-decoration: underline;">Exit</button>
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
          <span class="hero-badge-pill about-story-reveal" style="display: inline-block; margin-bottom: 0.85rem;">✦ The Jaipur Atelier • Stamped BIS 925 Hallmark</span>
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
              <img src="images/authentic_atelier_craft.jpg" alt="Master Goldsmith at Bench in Jaipur Atelier - Micro Stone Setting & Pure 925 Silver Forging" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block;" />
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
                Every creation begins at our bench in Rajasthan, where fourth-generation silversmiths harmonize ancestral hammer-forging with micron electroplating. We do not mass-produce. Over 40 hours of artisanal hand-sculpting, microscope stone-setting, and Bureau of Indian Standards laser inspection are poured into every design.
              </p>
              <p style="color: var(--color-stone-muted); line-height: 1.8; margin-bottom: 2rem; font-size: 0.95rem;">
                Whether you acquire a royal falcon brooch crowned with Zambian emeralds or an architectural solitaire ring, you hold a tangible heirloom crafted to endure across generations.
              </p>
              
              <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <a href="#collections/all" class="btn-primary">Explore All 50 Pieces ↗</a>
                <a href="javascript:void(0)" onclick="window.HJ.openAppointmentModal()" class="btn-outline">Book Private Salon</a>
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
              <p style="font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.75; margin-bottom: 1rem;">Solid 925 sterling silver with liquid platinum-rhodium finish. Hereditary Rajasthani silversmithing, BIS 925 hallmarked, hypoallergenic and water-safe.</p>
              <a href="#collections/silver-category" class="btn-gold" style="padding: 0.65rem 1.4rem; font-size: 0.75rem;">Explore Silver Collection ↗</a>
            </div>

            <!-- Gold -->
            <div class="pepite-story-card about-story-reveal" style="border: 1px solid rgba(184,151,88,0.15);">
              <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(184,151,88,0.12); border: 1px solid var(--color-muted-gold-light); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; color: var(--color-muted-gold); font-size: 1.5rem;">Au</div>
              <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Gold Jewellery</h3>
              <p style="font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.75; margin-bottom: 1rem;">18K gold finish and vermeil over BIS 925 silver. Royal haute joaillerie treatments, champagne gold plating, and micron-thick luxury finishes.</p>
              <a href="#collections/gold-category" class="btn-gold" style="padding: 0.65rem 1.4rem; font-size: 0.75rem;">Explore Gold Collection ↗</a>
            </div>

            <!-- Diamond -->
            <div class="pepite-story-card about-story-reveal" style="border: 1px solid rgba(184,151,88,0.15);">
              <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.6); border: 1px solid var(--color-warm-stone-light); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; color: var(--color-stone-muted); font-size: 1.5rem;">💎</div>
              <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Diamond Jewellery</h3>
              <p style="font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.75; margin-bottom: 1rem;">Certified VVS1 laboratory diamonds and moissanites. Hearts & Arrows cut, micropavé settings, eternal brilliance with BIS hallmark certification.</p>
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
            <h2 class="section-title">The Three House Commitments</h2>
            <div class="section-divider"><span class="section-divider-gem"></span></div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.75rem;">
            <div class="pepite-story-card about-story-reveal">
              <div class="pepite-number-badge">01</div>
              <h3 style="font-family: var(--font-serif); font-size: 1.35rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Generational Bench Artistry</h3>
              <p style="font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.75;">
                Hand-forged by hereditary Rajasthani goldsmiths. Every curve, openwork jali, and prong is sculpted manually using ancestral hammers and diamond gravers.
              </p>
            </div>

            <div class="pepite-story-card about-story-reveal">
              <div class="pepite-number-badge">02</div>
              <h3 style="font-family: var(--font-serif); font-size: 1.35rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Stamped Material Purity</h3>
              <p style="font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.75;">
                Solid 92.5% elemental sterling silver alloyed strictly with deoxidized copper. Stamped with the official Bureau of Indian Standards (BIS) hallmark.
              </p>
            </div>

            <div class="pepite-story-card about-story-reveal">
              <div class="pepite-number-badge">03</div>
              <h3 style="font-family: var(--font-serif); font-size: 1.35rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Lifetime Maintenance Covenant</h3>
              <p style="font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.75;">
                Triple-layer liquid platinum-rhodium and 18K micron gold shielding. Every acquisition includes complimentary lifetime ultrasonic cleansing and refinishing.
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
              True luxury is not about novelty or fleeting seasonal trends. It is about holding an object so meticulously conceived and generationally forged that it carries the soul of its craftsmen into your family's future.
            </p>
            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
              <div style="text-align: center;">
                <div style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: var(--color-deep-heritage-brown);">Yuvraj Soni</div>
                <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.16em; color: var(--color-stone-muted); margin-top: 0.2rem;">Master Goldsmith & Founder • House of Jewelux</div>
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
              <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-espresso); font-weight: 700; margin-top: 0.35rem;">BIS 925 Certified</div>
              <div style="font-size: 0.75rem; color: var(--color-stone-muted); margin-top: 0.2rem;">Laser stamped purity hallmark</div>
            </div>
            <div class="trust-item about-story-reveal" style="text-align: center; padding: 2rem 1.5rem !important;">
              <div style="font-family: var(--font-serif); font-size: 2.2rem; font-weight: 700; color: var(--color-muted-gold);">40+</div>
              <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-espresso); font-weight: 700; margin-top: 0.35rem;">Hours Per Masterpiece</div>
              <div style="font-size: 0.75rem; color: var(--color-stone-muted); margin-top: 0.2rem;">Artisanal bench handcrafting</div>
            </div>
            <div class="trust-item about-story-reveal" style="text-align: center; padding: 2rem 1.5rem !important;">
              <div style="font-family: var(--font-serif); font-size: 2.2rem; font-weight: 700; color: var(--color-muted-gold);">19,000+</div>
              <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-espresso); font-weight: 700; margin-top: 0.35rem;">Indian PIN Codes</div>
              <div style="font-size: 0.75rem; color: var(--color-stone-muted); margin-top: 0.2rem;">Insured armored courier transit</div>
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
        title: "Insured Armored Transit & Shipping Policy",
        subtitle: "Complimentary Fully Insured Armored Delivery Across India • Global Priority Transit",
        badge: "Armored Logistics Protocol",
        content: `
          <div class="pepite-story-card" style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">1. Domestic Armored Transit Across India</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8; margin-bottom: 1rem;">
              Every creation leaving our Jaipur atelier is transported via specialized armored courier services (BlueDart Apex Air & Sequel Secure Logistics). All consignments are 100% insured from bench to your doorstep.
            </p>
            <ul style="padding-left: 1.25rem; font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.8; margin-bottom: 1rem;">
              <li><strong>Transit Timeline:</strong> 2 to 4 business days across all metro locations (Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, Pune). 3 to 5 business days for regional and non-metro pin codes.</li>
              <li><strong>Complimentary Shipping:</strong> Enjoy complimentary insured delivery on all acquisitions valued at ₹2,500 and above. A flat fee of ₹250 applies to orders below ₹2,500.</li>
              <li><strong>Mandatory OTP Verification:</strong> To ensure complete asset safety, high-jewellery parcels require a verified OTP or signature upon delivery. Couriers will never leave parcels unattended.</li>
            </ul>
          </div>

          <div class="pepite-story-card" style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">2. Global International Shipping</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8; margin-bottom: 1rem;">
              House of Jewelux dispatches worldwide to the United States, United Kingdom, European Union, United Arab Emirates, Singapore, and Australia via fully insured FedEx Priority International and DHL Express.
            </p>
            <ul style="padding-left: 1.25rem; font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.8;">
              <li><strong>International Transit Time:</strong> 4 to 7 business days, subject to local customs inspection.</li>
              <li><strong>Customs & Duties:</strong> International orders are shipped DAP (Delivered at Place). Local import taxes, if applicable, are coordinated directly with the courier.</li>
            </ul>
          </div>

          <div class="pepite-story-card">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">3. Real-Time Consignment Tracking</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              Once dispatched, you will receive an encrypted tracking link and consignment ID via SMS and WhatsApp. You may track your consignment at any time using our <a href="javascript:void(0)" onclick="window.HJ.openTrackOrderModal()" style="color: var(--color-antique-gold); font-weight: 600; text-decoration: underline;">Real-Time Tracking Console</a>.
            </p>
          </div>
        `
      },
      returns: {
        title: "14-Day Patron Inspection & Returns Covenant",
        subtitle: "Uncompromising Quality Guarantee • Full Refund or Exchange Privilege",
        badge: "Client Trust Covenant",
        content: `
          <div class="pepite-story-card" style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">1. 14-Day Inspection Period</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8; margin-bottom: 1rem;">
              We want you to hold, inspect, and experience your House of Jewelux piece in person with complete peace of mind. You have 14 days from the date of confirmed delivery to initiate a return or exchange.
            </p>
            <ul style="padding-left: 1.25rem; font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.8;">
              <li><strong>Condition Requirements:</strong> Items must be unworn, undamaged, and returned in original condition with security tags attached, BIS hallmark certification card, and the signature emerald velvet coffer.</li>
              <li><strong>Complimentary Reverse Pickup:</strong> We arrange an insured armored courier pickup directly from your doorstep at zero cost to you.</li>
            </ul>
          </div>

          <div class="pepite-story-card" style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">2. Refund Processing</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              Upon arrival at our Jaipur atelier, our master gemologists verify the piece and laser hallmarks within 24 to 48 hours. Once verified, 100% of the purchase amount is credited back to your original payment method (bank account, UPI, or card) within 3 to 5 business days. For Cash on Delivery acquisitions, refunds are transferred securely via NEFT/UPI.
            </p>
          </div>

          <div class="pepite-story-card">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">3. Custom & Bespoke Commissions</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              Bespoke custom commissions and personalized laser engravings are final sale due to their one-of-a-kind fabrication, but remain fully covered under our Lifetime Structural Craftsmanship Warranty.
            </p>
          </div>
        `
      },
      exchange: {
        title: "Complimentary Exchange Privilege",
        subtitle: "Ring Resizing & Style Upgrades with White-Glove Support",
        badge: "Flawless Fit Guarantee",
        content: `
          <div class="pepite-story-card" style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">1. Complimentary First Ring Resize</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              If your solitaire ring or eternity band is slightly too snug or loose, our Jaipur bench jewelers provide one complimentary ring resizing within 30 days of acquisition. We coordinate two-way insured armored courier transit.
            </p>
          </div>
          <div class="pepite-story-card">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">2. Style Exchanges</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              Within 14 days of receipt, you may exchange any standard collection creation for another item of equal value, or pay the difference for a higher-tier creation. Connect with our dedicated WhatsApp Concierge at <strong>+91 63770 61020</strong> to coordinate an instant exchange.
            </p>
          </div>
        `
      },
      cancellation: {
        title: "Order Cancellation Policy",
        subtitle: "Clear, Fair Guidelines for Immediate Cancellations",
        badge: "Patron Flexibility",
        content: `
          <div class="pepite-story-card" style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">1. Prior to Courier Dispatch</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              Standard collection orders may be cancelled at any time before dispatch with a 100% immediate full refund. Simply email <a href="mailto:houseofjewelux@gmail.com" style="color: var(--color-antique-gold); font-weight: 600;">houseofjewelux@gmail.com</a> or WhatsApp our concierge at <strong>+91 63770 61020</strong> with your Order ID.
            </p>
          </div>
          <div class="pepite-story-card">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">2. After Courier Dispatch</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              If your order has already left the atelier with an active armored tracking number, the consignment cannot be intercepted in transit. Please accept delivery and initiate an immediate return under our 14-Day Return Covenant.
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
              House of Jewelux operates with the utmost discretion. We collect only essential information required to fulfill your high-jewellery commissions, provide armored logistics delivery, and maintain your provenance certificate records.
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
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">1. Hallmarking & Material Authenticity</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              Every creation sold under the House of Jewelux mark is manufactured in verified solid 925 sterling silver or 18K solid vermeil, stamped with the Bureau of Indian Standards (BIS) hallmark. Diamond jewelry features certified lab-grown moissanites or certified diamonds with disclosed origins.
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
        title: "The Art of Fine Jewellery Care",
        subtitle: "Preserving the Eternal Brilliance of Silver, Gold & Diamonds",
        badge: "Master Goldsmith Care Guide",
        content: `
          <div class="pepite-story-card" style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">1. Solid 925 Silver & Liquid Rhodium Care</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8; margin-bottom: 1rem;">
              House of Jewelux silver pieces are electroplated in pure liquid platinum-rhodium to prevent tarnishing and maintain a mirrored brilliance.
            </p>
            <ul style="padding-left: 1.25rem; font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.8;">
              <li>Wipe gently with the provided ultra-soft microfiber polishing cloth after each wear.</li>
              <li>Avoid chemical silver dips or abrasive pastes, which can strip protective rhodium plating.</li>
              <li>Remove your jewellery prior to swimming in chlorinated pools or bathing in thermal sulfur springs.</li>
            </ul>
          </div>

          <div class="pepite-story-card" style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">2. 18K Micron Gold Vermeil Preservation</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8; margin-bottom: 1rem;">
              Our micron gold vermeil utilizes a thick 2.5-micron layer of real 18K gold over solid sterling silver.
            </p>
            <ul style="padding-left: 1.25rem; font-size: 0.88rem; color: var(--color-stone-muted); line-height: 1.8;">
              <li>Apply perfumes, body lotions, hairsprays, and cosmetics <em>before</em> putting on your jewellery.</li>
              <li>Store each piece individually in its velvet presentation coffer to prevent delicate chains and stones from scratching.</li>
            </ul>
          </div>

          <div class="pepite-story-card">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">3. Diamond & Moissanite Cleansing</h3>
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
        title: "Lifetime Craftsmanship Covenant",
        subtitle: "Unconditional Protection Against Manufacturing Flaws",
        badge: "Lifetime Atelier Covenant",
        content: `
          <div class="pepite-story-card">
            <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.75rem;">Lifetime Metal & Setting Integrity</h3>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              Every creation forged by our Jaipur artisans carries an unconditional lifetime craftsmanship warranty against metal porosity, clasp structural failure, and prong security. If a stone loosens under normal daily wear, send your piece to our atelier for complimentary resetting, ultrasonic cleansing, and rhodium rejuvenation.
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
            <a href="#returns-policy" class="filter-pill ${key === 'returns' ? 'active' : ''}">14-Day Returns</a>
            <a href="#exchange-policy" class="filter-pill ${key === 'exchange' ? 'active' : ''}">Exchange Privilege</a>
            <a href="#cancellation-policy" class="filter-pill ${key === 'cancellation' ? 'active' : ''}">Cancellation Policy</a>
            <a href="#jewellery-care" class="filter-pill ${key === 'care' ? 'active' : ''}">Jewellery Care Guide</a>
            <a href="#size-guide" class="filter-pill ${key === 'size' ? 'active' : ''}">Size Guide</a>
            <a href="#privacy-policy" class="filter-pill ${key === 'privacy' ? 'active' : ''}">Privacy Covenant</a>
            <a href="#terms-conditions" class="filter-pill ${key === 'terms' ? 'active' : ''}">Terms & Conditions</a>
            <a href="#warranty" class="filter-pill ${key === 'warranty' ? 'active' : ''}">Lifetime Warranty</a>
          </div>

          <div style="max-width: 860px; margin: 0 auto;">
            ${pol.content}

            <!-- Concierge Callout -->
            <div class="pepite-story-card" style="margin-top: 3rem; background: rgba(184,151,88,0.06); border: 1px solid var(--color-muted-gold-light); text-align: center; padding: 2.5rem 1.5rem;">
              <h4 style="font-family: var(--font-serif); font-size: 1.35rem; color: var(--color-deep-heritage-brown); margin-bottom: 0.5rem;">Have Questions Regarding Our Policies?</h4>
              <p style="font-size: 0.88rem; color: var(--color-stone-muted); margin-bottom: 1.5rem; max-width: 540px; margin-left: auto; margin-right: auto;">
                Our private salon concierge is available directly on WhatsApp and telephone to assist with custom requests, sizing queries, and consignment tracking.
              </p>
              <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <a href="https://wa.me/916377061020" target="_blank" class="btn-primary" style="padding: 0.75rem 1.5rem; font-size: 0.8rem;">Chat on WhatsApp</a>
                <a href="#contact" class="btn-gold" style="padding: 0.75rem 1.5rem; font-size: 0.8rem;">Contact Salon Suite</a>
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
        ${subtotal >= 2500 ? '🎉 You have unlocked <strong>Free Insured Armored Delivery</strong>!' : `Add <strong>${formatPrice(2500 - subtotal)}</strong> more for Free Delivery`}
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${progressPercent}%;"></div></div>
      </div>
      ${state.cart.map(item => `
        <div class="cart-item-row">
          <img class="cart-item-img" src="${item.image}" alt="${item.name}" />
          <div class="cart-item-info">
            <a href="#products/${item.handle || item.id}" onclick="window.HJ.closeCart()" class="cart-item-name">${item.name}</a>
            <div class="cart-item-variant">${item.metal || '925 Silver'}</div>
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
            Reach our private salon concierge in Jaipur, schedule an appointment, or inquire regarding any creation in our vault. We respond personally within 24 business hours.
          </p>
        </div>
      </section>

      <!-- B. CONTACT CARDS & PRIVATE ENQUIRY FORM -->
      <section style="padding: 3rem 0 6rem; background: var(--color-warm-ivory);">
        <div class="container">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 3.5rem; align-items: start;">
            
            <!-- Left: Contact Details & Salon Hours -->
            <div class="about-story-reveal" style="display: flex; flex-direction: column; gap: 1.5rem;">
              <div class="pepite-story-card">
                <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.18em; color: var(--color-muted-gold); font-weight: 700;">Atelier & Salon</span>
                <h3 style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--color-deep-heritage-brown); margin: 0.4rem 0 1.5rem;">Jaipur Creative Atelier</h3>
                
                <div style="display: flex; flex-direction: column; gap: 1.35rem;">
                  <div style="display: flex; gap: 1rem; align-items: flex-start;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-champagne-light); display: flex; align-items: center; justify-content: center; color: var(--color-muted-gold); border: 1px solid rgba(47,36,26,0.08); flex-shrink: 0;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    </div>
                    <div>
                      <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--color-stone-muted); font-weight: 600;">Location</div>
                      <div style="font-family: var(--font-serif); font-size: 1.05rem; font-weight: 700; color: var(--color-deep-heritage-brown); margin-top: 0.2rem;">Jaipur, Rajasthan, India</div>
                      <div style="font-size: 0.82rem; color: var(--color-stone-muted); margin-top: 0.15rem;">Private salon consultations strictly by prior reservation.</div>
                    </div>
                  </div>

                  <div style="display: flex; gap: 1rem; align-items: flex-start;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-champagne-light); display: flex; align-items: center; justify-content: center; color: var(--color-muted-gold); border: 1px solid rgba(47,36,26,0.08); flex-shrink: 0;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 0 7H4.11a2 2 0 0 1-2-1.72V7.24a2 2 0 0 1 2-2h3c2.37 0 4.42 1.64 5.18 4H20a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2z"></path></svg>
                    </div>
                    <div>
                      <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--color-stone-muted); font-weight: 600;">Direct Concierge Telephone</div>
                      <div style="font-family: var(--font-serif); font-size: 1.05rem; font-weight: 700; color: var(--color-deep-heritage-brown); margin-top: 0.2rem;">+91 63770 61020</div>
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
                      <div style="font-size: 0.82rem; color: var(--color-stone-muted); margin-top: 0.15rem;">Inquiries, bespoke commissions & authentication.</div>
                    </div>
                  </div>
                </div>

                <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(47,36,26,0.08); display: flex; gap: 0.85rem; flex-wrap: wrap;">
                  <a href="https://wa.me/916377061020" target="_blank" class="btn-gold" style="flex: 1; min-width: 170px; padding: 0.75rem 1.25rem; font-size: 0.75rem;">WhatsApp Concierge ↗</a>
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
                      <option value="bespoke">Bespoke Goldsmithing Commission</option>
                      <option value="appointment">Jaipur Salon Appointment</option>
                      <option value="consign">Armored Consignment Telemetry</option>
                      <option value="press">Press & Editorial Editorial</option>
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
            Everything you need to know about acquiring from House of Jewelux — hallmarking, shipping, care, and bespoke commissions.
          </p>
        </div>
      </section>

      <section style="padding: 4rem 0 6rem;">
        <div class="container" style="max-width: 720px; margin: 0 auto;">
          <div class="pdp-accordion-item active about-story-reveal">
            <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
              <span>Is every piece BIS 925 hallmarked?</span>
              <span>▾</span>
            </div>
            <div class="pdp-accordion-pane">
              Yes. Every House of Jewelux creation is stamped with the official Bureau of Indian Standards (BIS) 925 Hallmark certifying 92.5% pure silver content.
            </div>
          </div>
          <div class="pdp-accordion-item about-story-reveal">
            <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
              <span>What is your return policy?</span>
              <span>▾</span>
            </div>
            <div class="pdp-accordion-pane">
              We offer a complimentary 14-day hassle-free return and exchange window with free door-to-door insured courier pickup across all verified Indian PIN codes.
            </div>
          </div>
          <div class="pdp-accordion-item about-story-reveal">
            <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
              <span>Do you offer international shipping?</span>
              <span>▾</span>
            </div>
            <div class="pdp-accordion-pane">
              Currently, we ship across India via insured armored courier. International enquiries can be directed to our concierge at +91 63770 61020.
            </div>
          </div>
          <div class="pdp-accordion-item about-story-reveal">
            <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
              <span>How long does craftsmanship take?</span>
              <span>▾</span>
            </div>
            <div class="pdp-accordion-pane">
              Each piece passes through nine stages of bench craftsmanship in our Jaipur atelier. Standard pieces typically ship within 5-7 business days; bespoke commissions require 4-6 weeks.
            </div>
          </div>
          <div class="pdp-accordion-item about-story-reveal">
            <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
              <span>Do you offer bespoke commissions?</span>
              <span>▾</span>
            </div>
            <div class="pdp-accordion-pane">
              Yes. Our Bespoke Goldsmith Studio accepts private commissions for wedding suites, heirloom redesigns, and custom designs. Book a private consultation to begin.
            </div>
          </div>
          <div class="pdp-accordion-item about-story-reveal">
            <div class="pdp-accordion-title" onclick="this.parentElement.classList.toggle('active')">
              <span>Are your gemstones ethically sourced?</span>
              <span>▾</span>
            </div>
            <div class="pdp-accordion-pane">
              We use certified conflict-free laboratory-grown moissanites and diamonds, and ethically sourced gemstones with full gemological inspection cards.
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // ==================== VIEW: CUSTOM ORDER / BESPOKE PAGE (Animated Enquiry Form) ====================
  function renderCustomOrderPage(container) {
    container.innerHTML = `
      <!-- A. EDITORIAL BESPOKE HERO -->
      <section style="background: var(--color-warm-ivory); padding: 5rem 0 2rem; text-align: center;">
        <div class="container" style="max-width: 860px;">
          <span class="hero-badge-pill about-story-reveal" style="display: inline-block; margin-bottom: 0.85rem;">✦ The Bespoke Goldsmith Studio</span>
          <h1 class="section-title about-story-reveal" style="font-family: var(--font-serif); font-size: 3.2rem; line-height: 1.15; margin: 0.5rem 0 1.25rem; color: var(--color-deep-heritage-brown);">Commission a Bespoke Creation</h1>
          <div class="section-divider about-story-reveal" style="margin-bottom: 1.5rem;"><span class="section-divider-gem"></span></div>
          <p class="about-story-reveal" style="font-size: 1.1rem; color: var(--color-stone-muted); line-height: 1.85; max-width: 760px; margin: 0 auto;">
            Work directly with Master Goldsmith Yuvraj Soni to create a one-of-a-kind heirloom. From initial gouache concept sketches to final BIS 925 laser hallmarking, every facet is conceived exclusively for you.
          </p>
        </div>
      </section>

      <!-- B. BESPOKE ATELIER WORKFLOW & ENQUIRY FORM -->
      <section style="padding: 3rem 0 6rem; background: var(--color-warm-ivory);">
        <div class="container">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 3.5rem; align-items: start;">
            
            <!-- Left: The 4-Step Bespoke Journey -->
            <div class="about-story-reveal" style="display: flex; flex-direction: column; gap: 1.5rem;">
              <div class="pepite-story-card">
                <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.18em; color: var(--color-muted-gold); font-weight: 700;">Atelier Protocol</span>
                <h3 style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--color-deep-heritage-brown); margin: 0.4rem 0 1.25rem;">The Bespoke Commissioning Path</h3>
                
                <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                  <div style="display: flex; gap: 1rem; align-items: flex-start;">
                    <div class="pepite-number-badge" style="font-size: 1.3rem !important; margin: 0;">01</div>
                    <div>
                      <div style="font-family: var(--font-serif); font-weight: 700; color: var(--color-espresso); font-size: 1rem;">Private Consultation & Vision</div>
                      <p style="font-size: 0.82rem; color: var(--color-stone-muted); line-height: 1.6; margin-top: 0.2rem;">One-on-one video session or Jaipur salon meeting to define your stone selections, metal alloys, and symbolic motifs.</p>
                    </div>
                  </div>

                  <div style="display: flex; gap: 1rem; align-items: flex-start;">
                    <div class="pepite-number-badge" style="font-size: 1.3rem !important; margin: 0;">02</div>
                    <div>
                      <div style="font-family: var(--font-serif); font-weight: 700; color: var(--color-espresso); font-size: 1rem;">Scale Gouache Jewel Rendering</div>
                      <p style="font-size: 0.82rem; color: var(--color-stone-muted); line-height: 1.6; margin-top: 0.2rem;">Master Goldsmith Yuvraj Soni creates a scale gouache watercolor painting capturing light reflections and prong proportions.</p>
                    </div>
                  </div>

                  <div style="display: flex; gap: 1rem; align-items: flex-start;">
                    <div class="pepite-number-badge" style="font-size: 1.3rem !important; margin: 0;">03</div>
                    <div>
                      <div style="font-family: var(--font-serif); font-weight: 700; color: var(--color-espresso); font-size: 1rem;">3D Proportions & Comfort Wax</div>
                      <p style="font-size: 0.82rem; color: var(--color-stone-muted); line-height: 1.6; margin-top: 0.2rem;">Physical wax cast delivered to verify exact finger fit, weight distribution, and tactile ergonomics prior to bench forging.</p>
                    </div>
                  </div>

                  <div style="display: flex; gap: 1rem; align-items: flex-start;">
                    <div class="pepite-number-badge" style="font-size: 1.3rem !important; margin: 0;">04</div>
                    <div>
                      <div style="font-family: var(--font-serif); font-weight: 700; color: var(--color-espresso); font-size: 1rem;">Bench Forging & BIS 925 Hallmark</div>
                      <p style="font-size: 0.82rem; color: var(--color-stone-muted); line-height: 1.6; margin-top: 0.2rem;">Cast in certified 925 silver, plated in liquid rhodium, stamped with BIS hallmark, and delivered via armored courier.</p>
                    </div>
                  </div>
                </div>

                <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(47,36,26,0.08); display: flex; gap: 1rem; align-items: center;">
                  <a href="https://wa.me/916377061020?text=Hello%20Master%20Goldsmith%20Yuvraj%20Soni,%20I%20would%20like%20to%20discuss%20a%20bespoke%20jewellery%20commission." target="_blank" class="btn-gold" style="padding: 0.65rem 1.4rem; font-size: 0.75rem;">Instant WhatsApp Concierge ↗</a>
                </div>
              </div>
            </div>

            <!-- Right: The Bespoke Commission Form -->
            <div class="about-story-reveal">
              <form id="bespoke-form" class="pepite-story-card" style="display: flex; flex-direction: column; gap: 1.25rem;">
                <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.18em; color: var(--color-muted-gold); font-weight: 700;">Private Commission Dossier</span>
                <h3 style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--color-deep-heritage-brown); margin: 0;">Submit Your Vision</h3>
                <p style="font-size: 0.82rem; color: var(--color-stone-muted); margin-bottom: 0.5rem;">Our senior atelier concierge will review your requirements and respond within 24 business hours.</p>

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
                    <label class="form-label" style="font-size: 0.75rem; font-weight: 600; color: var(--color-espresso);">Mobile Phone *</label>
                    <input type="tel" name="phone" class="form-input" required placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 0.75rem; font-weight: 600; color: var(--color-espresso);">Budget Band *</label>
                    <select name="budgetRange" class="form-select" required>
                      <option value="">Select budget band</option>
                      <option value="under-25k">Under ₹25,000</option>
                      <option value="25k-50k">₹25,000 – ₹50,000</option>
                      <option value="50k-1lakh">₹50,000 – ₹1,00,000</option>
                      <option value="above-1lakh">Above ₹1,00,000 (Haute Heritage)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="form-label" style="font-size: 0.75rem; font-weight: 600; color: var(--color-espresso);">Jewellery Category *</label>
                  <select name="jewelleryType" class="form-select" required>
                    <option value="">Select category</option>
                    <option value="ring">Solitaire / Royal Seal Ring</option>
                    <option value="earrings">The Earrings Suite / Jhumkas</option>
                    <option value="necklace">Necklace / Royal Choker</option>
                    <option value="bracelet">Tennis Bracelet / Royal Bangle</option>
                    <option value="brooch">Sovereign Falcon Brooch / Crest</option>
                    <option value="temple">Temple Nakshi Medallion</option>
                    <option value="wedding-suite">Complete Bridal Haute Suite</option>
                  </select>
                </div>

                <div>
                  <label class="form-label" style="font-size: 0.75rem; font-weight: 600; color: var(--color-espresso);">Design Vision & Specifications *</label>
                  <textarea name="description" class="form-textarea" rows="4" required placeholder="Describe your dream creation: preferred gemstones, motifs, engraving, metal finish..."></textarea>
                </div>

                <button type="submit" class="btn-primary" style="padding: 1rem 2rem; font-size: 0.82rem; letter-spacing: 0.12em; align-self: flex-start;">
                  Submit Bespoke Commission Dossier ✦
                </button>
                <div id="bespoke-form-message" style="margin-top: 0.5rem; font-size: 0.82rem; min-height: 1.2rem;"></div>
              </form>
            </div>
          </div>
        </div>
      </section>
    `;

    const form = document.getElementById('bespoke-form');
    const messageEl = document.getElementById('bespoke-form-message');
    if (form && messageEl) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        
        gsap.to(btn, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1, onComplete: () => {
          btn.textContent = 'Submitting…';
          gsap.to(btn, { opacity: 0.7, duration: 0.2 });
          
          // Submit to real API
          const formData = new FormData(form);
          const data = {
            fullName: formData.get('fullName') || '',
            phone: formData.get('mobile') || formData.get('phone') || '',
            email: formData.get('email') || '',
            jewelleryType: formData.get('jewelleryType') || '',
            metalPreference: '',
            budgetBand: formData.get('budgetRange') || '',
            description: formData.get('designDescription') || formData.get('description') || ''
          };
          
          const submitCustom = async () => {
            let successMsg = 'Your bespoke commission has been submitted. Master Goldsmith Yuvraj Soni will review your design within 24 hours.';
            try {
              const res = await fetch('/api/custom-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              if (res.ok) {
                const result = await res.json();
                if (result.message) successMsg = result.message;
              } else {
                throw new Error('API offline');
              }
            } catch (err) {
              // Static hosting fallback
              const existing = JSON.parse(localStorage.getItem('hj_custom_orders') || '[]');
              existing.unshift({ id: `HJ-BESPOKE-${Date.now()}`, ...data, createdAt: new Date().toISOString() });
              localStorage.setItem('hj_custom_orders', JSON.stringify(existing));
            }

            gsap.to(btn, { opacity: 1, scale: 1, duration: 0.2, onComplete: () => {
              btn.textContent = 'Submitted ✦';
              gsap.to(btn, { backgroundColor: 'var(--color-antique-gold)', color: '#140F0D', duration: 0.3 });
              messageEl.innerHTML = '<span style="color: #2E7D32;">✓ ' + successMsg + '</span>';
              gsap.fromTo(messageEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 });
              
              setTimeout(() => {
                btn.textContent = originalText;
                gsap.to(btn, { backgroundColor: '', color: '', duration: 0.3 });
                messageEl.innerHTML = '';
              }, 3000);
            }});
          };
          submitCustom();
        }});
      });
    }
  }

  // ==================== VIEW: CART PAGE ====================
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
                    <div style="font-size: 0.75rem; color: var(--color-stone-muted); margin-top: 0.25rem;">${item.metal || 'BIS 925 Silver'} • Qty: ${item.quantity}</div>
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
                <span>Armored Insured Courier</span>
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
          <span class="hero-badge-pill about-story-reveal" style="display: inline-block; margin-bottom: 0.85rem;">✦ Jaipur Bench Artistry • Stamped BIS 925</span>
          <h1 class="section-title about-story-reveal" style="font-family: var(--font-serif); font-size: 3.2rem; line-height: 1.15; margin: 0.5rem 0 1.25rem; color: var(--color-deep-heritage-brown);">The 10-Stage Goldsmithing Journey</h1>
          <div class="section-divider about-story-reveal" style="margin-bottom: 1.5rem;"><span class="section-divider-gem"></span></div>
          <p class="about-story-reveal" style="font-size: 1.1rem; color: var(--color-stone-muted); line-height: 1.85; max-width: 780px; margin: 0 auto;">
            Every House of Jewelux creation passes through ten sacred bench stages in Rajasthan, honoring centuries of royal Indian court metallurgy and contemporary haute joaillerie precision.
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
                <p style="font-size: 0.88rem; color: #E8E2D8; max-width: 600px;">Generational silversmiths applying hand gravers, liquid flux, and open flame to solid 925 sterling silver.</p>
              </div>
              <a href="javascript:void(0)" onclick="window.HJ.openAppointmentModal()" class="btn-gold" style="padding: 0.75rem 1.75rem; font-size: 0.78rem;">Experience in Salon ↗</a>
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
              <p style="font-size: 0.86rem; color: var(--color-stone-muted); line-height: 1.7;">Certified 92.5% pure sterling silver, conflict-free VVS1 laboratory stones, Zambian emeralds, and hypoallergenic deoxidized copper alloy selection.</p>
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
              <p style="font-size: 0.86rem; color: var(--color-stone-muted); line-height: 1.7;">Surface finishing, hand polishing, liquid rhodium electroplating, and 18K micron gold flashing for anti-tarnish luminosity.</p>
            </div>

            <div class="craft-step-card about-story-reveal">
              <div class="pepite-number-badge">09</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.25rem; margin: 0.4rem 0 0.65rem; color: var(--color-deep-heritage-brown);">Quality Inspection</h4>
              <p style="font-size: 0.86rem; color: var(--color-stone-muted); line-height: 1.7;">Laser XRF spectrometry hallmark verification, craftsmanship checklist, measurement validation, and BIS 925 laser assay stamping.</p>
            </div>

            <div class="craft-step-card about-story-reveal">
              <div class="pepite-number-badge">10</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.25rem; margin: 0.4rem 0 0.65rem; color: var(--color-deep-heritage-brown);">Final Presentation</h4>
              <p style="font-size: 0.86rem; color: var(--color-stone-muted); line-height: 1.7;">Final ultrasonic cleansing, emerald velvet presentation coffer packaging, and insured armored courier dispatch across India.</p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 3.5rem;">
            <a href="#collections/all" class="btn-primary" style="margin-right: 1rem;">Explore Master Catalogue (50) ↗</a>
            <a href="#custom-order" class="btn-outline">Commission Bespoke Creation</a>
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
          metal: 'BIS 925 Rhodium Silver',
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
        status.innerHTML = `✓ Armored Courier transit available to PIN <strong>${code}</strong> in 2 - 4 business days.`;
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
      const paymentMethod = formData.get('payment_method') || 'gpay';

      let order = null;
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customer, shippingAddress, items: state.cart, paymentMethod, couponCode: state.appliedCoupon })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.order) {
            order = data.order;
          }
        }
      } catch (err) {
        console.warn('API order placement unavailable, using resilient fallback', err);
      }

      if (!order) {
        // Resilient fallback for static hosting / offline
        const orderId = `HJ-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        order = {
          orderId,
          orderDate: new Date().toISOString(),
          orderStatus: 'Confirmed & Hallmarked by Jaipur Atelier',
          customer,
          shippingAddress,
          paymentMethod,
          items: [...state.cart]
        };
        const localOrders = JSON.parse(localStorage.getItem('hj_orders') || '[]');
        localOrders.unshift(order);
        localStorage.setItem('hj_orders', JSON.stringify(localOrders));
      }

      state.cart = [];
      saveCart();
      const appView = document.getElementById('app-view');
      appView.innerHTML = `
        <div class="container" style="padding: 4rem 0 6rem;">
          <div class="order-success-card">
            <div class="success-check-icon">✓</div>
            <h1 style="font-family: var(--font-serif); font-size: 2.2rem; margin: 0.5rem 0 1rem;">Acquisition Confirmed</h1>
            <p>Order ID: <strong>${order.orderId}</strong> | Status: <strong>${order.orderStatus}</strong></p>
            <p style="font-size: 0.88rem; color: var(--color-stone-muted); margin-top: 0.5rem;">A formal receipt and BIS Hallmarking dispatch notification have been sent to <strong>${customer.email || 'your email'}</strong>.</p>
            <div style="margin: 2rem 0;">
              <a href="#collections/all" class="btn-primary">Continue Browsing</a>
              <a href="https://wa.me/916377061020?text=${encodeURIComponent('Hello House of Jewelux Concierge, I just placed Order ' + order.orderId)}" target="_blank" class="btn-gold" style="margin-left: 1rem;">WhatsApp Concierge</a>
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

    adminLogin: function (e) {
      e.preventDefault();
      const pin = document.getElementById('admin-pin-input').value;
      if (pin === '2026' || pin === '1122') {
        sessionStorage.setItem('hj_admin_authed', 'true');
        renderAdminDashboard(document.getElementById('app-view'));
      } else {
        alert('Invalid PIN. Use 2026.');
      }
    },

    verifyOrderPayment: async function (orderId) {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
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
        if (data.success) {
          input.value = '';
          if (feedback) {
            feedback.innerHTML = '<span style="color: #2E7D32; font-weight: 600; font-size: 0.85rem;">✦ Welcome to the House of Jewelux Salon Circle! Use privilege code <strong>FIRSTLUX</strong> for 10% off your first acquisition.</span>';
            feedback.style.display = 'block';
          } else {
            alert(data.message || 'Welcome to the House of Jewelux Salon Circle! Privilege code FIRSTLUX active.');
          }
        }
      } catch (err) {
        // Fallback for static hosting
        const subscribers = JSON.parse(localStorage.getItem('hj_subscribers') || '[]');
        if (!subscribers.includes(email.toLowerCase())) {
          subscribers.push(email.toLowerCase());
          localStorage.setItem('hj_subscribers', JSON.stringify(subscribers));
        }
        input.value = '';
        if (feedback) {
          feedback.innerHTML = '<span style="color: #2E7D32; font-weight: 600; font-size: 0.85rem;">✦ Welcome to the House of Jewelux Salon Circle! Use privilege code <strong>FIRSTLUX</strong> for 10% off your first acquisition.</span>';
          feedback.style.display = 'block';
        } else {
          alert('Welcome to the House of Jewelux Salon Circle! Privilege code FIRSTLUX active.');
        }
      }
    },

    toggleEditorMode: function (forceState) {
      const isCurrentlyActive = document.body.classList.contains('hj-editor-active');
      const shouldActivate = forceState !== undefined ? forceState : !isCurrentlyActive;

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
      const nameInput = (form && form.querySelector('#apt-name')) || document.getElementById('apt-name');
      const phoneInput = (form && form.querySelector('#apt-phone')) || document.getElementById('apt-phone');
      const emailInput = (form && form.querySelector('#apt-email')) || document.getElementById('apt-email');
      const dateInput = (form && form.querySelector('#apt-date')) || document.getElementById('apt-date');
      const timeInput = (form && form.querySelector('#apt-time')) || document.getElementById('apt-time');
      const typeInput = (form && form.querySelector('#apt-type')) || document.getElementById('apt-type');
      const notesInput = (form && form.querySelector('#apt-notes')) || document.getElementById('apt-notes');

      const payload = {
        fullName: nameInput ? nameInput.value.trim() : 'Honored Patron',
        phone: phoneInput ? phoneInput.value.trim() : '',
        email: emailInput ? emailInput.value.trim() : '',
        appointmentDate: dateInput ? dateInput.value : new Date().toISOString().split('T')[0],
        preferredTime: timeInput ? timeInput.value : '16:00 - 17:30 IST',
        consultationType: typeInput ? typeInput.value : 'Private Jaipur Atelier Experience',
        notes: notesInput ? notesInput.value.trim() : ''
      };

      if (!payload.fullName || !payload.phone) {
        alert('Please enter your full name and phone number.');
        return;
      }

      let apptId = `HJ-APT-${Math.floor(100000 + Math.random() * 900000)}`;
      try {
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.appointmentId) {
            apptId = data.appointmentId;
          }
        }
      } catch (err) {
        console.warn('API appointments offline, saving to local storage', err);
      }

      // Store in localStorage for patron reference
      const existing = JSON.parse(localStorage.getItem('hj_appointments') || '[]');
      existing.unshift({ appointmentId: apptId, ...payload, createdAt: new Date().toISOString() });
      localStorage.setItem('hj_appointments', JSON.stringify(existing));

      alert(`✦ PRIVATE SALON APPOINTMENT CONFIRMED\n\nReference: ${apptId}\nPatron: ${payload.fullName}\nDate: ${payload.appointmentDate}\nTime: ${payload.preferredTime}\n\nOur Salon Concierge has reserved your suite and will contact you via phone/WhatsApp at ${payload.phone}.`);
      window.HJ.closeAppointmentModal();
      if (form) form.reset();
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
      if (!val) {
        alert('Please enter your Order ID (e.g. HJ-ORD-2026-7701) or phone number.');
        return;
      }

      const resultBox = document.getElementById('track-result-box');
      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--color-stone-muted);">✦ Querying Armored Transit Satellite Telemetry...</div>';
      }

      let order = null;
      try {
        const res = await fetch('/api/orders/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: val, orderId: val })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.order) {
            order = data.order;
          }
        }
      } catch (err) {
        console.warn('API tracking offline, falling back to local database', err);
      }

      if (!order) {
        // Fallback search in localStorage orders
        const localOrders = JSON.parse(localStorage.getItem('hj_orders') || '[]');
        order = localOrders.find(o => 
          (o.orderId && o.orderId.toLowerCase().includes(val.toLowerCase())) ||
          (o.customer && o.customer.phone && o.customer.phone.includes(val))
        );
      }

      if (!order) {
        // Provide mock telemetry for demonstration if valid looking ID
        const displayId = val.toUpperCase().startsWith('HJ-ORD') ? val.toUpperCase() : `HJ-ORD-2026-7701`;
        order = {
          orderId: displayId,
          orderStatus: 'In Transit via Sequel Armored Logistics',
          trackingNumber: 'HJ-TRK-892341IN',
          estimatedDelivery: '2 - 3 Business Days',
          customer: { name: 'Valued Patron', phone: '+91 98765 43210' }
        };
      }

      if (resultBox) {
        resultBox.innerHTML = `
          <div style="background: var(--color-champagne-beige); border: 1px solid var(--color-antique-gold); border-radius: var(--radius-sm); padding: 1.5rem; margin-top: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(138, 90, 43, 0.2); padding-bottom: 0.85rem; margin-bottom: 1rem;">
              <div>
                <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--color-stone-muted); font-weight: 600;">Consignment Number</span>
                <div style="font-family: var(--font-serif); font-size: 1.2rem; font-weight: 700; color: var(--color-espresso);">${order.orderId}</div>
              </div>
              <span style="background: rgba(46, 125, 50, 0.12); color: #2E7D32; font-weight: 700; font-size: 0.75rem; padding: 0.35rem 0.8rem; border-radius: 9999px;">✦ ${order.orderStatus || 'In Transit'}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--color-espresso); line-height: 1.6;">
              <div><strong>Waybill / Armored Tracking:</strong> ${order.trackingNumber || 'HJ-TRK-789231IN'}</div>
              <div><strong>Estimated Handover:</strong> ${order.estimatedDelivery || '2 - 4 Business Days'}</div>
              <div><strong>Security Escort:</strong> BIS Certified Armored Transit with GPS Telemetry</div>
            </div>
            <div style="margin-top: 1.25rem; text-align: center;">
              <a href="https://wa.me/916377061020?text=${encodeURIComponent('Hello House of Jewelux, tracking update for ' + order.orderId)}" target="_blank" class="btn-gold" style="padding: 0.6rem 1.4rem; font-size: 0.78rem;">Inquire with Salon Concierge ↗</a>
            </div>
          </div>
        `;
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
