'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined,
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div>
      <nav className="nav">
        <Link href="/">Home</Link>
      </nav>
      <div className="wrap" style={{ maxWidth: 420 }}>
        <h1>Admin sign-in</h1>
        <div className="sub">
          Enter your email and we&apos;ll send you a one-time sign-in link. Only
          emails on the admin allowlist can make changes once signed in.
        </div>

        {sent ? (
          <div className="ok">
            Check {email} for a sign-in link. Open it on this device to finish signing in.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {error && <div className="err">{error}</div>}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
