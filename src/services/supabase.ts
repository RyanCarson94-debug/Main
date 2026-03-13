import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ─── Schema (run this SQL in your Supabase SQL editor once) ───────────────────
//
// CREATE TABLE IF NOT EXISTS app_state (
//   id TEXT PRIMARY KEY,
//   payload JSONB NOT NULL DEFAULT '{}',
//   saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
// ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "allow_all" ON app_state FOR ALL TO anon USING (true) WITH CHECK (true);
//
// ─────────────────────────────────────────────────────────────────────────────

const ROW_ID = 'main';

export async function saveToCloud(data: object): Promise<void> {
  if (!supabase) return;
  try {
    await supabase
      .from('app_state')
      .upsert({ id: ROW_ID, payload: data, saved_at: new Date().toISOString() });
  } catch (err) {
    console.warn('Cloud save failed (non-critical):', err);
  }
}

export async function loadFromCloud(): Promise<{ payload: object; saved_at: string } | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('payload, saved_at')
      .eq('id', ROW_ID)
      .single();
    if (error || !data) return null;
    return data as { payload: object; saved_at: string };
  } catch {
    return null;
  }
}
