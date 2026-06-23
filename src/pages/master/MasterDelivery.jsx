import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../api';
import { COUNTRIES } from '../../constants/countries';
import '../../styles/admin.css';

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {toasts.map(t => (
                <div key={t.id} style={{
                    padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 13,
                    background: t.type === 'success' ? 'linear-gradient(135deg,#1a6b3a,#22863a)' : 'linear-gradient(135deg,#7f1d1d,#991b1b)',
                    color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', minWidth: 240,
                    borderLeft: `4px solid ${t.type === 'success' ? '#4ade80' : '#f87171'}`
                }}>
                    {t.type === 'success' ? '✅ ' : '❌ '}{t.msg}
                </div>
            ))}
        </div>
    );
}

const ZONE_LABELS = {
    india: '🇮🇳 India',
    usa:   '🇺🇸 United States',
    row:   '🌍 Rest of World',
};

const ZONE_COLORS = {
    india: '#3b82f6',
    usa:   '#ef4444',
    row:   '#8b5cf6',
};

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MasterDelivery() {
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [toasts, setToasts]     = useState([]);
    const [search, setSearch]     = useState('');
    const [filterZone, setFilterZone] = useState('all');

    // Restricted country names set
    const [restricted, setRestricted] = useState(new Set());
    // Custom message
    const [restrictMsg, setRestrictMsg] = useState(
        "We currently don't deliver to your region. Please check back later or contact us."
    );

    // ── Toast helper ──────────────────────────────────────────────────────────
    const toast = useCallback((msg, type = 'success') => {
        const id = uid();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
    }, []);

    // ── Load ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        apiFetch('/api/settings')
            .then(data => {
                const dr = data?.delivery_restrictions;
                if (dr) {
                    setRestricted(new Set(dr.restricted_countries || []));
                    if (dr.message) setRestrictMsg(dr.message);
                }
            })
            .catch(() => toast('Failed to load delivery restrictions', 'error'))
            .finally(() => setLoading(false));
    }, []);

    // ── Save ─────────────────────────────────────────────────────────────────
    async function handleSave() {
        setSaving(true);
        try {
            await apiFetch('/api/settings/delivery_restrictions', {
                method: 'PUT',
                body: JSON.stringify({
                    value: {
                        restricted_countries: [...restricted],
                        message: restrictMsg,
                    }
                })
            });
            toast(`Saved — ${restricted.size} ${restricted.size === 1 ? 'country' : 'countries'} restricted`);
        } catch {
            toast('Failed to save restrictions', 'error');
        } finally {
            setSaving(false);
        }
    }

    // ── Toggle ───────────────────────────────────────────────────────────────
    function toggle(countryName) {
        setRestricted(p => {
            const next = new Set(p);
            if (next.has(countryName)) next.delete(countryName);
            else next.add(countryName);
            return next;
        });
    }

    function restrictZone(zone) {
        setRestricted(p => {
            const next = new Set(p);
            COUNTRIES.filter(c => c.zone === zone).forEach(c => next.add(c.name));
            return next;
        });
    }

    function allowZone(zone) {
        setRestricted(p => {
            const next = new Set(p);
            COUNTRIES.filter(c => c.zone === zone).forEach(c => next.delete(c.name));
            return next;
        });
    }

    function restrictAll() { setRestricted(new Set(COUNTRIES.map(c => c.name))); }
    function allowAll()    { setRestricted(new Set()); }

    // ── Filtered list ─────────────────────────────────────────────────────────
    const filtered = COUNTRIES.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchZone   = filterZone === 'all' || c.zone === filterZone ||
                            (filterZone === 'restricted' && restricted.has(c.name)) ||
                            (filterZone === 'allowed'    && !restricted.has(c.name));
        return matchSearch && matchZone;
    });

    const restrictedCount = restricted.size;
    const allowedCount    = COUNTRIES.length - restrictedCount;

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16, color: '#C5A059' }}>
                <div className="adm-spinner" />
                <p>Loading Delivery Restrictions…</p>
            </div>
        );
    }

    return (
        <div className="delv-root">
            <Toast toasts={toasts} />

            {/* ── Header ── */}
            <div className="delv-page-header">
                <div>
                    <h1>Delivery Management</h1>
                    <p>Restrict shipping destinations. Blocked countries will see a "Not Deliverable" message and cannot place orders.</p>
                </div>
                <button className="delv-save-btn" onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <><div className="delv-spinner" />Saving…</>
                    ) : (
                        <><i className="fas fa-save"></i>Save Restrictions</>
                    )}
                </button>
            </div>

            {/* ── Stats ── */}
            <div className="delv-stats">
                <div className="delv-stat delv-stat--allowed">
                    <div className="delv-stat__num">{allowedCount}</div>
                    <div className="delv-stat__label">
                        <i className="fas fa-check-circle"></i> Countries Allowed
                    </div>
                </div>
                <div className="delv-stat delv-stat--restricted">
                    <div className="delv-stat__num">{restrictedCount}</div>
                    <div className="delv-stat__label">
                        <i className="fas fa-ban"></i> Countries Restricted
                    </div>
                </div>
                <div className="delv-stat delv-stat--total">
                    <div className="delv-stat__num">{COUNTRIES.length}</div>
                    <div className="delv-stat__label">
                        <i className="fas fa-globe"></i> Total Countries
                    </div>
                </div>
            </div>

            <div className="delv-body">
                {/* ── LEFT: Controls + List ── */}
                <div className="delv-col delv-col--main">

                    {/* Bulk Actions */}
                    <div className="delv-section">
                        <div className="delv-section__title">⚡ Bulk Actions</div>
                        <div className="delv-bulk-row">
                            <div className="delv-bulk-group">
                                <span className="delv-bulk-label">All Countries</span>
                                <button className="delv-btn delv-btn--allow" onClick={allowAll}>
                                    <i className="fas fa-check-circle"></i> Allow All
                                </button>
                                <button className="delv-btn delv-btn--restrict" onClick={restrictAll}>
                                    <i className="fas fa-ban"></i> Restrict All
                                </button>
                            </div>
                            {['india', 'usa', 'row'].map(zone => (
                                <div key={zone} className="delv-bulk-group">
                                    <span className="delv-bulk-label">{ZONE_LABELS[zone]}</span>
                                    <button className="delv-btn delv-btn--allow" onClick={() => allowZone(zone)}>
                                        Allow
                                    </button>
                                    <button className="delv-btn delv-btn--restrict" onClick={() => restrictZone(zone)}>
                                        Restrict
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Search + Filter */}
                    <div className="delv-search-row">
                        <div className="delv-search">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search country…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <select className="delv-filter" value={filterZone} onChange={e => setFilterZone(e.target.value)}>
                            <option value="all">All</option>
                            <option value="allowed">✅ Allowed</option>
                            <option value="restricted">🚫 Restricted</option>
                            <option value="india">🇮🇳 India</option>
                            <option value="usa">🇺🇸 USA</option>
                            <option value="row">🌍 Rest of World</option>
                        </select>
                    </div>

                    {/* Country List */}
                    <div className="delv-country-grid">
                        {filtered.length === 0 && (
                            <div className="delv-empty">No countries match your search.</div>
                        )}
                        {filtered.map(c => {
                            const isRestricted = restricted.has(c.name);
                            return (
                                <div
                                    key={c.code}
                                    className={`delv-country-card ${isRestricted ? 'delv-country-card--restricted' : 'delv-country-card--allowed'}`}
                                    onClick={() => toggle(c.name)}
                                    title={isRestricted ? 'Click to allow delivery' : 'Click to restrict delivery'}
                                >
                                    <div className="delv-country-card__left">
                                        <div className={`delv-zone-dot`} style={{ background: ZONE_COLORS[c.zone] }} />
                                        <span className="delv-country-name">{c.name}</span>
                                        <span className="delv-zone-badge" style={{ color: ZONE_COLORS[c.zone] }}>
                                            {c.zone.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className={`delv-toggle ${isRestricted ? 'delv-toggle--off' : 'delv-toggle--on'}`}>
                                        {isRestricted
                                            ? <><i className="fas fa-ban"></i> Restricted</>
                                            : <><i className="fas fa-check"></i> Allowed</>
                                        }
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── RIGHT: Message + Restricted List ── */}
                <div className="delv-col delv-col--side">

                    {/* Restriction Message */}
                    <div className="delv-section">
                        <div className="delv-section__title">💬 Restriction Message</div>
                        <p className="delv-section__desc">
                            This message is shown to customers in restricted countries when they try to checkout.
                        </p>
                        <textarea
                            className="delv-textarea"
                            rows={4}
                            value={restrictMsg}
                            onChange={e => setRestrictMsg(e.target.value)}
                            placeholder="Enter message for restricted customers…"
                        />
                        {/* Preview */}
                        <div className="delv-msg-preview">
                            <div className="delv-msg-preview__label">Preview (what customer sees):</div>
                            <div className="delv-msg-preview__box">
                                <i className="fas fa-ban"></i>
                                <div>
                                    <div className="delv-msg-preview__title">Not Deliverable</div>
                                    <div className="delv-msg-preview__text">{restrictMsg}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Restricted Countries List */}
                    <div className="delv-section">
                        <div className="delv-section__title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>🚫 Restricted Countries ({restrictedCount})</span>
                            {restrictedCount > 0 && (
                                <button className="delv-btn delv-btn--allow delv-btn--sm" onClick={allowAll}>
                                    Clear All
                                </button>
                            )}
                        </div>
                        {restrictedCount === 0 ? (
                            <div className="delv-empty">
                                <i className="fas fa-globe" style={{ fontSize: '2rem', marginBottom: 8, color: '#22c55e' }}></i>
                                <div>All countries are currently allowed.</div>
                            </div>
                        ) : (
                            <div className="delv-restricted-list">
                                {[...restricted].sort().map(name => (
                                    <div key={name} className="delv-restricted-tag">
                                        <span>{name}</span>
                                        <button onClick={() => toggle(name)} title="Allow this country">
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <style>{`
                /* ════ Delivery Management Page ════ */
                .delv-root {
                    padding: 28px 4%;
                    max-width: 1400px;
                    margin: 0 auto;
                    font-family: 'Montserrat', sans-serif;
                    color: var(--admin-text, #333);
                }
                .delv-page-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 28px;
                    flex-wrap: wrap;
                }
                .delv-page-header h1 {
                    font-family: 'Cinzel', serif;
                    font-size: 1.6rem;
                    font-weight: 700;
                    color: var(--admin-dark, #111);
                    margin: 0 0 6px;
                }
                .delv-page-header p {
                    font-size: 0.82rem;
                    color: #888;
                    margin: 0;
                    max-width: 500px;
                }
                .delv-save-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 14px 28px;
                    background: linear-gradient(135deg, #C5A059, #a08040);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-family: 'Cinzel', serif;
                    font-size: 0.88rem;
                    font-weight: 700;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: all 0.25s;
                    box-shadow: 0 4px 15px rgba(197,160,89,0.3);
                    flex-shrink: 0;
                }
                .delv-save-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(197,160,89,0.45); }
                .delv-save-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                .delv-spinner {
                    width: 16px; height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: delv-spin 0.7s linear infinite;
                }
                @keyframes delv-spin { to { transform: rotate(360deg); } }

                /* Stats */
                .delv-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 28px;
                }
                .delv-stat {
                    border-radius: 14px;
                    padding: 20px 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    border: 1px solid transparent;
                }
                .delv-stat--allowed    { background: linear-gradient(135deg,#f0fdf4,#dcfce7); border-color: #86efac; }
                .delv-stat--restricted { background: linear-gradient(135deg,#fff1f2,#ffe4e6); border-color: #fca5a5; }
                .delv-stat--total      { background: linear-gradient(135deg,#f0f9ff,#e0f2fe); border-color: #93c5fd; }
                .delv-stat__num {
                    font-family: 'Cinzel', serif;
                    font-size: 2rem;
                    font-weight: 700;
                    line-height: 1;
                }
                .delv-stat--allowed    .delv-stat__num { color: #15803d; }
                .delv-stat--restricted .delv-stat__num { color: #dc2626; }
                .delv-stat--total      .delv-stat__num { color: #0369a1; }
                .delv-stat__label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    color: #666;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .delv-stat--allowed    .delv-stat__label i { color: #22c55e; }
                .delv-stat--restricted .delv-stat__label i { color: #ef4444; }
                .delv-stat--total      .delv-stat__label i { color: #3b82f6; }

                /* Layout */
                .delv-body {
                    display: grid;
                    grid-template-columns: 1fr 340px;
                    gap: 24px;
                    align-items: start;
                }
                .delv-col--side { position: sticky; top: 100px; }
                .delv-section {
                    background: white;
                    border-radius: 14px;
                    padding: 20px 22px;
                    border: 1px solid #eee;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
                    margin-bottom: 16px;
                }
                .delv-section__title {
                    font-family: 'Cinzel', serif;
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #111;
                    letter-spacing: 1px;
                    margin-bottom: 14px;
                }
                .delv-section__desc {
                    font-size: 0.78rem;
                    color: #888;
                    margin: -6px 0 12px;
                    line-height: 1.5;
                }

                /* Bulk actions */
                .delv-bulk-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .delv-bulk-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: #f8f8fa;
                    border-radius: 10px;
                    border: 1px solid #e8e8f0;
                }
                .delv-bulk-label {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #444;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    white-space: nowrap;
                }
                .delv-btn {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 6px 12px;
                    border: none;
                    border-radius: 6px;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.72rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 0.3px;
                }
                .delv-btn--allow    { background: #dcfce7; color: #15803d; }
                .delv-btn--restrict { background: #ffe4e6; color: #dc2626; }
                .delv-btn--allow:hover    { background: #bbf7d0; }
                .delv-btn--restrict:hover { background: #fecaca; }
                .delv-btn--sm { padding: 4px 10px; font-size: 0.68rem; }

                /* Search */
                .delv-search-row {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 14px;
                    align-items: center;
                }
                .delv-search {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: white;
                    border: 1px solid #e0e0e8;
                    border-radius: 10px;
                    padding: 10px 14px;
                }
                .delv-search i { color: #aaa; }
                .delv-search input {
                    flex: 1;
                    border: none;
                    outline: none;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.85rem;
                    color: #333;
                }
                .delv-filter {
                    padding: 10px 14px;
                    border: 1px solid #e0e0e8;
                    border-radius: 10px;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.82rem;
                    background: white;
                    color: #333;
                    cursor: pointer;
                    outline: none;
                }

                /* Country Grid */
                .delv-country-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    max-height: 560px;
                    overflow-y: auto;
                    padding-right: 4px;
                }
                .delv-country-grid::-webkit-scrollbar { width: 5px; }
                .delv-country-grid::-webkit-scrollbar-track { background: #f0f0f0; border-radius: 10px; }
                .delv-country-grid::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }

                .delv-country-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1.5px solid transparent;
                    user-select: none;
                }
                .delv-country-card--allowed {
                    background: #f8fffe;
                    border-color: #d1fae5;
                }
                .delv-country-card--allowed:hover {
                    background: #ecfdf5;
                    border-color: #a7f3d0;
                    transform: translateX(2px);
                }
                .delv-country-card--restricted {
                    background: #fff5f5;
                    border-color: #fecaca;
                }
                .delv-country-card--restricted:hover {
                    background: #fee2e2;
                    border-color: #fca5a5;
                    transform: translateX(2px);
                }
                .delv-country-card__left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .delv-zone-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                .delv-country-name {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #333;
                }
                .delv-zone-badge {
                    font-size: 0.62rem;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    opacity: 0.7;
                }
                .delv-toggle {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.72rem;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 20px;
                    letter-spacing: 0.3px;
                    flex-shrink: 0;
                }
                .delv-toggle--on  { background: #dcfce7; color: #15803d; }
                .delv-toggle--off { background: #ffe4e6; color: #dc2626; }

                .delv-empty {
                    text-align: center;
                    padding: 30px;
                    color: #aaa;
                    font-size: 0.82rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                }

                /* Right side */
                .delv-textarea {
                    width: 100%;
                    padding: 12px 14px;
                    border: 1px solid #e0e0e8;
                    border-radius: 8px;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.82rem;
                    color: #333;
                    resize: vertical;
                    outline: none;
                    transition: border-color 0.2s;
                    box-sizing: border-box;
                    line-height: 1.5;
                }
                .delv-textarea:focus { border-color: #C5A059; }

                .delv-msg-preview { margin-top: 14px; }
                .delv-msg-preview__label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #aaa;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                }
                .delv-msg-preview__box {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    background: linear-gradient(135deg, #1a0a0a, #2d1010);
                    border: 1px solid rgba(239,68,68,0.4);
                    border-radius: 10px;
                    padding: 14px 16px;
                    color: #fca5a5;
                }
                .delv-msg-preview__box > i {
                    font-size: 1.2rem;
                    flex-shrink: 0;
                    margin-top: 2px;
                    color: #ef4444;
                }
                .delv-msg-preview__title {
                    font-family: 'Cinzel', serif;
                    font-size: 0.88rem;
                    font-weight: 700;
                    color: #ef4444;
                    margin-bottom: 4px;
                }
                .delv-msg-preview__text {
                    font-size: 0.75rem;
                    line-height: 1.5;
                    color: #f87171;
                }

                .delv-restricted-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    max-height: 280px;
                    overflow-y: auto;
                }
                .delv-restricted-tag {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 5px 10px 5px 12px;
                    background: #ffe4e6;
                    border: 1px solid #fca5a5;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #dc2626;
                }
                .delv-restricted-tag button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #dc2626;
                    padding: 0;
                    font-size: 0.7rem;
                    line-height: 1;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                .delv-restricted-tag button:hover { opacity: 1; }

                @media (max-width: 900px) {
                    .delv-body { grid-template-columns: 1fr; }
                    .delv-col--side { position: static; }
                    .delv-stats { grid-template-columns: 1fr 1fr; }
                }
            `}</style>
        </div>
    );
}
