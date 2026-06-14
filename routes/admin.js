// routes/admin.js
// Handles: Admin dashboard, Product management, Order management,
// Collection management
// ALL routes here require requireAdmin (set in server.js)

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// ---------------------------------------------------------------
// GET /admin - Admin dashboard home
// ---------------------------------------------------------------
router.get('/', (req, res) => {
  res.render('admin-dashboard', {});
});

// =================================================================
// PRODUCTS
// =================================================================

// GET /admin/products - List all products
router.get('/products', async (req, res) => {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  res.render('admin-products', { products: products || [], success: req.query.success || null });
});

// GET /admin/products/new - Show "add product" form
router.get('/products/new', async (req, res) => {
  const { data: collections } = await supabase.from('collections').select('*');
  res.render('admin-product-form', { product: null, collections: collections || [], error: null });
});

// POST /admin/products/new - Create a new product
router.post('/products/new', async (req, res) => {
  const { name, description, price, sale_price, image_url, stock, collection_id, is_sold_out } = req.body;

  // Auto-generate a URL-friendly "slug" from the name
  // e.g. "Gold Ring!" -> "gold-ring"
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const { error } = await supabase.from('products').insert([{
    name,
    slug,
    description,
    price: parseFloat(price),
    sale_price: sale_price ? parseFloat(sale_price) : null,
    image_url,
    stock: parseInt(stock) || 0,
    collection_id: collection_id || null,
    is_sold_out: is_sold_out === 'true'
  }]);

  if (error) {
    console.error(error);
    const { data: collections } = await supabase.from('collections').select('*');
    return res.render('admin-product-form', {
      product: req.body,
      collections: collections || [],
      error: 'Could not save product. The slug may already exist - try a different name.'
    });
  }

  res.redirect('/admin/products?success=Product added successfully');
});

// GET /admin/products/:id/edit - Show "edit product" form
router.get('/products/:id/edit', async (req, res) => {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (error || !product) {
    return res.status(404).render('404');
  }

  const { data: collections } = await supabase.from('collections').select('*');
  res.render('admin-product-form', { product, collections: collections || [], error: null });
});

// POST /admin/products/:id/edit - Update a product
router.post('/products/:id/edit', async (req, res) => {
  const { name, description, price, sale_price, image_url, stock, collection_id, is_sold_out } = req.body;

  const { error } = await supabase
    .from('products')
    .update({
      name,
      description,
      price: parseFloat(price),
      sale_price: sale_price ? parseFloat(sale_price) : null,
      image_url,
      stock: parseInt(stock) || 0,
      collection_id: collection_id || null,
      is_sold_out: is_sold_out === 'true'
    })
    .eq('id', req.params.id);

  if (error) {
    console.error(error);
    const { data: collections } = await supabase.from('collections').select('*');
    return res.render('admin-product-form', {
      product: { ...req.body, id: req.params.id },
      collections: collections || [],
      error: 'Could not update product.'
    });
  }

  res.redirect('/admin/products?success=Product updated successfully');
});

// POST /admin/products/:id/delete - Delete a product
router.post('/products/:id/delete', async (req, res) => {
  await supabase.from('products').delete().eq('id', req.params.id);
  res.redirect('/admin/products?success=Product deleted');
});

// =================================================================
// ORDERS
// =================================================================

// GET /admin/orders - List all orders from all customers
router.get('/orders', async (req, res) => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error) console.error(error);

  res.render('admin-orders', { orders: orders || [] });
});

// POST /admin/orders/:id/status - Update an order's status
router.post('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  await supabase.from('orders').update({ status }).eq('id', req.params.id);
  res.redirect('/admin/orders');
});

// =================================================================
// COLLECTIONS
// =================================================================

// GET /admin/collections - List all collections + add form
router.get('/collections', async (req, res) => {
  const { data: collections } = await supabase.from('collections').select('*');
  res.render('admin-collections', { collections: collections || [], success: req.query.success || null });
});

// POST /admin/collections/new - Add a new collection
router.post('/collections/new', async (req, res) => {
  const { name, slug, description, image_url } = req.body;

  const { error } = await supabase.from('collections').insert([{ name, slug, description, image_url }]);

  if (error) {
    console.error(error);
    return res.redirect('/admin/collections');
  }

  res.redirect('/admin/collections?success=Collection added');
});

module.exports = router;
