const db = require("../src/config/database");

const createAttendancesTable = async () => {
    try {
        const sql = `
        CREATE TABLE IF NOT EXISTS attendances (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            participant_id INT UNSIGNED NOT NULL,
            session_id INT UNSIGNED NOT NULL,
            check_in_at DATETIME NOT NULL,
            check_out_at DATETIME NULL,
            check_in_latitude DECIMAL(10,8) NOT NULL,
            check_in_longitude DECIMAL(11,8) NOT NULL,
            check_out_latitude DECIMAL(10,8) NULL,
            check_out_longitude DECIMAL(11,8) NULL,
            status ENUM('incomplete', 'completed') NOT NULL DEFAULT 'incomplete',
            note TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
            FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE
        );
        `;

        await db.query(sql);
        console.log("Tabel attendances berhasil dibuat / dipastikan ada.");
    } catch (error) {
        console.error("Gagal membuat tabel attendances:", error);
    } finally {
        await db.end();
    }
};

createAttendancesTable();
