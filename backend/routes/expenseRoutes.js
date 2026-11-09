const express = require("express");

const {
  addExpense,
  getUserExpenses,
  updateExpense,
  deleteExpense
} = require("../controllers/expenseController");

const router = express.Router();

// Add expense
router.post("/", addExpense);

// Get expenses for a specific user
router.get("/user/:userId", getUserExpenses);

// Update expense
router.put("/:id", updateExpense);
router.patch("/:id", updateExpense);

// Delete expense
router.delete("/:id", deleteExpense);

module.exports = router;
