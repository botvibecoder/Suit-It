/* =============================================
   SUIT-IT — cart.js
   Shopping cart page
   ============================================= */

function renderCart() {
  const items = Cart.get();
  const itemsEl = document.getElementById('cartItems');
  const summaryEl = document.getElementById('cartSummary');
  const emptyEl = document.getElementById('cartEmpty');

  if (!itemsEl) return;

  if (items.length === 0) {
    itemsEl.innerHTML = '';
    if (summaryEl) summaryEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (summaryEl) summaryEl.style.display = 'block';

  itemsEl.innerHTML = items.map(item => {
    const icon = item.category === 'shirt' ? '👔' : '👖';
    const imgHTML = `<img src="${item.image}" alt="${item.name}" onerror="this.parentNode.innerHTML='<span class=img-placeholder>${icon}</span>'" loading="lazy">`;
    return `
    <div class="cart-item" data-key="${item.key}">
      <div class="cart-item-img">${imgHTML}</div>
      <div>
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">Size: ${item.size} ${item.color ? `· ${item.color}` : ''}</div>
        <div class="cart-qty">
          <button class="cart-qty-btn" onclick="changeQty('${item.key}', ${item.qty - 1})">−</button>
          <span class="cart-qty-num">${item.qty}</span>
          <button class="cart-qty-btn" onclick="changeQty('${item.key}', ${item.qty + 1})">+</button>
        </div>
        <div class="cart-item-price" style="margin-top:8px">${formatBDT(item.price * item.qty)}</div>
      </div>
      <button class="remove-btn" onclick="removeItem('${item.key}')" title="Remove">✕</button>
    </div>`;
  }).join('');

  updateSummary(items);
}

function updateSummary(items) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal + DELIVERY_CHARGE;
  document.getElementById('subtotalEl').textContent = formatBDT(subtotal);
  document.getElementById('deliveryEl').textContent = formatBDT(DELIVERY_CHARGE);
  document.getElementById('totalEl').textContent = formatBDT(total);
}

function changeQty(key, qty) {
  if (qty < 1) { removeItem(key); return; }
  Cart.updateQty(key, qty);
  renderCart();
}

function removeItem(key) {
  Cart.remove(key);
  renderCart();
  showToast('Item removed from cart');
}

function clearCart() {
  confirmDialog('Clear all items from cart?', () => {
    Cart.clear();
    renderCart();
  });
}

document.addEventListener('DOMContentLoaded', renderCart);
