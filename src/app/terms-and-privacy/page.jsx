import TermsAndPrivacyClient from './TermsAndPrivacyClient';

export const metadata = {
  title: '服務條款暨隱私權政策',
  description: '國立彰化師範大學學生事務處生活輔導組校外獎學金平台服務條款與隱私權保護政策。',
  openGraph: {
    title: '服務條款暨隱私權政策 | 彰師生輔組獎助學金資訊平台',
    description: '了解我們的服務條款與隱私權保護政策。',
  },
};

export default function TermsAndPrivacyPage() {
  return <TermsAndPrivacyClient />;
}
