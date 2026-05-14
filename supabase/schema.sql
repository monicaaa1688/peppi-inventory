-- ── Peppi 库存管理 · Supabase Schema ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT        NOT NULL,
  thumbnail_url TEXT        DEFAULT '',
  status        TEXT        DEFAULT '现货'
                            CHECK (status IN ('现货', '在制', '在途')),
  stock         INTEGER     DEFAULT 0 CHECK (stock >= 0),
  arrival_note  TEXT        DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read + write policy (适合内部小团队; 如需登录验证请收紧策略)
CREATE POLICY "peppi_all" ON products
  FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER TABLE products REPLICA IDENTITY FULL;

-- (在 Supabase Dashboard → Database → Replication 中，把 products 表加入 supabase_realtime 发布)
