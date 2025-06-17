create table user_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_key text not null,
  memory_value jsonb not null,
  memory_type text default 'custom',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_user_memory unique (user_id, memory_key)
);

create or replace function update_user_memory_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_memory_updated_at_trigger
before update on user_memory
for each row
execute procedure update_user_memory_updated_at();
