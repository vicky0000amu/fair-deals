// routes/cart.js
// Handles: View cart, Add to cart, Update quantity, Remove item

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { ensureCart } = require('../middleware/cart');

// ---------------------------------------------------------------
// GET /cart - View cart contents
// We loop through the session cart, fetch each product's current
// details from Supabase, and calculate the total.
// ---------------------------------------------------------------
router.get('/', async (req, res) => {
  const cart = ensureCart(req);

  if (cart.length === 0) {
    return res.render('cart', { cartItems: [], total: 0 });
  }

  const productIds = cart.map(item => item.product_id);

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds);

  const cartItems = cart.map(item => {
    const product = (products || []).find(p => p.id === item.product_id);
    if (!product) return null;
    return {
      product_id: product.id,
      name: product.name,
      image_url: product.image_url,
      price: product.sale_price || product.price,
      quantity: item.quantity
    };
  }).filter(Boolean);

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  res.render('cart', { cartItems, total });
});

// ---------------------------------------------------------------
// POST /cart/add - Add a product to the cart
// ---------------------------------------------------------------
router.post('/add', (req, res) => {
  const { productId, quantity } = req.body;
  const qty = parseInt(quantity) || 1;
  const cart = ensureCart(req);

  const existing = cart.find(item => item.product_id === productId);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({ product_id: productId, quantity: qty });
  }

  // Redirect back to the product page they were on, with a success flag
  res.redirect('/cart');
});

// ---------------------------------------------------------------
// POST /cart/update - Change the quantity of an item
// ---------------------------------------------------------------
router.post('/update', (req, res) => {
  const { productId, quantity } = req.body;
  const qty = parseInt(quantity) || 1;
  const cart = ensureCart(req);

  const item = cart.find(item => item.product_id === productId);
  if (item) {
    item.quantity = qty > 0 ? qty : 1;
  }

  res.redirect('/cart');
});

// ---------------------------------------------------------------
// POST /cart/remove - Remove an item from the cart
// ---------------------------------------------------------------
router.post('/remove', (req, res) => {
  const { productId } = req.body;
  req.session.cart = ensureCart(req).filter(item => item.product_id !== productId);
  res.redirect('/cart');
});

module.exports = router;
