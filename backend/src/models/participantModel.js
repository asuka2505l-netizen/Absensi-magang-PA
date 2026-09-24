const db = require("../config/database");

const getAllParticipants = async () => {
    const [rows] = await db.query(`
        SELECT
            id,
            full_name,
            identity_number,
            institution,
            participant_type,
            phone,
            qr_token,
            status,
            start_date,
            end_date,
            created_at,
            updated_at
        FROM participants
        ORDER BY id DESC
    `);

    return rows;
};

const getParticipantById = async (id) => {
    const [rows] = await db.query(`
        SELECT
            id,
            full_name,
            identity_number,
            institution,
            participant_type,
            phone,
            qr_token,
            status,
            start_date,
            end_date,
            created_at,
            updated_at
        FROM participants
        WHERE id = ?
    `, [id]);

    return rows[0];
};

const createParticipant = async (data) => {
    const {
        full_name,
        identity_number,
        institution,
        participant_type,
        phone,
        qr_token,
        status,
        start_date,
        end_date
    } = data;

    const [result] = await db.query(`
        INSERT INTO participants (
            full_name,
            identity_number,
            institution,
            participant_type,
            phone,
            qr_token,
            status,
            start_date,
            end_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        full_name,
        identity_number,
        institution,
        participant_type,
        phone || null,
        qr_token,
        status || "active",
        start_date || null,
        end_date || null
    ]);

    return result.insertId;
};

const updateParticipant = async (id, data) => {
    const {
        full_name,
        identity_number,
        institution,
        participant_type,
        phone,
        status,
        start_date,
        end_date
    } = data;

    const [result] = await db.query(`
        UPDATE participants
        SET
            full_name = ?,
            identity_number = ?,
            institution = ?,
            participant_type = ?,
            phone = ?,
            status = ?,
            start_date = ?,
            end_date = ?
        WHERE id = ?
    `, [
        full_name,
        identity_number,
        institution,
        participant_type,
        phone || null,
        status,
        start_date || null,
        end_date || null,
        id
    ]);

    return result.affectedRows;
};

const deleteParticipant = async (id) => {
    const [result] = await db.query(`
        DELETE FROM participants
        WHERE id = ?
    `, [id]);

    return result.affectedRows;
};

module.exports = {
    getAllParticipants,
    getParticipantById,
    createParticipant,
    updateParticipant,
    deleteParticipant
};