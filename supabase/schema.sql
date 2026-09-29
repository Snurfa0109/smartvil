-- SmartVil Banjar Agung: skema Postgres Supabase.
-- Cara pakai: Supabase Dashboard -> SQL Editor -> New query -> paste
-- seluruh file ini -> Run. Aman dijalankan ulang (idempotent).

-- ============ TABEL ============

create table if not exists public.profiles (
  id text primary key,
  email text not null,
  display_name text not null default 'Admin',
  role text not null default 'admin',
  active boolean not null default true,
  department text,
  permissions text[],
  last_login timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.residents (
  id text primary key,
  nik text not null default '',
  nama text not null default '',
  gender text not null default '',
  address text not null default '',
  occupation text not null default '',
  birth_date date,
  status text not null default 'Tetap',
  status_keluarga text not null default '',
  status_penduduk text not null default 'Tetap',
  agama text not null default '',
  education text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id text primary key,
  title text not null default '',
  category text not null default '',
  content text not null default '',
  date date,
  image_url text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id text primary key,
  ticket_code text not null default '',
  nama text not null default '',
  email text not null default '',
  phone text not null default '',
  category text not null default '',
  title text not null default '',
  message text not null default '',
  photo_url text not null default '',
  status text not null default 'pending',
  admin_response text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.requests (
  id text primary key,
  ticket_code text not null unique,
  type text not null default '',
  type_name text not null default '',
  nama text not null default '',
  nik text not null default '',
  phone text not null default '',
  keperluan text not null default '',
  status text not null default 'pending',
  form_data jsonb not null default '{}',
  template_narrative text not null default '',
  admin_notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.letter_types (
  id text primary key,
  code text not null unique,
  name text not null default '',
  description text not null default '',
  requirements text[] not null default '{}',
  template_narrative text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  template_file_url text not null default '',
  template_data text not null default '',
  template_placeholders text[] not null default '{}',
  custom_fields jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.agenda (
  id text primary key,
  title text not null default '',
  category text not null default '',
  category_color text not null default 'blue',
  schedule text not null default '',
  description text not null default '',
  time_location text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  uid text not null default '',
  email text not null default '',
  display_name text not null default '',
  role text not null default '',
  action text not null default '',
  module text not null default '',
  detail text not null default ''
);

create index if not exists idx_requests_status on public.requests (status);
create index if not exists idx_requests_ticket on public.requests (ticket_code);
create index if not exists idx_requests_nik on public.requests (nik);
create index if not exists idx_requests_phone on public.requests (phone);
create index if not exists idx_complaints_phone on public.complaints (phone);
create index if not exists idx_complaints_ticket on public.complaints (ticket_code);
create index if not exists idx_news_date on public.news (date desc);
create index if not exists idx_audit_timestamp on public.audit_logs (timestamp desc);

-- ============ ROW LEVEL SECURITY ============
-- Cermin perilaku Firestore saat ini: baca publik (portal + lacak status
-- anonim membutuhkannya), tulis hanya admin login; kecuali pengajuan
-- surat & pengaduan yang boleh dibuat anonim. Bisa diketatkan kemudian.

alter table public.profiles enable row level security;
alter table public.residents enable row level security;
alter table public.news enable row level security;
alter table public.complaints enable row level security;
alter table public.requests enable row level security;
alter table public.letter_types enable row level security;
alter table public.agenda enable row level security;
alter table public.settings enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "public read" on public.profiles;
drop policy if exists "public read" on public.residents;
drop policy if exists "public read" on public.news;
drop policy if exists "public read" on public.complaints;
drop policy if exists "public read" on public.requests;
drop policy if exists "public read" on public.letter_types;
drop policy if exists "public read" on public.agenda;
drop policy if exists "public read" on public.settings;
drop policy if exists "admin write profiles" on public.profiles;
drop policy if exists "admin write residents" on public.residents;
drop policy if exists "admin write news" on public.news;
drop policy if exists "admin write complaints" on public.complaints;
drop policy if exists "admin write requests" on public.requests;
drop policy if exists "admin write letter_types" on public.letter_types;
drop policy if exists "admin write agenda" on public.agenda;
drop policy if exists "admin write settings" on public.settings;
drop policy if exists "admin write audit" on public.audit_logs;
drop policy if exists "anon submit request" on public.requests;
drop policy if exists "anon submit complaint" on public.complaints;

create policy "public read" on public.profiles for select using (true);
create policy "public read" on public.residents for select using (true);
create policy "public read" on public.news for select using (true);
create policy "public read" on public.complaints for select using (true);
create policy "public read" on public.requests for select using (true);
create policy "public read" on public.letter_types for select using (true);
create policy "public read" on public.agenda for select using (true);
create policy "public read" on public.settings for select using (true);

create policy "anon submit request" on public.requests
  for insert with check (true);
create policy "anon submit complaint" on public.complaints
  for insert with check (true);

create policy "admin write profiles" on public.profiles
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write residents" on public.residents
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write news" on public.news
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write complaints" on public.complaints
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write requests" on public.requests
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write letter_types" on public.letter_types
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write agenda" on public.agenda
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write settings" on public.settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write audit" on public.audit_logs
  for insert with check (true);

-- ============ STORAGE ============

insert into storage.buckets (id, name, public)
values
  ('templates', 'templates', true),
  ('news-covers', 'news-covers', true),
  ('complaints', 'complaints', true),
  ('aparatur', 'aparatur', true)
on conflict (id) do nothing;

drop policy if exists "public read files" on storage.objects;
drop policy if exists "admin write files" on storage.objects;
drop policy if exists "anon submit files" on storage.objects;

create policy "public read files" on storage.objects
  for select using (true);
create policy "admin write files" on storage.objects
  for insert with check (auth.role() = 'authenticated');
create policy "admin manage files" on storage.objects
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
create policy "admin delete files" on storage.objects
  for delete using (auth.role() = 'authenticated');
create policy "anon submit files" on storage.objects
  for insert with check (bucket_id = 'complaints');

-- ============ ADMIN PERTAMA ============
-- 1. Buat user di Dashboard -> Authentication -> Users -> Add user.
-- 2. Salin UID-nya, ganti UID_DISINI di bawah, jalankan:
--
-- insert into public.profiles (id, email, display_name, role, active, department)
-- values ('UID_DISINI', 'admin@banjaragung.go.id', 'Super Admin', 'superadmin', true, 'Sekretariat Kelurahan')
-- on conflict (id) do update set role = 'superadmin', active = true;
