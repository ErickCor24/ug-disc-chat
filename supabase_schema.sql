-- ============================================================
-- SCHEMA: Discord Clone — Supabase / PostgreSQL
-- Ejecutar en orden en el SQL Editor de Supabase
-- ============================================================

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT         NOT NULL,
    created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- 2. Tabla de Canales
CREATE TABLE IF NOT EXISTS channels (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Mensajes
CREATE TABLE IF NOT EXISTS messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id    UUID          REFERENCES users(id)    ON DELETE SET NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para acelerar historial por canal (crítico)
CREATE INDEX IF NOT EXISTS idx_messages_channel_created
    ON messages(channel_id, created_at DESC);

-- 4. Canales por defecto
INSERT INTO channels (name, description) VALUES
    ('general',   'Canal principal para todos'),
    ('tech',      'Conversaciones sobre tecnología'),
    ('off-topic', 'Todo lo demás')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- NOTA DE SEGURIDAD:
-- El backend accede con la SERVICE_ROLE key que bypasea RLS.
-- Para producción, habilitar RLS y crear políticas apropiadas.
-- ============================================================
