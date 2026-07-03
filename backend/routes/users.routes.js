const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authMiddleware, requireRole('owner'));

router.get('/', usersController.list);
router.post('/', usersController.create);
router.patch('/:id', usersController.updateActive);

module.exports = router;
