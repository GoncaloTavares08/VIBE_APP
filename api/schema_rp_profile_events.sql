-- IMPORTANTE: Esta tabela deve ser criada na BASE DE DADOS ESPECÍFICA DE CADA CLUBE
-- Não criar na base de dados global!
-- Exemplo: Para o clube VIBE1, criar em vibe1_db

-- Tabela para associar RPs aos eventos que querem mostrar no perfil
CREATE TABLE IF NOT EXISTS rp_profile_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rp_user_id INT NOT NULL COMMENT 'ID do utilizador global (users table)',
    event_id INT NOT NULL COMMENT 'ID do evento (events table desta DB)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_rp_event (rp_user_id, event_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_rp_user (rp_user_id),
    INDEX idx_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

