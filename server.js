const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'prod_' + Date.now() + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Helper: read/write data
function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { categories: [], products: [] }; }
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}
function uid() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
}

// ===== AUTH =====
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'furkans' && password === 'furkans.21') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Hatalı giriş bilgileri' });
  }
});

// ===== CATEGORIES =====
app.get('/api/categories', (req, res) => {
  res.json(readData().categories);
});

app.post('/api/categories', (req, res) => {
  const data = readData();
  const cat = {
    id: uid(),
    name: req.body.name,
    slug: req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-ğüşıöç]/g, '')
  };
  data.categories.push(cat);
  writeData(data);
  res.json(cat);
});

app.put('/api/categories/:id', (req, res) => {
  const data = readData();
  const cat = data.categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ message: 'Kategori bulunamadı' });
  cat.name = req.body.name;
  cat.slug = req.body.name.toLowerCase().replace(/\s+/g, '-');
  writeData(data);
  res.json(cat);
});

app.delete('/api/categories/:id', (req, res) => {
  const data = readData();
  data.categories = data.categories.filter(c => c.id !== req.params.id);
  data.products = data.products.filter(p => p.categoryId !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// ===== PRODUCTS =====
app.get('/api/products', (req, res) => {
  const data = readData();
  let products = data.products;
  if (req.query.categoryId) {
    products = products.filter(p => p.categoryId === req.query.categoryId);
  }
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const p = readData().products.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ message: 'Ürün bulunamadı' });
  res.json(p);
});

app.post('/api/products', upload.single('image'), (req, res) => {
  const data = readData();
  const product = {
    id: uid(),
    name: req.body.name,
    price: Number(req.body.price),
    categoryId: req.body.categoryId,
    description: req.body.description || '',
    image: req.file ? 'uploads/' + req.file.filename : (req.body.imageUrl || ''),
    createdAt: new Date().toISOString()
  };
  data.products.push(product);
  writeData(data);
  res.json(product);
});

app.put('/api/products/:id', upload.single('image'), (req, res) => {
  const data = readData();
  const idx = data.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Ürün bulunamadı' });
  const existing = data.products[idx];
  existing.name = req.body.name || existing.name;
  existing.price = req.body.price ? Number(req.body.price) : existing.price;
  existing.categoryId = req.body.categoryId || existing.categoryId;
  existing.description = req.body.description ?? existing.description;
  if (req.file) existing.image = 'uploads/' + req.file.filename;
  writeData(data);
  res.json(existing);
});

app.delete('/api/products/:id', (req, res) => {
  const data = readData();
  data.products = data.products.filter(p => p.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// ===== CATEGORY NAME HELPER =====
app.get('/api/category-name/:id', (req, res) => {
  const cat = readData().categories.find(c => c.id === req.params.id);
  res.json({ name: cat ? cat.name : '' });
});

// ===== CATCH-ALL: serve index.html =====
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

app.listen(PORT, () => {
  console.log(`Santane server running on http://localhost:${PORT}`);
});
