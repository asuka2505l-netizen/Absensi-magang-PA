import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Link } from "react-router-dom";
import api from "../api/axios";

function AttendanceScan() {
    const [scanResult, setScanResult] = useState("");
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [scanType, setScanType] = useState(""); // "check_in" | "check_out"
    const [participantName, setParticipantName] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update jam real-time
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getLocationAndSubmit = (qrToken) => {
        if (!navigator.geolocation) {
            setError("Browser tidak mendukung GPS.");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                const accuracy = position.coords.accuracy;

                setLocation({ latitude, longitude, accuracy });

                try {
                    const response = await api.post("/attendance/scan", {
                        qr_token: qrToken,
                        latitude,
                        longitude
                    });

                    const data = response.data;
                    setMessage(data.message);
                    setScanType(data.data?.type || "");
                    setParticipantName(data.data?.participant_name || "");
                } catch (err) {
                    console.error(err);
                    const backendMessage = err.response?.data?.message;
                    setError(backendMessage || "Gagal memproses absensi.");
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                setLoading(false);
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setError("Izin lokasi ditolak. Silakan izinkan akses lokasi di browser.");
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setError("Lokasi tidak tersedia saat ini.");
                        break;
                    case err.TIMEOUT:
                        setError("Pengambilan lokasi timeout. Coba lagi.");
                        break;
                    default:
                        setError("Gagal mendapatkan lokasi GPS.");
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        if (scanResult) return;

        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 260, height: 260 } },
            false
        );

        const handleSuccess = (decodedText) => {
            setScanResult(decodedText);
            scanner.clear().catch(() => {});
            getLocationAndSubmit(decodedText);
        };

        const handleError = () => {};

        scanner.render(handleSuccess, handleError);

        return () => {
            scanner.clear().catch(() => {});
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scanResult]);

    const reloadScanner = () => {
        setScanResult("");
        setMessage("");
        setError("");
        setLocation(null);
        setScanType("");
        setParticipantName("");
    };

    const todayStr = currentTime.toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
    const timeStr = currentTime.toLocaleTimeString("id-ID", {
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    });

    return (
        <div style={styles.page}>
            {/* Background decoration */}
            <div style={styles.bgGlow1} />
            <div style={styles.bgGlow2} />

            <div style={styles.wrapper}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.logoContainer}>
                        <div style={styles.logoIcon}>📋</div>
                        <div>
                            <h1 style={styles.logoTitle}>Absensi Magang</h1>
                            <p style={styles.logoSubtitle}>Sistem Presensi Digital</p>
                        </div>
                    </div>
                    <div style={styles.clockBox}>
                        <div style={styles.clockTime}>{timeStr}</div>
                        <div style={styles.clockDate}>{todayStr}</div>
                    </div>
                </div>

                {/* Main Card */}
                <div style={styles.card}>
                    {/* Judul area */}
                    <div style={styles.cardHeader}>
                        <div style={styles.cardIconWrapper}>
                            <span style={styles.cardIcon}>📷</span>
                        </div>
                        <div>
                            <h2 style={styles.cardTitle}>Scan QR Code</h2>
                            <p style={styles.cardSubtitle}>
                                Arahkan kamera ke QR Code peserta untuk melakukan presensi
                            </p>
                        </div>
                    </div>

                    {/* Scanner Area */}
                    {!scanResult && (
                        <div style={styles.scannerWrapper}>
                            <div style={styles.scannerFrame}>
                                {/* Corner decorations */}
                                <div style={{...styles.corner, ...styles.cornerTL}} />
                                <div style={{...styles.corner, ...styles.cornerTR}} />
                                <div style={{...styles.corner, ...styles.cornerBL}} />
                                <div style={{...styles.corner, ...styles.cornerBR}} />
                                <div id="qr-reader" style={styles.qrReader} />
                            </div>
                            <p style={styles.scanHint}>
                                💡 Pastikan QR Code terlihat jelas dan cukup cahaya
                            </p>
                        </div>
                    )}

                    {/* Loading state */}
                    {loading && (
                        <div style={styles.statusBox}>
                            <div style={styles.spinner} />
                            <div>
                                <p style={styles.statusTitle}>Memproses Absensi...</p>
                                <p style={styles.statusSubtext}>Mengambil data lokasi GPS</p>
                            </div>
                        </div>
                    )}

                    {/* Success state */}
                    {message && !loading && (
                        <div style={styles.resultBox}>
                            <div style={{...styles.resultIcon, backgroundColor: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)"}}>
                                <span style={{fontSize: "40px"}}>✅</span>
                            </div>
                            <div style={styles.resultContent}>
                                <div style={{...styles.resultBadge, backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)"}}>
                                    {scanType === "check_in" ? "Check-In Berhasil" : scanType === "check_out" ? "Check-Out Berhasil" : "Absensi Berhasil"}
                                </div>
                                {participantName && (
                                    <p style={styles.resultName}>{participantName}</p>
                                )}
                                <p style={styles.resultMsg}>{message}</p>
                                {location && (
                                    <p style={styles.resultLocation}>
                                        📍 Akurasi GPS: ±{Math.round(location.accuracy)} meter
                                    </p>
                                )}
                            </div>
                            <button style={styles.scanAgainBtn} onClick={reloadScanner}>
                                🔄 Scan Lagi
                            </button>
                        </div>
                    )}

                    {/* Error state */}
                    {error && !loading && (
                        <div style={styles.resultBox}>
                            <div style={{...styles.resultIcon, backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)"}}>
                                <span style={{fontSize: "40px"}}>❌</span>
                            </div>
                            <div style={styles.resultContent}>
                                <div style={{...styles.resultBadge, backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)"}}>
                                    Absensi Gagal
                                </div>
                                <p style={styles.resultMsg}>{error}</p>
                            </div>
                            <button style={{...styles.scanAgainBtn, backgroundColor: "#dc2626"}} onClick={reloadScanner}>
                                🔄 Coba Lagi
                            </button>
                        </div>
                    )}
                </div>

                {/* Info cards */}
                <div style={styles.infoGrid}>
                    <div style={styles.infoCard}>
                        <span style={styles.infoIcon}>🕐</span>
                        <div>
                            <p style={styles.infoLabel}>Check-In</p>
                            <p style={styles.infoValue}>07:00 - 09:30</p>
                        </div>
                    </div>
                    <div style={styles.infoCard}>
                        <span style={styles.infoIcon}>🏃</span>
                        <div>
                            <p style={styles.infoLabel}>Check-Out</p>
                            <p style={styles.infoValue}>16:00 - 18:30</p>
                        </div>
                    </div>
                    <div style={styles.infoCard}>
                        <span style={styles.infoIcon}>📍</span>
                        <div>
                            <p style={styles.infoLabel}>Validasi</p>
                            <p style={styles.infoValue}>GPS Otomatis</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer style={styles.footer}>
                    <p style={styles.footerText}>
                        © 2025 Sistem Absensi Magang — Hak Cipta Dilindungi
                    </p>
                    <Link to="/login" style={styles.adminLink}>
                        🔐 Login Admin
                    </Link>
                </footer>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        padding: "0 16px"
    },
    bgGlow1: {
        position: "absolute",
        top: "-150px",
        right: "-150px",
        width: "500px",
        height: "500px",
        background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0
    },
    bgGlow2: {
        position: "absolute",
        bottom: "-150px",
        left: "-150px",
        width: "500px",
        height: "500px",
        background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0
    },
    wrapper: {
        width: "100%",
        maxWidth: "600px",
        position: "relative",
        zIndex: 1,
        padding: "24px 0 32px 0",
        display: "flex",
        flexDirection: "column",
        gap: "20px"
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px"
    },
    logoContainer: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },
    logoIcon: {
        fontSize: "36px",
        width: "56px",
        height: "56px",
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(59, 130, 246, 0.3)"
    },
    logoTitle: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#f8fafc",
        margin: 0,
        lineHeight: 1.2
    },
    logoSubtitle: {
        fontSize: "12px",
        color: "#64748b",
        margin: "2px 0 0 0",
        textTransform: "uppercase",
        letterSpacing: "0.5px"
    },
    clockBox: {
        textAlign: "right"
    },
    clockTime: {
        fontSize: "22px",
        fontWeight: "700",
        color: "#3b82f6",
        letterSpacing: "1px",
        fontVariantNumeric: "tabular-nums"
    },
    clockDate: {
        fontSize: "11px",
        color: "#64748b",
        marginTop: "2px"
    },
    card: {
        backgroundColor: "#1e293b",
        borderRadius: "20px",
        border: "1px solid #334155",
        padding: "28px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
    },
    cardHeader: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "24px"
    },
    cardIconWrapper: {
        width: "52px",
        height: "52px",
        borderRadius: "14px",
        backgroundColor: "rgba(59,130,246,0.15)",
        border: "1px solid rgba(59,130,246,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
    },
    cardIcon: {
        fontSize: "24px"
    },
    cardTitle: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#f8fafc",
        margin: 0,
        lineHeight: 1.2
    },
    cardSubtitle: {
        fontSize: "13px",
        color: "#64748b",
        margin: "4px 0 0 0"
    },
    scannerWrapper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px"
    },
    scannerFrame: {
        position: "relative",
        width: "100%",
        maxWidth: "320px"
    },
    corner: {
        position: "absolute",
        width: "24px",
        height: "24px",
        borderColor: "#3b82f6",
        borderStyle: "solid",
        zIndex: 10,
        pointerEvents: "none"
    },
    cornerTL: { top: "-4px", left: "-4px", borderWidth: "3px 0 0 3px", borderRadius: "4px 0 0 0" },
    cornerTR: { top: "-4px", right: "-4px", borderWidth: "3px 3px 0 0", borderRadius: "0 4px 0 0" },
    cornerBL: { bottom: "-4px", left: "-4px", borderWidth: "0 0 3px 3px", borderRadius: "0 0 0 4px" },
    cornerBR: { bottom: "-4px", right: "-4px", borderWidth: "0 3px 3px 0", borderRadius: "0 0 4px 0" },
    qrReader: {
        width: "100%",
        borderRadius: "12px",
        overflow: "hidden"
    },
    scanHint: {
        fontSize: "13px",
        color: "#64748b",
        textAlign: "center"
    },
    statusBox: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        backgroundColor: "rgba(59, 130, 246, 0.08)",
        border: "1px solid rgba(59, 130, 246, 0.25)",
        borderRadius: "12px",
        padding: "20px"
    },
    spinner: {
        width: "36px",
        height: "36px",
        border: "3px solid rgba(59, 130, 246, 0.2)",
        borderTop: "3px solid #3b82f6",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        flexShrink: 0
    },
    statusTitle: {
        fontSize: "15px",
        fontWeight: "600",
        color: "#f8fafc",
        margin: 0
    },
    statusSubtext: {
        fontSize: "12px",
        color: "#64748b",
        margin: "4px 0 0 0"
    },
    resultBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        textAlign: "center"
    },
    resultIcon: {
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    resultContent: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px"
    },
    resultBadge: {
        fontSize: "13px",
        fontWeight: "600",
        padding: "5px 14px",
        borderRadius: "99px"
    },
    resultName: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#f8fafc",
        margin: 0
    },
    resultMsg: {
        fontSize: "14px",
        color: "#94a3b8",
        margin: 0
    },
    resultLocation: {
        fontSize: "12px",
        color: "#64748b",
        margin: 0
    },
    scanAgainBtn: {
        backgroundColor: "#3b82f6",
        color: "#ffffff",
        border: "none",
        padding: "12px 28px",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "background-color 0.2s"
    },
    infoGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "12px"
    },
    infoCard: {
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "12px",
        padding: "16px 12px",
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },
    infoIcon: {
        fontSize: "22px",
        flexShrink: 0
    },
    infoLabel: {
        fontSize: "11px",
        color: "#64748b",
        margin: 0,
        textTransform: "uppercase",
        letterSpacing: "0.4px"
    },
    infoValue: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#f8fafc",
        margin: "2px 0 0 0"
    },
    footer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "8px",
        borderTop: "1px solid #1e293b",
        paddingTop: "16px"
    },
    footerText: {
        fontSize: "12px",
        color: "#475569",
        margin: 0
    },
    adminLink: {
        fontSize: "12px",
        color: "#64748b",
        textDecoration: "none",
        padding: "6px 12px",
        borderRadius: "6px",
        border: "1px solid #334155",
        transition: "all 0.2s",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px"
    }
};

// Inject keyframes for spinner animation
const styleEl = document.createElement("style");
styleEl.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  #qr-reader video { border-radius: 8px !important; }
  #qr-reader__scan_region { border-radius: 8px !important; }
`;
document.head.appendChild(styleEl);

export default AttendanceScan;