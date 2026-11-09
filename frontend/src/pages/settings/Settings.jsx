import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "./Settings.css";

function Settings() {
  const navigate = useNavigate();
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const userInitial = loggedInUser?.name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="dashboard-page">
      <Sidebar activeTab="settings" />

      <main className="dashboard-main">
        <Navbar title="Account Settings" subtitle="Manage your profile & preferences" />

        <div className="settings-card">
          <div className="card-heading" style={{ marginBottom: "16px" }}>
            <div>
              <h2>User Profile</h2>
              <p>Your personal account information</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#6d43e8",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: "800"
              }}
            >
              {userInitial}
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#1f2937" }}>
                {loggedInUser?.name || "User"}
              </h3>
              <p style={{ fontSize: "12px", color: "#6b7280" }}>
                {loggedInUser?.email || "No email available"}
              </p>
            </div>
          </div>

          <div className="profile-detail-row">
            <span className="profile-detail-label">Full Name</span>
            <span className="profile-detail-val">{loggedInUser?.name || "N/A"}</span>
          </div>

          <div className="profile-detail-row">
            <span className="profile-detail-label">Email Address</span>
            <span className="profile-detail-val">{loggedInUser?.email || "N/A"}</span>
          </div>

          <div className="profile-detail-row">
            <span className="profile-detail-label">User Account ID</span>
            <span className="profile-detail-val" style={{ fontFamily: "monospace", fontSize: "12px", color: "#6b7280" }}>
              {loggedInUser?.id || "N/A"}
            </span>
          </div>

          <div className="profile-detail-row">
            <span className="profile-detail-label">Currency</span>
            <span className="profile-detail-val">Indian Rupee (₹ INR)</span>
          </div>

          <div className="profile-detail-row">
            <span className="profile-detail-label">Formatting Locale</span>
            <span className="profile-detail-val">en-IN (Lakhs / Crores)</span>
          </div>

          <div className="danger-zone">
            <button
              className="logout-action-btn"
              type="button"
              onClick={handleLogout}
            >
              🚪 Sign Out of Account
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

export default Settings;
