const jwt = require("jsonwebtoken");

/**
 * Middleware untuk verifikasi JWT Token Admin
 */
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"] || req.headers["Authorization"];

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Akses ditolak: Token autentikasi tidak ditemukan"
            });
        }

        // Format: Bearer <token>
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                success: false,
                message: "Akses ditolak: Format token tidak valid (harus 'Bearer <token>')"
            });
        }

        const token = parts[1];

        // Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Tempelkan data admin ke object request
        req.admin = decoded;

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Sesi login telah kedaluwarsa. Silakan login kembali."
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(403).json({
                success: false,
                message: "Token tidak valid atau tanda tangan digital rusak."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Gagal memproses autentikasi token.",
            error: error.message
        });
    }
};

module.exports = {
    verifyToken
};
