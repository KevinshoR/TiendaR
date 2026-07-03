const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customers.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authMiddleware, requireRole('owner', 'empleado'));

router.get('/', customersController.list);
router.post('/', customersController.create);
router.put('/:id', customersController.update);

module.exports = router;
