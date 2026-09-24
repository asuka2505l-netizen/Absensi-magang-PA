const db = require("../config/database");

/**
 * Mengambil sesi presensi untuk tanggal hari ini
 */
const getTodaySession = async () => {
    const [rows] = await db.query(`
        SELECT
            id,
            session_date,
            check_in_start,
            check_in_end,
            check_out_start,
            check_out_end,
            latitude,
            longitude,
            radius_meter,
            status,
            created_at,
            updated_at
        FROM attendance_sessions
        WHERE session_date = CURDATE()
        LIMIT 1
    `);

    return rows[0];
};

/**
 * Mengambil semua sesi presensi diurutkan dari tanggal terbaru
 */
const getAllSessions = async () => {
    const [rows] = await db.query(`
        SELECT
            id,
            session_date,
            check_in_start,
            check_in_end,
            check_out_start,
            check_out_end,
            latitude,
            longitude,
            radius_meter,
            status,
            created_at,
            updated_at
        FROM attendance_sessions
        ORDER BY session_date DESC
    `);

    return rows;
};

/**
 * Mengambil sesi presensi berdasarkan ID
 */
const getSessionById = async (id) => {
    const [rows] = await db.query(
        `
        SELECT
            id,
            session_date,
            check_in_start,
            check_in_end,
            check_out_start,
            check_out_end,
            latitude,
            longitude,
            radius_meter,
            status,
            created_at,
            updated_at
        FROM attendance_sessions
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0];
};

/**
 * Mengambil sesi presensi berdasarkan tanggal tertentu
 */
const getSessionByDate = async (sessionDate) => {
    const [rows] = await db.query(
        `
        SELECT id FROM attendance_sessions
        WHERE session_date = ?
        LIMIT 1
        `,
        [sessionDate]
    );

    return rows[0];
};

/**
 * Membuat sesi presensi baru
 */
const createSession = async (data) => {
    const {
        session_date,
        check_in_start,
        check_in_end,
        check_out_start,
        check_out_end,
        latitude,
        longitude,
        radius_meter = 100,
        status = "active"
    } = data;

    const [result] = await db.query(
        `
        INSERT INTO attendance_sessions (
            session_date,
            check_in_start,
            check_in_end,
            check_out_start,
            check_out_end,
            latitude,
            longitude,
            radius_meter,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            session_date,
            check_in_start,
            check_in_end,
            check_out_start,
            check_out_end,
            latitude,
            longitude,
            radius_meter,
            status
        ]
    );

    return result.insertId;
};

/**
 * Memperbarui data sesi presensi
 */
const updateSession = async (id, data) => {
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
    } = data;

    const [result] = await db.query(
        `
        UPDATE attendance_sessions
        SET
            session_date = ?,
            check_in_start = ?,
            check_in_end = ?,
            check_out_start = ?,
            check_out_end = ?,
            latitude = ?,
            longitude = ?,
            radius_meter = ?,
            status = ?
        WHERE id = ?
        `,
        [
            session_date,
            check_in_start,
            check_in_end,
            check_out_start,
            check_out_end,
            latitude,
            longitude,
            radius_meter,
            status,
            id
        ]
    );

    return result.affectedRows;
};

/**
 * Menghapus sesi presensi
 */
const deleteSession = async (id) => {
    const [result] = await db.query(
        `
        DELETE FROM attendance_sessions
        WHERE id = ?
        `,
        [id]
    );

    return result.affectedRows;
};

/**
 * Mengubah status sesi (active / closed)
 */
const toggleSessionStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "closed" : "active";

    const [result] = await db.query(
        `
        UPDATE attendance_sessions
        SET status = ?
        WHERE id = ?
        `,
        [nextStatus, id]
    );

    return { affectedRows: result.affectedRows, nextStatus };
};

module.exports = {
    getTodaySession,
    getAllSessions,
    getSessionById,
    getSessionByDate,
    createSession,
    updateSession,
    deleteSession,
    toggleSessionStatus
};