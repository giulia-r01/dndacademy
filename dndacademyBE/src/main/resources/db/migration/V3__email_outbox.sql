-- Mail is queued atomically with account/reset changes, then sent after commit.
-- No OAuth credentials, MIME bodies or plaintext reset tokens are stored here.
create table email_outbox (
    id varchar(36) not null primary key,
    user_id bigint not null,
    recipient varchar(254) not null,
    kind varchar(20) not null,
    status varchar(20) not null,
    reset_token_hash varchar(64),
    created_at timestamp(6) with time zone not null,
    expires_at timestamp(6) with time zone not null,
    next_attempt_at timestamp(6) with time zone not null,
    updated_at timestamp(6) with time zone not null,
    attempts integer not null,
    lease varchar(36),
    last_failure varchar(32),
    constraint fk_email_outbox_user foreign key (user_id) references users(id) on delete cascade,
    constraint ck_email_outbox_kind check (kind in ('WELCOME', 'PASSWORD_RESET')),
    constraint ck_email_outbox_status check (status in ('PENDING','PROCESSING','SENT','CANCELLED','FAILED')),
    constraint ck_email_outbox_attempts check (attempts >= 0),
    constraint ck_email_outbox_reset_hash check ((kind = 'WELCOME' and reset_token_hash is null)
        or (kind = 'PASSWORD_RESET' and reset_token_hash is not null))
);
create index idx_email_outbox_dispatch on email_outbox (status, next_attempt_at, created_at);
