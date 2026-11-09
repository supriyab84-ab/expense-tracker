const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"]
    },
    month: {
      type: Number,
      required: [true, "Month is required"],
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: 2000
    },
    amount: {
      type: Number,
      required: [true, "Budget amount is required"],
      min: [0, "Budget amount cannot be negative"]
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring one budget per user per month & year
budgetSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
