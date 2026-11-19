# HOUSE OF JEWELUX — TESTING & QUALITY ASSURANCE PROTOCOL

## 1. Automated API Regression Suite

The project includes an automated Python test suite that exercises all 22 REST API endpoints across status codes, payload validations, calculations, and errors.

```bash
# Ensure server is running:
npm start

# Run API test suite:
python scripts/test_all_apis.py
```

### Coverage:
- Product listing & multi-facet filtering (Gold, Silver, Diamond, Collections, Price bands)
- Single product retrieval & 404 validation
- Cart recalculation & coupon discount verification (`FIRSTLUX`)
- Order creation & consignment telemetry tracking
- Salon appointment bookings with HTTP 201 status
- Admin authentication & overview statistics

---

## 2. Asset & Data Integrity Audit

Verifies that all 50 products and 26 categories in `data/` reference physical, existing assets on disk:

```bash
python scripts/audit_assets_and_data.py
```

---

## 3. Multi-Route Visual Inspection

Captures automated headless Chrome screenshots across 27 routes and 3 viewports (1440px Desktop, 768px Tablet, 390px Mobile):

```bash
python scripts/multi_route_visual_qa.py
```
