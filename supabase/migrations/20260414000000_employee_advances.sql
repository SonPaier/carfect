-- Employee advances (zaliczki) for HiService
create table if not exists employee_advances (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references instances(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  amount numeric(10,2) not null,
  advance_date date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- Index for fast monthly lookups
create index if not exists idx_employee_advances_lookup
  on employee_advances(instance_id, employee_id, advance_date);

-- RLS
alter table employee_advances enable row level security;

-- Authenticated users can manage advances for their instance
do $$ begin
  create policy "users_manage_advances" on employee_advances
    for all using (
      instance_id in (
        select p.instance_id from profiles p
        where p.id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;
