'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CalendarDays, ExternalLink, AlertTriangle } from 'lucide-react';

const AnnouncementCard = ({ id }) => {
    const [announcement, setAnnouncement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            setError("未提供公告 ID。");
            return;
        }

        const fetchAnnouncement = async () => {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('announcements')
                .select('id, title, summary, application_end_date')
                .eq('id', id)
                .single();

            if (fetchError) {
                console.error('Error fetching announcement:', fetchError);
                setError('無法載入公告資訊。');
            } else {
                setAnnouncement(data);
            }
            setLoading(false);
        };

        fetchAnnouncement();
    }, [id]);

    if (loading) {
        return <div className="p-4 border border-gray-200 rounded-lg shadow-sm animate-pulse h-24"></div>;
    }

    if (error || !announcement) {
        return (
            <div className="p-3 border border-red-200 bg-red-50 rounded-lg text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{error || '找不到指定的公告。'}</span>
            </div>
        );
    }

    const deadline = announcement.application_end_date
        ? new Date(announcement.application_end_date).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
        : null;

    const announcementUrl = `https://scholarship.ncuesa.org.tw/?announcement_id=${announcement.id}`;

    return (
        <a
            href={announcementUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-4 border border-gray-200 rounded-lg shadow-sm bg-white transition-all duration-300 ease-in-out hover:scale-[1.01] hover:shadow-lg hover:border-violet-300 hover:bg-violet-50"
        >
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-gray-800 transition-colors group-hover:text-violet-600">
                    {announcement.title}
                </h4>
                <ExternalLink size={16} className="text-gray-400 transition-colors group-hover:text-violet-500 flex-shrink-0 ml-2 mt-1" />
            </div>

            <div
                className="mt-3 text-sm text-gray-700 rich-text-content"
                dangerouslySetInnerHTML={{ __html: announcement.summary || '' }}
            />

            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center text-xs text-gray-500">
                {deadline && (
                    <div className="flex items-center gap-2">
                        <CalendarDays size={14} />
                        <span>截止日期：{deadline}</span>
                    </div>
                )}
            </div>
        </a>
    );
};

export default AnnouncementCard;
