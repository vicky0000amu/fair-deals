// middleware/auth.js
// This file contains "middleware" functions.
// Middleware = code that runs BEFORE your route handler,
// usually to check something (like "is this user logged in?")

const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
require('dotenv').config();

// ---------------------------------------------------------------
// attachUser: Runs on EVERY request.
// Checks if the user has a valid login token (stored in a cookie).
// If yes, it loads their info from the database and attaches it
// to req.user, so views/routes can know "who is logged in".
// If no, req.user stays null (guest / not logged in).
// ---------------------------------------------------------------
async function attachUser(req, res, next) {
  res.locals.user = null;
  req.user = null;

  const token = req.cookies.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, name, email, phone, address, is_admin')
      .eq('id', decoded.id)
      .single();

    if (!error && userData) {
      req.user = userData;
      res.locals.user = userData;
    }
  } catch (err) {
    // Invalid or expired token - just treat as logged out
    res.clearCookie('token');
  }

  next();
}

// ---------------------------------------------------------------
// requireLogin: Use this on routes that ONLY logged-in users
// can access (e.g. checkout, my orders).
// If not logged in, redirects to the login page.
// ---------------------------------------------------------------
function requireLogin(req, res, next) {
  if (!req.user) {
    return res.redirect('/auth/login');
  }
  next();
}

// ---------------------------------------------------------------
// requireAdmin: Use this on admin-only routes.
// If the user is not an admin, sends a 403 Forbidden message.
// ---------------------------------------------------------------
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).send('Access denied. Admins only.');
  }
  next();
}

module.exports = { attachUser, requireLogin, requireAdmin };
