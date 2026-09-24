const express = require("express");

const {
    scanAttendance,
    getAttendances
} = require("../controllers/attendanceController");

const {
    verifyToken
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
    "/scan",
    scanAttendance
);

router.get(
    "/",
    verifyToken,
    getAttendances
);

module.exports = router;