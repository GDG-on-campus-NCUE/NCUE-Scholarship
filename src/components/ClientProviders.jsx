'use client'

import { AuthProvider } from "@/contexts/AuthContext";
import ProfileCompletionModal from "@/components/auth/ProfileCompletionModal";
import TermsGuard from "@/components/auth/TermsGuard";

export default function ClientProviders({ children }) {
	return (
		<AuthProvider>
			<TermsGuard>
				{children}
			</TermsGuard>
			<ProfileCompletionModal />
		</AuthProvider>
	);
}
