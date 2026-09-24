import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import ParticipantQRCode from "../components/ParticipantQRCode";

function Participants() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Filter & Search states
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    // Modal states
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [qrParticipant, setQrParticipant] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Form inputs state
    const initialForm = {
        full_name: "",
        identity_number: "",
        institution: "",
        participant_type: "mahasiswa",
        phone: "",
        status: "active",
        start_date: "",
        end_date: ""
    };
    const [formData, setFormData] = useState(initialForm);

    const fetchParticipants = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get("/participants");
            setParticipants(response.data.data || []);
        } catch (err) {
            console.error("Fetch participants error:", err);
            setError(err.response?.data?.message || "Gagal mengambil data peserta");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData(initialForm);
        setEditingId(null);
        setShowFormModal(false);
    };

    useEffect(() => {
        fetchParticipants();
    }, []);

    // Check query params (?action=add)
    useEffect(() => {
        if (searchParams.get("action") === "add") {
            resetForm();
            setShowFormModal(true);
            // Bersihkan query param agar tidak membuka ulang saat reload
            searchParams.delete("action");
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const handleOpenAdd = () => {
        resetForm();
        setShowFormModal(true);
    };

    const handleOpenEdit = (p) => {
        setEditingId(p.id);
        setFormData({
            full_name: p.full_name || "",
            identity_number: p.identity_number || "",
            institution: p.institution || "",
            participant_type: p.participant_type || "mahasiswa",
            phone: p.phone || "",
            status: p.status || "active",
            start_date: p.start_date ? p.start_date.substring(0, 10) : "",
            end_date: p.end_date ? p.end_date.substring(0, 10) : ""
        });
        setShowFormModal(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setSubmitting(true);

        try {
            if (editingId) {
                await api.put(`/participants/${editingId}`, formData);
                setSuccessMessage("Data peserta berhasil diperbarui.");
            } else {
                await api.post("/participants", formData);
                setSuccessMessage("Peserta baru berhasil ditambahkan beserta QR Token.");
            }

            resetForm();
            fetchParticipants();

            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            console.error("Save participant error:", err);
            alert(err.response?.data?.message || "Gagal menyimpan data peserta");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (participant) => {
        const confirmMsg =
            participant.status === "active"
                ? `Nonaktifkan peserta ${participant.full_name}? Peserta tidak akan bisa melakukan scan absensi.`
                : `Aktifkan kembali peserta ${participant.full_name}?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            if (participant.status === "active") {
                await api.patch(`/participants/${participant.id}/deactivate`);
            } else {
                await api.put(`/participants/${participant.id}`, {
                    ...participant,
                    status: "active"
                });
            }
            fetchParticipants();
        } catch (err) {
            console.error("Toggle status error:", err);
            alert(err.response?.data?.message || "Gagal mengubah status peserta");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            await api.delete(`/participants/${deleteTarget.id}`);
            setDeleteTarget(null);
            setSuccessMessage(`Peserta ${deleteTarget.full_name} berhasil dihapus.`);
            fetchParticipants();
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            console.error("Delete participant error:", err);
            alert(err.response?.data?.message || "Gagal menghapus data peserta");
        }
    };

    const handleShowQR = async (participant) => {
        try {
            // Ambil data detail terkini dari server
            const response = await api.get(`/participants/${participant.id}`);
            setQrParticipant(response.data.data);
        } catch (err) {
            console.error("Fetch QR error:", err);
            setQrParticipant(participant);
        }
    };

    // Filter logic
    const filteredParticipants = useMemo(() => {
        return participants.filter((p) => {
            const matchesSearch =
                p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.identity_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.institution.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType = filterType === "all" || p.participant_type === filterType;
            const matchesStatus = filterStatus === "all" || p.status === filterStatus;

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [participants, searchTerm, filterType, filterStatus]);

    const stats = useMemo(() => {
        const total = participants.length;
        const active = participants.filter((p) => p.status === "active").length;
        const mhs = participants.filter((p) => p.participant_type === "mahasiswa").length;
        const smk = participants.filter((p) => p.participant_type === "smk").length;
        const sma = participants.filter((p) => p.participant_type === "sma").length;
        return { total, active, mhs, smk, sma };
    }, [participants]);

    return (
        <div style={styles.container}>
            {/* Top Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Manajemen Data Peserta</h1>
                    <p style={styles.subtitle}>
                        Kelola informasi peserta magang, token QR Code presensi, dan status keaktifan.
                    </p>
                </div>
                <button onClick={handleOpenAdd} style={styles.addBtn}>
                    ➕ Tambah Peserta Baru
                </button>
            </div>

            {/* Quick Stat Badges */}
            <div style={styles.statsBar}>
                <div style={styles.statChip}>
                    <span style={styles.statChipLabel}>Total Peserta:</span>
                    <strong style={styles.statChipValue}>{stats.total}</strong>
                </div>
                <div style={styles.statChip}>
                    <span style={styles.statChipLabel}>Aktif:</span>
                    <strong style={{ ...styles.statChipValue, color: "#34d399" }}>{stats.active}</strong>
                </div>
                <div style={styles.statChip}>
                    <span style={styles.statChipLabel}>Mahasiswa:</span>
                    <strong style={{ ...styles.statChipValue, color: "#60a5fa" }}>{stats.mhs}</strong>
                </div>
                <div style={styles.statChip}>
                    <span style={styles.statChipLabel}>SMK:</span>
                    <strong style={{ ...styles.statChipValue, color: "#a78bfa" }}>{stats.smk}</strong>
                </div>
                <div style={styles.statChip}>
                    <span style={styles.statChipLabel}>SMA:</span>
                    <strong style={{ ...styles.statChipValue, color: "#fbbf24" }}>{stats.sma}</strong>
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

            {/* Search and Filters Toolbar */}
            <div style={styles.toolbar}>
                <div style={styles.searchBox}>
                    <span style={{ fontSize: "16px" }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Cari berdasarkan nama, NIM, atau institusi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm("")} style={styles.clearSearchBtn}>
                            ✕
                        </button>
                    )}
                </div>

                <div style={styles.filterGroup}>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={styles.selectFilter}
                    >
                        <option value="all">Semua Jenjang</option>
                        <option value="mahasiswa">Mahasiswa</option>
                        <option value="smk">SMK</option>
                        <option value="sma">SMA</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={styles.selectFilter}
                    >
                        <option value="all">Semua Status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Tidak Aktif</option>
                    </select>

                    {(searchTerm || filterType !== "all" || filterStatus !== "all") && (
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setFilterType("all");
                                setFilterStatus("all");
                            }}
                            style={styles.resetFilterBtn}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Participants Data Table */}
            <div style={styles.tableCard}>
                {loading ? (
                    <div style={styles.loadingContainer}>
                        <p>Memuat data peserta magang...</p>
                    </div>
                ) : filteredParticipants.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={{ fontSize: "40px", marginBottom: "12px" }}>👥</div>
                        <h3 style={styles.emptyTitle}>
                            {participants.length === 0
                                ? "Belum Ada Peserta Terdaftar"
                                : "Tidak Ada Peserta yang Sesuai Filter"}
                        </h3>
                        <p style={styles.emptyDesc}>
                            {participants.length === 0
                                ? "Klik tombol di bawah untuk mendaftarkan peserta magang pertama."
                                : "Coba ubah kata kunci pencarian atau reset filter untuk melihat data lainnya."}
                        </p>
                        {participants.length === 0 ? (
                            <button onClick={handleOpenAdd} style={styles.addBtn}>
                                ➕ Tambah Peserta Sekarang
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilterType("all");
                                    setFilterStatus("all");
                                }}
                                style={styles.secondaryBtn}
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Peserta</th>
                                    <th style={styles.th}>Institusi / Sekolah</th>
                                    <th style={styles.th}>Tipe</th>
                                    <th style={styles.th}>Kontak</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Periode</th>
                                    <th style={{ ...styles.th, textAlign: "right" }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredParticipants.map((p) => (
                                    <tr key={p.id} style={styles.tr}>
                                        {/* Peserta Info */}
                                        <td style={styles.td}>
                                            <div style={styles.userProfileCell}>
                                                <div style={styles.userAvatar}>
                                                    {p.full_name?.charAt(0)?.toUpperCase() || "P"}
                                                </div>
                                                <div>
                                                    <div style={styles.userName}>{p.full_name}</div>
                                                    <div style={styles.userIdentity}>
                                                        NIM/ID: <strong>{p.identity_number}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Institusi */}
                                        <td style={styles.td}>
                                            <span style={styles.institutionText}>{p.institution}</span>
                                        </td>

                                        {/* Tipe Badge */}
                                        <td style={styles.td}>
                                            <span
                                                style={{
                                                    ...styles.typeBadge,
                                                    ...(p.participant_type === "mahasiswa"
                                                        ? styles.badgeMhs
                                                        : p.participant_type === "smk"
                                                        ? styles.badgeSmk
                                                        : styles.badgeSma)
                                                }}
                                            >
                                                {p.participant_type?.toUpperCase()}
                                            </span>
                                        </td>

                                        {/* Phone */}
                                        <td style={styles.td}>
                                            <span style={styles.phoneText}>
                                                {p.phone ? `📞 ${p.phone}` : "-"}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td style={styles.td}>
                                            <button
                                                onClick={() => handleToggleStatus(p)}
                                                style={
                                                    p.status === "active"
                                                        ? styles.statusActiveBtn
                                                        : styles.statusInactiveBtn
                                                }
                                                title="Klik untuk mengubah status"
                                            >
                                                {p.status === "active" ? "🟢 Aktif" : "⚪ Nonaktif"}
                                            </button>
                                        </td>

                                        {/* Periode */}
                                        <td style={styles.td}>
                                            <div style={styles.periodText}>
                                                {p.start_date ? p.start_date.substring(0, 10) : "-"}
                                                <br />
                                                <small style={{ color: "#94a3b8" }}>s/d</small>{" "}
                                                {p.end_date ? p.end_date.substring(0, 10) : "-"}
                                            </div>
                                        </td>

                                        {/* Aksi Buttons */}
                                        <td style={{ ...styles.td, textAlign: "right" }}>
                                            <div style={styles.actionButtonGroup}>
                                                <button
                                                    onClick={() => handleShowQR(p)}
                                                    style={styles.qrActionBtn}
                                                    title="Lihat / Cetak QR Code"
                                                >
                                                    🪪 QR
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(p)}
                                                    style={styles.editActionBtn}
                                                    title="Edit Data Peserta"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(p)}
                                                    style={styles.deleteActionBtn}
                                                    title="Hapus Peserta"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal: Tambah / Edit Peserta */}
            {showFormModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>
                                {editingId ? "Edit Data Peserta" : "Tambah Peserta Baru"}
                            </h2>
                            <button onClick={resetForm} style={styles.modalCloseBtn}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} style={styles.modalForm}>
                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Nama Lengkap *</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        placeholder="Contoh: Budi Santoso"
                                        value={formData.full_name}
                                        onChange={handleFormChange}
                                        style={styles.formInput}
                                        required
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Nomor Identitas (NIM/NISN) *</label>
                                    <input
                                        type="text"
                                        name="identity_number"
                                        placeholder="Contoh: 210101001"
                                        value={formData.identity_number}
                                        onChange={handleFormChange}
                                        style={styles.formInput}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Institusi / Asal Kampus/Sekolah *</label>
                                    <input
                                        type="text"
                                        name="institution"
                                        placeholder="Contoh: Universitas Indonesia / SMKN 1"
                                        value={formData.institution}
                                        onChange={handleFormChange}
                                        style={styles.formInput}
                                        required
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Jenjang Peserta *</label>
                                    <select
                                        name="participant_type"
                                        value={formData.participant_type}
                                        onChange={handleFormChange}
                                        style={styles.formSelect}
                                    >
                                        <option value="mahasiswa">Mahasiswa</option>
                                        <option value="smk">SMK</option>
                                        <option value="sma">SMA</option>
                                    </select>
                                </div>
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Nomor WhatsApp / HP</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        placeholder="Contoh: 08123456789"
                                        value={formData.phone}
                                        onChange={handleFormChange}
                                        style={styles.formInput}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Status Keaktifan</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleFormChange}
                                        style={styles.formSelect}
                                    >
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Tidak Aktif</option>
                                    </select>
                                </div>
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Tanggal Mulai Magang</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleFormChange}
                                        style={styles.formInput}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Tanggal Selesai Magang</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleFormChange}
                                        style={styles.formInput}
                                    />
                                </div>
                            </div>

                            <div style={styles.modalFooter}>
                                <button type="button" onClick={resetForm} style={styles.cancelBtn}>
                                    Batal
                                </button>
                                <button type="submit" disabled={submitting} style={styles.submitBtn}>
                                    {submitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Peserta"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: QR Code Preview */}
            {qrParticipant && (
                <div style={styles.modalOverlay}>
                    <div style={styles.qrModalContent}>
                        <ParticipantQRCode
                            participant={qrParticipant}
                            onClose={() => setQrParticipant(null)}
                        />
                    </div>
                </div>
            )}

            {/* Modal: Konfirmasi Hapus */}
            {deleteTarget && (
                <div style={styles.modalOverlay}>
                    <div style={styles.deleteModalContent}>
                        <div style={{ fontSize: "36px", marginBottom: "8px" }}>⚠️</div>
                        <h3 style={styles.modalTitle}>Hapus Data Peserta?</h3>
                        <p style={styles.deleteModalDesc}>
                            Apakah Anda yakin ingin menghapus peserta <strong>{deleteTarget.full_name}</strong>? Tindakan ini juga akan menghapus seluruh data riwayat presensi yang terhubung.
                        </p>
                        <div style={styles.modalFooter}>
                            <button onClick={() => setDeleteTarget(null)} style={styles.cancelBtn}>
                                Batal
                            </button>
                            <button onClick={handleDelete} style={styles.dangerBtn}>
                                Ya, Hapus Peserta
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
    addBtn: {
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
    statsBar: {
        display: "flex",
        gap: "12px",
        marginBottom: "20px",
        flexWrap: "wrap"
    },
    statChip: {
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        padding: "8px 14px",
        borderRadius: "8px",
        fontSize: "13px",
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    statChipLabel: {
        color: "#94a3b8"
    },
    statChipValue: {
        color: "#f8fafc",
        fontWeight: "700"
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
    toolbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        padding: "14px 18px",
        borderRadius: "10px",
        marginBottom: "20px",
        flexWrap: "wrap"
    },
    searchBox: {
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
    filterGroup: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap"
    },
    selectFilter: {
        backgroundColor: "#0f172a",
        border: "1px solid #334155",
        color: "#f8fafc",
        padding: "8px 12px",
        borderRadius: "8px",
        fontSize: "13px",
        outline: "none",
        cursor: "pointer"
    },
    resetFilterBtn: {
        backgroundColor: "#334155",
        border: "none",
        color: "#cbd5e1",
        padding: "8px 12px",
        borderRadius: "8px",
        fontSize: "13px",
        cursor: "pointer"
    },
    tableCard: {
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "14px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        overflow: "hidden"
    },
    loadingContainer: {
        padding: "48px 16px",
        textAlign: "center",
        color: "#94a3b8"
    },
    emptyState: {
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
        maxWidth: "400px",
        margin: "0 auto 16px auto",
        lineHeight: "1.5"
    },
    secondaryBtn: {
        backgroundColor: "#334155",
        border: "none",
        color: "#f8fafc",
        padding: "9px 16px",
        borderRadius: "8px",
        fontSize: "13px",
        cursor: "pointer"
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
        borderBottom: "1px solid #334155",
        transition: "background-color 0.15s"
    },
    td: {
        padding: "14px 16px",
        fontSize: "13px",
        color: "#f1f5f9",
        verticalAlign: "middle"
    },
    userProfileCell: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },
    userAvatar: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
        fontSize: "14px",
        flexShrink: 0
    },
    userName: {
        fontWeight: "600",
        color: "#f8fafc",
        fontSize: "14px"
    },
    userIdentity: {
        fontSize: "11px",
        color: "#94a3b8"
    },
    institutionText: {
        color: "#cbd5e1",
        fontWeight: "500"
    },
    typeBadge: {
        fontSize: "11px",
        fontWeight: "600",
        padding: "3px 8px",
        borderRadius: "4px"
    },
    badgeMhs: {
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        color: "#60a5fa"
    },
    badgeSmk: {
        backgroundColor: "rgba(168, 85, 247, 0.15)",
        color: "#c084fc"
    },
    badgeSma: {
        backgroundColor: "rgba(245, 158, 11, 0.15)",
        color: "#fbbf24"
    },
    phoneText: {
        color: "#94a3b8",
        fontSize: "12px"
    },
    statusActiveBtn: {
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        color: "#34d399",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        borderRadius: "12px",
        padding: "4px 10px",
        fontSize: "11px",
        fontWeight: "600",
        cursor: "pointer"
    },
    statusInactiveBtn: {
        backgroundColor: "rgba(148, 163, 184, 0.1)",
        color: "#94a3b8",
        border: "1px solid rgba(148, 163, 184, 0.3)",
        borderRadius: "12px",
        padding: "4px 10px",
        fontSize: "11px",
        fontWeight: "600",
        cursor: "pointer"
    },
    periodText: {
        fontSize: "11px",
        color: "#cbd5e1",
        fontFamily: "monospace"
    },
    actionButtonGroup: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "6px"
    },
    qrActionBtn: {
        backgroundColor: "#3b82f6",
        color: "#ffffff",
        border: "none",
        padding: "6px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer"
    },
    editActionBtn: {
        backgroundColor: "#334155",
        color: "#f8fafc",
        border: "1px solid #475569",
        padding: "6px 10px",
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
        backgroundColor: "rgba(0, 0, 0, 0.7)",
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
        maxWidth: "600px",
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
    qrModalContent: {
        backgroundColor: "transparent",
        maxWidth: "420px",
        width: "100%"
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

export default Participants;