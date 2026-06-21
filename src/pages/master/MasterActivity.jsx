import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../api';
import BackButton from '../../components/BackButton';
import '../../styles/admin.css';

/* ── helpers ─────────────────────────────────────────────── */
const timeAgo = (ts) => {
    if (!ts) return '—';
    const date = new Date(ts);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60)   return `${Math.max(1, Math.floor(diff))}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ICONS = {
    product_added:    { icon: 'fa-box-open',   color: '#34a853', bg: '#e6f4ea', label: 'Product Added' },
    product_updated:  { icon: 'fa-edit',        color: '#1a73e8', bg: '#e8f0fe', label: 'Product Updated' },
    design_uploaded:  { icon: 'fa-palette',     color: '#9c27b0', bg: '#f3e5f5', label: 'Design Uploaded' },
    design_approved:  { icon: 'fa-check-circle',color: '#34a853', bg: '#e6f4ea', label: 'Design Approved' },
    design_rejected:  { icon: 'fa-times-circle',color: '#ea4335', bg: '#fce8e6', label: 'Design Rejected' },
    order_placed:     { icon: 'fa-shopping-cart',color: '#C5A059', bg: '#fdf6e3', label: 'Order Placed' },
    print_styles:     { icon: 'fa-print',        color: '#00796b', bg: '#e0f2f1', label: 'Print Styles Updated' },
    designer_joined:  { icon: 'fa-user-plus',    color: '#1a73e8', bg: '#e8f0fe', label: 'Designer Joined' },
    mfg_joined:       { icon: 'fa-industry',     color: '#e65100', bg: '#fff3e0', label: 'Manufacturer Joined' },
};

/* ── Component ───────────────────────────────────────────── */
export default function MasterActivity() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('all'); // 'all' | 'mfg' | 'designer'
    const [refreshing, setRefreshing] = useState(false);

    const fetchActivity = useCallback(async () => {
        setRefreshing(true);
        try {
            const data = await apiFetch('/api/activity');
            setEvents(data || []);
        } catch (err) {
            console.error('Activity fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchActivity(); }, [fetchActivity]);

    const filtered = tab === 'all' ? events : events.filter(e => e.role === tab);
    const counts = {
        all: events.length,
        mfg: events.filter(e => e.role === 'mfg').length,
        designer: events.filter(e => e.role === 'designer').length,
    };

    return (
        <main className="adm-page">
            <BackButton />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div>
                    <h1 className="adm-page__title">ACTIVITY MONITOR</h1>
                    <p className="adm-page__subtitle">Real-time feed of manufacturer and designer activity</p>
                </div>
                <button
                    onClick={fetchActivity}
                    disabled={refreshing}
                    style={{
                        padding: '9px 18px', background: 'var(--admin-dark)', color: 'white',
                        border: 'none', borderRadius: 4, cursor: refreshing ? 'not-allowed' : 'pointer',
                        fontFamily: "'Montserrat', sans-serif", fontSize: '0.72rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 7, letterSpacing: 0.5,
                    }}
                >
                    <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`} />
                    {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, marginTop: 8 }}>
                {[
                    { key: 'all', label: 'All Activity', icon: 'fa-list' },
                    { key: 'mfg', label: 'Manufacturers', icon: 'fa-industry' },
                    { key: 'designer', label: 'Designers', icon: 'fa-palette' },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            padding: '8px 16px',
                            background: tab === t.key ? 'var(--admin-dark)' : 'white',
                            color: tab === t.key ? 'var(--admin-gold)' : 'var(--admin-muted)',
                            border: `1px solid ${tab === t.key ? 'var(--admin-dark)' : 'var(--admin-border)'}`,
                            borderRadius: 4, cursor: 'pointer',
                            fontFamily: "'Montserrat', sans-serif", fontSize: '0.72rem', fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: 7,
                            transition: 'all 0.15s',
                        }}
                    >
                        <i className={`fas ${t.icon}`} />
                        {t.label}
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: tab === t.key ? 'var(--admin-gold)' : '#f0f0f0',
                            color: tab === t.key ? '#121212' : '#555',
                            borderRadius: 10, padding: '1px 7px', fontSize: '0.65rem', fontWeight: 700,
                        }}>{counts[t.key]}</span>
                    </button>
                ))}
            </div>

            {/* Activity Feed */}
            {loading ? (
                <div className="adm-loading"><div className="adm-spinner"></div><p>Loading activity…</p></div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--admin-muted)', fontFamily: "'Montserrat', sans-serif" }}>
                    <i className="fas fa-chart-line" style={{ fontSize: '2.5rem', color: '#ddd', display: 'block', marginBottom: 16 }} />
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>No activity found for this filter.</p>
                </div>
            ) : (
                <div style={{
                    background: 'white',
                    border: '1px solid var(--admin-border)',
                    borderRadius: 6,
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                    {filtered.map((evt, idx) => {
                        const meta = ICONS[evt.type] || ICONS.product_added;
                        return (
                            <div
                                key={evt.id}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 16,
                                    padding: '14px 20px',
                                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--admin-border)' : 'none',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                            >
                                {/* Icon */}
                                <div style={{
                                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                                    background: meta.bg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <i className={`fas ${meta.icon}`} style={{ color: meta.color, fontSize: '0.85rem' }} />
                                </div>

                                {/* Text */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem', color: 'var(--admin-text)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {evt.title}
                                    </div>
                                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.72rem', color: 'var(--admin-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {evt.subtitle}
                                    </div>
                                </div>

                                {/* Role badge */}
                                <span style={{
                                    flexShrink: 0,
                                    padding: '2px 10px',
                                    borderRadius: 10,
                                    fontFamily: "'Montserrat', sans-serif", fontSize: '0.62rem', fontWeight: 700,
                                    textTransform: 'uppercase', letterSpacing: 0.5,
                                    background: evt.role === 'mfg' ? '#fff3e0' : '#f3e5f5',
                                    color: evt.role === 'mfg' ? '#e65100' : '#9c27b0',
                                }}>
                                    {evt.role === 'mfg' ? 'Manufacturer' : 'Designer'}
                                </span>

                                {/* Time */}
                                <span style={{
                                    flexShrink: 0, minWidth: 72, textAlign: 'right',
                                    fontFamily: "'Montserrat', sans-serif", fontSize: '0.7rem', color: 'var(--admin-muted)',
                                }}>
                                    {timeAgo(evt.ts)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
