begin;

create table if not exists fresherprep.pet_settings (
    id smallint primary key,
    lesson_completion_points integer not null,
    quiz_pass_points integer not null,
    points_per_food integer not null,
    energy_per_food integer not null,
    max_level integer not null,
    updated_at timestamptz not null,
    version bigint not null default 0,
    constraint ck_pet_settings_singleton check (id = 1),
    constraint ck_pet_settings_values check (
        lesson_completion_points >= 0
        and quiz_pass_points >= 0
        and points_per_food > 0
        and energy_per_food > 0
        and max_level between 1 and 3
    )
);

create table if not exists fresherprep.pet_level_configs (
    level integer primary key,
    name varchar(100) not null,
    description varchar(300) not null,
    required_energy integer not null,
    constraint ck_pet_level_range check (level between 1 and 3),
    constraint ck_pet_level_energy check (required_energy >= 0),
    constraint ck_pet_level_text check (
        char_length(btrim(name)) between 1 and 100
        and char_length(btrim(description)) between 1 and 300
    )
);

create table if not exists fresherprep.user_pets (
    id uuid primary key,
    user_id uuid not null references fresherprep.users(id) on delete cascade,
    total_learning_points bigint not null default 0,
    point_balance integer not null default 0,
    available_food integer not null default 0,
    energy integer not null default 0,
    pet_level integer not null default 1,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    version bigint not null default 0,
    constraint uk_user_pet_user unique (user_id),
    constraint ck_user_pet_values check (
        total_learning_points >= 0
        and point_balance >= 0
        and available_food >= 0
        and energy >= 0
        and pet_level between 1 and 3
    )
);

create table if not exists fresherprep.pet_reward_events (
    id uuid primary key,
    user_id uuid not null references fresherprep.users(id) on delete cascade,
    activity_type varchar(40) not null,
    source_id uuid not null,
    points_awarded integer not null,
    created_at timestamptz not null,
    constraint uk_pet_reward_user_activity_source unique (user_id, activity_type, source_id),
    constraint ck_pet_reward_activity check (activity_type in ('LESSON_COMPLETED', 'QUIZ_PASSED')),
    constraint ck_pet_reward_points check (points_awarded >= 0)
);

create index if not exists idx_pet_rewards_user_created
    on fresherprep.pet_reward_events (user_id, created_at desc);

insert into fresherprep.pet_settings (
    id, lesson_completion_points, quiz_pass_points, points_per_food,
    energy_per_food, max_level, updated_at, version
) values (1, 20, 10, 10, 20, 3, now(), 0)
on conflict (id) do nothing;

insert into fresherprep.pet_level_configs (level, name, description, required_energy)
values
    (1, 'Java Seedling', 'A curious companion starting its Java journey.', 100),
    (2, 'Code Explorer', 'A growing companion strengthened by consistent learning.', 250),
    (3, 'Backend Guardian', 'A confident companion ready for Fresher challenges.', 0)
on conflict (level) do nothing;

commit;
