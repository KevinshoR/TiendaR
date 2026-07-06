const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authMiddleware);

router.get('/', requireRole('owner', 'empleado'), usersController.list);
router.post('/', requireRole('owner'), usersController.create);
router.patch('/:id', requireRole('owner'), usersController.updateActive);

module.exports = router;
