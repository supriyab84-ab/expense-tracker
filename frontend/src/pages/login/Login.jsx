import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  // Login form data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Login message & type (error / success)
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      // Wrong email or password
      if (!response.ok) {
        setMessage(data.message || "Invalid email or password");
        setMessageType("error");
        return;
      }

      // Save logged-in user in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));

      // Success message
      setMessage("Login successful! 🎉");
      setMessageType("success");

      // Redirect to /dashboard after successful login
      setTimeout(() => {
        navigate("/dashboard");
      }, 700);

    } catch (error) {
      console.error("Login Error:", error);
      setMessage("Cannot connect to server. Make sure backend is running.");
      setMessageType("error");
    }
  };

  return (
    <div className="login-page">

      {/* ================= LEFT SIDE ================= */}
      <div className="login-hero">

        {/* Logo */}
        <div className="brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <div className="brand-icon">
            💳
          </div>

          <div>
            <h2>Expense Tracker</h2>
            <span>Smart Finance. Better Life.</span>
          </div>
        </div>

        {/* Main Heading */}
        <div className="hero-content">
          <h1>
            Track <span className="purple">Expenses.</span>
            <br />
            Manage <span className="blue">Finances.</span>
            <br />
            Achieve <span className="green">Goals.</span>
          </h1>

          <p>
            Take control of your money, understand your spending
            and build a better financial future.
          </p>

          {/* Features */}
          <div className="hero-features">
            <div className="hero-feature">
              <div className="feature-icon purple-bg">📊</div>
              <div>
                <h3>Track & Analyze</h3>
                <p>Track income and expenses with detailed insights.</p>
              </div>
            </div>

            <div className="hero-feature">
              <div className="feature-icon blue-bg">◔</div>
              <div>
                <h3>Visual Reports</h3>
                <p>Beautiful charts and reports to understand your spending.</p>
              </div>
            </div>

            <div className="hero-feature">
              <div className="feature-icon green-bg">🎯</div>
              <div>
                <h3>Set Goals & Budget</h3>
                <p>Create budgets and achieve your financial goals.</p>
              </div>
            </div>
          </div>

          {/* Quote */}
          <div className="quote">
            <div className="quote-symbol">“</div>
            <p>
              A budget is telling your money
              where to go instead of wondering
              where it went.
            </p>
            <span>— Dave Ramsey</span>
          </div>
        </div>

        {/* Decorative shapes */}
        <div className="glow glow-one"></div>
        <div className="glow glow-two"></div>
        <div className="dots"></div>
      </div>

      {/* ================= RIGHT SIDE ================= */}
      <div className="login-section">
        <div className="login-card">

          {/* Heading */}
          <div className="login-heading">
            <h1>
              Welcome <span>Back!</span> 👋
            </h1>
            <p>Login to continue to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin}>

            {/* LOGIN MESSAGE - PLACED DIRECTLY ABOVE EMAIL ADDRESS FIELD */}
            {message && (
              <div
                className={`login-message ${messageType}`}
                style={{
                  color: messageType === "error" ? "#dc2626" : "#16a34a",
                  backgroundColor: messageType === "error" ? "#fef2f2" : "#f0fdf4",
                  border: messageType === "error" ? "1px solid #fecaca" : "1px solid #bbf7d0",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontWeight: "600",
                  fontSize: "14px",
                  textAlign: "center"
                }}
              >
                {message}
              </div>
            )}

            {/* Email */}
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-box">
                <span className="input-icon">✉</span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="input-group">
              <label>Password</label>
              <div className="input-box">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="forgot-row">
              <button type="button" className="forgot-password">
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button type="submit" className="main-login-button">
              <span>🔒</span>
              Login
            </button>
          </form>

          {/* OR */}
          <div className="or-section">
            <span></span>
            <p>OR</p>
            <span></span>
          </div>

          {/* Google */}
          <button className="google-button" type="button">
            <span className="google-icon">G</span>
            Login with Google
          </button>

          {/* Register */}
          <div className="register-text">
            Don't have an account?{" "}
            <button onClick={() => navigate("/register")}>
              Register here
            </button>
          </div>

          {/* Bottom Benefits */}
          <div className="login-benefits">
            <div>
              <div className="benefit-circle shield">🛡</div>
              <h4>Secure & Private</h4>
              <p>Your data is safe with us.</p>
            </div>

            <div>
              <div className="benefit-circle lightning">⚡</div>
              <h4>Fast & Easy</h4>
              <p>Track expenses in just a few clicks.</p>
            </div>

            <div>
              <div className="benefit-circle free">✓</div>
              <h4>100% Free</h4>
              <p>All features are completely free.</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Login;
