'use client';

import React from 'react';
import { ArrowRight, FileText, BookOpen, ClipboardCopy } from 'lucide-react';

// --- 全新的通用卡片元件 ---
const Card = ({
    type = 'link', // 'link' or 'copy'
    href,
    copyText,
    icon: Icon,
    title,
    children,
    color = 'indigo' // 'indigo', 'rose', 'teal'
}) => {
    const [isCopied, setIsCopied] = React.useState(false);

    // --- 顏色主題設定 ---
    const colorMap = {
        indigo: {
            gradientStart: 'bg-[radial-gradient(circle_at_center,_rgba(165,180,252,0.4),_transparent_60%)]',
            gradientEnd: 'bg-[radial-gradient(circle_at_center,_rgba(251,146,180,0.4),_transparent_60%)]',
            iconBg: 'bg-indigo-100',
            iconText: 'text-indigo-600',
            linkText: 'text-indigo-600',
        },
        rose: {
            gradientStart: 'bg-[radial-gradient(circle_at_center,_rgba(251,113,133,0.4),_transparent_60%)]',
            gradientEnd: 'bg-[radial-gradient(circle_at_center,_rgba(252,211,77,0.4),_transparent_60%)]',
            iconBg: 'bg-rose-100',
            iconText: 'text-rose-600',
            linkText: 'text-rose-600',
        },
        teal: {
            gradientStart: 'bg-[radial-gradient(circle_at_center,_rgba(134,239,172,0.4),_transparent_60%)]',
            gradientEnd: 'bg-[radial-gradient(circle_at_center,_rgba(110,231,183,0.4),_transparent_60%)]',
            iconBg: 'bg-teal-100',
            iconText: 'text-teal-600',
            buttonBg: 'bg-teal-600',
            buttonHoverBg: 'hover:bg-teal-700',
        }
    };

    const theme = colorMap[color] || colorMap.indigo;

    const handleCopy = (e) => {
        e.preventDefault();
        const textArea = document.createElement("textarea");
        textArea.value = copyText;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('無法複製內容: ', err);
        }
        document.body.removeChild(textArea);
    };

    const CardContent = () => (
        <div className="relative h-full overflow-hidden rounded-xl border border-gray-200/80 bg-white p-6 shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1.5">
            <div className={`absolute -top-24 -left-24 h-72 w-72 rounded-full ${theme.gradientStart} opacity-0 transition-all duration-700 ease-in-out group-hover:top-[-4rem] group-hover:left-[-4rem] group-hover:opacity-100 blur-2xl`}></div>
            <div className={`absolute -bottom-24 -right-24 h-72 w-72 rounded-full ${theme.gradientEnd} opacity-0 transition-all duration-700 ease-in-out group-hover:bottom-[-4rem] group-hover:right-[-4rem] group-hover:opacity-100 blur-2xl`}></div>

            <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-center gap-4">
                    <div className={`flex-shrink-0 rounded-lg p-3 ${theme.iconBg}`}>
                        <Icon className={`h-6 w-6 ${theme.iconText}`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                </div>

                <div className="mt-4 flex-grow text-sm text-gray-500">{children}</div>

                {type === 'link' && (
                    <div className={`mt-6 flex items-center justify-end text-sm font-semibold ${theme.linkText}`}>
                        <span>前往連結</span>
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
                    </div>
                )}

                {type === 'copy' && (
                    <div className="mt-6 flex items-center justify-end">
                        <button
                            onClick={handleCopy}
                            className={`flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-200 ${isCopied
                                ? 'bg-green-500 text-white'
                                : `${theme.buttonBg} text-white ${theme.buttonHoverBg}`
                            }`}
                        >
                            <ClipboardCopy className={`h-4 w-4 mr-2`} />
                            {isCopied ? '已複製！' : '複製模板'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return type === 'link' ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="group block">
            <CardContent />
        </a>
    ) : (
        <div className="group block">
            <CardContent />
        </div>
    );
};


export default function ImportantLinksPage() {
    const emailTemplate = `<p>親愛的 xxx[請自行修改] 同學，您好：</p>
<p>為了 <strong><span style="color: #3598db;">平台身分識別</span></strong> 及 <strong><span style="color: #3598db;">訊息推播用途</span></strong><span style="color: #000000;">，請透過 <span style="color: #843fa1;"><a style="color: #843fa1;" href="profile" target="_blank" rel="noopener">連結</a></span>&nbsp;進入平台，將帳號改為 <strong>真實姓名</strong> 及 <strong>真實學號 </strong>方可繼續使用此平台，否則該帳號將於 <span style="color: #e03e2d;"><strong>2025/08/24 00:00:00[請自行修改，設為一週後]</strong></span> 進入封禁狀態，並不再允許註冊。</span></p>
<p><span style="color: #000000;">請放心，您的個資接存放於後端加密資料庫，外界無法存取，詳見 <a href="terms-and-privacy" target="_blank" rel="noopener"><span style="color: #843fa1;">服務條款</span></a>&nbsp;或 <span style="color: #843fa1;"><a style="color: #843fa1;" href="https://docs.google.com/document/d/1ZI_vUtdQ2ushBS0C9viS1yZWzSkFEgvZ79NEJCmvptU/edit?usp=sharing">使用說明</a></span> 。</span></p>
<hr>
<p>若有任何疑問，歡迎隨時<span style="color: #843fa1;"><a style="color: #843fa1;" href="mailto:3526ming@gmail.com" target="_blank" rel="noopener">與我聯繫</a></span></p>
<p>生輔組獎學金資訊系統開發 &amp; 維護者</p>
<p>陳泰銘 敬上</p>`;

    const cards = [
        {
            type: 'link',
            href: "https://docs.google.com/spreadsheets/d/1XMRRNO1e_fSk-LU84K68EGiOAidaRDVp8yBlmL0G_D8/edit?resourcekey=&gid=204496218#gid=204496218",
            icon: FileText,
            title: "校外獎助學金送件紀錄 資料表",
            color: 'indigo',
            children: "承辦人員、工讀生可透過此連結進入<strong>已連結回應表單之 Google Sheet</strong>。"
        },
        {
            type: 'link',
            href: "https://docs.google.com/document/d/1ZI_vUtdQ2ushBS0C9viS1yZWzSkFEgvZ79NEJCmvptU/edit?usp=sharing",
            icon: BookOpen,
            title: "平台使用說明",
            color: 'rose',
            children: "關於本平台的相關注意事項，內容包含<strong>開發人員</strong>、<strong>管理員</strong>、<strong>一般使用者</strong> 三種身分的使用說明。"
        },
        {
            type: 'copy',
            icon: ClipboardCopy,
            title: "請求提供正確個資信件模板",
            copyText: emailTemplate,
            color: 'teal',
            children: "請到使用者管理>寄送郵件>進入Tiny MCE 編輯框>點選工具>點選原始程式碼，貼上並編輯，即可寄出。"
        }
    ];

    return (
        <div className="min-h-[40vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-6xl">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card, index) => (
                        <Card key={index} {...card}>
                            <div dangerouslySetInnerHTML={{ __html: card.children }} />
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
