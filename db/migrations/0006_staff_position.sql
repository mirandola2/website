ALTER TABLE `staff_member` ADD `position` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Keep the current order (row ids, as in the CSV)
UPDATE `staff_member` SET `position` = `id`;