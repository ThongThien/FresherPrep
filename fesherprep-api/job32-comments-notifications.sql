begin;

create table if not exists fresherprep.content_comments (
    id uuid primary key,
    author_id uuid not null references fresherprep.users(id),
    lesson_id uuid references fresherprep.lessons(id) on delete cascade,
    quiz_id uuid references fresherprep.quizzes(id) on delete cascade,
    content varchar(2000) not null,
    edited_at timestamptz,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    constraint ck_content_comments_single_target check (
        (lesson_id is not null and quiz_id is null)
        or (lesson_id is null and quiz_id is not null)
    ),
    constraint ck_content_comments_content check (
        char_length(btrim(content)) between 1 and 2000
    )
);

create index if not exists idx_content_comments_lesson_created
    on fresherprep.content_comments (lesson_id, created_at desc);

create index if not exists idx_content_comments_quiz_created
    on fresherprep.content_comments (quiz_id, created_at desc);

create index if not exists idx_content_comments_author_created
    on fresherprep.content_comments (author_id, created_at desc);

create table if not exists fresherprep.admin_notifications (
    id uuid primary key,
    recipient_id uuid not null references fresherprep.users(id),
    comment_id uuid not null references fresherprep.content_comments(id) on delete cascade,
    read_at timestamptz,
    created_at timestamptz not null,
    constraint uk_admin_notification_recipient_comment unique (recipient_id, comment_id)
);

create index if not exists idx_admin_notifications_recipient_read
    on fresherprep.admin_notifications (recipient_id, read_at, created_at desc);

commit;
