-- La galerie commerçant passe de 9 à 21 photos.

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
     or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > 21
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
