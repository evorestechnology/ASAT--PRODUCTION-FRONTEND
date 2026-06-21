import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

function MfgIndex() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ orders: 0, last24h: 0, earnings: 0, inProgress: 0 });
    const [loading, setLoading] = useState(true);

    const [catalogueData, setCatalogueData] = useState({ labels: ['No Data'], data: [0] });
    const [regionData, setRegionData] = useState({ labels: ['No Data'], data: [1], colors: ['#e0e0e0'] });
    const [statesData, setStatesData] = useState({ labels: ['No Data'], data: [1], colors: ['#e0e0e0'] });

    const catalogueRef = useRef(null);
    const regionRef = useRef(null);
    const statesRef = useRef(null);
    const chartInstances = useRef([]);

    // Helper to extract state from address
    const extractStateFromAddress = (address) => {
        if (!address) return 'Other';
        const addrUpper = address.toUpperCase();
        const states = [
            'MAHARASHTRA', 'KARNATAKA', 'DELHI', 'TAMIL NADU', 'GUJARAT', 
            'UTTAR PRADESH', 'WEST BENGAL', 'HARYANA', 'TELANGANA', 
            'KERALA', 'RAJASTHAN', 'PUNJAB', 'BIHAR', 'MADHYA PRADESH', 
            'ANDHRA PRADESH'
        ];
        for (const state of states) {
            if (addrUpper.includes(state)) {
                return state.charAt(0) + state.slice(1).toLowerCase();
            }
        }
        return 'Other';
    };

    const fetchOrders = async () => {
        if (!user) return;
        try {
            const dashboard = await apiFetch('/api/dashboard/mfg');
            const myOrders = dashboard.orders || [];

            // Compute statistics
            const totalOrders = myOrders.length;
            const now = Date.now();
            const oneDayAgo = now - 24 * 60 * 60 * 1000;

            const getOrderTime = (o) => {
                if (!o.created_at) return 0;
                return new Date(o.created_at).getTime();
            };

            const last24h = myOrders.filter(o => getOrderTime(o) > oneDayAgo).length;
            const earnings = myOrders.reduce((sum, o) => sum + (Number(o.mfg_earnings) || 0), 0);
            const inProgress = myOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;

            setStats({
                orders: totalOrders,
                last24h,
                earnings,
                inProgress
            });

            // 1. Catalogue Data
            const catCounts = {};
            myOrders.forEach(o => {
                if (Array.isArray(o.items)) {
                    o.items.forEach(item => {
                        const nameLower = (item.name || '').toLowerCase();
                        let category = item.category || 'General';
                        if (category === 'General') {
                            if (nameLower.includes('hoodie')) category = 'Hoodies';
                            else if (nameLower.includes('tee') || nameLower.includes('t-shirt')) category = 'T-Shirts';
                            else if (nameLower.includes('pant') || nameLower.includes('jogger')) category = 'Pants';
                            else if (nameLower.includes('jacket')) category = 'Jackets';
                            else category = 'General';
                        }
                        category = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
                        catCounts[category] = (catCounts[category] || 0) + (Number(item.qty) || 1);
                    });
                }
            });

            const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
            setCatalogueData({
                labels: topCats.length ? topCats.map(c => c[0]) : ['No Data'],
                data: topCats.length ? topCats.map(c => c[1]) : [0]
            });

            // 2. Region Data (Global vs Domestic)
            let domesticCount = 0;
            let globalCount = 0;
            myOrders.forEach(o => {
                if ((o.country || 'India').toLowerCase() === 'india') {
                    domesticCount++;
                } else {
                    globalCount++;
                }
            });

            if (domesticCount === 0 && globalCount === 0) {
                setRegionData({ labels: ['No Data'], data: [1], colors: ['#e0e0e0'] });
            } else {
                setRegionData({
                    labels: ['Domestic', 'Global'],
                    data: [domesticCount, globalCount],
                    colors: ['rgba(197, 160, 89, 0.85)', '#121212']
                });
            }

            // 3. States Data (Domestic States)
            const stateCounts = {};
            myOrders.forEach(o => {
                if ((o.country || 'India').toLowerCase() === 'india' && o.address) {
                    const st = extractStateFromAddress(o.address);
                    stateCounts[st] = (stateCounts[st] || 0) + 1;
                }
            });

            const topStates = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
            if (topStates.length === 0) {
                setStatesData({ labels: ['No Data'], data: [1], colors: ['#e0e0e0'] });
            } else {
                setStatesData({
                    labels: topStates.map(s => s[0]),
                    data: topStates.map(s => s[1]),
                    colors: ['#C5A059', '#121212', '#2D2D2D', '#8B7355', '#D4C5A0']
                });
            }

            setLoading(false);
        } catch (err) {
            console.error("Error fetching mfg dashboard data:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchOrders();
    }, [user]);

    // Render / update charts
    useEffect(() => {
        if (!window.Chart) return;
        chartInstances.current.forEach(c => c.destroy());
        chartInstances.current = [];

        const newInstances = [];

        if (catalogueRef.current) {
            newInstances.push(new window.Chart(catalogueRef.current.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: catalogueData.labels,
                    datasets: [{
                        label: 'Orders',
                        data: catalogueData.data,
                        backgroundColor: 'rgba(197,160,89,0.7)',
                        borderColor: '#C5A059',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                }
            }));
        }

        if (regionRef.current) {
            newInstances.push(new window.Chart(regionRef.current.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: regionData.labels,
                    datasets: [{
                        data: regionData.data,
                        backgroundColor: regionData.colors,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { font: { family: 'Montserrat', size: 10 } } } }
                }
            }));
        }

        if (statesRef.current) {
            newInstances.push(new window.Chart(statesRef.current.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: statesData.labels,
                    datasets: [{
                        data: statesData.data,
                        backgroundColor: statesData.colors,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { font: { family: 'Montserrat', size: 10 } } } }
                }
            }));
        }

        chartInstances.current = newInstances;
        return () => chartInstances.current.forEach(c => c.destroy());
    }, [catalogueData, regionData, statesData]);

    return (
        <main className="adm-dash">
            <h1 className="adm-dash__title">MANUFACTURER DASHBOARD</h1>

            {/* Hero */}
            <div className="adm-dash__hero">
                <div>
                    <div className="adm-dash__hero-number">{loading ? '...' : stats.orders.toLocaleString()}</div>
                    <div className="adm-dash__hero-label">Total Orders</div>
                </div>
                {!loading && stats.last24h > 0 && (
                    <div className="adm-dash__hero-badge">
                        <i className="fas fa-arrow-up" style={{ marginRight: 4 }}></i> +{stats.last24h} in 24 hrs
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="adm-dash__revenue" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="adm-dash__rev-card">
                    <div className="adm-dash__rev-label">Total Earnings</div>
                    <div className="adm-dash__rev-value">₹{loading ? '...' : stats.earnings.toLocaleString('en-IN')}</div>
                </div>
                <div className="adm-dash__rev-card">
                    <div className="adm-dash__rev-label">In-Progress Orders</div>
                    <div className="adm-dash__rev-value">{loading ? '...' : stats.inProgress}</div>
                </div>
                <div className="adm-dash__rev-card">
                    <div className="adm-dash__rev-label">Completed Orders</div>
                    <div className="adm-dash__rev-value">{loading ? '...' : (stats.orders - stats.inProgress)}</div>
                </div>
            </div>

            {/* Charts */}
            <div className="adm-dash__charts">
                <div className="adm-dash__chart-card">
                    <div className="adm-dash__chart-title">Orders By Catalogue</div>
                    <div className="adm-dash__chart-wrap"><canvas ref={catalogueRef}></canvas></div>
                </div>
                <div className="adm-dash__chart-card">
                    <div className="adm-dash__chart-title">Global vs Domestic</div>
                    <div className="adm-dash__chart-wrap"><canvas ref={regionRef}></canvas></div>
                </div>
                <div className="adm-dash__chart-card">
                    <div className="adm-dash__chart-title">Domestic States</div>
                    <div className="adm-dash__chart-wrap"><canvas ref={statesRef}></canvas></div>
                </div>
            </div>
        </main>
    );
}

export default MfgIndex;
