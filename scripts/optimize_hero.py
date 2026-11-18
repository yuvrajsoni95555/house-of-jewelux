with open('hero-cinematic.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update animationLoop
old_loop = """  function animationLoop() {
    if (animationPaused || !isHeroVisible) {
      rafId = requestAnimationFrame(animationLoop);
      return;
    }"""

new_loop = """  function animationLoop() {
    if (animationPaused || !isHeroVisible || !heroContainer || !document.body.contains(heroContainer)) {
      rafId = null;
      return;
    }"""

code = code.replace(old_loop, new_loop)

# 2. Add setupHeroObserver and replace scroll listener
old_scroll_visibility = """  // Track hero viewport visibility via scroll
  function updateHeroVisibility() {
    if (!heroContainer) return;
    const rect = heroContainer.getBoundingClientRect();
    const visible = rect.top < window.innerHeight && rect.bottom > 0;
    if (visible !== isHeroVisible) {
      isHeroVisible = visible;
    }
  }

  window.addEventListener('scroll', updateHeroVisibility, { passive: true });
  window.addEventListener('resize', updateHeroVisibility, { passive: true });"""

new_observer_visibility = """  // Efficient IntersectionObserver replacing scroll event polling
  let heroObserver = null;
  function setupHeroObserver() {
    if (!heroContainer) return;
    if (heroObserver) {
      heroObserver.disconnect();
      heroObserver = null;
    }

    if ('IntersectionObserver' in window) {
      heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isHeroVisible = entry.isIntersecting;
          if (isHeroVisible && !animationPaused) {
            if (rafId === null) {
              rafId = requestAnimationFrame(animationLoop);
            }
          } else {
            if (rafId !== null) {
              cancelAnimationFrame(rafId);
              rafId = null;
            }
          }
        });
      }, { rootMargin: '50px 0px 50px 0px', threshold: 0.02 });
      heroObserver.observe(heroContainer);
    } else {
      isHeroVisible = true;
    }
  }"""

code = code.replace(old_scroll_visibility, new_observer_visibility)

# 3. Call setupHeroObserver in init()
init_call_target = "heroContainer = document.getElementById('cinematic-hero-viewport');"
init_call_replacement = """heroContainer = document.getElementById('cinematic-hero-viewport');
    setupHeroObserver();"""

code = code.replace(init_call_target, init_call_replacement, 1)

with open('hero-cinematic.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("hero-cinematic.js optimized successfully!")
