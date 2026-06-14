// middleware/cart.js
// Helper functions to manage the shopping cart.
// We store the cart inside the user's SESSION
// (a temporary storage on the server tied to their browser).
// This means the cart is NOT saved permanently in the database -
// it disappears if the user closes the browser for too long.
// This keeps things simple for a beginner project.

// Make sure req.session.cart always exists as an array
function ensureCart(req) {
  if (!req.session.cart) {
    req.session.cart = []; // each item: { product_id, quantity }
  }
  return req.session.cart;
}

// Count total number of items in cart (for the header badge)
function getCartCount(req) {
  const cart = ensureCart(req);
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

module.exports = { ensureCart, getCartCount };
