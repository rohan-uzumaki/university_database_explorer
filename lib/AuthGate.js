'use client';

import Link from 'next/link';
import { useAuth } from './useAuth';
import { supabase } from './supabaseClient';

// Wraps any page that should require login. Shows a sign-in prompt if the
// visitor isn't logged in, a "no access yet" message if they're logged in
// but have no profile, and otherwise renders the page normally.
export default function AuthGate({ children }) {
  const { loading, hasAccess, email } = useAuth();

  if (loading) {
    return <div className="wrap">Loading…</div>;
  }

  if (!hasAccess && !email) {
    return (
      <div className="wrap" style={{ maxWidth: 420 }}>
        <h1>Sign in required</h1>
        <div className="sub">This site is only available to people an admin has given access to.</div>
        <Link className="btn btn-primary" href="/login">Sign in</Link>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="wrap" style={{ maxWidth: 480 }}>
        <h1>No access yet</h1>
        <p>
          You&apos;re signed in as <b>{email}</b>, but you don&apos;t have access
          to this site yet. Ask an admin to add you.
        </p>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    );
  }

  return children;
}
