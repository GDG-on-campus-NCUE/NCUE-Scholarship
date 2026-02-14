const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

// Configuration aligned with .env.local
const DIFY_API_URL = process.env.DIFY_API_URL;
const DIFY_API_KEY = process.env.DIFY_DATASET_KEY;
const DIFY_DATASET_ID = process.env.DIFY_DATASET_ID;

// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: Supabase credentials not found.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function cleanContent(html) {
    if (!html) return '';
    return html
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function syncAll() {
    console.log('--- Dify Initial Sync Starting ---');
    console.log(`Endpoint: ${DIFY_API_URL}`);
    console.log(`Dataset ID: ${DIFY_DATASET_ID}`);
    console.log(`API Key: ${DIFY_API_KEY.substring(0, 12)}...`);

    const { data: announcements, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error('Database Error:', error);
        return;
    }

    console.log(`Found ${announcements.length} announcements to process.`);

    let success = 0, fail = 0;

    for (const item of announcements) {
        const content = `
[獎學金公告]
標題: ${item.title}
內部辨識名: ${item.internal_id || '無'}
分類: ${item.category || '未分類'}
摘要內容: ${cleanContent(item.summary)}
申請截止日期: ${item.application_end_date || '未指定'}
適用對象: ${cleanContent(item.target_audience) || '未指定'}
送件方式: ${item.submission_method || '未指定'}
        `.trim();

        try {
            let docId = item.dify_document_id;
            let url = docId 
                ? `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents/${docId}/update_by_text`
                : `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`;

            const response = await fetch(url, {
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

            if (!response.ok) {
                if (response.status === 404 && docId) {
                    const createUrl = `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`;
                    const createRes = await fetch(createUrl, {
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
                    if (createRes.ok) {
                        const data = await createRes.json();
                        docId = data.document?.id;
                    } else {
                        throw new Error(`Fallback create failed: ${await createRes.text()}`);
                    }
                } else {
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
            } else {
                const data = await response.json();
                docId = data.document?.id || docId;
            }

            if (docId && docId !== item.dify_document_id) {
                await supabase.from('announcements').update({ dify_document_id: docId }).eq('id', item.id);
            }

            console.log(`[OK] ${item.title}`);
            success++;
        } catch (err) {
            console.error(`[ERR] ${item.title} -> ${err.message}`);
            fail++;
        }
        await new Promise(res => setTimeout(res, 200)); // Fixed ReferenceError
    }

    console.log(`\nSync Finished. Success: ${success}, Failed: ${fail}`);
}

syncAll();
