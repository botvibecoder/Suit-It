/* =============================================
   SUIT-IT — app.js
   Shared utilities, cart logic, toast system
   ============================================= */

const DELIVERY_CHARGE = 80;
const STORE_NAME = "Suit-It";

/* --- Cart --- */
const Cart = {
  get() { return JSON.parse(localStorage.getItem('suit_cart') || '[]'); },
  save(items) { localStorage.setItem('suit_cart', JSON.stringify(items)); updateCartBadge(); },
  add(product, size, color, qty = 1) {
    const items = this.get();
    const key = `${product.id}-${size}-${color}`;
    const existing = items.find(i => i.key === key);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, 10);
    } else {
      items.push({ key, id: product.id, name: product.name, category: product.category, price: product.price, image: product.image, size, color, qty });
    }
    this.save(items);
    showToast(`${product.name} added to cart ✓`, 'success');
  },
  remove(key) { this.save(this.get().filter(i => i.key !== key)); },
  updateQty(key, qty) {
    const items = this.get();
    const item = items.find(i => i.key === key);
    if (item) { item.qty = Math.max(1, Math.min(qty, 10)); this.save(items); }
  },
  total() { return this.get().reduce((s, i) => s + i.price * i.qty, 0); },
  count() { return this.get().reduce((s, i) => s + i.qty, 0); },
  clear() { localStorage.removeItem('suit_cart'); updateCartBadge(); }
};

/* --- Products loader --- */
let _products = null;
async function loadProducts() {
  if (_products) return _products;
  // Check admin-added products in localStorage
  const local = localStorage.getItem('suit_products');
  if (local) { _products = JSON.parse(local); return _products; }
  try {
    const r = await fetch('data/products.json');
    _products = await r.json();
    return _products;
  } catch (e) {
    console.error('Failed to load products', e);
    return [];
  }
}

/* --- Toast --- */
function showToast(msg, type = '') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast${type ? ' ' + type : ''}`;
  t.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span> ${msg}`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/* --- Currency --- */
function formatBDT(amount) {
  return '৳' + Number(amount).toLocaleString('en-BD');
}

/* --- Discount % --- */
function discountPct(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((oldPrice - price) / oldPrice * 100);
}

/* --- Cart badge update --- */
function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const count = Cart.count();
  badges.forEach(b => {
    b.textContent = count;
    b.classList.toggle('show', count > 0);
  });
}

/* --- Product card HTML --- */
function productCardHTML(p) {
  const disc = discountPct(p.price, p.oldPrice);
  const imgContent = `<img src="${p.image}" alt="${p.name}" onerror="this.parentNode.innerHTML='<span class=img-placeholder>${p.category === 'shirt' ? '👔' : '👖'}</span>'" loading="lazy">`;
  return `
  <div class="product-card" data-id="${p.id}">
    <div class="product-img" onclick="goToProduct(${p.id})">
      ${imgContent}
      ${disc > 0 ? `<span class="product-badge">-${disc}%</span>` : ''}
      ${!p.stock ? `<span class="product-badge out-badge">Out of Stock</span>` : ''}
    </div>
    <div class="product-info">
      <div class="product-cat">${p.category === 'shirt' ? 'Shirt' : 'Pant'}</div>
      <div class="product-name" onclick="goToProduct(${p.id})">${p.name}</div>
      <div class="product-price">
        <span class="price-current">${formatBDT(p.price)}</span>
        ${p.oldPrice ? `<span class="price-old">${formatBDT(p.oldPrice)}</span>` : ''}
      </div>
      <div class="product-sizes">${p.sizes.map(s => `<span class="size-tag">${s}</span>`).join('')}</div>
      <button class="add-cart-btn" onclick="quickAddToCart(${p.id})" ${!p.stock ? 'disabled' : ''}>${p.stock ? 'Add to Cart' : 'Out of Stock'}</button>
    </div>
  </div>`;
}

/* --- Navigate to product detail --- */
function goToProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

/* --- Quick add to cart (redirect if multiple sizes/colors) --- */
async function quickAddToCart(id) {
  const products = await loadProducts();
  const p = products.find(x => x.id === id);
  if (!p || !p.stock) return;
  if (p.sizes.length === 1 && p.colors.length === 1) {
    Cart.add(p, p.sizes[0], p.colors[0], 1);
  } else {
    goToProduct(id);
    showToast('Please select size & color', '');
  }
}

/* --- Header & back-to-top setup --- */
function initUI() {
  updateCartBadge();

  // Mobile menu
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => mobileNav.classList.toggle('open'));
  }

  // Search toggle
  const searchBtn = document.querySelector('.search-toggle');
  const searchBar = document.querySelector('.search-bar');
  if (searchBtn && searchBar) {
    searchBtn.addEventListener('click', () => searchBar.classList.toggle('open'));
    const inp = searchBar.querySelector('input');
    if (inp) inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = inp.value.trim();
        if (q) window.location.href = `products.html?q=${encodeURIComponent(q)}`;
      }
    });
  }

  // Back to top
  const btn = document.getElementById('backTop');
  if (btn) {
    window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 300));
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // Active nav link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a, .mobile-nav a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
}

/* --- Confirm dialog --- */
function confirmDialog(msg, onConfirm) {
  const overlay = document.getElementById('confirmModal');
  const msgEl = document.getElementById('confirmMsg');
  const yesBtn = document.getElementById('confirmYes');
  const noBtn = document.getElementById('confirmNo');
  if (!overlay) return onConfirm(); // fallback
  msgEl.textContent = msg;
  overlay.classList.add('open');
  const close = () => overlay.classList.remove('open');
  yesBtn.onclick = () => { close(); onConfirm(); };
  noBtn.onclick = close;
}

document.addEventListener('DOMContentLoaded', initUI);
