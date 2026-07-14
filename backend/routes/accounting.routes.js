const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accounting.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.get('/', authMiddleware, requireRole('owner', 'contador'), accountingController.overview);

module.exports = router;
