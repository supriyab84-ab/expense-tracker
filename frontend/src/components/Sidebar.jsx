import { useNavigate, useLocation } from "react-router-dom";

function Sidebar({ activeTab }) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = activeTab || (
    location.pathname.includes("/expenses") ? "expenses" :
    location.pathname.includes("/income") ? "income" :
    location.pathname.includes("/savings") ? "savings" :
    location.pathname.includes("/reports") ? "reports" :
    location.pathname.includes("/budgets") ? "budgets" :
    location.pathname.includes("/settings") ? "settings" :
    "dashboard"
  );

  return (
    <aside className="sidebar">
      <div className="dashboard-logo" onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>
        <div className="dashboard-logo-icon">₹</div>
        <div>
          <h2>Expense Tracker</h2>
          <span>Smart Finance</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        <button
          className={`menu-item ${currentTab === "dashboard" ? "active" : ""}`}
          onClick={() => navigate("/dashboard")}
        >
          <span>🏠</span>
          Dashboard
        </button>

        <button
          className={`menu-item ${currentTab === "expenses" ? "active" : ""}`}
          onClick={() => navigate("/expenses")}
        >
          <span>💳</span>
          Expenses
        </button>

        <button
          className={`menu-item ${currentTab === "income" ? "active" : ""}`}
          onClick={() => navigate("/income")}
        >
          <span>💰</span>
          Income
        </button>

        <button
          className={`menu-item ${currentTab === "savings" ? "active" : ""}`}
          onClick={() => navigate("/savings")}
        >
          <span>🎯</span>
          Savings
        </button>

        <button
          className={`menu-item ${currentTab === "reports" ? "active" : ""}`}
          onClick={() => navigate("/reports")}
        >
          <span>📊</span>
          Reports
        </button>

        <button
          className={`menu-item ${currentTab === "budgets" ? "active" : ""}`}
          onClick={() => navigate("/budgets")}
        >
          <span>📈</span>
          Budgets
        </button>

        <button
          className={`menu-item ${currentTab === "settings" ? "active" : ""}`}
          onClick={() => navigate("/settings")}
        >
          <span>⚙️</span>
          Settings
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
