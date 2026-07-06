const express = require('express');
const router = express.Router();
const purchasesController = require('../controllers/purchases.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authMiddleware, requireRole('owner', 'empleado'));

router.get('/', purchasesController.list);
router.post('/', purchasesController.create);

module.exports = router;
