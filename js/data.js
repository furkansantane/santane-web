// ===== SANTANE DATA MANAGER (API Version) =====
const SantaneData = (() => {
  const API = '';

  async function getCategories() {
    const res = await fetch(API + '/api/categories');
    return res.json();
  }

  async function addCategory(name) {
    const res = await fetch(API + '/api/categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return res.json();
  }

  async function updateCategory(id, name) {
    const res = await fetch(API + '/api/categories/' + id, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return res.json();
  }

  async function deleteCategory(id) {
    await fetch(API + '/api/categories/' + id, { method: 'DELETE' });
  }

  async function getProducts(categoryId) {
    const url = categoryId ? API + '/api/products?categoryId=' + categoryId : API + '/api/products';
    const res = await fetch(url);
    return res.json();
  }

  async function getProduct(id) {
    const res = await fetch(API + '/api/products/' + id);
    return res.json();
  }

  async function addProduct(formData) {
    const res = await fetch(API + '/api/products', { method: 'POST', body: formData });
    return res.json();
  }

  async function updateProduct(id, formData) {
    const res = await fetch(API + '/api/products/' + id, { method: 'PUT', body: formData });
    return res.json();
  }

  async function deleteProduct(id) {
    await fetch(API + '/api/products/' + id, { method: 'DELETE' });
  }

  async function getCategoryName(id) {
    const res = await fetch(API + '/api/category-name/' + id);
    const data = await res.json();
    return data.name;
  }

  async function login(user, pass) {
    try {
      const res = await fetch(API + '/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      return res.ok;
    } catch { return false; }
  }

  function isLoggedIn() { return sessionStorage.getItem('santane_auth') === 'true'; }
  function setLoggedIn() { sessionStorage.setItem('santane_auth', 'true'); }
  function logout() { sessionStorage.removeItem('santane_auth'); }

  return {
    getCategories, addCategory, updateCategory, deleteCategory,
    getProducts, getProduct, addProduct, updateProduct, deleteProduct,
    getCategoryName, login, isLoggedIn, setLoggedIn, logout
  };
})();
