export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { verifyUserAuth, checkRateLimit, handleApiError } from '@/lib/apiMiddleware'
import { supabaseServer as supabase } from '@/lib/supabase/server'

const DIGIRUNNER_URL = process.env.DIGIRUNNER_URL;
const DIFY_API_KEY = process.env.DIFY_API_KEY;

async function saveHistory(userId, sessionId, userMessage, aiResponse) {
    try {
        await supabase.from('chat_history').insert([
            { user_id: userId, session_id: sessionId, role: 'user', message_content: userMessage, timestamp: new Date().toISOString() },
            { user_id: userId, session_id: sessionId, role: 'model', message_content: aiResponse, timestamp: new Date().toISOString() }
        ]);
    } catch (e) {
        console.error('[History] Failed to save:', e);
    }
}

export async function POST(request) {
    try {
        const rateLimitCheck = checkRateLimit(request, 'chat', 30, 60000);
        if (!rateLimitCheck.success) return rateLimitCheck.error;

        const authCheck = await verifyUserAuth(request, { requireAuth: true });
        if (!authCheck.success) return authCheck.error;

        const body = await request.json();
        const { messages, sessionId: providedSessionId, dify_conversation_id } = body;
        
        // 強化相容性：擷取 user 最新文字，通吃各種 SDK 結構
        const lastMessage = messages?.[messages.length - 1];
        let userMessage = '';
        if (typeof lastMessage?.content === 'string') userMessage = lastMessage.content;
        else if (Array.isArray(lastMessage?.content)) userMessage = lastMessage.content.find(p => p.type === 'text')?.text || '';
        else if (Array.isArray(lastMessage?.parts)) userMessage = lastMessage.parts.find(p => p.type === 'text')?.text || '';
        else userMessage = body.text || '';

        if (!userMessage) return NextResponse.json({ error: 'No user message provided' }, { status: 400 });

        const sessionId = providedSessionId || crypto.randomUUID();
        const userId = authCheck.user.id;

        const response = await fetch(DIGIRUNNER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DIFY_API_KEY}`
            },
            body: JSON.stringify({
                inputs: {},
                query: userMessage,
                response_mode: "streaming",
                user: userId,
                conversation_id: dify_conversation_id || ""
            }),
        });

        if (!response.ok) throw new Error(`Gateway Error: ${response.status}`);

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body.getReader();
                let buffer = "";
                let fullText = "";
                let lastThought = ""; // 記錄上一次的思考進度，用於差值計算

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop();

                        for (const line of lines) {
                            if (!line.startsWith('data: ')) continue;
                            const dataStr = line.slice(6).trim();
                            if (dataStr === '[DONE]') continue;
                            
                            try {
                                const data = JSON.parse(dataStr);

                                // 提取 Dify 思考過程的「差值 (Delta)」
                                if (data.event === 'agent_thought' && data.thought) {
                                    const currentThought = data.thought;
                                    const delta = currentThought.startsWith(lastThought) 
                                        ? currentThought.slice(lastThought.length) 
                                        : currentThought;
                                    
                                    if (delta) {
                                        // 使用 Prefix 8 傳送給前端的 message.reasoning
                                        controller.enqueue(encoder.encode(`8:${JSON.stringify(delta)}\n`));
                                    }
                                    lastThought = currentThought;
                                }

                                // 處理正式回覆
                                // 修正重複發送：Dify 在不同模式下可能觸發 message 或 agent_message
                                // 我們統一處理，但確保同一個 chunk 不會因為事件重複而被抓取兩次
                                if ((data.event === 'message' || data.event === 'agent_message') && data.answer) {
                                    // 檢查 answer 是否不為空且與上一次不同（簡單去重）
                                    fullText += data.answer;
                                    controller.enqueue(encoder.encode(`0:${JSON.stringify(data.answer)}\n`));
                                }
                            } catch (e) {}
                        }
                    }
                    
                    // 只有當真的有收到 AI 回覆時，才附加免責聲明
                    const disclaimer = fullText ? "\n\n(此內容由 AI 獎學金助理生成，請以平台公告原文為準，並自負查證責任。)" : "";
                    if (disclaimer) {
                        controller.enqueue(encoder.encode(`0:${JSON.stringify(disclaimer)}\n`));
                    }

                    if (fullText) {
                        saveHistory(userId, sessionId, userMessage, fullText + disclaimer);
                    }

                } catch (err) {
                    controller.error(err);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'x-vercel-ai-data-stream': 'v1'
            }
        });

    } catch (error) {
        return handleApiError(error, '/api/chat');
    }
}