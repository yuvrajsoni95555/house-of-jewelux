# HOUSE OF JEWELUX — SYSTEM ARCHITECTURE SPECIFICATION

## 1. High-Level Architecture Overview

House of Jewelux is an ultra-luxury fine jewellery e-commerce platform and digital atelier operating across Gold, Silver, Diamond, and Precious Gemstone collections.

```
                           +-------------------------------------+
                           |            Clients / CDN            |
                           |   (Desktop, Mobile, Reverse Proxy)  |
                           +------------------+------------------+
                                              | HTTPS / WSS
                                              v
                           +-------------------------------------+
                           |          Security Layer             |
                           |   (Helmet-Style Headers, CORS, HSTS)|
                           +------------------+------------------+
                                              |
                   +--------------------------+--------------------------+
                   |                                                     |
                   v                                                     v
+------------------------------------+                +------------------------------------+
|        Client-Side SPA             |                |        Modular Express Server      |
|  - Custom Route Engine             |                |  - /api/v1 Router (Routes)         |
|  - Reactive State Manager          |                |  - Centralized Controllers         |
|  - Cinematic Motion & GSAP Engine  |                |  - Error & Security Middleware     |
|  - Cart & Checkout Orchestrator    |                |  - Resilient JSON DB Access        |
+------------------------------------+                +------------------+-----------------+
                                                                         |
                                                                         v
                                                      +------------------------------------+
                                                      |          Data Persistence          |
                                                      |  - products.json (50 Items)        |
                                                      |  - categories.json (26 Types)      |
                                                      |  - orders.json / appointments.json |
                                                      +------------------------------------+
```

---

## 2. Core Architectural Principles

1. **Separation of Concerns:** Business logic is isolated in controllers (`server/controllers/`), routing is centralized (`server/routes/api.js`), and database operations are encapsulated in `server/db/jsonDb.js`.
2. **Defensive Data Handling & Validation:** Server-side price recalculation guarantees that client-side DOM manipulation cannot tamper with cart totals or coupon values.
3. **Resilient JSON Persistence:** Atomic read/write operations with schema initialization and graceful fallbacks ensure the data layer cannot crash the application.
4. **Progressive Enhancement & Fail-Safe UI:** Client animations glide from 0 to 1 without permanently zeroing out initial DOM opacity, guaranteeing 100% visual stability across all network conditions and devices.
5. **Security by Default:** Comprehensive HTTP security headers (nosniff, SAMEORIGIN, strict referrer policy, HSTS) and masked customer data handling.
