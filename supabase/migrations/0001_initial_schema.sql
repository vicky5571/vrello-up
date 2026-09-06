-- VrelloUp initial schema — mirrors src/types/index.ts.
--
-- Row-Level Security follows SECURITY.md §3: every table is RLS-protected
-- and all access requires active workspace membership.
--
-- Auth bridge note: policies read the caller's id via auth.uid(), i.e. they
-- assume Supabase Auth. The app currently signs in with Google through
-- Auth.js (src/auth.ts), so before pointing the client at this schema you
-- must either migrate to Supabase Auth or mint a Supabase-compatible JWT
-- from the Auth.js session whose sub matches users.id.

-- ---------------------------------------------------------------------------
-- Domain tables
-- ---------------------------------------------------------------------------

create table if not exists users (
  id text primary key,
  name text not null,
  email text not null unique,
  avatar text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists workspaces (
  id text primary key,
  name text not null,
  avatar text not null default 'V',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workspace_members (
  workspace_id text not null references workspaces (id) on delete cascade,
  user_id text not null references users (id) on delete cascade,
  role text not null default 'Member',
  primary key (workspace_id, user_id)
);

create table if not exists spaces (
  id text primary key,
  workspace_id text not null references workspaces (id) on delete cascade,
  name text not null,
  icon text not null default '',
  color text not null default ''
);

create table if not exists statuses (
  id text primary key,
  space_id text not null references spaces (id) on delete cascade,
  name text not null,
  color text not null default '#64748B',
  category text not null check (category in ('open', 'in_progress', 'review', 'done', 'closed')),
  "order" integer not null default 0
);

create table if not exists folders (
  id text primary key,
  space_id text not null references spaces (id) on delete cascade,
  name text not null
);

create table if not exists lists (
  id text primary key,
  space_id text not null references spaces (id) on delete cascade,
  folder_id text references folders (id) on delete cascade,
  name text not null,
  color text,
  icon text
);

create table if not exists tags (
  id text primary key,
  workspace_id text not null references workspaces (id) on delete cascade,
  name text not null,
  color text not null
);

create table if not exists tasks (
  id text primary key,
  list_id text not null references lists (id) on delete cascade,
  title text not null,
  description text not null default '',
  status_id text references statuses (id) on delete set null,
  priority text not null default 'none'
    check (priority in ('urgent', 'high', 'normal', 'low', 'none')),
  due_date date,
  start_date date,
  estimated_hours numeric,
  progress integer check (progress is null or (progress >= 0 and progress <= 100)),
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists task_assignees (
  task_id text not null references tasks (id) on delete cascade,
  user_id text not null references users (id) on delete cascade,
  primary key (task_id, user_id)
);

create table if not exists task_tags (
  task_id text not null references tasks (id) on delete cascade,
  tag_id text not null references tags (id) on delete cascade,
  primary key (task_id, tag_id)
);

create table if not exists subtasks (
  id text primary key,
  task_id text not null references tasks (id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists task_comments (
  id text primary key,
  task_id text not null references tasks (id) on delete cascade,
  user_id text not null references users (id) on delete cascade,
  content text not null default '',
  attachments jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists activity_log (
  id text primary key,
  task_id text not null references tasks (id) on delete cascade,
  user_id text not null references users (id) on delete cascade,
  user_name text not null,
  user_avatar text,
  action text not null,
  created_at timestamptz not null default now()
);

create table if not exists task_dependencies (
  task_id text not null references tasks (id) on delete cascade,
  depends_on_task_id text not null references tasks (id) on delete cascade,
  primary key (task_id, depends_on_task_id),
  check (task_id <> depends_on_task_id)
);

-- channel_id is the list id, or 'general' for the workspace lobby channel.
create table if not exists channel_messages (
  id text primary key,
  channel_id text not null,
  user_id text not null references users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Membership helper + auto-membership on workspace creation
-- ---------------------------------------------------------------------------

create or replace function public.is_workspace_member(ws_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from workspace_members m
    where m.workspace_id = ws_id
      and m.user_id = auth.uid()::text
  );
$$;

-- Inserting a workspace auto-adds the creator as its first member, so the
-- workspace INSERT policy below doesn't deadlock on missing membership.
create or replace function public.add_creator_as_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    insert into workspace_members (workspace_id, user_id, role)
    values (new.id, auth.uid()::text, 'Owner')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists workspaces_add_creator on workspaces;
create trigger workspaces_add_creator
  after insert on workspaces
  for each row execute function public.add_creator_as_member();

-- ---------------------------------------------------------------------------
-- Row-Level Security (SECURITY.md §3)
-- ---------------------------------------------------------------------------

alter table users enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table spaces enable row level security;
alter table statuses enable row level security;
alter table folders enable row level security;
alter table lists enable row level security;
alter table tags enable row level security;
alter table tasks enable row level security;
alter table task_assignees enable row level security;
alter table task_tags enable row level security;
alter table subtasks enable row level security;
alter table task_comments enable row level security;
alter table activity_log enable row level security;
alter table task_dependencies enable row level security;
alter table channel_messages enable row level security;

-- users: readable by workspace peers or self, writable only by self.
create policy users_select on users for select using (
  id = auth.uid()::text
  or exists (
    select 1
    from workspace_members m1
    join workspace_members m2 on m1.workspace_id = m2.workspace_id
    where m1.user_id = auth.uid()::text and m2.user_id = users.id
  )
);
create policy users_insert on users for insert
  with check (id = auth.uid()::text);
create policy users_update on users for update using (id = auth.uid()::text);

-- workspaces: members only (creation auto-adds the creator, see trigger).
create policy workspaces_select on workspaces for select
  using (public.is_workspace_member(id));
create policy workspaces_insert on workspaces for insert with check (true);
create policy workspaces_update on workspaces for update
  using (public.is_workspace_member(id));
create policy workspaces_delete on workspaces for delete
  using (public.is_workspace_member(id));

-- workspace_members: members manage their own workspace roster.
create policy workspace_members_all on workspace_members for all using (
  public.is_workspace_member(workspace_id)
);

-- spaces / folders / lists / statuses / tags: parent workspace membership.
create policy spaces_all on spaces for all using (
  public.is_workspace_member(workspace_id)
);
create policy folders_all on folders for all using (
  exists (
    select 1 from spaces s
    where s.id = folders.space_id and public.is_workspace_member(s.workspace_id)
  )
);
create policy lists_all on lists for all using (
  exists (
    select 1 from spaces s
    where s.id = lists.space_id and public.is_workspace_member(s.workspace_id)
  )
);
create policy statuses_all on statuses for all using (
  exists (
    select 1 from spaces s
    where s.id = statuses.space_id and public.is_workspace_member(s.workspace_id)
  )
);
create policy tags_all on tags for all using (
  public.is_workspace_member(workspace_id)
);

-- tasks and everything hanging off a task: membership of the owning workspace.
create policy tasks_all on tasks for all using (
  exists (
    select 1
    from lists l
    join spaces s on s.id = l.space_id
    where l.id = tasks.list_id and public.is_workspace_member(s.workspace_id)
  )
);
create policy task_assignees_all on task_assignees for all using (
  exists (
    select 1
    from tasks t
    join lists l on l.id = t.list_id
    join spaces s on s.id = l.space_id
    where t.id = task_assignees.task_id and public.is_workspace_member(s.workspace_id)
  )
);
create policy task_tags_all on task_tags for all using (
  exists (
    select 1
    from tasks t
    join lists l on l.id = t.list_id
    join spaces s on s.id = l.space_id
    where t.id = task_tags.task_id and public.is_workspace_member(s.workspace_id)
  )
);
create policy subtasks_all on subtasks for all using (
  exists (
    select 1
    from tasks t
    join lists l on l.id = t.list_id
    join spaces s on s.id = l.space_id
    where t.id = subtasks.task_id and public.is_workspace_member(s.workspace_id)
  )
);
create policy task_comments_all on task_comments for all using (
  exists (
    select 1
    from tasks t
    join lists l on l.id = t.list_id
    join spaces s on s.id = l.space_id
    where t.id = task_comments.task_id and public.is_workspace_member(s.workspace_id)
  )
);
create policy activity_log_all on activity_log for all using (
  exists (
    select 1
    from tasks t
    join lists l on l.id = t.list_id
    join spaces s on s.id = l.space_id
    where t.id = activity_log.task_id and public.is_workspace_member(s.workspace_id)
  )
);
create policy task_dependencies_all on task_dependencies for all using (
  exists (
    select 1
    from tasks t
    join lists l on l.id = t.list_id
    join spaces s on s.id = l.space_id
    where t.id = task_dependencies.task_id and public.is_workspace_member(s.workspace_id)
  )
);

-- channel_messages: list channels resolve like tasks; the 'general' lobby is
-- readable by any signed-in user (tighten to per-workspace once channels
-- carry a workspace_id — the app doesn't send one today).
create policy channel_messages_all on channel_messages for all using (
  channel_id = 'general'
  or exists (
    select 1
    from lists l
    join spaces s on s.id = l.space_id
    where l.id = channel_messages.channel_id
      and public.is_workspace_member(s.workspace_id)
  )
);
