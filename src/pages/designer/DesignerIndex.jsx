import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';

function DesignerIndex() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [chartPeriod, setChartPeriod] = useState('weekly');
    const [stats, setStats] = useState({ orders: 0, recentOrders: 0, earnings: 0, rank: '-', liveDesigns: 0 });
    const [revenueData, setRevenueData] = useState({ labels: [], data: [] });
    const [designSales, setDesignSales] = useState({ labels: [], data: [] });
    const [customerGeo, setCustomerGeo] = useState({ labels: [], data: [] });
    const revenueRef = useRef(null);
    const pieDesignRef = useRef(null);
    const pieCountryRef = useRef(null);
    const chartInstances = useRef([]);

    // Refs to hold latest data for chart re-computation when chartPeriod changes
    const latestOrdersRef = useRef([]);

    const processOrders = (myOrders, chartPeriodVal) => {
        const totalOrders = myOrders.length;
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        const getOrderTime = (o) => {
            if (!o.created_at) return 0;
            return new Date(o.created_at).getTime();
        };

        const recentOrders = myOrders.filter(o => getOrderTime(o) > oneDayAgo).length;

        const totalEarnings = myOrders.reduce((sum, o) => {
            if (o.designer_earnings) return sum + o.designer_earnings;
            if (Array.isArray(o.items)) {
                const itemRoyalties = o.items
                    .filter(item => item.designerId === user?.id)
                    .reduce((s, item) => s + Math.round((Number(item.price) || 0) * (Number(item.qty) || 1) * 0.1), 0);
                return sum + itemRoyalties;
            }
            return sum;
        }, 0);

        setStats(prev => ({
            ...prev,
            orders: totalOrders,
            recentOrders,
            earnings: totalEarnings
        }));

        // A. Best Selling Designs chart
        const designCounts = {};
        myOrders.forEach(o => {
            if (Array.isArray(o.items)) {
                o.items.forEach(item => {
                    if (item.designerId === user?.id) {
                        const name = item.name || 'Garment';
                        designCounts[name] = (designCounts[name] || 0) + (Number(item.qty) || 1);
                    }
                });
            }
        });
        const topDesigns = Object.entries(designCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        setDesignSales({
            labels: topDesigns.length ? topDesigns.map(d => d[0]) : ['No Sales'],
            data: topDesigns.length ? topDesigns.map(d => d[1]) : [1]
        });

        // B. Customer Geo chart
        const geoCounts = {};
        myOrders.forEach(o => {
            const country = o.country || 'India';
            const normalized = country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();
            geoCounts[normalized] = (geoCounts[normalized] || 0) + 1;
        });
        const topGeo = Object.entries(geoCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        setCustomerGeo({
            labels: topGeo.length ? topGeo.map(g => g[0]) : ['No Data'],
            data: topGeo.length ? topGeo.map(g => g[1]) : [1]
        });

        // C. Revenue Overview Time Series Chart
        const earningsByTime = {};
        myOrders.forEach(o => {
            const time = getOrderTime(o);
            if (!time) return;
            const d = new Date(time);

            let key = '';
            let sortVal = 0;
            if (chartPeriodVal === 'daily') {
                key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                sortVal = d.getTime();
            } else if (chartPeriodVal === 'weekly') {
                const first = d.getDate() - d.getDay();
                const wStart = new Date(d.setDate(first));
                key = `Wk ${wStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
                sortVal = wStart.getTime();
            } else {
                key = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
                sortVal = d.getFullYear() * 100 + d.getMonth();
            }

            const amt = o.designer_earnings || (Array.isArray(o.items) ? o.items
                .filter(item => item.designerId === user?.id)
                .reduce((s, item) => s + Math.round((Number(item.price) || 0) * (Number(item.qty) || 1) * 0.1), 0) : 0);

            if (!earningsByTime[key]) {
                earningsByTime[key] = { amount: 0, sortVal };
            }
            earningsByTime[key].amount += amt;
        });

        const sortedEntries = Object.entries(earningsByTime)
            .sort((a, b) => a[1].sortVal - b[1].sortVal)
            .slice(-10);

        setRevenueData({
            labels: sortedEntries.length ? sortedEntries.map(e => e[0]) : ['No Data'],
            data: sortedEntries.length ? sortedEntries.map(e => e[1].amount) : [0]
        });
    };

    useEffect(() => {
        if (!user) return;

        const fetchAll = async () => {
            try {
                // 1. Fetch dashboard stats via API
                const dashboard = await apiFetch('/api/dashboard/designer');
                const designsList = dashboard.designs || [];
                const approvedCount = designsList.filter(d => d.status === 'approved' || d.status === 'active').length;
                setStats(prev => ({ ...prev, liveDesigns: approvedCount }));

                // 2. Fetch designer rankings for points leaderboard
                const designersList = await apiFetch('/api/designers/rankings');
                const list = designersList || [];
                // Sort by points desc on frontend to compute points rank
                const sortedByPoints = [...list].sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
                const myIndex = sortedByPoints.findIndex(d => d.id === user.id);
                const rank = myIndex !== -1 ? myIndex + 1 : '-';
                setStats(prev => ({ ...prev, rank }));

                // 3. Process orders
                const myOrders = dashboard.orders || [];
                latestOrdersRef.current = myOrders;
                processOrders(myOrders, chartPeriod);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            }
        };

        fetchAll();
    }, [user]);

    // Re-process when chartPeriod changes
    useEffect(() => {
        if (latestOrdersRef.current.length > 0) {
            processOrders(latestOrdersRef.current, chartPeriod);
        }
    }, [chartPeriod]);

    // Render Chart.js
    useEffect(() => {
        if (!window.Chart || !revenueRef.current) return;
        chartInstances.current.forEach(c => c.destroy());
        chartInstances.current = [];

        const c1 = new window.Chart(revenueRef.current.getContext('2d'), {
            type: 'line',
            data: {
                labels: revenueData.labels,
                datasets: [{ label: 'Royalties (₹)', data: revenueData.data, borderColor: '#C5A059', backgroundColor: 'rgba(197,160,89,0.08)', borderWidth: 2, tension: 0.4, fill: true, pointBackgroundColor: '#C5A059', pointRadius: 4, pointHoverRadius: 6 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => '₹' + v.toLocaleString() } } } }
        });

        const c2 = new window.Chart(pieDesignRef.current.getContext('2d'), {
            type: 'doughnut',
            data: { labels: designSales.labels, datasets: [{ data: designSales.data, backgroundColor: ['#C5A059','#121212','#2D2D2D','#8B7355','#D4C5A0'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Montserrat', size: 11 }, padding: 12 } } } }
        });

        const c3 = new window.Chart(pieCountryRef.current.getContext('2d'), {
            type: 'doughnut',
            data: { labels: customerGeo.labels, datasets: [{ data: customerGeo.data, backgroundColor: ['#C5A059','#121212','#2D2D2D','#8B7355','#D4C5A0','#A89060'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Montserrat', size: 11 }, padding: 12 } } } }
        });

        chartInstances.current = [c1, c2, c3];
        return () => chartInstances.current.forEach(c => c.destroy());
    }, [revenueData, designSales, customerGeo]);

    return (
        <main className="dsn-dash">
            <div className="dsn-dash__stats">
                <div className="dsn-dash__stat-card dsn-dash__stat-card--primary" onClick={() => navigate('/designer/orders')}>
                    <div className="dsn-dash__stat-icon"><i className="fas fa-shopping-bag"></i></div>
                    <div className="dsn-dash__stat-info">
                        <span className="dsn-dash__stat-num">{stats.orders}</span>
                        <span className="dsn-dash__stat-label">Total Orders</span>
                    </div>
                    {stats.recentOrders > 0 && <span className="dsn-dash__stat-badge">+{stats.recentOrders} in 24 hrs</span>}
                </div>
                <div className="dsn-dash__stat-card" onClick={() => navigate('/designer/earnings')}>
                    <div className="dsn-dash__stat-icon"><i className="fas fa-coins"></i></div>
                    <div className="dsn-dash__stat-info">
                        <span className="dsn-dash__stat-num">₹{stats.earnings.toLocaleString()}</span>
                        <span className="dsn-dash__stat-label">Total Earnings</span>
                    </div>
                </div>
                <div className="dsn-dash__stat-card" onClick={() => navigate('/designer/ranking')}>
                    <div className="dsn-dash__stat-icon"><i className="fas fa-trophy"></i></div>
                    <div className="dsn-dash__stat-info">
                        <span className="dsn-dash__stat-num">{stats.rank !== '-' ? `#${stats.rank}` : '-'}</span>
                        <span className="dsn-dash__stat-label">Global Rank</span>
                    </div>
                </div>
                <div className="dsn-dash__stat-card" onClick={() => navigate('/designer/designs')}>
                    <div className="dsn-dash__stat-icon"><i className="fas fa-palette"></i></div>
                    <div className="dsn-dash__stat-info">
                        <span className="dsn-dash__stat-num">{stats.liveDesigns}</span>
                        <span className="dsn-dash__stat-label">Live Designs</span>
                    </div>
                </div>
            </div>

            <section className="dsn-dash__chart-section">
                <div className="dsn-dash__chart-head">
                    <h3 className="dsn-dash__chart-title">Revenue Overview</h3>
                    <div className="dsn-dash__toggle">
                        {['daily','weekly','monthly'].map(p => (
                            <button key={p} className={`dsn-dash__toggle-btn ${chartPeriod === p ? 'active' : ''}`} onClick={() => setChartPeriod(p)}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="dsn-dash__chart-wrap"><canvas ref={revenueRef}></canvas></div>
            </section>

            <div className="dsn-dash__pies">
                <section className="dsn-dash__chart-section dsn-dash__chart-section--half">
                    <h3 className="dsn-dash__chart-title">Best Selling Designs</h3>
                    <div className="dsn-dash__chart-wrap dsn-dash__chart-wrap--pie"><canvas ref={pieDesignRef}></canvas></div>
                </section>
                <section className="dsn-dash__chart-section dsn-dash__chart-section--half">
                    <h3 className="dsn-dash__chart-title">Customers Globally</h3>
                    <div className="dsn-dash__chart-wrap dsn-dash__chart-wrap--pie"><canvas ref={pieCountryRef}></canvas></div>
                </section>
            </div>
        </main>
    );
}

export default DesignerIndex;
