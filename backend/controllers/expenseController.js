const Expense = require("../models/Expense");

// Add a new expense with month-specific rules for House Rent
const addExpense = async (req, res) => {
  try {
    const { user, title, amount, category, date } = req.body;

    if (!user || !title || amount === undefined || amount === null || amount === "" || !category || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Please fill all required fields with a valid amount"
      });
    }

    const trimmedTitle = title.trim();
    const trimmedCategory = category.trim();
    const lowerTitle = trimmedTitle.toLowerCase();
    const lowerCat = trimmedCategory.toLowerCase();

    const isRent = lowerTitle === "house rent" ||
                   lowerTitle === "rent" ||
                   (lowerCat === "housing" && lowerTitle.includes("rent"));

    let txYear, txMonth;
    if (typeof date === "string" && date.includes("-")) {
      const parts = date.split("T")[0].split("-");
      txYear = parseInt(parts[0], 10);
      txMonth = parseInt(parts[1], 10);
    } else {
      const d = date ? new Date(date) : new Date();
      txYear = d.getFullYear();
      txMonth = d.getMonth() + 1;
    }

    if (isRent) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12

      // 1. Future Month Validation: Rent can only be recorded for the current month
      const isFutureMonth = txYear > currentYear || (txYear === currentYear && txMonth > currentMonth);
      if (isFutureMonth) {
        return res.status(400).json({
          message: "Rent can only be recorded for the current month."
        });
      }

      // 2. Duplicate Entry Prevention: Prevent multiple rent entries for the same month and user
      const startOfMonth = new Date(Date.UTC(txYear, txMonth - 1, 1, 0, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(txYear, txMonth, 0, 23, 59, 59, 999));

      const existingRent = await Expense.findOne({
        user,
        $or: [
          { title: new RegExp("^(house )?rent$", "i") },
          { category: new RegExp("^housing$", "i"), title: new RegExp("rent", "i") }
        ],
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });

      if (existingRent) {
        const monthName = new Date(Date.UTC(txYear, txMonth - 1, 1)).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC"
        });
        return res.status(400).json({
          message: `House Rent for ${monthName} has already been recorded.`
        });
      }
    }

    const expense = await Expense.create({
      user,
      title: trimmedTitle,
      amount: Number(amount),
      category: trimmedCategory,
      date: date ? new Date(date) : new Date()
    });

    res.status(201).json({
      message: "Expense added successfully",
      expense
    });
  } catch (error) {
    console.error("Add Expense Error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// Update expense by ID
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { user, title, amount, category, date } = req.body;
    const requestingUser = user || req.query.userId || req.headers["x-user-id"];

    const existingRecord = await Expense.findById(id);
    if (!existingRecord) {
      return res.status(404).json({ message: "Expense record not found" });
    }

    // Ownership check: User can only edit their own record
    if (requestingUser && existingRecord.user.toString() !== requestingUser.toString()) {
      return res.status(403).json({ message: "Unauthorized: You can only edit your own records" });
    }

    if (!title || amount === undefined || amount === null || amount === "" || Number(amount) <= 0) {
      return res.status(400).json({ message: "Please fill all required fields with a valid amount" });
    }

    const trimmedTitle = title.trim();
    const trimmedCategory = category ? category.trim() : "Other";
    const lowerTitle = trimmedTitle.toLowerCase();
    const lowerCat = trimmedCategory.toLowerCase();

    const isRent = lowerTitle === "house rent" || lowerTitle === "rent" || lowerCat === "housing";

    let txDate;
    if (date) {
      txDate = new Date(date);
    } else {
      txDate = existingRecord.date;
    }

    const txYear = txDate.getFullYear();
    const txMonth = txDate.getMonth() + 1;

    // Rent restrictions
    if (isRent) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      if (txYear > currentYear || (txYear === currentYear && txMonth > currentMonth)) {
        return res.status(400).json({
          message: "Rent can only be recorded for the current month."
        });
      }

      const startOfMonth = new Date(Date.UTC(txYear, txMonth - 1, 1, 0, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(txYear, txMonth, 0, 23, 59, 59, 999));

      const duplicateRent = await Expense.findOne({
        _id: { $ne: id },
        user: existingRecord.user,
        $or: [
          { title: new RegExp("^house rent$", "i") },
          { title: new RegExp("^rent$", "i") }
        ],
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });

      if (duplicateRent) {
        const monthName = new Date(Date.UTC(txYear, txMonth - 1, 1)).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC"
        });
        return res.status(400).json({
          message: `House Rent for ${monthName} has already been recorded.`
        });
      }
    }

    existingRecord.title = trimmedTitle;
    existingRecord.amount = Number(amount);
    existingRecord.category = trimmedCategory;
    if (date) {
      existingRecord.date = txDate;
    }
    await existingRecord.save();

    res.status(200).json({
      message: "Expense updated successfully",
      expense: existingRecord
    });
  } catch (error) {
    console.error("Update Expense Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete expense by ID
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.query.userId || req.body?.user || req.body?.userId || req.headers["x-user-id"];

    const existingRecord = await Expense.findById(id);
    if (!existingRecord) {
      return res.status(404).json({ message: "Expense record not found" });
    }

    // Ownership check: User can only delete their own record
    if (requestingUser && existingRecord.user.toString() !== requestingUser.toString()) {
      return res.status(403).json({ message: "Unauthorized: You can only delete your own records" });
    }

    await Expense.findByIdAndDelete(id);
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Delete Expense Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get expenses for one user (supports optional ?month=10&year=2026 or ?month=2026-10)
const getUserExpenses = async (req, res) => {
  try {
    const { userId } = req.params;

    let dateFilter = {};
    if (req.query.month && req.query.month !== "all") {
      let y, m;
      if (req.query.month.includes("-")) {
        const parts = req.query.month.split("-");
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
      } else if (req.query.year) {
        m = parseInt(req.query.month, 10);
        y = parseInt(req.query.year, 10);
      }
      if (y && m && !isNaN(y) && !isNaN(m)) {
        const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
        dateFilter = { date: { $gte: startDate, $lte: endDate } };
      }
    }

    const expenses = await Expense.find({
      user: userId,
      ...dateFilter
    }).sort({ date: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Get Expenses Error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
  addExpense,
  getUserExpenses,
  updateExpense,
  deleteExpense
};
