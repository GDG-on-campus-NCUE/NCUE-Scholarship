import { Noto_Sans_TC } from 'next/font/google'
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ClientProviders from "@/components/ClientProviders";
import ScrollToTop from "@/components/ScrollToTop";

const notoSans = Noto_Sans_TC({
	subsets: ['latin'],
	weight: ['400', '700'],
	variable: '--font-noto-sans',
	display: 'swap',
})

export const metadata = {
	metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://scholarship.ncuesa.org.tw'),
	title: {
		template: '%s | 彰師生輔組獎助學金資訊平台',
		default: '彰師生輔組獎助學金資訊平台',
	},
	description: '提供彰師學生校外獎助學金資訊的 AI 公告平台',
	icons: {
		icon: [
			{ url: '/favicon.ico', sizes: '16x16 32x32', type: 'image/x-icon' },
			{ url: '/logo.png', sizes: '192x192', type: 'image/png' }
		],
		shortcut: '/favicon.ico',
		apple: { url: '/logo.png', sizes: '180x180', type: 'image/png' }
	},
	openGraph: {
		type: 'website',
		locale: 'zh_TW',
		url: '/',
		siteName: '彰師生輔組獎助學金資訊平台',
		title: '彰師生輔組獎助學金資訊平台',
		description: '提供彰師學生校外獎助學金資訊的 AI 公告平台',
		images: [
			{
				url: '/banner.jpg',
				width: 1200,
				height: 630,
				alt: '彰師生輔組獎助學金資訊平台',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: '彰師生輔組獎助學金資訊平台',
		description: '提供彰師學生校外獎助學金資訊的 AI 公告平台',
		images: ['/banner.jpg'],
	},
}

export default function RootLayout({ children }) {
	return (
		<html lang="zh-TW" className={notoSans.variable}>
			<body className={notoSans.className}>
				<ClientProviders>
					<div className="layout-container">
						<Header />
						<main className="main-content">
							{children}
						</main>
						<Footer />
					</div>
					<ScrollToTop />
				</ClientProviders>
			</body>
		</html>
	);
}
