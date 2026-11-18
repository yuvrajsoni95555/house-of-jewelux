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
    const converted = Math.round(amountINR * cur.rate);
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
          handleRoute();
          return;
        }
      }
    } catch (err) {
      console.warn('API fetch failed, trying static products file', err);
    }

    try {
      const staticRes = await fetch('./data/products.json');
      if (staticRes.ok) {
        const staticData = await staticRes.json();
        state.products = Array.isArray(staticData) ? staticData : (staticData.products || []);
      }
    } catch (e) {
      console.warn('Static products fetch failed', e);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const appView = document.getElementById('app-view');
    if (!appView) return;

    if (route === 'home' || route === '') {
      renderHomePage(appView);
    } else if (route.startsWith('collections/')) {
      const colId = route.split('/')[1] || 'all';
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
    } else if (route === 'about') {
      renderAboutPage(appView);
    } else if (route === 'craftsmanship') {
      renderCraftsmanshipPage(appView);
    } else if (route === 'custom-order') {
      renderCustomOrderPage(appView);
    } else if (route === 'contact') {
      renderContactPage(appView);
    } else if (route === 'faq') {
      renderFAQPage(appView);
    } else if (['shipping', 'returns', 'warranty', 'privacy', 'terms'].includes(route)) {
      renderPolicyPage(appView, route);
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
    const isWishlisted = state.wishlist.includes(p.id);
    const offerPrice = Math.round(p.price * 0.9);

    return `
      <div class="product-card" data-id="${p.id}">
        <div class="product-card-media">
          <!-- Ribbon Fold Badge (Matching Palmonas) -->
          <div class="card-ribbon-badge">${p.badge || 'Bestseller'}</div>

          <!-- Heart Wishlist Icon -->
          <button class="card-wishlist-btn ${isWishlisted ? 'active' : ''}" 
                  onclick="window.HJ.toggleWishlist('${p.id}', event)" 
                  aria-label="Save to Wishlist">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="${isWishlisted ? 'var(--color-accent-crimson)' : 'none'}" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20.5L3.8 12.3C1.8 10.3 1.8 7.1 3.8 5.1C5.8 3.1 9 3.1 11 5.1L12 6.1L13 5.1C15 3.1 18.2 3.1 20.2 5.1C22.2 7.1 22.2 10.3 20.2 12.3L12 20.5Z"></path>
            </svg>
          </button>

          <a href="#products/${p.handle || p.id}">
            <img class="product-card-img main-img" src="${p.image}" alt="${p.name}" loading="lazy" />
            <img class="product-card-img hover-img" src="${p.hoverImage || p.image}" alt="${p.name} Alternate Angle" loading="lazy" />
          </a>

          <!-- Cycling Offer Pill (Matching Palmonas) -->
          <div class="card-offer-pill">
            <span>Privilege <strong>FIRSTLUX</strong></span>
            <span class="card-offer-highlight">Get for ${formatPrice(offerPrice)}</span>
          </div>
        </div>

        <div class="product-card-body">
          <div class="card-rating-row">
            <span class="card-stars">★★★★★</span>
            <span>${p.rating || '4.9'} (${p.reviewsCount || 48})</span>
          </div>

          <h3 class="product-card-title">
            <a href="#products/${p.handle || p.id}">${p.name}</a>
          </h3>

          <div class="card-metal-tag">Solid 925 Silver • 18K Micron Finish</div>

          <div class="product-card-pricing">
            <span class="current-price">${formatPrice(p.price)}</span>
            <span class="compare-price">${formatPrice(p.compareAtPrice)}</span>
            <span class="discount-pill">${p.discountPercent}% OFF</span>
          </div>

          <button class="card-add-btn" onclick="window.HJ.addToCart('${p.id}', 1, event)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5.5 8.5L4 21H20L18.5 8.5H5.5Z"></path>
              <path d="M9 11V6.5C9 4.8 10.3 3.5 12 3.5C13.7 3.5 15 4.8 15 6.5V11"></path>
              <circle cx="12" cy="11.5" r="0.9" fill="currentColor"></circle>
            </svg>
            Add to Bag
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
      <!-- A. PREMIUM HERO SECTION (ITALIAN LUXURY EDITORIAL × INDIAN HERITAGE) -->
      <section class="hero-slider" id="hero-slider">
        <div class="hero-slide active" style="background: #181412;">
          <img class="hero-bg" src="images/user_flagship_hero_model.jpg" alt="House of Jewelux Editorial Campaign - Masterpiece Handcrafted Diamond & Gold Fine Necklace" />
          <div class="hero-overlay"></div>
          <div class="container" style="position: relative; height: 100%; display: flex; align-items: center;">
            <div class="hero-content">
              <span class="hero-badge-pill">✦ Indian Fine Jewellery • Stamped BIS 925 Hallmark</span>
              <h1 class="hero-title">Where Elegance Becomes Eternal</h1>
              <p class="hero-subtitle">
                Generationally forged in our Jaipur atelier with solid 925 sterling silver, liquid platinum-rhodium and 18K champagne gold. An editorial synthesis of Italian haute joaillerie and sacred Indian craftsmanship.
              </p>
              <div class="hero-ctas">
                <a href="#collections/new-arrivals" class="btn-gold">Explore What's New</a>
                <a href="javascript:void(0)" onclick="window.HJ.openAppointmentModal()" class="btn-outline">Book Private Atelier Consultation</a>
              </div>
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
                  <polygon points="12 3 21 19 3 19 12 3"></polygon>
                  <text x="12" y="16.5" font-size="6.5" font-family="'Cinzel', serif" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">925</text>
                </svg>
              </div>
              <div>
                <div class="trust-text-title">BIS 925 Hallmarked</div>
                <div class="trust-text-sub">Stamped purity on every creation</div>
              </div>
            </div>
            <div class="trust-item">
              <div class="trust-icon" style="color: var(--color-muted-gold);">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
                  <polygon points="12 2 14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5 12 2"></polygon>
                  <circle cx="12" cy="12" r="1.5" fill="currentColor"></circle>
                </svg>
              </div>
              <div>
                <div class="trust-text-title">Anti-Tarnish & Waterproof</div>
                <div class="trust-text-sub">Liquid Rhodium & 18K Micro Gold</div>
              </div>
            </div>
            <div class="trust-item">
              <div class="trust-icon" style="color: var(--color-muted-gold);">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
                  <path d="M12 2.5C12 2.5 5 11 5 15.5C5 19.1 8.1 22 12 22C15.9 22 19 15.5 19 15.5C19 11 12 2.5 12 2.5Z"></path>
                  <path d="M12 18V13M10 15C10 15 11 13 12 13C13 13 14 15 14 15"></path>
                </svg>
              </div>
              <div>
                <div class="trust-text-title">100% Skin-Friendly</div>
                <div class="trust-text-sub">Hypoallergenic & Nickel-Free</div>
              </div>
            </div>
            <div class="trust-item">
              <div class="trust-icon" style="color: var(--color-muted-gold);">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
                  <path d="M12 2L3 6V12C3 17.5 12 22 12 22C12 22 21 17.5 21 12V6L12 2Z"></path>
                  <circle cx="12" cy="11" r="2"></circle>
                  <path d="M12 13V16"></path>
                </svg>
              </div>
              <div>
                <div class="trust-text-title">Insured Armored Courier</div>
                <div class="trust-text-sub">Complimentary transit across India</div>
              </div>
            </div>
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

          <div class="products-grid">
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
              <img class="cat-showcase-img" src="images/authentic_solitaire_ring.jpg" alt="Rings & Solitaires" />
              <div class="cat-showcase-overlay">
                <div class="cat-showcase-title">Rings & Solitaires</div>
                <div class="cat-showcase-count">10 Masterpieces • Stamped 925</div>
              </div>
            </a>

            <a href="#collections/earrings" class="cat-showcase-card">
              <img class="cat-showcase-img" src="images/authentic_earrings_macro.jpg" alt="The Earrings Suite" />
              <div class="cat-showcase-overlay">
                <div class="cat-showcase-title">The Earrings Suite</div>
                <div class="cat-showcase-count">10 Designs • Comfort Posts</div>
              </div>
            </a>

            <a href="#collections/necklaces" class="cat-showcase-card">
              <img class="cat-showcase-img" src="images/authentic_diamond_choker.jpg" alt="Necklaces & Chokers" />
              <div class="cat-showcase-overlay">
                <div class="cat-showcase-title">Necklaces & Chokers</div>
                <div class="cat-showcase-count">10 Creations • Liquid Rhodium</div>
              </div>
            </a>

            <a href="#collections/bracelets" class="cat-showcase-card">
              <img class="cat-showcase-img" src="images/authentic_bracelet_lifestyle.jpg" alt="Bracelets & Bangles" />
              <div class="cat-showcase-overlay">
                <div class="cat-showcase-title">Bracelets & Bangles</div>
                <div class="cat-showcase-count">10 Styles • Double-Lock Clasp</div>
              </div>
            </a>

            <a href="#collections/brooches" class="cat-showcase-card">
              <img class="cat-showcase-img" src="images/user_falcon_brooch_white.jpg" alt="Royal Brooches & Pins" />
              <div class="cat-showcase-overlay">
                <div class="cat-showcase-title">Royal Brooches & Pins</div>
                <div class="cat-showcase-count">10 Sovereign Crests • Jaipur Bench</div>
              </div>
            </a>

            <a href="#collections/temple-jewellery" class="cat-showcase-card">
              <img class="cat-showcase-img" src="images/user_balaji_temple_pendant.jpg" alt="Sacred Temple Nakshi" />
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

          <div class="products-grid">
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
            <p style="max-width: 650px; margin: 0.75rem auto 0; font-size: 0.85rem; color: var(--color-stone-muted);">
              Every House of Jewelux creation passes through the hands of master goldsmiths across nine sacred stages of bench craftsmanship in Rajasthan.
            </p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 2.5rem;">
            <div style="background: var(--color-warm-ivory); padding: 1.75rem; border-radius: var(--radius-sm); border: 1px solid var(--color-warm-stone);">
              <div style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--color-antique-gold); font-weight: 700;">01</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.1rem; margin: 0.4rem 0; color: var(--color-deep-heritage-brown);">Inspiration & Sacred Architecture</h4>
              <p style="font-size: 0.8rem; color: var(--color-stone-muted); line-height: 1.6;">Studying Jaipur royal archways, jharokha screens, and ceremonial iconography from Mughal and Rajput archives.</p>
            </div>
            <div style="background: var(--color-warm-ivory); padding: 1.75rem; border-radius: var(--radius-sm); border: 1px solid var(--color-warm-stone);">
              <div style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--color-antique-gold); font-weight: 700;">02</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.1rem; margin: 0.4rem 0; color: var(--color-deep-heritage-brown);">Exploration & Gemology</h4>
              <p style="font-size: 0.8rem; color: var(--color-stone-muted); line-height: 1.6;">Ethical sourcing of certified conflict-free VVS1 diamond simulants, Russian hydro-emeralds, and Zambian rough.</p>
            </div>
            <div style="background: var(--color-warm-ivory); padding: 1.75rem; border-radius: var(--radius-sm); border: 1px solid var(--color-warm-stone);">
              <div style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--color-antique-gold); font-weight: 700;">03</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.1rem; margin: 0.4rem 0; color: var(--color-deep-heritage-brown);">Concept & Gouache Rendering</h4>
              <p style="font-size: 0.8rem; color: var(--color-stone-muted); line-height: 1.6;">Hand-drawn gouache jewel illustrations capturing light reflections, prong heights, and 3D ergonomics.</p>
            </div>
            <div style="background: var(--color-warm-ivory); padding: 1.75rem; border-radius: var(--radius-sm); border: 1px solid var(--color-warm-stone);">
              <div style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--color-antique-gold); font-weight: 700;">04</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.1rem; margin: 0.4rem 0; color: var(--color-deep-heritage-brown);">Jewellery Proportions</h4>
              <p style="font-size: 0.8rem; color: var(--color-stone-muted); line-height: 1.6;">Precision CAD modeling and wax printing ensuring micro-comfort shanks and flawless daily wear balance.</p>
            </div>
            <div style="background: var(--color-warm-ivory); padding: 1.75rem; border-radius: var(--radius-sm); border: 1px solid var(--color-warm-stone);">
              <div style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--color-antique-gold); font-weight: 700;">05</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.1rem; margin: 0.4rem 0; color: var(--color-deep-heritage-brown);">Material Assay</h4>
              <p style="font-size: 0.8rem; color: var(--color-stone-muted); line-height: 1.6;">XRF laser testing guaranteeing 92.5% pure elemental silver alloyed strictly with hypoallergenic deox copper.</p>
            </div>
            <div style="background: var(--color-warm-ivory); padding: 1.75rem; border-radius: var(--radius-sm); border: 1px solid var(--color-warm-stone);">
              <div style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--color-antique-gold); font-weight: 700;">06</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.1rem; margin: 0.4rem 0; color: var(--color-deep-heritage-brown);">Bench Forging & Kundan</h4>
              <p style="font-size: 0.8rem; color: var(--color-stone-muted); line-height: 1.6;">Traditional silversmith hammer forging, hand-pierced openwork, and 24K pure gold leaf foil setting.</p>
            </div>
            <div style="background: var(--color-warm-ivory); padding: 1.75rem; border-radius: var(--radius-sm); border: 1px solid var(--color-warm-stone);">
              <div style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--color-antique-gold); font-weight: 700;">07</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.1rem; margin: 0.4rem 0; color: var(--color-deep-heritage-brown);">Liquid Rhodium & 18K Micron</h4>
              <p style="font-size: 0.8rem; color: var(--color-stone-muted); line-height: 1.6;">Advanced multi-layer electroplating with liquid platinum-rhodium ensuring lifetime anti-tarnish luminosity.</p>
            </div>
            <div style="background: var(--color-warm-ivory); padding: 1.75rem; border-radius: var(--radius-sm); border: 1px solid var(--color-warm-stone);">
              <div style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--color-antique-gold); font-weight: 700;">08</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.1rem; margin: 0.4rem 0; color: var(--color-deep-heritage-brown);">BIS Hallmark Certification</h4>
              <p style="font-size: 0.8rem; color: var(--color-stone-muted); line-height: 1.6;">Official Bureau of Indian Standards laser assay verification stamp applied with unique identification mark.</p>
            </div>
            <div style="background: var(--color-warm-ivory); padding: 1.75rem; border-radius: var(--radius-sm); border: 1px solid var(--color-warm-stone);">
              <div style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--color-antique-gold); font-weight: 700;">09</div>
              <h4 style="font-family: var(--font-serif); font-size: 1.1rem; margin: 0.4rem 0; color: var(--color-deep-heritage-brown);">Armored Coffer Acquisition</h4>
              <p style="font-size: 0.8rem; color: var(--color-stone-muted); line-height: 1.6;">Placed in our signature emerald velvet presentation box and dispatched via insured armored courier.</p>
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
              <h2 style="font-family: var(--font-serif); font-size: 2.3rem; margin: 0.5rem 0 1.25rem; color: var(--color-deep-heritage-brown);">
                Generational Indian Artistry × European Italian Poise
              </h2>
              <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8; margin-bottom: 1.25rem;">
                House of Jewelux was established in Jaipur to bridge the majesty of royal Indian court jewellery with the understated clarity of Italian luxury design. We reject disposable fashion jewellery. Every item is carved from solid 925 sterling silver, dipped in liquid platinum-rhodium, and stamped with the Bureau of Indian Standards hallmark.
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
    let title = "Earrings";
    let subtitle = "Statement for every occasion";
    let heroImg = "images/authentic_earrings_stone.jpg";

    if (collectionId !== 'all') {
      if (['earrings', 'rings', 'necklaces', 'bracelets', 'brooches'].includes(collectionId)) {
        filtered = filtered.filter(p => p.category === collectionId);
        const cat = state.categories.find(c => c.id === collectionId);
        if (cat) {
          title = cat.name;
          subtitle = cat.subtitle;
        }
        if (collectionId === 'rings') {
          heroImg = "images/authentic_rings_couple_hands.jpg";
        } else if (collectionId === 'necklaces') {
          heroImg = "images/authentic_diamond_choker.jpg";
        } else if (collectionId === 'bracelets') {
          heroImg = "images/authentic_bracelet_bangles.jpg";
        } else if (collectionId === 'brooches') {
          heroImg = "images/authentic_mens_sherwani_jewel.jpg";
        } else if (collectionId === 'earrings') {
          heroImg = "images/authentic_earrings_stone.jpg";
        }
      } else if (collectionId === 'new-arrivals') {
        filtered = filtered.filter(p => p.isNew || p.badge === 'New' || p.id.includes('BRO') || p.id.includes('TEM'));
        title = "What's New • Newly Unveiled Creations";
        subtitle = "Freshly forged bench creations from our Jaipur atelier";
        heroImg = "images/user_flagship_hero_model.jpg";
      } else if (collectionId === 'temple-jewellery') {
        filtered = filtered.filter(p => p.collection === 'temple-heritage' || p.category === 'necklaces');
        title = "The Temple Collection";
        subtitle = "Sacred Indian architectural nakshi in pure silver";
        heroImg = "images/authentic_temple_heritage.jpg";
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

      <!-- STICKY FILTER & SORT BAR (1:1 WITH PALMONAS) -->
      <div class="collection-controls-bar">
        <div class="container">
          <div class="collection-controls-inner">
            <span class="collection-item-count">Filters</span>

            <div class="collection-actions-right">
              <select class="sort-select" onchange="window.HJ.setSort(this.value)">
                <option value="popular" ${state.activeFilters.sort === 'popular' ? 'selected' : ''}>Sort By: Popular</option>
                <option value="price_asc" ${state.activeFilters.sort === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
                <option value="price_desc" ${state.activeFilters.sort === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
                <option value="rating" ${state.activeFilters.sort === 'rating' ? 'selected' : ''}>Customer Rating</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN 2-COLUMN COLLECTION LAYOUT -->
      <div class="container">
        <div class="collection-main-layout">
          <!-- LEFT: PILL FILTERS SIDEBAR (1:1 WITH PALMONAS) -->
          <aside class="filters-sidebar">
            <!-- Product Type Pills -->
            <div class="filter-group">
              <div class="filter-group-title">Product type</div>
              <div class="filter-pills-row">
                <button class="filter-pill ${collectionId === 'earrings' ? 'active' : ''}" onclick="window.HJ.navigate('collections/earrings')">Earrings</button>
                <button class="filter-pill ${collectionId === 'rings' ? 'active' : ''}" onclick="window.HJ.navigate('collections/rings')">Rings</button>
                <button class="filter-pill ${collectionId === 'necklaces' ? 'active' : ''}" onclick="window.HJ.navigate('collections/necklaces')">Necklaces</button>
                <button class="filter-pill ${collectionId === 'bracelets' ? 'active' : ''}" onclick="window.HJ.navigate('collections/bracelets')">Bracelets</button>
                <button class="filter-pill ${collectionId === 'brooches' ? 'active' : ''}" onclick="window.HJ.navigate('collections/brooches')">Brooches</button>
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
          <main class="products-grid">
            ${filtered.length > 0 
              ? filtered.map(renderProductCard).join('') 
              : `<div style="grid-column: 1 / -1; padding: 4rem; text-align: center; color: var(--color-taupe);">No creations found. <br><button class="btn-primary" style="margin-top: 1rem;" onclick="window.HJ.clearFilters()">Reset Filters</button></div>`
            }
          </main>
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

            <!-- Capsule Trust Pills (Bespoke 2D Heritage SVG System) -->
            <div class="pdp-trust-capsules-row">
              <span class="trust-capsule">
                <svg class="trust-pill-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
                  <polygon points="12 2 14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5 12 2"></polygon>
                  <circle cx="12" cy="12" r="1.5" fill="currentColor"></circle>
                </svg>
                Anti-Tarnish
              </span>
              <span class="trust-capsule">
                <svg class="trust-pill-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
                  <path d="M12 2.5C12 2.5 5 11 5 15.5C5 19.1 8.1 22 12 22C15.9 22 19 15.5 19 15.5C19 11 12 2.5 12 2.5Z"></path>
                  <path d="M12 18V13M10 15C10 15 11 13 12 13C13 13 14 15 14 15"></path>
                </svg>
                Skin Safe Jewellery
              </span>
              <span class="trust-capsule">
                <svg class="trust-pill-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
                  <path d="M3 18L4.5 7L9 11.5L12 5L15 11.5L19.5 7L21 18H3Z"></path>
                  <circle cx="4.5" cy="6" r="1" fill="currentColor"></circle>
                  <circle cx="12" cy="4" r="1" fill="currentColor"></circle>
                  <circle cx="19.5" cy="6" r="1" fill="currentColor"></circle>
                  <line x1="3" y1="18" x2="21" y2="18" stroke-width="1.5"></line>
                </svg>
                18K Micro Gold Finish
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
          <div style="background: #FFFFFF; border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 2rem;">
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
          <div style="background: #FFFFFF; border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 1.5rem;">
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
      <section style="background: var(--color-ivory-soft); padding: 4rem 0; text-align: center;">
        <div class="container" style="max-width: 800px;">
          <span class="hero-badge-pill">The Jaipur Atelier</span>
          <h1 style="font-family: var(--font-serif); font-size: 2.8rem; margin: 0.5rem 0 1rem;">Where Elegance Becomes Eternal</h1>
          <p style="font-size: 1.05rem; color: var(--color-taupe); line-height: 1.7;">
            Founded by Yuvraj Soni in Jaipur, Rajasthan, House of Jewelux was born to unite royal Indian temple nakshi craft with modern fine jewellery poise.
          </p>
        </div>
      </section>
      <section style="padding: 5rem 0;">
        <div class="container">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 4rem; align-items: center;">
            <div style="position: relative; border-radius: var(--radius-sm); overflow: hidden; box-shadow: var(--shadow-md);">
              <img src="images/authentic_atelier_craft.jpg" alt="Master Goldsmith at Bench in Jaipur Atelier - Micro Stone Setting & Pure 925 Silver Forging" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block;" />
              <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(0deg, rgba(26,20,16,0.9) 0%, transparent 100%); padding: 1.5rem; color: #FFF;">
                <span style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--color-gold-light);">Jaipur Atelier Workbench</span>
                <div style="font-size: 0.9rem; font-weight: 600;">Authentic Handcraftsmanship & Stone Setting</div>
              </div>
            </div>
            <div>
              <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--color-gold-dark);">Jaipur Heritage • Royal Craft</span>
              <h2 style="font-family: var(--font-serif); font-size: 2.2rem; margin: 0.5rem 0 1.25rem;">Centuries of Artistry. Refined for Now.</h2>
              <p style="color: var(--color-taupe); line-height: 1.8; margin-bottom: 1.25rem;">
                Every creation is forged in certified 92.5% pure silver, finished in liquid platinum-rhodium and 18K micron gold, and certified by the Bureau of Indian Standards.
              </p>
              <p style="color: var(--color-taupe); line-height: 1.8; margin-bottom: 1.5rem;">
                From ancestral temple nakshi reliefs to contemporary micro-pavé tension settings, each silhouette undergoes over 40 hours of artisanal hand-sculpting, polishing, and laser inspection.
              </p>
              <div style="display: flex; gap: 2rem; border-top: 1px solid var(--color-border); padding-top: 1.5rem;">
                <div>
                  <div style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--color-espresso); font-weight: 700;">BIS 925</div>
                  <div style="font-size: 0.75rem; color: var(--color-taupe);">Certified Purity Stamped</div>
                </div>
                <div>
                  <div style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--color-espresso); font-weight: 700;">100%</div>
                  <div style="font-size: 0.75rem; color: var(--color-taupe);">Authentic Atelier Craft</div>
                </div>
                <div>
                  <div style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--color-espresso); font-weight: 700;">0% AI</div>
                  <div style="font-size: 0.75rem; color: var(--color-taupe);">Verified Real Photography</div>
                </div>
              </div>
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

  function renderPolicyPage(container, key) {
    container.innerHTML = `
      <section style="background: var(--color-ivory-soft); padding: 4rem 0; text-align: center;">
        <div class="container" style="max-width: 700px;">
          <h1 style="font-family: var(--font-serif); font-size: 2.4rem; text-transform: capitalize;">${key} Policy</h1>
          <p style="color: var(--color-taupe); margin-top: 0.5rem;">House of Jewelux Official Standards • November 2026</p>
        </div>
      </section>
      <section style="padding: 4rem 0;">
        <div class="container" style="max-width: 760px; line-height: 1.8;">
          <p>At House of Jewelux, client trust is absolute. All items are shipped in insured armored transit with complimentary 14-day return and exchange privileges.</p>
        </div>
      </section>
    `;

    // Initialize Cinematic Hero Engine (The Journey of Eternal Elegance)
    if (window.HJ_HERO && window.HJ_HERO.init) {
      setTimeout(() => window.HJ_HERO.init(), 60);
    }
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
      <section style="background: var(--color-warm-ivory); padding: 4rem 0 1rem;">
        <div class="container" style="max-width: 800px; margin: 0 auto;">
          <div class="section-header about-story-reveal">
            <span class="hero-badge-pill" style="display: inline-block; margin-bottom: 0.75rem;">Atelier Concierge</span>
            <h2 class="section-title about-story-reveal" style="margin-bottom: 1rem;">Contact the House of Jewelux</h2>
            <div class="section-divider about-story-reveal" style="margin-bottom: 0.75rem;"><span class="section-divider-gem"></span></div>
            <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
              Reach our private salon concierge in Jaipur, schedule a bespoke consultation, or inquire about any creation in our catalogue. We respond within 24 business hours.
            </p>
          </div>
        </div>
      </section>

      <section style="padding: 4rem 0 6rem;">
        <div class="container">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start;">
            
            <!-- Left: Contact Details -->
            <div class="about-story-reveal" style="display: flex; flex-direction: column; gap: 2rem;">
              <div style="background: var(--color-soft-offwhite); border: 1px solid var(--color-warm-stone); border-radius: var(--radius-sm); padding: 2rem;">
                <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 1.5rem; color: var(--color-deep-heritage-brown);">Atelier & Salon</h3>
                <div style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-antique-gold); flex-shrink: 0; margin-top: 2px;">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <div>
                    <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-stone-muted);">Jaipur Creative Atelier</div>
                    <div style="font-weight: 600; color: var(--color-deep-heritage-brown);">Rajasthan, India</div>
                  </div>
                </div>
                <div style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-antique-gold); flex-shrink: 0; margin-top: 2px;">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 0 7H4.11a2 2 0 0 1-2-1.72V7.24a2 2 0 0 1 2-2h3c2.37 0 4.42 1.64 5.18 4H20a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2z"></path>
                  </svg>
                  <div>
                    <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-stone-muted);">Direct Concierge</div>
                    <div style="font-weight: 600; color: var(--color-deep-heritage-brown);">+91 63770 61020</div>
                  </div>
                </div>
                <div style="display: flex; gap: 1rem; align-items: flex-start;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-antique-gold); flex-shrink: 0; margin-top: 2px;">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <div>
                    <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-stone-muted);">Email</div>
                    <div style="font-weight: 600; color: var(--color-deep-heritage-brown);">houseofjewelux@gmail.com</div>
                  </div>
                </div>
              </div>

              <div style="display: flex; gap: 1rem;">
                <a href="https://wa.me/916377061020" target="_blank" class="btn-gold" style="flex: 1; padding: 0.9rem; font-size: 0.8rem;">WhatsApp Concierge</a>
                <a href="#appointment" onclick="window.HJ.openAppointmentModal()" class="btn-primary" style="flex: 1; padding: 0.9rem; font-size: 0.8rem;">Book Appointment</a>
              </div>
            </div>

            <!-- Right: Contact Form -->
            <div class="about-story-reveal">
              <form id="contact-form" style="background: var(--color-soft-offwhite); border: 1px solid var(--color-warm-stone); border-radius: var(--radius-sm); padding: 2rem; display: flex; flex-direction: column; gap: 1.25rem;">
                <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--color-deep-heritage-brown);">Send a Private Enquiry</h3>
                <p style="font-size: 0.8rem; color: var(--color-stone-muted); margin-bottom: 1rem;">All fields are required unless marked otherwise.</p>
                
                <div class="contact-field form-grid-2">
                  <div class="form-field">
                    <label class="form-label">Full Name *</label>
                    <input type="text" class="form-input" required placeholder="Your noble name" />
                  </div>
                  <div class="form-field">
                    <label class="form-label">Email Address *</label>
                    <input type="email" class="form-input" required placeholder="patron@domain.com" />
                  </div>
                </div>

                <div class="contact-field form-field">
                  <label class="form-label">Mobile Phone *</label>
                  <input type="tel" class="form-input" required placeholder="+91 98765 43210" />
                </div>

                <div class="contact-field form-field">
                  <label class="form-label">Subject *</label>
                  <select class="form-input" required>
                    <option value="">Select an enquiry type</option>
                    <option value="bespoke">Bespoke & Custom Commission</option>
                    <option value="appointment">Private Salon Appointment</option>
                    <option value="product">Product Information</option>
                    <option value="wholesale">Wholesale & Atelier Partnership</option>
                    <option value="other">General Enquiry</option>
                  </select>
                </div>

                <div class="contact-field form-field">
                  <label class="form-label">Message *</label>
                  <textarea class="form-input form-textarea" rows="4" required placeholder="How may we assist you?"></textarea>
                </div>

                <button type="submit" class="btn-gold" style="width: fit-content; align-self: flex-start; padding: 0.9rem 2rem; font-size: 0.82rem;">Send Enquiry ✦</button>
                <div id="contact-form-message" style="margin-top: 1rem; font-size: 0.82rem; min-height: 1.2rem;"></div>
              </form>
            </div>

          </div>
        </div>
      </section>
    `;

    // Form submission with motion feedback
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
      <section style="background: var(--color-warm-ivory); padding: 4rem 0 1rem;">
        <div class="container" style="max-width: 800px; margin: 0 auto; text-align: center;">
          <span class="hero-badge-pill about-story-reveal" style="display: inline-block; margin-bottom: 0.75rem;">Bespoke Goldsmith Studio</span>
          <h2 class="section-title about-story-reveal" style="margin-bottom: 1rem;">Commission a Bespoke Creation</h2>
          <div class="section-divider about-story-reveal" style="margin-bottom: 0.75rem;"><span class="section-divider-gem"></span></div>
          <p style="font-size: 0.9rem; color: var(--color-stone-muted); line-height: 1.8;">
            Work directly with Master Goldsmith Yuvraj Soni to create a one-of-a-kind heirloom. From concept sketch to final hallmark certification, every detail is yours.
          </p>
        </div>
      </section>

      <section style="padding: 4rem 0 6rem;">
        <div class="container" style="max-width: 640px; margin: 0 auto;">
          <form id="bespoke-form" style="background: var(--color-soft-offwhite); border: 1px solid var(--color-warm-stone); border-radius: var(--radius-sm); padding: 2.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--color-deep-heritage-brown);">Bespoke Commission Enquiry</h3>
            <p style="font-size: 0.8rem; color: var(--color-stone-muted); margin-bottom: 1rem;">Share your vision. Our atelier concierge will respond within 24 business hours.</p>

            <div class="contact-field form-grid-2">
              <div class="form-field">
                <label class="form-label">Full Name *</label>
                <input type="text" class="form-input" required placeholder="Your noble name" />
              </div>
              <div class="form-field">
                <label class="form-label">Email Address *</label>
                <input type="email" class="form-input" required placeholder="patron@domain.com" />
              </div>
            </div>

            <div class="contact-field form-grid-2">
              <div class="form-field">
                <label class="form-label">Mobile Phone *</label>
                <input type="tel" class="form-input" required placeholder="+91 98765 43210" />
              </div>
              <div class="form-field">
                <label class="form-label">Budget Range *</label>
                <select class="form-input" required>
                  <option value="">Select budget band</option>
                  <option value="under-25k">Under ₹25,000</option>
                  <option value="25k-50k">₹25,000 – ₹50,000</option>
                  <option value="50k-1lakh">₹50,000 – ₹1,00,000</option>
                  <option value="above-1lakh">Above ₹1,00,000</option>
                </select>
              </div>
            </div>

            <div class="contact-field form-field">
              <label class="form-label">Jewellery Type *</label>
              <select class="form-input" required>
                <option value="">Select category</option>
                <option value="ring">Ring / Solitaire</option>
                <option value="earrings">Earrings</option>
                <option value="necklace">Necklace / Choker</option>
                <option value="bracelet">Bracelet / Bangle</option>
                <option value="brooch">Brooch / Pin</option>
                <option value="wedding-suite">Wedding Suite</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="contact-field form-field">
              <label class="form-label">Design Description *</label>
              <textarea class="form-input form-textarea" rows="4" required placeholder="Describe your vision — motifs, gemstones, metals, inspiration..."></textarea>
            </div>

            <div class="contact-field form-field">
              <label class="form-label">Reference Images (optional)</label>
              <input type="file" class="form-input" accept="image/*" multiple />
            </div>

            <button type="submit" class="btn-gold" style="width: fit-content; align-self: flex-start; padding: 0.9rem 2rem; font-size: 0.82rem;">Submit Commission ✦</button>
            <div id="bespoke-form-message" style="margin-top: 1rem; font-size: 0.82rem; min-height: 1.2rem;"></div>
          </form>
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
          
          fetch('/api/custom-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
          .then(res => res.json())
          .then(result => {
            gsap.to(btn, { opacity: 1, scale: 1, duration: 0.2, onComplete: () => {
              btn.textContent = 'Submitted ✦';
              gsap.to(btn, { backgroundColor: 'var(--color-antique-gold)', color: '#140F0D', duration: 0.3 });
              messageEl.innerHTML = '<span style="color: #2E7D32;">✓ ' + (result.message || 'Your bespoke commission has been submitted.') + '</span>';
              gsap.fromTo(messageEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 });
              
              setTimeout(() => {
                btn.textContent = originalText;
                gsap.to(btn, { backgroundColor: '', color: '', duration: 0.3 });
                messageEl.innerHTML = '';
              }, 2500);
            }});
          })
          .catch(err => {
            gsap.to(btn, { opacity: 1, scale: 1, duration: 0.2, onComplete: () => {
              btn.textContent = originalText;
              messageEl.innerHTML = '<span style="color: #B22222;">✗ Submission failed. Please contact concierge directly.</span>';
              gsap.fromTo(messageEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 });
            }});
          });
        }});
      });
    }
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

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customer, shippingAddress, items: state.cart, paymentMethod, couponCode: state.appliedCoupon })
        });
        const data = await res.json();
        if (data.success) {
          state.cart = [];
          saveCart();
          const appView = document.getElementById('app-view');
          appView.innerHTML = `
            <div class="container" style="padding: 4rem 0 6rem;">
              <div class="order-success-card">
                <div class="success-check-icon">✓</div>
                <h1 style="font-family: var(--font-serif); font-size: 2.2rem; margin: 0.5rem 0 1rem;">Acquisition Confirmed</h1>
                <p>Order ID: <strong>${data.order.orderId}</strong> | Status: <strong>${data.order.orderStatus}</strong></p>
                <div style="margin: 2rem 0;">
                  <a href="#collections/all" class="btn-primary">Continue Browsing</a>
                  <a href="https://wa.me/916377061020" target="_blank" class="btn-gold" style="margin-left: 1rem;">WhatsApp Concierge</a>
                </div>
              </div>
            </div>
          `;
        }
      } catch (err) {
        alert('Network error. Please try again.');
      }
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
    }
  };

  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('DOMContentLoaded', () => {
    updateBadges();
    loadProducts();
  });
})();
