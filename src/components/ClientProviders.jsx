'use client'

import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import ProfileCompletionModal from "@/components/auth/ProfileCompletionModal";
import TermsGuard from "@/components/auth/TermsGuard";
import { requestForToken, onMessageListener } from "@/lib/firebase";

export default function ClientProviders({ children }) {
	useEffect(() => {
		// 1. 註冊 FCM Token
		const setupNotifications = async () => {
			const token = await requestForToken();
			if (token) {
				await fetch('/api/notifications/save-token', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token, deviceType: 'web' })
				});
			}
		};

		setupNotifications();

		// 2. 監聽前台訊息 (當 App 開啟時收到通知)
		onMessageListener()
			.then((payload) => {
				console.log('Received foreground message:', payload);
				// 這裡可以使用 Toast 顯示通知內容
			})
			.catch((err) => console.error('Failed to listen for messages:', err));
	}, []);

	return (
		<AuthProvider>
			<TermsGuard>
				{children}
			</TermsGuard>
			<ProfileCompletionModal />
		</AuthProvider>
	);
}
