-- phpMyAdmin SQL Dump
-- Host: sql103.infinityfree.com
-- Versão do servidor: 11.4.7-MariaDB
-- versão do PHP: 7.2.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `if0_40705886_vr_vibe_db`
--

-- --------------------------------------------------------

--
-- 1. Estrutura da tabela `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `capacity` int(11) NOT NULL DEFAULT 0,
  `organizer_name` varchar(255) DEFAULT NULL,
  `status` enum('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_date` (`date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `events`
--

INSERT INTO `events` (`id`, `name`, `description`, `date`, `start_time`, `end_time`, `capacity`, `organizer_name`, `status`, `image_url`, `created_at`, `updated_at`, `created_by`) VALUES
(1, 'Rolézin do DJ Duarte', 'Este Sábado pela 1.ª vez no Porto recebemos o DJ Duarte diretamente do 🇧🇷 , um dos artistas mais virais do Tiktok! 🤯\n\n\nAutor dos Hits: \n\n“Montagem Camera Lenta”, “Cachorrinha de Madame”, “Ritmada Interestelar”, “Tu Joga Pra Trás (Encosta Encosta)”, “Toma Toma Pau”, “Liga o Flash do Celular”, “Apaga Luz, Apaga Tudo” com + de 1 Bilhão de Visualizações! 🎧\n\n\nO maior baile funk do Norte, todos os Sábados no Via Rápida com os melhores hits do Brasil! 💃🏻\n\n\n#Vemprorolézin 🇧🇷\n\n\nNo comando da cabine:\n\n• Diluvian\n\n• DJ DUARTE (Live Act)\n\n\nDress Code: Casual chic / Formal\n\n\nAcesso Geral com Guest List até às 3h:\n\n(Pago na entrada do evento)\n\n\nHomem\n\n10€ Consumíveis\n\n\nMulher\n\n5€ com 5 bebidas de serviço até 1h\n\n5€ com 3 bebidas de serviço entre 1h e 2h\n\n5€ com 1 bebida de serviço entre 2h e 3h\n\n\nAcesso VIP prioritário (Pré-Pago):\n\n\nMulher - 20€ com 5 bebidas de serviço\nHomem - 20€ com 3 bebidas de serviço', '2025-12-27', '23:59:00', '06:00:00', 500, 'Rolézin', 'upcoming', 'https://assets.3cket.com/event/event-description/592d51ea8cc8436bbde007f949780359/de74cdfcca4a4b9899684eda48d432e6.webp', '2025-12-22 15:09:02', '2025-12-24 06:47:04', 1),
(2, 'NYE 25/26 FINAL COUNTDOWN', 'NYE 25/26 FINAL COUNTDOWN 🥂🪩\nEDIÇÃO ESPECIAL “OPEN BAR” DURANTE TODA A NOITE!\n\n\nTemos o prazer de o (a) convidar a festejar connosco a noite de passagem de ano com uma edição especial “Open Bar” durante toda a noite de forma a proporcionar uma passagem de ano inesquecível!\n\n\nDRESS CODE: Classy & Chic 👠\n\n\nMusic by:\n\n\n• Arthur\n\n• Luís Pessoa\n\n• Pedro Coelho\n\n\nNão percas esta oportunidade única de entrar em 2026 com música, brilho e diversão.\n\nAdquire já o teu bilhete e garante o teu lugar na melhor festa do ano! 🎇\n\n\nRESERVAS DE MESAS VIP:\n\nPara um toque de exclusividade, reserve já a sua mesa VIP e desfrute de uma experiência ainda mais especial.\n\nInfoline (Whatsapp): +351 938 293 703\n\nJunto dos Relações Públicas do evento.', '2025-12-31', '23:00:00', '06:00:00', 550, 'Via Rapida', 'upcoming', 'https://assets.3cket.com/event/event-description/c33d6849a86d48cf84abf784d687929e/bf84ec3da15f49de82bade0ee63a00e6.webp', '2025-12-22 15:24:47', '2025-12-22 15:27:25', 1);

-- --------------------------------------------------------

--
-- 2. Estrutura da tabela `rewards`
--

CREATE TABLE IF NOT EXISTS `rewards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `points` int(11) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `available` tinyint(1) DEFAULT 1,
  `image_path` varchar(500),
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_available` (`available`),
  KEY `idx_points` (`points`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 3. Estrutura da tabela `event_feedback`
--

CREATE TABLE `event_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 4. Estrutura da tabela `rp_profile_events`
--

CREATE TABLE `rp_profile_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rp_user_id` int(11) NOT NULL COMMENT 'DB Global',
  `event_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_rp_event` (`rp_user_id`,`event_id`),
  KEY `idx_rp_user` (`rp_user_id`),
  KEY `idx_event` (`event_id`),
  CONSTRAINT `rp_profile_events_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `rp_profile_events`
--

INSERT INTO `rp_profile_events` (`id`, `rp_user_id`, `event_id`, `created_at`) VALUES
(4, 15, 2, '2025-12-23 02:55:35'),
(5, 15, 1, '2025-12-23 02:55:37');

-- --------------------------------------------------------

--
-- 5. Estrutura da tabela `guestlist`
--

CREATE TABLE IF NOT EXISTS `guestlist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL COMMENT 'User ID from users table',
  `rp_id` int(11) NOT NULL COMMENT 'RP who added this guest',
  `status` enum('confirmed','checked_in','expired') NOT NULL DEFAULT 'confirmed',
  `qr_code` varchar(100) NOT NULL COMMENT 'Unique QR code for entry',
  `checked_in_at` datetime DEFAULT NULL COMMENT 'When guest entered',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_event_client` (`event_id`, `client_id`),
  UNIQUE KEY `unique_qr_code` (`qr_code`),
  KEY `idx_event_id` (`event_id`),
  KEY `idx_client_id` (`client_id`),
  KEY `idx_rp_id` (`rp_id`),
  KEY `idx_status` (`status`),
  KEY `idx_qr_code` (`qr_code`),
  KEY `idx_client_status` (`client_id`, `status`),
  CONSTRAINT `fk_guestlist_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Guestlist entries for events';

-- --------------------------------------------------------

--
-- 6. Estrutura da tabela `reward_redemptions`
--

CREATE TABLE IF NOT EXISTS `reward_redemptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT 'From global database',
  `reward_id` int(11) NOT NULL,
  `reward_name` varchar(255) NOT NULL COMMENT 'Snapshot of reward name at redemption',
  `points_spent` int(11) NOT NULL COMMENT 'Points deducted',
  `status` enum('pending','used','expired') DEFAULT 'pending',
  `qr_code` varchar(500) NOT NULL COMMENT 'Unique QR code for verification',
  `event_id` int(11) DEFAULT NULL COMMENT 'Event where reward was activated',
  `activated_by` int(11) DEFAULT NULL COMMENT 'Staff/RP user_id who activated',
  `redeemed_at` datetime DEFAULT current_timestamp(),
  `used_at` datetime DEFAULT NULL,
  `expires_at` datetime NOT NULL COMMENT 'Expiration date (30 days from redemption)',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_reward` (`reward_id`),
  KEY `idx_status` (`status`),
  KEY `idx_qr_code` (`qr_code`),
  KEY `idx_event` (`event_id`),
  CONSTRAINT `fk_redemption_reward` FOREIGN KEY (`reward_id`) REFERENCES `rewards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_redemption_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
