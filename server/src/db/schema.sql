-- TagOption schema

create table if not exists users (
  id            text primary key,
  email         text unique not null,
  name          text not null,
  password_hash text not null,
  verified      boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists balances (
  user_id          text primary key references users(id) on delete cascade,
  balance_cents    bigint not null default 0,
  escrow_cents     bigint not null default 0,
  platform_cents   bigint not null default 0,
  volume_cents     bigint not null default 0,
  updated_at       timestamptz not null default now()
);

create table if not exists trades (
  id             text primary key,
  user_id        text not null references users(id) on delete cascade,
  market         text not null,
  contract       text not null,
  stake_cents    bigint not null,
  profit_cents   bigint not null,
  status         text not null default 'open',  -- 'open' | 'won' | 'lost'
  opened_at      timestamptz not null default now(),
  closed_at      timestamptz,
  auto           boolean not null default false
);

create index if not exists trades_user_status_idx on trades(user_id, status);
create index if not exists trades_opened_idx on trades(opened_at);

create table if not exists transactions (
  id             text primary key,
  user_id        text not null references users(id) on delete cascade,
  type           text not null,  -- 'deposit' | 'withdraw' | 'trade-open' | 'trade-settle'
  amount_cents   bigint not null,      -- signed for balance delta
  method         text,                 -- mpesa | usdt | card
  reference      text,                 -- trade id for trade-tx
  at             timestamptz not null default now()
);

create index if not exists tx_user_at_idx on transactions(user_id, at desc);
create table if not exists notifications (
  id          text primary key,
  user_id     text not null references users(id) on delete cascade,
  type        text not null,     -- 'trade' | 'deposit' | 'withdraw' | 'system'
  title       text not null,
  body        text,
  read        boolean not null default false,
  at          timestamptz not null default now()
);

create index if not exists notif_user_at_idx on notifications(user_id, at desc);
create index if not exists notif_user_unread_idx on notifications(user_id) where read = false;

-- Prevent duplicate trade notifications
alter table notifications add column if not exists reference text;
create unique index if not exists notif_dedupe_idx
  on notifications(user_id, reference)
  where reference is not null;
