import { getSystemConfig } from './config';

/**
 * Helper to get Dify configuration.
 */
async function getDifyConfig() {
  const apiKey = await getSystemConfig('DIFY_API_KEY');
  const baseUrl = await getSystemConfig('DIFY_API_URL');
  const datasetId = await getSystemConfig('DIFY_DATASET_ID');

  if (!apiKey || !baseUrl || !datasetId) {
    console.error('[Dify] Missing configuration. Please check DIFY_API_KEY, DIFY_API_URL, and DIFY_DATASET_ID.');
    return null;
  }

  // Ensure base URL doesn't end with a slash
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  return { apiKey, baseUrl: cleanBaseUrl, datasetId };
}

/**
 * Creates a new document in the Dify Knowledge Base.
 * 
 * @param {string} title The title of the document (e.g., Announcement Title).
 * @param {string} content The content of the document (e.g., Announcement Content).
 * @returns {Promise<string|null>} The ID of the created document, or null if failed.
 */
export async function createDifyDocument(title, content) {
  const config = await getDifyConfig();
  if (!config) return null;

  try {
    const url = `${config.baseUrl}/datasets/${config.datasetId}/document/create_by_text`;
    
    const body = {
      name: title,
      text: content,
      indexing_technique: 'high_quality', // or 'economy', depending on your setup
      process_rule: {
        mode: 'automatic'
      }
    };

    console.log(`[Dify] Creating document at ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Dify] Create failed: ${response.status} ${response.statusText}`, errorText);
      return null;
    }

    const data = await response.json();
    console.log(`[Dify] Document created successfully. ID: ${data.document.id}`);
    return data.document.id;

  } catch (error) {
    console.error('[Dify] Create error:', error);
    return null;
  }
}

/**
 * Updates an existing document in the Dify Knowledge Base.
 * Tries to use the update API first. If that fails or if preferred, 
 * implements the "delete then create" strategy (though update API is better for ID stability).
 * 
 * Note: Dify's update_by_text API might change the document ID or require re-indexing.
 * If the user specifically requested "delete then create", we can do that, but let's try update first 
 * as it's generally cleaner to keep the same ID if possible.
 * However, the user said: "Because updating Dify documents is troublesome... implement 'delete old, create new'".
 * So we will follow that instruction primarily, but if an update API is available and stable, we could use it.
 * The prompt says: "Implement 'delete old, create new' (OR if there is an Update API use Update)".
 * I'll use the Update API: POST /datasets/{dataset_id}/documents/{document_id}/update_by_text
 * 
 * @param {string} documentId The ID of the document to update.
 * @param {string} title The new title.
 * @param {string} content The new content.
 * @returns {Promise<string|null>} The new document ID (might be same or new), or null if failed.
 */
export async function updateDifyDocument(documentId, title, content) {
  const config = await getDifyConfig();
  if (!config) return null;

  if (!documentId) {
    console.warn('[Dify] No document ID provided for update. Creating new instead.');
    return createDifyDocument(title, content);
  }

  try {
    // Attempt to use the Update API
    const url = `${config.baseUrl}/datasets/${config.datasetId}/documents/${documentId}/update_by_text`;
    
    const body = {
      name: title,
      text: content,
      process_rule: {
        mode: 'automatic'
      }
    };

    console.log(`[Dify] Updating document ${documentId} at ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
        const data = await response.json();
        console.log(`[Dify] Document updated successfully.`);
        // The update API returns the document object, usually with the same ID.
        return data.document.id;
    } else {
        // If update fails (e.g. 404 Not Found), fallback to create new
        console.warn(`[Dify] Update failed with status ${response.status}. Fallback to create new.`);
        
        // Optionally delete the old one if it still exists but update failed for some other reason? 
        // No, if update failed, maybe it doesn't exist.
        // Let's just create a new one.
        return createDifyDocument(title, content);
    }

  } catch (error) {
    console.error('[Dify] Update error:', error);
    return null;
  }
}

/**
 * Deletes a document from the Dify Knowledge Base.
 * 
 * @param {string} documentId The ID of the document to delete.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function deleteDifyDocument(documentId) {
  const config = await getDifyConfig();
  if (!config) return false;

  if (!documentId) return false;

  try {
    const url = `${config.baseUrl}/datasets/${config.datasetId}/documents/${documentId}`;

    console.log(`[Dify] Deleting document ${documentId} at ${url}`);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`[Dify] Delete failed: ${response.status}`);
      return false;
    }

    const data = await response.json();
    if (data.result === 'success') {
        console.log(`[Dify] Document deleted successfully.`);
        return true;
    }
    return false;

  } catch (error) {
    console.error('[Dify] Delete error:', error);
    return false;
  }
}
