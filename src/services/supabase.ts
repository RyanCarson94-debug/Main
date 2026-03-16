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
    if (error || !data) {
      if (error) console.warn('[sync] loadFromCloud error:', error.code, error.message);
      return null;
    }
    return data as { payload: object; saved_at: string };
  } catch (err) {
    console.warn('[sync] loadFromCloud exception:', err);
    return null;
  }
}

/**
 * Subscribe to Realtime changes on the app_state row.
 * Returns an unsubscribe function.
 * Used for live multi-device sync — when another tab/device saves,
 * this fires with the new payload so local state can be updated.
 */
export function subscribeToCloudChanges(
  callback: (payload: object) => void,
): () => void {
  if (!supabase) return () => {};
  const channel = supabase
    .channel('cloud-sync')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'app_state', filter: `id=eq.${ROW_ID}` },
      (change) => {
        const row = change.new as { payload: object };
        if (row?.payload) callback(row.payload);
      },
    )
    .subscribe();
  return () => { void supabase?.removeChannel(channel); };
}
