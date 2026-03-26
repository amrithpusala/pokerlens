-- run this in your supabase dashboard > SQL Editor
-- it creates the hand_histories table with row-level security
-- so each user can only read/write their own data.

-- create the table
create table if not exists hand_histories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null,
  hands_count integer not null default 0,
  hands_data jsonb not null default '[]'::jsonb,
  created_at timestamptz default now() not null
);

-- create an index on user_id for fast lookups
create index if not exists idx_hand_histories_user_id
  on hand_histories(user_id);

-- enable row-level security
alter table hand_histories enable row level security;

-- policy: users can only see their own rows
create policy "users can view own histories"
  on hand_histories for select
  using (auth.uid() = user_id);

-- policy: users can only insert rows with their own user_id
create policy "users can insert own histories"
  on hand_histories for insert
  with check (auth.uid() = user_id);

-- policy: users can only delete their own rows
create policy "users can delete own histories"
  on hand_histories for delete
  using (auth.uid() = user_id);

-- optional: limit storage per user (prevent abuse)
-- this function checks that a user doesn't have more than 50 saved histories
create or replace function check_history_limit()
returns trigger as $$
begin
  if (select count(*) from hand_histories where user_id = new.user_id) >= 50 then
    raise exception 'maximum of 50 saved histories per user';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger enforce_history_limit
  before insert on hand_histories
  for each row execute function check_history_limit();
