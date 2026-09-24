const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
    getAdminByUsername,
    getAdminById
} = require("../models/adminModel");

const login = async (req, res) => {
    try {
        const {
            username,
            password
        } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Username dan password wajib diisi"
            });
        }

        const admin =
            await getAdminByUsername(username);

        if (!admin) {
            return res.status(401).json({
                success: false,
                message:
                    "Username atau password salah"
            });
        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                admin.password_hash
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Username atau password salah"
            });
        }

        const token = jwt.sign(
            {
                id: admin.id,
                username: admin.username
            },
            process.env.JWT_SECRET,
            {
                expiresIn:
                    process.env.JWT_EXPIRES_IN ||
                    "8h"
            }
        );

        return res.json({
            success: true,
            message: "Login berhasil",
            data: {
                token,
                admin: {
                    id: admin.id,
                    username: admin.username,
                    full_name: admin.full_name
                }
            }
        });

    } catch (error) {
        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Terjadi kesalahan server"
        });
    }
};

const getMe = async (req, res) => {
    try {
        const admin = await getAdminById(req.admin.id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin tidak ditemukan"
            });
        }

        return res.json({
            success: true,
            message: "Data profil admin berhasil diambil",
            data: {
                id: admin.id,
                username: admin.username,
                full_name: admin.full_name
            }
        });
    } catch (error) {
        console.error("Get admin profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server",
            error: error.message
        });
    }
};

module.exports = {
    login,
    getMe
};