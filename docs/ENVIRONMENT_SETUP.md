# HOUSE OF JEWELUX — ENVIRONMENT SETUP & CONFIGURATION

## 1. Prerequisites
- **Node.js:** v18.0.0 or later (v20+ Recommended)
- **Python:** 3.8+ (for automated QA test suites)
- **Git**

---

## 2. Quick Setup

```bash
# 1. Clone or navigate to the repository
cd houseofjewelux

# 2. Copy the environment configuration template
cp .env.example .env

# 3. Install production dependencies
npm install

# 4. Start the development server
npm run dev
# Server will start at http://localhost:3000
```

---

## 3. Environment Variables Reference

| Variable | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | Number | `3000` | Port on which the HTTP server listens |
| `NODE_ENV` | String | `development` | Environment mode (`development` or `production`) |
| `ADMIN_SECRET_PIN` | String | `1926` | Master authentication PIN for the Admin & Visual Editor |
| `SESSION_SECRET` | String | — | Cryptographic secret for signing session tokens |
| `SITE_URL` | String | `http://localhost:3000` | Public domain of the application |
| `ALLOWED_ORIGINS` | CSV | `localhost:3000,...` | Whitelisted origins for cross-origin requests |
