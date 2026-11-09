import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import SearchableDropdown from "../../components/SearchableDropdown";
import EditTransactionModal from "../../components/EditTransactionModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import "./Income.css";

const INCOME_TITLES = [
  "Salary",
  "Freelance Income",
  "Business Income",
  "Rental Income",
  "Bonus",
  "Interest Income",
  "Scholarship",
  "Pension",
  "Commission",
  "Gift Received",
  "Refund",
  "Other Income"
];

const INCOME_SOURCE_MAP = {
  "Salary": "Salary",
  "Freelance Income": "Freelance",
  "Freelance": "Freelance",
  "Business Income": "Business",
  "Rental Income": "Business",
  "Bonus": "Bonus",
  "Interest Income": "Investment",
  "Interest": "Investment",
  "Scholarship": "Allowance",
  "Pension": "Other",
  "Commission": "Business",
  "Gift Received": "Allowance",
  "Gift": "Allowance",
  "Refund": "Other",
  "Other Income": "Other"
};

const getTodayDateString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getIncomeIcon = (category) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("salary")) return "💰";
  if (cat.includes("freelance") || cat.includes("client")) return "💻";
  if (cat.includes("business") || cat.includes("rent")) return "🏢";
  if (cat.includes("invest") || cat.includes("dividend") || cat.includes("interest")) return "📈";
  if (cat.includes("bonus") || cat.includes("gift")) return "🎁";
  if (cat.includes("allowance") || cat.includes("scholarship")) return "👛";
  return "💵";
};

function Income() {
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dropdown for Income Source/Title
  const [selectedTitle, setSelectedTitle] = useState("Salary");
  const [customTitle, setCustomTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Salary");
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

  const fetchIncomes = useCallback(async () => {
    if (!loggedInUser?.id) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/income/user/${loggedInUser.id}`
      );
      const data = await response.json();
      if (response.ok) {
        setIncomes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to load incomes:", error);
    } finally {
      setLoading(false);
    }
  }, [loggedInUser?.id]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  const handleTitleSelect = (val) => {
    setSelectedTitle(val);
    if (INCOME_SOURCE_MAP[val]) {
      setCategory(INCOME_SOURCE_MAP[val]);
    }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();
    setFeedback({ text: "", type: "" });

    const finalTitle = selectedTitle === "Other Income" ? customTitle.trim() : selectedTitle;

    if (!finalTitle || !amount || Number(amount) <= 0) {
      setFeedback({ text: "Please provide a valid income title and amount", type: "error" });
      return;
    }

    // ALL INCOMES: Cannot be recorded for a future date
    const todayStr = getTodayDateString();
    if (date > todayStr) {
      setFeedback({ text: "Income cannot be recorded for a future date.", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/income", {
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
        setFeedback({ text: data.message || "Failed to add income", type: "error" });
        return;
      }

      setFeedback({ text: "Income added successfully! 🎉", type: "success" });
      setSelectedTitle("Salary");
      setCustomTitle("");
      setAmount("");
      setCategory("Salary");
      setDate(new Date().toISOString().split("T")[0]);

      // Refresh list
      fetchIncomes();

      setTimeout(() => setFeedback({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Add Income Error:", error);
      setFeedback({ text: "Cannot connect to server. Make sure backend is running.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditIncome = (item) => {
    setEditModalTx({
      ...item,
      type: "income"
    });
  };

  const handleDeleteIncome = (item) => {
    setDeleteConfirmTx(item);
  };

  const handleConfirmDeleteIncome = async () => {
    if (!deleteConfirmTx?._id || !loggedInUser?.id) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/income/${deleteConfirmTx._id}?userId=${loggedInUser.id}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": loggedInUser.id
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete income");
        return;
      }

      setDeleteConfirmTx(null);
      fetchIncomes();
    } catch (err) {
      console.error("Delete income error:", err);
      alert("Failed to connect to server to delete transaction.");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalIncomeSum = incomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="dashboard-page">
      <Sidebar activeTab="income" />

      <main className="dashboard-main">
        <Navbar title="Income" subtitle="Record & track your earnings and revenue streams" />

        {/* STAT BANNER */}
        <div className="expense-stat-banner">
          <div className="stat-pill">
            <div className="stat-pill-icon income-pill">💰</div>
            <div className="stat-pill-info">
              <span>Total Recorded Income</span>
              <h3 style={{ color: "#14804a" }}>₹{formatAmount(totalIncomeSum)}</h3>
            </div>
          </div>
        </div>

        {/* ADD INCOME FORM */}
        <div className="dashboard-card" style={{ marginBottom: "24px" }}>
          <div className="card-heading">
            <div>
              <h2>Add New Income</h2>
              <p>Select income stream or enter custom source</p>
            </div>
          </div>

          <form onSubmit={handleAddIncome}>
            <div className="form-grid">

              {/* INCOME SOURCE SEARCHABLE DROPDOWN */}
              <div className="form-group">
                <label>Income Source / Title</label>
                <SearchableDropdown
                  options={INCOME_TITLES}
                  value={selectedTitle}
                  onChange={handleTitleSelect}
                  placeholder="Search or select income source..."
                  ariaLabel="Income Source"
                />
              </div>

              {/* CUSTOM TITLE (IF OTHER INCOME) */}
              {selectedTitle === "Other Income" && (
                <div className="form-group">
                  <label>Custom Title</label>
                  <input
                    type="text"
                    placeholder="Specify income source..."
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

              {/* CATEGORY */}
              <div className="form-group">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Salary">Salary</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Business">Business</option>
                  <option value="Investment">Investment</option>
                  <option value="Allowance">Allowance</option>
                  <option value="Bonus">Bonus</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* DATE */}
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  max={getTodayDateString()}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <button
                className="submit-btn"
                type="submit"
                disabled={submitting}
                style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 8px 20px rgba(16, 185, 129, 0.25)" }}
              >
                {submitting ? "Saving..." : "+ Add Income"}
              </button>
            </div>

            {feedback.text && (
              <div className={`feedback-msg ${feedback.type}`}>
                {feedback.text}
              </div>
            )}
          </form>
        </div>

        {/* INCOMES LIST */}
        <div className="dashboard-card transactions-card">
          <div className="card-heading">
            <div>
              <h2>Income History</h2>
              <p>All recorded income for your account ({incomes.length})</p>
            </div>
          </div>

          <div className="transaction-table">
            <div className="table-head has-actions">
              <span>Source</span>
              <span>Category</span>
              <span>Date</span>
              <span>Amount</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>

            {loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#9aa1b0" }}>
                Loading income...
              </div>
            ) : incomes.length > 0 ? (
              incomes.map((item) => {
                const formattedDate = new Date(item.date).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                });

                return (
                  <div className="table-row has-actions" key={item._id}>
                    <div className="transaction-name">
                      <div className="transaction-round salary-round">
                        {getIncomeIcon(item.category)}
                      </div>
                      <div>
                        <strong>{item.title}</strong>
                        <span>Income</span>
                      </div>
                    </div>

                    <span className="category income-category">
                      {item.category}
                    </span>

                    <span>{formattedDate}</span>

                    <strong className="amount-income">
                      +₹{formatAmount(item.amount)}
                    </strong>

                    <div className="table-row-actions">
                      <button
                        type="button"
                        className="table-action-btn edit-btn"
                        title="Edit income record"
                        onClick={() => handleEditIncome(item)}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="table-action-btn delete-btn"
                        title="Delete income record"
                        onClick={() => handleDeleteIncome(item)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "36px", textAlign: "center", color: "#9aa1b0", fontSize: "13px" }}>
                No income recorded yet. Fill in the form above to record your first income!
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
          fetchIncomes();
        }}
        loggedInUser={loggedInUser}
      />

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={!!deleteConfirmTx}
        onClose={() => setDeleteConfirmTx(null)}
        onConfirm={handleConfirmDeleteIncome}
        title="Delete Income Record"
        message="Are you sure you want to delete this transaction?"
        itemTitle={deleteConfirmTx?.title}
        itemAmount={deleteConfirmTx?.amount}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default Income;
