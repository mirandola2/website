CREATE TABLE `pesca` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL,
	`created_by` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`participant_count` integer NOT NULL,
	`scheme` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pesca_assignment` (
	`pesca_id` text NOT NULL,
	`giver` text NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`pesca_id`) REFERENCES `pesca`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`giver`) REFERENCES `staff_member`(`member_code`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `pesca_assignment_giver_idx` ON `pesca_assignment` (`giver`);--> statement-breakpoint
CREATE UNIQUE INDEX `pesca_assignment_pescaId_giver_unique` ON `pesca_assignment` (`pesca_id`,`giver`);