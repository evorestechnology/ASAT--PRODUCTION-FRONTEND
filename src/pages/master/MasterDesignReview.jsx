import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';
import { useCurrency } from '../../context/CurrencyContext';
import '../../styles/admin.css';

/* ─── Page-scoped Light Theme CSS ────────────────────────────── */
const PAGE_CSS = `
.mdr-page {
    min-height: 100vh;
    background: #f8fafc;
    font-family: 'Montserrat', sans-serif;
    color: #334155;
}
.mdr-nav {
    position: sticky; top: 0; z-index: 100;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 14px 32px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05);
}
.mdr-nav__back {
    display: flex; align-items: center; gap: 8px;
    background: none; border: none; color: #64748b;
    font-family: 'Montserrat', sans-serif; font-size: 0.82rem; font-weight: 600;
    cursor: pointer; padding: 6px 12px; border-radius: 6px; transition: all 0.2s;
}
.mdr-nav__back:hover { color: #0f172a; background: #f1f5f9; }
.mdr-nav__title { color: #0f172a; font-size: 0.95rem; font-weight: 700; }
.mdr-status-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 14px; border-radius: 20px;
    font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
}

.mdr-body {
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: 24px;
    padding: 24px 32px 140px;
    max-width: 1400px;
    margin: 0 auto;
}
@media (max-width: 900px) {
    .mdr-body { grid-template-columns: 1fr; padding: 16px 16px 140px; }
}

/* Cards */
.mdr-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px 0 rgba(0,0,0,0.02), 0 1px 2px -1px rgba(0,0,0,0.02);
    margin-bottom: 24px;
}
.mdr-card__title {
    font-size: 0.72rem; font-weight: 700; color: #64748b;
    text-transform: uppercase; letter-spacing: 1.2px;
    border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 16px;
}

/* KV rows */
.mdr-kv {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.84rem; gap: 16px;
}
.mdr-kv:last-child { border-bottom: none; }
.mdr-kv__k { color: #64748b; font-weight: 500; }
.mdr-kv__v { color: #0f172a; font-weight: 600; text-align: right; word-break: break-word; }

/* Color Card Section */
.mdr-color-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px 0 rgba(0,0,0,0.02), 0 1px 2px -1px rgba(0,0,0,0.02);
    margin-bottom: 24px;
}
.mdr-color-header {
    display: flex; align-items: center; gap: 10px;
    padding-bottom: 12px; border-bottom: 2px solid #f1f5f9; margin-bottom: 20px;
}
.mdr-color-title {
    font-size: 1rem; font-weight: 700; color: #0f172a; text-transform: capitalize;
}
.mdr-color-swatch {
    width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #cbd5e1; flex-shrink: 0;
}

/* Mockup Images grid */
.mdr-mockups-container {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px;
    margin-bottom: 24px;
}
.mdr-mockup-item {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;
}
.mdr-mockup-img {
    width: 100%; aspect-ratio: 1; object-fit: cover;
    border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff;
    cursor: zoom-in; transition: transform 0.15s, border-color 0.15s;
}
.mdr-mockup-img:hover { transform: scale(1.03); border-color: #94a3b8; }
.mdr-mockup-label { font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase; }

/* Placements layout */
.mdr-placements-title {
    font-size: 0.72rem; font-weight: 700; color: #475569;
    text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;
}
.mdr-tech-group {
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
    padding: 16px; margin-bottom: 16px;
}
.mdr-tech-name {
    font-size: 0.82rem; font-weight: 700; color: #1e293b; margin-bottom: 12px;
    display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.5px;
}
.mdr-placement-item {
    display: flex; gap: 16px;
    padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;
    margin-bottom: 10px; align-items: center;
}
.mdr-placement-item:last-child { margin-bottom: 0; }
.mdr-media-pair { display: flex; gap: 10px; flex-shrink: 0; }
.mdr-placement-img-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.mdr-placement-img {
    width: 60px; height: 60px; object-fit: cover;
    border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; cursor: zoom-in;
    transition: border-color 0.15s;
}
.mdr-placement-img:hover { border-color: #94a3b8; }
.mdr-placement-img-lbl { font-size: 0.58rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
.mdr-placement-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.mdr-placement-label { font-size: 0.84rem; font-weight: 600; color: #0f172a; text-transform: capitalize; }
.mdr-placement-style { font-size: 0.7rem; color: #64748b; font-weight: 500; }
.mdr-placement-badge {
    font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    padding: 3px 10px; border-radius: 20px; white-space: nowrap;
}

/* Pricing Card */
.mdr-price-card {
    background: linear-gradient(135deg, #fefefe 0%, #fafafa 100%);
    border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px;
}
.mdr-price-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.84rem;
}
.mdr-price-row:last-child { border-bottom: none; }
.mdr-price-row__k { color: #64748b; font-weight: 500; }
.mdr-price-row__v { color: #0f172a; font-weight: 600; }
.mdr-price-total { border-top: 2px solid #e2e8f0 !important; margin-top: 6px; padding-top: 12px !important; }
.mdr-price-total .mdr-price-row__k { color: #0f172a; font-weight: 700; font-size: 0.9rem; }
.mdr-price-total .mdr-price-row__v { color: #b45309; font-weight: 800; font-size: 1.1rem; }

/* Sticky bottom actions bar */
.mdr-action-bar {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
    background: rgba(255,255,255,0.96); backdrop-filter: blur(12px);
    border-top: 1px solid #e2e8f0;
    padding: 16px 32px;
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.05);
}
.mdr-reason-input {
    flex: 1; min-width: 200px; padding: 11px 16px;
    background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px;
    color: #0f172a; font-size: 0.82rem; font-family: 'Montserrat', sans-serif; outline: none;
    transition: border-color 0.2s;
}
.mdr-reason-input:focus { border-color: #94a3b8; background: #ffffff; }
.mdr-action-btn {
    padding: 12px 24px; border-radius: 8px; border: none;
    font-family: 'Montserrat', sans-serif; font-size: 0.84rem; font-weight: 700;
    cursor: pointer; display: flex; align-items: center; gap: 8px;
    transition: opacity 0.15s, transform 0.1s; white-space: nowrap;
}
.mdr-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.mdr-action-btn:not(:disabled):active { transform: scale(0.97); }
.mdr-action-btn--approve { background: linear-gradient(135deg,#16a34a,#22c55e); color: white; }
.mdr-action-btn--reject  { background: linear-gradient(135deg,#dc2626,#ef4444); color: white; }
.mdr-action-btn--restrict{ background: linear-gradient(135deg,#2563eb,#3b82f6); color: white; }
.mdr-action-btn--revoke  { background: linear-gradient(135deg,#d97706,#f59e0b); color: white; }
.mdr-action-btn--delete  { background: transparent; border: 1.5px solid #ef4444; color: #ef4444; }
.mdr-action-btn--neutral { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

/* Lightbox */
.mdr-lightbox {
    position: fixed; inset: 0; background: rgba(15,23,42,0.92); z-index: 2000;
    display: flex; align-items: center; justify-content: center; cursor: zoom-out;
    animation: mdrFade 0.15s ease;
}
@keyframes mdrFade { from { opacity:0 } to { opacity:1 } }
.mdr-lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 12px; object-fit: contain; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
.mdr-loading {
    display: flex; align-items: center; justify-content: center;
    min-height: 60vh; flex-direction: column; gap: 16px; color: #64748b; font-size: 0.85rem;
}
`;

/* ── helpers ── */
function parseDesc(raw) {
    try { if (raw && typeof raw === 'string' && raw.startsWith('{')) return JSON.parse(raw); } catch (_) {}
    return {};
}

const STATUS_STYLE = {
    pending:    { bg: '#fef3c7', color: '#d97706' },
    approved:   { bg: '#dcfce7', color: '#16a34a' },
    restricted: { bg: '#fee2e2', color: '#dc2626' },
};

/* ══════════════════════════════════════════════════════════════ */
export default function MasterDesignReview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toasts, showToast } = useToast();
    const { packingCost, operatingCost, applyMarkup } = useCurrency();

    const [design, setDesign]     = useState(null);
    const [loading, setLoading]    = useState(true);
    const [lightbox, setLightbox]  = useState(null);
    const [reason, setReason]      = useState('');
    const [acting, setActing]      = useState(false);

    const fetchDesign = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`/api/designs/${id}`);
            setDesign(data);
        } catch (e) {
            showToast('Failed to load design: ' + (e.message || e.error || ''), 'error');
        } finally { setLoading(false); }
    }, [id]);

    useEffect(() => { fetchDesign(); }, [fetchDesign]);

    const doAction = async (action) => {
        if ((action === 'reject' || action === 'restrict') && !reason.trim()) {
            showToast('Enter a reason before ' + action + 'ing.', 'warning'); return;
        }
        if (action === 'delete' && !window.confirm('Permanently delete this design?')) return;
        setActing(true);
        try {
            if (action === 'approve' || action === 'revoke') {
                await apiFetch(`/api/designs/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'approved' }) });
                showToast('Design approved & published.', 'success');
                setDesign(prev => ({ ...prev, status: 'approved' }));
            } else if (action === 'reject' || action === 'restrict') {
                await apiFetch(`/api/designs/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'restricted', rejection_reason: reason }) });
                showToast('Design restricted.', 'success');
                setDesign(prev => ({ ...prev, status: 'restricted', rejection_reason: reason }));
                setReason('');
            } else if (action === 'delete') {
                await apiFetch(`/api/designs/${id}`, { method: 'DELETE' });
                showToast('Design deleted.', 'success');
                navigate('/master/designs');
            }
        } catch (e) {
            showToast('Action failed: ' + (e.error || e.message || ''), 'error');
        } finally { setActing(false); }
    };

    if (loading) return (
        <div className="mdr-page">
            <style>{TOAST_CSS}{PAGE_CSS}</style>
            <div className="mdr-loading"><div className="adm-spinner" /><span>Loading design…</span></div>
        </div>
    );
    if (!design) return (
        <div className="mdr-page">
            <style>{TOAST_CSS}{PAGE_CSS}</style>
            <div className="mdr-loading">Design not found.</div>
        </div>
    );

    const desc = parseDesc(design.description);
    const pricing = desc.pricing || {};
    const colorMockups = desc.customerImages || desc.colorMockups || {};
    const placements = desc.placements || desc.colorPlacements || {};
    const designerNote = desc.text || desc.designerNote || desc.designer_note || '';

    const allColors = design.colors || Object.keys(colorMockups);
    const colorMockupEntries = Object.entries(colorMockups);

    const bCost = pricing.baseCost || 0;
    const pCost = pricing.printingCost || 0;
    const dCost = pricing.designerCost || 0;
    const oCost = operatingCost || 0;
    const pkCost = packingCost || 0;
    const subtotal = bCost + pCost + dCost;
    const customerPrice = Math.round(applyMarkup(subtotal));
    const markup = Math.max(0, customerPrice - (subtotal + oCost + pkCost));

    const sc = STATUS_STYLE[design.status] || STATUS_STYLE.pending;
    const currentStatus = (design.status || 'pending').toLowerCase();

    return (
        <div className="mdr-page">
            <style>{TOAST_CSS}{PAGE_CSS}</style>
            <ToastContainer toasts={toasts} />

            {lightbox && (
                <div className="mdr-lightbox" onClick={() => setLightbox(null)}>
                    <img src={lightbox} alt="Full view" onClick={e => e.stopPropagation()} />
                </div>
            )}

            {/* Nav */}
            <nav className="mdr-nav">
                <button className="mdr-nav__back" onClick={() => navigate('/master/designs')}>
                    <i className="fas fa-arrow-left" /> Back to Designs
                </button>
                <span className="mdr-nav__title">{design.title || 'Untitled Design'}</span>
                <span className="mdr-status-pill" style={{ background: sc.bg, color: sc.color }}>
                    <i className="fas fa-circle" style={{ fontSize: '0.4rem' }} /> {design.status || 'pending'}
                </span>
            </nav>

            {/* Layout body */}
            <div className="mdr-body">

                {/* ══ SIDEBAR (General details + Pricing) ══ */}
                <aside>
                    <div className="mdr-card">
                        <div className="mdr-card__title">Design & Designer</div>
                        {[
                            ['Design ID', <span style={{ fontFamily:'monospace', fontSize:'0.75rem', color:'#64748b' }}>{design.id}</span>],
                            ['Title', design.title || '—'],
                            ['Designer', `@${design.designer_username || design.designerUsername || '—'}`],
                            ['Base Product ID', <span style={{ fontFamily:'monospace', fontSize:'0.75rem', color:'#64748b' }}>{design.base_product_id || '—'}</span>],
                            ['Gender', <span style={{ textTransform:'capitalize' }}>{design.gender || '—'}</span>],
                            ['Sizes', Array.isArray(design.sizes) && design.sizes.length ? design.sizes.join(', ') : '—'],
                            ['Submitted', design.created_at ? new Date(design.created_at).toLocaleString('en-IN') : '—'],
                        ].map(([k, v]) => (
                            <div key={k} className="mdr-kv">
                                <span className="mdr-kv__k">{k}</span>
                                <span className="mdr-kv__v">{v}</span>
                            </div>
                        ))}
                        {designerNote && (
                            <div className="mdr-kv" style={{ flexDirection:'column', gap:4, borderBottom:'none', paddingBottom:0 }}>
                                <span className="mdr-kv__k">Designer Note</span>
                                <span style={{ color:'#475569', fontSize:'0.83rem', lineHeight:1.5, marginTop:4 }}>{designerNote}</span>
                            </div>
                        )}
                        {design.rejection_reason && (
                            <div style={{ marginTop:14, padding:'12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8 }}>
                                <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', color:'#dc2626', marginBottom:4 }}>Restriction Reason</div>
                                <div style={{ fontSize:'0.82rem', color:'#b91c1c', lineHeight:1.5 }}>{design.rejection_reason}</div>
                            </div>
                        )}
                    </div>

                    <div className="mdr-card">
                        <div className="mdr-card__title">Pricing Breakdown</div>
                        <div className="mdr-price-card">
                            {pricing.baseCost !== undefined ? (
                                <>
                                    {[
                                        ['Base Cost', `₹${bCost.toLocaleString()}`],
                                        ['Printing Cost', `₹${pCost.toLocaleString()}`],
                                        ['Royalty', `₹${dCost.toLocaleString()}`],
                                    ].map(([k,v]) => (
                                        <div key={k} className="mdr-price-row">
                                            <span className="mdr-price-row__k">{k}</span>
                                            <span className="mdr-price-row__v">{v}</span>
                                        </div>
                                    ))}
                                    <div className="mdr-price-row" style={{ borderTop:'1.5px dashed #e2e8f0', marginTop:4, paddingTop:8 }}>
                                        <span className="mdr-price-row__k" style={{ fontStyle:'italic' }}>Subtotal</span>
                                        <span className="mdr-price-row__v">₹{subtotal.toLocaleString()}</span>
                                    </div>
                                    {[
                                        ['Operating Cost', `₹${oCost.toLocaleString()}`],
                                        ['Packing Cost', `₹${pkCost.toLocaleString()}`],
                                        ['Markup', `₹${markup.toLocaleString()}`],
                                    ].map(([k,v]) => (
                                        <div key={k} className="mdr-price-row">
                                            <span className="mdr-price-row__k">{k}</span>
                                            <span className="mdr-price-row__v">{v}</span>
                                        </div>
                                    ))}
                                    <div className="mdr-price-row mdr-price-total">
                                        <span className="mdr-price-row__k">Customer Pays</span>
                                        <span className="mdr-price-row__v">₹{customerPrice.toLocaleString()}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="mdr-price-row mdr-price-total">
                                    <span className="mdr-price-row__k">Stored Price</span>
                                    <span className="mdr-price-row__v">₹{(design.price||0).toLocaleString()}</span>
                                </div>
                            )}
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
                            <div key={cName} className="mdr-color-card">
                                {/* Color header */}
                                <div className="mdr-color-header">
                                    <span className="mdr-color-swatch"
                                        style={{ background: cHex.toLowerCase() === 'white' ? '#f8fafc' : cHex.toLowerCase() === 'black' ? '#0f172a' : cHex }} />
                                    <span className="mdr-color-title">{cName}</span>
                                </div>

                                {/* Mockup images uploaded for this color */}
                                <div className="mdr-placements-title">Mockup Images ({cName})</div>
                                <div className="mdr-mockups-container">
                                    {[['front', 'Front Mockup', front], ['back', 'Back Mockup', back], ['model', 'Model Mockup', model]].map(([key, label, url]) => {
                                        return url ? (
                                            <div key={key} className="mdr-mockup-item">
                                                <img src={url} alt={label} className="mdr-mockup-img" onClick={() => setLightbox(url)} />
                                                <span className="mdr-mockup-label">{label}</span>
                                            </div>
                                        ) : null;
                                    })}
                                    {Array.isArray(mockup.images) && mockup.images.map((img, i) => (
                                        <div key={i} className="mdr-mockup-item">
                                            <img src={img} alt={`Mockup ${i+1}`} className="mdr-mockup-img" onClick={() => setLightbox(img)} />
                                            <span className="mdr-mockup-label">Mockup {i+1}</span>
                                        </div>
                                    ))}
                                    {!(front || back || model) && (
                                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', paddingLeft: 12 }}>No mockups uploaded for this color.</div>
                                    )}
                                </div>

                                {/* Placements and Selected printing styles for this color */}
                                <div className="mdr-placements-title">Printing Styles & Placement Uploads ({cName})</div>
                                {techEntries.length > 0 ? (
                                    techEntries.map(([tech, placements]) => {
                                        return (
                                            <div key={tech} className="mdr-tech-group">
                                                <div className="mdr-tech-name">
                                                    <i className="fas fa-print" style={{ color: 'var(--gold)', marginRight: 6 }} />
                                                    {tech}
                                                </div>
                                                {placements.map((p, pi) => {
                                                    const designFile = p.designUrl || p.designPreview || null;
                                                    const mockupFile = p.mockupUrl || p.mockupPreview || null;
                                                    const ready = !!(designFile && mockupFile);

                                                    return (
                                                        <div key={pi} className="mdr-placement-item">
                                                            {/* Media Pair */}
                                                            <div className="mdr-media-pair">
                                                                <div className="mdr-placement-img-wrap">
                                                                    {designFile ? (
                                                                        <img src={designFile} alt="Design File" className="mdr-placement-img" onClick={() => setLightbox(designFile)} />
                                                                    ) : (
                                                                        <div style={{ width:60, height:60, background:'#f1f5f9', borderRadius:6, border:'1px dashed #cbd5e1', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                                            <i className="fas fa-image" style={{ color:'#94a3b8' }} />
                                                                        </div>
                                                                    )}
                                                                    <span className="mdr-placement-img-lbl">Art</span>
                                                                </div>
                                                                <div className="mdr-placement-img-wrap">
                                                                    {mockupFile ? (
                                                                        <img src={mockupFile} alt="Placement Mockup" className="mdr-placement-img" onClick={() => setLightbox(mockupFile)} />
                                                                    ) : (
                                                                        <div style={{ width:60, height:60, background:'#f1f5f9', borderRadius:6, border:'1px dashed #cbd5e1', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                                            <i className="fas fa-tshirt" style={{ color:'#94a3b8' }} />
                                                                        </div>
                                                                    )}
                                                                    <span className="mdr-placement-img-lbl">Mockup</span>
                                                                </div>
                                                            </div>

                                                            {/* Placement details */}
                                                            <div className="mdr-placement-info">
                                                                <span className="mdr-placement-label">{p.placementLabel || p.label || `Placement ${pi+1}`}</span>
                                                                <span className="mdr-placement-style">Technique: {tech}</span>
                                                            </div>

                                                            {/* Status Badge */}
                                                            <span className="mdr-placement-badge" style={{
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

            {/* Sticky Actions Bar */}
            <div className="mdr-action-bar">
                {(currentStatus==='pending'||currentStatus==='approved'||currentStatus==='restricted') && (
                    <input type="text" className="mdr-reason-input"
                        placeholder="Rejection/restriction reason (required for reject & restrict)…"
                        value={reason} onChange={e => setReason(e.target.value)} />
                )}
                {currentStatus==='pending' && (<>
                    <button className="mdr-action-btn mdr-action-btn--approve" disabled={acting} onClick={()=>doAction('approve')}>
                        {acting ? <i className="fas fa-circle-notch fa-spin"/> : <i className="fas fa-check"/>} Approve
                    </button>
                    <button className="mdr-action-btn mdr-action-btn--reject" disabled={acting} onClick={()=>doAction('reject')}>
                        {acting ? <i className="fas fa-circle-notch fa-spin"/> : <i className="fas fa-times"/>} Reject
                    </button>
                </>)}
                {currentStatus==='approved' && (
                    <button className="mdr-action-btn mdr-action-btn--restrict" disabled={acting} onClick={()=>doAction('restrict')}>
                        {acting ? <i className="fas fa-circle-notch fa-spin"/> : <i className="fas fa-ban"/>} Restrict
                    </button>
                )}
                {currentStatus==='restricted' && (<>
                    <button className="mdr-action-btn mdr-action-btn--revoke" disabled={acting} onClick={()=>doAction('revoke')}>
                        {acting ? <i className="fas fa-circle-notch fa-spin"/> : <i className="fas fa-undo"/>} Revoke Restriction
                    </button>
                    <button className="mdr-action-btn mdr-action-btn--delete" disabled={acting} onClick={()=>doAction('delete')}>
                        {acting ? <i className="fas fa-circle-notch fa-spin"/> : <i className="fas fa-trash-alt"/>} Delete
                    </button>
                </>)}
                <button className="mdr-action-btn mdr-action-btn--neutral" onClick={()=>navigate('/master/designs')}>
                    <i className="fas fa-arrow-left"/> Back
                </button>
            </div>
        </div>
    );
}
