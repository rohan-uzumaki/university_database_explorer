'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// Tracks the Supabase session and whether the signed-in user is on the
// admins allowlist. Being logged in and being an admin are different things —
// anyone can sign in with a magic link, but only emails present in the
// `admins` table can read/write via RLS, so isAdmin reflects that check.
export function useAuth() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

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
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }
      setCheckingAdmin(true);
      const { data, error } = await supabase
        .from('admins')
        .select('email')
        .eq('email', session.user.email)
        .maybeSingle();
      if (!cancelled) {
        setIsAdmin(!!data && !error);
        setCheckingAdmin(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, [session]);

  return {
    session,
    loading: session === undefined || checkingAdmin,
    isAdmin,
    email: session?.user?.email || null,
  };
}
