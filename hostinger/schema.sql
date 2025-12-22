-- Esquema inicial para Hostinger (MySQL 5.7/8.0)
-- Ajusta el charset/engine si tu hosting lo requiere.

CREATE TABLE IF NOT EXISTS templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  template_key VARCHAR(64) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  occasion VARCHAR(120) NOT NULL,
  accent_color VARCHAR(16) NOT NULL DEFAULT '#8b5cf6',
  gradient VARCHAR(255) NOT NULL DEFAULT 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
  description TEXT,
  features_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cards (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  template_id VARCHAR(64) NULL,
  share_slug VARCHAR(80) NOT NULL UNIQUE,
  headline VARCHAR(255),
  message TEXT,
  recipient_name VARCHAR(255),
  sender_name VARCHAR(255),
  accent_color VARCHAR(16),
  sticker VARCHAR(8),
  include_audio TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (template_id),
  CONSTRAINT fk_cards_template FOREIGN KEY (template_id) REFERENCES templates(template_key) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Datos de ejemplo
INSERT IGNORE INTO templates (template_key, title, occasion, accent_color, gradient, description, features_json) VALUES
('luz', 'Luz cálida', 'cumpleaños', '#f97316', 'linear-gradient(135deg, #fff3e0, #ffe0b2)', 'Globos suaves, tipografía redondeada y un titular con brillo.', '[\"Confeti animado\", \"Botón de audio\", \"Llamado a la acción\"]'),
('aurora', 'Aurora', 'aniversario', '#8b5cf6', 'linear-gradient(135deg, #f5f3ff, #ede9fe)', 'Bordes redondeados y destellos violetas para momentos especiales.', '[\"Sticker animado\", \"Firma manuscrita\", \"Botón de compartir\"]'),
('verde', 'Hojas y luz', 'agradecimiento', '#22c55e', 'linear-gradient(135deg, #f0fdf4, #dcfce7)', 'Trazos orgánicos, ideal para notas de agradecimiento o ánimo.', '[\"Botón de descarga\", \"Etiquetas personalizadas\", \"Modo responsivo\"]');
