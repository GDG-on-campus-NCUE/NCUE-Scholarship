import { NextResponse } from 'next/server';
import { load } from 'cheerio';

export async function POST(request) {
    try {
        const { url } = await request.json();

        if (!url || !/^https?:\/\//i.test(url)) {
            return NextResponse.json({ error: '請提供一個有效的 URL。' }, { status: 400 });
        }

        // 使用 fetch 抓取網頁 HTML
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            },
            redirect: 'follow', // 遵循重新導向
        });

        if (!response.ok) {
            throw new Error(`無法抓取網站，狀態碼: ${response.status}`);
        }

        const html = await response.text();

        // 使用 Cheerio 載入 HTML
        const $ = load(html);

        // 移除不需要的標籤
        $('script, style, noscript, iframe, header, footer, nav, aside').remove();

        // 提取純文字並進行清理
        let text = $('body').text();

        // 移除多餘的空白和換行符
        text = text.replace(/(\s*[\r\n]\s*)+/g, "\n"); // 將多個換行符和周圍的空白合併為一個換行符
        text = text.replace(/[ \t]+/g, ' ');         // 將多個空格或 tab 合併為一個空格
        text = text.trim();

        if (!text) {
            return NextResponse.json({ scrapedText: null, message: "無法從此網址提取有效文字內容。" });
        }

        return NextResponse.json({ scrapedText: text });

    } catch (error) {
        console.error('Scraping Error:', error);
        return NextResponse.json({ error: error.message || '伺服器端爬取失敗' }, { status: 500 });
    }
}