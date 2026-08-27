'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function UniversityProfilePage() {
  const { slug } = useParams();
  const [uni, setUni] = useState(null);
  const [programCount, setProgramCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) { setError(error.message); setLoading(false); return; }
      if (!data) { setError('University not found.'); setLoading(false); return; }
      setUni(data);
      const { count } = await supabase
        .from('programs')
        .select('id', { count: 'exact', head: true })
        .eq('university_id', data.id);
      setProgramCount(count || 0);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) return <div className="wrap">Loading…</div>;
  if (error) return <div className="wrap"><div className="err">{error}</div></div>;

  const f = uni.facts || {};
  const qf = [
    f.status && ['Status', f.status],
    f.established && ['Established', f.established],
    f.qs_world && ['QS World Ranking', f.qs_world],
    f.motto && ['Motto', f.motto],
    f.location && ['Location', f.location],
    f.website && ['Website', <a key="w" href={f.website} target="_blank" rel="noopener noreferrer">{f.website}</a>],
  ].filter(Boolean);

  return (
    <div>
      <nav className="nav">
        <Link href="/">Home</Link>
        <div className="spacer" />
        <Link href="/admin">Admin</Link>
      </nav>
      <div className="wrap">
        <Link href="/" className="btn" style={{ display: 'inline-block', marginBottom: 12, textDecoration: 'none' }}>
          &larr; Back to all universities
        </Link>

        <div className="profile-header">
          <h2>{uni.name}</h2>
          <div className="tagrow">
            {(uni.tags || []).map((t) => <span className="tagchip" key={t}>{t}</span>)}
          </div>
          <div className="quickfacts">
            {qf.map(([label, value]) => (
              <div key={label}>
                <div className="qf-label">{label}</div>
                <div className="qf-value">{value}</div>
              </div>
            ))}
          </div>
          {programCount > 0 && (
            <Link className="view-programs-link" href={`/?tab=programs&uni=${uni.slug}`}>
              View {programCount} program{programCount === 1 ? '' : 's'} &amp; fees &rsaquo;
            </Link>
          )}
        </div>

        {uni.requirements && (
          <div className="section highlight-section">
            <h3>Admission Requirements</h3>
            <div className="body">{uni.requirements}</div>
          </div>
        )}

        {uni.scholarships && (
          <div className="section highlight-section">
            <h3>Scholarships &amp; Financial Aid</h3>
            <div className="body">{uni.scholarships}</div>
          </div>
        )}

        {(uni.sections || []).map((s, i) => (
          <div className="section" key={i}>
            <h3>{s.title}</h3>
            <div className="body">{s.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
