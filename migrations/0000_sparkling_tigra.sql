CREATE TABLE "ai_configurations" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_id" integer,
	"include_positive_tests" boolean DEFAULT true,
	"include_edge_cases" boolean DEFAULT true,
	"include_security_cases" boolean DEFAULT false,
	"test_complexity" text DEFAULT 'medium',
	"additional_instructions" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_context" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_context" json DEFAULT '[]'::json,
	"domain_knowledge" json DEFAULT '[]'::json,
	"testing_patterns" json DEFAULT '[]'::json,
	"custom_instructions" text,
	"config_id" integer,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "azure_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_url" text NOT NULL,
	"pat_token" text NOT NULL,
	"project" text NOT NULL,
	"iteration_path" text,
	"openai_key" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "environment_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_id" integer,
	"operating_system" text NOT NULL,
	"os_version" text,
	"web_browser" text,
	"browser_version" text,
	"mobile_device" text,
	"mobile_version" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "test_case_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_case_id" integer,
	"feedback_type" text NOT NULL,
	"feedback_text" text NOT NULL,
	"user_email" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "test_case_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_case_id" integer,
	"linked_user_story_id" text NOT NULL,
	"link_type" text DEFAULT 'tests' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "test_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"objective" text NOT NULL,
	"prerequisites" json DEFAULT '[]'::json,
	"test_steps" json DEFAULT '[]'::json,
	"expected_result" text NOT NULL,
	"priority" text NOT NULL,
	"test_type" text DEFAULT 'web' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_story_id" integer,
	"azure_test_case_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "test_data_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_id" integer,
	"username" text,
	"password" text,
	"web_portal_url" text,
	"permissions" json DEFAULT '[]'::json,
	"additional_data" json DEFAULT '{}'::json,
	"uploaded_files" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "test_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"azure_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"state" text NOT NULL,
	"config_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "test_plans_azure_id_unique" UNIQUE("azure_id")
);
--> statement-breakpoint
CREATE TABLE "test_suites" (
	"id" serial PRIMARY KEY NOT NULL,
	"azure_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"test_plan_id" integer,
	"config_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "test_suites_azure_id_unique" UNIQUE("azure_id")
);
--> statement-breakpoint
CREATE TABLE "user_stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"azure_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"acceptance_criteria" text,
	"state" text NOT NULL,
	"assigned_to" text,
	"priority" text,
	"created_date" text,
	"tags" json DEFAULT '[]'::json,
	"config_id" integer,
	CONSTRAINT "user_stories_azure_id_unique" UNIQUE("azure_id")
);
--> statement-breakpoint
ALTER TABLE "ai_configurations" ADD CONSTRAINT "ai_configurations_config_id_azure_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."azure_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_context" ADD CONSTRAINT "ai_context_config_id_azure_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."azure_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environment_configs" ADD CONSTRAINT "environment_configs_config_id_azure_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."azure_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_case_feedback" ADD CONSTRAINT "test_case_feedback_test_case_id_test_cases_id_fk" FOREIGN KEY ("test_case_id") REFERENCES "public"."test_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_case_links" ADD CONSTRAINT "test_case_links_test_case_id_test_cases_id_fk" FOREIGN KEY ("test_case_id") REFERENCES "public"."test_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_user_story_id_user_stories_id_fk" FOREIGN KEY ("user_story_id") REFERENCES "public"."user_stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_data_configs" ADD CONSTRAINT "test_data_configs_config_id_azure_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."azure_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_plans" ADD CONSTRAINT "test_plans_config_id_azure_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."azure_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_suites" ADD CONSTRAINT "test_suites_test_plan_id_test_plans_id_fk" FOREIGN KEY ("test_plan_id") REFERENCES "public"."test_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_suites" ADD CONSTRAINT "test_suites_config_id_azure_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."azure_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stories" ADD CONSTRAINT "user_stories_config_id_azure_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."azure_configs"("id") ON DELETE no action ON UPDATE no action;