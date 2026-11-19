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
        gsap.fromTo(el,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: LUXURY_EASE,
            scrollTrigger: {
              trigger: el,
              start: 'top 96%',
              toggleActions: 'play none none none',
              once: true
            }
          }
        );
      });
    },

    /**
     * Editorial Image Mask Reveals (clip-path inset with subtle Y glide)
     */
    animateEditorialImageMasks: function () {
      const images = document.querySelectorAll('.cat-showcase-card, .editorial-image-reveal, .about-image-reveal, .lookbook-banner');
      images.forEach((img, i) => {
        gsap.fromTo(img,
          { clipPath: 'inset(10% 0% 0% 0%)', opacity: 0, y: 16 },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            opacity: 1,
            y: 0,
            duration: 0.85,
            delay: (i % 3) * 0.08,
            ease: LUXURY_EASE,
            scrollTrigger: {
              trigger: img,
              start: 'top 96%',
              toggleActions: 'play none none none',
              once: true
            }
          }
        );
      });
    },

    /**
     * Staggered Product Cards Cascade
     * Uses pure translate3d and opacity for zero layout thrashing
     */
    animateProductGrids: function () {
      const grids = document.querySelectorAll('.products-grid');
      grids.forEach(grid => {
        const cards = grid.querySelectorAll('.product-card');
        if (!cards.length) return;

        cards.forEach((card, idx) => {
          gsap.fromTo(card,
            { y: 20, opacity: 0, scale: 0.98 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.6,
              delay: (idx % 4) * 0.06,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 96%',
                toggleActions: 'play none none none',
                once: true
              }
            }
          );
        });
      });
    },

    /**
     * Trust Ribbon Badges
     */
    animateTrustRibbon: function () {
      const items = document.querySelectorAll('.trust-item');
      if (!items.length) return;

      gsap.fromTo(items,
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.06,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: items[0],
            start: 'top 96%',
            toggleActions: 'play none none none',
            once: true
          }
        }
      );
    },

    /**
     * 9-Stage Craftsmanship Documentary Timeline
     */
    animateCraftsmanshipTimeline: function () {
      const craftSection = document.getElementById('craftsmanship-section');
      if (!craftSection) return;

      const steps = craftSection.querySelectorAll('.craft-step-card, div[style*="background: var(--color-warm-ivory)"]');
      if (!steps.length) return;

      steps.forEach((step, idx) => {
        gsap.fromTo(step,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            delay: (idx % 3) * 0.06,
            ease: LUXURY_EASE,
            scrollTrigger: {
              trigger: step,
              start: 'top 96%',
              toggleActions: 'play none none none',
              once: true
            }
          }
        );
      });
    },

    /**
     * Editorial Footer Entrance
     */
    animateFooter: function () {
      const footer = document.querySelector('.site-footer');
      if (!footer) return;

      const cols = footer.querySelectorAll('.footer-col, .footer-bottom-row');
      if (!cols.length) return;

      gsap.fromTo(cols,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footer,
            start: 'top 92%',
            toggleActions: 'play none none none',
            once: true
          }
        }
      );
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
