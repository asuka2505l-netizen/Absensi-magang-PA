const bcrypt = require("bcryptjs");
const db = require("./src/config/database");

const createAdmin = async () => {
    try {
        const username = "admin";
        const password = "admin123";
        const fullName = "Administrator";

        const passwordHash =
            await bcrypt.hash(
                password,
                10
            );

        await db.query(
            `
            INSERT INTO admins (
                username,
                password_hash,
                full_name
            )
            VALUES (?, ?, ?)
            `,
            [
                username,
                passwordHash,
                fullName
            ]
        );

        console.log(
            "Admin berhasil dibuat"
        );

        console.log(
            "Username:",
            username
        );

        console.log(
            "Password:",
            password
        );

    } catch (error) {
        console.error(
            "Gagal membuat admin:",
            error
        );
    } finally {
        await db.end();
    }
};

createAdmin();