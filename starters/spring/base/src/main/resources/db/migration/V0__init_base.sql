-- Flyway V0 — API base: cross-cutting infrastructure schema (ADR-056).
-- audit_logs is generic and has no foreign key: each composed capability records
-- its own event types here. Runs before any capability migration.
CREATE TABLE audit_logs (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type  VARCHAR(64)  NOT NULL,
    user_id     UUID,
    target_type VARCHAR(64),
    target_id   VARCHAR(255),
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(512),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id    ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs (event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);
