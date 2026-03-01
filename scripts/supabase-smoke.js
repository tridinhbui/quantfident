import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable(name) {
  const { count, error } = await supabase
    .from(name)
    .select('id', { count: 'exact', head: true });

  if (error) {
    console.error(`Table check failed for ${name}:`, error.message);
    return;
  }

  console.log(`${name}: ${count ?? 0} rows`);
}

async function checkBucket(name) {
  const { data, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('Bucket list failed:', error.message);
    return;
  }

  const found = Array.isArray(data) && data.some((bucket) => bucket.name === name);
  if (found) {
    console.log(`bucket ${name}: ok`);
  } else {
    console.warn(`bucket ${name}: missing`);
  }
}

async function run() {
  console.log('Supabase smoke test');
  await checkTable('profiles');
  await checkTable('likes');
  await checkTable('comments');
  await checkTable('post_versions');
  await checkBucket('avatars');
  console.log('Done.');
}

run().catch((error) => {
  console.error('Smoke test failed:', error);
  process.exit(1);
});
