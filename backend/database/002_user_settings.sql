USE gestao_financeira_inteligente;

CREATE TABLE IF NOT EXISTS user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  currency VARCHAR(10) DEFAULT 'BRL',
  theme ENUM('light','dark') DEFAULT 'light',
  income_commitment_limit DECIMAL(6,2) DEFAULT 50,
  desired_reserve_amount DECIMAL(14,2) DEFAULT 0,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
