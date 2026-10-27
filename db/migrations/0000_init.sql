CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`type` text NOT NULL,
	`year` integer NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `member` (
	`member_code` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`birthday` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff_member` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`nome` text NOT NULL,
	`nome_caccia` text,
	`ruolo` text DEFAULT '' NOT NULL,
	`staff` text DEFAULT '' NOT NULL,
	`coca` integer DEFAULT true NOT NULL,
	`desc` text,
	`img` text,
	`img_file_id` text,
	`order` integer,
	`email` text,
	`is_admin` integer DEFAULT false NOT NULL,
	CONSTRAINT "rs_without_email" CHECK("staff_member"."coca" = 1 OR "staff_member"."email" IS NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_member_slug_unique` ON `staff_member` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `staff_member_email_unique` ON `staff_member` (`email`);--> statement-breakpoint
CREATE TABLE `totem` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`location` text NOT NULL,
	`totem` text NOT NULL,
	`year` text NOT NULL
);
