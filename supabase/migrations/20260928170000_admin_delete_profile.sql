-- Suppression définitive d'un profil par l'admin.
-- Les ventes restent (la caisse et les soldes vendeurs doivent rester justes) :
-- elles sont détachées du profil et gardent le nom du commerce.
-- Liens, scans et commandes de carte partent avec le profil.

alter table public.sales add column if not exists profile_name text;
alter table public.sales alter column profile_id drop not null;

alter table public.sales drop constraint if exists sales_profile_id_fkey;
alter table public.sales
  add constraint sales_profile_id_fkey
  foreign key (profile_id) references public.profiles (id) on delete set null;

alter table public.custom_orders drop constraint if exists custom_orders_profile_id_fkey;
alter table public.custom_orders
  add constraint custom_orders_profile_id_fkey
  foreign key (profile_id) references public.profiles (id) on delete cascade;

create or replace function public.admin_delete_profile(p_profile_id uuid)
returns table (slug text, logo_url text, owner_user_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
begin
  if not is_admin() then
    raise exception 'forbidden';
  end if;

  select * into v_profile from profiles where id = p_profile_id for update;
  if not found then
    raise exception 'not_found';
  end if;

  update sales
  set profile_name = coalesce(profile_name, v_profile.business_name_fr)
  where profile_id = p_profile_id;

  delete from profiles where id = p_profile_id;

  return query select v_profile.slug, v_profile.logo_url, v_profile.owner_user_id;
end;
$$;

revoke all on function public.admin_delete_profile(uuid) from public;
grant execute on function public.admin_delete_profile(uuid) to authenticated;
