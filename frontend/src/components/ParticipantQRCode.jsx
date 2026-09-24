import { QRCodeSVG } from "qrcode.react";

function ParticipantQRCode({ participant, onClose }) {
    if (!participant?.qr_token) {
        return (
            <div style={styles.card}>
                <p style={{ color: "#ef4444" }}>QR Code tidak tersedia untuk peserta ini.</p>
            </div>
        );
    }

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        const svg = document.getElementById("participant-qr-svg");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width + 80;
            canvas.height = img.height + 140;

            if (ctx) {
                // Background
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Text Header
                ctx.fillStyle = "#1e293b";
                ctx.font = "bold 18px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(participant.full_name, canvas.width / 2, 40);

                ctx.fillStyle = "#64748b";
                ctx.font = "14px sans-serif";
                ctx.fillText(participant.institution, canvas.width / 2, 65);

                // QR Image
                ctx.drawImage(img, 40, 85);

                // Token Subtext
                ctx.font = "11px monospace";
                ctx.fillStyle = "#94a3b8";
                ctx.fillText(participant.qr_token, canvas.width / 2, canvas.height - 20);

                const pngFile = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.download = `QR_${participant.full_name.replace(/\s+/g, "_")}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            }
        };

        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <span style={styles.badgeType}>{participant.participant_type?.toUpperCase()}</span>
                <h3 style={styles.name}>{participant.full_name}</h3>
                <p style={styles.institution}>{participant.institution}</p>
                <span style={styles.identity}>NIM/ID: {participant.identity_number}</span>
            </div>

            <div style={styles.qrContainer}>
                <QRCodeSVG
                    id="participant-qr-svg"
                    value={participant.qr_token}
                    size={220}
                    level="H"
                    includeMargin={true}
                />
            </div>

            <div style={styles.tokenBox}>
                <small style={styles.tokenLabel}>TOKEN ID:</small>
                <code style={styles.tokenCode}>{participant.qr_token}</code>
            </div>

            <p style={styles.securityNote}>
                🔒 Tunjukkan QR Code ini pada scanner saat tiba di lokasi magang.
            </p>

            <div style={styles.actions}>
                <button onClick={handleDownload} style={styles.downloadBtn}>
                    📥 Unduh Gambar QR
                </button>
                <button onClick={handlePrint} style={styles.printBtn}>
                    🖨️ Cetak Kartu
                </button>
                {onClose && (
                    <button onClick={onClose} style={styles.closeBtn}>
                        Tutup
                    </button>
                )}
            </div>
        </div>
    );
}

const styles = {
    card: {
        backgroundColor: "#ffffff",
        color: "#1e293b",
        borderRadius: "16px",
        padding: "24px",
        textAlign: "center",
        maxWidth: "380px",
        margin: "0 auto",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)"
    },
    header: {
        marginBottom: "16px"
    },
    badgeType: {
        display: "inline-block",
        fontSize: "11px",
        fontWeight: "700",
        padding: "3px 10px",
        borderRadius: "12px",
        backgroundColor: "#e0e7ff",
        color: "#4338ca",
        letterSpacing: "0.5px",
        marginBottom: "8px"
    },
    name: {
        fontSize: "19px",
        fontWeight: "700",
        margin: "0 0 4px 0",
        color: "#0f172a"
    },
    institution: {
        fontSize: "14px",
        color: "#64748b",
        margin: "0 0 4px 0"
    },
    identity: {
        fontSize: "12px",
        color: "#94a3b8",
        fontWeight: "500"
    },
    qrContainer: {
        backgroundColor: "#f8fafc",
        padding: "16px",
        borderRadius: "12px",
        display: "inline-block",
        margin: "12px 0",
        border: "1px solid #e2e8f0"
    },
    tokenBox: {
        backgroundColor: "#f1f5f9",
        padding: "8px 12px",
        borderRadius: "8px",
        margin: "8px 0 14px 0",
        fontSize: "11px"
    },
    tokenLabel: {
        display: "block",
        color: "#64748b",
        fontWeight: "600",
        marginBottom: "2px"
    },
    tokenCode: {
        color: "#334155",
        fontFamily: "monospace",
        wordBreak: "break-all"
    },
    securityNote: {
        fontSize: "12px",
        color: "#64748b",
        margin: "0 0 16px 0",
        lineHeight: "1.4"
    },
    actions: {
        display: "flex",
        justifyContent: "center",
        gap: "8px",
        flexWrap: "wrap"
    },
    downloadBtn: {
        backgroundColor: "#2563eb",
        color: "#ffffff",
        border: "none",
        padding: "9px 14px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer"
    },
    printBtn: {
        backgroundColor: "#0f172a",
        color: "#ffffff",
        border: "none",
        padding: "9px 14px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer"
    },
    closeBtn: {
        backgroundColor: "#e2e8f0",
        color: "#475569",
        border: "none",
        padding: "9px 14px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer"
    }
};

export default ParticipantQRCode;