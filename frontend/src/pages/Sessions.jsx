import { useEffect, useState, useMemo } from "react";
import api from "../api/axios";

function Sessions() {
    const [sessions, setSessions] = useState([]);
    const [todaySession, setTodaySession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [detectingGps, setDetectingGps] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const todayDateString = new Date().toISOString().substring(0, 10);

    const initialFormData = {
        session_date: todayDateString,
        check_in_start: "07:00",
        check_in_end: "09:30",
        check_out_start: "16:00",
        check_out_end: "18:30",
        latitude: -6.200000,
        longitude: 106.816666,
        radius_meter: 150,
        status: "active"
    };

    const [formData, setFormData] = useState(initialFormData);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            setError("");
            const [sessionsRes, todayRes] = await Promise.all([
                api.get("/sessions"),
                api.get("/sessions/today")
            ]);
            setSessions(sessionsRes.data.data || []);
            setTodaySession(todayRes.data.data || null);
        } catch (err) {
            console.error("Fetch sessions error:", err);
            setError(err.response?.data?.message || "Gagal memuat data sesi absensi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const resetForm = () => {
        setFormData(initialFormData);
        setEditingId(null);
        setShowModal(false);
    };

    const handleOpenAdd = () => {
        resetForm();
        setShowModal(true);
    };

    const handleOpenEdit = (s) => {
        setEditingId(s.id);
        setFormData({
            session_date: s.session_date ? s.session_date.substring(0, 10) : todayDateString,
            check_in_start: s.check_in_start ? s.check_in_start.substring(0, 5) : "07:00",
            check_in_end: s.check_in_end ? s.check_in_end.substring(0, 5) : "09:30",
            check_out_start: s.check_out_start ? s.check_out_start.substring(0, 5) : "16:00",
            check_out_end: s.check_out_end ? s.check_out_end.substring(0, 5) : "18:30",
            latitude: s.latitude !== null && s.latitude !== undefined ? s.latitude : -6.200000,
            longitude: s.longitude !== null && s.longitude !== undefined ? s.longitude : 106.816666,
            radius_meter: s.radius_meter || 150,
            status: s.status || "active"
        });
        setShowModal(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // Ambil GPS perangkat admin saat ini untuk koordinat kantor
    const handleGetGpsCurrentPosition = () => {
        if (!navigator.geolocation) {
            alert("Browser tidak mendukung sensor GPS.");
            return;
        }

        setDetectingGps(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData((prev) => ({
                    ...prev,
                    latitude: Number(position.coords.latitude.toFixed(7)),
                    longitude: Number(position.coords.longitude.toFixed(7))
                }));
                setDetectingGps(false);
                alert(
                    `Koordinat lokasi kantor berhasil diambil!\nLatitude: ${position.coords.latitude}\nLongitude: ${position.coords.longitude}\nAkurasi: ~${Math.round(position.coords.accuracy)} meter`
                );
            },
            (err) => {
                setDetectingGps(false);
                alert(`Gagal mengambil koordinat GPS: ${err.message}. Pastikan izin lokasi aktif.`);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            // Tambahkan detik :00 jika format HH:mm
            const payload = {
                ...formData,
                check_in_start: formData.check_in_start.length === 5 ? `${formData.check_in_start}:00` : formData.check_in_start,
                check_in_end: formData.check_in_end.length === 5 ? `${formData.check_in_end}:00` : formData.check_in_end,
                check_out_start: formData.check_out_start.length === 5 ? `${formData.check_out_start}:00` : formData.check_out_start,
                check_out_end: formData.check_out_end.length === 5 ? `${formData.check_out_end}:00` : formData.check_out_end,
                latitude: Number(formData.latitude),
                longitude: Number(formData.longitude),
                radius_meter: Number(formData.radius_meter)
            };

            if (editingId) {
                await api.put(`/sessions/${editingId}`, payload);
                setSuccessMessage("Sesi absensi berhasil diperbarui.");
            } else {
                await api.post("/sessions", payload);
                setSuccessMessage("Sesi absensi baru berhasil dibuat.");
            }

            resetForm();
            fetchSessions();
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            console.error("Save session error:", err);
            alert(err.response?.data?.message || "Gagal menyimpan sesi absensi.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (s) => {
        try {
            const res = await api.patch(`/sessions/${s.id}/toggle`);
            setSuccessMessage(res.data.message);
            fetchSessions();
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            console.error("Toggle session status error:", err);
            alert(err.response?.data?.message || "Gagal mengubah status sesi");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            await api.delete(`/sessions/${deleteTarget.id}`);
            setDeleteTarget(null);
            setSuccessMessage(`Sesi tanggal ${deleteTarget.session_date.substring(0, 10)} berhasil dihapus.`);
            fetchSessions();
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            console.error("Delete session error:", err);
            alert(err.response?.data?.message || "Gagal menghapus sesi absensi");
        }
    };

    const handleQuickInitToday = async () => {
        try {
            setLoading(true);
            const res = await api.post("/sessions/quick-today");
            setSuccessMessage(res.data.message);
            fetchSessions();
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            console.error("Quick init today error:", err);
            alert(err.response?.data?.message || "Gagal membuat sesi hari ini");
        } finally {
            setLoading(false);
        }
    };

    const todayDateFormatted = useMemo(() => {
        return new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }, []);

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Pengaturan Sesi Absensi & Lokasi</h1>
                    <p style={styles.subtitle}>
                        Kelola jam operasional check-in / check-out, koordinat GPS kantor, dan batas radius geofencing.
                    </p>
                </div>
                <div style={styles.headerBtnGroup}>
                    {!todaySession && (
                        <button onClick={handleQuickInitToday} style={styles.quickInitBtn}>
                            ⚡ Aktifkan Sesi Hari Ini
                        </button>
                    )}
                    <button onClick={handleOpenAdd} style={styles.addBtn}>
                        ➕ Buat Sesi Baru
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {successMessage && (
                <div style={styles.successAlert}>
                    <span>✅ {successMessage}</span>
                </div>
            )}
            {error && (
                <div style={styles.errorAlert}>
                    <span>⚠️ {error}</span>
                </div>
            )}

            {/* Today Session Status Banner */}
            <div style={styles.todayBanner}>
                <div style={styles.todayHeader}>
                    <div style={styles.todayTitleGroup}>
                        <span style={styles.todayIcon}>📍</span>
                        <div>
                            <h3 style={styles.todayTitle}>Sesi Presensi Hari Ini: {todayDateFormatted}</h3>
                            <span style={styles.todaySub}>
                                Status sistem presensi langsung untuk tanggal {todayDateString}
                            </span>
                        </div>
                    </div>
                    {todaySession ? (
                        <div style={styles.todayActions}>
                            <button
                                onClick={() => handleToggleStatus(todaySession)}
                                style={todaySession.status === "active" ? styles.activeStatusBtn : styles.closedStatusBtn}
                            >
                                {todaySession.status === "active" ? "🟢 Sesi Aktif (Buka)" : "🔴 Sesi Ditutup"}
                            </button>
                            <button onClick={() => handleOpenEdit(todaySession)} style={styles.secondaryBtn}>
                                ✏️ Edit Sesi Hari Ini
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleQuickInitToday} style={styles.quickInitBtn}>
                            ⚡ Buka Sesi Hari Ini
                        </button>
                    )}
                </div>

                {todaySession ? (
                    <div style={styles.todayDetailsGrid}>
                        <div style={styles.todayDetailCard}>
                            <span style={styles.todayDetailLabel}>Jam Check-In Masuk</span>
                            <div style={styles.todayDetailVal}>
                                {todaySession.check_in_start?.substring(0, 5)} - {todaySession.check_in_end?.substring(0, 5)}
                            </div>
                            <small style={styles.todayDetailDesc}>Rentang waktu kedatangan magang</small>
                        </div>

                        <div style={styles.todayDetailCard}>
                            <span style={styles.todayDetailLabel}>Jam Check-Out Pulang</span>
                            <div style={styles.todayDetailVal}>
                                {todaySession.check_out_start?.substring(0, 5)} - {todaySession.check_out_end?.substring(0, 5)}
                            </div>
                            <small style={styles.todayDetailDesc}>Rentang waktu kepulangan magang</small>
                        </div>

                        <div style={styles.todayDetailCard}>
                            <span style={styles.todayDetailLabel}>Koordinat Kantor (GPS)</span>
                            <div style={styles.todayDetailVal}>
                                {todaySession.latitude}, {todaySession.longitude}
                            </div>
                            <a
                                href={`https://www.google.com/maps?q=${todaySession.latitude},${todaySession.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                style={styles.mapLink}
                            >
                                🗺️ Buka di Google Maps ↗
                            </a>
                        </div>

                        <div style={styles.todayDetailCard}>
                            <span style={styles.todayDetailLabel}>Radius Geofencing</span>
                            <div style={styles.todayDetailVal}>{todaySession.radius_meter} Meter</div>
                            <small style={styles.todayDetailDesc}>Batas jarak toleransi dari titik kantor</small>
                        </div>
                    </div>
                ) : (
                    <div style={styles.noSessionNotice}>
                        <p style={{ margin: 0 }}>
                            ⚠️ <strong>Pemberitahuan:</strong> Sesi absensi untuk hari ini belum dibuat. Peserta tidak akan bisa melakukan scan QR Code sebelum sesi dibuat atau diaktifkan. Klik tombol <strong>"⚡ Aktifkan Sesi Hari Ini"</strong> untuk membuka sesi dengan parameter default kantor.
                        </p>
                    </div>
                )}
            </div>

            {/* Session History Table Card */}
            <div style={styles.tableCard}>
                <div style={styles.tableCardHeader}>
                    <h3 style={styles.tableCardTitle}>Daftar Semua Sesi Presensi</h3>
                    <span style={styles.tableCardCount}>{sessions.length} sesi terdaftar</span>
                </div>

                {loading ? (
                    <div style={styles.loadingContainer}>
                        <p>Memuat data sesi absensi...</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <div style={styles.emptyContainer}>
                        <p>Belum ada sesi absensi yang dibuat.</p>
                        <button onClick={handleOpenAdd} style={styles.addBtn}>
                            Buat Sesi Pertama
                        </button>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Tanggal Sesi</th>
                                    <th style={styles.th}>Jam Masuk</th>
                                    <th style={styles.th}>Jam Pulang</th>
                                    <th style={styles.th}>Koordinat Kantor</th>
                                    <th style={styles.th}>Radius</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={{ ...styles.th, textAlign: "right" }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((s) => {
                                    const isToday = s.session_date?.substring(0, 10) === todayDateString;
                                    return (
                                        <tr key={s.id} style={{ ...styles.tr, ...(isToday ? styles.todayRow : {}) }}>
                                            <td style={styles.td}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <strong>{s.session_date?.substring(0, 10)}</strong>
                                                    {isToday && <span style={styles.todayBadge}>HARI INI</span>}
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.timeTag}>
                                                    {s.check_in_start?.substring(0, 5)} - {s.check_in_end?.substring(0, 5)}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.timeTag}>
                                                    {s.check_out_start?.substring(0, 5)} - {s.check_out_end?.substring(0, 5)}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.gpsText}>
                                                    {s.latitude}, {s.longitude}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.radiusBadge}>{s.radius_meter} m</span>
                                            </td>
                                            <td style={styles.td}>
                                                <button
                                                    onClick={() => handleToggleStatus(s)}
                                                    style={s.status === "active" ? styles.activeStatusBtn : styles.closedStatusBtn}
                                                    title="Klik untuk beralih status"
                                                >
                                                    {s.status === "active" ? "🟢 Aktif" : "🔴 Ditutup"}
                                                </button>
                                            </td>
                                            <td style={{ ...styles.td, textAlign: "right" }}>
                                                <div style={styles.actionButtonGroup}>
                                                    <button
                                                        onClick={() => handleOpenEdit(s)}
                                                        style={styles.editActionBtn}
                                                        title="Edit Sesi"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(s)}
                                                        style={styles.deleteActionBtn}
                                                        title="Hapus Sesi"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal: Tambah / Edit Sesi */}
            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>
                                {editingId ? "Edit Sesi Presensi" : "Buat Sesi Presensi Baru"}
                            </h2>
                            <button onClick={resetForm} style={styles.modalCloseBtn}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} style={styles.modalForm}>
                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Tanggal Sesi *</label>
                                    <input
                                        type="date"
                                        name="session_date"
                                        value={formData.session_date}
                                        onChange={handleFormChange}
                                        style={styles.formInput}
                                        required
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Status Sesi</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleFormChange}
                                        style={styles.formSelect}
                                    >
                                        <option value="active">🟢 Aktif (Peserta dapat absen)</option>
                                        <option value="closed">🔴 Ditutup</option>
                                    </select>
                                </div>
                            </div>

                            {/* Waktu Presensi */}
                            <div style={styles.formSectionHeader}>
                                ⏰ Jadwal Waktu Presensi
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Jam Buka Masuk (Check-In) *</label>
                                    <input
                                        type="time"
                                        name="check_in_start"
                                        value={formData.check_in_start}
                                        onChange={handleFormChange}
                                        style={styles.formInput}
                                        required
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Batas Akhir Masuk (Tutup Check-In) *</label>
                                    <input
                                        type="time"
                                        name="check_in_end"
                                        value={formData.check_in_end}
                                        onChange={handleFormChange}
                                        style={styles.formInput}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Jam Buka Pulang (Check-Out) *</label>
                                    <input
                                        type="time"
                                        name="check_out_start"
                                        value={formData.check_out_start}
                                        onChange={handleFormChange}
                                        style={styles.formInput}
                                        required
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Batas Akhir Pulang (Tutup Check-Out) *</label>
                                    <input
                                        type="time"
                                        name="check_out_end"
                                        value={formData.check_out_end}
                                        onChange={handleFormChange}
                                        style={styles.formInput}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Lokasi & Radius */}
                            <div style={styles.formSectionHeaderWithAction}>
                                <span>📍 Lokasi Kantor & Geofencing GPS</span>
                                <button
                                    type="button"
                                    onClick={handleGetGpsCurrentPosition}
                                    disabled={detectingGps}
                                    style={styles.gpsDetectBtn}
                                >
                                    {detectingGps ? "Mendeteksi..." : "📍 Ambil Lokasi Saya Sekarang"}
                                </button>
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Latitude Kantor *</label>
                                    <input
                                        type="number"
                                        step="any"
                                        name="latitude"
                                        placeholder="Contoh: -6.200000"
                                        value={formData.latitude}
                                        onChange={handleFormChange}
                                        style={styles.formInput}
                                        required
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Longitude Kantor *</label>
                                    <input
                                        type="number"
                                        step="any"
                                        name="longitude"
                                        placeholder="Contoh: 106.816666"
                                        value={formData.longitude}
                                        onChange={handleFormChange}
                                        style={styles.formInput}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>Radius Toleransi Presensi (Meter) *</label>
                                <input
                                    type="number"
                                    name="radius_meter"
                                    placeholder="Contoh: 150"
                                    value={formData.radius_meter}
                                    onChange={handleFormChange}
                                    style={styles.formInput}
                                    required
                                    min="10"
                                    max="5000"
                                />
                                <small style={{ color: "#94a3b8", fontSize: "11px" }}>
                                    Peserta harus berada dalam radius {formData.radius_meter} meter dari titik koordinat kantor di atas.
                                </small>
                            </div>

                            <div style={styles.modalFooter}>
                                <button type="button" onClick={resetForm} style={styles.cancelBtn}>
                                    Batal
                                </button>
                                <button type="submit" disabled={submitting} style={styles.submitBtn}>
                                    {submitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Buat Sesi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Konfirmasi Hapus */}
            {deleteTarget && (
                <div style={styles.modalOverlay}>
                    <div style={styles.deleteModalContent}>
                        <div style={{ fontSize: "36px", marginBottom: "8px" }}>⚠️</div>
                        <h3 style={styles.modalTitle}>Hapus Sesi Absensi?</h3>
                        <p style={styles.deleteModalDesc}>
                            Apakah Anda yakin ingin menghapus sesi tanggal{" "}
                            <strong>{deleteTarget.session_date?.substring(0, 10)}</strong>? Data absensi peserta pada tanggal tersebut mungkin akan kehilangan referensi sesi.
                        </p>
                        <div style={styles.modalFooter}>
                            <button onClick={() => setDeleteTarget(null)} style={styles.cancelBtn}>
                                Batal
                            </button>
                            <button onClick={handleDelete} style={styles.dangerBtn}>
                                Ya, Hapus Sesi
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
        gap: "12px",
        flexWrap: "wrap"
    },
    addBtn: {
        padding: "10px 18px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(37, 99, 235, 0.4)"
    },
    quickInitBtn: {
        padding: "10px 16px",
        borderRadius: "8px",
        border: "1px solid #10b981",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        color: "#34d399",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer"
    },
    successAlert: {
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        color: "#34d399",
        padding: "12px 16px",
        borderRadius: "8px",
        marginBottom: "20px",
        fontSize: "14px"
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
    todayBanner: {
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "14px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
    },
    todayHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "20px",
        borderBottom: "1px solid #334155",
        paddingBottom: "16px"
    },
    todayTitleGroup: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },
    todayIcon: {
        fontSize: "28px"
    },
    todayTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#f8fafc",
        margin: "0 0 4px 0"
    },
    todaySub: {
        fontSize: "12px",
        color: "#94a3b8"
    },
    todayActions: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },
    activeStatusBtn: {
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        color: "#34d399",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        borderRadius: "8px",
        padding: "8px 14px",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer"
    },
    closedStatusBtn: {
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        color: "#f87171",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "8px",
        padding: "8px 14px",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer"
    },
    secondaryBtn: {
        backgroundColor: "#334155",
        color: "#f8fafc",
        border: "1px solid #475569",
        borderRadius: "8px",
        padding: "8px 14px",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer"
    },
    todayDetailsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px"
    },
    todayDetailCard: {
        backgroundColor: "#0f172a",
        border: "1px solid #334155",
        borderRadius: "10px",
        padding: "16px"
    },
    todayDetailLabel: {
        fontSize: "11px",
        textTransform: "uppercase",
        color: "#94a3b8",
        fontWeight: "600",
        display: "block",
        marginBottom: "6px"
    },
    todayDetailVal: {
        fontSize: "17px",
        fontWeight: "700",
        color: "#f8fafc",
        marginBottom: "4px"
    },
    todayDetailDesc: {
        fontSize: "11px",
        color: "#64748b"
    },
    mapLink: {
        fontSize: "11px",
        color: "#3b82f6",
        textDecoration: "none",
        fontWeight: "600"
    },
    noSessionNotice: {
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        color: "#fbbf24",
        padding: "14px 18px",
        borderRadius: "8px",
        fontSize: "13px",
        lineHeight: "1.5"
    },
    tableCard: {
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "14px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        overflow: "hidden"
    },
    tableCardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 24px",
        borderBottom: "1px solid #334155"
    },
    tableCardTitle: {
        fontSize: "17px",
        fontWeight: "700",
        color: "#f8fafc",
        margin: 0
    },
    tableCardCount: {
        fontSize: "12px",
        color: "#94a3b8"
    },
    loadingContainer: {
        padding: "48px 16px",
        textAlign: "center",
        color: "#94a3b8"
    },
    emptyContainer: {
        padding: "48px 16px",
        textAlign: "center",
        color: "#94a3b8"
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        textAlign: "left"
    },
    th: {
        padding: "12px 18px",
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
    todayRow: {
        backgroundColor: "rgba(59, 130, 246, 0.05)"
    },
    td: {
        padding: "14px 18px",
        fontSize: "13px",
        color: "#f1f5f9",
        verticalAlign: "middle"
    },
    todayBadge: {
        fontSize: "10px",
        fontWeight: "700",
        padding: "2px 6px",
        borderRadius: "4px",
        backgroundColor: "#2563eb",
        color: "#ffffff"
    },
    timeTag: {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#cbd5e1"
    },
    gpsText: {
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#94a3b8"
    },
    radiusBadge: {
        fontSize: "11px",
        fontWeight: "600",
        padding: "2px 8px",
        borderRadius: "12px",
        backgroundColor: "#334155",
        color: "#e2e8f0"
    },
    actionButtonGroup: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "6px"
    },
    editActionBtn: {
        backgroundColor: "#334155",
        color: "#f8fafc",
        border: "1px solid #475569",
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "12px",
        cursor: "pointer"
    },
    deleteActionBtn: {
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        color: "#ef4444",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        padding: "6px 10px",
        borderRadius: "6px",
        fontSize: "12px",
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
    modalContent: {
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "620px",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "28px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
    },
    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        borderBottom: "1px solid #334155",
        paddingBottom: "12px"
    },
    modalTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#f8fafc",
        margin: 0
    },
    modalCloseBtn: {
        background: "none",
        border: "none",
        color: "#94a3b8",
        fontSize: "18px",
        cursor: "pointer"
    },
    modalForm: {
        display: "flex",
        flexDirection: "column",
        gap: "16px"
    },
    formRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px"
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        textAlign: "left"
    },
    formLabel: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#cbd5e1"
    },
    formInput: {
        backgroundColor: "#0f172a",
        border: "1px solid #334155",
        borderRadius: "8px",
        padding: "10px 12px",
        color: "#f8fafc",
        fontSize: "13px",
        outline: "none"
    },
    formSelect: {
        backgroundColor: "#0f172a",
        border: "1px solid #334155",
        borderRadius: "8px",
        padding: "10px 12px",
        color: "#f8fafc",
        fontSize: "13px",
        outline: "none",
        cursor: "pointer"
    },
    formSectionHeader: {
        fontSize: "13px",
        fontWeight: "700",
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginTop: "8px",
        borderBottom: "1px solid #334155",
        paddingBottom: "6px"
    },
    formSectionHeaderWithAction: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "13px",
        fontWeight: "700",
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginTop: "8px",
        borderBottom: "1px solid #334155",
        paddingBottom: "6px"
    },
    gpsDetectBtn: {
        backgroundColor: "#10b981",
        color: "#ffffff",
        border: "none",
        padding: "4px 10px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: "600",
        cursor: "pointer"
    },
    modalFooter: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        marginTop: "16px",
        borderTop: "1px solid #334155",
        paddingTop: "16px"
    },
    cancelBtn: {
        backgroundColor: "#334155",
        color: "#cbd5e1",
        border: "none",
        padding: "10px 16px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer"
    },
    submitBtn: {
        backgroundColor: "#2563eb",
        color: "#ffffff",
        border: "none",
        padding: "10px 20px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer"
    },
    deleteModalContent: {
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "420px",
        padding: "28px",
        textAlign: "center"
    },
    deleteModalDesc: {
        fontSize: "13px",
        color: "#94a3b8",
        margin: "12px 0 20px 0",
        lineHeight: "1.5"
    },
    dangerBtn: {
        backgroundColor: "#ef4444",
        color: "#ffffff",
        border: "none",
        padding: "10px 18px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer"
    }
};

export default Sessions;
