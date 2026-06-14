// make-admin.js
// A small helper script to make a user an ADMIN.
//
// HOW TO USE:
// 1. First, register a normal account on your website (e.g. you@example.com)
// 2. Run this command in your terminal:
//      node make-admin.js you@example.com
// 3. That account can now access /admin

require('dotenv').config();
const supabase = require('./config/supabase');

const email = process.argv[2];

if (!email) {
  console.log('Usage: node make-admin.js <email>');
  process.exit(1);
}

(async () => {
  const { data, error } = await supabase
    .from('users')
    .update({ is_admin: true })
    .eq('email', email.toLowerCase())
    .select();

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log(`No user found with email: ${email}`);
    console.log('Make sure you registered this email on the website first.');
    process.exit(1);
  }

  console.log(`Success! ${email} is now an admin.`);
})();
