import { createClient } from '@supabase/supabase-js';

// Server-only client — uses the service role key, which must NEVER be
// exposed to the browser. This file only runs on Vercel's server, never
// in the visitor's browser, so it's safe to use it here.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return Response.json({ error: 'Missing session token.' }, { status: 401 });
  }

  // Confirm the token belongs to a real, currently signed-in user.
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return Response.json({ error: 'Invalid or expired session.' }, { status: 401 });
  }

  // Confirm that user is actually an admin before letting them create anyone.
  const callerEmail = userData.user.email;
  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('email', callerEmail)
    .maybeSingle();

  if (!callerProfile || callerProfile.role !== 'admin') {
    return Response.json({ error: 'Only admins can create users.' }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, role } = body || {};
  if (!email || !password || !role) {
    return Response.json({ error: 'Email, password, and role are all required.' }, { status: 400 });
  }
  if (!['viewer', 'editor', 'admin'].includes(role)) {
    return Response.json({ error: 'Role must be viewer, editor, or admin.' }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  // Create the actual login account — no confirmation email sent.
  const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) {
    return Response.json({ error: createErr.message }, { status: 400 });
  }

  // Grant them a role so they actually have access once they sign in.
  const { error: profileErr } = await supabaseAdmin
    .from('profiles')
    .insert({ email, role, created_by: callerEmail });
  if (profileErr) {
    return Response.json({ error: profileErr.message }, { status: 400 });
  }

  return Response.json({ ok: true });
}
