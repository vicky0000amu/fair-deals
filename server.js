// server.js
// This is the MAIN FILE that starts your website.
// Run it with: node server.js  (or: npm start)

const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const { attachUser, requireAdmin } = require('./middleware/auth');
const { getCartCount } = require('./middleware/cart');

// Import route files
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const accountRoutes = require('./routes/account');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------
// VIEW ENGINE SETUP
// We use EJS (Embedded JavaScript) to build HTML pages with
// dynamic data, e.g. <%= product.name %>
// ---------------------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---------------------------------------------------------------
// MIDDLEWARE SETUP (these run on every request, in order)
// ---------------------------------------------------------------

// Serve static files (CSS, JS, images) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Parse form submissions (so req.body works)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Parse cookies (so req.cookies works) - used for login tokens
app.use(cookieParser());

// Sessions (used for shopping cart storage)
app.use(session({
  secret: process.env.JWT_SECRET || 'fairdeals-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
}));

// Attach logged-in user info (if any) to every request
app.use(attachUser);

// Make cart count available in every view (for the header badge)
app.use((req, res, next) => {
  res.locals.cartCount = getCartCount(req);
  next();
});

// ---------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------
app.use('/auth', authRoutes);          // /auth/login, /auth/register, /auth/logout
app.use('/cart', cartRoutes);          // /cart, /cart/add, /cart/update, /cart/remove
app.use('/checkout', checkoutRoutes);  // /checkout
app.use('/account', accountRoutes);    // /account/orders
app.use('/admin', requireAdmin, adminRoutes); // /admin/* (admin only)
app.use('/', shopRoutes);              // /, /products, /collections, /contact

// ---------------------------------------------------------------
// 404 - catch all unmatched routes
// ---------------------------------------------------------------
app.use((req, res) => {
  res.status(404).render('404');
});

// ---------------------------------------------------------------
// START THE SERVER
// ---------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Fair Deals server running at http://localhost:${PORT}`);
});
