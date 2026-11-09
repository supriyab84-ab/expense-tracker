import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Navbar({ title = "Dashboard", subtitle = "Good morning 👋" }) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const userInitial = loggedInUser?.name?.charAt(0).toUpperCase() || "U";
  const userName = loggedInUser?.name || "User";
  const userEmail = loggedInUser?.email || "My Account";

  return (
    <header className="dashboard-header">
      <div>
        <p className="welcome-small">{subtitle}</p>
        <h1>{title}</h1>
      </div>

      <div className="header-actions">
        <button className="notification-btn" title="Notifications" type="button">
          🔔
        </button>

        <div className="profile-wrapper">
          <button
            className="profile-btn"
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <span className="profile-avatar">{userInitial}</span>
            <div className="profile-info">
              <strong>{userName}</strong>
              <small>My Account</small>
            </div>
            <span className="profile-arrow">
              {profileOpen ? "▲" : "▼"}
            </span>
          </button>

          {profileOpen && (
            <div className="profile-menu">
              <div className="profile-menu-header">
                <div className="profile-menu-avatar">{userInitial}</div>
                <div>
                  <strong>{userName}</strong>
                  <span>{userEmail}</span>
                </div>
              </div>

              <button
                className="profile-menu-item"
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/settings");
                }}
              >
                👤 &nbsp; Profile
              </button>

              <button
                className="profile-menu-item"
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/settings");
                }}
              >
                ⚙️ &nbsp; Settings
              </button>

              <button
                className="profile-menu-item logout-item"
                type="button"
                onClick={handleLogout}
              >
                🚪 &nbsp; Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
