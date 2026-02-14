/**
 * Dify Knowledge Base Sync Utility
 * 
 * Implements synchronization between the announcement system and Dify Knowledge Base.
 */

import { supabaseServer } from './supabase/server';
import { getSystemConfig } from './config';

/**
 * Helper to get Dify configuration.
 */
async function getDifyConfig() {
    // Priority: system_settings table -> environment variables
    let apiKey = await getSystemConfig('DIFY_API_KEY');
    let baseUrl = await getSystemConfig('DIFY_API_URL');
    let datasetId = await getSystemConfig('DIFY_DATASET_ID');

    if (!apiKey || !baseUrl || !datasetId) {
        console.error('[DifySync] Missing configuration:', { apiKey: !!apiKey, baseUrl, datasetId });
        return null;
    }

    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return { apiKey, baseUrl: cleanBaseUrl, datasetId };
}

/**
 * Strip HTML tags and clean up text.
 */
function cleanContent(html) {
    if (!html) return '';
    return html
        .replace(/<[^>]*>?/gm, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')   // Replace non-breaking spaces
        .replace(/\s+/g, ' ')      // Collapse multiple spaces
        .trim();
}

/**
 * Format announcement for Dify.
 */
function formatAnnouncementForDify(announcement) {
    const summary = cleanContent(announcement.summary);
    const targetAudience = cleanContent(announcement.target_audience);
    
    let externalUrls = [];
    try {
        const parsed = JSON.parse(announcement.external_urls);
        if (Array.isArray(parsed)) {
            externalUrls = parsed.map(item => item.url).filter(Boolean);
        }
    } catch (e) {
        if (typeof announcement.external_urls === 'string' && announcement.external_urls.startsWith('http')) {
            externalUrls = [announcement.external_urls];
        }
    }

    return `
[獎學金公告]
標題: ${announcement.title}
內部辨識名: ${announcement.internal_id || '無'}
分類: ${announcement.category || '未分類'}
摘要內容: ${summary}
申請開始日期: ${announcement.application_start_date || '未指定'}
申請截止日期: ${announcement.application_end_date || '未指定'}
適用對象: ${targetAudience || '未指定'}
兼領限制: ${announcement.application_limitations === 'Y' ? '可兼領' : (announcement.application_limitations === 'N' ? '不可兼領' : '未指定')}
送件方式: ${announcement.submission_method || '未指定'}
相關連結: ${externalUrls.join(', ') || '無'}
    `.trim();
}

/**
 * Synchronize a single announcement to Dify.
 * Handles Create and Update (Upsert logic).
 * 
 * @param {string} announcementId 
 * @returns {Promise<{success: boolean, documentId?: string, error?: string}>}
 */
export async function syncAnnouncementToDify(announcementId) {
    const config = await getDifyConfig();
    if (!config) return { success: false, error: 'Missing Dify configuration' };

    try {
        // 1. Fetch announcement data
        const { data: announcement, error: fetchError } = await supabaseServer
            .from('announcements')
            .select('*')
            .eq('id', announcementId)
            .single();

        if (fetchError || !announcement) {
            return { success: false, error: `Announcement not found: ${fetchError?.message}` };
        }

        const formattedText = formatAnnouncementForDify(announcement);
        const existingDocId = announcement.dify_document_id;

        let resultDocId = null;

        if (existingDocId) {
            // 2a. Update existing document
            const url = `${config.baseUrl}/datasets/${config.datasetId}/documents/${existingDocId}/update_by_text`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: announcement.title,
                    text: formattedText,
                    process_rule: { mode: 'automatic' }
                })
            });

            if (response.ok) {
                const data = await response.json();
                resultDocId = data.document?.id || existingDocId;
                console.log(`[DifySync] Updated document: ${resultDocId}`);
            } else if (response.status === 404) {
                // Document lost in Dify? Create a new one.
                console.warn(`[DifySync] Document ${existingDocId} not found in Dify. Creating new.`);
                resultDocId = await createNewDifyDocument(config, announcement, formattedText);
            } else {
                const errorText = await response.text();
                return { success: false, error: `Update failed (${response.status}): ${errorText}` };
            }
        } else {
            // 2b. Create new document
            resultDocId = await createNewDifyDocument(config, announcement, formattedText);
        }

        // 3. Update Supabase with the new document ID if it changed or was newly created
        if (resultDocId && resultDocId !== existingDocId) {
            const { error: updateError } = await supabaseServer
                .from('announcements')
                .update({ dify_document_id: resultDocId })
                .eq('id', announcementId);
            
            if (updateError) {
                console.error('[DifySync] Failed to update dify_document_id in Supabase:', updateError);
            }
        }

        return { success: true, documentId: resultDocId };

    } catch (error) {
        console.error('[DifySync] Sync exception:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Helper to create a new Dify document.
 */
async function createNewDifyDocument(config, announcement, text) {
    const url = `${config.baseUrl}/datasets/${config.datasetId}/document/create_by_text`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: announcement.title,
            text: text,
            indexing_technique: 'high_quality',
            process_rule: { mode: 'automatic' }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Create failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log(`[DifySync] Created document: ${data.document?.id}`);
    return data.document?.id;
}

/**
 * Delete a document from Dify.
 * 
 * @param {string} announcementIdOrDocId 
 * @param {boolean} isDocId If true, the first param is treated as the Dify Document ID.
 * @returns {Promise<boolean>}
 */
export async function deleteAnnouncementFromDify(id, isDocId = false) {
    const config = await getDifyConfig();
    if (!config) return false;

    let docId = id;

    if (!isDocId) {
        // Fetch the doc ID from Supabase
        const { data, error } = await supabaseServer
            .from('announcements')
            .select('dify_document_id')
            .eq('id', id)
            .single();
        
        if (error || !data?.dify_document_id) return false;
        docId = data.dify_document_id;
    }

    try {
        const url = `${config.baseUrl}/datasets/${config.datasetId}/documents/${docId}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok || response.status === 404) {
            console.log(`[DifySync] Deleted document: ${docId}`);
            return true;
        }

        const errorText = await response.text();
        console.error(`[DifySync] Delete failed (${response.status}):`, errorText);
        return false;

    } catch (error) {
        console.error('[DifySync] Delete exception:', error);
        return false;
    }
}
