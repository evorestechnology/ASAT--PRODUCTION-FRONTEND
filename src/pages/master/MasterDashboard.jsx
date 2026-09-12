import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api';
import { useToast, ToastContainer, TOAST_CSS } from '../../components/useToast';
import '../../styles/admin.css';

function MasterDashboard() {
    const { toasts, showToast } = useToast();
    const [reportRange, setReportRange] = useState('all');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const rawOrdersRef = useRef([]);
    const rawDesignersRef = useRef([]);
    const rawDesignsRef = useRef([]);
    const rawTicketsRef = useRef([]);
    const rawMfgRef = useRef([]);
    const [chartPeriod, setChartPeriod] = useState('monthly');
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
        domesticColors: ['#e0e0e0'],
        stateLabels: ['No Data'],
        stateData: [1],
        stateColors: ['#e0e0e0']
    });

    // Compute time series helper for Daily / Weekly / Monthly toggle
    const computeTimeSeries = (ordersList, period) => {
        const getOrderTime = (o) => (o.createdAt ? new Date(o.createdAt).getTime() : 0);
        const earningsByTime = {};
        ordersList.filter(o => o.status !== 'cancelled').forEach(o => {
            const time = getOrderTime(o);
            if (!time) return;
            const d = new Date(time);
            let key = '';
            let sortVal = 0;
            if (period === 'daily') {
                key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                sortVal = d.getTime();
            } else if (period === 'weekly') {
                const first = d.getDate() - d.getDay();
                const wStart = new Date(d.setDate(first));
                key = `Wk ${wStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
                sortVal = wStart.getTime();
            } else {
                const monthName = d.toLocaleString('default', { month: 'short' });
                const year = d.getFullYear();
                key = `${monthName} ${year}`;
                sortVal = d.getFullYear() * 100 + d.getMonth();
            }
            if (!earningsByTime[key]) {
                earningsByTime[key] = { amount: 0, sortVal };
            }
            earningsByTime[key].amount += (o.totalAmount || 0);
        });
        const sortedEntries = Object.entries(earningsByTime).sort((a, b) => a[1].sortVal - b[1].sortVal).slice(-12);
        return {
            labels: sortedEntries.length ? sortedEntries.map(e => e[0]) : ['No Data'],
            data: sortedEntries.length ? sortedEntries.map(e => e[1].amount) : [0]
        };
    };

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

                // Revenue allocations (strictly exclude cancelled orders)
                const activeOrders = orders.filter(o => o.status !== 'cancelled');
                const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                const designerEarnings = activeOrders.reduce((sum, o) => sum + (o.designerEarnings || 0), 0);
                const mfgEarnings = activeOrders.reduce((sum, o) => sum + (o.mfgEarnings || 0), 0);
                const platformEarnings = Math.max(0, totalRevenue - designerEarnings - mfgEarnings);

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

                rawOrdersRef.current = orders;
                const ts = computeTimeSeries(orders, chartPeriod);
                const lineLabels = ts.labels;
                const lineData = ts.data;

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

                // Bar Chart — earnings by Indian state
                const extractState = (address) => {
                    if (!address) return null;
                    // Try to extract state from address like "123 Street, City, State 400001" or "City, State, Country"
                    const parts = address.split(',').map(p => p.trim()).filter(Boolean);
                    if (parts.length >= 3) {
                        // State is typically second-to-last before pincode/country
                        // Find last part that looks like a state name (not all digits, not too short)
                        for (let i = parts.length - 1; i >= 1; i--) {
                            const part = parts[i].replace(/\d+/g, '').trim();
                            if (part.length > 3 && !/^\d+$/.test(parts[i])) {
                                return part;
                            }
                        }
                    }
                    if (parts.length >= 2) return parts[parts.length - 1].replace(/\d+/g, '').trim();
                    return null;
                };

                const stateEarnings = {};
                const domesticOrdersOnly = orders.filter(o => o.country?.toLowerCase() === 'india');
                domesticOrdersOnly.forEach(o => {
                    const state = extractState(o.address);
                    if (state && state.length > 2) {
                        const normalized = state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
                        stateEarnings[normalized] = (stateEarnings[normalized] || 0) + (o.totalAmount || 0);
                    }
                });

                const stateLabelsRaw = Object.keys(stateEarnings).sort((a, b) => stateEarnings[b] - stateEarnings[a]).slice(0, 12);
                let stateLabels = ['No Data'];
                let stateData = [1];
                let stateColors = ['#e0e0e0'];
                if (stateLabelsRaw.length > 0) {
                    stateLabels = stateLabelsRaw;
                    stateData = stateLabelsRaw.map(s => stateEarnings[s]);
                    const palette = ['#C5A059', '#A8803C', '#E5C180', '#564426', '#D4A849', '#8B6914', '#F0D080', '#7A5C20', '#C8963A', '#9B7030', '#E0B050', '#6B4F1A'];
                    stateColors = stateLabels.map((_, idx) => palette[idx % palette.length]);
                }

                setChartData({
                    lineLabels,
                    lineData,
                    countryLabels,
                    countryData,
                    countryColors,
                    domesticLabels,
                    domesticData,
                    domesticColors,
                    stateLabels,
                    stateData,
                    stateColors
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
                    taxAmount: Number(o.tax_amount || 0),
                    shippingAmount: Number(o.shipping_amount || 0),
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

                const manufacturers = (data.manufacturers || []).map(m => ({
                    id: m.id,
                    businessName: m.business_name || m.name || 'Manufacturing Facility',
                    username: m.username || 'mfg',
                    contact: m.contact || m.phone || '—',
                    email: m.email || '—',
                    status: m.status || 'active',
                    createdAt: m.created_at
                }));

                rawOrdersRef.current = orders;
                rawDesignersRef.current = designers;
                rawDesignsRef.current = designs;
                rawTicketsRef.current = tickets;
                rawMfgRef.current = manufacturers;

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

    // Recompute time series when period changes (daily / weekly / monthly)
    useEffect(() => {
        if (rawOrdersRef.current && rawOrdersRef.current.length > 0) {
            const ts = computeTimeSeries(rawOrdersRef.current, chartPeriod);
            setChartData(prev => ({
                ...prev,
                lineLabels: ts.labels,
                lineData: ts.data
            }));
        }
    }, [chartPeriod]);

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

        // Bar Chart — earnings by Indian state
        const ctx4 = document.getElementById('admChartStates');
        if (ctx4) {
            instances.push(new window.Chart(ctx4.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: chartData.stateLabels,
                    datasets: [{
                        label: 'Earnings (₹)',
                        data: chartData.stateData,
                        backgroundColor: chartData.stateColors,
                        borderRadius: 4,
                        borderSkipped: false
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return ` ₹${context.raw.toLocaleString()}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                callback: function(value) {
                                    return '₹' + (value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value);
                                },
                                font: { size: 9 }
                            },
                            grid: { color: 'rgba(0,0,0,0.04)' }
                        },
                        y: {
                            ticks: { font: { size: 10 } }
                        }
                    }
                }
            }));
        }

        return () => instances.forEach(c => c.destroy());
    }, [loading, chartData]);

    // ── Report Generation Engine ──
    const getFilteredOrders = () => {
        const list = rawOrdersRef.current || [];
        if (reportRange === 'all') return list;
        const now = new Date();
        let start = null;
        let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        if (reportRange === 'today') {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        } else if (reportRange === '7d') {
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (reportRange === '30d') {
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (reportRange === 'this_month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        } else if (reportRange === 'last_month') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        } else if (reportRange === 'custom') {
            start = customFrom ? new Date(customFrom + 'T00:00:00') : null;
            end = customTo ? new Date(customTo + 'T23:59:59') : null;
        }

        return list.filter(o => {
            const time = o.createdAt ? new Date(o.createdAt).getTime() : 0;
            if (!time) return true;
            if (start && time < start.getTime()) return false;
            if (end && time > end.getTime()) return false;
            return true;
        });
    };

    const downloadCSV = (filename, headers, rows) => {
        const csvContent = [
            headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
            ...rows.map(r => r.map(c => `"${String(c === null || c === undefined ? '' : c).replace(/"/g, '""')}"`).join(','))
        ].join('\r\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const generateOrdersReport = () => {
        const ordersList = getFilteredOrders();
        if (!ordersList.length) {
            showToast("No orders found for the selected date scope.", "warning");
            return;
        }
        const headers = [
            "Order ID", "Display ID", "Order Date", "Customer Name", "Contact", "Phone", "Country", "Shipping Address",
            "Item Count", "Items Summary", "Subtotal Excl GST (Rs)", "Tax / GST (Rs)", "Shipping Fee (Rs)",
            "Designer Royalties (Rs)", "Mfg Payout (Rs)", "Platform Margin (Rs)", "Total Amount (Rs)", "Status", "Tracking ID"
        ];
        const rows = ordersList.map(o => {
            const items = Array.isArray(o.items) ? o.items : [];
            const itemsSummary = items.map(i => `${i.name || 'Garment'} (Qty: ${i.qty || 1}, Sz: ${i.size || 'M'})`).join('; ');
            const tax = Number(o.taxAmount || 0);
            const subtotal = tax > 0 ? (o.totalAmount - tax) : Math.round(o.totalAmount / 1.18);
            return [
                o.id,
                o.orderId || o.id,
                o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : '—',
                o.customerName || 'Customer',
                o.contact || '',
                o.phone || '',
                o.country || 'India',
                (o.address || '').replace(/[\n\r]+/g, ' '),
                items.reduce((s, i) => s + (Number(i.qty) || 1), 0),
                itemsSummary,
                subtotal.toFixed(2),
                tax.toFixed(2),
                (o.shippingAmount || 0).toFixed(2),
                (o.designerEarnings || 0).toFixed(2),
                (o.mfgEarnings || 0).toFixed(2),
                (o.platformEarnings || 0).toFixed(2),
                (o.totalAmount || 0).toFixed(2),
                o.status,
                o.trackingId || '—'
            ];
        });
        downloadCSV(`ASAT_Orders_Master_Report_${reportRange}_${Date.now()}.csv`, headers, rows);
        showToast(`✅ Orders Report (${rows.length} rows) downloaded successfully!`, "success");
    };

    const generateFinancialReport = () => {
        const ordersList = getFilteredOrders();
        if (!ordersList.length) {
            showToast("No financial records found for the selected scope.", "warning");
            return;
        }
        const headers = [
            "Order ID", "Date", "Status", "Gross Revenue (Rs)", "Tax Collected (Rs)", "Net Sales Excl Tax (Rs)",
            "Designer Royalties (Rs)", "Mfg Production Settlements (Rs)", "Platform Net Margin (Rs)", "Margin %", "Destination Country"
        ];
        const rows = ordersList.map(o => {
            const tax = Number(o.taxAmount || 0);
            const netSales = tax > 0 ? (o.totalAmount - tax) : Math.round(o.totalAmount / 1.18);
            const marginPct = netSales > 0 ? (((o.platformEarnings || 0) / netSales) * 100).toFixed(1) + '%' : '0%';
            return [
                o.orderId || o.id,
                o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—',
                o.status,
                (o.totalAmount || 0).toFixed(2),
                tax.toFixed(2),
                netSales.toFixed(2),
                (o.designerEarnings || 0).toFixed(2),
                (o.mfgEarnings || 0).toFixed(2),
                (o.platformEarnings || 0).toFixed(2),
                marginPct,
                o.country || 'India'
            ];
        });
        downloadCSV(`ASAT_Financial_Margins_Report_${reportRange}_${Date.now()}.csv`, headers, rows);
        showToast(`✅ Financial Settlements Report (${rows.length} rows) downloaded!`, "success");
    };

    const generateGSTReport = () => {
        const ordersList = getFilteredOrders();
        if (!ordersList.length) {
            showToast("No orders found for GST statutory generation.", "warning");
            return;
        }
        const headers = [
            "Invoice No", "Order ID", "Invoice Date", "Customer Name", "Place of Supply", "Supply Nature",
            "Taxable Value (Rs)", "GST Rate", "CGST (Rs)", "SGST (Rs)", "IGST (Rs)", "Total GST (Rs)", "Shipping Fee (Rs)", "Total Invoice Amount (Rs)", "Filing Status"
        ];
        const rows = ordersList.map(o => {
            const isDom = (o.country || 'India').toLowerCase() === 'india';
            const addr = (o.address || '').toLowerCase();
            const isAP = addr.includes('andhra') || addr.includes('ap') || addr.includes('37');
            const isIntra = isDom && isAP;
            const tax = Number(o.taxAmount || 0);
            const taxable = tax > 0 ? (o.totalAmount - tax) : Math.round(o.totalAmount / 1.18);
            const totalGST = tax > 0 ? tax : Math.max(0, o.totalAmount - taxable);
            const cgst = isIntra ? (totalGST / 2) : 0;
            const sgst = isIntra ? (totalGST / 2) : 0;
            const igst = !isIntra ? totalGST : 0;
            const supplyNature = !isDom ? "Export / Zero-Rated" : isIntra ? "Intra-State Supply (CGST + SGST)" : "Inter-State Supply (IGST)";
            const placeOfSupply = isDom ? (isAP ? "Andhra Pradesh (37)" : "Other Indian State") : o.country || "International";
            return [
                `INV-${(o.orderId || o.id).slice(-8).toUpperCase()}`,
                o.orderId || o.id,
                o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—',
                o.customerName || 'Customer',
                placeOfSupply,
                supplyNature,
                taxable.toFixed(2),
                isDom ? "18%" : "0%",
                cgst.toFixed(2),
                sgst.toFixed(2),
                igst.toFixed(2),
                totalGST.toFixed(2),
                (o.shippingAmount || 0).toFixed(2),
                (o.totalAmount || 0).toFixed(2),
                o.status === 'completed' ? 'Realized / Filed' : 'Pending Realization'
            ];
        });
        downloadCSV(`ASAT_GST_Statutory_Compliance_Report_${reportRange}_${Date.now()}.csv`, headers, rows);
        showToast(`✅ GST Statutory Compliance Report downloaded!`, "success");
    };

    const generateDesignerReport = () => {
        const designers = rawDesignersRef.current || [];
        if (!designers.length) {
            showToast("No designer records available.", "warning");
            return;
        }
        const headers = [
            "Designer ID", "Full Name", "Username", "Email", "Contact", "Global Rank", "Leaderboard Points",
            "Catalog Designs Count", "Total Lifetime Royalties (Rs)", "Account Status", "Joined Date"
        ];
        const rows = designers.map(d => [
            d.id,
            d.fullName || '—',
            d.username || '—',
            d.email || '—',
            d.contact || '—',
            d.rank !== '-' ? `#${d.rank}` : '—',
            d.points || 0,
            d.designsCount || 0,
            (d.totalEarnings || 0).toFixed(2),
            d.status || 'active',
            d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN') : '—'
        ]);
        downloadCSV(`ASAT_Designer_Performance_Report_${Date.now()}.csv`, headers, rows);
        showToast(`✅ Designer Ecosystem Report downloaded!`, "success");
    };

    const generateMfgReport = () => {
        const mfgList = rawMfgRef.current || [];
        const ordersList = rawOrdersRef.current || [];
        const headers = [
            "Manufacturer ID", "Facility Name", "Username", "Contact", "Email",
            "Total Assigned Orders", "In-Progress Production Units", "Completed Units", "Lifetime Settlement Earnings (Rs)", "Status"
        ];
        const baseList = mfgList.length ? mfgList : [{ id: 'mfg-default', businessName: 'Primary Manufacturing Facility', username: 'asat_factory', contact: '—', email: '—', status: 'active' }];
        const rows = baseList.map(m => {
            const mOrders = ordersList.filter(o => o.mfgId === m.id);
            const inProg = mOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
            const comp = mOrders.filter(o => o.status === 'completed').length;
            const earnings = mOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.mfgEarnings || 0), 0);
            return [
                m.id,
                m.businessName || 'Facility',
                m.username || 'mfg',
                m.contact || '—',
                m.email || '—',
                mOrders.length,
                inProg,
                comp,
                earnings.toFixed(2),
                m.status || 'active'
            ];
        });
        downloadCSV(`ASAT_Manufacturer_Production_Report_${Date.now()}.csv`, headers, rows);
        showToast(`✅ Manufacturer Production Report downloaded!`, "success");
    };

    const generateSupportReport = () => {
        const tickets = rawTicketsRef.current || [];
        if (!tickets.length) {
            showToast("No support tickets available.", "warning");
            return;
        }
        const headers = [
            "Ticket ID", "Created Date", "User / Customer ID", "Related Order ID", "Category", "Subject", "Status", "Description"
        ];
        const rows = tickets.map(t => [
            t.id,
            t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN') : '—',
            t.userId || '—',
            t.orderId || '—',
            t.category || 'General',
            t.subject || '—',
            t.status || 'open',
            (t.description || '').replace(/[\n\r]+/g, ' ')
        ]);
        downloadCSV(`ASAT_Support_Tickets_Report_${Date.now()}.csv`, headers, rows);
        showToast(`✅ Support & Issues Report downloaded!`, "success");
    };

    const generateCatalogReport = () => {
        const designs = rawDesignsRef.current || [];
        if (!designs.length) {
            showToast("No catalog designs found.", "warning");
            return;
        }
        const headers = [
            "Design ID", "Title", "Designer Username", "Collection", "Retail Price (Rs)", "Orders Count", "Lifetime Gross Sales (Rs)", "Review Status", "Created Date"
        ];
        const rows = designs.map(d => [
            d.id,
            d.title || 'Untitled',
            d.designerUsername || '—',
            d.collection || 'Default',
            (d.price || 0).toFixed(2),
            d.ordersCount || 0,
            (d.totalEarnings || 0).toFixed(2),
            d.status || 'active',
            d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN') : '—'
        ]);
        downloadCSV(`ASAT_Catalog_Inventory_Report_${Date.now()}.csv`, headers, rows);
        showToast(`✅ Catalog Inventory Report downloaded!`, "success");
    };

    const generateWithdrawalsReport = async () => {
        try {
            showToast("Fetching withdrawal records...", "info");
            const data = await apiFetch('/api/wallets/withdrawals/all');
            const list = Array.isArray(data) ? data : [];
            if (!list.length) {
                showToast("No withdrawal records found.", "warning");
                return;
            }
            const headers = [
                "Request ID", "User ID", "Username", "Role", "Amount (Rs)", "Status", "Rejection Reason", "Requested Date", "Processed Date", "Processed By"
            ];
            const rows = list.map(w => [
                w.id,
                w.userId || w.user_id || '—',
                w.username || 'User',
                (w.role || 'designer').toUpperCase(),
                Number(w.amount || 0).toFixed(2),
                (w.status || 'pending').toUpperCase(),
                w.rejectionReason || w.rejection_reason || '—',
                (w.createdAt || w.created_at) ? new Date(w.createdAt || w.created_at).toLocaleString('en-IN') : '—',
                (w.processedAt || w.processed_at) ? new Date(w.processedAt || w.processed_at).toLocaleString('en-IN') : '—',
                w.processedBy || w.processed_by || '—'
            ]);
            downloadCSV(`ASAT_Withdrawal_Payouts_Report_${Date.now()}.csv`, headers, rows);
            showToast(`✅ Withdrawal Payouts Report (${rows.length} rows) downloaded!`, "success");
        } catch (err) {
            console.error("Failed to generate withdrawals report:", err);
            showToast("Failed to fetch withdrawal records.", "error");
        }
    };

    const generateLogisticsReport = () => {
        const ordersList = getFilteredOrders();
        if (!ordersList.length) {
            showToast("No shipment records found for the selected scope.", "warning");
            return;
        }
        const headers = [
            "Order ID", "Display ID", "Order Date", "Customer Name", "Contact", "Phone", "Shipping Address", "Destination Country", "Fulfillment Status", "Tracking / AWB Number", "Total Value (Rs)"
        ];
        const rows = ordersList.map(o => [
            o.id,
            o.orderId || o.id,
            o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : '—',
            o.customerName || 'Customer',
            o.contact || '',
            o.phone || '',
            (o.address || '').replace(/[\n\r]+/g, ' '),
            o.country || 'India',
            (o.status || 'confirmed').toUpperCase(),
            o.trackingId || 'Pending Dispatch',
            (o.totalAmount || 0).toFixed(2)
        ]);
        downloadCSV(`ASAT_Logistics_Fulfillment_Report_${reportRange}_${Date.now()}.csv`, headers, rows);
        showToast(`✅ Logistics & Fulfillment Report (${rows.length} rows) downloaded!`, "success");
    };

    const generateLedgerReport = async () => {
        try {
            showToast("Fetching financial ledger...", "info");
            const data = await apiFetch('/api/wallets/admin-stats');
            const ledger = (data && Array.isArray(data.ledger)) ? data.ledger : [];
            if (!ledger.length) {
                showToast("No ledger records found.", "warning");
                return;
            }
            const headers = [
                "Order ID", "Date", "Order Status", "Gross Revenue (Rs)", "Designer Royalties (Rs)", "Manufacturer Payout (Rs)", "Platform Profit (Rs)", "Escrow / Settlement State"
            ];
            const rows = ledger.map(item => [
                item.orderId || item.id,
                item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '—',
                item.status || '—',
                (item.revenue || 0).toFixed(2),
                (item.designerEarnings || 0).toFixed(2),
                (item.mfgEarnings || 0).toFixed(2),
                (item.platformEarnings || 0).toFixed(2),
                item.status === 'completed' ? 'SETTLED & DISBURSED' : 'HELD IN ESCROW (IN PROGRESS)'
            ]);
            downloadCSV(`ASAT_Settlement_Ledger_Report_${Date.now()}.csv`, headers, rows);
            showToast(`✅ Financial Settlement Ledger (${rows.length} rows) downloaded!`, "success");
        } catch (err) {
            console.error("Failed to generate ledger report:", err);
            showToast("Failed to fetch settlement ledger.", "error");
        }
    };

    const generateAuditSummaryReport = () => {
        const ordersList = getFilteredOrders();
        const grossRev = ordersList.reduce((s, o) => s + (o.totalAmount || 0), 0);
        const designerR = ordersList.reduce((s, o) => s + (o.designerEarnings || 0), 0);
        const mfgP = ordersList.reduce((s, o) => s + (o.mfgEarnings || 0), 0);
        const platP = ordersList.reduce((s, o) => s + (o.platformEarnings || 0), 0);
        const taxTotal = ordersList.reduce((s, o) => s + (o.taxAmount || (o.totalAmount - Math.round(o.totalAmount / 1.18))), 0);
        const compOrders = ordersList.filter(o => o.status === 'completed').length;
        const inProgOrders = ordersList.filter(o => ['confirmed', 'manufacturing', 'shipping'].includes(o.status)).length;
        const domOrders = ordersList.filter(o => (o.country || 'India').toLowerCase() === 'india').length;
        const globOrders = ordersList.length - domOrders;

        const headers = ["Executive Metric Category", "Parameter Name", "Value / Statistic", "Description / Accounting Note"];
        const rows = [
            ["Financial Performance", "Gross Platform Volume", `₹${grossRev.toLocaleString('en-IN')}`, "Total transactional volume before tax deductions"],
            ["Financial Performance", "Platform Net Margin", `₹${platP.toLocaleString('en-IN')}`, "Realized gross margin retained by platform"],
            ["Financial Performance", "Designer Royalty Outflows", `₹${designerR.toLocaleString('en-IN')}`, "Cumulative royalty payable to creator network"],
            ["Financial Performance", "Manufacturer Production Payouts", `₹${mfgP.toLocaleString('en-IN')}`, "Cost of goods manufactured and fulfillment fees"],
            ["Tax & Statutory", "Total Estimated GST (18%)", `₹${taxTotal.toLocaleString('en-IN')}`, "Statutory tax liability computed across orders"],
            ["Order Logistics", "Total Orders Recorded", `${ordersList.length}`, "Total transactions within chosen date window"],
            ["Order Logistics", "Completed & Delivered", `${compOrders}`, "Successfully fulfilled orders"],
            ["Order Logistics", "Active Fulfillment Pipeline", `${inProgOrders}`, "Orders currently in production or courier transit"],
            ["Geography", "Domestic Orders (India)", `${domOrders}`, "Domestic Indian shipments"],
            ["Geography", "Global Orders", `${globOrders}`, "Cross-border international shipments"],
            ["Ecosystem", "Active Registered Designers", `${rawDesignersRef.current.length}`, "Approved creator profiles"],
            ["Ecosystem", "Catalog Garment Designs", `${rawDesignsRef.current.length}`, "Published active apparel designs"],
            ["Ecosystem", "Support Tickets Logged", `${rawTicketsRef.current.length}`, "Customer inquiries and ticket volume"],
            ["Scope Metadata", "Date Scope Filter", reportRange.toUpperCase(), customFrom && customTo ? `${customFrom} to ${customTo}` : "Selected preset range"],
            ["Scope Metadata", "Report Generation Timestamp", new Date().toLocaleString('en-IN'), "System execution time (IST)"]
        ];
        downloadCSV(`ASAT_Executive_Platform_Audit_Summary_${reportRange}_${Date.now()}.csv`, headers, rows);
        showToast(`✅ Executive Audit Summary Report downloaded!`, "success");
    };

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
            {/* Page Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
                <div>
                    <h1 className="adm-page__title" style={{ margin: 0, fontSize: '1.45rem' }}>Executive Master Overview</h1>
                    <p className="adm-page__subtitle" style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>
                        Real-time platform operations, financial allocations, manufacturing logistics, and designer network performance.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        background: '#ffffff',
                        border: '1px solid var(--admin-border)',
                        padding: '6px 14px',
                        borderRadius: 100,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#16a34a',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
                        Live Synced
                    </div>
                </div>
            </div>

            {/* Top Row: 3 Executive KPI Cards */}
            <div className="adm-dash__kpi-grid">
                {/* 1. Financial Overview */}
                <div className="adm-dash__kpi-card">
                    <div>
                        <div className="adm-dash__kpi-head">
                            <span className="adm-dash__kpi-title">
                                <span className="adm-dash__kpi-icon" style={{ background: '#fefce8', color: '#ca8a04' }}>
                                    <i className="fas fa-coins"></i>
                                </span>
                                Financial Overview
                            </span>
                            <Link to="/master/wallet" className="adm-dash__rev-link" style={{ margin: 0 }}>Wallets →</Link>
                        </div>
                        <div className="adm-dash__kpi-value">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
                        <div className="adm-dash__kpi-subtitle">Gross Platform Volume</div>
                    </div>
                    <div className="adm-dash__kpi-metrics">
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Designer Royalties</span>
                            <span className="adm-dash__kpi-metric-val">₹{stats.designerEarnings.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Mfg Payouts</span>
                            <span className="adm-dash__kpi-metric-val">₹{stats.mfgEarnings.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Platform Margin</span>
                            <span className="adm-dash__kpi-metric-val" style={{ color: '#16a34a' }}>₹{stats.platformEarnings.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Repeat Customer</span>
                            <span className="adm-dash__kpi-metric-val">{stats.repeatRatio}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Order Operations */}
                <div className="adm-dash__kpi-card">
                    <div>
                        <div className="adm-dash__kpi-head">
                            <span className="adm-dash__kpi-title">
                                <span className="adm-dash__kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                    <i className="fas fa-shopping-bag"></i>
                                </span>
                                Order Operations
                            </span>
                            {stats.last24h > 0 && (
                                <span className="adm-dash__kpi-badge adm-dash__kpi-badge--green">
                                    <i className="fas fa-arrow-up"></i> +{stats.last24h} in 24h
                                </span>
                            )}
                        </div>
                        <div className="adm-dash__kpi-value">{stats.totalOrders.toLocaleString('en-IN')}</div>
                        <div className="adm-dash__kpi-subtitle">Total Orders Processed</div>
                    </div>
                    <div className="adm-dash__kpi-metrics">
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Completed</span>
                            <span className="adm-dash__kpi-metric-val" style={{ color: '#16a34a' }}>{stats.ordersCompleted.toLocaleString()}</span>
                        </div>
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">In Progress</span>
                            <span className="adm-dash__kpi-metric-val" style={{ color: '#2563eb' }}>{stats.ordersInProgress.toLocaleString()}</span>
                        </div>
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Domestic (India)</span>
                            <span className="adm-dash__kpi-metric-val">{stats.domesticOrders.toLocaleString()}</span>
                        </div>
                        <div className="adm-dash__kpi-metric-label">
                            <span className="adm-dash__kpi-metric-label">Global Reach</span>
                            <span className="adm-dash__kpi-metric-val">{stats.globalOrders.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Logistics & Transit */}
                <div className="adm-dash__kpi-card">
                    <div>
                        <div className="adm-dash__kpi-head">
                            <span className="adm-dash__kpi-title">
                                <span className="adm-dash__kpi-icon" style={{ background: '#f0fdfa', color: '#0d9488' }}>
                                    <i className="fas fa-truck"></i>
                                </span>
                                Logistics Velocity
                            </span>
                            <Link to="/master/delivery" className="adm-dash__rev-link" style={{ margin: 0 }}>Logistics →</Link>
                        </div>
                        <div className="adm-dash__kpi-value">{stats.ordersInProgress} In Pipeline</div>
                        <div className="adm-dash__kpi-subtitle">Manufacturing & Transit Pipeline</div>
                    </div>
                    <div className="adm-dash__kpi-metrics">
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Avg Shipping (Dom)</span>
                            <span className="adm-dash__kpi-metric-val">{stats.avgShippingDomestic}</span>
                        </div>
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Avg Shipping (Global)</span>
                            <span className="adm-dash__kpi-metric-val">{stats.avgShippingGlobal}</span>
                        </div>
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Dom In-Progress</span>
                            <span className="adm-dash__kpi-metric-val">{stats.domesticInProgress}</span>
                        </div>
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Global In-Progress</span>
                            <span className="adm-dash__kpi-metric-val">{stats.globalInProgress}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: 2 Executive KPI Cards */}
            <div className="adm-dash__kpi-grid adm-dash__kpi-grid--2col">
                {/* 4. Creator & Design Ecosystem */}
                <div className="adm-dash__kpi-card">
                    <div>
                        <div className="adm-dash__kpi-head">
                            <span className="adm-dash__kpi-title">
                                <span className="adm-dash__kpi-icon" style={{ background: '#faf5ff', color: '#9333ea' }}>
                                    <i className="fas fa-palette"></i>
                                </span>
                                Creator & Design Ecosystem
                            </span>
                            <Link to="/master/designers" className="adm-dash__rev-link" style={{ margin: 0 }}>Designers →</Link>
                        </div>
                        <div className="adm-dash__kpi-value">{stats.designersCount} <span style={{ fontSize: '1rem', fontFamily: 'Montserrat', color: 'var(--admin-muted)' }}>Designers</span></div>
                        <div className="adm-dash__kpi-subtitle">{stats.designsCount} Live Catalog Garment Designs</div>
                    </div>
                    <div className="adm-dash__kpi-metrics">
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Max Orders / Design</span>
                            <span className="adm-dash__kpi-metric-val">{stats.maxOrdersPerDesign}</span>
                        </div>
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Avg Orders / Design</span>
                            <span className="adm-dash__kpi-metric-val">{stats.avgOrdersPerDesign}</span>
                        </div>
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Top Designer Payout</span>
                            <span className="adm-dash__kpi-metric-val">₹{stats.maxEarningPerDesigner.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Avg Designer Payout</span>
                            <span className="adm-dash__kpi-metric-val">₹{stats.avgEarningPerDesigner.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                {/* 5. Support & Quality */}
                <div className="adm-dash__kpi-card">
                    <div>
                        <div className="adm-dash__kpi-head">
                            <span className="adm-dash__kpi-title">
                                <span className="adm-dash__kpi-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                                    <i className="fas fa-headset"></i>
                                </span>
                                Customer Support & Health
                            </span>
                            <span className="adm-dash__kpi-badge adm-dash__kpi-badge--gold">
                                {stats.ticketsPer100}% per 100 orders
                            </span>
                        </div>
                        <div className="adm-dash__kpi-value">{stats.supportTickets} <span style={{ fontSize: '1rem', fontFamily: 'Montserrat', color: 'var(--admin-muted)' }}>Tickets</span></div>
                        <div className="adm-dash__kpi-subtitle">{stats.ticketsOngoing} Currently Ongoing / Unresolved</div>
                    </div>
                    <div className="adm-dash__kpi-metrics">
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Domestic Inquiries</span>
                            <span className="adm-dash__kpi-metric-val">{stats.domesticTickets}</span>
                        </div>
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Global Inquiries</span>
                            <span className="adm-dash__kpi-metric-val">{stats.globalTickets}</span>
                        </div>
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Resolved / Closed</span>
                            <span className="adm-dash__kpi-metric-val" style={{ color: '#16a34a' }}>{Math.max(0, stats.supportTickets - stats.ticketsOngoing)}</span>
                        </div>
                        <div className="adm-dash__kpi-metric-item">
                            <span className="adm-dash__kpi-metric-label">Active Ratio</span>
                            <span className="adm-dash__kpi-metric-val">{stats.supportTickets > 0 ? ((stats.ticketsOngoing / stats.supportTickets) * 100).toFixed(0) : 0}% open</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="adm-dash__charts">
                <div className="adm-dash__chart-card">
                    <div className="adm-dash__chart-head">
                        <h3 className="adm-dash__chart-title">Revenue Velocity</h3>
                        <div className="adm-dash__toggle">
                            {['daily', 'weekly', 'monthly'].map(p => (
                                <button
                                    key={p}
                                    className={`adm-dash__toggle-btn ${chartPeriod === p ? 'active' : ''}`}
                                    onClick={() => setChartPeriod(p)}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="adm-dash__chart-wrap"><canvas id="admChartLine"></canvas></div>
                </div>
                <div className="adm-dash__chart-card">
                    <div className="adm-dash__chart-head">
                        <h3 className="adm-dash__chart-title">Revenue by Country</h3>
                    </div>
                    <div className="adm-dash__chart-wrap"><canvas id="admChartCountry"></canvas></div>
                </div>
                <div className="adm-dash__chart-card">
                    <div className="adm-dash__chart-head">
                        <h3 className="adm-dash__chart-title">Domestic vs Global Ratio</h3>
                    </div>
                    <div className="adm-dash__chart-wrap"><canvas id="admChartDomestic"></canvas></div>
                </div>
                <div className="adm-dash__chart-card" style={{ gridColumn: 'span 3' }}>
                    <div className="adm-dash__chart-head">
                        <h3 className="adm-dash__chart-title">Domestic Indian State Distribution</h3>
                        <span style={{ fontSize: '0.7rem', color: 'var(--admin-muted)', fontWeight: 600 }}>Top State Territories</span>
                    </div>
                    <div className="adm-dash__chart-wrap" style={{ height: 280 }}><canvas id="admChartStates"></canvas></div>
                </div>
            </div>

            {/* Executive Report & Export Center */}
            <section className="adm-reports-hub">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(197, 160, 89, 0.15)', color: 'var(--admin-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                                <i className="fas fa-file-invoice-dollar"></i>
                            </span>
                            <div>
                                <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--admin-text)' }}>
                                    Executive Report & Export Center
                                </h2>
                                <p style={{ margin: '3px 0 0', fontSize: '0.74rem', color: 'var(--admin-muted)' }}>
                                    Instant audit-ready CSV exports across all platform transactions, statutory taxes, creator payouts, and manufacturing velocity.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Date Scope Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Date Scope:</span>
                        <div className="adm-dash__toggle">
                            {[
                                { id: 'all', label: 'All Time' },
                                { id: 'today', label: 'Today' },
                                { id: '7d', label: '7 Days' },
                                { id: 'this_month', label: 'This Month' },
                                { id: 'last_month', label: 'Last Month' },
                                { id: 'custom', label: 'Custom' }
                            ].map(r => (
                                <button
                                    key={r.id}
                                    className={`adm-dash__toggle-btn ${reportRange === r.id ? 'active' : ''}`}
                                    onClick={() => setReportRange(r.id)}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        {reportRange === 'custom' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <input
                                    type="date"
                                    value={customFrom}
                                    onChange={e => setCustomFrom(e.target.value)}
                                    className="adm-search-input"
                                    style={{ width: 135, padding: '5px 10px', fontSize: '0.72rem' }}
                                />
                                <span style={{ color: 'var(--admin-muted)', fontSize: '0.72rem' }}>to</span>
                                <input
                                    type="date"
                                    value={customTo}
                                    onChange={e => setCustomTo(e.target.value)}
                                    className="adm-search-input"
                                    style={{ width: 135, padding: '5px 10px', fontSize: '0.72rem' }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Report Cards Grid (8 Core Platform Reports) */}
                <div className="adm-reports-grid">
                    {/* 1. Master Orders */}
                    <div className="adm-report-card">
                        <div>
                            <div className="adm-report-card__header">
                                <div className="adm-report-card__icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                    <i className="fas fa-shopping-bag"></i>
                                </div>
                                <span className="adm-report-card__badge">{getFilteredOrders().length} Orders</span>
                            </div>
                            <h3 className="adm-report-card__title">Orders Master Report</h3>
                            <p className="adm-report-card__desc">Complete transaction log with customer contact, line items, address, payment totals, courier tracking, and status.</p>
                        </div>
                        <div className="adm-report-card__actions">
                            <button onClick={generateOrdersReport} className="adm-report-card__btn">
                                <i className="fas fa-file-csv"></i> Download Orders CSV
                            </button>
                        </div>
                    </div>

                    {/* 2. Financial Margins & Settlements */}
                    <div className="adm-report-card">
                        <div>
                            <div className="adm-report-card__header">
                                <div className="adm-report-card__icon" style={{ background: '#fefce8', color: '#ca8a04' }}>
                                    <i className="fas fa-coins"></i>
                                </div>
                                <span className="adm-report-card__badge">Settlements</span>
                            </div>
                            <h3 className="adm-report-card__title">Financial Margins Report</h3>
                            <p className="adm-report-card__desc">Gross revenue, tax deductions, designer royalty liabilities, manufacturer payouts, and platform net profits.</p>
                        </div>
                        <div className="adm-report-card__actions">
                            <button onClick={generateFinancialReport} className="adm-report-card__btn">
                                <i className="fas fa-file-csv"></i> Download Financials CSV
                            </button>
                        </div>
                    </div>

                    {/* 3. GST Statutory Compliance */}
                    <div className="adm-report-card">
                        <div>
                            <div className="adm-report-card__header">
                                <div className="adm-report-card__icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                                    <i className="fas fa-receipt"></i>
                                </div>
                                <span className="adm-report-card__badge" style={{ color: '#16a34a', background: '#dcfce7' }}>Tax Statutory</span>
                            </div>
                            <h3 className="adm-report-card__title">GST Tax Statutory Report</h3>
                            <p className="adm-report-card__desc">Invoice IDs, place of supply, taxable base values, split CGST, SGST, IGST totals, and compliance status.</p>
                        </div>
                        <div className="adm-report-card__actions">
                            <button onClick={generateGSTReport} className="adm-report-card__btn adm-report-card__btn--gold">
                                <i className="fas fa-file-csv"></i> Export GST CSV
                            </button>
                            <Link to="/master/gst-report" className="adm-report-card__btn adm-report-card__btn--outline" title="Open Interactive Portal">
                                <i className="fas fa-external-link-alt"></i>
                            </Link>
                        </div>
                    </div>

                    {/* 4. Designer Royalties & Performance */}
                    <div className="adm-report-card">
                        <div>
                            <div className="adm-report-card__header">
                                <div className="adm-report-card__icon" style={{ background: '#faf5ff', color: '#9333ea' }}>
                                    <i className="fas fa-palette"></i>
                                </div>
                                <span className="adm-report-card__badge">{rawDesignersRef.current.length} Designers</span>
                            </div>
                            <h3 className="adm-report-card__title">Designer Royalties & Sales</h3>
                            <p className="adm-report-card__desc">Creator performance metrics, leaderboard points, catalog size, units sold, and cumulative royalties payable.</p>
                        </div>
                        <div className="adm-report-card__actions">
                            <button onClick={generateDesignerReport} className="adm-report-card__btn">
                                <i className="fas fa-file-csv"></i> Download Designers CSV
                            </button>
                        </div>
                    </div>

                    {/* 5. Manufacturer Production */}
                    <div className="adm-report-card">
                        <div>
                            <div className="adm-report-card__header">
                                <div className="adm-report-card__icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                                    <i className="fas fa-industry"></i>
                                </div>
                                <span className="adm-report-card__badge">Manufacturing</span>
                            </div>
                            <h3 className="adm-report-card__title">Manufacturer Production</h3>
                            <p className="adm-report-card__desc">Facility capacity, assigned production batches, in-progress vs delivered garments, and settlement balances.</p>
                        </div>
                        <div className="adm-report-card__actions">
                            <button onClick={generateMfgReport} className="adm-report-card__btn">
                                <i className="fas fa-file-csv"></i> Download Mfg CSV
                            </button>
                        </div>
                    </div>

                    {/* 6. Customer Support & Resolution */}
                    <div className="adm-report-card">
                        <div>
                            <div className="adm-report-card__header">
                                <div className="adm-report-card__icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                                    <i className="fas fa-headset"></i>
                                </div>
                                <span className="adm-report-card__badge">{rawTicketsRef.current.length} Tickets</span>
                            </div>
                            <h3 className="adm-report-card__title">Support Inquiries & Quality</h3>
                            <p className="adm-report-card__desc">Ticket logs, issue categories, customer references, ongoing resolution times, and quality flags.</p>
                        </div>
                        <div className="adm-report-card__actions">
                            <button onClick={generateSupportReport} className="adm-report-card__btn">
                                <i className="fas fa-file-csv"></i> Download Support CSV
                            </button>
                        </div>
                    </div>

                    {/* 7. Catalog & Inventory */}
                    <div className="adm-report-card">
                        <div>
                            <div className="adm-report-card__header">
                                <div className="adm-report-card__icon" style={{ background: '#f0fdfa', color: '#0d9488' }}>
                                    <i className="fas fa-tshirt"></i>
                                </div>
                                <span className="adm-report-card__badge">{rawDesignsRef.current.length} Designs</span>
                            </div>
                            <h3 className="adm-report-card__title">Catalog Garment Inventory</h3>
                            <p className="adm-report-card__desc">Live catalog designs, designer attribution, retail pricing tiers, units ordered, and lifetime gross sales.</p>
                        </div>
                        <div className="adm-report-card__actions">
                            <button onClick={generateCatalogReport} className="adm-report-card__btn">
                                <i className="fas fa-file-csv"></i> Download Catalog CSV
                            </button>
                        </div>
                    </div>

                    {/* 8. Payouts & Withdrawals */}
                    <div className="adm-report-card">
                        <div>
                            <div className="adm-report-card__header">
                                <div className="adm-report-card__icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                                    <i className="fas fa-money-check-alt"></i>
                                </div>
                                <span className="adm-report-card__badge">Payouts</span>
                            </div>
                            <h3 className="adm-report-card__title">Withdrawals & Payout Requests</h3>
                            <p className="adm-report-card__desc">Audit trail of all creator & manufacturer withdrawal requests, approval timestamps, and rejection rationales.</p>
                        </div>
                        <div className="adm-report-card__actions">
                            <button onClick={generateWithdrawalsReport} className="adm-report-card__btn">
                                <i className="fas fa-file-csv"></i> Download Payouts CSV
                            </button>
                        </div>
                    </div>

                    {/* 9. Logistics & Delivery Tracking */}
                    <div className="adm-report-card">
                        <div>
                            <div className="adm-report-card__header">
                                <div className="adm-report-card__icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                                    <i className="fas fa-truck"></i>
                                </div>
                                <span className="adm-report-card__badge">Logistics</span>
                            </div>
                            <h3 className="adm-report-card__title">Logistics & Shipping Tracking</h3>
                            <p className="adm-report-card__desc">Customer delivery destinations, consignee addresses, courier AWB tracking codes, and fulfillment timestamps.</p>
                        </div>
                        <div className="adm-report-card__actions">
                            <button onClick={generateLogisticsReport} className="adm-report-card__btn">
                                <i className="fas fa-file-csv"></i> Download Logistics CSV
                            </button>
                        </div>
                    </div>

                    {/* 10. Financial Escrow & Settlement Ledger */}
                    <div className="adm-report-card">
                        <div>
                            <div className="adm-report-card__header">
                                <div className="adm-report-card__icon" style={{ background: '#fffbeb', color: '#b45309' }}>
                                    <i className="fas fa-book"></i>
                                </div>
                                <span className="adm-report-card__badge">Ledger</span>
                            </div>
                            <h3 className="adm-report-card__title">Order Settlement Ledger</h3>
                            <p className="adm-report-card__desc">Granular order-by-order breakdown of escrow balances, designer payouts, mfg settlements, and realized platform profits.</p>
                        </div>
                        <div className="adm-report-card__actions">
                            <button onClick={generateLedgerReport} className="adm-report-card__btn">
                                <i className="fas fa-file-csv"></i> Download Ledger CSV
                            </button>
                        </div>
                    </div>

                    {/* 11. Executive Platform Audit Summary */}
                    <div className="adm-report-card" style={{ borderColor: 'rgba(197, 160, 89, 0.4)', background: 'linear-gradient(135deg, #ffffff 0%, #faf8f5 100%)' }}>
                        <div>
                            <div className="adm-report-card__header">
                                <div className="adm-report-card__icon" style={{ background: '#111114', color: '#C5A059' }}>
                                    <i className="fas fa-shield-alt"></i>
                                </div>
                                <span className="adm-report-card__badge" style={{ background: 'rgba(197, 160, 89, 0.2)', color: '#b45309' }}>Executive Audit</span>
                            </div>
                            <h3 className="adm-report-card__title">Executive Platform Audit</h3>
                            <p className="adm-report-card__desc">High-level multi-parameter platform audit consolidating revenue, tax liability, creator payouts, and fulfillment velocity.</p>
                        </div>
                        <div className="adm-report-card__actions">
                            <button onClick={generateAuditSummaryReport} className="adm-report-card__btn adm-report-card__btn--gold">
                                <i className="fas fa-download"></i> Download Audit Master CSV
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default MasterDashboard;
