// ===== SANTANE DATA MANAGER (API + localStorage fallback) =====
const SantaneData = (() => {
  // API base URL: empty = same origin (Render.com), or set full URL
  const API = '';

  // --- localStorage fallback for when API is unreachable ---
  function lsGet() {
    try {
      const d = localStorage.getItem('santane_data');
      return d ? JSON.parse(d) : null;
    } catch { return null; }
  }
  function lsSave(data) {
    try { localStorage.setItem('santane_data', JSON.stringify(data)); } catch {}
  }

  // --- API calls with localStorage cache ---
  async function apiGet(url) {
    try {
      const res = await fetch(API + url);
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch (err) {
      console.warn('API unreachable, using localStorage:', err.message);
      return null;
    }
  }

  async function apiPost(url, body, isFormData) {
    const opts = { method: 'POST' };
    if (isFormData) {
      opts.body = body;
    } else {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(API + url, opts);
    return res.json();
  }

  async function apiPut(url, body, isFormData) {
    const opts = { method: 'PUT' };
    if (isFormData) {
      opts.body = body;
    } else {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(API + url, opts);
    return res.json();
  }

  async function apiDelete(url) {
    await fetch(API + url, { method: 'DELETE' });
  }

  // ===== CATEGORIES =====
  async function getCategories() {
    const data = await apiGet('/api/categories');
    if (data) {
      // Cache to localStorage
      const ls = lsGet() || { categories: [], products: [] };
      ls.categories = data;
      lsSave(ls);
      return data;
    }
    // Fallback
    const ls = lsGet();
    return ls ? ls.categories : [];
  }

  async function addCategory(name) {
    const result = await apiPost('/api/categories', { name });
    return result;
  }

  async function updateCategory(id, name) {
    const result = await apiPut('/api/categories/' + id, { name });
    return result;
  }

  async function deleteCategory(id) {
    await apiDelete('/api/categories/' + id);
  }

  // ===== PRODUCTS =====
  async function getProducts(categoryId) {
    const url = categoryId ? '/api/products?categoryId=' + categoryId : '/api/products';
    const data = await apiGet(url);
    if (data) {
      if (!categoryId) {
        const ls = lsGet() || { categories: [], products: [] };
        ls.products = data;
        lsSave(ls);
      }
      return data;
    }
    const ls = lsGet();
    if (!ls) return [];
    return categoryId ? ls.products.filter(p => p.categoryId === categoryId) : ls.products;
  }

  async function getProduct(id) {
    const data = await apiGet('/api/products/' + id);
    if (data) return data;
    const ls = lsGet();
    return ls ? ls.products.find(p => p.id === id) : null;
  }

  async function addProduct(formData) {
    const result = await apiPost('/api/products', formData, true);
    return result;
  }

  async function updateProduct(id, formData) {
    const result = await apiPut('/api/products/' + id, formData, true);
    return result;
  }

  async function deleteProduct(id) {
    await apiDelete('/api/products/' + id);
  }

  // ===== AUTH =====
  async function login(user, pass) {
    try {
      const res = await fetch(API + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      return res.ok;
    } catch { return false; }
  }

  function isLoggedIn() { return sessionStorage.getItem('santane_auth') === 'true'; }
  function setLoggedIn() { sessionStorage.setItem('santane_auth', 'true'); }
  function logout() { sessionStorage.removeItem('santane_auth'); }

  // ===== JSON EXPORT =====
  async function exportAllData() {
    const categories = await getCategories();
    const products = await getProducts();
    return { categories, products, exportDate: new Date().toISOString() };
  }

  return {
    getCategories, addCategory, updateCategory, deleteCategory,
    getProducts, getProduct, addProduct, updateProduct, deleteProduct,
    login, isLoggedIn, setLoggedIn, logout,
    exportAllData
  };
})();
