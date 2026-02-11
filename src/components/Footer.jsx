"use client";

import Link from "next/link";
import { School, HelpCircle, Mail, MessageSquare } from 'lucide-react';

export default function Footer() {
    return (
        <>
            <style jsx global>{`
                .g-char-1 { color: #4285F4; }
                .g-char-2 { color: #DB4437; }
                .g-char-3 { color: #F4B400; }
                .g-char-4 { color: #4285F4; }
                .g-char-5 { color: #0F9D58; }
                .g-char-6 { color: #DB4437; }
                
                .footer-link-underline {
                    position: relative;
                    display: inline-block;
                }
                .footer-link-underline::after {
                    content: '';
                    position: absolute;
                    width: 0;
                    height: 1px;
                    display: block;
                    margin-top: 2px;
                    right: 0;
                    background: #f59e0b;
                    transition: width .3s ease;
                    -webkit-transition: width .3s ease;
                }
                .group:hover .footer-link-underline::after {
                    width: 100%;
                    left: 0;
                    background-color: #f59e0b;
                }
            `}</style>

            <footer className={`bg-[#1E2129] text-white py-10 sm:py-16 select-none`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

                        {/* --- 關於平台 --- */}
                        <div className="text-center sm:text-left">
                            <div className="inline-block mb-4 sm:mb-6">
                                <h3 className="text-lg font-bold text-white">
                                    關於平台
                                </h3>
                                <div className="w-12 h-0.5 bg-amber-400 mt-2 mx-auto sm:mx-0"></div>
                            </div>
                            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                An intelligent scholarship platform cored by a Multimodal LLM, dynamically analyzing user-provided sources (PDFs, URLs) to achieve automated parsing, data extraction, and summarization.
                            </p>
                            <p className="text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4">
                                LLM powered by <span className="font-medium text-gray-300">Gemini 3 Flash</span>
                            </p>
                        </div>

                        {/* --- 相關資源 --- */}
                        <div className="text-center sm:text-left">
                            <div className="inline-block mb-4 sm:mb-6">
                                <h3 className="text-lg font-bold text-white">
                                    相關資源
                                </h3>
                                <div className="w-12 h-0.5 bg-amber-400 mt-2 mx-auto sm:mx-0"></div>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                <Link href="https://stuaffweb.ncue.edu.tw/" className="group flex items-center justify-center sm:justify-start gap-3 text-gray-300 hover:text-white transition-all duration-300 hover:-translate-y-0.5" target="_blank" rel="noopener noreferrer">
                                    <School className="w-5 h-5 flex-shrink-0" />
                                    <span className="footer-link-underline text-sm sm:text-base">彰師 生輔組首頁</span>
                                </Link>
                                <Link href="https://www.facebook.com/ncuestuser" className="group flex items-center justify-center sm:justify-start gap-3 text-gray-300 hover:text-white transition-all duration-300 hover:-translate-y-0.5" target="_blank" rel="noopener noreferrer">
                                    <svg className="w-5 h-5 flex-shrink-0" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                                        <title>Facebook</title>
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                    <span className="footer-link-underline text-sm sm:text-base">彰師 生輔組 FB</span>
                                </Link>
                                <Link href="mailto:act5718@gmail.com" className="group flex items-center justify-center sm:justify-start gap-3 text-gray-300 hover:text-white transition-all duration-300 hover:-translate-y-0.5" target="_blank" rel="noopener noreferrer">
                                    <HelpCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="footer-link-underline text-sm sm:text-base">詢問獎學金相關問題</span>
                                </Link>
                            </div>
                        </div>

                        {/* --- 平台開發 --- */}
                        <div className="text-center sm:text-left sm:col-span-2 lg:col-span-1">
                            <div className="inline-block mb-4 sm:mb-6">
                                <h3 className="text-lg font-bold text-white">
                                    平台開發
                                </h3>
                                <div className="w-12 h-0.5 bg-amber-400 mt-2 mx-auto sm:mx-0"></div>
                            </div>
                            <div className="space-y-4 w-full">
                                <a href="https://gdg.ncuesa.org.tw" className="group flex items-center justify-center sm:justify-start gap-3 text-gray-300 hover:text-white transition-all duration-300 hover:-translate-y-0.5" target="_blank" rel="noopener noreferrer">
                                    <img src="/GDG.gif" alt="GDG On Campus NCUE Logo" className="h-8 w-auto flex-shrink-0" />
                                    <span className="font-semibold text-white text-sm">
                                        <span className="google-word-container">
                                            <span className="g-char g-char-1">G</span><span className="g-char g-char-2">o</span><span className="g-char g-char-3">o</span><span className="g-char g-char-4">g</span><span className="g-char g-char-5">l</span><span className="g-char g-char-6">e</span>
                                        </span> Developer Group<br/>On Campus NCUE
                                    </span>
                                </a>
                                
                                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 sm:gap-8 pt-2">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-1">Especially thanks to</p>
                                        <p className="text-sm text-gray-400 font-medium flex items-center gap-1">
                                            <Link 
                                                href="https://mingchen.dev" 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="hover:text-amber-400 transition-colors duration-300"
                                            >
                                                陳泰銘
                                            </Link>
                                            <span className="text-gray-700">|</span> 
                                            <span>楊敦傑</span>
                                        </p>
                                    </div>
                                    <Link href="https://forms.gle/GmPVHsdV7mLeGyhx7" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300" target="_blank" rel="noopener noreferrer">
                                        <MessageSquare className="w-4 h-4" />
                                        <span className="text-xs font-semibold footer-link-underline">平台問題回報</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-xs sm:text-sm">
                        <p className="text-gray-400">
                            © 2026 彰師生輔組校外獎助學金資訊平台. All Rights Reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}