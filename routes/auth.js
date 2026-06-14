// routes/auth.js
// Handles: Register, Login, Logout

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
require('dotenv').config();

// ---------------------------------------------------------------
// GET /auth/register - show the registration form
// ---------------------------------------------------------------
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// ---------------------------------------------------------------
// POST /auth/register - handle the registration form submission
// ---------------------------------------------------------------
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.render('register', { error: 'Please fill in all required fields.' });
  }

  // Check if a user with this email already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (existing) {
    return res.render('register', { error: 'An account with this email already exists.' });
  }

  // Hash (scramble) the password so it's never stored as plain text
  const hashedPassword = await bcrypt.hash(password, 10);

  const { data: newUser, error } = await supabase
    .from('users')
    .insert([{ name, email: email.toLowerCase(), phone, password: hashedPassword }])
    .select()
    .single();

  if (error) {
    console.error(error);
    return res.render('register', { error: 'Something went wrong. Please try again.' });
  }

  // Log the user in immediately by creating a token
  const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.redirect('/');
});

// ---------------------------------------------------------------
// GET /auth/login - show the login form
// ---------------------------------------------------------------
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// ---------------------------------------------------------------
// POST /auth/login - handle the login form submission
// ---------------------------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error || !user) {
    return res.render('login', { error: 'Invalid email or password.' });
  }

  // Compare the typed password with the hashed one in the database
  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return res.render('login', { error: 'Invalid email or password.' });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.redirect('/');
});

// ---------------------------------------------------------------
// GET /auth/logout - log the user out
// ---------------------------------------------------------------
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

module.exports = router;
