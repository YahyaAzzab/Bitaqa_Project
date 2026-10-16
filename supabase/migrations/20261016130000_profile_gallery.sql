-- Galerie photos facultative (travaux / produits), gérée depuis l’espace client.

create table if not exists public.profile_gallery (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  url        text not null,
  caption    text,
  position   smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint profile_gallery_url_https check (url ~ '^https://'),
  constraint profile_gallery_caption_len check (caption is null or char_length(caption) <= 80)
);

create index if not exists profile_gallery_profile_idx
  on public.profile_gallery (profile_id, position);

alter table public.profile_gallery enable row level security;

-- Lecture publique tant que le profil n’est pas suspendu (même règle que les liens).
drop policy if exists gallery_public_read on public.profile_gallery;
create policy gallery_public_read on public.profile_gallery
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = profile_id
        and (p.status <> 'suspended' or public.can_manage_profile(p.id))
    )
  );

drop policy if exists gallery_owner_read on public.profile_gallery;
create policy gallery_owner_read on public.profile_gallery
  for select using (public.is_profile_owner(profile_id));

drop policy if exists gallery_manage_write on public.profile_gallery;
create policy gallery_manage_write on public.profile_gallery
  for all using (public.can_manage_profile(profile_id))
  with check (public.can_manage_profile(profile_id));

-- Remplacement atomique de la galerie par le commerçant (max 9 photos).
create or replace function public.owner_replace_gallery(
  p_profile_id uuid,
  p_items jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_item jsonb;
  v_pos smallint := 0;
  v_url text;
  v_caption text;
begin
  if auth.uid() is null then
    raise exception 'forbidden';
  end if;

  select * into v_profile from profiles where id = p_profile_id for update;
  if not found or v_profile.owner_user_id is distinct from auth.uid() then
    raise exception 'forbidden';
  end if;

  if v_profile.status <> 'active' or v_profile.expires_at <= now() then
    raise exception 'profile_inactive';
  end if;

  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > 9
  then
    raise exception 'invalid';
  end if;

  delete from profile_gallery where profile_id = p_profile_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_url := coalesce(v_item->>'url', '');
    v_caption := nullif(trim(coalesce(v_item->>'caption', '')), '');
    if v_url !~ '^https://'
       or char_length(v_url) > 500
       or char_length(coalesce(v_caption, '')) > 80
    then
      raise exception 'invalid';
    end if;

    insert into profile_gallery (profile_id, url, caption, position)
    values (p_profile_id, v_url, v_caption, v_pos);
    v_pos := v_pos + 1;
  end loop;
end;
$$;

revoke all on function public.owner_replace_gallery(uuid, jsonb) from public;
grant execute on function public.owner_replace_gallery(uuid, jsonb) to authenticated;
