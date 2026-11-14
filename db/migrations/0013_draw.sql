CREATE TABLE `draw` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL,
	`created_by` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`participant_count` integer NOT NULL,
	`scheme` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `draw_assignment` (
	`draw_id` text NOT NULL,
	`giver` text NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`draw_id`) REFERENCES `draw`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`giver`) REFERENCES `staff_member`(`member_code`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `draw_assignment_giver_idx` ON `draw_assignment` (`giver`);--> statement-breakpoint
CREATE UNIQUE INDEX `draw_assignment_drawId_giver_unique` ON `draw_assignment` (`draw_id`,`giver`);