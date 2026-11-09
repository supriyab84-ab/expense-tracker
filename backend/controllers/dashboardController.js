const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Saving = require("../models/Saving");

// Get dashboard summary data for a user with month/year filtering
const getDashboardData = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid or missing user ID"
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Parse month and year from query parameters (e.g. ?month=10&year=2026 or ?month=2026-10 or ?month=all)
    let dateFilter = {};
    let selectedYear;
    let selectedMonth; // 1 to 12

    if (req.query.month === "all") {
      dateFilter = {};
      selectedMonth = "all";
      selectedYear = "all";
    } else {
      let y, m;
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

      if (y && m && !isNaN(y) && !isNaN(m)) {
        selectedYear = y;
        selectedMonth = m;

        // Month in Date.UTC is 0-indexed (m - 1)
        const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
        // Day 0 of next month is the last day of the current month
        const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

        dateFilter = { date: { $gte: startDate, $lte: endDate } };
      }
    }

    // 1. Fetch user expenses, incomes & savings for the specified month
    const [expenses, incomes, savings] = await Promise.all([
      Expense.find({ user: userObjectId, ...dateFilter }).sort({ date: -1 }),
      Income.find({ user: userObjectId, ...dateFilter }).sort({ date: -1 }),
      Saving.find({ user: userObjectId, ...dateFilter }).sort({ date: -1 })
    ]);

    // 2. Calculate totals strictly for the filtered month:
    // Monthly Income = sum of income transactions in this month
    // Monthly Expenses = sum of expense transactions in this month
    // Monthly Savings = sum of savings transactions in this month
    // Available Balance = Monthly Income - Monthly Expenses - Monthly Savings
    const totalIncome = incomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalSavings = savings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalBalance = totalIncome - totalExpenses - totalSavings;

    // 3. Aggregate expenses by category for donut chart
    const categoryTotals = {};
    expenses.forEach((item) => {
      const cat = item.category || "Other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(item.amount) || 0);
    });

    const categoryExpenses = Object.keys(categoryTotals).map((category) => {
      const amount = categoryTotals[category];
      const percentage = totalExpenses > 0 ? Number(((amount / totalExpenses) * 100).toFixed(1)) : 0;
      return {
        category,
        amount,
        percentage
      };
    }).sort((a, b) => b.amount - a.amount);

    // 4. Combine recent transactions for the filtered month
    const formattedExpenses = expenses.map(e => ({
      _id: e._id,
      type: "expense",
      title: e.title,
      category: e.category,
      amount: e.amount,
      date: e.date
    }));

    const formattedIncomes = incomes.map(i => ({
      _id: i._id,
      type: "income",
      title: i.title,
      category: i.category,
      amount: i.amount,
      date: i.date
    }));

    const formattedSavings = savings.map(s => ({
      _id: s._id,
      type: "saving",
      title: s.title,
      category: s.category || "Savings",
      amount: s.amount,
      date: s.date
    }));

    const allTransactions = [...formattedExpenses, ...formattedIncomes, ...formattedSavings]
      .sort((a, b) => {
        const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (timeDiff !== 0) return timeDiff;
        return String(b._id).localeCompare(String(a._id));
      });

    const recentTransactions = allTransactions.slice(0, 5);

    res.status(200).json({
      selectedMonth,
      selectedYear,
      totalIncome,
      totalExpenses,
      totalBalance,
      totalSavings,
      categoryExpenses,
      recentTransactions,
      allTransactions
    });
  } catch (error) {
    console.error("Get Dashboard Data Error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
  getDashboardData
};
