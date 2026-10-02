CREATE DATABASE IF NOT EXISTS miapp_auth
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE miapp_auth;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'user',
  status ENUM('active', 'inactive', 'blocked') NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_tokens_hash (token_hash),
  KEY idx_auth_tokens_user (user_id),
  KEY idx_auth_tokens_expiration (expires_at),
  CONSTRAINT fk_auth_tokens_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Primera carga de desarrollo:
-- Usuario: admin | Correo: admin@miapp.local | Contraseña: password
INSERT IGNORE INTO users
  (id, username, email, password_hash, full_name, role, status)
VALUES
  (1, 'admin', 'admin@miapp.local',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
   'Administrador MiApp', 'admin', 'active');

-- =========================================================
-- ORACULO DEPORTIVO: MLB + NFL
-- =========================================================

CREATE TABLE IF NOT EXISTS model_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sport ENUM('MLB', 'NFL') NOT NULL,
  model_version VARCHAR(80) NOT NULL,
  status ENUM('running', 'completed', 'failed') NOT NULL DEFAULT 'running',
  started_at DATETIME NOT NULL,
  finished_at DATETIME NULL,
  games_processed INT UNSIGNED NOT NULL DEFAULT 0,
  predictions_created INT UNSIGNED NOT NULL DEFAULT 0,
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_model_runs_sport_date (sport, started_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sports_games (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  external_game_id VARCHAR(100) NOT NULL,
  sport ENUM('MLB', 'NFL') NOT NULL,
  season SMALLINT UNSIGNED NOT NULL,
  week SMALLINT UNSIGNED NULL,
  game_date DATETIME NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  home_team VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
  venue VARCHAR(150) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sports_games_source (sport, external_game_id),
  KEY idx_sports_games_date (sport, game_date),
  KEY idx_sports_games_week (sport, season, week)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS predictions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  game_id BIGINT UNSIGNED NOT NULL,
  model_run_id BIGINT UNSIGNED NULL,
  source_prediction_key VARCHAR(191) NOT NULL,
  market_type VARCHAR(60) NOT NULL,
  participant_name VARCHAR(150) NULL,
  line_value DECIMAL(10,3) NOT NULL,
  predicted_value DECIMAL(12,4) NULL,
  selection VARCHAR(30) NOT NULL,
  probability DECIMAL(9,6) NOT NULL,
  over_probability DECIMAL(9,6) NULL,
  under_probability DECIMAL(9,6) NULL,
  confidence DECIMAL(9,6) NULL,
  edge_value DECIMAL(12,4) NULL,
  odds_value DECIMAL(10,2) NULL,
  expected_value DECIMAL(12,6) NULL,
  pick_status VARCHAR(30) NOT NULL DEFAULT 'NO PICK',
  calibration_method VARCHAR(80) NULL,
  model_version VARCHAR(80) NOT NULL,
  injury_status VARCHAR(40) NULL,
  notes TEXT NULL,
  generated_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_predictions_source_key (source_prediction_key),
  KEY idx_predictions_game (game_id),
  KEY idx_predictions_market (market_type, pick_status),
  CONSTRAINT fk_predictions_game FOREIGN KEY (game_id)
    REFERENCES sports_games (id) ON DELETE CASCADE,
  CONSTRAINT fk_predictions_run FOREIGN KEY (model_run_id)
    REFERENCES model_runs (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Datos de demostracion para comprobar la pantalla antes de ejecutar Python.
INSERT IGNORE INTO sports_games
  (id, external_game_id, sport, season, week, game_date, away_team, home_team, status)
VALUES
  (1001, 'demo-mlb-001', 'MLB', 2026, NULL, '2026-10-02 18:05:00', 'BOS', 'NYY', 'scheduled'),
  (1002, 'demo-nfl-001', 'NFL', 2026, 4, '2026-10-04 18:20:00', 'BAL', 'DAL', 'scheduled');

INSERT IGNORE INTO predictions
  (game_id, source_prediction_key, market_type, participant_name, line_value,
   predicted_value, selection, probability, over_probability, under_probability,
   confidence, edge_value, odds_value, expected_value, pick_status,
   calibration_method, model_version, generated_at)
VALUES
  (1001, 'MLB:demo-mlb-001:F5_TOTAL:GAME:4.5', 'F5_TOTAL', NULL, 4.500,
   5.1200, 'OVER', 0.584000, 0.584000, 0.416000,
   0.584000, 0.6200, -110.00, 0.114000, 'PICK',
   'Platt', 'V8_1', '2026-10-02 10:00:00'),
  (1002, 'NFL:demo-nfl-001:GAME_TOTAL:GAME:53.5', 'GAME_TOTAL', NULL, 53.500,
   55.7944, 'OVER', 0.551200, 0.551200, 0.448800,
   0.551200, 2.2944, -108.00, 0.061000, 'PICK',
   'Calibracion OOS', 'NFL_TOTALS_2026', '2026-10-02 10:00:00');
