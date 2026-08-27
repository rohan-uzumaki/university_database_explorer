'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import AuthGate from '../lib/AuthGate';

export default function HomePage() {
  return (
    <AuthGate>
      <Suspense fallback={<div className="wrap">Loading…</div>}>
        <HomePageInner />
      </Suspense>
    </AuthGate>
  );
}

function HomePageInner() {
  const { email } = useAuth();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'universities' ? 'universities' : 'programs');
  const [universities, setUniversities] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initialUniSlug = searchParams.get('uni') || '';

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [uniRes, progRes] = await Promise.all([
        supabase.from('universities').select('id, slug, name, tags, facts').order('name'),
        supabase.from('programs').select('id, program, fields, university_id, universities(slug, name)'),
      ]);
      if (uniRes.error) setError(uniRes.error.message);
      else setUniversities(uniRes.data);
      if (progRes.error) setError(progRes.error.message);
      else setPrograms(progRes.data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <nav className="nav">
        <Link href="/">Home</Link>
        <div className="spacer" />
        <span className="who">{email}</span>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </nav>
      <div className="wrap">
        <h1>Malaysia University &amp; Program Explorer</h1>
        <div className="sub">
          {loading ? 'Loading…' : `${universities.length} universities · ${programs.length} programs`}
        </div>

        <div className="tabs">
          <button className={`tab-btn ${tab === 'programs' ? 'active' : ''}`} onClick={() => setTab('programs')}>Programs</button>
          <button className={`tab-btn ${tab === 'universities' ? 'active' : ''}`} onClick={() => setTab('universities')}>Universities</button>
        </div>

        {error && <div className="err">{error}</div>}

        {tab === 'programs' && <ProgramsTab programs={programs} loading={loading} initialUniSlug={initialUniSlug} />}
        {tab === 'universities' && <UniversitiesTab universities={universities} loading={loading} />}
      </div>
    </div>
  );
}

function ProgramsTab({ programs, loading, initialUniSlug }) {
  const [q, setQ] = useState('');
  const [uniFilter, setUniFilter] = useState(initialUniSlug || '');

  const uniOptions = useMemo(() => {
    const seen = new Map();
    for (const p of programs) {
      const u = p.universities;
      if (u && !seen.has(u.slug)) seen.set(u.slug, u.name);
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [programs]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return programs
      .filter((p) => {
        if (uniFilter && p.universities?.slug !== uniFilter) return false;
        if (!term) return true;
        return (
          p.program?.toLowerCase().includes(term) ||
          p.universities?.name?.toLowerCase().includes(term)
        );
      })
      .slice(0, 300);
  }, [programs, q, uniFilter]);

  return (
    <div>
      <div className="controls">
        <input
          type="text"
          placeholder="Search program or university (e.g. 'nursing', 'UPM', 'business')"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={uniFilter} onChange={(e) => setUniFilter(e.target.value)}>
          <option value="">All universities</option>
          {uniOptions.map(([slug, name]) => (
            <option key={slug} value={slug}>{name}</option>
          ))}
        </select>
      </div>
      <div className="count">
        {loading ? '' : `${filtered.length}${filtered.length === 300 ? '+ shown (refine your search)' : ' result' + (filtered.length === 1 ? '' : 's')}`}
      </div>
      {!loading && filtered.length === 0 && <div className="empty">No matches. Try a different term.</div>}
      {filtered.map((p) => (
        <div className="card" key={p.id}>
          {p.universities && (
            <Link className="uni" href={`/university/${p.universities.slug}`}>
              {p.universities.name} &rsaquo; view profile
            </Link>
          )}
          <div className="prog">{p.program}</div>
          <div className="fields">
            {Object.entries(p.fields || {}).map(([k, v]) => (
              <div className="field" key={k}>
                <span className="label">{k}</span>
                <span className="value">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function UniversitiesTab({ universities, loading }) {
  const [q, setQ] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const allTags = useMemo(() => {
    const s = new Set();
    universities.forEach((u) => (u.tags || []).forEach((t) => s.add(t)));
    return [...s].sort();
  }, [universities]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return universities.filter((u) => {
      if (tagFilter && !(u.tags || []).includes(tagFilter)) return false;
      if (!term) return true;
      return u.name.toLowerCase().includes(term);
    });
  }, [universities, q, tagFilter]);

  return (
    <div>
      <div className="controls">
        <input type="text" placeholder="Search university name" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="">All types</option>
          {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="count">{loading ? '' : `${filtered.length} universit${filtered.length === 1 ? 'y' : 'ies'}`}</div>
      {!loading && filtered.length === 0 && <div className="empty">No matches.</div>}
      {filtered.map((u) => {
        const f = u.facts || {};
        return (
          <div className="uni-card" key={u.id}>
            <Link className="name-link" href={`/university/${u.slug}`}>{u.name}</Link>
            <div className="facts-row">
              {f.status && <span><b>{f.status}</b></span>}
              {f.established && <span>Est. {f.established}</span>}
              {f.qs_world && <span>QS {f.qs_world}</span>}
            </div>
            <div className="tagrow">
              {(u.tags || []).map((t) => <span className="tagchip" key={t}>{t}</span>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
