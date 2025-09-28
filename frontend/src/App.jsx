import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export default function App() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalToday: 0, topRules: [] });
  const [blacklist, setBlacklist] = useState([]);
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('manual');

  const load = async () => {
    const [ev, bl, st] = await Promise.all([
      fetch(`${API_BASE}/api/events?limit=50`).then(r => r.json()),
      fetch(`${API_BASE}/api/blacklist`).then(r => r.json()),
      fetch(`${API_BASE}/api/stats`).then(r => r.json())
    ]);
    setEvents(ev); setBlacklist(bl); setStats(st);
  };

  useEffect(() => { load(); }, []);

  const addBL = async (e) => {
    e.preventDefault();
    if (!phone) return;
    await fetch(`${API_BASE}/api/blacklist`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, reason })
    });
    setPhone(''); setReason('manual');
    load();
  };

  const delBL = async (p) => {
    await fetch(`${API_BASE}/api/blacklist/${encodeURIComponent(p)}`, { method: 'DELETE' });
    load();
  };

  return (
    <div style={{ fontFamily: 'ui-sans-serif, system-ui', padding: 16, maxWidth: 1100, margin: '0 auto' }}>
      <h1>WA Anti-Spam Admin</h1>
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <h3>Stats (today)</h3>
          <p>Blocked: <b>{stats.totalToday}</b></p>
          <ul>
            {stats.topRules.map(r => (
              <li key={r._id}>{r._id || '—'}: {r.count}</li>
            ))}
          </ul>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <h3>Add to Blacklist</h3>
          <form onSubmit={addBL}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="phone (e.g., 9725...@c.us or raw)" value={phone} onChange={e => setPhone(e.target.value)} style={{ flex: 1 }} />
              <input placeholder="reason" value={reason} onChange={e => setReason(e.target.value)} />
              <button type="submit">Add</button>
            </div>
          </form>
        </div>
      </section>

      <h2 style={{ marginTop: 24 }}>Recent Events</h2>
      <div style={{ overflow: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Time</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Sender</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Type</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Decision</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Rule</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Excerpt</th>
            </tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr key={e._id}>
                <td style={{ padding: 8 }}>{new Date(e.createdAt).toLocaleString()}</td>
                <td style={{ padding: 8 }}>{e.sender}</td>
                <td style={{ padding: 8 }}>{e.type}</td>
                <td style={{ padding: 8 }}>{e.decision || e.status}</td>
                <td style={{ padding: 8 }}>{e.ruleId || '—'}</td>
                <td style={{ padding: 8 }}>{(e.text || '').slice(0, 80)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: 24 }}>Blacklist</h2>
      <div style={{ border: '1px solid #eee', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Phone</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Reason</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Rule</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Added</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blacklist.map(b => (
              <tr key={b._id}>
                <td style={{ padding: 8 }}>{b.phone}</td>
                <td style={{ padding: 8 }}>{b.reason}</td>
                <td style={{ padding: 8 }}>{b.ruleId || '—'}</td>
                <td style={{ padding: 8 }}>{new Date(b.createdAt).toLocaleString()}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => delBL(b.phone)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
