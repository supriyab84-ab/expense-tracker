const express = require("express");
const { getDashboardData } = require("../controllers/dashboardController");

const router = express.Router();

// Get dashboard data for a specific user
router.get("/:userId", getDashboardData);

module.exports = router;
