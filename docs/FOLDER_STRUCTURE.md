# HOUSE OF JEWELUX — REPOSITORY STRUCTURE

The following is the current high-level layout. Some generated assets and product photography are stored separately from application code.

```
house-of-jewelux/
├── api/
│   └── index.js                    # Vercel serverless Express entry point
├── server/
│   ├── app.js                      # Express app factory and middleware
│   ├── config/
│   │   └── index.js                # Environment configuration
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── appointmentController.js
│   │   ├── authController.js
│   │   ├── newsletterController.js
│   │   ├── orderController.js
│   │   └── productController.js
│   ├── db/
│   │   └── jsonDb.js               # JSON file data access (not serverless durable)
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── security.js
│   └── routes/
│       └── api.js
├── data/
│   ├── appointments.json
│   ├── categories.json
│   ├── coupons.json
│   ├── customers.json
│   ├── orders.json
│   ├── page_overrides.json
│   ├── products.json
│   ├── storeConfig.json
│   └── subscribers.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── DEVELOPMENT_GUIDE.md
│   ├── ENVIRONMENT_SETUP.md
│   ├── FOLDER_STRUCTURE.md
│   ├── PRODUCT_CATALOG_QA.md
│   ├── PRODUCTION_READINESS.md
│   └── TESTING_GUIDE.md
├── tests/
│   └── security.test.js
├── .github/
│   └── workflows/
│       └── repository-checks.yml
├── app.js                          # Browser storefront and SPA
├── hero-cinematic.js
├── motion-engine.js
├── visual-editor.js                # Admin-session gated visual editor
├── style.css
├── index.html
├── server.js                       # Node server entry point
├── package.json
└── vercel.json
```

## Important notes

- `data/*.json` is currently file-based storage. It must be replaced with a persistent database before live orders are accepted on serverless hosting.
- Do not commit `.env` or production credentials.
- Product photos and catalogue specifications must be verified against the exact SKU before publication.
