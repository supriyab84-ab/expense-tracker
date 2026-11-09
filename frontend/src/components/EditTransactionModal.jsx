import React, { useState, useEffect } from "react";
import "./EditTransactionModal.css";

const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Allowance",
  "Bonus",
  "Other"
];

const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Shopping",
  "Bills",
  "Health",
  "Education",
  "Entertainment",
  "Others"
];

const SAVINGS_CATEGORIES = [
  "Emergency Fund",
  "General Savings",
  "Vacation",
  "Big Purchase",
  "Retirement",
  "Investment",
  "Other"
];

const getTodayDateString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  onSuccess,
  loggedInUser
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [feedback, setFeedback] = useState({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title || "");
      setAmount(transaction.amount !== undefined ? String(transaction.amount) : "");
      setCategory(transaction.category || "");
      
      let initialDate = "";
      if (transaction.date) {
        initialDate = new Date(transaction.date).toISOString().split("T")[0];
      } else {
        initialDate = getTodayDateString();
      }
      setDate(initialDate);
      setFeedback({ text: "", type: "" });
    }
  }, [transaction, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !transaction) return null;

  const txType = transaction.type || (transaction.source ? "income" : "expense");
  const isIncome = txType === "income";
  const isExpense = txType === "expense";
  const isSaving = txType === "saving" || txType === "savings";

  const categories = isIncome
    ? INCOME_CATEGORIES
    : isExpense
    ? EXPENSE_CATEGORIES
    : SAVINGS_CATEGORIES;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ text: "", type: "" });

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFeedback({ text: "Please enter a valid title", type: "error" });
      return;
    }

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setFeedback({ text: "Please enter a valid positive amount", type: "error" });
      return;
    }

    // STRICT: Enforce no-future-date rule when editing Income
    const todayStr = getTodayDateString();
    if (isIncome && date > todayStr) {
      setFeedback({ text: "Income cannot be recorded for a future date.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      let endpoint = "";
      if (isIncome) {
        endpoint = `http://localhost:5000/api/income/${transaction._id}`;
      } else if (isExpense) {
        endpoint = `http://localhost:5000/api/expenses/${transaction._id}`;
      } else {
        endpoint = `http://localhost:5000/api/savings/${transaction._id}`;
      }

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": loggedInUser?.id || ""
        },
        body: JSON.stringify({
          user: loggedInUser?.id,
          title: trimmedTitle,
          amount: numAmount,
          category,
          date
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ text: data.message || "Failed to update transaction", type: "error" });
        return;
      }

      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    } catch (err) {
      console.error("Edit transaction error:", err);
      setFeedback({ text: "Cannot connect to server. Please check backend connection.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="edit-modal-backdrop" onClick={() => !isSubmitting && onClose()}>
      <div className="edit-modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="edit-modal-header">
          <div>
            <h3>
              {isIncome ? "💰 Edit Income" : isExpense ? "💸 Edit Expense" : "🎯 Edit Saving"}
            </h3>
            <p>Modify transaction details and save changes</p>
          </div>
          <button
            type="button"
            className="edit-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="edit-modal-form">
          {/* TITLE */}
          <div className="edit-form-group">
            <label>Title / Purpose</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grocery, Salary, Freelance"
              required
            />
          </div>

          {/* AMOUNT & CATEGORY GRID */}
          <div className="edit-form-grid">
            <div className="edit-form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="edit-form-group">
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DATE */}
          <div className="edit-form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              max={isIncome ? getTodayDateString() : undefined}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            {isIncome && (
              <small className="date-hint">
                ℹ️ Income cannot be recorded for a future date.
              </small>
            )}
          </div>

          {feedback.text && (
            <div className={`edit-feedback-msg ${feedback.type}`}>
              {feedback.text}
            </div>
          )}

          {/* ACTIONS */}
          <div className="edit-modal-actions">
            <button
              type="button"
              className="edit-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="edit-save-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default EditTransactionModal;
