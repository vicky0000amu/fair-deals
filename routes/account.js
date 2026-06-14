// routes/account.js
// Handles: Viewing your own order history

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { requireLogin } = require('../middleware/auth');

// ---------------------------------------------------------------
// GET /account/orders - Show all orders placed by the logged-in user
// ---------------------------------------------------------------
router.get('/orders', requireLogin, async (req, res) => {
  // Get all orders for this user, along with their order_items
  // Supabase lets us "join" related tables like this:
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return res.render('orders', { orders: [] });
  }

  res.render('orders', { orders: orders || [] });
});

module.exports = router;
