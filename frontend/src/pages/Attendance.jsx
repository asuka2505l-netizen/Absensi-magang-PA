import { useEffect, useState, useMemo } from "react";
import api from "../api/axios";

function Attendance() {
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [datePreset, setDatePreset] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Modal state for GPS detail
    const [selectedDetail, setSelectedDetail] = useState(null);

    const fetchAttendances = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (statusFilter !== "all") params.status = statusFilter;
            if (typeFilter !== "all") params.participant_type = typeFilter;
            if (searchTerm.trim()) params.search = searchTerm.trim();

            const response = await api.get("/attendance", { params });
            setAttendances(response.data.data || []);
        } catch (err) {
            console.error("Fetch attendances error:", err);
            setError(err.response?.data?.message || "Gagal mengambil data absensi.");
        } finally {
            setLoading(false);
        }
    };

    // Auto fetch when filters change
    useEffect(() => {
        fetchAttendances();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate, statusFilter, typeFilter]);

    // Apply quick date presets
    const handleDatePreset = (preset) => {
        setDatePreset(preset);
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        if (preset === "today") {
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (preset === "week") {
            const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
            const firstStr = firstDayOfWeek.toISOString().substring(0, 10);
            setStartDate(firstStr);
            setEndDate(todayStr);
        } else if (preset === "month") {
            const firstDayOfMonth = `${yyyy}-${mm}-01`;
            setStartDate(firstDayOfMonth);
            setEndDate(todayStr);
        } else {
            setStartDate("");
            setEndDate("");
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchAttendances();
    };

    const handleResetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setTypeFilter("all");
        setDatePreset("all");
        setStartDate("");
        setEndDate("");
    };

    // Formatter helpers
    const formatTimeOnly = (value) => {
        if (!value) return "-";
        return new Date(value).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatDateOnly = (value) => {
        if (!value) return "-";
        return new Date(value).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    // Calculate duration between check-in and check-out
    const calculateDuration = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return "-";
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffMs = end - start;
        if (diffMs <= 0) return "-";

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}j ${minutes}m`;
    };

    // Client-side quick filter for instantaneous search
    const displayedAttendances = useMemo(() => {
        return attendances.filter((item) => {
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                item.full_name?.toLowerCase().includes(term) ||
                item.identity_number?.toLowerCase().includes(term) ||
                item.institution?.toLowerCase().includes(term);

            const matchesStatus = statusFilter === "all" || item.status === statusFilter;
            const matchesType = typeFilter === "all" || item.participant_type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [attendances, searchTerm, statusFilter, typeFilter]);

    // Statistics calculations
    const stats = useMemo(() => {
        const total = displayedAttendances.length;
        const completed = displayedAttendances.filter((a) => a.status === "completed").length;
        const incomplete = displayedAttendances.filter((a) => a.status === "incomplete").length;
        const completeRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, incomplete, completeRate };
    }, [displayedAttendances]);

    // ============================================
    // FITUR EKSPOR LAPORAN (Tahap 14)
    // ============================================

    // 1. Export ke CSV / Excel
    const handleExportCSV = () => {
        if (displayedAttendances.length === 0) {
            alert("Tidak ada data absensi untuk diekspor.");
            return;
        }

        const headers = [
            "No",
            "Nama Peserta",
            "Nomor Identitas (NIM/NISN)",
            "Institusi",
            "Jenjang",
            "Tanggal Sesi",
            "Jam Check-In",
            "Jam Check-Out",
            "Durasi",
            "Status",
            "Lat Check-In",
            "Lng Check-In",
            "Lat Check-Out",
            "Lng Check-Out"
        ];

        const rows = displayedAttendances.map((item, index) => [
            index + 1,
            `"${item.full_name || ""}"`,
            `"${item.identity_number || ""}"`,
            `"${item.institution || ""}"`,
            `"${item.participant_type || ""}"`,
            `"${item.session_date ? item.session_date.substring(0, 10) : item.check_in_at?.substring(0, 10) || ""}"`,
            `"${formatTimeOnly(item.check_in_at)}"`,
            `"${formatTimeOnly(item.check_out_at)}"`,
            `"${calculateDuration(item.check_in_at, item.check_out_at)}"`,
            `"${item.status === "completed" ? "Selesai" : "Belum Checkout"}"`,
            item.check_in_latitude || "",
            item.check_in_longitude || "",
            item.check_out_latitude || "",
            item.check_out_longitude || ""
        ]);

        const csvContent =
            "\uFEFF" + // UTF-8 BOM agar terbaca sempurna di Microsoft Excel
            [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const dateTag = new Date().toISOString().substring(0, 10);
        link.setAttribute("href", url);
        link.setAttribute("download", `Laporan_Absensi_Magang_${dateTag}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 2. Cetak Laporan / Print Ready (PDF)
    const handlePrintReport = () => {
        window.print();
    };

    return (
        <div style={styles.container}>
            {/* Printable Report Header (Hanya tampil saat Print) */}
            <div className="print-only" style={styles.printHeader}>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "20px" }}>LAPORAN PRESENSI PESERTA MAGANG</h2>
                <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#333" }}>
                    Periode: {startDate ? formatDateOnly(startDate) : "Awal"} s/d {endDate ? formatDateOnly(endDate) : "Sekarang"}
                </p>
                <div style={{ fontSize: "11px", color: "#666" }}>
                    Dicetak pada: {new Date().toLocaleString("id-ID")} | Total: {stats.total} Catatan Presensi
                </div>
                <hr style={{ margin: "12px 0 16px 0", borderTop: "1px solid #999" }} />
            </div>

            {/* Top Header Normal */}
            <div style={styles.header} className="no-print">
                <div>
                    <h1 style={styles.title}>Riwayat & Laporan Presensi</h1>
                    <p style={styles.subtitle}>
                        Monitoring rekapan absensi peserta magang, validasi koordinat GPS, dan ekspor data laporan.
                    </p>
                </div>
                <div style={styles.headerBtnGroup}>
                    <button onClick={handleExportCSV} style={styles.exportBtn}>
                        📥 Ekspor Excel (CSV)
                    </button>
                    <button onClick={handlePrintReport} style={styles.printBtn}>
                        🖨️ Cetak Laporan (PDF)
                    </button>
                </div>
            </div>

            {/* Quick Stat Summary Cards */}
            <div style={styles.statsGrid} className="no-print">
                <div style={styles.statCard}>
                    <span style={styles.statCardLabel}>Total Presensi</span>
                    <div style={styles.statCardValue}>{stats.total}</div>
                    <small style={styles.statCardDesc}>Record yang sesuai filter</small>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statCardLabel}>Presensi Selesai</span>
                    <div style={{ ...styles.statCardValue, color: "#34d399" }}>{stats.completed}</div>
                    <small style={styles.statCardDesc}>Sudah Check-In & Check-Out</small>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statCardLabel}>Belum Check-Out</span>
                    <div style={{ ...styles.statCardValue, color: "#fbbf24" }}>{stats.incomplete}</div>
                    <small style={styles.statCardDesc}>Masih aktif di lokasi</small>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statCardLabel}>Tingkat Kelengkapan</span>
                    <div style={{ ...styles.statCardValue, color: "#60a5fa" }}>{stats.completeRate}%</div>
                    <small style={styles.statCardDesc}>Rasio presensi tuntas</small>
                </div>
            </div>

            {/* Filter Toolbar (Tahap 14) */}
            <div style={styles.filterCard} className="no-print">
                {/* Row 1: Search & Preset Buttons */}
                <div style={styles.filterRowTop}>
                    <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
                        <span style={{ fontSize: "16px" }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Cari nama peserta, NIM, atau institusi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={styles.searchInput}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                style={styles.clearSearchBtn}
                            >
                                ✕
                            </button>
                        )}
                    </form>

                    <div style={styles.presetGroup}>
                        <span style={styles.presetLabel}>Rentang:</span>
                        <button
                            type="button"
                            onClick={() => handleDatePreset("all")}
                            style={{
                                ...styles.presetBtn,
                                ...(datePreset === "all" ? styles.activePresetBtn : {})
                            }}
                        >
                            Semua
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDatePreset("today")}
                            style={{
                                ...styles.presetBtn,
                                ...(datePreset === "today" ? styles.activePresetBtn : {})
                            }}
                        >
                            Hari Ini
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDatePreset("week")}
                            style={{
                                ...styles.presetBtn,
                                ...(datePreset === "week" ? styles.activePresetBtn : {})
                            }}
                        >
                            Minggu Ini
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDatePreset("month")}
                            style={{
                                ...styles.presetBtn,
                                ...(datePreset === "month" ? styles.activePresetBtn : {})
                            }}
                        >
                            Bulan Ini
                        </button>
                    </div>
                </div>

                {/* Row 2: Date pickers & Dropdowns */}
                <div style={styles.filterRowBottom}>
                    <div style={styles.datePickerGroup}>
                        <label style={styles.filterLabel}>Dari Tanggal:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setDatePreset("custom");
                            }}
                            style={styles.dateInput}
                        />
                    </div>

                    <div style={styles.datePickerGroup}>
                        <label style={styles.filterLabel}>Sampai Tanggal:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setDatePreset("custom");
                            }}
                            style={styles.dateInput}
                        />
                    </div>

                    <div style={styles.dropdownGroup}>
                        <label style={styles.filterLabel}>Status:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={styles.selectFilter}
                        >
                            <option value="all">Semua Status</option>
                            <option value="completed">Selesai (Completed)</option>
                            <option value="incomplete">Belum Checkout (Incomplete)</option>
                        </select>
                    </div>

                    <div style={styles.dropdownGroup}>
                        <label style={styles.filterLabel}>Jenjang:</label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            style={styles.selectFilter}
                        >
                            <option value="all">Semua Jenjang</option>
                            <option value="mahasiswa">Mahasiswa</option>
                            <option value="smk">SMK</option>
                            <option value="sma">SMA</option>
                        </select>
                    </div>

                    <button type="button" onClick={handleResetFilters} style={styles.resetBtn}>
                        Reset Filter
                    </button>
                </div>
            </div>

            {error && (
                <div style={styles.errorAlert} className="no-print">
                    <span>⚠️ {error}</span>
                </div>
            )}

            {/* Attendance Table */}
            <div style={styles.tableCard}>
                {loading ? (
                    <div style={styles.loadingBox}>
                        <p>Memuat data absensi...</p>
                    </div>
                ) : displayedAttendances.length === 0 ? (
                    <div style={styles.emptyBox}>
                        <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
                        <h3 style={styles.emptyTitle}>Tidak Ada Data Absensi</h3>
                        <p style={styles.emptyDesc}>
                            {attendances.length === 0
                                ? "Belum ada presensi yang dilakukan peserta magang."
                                : "Tidak ada catatan presensi yang sesuai dengan kriteria filter saat ini."}
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>No</th>
                                    <th style={styles.th}>Peserta</th>
                                    <th style={styles.th}>Institusi</th>
                                    <th style={styles.th}>Tanggal</th>
                                    <th style={styles.th}>Check-In</th>
                                    <th style={styles.th}>Check-Out</th>
                                    <th style={styles.th}>Durasi</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={{ ...styles.th, textAlign: "right" }} className="no-print">
                                        Detail GPS
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedAttendances.map((item, idx) => (
                                    <tr key={item.id} style={styles.tr}>
                                        <td style={{ ...styles.td, color: "#94a3b8" }}>{idx + 1}</td>
                                        <td style={styles.td}>
                                            <div style={styles.participantProfile}>
                                                <div style={styles.avatar}>
                                                    {item.full_name?.charAt(0)?.toUpperCase() || "P"}
                                                </div>
                                                <div>
                                                    <div style={styles.participantName}>{item.full_name}</div>
                                                    <div style={styles.participantId}>{item.identity_number}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.institutionText}>{item.institution}</span>
                                            <span style={styles.typeBadge}>{item.participant_type?.toUpperCase()}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.dateBadge}>
                                                {formatDateOnly(item.session_date || item.check_in_at)}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.timeTag}>
                                                {formatTimeOnly(item.check_in_at)}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.timeTag}>
                                                {formatTimeOnly(item.check_out_at)}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.durationTag}>
                                                {calculateDuration(item.check_in_at, item.check_out_at)}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span
                                                style={
                                                    item.status === "completed"
                                                        ? styles.badgeCompleted
                                                        : styles.badgeIncomplete
                                                }
                                            >
                                                {item.status === "completed" ? "Selesai" : "Belum Checkout"}
                                            </span>
                                        </td>
                                        <td style={{ ...styles.td, textAlign: "right" }} className="no-print">
                                            <button
                                                onClick={() => setSelectedDetail(item)}
                                                style={styles.detailBtn}
                                                title="Lihat Koordinat GPS"
                                            >
                                                📍 GPS
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Printable Signature Space (Hanya tampil saat Print) */}
            <div className="print-only" style={styles.printFooter}>
                <div style={{ textAlign: "right", marginTop: "40px" }}>
                    <p style={{ margin: "0 0 60px 0" }}>
                        Mengetahui,<br />
                        <strong>Pembimbing / Administrator Magang</strong>
                    </p>
                    <p style={{ margin: 0, textDecoration: "underline" }}>( .................................................... )</p>
                </div>
            </div>

            {/* Modal: Detail Lokasi GPS Presensi */}
            {selectedDetail && (
                <div style={styles.modalOverlay} className="no-print">
                    <div style={styles.modalCard}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>Detail Lokasi GPS Presensi</h3>
                            <button onClick={() => setSelectedDetail(null)} style={styles.closeBtn}>
                                ✕
                            </button>
                        </div>

                        <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Nama Peserta:</span>
                            <strong>{selectedDetail.full_name} ({selectedDetail.identity_number})</strong>
                        </div>
                        <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Institusi:</span>
                            <span>{selectedDetail.institution}</span>
                        </div>
                        <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Tanggal Presensi:</span>
                            <span>{formatDateOnly(selectedDetail.session_date || selectedDetail.check_in_at)}</span>
                        </div>

                        <hr style={{ border: "none", borderTop: "1px solid #334155", margin: "16px 0" }} />

                        {/* Check-In Location */}
                        <div style={styles.gpsSection}>
                            <h4 style={styles.gpsSectionTitle}>🟢 Titik Lokasi Check-In</h4>
                            <p style={styles.gpsCoord}>
                                Waktu: <strong>{new Date(selectedDetail.check_in_at).toLocaleTimeString("id-ID")}</strong>
                            </p>
                            <p style={styles.gpsCoord}>
                                Koordinat: <code>{selectedDetail.check_in_latitude}, {selectedDetail.check_in_longitude}</code>
                            </p>
                            {selectedDetail.check_in_latitude && (
                                <a
                                    href={`https://www.google.com/maps?q=${selectedDetail.check_in_latitude},${selectedDetail.check_in_longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={styles.mapLink}
                                >
                                    🗺️ Buka Titik Check-In di Google Maps ↗
                                </a>
                            )}
                        </div>

                        {/* Check-Out Location */}
                        <div style={styles.gpsSection}>
                            <h4 style={styles.gpsSectionTitle}>🔴 Titik Lokasi Check-Out</h4>
                            {selectedDetail.check_out_at ? (
                                <>
                                    <p style={styles.gpsCoord}>
                                        Waktu: <strong>{new Date(selectedDetail.check_out_at).toLocaleTimeString("id-ID")}</strong>
                                    </p>
                                    <p style={styles.gpsCoord}>
                                        Koordinat: <code>{selectedDetail.check_out_latitude}, {selectedDetail.check_out_longitude}</code>
                                    </p>
                                    {selectedDetail.check_out_latitude && (
                                        <a
                                            href={`https://www.google.com/maps?q=${selectedDetail.check_out_latitude},${selectedDetail.check_out_longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={styles.mapLink}
                                        >
                                            🗺️ Buka Titik Check-Out di Google Maps ↗
                                        </a>
                                    )}
                                </>
                            ) : (
                                <p style={{ color: "#94a3b8", fontSize: "12px" }}>
                                    Peserta belum melakukan check-out.
                                </p>
                            )}
                        </div>

                        <div style={{ textAlign: "right", marginTop: "20px" }}>
                            <button onClick={() => setSelectedDetail(null)} style={styles.closeModalBtn}>
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        width: "100%",
        textAlign: "left",
        boxSizing: "border-box"
    },
    printHeader: {
        display: "none"
    },
    printFooter: {
        display: "none"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#1e293b",
        padding: "24px 28px",
        borderRadius: "14px",
        color: "#ffffff",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "16px"
    },
    title: {
        fontSize: "24px",
        fontWeight: "700",
        margin: "0 0 6px 0",
        color: "#ffffff"
    },
    subtitle: {
        fontSize: "14px",
        color: "#94a3b8",
        margin: 0
    },
    headerBtnGroup: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap"
    },
    exportBtn: {
        padding: "10px 16px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#10b981",
        color: "#ffffff",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)"
    },
    printBtn: {
        padding: "10px 16px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)"
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "20px"
    },
    statCard: {
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "12px",
        padding: "18px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
    },
    statCardLabel: {
        fontSize: "12px",
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        fontWeight: "600",
        display: "block",
        marginBottom: "6px"
    },
    statCardValue: {
        fontSize: "28px",
        fontWeight: "700",
        color: "#f8fafc",
        marginBottom: "4px"
    },
    statCardDesc: {
        fontSize: "11px",
        color: "#64748b"
    },
    filterCard: {
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "14px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        display: "flex",
        flexDirection: "column",
        gap: "14px"
    },
    filterRowTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap"
    },
    searchForm: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "#0f172a",
        border: "1px solid #334155",
        borderRadius: "8px",
        padding: "6px 12px",
        flex: "1 1 300px"
    },
    searchInput: {
        border: "none",
        backgroundColor: "transparent",
        color: "#f8fafc",
        fontSize: "13px",
        width: "100%",
        outline: "none"
    },
    clearSearchBtn: {
        background: "none",
        border: "none",
        color: "#94a3b8",
        cursor: "pointer",
        fontSize: "12px"
    },
    presetGroup: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        flexWrap: "wrap"
    },
    presetLabel: {
        fontSize: "12px",
        color: "#94a3b8",
        fontWeight: "600",
        marginRight: "4px"
    },
    presetBtn: {
        backgroundColor: "#334155",
        color: "#cbd5e1",
        border: "none",
        borderRadius: "6px",
        padding: "6px 12px",
        fontSize: "12px",
        cursor: "pointer"
    },
    activePresetBtn: {
        backgroundColor: "#2563eb",
        color: "#ffffff",
        fontWeight: "600"
    },
    filterRowBottom: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        flexWrap: "wrap",
        borderTop: "1px solid #334155",
        paddingTop: "14px"
    },
    datePickerGroup: {
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    dropdownGroup: {
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    filterLabel: {
        fontSize: "12px",
        color: "#94a3b8",
        fontWeight: "500"
    },
    dateInput: {
        backgroundColor: "#0f172a",
        border: "1px solid #334155",
        color: "#f8fafc",
        padding: "6px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        outline: "none"
    },
    selectFilter: {
        backgroundColor: "#0f172a",
        border: "1px solid #334155",
        color: "#f8fafc",
        padding: "6px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        outline: "none",
        cursor: "pointer"
    },
    resetBtn: {
        backgroundColor: "#334155",
        color: "#cbd5e1",
        border: "none",
        borderRadius: "6px",
        padding: "6px 12px",
        fontSize: "12px",
        cursor: "pointer"
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
    tableCard: {
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "14px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        overflow: "hidden"
    },
    loadingBox: {
        padding: "48px 16px",
        textAlign: "center",
        color: "#94a3b8"
    },
    emptyBox: {
        padding: "48px 16px",
        textAlign: "center"
    },
    emptyTitle: {
        fontSize: "17px",
        color: "#f8fafc",
        margin: "0 0 6px 0"
    },
    emptyDesc: {
        fontSize: "13px",
        color: "#94a3b8",
        maxWidth: "420px",
        margin: "0 auto"
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        textAlign: "left"
    },
    th: {
        padding: "12px 16px",
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
        padding: "14px 16px",
        fontSize: "13px",
        color: "#f1f5f9",
        verticalAlign: "middle"
    },
    participantProfile: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },
    avatar: {
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
    institutionText: {
        display: "block",
        fontWeight: "500",
        color: "#e2e8f0"
    },
    typeBadge: {
        fontSize: "10px",
        fontWeight: "600",
        padding: "2px 6px",
        borderRadius: "4px",
        backgroundColor: "rgba(148, 163, 184, 0.15)",
        color: "#94a3b8",
        display: "inline-block",
        marginTop: "2px"
    },
    dateBadge: {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#cbd5e1"
    },
    timeTag: {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#cbd5e1"
    },
    durationTag: {
        fontSize: "12px",
        color: "#a78bfa",
        fontWeight: "600"
    },
    badgeCompleted: {
        fontSize: "11px",
        fontWeight: "600",
        padding: "3px 8px",
        borderRadius: "12px",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        color: "#34d399",
        border: "1px solid rgba(16, 185, 129, 0.3)"
    },
    badgeIncomplete: {
        fontSize: "11px",
        fontWeight: "600",
        padding: "3px 8px",
        borderRadius: "12px",
        backgroundColor: "rgba(245, 158, 11, 0.15)",
        color: "#fbbf24",
        border: "1px solid rgba(245, 158, 11, 0.3)"
    },
    detailBtn: {
        backgroundColor: "#334155",
        color: "#60a5fa",
        border: "1px solid #475569",
        borderRadius: "6px",
        padding: "6px 10px",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer"
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 1000
    },
    modalCard: {
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "460px",
        padding: "24px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
    },
    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px"
    },
    modalTitle: {
        fontSize: "17px",
        fontWeight: "700",
        color: "#f8fafc",
        margin: 0
    },
    closeBtn: {
        background: "none",
        border: "none",
        color: "#94a3b8",
        fontSize: "18px",
        cursor: "pointer"
    },
    detailItem: {
        fontSize: "13px",
        color: "#f1f5f9",
        marginBottom: "6px",
        display: "flex",
        justifyContent: "space-between"
    },
    detailLabel: {
        color: "#94a3b8"
    },
    gpsSection: {
        backgroundColor: "#0f172a",
        padding: "12px",
        borderRadius: "8px",
        marginBottom: "10px",
        border: "1px solid #334155"
    },
    gpsSectionTitle: {
        fontSize: "13px",
        color: "#f8fafc",
        margin: "0 0 6px 0"
    },
    gpsCoord: {
        fontSize: "12px",
        color: "#cbd5e1",
        margin: "0 0 4px 0"
    },
    mapLink: {
        fontSize: "11px",
        color: "#3b82f6",
        textDecoration: "none",
        fontWeight: "600",
        display: "inline-block",
        marginTop: "4px"
    },
    closeModalBtn: {
        backgroundColor: "#334155",
        color: "#ffffff",
        border: "none",
        padding: "8px 16px",
        borderRadius: "6px",
        fontSize: "13px",
        cursor: "pointer"
    }
};

export default Attendance;