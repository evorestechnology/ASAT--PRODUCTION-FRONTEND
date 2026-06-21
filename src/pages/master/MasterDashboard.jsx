import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api';
import '../../styles/admin.css';

function MasterDashboard() {
    const [stats, setStats] = useState({
        totalOrders: 0, last24h: 0,
        totalRevenue: 0, designerEarnings: 0, mfgEarnings: 0, platformEarnings: 0,
        ordersCompleted: 0, globalOrders: 0, domesticOrders: 0, repeatRatio: '0%',
        designersCount: 0, designsCount: 0, maxOrdersPerDesign: 0, avgOrdersPerDesign: 0,
        maxEarningPerDesigner: 0, avgEarningPerDesigner: 0,
        ordersInProgress: 0, globalInProgress: 0, domesticInProgress: 0,
        avgShippingGlobal: '0 days', avgShippingDomestic: '0 days',
        supportTickets: 0, globalTickets: 0, domesticTickets: 0,
        ticketsOngoing: 0, ticketsPer100: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Chart data state to trigger updates
    const [chartData, setChartData] = useState({
        lineLabels: [],
        lineData: [],
        countryLabels: ['No Data'],
        countryData: [1],
        countryColors: ['#e0e0e0'],
        domesticLabels: ['No Data'],
        domesticData: [1],
        domesticColors: ['#e0e0e0']
    });

    // 1. Fetch real-time data from Supabase
    useEffect(() => {
        let orders = [];
        let designers = [];
        let designs = [];
        let tickets = [];

        const loaded = { orders: false, designers: false, designs: false, tickets: false };

        const handleUpdate = () => {
            try {
                // Helper to extract order timestamp safely
                const getOrderTime = (o) => {
                    if (!o.createdAt) return 0;
                    return new Date(o.createdAt).getTime();
                };

                const now = Date.now();
                const oneDayAgo = now - 24 * 60 * 60 * 1000;

                // Core Order stats
                const totalOrders = orders.length;
                const last24h = orders.filter(o => getOrderTime(o) > oneDayAgo).length;

                // Revenue allocations
                const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                const designerEarnings = orders.reduce((sum, o) => sum + (o.designerEarnings || 0), 0);
                const mfgEarnings = orders.reduce((sum, o) => sum + (o.mfgEarnings || 0), 0);
                const platformEarnings = totalRevenue - designerEarnings - mfgEarnings;

                const completed = orders.filter(o => o.status === 'completed');
                const ordersCompleted = completed.length;

                const domesticOrders = orders.filter(o => o.country?.toLowerCase() === 'india').length;
                const globalOrders = totalOrders - domesticOrders;

                // Repeat ratio
                const userOrderCounts = {};
                orders.forEach(o => {
                    if (o.userId) {
                        userOrderCounts[o.userId] = (userOrderCounts[o.userId] || 0) + 1;
                    }
                });
                const totalUsers = Object.keys(userOrderCounts).length;
                const repeatUsers = Object.values(userOrderCounts).filter(c => c > 1).length;
                const repeatRatio = totalUsers ? `${((repeatUsers / totalUsers) * 100).toFixed(1)}%` : '0%';

                const designersCount = designers.length;
                const designsCount = designs.length;

                // Design stats
                const maxOrdersPerDesign = designs.length ? Math.max(0, ...designs.map(d => d.ordersCount || 0)) : 0;
                const avgOrdersPerDesign = designs.length ? parseFloat((designs.reduce((sum, d) => sum + (d.ordersCount || 0), 0) / designs.length).toFixed(1)) : 0;

                // Designer earnings stats
                const maxEarningPerDesigner = designers.length ? Math.max(0, ...designers.map(d => d.totalEarnings || 0)) : 0;
                const avgEarningPerDesigner = designers.length ? Math.round(designers.reduce((sum, d) => sum + (d.totalEarnings || 0), 0) / designers.length) : 0;

                // Ongoing operations
                const inProgressList = orders.filter(o => ['confirmed', 'manufacturing', 'shipping'].includes(o.status));
                const ordersInProgress = inProgressList.length;
                const domesticInProgress = inProgressList.filter(o => o.country?.toLowerCase() === 'india').length;
                const globalInProgress = ordersInProgress - domesticInProgress;

                // Shipping duration
                const getTimestampDate = (ts) => {
                    if (!ts) return null;
                    return new Date(ts);
                };

                const completedWithShipping = completed.filter(o => o.shippedAt && o.completedAt);
                const domesticShipping = completedWithShipping.filter(o => o.country?.toLowerCase() === 'india');
                const globalShipping = completedWithShipping.filter(o => o.country && o.country.toLowerCase() !== 'india');

                let avgShippingDomesticVal = 0;
                if (domesticShipping.length) {
                    const totalDays = domesticShipping.reduce((sum, o) => {
                        const shipDate = getTimestampDate(o.shippedAt);
                        const compDate = getTimestampDate(o.completedAt);
                        if (shipDate && compDate) {
                            return sum + (compDate - shipDate) / (1000 * 60 * 60 * 24);
                        }
                        return sum;
                    }, 0);
                    avgShippingDomesticVal = totalDays / domesticShipping.length;
                }

                let avgShippingGlobalVal = 0;
                if (globalShipping.length) {
                    const totalDays = globalShipping.reduce((sum, o) => {
                        const shipDate = getTimestampDate(o.shippedAt);
                        const compDate = getTimestampDate(o.completedAt);
                        if (shipDate && compDate) {
                            return sum + (compDate - shipDate) / (1000 * 60 * 60 * 24);
                        }
                        return sum;
                    }, 0);
                    avgShippingGlobalVal = totalDays / globalShipping.length;
                }

                const avgShippingDomestic = `${avgShippingDomesticVal.toFixed(1)} days`;
                const avgShippingGlobal = `${avgShippingGlobalVal.toFixed(1)} days`;

                // Support Tickets
                const supportTickets = tickets.length;
                const ticketsOngoing = tickets.filter(t => t.status?.toLowerCase() !== 'closed').length;
                const ticketsPer100 = totalOrders ? parseFloat(((supportTickets / totalOrders) * 100).toFixed(1)) : 0;

                const globalTickets = tickets.filter(t => {
                    const order = orders.find(o => o.id === t.orderId || o.orderId === t.orderId);
                    return order ? (order.country && order.country.toLowerCase() !== 'india') : false;
                }).length;
                const domesticTickets = supportTickets - globalTickets;

                setStats({
                    totalOrders, last24h,
                    totalRevenue, designerEarnings, mfgEarnings, platformEarnings,
                    ordersCompleted, globalOrders, domesticOrders, repeatRatio,
                    designersCount, designsCount, maxOrdersPerDesign, avgOrdersPerDesign,
                    maxEarningPerDesigner, avgEarningPerDesigner,
                    ordersInProgress, globalInProgress, domesticInProgress,
                    avgShippingGlobal, avgShippingDomestic,
                    supportTickets, globalTickets, domesticTickets,
                    ticketsOngoing, ticketsPer100
                });

                // Line Chart — monthly revenue aggregation
                const monthlyEarnings = {};
                orders.forEach(o => {
                    const time = getOrderTime(o);
                    if (!time) return;
                    const d = new Date(time);
                    const monthName = d.toLocaleString('default', { month: 'short' });
                    const year = d.getFullYear();
                    const label = `${monthName} ${year}`;
                    const sortKey = d.getFullYear() * 100 + d.getMonth();
                    if (!monthlyEarnings[label]) {
                        monthlyEarnings[label] = { amount: 0, sortKey };
                    }
                    monthlyEarnings[label].amount += (o.totalAmount || 0);
                });

                const sortedMonths = Object.keys(monthlyEarnings).sort((a, b) => monthlyEarnings[a].sortKey - monthlyEarnings[b].sortKey);
                const lineLabels = sortedMonths;
                const lineData = sortedMonths.map(m => monthlyEarnings[m].amount);

                // Pie Chart — country distribution
                const countryEarnings = {};
                orders.forEach(o => {
                    const countryName = o.country || 'Unknown';
                    const normalized = countryName.trim().charAt(0).toUpperCase() + countryName.trim().slice(1).toLowerCase();
                    countryEarnings[normalized] = (countryEarnings[normalized] || 0) + (o.totalAmount || 0);
                });

                const countryLabelsRaw = Object.keys(countryEarnings);
                let countryLabels = ['No Data'];
                let countryData = [1];
                let countryColors = ['#e0e0e0'];
                if (countryLabelsRaw.length > 0) {
                    countryLabels = countryLabelsRaw;
                    countryData = Object.values(countryEarnings);
                    const palette = ['#C5A059', '#121212', '#86868b', '#A8803C', '#E5C180', '#564426', '#1a73e8', '#34a853', '#9334e6'];
                    countryColors = countryLabels.map((_, idx) => palette[idx % palette.length]);
                }

                // Pie Chart — domestic vs global
                let domesticAmt = 0;
                let globalAmt = 0;
                orders.forEach(o => {
                    if (o.country?.toLowerCase() === 'india') {
                        domesticAmt += (o.totalAmount || 0);
                    } else {
                        globalAmt += (o.totalAmount || 0);
                    }
                });

                let domesticLabels = ['No Data'];
                let domesticData = [1];
                let domesticColors = ['#e0e0e0'];
                if (domesticAmt > 0 || globalAmt > 0) {
                    domesticLabels = ['Domestic (India)', 'Global'];
                    domesticData = [domesticAmt, globalAmt];
                    domesticColors = ['#C5A059', '#121212'];
                }

                setChartData({
                    lineLabels,
                    lineData,
                    countryLabels,
                    countryData,
                    countryColors,
                    domesticLabels,
                    domesticData,
                    domesticColors
                });

                setError(null);
            } catch (err) {
                console.error("Error loading master dashboard metrics:", err);
                setError("Failed to fetch real-time dashboard data.");
            }

            if (loaded.orders && loaded.designers && loaded.designs && loaded.tickets) {
                setLoading(false);
            }
        };

        const fetchAllData = async () => {
            try {
                const data = await apiFetch('/api/dashboard/admin');

                orders = (data.orders || []).map(o => ({
                    id: o.id,
                    orderId: o.order_id,
                    userId: o.user_id,
                    customerName: o.customer_name,
                    items: o.items,
                    totalAmount: Number(o.total_amount || 0),
                    designerEarnings: Number(o.designer_earnings || 0),
                    mfgEarnings: Number(o.mfg_earnings || 0),
                    platformEarnings: Number(o.platform_earnings || 0),
                    designerId: o.designer_id,
                    designerUsername: o.designer_username,
                    mfgId: o.mfg_id,
                    status: o.status,
                    contact: o.contact,
                    phone: o.phone,
                    address: o.address,
                    country: o.country,
                    trackingId: o.tracking_id,
                    statusHistory: o.status_history,
                    shippedAt: o.shipped_at,
                    completedAt: o.completed_at,
                    createdAt: o.created_at,
                    updatedAt: o.updated_at
                }));

                designers = (data.designers || []).map(d => ({
                    id: d.id,
                    fullName: d.full_name,
                    email: d.email,
                    username: d.username,
                    contact: d.contact,
                    avatarUrl: d.avatar_url,
                    status: d.status,
                    designsCount: d.designs_count,
                    totalEarnings: Number(d.total_earnings || 0),
                    points: d.points,
                    rank: d.rank,
                    createdAt: d.created_at,
                    updatedAt: d.updated_at
                }));

                designs = (data.designs || []).map(d => ({
                    id: d.id,
                    title: d.title,
                    description: d.description,
                    price: Number(d.price || 0),
                    catalogueItemId: d.catalogue_item_id,
                    designerId: d.designer_id,
                    designerUsername: d.designer_username,
                    images: d.images,
                    colors: d.colors,
                    sizes: d.sizes,
                    gender: d.gender,
                    status: d.status,
                    collection: d.collection,
                    ordersCount: d.orders_count,
                    totalEarnings: Number(d.total_earnings || 0),
                    reviewedBy: d.reviewed_by,
                    reviewedAt: d.reviewed_at,
                    createdAt: d.created_at,
                    updatedAt: d.updated_at
                }));

                tickets = (data.tickets || []).map(t => ({
                    id: t.id,
                    userId: t.user_id,
                    subject: t.subject,
                    category: t.category,
                    description: t.description,
                    status: t.status,
                    orderId: t.order_id,
                    createdAt: t.created_at,
                    updatedAt: t.updated_at
                }));

                loaded.orders = true;
                loaded.designers = true;
                loaded.designs = true;
                loaded.tickets = true;

                handleUpdate();
            } catch (err) {
                console.error("Error fetching dashboard initial data:", err);
                setError("Failed to fetch dashboard metrics.");
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    // 2. Initialize and re-render Chart.js instances dynamically when chartData changes
    useEffect(() => {
        if (!window.Chart || loading) return;
        const instances = [];

        // Line chart — earnings by time
        const ctx1 = document.getElementById('admChartLine');
        if (ctx1) {
            instances.push(new window.Chart(ctx1.getContext('2d'), {
                type: 'line',
                data: {
                    labels: chartData.lineLabels,
                    datasets: [{
                        label: 'Revenue (₹)',
                        data: chartData.lineData,
                        borderColor: '#C5A059',
                        backgroundColor: 'rgba(197,160,89,0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            }));
        }

        // Doughnut — by country
        const ctx2 = document.getElementById('admChartCountry');
        if (ctx2) {
            instances.push(new window.Chart(ctx2.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: chartData.countryLabels,
                    datasets: [{
                        data: chartData.countryData,
                        backgroundColor: chartData.countryColors
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: { size: 10 },
                                boxWidth: 12
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    return ` ₹${value.toLocaleString()}`;
                                }
                            }
                        }
                    }
                }
            }));
        }

        // Doughnut — domestic vs global
        const ctx3 = document.getElementById('admChartDomestic');
        if (ctx3) {
            instances.push(new window.Chart(ctx3.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: chartData.domesticLabels,
                    datasets: [{
                        data: chartData.domesticData,
                        backgroundColor: chartData.domesticColors
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: { size: 10 },
                                boxWidth: 12
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    return ` ₹${value.toLocaleString()}`;
                                }
                            }
                        }
                    }
                }
            }));
        }

        return () => instances.forEach(c => c.destroy());
    }, [loading, chartData]);

    const revenueCards = [
        { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, link: '/master/wallet' },
        { label: 'Designer Earnings', value: `₹${stats.designerEarnings.toLocaleString()}`, link: '/master/designers' },
        { label: 'Manufacture Earnings', value: `₹${stats.mfgEarnings.toLocaleString()}`, link: '/master/wallet' },
        { label: 'Platform Earnings', value: `₹${stats.platformEarnings.toLocaleString()}`, link: '/master/wallet' },
    ];

    const statCards = [
        { label: 'Orders Completed', value: stats.ordersCompleted, icon: 'fas fa-check-circle', color: 'green' },
        { label: 'Global Orders', value: stats.globalOrders, icon: 'fas fa-globe', color: 'blue' },
        { label: 'Domestic Orders', value: stats.domesticOrders, icon: 'fas fa-flag', color: 'gold' },
        { label: 'Repeat Ratio', value: stats.repeatRatio, icon: 'fas fa-redo', color: 'purple' },
        { label: 'Designers Count', value: stats.designersCount, icon: 'fas fa-users', color: 'blue' },
        { label: 'Designs Count', value: stats.designsCount, icon: 'fas fa-palette', color: 'gold' },
        { label: 'Max Orders / Design', value: stats.maxOrdersPerDesign, icon: 'fas fa-crown', color: 'gold' },
        { label: 'Avg Orders / Design', value: stats.avgOrdersPerDesign, icon: 'fas fa-chart-bar', color: 'teal' },
        { label: 'Max Earning / Designer', value: `₹${stats.maxEarningPerDesigner.toLocaleString()}`, icon: 'fas fa-trophy', color: 'gold' },
        { label: 'Avg Earning / Designer', value: `₹${stats.avgEarningPerDesigner.toLocaleString()}`, icon: 'fas fa-coins', color: 'green' },
        { label: 'Orders In Progress', value: stats.ordersInProgress, icon: 'fas fa-spinner', color: 'blue' },
        { label: 'Global In-Progress', value: stats.globalInProgress, icon: 'fas fa-globe-americas', color: 'purple' },
        { label: 'Domestic In-Progress', value: stats.domesticInProgress, icon: 'fas fa-map-marker-alt', color: 'red' },
        { label: 'Avg Shipping (Global)', value: stats.avgShippingGlobal, icon: 'fas fa-plane', color: 'blue' },
        { label: 'Avg Shipping (Domestic)', value: stats.avgShippingDomestic, icon: 'fas fa-truck', color: 'teal' },
        { label: 'Support Tickets', value: stats.supportTickets, icon: 'fas fa-headset', color: 'red' },
        { label: 'Global Tickets', value: stats.globalTickets, icon: 'fas fa-globe', color: 'purple' },
        { label: 'Domestic Tickets', value: stats.domesticTickets, icon: 'fas fa-flag', color: 'gold' },
        { label: 'Tickets Ongoing', value: stats.ticketsOngoing, icon: 'fas fa-exclamation-circle', color: 'red' },
        { label: 'Tickets / 100 Orders', value: stats.ticketsPer100, icon: 'fas fa-percentage', color: 'teal' },
    ];

    if (error) {
        return (
            <main className="adm-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: 'var(--admin-danger)', marginBottom: 20 }}></i>
                <h2 style={{ fontFamily: 'Cinzel', letterSpacing: 2, marginBottom: 10 }}>Error Loading Dashboard</h2>
                <p style={{ fontFamily: 'Montserrat', fontSize: '0.9rem', color: 'var(--admin-muted)', marginBottom: 20 }}>{error}</p>
                <button onClick={() => window.location.reload()} className="adm-settings__btn" style={{ marginTop: 0 }}>Retry Fetching</button>
            </main>
        );
    }

    if (loading) {
        return (
            <main className="adm-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <style>{`
                    .adm-spinner {
                        width: 50px;
                        height: 50px;
                        border: 3px solid rgba(197, 160, 89, 0.1);
                        border-top: 3px solid #C5A059;
                        border-radius: 50%;
                        animation: admSpin 1s linear infinite;
                        margin-bottom: 20px;
                    }
                    @keyframes admSpin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
                <div className="adm-spinner"></div>
                <p style={{ fontFamily: 'Montserrat', fontSize: '0.75rem', letterSpacing: 2, color: 'var(--admin-gold)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Loading Real-time Metrics...
                </p>
            </main>
        );
    }

    return (
        <main className="adm-dash">
            <h1 className="adm-dash__title">MASTER DASHBOARD</h1>

            {/* Hero — Total Orders */}
            <div className="adm-dash__hero">
                <div>
                    <div className="adm-dash__hero-number">{stats.totalOrders.toLocaleString()}</div>
                    <div className="adm-dash__hero-label">Total Orders</div>
                </div>
                <div className="adm-dash__hero-badge">
                    <i className="fas fa-arrow-up" style={{ marginRight: 4 }}></i> +{stats.last24h} in 24 hrs
                </div>
            </div>

            {/* Revenue Row */}
            <div className="adm-dash__revenue">
                {revenueCards.map((c, i) => (
                    <div key={i} className="adm-dash__rev-card">
                        <div className="adm-dash__rev-label">{c.label}</div>
                        <div className="adm-dash__rev-value">{c.value}</div>
                        <Link to={c.link} className="adm-dash__rev-link">View More →</Link>
                    </div>
                ))}
            </div>

            {/* Stats Grid */}
            <div className="adm-dash__stats">
                {statCards.map((c, i) => (
                    <div key={i} className="adm-dash__stat">
                        <div className={`adm-dash__stat-icon adm-dash__stat-icon--${c.color}`}>
                            <i className={c.icon}></i>
                        </div>
                        <div>
                            <div className="adm-dash__stat-label">{c.label}</div>
                            <div className="adm-dash__stat-value">{c.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="adm-dash__charts">
                <div className="adm-dash__chart-card">
                    <div className="adm-dash__chart-title">Earnings By Time Period</div>
                    <div className="adm-dash__chart-wrap"><canvas id="admChartLine"></canvas></div>
                </div>
                <div className="adm-dash__chart-card">
                    <div className="adm-dash__chart-title">Earnings By Country</div>
                    <div className="adm-dash__chart-wrap"><canvas id="admChartCountry"></canvas></div>
                </div>
                <div className="adm-dash__chart-card">
                    <div className="adm-dash__chart-title">Earnings By Domestic</div>
                    <div className="adm-dash__chart-wrap"><canvas id="admChartDomestic"></canvas></div>
                </div>
            </div>
        </main>
    );
}

export default MasterDashboard;
