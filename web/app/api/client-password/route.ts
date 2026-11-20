import { requireCoach, accountError } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    const { user, client } = await requireCoach(request);
    const { clientId } = await request.json();
    if (typeof clientId !== 'string') return Response.json({ error: 'Client ID required' }, { status: 400 });
    const { data: owned } = await client.from('clients').select('email').eq('id', clientId).eq('coach_id', user.id).single();
    if (!owned?.email) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { error } = await client.auth.resetPasswordForEmail(owned.email, { redirectTo: new URL('/hu/reset-password', request.url).toString() });
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) { return accountError(error); }
}
