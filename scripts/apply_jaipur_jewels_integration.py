import re

print("Starting Jaipur Jewels integration...")

# ==================== 1. UPDATE index.html ====================
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add Appointment & Track Order buttons to header right actions
header_actions_target = '<div class="header-right-actions">'
header_actions_replacement = '''<div class="header-right-actions">
          <!-- Jaipur Jewels Inspired Utility Actions -->
          <button class="header-utility-link" onclick="window.HJ.openAppointmentModal()" title="Book Private Consultation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Appointment</span>
          </button>

          <button class="header-utility-link" onclick="window.HJ.openTrackOrderModal()" title="Track Your Consignment">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
            <span>Track Order</span>
          </button>'''

if header_actions_target in html and 'Book Private Consultation' not in html:
    html = html.replace(header_actions_target, header_actions_replacement, 1)
    print("Added Appointment & Track Order to header right actions.")

# Update Announcement Ticker with Appointment & Tracking notices
ticker_target = '<div class="announcement-item">\n        <span class="announcement-sparkle">✦</span>\n        <span>JAIPUR ATELIER & NEW DELHI SALON • WHATSAPP CONCIERGE: +91 63770 61020</span>\n      </div>'
ticker_replacement = '''<div class="announcement-item">
        <span class="announcement-sparkle">✦</span>
        <span>JAIPUR ATELIER & NEW DELHI SALON • PRIVATE SALON SUITE APPOINTMENTS AVAILABLE</span>
      </div>
      <div class="announcement-item">
        <span class="announcement-sparkle">✦</span>
        <span>INSURED ARMORED TRANSIT • REAL-TIME CONSIGNMENT TRACKING ACTIVE</span>
      </div>'''

if ticker_target in html:
    html = html.replace(ticker_target, ticker_replacement, 1)
    print("Updated announcement ticker items.")

# Update Navigation Ribbon with What's New and Jaipur Jewels Categories
nav_target = '<ul class="nav-ribbon-list">'
nav_replacement = '''<ul class="nav-ribbon-list">
          <li><a href="#collections/new-arrivals" class="nav-ribbon-link highlight" style="color: var(--color-royal-lac);">What's New ✦</a></li>
          <li><a href="#collections/rings" class="nav-ribbon-link">Rings</a></li>
          <li><a href="#collections/earrings" class="nav-ribbon-link">Earrings</a></li>
          <li><a href="#collections/necklaces" class="nav-ribbon-link">Necklaces</a></li>
          <li><a href="#collections/bracelets" class="nav-ribbon-link">Bracelets & Bangles</a></li>
          <li><a href="#collections/brooches" class="nav-ribbon-link">Brooches & Pins</a></li>
          <li><a href="#collections/temple-jewellery" class="nav-ribbon-link">Temple Nakshi</a></li>
          <li><a href="#craftsmanship" class="nav-ribbon-link">Craftsmanship</a></li>
          <li><a href="javascript:void(0)" onclick="window.HJ.openAppointmentModal()" class="nav-ribbon-link highlight">Book Appointment</a></li>
          <li><a href="javascript:void(0)" onclick="window.HJ.openTrackOrderModal()" class="nav-ribbon-link">Track Order</a></li>'''

if nav_target in html and 'What\'s New ✦' not in html:
    # Replace first occurrence of nav-ribbon-list opening up to Demifine
    m = re.search(r'<ul class="nav-ribbon-list">.*?<li class="nav-has-mega">', html, re.DOTALL)
    if m:
        html = html[:m.start()] + nav_replacement + '\n          <li class="nav-has-mega">' + html[m.end():]
        print("Updated navigation ribbon with Jaipur Jewels categories & links.")

# Add Appointment Modal, Track Order Modal, and Auth Modal before </body>
modals_html = '''
  <!-- ==================== APPOINTMENT BOOKING MODAL (JAIPUR JEWELS) ==================== -->
  <div id="appointment-modal" style="display: none; position: fixed; inset: 0; background: rgba(24, 20, 18, 0.75); backdrop-filter: blur(4px); z-index: 1050; align-items: center; justify-content: center; padding: 1rem;">
    <div style="background: var(--color-warm-ivory); border: 1px solid var(--color-antique-gold); border-radius: var(--radius-sm); max-width: 560px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2.25rem; box-shadow: 0 20px 50px rgba(0,0,0,0.4); position: relative;">
      <button onclick="window.HJ.closeAppointmentModal()" style="position: absolute; top: 1.25rem; right: 1.25rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-deep-heritage-brown);">&times;</button>
      
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.22em; color: var(--color-antique-gold); font-weight: 600;">Private Atelier Consultation</span>
        <h3 style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--color-deep-heritage-brown); margin: 0.3rem 0;">Book an Appointment</h3>
        <p style="font-size: 0.82rem; color: var(--color-stone-muted);">Experience generational goldsmithing with our senior gemologist in Jaipur, New Delhi, or via private video concierge.</p>
      </div>

      <form id="appointment-form" onsubmit="window.HJ.submitAppointment(event)">
        <div class="form-row-2col" style="margin-bottom: 1rem;">
          <div>
            <label class="form-label" style="font-size: 0.75rem;">Full Name *</label>
            <input type="text" id="apt-name" class="form-input" required placeholder="Your noble name" />
          </div>
          <div>
            <label class="form-label" style="font-size: 0.75rem;">Phone Number *</label>
            <input type="tel" id="apt-phone" class="form-input" required placeholder="+91 98765 43210" />
          </div>
        </div>

        <div style="margin-bottom: 1rem;">
          <label class="form-label" style="font-size: 0.75rem;">Email Address *</label>
          <input type="email" id="apt-email" class="form-input" required placeholder="patron@houseofjewelux.com" />
        </div>

        <div class="form-row-2col" style="margin-bottom: 1rem;">
          <div>
            <label class="form-label" style="font-size: 0.75rem;">Preferred Date *</label>
            <input type="date" id="apt-date" class="form-input" required />
          </div>
          <div>
            <label class="form-label" style="font-size: 0.75rem;">Preferred Time *</label>
            <select id="apt-time" class="form-input" required>
              <option value="11:00 - 12:30 IST">11:00 - 12:30 IST (Morning)</option>
              <option value="14:00 - 15:30 IST">14:00 - 15:30 IST (Afternoon)</option>
              <option value="16:00 - 17:30 IST" selected>16:00 - 17:30 IST (High Tea)</option>
              <option value="18:30 - 20:00 IST">18:30 - 20:00 IST (Evening)</option>
            </select>
          </div>
        </div>

        <div style="margin-bottom: 1rem;">
          <label class="form-label" style="font-size: 0.75rem;">Consultation Experience *</label>
          <select id="apt-type" class="form-input" required>
            <option value="Private Jaipur Atelier Experience">Private Jaipur Atelier Experience (Civil Lines Palace)</option>
            <option value="New Delhi VIP Salon Suite">New Delhi VIP Salon Suite</option>
            <option value="Virtual High-Jewellery Video Concierge">Virtual High-Jewellery Video Concierge</option>
            <option value="Bespoke Wedding & Polki Bridal Suite">Bespoke Wedding & Polki Bridal Suite</option>
          </select>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <label class="form-label" style="font-size: 0.75rem;">Specific Jewellery Interests or Requests</label>
          <textarea id="apt-notes" class="form-input" rows="2" placeholder="e.g. Royal Falcon Brooch, Solitaire bands, uncut polki choker..."></textarea>
        </div>

        <button type="submit" class="btn-primary" style="width: 100%; padding: 0.9rem; font-size: 0.82rem; letter-spacing: 0.15em;">Confirm Salon Reservation</button>
      </form>
      <div id="apt-confirmation" style="display: none;"></div>
    </div>
  </div>

  <!-- ==================== TRACK YOUR ORDER MODAL (JAIPUR JEWELS) ==================== -->
  <div id="track-order-modal" style="display: none; position: fixed; inset: 0; background: rgba(24, 20, 18, 0.75); backdrop-filter: blur(4px); z-index: 1050; align-items: center; justify-content: center; padding: 1rem;">
    <div style="background: var(--color-warm-ivory); border: 1px solid var(--color-antique-gold); border-radius: var(--radius-sm); max-width: 580px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2.25rem; box-shadow: 0 20px 50px rgba(0,0,0,0.4); position: relative;">
      <button onclick="window.HJ.closeTrackOrderModal()" style="position: absolute; top: 1.25rem; right: 1.25rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-deep-heritage-brown);">&times;</button>
      
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.22em; color: var(--color-antique-gold); font-weight: 600;">Real-Time Logistics Telemetry</span>
        <h3 style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--color-deep-heritage-brown); margin: 0.3rem 0;">Track Your Consignment</h3>
        <p style="font-size: 0.82rem; color: var(--color-stone-muted);">Enter your Order ID (e.g. <strong>HJ-ORD-2026-7701</strong>) or registered patron phone number.</p>
      </div>

      <form id="track-form" onsubmit="window.HJ.submitTrackOrder(event)">
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem;">
          <input type="text" id="track-input" class="form-input" style="flex: 1;" placeholder="HJ-ORD-2026-XXXX or +91..." required />
          <button type="submit" class="btn-primary" style="padding: 0.75rem 1.5rem; font-size: 0.8rem; white-space: nowrap;">Track Now</button>
        </div>
      </form>

      <div id="track-result-box" style="display: none;"></div>
    </div>
  </div>
'''

if 'id="appointment-modal"' not in html:
    html = html.replace('</body>', modals_html + '\n</body>')
    print("Added Appointment and Track Order modals to index.html.")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("index.html updated successfully!")
