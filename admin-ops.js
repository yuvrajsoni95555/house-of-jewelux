/* House of Jewelux admin: Business sections (add-on).
 * Adds Orders, Customers, Shipping, Finance, Inventory, Marketing, Support, Reports, Notifications and
 * Integrations to the existing admin. Talks to the API on Vercel with the admin PIN; never touches the
 * existing Products / Design Studio / Media / SEO code. Loaded before admin.js, which picks up HJ_EXTRA_VIEWS. */
(function () {
  'use strict';
  const API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? '' : 'https://houseofjewelux.vercel.app';
  const TOKEN_KEY = 'hj_api_token';
  const ORDER_STATUSES = ['Payment pending', 'Awaiting payment', 'Confirmed', 'Processing', 'Ready to ship', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Refunded'];
  const PAYMENT_STATUSES = ['Pending', 'Awaiting payment', 'Paid', 'Failed', 'Refunded'];
  const TO_SHIP = ['Confirmed', 'Processing', 'Ready to ship'];

  const $ = (s) => document.querySelector(s);
  const view = () => $('#view');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
  const date = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
  const total = (o) => (o.pricing && o.pricing.grandTotal) || 0;
  const pillCls = (s) => (/paid|delivered|confirmed|shipped|active/i.test(s) ? 'published' : /cancel|fail|refund|return/i.test(s) ? 'out' : 'draft');
  const pill = (s) => `<span class="pill ${pillCls(s || '')}">${esc(s || '—')}</span>`;
  const head = (title, sub, actions) => `<div class="page-head"><div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>${actions || ''}</div>`;
  const card = (num, label, go) => `<${go ? `button class="card" data-view="${go}"` : 'div class="card"'}><div class="num">${num}</div><div class="lbl">${esc(label)}</div></${go ? 'button' : 'div'}>`;
  const table = (cols, rows, empty) => rows.length
    ? `<div class="table-wrap"><table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`
    : `<div class="panel"><p class="muted" style="margin:0">${esc(empty)}</p></div>`;
  // Heading and its list in one box (an empty list shows the message inside the same box)
  const tableT = (title, cols, rows, empty) => `<div class="panel" style="margin-top:16px"><h3>${title}</h3>${rows.length ? table(cols, rows, empty) : `<p class="muted" style="margin:0">${esc(empty)}</p>`}</div>`;
  const notConfigured = (name, needs) => `<div class="panel"><h3>${esc(name)} <span class="pill draft">Not configured</span></h3><p class="muted" style="margin:0">${esc(needs)}</p></div>`;
  function toast(msg, bad) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.toggle('bad', !!bad); t.classList.remove('hidden');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 3500);
  }

  // ---------- API with admin PIN session ----------
  async function api(path, opts) {
    const o = opts || {};
    const res = await fetch(API + '/api' + path, {
      method: o.method || 'GET',
      headers: Object.assign({ 'Content-Type': 'application/json' }, sessionStorage.getItem(TOKEN_KEY) ? { Authorization: 'Bearer ' + sessionStorage.getItem(TOKEN_KEY) } : {}),
      body: o.body ? JSON.stringify(o.body) : undefined
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== '/admin/login') { sessionStorage.removeItem(TOKEN_KEY); throw Object.assign(new Error('Please enter the admin PIN again.'), { needPin: true }); }
    if (!res.ok || body.success === false) throw new Error(body.error || `Server error (${res.status})`);
    return body;
  }

  // Renders the PIN form when there is no API session; returns true if the view may continue
  function needPin(name, arg) {
    if (sessionStorage.getItem(TOKEN_KEY)) return false;
    view().innerHTML = head('Business sign-in', 'Orders, customers and payments live on the secure server. Enter your admin PIN once per session.') +
      `<form class="panel" id="pin-form" style="max-width:420px"><label for="pin-in">Admin PIN</label>
        <input id="pin-in" type="password" autocomplete="current-password" required>
        <p id="pin-err" class="errors hidden" role="alert"></p>
        <button class="btn btn-primary" type="submit" style="margin-top:12px">Continue</button>
        <p class="small muted">The PIN is the <b>ADMIN_SECRET_PIN</b> you set in Vercel.</p></form>`;
    $('#pin-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = $('#pin-err');
      try {
        const r = await api('/admin/login', { method: 'POST', body: { pin: $('#pin-in').value } });
        sessionStorage.setItem(TOKEN_KEY, r.token);
        VIEWS[name](arg);
      } catch (x) { err.textContent = x.message; err.classList.remove('hidden'); }
    });
    $('#pin-in').focus();
    return true;
  }

  // Wraps a view: PIN check, then loads; a lost session shows the PIN form again
  const guarded = (name, fn) => async (arg) => {
    if (needPin(name, arg)) return;
    try { await fn(arg); } catch (e) {
      if (e.needPin) { needPin(name, arg); return; }
      view().innerHTML = head('Could not load', 'The secure server did not answer.') + `<div class="panel"><p class="errors" style="margin:0">${esc(e.message)}</p></div>`;
    }
  };

  const getOrders = () => api('/admin/orders?limit=500').then((r) => r.items || []);
  const getProducts = () => fetch('/data/products.json', { cache: 'no-store' }).then((r) => r.json());
  function csv(name, rows) {
    const text = rows.map((r) => r.map((v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv' }));
    a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const orderRow = (o) => `<tr class="row" data-view="biz-order" data-arg="${esc(o.orderId)}"><td><b>${esc(o.orderId)}</b><br><span class="small muted">${esc(date(o.orderDate))}</span></td>
    <td>${esc((o.customer && o.customer.name) || '—')}<br><span class="small muted">${esc((o.customer && (o.customer.phone || o.customer.email)) || '')}</span></td>
    <td>${money(total(o))}</td><td>${pill(o.paymentStatus)}</td><td>${pill(o.orderStatus)}</td></tr>`;
  const ORDER_COLS = ['Order', 'Customer', 'Total', 'Payment', 'Status'];

  const VIEWS = {};

  VIEWS['biz-overview'] = guarded('biz-overview', async () => {
    const [ov, health] = await Promise.all([api('/admin/overview'), api('/health')]);
    const m = ov.metrics;
    const orders = ov.recentOrders || [];
    view().innerHTML = head('Business overview', 'Real sales and orders from your database. Nothing here is sample data.') +
      `<div class="cards">${card(money(m.totalRevenue), 'Revenue (paid orders)', 'biz-finance')}${card(m.paidOrders, 'Paid orders', 'biz-orders')}
        ${card(m.totalOrders, 'All orders', 'biz-orders')}${card(m.pendingVerification, 'Awaiting payment', 'biz-orders')}
        ${card(m.totalCustomers, 'Customers', 'biz-customers')}${card(m.totalProducts, 'Products', 'products')}</div>
      <div class="dash"><div>${tableT('Recent orders', ORDER_COLS, orders.slice(0, 8).map(orderRow), 'No orders yet. They appear here as soon as a customer checks out.')}</div>
        <div><div class="panel"><h3>System</h3><ul class="log">
          <li>Database: <b>${esc(health.database && health.database.status)}</b></li>
          <li>Online payment (Razorpay): ${health.paymentGateway.configured ? '<span class="pill published">Connected</span>' : '<span class="pill draft">Not configured</span>'}</li>
          <li>Cash on delivery: <b>Off</b></li></ul>
          <button class="btn btn-sm" data-view="biz-settings">Integrations &amp; settings</button></div></div></div>`;
  });

  VIEWS['biz-orders'] = guarded('biz-orders', async () => {
    const orders = await getOrders();
    view().innerHTML = head('Orders', `${orders.length} orders, newest first.`, '<button class="btn" id="ord-csv">Export CSV</button>') +
      `<div class="toolbar"><input id="ord-q" type="search" placeholder="Search order ID, name, phone, email" aria-label="Search orders">
        <select id="ord-s" aria-label="Filter by status"><option value="">All statuses</option>${ORDER_STATUSES.map((s) => `<option>${s}</option>`).join('')}</select></div><div id="ord-list"></div>`;
    const draw = () => {
      const q = $('#ord-q').value.trim().toLowerCase(); const s = $('#ord-s').value;
      const list = orders.filter((o) => (!s || o.orderStatus === s) && (!q || JSON.stringify([o.orderId, o.customer]).toLowerCase().includes(q)));
      $('#ord-list').innerHTML = table(ORDER_COLS, list.map(orderRow), 'No orders match.');
    };
    $('#ord-q').addEventListener('input', draw); $('#ord-s').addEventListener('change', draw); draw();
    $('#ord-csv').addEventListener('click', () => csv('orders.csv', [['Order', 'Date', 'Name', 'Email', 'Phone', 'City', 'Items', 'Total', 'Payment', 'Status', 'Courier', 'Tracking']]
      .concat(orders.map((o) => [o.orderId, o.orderDate, o.customer && o.customer.name, o.customer && o.customer.email, o.customer && o.customer.phone,
        o.shippingAddress && o.shippingAddress.city, (o.items || []).map((i) => `${i.name} x${i.quantity}`).join('; '), total(o), o.paymentStatus, o.orderStatus, o.courierPartner, o.trackingNumber]))));
  });

  VIEWS['biz-order'] = guarded('biz-order', async (id) => {
    const { order: o } = await api('/orders/' + encodeURIComponent(id));
    const a = o.shippingAddress || {}; const c = o.customer || {}; const p = o.pricing || {};
    const sel = (name, list, cur) => `<select id="${name}">${list.map((s) => `<option${s === cur ? ' selected' : ''}>${s}</option>`).join('')}</select>`;
    view().innerHTML = head('Order ' + o.orderId, 'Placed ' + date(o.orderDate), '<button class="btn" data-view="biz-orders">← All orders</button>') +
      `<div class="dash"><div>
        <div class="panel"><h3>Items</h3>${table(['Item', 'Qty', 'Price'], (o.items || []).map((i) => `<tr><td><b>${esc(i.name)}</b><br><span class="small muted">${esc(i.sku || '')} ${esc(i.metal || '')}</span></td><td>${esc(i.quantity)}</td><td>${money(i.itemTotal || i.price * i.quantity)}</td></tr>`), 'No items.')}
          <ul class="log" style="margin-top:12px"><li>Subtotal: <b>${money(p.subtotal)}</b></li>${p.discount ? `<li>Discount ${esc(p.couponCode || '')}: <b>−${money(p.discount)}</b></li>` : ''}
          <li>Shipping: <b>${money(p.shipping)}</b></li>${p.giftBoxCost ? `<li>Gift box: <b>${money(p.giftBoxCost)}</b></li>` : ''}<li>Total: <b>${money(p.grandTotal)}</b></li></ul></div>
        <div class="panel"><h3>Customer &amp; delivery address</h3><p style="margin:0"><b>${esc(c.name || '—')}</b><br>${esc(c.phone || '')} ${esc(c.email || '')}<br>
          ${esc([a.addressLine, a.city, a.state, a.pincode, a.country].filter(Boolean).join(', ') || 'No address')}</p></div></div>
        <div><form class="panel" id="ord-form"><h3>Update order</h3>
          <label for="o-status">Order status</label>${sel('o-status', ORDER_STATUSES, o.orderStatus)}
          <label for="o-pay">Payment status</label>${sel('o-pay', PAYMENT_STATUSES, o.paymentStatus)}
          <label for="o-courier">Courier</label><input id="o-courier" value="${esc(o.courierPartner || '')}" placeholder="e.g. Delhivery, Blue Dart">
          <label for="o-track">Tracking number</label><input id="o-track" value="${esc(o.trackingNumber || '')}">
          <label for="o-eta">Estimated delivery</label><input id="o-eta" value="${esc(o.estimatedDelivery || '')}" placeholder="e.g. 30 Nov 2026">
          <p class="small muted">Payment method: ${esc(o.paymentMethod || '—')}${o.razorpayPaymentId ? ' · Razorpay ID ' + esc(o.razorpayPaymentId) : ''}</p>
          <button class="btn btn-primary" type="submit">Save changes</button></form></div></div>`;
    $('#ord-form').addEventListener('submit', async (e) => {
      e.preventDefault(); const btn = e.submitter; btn.disabled = true;
      try {
        const body = { orderStatus: $('#o-status').value, paymentStatus: $('#o-pay').value, courierPartner: $('#o-courier').value, trackingNumber: $('#o-track').value, estimatedDelivery: $('#o-eta').value };
        if (body.paymentStatus === 'Paid' && o.paymentStatus !== 'Paid' && !confirm('Mark this order as PAID? Only do this after the money is in your bank account.')) return;
        await api('/admin/orders/' + encodeURIComponent(o.orderId), { method: 'PATCH', body });
        toast('Order saved'); Object.assign(o, body);
      } catch (x) { toast(x.message, true); } finally { btn.disabled = false; }
    });
  });

  VIEWS['biz-customers'] = guarded('biz-customers', async () => {
    const [{ items }, orders] = await Promise.all([api('/admin/customers'), getOrders()]);
    const spent = {}; const count = {};
    orders.filter((o) => o.paymentStatus === 'Paid').forEach((o) => { const k = ((o.customer && o.customer.email) || '').toLowerCase(); if (k) { spent[k] = (spent[k] || 0) + total(o); count[k] = (count[k] || 0) + 1; } });
    view().innerHTML = head('Customers', `${items.length} registered accounts.`, '<button class="btn" id="cus-csv">Export CSV</button>') +
      table(['Name', 'Contact', 'Paid orders', 'Spent', 'Joined'], items.map((c) => { const k = (c.email || '').toLowerCase(); return `<tr><td><b>${esc(c.name || '—')}</b></td><td>${esc(c.email || '')}<br><span class="small muted">${esc(c.phone || '')}</span></td><td>${count[k] || 0}</td><td>${money(spent[k])}</td><td>${esc(date(c.createdAt))}</td></tr>`; }), 'No customer accounts yet.');
    $('#cus-csv').addEventListener('click', () => csv('customers.csv', [['Name', 'Email', 'Phone', 'Joined']].concat(items.map((c) => [c.name, c.email, c.phone, c.createdAt]))));
  });

  VIEWS['biz-shipping'] = guarded('biz-shipping', async () => {
    const orders = await getOrders();
    const ready = orders.filter((o) => o.paymentStatus === 'Paid' && TO_SHIP.includes(o.orderStatus));
    const moving = orders.filter((o) => o.orderStatus === 'Shipped');
    view().innerHTML = head('Shipping', 'Paid orders waiting to be packed and sent, and parcels on the way.') +
      `<div class="cards">${card(ready.length, 'To pack & ship')}${card(moving.length, 'On the way')}${card(orders.filter((o) => o.orderStatus === 'Delivered').length, 'Delivered')}</div>
      ${tableT('To pack &amp; ship', ORDER_COLS, ready.map(orderRow), 'Nothing to ship right now.')}
      ${tableT('On the way', ORDER_COLS, moving.map(orderRow), 'No parcels on the way.')}
      <div style="margin-top:16px">${notConfigured('Courier booking & live tracking', 'Needs a Shiprocket / Delhivery / Blue Dart account and API key. Until then, add the courier and tracking number on each order by hand.')}</div>`;
  });

  VIEWS['biz-finance'] = guarded('biz-finance', async () => {
    const orders = await getOrders();
    const sum = (f) => orders.filter(f).reduce((n, o) => n + total(o), 0);
    const paid = orders.filter((o) => o.paymentStatus === 'Paid');
    view().innerHTML = head('Finance & payments', 'Money received and waiting, from real orders.', '<button class="btn" id="fin-csv">Export payments CSV</button>') +
      `<div class="cards">${card(money(sum((o) => o.paymentStatus === 'Paid')), 'Received')}${card(money(sum((o) => ['Pending', 'Awaiting payment'].includes(o.paymentStatus))), 'Waiting for payment')}
        ${card(money(sum((o) => o.paymentStatus === 'Refunded')), 'Refunded')}${card(paid.length ? money(Math.round(sum((o) => o.paymentStatus === 'Paid') / paid.length)) : '—', 'Average paid order')}</div>
      ${tableT('Paid orders', ORDER_COLS, paid.map(orderRow), 'No payments received yet.')}
      <div style="margin-top:16px">${notConfigured('GST invoices & accounting', 'Needs your GSTIN and the invoice format from your chartered accountant before invoices can be generated.')}</div>`;
    $('#fin-csv').addEventListener('click', () => csv('payments.csv', [['Order', 'Date', 'Customer', 'Amount', 'Payment', 'Method', 'Razorpay ID']]
      .concat(orders.map((o) => [o.orderId, o.orderDate, o.customer && o.customer.name, total(o), o.paymentStatus, o.paymentMethod, o.razorpayPaymentId]))));
  });

  // Inventory reads the public catalogue file, so it needs no PIN
  VIEWS['biz-inventory'] = async () => {
    const P = await getProducts();
    const out = P.filter((p) => p.stockStatus === 'Out of Stock');
    const by = {}; P.forEach((p) => { const k = p.stockStatus || 'In Stock'; by[k] = (by[k] || 0) + 1; });
    view().innerHTML = head('Inventory', 'Stock status of every product. Change stock on the product page.') +
      `<div class="cards">${Object.entries(by).map(([k, n]) => card(n, k, 'products')).join('')}${card(P.filter((p) => p.status === 'draft').length, 'Hidden (draft)', 'products')}</div>
      ${tableT('Out of stock', ['Product', 'SKU', 'Category', 'Price'], out.map((p) => `<tr class="row" data-edit="${esc(p.id)}"><td><b>${esc(p.name)}</b></td><td>${esc(p.sku || '—')}</td><td>${esc(p.category || '')}</td><td>${money(p.price)}</td></tr>`), 'All products are in stock.')}
      <div style="margin-top:16px">${notConfigured('Stock quantities, suppliers & barcodes', 'Today each product is In stock / Out of stock. Counting units (auto-reduce on sale) is the next step and needs a quantity for every product.')}</div>`;
  };

  VIEWS['biz-marketing'] = guarded('biz-marketing', async () => {
    const [{ items }, coupons] = await Promise.all([api('/admin/subscribers'), fetch('/data/coupons.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}))]);
    const C = Object.values(coupons || {});
    view().innerHTML = head('Marketing', 'Newsletter subscribers and discount codes.', '<button class="btn" id="sub-csv">Export subscribers</button>') +
      `<div class="cards">${card(items.length, 'Newsletter subscribers')}${card(C.length, 'Discount codes')}</div>
      ${tableT('Discount codes', ['Code', 'Discount'], C.map((c) => `<tr><td><b>${esc(c.code)}</b></td><td>${c.discountPercent ? esc(c.discountPercent) + '%' : money(c.flatDiscountINR)}</td></tr>`), 'No discount codes.')}
      ${tableT('Subscribers', ['Email', 'Source', 'Date'], items.map((s) => `<tr><td>${esc(s.email)}</td><td>${esc(s.source || '')}</td><td>${esc(date(s.subscribedAt))}</td></tr>`), 'No subscribers yet.')}
      <div style="margin-top:16px">${notConfigured('Email campaigns', 'Needs an email service (e.g. Brevo, Mailchimp) account and API key.')}${notConfigured('Meta & Google Ads', 'Needs your ad accounts and a budget you approve. No money is ever spent automatically.')}</div>`;
    $('#sub-csv').addEventListener('click', () => csv('subscribers.csv', [['Email', 'Source', 'Date']].concat(items.map((s) => [s.email, s.source, s.subscribedAt]))));
  });

  VIEWS['biz-support'] = guarded('biz-support', async () => {
    const [appts, custom] = await Promise.all([api('/appointments'), api('/admin/custom-orders')]);
    const A = appts.appointments || appts.items || appts.data || [];
    const B = custom.items || [];
    view().innerHTML = head('Support & requests', 'Appointment bookings and custom jewellery requests from the website.') +
      `<div class="cards">${card(A.length, 'Appointments')}${card(B.length, 'Custom requests')}</div>
      ${tableT('Custom jewellery requests', ['Request', 'Customer', 'Wants', 'Budget'], B.map((r) => `<tr><td><b>${esc(r.id)}</b><br><span class="small muted">${esc(date(r.createdAt))}</span></td><td>${esc(r.fullName)}<br><span class="small muted">${esc(r.phone || '')} ${esc(r.email || '')}</span></td><td>${esc([r.jewelleryType, r.metalPreference].filter(Boolean).join(', '))}<br><span class="small muted">${esc((r.description || '').slice(0, 120))}</span></td><td>${esc(r.budgetBand || '')}</td></tr>`), 'No custom requests yet.')}
      ${tableT('Appointments', ['Booking', 'Client', 'When', 'Type'], A.map((r) => `<tr><td><b>${esc(r.id)}</b></td><td>${esc(r.name)}<br><span class="small muted">${esc(r.phone || '')} ${esc(r.email || '')}</span></td><td>${esc([r.date, r.time].filter(Boolean).join(' '))}</td><td>${esc(r.type || r.service || '')}</td></tr>`), 'No appointments yet.')}`;
  });

  VIEWS['biz-reports'] = guarded('biz-reports', async () => {
    const paid = (await getOrders()).filter((o) => o.paymentStatus === 'Paid');
    const byMonth = {}; const byProduct = {};
    paid.forEach((o) => {
      const m = String(o.orderDate || '').slice(0, 7) || 'unknown'; byMonth[m] = (byMonth[m] || 0) + total(o);
      (o.items || []).forEach((i) => { const p = byProduct[i.name] || (byProduct[i.name] = { qty: 0, sum: 0 }); p.qty += Number(i.quantity) || 0; p.sum += Number(i.itemTotal) || 0; });
    });
    const months = Object.entries(byMonth).sort(); const max = Math.max(1, ...months.map((m) => m[1]));
    view().innerHTML = head('Reports', 'Sales from paid orders only.') +
      `<div class="dash"><div class="panel"><h3>Sales by month</h3>${months.length ? `<div class="bars">${months.map(([m, v]) => `<div class="bar" style="text-transform:none"><span>${esc(m)}</span><div class="track"><div class="fill" style="width:${(v / max) * 100}%"></div></div><b style="width:auto">${money(v)}</b></div>`).join('')}</div>` : '<p class="muted" style="margin:0">No paid orders yet.</p>'}</div>
      <div>${tableT('Best sellers', ['Product', 'Sold', 'Sales'], Object.entries(byProduct).sort((a, b) => b[1].sum - a[1].sum).slice(0, 10).map(([n, p]) => `<tr><td><b>${esc(n)}</b></td><td>${p.qty}</td><td>${money(p.sum)}</td></tr>`), 'No sales yet.')}</div></div>
      <div style="margin-top:16px">${notConfigured('Website visitors (Google Analytics 4)', 'Needs a GA4 property. Visitors, traffic sources and conversion rate appear here once it is connected.')}</div>`;
  });

  VIEWS['biz-alerts'] = guarded('biz-alerts', async () => {
    const [orders, P] = await Promise.all([getOrders(), getProducts()]);
    const day = 864e5; const now = Date.now();
    const alerts = [];
    orders.filter((o) => o.paymentStatus === 'Paid' && TO_SHIP.includes(o.orderStatus)).forEach((o) => alerts.push(['Ship', `Paid order ${o.orderId} is waiting to be shipped`, o.orderId]));
    orders.filter((o) => ['Pending', 'Awaiting payment'].includes(o.paymentStatus) && now - new Date(o.orderDate) > day && !/cancel/i.test(o.orderStatus)).forEach((o) => alerts.push(['Payment', `Order ${o.orderId} has waited more than a day for payment`, o.orderId]));
    P.filter((p) => p.stockStatus === 'Out of Stock' && p.status !== 'draft').forEach((p) => alerts.push(['Stock', `${p.name} is out of stock but still shown on the website`, null, p.id]));
    view().innerHTML = head('Notifications', 'Things that need your attention, worked out from real orders and products.') +
      table(['Type', 'What'], alerts.map(([t, msg, oid, pid]) => `<tr class="row" ${oid ? `data-view="biz-order" data-arg="${esc(oid)}"` : `data-edit="${esc(pid)}"`}><td>${pill(t)}</td><td>${esc(msg)}</td></tr>`), 'All clear. Nothing needs your attention.') +
      `<div style="margin-top:16px">${notConfigured('Email / WhatsApp / push alerts', 'Needs an email or WhatsApp Business account. Until then, alerts show only here.')}</div>`;
  });

  VIEWS['biz-settings'] = async () => {
    let health = null;
    try { health = await api('/health'); } catch (e) { /* shown as offline below */ }
    const on = (ok) => (ok ? '<span class="pill published">Connected</span>' : '<span class="pill draft">Not configured</span>');
    view().innerHTML = head('Integrations & settings', 'What is connected, and what each missing piece needs. Nothing is shown as working unless it really is.') +
      `<div class="panel"><h3>Connected</h3><ul class="log">
        <li>Secure server (Vercel): ${health ? '<span class="pill published">Online</span>' : '<span class="pill out">Offline</span>'}</li>
        <li>Database (Neon Postgres): ${on(health && health.database && health.database.status === 'connected')}</li>
        <li>Online payment (Razorpay): ${on(health && health.paymentGateway && health.paymentGateway.configured)}</li>
        <li>Website editor (GitHub): <span class="pill published">Connected</span></li>
        <li>Business sign-in this session: ${sessionStorage.getItem(TOKEN_KEY) ? '<span class="pill published">Signed in</span> <button class="btn btn-sm" id="pin-out" type="button">Sign out of business</button>' : '<span class="pill draft">Not signed in</span>'}</li></ul></div>
      ${notConfigured('AI assistant & automation', 'Needs an AI provider key and a monthly budget you approve. Every AI action will wait for your approval.')}
      ${notConfigured('WhatsApp Business, SMS & email', 'Needs a WhatsApp Business API provider, an SMS gateway and an email (SMTP) account.')}
      ${notConfigured('International (currencies, PayPal/Stripe, DHL/FedEx)', 'Needs the payment and courier accounts for the countries you want to sell in.')}
      ${notConfigured('Multiple staff accounts & roles', 'Today there is one owner login. Staff accounts with limited access are a later step.')}`;
    const b = $('#pin-out'); if (b) b.addEventListener('click', () => { sessionStorage.removeItem(TOKEN_KEY); VIEWS['biz-settings'](); toast('Signed out of business sections'); });
  };

  window.HJ_EXTRA_VIEWS = VIEWS;

  // ---------- Sidebar group (added after the existing menu, which stays as it is) ----------
  const ICON = (d) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${d}</svg>`;
  const ITEMS = [
    ['biz-overview', 'Business overview', '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'],
    ['biz-orders', 'Orders', '<path d="M6 2h12l2 6H4z"/><path d="M4 8v12h16V8M9 12h6"/>'],
    ['biz-customers', 'Customers', '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c1-4 4-6 7-6s6 2 7 6"/><path d="M16 4a3.5 3.5 0 0 1 0 7M18 14c2 1 3.5 3 4 6"/>'],
    ['biz-shipping', 'Shipping', '<path d="M1 6h13v10H1zM14 10h4l4 4v2h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>'],
    ['biz-finance', 'Finance & payments', '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'],
    ['biz-inventory', 'Inventory', '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>'],
    ['biz-marketing', 'Marketing', '<path d="M3 11v2a2 2 0 0 0 2 2h2l5 4V5L7 9H5a2 2 0 0 0-2 2z"/><path d="M16 8a5 5 0 0 1 0 8"/>'],
    ['biz-support', 'Support & requests', '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'],
    ['biz-reports', 'Reports', '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'],
    ['biz-alerts', 'Notifications', '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'],
    ['biz-settings', 'Integrations & settings', '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>']
  ];
  const nav = document.querySelector('.side nav');
  if (nav) {
    const group = document.createElement('nav');
    group.setAttribute('aria-label', 'Business sections');
    group.innerHTML = '<p class="small" style="margin:16px 12px 6px;letter-spacing:.12em;text-transform:uppercase;opacity:.6">Business</p>' +
      ITEMS.map(([v, label, d]) => `<button data-view="${v}">${ICON(d)}${label}</button>`).join('');
    nav.after(group);
  }

  // Rows that open one order carry the order ID in data-arg; the shared router only passes the view name
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-view="biz-order"][data-arg]');
    if (!t) return;
    e.preventDefault(); e.stopImmediatePropagation();
    document.querySelectorAll('.side nav button').forEach((b) => { if (b.dataset.view === 'biz-orders') b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    VIEWS['biz-order'](t.dataset.arg);
  }, true);
})();
