// One-time data loader: pushes seed_universities.json and seed_programs.json
// into your Supabase project. Run this yourself, once, after the schema is
// created and your .env.local is filled in:
//
//   node scripts/seed.mjs
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (NOT the anon key —
// the service role key bypasses RLS so the seed script can write freely).
// Find both in Supabase → Project Settings → API.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  console.error('Run like: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const universities = JSON.parse(readFileSync(path.join(__dirname, 'seed_universities.json'), 'utf-8'));
const programs = JSON.parse(readFileSync(path.join(__dirname, 'seed_programs.json'), 'utf-8'));

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  console.log(`Seeding ${universities.length} universities...`);
  for (const batch of chunk(universities, 50)) {
    const { error } = await supabase.from('universities').upsert(batch, { onConflict: 'slug' });
    if (error) { console.error('University batch failed:', error); process.exit(1); }
  }

  // Build slug -> id map
  const { data: uniRows, error: uniErr } = await supabase.from('universities').select('id, slug');
  if (uniErr) { console.error(uniErr); process.exit(1); }
  const idBySlug = Object.fromEntries(uniRows.map(r => [r.slug, r.id]));

  console.log(`Seeding ${programs.length} programs...`);
  const programRows = programs
    .filter(p => idBySlug[p.university_slug])
    .map(p => ({
      university_id: idBySlug[p.university_slug],
      program: p.program,
      fields: p.fields,
    }));

  for (const batch of chunk(programRows, 200)) {
    const { error } = await supabase.from('programs').insert(batch);
    if (error) { console.error('Program batch failed:', error); process.exit(1); }
  }

  console.log('Done.');
}

main();
