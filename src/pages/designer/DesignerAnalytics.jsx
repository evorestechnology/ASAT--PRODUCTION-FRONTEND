import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';



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
            <main className="dsn-analytics">
                <BackButton />
                <div className="analytics-header">
                    <h2>Performance Analytics</h2>
                    <div>
                        <span style={{ fontWeight: 'bold', fontSize: '0.75rem', marginRight: '8px', fontFamily: 'Montserrat', letterSpacing: '1px' }}>PERIOD:</span>
                        <select 
                            style={{ padding: '10px 16px', border: '1px solid rgba(0, 0, 0, 0.1)', background: 'rgba(255, 255, 255, 0.45)', borderRadius: '8px', outline: 'none', fontFamily: "'Montserrat'", fontSize: '0.85rem', fontWeight: 600 }}
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
