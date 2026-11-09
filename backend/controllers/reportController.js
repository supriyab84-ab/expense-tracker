const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Saving = require("../models/Saving");

// GET /api/reports/:userId?month=YYYY-MM (or ?month=10&year=2026 or ?month=all)
const getReportsData = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid or missing user ID" });
    }

    const requestingUser = req.headers["x-user-id"];
    if (requestingUser && requestingUser !== userId) {
      return res.status(403).json({ message: "Forbidden: You cannot access another user's reports" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Parse month and year from query parameters
    let dateFilter = {};
    let selectedYear;
    let selectedMonth;
    let daysInMonth = 30;

    if (req.query.month === "all") {
      dateFilter = {};
      selectedMonth = "all";
      selectedYear = "all";
      daysInMonth = 365;
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
        daysInMonth = new Date(y, m, 0).getDate();
        const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
        dateFilter = { date: { $gte: startDate, $lte: endDate } };
      }
    }

    // 1. Fetch user expenses, incomes & savings strictly for this user and period
    const [expenses, incomes, savings] = await Promise.all([
      Expense.find({ user: userObjectId, ...dateFilter }).sort({ date: -1 }),
      Income.find({ user: userObjectId, ...dateFilter }).sort({ date: -1 }),
      Saving.find({ user: userObjectId, ...dateFilter }).sort({ date: -1 })
    ]);

    // 2. Calculate core totals strictly from MongoDB records
    const totalIncome = incomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalSavings = savings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalBalance = totalIncome - totalExpenses - totalSavings;

    // 3. Category-wise Expenses Breakdown
    const categoryTotals = {};
    const categoryCounts = {};
    let largestExpense = null;

    expenses.forEach((item) => {
      const cat = item.category || "Other";
      const amt = Number(item.amount) || 0;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      if (!largestExpense || amt > largestExpense.amount) {
        largestExpense = {
          _id: item._id,
          title: item.title,
          amount: amt,
          category: cat,
          date: item.date
        };
      }
    });

    const categoryExpenses = Object.keys(categoryTotals).map((cat) => {
      const amount = categoryTotals[cat];
      const percentage = totalExpenses > 0 ? Number(((amount / totalExpenses) * 100).toFixed(1)) : 0;
      return {
        category: cat,
        amount,
        percentage,
        count: categoryCounts[cat] || 0
      };
    }).sort((a, b) => b.amount - a.amount);

    const highestExpenseCategory = categoryExpenses.length > 0 ? categoryExpenses[0] : null;

    // 4. Income vs Expenses vs Savings (Relative to Income & Overall Distribution)
    const expensePercentageOfIncome = totalIncome > 0
      ? Number(((totalExpenses / totalIncome) * 100).toFixed(1))
      : 0;
    const savingsPercentageOfIncome = totalIncome > 0
      ? Number(((totalSavings / totalIncome) * 100).toFixed(1))
      : 0;
    const balancePercentageOfIncome = totalIncome > 0
      ? Number(((totalBalance / totalIncome) * 100).toFixed(1))
      : 0;

    // Total Flow breakdown (Expenses + Savings + Retained Balance)
    const totalFlow = totalExpenses + totalSavings + Math.max(0, totalBalance);
    const expenseShare = totalFlow > 0 ? Number(((totalExpenses / totalFlow) * 100).toFixed(1)) : 0;
    const savingsShare = totalFlow > 0 ? Number(((totalSavings / totalFlow) * 100).toFixed(1)) : 0;
    const balanceShare = totalFlow > 0 ? Number(((Math.max(0, totalBalance) / totalFlow) * 100).toFixed(1)) : 0;

    // 5. Monthly Spending Summary Insights
    const dailyAverageExpense = totalExpenses > 0 ? Number((totalExpenses / daysInMonth).toFixed(2)) : 0;
    const savingsRate = totalIncome > 0
      ? Number((((totalSavings + Math.max(0, totalBalance)) / totalIncome) * 100).toFixed(1))
      : 0;

    return res.status(200).json({
      selectedMonth,
      selectedYear,
      daysInMonth,
      summary: {
        totalIncome,
        totalExpenses,
        totalSavings,
        totalBalance,
        savingsRate,
        dailyAverageExpense,
        highestExpenseCategory,
        largestExpense,
        totalTransactions: expenses.length + incomes.length + savings.length,
        incomeCount: incomes.length,
        expenseCount: expenses.length,
        savingCount: savings.length
      },
      categoryExpenses,
      incomeVsExpensesVsSavings: {
        totalIncome,
        totalExpenses,
        totalSavings,
        totalBalance,
        expensePercentageOfIncome,
        savingsPercentageOfIncome,
        balancePercentageOfIncome,
        expenseShare,
        savingsShare,
        balanceShare
      }
    });
  } catch (error) {
    console.error("Get Reports Data Error:", error);
    return res.status(500).json({ message: "Server error generating reports" });
  }
};

module.exports = {
  getReportsData
};
