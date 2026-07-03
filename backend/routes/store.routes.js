const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authMiddleware);

router.get('/', requireRole('owner', 'empleado'), storeController.getStore);
router.put('/', requireRole('owner'), storeController.updateStore);

module.exports = router;
