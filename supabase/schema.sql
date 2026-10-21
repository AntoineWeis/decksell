-- decksell : schéma initial (phase 1 : outil d'estimation, sans comptes)
-- À coller dans Supabase > SQL Editor > New query > Run.
-- Réexécutable sans erreur (create if not exists / or replace).

-- 1. Cartes : une ligne par impression Scryfall (alimentée par l'import quotidien)
create table if not exists public.cards (
  id               uuid primary key,            -- id Scryfall de l'impression
  oracle_id        uuid not null,               -- identifie la carte, toutes éditions confondues
  name             text not null,
  set_code         text not null,
  set_name         text,
  collector_number text not null,
  lang             text not null default 'en',
  released_at      date,
  rarity           text,
  finishes         text[] not null default '{}', -- ex. {nonfoil,foil}
  image_url        text,
  artist           text,                         -- à afficher avec l'image (règle Scryfall)
  cardmarket_id    integer,
  scryfall_uri     text,
  legal_modern     boolean not null default false,
  price_eur        numeric(10,2),                -- null = absent de Cardmarket
  price_eur_foil   numeric(10,2),
  updated_at       timestamptz not null default now()
);

create index if not exists cards_oracle_id_idx on public.cards (oracle_id);
create index if not exists cards_name_lower_idx on public.cards (lower(name));
create index if not exists cards_set_code_idx on public.cards (set_code);

-- 2. Impression la moins chère par carte (prix par défaut de l'estimation)
create or replace view public.card_cheapest
with (security_invoker = true) as
select distinct on (oracle_id)
  oracle_id, id, name, set_code, collector_number, image_url, artist, price_eur
from public.cards
where price_eur is not null
order by oracle_id, price_eur asc, released_at desc;

-- 3. Journal des imports : permet d'afficher "prix du <date>"
create table if not exists public.price_imports (
  id               bigint generated always as identity primary key,
  imported_at      timestamptz not null default now(),
  source           text not null default 'scryfall_default_cards',
  bulk_updated_at  timestamptz,                  -- date de génération du fichier Scryfall
  card_count       integer
);

-- 4. Archétypes de méta, saisis à la main au départ
create table if not exists public.archetypes (
  id          bigint generated always as identity primary key,
  slug        text not null unique,
  name        text not null,
  format      text not null default 'modern',
  description text,
  source_url  text,                              -- d'où vient la liste de référence
  updated_at  timestamptz not null default now()
);

create table if not exists public.archetype_cards (
  archetype_id bigint not null references public.archetypes (id) on delete cascade,
  card_name    text not null,                    -- nom exact tel qu'écrit par Scryfall
  quantity     integer not null check (quantity > 0),
  board        text not null check (board in ('main', 'side')),
  primary key (archetype_id, card_name, board)
);

-- 5. Sécurité (RLS)
alter table public.cards           enable row level security;
alter table public.price_imports   enable row level security;
alter table public.archetypes      enable row level security;
alter table public.archetype_cards enable row level security;

-- Lecture publique : uniquement nos propres données (méta et dates d'import).
drop policy if exists "lecture publique archetypes" on public.archetypes;
create policy "lecture publique archetypes" on public.archetypes
  for select to anon, authenticated using (true);

drop policy if exists "lecture publique archetype_cards" on public.archetype_cards;
create policy "lecture publique archetype_cards" on public.archetype_cards
  for select to anon, authenticated using (true);

drop policy if exists "lecture publique price_imports" on public.price_imports;
create policy "lecture publique price_imports" on public.price_imports
  for select to anon, authenticated using (true);

-- Aucune politique sur cards : la table n'est PAS lisible avec la clé publishable.
-- Elle n'est lue que côté serveur (clé secrète), pour calculer les estimations.
-- Aucune politique d'écriture nulle part : seules les clés secrètes écrivent.

-- 6. Recherche des prix pour une estimation (ajouté pour le calcul du prix)
-- On cherche par nom de première face en minuscules : "Fable of the Mirror-Breaker"
-- trouve aussi "Fable of the Mirror-Breaker // Reflection of Kiki-Jiki".
create index if not exists cards_front_name_idx
  on public.cards (lower(split_part(name, ' // ', 1)));

-- Une ligne par carte (oracle_id) : l'impression la moins chère en non-foil
-- (null si aucune n'a de prix) et le prix foil le plus bas, pour info.
create or replace function public.lookup_prices(front_names text[])
returns table (
  oracle_id          uuid,
  name               text,
  print_id           uuid,
  set_code           text,
  collector_number   text,
  image_url          text,
  artist             text,
  price_eur          numeric,
  min_price_eur_foil numeric
)
language sql stable security invoker set search_path = ''
as $$
  select distinct on (c.oracle_id)
    c.oracle_id, c.name, c.id, c.set_code, c.collector_number, c.image_url, c.artist,
    c.price_eur,
    min(c.price_eur_foil) over (partition by c.oracle_id)
  from public.cards c
  where lower(split_part(c.name, ' // ', 1)) = any(front_names)
  order by c.oracle_id, c.price_eur asc nulls last, c.released_at desc nulls last;
$$;

-- Réservée au serveur (clé secrète), comme la table cards.
revoke execute on function public.lookup_prices(text[]) from public, anon, authenticated;

-- 7. Membres (phase 2 : comptes, profils, annonces)

-- Profil public d'un membre, créé automatiquement à l'inscription.
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 2 and 40),
  avatar_url    text,
  moxfield_url  text check (moxfield_url ~ '^https://(www\.)?moxfield\.com/'),
  archidekt_url text check (archidekt_url ~ '^https://(www\.)?archidekt\.com/'),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 40), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Decks mis en vente par les membres.
create table if not exists public.listings (
  id                uuid primary key default gen_random_uuid(),
  seller_id         uuid not null references public.profiles (id) on delete cascade,
  title             text not null check (char_length(title) between 3 and 80),
  decklist          text not null check (char_length(decklist) <= 20000),
  card_count        integer not null check (card_count > 0),
  estimated_cents   integer not null check (estimated_cents >= 0),
  estimate_complete boolean not null,
  asking_cents      integer not null check (asking_cents > 0),
  condition         text not null check (condition in ('near_mint', 'excellent', 'good', 'played')),
  description       text check (char_length(description) <= 2000),
  status            text not null default 'active' check (status in ('active', 'reserved', 'sold', 'withdrawn')),
  sold_cents        integer check (sold_cents > 0),
  sold_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists listings_seller_idx on public.listings (seller_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;

-- Chaque membre ne voit et ne modifie que son profil et ses annonces.
-- (Les annonces publiques viendront avec la place de marché.)
drop policy if exists "profil : lecture par son propriétaire" on public.profiles;
create policy "profil : lecture par son propriétaire" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profil : modification par son propriétaire" on public.profiles;
create policy "profil : modification par son propriétaire" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "annonces : lecture par le vendeur" on public.listings;
create policy "annonces : lecture par le vendeur" on public.listings
  for select to authenticated using ((select auth.uid()) = seller_id);

drop policy if exists "annonces : création par le vendeur" on public.listings;
create policy "annonces : création par le vendeur" on public.listings
  for insert to authenticated with check ((select auth.uid()) = seller_id);

drop policy if exists "annonces : modification par le vendeur" on public.listings;
create policy "annonces : modification par le vendeur" on public.listings
  for update to authenticated
  using ((select auth.uid()) = seller_id) with check ((select auth.uid()) = seller_id);

drop policy if exists "annonces : suppression par le vendeur" on public.listings;
create policy "annonces : suppression par le vendeur" on public.listings
  for delete to authenticated using ((select auth.uid()) = seller_id);

-- Photos de profil : lisibles par tous, chaque membre écrit seulement dans son dossier <id>/.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "avatars : envoi dans son dossier" on storage.objects;
create policy "avatars : envoi dans son dossier" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars : remplacement dans son dossier" on storage.objects;
create policy "avatars : remplacement dans son dossier" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars : suppression dans son dossier" on storage.objects;
create policy "avatars : suppression dans son dossier" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars : lecture de son dossier" on storage.objects;
create policy "avatars : lecture de son dossier" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 8. Place de marché : langue des cartes et carte phare des annonces
alter table public.listings
  add column if not exists french_percent smallint check (french_percent between 0 and 100),
  add column if not exists cover_card_name text,
  add column if not exists cover_image_url text;

-- Index public : annonces en vente ou réservées, les plus récentes d'abord.
create index if not exists listings_public_idx on public.listings (status, created_at desc);

-- La lecture publique passe par le serveur (clé secrète) qui ne renvoie que les colonnes
-- publiques des annonces « active » et « reserved » : aucune règle RLS n'est ouverte ici.

-- 9. Couleurs et archétype des decks en vente (filtres de l'index)
-- Couleurs : sous-ensemble de W (blanc), U (bleu), B (noir), R (rouge), G (vert) ; vide = incolore.
alter table public.listings
  add column if not exists colors text[] not null default '{}'
    check (colors <@ array['W', 'U', 'B', 'R', 'G']::text[]),
  add column if not exists archetype_id bigint references public.archetypes (id) on delete set null;

create index if not exists listings_colors_idx on public.listings using gin (colors);
create index if not exists listings_archetype_idx on public.listings (archetype_id);

-- Liste fixe des archétypes Modern proposés au vendeur (un seul par deck).
-- Pour en ajouter : une ligne de plus ici, puis réexécuter le fichier.
insert into public.archetypes (slug, name) values
  ('affinity', 'Affinity'),
  ('amulet-titan', 'Amulet Titan'),
  ('azorius-control', 'Azorius Control'),
  ('belcher', 'Belcher'),
  ('boros-energy', 'Boros Energy'),
  ('burn', 'Burn'),
  ('crashing-footfalls', 'Crashing Footfalls'),
  ('death-shadow', 'Death''s Shadow'),
  ('dimir-control', 'Dimir Control'),
  ('domain-zoo', 'Domain Zoo'),
  ('eldrazi-ramp', 'Eldrazi Ramp'),
  ('eldrazi-tron', 'Eldrazi Tron'),
  ('elementals', 'Elementals'),
  ('golgari-yawgmoth', 'Golgari Yawgmoth'),
  ('hammer-time', 'Hammer Time'),
  ('hardened-scales', 'Hardened Scales'),
  ('izzet-murktide', 'Izzet Murktide'),
  ('izzet-prowess', 'Izzet Prowess'),
  ('jeskai-control', 'Jeskai Control'),
  ('jund-midrange', 'Jund Midrange'),
  ('living-end', 'Living End'),
  ('merfolk', 'Merfolk'),
  ('mill', 'Mill'),
  ('neobrand', 'Neobrand'),
  ('rakdos-midrange', 'Rakdos Midrange'),
  ('reanimator', 'Reanimator (Goryo''s Vengeance)'),
  ('ruby-storm', 'Ruby Storm'),
  ('scam', 'Scam'),
  ('tron', 'Tron (Mono-Green)'),
  ('urza-artifacts', 'Urza Artifacts')
on conflict (slug) do nothing;

-- 10. Courbe de mana : valeur de mana (coût converti) et type de chaque carte,
-- remplis par l'import Scryfall. Après exécution, relancer l'import pour les remplir.
alter table public.cards
  add column if not exists cmc       numeric(4,1),
  add column if not exists type_line text;
