-- 20260718090400_storage.sql
--
-- Private storage bucket for uploaded documents and notice files. Object paths
-- are `<auth_uid>/<client_id>/<file>` (see app/app/documents/actions.ts and
-- app/app/notice/actions.ts), which the policies below rely on:
--   folder[1] = the owning auth user  -> owner read/write/delete
--   folder[2] = the client id         -> caseworker (org member) read
--
-- Signed URLs (created server-side) are how both applicants and caseworkers
-- view files, so only SELECT/INSERT/DELETE by the owner + SELECT by org
-- members are needed.

insert into storage.buckets (id, name, public)
values ('snap-documents', 'snap-documents', false)
on conflict (id) do nothing;

-- Owner: full access to objects under their own <uid>/ prefix.
create policy "snap docs owner read" on storage.objects for select using (
  bucket_id = 'snap-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "snap docs owner insert" on storage.objects for insert with check (
  bucket_id = 'snap-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "snap docs owner delete" on storage.objects for delete using (
  bucket_id = 'snap-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Caseworkers: read objects whose second path segment is a client in their org.
create policy "snap docs org read" on storage.objects for select using (
  bucket_id = 'snap-documents'
  and (storage.foldername(name))[2] is not null
  and is_org_member_of_client(((storage.foldername(name))[2])::uuid)
);
