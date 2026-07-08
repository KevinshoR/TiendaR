const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireRole, soloLectura } = require('../middleware/role.middleware');

router.use(authMiddleware, soloLectura);

router.get('/', requireRole('owner', 'empleado', 'contador'), salesController.list);
router.post('/', requireRole('owner', 'empleado'), salesController.create);
router.patch('/:id/pay', requireRole('owner'), salesController.pay);
router.patch('/:id/cancel', requireRole('owner'), salesController.cancel);
router.post('/:id/payments', requireRole('owner', 'empleado'), salesController.addPayment);
router.get('/:id/payments', requireRole('owner', 'empleado'), salesController.listPayments);
router.post('/:id/remind', requireRole('owner', 'empleado'), salesController.remind);

module.exports = router;
