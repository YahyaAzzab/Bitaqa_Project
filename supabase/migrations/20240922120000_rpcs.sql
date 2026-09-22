-- Étape 6+ : création atomique, agrégats scans, statut expiré à la lecture

create or replace function public.create_profile_atomic(
  p_slug text,
  p_business_name_fr text,
  p_business_name_ar text default null,
  p_tagline_fr text default null,
  p_tagline_ar text default null,
  p_address_fr text default null,
  p_address_ar text default null,
  p_default_lang text default 'fr',
  p_logo_url text default null,
  p_accent_color text default '#c9a96e',
  p_theme text default 'noir',
  p_phone text default null,
  p_email text default null,
  p_hours jsonb default null,
  p_plan_code text default 'essentiel',
  p_amount_mad integer default 0,
  p_design_notes text default null,
  p_order_logo_url text default null,
  p_links jsonb default '[]'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller uuid := auth.uid();
  v_profile_id uuid;
  v_sale_id uuid;
  v_link jsonb;
  v_pos smallint := 0;
begin
  if v_seller is null or not is_seller() then
    raise exception 'not_seller';
  end if;

  if exists (select 1 from profiles where slug = p_slug) then
    raise exception 'slug_taken';
  end if;

  insert into profiles (
    slug, created_by, plan_code, business_name_fr, business_name_ar,
    tagline_fr, tagline_ar, address_fr, address_ar, default_lang,
    logo_url, accent_color, theme, phone, email, hours
  ) values (
    p_slug, v_seller, p_plan_code, p_business_name_fr, p_business_name_ar,
    p_tagline_fr, p_tagline_ar, p_address_fr, p_address_ar, p_default_lang,
    p_logo_url, p_accent_color, p_theme, p_phone, p_email, p_hours
  ) returning id into v_profile_id;

  for v_link in select * from jsonb_array_elements(coalesce(p_links, '[]'::jsonb))
  loop
    insert into profile_links (profile_id, type, label_fr, label_ar, value, position)
    values (
      v_profile_id,
      (v_link->>'type')::link_type,
      nullif(v_link->>'label_fr', ''),
      nullif(v_link->>'label_ar', ''),
      v_link->>'value',
      v_pos
    );
    v_pos := v_pos + 1;
  end loop;

  insert into sales (profile_id, seller_id, plan_code, kind, amount_mad)
  values (v_profile_id, v_seller, p_plan_code, 'initial', greatest(p_amount_mad, 0))
  returning id into v_sale_id;

  if p_plan_code = 'signature' then
    insert into custom_orders (profile_id, sale_id, status, logo_url, design_notes, ordered_by)
    values (
      v_profile_id,
      v_sale_id,
      'ordered',
      coalesce(p_order_logo_url, p_logo_url),
      p_design_notes,
      v_seller
    );
  end if;

  return v_profile_id;
end;
$$;

revoke all on function public.create_profile_atomic from public;
grant execute on function public.create_profile_atomic to authenticated;

-- Renouvellement : vente + expires_at
create or replace function public.renew_profile(
  p_profile_id uuid,
  p_amount_mad integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller uuid := auth.uid();
  v_profile profiles%rowtype;
  v_base timestamptz;
begin
  if v_seller is null or not is_seller() then
    raise exception 'not_seller';
  end if;
  if not can_manage_profile(p_profile_id) then
    raise exception 'forbidden';
  end if;

  select * into v_profile from profiles where id = p_profile_id for update;
  if not found then
    raise exception 'not_found';
  end if;

  v_base := case
    when v_profile.expires_at > now() then v_profile.expires_at
    else now()
  end;

  update profiles
  set expires_at = v_base + interval '1 year',
      status = 'active'
  where id = p_profile_id;

  insert into sales (profile_id, seller_id, plan_code, kind, amount_mad)
  values (p_profile_id, v_seller, v_profile.plan_code, 'renewal', greatest(p_amount_mad, 0));
end;
$$;

revoke all on function public.renew_profile from public;
grant execute on function public.renew_profile to authenticated;

-- Stats scans agrégées
create or replace function public.profile_scan_stats(p_profile_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not can_manage_profile(p_profile_id) then null
    else jsonb_build_object(
      'scans_7', (
        select count(*) from scans
        where profile_id = p_profile_id and scanned_at >= now() - interval '7 days'
      ),
      'scans_30', (
        select count(*) from scans
        where profile_id = p_profile_id and scanned_at >= now() - interval '30 days'
      ),
      'by_country', coalesce((
        select jsonb_object_agg(coalesce(country, '??'), c) from (
          select country, count(*)::int as c from scans
          where profile_id = p_profile_id and scanned_at >= now() - interval '30 days'
          group by country
        ) s
      ), '{}'::jsonb),
      'by_device', coalesce((
        select jsonb_object_agg(coalesce(device, '??'), c) from (
          select device, count(*)::int as c from scans
          where profile_id = p_profile_id and scanned_at >= now() - interval '30 days'
          group by device
        ) s
      ), '{}'::jsonb),
      'daily', coalesce((
        select jsonb_agg(jsonb_build_object('day', d, 'count', c) order by d) from (
          select date_trunc('day', scanned_at)::date as d, count(*)::int as c
          from scans
          where profile_id = p_profile_id and scanned_at >= now() - interval '30 days'
          group by 1
        ) s
      ), '[]'::jsonb)
    )
  end;
$$;

revoke all on function public.profile_scan_stats from public;
grant execute on function public.profile_scan_stats to authenticated;

-- Admin : top profils / sans scans
create or replace function public.admin_scan_overview()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not is_admin() then null
    else jsonb_build_object(
      'total_scans', (select count(*) from scans),
      'top_profiles', coalesce((
        select jsonb_agg(row_to_json(t)) from (
          select p.slug, p.business_name_fr, count(s.id)::int as scans
          from profiles p
          left join scans s on s.profile_id = p.id and s.scanned_at >= now() - interval '30 days'
          group by p.id
          order by scans desc
          limit 10
        ) t
      ), '[]'::jsonb),
      'quiet_profiles', coalesce((
        select jsonb_agg(row_to_json(t)) from (
          select p.slug, p.business_name_fr, p.id
          from profiles p
          where p.status = 'active'
            and not exists (
              select 1 from scans s
              where s.profile_id = p.id and s.scanned_at >= now() - interval '14 days'
            )
          order by p.created_at desc
          limit 20
        ) t
      ), '[]'::jsonb)
    )
  end;
$$;

revoke all on function public.admin_scan_overview from public;
grant execute on function public.admin_scan_overview to authenticated;
