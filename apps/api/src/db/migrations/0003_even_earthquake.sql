DROP INDEX `ledger_date_idx`;--> statement-breakpoint
CREATE INDEX `ledger_date_idx` ON `ledger_entries` (`entry_date`,`id`);