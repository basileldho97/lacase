export function normalizeStoragePath(value: string): string | null {
  const raw = value.trim();
  if (!raw || raw.includes('..')) return null;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'property';
  if (raw.startsWith(`${bucket}/`)) return raw.slice(bucket.length + 1);
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try { const path = decodeURIComponent(new URL(raw).pathname); const match = path.match(/\/storage\/v1\/object\/(?:sign|authenticated|public)\/[^/]+\/(.+)$/); return match?.[1] || null; } catch { return null; }
  }
  return raw;
}
