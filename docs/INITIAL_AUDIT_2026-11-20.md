# House of Jewelux — Initial Repository Audit
Date: 2026-11-20
Branch: audit/security-hardening-2026-11-20
Base: main

## Scope and limitations
This is an initial static review of the default branch. No live checkout, payment gateway, browser, deployment, or production database test has been performed. Findings below are confirmed from the inspected source files unless marked otherwise.

## Critical security findings
1. **Hard-coded admin credentials** — `.env.example` contains `ADMIN_SECRET_PIN=1926` and a fixed session secret. `server/config/index.js` also falls back to `1926` and a predictable session secret.
2. **Admin authentication bypass** — `server/controllers/adminController.js` accepts the hard-coded PINs `2026` and `1122` in addition to the configured PIN. The admin overview, order update, product update, and editor-save routes are mounted without visible authentication/authorization middleware in `server/routes/api.js`.
3. **Customer passwords use unsalted SHA-256** — `server/controllers/authController.js` hashes passwords with plain SHA-256; this is unsuitable for password storage. Use a password-hashing algorithm such as scrypt, bcrypt, or Argon2 with per-password salts.
4. **Password recovery is not implemented** — `recoverPassword` returns a message claiming a reset link was sent, but the inspected controller does not generate a token or send email.
5. **Order data exposure risk** — `GET /api/orders/:orderId` returns the full order object without visible customer authentication/ownership checks. Tracking also permits lookup by customer email or phone.

## Critical payment/order correctness findings
6. **Payment status can be falsely marked paid** — `createOrder` sets payment status to `Paid & Verified` for any non-COD payment method without verifying a gateway transaction. The inspected code does not show a payment-provider signature/webhook verification step.
7. **Order status is marked confirmed immediately** — orders are created as `Confirmed by Jaipur Atelier` before payment verification.
8. **Product quantities and stock are not enforced** — quantities are coerced to at least one, but no maximum/stock validation or inventory decrement is visible in the inspected order controller.

## Reliability and QA findings
9. **README/QA documentation references missing scripts** — repository tree does not contain `scripts/test_all_apis.py`, `scripts/audit_assets_and_data.py`, or `scripts/multi_route_visual_qa.py`, although README/testing documentation instructs running them.
10. **Package test command is a placeholder** — `package.json` test script always exits with “no test specified”.
11. **JSON file persistence is fragile for serverless deployment** — `server/db/jsonDb.js` writes to the local filesystem and suppresses write failures. On ephemeral/read-only serverless filesystems this can lose or silently fail to persist orders/customers.
12. **Potential product-data shape crashes** — product filtering/search and identifier lookup call methods such as `p.name.toLowerCase()`, `p.category.toLowerCase()`, `p.id.toLowerCase()`, and `p.handle.toLowerCase()` without consistently validating those fields.

## Brand/content and policy review required
13. Verify product material, hallmark, gemstone, certification, warranty, courier, delivery-time, and origin claims against actual business records before publication. README currently makes strong claims (including “certified solitaires”, “hallmarked metals”, “Est. 1926”, and courier details) that were not verified by this code review.
14. The bespoke/custom-order API is present. Confirm whether it should be disabled/removed from customer-facing flows in line with the current brand scope.

## Next implementation priorities
- Remove hard-coded credentials; fail closed in production when required secrets are absent.
- Add server-side admin authentication and authorization to every admin route; use secure sessions/tokens and rate limiting.
- Replace SHA-256 password storage with a modern password hash and implement real password reset or remove the misleading endpoint.
- Protect order retrieval and tracking from personal-data enumeration.
- Correct payment state transitions; never mark an order paid until a trusted provider verification succeeds.
- Add input validation, quantity/stock checks, safer persistence, and automated tests.
- Verify public brand claims and remove unverified statements.

## Status
Initial findings recorded. No production data or product assets were modified. Further fixes must be validated with automated tests and deployment-specific checks before declaring the site production-ready.
