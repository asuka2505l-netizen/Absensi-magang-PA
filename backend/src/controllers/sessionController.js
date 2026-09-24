const sessionModel = require("../models/attendanceSessionModel");

/**
 * Controller untuk mengelola Sesi Absensi & Pengaturan Lokasi Kantor
 */

// GET semua sesi
const getSessions = async (req, res) => {
    try {
        const sessions = await sessionModel.getAllSessions();
        return res.json({
            success: true,
            message: "Data sesi absensi berhasil diambil",
            data: sessions
        });
    } catch (error) {
        console.error("Get sessions error:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data sesi absensi",
            error: error.message
        });
    }
};

// GET sesi hari ini
const getToday = async (req, res) => {
    try {
        const session = await sessionModel.getTodaySession();
        return res.json({
            success: true,
            message: "Data sesi hari ini berhasil diambil",
            data: session || null
        });
    } catch (error) {
        console.error("Get today session error:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data sesi hari ini",
            error: error.message
        });
    }
};

// GET detail sesi by ID
const getSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await sessionModel.getSessionById(id);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Sesi absensi tidak ditemukan"
            });
        }

        return res.json({
            success: true,
            message: "Detail sesi absensi berhasil diambil",
            data: session
        });
    } catch (error) {
        console.error("Get session error:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal mengambil detail sesi absensi",
            error: error.message
        });
    }
};

// POST buat sesi baru
const createSession = async (req, res) => {
    try {
        const {
            session_date,
            check_in_start,
            check_in_end,
            check_out_start,
            check_out_end,
            latitude,
            longitude,
            radius_meter,
            status
        } = req.body;

        if (
            !session_date ||
            !check_in_start ||
            !check_in_end ||
            !check_out_start ||
            !check_out_end ||
            latitude === undefined ||
            longitude === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Semua field sesi (tanggal, jam check-in, jam check-out, koordinat lokasi) wajib diisi."
            });
        }

        // Cek apakah tanggal sesi sudah terdaftar
        const existing = await sessionModel.getSessionByDate(session_date);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Sesi absensi untuk tanggal ${session_date} sudah ada. Silakan edit sesi yang ada.`
            });
        }

        const insertId = await sessionModel.createSession({
            session_date,
            check_in_start,
            check_in_end,
            check_out_start,
            check_out_end,
            latitude: Number(latitude),
            longitude: Number(longitude),
            radius_meter: Number(radius_meter) || 100,
            status: status || "active"
        });

        const newSession = await sessionModel.getSessionById(insertId);

        return res.status(201).json({
            success: true,
            message: "Sesi absensi berhasil dibuat",
            data: newSession
        });
    } catch (error) {
        console.error("Create session error:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal membuat sesi absensi",
            error: error.message
        });
    }
};

// PUT update sesi
const updateSession = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            session_date,
            check_in_start,
            check_in_end,
            check_out_start,
            check_out_end,
            latitude,
            longitude,
            radius_meter,
            status
        } = req.body;

        const session = await sessionModel.getSessionById(id);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Sesi absensi tidak ditemukan"
            });
        }

        await sessionModel.updateSession(id, {
            session_date: session_date || session.session_date,
            check_in_start: check_in_start || session.check_in_start,
            check_in_end: check_in_end || session.check_in_end,
            check_out_start: check_out_start || session.check_out_start,
            check_out_end: check_out_end || session.check_out_end,
            latitude: latitude !== undefined ? Number(latitude) : session.latitude,
            longitude: longitude !== undefined ? Number(longitude) : session.longitude,
            radius_meter: radius_meter !== undefined ? Number(radius_meter) : session.radius_meter,
            status: status || session.status
        });

        const updated = await sessionModel.getSessionById(id);

        return res.json({
            success: true,
            message: "Sesi absensi berhasil diperbarui",
            data: updated
        });
    } catch (error) {
        console.error("Update session error:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal memperbarui sesi absensi",
            error: error.message
        });
    }
};

// DELETE hapus sesi
const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await sessionModel.getSessionById(id);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Sesi absensi tidak ditemukan"
            });
        }

        await sessionModel.deleteSession(id);

        return res.json({
            success: true,
            message: "Sesi absensi berhasil dihapus"
        });
    } catch (error) {
        console.error("Delete session error:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal menghapus sesi absensi",
            error: error.message
        });
    }
};

// PATCH toggle status (active / closed)
const toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await sessionModel.getSessionById(id);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Sesi absensi tidak ditemukan"
            });
        }

        const { nextStatus } = await sessionModel.toggleSessionStatus(id, session.status);

        return res.json({
            success: true,
            message: `Sesi berhasil diubah statusnya menjadi ${nextStatus === "active" ? "Aktif" : "Ditutup"}`,
            data: { status: nextStatus }
        });
    } catch (error) {
        console.error("Toggle session status error:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal mengubah status sesi absensi",
            error: error.message
        });
    }
};

// POST quick create today's session
const quickInitToday = async (req, res) => {
    try {
        const today = new Date().toISOString().substring(0, 10);
        const existing = await sessionModel.getSessionByDate(today);

        if (existing) {
            return res.json({
                success: true,
                message: "Sesi hari ini sudah tersedia",
                data: await sessionModel.getSessionById(existing.id)
            });
        }

        const defaultLat = req.body.latitude || -6.200000;
        const defaultLng = req.body.longitude || 106.816666;
        const defaultRadius = req.body.radius_meter || 150;

        const insertId = await sessionModel.createSession({
            session_date: today,
            check_in_start: "07:00:00",
            check_in_end: "09:30:00",
            check_out_start: "16:00:00",
            check_out_end: "18:30:00",
            latitude: Number(defaultLat),
            longitude: Number(defaultLng),
            radius_meter: Number(defaultRadius),
            status: "active"
        });

        const newSession = await sessionModel.getSessionById(insertId);

        return res.status(201).json({
            success: true,
            message: "Sesi presensi hari ini berhasil diinisialisasi otomatis",
            data: newSession
        });
    } catch (error) {
        console.error("Quick init today session error:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal membuat sesi hari ini",
            error: error.message
        });
    }
};

module.exports = {
    getSessions,
    getToday,
    getSession,
    createSession,
    updateSession,
    deleteSession,
    toggleStatus,
    quickInitToday
};
