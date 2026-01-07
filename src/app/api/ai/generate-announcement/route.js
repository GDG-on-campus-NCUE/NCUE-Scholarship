import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemConfig } from '@/lib/config';
import { verifyUserAuth, handleApiError } from '@/lib/apiMiddleware';

// Disable body parser for file uploads if needed, but App Router handles formData well.
// We'll use request.formData()

export async function POST(request) {
  try {
    // 1. Verify Auth (Admin Only)
    const authCheck = await verifyUserAuth(request, {
      requireAuth: true,
      requireAdmin: true,
      endpoint: '/api/ai/generate-announcement'
    });
    
    if (!authCheck.success) {
      return authCheck.error;
    }

    // 2. Get Configuration
    const geminiApiKey = await getSystemConfig('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key is not configured in system settings.' }, 
        { status: 500 }
      );
    }

    // 3. Parse Request Data
    const formData = await request.formData();
    const promptText = formData.get('prompt') || '';
    const scrapedContents = formData.get('scrapedContents') || '';
    const sourceUrls = formData.get('sourceUrls') || '';
    const files = formData.getAll('files'); // Array of File objects

    // 4. Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: { responseMimeType: "application/json" },
    });

    // 5. Construct Parts
    const parts = [];

    // Combine prompt with context
    // We recreate the prompt logic here to ensure consistency and security
    // However, the frontend provided the raw inputs (scraped contents, etc.)
    // We can also move the *entire* prompt template here, which is better.
    
    // Recovering the prompt template from the previous frontend code logic
    // We expect the frontend to pass the *raw* data needed for the prompt, not the full prompt text if possible,
    // BUT to keep it simple for refactoring, we can let frontend send the 'context' and we wrap it with the Persona/Task instructions here.
    
    // Let's assume frontend sends:
    // - scrapedContents (string)
    // - sourceUrls (string)
    // - hasFiles (boolean flag or check files array) 
    
    const finalPrompt = `
# 角色 (Persona)
你是一位頂尖的「彰化師範大學獎學金公告分析專家」。你的風格是專業、精確且以學生為中心。你的任務是將一篇關於獎學金的公告，轉換成一段重點突出、視覺清晰的 HTML 公告，並提取結構化資料。你只須關注與彰師大「大學部」及「碩士班」學生相關的資訊，並嚴格遵循所有規則。

# 核心任務 (Core Task)
你的任務是根據下方提供的「公告全文」，執行以下兩項任務，並將結果合併在一個**單一的 JSON 物件**中回傳。

## 任務一：提取結構化資料 (JSON Extraction)
提取公告中的關鍵資訊，並以一個嚴格的 JSON 物件格式回傳。

### 欄位規則 (Field Rules)
- **不確定性原則**：若資訊未提及或不明確，**必須**回傳 null，**禁止**自行猜測。
- **日期格式**：所有日期欄位格式必須是 YYYY-MM-DD。
民國年 + 1911 即為西元年。
- **欄位列表**：
    1.  title (string | null): 公告的**簡短**標題，必須包含**提供單位**和**獎學金名稱**。例如：「國際崇她社『崇她獎』獎學金」。
    2.  category (string | null): 根據下方的「代碼定義」從 'A'~'E' 中選擇一個。
    3.  application_start_date (string | null): **申請開始日期**。
    4.  application_end_date (string | null): **申請結止日期**，格式必須是 'YYYY-MM-DD' 。若只提及月份，以該月最後一天為準。若為區間，以**結束日期**為準，備註: 民國年 + 1911 即為西元年。
    5.  target_audience (string | null): **目標對象**。**此欄位必須是 HTML 格式**，並遵循下方的「視覺化與樣式指導」為關鍵字上色。
    6.  application_limitations (string | null): **兼領限制**。若明確提及**不行**兼領，回傳 'N'，否則一律回傳 'Y'。
    7.  submission_method (string | null): **送件方式**。簡要說明最終的送件管道。
    8.  external_urls (array of objects | []): **所有相關網址**。將所有找到的 URL 整理成一個物件陣列，格式為 [{ "url": "https://..." }]。若無則回傳空陣列 []。
    9.  summary (string | null): **公告摘要**。**此欄位必須是 HTML 格式**，並遵循下方的「視覺化與樣式指導」為關鍵字上色。

## 任務二：生成 HTML 重點摘要 (HTML Summary Generation)
根據你分析的內容，生成一份專業、條理分明的 HTML 格式重點摘要。

### 內容與結構指導
- **摘要必須包含**：申請期限、申請資格、獎助金額、應繳文件、其他注意事項。
- **表格優先**：當資訊具有「項目-內容」的對應關係資訊時，**優先使用 <table>** 以提升閱讀性。

### 視覺化與樣式指導 (適用於 summary 和 target_audience)
- **多色彩重點標記**：
    - **金額、日期、名額等數字類關鍵字**: <span style="color: #D6334C; font-weight: bold;">
    - **身份、成績等申請條件**: <span style="color: #F79420; font-weight: bold;">
    - **所有小標題**: <h4 style="color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;">
- summary 的內容必須放在 JSON 物件的 summary (string) 鍵中。

# 獎助學金代碼定義 (Category Definitions)
- **A**: 各縣市政府獎助學金
- **B**: 縣市政府以外之各級公家機關及公營單位獎助學金
- **C**: 宗親會及民間各項指定身分獎助學金 (指定姓名、籍貫、學系等)
- **D**: 非公家機關或其他無法歸類的獎助學金
- **E**: 獎學金得獎名單公告

# 最終輸出規則
- **你的回覆必須是、也只能是一個 JSON 物件**，不含任何 Markdown 標記。
- 請嚴格模仿下方範例的 JSON 結構和 HTML 風格。

# 輸出 json 格式與範例 (Output Format & Example)
{
  "title": "國際蘭馨交流協會『讓夢想起飛』獎學金",
  "category": "C",
  "application_start_date": null,
  "application_end_date": "2025-07-23",
  "target_audience": "<ul><li>國內各大學日間部、進修學士班之<span style=\"color: #F79420; font-weight: bold;\">在學女學生</span>。</li><li>歷年學業平均成績達 <span style=\"color: #F79420; font-weight: bold;\">70分</span>。</li></ul>",
  "application_limitations": "N",
  "submission_method": "送件至生輔組或將申請資料寄送至承辦人員信箱: act5718@gmail.com",
  "external_urls": [{ "url": "https://example.com/scholarship-info" }],
  "summary": "<h4 style=\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\">申請期限與方式</h4><p>親送或寄送郵件至生輔組承辦人員，由學校代為辦理，截止日期為 <span style=\"color: #D6334C; font-weight: bold;\">2025年7月23日</span>。</p><h4 style=\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\">申請資格</h4><ul><li>家境清寒且就讀<span style=\"color: #F79420; font-weight: bold;\">國立大學</span>之<span style=\"color: #F79420; font-weight: bold;\">績優女學生</span>（不限年級）。</li><li>在校學業平均成績達 <span style=\"color: #F79420; font-weight: bold;\">70分</span> 以上，且未受小過以上處分。</li></ul><h4 style=\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\">獎助金額</h4><p>依申請年級不同，提供相對應的學費補助，詳情如下：</p><table style=\"width: 100%; border-collapse: collapse; margin-top: 0.5em;\"><thead><tr style=\"background-color: #f2f2f2;\"><th style=\"padding: 8px; border: 1px solid #ddd; text-align: left;\">適用對象</th><th style=\"padding: 8px; border: 1px solid #ddd; text-align: left;\">補助內容</th></tr></thead><tbody><tr><td style=\"padding: 8px; border: 1px solid #ddd;\">大一新生及大三學生</td><td style=\"padding: 8px; border: 1px solid #ddd;\">通過審查後，補助<span style=\"color: #D6334C; font-weight: bold;\">兩年</span>學雜費</td></tr><tr><td style=\"padding: 8px; border: 1px solid #ddd;\">大二女學生</td><td style=\"padding: 8px; border: 1px solid #ddd;\">通過審查後，補助<span style=\"color: #D6334C; font-weight: bold;\">一年</span>學雜費</td></tr></tbody></table><p style=\"margin-top: 0.5em;\">註：已受補助學生可持續獲得補助至其大四學年，但須符合每階段資格審查標準。</p><h4 style=\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\">申請應繳文件</h4><table style=\"width: 100%; border-collapse: collapse; margin-top: 0.5em;\"><thead><tr style=\"background-color: #f2f2f2;\"><th style=\"padding: 8px; border: 1px solid #ddd; text-align: left;\">文件項目</th><th style=\"padding: 8px; border: 1px solid #ddd; text-align: left;\">備註</th></tr></thead><tbody><tr><td style=\"padding: 8px; border: 1px solid #ddd;\">1. 全... [truncated]
}

# 公告全文 (Source Text)
---
請分析以下資訊：

${scrapedContents}
${sourceUrls}
${files && files.length > 0 ? '\n# 檔案資料來源\n' : ''}
`;

    parts.push({ text: finalPrompt });

    // Process Files
    if (files && files.length > 0) {
      for (const file of files) {
        // Convert Blob/File to base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString('base64');
        
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        });
      }
    }

    // 6. Generate Content
    const result = await model.generateContent({ contents: [{ parts }] });
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ success: true, text });

  } catch (error) {
    console.error('AI Generation Error:', error);
    return handleApiError(error, '/api/ai/generate-announcement');
  }
}
