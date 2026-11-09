const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    amount: {
      type: Number,
      required: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Expense", expenseSchema);