# HOUSE OF JEWELUX — REST API DOCUMENTATION

**Base URL:** `http://localhost:3000/api` (Production: `https://houseofjewelux.com/api`)  
**Response Format:** `application/json`

---

## 1. Catalog & Products

### `GET /api/products`
Retrieves products with optional multi-facet filtering.

**Query Parameters:**
- `category` (string, optional): Filter by category slug (e.g. `rings`, `earrings`, `necklaces`).
- `material` (string, optional): Filter by precious material (`gold`, `silver`, `diamond`, `gemstone`).
- `collection` (string, optional): Filter by design archetype (`temple-jewellery`, `nature-inspired`, etc.).
- `search` (string, optional): Keyword search matching name, description, stone.
- `min_price` / `max_price` (number, optional): Price range in INR (₹).
- `sort` (string, optional): `price_asc`, `price_desc`, `rating`, `newest`.

**Response (200 OK):**
```json
{
  "success": true,
  "count": 50,
  "total": 50,
  "products": [ ... ]
}
```

---

### `GET /api/products/:identifier`
Retrieves a single product by SKU ID or URL handle, including 4 curated related pieces.

**Response (200 OK):**
```json
{
  "success": true,
  "product": { "id": "HJ-RNG-001", "name": "The Celestial Radiance 925 Solitaire Ring", ... },
  "related": [ ... ]
}
```

---

### `GET /api/categories`
Retrieves all 26 curated fine jewellery categories with banners and metadata.

**Response (200 OK):**
```json
{
  "success": true,
  "count": 26,
  "categories": [ ... ]
}
```

---

## 2. Cart & Orders

### `POST /api/cart/validate`
Validates client cart contents against server prices and applies promotional privilege coupons.

**Payload:**
```json
{
  "items": [{ "id": "HJ-RNG-001", "quantity": 1 }],
  "couponCode": "FIRSTLUX"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "subtotal": 14500,
  "discount": 1450,
  "appliedCoupon": "FIRSTLUX",
  "shipping": 0,
  "grandTotal": 13050,
  "items": [ ... ]
}
```

---

### `POST /api/orders`
Finalizes checkout with server-side recalculated totals and generates an armored consignment tracking number.

**Response (201 Created):**
```json
{
  "success": true,
  "orderId": "HJ-ORD-2026-4821",
  "trackingNumber": "HJ-TRK-749102IN",
  "order": { ... }
}
```

---

### `POST /api/orders/track`
Retrieves real-time armored logistics telemetry by Order ID or tracking code.

**Payload:** `{ "orderId": "HJ-ORD-2026-4821" }`

---

## 3. Atelier Salon Appointments

### `POST /api/appointments`
Schedules a private suite appointment at the Jaipur Atelier or New Delhi Salon.

**Payload:**
```json
{
  "name": "Lady Eleanor",
  "phone": "+91 98765 43210",
  "email": "eleanor@example.com",
  "salon": "Jaipur High Jewellery Atelier (Civil Lines)",
  "date": "2026-12-05",
  "timeSlot": "Morning Private Suite (11:00 AM - 1:00 PM)",
  "interests": "Temple Nakshi Suites & Solitaire Rings"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "appointmentId": "HJ-APT-892104",
  "message": "Private salon appointment confirmed."
}
```

---

## 4. Administrative APIs

- `POST /api/admin/login` — Verifies master atelier security PIN (`pin: "2026"`).
- `GET /api/admin/overview` — Returns live revenue metrics, total orders, and catalog counts.
- `PATCH /api/admin/orders/:orderId` — Updates order and payment fulfillment statuses.
- `POST /api/admin/editor-save` — Batch persists on-page visual editor adjustments.
