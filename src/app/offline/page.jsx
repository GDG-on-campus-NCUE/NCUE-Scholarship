'use client';

import { WifiOff, RotateCw } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <WifiOff size={48} className="text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">您目前處於離線狀態</h1>
      <p className="text-gray-600 mb-8 max-w-xs">
        請檢查您的網路連線。雖然目前無法連上伺服器，但您仍可存取部分已快取的內容。
      </p>
      <div className="flex flex-col w-full max-w-xs gap-3">
        <button 
          onClick={() => window.location.reload()} 
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
        >
          <RotateCw size={18} />
          嘗試重新連線
        </button>
        <Link 
          href="/" 
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          返回首頁
        </Link>
      </div>
    </div>
  );
}