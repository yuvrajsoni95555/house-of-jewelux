# HOUSE OF JEWELUX — DEPLOYMENT READINESS

## Important: current production blocker

The current application stores orders, customers, appointments and newsletter subscribers in JSON files. That storage is not durable or shared across serverless instances. **Do not accept live orders on Vercel with the current JSON data layer.**

Before production order-taking:
1. Migrate JSON storage to a persistent database (for example, managed PostgreSQL or another suitable durable database).
2. Add database transactions/unique constraints for order creation and payment state.
3. Integrate a payment gateway and verify signed webhooks server-side.
4. Configure transactional email and secure password recovery.
5. Confirm product photos/specifications, prices, shipping, returns and legal business details.
6. Run the full end-to-end checklist on the deployed environment.

## Vercel

The repository includes `api/index.js` and `vercel.json` for routing requests to the Express application. This only provides an execution entry point; it does not make the JSON-file data layer durable. Complete the database migration before using this deployment for real orders.

Set these secrets in Vercel Project Settings → Environment Variables:

- `ADMIN_SECRET_PIN` — unique random value, at least 12 characters.
- `SESSION_SECRET` — cryptographically random value, at least 32 characters.
- Any other provider keys only after the corresponding integrations have been implemented.

Never commit a real `.env` file or production secrets.

## Persistent Node.js host

For a VPS or container deployment, use a supported Node.js runtime, install dependencies with `npm ci --omit=dev`, configure environment variables outside the repository, and run the application behind HTTPS.

Even on a VPS, JSON-file storage is not recommended for concurrent customer orders. Migrate to a persistent database and maintain backups before launch.

## Release checklist

- [ ] Database migration complete and restore tested.
- [ ] Payment gateway and webhook signature verification tested.
- [ ] Admin credentials and session secret configured.
- [ ] Email delivery and password recovery tested.
- [ ] Product catalogue and exact-SKU images verified.
- [ ] Shipping, returns, exchange and warranty policies approved.
- [ ] Latest GitHub Actions checks pass.
- [ ] Mobile and desktop end-to-end QA passes.
- [ ] Test orders and refunds completed in the payment provider sandbox.
