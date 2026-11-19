-- Additive operational module: inventory, follow-ups and client/property matching.
CREATE TABLE IF NOT EXISTS properties (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 code text NOT NULL UNIQUE,
 title text NOT NULL,
 municipality text NOT NULL,
 neighborhood text,
 category text NOT NULL CHECK (category IN ('house','apartment','land','commercial','other')),
 operation text NOT NULL CHECK (operation IN ('sale','rent')),
 price_mxn numeric(14,2) NOT NULL CHECK (price_mxn>=0),
 status text NOT NULL DEFAULT 'available' CHECK(status IN ('available','reserved','closed','inactive')),
 notes text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS followups (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
 property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
 subject text NOT NULL,
 due_at timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','done','cancelled')),
 completed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((status='done' AND completed_at IS NOT NULL) OR (status<>'done' AND completed_at IS NULL))
);
CREATE TABLE IF NOT EXISTS contact_property_matches (
 contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
 property_id uuid NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
 status text NOT NULL DEFAULT 'interested' CHECK(status IN ('interested','visit','negotiating','discarded')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (contact_id,property_id)
);
CREATE INDEX IF NOT EXISTS properties_status_idx ON properties(status,operation);
CREATE INDEX IF NOT EXISTS followups_due_idx ON followups(status,due_at);
CREATE INDEX IF NOT EXISTS followups_contact_idx ON followups(contact_id);
CREATE INDEX IF NOT EXISTS matches_property_idx ON contact_property_matches(property_id);
