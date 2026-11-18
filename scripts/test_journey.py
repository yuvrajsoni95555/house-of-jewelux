import urllib.request
import json

base_url = 'http://localhost:3000'

def test_full_journey():
    print("==================================================")
    print("✦ HOUSE OF JEWELUX — END-TO-END VERIFICATION TEST")
    print("==================================================")

    # 1. Homepage & Catalog
    req = urllib.request.Request(f"{base_url}/api/products")
    with urllib.request.urlopen(req) as resp:
        products_data = json.loads(resp.read().decode('utf-8'))
    print(f"✓ Step 1: Catalog fetched ({products_data['count']} products available)")
    assert products_data['count'] == 50, "Expected 50 products"

    # 2. Search & Category Filtering
    req = urllib.request.Request(f"{base_url}/api/products?category=earrings")
    with urllib.request.urlopen(req) as resp:
        earrings_data = json.loads(resp.read().decode('utf-8'))
    print(f"✓ Step 2: Earrings category filter returned {earrings_data['count']} items")
    assert earrings_data['count'] == 10, "Expected 10 earrings"

    # 3. Product Detail Page
    req = urllib.request.Request(f"{base_url}/api/products/HJ-EAR-001")
    with urllib.request.urlopen(req) as resp:
        pdp_data = json.loads(resp.read().decode('utf-8'))
    prod = pdp_data['product']
    print(f"✓ Step 3: PDP fetched: '{prod['name']}' — Price: ₹{prod['price']:,}")
    assert prod['id'] == 'HJ-EAR-001'

    # 4. Cart Price & Coupon Server Validation
    cart_payload = {
        'items': [
            {'id': 'HJ-EAR-001', 'quantity': 1},
            {'id': 'HJ-RNG-001', 'quantity': 1}
        ],
        'couponCode': 'FIRSTLUX'
    }
    req = urllib.request.Request(
        f"{base_url}/api/cart/validate",
        data=json.dumps(cart_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        cart_res = json.loads(resp.read().decode('utf-8'))
    
    expected_subtotal = 14613 + 15448
    expected_discount = round(expected_subtotal * 0.1)
    expected_grand_total = expected_subtotal - expected_discount
    print(f"✓ Step 4: Server Cart Validation:")
    print(f"   Subtotal: ₹{cart_res['subtotal']:,}")
    print(f"   Privilege Discount (FIRSTLUX 10%): -₹{cart_res['discount']:,}")
    print(f"   Shipping: ₹{cart_res['shipping']:,}")
    print(f"   Grand Total: ₹{cart_res['grandTotal']:,}")
    assert cart_res['subtotal'] == expected_subtotal
    assert cart_res['discount'] == expected_discount

    # 5. Order Placement (Bank Transfer - Pending Verification)
    order_payload = {
        'customer': {
            'fullName': 'Yuvraj Soni',
            'email': 'yuvrajsoni@example.com',
            'phone': '+916377061020'
        },
        'shippingAddress': {
            'address': 'Jaipur Atelier, C-Scheme',
            'city': 'Jaipur',
            'pincode': '302001',
            'state': 'Rajasthan'
        },
        'items': [
            {'id': 'HJ-EAR-001', 'quantity': 1, 'metal': 'BIS 925 Rhodium Silver'}
        ],
        'paymentMethod': 'bank_transfer',
        'couponCode': 'FIRSTLUX'
    }
    req = urllib.request.Request(
        f"{base_url}/api/orders",
        data=json.dumps(order_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        order_res = json.loads(resp.read().decode('utf-8'))
    
    placed_order = order_res['order']
    print(f"✓ Step 5: Order Created Successfully:")
    print(f"   Order ID: {placed_order['orderId']}")
    print(f"   Payment Method: {placed_order['paymentMethod']}")
    print(f"   Payment Status: {placed_order['paymentStatus']}")
    print(f"   Order Status: {placed_order['orderStatus']}")
    print(f"   Tracking ID: {placed_order['trackingNumber']}")
    assert placed_order['paymentStatus'] == 'Pending Verification'

    # 6. Admin Verification
    req = urllib.request.Request(
        f"{base_url}/api/admin/orders/{placed_order['orderId']}",
        data=json.dumps({'paymentStatus': 'Paid', 'orderStatus': 'Confirmed & In Atelier Goldsmithing'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    with urllib.request.urlopen(req) as resp:
        admin_update = json.loads(resp.read().decode('utf-8'))
    print(f"✓ Step 6: Admin Verified Payment:")
    print(f"   Updated Status: {admin_update['order']['paymentStatus']} — {admin_update['order']['orderStatus']}")
    assert admin_update['order']['paymentStatus'] == 'Paid'

    print("==================================================")
    print("✦ ALL END-TO-END VERIFICATION CHECKS PASSED 100%!")
    print("==================================================")

test_full_journey()
