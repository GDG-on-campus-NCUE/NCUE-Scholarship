import { supabaseServer } from './supabase/server';

/**
 * Retrieves a system configuration value.
 * Priority: Database (system_settings) -> Environment Variable (process.env)
 * 
 * @param {string} key The configuration key (e.g., 'GEMINI_API_KEY')
 * @returns {Promise<string|null>} The configuration value
 */
export async function getSystemConfig(key) {
  try {
    // 1. Try fetching from Database
    // We use supabaseServer (Service Role) to bypass RLS, ensuring we can read settings even if the user context is normal.
    const { data, error } = await supabaseServer
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (!error && data?.value) {
      return data.value;
    }
  } catch (err) {
    // Silent error, proceed to fallback
    // console.warn(`[Config] Database lookup failed for ${key}, using fallback.`);
  }

  // 2. Fallback to Environment Variable
  // We handle specific keys to ensure backward compatibility or correct mapping
  if (key === 'GEMINI_API_KEY') {
    return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || null;
  }
  
  return process.env[key] || null;
}

/**
 * Retrieves public system configurations.
 * Only returns keys safe for client-side usage.
 * 
 * @returns {Promise<Object>} Object containing public keys
 */
export async function getPublicSystemConfig() {
  const tinyMceKey = await getSystemConfig('NEXT_PUBLIC_TINYMCE_API_KEY');
  
  return {
    NEXT_PUBLIC_TINYMCE_API_KEY: tinyMceKey || ''
  };
}
