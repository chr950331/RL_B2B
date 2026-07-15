create extension if not exists pgcrypto;

do $$ begin
  create type buyer_role as enum ('buyer', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type auction_status as enum ('draft', 'active', 'closed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.buyers (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  role buyer_role not null default 'buyer',
  created_at timestamptz not null default now(),
  constraint buyers_username_format check (username ~ '^[A-Za-z0-9_.-]{3,40}$')
);

create table if not exists public.auctions (
  id uuid primary key default gen_random_uuid(),
  sku text not null,
  product_name text not null,
  product_image text,
  inventory integer not null check (inventory > 0),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status auction_status not null default 'draft',
  created_at timestamptz not null default now(),
  constraint auction_time_order check (end_time > start_time)
);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  buyer_id uuid not null references public.buyers(id) on delete cascade,
  premium numeric(7, 2) not null check (premium >= 0),
  quantity integer not null check (quantity > 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (auction_id, buyer_id)
);

create table if not exists public.allocations (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  bid_id uuid not null references public.bids(id) on delete cascade,
  buyer_id uuid not null references public.buyers(id) on delete cascade,
  allocated_quantity integer not null check (allocated_quantity >= 0),
  created_at timestamptz not null default now(),
  unique (auction_id, bid_id)
);

create index if not exists idx_buyers_username on public.buyers (username);
create index if not exists idx_bids_auction_rank on public.bids (auction_id, premium desc, updated_at asc);
create index if not exists idx_auctions_status_end_time on public.auctions (status, end_time);

alter table public.buyers enable row level security;
alter table public.auctions enable row level security;
alter table public.bids enable row level security;
alter table public.allocations enable row level security;

drop policy if exists "public can read usernames" on public.buyers;

drop policy if exists "public can read active auctions" on public.auctions;
create policy "public can read active auctions"
on public.auctions for select
to anon, authenticated
using (status = 'active');

drop policy if exists "public can read leaderboard bids" on public.bids;
create policy "public can read leaderboard bids"
on public.bids for select
to anon, authenticated
using (
  exists (
    select 1 from public.auctions
    where auctions.id = bids.auction_id
    and auctions.status = 'active'
  )
);

do $$ begin
  alter publication supabase_realtime add table public.bids;
exception
  when duplicate_object then null;
  when undefined_object then create publication supabase_realtime for table public.bids;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.auctions;
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_bid_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bids_set_updated_at on public.bids;
create trigger bids_set_updated_at
before update on public.bids
for each row
execute function public.set_bid_updated_at();
