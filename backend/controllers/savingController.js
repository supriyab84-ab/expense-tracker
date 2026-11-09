const Saving = require("../models/Saving");

// Add a new saving record
const addSaving = async (req, res) => {
  try {
    const { user, title, amount, category, date } = req.body;

    if (!user || amount === undefined || amount === null || amount === "" || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Please provide a valid user and positive saving amount"
      });
    }

    const saving = await Saving.create({
      user,
      title: title && title.trim() ? title.trim() : "Savings Deposit",
      amount: Number(amount),
      category: category && category.trim() ? category.trim() : "General Savings",
      date: date ? new Date(date) : new Date()
    });

    res.status(201).json({
      message: "Saving added successfully",
      saving
    });
  } catch (error) {
    console.error("Add Saving Error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// Get all savings for one user (supports optional ?month=10&year=2026 or ?month=2026-10)
const getUserSavings = async (req, res) => {
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

    const savings = await Saving.find({
      user: userId,
      ...dateFilter
    }).sort({ date: -1 });

    res.status(200).json(savings);
  } catch (error) {
    console.error("Get Savings Error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// Update saving by ID
const updateSaving = async (req, res) => {
  try {
    const { id } = req.params;
    const { user, title, amount, category, date } = req.body;
    const requestingUser = user || req.query.userId || req.headers["x-user-id"];

    const existingRecord = await Saving.findById(id);
    if (!existingRecord) {
      return res.status(404).json({ message: "Saving record not found" });
    }

    // Ownership check: User can only edit their own record
    if (requestingUser && existingRecord.user.toString() !== requestingUser.toString()) {
      return res.status(403).json({ message: "Unauthorized: You can only edit your own records" });
    }

    if (amount === undefined || amount === null || amount === "" || Number(amount) <= 0) {
      return res.status(400).json({ message: "Please provide a positive saving amount" });
    }

    existingRecord.title = title && title.trim() ? title.trim() : existingRecord.title;
    existingRecord.amount = Number(amount);
    if (category) {
      existingRecord.category = category.trim();
    }
    if (date) {
      existingRecord.date = new Date(date);
    }
    await existingRecord.save();

    res.status(200).json({
      message: "Saving updated successfully",
      saving: existingRecord
    });
  } catch (error) {
    console.error("Update Saving Error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// Delete saving by ID
const deleteSaving = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.query.userId || req.body?.user || req.body?.userId || req.headers["x-user-id"];

    const existingRecord = await Saving.findById(id);
    if (!existingRecord) {
      return res.status(404).json({ message: "Saving record not found" });
    }

    // Ownership check: User can only delete their own record
    if (requestingUser && existingRecord.user.toString() !== requestingUser.toString()) {
      return res.status(403).json({ message: "Unauthorized: You can only delete your own records" });
    }

    await Saving.findByIdAndDelete(id);
    res.status(200).json({ message: "Saving deleted successfully" });
  } catch (error) {
    console.error("Delete Saving Error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
  addSaving,
  getUserSavings,
  updateSaving,
  deleteSaving
};
