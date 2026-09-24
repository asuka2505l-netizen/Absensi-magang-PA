import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Jika sudah punya token, langsung arahkan ke attendance
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            navigate("/dashboard", { replace: true });
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        if (!username.trim() || !password.trim()) {
            setError("Username dan password wajib diisi");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                username: username.trim(),
                password: password.trim()
            });

            const { token, admin } = response.data.data;

            // Simpan token dan data admin ke localStorage
            localStorage.setItem("token", token);
            localStorage.setItem("admin", JSON.stringify(admin));

            navigate("/dashboard", { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Login gagal. Periksa username dan password Anda."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.iconWrapper}>🔐</div>
                    <h1 style={styles.title}>Login Administrator</h1>
                    <p style={styles.subtitle}>
                        Sistem Manajemen Presensi & Magang
                    </p>
                </div>

                {error && (
                    <div style={styles.errorBox}>
                        <span>⚠️ {error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Username</label>
                        <input
                            type="text"
                            placeholder="Masukkan username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={styles.input}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            placeholder="Masukkan password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.button,
                            ...(loading ? styles.buttonDisabled : {})
                        }}
                    >
                        {loading ? "Memproses Autentikasi..." : "Masuk"}
                    </button>
                </form>

                <div style={styles.footer}>
                    <small>Default Akun: admin / admin123</small>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        padding: "16px",
        boxSizing: "border-box"
    },
    card: {
        width: "100%",
        maxWidth: "420px",
        backgroundColor: "#1e293b",
        borderRadius: "16px",
        padding: "36px 32px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
        border: "1px solid #334155",
        boxSizing: "border-box"
    },
    header: {
        textAlign: "center",
        marginBottom: "28px"
    },
    iconWrapper: {
        fontSize: "40px",
        marginBottom: "8px"
    },
    title: {
        fontSize: "22px",
        fontWeight: "700",
        color: "#f8fafc",
        margin: "0 0 6px 0"
    },
    subtitle: {
        fontSize: "13px",
        color: "#94a3b8",
        margin: 0
    },
    errorBox: {
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        border: "1px solid rgba(239, 68, 68, 0.4)",
        color: "#fca5a5",
        padding: "12px 14px",
        borderRadius: "8px",
        fontSize: "13px",
        marginBottom: "20px",
        textAlign: "left"
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "18px"
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        textAlign: "left"
    },
    label: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#cbd5e1"
    },
    input: {
        padding: "12px 14px",
        borderRadius: "8px",
        border: "1px solid #475569",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        fontSize: "14px",
        outline: "none",
        transition: "border-color 0.2s"
    },
    button: {
        marginTop: "8px",
        padding: "12px 16px",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "background-color 0.2s, opacity 0.2s"
    },
    buttonDisabled: {
        backgroundColor: "#1d4ed8",
        opacity: 0.7,
        cursor: "not-allowed"
    },
    footer: {
        marginTop: "24px",
        textAlign: "center",
        color: "#64748b",
        fontSize: "12px"
    }
};

export default Login;