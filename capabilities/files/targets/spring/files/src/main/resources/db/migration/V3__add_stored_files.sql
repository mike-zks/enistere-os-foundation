CREATE TABLE stored_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name VARCHAR(255) NOT NULL,
    storage_key VARCHAR(512) NOT NULL UNIQUE,
    bucket VARCHAR(255) NOT NULL,
    mime_type VARCHAR(127) NOT NULL,
    extension VARCHAR(20) NOT NULL,
    size BIGINT NOT NULL CHECK (size > 0),
    category VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    owner_id UUID NOT NULL REFERENCES users(id),
    subject_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stored_files_owner_id ON stored_files(owner_id);
CREATE INDEX idx_stored_files_category ON stored_files(category);
CREATE INDEX idx_stored_files_status ON stored_files(status);
