-- Run once on the fresherprep schema before deploying Pet System v2.
begin;
set search_path to fresherprep;

create table if not exists pets (
    id uuid primary key default gen_random_uuid(),
    code varchar(60) not null unique,
    name_vi varchar(100) not null,
    name_en varchar(100) not null,
    description_vi varchar(500) not null,
    description_en varchar(500) not null,
    learning_meaning_vi varchar(500) not null,
    learning_meaning_en varchar(500) not null,
    active boolean not null default true,
    display_order integer not null default 0 check (display_order >= 0),
    created_at timestamptz not null default now(),
    version bigint not null default 0
);

insert into pets (
    code, name_vi, name_en, description_vi, description_en,
    learning_meaning_vi, learning_meaning_en, active, display_order
) values (
    'JAVA_SEEDLING', 'M�m Java', 'Java Seedling',
    'Ng��i ~�n!�ng h�nh b�t �u h�nh tr�nh Java.', 'A companion beginning its Java journey.',
    'U��ng ts�ng cho ~�n t�ng v� th�i quen h�c �u!�n.', 'Represents strong foundations and consistent learning.',
    true, 1
) on conflict (code) do nothing;

alter table pet_settings drop constraint if exists ck_pet_settings_values;
alter table pet_settings drop column if exists max_level;
alter table pet_settings add constraint ck_pet_settings_values check (
    lesson_completion_points >= 0 and quiz_pass_points >= 0
    and points_per_food > 0 and energy_per_food > 0
);

alter table pet_level_configs drop constraint if exists ck_pet_level_range;
alter table pet_level_configs drop constraint if exists ck_pet_level_energy;
alter table pet_level_configs drop constraint if exists ck_pet_level_text;
alter table pet_level_configs drop constraint if exists pet_level_configs_pkey;
alter table pet_level_configs rename column level to level_order;
alter table pet_level_configs rename column name to name_vi;
alter table pet_level_configs rename column description to description_vi;
alter table pet_level_configs add column id uuid default gen_random_uuid();
alter table pet_level_configs add column pet_id uuid;
alter table pet_level_configs add column name_en varchar(100);
alter table pet_level_configs add column description_en varchar(300);
alter table pet_level_configs add column asset_reference varchar(255);
alter table pet_level_configs add column created_at timestamptz default now();

update pet_level_configs set
    pet_id = (select id from pets where code = 'JAVA_SEEDLING'),
    name_en = name_vi,
    description_en = description_vi,
    asset_reference = 'pets/java-seedling/lv' || level_order || '.webp'
where pet_id is null;

alter table pet_level_configs alter column id set not null;
alter table pet_level_configs alter column pet_id set not null;
alter table pet_level_configs alter column name_en set not null;
alter table pet_level_configs alter column description_en set not null;
alter table pet_level_configs alter column asset_reference set not null;
alter table pet_level_configs alter column created_at set not null;
alter table pet_level_configs add constraint pet_level_configs_pkey primary key (id);
alter table pet_level_configs add constraint fk_pet_level_pet foreign key (pet_id) references pets(id);
alter table pet_level_configs add constraint uk_pet_level_order unique (pet_id, level_order);
alter table pet_level_configs add constraint ck_pet_level_order check (level_order > 0);
alter table pet_level_configs add constraint ck_pet_level_energy check (required_energy >= 0);

alter table user_pets drop constraint if exists uk_user_pet_user;
alter table user_pets drop constraint if exists ck_user_pet_values;
alter table user_pets add column pet_id uuid;
alter table user_pets add column status varchar(20) default 'ACTIVE';
update user_pets set
    pet_id = (select id from pets where code = 'JAVA_SEEDLING'),
    status = case
        when pet_level >= (select max(level_order) from pet_level_configs) then 'COMPLETED'
        else 'ACTIVE'
    end
where pet_id is null;
alter table user_pets alter column pet_id set not null;
alter table user_pets alter column status set not null;
alter table user_pets add constraint fk_user_pet_definition foreign key (pet_id) references pets(id);
alter table user_pets add constraint uk_user_pet_collection unique (user_id, pet_id);
alter table user_pets add constraint ck_user_pet_status check (status in ('ACTIVE', 'COMPLETED'));
alter table user_pets add constraint ck_user_pet_values check (
    total_learning_points >= 0 and point_balance >= 0 and available_food >= 0
    and energy >= 0 and pet_level >= 1
);
create unique index if not exists uk_user_pet_one_active
    on user_pets(user_id) where status = 'ACTIVE';

alter table pet_reward_events add column if not exists applied boolean not null default true;

commit;
