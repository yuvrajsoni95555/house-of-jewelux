/**
 * HOUSE OF JEWELUX — UNIFIED MOTION DESIGN SYSTEM
 * Ultra-Premium Cinematic Luxury Motion Engine
 * Powered by GSAP 3 & ScrollTrigger
 * Works alongside existing motion-engine.js
 */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

  // Default durations adapted for device
  const DUR = {
    fast: prefersReducedMotion ? 0.01 : 0.25,
    base: prefersReducedMotion ? 0.01 : 0.5,
    slow: prefersReducedMotion ? 0.01 : 0.8,
    cinematic: prefersReducedMotion ? 0.01 : 1.2,
  };

  const EASE = {
    luxury: 'cubic-bezier(0.16, 1, 0.3, 1)',
    expo: 'cubic-bezier(0.19, 1, 0.22, 1)',
    back: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    circOut: 'power3.out',
  };

  const MotionDesignSystem = {
    initialized: false,
    toastTimer: null,

    /* ------------------------------------------------------------------ */
    /* INITIALIZATION                                                     */
    /* ------------------------------------------------------------------ */

    init: function () {
      if (this.initialized) return;
      if (typeof gsap === 'undefined') {
        console.warn('Motion Design System: GSAP not loaded.');
        return;
      }

      if (prefersReducedMotion) {
        document.documentElement.classList.add('reduced-motion');
        console.log('✦ HJ Motion Design System: Reduced motion active.');
      }

      this.initHeaderLogoEntrance();
      this.initStickyHeader();
      this.initNavigationUnderline();
      this.initMegaMenuMotion();
      this.initSearchOverlayMotion();
      this.initWishlistMotion();
      this.initCartDrawerMotion();
      this.initMobileNavMotion();
      this.initGlobalMicroInteractions();
      this.initBackToTop();
      this.initFormInteractions();

      this.initialized = true;
      console.log('✦ HJ Motion Design System: Live.');
    },

    /* ------------------------------------------------------------------ */
    /* HEADER MOTION                                                      */
    /* ------------------------------------------------------------------ */

    initHeaderLogoEntrance: function () {
      if (prefersReducedMotion) return;
      const logo = document.querySelector('.brand-logo-img, .mobile-logo-img');
      if (!logo) return;

      gsap.fromTo(
        logo,
        { scale: 0.6, opacity: 0, y: -20 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: DUR.cinematic,
          ease: EASE.back,
          delay: 0.15,
        }
      );
    },

    initStickyHeader: function () {
      const header = document.querySelector('.site-header');
      if (!header) return;

      let lastScrollY = window.scrollY;
      let ticking = false;

      const update = () => {
        const currentY = window.scrollY;
        if (currentY > 40) {
          header.classList.add('scrolled', 'sticky-compact');
        } else {
          header.classList.remove('scrolled', 'sticky-compact');
        }
        if (currentY > lastScrollY && currentY > 200) {
          header.classList.add('header-hide');
        } else {
          header.classList.remove('header-hide');
        }
        lastScrollY = currentY;
        ticking = false;
      };

      window.addEventListener(
        'scroll',
        () => {
          if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
          }
        },
        { passive: true }
      );
    },

    initNavigationUnderline: function () {
      if (prefersReducedMotion) return;
      const links = document.querySelectorAll('.nav-ribbon-link');
      if (!links.length) return;

      const ribbon = document.querySelector('.nav-ribbon-list');
      if (!ribbon) return;

      // Create underline indicator
      const indicator = document.createElement('div');
      indicator.className = 'nav-underline-indicator';
      ribbon.style.position = 'relative';
      ribbon.prepend(indicator);

      const activeLink = document.querySelector('.nav-ribbon-link.highlight, .nav-ribbon-link.active');
      if (activeLink) {
        this.updateUnderline(indicator, activeLink);
      }

      links.forEach((link) => {
        link.addEventListener('mouseenter', () => this.updateUnderline(indicator, link, true));
        link.addEventListener('mouseleave', () => {
          const active = document.querySelector('.nav-ribbon-link.highlight, .nav-ribbon-link.active');
          if (active) this.updateUnderline(indicator, active, true);
          else gsap.to(indicator, { width: 0, duration: DUR.base, ease: EASE.luxury });
        });
      });
    },

    updateUnderline: function (indicator, link, animate = true) {
      const rect = link.getBoundingClientRect();
      const ribbonRect = document.querySelector('.nav-ribbon-list').getBoundingClientRect();
      const width = rect.width;
      const left = rect.left - ribbonRect.left;

      if (animate) {
        gsap.to(indicator, {
          width: width,
          x: left,
          duration: DUR.base,
          ease: EASE.luxury,
        });
      } else {
        gsap.set(indicator, { width: width, x: left });
      }
    },

    initMegaMenuMotion: function () {
      if (prefersReducedMotion) return;
      const megaItems = document.querySelectorAll('.nav-has-mega');
      megaItems.forEach((item) => {
        const menu = item.querySelector('.mega-menu');
        if (!menu) return;

        item.addEventListener('mouseenter', () => {
          gsap.to(menu, {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: EASE.luxury,
            display: 'grid',
          });
        });
        item.addEventListener('mouseleave', () => {
          gsap.to(menu, {
            opacity: 0,
            y: 10,
            duration: 0.25,
            ease: EASE.luxury,
            onComplete: () => {
              gsap.set(menu, { display: 'none' });
            },
          });
        });

        // Stagger mega menu links on open
        const links = menu.querySelectorAll('.mega-links a');
        links.forEach((link, i) => {
          link.style.opacity = '0';
          link.style.transform = 'translateX(-10px)';
        });
      });
    },

    initSearchOverlayMotion: function () {
      const searchWrap = document.querySelector('.header-search-wrap, .mobile-search-row');
      if (!searchWrap) return;

      // Create search overlay if not exists
      let overlay = document.getElementById('search-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'search-overlay';
        overlay.className = 'search-overlay';
        overlay.innerHTML = `
          <div class="container" style="height: 100%; display: flex; align-items: center; justify-content: center;">
            <div style="max-width: 560px; width: 90%; text-align: center;">
              <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.22em; color: var(--color-antique-gold); margin-bottom: 0.5rem;">Search the Atelier Vault</div>
              <input type="text" id="overlay-search-input" class="form-input" style="font-size: 1.5rem; text-align: center; border: none; border-bottom: 2px solid var(--color-warm-stone); background: transparent; width: 100%;" placeholder="Type design, stone, or category..." />
              <div id="overlay-search-results" style="margin-top: 2rem; text-align: left; max-height: 400px; overflow-y: auto;"></div>
            </div>
          </div>
          <button id="search-overlay-close" style="position: fixed; top: 1.5rem; right: 1.5rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; z-index: 1110; color: var(--color-deep-heritage-brown);">✕</button>
        `;
        document.body.appendChild(overlay);

        document.getElementById('search-overlay-close').addEventListener('click', () => this.closeSearchOverlay());
        document.getElementById('overlay-search-input').addEventListener('input', (e) => {
          window.HJ.liveSearch(e.target.value);
          // Mirror results to overlay
          const src = document.getElementById('search-live-results');
          const dst = document.getElementById('overlay-search-results');
          if (src && dst) dst.innerHTML = src.innerHTML;
        });
      }

      const openSearch = () => {
        overlay.classList.add('active');
        setTimeout(() => {
          const input = document.getElementById('overlay-search-input');
          if (input) input.focus();
        }, 100);
        document.body.style.overflow = 'hidden';
      };

      const closeSearch = () => {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      };

      // Wire existing search triggers
      const triggers = document.querySelectorAll('[onclick="window.HJ.openSearch()"]');
      triggers.forEach((t) => {
        t.addEventListener('click', (e) => {
          e.preventDefault();
          openSearch();
        });
      });

      // Close on Escape
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeSearch();
      });
    },

    closeSearchOverlay: function () {
      const overlay = document.getElementById('search-overlay');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    },

    /* ------------------------------------------------------------------ */
    /* WISHLIST & CART MOTION                                             */
    /* ------------------------------------------------------------------ */

    initWishlistMotion: function () {
      if (prefersReducedMotion) return;
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.card-wishlist-btn');
        if (!btn) return;

        const isAdding = !btn.classList.contains('active');
        const svg = btn.querySelector('svg');

        // Heart pulse
        gsap.fromTo(btn, { scale: 0.8 }, { scale: 1.25, duration: 0.2, ease: EASE.back, yoyo: true, repeat: 1 });

        if (svg && isAdding) {
          gsap.to(svg, {
            fill: 'var(--color-accent-crimson)',
            stroke: 'var(--color-accent-crimson)',
            duration: 0.25,
            ease: EASE.luxury,
          });
        }
      });
    },

    initCartDrawerMotion: function () {
      // Cart open/close is handled by CSS transitions on .slide-drawer.active
      // Add staggered entry for cart items when drawer opens
      const openCartOrig = window.HJ ? window.HJ.openCart : null;
      if (window.HJ) {
        window.HJ.openCart = function () {
          if (openCartOrig) openCartOrig.call(window.HJ);
          MotionDesignSystem.animateCartItems();
        };
      }
    },

    animateCartItems: function () {
      const items = document.querySelectorAll('.cart-item-row');
      if (!items.length) return;
      gsap.fromTo(
        items,
        { opacity: 0, x: 20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.35,
          stagger: 0.08,
          ease: EASE.luxury,
        }
      );
    },

    showAddedToast: function (productName) {
      if (prefersReducedMotion) return;
      let toast = document.getElementById('hj-added-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'hj-added-toast';
        toast.className = 'added-toast';
        document.body.appendChild(toast);
      }
      toast.textContent = `Added to Bag ${productName ? '• ' + productName : ''}`;
      toast.classList.add('show');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 2000);

      // Hook into addToCart to show toast
      const origAddToCart = window.HJ ? window.HJ.addToCart : null;
      if (window.HJ && origAddToCart) {
        window.HJ.addToCart = function (productId, qty, e) {
          origAddToCart.call(window.HJ, productId, qty, e);
          const prod = window.HJ.state ? null : null;
          MotionDesignSystem.showAddedToast();
        };
      }
    },

    /* ------------------------------------------------------------------ */
    /* MOBILE NAVIGATION                                                  */
    /* ------------------------------------------------------------------ */

    initMobileNavMotion: function () {
      if (prefersReducedMotion) return;
      const toggle = document.querySelector('.mobile-menu-toggle');
      const drawer = document.getElementById('mobile-menu-drawer');
      if (!toggle || !drawer) return;

      const links = drawer.querySelectorAll('ul > li > a');
      links.forEach((link, i) => {
        gsap.set(link, { y: 15, opacity: 0 });
      });

      const open = () => {
        drawer.classList.add('active');
        document.getElementById('drawer-backdrop').classList.add('active');
        gsap.to(links, {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.05,
          ease: EASE.luxury,
        });
      };

      const close = () => {
        drawer.classList.remove('active');
        document.getElementById('drawer-backdrop').classList.remove('active');
      };

      toggle.addEventListener('click', open);
      const closeBtn = drawer.querySelector('.drawer-close-btn');
      if (closeBtn) closeBtn.addEventListener('click', close);
    },

    /* ------------------------------------------------------------------ */
    /* GLOBAL MICRO-INTERACTIONS                                          */
    /* ------------------------------------------------------------------ */

    initGlobalMicroInteractions: function () {
      if (prefersReducedMotion) return;

      // Magnetic buttons
      const magnets = document.querySelectorAll('.btn-gold, .btn-primary, .card-add-btn');
      magnets.forEach((btn) => {
        btn.addEventListener('mouseenter', () => {
          gsap.to(btn, { y: -2, duration: 0.2, ease: EASE.luxury });
        });
        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, { y: 0, duration: 0.25, ease: EASE.luxury });
        });
      });

      // Button press feedback
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('button, .btn-primary, .btn-gold, .card-add-btn');
        if (btn) {
          gsap.fromTo(btn, { scale: 1 }, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
        }
      });

      // Product card hover lift
      document.addEventListener('mouseenter', (e) => {
        const card = e.target.closest('.product-card');
        if (card) {
          gsap.to(card, { y: -6, duration: 0.35, ease: EASE.luxury });
        }
      }, true);
      document.addEventListener('mouseleave', (e) => {
        const card = e.target.closest('.product-card');
        if (card) {
          gsap.to(card, { y: 0, duration: 0.35, ease: EASE.luxury });
        }
      }, true);

      // Quantity selector buttons
      document.addEventListener('click', (e) => {
        const qtyBtn = e.target.closest('.qty-btn');
        if (qtyBtn) {
          gsap.fromTo(qtyBtn, { scale: 1 }, { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1 });
        }
      });

      // Filter pills
      document.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill, .capsule-tab');
        if (pill) {
          gsap.fromTo(pill, { scale: 1 }, { scale: 0.94, duration: 0.1, yoyo: true, repeat: 1 });
        }
      });

      // Accordion arrows
      document.addEventListener('click', (e) => {
        const arrow = e.target.closest('.pdp-accordion-title');
        if (arrow) {
          const span = arrow.querySelector('span:last-child');
          if (span) {
            const isActive = arrow.parentElement.classList.contains('active');
            gsap.to(span, {
              rotate: isActive ? 0 : 180,
              duration: 0.25,
              ease: EASE.luxury,
            });
          }
        }
      });

      // Social icons hover
      document.addEventListener('mouseenter', (e) => {
        const icon = e.target.closest('.footer-links-list a, .header-icon-action');
        if (icon) {
          gsap.to(icon, { x: 4, duration: 0.25, ease: EASE.luxury });
        }
      }, true);
      document.addEventListener('mouseleave', (e) => {
        const icon = e.target.closest('.footer-links-list a, .header-icon-action');
        if (icon) {
          gsap.to(icon, { x: 0, duration: 0.25, ease: EASE.luxury });
        }
      }, true);
    },

    /* ------------------------------------------------------------------ */
    /* BACK TO TOP                                                        */
    /* ------------------------------------------------------------------ */

    initBackToTop: function () {
      let btt = document.getElementById('back-to-top');
      if (!btt) {
        btt = document.createElement('button');
        btt.id = 'back-to-top';
        btt.className = 'back-to-top';
        btt.setAttribute('aria-label', 'Back to top');
        btt.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 6 12 12 6 6"></polyline><polyline points="18 18 12 12 6 18"></polyline></svg>';
        document.body.appendChild(btt);
      }

      btt.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            if (window.scrollY > 300) {
              btt.classList.add('visible');
            } else {
              btt.classList.remove('visible');
            }
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    },

    /* ------------------------------------------------------------------ */
    /* FORM INTERACTIONS                                                  */
    /* ------------------------------------------------------------------ */

    initFormInteractions: function () {
      if (prefersReducedMotion) return;

      // Input focus states with field pop
      const inputs = document.querySelectorAll('.form-input, .newsletter-input');
      inputs.forEach((input) => {
        input.addEventListener('focus', () => {
          const wrapper = input.closest('.form-field') || input.closest('.newsletter-form');
          if (wrapper) {
            gsap.to(wrapper, { scale: 1.01, duration: 0.2, ease: EASE.luxury });
          }
        });
        input.addEventListener('blur', () => {
          const wrapper = input.closest('.form-field') || input.closest('.newsletter-form');
          if (wrapper) {
            gsap.to(wrapper, { scale: 1, duration: 0.2, ease: EASE.luxury });
          }
        });
      });

      // Newsletter form submit
      const newsletterForm = document.querySelector('.newsletter-form');
      if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const btn = newsletterForm.querySelector('button[type="submit"]');
          const originalText = btn.textContent;
          gsap.to(btn, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1, onComplete: () => {
            btn.textContent = 'Subscribed ✦';
            gsap.to(btn, { backgroundColor: 'var(--color-antique-gold)', color: '#140F0D', duration: 0.3 });
            setTimeout(() => {
              btn.textContent = originalText;
              gsap.to(btn, { backgroundColor: '', color: '', duration: 0.3 });
            }, 2000);
          }});
        });
      }

      // Appointment form validation feedback
      const aptForm = document.getElementById('appointment-form');
      if (aptForm) {
        aptForm.addEventListener('submit', (e) => {
          const inputs = aptForm.querySelectorAll('input, select, textarea');
          let valid = true;
          inputs.forEach((input) => {
            if (!input.value.trim()) {
              valid = false;
              gsap.fromTo(input, { x: -5 }, { x: 5, duration: 0.1, yoyo: true, repeat: 3 });
              input.style.borderColor = 'var(--color-accent-crimson)';
            } else {
              input.style.borderColor = 'var(--color-warm-stone)';
            }
          });
          if (!valid) e.preventDefault();
        });
      }
    },

    /* ------------------------------------------------------------------ */
    /* PAGE-LEVEL MOTION (called from app.js refreshTriggers)             */
    /* ------------------------------------------------------------------ */

    refreshTriggers: function () {
      if (prefersReducedMotion || typeof ScrollTrigger === 'undefined') return;
      ScrollTrigger.getAll().forEach((t) => t.kill());

      requestAnimationFrame(() => {
        this.animatePageHeadlines();
        this.animatePageImageReveals();
        this.animateProductGrids();
        this.animateCategoryCards();
        this.animateCraftsmanshipSteps();
        this.animateCollectionHero();
        this.animatePDPGallery();
        this.animateAboutStory();
        this.animateContactFields();
        this.animateFooterReveal();
        ScrollTrigger.refresh();
      });
    },

    animatePageHeadlines: function () {
      const titles = document.querySelectorAll('.section-title, .section-pretitle, .pdp-title-h1, .collection-hero-title');
      titles.forEach((el) => {
        if (el.dataset.motionDsBound) return;
        el.dataset.motionDsBound = 'true';
        gsap.fromTo(
          el,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: DUR.slow,
            ease: EASE.luxury,
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
          }
        );
      });
    },

    animatePageImageReveals: function () {
      const images = document.querySelectorAll('.cat-showcase-card, .editorial-image-reveal, .about-image-reveal');
      images.forEach((img, i) => {
        if (img.dataset.motionDsBound) return;
        img.dataset.motionDsBound = 'true';
        gsap.fromTo(
          img,
          { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
          {
            clipPath: 'inset(0 0 0 0)',
            opacity: 1,
            duration: DUR.slow,
            delay: i * 0.1,
            ease: EASE.expo,
            scrollTrigger: { trigger: img, start: 'top 88%', toggleActions: 'play none none none' },
          }
        );
      });
    },

    animateProductGrids: function () {
      const grids = document.querySelectorAll('.products-grid');
      grids.forEach((grid) => {
        const cards = grid.querySelectorAll('.product-card');
        if (!cards.length) return;
        gsap.fromTo(
          cards,
          { y: 30, opacity: 0, scale: 0.97 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: EASE.luxury,
            scrollTrigger: { trigger: grid, start: 'top 90%', toggleActions: 'play none none none' },
          }
        );
      });
    },

    animateCategoryCards: function () {
      const cards = document.querySelectorAll('.cat-showcase-card');
      if (!cards.length) return;
      gsap.fromTo(
        cards,
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: EASE.luxury,
          scrollTrigger: { trigger: cards[0], start: 'top 88%', toggleActions: 'play none none none' },
        }
      );
    },

    animateCraftsmanshipSteps: function () {
      const section = document.getElementById('craftsmanship-section');
      if (!section) return;
      const steps = section.querySelectorAll('[style*="background: var(--color-warm-ivory)"]');
      if (!steps.length) return;
      gsap.fromTo(
        steps,
        { y: 30, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.12,
          ease: EASE.luxury,
          scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none none' },
        }
      );
    },

    animateCollectionHero: function () {
      const hero = document.querySelector('.collection-hero-text');
      if (!hero) return;
      const children = hero.children;
      gsap.fromTo(
        children,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: EASE.luxury,
          scrollTrigger: { trigger: hero, start: 'top 85%', toggleActions: 'play none none none' },
        }
      );
    },

    animatePDPGallery: function () {
      const items = document.querySelectorAll('.pdp-gallery-item');
      if (!items.length) return;
      gsap.fromTo(
        items,
        { scale: 0.94, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: EASE.luxury,
          scrollTrigger: { trigger: items[0], start: 'top 85%', toggleActions: 'play none none none' },
        }
      );
    },

    animateAboutStory: function () {
      const reveals = document.querySelectorAll('.about-story-reveal');
      if (!reveals.length) return;
      gsap.fromTo(
        reveals,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.15,
          ease: EASE.luxury,
          scrollTrigger: { trigger: reveals[0], start: 'top 85%', toggleActions: 'play none none none' },
        }
      );
    },

    animateContactFields: function () {
      const fields = document.querySelectorAll('.contact-field');
      if (!fields.length) return;
      gsap.fromTo(
        fields,
        { y: 15, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: EASE.luxury,
          scrollTrigger: { trigger: fields[0], start: 'top 85%', toggleActions: 'play none none none' },
        }
      );
    },

    animateFooterReveal: function () {
      const footer = document.querySelector('.site-footer');
      if (!footer) return;
      const children = footer.querySelectorAll('.footer-reveal > *, .newsletter-wrap, .footer-col-title, .footer-links-list li');
      if (!children.length) return;
      gsap.fromTo(
        children,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: EASE.luxury,
          scrollTrigger: { trigger: footer, start: 'top 85%', toggleActions: 'play none none none' },
        }
      );
    },

    /* ------------------------------------------------------------------ */
    /* UTILITY: text split for typography animation                       */
    /* ------------------------------------------------------------------ */

    splitText: function (selector) {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        const text = el.textContent.trim();
        el.innerHTML = '';
        const chars = text.split('').map((char) => {
          const span = document.createElement('span');
          span.className = 'char';
          span.textContent = char === ' ' ? '\u00A0' : char;
          el.appendChild(span);
          return span;
        });
        el.chars = chars;
      });
      return elements;
    },

    animateTypography: function (selector, options = {}) {
      const elements = this.splitText(selector);
      const duration = options.duration || DUR.slow;
      const stagger = options.stagger || 0.03;
      elements.forEach((el) => {
        gsap.to(el.chars, {
          y: 0,
          opacity: 1,
          duration,
          stagger,
          ease: EASE.expo,
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      });
    },
  };

  // Expose
  window.HJ_MOTION_DS = MotionDesignSystem;

  // Auto init
  window.addEventListener('DOMContentLoaded', () => {
    // Small delay to let existing motion engine init first
    setTimeout(() => MotionDesignSystem.init(), 100);
  });

})();