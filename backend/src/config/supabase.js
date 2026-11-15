const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
let isConfigured = false;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    realtime: {
      transport: WebSocket
    }
  });
  isConfigured = true;
} else {
  console.warn('[Supabase] Warning: Supabase credentials not set or using placeholder values in .env');
}

module.exports = {
  supabase,
  isConfigured,
};
