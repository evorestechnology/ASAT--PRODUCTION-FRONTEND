import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import BackButton from '../../components/BackButton';
import '../../styles/admin.css';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';

const getEmbedUrl = (url) => {
    if (!url) return '';
    let str = url.trim();
    if (str.includes('youtube.com/watch?v=')) {
        const vId = str.split('v=')[1]?.split('&')[0];
        return `https://www.youtube.com/embed/${vId}`;
    }
    if (str.includes('youtu.be/')) {
        const vId = str.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${vId}`;
    }
    if (str.includes('vimeo.com/')) {
        const vId = str.split('vimeo.com/')[1]?.split('?')[0];
        return `https://player.vimeo.com/video/${vId}`;
    }
    return str;
};

function MasterTutorials() {
    const { toasts, showToast } = useToast();
    const [tutorials, setTutorials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('All');

    // Modal state for Add/Edit
    const [showModal, setShowModal] = useState(false);
    const [editingTutorial, setEditingTutorial] = useState(null);
    const [formTitle, setFormTitle] = useState('');
    const [formUrl, setFormUrl] = useState('');
    const [formTag, setFormTag] = useState('Design Guidelines');
    const [formCustomTag, setFormCustomTag] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [saving, setSaving] = useState(false);

    // Delete modal state
    const [deleteId, setDeleteId] = useState(null);

    const PRESET_TAGS = ['Design Guidelines', 'Mockup Creation', 'Tech Pack Setup', 'Royalty & Earnings', 'Best Practices'];

    const fetchTutorials = async () => {
        try {
            const data = await apiFetch('/api/tutorials');
            setTutorials(data || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching tutorials:', err);
            showToast('Failed to load tutorials list.', 'error');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTutorials();
    }, []);

    const handleOpenCreateModal = () => {
        setEditingTutorial(null);
        setFormTitle('');
        setFormUrl('');
        setFormTag('Design Guidelines');
        setFormCustomTag('');
        setFormDescription('');
        setShowModal(true);
    };

    const handleOpenEditModal = (t) => {
        setEditingTutorial(t);
        setFormTitle(t.title || '');
        setFormUrl(t.video_url || '');
        if (PRESET_TAGS.includes(t.tag)) {
            setFormTag(t.tag);
            setFormCustomTag('');
        } else {
            setFormTag('Other');
            setFormCustomTag(t.tag || '');
        }
        setFormDescription(t.description || '');
        setShowModal(true);
    };

    const handleSaveTutorial = async (e) => {
        e.preventDefault();
        if (!formTitle.trim() || !formUrl.trim()) {
            showToast('Title and Video URL are required.', 'warning');
            return;
        }

        const tagToSave = formTag === 'Other' ? (formCustomTag.trim() || 'General') : formTag;
        setSaving(true);

        try {
            const payload = {
                title: formTitle.trim(),
                video_url: formUrl.trim(),
                tag: tagToSave,
                description: formDescription.trim(),
                target_role: 'designer'
            };

            if (editingTutorial) {
                await apiFetch(`/api/tutorials/${editingTutorial.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                showToast('Tutorial updated successfully!', 'success');
            } else {
                await apiFetch('/api/tutorials', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showToast('New video tutorial added!', 'success');
            }

            setShowModal(false);
            fetchTutorials();
        } catch (err) {
            console.error('Error saving tutorial:', err);
            showToast(err.error || 'Failed to save tutorial.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTutorial = async (id) => {
        try {
            await apiFetch(`/api/tutorials/${id}`, { method: 'DELETE' });
            showToast('Tutorial video deleted.', 'success');
            setDeleteId(null);
            fetchTutorials();
        } catch (err) {
            console.error('Error deleting tutorial:', err);
            showToast('Failed to delete tutorial.', 'error');
        }
    };

    const allTags = ['All', ...Array.from(new Set([...PRESET_TAGS, ...tutorials.map(t => t.tag).filter(Boolean)]))];

    const filteredTutorials = tutorials.filter(t => {
        const matchesTag = selectedTag === 'All' || (t.tag || '').toLowerCase() === selectedTag.toLowerCase();
        const q = searchTerm.toLowerCase().trim();
        const matchesSearch = !q || (t.title || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q) || (t.tag || '').toLowerCase().includes(q);
        return matchesTag && matchesSearch;
    });

    return (
        <main className="adm-page">
            <style>{TOAST_CSS}</style>
            <ToastContainer toasts={toasts} />
            <BackButton />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="adm-page__title">DESIGNER TUTORIALS MANAGEMENT</h1>
                    <p className="adm-page__subtitle">Upload, edit, and categorize video guides for designers</p>
                </div>
                <button
                    className="adm-settings__btn"
                    style={{ background: 'var(--gold, #C5A059)', color: '#121212', fontWeight: 700, padding: '12px 22px' }}
                    onClick={handleOpenCreateModal}
                >
                    <i className="fas fa-plus" style={{ marginRight: 6 }}></i> Add Video Tutorial
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14, background: '#181818', padding: 14, borderRadius: 8, border: '1px solid #2a2a2a' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 20,
                                border: selectedTag === tag ? '1px solid var(--gold)' : '1px solid #333',
                                background: selectedTag === tag ? 'rgba(197,160,89,0.15)' : '#222',
                                color: selectedTag === tag ? 'var(--gold)' : '#aaa',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                <div style={{ position: 'relative', width: 260 }}>
                    <input
                        type="text"
                        placeholder="Search video tutorials..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px 8px 34px',
                            background: '#121212',
                            border: '1px solid #333',
                            borderRadius: 6,
                            color: '#fff',
                            fontSize: '0.8rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                    <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '0.75rem' }}></i>
                </div>
            </div>

            {/* Tutorials List Grid */}
            {loading ? (
                <div className="adm-loading"><div className="adm-spinner"></div><p>Loading tutorials...</p></div>
            ) : filteredTutorials.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#141414', borderRadius: 8, border: '1px solid #262626' }}>
                    <i className="fas fa-video-slash" style={{ fontSize: '2.2rem', color: '#444', marginBottom: 12, display: 'block' }}></i>
                    <p style={{ color: '#aaa', fontSize: '0.9rem' }}>No video tutorials found matching your filter.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {filteredTutorials.map(t => {
                        const embedUrl = getEmbedUrl(t.video_url);
                        return (
                            <div key={t.id} style={{ background: '#1c1c1c', border: '1px solid #2e2e2e', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                {/* Video Iframe Preview */}
                                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
                                    <iframe
                                        src={embedUrl}
                                        title={t.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                    />
                                </div>

                                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: 'rgba(197,160,89,0.15)', color: 'var(--gold)', border: '1px solid rgba(197,160,89,0.3)', textTransform: 'uppercase' }}>
                                                {t.tag || 'General'}
                                            </span>
                                            <span style={{ fontSize: '0.68rem', color: '#666' }}>
                                                {t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                                            </span>
                                        </div>

                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: '6px 0', lineHeight: 1.4 }}>{t.title}</h3>
                                        {t.description && (
                                            <p style={{ fontSize: '0.78rem', color: '#aaa', margin: '4px 0 14px', lineHeight: 1.5 }}>
                                                {t.description}
                                            </p>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid #282828' }}>
                                        <button
                                            onClick={() => handleOpenEditModal(t)}
                                            style={{ flex: 1, padding: '8px', background: '#2a2a2a', border: '1px solid #3d3d3d', color: '#fff', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            <i className="fas fa-edit" style={{ marginRight: 4 }}></i> Edit
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(t.id)}
                                            style={{ flex: 1, padding: '8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            <i className="fas fa-trash-alt" style={{ marginRight: 4 }}></i> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="adm-modal-overlay" onClick={() => !saving && setShowModal(false)}>
                    <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}>
                        <h2 style={{ fontSize: '1.1rem', margin: '0 0 16px', color: 'var(--gold)' }}>
                            {editingTutorial ? 'Edit Video Tutorial' : 'Add New Video Tutorial'}
                        </h2>

                        <form onSubmit={handleSaveTutorial} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#aaa', display: 'block', marginBottom: 6 }}>
                                    Tutorial Title *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Preparing High-Res Mockups & PNG Files"
                                    value={formTitle}
                                    onChange={e => setFormTitle(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: 10, background: '#121212', border: '1px solid #333', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#aaa', display: 'block', marginBottom: 6 }}>
                                    Video URL (YouTube / Vimeo / MP4) *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. https://www.youtube.com/watch?v=..."
                                    value={formUrl}
                                    onChange={e => setFormUrl(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: 10, background: '#121212', border: '1px solid #333', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#aaa', display: 'block', marginBottom: 6 }}>
                                    Tag / Category *
                                </label>
                                <select
                                    value={formTag}
                                    onChange={e => setFormTag(e.target.value)}
                                    style={{ width: '100%', padding: 10, background: '#121212', border: '1px solid #333', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                                >
                                    {PRESET_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                                    <option value="Other">Other Custom Tag</option>
                                </select>
                            </div>

                            {formTag === 'Other' && (
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#aaa', display: 'block', marginBottom: 6 }}>
                                        Custom Tag Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Color Profiling"
                                        value={formCustomTag}
                                        onChange={e => setFormCustomTag(e.target.value)}
                                        style={{ width: '100%', padding: 10, background: '#121212', border: '1px solid #333', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                                    />
                                </div>
                            )}

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#aaa', display: 'block', marginBottom: 6 }}>
                                    Description / Key Notes
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Add helpful notes, guidelines, or summaries for this tutorial..."
                                    value={formDescription}
                                    onChange={e => setFormDescription(e.target.value)}
                                    style={{ width: '100%', padding: 10, background: '#121212', border: '1px solid #333', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    disabled={saving}
                                    style={{ padding: '10px 18px', background: '#333', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{ padding: '10px 22px', background: 'var(--gold)', border: 'none', color: '#121212', fontWeight: 700, borderRadius: 6, cursor: 'pointer' }}
                                >
                                    {saving ? 'Saving...' : editingTutorial ? 'Update Tutorial' : 'Publish Tutorial'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="adm-modal-overlay" onClick={() => setDeleteId(null)}>
                    <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}>
                        <h3 style={{ margin: '0 0 8px', color: '#ef4444' }}>Delete Video Tutorial?</h3>
                        <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: 20 }}>This tutorial will be permanently removed for all designers.</p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteId(null)} style={{ padding: '8px 16px', background: '#333', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => handleDeleteTutorial(deleteId)} style={{ padding: '8px 18px', background: '#ef4444', border: 'none', color: '#fff', fontWeight: 700, borderRadius: 6, cursor: 'pointer' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default MasterTutorials;
