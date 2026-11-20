# HOUSE OF JEWELUX — TESTING GUIDE

## Automated checks

Install dependencies:

```bash
npm install
```

Run the Node test suite:

```bash
npm test
```

The current automated suite covers:
- Valid admin session acceptance.
- Rejection of missing and tampered admin tokens.
- Admin login rate limiting.

The GitHub Actions workflow also runs JavaScript syntax checks and `npm test` on pushes to the repair branches and pull requests targeting `main`.

## Manual verification still required

Automated tests do not replace end-to-end checks. Before launch, test:

1. Admin login, logout, token expiry and every protected admin action.
2. Customer registration/login and legacy password migration.
3. Cart totals, coupon handling and advance-payment-only checkout.
4. Order tracking using a real test order ID.
5. Consultation request creation and admin visibility.
6. Newsletter subscription success and persistence failure.
7. Mobile/tablet/desktop layouts, keyboard navigation and accessibility.
8. The deployed hosting environment with persistent database storage.

## Known limitations

- The repository does not contain the previously documented Python API suite or headless Chrome multi-route screenshot scripts.
- Current automated tests are focused security tests, not full endpoint coverage.
- The latest workflow status must be checked on the current pull-request head before merge.
- Live payment, email and courier integrations are not configured.
