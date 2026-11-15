const fs = require('fs');
const path = require('path');
const { supabase, isConfigured } = require('../src/config/supabase');

if (!isConfigured || !supabase) {
  console.error('[Error] Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

async function seedMines() {
  console.log('================================================================');
  console.log('CoalSafe: Seeding Real-World Coal Mines from Dataset');
  console.log('Source: Mines_and_Mineral_Resources (MSHA / USGS Official Registry)');
  console.log('================================================================');

  const jsonPath = path.join(__dirname, '../data/coal_mines.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`[Error] Dataset file not found at ${jsonPath}`);
    process.exit(1);
  }

  const mines = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Loaded ${mines.length} authentic coal mining facilities from dataset.`);

  // Test table existence
  const { error: testErr } = await supabase.from('coal_mines').select('id').limit(1);
  if (testErr) {
    console.log('\n[Notice] Table "public.coal_mines" does not exist in your Supabase project yet.');
    console.log('To create the table and populate it immediately with all 1,685 mines:');
    console.log('1. Open your Supabase Dashboard -> SQL Editor');
    console.log('2. Open the file: backend/src/db/seed_mines.sql');
    console.log('3. Paste the contents and click "Run".\n');
    return;
  }

  console.log('Table "public.coal_mines" verified. Beginning batch upsert...');

  const BATCH_SIZE = 100;
  let insertedCount = 0;

  for (let i = 0; i < mines.length; i += BATCH_SIZE) {
    const chunk = mines.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('coal_mines')
      .upsert(chunk, { onConflict: 'mine_id' });

    if (error) {
      console.error(`Error inserting batch ${i} to ${i + chunk.length}:`, error.message);
    } else {
      insertedCount += chunk.length;
      process.stdout.write(`\rProgress: ${insertedCount}/${mines.length} mines upserted (${Math.round((insertedCount / mines.length) * 100)}%)`);
    }
  }

  console.log('\n\n✔ Batch upsert complete!');
  const { count } = await supabase.from('coal_mines').select('*', { count: 'exact', head: true });
  console.log(`✔ Total coal mining facilities currently in database: ${count}`);
}

seedMines().catch(err => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
