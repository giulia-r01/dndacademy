create table avatar_cleanup (
    id varchar(36) not null primary key,
    user_id bigint not null,
    next_attempt_at timestamp(6) with time zone not null,
    attempts integer not null check (attempts >= 0),
    lease varchar(36)
);
create index idx_avatar_cleanup_ready on avatar_cleanup (next_attempt_at, id);
