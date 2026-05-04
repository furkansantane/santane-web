const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MongoDB Atlas bağlantısı =====
// Render.com Environment Variables'dan alınır
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/santane';
let db;

async function connectDB() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db('santane');
    console.log('✅ MongoDB bağlantısı başarılı');

    // İlk çalıştırmada varsayılan verileri yükle
    const catCount = await db.collection('categories').countDocuments();
    if (catCount === 0) {
      await seedDefaultData();
    }
  } catch (err) {
    console.error('❌ MongoDB bağlantı hatası:', err.message);
    console.log('Fallback: data.json dosyası kullanılacak');
  }
}

// Varsayılan veriler (ilk kurulumda)
async function seedDefaultData() {
  console.log('📦 Varsayılan veriler yükleniyor...');
  const defaultCategories = [
    { _id: 'cat1', name: 'Kehribar', slug: 'kehribar' },
    { _id: 'cat2', name: 'Kuka', slug: 'kuka' },
    { _id: 'cat3', name: 'Oltu Taşı', slug: 'oltu-tasi' },
    { _id: 'cat4', name: 'Özel Koleksiyon', slug: 'ozel-koleksiyon' }
  ];
  const defaultProducts = [
    {
      _id: 'p1', name: 'Altın Kehribar Tesbih', price: 2500,
      categoryId: 'cat1', description: 'Doğal Baltık kehribarından el yapımı 33\'lük tesbih. Altın sarısı tonlarıyla zarafetin simgesi.',
      image: 'assets/images/kehribar1.png', createdAt: new Date().toISOString()
    },
    {
      _id: 'p2', name: 'Damla Kehribar Özel Seri', price: 4200,
      categoryId: 'cat1', description: 'Nadir bulunan damla formlu kehribar tanelerden özenle dizilmiş koleksiyon parçası.',
      image: 'assets/images/kehribar2.png', createdAt: new Date().toISOString()
    },
    {
      _id: 'p3', name: 'Kuka Tesbih Klasik', price: 1800,
      categoryId: 'cat2', description: 'Geleneksel kuka ağacından üretilmiş, doğal dokusuyla öne çıkan klasik 33\'lük tesbih.',
      image: 'assets/images/kuka1.png', createdAt: new Date().toISOString()
    },
    {
      _id: 'p4', name: 'Kuka İşlemeli Tesbih', price: 3500,
      categoryId: 'cat2', description: 'Usta ellerden çıkmış, gümüş işlemeli kuka tesbih. Her tanesi ayrı bir sanat eseri.',
      image: 'assets/images/kuka2.png', createdAt: new Date().toISOString()
    },
    {
      _id: 'p5', name: 'Oltu Taşı Tesbih', price: 2100,
      categoryId: 'cat3', description: 'Erzurum oltu taşından üretilmiş, hafif ve şık 33\'lük tesbih. Siyahın asaleti.',
      image: 'assets/images/oltu1.png', createdAt: new Date().toISOString()
    },
    {
      _id: 'p6', name: 'Oltu Taşı Gümüş İşlemeli', price: 5800,
      categoryId: 'cat3', description: 'El yapımı gümüş kakma detaylı oltu taşı tesbih. Koleksiyonerlere özel limitli üretim.',
      image: 'assets/images/oltu1.png', createdAt: new Date().toISOString()
    }
  ];
  await db.collection('categories').insertMany(defaultCategories);
  await db.collection('products').insertMany(defaultProducts);
  console.log('✅ Varsayılan veriler yüklendi');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer - Görsel yükleme
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

function uid() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
}

// ===== AUTH =====
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const ADMIN_USER = process.env.ADMIN_USER || 'furkans';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'furkans.21';
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Hatalı giriş bilgileri' });
  }
});

// ===== CATEGORIES =====
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await db.collection('categories').find().toArray();
    res.json(cats.map(c => ({ id: c._id, name: c.name, slug: c.slug })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const cat = {
      _id: uid(),
      name: req.body.name,
      slug: req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-ğüşıöç]/g, '')
    };
    await db.collection('categories').insertOne(cat);
    res.json({ id: cat._id, name: cat.name, slug: cat.slug });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const result = await db.collection('categories').findOneAndUpdate(
      { _id: req.params.id },
      { $set: { name: req.body.name, slug: req.body.name.toLowerCase().replace(/\s+/g, '-') } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ message: 'Kategori bulunamadı' });
    res.json({ id: result._id, name: result.name, slug: result.slug });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await db.collection('categories').deleteOne({ _id: req.params.id });
    await db.collection('products').deleteMany({ categoryId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== PRODUCTS =====
app.get('/api/products', async (req, res) => {
  try {
    const filter = req.query.categoryId ? { categoryId: req.query.categoryId } : {};
    const prods = await db.collection('products').find(filter).toArray();
    res.json(prods.map(p => ({
      id: p._id, name: p.name, price: p.price,
      categoryId: p.categoryId, description: p.description,
      image: p.image, createdAt: p.createdAt
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const p = await db.collection('products').findOne({ _id: req.params.id });
    if (!p) return res.status(404).json({ message: 'Ürün bulunamadı' });
    res.json({
      id: p._id, name: p.name, price: p.price,
      categoryId: p.categoryId, description: p.description,
      image: p.image, createdAt: p.createdAt
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const product = {
      _id: uid(),
      name: req.body.name,
      price: Number(req.body.price),
      categoryId: req.body.categoryId,
      description: req.body.description || '',
      image: req.file ? 'uploads/' + req.file.filename : (req.body.imageUrl || ''),
      createdAt: new Date().toISOString()
    };
    await db.collection('products').insertOne(product);
    res.json({
      id: product._id, name: product.name, price: product.price,
      categoryId: product.categoryId, description: product.description,
      image: product.image, createdAt: product.createdAt
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/products/:id', upload.single('image'), async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.price) updates.price = Number(req.body.price);
    if (req.body.categoryId) updates.categoryId = req.body.categoryId;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.file) updates.image = 'uploads/' + req.file.filename;
    else if (req.body.imageUrl) updates.image = req.body.imageUrl;

    const result = await db.collection('products').findOneAndUpdate(
      { _id: req.params.id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ message: 'Ürün bulunamadı' });
    res.json({
      id: result._id, name: result.name, price: result.price,
      categoryId: result.categoryId, description: result.description,
      image: result.image, createdAt: result.createdAt
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await db.collection('products').deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== FULL DATA EXPORT =====
app.get('/api/export', async (req, res) => {
  try {
    const categories = await db.collection('categories').find().toArray();
    const products = await db.collection('products').find().toArray();
    res.json({
      categories: categories.map(c => ({ id: c._id, name: c.name, slug: c.slug })),
      products: products.map(p => ({
        id: p._id, name: p.name, price: p.price,
        categoryId: p.categoryId, description: p.description,
        image: p.image, createdAt: p.createdAt
      })),
      exportDate: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== PAGES =====
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// ===== START =====
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 sanTane server: http://localhost:${PORT}`);
  });
});
