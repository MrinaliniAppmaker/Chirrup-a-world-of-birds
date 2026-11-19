// Development-only additive migration. Never truncate existing journals.
import { pool } from "@workspace/db";

if (process.env.NODE_ENV === "production") throw new Error("Use the managed deployment schema migration in production.");
try {
  await pool.query(`
    BEGIN;
    ALTER TABLE journal_installations ADD COLUMN IF NOT EXISTS account_id text;
    ALTER TABLE journal_installations ADD COLUMN IF NOT EXISTS claimed_by text;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'journal_installations_account_id_unique') THEN
        ALTER TABLE journal_installations ADD CONSTRAINT journal_installations_account_id_unique UNIQUE(account_id);
      END IF;
    END $$;
    COMMIT;
  `);
  process.stdout.write("Added account ownership without changing existing journal rows.\n");
} finally { await pool.end(); }
