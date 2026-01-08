-- Create Model table with proper case for column names
CREATE TABLE "Model" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contextWindow" INTEGER,
    "capabilities" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on provider + name
CREATE UNIQUE INDEX "Model_provider_name_key" ON "Model"("provider", "name");

-- Add modelId column to Task (nullable for migration)
ALTER TABLE "Task" ADD COLUMN "modelId" TEXT;

-- Add modelData column as fallback for legacy data
ALTER TABLE "Task" ADD COLUMN "modelData" JSONB;

-- Migrate existing model JSON data to Model table and update Task
DO $$
DECLARE
    task_record RECORD;
    new_model_id TEXT;
    v_provider TEXT;
    v_name TEXT;
    v_title TEXT;
    v_contextWindow INTEGER;
    v_capabilities JSONB;
BEGIN
    FOR task_record IN SELECT id, model FROM "Task" WHERE model IS NOT NULL LOOP
        -- Extract values from JSONB
        v_provider := task_record.model->>'provider';
        v_name := task_record.model->>'name';
        v_title := COALESCE(task_record.model->>'title', v_name);
        v_contextWindow := NULL;
        BEGIN
            v_contextWindow := (task_record.model->>'contextWindow')::INTEGER;
        EXCEPTION WHEN OTHERS THEN
            v_contextWindow := NULL;
        END;
        v_capabilities := task_record.model->'capabilities';

        -- Check if model already exists in Model table
        SELECT id INTO new_model_id FROM "Model" 
        WHERE provider = v_provider 
        AND name = v_name
        LIMIT 1;

        -- If not found, create new Model entry
        IF new_model_id IS NULL THEN
            new_model_id := gen_random_uuid()::text;
            INSERT INTO "Model" (id, provider, name, title, "contextWindow", capabilities, "isActive", "isDefault", "createdAt", "updatedAt")
            VALUES (
                new_model_id,
                v_provider,
                v_name,
                v_title,
                v_contextWindow,
                v_capabilities,
                true,
                false,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END IF;

        -- Update Task with modelId and preserve modelData
        UPDATE "Task" 
        SET "modelId" = new_model_id,
            "modelData" = task_record.model
        WHERE id = task_record.id;
    END LOOP;
END $$;

-- Drop the old model column
ALTER TABLE "Task" DROP COLUMN "model";
