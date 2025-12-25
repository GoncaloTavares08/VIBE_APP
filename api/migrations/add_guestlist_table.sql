-- =====================================================
-- GUESTLIST TABLE - Simple Version
-- Execute this on EACH club database (vr_vibe_db, eskada_vibe_db, etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS `guestlist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL COMMENT 'User ID from users table',
  `rp_id` int(11) NOT NULL COMMENT 'RP who added this guest',
  `status` enum('confirmed','checked_in','expired') NOT NULL DEFAULT 'confirmed',
  `qr_code` varchar(100) UNIQUE NOT NULL COMMENT 'Unique QR code for entry',
  `checked_in_at` datetime DEFAULT NULL COMMENT 'When guest entered',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_event_client` (`event_id`, `client_id`),
  KEY `idx_event_id` (`event_id`),
  KEY `idx_client_id` (`client_id`),
  KEY `idx_rp_id` (`rp_id`),
  KEY `idx_status` (`status`),
  KEY `idx_qr_code` (`qr_code`),
  KEY `idx_client_status` (`client_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Guestlist entries for events';

-- =====================================================
-- SAMPLE DATA (for testing - remove in production)
-- =====================================================

-- Sample Guestlist Entry (assuming event_id=1 and client_id=1 exist)
-- INSERT INTO guestlist (event_id, client_id, rp_id, status, qr_code)
-- VALUES (1, 1, 1, 'confirmed', 'GUEST-1-1-a8f3c2d9');
