import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request) {
	if (request.nextUrl.pathname.startsWith('/_next')) {
		return NextResponse.next();
	}

	// CORS 處理
	const origin = request.headers.get('origin');
	const allowedOrigins = [
		'http://localhost:3000',
		'http://localhost:3001',
		'http://127.0.0.1:3000',
		'https://scholarship.ncuesa.org.tw',
		'https://ncuesa.org.tw'
	];

	const isAllowedOrigin = !origin || allowedOrigins.includes(origin);

	// 處理 preflight OPTIONS 請求
	if (request.method === 'OPTIONS') {
		const response = new NextResponse(null, { status: 200 });
		response.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? (origin || '*') : 'null');
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, apikey, x-supabase-api-version, prefer, x-client-info');
		response.headers.set('Access-Control-Allow-Credentials', 'true');
		response.headers.set('Access-Control-Max-Age', '86400');
		return response;
	}

	const res = NextResponse.next();

	// 設置 CORS headers
	if (origin && isAllowedOrigin) {
		res.headers.set('Access-Control-Allow-Origin', origin);
		res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
		res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, apikey, x-supabase-api-version, prefer, x-client-info');
		res.headers.set('Access-Control-Allow-Credentials', 'true');
	}

	try {
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL, // 使用 http://localhost:3000/api/proxy (本地) 或生產環境代理
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
			{
				cookies: {
					getAll: () => request.cookies.getAll(),
					setAll: (cookies) => {
						cookies.forEach(({ name, value, options }) => {
							try {
								res.cookies.set({ name, value, ...options });
							} catch (error) {
								console.warn('Failed to set cookie:', { name, error: error.message });
							}
						});
					},
				},
			}
		);

		// 刷新 session（如果過期的話）
		const { data: { session } } = await supabase.auth.getSession();
		const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
			request.nextUrl.pathname.startsWith('/register') ||
			request.nextUrl.pathname.startsWith('/forgot-password');

		const isProtectedPage = request.nextUrl.pathname.startsWith('/profile') ||
			request.nextUrl.pathname.startsWith('/manage') ||
			request.nextUrl.pathname.startsWith('/management');

		// 如果用戶已登入但訪問認證頁面，重定向到個人資料頁面
		if (session && isAuthPage) {
			return NextResponse.redirect(new URL('/profile', request.url));
		}

		// 如果用戶未登入但訪問受保護頁面，重定向到登入頁面
		if (!session && isProtectedPage) {
			return NextResponse.redirect(new URL('/login', request.url));
		}

		return res;

	} catch (error) {
		console.error('Middleware error:', error);
		return res;
	}
}

export const config = {
	matcher: [
		'/login',
		'/register',
		'/forgot-password',
		'/profile',
		'/manage/:path*',
		'/management/:path*'
	]
};
