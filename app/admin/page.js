'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';
import { supabase } from '../../lib/supabaseClient';

export default function AdminPage() {
  const { session, loading, isAdmin, email } = useAuth();
  const [tab, setTab] = useState('universities');

  if (loading) {
    return <div className="wrap">Checking access…</div>;
  }

  if (!session) {
    return (
      <div className="wrap">
        <h1>Admin</h1>
        <p>You need to sign in to make changes.</p>
        <Link className="btn btn-primary" href="/admin/login">Sign in</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="wrap">
        <h1>Admin</h1>
        <p>
          You&apos;re signed in as <b>{email}</b>, but this email isn&apos;t on the
          admin allowlist yet. Ask an existing admin to add it in Supabase
          (Table Editor → <code>admins</code> → Insert row).
        </p>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    );
  }

  return (
    <div>
      <nav className="nav">
        <Link href="/">Home</Link>
        <div className="spacer" />
        <span className="who">Signed in as {email}</span>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </nav>
      <div className="wrap">
        <h1>Admin dashboard</h1>
        <div className="sub">Changes save straight to the database and appear on the public site immediately.</div>
        <div className="tabs">
          <button className={`tab-btn ${tab === 'universities' ? 'active' : ''}`} onClick={() => setTab('universities')}>Universities</button>
          <button className={`tab-btn ${tab === 'programs' ? 'active' : ''}`} onClick={() => setTab('programs')}>Programs</button>
        </div>
        {tab === 'universities' && <UniversitiesAdmin />}
        {tab === 'programs' && <ProgramsAdmin />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Universities
// ─────────────────────────────────────────────

function blankUniversity() {
  return {
    id: null,
    slug: '',
    name: '',
    tags: [],
    facts: { status: '', established: '', qs_world: '', motto: '', location: '', website: '' },
    requirements: '',
    scholarships: '',
    sections: [],
  };
}

function UniversitiesAdmin() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null); // full row being edited, or null
  const [status, setStatus] = useState(null);

  async function refresh() {
    const { data, error } = await supabase.from('universities').select('id, slug, name').order('name');
    if (!error) setList(data);
  }

  useEffect(() => { refresh(); }, []);

  async function startEdit(id) {
    setStatus(null);
    if (id === 'new') {
      setEditing(blankUniversity());
      return;
    }
    const { data, error } = await supabase.from('universities').select('*').eq('id', id).single();
    if (error) { setStatus({ type: 'err', msg: error.message }); return; }
    setEditing({
      ...data,
      facts: { status: '', established: '', qs_world: '', motto: '', location: '', website: '', ...(data.facts || {}) },
    });
  }

  async function save() {
    setStatus(null);
    const payload = {
      slug: editing.slug.trim(),
      name: editing.name.trim(),
      tags: editing.tags,
      facts: editing.facts,
      requirements: editing.requirements,
      scholarships: editing.scholarships,
      sections: editing.sections,
    };
    let res;
    if (editing.id) {
      res = await supabase.from('universities').update(payload).eq('id', editing.id);
    } else {
      res = await supabase.from('universities').insert(payload);
    }
    if (res.error) { setStatus({ type: 'err', msg: res.error.message }); return; }
    setStatus({ type: 'ok', msg: 'Saved.' });
    setEditing(null);
    refresh();
  }

  async function remove(id) {
    if (!confirm('Delete this university and all its programs? This cannot be undone.')) return;
    const { error } = await supabase.from('universities').delete().eq('id', id);
    if (error) { setStatus({ type: 'err', msg: error.message }); return; }
    setEditing(null);
    refresh();
  }

  const filtered = list.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()));

  if (editing) {
    return <UniversityForm editing={editing} setEditing={setEditing} onSave={save} onCancel={() => setEditing(null)} onDelete={editing.id ? () => remove(editing.id) : null} status={status} />;
  }

  return (
    <div>
      <div className="controls">
        <input type="text" placeholder="Search universities" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary" onClick={() => startEdit('new')}>+ Add university</button>
      </div>
      {status && <div className={status.type === 'err' ? 'err' : 'ok'}>{status.msg}</div>}
      <table className="admin-table">
        <thead><tr><th>Name</th><th>Slug</th><th></th></tr></thead>
        <tbody>
          {filtered.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.slug}</td>
              <td><button className="btn" onClick={() => startEdit(u.id)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UniversityForm({ editing, setEditing, onSave, onCancel, onDelete, status }) {
  function setFact(key, value) {
    setEditing({ ...editing, facts: { ...editing.facts, [key]: value } });
  }
  function setSection(i, key, value) {
    const sections = [...editing.sections];
    sections[i] = { ...sections[i], [key]: value };
    setEditing({ ...editing, sections });
  }
  function addSection() {
    setEditing({ ...editing, sections: [...editing.sections, { title: '', content: '' }] });
  }
  function removeSection(i) {
    setEditing({ ...editing, sections: editing.sections.filter((_, idx) => idx !== i) });
  }

  return (
    <div>
      <button className="btn" onClick={onCancel} style={{ marginBottom: 12 }}>&larr; Back to list</button>
      {status && <div className={status.type === 'err' ? 'err' : 'ok'}>{status.msg}</div>}

      <div className="form-row">
        <label>Name</label>
        <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
      </div>
      <div className="form-row">
        <label>Slug (used in the profile URL — lowercase, hyphens only)</label>
        <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
      </div>
      <div className="form-row">
        <label>Tags (comma-separated)</label>
        <input
          value={editing.tags.join(', ')}
          onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
        />
      </div>

      <div className="form-row">
        <label>Status</label>
        <input value={editing.facts.status} onChange={(e) => setFact('status', e.target.value)} />
      </div>
      <div className="form-row">
        <label>Established</label>
        <input value={editing.facts.established} onChange={(e) => setFact('established', e.target.value)} />
      </div>
      <div className="form-row">
        <label>QS World Ranking</label>
        <input value={editing.facts.qs_world} onChange={(e) => setFact('qs_world', e.target.value)} />
      </div>
      <div className="form-row">
        <label>Motto</label>
        <input value={editing.facts.motto} onChange={(e) => setFact('motto', e.target.value)} />
      </div>
      <div className="form-row">
        <label>Location</label>
        <input value={editing.facts.location} onChange={(e) => setFact('location', e.target.value)} />
      </div>
      <div className="form-row">
        <label>Website</label>
        <input value={editing.facts.website} onChange={(e) => setFact('website', e.target.value)} />
      </div>

      <div className="form-row">
        <label>Admission Requirements</label>
        <textarea value={editing.requirements} onChange={(e) => setEditing({ ...editing, requirements: e.target.value })} />
      </div>
      <div className="form-row">
        <label>Scholarships &amp; Financial Aid</label>
        <textarea value={editing.scholarships} onChange={(e) => setEditing({ ...editing, scholarships: e.target.value })} />
      </div>

      <div className="form-row">
        <label>Other profile sections</label>
        {editing.sections.map((s, i) => (
          <div key={i} className="card">
            <input
              placeholder="Section title"
              value={s.title}
              onChange={(e) => setSection(i, 'title', e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <textarea
              placeholder="Section content"
              value={s.content}
              onChange={(e) => setSection(i, 'content', e.target.value)}
            />
            <button className="btn btn-danger" onClick={() => removeSection(i)} style={{ marginTop: 8 }}>Remove section</button>
          </div>
        ))}
        <button className="btn" onClick={addSection}>+ Add section</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button className="btn btn-primary" onClick={onSave}>Save</button>
        {onDelete && <button className="btn btn-danger" onClick={onDelete}>Delete university</button>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Programs
// ─────────────────────────────────────────────

function blankProgram(universityId) {
  return { id: null, university_id: universityId || '', program: '', fields: {} };
}

function ProgramsAdmin() {
  const [universities, setUniversities] = useState([]);
  const [uniFilter, setUniFilter] = useState('');
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState(null);

  async function refreshUnis() {
    const { data } = await supabase.from('universities').select('id, slug, name').order('name');
    setUniversities(data || []);
  }

  async function refreshPrograms() {
    let query = supabase.from('programs').select('id, program, fields, university_id, universities(name)').order('program');
    if (uniFilter) query = query.eq('university_id', uniFilter);
    const { data, error } = await query;
    if (!error) setList(data);
  }

  useEffect(() => { refreshUnis(); }, []);
  useEffect(() => { refreshPrograms(); }, [uniFilter]);

  function startEdit(row) {
    setStatus(null);
    if (row === 'new') {
      setEditing(blankProgram(uniFilter));
      return;
    }
    setEditing({ id: row.id, university_id: row.university_id, program: row.program, fields: { ...row.fields } });
  }

  async function save() {
    setStatus(null);
    if (!editing.university_id) { setStatus({ type: 'err', msg: 'Choose a university.' }); return; }
    const payload = { university_id: editing.university_id, program: editing.program.trim(), fields: editing.fields };
    let res;
    if (editing.id) res = await supabase.from('programs').update(payload).eq('id', editing.id);
    else res = await supabase.from('programs').insert(payload);
    if (res.error) { setStatus({ type: 'err', msg: res.error.message }); return; }
    setStatus({ type: 'ok', msg: 'Saved.' });
    setEditing(null);
    refreshPrograms();
  }

  async function remove(id) {
    if (!confirm('Delete this program?')) return;
    const { error } = await supabase.from('programs').delete().eq('id', id);
    if (error) { setStatus({ type: 'err', msg: error.message }); return; }
    setEditing(null);
    refreshPrograms();
  }

  const filtered = list.filter((p) => p.program.toLowerCase().includes(q.toLowerCase()));

  if (editing) {
    return (
      <ProgramForm
        editing={editing}
        setEditing={setEditing}
        universities={universities}
        onSave={save}
        onCancel={() => setEditing(null)}
        onDelete={editing.id ? () => remove(editing.id) : null}
        status={status}
      />
    );
  }

  return (
    <div>
      <div className="controls">
        <select value={uniFilter} onChange={(e) => setUniFilter(e.target.value)}>
          <option value="">All universities</option>
          {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <input type="text" placeholder="Search programs" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary" onClick={() => startEdit('new')}>+ Add program</button>
      </div>
      {status && <div className={status.type === 'err' ? 'err' : 'ok'}>{status.msg}</div>}
      <table className="admin-table">
        <thead><tr><th>Program</th><th>University</th><th></th></tr></thead>
        <tbody>
          {filtered.slice(0, 200).map((p) => (
            <tr key={p.id}>
              <td>{p.program}</td>
              <td>{p.universities?.name}</td>
              <td><button className="btn" onClick={() => startEdit(p)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length > 200 && <div className="count">Showing first 200 — search to narrow down.</div>}
    </div>
  );
}

function ProgramForm({ editing, setEditing, universities, onSave, onCancel, onDelete, status }) {
  const fieldEntries = Object.entries(editing.fields);

  function setFieldKey(i, newKey) {
    const entries = [...fieldEntries];
    entries[i] = [newKey, entries[i][1]];
    setEditing({ ...editing, fields: Object.fromEntries(entries) });
  }
  function setFieldValue(i, newValue) {
    const entries = [...fieldEntries];
    entries[i] = [entries[i][0], newValue];
    setEditing({ ...editing, fields: Object.fromEntries(entries) });
  }
  function addField() {
    setEditing({ ...editing, fields: { ...editing.fields, ['New field']: '' } });
  }
  function removeField(i) {
    const entries = fieldEntries.filter((_, idx) => idx !== i);
    setEditing({ ...editing, fields: Object.fromEntries(entries) });
  }

  return (
    <div>
      <button className="btn" onClick={onCancel} style={{ marginBottom: 12 }}>&larr; Back to list</button>
      {status && <div className={status.type === 'err' ? 'err' : 'ok'}>{status.msg}</div>}

      <div className="form-row">
        <label>University</label>
        <select value={editing.university_id} onChange={(e) => setEditing({ ...editing, university_id: e.target.value })} style={{ width: '100%' }}>
          <option value="">— choose —</option>
          {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <div className="form-row">
        <label>Program name</label>
        <input value={editing.program} onChange={(e) => setEditing({ ...editing, program: e.target.value })} />
      </div>

      <div className="form-row">
        <label>Fee / detail fields</label>
        {fieldEntries.map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={k} onChange={(e) => setFieldKey(i, e.target.value)} placeholder="Field name" style={{ flex: 1 }} />
            <input value={v} onChange={(e) => setFieldValue(i, e.target.value)} placeholder="Value" style={{ flex: 1 }} />
            <button className="btn btn-danger" onClick={() => removeField(i)}>Remove</button>
          </div>
        ))}
        <button className="btn" onClick={addField}>+ Add field</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button className="btn btn-primary" onClick={onSave}>Save</button>
        {onDelete && <button className="btn btn-danger" onClick={onDelete}>Delete program</button>}
      </div>
    </div>
  );
}
