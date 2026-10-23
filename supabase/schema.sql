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

-- 11. État et langue de chaque carte d'une annonce, saisis par le vendeur.
-- Un tableau JSON, une entrée par ligne de la liste :
-- [{ "board": "main", "name": "Lightning Bolt", "quantity": 4, "condition": "near_mint", "lang": "fr" }]
-- Vide pour les annonces publiées avant cette fonction.
alter table public.listings
  add column if not exists card_details jsonb not null default '[]'::jsonb;

alter table public.listings drop constraint if exists listings_card_details_array;
alter table public.listings
  add constraint listings_card_details_array check (jsonb_typeof(card_details) = 'array');

-- 12. Messagerie acheteur / vendeur
-- Une conversation par annonce et par acheteur. Les écritures passent par des fonctions
-- (security definer) qui vérifient tout côté base : le vendeur est lu dans l'annonce,
-- jamais envoyé par le navigateur, et les quotas anti-spam ne se contournent pas.

-- Préférence de notification par email (case dans le profil).
alter table public.profiles
  add column if not exists email_notifications boolean not null default true;

create table if not exists public.conversations (
  id                  uuid primary key default gen_random_uuid(),
  listing_id          uuid not null references public.listings (id) on delete cascade,
  buyer_id            uuid not null references public.profiles (id) on delete cascade,
  seller_id           uuid not null references public.profiles (id) on delete cascade,
  created_at          timestamptz not null default now(),
  last_message_at     timestamptz not null default now(),
  buyer_last_read_at  timestamptz,
  seller_last_read_at timestamptz,
  buyer_notified_at   timestamptz,  -- dernier email envoyé : un seul tant que le message n'est pas lu
  seller_notified_at  timestamptz,
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);

create table if not exists public.messages (
  id              bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 2000),
  created_at      timestamptz not null default now()
);

-- Type de message : texte, ou étape d'une offre de prix (l'offre elle-même est dans offers).
alter table public.messages
  add column if not exists kind text not null default 'text'
    check (kind in ('text', 'offer', 'offer_accepted', 'offer_declined', 'offer_withdrawn'));

create index if not exists messages_conv_idx   on public.messages (conversation_id, created_at);
create index if not exists messages_sender_idx on public.messages (sender_id, created_at);
create index if not exists conv_buyer_idx      on public.conversations (buyer_id, last_message_at desc);
create index if not exists conv_seller_idx     on public.conversations (seller_id, last_message_at desc);

-- Membres bloqués : plus aucun message dans un sens ni dans l'autre.
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- Signalements d'une conversation, traités à la main (tableau de bord Supabase) en attendant F05.
create table if not exists public.reports (
  id              bigint generated always as identity primary key,
  reporter_id     uuid not null references public.profiles (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  reason          text not null check (char_length(reason) between 1 and 1000),
  created_at      timestamptz not null default now(),
  unique (reporter_id, conversation_id)
);

alter table public.conversations enable row level security;
alter table public.messages      enable row level security;
alter table public.blocks        enable row level security;
alter table public.reports       enable row level security;

-- Lecture par les deux participants seulement. Aucune écriture directe : voir les fonctions.
drop policy if exists "conversations : lecture par les participants" on public.conversations;
create policy "conversations : lecture par les participants" on public.conversations
  for select to authenticated
  using ((select auth.uid()) in (buyer_id, seller_id));

drop policy if exists "messages : lecture par les participants" on public.messages;
create policy "messages : lecture par les participants" on public.messages
  for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (select auth.uid()) in (c.buyer_id, c.seller_id)
  ));
-- Aucune politique update ni delete sur messages : l'historique reste intact en cas de litige.

drop policy if exists "blocages : lecture par l'auteur" on public.blocks;
create policy "blocages : lecture par l'auteur" on public.blocks
  for select to authenticated using ((select auth.uid()) = blocker_id);

drop policy if exists "blocages : création par l'auteur" on public.blocks;
create policy "blocages : création par l'auteur" on public.blocks
  for insert to authenticated with check ((select auth.uid()) = blocker_id);

drop policy if exists "blocages : suppression par l'auteur" on public.blocks;
create policy "blocages : suppression par l'auteur" on public.blocks
  for delete to authenticated using ((select auth.uid()) = blocker_id);

drop policy if exists "signalements : lecture par l'auteur" on public.reports;
create policy "signalements : lecture par l'auteur" on public.reports
  for select to authenticated using ((select auth.uid()) = reporter_id);

drop policy if exists "signalements : création par un participant" on public.reports;
create policy "signalements : création par un participant" on public.reports
  for insert to authenticated
  with check (
    (select auth.uid()) = reporter_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (select auth.uid()) in (c.buyer_id, c.seller_id)
    )
  );

-- Vrai si l'un des deux membres a bloqué l'autre. Interne.
create or replace function public._is_blocked(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

revoke execute on function public._is_blocked(uuid, uuid) from public, anon, authenticated;

-- Écrit un message et met la conversation à jour. Interne : appelée par les fonctions
-- suivantes, jamais directement. Renvoie le destinataire à prévenir par email, ou null.
-- p_kind et p_offer_id servent aux offres de prix (section 14).
drop function if exists public._post_message(uuid, uuid, text);
create or replace function public._post_message(
  p_conversation_id uuid,
  p_sender uuid,
  p_body text,
  p_kind text default 'text',
  p_offer_id bigint default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_conv       public.conversations;
  v_new_user   boolean;
  v_recent     integer;
  v_limit      integer;
  v_recipient  uuid;
  v_read_at    timestamptz;
  v_notified   timestamptz;
  v_wants_mail boolean;
  v_now        timestamptz := now();
begin
  select (u.created_at > v_now - interval '24 hours') into v_new_user from auth.users u where u.id = p_sender;
  -- Quota : 30 messages par heure (10 pour un compte de moins de 24 h).
  v_limit := case when coalesce(v_new_user, true) then 10 else 30 end;

  select count(*) into v_recent from public.messages m
  where m.sender_id = p_sender and m.created_at > v_now - interval '1 hour';
  if v_recent >= v_limit then
    raise exception 'quota_messages';
  end if;

  select * into v_conv from public.conversations c where c.id = p_conversation_id for update;

  insert into public.messages (conversation_id, sender_id, body, kind, offer_id)
  values (p_conversation_id, p_sender, p_body, p_kind, p_offer_id);

  if v_conv.buyer_id = p_sender then
    v_recipient := v_conv.seller_id; v_read_at := v_conv.seller_last_read_at; v_notified := v_conv.seller_notified_at;
  else
    v_recipient := v_conv.buyer_id;  v_read_at := v_conv.buyer_last_read_at;  v_notified := v_conv.buyer_notified_at;
  end if;

  select p.email_notifications into v_wants_mail from public.profiles p where p.id = v_recipient;
  -- Un seul email tant que le destinataire n'a pas ouvert la conversation depuis le précédent.
  if not coalesce(v_wants_mail, false) or (v_notified is not null and (v_read_at is null or v_read_at < v_notified)) then
    v_recipient := null;
  end if;

  update public.conversations c set
    last_message_at     = v_now,
    -- L'expéditeur a forcément lu la conversation à laquelle il répond.
    buyer_last_read_at  = case when c.buyer_id  = p_sender then v_now else c.buyer_last_read_at end,
    seller_last_read_at = case when c.seller_id = p_sender then v_now else c.seller_last_read_at end,
    buyer_notified_at   = case when c.buyer_id  = v_recipient then v_now else c.buyer_notified_at end,
    seller_notified_at  = case when c.seller_id = v_recipient then v_now else c.seller_notified_at end
  where c.id = p_conversation_id;

  return v_recipient;
end;
$$;

revoke execute on function public._post_message(uuid, uuid, text, text, bigint) from public, anon, authenticated;

-- Premier message d'un acheteur sur une annonce. Si la conversation existe déjà, le
-- message s'y ajoute. Les erreurs ont un code court, traduit par le site.
create or replace function public.start_conversation(p_listing_id uuid, p_body text)
returns table (conversation_id uuid, notify_user uuid)
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid       uuid := auth.uid();
  v_body      text := btrim(coalesce(p_body, ''));
  v_seller    uuid;
  v_status    text;
  v_conv      uuid;
  v_confirmed timestamptz;
  v_new_user  boolean;
  v_recent    integer;
  v_limit     integer;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if char_length(v_body) not between 1 and 2000 then raise exception 'invalid_body'; end if;

  select u.email_confirmed_at, (u.created_at > now() - interval '24 hours')
    into v_confirmed, v_new_user
  from auth.users u where u.id = v_uid;
  if v_confirmed is null then raise exception 'email_not_confirmed'; end if;

  select l.seller_id, l.status into v_seller, v_status from public.listings l where l.id = p_listing_id;
  if v_seller is null or v_status not in ('active', 'reserved') then raise exception 'listing_unavailable'; end if;
  if v_seller = v_uid then raise exception 'own_listing'; end if;
  if public._is_blocked(v_uid, v_seller) then raise exception 'blocked'; end if;

  select c.id into v_conv from public.conversations c where c.listing_id = p_listing_id and c.buyer_id = v_uid;

  if v_conv is null then
    -- Quota : 10 nouvelles conversations par jour (3 pour un compte de moins de 24 h).
    select count(*) into v_recent from public.conversations c
    where c.buyer_id = v_uid and c.created_at > now() - interval '1 day';
    v_limit := case when coalesce(v_new_user, true) then 3 else 10 end;
    if v_recent >= v_limit then raise exception 'quota_conversations'; end if;

    insert into public.conversations (listing_id, buyer_id, seller_id)
    values (p_listing_id, v_uid, v_seller)
    returning id into v_conv;
  end if;

  return query select v_conv, public._post_message(v_conv, v_uid, v_body);
end;
$$;

-- Réponse dans une conversation existante, par l'un des deux participants.
create or replace function public.send_message(p_conversation_id uuid, p_body text)
returns table (conversation_id uuid, notify_user uuid)
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_body  text := btrim(coalesce(p_body, ''));
  v_conv  public.conversations;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if char_length(v_body) not between 1 and 2000 then raise exception 'invalid_body'; end if;

  select * into v_conv from public.conversations c
  where c.id = p_conversation_id and v_uid in (c.buyer_id, c.seller_id);
  if v_conv.id is null then raise exception 'not_found'; end if;
  if public._is_blocked(v_conv.buyer_id, v_conv.seller_id) then raise exception 'blocked'; end if;

  return query select v_conv.id, public._post_message(v_conv.id, v_uid, v_body);
end;
$$;

-- Marque une conversation comme lue, pour le membre connecté seulement.
create or replace function public.mark_read(p_conversation_id uuid)
returns void
language sql volatile security definer set search_path = ''
as $$
  update public.conversations c set
    buyer_last_read_at  = case when c.buyer_id  = auth.uid() then now() else c.buyer_last_read_at end,
    seller_last_read_at = case when c.seller_id = auth.uid() then now() else c.seller_last_read_at end
  where c.id = p_conversation_id and auth.uid() in (c.buyer_id, c.seller_id);
$$;

-- Boîte de réception du membre connecté (ou une seule conversation avec p_id) : l'annonce,
-- le nom et l'avatar de l'autre partie (jamais son email) et un aperçu du dernier message.
create or replace function public.list_conversations(p_id uuid default null)
returns table (
  id                      uuid,
  listing_id              uuid,
  listing_title           text,
  listing_status          text,
  listing_asking_cents    integer,
  listing_cover_image_url text,
  role                    text,
  other_id                uuid,
  other_name              text,
  other_avatar_url        text,
  created_at              timestamptz,
  last_message_at         timestamptz,
  last_message_body       text,
  last_message_mine       boolean,
  unread                  boolean,
  blocked_by_me           boolean,
  blocked_me              boolean
)
language sql stable security definer set search_path = ''
as $$
  select
    c.id, c.listing_id, l.title, l.status, l.asking_cents, l.cover_image_url,
    case when c.buyer_id = auth.uid() then 'buyer' else 'seller' end,
    o.id, o.display_name, o.avatar_url,
    c.created_at, c.last_message_at,
    left(lm.body, 140), lm.sender_id = auth.uid(),
    c.last_message_at > coalesce(
      case when c.buyer_id = auth.uid() then c.buyer_last_read_at else c.seller_last_read_at end,
      '-infinity'::timestamptz
    ),
    exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = o.id),
    exists (select 1 from public.blocks b where b.blocker_id = o.id and b.blocked_id = auth.uid())
  from public.conversations c
  join public.listings l on l.id = c.listing_id
  join public.profiles o on o.id = case when c.buyer_id = auth.uid() then c.seller_id else c.buyer_id end
  left join lateral (
    select m.body, m.sender_id from public.messages m
    where m.conversation_id = c.id order by m.created_at desc, m.id desc limit 1
  ) lm on true
  where auth.uid() in (c.buyer_id, c.seller_id)
    and (p_id is null or c.id = p_id)
  order by c.last_message_at desc
  limit 200;
$$;

-- Nombre de messages reçus et pas encore lus (badge de l'en-tête).
create or replace function public.unread_count()
returns integer
language sql stable security definer set search_path = ''
as $$
  select count(*)::integer
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  where m.sender_id <> auth.uid()
    and (
      (c.buyer_id = auth.uid() and m.created_at > coalesce(c.buyer_last_read_at, '-infinity'::timestamptz))
      or (c.seller_id = auth.uid() and m.created_at > coalesce(c.seller_last_read_at, '-infinity'::timestamptz))
    );
$$;

-- Réservées aux membres connectés.
revoke execute on function public.start_conversation(uuid, text) from public, anon;
revoke execute on function public.send_message(uuid, text)       from public, anon;
revoke execute on function public.mark_read(uuid)                from public, anon;
revoke execute on function public.list_conversations(uuid)       from public, anon;
revoke execute on function public.unread_count()                 from public, anon;
grant  execute on function public.start_conversation(uuid, text) to authenticated;
grant  execute on function public.send_message(uuid, text)       to authenticated;
grant  execute on function public.mark_read(uuid)                to authenticated;
grant  execute on function public.list_conversations(uuid)       to authenticated;
grant  execute on function public.unread_count()                 to authenticated;

-- 13. Favoris : les annonces suivies par un membre, visibles par lui seul.
-- On ajoute une annonce en vente ou réservée ; elle reste ensuite dans les favoris
-- même vendue ou retirée (avec son statut), et disparaît si le vendeur la supprime.
create table if not exists public.favorites (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index if not exists favorites_user_idx on public.favorites (user_id, created_at desc);
create index if not exists favorites_listing_idx on public.favorites (listing_id);

alter table public.favorites enable row level security;

drop policy if exists "favoris : lecture par le membre" on public.favorites;
create policy "favoris : lecture par le membre" on public.favorites
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "favoris : retrait par le membre" on public.favorites;
create policy "favoris : retrait par le membre" on public.favorites
  for delete to authenticated using ((select auth.uid()) = user_id);
-- Pas de politique insert : l'ajout passe par add_favorite, qui vérifie l'annonce.

-- Ajoute une annonce aux favoris du membre connecté (sans erreur si elle y est déjà).
create or replace function public.add_favorite(p_listing_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_seller uuid;
  v_status text;
  v_count  integer;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select l.seller_id, l.status into v_seller, v_status from public.listings l where l.id = p_listing_id;
  if v_seller is null or v_status not in ('active', 'reserved') then raise exception 'listing_unavailable'; end if;
  if v_seller = v_uid then raise exception 'own_listing'; end if;

  select count(*) into v_count from public.favorites f where f.user_id = v_uid;
  if v_count >= 500 then raise exception 'quota_favorites'; end if;

  insert into public.favorites (user_id, listing_id) values (v_uid, p_listing_id)
  on conflict do nothing;
end;
$$;

-- Favoris du membre connecté avec l'état actuel de chaque annonce, le plus récent d'abord.
-- Seules les colonnes publiques sont renvoyées (jamais le prix de vente final).
create or replace function public.list_favorites()
returns table (
  listing_id        uuid,
  title             text,
  status            text,
  asking_cents      integer,
  estimated_cents   integer,
  card_count        integer,
  colors            text[],
  cover_card_name   text,
  cover_image_url   text,
  archetype_name    text,
  seller_id         uuid,
  seller_name       text,
  seller_avatar_url text,
  favorited_at      timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select
    l.id, l.title, l.status, l.asking_cents, l.estimated_cents, l.card_count, l.colors,
    l.cover_card_name, l.cover_image_url, a.name,
    p.id, p.display_name, p.avatar_url,
    f.created_at
  from public.favorites f
  join public.listings l on l.id = f.listing_id
  join public.profiles p on p.id = l.seller_id
  left join public.archetypes a on a.id = l.archetype_id
  where f.user_id = auth.uid()
  order by f.created_at desc
  limit 500;
$$;

revoke execute on function public.add_favorite(uuid) from public, anon;
revoke execute on function public.list_favorites()   from public, anon;
grant  execute on function public.add_favorite(uuid) to authenticated;
grant  execute on function public.list_favorites()   to authenticated;

-- 14. Offres de prix dans la messagerie (F09)
-- L'acheteur propose un montant, le vendeur accepte ou refuse. Aucun paiement en ligne :
-- une offre acceptée est un accord entre les deux membres, qui s'organisent ensuite.
-- Chaque étape est aussi un message (kind), pour les non-lus, l'aperçu et les emails.
create table if not exists public.offers (
  id              bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  buyer_id        uuid not null references public.profiles (id) on delete cascade,
  amount_cents    integer not null check (amount_cents > 0 and amount_cents <= 10000000),
  status          text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at      timestamptz not null default now(),
  responded_at    timestamptz
);

create index if not exists offers_conv_idx on public.offers (conversation_id, created_at);
-- Une seule offre en attente par conversation : une nouvelle offre remplace la précédente.
create unique index if not exists offers_one_pending_idx on public.offers (conversation_id) where status = 'pending';

alter table public.messages
  add column if not exists offer_id bigint references public.offers (id) on delete set null;

alter table public.offers enable row level security;

drop policy if exists "offres : lecture par les participants" on public.offers;
create policy "offres : lecture par les participants" on public.offers
  for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (select auth.uid()) in (c.buyer_id, c.seller_id)
  ));
-- Aucune écriture directe : make_offer, respond_offer et withdraw_offer.

-- « 450 € », « 450,50 € » : montant lisible dans le texte des messages.
create or replace function public._eur(cents integer)
returns text
language sql immutable set search_path = ''
as $$
  select case when cents % 100 = 0 then (cents / 100)::text
              else replace(to_char(cents / 100.0, 'FM9999990.00'), '.', ',') end || ' €';
$$;

-- Offre de l'acheteur. Remplace son offre en attente s'il en avait une.
create or replace function public.make_offer(p_conversation_id uuid, p_amount_cents integer)
returns table (conversation_id uuid, notify_user uuid)
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_conv   public.conversations;
  v_status text;
  v_offer  bigint;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 or p_amount_cents > 10000000 then raise exception 'invalid_amount'; end if;

  select * into v_conv from public.conversations c where c.id = p_conversation_id and v_uid in (c.buyer_id, c.seller_id);
  if v_conv.id is null then raise exception 'not_found'; end if;
  if v_conv.buyer_id <> v_uid then raise exception 'not_buyer'; end if;
  if public._is_blocked(v_conv.buyer_id, v_conv.seller_id) then raise exception 'blocked'; end if;
  select l.status into v_status from public.listings l where l.id = v_conv.listing_id;
  if v_status not in ('active', 'reserved') then raise exception 'listing_unavailable'; end if;

  update public.offers o set status = 'withdrawn', responded_at = now()
  where o.conversation_id = v_conv.id and o.status = 'pending';

  insert into public.offers (conversation_id, buyer_id, amount_cents)
  values (v_conv.id, v_uid, p_amount_cents)
  returning id into v_offer;

  return query select v_conv.id, public._post_message(
    v_conv.id, v_uid, 'Je te propose ' || public._eur(p_amount_cents) || ' pour ce deck.', 'offer', v_offer
  );
end;
$$;

-- Réponse du vendeur à une offre en attente.
create or replace function public.respond_offer(p_offer_id bigint, p_accept boolean)
returns table (conversation_id uuid, notify_user uuid)
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_offer public.offers;
  v_conv  public.conversations;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into v_offer from public.offers o where o.id = p_offer_id for update;
  select * into v_conv from public.conversations c where c.id = v_offer.conversation_id;
  if v_offer.id is null or v_conv.seller_id is distinct from v_uid then raise exception 'not_found'; end if;
  if v_offer.status <> 'pending' then raise exception 'offer_closed'; end if;
  if public._is_blocked(v_conv.buyer_id, v_conv.seller_id) then raise exception 'blocked'; end if;

  update public.offers o set status = case when p_accept then 'accepted' else 'declined' end, responded_at = now()
  where o.id = v_offer.id;

  return query select v_conv.id, public._post_message(
    v_conv.id, v_uid,
    case when p_accept then 'J''accepte ton offre de ' || public._eur(v_offer.amount_cents) || '.'
         else 'Je refuse ton offre de ' || public._eur(v_offer.amount_cents) || '.' end,
    case when p_accept then 'offer_accepted' else 'offer_declined' end,
    v_offer.id
  );
end;
$$;

-- L'acheteur retire son offre tant que le vendeur n'a pas répondu.
create or replace function public.withdraw_offer(p_offer_id bigint)
returns table (conversation_id uuid, notify_user uuid)
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_offer public.offers;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into v_offer from public.offers o where o.id = p_offer_id for update;
  if v_offer.id is null or v_offer.buyer_id <> v_uid then raise exception 'not_found'; end if;
  if v_offer.status <> 'pending' then raise exception 'offer_closed'; end if;

  update public.offers o set status = 'withdrawn', responded_at = now() where o.id = v_offer.id;

  return query select v_offer.conversation_id, public._post_message(
    v_offer.conversation_id, v_uid, 'Je retire mon offre de ' || public._eur(v_offer.amount_cents) || '.',
    'offer_withdrawn', v_offer.id
  );
end;
$$;

revoke execute on function public.make_offer(uuid, integer)        from public, anon;
revoke execute on function public.respond_offer(bigint, boolean)   from public, anon;
revoke execute on function public.withdraw_offer(bigint)           from public, anon;
grant  execute on function public.make_offer(uuid, integer)        to authenticated;
grant  execute on function public.respond_offer(bigint, boolean)   to authenticated;
grant  execute on function public.withdraw_offer(bigint)           to authenticated;

-- 15. Modération minimale (F05)
-- Les admins sont listés ici, à la main. Pour te nommer admin, exécute une fois :
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'ton-email@exemple.fr'
--   on conflict do nothing;
create table if not exists public.admins (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- Aucune politique : la liste des admins n'est lisible que par les fonctions ci-dessous.

alter table public.reports
  add column if not exists status     text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  add column if not exists handled_at timestamptz,
  add column if not exists handled_by uuid references public.profiles (id) on delete set null,
  add column if not exists admin_note text check (char_length(admin_note) <= 1000);

create index if not exists reports_status_idx on public.reports (status, created_at desc);

-- Vrai si le membre connecté est admin.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- Signalements, du plus récent au plus ancien (filtrés par statut, ou un seul avec p_id).
-- Réservé aux admins : la conversation signalée devient lisible, comme l'annonce la page Confidentialité.
create or replace function public.admin_list_reports(p_status text default null, p_id bigint default null)
returns table (
  id              bigint,
  reason          text,
  status          text,
  created_at      timestamptz,
  handled_at      timestamptz,
  handler_name    text,
  admin_note      text,
  conversation_id uuid,
  listing_id      uuid,
  listing_title   text,
  listing_status  text,
  reporter_id     uuid,
  reporter_name   text,
  reported_id     uuid,
  reported_name   text,
  reported_role   text,
  message_count   integer
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return query
  select
    r.id, r.reason, r.status, r.created_at, r.handled_at, h.display_name, r.admin_note,
    c.id, l.id, l.title, l.status,
    rp.id, rp.display_name,
    o.id, o.display_name,
    case when o.id = c.seller_id then 'seller' else 'buyer' end,
    (select count(*)::integer from public.messages m where m.conversation_id = c.id)
  from public.reports r
  join public.conversations c on c.id = r.conversation_id
  join public.listings l on l.id = c.listing_id
  join public.profiles rp on rp.id = r.reporter_id
  join public.profiles o on o.id = case when r.reporter_id = c.buyer_id then c.seller_id else c.buyer_id end
  left join public.profiles h on h.id = r.handled_by
  where (p_status is null or r.status = p_status)
    and (p_id is null or r.id = p_id)
  order by r.created_at desc
  limit 200;
end;
$$;

-- Messages de la conversation d'un signalement (et seulement d'une conversation signalée).
create or replace function public.admin_report_messages(p_report_id bigint)
returns table (id bigint, sender_id uuid, sender_name text, body text, kind text, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return query
  select m.id, m.sender_id, p.display_name, m.body, m.kind, m.created_at
  from public.reports r
  join public.messages m on m.conversation_id = r.conversation_id
  join public.profiles p on p.id = m.sender_id
  where r.id = p_report_id
  order by m.created_at, m.id
  limit 1000;
end;
$$;

-- Traite un signalement : classé (résolu ou sans suite), avec une note et, au besoin,
-- le retrait de l'annonce concernée (les CGU le prévoient).
create or replace function public.admin_handle_report(
  p_report_id bigint,
  p_status text,
  p_note text default null,
  p_withdraw_listing boolean default false
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_listing uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('open', 'resolved', 'dismissed') then raise exception 'invalid_status'; end if;

  update public.reports r set
    status     = p_status,
    handled_at = case when p_status = 'open' then null else now() end,
    handled_by = case when p_status = 'open' then null else auth.uid() end,
    admin_note = nullif(left(btrim(coalesce(p_note, '')), 1000), '')
  where r.id = p_report_id
  returning (select c.listing_id from public.conversations c where c.id = r.conversation_id) into v_listing;
  if v_listing is null then raise exception 'not_found'; end if;

  if p_withdraw_listing then
    update public.listings l set status = 'withdrawn', updated_at = now()
    where l.id = v_listing and l.status in ('active', 'reserved');
  end if;
end;
$$;

revoke execute on function public.is_admin()                                    from public, anon;
revoke execute on function public.admin_list_reports(text, bigint)              from public, anon;
revoke execute on function public.admin_report_messages(bigint)                 from public, anon;
revoke execute on function public.admin_handle_report(bigint, text, text, boolean) from public, anon;
grant  execute on function public.is_admin()                                    to authenticated;
grant  execute on function public.admin_list_reports(text, bigint)              to authenticated;
grant  execute on function public.admin_report_messages(bigint)                 to authenticated;
grant  execute on function public.admin_handle_report(bigint, text, text, boolean) to authenticated;

-- 16. Format de jeu des decks. Modern seulement pour l'instant : pour en ouvrir un autre,
-- ajoute-le à la liste de la contrainte ci-dessous (et dans FORMATS, src/lib/listings.ts).
alter table public.listings
  add column if not exists format text not null default 'modern';

alter table public.listings drop constraint if exists listings_format_check;
alter table public.listings
  add constraint listings_format_check check (format in ('modern'));
