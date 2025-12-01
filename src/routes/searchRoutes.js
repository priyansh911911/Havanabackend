const express = require('express');
const searchController = require('../controllers/searchController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Universal search across all models (All roles)
router.get('/universal', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), searchController.universalSearch);

// Search by specific field (All roles)
router.get('/field', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), searchController.searchByField);

module.exports = router;
