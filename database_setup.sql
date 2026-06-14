-- =====================================================================
-- FAIR DEALS - DATABASE SETUP SCRIPT FOR SUPABASE
-- =====================================================================
-- HOW TO USE THIS FILE:
-- 1. Go to your Supabase project dashboard
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New query"
-- 4. Copy ALL of this file and paste it in
-- 5. Click "Run"
-- This will create all the tables needed for your website.
-- =====================================================================

-- ---------------------------------------------------------------
-- TABLE 1: USERS
-- Stores customer accounts (name, email, hashed password)
-- ---------------------------------------------------------------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password text not null,           -- stored as a hashed value, never plain text
  phone text,
  address text,
  is_admin boolean default false,   -- true = this user can manage products/orders
  created_at timestamp with time zone default now()
);

-- ---------------------------------------------------------------
-- TABLE 2: COLLECTIONS
-- Matches your Shopify collections (Dual Aura, Prime Vault, etc.)
-- ---------------------------------------------------------------
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,        -- used in URLs e.g. /collections/dual-aura
  description text,
  image_url text,
  created_at timestamp with time zone default now()
);

-- ---------------------------------------------------------------
-- TABLE 3: PRODUCTS
-- Every jewellery item you sell
-- ---------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,        -- used in URLs e.g. /products/gold-chain
  description text,
  price numeric(10,2) not null,
  sale_price numeric(10,2),         -- optional discounted price
  image_url text,
  stock integer default 0,
  collection_id uuid references collections(id) on delete set null,
  is_sold_out boolean default false,
  created_at timestamp with time zone default now()
);

-- ---------------------------------------------------------------
-- TABLE 4: ORDERS
-- One row per order a customer places
-- ---------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  total_amount numeric(10,2) not null,
  status text default 'pending',    -- pending, paid, shipped, delivered, cancelled
  shipping_name text,
  shipping_address text,
  shipping_phone text,
  created_at timestamp with time zone default now()
);

-- ---------------------------------------------------------------
-- TABLE 5: ORDER_ITEMS
-- The individual products inside each order
-- ---------------------------------------------------------------
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,       -- saved separately in case product is deleted later
  quantity integer not null default 1,
  price numeric(10,2) not null      -- price at time of purchase
);

-- ---------------------------------------------------------------
-- SAMPLE DATA: Collections (from your Shopify store)
-- ---------------------------------------------------------------
insert into collections (name, slug, description, image_url) values
('Dual Aura', 'dual-aura', 'Locked-in luxury. An exclusive lineup of bold dual-tone pieces.', 'https://fair-deals-4041.myshopify.com/cdn/shop/collections/rn-image_picker_lib_temp_6a6ae0ff-7233-4f36-8d59-8557e37cead7.jpg'),
('Prime Vault', 'frontpage', 'Locked-in luxury. The Prime Vault collection is an exclusive lineup of bold statement pieces.', 'https://fair-deals-4041.myshopify.com/cdn/shop/collections/rn-image_picker_lib_temp_31882522-89c6-44a6-973f-5f0be31859fc.jpg'),
('Gold-Holic', 'gold-holic', 'A refined addiction to the world''s most timeless metal.', 'https://fair-deals-4041.myshopify.com/cdn/shop/collections/rn-image_picker_lib_temp_3a3a4430-f619-49a5-ba80-05bb5cb1af46.jpg'),
('Elite Chain', 'elite-chain', 'Locked down and iced out. Premium hardware chains.', 'https://fair-deals-4041.myshopify.com/cdn/shop/collections/rn-image_picker_lib_temp_cef220dd-f42d-4682-b8c7-7c1720b14375.jpg')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------
-- SAMPLE DATA: Products (from your Shopify store)
-- ---------------------------------------------------------------
insert into products (name, slug, description, price, image_url, stock, is_sold_out) values
('Bold Geometric ''Iced-Out'' Pave Square Statement Ring in Silver-Tone', 'bold-geometric-iced-out-pave-square-statement-ring-silver', 'A bold geometric statement ring with pave-set stones in a striking silver-tone finish.', 499.00, 'https://fair-deals-4041.myshopify.com/cdn/shop/files/871AE982-2BBF-4DA8-9DB2-785239136304.png', 10, false),
('Bold Geometric ''Iced-Out'' Pave Square Statement Ring in Yellow Gold-Tone', 'bold-geometric-iced-out-pave-square-statement-ring-gold', 'A bold geometric statement ring with pave-set stones in a rich yellow gold-tone finish.', 499.00, 'https://fair-deals-4041.myshopify.com/cdn/shop/files/7C052C05-6CD4-4A78-840E-7432EADF3443.png', 10, false),
('Bold Yellow Gold-Tone Tiered Square Iced-Out Statement Ring', 'bold-yellow-gold-tone-tiered-square-iced-out-statement-ring', 'A tiered square design statement ring fully iced out in yellow gold-tone.', 499.00, 'https://fair-deals-4041.myshopify.com/cdn/shop/files/IMG_3376.png', 10, false),
('Glamorous ''Iced-Out'' Silver-Tone Dual Brooch with Draping Chains', 'glamorous-iced-out-silver-tone-dual-brooch-with-draping-chains', 'A glamorous dual brooch set in silver-tone with elegant draping chains.', 499.00, 'https://fair-deals-4041.myshopify.com/cdn/shop/files/IMG_3396.png', 10, false),
('Imperial Crest Gold Pendant Chain', 'imperial-crest-gold-pendant-chain', 'A regal crest pendant on a fine gold chain, perfect for everyday luxury.', 399.00, 'https://fair-deals-4041.myshopify.com/cdn/shop/files/ChatGPTImageMay28_2026_10_46_25PM.png', 15, false),
('Marquise CZ Starburst Broach & Pink 3D Floating Display Frame', 'marquise-cz-starburst-pendant-pink-3d-floating-display-frame', 'A dazzling crystal jewelry gift set featuring a marquise CZ starburst design.', 499.00, 'https://fair-deals-4041.myshopify.com/cdn/shop/files/IMG-20260501-WA0014.jpg', 8, false),
('Pastel Royale Crystal Necklace Set', 'pastel-royale-crystal-necklace-set', 'A graceful crystal necklace set in soft pastel tones, ideal for special occasions.', 749.00, 'https://fair-deals-4041.myshopify.com/cdn/shop/files/ChatGPTImageMay28_2026_10_27_00PM.png', 6, false),
('Premium Cushion-Cut Halo Bracelet – Silver Finish', 'premium-cushion-cut-halo-bracelet-silver-finish', 'A premium halo bracelet with cushion-cut stones in a polished silver finish.', 799.00, 'https://fair-deals-4041.myshopify.com/cdn/shop/files/IMG_3365.png', 5, false),
('Premium Gold-Plated Star Signet Ring – Men''s Collection', 'premium-gold-plated-star-signet-ring-mens-collection', 'A bold gold-plated signet ring featuring a star design, made for men.', 499.00, 'https://fair-deals-4041.myshopify.com/cdn/shop/files/IMG_3340.png', 10, false),
('Premium Gold-Tone Rope Lapel & Eyewear Chain', 'premium-gold-tone-rope-lapel-eyewear-chain', 'A versatile gold-tone rope chain that doubles as a lapel or eyewear accessory.', 399.00, 'https://fair-deals-4041.myshopify.com/cdn/shop/files/rn-image_picker_lib_temp_95c5f29f-00e7-492b-b052-5a93492879e0.jpg', 0, true),
('Premium Iced-Out Cuban Link Bracelet – Gold Finish', 'premium-iced-out-cuban-link-bracelet-gold-finish', 'A heavy-duty Cuban link bracelet, fully iced out, in a luxurious gold finish.', 799.00, 'https://fair-deals-4041.myshopify.com/cdn/shop/files/rn-image_picker_lib_temp_cef220dd-f42d-4682-b8c7-7c1720b14375.jpg', 7, false),
('Premium Rose Gold Double Brooch with Lapel Chains', 'premium-rose-gold-double-brooch-with-lapel-chains', 'An elegant double brooch in rose gold, complete with delicate lapel chains.', 499.00, 'https://fair-deals-4041.myshopify.com/cdn/shop/files/IMG_3366.png', 9, false),
('Premium Textured Fancy Link Gold Chain | S-Hook Clasp', 'premium-textured-fancy-link-gold-chain-s-hook-clasp', 'A fancy textured link chain in gold with a secure S-hook clasp.', 349.00, 'https://fair-deals-4041.myshopify.com/cdn/shop/files/rn-image_picker_lib_temp_3a3a4430-f619-49a5-ba80-05bb5cb1af46.jpg', 12, false),
('Royal Cascade Heritage Necklace Set', 'royal-cascade-heritage-necklace-set', 'A heritage-inspired necklace set with a royal cascading design.', 749.00, 'https://fair-deals-4041.myshopify.com/cdn/shop/files/ChatGPTImageMay28_2026_10_25_46PM.png', 6, false),
('Two-Tone ''Iced-Out'' Pavé Statement Ring with Screw Detail', 'two-tone-iced-out-pave-statement-ring-with-screw-detail', 'A striking two-tone statement ring with pave stones and a screw-detail design.', 499.00, 'https://fair-deals-4041.myshopify.com/cdn/shop/files/rn-image_picker_lib_temp_8b2ad9f7-17fc-48be-9b03-935fbb4e897b.jpg', 8, false)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------
-- DONE!
-- After running this, go to "Table Editor" in Supabase to see
-- your new tables: users, collections, products, orders, order_items
-- ---------------------------------------------------------------
