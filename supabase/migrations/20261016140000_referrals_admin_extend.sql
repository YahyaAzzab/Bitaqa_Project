-- Parrainage (2 filleuls = +1 an offert) + prolongation admin sans vente.

-- ---------- Colonnes ----------
alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles (id) on delete set null,
  add column if not exists referral_bonus_years integer;

-- Si la colonne existait déjà sans NOT NULL / DEFAULT
alter table public.profiles
  alter column referral_bonus_years set default 0;

update public.profiles
set referral_bonus_years = 0
where referral_bonus_years is null;

alter table public.profiles
  alter column referral_bonus_years set not null;

create or replace function public.generate_referral_code() returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
begin
  loop
    candidate := '';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from profiles where referral_code = candidate);
  end loop;
  return candidate;
end;
$$;

-- Remplir les codes manquants
update public.profiles
set referral_code = public.generate_referral_code()
where referral_code is null or referral_code = '';

alter table public.profiles
  alter column referral_code set not null;

create unique index if not exists profiles_referral_code_uidx
  on public.profiles (referral_code);

create index if not exists profiles_referred_by_idx
  on public.profiles (referred_by);

-- Nouveau profil : code généré automatiquement
create or replace function public.profiles_set_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null or new.referral_code = '' then
    new.referral_code := public.generate_referral_code();
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_referral_code_bi on public.profiles;
create trigger profiles_referral_code_bi
  before insert on public.profiles
  for each row
  execute function public.profiles_set_referral_code();

-- ---------- Admin : prolonger sans encaisser ----------
create or replace function public.admin_extend_subscription(
  p_profile_id uuid,
  p_months integer
) returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_base timestamptz;
  v_new timestamptz;
begin
  if not is_admin() then
    raise exception 'forbidden';
  end if;
  if p_months is null or p_months < 1 or p_months > 60 then
    raise exception 'invalid';
  end if;

  select * into v_profile from profiles where id = p_profile_id for update;
  if not found then
    raise exception 'not_found';
  end if;

  v_base := case when v_profile.expires_at > now() then v_profile.expires_at else now() end;
  v_new := v_base + make_interval(months => p_months);

  update profiles
  set expires_at = v_new,
      status = case when status = 'suspended' then status else 'active' end,
      suspension_reason = case when status = 'suspended' then suspension_reason else null end
  where id = p_profile_id;

  return v_new;
end;
$$;

revoke all on function public.admin_extend_subscription(uuid, integer) from public;
grant execute on function public.admin_extend_subscription(uuid, integer) to authenticated;

-- ---------- Parrainage : rattacher un code + offrir les années dues ----------
create or replace function public.attach_referral(
  p_profile_id uuid,
  p_referral_code text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_referrer profiles%rowtype;
  v_code text := upper(trim(coalesce(p_referral_code, '')));
  v_count integer;
  v_due integer;
  v_extra integer;
  v_base timestamptz;
begin
  if auth.uid() is null or not is_seller() then
    raise exception 'not_seller';
  end if;
  if v_code = '' then
    return null;
  end if;
  if not can_manage_profile(p_profile_id) then
    raise exception 'forbidden';
  end if;

  select * into v_profile from profiles where id = p_profile_id for update;
  if not found then
    raise exception 'not_found';
  end if;
  if v_profile.referred_by is not null then
    raise exception 'already_referred';
  end if;

  select * into v_referrer
  from profiles
  where referral_code = v_code
  for update;
  if not found then
    raise exception 'referral_invalid';
  end if;
  if v_referrer.id = p_profile_id then
    raise exception 'referral_self';
  end if;

  update profiles set referred_by = v_referrer.id where id = p_profile_id;

  select count(*)::integer into v_count
  from profiles
  where referred_by = v_referrer.id;

  -- 2 filleuls = 1 an, 4 = 2 ans, etc.
  v_due := v_count / 2;
  v_extra := v_due - coalesce(v_referrer.referral_bonus_years, 0);
  if v_extra > 0 then
    v_base := case when v_referrer.expires_at > now() then v_referrer.expires_at else now() end;

    update profiles
    set expires_at = v_base + make_interval(years => v_extra),
        referral_bonus_years = v_due,
        status = case when status = 'suspended' then status else 'active' end
    where id = v_referrer.id;
  end if;

  return v_referrer.slug;
end;
$$;

revoke all on function public.attach_referral(uuid, text) from public;
grant execute on function public.attach_referral(uuid, text) to authenticated;

-- Stats parrainage pour l’espace client
create or replace function public.profile_referral_stats(p_profile_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'forbidden';
  end if;

  select * into v_profile from profiles where id = p_profile_id;
  if not found then
    raise exception 'not_found';
  end if;
  if v_profile.owner_user_id is distinct from auth.uid()
     and not can_manage_profile(p_profile_id)
  then
    raise exception 'forbidden';
  end if;

  select count(*)::integer into v_count
  from profiles
  where referred_by = p_profile_id;

  return jsonb_build_object(
    'code', v_profile.referral_code,
    'count', v_count,
    'bonus_years', coalesce(v_profile.referral_bonus_years, 0),
    'needed', 2 - (v_count % 2),
    'progress', v_count % 2
  );
end;
$$;

revoke all on function public.profile_referral_stats(uuid) from public;
grant execute on function public.profile_referral_stats(uuid) to authenticated;
