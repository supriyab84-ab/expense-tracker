const express = require("express");
const { addSaving, getUserSavings, updateSaving, deleteSaving } = require("../controllers/savingController");

const router = express.Router();

// Add saving
router.post("/", addSaving);

// Get savings for a specific user
router.get("/user/:userId", getUserSavings);

// Update saving
router.put("/:id", updateSaving);
router.patch("/:id", updateSaving);

// Delete saving
router.delete("/:id", deleteSaving);

module.exports = router;
