const db = require("../config/database");

const getParticipantByQrToken = async (qr_token) => {
    const [rows] = await db.query(
        `
        SELECT
            id,
            full_name,
            identity_number,
            institution,
            participant_type,
            status,
            start_date,
            end_date,
            qr_token
        FROM participants
        WHERE qr_token = ?
        LIMIT 1
        `,
        [qr_token]
    );

    return rows[0];
};

const getAttendanceByParticipantAndSession = async (
    participantId,
    sessionId
) => {
    const [rows] = await db.query(
        `
        SELECT
            id,
            participant_id,
            session_id,
            check_in_at,
            check_out_at,
            check_in_latitude,
            check_in_longitude,
            check_out_latitude,
            check_out_longitude,
            status,
            note
        FROM attendances
        WHERE participant_id = ?
        AND session_id = ?
        LIMIT 1
        `,
        [participantId, sessionId]
    );

    return rows[0];
};

const createCheckIn = async (data) => {
    const {
        participant_id,
        session_id,
        check_in_at,
        latitude,
        longitude
    } = data;

    const [result] = await db.query(
        `
        INSERT INTO attendances (
            participant_id,
            session_id,
            check_in_at,
            check_in_latitude,
            check_in_longitude,
            status
        )
        VALUES (?, ?, ?, ?, ?, 'incomplete')
        `,
        [
            participant_id,
            session_id,
            check_in_at,
            latitude,
            longitude
        ]
    );

    return result.insertId;
};

const createCheckOut = async (data) => {
    const {
        attendance_id,
        check_out_at,
        latitude,
        longitude
    } = data;

    const [result] = await db.query(
        `
        UPDATE attendances
        SET
            check_out_at = ?,
            check_out_latitude = ?,
            check_out_longitude = ?,
            status = 'completed'
        WHERE id = ?
        `,
        [
            check_out_at,
            latitude,
            longitude,
            attendance_id
        ]
    );

    return result.affectedRows;
};

const getAllAttendances = async (filters = {}) => {
    const {
        startDate,
        endDate,
        status,
        participant_type,
        institution,
        search
    } = filters;

    let query = `
        SELECT
            a.id,
            a.participant_id,
            a.session_id,
            a.check_in_at,
            a.check_out_at,
            a.check_in_latitude,
            a.check_in_longitude,
            a.check_out_latitude,
            a.check_out_longitude,
            a.status,
            a.note,
            a.created_at,

            p.full_name,
            p.identity_number,
            p.institution,
            p.participant_type,
            p.phone,

            s.session_date,
            s.check_in_start,
            s.check_in_end,
            s.check_out_start,
            s.check_out_end,
            s.radius_meter

        FROM attendances a

        INNER JOIN participants p
            ON a.participant_id = p.id

        LEFT JOIN attendance_sessions s
            ON a.session_id = s.id

        WHERE 1 = 1
    `;

    const params = [];

    if (startDate && endDate) {
        query += ` AND (s.session_date BETWEEN ? AND ? OR DATE(a.check_in_at) BETWEEN ? AND ?)`;
        params.push(startDate, endDate, startDate, endDate);
    } else if (startDate) {
        query += ` AND (s.session_date >= ? OR DATE(a.check_in_at) >= ?)`;
        params.push(startDate, startDate);
    } else if (endDate) {
        query += ` AND (s.session_date <= ? OR DATE(a.check_in_at) <= ?)`;
        params.push(endDate, endDate);
    }

    if (status && status !== "all") {
        query += ` AND a.status = ?`;
        params.push(status);
    }

    if (participant_type && participant_type !== "all") {
        query += ` AND p.participant_type = ?`;
        params.push(participant_type);
    }

    if (institution && institution.trim() !== "") {
        query += ` AND p.institution LIKE ?`;
        params.push(`%${institution.trim()}%`);
    }

    if (search && search.trim() !== "") {
        query += ` AND (p.full_name LIKE ? OR p.identity_number LIKE ? OR p.institution LIKE ?)`;
        params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += `
        ORDER BY
            COALESCE(s.session_date, DATE(a.check_in_at)) DESC,
            a.check_in_at DESC
    `;

    const [rows] = await db.query(query, params);
    return rows;
};

module.exports = {
    getParticipantByQrToken,
    getAttendanceByParticipantAndSession,
    createCheckIn,
    createCheckOut,
    getAllAttendances
};