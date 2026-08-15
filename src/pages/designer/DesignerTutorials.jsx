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

    const styles = `
        .dsn-tut-page {
            padding: 40px 5%;
            max-width: 1400px;
            margin: 0 auto;
            min-height: 80vh;
        }
        .dsn-tut-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
            gap: 16px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
            padding-bottom: 20px;
        }
        .dsn-tut-title {
            font-family: 'Cinzel', serif;
            font-size: 1.8rem;
            font-weight: 700;
            letter-spacing: 2px;
            color: #000000;
            margin: 0;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .dsn-tut-subtitle {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.82rem;
            color: #666;
            margin: 4px 0 0;
        }
        .dsn-tut-search-wrap {
            position: relative;
            width: 300px;
            max-width: 100%;
        }
        .dsn-tut-search-input {
            width: 100%;
            padding: 12px 14px 12px 38px;
            border-radius: 8px;
            border: 1px solid rgba(0,0,0,0.1);
            background: rgba(255, 255, 255, 0.45);
            font-size: 0.85rem;
            font-family: 'Montserrat', sans-serif;
            box-sizing: border-box;
            box-shadow: 0 4px 12px rgba(0,0,0,0.01);
            outline: none;
            color: #000000;
            transition: all 0.25s ease;
        }
        .dsn-tut-search-input:focus {
            border-color: #000000;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(0,0,0,0.05);
        }
        .dsn-tut-search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%) !important;
            color: #888;
            font-size: 0.82rem;
        }
        .dsn-tut-tags {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 30px;
        }
        @media (max-width: 768px) {
            .dsn-tut-tags {
                flex-wrap: nowrap !important;
                overflow-x: auto !important;
                padding-bottom: 8px;
                scrollbar-width: none;
            }
            .dsn-tut-tags::-webkit-scrollbar {
                display: none;
            }
            .dsn-tut-tag-btn {
                flex-shrink: 0;
            }
        }
        .dsn-tut-tag-btn {
            padding: 8px 18px;
            border-radius: 20px;
            border: 1px solid rgba(0, 0, 0, 0.08);
            background: rgba(255, 255, 255, 0.5);
            color: #555;
            font-size: 0.8rem;
            font-weight: 700;
            font-family: 'Montserrat', sans-serif;
            cursor: pointer;
            transition: all 0.25s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .dsn-tut-tag-btn:hover {
            background: rgba(0,0,0,0.03);
            border-color: rgba(0,0,0,0.15);
        }
        .dsn-tut-tag-btn.active {
            background: #000000;
            border-color: #000000;
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .dsn-tut-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: 30px;
        }
        .dsn-tut-card {
            background: rgba(255, 255, 255, 0.72);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.02);
            display: flex;
            flex-direction: column;
            transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dsn-tut-card:hover {
            transform: translateY(-6px);
            border-color: rgba(0, 0, 0, 0.12);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.06);
        }
        .dsn-tut-video-wrap {
            position: relative;
            width: 100%;
            padding-top: 56.25%;
            background: #000000;
        }
        .dsn-tut-video-iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
        .dsn-tut-content {
            padding: 20px;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .dsn-tut-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        .dsn-tut-badge {
            font-size: 0.65rem;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 20px;
            background: #000000;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        .dsn-tut-date {
            font-size: 0.7rem;
            color: #888;
            font-weight: 500;
            font-family: 'Montserrat', sans-serif;
        }
        .dsn-tut-card-title {
            font-family: 'Montserrat', sans-serif;
            font-size: 1rem;
            font-weight: 700;
            color: #000000;
            margin: 4px 0 8px;
            line-height: 1.4;
        }
        .dsn-tut-desc {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.82rem;
            color: #555;
            margin: 0;
            line-height: 1.5;
        }
        .dsn-tut-empty {
            text-align: center;
            padding: 60px 20px;
            background: rgba(255, 255, 255, 0.72);
            backdrop-filter: blur(12px);
            border: 1px dashed rgba(0, 0, 0, 0.1);
            border-radius: 16px;
            color: #555;
        }
    `;

    return (
        <main className="dsn-tut-page">
            <style>{styles}</style>
            <BackButton />

            <div className="dsn-tut-head">
                <div>
                    <h1 className="dsn-tut-title">
                        <i className="fas fa-play-circle" style={{ color: '#000000' }}></i>
                        DESIGNER VIDEO TUTORIALS
                    </h1>
                    <p className="dsn-tut-subtitle">
                        Learn best practices, mockup guidelines, tech pack setups, and earning strategies
                    </p>
                </div>

                {/* Search Bar */}
                <div className="dsn-tut-search-wrap">
                    <input
                        type="text"
                        placeholder="Search video tutorials, tags..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="dsn-tut-search-input"
                    />
                    <i className="fas fa-search dsn-tut-search-icon"></i>
                </div>
            </div>

            {/* Tag Filter Chips */}
            <div className="dsn-tut-tags">
                {allTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => setActiveTag(tag)}
                        className={`dsn-tut-tag-btn ${activeTag === tag ? 'active' : ''}`}
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
                <div className="dsn-tut-empty">
                    <i className="fas fa-video-slash" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: 12, display: 'block' }}></i>
                    <h3 style={{ fontFamily: 'Montserrat', fontSize: '1rem', color: '#334155', margin: 0 }}>No Tutorials Found</h3>
                    <p style={{ fontFamily: 'Montserrat', fontSize: '0.82rem', color: '#64748b', marginTop: 4 }}>Try adjusting your search query or tag filter.</p>
                </div>
            ) : (
                <div className="dsn-tut-grid">
                    {filteredTutorials.map(t => {
                        const embedUrl = getEmbedUrl(t.video_url);
                        return (
                            <div key={t.id} className="dsn-tut-card">
                                {/* Video Iframe */}
                                <div className="dsn-tut-video-wrap">
                                    <iframe
                                        src={embedUrl}
                                        title={t.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="dsn-tut-video-iframe"
                                    />
                                </div>

                                <div className="dsn-tut-content">
                                    <div>
                                        <div className="dsn-tut-meta">
                                            <span className="dsn-tut-badge">
                                                {t.tag || 'General'}
                                            </span>
                                            <span className="dsn-tut-date">
                                                {t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                            </span>
                                        </div>

                                        <h3 className="dsn-tut-card-title">
                                            {t.title}
                                        </h3>

                                        {t.description && (
                                            <p className="dsn-tut-desc">
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
