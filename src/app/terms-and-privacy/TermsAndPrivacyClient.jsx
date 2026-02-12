"use client";

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 動畫設定 ---
const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.05,
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    }
};

// 目錄元件
const TableOfContents = ({ sections, activeId, onLinkClick }) => {
    const isSectionActive = (section) => {
        if (!activeId) return false;
        const sectionPrefix = section.id.split('_')[0];
        return activeId.startsWith(sectionPrefix);
    };

    return (
        <nav className="sticky top-24 hidden lg:block">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">條款目錄</h3>
            <ul className="space-y-4">
                {sections.map(section => (
                    <li key={section.id}>
                        <a
                            href={`#${section.id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                const targetId = section.articles.length > 0 ? section.articles[0].id : section.id;
                                onLinkClick(targetId);
                            }}
                            className={`flex items-center text-sm transition-colors duration-200 ${isSectionActive(section)
                                ? 'font-bold text-slate-700'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {section.title}
                        </a>
                        {section.articles.length > 0 && (
                            <ul className="mt-3 space-y-1 pl-2 border-l border-slate-200">
                                {section.articles.map(article => (
                                    <li key={article.id} className="relative">
                                        <a
                                            href={`#${article.id}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onLinkClick(article.id);
                                            }}
                                            className={`block py-1.5 pl-4 pr-2 text-sm transition-colors duration-200 relative ${activeId === article.id
                                                ? 'font-semibold text-violet-500'
                                                : 'text-slate-500 hover:text-violet-500'
                                                }`}
                                        >
                                            {article.title}
                                        </a>
                                        <AnimatePresence>
                                            {activeId === article.id && (
                                                <motion.div
                                                    layoutId="active-toc-indicator"
                                                    className="absolute left-[-1px] top-0 bottom-0 w-0.5 bg-violet-400 rounded-full"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
};

// 帶有滾動高亮功能的內容區塊
const ContentSection = ({ id, activeId, title, titleAs: TitleComponent = 'h3', children }) => {
    const isActive = activeId === id;

    return (
        <motion.section
            variants={itemVariants}
            id={id}
            className={`scroll-mt-24 -mx-6 p-6 rounded-2xl transition-all duration-300 ease-in-out border-l-4 ${isActive
                ? 'bg-violet-50/70 border-violet-300'
                : 'border-transparent'
                }`}
        >
            {title && (
                <TitleComponent className={`text-xl sm:text-2xl font-bold transition-colors duration-300 ${isActive ? 'text-violet-700' : 'text-slate-800'}`}>
                    {title}
                </TitleComponent>
            )}
            <article className="prose prose-slate max-w-none mt-4 prose-p:leading-relaxed prose-a:text-violet-500 hover:prose-a:underline">
                {children}
            </article>
        </motion.section>
    );
};


// --- 主頁面元件---
export default function TermsAndPrivacyPage() {
    const [activeId, setActiveId] = useState('tos_1');
    const isClickScrolling = useRef(false);
    const scrollTimeout = useRef(null);
    const observerRef = useRef(null);

    const sections = [
        {
            id: 'tos', title: '第一部分：服務條款', articles: [
                { id: 'tos_1', title: '第一條、認知與接受條款' }, { id: 'tos_2', title: '第二條、服務說明' },
                { id: 'tos_3', title: '第三條、使用者註冊與帳戶安全' }, { id: 'tos_4', title: '第四條、使用者行為與義務' },
                { id: 'tos_5', title: '第五條、智慧財產權' }, { id: 'tos_6', title: '第六條、服務之中斷或變更' },
                { id: 'tos_7', title: '第七條、責任限制與免責聲明' },
            ]
        },
        {
            id: 'privacy', title: '第二部分：隱私權政策', articles: [
                { id: 'privacy_8', title: '第八條、個人資料之蒐集目的與類別' }, { id: 'privacy_9', title: '第九條、個人資料處理與利用' },
                { id: 'privacy_10', title: '第十條、當事人權利行使' }, { id: 'privacy_11', title: '第十一條、資料安全維護' },
                { id: 'privacy_12', title: '第十二條、Cookie 技術之使用' }, { id: 'privacy_13', title: '第十三條、隱私權政策之修訂' },
            ]
        },
        {
            id: 'general', title: '第三部分：一般條款', articles: [
                { id: 'general_14', title: '第十四條、準據法與管轄法院' }, { id: 'general_15', title: '第十五條、聯絡資訊' },
            ]
        },
    ];

    const handleLinkClick = (id) => {
        isClickScrolling.current = true;
        setActiveId(id);

        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `#${id}`);

        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

        scrollTimeout.current = setTimeout(() => {
            isClickScrolling.current = false;
        }, 1000);
    };

    useEffect(() => {
        const handleManualScroll = () => {
            if (isClickScrolling.current) {
                isClickScrolling.current = false;
                if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
            }
        };

        window.addEventListener('wheel', handleManualScroll, { passive: true });
        window.addEventListener('touchmove', handleManualScroll, { passive: true });

        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (isClickScrolling.current) return;

                const intersectingEntries = entries.filter(entry => entry.isIntersecting);

                if (intersectingEntries.length > 0) {
                    const topEntry = intersectingEntries.sort(
                        (a, b) => Math.abs(a.boundingClientRect.top - window.innerHeight / 2) - Math.abs(b.boundingClientRect.top - window.innerHeight / 2)
                    )[0];
                    setActiveId(topEntry.target.id);
                }
            },
            {
                rootMargin: `-40% 0px -40% 0px`,
            }
        );

        const allArticleElements = sections.flatMap(s => s.articles.map(a => document.getElementById(a.id))).filter(Boolean);
        allArticleElements.forEach(el => {
            if (el) observerRef.current.observe(el);
        });

        return () => {
            window.removeEventListener('wheel', handleManualScroll);
            window.removeEventListener('touchmove', handleManualScroll);
            if (observerRef.current) observerRef.current.disconnect();
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sections]);

    return (
        <div className="bg-slate-50 text-slate-700 select-none">
            <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row justify-center gap-x-16">
                    <div className="w-full lg:w-64 lg:flex-shrink-0 mb-12 lg:mb-0">
                        <TableOfContents sections={sections} activeId={activeId} onLinkClick={handleLinkClick} />
                    </div>
                    <main className="w-full max-w-4xl min-w-0">
                        <motion.div
                            className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.h1 variants={itemVariants} className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                                生輔組 校外獎學金平台 服務條款暨隱私權政策
                            </motion.h1>

                            <motion.p variants={itemVariants} className="mt-8 text-sm text-slate-500">
                                <strong>最後更新日期：2026年1月8日</strong>
                            </motion.p>
                            
                            <motion.div variants={itemVariants} className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
                                <p>
                                    歡迎您使用由 <strong>國立彰化師範大學學生事務處生活輔導組</strong>（以下簡稱「本組」）委託，並由 <strong>陳泰銘</strong> 代表 <strong>Google Developer Group On Campus NCUE</strong>（以下簡稱「開發團隊」）所開發與維護之「校外獎學金平台」（以下簡稱「本平台」）。
                                </p>
                                <p>
                                    本平台致力於運用先進資訊技術，協助學生更便捷地獲取獎學金資訊。為保障您的權益，請於註冊及使用本平台服務前，詳細閱讀以下條款。當您完成註冊程序或開始使用本平台服務時，即視為您已<strong>閱讀、理解並完全同意</strong>接受本服務條款暨隱私權政策（以下合稱「本條款」）之所有內容。
                                </p>
                            </motion.div>
                            
                            <hr className="my-10 border-slate-200" />

                            <motion.h2 variants={itemVariants} className="text-2xl sm:text-3xl font-bold border-b border-slate-200 pb-4 mt-12 mb-2 text-slate-900">第一部分：服務條款</motion.h2>

                            <ContentSection id="tos_1" activeId={activeId} title="第一條、認知與接受條款">
                                <ol className="list-decimal pl-5 space-y-3">
                                    <li><strong>條款效力</strong>：本條款構成您與本組及開發團隊之間關於使用本平台之完整合意。</li>
                                    <li><strong>條款修訂</strong>：因應法令變更或服務調整，我們保留隨時修改本條款之權利。所有修改將於本平台公告後即刻生效，不另行個別通知。若您於條款修改後繼續使用本服務，即視為您已接受該等修改。</li>
                                    <li><strong>未成年人使用</strong>：若您為未滿十八歲之未成年人，應請您的法定代理人（如父母或監護人）詳閱、理解並同意本條款之所有內容後，方得註冊及使用本平台。當您使用本服務時，即推定您的法定代理人已同意您接受本條款之拘束。</li>
                                </ol>
                            </ContentSection>

                            <ContentSection id="tos_2" activeId={activeId} title="第二條、服務說明">
                                <ol className="list-decimal pl-5 space-y-3">
                                    <li><strong>服務內容</strong>：本平台提供整合式獎學金資訊服務，功能包含但不限於：
                                        <ul className="list-disc pl-5 space-y-2 mt-2">
                                            <li>校外獎學金公告之彙整、分類與展示。</li>
                                            <li>運用人工智慧（AI）技術，針對獎學金辦法（如 PDF 文件、網頁連結）進行自動化分析，生成重點摘要及提取關鍵欄位（如申請資格、金額、期限）。</li>
                                            <li>提供 AI 智能問答機器人，協助使用者快速查詢獎學金相關資訊。</li>
                                        </ul>
                                    </li>
                                    <li className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-amber-900 mt-4">
                                        <strong>【重要聲明：AI 生成內容免責】</strong>
                                        <p className='mt-2 text-sm leading-relaxed'>
                                            您明確了解並同意，本平台所使用之 AI 模型（包括但不限於 Google Gemini 系列）所生成之任何摘要、結構化資料及對話回應，僅供輔助參考，<strong>不保證其絕對正確性、完整性或即時性</strong>。
                                            <br/><br/>
                                            <strong>所有獎學金之申請資格、期限、金額及應備文件，均應以獎學金提供單位之原始公告為準。</strong>本組及開發團隊不對因信賴 AI 生成內容而產生之任何直接或間接損害（包括但不限於申請逾期、資格不符等）承擔法律責任。
                                        </p>
                                    </li>
                                </ol>
                            </ContentSection>

                            <ContentSection id="tos_3" activeId={activeId} title="第三條、使用者註冊與帳戶安全">
                                <ol className="list-decimal pl-5 space-y-3">
                                    <li><strong>真實資料義務</strong>：您同意於註冊時提供正確、最新且完整之個人資料。若發現有不實登錄，本組有權暫停或終止您的帳號，並拒絕您使用本服務之部分或全部。</li>
                                    <li><strong>帳號保管責任</strong>：您有義務妥善保管您的帳號及密碼，並定期更新密碼。任何使用該帳號及密碼登入本平台後之行為，均視為該帳號持有者之行為。</li>
                                    <li><strong>安全通報</strong>：若您發現您的帳號遭到盜用或有其他任何安全問題發生時，應立即通知本平台管理員。</li>
                                </ol>
                            </ContentSection>

                            <ContentSection id="tos_4" activeId={activeId} title="第四條、使用者行為與義務">
                                <p>您承諾遵守中華民國相關法規及網際網路國際慣例，絕不為任何非法目的或以任何非法方式使用本服務。您同意並保證不得利用本平台從事下列行為：</p>
                                <ol className="list-decimal pl-5 space-y-3 mt-4">
                                    <li>侵害他人名譽、隱私權、營業秘密、商標權、著作權、專利權、其他智慧財產權及其他權利。</li>
                                    <li>上傳、張貼、傳輸或散布任何含有電腦病毒、木馬程式、惡意程式碼之資料，或從事任何可能干擾、破壞或限制本平台軟硬體功能之行為。</li>
                                    <li>利用自動化程式（如 Spider、Robot、Crawler 等）大量讀取、擷取本平台資料，致生伺服器負擔。</li>
                                    <li>冒用他人名義使用本服務。</li>
                                </ol>
                            </ContentSection>

                            <ContentSection id="tos_5" activeId={activeId} title="第五條、智慧財產權">
                                <ol className="list-decimal pl-5 space-y-3">
                                    <li><strong>平台內容</strong>：本平台呈現之所有內容（包括但不限於程式碼、介面設計、文字敘述、圖片、資料庫結構），除原始獎學金公告內容屬原權利人所有外，均由本組或開發團隊依法擁有智慧財產權。非經事前書面同意，不得任意重製、散布、改作或進行還原工程。</li>
                                    <li><strong>授權利用</strong>：管理員上傳之獎學金相關檔案與資訊，視為授權本平台於服務目的範圍內進行必要之重製、編輯、轉換（如 AI 分析）與公開傳輸。</li>
                                </ol>
                            </ContentSection>

                            <ContentSection id="tos_6" activeId={activeId} title="第六條、服務之中斷或變更">
                                <p>本組將維持本平台之正常運作，但於下列情形發生時，有權暫停或中斷本服務之全部或一部，且對使用者任何直接或間接之損害，<strong>不負賠償責任</strong>：</p>
                                <ul className="list-disc pl-5 space-y-2 mt-4">
                                    <li>對本服務相關軟硬體設備進行搬遷、更換、升級、保養或維修時。</li>
                                    <li>使用者有任何違反政府法令或本使用條款情形。</li>
                                    <li>天災或其他不可抗力之因素所致之服務停止或中斷。</li>
                                    <li>非本組或開發團隊所得控制之事由而致本服務資訊顯示不正確、或遭偽造、竄改、刪除或擷取、或致系統中斷或不能正常運作時。</li>
                                </ul>
                            </ContentSection>

                            <ContentSection id="tos_7" activeId={activeId} title="第七條、責任限制與免責聲明">
                                <ol className="list-decimal pl-5 space-y-3">
                                    <li><strong>非保證條款</strong>：本平台係依「現況」及「現有」之基礎提供，本組及開發團隊不保證服務內容將完全符合您的需求，亦不保證服務之及時性、安全性、準確性或不會中斷。</li>
                                    <li><strong>第三方連結</strong>：本平台可能包含連結構至其他網站。該等網站均由各該業者自行經營，不屬本組或開發團隊控制及負責範圍之內。</li>
                                </ol>
                            </ContentSection>

                            <hr className="my-10 border-slate-200" />

                            <motion.h2 variants={itemVariants} className="text-2xl sm:text-3xl font-bold border-b border-slate-200 pb-4 mt-12 mb-2 text-slate-900">第二部分：隱私權政策</motion.h2>

                            <ContentSection id="privacy_8" activeId={activeId} title="第八條、個人資料之蒐集目的與類別">
                                <p>為提供使用者個人化服務與帳戶管理，我們將依據《個人資料保護法》蒐集、處理及利用您的個人資料：</p>
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <h4 className="font-bold text-slate-800 mb-2">1. 蒐集目的</h4>
                                        <p>會員管理、身分確認、提供獎學金資訊服務、客戶服務、系統運作維護、AI 模型優化與統計分析。</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 mb-2">2. 蒐集類別</h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li><strong>C001 辨識個人者</strong>：姓名（使用者名稱）、電子郵件地址。</li>
                                            <li><strong>C002 辨識財務者</strong>：登入密碼（系統僅儲存經雜湊處理之加密碼，無法還原為明碼）。</li>
                                            <li><strong>系統紀錄</strong>：包含 IP 位址、Cookie、使用時間、瀏覽及點選紀錄、AI 對話紀錄等。</li>
                                        </ul>
                                    </div>
                                </div>
                            </ContentSection>

                            <ContentSection id="privacy_9" activeId={activeId} title="第九條、個人資料處理與利用">
                                <ol className="list-decimal pl-5 space-y-3">
                                    <li><strong>利用期間</strong>：自您註冊帳號之日起，至您要求刪除帳號、或本平台終止服務之日止。</li>
                                    <li><strong>利用地區</strong>：中華民國領域內、及本平台使用之雲端服務供應商所在地。</li>
                                    <li><strong>利用對象</strong>：僅限於本組、開發團隊及受委託處理事務之廠商（如雲端主機服務商）。</li>
                                    <li><strong>AI 資料處理</strong>：為提供 AI 輔助功能，系統可能會將<strong>已去識別化</strong>或<strong>非個人機敏</strong>之獎學金公告文本傳送至第三方 AI 服務提供商（如 Google）進行運算，但我們不會將您的個人註冊資料（如 Email、密碼）傳送給 AI 模型進行訓練。</li>
                                    <li><strong>不予揭露</strong>：除法律另有規定或配合司法單位調查外，我們絕不會將您的個人資料出售、交換或出租給任何無關之第三人。</li>
                                </ol>
                            </ContentSection>

                            <ContentSection id="privacy_10" activeId={activeId} title="第十條、當事人權利行使">
                                <p>依據《個人資料保護法》第三條，您就本平台保有之個人資料得行使下列權利：</p>
                                <ul className="list-disc pl-5 space-y-2 mt-4">
                                    <li>查詢或請求閱覽。</li>
                                    <li>請求製給複製本。</li>
                                    <li>請求補充或更正。</li>
                                    <li>請求停止蒐集、處理或利用。</li>
                                    <li>請求刪除。</li>
                                </ul>
                                <p className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    如欲行使上述權利，請透過電子郵件 <a href="mailto:gdg-core@ncuesa.org.tw" className="text-violet-600 hover:underline">gdg-core@ncuesa.org.tw</a> 聯繫開發團隊，我們將依法儘速處理。
                                </p>
                            </ContentSection>

                            <ContentSection id="privacy_11" activeId={activeId} title="第十一條、資料安全維護">
                                <p>我們採用符合業界標準之資訊安全技術與措施來保護您的個人資料：</p>
                                <ul className="list-disc pl-5 space-y-2 mt-4">
                                    <li><strong>密碼保護</strong>：使用者密碼均經過單向雜湊（Hash）加密處理，管理員與開發者均無法得知您的原始密碼。</li>
                                    <li><strong>傳輸加密</strong>：本平台全程採用 TLS/SSL 安全加密連線，確保資料在傳輸過程中不被竊取。</li>
                                    <li><strong>存取控制</strong>：僅有必要之工作人員得於權限範圍內存取相關資料。</li>
                                </ul>
                            </ContentSection>

                            <ContentSection id="privacy_12" activeId={activeId} title="第十二條、Cookie 技術之使用">
                                <p>為提供更佳的使用者體驗及分析流量，本平台會使用 Cookie 技術。Cookie 是伺服器端為了區別使用者的不同喜好，經由瀏覽器寫入使用者硬碟的一些簡短資訊。</p>
                                <p className="mt-2">您可以在瀏覽器設定中選擇修改對 Cookie 的接受程度，但若您選擇拒絕所有 Cookie，可能會導致無法使用本平台之部分功能（如維持登入狀態）。</p>
                            </ContentSection>

                            <ContentSection id="privacy_13" activeId={activeId} title="第十三條、隱私權政策之修訂">
                                <p>本隱私權政策將因應需求或法令變更隨時進行修正，修正後之條款將刊登於本網站，並於公告後立即生效。建議您定期閱讀本政策以掌握最新資訊。</p>
                            </ContentSection>

                            <hr className="my-10 border-slate-200" />

                            <motion.h2 variants={itemVariants} className="text-2xl sm:text-3xl font-bold border-b border-slate-200 pb-4 mt-12 mb-2 text-slate-900">第三部分：一般條款</motion.h2>

                            <ContentSection id="general_14" activeId={activeId} title="第十四條、準據法與管轄法院">
                                <p>本條款之解釋與適用，以及與本條款有關的爭議，均應依照<strong>中華民國法律</strong>予以處理。若產生任何訴訟，雙方同意以<strong>臺灣彰化地方法院</strong>為第一審管轄法院。</p>
                            </ContentSection>

                            <ContentSection id="general_15" activeId={activeId} title="第十五條、聯絡資訊">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                        <h4 className="font-bold text-slate-900 mb-2">獎學金業務諮詢</h4>
                                        <p className="text-sm text-slate-600 mb-3">若您對獎學金申請資格、期限或內容有疑問，請聯繫生輔組：</p>
                                        <a href="mailto:act5718@gmail.com" className="flex items-center text-violet-600 hover:underline">
                                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            act5718@gmail.com
                                        </a>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                        <h4 className="font-bold text-slate-900 mb-2">平台技術與隱私權</h4>
                                        <p className="text-sm text-slate-600 mb-3">若您對平台操作、帳號問題或隱私權政策有疑問，請聯繫開發團隊：</p>
                                        <a href="mailto:gdg-core@ncuesa.org.tw" className="flex items-center text-violet-600 hover:underline">
                                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                            </svg>
                                            gdg-core@ncuesa.org.tw
                                        </a>
                                    </div>
                                </div>
                            </ContentSection>

                            <motion.div variants={itemVariants} className="border-t border-slate-200 mt-12 pt-6">
                                <p className="text-right text-slate-400 text-sm">
                                    Developed by <strong>Tai Ming Chen</strong> & <strong>Grason Yang</strong>
                                    <br />
                                    <span className="text-xs">Google Developer Group On Campus NCUE</span>
                                </p>
                            </motion.div>
                        </motion.div>
                    </main>
                </div>
            </div>

            <footer className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20 max-w-4xl mx-auto lg:pl-80">
                        <p className="text-sm text-slate-500">最新修訂：2026年1月8日</p>
                        <a
                            href="/"
                            className="inline-flex items-center gap-2 rounded-md bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 transition-colors"
                        >
                            回到首頁
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
