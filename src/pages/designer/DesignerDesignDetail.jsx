import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

/* ─── Page-scoped Light Theme CSS ────────────────────────────── */
const PAGE_CSS = `
.ddd-page {
    min-height: 100vh;
    background: #f8fafc;
    font-family: 'Montserrat', sans-serif;
    color: #334155;
}
.ddd-nav {
    position: sticky; top: 0; z-index: 100;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 14px 32px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05);
}
.ddd-nav__back {
    display: flex; align-items: center; gap: 8px;
    background: none; border: none; color: #64748b;
    font-family: 'Montserrat', sans-serif; font-size: 0.82rem; font-weight: 600;
    cursor: pointer; padding: 6px 12px; border-radius: 6px; transition: all 0.2s;
}
.ddd-nav__back:hover { color: #0f172a; background: #f1f5f9; }
.ddd-nav__title { color: #0f172a; font-size: 0.95rem; font-weight: 700; }
.ddd-status-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 14px; border-radius: 20px;
    font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
}

.ddd-body {
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: 24px;
    padding: 24px 32px 60px;
    max-width: 1400px;
    margin: 0 auto;
}
@media (max-width: 900px) {
    .ddd-body { grid-template-columns: 1fr; padding: 16px 16px 60px; }
}

/* Cards */
.ddd-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px 0 rgba(0,0,0,0.02), 0 1px 2px -1px rgba(0,0,0,0.02);
    margin-bottom: 24px;
}
.ddd-card__title {
    font-size: 0.72rem; font-weight: 700; color: #64748b;
    text-transform: uppercase; letter-spacing: 1.2px;
    border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 16px;
}

/* KV rows */
.ddd-kv {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.84rem; gap: 16px;
}
.ddd-kv:last-child { border-bottom: none; }
.ddd-kv__k { color: #64748b; font-weight: 500; }
.ddd-kv__v { color: #0f172a; font-weight: 600; text-align: right; word-break: break-word; }

/* Color Card Section */
.ddd-color-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px 0 rgba(0,0,0,0.02), 0 1px 2px -1px rgba(0,0,0,0.02);
    margin-bottom: 24px;
}
.ddd-color-header {
    display: flex; align-items: center; gap: 10px;
    padding-bottom: 12px; border-bottom: 2px solid #f1f5f9; margin-bottom: 20px;
}
.ddd-color-title {
    font-size: 1rem; font-weight: 700; color: #0f172a; text-transform: capitalize;
}
.ddd-color-swatch {
    width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #cbd5e1; flex-shrink: 0;
}

/* Mockup Images grid */
.ddd-mockups-container {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px;
    margin-bottom: 24px;
}
.ddd-mockup-item {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;
}
.ddd-mockup-img {
    width: 100%; aspect-ratio: 1; object-fit: cover;
    border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff;
    cursor: zoom-in; transition: transform 0.15s, border-color 0.15s;
}
.ddd-mockup-img:hover { transform: scale(1.03); border-color: #94a3b8; }
.ddd-mockup-label { font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase; }

/* Placements layout */
.ddd-placements-title {
    font-size: 0.72rem; font-weight: 700; color: #475569;
    text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;
}
.ddd-tech-group {
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
    padding: 16px; margin-bottom: 16px;
}
.ddd-tech-name {
    font-size: 0.82rem; font-weight: 700; color: #1e293b; margin-bottom: 12px;
    display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.5px;
}
.ddd-placement-item {
    display: flex; gap: 16px;
    padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;
    margin-bottom: 10px; align-items: center;
}
.ddd-placement-item:last-child { margin-bottom: 0; }
.ddd-media-pair { display: flex; gap: 10px; flex-shrink: 0; }
.ddd-placement-img-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.ddd-placement-img {
    width: 60px; height: 60px; object-fit: cover;
    border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; cursor: zoom-in;
    transition: border-color 0.15s;
}
.ddd-placement-img:hover { border-color: #94a3b8; }
.ddd-placement-img-lbl { font-size: 0.58rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
.ddd-placement-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.ddd-placement-label { font-size: 0.84rem; font-weight: 600; color: #0f172a; text-transform: capitalize; }
.ddd-placement-style { font-size: 0.7rem; color: #64748b; font-weight: 500; }
.ddd-placement-badge {
    font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    padding: 3px 10px; border-radius: 20px; white-space: nowrap;
}

/* Royalty Card */
.ddd-royalty-card {
    background: linear-gradient(135deg,#fffdf5,#fdf8e8);
    border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 20px;
}
.ddd-royalty-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; border-bottom: 1px solid rgba(200,160,60,0.1); font-size: 0.84rem;
}
.ddd-royalty-row:last-child { border-bottom: none; }
.ddd-royalty-row__k { color: #64748b; font-weight: 500; }
.ddd-royalty-row__v { color: #0f172a; font-weight: 600; }
.ddd-royalty-total { border-top: 2px dashed rgba(200,160,60,0.3) !important; margin-top: 6px; padding-top: 12px !important; }
.ddd-royalty-total .ddd-royalty-row__k { color: #0f172a; font-weight: 700; }
.ddd-royalty-total .ddd-royalty-row__v { color: #b45309; font-weight: 800; font-size: 1.1rem; }

/* Lightbox */
.ddd-lightbox {
    position: fixed; inset: 0; background: rgba(15,23,42,0.92); z-index: 2000;
    display: flex; align-items: center; justify-content: center; cursor: zoom-out;
    animation: dddFade 0.15s ease;
}
@keyframes dddFade { from { opacity:0 } to { opacity:1 } }
.ddd-lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 12px; object-fit: contain; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
.ddd-loading {
    display: flex; align-items: center; justify-content: center;
    min-height: 60vh; flex-direction: column; gap: 16px; color: #64748b; font-size: 0.85rem;
}
.ddd-spinner {
    width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: var(--gold);
    border-radius: 50%; animation: dddSpin 0.8s linear infinite;
}
@keyframes dddSpin { to { transform: rotate(360deg); } }
`;

/* ── helpers ── */
function parseDesc(raw) {
    try { if (raw && typeof raw === 'string' && raw.startsWith('{')) return JSON.parse(raw); } catch (_) {}
    return {};
}

const STATUS_STYLE = {
    pending:    { bg: '#fef3c7', color: '#d97706', label: 'In Review' },
    approved:   { bg: '#dcfce7', color: '#16a34a', label: 'Live' },
    restricted: { bg: '#fee2e2', color: '#dc2626', label: 'Restricted' },
};

/* ══════════════════════════════════════════════════════════════ */
export default function DesignerDesignDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toasts, showToast } = useToast();

    const [design, setDesign]     = useState(null);
    const [loading, setLoading]    = useState(true);
    const [lightbox, setLightbox]  = useState(null);

    const fetchDesign = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/api/designs/mine');
            const found = (data || []).find(d => d.id === id || d.id === parseInt(id));
            if (!found) { showToast('Design not found.', 'error'); setLoading(false); return; }
            setDesign(found);
        } catch (e) {
            showToast('Failed to load design.', 'error');
        } finally { setLoading(false); }
    }, [id]);

    useEffect(() => { if (user) fetchDesign(); }, [user, fetchDesign]);

    if (loading) return (
        <div className="ddd-page">
            <style>{TOAST_CSS}{PAGE_CSS}</style>
            <div className="ddd-loading"><div className="ddd-spinner" /><span>Loading design…</span></div>
        </div>
    );
    if (!design) return (
        <div className="ddd-page">
            <style>{TOAST_CSS}{PAGE_CSS}</style>
            <div className="ddd-loading">Design not found.</div>
        </div>
    );

    const desc = parseDesc(design.description);
    const pricing = desc.pricing || {};
    const colorMockups = desc.customerImages || desc.colorMockups || {};
    const placements = desc.placements || desc.colorPlacements || {};
    const designerNote = desc.text || desc.designerNote || desc.designer_note || '';
    const text = desc.text || '';

    const allColors = design.colors || Object.keys(colorMockups);

    const royalty = pricing.designerCost || design.price || 0;
    const bCost   = pricing.baseCost || 0;
    const pCost   = pricing.printingCost || 0;
    const customerPays = bCost + pCost + royalty;

    const statusKey = (design.status || 'pending').toLowerCase();
    const sc = STATUS_STYLE[statusKey] || STATUS_STYLE.pending;

    return (
        <div className="ddd-page">
            <style>{TOAST_CSS}{PAGE_CSS}</style>
            <ToastContainer toasts={toasts} />

            {lightbox && (
                <div className="ddd-lightbox" onClick={() => setLightbox(null)}>
                    <img src={lightbox} alt="Full view" onClick={e => e.stopPropagation()} />
                </div>
            )}

            {/* Nav */}
            <nav className="ddd-nav">
                <button className="ddd-nav__back" onClick={() => navigate('/designer/designs')}>
                    <i className="fas fa-arrow-left" /> My Designs
                </button>
                <span className="ddd-nav__title">{design.title || 'Untitled Design'}</span>
                <span className="ddd-status-pill" style={{ background: sc.bg, color: sc.color }}>
                    <i className="fas fa-circle" style={{ fontSize: '0.4rem' }} /> {sc.label}
                </span>
            </nav>

            <div className="ddd-body">

                {/* ══ SIDEBAR (Design info + Earnings) ══ */}
                <aside>
                    {/* Restriction banner */}
                    {statusKey === 'restricted' && design.rejection_reason && (
                        <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, borderLeft: '4px solid #ef4444', marginBottom: 24 }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#ef4444', marginBottom: 6 }}>
                                <i className="fas fa-exclamation-triangle" style={{ marginRight: 6 }} />Restriction Reason
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#b91c1c', lineHeight: 1.6 }}>{design.rejection_reason}</div>
                        </div>
                    )}

                    <div className="ddd-card">
                        <div className="ddd-card__title">Design Details</div>
                        {[
                            ['Title', design.title || '—'],
                            ['Product', design.collection || 'Garment'],
                            ['Gender', <span style={{ textTransform: 'capitalize' }}>{design.gender || '—'}</span>],
                            ['Available Sizes', Array.isArray(design.sizes) && design.sizes.length ? design.sizes.join(', ') : '—'],
                            ['Submitted', design.created_at ? new Date(design.created_at).toLocaleString('en-IN') : '—'],
                        ].map(([k, v]) => (
                            <div key={k} className="ddd-kv">
                                <span className="ddd-kv__k">{k}</span>
                                <span className="ddd-kv__v">{v}</span>
                            </div>
                        ))}
                        {designerNote && (
                            <div className="ddd-kv" style={{ flexDirection: 'column', gap: 4, borderBottom: 'none', paddingBottom: 0 }}>
                                <span className="ddd-kv__k">Your Note</span>
                                <span style={{ color: '#475569', fontSize: '0.83rem', lineHeight: 1.5, marginTop: 4 }}>{designerNote}</span>
                            </div>
                        )}
                        {text && (
                            <div className="ddd-kv" style={{ flexDirection: 'column', gap: 4, borderBottom: 'none', paddingBottom: 0 }}>
                                <span className="ddd-kv__k">Description</span>
                                <span style={{ color: '#475569', fontSize: '0.83rem', lineHeight: 1.5, marginTop: 4 }}>{text}</span>
                            </div>
                        )}
                    </div>

                    <div className="ddd-card">
                        <div className="ddd-card__title">Your Earnings</div>
                        <div className="ddd-royalty-card">
                            <div className="ddd-royalty-row">
                                <span className="ddd-royalty-row__k">Base Product Cost</span>
                                <span className="ddd-royalty-row__v">₹{bCost.toLocaleString()}</span>
                            </div>
                            <div className="ddd-royalty-row">
                                <span className="ddd-royalty-row__k">Printing Cost</span>
                                <span className="ddd-royalty-row__v">₹{pCost.toLocaleString()}</span>
                            </div>
                            <div className="ddd-royalty-row">
                                <span className="ddd-royalty-row__k" style={{ color: '#b45309', fontWeight: 600 }}>Your Royalty</span>
                                <span className="ddd-royalty-row__v" style={{ color: '#b45309', fontSize: '1.05rem' }}>₹{royalty.toLocaleString()}</span>
                            </div>
                            <div className="ddd-royalty-row ddd-royalty-total">
                                <span className="ddd-royalty-row__k">Customer Pays</span>
                                <span className="ddd-royalty-row__v">₹{customerPays.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ══ MAIN WORK AREA (Color by Color Review) ══ */}
                <main>
                    {allColors.map(color => {
                        const cName = typeof color === 'object' ? (color.colorName || color.name || color.color || '') : color;
                        const cHex  = typeof color === 'object' ? (color.color || color.hex || cName) : cName;

                        const mockup = colorMockups[cName] || {};
                        const front = mockup.frontUrl || mockup.front || '';
                        const back = mockup.backUrl || mockup.back || '';
                        const model = mockup.modelUrl || mockup.model || '';

                        const placementsList = placements[cName] || [];
                        const groupedPlacements = {};
                        placementsList.forEach(p => {
                            const styleName = p.style || 'Printing';
                            if (!groupedPlacements[styleName]) {
                                groupedPlacements[styleName] = [];
                            }
                            groupedPlacements[styleName].push(p);
                        });
                        const techEntries = Object.entries(groupedPlacements);

                        return (
                            <div key={cName} className="ddd-color-card">
                                {/* Color header */}
                                <div className="ddd-color-header">
                                    <span className="ddd-color-swatch"
                                        style={{ background: cHex.toLowerCase() === 'white' ? '#f8fafc' : cHex.toLowerCase() === 'black' ? '#0f172a' : cHex }} />
                                    <span className="ddd-color-title">{cName}</span>
                                </div>

                                {/* Mockup images uploaded for this color */}
                                <div className="ddd-placements-title">Mockup Images ({cName})</div>
                                <div className="ddd-mockups-container">
                                    {[['front', 'Front Mockup', front], ['back', 'Back Mockup', back], ['model', 'Model Mockup', model]].map(([key, label, url]) => {
                                        return url ? (
                                            <div key={key} className="ddd-mockup-item">
                                                <img src={url} alt={label} className="ddd-mockup-img" onClick={() => setLightbox(url)} />
                                                <span className="ddd-mockup-label">{label}</span>
                                            </div>
                                        ) : null;
                                    })}
                                    {Array.isArray(mockup.images) && mockup.images.map((img, i) => (
                                        <div key={i} className="ddd-mockup-item">
                                            <img src={img} alt={`Mockup ${i+1}`} className="ddd-mockup-img" onClick={() => setLightbox(img)} />
                                            <span className="ddd-mockup-label">Mockup {i+1}</span>
                                        </div>
                                    ))}
                                    {!(front || back || model) && (
                                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', paddingLeft: 12 }}>No mockups uploaded for this color.</div>
                                    )}
                                </div>

                                {/* Placements and Selected printing styles for this color */}
                                <div className="ddd-placements-title">Printing Styles & Placement Uploads ({cName})</div>
                                {techEntries.length > 0 ? (
                                    techEntries.map(([tech, placements]) => {
                                        return (
                                            <div key={tech} className="ddd-tech-group">
                                                <div className="ddd-tech-name">
                                                    <i className="fas fa-print" style={{ color: 'var(--gold)', marginRight: 6 }} />
                                                    {tech}
                                                </div>
                                                {placements.map((p, pi) => {
                                                    const designFile = p.designUrl || p.designPreview || null;
                                                    const mockupFile = p.mockupUrl || p.mockupPreview || null;
                                                    const ready = !!(designFile && mockupFile);

                                                    return (
                                                        <div key={pi} className="ddd-placement-item">
                                                            {/* Media Pair */}
                                                            <div className="ddd-media-pair">
                                                                <div className="ddd-placement-img-wrap">
                                                                    {designFile ? (
                                                                        <img src={designFile} alt="Design File" className="ddd-placement-img" onClick={() => setLightbox(designFile)} />
                                                                    ) : (
                                                                        <div style={{ width:60, height:60, background:'#f1f5f9', borderRadius:6, border:'1px dashed #cbd5e1', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                                            <i className="fas fa-image" style={{ color:'#94a3b8' }} />
                                                                        </div>
                                                                    )}
                                                                    <span className="ddd-placement-img-lbl">Art</span>
                                                                </div>
                                                                <div className="ddd-placement-img-wrap">
                                                                    {mockupFile ? (
                                                                        <img src={mockupFile} alt="Placement Mockup" className="ddd-placement-img" onClick={() => setLightbox(mockupFile)} />
                                                                    ) : (
                                                                        <div style={{ width:60, height:60, background:'#f1f5f9', borderRadius:6, border:'1px dashed #cbd5e1', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                                            <i className="fas fa-tshirt" style={{ color:'#94a3b8' }} />
                                                                        </div>
                                                                    )}
                                                                    <span className="ddd-placement-img-lbl">Mockup</span>
                                                                </div>
                                                            </div>

                                                            {/* Placement details */}
                                                            <div className="ddd-placement-info">
                                                                <span className="ddd-placement-label">{p.placementLabel || p.label || `Placement ${pi+1}`}</span>
                                                                <span className="ddd-placement-style">Technique: {tech}</span>
                                                            </div>

                                                            {/* Status Badge */}
                                                            <span className="ddd-placement-badge" style={{
                                                                background: ready ? '#dcfce7' : '#fee2e2',
                                                                color: ready ? '#16a34a' : '#dc2626'
                                                            }}>{ready ? '✓ Configured' : '✗ Incomplete'}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', paddingLeft: 12 }}>No print techniques configured.</div>
                                )}
                            </div>
                        );
                    })}
                </main>

            </div>
        </div>
    );
}
