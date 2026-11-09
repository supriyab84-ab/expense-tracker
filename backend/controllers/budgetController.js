const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Expense = require("../models/Expense");

// GET /api/budgets/user/:userId?month=10&year=2026 (or ?month=2026-10)
const getMonthlyBudget = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid or missing user ID" });
    }

    // Strict user isolation
    const requestingUser = req.headers["x-user-id"];
    if (requestingUser && requestingUser !== userId) {
      return res.status(403).json({ message: "Forbidden: You cannot access another user's budget" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Parse month and year
    let m, y;
    if (req.query.month && req.query.month.includes("-")) {
      const parts = req.query.month.split("-");
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
    } else if (req.query.month && req.query.year) {
      m = parseInt(req.query.month, 10);
      y = parseInt(req.query.year, 10);
    } else {
      const now = new Date();
      y = now.getFullYear();
      m = now.getMonth() + 1;
    }

    if (!m || !y || isNaN(m) || isNaN(y) || m < 1 || m > 12) {
      return res.status(400).json({ message: "Invalid month or year parameter" });
    }

    // 1. Fetch budget for this specific user, month, and year
    const budgetDoc = await Budget.findOne({
      user: userObjectId,
      month: m,
      year: y
    });

    // 2. Fetch expenses strictly for this user in this specific month/year
    const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

    const expenses = await Expense.find({
      user: userObjectId,
      date: { $gte: startDate, $lte: endDate }
    });

    const monthlyExpenses = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const monthlyBudget = budgetDoc ? Number(budgetDoc.amount) : 0;

    // Remaining Budget = Monthly Budget - Monthly Expenses
    const remainingBudget = budgetDoc ? (monthlyBudget - monthlyExpenses) : 0;

    // Budget Used Percentage = (Monthly Expenses / Monthly Budget) * 100
    const usedPercentage = monthlyBudget > 0
      ? Number(((monthlyExpenses / monthlyBudget) * 100).toFixed(1))
      : 0;

    // Category spending breakdown for this month
    const categoryTotals = {};
    expenses.forEach((item) => {
      const cat = item.category || "Other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(item.amount) || 0);
    });

    const categoryBreakdown = Object.keys(categoryTotals).map((cat) => ({
      category: cat,
      amount: categoryTotals[cat],
      percentage: monthlyExpenses > 0 ? Number(((categoryTotals[cat] / monthlyExpenses) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.amount - a.amount);

    return res.status(200).json({
      hasBudget: !!budgetDoc,
      budget: budgetDoc,
      month: m,
      year: y,
      monthlyBudget,
      monthlyExpenses,
      remainingBudget,
      usedPercentage,
      categoryBreakdown
    });
  } catch (error) {
    console.error("Get Monthly Budget Error:", error);
    return res.status(500).json({ message: "Server error retrieving budget" });
  }
};

// POST /api/budgets - Set or Update Monthly Budget
const setMonthlyBudget = async (req, res) => {
  try {
    const { user, month, year, amount } = req.body;

    if (!user || !mongoose.Types.ObjectId.isValid(user)) {
      return res.status(400).json({ message: "Valid user ID is required" });
    }

    // Strict user isolation
    const requestingUser = req.headers["x-user-id"];
    if (requestingUser && requestingUser !== String(user)) {
      return res.status(403).json({ message: "Forbidden: You cannot set another user's budget" });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: "Please provide a valid positive budget amount" });
    }

    const numMonth = parseInt(month, 10);
    const numYear = parseInt(year, 10);

    if (isNaN(numMonth) || numMonth < 1 || numMonth > 12) {
      return res.status(400).json({ message: "Month must be between 1 and 12" });
    }

    if (isNaN(numYear) || numYear < 2000) {
      return res.status(400).json({ message: "Valid year is required (>= 2000)" });
    }

    const userObjectId = new mongoose.Types.ObjectId(user);

    // Upsert budget strictly for this user, month, and year
    const budget = await Budget.findOneAndUpdate(
      { user: userObjectId, month: numMonth, year: numYear },
      { amount: numAmount },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: "Monthly budget saved successfully",
      budget
    });
  } catch (error) {
    console.error("Set Monthly Budget Error:", error);
    return res.status(500).json({ message: "Server error setting monthly budget" });
  }
};

// DELETE /api/budgets/:id
const deleteMonthlyBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] || req.query.userId;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid budget ID" });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "User ID required for authorization" });
    }

    const budget = await Budget.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      user: new mongoose.Types.ObjectId(userId)
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found or unauthorized" });
    }

    return res.status(200).json({ message: "Budget deleted successfully" });
  } catch (error) {
    console.error("Delete Budget Error:", error);
    return res.status(500).json({ message: "Server error deleting budget" });
  }
};

// GET /api/budgets/user/:userId/all - Get all historical budgets for this user
const getAllBudgetsForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const requestingUser = req.headers["x-user-id"];
    if (requestingUser && requestingUser !== userId) {
      return res.status(403).json({ message: "Forbidden: You cannot access another user's budgets" });
    }

    const budgets = await Budget.find({ user: new mongoose.Types.ObjectId(userId) })
      .sort({ year: -1, month: -1 });

    return res.status(200).json(budgets);
  } catch (error) {
    console.error("Get All Budgets Error:", error);
    return res.status(500).json({ message: "Server error retrieving budgets" });
  }
};

module.exports = {
  getMonthlyBudget,
  setMonthlyBudget,
  deleteMonthlyBudget,
  getAllBudgetsForUser
};
