-- =====================================================================
-- KOKORONAL (Postlight) JOURNAL APP - DATABASE SETUP
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. SAFETY GUARD - detects the sample project's posts table
--    (the sample has an `image_path` column and a uuid id)
-- ---------------------------------------------------------------------
do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name   = 'posts'
          and column_name  = 'image_path'
    ) then
        raise exception
            'The SAMPLE posts table already exists in this project. '
            'Either run this script in a new Supabase project, or drop the sample '
            'tables first (see the optional cleanup block at the bottom of this file).';
    end if;
end
$$;


-- ---------------------------------------------------------------------
-- 1. POSTS TABLE (Section 2 of the spec)
-- ---------------------------------------------------------------------
create table if not exists public.posts (
    id          bigint generated always as identity primary key,
    title       text        not null check (char_length(trim(title)) between 1 and 160),
    body        text        not null check (char_length(trim(body))  between 1 and 20000),
    image       text,                                   -- public URL of image/video (optional)
    mood        text        check (mood in ('Happy', 'Sad', 'Angry', 'Tired')),  -- bonus (optional)
    author_id   text        not null,                   -- e.g. 'ada' or an auth user ID
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

comment on table  public.posts           is 'Kokoronal journal entries / stories';
comment on column public.posts.image     is 'Public URL of uploaded image or video (Supabase Storage)';
comment on column public.posts.mood      is 'Bonus: Happy | Sad | Angry | Tired';
comment on column public.posts.author_id is 'Entry owner, e.g. ada or an auth user ID';


-- ---------------------------------------------------------------------
-- 2. INDEXES (feed is newest-first, usually filtered by author)
-- ---------------------------------------------------------------------
create index if not exists posts_author_created_idx on public.posts (author_id, created_at desc);
create index if not exists posts_created_idx        on public.posts (created_at desc);


-- ---------------------------------------------------------------------
-- 3. AUTO-UPDATE updated_at (used by PUT /posts/{id})
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
    before update on public.posts
    for each row
    execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 4. SECURITY
-- FastAPI talks to Supabase with the Service Role Key (bypasses RLS).
-- RLS on + no policies + revoked grants = the public anon key cannot
-- read or write this table directly; everything goes through the backend.
-- ---------------------------------------------------------------------
alter table public.posts enable row level security;
revoke all on public.posts from anon, authenticated;


-- ---------------------------------------------------------------------
-- 5. STORAGE BUCKET FOR IMAGES / VIDEOS
-- Public bucket so <img> / <video> can load media by plain URL.
-- Uploads are done by the backend (service role), so no policy needed.
-- 50 MB limit; images + mp4/webm (covers the video bonus).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'journal-media',
    'journal-media',
    true,
    52428800,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do update
    set public             = excluded.public,
        file_size_limit    = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

-- Allow anyone to VIEW files in this bucket (writes stay backend-only)
drop policy if exists "Public journal media" on storage.objects;
create policy "Public journal media" on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'journal-media');


-- ---------------------------------------------------------------------
-- 6. OPTIONAL SEED DATA (matches the wireframe) - delete if not wanted
-- ---------------------------------------------------------------------
insert into public.posts (title, body, mood, author_id, created_at)
values
    ('Coding Session',  'Fixed the backend server and finally got the first endpoint returning data.', 'Happy', 'ada', '2026-10-15 10:00:00+08'),
    ('Rainy Afternoon', 'Took a break and relaxed. Sometimes doing nothing is the productive thing.',  'Sad',   'ada', '2026-10-14 15:30:00+08');


-- ---------------------------------------------------------------------
-- 7. QUICK CHECK (should list the 2 seed rows)
-- ---------------------------------------------------------------------
select id, title, mood, author_id, created_at
from public.posts
order by created_at desc;


-- =====================================================================
-- OPTIONAL CLEANUP - ONLY if you want to delete the SAMPLE tables and
-- reuse this same project. Run this block FIRST, on its own, then run
-- the whole script above. This permanently deletes the sample data!
-- =====================================================================
-- drop table if exists public.post_chunks cascade;
-- drop table if exists public.posts cascade;
-- drop policy if exists "Public post images" on storage.objects;
-- (Also delete the 'post-images' bucket manually: Storage > post-images > Delete)
