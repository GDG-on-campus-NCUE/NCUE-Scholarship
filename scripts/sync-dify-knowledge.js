const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.local')));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

// Dify Configuration
const DIFY_API_URL = 'http://localhost:8001/v1';
const DIFY_API_KEY = 'dataset-5rkIOPGjQcKSUPDN4GAhEmTH';
const DIFY_DATASET_ID = '8a883a5c-5ab8-441f-9e77-643dd8a6faf4';

// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sync() {
  console.log('Starting synchronization...');
  console.log(`Target Dify Dataset: ${DIFY_DATASET_ID}`);

  // 1. Fetch data from Supabase
  const { data: announcements, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching announcements:', error);
    return;
  }

  console.log(`Found ${announcements.length} active announcements.`);

  // 2. Process and Push to Dify
  let successCount = 0;
  let failCount = 0;

  for (const item of announcements) {
    // Format text chunk
    const content = `
[Scholarship Announcement]
Title: ${item.title}
Internal ID: ${item.internal_id || 'N/A'}
Category: ${item.category || 'General'}
Summary: ${item.summary || 'No summary provided.'}
Application Period: ${item.application_start_date || 'TBD'} to ${item.application_end_date || 'TBD'}
Target Audience: ${item.target_audience || 'All students'}
Limitations: ${item.application_limitations || 'None'}
Submission Method: ${item.submission_method || 'Check external links'}
Links: ${item.external_urls || 'N/A'}
    `.trim();

    try {
      const response = await fetch(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DIFY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: item.title,
          text: content,
          indexing_technique: 'high_quality',
          process_rule: {
            mode: 'automatic'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`[SUCCESS] Synced: ${item.title} (Doc ID: ${result.document?.id})`);
      successCount++;
      
      // Basic rate limiting to be nice to the local API
      await new Promise(resolve => setTimeout(resolve, 100)); 

    } catch (err) {
      console.error(`[FAILED] Failed to sync: ${item.title}`, err.message);
      failCount++;
    }
  }

  console.log('------------------------------------------------');
  console.log(`Sync Complete. Success: ${successCount}, Failed: ${failCount}`);
}

sync();
