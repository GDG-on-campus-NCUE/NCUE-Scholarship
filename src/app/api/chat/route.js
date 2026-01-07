import { NextResponse } from 'next/server'
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { supabase } from '@/lib/supabase/client'
import { getSystemConfig } from '@/lib/config'

const SYSTEM_PROMPT = `# 角色 (Persona)
你是一位專為「彰化師範大學獎學金資訊平台」設計的**頂尖AI助理**。你的個性是專業、精確且樂於助人，你的任務是根據我提供給你的「# 參考資料」（這可能來自內部公告或外部網路搜尋），用**流暢的繁體中文**總結並回覆獎學金問題。

# 表達與格式化規則
1.  **直接回答:** 請直接以對話的方式回答問題，不要說「根據我找到的資料...」。
2.  **結構化輸出:** 當資訊包含多個項目時，請**務必使用 HTML 的列表或表格**來呈現，當為結構化的比較資訊時建議以 table 呈現，而 ol 會比 ul 更能顯示重點。
3.  **引用來源:**
    -   如果參考資料來源是「外部網頁搜尋結果」，你【必須】生成**完整的 HTML 超連結 <a> 標籤**來嵌入來源。
    -   此標籤【必須】包含 href 屬性指向來源 URL，以及 target="_blank" 屬性。
    -   **範例:** <a href="完整的網址" target="_blank" rel="noopener noreferrer">這裡放連結文字</a>
    -   【絕對禁止】使用 Markdown 的 [文字](網址) 格式。
    -   如果參考資料來源是「內部公告」，你【絕對不能】生成任何連結。
4. **重點標示規則:**
    - 關鍵警示: 用於【截止日期、名額限制、不可撤銷的動作】等具時效性或嚴重性的關鍵資訊，請使用帶有紅色樣式的粗體 <strong> 標籤。
        格式: <strong style="color: #D6334C;">文字</strong>
    - 重要須知: 用於【申請資格、必要文件、注意事項】等需要使用者特別留意的資訊、或與使用者問題相關的回覆關鍵訊息，請使用帶有特定 class 的螢光筆效果 <span> 標籤。前端會為這個 class 添加樣式。
        格式: <span class="highlight-notice">文字</span>
5.  **最終回應:** 在你的主要回答內容之後，如果本次回答參考了內部公告，請務必在訊息的【最後】加上 \`[ANNOUNCEMENT_CARD:id1,id2,...]\` 這樣的標籤，其中 id 是你參考的公告 ID。
6.  **嚴禁事項:**
    -   【絕對禁止】輸出任何 JSON 格式的程式碼或物件。
    -   如果「# 參考資料」為空或與問題無關，就直接回答：「抱歉，關於您提出的問題，我目前找不到相關的資訊。」

# 服務範圍限制
你的知識範圍【嚴格限定】在「獎學金申請」相關事務。若問題無關，請禮貌地說明你的服務範圍並拒絕回答。`

async function callGeminiAPI(prompt, temperature = 0.4, isJsonResponse = false) {
    try {
        const apiKey = await getSystemConfig('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('Gemini API key not configured');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const generationConfig = {
            temperature: temperature,
            maxOutputTokens: 8192
        };

        if (isJsonResponse) {
            generationConfig.responseMimeType = "application/json";
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();

    } catch (error) {
        console.error('Gemini API 錯誤:', error);
        throw error;
    }
}

async function callSerpAPI(query) {
    try {
        if (!process.env.SERP_API_KEY ||
            process.env.SERP_API_KEY === 'YOUR_SERP_API_KEY_HERE' ||
            !process.env.SERP_API_KEY.trim()) {
            console.log('SERP API key not configured or invalid, skipping external search.');
            return [];
        }

        const searchQuery = `${query} 獎學金 (site:ncue.edu.tw OR "彰化師範大學" OR site:.gov.tw OR site:.org.tw OR "基金會")`;
        const encodedQuery = encodeURIComponent(searchQuery);
        const url = `https://serpapi.com/search.json?q=${encodedQuery}&api_key=${process.env.SERP_API_KEY}&gl=tw&hl=zh-tw`;

        const response = await fetch(url);
        if (!response.ok) {
            console.log(`SERP API request failed: ${response.status} - ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return data.organic_results || [];
    } catch (error) {
        console.error('SERP API 錯誤:', error.message);
        return [];
    }
}

async function saveMessageToHistory(userId, role, messageContent, sessionId) {
    try {
        const { error } = await supabase
            .from('chat_history')
            .insert({
                user_id: userId,
                session_id: sessionId,
                role: role,
                message_content: messageContent,
                timestamp: new Date().toISOString()
            });

        if (error) {
            console.error('Error saving message to history:', error);
        }
    } catch (error) {
        console.error('Error in saveMessageToHistory:', error);
    }
}


export async function POST(request) {
    try {
        // ... (中介軟體和資料驗證邏輯保持不變) ...
        const rateLimitCheck = checkRateLimit(request, 'chat', 30, 60000);
        if (!rateLimitCheck.success) return rateLimitCheck.error;

        const authCheck = await verifyUserAuth(request, { requireAuth: true });
        if (!authCheck.success) return authCheck.error;

        const body = await request.json();
        const dataValidation = validateRequestData(body, ['message'], ['history', 'sessionId']);
        if (!dataValidation.success) return dataValidation.error;

        const { message: userMessage, history = [] } = dataValidation.data;
        const sessionId = dataValidation.data.sessionId || crypto.randomUUID();
        const userId = authCheck.user.id;

        // ... RAG 流程 ...
        const historyForPrompt = history.map(msg => `${msg.role}: ${msg.message_content}`).join('\n');

        const intentCheckPrompt = `你是一個意圖分類器。請判斷以下使用者問題是否與「獎學金」或「校內補助」相關。\n請只回傳 "RELATED" 或 "UNRELATED"。\n\n使用者問題: '${userMessage}'`;
        const intentResult = await callGeminiAPI(intentCheckPrompt, 0.0);

        if (intentResult.toUpperCase().trim() === 'UNRELATED') {
            const rejectionMessage = `很抱歉，我的知識範圍僅限於獎學金申請相關事務。關於您提出的問題，我可能無法提供協助。 如您仍有疑問，可以透過下方按鈕聯繫承辦人員`;
            await saveMessageToHistory(userId, 'user', userMessage, sessionId);
            await saveMessageToHistory(userId, 'model', rejectionMessage, sessionId);
            return NextResponse.json({ response: rejectionMessage, sessionId });
        }

        let fullTextContext = '';
        let sourceType = 'none';
        let retrievedIds = [];

        const { data: allAnnouncements, error: announcementsError } = await supabase
            .from('announcements')
            .select('id, title, summary, target_audience, application_start_date, application_end_date, submission_method, application_limitations')
            .eq('is_active', true);

        if (announcementsError) {
            console.error('Error fetching announcements:', announcementsError);
        }

        if (allAnnouncements && allAnnouncements.length > 0) {
            const documentsForRetrieval = allAnnouncements.map(ann => ({
                id: ann.id,
                content: `標題: ${ann.title}\n摘要: ${ann.summary.replace(/<[^>]+>/g, ' ')}`
            }));

            const retrievalPrompt = `# 任務\n對於下方「可用文件列表」中的**每一份**文件，根據使用者問題的**真實意圖**，給出一個 0 到 10 的相關性分數。\n\n# 輸入資料\n## 使用者最新問題:\n'${userMessage}'\n## 可用文件列表:\n${JSON.stringify(documentsForRetrieval)}\n\n# 輸出格式\n請只回傳一個 JSON 陣列，其中每個物件包含 \`id\` 和 \`score\`。`;

            try {
                const scoresJson = await callGeminiAPI(retrievalPrompt, 0.0, true);
                const confidenceScores = JSON.parse(scoresJson);
                const highConfidenceItems = confidenceScores.filter(item => item.score >= 7);

                if (highConfidenceItems.length > 0) {
                    retrievedIds = highConfidenceItems.map(item => item.id);
                    sourceType = 'internal';
                }
            } catch (error) {
                console.error('Error in document retrieval scoring:', error);
            }
        }

        if (sourceType === 'internal') {
            const validIds = new Set(retrievedIds);
            const retrievedFullTexts = allAnnouncements.filter(ann => validIds.has(ann.id));

            if (retrievedFullTexts.length > 0) {
                fullTextContext = '\n\n# 參考資料 (內部獎學金公告)：';

                for (const doc of retrievedFullTexts) {
                    fullTextContext += `
## 公告 ID: ${doc.id}
### 公告標題：《${doc.title}》
- **摘要:** ${doc.summary.replace(/<[^>]+>/g, ' ')}
- **適用對象:** ${doc.target_audience.replace(/<[^>]+>/g, ' ')}
- **申請開始日期:** ${doc.application_start_date || '未指定'}
- **公告結束日期 (申請截止):** ${doc.application_end_date || '未指定'}
- **送件方式:** ${doc.submission_method || '未指定'}
- **申請限制:** ${doc.application_limitations || '未指定'}
---`;
                }
            }
        } else {
            const searchQueryPrompt = `你是一個搜尋查詢優化工具。請將以下對話，整合成一個單一、清晰、適合在 Google 上搜尋的查詢語句。\n\n# 對話:\n${historyForPrompt}\nuser:${userMessage}\n\n# 輸出\n請只回傳一句查詢語句。`;
            const searchQuery = await callGeminiAPI(searchQueryPrompt, 0.0);
            const webResults = await callSerpAPI(searchQuery);
            if (webResults.length > 0) {
                fullTextContext = '\n\n# 參考資料 (外部網頁搜尋結果)：';
                let count = 0;
                for (const result of webResults) {
                    if (count >= 3) break;
                    if (result.snippet && result.link && result.title) {
                        fullTextContext += `\n\n## 網頁標題: ${result.title}\n## 網頁連結: ${result.link}\n## 內容摘要: ${result.snippet}\n---`;
                        count++;
                    }
                }
                sourceType = 'external';
            }
        }

        const finalPrompt = `${SYSTEM_PROMPT}\n\n# 對話歷史:\n${historyForPrompt}\nuser: ${userMessage}\n${fullTextContext}`;
        let aiResponseContent = await callGeminiAPI(finalPrompt, 0.4);

        if (!aiResponseContent) aiResponseContent = "抱歉，我暫時無法回答您的問題。";

        const disclaimerIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="disclaimer-icon" style="flex-shrink: 0; margin-top: 2px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
        const disclaimerInternal = `<div class="ai-disclaimer" style="display: flex; align-items: flex-start; gap: 8px;">${disclaimerIcon}<span>此為 AI 依據校內公告生成的摘要內容，請以平台公告原文為準。</span></div>`;
        const disclaimerExternal = `<div class="ai-disclaimer" style="display: flex; align-items: flex-start; gap: 8px;">${disclaimerIcon}<span>此為 AI 依據網路搜尋結果生成的摘要內容，請點擊來源連結查證資訊。</span></div>`;

        const hasDisclaimer = aiResponseContent.includes('<div class="ai-disclaimer">');

        if (!hasDisclaimer) {
            if (sourceType === 'internal') {
                aiResponseContent += `\n\n${disclaimerInternal}`;
            } else if (sourceType === 'external') {
                aiResponseContent += `\n\n${disclaimerExternal}`;
            }
        }

        if (sourceType === 'internal' && retrievedIds.length > 0) {
            if (!aiResponseContent.includes('[ANNOUNCEMENT_CARD:')) {
                aiResponseContent += `\n[ANNOUNCEMENT_CARD:${retrievedIds.join(',')}]`;
            }
        }

        // 儲存並回傳
        await saveMessageToHistory(userId, 'user', userMessage, sessionId);
        await saveMessageToHistory(userId, 'model', aiResponseContent, sessionId);

        logSuccessAction('CHAT_RESPONSE', '/api/chat', { userId, sourceType });
        return NextResponse.json({ response: aiResponseContent, sessionId });

    } catch (error) {
        return handleApiError(error, '/api/chat');
    }
}
