import { createClient } from '@supabase/supabase-js';

const required = ['NEXT_SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'SUPABASE_STORAGE_BUCKET'];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(`Missing required environment variable(s): ${missing.join(', ')}`);
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

try {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  const { data: buckets, error: bucketListError } = await supabase.storage.listBuckets();
  if (bucketListError) throw bucketListError;
  if (buckets.some((item) => item.name === bucket)) {
    const { error } = await supabase.storage.updateBucket(bucket, { public: false });
    if (error) throw error;
  } else {
    const { error } = await supabase.storage.createBucket(bucket, { public: false });
    if (error) throw error;
  }

  console.log('Storage is ready. Create users in Supabase Auth, then assign the first admin role using the SQL migration/dashboard.');
} catch (error) {
  console.error(`Unable to provision admin user: ${error instanceof Error ? error.message : 'unknown error'}`);
  process.exit(1);
}
