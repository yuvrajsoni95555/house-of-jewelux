/**
 * HOUSE OF JEWELUX — COMPLETE WEBSITE-WIDE MOTION GRAPHICS ENGINE
 * Inspired by Genomines Editorial Storytelling × Italian Luxury Aesthetics
 * Powered by GSAP & ScrollTrigger
 */

(function () {
  'use strict';

  // Check prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initialize GSAP & ScrollTrigger
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    // Smooth default easing
    gsap.defaults({
      ease: 'power3.out',
      duration: 0.75
    });
  }

  const MotionEngine = {
    initialized: false,

    init: function () {
      if (prefersReducedMotion) {
        document.documentElement.classList.add('reduced-motion');
        console.log('✦ HOUSE OF JEWELUX Motion Engine: Reduced motion enabled.');
        return;
      }

      this.initHeaderMotion();
      this.initMicroInteractions();
      this.refreshTriggers();
      this.initialized = true;
      console.log('✦ HOUSE OF JEWELUX Motion Engine: Live at 120 FPS target.');
    },

    /**
     * Clean up and re-initialize ScrollTriggers when SPA route changes
     */
    refreshTriggers: function () {
      if (prefersReducedMotion || typeof ScrollTrigger === 'undefined') return;

      // Kill previous route triggers to prevent orphaned listeners
      ScrollTrigger.getAll().forEach(t => t.kill());

      // Allow DOM to settle before measuring
      requestAnimationFrame(() => {
        this.animateHeadlines();
        this.animateImageReveals();
        this.animateProductGrids();
        this.animateCategoryCards();
        this.animateCraftsmanshipTimeline();
        // Delegate extended page motion to the unified Motion Design System
        if (window.HJ_MOTION_DS && window.HJ_MOTION_DS.refreshTriggers) {
          window.HJ_MOTION_DS.refreshTriggers();
        }
        ScrollTrigger.refresh();
      });
    },

    /**
     * Header & Navigation Scroll-Aware Interactions
     */
    initHeaderMotion: function () {
      const header = document.querySelector('.site-header');
      if (!header) return;

      let lastScrollY = window.scrollY;

      window.addEventListener('scroll', () => {
        const currentY = window.scrollY;
        if (currentY > 60) {
          header.classList.add('scrolled');
          if (currentY > lastScrollY && currentY > 200) {
            header.classList.add('header-hide');
          } else {
            header.classList.remove('header-hide');
          }
        } else {
          header.classList.remove('scrolled', 'header-hide');
        }
        lastScrollY = currentY;
      }, { passive: true });
    },

    /**
     * Genomines-style Masked Title Reveals
     */
    animateHeadlines: function () {
      const titles = document.querySelectorAll('.section-title, .section-pretitle');
      titles.forEach(el => {
        if (el.dataset.motionBound) return;
        el.dataset.motionBound = 'true';

        gsap.fromTo(el, 
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              toggleActions: 'play none none none'
            }
          }
        );
      });
    },

    /**
     * Editorial Image Mask & Parallax Reveals (clip-path inset)
     */
    animateImageReveals: function () {
      const images = document.querySelectorAll('.cat-showcase-card, .editorial-image-reveal');
      images.forEach((img, i) => {
        if (img.dataset.motionBound) return;
        img.dataset.motionBound = 'true';

        gsap.fromTo(img,
          { clipPath: 'inset(15% 0% 0% 0%)', opacity: 0, y: 25 },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            opacity: 1,
            y: 0,
            duration: 0.9,
            delay: (i % 3) * 0.12,
            ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
            scrollTrigger: {
              trigger: img,
              start: 'top 90%',
              toggleActions: 'play none none none'
            }
          }
        );
      });
    },

    /**
     * Staggered Product Cards Cascade
     */
    animateProductGrids: function () {
      const grids = document.querySelectorAll('.products-grid');
      grids.forEach(grid => {
        const cards = grid.querySelectorAll('.product-card');
        if (!cards.length) return;

        cards.forEach((card, idx) => {
          if (card.dataset.motionBound) return;
          card.dataset.motionBound = 'true';

          gsap.fromTo(card,
            { y: 30, opacity: 0, scale: 0.97 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.65,
              delay: (idx % 4) * 0.08,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 92%',
                toggleActions: 'play none none none'
              }
            }
          );
        });
      });
    },

    /**
     * Category Showcase Grid Animations
     */
    animateCategoryCards: function () {
      const catCards = document.querySelectorAll('.cat-showcase-card');
      catCards.forEach((card, i) => {
        if (card.dataset.animCat) return;
        card.dataset.animCat = 'true';

        gsap.fromTo(card,
          { opacity: 0, y: 35 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: (i % 3) * 0.1,
            ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
              toggleActions: 'play none none none'
            }
          }
        );
      });
    },

    /**
     * 9-Stage Craftsmanship Pinned Storytelling
     */
    animateCraftsmanshipTimeline: function () {
      const craftSection = document.getElementById('craftsmanship-section');
      if (!craftSection) return;

      const steps = craftSection.querySelectorAll('div[style*="background: var(--color-warm-ivory)"]');
      if (!steps.length) return;

      steps.forEach((step, idx) => {
        if (step.dataset.motionBound) return;
        step.dataset.motionBound = 'true';

        gsap.fromTo(step,
          { opacity: 0, y: 30, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            delay: (idx % 3) * 0.12,
            ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
            scrollTrigger: {
              trigger: step,
              start: 'top 85%',
              toggleActions: 'play none none none'
            }
          }
        );
      });
    },

    /**
     * Interactive Micro-Interactions (Buttons, Badges, Wishlist)
     */
    initMicroInteractions: function () {
      // 1. Wishlist Pulse
      document.addEventListener('click', e => {
        const heartBtn = e.target.closest('.card-wishlist-btn');
        if (heartBtn) {
          gsap.fromTo(heartBtn,
            { scale: 0.7 },
            { scale: 1.25, duration: 0.25, ease: 'back.out(2)', onComplete: () => {
              gsap.to(heartBtn, { scale: 1, duration: 0.15 });
            }}
          );
        }
      });

      // 2. Add to Bag Feedback
      document.addEventListener('click', e => {
        const addBtn = e.target.closest('.card-add-btn, .btn-pdp-add');
        if (addBtn) {
          gsap.fromTo(addBtn,
            { scale: 0.95 },
            { scale: 1.04, duration: 0.2, ease: 'power2.out', onComplete: () => {
              gsap.to(addBtn, { scale: 1, duration: 0.15 });
            }}
          );
        }
      });

      // 3. Magnetic Hover on Gold CTAs
      const ctas = document.querySelectorAll('.btn-gold, .btn-primary');
      ctas.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          gsap.to(btn, { y: -2, boxShadow: '0 8px 24px rgba(184, 151, 88, 0.35)', duration: 0.2 });
        });
        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, { y: 0, boxShadow: 'none', duration: 0.25 });
        });
      });
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

  // Expose to window
  window.HJ_MOTION = MotionEngine;

  // Auto-init on DOMContentLoaded
  window.addEventListener('DOMContentLoaded', () => {
    window.HJ_MOTION.init();
  });

})();
