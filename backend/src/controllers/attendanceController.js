const {
    getParticipantByQrToken,
    getAttendanceByParticipantAndSession,
    createCheckIn,
    createCheckOut,
    getAllAttendances
} = require("../models/attendanceModel");

const calculateDistance =
    require("../utils/distance");

const {
    getTodaySession
} = require("../models/attendanceSessionModel");

const {
    isTimeBetween,
    getCurrentTime
} = require("../utils/attendanceTime");


const scanAttendance = async (req, res) => {
    try {

        // =========================
        // 1. Ambil data dari request
        // =========================

        const {
            qr_token,
            latitude,
            longitude
        } = req.body;


        // =========================
        // 2. Validasi QR Token
        // =========================

        if (!qr_token) {
            return res.status(400).json({
                success: false,
                message: "QR token wajib dikirim"
            });
        }


        // =========================
        // 3. Validasi lokasi
        // =========================

        if (
            latitude === undefined ||
            longitude === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Lokasi wajib dikirim"
            });
        }


        // =========================
        // 4. Cari peserta berdasarkan QR
        // =========================

        const participant =
            await getParticipantByQrToken(
                qr_token
            );


        if (!participant) {
            return res.status(404).json({
                success: false,
                message: "QR Code tidak terdaftar"
            });
        }


        // =========================
        // 5. Cek status peserta
        // =========================

        if (participant.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Peserta tidak aktif"
            });
        }


        // =========================
        // 6. Cari sesi absensi hari ini
        // =========================

        const session =
            await getTodaySession();

        if (!session) {
            return res.status(404).json({
                success: false,
                message:
                    "Sesi absensi hari ini belum tersedia / belum dibuka."
            });
        }

        // =========================
        // 7. Cek status sesi
        // =========================

        if (session.status !== "active") {
            return res.status(403).json({
                success: false,
                message:
                    "Sesi absensi hari ini sudah ditutup"
            });
        }

        // =========================
        // 8. Ambil konfigurasi lokasi dari sesi
        // =========================

        const attendanceLatitude =
            Number(session.latitude);

        const attendanceLongitude =
            Number(session.longitude);

        const attendanceRadius =
            Number(session.radius_meter) || 100;

        if (
            !Number.isFinite(
                attendanceLatitude
            ) ||
            !Number.isFinite(
                attendanceLongitude
            ) ||
            !Number.isFinite(
                attendanceRadius
            )
        ) {
            return res.status(500).json({
                success: false,
                message:
                    "Konfigurasi lokasi absensi pada sesi belum valid"
            });
        }

        // =========================
        // 9. Hitung jarak GPS
        // =========================

        const distance =
            calculateDistance(
                Number(latitude),
                Number(longitude),
                attendanceLatitude,
                attendanceLongitude
            );

        // =========================
        // 10. Cek radius
        // =========================

        if (
            distance >
            attendanceRadius
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Anda berada di luar area absensi",
                data: {
                    distance: Math.round(
                        distance
                    ),
                    allowed_radius:
                        attendanceRadius
                }
            });
        }


        // =========================
        // 12. Cek waktu sekarang
        // =========================

        const currentTime =
            getCurrentTime();


        // =========================
        // 13. Cek waktu check-in
        // =========================

        const canCheckIn =
            isTimeBetween(
                currentTime,
                session.check_in_start,
                session.check_in_end
            );


        // =========================
        // 14. Cek waktu check-out
        // =========================

        const canCheckOut =
            isTimeBetween(
                currentTime,
                session.check_out_start,
                session.check_out_end
            );


        // =========================
        // 15. Kalau bukan waktu absensi
        // =========================

        if (
            !canCheckIn &&
            !canCheckOut
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Saat ini bukan waktu absensi",
                data: {
                    current_time:
                        currentTime,

                    check_in:
                        `${session.check_in_start} - ${session.check_in_end}`,

                    check_out:
                        `${session.check_out_start} - ${session.check_out_end}`
                }
            });
        }

        const existingAttendance =
            await getAttendanceByParticipantAndSession(
                participant.id,
                session.id
            );

        const now = new Date();

        if (!existingAttendance) {
            if (!canCheckIn) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Anda belum melakukan check-in dan saat ini bukan waktu check-in"
                });
            }

            const attendanceId =
                await createCheckIn({
                    participant_id:
                        participant.id,
                    session_id:
                        session.id,
                    check_in_at: now,
                    latitude:
                        Number(latitude),
                    longitude:
                        Number(longitude)
                });

            return res.status(201).json({
                success: true,
                message:
                    "Check-in berhasil",
                data: {
                    attendance_id:
                        attendanceId,
                    type: "check-in",
                    participant: {
                        id: participant.id,
                        full_name:
                            participant.full_name,
                        institution:
                            participant.institution
                    },
                    check_in_at: now
                }
            });
        }

        if (
            existingAttendance.check_in_at &&
            !existingAttendance.check_out_at
        ) {
            if (!canCheckOut) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Anda sudah check-in. Silakan melakukan check-out pada waktu yang ditentukan"
                });
            }

            await createCheckOut({
                attendance_id:
                    existingAttendance.id,
                check_out_at: now,
                latitude:
                    Number(latitude),
                longitude:
                    Number(longitude)
            });

            return res.json({
                success: true,
                message:
                    "Check-out berhasil",
                data: {
                    attendance_id:
                        existingAttendance.id,
                    type: "check-out",
                    participant: {
                        id: participant.id,
                        full_name:
                            participant.full_name,
                        institution:
                            participant.institution
                    },
                    check_out_at: now
                }
            });
        }

        if (
            existingAttendance.check_in_at &&
            existingAttendance.check_out_at
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Absensi hari ini sudah lengkap"
            });
        }


        // =========================
        // 16. Untuk sementara
        // =========================

        return res.json({
            success: true,
            message:
                "Semua validasi berhasil",

            data: {
                participant: {
                    id: participant.id,

                    full_name:
                        participant.full_name,

                    institution:
                        participant.institution,

                    participant_type:
                        participant.participant_type
                },

                location: {
                    latitude:
                        Number(latitude),

                    longitude:
                        Number(longitude)
                },

                distance:
                    Math.round(distance),

                allowed_radius:
                    attendanceRadius,

                current_time:
                    currentTime,

                action:
                    canCheckIn
                        ? "check_in"
                        : "check_out"
            }
        });

    } catch (error) {

        console.error(
            "Scan attendance error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Terjadi kesalahan server",
            error: error.message
        });
    }
};

const getAttendances = async (req, res) => {
    try {
        const attendances =
            await getAllAttendances(req.query);

        return res.json({
            success: true,
            data: attendances
        });

    } catch (error) {
        console.error(
            "Get attendances error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal mengambil data absensi",
            error: error.message
        });
    }
};

module.exports = {
    scanAttendance,
    getAttendances
};