-- SmartVil Banjar Agung: skema MySQL / TiDB Cloud.
-- Cara pakai: TiDB Cloud Dashboard -> SQL Editor -> paste seluruh file -> Run.
-- Aman dijalankan ulang (idempotent).

CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL DEFAULT 'Admin',
  role VARCHAR(32) NOT NULL DEFAULT 'admin',
  active TINYINT(1) NOT NULL DEFAULT 1,
  department VARCHAR(255) DEFAULT '',
  permissions JSON NULL,
  password_hash VARCHAR(255) DEFAULT '',
  last_login DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS residents (
  id VARCHAR(36) PRIMARY KEY,
  nik VARCHAR(32) NOT NULL DEFAULT '',
  nama VARCHAR(255) NOT NULL DEFAULT '',
  gender VARCHAR(32) NOT NULL DEFAULT '',
  address TEXT,
  occupation VARCHAR(255) DEFAULT '',
  birth_date DATE NULL,
  status VARCHAR(64) NOT NULL DEFAULT 'Tetap',
  status_keluarga VARCHAR(64) DEFAULT '',
  status_penduduk VARCHAR(64) DEFAULT 'Tetap',
  agama VARCHAR(64) DEFAULT '',
  education VARCHAR(128) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_residents_gender (gender),
  INDEX idx_residents_nik (nik)
);

CREATE TABLE IF NOT EXISTS news (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(500) NOT NULL DEFAULT '',
  category VARCHAR(128) NOT NULL DEFAULT '',
  content MEDIUMTEXT,
  date DATE NULL,
  image_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_news_date (date)
);

CREATE TABLE IF NOT EXISTS complaints (
  id VARCHAR(36) PRIMARY KEY,
  ticket_code VARCHAR(64) NOT NULL DEFAULT '',
  nama VARCHAR(255) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  phone VARCHAR(32) NOT NULL DEFAULT '',
  category VARCHAR(128) NOT NULL DEFAULT '',
  title VARCHAR(500) NOT NULL DEFAULT '',
  message MEDIUMTEXT,
  photo_url TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  admin_response MEDIUMTEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_complaints_phone (phone),
  INDEX idx_complaints_ticket (ticket_code),
  INDEX idx_complaints_status (status)
);

CREATE TABLE IF NOT EXISTS requests (
  id VARCHAR(36) PRIMARY KEY,
  ticket_code VARCHAR(64) NOT NULL UNIQUE,
  type VARCHAR(64) NOT NULL DEFAULT '',
  type_name VARCHAR(255) NOT NULL DEFAULT '',
  nama VARCHAR(255) NOT NULL DEFAULT '',
  nik VARCHAR(32) NOT NULL DEFAULT '',
  phone VARCHAR(32) NOT NULL DEFAULT '',
  keperluan TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  form_data JSON NULL,
  template_narrative TEXT,
  admin_notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_requests_status (status),
  INDEX idx_requests_ticket (ticket_code),
  INDEX idx_requests_nik (nik),
  INDEX idx_requests_phone (phone)
);

CREATE TABLE IF NOT EXISTS letter_types (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT,
  requirements JSON NULL,
  template_narrative TEXT,
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  template_file_url TEXT,
  template_data MEDIUMTEXT,
  template_placeholders JSON NULL,
  custom_fields JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agenda (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(500) NOT NULL DEFAULT '',
  category VARCHAR(128) NOT NULL DEFAULT '',
  category_color VARCHAR(32) NOT NULL DEFAULT 'blue',
  schedule VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT,
  time_location VARCHAR(500) DEFAULT '',
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(128) PRIMARY KEY,
  value JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uid VARCHAR(36) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  display_name VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(32) NOT NULL DEFAULT '',
  action VARCHAR(32) NOT NULL DEFAULT '',
  module VARCHAR(32) NOT NULL DEFAULT '',
  detail TEXT,
  INDEX idx_audit_timestamp (timestamp)
);
