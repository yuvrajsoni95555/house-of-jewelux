import os
import re

print("=== UNIFYING ALL CATEGORIES INTO MASTER COLLECTION ===")

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace category nav ribbon
old_nav_pattern = r'<nav class="nav-ribbon" aria-label="Product Categories">.*?</nav>'
new_nav = """<nav class="nav-ribbon" aria-label="Product Categories">
      <div class="container">
        <ul class="nav-ribbon-list">
          <li><a href="#collections/new-arrivals" class="nav-ribbon-link highlight" style="color: var(--color-royal-lac);">What's New ✦</a></li>
          <li class="nav-has-mega">
            <a href="#collections/all" class="nav-ribbon-link" style="font-weight: 600;">The Jewellery Collection ▾</a>
            <div class="mega-menu">
              <div>
                <div class="mega-col-title">Earrings & Neckpieces</div>
                <ul class="mega-links">
                  <li><a href="#collections/earrings">Earrings Suite (Drops & Studs)</a></li>
                  <li><a href="#collections/necklaces">Necklaces & Haute Chokers</a></li>
                  <li><a href="#collections/all">View All Neck & Ear Suites</a></li>
                </ul>
              </div>
              <div>
                <div class="mega-col-title">Rings & Wrists</div>
                <ul class="mega-links">
                  <li><a href="#collections/rings">Solitaire & Couple Rings</a></li>
                  <li><a href="#collections/bracelets">Bracelets & Royal Bangles</a></li>
                  <li><a href="#collections/all">View All Hands & Bands</a></li>
                </ul>
              </div>
              <div>
                <div class="mega-col-title">Heritage & Royal Accents</div>
                <ul class="mega-links">
                  <li><a href="#collections/brooches">Royal Falcon Brooches & Pins</a></li>
                  <li><a href="#collections/temple-jewellery">Temple Nakshi Heritage Edit</a></li>
                  <li><a href="#collections/all" style="font-weight: 700; color: var(--color-antique-gold);">✦ View Complete Haute Vault (50 Pieces)</a></li>
                </ul>
              </div>
              <div class="mega-featured">
                <img src="images/authentic_earrings_macro.jpg" alt="House of Jewelux Master Collection" />
                <span style="font-family: var(--font-serif); font-size: 0.8rem; font-weight: 700;">The Haute Joaillerie Vault</span>
                <a href="#collections/all" class="btn-primary" style="margin-top: 0.5rem; padding: 0.35rem 0.75rem; font-size: 0.68rem;">Explore All Together</a>
              </div>
            </div>
          </li>
          <li><a href="#collections/temple-jewellery" class="nav-ribbon-link">Temple Nakshi</a></li>
          <li><a href="#craftsmanship" class="nav-ribbon-link">Craftsmanship</a></li>
          <li><a href="javascript:void(0)" onclick="window.HJ.openAppointmentModal()" class="nav-ribbon-link highlight">Book Appointment</a></li>
          <li><a href="javascript:void(0)" onclick="window.HJ.openTrackOrderModal()" class="nav-ribbon-link">Track Order</a></li>
          <li><a href="#collections/all" class="nav-ribbon-link" style="color: var(--color-antique-gold); font-weight: 700;">Shop All (50 Pieces)</a></li>
        </ul>
      </div>
    </nav>"""

html = re.sub(old_nav_pattern, new_nav, html, flags=re.DOTALL)

# Update mobile drawer
old_mobile_list = """      <ul style="list-style: none; display: flex; flex-direction: column; gap: 1rem;">
        <li><a href="#collections/earrings" onclick="window.HJ.closeCart()" style="font-family: var(--font-serif); font-size: 1.1rem; font-weight: 600;">✦ Earrings Collection</a></li>
        <li><a href="#collections/rings" onclick="window.HJ.closeCart()" style="font-family: var(--font-serif); font-size: 1.1rem; font-weight: 600;">✦ Rings & Solitaires</a></li>
        <li><a href="#collections/necklaces" onclick="window.HJ.closeCart()" style="font-family: var(--font-serif); font-size: 1.1rem; font-weight: 600;">✦ Necklaces & Chokers</a></li>
        <li><a href="#collections/bracelets" onclick="window.HJ.closeCart()" style="font-family: var(--font-serif); font-size: 1.1rem; font-weight: 600;">✦ Bracelets & Cuffs</a></li>
        <li><a href="#collections/brooches" onclick="window.HJ.closeCart()" style="font-family: var(--font-serif); font-size: 1.1rem; font-weight: 600;">✦ Brooches & Pins</a></li>
        <li><a href="#collections/temple-jewellery" onclick="window.HJ.closeCart()" style="font-family: var(--font-serif); font-size: 1.1rem; font-weight: 600;">✦ Temple Nakshi Heritage</a></li>"""

new_mobile_list = """      <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.85rem;">
        <li><a href="#collections/all" onclick="window.HJ.closeCart()" style="font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: var(--color-antique-gold);">✦ The Complete Jewellery Collection (All Pieces)</a></li>
        <li><a href="#collections/earrings" onclick="window.HJ.closeCart()" style="font-family: var(--font-serif); font-size: 0.95rem; font-weight: 500; padding-left: 0.75rem; color: var(--color-charcoal);">— Earrings Suite</a></li>
        <li><a href="#collections/rings" onclick="window.HJ.closeCart()" style="font-family: var(--font-serif); font-size: 0.95rem; font-weight: 500; padding-left: 0.75rem; color: var(--color-charcoal);">— Rings & Solitaires</a></li>
        <li><a href="#collections/necklaces" onclick="window.HJ.closeCart()" style="font-family: var(--font-serif); font-size: 0.95rem; font-weight: 500; padding-left: 0.75rem; color: var(--color-charcoal);">— Necklaces & Chokers</a></li>
        <li><a href="#collections/bracelets" onclick="window.HJ.closeCart()" style="font-family: var(--font-serif); font-size: 0.95rem; font-weight: 500; padding-left: 0.75rem; color: var(--color-charcoal);">— Bracelets & Cuffs</a></li>
        <li><a href="#collections/brooches" onclick="window.HJ.closeCart()" style="font-family: var(--font-serif); font-size: 0.95rem; font-weight: 500; padding-left: 0.75rem; color: var(--color-charcoal);">— Brooches & Pins</a></li>
        <li><a href="#collections/temple-jewellery" onclick="window.HJ.closeCart()" style="font-family: var(--font-serif); font-size: 0.95rem; font-weight: 500; padding-left: 0.75rem; color: var(--color-charcoal);">— Temple Nakshi Heritage</a></li>"""

html = html.replace(old_mobile_list, new_mobile_list)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated index.html navigation!")

# 2. Update app.js
with open('app.js', 'r', encoding='utf-8') as f:
    app = f.read()

# Update router in app.js
old_route_match = """    } else if (route.startsWith('collections/')) {
      const colId = route.split('/')[1] || 'all';
      renderCollectionPage(appView, colId);"""

new_route_match = """    } else if (route === 'collections' || route === 'shop' || route === 'all' || route.startsWith('collections/')) {
      const colId = route.startsWith('collections/') ? (route.split('/')[1] || 'all') : 'all';
      renderCollectionPage(appView, colId);"""

app = app.replace(old_route_match, new_route_match)

# Update renderCollectionPage header defaults
old_col_defaults = """    let filtered = [...state.products];
    let title = "Earrings";
    let subtitle = "Statement for every occasion";
    let heroImg = "images/authentic_earrings_stone.jpg";

    if (collectionId !== 'all') {"""

new_col_defaults = """    let filtered = [...state.products];
    let title = "The Complete Haute Joaillerie Vault";
    let subtitle = "All 50 Masterpieces • Rings • Earrings • Necklaces • Bracelets • Royal Brooches • Temple Nakshi";
    let heroImg = "images/user_flagship_hero_model.jpg";

    if (collectionId && collectionId !== 'all' && collectionId !== 'all-jewellery') {"""

app = app.replace(old_col_defaults, new_col_defaults)

# Update filter pills in app.js
old_pills = """              <div class="filter-pills-row">
                <button class="filter-pill ${collectionId === 'earrings' ? 'active' : ''}" onclick="window.HJ.navigate('collections/earrings')">Earrings</button>
                <button class="filter-pill ${collectionId === 'rings' ? 'active' : ''}" onclick="window.HJ.navigate('collections/rings')">Rings</button>
                <button class="filter-pill ${collectionId === 'necklaces' ? 'active' : ''}" onclick="window.HJ.navigate('collections/necklaces')">Necklaces</button>
                <button class="filter-pill ${collectionId === 'bracelets' ? 'active' : ''}" onclick="window.HJ.navigate('collections/bracelets')">Bracelets</button>
                <button class="filter-pill ${collectionId === 'brooches' ? 'active' : ''}" onclick="window.HJ.navigate('collections/brooches')">Brooches</button>
              </div>"""

new_pills = """              <div class="filter-pills-row">
                <button class="filter-pill ${(!collectionId || collectionId === 'all') ? 'active' : ''}" onclick="window.HJ.navigate('collections/all')">All Creations (${state.products.length})</button>
                <button class="filter-pill ${collectionId === 'rings' ? 'active' : ''}" onclick="window.HJ.navigate('collections/rings')">Rings</button>
                <button class="filter-pill ${collectionId === 'earrings' ? 'active' : ''}" onclick="window.HJ.navigate('collections/earrings')">Earrings</button>
                <button class="filter-pill ${collectionId === 'necklaces' ? 'active' : ''}" onclick="window.HJ.navigate('collections/necklaces')">Necklaces</button>
                <button class="filter-pill ${collectionId === 'bracelets' ? 'active' : ''}" onclick="window.HJ.navigate('collections/bracelets')">Bracelets & Bangles</button>
                <button class="filter-pill ${collectionId === 'brooches' ? 'active' : ''}" onclick="window.HJ.navigate('collections/brooches')">Brooches & Pins</button>
                <button class="filter-pill ${collectionId === 'temple-jewellery' ? 'active' : ''}" onclick="window.HJ.navigate('collections/temple-jewellery')">Temple Nakshi</button>
              </div>"""

app = app.replace(old_pills, new_pills)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app)

print("Updated app.js collection logic & unified filters!")
