import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import SummaryCardModal from "../../components/SummaryCardModal";
import SearchableDropdown from "../../components/SearchableDropdown";
import EditTransactionModal from "../../components/EditTransactionModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import "./Dashboard.css";

const CATEGORY_COLORS = {
  Food: "#7147e9",
  Transport: "#3586f6",
  Shopping: "#ff655f",
  Bills: "#f7b82d",
  Housing: "#6366f1",
  Entertainment: "#8b5cf6",
  Health: "#ec4899",
  Education: "#10b981",
  Maintenance: "#f97316",
  Salary: "#28b875",
  Freelance: "#06b6d4",
  Savings: "#f59e0b",
  Emergency: "#eab308",
  Investment: "#14b8a6",
  Other: "#64748b",
  Others: "#64748b"
};

const FALLBACK_COLORS = ["#7147e9", "#3586f6", "#ff655f", "#f7b82d", "#28b875", "#8b5cf6", "#ec4899", "#06b6d4"];

const SAVING_TITLES = [
  "Emergency Fund",
  "Personal Savings",
  "Education Savings",
  "Travel Savings",
  "Home Savings",
  "Vehicle Savings",
  "Future Savings",
  "Medical Savings",
  "Investment",
  "Other Savings"
];

const SAVING_TITLE_MAP = {
  "Emergency Fund": "Emergency Fund",
  "Personal Savings": "General Savings",
  "Education Savings": "General Savings",
  "Travel Savings": "Vacation",
  "Home Savings": "Big Purchase",
  "Vehicle Savings": "Big Purchase",
  "Future Savings": "Retirement",
  "Medical Savings": "Emergency Fund",
  "Investment": "Investment",
  "Other Savings": "General Savings"
};

const getCurrentMonthString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatMonthDisplay = (monthStr) => {
  if (!monthStr || monthStr === "all") return "All Time";
  const [yearStr, monthNumStr] = monthStr.split("-");
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthNumStr, 10);
  if (isNaN(y) || isNaN(m)) return monthStr;
  const date = new Date(Date.UTC(y, m - 1, 1));
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
};

const getCategoryIcon = (category, type) => {
  if (type === "saving") return "🎯";
  const cat = (category || "").toLowerCase();
  if (cat.includes("food") || cat.includes("grocery")) return "🛒";
  if (cat.includes("transport") || cat.includes("cab") || cat.includes("fuel")) return "🚗";
  if (cat.includes("salary") || cat.includes("income")) return "💰";
  if (cat.includes("shop")) return "🛍️";
  if (cat.includes("bill") || cat.includes("utility")) return "📄";
  if (cat.includes("freelance") || cat.includes("tech")) return "💻";
  if (cat.includes("health") || cat.includes("medical")) return "💊";
  if (cat.includes("entertain")) return "🎬";
  if (cat.includes("saving")) return "🎯";
  return "💳";
};

function Dashboard() {
  const navigate = useNavigate();

  // Active Month Filter (defaults to current month YYYY-MM or 'all')
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());

  const [dashboardData, setDashboardData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalBalance: 0,
    totalSavings: 0,
    categoryExpenses: [],
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);

  // Add Savings Modal State
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [savingSelectedTitle, setSavingSelectedTitle] = useState("Emergency Fund");
  const [savingCustomTitle, setSavingCustomTitle] = useState("");
  const [savingAmount, setSavingAmount] = useState("");
  const [savingCategory, setSavingCategory] = useState("Emergency Fund");
  const [savingDate, setSavingDate] = useState(new Date().toISOString().split("T")[0]);
  const [savingFeedback, setSavingFeedback] = useState({ text: "", type: "" });
  const [savingSubmitting, setSavingSubmitting] = useState(false);

  // Clickable Summary Card Details Modal State
  const [activeSummaryModal, setActiveSummaryModal] = useState(null); // null | "balance" | "income" | "expenses" | "savings"
  const [modalRecords, setModalRecords] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Edit & Delete modal states for Recent Transactions
  const [recentEditTx, setRecentEditTx] = useState(null);
  const [recentDeleteTx, setRecentDeleteTx] = useState(null);
  const [recentIsDeleting, setRecentIsDeleting] = useState(false);

  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(amount) || 0);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === "all") return;
    const [yearStr, monthNumStr] = selectedMonth.split("-");
    let y = parseInt(yearStr, 10);
    let m = parseInt(monthNumStr, 10);
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    if (selectedMonth === "all") return;
    const [yearStr, monthNumStr] = selectedMonth.split("-");
    let y = parseInt(yearStr, 10);
    let m = parseInt(monthNumStr, 10);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, "0")}`);
  };

  const handleSavingTitleSelect = (val) => {
    setSavingSelectedTitle(val);
    if (SAVING_TITLE_MAP[val]) {
      setSavingCategory(SAVING_TITLE_MAP[val]);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      if (!loggedInUser?.id) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/dashboard/${loggedInUser.id}?month=${selectedMonth}`
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Dashboard fetch error:", data.message);
        return;
      }

      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [loggedInUser?.id, selectedMonth]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Click Handler for the 4 Summary Cards - passes active selectedMonth
  const handleCardClick = async (cardType) => {
    setActiveSummaryModal(cardType);

    if (cardType === "balance") {
      setModalRecords([]);
      return;
    }

    if (cardType === "all-transactions" && dashboardData.allTransactions) {
      setModalRecords(dashboardData.allTransactions);
      setModalLoading(false);
      return;
    }

    if (!loggedInUser?.id) return;

    setModalLoading(true);
    try {
      let endpoint = "";
      if (cardType === "expenses") {
        endpoint = `http://localhost:5000/api/expenses/user/${loggedInUser.id}?month=${selectedMonth}`;
      } else if (cardType === "income") {
        endpoint = `http://localhost:5000/api/income/user/${loggedInUser.id}?month=${selectedMonth}`;
      } else if (cardType === "savings") {
        endpoint = `http://localhost:5000/api/savings/user/${loggedInUser.id}?month=${selectedMonth}`;
      } else if (cardType === "all-transactions") {
        endpoint = `http://localhost:5000/api/dashboard/${loggedInUser.id}?month=${selectedMonth}`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();
      if (res.ok) {
        if (cardType === "all-transactions") {
          setModalRecords(Array.isArray(data.allTransactions) ? data.allTransactions : []);
        } else {
          setModalRecords(Array.isArray(data) ? data : []);
        }
      } else {
        setModalRecords([]);
      }
    } catch (err) {
      console.error("Error fetching card details:", err);
      setModalRecords([]);
    } finally {
      setModalLoading(false);
    }
  };

  // Called when an item is edited or deleted from inside SummaryCardModal
  const handleTransactionModified = async () => {
    // 1. Recalculate dashboard stats from MongoDB
    await fetchDashboardData();
    // 2. Refresh active summary modal records if open
    if (activeSummaryModal && activeSummaryModal !== "balance" && loggedInUser?.id) {
      setModalLoading(true);
      try {
        let endpoint = "";
        if (activeSummaryModal === "expenses") {
          endpoint = `http://localhost:5000/api/expenses/user/${loggedInUser.id}?month=${selectedMonth}`;
        } else if (activeSummaryModal === "income") {
          endpoint = `http://localhost:5000/api/income/user/${loggedInUser.id}?month=${selectedMonth}`;
        } else if (activeSummaryModal === "savings") {
          endpoint = `http://localhost:5000/api/savings/user/${loggedInUser.id}?month=${selectedMonth}`;
        } else if (activeSummaryModal === "all-transactions") {
          endpoint = `http://localhost:5000/api/dashboard/${loggedInUser.id}?month=${selectedMonth}`;
        }
        const res = await fetch(endpoint);
        const data = await res.json();
        if (activeSummaryModal === "all-transactions") {
          setModalRecords(res.ok && Array.isArray(data.allTransactions) ? data.allTransactions : []);
        } else {
          setModalRecords(res.ok && Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error refreshing modal records:", err);
      } finally {
        setModalLoading(false);
      }
    }
  };

  const handleEditRecent = (tx) => {
    setRecentEditTx(tx);
  };

  const handleDeleteRecent = (tx) => {
    setRecentDeleteTx(tx);
  };

  const handleConfirmDeleteRecent = async () => {
    if (!recentDeleteTx?._id || !loggedInUser?.id) return;

    setRecentIsDeleting(true);
    try {
      const endpointType =
        recentDeleteTx.type === "expense" ? "expenses" :
        recentDeleteTx.type === "income" ? "income" : "savings";

      const res = await fetch(
        `http://localhost:5000/api/${endpointType}/${recentDeleteTx._id}?userId=${loggedInUser.id}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": loggedInUser.id
          }
        }
      );

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to delete transaction");
        return;
      }

      setRecentDeleteTx(null);
      // Recalculates Income, Expenses, Savings, and Available Balance
      fetchDashboardData();
    } catch (err) {
      console.error("Delete recent transaction error:", err);
      alert("Failed to connect to server to delete transaction.");
    } finally {
      setRecentIsDeleting(false);
    }
  };

  // Handle Adding a new Saving intentionally
  const handleAddSaving = async (e) => {
    e.preventDefault();
    setSavingFeedback({ text: "", type: "" });

    const finalTitle = savingSelectedTitle === "Other Savings" ? savingCustomTitle.trim() : savingSelectedTitle;

    if (!finalTitle || !savingAmount || Number(savingAmount) <= 0) {
      setSavingFeedback({ text: "Please enter a valid saving purpose and positive amount", type: "error" });
      return;
    }

    setSavingSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: loggedInUser.id,
          title: finalTitle,
          amount: Number(savingAmount),
          category: savingCategory,
          date: savingDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setSavingFeedback({ text: data.message || "Failed to add saving", type: "error" });
        return;
      }

      setSavingFeedback({ text: "Savings added successfully! 🎉", type: "success" });
      setSavingSelectedTitle("Emergency Fund");
      setSavingCustomTitle("");
      setSavingAmount("");
      setSavingCategory("Emergency Fund");
      setSavingDate(new Date().toISOString().split("T")[0]);

      // Re-fetch all dynamic totals immediately
      await fetchDashboardData();

      setTimeout(() => {
        setSavingFeedback({ text: "", type: "" });
        setShowSavingsModal(false);
      }, 900);
    } catch (error) {
      console.error("Add Saving Error:", error);
      setSavingFeedback({ text: "Cannot connect to server. Make sure backend is running.", type: "error" });
    } finally {
      setSavingSubmitting(false);
    }
  };

  // Donut chart calculation
  const totalExp = dashboardData.totalExpenses || 0;
  const categories = dashboardData.categoryExpenses || [];

  let donutBackground = "#e2e8f0";
  if (totalExp > 0 && categories.length > 0) {
    let currentPercent = 0;
    const gradientParts = categories.map((cat, idx) => {
      const color = CATEGORY_COLORS[cat.category] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
      const start = currentPercent;
      const slicePct = (cat.amount / totalExp) * 100;
      currentPercent += slicePct;
      const end = idx === categories.length - 1 ? 100 : Math.min(Number(currentPercent.toFixed(2)), 100);
      return `${color} ${start.toFixed(2)}% ${end}%`;
    });
    donutBackground = `conic-gradient(${gradientParts.join(", ")})`;
  }

  return (
    <div className="dashboard-page">

      {/* SIDEBAR */}
      <Sidebar activeTab="dashboard" />

      {/* MAIN CONTENT */}
      <main className="dashboard-main">

        {/* TOP BAR */}
        <Navbar title="Dashboard" subtitle={`Good morning, ${loggedInUser?.name || "User"} 👋`} />

        {/* MONTH FILTER BAR */}
        <div className="month-filter-bar">
          <div className="month-filter-info">
            <span className="month-filter-label">Active Period:</span>
            <span className="month-filter-badge">
              📅 {selectedMonth === "all" ? "All Time" : formatMonthDisplay(selectedMonth)}
            </span>
          </div>

          <div className="month-filter-controls">
            <button
              type="button"
              className="month-nav-btn"
              onClick={handlePrevMonth}
              disabled={selectedMonth === "all"}
              title="Previous Month"
            >
              ◀
            </button>

            {/* DIRECT MONTH & YEAR DROPDOWN */}
            <select
              className="month-year-dropdown"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              title="Filter by Month and Year"
            >
              <optgroup label="2026">
                <option value="2026-10">October 2026 (Current)</option>
                <option value="2026-11">November 2026</option>
                <option value="2026-12">December 2026</option>
                <option value="2026-09">September 2026</option>
                <option value="2026-08">August 2026</option>
                <option value="2026-07">July 2026</option>
                <option value="2026-06">June 2026</option>
                <option value="2026-05">May 2026</option>
                <option value="2026-04">April 2026</option>
                <option value="2026-03">March 2026</option>
                <option value="2026-02">February 2026</option>
                <option value="2026-01">January 2026</option>
              </optgroup>
              <optgroup label="2027">
                <option value="2027-01">January 2027</option>
                <option value="2027-02">February 2027</option>
                <option value="2027-03">March 2027</option>
                <option value="2027-04">April 2027</option>
                <option value="2027-05">May 2027</option>
                <option value="2027-06">June 2027</option>
                <option value="2027-07">July 2027</option>
                <option value="2027-08">August 2027</option>
                <option value="2027-09">September 2027</option>
                <option value="2027-10">October 2027</option>
                <option value="2027-11">November 2027</option>
                <option value="2027-12">December 2027</option>
              </optgroup>
              <optgroup label="2025">
                <option value="2025-12">December 2025</option>
                <option value="2025-11">November 2025</option>
                <option value="2025-10">October 2025</option>
                <option value="2025-09">September 2025</option>
                <option value="2025-08">August 2025</option>
                <option value="2025-07">July 2025</option>
                <option value="2025-06">June 2025</option>
                <option value="2025-05">May 2025</option>
                <option value="2025-04">April 2025</option>
                <option value="2025-03">March 2025</option>
                <option value="2025-02">February 2025</option>
                <option value="2025-01">January 2025</option>
              </optgroup>
              <optgroup label="All Time">
                <option value="all">All Time</option>
              </optgroup>
            </select>

            <button
              type="button"
              className="month-nav-btn"
              onClick={handleNextMonth}
              disabled={selectedMonth === "all"}
              title="Next Month"
            >
              ▶
            </button>

            <button
              type="button"
              className={`month-pill-btn ${selectedMonth === getCurrentMonthString() ? "active" : ""}`}
              onClick={() => setSelectedMonth(getCurrentMonthString())}
            >
              This Month
            </button>

            <button
              type="button"
              className={`month-pill-btn ${selectedMonth === "all" ? "active" : ""}`}
              onClick={() => setSelectedMonth("all")}
            >
              All Time
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS - CLICKABLE WITH REUSABLE MODAL */}
        <section className="summary-cards">

          {/* 1. Total Balance = Total Income - Total Expenses - Total Savings */}
          <div
            className="summary-card balance-summary clickable-card"
            onClick={() => handleCardClick("balance")}
            title="Click to view balance breakdown"
          >
            <div className="summary-top">
              <span>Total Balance</span>
              <div className="summary-icon">💳</div>
            </div>
            <h2>₹{formatAmount(dashboardData.totalBalance)}</h2>
            <p className="positive-text">
              Income − Expenses − Savings
            </p>
          </div>

          {/* 2. Total Income = Sum of logged-in user's income */}
          <div
            className="summary-card income-summary clickable-card"
            onClick={() => handleCardClick("income")}
            title="Click to view all income records"
          >
            <div className="summary-top">
              <span>Total Income</span>
              <div className="summary-icon">💰</div>
            </div>
            <h2>₹{formatAmount(dashboardData.totalIncome)}</h2>
            <p className="positive-text">
              Total earnings received
            </p>
          </div>

          {/* 3. Total Expenses = Sum of logged-in user's expenses */}
          <div
            className="summary-card expense-summary clickable-card"
            onClick={() => handleCardClick("expenses")}
            title="Click to view all expense transactions"
          >
            <div className="summary-top">
              <span>Total Expenses</span>
              <div className="summary-icon">💸</div>
            </div>
            <h2 style={{ color: "#6d43e8" }}>
              ₹{formatAmount(dashboardData.totalExpenses)}
            </h2>
            <p className="negative-text">
              Total spending records
            </p>
          </div>

          {/* 4. Total Savings = Sum of amounts intentionally added to savings */}
          <div
            className="summary-card savings-summary clickable-card"
            onClick={() => handleCardClick("savings")}
            title="Click to view all savings deposits"
          >
            <div className="summary-top">
              <span>Total Savings</span>
              <div className="summary-icon">🎯</div>
            </div>
            <h2 style={{ color: "#6d43e8" }}>
              ₹{formatAmount(dashboardData.totalSavings)}
            </h2>
            <p className="positive-text">
              Intentionally saved amount
            </p>
          </div>

        </section>

        {/* CONTENT GRID */}
        <section className="dashboard-grid">

          {/* EXPENSE CHART */}
          <div className="dashboard-card expense-chart-card">
            <div className="card-heading">
              <div>
                <h2>Expense Overview</h2>
                <p>Track where your money goes</p>
              </div>

              <span className="month-filter-badge" style={{ fontSize: "11px", padding: "4px 10px" }}>
                📅 {selectedMonth === "all" ? "All Time" : formatMonthDisplay(selectedMonth)}
              </span>
            </div>

            <div className="chart-content">
              <div
                className="big-donut"
                style={{ background: donutBackground }}
              >
                <div className="donut-inside">
                  <strong>₹{formatAmount(dashboardData.totalExpenses)}</strong>
                  <span>Total Expense</span>
                </div>
              </div>

              <div className="expense-legend">
                {categories.length > 0 ? (
                  categories.map((cat, idx) => {
                    const color = CATEGORY_COLORS[cat.category] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
                    return (
                      <div key={cat.category} className="expense-legend-row">
                        <span
                          className="legend-dot"
                          style={{ backgroundColor: color }}
                        ></span>
                        <div className="legend-label-col">
                          <span className="legend-cat-name" title={cat.category}>{cat.category}</span>
                          <span className="legend-cat-amount">₹{formatAmount(cat.amount)}</span>
                        </div>
                        <strong className="legend-percentage">{cat.percentage}%</strong>
                      </div>
                    );
                  })
                ) : (
                  <div className="expense-empty-legend">
                    <span className="empty-legend-icon">📊</span>
                    <p className="empty-legend-title">No expenses recorded</p>
                    <span className="empty-legend-subtitle">
                      {selectedMonth === "all" ? "No expense history" : `No expenses in ${formatMonthDisplay(selectedMonth)}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="dashboard-card quick-card">
            <div className="card-heading">
              <div>
                <h2>Quick Actions</h2>
                <p>Manage your finances</p>
              </div>
            </div>

            <button
              className="quick-action add-expense"
              type="button"
              onClick={() => navigate("/expenses")}
            >
              <span>➕</span>
              <div>
                <strong>Add Expense</strong>
                <p>Record a new expense</p>
              </div>
              <span>→</span>
            </button>

            <button
              className="quick-action add-income"
              type="button"
              onClick={() => navigate("/income")}
            >
              <span>💰</span>
              <div>
                <strong>Add Income</strong>
                <p>Record your income</p>
              </div>
              <span>→</span>
            </button>

            <button
              className="quick-action add-saving"
              type="button"
              onClick={() => setShowSavingsModal(true)}
            >
              <span>🎯</span>
              <div>
                <strong>Add Savings</strong>
                <p>Enter an amount to save</p>
              </div>
              <span>→</span>
            </button>

            <button
              className="quick-action view-report"
              type="button"
              onClick={() => navigate("/reports")}
            >
              <span>📊</span>
              <div>
                <strong>View Reports</strong>
                <p>Analyze your spending</p>
              </div>
              <span>→</span>
            </button>
          </div>

        </section>

        {/* RECENT TRANSACTIONS */}
        <section className="dashboard-card transactions-card">
          <div className="card-heading">
            <div>
              <h2>Recent Transactions</h2>
              <p>Combined Income, Expenses & Savings for {selectedMonth === "all" ? "All Time" : formatMonthDisplay(selectedMonth)}</p>
            </div>

            <button
              className="view-all"
              type="button"
              onClick={() => handleCardClick("all-transactions")}
              title="View all combined transactions for this period"
            >
              View All ({dashboardData.allTransactions ? dashboardData.allTransactions.length : dashboardData.recentTransactions ? dashboardData.recentTransactions.length : 0}) →
            </button>
          </div>

          <div className="transaction-table">
            <div className="table-head has-actions">
              <span>Transaction</span>
              <span>Type / Category</span>
              <span>Date</span>
              <span>Amount</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>

            {dashboardData.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
              dashboardData.recentTransactions.map((tx) => {
                const isExpense = tx.type === "expense";
                const isSaving = tx.type === "saving";
                const isIncome = tx.type === "income";
                const icon = getCategoryIcon(tx.category, tx.type);
                const formattedDate = new Date(tx.date).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                });

                return (
                  <div className="table-row has-actions" key={tx._id}>
                    <div className="transaction-name">
                      <div className={`transaction-round ${isExpense ? "food-round" : isSaving ? "savings-round" : "salary-round"}`}>
                        {icon}
                      </div>
                      <div>
                        <strong>{tx.title}</strong>
                        <span>{isExpense ? "Expense" : isSaving ? "Savings Deposit" : "Income"}</span>
                      </div>
                    </div>

                    <span className={`category ${isExpense ? "food-category" : isSaving ? "savings-category" : "income-category"}`}>
                      {isExpense ? `Expense • ${tx.category}` : isSaving ? `Saving • ${tx.category}` : `Income • ${tx.category}`}
                    </span>

                    <span>{formattedDate}</span>

                    <strong className={isExpense ? "amount-expense" : isSaving ? "amount-saving" : "amount-income"}>
                      {isExpense ? `-₹${formatAmount(tx.amount)}` : isIncome ? `+₹${formatAmount(tx.amount)}` : `🎯 ₹${formatAmount(tx.amount)}`}
                    </strong>

                    <div className="table-row-actions">
                      <button
                        type="button"
                        className="table-action-btn edit-btn"
                        title="Edit transaction"
                        onClick={() => handleEditRecent(tx)}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="table-action-btn delete-btn"
                        title="Delete transaction"
                        onClick={() => handleDeleteRecent(tx)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#9aa1b0", fontSize: "13px" }}>
                No transactions found for {selectedMonth === "all" ? "this account" : formatMonthDisplay(selectedMonth)}. Start by recording an income, expense, or savings!
              </div>
            )}
          </div>
        </section>

      </main>

      {/* REUSABLE SUMMARY CARD DETAILS MODAL FOR ALL 4 CARDS */}
      <SummaryCardModal
        isOpen={!!activeSummaryModal}
        onClose={() => setActiveSummaryModal(null)}
        type={activeSummaryModal}
        records={modalRecords}
        dashboardData={dashboardData}
        loading={modalLoading}
        formatAmount={formatAmount}
        selectedMonth={selectedMonth}
        onTransactionModified={handleTransactionModified}
        loggedInUser={loggedInUser}
      />

      {/* EDIT MODAL FOR RECENT TRANSACTIONS */}
      <EditTransactionModal
        isOpen={!!recentEditTx}
        onClose={() => setRecentEditTx(null)}
        transaction={recentEditTx}
        onSuccess={() => {
          fetchDashboardData();
        }}
        loggedInUser={loggedInUser}
      />

      {/* CONFIRM DELETE MODAL FOR RECENT TRANSACTIONS */}
      <ConfirmDeleteModal
        isOpen={!!recentDeleteTx}
        onClose={() => setRecentDeleteTx(null)}
        onConfirm={handleConfirmDeleteRecent}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction?"
        itemTitle={recentDeleteTx?.title}
        itemAmount={recentDeleteTx?.amount}
        isDeleting={recentIsDeleting}
      />

      {/* ADD SAVINGS MODAL */}
      {showSavingsModal && (
        <div className="modal-backdrop" onClick={() => setShowSavingsModal(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎯 Add to Savings</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowSavingsModal(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "16px" }}>
              Intentionally allocate funds to your personal savings goal. This will reduce your liquid balance and increase your total savings.
            </p>

            <form onSubmit={handleAddSaving}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                
                {/* SAVING TITLE DROPDOWN */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "600", color: "#5b3cc4" }}>
                    Saving Title / Purpose
                  </label>
                  <SearchableDropdown
                    options={SAVING_TITLES}
                    value={savingSelectedTitle}
                    onChange={handleSavingTitleSelect}
                    placeholder="Search or select savings purpose..."
                    ariaLabel="Saving Title"
                  />
                </div>

                {/* CUSTOM TITLE (IF OTHER SAVINGS) */}
                {savingSelectedTitle === "Other Savings" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "600", color: "#5b3cc4" }}>
                      Custom Saving Title
                    </label>
                    <input
                      type="text"
                      placeholder="Specify saving goal / purpose..."
                      value={savingCustomTitle}
                      onChange={(e) => setSavingCustomTitle(e.target.value)}
                      style={{
                        height: "44px",
                        padding: "0 14px",
                        border: "1px solid #e2e4ed",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontFamily: "inherit"
                      }}
                      required
                    />
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "600", color: "#5b3cc4" }}>
                    Amount to Save (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    value={savingAmount}
                    onChange={(e) => setSavingAmount(e.target.value)}
                    style={{
                      height: "44px",
                      padding: "0 14px",
                      border: "1px solid #e2e4ed",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontFamily: "inherit"
                    }}
                    required
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "600", color: "#5b3cc4" }}>
                    Category
                  </label>
                  <select
                    value={savingCategory}
                    onChange={(e) => setSavingCategory(e.target.value)}
                    style={{
                      height: "44px",
                      padding: "0 14px",
                      border: "1px solid #e2e4ed",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontFamily: "inherit",
                      background: "white"
                    }}
                  >
                    <option value="Emergency Fund">Emergency Fund</option>
                    <option value="Retirement">Retirement</option>
                    <option value="Investment">Investment</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Big Purchase">Big Purchase</option>
                    <option value="General Savings">General Savings</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "600", color: "#5b3cc4" }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={savingDate}
                    onChange={(e) => setSavingDate(e.target.value)}
                    style={{
                      height: "44px",
                      padding: "0 14px",
                      border: "1px solid #e2e4ed",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontFamily: "inherit"
                    }}
                    required
                  />
                </div>

                {savingFeedback.text && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "600",
                      textAlign: "center",
                      color: savingFeedback.type === "error" ? "#dc2626" : "#16a34a",
                      backgroundColor: savingFeedback.type === "error" ? "#fef2f2" : "#f0fdf4",
                      border: savingFeedback.type === "error" ? "1px solid #fecaca" : "1px solid #bbf7d0"
                    }}
                  >
                    {savingFeedback.text}
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowSavingsModal(false)}
                    style={{
                      flex: 1,
                      height: "44px",
                      background: "#f3f4f6",
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: "600",
                      fontSize: "13px",
                      color: "#4b5563",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSubmitting}
                    style={{
                      flex: 2,
                      height: "44px",
                      background: "linear-gradient(135deg, #6845ec, #8539e8)",
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: "700",
                      fontSize: "13px",
                      color: "white",
                      cursor: "pointer",
                      boxShadow: "0 8px 20px rgba(105, 61, 225, 0.25)"
                    }}
                  >
                    {savingSubmitting ? "Saving..." : "🎯 Save Amount"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
