import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const PER_PAGE = 20;

function DesignerRanking() {
    const { user } = useAuth();
    const currentDesignerId = user?.id || '';
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchRankings = async () => {
            setLoading(true);
            try {
                const data = await apiFetch('/api/designers/rankings');
                const sorted = [...data].sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
                
                let list = (sorted || []).map((doc, idx) => {
                    return {
                        id: doc.id,
                        userId: doc.id,
                        name: doc.full_name || doc.username || 'Anonymous Designer',
                        country: doc.country || 'Global',
                        score: doc.points || 0,
                    };
                });

                // Add ranks
                list = list.map((item, idx) => ({
                    ...item,
                    rank: idx + 1
                }));

                setRankings(list);
            } catch (err) {
                console.error('Error fetching rankings:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRankings();
    }, []);

    const totalPages = Math.max(1, Math.ceil(rankings.length / PER_PAGE));
    const paged = rankings.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <main className="dsn-ranking">
            <BackButton />
            <div className="dsn-page-head">
                <h2 className="dsn-page-title">Global Ranking</h2>
                <span className="dsn-page-count">Top 100 Designers</span>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', fontFamily: 'Montserrat', color: '#666', padding: '40px 0' }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Loading rankings from database…
                </div>
            ) : (
                <div className="dsn-table-wrap">
                    <table className="dsn-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Country</th>
                                <th>Designer</th>
                                <th>User ID</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="dsn-table__empty">
                                        <i className="fas fa-trophy" style={{fontSize:'1.5rem',marginBottom:8,display:'block',color:'#ddd'}}></i>
                                        Rankings not available yet
                                    </td>
                                </tr>
                            ) : (
                                paged.map(r => (
                                    <tr key={r.rank} className={r.userId === currentDesignerId ? 'dsn-table__row--highlight' : ''}>
                                        <td className="dsn-ranking__rank">
                                            {r.rank <= 3 ? <span className="dsn-ranking__medal">{r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : '🥉'}</span> : `#${r.rank}`}
                                        </td>
                                        <td>{r.country}</td>
                                        <td className="dsn-ranking__name">
                                            {r.name} {r.userId === currentDesignerId && <span className="dsn-ranking__you">You</span>}
                                        </td>
                                        <td className="dsn-table__id">{r.userId}</td>
                                        <td className="dsn-ranking__score">{r.score.toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div className="dsn-pagination">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                        <i className="fas fa-chevron-left"></i> Prev
                    </button>
                    <span>Page {page} of {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                        Next <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            )}
        </main>
    );
}

export default DesignerRanking;
