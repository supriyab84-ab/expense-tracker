const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const savingRoutes = require("./routes/savingRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/savings", savingRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/reports", reportRoutes);

app.get("/", (req, res) => {
  res.send("Expense Tracker Backend is Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
