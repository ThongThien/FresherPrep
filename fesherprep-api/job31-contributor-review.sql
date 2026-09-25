begin;

do $$
declare
    constraint_name text;
begin
    for constraint_name in
        select conname
        from pg_constraint
        where conrelid = 'fresherprep.users'::regclass
          and contype = 'c'
          and position('role' in lower(pg_get_constraintdef(oid))) > 0
    loop
        execute format(
            'alter table fresherprep.users drop constraint %I',
            constraint_name
        );
    end loop;
end
$$;

alter table fresherprep.users
    alter column role type varchar(16);

alter table fresherprep.users
    add constraint ck_users_role
    check (role in ('USER', 'CONTRIBUTOR', 'ADMIN'));

create table if not exists fresherprep.content_submissions (
    id uuid primary key,
    content_type varchar(16) not null,
    content_id uuid not null,
    content_title varchar(200) not null,
    submitted_by uuid not null references fresherprep.users(id),
    reviewed_by uuid references fresherprep.users(id),
    status varchar(24) not null,
    review_comment varchar(2000),
    submitted_at timestamptz,
    reviewed_at timestamptz,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    constraint uk_content_submission_target unique (content_type, content_id),
    constraint ck_content_submission_type
        check (content_type in ('LESSON', 'QUESTION', 'QUIZ')),
    constraint ck_content_submission_status
        check (status in ('DRAFT', 'PENDING_REVIEW', 'REJECTED', 'PUBLISHED'))
);

create index if not exists idx_content_submissions_owner_status
    on fresherprep.content_submissions (submitted_by, status);

create index if not exists idx_content_submissions_review_queue
    on fresherprep.content_submissions (status, submitted_at);

create table if not exists fresherprep.content_review_events (
    id uuid primary key,
    submission_id uuid not null references fresherprep.content_submissions(id),
    actor_id uuid not null references fresherprep.users(id),
    action varchar(16) not null,
    comment varchar(2000),
    created_at timestamptz not null,
    constraint ck_content_review_event_action
        check (action in ('CREATED', 'EDITED', 'SUBMITTED', 'REJECTED', 'APPROVED', 'PUBLISHED'))
);

create index if not exists idx_content_review_events_submission
    on fresherprep.content_review_events (submission_id, created_at);

commit;
