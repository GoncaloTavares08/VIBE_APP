-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Host: sql103.infinityfree.com
-- Tempo de geração: 24-Dez-2025 às 11:33
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
-- Banco de dados: `if0_40705886_vibe_db`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `clubs`
--

CREATE TABLE `clubs` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `database_name` varchar(100) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `clubs`
--

INSERT INTO `clubs` (`id`, `name`, `slug`, `database_name`, `location`, `is_active`, `created_at`) VALUES
(1, 'Via Rapida', 'vr', 'if0_40705886_vr_vibe_db', 'Porto, Portugal', 1, '2025-12-19 20:18:43'),
(2, 'Eskada Club', 'eskada', 'if0_40705886_eskada_vibe_db', 'Lisboa, Portugal', 1, '2025-12-19 20:18:43');

-- --------------------------------------------------------

--
-- Estrutura da tabela `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `attempted_at` datetime DEFAULT current_timestamp(),
  `successful` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `login_attempts`
--

INSERT INTO `login_attempts` (`id`, `email`, `ip_address`, `attempted_at`, `successful`) VALUES
(34, 'client@vr.com', '94.60.62.165', '2025-12-24 06:50:42', 1),
(35, 'leader@vr.com', '94.60.62.165', '2025-12-24 06:57:19', 1),
(36, 'client@vr.com', '94.60.62.165', '2025-12-24 06:58:41', 1),
(37, 'leader@vr.com', '94.60.62.165', '2025-12-24 07:05:13', 1);

-- --------------------------------------------------------

--
-- Estrutura da tabela `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `reset_token` varchar(6) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `created_at`, `updated_at`, `reset_token`, `reset_token_expiry`) VALUES
(11, 'Admin VR', 'admin@vr.com', '$argon2id$v=19$m=65536,t=4,p=1$MUxBam92MVA4RXNFblNEMg$dbBVmUrDKuQVlpJfhNjBwHx7vw8YardG5HZE1IvUJdw', '2025-12-21 16:11:46', '2025-12-21 16:11:46', NULL, NULL),
(12, 'Admin Eskada', 'admin@eskada.com', '$argon2id$v=19$m=65536,t=4,p=1$ZTVYOHZXcGouLzBsWkdObA$kevSauqyCMPuGnIneVToR+1duwocwG9s/YDUi4Ia20k', '2025-12-21 16:22:40', '2025-12-21 16:22:40', NULL, NULL),
(13, 'Staff VR', 'staff@vr.com', '$argon2id$v=19$m=65536,t=4,p=1$U0NQczR6YVp3em9qSGd5dg$Kw3De+tiLQPXD/EJF2pJ9oAelU+u4Xi2+WW4/EZVDMc', '2025-12-21 16:23:55', '2025-12-21 16:23:55', NULL, NULL),
(14, 'Staff ESKADA', 'staff@eskada.com', '$argon2id$v=19$m=65536,t=4,p=1$cExEd2NLZ1U1TXQ5SzhTMA$Jd0cFiqQorxJHca+ECNOL3KsKkFCFsdi+VljsOozPNs', '2025-12-21 16:24:40', '2025-12-21 16:24:40', NULL, NULL),
(15, 'Leader VR', 'leader@vr.com', '$argon2id$v=19$m=65536,t=4,p=1$UjFZMDd2dEE5OWd3YlZHeQ$qb/XIz9fuB6rstvIjQpylw9c/lgYhsYh2d7d9Zf/i1o', '2025-12-21 16:25:09', '2025-12-21 16:25:09', NULL, NULL),
(16, 'Leader ESKADA', 'leader@eskada.com', '$argon2id$v=19$m=65536,t=4,p=1$NE04Y2x6ak1IUGg2VUlBUA$BS0b22usd8meQ55o/ZafnjhiCuO8wgZYVrGYLJxqKuk', '2025-12-21 16:25:28', '2025-12-21 16:25:28', NULL, NULL),
(17, 'Client VR', 'client@vr.com', '$argon2id$v=19$m=65536,t=4,p=1$aUpudmtteG95ZVRqekpQRQ$L2N1MO0cTKUIYPoHIaJYGmmYtKu8/xZfKdF367S5vdY', '2025-12-21 16:28:37', '2025-12-21 16:28:37', NULL, NULL),
(18, 'Client ESKADA', 'client@eskada.com', '$argon2id$v=19$m=65536,t=4,p=1$d0VZcjJ3a2lXQ1g1eVc4MA$I7QgkqRVgdV/4m+UynycXIwsr7DyDu5JLBSuckMXGBw', '2025-12-21 16:29:00', '2025-12-21 16:29:00', NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `user_club_access`
--

CREATE TABLE `user_club_access` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `role` varchar(50) DEFAULT 'CLIENT',
  `points` int(11) NOT NULL DEFAULT 0,
  `joined_at` datetime DEFAULT current_timestamp(),
  `team_leader_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Extraindo dados da tabela `user_club_access`
--

INSERT INTO `user_club_access` (`id`, `user_id`, `club_id`, `role`, `points`, `joined_at`, `team_leader_id`) VALUES
(18, 11, 1, 'ADMIN', 0, '2025-12-21 08:18:51', NULL),
(20, 12, 2, 'ADMIN', 0, '2025-12-21 08:23:19', NULL),
(21, 13, 1, 'STAFF', 0, '2025-12-21 08:23:55', NULL),
(22, 14, 2, 'STAFF', 0, '2025-12-21 08:24:40', NULL),
(23, 15, 1, 'TEAM_LEADER', 0, '2025-12-21 08:25:09', NULL),
(24, 16, 2, 'TEAM_LEADER', 0, '2025-12-21 08:25:28', NULL),
(25, 17, 1, 'CLIENT', 1500, '2025-12-21 08:28:37', NULL),
(26, 18, 2, 'CLIENT', 0, '2025-12-21 08:29:00', NULL);

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `clubs`
--
ALTER TABLE `clubs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_slug` (`slug`);

--
-- Índices para tabela `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email_time` (`email`,`attempted_at`),
  ADD KEY `idx_ip_time` (`ip_address`,`attempted_at`);

--
-- Índices para tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Índices para tabela `user_club_access`
--
ALTER TABLE `user_club_access`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_club` (`user_id`,`club_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_club` (`club_id`),
  ADD KEY `idx_team_leader` (`team_leader_id`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `clubs`
--
ALTER TABLE `clubs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de tabela `user_club_access`
--
ALTER TABLE `user_club_access`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- Restrições para despejos de tabelas
--

--
-- Limitadores para a tabela `user_club_access`
--
ALTER TABLE `user_club_access`
  ADD CONSTRAINT `fk_team_leader` FOREIGN KEY (`team_leader_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `user_club_access_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_club_access_ibfk_2` FOREIGN KEY (`club_id`) REFERENCES `clubs` (`id`) ON DELETE CASCADE;

-- --------------------------------------------------------

--
-- Estrutura da tabela `rp_profiles`
--

CREATE TABLE `rp_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `bio` text DEFAULT NULL,
  `instagram` varchar(50) DEFAULT NULL,
  `profile_image_url` varchar(500) DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `rp_reviews`
--

CREATE TABLE `rp_reviews` (
  `id` int(11) NOT NULL,
  `rp_user_id` int(11) NOT NULL,
  `reviewer_user_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comment` text DEFAULT NULL,
  `event_id` int(11) DEFAULT NULL,
  `club_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tabela `rp_profiles`
--
ALTER TABLE `rp_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_username` (`username`);

--
-- Índices para tabela `rp_reviews`
--
ALTER TABLE `rp_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_review` (`rp_user_id`,`reviewer_user_id`,`event_id`),
  ADD KEY `idx_rp` (`rp_user_id`),
  ADD KEY `idx_rating` (`rp_user_id`,`rating`),
  ADD KEY `reviewer_user_id` (`reviewer_user_id`),
  ADD KEY `club_id` (`club_id`);

--
-- AUTO_INCREMENT de tabela `rp_profiles`
--
ALTER TABLE `rp_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `rp_reviews`
--
ALTER TABLE `rp_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Limitadores para a tabela `rp_profiles`
--
ALTER TABLE `rp_profiles`
  ADD CONSTRAINT `rp_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `rp_reviews`
--
ALTER TABLE `rp_reviews`
  ADD CONSTRAINT `rp_reviews_ibfk_1` FOREIGN KEY (`rp_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rp_reviews_ibfk_2` FOREIGN KEY (`reviewer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rp_reviews_ibfk_3` FOREIGN KEY (`club_id`) REFERENCES `clubs` (`id`) ON DELETE CASCADE;

-- --------------------------------------------------------

--
-- Estrutura da tabela `client_profiles`
--

CREATE TABLE IF NOT EXISTS `client_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `bio` text DEFAULT NULL,
  `instagram` varchar(50) DEFAULT NULL,
  `profile_photo_path` varchar(500) DEFAULT NULL,
  `ghost_mode` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `client_profile_photos`
--

CREATE TABLE IF NOT EXISTS `client_profile_photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_profile_id` int(11) NOT NULL,
  `photo_path` varchar(500) NOT NULL,
  `photo_order` tinyint NOT NULL DEFAULT 0,
  `uploaded_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_profile` (`client_profile_id`),
  KEY `idx_order` (`client_profile_id`, `photo_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- AUTO_INCREMENT de tabela `client_profiles`
--
ALTER TABLE `client_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `client_profile_photos`
--
ALTER TABLE `client_profile_photos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Limitadores para a tabela `client_profiles`
--
ALTER TABLE `client_profiles`
  ADD CONSTRAINT `client_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `client_profile_photos`
--
ALTER TABLE `client_profile_photos`
  ADD CONSTRAINT `client_profile_photos_ibfk_1` FOREIGN KEY (`client_profile_id`) REFERENCES `client_profiles` (`id`) ON DELETE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
