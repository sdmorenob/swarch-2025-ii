CREATE TABLE IF NOT EXISTS `user` (
  `user_id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS `campus_event` (
  `caev_id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `location` VARCHAR(200),
  `event_date` TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS `rsvp` (
  `rsvp_id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `caev_id` BIGINT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rsvps_user FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`),
  CONSTRAINT fk_rsvps_campus_event FOREIGN KEY (`caev_id`) REFERENCES `campus_event`(`caev_id`),
  CONSTRAINT uq_rsvps_user_event UNIQUE (`user_id`, `caev_id`)
);

INSERT INTO `user` (`user_id`, `name`, `email`) VALUES 
  (1, 'Alice', 'alice@example.com'),
  (2, 'Bob',   'bob@example.com'),
  (3, 'Carol', 'carol@example.com'),
  (4, 'Dave',  'dave@example.com')
AS new_users 
ON DUPLICATE KEY UPDATE
  `name`  = new_users.`name`,
  `email` = new_users.`email`;

INSERT INTO `campus_event` (`caev_id`, `title`, `description`, `location`, `event_date`) VALUES 
  (101, 'Tech Talk: AI 101',       'Intro to AI',             'Auditorium A',   DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 DAY)),
  (102, 'Campus Jam Session',      'Open mic and music',      'Student Center', DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY)),
  (103, '5K Wellness Run',         'Community fitness event', 'North Field',    DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 DAY)),
  (104, 'Security Best Practices', 'Protect your accounts',   'Room 204',       DATE_ADD(UTC_TIMESTAMP(), INTERVAL 20 DAY))
AS new_events
ON DUPLICATE KEY UPDATE
  `title`       = new_events.`title`,
  `description` = new_events.`description`,
  `location`    = new_events.`location`,
  `event_date`  = new_events.`event_date`;

INSERT IGNORE INTO `rsvp` (`user_id`, `caev_id`) VALUES 
  (1, 101),
  (1, 102),
  (2, 103),
  (3, 104);