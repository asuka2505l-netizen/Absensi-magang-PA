import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

function AdminLayout() {
    return (
        <div style={styles.layout}>
            <Navbar />
            <main style={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}

const styles = {
    layout: {
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        boxSizing: "border-box"
    },
    main: {
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 24px 40px 24px",
        boxSizing: "border-box"
    }
};

export default AdminLayout;
