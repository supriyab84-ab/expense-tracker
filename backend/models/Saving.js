const mongoose = require("mongoose");

const savingSchema = new mongoose.Schema(
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
      required: true,
      min: 0
    },
    category: {
      type: String,
      default: "General Savings",
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

module.exports = mongoose.model("Saving", savingSchema);
