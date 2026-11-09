import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import SearchableDropdown from "../../components/SearchableDropdown";
import EditTransactionModal from "../../components/EditTransactionModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import "./Expenses.css";

const EXPENSE_TITLES = [
  "Grocery Shopping",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Restaurant",
  "Snacks",
  "House Rent",
  "Electricity Bill",
  "Water Bill",
  "Gas Bill",
  "Internet Bill",
  "Mobile Recharge",
  "Fuel",
  "Bus Fare",
  "Auto Fare",
  "Cab Fare",
  "Train Ticket",
  "Clothes",
  "Footwear",
  "Electronics",
  "Medicine",
  "Doctor Consultation",
  "Hospital",
  "College Fees",
  "Books",
  "Stationery",
  "Movie",
  "Subscription",
  "Maintenance",
  "Other Expense"
];

const EXPENSE_TITLE_MAP = {
  // Food
  "Grocery Shopping": "Food",
  "Breakfast": "Food",
  "Lunch": "Food",
  "Dinner": "Food",
  "Restaurant": "Food",
  "Snacks": "Food",

  // Transport
  "Fuel": "Transport",
  "Bus Fare": "Transport",
  "Auto Fare": "Transport",
  "Cab Fare": "Transport",
  "Train Ticket": "Transport",

  // Housing
  "House Rent": "Housing",
  "Maintenance": "Housing",

  // Bills
  "Electricity Bill": "Bills",
  "Water Bill": "Bills",
  "Gas Bill": "Bills",
  "Internet Bill": "Bills",
  "Mobile Recharge": "Bills",

  // Shopping
  "Clothes": "Shopping",
  "Footwear": "Shopping",
  "Electronics": "Shopping",

  // Health
  "Medicine": "Health",
  "Doctor Consultation": "Health",
  "Hospital": "Health",

  // Education
  "College Fees": "Education",
  "Books": "Education",
  "Stationery": "Education",

  // Entertainment
  "Movie": "Entertainment",
  "Subscription": "Entertainment",

  // Other
  "Other Expense": "Other"
};

const getEndOfCurrentMonth = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
};

const getCategoryIcon = (category) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("food") || cat.includes("grocery")) return "🛒";
  if (cat.includes("transport") || cat.includes("cab") || cat.includes("fuel")) return "🚗";
  if (cat.includes("shop")) return "🛍️";
  if (cat.includes("bill") || cat.includes("utility")) return "📄";
  if (cat.includes("hous") || cat.includes("rent")) return "🏠";
  if (cat.includes("entertain")) return "🎬";
  if (cat.includes("health") || cat.includes("medical")) return "💊";
  if (cat.includes("edu")) return "📚";
  return "💸";
};

function Expenses() {
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dropdown for Expense Title
  const [selectedTitle, setSelectedTitle] = useState("Grocery Shopping");
  const [customTitle, setCustomTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [feedback, setFeedback] = useState({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);

  // Edit & Delete modal states
  const [editModalTx, setEditModalTx] = useState(null);
  const [deleteConfirmTx, setDeleteConfirmTx] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatAmount = (amt) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(amt) || 0);
  };

  const fetchExpenses = useCallback(async () => {
    if (!loggedInUser?.id) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/expenses/user/${loggedInUser.id}`
      );
      const data = await response.json();
      if (response.ok) {
        setExpenses(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to load expenses:", error);
    } finally {
      setLoading(false);
    }
  }, [loggedInUser?.id]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // When selected title changes, auto-select Category
  const handleTitleSelect = (val) => {
    setSelectedTitle(val);
    if (EXPENSE_TITLE_MAP[val]) {
      setCategory(EXPENSE_TITLE_MAP[val]);
    }
    // If House Rent is selected, clamp date if currently set to a future month
    if (val === "House Rent") {
      const endOfMonth = getEndOfCurrentMonth();
      if (date > endOfMonth) {
        setDate(new Date().toISOString().split("T")[0]);
      }
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setFeedback({ text: "", type: "" });

    const finalTitle = selectedTitle === "Other Expense" ? customTitle.trim() : selectedTitle;

    if (!finalTitle || !amount || Number(amount) <= 0) {
      setFeedback({ text: "Please provide a valid title and amount", type: "error" });
      return;
    }

    // Rent can only be recorded for the current month
    if (selectedTitle === "House Rent") {
      const parts = date.split("-");
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const now = new Date();
      if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth() + 1)) {
        setFeedback({ text: "Rent can only be recorded for the current month.", type: "error" });
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user: loggedInUser.id,
          title: finalTitle,
          amount: Number(amount),
          category,
          date
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback({ text: data.message || "Failed to add expense", type: "error" });
        return;
      }

      setFeedback({ text: "Expense added successfully! 🎉", type: "success" });
      setSelectedTitle("Grocery Shopping");
      setCustomTitle("");
      setAmount("");
      setCategory("Food");
      setDate(new Date().toISOString().split("T")[0]);

      // Refresh list
      fetchExpenses();

      setTimeout(() => setFeedback({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Add Expense Error:", error);
      setFeedback({ text: "Cannot connect to server. Make sure backend is running.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditExpense = (item) => {
    setEditModalTx({
      ...item,
      type: "expense"
    });
  };

  const handleDeleteExpense = (item) => {
    setDeleteConfirmTx(item);
  };

  const handleConfirmDeleteExpense = async () => {
    if (!deleteConfirmTx?._id || !loggedInUser?.id) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/expenses/${deleteConfirmTx._id}?userId=${loggedInUser.id}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": loggedInUser.id
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete expense");
        return;
      }

      setDeleteConfirmTx(null);
      fetchExpenses();
    } catch (err) {
      console.error("Delete expense error:", err);
      alert("Failed to connect to server to delete transaction.");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalExpenseSum = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="dashboard-page">
      <Sidebar activeTab="expenses" />

      <main className="dashboard-main">
        <Navbar title="Expenses" subtitle="Record & monitor your daily spending" />

        {/* STAT BANNER */}
        <div className="expense-stat-banner">
          <div className="stat-pill">
            <div className="stat-pill-icon">💸</div>
            <div className="stat-pill-info">
              <span>Total Recorded Expenses</span>
              <h3>₹{formatAmount(totalExpenseSum)}</h3>
            </div>
          </div>
        </div>

        {/* ADD EXPENSE FORM */}
        <div className="dashboard-card" style={{ marginBottom: "24px" }}>
          <div className="card-heading">
            <div>
              <h2>Add New Expense</h2>
              <p>Select an item or enter custom expense</p>
            </div>
          </div>

          <form onSubmit={handleAddExpense}>
            <div className="form-grid">
              
              {/* EXPENSE TITLE SEARCHABLE DROPDOWN */}
              <div className="form-group">
                <label>Expense Title</label>
                <SearchableDropdown
                  options={EXPENSE_TITLES}
                  value={selectedTitle}
                  onChange={handleTitleSelect}
                  placeholder="Search or select expense..."
                  ariaLabel="Expense Title"
                />
              </div>

              {/* CUSTOM TITLE (IF OTHER EXPENSE) */}
              {selectedTitle === "Other Expense" && (
                <div className="form-group">
                  <label>Custom Title</label>
                  <input
                    type="text"
                    placeholder="Specify expense name..."
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* AMOUNT */}
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* CATEGORY (AUTO-SELECTED & STILL ADJUSTABLE) */}
              <div className="form-group">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Bills">Bills</option>
                  <option value="Housing">Housing</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Education">Education</option>
                  <option value="Health">Health</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* DATE */}
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  max={selectedTitle === "House Rent" ? getEndOfCurrentMonth() : undefined}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <button
                className="submit-btn"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "+ Add Expense"}
              </button>
            </div>

            {feedback.text && (
              <div className={`feedback-msg ${feedback.type}`}>
                {feedback.text}
              </div>
            )}
          </form>
        </div>

        {/* EXPENSES LIST */}
        <div className="dashboard-card transactions-card">
          <div className="card-heading">
            <div>
              <h2>Expense History</h2>
              <p>All recorded expenses for your account ({expenses.length})</p>
            </div>
          </div>

          <div className="transaction-table">
            <div className="table-head has-actions">
              <span>Title</span>
              <span>Category</span>
              <span>Date</span>
              <span>Amount</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>

            {loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#9aa1b0" }}>
                Loading expenses...
              </div>
            ) : expenses.length > 0 ? (
              expenses.map((item) => {
                const formattedDate = new Date(item.date).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                });

                return (
                  <div className="table-row has-actions" key={item._id}>
                    <div className="transaction-name">
                      <div className="transaction-round food-round">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div>
                        <strong>{item.title}</strong>
                        <span>Expense</span>
                      </div>
                    </div>

                    <span className="category food-category">
                      {item.category}
                    </span>

                    <span>{formattedDate}</span>

                    <strong className="amount-expense">
                      −₹{formatAmount(item.amount)}
                    </strong>

                    <div className="table-row-actions">
                      <button
                        type="button"
                        className="table-action-btn edit-btn"
                        title="Edit expense record"
                        onClick={() => handleEditExpense(item)}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="table-action-btn delete-btn"
                        title="Delete expense record"
                        onClick={() => handleDeleteExpense(item)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "36px", textAlign: "center", color: "#9aa1b0", fontSize: "13px" }}>
                No expenses recorded yet. Fill in the form above to add your first expense!
              </div>
            )}
          </div>
        </div>

      </main>

      {/* EDIT MODAL */}
      <EditTransactionModal
        isOpen={!!editModalTx}
        onClose={() => setEditModalTx(null)}
        transaction={editModalTx}
        onSuccess={() => {
          fetchExpenses();
        }}
        loggedInUser={loggedInUser}
      />

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={!!deleteConfirmTx}
        onClose={() => setDeleteConfirmTx(null)}
        onConfirm={handleConfirmDeleteExpense}
        title="Delete Expense Record"
        message="Are you sure you want to delete this transaction?"
        itemTitle={deleteConfirmTx?.title}
        itemAmount={deleteConfirmTx?.amount}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default Expenses;
