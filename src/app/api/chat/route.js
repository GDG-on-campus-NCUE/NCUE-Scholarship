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
    // 💡 診斷日誌：列出所有 Header
    const headersObj = {};
    request.headers.forEach((value, key) => { headersObj[key] = key === 'authorization' ? 'PRESENT (HIDDEN)' : value; });
    console.log('[Chat API] Incoming Headers:', headersObj);

    try {
        const rateLimitCheck = checkRateLimit(request, 'chat', 30, 60000);
        if (!rateLimitCheck.success) return rateLimitCheck.error;

        const authCheck = await verifyUserAuth(request, { requireAuth: true });
        if (!authCheck.success) {
            console.error('[Chat API] Auth Check Failed:', authCheck.error);
            return authCheck.error;
        }

        const body = await request.json();
        const { messages, sessionId: providedSessionId, dify_conversation_id } = body;
        
        const lastMessage = messages?.[messages.length - 1];
        const userMessage = lastMessage?.parts?.find(p => p.type === 'text')?.text || lastMessage?.content || body.text || '';

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

                                // 💡 確保 agent_thought 被捕獲
                                if (data.event === 'agent_thought' && data.thought) {
                                    controller.enqueue(encoder.encode(`8:${JSON.stringify(data.thought)}\n`));
                                }

                                if ((data.event === 'message' || data.event === 'agent_message') && data.answer) {
                                    fullText += data.answer;
                                    controller.enqueue(encoder.encode(`0:${JSON.stringify(data.answer)}\n`));
                                }
                            } catch (e) {}
                        }
                    }
                    
                    const disclaimer = "\n\n(此內容由 AI 助手生成，請以平台公告原文為準。)";
                    controller.enqueue(encoder.encode(`0:${JSON.stringify(disclaimer)}\n`));

                    saveHistory(userId, sessionId, userMessage, fullText + disclaimer);

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
