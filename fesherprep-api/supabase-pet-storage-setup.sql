-- Run once in Supabase SQL Editor. Pet images are public learning assets;
-- uploads still go only through the ADMIN-authorized backend.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'pet-assets',
    'pet-assets',
    true,
    2097152,
    array['image/webp', 'image/png', 'image/jpeg']
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
