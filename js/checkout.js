/* =============================================
   SUIT-IT — checkout.js
   Checkout form, order creation, success screen
   ============================================= */

function renderOrderSummary() {
  const items = Cart.get();
  const el = document.getElementById('orderItems');
  if (!el) return;

  if (items.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  el.innerHTML = items.map(item => {
    const icon = item.category === 'shirt' ? '👔' : '👖';
    const imgHTML = `<img src="${item.image}" alt="${item.name}" onerror="this.parentNode.innerHTML='<span class=img-placeholder>${icon}</span>'" loading="lazy">`;
    return `
    <div class="order-item">
      <div class="order-item-img">${imgHTML}</div>
      <div style="flex:1">
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-meta">Size: ${item.size} · Qty: ${item.qty}${item.color ? ` · ${item.color}` : ''}</div>
      </div>
      <div class="order-item-price">${formatBDT(item.price * item.qty)}</div>
    </div>`;
  }).join('');

  const subtotal = Cart.total();
  const total = subtotal + DELIVERY_CHARGE;
  document.getElementById('coSubtotal').textContent = formatBDT(subtotal);
  document.getElementById('coDelivery').textContent = formatBDT(DELIVERY_CHARGE);
  document.getElementById('coTotal').textContent = formatBDT(total);
}

/* --- Generate Order ID --- */
function generateOrderId() {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const orders = JSON.parse(localStorage.getItem('suit_orders') || '[]');
  const todayOrders = orders.filter(o => o.id.includes(dateStr));
  const num = String(todayOrders.length + 1).padStart(3, '0');
  return `ORD-${dateStr}-${num}`;
}

/* --- Validation --- */
function validate(form) {
  let ok = true;
  form.querySelectorAll('[required]').forEach(el => {
    const group = el.closest('.form-group');
    const err = group && group.querySelector('.form-error');
    if (!el.value.trim()) {
      if (group) group.classList.add('error');
      ok = false;
    } else {
      if (group) group.classList.remove('error');
    }
  });
  // Phone validation
  const phone = form.querySelector('#phone');
  if (phone) {
    const val = phone.value.trim();
    if (!/^01[3-9]\d{8}$/.test(val)) {
      phone.closest('.form-group').classList.add('error');
      const err = phone.closest('.form-group').querySelector('.form-error');
      if (err) err.textContent = 'Enter valid BD number (01XXXXXXXXX)';
      ok = false;
    }
  }
  return ok;
}

/* --- Submit Order --- */
function submitOrder(e) {
  e.preventDefault();
  const form = document.getElementById('checkoutForm');
  if (!validate(form)) { showToast('Please fill in all required fields', 'error'); return; }

  const items = Cart.get();
  const orderId = generateOrderId();
  const order = {
    id: orderId,
    date: new Date().toISOString(),
    status: 'Pending',
    customer: {
      name: form.querySelector('#name').value.trim(),
      phone: form.querySelector('#phone').value.trim(),
      district: form.querySelector('#district').value.trim(),
      area: form.querySelector('#area').value.trim(),
      address: form.querySelector('#address').value.trim(),
      note: form.querySelector('#note').value.trim()
    },
    items,
    subtotal: Cart.total(),
    delivery: DELIVERY_CHARGE,
    total: Cart.total() + DELIVERY_CHARGE,
    payment: 'Cash on Delivery'
  };

  const orders = JSON.parse(localStorage.getItem('suit_orders') || '[]');
  orders.unshift(order);
  localStorage.setItem('suit_orders', JSON.stringify(orders));
  Cart.clear();

  // Show success
  document.getElementById('checkoutSection').style.display = 'none';
  const ss = document.getElementById('successScreen');
  ss.style.display = 'block';
  document.getElementById('successOrderId').textContent = orderId;
  document.getElementById('successTotal').textContent = formatBDT(order.total);
}

document.addEventListener('DOMContentLoaded', () => {
  renderOrderSummary();
  const form = document.getElementById('checkoutForm');
  if (form) form.addEventListener('submit', submitOrder);
});
