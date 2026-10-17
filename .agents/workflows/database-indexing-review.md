---
description: Review and design indexes for a new or modified tenant-scoped table. Enforces the Multi-Tenant Indexing Standards before any entity/migration is merged.
---

# Database Indexing Review Workflow

Run this workflow **before** adding `@Index`/`@Unique` decorators or writing `CREATE INDEX` SQL on any tenant-scoped table (every table in this repo carries `organization_id`).

## 0. Load the rule

Read **[database/database-multi-tenant-indexing/SKILL.md](../../.claude/skills/database/database-multi-tenant-indexing/SKILL.md)** first. The Cursor rule at `.cursor/rules/multi-tenant-indexing.mdc` activates automatically on `*.entity.ts` and `src/migrations/*.ts`.

## 1. Enumerate access patterns

For the table under change, list every query the application will run. Pull them from the service layer — never guess.

- Filter queries: `WHERE org_id = ? AND ?`
- Sort/pagination: `ORDER BY ? LIMIT ?`
- Uniqueness rules: business statements like "one X per org" or "globally unique X"
- FK lookups: `WHERE fk_id = ?`
- Search/JSON/array: `@@`, `?`, `&&`

## 2. Mandatory base index

Add `IDX_<table>_org` on `organization_id` — required for RLS. Skip ONLY if the table is genuinely tenantless (rare; ask before omitting).

```ts
@Index('IDX_<table>_org', ['organizationId'])
```

## 3. Apply the decision table

For each column / column-set from step 1, choose the right index shape using **SKILL.md → Composite Decision Table**. Default to single-column.

Output a short table in your PR description:

| Column(s) | Pattern matched | Index shape | Index name |
|---|---|---|---|
| `status` | low-cardinality enum + always with org_id | composite | `IDX_<t>_org_status` |
| `repository_id` | FK lookup | single-column | `IDX_<t>_repository` |
| `(asset_id)` nullable | nullable FK | partial single | `IDX_<t>_asset WHERE asset_id IS NOT NULL` |
| `(org_id, external_code)` | per-tenant unique | UNIQUE composite | `UQ_<t>_org_external` |
| `email` | globally unique | UNIQUE global | `UQ_<t>_email` |

## 4. Generate & inspect the migration

```bash
pnpm migration:generate
```

Read the generated SQL. Check:

- [ ] Every `CREATE INDEX` has a matching `DROP INDEX` in `down()`.
- [ ] Names follow `IDX_<table>_<column>` / `UQ_<table>_<columns>` — uppercase prefix only.
- [ ] Nullable FKs use a `WHERE … IS NOT NULL` partial.
- [ ] No accidental composite shadow of an existing single-column index (drop the redundant one).

## 5. Validate with EXPLAIN

For every new composite/partial, run the **real** ORM query through `EXPLAIN (ANALYZE, BUFFERS)` on a representative dataset. See `database/database-multi-tenant-indexing/references/explain-walkthrough.md`.

Block the PR if any of these appear:

- `Seq Scan` on the table
- `Sort` between `Index Scan` and `Limit`
- `Filter` removing > 50% of fetched rows

## 6. Drop dead indexes

```sql
SELECT relname, indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

Open a follow-up migration to drop any zero-scan index that isn’t a UNIQUE constraint or freshly added.

## 7. RLS + SECURITY.md cross-check

If RLS policies reference the new table, confirm:

- Policy uses `organization_id = current_setting('app.current_organization_id')::uuid` (or the project equivalent).
- `IDX_<table>_org` exists.
- `SECURITY.md` lists the table and its policy.

## 8. PR checklist

Paste into the PR description:

```md
### Indexing review
- [ ] `IDX_<table>_org` present
- [ ] Composite indexes match a row in the SKILL decision table
- [ ] Per-tenant uniqueness via `@Unique([...])` (NOT `@Column({unique:true})`)
- [ ] Nullable FK uses partial index
- [ ] EXPLAIN ANALYZE captured for every new composite (attach plan)
- [ ] No `idx_…` lowercase names
- [ ] Migration `down()` mirrors every index/constraint change
```

## Self-Learning Protocol

If a reviewer corrects an indexing decision, load **[common/common-session-retrospective](../../.claude/skills/common/common-session-retrospective/SKILL.md)** and capture the gap in **[common/common-learning-log](../../.claude/skills/common/common-learning-log/SKILL.md)**.
