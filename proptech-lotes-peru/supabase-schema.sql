-- ============================================================
-- PerúInversión — Script SQL para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── 1. PROJECTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id            TEXT PRIMARY KEY,
  data          JSONB NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  is_featured   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. HERO SLIDES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hero_slides (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. SITE CONFIG (una sola fila, singleton) ─────────────────
CREATE TABLE IF NOT EXISTS site_config (
  id         INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. FERIA CONFIG (singleton) ──────────────────────────────
CREATE TABLE IF NOT EXISTS feria_config (
  id         INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. AD BANNERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_banners (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. CHAT CONFIG (singleton) ───────────────────────────────
CREATE TABLE IF NOT EXISTS chat_config (
  id         INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. RESERVATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id         TEXT PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,
  data       JSONB NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 8. CONTACT SUBMISSIONS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_submissions (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 9. CONVERSATIONS (chat en vivo) ──────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id              TEXT PRIMARY KEY,
  visitor_name    TEXT NOT NULL DEFAULT 'Visitante',
  visitor_email   TEXT NOT NULL DEFAULT '',
  project_id      TEXT NOT NULL DEFAULT '',
  project_name    TEXT NOT NULL DEFAULT '',
  messages        JSONB NOT NULL DEFAULT '[]',
  is_read         BOOLEAN NOT NULL DEFAULT false,
  is_closed       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 10. FERIA REGISTROS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS feria_registros (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Índices útiles ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_projects_active    ON projects (is_active);
CREATE INDEX IF NOT EXISTS idx_projects_featured  ON projects (is_featured);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations (status);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_read ON contact_submissions (is_read);
CREATE INDEX IF NOT EXISTS idx_feria_read   ON feria_registros (is_read);

-- ── RLS: deshabilitar (el acceso se controla desde las API routes con service_role) ─
ALTER TABLE projects           DISABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides        DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_config        DISABLE ROW LEVEL SECURITY;
ALTER TABLE feria_config       DISABLE ROW LEVEL SECURITY;
ALTER TABLE ad_banners         DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_config        DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations       DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations      DISABLE ROW LEVEL SECURITY;
ALTER TABLE feria_registros    DISABLE ROW LEVEL SECURITY;
