const express = require('express');
const router = express.Router();
const expensesController = require('../controllers/expenses.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authMiddleware, requireRole('owner', 'contador'));

router.get('/', expensesController.list);
router.post('/', expensesController.create);
router.put('/:id', expensesController.update);
router.delete('/:id', expensesController.remove);

module.exports = router;
