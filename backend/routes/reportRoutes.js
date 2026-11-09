const express = require("express");
const router = express.Router();
const { getReportsData } = require("../controllers/reportController");

router.get("/:userId", getReportsData);

module.exports = router;
