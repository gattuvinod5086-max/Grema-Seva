CREATE TABLE "place_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" text NOT NULL,
	"district" text NOT NULL,
	"mandal" text,
	"village" text,
	"image_url" text NOT NULL,
	"caption" text,
	"updated_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "place_images" ADD CONSTRAINT "place_images_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "place_images_geo_idx" ON "place_images" USING btree ("district","mandal","village");--> statement-breakpoint
CREATE INDEX "place_images_level_idx" ON "place_images" USING btree ("level");