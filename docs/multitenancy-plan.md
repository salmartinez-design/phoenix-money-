# Xentli Multi-Tenancy Plan — Supabase + Row-Level Security

Status: **proposal for review** · No application code changes until approved.

## Goal
Move Xentli from browser-only `localStorage` to a real backend so multiple
tenants (businesses) can use it safely: authenticated, isolated, durable,
multi-device, and backed up. New tenants start empty; the owner's existing
data is migrated in as tenant #1.

---

## 1. Why we're changing
Today every number lives in the browser's `localStorage` (keys `phoenix-*`).
For a multi-tenant product this fails on:

- **Isolation** — two users on one device share data.
- **Identity** — no concept of who a tenant is.
- **Durability** — clearing the browser wipes everything (the loss we just hit).
- **Multi-device** — phone and laptop hold different data.
- **Backup/audit** — no server-side record, unacceptable for financial data.

The current "bake real data into a git-ignored `transactions.js`" approach is a
**dev-only stopgap** and will be removed.

---

## 2. Target architecture
- **Frontend**: existing React/Vite app on Cloudflare Workers (unchanged hosting).
- **Backend**: **Supabase** — Postgres + Auth + Row-Level Security (RLS).
- **AI proxy**: a small server endpoint (Cloudflare Worker or Supabase Edge
  Function) that holds the Anthropic key. **Finding:** `AiPanel.jsx` and
  `Rules.jsx` currently call `api.anthropic.com` directly from the browser —
  that cannot ship to tenants (key exposure / CORS). Must be proxied.

### Tenant model
Start with **1 user = 1 tenant**, but model it as `tenants` + `tenant_members`
so an org can later have multiple members without a schema rewrite.

---

## 3. Database schema (Postgres)
Every business table carries `tenant_id` — the isolation key.

```sql
-- Tenancy
tenants(id uuid pk, name text, created_at timestamptz default now())
tenant_members(tenant_id uuid fk, user_id uuid fk -> auth.users,
               role text default 'owner', primary key(tenant_id, user_id))

-- Core data (mirrors today's localStorage shapes)
accounts(id text, tenant_id uuid, name text, type text,
         institution text, last_synced date, primary key(tenant_id, id))

transactions(id text, tenant_id uuid, date date, description text,
             amount numeric, category_id text, merchant_name text,
             account_id text, account_type text, flagged bool default false,
             created_at timestamptz default now(), primary key(tenant_id, id))

rules(id uuid pk, tenant_id uuid, match text, category_id text,
      created_at timestamptz default now())

budgets(tenant_id uuid, month_key text, category_id text, amount numeric,
        primary key(tenant_id, month_key, category_id))

custom_categories(id uuid pk, tenant_id uuid, parent_id text,
                  name text, icon text, color text, kind text)

notif_prefs(tenant_id uuid primary key, prefs jsonb)
```
Base categories in `src/data/categories.js` stay **static and shared**; only
tenant-added categories go in `custom_categories`.

### Row-Level Security (the isolation guarantee)
RLS **on** for every business table. Canonical policy:

```sql
alter table transactions enable row level security;
create policy tenant_isolation on transactions
  using (tenant_id in (
    select tenant_id from tenant_members where user_id = auth.uid()
  ));
```
A `handle_new_user` trigger on `auth.users` creates a `tenants` row + an
`owner` membership on signup, so a new user is provisioned automatically.

---

## 4. Auth
Supabase Auth. **Decision needed:** magic-link email (simplest), email+password,
or Google OAuth. UI work: login/signup screen, session persistence, a route
guard that gates the app until authenticated, and a logout control in the
existing Settings/user area.

---

## 5. Data layer swap
`AppContext.jsx` is the single choke point — all reads/writes flow through it.

- Add `@supabase/supabase-js`; init client from `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` (anon key is public; RLS protects rows).
- On session load, fetch the tenant's rows; expose via the same context API the
  components already use (minimize component churn).
- Mutations call Supabase insert/update/delete with optimistic local updates.
- Keep `localStorage` as an **offline cache** keyed by tenant id — not the
  source of truth.

Migrate table-by-table (accounts → transactions → rules → budgets →
categories → prefs) so each step is verifiable.

---

## 6. Migrating the owner's data
One-time import of the recovered **816 transactions + 54 rules** (+ the 18
accounts) as **tenant #1**, run with the Supabase service-role key from a
secure script (never the browser). Source is the `xentli-recovered-backup.json`
already produced. Field remap: `categoryId → category_id`, etc.

---

## 7. Security hardening
- Move Anthropic AI calls behind a server proxy holding the key.
- Service-role key only in server/migration contexts, never bundled.
- Per-tenant **Export** (the Backup button) stays as user-facing portability.
- Confirm this environment's network policy allows outbound to Supabase.

---

## 8. Phased delivery
| Phase | Deliverable | Risk |
|---|---|---|
| 0 | Supabase project + env wiring + client install | low |
| 1 | Schema + RLS migration SQL (tested with 2 tenants) | low |
| 2 | Auth: signup/login/logout + route guard | med |
| 3 | Swap `AppContext` to Supabase, table by table | med |
| 4 | Import owner data as tenant #1 | low |
| 5 | AI proxy, offline cache, remove seed hack | med |

Until Phase 3 ships, the **Backup/Restore** button is the safety net.

---

## 9. What I need from you
1. **Supabase project**: created under your account; send `SUPABASE_URL` +
   `anon` key (and set the service-role key as a secret, not in the repo).
2. **Auth method**: magic link / password / Google.
3. **Tenant granularity**: confirm "1 user = 1 tenant" to start (orgs later).
4. Confirm the web environment's network policy permits Supabase calls.

## 10. Open questions / decisions
- Demo data for brand-new tenants — empty, or a clearly-labeled sample set?
- Categories — keep base set static (recommended) or make fully per-tenant?
- Billing/plans — out of scope now, but tenancy model leaves room for it.
