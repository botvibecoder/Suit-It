/* =============================================
   SUIT-IT — admin.js
   Product management (LocalStorage prototype)
   NOTE: Replace localStorage with API calls for production
   ============================================= */

let adminProducts = [];
let editingId = null;

async function initAdmin() {
  // Load: localStorage override OR json file
  const local = localStorage.getItem('suit_products');
  if (local) {
    adminProducts = JSON.parse(local);
  } else {
    try {
      const r = await fetch('data/products.json');
      adminProducts = await r.json();
    } catch (e) { adminProducts = []; }
  }
  renderAdminTable();
  setupAdminNav();
}

function saveProducts() {
  localStorage.setItem('suit_products', JSON.stringify(adminProducts));
}

/* --- Navigation --- */
function setupAdminNav() {
  document.querySelectorAll('.admin-nav a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.admin-nav a').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
      a.classList.add('active');
      const target = a.dataset.section;
      document.getElementById(target).classList.add('active');
    });
  });
}

/* --- Render table --- */
function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;
  if (adminProducts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--mid);padding:40px">No products yet</td></tr>';
    return;
  }
  tbody.innerHTML = adminProducts.map(p => {
    const icon = p.category === 'shirt' ? '👔' : '👖';
    const imgEl = `<div class="admin-product-img"><img src="${p.image}" alt="" onerror="this.parentNode.innerHTML='<span class=img-placeholder>${icon}</span>'" loading="lazy"></div>`;
    return `
    <tr>
      <td>${imgEl}</td>
      <td><strong>${p.name}</strong></td>
      <td>${formatBDT(p.price)}</td>
      <td style="text-transform:capitalize">${p.category}</td>
      <td class="${p.stock ? 'stock-yes' : 'stock-no'}">${p.stock ? 'In Stock' : 'Out of Stock'}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editProduct(${p.id})" style="margin-right:6px">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

/* --- Add / Edit product --- */
function getFormData() {
  const g = id => document.getElementById(id).value.trim();
  return {
    name: g('pName'),
    category: g('pCategory'),
    price: parseInt(g('pPrice')) || 0,
    oldPrice: parseInt(g('pOldPrice')) || null,
    description: g('pDesc'),
    sizes: g('pSizes').split(',').map(s => s.trim()).filter(Boolean),
    colors: g('pColors').split(',').map(c => c.trim()).filter(Boolean),
    image: g('pImage') || `images/${g('pCategory')}-01.jpg`,
    stock: document.getElementById('pStock').checked,
    featured: document.getElementById('pFeatured').checked
  };
}

function submitProduct(e) {
  e.preventDefault();
  const data = getFormData();
  if (!data.name || !data.price || !data.category) { showToast('Please fill required fields', 'error'); return; }

  if (editingId !== null) {
    const idx = adminProducts.findIndex(p => p.id === editingId);
    if (idx !== -1) { adminProducts[idx] = { ...adminProducts[idx], ...data }; }
    showToast('Product updated ✓', 'success');
    editingId = null;
    document.querySelector('#addProduct h2').textContent = 'Add New Product';
    document.getElementById('submitBtn').textContent = 'Add Product';
  } else {
    const maxId = adminProducts.reduce((m, p) => Math.max(m, p.id), 0);
    data.id = maxId + 1;
    adminProducts.unshift(data);
    showToast('Product added ✓', 'success');
  }

  saveProducts();
  renderAdminTable();
  document.getElementById('productForm').reset();
  document.getElementById('pStock').checked = true;

  // Switch to manage tab
  document.querySelector('[data-section="manageProducts"]').click();
}

function editProduct(id) {
  const p = adminProducts.find(x => x.id === id);
  if (!p) return;
  editingId = id;

  const s = key => document.getElementById(key);
  s('pName').value = p.name;
  s('pCategory').value = p.category;
  s('pPrice').value = p.price;
  s('pOldPrice').value = p.oldPrice || '';
  s('pDesc').value = p.description;
  s('pSizes').value = p.sizes.join(', ');
  s('pColors').value = p.colors.join(', ');
  s('pImage').value = p.image;
  s('pStock').checked = p.stock;
  s('pFeatured').checked = p.featured;

  document.querySelector('#addProduct h2').textContent = 'Edit Product';
  document.getElementById('submitBtn').textContent = 'Update Product';
  document.querySelector('[data-section="addProduct"]').click();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteProduct(id) {
  const p = adminProducts.find(x => x.id === id);
  confirmDialog(`Delete "${p?.name}"? This cannot be undone.`, () => {
    adminProducts = adminProducts.filter(x => x.id !== id);
    saveProducts();
    renderAdminTable();
    showToast('Product deleted');
  });
}

function resetToDefault() {
  confirmDialog('Reset all products to original data? Admin changes will be lost.', () => {
    localStorage.removeItem('suit_products');
    location.reload();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
  const form = document.getElementById('productForm');
  if (form) form.addEventListener('submit', submitProduct);
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', resetToDefault);
});
