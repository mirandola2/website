-- The member code becomes the key of staff_member (FK to member) and the projects' link to their
-- leader, instead of the autoincrement id. Hand-written (drizzle-kit can't map ids to codes).
--
-- Each staff row gets the code of the only member with exactly its name, when no other staff row
-- has that name too. Every other row (no member with that name, homonyms, abbreviated names)
-- gets a placeholder `X-<slug>` with its own member row (no birthday), to be corrected in
-- /tabu/admin/staff: the projects follow the code (ON UPDATE CASCADE).
--
-- The migrator runs this in one transaction with foreign keys off: any error rolls it all back.
PRAGMA foreign_keys=OFF;--> statement-breakpoint

-- member: birthday nullable (placeholders), indexes for the name search and the birthdays
CREATE TABLE `__new_member` (
	`member_code` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`birthday` text
);
--> statement-breakpoint
INSERT INTO `__new_member`("member_code", "full_name", "birthday") SELECT "member_code", "full_name", "birthday" FROM `member`;--> statement-breakpoint
DROP TABLE `member`;--> statement-breakpoint
ALTER TABLE `__new_member` RENAME TO `member`;--> statement-breakpoint
CREATE INDEX `member_full_name_idx` ON `member` (lower("full_name"));--> statement-breakpoint
CREATE INDEX `member_birthday_md_idx` ON `member` (substr("birthday", 6));--> statement-breakpoint

-- Old staff id -> member code
CREATE TABLE `__staff_code` (
	`id` integer PRIMARY KEY NOT NULL,
	`member_code` text NOT NULL UNIQUE
);
--> statement-breakpoint
INSERT INTO `__staff_code`("id", "member_code")
SELECT s."id",
	CASE
		WHEN (SELECT count(*) FROM `member` m WHERE lower(m."full_name") = lower(trim(s."nome"))) = 1
			AND (SELECT count(*) FROM `staff_member` o WHERE lower(trim(o."nome")) = lower(trim(s."nome"))) = 1
		THEN (SELECT m."member_code" FROM `member` m WHERE lower(m."full_name") = lower(trim(s."nome")))
		ELSE 'X-' || s."slug"
	END
FROM `staff_member` s;--> statement-breakpoint
INSERT INTO `member`("member_code", "full_name", "birthday")
SELECT c."member_code", s."nome", NULL FROM `__staff_code` c JOIN `staff_member` s ON s."id" = c."id" WHERE c."member_code" LIKE 'X-%';--> statement-breakpoint

CREATE TABLE `__new_staff_member` (
	`member_code` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`nome` text NOT NULL,
	`nome_caccia` text,
	`ruolo` text DEFAULT '' NOT NULL,
	`staff` text DEFAULT '' NOT NULL,
	`coca` integer DEFAULT true NOT NULL,
	`desc` text,
	`img` text,
	`img_file_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`order` integer,
	`email` text,
	`is_admin` integer DEFAULT false NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`member_code`) REFERENCES `member`(`member_code`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "rs_without_email" CHECK("__new_staff_member"."coca" = 1 OR "__new_staff_member"."email" IS NULL)
);
--> statement-breakpoint
INSERT INTO `__new_staff_member`("member_code", "slug", "nome", "nome_caccia", "ruolo", "staff", "coca", "desc", "img", "img_file_id", "position", "order", "email", "is_admin", "deleted_at")
SELECT c."member_code", s."slug", s."nome", s."nome_caccia", s."ruolo", s."staff", s."coca", s."desc", s."img", s."img_file_id", s."position", s."order", s."email", s."is_admin", s."deleted_at"
FROM `staff_member` s JOIN `__staff_code` c ON c."id" = s."id";--> statement-breakpoint

CREATE TABLE `__new_year_project` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_code` text NOT NULL,
	`scout_year` text NOT NULL,
	`sections` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`member_code`) REFERENCES `staff_member`(`member_code`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`scout_year`) REFERENCES `scout_year`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_year_project`("id", "member_code", "scout_year", "sections", "updated_at")
SELECT p."id", c."member_code", p."scout_year", p."sections", p."updated_at"
FROM `year_project` p JOIN `__staff_code` c ON c."id" = p."staff_member_id";--> statement-breakpoint

DROP TABLE `year_project`;--> statement-breakpoint
DROP TABLE `staff_member`;--> statement-breakpoint
DROP TABLE `__staff_code`;--> statement-breakpoint
ALTER TABLE `__new_staff_member` RENAME TO `staff_member`;--> statement-breakpoint
ALTER TABLE `__new_year_project` RENAME TO `year_project`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `staff_member_slug_unique` ON `staff_member` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `staff_member_email_unique` ON `staff_member` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `year_project_memberCode_scoutYear_unique` ON `year_project` (`member_code`,`scout_year`);--> statement-breakpoint
CREATE INDEX `year_project_scout_year_idx` ON `year_project` (`scout_year`,`updated_at`);--> statement-breakpoint
CREATE INDEX `rate_limit_reset_at_idx` ON `rate_limit` (`reset_at`);
