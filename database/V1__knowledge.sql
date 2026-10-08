CREATE TABLE workspaces (id uuid PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE users (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES workspaces(id), email text NOT NULL UNIQUE,
 name text NOT NULL, password_hash text NOT NULL, role text NOT NULL CHECK(role IN ('admin','member')),
 active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL);
CREATE TABLE documents (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES workspaces(id), owner_id uuid NOT NULL REFERENCES users(id),
 title text NOT NULL, visibility text NOT NULL CHECK(visibility IN ('workspace','private')), category text NOT NULL,
 source_url text NOT NULL DEFAULT '', license text NOT NULL DEFAULT '', current_version integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE versions (
 id uuid PRIMARY KEY, document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE, number integer NOT NULL,
 filename text NOT NULL, media_type text NOT NULL, checksum text NOT NULL, file_bytes bytea NOT NULL,
 text_length integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(document_id,number)
);
CREATE TABLE chunks (
 id uuid PRIMARY KEY, version_id uuid NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
 ordinal integer NOT NULL, location text NOT NULL, content text NOT NULL,
 search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple',content)) STORED,
 UNIQUE(version_id,ordinal)
);
CREATE INDEX chunks_search ON chunks USING gin(search_vector);
CREATE INDEX versions_document ON versions(document_id);
CREATE INDEX documents_workspace ON documents(workspace_id);
CREATE TABLE indexing_runs (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES workspaces(id), user_id uuid NOT NULL REFERENCES users(id),
 document_id uuid REFERENCES documents(id) ON DELETE SET NULL, filename text NOT NULL,
 status text NOT NULL CHECK(status IN ('processing','success','unchanged','failed')),
 message text NOT NULL DEFAULT '', chunks integer NOT NULL DEFAULT 0,
 started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz
);
CREATE TABLE audit_events (
 id bigserial PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES workspaces(id), user_id uuid NOT NULL REFERENCES users(id),
 action text NOT NULL, target text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE judgments (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES workspaces(id), query text NOT NULL,
 document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
 relevance integer NOT NULL CHECK(relevance BETWEEN 1 AND 3), split text NOT NULL CHECK(split IN ('tuning','holdout')),
 rationale text NOT NULL, UNIQUE(workspace_id,query,document_id,split)
);
