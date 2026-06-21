import React, { useState, useEffect, useRef } from 'react';
import { apiFetch, uploadFile } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';
import GarmentMap from '../../components/GarmentMap';
import '../../styles/admin.css';

/* ─────────────────────────────────────────────────────────────
   PLACEMENT TREE
───────────────────────────────────────────────────────────── */
export const PLACEMENT_GROUPS = [
    {
        id: 'front', label: 'Front', icon: 'fa-arrow-up', color: '#1a73e8', bg: '#e8f0fe',
        items: [
            { id: 'front_pocket_logo', label: 'Front Pocket Logo' },
            { id: 'front_a6',          label: 'Front A6' },
            { id: 'front_a4',          label: 'Front A4' },
            { id: 'front_a3',          label: 'Front A3' },
            { id: 'front_14x16',       label: 'Front 14×16' },
            { id: 'front_16x20',       label: 'Front 16×20' },
        ],
    },
    {
        id: 'back', label: 'Back', icon: 'fa-arrow-down', color: '#e65100', bg: '#fff3e0',
        items: [
            { id: 'back_a6',              label: 'Back A6' },
            { id: 'back_a4',              label: 'Back A4' },
            { id: 'back_a3',              label: 'Back A3' },
            { id: 'back_14x16',           label: 'Back 14×16' },
            { id: 'back_16x20',           label: 'Back 16×20' },
            { id: 'back_neck',            label: 'Back Neck' },
            { id: 'right_front_shoulder', label: 'Right Front Shoulder' },
            { id: 'right_back_shoulder',  label: 'Right Back Shoulder' },
            { id: 'left_front_shoulder',  label: 'Left Front Shoulder' },
            { id: 'left_back_shoulder',   label: 'Left Back Shoulder' },
            { id: 'neck_logo',            label: 'Neck Logo' },
        ],
    },
    {
        id: 'pant', label: 'Pant', icon: 'fa-columns', color: '#7b1fa2', bg: '#f3e5f5',
        items: [
            { id: 'right_front_upper',  label: 'Right Front Upper' },
            { id: 'right_front_bottom', label: 'Right Front Bottom' },
            { id: 'right_front_full',   label: 'Right Front Full' },
            { id: 'left_front_upper',   label: 'Left Front Upper' },
            { id: 'left_front_bottom',  label: 'Left Front Bottom' },
            { id: 'left_front_lower',   label: 'Left Front Lower' },
            { id: 'right_back_upper',   label: 'Right Back Upper' },
            { id: 'right_back_bottom',  label: 'Right Back Bottom' },
            { id: 'right_back_full',    label: 'Right Back Full' },
            { id: 'left_back_upper',    label: 'Left Back Upper' },
            { id: 'left_back_bottom',   label: 'Left Back Bottom' },
            { id: 'left_back_lower',    label: 'Left Back Lower' },
        ],
    },
];

/* ── PlacementItem ── */
function PlacementItem({ label, checked, color, bg, isCustom, onClick, onRemove, onMouseEnter, onMouseLeave, isHovered }) {
    const [hov, setHov] = useState(false);
    const isHl = isHovered || hov;
    return (
        <div
            style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '7px 12px', 
                background: checked ? bg : isHl ? '#f1f5f9' : 'white', 
                border: isHl ? `1.5px solid ${color}` : '1.5px solid transparent',
                borderRadius: '4px',
                cursor: 'pointer', 
                transition: 'all 0.15s ease', 
                userSelect: 'none' 
            }}
            onMouseEnter={() => { setHov(true); onMouseEnter?.(); }} 
            onMouseLeave={() => { setHov(false); onMouseLeave?.(); }} 
            onClick={onClick}
        >
            <span style={{ width: 14, height: 14, flexShrink: 0, border: `2px solid ${checked ? color : '#ccc'}`, background: checked ? color : 'white', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {checked && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </span>
            <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '0.72rem', flex: 1, color: checked ? color : '#555', fontWeight: checked ? 600 : 400 }}>{label}</span>
            {isCustom && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <span style={{ padding: '1px 5px', borderRadius: 3, fontSize: '0.55rem', fontFamily: "'Montserrat',sans-serif", fontWeight: 700, background: bg, color, textTransform: 'uppercase' }}>custom</span>
                    <span onClick={e => { e.stopPropagation(); onRemove?.(); }} style={{ color: '#ccc', cursor: 'pointer', fontSize: '0.65rem', padding: '1px 3px', transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ea4335'} onMouseLeave={e => e.currentTarget.style.color = '#ccc'}>
                        <i className="fas fa-times" />
                    </span>
                </span>
            )}
        </div>
    );
}

/* ── PlacementSection ── */
function PlacementSection({ styleId, placements = [], customPlacements = [], onToggle, onGroupToggle, onAddCustom, onRemoveCustom }) {
    const [openGroups, setOpenGroups] = useState({ front: true, back: false, pant: false });
    const [addingGroup, setAddingGroup] = useState(null);
    const [newLabel, setNewLabel] = useState('');
    const [hoveredId, setHoveredId] = useState(null);
    const addInputRef = useRef(null);

    const allIds = [...PLACEMENT_GROUPS.flatMap(g => g.items.map(i => i.id)), ...customPlacements.map(c => c.id)];

    const handleStartAdd = (gid) => {
        setAddingGroup(gid);
        setNewLabel('');
        if (!openGroups[gid]) setOpenGroups(p => ({ ...p, [gid]: true }));
        setTimeout(() => addInputRef.current?.focus(), 60);
    };
    const handleConfirmAdd = () => {
        const t = newLabel.trim();
        if (t && addingGroup) onAddCustom(styleId, addingGroup, t);
        setAddingGroup(null); setNewLabel('');
    };

    return (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--admin-border)', paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <label style={{ ...LABEL_ST, marginBottom: 0 }}>
                    <i className="fas fa-map-marker-alt" style={{ marginRight: 6, color: 'var(--admin-gold)' }} /> Placement Areas
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '0.68rem', color: 'var(--admin-muted)' }}>{placements.length}/{allIds.length}</span>
                    <button type="button" onClick={() => onGroupToggle(styleId, allIds, placements.length < allIds.length)}
                        style={{ padding: '3px 10px', fontSize: '0.62rem', fontWeight: 700, fontFamily: "'Montserrat',sans-serif", background: placements.length === allIds.length ? '#f0f0f0' : 'var(--admin-dark)', color: placements.length === allIds.length ? '#555' : 'white', border: 'none', borderRadius: 3, cursor: 'pointer' }}>
                        {placements.length === allIds.length ? 'Deselect All' : 'Select All'}
                    </button>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PLACEMENT_GROUPS.map(group => {
                    const groupCustom = customPlacements.filter(c => c.groupId === group.id);
                    const allGroupIds = [...group.items.map(i => i.id), ...groupCustom.map(c => c.id)];
                    const sel = placements.filter(p => allGroupIds.includes(p)).length;
                    const all = sel === allGroupIds.length && allGroupIds.length > 0;
                    const some = sel > 0 && !all;
                    const isOpen = openGroups[group.id];
                    const isAdding = addingGroup === group.id;
                    return (
                        <div key={group.id} style={{ border: `1px solid ${isOpen ? group.color : 'var(--admin-border)'}`, borderRadius: 5, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: isOpen ? group.bg : '#f9f9f9', cursor: 'pointer', userSelect: 'none' }} onClick={() => setOpenGroups(p => ({ ...p, [group.id]: !p[group.id] }))}>
                                <span onClick={e => { e.stopPropagation(); onGroupToggle(styleId, allGroupIds, !all); }}
                                    style={{ width: 16, height: 16, flexShrink: 0, border: `2px solid ${all || some ? group.color : '#bbb'}`, background: all ? group.color : 'white', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    {all && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                    {some && <span style={{ width: 8, height: 2, background: group.color, borderRadius: 1 }} />}
                                </span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: group.bg, flexShrink: 0 }}>
                                    <i className={`fas ${group.icon}`} style={{ color: group.color, fontSize: '0.65rem' }} />
                                </span>
                                <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '0.78rem', fontWeight: 700, color: isOpen ? group.color : 'var(--admin-dark)', flex: 1 }}>
                                    {group.label}{groupCustom.length > 0 && <span style={{ fontWeight: 400, fontSize: '0.62rem', color: 'var(--admin-muted)', marginLeft: 6 }}>+{groupCustom.length} custom</span>}
                                </span>
                                <span style={{ padding: '1px 8px', borderRadius: 10, background: sel > 0 ? group.bg : '#f0f0f0', color: sel > 0 ? group.color : '#999', fontFamily: "'Montserrat',sans-serif", fontSize: '0.62rem', fontWeight: 700 }}>{sel}/{allGroupIds.length}</span>
                                <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ color: '#bbb', fontSize: '0.65rem' }} />
                            </div>
                            {isOpen && (
                                <div style={{ background: 'white', borderTop: `1px solid ${group.bg}`, display: 'flex', flexWrap: 'wrap', gap: 16, padding: '12px' }}>
                                    <div style={{ flex: 1, minWidth: '260px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6, marginBottom: 12 }}>
                                            {group.items.map(item => (
                                                <PlacementItem 
                                                    key={item.id} 
                                                    label={item.label} 
                                                    checked={placements.includes(item.id)} 
                                                    color={group.color} 
                                                    bg={group.bg} 
                                                    onClick={() => onToggle(styleId, item.id)}
                                                    onMouseEnter={() => setHoveredId(item.id)}
                                                    onMouseLeave={() => setHoveredId(null)}
                                                    isHovered={hoveredId === item.id}
                                                />
                                            ))}
                                            {groupCustom.map(c => (
                                                <PlacementItem 
                                                    key={c.id} 
                                                    label={c.label} 
                                                    checked={placements.includes(c.id)} 
                                                    color={group.color} 
                                                    bg={group.bg} 
                                                    isCustom 
                                                    onClick={() => onToggle(styleId, c.id)} 
                                                    onRemove={() => onRemoveCustom(styleId, c.id)}
                                                    onMouseEnter={() => setHoveredId(c.id)}
                                                    onMouseLeave={() => setHoveredId(null)}
                                                    isHovered={hoveredId === c.id}
                                                />
                                            ))}
                                        </div>
                                        <div style={{ borderTop: `1px dashed ${group.bg}`, paddingTop: 10 }}>
                                            {isAdding ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <input ref={addInputRef} type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter') handleConfirmAdd(); if (e.key === 'Escape') { setAddingGroup(null); setNewLabel(''); } }}
                                                        placeholder={`Custom ${group.label} placement…`} autoFocus
                                                        style={{ flex: 1, padding: '6px 10px', border: `1.5px solid ${group.color}`, borderRadius: 4, fontFamily: "'Montserrat',sans-serif", fontSize: '0.72rem', outline: 'none', color: '#333' }} />
                                                    <button type="button" onClick={handleConfirmAdd} style={{ padding: '6px 14px', background: group.color, color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: "'Montserrat',sans-serif", fontSize: '0.7rem', fontWeight: 700 }}>Add</button>
                                                    <button type="button" onClick={() => { setAddingGroup(null); setNewLabel(''); }} style={{ padding: '6px 10px', background: 'none', color: '#999', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', fontFamily: "'Montserrat',sans-serif", fontSize: '0.7rem' }}>Cancel</button>
                                                </div>
                                            ) : (
                                                <button type="button" onClick={() => handleStartAdd(group.id)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'none', border: `1px dashed ${group.color}`, borderRadius: 4, cursor: 'pointer', fontFamily: "'Montserrat',sans-serif", fontSize: '0.68rem', color: group.color, fontWeight: 600, transition: 'background 0.15s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = group.bg} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                                    <i className="fas fa-plus" style={{ fontSize: '0.6rem' }} /> Add custom {group.label.toLowerCase()} placement
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, width: '100%', maxWidth: '240px', margin: '0 auto' }}>
                                        <GarmentMap 
                                            groupId={group.id} 
                                            placements={placements} 
                                            onToggle={(pid) => onToggle(styleId, pid)} 
                                            hoveredId={hoveredId}
                                            setHoveredId={setHoveredId}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   SUMMARY CARD — compact view after save
───────────────────────────────────────────────────────────── */
function StyleSummaryCard({ ps, idx, onEdit, onRemove }) {
    const customCount = (ps.customPlacements || []).length;

    const groupCounts = PLACEMENT_GROUPS.map(g => {
        const groupCustom = (ps.customPlacements || []).filter(c => c.groupId === g.id);
        const allIds = [...g.items.map(i => i.id), ...groupCustom.map(c => c.id)];
        const sel = (ps.placements || []).filter(p => allIds.includes(p)).length;
        return { ...g, sel, total: allIds.length };
    });

    return (
        <div style={{
            background: 'white',
            border: '1px solid var(--admin-border)',
            borderLeft: '4px solid var(--admin-gold)',
            borderRadius: 6,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'stretch',
            overflow: 'hidden',
            transition: 'box-shadow 0.2s',
        }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}
        >
            {/* Index strip */}
            <div style={{ width: 40, background: 'var(--admin-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '0.75rem', fontWeight: 800, color: 'white', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: 1 }}>#{idx + 1}</span>
            </div>

            {/* Reference image */}
            {ps.imageUrl && (
                <div style={{ width: 72, flexShrink: 0, overflow: 'hidden' }}>
                    <img src={ps.imageUrl} alt={ps.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
                        onClick={() => window.open(ps.imageUrl, '_blank')} title="View reference image" />
                </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
                {/* Name + cost row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontFamily: "'Cinzel',serif", fontSize: '1rem', fontWeight: 700, color: 'var(--admin-dark)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ps.name}
                    </span>
                    <span style={{ flexShrink: 0, padding: '4px 12px', background: '#f9f3e6', border: '1px solid var(--admin-gold)', borderRadius: 20, fontFamily: "'Montserrat',sans-serif", fontSize: '0.78rem', fontWeight: 700, color: '#8a6a1b' }}>
                        +₹{ps.cost}
                    </span>
                </div>

                {/* Placement group badges */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    {groupCounts.map(g => (
                        <span key={g.id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 20,
                            background: g.sel > 0 ? g.bg : '#f5f5f7',
                            border: `1px solid ${g.sel > 0 ? g.color + '44' : '#e0e0e0'}`,
                            fontFamily: "'Montserrat',sans-serif", fontSize: '0.65rem', fontWeight: 700,
                            color: g.sel > 0 ? g.color : '#aaa',
                        }}>
                            <i className={`fas ${g.icon}`} style={{ fontSize: '0.55rem' }} />
                            {g.label} {g.sel}/{g.total}
                        </span>
                    ))}
                    {customCount > 0 && (
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: '#fff8e1', border: '1px solid #ffe082', fontFamily: "'Montserrat',sans-serif", fontSize: '0.65rem', fontWeight: 700, color: '#f57f17' }}>
                            <i className="fas fa-star" style={{ marginRight: 4, fontSize: '0.55rem' }} />{customCount} custom
                        </span>
                    )}
                    {ps.placements?.length === 0 && (
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: '#f5f5f7', fontFamily: "'Montserrat',sans-serif", fontSize: '0.65rem', color: '#bbb', fontStyle: 'italic' }}>
                            No placements configured
                        </span>
                    )}
                </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, padding: '12px 14px', borderLeft: '1px solid var(--admin-border)', flexShrink: 0 }}>
                <button type="button" onClick={onEdit}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--admin-dark)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: "'Montserrat',sans-serif", fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--admin-gold)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--admin-dark)'}>
                    <i className="fas fa-pencil-alt" /> Edit
                </button>
                <button type="button" onClick={onRemove}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'none', color: 'var(--admin-danger)', border: '1px solid #fce8e6', borderRadius: 4, cursor: 'pointer', fontFamily: "'Montserrat',sans-serif", fontSize: '0.7rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-danger)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--admin-danger)'; }}>
                    <i className="fas fa-trash-alt" /> Remove
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   EDIT FORM CARD — expanded when adding / editing
───────────────────────────────────────────────────────────── */
function StyleEditCard({ ps, idx, uploadingId, onUpdate, onRemove, onImageClick, onTogglePlacement, onGroupToggle, onAddCustom, onRemoveCustom, onDone }) {
    return (
        <div style={{ background: 'white', border: '2px solid var(--admin-gold)', borderRadius: 6, boxShadow: '0 4px 20px rgba(197,160,89,0.15)', overflow: 'hidden' }}>
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: 'linear-gradient(135deg, #fdf8ef 0%, #fff 100%)', borderBottom: '1px solid #f0e8d5' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, background: 'var(--admin-gold)', color: 'white', borderRadius: '50%', fontFamily: "'Montserrat',sans-serif", fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>{idx + 1}</span>
                <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '0.7rem', fontWeight: 700, color: '#8a6a1b', flex: 1, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    {ps.name || 'New Printing Method'}
                </span>
                <button type="button" onClick={onDone}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--admin-gold)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: "'Montserrat',sans-serif", fontSize: '0.7rem', fontWeight: 700 }}>
                    <i className="fas fa-check" /> Done
                </button>
                <button type="button" onClick={onRemove}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'none', color: 'var(--admin-danger)', border: '1px solid #fce8e6', borderRadius: 4, cursor: 'pointer', fontFamily: "'Montserrat',sans-serif", fontSize: '0.7rem' }}>
                    <i className="fas fa-trash-alt" />
                </button>
            </div>

            {/* Fields */}
            <div style={{ padding: '20px 18px' }}>
                {/* Name + Cost */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 14, marginBottom: 16 }}>
                    <div>
                        <label style={LABEL_ST}>Style / Method Name *</label>
                        <input type="text" value={ps.name} onChange={e => onUpdate(ps.id, 'name', e.target.value)}
                            placeholder="e.g. DTF, DTG, Embroidery…" style={INPUT_ST}
                            onFocus={e => e.target.style.borderColor = 'var(--admin-gold)'}
                            onBlur={e => e.target.style.borderColor = 'var(--admin-border)'} />
                    </div>
                    <div>
                        <label style={LABEL_ST}>Add-on Cost (₹) *</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-muted)', fontSize: '0.82rem' }}>₹</span>
                            <input type="number" min="0" value={ps.cost} onChange={e => onUpdate(ps.id, 'cost', e.target.value)}
                                placeholder="0" style={{ ...INPUT_ST, paddingLeft: 24 }}
                                onFocus={e => e.target.style.borderColor = 'var(--admin-gold)'}
                                onBlur={e => e.target.style.borderColor = 'var(--admin-border)'} />
                        </div>
                    </div>
                </div>

                {/* Reference image */}
                <div style={{ marginBottom: 16 }}>
                    <label style={LABEL_ST}><i className="fas fa-image" style={{ marginRight: 5, color: 'var(--admin-gold)' }} /> Reference Image for Designers (optional)</label>
                    {uploadingId === ps.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: '#f0f4ff', borderRadius: 4, fontSize: '0.75rem', color: '#1a73e8' }}>
                            <i className="fas fa-circle-notch fa-spin" /> Uploading…
                        </div>
                    ) : ps.imageUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img src={ps.imageUrl} alt="ref" onClick={() => window.open(ps.imageUrl, '_blank')}
                                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--admin-border)', cursor: 'zoom-in' }} />
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button type="button" onClick={() => onImageClick(ps.id)} style={{ padding: '5px 12px', background: 'var(--admin-dark)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.68rem', fontFamily: "'Montserrat',sans-serif" }}>
                                    <i className="fas fa-upload" style={{ marginRight: 4 }} />Change
                                </button>
                                <button type="button" onClick={() => onUpdate(ps.id, 'imageUrl', '')} style={{ padding: '5px 12px', background: 'none', color: 'var(--admin-danger)', border: '1px solid var(--admin-danger)', borderRadius: 4, cursor: 'pointer', fontSize: '0.68rem', fontFamily: "'Montserrat',sans-serif" }}>
                                    Remove
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button type="button" onClick={() => onImageClick(ps.id)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '9px 16px', background: 'white', border: '2px dashed var(--admin-border)', borderRadius: 4, cursor: 'pointer', fontFamily: "'Montserrat',sans-serif", fontSize: '0.72rem', color: 'var(--admin-muted)', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--admin-gold)'; e.currentTarget.style.color = 'var(--admin-gold)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.color = 'var(--admin-muted)'; }}>
                            <i className="fas fa-cloud-upload-alt" /> Click to upload reference image
                        </button>
                    )}
                </div>

                {/* Placements */}
                <PlacementSection
                    styleId={ps.id}
                    placements={ps.placements || []}
                    customPlacements={ps.customPlacements || []}
                    onToggle={onTogglePlacement}
                    onGroupToggle={onGroupToggle}
                    onAddCustom={onAddCustom}
                    onRemoveCustom={onRemoveCustom}
                />
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
export default function MfgPrintStyles() {
    const { user } = useAuth();
    const [styles, setStyles]     = useState([]);
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [toast, setToast]       = useState(null);
    const [uploadingId, setUploadingId]       = useState(null);
    const [pendingStyleId, setPendingStyleId] = useState(null);
    const [editingIds, setEditingIds]         = useState({}); // which cards are in edit mode
    const fileInputRef = useRef(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

    /* ── Load ── */
    const fetchStyles = async () => {
        if (!user) return;
        try {
            const data = await apiFetch(`/api/print-styles?mfg_id=${user.id}`);

            const list = (data || []).map(row => {
                let costVal = 0;
                let descVal = '';
                let placementsVal = [];
                let customPlacementsVal = [];
                try {
                    const parsed = JSON.parse(row.description);
                    costVal = Number(parsed.cost) || 0;
                    descVal = parsed.description || '';
                    placementsVal = parsed.placements || [];
                    customPlacementsVal = parsed.customPlacements || [];
                } catch (e) {
                    descVal = row.description || '';
                }
                return {
                    id: row.id,
                    name: row.name,
                    cost: costVal,
                    imageUrl: row.image || '',
                    description: descVal,
                    placements: placementsVal,
                    customPlacements: customPlacementsVal
                };
            });
            setStyles(list);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching print styles:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchStyles();
        }
    }, [user]);

    /* ── Style CRUD ── */
    const addStyle = () => {
        const id = Date.now().toString();
        setStyles(prev => [...prev, { id, name: '', cost: '', imageUrl: '', placements: [], customPlacements: [] }]);
        setEditingIds(prev => ({ ...prev, [id]: true }));
    };

    const handleRemoveStyle = async (id) => {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUUID) {
            if (!window.confirm('Are you sure you want to permanently delete this print style from the database?')) {
                return;
            }
            try {
                setSaving(true);
                await apiFetch(`/api/print-styles/${id}`, {
                    method: 'DELETE'
                });
                showToast('Print style deleted successfully.');
                fetchStyles();
            } catch (err) {
                console.error('Error deleting print style:', err);
                showToast('Failed to delete print style: ' + (err.error || err.message || err), 'error');
            } finally {
                setSaving(false);
            }
        } else {
            setStyles(prev => prev.filter(s => s.id !== id));
            setEditingIds(prev => { const n = { ...prev }; delete n[id]; return n; });
        }
    };

    const updateStyle = (id, field, value) =>
        setStyles(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

    /* ── Placements ── */
    const togglePlacement = (styleId, pid) => setStyles(prev => prev.map(s => {
        if (s.id !== styleId) return s;
        const has = (s.placements || []).includes(pid);
        return { ...s, placements: has ? s.placements.filter(p => p !== pid) : [...(s.placements || []), pid] };
    }));
    const toggleGroupPlacements = (styleId, groupIds, selectAll) => setStyles(prev => prev.map(s => {
        if (s.id !== styleId) return s;
        const cur = s.placements || [];
        return { ...s, placements: selectAll ? [...new Set([...cur, ...groupIds])] : cur.filter(p => !groupIds.includes(p)) };
    }));
    const addCustomPlacement = (styleId, groupId, label) => {
        const id = `custom_${groupId}_${Date.now()}`;
        setStyles(prev => prev.map(s => s.id !== styleId ? s : {
            ...s,
            customPlacements: [...(s.customPlacements || []), { id, groupId, label }],
            placements: [...(s.placements || []), id],
        }));
    };
    const removeCustomPlacement = (styleId, pid) => setStyles(prev => prev.map(s => s.id !== styleId ? s : {
        ...s,
        customPlacements: (s.customPlacements || []).filter(c => c.id !== pid),
        placements: (s.placements || []).filter(p => p !== pid),
    }));

    /* ── Image upload ── */
    const handleImageClick = (styleId) => { setPendingStyleId(styleId); fileInputRef.current.value = ''; fileInputRef.current.click(); };
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !pendingStyleId) return;
        setUploadingId(pendingStyleId);
        try {
            const ext = file.name.split('.').pop() || 'jpg';
            const filePath = `mfgPrintStyles/${user.id}/${pendingStyleId}.${ext}`;
            const url = await uploadFile('asat-uploads', filePath, file);
            updateStyle(pendingStyleId, 'imageUrl', url);
            showToast('Reference image uploaded!');
        } catch (err) {
            showToast('Failed to upload image: ' + err.message, 'error');
        } finally { setUploadingId(null); setPendingStyleId(null); }
    };

    /* ── Save ── */
    const handleDoneEditing = async (ps) => {
        if (!ps.name.trim()) {
            showToast('Style name must be filled in.', 'error');
            return;
        }
        if (ps.cost === '' || isNaN(parseFloat(ps.cost)) || parseFloat(ps.cost) < 0) {
            showToast(`Enter a valid add-on cost for "${ps.name}".`, 'error');
            return;
        }

        try {
            setSaving(true);
            const isNew = !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ps.id);
            const payload = {
                name: ps.name.trim(),
                cost: parseFloat(ps.cost) || 0,
                placements: ps.placements || [],
                customPlacements: ps.customPlacements || [],
                imageUrl: ps.imageUrl || '',
                active: ps.active !== undefined ? ps.active : true
            };

            if (isNew) {
                const data = await apiFetch('/api/print-styles', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showToast('Print style created successfully!');
                setStyles(prev => prev.map(s => s.id === ps.id ? { ...s, id: data.style.id } : s));
            } else {
                await apiFetch(`/api/print-styles/${ps.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                showToast('Print style updated successfully!');
            }

            setEditingIds(p => ({ ...p, [ps.id]: false }));
            fetchStyles();
        } catch (err) {
            console.error('Error saving print style:', err);
            showToast('Failed to save print style: ' + (err.error || err.message || err), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="adm-page" style={{ fontFamily: "'Montserrat',sans-serif" }}>
            <BackButton />
            <h1 className="adm-page__title">PRINT STYLES</h1>
            <p className="adm-page__subtitle">Define printing methods, costs, reference images and placement areas. Cards collapse into a summary after saving.</p>

            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

            {toast && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 18px', background: toast.type === 'error' ? '#fce8e6' : '#e6f4ea', color: toast.type === 'error' ? '#c5221f' : '#137333', borderLeft: `4px solid ${toast.type === 'error' ? 'var(--admin-danger)' : '#34a853'}`, fontFamily: "'Montserrat',sans-serif", fontSize: '0.78rem', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', borderRadius: 4, maxWidth: 360 }}>
                    <i className={`fas ${toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`} style={{ marginRight: 8 }} />{toast.msg}
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0', color: '#888', fontSize: '0.8rem' }}>
                    <i className="fas fa-circle-notch fa-spin" style={{ color: 'var(--admin-gold)' }} /> Loading…
                </div>
            ) : (
                <div style={{ maxWidth: 920 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                            {styles.length} method{styles.length !== 1 ? 's' : ''} configured
                        </span>
                        <button type="button" onClick={addStyle}
                            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'var(--admin-dark)', color: 'white', border: 'none', borderRadius: 4, fontFamily: "'Montserrat',sans-serif", fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--admin-gold)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--admin-dark)'}>
                            <i className="fas fa-plus" /> Add Printing Method
                        </button>
                    </div>

                    {styles.length === 0 && (
                        <div style={{ padding: '50px 20px', textAlign: 'center', border: '2px dashed var(--admin-border)', borderRadius: 8, background: 'white' }}>
                            <i className="fas fa-print" style={{ fontSize: '2.5rem', color: '#ddd', display: 'block', marginBottom: 14 }} />
                            <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '0.82rem', color: 'var(--admin-muted)', margin: 0 }}>
                                No print styles yet. Click <strong>+ Add Printing Method</strong> to get started.
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {styles.map((ps, idx) =>
                            editingIds[ps.id] ? (
                                <StyleEditCard
                                    key={ps.id} ps={ps} idx={idx}
                                    uploadingId={uploadingId}
                                    onUpdate={updateStyle}
                                    onRemove={() => handleRemoveStyle(ps.id)}
                                    onImageClick={handleImageClick}
                                    onTogglePlacement={togglePlacement}
                                    onGroupToggle={toggleGroupPlacements}
                                    onAddCustom={addCustomPlacement}
                                    onRemoveCustom={removeCustomPlacement}
                                    onDone={() => handleDoneEditing(ps)}
                                />
                            ) : (
                                <StyleSummaryCard
                                    key={ps.id} ps={ps} idx={idx}
                                    onEdit={() => setEditingIds(p => ({ ...p, [ps.id]: true }))}
                                    onRemove={() => handleRemoveStyle(ps.id)}
                                />
                            )
                        )}
                    </div>

                    {styles.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--admin-border)' }}>
                            <span style={{ marginRight: 'auto', fontSize: '0.7rem', color: 'var(--admin-muted)' }}>
                                <i className="fas fa-info-circle" style={{ marginRight: 5, color: 'var(--admin-gold)' }} />
                                Click "Done" on a card to save changes to the database.
                            </span>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}

const LABEL_ST = { display: 'block', fontFamily: "'Montserrat',sans-serif", fontSize: '0.6rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--admin-muted)', marginBottom: 5 };
const INPUT_ST = { width: '100%', padding: '9px 11px', border: '1px solid var(--admin-border)', fontFamily: "'Montserrat',sans-serif", fontSize: '0.82rem', color: 'var(--admin-text)', borderRadius: 3, outline: 'none', boxSizing: 'border-box', background: 'white', transition: 'border-color 0.2s' };
