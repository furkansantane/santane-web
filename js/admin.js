// ===== SANTANE ADMIN =====
document.addEventListener('DOMContentLoaded', () => {
  if (!SantaneData.isLoggedIn()) {
    showLogin();
  } else {
    showDashboard();
  }
});

function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminPanel').style.display = 'none';
}

async function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const ok = await SantaneData.login(user, pass);
  if (ok) {
    SantaneData.setLoggedIn();
    showDashboard();
  } else {
    const err = document.getElementById('loginError');
    err.style.display = 'block';
    err.textContent = 'Kullanıcı adı veya şifre hatalı!';
  }
}

function handleLogout() {
  SantaneData.logout();
  location.reload();
}

async function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'grid';
  await switchSection('dashboard');
}

async function switchSection(name) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  const section = document.getElementById('section-' + name);
  if (section) section.classList.add('active');
  const link = document.querySelector(`.sidebar-nav a[data-section="${name}"]`);
  if (link) link.classList.add('active');
  if (name === 'dashboard') await renderStats();
  if (name === 'products') await renderProductTable();
  if (name === 'categories') await renderCategoryTable();
  document.querySelector('.sidebar')?.classList.remove('open');
}

async function renderStats() {
  const prods = await SantaneData.getProducts();
  const cats = await SantaneData.getCategories();
  document.getElementById('statProducts').textContent = prods.length;
  document.getElementById('statCategories').textContent = cats.length;
  const total = prods.reduce((s, p) => s + (Number(p.price) || 0), 0);
  document.getElementById('statValue').textContent = '₺' + total.toLocaleString('tr-TR');
}

// ===== PRODUCTS =====
let cachedCategories = [];

async function renderProductTable() {
  const prods = await SantaneData.getProducts();
  cachedCategories = await SantaneData.getCategories();
  const tbody = document.getElementById('productsTbody');
  if (!tbody) return;
  tbody.innerHTML = prods.map(p => {
    const catName = cachedCategories.find(c => c.id === p.categoryId)?.name || '';
    return `<tr>
      <td><img class="prod-img" src="${p.image}" alt="${p.name}" onerror="this.style.display='none'"></td>
      <td>${p.name}</td>
      <td>${catName}</td>
      <td style="color:var(--gold);font-weight:600">₺${Number(p.price).toLocaleString('tr-TR')}</td>
      <td class="actions">
        <button class="btn-sm" onclick="editProduct('${p.id}')">Düzenle</button>
        <button class="btn-sm danger" onclick="confirmDeleteProduct('${p.id}')">Sil</button>
      </td>
    </tr>`;
  }).join('');
}

let editingProductId = null;

async function openAddProduct() {
  editingProductId = null;
  document.getElementById('productModalTitle').textContent = 'Yeni Ürün Ekle';
  document.getElementById('prodName').value = '';
  document.getElementById('prodPrice').value = '';
  document.getElementById('prodDesc').value = '';
  document.getElementById('prodImageUrl').value = '';
  document.getElementById('prodImage').value = '';
  document.getElementById('imgPreview').style.display = 'none';
  await populateCategorySelect();
  openModal('productModal');
}

async function editProduct(id) {
  const p = await SantaneData.getProduct(id);
  if (!p) return;
  editingProductId = id;
  document.getElementById('productModalTitle').textContent = 'Ürün Düzenle';
  document.getElementById('prodName').value = p.name;
  document.getElementById('prodPrice').value = p.price;
  document.getElementById('prodDesc').value = p.description || '';
  document.getElementById('prodImageUrl').value = p.image || '';
  document.getElementById('prodImage').value = '';
  const preview = document.getElementById('imgPreview');
  if (p.image) { preview.src = p.image; preview.style.display = 'block'; }
  else { preview.style.display = 'none'; }
  await populateCategorySelect(p.categoryId);
  openModal('productModal');
}

async function populateCategorySelect(selectedId) {
  const cats = await SantaneData.getCategories();
  const sel = document.getElementById('prodCategory');
  sel.innerHTML = cats.map(c =>
    `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.name}</option>`
  ).join('');
}

async function saveProduct() {
  const name = document.getElementById('prodName').value.trim();
  const price = document.getElementById('prodPrice').value;
  const categoryId = document.getElementById('prodCategory').value;
  const description = document.getElementById('prodDesc').value.trim();
  const imageUrl = document.getElementById('prodImageUrl').value.trim();
  const fileInput = document.getElementById('prodImage');

  if (!name || !price || !categoryId) { toast('Lütfen tüm alanları doldurun.', true); return; }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('categoryId', categoryId);
  formData.append('description', description);
  if (fileInput.files && fileInput.files[0]) {
    formData.append('image', fileInput.files[0]);
  } else if (imageUrl) {
    formData.append('imageUrl', imageUrl);
  }

  try {
    if (editingProductId) {
      await SantaneData.updateProduct(editingProductId, formData);
      toast('Ürün güncellendi!');
    } else {
      await SantaneData.addProduct(formData);
      toast('Ürün eklendi!');
    }
    closeAdminModal('productModal');
    await renderProductTable();
    await renderStats();
  } catch (err) {
    toast('Hata oluştu: ' + err.message, true);
  }
}

async function confirmDeleteProduct(id) {
  const p = await SantaneData.getProduct(id);
  if (p && confirm(`"${p.name}" ürününü silmek istediğinize emin misiniz?`)) {
    await SantaneData.deleteProduct(id);
    toast('Ürün silindi!');
    await renderProductTable();
    await renderStats();
  }
}

// ===== CATEGORIES =====
async function renderCategoryTable() {
  const cats = await SantaneData.getCategories();
  const allProds = await SantaneData.getProducts();
  const tbody = document.getElementById('categoriesTbody');
  if (!tbody) return;
  tbody.innerHTML = cats.map(c => {
    const count = allProds.filter(p => p.categoryId === c.id).length;
    return `<tr>
      <td style="font-weight:500">${c.name}</td>
      <td>${count} ürün</td>
      <td class="actions">
        <button class="btn-sm" onclick="editCategory('${c.id}')">Düzenle</button>
        <button class="btn-sm danger" onclick="confirmDeleteCategory('${c.id}')">Sil</button>
      </td>
    </tr>`;
  }).join('');
}

let editingCategoryId = null;

function openAddCategory() {
  editingCategoryId = null;
  document.getElementById('categoryModalTitle').textContent = 'Yeni Kategori Ekle';
  document.getElementById('catName').value = '';
  openModal('categoryModal');
}

async function editCategory(id) {
  const cats = await SantaneData.getCategories();
  const c = cats.find(cat => cat.id === id);
  if (!c) return;
  editingCategoryId = id;
  document.getElementById('categoryModalTitle').textContent = 'Kategori Düzenle';
  document.getElementById('catName').value = c.name;
  openModal('categoryModal');
}

async function saveCategory() {
  const name = document.getElementById('catName').value.trim();
  if (!name) { toast('Kategori adı boş olamaz!', true); return; }
  if (editingCategoryId) {
    await SantaneData.updateCategory(editingCategoryId, name);
    toast('Kategori güncellendi!');
  } else {
    await SantaneData.addCategory(name);
    toast('Kategori eklendi!');
  }
  closeAdminModal('categoryModal');
  await renderCategoryTable();
  await renderStats();
}

async function confirmDeleteCategory(id) {
  const cats = await SantaneData.getCategories();
  const c = cats.find(cat => cat.id === id);
  if (c && confirm(`"${c.name}" kategorisini ve altındaki tüm ürünleri silmek istediğinize emin misiniz?`)) {
    await SantaneData.deleteCategory(id);
    toast('Kategori silindi!');
    await renderCategoryTable();
    await renderStats();
  }
}

// ===== JSON EXPORT =====
async function exportJSON() {
  try {
    const data = await SantaneData.exportAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `santane_veriler_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('JSON dosyası indirildi!');
  } catch (err) {
    toast('Export hatası: ' + err.message, true);
  }
}

// ===== HELPERS =====
function previewImage(input) {
  const preview = document.getElementById('imgPreview');
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => { preview.src = e.target.result; preview.style.display = 'block'; };
    reader.readAsDataURL(input.files[0]);
  }
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeAdminModal(id) { document.getElementById(id).classList.remove('active'); }

function toast(msg, isError) {
  const t = document.getElementById('toastEl');
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => { t.className = 'toast'; }, 2500);
}

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
}
