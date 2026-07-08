require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
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

app.use(cors());
app.use('/api/inventory-movements', inventoryMovementsRoutes);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'CatalogApp API funcionando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/expenses', expensesRoutes);

iniciarJobRecordatorios();
if (process.env.NODE_ENV === 'development' && process.env.TEST_REMINDERS === 'true') {
  ejecutarRecordatorios();
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
