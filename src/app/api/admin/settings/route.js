import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, handleApiError } from '@/lib/apiMiddleware';

const ALLOWED_KEYS = ['GEMINI_API_KEY', 'SERP_API_KEY', 'NEXT_PUBLIC_TINYMCE_API_KEY'];

function maskValue(value) {
  if (!value) return '';
  if (value.length <= 8) return '******';
  return `${value.substring(0, 3)}******${value.substring(value.length - 4)}`;
}

export async function GET(request) {
  try {
    const authCheck = await verifyUserAuth(request, {
      requireAuth: true,
      requireAdmin: true,
      endpoint: '/api/admin/settings'
    });
    
    if (!authCheck.success) {
      return authCheck.error;
    }

    // Fetch from DB
    let safeDbSettings = [];
    try {
        const { data: dbSettings, error } = await supabaseServer
          .from('system_settings')
          .select('*');

        if (error) {
            console.error('Error fetching system_settings:', error);
            // Fallback to empty array to allow UI to render (e.g. with Env vars)
        } else {
            safeDbSettings = dbSettings || [];
        }
    } catch (dbError) {
        console.error('Exception fetching system_settings:', dbError);
        // Continue with empty DB settings
    }

    const result = ALLOWED_KEYS.map(key => {
      const dbItem = safeDbSettings.find(item => item.key === key);
      
      if (dbItem && dbItem.value) {
        return {
          key,
          value: maskValue(dbItem.value),
          isSet: true,
          source: 'database',
          updatedAt: dbItem.updated_at
        };
      }

      // Check Env
      // Handle legacy GEMINI key mapping for check
      let envValue = process.env[key];
      if (key === 'GEMINI_API_KEY' && !envValue) {
        envValue = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      }

      if (envValue) {
        return {
          key,
          value: maskValue(envValue),
          isSet: true,
          source: 'environment',
          updatedAt: null
        };
      }

      return {
        key,
        value: '',
        isSet: false,
        source: 'none',
        updatedAt: null
      };
    });

    return NextResponse.json({ success: true, settings: result });

  } catch (error) {
    return handleApiError(error, '/api/admin/settings');
  }
}

export async function POST(request) {
  try {
    const authCheck = await verifyUserAuth(request, {
      requireAuth: true,
      requireAdmin: true,
      endpoint: '/api/admin/settings'
    });
    
    if (!authCheck.success) {
      return authCheck.error;
    }

    const body = await request.json();
    const { key, value } = body;

    if (!ALLOWED_KEYS.includes(key)) {
      return NextResponse.json({ error: 'Invalid setting key' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('system_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: authCheck.user.id
      });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Setting updated successfully' });

  } catch (error) {
    return handleApiError(error, '/api/admin/settings');
  }
}
