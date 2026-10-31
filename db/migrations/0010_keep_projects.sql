PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_year_project` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staff_member_id` integer NOT NULL,
	`scout_year` text NOT NULL,
	`sections` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`staff_member_id`) REFERENCES `staff_member`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`scout_year`) REFERENCES `scout_year`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_year_project`("id", "staff_member_id", "scout_year", "sections", "updated_at") SELECT "id", "staff_member_id", "scout_year", "sections", "updated_at" FROM `year_project`;--> statement-breakpoint
DROP TABLE `year_project`;--> statement-breakpoint
ALTER TABLE `__new_year_project` RENAME TO `year_project`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `year_project_staffMemberId_scoutYear_unique` ON `year_project` (`staff_member_id`,`scout_year`);--> statement-breakpoint
ALTER TABLE `staff_member` ADD `deleted_at` integer;