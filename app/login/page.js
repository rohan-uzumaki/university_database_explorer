'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    // Record the login for the admin activity log. Best-effort — if this
    // fails (e.g. no profile yet) we still let them through to see the
    // "no access" screen rather than blocking sign-in itself.
    await supabase.from('login_log').insert({ email: data.user.email });
    setLoading(false);
    router.push('/');
  }

  return (
    <div className="wrap" style={{ maxWidth: 420 }}>
      <h1>Sign in</h1>
      <div className="sub">
        Use the email and password an admin set up for you.
      </div>

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
        <div className="form-row">
          <label>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && <div className="err">{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
