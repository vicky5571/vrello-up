# Handover — Fix Prisma Migration History Drift

**Status:** Complete  
**Date:** 2026-11-03  
**Estimated time:** 5 minutes  
**Risk:** Low — DB schema is already correct, this is bookkeeping only

---

## What Is Wrong

| Check | Reality |
|---|---|
| Live DB schema | ✅ All tables and columns exist and are correct, including `mediaAttachments jsonb` |
| `_prisma_migrations` table | ❌ **Does not exist** — was never created (DB was built via `db push` or manual SQL, never via `migrate deploy`) |
| `prisma/migrations/` folder | 5 migration directories exist |
| `prisma migrate status` output | "5 migrations have not yet been applied" — because there is no tracking table at all |

**Nothing is broken at runtime.** The app works. This is purely a bookkeeping fix so that future `prisma migrate dev` commands work cleanly.

---

## Environment (Confirmed Working)

```
DATABASE_URL  → aws-0-ap-southeast-1.pooler.supabase.com:6543  (pgbouncer, runtime)
DIRECT_URL    → db.kkstcawepmqenghaqxzt.supabase.co:5432       (direct, migrations)
```

Both are in `.env.local` and take precedence over `.env`. The direct connection is confirmed reachable.

---

## The Fix — 3 Commands Total

Run these one at a time in the project root. Each one is safe to re-run.

### Step 1 — Mark all 5 existing migrations as applied

These commands will:
1. Create the `_prisma_migrations` table in the live DB (first command does this)
2. Insert a row for each migration marking it as "applied"

```bash
cd "/Users/mac/Web Development/vrello-up"

npx prisma migrate resolve --applied 20260906221636_marcom_port
npx prisma migrate resolve --applied 20261027000000_remove_workspace_tenant
npx prisma migrate resolve --applied 20261029072742_add_user_auth_model
npx prisma migrate resolve --applied 20261029134026_drop_task_models
npx prisma migrate resolve --applied 20261030192500_add_inventory_system
```

Expected output for each:
```
Migration 20260906221636_marcom_port marked as applied.
```

### Step 2 — Create a migration file for `mediaAttachments`

The `mediaAttachments JSONB` column already exists in the live DB but has no migration file. Use `--create-only` so Prisma generates the SQL file WITHOUT trying to run it (running it would fail because the column already exists).

```bash
npx prisma migrate dev --name add_media_attachments --create-only
```

Expected output:
```
Prisma Migrate created the following migration without applying it 20261103XXXXXX_add_media_attachments
```

This creates a new file at:
```
prisma/migrations/20261103XXXXXX_add_media_attachments/migration.sql
```

The generated SQL will be:
```sql
ALTER TABLE "ContentPost" ADD COLUMN "mediaAttachments" JSONB NOT NULL DEFAULT '[]';
```

**Do NOT run `prisma migrate dev` without `--create-only`** — Prisma would try to re-create the column and fail.

### Step 3 — Mark the new migration as applied

Take the exact timestamp-prefixed name from the output of Step 2 and run:

```bash
npx prisma migrate resolve --applied 20261103XXXXXX_add_media_attachments
```

Replace `20261103XXXXXX` with the actual timestamp from the folder name created in Step 2.

---

## Verification

```bash
npx prisma migrate status
```

Expected output:
```
5 migrations found in prisma/migrations
All migrations have been applied.
```

Wait — after Step 2 and 3, there will be **6 migrations**. Expected:
```
6 migrations found in prisma/migrations
All migrations have been applied.
```

Then run the full check suite:
```bash
npm run build:check   # Must be 0 TypeScript errors
npm test              # Must be 0 failures
```

---

## What NOT to Do

| Do NOT | Because |
|---|---|
| `npx prisma migrate dev` (without `--create-only`) | Prisma will try to apply all 5 pending migrations → column conflicts, data loss risk |
| `npx prisma migrate reset` | Drops and recreates the entire DB — destroys live data |
| `npx prisma db push` | Bypasses migration tracking again — perpetuates the drift |
| Edit migration SQL files manually | Not needed; Prisma generates them correctly |

---

## If Step 2 Errors

If `prisma migrate dev --create-only` complains that there is schema drift (schema doesn't match DB), it means there's an unexpected difference between the schema file and live DB. In that case:

1. Check what Prisma detected: `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma`
2. Or just create the migration file manually:

```bash
mkdir -p prisma/migrations/20261103000000_add_media_attachments
cat > prisma/migrations/20261103000000_add_media_attachments/migration.sql << 'EOF'
-- AlterTable
ALTER TABLE "ContentPost" ADD COLUMN IF NOT EXISTS "mediaAttachments" JSONB NOT NULL DEFAULT '[]';
EOF
```

Then mark it applied:
```bash
npx prisma migrate resolve --applied 20261103000000_add_media_attachments
```

Note the `IF NOT EXISTS` — safe to run even if column already exists.

---

## After Completion — Update SESSION_STATE.md

In `docs/SESSION_STATE.md`, move "Prisma migration drift" from **Active** to **Completed**:

```
- Fixed Prisma migration drift — _prisma_migrations table created, all 6 migrations marked applied
```

---

## Full Context (Why This Happened)

The DB was originally set up with `prisma db push` or direct SQL, which applies schema changes without creating or updating the `_prisma_migrations` tracking table. This is common during early development. The migration files in `prisma/migrations/` were created later and describe the same schema that's already in the DB — so marking them as "applied" is truthful: the changes they describe are already there, just not recorded.

The `mediaAttachments` column specifically was added via `db push` in a previous session (confirmed: column exists in DB, no migration file for it, schema.prisma has it).
