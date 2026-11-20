import { requireCoach, accountError } from '@/lib/server-auth';

// Compensate only an account created by this coach whose client row failed to save.
export async function POST(request: Request) {
  try {
    const { user, admin } = await requireCoach(request);
    const { userId } = await request.json();
    if (typeof userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(userId)) return Response.json({ error: 'Valid user ID required' }, { status: 400 });
    const { data: account, error } = await admin.auth.admin.getUserById(userId);
    if (error || account.user?.app_metadata.created_by_coach !== user.id || account.user.app_metadata.role !== 'client') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { data: linked, error: lookupError } = await admin.from('clients').select('id').eq('id', userId).maybeSingle();
    if (lookupError || linked) return Response.json({ error: 'Account is already linked' }, { status: 409 });
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;
    return Response.json({ success: true });
  } catch (error) { return accountError(error); }
}
