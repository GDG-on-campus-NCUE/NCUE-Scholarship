"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import LinkButton from '@/components/ui/LinkButton';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || '驗證過程中發生未知錯誤';

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-md w-full space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>
            驗證失敗
          </h2>
          
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
            {message}
          </p>
          
          <div className="space-y-4">
            <LinkButton href="/login" variant="secondary" className="w-full">
              返回登入
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background)' }}>
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
