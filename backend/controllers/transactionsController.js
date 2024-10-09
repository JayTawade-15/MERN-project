const axios = require('axios');
const Transaction = require('../models/transaction');

// Fetch and initialize the database
const initializeDatabase = async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const transactions = response.data;

        // Clear existing data before seeding new data
        await Transaction.deleteMany();
        await Transaction.insertMany(transactions);

        res.status(200).json({ message: 'Database initialized with seed data' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// List transactions with search and pagination
const listTransactions = async (req, res) => {
    const { page = 1, perPage = 10, search = '' } = req.query;
    const query = {
        $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { price: { $regex: search, $options: 'i' } }
        ]
    };

    try {
        const transactions = await Transaction.find(search ? query : {})
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage));
        const count = await Transaction.countDocuments(search ? query : {});

        res.status(200).json({ transactions, total: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// API for statistics
const getStatistics = async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`${month} 1`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

    try {
        const totalSales = await Transaction.aggregate([
            { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
            { $group: { _id: null, totalSaleAmount: { $sum: "$price" }, totalItemsSold: { $sum: 1 }, totalItemsNotSold: { $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] } } } }
        ]);
        res.status(200).json(totalSales[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// API for bar chart
const getPriceRange = async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`${month} 1`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

    const priceRanges = [
        { label: '0-100', min: 0, max: 100 },
        { label: '101-200', min: 101, max: 200 },
        { label: '201-300', min: 201, max: 300 },
        // Add other ranges here...
        { label: '901-above', min: 901, max: Infinity }
    ];

    try {
        const result = await Promise.all(priceRanges.map(async (range) => {
            const count = await Transaction.countDocuments({ dateOfSale: { $gte: startDate, $lt: endDate }, price: { $gte: range.min, $lt: range.max } });
            return { range: range.label, count };
        }));
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// API for pie chart (category-wise items)
const getCategoryStats = async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`${month} 1`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

    try {
        const categoryStats = await Transaction.aggregate([
            { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);
        res.status(200).json(categoryStats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Combined API
const getCombinedStats = async (req, res) => {
    try {
        const statistics = await getStatistics(req, res);
        const priceRange = await getPriceRange(req, res);
        const categoryStats = await getCategoryStats(req, res);

        res.status(200).json({ statistics, priceRange, categoryStats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    initializeDatabase,
    listTransactions,
    getStatistics,
    getPriceRange,
    getCategoryStats,
    getCombinedStats
};
