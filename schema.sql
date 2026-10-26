-- ============================================================
-- Схема для тренажёра иероглифов. Выполнить один раз в Supabase:
-- Project → SQL Editor → New query → вставить весь файл → Run.
-- ============================================================

-- 1. Профили пользователей (роль: user / admin)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Автоматически создаём профиль при регистрации нового пользователя
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Прогресс: одна запись = один пройденный иероглиф (3 попытки)
create table if not exists public.progress (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  hanzi text not null,
  word text not null,
  mistakes int not null default 0,
  completed_at timestamptz not null default now()
);

-- 3. Индивидуальные подборки слов от админа (одна подборка на пользователя)
create table if not exists public.custom_word_lists (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  words jsonb not null,
  updated_at timestamptz not null default now()
);

-- 4. Прохождение частей уроков — нужно, чтобы при повторном заходе в уже
-- пройденную часть иероглифы перемешивались.
create table if not exists public.lesson_progress (
  user_id uuid references public.profiles(id) on delete cascade not null,
  lesson_id text not null,
  part_index int not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id, part_index)
);

-- ============================================================
-- Row Level Security — без этого никто, кроме сервиса, не сможет
-- ничего прочитать/записать. Дальше явно разрешаем нужные сценарии.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.custom_word_lists enable row level security;
alter table public.lesson_progress enable row level security;

-- Вспомогательная функция: является ли текущий пользователь админом
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- profiles: пользователь видит свою строку, админ — все
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- progress: пользователь может писать и читать только свой прогресс, админ читает всё
create policy "progress_insert_own" on public.progress
  for insert with check (user_id = auth.uid());

create policy "progress_select_own_or_admin" on public.progress
  for select using (user_id = auth.uid() or public.is_admin());

-- custom_word_lists: пользователь читает только свою подборку,
-- редактировать (insert/update) может только админ
create policy "custom_words_select_own_or_admin" on public.custom_word_lists
  for select using (user_id = auth.uid() or public.is_admin());

create policy "custom_words_insert_admin" on public.custom_word_lists
  for insert with check (public.is_admin());

create policy "custom_words_update_admin" on public.custom_word_lists
  for update using (public.is_admin());

-- lesson_progress: пользователь пишет и читает только свои записи, админ читает всё
create policy "lesson_progress_upsert_own" on public.lesson_progress
  for insert with check (user_id = auth.uid());

create policy "lesson_progress_update_own" on public.lesson_progress
  for update using (user_id = auth.uid());

create policy "lesson_progress_select_own_or_admin" on public.lesson_progress
  for select using (user_id = auth.uid() or public.is_admin());

-- ============================================================
-- После выполнения этого файла назначьте себе роль admin вручную
-- (замените email на свой) — через UI зарегистрироваться на admin
-- нельзя, это осознанное ограничение безопасности:
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ============================================================
