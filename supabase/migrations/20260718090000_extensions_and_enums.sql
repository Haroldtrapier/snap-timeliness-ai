-- 20260718090000_extensions_and_enums.sql
--
-- Foundation: extensions + enum types.
--
-- These migrations reconstruct the database schema that the application code
-- already depends on (see lib/repositories.ts, app/app/**/actions.ts,
-- app/api/cron/reminders/route.ts, lib/auth.ts). They are the canonical,
-- version-controlled source of truth for the Supabase project.
--
-- Enum choices: columns whose written values are well-defined (stage, user_type,
-- visibility, channel, urgency) use enums. Status columns (documents.status,
-- checklist_items.status) stay `text` because the read-side mapping in
-- lib/repositories.ts (mapDocStatus) tolerates a wide range of external values.

create extension if not exists pgcrypto;      -- gen_random_uuid()
create extension if not exists "uuid-ossp";

-- profiles.user_type — richer than the two app surfaces; mapped to a Role in
-- lib/session.ts (county/state/admin -> agency, else applicant).
do $$ begin
  create type user_type as enum (
    'applicant', 'recipient', 'navigator', 'county', 'state', 'admin'
  );
exception when duplicate_object then null; end $$;

-- snap_cases.stage — drives the applicant tracker (STAGE_INDEX) and the agency
-- pipeline pill (STAGE_PILL) in lib/repositories.ts.
do $$ begin
  create type snap_stage as enum (
    'exploring', 'applying', 'pending', 'reporting_change',
    'recertifying', 'approved', 'denied'
  );
exception when duplicate_object then null; end $$;

-- case_notes.visibility — applicant-facing vs. internal caseworker notes.
do $$ begin
  create type note_visibility as enum ('applicant_visible', 'internal');
exception when duplicate_object then null; end $$;

-- reminders.channel — the cron writes 'inapp' today; email/sms are wired later.
do $$ begin
  create type reminder_channel as enum ('inapp', 'email', 'sms');
exception when duplicate_object then null; end $$;

-- notice_explanations.urgency — from the Claude structured output.
do $$ begin
  create type notice_urgency as enum ('high', 'medium', 'low');
exception when duplicate_object then null; end $$;
