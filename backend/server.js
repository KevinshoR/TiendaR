require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const inventoryMovementsRoutes = require('./routes/inventoryMovements.routes');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const productsRoutes = require('./routes/products.routes');
const customersRoutes = require('./routes/customers.routes');
const salesRoutes = require('./routes/sales.routes');
const purchasesRoutes = require('./routes/purchases.routes');
const storeRoutes = require('./routes/store.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const publicRoutes = require('./routes/public.routes');
const expensesRoutes = require('./routes/expenses.routes');
const { iniciarJobRecordatorios, ejecutarRecordatorios } = require('./jobs/paymentReminders.job');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return process.env.NODE_ENV !== 'production'
        ? callback(null, true)
        : callback(new Error('No permitido por CORS'));
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const limitadorGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiadas peticiones, intenta más tarde',
});

const limitadorAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiados intentos de acceso, intenta más tarde',
});

app.use(helmet());
app.use(cors(corsOptions));
app.use('/api', limitadorGeneral);
app.use('/api/inventory-movements', inventoryMovementsRoutes);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'CatalogApp API funcionando' });
});

app.use('/api/auth', limitadorAuth, authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/expenses', expensesRoutes);

app.use((err, req, res, next) => {
  if (err && err.message === 'No permitido por CORS') {
    return res.status(403).json({ message: 'No permitido por CORS' });
  }
  return next(err);
});

iniciarJobRecordatorios();
if (process.env.NODE_ENV === 'development' && process.env.TEST_REMINDERS === 'true') {
  ejecutarRecordatorios();
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
