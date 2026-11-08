CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS report_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(30) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type_code VARCHAR(30) NOT NULL REFERENCES report_types(code),
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO report_types (name, code, description) VALUES
  ('Enchente', 'FLOOD', 'Alagamento ou enchente urbana'),
  ('Incêndio', 'FIRE', 'Incêndio ou princípio de fogo'),
  ('Terremoto', 'EARTHQUAKE', 'Tremor ou abalo sísmico'),
  ('Via Bloqueada', 'BLOCKED_ROAD', 'Rua ou avenida bloqueada'),
  ('Queda de Árvore', 'TREE_FALL', 'Árvore caída ou risco de queda')
ON CONFLICT (code) DO NOTHING;
