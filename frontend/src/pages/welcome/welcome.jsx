import { useNavigate } from "react-router-dom";
import "./Welcome.css";

function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="welcome-page">

      {/* Background decorations */}
      <div className="bg-circle circle-one"></div>
      <div className="bg-circle circle-two"></div>
      <div className="bg-circle circle-three"></div>

      {/* ================= NAVBAR ================= */}

      <nav className="welcome-navbar">

        <div className="welcome-logo">
          <div className="logo-box">₹</div>

          <div>
            <h2>Expense Tracker</h2>
            <p>Smart Finance. Better Life.</p>
          </div>
        </div>

        <div className="nav-actions">
          <button 
             className="nav-login"
             onClick={() => navigate("/login")}
          >
            🔐 Login
          </button>

          <button
            className="nav-register"
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </div>

      </nav>


      {/* ================= HERO ================= */}

      <main className="welcome-hero">

        {/* LEFT CONTENT */}

        <section className="welcome-content">

          <div className="welcome-badge">
            ✨ Smart Personal Finance
          </div>

          <h1>
            Track Your
            <span className="gradient-text"> Expenses.</span>
            <br />

            Manage Your
            <span className="blue-text"> Finances.</span>
            <br />

            Achieve Your
            <span className="green-text"> Goals.</span>
          </h1>

          <p className="welcome-description">
            Take control of your money, understand your spending
            and build a better financial future — all in one place.
          </p>


          {/* Buttons */}

          <div className="welcome-buttons">
            <button
              className="primary-button"
              onClick={() => navigate("/login")}
            >
            Get Started
              <span>→</span>
            </button>


            <button className="secondary-button">
              Explore Features
            </button>

          </div>


          {/* Features */}

          <div className="welcome-features">

            <div className="welcome-feature">

              <div className="feature-box purple-feature">
                📊
              </div>

              <div>
                <h3>Track & Analyze</h3>
                <p>
                  Monitor income and expenses
                  with detailed insights.
                </p>
              </div>

            </div>


            <div className="welcome-feature">

              <div className="feature-box blue-feature">
                ◔
              </div>

              <div>
                <h3>Visual Reports</h3>
                <p>
                  Understand your spending
                  through beautiful reports.
                </p>
              </div>

            </div>


            <div className="welcome-feature">

              <div className="feature-box green-feature">
                🎯
              </div>

              <div>
                <h3>Goals & Budgets</h3>
                <p>
                  Set financial goals and
                  stay within your budget.
                </p>
              </div>

            </div>

          </div>

        </section>


        {/* ================= DASHBOARD PREVIEW ================= */}

        <section className="preview-section">

          <div className="preview-glow"></div>

          <div className="dashboard-preview">

            {/* Dashboard header */}

            <div className="dashboard-header">

              <div>
                <span>Good morning 👋</span>
                <h3>Welcome back!</h3>
              </div>

              <div className="notification">
                🔔
              </div>

            </div>


            {/* Balance */}

            <div className="balance-card">

              <div>

                <p>Total Balance</p>

                <h2>₹52,840.00</h2>

                <span className="balance-growth">
                  ↑ 12.5% this month
                </span>

              </div>

              <div className="wallet-icon">
                💳
              </div>

            </div>


            {/* Income / Expense */}

            <div className="money-cards">

              <div className="money-card income-card">

                <div className="money-icon">
                  ↑
                </div>

                <div>
                  <p>Total Income</p>
                  <h3>₹75,300</h3>
                  <span>+12.5%</span>
                </div>

              </div>


              <div className="money-card expense-card">

                <div className="money-icon">
                  ↓
                </div>

                <div>
                  <p>Total Expense</p>
                  <h3>₹22,460</h3>
                  <span>−8.3%</span>
                </div>

              </div>

            </div>


            {/* Chart */}

            <div className="chart-card">

              <div className="chart-title">

                <div>
                  <h3>Expense Overview</h3>
                  <p>This month</p>
                </div>

                <span>•••</span>

              </div>


              <div className="chart-area">

                <div className="donut-chart">

                  <div className="donut-center">
                    <strong>₹22.4K</strong>
                    <span>Expenses</span>
                  </div>

                </div>


                <div className="chart-legend">

                  <div>
                    <span className="dot food"></span>
                    Food
                    <strong>35%</strong>
                  </div>

                  <div>
                    <span className="dot travel"></span>
                    Travel
                    <strong>20%</strong>
                  </div>

                  <div>
                    <span className="dot shopping"></span>
                    Shopping
                    <strong>15%</strong>
                  </div>

                  <div>
                    <span className="dot bills"></span>
                    Bills
                    <strong>15%</strong>
                  </div>

                </div>

              </div>

            </div>


            {/* Transactions */}

            <div className="transactions">

              <div className="transaction-heading">
                <h3>Recent Transactions</h3>
                <span>View all</span>
              </div>


              <div className="transaction">

                <div className="transaction-icon food-icon">
                  🛒
                </div>

                <div className="transaction-info">
                  <strong>Grocery Shopping</strong>
                  <span>Today</span>
                </div>

                <strong className="negative">
                  −₹1,250
                </strong>

              </div>


              <div className="transaction">

                <div className="transaction-icon salary-icon">
                  💰
                </div>

                <div className="transaction-info">
                  <strong>Salary</strong>
                  <span>May 15, 2026</span>
                </div>

                <strong className="positive">
                  +₹45,000
                </strong>

              </div>

            </div>

          </div>

        </section>

      </main>


      {/* ================= BOTTOM STATS ================= */}

      <div className="welcome-stats">

        <div>
          <span>🛡️</span>
          <strong>Secure & Private</strong>
          <p>Your financial data stays protected.</p>
        </div>

        <div>
          <span>⚡</span>
          <strong>Fast & Simple</strong>
          <p>Track your expenses in seconds.</p>
        </div>

        <div>
          <span>🎯</span>
          <strong>Smart Insights</strong>
          <p>Make better financial decisions.</p>
        </div>

      </div>

    </div>
  );
}

export default Welcome;