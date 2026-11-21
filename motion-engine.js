/**
 * ===================================================================
 * HOUSE OF JEWELUX — MASTER CINEMATIC MOTION GRAPHICS ENGINE
 * Italian Luxury Editorial Aesthetics × Indian Royal Jewellery Heritage
 * Optimized for Rock-Solid Native Scroll Performance & 120 FPS
 * Powered by GSAP 3 & ScrollTrigger (Vendor Local)
 * ===================================================================
 */

(function () {
  'use strict';

  // 1. Accessibility: Check prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 2. Motion Design Tokens & Easing Constants
  const LUXURY_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const EXPO_EASE = 'cubic-bezier(0.19, 1, 0.22, 1)';
  const SPRING_EASE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

  // 3. Register GSAP & ScrollTrigger
  if (typeof gsap !== 'undefined') {
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }
    gsap.defaults({
      ease: LUXURY_EASE,
      duration: 0.75
    });
  }

  // 4. Master Motion Controller
  const MotionEngine = {
    initialized: false,
    toastTimer: null,
    scrollTicking: false,
    lastScrollY: 0,

    init: function () {
      if (this.initialized) return;

      if (prefersReducedMotion) {
        document.documentElement.classList.add('reduced-motion');
        console.log('✦ HOUSE OF JEWELUX Motion Engine: Reduced motion enabled.');
        this.initialized = true;
        return;
      }

      this.initHeaderScrollEngine();
      this.initHeaderLogoReveal();
      this.initNavUnderline();
      this.initMicroInteractions();
      this.initBackToTop();
      this.initFormMotion();
      this.initCard3DInteractions();
      this.initPDPMacroInspector();
      this.refreshTriggers();

      this.initialized = true;
      console.log('✦ HOUSE OF JEWELUX Motion Engine: Live at 60-120 FPS.');
    },

    /**
     * Single High-Performance RAF-Throttled Header Scroll Controller
     * Zero Layout Reflow: Never alters element height during scroll
     */
    initHeaderScrollEngine: function () {
      const header = document.querySelector('.site-header');
      if (!header) return;

      this.lastScrollY = window.scrollY;

      const onScrollTick = () => {
        const currentY = window.scrollY;
        const delta = currentY - this.lastScrollY;

        // Scrolled styling (opaque luxury ivory background + soft shadow)
        if (currentY > 45) {
          if (!header.classList.contains('scrolled')) {
            header.classList.add('scrolled');
          }

          // Smart auto-hide on fast downward scroll, show on upward scroll
          if (delta > 8 && currentY > 220) {
            header.classList.add('header-hide');
          } else if (delta < -5) {
            header.classList.remove('header-hide');
          }
        } else {
          header.classList.remove('scrolled', 'header-hide');
        }

        // Back-to-top button toggle
        const backToTop = document.querySelector('.back-to-top');
        if (backToTop) {
          if (currentY > 400) {
            backToTop.classList.add('visible');
          } else {
            backToTop.classList.remove('visible');
          }
        }

        this.lastScrollY = currentY;
        this.scrollTicking = false;
      };

      window.addEventListener('scroll', () => {
        if (!this.scrollTicking) {
          this.scrollTicking = true;
          window.requestAnimationFrame(onScrollTick);
        }
      }, { passive: true });
    },

    /**
     * Initial Luxury Brand Logo Entrance
     */
    initHeaderLogoReveal: function () {
      if (prefersReducedMotion || typeof gsap === 'undefined') return;
      const logo = document.querySelector('.brand-logo-img, .mobile-logo-img');
      if (!logo) return;

      gsap.fromTo(logo,
        { scale: 0.92, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.1, ease: LUXURY_EASE, delay: 0.1 }
      );
    },

    /**
     * Navigation Underline Tracking Hover Effect
     */
    initNavUnderline: function () {
      const navLinks = document.querySelectorAll('.nav-ribbon-link');
      navLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
          gsap.to(link, { letterSpacing: '0.04em', duration: 0.3, ease: 'power2.out' });
        });
        link.addEventListener('mouseleave', () => {
          gsap.to(link, { letterSpacing: '0.02em', duration: 0.25, ease: 'power2.out' });
        });
      });
    },

    /**
     * Back to Top Smooth Controller
     */
    initBackToTop: function () {
      let btn = document.querySelector('.back-to-top');
      if (!btn) {
        btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label', 'Return to top of boutique');
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        `;
        document.body.appendChild(btn);
      }

      btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    },

    /**
     * Form Inputs Polish
     */
    initFormMotion: function () {
      document.addEventListener('focusin', e => {
        if (e.target.matches('.form-input, select.sort-select, textarea')) {
          gsap.to(e.target, { y: -1, duration: 0.2, ease: 'power2.out' });
        }
      });
      document.addEventListener('focusout', e => {
        if (e.target.matches('.form-input, select.sort-select, textarea')) {
          gsap.to(e.target, { y: 0, duration: 0.2, ease: 'power2.out' });
        }
      });
    },

    /**
     * Master Route Refresh & ScrollTrigger Orchestrator
     * Cleans up orphaned triggers, waits for layout settlement, then binds smoothly
     */
    refreshTriggers: function () {
      if (prefersReducedMotion || typeof ScrollTrigger === 'undefined' || typeof gsap === 'undefined') return;

      // Kill previous route triggers to prevent orphaned listeners and memory leaks
      ScrollTrigger.getAll().forEach(t => t.kill());

      // Use double RAF to ensure DOM has completely rendered and painted
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          this.animateHeadlines();
          this.animateEditorialImageMasks();
          this.animateProductGrids();
          this.animateTrustRibbon();
          this.animateCraftsmanshipTimeline();
          this.animateFooter();
          ScrollTrigger.refresh();
          ScrollTrigger.update();
        });
      });
    },

    /**
     * Genomines-style Masked Title & Subtitle Reveals
     */
    animateHeadlines: function () {
      const titles = document.querySelectorAll('.section-title, .section-pretitle, .about-story-reveal');
      titles.forEach(el => {
        gsap.from(el, {
          y: 16,
          duration: 0.7,
          ease: LUXURY_EASE,
          scrollTrigger: {
            trigger: el,
            start: 'top 96%',
            toggleActions: 'play none none none',
            once: true
          }
        });
      });
    },

    /**
     * Editorial Image Mask Reveals
     */
    animateEditorialImageMasks: function () {
      const images = document.querySelectorAll('.cat-showcase-card, .editorial-image-reveal, .about-image-reveal, .lookbook-banner');
      images.forEach((img, i) => {
        gsap.from(img, {
          y: 16,
          duration: 0.7,
          delay: (i % 3) * 0.06,
          ease: LUXURY_EASE,
          scrollTrigger: {
            trigger: img,
            start: 'top 96%',
            toggleActions: 'play none none none',
            once: true
          }
        });
      });
    },

    /**
     * Staggered Product Cards Cascade
     * Uses pure translate3d for zero layout thrashing
     */
    animateProductGrids: function () {
      const grids = document.querySelectorAll('.products-grid');
      grids.forEach(grid => {
        const cards = grid.querySelectorAll('.product-card');
        if (!cards.length) return;

        cards.forEach((card, idx) => {
          gsap.from(card, {
            y: 16,
            duration: 0.55,
            delay: (idx % 4) * 0.05,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 96%',
              toggleActions: 'play none none none',
              once: true
            }
          });
        });
      });
    },

    /**
     * Trust Ribbon Badges
     */
    animateTrustRibbon: function () {
      const items = document.querySelectorAll('.trust-item');
      if (!items.length) return;

      gsap.from(items, {
        y: 14,
        duration: 0.55,
        stagger: 0.05,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: items[0],
          start: 'top 96%',
          toggleActions: 'play none none none',
          once: true
        }
      });
    },

    /**
     * 9-Stage Craftsmanship Documentary Timeline
     */
    animateCraftsmanshipTimeline: function () {
      const craftSection = document.getElementById('craftsmanship-section');
      if (!craftSection) return;

      const steps = craftSection.querySelectorAll('.craft-step-card');
      if (!steps.length) return;

      steps.forEach((step, idx) => {
        gsap.from(step, {
          y: 16,
          duration: 0.55,
          delay: (idx % 3) * 0.05,
          ease: LUXURY_EASE,
          scrollTrigger: {
            trigger: step,
            start: 'top 96%',
            toggleActions: 'play none none none',
            once: true
          }
        });
      });
    },

    /**
     * Editorial Footer Entrance (Safely rendered with CSS to guarantee 100% visibility)
     */
    animateFooter: function () {
      // Footer remains 100% visible at all times with natural CSS styling
      return;
    },

    /**
     * Micro-Interactions (Wishlist pulse, CTA magnetic glow, Add to bag)
     */
    initMicroInteractions: function () {
      // 1. Wishlist Pulse
      document.addEventListener('click', e => {
        const heartBtn = e.target.closest('.card-wishlist-btn');
        if (heartBtn) {
          gsap.fromTo(heartBtn,
            { scale: 0.7 },
            {
              scale: 1.25,
              duration: 0.25,
              ease: SPRING_EASE,
              onComplete: () => {
                gsap.to(heartBtn, { scale: 1, duration: 0.15 });
              }
            }
          );
        }
      });

      // 2. Add to Bag Button Press
      document.addEventListener('click', e => {
        const addBtn = e.target.closest('.card-add-btn, .btn-pdp-add');
        if (addBtn) {
          gsap.fromTo(addBtn,
            { scale: 0.94 },
            {
              scale: 1.04,
              duration: 0.2,
              ease: 'power2.out',
              onComplete: () => {
                gsap.to(addBtn, { scale: 1, duration: 0.15 });
              }
            }
          );
        }
      });

      // 3. Subtle Magnetic Lift on Gold Buttons
      document.addEventListener('mouseover', e => {
        const btn = e.target.closest('.btn-gold, .btn-primary');
        if (btn && !btn.dataset.magnetized) {
          btn.dataset.magnetized = 'true';
          btn.addEventListener('mouseenter', () => {
            gsap.to(btn, { y: -2, duration: 0.2, ease: 'power2.out' });
          });
          btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { y: 0, duration: 0.22, ease: 'power2.out' });
          });
        }
      });
    },

    /**
     * 3D Depth Card Tilt & Specular Light Reflection
     * Subtly responds to cursor coordinate over product and pillar cards
     */
    initCard3DInteractions: function () {
      if (prefersReducedMotion) return;

      let activeCard = null;
      let cardRect = null;
      let isTracking = false;

      document.addEventListener('pointerenter', (e) => {
        const card = e.target.closest && e.target.closest('.product-card, .material-pillar-card');
        if (card) {
          activeCard = card;
          cardRect = card.getBoundingClientRect();
          isTracking = true;
        }
      }, true);

      document.addEventListener('pointermove', (e) => {
        if (!isTracking || !activeCard) return;

        // Ensure sheen layer exists
        let sheen = activeCard.querySelector('.specular-sheen-layer');
        if (!sheen) {
          sheen = document.createElement('div');
          sheen.className = 'specular-sheen-layer';
          activeCard.appendChild(sheen);
        }

        if (!cardRect) cardRect = activeCard.getBoundingClientRect();
        const x = e.clientX - cardRect.left;
        const y = e.clientY - cardRect.top;
        const centerX = cardRect.width / 2;
        const centerY = cardRect.height / 2;

        // Subtle, elegant 3D tilt (max 4 degrees)
        const rotateX = Math.max(-4, Math.min(4, ((y - centerY) / centerY) * -3.5));
        const rotateY = Math.max(-4, Math.min(4, ((x - centerX) / centerX) * 3.5));

        activeCard.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px) scale3d(1.015, 1.015, 1.015)`;

        // Specular highlight gradient follows mouse
        const xPct = Math.max(0, Math.min(100, (x / cardRect.width) * 100));
        const yPct = Math.max(0, Math.min(100, (y / cardRect.height) * 100));
        sheen.style.opacity = '0.45';
        sheen.style.background = `radial-gradient(circle 160px at ${xPct.toFixed(1)}% ${yPct.toFixed(1)}%, rgba(255, 255, 255, 0.38), rgba(212, 175, 55, 0.12) 40%, transparent 80%)`;
      }, { passive: true });

      document.addEventListener('pointerleave', (e) => {
        const card = e.target.closest && e.target.closest('.product-card, .material-pillar-card');
        if (card) {
          card.style.transform = '';
          const sheen = card.querySelector('.specular-sheen-layer');
          if (sheen) sheen.style.opacity = '0';
          if (activeCard === card) {
            activeCard = null;
            cardRect = null;
            isTracking = false;
          }
        }
      }, true);
    },

    /**
     * PDP High-Precision Macro Loupe Zoom
     * Inspects intricate diamond settings and hallmarking on cursor hover
     */
    initPDPMacroInspector: function () {
      if (prefersReducedMotion) return;

      document.addEventListener('pointermove', (e) => {
        const item = e.target.closest && e.target.closest('.pdp-gallery-item');
        if (!item) return;
        const img = item.querySelector('img');
        if (!img) return;

        const rect = item.getBoundingClientRect();
        const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

        img.style.transformOrigin = `${xPct.toFixed(1)}% ${yPct.toFixed(1)}%`;
        if (!item.classList.contains('zooming')) {
          item.classList.add('zooming');
        }
      }, { passive: true });

      document.addEventListener('pointerleave', (e) => {
        const item = e.target.closest && e.target.closest('.pdp-gallery-item');
        if (!item) return;
        const img = item.querySelector('img');
        if (img) {
          img.style.transformOrigin = 'center center';
        }
        item.classList.remove('zooming');
      }, true);
    },

    /**
     * White-Glove Acquisition Toast Notification
     */
    showAddedToast: function (productName) {
      let toast = document.getElementById('hj-cart-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'hj-cart-toast';
        toast.className = 'acquisition-toast';
        toast.innerHTML = `
          <div class="toast-content">
            <span class="toast-gem">✦</span>
            <div class="toast-text-wrap">
              <span class="toast-title">Added to Bag</span>
              <span class="toast-item-name" id="toast-item-label"></span>
            </div>
            <button class="toast-view-btn" onclick="window.HJ.openCart()">View Bag</button>
          </div>
        `;
        document.body.appendChild(toast);
      }

      const label = toast.querySelector('#toast-item-label');
      if (label) label.textContent = productName || 'Fine Jewellery Piece';

      clearTimeout(this.toastTimer);
      toast.classList.add('active');

      if (typeof gsap !== 'undefined') {
        gsap.fromTo(toast,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, ease: LUXURY_EASE }
        );
      }

      this.toastTimer = setTimeout(() => {
        if (typeof gsap !== 'undefined') {
          gsap.to(toast, {
            y: 20,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => toast.classList.remove('active')
          });
        } else {
          toast.classList.remove('active');
        }
      }, 3500);
    },

    /**
     * Smooth Curtain Route Transition
     */
    triggerPageTransition: function (callback) {
      if (prefersReducedMotion) {
        if (callback) callback();
        return;
      }

      const curtain = document.getElementById('route-transition-curtain');
      if (!curtain) {
        if (callback) callback();
        return;
      }

      gsap.to(curtain, {
        opacity: 1,
        pointerEvents: 'auto',
        duration: 0.22,
        ease: 'power2.inOut',
        onComplete: () => {
          if (callback) callback();
          window.scrollTo({ top: 0, behavior: 'instant' });
          gsap.to(curtain, {
            opacity: 0,
            pointerEvents: 'none',
            duration: 0.35,
            delay: 0.05,
            ease: 'power2.out'
          });
        }
      });
    }
  };

  // Expose to window with unified alias
  window.HJ_MOTION = MotionEngine;
  window.HJ_MOTION_DS = MotionEngine; // Backward compatibility with previous calls

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.HJ_MOTION.init());
  } else {
    window.HJ_MOTION.init();
  }

})();
