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
