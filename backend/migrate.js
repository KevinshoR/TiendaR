require('dotenv').config();
const pool = require('./config/db');

const statements = [
  `CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30),
    address VARCHAR(255),
    slug VARCHAR(150) UNIQUE NOT NULL,
    iva_enabled BOOLEAN DEFAULT false,
    iva_rate NUMERIC(4,2) DEFAULT 19.00,
    subscription_status VARCHAR(20) DEFAULT 'trial',
    trial_ends_at TIMESTAMP DEFAULT (NOW() + INTERVAL '14 days'),
    subscription_ends_at TIMESTAMP,
    billing_source VARCHAR(20) DEFAULT 'direct',
    plan_tier VARCHAR(20),
    current_plan VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    store_id INT REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner','empleado','contador')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    store_id INT REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(100),
    description TEXT,
    price NUMERIC(12,2) NOT NULL,
    cost NUMERIC(12,2) DEFAULT 0,
    stock INT DEFAULT 0,
    min_stock INT DEFAULT 0,
    apply_iva BOOLEAN DEFAULT true,
    iva_rate NUMERIC(5,2),
    image_url VARCHAR(255),
    active BOOLEAN DEFAULT true,
    show_in_catalog BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `ALTER TABLE products ADD COLUMN IF NOT EXISTS iva_rate NUMERIC(5,2)`,

  `CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    store_id INT REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    document VARCHAR(50),
    credit_limit NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    store_id INT REFERENCES stores(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id),
    customer_id INT REFERENCES customers(id),
    type VARCHAR(10) CHECK (type IN ('contado','credito')),
    subtotal NUMERIC(12,2),
    iva_total NUMERIC(12,2),
    total NUMERIC(12,2),
    paid_amount NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(10) CHECK (status IN ('pagada','pendiente','anulada')) DEFAULT 'pagada',
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INT REFERENCES sales(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    iva_rate NUMERIC(4,2) DEFAULT 0,
    line_total NUMERIC(12,2) NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    store_id INT REFERENCES stores(id) ON DELETE CASCADE,
    sale_id INT REFERENCES sales(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    method VARCHAR(20) CHECK (method IN ('efectivo','transferencia','otro')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    store_id INT REFERENCES stores(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id),
    category VARCHAR(50),
    description TEXT,
    amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    store_id INT REFERENCES stores(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id),
    user_id INT REFERENCES users(id),
    type VARCHAR(10) CHECK (type IN ('entrada','salida','ajuste','venta')),
    quantity INT NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS payment_reminders_log (
    id SERIAL PRIMARY KEY,
    store_id INT REFERENCES stores(id) ON DELETE CASCADE,
    sale_id INT REFERENCES sales(id) ON DELETE CASCADE,
    sent_to VARCHAR(150),
    sent_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_store_id ON payments(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON payments(sale_id)`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_store_id ON expenses(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_movements_store_id ON inventory_movements(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payment_reminders_log_store_id ON payment_reminders_log(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payment_reminders_log_sale_id ON payment_reminders_log(sale_id)`,
];

async function migrate() {
  const client = await pool.connect();
  try {
    for (const statement of statements) {
      await client.query(statement);
    }
    console.log('Migración completada correctamente.');
  } catch (err) {
    console.error('Error al migrar:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
