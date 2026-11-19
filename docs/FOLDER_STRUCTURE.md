# HOUSE OF JEWELUX — FOLDER STRUCTURE SPECIFICATION

```
houseofjewelux/
├── server/                        # Modular Node.js Express Backend Architecture
│   ├── config/                    # Centralized environment configuration & validation
│   │   └── index.js
│   ├── controllers/               # Isolated domain business logic
│   │   ├── adminController.js     # Admin verification, analytics, visual editor sync
│   │   ├── appointmentController.js # Concierge salon booking & calendar sync
│   │   ├── authController.js      # Customer authentication & password recovery
│   │   ├── newsletterController.js # Circle subscription handling
│   │   ├── orderController.js     # Cart recalculation, order creation & consignment tracking
│   │   └── productController.js   # Catalog query, multi-material filtering, single PDP
│   ├── db/                        # Data access layer
│   │   └── jsonDb.js              # Resilient JSON reading, writing & seeding
│   ├── middleware/                # Cross-cutting concerns
│   │   ├── errorHandler.js        # Centralized error handler & 404 fallback
│   │   └── security.js            # Security headers & reverse proxy HTTPS redirection
│   ├── routes/                    # API route definitions
│   │   └── api.js                 # Unified REST router mounted at /api
│   └── app.js                     # Express application factory & middleware setup
│
├── data/                          # Persistent JSON Datastores
│   ├── appointments.json          # Atelier salon reservations
│   ├── categories.json            # 26 Curated jewellery categories & banners
│   ├── coupons.json               # Privilege codes & discount percentages
│   ├── customers.json             # Registered patrons (with hashed credentials)
│   ├── orders.json                # Complete order history with consignment telemetry
│   ├── page_overrides.json        # Visual editor content overrides
│   ├── products.json              # 50 Authentic jewellery pieces with specifications
│   ├── storeConfig.json           # Live store metadata & announcements
│   └── subscribers.json           # Newsletter subscriber circle
│
├── images/                        # High-Resolution Photography & Creative Assets
│   ├── authentic_*.jpg            # Studio catalog & macro jewelry photos
│   └── pillars/                   # Royal Crimson Velvet Editorial Cards (@2x Retina)
│
├── brand-identity/                # Official brand emblems & vector graphics
├── scripts/                       # Automated Quality Assurance & Testing Suites
│   ├── test_all_apis.py           # Automated API regression test suite (22 endpoints)
│   ├── audit_assets_and_data.py   # Catalog data & image integrity audit
│   ├── multi_route_visual_qa.py   # Headless Chrome multi-viewport screenshot tester
│   └── aas_catalog.py             # Agentic Awesome Skills local search & installation helper
│
├── docs/                          # Architecture & Developer Documentation Suite
│   ├── ARCHITECTURE.md            # System design & component interactions
│   ├── FOLDER_STRUCTURE.md        # Directory responsibilities (this file)
│   ├── API_DOCUMENTATION.md       # Comprehensive REST API reference
│   ├── ENVIRONMENT_SETUP.md       # Environment variables & runtime instructions
│   ├── DEVELOPMENT_GUIDE.md       # Local developer guidelines & code standards
│   ├── TESTING_GUIDE.md           # Automated testing & verification protocol
│   └── DEPLOYMENT_GUIDE.md        # Production hosting, Vercel & Node.js instructions
│
├── .env.example                   # Environment configuration template
├── app.js                         # Core client-side Single Page Application (SPA)
├── hero-cinematic.js              # Three-scene cinematic hero controller
├── motion-engine.js               # GSAP 3 & ScrollTrigger luxury animation engine
├── visual-editor.js               # On-page live visual content & product editor
├── style.css                      # Master luxury stylesheet (CSS Variables, Grid, Responsive)
├── index.html                     # Semantic HTML5 entrypoint
├── package.json                   # Dependencies, engines & scripts
└── server.js                      # Root server bootstrap entrypoint
```
