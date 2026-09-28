import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY 未配置，后端功能可能异常');
}

export const supabaseAdmin = url && serviceKey
  ? createClient(url, serviceKey, {
      auth: { persistSession: false },
    })
  : null;