CREATE DATABASE IF NOT EXISTS gestao_financeira_inteligente CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestao_financeira_inteligente;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  profile_type ENUM('pessoal','empresa','ambos') NOT NULL DEFAULT 'pessoal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('receita','despesa') NOT NULL,
  color VARCHAR(20) DEFAULT '#2563eb',
  icon VARCHAR(50) DEFAULT 'circle',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bank_name VARCHAR(120) NOT NULL,
  account_type ENUM('corrente','poupanca','digital','salario','investimento') NOT NULL,
  current_balance DECIMAL(14,2) DEFAULT 0,
  overdraft_limit DECIMAL(14,2) DEFAULT 0,
  overdraft_used DECIMAL(14,2) DEFAULT 0,
  overdraft_interest_rate DECIMAL(8,4) DEFAULT 0,
  interest_due_day TINYINT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS credit_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  card_name VARCHAR(120) NOT NULL,
  issuer VARCHAR(120) NOT NULL,
  total_limit DECIMAL(14,2) DEFAULT 0,
  used_limit DECIMAL(14,2) DEFAULT 0,
  closing_day TINYINT,
  due_day TINYINT,
  revolving_interest_rate DECIMAL(8,4) DEFAULT 0,
  current_invoice_value DECIMAL(14,2) DEFAULT 0,
  minimum_payment_value DECIMAL(14,2) DEFAULT 0,
  status ENUM('aberta','fechada','paga','atrasada','parcelada') DEFAULT 'aberta',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS card_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  credit_card_id INT NOT NULL,
  description VARCHAR(180) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  purchase_date DATE NOT NULL,
  installments INT DEFAULT 1,
  current_installment INT DEFAULT 1,
  category_id INT,
  status ENUM('aberta','paga','cancelada') DEFAULT 'aberta',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS debts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  debt_name VARCHAR(160) NOT NULL,
  creditor VARCHAR(160),
  debt_type ENUM('cheque_especial','cartao_credito','emprestimo_pessoal','financiamento','boleto_atrasado','conta_consumo','imposto_taxa','fornecedor','pessoal','outros') NOT NULL,
  original_amount DECIMAL(14,2) DEFAULT 0,
  current_amount DECIMAL(14,2) DEFAULT 0,
  monthly_interest_rate DECIMAL(8,4) DEFAULT 0,
  start_date DATE,
  due_date DATE,
  installments_total INT DEFAULT 1,
  installments_paid INT DEFAULT 0,
  installment_value DECIMAL(14,2) DEFAULT 0,
  status ENUM('em_dia','atrasada','renegociada','quitada','em_negociacao') DEFAULT 'em_dia',
  priority ENUM('baixa','media','alta','urgente') DEFAULT 'media',
  has_guarantee BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS incomes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  description VARCHAR(180) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  received_date DATE NOT NULL,
  category_id INT,
  bank_account_id INT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_type ENUM('mensal','semanal','quinzenal','anual'),
  status ENUM('recebido','previsto','atrasado') DEFAULT 'previsto',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  description VARCHAR(180) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  category_id INT,
  bank_account_id INT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_type ENUM('mensal','semanal','quinzenal','anual'),
  status ENUM('aberto','pago','vencido','cancelado') DEFAULT 'aberto',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS financial_goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  goal_name VARCHAR(160) NOT NULL,
  target_amount DECIMAL(14,2) NOT NULL,
  current_amount DECIMAL(14,2) DEFAULT 0,
  deadline DATE,
  priority ENUM('baixa','media','alta','urgente') DEFAULT 'media',
  status ENUM('ativa','concluida','pausada','atrasada') DEFAULT 'ativa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS action_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  strategy_type ENUM('avalanche','bola_de_neve','emergencial','personalizado') DEFAULT 'avalanche',
  total_debt DECIMAL(14,2) DEFAULT 0,
  monthly_available_amount DECIMAL(14,2) DEFAULT 0,
  recommendation_text TEXT,
  estimated_months INT,
  status ENUM('ativo','concluido','pausado') DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS action_plan_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action_plan_id INT NOT NULL,
  debt_id INT,
  payment_order INT NOT NULL,
  suggested_monthly_payment DECIMAL(14,2) DEFAULT 0,
  reason VARCHAR(255),
  status ENUM('pendente','em_andamento','concluido') DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (action_plan_id) REFERENCES action_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  alert_type VARCHAR(80),
  severity ENUM('baixa','media','alta','urgente') DEFAULT 'media',
  is_read BOOLEAN DEFAULT FALSE,
  related_table VARCHAR(80),
  related_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  target_type ENUM('expense','debt','card','card_transaction') NOT NULL,
  target_id INT NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  bank_account_id INT,
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(120) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
