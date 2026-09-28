-- Motif de suspension facultatif, affiché au visiteur et au commerçant.
alter table public.profiles
  add column if not exists suspension_reason text
  check (suspension_reason is null or char_length(suspension_reason) <= 280);
