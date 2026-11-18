/**
 * HOUSE OF JEWELUX — IMMERSIVE CINEMATIC HERO EXPERIENCE
 * "THE JOURNEY OF ETERNAL ELEGANCE"
 * 
 * Features:
 * - 4-Scene Architectural & Jewellery Odyssey (Prelude, Heritage, Creations, Climax)
 * - Canvas 2D Gold Particle & Caustic Ray Simulation (120 FPS adaptive)
 * - Multi-Plane 3D Matrix Perspective & Cursor Parallax
 * - Chapter Timeline Scrubbing (01 PRELUDE, 02 HERITAGE, 03 CREATIONS, 04 CLIMAX)
 * - Web Audio API Synthetic Ambient Harmonic Chime (Muted by default)
 * - Seamless Scroll Dissolve without scroll hijacking
 * - Full Keyboard & Reduced-Motion Accessibility
 */

(function () {
  'use strict';

  let heroContainer = null;
  let canvas = null;
  let ctx = null;
  let rafId = null;
  let particles = [];
  let currentScene = 1;
  let isPlaying = true;
  let isMuted = true;
  let sceneTimer = null;
  let audioCtx = null;

  // Mouse Parallax State
  let targetMouseX = 0;
  let targetMouseY = 0;
  let mouseX = 0;
  let mouseY = 0;

  // Scene Configuration
  const SCENE_DURATIONS = {
    1: 4500, // Atmospheric Opening
    2: 4500, // Royal Jharokha Portals
    3: 5000, // High Jewellery Odyssey
    4: 7000  // Grand Editorial Climax
  };

  /**
   * Initialize Web Audio API Synthesizer (Crystal Singletone Chime)
   */
  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playHarmonicChime(freq = 432) {
    if (isMuted || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 1.2);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 2.5);
    } catch (e) {
      console.warn('Audio chime notice:', e);
    }
  }

  /**
   * Particle System Initialization & Animation
   */
  function initParticles(w, h) {
    particles = [];
    const count = window.innerWidth < 768 ? 24 : 45;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 2.2 + 0.8,
        baseAlpha: Math.random() * 0.45 + 0.25,
        alpha: 0.3,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: -Math.random() * 0.6 - 0.2, // gentle upward float
        pulseSpeed: Math.random() * 0.03 + 0.015,
        pulseOffset: Math.random() * Math.PI * 2,
        color: Math.random() > 0.4 ? 'rgba(218, 185, 128, ' : 'rgba(245, 235, 218, '
      });
    }
  }

  function renderParticles() {
    if (!ctx || !canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Subtle Volumetric Light Beam from Top Right
    const grad = ctx.createRadialGradient(w * 0.85, 0, 10, w * 0.7, h * 0.5, w * 0.8);
    grad.addColorStop(0, 'rgba(218, 185, 128, 0.08)');
    grad.addColorStop(0.5, 'rgba(184, 151, 88, 0.03)');
    grad.addColorStop(1, 'rgba(20, 15, 13, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Render Particles
    const time = Date.now() * 0.001;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.speedX;
      p.y += p.speedY;

      // Wrap around
      if (p.y < -10) p.y = h + 10;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      // Pulsing shimmer
      const pulse = Math.sin(time * 2 + p.pulseOffset) * 0.25;
      const alpha = Math.max(0.05, Math.min(0.85, p.baseAlpha + pulse));

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color + alpha + ')';
      ctx.shadowColor = 'rgba(218, 185, 128, 0.6)';
      ctx.shadowBlur = p.radius * 3;
      ctx.fill();
    }
    ctx.shadowBlur = 0; // reset
  }

  /**
   * Main Render Loop (120 FPS Target with Lerp Mouse Parallax)
   */
  function animationLoop() {
    // Smooth lerp mouse parallax
    mouseX += (targetMouseX - mouseX) * 0.06;
    mouseY += (targetMouseY - mouseY) * 0.06;

    if (heroContainer) {
      const activePlanes = heroContainer.querySelectorAll('.cinematic-scene.active .parallax-plane');
      activePlanes.forEach(plane => {
        const depth = parseFloat(plane.getAttribute('data-depth') || '0.04');
        const moveX = mouseX * depth * 35;
        const moveY = mouseY * depth * 25;
        plane.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      });
    }

    renderParticles();
    rafId = requestAnimationFrame(animationLoop);
  }

  /**
   * Scene Transition Controller
   */
  function goToScene(sceneNum, triggerAudio = true) {
    if (sceneNum < 1) sceneNum = 4;
    if (sceneNum > 4) sceneNum = 1;

    currentScene = sceneNum;
    clearTimeout(sceneTimer);

    if (!heroContainer) return;

    // Update Scene Visibility
    const allScenes = heroContainer.querySelectorAll('.cinematic-scene');
    allScenes.forEach(s => {
      s.classList.remove('active');
      const num = parseInt(s.getAttribute('data-scene'), 10);
      if (num === currentScene) {
        s.classList.add('active');
      }
    });

    // Update Chapter Indicators
    const indicators = heroContainer.querySelectorAll('.chapter-indicator-dot');
    indicators.forEach(dot => {
      const targetNum = parseInt(dot.getAttribute('data-target-scene'), 10);
      if (targetNum === currentScene) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Update Chapter Label
    const label = heroContainer.querySelector('#hero-chapter-name');
    if (label) {
      const names = {
        1: '01 • THE PRELUDE',
        2: '02 • ROYAL HERITAGE',
        3: '03 • BENCH MASTERPIECES',
        4: '04 • ETERNAL CLIMAX'
      };
      label.textContent = names[currentScene] || '';
    }

    if (triggerAudio) {
      const freqs = { 1: 396, 2: 432, 3: 528, 4: 639 };
      playHarmonicChime(freqs[currentScene] || 432);
    }

    // Schedule next scene if playing
    if (isPlaying) {
      sceneTimer = setTimeout(() => {
        goToScene(currentScene + 1, true);
      }, SCENE_DURATIONS[currentScene] || 5000);
    }
  }

  /**
   * Construct and Mount the Hero DOM
   */
  function mountHero() {
    const existingHero = document.getElementById('hero-slider');
    if (!existingHero) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    existingHero.innerHTML = `
      <div id="cinematic-hero-viewport" class="cinematic-hero-viewport">
        <!-- Canvas Background Simulation -->
        <canvas id="hero-particle-canvas" class="hero-particle-canvas"></canvas>

        <!-- Ambient Luxury Dark Gradient -->
        <div class="hero-cinematic-backdrop"></div>

        <!-- ==================== SCENE 01: THE ATMOSPHERIC PRELUDE ==================== -->
        <div class="cinematic-scene active" data-scene="1">
          <div class="scene-content-center parallax-plane" data-depth="0.03">
            <div class="opening-emblem-wrap">
              <img src="/brand-identity/jewelux-official-emblem.png" alt="House of Jewelux Royal Monogram" class="opening-monogram-img" />
              <div class="specular-light-sweep"></div>
            </div>
            <div class="opening-brand-sub">
              <span class="sparkle-diamond">✦</span>
              <span>JAIPUR ATELIER • ESTABLISHED 1926</span>
              <span class="sparkle-diamond">✦</span>
            </div>
            <h2 class="opening-cinematic-title">The Journey of Eternal Elegance</h2>
            <div class="opening-scroll-hint">
              <span>Entering the Haute Joaillerie Sanctum</span>
            </div>
          </div>
        </div>

        <!-- ==================== SCENE 02: THE ROYAL JHAROKHA PORTALS ==================== -->
        <div class="cinematic-scene" data-scene="2">
          <!-- Carved Architectural Arches (Multi-Plane Depth) -->
          <div class="jharokha-portal-left parallax-plane" data-depth="0.08"></div>
          <div class="jharokha-portal-right parallax-plane" data-depth="0.08"></div>

          <div class="scene-content-center parallax-plane" data-depth="0.04" style="z-index: 4;">
            <span class="scene-micro-badge">✦ Indian Architectural Sanctum</span>
            <h2 class="scene-editorial-heading">Generational Royal Craftsmanship</h2>
            <p class="scene-editorial-desc">
              Inspired by the carved sandstone pavilions of Rajasthan and centuries of sacred bench goldsmithing in Jaipur.
            </p>
            <div style="margin-top: 1.5rem;">
              <button onclick="window.HJ_HERO.goToScene(3)" class="btn-outline" style="border-color: var(--color-antique-gold); color: var(--color-warm-ivory);">
                Behold the Creations →
              </button>
            </div>
          </div>
        </div>

        <!-- ==================== SCENE 03: HIGH JEWELLERY ODYSSEY ==================== -->
        <div class="cinematic-scene" data-scene="3">
          <div class="jewellery-trio-stage parallax-plane" data-depth="0.05">
            <!-- 1. Falcon Brooch -->
            <div class="macro-jewel-card" onclick="window.HJ.navigate('products/the-sovereign-crest-royal-falcon-brooch-hj-bro-001')">
              <div class="macro-jewel-img-box">
                <img src="images/user_falcon_brooch_white.jpg" alt="The Sovereign Falcon Crest Brooch" />
                <span class="macro-jewel-tag">Haute Heraldry</span>
              </div>
              <div class="macro-jewel-info">
                <div class="macro-jewel-title">The Sovereign Falcon</div>
                <div class="macro-jewel-sub">Zambian Emerald & Pavé Wings</div>
              </div>
            </div>

            <!-- 2. Lumina Drops -->
            <div class="macro-jewel-card featured" onclick="window.HJ.navigate('products/the-lumina-teardrop-solitaire-earrings-hj-ear-001')">
              <div class="macro-jewel-img-box">
                <img src="images/authentic_earrings_macro.jpg" alt="The Lumina Teardrop Solitaires" />
                <span class="macro-jewel-tag">Solitaire Brilliance</span>
              </div>
              <div class="macro-jewel-info">
                <div class="macro-jewel-title">The Lumina Teardrop</div>
                <div class="macro-jewel-sub">VVS1 Hearts & Arrows Solitaire</div>
              </div>
            </div>

            <!-- 3. Balaji Nakshi Medallion -->
            <div class="macro-jewel-card" onclick="window.HJ.navigate('collections/temple-jewellery')">
              <div class="macro-jewel-img-box">
                <img src="images/user_balaji_temple_pendant.jpg" alt="Sacred Balaji Temple Nakshi" />
                <span class="macro-jewel-tag">Sacred Nakshi</span>
              </div>
              <div class="macro-jewel-info">
                <div class="macro-jewel-title">Balaji Sacred Temple</div>
                <div class="macro-jewel-sub">Hand-Chiseled 925 Silver & 22K Gold</div>
              </div>
            </div>
          </div>

          <div style="position: absolute; bottom: 4.5rem; width: 100%; text-align: center; z-index: 5;">
            <button onclick="window.HJ_HERO.goToScene(4)" class="btn-gold" style="padding: 0.75rem 2rem; font-size: 0.78rem;">
              Enter The Grand Climax ✦
            </button>
          </div>
        </div>

        <!-- ==================== SCENE 04: THE GRAND HERO REVEAL ==================== -->
        <div class="cinematic-scene" data-scene="4">
          <img src="images/user_flagship_hero_model.jpg" alt="House of Jewelux Editorial Campaign" class="grand-hero-campaign-bg parallax-plane" data-depth="0.02" />
          <div class="grand-hero-gradient-overlay"></div>

          <div class="container" style="position: relative; height: 100%; display: flex; align-items: center; z-index: 4;">
            <div class="hero-content parallax-plane" data-depth="0.04">
              <div class="hero-grand-logo-wrap">
                <img src="/brand-identity/house_of_jewelux_horizontal_logo.png" alt="HOUSE OF JEWELUX" style="height: 48px; width: auto; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.6));" />
              </div>
              <span class="hero-badge-pill" style="margin-top: 1rem;">✦ Indian Royal Heritage • Stamped BIS 925</span>
              <h1 class="hero-title" style="font-size: 3.4rem; line-height: 1.1; margin: 0.6rem 0 1rem;">
                An Art of Elegance.<br>A Legacy of Eternity.
              </h1>
              <p class="hero-subtitle" style="max-width: 540px; font-size: 0.95rem; color: #E8E2D8; line-height: 1.65; margin-bottom: 2rem;">
                Generationally forged in our Jaipur atelier with solid 925 sterling silver, liquid platinum-rhodium, and 18K champagne gold. Where royal Indian artistry meets Italian luxury editorial clarity.
              </p>
              <div class="hero-ctas">
                <a href="#collections/all" class="btn-gold">Explore Collections</a>
                <button onclick="window.HJ.openAppointmentModal()" class="btn-outline">Book Private Atelier Appointment</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== HUD INTERACTIVE CONTROLS ==================== -->
        <!-- Top Right Controls: Sound, Play/Pause, Skip -->
        <div class="hero-hud-top-right">
          <button id="hero-audio-btn" class="hud-pill-btn" onclick="window.HJ_HERO.toggleAudio()" title="Toggle Ambient Harmonic Sound">
            <svg id="hero-sound-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
            <span id="hero-audio-label">Sound Muted</span>
          </button>

          <button id="hero-play-btn" class="hud-pill-btn" onclick="window.HJ_HERO.togglePlay()" title="Play / Pause Experience">
            <span id="hero-play-icon">⏸</span>
          </button>

          <button class="hud-pill-btn skip-btn" onclick="window.HJ_HERO.skipToBoutique()" title="Skip directly to Catalogue">
            <span>Skip to Boutique ▾</span>
          </button>
        </div>

        <!-- Bottom Left Chapter Timeline -->
        <div class="hero-hud-bottom-left">
          <div class="chapter-timeline-wrap">
            <div id="hero-chapter-name" class="chapter-active-label">01 • THE PRELUDE</div>
            <div class="chapter-dots-row">
              <button class="chapter-indicator-dot active" data-target-scene="1" onclick="window.HJ_HERO.goToScene(1)"></button>
              <button class="chapter-indicator-dot" data-target-scene="2" onclick="window.HJ_HERO.goToScene(2)"></button>
              <button class="chapter-indicator-dot" data-target-scene="3" onclick="window.HJ_HERO.goToScene(3)"></button>
              <button class="chapter-indicator-dot" data-target-scene="4" onclick="window.HJ_HERO.goToScene(4)"></button>
            </div>
          </div>
        </div>

        <!-- Bottom Center Scroll Invitation -->
        <div class="hero-scroll-prompt" onclick="window.HJ_HERO.skipToBoutique()">
          <span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600;">Scroll To Explore</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M7 10L12 15L17 10"></path>
          </svg>
        </div>
      </div>
    `;

    heroContainer = document.getElementById('cinematic-hero-viewport');
    canvas = document.getElementById('hero-particle-canvas');
    if (canvas) {
      ctx = canvas.getContext('2d');
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
    }

    // Attach Mouse Parallax
    if (!prefersReducedMotion && heroContainer) {
      heroContainer.addEventListener('mousemove', e => {
        const rect = heroContainer.getBoundingClientRect();
        targetMouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        targetMouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      });

      heroContainer.addEventListener('mouseleave', () => {
        targetMouseX = 0;
        targetMouseY = 0;
      });
    }

    // Start Particle Animation & First Scene
    if (!prefersReducedMotion) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(animationLoop);

      // Check URL for direct scene parameter (e.g. #scene=3 or ?scene=3)
      const urlParams = new URLSearchParams(window.location.search);
      const urlScene = parseInt(urlParams.get('scene') || (window.location.hash.match(/scene=(\d)/) || [])[1], 10);

      goToScene(urlScene && urlScene >= 1 && urlScene <= 4 ? urlScene : 1, false);
    } else {
      // Reduced motion fallback directly to Scene 04
      goToScene(4, false);
    }
  }

  function resizeCanvas() {
    if (!canvas || !heroContainer) return;
    canvas.width = heroContainer.clientWidth;
    canvas.height = heroContainer.clientHeight;
    initParticles(canvas.width, canvas.height);
  }

  // Public Interface for window.HJ_HERO
  window.HJ_HERO = {
    init: mountHero,
    goToScene: goToScene,

    togglePlay: function () {
      isPlaying = !isPlaying;
      const icon = document.getElementById('hero-play-icon');
      if (icon) icon.textContent = isPlaying ? '⏸' : '▶';

      if (isPlaying) {
        goToScene(currentScene, false);
      } else {
        clearTimeout(sceneTimer);
      }
    },

    toggleAudio: function () {
      initAudio();
      isMuted = !isMuted;
      const label = document.getElementById('hero-audio-label');
      const icon = document.getElementById('hero-sound-icon');

      if (label) label.textContent = isMuted ? 'Sound Muted' : 'Sound On ✦';
      if (icon) {
        icon.innerHTML = isMuted
          ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>'
          : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
      }

      if (!isMuted) {
        playHarmonicChime(528);
      }
    },

    skipToBoutique: function () {
      const nextSection = document.querySelector('.trust-ribbon') || document.querySelector('.category-circles-section');
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollBy({ top: 750, behavior: 'smooth' });
      }
    }
  };

  // Keyboard navigation
  window.addEventListener('keydown', e => {
    if (!heroContainer) return;
    if (e.key === 'ArrowRight') {
      window.HJ_HERO.goToScene(currentScene + 1);
    } else if (e.key === 'ArrowLeft') {
      window.HJ_HERO.goToScene(currentScene - 1);
    } else if (e.key === ' ' && e.target === document.body) {
      e.preventDefault();
      window.HJ_HERO.togglePlay();
    } else if (e.key === 'Escape') {
      window.HJ_HERO.skipToBoutique();
    }
  });

})();
