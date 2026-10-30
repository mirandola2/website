ALTER TABLE `scout_year` ADD `template` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
-- Years are now added by admins: create the ones that existed implicitly (any year with projects,
-- and the current one), with the visibility they had (only the current year was visible and active)
WITH `current` AS (
  SELECT printf('%d-%02d', `y`, (`y` + 1) % 100) AS `id`
  FROM (SELECT CAST(strftime('%Y', 'now') AS integer) - (CAST(strftime('%m', 'now') AS integer) < 9) AS `y`)
)
INSERT OR IGNORE INTO `scout_year` (`id`, `question`, `visible`, `active`)
SELECT `years`.`id`, 'Che pozione userai?', `years`.`id` = `current`.`id`, `years`.`id` = `current`.`id`
FROM (SELECT DISTINCT `scout_year` AS `id` FROM `year_project` UNION SELECT `id` FROM `current`) AS `years`, `current`;--> statement-breakpoint
-- Every year gets the paper template, with its own question
UPDATE `scout_year` SET `template` = json_object(
  'areas', json('[{"id": "servizio", "title": "Io e il Servizio", "subtitle": "competenza metodologica, adeguatezza al mio ruolo di capo, relazione in staff, ragazzi e genitori"}, {"id": "realta", "title": "Io e la Realtà", "subtitle": "responsabilità sociale e politica"}, {"id": "associazione", "title": "Io e l’Associazione", "subtitle": "Co.Ca., Zona, eventi, formazione personale e permanente"}, {"id": "fede", "title": "Io e la Fede", "subtitle": "la mia scelta cristiana"}]'),
  'questions', json_array(
    json_object('id', 'obiettivi', 'label', 'Obiettivi', 'kind', 'long'),
    json_object('id', 'strumenti', 'label', 'Strumenti', 'kind', 'long'),
    json_object('id', 'risposta', 'label', `question`, 'kind', 'short'),
    json_object('id', 'inizio', 'label', 'Verifica di inizio anno', 'kind', 'score'),
    json_object('id', 'meta', 'label', 'Verifica di metà anno', 'kind', 'score'),
    json_object('id', 'fine', 'label', 'Verifica di fine anno', 'kind', 'score')
  )
);--> statement-breakpoint
ALTER TABLE `year_project` ALTER COLUMN "scout_year" TO "scout_year" text NOT NULL REFERENCES scout_year(id) ON DELETE no action ON UPDATE no action;