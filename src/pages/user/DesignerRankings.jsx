import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import BackButton from '../../components/BackButton';
import { useCurrency } from '../../context/CurrencyContext';

const styles = `
    /* ═══════ Public Designer Rankings ═══════ */
    .rnk-page {
        min-height: 90vh;
        background: var(--light);
        padding-bottom: 80px;
        font-family: 'Montserrat', sans-serif;
    }

    .rnk-hero {
        background: var(--dark);
        color: white;
        padding: 60px 5% 55px;
        text-align: center;
        position: relative;
        overflow: hidden;
    }
    .rnk-hero::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 50% 120%, rgba(197, 160, 89, 0.15), transparent 70%);
        pointer-events: none;
    }
    .rnk-hero h1 {
        font-family: 'Cinzel', serif;
        font-size: 2.5rem;
        letter-spacing: 6px;
        font-weight: 700;
        margin: 0 0 10px;
        color: #fff;
    }
    .rnk-hero p {
        font-size: 0.88rem;
        letter-spacing: 2px;
        color: #aaa;
        max-width: 600px;
        margin: 0 auto;
        line-height: 1.6;
    }

    .rnk-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 4%;
    }

    /* ── Top 3 Podiums ── */
    .rnk-podium-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 30px;
        margin-bottom: 50px;
        align-items: flex-end;
    }

    .rnk-podium-card {
        background: white;
        border: 1px solid rgba(197, 160, 89, 0.15);
        border-radius: 12px;
        padding: 30px 20px;
        text-align: center;
        position: relative;
        box-shadow: 0 10px 30px rgba(0,0,0,0.03);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        cursor: pointer;
    }
    .rnk-podium-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 15px 35px rgba(197,160,89,0.12);
        border-color: var(--gold);
    }

    /* Rank 1 Podium is taller & highlighted */
    .rnk-podium-card--rank1 {
        order: 2;
        padding: 45px 24px;
        background: linear-gradient(to bottom, #ffffff, #fffdf8);
        border: 2px solid var(--gold);
        box-shadow: 0 15px 40px rgba(197,160,89,0.08);
    }
    .rnk-podium-card--rank2 { order: 1; }
    .rnk-podium-card--rank3 { order: 3; }

    .rnk-podium-medal {
        font-size: 2.5rem;
        margin-bottom: 12px;
        display: block;
        line-height: 1;
    }
    .rnk-podium-card--rank1 .rnk-podium-medal { font-size: 3.2rem; }

    .rnk-avatar-wrap {
        position: relative;
        width: 80px;
        height: 80px;
        margin: 0 auto 16px;
        border-radius: 50%;
        padding: 4px;
        background: #eee;
    }
    .rnk-podium-card--rank1 .rnk-avatar-wrap {
        width: 100px;
        height: 100px;
        background: linear-gradient(135deg, #C5A059, #e8c97a);
    }
    .rnk-avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        background: white;
    }

    .rnk-badge {
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--dark);
        color: var(--gold);
        font-size: 0.58rem;
        letter-spacing: 1px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 4px 10px;
        border-radius: 30px;
        white-space: nowrap;
        border: 1px solid var(--gold);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .rnk-podium-name {
        font-family: 'Cinzel', serif;
        font-size: 1.15rem;
        font-weight: 700;
        letter-spacing: 1px;
        color: var(--dark);
        margin: 12px 0 4px;
    }
    .rnk-podium-card--rank1 .rnk-podium-name { font-size: 1.35rem; }

    .rnk-podium-handle {
        font-size: 0.75rem;
        color: #888;
        letter-spacing: 1px;
        margin-bottom: 12px;
        display: block;
    }

    .rnk-podium-score-label {
        font-size: 0.65rem;
        letter-spacing: 1.5px;
        color: #999;
        text-transform: uppercase;
        display: block;
        margin-bottom: 2px;
    }
    .rnk-podium-score {
        font-family: 'Cinzel', serif;
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--gold);
    }
    .rnk-podium-card--rank1 .rnk-podium-score { font-size: 1.55rem; }

    /* ── Table & Search Controls ── */
    .rnk-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        gap: 20px;
    }
    .rnk-search-wrap {
        position: relative;
        flex: 1;
        max-width: 400px;
    }
    .rnk-search-wrap i {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: #aaa;
        font-size: 0.9rem;
    }
    .rnk-search-input {
        width: 100%;
        padding: 12px 14px 12px 40px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        outline: none;
        transition: border-color 0.3s;
    }
    .rnk-search-input:focus {
        border-color: var(--gold);
    }

    .rnk-stats-summary {
        font-size: 0.8rem;
        letter-spacing: 1px;
        color: #666;
    }

    /* ── Rankings Table ── */
    .rnk-table-card {
        background: white;
        border: 1px solid #eee;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        overflow-x: auto;
    }
    .rnk-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
    }
    .rnk-table th {
        font-family: 'Cinzel', serif;
        padding: 18px 24px;
        border-bottom: 2px solid var(--dark);
        color: var(--dark);
        letter-spacing: 1.5px;
        font-size: 0.8rem;
        text-transform: uppercase;
    }
    .rnk-table td {
        padding: 18px 24px;
        border-bottom: 1px solid #f2f2f2;
        font-size: 0.88rem;
        color: #444;
        vertical-align: middle;
    }
    .rnk-table tr:last-child td { border-bottom: none; }
    .rnk-table tbody tr {
        transition: background 0.2s;
        cursor: pointer;
    }
    .rnk-table tbody tr:hover {
        background: rgba(197, 160, 89, 0.02);
    }

    .rnk-table-rank {
        font-family: 'Cinzel', serif;
        font-weight: 700;
        font-size: 0.95rem;
        color: var(--dark);
    }

    .rnk-table-designer {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .rnk-table-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid #eee;
    }
    .rnk-table-name {
        font-family: 'Cinzel', serif;
        font-weight: 600;
        letter-spacing: 0.5px;
        color: var(--dark);
        display: block;
    }
    .rnk-table-handle {
        font-size: 0.72rem;
        color: #888;
        letter-spacing: 0.5px;
    }

    .rnk-table-badge {
        font-size: 0.7rem;
        letter-spacing: 1px;
        text-transform: uppercase;
        font-weight: 600;
        color: var(--gold);
    }

    .rnk-table-score {
        font-family: 'Cinzel', serif;
        font-weight: 700;
        color: var(--dark);
    }

    .rnk-view-btn {
        background: transparent;
        border: 1px solid var(--dark);
        padding: 6px 12px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.7rem;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
        transition: 0.3s;
        border-radius: 2px;
    }
    .rnk-table tr:hover .rnk-view-btn {
        background: var(--dark);
        color: white;
        border-color: var(--dark);
    }

    /* ── Empty & Skeleton ── */
    .rnk-empty {
        text-align: center;
        padding: 50px 20px;
        color: #888;
    }
    .rnk-empty i { font-size: 3rem; color: #ddd; margin-bottom: 12px; }

    @media (max-width: 900px) {
        .rnk-podium-row {
            grid-template-columns: 1fr;
            gap: 20px;
        }
        .rnk-podium-card--rank1 { order: 1; }
        .rnk-podium-card--rank2 { order: 2; }
        .rnk-podium-card--rank3 { order: 3; }
        .rnk-controls { flex-direction: column; align-items: stretch; }
    }
`;

function DesignerRankings() {
    const navigate = useNavigate();
    const { formatPrice } = useCurrency();
    const [designers, setDesigners] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDesigners = async () => {
            try {
                // Fetch active designers from backend rankings
                const data = await apiFetch('/api/designers/rankings');

                let list = (data || [])
                    .filter((d) => d.status === 'active')
                    .sort((a, b) => (b.points || 0) - (a.points || 0))
                    .map((d, idx) => ({
                        id: d.id,
                        fullName: d.full_name || 'Anonymous Designer',
                        username: d.username || 'anonymous',
                        avatar: d.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.full_name || 'D')}&background=C5A059&color=121212&bold=true&size=200`,
                        badge: d.rank_badge || 'Bronze Designer',
                        score: d.points || 0,
                        country: d.country || 'India',
                        designsCount: d.designs_count || 0,
                        rank: idx + 1,
                    }));

                setDesigners(list);
            } catch (err) {
                console.error('Error fetching leaderboard rankings:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDesigners();
    }, []);

    const filtered = designers.filter(d =>
        d.fullName.toLowerCase().includes(search.toLowerCase()) ||
        d.username.toLowerCase().includes(search.toLowerCase())
    );

    // Split top 3 vs rest
    const podiums = filtered.filter(d => d.rank <= 3);
    const tableItems = filtered.filter(d => d.rank > 3);

    return (
        <>
            <style>{styles}</style>
            <div className="rnk-page">
                <div className="rnk-hero">
                    <BackButton />
                    <h1>CREATOR RANKINGS</h1>
                    <p>The visionary designers shaping the future of elite custom streetwear &amp; luxury catalog aesthetics.</p>
                </div>

                <div className="rnk-container">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: "'Montserrat'", color: '#888' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                border: '2px solid rgba(197,160,89,0.15)', borderTopColor: 'var(--gold)',
                                animation: 'spin 1s linear infinite', margin: '0 auto 20px'
                            }} />
                            <p style={{ letterSpacing: '2px', fontSize: '0.85rem' }}>RESOLVING CREATOR LEADERBOARD...</p>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : (
                        <>
                            {/* ── Top 3 Podiums ── */}
                            {podiums.length > 0 && (
                                <div className="rnk-podium-row">
                                    {podiums.map(p => {
                                        const rankClass = p.rank === 1 ? 'rnk-podium-card--rank1' : p.rank === 2 ? 'rnk-podium-card--rank2' : 'rnk-podium-card--rank3';
                                        const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉';
                                        return (
                                            <div 
                                                className={`rnk-podium-card ${rankClass}`} 
                                                key={p.id}
                                                onClick={() => navigate(`/designers/${p.id}`)}
                                            >
                                                <span className="rnk-podium-medal">{medal}</span>
                                                <div className="rnk-avatar-wrap">
                                                    <img className="rnk-avatar" src={p.avatar} alt={p.fullName} />
                                                    <span className="rnk-badge">{p.badge}</span>
                                                </div>
                                                <h3 className="rnk-podium-name">{p.fullName}</h3>
                                                <span className="rnk-podium-handle">@{p.username}</span>
                                                
                                                <span className="rnk-podium-score-label">Rank Points</span>
                                                <span className="rnk-podium-score">{p.score.toLocaleString()} pts</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ── Filter Controls ── */}
                            <div className="rnk-controls">
                                <div className="rnk-search-wrap">
                                    <i className="fas fa-search"></i>
                                    <input 
                                        type="text" 
                                        placeholder="Search designer by name or username..." 
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="rnk-search-input"
                                    />
                                </div>
                                <div className="rnk-stats-summary">
                                    Showing {filtered.length} of {designers.length} designers
                                </div>
                            </div>

                            {/* ── Table for ranks > 3 ── */}
                            <div className="rnk-table-card">
                                <table className="rnk-table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Designer</th>
                                            <th>Country</th>
                                            <th>Rank Badge</th>
                                            <th>Rank Points</th>
                                            <th>Showcase</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableItems.map(d => (
                                            <tr key={d.id} onClick={() => navigate(`/designers/${d.id}`)}>
                                                <td className="rnk-table-rank">#{d.rank}</td>
                                                <td>
                                                    <div className="rnk-table-designer">
                                                        <img className="rnk-table-avatar" src={d.avatar} alt={d.fullName} />
                                                        <div>
                                                            <span className="rnk-table-name">{d.fullName}</span>
                                                            <span className="rnk-table-handle">@{d.username}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{d.country}</td>
                                                <td className="rnk-table-badge">{d.badge}</td>
                                                <td className="rnk-table-score">{d.score.toLocaleString()} pts</td>
                                                <td>
                                                    <button className="rnk-view-btn">View Profile</button>
                                                </td>
                                            </tr>
                                        ))}

                                        {filtered.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="rnk-empty">
                                                    <i className="fas fa-search"></i>
                                                    <p>No designers found matching your search.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

export default DesignerRankings;
