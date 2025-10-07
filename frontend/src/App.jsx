import React, { useEffect, useState } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export default function App() {
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState({ totalToday: 0, topRules: [] });
    const [blacklist, setBlacklist] = useState([]);
    const [phone, setPhone] = useState('');
    const [reason, setReason] = useState('manual');
    const [whitelist, setWhitelist] = useState([]);

    const load = async () => {
        const [ev, bl, wl, st] = await Promise.all([
            fetch(`${API_BASE}/api/events?limit=50`).then(r => r.json()),
            fetch(`${API_BASE}/api/blacklist`).then(r => r.json()),
            fetch(`${API_BASE}/api/whitelist`).then(r => r.json()), // NEW
            fetch(`${API_BASE}/api/stats`).then(r => r.json())
        ]);
        setEvents(ev); setBlacklist(bl); setWhitelist(wl); setStats(st);
    };

    useEffect(() => { load(); }, []);


    //Add Auto-Refresh to Frontend Dashboard
    useEffect(() => {
        load();
        const interval = setInterval(load, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

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

    const delWL = async (p) => {
        await fetch(`${API_BASE}/api/whitelist/${encodeURIComponent(p)}`, { method: 'DELETE' });
        load();
    };

    return (
        <div className="app-container">

            <h1>WA Anti-Spam Admin {import.meta.env.MODE === 'development' && '<🧪 DEV MODE>'}</h1>
            <section className="stats-grid">
                <div className="card">
                    <h3>Stats (today)</h3>
                    <p>Blocked: <b>{stats.totalToday}</b></p>

                    <p>Total Messages: <b>{events.length}</b></p>
                    <ul>
                        {stats.topRules.map(r => (
                            <li key={r._id}>{r._id || '—'}: {r.count}</li>
                        ))}
                    </ul>
                </div>
                <div className="card">
                    <h3>Add to Blacklist</h3>
                    <form onSubmit={addBL}>
                        <div className="form-row">
                            <input placeholder="phone (e.g., 9725...@c.us or raw)" value={phone} onChange={e => setPhone(e.target.value)} />
                            <input placeholder="reason" value={reason} onChange={e => setReason(e.target.value)} />
                            <button type="submit">Add</button>
                        </div>
                    </form>
                </div>
            </section>

            <h2 className="section-title">Recent Events</h2>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Sender</th>
                            <th>Type</th>
                            <th>Decision</th>
                            <th>Rule</th>
                            <th>Excerpt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(e => (
                            <tr key={e._id}>
                                <td>{new Date(e.createdAt).toLocaleString()}</td>
                                <td>{e.sender}</td>
                                <td>{e.type}</td>
                                <td className={e.decision === 'block' ? 'decision-block' : 'decision-allow'}>
                                    {e.decision || e.status}
                                </td>
                                <td>{e.ruleId || '—'}</td>
                                <td>{(e.text || '').slice(0, 80)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h2 className="section-title">Blacklist</h2>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Phone</th>
                            <th>Reason</th>
                            <th>Rule</th>
                            <th>Added</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {blacklist.map(b => (
                            <tr key={b._id}>
                                <td>{b.phone}</td>
                                <td>{b.reason}</td>
                                <td>{b.ruleId || '—'}</td>
                                <td>{new Date(b.createdAt).toLocaleString()}</td>
                                <td>
                                    <button onClick={() => delBL(b.phone)}>Remove</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


            <h2 className="section-title">Whitelist</h2>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Phone</th>
                            <th>Note</th>
                            <th>Added</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {whitelist.map(w => (
                            <tr key={w._id}>
                                <td>{w.phone}</td>
                                <td>{w.note}</td>
                                <td>{new Date(w.createdAt).toLocaleString()}</td>
                                <td>
                                    <button onClick={() => delWL(w.phone)}>Remove</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
