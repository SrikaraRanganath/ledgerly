CREATE TABLE `zatca_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`at` integer NOT NULL,
	`type` text NOT NULL,
	`detail` text,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `invoices` ADD `invoice_hash` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `type` text DEFAULT 'simplified' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `buyer_name` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `buyer_vat` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `icv` integer;--> statement-breakpoint
ALTER TABLE `invoices` ADD `xml` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `qr` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `rejection_message` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `cleared_at` integer;--> statement-breakpoint
ALTER TABLE `invoices` ADD `attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `next_retry_at` integer;