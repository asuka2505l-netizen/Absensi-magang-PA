const db = require("../config/database");

const getAdminByUsername = async (username) => {
    const [rows] = await db.query(
        `
        SELECT
            id,
            username,
            password_hash,
            full_name
        FROM admins
        WHERE username = ?
        LIMIT 1
        `,
        [username]
    );

    return rows[0];
};

const getAdminById = async (id) => {
    const [rows] = await db.query(
        `
        SELECT
            id,
            username,
            full_name
        FROM admins
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0];
};

module.exports = {
    getAdminByUsername,
    getAdminById
};