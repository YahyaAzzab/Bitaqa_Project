-- Mots de passe attribués par l'équipe aux commerçants, chiffrés côté serveur (AES-256-GCM).
-- Aucune policy : seule la clé service role (actions admin) peut lire ou écrire.
-- La ligne est supprimée dès que le commerçant choisit son propre mot de passe.

create table if not exists public.owner_credentials (
  user_id uuid primary key references auth.users (id) on delete cascade,
  password_cipher text not null,
  set_by uuid references auth.users (id) on delete set null,
  set_at timestamptz not null default now()
);

alter table public.owner_credentials enable row level security;

revoke all on table public.owner_credentials from public, anon, authenticated;
