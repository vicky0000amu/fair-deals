// routes/shop.js
// Handles: Home page, Product catalog, Product detail,
// Collections, Collection detail, Contact form

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// ---------------------------------------------------------------
// GET / - Home page
// Shows a few featured products and all collections
// ---------------------------------------------------------------
router.get('/', async (req, res) => {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8);

  const { data: collections } = await supabase
    .from('collections')
    .select('*')
    .limit(4);

  res.render('index', {
    products: products || [],
    collections: collections || []
  });
});

// ---------------------------------------------------------------
// GET /products - Full catalog
// ---------------------------------------------------------------
router.get('/products', async (req, res) => {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  res.render('products', { products: products || [] });
});

// ---------------------------------------------------------------
// GET /products/:slug - Single product detail page
// ---------------------------------------------------------------
router.get('/products/:slug', async (req, res) => {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', req.params.slug)
    .maybeSingle();

  if (error || !product) {
    return res.status(404).render('404');
  }

  res.render('product-detail', { product, success: req.query.added === 'true' });
});

// ---------------------------------------------------------------
// GET /collections - All collections
// ---------------------------------------------------------------
router.get('/collections', async (req, res) => {
  const { data: collections } = await supabase
    .from('collections')
    .select('*');

  res.render('collections', { collections: collections || [] });
});

// ---------------------------------------------------------------
// GET /collections/:slug - Single collection page with its products
// ---------------------------------------------------------------
router.get('/collections/:slug', async (req, res) => {
  const { data: collection, error } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', req.params.slug)
    .maybeSingle();

  if (error || !collection) {
    return res.status(404).render('404');
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('collection_id', collection.id);

  res.render('collection-detail', { collection, products: products || [] });
});

// ---------------------------------------------------------------
// GET /contact - Contact form
// ---------------------------------------------------------------
router.get('/contact', (req, res) => {
  res.render('contact', { success: false });
});

// ---------------------------------------------------------------
// POST /contact - Handle contact form submission
// For now we just log it to the console.
// (You could later save these to a "messages" table or send an email)
// ---------------------------------------------------------------
router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log('New contact message:', { name, email, message });
  res.render('contact', { success: true });
});

module.exports = router;
