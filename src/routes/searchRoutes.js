const express = require('express');
const searchController = require('../controllers/searchController');

const router = express.Router();

// Universal search across all models
router.get('/universal', searchController.universalSearch);

// Search by specific field
router.get('/field', searchController.searchByField);

module.exports = router;
