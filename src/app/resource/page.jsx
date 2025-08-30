"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { School, Globe, ChevronDown, HelpCircle, BookOpen } from 'lucide-react';

// --- 子元件區塊 ---

// LINE 圖示 SVG 元件
const LineIcon = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 50 50"
        className={className}
        fill="currentColor"
    >
        <path d="M12.5,42h23c3.59,0,6.5-2.91,6.5-6.5v-23C42,8.91,39.09,6,35.5,6h-23C8.91,6,6,8.91,6,12.5v23C6,39.09,8.91,42,12.5,42z" style={{ fill: '#00c300' }}></path>
        <path d="M37.113,22.417c0-5.865-5.88-10.637-13.107-10.637s-13.108,4.772-13.108,10.637c0,5.258,4.663,9.662,10.962,10.495c0.427,0.092,1.008,0.282,1.155,0.646c0.132,0.331,0.086,0.85,0.042,1.185c0,0-0.153,0.925-0.187,1.122c-0.057,0.331-0.263,1.296,1.135,0.707c1.399-0.589,7.548-4.445,10.298-7.611h-0.001C36.203,26.879,37.113,24.764,37.113,22.417z M18.875,25.907h-2.604c-0.379,0-0.687-0.308-0.687-0.688V20.01c0-0.379,0.308-0.687,0.687-0.687c0.379,0,0.687,0.308,0.687,0.687v4.521h1.917c0.379,0,0.687,0.308,0.687,0.687C19.562,25.598,19.254,25.907,18.875,25.907z M21.568,25.219c0,0.379-0.308,0.688-0.687,0.688s-0.687-0.308-0.687-0.688V20.01c0-0.379,0.308-0.687,0.687-0.687s0.687,0.308,0.687,0.687V25.219z M27.838,25.219c0,0.297-0.188,0.559-0.47,0.652c-0.071,0.024-0.145,0.036-0.218,0.036c-0.215,0-0.42-0.103-0.549-0.275l-2.669-3.635v3.222c0,0.379-0.308,0.688-0.688,0.688c-0.379,0-0.688-0.308-0.688-0.688V20.01c0-0.296,0.189-0.558,0.47-0.652c0.071-0.024,0.144-0.035,0.218-0.035c0.214,0,0.42,0.103,0.549,0.275l2.67,3.635V20.01c0-0.379,0.309-0.687,0.688-0.687c0.379,0,0.687,0.308,0.687,0.687V25.219z M32.052,21.927c0.379,0,0.688,0.308,0.688,0.688c0,0.379-0.308,0.687-0.688,0.687h-1.917v1.23h1.917c0.379,0,0.688,0.308,0.688,0.687c0,0.379-0.309,0.688-0.688,0.688h-2.604c-0.378,0-0.687-0.308-0.687-0.688v-2.603c0-0.001,0-0.001,0-0.001c0,0,0-0.001,0-0.001v-2.601c0-0.001,0-0.001,0-0.002c0-0.379,0.308-0.687,0.687-0.687h2.604c0.379,0,0.688,0.308,0.688,0.687s-0.308,0.687-0.688,0.687h-1.917v1.23H32.052z" style={{ fill: '#fff' }}></path>
    </svg>
);

// 外部資源連結卡片
const ResourceCard = ({ icon, title, description, href, linkText }) => {
    const cardVariants = {
        initial: { y: 0, scale: 1 },
        hover: {
            y: -12,
            scale: 1.03,
            transition: { type: "spring", stiffness: 300, damping: 20 }
        }
    };

    return (
        <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-6 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/80 flex flex-col h-full transition-all duration-300 ease-in-out hover:bg-indigo-50/80 hover:border-indigo-300/60"
            variants={cardVariants}
            initial="initial"
            whileHover="hover"
        >
            <div className="flex-grow">
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-inner transition-colors duration-300 group-hover:bg-indigo-100">
                        {icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 transition-colors duration-300 group-hover:text-indigo-900">
                        {title}
                    </h3>
                </div>
                <p className="text-base leading-relaxed text-slate-700 transition-colors duration-300 group-hover:text-indigo-800">
                    {description}
                </p>
            </div>
            <div className="text-right mt-6">
                <span className="text-sm font-bold text-indigo-600 transition-colors group-hover:text-indigo-700">
                    {linkText}
                    <span className="inline-block transition-transform duration-300 ease-in-out group-hover:translate-x-1.5">
                        &rarr;
                    </span>
                </span>
            </div>
        </motion.a>
    );
};

// 重點螢光筆效果元件
const Highlight = ({ children }) => (
    <span className="bg-yellow-200/70 px-1.5 py-0.5 rounded-md transition-colors duration-300 hover:bg-yellow-300/90">
        {children}
    </span>
);


// FAQ 問答項目
const FaqItem = ({ question, children, isOpen, onToggle }) => (
    <div className="border-b border-gray-200/80 last:border-b-0">
        <button
            className="w-full flex justify-between items-center py-5 text-left gap-4"
            onClick={onToggle}
        >
            <span className="text-lg font-semibold text-gray-800">{question}</span>
            <ChevronDown className={`h-6 w-6 text-gray-500 transform transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="pb-5 text-base text-gray-600 prose max-w-none prose-p:my-2">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);


// --- 主要頁面元件 ---
export default function RelatedLinksPage() {
    const [openFaq, setOpenFaq] = useState(null);

    // 監聽網址是否帶有 #section2 並自動捲動至 FAQ 區塊
    useEffect(() => {
        if (window.location.hash === '#section2') {
            const faqSection = document.getElementById('section2');
            if (faqSection) {
                faqSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, []);

    const cardData = [
        { icon: <School className="h-7 w-7 text-indigo-600" />, title: "彰師大獎助學金專區", description: "提供全校各單位之校內外獎助學金、揚鷹獎勵金之公告訊息，並有校園餐券及校內外急難扶助金等申請資訊！", href: "https://www.ncue.edu.tw/p/412-1000-1513.php?Lang=zh-tw", linkText: "前往瞭解" },
        { icon: <LineIcon className="h-7 w-7" />, title: "加入 LINE 官方社群", description: "歡迎加入生輔組 LINE「彰師多元關懷社群」，及時掌握獎助學金、獎勵金及學雜費減免等訊息！", href: "https://reurl.cc/L7jGQe", linkText: "立即加入" },
        { icon: <Globe className="h-7 w-7 text-indigo-600" />, title: "教育部圓夢助學網", description: "教育部提供的全國性獎學金資源查詢平台，彙整中央各部會及各大專校院的獎助學金資源。", href: "https://www.edu.tw/helpdreams/Default.aspx", linkText: "探索更多" },
        {
            icon: <BookOpen className="h-7 w-7 text-indigo-600" />,
            title: "平台使用說明",
            description: "關於本平台的注意事項，內容包含開發人員、管理員、一般使用者三種身分的使用說明。",
            href: "https://docs.google.com/document/d/1ZI_vUtdQ2ushBS0C9viS1yZWzSkFEgvZ79NEJCmvptU/edit?usp=sharing",
            linkText: "查看文件"
        }
    ];

    const faqData = [
        {
            q: "什麼是彰師揚鷹生？",
            a: () => (
                <>
                    <p>彰師揚鷹生，簡稱<Highlight>揚鷹生</Highlight>。揚鷹生是申請本校金額高達1千萬元的各式<a href="https://sites.google.com/gm.ncue.edu.tw/ncueeagle/%E9%A6%96%E9%A0%81?authuser=0" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">高教深耕計畫揚鷹獎勵金</a>之基本資格，具有下列任一項資格即為揚鷹生：</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>具政府證明的經濟不利身分：<Highlight>低收、中低收、特殊境遇家庭子女及孫子女</Highlight></li>
                        <li><Highlight>弱勢1~6級</Highlight>(弱勢學生助學計畫)</li>
                        <li>具下列學雜費減免資格：
                            <ol className="list-decimal pl-6 mt-1 space-y-1">
                                <li>身心障礙或身心障礙人士子女</li>
                                <li>原住民學生</li>
                            </ol>
                        </li>
                        <li>家庭突遭變故經本校<Highlight>王金平先生關懷揚鷹生急難扶助金</Highlight>審核通過者</li>
                        <li>具中華民國國籍且<Highlight>懷孕或撫養未滿3歲子女</Highlight>者</li>
                    </ul>
                </>
            )
        },
        {
            q: "我的家庭經濟困難，可是沒有政府公文的經濟不利身分，有什麼辦法可以幫我嗎？",
            a: () => (
                <>
                    <p>您可以申請高教端獨有之助學措施<Highlight>【弱勢助學計畫～弱勢學生助學金（本校簡稱弱勢1～6級）】</Highlight>：</p>
                    <p><strong>一、適用對象：</strong><br />就讀大學跟研究所家境清寒、無學雜費減免資格的學生（含各學制新生）。</p>
                    <p><strong>二、申請時間：</strong><br /><Highlight>每年9月20日起至10月20日止</Highlight>，請於時間內上線申請，並上傳3個月內之家庭應計人口含記事之戶籍謄本及前一學期學業成績達60分之成績單正本（新生及轉學生免交），逾期不受理。</p>
                    <p><strong>三、補助金額：</strong><br />本弱勢助學計畫「助學金」，每學年受理申請1次，上學期申請，下學期撥款(於註冊單內扣減)，依學制及家庭年所得分級補助。大學部分2級，補助金額為<Highlight>15000~20000元</Highlight>；碩博班分1～5級，補助金額為<Highlight>5000~16500元</Highlight>。</p>
                    <p><strong>四、可申請之獎助學金：</strong><br />經教育部審查通過者，即為<Highlight>『揚鷹生』</Highlight>，可申請各式<a href="https://sites.google.com/gm.ncue.edu.tw/ncueeagle/%E9%A6%96%E9%A0%81?authuser=0" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">高教深耕計畫揚鷹獎勵金</a>，及家境清寒類的校外獎助學金。</p>
                </>
            )
        },
        {
            q: "我是新生，請問可以申請哪些獎助學金？",
            a: () => (
                <>
                    <p><strong>一、校內代辦的新生獎助學金：</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>大一新生：</strong>可申請<a href="https://stuaffweb.ncue.edu.tw/p/406-1039-29374,r31.php" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline"><Highlight>飛羚電機關懷揚鷹生獎助學金</Highlight></a>（保障10名大一新生）、「<a href="https://stuaffweb.ncue.edu.tw/var/file/39/1039/img/720/135993261.pdf" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline"><Highlight>培鷹‧翱翔助學金</Highlight></a>」及「高教深耕揚鷹計畫～<a href="https://sites.google.com/gm.ncue.edu.tw/ncueeagle" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline"><Highlight>新鮮人助學金</Highlight></a>」。</li>
                        <li><strong>碩班新生：</strong>可申請「深耕揚鷹計畫～<Highlight>揚鷹生專題研究學習獎勵金</Highlight>」。</li>
                    </ul>
                    <p><strong>二、校外獎助學金：</strong></p>
                    <p>申請期限、金額及資格，請詳閱校外獎助學金一覽表（請關鍵字搜尋新生）</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>本校獲配推薦名額類：</strong>如<Highlight>張榮發助學金、雄和、賴樹旺夫婦獎助學金</Highlight>（預計開學時於校外獎助學金一覽表刊登公告）</li>
                        <li><strong>新生可申請，但錄取與否由各獎助學金單位決定類：</strong>如各縣市政府清寒學金、欣恩獎助學金、「蘭馨愛‧讓夢想起飛-國立大學清寒女學生助學方案」、普仁基金會「大手拉小手育成計畫」......等眾多校外獎助學金。</li>
                    </ul>
                </>
            )
        },
        {
            q: "獎助學金公告的「不得兼領」是什麼意思？",
            a: () => (
                <>
                    <p>「不得兼領」<Highlight>不等於</Highlight>「不能同時申請」。</p>
                    <p>這項規定的核心精神是：在獲獎名單公布前，你通常可以自由申請多個獎助學金。但如果你同時錄取了多個獎項，而其中一項或多項有「不得兼領」的規定，你就必須做出選擇，<Highlight>只能擇優領取其中一項</Highlight>。</p>
                    <p>若需放棄已錄取的獎項，可至<a href="https://stuaffweb.ncue.edu.tw/p/412-1039-4293.php" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">本組檔案下載區</a>下載「自願放棄獎助學金聲明書」辦理。</p>
                </>
            )
        },
        {
            q: "校內各項獎助學金可以同時申請嗎？",
            a: () => (
                <>
                    <p>可以同時申請，但錄取規則不同：</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>「弱勢計畫〜生活助學金」</strong>及<strong>「校內代辦獎助學金」</strong>：可以同時申請，但你申請的項目會成為審查時的<Highlight>綜合考量因素之一</Highlight>。</li>
                        <li><strong>「專題研究學習獎勵金」</strong>與<strong>「啟導揚學獎勵金」</strong>：可同時送件申請，但最終只會<Highlight>擇優錄取一項</Highlight>。</li>
                    </ul>
                </>
            )
        },
        {
            q: "「家境清寒」的定義是什麼？需要什麼證明？",
            a: () => (
                <>
                    <p>「家境清寒」是一個統稱，通常包含以下資格，並需提供對應的證明文件：</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>低收入戶、中低收入戶證明。</li>
                        <li>特殊境遇家庭（需有政府核發的正式公文）。</li>
                        <li>教育部弱勢助學金資格（第1至5級）。</li>
                        <li>村里長或導師開立的清寒證明。</li>
                    </ul>
                    <p>在審查時，通常會以上述列表的順序作為經濟不利程度的優先考量。</p>
                </>
            )
        },
        {
            q: "何謂「特殊境遇家庭子女」？",
            a: () => (
                <>
                    <p>這是一個法定的特殊身份，必須持有由<Highlight>鄉鎮市區公所核發的正式核准公文</Highlight>才算數。僅有單親、身心障礙子女證明或村里長清寒證明，並<Highlight>不等於</Highlight>特殊境遇家庭。您可以參考<a href="https://stuaffweb.ncue.edu.tw/var/file/39/1039/img/720/img-310134634-0001.jpg" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">此範例公文</a>。</p>
                </>
            )
        },
        {
            q: "如何申請「全戶戶籍謄本（含記事）」？「全戶」包含哪些人？",
            a: () => (
                <>
                    <p><strong>臨櫃申請：</strong></p>
                    <p>全國任一戶政事務所皆可申請，需告知承辦人要申請<Highlight>「含記事」</Highlight>的版本，每份15元。申請時請攜帶身分證、印章（未成年者需加附父母任一方之委託書、身分證及印章）。</p>
                    <p><strong>「全戶」的定義非常嚴格，包含：</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>學生本人（及配偶，若已婚）。</li>
                        <li>父母（或法定監護人）。</li>
                        <li>未婚的兄弟姊妹。</li>
                        <li><strong>同戶籍</strong>的已婚兄弟姊-妹。</li>
                        <li><strong>同戶籍</strong>的祖父母或外祖父母。</li>
                    </ul>
                    <p><strong>※特別注意：</strong>即使父母或未婚的兄弟姊妹不在同一戶籍，也<Highlight>必須一併檢附</Highlight>他們的戶籍謄本。</p>
                    <p><strong>線上申請（推薦）：</strong></p>
                    <p>建議滿18歲以上，可申請自然人憑證，隨時利用「<a href="https://www.ris.gov.tw/app/portal/504#dBwPmh" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">線上申請電子戶籍謄本</a>」服務。或多利用政府「<a href="https://mydata.nat.gov.tw/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">MyData</a>」平台申請資料，首次註冊需讀卡機，可利用學生會辦公室之讀卡設備，繳費會員並可免費列印。</p>
                </>
            )
        },
        {
            q: "如何申請「全戶所得及財產清單」？",
            a: () => (
                <>
                    <p>「全戶」的定義與戶籍謄本相同。<strong>最重要的一點是：</strong><Highlight>每一位家庭成員都必須提供</Highlight>「各類所得資料清單」與「財產歸屬資料清單」，無論其年齡、有無收入或財產。</p>
                    <p><strong>線上申請（推薦）：</strong></p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>政府「MyData」平台：</strong>需備妥健保卡或自然人憑證，透過「<a href="https://mydata.nat.gov.tw/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">MyData 平台</a>」申請。</li>
                        <li><strong>財政部「電子稅務文件入口網」：</strong>
                            <ol className="list-decimal pl-5 mt-1 space-y-1">
                                <li>進入「<a href="https://www.etax.nat.gov.tw/etwmain/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">財政部稅務入口網</a>」，點選線上服務→電子稅務文件。</li>
                                <li>點選線上申請，使用健保卡或自然人憑證登入。</li>
                                <li>搜尋並點選要申請的項目：「財產資料」及「個人所得資料」。</li>
                                <li>依照指示輸入驗證資訊並確認申請。</li>
                                <li>約1小時內會收到E-mail通知，即可憑卡登入下載PDF文件。</li>
                            </ol>
                        </li>
                    </ul>
                    <p><strong>臨櫃申請：</strong></p>
                    <p>請攜帶申請人身分證正本至全國任一國稅局或稅捐稽徵處辦理。若需代為申請家人資料，需額外準備家長的身分證影本、印章及委託書。</p>
                </>
            )
        },
        {
            q: "學年平均成績與班級排名百分比如何計算？",
            a: () => (
                <>
                    <p><strong>學年平均成績：</strong>將一整個學年（上下學期）所有科目的<Highlight>「成績 × 學分數」</Highlight>加總後，再除以該學年的<Highlight>「總修習學分數」</Highlight>。這是一種加權平均計算。</p>
                    <p><strong>班級排名百分比：</strong><Highlight>（您的班級排名 ÷ 班級總人數）× 100%</Highlight>。</p>
                </>
            )
        },
        {
            q: "公費生、卓獎生或師獎生可以申請其他獎助學金嗎？",
            a: () => (<p>可以。只要符合該獎助學金的申請資格，皆可提出申請。</p>)
        },
        {
            q: "在哪裡可以找到更多的獎助學金資訊？",
            a: () => (<p>您可以隨時關注<a href="https://ppt.cc/fBqflx" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">本校首頁下方 / 多元助學 / 校內外獎助學金</a>專區，以獲取最新的公告訊息。</p>)
        },
    ];

    const handleFaqToggle = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className="w-full bg-slate-50 font-sans min-h-screen py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* --- 頁面標題 --- */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">相關資源與常見問答</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
                        彙整常用校外資源連結與獎助學金申請相關的常見問題。
                    </p>
                </motion.div>

                {/* --- 連結卡片區塊 --- */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: { transition: { staggerChildren: 0.1 } }
                    }}
                >
                    {cardData.map((card, index) => (
                        <ResourceCard
                            key={index}
                            {...card}
                        />
                    ))}
                </motion.div>

                {/* --- FAQ 區塊 --- */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    {/* FAQ 區塊定位點 */}
                    <div id="section2" className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 rounded-xl bg-sky-100">
                                <HelpCircle className="h-8 w-8 text-sky-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800">常見問題 (FAQ)</h2>
                        </div>
                        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/80 p-4 sm:p-6">
                            {faqData.map((item, index) => (
                                <FaqItem
                                    key={index}
                                    question={item.q}
                                    isOpen={openFaq === index}
                                    onToggle={() => handleFaqToggle(index)}
                                >
                                    {item.a()}
                                </FaqItem>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
