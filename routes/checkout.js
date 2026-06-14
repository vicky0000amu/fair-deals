// routes/checkout.js
// Handles: Checkout page, Placing an order

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { requireLogin } = require('../middleware/auth');
const { ensureCart } = require('../middleware/cart');

// ---------------------------------------------------------------
// GET /checkout - Show shipping form + order summary
// Must be logged in.
// ---------------------------------------------------------------
router.get('/', requireLogin, async (req, res) => {
  const cart = ensureCart(req);

  if (cart.length === 0) {
    return res.redirect('/cart');
  }

  const productIds = cart.map(item => item.product_id);
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds);

  const total = cart.reduce((sum, item) => {
    const product = (products || []).find(p => p.id === item.product_id);
    if (!product) return sum;
    const price = product.sale_price || product.price;
    return sum + (price * item.quantity);
  }, 0);

  res.render('checkout', { total, error: null, user: req.user });
});

// ---------------------------------------------------------------
// POST /checkout - Place the order
// Steps:
// 1. Re-fetch products to get current prices (don't trust the client)
// 2. Create a row in "orders"
// 3. Create rows in "order_items" for each cart item
// 4. Reduce stock for each product
// 5. Clear the cart
// ---------------------------------------------------------------
router.post('/', requireLogin, async (req, res) => {
  const cart = ensureCart(req);
  const { shipping_name, shipping_phone, shipping_address } = req.body;

  if (cart.length === 0) {
    return res.redirect('/cart');
  }

  const productIds = cart.map(item => item.product_id);
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds);

  if (!products || products.length === 0) {
    return res.render('checkout', { total: 0, error: 'Your cart items are no longer available.', user: req.user });
  }

  // Calculate total based on CURRENT prices in the database
  let total = 0;
  const itemsToInsert = [];

  for (const cartItem of cart) {
    const product = products.find(p => p.id === cartItem.product_id);
    if (!product) continue;

    const price = product.sale_price || product.price;
    total += price * cartItem.quantity;

    itemsToInsert.push({
      product_id: product.id,
      product_name: product.name,
      quantity: cartItem.quantity,
      price: price
    });
  }

  // 1. Create the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      user_id: req.user.id,
      total_amount: total,
      status: 'pending',
      shipping_name,
      shipping_phone,
      shipping_address
    }])
    .select()
    .single();

  if (orderError) {
    console.error(orderError);
    return res.render('checkout', { total, error: 'Could not place order. Please try again.', user: req.user });
  }

  // 2. Create order_items, linked to this order
  const orderItemsWithId = itemsToInsert.map(item => ({ ...item, order_id: order.id }));
  await supabase.from('order_items').insert(orderItemsWithId);

  // 3. Reduce stock for each product
  for (const cartItem of cart) {
    const product = products.find(p => p.id === cartItem.product_id);
    if (!product) continue;
    const newStock = Math.max(0, product.stock - cartItem.quantity);
    await supabase
      .from('products')
      .update({ stock: newStock, is_sold_out: newStock === 0 })
      .eq('id', product.id);
  }

  // 4. Clear the cart
  req.session.cart = [];

  // 5. Attach order_items to order for the confirmation page
  order.order_items = orderItemsWithId;

  res.render('order-confirmation', { order });
});

module.exports = router;
