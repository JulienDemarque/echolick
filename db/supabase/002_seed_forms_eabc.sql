-- EchoLick seed: basic 12-bar dominant blues forms in E, A, B, C
-- Run after 001_init_minimal_schema.sql

with form_seed(slug, name, key_root, description) as (
  values
    ('blues_12_major_basic_e', '12-bar basic dominant blues (E)', 'E', 'I IV I I IV IV I I V IV I V'),
    ('blues_12_major_basic_a', '12-bar basic dominant blues (A)', 'A', 'I IV I I IV IV I I V IV I V'),
    ('blues_12_major_basic_b', '12-bar basic dominant blues (B)', 'B', 'I IV I I IV IV I I V IV I V'),
    ('blues_12_major_basic_c', '12-bar basic dominant blues (C)', 'C', 'I IV I I IV IV I I V IV I V')
),
upsert_forms as (
  insert into public.forms (slug, name, key_root, bar_count, time_signature, description, is_active)
  select slug, name, key_root, 12, '4/4', description, true
  from form_seed
  on conflict (slug) do update
    set name = excluded.name,
        key_root = excluded.key_root,
        bar_count = excluded.bar_count,
        time_signature = excluded.time_signature,
        description = excluded.description,
        is_active = excluded.is_active
  returning id, slug, key_root
),
target_forms as (
  -- Include both freshly inserted and already-existing rows.
  select id, slug, key_root from upsert_forms
  union all
  select f.id, f.slug, f.key_root
  from public.forms f
  join form_seed s on s.slug = f.slug
  where not exists (select 1 from upsert_forms u where u.id = f.id)
),
bar_template(bar_index, degree) as (
  values
    (0, 'I'),
    (1, 'IV'),
    (2, 'I'),
    (3, 'I'),
    (4, 'IV'),
    (5, 'IV'),
    (6, 'I'),
    (7, 'I'),
    (8, 'V'),
    (9, 'IV'),
    (10, 'I'),
    (11, 'V')
),
chord_map(key_root, degree, chord_symbol) as (
  values
    ('E', 'I', 'E7'), ('E', 'IV', 'A7'), ('E', 'V', 'B7'),
    ('A', 'I', 'A7'), ('A', 'IV', 'D7'), ('A', 'V', 'E7'),
    ('B', 'I', 'B7'), ('B', 'IV', 'E7'), ('B', 'V', 'F#7'),
    ('C', 'I', 'C7'), ('C', 'IV', 'F7'), ('C', 'V', 'G7')
)
insert into public.form_bars (form_id, bar_index, degree, chord_symbol, chord_root)
select
  f.id,
  b.bar_index,
  b.degree,
  m.chord_symbol,
  f.key_root
from target_forms f
join bar_template b on true
join chord_map m on m.key_root = f.key_root and m.degree = b.degree
on conflict (form_id, bar_index) do update
  set degree = excluded.degree,
      chord_symbol = excluded.chord_symbol,
      chord_root = excluded.chord_root;
