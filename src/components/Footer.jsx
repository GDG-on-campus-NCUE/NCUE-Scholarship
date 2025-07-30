import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 主內容區域採用 RWD 排版 */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* 關於平台 */}
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold mb-4 text-orange-400">
              關於平台
            </h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              An intelligent scholarship platform cored by a Multimodal LLM, dynamically analyzing user-provided sources (PDFs, URLs) to achieve automated parsing, data extraction, and summarization.
            </p>
            <p className="text-gray-400 text-sm">
              LLM powered by <span className="text-blue-400">Gemini 2.5 Flash</span>
            </p>
          </div>

          {/* 相關資源 */}
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold mb-4 text-orange-400">
              相關資源
            </h3>
            <div className="space-y-3">
              <Link 
                href="https://www.ncue.edu.tw" 
                className="flex items-center justify-center sm:justify-start gap-2 text-gray-400 hover:text-accent-400 transition-colors duration-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                彰師大 主編組首頁
              </Link>
              <Link 
                href="https://www.facebook.com/ncue.edu.tw" 
                className="flex items-center justify-center sm:justify-start gap-2 text-gray-400 hover:text-accent-400 transition-colors duration-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                彰師大 主編組 FB
              </Link>
              <Link 
                href="/faq" 
                className="flex items-center justify-center sm:justify-start gap-2 text-gray-400 hover:text-accent-400 transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                詢問獎學金相關問題
              </Link>
            </div>
          </div>

          {/* 平台開發 */}
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold mb-4 text-orange-400">
              平台開發
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span>Developed and Maintained by</span>
              </div>
              <div className="text-white font-medium">
                Tai Ming Chen
              </div>
              <div className="text-white font-medium">
                Grason Yang
              </div>
              <Link 
                href="mailto:contact@ncue-scholarship.tw" 
                className="flex items-center justify-center sm:justify-start gap-2 text-gray-400 hover:text-accent-400 transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                聯繫開發者
              </Link>
              <Link 
                href="/platform-feedback" 
                className="flex items-center justify-center sm:justify-start gap-2 text-gray-400 hover:text-accent-400 transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                </svg>
                平台問題回報
              </Link>
            </div>
          </div>
        </div>

        {/* 版權資訊 */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
          <p className="text-gray-400">
            © 2025 NCUE 獎助學金資訊平台. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
