CREATE TABLE `scout_year` (
	`id` text PRIMARY KEY NOT NULL,
	`question` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `year_project` ADD `sections` text DEFAULT '{}' NOT NULL;