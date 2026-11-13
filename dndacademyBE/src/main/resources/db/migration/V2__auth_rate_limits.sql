-- Shared counters survive restarts and serialize attempts across backend instances.
-- Keys are HMAC digests: no raw email, username or IP is stored here.
create table auth_rate_limit_buckets (
    id varchar(64) not null primary key,
    attempts integer not null,
    expires_at timestamp(6) with time zone not null,
    constraint ck_auth_rate_limit_attempts check (attempts >= 0)
);
create index idx_auth_rate_limit_expiry on auth_rate_limit_buckets (expires_at);
