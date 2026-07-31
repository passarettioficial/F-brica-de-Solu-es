CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"name" text NOT NULL,
	"briefing" text DEFAULT '' NOT NULL,
	"current_phase" integer DEFAULT 1 NOT NULL,
	"coherence_score" integer,
	"coherence_data" jsonb,
	"coherence_updated_at" timestamp with time zone,
	"market_potential_score" integer,
	"market_potential_data" jsonb,
	"market_potential_updated_at" timestamp with time zone,
	"share_id" text,
	"shared_at" timestamp with time zone,
	"is_demo" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_share_id_unique" UNIQUE("share_id")
);
--> statement-breakpoint
CREATE TABLE "market_validations" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"phase_number" integer NOT NULL,
	"interview_script" text,
	"interview_notes" text,
	"ai_analysis" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phases" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"phase_number" integer NOT NULL,
	"status" text DEFAULT 'locked' NOT NULL,
	"gate1_checked" boolean DEFAULT false NOT NULL,
	"gate2_checked" boolean DEFAULT false NOT NULL,
	"gate3_checked" boolean DEFAULT false NOT NULL,
	"is_generating" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phase_artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"phase_id" integer NOT NULL,
	"artifact_key" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"content_json" text,
	"downloaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artifact_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"phase_id" integer NOT NULL,
	"artifact_key" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"content_json" text,
	"source" text NOT NULL,
	"created_by_clerk_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"display_name" text,
	"daily_ai_usage" integer DEFAULT 0 NOT NULL,
	"daily_ai_reset_date" text DEFAULT '' NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_subscription_status" text,
	"pending_checkout_session_id" text,
	"pending_checkout_expires_at" timestamp with time zone,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_superuser" boolean DEFAULT false NOT NULL,
	"founder_profile" jsonb,
	"profile_stage" integer DEFAULT 0 NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"lgpd_consent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"coupon_id" integer NOT NULL,
	"clerk_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"billing_cycle" text NOT NULL,
	"discount_type" text NOT NULL,
	"discount_value" real NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"discount_type" text DEFAULT 'percent' NOT NULL,
	"discount_value" real DEFAULT 0 NOT NULL,
	"max_uses" integer,
	"uses_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"applies_to" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"label" text,
	"category" text DEFAULT 'general' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"actor_clerk_id" text,
	"actor_name" text,
	"target_clerk_id" text,
	"target_name" text,
	"meta" text,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"project_id" integer,
	"phase_id" integer,
	"event_type" text NOT NULL,
	"meta" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artifact_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"phase_number" integer NOT NULL,
	"artifact_key" text NOT NULL,
	"rating" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "market_validations" ADD CONSTRAINT "market_validations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phases" ADD CONSTRAINT "phases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_artifacts" ADD CONSTRAINT "phase_artifacts_phase_id_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_versions" ADD CONSTRAINT "artifact_versions_phase_id_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_feedback" ADD CONSTRAINT "artifact_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_clerk_id_idx" ON "projects" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "projects_deleted_at_idx" ON "projects" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_one_active_demo_per_user" ON "projects" USING btree ("clerk_id") WHERE "projects"."is_demo" = true AND "projects"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "market_validations_project_phase_unique" ON "market_validations" USING btree ("project_id","phase_number");--> statement-breakpoint
CREATE INDEX "market_validations_project_id_idx" ON "market_validations" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "phases_project_phase_unique" ON "phases" USING btree ("project_id","phase_number");--> statement-breakpoint
CREATE INDEX "phases_project_id_idx" ON "phases" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "phase_artifacts_phase_key_unique" ON "phase_artifacts" USING btree ("phase_id","artifact_key");--> statement-breakpoint
CREATE INDEX "phase_artifacts_phase_id_idx" ON "phase_artifacts" USING btree ("phase_id");--> statement-breakpoint
CREATE INDEX "artifact_versions_phase_key_idx" ON "artifact_versions" USING btree ("phase_id","artifact_key","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_redemptions_coupon_user_unique" ON "coupon_redemptions" USING btree ("coupon_id","clerk_id");--> statement-breakpoint
CREATE INDEX "coupon_redemptions_clerk_id_idx" ON "coupon_redemptions" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_event_type_idx" ON "audit_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_clerk_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "events_clerk_id_idx" ON "events" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "events_project_id_idx" ON "events" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "events_event_type_idx" ON "events" USING btree ("event_type");--> statement-breakpoint
CREATE UNIQUE INDEX "artifact_feedback_user_artifact_uniq" ON "artifact_feedback" USING btree ("user_id","project_id","phase_number","artifact_key");--> statement-breakpoint
CREATE INDEX "artifact_feedback_artifact_idx" ON "artifact_feedback" USING btree ("project_id","phase_number","artifact_key");--> statement-breakpoint
CREATE INDEX "artifact_feedback_rating_idx" ON "artifact_feedback" USING btree ("rating");