const express = require("express");
const { addIncome, getUserIncome, updateIncome, deleteIncome } = require("../controllers/incomeController");

const router = express.Router();

// Add income
router.post("/", addIncome);

// Get income for a specific user
router.get("/user/:userId", getUserIncome);

// Update income
router.put("/:id", updateIncome);
router.patch("/:id", updateIncome);

// Delete income
router.delete("/:id", deleteIncome);

module.exports = router;
