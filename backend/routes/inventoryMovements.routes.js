const express = require('express');
const router = express.Router();
const inventoryMovementsController = require('../controllers/inventoryMovements.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// Todos los roles pueden leer los movimientos
router.use(authMiddleware, requireRole('owner', 'empleado', 'contador'));

router.get('/', inventoryMovementsController.list);

module.exports = router;