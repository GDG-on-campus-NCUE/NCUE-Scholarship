const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

// Dify Configuration
// Prefer environment variables, fallback to hardcoded (as in original script)
const DIFY_API_URL = process.env.DIFY_API_URL;
const DIFY_API_KEY = process.env.DIFY_DATASET_KEY;
const DIFY_DATASET_ID = process.env.DIFY_DATASET_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: Supabase credentials (URL and SERVICE_ROLE_KEY) not found.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Clean HTML content.
 */
function cleanContent(html) {
    if (!html) return '';
    return html
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Fetch all document IDs in the dataset.
 */
async function getAllDocumentIds() {
    let allIds = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const url = `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents?page=${page}&limit=100`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${DIFY_API_KEY}` }
        });

        if (!response.ok) {
            console.error(`Failed to fetch documents: ${response.status}`);
            break;
        }

        const data = await response.json();
        allIds = [...allIds, ...data.data.map(doc => doc.id)];
        hasMore = data.has_more;
        page++;
    }
    return allIds;
}

/**
 * Delete documents by IDs.
 */
async function deleteDocuments(ids) {
    console.log(`Deleting ${ids.length} documents...`);
    for (const id of ids) {
        try {
            await fetch(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${DIFY_API_KEY}` }
            });
        } catch (e) {
            console.error(`Failed to delete doc ${id}: ${e.message}`);
        }
    }
}

/**
 * Perform Sync.
 */
async function fullSync() {
    console.log(`[${new Date().toISOString()}] Starting Dify Full Sync...`);

    try {
        // 1. Clear Dataset
        const oldIds = await getAllDocumentIds();
        if (oldIds.length > 0) {
            await deleteDocuments(oldIds);
        }

        // 2. Fetch Data from Supabase
        const { data: announcements, error } = await supabase
            .from('announcements')
            .select('*, attachments(*)')
            .eq('is_active', true);

        if (error) throw error;
        console.log(`Fetched ${announcements.length} active announcements.`);

        // 3. Batch Upload
        let successCount = 0;
        for (const item of announcements) {
            const summary = cleanContent(item.summary);
            const targetAudience = cleanContent(item.target_audience);
            const attachments = item.attachments || [];
            const attachmentText = attachments.length > 0 
                ? attachments.map(att => `- ${att.file_name}: ${APP_URL}/api/attachments/${att.stored_file_path.split('/').pop()}`).join('\n')
                : '無附件';

            const content = `
[獎學金公告]
標題: ${item.title}
內部辨識名: ${item.internal_id || '無'}
分類: ${item.category || '未分類'}
摘要內容: ${summary}
申請開始日期: ${item.application_start_date || '未指定'}
申請截止日期: ${item.application_end_date || '未指定'}
適用對象: ${targetAudience || '未指定'}
兼領限制: ${item.application_limitations === 'Y' ? '可兼領' : (item.application_limitations === 'N' ? '不可兼領' : '未指定')}
送件方式: ${item.submission_method || '未指定'}
相關連結: ${item.external_urls || '無'}

[附件清單]
${attachmentText}
            `.trim();

            try {
                const res = await fetch(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${DIFY_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: item.title,
                        text: content,
                        indexing_technique: 'high_quality',
                        process_rule: { mode: 'automatic' }
                    })
                });

                if (res.ok) {
                    successCount++;
                    process.stdout.write('.'); // Progress indicator
                } else {
                    console.error(`\nFailed to sync "${item.title}": ${res.status}`);
                }
            } catch (e) {
                console.error(`\nError syncing "${item.title}": ${e.message}`);
            }
            
            // Small delay to avoid hammering the local Dify
            await new Promise(r => setTimeout(r, 50));
        }

        console.log(`\nSync Complete. Successfully re-imported ${successCount} documents.`);

    } catch (error) {
        console.error('Sync process failed:', error);
    }
}

fullSync();
