const express = require("express");
const { login, getMe } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/login", login);
router.get("/me", verifyToken, getMe);

module.exports = router;