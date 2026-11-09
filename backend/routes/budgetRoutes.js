const express = require("express");
const router = express.Router();
const {
  getMonthlyBudget,
  setMonthlyBudget,
  deleteMonthlyBudget,
  getAllBudgetsForUser
} = require("../controllers/budgetController");

router.get("/user/:userId", getMonthlyBudget);
router.get("/user/:userId/all", getAllBudgetsForUser);
router.post("/", setMonthlyBudget);
router.delete("/:id", deleteMonthlyBudget);

module.exports = router;
