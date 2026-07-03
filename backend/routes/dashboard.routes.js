const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.get('/', authMiddleware, requireRole('owner', 'empleado', 'contador'), dashboardController.getDashboard);

module.exports = router;
