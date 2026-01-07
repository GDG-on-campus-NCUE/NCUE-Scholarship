'use client';

import { useState, useEffect } from 'react';

export function useSystemSettings() {
  const [settings, setSettings] = useState({
    NEXT_PUBLIC_TINYMCE_API_KEY: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings/public');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to fetch system settings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return { settings, loading };
}
