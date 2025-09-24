CREATE TABLE IF NOT EXISTS "banzuke" (
	"id" text PRIMARY KEY NOT NULL,
	"basho_id" text NOT NULL,
	"division" text NOT NULL,
	"rank" text NOT NULL,
	"side" text NOT NULL,
	"rikishi_id" text,
	"rikishi_name" text,
	"stable" text,
	"year" integer,
	"month" integer,
	"season_name" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "basho" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"division" text NOT NULL,
	"participants" jsonb DEFAULT '[]',
	"bouts" jsonb DEFAULT '[]',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bouts" (
	"id" text PRIMARY KEY NOT NULL,
	"basho_id" text,
	"rikishi1_id" text,
	"rikishi2_id" text,
	"winner_id" text,
	"kimarite" text,
	"date" text NOT NULL,
	"day" integer NOT NULL,
	"division" text,
	"match_no" integer,
	"east_id" integer,
	"east_shikona" text,
	"east_rank" text,
	"west_id" integer,
	"west_shikona" text,
	"west_rank" text,
	"winner_en" text,
	"winner_jp" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kimarite" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"category" text DEFAULT 'Unknown',
	"description" text,
	"count" integer DEFAULT 0,
	"last_used" text,
	"percentage" numeric(5, 2),
	"rarity" text,
	"effectiveness" text,
	"popularity_trend" text,
	"last_used_days_ago" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "measurements" (
	"id" text PRIMARY KEY NOT NULL,
	"basho_id" text NOT NULL,
	"rikishi_id" text,
	"rikishi_name" text,
	"height" integer NOT NULL,
	"weight" integer NOT NULL,
	"bmi" numeric(4, 1),
	"bmi_category" text,
	"height_percentile" integer,
	"weight_percentile" integer,
	"power_index" integer,
	"weight_height_ratio" numeric(4, 2),
	"year" integer,
	"month" integer,
	"season_name" text,
	"comparison_to_average" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ranks" (
	"id" text PRIMARY KEY NOT NULL,
	"basho_id" text NOT NULL,
	"rikishi_id" text,
	"rikishi_name" text,
	"rank" text NOT NULL,
	"division" text,
	"rank_number" integer,
	"side" text,
	"year" integer,
	"month" integer,
	"season_name" text,
	"is_promotion" boolean,
	"is_demotion" boolean,
	"previous_rank" text,
	"rank_change" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rikishi" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"shikona_en" text,
	"shikona_jp" text,
	"rank" text NOT NULL,
	"stable" text NOT NULL,
	"weight" integer DEFAULT 0,
	"height" integer DEFAULT 0,
	"birth_date" text,
	"debut" text,
	"wins" integer DEFAULT 0,
	"losses" integer DEFAULT 0,
	"draws" integer DEFAULT 0,
	"sumodb_id" integer,
	"nsk_id" integer,
	"current_rank" text,
	"heya" text,
	"shusshin" text,
	"updated_at" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shikonas" (
	"id" text PRIMARY KEY NOT NULL,
	"basho_id" text NOT NULL,
	"rikishi_id" text,
	"rikishi_name" text,
	"shikona" text NOT NULL,
	"shikona_en" text,
	"shikona_jp" text,
	"year" integer,
	"month" integer,
	"season_name" text,
	"is_new_shikona" boolean,
	"previous_shikona" text,
	"shikona_history" jsonb DEFAULT '[]',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "torikumi" (
	"id" text PRIMARY KEY NOT NULL,
	"basho_id" text NOT NULL,
	"division" text NOT NULL,
	"day" integer NOT NULL,
	"match_no" integer NOT NULL,
	"east_id" integer,
	"east_shikona" text,
	"east_rank" text,
	"west_id" integer,
	"west_shikona" text,
	"west_rank" text,
	"winner_id" integer,
	"kimarite" text,
	"winner_en" text,
	"winner_jp" text,
	"year" integer,
	"month" integer,
	"season_name" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "banzuke" ADD CONSTRAINT "banzuke_rikishi_id_rikishi_id_fk" FOREIGN KEY ("rikishi_id") REFERENCES "public"."rikishi"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bouts" ADD CONSTRAINT "bouts_basho_id_basho_id_fk" FOREIGN KEY ("basho_id") REFERENCES "public"."basho"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bouts" ADD CONSTRAINT "bouts_rikishi1_id_rikishi_id_fk" FOREIGN KEY ("rikishi1_id") REFERENCES "public"."rikishi"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bouts" ADD CONSTRAINT "bouts_rikishi2_id_rikishi_id_fk" FOREIGN KEY ("rikishi2_id") REFERENCES "public"."rikishi"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bouts" ADD CONSTRAINT "bouts_winner_id_rikishi_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."rikishi"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "measurements" ADD CONSTRAINT "measurements_rikishi_id_rikishi_id_fk" FOREIGN KEY ("rikishi_id") REFERENCES "public"."rikishi"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ranks" ADD CONSTRAINT "ranks_rikishi_id_rikishi_id_fk" FOREIGN KEY ("rikishi_id") REFERENCES "public"."rikishi"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shikonas" ADD CONSTRAINT "shikonas_rikishi_id_rikishi_id_fk" FOREIGN KEY ("rikishi_id") REFERENCES "public"."rikishi"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
