-- DRAFT for wg-cleaner-portal (dmpnrlkobecovlpgcsdg). Not applied.
-- Review, apply with the Supabase migration tool, then run get_advisors (security).
-- Audit pg_policies for bids and bid_events first; bids currently has RLS on and no policies.

-- 1) Contact and identity fields on bids (known gap: no cleaner contact fields)
alter table public.bids
  add column if not exists cleaner_name text,
  add column if not exists cleaner_phone text,
  add column if not exists cleaner_email text,
  add column if not exists preferred_language text check (preferred_language in ('en', 'es')),
  add column if not exists identity_verified boolean not null default false,
  add column if not exists legacy_firebase_id text;

-- Re-runnable guards
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bids_amount_whole_positive') then
    alter table public.bids add constraint bids_amount_whole_positive check (bid_amount > 0 and bid_amount = trunc(bid_amount));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bids_status_valid') then
    alter table public.bids add constraint bids_status_valid check (status in ('pending', 'approved', 'denied'));
  end if;
end $$;

-- 2) Database-level guarantee: one approved bid per listing (known gap: multiple approvals)
create unique index if not exists bids_one_approved_per_listing
  on public.bids (listing_id) where status = 'approved';

-- 3) One pending bid per contact per listing
create unique index if not exists bids_one_pending_per_email
  on public.bids (listing_id, lower(cleaner_email)) where status = 'pending' and cleaner_email is not null;
create unique index if not exists bids_one_pending_per_phone
  on public.bids (listing_id, cleaner_phone) where status = 'pending' and cleaner_phone is not null;

-- 4) Import idempotency for the Firebase cutover
create unique index if not exists bids_legacy_firebase_id_key
  on public.bids (legacy_firebase_id) where legacy_firebase_id is not null;

-- 5) Audit trail (known gap: no audit trail). Written only by Edge Functions with the service role.
create table if not exists public.bid_events (
  id uuid primary key default gen_random_uuid(),
  bid_id uuid references public.bids(id) on delete set null,
  listing_id uuid,
  event text not null check (event in ('submitted', 'approved', 'denied', 'auto_denied', 'listing_cancelled', 'imported')),
  actor text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists bid_events_bid_id_idx on public.bid_events (bid_id);
create index if not exists bid_events_listing_id_idx on public.bid_events (listing_id);

alter table public.bid_events enable row level security;
-- No policies on purpose: only the service role (Edge Functions) reads or writes.
revoke all on public.bid_events from anon, authenticated;
revoke all on public.bids from anon, authenticated;
