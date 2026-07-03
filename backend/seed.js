require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function seed() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Debes definir ADMIN_EMAIL y ADMIN_PASSWORD en el archivo .env antes de correr el seed.');
    process.exitCode = 1;
    await pool.end();
    return;
  }

  const client = await pool.connect();
  try {
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL]);
    if (existingUser.rows.length > 0) {
      console.log('El seed ya fue ejecutado anteriormente. No se realizaron cambios.');
      return;
    }

    await client.query('BEGIN');

    const storeResult = await client.query(
      `INSERT INTO stores (name, email, phone, address, slug, iva_enabled, iva_rate)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      ['Tienda Don Pedro', ADMIN_EMAIL, '3001234567', 'Calle 10 # 5-20, Bogotá', 'tienda-don-pedro', true, 19.0]
    );
    const store = storeResult.rows[0];

    const ownerPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const ownerResult = await client.query(
      `INSERT INTO users (store_id, name, email, password, role) VALUES ($1,$2,$3,$4,'owner') RETURNING *`,
      [store.id, 'Don Pedro', ADMIN_EMAIL, ownerPasswordHash]
    );
    const owner = ownerResult.rows[0];

    const empleadoPasswordHash = await bcrypt.hash('Empleado123!', 10);
    const empleadoResult = await client.query(
      `INSERT INTO users (store_id, name, email, password, role) VALUES ($1,$2,$3,$4,'empleado') RETURNING *`,
      [store.id, 'Carlos Empleado', 'empleado@catalogapp.test', empleadoPasswordHash]
    );
    const empleado = empleadoResult.rows[0];

    const contadorPasswordHash = await bcrypt.hash('Contador123!', 10);
    await client.query(
      `INSERT INTO users (store_id, name, email, password, role) VALUES ($1,$2,$3,$4,'contador')`,
      [store.id, 'Ana Contadora', 'contador@catalogapp.test', contadorPasswordHash]
    );

    const productsData = [
      { name: 'Camiseta básica blanca', sku: 'CAM-001', price: 35000, cost: 18000, stock: 50, min_stock: 10 },
      { name: 'Camiseta básica negra', sku: 'CAM-002', price: 35000, cost: 18000, stock: 45, min_stock: 10 },
      { name: 'Pantalón jean clásico', sku: 'PAN-001', price: 89000, cost: 50000, stock: 30, min_stock: 8 },
      { name: 'Chaqueta impermeable', sku: 'CHA-001', price: 150000, cost: 90000, stock: 15, min_stock: 5 },
      { name: 'Gorra deportiva', sku: 'GOR-001', price: 25000, cost: 12000, stock: 40, min_stock: 10 },
      { name: 'Medias pack x3', sku: 'MED-001', price: 18000, cost: 9000, stock: 3, min_stock: 5 },
      { name: 'Correa de cuero', sku: 'COR-001', price: 45000, cost: 22000, stock: 2, min_stock: 6 },
      { name: 'Zapatos casuales', sku: 'ZAP-001', price: 120000, cost: 70000, stock: 20, min_stock: 5 },
    ];

    const products = [];
    for (const p of productsData) {
      const result = await client.query(
        `INSERT INTO products (store_id, name, sku, price, cost, stock, min_stock, apply_iva, show_in_catalog)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true,true) RETURNING *`,
        [store.id, p.name, p.sku, p.price, p.cost, p.stock, p.min_stock]
      );
      products.push(result.rows[0]);

      if (p.stock > 0) {
        await client.query(
          `INSERT INTO inventory_movements (store_id, product_id, user_id, type, quantity, reason)
           VALUES ($1,$2,$3,'entrada',$4,'inventario inicial')`,
          [store.id, result.rows[0].id, owner.id, p.stock]
        );
      }
    }

    const customersData = [
      { name: 'María Gómez', phone: '3011112222', email: 'maria.gomez@example.com', document: '1010101010' },
      { name: 'Jorge Ramírez', phone: '3022223333', email: 'jorge.ramirez@example.com', document: '2020202020' },
      { name: 'Luisa Torres', phone: '3033334444', email: 'luisa.torres@example.com', document: '3030303030' },
    ];
    const customers = [];
    for (const c of customersData) {
      const result = await client.query(
        `INSERT INTO customers (store_id, name, phone, email, document) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [store.id, c.name, c.phone, c.email, c.document]
      );
      customers.push(result.rows[0]);
    }

    async function createSale({ type, customerId, dueDate, userId, items }) {
      let subtotal = 0;
      let total = 0;
      const lineItems = [];
      for (const it of items) {
        const product = products.find((p) => p.id === it.productId);
        const unitPrice = Number(product.price);
        const ivaRate = store.iva_enabled ? Number(store.iva_rate) : 0;
        const itemSubtotal = round2(it.quantity * unitPrice);
        const lineTotal = round2(itemSubtotal * (1 + ivaRate / 100));
        subtotal += itemSubtotal;
        total += lineTotal;
        lineItems.push({ productId: product.id, quantity: it.quantity, unitPrice, ivaRate, lineTotal });
      }
      subtotal = round2(subtotal);
      total = round2(total);
      const ivaTotal = round2(total - subtotal);
      const status = type === 'contado' ? 'pagada' : 'pendiente';
      const paidAmount = type === 'contado' ? total : 0;

      const saleResult = await client.query(
        `INSERT INTO sales (store_id, user_id, customer_id, type, subtotal, iva_total, total, paid_amount, status, due_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [store.id, userId, customerId || null, type, subtotal, ivaTotal, total, paidAmount, status, dueDate || null]
      );
      const sale = saleResult.rows[0];

      for (const li of lineItems) {
        await client.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, iva_rate, line_total)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [sale.id, li.productId, li.quantity, li.unitPrice, li.ivaRate, li.lineTotal]
        );
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [li.quantity, li.productId]);
        await client.query(
          `INSERT INTO inventory_movements (store_id, product_id, user_id, type, quantity, reason)
           VALUES ($1,$2,$3,'venta',$4,'venta')`,
          [store.id, li.productId, userId, -li.quantity]
        );
      }
      return sale;
    }

    const futureDate1 = new Date();
    futureDate1.setDate(futureDate1.getDate() + 15);
    const futureDate2 = new Date();
    futureDate2.setDate(futureDate2.getDate() + 30);

    await createSale({ type: 'contado', userId: owner.id, items: [{ productId: products[0].id, quantity: 2 }] });
    await createSale({ type: 'contado', userId: empleado.id, items: [{ productId: products[2].id, quantity: 1 }] });
    await createSale({ type: 'contado', userId: empleado.id, items: [{ productId: products[4].id, quantity: 3 }] });
    await createSale({
      type: 'credito',
      userId: owner.id,
      customerId: customers[0].id,
      dueDate: futureDate1.toISOString().slice(0, 10),
      items: [{ productId: products[3].id, quantity: 1 }],
    });
    await createSale({
      type: 'credito',
      userId: empleado.id,
      customerId: customers[1].id,
      dueDate: futureDate2.toISOString().slice(0, 10),
      items: [{ productId: products[7].id, quantity: 1 }],
    });

    await client.query('COMMIT');
    console.log('Seed ejecutado correctamente.');
    console.log(`Owner: ${ADMIN_EMAIL} / (contraseña definida en .env)`);
    console.log('Empleado: empleado@catalogapp.test / Empleado123!');
    console.log('Contador: contador@catalogapp.test / Contador123!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al ejecutar el seed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
