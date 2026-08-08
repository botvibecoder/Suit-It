/* =============================================
   SUIT-IT — products.js
   Products listing, search, filter, sort
   ============================================= */

let allProducts = [];
let activeCategory = 'all';
let activeSort = 'default';
let activeAvail = 'all';
let searchQuery = '';

async function initProductsPage() {
  allProducts = await loadProducts();

  // Read URL params
  const params = new URLSearchParams(window.location.search);
  if (params.get('q')) searchQuery = params.get('q');
  if (params.get('category')) activeCategory = params.get('category');

  // Set search input value
  const si = document.getElementById('searchInput');
  if (si && searchQuery) si.value = searchQuery;

  // Filter buttons
  document.querySelectorAll('[data-cat]').forEach(btn => {
    if (btn.dataset.cat === activeCategory) btn.classList.add('active');
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-cat]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      renderProducts();
    });
  });

  // Sort
  const sortSel = document.getElementById('sortSelect');
  if (sortSel) sortSel.addEventListener('change', e => { activeSort = e.target.value; renderProducts(); });

  // Availability
  document.querySelectorAll('[data-avail]').forEach(r => {
    r.addEventListener('change', () => { activeAvail = r.value; renderProducts(); });
  });

  // Search
  if (si) si.addEventListener('input', e => { searchQuery = e.target.value; renderProducts(); });

  renderProducts();
}

function getFiltered() {
  return allProducts.filter(p => {
    const catOk = activeCategory === 'all' || p.category === activeCategory;
    const availOk = activeAvail === 'all' || (activeAvail === 'in' ? p.stock : !p.stock);
    const q = searchQuery.toLowerCase();
    const searchOk = !q || p.name.toLowerCase().includes(q) || p.category.includes(q);
    return catOk && availOk && searchOk;
  }).sort((a, b) => {
    if (activeSort === 'low') return a.price - b.price;
    if (activeSort === 'high') return b.price - a.price;
    return 0;
  });
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('productCount');
  if (!grid) return;

  const filtered = getFiltered();
  if (countEl) countEl.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><h3>No products found</h3><p>Try adjusting your search or filters.</p><a href="products.html" class="btn btn-outline btn-sm">Clear Filters</a></div>`;
    return;
  }
  grid.innerHTML = filtered.map(productCardHTML).join('');
}

if (document.getElementById('productsGrid')) initProductsPage();
