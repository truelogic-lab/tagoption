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
