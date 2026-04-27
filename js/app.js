// ===== SANTANE APP =====
const WHATSAPP_NUMBER = '905330590321';
let allCategories = [];

document.addEventListener('DOMContentLoaded', async () => {
  await renderCategories();
  await renderProducts();
  initHamburger();
  initScrollAnimations();
  initHeroParallax();
});

// ===== CATEGORIES =====
async function renderCategories() {
  const bar = document.getElementById('categoryBar');
  if (!bar) return;
  allCategories = await SantaneData.getCategories();
  let html = '<button class="cat-btn active" data-cat="all">Tümü</button>';
  allCategories.forEach(c => {
    html += `<button class="cat-btn" data-cat="${c.id}">${c.name}</button>`;
  });
  bar.innerHTML = html;

  bar.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      bar.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await renderProducts(btn.dataset.cat);
    });
  });
}

function getCatNameLocal(id) {
  const c = allCategories.find(cat => cat.id === id);
  return c ? c.name : '';
}

// ===== PRODUCTS =====
async function renderProducts(categoryId) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const catParam = (!categoryId || categoryId === 'all') ? null : categoryId;
  const products = await SantaneData.getProducts(catParam);

  if (products.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;padding:60px 0;">Bu kategoride henüz ürün bulunmuyor.</p>';
    return;
  }

  grid.innerHTML = products.map((p, i) => {
    const catName = getCatNameLocal(p.categoryId);
    return `
      <div class="product-card animate-on-scroll stagger-${(i % 4) + 1}" onclick="openProductModal('${p.id}')">
        <div class="product-img-wrap">
          <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22><rect fill=%22%23141414%22 width=%22400%22 height=%22400%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%23333%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2216%22>Görsel Yok</text></svg>'">
        </div>
        <div class="product-info">
          <div class="product-category">${catName}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-desc">${p.description}</div>
          <div class="product-bottom">
            <span class="product-price">₺${Number(p.price).toLocaleString('tr-TR')}</span>
            <button class="btn-wa" onclick="event.stopPropagation();orderWhatsApp('${p.name}','${p.price}')">
              <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Sipariş
            </button>
          </div>
        </div>
      </div>`;
  }).join('');

  initScrollAnimations();
}

// ===== MODAL =====
async function openProductModal(id) {
  const p = await SantaneData.getProduct(id);
  if (!p) return;
  const catName = getCatNameLocal(p.categoryId);
  const overlay = document.getElementById('productModal');
  overlay.querySelector('.modal-img').src = p.image;
  overlay.querySelector('.modal-img').alt = p.name;
  overlay.querySelector('.modal-cat').textContent = catName;
  overlay.querySelector('.modal-name').textContent = p.name;
  overlay.querySelector('.modal-price').textContent = '₺' + Number(p.price).toLocaleString('tr-TR');
  overlay.querySelector('.modal-desc').textContent = p.description;
  overlay.querySelector('.modal-wa-btn').onclick = () => orderWhatsApp(p.name, p.price);
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('productModal').classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ===== WHATSAPP ORDER =====
function orderWhatsApp(name, price) {
  const msg = encodeURIComponent(`Merhaba, "${name}" (₺${Number(price).toLocaleString('tr-TR')}) ürünü hakkında bilgi almak istiyorum.`);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
}

// ===== HAMBURGER =====
function initHamburger() {
  const btn = document.getElementById('hamburgerBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    menu.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
  });
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      btn.classList.remove('active');
      menu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.animate-on-scroll:not(.visible)').forEach(el => observer.observe(el));
}

// ===== HERO PARALLAX =====
function initHeroParallax() {
  const heroBg = document.querySelector('.hero-bg');
  if (!heroBg) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      heroBg.style.transform = `scale(1.05) translateY(${y * 0.15}px)`;
    }
  }, { passive: true });
}
