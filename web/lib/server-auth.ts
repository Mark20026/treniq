import { createClient } from '@supabase/supabase-js';

export async function requireCoach(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new Error('Unauthorized');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) throw new Error('Server configuration missing');
  const client = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) throw new Error('Unauthorized');
  const { data: profile } = await client.from('coach_profiles').select('id').eq('id', user.id).single();
  if (!profile) throw new Error('Forbidden');
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return { user, client, admin };
}

export function accountError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
  return Response.json({ error: status === 500 ? 'Account operation failed' : message }, { status });
}
