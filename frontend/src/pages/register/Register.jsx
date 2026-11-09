import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    // Check empty fields
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setMessage("Please fill all fields");
      setMessageType("error");
      return;
    }

    // Check password matching
    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      setMessageType("error");
      return;
    }

    // Check password length
    if (formData.password.length < 6) {
      setMessage("Password must be at least 6 characters");
      setMessageType("error");
      return;
    }

    try {
      // Send registration data to backend
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password
          })
        }
      );

      const data = await response.json();

      // If backend returns an error
      if (!response.ok) {
        setMessage(data.message || "Registration failed");
        setMessageType("error");
        return;
      }

      // Registration successful
      setMessage("Registration successful! 🎉 Redirecting to login...");
      setMessageType("success");

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
      });

      // Go to Login after 1.2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 1200);

    } catch (error) {
      console.error("Registration Error:", error);
      setMessage("Cannot connect to server. Make sure backend is running.");
      setMessageType("error");
    }
  };

  return (
    <div className="register-page">

      <div className="register-card">

        <div className="register-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          💰
        </div>

        <h1>Create Account</h1>

        <p className="register-subtitle">
          Start managing your money smarter
        </p>

        <form onSubmit={handleSubmit}>

          {message && (
            <div
              className={`register-message ${messageType}`}
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

          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="register-submit"
          >
            Create Account
          </button>

        </form>

        <p className="login-text">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </p>

      </div>

    </div>
  );
}

export default Register;
