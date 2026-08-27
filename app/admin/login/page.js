'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Admin sign-in now uses the same general login as the rest of the site —
// redirect here so any old bookmarks/links still work.
export default function AdminLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return <div className="wrap">Redirecting…</div>;
}
