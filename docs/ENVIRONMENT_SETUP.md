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
| `ADMIN_SECRET_PIN` | String | **Required** | Strong admin secret; minimum 12 characters. Never commit it. |
| `ADMIN_SESSION_SECRET` | String | **Required** | Random secret of at least 32 characters used to sign 8-hour admin sessions. Never commit it. |
| `SESSION_SECRET` | String | — | Reserved for future customer session signing. |
| `SITE_URL` | String | `http://localhost:3000` | Public domain of the application |
| `ALLOWED_ORIGINS` | CSV | `localhost:3000,...` | Whitelisted origins for cross-origin requests |


## 4. Admin Security Setup

Before using the Admin Portal in production, configure `ADMIN_SECRET_PIN` (at least 12 characters) and `ADMIN_SESSION_SECRET` (at least 32 random characters) in your hosting provider's environment-variable settings. Do not commit `.env` or paste secrets into source control. The server intentionally refuses admin sign-in when these values are missing or too weak. Generate a random session secret with a cryptographically secure password generator.
