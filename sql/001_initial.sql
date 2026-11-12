CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS contacts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 kind text NOT NULL CHECK(kind IN ('prospect','client')),
 name text NOT NULL,
 email text,
 phone text,
 interest text,
 notes text,
 status text NOT NULL DEFAULT 'new',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 converted_at timestamptz
);
CREATE TABLE IF NOT EXISTS documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
 filename text NOT NULL,
 mime_type text NOT NULL,
 size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 8388608),
 sha256 text NOT NULL,
 file_bytes bytea NOT NULL,
 ocr_text text,
 reviewed_by text,
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS activity_log (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 contact_id uuid REFERENCES contacts(id),
 actor text NOT NULL,
 action text NOT NULL,
 details jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contacts_kind_idx ON contacts(kind);
CREATE INDEX IF NOT EXISTS documents_contact_idx ON documents(contact_id);
CREATE INDEX IF NOT EXISTS activity_contact_idx ON activity_log(contact_id);
