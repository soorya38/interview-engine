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
	VALUES ('admin', '$2b$10$tqM5pBOBIo/XcGkEtxkr2uKxPLhclVx9Zjv/oabf7p39JuWOfb82q', 'admin', 'Admin User', 'admin@gmail.com')
	RETURNING "id"
),
student_users AS (
	INSERT INTO "users" ("username", "password", "role", "full_name", "email")
	VALUES 
		('soorya', '$2b$10$b5EONX3FeiiGE6/qXVi5y.xJTCZbBNcvTPTTnPiH4R713CZ1rn9ju', 'user', 'Soorya', 'soorya@gmail.com'),
		('sharvesh', '$2b$10$b5EONX3FeiiGE6/qXVi5y.xJTCZbBNcvTPTTnPiH4R713CZ1rn9ju', 'user', 'Sharvesh', 'sharvesh@gmail.com'),
		('sudhir', '$2b$10$b5EONX3FeiiGE6/qXVi5y.xJTCZbBNcvTPTTnPiH4R713CZ1rn9ju', 'user', 'Sudhir', 'sudhir@gmail.com'),
		('vishwanathan', '$2b$10$b5EONX3FeiiGE6/qXVi5y.xJTCZbBNcvTPTTnPiH4R713CZ1rn9ju', 'user', 'Vishwanathan', 'vishwanathan@gmail.com')
	RETURNING "id"
),
topic_cats AS (
	INSERT INTO "topic_categories" ("name", "description", "icon_name", "created_by")
	SELECT 
		'Mathematics', 
		'Mathematics concepts including algebra, geometry, and calculus', 
		'BookOpen', 
		(SELECT "id" FROM admin_user)
	UNION ALL
	SELECT 
		'Science', 
		'Science topics covering physics, chemistry, and biology', 
		'BookOpen', 
		(SELECT "id" FROM admin_user)
	UNION ALL
	SELECT 
		'English', 
		'English language, literature, and communication skills', 
		'BookOpen', 
		(SELECT "id" FROM admin_user)
	UNION ALL
	SELECT 
		'History', 
		'World history, historical events, and civilizations', 
		'BookOpen', 
		(SELECT "id" FROM admin_user)
	RETURNING "id", "name"
),
math_questions AS (
	INSERT INTO "questions" ("topic_category_id", "question_text", "difficulty", "expected_key_points", "created_by")
	SELECT 
		(SELECT "id" FROM topic_cats WHERE "name" = 'Mathematics'),
		val.question_text,
		val.difficulty,
		val.expected_key_points::jsonb,
		(SELECT "id" FROM admin_user)
	FROM (VALUES
		('Explain the Pythagorean theorem and provide an example of its application.', 'medium', '["a² + b² = c²", "right triangle", "hypotenuse", "example"]'::jsonb),
		('What is the difference between mean, median, and mode? Provide an example.', 'medium', '["mean", "median", "mode", "average", "example"]'::jsonb),
		('Explain how to solve a quadratic equation using the quadratic formula.', 'medium', '["ax² + bx + c = 0", "quadratic formula", "discriminant", "solutions"]'::jsonb),
		('What is the difference between prime and composite numbers? Give examples.', 'easy', '["prime numbers", "composite numbers", "factors", "examples"]'::jsonb),
		('Explain the concept of slope in linear equations. How do you calculate it?', 'medium', '["slope", "rise over run", "y = mx + b", "calculation"]'::jsonb),
		('What is the area of a circle? Explain the formula and its components.', 'easy', '["πr²", "radius", "pi", "circle area"]'::jsonb),
		('Describe the order of operations (PEMDAS) and why it''s important.', 'easy', '["PEMDAS", "BODMAS", "order", "operations", "parentheses"]'::jsonb),
		('Explain the concept of derivatives in calculus and their practical applications.', 'hard', '["derivative", "rate of change", "calculus", "applications"]'::jsonb),
		('What is the difference between permutations and combinations? Provide examples.', 'medium', '["permutations", "combinations", "order matters", "examples"]'::jsonb),
		('Explain the properties of exponents with examples.', 'medium', '["exponents", "properties", "multiplication", "division", "examples"]'::jsonb)
	) AS val(question_text, difficulty, expected_key_points)
	RETURNING "id"
),
science_questions AS (
	INSERT INTO "questions" ("topic_category_id", "question_text", "difficulty", "expected_key_points", "created_by")
	SELECT 
		(SELECT "id" FROM topic_cats WHERE "name" = 'Science'),
		val.question_text,
		val.difficulty,
		val.expected_key_points::jsonb,
		(SELECT "id" FROM admin_user)
	FROM (VALUES
		('Explain the water cycle and describe each stage in detail.', 'medium', '["evaporation", "condensation", "precipitation", "collection"]'::jsonb),
		('What is photosynthesis? Explain the process and its importance.', 'medium', '["photosynthesis", "chlorophyll", "carbon dioxide", "oxygen", "glucose"]'::jsonb),
		('Describe Newton''s three laws of motion with examples for each.', 'medium', '["Newton''s laws", "inertia", "force", "action-reaction", "examples"]'::jsonb),
		('What is the difference between an atom and a molecule? Provide examples.', 'easy', '["atom", "molecule", "element", "compound", "examples"]'::jsonb),
		('Explain the structure and function of DNA in living organisms.', 'hard', '["DNA", "double helix", "nucleotides", "genetic information"]'::jsonb),
		('What is the greenhouse effect and why is it important for Earth''s climate?', 'medium', '["greenhouse effect", "carbon dioxide", "global warming", "atmosphere"]'::jsonb),
		('Describe the difference between physical and chemical changes with examples.', 'easy', '["physical change", "chemical change", "reversible", "examples"]'::jsonb),
		('Explain the process of cellular respiration and its significance.', 'medium', '["cellular respiration", "mitochondria", "ATP", "energy"]'::jsonb),
		('What is the difference between renewable and non-renewable energy sources?', 'easy', '["renewable", "non-renewable", "solar", "fossil fuels", "examples"]'::jsonb),
		('Describe the human circulatory system and explain how blood flows through the body.', 'medium', '["heart", "arteries", "veins", "blood flow", "circulation"]'::jsonb)
	) AS val(question_text, difficulty, expected_key_points)
	RETURNING "id"
),
english_questions AS (
	INSERT INTO "questions" ("topic_category_id", "question_text", "difficulty", "expected_key_points", "created_by")
	SELECT 
		(SELECT "id" FROM topic_cats WHERE "name" = 'English'),
		val.question_text,
		val.difficulty,
		val.expected_key_points::jsonb,
		(SELECT "id" FROM admin_user)
	FROM (VALUES
		('Explain the difference between a simile and a metaphor with examples.', 'medium', '["simile", "metaphor", "comparison", "like", "as", "examples"]'::jsonb),
		('What is the difference between active and passive voice? Provide examples.', 'medium', '["active voice", "passive voice", "subject", "object", "examples"]'::jsonb),
		('Describe the three main types of point of view in literature with examples.', 'medium', '["first person", "second person", "third person", "narrator", "examples"]'::jsonb),
		('What is the difference between a topic sentence and a thesis statement?', 'easy', '["topic sentence", "thesis statement", "paragraph", "essay"]'::jsonb),
		('Explain the use of figurative language in poetry and provide examples.', 'medium', '["figurative language", "imagery", "symbolism", "poetry", "examples"]'::jsonb),
		('What are the key elements of a well-structured essay?', 'easy', '["introduction", "body paragraphs", "conclusion", "thesis", "structure"]'::jsonb),
		('Describe the difference between denotation and connotation with examples.', 'medium', '["denotation", "connotation", "dictionary meaning", "implied meaning", "examples"]'::jsonb),
		('Explain the importance of proper punctuation in written communication.', 'easy', '["punctuation", "clarity", "meaning", "communication"]'::jsonb),
		('What is the difference between a primary and secondary source?', 'medium', '["primary source", "secondary source", "original", "interpretation", "research"]'::jsonb),
		('Describe the characteristics of different literary genres with examples.', 'medium', '["fiction", "non-fiction", "poetry", "drama", "genre", "examples"]'::jsonb)
	) AS val(question_text, difficulty, expected_key_points)
	RETURNING "id"
),
history_questions AS (
	INSERT INTO "questions" ("topic_category_id", "question_text", "difficulty", "expected_key_points", "created_by")
	SELECT 
		(SELECT "id" FROM topic_cats WHERE "name" = 'History'),
		val.question_text,
		val.difficulty,
		val.expected_key_points::jsonb,
		(SELECT "id" FROM admin_user)
	FROM (VALUES
		('Explain the causes and consequences of World War I.', 'hard', '["World War I", "alliances", "assassination", "treaty", "consequences"]'::jsonb),
		('Describe the significance of the Renaissance period in European history.', 'medium', '["Renaissance", "Italy", "art", "science", "humanism", "impact"]'::jsonb),
		('What were the main causes of the American Revolution?', 'medium', '["taxation", "representation", "independence", "British rule", "causes"]'::jsonb),
		('Explain the importance of the Industrial Revolution and its global impact.', 'medium', '["Industrial Revolution", "technology", "economy", "social change", "impact"]'::jsonb),
		('Describe the key events and significance of the Civil Rights Movement.', 'hard', '["civil rights", "equality", "leadership", "events", "significance"]'::jsonb),
		('What was the Cold War and how did it affect international relations?', 'hard', '["Cold War", "USA", "USSR", "tensions", "proxy wars", "impact"]'::jsonb),
		('Explain the causes and effects of the French Revolution.', 'medium', '["French Revolution", "causes", "effects", "monarchy", "democracy"]'::jsonb),
		('Describe the major achievements of ancient civilizations like Egypt or Mesopotamia.', 'medium', '["ancient civilizations", "achievements", "culture", "technology", "contributions"]'::jsonb),
		('What was the significance of the Magna Carta in the development of democracy?', 'medium', '["Magna Carta", "democracy", "rights", "limitation of power", "significance"]'::jsonb),
		('Explain the impact of colonialism on different regions of the world.', 'hard', '["colonialism", "imperialism", "economic", "cultural", "political", "impact"]'::jsonb)
	) AS val(question_text, difficulty, expected_key_points)
	RETURNING "id"
),
all_math_ids AS (
	SELECT jsonb_agg("id"::text) as ids FROM math_questions
),
all_science_ids AS (
	SELECT jsonb_agg("id"::text) as ids FROM science_questions
),
all_english_ids AS (
	SELECT jsonb_agg("id"::text) as ids FROM english_questions
),
all_history_ids AS (
	SELECT jsonb_agg("id"::text) as ids FROM history_questions
)
INSERT INTO "tests" ("name", "description", "question_ids", "duration", "difficulty", "is_active", "created_by")
SELECT 
	'Mathematics Fundamentals Test',
	'Comprehensive mathematics assessment covering algebra, geometry, and problem-solving',
	(SELECT ids FROM all_math_ids),
	60,
	'mixed',
	true,
	(SELECT "id" FROM admin_user)
UNION ALL
SELECT 
	'Science Fundamentals Test',
	'Comprehensive science assessment covering physics, chemistry, and biology concepts',
	(SELECT ids FROM all_science_ids),
	60,
	'mixed',
	true,
	(SELECT "id" FROM admin_user)
UNION ALL
SELECT 
	'English Language and Literature Test',
	'Assessment covering language skills, literary analysis, and communication',
	(SELECT ids FROM all_english_ids),
	60,
	'mixed',
	true,
	(SELECT "id" FROM admin_user)
UNION ALL
SELECT 
	'World History Test',
	'Comprehensive history assessment covering major events, civilizations, and historical periods',
	(SELECT ids FROM all_history_ids),
	60,
	'mixed',
	true,
	(SELECT "id" FROM admin_user);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- 
-- Default Credentials:
-- Admin: username='admin', password='admin123'
-- Students: username='soorya'/'sharvesh'/'sudhir'/'vishwanathan', password='Siet@123'
--
-- Created:
-- - 1 admin user
-- - 4 student users
-- - 4 topic categories (Mathematics, Science, English, History)
-- - 10 Mathematics questions
-- - 10 Science questions
-- - 10 English questions
-- - 10 History questions
-- - 4 active tests (one for each topic category)
-- ============================================

