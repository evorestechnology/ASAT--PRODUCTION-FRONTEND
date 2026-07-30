import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import BackButton from '../../components/BackButton';
import '../../styles/designer.css';

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

function DesignerTutorials() {
    const [tutorials, setTutorials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTag, setActiveTag] = useState('All');

    const fetchTutorials = async () => {
        try {
            const data = await apiFetch('/api/tutorials');
            setTutorials(data || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching tutorials for designer:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTutorials();
    }, []);

    const allTags = ['All', ...Array.from(new Set(tutorials.map(t => t.tag).filter(Boolean)))];

    const filteredTutorials = tutorials.filter(t => {
        const matchesTag = activeTag === 'All' || (t.tag || '').toLowerCase() === activeTag.toLowerCase();
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q ||
            (t.title || '').toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q) ||
            (t.tag || '').toLowerCase().includes(q);
        return matchesTag && matchesSearch;
    });

    return (
        <main className="dsn-page" style={{ padding: '30px 5%', minHeight: '80vh', maxWidth: 1280, margin: '0 auto' }}>
            <BackButton />

            <div style={{ marginBottom: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#1a1a1a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <i className="fas fa-play-circle" style={{ color: 'var(--gold, #C5A059)', marginRight: 10 }}></i>
                        DESIGNER VIDEO TUTORIALS
                    </h1>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem', color: '#666', marginTop: 4 }}>
                        Learn best practices, mockup guidelines, tech pack setups, and earning strategies
                    </p>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', width: 300, maxWidth: '100%' }}>
                    <input
                        type="text"
                        placeholder="Search video tutorials, tags..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 14px 10px 38px',
                            borderRadius: 8,
                            border: '1px solid #ddd',
                            fontSize: '0.85rem',
                            fontFamily: 'Montserrat',
                            boxSizing: 'border-box',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                            outline: 'none'
                        }}
                    />
                    <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '0.82rem' }}></i>
                </div>
            </div>

            {/* Tag Filter Chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                {allTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => setActiveTag(tag)}
                        style={{
                            padding: '8px 18px',
                            borderRadius: 20,
                            border: activeTag === tag ? '1px solid var(--gold, #C5A059)' : '1px solid #e2e8f0',
                            background: activeTag === tag ? 'var(--gold, #C5A059)' : '#fff',
                            color: activeTag === tag ? '#fff' : '#475569',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            fontFamily: 'Montserrat',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: activeTag === tag ? '0 4px 12px rgba(197,160,89,0.25)' : '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            {/* Video Cards Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div className="dsn-spinner" style={{ margin: '0 auto 15px' }}></div>
                    <p style={{ fontFamily: 'Montserrat', fontSize: '0.85rem', color: '#666' }}>Loading video tutorials...</p>
                </div>
            ) : filteredTutorials.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <i className="fas fa-video-slash" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: 12, display: 'block' }}></i>
                    <h3 style={{ fontFamily: 'Montserrat', fontSize: '1rem', color: '#334155', margin: 0 }}>No Tutorials Found</h3>
                    <p style={{ fontFamily: 'Montserrat', fontSize: '0.82rem', color: '#64748b', marginTop: 4 }}>Try adjusting your search query or tag filter.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                    {filteredTutorials.map(t => {
                        const embedUrl = getEmbedUrl(t.video_url);
                        return (
                            <div key={t.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                                {/* Video Iframe */}
                                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#0f172a' }}>
                                    <iframe
                                        src={embedUrl}
                                        title={t.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                    />
                                </div>

                                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 12, background: 'rgba(197,160,89,0.12)', color: 'var(--gold, #C5A059)', border: '1px solid rgba(197,160,89,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {t.tag || 'General'}
                                            </span>
                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
                                                {t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                            </span>
                                        </div>

                                        <h3 style={{ fontFamily: 'Montserrat', fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '4px 0 8px', lineHeight: 1.4 }}>
                                            {t.title}
                                        </h3>

                                        {t.description && (
                                            <p style={{ fontFamily: 'Montserrat', fontSize: '0.82rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                                                {t.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}

export default DesignerTutorials;
