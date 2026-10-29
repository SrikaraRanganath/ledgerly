CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name_en` text NOT NULL,
	`name_ar` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_code_unique` ON `accounts` (`code`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`vat_number` text
);
--> statement-breakpoint
CREATE TABLE `invoice_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`qty` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`vat_rate` integer NOT NULL,
	`line_total` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uuid` text NOT NULL,
	`number` text NOT NULL,
	`customer_id` integer,
	`issued_at` integer NOT NULL,
	`subtotal` integer NOT NULL,
	`vat_total` integer NOT NULL,
	`total` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`rejection_code` text,
	`previous_hash` text,
	`hash` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_uuid_unique` ON `invoices` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_number_unique` ON `invoices` (`number`);--> statement-breakpoint
CREATE INDEX `invoices_status_idx` ON `invoices` (`status`);--> statement-breakpoint
CREATE TABLE `ledger_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`journal_id` text NOT NULL,
	`entry_date` integer NOT NULL,
	`reference` text NOT NULL,
	`description` text NOT NULL,
	`account_id` integer NOT NULL,
	`debit` integer DEFAULT 0 NOT NULL,
	`credit` integer DEFAULT 0 NOT NULL,
	`invoice_id` integer,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ledger_account_idx` ON `ledger_entries` (`account_id`);--> statement-breakpoint
CREATE INDEX `ledger_date_idx` ON `ledger_entries` (`entry_date`);--> statement-breakpoint
CREATE INDEX `ledger_journal_idx` ON `ledger_entries` (`journal_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sku` text NOT NULL,
	`name_en` text NOT NULL,
	`name_ar` text NOT NULL,
	`price_halalas` integer NOT NULL,
	`vat_rate` integer DEFAULT 15 NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);