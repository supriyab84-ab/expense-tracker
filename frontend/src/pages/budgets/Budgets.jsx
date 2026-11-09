import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "./Budgets.css";

const PRESET_AMOUNTS = [10000, 15000, 20000, 30000, 50000, 75000];

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
  Other: "#64748b",
  Others: "#64748b"
};

const getCurrentMonthString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatMonthDisplay = (monthStr) => {
  if (!monthStr) return "";
  const [yearStr, monthNumStr] = monthStr.split("-");
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthNumStr, 10);
  if (isNaN(y) || isNaN(m)) return monthStr;
  const date = new Date(Date.UTC(y, m - 1, 1));
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
};

const getCategoryIcon = (category) => {
  const map = {
    Food: "🍔",
    Transport: "🚗",
    Housing: "🏠",
    Shopping: "🛍️",
    Bills: "🧾",
    Health: "💊",
    Education: "🎓",
    Entertainment: "🎬",
    Maintenance: "🔧",
    Other: "📦"
  };
  return map[category] || "💸";
};

function Budgets() {
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [budgetData, setBudgetData] = useState({
    hasBudget: false,
    budget: null,
    month: 10,
    year: 2026,
    monthlyBudget: 0,
    monthlyExpenses: 0,
    remainingBudget: 0,
    usedPercentage: 0,
    categoryBreakdown: []
  });

  const [budgetInput, setBudgetInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ text: "", type: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  const formatAmount = (amt) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(amt) || 0);
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
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

  // Fetch Budget & Expenses strictly for this logged-in user and selected month
  const fetchBudgetData = useCallback(async () => {
    if (!loggedInUser?.id) {
      setLoading(false);
      return;
    }

    const [yearStr, monthNumStr] = selectedMonth.split("-");
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthNumStr, 10);

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/budgets/user/${loggedInUser.id}?month=${m}&year=${y}`,
        {
          headers: {
            "x-user-id": loggedInUser.id
          }
        }
      );

      const data = await response.json();
      if (!response.ok) {
        console.error("Budget fetch error:", data.message);
        return;
      }

      setBudgetData(data);
      if (data.hasBudget && data.monthlyBudget > 0) {
        setBudgetInput(String(data.monthlyBudget));
      } else {
        setBudgetInput("");
      }
    } catch (error) {
      console.error("Failed to load budget data:", error);
    } finally {
      setLoading(false);
    }
  }, [loggedInUser?.id, selectedMonth]);

  useEffect(() => {
    fetchBudgetData();
    setFeedback({ text: "", type: "" });
  }, [fetchBudgetData]);

  // Set / Update Monthly Budget
  const handleSaveBudget = async (e) => {
    e?.preventDefault();
    setFeedback({ text: "", type: "" });

    const numAmount = Number(budgetInput);
    if (!budgetInput || isNaN(numAmount) || numAmount <= 0) {
      setFeedback({ text: "Please enter a valid positive budget amount (e.g. 20000)", type: "error" });
      return;
    }

    const [yearStr, monthNumStr] = selectedMonth.split("-");
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthNumStr, 10);

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": loggedInUser.id
        },
        body: JSON.stringify({
          user: loggedInUser.id,
          month: m,
          year: y,
          amount: numAmount
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setFeedback({ text: data.message || "Failed to save monthly budget", type: "error" });
        return;
      }

      setFeedback({
        text: `Monthly budget of ₹${formatAmount(numAmount)} saved for ${formatMonthDisplay(selectedMonth)}! 🎯`,
        type: "success"
      });

      await fetchBudgetData();

      setTimeout(() => {
        setFeedback({ text: "", type: "" });
      }, 3500);
    } catch (error) {
      console.error("Save Budget Error:", error);
      setFeedback({ text: "Cannot connect to server. Please ensure backend is running.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete / Reset Budget for current month
  const handleDeleteBudget = async () => {
    if (!budgetData.budget?._id || !loggedInUser?.id) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove the budget for ${formatMonthDisplay(selectedMonth)}?`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/budgets/${budgetData.budget._id}?userId=${loggedInUser.id}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": loggedInUser.id
          }
        }
      );

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Failed to remove budget");
        return;
      }

      setBudgetInput("");
      setFeedback({
        text: `Budget removed for ${formatMonthDisplay(selectedMonth)}.`,
        type: "success"
      });
      await fetchBudgetData();

      setTimeout(() => {
        setFeedback({ text: "", type: "" });
      }, 3000);
    } catch (err) {
      console.error("Delete budget error:", err);
      alert("Failed to connect to server to remove budget.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculations
  const hasBudget = budgetData.hasBudget && budgetData.monthlyBudget > 0;
  const monthlyBudget = budgetData.monthlyBudget || 0;
  const monthlyExpenses = budgetData.monthlyExpenses || 0;
  const remainingBudget = budgetData.remainingBudget;
  const usedPercentage = budgetData.usedPercentage || 0;

  // Progress Bar styling & warning thresholds
  const isExceeded = hasBudget && usedPercentage >= 100;
  const isApproaching = hasBudget && usedPercentage >= 80 && usedPercentage < 100;
  const isHealthy = hasBudget && usedPercentage < 80;

  let progressGradient = "linear-gradient(90deg, #6d43e8, #9b5de5)";
  let statusBadgeClass = "status-safe";
  let statusText = "Within Budget";

  if (!hasBudget) {
    statusBadgeClass = "status-unset";
    statusText = "No Budget Set";
  } else if (isExceeded) {
    progressGradient = "linear-gradient(90deg, #ef4444, #dc2626)";
    statusBadgeClass = "status-danger";
    statusText = "Budget Exceeded";
  } else if (isApproaching) {
    progressGradient = "linear-gradient(90deg, #f59e0b, #f97316)";
    statusBadgeClass = "status-warning";
    statusText = "Approaching Limit";
  }

  return (
    <div className="dashboard-page">
      <Sidebar activeTab="budgets" />

      <main className="dashboard-main">
        <Navbar
          title="Monthly Budgets"
          subtitle={`Plan spending limits & track progress for ${formatMonthDisplay(selectedMonth)}`}
        />

        <div className="budgets-container">

          {/* MONTH & YEAR FILTER BAR */}
          <div className="month-filter-bar">
            <div className="month-filter-info">
              <span className="month-filter-label">Budget Period:</span>
              <span className="month-filter-badge">
                📅 {formatMonthDisplay(selectedMonth)}
              </span>
            </div>

            <div className="month-filter-controls">
              <button
                type="button"
                className="month-nav-btn"
                onClick={handlePrevMonth}
                title="Previous Month"
              >
                ◀
              </button>

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
                </optgroup>
              </select>

              <button
                type="button"
                className="month-nav-btn"
                onClick={handleNextMonth}
                title="Next Month"
              >
                ▶
              </button>
            </div>
          </div>

          {/* DYNAMIC WARNING / STATUS BANNER */}
          {hasBudget && isExceeded && (
            <div className="budget-status-banner alert-danger">
              <span className="banner-icon">🚨</span>
              <div className="banner-content">
                <strong>Budget Exceeded Alert!</strong>
                <p>
                  You have exceeded your monthly budget for {formatMonthDisplay(selectedMonth)} by{" "}
                  <strong>₹{formatAmount(Math.abs(remainingBudget))}</strong> ({usedPercentage}% used). Total spending
                  has reached ₹{formatAmount(monthlyExpenses)} against your ₹{formatAmount(monthlyBudget)} limit.
                </p>
              </div>
            </div>
          )}

          {hasBudget && isApproaching && (
            <div className="budget-status-banner alert-warning">
              <span className="banner-icon">⚠️</span>
              <div className="banner-content">
                <strong>Approaching Budget Limit Warning!</strong>
                <p>
                  You have used <strong>{usedPercentage}%</strong> of your monthly budget. Only{" "}
                  <strong>₹{formatAmount(remainingBudget)}</strong> remains before reaching your ₹
                  {formatAmount(monthlyBudget)} limit for {formatMonthDisplay(selectedMonth)}.
                </p>
              </div>
            </div>
          )}

          {hasBudget && isHealthy && (
            <div className="budget-status-banner alert-success">
              <span className="banner-icon">✅</span>
              <div className="banner-content">
                <strong>Spending on Track!</strong>
                <p>
                  You have used <strong>{usedPercentage}%</strong> of your monthly budget. You have{" "}
                  <strong>₹{formatAmount(remainingBudget)}</strong> remaining of your ₹
                  {formatAmount(monthlyBudget)} limit for {formatMonthDisplay(selectedMonth)}.
                </p>
              </div>
            </div>
          )}

          {!hasBudget && !loading && (
            <div className="budget-status-banner alert-info">
              <span className="banner-icon">ℹ️</span>
              <div className="banner-content">
                <strong>No Monthly Budget Set for {formatMonthDisplay(selectedMonth)}</strong>
                <p>
                  Set a monthly budget below to track spending limits, monitor progress in real-time, and receive smart budget alerts.
                </p>
              </div>
            </div>
          )}

          {/* 4 SUMMARY METRIC CARDS */}
          <section className="summary-cards">
            {/* 1. Monthly Budget */}
            <div className="summary-card income-summary">
              <div className="summary-top">
                <span>Monthly Budget</span>
                <div className="summary-icon">🎯</div>
              </div>
              <h2 style={{ color: "#6d43e8" }}>
                ₹{formatAmount(monthlyBudget)}
              </h2>
              <p className="positive-text">
                {hasBudget ? `Target limit for ${formatMonthDisplay(selectedMonth)}` : "No limit configured"}
              </p>
            </div>

            {/* 2. Monthly Expenses */}
            <div className="summary-card expense-summary">
              <div className="summary-top">
                <span>Monthly Expenses</span>
                <div className="summary-icon">💸</div>
              </div>
              <h2 style={{ color: isExceeded ? "#ef4444" : "#6d43e8" }}>
                ₹{formatAmount(monthlyExpenses)}
              </h2>
              <p className={isExceeded ? "negative-text" : "positive-text"}>
                Actual spending in {formatMonthDisplay(selectedMonth)}
              </p>
            </div>

            {/* 3. Remaining Budget */}
            <div className="summary-card balance-summary">
              <div className="summary-top">
                <span>Remaining Budget</span>
                <div className="summary-icon">💼</div>
              </div>
              <h2 style={{ color: remainingBudget < 0 ? "#ef4444" : "#10b981" }}>
                {remainingBudget < 0 ? `-₹${formatAmount(Math.abs(remainingBudget))}` : `₹${formatAmount(remainingBudget)}`}
              </h2>
              <p className={remainingBudget < 0 ? "negative-text" : "positive-text"}>
                {hasBudget
                  ? remainingBudget >= 0
                    ? "Available to spend"
                    : `Over budget by ₹${formatAmount(Math.abs(remainingBudget))}`
                  : "Set a budget to calculate"}
              </p>
            </div>

            {/* 4. Budget Used Percentage */}
            <div className="summary-card savings-summary">
              <div className="summary-top">
                <span>Budget Used</span>
                <div className="summary-icon">📊</div>
              </div>
              <h2 style={{ color: isExceeded ? "#ef4444" : isApproaching ? "#f59e0b" : "#6d43e8" }}>
                {usedPercentage}%
              </h2>
              <p className={isExceeded ? "negative-text" : "positive-text"}>
                {hasBudget ? (isExceeded ? "Exceeded 100% threshold" : `${(100 - usedPercentage).toFixed(1)}% remaining`) : "N/A"}
              </p>
            </div>
          </section>

          {/* MAIN GRID: PROGRESS & SET BUDGET FORM */}
          <section className="budget-grid">

            {/* LEFT COLUMN: PROGRESS INDICATOR & CATEGORY BREAKDOWN */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

              {/* BUDGET PROGRESS INDICATOR CARD */}
              <div className="dashboard-card budget-progress-card">
                <div className="card-heading">
                  <div>
                    <h2>Budget Progress Indicator</h2>
                    <p>
                      {hasBudget
                        ? `Visual utilization of your ₹${formatAmount(monthlyBudget)} budget`
                        : "Configure a monthly budget to activate live tracking"}
                    </p>
                  </div>
                  <span className={`budget-status-pill ${statusBadgeClass}`}>
                    {statusText}
                  </span>
                </div>

                {/* Main Progress Bar */}
                <div className="budget-progress-track">
                  <div
                    className="budget-progress-fill"
                    style={{
                      width: `${Math.min(usedPercentage, 100)}%`,
                      background: progressGradient
                    }}
                  ></div>
                </div>

                {/* Progress Details Row */}
                <div className="progress-labels">
                  <div>
                    <span>Used: </span>
                    <strong style={{ color: isExceeded ? "#ef4444" : "#1e293b" }}>
                      {usedPercentage}% (₹{formatAmount(monthlyExpenses)})
                    </strong>
                  </div>
                  <div>
                    <span>Remaining: </span>
                    <strong style={{ color: remainingBudget < 0 ? "#ef4444" : "#10b981" }}>
                      {remainingBudget < 0
                        ? `Over by ₹${formatAmount(Math.abs(remainingBudget))}`
                        : `₹${formatAmount(remainingBudget)}`}
                    </strong>
                  </div>
                </div>

                {/* Formula Breakdown Indicator */}
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    fontSize: "11px",
                    color: "#64748b",
                    lineHeight: 1.6
                  }}
                >
                  <div>
                    <strong>Remaining Budget</strong> = Monthly Budget (₹{formatAmount(monthlyBudget)}) − Monthly Expenses (₹{formatAmount(monthlyExpenses)}) ={" "}
                    <strong style={{ color: remainingBudget < 0 ? "#ef4444" : "#10b981" }}>
                      ₹{formatAmount(remainingBudget)}
                    </strong>
                  </div>
                  <div>
                    <strong>Budget Used Percentage</strong> = (₹{formatAmount(monthlyExpenses)} / ₹{formatAmount(monthlyBudget)}) × 100 ={" "}
                    <strong>{usedPercentage}%</strong>
                  </div>
                </div>
              </div>

              {/* MONTHLY CATEGORY SPENDING BREAKDOWN */}
              <div className="dashboard-card category-breakdown-card">
                <div className="card-heading">
                  <div>
                    <h2>Category Spending Breakdown</h2>
                    <p>Where your budget is being spent in {formatMonthDisplay(selectedMonth)}</p>
                  </div>
                  <span className="month-filter-badge" style={{ fontSize: "11px", padding: "4px 10px" }}>
                    {budgetData.categoryBreakdown?.length || 0} Categories
                  </span>
                </div>

                {budgetData.categoryBreakdown && budgetData.categoryBreakdown.length > 0 ? (
                  <div className="category-breakdown-list">
                    {budgetData.categoryBreakdown.map((item) => {
                      const color = CATEGORY_COLORS[item.category] || "#7147e9";
                      const icon = getCategoryIcon(item.category);
                      return (
                        <div key={item.category} className="category-breakdown-item">
                          <div className="cat-item-header">
                            <span className="cat-item-name">
                              <span>{icon}</span>
                              {item.category}
                            </span>
                            <div className="cat-item-amounts">
                              <span className="cat-item-amount">₹{formatAmount(item.amount)}</span>
                              <span className="cat-item-pct">({item.percentage}%)</span>
                            </div>
                          </div>
                          <div className="cat-progress-track">
                            <div
                              className="cat-progress-fill"
                              style={{
                                width: `${item.percentage}%`,
                                backgroundColor: color
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8", fontSize: "12px" }}>
                    No expenses recorded in {formatMonthDisplay(selectedMonth)}.
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: SET / UPDATE MONTHLY BUDGET FORM */}
            <div className="dashboard-card budget-form-card">
              <div className="card-heading">
                <div>
                  <h2>{hasBudget ? "Update Monthly Budget" : "Set Monthly Budget"}</h2>
                  <p>Target spending limit for {formatMonthDisplay(selectedMonth)}</p>
                </div>
              </div>

              {feedback.text && (
                <div className={`budget-feedback ${feedback.type}`}>
                  {feedback.text}
                </div>
              )}

              <form onSubmit={handleSaveBudget} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px", display: "block" }}>
                    Budget Amount for {formatMonthDisplay(selectedMonth)} (₹)
                  </label>
                  <div className="budget-input-wrapper">
                    <span className="budget-currency-symbol">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      className="budget-amount-input"
                      placeholder="e.g. 20000"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "8px", display: "block" }}>
                    Quick Presets:
                  </label>
                  <div className="budget-presets">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className={`preset-chip ${Number(budgetInput) === amt ? "active" : ""}`}
                        onClick={() => setBudgetInput(String(amt))}
                      >
                        ₹{amt.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: "#fdf4ff",
                    border: "1px solid #f5d0fe",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    fontSize: "11px",
                    color: "#86198f",
                    lineHeight: 1.5
                  }}
                >
                  💡 <strong>Monthly Separation:</strong> Your {formatMonthDisplay(selectedMonth)} budget is stored independently in MongoDB. Changing this will not affect previous or future months.
                </div>

                <div className="budget-actions">
                  <button
                    type="submit"
                    className="btn-save-budget"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : hasBudget ? "Update Budget 💾" : "Set Monthly Budget 🎯"}
                  </button>

                  {hasBudget && (
                    <button
                      type="button"
                      className="btn-delete-budget"
                      onClick={handleDeleteBudget}
                      disabled={isDeleting}
                      title="Reset budget for this month"
                    >
                      {isDeleting ? "..." : "🗑️"}
                    </button>
                  )}
                </div>
              </form>

              {/* Budget Month History Pill */}
              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "16px",
                  borderTop: "1px solid #f1f5f9",
                  fontSize: "11px",
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <span>Current Month: <strong>{formatMonthDisplay(selectedMonth)}</strong></span>
                <span>User: <strong>{loggedInUser?.name || "Logged In"}</strong></span>
              </div>
            </div>

          </section>

        </div>
      </main>
    </div>
  );
}

export default Budgets;
