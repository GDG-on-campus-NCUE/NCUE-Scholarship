import { supabaseServer } from '@/lib/supabase/server';
import HomePageClient from '@/components/HomePageClient';
import JsonLd from '@/components/JsonLd';

export async function generateMetadata({ searchParams }) {
  const { announcement_id } = await searchParams;

  if (!announcement_id) {
    return {}; // Uses default from layout.jsx
  }

  const { data: announcement } = await supabaseServer
    .from('announcements')
    .select('title, summary')
    .eq('id', announcement_id)
    .single();

  if (!announcement) {
    return {};
  }

  const cleanSummary = announcement.summary
    ? announcement.summary.replace(/<[^>]+>/g, '').substring(0, 160) + '...'
    : '點擊查看公告詳情';

  return {
    title: `${announcement.title}`,
    description: cleanSummary,
    openGraph: {
      title: announcement.title,
      description: cleanSummary,
    },
  };
}

export default async function Home({ searchParams }) {
  const { announcement_id } = await searchParams;
  let announcement = null;

  if (announcement_id) {
    const { data } = await supabaseServer
      .from('announcements')
      .select('*')
      .eq('id', announcement_id)
      .single();
    announcement = data;
  }

  return (
    <>
      {announcement && <JsonLd data={announcement} />}
      <HomePageClient />
    </>
  );
}