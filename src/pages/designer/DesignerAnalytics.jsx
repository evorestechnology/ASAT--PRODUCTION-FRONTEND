import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const styles = `
    body { display: flex; flex-direction: column; min-height: 100vh; margin: 0; }
    main { flex: 1; padding: 40px 5%; }
    .analytics-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
    .metric-card { background: var(--dark); color: white; padding: 25px; text-align: center; border-bottom: 3px solid var(--gold); }
    .metric-card h3 { font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 10px; color: #aaa; text-transform: uppercase; }
    .metric-value { font-family: 'Cinzel', serif; font-size: 1.8rem; color: var(--gold); }
    .charts-section { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 40px; }
    .chart-box { background: white; border: 1px solid #eee; padding: 30px; height: 400px; display: flex; flex-direction: column; }
    .chart-title { font-family: 'Cinzel', serif; margin-bottom: 20px; font-size: 1.1rem; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px; text-transform: uppercase; }
    .chart-container { flex: 1; position: relative; min-height: 0; }
    
    @media (max-width: 900px) {
        .metrics-grid { grid-template-columns: repeat(2, 1fr); }
        .charts-section { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
        .metrics-grid { grid-template-columns: 1fr; }
    }
`;

function DesignerAnalytics() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [period, setPeriod] = useState('All Time');
    const [loading, setLoading] = useState(true);

    // Live Metrics State
    const [metrics, setMetrics] = useState({
        totalDesigns: 0,
        activeDesigns: 0,
        totalOrders: 0,
        totalEarnings: 0,
        rankStr: '#—'
    });

    const [ordersData, setOrdersData] = useState([]);
    const [designsData, setDesignsData] = useState([]);
    
    // Refs for charts
    const reachChartRef = useRef(null);
    const deviceChartRef = useRef(null);
    
    // Chart instances
    const reachChartInstance = useRef(null);
    const deviceChartInstance = useRef(null);

    useEffect(() => {
        if (!user) return;

        const loadAnalyticsData = async () => {
            setLoading(true);
            try {
                // 1. Fetch dashboard stats via API
                const dashboard = await apiFetch('/api/dashboard/designer');
                const designsList = dashboard.designs || [];
                setDesignsData(designsList);

                // 2. Fetch designer rankings
                const rankingsList = await apiFetch('/api/designers/rankings');

                const allOrdersList = (dashboard.orders || []).map(data => {
                    let dateVal = 0;
                    if (data.created_at) {
                        dateVal = new Date(data.created_at).getTime();
                    }

                    let matchingItems = [];
                    if (Array.isArray(data.items)) {
                        matchingItems = data.items.filter(item => item.designerId === user.id);
                    }

                    const royalty = Number(data.designer_earnings || 0);

                    return {
                        id: data.id,
                        date: dateVal,
                        country: data.country || 'India',
                        royalty: royalty || 0,
                        isMine: true,
                        items: matchingItems
                    };
                });

                setOrdersData(allOrdersList);

                // 3. Resolve Designer Rank
                const designersList = (rankingsList || []).map(d => ({
                    id: d.id,
                    score: Number(d.total_earnings || 0)
                }));
                designersList.sort((a, b) => b.score - a.score);
                const rankIdx = designersList.findIndex(d => d.id === user.id);
                const rankStr = rankIdx !== -1 ? `#${String(rankIdx + 1).padStart(2, '0')}` : '#—';

                // Initial metrics computation
                computeMetrics(allOrdersList, designsList || [], rankStr);

            } catch (err) {
                console.error('Error fetching analytics:', err);
            } finally {
                setLoading(false);
            }
        };

        loadAnalyticsData();
    }, [user]);

    const computeMetrics = (orders, designs, rank) => {
        // Filter orders by period
        const filteredOrders = filterOrdersByPeriod(orders, period);

        const totalDesigns = designs.length;
        const activeDesigns = designs.filter(d => d.status === 'approved' || d.status === 'live').length;
        const totalOrders = filteredOrders.length;
        const totalEarnings = filteredOrders.reduce((sum, o) => sum + o.royalty, 0);

        setMetrics({
            totalDesigns,
            activeDesigns,
            totalOrders,
            totalEarnings,
            rankStr: rank
        });
    };

    // Trigger metrics re-computation when period changes
    useEffect(() => {
        if (loading) return;
        computeMetrics(ordersData, designsData, metrics.rankStr);
    }, [period, loading]);

    // Redraw charts when period or data changes
    useEffect(() => {
        if (loading) return;

        const filteredOrders = filterOrdersByPeriod(ordersData, period);

        // --- Render Reach Chart ---
        const countriesMap = {};
        filteredOrders.forEach(o => {
            countriesMap[o.country] = (countriesMap[o.country] || 0) + 1;
        });

        const reachLabels = Object.keys(countriesMap);
        const reachValues = Object.values(countriesMap);

        if (reachChartInstance.current) {
            reachChartInstance.current.destroy();
        }

        if (window.Chart && reachLabels.length > 0) {
            const ctxReach = document.getElementById('reachChart');
            if (ctxReach) {
                reachChartInstance.current = new window.Chart(ctxReach.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: reachLabels,
                        datasets: [{
                            label: 'Orders per Country',
                            data: reachValues,
                            backgroundColor: '#C5A059',
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: { beginAtZero: true, ticks: { precision: 0 } }
                        }
                    }
                });
            }
        }

        // --- Render Categories (Device traffic fallback) Chart ---
        const catsMap = {};
        designsData.forEach(d => {
            const cat = d.category || 'Garments';
            catsMap[cat] = (catsMap[cat] || 0) + 1;
        });

        const catLabels = Object.keys(catsMap);
        const catValues = Object.values(catsMap);

        if (deviceChartInstance.current) {
            deviceChartInstance.current.destroy();
        }

        if (window.Chart && catLabels.length > 0) {
            const ctxDevice = document.getElementById('deviceChart');
            if (ctxDevice) {
                deviceChartInstance.current = new window.Chart(ctxDevice.getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: catLabels,
                        datasets: [{
                            data: catValues,
                            backgroundColor: ['#C5A059', '#121212', '#2D2D2D', '#86868b', '#E6C179', '#4E4E50'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });
            }
        }

    }, [period, loading, ordersData, designsData]);

    const filterOrdersByPeriod = (orders, timePeriod) => {
        if (timePeriod === 'All Time') return orders;
        
        const now = Date.now();
        let limit = 0;
        
        if (timePeriod === 'Last 24 Hours') {
            limit = now - 24 * 60 * 60 * 1000;
        } else if (timePeriod === 'Last 7 Days') {
            limit = now - 7 * 24 * 60 * 60 * 1000;
        } else if (timePeriod === 'Last 30 Days') {
            limit = now - 30 * 24 * 60 * 60 * 1000;
        }
        
        return orders.filter(o => o.date >= limit);
    };

    return (
        <>
            <style>{styles}</style>

            <main>
                <BackButton />
                <div className="analytics-header">
                    <h2 style={{ fontFamily: "'Cinzel', serif", margin: 0 }}>PERFORMANCE ANALYTICS</h2>
                    <div>
                        <span style={{ fontWeight: 'bold', fontSize: '0.8rem', marginRight: '8px' }}>PERIOD:</span>
                        <select 
                            style={{ padding: '8px', border: '1px solid var(--gold)', outline: 'none', fontFamily: "'Montserrat'" }}
                            value={period}
                            onChange={e => setPeriod(e.target.value)}
                        >
                            <option value="Last 24 Hours">Last 24 Hours</option>
                            <option value="Last 7 Days">Last 7 Days</option>
                            <option value="Last 30 Days">Last 30 Days</option>
                            <option value="All Time">Till Date</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', fontFamily: 'Montserrat', color: '#666', padding: '40px 0' }}>
                        <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Loading performance analytics…
                    </div>
                ) : (
                    <>
                        <div className="metrics-grid">
                            <div className="metric-card">
                                <h3>TOTAL DESIGNS</h3>
                                <div className="metric-value">{metrics.totalDesigns}</div>
                            </div>
                            <div className="metric-card">
                                <h3>ACTIVE DESIGNS</h3>
                                <div className="metric-value">{metrics.activeDesigns}</div>
                            </div>
                            <div className="metric-card">
                                <h3>TOTAL SALES</h3>
                                <div className="metric-value">{metrics.totalOrders}</div>
                            </div>
                            <div className="metric-card">
                                <h3>TOTAL ROYALTIES</h3>
                                <div className="metric-value">₹{metrics.totalEarnings.toLocaleString('en-IN')}</div>
                            </div>
                        </div>

                        <div className="charts-section">
                            <div className="chart-box">
                                <div className="chart-title">GEOGRAPHICAL REACH</div>
                                <div className="chart-container">
                                    {ordersData.length === 0 ? (
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '0.85rem' }}>
                                            No sales orders tracked to build reach chart.
                                        </div>
                                    ) : (
                                        <canvas id="reachChart"></canvas>
                                    )}
                                </div>
                            </div>
                            <div className="chart-box">
                                <div className="chart-title">DESIGN CATEGORIES</div>
                                <div className="chart-container">
                                    {designsData.length === 0 ? (
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '0.85rem' }}>
                                            No designs uploaded to build category chart.
                                        </div>
                                    ) : (
                                        <canvas id="deviceChart"></canvas>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </>
    );
}

export default DesignerAnalytics;
