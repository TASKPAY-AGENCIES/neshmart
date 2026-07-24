-- NESHMART Database Schema
-- Run with: psql -U youruser -d neshmart -f schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== USERS ==========
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE CHECK (phone ~ '^2547[0-9]{8}$'),
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_verified_student BOOLEAN DEFAULT FALSE,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========== CATEGORIES ==========
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50)
);

INSERT INTO categories (name, slug) VALUES
 ('Electronics','electronics'),('Phones','phones'),('Laptops','laptops'),
 ('Furniture','furniture'),('Hostels','hostels'),('Fashion','fashion'),
 ('Hoodies','hoodies'),('Shoes','shoes'),('Books','books'),
 ('Revision Materials','revision-materials'),('Calculators','calculators'),
 ('Kitchen Items','kitchen-items'),('Services','services'),('Tuition','tuition'),
 ('Beauty','beauty'),('Gaming','gaming'),('Accessories','accessories'),('Others','others');

-- ========== PRODUCTS ==========
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  category_id INT REFERENCES categories(id),
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  campus_location VARCHAR(50) NOT NULL CHECK (campus_location IN
    ('Main Campus','Kapkatet','Premier Hostels','Elite Hostels','Kabianga Center')),
  condition VARCHAR(20) CHECK (condition IN ('New','Like New','Good','Fair','Used')),
  quantity INT DEFAULT 1 CHECK (quantity >= 0),
  image_url TEXT,
  whatsapp_number VARCHAR(15),
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED','SOLD','REMOVED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_campus ON products(campus_location);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_title_search ON products USING gin (to_tsvector('english', title));

-- ========== TRANSACTIONS (order-level) ==========
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2),
  seller_payout NUMERIC(10,2),
  payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING','SUCCESS','FAILED')),
  escrow_status VARCHAR(20) DEFAULT 'AWAITING_PAYMENT' CHECK (escrow_status IN
    ('AWAITING_PAYMENT','HELD_IN_ESCROW','RELEASED','REFUNDED','DISPUTED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========== M-PESA TRANSACTIONS ==========
CREATE TABLE mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  merchant_request_id VARCHAR(100),
  checkout_request_id VARCHAR(100) UNIQUE,
  mpesa_receipt_number VARCHAR(50),
  phone VARCHAR(15) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  result_code INT,
  result_desc TEXT,
  payout_reference VARCHAR(100),
  transaction_type VARCHAR(10) DEFAULT 'STK' CHECK (transaction_type IN ('STK','B2C')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== ESCROW LOG ==========
CREATE TABLE escrow_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  action VARCHAR(30) NOT NULL, -- HELD, RELEASED, REFUNDED, DISPUTED
  actor_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== NOTIFICATIONS ==========
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150),
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== MESSAGES ==========
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NOT NULL REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== WISHLIST ==========
CREATE TABLE wishlist (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

-- ========== REVIEWS ==========
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  transaction_id UUID REFERENCES transactions(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== SYSTEM LOGS ==========
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== REPORTED LISTINGS ==========
CREATE TABLE reported_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN','REVIEWED','DISMISSED')),
  created_at TIMESTAMPTZ DEFAULT now()
);
