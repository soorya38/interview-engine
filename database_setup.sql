-- ============================================
-- Complete Database Migration and Seed File
-- ============================================
-- This file contains the complete schema setup and seed data
-- Run this file to set up your database from scratch
-- ============================================

-- Drop existing tables (in reverse dependency order to handle foreign keys)
DROP TABLE IF EXISTS "scores" CASCADE;
DROP TABLE IF EXISTS "interview_turns" CASCADE;
DROP TABLE IF EXISTS "interview_sessions" CASCADE;
DROP TABLE IF EXISTS "questions" CASCADE;
DROP TABLE IF EXISTS "tests" CASCADE;
DROP TABLE IF EXISTS "topic_categories" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

-- Users table
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(255) NOT NULL UNIQUE,
	"password" text NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"full_name" text,
	"email" varchar(255),
	"profile_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Topic Categories table
CREATE TABLE "topic_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"icon_name" varchar(100),
	"created_by" uuid REFERENCES "users"("id"),
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Questions table
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_category_id" uuid NOT NULL REFERENCES "topic_categories"("id"),
	"question_text" text NOT NULL,
	"difficulty" varchar(50) NOT NULL,
	"expected_key_points" jsonb,
	"created_by" uuid REFERENCES "users"("id"),
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Tests table
CREATE TABLE "tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"question_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"duration" integer,
	"difficulty" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid REFERENCES "users"("id"),
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Interview Sessions table
CREATE TABLE "interview_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id"),
	"test_id" uuid NOT NULL REFERENCES "tests"("id"),
	"status" varchar(50) DEFAULT 'in_progress' NOT NULL,
	"current_question_index" integer DEFAULT 0 NOT NULL,
	"question_ids" jsonb NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);

-- Interview Turns table
CREATE TABLE "interview_turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL REFERENCES "interview_sessions"("id"),
	"question_id" uuid NOT NULL REFERENCES "questions"("id"),
	"turn_number" integer NOT NULL,
	"user_answer" text NOT NULL,
	"ai_response" text NOT NULL,
	"evaluation" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Scores table
CREATE TABLE "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL REFERENCES "interview_sessions"("id"),
	"user_id" uuid NOT NULL REFERENCES "users"("id"),
	"grammar_score" integer NOT NULL,
	"technical_score" integer NOT NULL,
	"depth_score" integer NOT NULL,
	"communication_score" integer NOT NULL,
	"total_score" integer NOT NULL,
	"grade" varchar(2),
	"detailed_feedback" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================
-- INSERT SEED DATA
-- ============================================

-- Insert users using CTEs to get the admin user ID
WITH admin_user AS (
	INSERT INTO "users" ("username", "password", "role", "full_name", "email")
	VALUES ('admin', '$2b$10$DSdZrtEKpI9AweIScrOrduarzGNlfzgfmmtAVb2tNigHNN93mulUy', 'admin', 'Admin User', 'admin@srishakthi.ac.in')
	RETURNING "id"
),
student_users AS (
	INSERT INTO "users" ("username", "password", "role", "full_name", "email")
	VALUES 
		('ramalingamm22ece', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Ramalingamm Ece', 'ramalingamm22ece@srishakthi.ac.in'),
		('gowthamg22cys', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Gowthamg Cys', 'gowthamg22cys@srishakthi.ac.in'),
		('kesavans22cys', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Kesavans Cys', 'kesavans22cys@srishakthi.ac.in'),
		('noorafikjalaludeena22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Noorafikjalaludeena Ads', 'noorafikjalaludeena22ads@srishakthi.ac.in'),
		('rishir22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Rishir Ads', 'rishir22ads@srishakthi.ac.in'),
		('sivraamkrishnankv22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Sivraamkrishnankv Ads', 'sivraamkrishnankv22ads@srishakthi.ac.in'),
		('varuns22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Varuns Ads', 'varuns22ads@srishakthi.ac.in'),
		('deepakt22aml', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Deepakt Aml', 'deepakt22aml@srishakthi.ac.in'),
		('prakashdassr22aml', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Prakashdassr Aml', 'prakashdassr22aml@srishakthi.ac.in'),
		('abdulgousea22it', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Abdulgousea It', 'abdulgousea22it@srishakthi.ac.in'),
		('ancyjemigoldbellp22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Ancyjemigoldbellp Cse', 'ancyjemigoldbellp22cse@srishakthi.ac.in'),
		('mohammedasani22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Mohammedasani Cse', 'mohammedasani22cse@srishakthi.ac.in'),
		('vishwar22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Vishwar Cse', 'vishwar22cse@srishakthi.ac.in'),
		('yasinmalikj22ece', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Yasinmalikj Ece', 'yasinmalikj22ece@srishakthi.ac.in'),
		('ajaykumarjs22cys', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Ajaykumarjs Cys', 'ajaykumarjs22cys@srishakthi.ac.in'),
		('mohamedrafill22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Mohamedrafill Ads', 'mohamedrafill22ads@srishakthi.ac.in'),
		('kirthikaamk22aml', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Kirthikaamk Aml', 'kirthikaamk22aml@srishakthi.ac.in'),
		('sanjeevikumarm22aml', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Sanjeevikumarm Aml', 'sanjeevikumarm22aml@srishakthi.ac.in'),
		('deeksheethn22it', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Deeksheethn It', 'deeksheethn22it@srishakthi.ac.in'),
		('matheshm22it', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Matheshm It', 'matheshm22it@srishakthi.ac.in'),
		('ponnarasua22it', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Ponnarasua It', 'ponnarasua22it@srishakthi.ac.in'),
		('tharanil22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Tharanil Cse', 'tharanil22cse@srishakthi.ac.in'),
		('dhivanans22eee', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Dhivanans Eee', 'dhivanans22eee@srishakthi.ac.in'),
		('maheshkumaark22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Maheshkumaark Ads', 'maheshkumaark22ads@srishakthi.ac.in'),
		('mohammedasathk22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Mohammedasathk Ads', 'mohammedasathk22ads@srishakthi.ac.in'),
		('karthikadevim22it', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Karthikadevim It', 'karthikadevim22it@srishakthi.ac.in'),
		('mervinj22it', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Mervinj It', 'mervinj22it@srishakthi.ac.in'),
		('madhang22ece', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Madhang Ece', 'madhang22ece@srishakthi.ac.in'),
		('sriramm22ece', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Sriramm Ece', 'sriramm22ece@srishakthi.ac.in'),
		('yuvankrishnap22cys', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Yuvankrishnap Cys', 'yuvankrishnap22cys@srishakthi.ac.in'),
		('harishj22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Harishj Ads', 'harishj22ads@srishakthi.ac.in'),
		('harishp22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Harishp Ads', 'harishp22ads@srishakthi.ac.in'),
		('bharathg22aml', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Bharathg Aml', 'bharathg22aml@srishakthi.ac.in'),
		('harinivasm22aml', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Harinivasm Aml', 'harinivasm22aml@srishakthi.ac.in'),
		('harshadd22aml', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Harshadd Aml', 'harshadd22aml@srishakthi.ac.in'),
		('dilipkumarn22it', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Dilipkumarn It', 'dilipkumarn22it@srishakthi.ac.in'),
		('sivadharshinin22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Sivadharshinin Cse', 'sivadharshinin22cse@srishakthi.ac.in'),
		('thulasikishorep22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Thulasikishorep Cse', 'thulasikishorep22cse@srishakthi.ac.in'),
		('ridhinyab22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Ridhinyab Ads', 'ridhinyab22ads@srishakthi.ac.in'),
		('ravichandranr22aml', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Ravichandranr Aml', 'ravichandranr22aml@srishakthi.ac.in'),
		('dharshand22it', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Dharshand It', 'dharshand22it@srishakthi.ac.in'),
		('prabincs22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Prabincs Cse', 'prabincs22cse@srishakthi.ac.in'),
		('saieshcb22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Saieshcb Cse', 'saieshcb22cse@srishakthi.ac.in'),
		('dineshkumargm22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Dineshkumargm Ads', 'dineshkumargm22ads@srishakthi.ac.in'),
		('seemamaglins22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Seemamaglins Ads', 'seemamaglins22ads@srishakthi.ac.in'),
		('krishnant22aml', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Krishnant Aml', 'krishnant22aml@srishakthi.ac.in'),
		('robinanburajb22aml', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Robinanburajb Aml', 'robinanburajb22aml@srishakthi.ac.in'),
		('suryar22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Suryar Cse', 'suryar22cse@srishakthi.ac.in'),
		('venyabalab22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Venyabalab Cse', 'venyabalab22cse@srishakthi.ac.in'),
		('edwinrajaa22cys', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Edwinrajaa Cys', 'edwinrajaa22cys@srishakthi.ac.in'),
		('shanjaiysb22cys', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Shanjaiysb Cys', 'shanjaiysb22cys@srishakthi.ac.in'),
		('deepikas22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Deepikas Ads', 'deepikas22ads@srishakthi.ac.in'),
		('nihasb22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Nihasb Ads', 'nihasb22ads@srishakthi.ac.in'),
		('divyaprabhag22it', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Divyaprabhag It', 'divyaprabhag22it@srishakthi.ac.in'),
		('magibalans22it', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Magibalans It', 'magibalans22it@srishakthi.ac.in'),
		('sanjayr22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Sanjayr Cse', 'sanjayr22cse@srishakthi.ac.in'),
		('balupiraveenk22ece', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Balupiraveenk Ece', 'balupiraveenk22ece@srishakthi.ac.in'),
		('mohammedakmals22cys', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Mohammedakmals Cys', 'mohammedakmals22cys@srishakthi.ac.in'),
		('vishwanathasriramm22cys', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Vishwanathasriramm Cys', 'vishwanathasriramm22cys@srishakthi.ac.in'),
		('meenup22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Meenup Ads', 'meenup22ads@srishakthi.ac.in'),
		('naveenkumarj22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Naveenkumarj Ads', 'naveenkumarj22ads@srishakthi.ac.in'),
		('sarayumam22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Sarayumam Ads', 'sarayumam22ads@srishakthi.ac.in'),
		('rahulrn22aml', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Rahulrn Aml', 'rahulrn22aml@srishakthi.ac.in'),
		('shasaankg22aml', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Shasaankg Aml', 'shasaankg22aml@srishakthi.ac.in'),
		('harishk22it', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Harishk It', 'harishk22it@srishakthi.ac.in'),
		('tharunm22eee', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Tharunm Eee', 'tharunm22eee@srishakthi.ac.in'),
		('saranprakashr22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Saranprakashr Ads', 'saranprakashr22ads@srishakthi.ac.in'),
		('harisshks22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Harisshks Cse', 'harisshks22cse@srishakthi.ac.in'),
		('rohithu22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Rohithu Cse', 'rohithu22cse@srishakthi.ac.in'),
		('abigurug22ece', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Abigurug Ece', 'abigurug22ece@srishakthi.ac.in'),
		('anandhithac22ece', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Anandhithac Ece', 'anandhithac22ece@srishakthi.ac.in'),
		('anushnu22cys', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Anushnu Cys', 'anushnu22cys@srishakthi.ac.in'),
		('jeevak22cys', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Jeevak Cys', 'jeevak22cys@srishakthi.ac.in'),
		('Karthickb22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Karthickb Ads', 'Karthickb22ads@srishakthi.ac.in'),
		('shikhasrinivas22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Shikhasrinivas Ads', 'shikhasrinivas22ads@srishakthi.ac.in'),
		('snehalaanandkumar22aml', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Snehalaanandkumar Aml', 'snehalaanandkumar22aml@srishakthi.ac.in'),
		('meenaumadevim22it', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Meenaumadevim It', 'meenaumadevim22it@srishakthi.ac.in'),
		('janarthana22ece', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Janarthana Ece', 'janarthana22ece@srishakthi.ac.in'),
		('pavithran22ece', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Pavithran Ece', 'pavithran22ece@srishakthi.ac.in'),
		('raghulkrishnac22ece', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Raghulkrishnac Ece', 'raghulkrishnac22ece@srishakthi.ac.in'),
		('albintenny22cys', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Albintenny Cys', 'albintenny22cys@srishakthi.ac.in'),
		('narendranav22cys', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Narendranav Cys', 'narendranav22cys@srishakthi.ac.in'),
		('monishv22aml', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Monishv Aml', 'monishv22aml@srishakthi.ac.in'),
		('sweathaj22aml', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Sweathaj Aml', 'sweathaj22aml@srishakthi.ac.in'),
		('adithyars22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Adithyars Cse', 'adithyars22cse@srishakthi.ac.in'),
		('bhavishnus22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Bhavishnus Cse', 'bhavishnus22cse@srishakthi.ac.in'),
		('shalinis22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Shalinis Cse', 'shalinis22cse@srishakthi.ac.in'),
		('sridhars22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Sridhars Cse', 'sridhars22cse@srishakthi.ac.in'),
		('karthikeyanscse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Karthikeyanscse', 'karthikeyanscse@srishakthi.ac.in'),
		('nirmalmuraris22ece', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Nirmalmuraris Ece', 'nirmalmuraris22ece@srishakthi.ac.in'),
		('nithishkumarvv22ece', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Nithishkumarvv Ece', 'nithishkumarvv22ece@srishakthi.ac.in'),
		('nivethav22cse', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Nivethav Cse', 'nivethav22cse@srishakthi.ac.in'),
		('thirukumaranyuvaraj22cys', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Thirukumaranyuvaraj Cys', 'thirukumaranyuvaraj22cys@srishakthi.ac.in'),
		('sandhyav22ads', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Sandhyav Ads', 'sandhyav22ads@srishakthi.ac.in'),
		('sibis22aml', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Sibis Aml', 'sibis22aml@srishakthi.ac.in'),
		('abinayas22it', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Abinayas It', 'abinayas22it@srishakthi.ac.in'),
		('kumarans22it', '$2b$10$0OgoMAteFeFb/ayPmdhDN.EGo5b6HhXbvHn3HgTmkjpwZoQncsgam', 'user', 'Kumarans It', 'kumarans22it@srishakthi.ac.in')
	RETURNING "id"
),
topic_cats AS (
	INSERT INTO "topic_categories" ("name", "description", "icon_name", "created_by")
	SELECT 
		'Java', 
		'Java programming fundamentals and concepts', 
		'BookOpen', 
		(SELECT "id" FROM admin_user)
	UNION ALL
	SELECT 
		'Python', 
		'Python programming fundamentals and concepts', 
		'BookOpen', 
		(SELECT "id" FROM admin_user)
	RETURNING "id", "name"
),
java_questions AS (
	INSERT INTO "questions" ("topic_category_id", "question_text", "difficulty", "expected_key_points", "created_by")
	SELECT 
		(SELECT "id" FROM topic_cats WHERE "name" = 'Java'),
		val.question_text,
		val.difficulty,
		val.expected_key_points::jsonb,
		(SELECT "id" FROM admin_user)
	FROM (VALUES
		('Which company owns Java now and what is the latest version?', 'easy', '["Oracle", "version", "ownership"]'::jsonb),
		('What are the 2 steps in Java compilation. Explain the 2 steps', 'medium', '["compile", "bytecode", "execution"]'::jsonb),
		('Explain the difference between Java compiler & Interpreter', 'medium', '["compiler", "interpreter", "bytecode", "machine code"]'::jsonb),
		('Is JVM platform independent?', 'easy', '["JVM", "platform dependent", "platform independent"]'::jsonb),
		('How does java ensure portability', 'medium', '["bytecode", "JVM", "platform independent"]'::jsonb),
		('Explain JVM, JRE, JDK', 'medium', '["JVM", "JRE", "JDK", "relationship"]'::jsonb),
		('What is a class loader? What is its purpose?', 'medium', '["class loader", "loading", "classes", "runtime"]'::jsonb),
		('Explain each word public static void main(String[] args)', 'medium', '["public", "static", "void", "main", "String array"]'::jsonb),
		('What is meant by a package in Java?', 'easy', '["package", "namespace", "organization", "classes"]'::jsonb),
		('When an object is created, is the memory allocated in stack or heap?', 'easy', '["heap", "object", "memory allocation"]'::jsonb),
		('What is Java String pool?', 'medium', '["String pool", "memory", "optimization", "strings"]'::jsonb)
	) AS val(question_text, difficulty, expected_key_points)
	RETURNING "id"
),
python_questions AS (
	INSERT INTO "questions" ("topic_category_id", "question_text", "difficulty", "expected_key_points", "created_by")
	SELECT 
		(SELECT "id" FROM topic_cats WHERE "name" = 'Python'),
		val.question_text,
		val.difficulty,
		val.expected_key_points::jsonb,
		(SELECT "id" FROM admin_user)
	FROM (VALUES
		('What is list comprehension? Give an example', 'medium', '["list comprehension", "syntax", "example", "iteration"]'::jsonb),
		('What happens when you assign list2 = list1?', 'easy', '["reference", "shallow copy", "same object"]'::jsonb),
		('Explain slicing function in python', 'easy', '["slicing", "syntax", "start", "stop", "step"]'::jsonb),
		('What is the difference between a list and a dictionary', 'easy', '["list", "dictionary", "key-value", "ordered"]'::jsonb),
		('What is the use of pass statement in python. Give an example', 'easy', '["pass", "placeholder", "null operation", "example"]'::jsonb),
		('How is exception handling done in python', 'medium', '["try", "except", "exception handling", "finally"]'::jsonb),
		('What is a lambda function? Give an example', 'medium', '["lambda", "anonymous function", "syntax", "example"]'::jsonb),
		('How are arguments passed to functions - by value or by reference in Python?', 'medium', '["pass by reference", "pass by value", "object reference"]'::jsonb),
		('Can we pass a function as an argument in python? Give an example', 'medium', '["first-class function", "higher-order function", "example"]'::jsonb),
		('Explain try except block in python with an example', 'medium', '["try", "except", "exception", "example", "error handling"]'::jsonb),
		('What are the different variable scopes in python', 'medium', '["local", "global", "nonlocal", "scope"]'::jsonb)
	) AS val(question_text, difficulty, expected_key_points)
	RETURNING "id"
),
all_java_ids AS (
	SELECT jsonb_agg("id"::text) as ids FROM java_questions
),
all_python_ids AS (
	SELECT jsonb_agg("id"::text) as ids FROM python_questions
)
INSERT INTO "tests" ("name", "description", "question_ids", "duration", "difficulty", "is_active", "created_by")
SELECT 
	'Java Fundamentals Test',
	'Comprehensive Java programming assessment covering core concepts',
	(SELECT ids FROM all_java_ids),
	60,
	'mixed',
	true,
	(SELECT "id" FROM admin_user)
UNION ALL
SELECT 
	'Python Fundamentals Test',
	'Comprehensive Python programming assessment covering core concepts',
	(SELECT ids FROM all_python_ids),
	60,
	'mixed',
	true,
	(SELECT "id" FROM admin_user);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- 
-- Default Credentials:
-- Admin: username='admin', password='admin123', email='admin@srishakthi.ac.in'
-- Students: All students have password='Siet@123'
--   Username is the part before @ in email (e.g., ramalingamm22ece for ramalingamm22ece@srishakthi.ac.in)
--
-- Created:
-- - 1 admin user
-- - 94 student users
-- - 2 topic categories (Java, Python)
-- - 11 Java questions
-- - 11 Python questions
-- - 2 active tests (Java Fundamentals Test, Python Fundamentals Test)
-- ============================================

