const express = require("express");
const {
    getSessions,
    getToday,
    getSession,
    createSession,
    updateSession,
    deleteSession,
    toggleStatus,
    quickInitToday
} = require("../controllers/sessionController");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Lindungi endpoint sesi dengan JWT verifyToken
router.use(verifyToken);

router.get("/", getSessions);
router.get("/today", getToday);
router.post("/quick-today", quickInitToday);
router.get("/:id", getSession);
router.post("/", createSession);
router.put("/:id", updateSession);
router.delete("/:id", deleteSession);
router.patch("/:id/toggle", toggleStatus);

module.exports = router;
