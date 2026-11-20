-- Core Treniq schema. Apply only to a new, disposable local Supabase database.
SET search_path = public, extensions;

SET check_function_bodies = false;

CREATE TABLE "public"."appointments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "coach_id" uuid NOT NULL,
  "client_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "start_time" timestamp with time zone NOT NULL,
  "end_time" timestamp with time zone NOT NULL,
  "status" text DEFAULT 'scheduled'::text,
  "location" text,
  "meeting_link" text,
  "reminder_sent" boolean DEFAULT false,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "type" text DEFAULT 'consultation'::text
);

ALTER TABLE "public"."appointments" OWNER TO "postgres";

ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."client_devices" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid NOT NULL,
  "expo_push_token" text NOT NULL,
  "device_name" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "public"."client_devices" OWNER TO "postgres";

ALTER TABLE "public"."client_devices" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."client_files" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid NOT NULL,
  "coach_id" uuid NOT NULL,
  "file_name" text NOT NULL,
  "file_url" text NOT NULL,
  "file_type" text NOT NULL,
  "file_size" integer,
  "category" text DEFAULT 'other'::text,
  "description" text,
  "uploaded_by" text DEFAULT 'coach'::text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "file_path" text
);

ALTER TABLE "public"."client_files" OWNER TO "postgres";

ALTER TABLE "public"."client_files" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."clients" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "coach_id" uuid NOT NULL,
  "full_name" text NOT NULL,
  "email" text,
  "phone" text,
  "birth_date" date,
  "gender" text,
  "address" text,
  "emergency_contact" text,
  "emergency_phone" text,
  "medical_conditions" text,
  "medications" text,
  "allergies" text,
  "injuries" text,
  "goals" text,
  "status" text DEFAULT 'active'::text,
  "notes" text,
  "deleted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "weight_goal" numeric(5,1),
  "weekly_goal" integer DEFAULT 3
);

ALTER TABLE "public"."clients" OWNER TO "postgres";

ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;





CREATE TABLE "public"."coach_profiles" (
  "id" uuid NOT NULL,
  "full_name" text NOT NULL,
  "email" text NOT NULL,
  "avatar_url" text,
  "phone" text,
  "gym_name" text,
  "specialization" text[],
  "years_experience" integer,
  "bio" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "trial_start" timestamp with time zone,
  "trial_end" timestamp with time zone,
  "subscription_status" text DEFAULT 'trial'::text,
  "subscription_plan" text,
  "subscription_id" text,
  "onboarding_completed" boolean DEFAULT false,
  "plan" text
);

ALTER TABLE "public"."coach_profiles" OWNER TO "postgres";

ALTER TABLE "public"."coach_profiles" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."coach_subscriptions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "coach_id" uuid NOT NULL,
  "plan_id" text NOT NULL,
  "status" text NOT NULL,
  "current_period_start" timestamp with time zone NOT NULL,
  "current_period_end" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "public"."coach_subscriptions" OWNER TO "postgres";

ALTER TABLE "public"."coach_subscriptions" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."daily_meal_entries" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "meal_plan_id" uuid NOT NULL,
  "day_of_week" integer NOT NULL,
  "meal_type" text NOT NULL,
  "food_name" text NOT NULL,
  "quantity" numeric(5,1),
  "unit" text DEFAULT 'g'::text,
  "calories" integer,
  "protein" numeric(5,1),
  "carbs" numeric(5,1),
  "fat" numeric(5,1),
  "notes" text,
  "order_index" integer DEFAULT 0
);

ALTER TABLE "public"."daily_meal_entries" OWNER TO "postgres";

ALTER TABLE "public"."daily_meal_entries" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."exercise_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid NOT NULL,
  "workout_plan_id" uuid NOT NULL,
  "exercise_id" uuid NOT NULL,
  "performed_at" date DEFAULT CURRENT_DATE NOT NULL,
  "sets_completed" integer NOT NULL,
  "reps_completed" text NOT NULL,
  "weight_used" numeric(5,1),
  "completed" boolean DEFAULT true,
  "feeling" integer,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "public"."exercise_logs" OWNER TO "postgres";

ALTER TABLE "public"."exercise_logs" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."exercises" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "workout_plan_id" uuid NOT NULL,
  "day_of_week" integer,
  "name" text NOT NULL,
  "category" text,
  "sets" integer DEFAULT 3,
  "min_reps" integer,
  "max_reps" integer,
  "weight" numeric(5,1),
  "duration" integer,
  "distance" numeric(5,1),
  "rest_time" integer,
  "video_url" text,
  "notes" text,
  "order_index" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "public"."exercises" OWNER TO "postgres";

ALTER TABLE "public"."exercises" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."master_exercises" (
  "id" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."master_exercises_id_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "muscle_group" text,
  "equipment" text,
  "video_url" text,
  "image_url" text,
  "difficulty" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "name_hu" text,
  "name_en" text,
  "name_sk" text,
  "description_hu" text,
  "description_en" text,
  "description_sk" text
);

ALTER TABLE "public"."master_exercises" OWNER TO "postgres";

ALTER TABLE "public"."master_exercises" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."meal_plan_templates" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "coach_id" uuid,
  "name" text NOT NULL,
  "description" text,
  "content" text NOT NULL,
  "daily_calories" integer,
  "daily_protein" numeric(5,1),
  "daily_carbs" numeric(5,1),
  "daily_fat" numeric(5,1),
  "notes" text,
  "is_public" boolean DEFAULT false,
  "usage_count" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "public"."meal_plan_templates" OWNER TO "postgres";

ALTER TABLE "public"."meal_plan_templates" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."meal_plans" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "coach_id" uuid,
  "client_id" uuid,
  "name" text NOT NULL,
  "description" text,
  "content" text NOT NULL,
  "daily_calories" integer,
  "daily_protein" numeric(5,1),
  "daily_carbs" numeric(5,1),
  "daily_fat" numeric(5,1),
  "notes" text,
  "status" text DEFAULT 'active'::text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "shopping_list" text,
  "options" text
);

ALTER TABLE "public"."meal_plans" OWNER TO "postgres";

ALTER TABLE "public"."meal_plans" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."measurements" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid NOT NULL,
  "measured_at" date DEFAULT CURRENT_DATE NOT NULL,
  "weight" numeric(5,1),
  "height" numeric(5,1),
  "body_fat" numeric(4,1),
  "muscle_mass" numeric(5,1),
  "bmi" numeric(4,1) GENERATED ALWAYS AS (
CASE
    WHEN ((height > (0)::numeric) AND (weight > (0)::numeric)) THEN round(((weight / (height / (100)::numeric)) / (height / (100)::numeric)), 1)
    ELSE NULL::numeric
END) STORED,
  "chest" numeric(5,1),
  "waist" numeric(5,1),
  "hips" numeric(5,1),
  "arm_left" numeric(5,1),
  "arm_right" numeric(5,1),
  "thigh_left" numeric(5,1),
  "thigh_right" numeric(5,1),
  "blood_pressure_systolic" integer,
  "blood_pressure_diastolic" integer,
  "resting_heart_rate" integer,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "public"."measurements" OWNER TO "postgres";

ALTER TABLE "public"."measurements" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."memberships" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid NOT NULL,
  "plan_name" text NOT NULL,
  "price" numeric(10,2) NOT NULL,
  "currency" text DEFAULT 'EUR'::text,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "status" text DEFAULT 'active'::text,
  "payment_method" text,
  "last_payment_date" date,
  "next_payment_date" date,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "coach_id" uuid
);

ALTER TABLE "public"."memberships" OWNER TO "postgres";

ALTER TABLE "public"."memberships" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."messages" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "sender_id" uuid NOT NULL,
  "receiver_id" uuid NOT NULL,
  "message" text NOT NULL,
  "is_read" boolean DEFAULT false,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "sender_deleted_at" timestamp with time zone,
  "receiver_deleted_at" timestamp with time zone,
  "message_type" text DEFAULT 'text'::text,
  "voice_url" text,
  "voice_duration" integer
);

ALTER TABLE "public"."messages" OWNER TO "postgres";

ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."notifications" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "type" text,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "scheduled_for" timestamp with time zone,
  "is_sent" boolean DEFAULT false,
  "is_read" boolean DEFAULT false,
  "sent_at" timestamp with time zone,
  "read_at" timestamp with time zone,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "public"."notifications" OWNER TO "postgres";

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."progress_photos" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid NOT NULL,
  "photo_url" text NOT NULL,
  "photo_type" text,
  "taken_at" date DEFAULT CURRENT_DATE,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "public"."progress_photos" OWNER TO "postgres";

ALTER TABLE "public"."progress_photos" ENABLE ROW LEVEL SECURITY;





CREATE TABLE "public"."workout_log_exercises" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "workout_log_id" uuid NOT NULL,
  "exercise_name" text NOT NULL,
  "sets_completed" integer,
  "reps_completed" text,
  "weight_used" text,
  "duration_completed" integer,
  "distance_completed" numeric(5,1),
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "exercise_id" uuid
);

ALTER TABLE "public"."workout_log_exercises" OWNER TO "postgres";

ALTER TABLE "public"."workout_log_exercises" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."workout_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid NOT NULL,
  "workout_plan_id" uuid,
  "performed_at" date DEFAULT CURRENT_DATE NOT NULL,
  "duration" integer,
  "calories_burned" integer,
  "feeling" integer,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "public"."workout_logs" OWNER TO "postgres";

ALTER TABLE "public"."workout_logs" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."workout_plans" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "coach_id" uuid NOT NULL,
  "client_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "difficulty" text,
  "weekly_frequency" integer,
  "start_date" date,
  "end_date" date,
  "status" text DEFAULT 'active'::text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "public"."workout_plans" OWNER TO "postgres";

ALTER TABLE "public"."workout_plans" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."appointments" ADD CONSTRAINT "appointments_pkey" PRIMARY KEY (id);

ALTER TABLE public."appointments" ADD CONSTRAINT "appointments_status_check" CHECK (status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text]));

ALTER TABLE public."appointments" ADD CONSTRAINT "appointments_type_check" CHECK (type = ANY (ARRAY['workout'::text, 'consultation'::text, 'measurement'::text, 'other'::text]));

ALTER TABLE public."client_devices" ADD CONSTRAINT "client_devices_pkey" PRIMARY KEY (id);

ALTER TABLE public."client_files" ADD CONSTRAINT "client_files_category_check" CHECK (category = ANY (ARRAY['workout_plan'::text, 'nutrition'::text, 'progress_photo'::text, 'video_tutorial'::text, 'other'::text]));

ALTER TABLE public."client_files" ADD CONSTRAINT "client_files_pkey" PRIMARY KEY (id);

ALTER TABLE public."client_files" ADD CONSTRAINT "client_files_uploaded_by_check" CHECK (uploaded_by = ANY (ARRAY['coach'::text, 'client'::text]));

ALTER TABLE public."clients" ADD CONSTRAINT "clients_gender_check" CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text]));

ALTER TABLE public."clients" ADD CONSTRAINT "clients_pkey" PRIMARY KEY (id);

ALTER TABLE public."clients" ADD CONSTRAINT "clients_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text]));


ALTER TABLE public."coach_profiles" ADD CONSTRAINT "coach_profiles_email_unique" UNIQUE (email);

ALTER TABLE public."coach_profiles" ADD CONSTRAINT "coach_profiles_pkey" PRIMARY KEY (id);

ALTER TABLE public."coach_profiles" ADD CONSTRAINT "coach_profiles_subscription_status_check" CHECK (subscription_status = ANY (ARRAY['trial'::text, 'active'::text, 'expired'::text, 'cancelled'::text]));

ALTER TABLE public."coach_subscriptions" ADD CONSTRAINT "coach_subscriptions_pkey" PRIMARY KEY (id);

ALTER TABLE public."coach_subscriptions" ADD CONSTRAINT "coach_subscriptions_status_check" CHECK (status = ANY (ARRAY['active'::text, 'past_due'::text, 'canceled'::text, 'incomplete'::text]));

ALTER TABLE public."daily_meal_entries" ADD CONSTRAINT "daily_meal_entries_day_of_week_check" CHECK (day_of_week >= 1 AND day_of_week <= 7);

ALTER TABLE public."daily_meal_entries" ADD CONSTRAINT "daily_meal_entries_meal_type_check" CHECK (meal_type = ANY (ARRAY['breakfast'::text, 'morning_snack'::text, 'lunch'::text, 'afternoon_snack'::text, 'dinner'::text, 'evening_snack'::text]));

ALTER TABLE public."daily_meal_entries" ADD CONSTRAINT "daily_meal_entries_pkey" PRIMARY KEY (id);

ALTER TABLE public."exercise_logs" ADD CONSTRAINT "exercise_logs_feeling_check" CHECK (feeling >= 1 AND feeling <= 10);

ALTER TABLE public."exercise_logs" ADD CONSTRAINT "exercise_logs_pkey" PRIMARY KEY (id);

ALTER TABLE public."exercises" ADD CONSTRAINT "exercises_category_check" CHECK (category = ANY (ARRAY['chest'::text, 'back'::text, 'legs'::text, 'shoulders'::text, 'arms'::text, 'cardio'::text, 'core'::text, 'full_body'::text]));

ALTER TABLE public."exercises" ADD CONSTRAINT "exercises_day_of_week_check" CHECK (day_of_week >= 1 AND day_of_week <= 7);

ALTER TABLE public."exercises" ADD CONSTRAINT "exercises_pkey" PRIMARY KEY (id);

ALTER TABLE public."master_exercises" ADD CONSTRAINT "master_exercises_difficulty_check" CHECK (difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text]));

ALTER TABLE public."master_exercises" ADD CONSTRAINT "master_exercises_pkey" PRIMARY KEY (id);

ALTER TABLE public."meal_plan_templates" ADD CONSTRAINT "meal_plan_templates_pkey" PRIMARY KEY (id);

ALTER TABLE public."meal_plans" ADD CONSTRAINT "meal_plans_pkey" PRIMARY KEY (id);

ALTER TABLE public."meal_plans" ADD CONSTRAINT "meal_plans_status_check" CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'archived'::text]));

ALTER TABLE public."measurements" ADD CONSTRAINT "chk_body_fat_range" CHECK (body_fat IS NULL OR body_fat >= 0::numeric AND body_fat <= 70::numeric);

ALTER TABLE public."measurements" ADD CONSTRAINT "chk_chest_positive" CHECK (chest IS NULL OR chest > 0::numeric);

ALTER TABLE public."measurements" ADD CONSTRAINT "chk_diastolic_range" CHECK (blood_pressure_diastolic IS NULL OR blood_pressure_diastolic >= 30 AND blood_pressure_diastolic <= 200);

ALTER TABLE public."measurements" ADD CONSTRAINT "chk_height_positive" CHECK (height IS NULL OR height > 0::numeric);

ALTER TABLE public."measurements" ADD CONSTRAINT "chk_hips_positive" CHECK (hips IS NULL OR hips > 0::numeric);

ALTER TABLE public."measurements" ADD CONSTRAINT "chk_muscle_mass_positive" CHECK (muscle_mass IS NULL OR muscle_mass > 0::numeric);

ALTER TABLE public."measurements" ADD CONSTRAINT "chk_resting_hr_range" CHECK (resting_heart_rate IS NULL OR resting_heart_rate >= 20 AND resting_heart_rate <= 250);

ALTER TABLE public."measurements" ADD CONSTRAINT "chk_systolic_range" CHECK (blood_pressure_systolic IS NULL OR blood_pressure_systolic >= 50 AND blood_pressure_systolic <= 300);

ALTER TABLE public."measurements" ADD CONSTRAINT "chk_waist_positive" CHECK (waist IS NULL OR waist > 0::numeric);

ALTER TABLE public."measurements" ADD CONSTRAINT "chk_weight_positive" CHECK (weight IS NULL OR weight > 0::numeric);

ALTER TABLE public."measurements" ADD CONSTRAINT "measurements_client_id_measured_at_key" UNIQUE (client_id, measured_at);

ALTER TABLE public."measurements" ADD CONSTRAINT "measurements_pkey" PRIMARY KEY (id);

ALTER TABLE public."memberships" ADD CONSTRAINT "chk_membership_dates_order" CHECK (end_date >= start_date);

ALTER TABLE public."memberships" ADD CONSTRAINT "chk_price_positive" CHECK (price >= 0::numeric);

ALTER TABLE public."memberships" ADD CONSTRAINT "memberships_pkey" PRIMARY KEY (id);

ALTER TABLE public."memberships" ADD CONSTRAINT "memberships_status_check" CHECK (status = ANY (ARRAY['active'::text, 'expired'::text, 'cancelled'::text, 'pending'::text]));

ALTER TABLE public."messages" ADD CONSTRAINT "messages_pkey" PRIMARY KEY (id);

ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY (id);

ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_type_check" CHECK (type = ANY (ARRAY['workout_reminder'::text, 'measurement_reminder'::text, 'payment_due'::text, 'message'::text, 'appointment'::text, 'goal_achieved'::text, 'general'::text]));

ALTER TABLE public."progress_photos" ADD CONSTRAINT "progress_photos_photo_type_check" CHECK (photo_type = ANY (ARRAY['front'::text, 'back'::text, 'side'::text, 'flexed'::text]));

ALTER TABLE public."progress_photos" ADD CONSTRAINT "progress_photos_pkey" PRIMARY KEY (id);



ALTER TABLE public."workout_log_exercises" ADD CONSTRAINT "workout_log_exercises_pkey" PRIMARY KEY (id);

ALTER TABLE public."workout_logs" ADD CONSTRAINT "chk_calories_positive" CHECK (calories_burned IS NULL OR calories_burned >= 0);

ALTER TABLE public."workout_logs" ADD CONSTRAINT "chk_duration_positive" CHECK (duration IS NULL OR duration > 0);

ALTER TABLE public."workout_logs" ADD CONSTRAINT "workout_logs_feeling_check" CHECK (feeling >= 1 AND feeling <= 10);

ALTER TABLE public."workout_logs" ADD CONSTRAINT "workout_logs_pkey" PRIMARY KEY (id);

ALTER TABLE public."workout_plans" ADD CONSTRAINT "chk_dates_order" CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

ALTER TABLE public."workout_plans" ADD CONSTRAINT "workout_plans_difficulty_check" CHECK (difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text]));

ALTER TABLE public."workout_plans" ADD CONSTRAINT "workout_plans_pkey" PRIMARY KEY (id);

ALTER TABLE public."workout_plans" ADD CONSTRAINT "workout_plans_status_check" CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'archived'::text]));

ALTER TABLE public."appointments" ADD CONSTRAINT "appointments_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE public."appointments" ADD CONSTRAINT "appointments_coach_id_fkey" FOREIGN KEY (coach_id) REFERENCES coach_profiles(id) ON DELETE CASCADE;

ALTER TABLE public."client_devices" ADD CONSTRAINT "client_devices_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE public."client_files" ADD CONSTRAINT "client_files_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE public."client_files" ADD CONSTRAINT "client_files_coach_id_fkey" FOREIGN KEY (coach_id) REFERENCES coach_profiles(id) ON DELETE CASCADE;

ALTER TABLE public."clients" ADD CONSTRAINT "clients_coach_id_fkey" FOREIGN KEY (coach_id) REFERENCES coach_profiles(id) ON DELETE CASCADE;



ALTER TABLE public."coach_profiles" ADD CONSTRAINT "coach_profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."coach_subscriptions" ADD CONSTRAINT "coach_subscriptions_coach_id_fkey" FOREIGN KEY (coach_id) REFERENCES coach_profiles(id) ON DELETE CASCADE;

ALTER TABLE public."daily_meal_entries" ADD CONSTRAINT "daily_meal_entries_meal_plan_id_fkey" FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE;

ALTER TABLE public."exercise_logs" ADD CONSTRAINT "exercise_logs_client_id_fkey" FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."exercise_logs" ADD CONSTRAINT "exercise_logs_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE;

ALTER TABLE public."exercise_logs" ADD CONSTRAINT "exercise_logs_workout_plan_id_fkey" FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE;

ALTER TABLE public."exercises" ADD CONSTRAINT "exercises_workout_plan_id_fkey" FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE;

ALTER TABLE public."meal_plan_templates" ADD CONSTRAINT "meal_plan_templates_coach_id_fkey" FOREIGN KEY (coach_id) REFERENCES coach_profiles(id) ON DELETE CASCADE;

ALTER TABLE public."meal_plans" ADD CONSTRAINT "meal_plans_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE public."meal_plans" ADD CONSTRAINT "meal_plans_coach_id_fkey" FOREIGN KEY (coach_id) REFERENCES coach_profiles(id) ON DELETE CASCADE;

ALTER TABLE public."measurements" ADD CONSTRAINT "measurements_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE public."memberships" ADD CONSTRAINT "memberships_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE public."memberships" ADD CONSTRAINT "memberships_coach_id_fkey" FOREIGN KEY (coach_id) REFERENCES coach_profiles(id) ON DELETE CASCADE;

ALTER TABLE public."messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."progress_photos" ADD CONSTRAINT "progress_photos_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;



ALTER TABLE public."workout_log_exercises" ADD CONSTRAINT "workout_log_exercises_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL;

ALTER TABLE public."workout_log_exercises" ADD CONSTRAINT "workout_log_exercises_workout_log_id_fkey" FOREIGN KEY (workout_log_id) REFERENCES workout_logs(id) ON DELETE CASCADE;

ALTER TABLE public."workout_logs" ADD CONSTRAINT "workout_logs_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE public."workout_logs" ADD CONSTRAINT "workout_logs_workout_plan_id_fkey" FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE SET NULL;

ALTER TABLE public."workout_plans" ADD CONSTRAINT "workout_plans_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE public."workout_plans" ADD CONSTRAINT "workout_plans_coach_id_fkey" FOREIGN KEY (coach_id) REFERENCES coach_profiles(id) ON DELETE CASCADE;

CREATE INDEX idx_appointments_client_id ON public.appointments USING btree (client_id);

CREATE INDEX idx_appointments_coach_id ON public.appointments USING btree (coach_id);

CREATE INDEX idx_appointments_start_time ON public.appointments USING btree (start_time);

CREATE INDEX idx_client_files_category ON public.client_files USING btree (category);

CREATE INDEX idx_client_files_client_id ON public.client_files USING btree (client_id);

CREATE INDEX idx_client_files_coach_id ON public.client_files USING btree (coach_id);

CREATE INDEX idx_clients_coach_id ON public.clients USING btree (coach_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_clients_status ON public.clients USING btree (status);



CREATE INDEX idx_daily_meal_entries_meal_plan_id ON public.daily_meal_entries USING btree (meal_plan_id);

CREATE INDEX idx_exercise_logs_client_id ON public.exercise_logs USING btree (client_id);

CREATE INDEX idx_exercise_logs_exercise_id ON public.exercise_logs USING btree (exercise_id);

CREATE INDEX idx_exercise_logs_performed_at ON public.exercise_logs USING btree (performed_at);

CREATE INDEX idx_meal_plan_templates_coach_id ON public.meal_plan_templates USING btree (coach_id);

CREATE INDEX idx_meal_plans_client_id ON public.meal_plans USING btree (client_id);

CREATE INDEX idx_meal_plans_coach_id ON public.meal_plans USING btree (coach_id);

CREATE INDEX idx_meal_plans_status ON public.meal_plans USING btree (status);

CREATE INDEX idx_measurements_client_id ON public.measurements USING btree (client_id);

CREATE INDEX idx_measurements_measured_at ON public.measurements USING btree (measured_at);

CREATE INDEX idx_memberships_client_id ON public.memberships USING btree (client_id);

CREATE INDEX idx_memberships_coach_id ON public.memberships USING btree (coach_id);

CREATE INDEX idx_memberships_end_date ON public.memberships USING btree (end_date);

CREATE INDEX idx_memberships_status_end ON public.memberships USING btree (status, end_date) WHERE (status = 'active'::text);

CREATE INDEX idx_messages_is_read ON public.messages USING btree (is_read);

CREATE INDEX idx_messages_receiver_id ON public.messages USING btree (receiver_id);

CREATE INDEX idx_messages_receiver_unread ON public.messages USING btree (receiver_id, created_at) WHERE (is_read = false);

CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);

CREATE INDEX idx_notifications_scheduled ON public.notifications USING btree (scheduled_for) WHERE (is_sent = false);

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);

CREATE INDEX idx_progress_photos_client_taken ON public.progress_photos USING btree (client_id, taken_at);


CREATE INDEX idx_workout_log_exercises_exercise_id ON public.workout_log_exercises USING btree (exercise_id);

CREATE INDEX idx_workout_log_exercises_log_id ON public.workout_log_exercises USING btree (workout_log_id);

CREATE INDEX idx_workout_logs_client_id ON public.workout_logs USING btree (client_id);

CREATE INDEX idx_workout_logs_performed_at ON public.workout_logs USING btree (performed_at);

CREATE INDEX idx_workout_plans_client_id ON public.workout_plans USING btree (client_id);

CREATE OR REPLACE FUNCTION public.notify_new_appointment()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.client_id,
    'appointment',
    'Új időpont',
    NEW.title || ' - ' || to_char(NEW.start_time, 'YYYY.MM.DD HH24:MI'),
    jsonb_build_object('appointment_id', NEW.id, 'start_time', NEW.start_time)
  );
  RETURN NEW;
END;
$function$;

ALTER FUNCTION public."notify_new_appointment"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.notify_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.receiver_id,
    'message',
    'Új üzenet érkezett',
    'Van egy új üzeneted a chatben.',
    jsonb_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id)
  );
  RETURN NEW;
END;
$function$;

ALTER FUNCTION public."notify_new_message"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.prevent_duplicate_email()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Ellenőrizzük, hogy az email már létezik-e a coach_profiles táblában
  IF EXISTS (
    SELECT 1 FROM public.coach_profiles
    WHERE email = NEW.email
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Ez az email cím már regisztrálva van!';
  END IF;

  RETURN NEW;
END;
$function$;

ALTER FUNCTION public."prevent_duplicate_email"() OWNER TO "postgres";




CREATE OR REPLACE FUNCTION public.sync_coach_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.coach_profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$function$;

ALTER FUNCTION public."sync_coach_email"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.sync_membership_coach_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.coach_id IS NULL THEN
    SELECT coach_id INTO NEW.coach_id
    FROM public.clients
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$function$;

ALTER FUNCTION public."sync_membership_coach_id"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

ALTER FUNCTION public."update_updated_at_column"() OWNER TO "postgres";

CREATE TRIGGER on_new_appointment AFTER INSERT ON appointments FOR EACH ROW EXECUTE FUNCTION notify_new_appointment();


CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_files_updated_at BEFORE UPDATE ON client_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER check_duplicate_email_before_insert BEFORE INSERT OR UPDATE ON coach_profiles FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_email();

CREATE TRIGGER update_coach_profiles_updated_at BEFORE UPDATE ON coach_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_measurements_updated_at BEFORE UPDATE ON measurements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sync_membership_coach_id BEFORE INSERT ON memberships FOR EACH ROW EXECUTE FUNCTION sync_membership_coach_id();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_new_message AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION notify_new_message();

CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON workout_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Clients can update own appointment status" ON "public"."appointments" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = client_id)) WITH CHECK ((auth.uid() = client_id));

CREATE POLICY "Clients can view own appointments" ON "public"."appointments" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = client_id));

CREATE POLICY "Coaches can delete own appointments" ON "public"."appointments" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((auth.uid() = coach_id));

CREATE POLICY "Coaches can insert own appointments" ON "public"."appointments" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = coach_id));

CREATE POLICY "Coaches can update own appointments" ON "public"."appointments" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = coach_id));

CREATE POLICY "Coaches can view own appointments" ON "public"."appointments" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = coach_id));

CREATE POLICY "Coaches full access to own appointments" ON "public"."appointments" AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.uid() = coach_id));

CREATE POLICY "Users can delete own devices" ON "public"."client_devices" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((auth.uid() = client_id));

CREATE POLICY "Users can insert own devices" ON "public"."client_devices" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = client_id));

CREATE POLICY "Users can update own devices" ON "public"."client_devices" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = client_id));

CREATE POLICY "Users can view own devices" ON "public"."client_devices" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = client_id));

CREATE POLICY "Clients can insert own files" ON "public"."client_files" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = client_id));

CREATE POLICY "Clients can view own files" ON "public"."client_files" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = client_id));

CREATE POLICY "Coaches can manage files" ON "public"."client_files" AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.uid() = coach_id));

CREATE POLICY "Delete own clients" ON "public"."clients" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((auth.uid() = coach_id));

CREATE POLICY "Insert own clients" ON "public"."clients" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = coach_id));

CREATE POLICY "Select own clients" ON "public"."clients" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((auth.uid() = coach_id) AND (deleted_at IS NULL)));

CREATE POLICY "Update own clients" ON "public"."clients" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = coach_id)) WITH CHECK ((auth.uid() = coach_id));

CREATE POLICY "Users can insert own client record" ON "public"."clients" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can update own client record" ON "public"."clients" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can update own weight goal" ON "public"."clients" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can view own client record" ON "public"."clients" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = id));



CREATE POLICY "Coaches can delete own profile" ON "public"."coach_profiles" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((auth.uid() = id));

CREATE POLICY "Coaches can update own profile" ON "public"."coach_profiles" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

CREATE POLICY "Coaches can view own profile" ON "public"."coach_profiles" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = id));

CREATE POLICY "Insert own coach profile" ON "public"."coach_profiles" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = id));

CREATE POLICY "Service role can insert profiles" ON "public"."coach_profiles" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (true);

CREATE POLICY "Update own coach profile" ON "public"."coach_profiles" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = id));

CREATE POLICY "Users can insert own profile" ON "public"."coach_profiles" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = id));

CREATE POLICY "View coach profiles" ON "public"."coach_profiles" AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Coaches can delete own subscription" ON "public"."coach_subscriptions" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((auth.uid() = coach_id));

CREATE POLICY "Coaches can view own subscription" ON "public"."coach_subscriptions" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = coach_id));

CREATE POLICY "Service role can insert subscriptions" ON "public"."coach_subscriptions" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (true);

CREATE POLICY "Service role can update subscriptions" ON "public"."coach_subscriptions" AS PERMISSIVE FOR UPDATE TO PUBLIC USING (true) WITH CHECK (true);

CREATE POLICY "Clients can view own daily meal entries" ON "public"."daily_meal_entries" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() IN ( SELECT meal_plans.client_id
   FROM meal_plans
  WHERE (meal_plans.id = daily_meal_entries.meal_plan_id))));

CREATE POLICY "Coaches can manage meal entries" ON "public"."daily_meal_entries" AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.uid() IN ( SELECT meal_plans.coach_id
   FROM meal_plans
  WHERE (meal_plans.id = daily_meal_entries.meal_plan_id))));

CREATE POLICY "Clients can insert own exercise logs" ON "public"."exercise_logs" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = client_id));

CREATE POLICY "Clients can update own exercise logs" ON "public"."exercise_logs" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = client_id));

CREATE POLICY "Clients can view own exercise logs" ON "public"."exercise_logs" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = client_id));

CREATE POLICY "Coaches can view client exercise logs" ON "public"."exercise_logs" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() IN ( SELECT clients.coach_id
   FROM clients
  WHERE (clients.id = exercise_logs.client_id))));

CREATE POLICY "Clients can view exercises" ON "public"."exercises" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM workout_plans wp
  WHERE ((wp.id = exercises.workout_plan_id) AND (wp.client_id = auth.uid())))));

CREATE POLICY "Coaches can manage exercises" ON "public"."exercises" AS PERMISSIVE FOR ALL TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM (workout_plans wp
     JOIN clients c ON ((c.id = wp.client_id)))
  WHERE ((wp.id = exercises.workout_plan_id) AND (c.coach_id = auth.uid())))));

CREATE POLICY "Coaches can view exercises" ON "public"."exercises" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM (workout_plans wp
     JOIN clients c ON ((c.id = wp.client_id)))
  WHERE ((wp.id = exercises.workout_plan_id) AND (c.coach_id = auth.uid())))));

CREATE POLICY "Delete exercises" ON "public"."exercises" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM (workout_plans wp
     JOIN clients c ON ((c.id = wp.client_id)))
  WHERE ((wp.id = exercises.workout_plan_id) AND (c.coach_id = auth.uid()) AND (c.deleted_at IS NULL)))));

CREATE POLICY "Insert exercises" ON "public"."exercises" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((EXISTS ( SELECT 1
   FROM (workout_plans wp
     JOIN clients c ON ((c.id = wp.client_id)))
  WHERE ((wp.id = exercises.workout_plan_id) AND (c.coach_id = auth.uid()) AND (c.deleted_at IS NULL)))));

CREATE POLICY "Update exercises" ON "public"."exercises" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM (workout_plans wp
     JOIN clients c ON ((c.id = wp.client_id)))
  WHERE ((wp.id = exercises.workout_plan_id) AND (c.coach_id = auth.uid()) AND (c.deleted_at IS NULL))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (workout_plans wp
     JOIN clients c ON ((c.id = wp.client_id)))
  WHERE ((wp.id = exercises.workout_plan_id) AND (c.coach_id = auth.uid()) AND (c.deleted_at IS NULL)))));

CREATE POLICY "View exercises" ON "public"."exercises" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM (workout_plans wp
     JOIN clients c ON ((c.id = wp.client_id)))
  WHERE ((wp.id = exercises.workout_plan_id) AND (c.coach_id = auth.uid()) AND (c.deleted_at IS NULL)))));

CREATE POLICY "Authenticated users can view master exercises" ON "public"."master_exercises" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Only service role can delete" ON "public"."master_exercises" AS PERMISSIVE FOR DELETE TO "authenticated" USING (false);

CREATE POLICY "Only service role can insert" ON "public"."master_exercises" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (false);

CREATE POLICY "Only service role can update" ON "public"."master_exercises" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (false);

CREATE POLICY "Coaches can manage own templates" ON "public"."meal_plan_templates" AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.uid() = coach_id));

CREATE POLICY "Coaches can view public templates" ON "public"."meal_plan_templates" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((is_public = true) OR (auth.uid() = coach_id)));

CREATE POLICY "Clients can view own meal plans" ON "public"."meal_plans" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = client_id));

CREATE POLICY "Coaches can manage meal plans" ON "public"."meal_plans" AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.uid() = coach_id));

CREATE POLICY "Clients can insert own measurements" ON "public"."measurements" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = client_id));

CREATE POLICY "Clients can update own measurements" ON "public"."measurements" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = client_id));

CREATE POLICY "Clients can view own measurements" ON "public"."measurements" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = client_id));

CREATE POLICY "Coaches can view client measurements" ON "public"."measurements" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() IN ( SELECT clients.coach_id
   FROM clients
  WHERE (clients.id = measurements.client_id))));

CREATE POLICY "Manage measurements" ON "public"."measurements" AS PERMISSIVE FOR ALL TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = measurements.client_id) AND (clients.coach_id = auth.uid())))));

CREATE POLICY "View measurements" ON "public"."measurements" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = measurements.client_id) AND (clients.coach_id = auth.uid())))));

CREATE POLICY "Delete memberships" ON "public"."memberships" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((auth.uid() = coach_id));

CREATE POLICY "Insert memberships" ON "public"."memberships" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = coach_id));

CREATE POLICY "Update memberships" ON "public"."memberships" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = coach_id)) WITH CHECK ((auth.uid() = coach_id));

CREATE POLICY "View own memberships" ON "public"."memberships" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = coach_id));

CREATE POLICY "Clients can only chat with their own coach" ON "public"."messages" AS PERMISSIVE FOR ALL TO PUBLIC USING ((auth.uid() IN ( SELECT clients.id
   FROM clients
  WHERE (clients.coach_id IN ( SELECT coach_profiles.id
           FROM coach_profiles
          WHERE (coach_profiles.id = messages.receiver_id))))));

CREATE POLICY "Send messages" ON "public"."messages" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = sender_id));

CREATE POLICY "Update own messages read status" ON "public"."messages" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = receiver_id));

CREATE POLICY "Users can mark messages as read" ON "public"."messages" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = receiver_id)) WITH CHECK ((auth.uid() = receiver_id));

CREATE POLICY "Users can send messages" ON "public"."messages" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = sender_id));

CREATE POLICY "Users can update read status" ON "public"."messages" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = receiver_id));

CREATE POLICY "Users can view own messages" ON "public"."messages" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));

CREATE POLICY "Users can view their own messages" ON "public"."messages" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));

CREATE POLICY "View own messages" ON "public"."messages" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((((auth.uid() = sender_id) AND (sender_deleted_at IS NULL)) OR ((auth.uid() = receiver_id) AND (receiver_deleted_at IS NULL))));

CREATE POLICY "System can insert notifications" ON "public"."notifications" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON "public"."notifications" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = user_id));

CREATE POLICY "Users can view own notifications" ON "public"."notifications" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = user_id));

CREATE POLICY "Manage progress photos" ON "public"."progress_photos" AS PERMISSIVE FOR ALL TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = progress_photos.client_id) AND (clients.coach_id = auth.uid())))));

CREATE POLICY "View progress photos" ON "public"."progress_photos" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = progress_photos.client_id) AND (clients.coach_id = auth.uid())))));



CREATE POLICY "Clients can view own workout log exercises" ON "public"."workout_log_exercises" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() IN ( SELECT workout_logs.client_id
   FROM workout_logs
  WHERE (workout_logs.id = workout_log_exercises.workout_log_id))));

CREATE POLICY "Coaches can view client workout log exercises" ON "public"."workout_log_exercises" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() IN ( SELECT c.coach_id
   FROM (workout_logs wl
     JOIN clients c ON ((c.id = wl.client_id)))
  WHERE (wl.id = workout_log_exercises.workout_log_id))));

CREATE POLICY "Delete workout log exercises" ON "public"."workout_log_exercises" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM (workout_logs wl
     JOIN clients c ON ((c.id = wl.client_id)))
  WHERE ((wl.id = workout_log_exercises.workout_log_id) AND (c.coach_id = auth.uid()) AND (c.deleted_at IS NULL)))));

CREATE POLICY "Insert workout log exercises" ON "public"."workout_log_exercises" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((EXISTS ( SELECT 1
   FROM (workout_logs wl
     JOIN clients c ON ((c.id = wl.client_id)))
  WHERE ((wl.id = workout_log_exercises.workout_log_id) AND (c.coach_id = auth.uid()) AND (c.deleted_at IS NULL)))));

CREATE POLICY "Update workout log exercises" ON "public"."workout_log_exercises" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM (workout_logs wl
     JOIN clients c ON ((c.id = wl.client_id)))
  WHERE ((wl.id = workout_log_exercises.workout_log_id) AND (c.coach_id = auth.uid()) AND (c.deleted_at IS NULL)))));

CREATE POLICY "Users can insert own workout log exercises" ON "public"."workout_log_exercises" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() IN ( SELECT workout_logs.client_id
   FROM workout_logs
  WHERE (workout_logs.id = workout_log_exercises.workout_log_id))));

CREATE POLICY "Users can update own workout log exercises" ON "public"."workout_log_exercises" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() IN ( SELECT workout_logs.client_id
   FROM workout_logs
  WHERE (workout_logs.id = workout_log_exercises.workout_log_id))));

CREATE POLICY "View workout log exercises" ON "public"."workout_log_exercises" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM (workout_logs wl
     JOIN clients c ON ((c.id = wl.client_id)))
  WHERE ((wl.id = workout_log_exercises.workout_log_id) AND (c.coach_id = auth.uid()) AND (c.deleted_at IS NULL)))));

CREATE POLICY "Coaches can view client workout logs" ON "public"."workout_logs" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() IN ( SELECT clients.coach_id
   FROM clients
  WHERE (clients.id = workout_logs.client_id))));

CREATE POLICY "Delete workout logs" ON "public"."workout_logs" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM clients c
  WHERE ((c.id = workout_logs.client_id) AND (c.coach_id = auth.uid()) AND (c.deleted_at IS NULL)))));

CREATE POLICY "Insert workout logs" ON "public"."workout_logs" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((EXISTS ( SELECT 1
   FROM clients c
  WHERE ((c.id = workout_logs.client_id) AND (c.coach_id = auth.uid()) AND (c.deleted_at IS NULL)))));

CREATE POLICY "Update workout logs" ON "public"."workout_logs" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM clients c
  WHERE ((c.id = workout_logs.client_id) AND (c.coach_id = auth.uid()) AND (c.deleted_at IS NULL)))));

CREATE POLICY "Users can insert own workout logs" ON "public"."workout_logs" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((auth.uid() = client_id));

CREATE POLICY "Users can update own workout logs" ON "public"."workout_logs" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = client_id));

CREATE POLICY "Users can view own workout logs" ON "public"."workout_logs" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = client_id));

CREATE POLICY "View workout logs" ON "public"."workout_logs" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM clients c
  WHERE ((c.id = workout_logs.client_id) AND (c.coach_id = auth.uid()) AND (c.deleted_at IS NULL)))));

CREATE POLICY "Clients can view own workout plans" ON "public"."workout_plans" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((auth.uid() = client_id));

CREATE POLICY "Manage workout plans" ON "public"."workout_plans" AS PERMISSIVE FOR ALL TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = workout_plans.client_id) AND (clients.coach_id = auth.uid())))));

CREATE POLICY "View workout plans" ON "public"."workout_plans" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = workout_plans.client_id) AND (clients.coach_id = auth.uid())))));

CREATE POLICY "Authenticated users can upload files" ON "storage"."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((bucket_id = 'client-files'::text));

CREATE POLICY "Authenticated users can upload voice" ON "storage"."objects" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((bucket_id = 'chat-voice'::text) AND (auth.role() = 'authenticated'::text)));

CREATE POLICY "Users can delete their own files" ON "storage"."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'client-files'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Users can view their own files" ON "storage"."objects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((bucket_id = 'client-files'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Voice messages are public" ON "storage"."objects" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((bucket_id = 'chat-voice'::text));

REVOKE ALL ON FUNCTION "public"."notify_new_appointment"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."notify_new_appointment"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."notify_new_appointment"() TO "anon";

GRANT EXECUTE ON FUNCTION "public"."notify_new_appointment"() TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."notify_new_appointment"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."notify_new_appointment"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."notify_new_message"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."notify_new_message"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."notify_new_message"() TO "anon";

GRANT EXECUTE ON FUNCTION "public"."notify_new_message"() TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."notify_new_message"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."notify_new_message"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."prevent_duplicate_email"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."prevent_duplicate_email"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."prevent_duplicate_email"() TO "anon";

GRANT EXECUTE ON FUNCTION "public"."prevent_duplicate_email"() TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."prevent_duplicate_email"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."prevent_duplicate_email"() TO "service_role";







REVOKE ALL ON FUNCTION "public"."sync_coach_email"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."sync_coach_email"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sync_coach_email"() TO "anon";

GRANT EXECUTE ON FUNCTION "public"."sync_coach_email"() TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."sync_coach_email"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sync_coach_email"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."sync_membership_coach_id"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."sync_membership_coach_id"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sync_membership_coach_id"() TO "anon";

GRANT EXECUTE ON FUNCTION "public"."sync_membership_coach_id"() TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."sync_membership_coach_id"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sync_membership_coach_id"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."update_updated_at_column"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."update_updated_at_column"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."update_updated_at_column"() TO "anon";

GRANT EXECUTE ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."update_updated_at_column"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."update_updated_at_column"() TO "service_role";

REVOKE ALL ON TABLE "public"."appointments" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."appointments" TO "anon";

GRANT INSERT ON TABLE "public"."appointments" TO "anon";

GRANT MAINTAIN ON TABLE "public"."appointments" TO "anon";

GRANT REFERENCES ON TABLE "public"."appointments" TO "anon";

GRANT SELECT ON TABLE "public"."appointments" TO "anon";

GRANT TRIGGER ON TABLE "public"."appointments" TO "anon";

GRANT TRUNCATE ON TABLE "public"."appointments" TO "anon";

GRANT UPDATE ON TABLE "public"."appointments" TO "anon";

GRANT DELETE ON TABLE "public"."appointments" TO "authenticated";

GRANT INSERT ON TABLE "public"."appointments" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."appointments" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."appointments" TO "authenticated";

GRANT SELECT ON TABLE "public"."appointments" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."appointments" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."appointments" TO "authenticated";

GRANT UPDATE ON TABLE "public"."appointments" TO "authenticated";

GRANT DELETE ON TABLE "public"."appointments" TO "postgres";

GRANT INSERT ON TABLE "public"."appointments" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."appointments" TO "postgres";

GRANT REFERENCES ON TABLE "public"."appointments" TO "postgres";

GRANT SELECT ON TABLE "public"."appointments" TO "postgres";

GRANT TRIGGER ON TABLE "public"."appointments" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."appointments" TO "postgres";

GRANT UPDATE ON TABLE "public"."appointments" TO "postgres";

GRANT DELETE ON TABLE "public"."appointments" TO "service_role";

GRANT INSERT ON TABLE "public"."appointments" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."appointments" TO "service_role";

GRANT REFERENCES ON TABLE "public"."appointments" TO "service_role";

GRANT SELECT ON TABLE "public"."appointments" TO "service_role";

GRANT TRIGGER ON TABLE "public"."appointments" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."appointments" TO "service_role";

GRANT UPDATE ON TABLE "public"."appointments" TO "service_role";

REVOKE ALL ON TABLE "public"."client_devices" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."client_devices" TO "anon";

GRANT INSERT ON TABLE "public"."client_devices" TO "anon";

GRANT MAINTAIN ON TABLE "public"."client_devices" TO "anon";

GRANT REFERENCES ON TABLE "public"."client_devices" TO "anon";

GRANT SELECT ON TABLE "public"."client_devices" TO "anon";

GRANT TRIGGER ON TABLE "public"."client_devices" TO "anon";

GRANT TRUNCATE ON TABLE "public"."client_devices" TO "anon";

GRANT UPDATE ON TABLE "public"."client_devices" TO "anon";

GRANT DELETE ON TABLE "public"."client_devices" TO "authenticated";

GRANT INSERT ON TABLE "public"."client_devices" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."client_devices" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."client_devices" TO "authenticated";

GRANT SELECT ON TABLE "public"."client_devices" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."client_devices" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."client_devices" TO "authenticated";

GRANT UPDATE ON TABLE "public"."client_devices" TO "authenticated";

GRANT DELETE ON TABLE "public"."client_devices" TO "postgres";

GRANT INSERT ON TABLE "public"."client_devices" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."client_devices" TO "postgres";

GRANT REFERENCES ON TABLE "public"."client_devices" TO "postgres";

GRANT SELECT ON TABLE "public"."client_devices" TO "postgres";

GRANT TRIGGER ON TABLE "public"."client_devices" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."client_devices" TO "postgres";

GRANT UPDATE ON TABLE "public"."client_devices" TO "postgres";

GRANT DELETE ON TABLE "public"."client_devices" TO "service_role";

GRANT INSERT ON TABLE "public"."client_devices" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."client_devices" TO "service_role";

GRANT REFERENCES ON TABLE "public"."client_devices" TO "service_role";

GRANT SELECT ON TABLE "public"."client_devices" TO "service_role";

GRANT TRIGGER ON TABLE "public"."client_devices" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."client_devices" TO "service_role";

GRANT UPDATE ON TABLE "public"."client_devices" TO "service_role";

REVOKE ALL ON TABLE "public"."client_files" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."client_files" TO "anon";

GRANT INSERT ON TABLE "public"."client_files" TO "anon";

GRANT MAINTAIN ON TABLE "public"."client_files" TO "anon";

GRANT REFERENCES ON TABLE "public"."client_files" TO "anon";

GRANT SELECT ON TABLE "public"."client_files" TO "anon";

GRANT TRIGGER ON TABLE "public"."client_files" TO "anon";

GRANT TRUNCATE ON TABLE "public"."client_files" TO "anon";

GRANT UPDATE ON TABLE "public"."client_files" TO "anon";

GRANT DELETE ON TABLE "public"."client_files" TO "authenticated";

GRANT INSERT ON TABLE "public"."client_files" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."client_files" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."client_files" TO "authenticated";

GRANT SELECT ON TABLE "public"."client_files" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."client_files" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."client_files" TO "authenticated";

GRANT UPDATE ON TABLE "public"."client_files" TO "authenticated";

GRANT DELETE ON TABLE "public"."client_files" TO "postgres";

GRANT INSERT ON TABLE "public"."client_files" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."client_files" TO "postgres";

GRANT REFERENCES ON TABLE "public"."client_files" TO "postgres";

GRANT SELECT ON TABLE "public"."client_files" TO "postgres";

GRANT TRIGGER ON TABLE "public"."client_files" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."client_files" TO "postgres";

GRANT UPDATE ON TABLE "public"."client_files" TO "postgres";

GRANT DELETE ON TABLE "public"."client_files" TO "service_role";

GRANT INSERT ON TABLE "public"."client_files" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."client_files" TO "service_role";

GRANT REFERENCES ON TABLE "public"."client_files" TO "service_role";

GRANT SELECT ON TABLE "public"."client_files" TO "service_role";

GRANT TRIGGER ON TABLE "public"."client_files" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."client_files" TO "service_role";

GRANT UPDATE ON TABLE "public"."client_files" TO "service_role";

REVOKE ALL ON TABLE "public"."clients" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."clients" TO "anon";

GRANT INSERT ON TABLE "public"."clients" TO "anon";

GRANT MAINTAIN ON TABLE "public"."clients" TO "anon";

GRANT REFERENCES ON TABLE "public"."clients" TO "anon";

GRANT SELECT ON TABLE "public"."clients" TO "anon";

GRANT TRIGGER ON TABLE "public"."clients" TO "anon";

GRANT TRUNCATE ON TABLE "public"."clients" TO "anon";

GRANT UPDATE ON TABLE "public"."clients" TO "anon";

GRANT DELETE ON TABLE "public"."clients" TO "authenticated";

GRANT INSERT ON TABLE "public"."clients" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."clients" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."clients" TO "authenticated";

GRANT SELECT ON TABLE "public"."clients" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."clients" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."clients" TO "authenticated";

GRANT UPDATE ON TABLE "public"."clients" TO "authenticated";

GRANT DELETE ON TABLE "public"."clients" TO "postgres";

GRANT INSERT ON TABLE "public"."clients" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."clients" TO "postgres";

GRANT REFERENCES ON TABLE "public"."clients" TO "postgres";

GRANT SELECT ON TABLE "public"."clients" TO "postgres";

GRANT TRIGGER ON TABLE "public"."clients" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."clients" TO "postgres";

GRANT UPDATE ON TABLE "public"."clients" TO "postgres";

GRANT DELETE ON TABLE "public"."clients" TO "service_role";

GRANT INSERT ON TABLE "public"."clients" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."clients" TO "service_role";

GRANT REFERENCES ON TABLE "public"."clients" TO "service_role";

GRANT SELECT ON TABLE "public"."clients" TO "service_role";

GRANT TRIGGER ON TABLE "public"."clients" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."clients" TO "service_role";

GRANT UPDATE ON TABLE "public"."clients" TO "service_role";


































REVOKE ALL ON TABLE "public"."coach_profiles" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."coach_profiles" TO "anon";

GRANT INSERT ON TABLE "public"."coach_profiles" TO "anon";

GRANT MAINTAIN ON TABLE "public"."coach_profiles" TO "anon";

GRANT REFERENCES ON TABLE "public"."coach_profiles" TO "anon";

GRANT SELECT ON TABLE "public"."coach_profiles" TO "anon";

GRANT TRIGGER ON TABLE "public"."coach_profiles" TO "anon";

GRANT TRUNCATE ON TABLE "public"."coach_profiles" TO "anon";

GRANT UPDATE ON TABLE "public"."coach_profiles" TO "anon";

GRANT DELETE ON TABLE "public"."coach_profiles" TO "authenticated";

GRANT INSERT ON TABLE "public"."coach_profiles" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."coach_profiles" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."coach_profiles" TO "authenticated";

GRANT SELECT ON TABLE "public"."coach_profiles" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."coach_profiles" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."coach_profiles" TO "authenticated";

GRANT UPDATE ON TABLE "public"."coach_profiles" TO "authenticated";

GRANT DELETE ON TABLE "public"."coach_profiles" TO "postgres";

GRANT INSERT ON TABLE "public"."coach_profiles" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."coach_profiles" TO "postgres";

GRANT REFERENCES ON TABLE "public"."coach_profiles" TO "postgres";

GRANT SELECT ON TABLE "public"."coach_profiles" TO "postgres";

GRANT TRIGGER ON TABLE "public"."coach_profiles" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."coach_profiles" TO "postgres";

GRANT UPDATE ON TABLE "public"."coach_profiles" TO "postgres";

GRANT DELETE ON TABLE "public"."coach_profiles" TO "service_role";

GRANT INSERT ON TABLE "public"."coach_profiles" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."coach_profiles" TO "service_role";

GRANT REFERENCES ON TABLE "public"."coach_profiles" TO "service_role";

GRANT SELECT ON TABLE "public"."coach_profiles" TO "service_role";

GRANT TRIGGER ON TABLE "public"."coach_profiles" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."coach_profiles" TO "service_role";

GRANT UPDATE ON TABLE "public"."coach_profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."coach_subscriptions" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."coach_subscriptions" TO "anon";

GRANT INSERT ON TABLE "public"."coach_subscriptions" TO "anon";

GRANT MAINTAIN ON TABLE "public"."coach_subscriptions" TO "anon";

GRANT REFERENCES ON TABLE "public"."coach_subscriptions" TO "anon";

GRANT SELECT ON TABLE "public"."coach_subscriptions" TO "anon";

GRANT TRIGGER ON TABLE "public"."coach_subscriptions" TO "anon";

GRANT TRUNCATE ON TABLE "public"."coach_subscriptions" TO "anon";

GRANT UPDATE ON TABLE "public"."coach_subscriptions" TO "anon";

GRANT DELETE ON TABLE "public"."coach_subscriptions" TO "authenticated";

GRANT INSERT ON TABLE "public"."coach_subscriptions" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."coach_subscriptions" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."coach_subscriptions" TO "authenticated";

GRANT SELECT ON TABLE "public"."coach_subscriptions" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."coach_subscriptions" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."coach_subscriptions" TO "authenticated";

GRANT UPDATE ON TABLE "public"."coach_subscriptions" TO "authenticated";

GRANT DELETE ON TABLE "public"."coach_subscriptions" TO "postgres";

GRANT INSERT ON TABLE "public"."coach_subscriptions" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."coach_subscriptions" TO "postgres";

GRANT REFERENCES ON TABLE "public"."coach_subscriptions" TO "postgres";

GRANT SELECT ON TABLE "public"."coach_subscriptions" TO "postgres";

GRANT TRIGGER ON TABLE "public"."coach_subscriptions" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."coach_subscriptions" TO "postgres";

GRANT UPDATE ON TABLE "public"."coach_subscriptions" TO "postgres";

GRANT DELETE ON TABLE "public"."coach_subscriptions" TO "service_role";

GRANT INSERT ON TABLE "public"."coach_subscriptions" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."coach_subscriptions" TO "service_role";

GRANT REFERENCES ON TABLE "public"."coach_subscriptions" TO "service_role";

GRANT SELECT ON TABLE "public"."coach_subscriptions" TO "service_role";

GRANT TRIGGER ON TABLE "public"."coach_subscriptions" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."coach_subscriptions" TO "service_role";

GRANT UPDATE ON TABLE "public"."coach_subscriptions" TO "service_role";

REVOKE ALL ON TABLE "public"."daily_meal_entries" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."daily_meal_entries" TO "anon";

GRANT INSERT ON TABLE "public"."daily_meal_entries" TO "anon";

GRANT MAINTAIN ON TABLE "public"."daily_meal_entries" TO "anon";

GRANT REFERENCES ON TABLE "public"."daily_meal_entries" TO "anon";

GRANT SELECT ON TABLE "public"."daily_meal_entries" TO "anon";

GRANT TRIGGER ON TABLE "public"."daily_meal_entries" TO "anon";

GRANT TRUNCATE ON TABLE "public"."daily_meal_entries" TO "anon";

GRANT UPDATE ON TABLE "public"."daily_meal_entries" TO "anon";

GRANT DELETE ON TABLE "public"."daily_meal_entries" TO "authenticated";

GRANT INSERT ON TABLE "public"."daily_meal_entries" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."daily_meal_entries" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."daily_meal_entries" TO "authenticated";

GRANT SELECT ON TABLE "public"."daily_meal_entries" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."daily_meal_entries" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."daily_meal_entries" TO "authenticated";

GRANT UPDATE ON TABLE "public"."daily_meal_entries" TO "authenticated";

GRANT DELETE ON TABLE "public"."daily_meal_entries" TO "postgres";

GRANT INSERT ON TABLE "public"."daily_meal_entries" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."daily_meal_entries" TO "postgres";

GRANT REFERENCES ON TABLE "public"."daily_meal_entries" TO "postgres";

GRANT SELECT ON TABLE "public"."daily_meal_entries" TO "postgres";

GRANT TRIGGER ON TABLE "public"."daily_meal_entries" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."daily_meal_entries" TO "postgres";

GRANT UPDATE ON TABLE "public"."daily_meal_entries" TO "postgres";

GRANT DELETE ON TABLE "public"."daily_meal_entries" TO "service_role";

GRANT INSERT ON TABLE "public"."daily_meal_entries" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."daily_meal_entries" TO "service_role";

GRANT REFERENCES ON TABLE "public"."daily_meal_entries" TO "service_role";

GRANT SELECT ON TABLE "public"."daily_meal_entries" TO "service_role";

GRANT TRIGGER ON TABLE "public"."daily_meal_entries" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."daily_meal_entries" TO "service_role";

GRANT UPDATE ON TABLE "public"."daily_meal_entries" TO "service_role";

REVOKE ALL ON TABLE "public"."exercise_logs" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."exercise_logs" TO "anon";

GRANT INSERT ON TABLE "public"."exercise_logs" TO "anon";

GRANT MAINTAIN ON TABLE "public"."exercise_logs" TO "anon";

GRANT REFERENCES ON TABLE "public"."exercise_logs" TO "anon";

GRANT SELECT ON TABLE "public"."exercise_logs" TO "anon";

GRANT TRIGGER ON TABLE "public"."exercise_logs" TO "anon";

GRANT TRUNCATE ON TABLE "public"."exercise_logs" TO "anon";

GRANT UPDATE ON TABLE "public"."exercise_logs" TO "anon";

GRANT DELETE ON TABLE "public"."exercise_logs" TO "authenticated";

GRANT INSERT ON TABLE "public"."exercise_logs" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."exercise_logs" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."exercise_logs" TO "authenticated";

GRANT SELECT ON TABLE "public"."exercise_logs" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."exercise_logs" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."exercise_logs" TO "authenticated";

GRANT UPDATE ON TABLE "public"."exercise_logs" TO "authenticated";

GRANT DELETE ON TABLE "public"."exercise_logs" TO "postgres";

GRANT INSERT ON TABLE "public"."exercise_logs" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."exercise_logs" TO "postgres";

GRANT REFERENCES ON TABLE "public"."exercise_logs" TO "postgres";

GRANT SELECT ON TABLE "public"."exercise_logs" TO "postgres";

GRANT TRIGGER ON TABLE "public"."exercise_logs" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."exercise_logs" TO "postgres";

GRANT UPDATE ON TABLE "public"."exercise_logs" TO "postgres";

GRANT DELETE ON TABLE "public"."exercise_logs" TO "service_role";

GRANT INSERT ON TABLE "public"."exercise_logs" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."exercise_logs" TO "service_role";

GRANT REFERENCES ON TABLE "public"."exercise_logs" TO "service_role";

GRANT SELECT ON TABLE "public"."exercise_logs" TO "service_role";

GRANT TRIGGER ON TABLE "public"."exercise_logs" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."exercise_logs" TO "service_role";

GRANT UPDATE ON TABLE "public"."exercise_logs" TO "service_role";

REVOKE ALL ON TABLE "public"."exercises" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."exercises" TO "anon";

GRANT INSERT ON TABLE "public"."exercises" TO "anon";

GRANT MAINTAIN ON TABLE "public"."exercises" TO "anon";

GRANT REFERENCES ON TABLE "public"."exercises" TO "anon";

GRANT SELECT ON TABLE "public"."exercises" TO "anon";

GRANT TRIGGER ON TABLE "public"."exercises" TO "anon";

GRANT TRUNCATE ON TABLE "public"."exercises" TO "anon";

GRANT UPDATE ON TABLE "public"."exercises" TO "anon";

GRANT DELETE ON TABLE "public"."exercises" TO "authenticated";

GRANT INSERT ON TABLE "public"."exercises" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."exercises" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."exercises" TO "authenticated";

GRANT SELECT ON TABLE "public"."exercises" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."exercises" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."exercises" TO "authenticated";

GRANT UPDATE ON TABLE "public"."exercises" TO "authenticated";

GRANT DELETE ON TABLE "public"."exercises" TO "postgres";

GRANT INSERT ON TABLE "public"."exercises" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."exercises" TO "postgres";

GRANT REFERENCES ON TABLE "public"."exercises" TO "postgres";

GRANT SELECT ON TABLE "public"."exercises" TO "postgres";

GRANT TRIGGER ON TABLE "public"."exercises" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."exercises" TO "postgres";

GRANT UPDATE ON TABLE "public"."exercises" TO "postgres";

GRANT DELETE ON TABLE "public"."exercises" TO "service_role";

GRANT INSERT ON TABLE "public"."exercises" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."exercises" TO "service_role";

GRANT REFERENCES ON TABLE "public"."exercises" TO "service_role";

GRANT SELECT ON TABLE "public"."exercises" TO "service_role";

GRANT TRIGGER ON TABLE "public"."exercises" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."exercises" TO "service_role";

GRANT UPDATE ON TABLE "public"."exercises" TO "service_role";

REVOKE ALL ON TABLE "public"."master_exercises" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."master_exercises" TO "anon";

GRANT INSERT ON TABLE "public"."master_exercises" TO "anon";

GRANT MAINTAIN ON TABLE "public"."master_exercises" TO "anon";

GRANT REFERENCES ON TABLE "public"."master_exercises" TO "anon";

GRANT SELECT ON TABLE "public"."master_exercises" TO "anon";

GRANT TRIGGER ON TABLE "public"."master_exercises" TO "anon";

GRANT TRUNCATE ON TABLE "public"."master_exercises" TO "anon";

GRANT UPDATE ON TABLE "public"."master_exercises" TO "anon";

GRANT DELETE ON TABLE "public"."master_exercises" TO "authenticated";

GRANT INSERT ON TABLE "public"."master_exercises" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."master_exercises" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."master_exercises" TO "authenticated";

GRANT SELECT ON TABLE "public"."master_exercises" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."master_exercises" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."master_exercises" TO "authenticated";

GRANT UPDATE ON TABLE "public"."master_exercises" TO "authenticated";

GRANT DELETE ON TABLE "public"."master_exercises" TO "postgres";

GRANT INSERT ON TABLE "public"."master_exercises" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."master_exercises" TO "postgres";

GRANT REFERENCES ON TABLE "public"."master_exercises" TO "postgres";

GRANT SELECT ON TABLE "public"."master_exercises" TO "postgres";

GRANT TRIGGER ON TABLE "public"."master_exercises" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."master_exercises" TO "postgres";

GRANT UPDATE ON TABLE "public"."master_exercises" TO "postgres";

GRANT DELETE ON TABLE "public"."master_exercises" TO "service_role";

GRANT INSERT ON TABLE "public"."master_exercises" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."master_exercises" TO "service_role";

GRANT REFERENCES ON TABLE "public"."master_exercises" TO "service_role";

GRANT SELECT ON TABLE "public"."master_exercises" TO "service_role";

GRANT TRIGGER ON TABLE "public"."master_exercises" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."master_exercises" TO "service_role";

GRANT UPDATE ON TABLE "public"."master_exercises" TO "service_role";

REVOKE ALL ON SEQUENCE "public"."master_exercises_id_seq" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT SELECT ON SEQUENCE "public"."master_exercises_id_seq" TO "anon";

GRANT UPDATE ON SEQUENCE "public"."master_exercises_id_seq" TO "anon";

GRANT USAGE ON SEQUENCE "public"."master_exercises_id_seq" TO "anon";

GRANT SELECT ON SEQUENCE "public"."master_exercises_id_seq" TO "authenticated";

GRANT UPDATE ON SEQUENCE "public"."master_exercises_id_seq" TO "authenticated";

GRANT USAGE ON SEQUENCE "public"."master_exercises_id_seq" TO "authenticated";

GRANT SELECT ON SEQUENCE "public"."master_exercises_id_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE "public"."master_exercises_id_seq" TO "postgres";

GRANT USAGE ON SEQUENCE "public"."master_exercises_id_seq" TO "postgres";

GRANT SELECT ON SEQUENCE "public"."master_exercises_id_seq" TO "service_role";

GRANT UPDATE ON SEQUENCE "public"."master_exercises_id_seq" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."master_exercises_id_seq" TO "service_role";

REVOKE ALL ON TABLE "public"."meal_plan_templates" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."meal_plan_templates" TO "anon";

GRANT INSERT ON TABLE "public"."meal_plan_templates" TO "anon";

GRANT MAINTAIN ON TABLE "public"."meal_plan_templates" TO "anon";

GRANT REFERENCES ON TABLE "public"."meal_plan_templates" TO "anon";

GRANT SELECT ON TABLE "public"."meal_plan_templates" TO "anon";

GRANT TRIGGER ON TABLE "public"."meal_plan_templates" TO "anon";

GRANT TRUNCATE ON TABLE "public"."meal_plan_templates" TO "anon";

GRANT UPDATE ON TABLE "public"."meal_plan_templates" TO "anon";

GRANT DELETE ON TABLE "public"."meal_plan_templates" TO "authenticated";

GRANT INSERT ON TABLE "public"."meal_plan_templates" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."meal_plan_templates" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."meal_plan_templates" TO "authenticated";

GRANT SELECT ON TABLE "public"."meal_plan_templates" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."meal_plan_templates" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."meal_plan_templates" TO "authenticated";

GRANT UPDATE ON TABLE "public"."meal_plan_templates" TO "authenticated";

GRANT DELETE ON TABLE "public"."meal_plan_templates" TO "postgres";

GRANT INSERT ON TABLE "public"."meal_plan_templates" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."meal_plan_templates" TO "postgres";

GRANT REFERENCES ON TABLE "public"."meal_plan_templates" TO "postgres";

GRANT SELECT ON TABLE "public"."meal_plan_templates" TO "postgres";

GRANT TRIGGER ON TABLE "public"."meal_plan_templates" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."meal_plan_templates" TO "postgres";

GRANT UPDATE ON TABLE "public"."meal_plan_templates" TO "postgres";

GRANT DELETE ON TABLE "public"."meal_plan_templates" TO "service_role";

GRANT INSERT ON TABLE "public"."meal_plan_templates" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."meal_plan_templates" TO "service_role";

GRANT REFERENCES ON TABLE "public"."meal_plan_templates" TO "service_role";

GRANT SELECT ON TABLE "public"."meal_plan_templates" TO "service_role";

GRANT TRIGGER ON TABLE "public"."meal_plan_templates" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."meal_plan_templates" TO "service_role";

GRANT UPDATE ON TABLE "public"."meal_plan_templates" TO "service_role";

REVOKE ALL ON TABLE "public"."meal_plans" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."meal_plans" TO "anon";

GRANT INSERT ON TABLE "public"."meal_plans" TO "anon";

GRANT MAINTAIN ON TABLE "public"."meal_plans" TO "anon";

GRANT REFERENCES ON TABLE "public"."meal_plans" TO "anon";

GRANT SELECT ON TABLE "public"."meal_plans" TO "anon";

GRANT TRIGGER ON TABLE "public"."meal_plans" TO "anon";

GRANT TRUNCATE ON TABLE "public"."meal_plans" TO "anon";

GRANT UPDATE ON TABLE "public"."meal_plans" TO "anon";

GRANT DELETE ON TABLE "public"."meal_plans" TO "authenticated";

GRANT INSERT ON TABLE "public"."meal_plans" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."meal_plans" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."meal_plans" TO "authenticated";

GRANT SELECT ON TABLE "public"."meal_plans" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."meal_plans" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."meal_plans" TO "authenticated";

GRANT UPDATE ON TABLE "public"."meal_plans" TO "authenticated";

GRANT DELETE ON TABLE "public"."meal_plans" TO "postgres";

GRANT INSERT ON TABLE "public"."meal_plans" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."meal_plans" TO "postgres";

GRANT REFERENCES ON TABLE "public"."meal_plans" TO "postgres";

GRANT SELECT ON TABLE "public"."meal_plans" TO "postgres";

GRANT TRIGGER ON TABLE "public"."meal_plans" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."meal_plans" TO "postgres";

GRANT UPDATE ON TABLE "public"."meal_plans" TO "postgres";

GRANT DELETE ON TABLE "public"."meal_plans" TO "service_role";

GRANT INSERT ON TABLE "public"."meal_plans" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."meal_plans" TO "service_role";

GRANT REFERENCES ON TABLE "public"."meal_plans" TO "service_role";

GRANT SELECT ON TABLE "public"."meal_plans" TO "service_role";

GRANT TRIGGER ON TABLE "public"."meal_plans" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."meal_plans" TO "service_role";

GRANT UPDATE ON TABLE "public"."meal_plans" TO "service_role";

REVOKE ALL ON TABLE "public"."measurements" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."measurements" TO "anon";

GRANT INSERT ON TABLE "public"."measurements" TO "anon";

GRANT MAINTAIN ON TABLE "public"."measurements" TO "anon";

GRANT REFERENCES ON TABLE "public"."measurements" TO "anon";

GRANT SELECT ON TABLE "public"."measurements" TO "anon";

GRANT TRIGGER ON TABLE "public"."measurements" TO "anon";

GRANT TRUNCATE ON TABLE "public"."measurements" TO "anon";

GRANT UPDATE ON TABLE "public"."measurements" TO "anon";

GRANT DELETE ON TABLE "public"."measurements" TO "authenticated";

GRANT INSERT ON TABLE "public"."measurements" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."measurements" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."measurements" TO "authenticated";

GRANT SELECT ON TABLE "public"."measurements" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."measurements" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."measurements" TO "authenticated";

GRANT UPDATE ON TABLE "public"."measurements" TO "authenticated";

GRANT DELETE ON TABLE "public"."measurements" TO "postgres";

GRANT INSERT ON TABLE "public"."measurements" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."measurements" TO "postgres";

GRANT REFERENCES ON TABLE "public"."measurements" TO "postgres";

GRANT SELECT ON TABLE "public"."measurements" TO "postgres";

GRANT TRIGGER ON TABLE "public"."measurements" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."measurements" TO "postgres";

GRANT UPDATE ON TABLE "public"."measurements" TO "postgres";

GRANT DELETE ON TABLE "public"."measurements" TO "service_role";

GRANT INSERT ON TABLE "public"."measurements" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."measurements" TO "service_role";

GRANT REFERENCES ON TABLE "public"."measurements" TO "service_role";

GRANT SELECT ON TABLE "public"."measurements" TO "service_role";

GRANT TRIGGER ON TABLE "public"."measurements" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."measurements" TO "service_role";

GRANT UPDATE ON TABLE "public"."measurements" TO "service_role";

REVOKE ALL ON TABLE "public"."memberships" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."memberships" TO "anon";

GRANT INSERT ON TABLE "public"."memberships" TO "anon";

GRANT MAINTAIN ON TABLE "public"."memberships" TO "anon";

GRANT REFERENCES ON TABLE "public"."memberships" TO "anon";

GRANT SELECT ON TABLE "public"."memberships" TO "anon";

GRANT TRIGGER ON TABLE "public"."memberships" TO "anon";

GRANT TRUNCATE ON TABLE "public"."memberships" TO "anon";

GRANT UPDATE ON TABLE "public"."memberships" TO "anon";

GRANT DELETE ON TABLE "public"."memberships" TO "authenticated";

GRANT INSERT ON TABLE "public"."memberships" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."memberships" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."memberships" TO "authenticated";

GRANT SELECT ON TABLE "public"."memberships" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."memberships" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."memberships" TO "authenticated";

GRANT UPDATE ON TABLE "public"."memberships" TO "authenticated";

GRANT DELETE ON TABLE "public"."memberships" TO "postgres";

GRANT INSERT ON TABLE "public"."memberships" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."memberships" TO "postgres";

GRANT REFERENCES ON TABLE "public"."memberships" TO "postgres";

GRANT SELECT ON TABLE "public"."memberships" TO "postgres";

GRANT TRIGGER ON TABLE "public"."memberships" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."memberships" TO "postgres";

GRANT UPDATE ON TABLE "public"."memberships" TO "postgres";

GRANT DELETE ON TABLE "public"."memberships" TO "service_role";

GRANT INSERT ON TABLE "public"."memberships" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."memberships" TO "service_role";

GRANT REFERENCES ON TABLE "public"."memberships" TO "service_role";

GRANT SELECT ON TABLE "public"."memberships" TO "service_role";

GRANT TRIGGER ON TABLE "public"."memberships" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."memberships" TO "service_role";

GRANT UPDATE ON TABLE "public"."memberships" TO "service_role";

REVOKE ALL ON TABLE "public"."messages" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."messages" TO "anon";

GRANT INSERT ON TABLE "public"."messages" TO "anon";

GRANT MAINTAIN ON TABLE "public"."messages" TO "anon";

GRANT REFERENCES ON TABLE "public"."messages" TO "anon";

GRANT SELECT ON TABLE "public"."messages" TO "anon";

GRANT TRIGGER ON TABLE "public"."messages" TO "anon";

GRANT TRUNCATE ON TABLE "public"."messages" TO "anon";

GRANT UPDATE ON TABLE "public"."messages" TO "anon";

GRANT DELETE ON TABLE "public"."messages" TO "authenticated";

GRANT INSERT ON TABLE "public"."messages" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."messages" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."messages" TO "authenticated";

GRANT SELECT ON TABLE "public"."messages" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."messages" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."messages" TO "authenticated";

GRANT UPDATE ON TABLE "public"."messages" TO "authenticated";

GRANT DELETE ON TABLE "public"."messages" TO "postgres";

GRANT INSERT ON TABLE "public"."messages" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."messages" TO "postgres";

GRANT REFERENCES ON TABLE "public"."messages" TO "postgres";

GRANT SELECT ON TABLE "public"."messages" TO "postgres";

GRANT TRIGGER ON TABLE "public"."messages" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."messages" TO "postgres";

GRANT UPDATE ON TABLE "public"."messages" TO "postgres";

GRANT DELETE ON TABLE "public"."messages" TO "service_role";

GRANT INSERT ON TABLE "public"."messages" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."messages" TO "service_role";

GRANT REFERENCES ON TABLE "public"."messages" TO "service_role";

GRANT SELECT ON TABLE "public"."messages" TO "service_role";

GRANT TRIGGER ON TABLE "public"."messages" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."messages" TO "service_role";

GRANT UPDATE ON TABLE "public"."messages" TO "service_role";

REVOKE ALL ON TABLE "public"."notifications" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."notifications" TO "anon";

GRANT INSERT ON TABLE "public"."notifications" TO "anon";

GRANT MAINTAIN ON TABLE "public"."notifications" TO "anon";

GRANT REFERENCES ON TABLE "public"."notifications" TO "anon";

GRANT SELECT ON TABLE "public"."notifications" TO "anon";

GRANT TRIGGER ON TABLE "public"."notifications" TO "anon";

GRANT TRUNCATE ON TABLE "public"."notifications" TO "anon";

GRANT UPDATE ON TABLE "public"."notifications" TO "anon";

GRANT DELETE ON TABLE "public"."notifications" TO "authenticated";

GRANT INSERT ON TABLE "public"."notifications" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."notifications" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."notifications" TO "authenticated";

GRANT SELECT ON TABLE "public"."notifications" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."notifications" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."notifications" TO "authenticated";

GRANT UPDATE ON TABLE "public"."notifications" TO "authenticated";

GRANT DELETE ON TABLE "public"."notifications" TO "postgres";

GRANT INSERT ON TABLE "public"."notifications" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."notifications" TO "postgres";

GRANT REFERENCES ON TABLE "public"."notifications" TO "postgres";

GRANT SELECT ON TABLE "public"."notifications" TO "postgres";

GRANT TRIGGER ON TABLE "public"."notifications" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."notifications" TO "postgres";

GRANT UPDATE ON TABLE "public"."notifications" TO "postgres";

GRANT DELETE ON TABLE "public"."notifications" TO "service_role";

GRANT INSERT ON TABLE "public"."notifications" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."notifications" TO "service_role";

GRANT REFERENCES ON TABLE "public"."notifications" TO "service_role";

GRANT SELECT ON TABLE "public"."notifications" TO "service_role";

GRANT TRIGGER ON TABLE "public"."notifications" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."notifications" TO "service_role";

GRANT UPDATE ON TABLE "public"."notifications" TO "service_role";

REVOKE ALL ON TABLE "public"."progress_photos" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."progress_photos" TO "anon";

GRANT INSERT ON TABLE "public"."progress_photos" TO "anon";

GRANT MAINTAIN ON TABLE "public"."progress_photos" TO "anon";

GRANT REFERENCES ON TABLE "public"."progress_photos" TO "anon";

GRANT SELECT ON TABLE "public"."progress_photos" TO "anon";

GRANT TRIGGER ON TABLE "public"."progress_photos" TO "anon";

GRANT TRUNCATE ON TABLE "public"."progress_photos" TO "anon";

GRANT UPDATE ON TABLE "public"."progress_photos" TO "anon";

GRANT DELETE ON TABLE "public"."progress_photos" TO "authenticated";

GRANT INSERT ON TABLE "public"."progress_photos" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."progress_photos" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."progress_photos" TO "authenticated";

GRANT SELECT ON TABLE "public"."progress_photos" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."progress_photos" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."progress_photos" TO "authenticated";

GRANT UPDATE ON TABLE "public"."progress_photos" TO "authenticated";

GRANT DELETE ON TABLE "public"."progress_photos" TO "postgres";

GRANT INSERT ON TABLE "public"."progress_photos" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."progress_photos" TO "postgres";

GRANT REFERENCES ON TABLE "public"."progress_photos" TO "postgres";

GRANT SELECT ON TABLE "public"."progress_photos" TO "postgres";

GRANT TRIGGER ON TABLE "public"."progress_photos" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."progress_photos" TO "postgres";

GRANT UPDATE ON TABLE "public"."progress_photos" TO "postgres";

GRANT DELETE ON TABLE "public"."progress_photos" TO "service_role";

GRANT INSERT ON TABLE "public"."progress_photos" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."progress_photos" TO "service_role";

GRANT REFERENCES ON TABLE "public"."progress_photos" TO "service_role";

GRANT SELECT ON TABLE "public"."progress_photos" TO "service_role";

GRANT TRIGGER ON TABLE "public"."progress_photos" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."progress_photos" TO "service_role";

GRANT UPDATE ON TABLE "public"."progress_photos" TO "service_role";


































REVOKE ALL ON TABLE "public"."workout_log_exercises" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."workout_log_exercises" TO "anon";

GRANT INSERT ON TABLE "public"."workout_log_exercises" TO "anon";

GRANT MAINTAIN ON TABLE "public"."workout_log_exercises" TO "anon";

GRANT REFERENCES ON TABLE "public"."workout_log_exercises" TO "anon";

GRANT SELECT ON TABLE "public"."workout_log_exercises" TO "anon";

GRANT TRIGGER ON TABLE "public"."workout_log_exercises" TO "anon";

GRANT TRUNCATE ON TABLE "public"."workout_log_exercises" TO "anon";

GRANT UPDATE ON TABLE "public"."workout_log_exercises" TO "anon";

GRANT DELETE ON TABLE "public"."workout_log_exercises" TO "authenticated";

GRANT INSERT ON TABLE "public"."workout_log_exercises" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."workout_log_exercises" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."workout_log_exercises" TO "authenticated";

GRANT SELECT ON TABLE "public"."workout_log_exercises" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."workout_log_exercises" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."workout_log_exercises" TO "authenticated";

GRANT UPDATE ON TABLE "public"."workout_log_exercises" TO "authenticated";

GRANT DELETE ON TABLE "public"."workout_log_exercises" TO "postgres";

GRANT INSERT ON TABLE "public"."workout_log_exercises" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."workout_log_exercises" TO "postgres";

GRANT REFERENCES ON TABLE "public"."workout_log_exercises" TO "postgres";

GRANT SELECT ON TABLE "public"."workout_log_exercises" TO "postgres";

GRANT TRIGGER ON TABLE "public"."workout_log_exercises" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."workout_log_exercises" TO "postgres";

GRANT UPDATE ON TABLE "public"."workout_log_exercises" TO "postgres";

GRANT DELETE ON TABLE "public"."workout_log_exercises" TO "service_role";

GRANT INSERT ON TABLE "public"."workout_log_exercises" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."workout_log_exercises" TO "service_role";

GRANT REFERENCES ON TABLE "public"."workout_log_exercises" TO "service_role";

GRANT SELECT ON TABLE "public"."workout_log_exercises" TO "service_role";

GRANT TRIGGER ON TABLE "public"."workout_log_exercises" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."workout_log_exercises" TO "service_role";

GRANT UPDATE ON TABLE "public"."workout_log_exercises" TO "service_role";

REVOKE ALL ON TABLE "public"."workout_logs" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."workout_logs" TO "anon";

GRANT INSERT ON TABLE "public"."workout_logs" TO "anon";

GRANT MAINTAIN ON TABLE "public"."workout_logs" TO "anon";

GRANT REFERENCES ON TABLE "public"."workout_logs" TO "anon";

GRANT SELECT ON TABLE "public"."workout_logs" TO "anon";

GRANT TRIGGER ON TABLE "public"."workout_logs" TO "anon";

GRANT TRUNCATE ON TABLE "public"."workout_logs" TO "anon";

GRANT UPDATE ON TABLE "public"."workout_logs" TO "anon";

GRANT DELETE ON TABLE "public"."workout_logs" TO "authenticated";

GRANT INSERT ON TABLE "public"."workout_logs" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."workout_logs" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."workout_logs" TO "authenticated";

GRANT SELECT ON TABLE "public"."workout_logs" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."workout_logs" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."workout_logs" TO "authenticated";

GRANT UPDATE ON TABLE "public"."workout_logs" TO "authenticated";

GRANT DELETE ON TABLE "public"."workout_logs" TO "postgres";

GRANT INSERT ON TABLE "public"."workout_logs" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."workout_logs" TO "postgres";

GRANT REFERENCES ON TABLE "public"."workout_logs" TO "postgres";

GRANT SELECT ON TABLE "public"."workout_logs" TO "postgres";

GRANT TRIGGER ON TABLE "public"."workout_logs" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."workout_logs" TO "postgres";

GRANT UPDATE ON TABLE "public"."workout_logs" TO "postgres";

GRANT DELETE ON TABLE "public"."workout_logs" TO "service_role";

GRANT INSERT ON TABLE "public"."workout_logs" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."workout_logs" TO "service_role";

GRANT REFERENCES ON TABLE "public"."workout_logs" TO "service_role";

GRANT SELECT ON TABLE "public"."workout_logs" TO "service_role";

GRANT TRIGGER ON TABLE "public"."workout_logs" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."workout_logs" TO "service_role";

GRANT UPDATE ON TABLE "public"."workout_logs" TO "service_role";

REVOKE ALL ON TABLE "public"."workout_plans" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE ON TABLE "public"."workout_plans" TO "anon";

GRANT INSERT ON TABLE "public"."workout_plans" TO "anon";

GRANT MAINTAIN ON TABLE "public"."workout_plans" TO "anon";

GRANT REFERENCES ON TABLE "public"."workout_plans" TO "anon";

GRANT SELECT ON TABLE "public"."workout_plans" TO "anon";

GRANT TRIGGER ON TABLE "public"."workout_plans" TO "anon";

GRANT TRUNCATE ON TABLE "public"."workout_plans" TO "anon";

GRANT UPDATE ON TABLE "public"."workout_plans" TO "anon";

GRANT DELETE ON TABLE "public"."workout_plans" TO "authenticated";

GRANT INSERT ON TABLE "public"."workout_plans" TO "authenticated";

GRANT MAINTAIN ON TABLE "public"."workout_plans" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."workout_plans" TO "authenticated";

GRANT SELECT ON TABLE "public"."workout_plans" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."workout_plans" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."workout_plans" TO "authenticated";

GRANT UPDATE ON TABLE "public"."workout_plans" TO "authenticated";

GRANT DELETE ON TABLE "public"."workout_plans" TO "postgres";

GRANT INSERT ON TABLE "public"."workout_plans" TO "postgres";

GRANT MAINTAIN ON TABLE "public"."workout_plans" TO "postgres";

GRANT REFERENCES ON TABLE "public"."workout_plans" TO "postgres";

GRANT SELECT ON TABLE "public"."workout_plans" TO "postgres";

GRANT TRIGGER ON TABLE "public"."workout_plans" TO "postgres";

GRANT TRUNCATE ON TABLE "public"."workout_plans" TO "postgres";

GRANT UPDATE ON TABLE "public"."workout_plans" TO "postgres";

GRANT DELETE ON TABLE "public"."workout_plans" TO "service_role";

GRANT INSERT ON TABLE "public"."workout_plans" TO "service_role";

GRANT MAINTAIN ON TABLE "public"."workout_plans" TO "service_role";

GRANT REFERENCES ON TABLE "public"."workout_plans" TO "service_role";

GRANT SELECT ON TABLE "public"."workout_plans" TO "service_role";

GRANT TRIGGER ON TABLE "public"."workout_plans" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."workout_plans" TO "service_role";

GRANT UPDATE ON TABLE "public"."workout_plans" TO "service_role";

REVOKE ALL ON SCHEMA "public" FROM PUBLIC, "anon", "authenticated", "pg_database_owner", "postgres", "service_role";

GRANT USAGE ON SCHEMA "public" TO PUBLIC;

GRANT USAGE ON SCHEMA "public" TO "anon";

GRANT USAGE ON SCHEMA "public" TO "authenticated";

GRANT CREATE ON SCHEMA "public" TO "pg_database_owner";

GRANT USAGE ON SCHEMA "public" TO "pg_database_owner";

GRANT USAGE ON SCHEMA "public" TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated, service_role, postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role, postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated, service_role, postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON SEQUENCES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON SEQUENCES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT USAGE ON SEQUENCES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON SEQUENCES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON SEQUENCES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT USAGE ON SEQUENCES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON SEQUENCES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON SEQUENCES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT USAGE ON SEQUENCES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT USAGE ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT INSERT ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT MAINTAIN ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRIGGER ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRUNCATE ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT INSERT ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT MAINTAIN ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRIGGER ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRUNCATE ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT INSERT ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT MAINTAIN ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRIGGER ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRUNCATE ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE ON TABLES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT INSERT ON TABLES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT MAINTAIN ON TABLES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES ON TABLES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRIGGER ON TABLES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRUNCATE ON TABLES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON TABLES TO "service_role";

ALTER PUBLICATION supabase_realtime ADD TABLE "public"."appointments";

ALTER PUBLICATION supabase_realtime ADD TABLE "public"."messages";

ALTER PUBLICATION supabase_realtime ADD TABLE "public"."notifications";

RESET check_function_bodies;
