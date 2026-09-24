const db = require("../config/database");

/**
 * Controller untuk mengambil statistik ringkasan Dashboard Admin
 */
const getDashboardStats = async (req, res) => {
    try {
        // 1. Statistik Peserta
        const [participantStats] = await db.query(`
            SELECT
                COUNT(*) as total_participants,
                COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) as active_participants,
                COALESCE(SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END), 0) as inactive_participants,
                COALESCE(SUM(CASE WHEN participant_type = 'mahasiswa' THEN 1 ELSE 0 END), 0) as mahasiswa_count,
                COALESCE(SUM(CASE WHEN participant_type = 'smk' THEN 1 ELSE 0 END), 0) as smk_count,
                COALESCE(SUM(CASE WHEN participant_type = 'sma' THEN 1 ELSE 0 END), 0) as sma_count
            FROM participants
        `);

        // 2. Statistik Absensi Hari Ini
        const [attendanceStats] = await db.query(`
            SELECT
                COUNT(*) as today_total,
                COALESCE(SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END), 0) as today_completed,
                COALESCE(SUM(CASE WHEN a.status = 'incomplete' THEN 1 ELSE 0 END), 0) as today_incomplete
            FROM attendances a
            LEFT JOIN attendance_sessions s ON a.session_id = s.id
            WHERE s.session_date = CURDATE() OR DATE(a.check_in_at) = CURDATE()
        `);

        // 3. Info Sesi Absensi Hari Ini
        const [todaySessionRows] = await db.query(`
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
                status
            FROM attendance_sessions
            WHERE session_date = CURDATE()
            LIMIT 1
        `);

        // 4. Log Presensi Terbaru (5 data terakhir)
        const [recentAttendances] = await db.query(`
            SELECT
                a.id,
                a.check_in_at,
                a.check_out_at,
                a.status,
                a.note,
                p.id as participant_id,
                p.full_name,
                p.identity_number,
                p.institution,
                p.participant_type
            FROM attendances a
            INNER JOIN participants p ON a.participant_id = p.id
            ORDER BY a.check_in_at DESC
            LIMIT 5
        `);

        // 5. Hitung persentase kehadiran hari ini terhadap peserta aktif
        const activeCount = Number(participantStats[0]?.active_participants || 0);
        const todayCount = Number(attendanceStats[0]?.today_total || 0);
        const attendanceRate = activeCount > 0 ? Math.round((todayCount / activeCount) * 100) : 0;

        return res.json({
            success: true,
            message: "Data statistik dashboard berhasil diambil",
            data: {
                participants: {
                    total: Number(participantStats[0]?.total_participants || 0),
                    active: activeCount,
                    inactive: Number(participantStats[0]?.inactive_participants || 0),
                    types: {
                        mahasiswa: Number(participantStats[0]?.mahasiswa_count || 0),
                        smk: Number(participantStats[0]?.smk_count || 0),
                        sma: Number(participantStats[0]?.sma_count || 0)
                    }
                },
                attendances: {
                    today_total: todayCount,
                    today_completed: Number(attendanceStats[0]?.today_completed || 0),
                    today_incomplete: Number(attendanceStats[0]?.today_incomplete || 0),
                    attendance_rate: attendanceRate
                },
                today_session: todaySessionRows[0] || null,
                recent_attendances: recentAttendances
            }
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data statistik dashboard",
            error: error.message
        });
    }
};

module.exports = {
    getDashboardStats
};
