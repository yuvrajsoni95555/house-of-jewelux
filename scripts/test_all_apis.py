import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:3000"

def request(endpoint, method="GET", data=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, method=method)
    req.add_header('Content-Type', 'application/json')
    req.add_header('Accept', 'application/json')
    body = None
    if data is not None:
        body = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req, data=body, timeout=5) as response:
            status = response.status
            content = response.read().decode('utf-8')
            try:
                res_json = json.loads(content)
            except:
                res_json = content
            return status, res_json
    except urllib.error.HTTPError as e:
        content = e.read().decode('utf-8')
        try:
            res_json = json.loads(content)
        except:
            res_json = content
        return e.code, res_json
    except Exception as e:
        return 0, str(e)

print("="*65)
print("HOUSE OF JEWELUX — COMPREHENSIVE BACKEND API TEST SUITE")
print("="*65)

tests_passed = 0
tests_failed = 0

def check(test_name, success, details=""):
    global tests_passed, tests_failed
    if success:
        tests_passed += 1
        print(f"  [PASS] {test_name}")
    else:
        tests_failed += 1
        print(f"  [FAIL] {test_name} -> {details}")

# 1. Categories API
status, res = request("/api/categories")
check("GET /api/categories returns 200", status == 200)
check("GET /api/categories returns 26 categories", isinstance(res, dict) and len(res.get('categories', [])) == 26, f"Count: {len(res.get('categories', [])) if isinstance(res, dict) else 0}")

# 2. Products API - All
status, res = request("/api/products")
check("GET /api/products returns 200", status == 200)
check("GET /api/products returns 50 products", isinstance(res, dict) and res.get('total') == 50, f"Total: {res.get('total') if isinstance(res, dict) else 0}")

# 3. Products Filtering by Material
status, res = request("/api/products?material=gold")
check("GET /api/products?material=gold returns 17 products", status == 200 and res.get('total') == 17, f"Total: {res.get('total')}")

status, res = request("/api/products?material=silver")
check("GET /api/products?material=silver returns 50 products", status == 200 and res.get('total') == 50, f"Total: {res.get('total')}")

status, res = request("/api/products?material=diamond")
check("GET /api/products?material=diamond returns 45 products", status == 200 and res.get('total') == 45, f"Total: {res.get('total')}")

# 4. Products Filtering by Category
status, res = request("/api/products?category=rings")
check("GET /api/products?category=rings returns 10 products", status == 200 and res.get('total') == 10, f"Total: {res.get('total')}")

# 5. Products Filtering by Collection
status, res = request("/api/products?collection=temple-jewellery")
check("GET /api/products?collection=temple-jewellery returns products", status == 200 and res.get('total') >= 3, f"Total: {res.get('total')}")

# 6. Single Product API - Valid & Invalid
status, res = request("/api/products/HJ-RNG-001")
check("GET /api/products/HJ-RNG-001 returns 200 and product", status == 200 and res.get('success') and res.get('product', {}).get('id') == 'HJ-RNG-001')

status, res = request("/api/products/INVALID_ID_9999")
check("GET /api/products/INVALID_ID returns 404", status == 404)

# 7. Cart Validation API
cart_payload = {
    "items": [
        {"id": "HJ-RNG-001", "quantity": 1},
        {"id": "HJ-EAR-001", "quantity": 2}
    ],
    "couponCode": "FIRSTLUX"
}
status, res = request("/api/cart/validate", method="POST", data=cart_payload)
check("POST /api/cart/validate with coupon FIRSTLUX applies 10% discount", status == 200 and res.get('success') and res.get('discount') > 0)

cart_bad = {"items": [{"id": "NON_EXISTENT", "quantity": 1}]}
status, res = request("/api/cart/validate", method="POST", data=cart_bad)
check("POST /api/cart/validate with invalid item handles error properly", status in [200, 400])

# 8. Order Creation & Retrieval API
order_payload = {
    "customer": {
        "fullName": "Maharani Gayatri",
        "email": "gayatri@houseofjewelux.com",
        "phone": "+919876543210"
    },
    "shippingAddress": {
        "address": "City Palace, Suite 101",
        "city": "Jaipur",
        "state": "Rajasthan",
        "pincode": "302002"
    },
    "items": [
        {"id": "HJ-RNG-001", "quantity": 1}
    ],
    "paymentMethod": "gpay",
    "couponCode": "FIRSTLUX"
}
status, res = request("/api/orders", method="POST", data=order_payload)
created_order_id = res.get('orderId') if isinstance(res, dict) else None
check("POST /api/orders creates order successfully", status == 201 and res.get('success') and created_order_id is not None, f"Status: {status}, Res: {res}")

if created_order_id:
    status, res = request(f"/api/orders/{created_order_id}")
    check(f"GET /api/orders/{created_order_id} retrieves order", status == 200 and res.get('success') and res.get('order', {}).get('orderId') == created_order_id)

# 9. Track Order API
status, res = request("/api/orders/track", method="POST", data={"query": created_order_id or "HJ-ORD-2026-7701"})
check("POST /api/orders/track with order ID returns tracking telemetry", status == 200 and res.get('success'))

status, res = request("/api/orders/track", method="POST", data={"query": "UNKNOWN_99999999"})
check("POST /api/orders/track with unknown query returns 404", status == 404)

# 10. Customer Auth API (Register & Login)
test_email = f"patron_{urllib.parse.quote('test')}@houseofjewelux.com"
reg_payload = {
    "name": "Prince Siddharth",
    "email": "patron_unique_2026@houseofjewelux.com",
    "phone": "+919876500000",
    "password": "RoyalSecretPassword2026"
}
status, res = request("/api/auth/register", method="POST", data=reg_payload)
check("POST /api/auth/register handles registration or existing account", status in [200, 201, 400])

login_payload = {
    "email": "patron_unique_2026@houseofjewelux.com",
    "password": "RoyalSecretPassword2026"
}
status, res = request("/api/auth/login", method="POST", data=login_payload)
check("POST /api/auth/login with valid credentials returns 200", status == 200 and res.get('success'))

status, res = request("/api/auth/login", method="POST", data={"email": "wrong@email.com", "password": "wrong"})
check("POST /api/auth/login with wrong credentials returns 401", status == 401)

# 11. Appointment API
apt_payload = {
    "fullName": "Lady Eleanor",
    "email": "eleanor@example.com",
    "phone": "+919876543210",
    "appointmentDate": "2026-12-01",
    "preferredTime": "16:00 - 17:30 IST",
    "consultationType": "Private Jaipur Atelier Experience",
    "interests": "Temple Nakshi Suites & Solitaire Rings"
}
status, res = request("/api/appointments", method="POST", data=apt_payload)
check("POST /api/appointments creates appointment and returns booking reference", status == 201 and res.get('success') and 'appointment' in res)

status, res = request("/api/appointments")
check("GET /api/appointments lists appointments", status == 200 and res.get('success') and 'appointments' in res)

status, res = request("/api/appointments", method="POST", data={"fullName": "Test"})
check("POST /api/appointments with missing fields returns 400", status == 400)

# 12. Bespoke Custom Order API
custom_payload = {
    "fullName": "Maharaja Vikram",
    "phone": "+919988776655",
    "email": "vikram@royalestate.in",
    "jewelleryType": "Royal Falcon Brooch with Colombian Emerald",
    "metalPreference": "22K Solid Gold & 925 Silver",
    "budgetBand": "₹1,00,000 - ₹3,00,000",
    "description": "Bespoke ceremonial sherwani brooch featuring carved emerald and uncut diamond pavé."
}
status, res = request("/api/custom-order", method="POST", data=custom_payload)
check("POST /api/custom-order registers bespoke commission", status == 200 and res.get('success') and 'commissionId' in res)

# 13. Admin Login API
status, res = request("/api/admin/login", method="POST", data={"pin": "2026"})
check("POST /api/admin/login with correct PIN returns 200", status == 200 and res.get('success'))

status, res = request("/api/admin/login", method="POST", data={"pin": "wrong_pin"})
check("POST /api/admin/login with incorrect PIN returns 401", status == 401)

# 14. Admin Overview API
status, res = request("/api/admin/overview")
check("GET /api/admin/overview returns metrics and recent orders", status == 200 and res.get('success') and 'metrics' in res)

# 15. Admin Order Update API
if created_order_id:
    status, res = request(f"/api/admin/orders/{created_order_id}", method="PATCH", data={"orderStatus": "Dispatched via Armored Transit"})
    check("PATCH /api/admin/orders/:orderId updates status", status == 200 and res.get('success'))

# 16. Admin Product Update API
status, res = request("/api/admin/products/HJ-RNG-001", method="PATCH", data={"badge": "Heirloom Edition"})
check("PATCH /api/admin/products/:productId updates badge", status == 200 and res.get('success'))

# 17. Newsletter API
status, res = request("/api/newsletter", method="POST", data={"email": "patron_circle_2026@houseofjewelux.com"})
check("POST /api/newsletter with valid email returns 200", status == 200 and res.get('success'))

status, res = request("/api/newsletter", method="POST", data={"email": "not-an-email"})
check("POST /api/newsletter with invalid email returns 400", status == 400)

# 18. API 404 Routing
status, res = request("/api/unmapped-endpoint-route-check")
check("GET /api/unmapped returns JSON 404 not found handler", status == 404 and isinstance(res, dict) and res.get('success') is False)

print("\n" + "="*65)
print(f"API TEST SUMMARY: {tests_passed} Passed, {tests_failed} Failed out of {tests_passed + tests_failed} Tests")
print("="*65)

if tests_failed > 0:
    sys.exit(1)
