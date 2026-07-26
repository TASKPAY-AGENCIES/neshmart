const pool = require('../config/db');

const CAMPUSES = ['Main Campus', 'Kapkatet', 'Premier Hostels', 'Elite Hostels', 'Kabianga Center'];

// GET /api/products?search=&category=&campus=&page=&limit=
async function listProducts(req, res, next) {
  try {
    const { search, category, campus } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    const conditions = ["p.status IN ('ACTIVE', 'SOLD')"];
    const values = [];

    if (search) {
      values.push(search);
      conditions.push(`to_tsvector('english', p.title) @@ plainto_tsquery('english', $${values.length})`);
    }
    if (category) {
      values.push(category);
      conditions.push(`c.slug = $${values.length}`);
    }
    if (campus && CAMPUSES.includes(campus)) {
      values.push(campus);
      conditions.push(`p.campus_location = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);
    const query = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
             u.full_name AS seller_name, u.is_verified_student AS seller_verified
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const result = await pool.query(query, values);
    res.json({ products: result.rows, page, limit });
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name, u.full_name AS seller_name,
              u.is_verified_student AS seller_verified, u.phone AS seller_phone
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.seller_id = u.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const { title, description, categoryId, price, campusLocation, condition, quantity, imageUrl, whatsappNumber } = req.body;

    if (!title || !price || !campusLocation) {
      return res.status(400).json({ error: 'Title, price, and campus location are required' });
    }
    if (!CAMPUSES.includes(campusLocation)) {
      return res.status(400).json({ error: 'Invalid campus location' });
    }

    const result = await pool.query(
      `INSERT INTO products
        (seller_id, title, description, category_id, price, campus_location, condition, quantity, image_url, whatsapp_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.id, title, description, categoryId, price, campusLocation, condition, quantity || 1, imageUrl, whatsappNumber]
    );

    res.status(201).json({ product: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const owned = await pool.query('SELECT seller_id FROM products WHERE id = $1', [id]);
    if (!owned.rows[0]) return res.status(404).json({ error: 'Product not found' });
    if (owned.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not own this listing' });
    }

    const fields = ['title', 'description', 'category_id', 'price', 'campus_location', 'condition', 'quantity', 'image_url', 'whatsapp_number', 'status'];
    const updates = [];
    const values = [];

    fields.forEach((f) => {
      const camel = f.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (req.body[camel] !== undefined) {
        values.push(req.body[camel]);
        updates.push(`${f} = $${values.length}`);
      }
    });

    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    values.push(id);
    const result = await pool.query(
      `UPDATE products SET ${updates.join(', ')}, updated_at = now() WHERE id = $${values.length} RETURNING *`,
      values
    );
    res.json({ product: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const owned = await pool.query('SELECT seller_id FROM products WHERE id = $1', [id]);
    if (!owned.rows[0]) return res.status(404).json({ error: 'Product not found' });
    if (owned.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not own this listing' });
    }
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function listCategories(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json({ categories: result.rows });
  } catch (err) {
    next(err);
  }
}

async function mySellerListings(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ products: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  listCategories, mySellerListings, CAMPUSES,
};
