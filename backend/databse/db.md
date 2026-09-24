CREATE TABLE admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE participants (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    identity_number VARCHAR(50) NOT NULL UNIQUE,
    institution VARCHAR(150) NOT NULL,
    participant_type ENUM('mahasiswa', 'sma', 'smk') NOT NULL,
    phone VARCHAR(20),
    qr_token CHAR(36) NOT NULL UNIQUE,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE attendance_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_date DATE NOT NULL UNIQUE,
    check_in_start TIME NOT NULL,
    check_in_end TIME NOT NULL,
    check_out_start TIME NOT NULL,
    check_out_end TIME NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    radius_meter INT UNSIGNED NOT NULL DEFAULT 100,
    status ENUM('active', 'closed') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE attendances (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    participant_id INT UNSIGNED NOT NULL,
    session_id INT UNSIGNED NOT NULL,
    check_in_at DATETIME NOT NULL,
    check_out_at DATETIME NULL,
    check_in_latitude DECIMAL(10,8) NOT NULL,
    check_in_longitude DECIMAL(11,8) NOT NULL,
    check_out_latitude DECIMAL(10,8) NULL,
    check_out_longitude DECIMAL(11,8) NULL,
    status ENUM('incomplete', 'completed') NOT NULL DEFAULT 'incomplete',
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE
);

┌──────────────┐
│    ADMINS    │
└──────────────┘
       │
       │
       │ tidak berhubungan langsung
       │ dengan absensi peserta
       │


┌──────────────────┐
│   PARTICIPANTS   │
│──────────────────│
│ id               │
│ full_name        │
│ identity_number  │
│ institution      │
│ participant_type │
│ qr_token         │
│ status           │
└────────┬─────────┘
         │
         │ 1
         │
         │
         │ N
┌────────▼─────────┐
│   ATTENDANCES    │
│──────────────────│
│ id               │
│ participant_id   │
│ session_id       │
│ check_in_at      │
│ check_out_at     │
│ GPS              │
│ status           │
└────────┬─────────┘
         │
         │ N
         │
         │ 1
┌────────▼──────────────┐
│ ATTENDANCE_SESSIONS   │
│───────────────────────│
│ id                    │
│ session_date          │
│ check_in_start        │
│ check_in_end          │
│ check_out_start       │
│ check_out_end         │
│ latitude              │
│ longitude             │
│ radius_meter          │
│ status                │
└───────────────────────┘