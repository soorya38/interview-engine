-- Rename topics table to topic_categories
ALTER TABLE "topics" RENAME TO "topic_categories";

-- Update questions table to reference topic_categories
ALTER TABLE "questions" RENAME COLUMN "topic_id" TO "topic_category_id";
ALTER TABLE "questions" DROP CONSTRAINT "questions_topic_id_topics_id_fk";
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_category_id_topic_categories_id_fk" FOREIGN KEY ("topic_category_id") REFERENCES "public"."topic_categories"("id") ON DELETE no action ON UPDATE no action;

-- Update tests table to remove topic_id and add default for question_ids
ALTER TABLE "tests" DROP COLUMN "topic_id";
ALTER TABLE "tests" DROP CONSTRAINT "tests_topic_id_topics_id_fk";
ALTER TABLE "tests" ALTER COLUMN "question_ids" SET DEFAULT '[]'::jsonb;

-- Update interview_sessions to use test_id instead of topic_id (already done in 0001)
-- No changes needed here as it was already updated in the previous migration
