import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [admin, setAdmin] = useState(null);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get("/dashboard/stats");
            setStats(response.data.data);
        } catch (err) {
            console.error("Fetch dashboard error:", err);
            setError(err.response?.data?.message || "Gagal memuat statistik dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedAdmin = localStorage.getItem("admin");
        if (storedAdmin) {
            try {
                setAdmin(JSON.parse(storedAdmin));
            } catch {
                setAdmin(null);
            }
        }
        fetchDashboardStats();
    }, []);

    const formatDateTime = (value) => {
        if (!value) return "-";
        return new Date(value).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    };

    const todayDateFormatted = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const activeParticipants = stats?.participants?.active || 0;
    const totalParticipants = stats?.participants?.total || 0;
    const todayTotal = stats?.attendances?.today_total || 0;
    const attendanceRate = stats?.attendances?.attendance_rate || 0;

    return (
        <div style={styles.container}>
            {/* Top Greeting & Header */}
            <div style={styles.headerBanner}>
                <div>
                    <h1 style={styles.headerTitle}>
                        Halo, {admin?.full_name || admin?.username || "Administrator"}! 👋
                    </h1>
                    <p style={styles.headerSubtitle}>
                        Selamat datang di panel kontrol Sistem Absensi & Magang. Hari ini: <strong>{todayDateFormatted}</strong>
                    </p>
                </div>
                <div style={styles.headerActions}>
                    <button
                        onClick={fetchDashboardStats}
                        style={styles.refreshBtn}
                        title="Perbarui Data"
                        disabled={loading}
                    >
                        🔄 {loading ? "Memuat..." : "Segarkan"}
                    </button>
                    <button
                        onClick={() => navigate("/participants?action=add")}
                        style={styles.primaryBtn}
                    >
                        ➕ Tambah Peserta
                    </button>
                </div>
            </div>

            {error && (
                <div style={styles.errorAlert}>
                    <span>⚠️ {error}</span>
                </div>
            )}

            {/* Metric / Stat Cards Grid */}
            <div style={styles.metricsGrid}>
                {/* Metric 1: Total Peserta */}
                <div style={styles.metricCard}>
                    <div style={styles.metricHeader}>
                        <span style={styles.metricLabel}>Total Peserta</span>
                        <div style={{ ...styles.metricIconBox, backgroundColor: "#eff6ff", color: "#3b82f6" }}>
                            👥
                        </div>
                    </div>
                    <div style={styles.metricValue}>{totalParticipants}</div>
                    <div style={styles.metricSubtext}>
                        Terdaftar di sistem presensi
                    </div>
                    <div style={styles.badgeRow}>
                        <span style={styles.tagMhs}>{stats?.participants?.types?.mahasiswa || 0} Mahasiswa</span>
                        <span style={styles.tagSmk}>{stats?.participants?.types?.smk || 0} SMK</span>
                        <span style={styles.tagSma}>{stats?.participants?.types?.sma || 0} SMA</span>
                    </div>
                </div>

                {/* Metric 2: Peserta Aktif */}
                <div style={styles.metricCard}>
                    <div style={styles.metricHeader}>
                        <span style={styles.metricLabel}>Status Keaktifan</span>
                        <div style={{ ...styles.metricIconBox, backgroundColor: "#ecfdf5", color: "#10b981" }}>
                            🟢
                        </div>
                    </div>
                    <div style={styles.metricValue}>{activeParticipants}</div>
                    <div style={styles.metricSubtext}>
                        {stats?.participants?.inactive || 0} peserta berstatus tidak aktif
                    </div>
                    <div style={styles.progressTrack}>
                        <div
                            style={{
                                ...styles.progressBar,
                                width: `${totalParticipants > 0 ? (activeParticipants / totalParticipants) * 100 : 0}%`,
                                backgroundColor: "#10b981"
                            }}
                        />
                    </div>
                </div>

                {/* Metric 3: Presensi Hari Ini */}
                <div style={styles.metricCard}>
                    <div style={styles.metricHeader}>
                        <span style={styles.metricLabel}>Presensi Hari Ini</span>
                        <div style={{ ...styles.metricIconBox, backgroundColor: "#fef3c7", color: "#f59e0b" }}>
                            📋
                        </div>
                    </div>
                    <div style={styles.metricValue}>{todayTotal}</div>
                    <div style={styles.metricSubtext}>
                        {stats?.attendances?.today_completed || 0} selesai, {stats?.attendances?.today_incomplete || 0} belum checkout
                    </div>
                    <div style={styles.progressTrack}>
                        <div
                            style={{
                                ...styles.progressBar,
                                width: `${Math.min(attendanceRate, 100)}%`,
                                backgroundColor: "#f59e0b"
                            }}
                        />
                    </div>
                </div>

                {/* Metric 4: Persentase Kehadiran */}
                <div style={styles.metricCard}>
                    <div style={styles.metricHeader}>
                        <span style={styles.metricLabel}>Tingkat Kehadiran</span>
                        <div style={{ ...styles.metricIconBox, backgroundColor: "#f3e8ff", color: "#8b5cf6" }}>
                            📊
                        </div>
                    </div>
                    <div style={styles.metricValue}>{attendanceRate}%</div>
                    <div style={styles.metricSubtext}>
                        Rasio kehadiran dari peserta aktif hari ini
                    </div>
                    <div style={styles.statusPill}>
                        {activeParticipants === 0
                            ? "Belum ada peserta aktif"
                            : attendanceRate >= 75
                            ? "✅ Kehadiran Sangat Baik"
                            : attendanceRate >= 50
                            ? "⚠️ Kehadiran Cukup"
                            : "⏳ Presensi Masih Berjalan"}
                    </div>
                </div>
            </div>

            {/* Quick Action Shortcuts */}
            <div style={styles.quickActionsCard}>
                <span style={styles.quickActionsTitle}>Pintasan Cepat:</span>
                <div style={styles.quickActionsButtons}>
                    <Link to="/participants" style={styles.quickActionLink}>
                        👥 Kelola Data Peserta
                    </Link>
                    <Link to="/attendance" style={styles.quickActionLink}>
                        📊 Lihat Semua Absensi
                    </Link>
                    <Link to="/scan" target="_blank" rel="noreferrer" style={{ ...styles.quickActionLink, backgroundColor: "#2563eb", color: "#ffffff" }}>
                        📷 Buka Scanner QR Peserta ↗
                    </Link>
                </div>
            </div>

            {/* Main Content Layout (2 Columns) */}
            <div style={styles.contentLayout}>
                {/* Left Column: Recent Attendances */}
                <div style={styles.mainColumn}>
                    <div style={styles.panelCard}>
                        <div style={styles.panelHeader}>
                            <div>
                                <h3 style={styles.panelTitle}>Aktivitas Presensi Terbaru</h3>
                                <p style={styles.panelSubtitle}>Log peserta yang baru saja melakukan check-in / check-out</p>
                            </div>
                            <Link to="/attendance" style={styles.panelLink}>
                                Lihat Semua →
                            </Link>
                        </div>

                        {loading ? (
                            <p style={styles.infoText}>Memuat data presensi...</p>
                        ) : !stats?.recent_attendances || stats.recent_attendances.length === 0 ? (
                            <div style={styles.emptyState}>
                                <div style={{ fontSize: "42px", marginBottom: "10px" }}>📭</div>
                                <h4 style={styles.emptyTitle}>Belum Ada Presensi Hari Ini</h4>
                                <p style={styles.emptyDesc}>
                                    Belum ada peserta yang melakukan scan absensi. Anda dapat membuka halaman scanner untuk mulai memindai QR Code peserta.
                                </p>
                                <Link to="/scan" target="_blank" rel="noreferrer" style={styles.emptyBtn}>
                                    Buka Halaman Scanner
                                </Link>
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Nama Peserta</th>
                                            <th style={styles.th}>Institusi</th>
                                            <th style={styles.th}>Tipe</th>
                                            <th style={styles.th}>Check-In</th>
                                            <th style={styles.th}>Check-Out</th>
                                            <th style={styles.th}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recent_attendances.map((item) => (
                                            <tr key={item.id} style={styles.tr}>
                                                <td style={styles.td}>
                                                    <div style={styles.participantCell}>
                                                        <div style={styles.avatarInitials}>
                                                            {item.full_name?.charAt(0)?.toUpperCase() || "P"}
                                                        </div>
                                                        <div>
                                                            <div style={styles.participantName}>{item.full_name}</div>
                                                            <div style={styles.participantId}>{item.identity_number}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={styles.td}>{item.institution}</td>
                                                <td style={styles.td}>
                                                    <span style={styles.typeBadge}>
                                                        {item.participant_type?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={styles.timeTag}>
                                                        {formatDateTime(item.check_in_at)}
                                                    </span>
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={styles.timeTag}>
                                                        {formatDateTime(item.check_out_at)}
                                                    </span>
                                                </td>
                                                <td style={styles.td}>
                                                    <span
                                                        style={
                                                            item.status === "completed"
                                                                ? styles.statusComplete
                                                                : styles.statusIncomplete
                                                        }
                                                    >
                                                        {item.status === "completed" ? "Selesai" : "Belum Checkout"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Sesi Presensi & Komposisi */}
                <div style={styles.sideColumn}>
                    {/* Sesi Hari Ini Card */}
                    <div style={styles.panelCard}>
                        <h3 style={styles.panelTitle}>Sesi Presensi Hari Ini</h3>
                        <p style={styles.panelSubtitle}>Pengaturan jadwal kehadiran kantor</p>

                        {stats?.today_session ? (
                            <div style={styles.sessionDetails}>
                                <div style={styles.sessionRow}>
                                    <span style={styles.sessionLabel}>Status Sesi:</span>
                                    <span style={styles.badgeSuccess}>
                                        {stats.today_session.status === "active" ? "Aktif" : "Ditutup"}
                                    </span>
                                </div>
                                <div style={styles.sessionRow}>
                                    <span style={styles.sessionLabel}>Jam Check-In:</span>
                                    <strong style={styles.sessionValue}>
                                        {stats.today_session.check_in_start} - {stats.today_session.check_in_end}
                                    </strong>
                                </div>
                                <div style={styles.sessionRow}>
                                    <span style={styles.sessionLabel}>Jam Check-Out:</span>
                                    <strong style={styles.sessionValue}>
                                        {stats.today_session.check_out_start} - {stats.today_session.check_out_end}
                                    </strong>
                                </div>
                                <div style={styles.sessionRow}>
                                    <span style={styles.sessionLabel}>Radius Lokasi:</span>
                                    <span style={styles.sessionValue}>{stats.today_session.radius_meter} meter</span>
                                </div>
                            </div>
                        ) : (
                            <div style={styles.noSessionBox}>
                                <span style={{ fontSize: "28px" }}>ℹ️</span>
                                <p style={styles.noSessionText}>
                                    Sesi absensi untuk tanggal hari ini ({todayDateFormatted}) belum dibuat. Sesi default akan otomatis aktif saat peserta scan presensi atau dapat dikonfigurasi melalui menu pengaturan.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Informasi Aturan & Keamanan */}
                    <div style={styles.panelCard}>
                        <h3 style={styles.panelTitle}>Keamanan Presensi</h3>
                        <div style={styles.securityItem}>
                            <span style={styles.securityIcon}>📍</span>
                            <div>
                                <strong>Validasi Geofencing GPS</strong>
                                <p style={styles.securityDesc}>
                                    Peserta wajib berada dalam batas radius lokasi kantor agar dapat melakukan check-in / check-out.
                                </p>
                            </div>
                        </div>
                        <div style={styles.securityItem}>
                            <span style={styles.securityIcon}>🪪</span>
                            <div>
                                <strong>Enkripsi QR Token Unik</strong>
                                <p style={styles.securityDesc}>
                                    Setiap peserta memiliki token UUID acak yang tidak dapat dipalsukan.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        width: "100%",
        textAlign: "left",
        boxSizing: "border-box"
    },
    headerBanner: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#1e293b",
        padding: "24px 28px",
        borderRadius: "14px",
        color: "#ffffff",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "16px"
    },
    headerTitle: {
        fontSize: "24px",
        fontWeight: "700",
        margin: "0 0 6px 0",
        color: "#ffffff"
    },
    headerSubtitle: {
        fontSize: "14px",
        color: "#94a3b8",
        margin: 0
    },
    headerActions: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },
    refreshBtn: {
        padding: "10px 16px",
        borderRadius: "8px",
        border: "1px solid #475569",
        backgroundColor: "#334155",
        color: "#f8fafc",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "background 0.2s"
    },
    primaryBtn: {
        padding: "10px 18px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(37, 99, 235, 0.4)",
        transition: "background 0.2s"
    },
    errorAlert: {
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        color: "#ef4444",
        padding: "12px 16px",
        borderRadius: "8px",
        marginBottom: "20px",
        fontSize: "14px"
    },
    metricsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "18px",
        marginBottom: "24px"
    },
    metricCard: {
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "14px",
        padding: "20px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
    },
    metricHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px"
    },
    metricLabel: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: "0.5px"
    },
    metricIconBox: {
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px"
    },
    metricValue: {
        fontSize: "32px",
        fontWeight: "700",
        color: "#f8fafc",
        marginBottom: "6px"
    },
    metricSubtext: {
        fontSize: "12px",
        color: "#94a3b8",
        marginBottom: "12px"
    },
    badgeRow: {
        display: "flex",
        gap: "6px",
        flexWrap: "wrap"
    },
    tagMhs: {
        fontSize: "11px",
        padding: "3px 8px",
        borderRadius: "4px",
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        color: "#60a5fa"
    },
    tagSmk: {
        fontSize: "11px",
        padding: "3px 8px",
        borderRadius: "4px",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        color: "#34d399"
    },
    tagSma: {
        fontSize: "11px",
        padding: "3px 8px",
        borderRadius: "4px",
        backgroundColor: "rgba(245, 158, 11, 0.15)",
        color: "#fbbf24"
    },
    progressTrack: {
        width: "100%",
        height: "6px",
        backgroundColor: "#334155",
        borderRadius: "3px",
        overflow: "hidden"
    },
    progressBar: {
        height: "100%",
        borderRadius: "3px",
        transition: "width 0.3s ease"
    },
    statusPill: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#a78bfa",
        backgroundColor: "rgba(139, 92, 246, 0.12)",
        padding: "4px 8px",
        borderRadius: "6px",
        display: "inline-block"
    },
    quickActionsCard: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        padding: "14px 20px",
        borderRadius: "10px",
        marginBottom: "24px",
        flexWrap: "wrap"
    },
    quickActionsTitle: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#94a3b8"
    },
    quickActionsButtons: {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap"
    },
    quickActionLink: {
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: "500",
        color: "#e2e8f0",
        backgroundColor: "#334155",
        padding: "7px 14px",
        borderRadius: "6px",
        transition: "all 0.2s"
    },
    contentLayout: {
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "24px"
    },
    mainColumn: {
        display: "flex",
        flexDirection: "column",
        gap: "24px"
    },
    sideColumn: {
        display: "flex",
        flexDirection: "column",
        gap: "24px"
    },
    panelCard: {
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "14px",
        padding: "24px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
    },
    panelHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "20px",
        borderBottom: "1px solid #334155",
        paddingBottom: "14px"
    },
    panelTitle: {
        fontSize: "17px",
        fontWeight: "700",
        color: "#f8fafc",
        margin: "0 0 4px 0"
    },
    panelSubtitle: {
        fontSize: "12px",
        color: "#94a3b8",
        margin: 0
    },
    panelLink: {
        fontSize: "13px",
        color: "#3b82f6",
        textDecoration: "none",
        fontWeight: "600"
    },
    infoText: {
        color: "#94a3b8",
        fontSize: "14px"
    },
    emptyState: {
        padding: "36px 16px",
        textAlign: "center"
    },
    emptyTitle: {
        fontSize: "16px",
        color: "#e2e8f0",
        margin: "0 0 6px 0"
    },
    emptyDesc: {
        fontSize: "13px",
        color: "#94a3b8",
        maxWidth: "420px",
        margin: "0 auto 16px auto",
        lineHeight: "1.5"
    },
    emptyBtn: {
        display: "inline-block",
        padding: "9px 16px",
        borderRadius: "8px",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: "600"
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        textAlign: "left"
    },
    th: {
        padding: "10px 12px",
        fontSize: "12px",
        fontWeight: "600",
        color: "#94a3b8",
        borderBottom: "1px solid #334155",
        textTransform: "uppercase",
        letterSpacing: "0.5px"
    },
    tr: {
        borderBottom: "1px solid #334155"
    },
    td: {
        padding: "12px",
        fontSize: "13px",
        color: "#f1f5f9"
    },
    participantCell: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },
    avatarInitials: {
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        backgroundColor: "#3b82f6",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
        fontSize: "13px",
        flexShrink: 0
    },
    participantName: {
        fontWeight: "600",
        color: "#f8fafc"
    },
    participantId: {
        fontSize: "11px",
        color: "#94a3b8"
    },
    typeBadge: {
        fontSize: "11px",
        padding: "2px 7px",
        borderRadius: "4px",
        backgroundColor: "#334155",
        color: "#cbd5e1"
    },
    timeTag: {
        fontSize: "12px",
        color: "#cbd5e1",
        fontFamily: "monospace"
    },
    statusComplete: {
        fontSize: "11px",
        fontWeight: "600",
        padding: "3px 8px",
        borderRadius: "12px",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        color: "#34d399",
        border: "1px solid rgba(16, 185, 129, 0.3)"
    },
    statusIncomplete: {
        fontSize: "11px",
        fontWeight: "600",
        padding: "3px 8px",
        borderRadius: "12px",
        backgroundColor: "rgba(245, 158, 11, 0.15)",
        color: "#fbbf24",
        border: "1px solid rgba(245, 158, 11, 0.3)"
    },
    sessionDetails: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginTop: "12px"
    },
    sessionRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "13px"
    },
    sessionLabel: {
        color: "#94a3b8"
    },
    sessionValue: {
        color: "#f8fafc"
    },
    badgeSuccess: {
        fontSize: "11px",
        padding: "2px 8px",
        borderRadius: "4px",
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        color: "#34d399",
        fontWeight: "600"
    },
    noSessionBox: {
        backgroundColor: "#0f172a",
        padding: "16px",
        borderRadius: "10px",
        marginTop: "12px",
        border: "1px solid #334155",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start"
    },
    noSessionText: {
        fontSize: "12px",
        color: "#94a3b8",
        margin: 0,
        lineHeight: "1.5"
    },
    securityItem: {
        display: "flex",
        gap: "12px",
        marginTop: "16px",
        fontSize: "13px",
        color: "#cbd5e1"
    },
    securityIcon: {
        fontSize: "20px",
        flexShrink: 0
    },
    securityDesc: {
        fontSize: "12px",
        color: "#94a3b8",
        margin: "4px 0 0 0",
        lineHeight: "1.4"
    }
};

export default Dashboard;
