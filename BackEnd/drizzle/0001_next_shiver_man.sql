CREATE TABLE `restaurant_users` (
	`id` varchar(36) NOT NULL,
	`restaurant_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`role` varchar(20) NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `restaurant_users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `restaurants` (
	`id` varchar(36) NOT NULL,
	`name` varchar(120) NOT NULL,
	`slug` varchar(80) NOT NULL,
	`database_name` varchar(120) NOT NULL,
	`plan` varchar(30) NOT NULL DEFAULT 'starter',
	`status` varchar(30) NOT NULL DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `restaurants_id` PRIMARY KEY(`id`),
	CONSTRAINT `restaurants_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `restaurants_database_name_unique` UNIQUE(`database_name`)
);
--> statement-breakpoint
ALTER TABLE `restaurant_users` ADD CONSTRAINT `restaurant_users_restaurant_id_restaurants_id_fk` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `restaurant_users` ADD CONSTRAINT `restaurant_users_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;