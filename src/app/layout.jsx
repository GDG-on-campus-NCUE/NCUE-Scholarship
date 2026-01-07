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
	title: '彰師生輔組獎助學金資訊平台',
	description: '提供彰師學生校外獎助學金資訊的 AI 公告平台',
	icons: {
		icon: [
			{ url: '/favicon.ico', sizes: '16x16 32x32', type: 'image/x-icon' },
			{ url: '/logo.png', sizes: '192x192', type: 'image/png' }
		],
		shortcut: '/favicon.ico',
		apple: { url: '/logo.png', sizes: '180x180', type: 'image/png' }
	}
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
