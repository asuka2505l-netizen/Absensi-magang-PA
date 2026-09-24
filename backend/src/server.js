const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/database");
const participantRoutes = require("./routes/participantRoutes");
const attendanceRoutes =
    require("./routes/attendanceRoutes");

const authRoutes =
    require("./routes/authRoutes");
const dashboardRoutes =
    require("./routes/dashboardRoutes");
const sessionRoutes =
    require("./routes/sessionRoutes");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Route utama
app.get("/", (req, res) => {
    res.json({
        message: "API Sistem Absensi Magang berjalan"
    });
});

// Test database
app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS result");

        res.json({
            success: true,
            message: "Database berhasil terhubung",
            data: rows
        });
    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            success: false,
            message: "Database gagal terhubung",
            error: error.message
        });
    }
});

// Route peserta
app.use("/api/participants", participantRoutes);
app.use(
    "/api/attendance",
    attendanceRoutes
);

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/dashboard",
    dashboardRoutes
);

app.use(
    "/api/sessions",
    sessionRoutes
);

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});