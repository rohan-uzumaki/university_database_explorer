'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// Tracks the Supabase session and the signed-in user's role from the
// `profiles` table: 'viewer' (can browse the site), 'editor' (can also
// add/edit/delete data), 'admin' (editor + can manage users and view logs).
// No row in `profiles` at all means no access to anything.
export function useAuth() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [role, setRole] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!session) {
        setRole(null);
        setCheckingRole(false);
        return;
      }
      setCheckingRole(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', session.user.email)
        .maybeSingle();
      if (!cancelled) {
        setRole(!error && data ? data.role : null);
        setCheckingRole(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, [session]);

  return {
    session,
    loading: session === undefined || checkingRole,
    role,                                        // 'viewer' | 'editor' | 'admin' | null
    hasAccess: !!role,                            // any profile at all
    isEditor: role === 'editor' || role === 'admin',
    isAdmin: role === 'admin',
    email: session?.user?.email || null,
  };
}
