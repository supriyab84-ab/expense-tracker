import { useState, useEffect } from "react";
import EditTransactionModal from "./EditTransactionModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import "./SummaryCardModal.css";

function SummaryCardModal({
  isOpen,
  onClose,
  type,
  records = [],
  dashboardData = { totalIncome: 0, totalExpenses: 0, totalSavings: 0, totalBalance: 0 },
  loading = false,
  formatAmount = (v) => v,
  selectedMonth = "all",
  onTransactionModified,
  loggedInUser
}) {
  const [editModalTx, setEditModalTx] = useState(null);
  const [deleteConfirmTx, setDeleteConfirmTx] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !editModalTx && !deleteConfirmTx) onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, editModalTx, deleteConfirmTx, onClose]);

  const handleEditItem = (item) => {
    const itemType = item.type || (type === "expenses" ? "expense" : type === "income" ? "income" : "saving");
    setEditModalTx({
      ...item,
      type: itemType
    });
  };

  const handleDeleteItem = (item) => {
    const itemType = item.type || (type === "expenses" ? "expense" : type === "income" ? "income" : "saving");
    setDeleteConfirmTx({
      ...item,
      type: itemType
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTx?._id || !loggedInUser?.id) return;

    setIsDeleting(true);
    try {
      const endpointType =
        deleteConfirmTx.type === "expense" ? "expenses" :
        deleteConfirmTx.type === "income" ? "income" : "savings";

      const res = await fetch(
        `http://localhost:5000/api/${endpointType}/${deleteConfirmTx._id}?userId=${loggedInUser.id}`,
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

      setDeleteConfirmTx(null);
      if (onTransactionModified) {
        onTransactionModified();
      }
    } catch (err) {
      console.error("Delete error in summary modal:", err);
      alert("Failed to connect to server to delete transaction.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
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

  // Configure modal header and metadata based on type
  const getModalConfig = () => {
    switch (type) {
      case "expenses":
        return {
          title: "Total Expenses Transactions",
          icon: "💸",
          subtitle: "All expense transactions belonging to your account",
          bannerLabel: "Total Expenses",
          totalAmount: dashboardData.totalExpenses,
          emptyMsg: "No expense transactions found in your account."
        };
      case "income":
        return {
          title: "Total Income Records",
          icon: "💰",
          subtitle: "All income sources and earnings recorded for your account",
          bannerLabel: "Total Income",
          totalAmount: dashboardData.totalIncome,
          emptyMsg: "No income records found in your account."
        };
      case "savings":
        return {
          title: "Total Savings Deposits",
          icon: "🎯",
          subtitle: "All amounts intentionally allocated to personal savings",
          bannerLabel: "Total Savings",
          totalAmount: dashboardData.totalSavings,
          emptyMsg: "No savings deposits recorded yet."
        };
      case "all-transactions":
        return {
          title: "All Combined Transactions",
          icon: "📑",
          subtitle: "Complete history of your Income, Expenses, and Savings",
          bannerLabel: "Available Balance",
          totalAmount: dashboardData.totalBalance,
          emptyMsg: "No transactions found for the selected period."
        };
      case "balance":
      default:
        return {
          title: "Total Balance Breakdown",
          icon: "💳",
          subtitle: "Dynamic formula: Total Income − Total Expenses − Total Savings",
          bannerLabel: "Available Balance",
          totalAmount: dashboardData.totalBalance,
          emptyMsg: ""
        };
    }
  };

  const config = getModalConfig();

  return (
    <div className="summary-modal-backdrop" onClick={onClose}>
      <div className="summary-modal-window" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="summary-modal-header">
          <div>
            <h2>
              <span>{config.icon}</span> {config.title}
            </h2>
            <p>
              {config.subtitle} &bull; <strong style={{ color: "#6d43e8" }}>{formatMonthDisplay(selectedMonth)}</strong>
            </p>
          </div>

          <button
            type="button"
            className="summary-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="summary-modal-body">

          {/* TOTAL BANNER */}
          <div className="summary-modal-total-banner">
            <div>
              <span>{config.bannerLabel}</span>
              <small style={{ display: "block", fontSize: "10px", color: "#8c94a6", marginTop: "2px" }}>
                Active Period: {formatMonthDisplay(selectedMonth)}
              </small>
            </div>
            <strong>₹{formatAmount(config.totalAmount)}</strong>
          </div>

          {/* BALANCE BREAKDOWN VIEW */}
          {type === "balance" && (
            <div>
              <div className="balance-breakdown-card">
                <div className="breakdown-row">
                  <div className="breakdown-row-label">
                    <span className="badge-icon" style={{ background: "#e5faef", color: "#14804a" }}>💰</span>
                    <div>
                      <span>Total Income</span>
                      <small style={{ display: "block", fontSize: "10px", color: "#9ca3af" }}>All recorded earnings</small>
                    </div>
                  </div>
                  <span className="breakdown-row-val" style={{ color: "#14a568" }}>
                    +₹{formatAmount(dashboardData.totalIncome)}
                  </span>
                </div>

                <div className="breakdown-row">
                  <div className="breakdown-row-label">
                    <span className="badge-icon" style={{ background: "#ffe9e9", color: "#ed4d57" }}>💸</span>
                    <div>
                      <span>Total Expenses</span>
                      <small style={{ display: "block", fontSize: "10px", color: "#9ca3af" }}>All recorded spending</small>
                    </div>
                  </div>
                  <span className="breakdown-row-val" style={{ color: "#ed4d57" }}>
                    -₹{formatAmount(dashboardData.totalExpenses)}
                  </span>
                </div>

                <div className="breakdown-row">
                  <div className="breakdown-row-label">
                    <span className="badge-icon" style={{ background: "#fef3c7", color: "#b45309" }}>🎯</span>
                    <div>
                      <span>Total Savings</span>
                      <small style={{ display: "block", fontSize: "10px", color: "#9ca3af" }}>Intentional reserves</small>
                    </div>
                  </div>
                  <span className="breakdown-row-val" style={{ color: "#d97706" }}>
                    -₹{formatAmount(dashboardData.totalSavings)}
                  </span>
                </div>

                <div className="breakdown-row total-row">
                  <div className="breakdown-row-label">
                    <span className="badge-icon" style={{ background: "#eeeaff", color: "#6d43e8" }}>💳</span>
                    <span>Available Balance</span>
                  </div>
                  <span className="breakdown-row-val">
                    ₹{formatAmount(dashboardData.totalBalance)}
                  </span>
                </div>
              </div>

              <div className="formula-explainer">
                <strong>💡 Balance Calculation ({formatMonthDisplay(selectedMonth)}):</strong>
                <p>
                  <strong>Total Income (₹{formatAmount(dashboardData.totalIncome)})</strong>
                  {" "}−{" "}
                  <strong>Total Expenses (₹{formatAmount(dashboardData.totalExpenses)})</strong>
                  {" "}−{" "}
                  <strong>Total Savings (₹{formatAmount(dashboardData.totalSavings)})</strong>
                  {" "}={" "}
                  <strong>₹{formatAmount(dashboardData.totalBalance)} Available Balance</strong>
                </p>
                <span style={{ fontSize: "10px", color: "#6b7280", marginTop: "4px", display: "block" }}>
                  This ensures your liquid balance accurately reflects free funds after subtracting all spending and intentional savings allocations.
                </span>
              </div>
            </div>
          )}

          {/* TRANSACTIONS TABLE VIEW (EXPENSES, INCOME, SAVINGS) */}
          {type !== "balance" && (
            <div>
              <div className={`modal-tx-table ${type === "expenses" || type === "all-transactions" ? "table-4-col" : "table-3-col"}`}>
                <div className="modal-tx-head">
                  <span>{type === "savings" ? "Title / Purpose" : "Title"}</span>
                  {(type === "expenses" || type === "all-transactions") && (
                    <span>{type === "all-transactions" ? "Type / Category" : "Category"}</span>
                  )}
                  <span>Date</span>
                  <span style={{ textAlign: "right" }}>Amount</span>
                  <span style={{ textAlign: "right" }}>Actions</span>
                </div>

                {loading ? (
                  <div className="empty-modal-state">
                    Loading records from MongoDB...
                  </div>
                ) : records && records.length > 0 ? (
                  records.map((item) => (
                    <div className="modal-tx-row" key={item._id}>
                      <span className="modal-tx-name" title={item.title}>
                        {item.title}
                      </span>

                      {(type === "expenses" || type === "all-transactions") && (
                        <div>
                          <span
                            className="modal-tx-category"
                            style={{
                              background:
                                item.type === "expense" ? "#f0ebff" :
                                item.type === "income" ? "#e6f8ee" :
                                "#fef3c7",
                              color:
                                item.type === "expense" ? "#6941c6" :
                                item.type === "income" ? "#14804a" :
                                "#b45309"
                            }}
                          >
                            {type === "all-transactions"
                              ? `${item.type === "income" ? "Income" : item.type === "saving" ? "Saving" : "Expense"}: ${item.category || "General"}`
                              : item.category || "General"}
                          </span>
                        </div>
                      )}

                      <span className="modal-tx-date">
                        {formatDate(item.date)}
                      </span>

                      <strong
                        className={`modal-tx-amount ${
                          (item.type || type) === "expenses" || (item.type || type) === "expense" ? "expense" :
                          (item.type || type) === "income" ? "income" :
                          "saving"
                        }`}
                      >
                        {item.type === "income" || type === "income"
                          ? `+₹${formatAmount(item.amount)}`
                          : item.type === "expense" || type === "expenses"
                          ? `-₹${formatAmount(item.amount)}`
                          : `🎯 ₹${formatAmount(item.amount)}`}
                      </strong>

                      <div className="modal-row-actions">
                        <button
                          type="button"
                          className="modal-action-btn edit-btn"
                          title="Edit transaction"
                          onClick={() => handleEditItem(item)}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="modal-action-btn delete-btn"
                          title="Delete transaction"
                          onClick={() => handleDeleteItem(item)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-modal-state">
                    {config.emptyMsg}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* EDIT MODAL FOR SUMMARY VIEW */}
      <EditTransactionModal
        isOpen={!!editModalTx}
        onClose={() => setEditModalTx(null)}
        transaction={editModalTx}
        onSuccess={() => {
          if (onTransactionModified) onTransactionModified();
        }}
        loggedInUser={loggedInUser}
      />

      {/* CONFIRM DELETE MODAL FOR SUMMARY VIEW */}
      <ConfirmDeleteModal
        isOpen={!!deleteConfirmTx}
        onClose={() => setDeleteConfirmTx(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction?"
        itemTitle={deleteConfirmTx?.title}
        itemAmount={deleteConfirmTx?.amount}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default SummaryCardModal;
