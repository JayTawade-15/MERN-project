const express = require('express');
const router = express.Router();
const {
    initializeDatabase,
    listTransactions,
    getStatistics,
    getPriceRange,
    getCategoryStats,
    getCombinedStats
} = require('../controllers/transactionsController');

// Initialize database with seed data
router.get('/init', initializeDatabase);

// List all transactions with search and pagination
router.get('/transactions', listTransactions);

// Get statistics for the selected month
router.get('/statistics', getStatistics);

// Get price range data for bar chart
router.get('/price-range', getPriceRange);

// Get category data for pie chart
router.get('/category-stats', getCategoryStats);

// Get combined stats from all 3 APIs
router.get('/combined-stats', getCombinedStats);

module.exports = router;
