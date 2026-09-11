// House of Jewelux - Client Application Logic

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    currency: 'USD',
    cart: JSON.parse(localStorage.getItem('jewelux_cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('jewelux_wishlist') || '[]'),
    activeCategory: 'all',
    discountPercent: 0,
    promoCodeApplied: null,
    
    // Bespoke Studio State
    bespoke: {
      metalId: 'yellow-gold',
      gemId: 'diamond',
      cutId: 'round',
      caratWeight: 1.75
    }
  };

  // Helper: Format price according to active currency
  function formatPrice(usdAmount) {
    const curr = JEWELUX_DATA.currencies[state.currency] || JEWELUX_DATA.currencies.USD;
    const converted = usdAmount * curr.rate;
    const formatted = Math.round(converted).toLocaleString();
    return `${curr.symbol}${formatted}`;
  }

  // Toast Notification System
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
      <span style="color: var(--gold-primary); font-size: 1.1rem;">${icon}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Currency Selector Handling
  const currencySelect = document.getElementById('currency-select');
  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      state.currency = e.target.value;
      renderProducts();
      updateBespokePrice();
      renderCart();
      renderWishlist();
      showToast(`Currency changed to ${state.currency}`, '💎');
    });
  }

  // Render Product Grid
  const productsGrid = document.getElementById('products-grid');
  function renderProducts() {
    if (!productsGrid) return;

    const filtered = state.activeCategory === 'all'
      ? JEWELUX_DATA.products
      : JEWELUX_DATA.products.filter(p => p.category === state.activeCategory);

    productsGrid.innerHTML = filtered.map(product => {
      const isWishlisted = state.wishlist.includes(product.id);
      return `
        <div class="product-card group rounded-lg overflow-hidden flex flex-col justify-between" data-id="${product.id}">
          <div class="relative product-image-container bg-stone-100 aspect-square overflow-hidden cursor-pointer" onclick="openQuickView('${product.id}')">
            <!-- Badge -->
            <div class="absolute top-3 left-3 z-10">
              <span class="px-2.5 py-1 text-[10px] uppercase font-semibold tracking-widest bg-black/75 text-amber-300 backdrop-blur-md border border-amber-500/30 rounded-full">
                ${product.badge}
              </span>
            </div>

            <!-- Wishlist Button -->
            <button 
              onclick="event.stopPropagation(); toggleWishlist('${product.id}')"
              class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-stone-800 flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110"
              title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}"
              aria-label="Wishlist toggle"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-stone-700'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </button>

            <!-- Product Images -->
            <img 
              src="${product.image}" 
              alt="${product.name}" 
              class="main-img w-full h-full object-cover object-center group-hover:opacity-0 transition-opacity duration-700" 
              loading="lazy"
            />
            <img 
              src="${product.hoverImage}" 
              alt="${product.name} Alternate View" 
              class="hover-img absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-700" 
              loading="lazy"
            />

            <!-- Quick View Overlay Pill -->
            <div class="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300 flex justify-center">
              <span class="px-4 py-1.5 text-xs tracking-wider uppercase bg-stone-900/90 text-white backdrop-blur-md rounded border border-amber-400/30">
                Inspect Details & GIA Specs
              </span>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-5 flex flex-col flex-grow justify-between">
            <div>
              <p class="text-[11px] uppercase tracking-widest text-amber-700 font-semibold mb-1">${product.metal}</p>
              <h3 class="font-serif text-lg text-stone-900 font-normal leading-snug group-hover:text-amber-800 transition-colors">
                ${product.name}
              </h3>
              <p class="text-xs text-stone-500 mt-1 line-clamp-1">${product.stone} • ${product.cut}</p>
            </div>

            <div class="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <div>
                <span class="text-xs text-stone-400 block uppercase tracking-wider">Price</span>
                <span class="font-serif text-xl font-semibold text-stone-900">${formatPrice(product.priceUSD)}</span>
              </div>
              <button 
                onclick="addToCart('${product.id}')" 
                class="px-3.5 py-2 bg-stone-900 hover:bg-amber-800 text-white rounded text-xs tracking-wider uppercase font-medium transition-colors flex items-center gap-1.5"
                title="Add to Shopping Bag"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Category Filter Buttons
  const categoryFiltersContainer = document.getElementById('category-filters');
  if (categoryFiltersContainer) {
    categoryFiltersContainer.innerHTML = JEWELUX_DATA.categories.map(cat => `
      <button 
        onclick="setCategory('${cat.id}')"
        class="px-5 py-2 text-xs md:text-sm tracking-wider uppercase font-medium transition-all rounded-full border ${
          state.activeCategory === cat.id 
            ? 'bg-stone-900 text-amber-300 border-amber-600/40 shadow-sm' 
            : 'bg-white text-stone-600 border-stone-200 hover:border-amber-500/50 hover:text-stone-900'
        }"
      >
        ${cat.name}
      </button>
    `).join('');
  }

  window.setCategory = function(catId) {
    state.activeCategory = catId;
    // Update active tab buttons
    if (categoryFiltersContainer) {
      Array.from(categoryFiltersContainer.children).forEach((btn, index) => {
        const cat = JEWELUX_DATA.categories[index];
        if (cat.id === catId) {
          btn.className = 'px-5 py-2 text-xs md:text-sm tracking-wider uppercase font-medium transition-all rounded-full border bg-stone-900 text-amber-300 border-amber-600/40 shadow-sm';
        } else {
          btn.className = 'px-5 py-2 text-xs md:text-sm tracking-wider uppercase font-medium transition-all rounded-full border bg-white text-stone-600 border-stone-200 hover:border-amber-500/50 hover:text-stone-900';
        }
      });
    }
    renderProducts();
  };

  // Cart Operations
  window.addToCart = function(productId, customSpecs = null) {
    let item;
    if (customSpecs) {
      item = {
        id: `bespoke-${Date.now()}`,
        name: customSpecs.name,
        priceUSD: customSpecs.priceUSD,
        image: customSpecs.image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
        metal: customSpecs.metal,
        stone: customSpecs.stone,
        customSpecs: true,
        quantity: 1
      };
      state.cart.push(item);
    } else {
      const prod = JEWELUX_DATA.products.find(p => p.id === productId);
      if (!prod) return;

      const existing = state.cart.find(i => i.id === productId);
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
          quantity: 1
        });
      }
    }

    saveCart();
    renderCart();
    updateBadges();
    openCartDrawer();
    showToast('Piece added to your shopping bag', '✨');
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
    const cartItemsContainer = document.getElementById('cart-items');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartTotalEl = document.getElementById('cart-total');
    const cartDiscountRow = document.getElementById('cart-discount-row');
    const cartDiscountAmount = document.getElementById('cart-discount-amount');
    const shippingProgressEl = document.getElementById('shipping-progress-fill');
    const shippingTextEl = document.getElementById('shipping-progress-text');

    if (!cartItemsContainer) return;

    if (state.cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="py-16 text-center text-stone-400">
          <svg class="w-14 h-14 mx-auto mb-3 text-stone-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p class="font-serif text-lg text-stone-600 mb-1">Your Shopping Bag is Empty</p>
          <p class="text-xs text-stone-400">Explore our High Jewellery masterpieces to begin your collection.</p>
        </div>
      `;
      if (cartSubtotalEl) cartSubtotalEl.textContent = formatPrice(0);
      if (cartTotalEl) cartTotalEl.textContent = formatPrice(0);
      if (shippingProgressEl) shippingProgressEl.style.width = '0%';
      if (shippingTextEl) shippingTextEl.textContent = 'Add items for complimentary insured courier delivery.';
      return;
    }

    const subtotalUSD = state.cart.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0);
    const discountUSD = subtotalUSD * (state.discountPercent / 100);
    const totalUSD = Math.max(0, subtotalUSD - discountUSD);

    cartItemsContainer.innerHTML = state.cart.map(item => `
      <div class="flex gap-4 py-4 border-b border-stone-100 items-center">
        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded bg-stone-100 flex-shrink-0" />
        <div class="flex-grow min-w-0">
          <h4 class="font-serif text-stone-900 text-sm truncate">${item.name}</h4>
          <p class="text-[11px] text-amber-700 truncate">${item.metal}</p>
          <p class="font-semibold text-stone-900 text-xs mt-1">${formatPrice(item.priceUSD)}</p>
          
          <div class="flex items-center gap-2 mt-2">
            <button onclick="updateCartQuantity('${item.id}', -1)" class="w-5 h-5 rounded border border-stone-300 text-stone-600 flex items-center justify-center text-xs hover:bg-stone-100">-</button>
            <span class="text-xs text-stone-800 font-medium px-1">${item.quantity}</span>
            <button onclick="updateCartQuantity('${item.id}', 1)" class="w-5 h-5 rounded border border-stone-300 text-stone-600 flex items-center justify-center text-xs hover:bg-stone-100">+</button>
            <button onclick="removeFromCart('${item.id}')" class="text-[11px] text-stone-400 hover:text-rose-600 ml-auto underline">Remove</button>
          </div>
        </div>
      </div>
    `).join('');

    if (cartSubtotalEl) cartSubtotalEl.textContent = formatPrice(subtotalUSD);
    if (cartTotalEl) cartTotalEl.textContent = formatPrice(totalUSD);

    // Discount line
    if (cartDiscountRow && cartDiscountAmount) {
      if (state.discountPercent > 0) {
        cartDiscountRow.classList.remove('hidden');
        cartDiscountAmount.textContent = `-${formatPrice(discountUSD)} (${state.discountPercent}%)`;
      } else {
        cartDiscountRow.classList.add('hidden');
      }
    }

    // Complimentary Insured Delivery Threshold ($10,000 USD)
    const thresholdUSD = 10000;
    const progressPercent = Math.min(100, (subtotalUSD / thresholdUSD) * 100);
    if (shippingProgressEl) shippingProgressEl.style.width = `${progressPercent}%`;

    if (shippingTextEl) {
      if (subtotalUSD >= thresholdUSD) {
        shippingTextEl.innerHTML = `<span class="text-emerald-600 font-medium">✓ Complimentary Insured White-Glove Delivery Unlocked</span>`;
      } else {
        const remaining = thresholdUSD - subtotalUSD;
        shippingTextEl.textContent = `Add ${formatPrice(remaining)} more to receive Complimentary Global Insured Delivery.`;
      }
    }
  }

  // Wishlist Operations
  window.toggleWishlist = function(productId) {
    const index = state.wishlist.indexOf(productId);
    if (index > -1) {
      state.wishlist.splice(index, 1);
      showToast('Piece removed from your wishlist', '♡');
    } else {
      state.wishlist.push(productId);
      showToast('Piece saved to your wishlist', '♥');
    }
    localStorage.setItem('jewelux_wishlist', JSON.stringify(state.wishlist));
    renderProducts();
    renderWishlist();
    updateBadges();
  };

  function renderWishlist() {
    const wishlistItemsContainer = document.getElementById('wishlist-items');
    if (!wishlistItemsContainer) return;

    if (state.wishlist.length === 0) {
      wishlistItemsContainer.innerHTML = `
        <div class="py-16 text-center text-stone-400">
          <svg class="w-14 h-14 mx-auto mb-3 text-stone-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p class="font-serif text-lg text-stone-600 mb-1">Your Wishlist is Empty</p>
          <p class="text-xs text-stone-400">Save pieces you cherish while browsing our high jewellery archives.</p>
        </div>
      `;
      return;
    }

    const items = JEWELUX_DATA.products.filter(p => state.wishlist.includes(p.id));
    wishlistItemsContainer.innerHTML = items.map(product => `
      <div class="flex gap-4 py-4 border-b border-stone-100 items-center">
        <img src="${product.image}" alt="${product.name}" class="w-16 h-16 object-cover rounded bg-stone-100 flex-shrink-0" />
        <div class="flex-grow min-w-0">
          <h4 class="font-serif text-stone-900 text-sm truncate">${product.name}</h4>
          <p class="text-[11px] text-amber-700 truncate">${product.metal}</p>
          <p class="font-semibold text-stone-900 text-xs mt-1">${formatPrice(product.priceUSD)}</p>
          
          <div class="flex items-center gap-2 mt-2">
            <button onclick="addToCart('${product.id}'); toggleWishlist('${product.id}');" class="px-2.5 py-1 bg-stone-900 text-amber-300 text-[11px] uppercase tracking-wider rounded">Move to Bag</button>
            <button onclick="toggleWishlist('${product.id}')" class="text-[11px] text-stone-400 hover:text-rose-600 ml-auto underline">Remove</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function updateBadges() {
    const cartCountEl = document.getElementById('cart-badge');
    const wishlistCountEl = document.getElementById('wishlist-badge');

    const totalCartCount = state.cart.reduce((sum, i) => sum + i.quantity, 0);
    if (cartCountEl) {
      cartCountEl.textContent = totalCartCount;
      cartCountEl.classList.toggle('hidden', totalCartCount === 0);
    }

    if (wishlistCountEl) {
      const count = state.wishlist.length;
      wishlistCountEl.textContent = count;
      wishlistCountEl.classList.toggle('hidden', count === 0);
    }
  }

  // Drawers (Cart & Wishlist)
  const cartDrawerBackdrop = document.getElementById('cart-drawer-backdrop');
  const cartDrawerPanel = document.getElementById('cart-drawer-panel');
  const wishlistDrawerBackdrop = document.getElementById('wishlist-drawer-backdrop');
  const wishlistDrawerPanel = document.getElementById('wishlist-drawer-panel');

  window.openCartDrawer = function() {
    if (cartDrawerBackdrop && cartDrawerPanel) {
      cartDrawerBackdrop.classList.add('active');
      cartDrawerPanel.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeCartDrawer = function() {
    if (cartDrawerBackdrop && cartDrawerPanel) {
      cartDrawerBackdrop.classList.remove('active');
      cartDrawerPanel.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  window.openWishlistDrawer = function() {
    if (wishlistDrawerBackdrop && wishlistDrawerPanel) {
      wishlistDrawerBackdrop.classList.add('active');
      wishlistDrawerPanel.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeWishlistDrawer = function() {
    if (wishlistDrawerBackdrop && wishlistDrawerPanel) {
      wishlistDrawerBackdrop.classList.remove('active');
      wishlistDrawerPanel.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // Promo Code Application
  window.applyPromoCode = function() {
    const promoInput = document.getElementById('promo-input');
    if (!promoInput) return;
    const code = promoInput.value.trim().toUpperCase();

    if (code === 'JEWELUX10' || code === 'VIP10' || code === 'HAUTE10') {
      state.discountPercent = 10;
      state.promoCodeApplied = code;
      renderCart();
      showToast('VIP Privilege Code applied: 10% Courtesy Saved', '⚜️');
      promoInput.value = '';
    } else {
      showToast('Invalid invitation or privilege code', '✕');
    }
  };

  // Checkout Simulation Modal
  window.simulateCheckout = function() {
    if (state.cart.length === 0) {
      showToast('Your shopping bag is empty', '⚠️');
      return;
    }
    closeCartDrawer();
    const modal = document.getElementById('checkout-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeCheckoutModal = function() {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
      modal.classList.remove('active');
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

  // Quick View Modal
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

    const addBtn = document.getElementById('qv-add-btn');
    if (addBtn) {
      addBtn.onclick = () => {
        addToCart(product.id);
        closeQuickView();
      };
    }

    quickViewModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeQuickView = function() {
    if (quickViewModal) {
      quickViewModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // Appointment Modal
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
    showToast('Private Salon Appointment requested. Our concierge will contact you within 2 business hours.', '🏛️');
  };

  // Search Modal
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
        <div class="p-6 text-center text-stone-400 text-xs">
          Type to search by gemstone (Diamond, Emerald, Sapphire), metal, or collection.
        </div>
      `;
      return;
    }

    const matches = JEWELUX_DATA.products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.metal.toLowerCase().includes(query) ||
      p.stone.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.cut.toLowerCase().includes(query)
    );

    if (matches.length === 0) {
      searchResults.innerHTML = `
        <div class="p-8 text-center text-stone-500">
          <p class="font-serif text-base text-stone-700">No masterpieces found for "${query}"</p>
          <p class="text-xs text-stone-400 mt-1">Our Bespoke Atelier can handcraft any design to your exact vision.</p>
          <button onclick="closeSearchModal(); openAppointmentModal('Inquiry for custom piece: ' + '${query}')" class="mt-3 px-4 py-1.5 text-xs bg-amber-700 text-white rounded">Request Bespoke Design</button>
        </div>
      `;
      return;
    }

    searchResults.innerHTML = matches.map(p => `
      <div class="flex items-center gap-4 p-3 hover:bg-stone-50 rounded cursor-pointer transition" onclick="closeSearchModal(); openQuickView('${p.id}')">
        <img src="${p.image}" alt="${p.name}" class="w-14 h-14 object-cover rounded bg-stone-100" />
        <div class="flex-grow">
          <h5 class="font-serif text-stone-900 text-sm font-medium">${p.name}</h5>
          <p class="text-[11px] text-stone-500">${p.stone} • ${p.metal}</p>
          <p class="text-xs font-semibold text-amber-800 mt-0.5">${formatPrice(p.priceUSD)}</p>
        </div>
        <span class="text-xs text-stone-400">View →</span>
      </div>
    `).join('');
  }

  // INTERACTIVE BESPOKE RING STUDIO
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
    // Update active button indicators
    document.querySelectorAll('[data-bespoke-metal]').forEach(el => {
      el.classList.toggle('ring-2', el.dataset.bespokeMetal === state.bespoke.metalId);
      el.classList.toggle('ring-amber-500', el.dataset.bespokeMetal === state.bespoke.metalId);
    });

    document.querySelectorAll('[data-bespoke-gem]').forEach(el => {
      el.classList.toggle('border-amber-500', el.dataset.bespokeGem === state.bespoke.gemId);
      el.classList.toggle('bg-amber-50', el.dataset.bespokeGem === state.bespoke.gemId);
    });

    document.querySelectorAll('[data-bespoke-cut]').forEach(el => {
      el.classList.toggle('border-amber-500', el.dataset.bespokeCut === state.bespoke.cutId);
      el.classList.toggle('bg-amber-50', el.dataset.bespokeCut === state.bespoke.cutId);
    });

    document.querySelectorAll('[data-bespoke-carat]').forEach(el => {
      const isMatch = parseFloat(el.dataset.bespokeCarat) === state.bespoke.caratWeight;
      el.classList.toggle('border-amber-500', isMatch);
      el.classList.toggle('bg-amber-50', isMatch);
    });

    updateBespokePrice();
    renderBespokeSVG();
  }

  function calculateBespokePriceUSD() {
    const metal = JEWELUX_DATA.bespokeOptions.metals.find(m => m.id === state.bespoke.metalId) || JEWELUX_DATA.bespokeOptions.metals[0];
    const gem = JEWELUX_DATA.bespokeOptions.gemstones.find(g => g.id === state.bespoke.gemId) || JEWELUX_DATA.bespokeOptions.gemstones[0];
    const carat = JEWELUX_DATA.bespokeOptions.carats.find(c => c.weight === state.bespoke.caratWeight) || JEWELUX_DATA.bespokeOptions.carats[1];
    
    // Base formula
    const rawPrice = metal.basePrice + (2200 * gem.multiplier * carat.priceMultiplier);
    return Math.round(rawPrice);
  }

  function updateBespokePrice() {
    const priceUSD = calculateBespokePriceUSD();
    const priceEl = document.getElementById('bespoke-calc-price');
    if (priceEl) {
      priceEl.textContent = formatPrice(priceUSD);
    }
  }

  function renderBespokeSVG() {
    if (!bespokeSvgContainer) return;

    const metal = JEWELUX_DATA.bespokeOptions.metals.find(m => m.id === state.bespoke.metalId) || JEWELUX_DATA.bespokeOptions.metals[0];
    const gem = JEWELUX_DATA.bespokeOptions.gemstones.find(g => g.id === state.bespoke.gemId) || JEWELUX_DATA.bespokeOptions.gemstones[0];
    const cut = JEWELUX_DATA.bespokeOptions.cuts.find(c => c.id === state.bespoke.cutId) || JEWELUX_DATA.bespokeOptions.cuts[0];
    const carat = JEWELUX_DATA.bespokeOptions.carats.find(c => c.weight === state.bespoke.caratWeight) || JEWELUX_DATA.bespokeOptions.carats[1];

    const baseGemSize = 38 * carat.scale;
    const bandColor = metal.color;
    const bandBorder = metal.border;
    const gemColor = gem.hex;

    // SVG shape representation
    let gemShapeSvg = '';
    if (cut.id === 'round') {
      gemShapeSvg = `
        <circle cx="150" cy="115" r="${baseGemSize}" fill="url(#gemGradient)" stroke="#FFFFFF" stroke-width="1.5" filter="url(#gemGlow)" />
        <!-- Facets -->
        <polygon points="150,${115 - baseGemSize} ${150 + baseGemSize*0.7},${115 - baseGemSize*0.5} ${150 + baseGemSize*0.7},${115 + baseGemSize*0.5} 150,${115 + baseGemSize} ${150 - baseGemSize*0.7},${115 + baseGemSize*0.5} ${150 - baseGemSize*0.7},${115 - baseGemSize*0.5}" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1" />
        <circle cx="150" cy="115" r="${baseGemSize*0.5}" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1" />
      `;
    } else if (cut.id === 'emerald-cut') {
      const w = baseGemSize * 1.8;
      const h = baseGemSize * 1.4;
      gemShapeSvg = `
        <rect x="${150 - w/2}" y="${115 - h/2}" width="${w}" height="${h}" rx="6" fill="url(#gemGradient)" stroke="#FFFFFF" stroke-width="1.5" filter="url(#gemGlow)" />
        <rect x="${150 - w*0.35}" y="${115 - h*0.35}" width="${w*0.7}" height="${h*0.7}" rx="4" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1" />
        <line x1="${150 - w/2}" y1="${115 - h/2}" x2="${150 - w*0.35}" y2="${115 - h*0.35}" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
        <line x1="${150 + w/2}" y1="${115 - h/2}" x2="${150 + w*0.35}" y2="${115 - h*0.35}" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
        <line x1="${150 - w/2}" y1="${115 + h/2}" x2="${150 - w*0.35}" y2="${115 + h*0.35}" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
        <line x1="${150 + w/2}" y1="${115 + h/2}" x2="${150 + w*0.35}" y2="${115 + h*0.35}" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
      `;
    } else if (cut.id === 'oval') {
      const rx = baseGemSize * 1.1;
      const ry = baseGemSize * 0.8;
      gemShapeSvg = `
        <ellipse cx="150" cy="115" rx="${rx}" ry="${ry}" fill="url(#gemGradient)" stroke="#FFFFFF" stroke-width="1.5" filter="url(#gemGlow)" />
        <ellipse cx="150" cy="115" rx="${rx*0.6}" ry="${ry*0.6}" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1" />
        <line x1="${150 - rx}" y1="115" x2="${150 + rx}" y2="115" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
        <line x1="150" y1="${115 - ry}" x2="150" y2="${115 + ry}" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
      `;
    } else { // pear
      const s = carat.scale;
      gemShapeSvg = `
        <path d="M 150 ${115 - 38*s} C ${150 + 26*s} ${115 - 10*s}, ${150 + 26*s} ${115 + 24*s}, 150 ${115 + 28*s} C ${150 - 26*s} ${115 + 24*s}, ${150 - 26*s} ${115 - 10*s}, 150 ${115 - 38*s} Z" fill="url(#gemGradient)" stroke="#FFFFFF" stroke-width="1.5" filter="url(#gemGlow)" />
        <circle cx="150" cy="${115 + 10*s}" r="${12*s}" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1" />
      `;
    }

    bespokeSvgContainer.innerHTML = `
      <svg viewBox="0 0 300 300" class="w-full h-full drop-shadow-2xl">
        <defs>
          <filter id="gemGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <linearGradient id="bandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${bandColor}" stop-opacity="0.9" />
            <stop offset="35%" stop-color="#FFFFFF" stop-opacity="0.8" />
            <stop offset="70%" stop-color="${bandColor}" stop-opacity="1" />
            <stop offset="100%" stop-color="${bandBorder}" stop-opacity="0.9" />
          </linearGradient>

          <radialGradient id="gemGradient" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="30%" stop-color="${gemColor}" />
            <stop offset="85%" stop-color="${gemColor}" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.6" />
          </radialGradient>
        </defs>

        <!-- Ambient Base Shadow -->
        <ellipse cx="150" cy="245" rx="75" ry="14" fill="rgba(0,0,0,0.6)" filter="blur(8px)" />

        <!-- Solid Ring Band Outer Circle -->
        <ellipse cx="150" cy="180" rx="68" ry="62" fill="none" stroke="url(#bandGradient)" stroke-width="14" stroke-linecap="round" />
        
        <!-- Band Inner Cutout for 3D realism -->
        <ellipse cx="150" cy="180" rx="55" ry="50" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="2" />
        
        <!-- Prongs / Basket Setting -->
        <g stroke="${bandColor}" stroke-width="3" stroke-linecap="round">
          <line x1="135" y1="128" x2="142" y2="148" />
          <line x1="165" y1="128" x2="158" y2="148" />
          <line x1="150" y1="134" x2="150" y2="150" stroke-width="4" stroke="url(#bandGradient)" />
        </g>

        <!-- Gemstone Geometry -->
        ${gemShapeSvg}

        <!-- Diamond Brilliance Flares -->
        <circle cx="${142}" cy="${102}" r="2" fill="#FFFFFF" class="sparkle-effect" />
        <circle cx="${158}" cy="${122}" r="1.5" fill="#FFFFFF" class="sparkle-effect" />
      </svg>
    `;
  }

  // Bespoke Actions
  window.orderBespokePiece = function() {
    const metal = JEWELUX_DATA.bespokeOptions.metals.find(m => m.id === state.bespoke.metalId);
    const gem = JEWELUX_DATA.bespokeOptions.gemstones.find(g => g.id === state.bespoke.gemId);
    const cut = JEWELUX_DATA.bespokeOptions.cuts.find(c => c.id === state.bespoke.cutId);
    const carat = JEWELUX_DATA.bespokeOptions.carats.find(c => c.weight === state.bespoke.caratWeight);
    const priceUSD = calculateBespokePriceUSD();

    const customSpecs = {
      name: `Bespoke ${carat.label} ${gem.name} Ring`,
      priceUSD: priceUSD,
      metal: metal.name,
      stone: `${carat.label} ${cut.name} (${gem.name})`,
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80'
    };

    addToCart(null, customSpecs);
  };

  window.consultBespokePiece = function() {
    const metal = JEWELUX_DATA.bespokeOptions.metals.find(m => m.id === state.bespoke.metalId);
    const gem = JEWELUX_DATA.bespokeOptions.gemstones.find(g => g.id === state.bespoke.gemId);
    const cut = JEWELUX_DATA.bespokeOptions.cuts.find(c => c.id === state.bespoke.cutId);
    const carat = JEWELUX_DATA.bespokeOptions.carats.find(c => c.weight === state.bespoke.caratWeight);

    const notes = `I would like to commission the Bespoke ${carat.label} ${gem.name} in ${cut.name} cut set in ${metal.name}. Please prepare stone selections and atelier sketches.`;
    openAppointmentModal(notes);
  };

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
      prodBtnEl.onclick = () => openQuickView(look.featuredProduct);
    }

    // Indicator tabs
    document.querySelectorAll('[data-lookbook-index]').forEach(tab => {
      const active = parseInt(tab.dataset.lookbookIndex, 10) === index;
      tab.classList.toggle('bg-amber-500', active);
      tab.classList.toggle('text-black', active);
      tab.classList.toggle('bg-stone-800', !active);
      tab.classList.toggle('text-stone-400', !active);
    });
  };

  // Canvas Sparkle Ambient Background
  function initAmbientCanvas() {
    const canvas = document.getElementById('hero-ambient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    });

    const particles = Array.from({ length: 42 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.6,
      opacity: Math.random() * 0.7 + 0.2,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: -Math.random() * 0.45 - 0.1,
      twinkleSpeed: Math.random() * 0.03 + 0.01
    }));

    function animate() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += Math.sin(Date.now() * p.twinkleSpeed) * 0.02;

        if (p.y < 0) p.y = height;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(223, 190, 125, ${Math.max(0.1, Math.min(0.9, p.opacity))})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#D4AF37';
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    animate();
  }

  // Initialize
  renderProducts();
  renderCart();
  renderWishlist();
  updateBadges();
  updateBespokeUI();
  initAmbientCanvas();

  // Sticky Header Scroll effect
  const mainHeader = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      mainHeader.classList.add('shadow-xl', 'bg-stone-950/95');
      mainHeader.classList.remove('bg-stone-950/80');
    } else {
      mainHeader.classList.remove('shadow-xl', 'bg-stone-950/95');
      mainHeader.classList.add('bg-stone-950/80');
    }
  });

  // Mobile Menu Drawer
  window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  };
});
