-- Event Likes Table for Tinder-style matching
-- Add to club database

CREATE TABLE IF NOT EXISTS `event_likes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `liker_id` int(11) NOT NULL COMMENT 'User who gave the like',
  `liked_id` int(11) NOT NULL COMMENT 'User who received the like',
  `action` enum('like','pass') NOT NULL DEFAULT 'like',
  `is_match` tinyint(1) DEFAULT 0 COMMENT '1 if mutual like exists',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_like` (`event_id`, `liker_id`, `liked_id`),
  KEY `idx_event` (`event_id`),
  KEY `idx_liker` (`liker_id`),
  KEY `idx_liked` (`liked_id`),
  KEY `idx_match` (`is_match`),
  CONSTRAINT `fk_likes_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores likes/passes between users at events';
