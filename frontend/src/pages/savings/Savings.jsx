import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import SearchableDropdown from "../../components/SearchableDropdown";
import EditTransactionModal from "../../components/EditTransactionModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import "./Savings.css";

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

function Savings() {
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dropdown for Saving Title / Purpose
  const [selectedTitle, setSelectedTitle] = useState("Emergency Fund");
  const [customTitle, setCustomTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Emergency Fund");
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

  const fetchSavings = useCallback(async () => {
    if (!loggedInUser?.id) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/savings/user/${loggedInUser.id}`
      );
      const data = await response.json();
      if (response.ok) {
        setSavings(data);
      }
    } catch (error) {
      console.error("Failed to load savings:", error);
    } finally {
      setLoading(false);
    }
  }, [loggedInUser?.id]);

  useEffect(() => {
    fetchSavings();
  }, [fetchSavings]);

  const handleTitleSelect = (val) => {
    setSelectedTitle(val);
    if (SAVING_TITLE_MAP[val]) {
      setCategory(SAVING_TITLE_MAP[val]);
    }
  };

  const handleAddSaving = async (e) => {
    e.preventDefault();
    setFeedback({ text: "", type: "" });

    const finalTitle = selectedTitle === "Other Savings" ? customTitle.trim() : selectedTitle;

    if (!finalTitle || !amount || Number(amount) <= 0) {
      setFeedback({ text: "Please provide a valid saving purpose and positive amount", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/savings", {
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
        setFeedback({ text: data.message || "Failed to add saving", type: "error" });
        return;
      }

      setFeedback({ text: "Saving deposited successfully! 🎉", type: "success" });
      setSelectedTitle("Emergency Fund");
      setCustomTitle("");
      setAmount("");
      setCategory("Emergency Fund");
      setDate(new Date().toISOString().split("T")[0]);

      // Refresh list
      fetchSavings();

      setTimeout(() => setFeedback({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Add Saving Error:", error);
      setFeedback({ text: "Cannot connect to server. Make sure backend is running.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSaving = (item) => {
    setEditModalTx({
      ...item,
      type: "saving"
    });
  };

  const handleDeleteSaving = (item) => {
    setDeleteConfirmTx(item);
  };

  const handleConfirmDeleteSaving = async () => {
    if (!deleteConfirmTx?._id || !loggedInUser?.id) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/savings/${deleteConfirmTx._id}?userId=${loggedInUser.id}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": loggedInUser.id
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete saving");
        return;
      }

      setDeleteConfirmTx(null);
      fetchSavings();
    } catch (err) {
      console.error("Delete saving error:", err);
      alert("Failed to connect to server to delete transaction.");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalSavingSum = savings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="dashboard-page">
      <Sidebar activeTab="savings" />

      <main className="dashboard-main">
        <Navbar title="Savings" subtitle="Intentionally deposit and preserve your funds" />

        {/* STAT BANNER */}
        <div className="expense-stat-banner">
          <div className="stat-pill">
            <div className="stat-pill-icon savings-pill">🎯</div>
            <div className="stat-pill-info">
              <span>Total Intentionally Saved</span>
              <h3 style={{ color: "#d97706" }}>₹{formatAmount(totalSavingSum)}</h3>
            </div>
          </div>
        </div>

        {/* ADD SAVING FORM */}
        <div className="dashboard-card" style={{ marginBottom: "24px" }}>
          <div className="card-heading">
            <div>
              <h2>Add to Savings</h2>
              <p>Allocate funds intentionally to your savings reserves</p>
            </div>
          </div>

          <form onSubmit={handleAddSaving}>
            <div className="form-grid">
              {/* SAVING TITLE SEARCHABLE DROPDOWN */}
              <div className="form-group">
                <label>Saving Title / Purpose</label>
                <SearchableDropdown
                  options={SAVING_TITLES}
                  value={selectedTitle}
                  onChange={handleTitleSelect}
                  placeholder="Search or select savings purpose..."
                  ariaLabel="Saving Title"
                />
              </div>

              {/* CUSTOM TITLE (IF OTHER SAVINGS) */}
              {selectedTitle === "Other Savings" && (
                <div className="form-group">
                  <label>Custom Title</label>
                  <input
                    type="text"
                    placeholder="Specify saving goal / purpose..."
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Amount to Save (₹)</label>
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

              <div className="form-group">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Emergency Fund">Emergency Fund</option>
                  <option value="Retirement">Retirement</option>
                  <option value="Investment">Investment</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Big Purchase">Big Purchase</option>
                  <option value="General Savings">General Savings</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <button
                className="submit-btn"
                type="submit"
                disabled={submitting}
                style={{ background: "linear-gradient(135deg, #d97706, #b45309)", boxShadow: "0 8px 20px rgba(217, 119, 6, 0.25)" }}
              >
                {submitting ? "Saving..." : "🎯 Deposit Savings"}
              </button>
            </div>

            {feedback.text && (
              <div className={`feedback-msg ${feedback.type}`}>
                {feedback.text}
              </div>
            )}
          </form>
        </div>

        {/* SAVINGS LIST */}
        <div className="dashboard-card transactions-card">
          <div className="card-heading">
            <div>
              <h2>Savings History</h2>
              <p>All recorded savings deposits for your account ({savings.length})</p>
            </div>
          </div>

          <div className="transaction-table">
            <div className="table-head has-actions">
              <span>Goal</span>
              <span>Category</span>
              <span>Date</span>
              <span>Amount</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>

            {loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#9aa1b0" }}>
                Loading savings...
              </div>
            ) : savings.length > 0 ? (
              savings.map((item) => {
                const formattedDate = new Date(item.date).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                });

                return (
                  <div className="table-row has-actions" key={item._id}>
                    <div className="transaction-name">
                      <div className="transaction-round savings-round">
                        🎯
                      </div>
                      <div>
                        <strong>{item.title}</strong>
                        <span>Savings Deposit</span>
                      </div>
                    </div>

                    <span className="category savings-category">
                      {item.category}
                    </span>

                    <span>{formattedDate}</span>

                    <strong className="amount-saving">
                      🎯 ₹{formatAmount(item.amount)}
                    </strong>

                    <div className="table-row-actions">
                      <button
                        type="button"
                        className="table-action-btn edit-btn"
                        title="Edit saving record"
                        onClick={() => handleEditSaving(item)}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="table-action-btn delete-btn"
                        title="Delete saving record"
                        onClick={() => handleDeleteSaving(item)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "36px", textAlign: "center", color: "#9aa1b0", fontSize: "13px" }}>
                No savings deposits recorded yet. Use the form above to start growing your savings!
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
          fetchSavings();
        }}
        loggedInUser={loggedInUser}
      />

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={!!deleteConfirmTx}
        onClose={() => setDeleteConfirmTx(null)}
        onConfirm={handleConfirmDeleteSaving}
        title="Delete Saving Record"
        message="Are you sure you want to delete this transaction?"
        itemTitle={deleteConfirmTx?.title}
        itemAmount={deleteConfirmTx?.amount}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default Savings;
