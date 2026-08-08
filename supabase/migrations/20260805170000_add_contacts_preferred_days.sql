begin;

create or replace function public.contacts_preferred_days_are_unique(
  p_days text[]
)
returns boolean
language sql
immutable
strict
parallel safe
as $$
  select cardinality(p_days) = (
    select count(distinct day)
    from unnest(p_days) as days(day)
  );
$$;

alter table public.contacts
  add column preferred_days text[] null;

alter table public.contacts
  add constraint contacts_preferred_days_valid
  check (
    preferred_days is null
    or (
      cardinality(preferred_days) > 0
      and public.contacts_preferred_days_are_unique(preferred_days)
      and preferred_days <@ array[
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      ]::text[]
    )
  );

create index contacts_preferred_days_idx
  on public.contacts
  using gin (preferred_days);

commit;