-- Недостающие поля турнира.
-- Форма создания/редактирования собирала эти данные, но в таблице tournaments
-- для них не было колонок, поэтому значения молча терялись при сохранении.

alter table public.tournaments
    add column if not exists organizer         text,
    add column if not exists venue_address     text,
    add column if not exists registration_time text,
    add column if not exists start_time        text,
    add column if not exists entry_fee_note    text,
    add column if not exists awards            text,
    add column if not exists contact_info      text;

-- Категория турнира однозначно определяется парой (дисциплина, рейтинг-группа).
-- Раньше группа хранилась только текстом внутри age_group ("Группа C"),
-- из-за чего синхронизация категорий при редактировании плодила дубликаты.
alter table public.tournament_categories
    add column if not exists rating_group text;

-- Переносим группу из age_group в rating_group для уже созданных турниров.
update public.tournament_categories
set rating_group = upper(trim(regexp_replace(age_group, '^Группа\s+', '', 'i')))
where rating_group is null
  and age_group is not null
  and upper(trim(regexp_replace(age_group, '^Группа\s+', '', 'i'))) in ('A', 'B', 'C', 'D', 'E');

alter table public.tournament_categories
    drop constraint if exists tournament_categories_rating_group_check;

alter table public.tournament_categories
    add constraint tournament_categories_rating_group_check
        check (rating_group is null or rating_group in ('A', 'B', 'C', 'D', 'E', 'OPEN'));

-- Одна и та же связка «турнир + дисциплина + группа» не должна дублироваться.
delete from public.tournament_categories a
    using public.tournament_categories b
where a.ctid > b.ctid
  and a.tournament_id = b.tournament_id
  and a.category = b.category
  and coalesce(a.rating_group, '') = coalesce(b.rating_group, '')
  and not exists (
      select 1 from public.tournament_participants p where p.category_id = a.id
  );

create unique index if not exists tournament_categories_unique_slot
    on public.tournament_categories (tournament_id, category, coalesce(rating_group, ''));

-- Один игрок не может дважды попасть в одну категорию как первый номер.
create unique index if not exists tournament_participants_unique_player1
    on public.tournament_participants (category_id, player1_id)
    where player1_id is not null;
