import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "./Reports.css";

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

const FALLBACK_COLORS = [
  "#7147e9",
  "#3586f6",
  "#ff655f",
  "#f7b82d",
  "#28b875",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#6366f1",
  "#f97316"
];

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
    Salary: "💼",
    Freelance: "💻",
    Savings: "🎯",
    Emergency: "🛡️",
    Investment: "📈",
    Other: "📦"
  };
  return map[category] || "💸";
};

function Reports() {
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [reportData, setReportData] = useState({
    summary: {
      totalIncome: 0,
      totalExpenses: 0,
      totalSavings: 0,
      totalBalance: 0,
      savingsRate: 0,
      dailyAverageExpense: 0,
      highestExpenseCategory: null,
      largestExpense: null,
      totalTransactions: 0,
      incomeCount: 0,
      expenseCount: 0,
      savingCount: 0
    },
    categoryExpenses: [],
    incomeVsExpensesVsSavings: {
      totalIncome: 0,
      totalExpenses: 0,
      totalSavings: 0,
      totalBalance: 0,
      expensePercentageOfIncome: 0,
      savingsPercentageOfIncome: 0,
      balancePercentageOfIncome: 0,
      expenseShare: 0,
      savingsShare: 0,
      balanceShare: 0
    }
  });

  const [loading, setLoading] = useState(true);

  const formatAmount = (amt) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(amt) || 0);
  };

  // Month navigation handlers
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

  // Fetch real report data from MongoDB strictly for this user and selected month
  const fetchReportData = useCallback(async () => {
    if (!loggedInUser?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/reports/${loggedInUser.id}?month=${selectedMonth}`,
        {
          headers: {
            "x-user-id": loggedInUser.id
          }
        }
      );

      const data = await response.json();
      if (!response.ok) {
        console.error("Report fetch error:", data.message);
        return;
      }

      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }, [loggedInUser?.id, selectedMonth]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const summary = reportData.summary || {};
  const categoryExpenses = reportData.categoryExpenses || [];
  const incomeVsExpense = reportData.incomeVsExpensesVsSavings || {};

  // Donut chart calculation for Category Expenses
  const totalExp = summary.totalExpenses || 0;
  let donutBackground = "#e2e8f0";
  if (totalExp > 0 && categoryExpenses.length > 0) {
    let currentPercent = 0;
    const gradientParts = categoryExpenses.map((cat, idx) => {
      const color = CATEGORY_COLORS[cat.category] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
      const start = currentPercent;
      const slicePct = (cat.amount / totalExp) * 100;
      currentPercent += slicePct;
      const end = idx === categoryExpenses.length - 1 ? 100 : Math.min(Number(currentPercent.toFixed(2)), 100);
      return `${color} ${start.toFixed(2)}% ${end}%`;
    });
    donutBackground = `conic-gradient(${gradientParts.join(", ")})`;
  }

  // Multi-segment flow bar calculation
  const totalFlow = summary.totalExpenses + summary.totalSavings + Math.max(0, summary.totalBalance);
  const expenseFlowPct = totalFlow > 0 ? (summary.totalExpenses / totalFlow) * 100 : 0;
  const savingsFlowPct = totalFlow > 0 ? (summary.totalSavings / totalFlow) * 100 : 0;
  const balanceFlowPct = totalFlow > 0 ? (Math.max(0, summary.totalBalance) / totalFlow) * 100 : 0;

  // Benchmark for Comparative Cards: maximum of Income, Expenses, Savings to scale progress bars
  const maxFlowAmount = Math.max(
    summary.totalIncome || 0,
    summary.totalExpenses || 0,
    summary.totalSavings || 0,
    1
  );

  return (
    <div className="dashboard-page">
      <Sidebar activeTab="reports" />

      <main className="dashboard-main">
        <Navbar
          title="Financial Reports & Analytics"
          subtitle={`Comprehensive financial breakdown for ${formatMonthDisplay(selectedMonth)}`}
        />

        <div className="reports-container">

          {/* MONTH & YEAR FILTER BAR */}
          <div className="month-filter-bar">
            <div className="month-filter-info">
              <span className="month-filter-label">Report Period:</span>
              <span className="month-filter-badge">
                📅 {formatMonthDisplay(selectedMonth)}
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
                <optgroup label="Cumulative">
                  <option value="all">All Time History</option>
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
                className={`month-pill-btn ${selectedMonth === "all" ? "active" : ""}`}
                onClick={() => setSelectedMonth("all")}
              >
                All Time
              </button>
            </div>
          </div>

          {/* 1. CORE 4 METRICS SUMMARY CARDS */}
          <section className="summary-cards">
            {/* Total Income */}
            <div className="summary-card income-summary">
              <div className="summary-top">
                <span>Total Income</span>
                <div className="summary-icon">💰</div>
              </div>
              <h2>+₹{formatAmount(summary.totalIncome)}</h2>
              <p className="positive-text">
                {summary.incomeCount || 0} earnings transaction{summary.incomeCount === 1 ? "" : "s"}
              </p>
            </div>

            {/* Total Expenses */}
            <div className="summary-card expense-summary">
              <div className="summary-top">
                <span>Total Expenses</span>
                <div className="summary-icon">💸</div>
              </div>
              <h2 style={{ color: "#6d43e8" }}>
                -₹{formatAmount(summary.totalExpenses)}
              </h2>
              <p className="negative-text">
                {summary.expenseCount || 0} expense transaction{summary.expenseCount === 1 ? "" : "s"}
              </p>
            </div>

            {/* Total Savings */}
            <div className="summary-card savings-summary">
              <div className="summary-top">
                <span>Total Savings</span>
                <div className="summary-icon">🎯</div>
              </div>
              <h2 style={{ color: "#6d43e8" }}>
                🎯 ₹{formatAmount(summary.totalSavings)}
              </h2>
              <p className="positive-text">
                {summary.savingCount || 0} intentional deposit{summary.savingCount === 1 ? "" : "s"}
              </p>
            </div>

            {/* Available Balance */}
            <div className="summary-card balance-summary">
              <div className="summary-top">
                <span>Available Balance</span>
                <div className="summary-icon">💳</div>
              </div>
              <h2 style={{ color: summary.totalBalance < 0 ? "#ef4444" : "#10b981" }}>
                {summary.totalBalance < 0
                  ? `-₹${formatAmount(Math.abs(summary.totalBalance))}`
                  : `₹${formatAmount(summary.totalBalance)}`}
              </h2>
              <p className={summary.totalBalance < 0 ? "negative-text" : "positive-text"}>
                Income − Expenses − Savings
              </p>
            </div>
          </section>

          {/* 2. INCOME VS EXPENSES VS SAVINGS SECTION */}
          <section className="dashboard-card cashflow-card">
            <div className="card-heading">
              <div>
                <h2>Income vs Expenses vs Savings</h2>
                <p>Allocation of money received, spent, and preserved in {formatMonthDisplay(selectedMonth)}</p>
              </div>
              <span className="month-filter-badge" style={{ fontSize: "11px", padding: "4px 10px" }}>
                Cash Flow Analysis
              </span>
            </div>

            {/* Multi-segment flow bar */}
            <div className="flow-bar-wrapper">
              <div className="flow-bar-track">
                {totalFlow > 0 ? (
                  <>
                    <div
                      className="flow-segment segment-expenses"
                      style={{ width: `${expenseFlowPct}%` }}
                      title={`Expenses: ${expenseFlowPct.toFixed(1)}%`}
                    ></div>
                    <div
                      className="flow-segment segment-savings"
                      style={{ width: `${savingsFlowPct}%` }}
                      title={`Savings: ${savingsFlowPct.toFixed(1)}%`}
                    ></div>
                    <div
                      className="flow-segment segment-balance"
                      style={{ width: `${balanceFlowPct}%` }}
                      title={`Available Balance: ${balanceFlowPct.toFixed(1)}%`}
                    ></div>
                  </>
                ) : (
                  <div style={{ width: "100%", background: "#e2e8f0" }}></div>
                )}
              </div>

              {/* Legend with exact amounts & percentages */}
              <div className="flow-legend">
                <div className="flow-legend-item">
                  <span className="flow-dot expenses"></span>
                  <span>Expenses: </span>
                  <strong>₹{formatAmount(summary.totalExpenses)}</strong>
                  <span>({expenseFlowPct.toFixed(1)}%)</span>
                </div>

                <div className="flow-legend-item">
                  <span className="flow-dot savings"></span>
                  <span>Savings: </span>
                  <strong>₹{formatAmount(summary.totalSavings)}</strong>
                  <span>({savingsFlowPct.toFixed(1)}%)</span>
                </div>

                <div className="flow-legend-item">
                  <span className="flow-dot balance"></span>
                  <span>Available Balance: </span>
                  <strong>₹{formatAmount(summary.totalBalance)}</strong>
                  <span>({balanceFlowPct.toFixed(1)}%)</span>
                </div>
              </div>
            </div>

            {/* Side-by-side comparative cards with progress bars */}
            <div className="comparison-grid">
              {/* Income */}
              <div className="comparison-box">
                <div className="comparison-box-top">
                  <span>Total Income</span>
                  <span className="comp-icon">💰</span>
                </div>
                <h4 style={{ color: "#16a34a" }}>
                  +₹{formatAmount(summary.totalIncome)}
                </h4>
                <div className="comp-bar-track">
                  <div
                    className="comp-bar-fill"
                    style={{
                      width: `${(summary.totalIncome / maxFlowAmount) * 100}%`,
                      background: "linear-gradient(90deg, #16a34a, #22c55e)"
                    }}
                  ></div>
                </div>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  Base Revenue Benchmark (100%)
                </span>
              </div>

              {/* Expenses */}
              <div className="comparison-box">
                <div className="comparison-box-top">
                  <span>Total Expenses</span>
                  <span className="comp-icon">💸</span>
                </div>
                <h4 style={{ color: "#ef4444" }}>
                  -₹{formatAmount(summary.totalExpenses)}
                </h4>
                <div className="comp-bar-track">
                  <div
                    className="comp-bar-fill"
                    style={{
                      width: `${(summary.totalExpenses / maxFlowAmount) * 100}%`,
                      background: "linear-gradient(90deg, #ff655f, #ef4444)"
                    }}
                  ></div>
                </div>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  {incomeVsExpense.expensePercentageOfIncome || 0}% of Total Income
                </span>
              </div>

              {/* Savings */}
              <div className="comparison-box">
                <div className="comparison-box-top">
                  <span>Total Savings</span>
                  <span className="comp-icon">🎯</span>
                </div>
                <h4 style={{ color: "#f59e0b" }}>
                  ₹{formatAmount(summary.totalSavings)}
                </h4>
                <div className="comp-bar-track">
                  <div
                    className="comp-bar-fill"
                    style={{
                      width: `${(summary.totalSavings / maxFlowAmount) * 100}%`,
                      background: "linear-gradient(90deg, #f59e0b, #eab308)"
                    }}
                  ></div>
                </div>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  {incomeVsExpense.savingsPercentageOfIncome || 0}% of Total Income
                </span>
              </div>

              {/* Retained Balance */}
              <div className="comparison-box">
                <div className="comparison-box-top">
                  <span>Available Balance</span>
                  <span className="comp-icon">💳</span>
                </div>
                <h4 style={{ color: summary.totalBalance < 0 ? "#ef4444" : "#10b981" }}>
                  ₹{formatAmount(summary.totalBalance)}
                </h4>
                <div className="comp-bar-track">
                  <div
                    className="comp-bar-fill"
                    style={{
                      width: `${Math.min(100, Math.max(0, (summary.totalBalance / maxFlowAmount) * 100))}%`,
                      background: summary.totalBalance < 0 ? "#ef4444" : "linear-gradient(90deg, #10b981, #059669)"
                    }}
                  ></div>
                </div>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  {incomeVsExpense.balancePercentageOfIncome || 0}% of Total Income
                </span>
              </div>
            </div>
          </section>

          {/* 3. CATEGORY-WISE EXPENSES SECTION (DONUT + BREAKDOWN ROWS) */}
          <section className="category-report-grid">

            {/* Donut Chart Card */}
            <div className="dashboard-card category-donut-card">
              <div className="card-heading" style={{ width: "100%", marginBottom: "16px" }}>
                <div>
                  <h2>Category-wise Expenses</h2>
                  <p>Expense distribution for {formatMonthDisplay(selectedMonth)}</p>
                </div>
              </div>

              <div
                className="big-donut"
                style={{ background: donutBackground }}
              >
                <div className="donut-inside">
                  <strong>₹{formatAmount(summary.totalExpenses)}</strong>
                  <span>Total Expenses</span>
                </div>
              </div>

              <div style={{ marginTop: "18px", textAlign: "center" }}>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                  {categoryExpenses.length} Active Expense Categor{categoryExpenses.length === 1 ? "y" : "ies"}
                </span>
              </div>
            </div>

            {/* Category Breakdown Progress Rows Card */}
            <div className="dashboard-card category-rows-card">
              <div className="card-heading">
                <div>
                  <h2>Category Spending Breakdown</h2>
                  <p>Sorted by highest expenditure</p>
                </div>
                <span className="month-filter-badge" style={{ fontSize: "11px", padding: "4px 10px" }}>
                  {categoryExpenses.length} Categories
                </span>
              </div>

              {categoryExpenses && categoryExpenses.length > 0 ? (
                <div className="category-report-list">
                  {categoryExpenses.map((cat, idx) => {
                    const color = CATEGORY_COLORS[cat.category] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
                    const icon = getCategoryIcon(cat.category);
                    return (
                      <div key={cat.category} className="cat-report-item">
                        <div className="cat-report-header">
                          <span className="cat-report-name">
                            <span>{icon}</span>
                            {cat.category}
                          </span>
                          <div className="cat-report-stats">
                            <strong>₹{formatAmount(cat.amount)}</strong>
                            <span>({cat.percentage}%)</span>
                          </div>
                        </div>

                        <div className="cat-report-track">
                          <div
                            className="cat-report-fill"
                            style={{
                              width: `${cat.percentage}%`,
                              backgroundColor: color
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="reports-empty-box">
                  <span className="reports-empty-icon">📊</span>
                  <p className="reports-empty-title">No expenses recorded</p>
                  <span className="reports-empty-desc">
                    {selectedMonth === "all"
                      ? "No expenses found in your account history."
                      : `No expense transactions recorded in ${formatMonthDisplay(selectedMonth)}.`}
                  </span>
                </div>
              )}
            </div>

          </section>

          {/* 4. MONTHLY SPENDING SUMMARY INSIGHTS */}
          <section className="dashboard-card">
            <div className="card-heading">
              <div>
                <h2>Monthly Spending Summary</h2>
                <p>Key financial health insights and spending trends for {formatMonthDisplay(selectedMonth)}</p>
              </div>
              <span className="month-filter-badge" style={{ fontSize: "11px", padding: "4px 10px" }}>
                Summary Insights
              </span>
            </div>

            <div className="spending-summary-grid">
              {/* Daily Average Expense */}
              <div className="summary-insight-card">
                <div className="insight-icon-box purple">
                  📅
                </div>
                <div className="insight-body">
                  <span className="insight-label">Daily Average Spending</span>
                  <div className="insight-value">
                    ₹{formatAmount(summary.dailyAverageExpense)}
                  </div>
                  <span className="insight-subtext">
                    Average outflow across {reportData.daysInMonth || 30} days
                  </span>
                </div>
              </div>

              {/* Savings Rate */}
              <div className="summary-insight-card">
                <div className="insight-icon-box green">
                  📈
                </div>
                <div className="insight-body">
                  <span className="insight-label">Savings & Retention Rate</span>
                  <div className="insight-value" style={{ color: "#16a34a" }}>
                    {summary.savingsRate}%
                  </div>
                  <span className="insight-subtext">
                    {summary.savingsRate >= 40
                      ? "Excellent retention discipline! 🌟"
                      : "Portion of income saved and preserved"}
                  </span>
                </div>
              </div>

              {/* Highest Expense Category */}
              <div className="summary-insight-card">
                <div className="insight-icon-box orange">
                  🏷️
                </div>
                <div className="insight-body">
                  <span className="insight-label">Highest Expense Category</span>
                  <div className="insight-value">
                    {summary.highestExpenseCategory ? summary.highestExpenseCategory.category : "None"}
                  </div>
                  <span className="insight-subtext">
                    {summary.highestExpenseCategory
                      ? `₹${formatAmount(summary.highestExpenseCategory.amount)} (${summary.highestExpenseCategory.percentage}% of total expenses)`
                      : "No expenses recorded"}
                  </span>
                </div>
              </div>

              {/* Largest Single Expense */}
              <div className="summary-insight-card">
                <div className="insight-icon-box blue">
                  💳
                </div>
                <div className="insight-body">
                  <span className="insight-label">Largest Single Transaction</span>
                  <div className="insight-value" title={summary.largestExpense?.title || "None"}>
                    {summary.largestExpense ? summary.largestExpense.title : "None"}
                  </div>
                  <span className="insight-subtext">
                    {summary.largestExpense
                      ? `₹${formatAmount(summary.largestExpense.amount)} in ${summary.largestExpense.category}`
                      : "No expense transactions"}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Transaction Volume Footer */}
            <div
              style={{
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                fontSize: "12px",
                color: "#64748b"
              }}
            >
              <div>
                Total Activity: <strong>{summary.totalTransactions || 0}</strong> transactions logged
                ({summary.incomeCount || 0} incomes, {summary.expenseCount || 0} expenses, {summary.savingCount || 0} savings deposits)
              </div>
              <div style={{ color: "#9aa1b0" }}>
                Period: <strong>{formatMonthDisplay(selectedMonth)}</strong> • User: <strong>{loggedInUser?.name || "Logged In"}</strong>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

export default Reports;
