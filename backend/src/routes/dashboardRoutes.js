const express = require("express");
const { getDashboardStats } = require("../controllers/dashboardController");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Lindungi endpoint dashboard dengan JWT middleware
router.use(verifyToken);

router.get("/stats", getDashboardStats);
router.get("/", getDashboardStats);

module.exports = router;
