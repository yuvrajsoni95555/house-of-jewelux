# HOUSE OF JEWELUX
### *Where Elegance Becomes Eternal*

> **Brand:** House of Jewelux  
> **Founder:** Yuvraj Soni  
> **Based in:** Jaipur, Rajasthan, India  
> **Collections:** Gold, Silver and Diamond Jewellery  
> **Website:** [https://houseofjewelux.com](https://houseofjewelux.com)

---

## Overview

House of Jewelux brings Indian heritage influences together with contemporary minimalism. The collections span gold, silver and diamond jewellery, with an emphasis on considered design and timeless elegance.

Product-specific material, finish, stone, weight and image details must be verified against the exact item before payment. Where catalogue photography is marked as representative, the exact product photograph should be confirmed with the team before payment.

---

## Project structure

- **Frontend:** Vanilla JavaScript single-page application, HTML and CSS, with GSAP-based motion effects.
- **Backend:** Node.js and Express API with separated routes, controllers, configuration and security middleware.
- **Catalogue and local data:** JSON files are currently used by the application. This is suitable for local development and review, but it is not durable or shared storage for a serverless production deployment.
- **Admin access:** Server-issued signed sessions. Configure the admin PIN and session secret using private environment variables; never commit production secrets.

---

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment template
cp .env.example .env

# 3. Set secure local values in .env
# ADMIN_SECRET_PIN: unique value of at least 12 characters
# SESSION_SECRET: random value of at least 32 characters

# 4. Start the local development server
npm run dev

# 5. Open in browser
# http://localhost:3000
```

See [Environment Setup](docs/ENVIRONMENT_SETUP.md) before deploying.

---

## Tests and checks

Run the available Node test suite:

```bash
npm test
```

The repository also includes a GitHub Actions workflow for JavaScript syntax checks and tests. Do not treat a draft pull request as production-ready until the latest workflow checks and deployed end-to-end tests have passed.

---

## Production readiness

Before accepting live orders:

1. Replace JSON-file storage with a persistent database suitable for the hosting platform.
2. Integrate a payment gateway and verify payment signatures/webhooks on the server.
3. Configure transactional email and secure password recovery.
4. Verify every product's exact photograph, material, finish, stone, weight, price and any applicable certification.
5. Confirm delivery charges, delivery regions, returns, exchanges, cancellations and warranty terms.
6. Set production secrets in the hosting provider's environment settings.
7. Test mobile layouts, admin access, order placement and tracking on the deployed site.

See:
- [Environment Setup](docs/ENVIRONMENT_SETUP.md)
- [Product Catalogue QA](docs/PRODUCT_CATALOG_QA.md)
- [Production Readiness](docs/PRODUCTION_READINESS.md)

---

© 2026 House of Jewelux. All rights reserved.
