import { Link, useNavigate, useLocation } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    // Ambil data admin dari localStorage
    let admin = null;
    try {
        const adminData = localStorage.getItem("admin");
        if (adminData) {
            admin = JSON.parse(adminData);
        }
    } catch {
        admin = null;
    }

    const handleLogout = () => {
        if (window.confirm("Apakah Anda yakin ingin logout?")) {
            localStorage.removeItem("token");
            localStorage.removeItem("admin");
            navigate("/login");
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <header style={styles.header}>
            <div style={styles.brandContainer}>
                <div style={styles.brandLogo}>📋</div>
                <div style={styles.brandText}>
                    <h2 style={styles.brandTitle}>Sistem Absensi Magang</h2>
                    <span style={styles.brandSubtitle}>Admin Panel</span>
                </div>
            </div>

            <nav style={styles.navLinks}>
                <Link
                    to="/dashboard"
                    style={{
                        ...styles.navLink,
                        ...(isActive("/dashboard") ? styles.activeNavLink : {})
                    }}
                >
                    📈 Dashboard
                </Link>
                <Link
                    to="/participants"
                    style={{
                        ...styles.navLink,
                        ...(isActive("/participants") ? styles.activeNavLink : {})
                    }}
                >
                    👥 Data Peserta
                </Link>
                <Link
                    to="/attendance"
                    style={{
                        ...styles.navLink,
                        ...(isActive("/attendance") ? styles.activeNavLink : {})
                    }}
                >
                    📊 Data Absensi
                </Link>
                <Link
                    to="/sessions"
                    style={{
                        ...styles.navLink,
                        ...(isActive("/sessions") ? styles.activeNavLink : {})
                    }}
                >
                    ⚙️ Sesi & Lokasi
                </Link>
                <Link
                    to="/scan"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                        ...styles.navLink,
                        ...(isActive("/scan") ? styles.activeNavLink : {})
                    }}
                >
                    📷 Scan Presensi
                </Link>
            </nav>

            <div style={styles.userSection}>
                <div style={styles.userInfo}>
                    <span style={styles.userName}>{admin?.full_name || admin?.username || "Admin"}</span>
                    <span style={styles.userRole}>Administrator</span>
                </div>
                <button
                    onClick={handleLogout}
                    style={styles.logoutBtn}
                    title="Keluar dari akun"
                >
                    Logout
                </button>
            </div>
        </header>
    );
}

const styles = {
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 24px",
        backgroundColor: "#1e293b",
        color: "#f8fafc",
        borderRadius: "10px",
        margin: "12px 16px 24px 16px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        flexWrap: "wrap",
        gap: "12px"
    },
    brandContainer: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },
    brandLogo: {
        fontSize: "24px"
    },
    brandText: {
        textAlign: "left"
    },
    brandTitle: {
        fontSize: "16px",
        fontWeight: "600",
        color: "#ffffff",
        margin: 0,
        letterSpacing: "0.2px"
    },
    brandSubtitle: {
        fontSize: "11px",
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: "0.5px"
    },
    navLinks: {
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    navLink: {
        color: "#cbd5e1",
        textDecoration: "none",
        padding: "8px 14px",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: "500",
        transition: "all 0.2s ease"
    },
    activeNavLink: {
        backgroundColor: "#3b82f6",
        color: "#ffffff",
        boxShadow: "0 2px 8px rgba(59, 130, 246, 0.4)"
    },
    userSection: {
        display: "flex",
        alignItems: "center",
        gap: "16px"
    },
    userInfo: {
        display: "flex",
        flexDirection: "column",
        textAlign: "right"
    },
    userName: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#f1f5f9"
    },
    userRole: {
        fontSize: "11px",
        color: "#94a3b8"
    },
    logoutBtn: {
        backgroundColor: "#ef4444",
        color: "#ffffff",
        border: "none",
        padding: "8px 14px",
        borderRadius: "6px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "background-color 0.2s ease"
    }
};

export default Navbar;
