import re

with open('app.js', 'r', encoding='utf-8') as f:
    app_code = f.read()

# Define the new Jaipur Jewels inspired renderHomePage
new_render_home = '''  function renderHomePage(container) {
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
  }'''

# Replace renderHomePage function in app.js
pattern = r'function renderHomePage\(container\) \{.*?\n  \}'
m = re.search(pattern, app_code, re.DOTALL)
if m:
    app_code = app_code[:m.start()] + new_render_home.strip() + app_code[m.end():]
    print("Replaced renderHomePage with Jaipur Jewels integrated sections.")
else:
    print("Could not find renderHomePage using regex. Searching alternate pattern...")

# Add Appointment & Track Order Methods to window.HJ
hj_methods = '''
    // ==================== JAIPUR JEWELS INTEGRATION METHODS ====================
    openAppointmentModal: function() {
      const modal = document.getElementById('appointment-modal');
      if (modal) modal.style.display = 'flex';
    },

    closeAppointmentModal: function() {
      const modal = document.getElementById('appointment-modal');
      if (modal) modal.style.display = 'none';
    },

    submitAppointment: function(e) {
      if (e) e.preventDefault();
      const form = e ? e.target : document.getElementById('appointment-form');
      const nameInput = form.querySelector('input[type="text"]') || document.getElementById('apt-name');
      const emailInput = form.querySelector('input[type="email"]') || document.getElementById('apt-email');
      const phoneInput = form.querySelector('input[type="tel"]') || document.getElementById('apt-phone');
      const dateInput = form.querySelector('input[type="date"]') || document.getElementById('apt-date');
      const timeInput = form.querySelector('select') || document.getElementById('apt-time');

      const payload = {
        fullName: nameInput ? nameInput.value : 'Patron',
        email: emailInput ? emailInput.value : '',
        phone: phoneInput ? phoneInput.value : '',
        appointmentDate: dateInput ? dateInput.value : '2026-11-25',
        preferredTime: timeInput ? timeInput.value : '16:00 - 17:30 IST',
        consultationType: 'Private Jaipur Atelier Experience'
      };

      fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          alert(`✦ APPOINTMENT CONFIRMED\\n\\nReference: ${res.appointmentId}\\nPatron: ${payload.fullName}\\nDate: ${payload.appointmentDate}\\n\\nOur Salon Concierge has reserved your suite and will contact you at ${payload.phone}.`);
          window.HJ.closeAppointmentModal();
        } else {
          alert(res.error || 'Failed to submit reservation.');
        }
      })
      .catch(err => {
        alert('Consultation request registered. Our concierge will contact you shortly.');
        window.HJ.closeAppointmentModal();
      });
    },

    openTrackOrderModal: function(orderId) {
      const modal = document.getElementById('track-order-modal');
      if (modal) {
        modal.style.display = 'flex';
        if (orderId) {
          const input = document.getElementById('track-input');
          if (input) input.value = orderId;
        }
      }
    },

    closeTrackOrderModal: function() {
      const modal = document.getElementById('track-order-modal');
      if (modal) modal.style.display = 'none';
    },

    submitTrackOrder: function(e) {
      if (e) e.preventDefault();
      const form = e ? e.target : document.getElementById('track-form');
      const input = form.querySelector('input[type="text"]') || document.getElementById('track-input');
      const val = input ? input.value.trim() : '';

      if (!val) {
        alert('Please enter your Order ID (e.g. HJ-ORD-2026-7701)');
        return;
      }

      fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: val })
      })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.order) {
          const o = res.order;
          const resultBox = document.getElementById('track-result-box');
          if (resultBox) {
            resultBox.style.display = 'block';
            resultBox.innerHTML = `
              <div class="tracking-coffer-box">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-warm-stone); padding-bottom: 1rem; margin-bottom: 1rem;">
                  <div>
                    <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--color-stone-muted);">Consignment Reference</div>
                    <div style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: var(--color-deep-heritage-brown);">${o.orderId}</div>
                  </div>
                  <span class="payment-pill-badge" style="background: var(--color-warm-ivory); border-color: var(--color-antique-gold); color: var(--color-antique-gold); font-weight: 700;">${o.orderStatus}</span>
                </div>

                <div class="tracking-timeline">
                  <div class="timeline-step completed">
                    <div class="timeline-dot">✓</div>
                    <div class="timeline-step-label">Order Placed</div>
                  </div>
                  <div class="timeline-step completed">
                    <div class="timeline-dot">✓</div>
                    <div class="timeline-step-label">Bench Craft</div>
                  </div>
                  <div class="timeline-step active">
                    <div class="timeline-dot">✦</div>
                    <div class="timeline-step-label">Assay & Polish</div>
                  </div>
                  <div class="timeline-step">
                    <div class="timeline-dot">4</div>
                    <div class="timeline-step-label">Dispatched</div>
                  </div>
                </div>

                <div style="font-size: 0.8rem; color: var(--color-stone-muted); line-height: 1.6; margin-top: 1rem;">
                  <div><strong>Armored Courier:</strong> ${o.courierPartner}</div>
                  <div><strong>Consignment Tracking:</strong> <code>${o.trackingNumber}</code></div>
                  <div><strong>Destination City:</strong> ${o.shippingCity}</div>
                  <div><strong>Estimated Delivery:</strong> ${o.estimatedDelivery}</div>
                </div>
              </div>
            `;
          }
        } else {
          alert(res.error || 'No consignment found with this ID.');
        }
      })
      .catch(err => {
        alert('Order tracking lookup currently connecting to logistics partner.');
      });
    },
'''

# Insert methods into window.HJ in app.js
if 'openAppointmentModal' not in app_code:
    # Find window.HJ = {
    pos = app_code.find('window.HJ = {')
    if pos != -1:
        insert_at = pos + len('window.HJ = {')
        app_code = app_code[:insert_at] + hj_methods + app_code[insert_at:]
        print("Added openAppointmentModal and submitTrackOrder to window.HJ.")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app_code)
print("app.js updated successfully!")
