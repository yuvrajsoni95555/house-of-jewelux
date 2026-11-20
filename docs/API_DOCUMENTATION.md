# HOUSE OF JEWELUX — API REFERENCE

**Local base URL:** `http://localhost:3000/api`  
**Production base URL:** `https://houseofjewelux.com/api`  
**Content type:** `application/json`

## Catalogue

### `GET /products`
Returns the product catalogue. Supports the implemented category, material, collection, search, price-range and sort filters.

### `GET /products/:identifier`
Returns one product by SKU or handle, with related catalogue entries.

### `GET /categories`
Returns configured collection categories.

## Cart and orders

### `POST /cart/validate`
Recalculates cart prices and coupon discounts using server-side catalogue data. Delivery charges are currently returned as unquoted and must be confirmed before payment.

### `POST /orders`
Creates an order request after server-side validation.

Example payload shape:

```json
{
  "customer": {
    "name": "Customer",
    "email": "customer@example.com",
    "phone": "9876543210"
  },
  "shippingAddress": {
    "addressLine": "Street and house number",
    "city": "Jaipur",
    "state": "Rajasthan",
    "pincode": "302001"
  },
  "items": [
    { "id": "HJ-RNG-001", "quantity": 1 }
  ],
  "paymentMethod": "advance_payment"
}
```

Only `advance_payment` is accepted. COD is rejected. The response contains an order ID and a payment-pending order record. No payment gateway is integrated, so the application must not mark an order paid based only on this request.

### `POST /orders/track`
Looks up an order using its order ID. This is an order-status lookup, not live courier tracking.

## Customer accounts

- `POST /auth/register` — creates a customer account.
- `POST /auth/login` — verifies email and password and returns the customer's own account/order summary.
- `POST /auth/recover-password` — currently returns an honest support message; automated email reset is not configured.

## Consultation and newsletter

- `POST /appointments` — stores a consultation request with status pending. It does not book a calendar slot.
- `GET /appointments` — admin-only appointment/consultation request listing.
- `POST /newsletter` — saves a newsletter email address and returns success only after persistence succeeds.

## Admin APIs

### `POST /admin/login`
Payload: `{ "pin": "your-configured-admin-pin" }`

Returns a signed bearer token when credentials are valid. The PIN is configured through `ADMIN_SECRET_PIN`; there is no public default PIN.

All routes below require `Authorization: Bearer <token>`:

- `GET /admin/overview`
- `PATCH /admin/orders/:orderId`
- `PATCH /admin/products/:productId`
- `POST /admin/editor-save`
- `GET /appointments`

### `POST /custom-order`
Custom/bespoke jewellery commissions are not offered. This endpoint is disabled and returns a gone response.

## Production caveats

- JSON-file storage is not durable/shared under serverless hosting.
- Payment gateway and verified webhook/signature handling are not integrated.
- Transactional email/password reset is not configured.
- Do not treat delivery or courier information as confirmed until the team has supplied it.
