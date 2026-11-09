const API_BASE = "http://localhost:5000/api";

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  register: async (name, email, password) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    return res.json();
  },

  // Dashboard
  getDashboard: async (userId) => {
    const res = await fetch(`${API_BASE}/dashboard/${userId}`);
    return res.json();
  },

  // Expenses
  getExpenses: async (userId) => {
    const res = await fetch(`${API_BASE}/expenses/user/${userId}`);
    return res.json();
  },

  addExpense: async (expenseData) => {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expenseData)
    });
    return res.json();
  },

  // Income
  getIncome: async (userId) => {
    const res = await fetch(`${API_BASE}/income/user/${userId}`);
    return res.json();
  },

  addIncome: async (incomeData) => {
    const res = await fetch(`${API_BASE}/income`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incomeData)
    });
    return res.json();
  },

  // Savings
  getSavings: async (userId) => {
    const res = await fetch(`${API_BASE}/savings/user/${userId}`);
    return res.json();
  },

  addSaving: async (savingData) => {
    const res = await fetch(`${API_BASE}/savings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(savingData)
    });
    return res.json();
  }
};

export default api;
