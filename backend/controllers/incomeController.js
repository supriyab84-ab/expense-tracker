const Income = require("../models/Income");

const getTodayDateString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Add a new income with date validation and salary duplicate check
const addIncome = async (req, res) => {
  try {
    const { user, title, amount, category, date } = req.body;

    if (!user || !title || amount === undefined || amount === null || amount === "" || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Please fill all required fields with a valid amount"
      });
    }

    const trimmedTitle = title.trim();
    const trimmedCategory = category ? category.trim() : "Other";
    const lowerTitle = trimmedTitle.toLowerCase();
    const lowerCat = trimmedCategory.toLowerCase();

    const isSalary = lowerTitle === "salary" || lowerCat === "salary";

    let txDateStr;
    let txYear, txMonth;

    if (typeof date === "string" && date.trim()) {
      txDateStr = date.split("T")[0];
      const parts = txDateStr.split("-");
      txYear = parseInt(parts[0], 10);
      txMonth = parseInt(parts[1], 10);
    } else if (date instanceof Date) {
      txYear = date.getFullYear();
      txMonth = date.getMonth() + 1;
      const d = String(date.getDate()).padStart(2, "0");
      txDateStr = `${txYear}-${String(txMonth).padStart(2, "0")}-${d}`;
    } else {
      txDateStr = getTodayDateString();
      const parts = txDateStr.split("-");
      txYear = parseInt(parts[0], 10);
      txMonth = parseInt(parts[1], 10);
    }

    const todayStr = getTodayDateString();

    // 1. ALL INCOMES: Reject any income recorded for a future date
    if (txDateStr > todayStr) {
      return res.status(400).json({
        message: "Income cannot be recorded for a future date."
      });
    }

    // 2. SALARY-SPECIFIC: Prevent duplicate salary entries for the same month and user
    if (isSalary) {
      const startOfMonth = new Date(Date.UTC(txYear, txMonth - 1, 1, 0, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(txYear, txMonth, 0, 23, 59, 59, 999));

      const existingSalary = await Income.findOne({
        user,
        $or: [
          { title: new RegExp("^salary$", "i") },
          { category: new RegExp("^salary$", "i") }
        ],
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });

      if (existingSalary) {
        const monthName = new Date(Date.UTC(txYear, txMonth - 1, 1)).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC"
        });
        return res.status(400).json({
          message: `Salary for ${monthName} has already been recorded.`
        });
      }
    }

    const income = await Income.create({
      user,
      title: trimmedTitle,
      amount: Number(amount),
      category: trimmedCategory,
      date: date ? new Date(date) : new Date()
    });

    res.status(201).json({
      message: "Income added successfully",
      income
    });
  } catch (error) {
    console.error("Add Income Error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// Update income by ID
const updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const { user, title, amount, category, date } = req.body;
    const requestingUser = user || req.query.userId || req.headers["x-user-id"];

    const existingRecord = await Income.findById(id);
    if (!existingRecord) {
      return res.status(404).json({ message: "Income record not found" });
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

    let txDateStr;
    let txYear, txMonth;

    if (typeof date === "string" && date.trim()) {
      txDateStr = date.split("T")[0];
      const parts = txDateStr.split("-");
      txYear = parseInt(parts[0], 10);
      txMonth = parseInt(parts[1], 10);
    } else if (date instanceof Date) {
      txYear = date.getFullYear();
      txMonth = date.getMonth() + 1;
      const d = String(date.getDate()).padStart(2, "0");
      txDateStr = `${txYear}-${String(txMonth).padStart(2, "0")}-${d}`;
    } else {
      txDateStr = getTodayDateString();
      const parts = txDateStr.split("-");
      txYear = parseInt(parts[0], 10);
      txMonth = parseInt(parts[1], 10);
    }

    const todayStr = getTodayDateString();

    // 1. ALL INCOMES: Cannot be recorded for a future date
    if (txDateStr > todayStr) {
      return res.status(400).json({
        message: "Income cannot be recorded for a future date."
      });
    }

    // 2. SALARY-SPECIFIC: Prevent duplicate salary in same month (excluding current record)
    const isSalary = lowerTitle === "salary" || lowerCat === "salary";
    if (isSalary) {
      const startOfMonth = new Date(Date.UTC(txYear, txMonth - 1, 1, 0, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(txYear, txMonth, 0, 23, 59, 59, 999));

      const duplicateSalary = await Income.findOne({
        _id: { $ne: id },
        user: existingRecord.user,
        $or: [
          { title: new RegExp("^salary$", "i") },
          { category: new RegExp("^salary$", "i") }
        ],
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });

      if (duplicateSalary) {
        const monthName = new Date(Date.UTC(txYear, txMonth - 1, 1)).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC"
        });
        return res.status(400).json({
          message: `Salary for ${monthName} has already been recorded.`
        });
      }
    }

    existingRecord.title = trimmedTitle;
    existingRecord.amount = Number(amount);
    existingRecord.category = trimmedCategory;
    if (date) {
      existingRecord.date = new Date(date);
    }
    await existingRecord.save();

    res.status(200).json({
      message: "Income updated successfully",
      income: existingRecord
    });
  } catch (error) {
    console.error("Update Income Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete income by ID
const deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.query.userId || req.body?.user || req.body?.userId || req.headers["x-user-id"];

    const existingRecord = await Income.findById(id);
    if (!existingRecord) {
      return res.status(404).json({ message: "Income record not found" });
    }

    // Ownership check: User can only delete their own record
    if (requestingUser && existingRecord.user.toString() !== requestingUser.toString()) {
      return res.status(403).json({ message: "Unauthorized: You can only delete your own records" });
    }

    await Income.findByIdAndDelete(id);
    res.status(200).json({ message: "Income deleted successfully" });
  } catch (error) {
    console.error("Delete Income Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get income for one user (supports optional ?month=10&year=2026 or ?month=2026-10)
const getUserIncome = async (req, res) => {
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

    const incomes = await Income.find({
      user: userId,
      ...dateFilter
    }).sort({ date: -1 });

    res.status(200).json(incomes);
  } catch (error) {
    console.error("Get Income Error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
  addIncome,
  getUserIncome,
  updateIncome,
  deleteIncome
};
