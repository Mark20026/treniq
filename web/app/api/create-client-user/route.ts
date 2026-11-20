import { randomBytes } from 'node:crypto';
import { requireCoach, accountError } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    const { user, admin } = await requireCoach(request);
    const { email, full_name } = await request.json();
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof full_name !== 'string' || !full_name.trim() || full_name.length > 200) return Response.json({ error: 'Valid email and full name required' }, { status: 400 });
    const temporaryPassword = randomBytes(18).toString('base64url') + 'aA1!';
    const { data, error } = await admin.auth.admin.createUser({ email, password: temporaryPassword, email_confirm: true, user_metadata: { full_name }, app_metadata: { role: 'client', created_by_coach: user.id } });
    if (error) return Response.json({ error: 'Could not create client account' }, { status: 400 });
    return Response.json({ success: true, user: { id: data.user.id }, temporaryPassword });
  } catch (error) { return accountError(error); }
}
